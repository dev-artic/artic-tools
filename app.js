/* ===================================
   Artic PTR — Pay Table Dashboard
   app.js
=================================== */

// ============================================================
// DATA MODEL (엑셀 분석 기반)
// ============================================================

const DATA = {
  // 프로젝트 기본 정보
  project: {
    name: 'Artic PTR',
    season: 1,
    totalEpisodes: 12,
    contractAmount: 3800000,      // 계약된 입금 예정액
    receivedAmount: 1800000,       // 현재 입금액
    laborCost: 1276560,            // 투입 용역비용 (Grand Total)
    profit: 523440,                // 순이익
    pplTotal: 1400000,             // PPL 총액
    blackmagicCost: 64025,         // BlackMagic Cloud 지출
  },

  // 멤버 목록
  members: ['민제', '광규', '경엽', '정호'],

  // 멤버 아바타 색상
  memberColors: {
    '민제':  'linear-gradient(135deg, #4f8ef7, #7c5ff5)',
    '광규':  'linear-gradient(135deg, #3ecf8e, #22b8e0)',
    '경엽':  'linear-gradient(135deg, #f5c842, #f59e0b)',
    '정호':  'linear-gradient(135deg, #f87171, #ec4899)',
  },

  // 역할 정의 (엑셀 Row 7~14 기반)
  // episodeCount: 리허설=1, 에피소드=12 → 총 13회 (D.O.P.는 13회, 촬영스태프는 12회)
  roles: [
    {
      id: 'planning',
      name: '기획',
      area: '기획',
      description: '[리허설 포함] + 에피소드 별 기획회의',
      unitCostPerEp: 63080,    // 역할 전체 단가 (4인 기준)
      headcount: 4,
      unitCostPerPerson: 15770, // 인당 단가
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
      unitCostPerEp: 30000,   // 2인 기준
      headcount: 2,
      unitCostPerPerson: 15000, // 인당 단가
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

  // 에피소드 정보
  // index 0 = 리허설, index 1~12 = EP1~EP12
  episodes: [
    { index: 0, label: '리허설', paid: true,  artists: [],         ppl: 0 },
    { index: 1, label: 'EP.1',   paid: true,  artists: ['자이언티'],  ppl: 0 },
    { index: 2, label: 'EP.2',   paid: true,  artists: ['권기백'],   ppl: 0 },
    { index: 3, label: 'EP.3',   paid: true,  artists: ['세이수미'],  ppl: 0 },
    { index: 4, label: 'EP.4',   paid: true,  artists: ['주영'],     ppl: 600000 },
    { index: 5, label: 'EP.5',   paid: true,  artists: ['제이클레프'], ppl: 0 },
    { index: 6, label: 'EP.6',   paid: true,  artists: ['까xOL'],   ppl: 0 },
    { index: 7, label: 'EP.7',   paid: false, artists: ['차승우'],   ppl: 800000 },
    { index: 8, label: 'EP.8',   paid: false, artists: [],          ppl: 0 },
    { index: 9, label: 'EP.9',   paid: false, artists: [],          ppl: 0 },
    { index: 10, label: 'EP.10', paid: false, artists: [],          ppl: 0 },
    { index: 11, label: 'EP.11', paid: false, artists: [],          ppl: 0 },
    { index: 12, label: 'EP.12', paid: false, artists: [],          ppl: 0 },
  ],

  // 참여 현황 (엑셀 Row 16~32 기반)
  // participation[roleId][memberName][episodeIndex] = true/false
  // episodeIndex: 0=리허설, 1~12=EP1~EP12
  participation: {
    // 기획: 4명 전원, 리허설+EP1~7
    planning: {
      '민제': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '광규': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '정호': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
    },
    // D.O.P.: 광규 (리허설 포함)
    dop: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [true,  true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    // 촬영 스태프 (리허설 없음, EP1~7)
    camera_staff: {
      '민제': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '광규': [false, true, true, true, true, true, true, true, false,false,false,false,false], // DOP이지만 촬영 스태프도 체크
      '경엽': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '정호': [true, false,false,true, false,true, false,false,false,false,false,false,false],
    },
    // 편집-A: 민제 (EP1~4)
    edit_a: {
      '민제': [false, true, true, true, true, false,false,false,false,false,false,false,false],
      '광규': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    // 편집-A 어시: 경엽 (EP1~7)
    edit_a_assist: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '경엽': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    // 편집-B: 광규 (EP1~7)
    edit_b: {
      '민제': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '광규': [false, true, true, true, true, true, true, true, false,false,false,false,false],
      '경엽': [false, false,false,false,false,false,false,false,false,false,false,false,false],
      '정호': [false, false,false,false,false,false,false,false,false,false,false,false,false],
    },
    // 편집-B 어시: 정호 (EP1~7)
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
let currentEpIndex = 0; // 0 = 리허설

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
 * 핵심 규칙:
 * - 역할에 정해진 headcount가 있고, 인당 단가(unitCostPerPerson)가 있음
 * - 이 역할의 총 예산 = unitCostPerPerson × headcount
 * - 해당 에피소드에 참여 체크된 멤버들 중,
 *   다른 역할도 동시에 맡는 멤버(다중 역할자)는 이 역할의 페이 풀에서 제외됨
 *   → 단, camera_staff 역할에서 DOP(광규)는 항상 제외
 *   → 그 멤버의 몫이 나머지 참여자들에게 균등 재분배
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

  // 다중 역할자 제외 로직:
  // camera_staff 역할의 경우, DOP(광규)처럼 주요 역할이 있는 멤버는 제외
  // 일반 규칙: 이 에피소드에서 2개 이상의 역할을 맡는 멤버는
  //            각 역할에서 독립적으로 페이를 받되,
  //            하나의 역할에서 "스태프 풀"을 차지하지 않도록 함
  //
  // 엑셀 검증 결과:
  // - camera_staff: 광규는 DOP이므로 제외 → 총액(2인분)을 나머지 참여자에게 분배
  // - 기획, 편집: 각자 역할 단가를 수령 (다중 역할도 각각 수령)
  //
  // 규칙: camera_staff에서만 DOP(광규) 제외, 나머지는 체크된 인원 그대로 수령

  let eligibleParticipants = allParticipants;

  if (roleId === 'camera_staff') {
    // DOP인 멤버(광규)가 촬영 스태프에도 체크된 경우 제외
    const dopParticipants = DATA.members.filter(m => {
      const dopPart = DATA.participation['dop'];
      return dopPart && dopPart[m] && dopPart[m][epIndex];
    });
    eligibleParticipants = allParticipants.filter(m => !dopParticipants.includes(m));
  }

  if (eligibleParticipants.length === 0) return {};

  // 역할 총 예산 = 인당 단가 × 기준 인원
  const totalForRole = role.unitCostPerPerson * role.headcount;
  // 실제 수령 인원으로 균등 분배
  const perPersonAmount = Math.round(totalForRole / eligibleParticipants.length);

  const result = {};
  for (const member of eligibleParticipants) {
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
// TAB NAVIGATION
// ============================================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function renderOverview() {
  // Episode dots in progress bar
  const dotsEl = document.getElementById('episode-dots');
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
  document.getElementById('ep-current-label').textContent = ep.label;
  document.getElementById('ep-prev').disabled = currentEpIndex === 0;
  document.getElementById('ep-next').disabled = currentEpIndex >= 7;

  renderEpisodeChips();

  // Artists
  const artistEl = document.getElementById('ep-artist-display');
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

  // PPL
  const pplAmountEl = document.getElementById('ep-ppl-amount');
  const pplLabelEl = document.getElementById('ep-ppl-label');
  if (ep.ppl > 0) {
    pplAmountEl.textContent = formatKRW(ep.ppl);
    pplLabelEl.textContent = `PPL 수입 발생`;
  } else {
    pplAmountEl.textContent = '₩0';
    pplAmountEl.style.color = 'var(--text-muted)';
    pplLabelEl.textContent = 'PPL 없음';
  }

  // Role table
  renderEpisodeRoleTable();

  // Multi-role notice
  const multiRoles = getMultiRoleMembers(currentEpIndex);
  const noticeEl = document.getElementById('multi-role-notice');
  const detailEl = document.getElementById('multi-role-detail');
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

function renderEpisodeRoleTable() {
  const tbody = document.getElementById('ep-role-tbody');
  const totalEl = document.getElementById('ep-grand-total');
  const badgeEl = document.getElementById('ep-total-badge');

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
      return `<label class="participant-chip ${isChecked ? 'active' : ''}" 
                onclick="toggleParticipation('${role.id}', '${m}', ${currentEpIndex})"
                title="${isChecked ? payAmt.toLocaleString() + '원 지급' : '미참여'}">
        <input type="checkbox" ${isChecked ? 'checked' : ''} />
        ${m}
        ${isChecked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </label>`;
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

  totalEl.innerHTML = `<strong>${formatKRW(grandTotal)}</strong>`;
  badgeEl.textContent = `총 ${formatKRW(grandTotal)}`;
}

function toggleParticipation(roleId, memberName, epIndex) {
  const p = DATA.participation[roleId];
  if (!p || !p[memberName]) return;
  p[memberName][epIndex] = !p[memberName][epIndex];
  renderEpisodeRoleTable();

  // Also update multi-role notice
  const multiRoles = getMultiRoleMembers(epIndex);
  const noticeEl = document.getElementById('multi-role-notice');
  const detailEl = document.getElementById('multi-role-detail');
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

  // Refresh member tab if visible
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
        <input type="text" value="${role.description}" onchange="updateRoleDesc('${role.id}', this.value)" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="role-field">
          <label>인당 단가 (원)</label>
          <input type="number" value="${role.unitCostPerPerson}" 
            onchange="updateRoleCost('${role.id}', this.value)" />
        </div>
        <div class="role-field">
          <label>기준 인원</label>
          <input type="number" value="${role.headcount}" 
            onchange="updateRoleHeadcount('${role.id}', this.value)" />
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
  if (role) role.description = val;
}

function updateRoleCost(roleId, val) {
  const role = DATA.roles.find(r => r.id === roleId);
  if (role) {
    role.unitCostPerPerson = parseInt(val) || 0;
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

function saveRoleSettings() {
  const btn = document.querySelector('.btn-primary');
  const orig = btn.innerHTML;
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 저장됨!`;
  btn.style.background = '#3ecf8e';
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.background = '';
  }, 2000);
  renderOverview();
  renderMemberCards();
  renderMemberDetailTable();
}

// ============================================================
// INCOME TAB
// ============================================================
function renderIncomeTab() {
  // Episode income list
  const epList = document.getElementById('ep-income-list');
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

  // PPL list
  const pplList = document.getElementById('ppl-list');
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
// INIT
// ============================================================
function init() {
  renderOverview();
  renderEpisodeTab();
  renderMemberCards();
  renderMemberDetailTable();
  renderRolesGrid();
  renderIncomeTab();
}

document.addEventListener('DOMContentLoaded', init);
