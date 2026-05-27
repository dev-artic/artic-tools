/* ===================================
   Artic PTR — Pay Table Dashboard
   app.js
=================================== */

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
    { index: 0, label: '리허설', paid: true,  artists: [],         ppl: 0, targetAmount: 0, receivedAmount: 0 },
    { index: 1, label: 'EP.1',   paid: true,  artists: ['자이언티'],  ppl: 0, targetAmount: 300000, receivedAmount: 300000 },
    { index: 2, label: 'EP.2',   paid: true,  artists: ['권기백'],   ppl: 0, targetAmount: 300000, receivedAmount: 300000 },
    { index: 3, label: 'EP.3',   paid: true,  artists: ['세이수미'],  ppl: 0, targetAmount: 300000, receivedAmount: 300000 },
    { index: 4, label: 'EP.4',   paid: true,  artists: ['주영'],     ppl: 600000, targetAmount: 300000, receivedAmount: 300000 },
    { index: 5, label: 'EP.5',   paid: true,  artists: ['제이클레프'], ppl: 0, targetAmount: 300000, receivedAmount: 300000 },
    { index: 6, label: 'EP.6',   paid: true,  artists: ['까xOL'],   ppl: 0, targetAmount: 300000, receivedAmount: 300000 },
    { index: 7, label: 'EP.7',   paid: false, artists: ['차승우'],   ppl: 800000, targetAmount: 300000, receivedAmount: 0 },
    { index: 8, label: 'EP.8',   paid: false, artists: [],          ppl: 0, targetAmount: 300000, receivedAmount: 0 },
    { index: 9, label: 'EP.9',   paid: false, artists: [],          ppl: 0, targetAmount: 300000, receivedAmount: 0 },
    { index: 10, label: 'EP.10', paid: false, artists: [],          ppl: 0, targetAmount: 300000, receivedAmount: 0 },
    { index: 11, label: 'EP.11', paid: false, artists: [],          ppl: 0, targetAmount: 300000, receivedAmount: 0 },
    { index: 12, label: 'EP.12', paid: false, artists: [],          ppl: 0, targetAmount: 500000, receivedAmount: 0 },
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

/**
 * 관리자 여부 확인 헬퍼 함수
 */
function isAdmin() {
  return sessionStorage.getItem('artic-auth') === '민제';
}

// ============================================================
// DATA LIFECYCLE (Load & Save & Exit Prevention)
// ============================================================

