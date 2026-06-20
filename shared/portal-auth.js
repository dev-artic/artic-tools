(function () {
  'use strict';

  const PROJECT_NAMES = { ptr: 'PTR', tnt: 'TNT' };
  const ROLE_NAMES = { admin: '관리자', member: '팀원' };
  let renderedUid = null;
  let welcomeTimer = null;

  function byId(id) { return document.getElementById(id); }

  function renderProfile(profile) {
    const loggedIn = Boolean(profile);
    const shouldWelcome = loggedIn && renderedUid !== profile.uid;
    renderedUid = profile?.uid || null;
    document.body.classList.toggle('auth-locked', !loggedIn);
    byId('portal-auth-overlay').classList.toggle('is-hidden', loggedIn);
    byId('account-center-button').classList.toggle('visible', loggedIn);
    if (!loggedIn) {
      clearTimeout(welcomeTimer);
      byId('account-center-button').classList.remove('welcoming');
      return;
    }

    byId('account-center-avatar').textContent = profile.displayName?.[0] || '?';
    const welcomeText = byId('account-welcome-text');
    welcomeText.textContent = `${profile.displayName || profile.loginId} 님 환영합니다`;
    byId('control-center-avatar').textContent = profile.displayName?.[0] || '?';
    byId('control-center-name').textContent = profile.displayName || profile.loginId;
    byId('control-center-email').textContent = profile.email;
    byId('admin-register-tile').hidden = !ArticAuth.isPortalAdmin();

    // Update Google Link status in UI
    const isLinked = ArticAuth.isGoogleLinked();
    const iconEl = byId('google-link-icon');
    const linkBtn = byId('btn-google-link');
    const emailEl = byId('google-link-email');
    if (iconEl) {
      iconEl.className = `google-link-icon ${isLinked ? 'linked' : 'unlinked'}`;
    }
    if (linkBtn) {
      linkBtn.textContent = isLinked ? '구글 연동 해제' : '구글 연동하기';
      linkBtn.className = `btn-google-link ${isLinked ? 'linked' : ''}`;
    }
    if (emailEl) {
      if (isLinked) {
        const linkedEmail = ArticAuth.getGoogleLinkedEmail();
        emailEl.textContent = linkedEmail || '';
        emailEl.style.display = 'inline';
      } else {
        emailEl.textContent = '';
        emailEl.style.display = 'none';
      }
    }

    byId('control-center-projects').innerHTML = Object.entries(profile.projects || {}).map(([project, role]) => `
      <div class="control-project-card">
        <span class="control-project-id">${PROJECT_NAMES[project] || project.toUpperCase()}</span>
        <span class="control-project-role">${ROLE_NAMES[role] || role}</span>
      </div>
    `).join('') || '<div class="control-project-card">참여 중인 프로젝트가 없습니다.</div>';
    applyAppPermissions(profile);
    if (shouldWelcome) {
      const accountButton = byId('account-center-button');
      clearTimeout(welcomeTimer);
      
      // Temporarily unconstrain max-width to calculate exact scrollWidth without wrapping constraints
      welcomeText.style.maxWidth = 'none';
      const textWidth = welcomeText.scrollWidth;
      welcomeText.style.maxWidth = '';
      
      accountButton.style.setProperty('--welcome-width', `${Math.ceil(textWidth + 48)}px`);
      accountButton.classList.add('welcoming');
      welcomeTimer = setTimeout(() => accountButton.classList.remove('welcoming'), 4000);
    }
  }

  function applyAppPermissions(profile) {
    document.querySelectorAll('[data-projects]').forEach(card => {
      const projects = card.dataset.projects.split(',').map(value => value.trim());
      const denied = !ArticAuth.canAccessAny(projects);
      card.classList.toggle('access-denied', denied);
      card.setAttribute('aria-disabled', String(denied));
      const action = card.querySelector('.app-action span');
      const status = card.querySelector('.status-badge');
      if (action) {
        action.textContent = denied ? '프로젝트 참여자가 아닙니다' : card.dataset.actionLabel;
      }
      if (status) {
        if (!status.dataset.defaultLabel) status.dataset.defaultLabel = status.textContent.trim();
        status.textContent = denied ? '접근 제한' : status.dataset.defaultLabel;
        status.classList.toggle('active', !denied && status.dataset.defaultLabel === '운영 중');
        status.classList.toggle('pending', denied || status.dataset.defaultLabel !== '운영 중');
      }
    });
  }

  async function submitLogin(event) {
    event.preventDefault();
    const button = byId('portal-login-submit');
    const identifier = byId('portal-login-id');
    const password = byId('portal-login-password');
    identifier.removeAttribute('aria-invalid');
    password.removeAttribute('aria-invalid');
    setAuthStatus('');
    button.disabled = true;
    button.textContent = '인증 중...';
    try {
      const profile = await ArticAuth.signIn(identifier.value, password.value);
      password.value = '';
      renderProfile(profile);
      if (typeof checkInitialPath === 'function') checkInitialPath();
    } catch (_) {
      identifier.setAttribute('aria-invalid', 'true');
      password.setAttribute('aria-invalid', 'true');
      button.classList.remove('login-shake');
      void button.offsetWidth;
      button.classList.add('login-shake');
    } finally {
      button.disabled = false;
      button.textContent = '로그인';
    }
  }

  function setAuthStatus(message, isError = false) {
    const status = byId('portal-auth-status');
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  async function requestPasswordReset() {
    try {
      await ArticAuth.sendPasswordReset(byId('portal-login-id').value);
      setAuthStatus('등록된 이메일로 재설정 링크를 보냈습니다.');
    } catch (error) {
      setAuthStatus(error.message || '비밀번호 재설정 요청에 실패했습니다.', true);
    }
  }

  async function submitGoogleLogin() {
    const button = byId('portal-google-button');
    button.disabled = true;
    setAuthStatus('');
    try {
      const profile = await ArticAuth.signInWithGoogle();
      renderProfile(profile);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthStatus(error.message || 'Google 로그인에 실패했습니다.', true);
      }
    } finally {
      button.disabled = false;
    }
  }

  function showAccessDenied() {
    const toast = byId('access-toast');
    toast.classList.add('show');
    clearTimeout(showAccessDenied.timer);
    showAccessDenied.timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  window.openAuthorizedApp = function (event, url, projectList) {
    const projects = projectList.split(',');
    if (!ArticAuth.canAccessAny(projects)) {
      event.preventDefault();
      showAccessDenied();
      return;
    }
    openApp(event, url);
  };

  let detailTransitionTimeout = null;

  function collapseAllTilesExcept(activeTileId) {
    const ids = ['tile-account-settings', 'project-join-tile', 'admin-register-tile'];
    const panel = document.querySelector('.control-center-panel');
    
    if (detailTransitionTimeout) {
      clearTimeout(detailTransitionTimeout);
      detailTransitionTimeout = null;
    }

    if (!activeTileId) {
      // COLLAPSING / GOING BACK TO MAIN
      // 1. Remove expanded class from all tiles and layout-collapsed from panel
      ids.forEach(id => {
        const tile = byId(id);
        if (tile) tile.classList.remove('expanded');
      });
      if (panel) {
        panel.classList.remove('layout-collapsed');
        // 2. Wait for layout to restore (400ms), then fade back in other tiles
        detailTransitionTimeout = setTimeout(() => {
          panel.classList.remove('detail-active');
        }, 400);
      }
    } else {
      // EXPANDING
      // 1. Fade out other elements first
      if (panel) {
        panel.classList.add('detail-active');
      }
      // 2. Wait 150ms for fade out, then expand the active tile and collapse layout
      detailTransitionTimeout = setTimeout(() => {
        const activeTile = byId(activeTileId);
        if (activeTile) {
          activeTile.classList.add('expanded');
          // Focus input if any
          if (activeTileId === 'tile-account-settings') {
            const input = byId('global-current-password');
            if (input) input.focus();
          } else if (activeTileId === 'admin-register-tile') {
            const input = byId('admin-register-name');
            if (input) input.focus();
          }
        }
        if (panel) {
          panel.classList.add('layout-collapsed');
        }
        // Remove expanded class from other tiles
        ids.forEach(id => {
          if (id !== activeTileId) {
            const tile = byId(id);
            if (tile) tile.classList.remove('expanded');
          }
        });
      }, 150);
    }
  }
  window.collapseAllTilesExcept = collapseAllTilesExcept;

  window.toggleControlCenter = function (force) {
    const backdrop = byId('control-center-backdrop');
    const shouldOpen = typeof force === 'boolean' ? force : !backdrop.classList.contains('open');
    if (shouldOpen) {
      backdrop.classList.remove('closing');
      backdrop.classList.add('open');
      byId('account-center-button').setAttribute('aria-expanded', 'true');
    } else {
      if (backdrop.classList.contains('open')) {
        backdrop.classList.remove('open');
        backdrop.classList.add('closing');
        byId('account-center-button').setAttribute('aria-expanded', 'false');
        collapseAllTilesExcept(null);
        setTimeout(() => {
          backdrop.classList.remove('closing');
        }, 600);
      }
    }
  };

  window.toggleAccountSettings = function () {
    const tile = byId('tile-account-settings');
    if (!tile) return;
    if (tile.classList.contains('expanded')) {
      collapseAllTilesExcept(null);
    } else {
      collapseAllTilesExcept('tile-account-settings');
    }
  };

  window.toggleProjectJoin = function () {
    const tile = byId('project-join-tile');
    if (!tile) return;
    if (tile.classList.contains('expanded')) {
      collapseAllTilesExcept(null);
    } else {
      collapseAllTilesExcept('project-join-tile');
    }
  };

  window.toggleAdminRegistration = function () {
    if (!ArticAuth.isPortalAdmin()) return;
    const tile = byId('admin-register-tile');
    if (!tile) return;
    if (tile.classList.contains('expanded')) {
      collapseAllTilesExcept(null);
    } else {
      collapseAllTilesExcept('admin-register-tile');
    }
  };

  async function submitProjectJoin(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('[type="submit"]');
    const message = byId('project-join-message');
    button.disabled = true;
    message.textContent = '';
    try {
      await ArticAuth.requestProjectParticipation(byId('project-join-select').value);
      message.textContent = '프로젝트 참여 요청을 보냈습니다.';
    } catch (error) {
      message.textContent = error.message || '참여 요청을 보내지 못했습니다.';
    } finally {
      button.disabled = false;
    }
  }

  async function submitAdminRegistration(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('[type="submit"]');
    const message = byId('admin-register-message');
    button.disabled = true;
    message.textContent = '';
    try {
      const member = await ArticAuth.adminCreateMember(
        byId('admin-register-name').value,
        byId('admin-register-email').value,
        byId('admin-register-password').value
      );
      event.currentTarget.reset();
      message.textContent = `${member.displayName} 계정을 등록했습니다.`;
    } catch (error) {
      message.textContent = error.code === 'auth/email-already-in-use'
        ? '이미 등록된 이메일입니다.'
        : (error.message || '멤버를 등록하지 못했습니다.');
    } finally {
      button.disabled = false;
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    const currentPassword = byId('global-current-password').value;
    const newPassword = byId('global-new-password').value;
    const confirmation = byId('global-confirm-password').value;
    const message = byId('global-account-message');
    if (newPassword !== confirmation) {
      message.textContent = '새 비밀번호가 일치하지 않습니다.';
      return;
    }
    try {
      const user = ArticAuth.auth().currentUser;
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      event.currentTarget.reset();
      message.textContent = '비밀번호가 변경되었습니다.';
    } catch (error) {
      message.textContent = error.code === 'auth/wrong-password'
        ? '현재 비밀번호가 올바르지 않습니다.'
        : '비밀번호 변경에 실패했습니다.';
    }
  }

  window.portalSignOut = async function () {
    toggleControlCenter(false);
    if (typeof goToHome === 'function') goToHome(null);
    await ArticAuth.signOut();
  };

  const PEXELS_API_KEY = 'uZc288kN05Vq7jR5bb8ZqZNnpUeRxgSUEsIpCPofxv8WXQgNvCoBaZnl';

  window.searchWallpaper = async function () {
    const input = byId('wallpaper-search-input');
    const query = input ? input.value.trim() : '';
    const resultsContainer = byId('pexels-results');
    const message = byId('wallpaper-message');

    if (!query) {
      if (message) message.textContent = '검색어를 입력해주세요.';
      return;
    }

    if (message) message.textContent = '검색 중...';
    if (resultsContainer) resultsContainer.innerHTML = '';

    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&size=large`, {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      if (message) message.textContent = '';

      if (!data.photos || data.photos.length === 0) {
        if (message) message.textContent = '검색 결과가 없습니다.';
        return;
      }

      if (resultsContainer) {
        data.photos.forEach(photo => {
          const wrapper = document.createElement('div');
          wrapper.className = 'pexels-thumb-wrapper';
          wrapper.onclick = () => selectWallpaper(photo.src.original, photo.photographer, photo.src.tiny);

          const img = document.createElement('img');
          img.className = 'pexels-thumb';
          img.src = photo.src.tiny;
          img.alt = photo.alt || 'Pexels wallpaper';
          img.loading = 'lazy';

          const credit = document.createElement('div');
          credit.className = 'pexels-photographer';
          credit.textContent = `Photo by ${photo.photographer}`;

          wrapper.appendChild(img);
          wrapper.appendChild(credit);
          resultsContainer.appendChild(wrapper);
        });
      }
    } catch (error) {
      if (message) message.textContent = '이미지를 불러오지 못했습니다.';
    }
  };

  function analyzeImageBrightness(url, callback) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 10, 10);
      try {
        const imgData = ctx.getImageData(0, 0, 10, 10);
        let totalLuminance = 0;
        for (let i = 0; i < imgData.data.length; i += 4) {
          const r = imgData.data[i];
          const g = imgData.data[i+1];
          const b = imgData.data[i+2];
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b);
          totalLuminance += luminance;
        }
        const avgLuminance = totalLuminance / (imgData.data.length / 4);
        callback(avgLuminance > 128 ? 'light' : 'dark');
      } catch (e) {
        callback('dark');
      }
    };
    img.onerror = function() {
      callback('dark');
    };
    img.src = url;
  }

  function updateHomeThemeContrast() {
    const savedWallpaper = localStorage.getItem('artic-portal-wallpaper');
    if (savedWallpaper) {
      const brightness = localStorage.getItem('artic-portal-wallpaper-brightness') || 'dark';
      if (brightness === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    } else {
      const savedTheme = localStorage.getItem('artic-theme') || 'light';
      if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }

  window.selectWallpaper = function (url, photographer, tinyUrl) {
    const message = byId('wallpaper-message');
    try {
      localStorage.setItem('artic-portal-wallpaper', url);
      applyWallpaper(url);
      if (message) message.textContent = '이미지 분석 중...';

      const analysisUrl = tinyUrl || url;
      analyzeImageBrightness(analysisUrl, (brightness) => {
        localStorage.setItem('artic-portal-wallpaper-brightness', brightness);
        updateHomeThemeContrast();
        if (message) {
          message.textContent = `Photo by ${photographer} 적용 완료. (${brightness === 'light' ? '라이트' : '다크'} 최적화)`;
          setTimeout(() => { if (message && message.textContent.includes('적용 완료')) message.textContent = ''; }, 4000);
        }
      });
    } catch (err) {
      if (message) message.textContent = '배경화면을 적용하지 못했습니다.';
    }
  };

  window.resetWallpaper = function () {
    localStorage.removeItem('artic-portal-wallpaper');
    localStorage.removeItem('artic-portal-wallpaper-brightness');
    applyWallpaper(null);
    updateHomeThemeContrast();
    const message = byId('wallpaper-message');
    if (message) {
      message.textContent = '기본 배경화면으로 복원되었습니다.';
      setTimeout(() => { if (message && message.textContent.includes('복원되었습니다')) message.textContent = ''; }, 3000);
    }
    const resultsContainer = byId('pexels-results');
    if (resultsContainer) resultsContainer.innerHTML = '';
    const input = byId('wallpaper-search-input');
    if (input) input.value = '';
  };

  function applyWallpaper(dataUrl) {
    let styleEl = byId('custom-wallpaper-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-wallpaper-style';
      document.head.appendChild(styleEl);
    }

    if (dataUrl) {
      styleEl.innerHTML = `
        body {
          background-image: url(${dataUrl}) !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
        }
        .bg-glow-1, .bg-glow-2 {
          opacity: 0.3 !important;
        }
      `;
    } else {
      styleEl.innerHTML = '';
    }
  }

  // Apply saved wallpaper on initialization
  const savedWallpaper = localStorage.getItem('artic-portal-wallpaper');
  if (savedWallpaper) {
    applyWallpaper(savedWallpaper);
  }
  updateHomeThemeContrast();

  async function initializePortalAuth() {
    byId('portal-login-form').addEventListener('submit', submitLogin);
    byId('forgot-password-button').addEventListener('click', requestPasswordReset);
    byId('portal-google-button').addEventListener('click', submitGoogleLogin);
    byId('global-account-settings').addEventListener('submit', updatePassword);
    byId('project-join-form').addEventListener('submit', submitProjectJoin);
    byId('admin-register-form').addEventListener('submit', submitAdminRegistration);
    byId('control-center-backdrop').addEventListener('click', event => {
      if (event.target === event.currentTarget) toggleControlCenter(false);
    });

    const btnGoogleLink = byId('btn-google-link');
    if (btnGoogleLink) {
      btnGoogleLink.addEventListener('click', async () => {
        btnGoogleLink.disabled = true;
        const isLinked = ArticAuth.isGoogleLinked();
        const message = byId('global-account-message');
        if (message) message.textContent = '';
        try {
          if (isLinked) {
            await ArticAuth.unlinkGoogle();
            if (message) message.textContent = '구글 계정 연동이 해제되었습니다.';
          } else {
            await ArticAuth.linkGoogle();
            if (message) message.textContent = '구글 계정이 성공적으로 연동되었습니다.';
          }
          renderProfile(ArticAuth.getProfile());
        } catch (error) {
          if (message) {
            message.textContent = error.code === 'auth/credential-already-in-use'
              ? '이미 다른 계정에 연동된 구글 계정입니다.'
              : (error.message || '구글 연동 작업에 실패했습니다.');
          }
        } finally {
          btnGoogleLink.disabled = false;
        }
      });
    }

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') toggleControlCenter(false);
    });
    window.addEventListener('artic-auth-changed', event => {
      renderProfile(event.detail);
      if (!event.detail && typeof currentApp !== 'undefined' && currentApp !== 'home') goToHome(null);
    });
    const profile = await ArticAuth.ready();
    renderProfile(profile);
    if (profile && typeof checkInitialPath === 'function') checkInitialPath();
  }

  document.addEventListener('DOMContentLoaded', initializePortalAuth);
})();
