import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Archive, Bell, BookOpen, CalendarCheck2, CalendarDays, CheckCircle2, ChevronRight,
  CircleDollarSign, Clapperboard, Cloud, ExternalLink, FileJson, FileText, FolderUp,
  LayoutDashboard, Link2, ListChecks, MapPinned, Menu, MessageSquareText, PanelLeftClose,
  PanelLeftOpen, Plus, RefreshCw, Search, Settings2, ShieldCheck, Users, X,
} from 'lucide-react';
import SettlementPanel from './SettlementPanel.jsx';
import { PHASES, deriveEpisodeState, deriveNotionDisparities, parseTrackLines } from './workflow.js';
import {
  archiveDocument, assignEpisodeSequence, callAdminFunction, createDocument, createEpisodeFromGuest, createEpisodeSubdocument,
  getSession, initializeWorkspace, mutateDocument, resolveNotionDisparity, restoreDocument, subscribeArchive, subscribeEpisodeCollection,
  subscribeEpisodeTasks, subscribeWorkspace, updateEpisodeSubdocument, updateEpisodeTask,
  uploadArtifact,
} from './tntData.js';

const NAV = [
  ['overview', '대시보드', LayoutDashboard, 'PROJECT'],
  ['episodes', '에피소드', Clapperboard, 'PROJECT'],
  ['guests', '게스트 파이프라인', Users, 'OPERATIONS'],
  ['schedule', '촬영 일정', CalendarDays, 'OPERATIONS'],
  ['resources', '장소 · 장비', MapPinned, 'OPERATIONS'],
  ['bookings', '대관 · 예약', CalendarCheck2, 'OPERATIONS'],
  ['finance', '비용 · 정산', CircleDollarSign, 'MANAGEMENT'],
  ['partnerships', 'PPL · 협찬', Link2, 'MANAGEMENT'],
  ['meetings', '회의 · 피드백', MessageSquareText, 'MANAGEMENT'],
  ['sync', '동기화 · 감사', RefreshCw, 'MANAGEMENT'],
  ['archive', '보관함', Archive, 'MANAGEMENT'],
  ['project', '프로젝트 문서', BookOpen, 'MANAGEMENT'],
];

const PIPELINE = [
  ['confirmed', '섭외 확정'], ['scheduling', '일정 조율'], ['awaiting_response', '답변 대기'],
  ['outreach_sent', '제안 발송'], ['contact_planned', '컨택 예정'], ['candidate', '후보'],
  ['repurposing', '파생 콘텐츠'], ['published', '공개 완료'], ['declined', '거절'], ['cancelled', '취소'],
];

const HEALTH = {
  conflict: ['충돌', 'danger'], blocked: ['차단', 'danger'], overdue: ['지연', 'warning'],
  at_risk: ['임박', 'warning'], on_track: ['정상', 'info'], complete: ['완료', 'success'], cancelled: ['본편 취소', 'muted'],
};

const EMPTY = { episodes: [], guestProspects: [], shootBatches: [], meetings: [], resources: [], reservations: [], partnerships: [], notifications: [], syncConflicts: [], questionnaireInbox: [] };

