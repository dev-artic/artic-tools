/* ===================================
   Artic PTR — Pay Table Dashboard
   app.js
=================================== */

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDeJrfj6Oz5yklVdTqZXPtbwE4Rz57AXrM",
  authDomain: "artic-ptr-paytable.firebaseapp.com",
  projectId: "artic-ptr-paytable",
  storageBucket: "artic-ptr-paytable.firebasestorage.app",
  messagingSenderId: "38387099281",
  appId: "1:38387099281:web:ae82ec20509e5dc2bd8130",
  measurementId: "G-L7X886BBW4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const FIRESTORE_COL = 'paytable';
const FIRESTORE_DOC = 'main';

// ============================================================
// DEFAULT DATA MODEL (Fallback if data.json is inaccessible)
// ============================================================
const DEFAULT_DATA = {
  project: {
    name: 'artic. PTR',
    season: 1,
    totalEpisodes: 12,
    contractAmount: 3800000,
    receivedAmount: 1800000,
    laborCost: 1276560,
    profit: 523440,
    pplTotal: 1400000,
    blackmagicCost: 64025,
  },
  members: ['민제', '광규', '경엽', '정호'],
  credentials: {
    '민제': '1211',
    '광규': '1211',
    '경엽': '0128',
    '정호': '0000',
  },
  memberColors: {
    '민제':  'linear-gradient(135deg, #4f8ef7, #7c5ff5)',
    '광규':  'linear-gradient(135deg, #3ecf8e, #22b8e0)',
    '경엽':  'linear-gradient(135deg, #f5c842, #f59e0b)',
    '정호':  'linear-gradient(135deg, #f87171, #ec4899)',
  },
  roles: [
    {
      id: 'planning',
      name: '기획',
      area: '기획',
      description: '[리허설 포함] + 에피소드 별 기획회의',
      unitCostPerEp: 63080,
      headcount: 4,
      unitCostPerPerson: 15770,
      includesRehearsal: true,
      episodeCount: 13,
    },
    {
      id: 'dop',
      name: 'D.O.P.',
      area: '촬영',
      description: '[리허설 포함] 총괄 촬영감독',
      unitCostPerEp: 20000,
      headcount: 1,
      unitCostPerPerson: 20000,
      includesRehearsal: true,
      episodeCount: 13,
    },
    {
      id: 'camera_staff',
      name: '촬영 스태프',
      area: '촬영',
      description: '현장 어시스턴트, 카메라 오퍼레이팅',
      unitCostPerEp: 30000,
      headcount: 2,
      unitCostPerPerson: 15000,
      includesRehearsal: false,
      episodeCount: 12,
    },
    {
      id: 'edit_a',
      name: '편집-A',
      area: '편집',
      description: '내용 - 관련 미디어 조사 및 컷 흐름 편집',
      unitCostPerEp: 25000,
      headcount: 1,
      unitCostPerPerson: 25000,
      includesRehearsal: false,
      episodeCount: 12,
    },
    {
      id: 'edit_a_assist',
      name: '편집-A (어시)',
      area: '편집',
      description: '내용 - 관련 미디어 조사 및 컷 흐름 편집 보조',
      unitCostPerEp: 15000,
      headcount: 1,
      unitCostPerPerson: 15000,
      includesRehearsal: false,
      episodeCount: 12,
    },
    {
      id: 'edit_b',
      name: '편집-B',
      area: '편집',
      description: '미감 - DI, 그래픽 디자인, 애니메이팅',
      unitCostPerEp: 25000,
      headcount: 1,
      unitCostPerPerson: 25000,
      includesRehearsal: false,
      episodeCount: 12,
    },
    {
      id: 'edit_b_assist',
      name: '편집-B (어시)',
      area: '편집',
      description: '미감 - DI, 그래픽 디자인, 애니메이팅 보조',
      unitCostPerEp: 15000,
      headcount: 1,
      unitCostPerPerson: 15000,
      includesRehearsal: false,
      episodeCount: 12,
    },
  ],
  episodes: [
    { index: 0, label: '리허설', paid: true,  settled: true,  artists: [],         ppl: 0, targetAmount: 0, receivedAmount: 0 },
    { index: 1, label: 'EP.1',   paid: true,  settled: true,  artists: ['자이언티'],  ppl: 0, targetAmount: 200000, receivedAmount: 200000 },
    { index: 2, label: 'EP.2',   paid: true,  settled: true,  artists: ['권기백'],   ppl: 0, targetAmount: 200000, receivedAmount: 200000 },
    { index: 3, label: 'EP.3',   paid: true,  settled: true,  artists: ['세이수미'],  ppl: 0, targetAmount: 200000, receivedAmount: 200000 },
    { index: 4, label: 'EP.4',   paid: true,  settled: true,  artists: ['주영'],     ppl: 600000, targetAmount: 200000, receivedAmount: 200000 },
    { index: 5, label: 'EP.5',   paid: true,  settled: true,  artists: ['제이클레프'], ppl: 0, targetAmount: 200000, receivedAmount: 200000 },
    { index: 6, label: 'EP.6',   paid: true,  settled: true,  artists: ['까xOL'],   ppl: 0, targetAmount: 200000, receivedAmount: 200000 },
    { index: 7, label: 'EP.7',   paid: false, settled: false, artists: ['차승우'],   ppl: 800000, targetAmount: 200000, receivedAmount: 0 },
    { index: 8, label: 'EP.8',   paid: false, settled: false, artists: [],          ppl: 0, targetAmount: 200000, receivedAmount: 0 },
    { index: 9, label: 'EP.9',   paid: false, settled: false, artists: [],          ppl: 0, targetAmount: 200000, receivedAmount: 0 },
    { index: 10, label: 'EP.10', paid: false, settled: false, artists: [],          ppl: 0, targetAmount: 200000, receivedAmount: 0 },
    { index: 11, label: 'EP.11', paid: false, settled: false, artists: [],          ppl: 0, targetAmount: 200000, receivedAmount: 0 },
    { index: 12, label: 'EP.12', paid: false, settled: false, artists: [],          ppl: 0, targetAmount: 200000, receivedAmount: 0 },
  ],
  blackmagicCosts: {
    jan: 21153,
    feb: 21239,
    mar: 21633
  },
  participation: {
    planning: {
      '민제': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '광규': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '정호': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
    },
    dop: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    camera_staff: {
      '민제': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '광규': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '정호': [true, false,false,true, false,true, false,false,false,false,false,false,false],
    },
    edit_a: {
      '민제': [false, true, true, true, true, false,false,false,false,false,false,false,false],
      '광규': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    edit_a_assist: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '경엽': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    edit_b: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    edit_b_assist: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, true, true, true, true, true, true, true, false,false,false,false,false],
    },
  },
};

// ============================================================
// STATE
// ============================================================
let DATA = {};
let isDirty = false;
let currentEpIndex = 0; // 0 = 리허설
let pendingTargetTabId = null;

// Undo / Redo History System State
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

function pushState() {
  undoStack.push(JSON.parse(JSON.stringify(DATA)));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.parse(JSON.stringify(DATA)));
  DATA = undoStack.pop();
  isDirty = true;
  recalculateProjectMetrics();
  refreshAllViews();
  updateUndoRedoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.parse(JSON.stringify(DATA)));
  DATA = redoStack.pop();
  isDirty = true;
  recalculateProjectMetrics();
  refreshAllViews();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  const undoAdminBtn = document.getElementById('btn-undo-admin');
  const redoAdminBtn = document.getElementById('btn-redo-admin');
  const undoEpBtn = document.getElementById('btn-undo-episodes');
  const redoEpBtn = document.getElementById('btn-redo-episodes');
  const hasUndo = undoStack.length > 0;
  const hasRedo = redoStack.length > 0;
  if (undoBtn) undoBtn.disabled = !hasUndo;
  if (redoBtn) redoBtn.disabled = !hasRedo;
  if (undoAdminBtn) undoAdminBtn.disabled = !hasUndo;
  if (redoAdminBtn) redoAdminBtn.disabled = !hasRedo;
  if (undoEpBtn) undoEpBtn.disabled = !hasUndo;
  if (redoEpBtn) redoEpBtn.disabled = !hasRedo;
}

function refreshAllViews() {
  renderOverview();
  renderEpisodeTab();
  renderMemberCards();
  renderMemberDetailTable();
  renderRolesGrid();
  renderIncomeTab();
  renderAdminTab();
}

/**
 * 관리자 여부 확인 헬퍼 함수
 */
function isAdmin() {
  return sessionStorage.getItem('artic-auth') === '민제';
}

function getEpisodeStatus(ep) {
  if (!ep.paid) return 'pending';
  if (!ep.settled) return 'paid';
  const hasUnsettledPpl = ep.pplPayments && ep.pplPayments.some(p => !p.settled);
  if (hasUnsettledPpl) return 'progress';
  return 'settled';
}

// ============================================================
// DATA LIFECYCLE (Load & Save & Exit Prevention)
// ============================================================

async function loadData(forceReload = false) {
  // 1. localStorage 캐시로 즉시 렌더링 (화면 깜빡임 방지)
  if (!forceReload) {
    try {
      const cached = localStorage.getItem('artic-data');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        DATA = parsedCache;
        normalizeData();
        normalizeBlackmagicCosts();
        recalculateProjectMetrics();
        console.log('Rendered from localStorage cache (fast path).');
      }
    } catch (e) {
      console.error('Failed to parse localStorage cache:', e);
    }
  }

  // 2. Firestore에서 최신 데이터 로드 (항상 최신 상태로 덮어씀)
  try {
    const docSnap = await db.collection(FIRESTORE_COL).doc(FIRESTORE_DOC).get();
    if (docSnap.exists) {
      DATA = docSnap.data();
      console.log('Successfully loaded data from Firestore.');
    } else {
      // 최초 실행: data.json을 읽어 Firestore에 업로드
      console.log('No Firestore document found. Initializing from data.json...');
      try {
        const res = await fetch('data.json');
        if (res.ok) {
          DATA = await res.json();
          await db.collection(FIRESTORE_COL).doc(FIRESTORE_DOC).set(DATA);
          console.log('Initialized Firestore from data.json.');
        }
      } catch (e) {
        DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
        await db.collection(FIRESTORE_COL).doc(FIRESTORE_DOC).set(DATA);
        console.log('Initialized Firestore from DEFAULT_DATA.');
      }
    }
  } catch (e) {
    console.warn('Firestore load failed, using cached/default data.', e);
    if (!DATA || !DATA.episodes) {
      // Firestore도 실패하고 캐시도 없으면 data.json 시도
      try {
        const res = await fetch('data.json');
        if (res.ok) DATA = await res.json();
      } catch (_) {
        DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
    }
  }

  normalizeData();
  normalizeBlackmagicCosts();
  recalculateProjectMetrics();

  // localStorage 캐시 갱신
  try {
    localStorage.setItem('artic-data', JSON.stringify(DATA));
  } catch (e) {}

  // Undo/Redo 스택 초기화
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();
}

function normalizeData() {
  if (!DATA) return;
  // settled 속성 정규화
  if (DATA.episodes) {
    for (const ep of DATA.episodes) {
      if (ep.settled === undefined) ep.settled = ep.paid;
    }
  }
  // credentials 정규화: Firestore 문서에 없으면 기본값 설정
  if (!DATA.credentials) {
    DATA.credentials = {
      '민제': '1211',
      '광규': '1211',
      '경엽': '0128',
      '정호': '0000',
    };
  }

  // invoices 정규화 및 자동 시드 생성
  if (!DATA.invoices) {
    DATA.invoices = [];
    if (DATA.episodes) {
      const matrix = buildPayMatrix();
      for (const ep of DATA.episodes) {
        if (ep.settled) {
          const details = [];
          let totalAmount = 0;
          for (const m of DATA.members) {
            let basePay = 0;
            for (const role of DATA.roles) {
              const rolePay = calcEpisodeRolePay(role.id, ep.index);
              basePay += (rolePay[m] || 0);
            }
            const totalPay = matrix[m][ep.index] || 0;
            const pplPay = totalPay - basePay;
            details.push({
              member: m,
              base: basePay,
              ppl: pplPay,
              total: totalPay
            });
            totalAmount += totalPay;
          }
          
          let dateStr = '2026-05-27';
          if (ep.index === 1) dateStr = '2026-05-01';
          if (ep.index === 2) dateStr = '2026-05-05';
          if (ep.index === 3) dateStr = '2026-05-10';
          if (ep.index === 4) dateStr = '2026-05-15';
          if (ep.index === 5) dateStr = '2026-05-20';
          if (ep.index === 6) dateStr = '2026-05-25';
          
          DATA.invoices.push({
            id: `INV-${1000 + ep.index}`,
            episodeIndex: ep.index,
            episodeLabel: ep.label,
            date: dateStr,
            totalAmount: totalAmount,
            details: details
          });
        }
      }
    }
  }
}

async function saveData(silent = false) {
  // 자동 인보이스 생성/삭제 트리거
  if (DATA.episodes && DATA.invoices) {
    const matrix = buildPayMatrix();
    for (const ep of DATA.episodes) {
      if (ep.settled) {
        const exists = DATA.invoices.some(inv => inv.episodeIndex === ep.index);
        if (!exists) {
          const details = [];
          let totalAmount = 0;
          for (const m of DATA.members) {
            let basePay = 0;
            for (const role of DATA.roles) {
              const rolePay = calcEpisodeRolePay(role.id, ep.index);
              basePay += (rolePay[m] || 0);
            }
            const totalPay = matrix[m][ep.index] || 0;
            const pplPay = totalPay - basePay;
            details.push({
              member: m,
              base: basePay,
              ppl: pplPay,
              total: totalPay
            });
            totalAmount += totalPay;
          }
          
          const todayStr = new Date().toISOString().split('T')[0];
          DATA.invoices.push({
            id: `INV-${Date.now().toString().slice(-6)}`,
            episodeIndex: ep.index,
            episodeLabel: ep.label,
            date: todayStr,
            totalAmount: totalAmount,
            details: details
          });
        }
      } else {
        const invIdx = DATA.invoices.findIndex(inv => inv.episodeIndex === ep.index);
        if (invIdx !== -1) {
          DATA.invoices.splice(invIdx, 1);
        }
      }
    }
  }

  // localStorage 즉시 업데이트 (빠른 캐시)
  try {
    localStorage.setItem('artic-data', JSON.stringify(DATA));
  } catch (e) {}
  isDirty = false;

  const adminBtn = document.getElementById('btn-save-admin');
  const rolesBtn = document.getElementById('btn-save-roles');
  const episodesBtn = document.getElementById('btn-save-episodes');
  const buttons = [];
  if (adminBtn) buttons.push(adminBtn);
  if (rolesBtn) buttons.push(rolesBtn);
  if (episodesBtn) buttons.push(episodesBtn);

  if (!silent) {
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = `<svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite; margin-right: 6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"/></svg> 저장 중...`;
    });
  }

  try {
    await db.collection(FIRESTORE_COL).doc(FIRESTORE_DOC).set(DATA);
    console.log('Successfully saved to Firestore.');

    if (!silent) {
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = `
          <svg class="save-success-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px; vertical-align: middle;">
            <path class="cloud-path" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
            <polyline class="check-path" points="9 15 12 18 16 11"></polyline>
          </svg>
          저장 완료
        `;
        btn.classList.add('btn-save-completed');
        setTimeout(() => {
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: middle;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 저장`;
          btn.classList.remove('btn-save-completed');
        }, 2500);
      });
    }
  } catch (err) {
    console.error('Firestore save failed:', err);
    if (!silent) {
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = `⚠️ 저장 실패 (재시도)`;
        setTimeout(() => {
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 저장`;
        }, 3000);
      });
    }
  }
}


