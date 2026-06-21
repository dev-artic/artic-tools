import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedData, PUBLIC_EPISODES } from './seed.js';
import { toFirebaseData } from './tntData.js';

test('Firebase bridge rebuilds plain objects in the parent realm', () => {
  function ParentObject() {}
  function ParentArray() {
    const array = [];
    Object.setPrototypeOf(array, ParentArray.prototype);
    return array;
  }
  ParentArray.prototype = Object.create(Array.prototype);
  const sentinel = Object.create({ fieldValue: true });
  const source = { nested: { value: 1 }, list: [{ value: 2 }], sentinel };
  const result = toFirebaseData(source, ParentObject, ParentArray);
  assert.equal(Object.getPrototypeOf(result), ParentObject.prototype);
  assert.equal(Object.getPrototypeOf(result.nested), ParentObject.prototype);
  assert.equal(Object.getPrototypeOf(result.list), ParentArray.prototype);
  assert.equal(Object.getPrototypeOf(result.list[0]), ParentObject.prototype);
  assert.equal(result.sentinel, sentinel);
});

test('Firebase bridge converts every array in the audited seed', () => {
  function ParentObject() {}
  function ParentArray() {
    const array = [];
    Object.setPrototypeOf(array, ParentArray.prototype);
    return array;
  }
  ParentArray.prototype = Object.create(Array.prototype);
  const seed = toFirebaseData(buildSeedData(), ParentObject, ParentArray);
  assert.equal(Object.getPrototypeOf(seed.guests), ParentArray.prototype);
  assert.equal(Object.getPrototypeOf(seed.guests[0].dataQuality), ParentArray.prototype);
  assert.equal(Object.getPrototypeOf(seed.shootBatches[0].guestIds), ParentArray.prototype);
  assert.equal(Object.getPrototypeOf(seed.shootBatches[0].guestOrder), ParentArray.prototype);
});

test('seed contains the audited migration baseline', () => {
  const seed = buildSeedData();
  assert.equal(seed.guests.length, 27);
  assert.equal(PUBLIC_EPISODES.length, 7);
  assert.equal(seed.episodes.filter((item) => item.lifecycleState === 'published').length, 7);
  assert.equal(seed.episodes.length, 10);
  assert.equal(seed.resources.find((item) => item.id === 'studio-novea').title, '노브아 스튜디오');
  assert.deepEqual(seed.reservations, []);
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

test('Hong Isaac and Gongwon are assigned provisional EP.7 and EP.8', () => {
  const seed = buildSeedData();
  assert.equal(seed.episodes.find((item) => item.sequence === 7).guestName, '홍이삭');
  assert.equal(seed.episodes.find((item) => item.sequence === 8).guestName, '공원');
  assert.equal(seed.episodes.find((item) => item.sequence === 7).sequenceState, 'provisional');
  assert.equal(seed.episodes.find((item) => item.sequence === 8).sequenceState, 'provisional');
  assert.equal(seed.episodes.some((item) => item.sequence === 9), false);
});
