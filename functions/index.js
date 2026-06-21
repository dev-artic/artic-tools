const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { google } = require('googleapis');

initializeApp();

const db = getFirestore();
const notionToken = defineSecret('NOTION_TOKEN');
const NOTION_DATA_SOURCE_ID = '2dcffc3c-3af5-80fe-977d-000b18b6ea06';
const GOOGLE_FORM_ID = '1FAIpQLSd4hZ6mfPYFkEw1WGUagoFeEPXRVz_WJlux5Wqu4iyUQREPYg';
const REGION = 'asia-northeast3';

async function requireTntAdmin(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  const profile = await db.doc(`users/${request.auth.uid}`).get();
  if (!profile.exists || profile.data()?.projects?.tnt !== 'admin') {
    throw new HttpsError('permission-denied', 'TNT 관리자만 실행할 수 있습니다.');
  }
  return request.auth.uid;
}

function notionText(property) {
  const values = property?.title || property?.rich_text || [];
  return values.map((item) => item.plain_text || item.text?.content || '').join('');
}

function normalizeNotionGuest(page) {
  const props = page.properties || {};
  return {
    notionPageId: page.id,
    notionLastEditedAt: page.last_edited_time,
    name: notionText(props['게스트 이름']),
    notionStatus: props['상태']?.status?.name || null,
    plannedShootDate: props['촬영 일자']?.date?.start || null,
    plannedUploadDate: props['업로드일']?.date?.start || null,
    notes: notionText(props['비고']),
    email: props['이메일']?.email || null,
    phone: props['연락처']?.phone_number || null,
    sourceUrl: page.url,
    archived: Boolean(page.archived || page.in_trash),
  };
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

function comparableLocalGuest(guest) {
  return {
    name: guest.name || '',
    notionStatus: guest.notionStatus || null,
    plannedShootDate: guest.plannedShootDate || null,
    plannedUploadDate: guest.plannedUploadDate || null,
    notes: guest.notes || '',
    email: guest.email || null,
    phone: guest.phone || null,
  };
}

function pipelineFromNotion(status) {
  return ({
    '컨택 전': 'candidate', '컨택 예정': 'contact_planned', '출연 문의': 'outreach_sent',
    '발송 완료': 'outreach_sent', '확인 및 답변 대기중': 'awaiting_response',
    '촬영 일정 조율중': 'scheduling', '섭외 완료': 'confirmed', '섭외 완료 + PPL': 'confirmed',
    '촬영 완료': 'published', '섭외 거절': 'declined', '유가 출연 거절': 'declined', '섭외 취소': 'cancelled',
  })[status] || 'candidate';
}

function notionStatusFromGuest(guest) {
  if (guest.notionStatus) return guest.notionStatus;
  if (guest.pipelineStatus === 'confirmed') return guest.commercialType === 'ppl' ? '섭외 완료 + PPL' : '섭외 완료';
  return ({ published: '촬영 완료', scheduling: '촬영 일정 조율중', awaiting_response: '확인 및 답변 대기중', outreach_sent: '발송 완료', contact_planned: '컨택 예정', candidate: '컨택 전', declined: '섭외 거절', cancelled: '섭외 취소', repurposing: '섭외 취소' })[guest.pipelineStatus] || '컨택 전';
}

function notionProperties(guest) {
  return {
    '게스트 이름': { title: [{ text: { content: guest.name || '' } }] },
    '상태': { status: { name: notionStatusFromGuest(guest) } },
    '촬영 일자': { date: guest.plannedShootDate ? { start: guest.plannedShootDate } : null },
    '업로드일': { date: guest.plannedUploadDate ? { start: guest.plannedUploadDate } : null },
    '비고': { rich_text: guest.notes ? [{ text: { content: guest.notes.slice(0, 1900) } }] : [] },
    '이메일': { email: guest.email || null },
    '연락처': { phone_number: guest.phone || null },
  };
}

exports.tntPreviewNotionSync = onCall({ region: REGION, secrets: [notionToken] }, async (request) => {
  const actorId = await requireTntAdmin(request);
  const remote = await fetchAllNotionGuests();
  const localSnapshot = await db.collection('projects/tnt/guestProspects').get();
  const local = localSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const localByPage = new Map(local.filter((item) => item.sourceUrl?.includes('notion.com')).map((item) => [item.sourceUrl.match(/[a-f0-9]{32}/)?.[0], item]));
  const matchedLocalIds = new Set();
  const differences = remote.map((item) => {
    const key = item.notionPageId.replaceAll('-', '');
    const match = localByPage.get(key);
    if (!match) return { type: 'notion_only', remote: item };
    matchedLocalIds.add(match.id);
    const localValues = comparableLocalGuest(match);
    const fields = Object.keys(localValues).filter((field) => JSON.stringify(localValues[field]) !== JSON.stringify(item[field] ?? null));
    if (!fields.length) return null;
    const bothChanged = match.notionSync?.lastSyncedAt
      && match.updatedAt?.toDate?.() > match.notionSync.lastSyncedAt.toDate?.()
      && new Date(item.notionLastEditedAt) > match.notionSync.lastSyncedAt.toDate?.();
    return { type: bothChanged ? 'conflict' : 'different', guestId: match.id, fields, local: localValues, remote: item };
  }).filter(Boolean);
  local.filter((item) => !item.archivedAt && !matchedLocalIds.has(item.id)).forEach((item) => {
    differences.push({ type: 'tnt_only', guestId: item.id, local: comparableLocalGuest(item) });
  });
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

function responseText(answer) {
  return answer?.textAnswers?.answers?.map((item) => item.value).join('\n') || '';
}

exports.tntSyncGoogleFormResponses = onCall({ region: REGION }, async (request) => {
  const actorId = await requireTntAdmin(request);
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/forms.body.readonly', 'https://www.googleapis.com/auth/forms.responses.readonly'] });
  const forms = google.forms({ version: 'v1', auth });
  const formResult = await forms.forms.get({ formId: GOOGLE_FORM_ID });
  const formResponses = [];
  let pageToken;
  do {
    const result = await forms.forms.responses.list({ formId: GOOGLE_FORM_ID, pageSize: 5000, pageToken });
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
    const answers = Object.entries(response.answers || {}).map(([questionId, answer]) => ({ questionId, title: itemMap.get(questionId) || questionId, value: responseText(answer) }));
    const artistName = answers.find((item) => item.title.includes('아티스트 활동명'))?.value.trim() || '';
    const candidates = guests.filter((guest) => [guest.name, ...(guest.aliases || [])].some((name) => name?.toLocaleLowerCase('ko-KR') === artistName.toLocaleLowerCase('ko-KR')));
    const guestId = candidates.length === 1 ? candidates[0].id : null;
    const episodeSnapshot = guestId ? await db.collection('projects/tnt/episodes').where('guestId', '==', guestId).where('archivedAt', '==', null).get() : null;
    const episodeId = episodeSnapshot?.size === 1 ? episodeSnapshot.docs[0].id : null;
    await ref.set({ responseId: response.responseId, guestId, episodeId, artistName, respondentEmail: response.respondentEmail || null, submittedAt: response.lastSubmittedTime || response.createTime, answers, matchStatus: guestId ? (episodeId ? 'matched' : 'guest_only') : 'unmatched', createdAt: FieldValue.serverTimestamp(), createdBy: actorId, archivedAt: null, version: 1, schemaVersion: 1 });
    imported += 1;
  }
  await db.collection('projects/tnt/syncRuns').add({ provider: 'google_forms', mode: 'manual', actorId, imported, createdAt: FieldValue.serverTimestamp() });
  return { imported, total: formResponses.length };
});