function formatDate(value, withTime = false) {
  if (!value) return '미정';
  const date = value?.toDate ? value.toDate() : new Date(String(value).length === 10 ? `${value}T00:00:00+09:00` : value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ko-KR', withTime ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function ErrorBanner({ error, onClose }) {
  if (!error) return null;
  return <div className="app-error"><AlertTriangle size={17} /><span>{error}</span><button onClick={onClose}><X size={16} /></button></div>;
}

function HealthBadge({ value }) {
  const [label, tone] = HEALTH[value] || HEALTH.on_track;
  return <span className={`health-badge ${tone}`}>{label}</span>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <section className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</section>;
}

function EmptyState({ title, description }) {
  return <div className="empty-panel"><Archive size={24} /><strong>{title}</strong><p>{description}</p></div>;
}

function useEpisodeData(episodeId, onError) {
  const [tasks, setTasks] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [financialEntries, setFinancialEntries] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  useEffect(() => {
    setTasks([]); setPlaylistTracks([]); setArtifacts([]); setFinancialEntries([]); setDeliverables([]);
    if (!episodeId) return undefined;
    const unsubs = [
      subscribeEpisodeTasks(episodeId, setTasks, onError),
      subscribeEpisodeCollection(episodeId, 'playlistTracks', setPlaylistTracks, onError),
      subscribeEpisodeCollection(episodeId, 'artifacts', setArtifacts, onError),
      subscribeEpisodeCollection(episodeId, 'financialEntries', setFinancialEntries, onError),
      subscribeEpisodeCollection(episodeId, 'deliverables', setDeliverables, onError),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [episodeId, onError]);
  return { tasks, playlistTracks, artifacts, financialEntries, deliverables };
}

function Dashboard({ workspace, taskCache, onOpenEpisode }) {
  const [query, setQuery] = useState('');
  const [showPublished, setShowPublished] = useState(false);
  const rows = workspace.episodes.map((episode) => {
    const guest = workspace.guestProspects.find((item) => item.id === episode.guestId);
    const batch = workspace.shootBatches.find((item) => item.id === episode.shootBatchId);
    const resolutions = workspace.syncConflicts.filter((item) => item.episodeId === episode.id);
    const hasNotionConflict = deriveNotionDisparities(episode, guest, batch, resolutions).length > 0;
    const healthEpisode = hasNotionConflict ? { ...episode, dataQuality: [...(episode.dataQuality || []), 'notion_discrepancy_conflict'] } : episode;
    return { episode, derived: deriveEpisodeState(healthEpisode, taskCache[episode.id] || []) };
  })
    .sort((a, b) => {
      const priority = { conflict: 0, blocked: 1, overdue: 2, at_risk: 3, on_track: 4, complete: 5 };
      return priority[a.derived.health] - priority[b.derived.health] || (a.episode.sequence ?? 999) - (b.episode.sequence ?? 999);
    });
  const active = rows.filter(({ episode }) => !['published', 'cancelled'].includes(episode.lifecycleState));
  const warnings = rows.filter(({ derived }) => ['conflict', 'blocked', 'overdue', 'at_risk'].includes(derived.health));
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const visibleRows = rows.filter(({ episode, derived }) => {
    const matches = !normalizedQuery || `${episode.sequenceLabel} ${episode.guestName} ${episode.title}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery);
    const needsAttention = ['conflict', 'blocked', 'overdue', 'at_risk'].includes(derived.health);
    return matches && (normalizedQuery || showPublished || episode.lifecycleState !== 'published' || needsAttention);
  });
  const collapsedPublishedCount = rows.filter(({ episode, derived }) => episode.lifecycleState === 'published' && !['conflict', 'blocked', 'overdue', 'at_risk'].includes(derived.health)).length;
  return <div className="page-stack">
    <section className="hero-card compact-hero"><div><span className="eyebrow">TASTING NOTE OPERATIONS</span><h2>제작 현황을 한눈에</h2><p>섭외부터 POST까지, 실제 완료 조건을 기준으로 다음 작업과 위험 신호를 계산합니다.</p></div><div className="hero-stats"><strong>{active.length}</strong><span>진행 회차</span></div></section>
    <section className="metric-grid">
      <article className="metric-card"><Clapperboard /><span>전체 제작 단위</span><strong>{rows.length}</strong></article>
      <article className="metric-card"><Users /><span>활성 게스트</span><strong>{workspace.guestProspects.filter((g) => !['published', 'declined', 'cancelled'].includes(g.pipelineStatus)).length}</strong></article>
      <article className="metric-card"><AlertTriangle /><span>확인 필요</span><strong>{warnings.length}</strong></article>
      <article className="metric-card"><CheckCircle2 /><span>공개 완료</span><strong>{rows.filter(({ episode }) => episode.lifecycleState === 'published').length}</strong></article>
    </section>
    <section className="panel matrix-panel">
      <div className="panel-heading"><div><span className="eyebrow">EPISODE MATRIX</span><h3>에피소드 진행 매트릭스</h3></div><span className="muted-copy">단계는 필수 작업에서 자동 계산</span></div>
      <div className="matrix-controls"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="회차, 게스트, 제목 검색" /></label>{collapsedPublishedCount > 0 && <button className="secondary-button" onClick={() => setShowPublished((value) => !value)}>{showPublished ? '공개 완료 접기' : `공개 완료 ${collapsedPublishedCount}편 펼치기`}</button>}</div>
      <div className="episode-matrix">
        <div className="matrix-head"><span>회차 / 게스트</span>{PHASES.map((phase) => <span key={phase.id}>{phase.label}</span>)}<span>다음 작업</span><span>상태</span></div>
        {visibleRows.map(({ episode, derived }) => {
          const tasks = taskCache[episode.id] || [];
          return <button className="matrix-row" key={episode.id} onClick={() => onOpenEpisode(episode.id)}>
            <span className="matrix-title"><strong>{episode.sequenceLabel}</strong><small>{episode.guestName}</small></span>
            {PHASES.map((phase) => {
              const phaseTasks = tasks.filter((task) => task.phase === phase.id);
              const done = phaseTasks.length && phaseTasks.every((task) => ['done', 'waived'].includes(task.status));
              const blocked = phaseTasks.some((task) => task.status === 'blocked');
              return <span key={phase.id} className={`phase-cell ${done ? 'done' : ''} ${blocked ? 'blocked' : ''}`} title={phase.label}>{done ? '✓' : blocked ? '!' : '·'}</span>;
            })}
            <span className="next-task">{derived.nextTask?.title || '완료'}<small>{derived.progress}%</small></span><HealthBadge value={derived.health} />
          </button>;
        })}
        {!visibleRows.length && <div className="matrix-empty">조건에 맞는 에피소드가 없습니다.</div>}
      </div>
    </section>
  </div>;
}

function EpisodeList({ episodes, selectedId, onSelect }) {
  return <aside className="record-list">
    {episodes.sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999)).map((episode) => <button key={episode.id} className={selectedId === episode.id ? 'active' : ''} onClick={() => onSelect(episode.id)}><span><strong>{episode.sequenceLabel}</strong><small>{episode.guestName}</small></span><ChevronRight size={16} /></button>)}
  </aside>;
}

function TaskPanel({ episode, tasks, isAdmin, onError }) {
  const [openPhases, setOpenPhases] = useState(() => new Set(PHASES.map((phase) => phase.id)));
  const change = async (task, status) => {
    const waiverReason = status === 'waived' ? window.prompt('필수 작업 면제 사유를 입력해주세요.') : null;
    if (status === 'waived' && !waiverReason?.trim()) return;
    try { await updateEpisodeTask(episode.id, task, { status, waiverReason: waiverReason || null, completedAt: status === 'done' ? new Date().toISOString() : null }); } catch (error) { onError(error.message); }
  };
  const togglePhase = (phaseId, open) => setOpenPhases((current) => { const next = new Set(current); if (open) next.add(phaseId); else next.delete(phaseId); return next; });
  return <section className="detail-section"><div className="section-title"><ListChecks size={18} /><div><strong>제작 워크플로우</strong><small>필수 작업 완료율과 현재 단계</small></div></div>
    <div className="phase-groups">{PHASES.map((phase) => { const phaseTasks = tasks.filter((task) => task.phase === phase.id); const completed = phaseTasks.filter((task) => ['done', 'waived'].includes(task.status)).length; return <details className="phase-group" key={phase.id} open={openPhases.has(phase.id)} onToggle={(event) => togglePhase(phase.id, event.currentTarget.open)}><summary><span>{phase.label}<small>{completed}/{phaseTasks.length}</small></span><ChevronRight size={15} /></summary>{phaseTasks.map((task) => <div className="task-row" key={task.id}><span className={`task-dot ${task.status}`} /><div><strong>{task.title}</strong><small>{task.waiverReason ? `면제: ${task.waiverReason}` : task.dueAt ? `기한 ${formatDate(task.dueAt)}` : '기한 미정'}</small></div><select disabled={!isAdmin} value={task.status} onChange={(event) => change(task, event.target.value)}><option value="todo">대기</option><option value="in_progress">진행 중</option><option value="blocked">차단</option><option value="done">완료</option><option value="waived">사유 면제</option></select></div>)}</details>; })}</div>
  </section>;
}

function EpisodeBasics({ episode, batches, isAdmin, onError }) {
  const [draft, setDraft] = useState(episode);
  useEffect(() => setDraft(episode), [episode]);
  const save = async () => { try { await mutateDocument('episodes', episode.id, { title: draft.title, plannedUploadDate: draft.plannedUploadDate || null, guestCallTime: draft.guestCallTime || null, shootBatchId: draft.shootBatchId || null, appleMusicPlaylistUrl: draft.appleMusicPlaylistUrl || null }, episode.version); } catch (error) { onError(error.message); } };
  const saveSequence = async () => { try { await assignEpisodeSequence(episode, draft.sequence, draft.sequenceState); } catch (error) { onError(error.message); } };
  const batch = batches.find((item) => item.id === episode.shootBatchId);
  return <section className="detail-section"><div className="section-title"><Settings2 size={18} /><div><strong>기본 정보와 일정</strong><small>공동 촬영일은 촬영 배치에서 관리</small></div></div>
    <div className="form-grid"><label className="wide">제목<input disabled={!isAdmin} value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>업로드일<input disabled={!isAdmin} type="date" value={draft.plannedUploadDate || ''} onChange={(e) => setDraft({ ...draft, plannedUploadDate: e.target.value })} /></label><label>게스트 콜타임<input disabled={!isAdmin} type="time" value={draft.guestCallTime || ''} onChange={(e) => setDraft({ ...draft, guestCallTime: e.target.value })} /></label><label>촬영 배치<select disabled={!isAdmin} value={draft.shootBatchId || ''} onChange={(e) => setDraft({ ...draft, shootBatchId: e.target.value })}><option value="">개별 촬영 / 미정</option>{batches.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label><label>회차<input disabled={!isAdmin} type="number" min="0" value={draft.sequence ?? ''} onChange={(e) => setDraft({ ...draft, sequence: e.target.value })} /></label><label>회차 상태<select disabled={!isAdmin} value={draft.sequenceState || 'unassigned'} onChange={(e) => setDraft({ ...draft, sequenceState: e.target.value })}><option value="unassigned">미배정</option><option value="provisional">예정</option><option value="verified">확정</option></select></label><label className="wide">Apple Music 플레이리스트<input disabled={!isAdmin} type="url" value={draft.appleMusicPlaylistUrl || ''} onChange={(e) => setDraft({ ...draft, appleMusicPlaylistUrl: e.target.value })} placeholder="https://music.apple.com/..." /></label></div>
    {batch && <div className="linked-record"><CalendarDays size={17} /><span><strong>{batch.label}</strong><small>{batch.shootDate ? formatDate(batch.shootDate) : `${batch.plannedMonth || ''} 날짜·시간 미정`}</small></span></div>}
    {isAdmin && <div className="button-row"><button className="primary-button" onClick={save}>기본 정보 저장</button><button className="secondary-button" onClick={saveSequence}>회차 적용</button></div>}
  </section>;
}

function QuestionnairePanel({ episode, inbox }) {
  const response = inbox.find((item) => item.episodeId === episode.id);
  return <section className="detail-section"><div className="section-title"><FileText size={18} /><div><strong>사전 질문지</strong><small>Google Form 17개 선곡과 현장 요청</small></div></div>
    <a className="linked-record action" href="https://docs.google.com/forms/d/e/1FAIpQLSd4hZ6mfPYFkEw1WGUagoFeEPXRVz_WJlux5Wqu4iyUQREPYg/viewform?usp=header" target="_blank" rel="noreferrer"><Link2 size={17} /><span><strong>게스트 질문지 열기</strong><small>아티스트에게 전달하는 고정 Form</small></span><ExternalLink size={15} /></a>
    {response ? <div className="response-card"><CheckCircle2 size={19} /><div><strong>{response.artistName} 응답 수령</strong><small>{formatDate(response.submittedAt, true)} · 답변 {response.answers?.length || 0}개</small></div></div> : <div className="inline-empty">연결된 응답이 없습니다. 동기화 화면에서 Google Form 응답을 가져오세요.</div>}
  </section>;
}

function PlaylistPanel({ episode, tracks, isAdmin, onError }) {
  const [raw, setRaw] = useState('');
  const addTracks = async () => {
    const parsed = parseTrackLines(raw).slice(0, Math.max(0, 17 - tracks.length));
    if (!parsed.length) return;
    try { for (const track of parsed.slice(0, 17)) await createEpisodeSubdocument(episode.id, 'playlistTracks', track); setRaw(''); } catch (error) { onError(error.message); }
  };
  const update = async (track, patch) => { try { await updateEpisodeSubdocument(episode.id, 'playlistTracks', track, patch); } catch (error) { onError(error.message); } };
  return <section className="detail-section"><div className="section-title"><Link2 size={18} /><div><strong>플레이리스트 QA</strong><small>{tracks.length}/17곡 등록</small></div></div>
    {isAdmin && <div className="bulk-track-input"><textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'아티스트 - 곡 제목\n아티스트 - 곡 제목'} /><button className="secondary-button" onClick={addTracks}>트랙 가져오기</button></div>}
    <div className="track-table">{tracks.sort((a, b) => a.questionNumber - b.questionNumber).map((track) => <div key={track.id}><span>{String(track.questionNumber).padStart(2, '0')}</span><div><strong>{track.title}</strong><small>{track.artist || track.rawAnswer}</small></div><select disabled={!isAdmin} value={track.matchStatus} onChange={(e) => update(track, { matchStatus: e.target.value })}><option value="pending">검증 대기</option><option value="matched">일치</option><option value="mismatch">불일치</option><option value="exception">예외 승인</option></select><select disabled={!isAdmin} value={track.purchaseStatus} onChange={(e) => update(track, { purchaseStatus: e.target.value })}><option value="not_reviewed">구매 검토</option><option value="not_required">구매 불필요</option><option value="to_buy">구매 필요</option><option value="purchased">구매 완료</option></select></div>)}</div>
  </section>;
}

function FilesPanel({ episode, artifacts, isAdmin, onError }) {
  const [busy, setBusy] = useState(false);
  const upload = async (event) => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); try { await uploadArtifact(episode.id, file, file.name.toLowerCase().endsWith('.json') ? 'typing-json' : 'attachment'); } catch (error) { onError(error.message); } finally { setBusy(false); event.target.value = ''; } };
  return <section className="detail-section"><div className="section-title"><FolderUp size={18} /><div><strong>제작 파일</strong><small>타이핑 JSON은 원본 그대로 전달</small></div></div>
    {isAdmin && <label className="upload-zone"><FolderUp size={23} /><strong>{busy ? '업로드 중...' : '파일 업로드'}</strong><small>JSON·CSV·PDF·문서·이미지, 최대 25MB</small><input type="file" disabled={busy} onChange={upload} /></label>}
    <div className="artifact-list">{artifacts.map((artifact) => <a key={artifact.id} href={artifact.downloadUrl} target="_blank" rel="noreferrer"><FileJson size={18} /><span><strong>{artifact.name}</strong><small>{artifact.category} · {Math.ceil((artifact.size || 0) / 1024)}KB</small></span><ExternalLink size={15} /></a>)}</div>
  </section>;
}

function FinancePanel({ episode, entries, isAdmin, onError }) {
  const [draft, setDraft] = useState({ type: 'expense', title: '', amount: '' });
  const add = async () => { if (!draft.title || !draft.amount) return; try { await createEpisodeSubdocument(episode.id, 'financialEntries', { ...draft, amount: Number(draft.amount), status: 'pending', currency: 'KRW' }); setDraft({ type: 'expense', title: '', amount: '' }); } catch (error) { onError(error.message); } };
  return <section className="detail-section"><div className="section-title"><CircleDollarSign size={18} /><div><strong>회차 정산</strong><small>출연료·제작지원·비용을 분리 기록</small></div></div>
    {isAdmin && <div className="inline-form"><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="expense">제작 비용</option><option value="appearance_fee_out">출연료 지급</option><option value="production_support_in">제작지원 수령</option></select><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="내역" /><input inputMode="numeric" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value.replace(/\D/g, '') })} placeholder="금액" /><button onClick={add}><Plus size={16} /></button></div>}
    <div className="finance-list">{entries.map((entry) => <div key={entry.id}><span>{entry.type}</span><strong>{entry.title}</strong><b>{Number(entry.amount).toLocaleString()}원</b><small>{entry.status}</small></div>)}</div>
  </section>;
}

function DeliverablesPanel({ episode, deliverables, isAdmin, onError }) {
  const [draft, setDraft] = useState({ type: 'youtube_video', title: '', status: 'planned', uploadDate: '', url: '' });
  const add = async () => {
    if (!draft.title.trim()) return;
    try { await createEpisodeSubdocument(episode.id, 'deliverables', { ...draft, title: draft.title.trim(), uploadDate: draft.uploadDate || null, url: draft.url || null }); setDraft({ type: 'youtube_video', title: '', status: 'planned', uploadDate: '', url: '' }); }
    catch (error) { onError(error.message); }
  };
  const update = async (item, patch) => { try { await updateEpisodeSubdocument(episode.id, 'deliverables', item, patch); } catch (error) { onError(error.message); } };
  return <section className="detail-section"><div className="section-title"><Clapperboard size={18} /><div><strong>POST · 파생 콘텐츠</strong><small>본편과 쇼츠·릴스의 산출물을 분리 관리</small></div></div>
    {isAdmin && <div className="deliverable-create"><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="youtube_video">YouTube 본편</option><option value="youtube_collab">YouTube 공동작업</option><option value="instagram_reel">Instagram Reel</option><option value="shorts">Shorts</option></select><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="산출물 이름" /><input type="date" value={draft.uploadDate} onChange={(event) => setDraft({ ...draft, uploadDate: event.target.value })} /><button className="primary-button" onClick={add}><Plus size={14} /> 추가</button></div>}
    {deliverables.length ? <div className="deliverable-list">{deliverables.map((item) => <article key={item.id}><span className="status-pill">{item.type}</span><div><strong>{item.title}</strong>{isAdmin ? <input type="url" defaultValue={item.url || ''} placeholder="공개/협업 링크" onBlur={(event) => event.target.value !== (item.url || '') && update(item, { url: event.target.value || null })} /> : <small>{item.url || '링크 미등록'}</small>}</div><select disabled={!isAdmin} value={item.status || 'planned'} onChange={(event) => update(item, { status: event.target.value })}><option value="planned">예정</option><option value="in_progress">제작 중</option><option value="review">검토 중</option><option value="approved">승인</option><option value="published">게시 완료</option><option value="blocked">차단</option></select><input disabled={!isAdmin} type="date" value={item.uploadDate || ''} onChange={(event) => update(item, { uploadDate: event.target.value || null })} /></article>)}</div> : <div className="inline-empty">등록된 파생 콘텐츠가 없습니다.</div>}
  </section>;
}

function NotionDiscrepancyPanel({ episode, guest, disparities, resolutions, isAdmin, onError }) {
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState('');
  if (!disparities.length && !resolutions.length) return null;
  const displayValue = (item, value) => ['uploadDate', 'shootDate'].includes(item.key) ? formatDate(value) : String(value);
  const updateDraft = (key, patch) => setDrafts((current) => ({ ...current, [key]: { chosenSource: '', reason: '', ...current[key], ...patch } }));
  const resolve = async (item) => {
    const draft = drafts[item.key] || {};
    setBusy(item.key);
    try { await resolveNotionDisparity(episode, guest, item, draft.chosenSource, draft.reason); }
    catch (error) { onError(error.message); }
    finally { setBusy(''); }
  };
  const sourceUrl = disparities[0]?.sourceUrl || resolutions[0]?.sourceUrl;
  return <section className={`notion-discrepancy ${disparities.length ? '' : 'resolved'}`}><header><div>{disparities.length ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}<span><strong>{disparities.length ? 'Notion 데이터 괴리' : 'Notion 괴리 해결 완료'}</strong><small>{disparities.length ? '자동 덮어쓰기하지 않은 값입니다. 기준 출처를 확인해주세요.' : '관리자 결정과 해결 사유가 감사 이력에 보존됩니다.'}</small></span></div>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">Notion 원문 <ExternalLink size={13} /></a>}</header>
    {disparities.length > 0 && <div className="discrepancy-table">{disparities.map((item) => <article key={item.key}><strong>{item.label}</strong><div><span>NOTION</span><b>{displayValue(item, item.notionValue)}</b></div><ChevronRight size={15} /><div><span>TNT · 검증 기준</span><b>{displayValue(item, item.tntValue)}</b></div><small>{item.reason}</small>{isAdmin && <div className="resolution-controls"><select aria-label={`${item.label} 기준 출처`} value={drafts[item.key]?.chosenSource || ''} onChange={(event) => updateDraft(item.key, { chosenSource: event.target.value })}><option value="">기준 출처 선택</option><option value="tnt">TNT 기준 유지</option><option value="notion">Notion 기준 승인</option></select><input aria-label={`${item.label} 해결 사유`} value={drafts[item.key]?.reason || ''} onChange={(event) => updateDraft(item.key, { reason: event.target.value })} placeholder="결정 근거 또는 확인한 담당자" /><button className="secondary-button" disabled={busy === item.key || !drafts[item.key]?.chosenSource || (drafts[item.key]?.reason || '').trim().length < 3} onClick={() => resolve(item)}>{busy === item.key ? '기록 중...' : '해결 기록'}</button></div>}</article>)}</div>}
    {resolutions.length > 0 && <div className="resolution-history"><strong>해결 이력</strong>{resolutions.map((item) => <article key={item.id}><CheckCircle2 size={14} /><div><b>{item.label || item.field} · {item.chosenSource === 'notion' ? 'Notion 기준' : 'TNT 기준'}</b><small>{item.resolutionReason} · {formatDate(item.resolvedAt, true)}</small></div></article>)}</div>}
  </section>;
}

function EpisodeDetail({ episode, guest, batches, inbox, resolutions, episodeData, isAdmin, onError, onArchive }) {
  const [tab, setTab] = useState('workflow');
  const batch = batches.find((item) => item.id === episode.shootBatchId);
  const disparities = deriveNotionDisparities(episode, guest, batch, resolutions);
  const healthEpisode = disparities.length ? { ...episode, dataQuality: [...(episode.dataQuality || []), 'notion_discrepancy_conflict'] } : episode;
  const derived = deriveEpisodeState(healthEpisode, episodeData.tasks);
  const tabs = [['workflow', '워크플로우'], ['basics', '일정'], ['questionnaire', '질문지'], ['playlist', '플레이리스트'], ['files', '파일'], ['deliverables', 'POST'], ['finance', '정산']];
  return <article className="episode-detail"><header className="detail-header"><div><span className="eyebrow">{episode.sequenceLabel}</span><h2>{episode.guestName}</h2><p>{episode.title}</p></div><div className="detail-health"><HealthBadge value={derived.health} /><strong>{derived.progress}%</strong>{isAdmin && <button className="archive-action" onClick={() => onArchive(episode)}><Archive size={14} /> 보관</button>}</div></header>
    {episode.cancellationReason === 'footage_lost' && <div className="critical-note"><AlertTriangle size={18} /><div><strong>촬영본 유실로 본편 제작 취소</strong><span>쇼츠 전환 회의 예정 · 업로드일 미정</span></div></div>}
    <nav className="detail-tabs">{tabs.map(([id, label]) => <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === 'workflow' && <TaskPanel episode={episode} tasks={episodeData.tasks} isAdmin={isAdmin} onError={onError} />}
    {tab === 'basics' && <EpisodeBasics episode={episode} batches={batches} isAdmin={isAdmin} onError={onError} />}
    {tab === 'questionnaire' && <QuestionnairePanel episode={episode} inbox={inbox} />}
    {tab === 'playlist' && <PlaylistPanel episode={episode} tracks={episodeData.playlistTracks} isAdmin={isAdmin} onError={onError} />}
    {tab === 'files' && <FilesPanel episode={episode} artifacts={episodeData.artifacts} isAdmin={isAdmin} onError={onError} />}
    {tab === 'deliverables' && <DeliverablesPanel episode={episode} deliverables={episodeData.deliverables} isAdmin={isAdmin} onError={onError} />}
    {tab === 'finance' && <FinancePanel episode={episode} entries={episodeData.financialEntries} isAdmin={isAdmin} onError={onError} />}
    <NotionDiscrepancyPanel episode={episode} guest={guest} disparities={disparities} resolutions={resolutions} isAdmin={isAdmin} onError={onError} />
  </article>;
}

function EpisodesPage({ workspace, selectedId, onSelect, episodeData, isAdmin, onError, onArchive }) {
  const episode = workspace.episodes.find((item) => item.id === selectedId) || workspace.episodes[0];
  useEffect(() => { if (!selectedId && workspace.episodes[0]) onSelect(workspace.episodes[0].id); }, [selectedId, workspace.episodes, onSelect]);
  return <div className="page-stack"><PageHeading eyebrow="EPISODE OPERATIONS" title="에피소드" description="회차별 필수 작업과 제작 자료를 직접 관리합니다." />
    <div className="master-detail"><EpisodeList episodes={[...workspace.episodes]} selectedId={episode?.id} onSelect={onSelect} />{episode ? <EpisodeDetail episode={episode} guest={workspace.guestProspects.find((item) => item.id === episode.guestId)} batches={workspace.shootBatches} inbox={workspace.questionnaireInbox} resolutions={workspace.syncConflicts.filter((item) => item.episodeId === episode.id && item.status === 'resolved')} episodeData={episodeData} isAdmin={isAdmin} onError={onError} onArchive={onArchive} /> : <EmptyState title="에피소드가 없습니다" description="초기 데이터를 구성해주세요." />}</div>
  </div>;
}

function GuestsPage({ guests, isAdmin, onError, onOpenEpisode, onArchive }) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const filtered = guests.filter((guest) => `${guest.name} ${guest.pipelineStatus} ${guest.notes || ''}`.toLowerCase().includes(query.toLowerCase()));
  const changeStatus = async (guest, pipelineStatus) => { try { await mutateDocument('guestProspects', guest.id, { pipelineStatus }, guest.version); } catch (error) { onError(error.message); } };
  const addGuest = async () => { if (!name.trim()) return; try { await createDocument('guestProspects', { name: name.trim(), pipelineStatus: 'candidate', notionStatus: '컨택 전', episodeAssignment: { sequence: null, state: 'unassigned' }, aliases: [], ownerIds: [], nextContactAt: null, commercialType: 'undecided', notes: '', sourceUrl: null, dataQuality: [] }); setName(''); setAdding(false); } catch (error) { onError(error.message); } };
  const promote = async (guest) => { try { const id = await createEpisodeFromGuest(guest); onOpenEpisode(id); } catch (error) { onError(error.message); } };
  return <div className="page-stack"><PageHeading eyebrow="CASTING CRM" title="게스트 파이프라인" description="회차가 없는 후보부터 공개 완료까지 섭외 이력을 보존합니다." action={isAdmin && <button className="primary-button" onClick={() => setAdding(true)}><Plus size={16} /> 게스트 추가</button>} />
    <div className="search-bar"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 상태, 메모 검색" /></div>
    {adding && <div className="inline-create"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="게스트 이름" /><button className="primary-button" onClick={addGuest}>추가</button><button className="icon-button" onClick={() => setAdding(false)}><X size={16} /></button></div>}
    <div className="pipeline-board">{PIPELINE.map(([status, label]) => { const records = filtered.filter((guest) => guest.pipelineStatus === status); if (!records.length) return null; return <section key={status}><header><strong>{label}</strong><span>{records.length}</span></header><div>{records.map((guest) => <article key={guest.id}><div><strong>{guest.name}</strong><small>{guest.notes || '메모 없음'}</small></div><select disabled={!isAdmin} value={guest.pipelineStatus} onChange={(e) => changeStatus(guest, e.target.value)}>{PIPELINE.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select>{isAdmin && !['published', 'declined', 'cancelled'].includes(guest.pipelineStatus) && <button className="text-button" onClick={() => promote(guest)}>에피소드 생성</button>}{isAdmin && <button className="archive-icon" aria-label={`${guest.name} 보관`} onClick={() => onArchive(guest)}><Archive size={14} /></button>}{guest.dataQuality?.length > 0 && <span className="data-warning"><AlertTriangle size={13} /> {guest.dataQuality.length}</span>}</article>)}</div></section>; })}</div>
  </div>;
}

function SchedulePage({ batches, episodes, isAdmin, onError, onArchive }) {
  const [label, setLabel] = useState('');
  const save = async (batch, patch) => { try { await mutateDocument('shootBatches', batch.id, patch, batch.version); } catch (error) { onError(error.message); } };
  const addBatch = async () => { if (!label.trim()) return; try { await createDocument('shootBatches', { label: label.trim(), plannedMonth: null, shootDate: null, studioStartTime: null, studioEndTime: null, articCallTime: null, guestOrder: [], guestIds: [], status: 'date_and_time_pending' }); setLabel(''); } catch (error) { onError(error.message); } };
  return <div className="page-stack"><PageHeading eyebrow="SHOOT CALENDAR" title="촬영 일정" description="하루에 여러 회차를 촬영하는 배치와 공통 콜타임을 관리합니다." />
    {isAdmin && <div className="inline-create"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="새 촬영 배치 이름" /><button className="primary-button" onClick={addBatch}><Plus size={15} /> 배치 추가</button></div>}
    {batches.length ? <div className="batch-grid">{batches.map((batch) => <article className="panel" key={batch.id}><div className="panel-heading"><div><span className="eyebrow">SHOOT BATCH</span><h3>{batch.label}</h3></div><span className="batch-actions"><span className="status-pill">{batch.status}</span>{isAdmin && <button className="archive-icon" aria-label={`${batch.label} 보관`} onClick={() => onArchive(batch)}><Archive size={14} /></button>}</span></div><div className="form-grid"><label>촬영일<input disabled={!isAdmin} type="date" defaultValue={batch.shootDate || ''} onBlur={(e) => e.target.value !== (batch.shootDate || '') && save(batch, { shootDate: e.target.value || null, status: e.target.value ? 'scheduled' : 'date_and_time_pending' })} /></label><label>artic 집결<input disabled={!isAdmin} type="time" defaultValue={batch.articCallTime || ''} onBlur={(e) => save(batch, { articCallTime: e.target.value || null })} /></label><label>스튜디오 시작<input disabled={!isAdmin} type="time" defaultValue={batch.studioStartTime || ''} onBlur={(e) => save(batch, { studioStartTime: e.target.value || null })} /></label><label>스튜디오 종료<input disabled={!isAdmin} type="time" defaultValue={batch.studioEndTime || ''} onBlur={(e) => save(batch, { studioEndTime: e.target.value || null })} /></label></div><div className="batch-guests">{episodes.filter((episode) => episode.shootBatchId === batch.id).map((episode) => <span key={episode.id}>{episode.sequenceLabel} · {episode.guestName}<b>{episode.guestCallTime || '콜타임 미정'}</b></span>)}</div></article>)}</div> : <EmptyState title="촬영 배치가 없습니다" description="공동 촬영일이 생기면 배치를 생성합니다." />}
  </div>;
}

function SimpleRecordsPage({ kind, title, description, records, isAdmin, onError, onArchive }) {
  const [draft, setDraft] = useState({ title: '', status: 'candidate', date: '', note: '' });
  const add = async () => { if (!draft.title.trim()) return; try { await createDocument(kind, draft); setDraft({ title: '', status: 'candidate', date: '', note: '' }); } catch (error) { onError(error.message); } };
  return <div className="page-stack"><PageHeading eyebrow="PROJECT RECORDS" title={title} description={description} />{isAdmin && <div className="inline-form"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="이름" /><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="candidate">후보</option><option value="planned">예정</option><option value="in_progress">진행 중</option><option value="confirmed">확정</option><option value="completed">완료</option></select><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /><input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="메모" /><button onClick={add}><Plus size={16} /></button></div>}<div className="record-card-grid">{records.map((item) => <article className="panel" key={item.id}><span className="status-pill">{item.status || '기록'}</span>{isAdmin && <button className="archive-icon card-archive" aria-label={`${item.title} 보관`} onClick={() => onArchive(item)}><Archive size={14} /></button>}<h3>{item.title}</h3><p>{item.note || item.agenda || '메모 없음'}</p><small>{formatDate(item.date || item.scheduledAt)}</small></article>)}</div></div>;
}

function ReservationsPage({ reservations, resources, episodes, batches, isAdmin, onError, onArchive }) {
  const [draft, setDraft] = useState({ resourceId: '', type: 'studio', episodeId: '', shootBatchId: '', date: '', status: 'planned', cost: '', note: '' });
  const resourceName = (id) => resources.find((item) => item.id === id)?.title || '자원 미지정';
  const scopeName = (item) => episodes.find((episode) => episode.id === item.episodeId)?.guestName || batches.find((batch) => batch.id === item.shootBatchId)?.label || '연결 미정';
  const add = async () => {
    if (!draft.resourceId || (!draft.episodeId && !draft.shootBatchId)) { onError('예약 자원과 에피소드 또는 촬영 배치를 선택해주세요.'); return; }
    try {
      await createDocument('reservations', { ...draft, episodeId: draft.episodeId || null, shootBatchId: draft.shootBatchId || null, cost: draft.cost === '' ? null : Number(draft.cost), title: `${resourceName(draft.resourceId)} 예약` });
      setDraft({ resourceId: '', type: 'studio', episodeId: '', shootBatchId: '', date: '', status: 'planned', cost: '', note: '' });
    } catch (error) { onError(error.message); }
  };
  const changeStatus = async (item, status) => { try { await mutateDocument('reservations', item.id, { status }, item.version); } catch (error) { onError(error.message); } };
  return <div className="page-stack"><PageHeading eyebrow="BOOKING CONTROL" title="대관 · 장비 예약" description="노브아 스튜디오와 촬영 장비의 예약 근거, 비용, 연결 회차를 관리합니다." />
    {isAdmin && <section className="reservation-create"><div className="form-grid"><label>자원<select value={draft.resourceId} onChange={(e) => setDraft({ ...draft, resourceId: e.target.value })}><option value="">선택</option>{resources.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>구분<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="studio">스튜디오</option><option value="equipment">장비</option><option value="service">서비스</option></select></label><label>에피소드<select value={draft.episodeId} onChange={(e) => setDraft({ ...draft, episodeId: e.target.value, shootBatchId: e.target.value ? '' : draft.shootBatchId })}><option value="">선택 안 함</option>{episodes.map((item) => <option key={item.id} value={item.id}>{item.sequenceLabel} · {item.guestName}</option>)}</select></label><label>촬영 배치<select value={draft.shootBatchId} onChange={(e) => setDraft({ ...draft, shootBatchId: e.target.value, episodeId: e.target.value ? '' : draft.episodeId })}><option value="">선택 안 함</option>{batches.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>예약일<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label><label>예상/확정 비용<input type="number" min="0" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value })} placeholder="KRW" /></label><label className="wide">메모<input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="예약 시간, 담당자, 예약번호 등" /></label></div><button className="primary-button" onClick={add}><Plus size={15} /> 예약 추가</button></section>}
    {reservations.length ? <section className="reservation-list">{reservations.map((item) => <article key={item.id}><span className="reservation-type">{item.type === 'studio' ? 'STUDIO' : item.type === 'equipment' ? 'EQUIPMENT' : 'SERVICE'}</span><div><strong>{resourceName(item.resourceId)}</strong><small>{scopeName(item)} · {formatDate(item.date)}{item.cost != null ? ` · ${Number(item.cost).toLocaleString('ko-KR')}원` : ''}</small><p>{item.note || '예약 메모 없음'}</p></div><select disabled={!isAdmin} value={item.status || 'planned'} onChange={(e) => changeStatus(item, e.target.value)}><option value="planned">예약 예정</option><option value="requested">예약 요청</option><option value="confirmed">예약 확정</option><option value="completed">사용 완료</option><option value="cancelled">취소</option></select>{isAdmin && <button className="archive-icon" aria-label={`${resourceName(item.resourceId)} 예약 보관`} onClick={() => onArchive(item)}><Archive size={14} /></button>}</article>)}</section> : <EmptyState title="예약 기록이 없습니다" description="장소·장비를 등록한 뒤 촬영 회차나 배치에 연결하세요." />}
  </div>;
}

function ArchivePage({ items, isAdmin, onRestore, onError }) {
  const labels = { episodes: '에피소드', guestProspects: '게스트', shootBatches: '촬영 배치', meetings: '회의', resources: '자원', reservations: '예약', partnerships: '협찬' };
  return <div className="page-stack"><PageHeading eyebrow="RECOVERY" title="보관함" description="삭제 대신 보관된 운영 데이터를 원래 컬렉션으로 안전하게 복구합니다." />{items.length ? <section className="archive-list">{items.map((item) => <article key={`${item.collection}-${item.id}`}><span className="status-pill">{labels[item.collection] || item.collection}</span><div><strong>{item.title || item.name || item.label || item.guestName}</strong><small>{formatDate(item.archivedAt, true)} · version {item.version}</small></div><button className="secondary-button" disabled={!isAdmin} onClick={() => onRestore(item).catch((error) => onError(error.message))}><RefreshCw size={14} /> 복구</button></article>)}</section> : <EmptyState title="보관된 항목이 없습니다" description="보관 항목은 hard delete되지 않고 이곳에 남습니다." />}</div>;
}

function NotificationDrawer({ items, onClose, onOpenEpisode }) {
  return <aside className="notification-drawer"><header><div><span className="eyebrow">INBOX</span><h3>운영 알림</h3></div><button className="icon-button" aria-label="알림 닫기" onClick={onClose}><X size={16} /></button></header><div>{items.length ? items.map((item) => <button key={item.id} onClick={() => item.episodeId && onOpenEpisode(item.episodeId)}><AlertTriangle size={16} /><span><strong>{item.title}</strong><small>{item.description}</small></span></button>) : <div className="inline-empty">새 알림이 없습니다.</div>}</div></aside>;
}

function SyncPage({ workspace, isAdmin, onError }) {
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const runNotion = async () => { setBusy('notion'); try { setPreview(await callAdminFunction('tntPreviewNotionSync')); } catch (error) { onError(error.message); } finally { setBusy(''); } };
  const apply = async (difference, direction) => { setBusy('apply'); try { const values = direction === 'import' ? difference.remote : difference.local; await callAdminFunction('tntApplyNotionSync', { operations: [{ direction, guestId: difference.guestId || null, values }] }); setPreview(null); } catch (error) { onError(error.message); } finally { setBusy(''); } };
  const runGoogle = async () => { setBusy('google'); try { const result = await callAdminFunction('tntSyncGoogleFormResponses'); alert(`새 응답 ${result.imported}건을 가져왔습니다.`); } catch (error) { onError(error.message); } finally { setBusy(''); } };
  const linkResponse = async (response, episodeId) => { const episode = workspace.episodes.find((item) => item.id === episodeId); if (!episode) return; try { await mutateDocument('questionnaireInbox', response.id, { episodeId, guestId: episode.guestId, matchStatus: 'matched' }, response.version); } catch (error) { onError(error.message); } };
  return <div className="page-stack"><PageHeading eyebrow="SYNC & INTEGRITY" title="동기화 · 감사" description="외부 변경은 미리보기와 관리자 승인을 거쳐 반영합니다." />
    {!isAdmin && <div className="readonly-notice"><ShieldCheck size={17} /> 동기화는 TNT 관리자만 실행할 수 있습니다.</div>}
    <div className="sync-grid"><section className="panel"><Cloud size={22} /><h3>Notion 검토형 양방향 동기화</h3><p>게스트 트래커의 지원 필드만 비교합니다. 양쪽이 바뀐 값은 자동 적용하지 않습니다.</p><button className="secondary-button" disabled={!isAdmin || busy} onClick={runNotion}><RefreshCw size={16} /> {busy === 'notion' ? '비교 중...' : '차이 미리보기'}</button></section><section className="panel"><FileText size={22} /><h3>Google Form 응답 가져오기</h3><p>아티스트명, 17개 선곡, 음료 요청을 가져오며 response ID로 중복을 방지합니다.</p><button className="secondary-button" disabled={!isAdmin || busy} onClick={runGoogle}><RefreshCw size={16} /> {busy === 'google' ? '가져오는 중...' : '응답 동기화'}</button></section></div>
    {preview && <section className="panel"><div className="panel-heading"><h3>차이 {preview.differences.length}건</h3><button className="icon-button" onClick={() => setPreview(null)}><X size={16} /></button></div><div className="diff-list">{preview.differences.map((difference, index) => <article key={`${difference.guestId || 'new'}-${index}`}><div><strong>{difference.remote?.name || difference.local?.name}</strong><small>{difference.type} · {(difference.fields || []).join(', ')}</small></div><span>{difference.type !== 'tnt_only' && <button onClick={() => apply(difference, 'import')}>Notion → TNT</button>}{difference.type !== 'notion_only' && <button onClick={() => apply(difference, 'export')}>TNT → Notion</button>}</span></article>)}</div></section>}
    {workspace.questionnaireInbox.some((item) => item.matchStatus !== 'matched') && <section className="panel"><div className="panel-heading"><h3>질문지 연결 검토</h3><span>{workspace.questionnaireInbox.filter((item) => item.matchStatus !== 'matched').length}건</span></div><div className="response-review-list">{workspace.questionnaireInbox.filter((item) => item.matchStatus !== 'matched').map((response) => <article key={response.id}><div><strong>{response.artistName || '아티스트명 없음'}</strong><small>{formatDate(response.submittedAt, true)} · {response.matchStatus}</small></div><select disabled={!isAdmin} value={response.episodeId || ''} onChange={(e) => linkResponse(response, e.target.value)}><option value="">에피소드 선택</option>{workspace.episodes.map((episode) => <option value={episode.id} key={episode.id}>{episode.sequenceLabel} · {episode.guestName}</option>)}</select></article>)}</div></section>}
    <section className="panel"><div className="panel-heading"><h3>데이터 정합성</h3><span>{workspace.syncConflicts.filter((item) => item.status !== 'resolved').length} active · {workspace.syncConflicts.filter((item) => item.status === 'resolved').length} resolved</span></div><div className="integrity-list"><span>질문지 미연결 응답 <b>{workspace.questionnaireInbox.filter((item) => item.matchStatus === 'unmatched').length}</b></span><span>회차 충돌 게스트 <b>{workspace.guestProspects.filter((item) => item.dataQuality?.some((flag) => flag.includes('conflict'))).length}</b></span><span>EP.7 <b>미배정 유지</b></span></div></section>
  </div>;
}

function ProjectPage() {
  const docs = [
    ['TASTING NOTE 홈', 'https://app.notion.com/p/26dffc3c3af58095bb20fd89297d34a0'],
    ['게스트 섭외 트래커', 'https://app.notion.com/p/2ceffc3c3af580ef8ad2f30504dc8aea'],
    ['사전 질문지', 'https://docs.google.com/forms/d/e/1FAIpQLSd4hZ6mfPYFkEw1WGUagoFeEPXRVz_WJlux5Wqu4iyUQREPYg/viewform?usp=header'],
    ['공개 에피소드', 'https://artic.live/projects/tasting-note/'],
  ];
  return <div className="page-stack"><PageHeading eyebrow="PROJECT SOURCES" title="프로젝트 문서" description="이관 기간 동안 기준 문서와 공개 자료를 함께 확인합니다." /><div className="document-grid">{docs.map(([title, href]) => <a className="document-card" key={href} href={href} target="_blank" rel="noreferrer"><FileText size={23} /><h3>{title}</h3><p>원본 자료 열기</p><ExternalLink size={15} /></a>)}</div></div>;
}

function LegacyDataNotice({ data, onDismiss }) {
  if (!data) return null;
  const counts = ['episodes', 'guests', 'resources', 'meetings', 'partnerships'].map((key) => `${key} ${(data[key] || []).length}`).join(' · ');
  const download = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'tnt-localstorage-backup.json'; link.click(); URL.revokeObjectURL(url); };
  return <div className="legacy-notice"><Archive size={18} /><div><strong>이전 브라우저 데이터가 발견됐습니다</strong><small>{counts} · Firestore에 자동 반영하지 않습니다.</small></div><button onClick={download}>백업 다운로드</button><button className="icon-button" onClick={onDismiss}><X size={15} /></button></div>;
}

export default function App() {
  const [view, setView] = useState('overview');
  const [workspace, setWorkspace] = useState(EMPTY);
  const [archivedItems, setArchivedItems] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [taskCache, setTaskCache] = useState({});
  const [initializing, setInitializing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [legacyData, setLegacyData] = useState(() => {
    if (localStorage.getItem('artic-tnt-legacy-dismissed') === 'true') return null;
    try { return JSON.parse(localStorage.getItem('artic-tnt-project-manager-v1') || 'null'); } catch { return null; }
  });
  const embedded = window !== window.top;

  useEffect(() => {
    if (!embedded) return undefined;
    const handlePortalMessage = (event) => {
      if (event.source !== window.parent || event.data?.type !== 'TOGGLE_SIDEBAR') return;
      setSidebarOpen((open) => !open);
    };
    window.addEventListener('message', handlePortalMessage);
    return () => window.removeEventListener('message', handlePortalMessage);
  }, [embedded]);

  useEffect(() => {
    if (embedded) window.parent.postMessage({ type: 'SIDEBAR_STATE', active: sidebarOpen }, '*');
  }, [embedded, sidebarOpen]);
  const onError = useMemo(() => (message) => setError(message), []);
  const episodeData = useEpisodeData(selectedEpisodeId, onError);

  useEffect(() => {
    let unsubscribe = () => {};
    let unsubscribeArchive = () => {};
    getSession().then((value) => {
      setSession(value);
      unsubscribe = subscribeWorkspace((data) => { setWorkspace(data); setLoading(false); }, (cause) => { setError(cause.message); setLoading(false); });
      unsubscribeArchive = subscribeArchive(setArchivedItems, (cause) => setError(cause.message));
    }).catch((cause) => { setError(cause.message); setLoading(false); });
    return () => { unsubscribe(); unsubscribeArchive(); };
  }, []);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('online', sync); window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, []);

  useEffect(() => {
    const unsubs = workspace.episodes.map((episode) => subscribeEpisodeTasks(episode.id, (tasks) => setTaskCache((current) => ({ ...current, [episode.id]: tasks })), () => {}));
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [workspace.episodes.map((episode) => episode.id).join('|')]);

  const openEpisode = (id) => { setSelectedEpisodeId(id); setView('episodes'); setSidebarOpen(false); };
  const initialize = async () => { setInitializing(true); try { await initializeWorkspace(); } catch (cause) { setError(cause.message); } finally { setInitializing(false); } };
  const archive = async (collection, item) => { if (!window.confirm(`${item.title || item.name || item.guestName || '항목'}을 보관하시겠습니까?`)) return; try { await archiveDocument(collection, item); if (collection === 'episodes' && selectedEpisodeId === item.id) setSelectedEpisodeId(null); } catch (cause) { setError(cause.message); } };
  const restore = async (item) => restoreDocument(item.collection, item);
  const activeLabel = NAV.find(([id]) => id === view)?.[1];
  const canEdit = Boolean(session?.isAdmin && online);
  const derivedNotifications = useMemo(() => {
    const items = [];
    workspace.episodes.forEach((episode) => {
      const state = deriveEpisodeState(episode, taskCache[episode.id] || []);
      if (['conflict', 'blocked', 'overdue', 'at_risk'].includes(state.health)) items.push({ id: `episode-${episode.id}-${state.health}`, episodeId: episode.id, title: `${episode.sequenceLabel} ${episode.guestName}`, description: state.health === 'conflict' ? '출처 간 데이터 충돌을 확인하세요.' : state.nextTask?.title || HEALTH[state.health]?.[0] });
    });
    workspace.questionnaireInbox.filter((item) => item.matchStatus === 'unmatched').forEach((item) => items.push({ id: `form-${item.id}`, title: `${item.artistName || '이름 없음'} 질문지`, description: '게스트 또는 에피소드에 연결되지 않았습니다.' }));
    workspace.guestProspects.filter((guest) => guest.dataQuality?.includes('follow_up_overdue')).forEach((guest) => items.push({ id: `guest-${guest.id}`, title: `${guest.name} 후속 연락`, description: '기존 후속 연락 시점이 지났습니다.' }));
    return items;
  }, [workspace, taskCache]);
  const content = {
    overview: <Dashboard workspace={workspace} taskCache={taskCache} onOpenEpisode={openEpisode} />,
    episodes: <EpisodesPage workspace={workspace} selectedId={selectedEpisodeId} onSelect={setSelectedEpisodeId} episodeData={episodeData} isAdmin={canEdit} onError={setError} onArchive={(item) => archive('episodes', item)} />,
    guests: <GuestsPage guests={workspace.guestProspects} isAdmin={canEdit} onError={setError} onOpenEpisode={openEpisode} onArchive={(item) => archive('guestProspects', item)} />,
    schedule: <SchedulePage batches={workspace.shootBatches} episodes={workspace.episodes} isAdmin={canEdit} onError={setError} onArchive={(item) => archive('shootBatches', item)} />,
    resources: <SimpleRecordsPage kind="resources" title="장소 · 장비" description="촬영 장소와 장비 준비 상태를 관리합니다." records={workspace.resources} isAdmin={canEdit} onError={setError} onArchive={(item) => archive('resources', item)} />,
    bookings: <ReservationsPage reservations={workspace.reservations} resources={workspace.resources} episodes={workspace.episodes} batches={workspace.shootBatches} isAdmin={canEdit} onError={setError} onArchive={(item) => archive('reservations', item)} />,
    finance: <SettlementPanel />,
    partnerships: <SimpleRecordsPage kind="partnerships" title="PPL · 협찬" description="제안, 협의, 확정 및 제작지원 수령 상태를 관리합니다." records={workspace.partnerships} isAdmin={canEdit} onError={setError} onArchive={(item) => archive('partnerships', item)} />,
    meetings: <SimpleRecordsPage kind="meetings" title="회의 · 피드백" description="결정사항과 다음 촬영에 반영할 학습을 누적합니다." records={workspace.meetings} isAdmin={canEdit} onError={setError} onArchive={(item) => archive('meetings', item)} />,
    sync: <SyncPage workspace={workspace} isAdmin={canEdit} onError={setError} />,
    archive: <ArchivePage items={archivedItems} isAdmin={canEdit} onRestore={restore} onError={setError} />,
    project: <ProjectPage />,
  }[view];

  if (loading) return <div className="app-loading"><RefreshCw className="spin" /><strong>TNT 데이터를 불러오는 중</strong></div>;

  return <div className={`workspace-shell ${embedded ? 'embedded' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
    <aside className="workspace-sidebar"><button className="project-mark" onClick={() => setView('overview')}><span>TN</span><div className="sidebar-label"><strong>Tasting Note</strong><small>Project Manager</small></div></button><div className="sidebar-toggle-wrap"><button className="sidebar-toggle" onClick={() => window.innerWidth > 1200 ? setSidebarCollapsed(!sidebarCollapsed) : setSidebarOpen(!sidebarOpen)}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span className="sidebar-label">메뉴 {sidebarCollapsed ? '확대' : '축소'}</span></button></div><nav>{['PROJECT', 'OPERATIONS', 'MANAGEMENT'].map((group) => <div className="nav-group" key={group}><span className="nav-group-label sidebar-label">{group}</span>{NAV.filter(([, , , itemGroup]) => itemGroup === group).map(([id, label, Icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => { setView(id); setSidebarOpen(false); }}><Icon size={18} /><span className="sidebar-label">{label}</span></button>)}</div>)}</nav><div className="sidebar-note"><span className={`sync-dot ${session?.isAdmin ? 'admin' : ''}`} /><span className="sidebar-label">{session?.isAdmin ? '관리자 편집 모드' : '멤버 읽기 모드'}<small>Firestore 실시간 연결</small></span></div></aside>
    {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기" />}
    <main className="workspace-main">{!embedded && <header className="workspace-header"><button className="mobile-menu" aria-label="메뉴 열기" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div><span className="header-path">TNT /</span><strong>{activeLabel}</strong></div><div className="header-actions"><button className={derivedNotifications.length ? 'has-alerts' : ''} title="알림" aria-label="알림" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} />{derivedNotifications.length > 0 && <b>{derivedNotifications.length}</b>}</button></div></header>}{embedded && <button className={`embedded-alert ${derivedNotifications.length ? 'has-alerts' : ''}`} title="운영 알림" aria-label="운영 알림" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} />{derivedNotifications.length > 0 && <b>{derivedNotifications.length}</b>}</button>}{notificationsOpen && <NotificationDrawer items={derivedNotifications} onClose={() => setNotificationsOpen(false)} onOpenEpisode={(id) => { openEpisode(id); setNotificationsOpen(false); }} />}<div className="workspace-content">{!online && <div className="offline-notice"><Cloud size={16} /> 오프라인 상태입니다. 데이터 조회는 유지되지만 모든 쓰기 작업이 잠겼습니다.</div>}<LegacyDataNotice data={legacyData} onDismiss={() => { localStorage.setItem('artic-tnt-legacy-dismissed', 'true'); setLegacyData(null); }} /><ErrorBanner error={error} onClose={() => setError('')} />{workspace.episodes.length === 0 && session?.isAdmin ? <section className="setup-card"><ShieldCheck size={28} /><h2>TNT 운영 데이터 초기화</h2><p>검증된 게스트 27명, 공개 7편, 향후 회차와 워크플로우를 Firestore에 구성합니다.</p><button className="primary-button" disabled={initializing || !online} onClick={initialize}>{initializing ? '구성 중...' : '초기 데이터 구성'}</button></section> : content}</div></main>
  </div>;
}