// Exit prevention via beforeunload
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = '변경된 사항이 있습니다. 저장하시겠습니까?';
  }
});

// ============================================================
// CORE CALCULATION ENGINE
// ============================================================

/**
 * 다중 역할 멤버 여부 확인
 * 특정 에피소드에서 특정 멤버가 몇 개의 역할에 참여하는지 반환
 */
function getMemberRoleCountInEp(memberName, epIndex) {
  let count = 0;
  for (const role of DATA.roles) {
    if (epIndex === 0 && !role.includesRehearsal) continue;
    const p = DATA.participation[role.id];
    if (p && p[memberName] && p[memberName][epIndex]) count++;
  }
  return count;
}

/**
 * 특정 에피소드, 특정 역할에서
 * 각 멤버가 받아야 할 금액을 계산한다.
 *
 * 엑셀 수식 조정 요구사항:
 * - DOP: 에피소드당 딱 1명으로 한정 (DOP 체크 시 라디오 버튼처럼 동작).
 * - 기획 역할: 본래 역할 총 예산 (unitCostPerPerson * 4 = 63,080원)을 참여 인원수로 나누어 배분. (3명이면 3분의 1, 2명이면 2분의 1...)
 * - 촬영 스태프: 현장 참여 인원별로 무조건 인당 15,000 KRW 고정 지급.
 * - 모든 편집 카테고리의 역할 (edit_a, edit_a_assist, edit_b, edit_b_assist):
 *   역할 총 예산 (unitCostPerPerson * headcount = unitCostPerEp)을 참여 인원수로 나누어 배분.
 * - 리허설이 없는 역할에서는 index=0 에피소드 지급 없음
 */
function calcEpisodeRolePay(roleId, epIndex) {
  const role = DATA.roles.find(r => r.id === roleId);
  const epPart = DATA.participation[roleId];

  if (!epPart) return {};

  // 리허설 포함 여부 체크
  if (epIndex === 0 && !role.includesRehearsal) {
    return {};
  }

  // 이 에피소드에서 이 역할에 참여 체크된 멤버들
  const allParticipants = DATA.members.filter(m => epPart[m] && epPart[m][epIndex]);
  if (allParticipants.length === 0) return {};

  const result = {};

  let totalForRole = role.unitCostPerPerson * role.headcount;

  let eligibleParticipants = allParticipants;

  // 중요 비즈니스 룰: 촬영 스태프(camera_staff) 역할 배분 시, DOP에 체크되어 있는 멤버는 스태프 페이 수령에서 전격 배제한다!
  if (roleId === 'camera_staff') {
    const dopParticipants = DATA.members.filter(m => {
      const dopPart = DATA.participation['dop'];
      return dopPart && dopPart[m] && dopPart[m][epIndex];
    });
    eligibleParticipants = allParticipants.filter(m => !dopParticipants.includes(m));
  }

  if (eligibleParticipants.length === 0) return {};

  const perPersonAmount = Math.round(totalForRole / eligibleParticipants.length);

  for (const member of eligibleParticipants) {
    result[member] = perPersonAmount;
  }

  return result;
}

function calcMemberEpisodePay(memberName, epIndex) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return 0;

  // 1. 제작비 역할 페이 계산
  let basePay = 0;
  for (const role of DATA.roles) {
    const rolePay = calcEpisodeRolePay(role.id, epIndex);
    basePay += (rolePay[memberName] || 0);
  }

  // 2. 이 에피소드에 참여한 모든 인원의 총 제작비 페이 합산
  let epTotalBasePay = 0;
  for (const role of DATA.roles) {
    const rolePay = calcEpisodeRolePay(role.id, epIndex);
    for (const val of Object.values(rolePay)) {
      epTotalBasePay += val;
    }
  }

  // 3. PPL 지분 계산 (제작비 비례 정산)
  let pplPay = 0;
  const ratio = epTotalBasePay > 0 ? (basePay / epTotalBasePay) : (1 / DATA.members.length);

  // 이 에피소드 내 PPL 중 '입금 및 정산 완료된' ppl 항목 합산
  if (ep.pplPayments && ep.pplPayments.length > 0) {
    const settledPplTotal = ep.pplPayments
      .filter(p => p.paid && p.settled)
      .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
    pplPay = Math.round(settledPplTotal * ratio);
  }

  return basePay + pplPay;
}

function calcEpisodeTotalPay(epIndex) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return 0;

  let baseTotal = 0;
  for (const role of DATA.roles) {
    const rolePay = calcEpisodeRolePay(role.id, epIndex);
    for (const v of Object.values(rolePay)) baseTotal += v;
  }

  let pplTotal = 0;
  if (ep.pplPayments && ep.pplPayments.length > 0) {
    pplTotal = ep.pplPayments
      .filter(p => p.paid && p.settled)
      .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
  }

  return baseTotal + pplTotal;
}

/**
 * 특정 에피소드에서 복수 역할을 담당하는 멤버 목록 반환
 */
function getMultiRoleMembers(epIndex) {
  const roleCount = {};
  for (const role of DATA.roles) {
    // 리허설 포함 여부
    if (epIndex === 0 && !role.includesRehearsal) continue;
    const epPart = DATA.participation[role.id];
    if (!epPart) continue;
    for (const m of DATA.members) {
      if (epPart[m] && epPart[m][epIndex]) {
        roleCount[m] = (roleCount[m] || 0) + 1;
      }
    }
  }
  return Object.entries(roleCount)
    .filter(([, cnt]) => cnt > 1)
    .map(([name, cnt]) => ({ name, count: cnt }));
}

/**
 * 멤버별 에피소드별 금액 매트릭스 반환
 * result[memberName][epIndex] = amount
 */
function buildPayMatrix() {
  const matrix = {};
  for (const m of DATA.members) {
    matrix[m] = {};
    for (const ep of DATA.episodes) {
      matrix[m][ep.index] = calcMemberEpisodePay(m, ep.index);
    }
  }
  return matrix;
}

/**
 * 멤버별 합계
 */
function getMemberTotals() {
  const matrix = buildPayMatrix();
  const totals = {};
  for (const m of DATA.members) {
    totals[m] = Object.values(matrix[m]).reduce((a, b) => a + b, 0);
  }
  return totals;
}

/**
 * 클라이언트로부터 입금 완료(paid: true) 되었으나 멤버에게 정산되지 않은(settled: false) 회차의 멤버별 금액 합계
 * '이번에 입금될 금액'
 */
function getMemberToReceive(memberName) {
  const matrix = buildPayMatrix();
  let total = 0;
  for (const ep of DATA.episodes) {
    if (ep.paid && !ep.settled) {
      total += matrix[memberName][ep.index] || 0;
    }

    // PPL 중 보코스 입금 완료 & 아틱팀 정산 대기 상태인 항목 비율 배분하여 누적
    if (ep.pplPayments && ep.pplPayments.length > 0) {
      let basePay = 0;
      let epTotalBasePay = 0;
      for (const role of DATA.roles) {
        const rolePay = calcEpisodeRolePay(role.id, ep.index);
        basePay += (rolePay[memberName] || 0);
        for (const val of Object.values(rolePay)) {
          epTotalBasePay += val;
        }
      }
      const ratio = epTotalBasePay > 0 ? (basePay / epTotalBasePay) : (1 / DATA.members.length);
      
      const toReceivePpl = ep.pplPayments
        .filter(p => p.paid && !p.settled)
        .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
      total += Math.round(toReceivePpl * ratio);
    }
  }
  return total;
}

/**
 * 멤버에게 실제로 정산 완료(settled: true)된 회차들의 누적 정산 완료액 합산
 */
function getMemberAccumulatedReceived(memberName) {
  const matrix = buildPayMatrix();
  let total = 0;
  for (const ep of DATA.episodes) {
    if (ep.settled) {
      total += matrix[memberName][ep.index] || 0;
    }
  }
  return total;
}

/**
 * 특정 멤버가 특정 에피소드에서 어떤 역할로 참여했는지 그 역할명들의 배열 반환
 */
function getMemberRolesInEpisode(memberName, epIndex) {
  const roles = [];
  for (const role of DATA.roles) {
    if (epIndex === 0 && !role.includesRehearsal) continue;
    const epPart = DATA.participation[role.id];
    if (epPart && epPart[memberName] && epPart[memberName][epIndex]) {
      roles.push(role.name);
    }
  }
  return roles;
}

/**
 * 아직 클라이언트로부터 입금도 되지 않은(paid: false) 회차의 멤버별 수령 예정액 합계
 * '누적 수령 예정액'
 */
function getMemberUnpaidAccumulated(memberName) {
  let total = 0;
  for (const ep of DATA.episodes) {
    let basePay = 0;
    let epTotalBasePay = 0;
    for (const role of DATA.roles) {
      const rolePay = calcEpisodeRolePay(role.id, ep.index);
      basePay += (rolePay[memberName] || 0);
      for (const val of Object.values(rolePay)) {
        epTotalBasePay += val;
      }
    }
    const ratio = epTotalBasePay > 0 ? (basePay / epTotalBasePay) : (1 / DATA.members.length);

    if (!ep.paid && !ep.settled) {
      total += basePay;
    }

    if (ep.pplPayments && ep.pplPayments.length > 0) {
      const unpaidPpl = ep.pplPayments
        .filter(p => !p.paid && !p.settled)
        .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
      total += Math.round(unpaidPpl * ratio);
    }
  }
  return total;
}

// ============================================================
// FORMAT UTILS
// ============================================================
function formatKRW(amount) {
  if (amount === 0) return '₩0';
  return '₩' + amount.toLocaleString('ko-KR');
}

function formatKRWShort(amount) {
  return '₩' + amount.toLocaleString('ko-KR');
}

// 입력 콤마 실시간 포맷팅 헬퍼
function formatMonetaryInput(input) {
  let rawValue = input.value.replace(/[^\d]/g, '');
  if (rawValue === '') {
    input.value = '';
    return;
  }
  let numericVal = parseInt(rawValue, 10);
  if (isNaN(numericVal)) {
    input.value = '';
    return;
  }
  
  let selectionStart = input.selectionStart;
  let originalLength = input.value.length;
  
  let formatted = numericVal.toLocaleString('ko-KR');
  input.value = formatted;
  
  let newLength = formatted.length;
  let diff = newLength - originalLength;
  input.setSelectionRange(selectionStart + diff, selectionStart + diff);
}

// 콤마 제거 후 숫자로 파싱하는 헬퍼
function parseKRWString(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let clean = String(val).replace(/,/g, '');
  let parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================================
// TAB NAVIGATION (Dirty check exit alert implemented)
// ============================================================
async function switchTab(tabId) {
  const adminTabs = ['admin', 'roles', 'episodes'];
  if (adminTabs.includes(tabId) && !isAdmin()) {
    alert('해당 페이지는 관리자(김민제)만 접근 가능합니다.');
    return;
  }

  // 변경사항이 있을 때 시스템 confirm 팝업 대신 커스텀 우하단 그래픽 팝업을 띄우고 원래 탭 유지
  if (isDirty) {
    pendingTargetTabId = tabId;
    showNavGuardPopup();
    return;
  }

  executeTabSwitch(tabId);
}

function executeTabSwitch(tabId) {
  // 모바일 드로어 메뉴 및 오버레이 닫기
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && sidebar.classList.contains('active')) {
    sidebar.classList.remove('active');
  }
  if (overlay && overlay.classList.contains('active')) {
    overlay.classList.remove('active');
  }

  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');

  // 각 탭 전환 시 UI를 실시간 다시 그리도록 연동
  if (tabId === 'overview') renderOverview();
  if (tabId === 'episodes') renderEpisodeTab();
  if (tabId === 'members') { renderMemberCards(); renderMemberDetailTable(); }
  if (tabId === 'roles') renderRolesGrid();
  if (tabId === 'income') renderIncomeTab();
  if (tabId === 'admin') renderAdminTab();
  if (tabId === 'account') renderAccountTab();
}

function showNavGuardPopup() {
  const popup = document.getElementById('nav-guard-popup');
  if (popup) {
    popup.classList.add('show');
  }
}

function hideNavGuardPopup() {
  const popup = document.getElementById('nav-guard-popup');
  if (popup) {
    popup.classList.remove('show');
  }
}

function cancelNavGuard() {
  hideNavGuardPopup();
  pendingTargetTabId = null;
  // 원래 탭이 고스란히 그대로 유지됩니다 (저장되지 않은 작업 유지)
}

