/**
 * shared/layout.js
 * ─────────────────────────────────────────────────────────────────
 * 공통 앱 레이아웃 템플릿 엔진 (TNT 디자인 & 구조 적용 버전)
 * ─────────────────────────────────────────────────────────────────
 * #artic-app-layout 요소를 탐색하여 동적으로 TNT 스타일의 헤더, 사이드바,
 * 반응형 토글, 시계, 테마 토글, Firebase Auth 권한 필터링 등을 자동으로 삽입합니다.
 */

(function () {
  'use strict';

  // Lucide Panel Left Close/Open SVG Definitions
  const SVG_PANEL_CLOSE = '<rect width="18" height="18" x="3" y="3" rx="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3v18" stroke-linecap="round" stroke-linejoin="round"/><path d="m16 15-3-3 3-3" stroke-linecap="round" stroke-linejoin="round"/>';
  const SVG_PANEL_OPEN = '<rect width="18" height="18" x="3" y="3" rx="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3v18" stroke-linecap="round" stroke-linejoin="round"/><path d="m14 9 3 3-3 3" stroke-linecap="round" stroke-linejoin="round"/>';

  // DOM 로드 대기 및 레이아웃 초기화
  document.addEventListener('DOMContentLoaded', initializeLayout);

  function initializeLayout() {
    const layoutContainer = document.getElementById('artic-app-layout');
    if (!layoutContainer) return;

    // 1. 설정 정보 파악
    const title = layoutContainer.getAttribute('data-title') || 'ARTIC';
    const subtitle = layoutContainer.getAttribute('data-subtitle') || '';
    const badgeText = layoutContainer.getAttribute('data-badge') || '';
    const projectKey = layoutContainer.getAttribute('data-project-key');
    const appKey = layoutContainer.getAttribute('data-app-key') || projectKey;
    const shortName = layoutContainer.getAttribute('data-short-name') || title.slice(0, 2).toUpperCase();

    // 2. iframe 및 독립 실행 환경 제어
    const isEmbedded = window !== window.top;
    if (!isEmbedded && appKey) {
      // 독립 실행(standalone) 시 부모 포털 셸로 리다이렉트
      window.location.replace(`../#${appKey}`);
      return;
    } else if (isEmbedded) {
      document.body.classList.add('in-iframe');
    }

    // 3. 로딩 오버레이 삽입 (인증 상태 확인 전까지 깜빡임 방지)
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'layout-loading-overlay';
    loadingOverlay.innerHTML = '<div class="layout-spinner"></div>';
    document.body.appendChild(loadingOverlay);

    // 4. HTML slots 추출
    const originalNav = layoutContainer.querySelector('nav');
    const originalMain = layoutContainer.querySelector('main') || layoutContainer.querySelector('#main-content') || layoutContainer.querySelector('.main-content');

    // 5. 전체 셸 클래스명 부여
    layoutContainer.className = 'workspace-shell';
    if (isEmbedded) {
      layoutContainer.classList.add('embedded');
    }

    // 로컬 스토리지에 저장된 사이드바 접힘 상태 복원
    const isCollapsed = localStorage.getItem('artic-sidebar-collapsed') === 'true';
    if (isCollapsed && !isEmbedded) {
      layoutContainer.classList.add('sidebar-collapsed');
    }

    // 6. 공통 헤더 생성 (iframe이 아닐 때만 노출되며, layout.css에 의해 iframe 내에서는 숨김 처리됨)
    const header = document.createElement('header');
    header.className = 'portal-header';
    header.innerHTML = `
      <div class="brand-wrap" onclick="location.href='../'" style="cursor:pointer;">
        <img src="../artic-logo-full-ver.svg" alt="ARTIC Logo" class="logo-img">
      </div>
      <div class="header-actions-wrap">
        <button id="theme-toggle-btn" class="theme-toggle-btn" title="테마 변경">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path id="theme-icon-path" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <div class="clock-widget">
          <div class="clock-dot"></div>
          <span id="kst-clock">KST --:--:--</span>
        </div>
        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="메뉴 열기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    `;
    document.body.insertBefore(header, layoutContainer);

    // 7. 모바일 백그라운드 블러 스크림(scrim) 생성
    const mobileScrim = document.createElement('button');
    mobileScrim.className = 'mobile-scrim';
    mobileScrim.id = 'mobile-scrim';
    mobileScrim.setAttribute('aria-label', '메뉴 닫기');
    document.body.insertBefore(mobileScrim, layoutContainer);

    // 8. TNT 스타일의 사이드바 생성
    const sidebar = document.createElement('aside');
    sidebar.className = 'workspace-sidebar';
    sidebar.id = 'sidebar';

    sidebar.innerHTML = `
      <button class="project-mark" id="sidebar-brand-logo">
        <span>${shortName}</span>
        <div class="sidebar-label">
          <strong>${title}</strong>
          <small>${subtitle}</small>
        </div>
      </button>
      
      <div class="sidebar-toggle-wrap">
        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="메뉴 축소" aria-expanded="${!isCollapsed}">
          <svg id="sidebar-toggle-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${isCollapsed ? SVG_PANEL_OPEN : SVG_PANEL_CLOSE}
          </svg>
          <span class="sidebar-label" id="sidebar-toggle-label">${isCollapsed ? '메뉴 확대' : '메뉴 축소'}</span>
        </button>
      </div>

      <nav id="layout-nav-menu"></nav>

      <div class="project-badge" id="layout-project-badge" style="display: none; margin-top: auto; margin-left: 10px; margin-bottom: 8px;">
        <div class="badge-dot-container">
          <span class="badge-dot"></span>
        </div>
        <span class="sidebar-label" style="font-size: 11px;">${badgeText}</span>
      </div>

      <div class="sidebar-note">
        <span class="sync-dot"></span>
        <div class="sidebar-label">
          <span>Notion 병행 운영</span>
          <small>Firestore 연결 전</small>
        </div>
      </div>
    `;
    layoutContainer.appendChild(sidebar);

    // 9. 내비게이션 메뉴 마이그레이션 및 "내 계정" 분리 처리
    const navMenu = sidebar.querySelector('#layout-nav-menu');
    let accountTabItem = null;

    if (originalNav) {
      const menuSource = originalNav.querySelector('ul') || originalNav;
      
      // 내 계정 탭 탐색 및 별도 보관
      const accountItem = menuSource.querySelector('[data-tab="account"]') || menuSource.querySelector('#nav-account-tab');
      if (accountItem) {
        accountTabItem = accountItem.cloneNode(true);
        accountItem.remove();
      }

      // 메뉴 이동
      while (menuSource.firstElementChild) {
        const child = menuSource.firstElementChild;
        // li 태그 내부 요소를 깔끔하게 버튼/텍스트 형식으로 노출하도록 속성 정돈
        if (child.tagName === 'LI') {
          if (child.classList.contains('nav-admin-header')) {
            child.classList.add('sidebar-label');
            child.classList.add('nav-group-label');
          } else {
            child.classList.add('nav-item');
            
            // 내부 span 요소에 sidebar-label 클래스 자동 주입
            const span = child.querySelector('span');
            if (span && !span.classList.contains('sidebar-label')) {
              span.classList.add('sidebar-label');
            }
          }
        }
        navMenu.appendChild(child);
      }
      originalNav.remove();
    }

    // 내 계정 메뉴가 존재하면 내비게이션 하단에 배치
    if (accountTabItem) {
      accountTabItem.classList.add('nav-item');
      
      // 내부 span 요소에 sidebar-label 클래스 자동 주입
      const span = accountTabItem.querySelector('span');
      if (span && !span.classList.contains('sidebar-label')) {
        span.classList.add('sidebar-label');
      }
      
      accountTabItem.style.marginTop = 'auto'; // 하단 정렬 밀어내기
      accountTabItem.style.borderTop = '1px solid var(--line)';
      accountTabItem.style.paddingTop = '12px';
      accountTabItem.style.borderRadius = '0';
      navMenu.appendChild(accountTabItem);
    }

    // 프로젝트 배지 가시성
    if (badgeText) {
      sidebar.querySelector('#layout-project-badge').style.display = 'flex';
    }

    // 10. 콘텐츠 영역 구조화 (.workspace-main & .workspace-content)
    const mainWrapper = document.createElement('main');
    mainWrapper.className = 'workspace-main';
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'workspace-content';

    if (originalMain) {
      // 기존 main 요소를 가져와 동적 구조 내부로 밀어 넣음
      originalMain.parentNode.insertBefore(mainWrapper, originalMain);
      mainWrapper.appendChild(contentWrapper);
      contentWrapper.appendChild(originalMain);
      
      // 기존에 존재하던 레이아웃 깨짐을 방지하기 위해 구조화 클래스 추가
      originalMain.className = 'tab-container-root';
    } else {
      layoutContainer.appendChild(mainWrapper);
      mainWrapper.appendChild(contentWrapper);
    }

    // 11. 시계 구동
    initLayoutClock();

    // 12. 이벤트 바인딩
    // 로고 클릭 시 첫 번째 탭(overview)으로 전환되도록 지원
    const brandLogoBtn = sidebar.querySelector('#sidebar-brand-logo');
    if (brandLogoBtn) {
      brandLogoBtn.addEventListener('click', function () {
        if (typeof switchTab === 'function') switchTab('overview');
      });
    }

    // 테마 토글 버튼 클릭
    const themeBtn = header.querySelector('#theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleLayoutTheme);

    // 사이드바 토글 버튼 클릭 (데스크톱 접기/펴기 및 태블릿/모바일 드로어 열기/닫기)
    const sidebarToggleBtn = sidebar.querySelector('#sidebar-toggle');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', function () {
        const isMobileOrTablet = window.innerWidth <= 1200;
        
        if (isMobileOrTablet) {
          // 태블릿/모바일에서는 드로어(sidebar-open) 토글
          const isActive = layoutContainer.classList.contains('sidebar-open');
          toggleMobileSidebarState(!isActive);
        } else {
          // 데스크톱에서는 접힘(sidebar-collapsed) 토글
          const isNowCollapsed = layoutContainer.classList.toggle('sidebar-collapsed');
          sidebarToggleBtn.setAttribute('aria-expanded', !isNowCollapsed);
          localStorage.setItem('artic-sidebar-collapsed', isNowCollapsed);
          
          // 아이콘 및 텍스트 레이블 동적 스위칭
          const toggleIcon = sidebarToggleBtn.querySelector('#sidebar-toggle-icon');
          const toggleLabel = sidebarToggleBtn.querySelector('#sidebar-toggle-label');
          if (toggleIcon) {
            toggleIcon.innerHTML = isNowCollapsed ? SVG_PANEL_OPEN : SVG_PANEL_CLOSE;
          }
          if (toggleLabel) {
            toggleLabel.textContent = isNowCollapsed ? '메뉴 확대' : '메뉴 축소';
          }
        }
      });
    }

    // 모바일 햄버거 메뉴 클릭
    const mobileMenuToggleBtn = header.querySelector('#mobile-menu-toggle');
    if (mobileMenuToggleBtn) {
      mobileMenuToggleBtn.addEventListener('click', function () {
        toggleMobileSidebarState(true);
      });
    }

    // 모바일 스크림 오버레이 클릭 시 닫기
    mobileScrim.addEventListener('click', function () {
      toggleMobileSidebarState(false);
    });

    // 13. iframe 연동 리스너
    if (isEmbedded) {
      window.addEventListener('message', function (event) {
        if (!event.data) return;
        if (event.data.type === 'SET_THEME') {
          setLayoutTheme(event.data.theme);
        } else if (event.data.type === 'TOGGLE_SIDEBAR') {
          const isActive = layoutContainer.classList.contains('sidebar-open');
          toggleMobileSidebarState(!isActive);
        }
      });
    }

    // 14. Firebase Auth 연동 및 권한 처리
    if (window.ArticAuth) {
      ArticAuth.ready().then(profile => {
        applyAuthLayoutState(profile, projectKey);
        // 로딩 화면 제거
        loadingOverlay.classList.add('hide');
        setTimeout(() => loadingOverlay.remove(), 400);
      });

      // 실시간 프로필 변경 구독
      window.addEventListener('artic-auth-changed', function (e) {
        applyAuthLayoutState(e.detail, projectKey);
      });
    } else {
      // Auth 라이브러리가 없는 단순 정적 페이지일 경우 바로 노출
      loadingOverlay.classList.add('hide');
      setTimeout(() => loadingOverlay.remove(), 400);
    }
  }

  // 모바일 사이드바 활성화/비활성화 상태 스위칭
  function toggleMobileSidebarState(open) {
    const layoutContainer = document.getElementById('artic-app-layout');
    const scrim = document.getElementById('mobile-scrim');
    if (!layoutContainer || !scrim) return;

    layoutContainer.classList.toggle('sidebar-open', open);
    scrim.classList.toggle('active', open);

    // 태블릿/모바일 드로어 전개에 따른 아이콘 및 레이블 동기화
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebarToggleBtn) {
      const toggleIcon = sidebarToggleBtn.querySelector('#sidebar-toggle-icon');
      const toggleLabel = sidebarToggleBtn.querySelector('#sidebar-toggle-label');
      if (toggleIcon) {
        toggleIcon.innerHTML = open ? SVG_PANEL_CLOSE : SVG_PANEL_OPEN;
      }
      if (toggleLabel) {
        toggleLabel.textContent = open ? '메뉴 닫기' : '메뉴 확대';
      }
    }

    // iframe 모드일 때 사이드바 상태를 부모 포털 셸로 전송하여 마스킹 동기화
    if (window !== window.top) {
      window.parent.postMessage({ type: 'SIDEBAR_STATE', active: open }, '*');
    }
  }

  // KST 실시간 시계 초기화 및 구동
  function initLayoutClock() {
    function tick() {
      const el = document.getElementById('kst-clock');
      if (!el) return;
      const t = new Date().toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      el.textContent = 'KST ' + t;
    }
    tick();
    setInterval(tick, 1000);
  }

  // 테마 강제 셋업 (vanilla 테마 및 tailwind 테마 둘 다 호환 가능하도록 교차 토글)
  function setLayoutTheme(theme) {
    const iconPath = document.getElementById('theme-icon-path');
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
      if (iconPath) {
        iconPath.setAttribute('d',
          'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42' +
          'M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' +
          'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z');
      }
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
      if (iconPath) {
        iconPath.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
      }
    }
    localStorage.setItem('artic-theme', theme);
  }

  // 테마 스위칭 토글
  function toggleLayoutTheme() {
    const isLight = document.body.classList.contains('light-theme');
    const nextTheme = isLight ? 'dark' : 'light';
    setLayoutTheme(nextTheme);

    // iframe 환경이면 부모 셸로 테마 변경 정보 프로파게이션
    if (window !== window.top) {
      window.parent.postMessage({ type: 'SET_THEME', theme: nextTheme }, '*');
    }
  }

  // Firebase Auth 기반 레이아웃 권한 요소 필터링
  function applyAuthLayoutState(profile, projectKey) {
    const loggedIn = Boolean(profile);
    
    // 1. 프로젝트 접근성 검증
    if (projectKey && loggedIn) {
      const userProjects = profile.projects || {};
      const isPortalAdmin = profile.email?.toLowerCase() === 'admin@artic.live';
      const hasAccess = userProjects[projectKey] || isPortalAdmin;

      if (!hasAccess) {
        // 프로젝트 접근 불가 시 에러 처리
        showLayoutAccessDenied();
        return;
      }
    }

    // 2. 관리자 메뉴 가시성 제어
    const isProjAdmin = ArticAuth && typeof ArticAuth.isPortalAdmin === 'function' && ArticAuth.isPortalAdmin();
    document.querySelectorAll('[data-admin-only="true"]').forEach(el => {
      if (isProjAdmin) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // 3. 테마 상태 복원
    const savedTheme = localStorage.getItem('artic-theme') || 'light';
    setLayoutTheme(savedTheme);
  }

  // 접근 제한 안내 화면 동적 삽입
  function showLayoutAccessDenied() {
    // 로딩 화면 제거
    const overlay = document.querySelector('.layout-loading-overlay');
    if (overlay) overlay.remove();

    let deniedView = document.getElementById('layout-denied-view');
    if (!deniedView) {
      deniedView = document.createElement('div');
      deniedView.id = 'layout-denied-view';
      deniedView.style.position = 'fixed';
      deniedView.style.inset = '0';
      deniedView.style.background = '#090a0f';
      deniedView.style.color = '#f8fafc';
      deniedView.style.display = 'flex';
      deniedView.style.flexDirection = 'column';
      deniedView.style.alignItems = 'center';
      deniedView.style.justifyContent = 'center';
      deniedView.style.zIndex = '999999';
      deniedView.style.fontFamily = 'system-ui, sans-serif';
      deniedView.style.padding = '20px';
      deniedView.style.textAlign = 'center';

      deniedView.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" style="margin-bottom:16px;">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:8px;">접근 권한 제한</h2>
        <p style="font-size:0.9rem; color:#94a3b8; max-width:320px; line-height:1.5; margin-bottom:24px;">
          해당 프로젝트의 팀원 권한을 보유하고 있지 않아 이 페이지에 접근할 수 없습니다. 관리자에게 승인을 요청해 주세요.
        </p>
        <button onclick="location.href='../'" style="background:#2458d3; border:none; border-radius:8px; padding:10px 20px; color:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">
          포털 홈으로 이동
        </button>
      `;
      document.body.appendChild(deniedView);
    }
  }

})();
