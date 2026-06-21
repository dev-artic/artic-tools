const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNotionDifferences, normalizeFormResponse, notionStatusFromGuest, pipelineFromNotion } = require('./sync-utils');

test('Notion status mapping remains reversible for operational states', () => {
  assert.equal(pipelineFromNotion('촬영 일정 조율중'), 'scheduling');
  assert.equal(pipelineFromNotion('섭외 완료 + PPL'), 'confirmed');
  assert.equal(notionStatusFromGuest({ pipelineStatus: 'confirmed', commercialType: 'ppl' }), '섭외 완료 + PPL');
  assert.equal(notionStatusFromGuest({ pipelineStatus: 'repurposing' }), '섭외 취소');
});

test('Notion diff identifies remote-only, local-only and conflicts', () => {
  const remote = [
    { notionPageId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', notionLastEditedAt: '2026-06-20T00:00:00Z', name: 'Changed', notionStatus: '발송 완료', plannedShootDate: null, plannedUploadDate: null, notes: '', email: null, phone: null },
    { notionPageId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', notionLastEditedAt: '2026-06-20T00:00:00Z', name: 'Remote only', notionStatus: '컨택 전', plannedShootDate: null, plannedUploadDate: null, notes: '', email: null, phone: null },
  ];
  const local = [
    { id: 'matched', sourceUrl: 'https://app.notion.com/p/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', name: 'Local changed', notionStatus: '컨택 전', updatedAt: '2026-06-19T00:00:00Z', notionSync: { lastSyncedAt: '2026-06-01T00:00:00Z' } },
    { id: 'local-only', sourceUrl: null, name: 'Local only', archivedAt: null },
  ];
  const result = buildNotionDifferences(remote, local);
  assert.equal(result.find((item) => item.guestId === 'matched').type, 'conflict');
  assert.equal(result.some((item) => item.type === 'notion_only'), true);
  assert.equal(result.some((item) => item.type === 'tnt_only'), true);
});

test('Google Form normalization preserves artist, email and all answers', () => {
  const response = { responseId: 'response-1', respondentEmail: 'artist@example.com', lastSubmittedTime: '2026-06-21T00:00:00Z', answers: {
    artist: { textAnswers: { answers: [{ value: 'Artist' }] } },
    q1: { textAnswers: { answers: [{ value: 'Radiohead - Weird Fishes' }] } },
  } };
  const result = normalizeFormResponse(response, new Map([['artist', '아티스트 활동명'], ['q1', '1. 첫 곡']]));
  assert.equal(result.artistName, 'Artist');
  assert.equal(result.respondentEmail, 'artist@example.com');
  assert.equal(result.answers.length, 2);
});
