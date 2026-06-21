import { buildSeedData } from './seed.js';
import { createTasks } from './workflow.js';

const PROJECT = 'tnt';
const COLLECTIONS = ['episodes', 'guestProspects', 'shootBatches', 'meetings', 'resources', 'reservations', 'partnerships', 'notifications', 'syncConflicts', 'questionnaireInbox'];
const ARCHIVABLE_COLLECTIONS = ['episodes', 'guestProspects', 'shootBatches', 'meetings', 'resources', 'reservations', 'partnerships'];

function demoMode() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname) && new URLSearchParams(window.location.search).has('demo');
}

function bridge() {
  try {
    return window.parent?.ArticAuth || window.ArticAuth || null;
  } catch {
    return window.ArticAuth || null;
  }
}

function requireBridge() {
  const authBridge = bridge();
  if (!authBridge?.db) throw new Error('포털 Firebase 연결을 찾을 수 없습니다. artic.live 포털에서 TNT를 열어주세요.');
  return authBridge;
}

function projectRef(db) {
  return db.collection('projects').doc(PROJECT);
}

function serverTimestamp() {
  return window.parent.firebase.firestore.FieldValue.serverTimestamp();
}

function inferContentType(file) {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ({ json: 'application/json', csv: 'text/csv', txt: 'text/plain', pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })[extension] || 'application/octet-stream';
}

export async function getSession() {
  if (demoMode()) return { profile: { uid: 'demo', displayName: 'Demo', projects: { tnt: 'member' } }, isAdmin: false, authBridge: null };
  const authBridge = requireBridge();
  await authBridge.ready();
  const profile = authBridge.getProfile();
  if (!profile || !authBridge.hasProject(PROJECT)) throw new Error('TNT 프로젝트 접근 권한이 없습니다.');
  return { profile, isAdmin: authBridge.hasRole(PROJECT, 'admin'), authBridge };
}

export function subscribeWorkspace(onChange, onError) {
  if (demoMode()) {
    const seed = buildSeedData();
    queueMicrotask(() => onChange({ ...Object.fromEntries(COLLECTIONS.map((name) => [name, []])), episodes: seed.episodes, guestProspects: seed.guests, shootBatches: seed.shootBatches, meetings: seed.meetings, resources: seed.resources, reservations: seed.reservations }));
    return () => {};
  }
  const authBridge = requireBridge();
  const db = authBridge.db();
  const state = Object.fromEntries(COLLECTIONS.map((name) => [name, []]));
  const loaded = new Set();
  const unsubs = COLLECTIONS.map((name) => projectRef(db).collection(name).where('archivedAt', '==', null).onSnapshot((snapshot) => {
    state[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    loaded.add(name);
    if (loaded.size === COLLECTIONS.length) onChange({ ...state });
  }, onError));
  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}

export function subscribeArchive(onChange, onError) {
  if (demoMode()) { queueMicrotask(() => onChange([])); return () => {}; }
  const db = requireBridge().db();
  const state = Object.fromEntries(ARCHIVABLE_COLLECTIONS.map((name) => [name, []]));
  const loaded = new Set();
  const unsubs = ARCHIVABLE_COLLECTIONS.map((name) => projectRef(db).collection(name).where('archivedAt', '!=', null).onSnapshot((snapshot) => {
    state[name] = snapshot.docs.map((doc) => ({ id: doc.id, collection: name, ...doc.data() }));
    loaded.add(name);
    if (loaded.size === ARCHIVABLE_COLLECTIONS.length) onChange(Object.values(state).flat());
  }, onError));
  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}

export function subscribeEpisodeTasks(episodeId, onChange, onError) {
  if (demoMode()) {
    queueMicrotask(() => onChange(buildSeedData().tasks.filter((task) => task.episodeId === episodeId)));
    return () => {};
  }
  const db = requireBridge().db();
  if (!episodeId) return () => {};
  return projectRef(db).collection('episodes').doc(episodeId).collection('tasks').orderBy('order').onSnapshot(
    (snapshot) => onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError,
  );
}

export function subscribeEpisodeCollection(episodeId, collection, onChange, onError) {
  if (demoMode()) {
    const seed = buildSeedData();
    const values = collection === 'deliverables' ? seed.deliverables.filter((item) => item.episodeId === episodeId) : [];
    queueMicrotask(() => onChange(values));
    return () => {};
  }
  const db = requireBridge().db();
  if (!episodeId) return () => {};
  return projectRef(db).collection('episodes').doc(episodeId).collection(collection).onSnapshot(
    (snapshot) => onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError,
  );
}

export async function mutateDocument(collection, id, patch, expectedVersion, action = 'update') {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 데이터를 수정할 수 있습니다.');
  const db = authBridge.db();
  const ref = projectRef(db).collection(collection).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('수정할 데이터를 찾을 수 없습니다.');
    const current = snapshot.data();
    if (expectedVersion != null && current.version !== expectedVersion) throw new Error('다른 관리자가 먼저 수정했습니다. 최신 데이터를 다시 확인해주세요.');
    const nextVersion = (current.version || 0) + 1;
    transaction.update(ref, { ...patch, version: nextVersion, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    const activity = projectRef(db).collection('activity').doc();
    transaction.set(activity, { entityType: collection, entityId: id, action, patch, fromVersion: current.version || 0, toVersion: nextVersion, actorId: profile.uid, createdAt: serverTimestamp() });
  });
}

export async function createDocument(collection, data) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 데이터를 추가할 수 있습니다.');
  const db = authBridge.db();
  const ref = data.id ? projectRef(db).collection(collection).doc(data.id) : projectRef(db).collection(collection).doc();
  const payload = { ...data, id: ref.id, version: 1, schemaVersion: 1, archivedAt: null, createdAt: serverTimestamp(), createdBy: profile.uid, updatedAt: serverTimestamp(), updatedBy: profile.uid };
  const batch = db.batch();
  batch.set(ref, payload);
  batch.set(projectRef(db).collection('activity').doc(), { entityType: collection, entityId: ref.id, action: 'create', toVersion: 1, actorId: profile.uid, createdAt: serverTimestamp() });
  await batch.commit();
  return ref.id;
}