async function confirmNavGuardSave() {
  hideNavGuardPopup();
  if (pendingTargetTabId) {
    await saveData();
    isDirty = false;
    const target = pendingTargetTabId;
    pendingTargetTabId = null;
    executeTabSwitch(target);
  }
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function renderOverview() {
  // 수치 업데이트
  recalculateProjectMetrics();

  // KPI 요소 업데이트
  document.getElementById('kpi-contract').textContent = formatKRW(DATA.project.contractAmount);
  document.getElementById('kpi-received').textContent = formatKRW(DATA.project.receivedAmount);
  document.getElementById('kpi-remaining').textContent = formatKRW(DATA.project.contractAmount - DATA.project.receivedAmount);
  document.getElementById('kpi-cost').textContent = formatKRW(DATA.project.laborCost);
  document.getElementById('kpi-ppl').textContent = formatKRW(DATA.project.pplTotal);
  document.getElementById('kpi-profit').textContent = formatKRW(DATA.project.profit);

  // 진행률 진행바 및 텍스트 갱신
  const progressPercent = DATA.project.contractAmount > 0 ? (DATA.project.receivedAmount / DATA.project.contractAmount * 100) : 0;
  const progressBar = document.getElementById('overview-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
    progressBar.querySelector('.progress-label').textContent = `${progressPercent.toFixed(1)}%`;
  }
  const currentText = document.getElementById('progress-current-text');
  if (currentText) {
    currentText.textContent = formatKRW(DATA.project.receivedAmount);
  }
  const targetText = document.querySelector('.progress-target');
  if (targetText) {
    targetText.textContent = ` / ${formatKRW(DATA.project.contractAmount)}`;
  }

  // 입금 완료 배지 동적 업데이트
  const paidEps = DATA.episodes.filter(ep => ep.index > 0 && ep.paid);
  const progressEpBadge = document.getElementById('progress-ep-badge');
  if (progressEpBadge) {
    if (paidEps.length > 0) {
      const labels = paidEps.map(ep => ep.label.replace('EP.', ''));
      progressEpBadge.textContent = `EP.${labels.join(',')} 입금 완료`;
    } else {
      progressEpBadge.textContent = '입금 완료 회차 없음';
    }
  }

  // Episode dots in progress bar
  const dotsEl = document.getElementById('episode-dots');
  if (dotsEl) {
    dotsEl.innerHTML = '';
    for (const ep of DATA.episodes) {
      const dot = document.createElement('div');
      const status = getEpisodeStatus(ep);
      let statusClass = 'pending';
      let checkIcon = '';
      if (status === 'settled') {
        statusClass = 'settled';
        checkIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (status === 'progress') {
        statusClass = 'progress';
        checkIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (status === 'paid') {
        statusClass = 'paid';
        checkIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      }
      dot.className = `ep-dot ${statusClass}`;
      dot.innerHTML = `
        <span>${ep.label}</span>
        ${checkIcon}
      `;
      dotsEl.appendChild(dot);
    }
  }

  // Member summary table
  renderMemberSummaryTable('member-summary-tbody', 'member-summary-table');
}

function renderMemberSummaryTable(tbodyId, tableId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const matrix = buildPayMatrix();

  // 동적 테이블 헤더 갱신
  const table = document.getElementById(tableId);
  if (table) {
    const thead = table.querySelector('thead');
    if (thead) {
      let headCells = `<tr><th>멤버</th>`;
      for (const ep of DATA.episodes) {
        headCells += `<th class="text-right">${ep.label}</th>`;
      }
      headCells += `<th class="text-right highlight-col">합계</th></tr>`;
      thead.innerHTML = headCells;
    }
  }

  tbody.innerHTML = '';
  const totals = getMemberTotals();
  let colSums = new Array(DATA.episodes.length).fill(0);
  const shown = DATA.episodes.map(ep => ep.index);

  for (const m of DATA.members) {
    const tr = document.createElement('tr');
    let cells = `<td><span class="member-tag">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
      ${m}
    </span></td>`;

    for (const i of shown) {
      const amt = matrix[m][i] || 0;
      colSums[i] += amt;
      cells += `<td class="text-right mono ${amt > 0 ? '' : 'text-muted'}">${amt > 0 ? formatKRW(amt) : '—'}</td>`;
    }
    cells += `<td class="text-right highlight-col">${formatKRW(totals[m])}</td>`;
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  }

  // SUM row
  const sumTr = document.createElement('tr');
  sumTr.className = 'total-row';
  let sumCells = `<td><strong>합계</strong></td>`;
  let grandTotal = 0;
  for (const i of shown) {
    grandTotal += (colSums[i] || 0);
    sumCells += `<td class="text-right mono">${formatKRW(colSums[i] || 0)}</td>`;
  }
  sumCells += `<td class="text-right highlight-col">${formatKRW(grandTotal)}</td>`;
  sumTr.innerHTML = sumCells;
  tbody.appendChild(sumTr);
}

// ============================================================
// EPISODES TAB
// ============================================================
function renderEpisodeChips() {
  const el = document.getElementById('ep-chips');
  if (!el) return;
  el.innerHTML = '';
  for (const ep of DATA.episodes) {
    const chip = document.createElement('div');
    
    const status = getEpisodeStatus(ep);
    let statusClass = 'chip-pending';
    let checkMark = '';
    if (status === 'settled') {
      statusClass = 'chip-settled';
      checkMark = ' ✓';
    } else if (status === 'progress') {
      statusClass = 'chip-progress';
      checkMark = ' ✓';
    } else if (status === 'paid') {
      statusClass = 'chip-paid';
      checkMark = ' ✓';
    }
    
    chip.className = `ep-chip ${ep.index === currentEpIndex ? 'active' : ''} ${statusClass}`;
    chip.textContent = ep.label + checkMark;
    chip.onclick = () => { currentEpIndex = ep.index; renderEpisodeTab(); };
    el.appendChild(chip);
  }
}

function renderEpisodeTab() {
  const ep = DATA.episodes[currentEpIndex];
  if (!ep) return;

  // Label
  const labelEl = document.getElementById('ep-current-label');
  const prevBtn = document.getElementById('ep-prev');
  const nextBtn = document.getElementById('ep-next');
  if (labelEl) {
    let badgeHtml = '';
    const status = getEpisodeStatus(ep);
    if (status === 'settled') {
      badgeHtml = `<span class="badge badge-blue" style="margin-left:8px;font-size:0.75rem;padding:2px 8px;vertical-align:middle;cursor:default; background-color: rgba(79, 142, 247, 0.15); color: #4f8ef7; border: 1px solid rgba(79, 142, 247, 0.25);">정산 완료 ✓</span>`;
    } else if (status === 'progress') {
      badgeHtml = `<span class="badge badge-yellow" style="margin-left:8px;font-size:0.75rem;padding:2px 8px;vertical-align:middle;cursor:default; background-color: rgba(245, 200, 66, 0.15); color: var(--accent-yellow); border: 1px solid rgba(245, 200, 66, 0.25);">정산 진행중</span>`;
    } else if (status === 'paid') {
      badgeHtml = `<span class="badge badge-green" style="margin-left:8px;font-size:0.75rem;padding:2px 8px;vertical-align:middle;cursor:default;">정산 대기</span>`;
    } else {
      badgeHtml = `<span class="badge badge-gray" style="margin-left:8px;font-size:0.75rem;padding:2px 8px;vertical-align:middle;cursor:default; background-color: var(--bg-hover); color: var(--text-secondary); border: 1px solid var(--border); opacity:0.8;">입금 대기</span>`;
    }
    labelEl.innerHTML = `${ep.label} ${badgeHtml}`;
  }
  if (prevBtn) prevBtn.disabled = currentEpIndex === 0;
  if (nextBtn) nextBtn.disabled = currentEpIndex >= DATA.episodes.length - 1;

  renderEpisodeChips();

  // Artists
  const artistEl = document.getElementById('ep-artist-display');
  if (artistEl) {
    artistEl.innerHTML = '';
    if (ep.artists && ep.artists.length > 0) {
      ep.artists.forEach(art => {
        const span = document.createElement('span');
        span.className = 'artist-badge';
        span.textContent = art;
        artistEl.appendChild(span);
      });
    } else {
      artistEl.innerHTML = '<span class="text-muted" style="font-size:0.85rem">게스트 없음</span>';
    }
  }

  // PPL
  const pplEl = document.getElementById('ep-ppl-amount');
  const pplLabelEl = document.getElementById('ep-ppl-label');
  if (pplEl) {
    pplEl.textContent = formatKRW(ep.ppl || 0);
  }
  if (pplLabelEl) {
    pplLabelEl.textContent = ep.ppl > 0 ? 'PPL 수입 있음' : 'PPL 없음';
  }

  // Render role table
  renderEpisodeRoleTable();
}

function renderEpisodeRoleTable() {
  const ep = DATA.episodes[currentEpIndex];
  if (!ep) return;

  const tbody = document.getElementById('ep-role-tbody');
  const totalEl = document.getElementById('ep-grand-total');
  const badgeEl = document.getElementById('ep-total-badge');

  if (!tbody) return;
  tbody.innerHTML = '';
  let grandTotal = 0;
  let shootRendered = false;

  // Local helper to render the integrated Shooting row
  function renderIntegratedShootRow() {
    const dopRole = DATA.roles.find(r => r.id === 'dop');
    const staffRole = DATA.roles.find(r => r.id === 'camera_staff');

    const dopPay = calcEpisodeRolePay('dop', currentEpIndex);
    const staffPay = calcEpisodeRolePay('camera_staff', currentEpIndex);

    const dopTotal = Object.values(dopPay).reduce((a, b) => a + b, 0);
    const staffTotal = Object.values(staffPay).reduce((a, b) => a + b, 0);
    const shootTotal = dopTotal + staffTotal;
    grandTotal += shootTotal;

    const isDopApplicable = !(currentEpIndex === 0 && !dopRole.includesRehearsal);
    const isStaffApplicable = !(currentEpIndex === 0 && !staffRole.includesRehearsal);

    const participantHtml = DATA.members.map(m => {
      const hasDop = DATA.participation['dop'] && DATA.participation['dop'][m] && DATA.participation['dop'][m][currentEpIndex];
      const hasStaff = DATA.participation['camera_staff'] && DATA.participation['camera_staff'][m] && DATA.participation['camera_staff'][m][currentEpIndex];

      const isEditable = isAdmin() && !ep.settled;
      const extraStyle = isEditable ? '' : 'style="pointer-events:none;opacity:0.65;cursor:not-allowed;filter:grayscale(0.3);"';

      const staffDisabled = hasDop || !isEditable;
      const staffStyle = staffDisabled ? 'style="opacity: 0.35; pointer-events: none; cursor: not-allowed;"' : '';
      const dopStyle = isEditable ? '' : 'style="pointer-events:none;opacity:0.65;cursor:not-allowed;"';

      return `
        <div class="shoot-member-item" ${extraStyle}>
          <span class="shoot-member-name">${m}</span>
          <div class="shoot-member-actions">
            <button class="btn-shoot btn-shoot-staff ${hasStaff ? 'active' : ''}" 
              ${staffStyle}
              ${staffDisabled ? 'disabled' : ''}
              onclick="toggleShootRole('${m}', 'staff', ${currentEpIndex})" title="${hasDop ? 'D.O.P. 감독은 촬영 스태프에 지정할 수 없습니다.' : (hasStaff ? '스태프 페이 대상' : '미참여')}">스태프</button>
            <button class="btn-shoot btn-shoot-dop ${hasDop ? 'active' : ''}" 
              ${dopStyle}
              onclick="toggleShootRole('${m}', 'dop', ${currentEpIndex})" title="${hasDop ? 'D.O.P. 감독 페이 대상' : '미참여'}">👑 D.O.P.</button>
          </div>
        </div>
      `;
    }).join('');

    let ratesHtml = '';
    if (isDopApplicable) ratesHtml += `<div style="font-size:0.75rem">D.O.P. ₩20,000</div>`;
    if (isStaffApplicable) ratesHtml += `<div style="font-size:0.75rem;margin-top:2px;">스태프 ₩15,000 (기준)</div>`;
    if (ratesHtml === '') ratesHtml = '<span style="color:var(--text-muted)">—</span>';

    let paysHtml = '';
    if (isDopApplicable && dopTotal > 0) {
      paysHtml += `<div style="font-size:0.75rem">D.O.P. ${formatKRW(20000)}</div>`;
    }
    if (isStaffApplicable && staffTotal > 0) {
      const activeStaffCount = Object.keys(staffPay).length;
      const perStaffPay = activeStaffCount > 0 ? Math.round(30000 / activeStaffCount) : 0;
      if (perStaffPay > 0) {
        paysHtml += `<div style="font-size:0.75rem;margin-top:2px;">스태프 ${formatKRW(perStaffPay)}</div>`;
      }
    }
    if (paysHtml === '') paysHtml = '<span style="color:var(--text-muted)">—</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;margin-bottom:3px">촬영 역할</div>
        <span class="role-area-badge" style="background:rgba(62,207,142,0.12);color:#3ecf8e;padding:2px 7px;border-radius:100px;font-size:0.7rem;font-weight:600">촬영</span>
      </td>
      <td style="color:var(--text-secondary);font-size:0.8rem;max-width:200px">
        [리허설 포함] D.O.P. 1인 한정 및 현장 촬영 스태프 배분 (D.O.P.는 스태프 페이 자동 제외)
      </td>
      <td class="text-right mono" style="font-size:0.8rem;line-height:1.4">${ratesHtml}</td>
      <td><div class="shoot-member-group">${participantHtml}</div></td>
      <td class="text-right mono" style="font-size:0.8rem;line-height:1.4">${paysHtml}</td>
      <td class="text-right highlight-col">${shootTotal > 0 ? formatKRW(shootTotal) : '<span style="color:var(--text-muted)">—</span>'}</td>
    `;
    tbody.appendChild(tr);
  }

  for (const role of DATA.roles) {
    if (role.id === 'dop' || role.id === 'camera_staff') {
      if (!shootRendered) {
        shootRendered = true;
        renderIntegratedShootRow();
      }
      continue;
    }

    const isApplicable = !(currentEpIndex === 0 && !role.includesRehearsal);
    const rolePay = calcEpisodeRolePay(role.id, currentEpIndex);
    const participants = DATA.members.filter(m => {
      const p = DATA.participation[role.id];
      return p && p[m] && p[m][currentEpIndex];
    });
    const roleTotal = Object.values(rolePay).reduce((a, b) => a + b, 0);
    grandTotal += roleTotal;

    const areaColors = {
      '기획': 'background:rgba(79,142,247,0.15);color:#4f8ef7',
      '촬영': 'background:rgba(62,207,142,0.12);color:#3ecf8e',
      '편집': 'background:rgba(167,139,250,0.12);color:#a78bfa',
    };
    const areaStyle = areaColors[role.area] || '';

    const participantHtml = DATA.members.map(m => {
      const p = DATA.participation[role.id];
      const isChecked = p && p[m] && p[m][currentEpIndex];
      const payAmt = rolePay[m] || 0;
      const isEditable = isAdmin() && !ep.settled;
      const extraStyle = isEditable ? '' : 'style="pointer-events:none;opacity:0.65;cursor:not-allowed;filter:grayscale(0.3);"';
      return `<div class="participant-chip ${isChecked ? 'active' : ''}" ${extraStyle}
                onclick="toggleParticipation('${role.id}', '${m}', ${currentEpIndex})"
                title="${isChecked ? payAmt.toLocaleString() + '원 지급' : '미참여'}">
        <input type="checkbox" ${isChecked ? 'checked' : ''} ${isAdmin() ? '' : 'disabled'} style="display:none;" />
        ${m}
        ${isChecked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </div>`;
    }).join('');

    let perPerson = 0;
    if (participants.length > 0 && isApplicable) {
      let totalForRole = role.unitCostPerPerson * role.headcount;
      perPerson = Math.round(totalForRole / participants.length);
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;margin-bottom:3px">${role.name}</div>
        <span class="role-area-badge" style="${areaStyle};padding:2px 7px;border-radius:100px;font-size:0.7rem;font-weight:600">${role.area}</span>
      </td>
      <td style="color:var(--text-secondary);font-size:0.8rem;max-width:200px">${role.description}</td>
      <td class="text-right mono">${isApplicable ? formatKRW(role.unitCostPerPerson) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td><div class="participant-cell">${isApplicable ? participantHtml : '<span style="color:var(--text-muted);font-size:0.78rem">해당없음</span>'}</div></td>
      <td class="text-right mono">${isApplicable && perPerson > 0 ? formatKRW(perPerson) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td class="text-right highlight-col">${isApplicable && roleTotal > 0 ? formatKRW(roleTotal) : '<span style="color:var(--text-muted)">—</span>'}</td>
    `;
    tbody.appendChild(tr);
  }

  if (totalEl) totalEl.innerHTML = `<strong>${formatKRW(grandTotal)}</strong>`;
  if (badgeEl) badgeEl.textContent = `총 ${formatKRW(grandTotal)}`;
}

function toggleParticipation(roleId, memberName, epIndex) {
  if (!isAdmin()) {
    alert('관리자(민제)만 에피소드 참여 설정을 수정할 수 있습니다.');
    return;
  }
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (ep && ep.settled) {
    alert('정산 완료된 회차의 페이 배분은 수정할 수 없습니다.');
    return;
  }
  const p = DATA.participation[roleId];
  if (!p || !p[memberName]) return;

  pushState();

  const willBeChecked = !p[memberName][epIndex];

  // DOP는 에피소드당 오직 1명만 체크 가능 (라디오 버튼처럼 작동)
  if (roleId === 'dop' && willBeChecked) {
    for (const m of DATA.members) {
      p[m][epIndex] = false;
    }
  }

  p[memberName][epIndex] = willBeChecked;
  isDirty = true; // Mark unsaved changes

  renderEpisodeRoleTable();

  // Also update multi-role notice
  const multiRoles = getMultiRoleMembers(epIndex);
  const noticeEl = document.getElementById('multi-role-notice');
  const detailEl = document.getElementById('multi-role-detail');
  if (noticeEl && detailEl) {
    if (multiRoles.length > 0) {
      noticeEl.style.display = 'flex';
      const lines = multiRoles.map(mr => {
        const memberRoles = DATA.roles
          .filter(r => {
            if (epIndex === 0 && !r.includesRehearsal) return false;
            const pp = DATA.participation[r.id];
            return pp && pp[mr.name] && pp[mr.name][epIndex];
          })
          .map(r => r.name);
        return `${mr.name}: ${memberRoles.join(' + ')} (${mr.count}개 역할)`;
      });
      detailEl.innerHTML = lines.join('<br>');
    } else {
      noticeEl.style.display = 'none';
    }
  }

  // Refresh other tabs
  renderMemberSummaryTable('member-summary-tbody', 'member-summary-table');
  renderMemberCards();
  renderMemberDetailTable();
}

function changeEpisode(delta) {
  const newIdx = currentEpIndex + delta;
  if (newIdx < 0 || newIdx >= DATA.episodes.length) return;
  currentEpIndex = newIdx;
  renderEpisodeTab();
}

// ============================================================
// MEMBERS TAB
// ============================================================
function renderMemberCards() {
  const grid = document.getElementById('member-cards-grid');
  if (!grid) return;
  const colors = DATA.memberColors;

  grid.innerHTML = '';
  const memberRoleSummary = {
    '민제': ['기획', '촬영 스태프', '편집-A'],
    '광규': ['D.O.P.', '촬영 스태프', '편집-B'],
    '경엽': ['기획', '촬영 스태프', '편집-A(어시)'],
    '정호': ['기획', '촬영 스태프', '편집-B(어시)'],
  };

  const currentUser = sessionStorage.getItem('artic-auth') || '민제';

  // '나' 카드 데이터 추출
  const myToReceive = getMemberToReceive(currentUser);
  const myAccumReceived = getMemberAccumulatedReceived(currentUser);
  const myColor = colors[currentUser] || '#4f8ef7';

  // '나' 카드 HTML (가로 2배 프리미엄 대시보드 카드)
  const myCardHtml = `
    <div class="member-card my-large-card">
      <div class="large-card-badge">MY ACCOUNT</div>
      <div class="member-card-header large">
        <div class="member-avatar large" style="background:${myColor}">${currentUser[0]}</div>
        <div>
          <div class="member-name large">
            ${currentUser}
            <span class="badge badge-blue" style="font-size:0.65rem; padding:2px 8px; border-radius:100px;">나</span>
          </div>
          <div class="member-roles-list large">${(memberRoleSummary[currentUser] || []).join(' · ')}</div>
        </div>
      </div>
      
      <div class="large-card-body">
        <div class="large-card-metric">
          <div class="member-total-label" style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">이번 정산 예정액 (미정산 잔액)</div>
          <div class="large-card-total-wrap">
            ${myToReceive > 0 ? `
              <span class="member-total large" style="color:#4f8ef7">${formatKRW(myToReceive)}</span>
              <div class="settle-pending-badge large" title="클라이언트 입금 완료, 멤버 정산 대기 중">
                <span class="pulse-dot"></span>
                정산 예정
              </div>
            ` : `
              <span class="member-total large" style="color:var(--text-muted); font-size:1.5rem;">₩0</span>
              <div class="settle-completed-badge-all" title="현재 대기 중인 미정산 금액이 없습니다.">
                모든 정산 완료 ✓
              </div>
            `}
          </div>
        </div>
        
        <div class="large-card-metric sub">
          <div class="member-total-label" style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">누적 수령 완료액</div>
          <strong class="member-sub-total large" style="font-family:'JetBrains Mono', monospace; font-weight:700;">${formatKRW(myAccumReceived)}</strong>
        </div>
      </div>
    </div>
  `;

  // 나머지 멤버들 카드 생성
  const otherMembers = DATA.members.filter(m => m !== currentUser);
  let otherCardsHtml = `<div class="other-members-container">`;

  for (const m of otherMembers) {
    const toReceive = getMemberToReceive(m);
    const titleColor = m === '민제' ? '#4f8ef7' : m === '광규' ? '#3ecf8e' : m === '경엽' ? '#f5c842' : '#f87171';

    otherCardsHtml += `
      <div class="member-card other-mini-card">
        <div class="member-card-header mini">
          <div class="member-avatar mini" style="background:${colors[m]}">${m[0]}</div>
          <div class="mini-user-info">
            <div class="member-name mini">${m}</div>
            <div class="member-roles-list mini">${(memberRoleSummary[m] || []).slice(0, 2).join(' · ')}</div>
          </div>
          <div class="mini-metrics-group">
            ${toReceive > 0 ? `
              <div class="member-total mini" style="color:${titleColor}">${formatKRW(toReceive)}</div>
              <div class="member-total-label mini">정산 예정액</div>
            ` : `
              <div class="member-total mini" style="color:var(--text-muted); font-size:0.82rem; font-weight:600; display:inline-flex; align-items:center; gap:4px; justify-content:flex-end;">
                <span style="font-size:0.75rem; color:#4f8ef7; font-weight:bold;">✓</span> 정산 완료
              </div>
              <div class="member-total-label mini" style="color:var(--text-muted); opacity:0.85;">대기 금액 없음</div>
            `}
          </div>
        </div>
      </div>
    `;
  }
  otherCardsHtml += `</div>`;

  // 래퍼 컨테이너 생성 및 주입
  const wrapper = document.createElement('div');
  wrapper.className = 'my-members-dashboard-wrapper';
  wrapper.innerHTML = `
    ${myCardHtml}
    ${otherCardsHtml}
  `;
  grid.appendChild(wrapper);
}

function renderMemberDetailTable() {
  const tbody = document.getElementById('member-detail-tbody');
  if (!tbody) return;
  const matrix = buildPayMatrix();
  const totals = getMemberTotals();

  // 동적 테이블 헤더 갱신 (입금 여부 공통 병합 + PPL 유무 및 금액 추가)
  const table = document.getElementById('member-detail-table');
  if (table) {
    const thead = table.querySelector('thead');
    if (thead) {
      let headCells = `<tr><th style="vertical-align:middle;">멤버</th>`;
      for (const ep of DATA.episodes) {
        const status = getEpisodeStatus(ep);
        const statusLabel = ep.index === 0 ? '' : (
          status === 'settled' 
            ? '<span style="color:#4f8ef7; font-size:0.68rem; display:block; font-weight:normal; margin-top:2px;">정산완료 ✓</span>' 
            : (status === 'progress'
                ? '<span style="color:#f5c842; font-size:0.68rem; display:block; font-weight:normal; margin-top:2px;">정산 진행중</span>'
                : (status === 'paid' 
                    ? '<span style="color:#3ecf8e; font-size:0.68rem; display:block; font-weight:normal; margin-top:2px;">정산대기</span>' 
                    : '<span style="color:var(--text-muted); font-size:0.68rem; display:block; font-weight:normal; margin-top:2px;">입금대기</span>'))
        );
        
        // PPL 정보 표시
        let pplLabel = '';
        if (ep.index !== 0) {
          const pplTotal = ep.pplPayments ? ep.pplPayments.reduce((sum, p) => sum + (p.targetAmount || 0), 0) : 0;
          if (pplTotal > 0) {
            pplLabel = `<span style="display:block; font-size:0.65rem; color:#a78bfa; font-weight:600; margin-top:3px; background:rgba(167, 139, 250, 0.12); padding:1px 6px; border-radius:100px; width:fit-content; margin-left:auto; margin-right:auto;">PPL ${formatKRW(pplTotal)}</span>`;
          } else {
            pplLabel = `<span style="display:block; font-size:0.65rem; color:var(--text-muted); font-weight:normal; margin-top:3px; background:var(--bg-hover); padding:1px 6px; border-radius:100px; width:fit-content; margin-left:auto; margin-right:auto; opacity:0.75;">PPL 없음</span>`;
          }
        }
        
        headCells += `<th class="text-center" style="font-size:0.8rem; vertical-align:middle;">${ep.label}${statusLabel}${pplLabel}</th>`;
      }
      headCells += `<th class="text-right highlight-col" style="vertical-align:middle;">합계</th></tr>`;
      thead.innerHTML = headCells;
    }
  }

  tbody.innerHTML = '';
  
  let baseColSums = {};
  let settledPplColSums = {};
  let unsettledPplColSums = {};
  let finalColSums = {};
  let baseGrandTotal = 0;
  let settledPplGrandTotal = 0;
  let unsettledPplGrandTotal = 0;
  let finalGrandTotal = 0;
  
  const shown = DATA.episodes.map(ep => ep.index);

  for (const m of DATA.members) {
    const tr = document.createElement('tr');
    let cells = `<td style="white-space: nowrap;"><span class="member-tag">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
      ${m}
    </span></td>`;
    
    for (const i of shown) {
      // 이 에피소드에서 해당 멤버가 활성화한 역할들을 수집
      const activeRoles = [];
      for (const role of DATA.roles) {
        if (i === 0 && !role.includesRehearsal) continue;
        const epPart = DATA.participation[role.id];
        if (epPart && epPart[m] && epPart[m][i]) {
          activeRoles.push(role);
        }
      }

      // D.O.P. 와 촬영 스태프가 동시에 참여된 경우, 촬영 스태프 배제
      const hasDop = activeRoles.some(r => r.id === 'dop');
      const filteredRoles = hasDop 
        ? activeRoles.filter(r => r.id !== 'camera_staff')
        : activeRoles;

      let cellText = '<span style="color:var(--text-muted)">—</span>';
      if (filteredRoles.length > 0) {
        const areaBadgeColors = {
          '기획': 'background:rgba(79,142,247,0.15); color:#4f8ef7; border: 1px solid rgba(79,142,247,0.25);',
          '촬영': 'background:rgba(62,207,142,0.12); color:#3ecf8e; border: 1px solid rgba(62,207,142,0.25);',
          '편집': 'background:rgba(167,139,250,0.12); color:#a78bfa; border: 1px solid rgba(167,139,250,0.25);',
        };

        cellText = `<div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
          ${filteredRoles.map(r => {
            const badgeStyle = areaBadgeColors[r.area] || 'background:var(--bg-elevated); color:var(--text-secondary);';
            return `<span class="table-role-badge" style="${badgeStyle} padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:600; display:inline-block; white-space:nowrap;">${r.name}</span>`;
          }).join('')}
        </div>`;
      }

      cells += `<td class="text-center" style="font-size:0.75rem; max-width: 120px; white-space: normal; word-break: keep-all; line-height: 1.4; color:var(--text-primary); font-weight: 500; vertical-align: top;">${cellText}</td>`;
      
      // 해당 회차 멤버별 basePay와 pplPay의 분리 추출
      let basePay = 0;
      for (const role of DATA.roles) {
        if (i === 0 && !role.includesRehearsal) continue;
        const rolePay = calcEpisodeRolePay(role.id, i);
        basePay += (rolePay[m] || 0);
      }

      let epTotalBasePay = 0;
      for (const role of DATA.roles) {
        if (i === 0 && !role.includesRehearsal) continue;
        const rolePay = calcEpisodeRolePay(role.id, i);
        for (const val of Object.values(rolePay)) {
          epTotalBasePay += val;
        }
      }

      let settledPplPay = 0;
      let unsettledPplPay = 0;
      const ratio = epTotalBasePay > 0 ? (basePay / epTotalBasePay) : (1 / DATA.members.length);
      const ep = DATA.episodes.find(e => e.index === i);
      if (ep && ep.pplPayments && ep.pplPayments.length > 0) {
        const settledPplTotal = ep.pplPayments
          .filter(p => p.paid && p.settled)
          .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
        settledPplPay = Math.round(settledPplTotal * ratio);

        const unsettledPplTotal = ep.pplPayments
          .filter(p => !p.settled)
          .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
        unsettledPplPay = Math.round(unsettledPplTotal * ratio);
      }

      baseColSums[i] = (baseColSums[i] || 0) + basePay;
      settledPplColSums[i] = (settledPplColSums[i] || 0) + settledPplPay;
      unsettledPplColSums[i] = (unsettledPplColSums[i] || 0) + unsettledPplPay;
      finalColSums[i] = (finalColSums[i] || 0) + (basePay + settledPplPay);
    }
    
    // 이 멤버가 총 제작비와 PPL을 합쳐 최종적으로 지급받은 금액 (누계)
    let memberBaseSum = 0;
    let memberSettledPplSum = 0;
    let memberUnsettledPplSum = 0;
    for (const i of shown) {
      let basePay = 0;
      for (const role of DATA.roles) {
        if (i === 0 && !role.includesRehearsal) continue;
        const rolePay = calcEpisodeRolePay(role.id, i);
        basePay += (rolePay[m] || 0);
      }
      let epTotalBasePay = 0;
      for (const role of DATA.roles) {
        if (i === 0 && !role.includesRehearsal) continue;
        const rolePay = calcEpisodeRolePay(role.id, i);
        for (const val of Object.values(rolePay)) {
          epTotalBasePay += val;
        }
      }
      const ratio = epTotalBasePay > 0 ? (basePay / epTotalBasePay) : (1 / DATA.members.length);
      const ep = DATA.episodes.find(e => e.index === i);
      let settledPplPay = 0;
      let unsettledPplPay = 0;
      if (ep && ep.pplPayments && ep.pplPayments.length > 0) {
        const settledPplTotal = ep.pplPayments
          .filter(p => p.paid && p.settled)
          .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
        settledPplPay = Math.round(settledPplTotal * ratio);

        const unsettledPplTotal = ep.pplPayments
          .filter(p => !p.settled)
          .reduce((sum, p) => sum + (p.targetAmount || 0), 0);
        unsettledPplPay = Math.round(unsettledPplTotal * ratio);
      }
      memberBaseSum += basePay;
      memberSettledPplSum += settledPplPay;
      memberUnsettledPplSum += unsettledPplPay;
    }
    
    baseGrandTotal += memberBaseSum;
    settledPplGrandTotal += memberSettledPplSum;
    unsettledPplGrandTotal += memberUnsettledPplSum;
    finalGrandTotal += (memberBaseSum + memberSettledPplSum);

    cells += `<td class="text-right highlight-col mono" style="font-weight:700; vertical-align: top;">${formatKRW(totals[m])}</td>`;
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  }

  // 1. 기본 제작비 소계 행 (PPL 제외 역할 페이 소계)
  const baseTr = document.createElement('tr');
  baseTr.className = 'total-row base-subtotal-row';
  baseTr.style.background = 'rgba(79, 142, 247, 0.02)';
  baseTr.style.borderTop = '1px solid var(--border)';
  let baseCells = `<td><strong style="color:var(--text-secondary); font-size:0.75rem;">기본 제작비 소계</strong></td>`;
  for (const i of shown) {
    baseCells += `<td class="text-center mono" style="font-weight:600; font-size:0.75rem; color:var(--text-secondary);">${formatKRW(baseColSums[i] || 0)}</td>`;
  }
  baseCells += `<td class="text-right highlight-col mono" style="font-weight:700; font-size:0.75rem; color:var(--text-secondary);">${formatKRW(baseGrandTotal)}</td>`;
  baseTr.innerHTML = baseCells;
  tbody.appendChild(baseTr);

  // 2. 정산 완료된 PPL 소계 행 (정산 완료된 PPL 배분금 소계)
  const settledPplTr = document.createElement('tr');
  settledPplTr.className = 'total-row ppl-subtotal-row settled-ppl-row';
  settledPplTr.style.background = 'rgba(167, 139, 250, 0.02)';
  let settledPplCells = `<td><strong style="color:#a78bfa; font-size:0.75rem;">정산 완료된 PPL</strong></td>`;
  for (const i of shown) {
    settledPplCells += `<td class="text-center mono" style="font-weight:600; font-size:0.75rem; color:#a78bfa;">${formatKRW(settledPplColSums[i] || 0)}</td>`;
  }
  settledPplCells += `<td class="text-right highlight-col mono" style="font-weight:700; font-size:0.75rem; color:#a78bfa;">${formatKRW(settledPplGrandTotal)}</td>`;
  settledPplTr.innerHTML = settledPplCells;
  tbody.appendChild(settledPplTr);

  // 3. 아직 정산 안 된 PPL 소계 행
  const unsettledPplTr = document.createElement('tr');
  unsettledPplTr.className = 'total-row ppl-subtotal-row unsettled-ppl-row';
  unsettledPplTr.style.background = 'rgba(245, 200, 66, 0.02)';
  let unsettledPplCells = `<td><strong style="color:#f5c842; font-size:0.75rem;">아직 정산 안 된 PPL</strong></td>`;
  for (const i of shown) {
    unsettledPplCells += `<td class="text-center mono" style="font-weight:600; font-size:0.75rem; color:#f5c842;">${formatKRW(unsettledPplColSums[i] || 0)}</td>`;
  }
  unsettledPplCells += `<td class="text-right highlight-col mono" style="font-weight:700; font-size:0.75rem; color:#f5c842;">${formatKRW(unsettledPplGrandTotal)}</td>`;
  unsettledPplTr.innerHTML = unsettledPplCells;
  tbody.appendChild(unsettledPplTr);

  // 4. 최종 합계 행 (기본 + 정산 완료된 PPL 총계)
  const finalTr = document.createElement('tr');
  finalTr.className = 'total-row final-total-row';
  finalTr.style.borderTop = '2px solid rgba(79, 142, 247, 0.3)';
  finalTr.style.background = 'rgba(79, 142, 247, 0.06)';
  let finalCells = `<td><strong style="color:var(--text-primary); font-size:0.8rem;">최종 합계</strong></td>`;
  for (const i of shown) {
    finalCells += `<td class="text-center mono" style="font-weight:800; font-size:0.8rem; color:#4f8ef7;">${formatKRW(finalColSums[i] || 0)}</td>`;
  }
  finalCells += `<td class="text-right highlight-col mono" style="font-weight:900; font-size:0.9rem; color:#4f8ef7;">${formatKRW(finalGrandTotal)}</td>`;
  finalTr.innerHTML = finalCells;
  tbody.appendChild(finalTr);
}

// ============================================================
// ROLES TAB
// ============================================================
function renderRolesGrid() {
  const grid = document.getElementById('roles-grid');
  if (!grid) return;

  const areaColors = {
    '기획': 'background:rgba(79,142,247,0.15);color:#4f8ef7',
    '촬영': 'background:rgba(62,207,142,0.12);color:#3ecf8e',
    '편집': 'background:rgba(167,139,250,0.12);color:#a78bfa',
  };

  grid.innerHTML = '';
  for (const role of DATA.roles) {
    const card = document.createElement('div');
    card.className = 'role-card';

    card.innerHTML = `
      <div class="role-card-header">
        <div class="role-card-title">${role.name}</div>
        <span class="role-area-badge" style="${areaColors[role.area] || ''};padding:3px 10px;border-radius:100px">${role.area}</span>
      </div>
      <div class="role-field">
        <label>역할 설명</label>
        <input type="text" value="${role.description}" onchange="updateRoleDesc('${role.id}', this.value)" ${isAdmin() ? '' : 'disabled'} />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="role-field">
          <label>인당 단가 (원)</label>
          <input type="text" inputmode="numeric" value="${Number(role.unitCostPerPerson || 0).toLocaleString('ko-KR')}" 
            oninput="formatMonetaryInput(this)"
            onchange="updateRoleCost('${role.id}', this.value)" ${isAdmin() ? '' : 'disabled'} />
        </div>
        <div class="role-field">
          <label>기준 인원</label>
          <input type="number" value="${role.headcount}" 
            onchange="updateRoleHeadcount('${role.id}', this.value)" ${isAdmin() ? '' : 'disabled'} />
        </div>
      </div>
      <div style="margin-top:8px;padding:10px 12px;background:var(--bg-elevated);border-radius:8px;font-size:0.78rem;color:var(--text-secondary)">
        편당 지급 총액: <strong style="color:var(--text-primary)">${formatKRW(role.unitCostPerPerson * role.headcount)}</strong>
        · ${role.includesRehearsal ? '리허설 포함' : '리허설 미포함'}
      </div>
    `;
    grid.appendChild(card);
  }

  renderRoleSummaryTable();
}

function updateRoleDesc(roleId, val) {
  const role = DATA.roles.find(r => r.id === roleId);
  if (role) {
    pushState();
    role.description = val;
    isDirty = true;
  }
}

function updateRoleCost(roleId, val) {
  const role = DATA.roles.find(r => r.id === roleId);
  if (role) {
    pushState();
    role.unitCostPerPerson = parseKRWString(val);
    isDirty = true;
    renderRolesGrid();
    renderOverview();
    renderMemberCards();
    renderMemberDetailTable();
  }
}

function updateRoleHeadcount(roleId, val) {
  const role = DATA.roles.find(r => r.id === roleId);
  if (role) {
    pushState();
    role.headcount = parseInt(val) || 1;
    isDirty = true;
    renderRolesGrid();
    renderOverview();
  }
}

function renderRoleSummaryTable() {
  const tbody = document.getElementById('role-summary-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const defaultMembers = {
    'planning': '전원 (민제, 광규, 경엽, 정호)',
    'dop': '광규',
    'camera_staff': '경엽/정호/민제 중 2명',
    'edit_a': '민제',
    'edit_a_assist': '경엽',
    'edit_b': '광규',
    'edit_b_assist': '정호',
  };

  for (const role of DATA.roles) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${role.name}</strong></td>
      <td style="color:var(--text-secondary);font-size:0.82rem">${defaultMembers[role.id] || '—'}</td>
      <td class="text-right mono">${formatKRW(role.unitCostPerPerson)}</td>
      <td class="text-right mono">${role.headcount}인</td>
      <td class="text-right highlight-col">${formatKRW(role.unitCostPerPerson * role.headcount)}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function saveRoleSettings() {
  await saveData();
}

// ============================================================
// INCOME TAB
// ============================================================
function renderIncomeTab() {
  // Episode income list
  const epList = document.getElementById('ep-income-list');
  if (epList) {
    epList.innerHTML = '';
    for (const ep of DATA.episodes) {
      if (ep.index === 0) continue; // 리허설 회차 스킵 (제작비 0원이므로)
      const item = document.createElement('div');
      item.className = 'ep-income-item';

      let statusHtml = '';
      const status = getEpisodeStatus(ep);
      if (status === 'settled') {
        item.classList.add('status-settled');
        statusHtml = `
          <span class="status-dot settled"></span>
          <span style="color:#4f8ef7; font-weight:700;">정산 완료</span>
        `;
      } else if (status === 'progress') {
        item.classList.add('status-progress');
        statusHtml = `
          <span class="status-dot progress"></span>
          <span style="color:#f5c842; font-weight:700;">정산 진행중</span>
        `;
      } else if (status === 'paid') {
        item.classList.add('status-paid');
        statusHtml = `
          <span class="status-dot blinking-green-dot"></span>
          <span class="blinking-text-green" style="color:#3ecf8e; font-weight:700;">입금 확인 (정산 예정)</span>
        `;
      } else {
        item.classList.add('status-pending');
        statusHtml = `
          <span class="status-dot pending"></span>
          <span style="color:var(--text-muted);">대기 중</span>
        `;
      }

      item.innerHTML = `
        <div class="ep-income-ep">
          <strong>${ep.label}</strong>
          <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px; font-family:'JetBrains Mono', monospace; font-weight:500;">제작비: ${formatKRW(ep.targetAmount)}</div>
        </div>
        <div class="ep-income-status">${statusHtml}</div>
      `;
      epList.appendChild(item);
    }
  }

  // PPL list (다차수 분납 렌더링 - 상태 디자인 통일화)
  const pplList = document.getElementById('ppl-list');
  if (pplList) {
    pplList.innerHTML = '';
    let hasPpl = false;
    for (const ep of DATA.episodes) {
      if (ep.pplPayments && ep.pplPayments.length > 0) {
        hasPpl = true;
        for (const p of ep.pplPayments) {
          const item = document.createElement('div');
          item.className = 'ppl-item';
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';

          let pplStatusHtml = '';
          if (p.paid && p.settled) {
            item.classList.add('status-settled');
            pplStatusHtml = `
              <span class="status-dot settled"></span>
              <span style="color:#4f8ef7; font-weight:700; font-size:0.82rem;">정산 완료</span>
            `;
          } else if (p.paid) {
            item.classList.add('status-paid');
            pplStatusHtml = `
              <span class="status-dot blinking-green-dot"></span>
              <span class="blinking-text-green" style="color:#3ecf8e; font-weight:700; font-size:0.82rem;">입금 확인 (정산 예정)</span>
            `;
          } else {
            item.classList.add('status-pending');
            pplStatusHtml = `
              <span class="status-dot pending"></span>
              <span style="color:var(--text-muted); font-size:0.82rem;">대기 중</span>
            `;
          }

          item.innerHTML = `
            <div class="ppl-ep">
              <strong>${ep.label}</strong>
              <span style="font-size:0.75rem; color:var(--text-secondary); margin-left:6px; font-weight:500;">${p.label}</span>
              <div class="ppl-amount-sm" style="font-weight:600; margin-top:4px; font-size:0.8rem; color:var(--accent-yellow); font-family:'JetBrains Mono', monospace;">${formatKRW(p.targetAmount)}</div>
            </div>
            <div class="ep-income-status" style="display:flex; align-items:center; gap:8px;">
              ${pplStatusHtml}
            </div>
          `;
          pplList.appendChild(item);
        }
      }
    }
    if (!hasPpl) {
      pplList.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem">PPL 수입 없음</span>';
    }
  }

  // PPL 합계 갱신
  const pplTotalEl = document.getElementById('ppl-total-display');
  if (pplTotalEl) {
    pplTotalEl.textContent = formatKRW(DATA.project.pplTotal);
  }

  // 정기 지출 테이블 동적 갱신
  const tableWrap = document.getElementById('income-cost-table-wrap');
  if (tableWrap) {
    normalizeBlackmagicCosts();
    
    let ths = `<th>항목</th>`;
    let tds = `<td><span class="role-tag">BlackMagic Cloud</span></td>`;
    
    for (const item of DATA.blackmagicCosts) {
      ths += `<th class="text-right">${item.label}</th>`;
      tds += `<td class="text-right mono">${formatKRW(item.cost)}</td>`;
    }
    
    ths += `<th class="text-right highlight-col">합계</th>`;
    tds += `<td class="text-right mono highlight-col">${formatKRW(DATA.project.blackmagicCost)}</td>`;
    
    tableWrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>${ths}</tr>
        </thead>
        <tbody>
          <tr>${tds}</tr>
        </tbody>
      </table>
    `;
  }
}

// ============================================================
// EXPORT
// ============================================================
function exportSummary() {
  const matrix = buildPayMatrix();
  const totals = getMemberTotals();

  let csv = '멤버,리허설,EP.1,EP.2,EP.3,EP.4,EP.5,EP.6,EP.7,합계\n';
  for (const m of DATA.members) {
    const vals = [0,1,2,3,4,5,6,7].map(i => matrix[m][i] || 0);
    csv += `${m},${vals.join(',')},${totals[m]}\n`;
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'artic-ptr-paytable.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// LOGIN
// ============================================================
const CREDENTIALS = {
  '민제':  '1211',
  '광규':  '1211',
  '경엽':  '0128',
  '정호':  '0000',
};

function attemptLogin() {
  const name = document.getElementById('login-name').value;
  const pw   = document.getElementById('login-pw').value;
  const errorEl = document.getElementById('login-error');
  const card = document.getElementById('login-card');
  const btn  = document.getElementById('login-btn');

  // 빈 값 체크
  if (!name) {
    showLoginError('이름을 선택해주세요.');
    shakeCard();
    return;
  }
  if (!pw) {
    showLoginError('비밀번호를 입력해주세요.');
    shakeCard();
    return;
  }

  // 인증
  // DATA.credentials 우선, 로드 전이면 하드코딩 CREDENTIALS 폴백
  const creds = (DATA && DATA.credentials) ? DATA.credentials : CREDENTIALS;
  if (creds[name] && creds[name] === pw) {
    // 성공 — 세션에 저장
    sessionStorage.setItem('artic-auth', name);
    // 버튼 로딩 상태
    btn.disabled = true;
    document.getElementById('login-btn-text').textContent = '인증 중...';
    // 페이드 아웃 후 대시보드 표시
    setTimeout(() => {
      const overlay = document.getElementById('login-overlay');
      overlay.classList.add('hide');
      document.body.classList.remove('dashboard-hidden');
      init(); // 대시보드 갱신
      setTimeout(() => overlay.remove(), 500);
    }, 300);
  } else {
    showLoginError('이름 또는 비밀번호가 올바르지 않습니다.');
    shakeCard();
    document.getElementById('login-pw').value = '';
    document.getElementById('login-pw').focus();
  }
}

function showLoginError(msg) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    document.getElementById('login-error-msg').textContent = msg;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 3000);
  }
}

function shakeCard() {
  const card = document.getElementById('login-card');
  if (card) {
    card.classList.remove('shake');
    void card.offsetWidth; // reflow
    card.classList.add('shake');
  }
}

function togglePw() {
  const input = document.getElementById('login-pw');
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  document.getElementById('pw-eye').innerHTML = isText
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
}

// ============================================================
// INIT
// ============================================================
/**
 * PPL 데이터 마이그레이션
 * 기존 단일 ppl 숫자를 pplPayments 배열 구조로 안전하게 전환
 */
function migratePplData() {
  if (DATA.episodes) {
    for (const ep of DATA.episodes) {
      if (ep.pplPayments === undefined) {
        if (ep.ppl && ep.ppl > 0) {
          ep.pplPayments = [
            {
              id: 'migrated_' + ep.index,
              label: 'PPL 1차',
              targetAmount: ep.ppl,
              receivedAmount: ep.paid ? ep.ppl : 0,
              paid: ep.paid,
              settled: ep.settled
            }
          ];
        } else {
          ep.pplPayments = [];
        }
      }
    }
  }
}

async function init() {
  initTheme();
  initClock();

  // Cmd+S (Mac) or Ctrl+S (Windows) global key listener
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveData();
    }
  });

  // Load data dynamically
  await loadData();

  // Migrate PPL data format for multi-stage support
  migratePplData();

  // Normalize blackmagicCosts structure
  normalizeBlackmagicCosts();

  // Roles/Episodes 저장 버튼 및 관리자 메뉴 제어
  const showAdmin = isAdmin();
  const saveBtn = document.getElementById('btn-save-roles');
  const saveEpBtn = document.getElementById('btn-save-episodes');
  if (saveBtn) {
    saveBtn.style.display = showAdmin ? 'flex' : 'none';
  }
  if (saveEpBtn) {
    saveEpBtn.style.display = showAdmin ? 'flex' : 'none';
  }
  
  const adminHeader = document.getElementById('nav-admin-group-header');
  const adminTab = document.getElementById('nav-admin-tab');
  const rolesTab = document.getElementById('nav-roles-tab');
  const episodesTab = document.getElementById('nav-episodes-tab');
  
  if (adminHeader) adminHeader.style.display = showAdmin ? 'block' : 'none';
  if (adminTab) adminTab.style.display = showAdmin ? 'flex' : 'none';
  if (rolesTab) rolesTab.style.display = showAdmin ? 'flex' : 'none';
  if (episodesTab) episodesTab.style.display = showAdmin ? 'flex' : 'none';

  // 로그인 체크
  const authed = sessionStorage.getItem('artic-auth');
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.style.display = authed ? 'flex' : 'none';
  }

  renderOverview();
  renderEpisodeTab();
  renderMemberCards();
  renderMemberDetailTable();
  renderRolesGrid();
  renderIncomeTab();
  renderAccountTab();
  const credMap = (DATA && DATA.credentials) ? DATA.credentials : CREDENTIALS;
  if (authed && credMap[authed]) {
    // 이미 인증된 세션 — 오버레이 즉시 제거
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('dashboard-hidden');
  } else {
    // 로그인 화면 표시, 대시보드 숨김
    document.body.classList.add('dashboard-hidden');
    const pwInput = document.getElementById('login-pw');
    if (pwInput) {
      pwInput.addEventListener('input', () => {
        const err = document.getElementById('login-error');
        if (err) err.classList.remove('show');
      });
    }
  }

  updateUndoRedoButtons();
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// ADMIN LOGIC (Dynamic Data Update)
// ============================================================
function recalculateProjectMetrics() {
  // 0. 각 에피소드의 PPL 예정액 합계를 ep.ppl에 덮어씌워 하위 호환성 유지
  if (DATA.episodes) {
    for (const ep of DATA.episodes) {
      ep.ppl = (ep.pplPayments || []).reduce((sum, p) => sum + (p.targetAmount || 0), 0);
    }
  }

  // 1. 예정액 합계 (에피소드 제작비 예정액 + 모든 PPL 예정액)
  const baseTarget = DATA.episodes.reduce((sum, ep) => sum + (ep.targetAmount || 0), 0);
  const pplTarget = DATA.episodes.reduce((sum, ep) => {
    return sum + (ep.pplPayments || []).reduce((pSum, p) => pSum + (p.targetAmount || 0), 0);
  }, 0);
  DATA.project.contractAmount = baseTarget + pplTarget;

  // 2. 수령액 합계
  // 계약금 실 수령액 = 제작비 실제 입금액 + 모든 PPL 실제 입금액 합계
  const baseReceived = DATA.episodes.reduce((sum, ep) => sum + (ep.receivedAmount || 0), 0);
  const pplReceived = DATA.episodes.reduce((sum, ep) => {
    return sum + (ep.pplPayments || []).reduce((pSum, p) => pSum + (p.receivedAmount || 0), 0);
  }, 0);
  DATA.project.receivedAmount = baseReceived + pplReceived;

  // 3. PPL 합계
  DATA.project.pplTotal = DATA.episodes.reduce((sum, ep) => sum + (ep.ppl || 0), 0);

  // 4. BlackMagic 비용 합계
  DATA.project.blackmagicCost = (DATA.blackmagicCosts ? DATA.blackmagicCosts.reduce((sum, item) => sum + (item.cost || 0), 0) : 64025);

  // 5. 총 용역 비용
  let totalLabor = 0;
  for (const ep of DATA.episodes) {
    totalLabor += calcEpisodeTotalPay(ep.index);
  }
  DATA.project.laborCost = totalLabor;

  // 6. 순이익
  DATA.project.profit = DATA.project.contractAmount - DATA.project.laborCost;
}

function renderAdminTab() {
  if (!isAdmin()) return;

  // 1. 에피소드별 정산 리스트 카드 그리드 그리기 (1열 가로 카드 레이아웃에 최적화)
  const grid = document.getElementById('admin-episodes-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const ep of DATA.episodes) {
    const div = document.createElement('div');
    div.className = 'admin-ep-card';
    div.setAttribute('data-ep-index', ep.index);

    const deleteBtnHtml = ep.index === 0 ? '' : `
      <button class="btn-delete-cost" onclick="handleDeleteEpisodeDirect(${ep.index})" title="에피소드 삭제">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    div.innerHTML = `
      ${deleteBtnHtml}
      <div class="admin-ep-card-header">
        <span class="admin-ep-card-title">${ep.label}</span>
        <div class="admin-ep-card-status-group">
          ${!ep.paid ? `
            <button type="button" class="btn-toggle-status paid" onclick="updateEpisodeData(${ep.index}, 'paid', true)">
              보코스 입금 대기
            </button>
            <button type="button" class="btn-toggle-status settled" disabled style="opacity: 0.5; cursor: not-allowed;">
              아틱팀 정산 대기
            </button>
          ` : ( !ep.settled ? `
            <button type="button" class="btn-toggle-status paid active" onclick="updateEpisodeData(${ep.index}, 'paid', false)">
              보코스 입금 완료 ✓
            </button>
            <button type="button" class="btn-toggle-status settled blinking-blue" onclick="updateEpisodeData(${ep.index}, 'settled', true)">
              아틱팀 정산 예정
            </button>
          ` : `
            <button type="button" class="btn-toggle-status paid active" disabled style="cursor: not-allowed; opacity: 0.85;">
              보코스 입금 완료 ✓
            </button>
            <button type="button" class="btn-toggle-status settled active" onclick="updateEpisodeData(${ep.index}, 'settled', false)" title="클릭하면 정산 예정 상태로 되돌릴 수 있습니다.">
              아틱팀 정산 완료 ✓
            </button>
          `)}
        </div>
      </div>
      <div class="admin-ep-card-body">
        <div class="role-field">
          <label>입금 예정액 (원)</label>
          <input type="text" inputmode="numeric" class="admin-input" 
            value="${Number(ep.targetAmount || 0).toLocaleString('ko-KR')}" 
            oninput="formatMonetaryInput(this)" 
            onchange="updateEpisodeData(${ep.index}, 'targetAmount', this.value)" 
            ${ep.paid ? 'disabled style="background: var(--bg-hover); cursor: not-allowed; opacity: 0.85;"' : ''} />
        </div>
        <div class="role-field">
          <label>실제 입금액 (원)</label>
          <input type="text" class="admin-input" value="${Number(ep.receivedAmount || 0).toLocaleString('ko-KR')}" disabled style="background: var(--bg-hover); cursor: not-allowed; opacity: 0.85;" />
        </div>
        <div class="role-field">
          <label>출연 아티스트 (게스트)</label>
          <input type="text" class="admin-input" value="${ep.artists && ep.artists.length > 0 ? ep.artists[0] : ''}" onchange="updateEpisodeArtists(${ep.index}, this.value)" placeholder="게스트 이름 입력" style="text-align:left;" />
        </div>
        <div class="admin-ppl-section" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); grid-column: span 2; width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">PPL 입금 차수 관리</span>
            <button class="btn btn-outline" onclick="addPplPayment(${ep.index})" style="font-size:0.68rem; padding:2px 8px; height:24px; border-radius:4px; font-weight:700; width:auto;">+ PPL 차수 추가</button>
          </div>
          <div class="admin-ppl-list" style="display:flex; flex-direction:column; gap:8px;">
            ${(ep.pplPayments || []).map(p => `
              <div class="admin-ppl-item">
                <button class="btn-delete-cost btn-delete-ppl" onclick="deletePplPayment(${ep.index}, '${p.id}')" title="차수 삭제">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div class="admin-ppl-header">
                  <input type="text" class="admin-ppl-label-input" value="${p.label}" onchange="updatePplPaymentField(${ep.index}, '${p.id}', 'label', this.value)" placeholder="차수명 (예: PPL 1차)" />
                  <div class="admin-ppl-status-group">
                    ${!p.paid ? `
                      <button type="button" class="btn-toggle-status paid" onclick="updatePplPaymentField(${ep.index}, '${p.id}', 'paid', true)">
                        보코스 입금 대기
                      </button>
                      <button type="button" class="btn-toggle-status settled" disabled style="opacity: 0.5; cursor: not-allowed;">
                        아틱팀 정산 대기
                      </button>
                    ` : ( !p.settled ? `
                      <button type="button" class="btn-toggle-status paid active" onclick="updatePplPaymentField(${ep.index}, '${p.id}', 'paid', false)">
                        보코스 입금 완료 ✓
                      </button>
                      <button type="button" class="btn-toggle-status settled blinking-blue" onclick="updatePplPaymentField(${ep.index}, '${p.id}', 'settled', true)">
                        아틱팀 정산 예정
                      </button>
                    ` : `
                      <button type="button" class="btn-toggle-status paid active" disabled style="cursor: not-allowed; opacity: 0.85;">
                        보코스 입금 완료 ✓
                      </button>
                      <button type="button" class="btn-toggle-status settled active" onclick="updatePplPaymentField(${ep.index}, '${p.id}', 'settled', false)" title="클릭하면 정산 예정 상태로 되돌릴 수 있습니다.">
                        아틱팀 정산 완료 ✓
                      </button>
                    `)}
                  </div>
                </div>
                <div class="admin-ppl-inputs">
                  <div class="role-field" style="margin-bottom:0;">
                    <label>입금 예정액 (원)</label>
                    <input type="text" inputmode="numeric" class="admin-input" 
                      value="${Number(p.targetAmount || 0).toLocaleString('ko-KR')}" 
                      oninput="formatMonetaryInput(this)" 
                      onchange="updatePplPaymentField(${ep.index}, '${p.id}', 'targetAmount', this.value)" 
                      ${p.paid ? 'disabled style="background: var(--bg-hover); cursor: not-allowed; opacity: 0.85;"' : ''} />
                  </div>
                  <div class="role-field" style="margin-bottom:0;">
                    <label>실제 입금액 (원)</label>
                    <input type="text" class="admin-input" value="${Number(p.receivedAmount || 0).toLocaleString('ko-KR')}" disabled style="background: var(--bg-hover); cursor: not-allowed; opacity: 0.85;" />
                  </div>
                </div>
              </div>
            `).join('')}
            ${(ep.pplPayments || []).length === 0 ? `<div style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding:6px 0; border:1px dashed var(--border); border-radius:4px;">등록된 PPL 차수가 없습니다.</div>` : ''}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(div);
  }

  // 2. 정기 지출 비용 인풋 카드 그리기 (드래그 앤 드롭 정렬 기능 탑재)
  const costsGrid = document.getElementById('admin-costs-grid');
  if (costsGrid) {
    costsGrid.innerHTML = '';
    normalizeBlackmagicCosts();

    for (const item of DATA.blackmagicCosts) {
      const card = document.createElement('div');
      card.className = 'admin-cost-card';
      card.setAttribute('draggable', 'true');
      card.setAttribute('data-id', item.id);
      card.innerHTML = `
        <button class="btn-delete-cost" onclick="deleteCostItem('${item.id}')" title="지출 내역 삭제">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <input type="text" class="admin-cost-label-input" value="${item.label}" onchange="updateCostItemLabel('${item.id}', this.value)" placeholder="월 지출명 입력" style="cursor: text;" />
          <div class="role-field" style="margin-bottom:0;">
            <label>지출액 (원)</label>
            <input type="text" inputmode="numeric" class="admin-input" value="${Number(item.cost || 0).toLocaleString('ko-KR')}" oninput="formatMonetaryInput(this)" onchange="updateCostItemCost('${item.id}', this.value)" style="cursor: text;" />
          </div>
        </div>
      `;

      // Drag and Drop Event Listeners
      card.addEventListener('dragstart', (e) => {
        // 인풋이나 텍스트 박스를 선택하는 동작 시 드래그 방지
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') {
          e.preventDefault();
          return;
        }
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.admin-cost-card').forEach(c => c.classList.remove('drag-over'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = card.getAttribute('data-id');

        if (draggedId && targetId && draggedId !== targetId) {
          const draggedIndex = DATA.blackmagicCosts.findIndex(x => x.id === draggedId);
          const targetIndex = DATA.blackmagicCosts.findIndex(x => x.id === targetId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            pushState();
            const [removed] = DATA.blackmagicCosts.splice(draggedIndex, 1);
            DATA.blackmagicCosts.splice(targetIndex, 0, removed);
            isDirty = true;
            recalculateProjectMetrics();
            renderAdminTab();
            renderIncomeTab();
            renderOverview();
          }
        }
      });

      costsGrid.appendChild(card);
    }
  }
}

// ============================================================
// ADMIN ACTIONS FOR MULTI-STAGE PPL
// ============================================================
function addPplPayment(epIndex) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  pushState();
  if (!ep.pplPayments) ep.pplPayments = [];

  const newId = 'ppl_' + Date.now() + Math.random().toString(36).substr(2, 5);
  const nextOrder = ep.pplPayments.length + 1;
  ep.pplPayments.push({
    id: newId,
    label: `PPL ${nextOrder}차`,
    targetAmount: 0,
    receivedAmount: 0,
    paid: false,
    settled: false
  });

  isDirty = true;
  recalculateProjectMetrics();
  renderAdminTab();
  renderOverview();
  renderIncomeTab();
  renderMemberCards();
  renderMemberDetailTable();
}

let customConfirmResolve = null;

function showCustomConfirm(title, desc, confirmText = '삭제') {
  return new Promise((resolve) => {
    customConfirmResolve = resolve;
    const popup = document.getElementById('custom-confirm-popup');
    const titleEl = document.getElementById('custom-confirm-title');
    const descEl = document.getElementById('custom-confirm-desc');
    const okBtn = document.getElementById('custom-confirm-ok-btn');
    
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (okBtn) {
      okBtn.textContent = confirmText;
      if (confirmText === '삭제') {
        okBtn.className = 'btn btn-danger btn-sm';
      } else {
        okBtn.className = 'btn btn-primary btn-sm';
      }
    }
    
    if (popup) {
      popup.classList.add('show');
    }
  });
}

function hideCustomConfirm(result) {
  const popup = document.getElementById('custom-confirm-popup');
  if (popup) {
    popup.classList.remove('show');
  }
  if (customConfirmResolve) {
    customConfirmResolve(result);
    customConfirmResolve = null;
  }
}

// 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('custom-confirm-cancel-btn')?.addEventListener('click', () => hideCustomConfirm(false));
  document.getElementById('custom-confirm-ok-btn')?.addEventListener('click', () => hideCustomConfirm(true));

  // 비밀번호 모달 바깥 클릭 시 닫기
  document.getElementById('pw-change-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'pw-change-modal') {
      closePasswordModal();
    }
  });

  // 인보이스 모달 바깥 클릭 시 닫기
  document.getElementById('invoice-view-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'invoice-view-modal') {
      closeInvoiceModal();
    }
  });
});

