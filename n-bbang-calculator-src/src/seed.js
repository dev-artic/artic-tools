import guestPipeline from '../../TNT_GUEST_PIPELINE.json' with { type: 'json' };
import { createTasks } from './workflow.js';

export const PUBLIC_EPISODES = [
  { id: 'pilot-crush', sequenceLabel: 'Pilot', sequence: 0, guestName: 'Crush', title: 'Pilot', publishedAt: '2025-12-31', youtubeId: 'ZfD84TkNXGw' },
  { id: 'ep-01-joo-hyelyn', sequenceLabel: 'EP.1', sequence: 1, guestName: '주혜린', title: 'Kindness is Timeless', publishedAt: '2026-02-11', youtubeId: 'CyLnWaJIEhw' },
  { id: 'ep-02-o3ohn', sequenceLabel: 'EP.2', sequence: 2, guestName: '오존 (O3ohn)', title: '불편함을 고집하는 낭만', publishedAt: '2026-02-27', youtubeId: 'qBF9UpEug_c' },
  { id: 'ep-03-sumin', sequenceLabel: 'EP.3', sequence: 3, guestName: '수민 (SUMIN)', title: '행복은 시차를 두고 다가온다', publishedAt: '2026-03-31', youtubeId: '7_0BYN3TUus' },
  { id: 'ep-04-park-moonchi', sequenceLabel: 'EP.4', sequence: 4, guestName: '박문치', title: '내가 나로서 솔직해지기', publishedAt: '2026-05-04', youtubeId: 'vhjjEAU6wRA' },
  { id: 'ep-05-memi', sequenceLabel: 'EP.5', sequence: 5, guestName: '매미 (MEMI)', title: 'Rock은 절대 죽지 않아', publishedAt: '2026-05-11', youtubeId: 'OawNyCoAHpc' },
  { id: 'ep-06-kang-jiwon', sequenceLabel: 'EP.6', sequence: 6, guestName: '강지원', title: '영원히 남을 하나의 멜로디를 향해', publishedAt: '2026-05-28', youtubeId: '3OyKOqX1tgU', dataQuality: ['public_date_conflict_2026-05-27_2026-05-28'] },
];

const PUBLIC_ONLY_GUESTS = [
  { id: 'public-crush', name: 'Crush', pipelineStatus: 'published', notionStatus: null, episodeAssignment: { sequence: 0, state: 'verified' }, sourceUrl: 'https://artic.live/projects/tasting-note/' },
  { id: 'public-kang-jiwon', name: '강지원', pipelineStatus: 'published', notionStatus: null, episodeAssignment: { sequence: 6, state: 'verified' }, sourceUrl: 'https://artic.live/projects/tasting-note/' },
];

function cleanGuest(guest) {
  return {
    ...guest,
    version: 1,
    schemaVersion: 1,
    archivedAt: null,
    aliases: [],
    ownerIds: [],
    nextContactAt: null,
  };
}

export function buildSeedData() {
  const guests = [...guestPipeline.guests, ...PUBLIC_ONLY_GUESTS].map(cleanGuest);
  const guestByName = new Map(guests.map((guest) => [guest.name, guest.id]));
  const episodes = PUBLIC_EPISODES.map((episode) => ({
    ...episode,
    guestId: guestByName.get(episode.guestName),
    lifecycleState: 'published',
    sequenceState: 'verified',
    shootBatchId: null,
    guestCallTime: null,
    appleMusicPlaylistUrl: null,
    questionnaireFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd4hZ6mfPYFkEw1WGUagoFeEPXRVz_WJlux5Wqu4iyUQREPYg/viewform?usp=header',
    version: 1,
    schemaVersion: 1,
    archivedAt: null,
  }));

  episodes.push(
    {
      id: 'future-hong-isaac', sequence: 8, sequenceLabel: 'EP.8 (예정)', sequenceState: 'provisional', guestId: 'notion-336ffc3c3af580ee956bed9945c04e04', guestName: '홍이삭', title: '제목 미정', lifecycleState: 'active', shootBatchId: 'shoot-batch-hong-gong-2026-07', guestCallTime: null, publishedAt: null, plannedUploadDate: '2026-08-15', version: 1, schemaVersion: 1, archivedAt: null, dataQuality: ['sequence_not_canonical', 'shoot_date_missing', 'shoot_time_missing'],
    },
    {
      id: 'future-gongwon', sequence: 9, sequenceLabel: 'EP.9 (예정)', sequenceState: 'provisional', guestId: 'notion-33bffc3c3af580928d78ceab7dc7f06a', guestName: '공원', title: '제목 미정', lifecycleState: 'active', shootBatchId: 'shoot-batch-hong-gong-2026-07', guestCallTime: null, publishedAt: null, plannedUploadDate: '2026-09-19', version: 1, schemaVersion: 1, archivedAt: null, dataQuality: ['sequence_not_canonical', 'shoot_date_missing', 'shoot_time_missing'],
    },
    {
      id: 'cancelled-jo-kwon', sequence: null, sequenceLabel: '회차 없음', sequenceState: 'unassigned', guestId: 'notion-336ffc3c3af580f4abc8edf05d9acfb3', guestName: '조권', title: '본편 제작 취소', lifecycleState: 'cancelled', shootBatchId: null, guestCallTime: null, publishedAt: null, plannedUploadDate: null, cancellationReason: 'footage_lost', version: 1, schemaVersion: 1, archivedAt: null, dataQuality: ['footage_lost'],
    },
  );

  const tasks = episodes.flatMap((episode) => createTasks(episode.id, {
    completed: episode.lifecycleState === 'published',
    castingOnly: episode.lifecycleState === 'active',
  }).map((task) => episode.lifecycleState === 'cancelled' ? {
    ...task,
    status: 'waived',
    waiverReason: '본편 취소: 촬영본 유실',
  } : task));

  return {
    guests,
    episodes,
    tasks,
    shootBatches: guestPipeline.shootBatches.map((batch) => ({ ...batch, version: 1, schemaVersion: 1, archivedAt: null })),
    meetings: [{ id: 'jo-kwon-shorts-planning', title: '조권 쇼츠 전환 회의', status: 'planned', scheduledAt: null, episodeId: 'cancelled-jo-kwon', deliverableId: 'jo-kwon-shorts', agenda: '촬영본 유실 이후 쇼츠 제작 범위와 소스 확정', version: 1, schemaVersion: 1, archivedAt: null }],
    deliverables: [{ id: 'jo-kwon-shorts', episodeId: 'cancelled-jo-kwon', type: 'shorts', status: 'planning', uploadDate: null, title: '조권 쇼츠', version: 1, schemaVersion: 1, archivedAt: null }],
  };
}
