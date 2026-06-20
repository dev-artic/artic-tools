import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Banknote,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  ExternalLink,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  MapPinned,
  Menu,
  MessageSquareText,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sun,
  Trash2,
  Users,
  Wrench,
  X
} from 'lucide-react';
import SettlementPanel from './SettlementPanel.jsx';

const STORAGE_KEY = 'artic-tnt-project-manager-v1';

const NAV_ITEMS = [
  { id: 'overview', label: '대시보드', icon: LayoutDashboard, group: 'PROJECT' },
  { id: 'project', label: '프로젝트 기획', icon: BookOpen, group: 'PROJECT' },
  { id: 'guests', label: '게스트 섭외', icon: Users, group: 'OPERATIONS' },
  { id: 'episodes', label: '회차 제작', icon: Clapperboard, group: 'OPERATIONS' },
  { id: 'production', label: '촬영 준비', icon: Wrench, group: 'OPERATIONS' },
  { id: 'resources', label: '장소 · 장비', icon: MapPinned, group: 'OPERATIONS' },
  { id: 'settlement', label: '비용 · 정산', icon: Banknote, group: 'MANAGEMENT' },
  { id: 'meetings', label: '회의 · 피드백', icon: MessageSquareText, group: 'MANAGEMENT' },
  { id: 'partnerships', label: 'PPL · 협찬', icon: HeartHandshake, group: 'MANAGEMENT' }
];

const EPISODE_STAGES = [
  { id: 'planning', label: '기획', color: 'slate' },
  { id: 'casting', label: '섭외', color: 'violet' },
  { id: 'preproduction', label: '촬영 준비', color: 'amber' },
  { id: 'production', label: '촬영', color: 'blue' },
  { id: 'editing', label: '편집', color: 'cyan' },
  { id: 'published', label: '발행', color: 'emerald' }
];

const GUEST_STATUSES = [
  '컨택 전',
  '컨택 예정',
  '출연 문의',
  '발송 완료',
  '확인 및 답변 대기중',
  '촬영 일정 조율중',
  '섭외 완료',
  '섭외 완료 + PPL',
  '촬영 완료',
  '섭외 거절',
  '유가 출연 거절',
  '섭외 취소'
];

const WORKFLOW = [
  '출연 의사와 10~14일 촬영 후보 기간 확인',
  '사전 질문지 전달 및 응답 회수',
  '촬영 장소와 기본 3개 앵글 확정',
  '장비, 대관료, 출연료 예산 확인',
  '촬영본 백업과 편집 담당자 인계',
  '제목, 썸네일, 업로드 일정 확정'
];

const NOTION_LINKS = [
  {
    label: 'TASTING NOTE 홈',
    description: '기획안, 회의와 운영 문서',
    href: 'https://app.notion.com/p/26dffc3c3af58095bb20fd89297d34a0'
  },
  {
    label: '게스트 섭외 트래커',
    description: '기존 섭외 이력과 연락 기록',
    href: 'https://app.notion.com/p/2ceffc3c3af580ef8ad2f30504dc8aea'
  },
  {
    label: '섭외 후 준비 프로세스',
    description: '질문지와 촬영 전 요청사항',
    href: 'https://app.notion.com/p/2f6ffc3c3af5806daf2ee60e92b2383d'
  }
];

const PROJECT_DOCUMENTS = [
  { type: '기획', title: 'TASTING NOTE 기획안', status: '문서', description: '프로젝트 정의, 질문 구조, 연출 방향과 공개 일정', href: 'https://app.notion.com/p/31affc3c3af58078b79dca263dbf3e55' },
  { type: '가이드', title: '게스트 참여 가이드라인', status: '진행 중', description: '90분 촬영 흐름과 아티스트 사전 준비 안내', href: 'https://app.notion.com/p/2c0ffc3c3af5804fbed2e0f5f726209c' },
  { type: '프로세스', title: '섭외 전 메일 · DM', status: '완료', description: '섭외 대상 논의와 채널별 발송 템플릿', href: 'https://app.notion.com/p/304ffc3c3af5805db01cddfde25ce78f' },
  { type: '프로세스', title: '섭외 후 촬영 준비', status: '문서', description: '사전 질문지와 게스트 요청사항 관리', href: 'https://app.notion.com/p/2f6ffc3c3af5806daf2ee60e92b2383d' },
  { type: '촬영 양식', title: '아티스트 작성 양식', status: '문서', description: '촬영일에 사용하는 17개 질문과 기록 양식', href: 'https://app.notion.com/p/2f6ffc3c3af58043a041c43bc4c43a77' }
];

