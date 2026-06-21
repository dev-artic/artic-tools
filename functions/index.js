const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { google } = require('googleapis');
const { buildNotionDifferences, normalizeFormResponse, normalizeNotionGuest, notionProperties, notionStatusFromGuest, pipelineFromNotion } = require('./sync-utils');

initializeApp();

const db = getFirestore();
const notionToken = defineSecret('NOTION_TOKEN');
const googleFormId = defineSecret('TNT_GOOGLE_FORM_ID');
const NOTION_DATA_SOURCE_ID = '2dcffc3c-3af5-80fe-977d-000b18b6ea06';
const REGION = 'asia-northeast3';

async function requireTntAdmin(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  const profile = await db.doc(`users/${request.auth.uid}`).get();
  if (!profile.exists || profile.data()?.projects?.tnt !== 'admin') {
    throw new HttpsError('permission-denied', 'TNT 관리자만 실행할 수 있습니다.');
  }
  return request.auth.uid;
}

async function notionRequest(path, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${notionToken.value()}`,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new HttpsError('internal', `Notion API 오류 (${response.status})`);
  return response.json();
}

async function fetchAllNotionGuests() {
  const rows = [];
  let cursor;
  do {
    const body = cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 };
    const result = await notionRequest(`/data_sources/${NOTION_DATA_SOURCE_ID}/query`, { method: 'POST', body: JSON.stringify(body) });
    rows.push(...result.results.map(normalizeNotionGuest));
    cursor = result.has_more ? result.next_cursor : null;
  } while (cursor);
  return rows;
}

exports.tntPreviewNotionSync = onCall({ region: REGION, secrets: [notionToken] }, async (request) => {
  const actorId = await requireTntAdmin(request);
  const remote = await fetchAllNotionGuests();
  const localSnapshot = await db.collection('projects/tnt/guestProspects').get();
  const local = localSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const differences = buildNotionDifferences(remote, local);
  const run = db.collection('projects/tnt/syncRuns').doc();
  await run.set({ provider: 'notion', mode: 'preview', actorId, differenceCount: differences.length, createdAt: FieldValue.serverTimestamp() });
  return { runId: run.id, remoteCount: remote.length, differences };
});

exports.tntApplyNotionSync = onCall({ region: REGION, secrets: [notionToken] }, async (request) => {
  const actorId = await requireTntAdmin(request);
  const operations = Array.isArray(request.data?.operations) ? request.data.operations : [];
  if (operations.length > 100) throw new HttpsError('invalid-argument', '한 번에 100개 이하만 적용할 수 있습니다.');
  const results = [];
  for (const operation of operations) {
    if (!['import', 'export'].includes(operation.direction)) continue;
    if (operation.direction === 'import') {
      const allowed = ['name', 'notionStatus', 'plannedShootDate', 'plannedUploadDate', 'notes', 'email', 'phone'];
      const patch = Object.fromEntries(Object.entries(operation.values || {}).filter(([key]) => allowed.includes(key)));
      if (operation.guestId) {
        const ref = db.doc(`projects/tnt/guestProspects/${operation.guestId}`);
        if (!(await ref.get()).exists) continue;
        await ref.update({ ...patch, pipelineStatus: pipelineFromNotion(patch.notionStatus), version: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp(), updatedBy: actorId, 'notionSync.lastSyncedAt': FieldValue.serverTimestamp() });
        results.push({ guestId: operation.guestId, direction: 'import' });
      } else if (operation.values?.notionPageId) {
        const guestId = `notion-${operation.values.notionPageId.replaceAll('-', '')}`;
        await db.doc(`projects/tnt/guestProspects/${guestId}`).set({ ...patch, id: guestId, pipelineStatus: pipelineFromNotion(patch.notionStatus), episodeAssignment: { sequence: null, state: 'unassigned' }, aliases: [], ownerIds: [], commercialType: patch.notionStatus === '섭외 완료 + PPL' ? 'ppl' : 'undecided', sourceUrl: operation.values.sourceUrl, dataQuality: [], archivedAt: null, version: 1, schemaVersion: 1, createdAt: FieldValue.serverTimestamp(), createdBy: actorId, updatedAt: FieldValue.serverTimestamp(), updatedBy: actorId, notionSync: { lastSyncedAt: FieldValue.serverTimestamp() } });
        results.push({ guestId, direction: 'import', created: true });
      }
    } else {
      if (!operation.guestId) continue;
      const ref = db.doc(`projects/tnt/guestProspects/${operation.guestId}`);
      const localSnapshot = await ref.get();
      if (!localSnapshot.exists) continue;
      const guest = localSnapshot.data();
      let pageId = guest.sourceUrl?.match(/[a-f0-9]{32}/)?.[0];
      let sourceUrl = guest.sourceUrl;
      if (pageId) {
        await notionRequest(`/pages/${pageId}`, { method: 'PATCH', body: JSON.stringify({ properties: notionProperties(guest) }) });
      } else {
        const created = await notionRequest('/pages', { method: 'POST', body: JSON.stringify({ parent: { type: 'data_source_id', data_source_id: NOTION_DATA_SOURCE_ID }, properties: notionProperties(guest) }) });
        pageId = created.id;
        sourceUrl = created.url;
      }
      await ref.update({ sourceUrl, notionStatus: notionStatusFromGuest(guest), 'notionSync.lastSyncedAt': FieldValue.serverTimestamp(), 'notionSync.lastSyncedBy': actorId });
      results.push({ guestId: operation.guestId, direction: 'export', created: !guest.sourceUrl?.includes('notion.com') });
    }
  }
  await db.collection('projects/tnt/syncRuns').add({ provider: 'notion', mode: 'apply', actorId, operationCount: results.length, createdAt: FieldValue.serverTimestamp() });
  return { applied: results.length, results };
});

exports.tntSyncGoogleFormResponses = onCall({ region: REGION, secrets: [googleFormId] }, async (request) => {
  const actorId = await requireTntAdmin(request);
  const formId = googleFormId.value();
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/forms.body.readonly', 'https://www.googleapis.com/auth/forms.responses.readonly'] });
  const forms = google.forms({ version: 'v1', auth });
  const formResult = await forms.forms.get({ formId });
  const formResponses = [];
  let pageToken;
  do {
    const result = await forms.forms.responses.list({ formId, pageSize: 5000, pageToken });
    formResponses.push(...(result.data.responses || []));
    pageToken = result.data.nextPageToken;
  } while (pageToken);
  const itemMap = new Map((formResult.data.items || []).filter((item) => item.questionItem?.question).map((item) => [item.questionItem.question.questionId, item.title]));
  const guestSnapshot = await db.collection('projects/tnt/guestProspects').get();
  const guests = guestSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  let imported = 0;
  for (const response of formResponses) {
    const ref = db.doc(`projects/tnt/questionnaireInbox/${response.responseId}`);
    if ((await ref.get()).exists) continue;
    const normalized = normalizeFormResponse(response, itemMap);
    const { answers, artistName } = normalized;
    const candidates = guests.filter((guest) => [guest.name, ...(guest.aliases || [])].some((name) => name?.toLocaleLowerCase('ko-KR') === artistName.toLocaleLowerCase('ko-KR')));
    const guestId = candidates.length === 1 ? candidates[0].id : null;
    const episodeSnapshot = guestId ? await db.collection('projects/tnt/episodes').where('guestId', '==', guestId).where('archivedAt', '==', null).get() : null;
    const episodeId = episodeSnapshot?.size === 1 ? episodeSnapshot.docs[0].id : null;
    await ref.set({ ...normalized, guestId, episodeId, matchStatus: guestId ? (episodeId ? 'matched' : 'guest_only') : 'unmatched', createdAt: FieldValue.serverTimestamp(), createdBy: actorId, archivedAt: null, version: 1, schemaVersion: 1 });
    imported += 1;
  }
  await db.collection('projects/tnt/syncRuns').add({ provider: 'google_forms', mode: 'manual', actorId, imported, createdAt: FieldValue.serverTimestamp() });
  return { imported, total: formResponses.length };
});
