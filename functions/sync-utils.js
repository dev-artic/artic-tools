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

function timestampDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

function buildNotionDifferences(remote, local) {
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
    const lastSynced = timestampDate(match.notionSync?.lastSyncedAt);
    const bothChanged = lastSynced && timestampDate(match.updatedAt) > lastSynced && new Date(item.notionLastEditedAt) > lastSynced;
    return { type: bothChanged ? 'conflict' : 'different', guestId: match.id, fields, local: localValues, remote: item };
  }).filter(Boolean);
  local.filter((item) => !item.archivedAt && !matchedLocalIds.has(item.id)).forEach((item) => differences.push({ type: 'tnt_only', guestId: item.id, local: comparableLocalGuest(item) }));
  return differences;
}

function responseText(answer) {
  return answer?.textAnswers?.answers?.map((item) => item.value).join('\n') || '';
}

function normalizeFormResponse(response, itemMap) {
  const answers = Object.entries(response.answers || {}).map(([questionId, answer]) => ({ questionId, title: itemMap.get(questionId) || questionId, value: responseText(answer) }));
  return {
    responseId: response.responseId,
    artistName: answers.find((item) => item.title.includes('아티스트 활동명'))?.value.trim() || '',
    respondentEmail: response.respondentEmail || null,
    submittedAt: response.lastSubmittedTime || response.createTime,
    answers,
  };
}

module.exports = { buildNotionDifferences, comparableLocalGuest, normalizeFormResponse, normalizeNotionGuest, notionProperties, notionStatusFromGuest, pipelineFromNotion, responseText };