const MEETING_DOCUMENTS = [
  { title: 'EP.1 사전 회의', status: '완료', date: '2026-01-24', href: 'https://app.notion.com/p/2f2ffc3c3af5805f8011fb154c9f9065', note: '장비, 앵글, 질문, 준비물' },
  { title: 'EP.1 촬영 피드백', status: '완료', date: '2026-01-28', href: 'https://app.notion.com/p/2f6ffc3c3af580db99e3d10546c3262e', note: '조명, 앵글, 오디오, 백업' },
  { title: '정산 · 장소 · 연출 피드백', status: '시작 전', date: '2026-03-05', href: 'https://app.notion.com/p/318ffc3c3af5809fb960e9713fa5c2e1', note: '회당 부담, 장소 조건, 연출 문구' },
  { title: 'EP.4 이후 장비 세팅', status: '시작 전', date: '2026-04-04', href: 'https://app.notion.com/p/338ffc3c3af5804d993dfc3f8e7d64d2', note: '차기 장비 세팅 문서' }
];

const QUESTIONS = [
  '플레이리스트의 첫 곡에는 어떤 음악이 들어가야 하는가?', '나는 누구인가?', '주변에서 별로라고 하는데 나만 좋아하는 곡',
  '내 취향은 아니지만 듣게 되는 곡', '나만 혼자 몰래 숨어 듣던 음악', '저작권료를 더 받았으면 하는 음악',
  '새로운 것을 시작할 때의 기분', '내가 한때 열중했던 것', '요즘 내가 빠져있는 것', '내가 좋아하는 것들',
  '내 음악의 시작점', '내 음악의 지향점', '인생에 불변의 진리가 있다면', '나에게 행복이란',
  '작은 후회가 있다면', '앞으로 하고 싶은 것', '맺으며'
];

const EMPTY_STATE = { episodes: [], guests: [], checklist: {}, resources: [], meetings: [], partnerships: [] };

function getInitialTheme() {
  const saved = localStorage.getItem('artic-theme');
  if (saved) return saved;
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}

function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === 'object' ? { ...EMPTY_STATE, ...saved } : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

