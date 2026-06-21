import test from 'node:test';
import assert from 'node:assert/strict';
import { createTasks, deriveEpisodeState, parseTrackLines } from './workflow.js';

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