async function loadData(forceReload = false) {
  let loadedData = null;

  // 1. Unless forceReload, try to load from localStorage first for instant client persistence
  if (!forceReload) {
    try {
      const cached = localStorage.getItem('artic-data');
      if (cached) {
        loadedData = JSON.parse(cached);
        console.log('Successfully restored data from localStorage.');
      }
    } catch (e) {
      console.error('Failed to parse cached data from localStorage', e);
    }
  }

  // 2. Fetch from the local data.json server
  if (!loadedData) {
    try {
      const res = await fetch('data.json');
      if (res.ok) {
        loadedData = await res.json();
        console.log('Successfully loaded data from data.json.');
      }
    } catch (e) {
      console.warn('Failed to load data.json from server, falling back to defaults.', e);
    }
  }

  // 3. Fallback to DEFAULT_DATA
  if (!loadedData) {
    loadedData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  DATA = loadedData;
  recalculateProjectMetrics();
}

async function saveData(silent = false) {
  // 1. Sync immediately to browser storage
  localStorage.setItem('artic-data', JSON.stringify(DATA));
  isDirty = false;

  const adminBtn = document.getElementById('btn-save-admin');
  const rolesBtn = document.getElementById('btn-save-roles');
  const buttons = [];
  if (adminBtn) buttons.push(adminBtn);
  if (rolesBtn) buttons.push(rolesBtn);

  if (!silent) {
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.transition = 'all 0.3s ease';
      btn.innerHTML = `<svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite; margin-right: 6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"/></svg> 저장 및 Push 중...`;
    });
  }

  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DATA)
    });
    const result = await res.json();

    if (!silent) {
      buttons.forEach(btn => {
        btn.disabled = false;
        if (result.success) {
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 6px;"><polyline points="20 6 9 17 4 12"/></svg> 저장 완료`;
          btn.classList.add('btn-save-success-pulse');
          if (!result.gitPushed) {
            console.warn(result.message);
          }
        } else {
          btn.innerHTML = `저장 실패`;
        }
        setTimeout(() => {
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 저장`;
          btn.classList.remove('btn-save-success-pulse');
        }, 2500);
      });
    }
  } catch (err) {
    console.warn('Server API not running. Saved to browser localStorage only.', err);
    if (!silent) {
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 6px;"><polyline points="20 6 9 17 4 12"/></svg> 로컬 저장 완료`;
        btn.classList.add('btn-save-success-pulse');
        setTimeout(() => {
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 저장`;
          btn.classList.remove('btn-save-success-pulse');
        }, 2500);
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

  // 모든 역할(기획, DOP, 촬영 스태프, 편집 카테고리 등)은
  // 역할 총 예산(unitCostPerPerson * headcount)을 참여 인원수로 나누어 균등 배분
  const totalForRole = role.unitCostPerPerson * role.headcount;
  const perPersonAmount = Math.round(totalForRole / allParticipants.length);

  for (const member of allParticipants) {
    result[member] = perPersonAmount;
  }

  return result;
}

/**
 * 특정 에피소드에서 한 멤버가 받을 전체 금액을 계산
 * 모든 역할의 합산
 */
function calcMemberEpisodePay(memberName, epIndex) {
  let total = 0;
  for (const role of DATA.roles) {
    const rolePay = calcEpisodeRolePay(role.id, epIndex);
    total += (rolePay[memberName] || 0);
  }
  return total;
}

/**
 * 특정 에피소드에서 전체 금액 계산 (모든 멤버, 모든 역할)
 */
function calcEpisodeTotalPay(epIndex) {
  let total = 0;
  for (const role of DATA.roles) {
    const rolePay = calcEpisodeRolePay(role.id, epIndex);
    for (const v of Object.values(rolePay)) total += v;
  }
  return total;
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

// ============================================================
// TAB NAVIGATION (Dirty check exit alert implemented)
// ============================================================
async function switchTab(tabId) {
  // If changes are unsaved, alert user
  if (isDirty) {
    const save = confirm("변경된 사항이 있습니다. 저장하시겠습니까?");
    if (save) {
      await saveData(true); // Silent save in background
    } else {
      // Revert to last saved data from localStorage/server
      await loadData(true);
      isDirty = false;
    }
  }

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

  // Episode dots in progress bar
  const dotsEl = document.getElementById('episode-dots');
  if (dotsEl) {
    dotsEl.innerHTML = '';
    for (const ep of DATA.episodes) {
      if (ep.index > 7) continue; // 실제 활성 EP만
      const dot = document.createElement('div');
      dot.className = `ep-dot ${ep.paid ? 'paid' : 'pending'}`;
      dot.innerHTML = `
        <span>${ep.label}</span>
        ${ep.paid ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
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

  tbody.innerHTML = '';
  const totals = getMemberTotals();
  let colSums = new Array(DATA.episodes.length).fill(0);

  for (const m of DATA.members) {
    const tr = document.createElement('tr');
    let cells = `<td><span class="member-tag">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
      ${m}
    </span></td>`;

    // Rehearsal + EP.1~7 (8 episodes shown)
    const shown = [0,1,2,3,4,5,6,7];
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
  for (const i of [0,1,2,3,4,5,6,7]) {
    grandTotal += colSums[i];
    sumCells += `<td class="text-right mono">${formatKRW(colSums[i])}</td>`;
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
    if (ep.index > 7) continue; // 현재 활성 에피소드만 (확장 가능)
    const chip = document.createElement('div');
    chip.className = `ep-chip ${ep.index === currentEpIndex ? 'active' : ''} ${ep.paid ? 'paid-chip' : ''}`;
    chip.textContent = ep.label + (ep.paid ? ' ✓' : '');
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
  if (labelEl) labelEl.textContent = ep.label;
  if (prevBtn) prevBtn.disabled = currentEpIndex === 0;
  if (nextBtn) nextBtn.disabled = currentEpIndex >= 7;

  renderEpisodeChips();

  // Artists
  const artistEl = document.getElementById('ep-artist-display');
  if (artistEl) {
    if (ep.artists && ep.artists.length > 0) {
      artistEl.innerHTML = ep.artists.map(a => `
        <div class="artist-chip">
          <span class="artist-dot"></span>
          <span>${a}</span>
        </div>
      `).join('');
    } else {
      artistEl.innerHTML = `<span style="color:var(--text-muted);font-size:0.82rem">출연 아티스트 없음</span>`;
    }
  }

  // PPL
  const pplAmountEl = document.getElementById('ep-ppl-amount');
  const pplLabelEl = document.getElementById('ep-ppl-label');
  if (pplAmountEl && pplLabelEl) {
    if (ep.ppl > 0) {
      pplAmountEl.textContent = formatKRW(ep.ppl);
      pplAmountEl.style.color = '';
      pplLabelEl.textContent = `PPL 수입 발생`;
    } else {
      pplAmountEl.textContent = '₩0';
      pplAmountEl.style.color = 'var(--text-muted)';
      pplLabelEl.textContent = 'PPL 없음';
    }
  }

  // Role table
  renderEpisodeRoleTable();

  // Multi-role notice
  const multiRoles = getMultiRoleMembers(currentEpIndex);
  const noticeEl = document.getElementById('multi-role-notice');
  const detailEl = document.getElementById('multi-role-detail');
  if (noticeEl && detailEl) {
    if (multiRoles.length > 0) {
      noticeEl.style.display = 'flex';
      const lines = multiRoles.map(mr => {
        const memberRoles = DATA.roles
          .filter(r => {
            if (currentEpIndex === 0 && !r.includesRehearsal) return false;
            const p = DATA.participation[r.id];
            return p && p[mr.name] && p[mr.name][currentEpIndex];
          })
          .map(r => r.name);
        return `${mr.name}: ${memberRoles.join(' + ')} (${mr.count}개 역할 → 각 역할 페이 수령)`;
      });
      detailEl.innerHTML = lines.join('<br>');
    } else {
      noticeEl.style.display = 'none';
    }
  }
}

function renderEpisodeRoleTable() {
  const tbody = document.getElementById('ep-role-tbody');
  const totalEl = document.getElementById('ep-grand-total');
  const badgeEl = document.getElementById('ep-total-badge');

  if (!tbody) return;
  tbody.innerHTML = '';
  let grandTotal = 0;

  for (const role of DATA.roles) {
    // 리허설 없는 역할은 리허설 에피소드에서 표시만 다르게
    const isApplicable = !(currentEpIndex === 0 && !role.includesRehearsal);
    const rolePay = calcEpisodeRolePay(role.id, currentEpIndex);
    const participants = DATA.members.filter(m => {
      const p = DATA.participation[role.id];
      return p && p[m] && p[m][currentEpIndex];
    });
    const roleTotal = Object.values(rolePay).reduce((a, b) => a + b, 0);
    grandTotal += roleTotal;

    // Area badge color
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
      const extraStyle = isAdmin() ? '' : 'style="pointer-events:none;opacity:0.85;cursor:not-allowed;"';
      return `<div class="participant-chip ${isChecked ? 'active' : ''}" ${extraStyle}
                onclick="toggleParticipation('${role.id}', '${m}', ${currentEpIndex})"
                title="${isChecked ? payAmt.toLocaleString() + '원 지급' : '미참여'}">
        <input type="checkbox" ${isChecked ? 'checked' : ''} ${isAdmin() ? '' : 'disabled'} style="display:none;" />
        ${m}
        ${isChecked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </div>`;
    }).join('');

    // Per-person amount (from calculation)
    let perPerson = 0;
    if (participants.length > 0 && isApplicable) {
      const totalForRole = role.unitCostPerPerson * role.headcount;
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
  const p = DATA.participation[roleId];
  if (!p || !p[memberName]) return;

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
  if (newIdx < 0 || newIdx > 7) return;
  currentEpIndex = newIdx;
  renderEpisodeTab();
}

// ============================================================
// MEMBERS TAB
// ============================================================
function renderMemberCards() {
  const grid = document.getElementById('member-cards-grid');
  if (!grid) return;
  const matrix = buildPayMatrix();
  const totals = getMemberTotals();
  const colors = DATA.memberColors;

  grid.innerHTML = '';
  const memberRoleSummary = {
    '민제': ['기획', '촬영 스태프', '편집-A'],
    '광규': ['D.O.P.', '촬영 스태프', '편집-B'],
    '경엽': ['기획', '촬영 스태프', '편집-A(어시)'],
    '정호': ['기획', '촬영 스태프', '편집-B(어시)'],
  };

  for (const m of DATA.members) {
    const card = document.createElement('div');
    card.className = 'member-card';

    const miniEps = [0,1,2,3,4,5,6,7].map(i => {
      const amt = matrix[m][i] || 0;
      return `<span class="member-ep-dot ${amt > 0 ? 'has-pay' : 'no-pay'}" title="${DATA.episodes[i].label}: ${formatKRW(amt)}">
        ${DATA.episodes[i].label === '리허설' ? 'R' : DATA.episodes[i].label.replace('EP.', '')}
      </span>`;
    }).join('');

    card.innerHTML = `
      <div class="member-card-header">
        <div class="member-avatar" style="background:${colors[m]}">${m[0]}</div>
        <div>
          <div class="member-name">${m}</div>
          <div class="member-roles-list">${(memberRoleSummary[m] || []).join(' · ')}</div>
        </div>
      </div>
      <div class="member-total" style="color:${m === '민제' ? '#4f8ef7' : m === '광규' ? '#3ecf8e' : m === '경엽' ? '#f5c842' : '#f87171'}">${formatKRW(totals[m])}</div>
      <div class="member-total-label">누적 수령 예정액</div>
      <div class="member-ep-mini">${miniEps}</div>
    `;
    grid.appendChild(card);
  }
}

function renderMemberDetailTable() {
  const tbody = document.getElementById('member-detail-tbody');
  if (!tbody) return;
  const matrix = buildPayMatrix();
  const totals = getMemberTotals();

  tbody.innerHTML = '';
  let colSums = {};
  let grandTotal = 0;

  for (const m of DATA.members) {
    const tr = document.createElement('tr');
    let cells = `<td><span class="member-tag">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
      ${m}
    </span></td>`;
    for (const i of [0,1,2,3,4,5,6,7]) {
      const amt = matrix[m][i] || 0;
      colSums[i] = (colSums[i] || 0) + amt;
      cells += `<td class="text-right mono ${amt > 0 ? '' : ''}">${amt > 0 ? formatKRW(amt) : '<span style="color:var(--text-muted)">—</span>'}</td>`;
    }
    grandTotal += totals[m];
    cells += `<td class="text-right highlight-col">${formatKRW(totals[m])}</td>`;
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  }

  // SUM
  const sumTr = document.createElement('tr');
  sumTr.className = 'total-row';
  let sumCells = `<td><strong>합계</strong></td>`;
  for (const i of [0,1,2,3,4,5,6,7]) {
    sumCells += `<td class="text-right mono">${formatKRW(colSums[i] || 0)}</td>`;
  }
  sumCells += `<td class="text-right highlight-col">${formatKRW(grandTotal)}</td>`;
  sumTr.innerHTML = sumCells;
  tbody.appendChild(sumTr);
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
          <input type="number" value="${role.unitCostPerPerson}" 
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
    role.description = val;
    isDirty = true;
  }
}

function updateRoleCost(roleId, val) {
  const role = DATA.roles.find(r => r.id === roleId);
  if (role) {
    role.unitCostPerPerson = parseInt(val) || 0;
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
      if (ep.index > 7) continue;
      const item = document.createElement('div');
      item.className = 'ep-income-item';
      item.innerHTML = `
        <div class="ep-income-ep">${ep.label}</div>
        <div class="ep-income-status">
          <span class="status-dot ${ep.paid ? 'paid' : 'pending'}"></span>
          <span style="color:${ep.paid ? 'var(--accent-green)' : 'var(--text-muted)'}">${ep.paid ? '입금 확인' : '대기 중'}</span>
        </div>
      `;
      epList.appendChild(item);
    }
  }

  // PPL list
  const pplList = document.getElementById('ppl-list');
  if (pplList) {
    pplList.innerHTML = '';
    const pplEps = DATA.episodes.filter(ep => ep.ppl > 0);
    for (const ep of pplEps) {
      const item = document.createElement('div');
      item.className = 'ppl-item';
      item.innerHTML = `
        <div class="ppl-ep">${ep.label}</div>
        <div class="ppl-amount-sm">${formatKRW(ep.ppl)}</div>
      `;
      pplList.appendChild(item);
    }
    if (pplEps.length === 0) {
      pplList.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem">PPL 수입 없음</span>';
    }
  }

  // PPL 합계 갱신
  const pplTotalEl = document.getElementById('ppl-total-display');
  if (pplTotalEl) {
    pplTotalEl.textContent = formatKRW(DATA.project.pplTotal);
  }

  // 정기 지출 테이블 갱신 (1월, 2월, 3월, 합계 td)
  const costJanEl = document.getElementById('income-cost-jan');
  const costFebEl = document.getElementById('income-cost-feb');
  const costMarEl = document.getElementById('income-cost-mar');
  const costTotalEl = document.getElementById('income-cost-total');

  if (costJanEl && costFebEl && costMarEl && costTotalEl) {
    costJanEl.textContent = formatKRW(DATA.blackmagicCosts.jan);
    costFebEl.textContent = formatKRW(DATA.blackmagicCosts.feb);
    costMarEl.textContent = formatKRW(DATA.blackmagicCosts.mar);
    costTotalEl.textContent = formatKRW(DATA.project.blackmagicCost);
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
  if (CREDENTIALS[name] && CREDENTIALS[name] === pw) {
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
async function init() {
  // Load data dynamically
  await loadData();

  // Roles 저장 버튼 및 관리자 메뉴 제어
  const saveBtn = document.getElementById('btn-save-roles');
  if (saveBtn) {
    saveBtn.style.display = isAdmin() ? 'flex' : 'none';
  }
  const adminNav = document.getElementById('nav-admin');
  if (adminNav) {
    adminNav.style.display = isAdmin() ? 'flex' : 'none';
  }

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
  if (authed && CREDENTIALS[authed]) {
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
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// ADMIN LOGIC (Dynamic Data Update)
// ============================================================
function recalculateProjectMetrics() {
  // 1. 예정액 합계
  DATA.project.contractAmount = DATA.episodes.reduce((sum, ep) => sum + (ep.targetAmount || 0), 0);

  // 2. 수령액 합계
  DATA.project.receivedAmount = DATA.episodes.reduce((sum, ep) => sum + (ep.receivedAmount || 0), 0);

  // 3. PPL 합계
  DATA.project.pplTotal = DATA.episodes.reduce((sum, ep) => sum + (ep.ppl || 0), 0);

  // 4. BlackMagic 비용 합계
  DATA.project.blackmagicCost = (DATA.blackmagicCosts ? Object.values(DATA.blackmagicCosts).reduce((sum, c) => sum + c, 0) : 64025);

  // 5. 총 용역 비용
  let totalLabor = 0;
  for (const ep of DATA.episodes) {
    if (ep.index > 7) continue; // 활성 에피소드만
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

    // 우클릭 삭제 이벤트
    div.addEventListener('contextmenu', handleEpisodeCardContextMenu);

    div.innerHTML = `
      <div class="admin-ep-card-header">
        <span class="admin-ep-card-title">${ep.label}</span>
        <label class="admin-ep-paid-label">
          <input type="checkbox" ${ep.paid ? 'checked' : ''} onchange="updateEpisodeData(${ep.index}, 'paid', this.checked)" style="cursor:pointer;" />
          정산 완료
        </label>
      </div>
      <div class="admin-ep-card-body">
        <div class="role-field">
          <label>입금 예정액 (원)</label>
          <input type="number" class="admin-input" value="${ep.targetAmount || 0}" onchange="updateEpisodeData(${ep.index}, 'targetAmount', this.value)" />
        </div>
        <div class="role-field">
          <label>실제 입금액 (원)</label>
          <input type="number" class="admin-input" value="${ep.receivedAmount || 0}" onchange="updateEpisodeData(${ep.index}, 'receivedAmount', this.value)" />
        </div>
        <div class="role-field">
          <label>출연 아티스트 (게스트)</label>
          <input type="text" class="admin-input" value="${ep.artists ? ep.artists.join(', ') : ''}" onchange="updateEpisodeArtists(${ep.index}, this.value)" placeholder="쉼표(,)로 구분" style="text-align:left;" />
        </div>
        <div class="role-field">
          <label>PPL 수입 (원)</label>
          <input type="number" class="admin-input" value="${ep.ppl || 0}" onchange="updateEpisodeData(${ep.index}, 'ppl', this.value)" />
        </div>
      </div>
    `;
    grid.appendChild(div);
  }

  // 2. 정기 지출 비용 인풋 채우기
  const janInput = document.getElementById('admin-cost-jan');
  const febInput = document.getElementById('admin-cost-feb');
  const marInput = document.getElementById('admin-cost-mar');
  if (janInput && febInput && marInput) {
    janInput.value = DATA.blackmagicCosts.jan;
    febInput.value = DATA.blackmagicCosts.feb;
    marInput.value = DATA.blackmagicCosts.mar;
  }
}

function logout() {
  sessionStorage.removeItem('artic-auth');
  location.reload();
}

function updateEpisodeArtists(epIndex, rawValue) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  // 쉼표로 파싱
  ep.artists = rawValue.split(',')
    .map(s => s.trim())
    .filter(Boolean);

  isDirty = true; // Mark unsaved changes
  renderOverview();
  renderEpisodeTab();
}

function updateEpisodeData(epIndex, field, value) {
  const ep = DATA.episodes.find(e => e.index === epIndex);
  if (!ep) return;

  if (field === 'paid') {
    ep.paid = value;
  } else {
    ep[field] = parseInt(value) || 0;
  }

  isDirty = true; // Mark unsaved changes

  // 글로벌 수치 재계산 및 UI 강제 리렌더링
  recalculateProjectMetrics();

  // 현재 탭 갱신 및 전체 UI 업데이트
  renderOverview();
  renderIncomeTab();
  renderMemberCards();
  renderMemberDetailTable();
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
  // 현재 최대 인덱스를 찾아 새 인덱스 지정
  const maxIdx = DATA.episodes.length > 0 ? Math.max(...DATA.episodes.map(e => e.index)) : 0;
  const newIndex = maxIdx + 1;
  const newEp = {
    index: newIndex,
    label: `EP.${newIndex}`,
    paid: false,
    artists: [],
    ppl: 0,
    targetAmount: 300000,
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

function handleDeleteEpisodeClick() {
  if (selectedEpIndexForDelete === null) return;

  // 컨텍스트 메뉴 닫기
  const menu = document.getElementById('custom-context-menu');
  if (menu) menu.style.display = 'none';

  if (confirm(`정말 해당 에피소드를 삭제하시겠습니까?`)) {
    deleteEpisode(selectedEpIndexForDelete);
  }

  selectedEpIndexForDelete = null;
}

function deleteEpisode(epIndex) {
  if (epIndex === 0) return; // 리허설 보호

  const targetIdx = DATA.episodes.findIndex(e => e.index === epIndex);
  if (targetIdx === -1) return;

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