async function deletePplPayment(epIndex, pplId) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  const confirmed = await showCustomConfirm('PPL 차수 삭제', '정말로 이 PPL 차수를 삭제하시겠습니까?');
  if (!confirmed) return;

  pushState();
  ep.pplPayments = (ep.pplPayments || []).filter(p => p.id !== pplId);

  isDirty = true;
  recalculateProjectMetrics();
  renderAdminTab();
  renderOverview();
  renderIncomeTab();
  renderMemberCards();
  renderMemberDetailTable();
}

function updatePplPaymentField(epIndex, pplId, field, value) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  const p = (ep.pplPayments || []).find(x => x.id === pplId);
  if (!p) return;

  pushState();

  let needAdminRef = false;

  if (field === 'paid') {
    p.paid = value;
    if (value) {
      if ((p.receivedAmount || 0) < (p.targetAmount || 0)) {
        p.receivedAmount = p.targetAmount;
      }
    } else {
      p.receivedAmount = 0;
    }
    needAdminRef = true;
  } else if (field === 'settled') {
    p.settled = value;
  } else if (field === 'receivedAmount') {
    const val = parseKRWString(value);
    p.receivedAmount = val;
    if (val >= (p.targetAmount || 0) && p.targetAmount > 0) {
      if (!p.paid) {
        p.paid = true;
        needAdminRef = true;
      }
    } else if (val === 0) {
      if (p.paid) {
        p.paid = false;
        needAdminRef = true;
      }
    }
  } else if (field === 'targetAmount') {
    p.targetAmount = parseKRWString(value);
  } else if (field === 'label') {
    p.label = value;
  }

  isDirty = true;
  recalculateProjectMetrics();

  renderOverview();
  renderIncomeTab();
  renderMemberCards();
  renderMemberDetailTable();
  
  renderAdminTab();
}

