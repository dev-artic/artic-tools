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
    byId('project-join-tile').classList.toggle('wide', !ArticAuth.isPortalAdmin());
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
      accountButton.style.setProperty('--welcome-width', `${Math.ceil(welcomeText.scrollWidth + 28)}px`);
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

  window.toggleControlCenter = function (force) {
    const backdrop = byId('control-center-backdrop');
    const shouldOpen = typeof force === 'boolean' ? force : !backdrop.classList.contains('open');
    backdrop.classList.toggle('open', shouldOpen);
    byId('account-center-button').setAttribute('aria-expanded', String(shouldOpen));
  };

  window.toggleAccountSettings = function () {
    const form = byId('global-account-settings');
    byId('project-join-form').hidden = true;
    byId('admin-register-form').hidden = true;
    form.hidden = !form.hidden;
    if (!form.hidden) byId('global-current-password').focus();
  };

  window.toggleProjectJoin = function () {
    const form = byId('project-join-form');
    byId('global-account-settings').hidden = true;
    byId('admin-register-form').hidden = true;
    form.hidden = !form.hidden;
  };

  window.toggleAdminRegistration = function () {
    if (!ArticAuth.isPortalAdmin()) return;
    const form = byId('admin-register-form');
    byId('global-account-settings').hidden = true;
    byId('project-join-form').hidden = true;
    form.hidden = !form.hidden;
    if (!form.hidden) byId('admin-register-name').focus();
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
