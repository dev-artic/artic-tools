import test from 'node:test';
import assert from 'node:assert/strict';
import { createTasks, deriveEpisodeState, deriveNotionDisparities, disparityFingerprint, parseTrackLines } from './workflow.js';

test('published legacy episode is complete', () => {
  const tasks = createTasks('episode', { completed: true });
  const result = deriveEpisodeState({ lifecycleState: 'published', dataQuality: [] }, tasks);
  assert.equal(result.progress, 100);
  assert.equal(result.health, 'complete');
  assert.equal(result.nextTask, null);
});

test('health precedence keeps conflict above blocked and overdue', () => {
  const tasks = createTasks('episode');
  tasks[0].status = 'blocked';
  tasks[1].dueAt = '2020-01-01T00:00:00+09:00';
  const result = deriveEpisodeState({ lifecycleState: 'active', dataQuality: ['episode_conflict'] }, tasks, new Date('2026-06-21T00:00:00+09:00'));
  assert.equal(result.health, 'conflict');
});

test('track parser preserves order and artist-title split', () => {
  const result = parseTrackLines('Radiohead - Weird Fishes\nBjörk – Joga');
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(({ questionNumber, artist, title }) => ({ questionNumber, artist, title })), [
    { questionNumber: 1, artist: 'Radiohead', title: 'Weird Fishes' },
    { questionNumber: 2, artist: 'Björk', title: 'Joga' },
  ]);
});

test('Notion disparities include only concrete source differences', () => {
  const episode = { sequence: 1, publishedAt: '2026-02-11', lifecycleState: 'published' };
  const guest = { sourceUrl: 'https://app.notion.com/p/example', plannedUploadDate: '2026-01-21', episodeAssignment: { sequence: 1 }, notionStatus: '촬영 완료', dataQuality: ['planned_upload_differs_from_public'] };
  assert.deepEqual(deriveNotionDisparities(episode, guest).map((item) => item.key), ['uploadDate']);
});

test('stale Notion status exposes the current content disposition', () => {
  const episode = { sequence: null, lifecycleState: 'cancelled', cancellationReason: 'footage_lost' };
  const guest = { sourceUrl: 'https://app.notion.com/p/example', episodeAssignment: { sequence: null }, notionStatus: '섭외 완료 + PPL', dataQuality: ['notion_status_stale'] };
  const [status] = deriveNotionDisparities(episode, guest);
  assert.equal(status.key, 'status');
  assert.equal(status.tntValue, '본편 취소 · 쇼츠 전환');
});

test('a resolution hides only the exact disparity fingerprint', () => {
  const episode = { id: 'ep-1', sequence: 1, publishedAt: '2026-02-11', lifecycleState: 'published' };
  const guest = { sourceUrl: 'https://app.notion.com/p/example', plannedUploadDate: '2026-01-21', episodeAssignment: { sequence: 1 }, dataQuality: [] };
  const resolution = { status: 'resolved', fingerprint: disparityFingerprint('ep-1', 'uploadDate', '2026-01-21', '2026-02-11') };
  assert.equal(deriveNotionDisparities(episode, guest, null, [resolution]).length, 0);
  assert.equal(deriveNotionDisparities({ ...episode, publishedAt: '2026-02-12' }, guest, null, [resolution]).length, 1);
});