function logout() {
  sessionStorage.removeItem('artic-auth');
  location.reload();
}

function updateEpisodeArtists(epIndex, rawValue) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  pushState();

  // 게스트는 1명이므로 쉼표 파싱 제외
  ep.artists = rawValue.trim() ? [rawValue.trim()] : [];

  isDirty = true; // Mark unsaved changes
  renderOverview();
  renderEpisodeTab();
}

function updateEpisodeData(epIndex, field, value) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  pushState();

  let needAdminRef = false;

  if (field === 'paid') {
    ep.paid = value;
    if (value) {
      if ((ep.receivedAmount || 0) < (ep.targetAmount || 0)) {
        ep.receivedAmount = ep.targetAmount;
      }
    } else {
      ep.receivedAmount = 0;
    }
    needAdminRef = true;
  } else if (field === 'settled') {
    ep.settled = value;
  } else if (field === 'receivedAmount') {
    const val = parseKRWString(value);
    ep.receivedAmount = val;
    if (val >= (ep.targetAmount || 0) && ep.targetAmount > 0) {
      if (!ep.paid) {
        ep.paid = true;
        needAdminRef = true;
      }
    } else if (val === 0) {
      if (ep.paid) {
        ep.paid = false;
        needAdminRef = true;
      }
    }
  } else {
    ep[field] = parseKRWString(value);
  }

  isDirty = true; // Mark unsaved changes

  // 글로벌 수치 재계산 및 UI 강제 리렌더링
  recalculateProjectMetrics();

  // 현재 탭 갱신 및 전체 UI 업데이트
  renderOverview();
  renderIncomeTab();
  renderMemberCards();
  renderMemberDetailTable();
  renderAdminTab();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

