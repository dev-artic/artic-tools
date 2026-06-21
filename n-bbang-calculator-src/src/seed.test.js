import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedData, PUBLIC_EPISODES } from './seed.js';

test('seed contains the audited migration baseline', () => {
  const seed = buildSeedData();
  assert.equal(seed.guests.length, 27);
  assert.equal(PUBLIC_EPISODES.length, 7);
  assert.equal(seed.episodes.filter((item) => item.lifecycleState === 'published').length, 7);
  assert.equal(seed.episodes.length, 10);
});

test('Hong Isaac and Gongwon share an unconfirmed shoot batch', () => {
  const seed = buildSeedData();
  const hong = seed.episodes.find((item) => item.guestName === '홍이삭');
  const gong = seed.episodes.find((item) => item.guestName === '공원');
  assert.equal(hong.shootBatchId, gong.shootBatchId);
  const batch = seed.shootBatches.find((item) => item.id === hong.shootBatchId);
  assert.equal(batch.shootDate, null);
  assert.equal(batch.articCallTime, null);
  assert.deepEqual(batch.guestOrder, []);
});

test('Jo Kwon does not claim an episode sequence and keeps Shorts work', () => {
  const seed = buildSeedData();
  const episode = seed.episodes.find((item) => item.guestName === '조권');
  assert.equal(episode.sequence, null);
  assert.equal(episode.lifecycleState, 'cancelled');
  assert.equal(episode.cancellationReason, 'footage_lost');
  assert.equal(seed.deliverables.find((item) => item.episodeId === episode.id).type, 'shorts');
  assert.equal(seed.meetings.find((item) => item.episodeId === episode.id).scheduledAt, null);
  assert.equal(seed.tasks.filter((item) => item.episodeId === episode.id).every((item) => item.status === 'waived'), true);
});

test('EP.7 remains intentionally unassigned', () => {
  const seed = buildSeedData();
  assert.equal(seed.episodes.some((item) => item.sequence === 7), false);
  assert.equal(seed.episodes.find((item) => item.sequence === 8).sequenceState, 'provisional');
  assert.equal(seed.episodes.find((item) => item.sequence === 9).sequenceState, 'provisional');
});