export async function archiveDocument(collection, item) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 항목을 보관할 수 있습니다.');
  const db = authBridge.db();
  const root = projectRef(db);
  if (collection === 'guestProspects') {
    const linked = await root.collection('episodes').where('guestId', '==', item.id).where('archivedAt', '==', null).limit(1).get();
    if (!linked.empty) throw new Error('활성 에피소드가 연결된 게스트는 먼저 에피소드를 보관해야 합니다.');
  }
  const ref = root.collection(collection).doc(item.id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data().version !== item.version) throw new Error('항목이 먼저 변경되었습니다. 최신 데이터를 다시 확인해주세요.');
    if (collection === 'episodes' && item.sequenceState === 'verified' && item.sequence != null) {
      const claimKey = `season-1-${String(item.sequence).padStart(2, '0')}`;
      transaction.set(root.collection('sequenceClaims').doc(claimKey), { archivedAt: serverTimestamp(), archivedBy: profile.uid }, { merge: true });
    }
    transaction.update(ref, { archivedAt: serverTimestamp(), archivedBy: profile.uid, version: item.version + 1, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    transaction.set(root.collection('activity').doc(), { entityType: collection, entityId: item.id, action: 'archive', actorId: profile.uid, createdAt: serverTimestamp() });
  });
}

export async function restoreDocument(collection, item) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 항목을 복구할 수 있습니다.');
  const db = authBridge.db();
  const root = projectRef(db);
  const ref = root.collection(collection).doc(item.id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data().version !== item.version) throw new Error('항목이 먼저 변경되었습니다. 최신 데이터를 다시 확인해주세요.');
    if (collection === 'episodes' && item.sequenceState === 'verified' && item.sequence != null) {
      const claimKey = `season-1-${String(item.sequence).padStart(2, '0')}`;
      const claimRef = root.collection('sequenceClaims').doc(claimKey);
      const claim = await transaction.get(claimRef);
      if (claim.exists && !claim.data().archivedAt && claim.data().episodeId !== item.id) throw new Error('해당 회차를 다른 에피소드가 사용 중이라 복구할 수 없습니다.');
      transaction.set(claimRef, { episodeId: item.id, archivedAt: null, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    }
    transaction.update(ref, { archivedAt: null, archivedBy: null, version: item.version + 1, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    transaction.set(root.collection('activity').doc(), { entityType: collection, entityId: item.id, action: 'restore', actorId: profile.uid, createdAt: serverTimestamp() });
  });
}

export async function updateEpisodeTask(episodeId, task, patch) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 작업 상태를 수정할 수 있습니다.');
  if (patch.status === 'waived' && !String(patch.waiverReason || '').trim()) throw new Error('필수 작업 면제에는 사유가 필요합니다.');
  const db = authBridge.db();
  const ref = projectRef(db).collection('episodes').doc(episodeId).collection('tasks').doc(task.id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (!snapshot.exists || current.version !== (task.version || 1)) throw new Error('작업 상태가 변경되었습니다. 새로고침 후 다시 시도해주세요.');
    transaction.update(ref, { ...patch, version: (current.version || 1) + 1, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    transaction.set(projectRef(db).collection('activity').doc(), { entityType: 'task', entityId: task.id, episodeId, action: 'update', patch, actorId: profile.uid, createdAt: serverTimestamp() });
  });
}

export async function createEpisodeSubdocument(episodeId, collection, data) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 데이터를 추가할 수 있습니다.');
  const db = authBridge.db();
  const collectionRef = projectRef(db).collection('episodes').doc(episodeId).collection(collection);
  const ref = data.id ? collectionRef.doc(data.id) : collectionRef.doc();
  await ref.set({ ...data, id: ref.id, episodeId, version: 1, schemaVersion: 1, archivedAt: null, createdAt: serverTimestamp(), createdBy: profile.uid, updatedAt: serverTimestamp(), updatedBy: profile.uid });
  await projectRef(db).collection('activity').add({ entityType: collection, entityId: ref.id, episodeId, action: 'create', actorId: profile.uid, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateEpisodeSubdocument(episodeId, collection, item, patch) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 데이터를 수정할 수 있습니다.');
  const db = authBridge.db();
  const ref = projectRef(db).collection('episodes').doc(episodeId).collection(collection).doc(item.id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data().version !== (item.version || 1)) throw new Error('다른 변경사항이 먼저 저장되었습니다.');
    transaction.update(ref, { ...patch, version: (item.version || 1) + 1, updatedAt: serverTimestamp(), updatedBy: profile.uid });
  });
}

