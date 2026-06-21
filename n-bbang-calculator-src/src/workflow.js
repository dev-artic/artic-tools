export const PHASES = [
  { id: 'casting', label: '섭외' },
  { id: 'scheduling', label: '일정 확정' },
  { id: 'booking', label: '대관·장비' },
  { id: 'questionnaire', label: '질문지' },
  { id: 'playlist', label: '플레이리스트 QA' },
  { id: 'shoot_package', label: '촬영 패키지' },
  { id: 'production', label: '촬영' },
  { id: 'post', label: 'POST' },
];

export const TASK_TEMPLATE_VERSION = 1;

export const TASK_TEMPLATES = [
  ['casting', 'appearance-confirmed', '출연 의사 및 계약 형태 확정'],
  ['scheduling', 'shoot-schedule', '촬영일과 촬영 시간 확정'],
  ['scheduling', 'call-times', '게스트·artic 콜타임 확정'],
  ['booking', 'studio-booking', '노브아 스튜디오 대관 확정'],
  ['booking', 'equipment-booking', '필요 장비 예약 확정'],
  ['questionnaire', 'questionnaire-sent', '사전 질문지 전달'],
  ['questionnaire', 'questionnaire-received', '질문지 답변 수령'],
  ['playlist', 'playlist-shared', 'Apple Music 플레이리스트 공유'],
  ['playlist', 'playlist-qa', '17곡 교차검증 완료'],
  ['shoot_package', 'audio-purchases', '필요 음원 구매 및 증빙'],
  ['shoot_package', 'typing-json', '타이핑 JSON 업로드'],
  ['production', 'shoot-complete', '촬영 완료'],
  ['production', 'backup-confirmed', '촬영본 이중 백업 확인'],
  ['post', 'rough-cut', '가편 전달 및 컨펌'],
  ['post', 'publish-date', '업로드일 확정'],
  ['post', 'youtube-collab', 'YouTube 공동작업자 링크 공유'],
  ['post', 'instagram-reel', 'Instagram Reel 포스팅'],
];

export function createTasks(episodeId, { completed = false, castingOnly = false } = {}) {
  return TASK_TEMPLATES.map(([phase, key, title], order) => ({
    id: `${episodeId}-${key}`,
    episodeId,
    phase,
    key,
    title,
    order,
    required: true,
    status: completed || (castingOnly && phase === 'casting') ? 'done' : 'todo',
    ownerId: null,
    dueAt: null,
    blockedReason: null,
    waiverReason: null,
    templateVersion: TASK_TEMPLATE_VERSION,
  }));
}

export function deriveEpisodeState(episode, tasks = [], now = new Date()) {
  const required = tasks.filter((task) => task.required !== false);
  const complete = required.filter((task) => ['done', 'waived'].includes(task.status));
  const phase = PHASES.find(({ id }) => required.some((task) => task.phase === id && !['done', 'waived'].includes(task.status)))?.id
    || (episode.lifecycleState === 'published' ? 'post' : PHASES.at(-1).id);
  const hasConflict = Boolean(episode.dataQuality?.some((item) => String(item).includes('conflict')));
  const blocked = required.some((task) => task.status === 'blocked');
  const overdue = required.some((task) => task.dueAt && !['done', 'waived'].includes(task.status) && new Date(task.dueAt) < now);
  const soon = required.some((task) => {
    if (!task.dueAt || ['done', 'waived'].includes(task.status)) return false;
    const distance = new Date(task.dueAt).getTime() - now.getTime();
    return distance >= 0 && distance <= 48 * 60 * 60 * 1000;
  });
  let health = 'on_track';
  if (episode.lifecycleState === 'published' || (required.length && complete.length === required.length)) health = 'complete';
  if (episode.lifecycleState === 'cancelled') health = 'cancelled';
  if (soon) health = 'at_risk';
  if (overdue) health = 'overdue';
  if (blocked) health = 'blocked';
  if (hasConflict) health = 'conflict';
  const nextTask = required
    .filter((task) => !['done', 'waived'].includes(task.status))
    .sort((a, b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999') || a.order - b.order)[0] || null;
  return {
    currentPhase: phase,
    progress: required.length ? Math.round((complete.length / required.length) * 100) : 0,
    health,
    nextTask,
  };
}

export function disparityFingerprint(episodeId, key, notionValue, tntValue) {
  return JSON.stringify([episodeId, key, notionValue ?? null, tntValue ?? null]);
}

export function deriveNotionDisparities(episode, guest, shootBatch = null, resolutions = []) {
  if (!guest?.sourceUrl?.includes('notion.com')) return [];
  const disparities = [];
  const add = (key, label, notionValue, tntValue, reason) => {
    if (notionValue == null || notionValue === '' || tntValue == null || tntValue === '' || String(notionValue) === String(tntValue)) return;
    const fingerprint = disparityFingerprint(episode.id, key, notionValue, tntValue);
    if (resolutions.some((item) => item.status === 'resolved' && item.fingerprint === fingerprint)) return;
    disparities.push({ key, label, notionValue, tntValue, reason, sourceUrl: guest.sourceUrl, fingerprint });
  };
  add('uploadDate', '업로드일', guest.plannedUploadDate, episode.publishedAt || episode.plannedUploadDate, episode.publishedAt ? 'Notion 예정일과 실제 공개일이 다릅니다.' : 'Notion 예정일과 TNT 운영일이 다릅니다.');
  add('sequence', '회차', guest.episodeAssignment?.sequence, episode.sequence, 'Notion 회차와 TNT 회차가 다릅니다.');
  add('shootDate', '촬영일', guest.plannedShootDate, shootBatch?.shootDate, 'Notion 촬영일과 촬영 배치일이 다릅니다.');
  if (guest.dataQuality?.includes('notion_status_stale')) {
    const currentStatus = episode.lifecycleState === 'cancelled' ? (episode.cancellationReason === 'footage_lost' ? '본편 취소 · 쇼츠 전환' : '제작 취소') : episode.lifecycleState === 'published' ? '공개 완료' : '제작 진행 중';
    add('status', '진행 상태', guest.notionStatus, currentStatus, 'Notion 상태가 현재 제작 처분을 반영하지 않습니다.');
  }
  return disparities;
}

export function parseTrackLines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [artist = '', ...titleParts] = line.split(/\s[-–—]\s/);
    return {
      questionNumber: index + 1,
      rawAnswer: line,
      artist: titleParts.length ? artist.trim() : '',
      title: titleParts.length ? titleParts.join(' - ').trim() : line,
      matchStatus: 'pending',
      purchaseStatus: 'not_reviewed',
    };
  });
}

export function isTaskTransitionValid(task, nextStatus, waiverReason = '') {
  if (!['todo', 'in_progress', 'blocked', 'done', 'waived'].includes(nextStatus)) return false;
  if (nextStatus === 'waived' && !waiverReason.trim()) return false;
  return Boolean(task);
}