function updateAdminCost(month, value) {
  if (!DATA.blackmagicCosts) {
    DATA.blackmagicCosts = { jan: 21153, feb: 21239, mar: 21633 };
  }
  pushState();
  DATA.blackmagicCosts[month] = parseInt(value) || 0;
  isDirty = true; // Mark unsaved changes

  // 글로벌 수치 재계산 및 UI 강제 리렌더링
  recalculateProjectMetrics();
  renderOverview();
  renderIncomeTab();
}

// ============================================================
// DYNAMIC EPISODE ACTIONS (Add & Context Menu Deletion)
// ============================================================
let selectedEpIndexForDelete = null;

function addNewEpisode() {
  pushState();
  // 현재 최대 인덱스를 찾아 새 인덱스 지정
  const maxIdx = DATA.episodes.length > 0 ? Math.max(...DATA.episodes.map(e => e.index)) : 0;
  const newIndex = maxIdx + 1;
  const newEp = {
    index: newIndex,
    label: `EP.${newIndex}`,
    paid: false,
    artists: [],
    ppl: 0,
    targetAmount: 200000,
    receivedAmount: 0
  };

  // 1. 에피소드 배열 추가
  DATA.episodes.push(newEp);
  isDirty = true; // Mark unsaved changes

  // 2. 중요: 멤버별 에피소드 참여 여부 배열을 false로 확장
  for (const roleId in DATA.participation) {
    for (const memberName in DATA.participation[roleId]) {
      if (Array.isArray(DATA.participation[roleId][memberName])) {
        DATA.participation[roleId][memberName].push(false);
      }
    }
  }

  // 글로벌 수치 재계산 및 뷰 강제 리렌더링
  recalculateProjectMetrics();

  // 전체 화면 리프레시
  renderOverview();
  renderEpisodeTab();
  renderMemberCards();
  renderMemberDetailTable();
  renderIncomeTab();
  renderAdminTab();
}