export async function createEpisodeFromGuest(guest) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 에피소드를 생성할 수 있습니다.');
  const db = authBridge.db();
  const episodeRef = projectRef(db).collection('episodes').doc();
  const batch = db.batch();
  batch.set(episodeRef, { id: episodeRef.id, guestId: guest.id, guestName: guest.name, title: '제목 미정', sequence: null, sequenceLabel: '회차 미정', sequenceState: 'unassigned', lifecycleState: 'active', shootBatchId: null, guestCallTime: null, plannedUploadDate: null, publishedAt: null, version: 1, schemaVersion: 1, archivedAt: null, createdAt: serverTimestamp(), createdBy: profile.uid, updatedAt: serverTimestamp(), updatedBy: profile.uid });
  createTasks(episodeRef.id, { castingOnly: ['confirmed', 'scheduling'].includes(guest.pipelineStatus) }).forEach((task) => batch.set(episodeRef.collection('tasks').doc(task.id), { ...task, version: 1, createdAt: serverTimestamp(), createdBy: profile.uid }));
  batch.update(projectRef(db).collection('guestProspects').doc(guest.id), { 'episodeAssignment.state': 'unassigned', version: (guest.version || 1) + 1, updatedAt: serverTimestamp(), updatedBy: profile.uid });
  await batch.commit();
  return episodeRef.id;
}

export async function assignEpisodeSequence(episode, sequence, sequenceState) {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 회차를 확정할 수 있습니다.');
  if (sequence != null && (!Number.isInteger(Number(sequence)) || Number(sequence) < 0)) throw new Error('회차는 0 이상의 정수여야 합니다.');
  if (!['unassigned', 'provisional', 'verified'].includes(sequenceState)) throw new Error('올바르지 않은 회차 상태입니다.');
  const numericSequence = sequence === '' || sequence == null ? null : Number(sequence);
  if (sequenceState === 'verified' && numericSequence == null) throw new Error('확정 회차에는 번호가 필요합니다.');
  const db = authBridge.db();
  const root = projectRef(db);
  const episodeRef = root.collection('episodes').doc(episode.id);
  const claimKey = numericSequence == null ? null : `season-1-${String(numericSequence).padStart(2, '0')}`;
  const oldClaimKey = episode.sequenceState === 'verified' && episode.sequence != null ? `season-1-${String(episode.sequence).padStart(2, '0')}` : null;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(episodeRef);
    if (!snapshot.exists || snapshot.data().version !== episode.version) throw new Error('에피소드가 먼저 변경되었습니다. 최신 데이터를 다시 확인해주세요.');
    if (sequenceState === 'verified') {
      const claimRef = root.collection('sequenceClaims').doc(claimKey);
      const claim = await transaction.get(claimRef);
      if (claim.exists && !claim.data().archivedAt && claim.data().episodeId !== episode.id) throw new Error('이미 다른 에피소드가 사용 중인 회차입니다.');
      transaction.set(claimRef, { episodeId: episode.id, archivedAt: null, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    }
    if (oldClaimKey && oldClaimKey !== claimKey) transaction.set(root.collection('sequenceClaims').doc(oldClaimKey), { archivedAt: serverTimestamp(), archivedBy: profile.uid }, { merge: true });
    transaction.update(episodeRef, { sequence: numericSequence, sequenceState, sequenceLabel: numericSequence == null ? '회차 미정' : `EP.${numericSequence}${sequenceState === 'provisional' ? ' (예정)' : ''}`, version: episode.version + 1, updatedAt: serverTimestamp(), updatedBy: profile.uid });
    transaction.set(root.collection('activity').doc(), { entityType: 'episodes', entityId: episode.id, action: 'assign_sequence', sequence: numericSequence, sequenceState, actorId: profile.uid, createdAt: serverTimestamp() });
  });
}