function formatDate(value) {
  if (!value) return '미정';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T00:00:00`)
  );
}

function StatusBadge({ stage }) {
  const item = EPISODE_STAGES.find((candidate) => candidate.id === stage) || EPISODE_STAGES[0];
  return <span className={`status-badge status-${item.color}`}>{item.label}</span>;
}

function EmptyPanel({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-panel">
      <span className="empty-icon"><Icon size={22} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function Overview({ workspace, onNavigate }) {
  const activeEpisodes = workspace.episodes.filter((item) => item.stage !== 'published').length;
  const confirmedGuests = workspace.guests.filter((item) => item.status.includes('섭외 완료')).length;
  const completedChecks = Object.values(workspace.checklist).filter(Boolean).length;

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <span className="eyebrow">TASTING NOTE OPERATIONS</span>
          <h2>한 편의 노트를 완성하는 모든 과정</h2>
          <p>게스트 섭외부터 촬영, 편집, 정산과 발행까지 TNT 제작 흐름을 한곳에서 관리합니다.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate('episodes')}>
          에피소드 시작 <ChevronRight size={17} />
        </button>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><Clapperboard /><span>진행 에피소드</span><strong>{activeEpisodes}</strong></article>
        <article className="metric-card"><Users /><span>섭외 확정</span><strong>{confirmedGuests}</strong></article>
        <article className="metric-card"><CalendarDays /><span>운영 체크</span><strong>{completedChecks}/{WORKFLOW.length}</strong></article>
        <article className="metric-card"><Archive /><span>발행 완료</span><strong>{workspace.episodes.length - activeEpisodes}</strong></article>
      </section>

      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">PRODUCTION LINE</span><h3>제작 워크플로우</h3></div>
          </div>
          <div className="stage-track">
            {EPISODE_STAGES.map((stage, index) => (
              <div className="stage-item" key={stage.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{stage.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">NOTION SOURCE</span><h3>기존 운영 문서</h3></div>
          </div>
          <div className="link-list">
            {NOTION_LINKS.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                <span><strong>{link.label}</strong><small>{link.description}</small></span>
                <ExternalLink size={15} />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProjectPage() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">PROJECT WIKI</span><h2>프로젝트 기획</h2><p>TASTING NOTE의 기준 문서와 반복 운영 프로세스를 관리합니다.</p></div>
        <a className="primary-button" href="https://app.notion.com/p/26dffc3c3af58095bb20fd89297d34a0" target="_blank" rel="noreferrer">Notion 원본 <ExternalLink size={16} /></a>
      </section>
      <section className="project-brief">
        <div><span className="eyebrow">FORMAT</span><strong>말 대신 선곡으로 답하는<br />플레이리스트형 인터뷰</strong></div>
        <dl><div><dt>러닝타임</dt><dd>60분 내외</dd></div><div><dt>질문</dt><dd>17개</dd></div><div><dt>업로드</dt><dd>월 1회</dd></div><div><dt>기본 촬영</dt><dd>3개 앵글</dd></div></dl>
      </section>
      <section className="document-grid">
        {PROJECT_DOCUMENTS.map((document) => (
          <a className="document-card" href={document.href} target="_blank" rel="noreferrer" key={document.href}>
            <div className="document-card-top"><span>{document.type}</span><ExternalLink size={15} /></div>
            <FileText size={21} />
            <h3>{document.title}</h3>
            <p>{document.description}</p>
            <small>{document.status}</small>
          </a>
        ))}
      </section>
    </div>
  );
}

function ProductionPage({ checklist, onToggleCheck }) {
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">PRODUCTION PLAYBOOK</span><h2>촬영 준비</h2><p>섭외 확정부터 촬영본 인계까지 반복되는 제작 절차입니다.</p></div></section>
      <div className="production-grid">
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">RUN OF SHOW</span><h3>회차 공통 체크리스트</h3></div><span className="progress-label">{Object.values(checklist).filter(Boolean).length}/{WORKFLOW.length}</span></div>
          <div className="check-list single-column">
            {WORKFLOW.map((item, index) => <label key={item} className={checklist[index] ? 'checked' : ''}><input type="checkbox" checked={Boolean(checklist[index])} onChange={() => onToggleCheck(index)} /><span>{item}</span></label>)}
          </div>
          <div className="source-note"><ExternalLink size={14} /><span>섭외 후 준비, 장소 운영, EP.1 사전 회의 문서를 기준으로 구성</span></div>
        </section>
        <section className="panel question-panel">
          <div className="panel-heading"><div><span className="eyebrow">ARTIST NOTE</span><h3>촬영일 질문 양식</h3></div><a href="https://app.notion.com/p/2f6ffc3c3af58043a041c43bc4c43a77" target="_blank" rel="noreferrer"><ExternalLink size={15} /></a></div>
          <div className="question-list">{QUESTIONS.map((question, index) => <div key={question}><span>{String(index + 1).padStart(2, '0')}</span><p>{question}</p></div>)}</div>
        </section>
      </div>
    </div>
  );
}

function TrackerPage({ kind, title, eyebrow, description, records, onAdd, onUpdate, onDelete }) {
  const configs = {
    resources: { types: ['촬영 장소', '카메라', '렌즈', '오디오', '조명', '기타 장비'], statuses: ['후보', '확인 중', '예약 완료', '사용 완료'], source: 'https://app.notion.com/p/2fcffc3c3af580eaa676f20dcf88042d' },
    partnerships: { types: ['PPL', '공간 협찬', '장비 협찬', '콘텐츠 제휴'], statuses: ['리드', '제안 준비', '제안 발송', '협의 중', '확정', '종료'], source: 'https://app.notion.com/p/312e76b3d4ed4831bd026663eb02dd5d' }
  };
  const config = configs[kind];
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', type: config.types[0], status: config.statuses[0], owner: '', date: '', note: '' });
  const submit = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onAdd(draft);
    setDraft({ title: '', type: config.types[0], status: config.statuses[0], owner: '', date: '', note: '' });
    setIsAdding(false);
  };
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><button className="primary-button" onClick={() => setIsAdding(true)}><Plus size={17} /> 항목 추가</button></section>
      <div className="source-strip"><span><BookOpen size={15} /> Notion 기준 문서와 병행 운영 중</span><a href={config.source} target="_blank" rel="noreferrer">원본 열기 <ExternalLink size={14} /></a></div>
      {isAdding && <form className="editor-card" onSubmit={submit}><div className="editor-title"><strong>관리 항목 추가</strong><button type="button" onClick={() => setIsAdding(false)}><X size={18} /></button></div><div className="form-grid"><label className="wide">이름<input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>구분<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{config.types.map((type) => <option key={type}>{type}</option>)}</select></label><label>상태<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{config.statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>담당자<input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></label><label>일정<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label><label className="wide">메모<input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label></div><button className="primary-button" type="submit">추가하기</button></form>}
      {records.length === 0 ? <EmptyPanel icon={kind === 'resources' ? MapPinned : HeartHandshake} title="등록된 관리 항목이 없습니다" description="기존 Notion 데이터는 아직 이관하지 않았습니다. 신규 항목부터 이 관리페이지에 등록합니다." /> : <section className="tracker-grid">{records.map((record) => <article className="tracker-card" key={record.id}><div className="card-top"><span className="tracker-type">{record.type}</span><button className="icon-button danger" onClick={() => onDelete(record.id)}><Trash2 size={15} /></button></div><h3>{record.title}</h3><p>{record.note || '메모 없음'}</p><div className="tracker-meta"><span>{record.owner || '담당자 미정'}</span><span>{formatDate(record.date)}</span></div><select value={record.status} onChange={(e) => onUpdate(record.id, { status: e.target.value })}>{config.statuses.map((status) => <option key={status}>{status}</option>)}</select></article>)}</section>}
    </div>
  );
}

function MeetingsPage({ meetings, onAdd, onUpdate, onDelete }) {
  const combined = [...MEETING_DOCUMENTS.map((item) => ({ ...item, fixed: true, id: item.href })), ...meetings];
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', status: '시작 전', date: '', note: '' });
  const submit = (event) => { event.preventDefault(); if (!draft.title.trim()) return; onAdd(draft); setDraft({ title: '', status: '시작 전', date: '', note: '' }); setIsAdding(false); };
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">MEETINGS & LEARNINGS</span><h2>회의 · 피드백</h2><p>회차별 의사결정과 다음 촬영에 반영할 학습을 누적합니다.</p></div><button className="primary-button" onClick={() => setIsAdding(true)}><Plus size={17} /> 회의 추가</button></section>
      {isAdding && <form className="editor-card" onSubmit={submit}><div className="editor-title"><strong>회의 추가</strong><button type="button" onClick={() => setIsAdding(false)}><X size={18} /></button></div><div className="form-grid"><label className="wide">회의 제목<input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>상태<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>시작 전</option><option>진행 중</option><option>완료</option><option>문서</option></select></label><label>일정<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label><label className="wide">안건 · 메모<input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label></div><button className="primary-button" type="submit">추가하기</button></form>}
      <section className="meeting-list">{combined.map((meeting) => <article key={meeting.id}><span className="meeting-date">{formatDate(meeting.date)}</span><div><strong>{meeting.title}</strong><p>{meeting.note || '안건 없음'}</p></div><span className="meeting-status">{meeting.status}</span>{meeting.fixed ? <a href={meeting.href} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : <><select value={meeting.status} onChange={(e) => onUpdate(meeting.id, { status: e.target.value })}><option>시작 전</option><option>진행 중</option><option>완료</option><option>문서</option></select><button className="icon-button danger" onClick={() => onDelete(meeting.id)}><Trash2 size={15} /></button></>}</article>)}</section>
    </div>
  );
}

function Episodes({ episodes, checklist, onAdd, onUpdate, onDelete, onToggleCheck }) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', owner: '', stage: 'planning', shootDate: '', publishDate: '' });

  const submit = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onAdd(draft);
    setDraft({ title: '', owner: '', stage: 'planning', shootDate: '', publishDate: '' });
    setIsAdding(false);
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">EPISODE BOARD</span><h2>에피소드</h2><p>각 회차의 현재 단계와 핵심 일정을 관리합니다.</p></div>
        <button className="primary-button" onClick={() => setIsAdding(true)}><Plus size={17} /> 새 에피소드</button>
      </section>

      {isAdding && (
        <form className="editor-card" onSubmit={submit}>
          <div className="editor-title"><strong>에피소드 추가</strong><button type="button" onClick={() => setIsAdding(false)}><X size={18} /></button></div>
          <div className="form-grid">
            <label className="wide">에피소드/게스트 이름<input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="예: EP.07 | Artist" /></label>
            <label>담당자<input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="이름" /></label>
            <label>단계<select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value })}>{EPISODE_STAGES.map((stage) => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select></label>
            <label>촬영일<input type="date" value={draft.shootDate} onChange={(e) => setDraft({ ...draft, shootDate: e.target.value })} /></label>
            <label>업로드일<input type="date" value={draft.publishDate} onChange={(e) => setDraft({ ...draft, publishDate: e.target.value })} /></label>
          </div>
          <button className="primary-button" type="submit">추가하기</button>
        </form>
      )}

      {episodes.length === 0 ? (
        <EmptyPanel icon={Clapperboard} title="아직 등록된 에피소드가 없습니다" description="실제 게스트 정보는 자동으로 가져오지 않았습니다. 새 회차부터 안전하게 등록해보세요." action={<button className="text-button" onClick={() => setIsAdding(true)}>첫 에피소드 만들기</button>} />
      ) : (
        <section className="episode-grid">
          {episodes.map((episode) => (
            <article className="episode-card" key={episode.id}>
              <div className="card-top"><StatusBadge stage={episode.stage} /><button className="icon-button danger" onClick={() => onDelete(episode.id)} title="삭제"><Trash2 size={16} /></button></div>
              <h3>{episode.title}</h3>
              <p>{episode.owner || '담당자 미정'}</p>
              <div className="date-row"><span>촬영 <strong>{formatDate(episode.shootDate)}</strong></span><span>발행 <strong>{formatDate(episode.publishDate)}</strong></span></div>
              <select value={episode.stage} onChange={(e) => onUpdate(episode.id, { stage: e.target.value })}>{EPISODE_STAGES.map((stage) => <option value={stage.id} key={stage.id}>{stage.label}</option>)}</select>
            </article>
          ))}
        </section>
      )}

      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">REPEATABLE CHECKLIST</span><h3>회차 공통 준비 항목</h3></div></div>
        <div className="check-list">
          {WORKFLOW.map((item, index) => (
            <label key={item} className={checklist[index] ? 'checked' : ''}>
              <input type="checkbox" checked={Boolean(checklist[index])} onChange={() => onToggleCheck(index)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

function Guests({ guests, onAdd, onUpdate, onDelete }) {
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', status: '컨택 전', owner: '', contact: '', note: '' });
  const filtered = guests.filter((guest) => `${guest.name} ${guest.owner} ${guest.status}`.toLowerCase().includes(query.toLowerCase()));

  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onAdd(draft);
    setDraft({ name: '', status: '컨택 전', owner: '', contact: '', note: '' });
    setIsAdding(false);
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">GUEST PIPELINE</span><h2>게스트 섭외</h2><p>Notion의 기존 상태 체계를 유지해 연락부터 촬영 완료까지 추적합니다.</p></div>
        <button className="primary-button" onClick={() => setIsAdding(true)}><Plus size={17} /> 게스트 추가</button>
      </section>

      {isAdding && (
        <form className="editor-card" onSubmit={submit}>
          <div className="editor-title"><strong>게스트 추가</strong><button type="button" onClick={() => setIsAdding(false)}><X size={18} /></button></div>
          <div className="form-grid">
            <label>이름<input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label>담당자<input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></label>
            <label>상태<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{GUEST_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>연락처<input value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} placeholder="이메일 또는 연락 채널" /></label>
            <label className="wide">메모<input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
          </div>
          <button className="primary-button" type="submit">추가하기</button>
        </form>
      )}

      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 담당자, 상태 검색" /></label>
        <span>{filtered.length}명</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyPanel icon={Users} title={guests.length ? '검색 결과가 없습니다' : '게스트 파이프라인이 비어 있습니다'} description="Notion 데이터는 아직 이전하지 않았습니다. 신규 섭외 건부터 이곳에서 시작할 수 있습니다." />
      ) : (
        <section className="guest-table-wrap">
          <table className="guest-table">
            <thead><tr><th>게스트</th><th>상태</th><th>담당자</th><th>연락처</th><th></th></tr></thead>
            <tbody>
              {filtered.map((guest) => (
                <tr key={guest.id}>
                  <td><strong>{guest.name}</strong><small>{guest.note || '메모 없음'}</small></td>
                  <td><select value={guest.status} onChange={(e) => onUpdate(guest.id, { status: e.target.value })}>{GUEST_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
                  <td>{guest.owner || '미정'}</td>
                  <td>{guest.contact || '-'}</td>
                  <td><button className="icon-button danger" onClick={() => onDelete(guest.id)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [theme, setTheme] = useState(getInitialTheme);
  const isEmbedded = window !== window.top;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    const applyTheme = (nextTheme) => {
      setTheme(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.body.classList.toggle('light-theme', nextTheme === 'light');
    };
    applyTheme(theme);
    const receiveMessage = (event) => {
      if (event.data?.type === 'SET_THEME') applyTheme(event.data.theme);
      if (event.data?.type === 'TOGGLE_SIDEBAR') setSidebarOpen((open) => !open);
    };
    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, []);

  useEffect(() => {
    if (isEmbedded) window.parent.postMessage({ type: 'SIDEBAR_STATE', active: sidebarOpen }, '*');
  }, [isEmbedded, sidebarOpen]);

  useEffect(() => {
    const syncViewport = () => {
      setViewportWidth(window.innerWidth);
      if (window.innerWidth > 1200) setSidebarOpen(false);
    };
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const activeLabel = useMemo(() => NAV_ITEMS.find((item) => item.id === activeView)?.label, [activeView]);
  const sidebarExpanded = viewportWidth > 1200 ? !sidebarCollapsed : sidebarOpen;
  const navigate = (view) => { setActiveView(view); if (window.innerWidth <= 1200) setSidebarOpen(false); };
  const toggleSidebar = () => {
    if (window.innerWidth > 1200) setSidebarCollapsed((collapsed) => !collapsed);
    else setSidebarOpen((open) => !open);
  };
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('artic-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.body.classList.toggle('light-theme', next === 'light');
  };
  const addRecord = (collection, record) => setWorkspace((current) => ({ ...current, [collection]: [...current[collection], { ...record, id: crypto.randomUUID() }] }));
  const updateRecord = (collection, id, patch) => setWorkspace((current) => ({ ...current, [collection]: current[collection].map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const deleteRecord = (collection, id) => setWorkspace((current) => ({ ...current, [collection]: current[collection].filter((item) => item.id !== id) }));

  return (
    <div className={`workspace-shell ${isEmbedded ? 'embedded' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="workspace-sidebar">
        <button className="project-mark" onClick={() => navigate('overview')}>
          <span>TN</span><div className="sidebar-label"><strong>Tasting Note</strong><small>Project Manager</small></div>
        </button>
        <div className="sidebar-toggle-wrap"><button className="sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarExpanded ? '메뉴 축소' : '메뉴 확대'} aria-expanded={sidebarExpanded}>{sidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}<span className="sidebar-label">{sidebarExpanded ? (viewportWidth > 1200 ? '메뉴 축소' : '메뉴 닫기') : '메뉴 확대'}</span></button></div>
        <nav>
          {['PROJECT', 'OPERATIONS', 'MANAGEMENT'].map((group) => <div className="nav-group" key={group}><span className="nav-group-label sidebar-label">{group}</span>{NAV_ITEMS.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'active' : ''} onClick={() => navigate(id)} title={label}><Icon size={18} /><span className="sidebar-label">{label}</span></button>)}</div>)}
        </nav>
        <div className="sidebar-note"><span className="sync-dot" /><span className="sidebar-label">Notion 병행 운영<small>Firestore 연결 전</small></span></div>
      </aside>

      {sidebarOpen && <button className="mobile-scrim" aria-label="메뉴 닫기" onClick={() => setSidebarOpen(false)} />}

      <main className="workspace-main">
        {!isEmbedded && <header className="workspace-header"><button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div><span className="header-path">TNT /</span><strong>{activeLabel}</strong></div><div className="header-actions"><a href="https://app.notion.com/p/26dffc3c3af58095bb20fd89297d34a0" target="_blank" rel="noreferrer" title="Notion 원본 열기"><ExternalLink size={17} /></a><button onClick={toggleTheme} title="테마 변경">{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button></div></header>}

        <div className="workspace-content">
          {activeView === 'overview' && <Overview workspace={workspace} onNavigate={navigate} />}
          {activeView === 'project' && <ProjectPage />}
          {activeView === 'episodes' && <Episodes episodes={workspace.episodes} checklist={workspace.checklist} onAdd={(record) => addRecord('episodes', record)} onUpdate={(id, patch) => updateRecord('episodes', id, patch)} onDelete={(id) => deleteRecord('episodes', id)} onToggleCheck={(index) => setWorkspace((current) => ({ ...current, checklist: { ...current.checklist, [index]: !current.checklist[index] } }))} />}
          {activeView === 'guests' && <Guests guests={workspace.guests} onAdd={(record) => addRecord('guests', record)} onUpdate={(id, patch) => updateRecord('guests', id, patch)} onDelete={(id) => deleteRecord('guests', id)} />}
          {activeView === 'production' && <ProductionPage checklist={workspace.checklist} onToggleCheck={(index) => setWorkspace((current) => ({ ...current, checklist: { ...current.checklist, [index]: !current.checklist[index] } }))} />}
          {activeView === 'resources' && <TrackerPage kind="resources" title="장소 · 장비" eyebrow="PRODUCTION RESOURCES" description="촬영 장소 후보, 예약 상태와 회차별 장비 준비를 관리합니다." records={workspace.resources} onAdd={(record) => addRecord('resources', record)} onUpdate={(id, patch) => updateRecord('resources', id, patch)} onDelete={(id) => deleteRecord('resources', id)} />}
          {activeView === 'settlement' && <SettlementPanel />}
          {activeView === 'meetings' && <MeetingsPage meetings={workspace.meetings} onAdd={(record) => addRecord('meetings', record)} onUpdate={(id, patch) => updateRecord('meetings', id, patch)} onDelete={(id) => deleteRecord('meetings', id)} />}
          {activeView === 'partnerships' && <TrackerPage kind="partnerships" title="PPL · 협찬" eyebrow="PARTNERSHIPS" description="브랜드 제안, 협찬 패키지와 회차별 노출 협의를 추적합니다." records={workspace.partnerships} onAdd={(record) => addRecord('partnerships', record)} onUpdate={(id, patch) => updateRecord('partnerships', id, patch)} onDelete={(id) => deleteRecord('partnerships', id)} />}
        </div>
      </main>
    </div>
  );
}