async function handleDeleteEpisodeDirect(epIndex) {
  if (!isAdmin()) return;
  if (epIndex === 0) {
    alert("리허설 에피소드는 삭제할 수 없습니다.");
    return;
  }
  const confirmed = await showCustomConfirm('에피소드 삭제', '정말로 해당 에피소드를 삭제하시겠습니까?');
  if (confirmed) {
    deleteEpisode(epIndex);
  }
}

function handleEpisodeCardContextMenu(e) {
  e.preventDefault();
  if (!isAdmin()) return;

  const card = e.currentTarget;
  const epIndex = parseInt(card.getAttribute('data-ep-index'));

  // 리허설은 삭제 불가 처리
  if (epIndex === 0) {
    alert("리허설 에피소드는 삭제할 수 없습니다.");
    return;
  }

  selectedEpIndexForDelete = epIndex;

  // 커스텀 컨텍스트 메뉴 띄우기
  const menu = document.getElementById('custom-context-menu');
  if (menu) {
    menu.style.display = 'block';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
  }
}

// 아무 곳이나 클릭하면 우클릭 메뉴 숨기기
window.addEventListener('click', () => {
  const menu = document.getElementById('custom-context-menu');
  if (menu) {
    menu.style.display = 'none';
  }
});

async function handleDeleteEpisodeClick() {
  if (selectedEpIndexForDelete === null) return;

  // 컨텍스트 메뉴 닫기
  const menu = document.getElementById('custom-context-menu');
  if (menu) menu.style.display = 'none';

  const confirmed = await showCustomConfirm('에피소드 삭제', '정말로 해당 에피소드를 삭제하시겠습니까?');
  if (confirmed) {
    deleteEpisode(selectedEpIndexForDelete);
  }

  selectedEpIndexForDelete = null;
}

function deleteEpisode(epIndex) {
  if (epIndex === 0) return; // 리허설 보호

  const targetIdx = DATA.episodes.findIndex(e => e.index === epIndex);
  if (targetIdx === -1) return;

  pushState();

  // 1. 에피소드 삭제
  DATA.episodes.splice(targetIdx, 1);
  isDirty = true; // Mark unsaved changes

  // 2. 인덱스 재정렬 및 라벨명 자동 리라이트 (예: EP.8 -> EP.7)
  DATA.episodes.forEach((ep, idx) => {
    ep.index = idx;
    if (idx > 0 && ep.label.startsWith('EP.')) {
      ep.label = `EP.${idx}`;
    }
  });

  // 3. 중요: 멤버별 참여 여부 배열에서도 해당 에피소드 위치 요소를 제거
  for (const roleId in DATA.participation) {
    for (const memberName in DATA.participation[roleId]) {
      if (Array.isArray(DATA.participation[roleId][memberName])) {
        DATA.participation[roleId][memberName].splice(targetIdx, 1);
      }
    }
  }

  // 글로벌 수치 재계산 및 뷰 강제 리렌더링
  recalculateProjectMetrics();

  // 현재 선택된 에피소드 번호 바운드 보호
  if (currentEpIndex >= DATA.episodes.length) {
    currentEpIndex = DATA.episodes.length - 1;
  }

  // 전체 화면 리프레시
  renderOverview();
  renderEpisodeTab();
  renderMemberCards();
  renderMemberDetailTable();
  renderIncomeTab();
  renderAdminTab();
}

// ============================================================
// MOBILE DRAWER TOGGLE HELPER
// ============================================================
function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

// ============================================================
// SHOOT ROLE DUAL TOGGLE INTERACTION (EXCLUSIVE D.O.P)
// ============================================================
function toggleShootRole(memberName, type, epIndex) {
  if (!isAdmin()) {
    alert('관리자(민제)만 에피소드 참여 설정을 수정할 수 있습니다.');
    return;
  }
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (ep && ep.settled) {
    alert('정산 완료된 회차의 페이 배분은 수정할 수 없습니다.');
    return;
  }

  const dopPart = DATA.participation['dop'];
  const staffPart = DATA.participation['camera_staff'];

  if (!dopPart || !staffPart) return;

  pushState();

  isDirty = true;

  if (type === 'dop') {
    const isCurrentlyDop = dopPart[memberName][epIndex];
    
    // 1. 모든 멤버의 DOP 해제 (Exclusive 라디오 토글)
    for (const m of DATA.members) {
      dopPart[m][epIndex] = false;
    }
    
    // 2. 이미 DOP였다면 끄고, 아니었다면 D.O.P.로 지정
    if (!isCurrentlyDop) {
      dopPart[memberName][epIndex] = true;
      // D.O.P.가 되는 즉시 촬영 스태프 참여는 자동 비활성화
      staffPart[memberName][epIndex] = false;
    }
  } else if (type === 'staff') {
    // 스태프 토글
    staffPart[memberName][epIndex] = !staffPart[memberName][epIndex];
    
    // 스태프가 켜지는 경우 이 멤버의 D.O.P.는 자동 비활성화
    if (staffPart[memberName][epIndex] && dopPart[memberName][epIndex]) {
      dopPart[memberName][epIndex] = false;
    }
  }

  // 글로벌 수치 재계산 및 뷰 강제 리렌더링
  recalculateProjectMetrics();
  renderEpisodeRoleTable();
  renderOverview();
  renderMemberCards();
  renderMemberDetailTable();
}