export async function initializeWorkspace() {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 초기 데이터를 구성할 수 있습니다.');
  const db = authBridge.db();
  const root = projectRef(db);
  const existing = await root.get();
  if (existing.exists && existing.data()?.initializedAt) return { skipped: true };
  const seed = buildSeedData();
  const writes = [];
  writes.push([root, { schemaVersion: 1, name: 'TASTING NOTE', initializedAt: serverTimestamp(), initializedBy: profile.uid, questionnaireFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd4hZ6mfPYFkEw1WGUagoFeEPXRVz_WJlux5Wqu4iyUQREPYg/viewform?usp=header' }]);
  seed.guests.forEach((item) => writes.push([root.collection('guestProspects').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid, updatedAt: serverTimestamp(), updatedBy: profile.uid }]));
  seed.episodes.forEach((item) => writes.push([root.collection('episodes').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid, updatedAt: serverTimestamp(), updatedBy: profile.uid }]));
  seed.shootBatches.forEach((item) => writes.push([root.collection('shootBatches').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  seed.resources.forEach((item) => writes.push([root.collection('resources').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  seed.reservations.forEach((item) => writes.push([root.collection('reservations').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  seed.meetings.forEach((item) => writes.push([root.collection('meetings').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  seed.deliverables.forEach((item) => writes.push([root.collection('episodes').doc(item.episodeId).collection('deliverables').doc(item.id), { ...item, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  seed.tasks.forEach((item) => writes.push([root.collection('episodes').doc(item.episodeId).collection('tasks').doc(item.id), { ...item, version: 1, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  PUBLIC_SEQUENCE_CLAIMS(seed.episodes).forEach(([key, episodeId]) => writes.push([root.collection('sequenceClaims').doc(key), { episodeId, createdAt: serverTimestamp(), createdBy: profile.uid }]));
  for (let index = 0; index < writes.length; index += 450) {
    const batch = db.batch();
    writes.slice(index, index + 450).forEach(([ref, data]) => batch.set(ref, data));
    await batch.commit();
  }
  return { skipped: false, counts: { guests: seed.guests.length, episodes: seed.episodes.length, tasks: seed.tasks.length } };
}

function PUBLIC_SEQUENCE_CLAIMS(episodes) {
  return episodes.filter((item) => item.sequenceState === 'verified').map((item) => [`season-1-${String(item.sequence).padStart(2, '0')}`, item.id]);
}

export async function uploadArtifact(episodeId, file, category = 'typing-json') {
  const { profile, isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 파일을 업로드할 수 있습니다.');
  if (file.size > 25 * 1024 * 1024) throw new Error('파일은 25MB 이하여야 합니다.');
  const storage = authBridge.storage?.();
  if (!storage) throw new Error('Firebase Storage 연결이 아직 활성화되지 않았습니다.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const artifactId = crypto.randomUUID();
  const path = `tnt/episodes/${episodeId}/${category}/${artifactId}-${safeName}`;
  const contentType = inferContentType(file);
  if (contentType === 'application/octet-stream') throw new Error('지원하지 않는 파일 형식입니다. JSON, CSV, PDF, 문서 또는 이미지를 업로드해주세요.');
  const checksumBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const checksumSha256 = [...new Uint8Array(checksumBuffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const snapshot = await storage.ref(path).put(file, { contentType, customMetadata: { episodeId, category, uploadedBy: profile.uid } });
  const downloadUrl = await snapshot.ref.getDownloadURL();
  const db = authBridge.db();
  await projectRef(db).collection('episodes').doc(episodeId).collection('artifacts').doc(artifactId).set({ id: artifactId, episodeId, category, name: file.name, path, downloadUrl, size: file.size, contentType, checksumSha256, version: 1, archivedAt: null, createdAt: serverTimestamp(), createdBy: profile.uid });
  return { id: artifactId, downloadUrl };
}

export async function callAdminFunction(name, data = {}) {
  const { isAdmin, authBridge } = await getSession();
  if (!isAdmin) throw new Error('TNT 관리자만 동기화를 실행할 수 있습니다.');
  const functions = authBridge.functions?.();
  if (!functions) throw new Error('Firebase Functions 연결이 아직 활성화되지 않았습니다.');
  const result = await functions.httpsCallable(name)(data);
  return result.data;
}