// ============================================================
// THEME SWITCHER LOGIC
// ============================================================
function initTheme() {
  const savedTheme = localStorage.getItem('artic-theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  localStorage.setItem('artic-theme', theme);
  updateThemeUI(theme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  setTheme(isLight ? 'dark' : 'light');
}

function updateThemeUI(theme) {
  const icon = document.getElementById('theme-icon');
  const text = document.getElementById('theme-text');
  const mobileIcon = document.getElementById('mobile-theme-icon');
  if (icon && text) {
    if (theme === 'light') {
      // Show Moon icon (switch to dark option)
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      if (mobileIcon) mobileIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      text.textContent = '다크 모드';
    } else {
      // Show Sun icon (switch to light option)
      icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
      if (mobileIcon) mobileIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
      text.textContent = '라이트 모드';
    }
  }

  // Update active state on login theme buttons if they exist
  const darkBtn = document.getElementById('login-theme-dark');
  const lightBtn = document.getElementById('login-theme-light');
  if (darkBtn && lightBtn) {
    if (theme === 'light') {
      lightBtn.classList.add('active');
      darkBtn.classList.remove('active');
    } else {
      darkBtn.classList.add('active');
      lightBtn.classList.remove('active');
    }
  }
}

function initClock() {
  function updateClock() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const timeString = now.toLocaleTimeString('ko-KR', options);
    const clockEl = document.getElementById('kst-clock');
    if (clockEl) clockEl.textContent = `KST ${timeString}`;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ============================================================
// DYNAMIC COST ITEMS HELPER & HANDLERS
// ============================================================
function normalizeBlackmagicCosts() {
  if (!DATA.blackmagicCosts) {
    DATA.blackmagicCosts = [
      { id: 'jan', label: '1월', cost: 21153 },
      { id: 'feb', label: '2월', cost: 21239 },
      { id: 'mar', label: '3월', cost: 21633 }
    ];
    return;
  }
  if (!Array.isArray(DATA.blackmagicCosts)) {
    const arr = [];
    const labels = { jan: '1월', feb: '2월', mar: '3월' };
    for (const [key, val] of Object.entries(DATA.blackmagicCosts)) {
      arr.push({
        id: key,
        label: labels[key] || key,
        cost: parseInt(val) || 0
      });
    }
    DATA.blackmagicCosts = arr;
  }
}

function addCostItem() {
  normalizeBlackmagicCosts();
  pushState();

  const nextNum = DATA.blackmagicCosts.length + 1;
  DATA.blackmagicCosts.push({
    id: `cost_${Date.now()}`,
    label: `${nextNum}월`,
    cost: 0
  });

  isDirty = true;
  recalculateProjectMetrics();
  renderAdminTab();
  renderIncomeTab();
  renderOverview();
}

async function deleteCostItem(id) {
  normalizeBlackmagicCosts();
  const idx = DATA.blackmagicCosts.findIndex(item => item.id === id);
  if (idx === -1) return;

  const confirmed = await showCustomConfirm('지출 내역 삭제', '정말로 해당 지출 내역을 삭제하시겠습니까?');
  if (confirmed) {
    pushState();
    DATA.blackmagicCosts.splice(idx, 1);
    isDirty = true;
    recalculateProjectMetrics();
    renderAdminTab();
    renderIncomeTab();
    renderOverview();
  }
}

function updateCostItemLabel(id, label) {
  normalizeBlackmagicCosts();
  const item = DATA.blackmagicCosts.find(item => item.id === id);
  if (item) {
    pushState();
    item.label = label;
    isDirty = true;
    renderIncomeTab();
    renderAdminTab();
  }
}

function updateCostItemCost(id, val) {
  normalizeBlackmagicCosts();
  const item = DATA.blackmagicCosts.find(item => item.id === id);
  if (item) {
    pushState();
    item.cost = parseKRWString(val);
    isDirty = true;
    recalculateProjectMetrics();
    renderIncomeTab();
    renderAdminTab();
    renderOverview();
  }
}

// ============================================================
// KEYBOARD SHORTCUTS FOR UNDO/REDO
// ============================================================
window.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? e.metaKey : e.ctrlKey;

  // Cmd+S / Ctrl+S 단축키 통합 바인딩
  if (cmdKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    const navGuard = document.getElementById('nav-guard-popup');
    if (navGuard && navGuard.classList.contains('show')) {
      confirmNavGuardSave();
    } else {
      saveData();
    }
    return;
  }

  // Escape 단축키: 팝업 취소 처리
  if (e.key === 'Escape') {
    const navGuard = document.getElementById('nav-guard-popup');
    if (navGuard && navGuard.classList.contains('show')) {
      e.preventDefault();
      cancelNavGuard();
      return;
    }
    const customConfirm = document.getElementById('custom-confirm-popup');
    if (customConfirm && customConfirm.classList.contains('show')) {
      e.preventDefault();
      hideCustomConfirm(false);
      return;
    }
  }

  // Enter 단축키: 네비게이션 가드(저장 경고 팝업) 활성화 시 저장 및 이동 처리
  if (e.key === 'Enter') {
    const navGuard = document.getElementById('nav-guard-popup');
    if (navGuard && navGuard.classList.contains('show')) {
      e.preventDefault();
      confirmNavGuardSave();
      return;
    }
  }

  if (cmdKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  } else if (cmdKey && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  }
});

// ============================================================
// ACCOUNT TAB
// ============================================================
const MEMBER_FULL_NAMES = {
  '민제': '김민제',
  '광규': '박광규',
  '경엽': '조경엽',
  '정호': '김정호',
};

function renderAccountTab() {
  const authed = sessionStorage.getItem('artic-auth');
  if (!authed) return;

  const fullName = MEMBER_FULL_NAMES[authed] || authed;
  const isAdminUser = authed === '민제';

  // 아바타 & 이름
  const avatarEl = document.getElementById('account-avatar');
  const nameEl = document.getElementById('account-name');
  const badgeEl = document.getElementById('account-role-badge');
  if (avatarEl) avatarEl.textContent = fullName[0];
  if (nameEl) nameEl.textContent = fullName;
  if (badgeEl) badgeEl.textContent = isAdminUser ? '관리자' : '팀원';

  // 멤버 컬러 배경
  const color = (DATA.memberColors && DATA.memberColors[authed]) || 'linear-gradient(135deg, #4f8ef7, #7c5ff5)';
  if (avatarEl) avatarEl.style.background = color;

  // 누적 정산 완료액 (settled: true 회차 합산)
  const settledTotal = getMemberAccumulatedReceived(authed);

  const pendingAmount = getMemberToReceive(authed);
  const upcomingAmount = getMemberUnpaidAccumulated(authed);

  const settledEl = document.getElementById('account-settled');
  const pendingEl = document.getElementById('account-pending');
  const upcomingEl = document.getElementById('account-upcoming');
  if (settledEl) settledEl.textContent = formatKRW(settledTotal);
  if (pendingEl) pendingEl.textContent = formatKRW(pendingAmount);
  if (upcomingEl) upcomingEl.textContent = formatKRW(upcomingAmount);

  // 역할 바 차트 (정산 완료 회차 기준)
  const settledEpIndexes = DATA.episodes.filter(ep => ep.settled).map(ep => ep.index);
  const totalSettled = settledEpIndexes.length;
  const roleCounts = {};

  for (const role of DATA.roles) {
    const part = DATA.participation[role.id];
    if (!part || !part[authed]) continue;
    let count = 0;
    for (const epIdx of settledEpIndexes) {
      if (part[authed][epIdx]) count++;
    }
    if (count > 0) roleCounts[role.name] = count;
  }

  const sorted = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

  const chartEl = document.getElementById('account-role-chart');
  if (chartEl) {
    if (sorted.length === 0) {
      chartEl.innerHTML = `<p style="color:var(--text-secondary); padding:12px 0; font-size:0.875rem;">정산 완료된 회차가 없습니다.</p>`;
    } else {
      chartEl.innerHTML = sorted.map(([roleName, count], i) => {
        const pct = Math.round(count / maxCount * 100);
        const partPct = totalSettled > 0 ? Math.round(count / totalSettled * 100) : 0;
        return `
          <div class="role-bar-row" style="animation-delay:${i * 60}ms">
            <div class="role-bar-label">${roleName}</div>
            <div class="role-bar-track">
              <div class="role-bar-fill" style="width:0%" data-target="${pct}"></div>
            </div>
            <div class="role-bar-value">${count}회 <span class="role-bar-pct">${partPct}%</span></div>
          </div>
        `;
      }).join('');
      // 바 애니메이션 트리거
      requestAnimationFrame(() => {
        chartEl.querySelectorAll('.role-bar-fill').forEach(bar => {
          bar.style.transition = 'width 0.7s cubic-bezier(0.4,0,0.2,1)';
          bar.style.width = bar.dataset.target + '%';
        });
      });
    }
  }

  // 관리자 전용 정산 인보이스 관리 영역 표시 여부 제어
  const invoiceSection = document.getElementById('admin-invoice-section');
  if (invoiceSection) {
    if (authed === '민제') {
      invoiceSection.style.display = 'block';
      renderInvoicesTable();
    } else {
      invoiceSection.style.display = 'none';
    }
  }
}

async function changePassword() {
  const authed = sessionStorage.getItem('artic-auth');
  if (!authed) return;

  const currentVal = document.getElementById('pw-current')?.value;
  const newVal     = document.getElementById('pw-new')?.value;
  const confirmVal = document.getElementById('pw-confirm')?.value;
  const msgEl      = document.getElementById('pw-change-msg');

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    msgEl.style.color = isError ? 'var(--error, #f87171)' : 'var(--success, #34d399)';
    setTimeout(() => { msgEl.style.display = 'none'; }, 3500);
  }

  const creds = DATA.credentials || {};
  if (!currentVal || creds[authed] !== currentVal) {
    showMsg('현재 비밀번호가 올바르지 않습니다.', true);
    return;
  }
  if (!newVal) {
    showMsg('새 비밀번호를 입력해주세요.', true);
    return;
  }
  if (newVal !== confirmVal) {
    showMsg('새 비밀번호가 일치하지 않습니다.', true);
    return;
  }

  DATA.credentials[authed] = newVal;
  await saveData(true); // silent save

  // 입력창 초기화
  document.getElementById('pw-current').value = '';
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-confirm').value = '';

  showMsg('비밀번호가 성공적으로 변경되었습니다! ✓', false);

  // 성공 시 1.5초 후 모달 닫기
  setTimeout(closePasswordModal, 1500);
}

function openPasswordModal() {
  const modal = document.getElementById('pw-change-modal');
  if (!modal) return;

  // 입력 필드 및 메시지 초기화
  const currentInput = document.getElementById('pw-current');
  const newInput = document.getElementById('pw-new');
  const confirmInput = document.getElementById('pw-confirm');
  const msgEl = document.getElementById('pw-change-msg');

  if (currentInput) currentInput.value = '';
  if (newInput) newInput.value = '';
  if (confirmInput) confirmInput.value = '';
  if (msgEl) {
    msgEl.style.display = 'none';
    msgEl.textContent = '';
  }

  modal.classList.add('show');
}

function closePasswordModal() {
  const modal = document.getElementById('pw-change-modal');
  if (modal) modal.classList.remove('show');
}

/* ===== Admin Invoice Management Functions ===== */
let currentPrintingInvoiceId = null;

function renderInvoicesTable() {
  const tbody = document.getElementById('invoice-list-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!DATA.invoices || DATA.invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">완료된 정산 인보이스가 없습니다.</td></tr>`;
    return;
  }
  
  // 최신 인보이스 순으로 정렬
  const sortedInvs = [...DATA.invoices].sort((a, b) => b.episodeIndex - a.episodeIndex);
  
  for (const inv of sortedInvs) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono font-semibold" style="color:var(--accent-purple);">${inv.id}</td>
      <td><strong>${inv.episodeLabel}</strong></td>
      <td class="text-muted" style="font-size: 0.82rem;">${inv.date}</td>
      <td class="text-right font-bold mono">${formatKRW(inv.totalAmount)}</td>
      <td class="text-center">
        <button class="btn btn-outline btn-xs" onclick="openInvoiceModal('${inv.id}')" style="padding: 4px 10px; font-size: 0.72rem; border-radius: 4px;">
          명세서 보기
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function openInvoiceModal(invoiceId) {
  const inv = DATA.invoices.find(i => i.id === invoiceId);
  if (!inv) return;
  
  currentPrintingInvoiceId = invoiceId;
  
  const contentEl = document.getElementById('invoice-slip-content');
  if (contentEl) {
    let rowsHtml = '';
    for (const det of inv.details) {
      rowsHtml += `
        <tr>
          <td><strong>${det.member}</strong></td>
          <td class="text-right mono">${formatKRW(det.base)}</td>
          <td class="text-right mono">${formatKRW(det.ppl)}</td>
          <td class="text-right font-bold mono" style="background:#f8fafc;">${formatKRW(det.total)}</td>
        </tr>
      `;
    }
    
    contentEl.innerHTML = `
      <div class="invoice-slip-header">
        <div>
          <div class="invoice-logo-title">artic - PTR PayTable</div>
          <div class="invoice-logo-sub">아틱 콘텐츠 제작 정산 정합 대시보드</div>
        </div>
        <div style="text-align: right;">
          <div class="invoice-meta-label">Invoice ID</div>
          <div class="invoice-meta-val" style="color:var(--accent-purple); font-family: monospace;">${inv.id}</div>
        </div>
      </div>
      
      <div class="invoice-billing-section">
        <div>
          <div class="invoice-billing-title">발행인 (Issuer)</div>
          <div class="invoice-billing-info">
            <strong>아틱 총괄 관리자 (김민제)</strong><br/>
            개발 및 정산 감독 부서<br/>
            artic-ptr-paytable.firebaseapp.com
          </div>
        </div>
        <div>
          <div class="invoice-billing-title">정산 정보 (Settle Info)</div>
          <div class="invoice-billing-info">
            <strong>대상 회차: ${inv.episodeLabel}</strong><br/>
            발행 일자: ${inv.date}<br/>
            정산 상태: 지급 완료 (Settled)
          </div>
        </div>
      </div>
      
      <table class="invoice-table">
        <thead>
          <tr>
            <th style="text-align: left;">수령 멤버 (Recipient)</th>
            <th style="text-align: right;">제작비 역할 페이 (Base)</th>
            <th style="text-align: right;">PPL 협찬 배분액 (PPL)</th>
            <th style="text-align: right; background:#f1f5f9;">최종 수령 완료액 (Total)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="grand-total-row">
            <td colspan="3" style="text-align: right; font-weight: 800;">총 정산 지출액 합계 (Grand Total)</td>
            <td style="text-align: right; background:#f1f5f9;">${formatKRW(inv.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top: 50px; font-size: 0.72rem; color: #64748b; line-height: 1.4;">
        * 본 명세서는 아틱(Artic) 제작회의 합의된 역할별 페이 단가 및 PPL 제작비 비례 정산 산식에 근거하여 자동으로 발행된 고유 정산 명세서입니다.<br/>
        * 멤버 개별 송금 완료 후 발행된 최종 거래 영수증이므로 세무 증빙 자료로 보존될 수 있습니다.
      </div>
      
      <div class="invoice-seal-area">
        <div class="invoice-seal-graphic">
          <div style="text-align:center; line-height: 1.2;">
            artic<br/>
            <span style="font-size:0.5rem; font-weight: bold;">송금완료</span><br/>
            APPROVED
          </div>
        </div>
      </div>
    `;
  }
  
  const modal = document.getElementById('invoice-view-modal');
  if (modal) modal.classList.add('show');
}

function closeInvoiceModal() {
  const modal = document.getElementById('invoice-view-modal');
  if (modal) modal.classList.remove('show');
  currentPrintingInvoiceId = null;
}

function printInvoice() {
  window.print();
}
