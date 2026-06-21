(function () {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDeJrfj6Oz5yklVdTqZXPtbwE4Rz57AXrM',
    authDomain: 'artic-ptr-paytable.firebaseapp.com',
    projectId: 'artic-ptr-paytable',
    storageBucket: 'artic-ptr-paytable.firebasestorage.app',
    messagingSenderId: '38387099281',
    appId: '1:38387099281:web:ae82ec20509e5dc2bd8130',
  };
  const ALLOWED_EMAIL_DOMAIN = '@artic.live';
  const PORTAL_ADMIN_EMAIL = 'admin@artic.live';

  // Public directory metadata only. Passwords belong exclusively to Firebase Auth.
  const TEAM_DIRECTORY = [
    {
      loginId: 'admin',
      email: 'admin@artic.live',
      displayName: '김민제',
      memberKey: '민제',
    },
    {
      loginId: 'gwanggyu',
      email: 'boise@artic.live',
      displayName: '박광규',
      memberKey: '광규',
    },
    {
      loginId: 'gyeongyeop',
      email: 'arkyteccc@artic.live',
      displayName: '조경엽',
      memberKey: '경엽',
    },
    {
      loginId: 'jeongho',
      email: 'nekim@artic.live',
      displayName: '김정호',
      memberKey: '정호',
    },
    {
      loginId: 'myeongeun',
      email: 'recw_j@artic.live',
      displayName: '현명은',
      memberKey: '명은',
    },
  ];

  const PROFILE_CACHE_KEY = 'artic-auth-profile';
  let currentProfile = readCachedProfile();
  let auth;
  let db;
  let storage;
  let functions;
  let readyPromise;

  function readCachedProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function cacheProfile(profile) {
    currentProfile = profile;
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
    window.dispatchEvent(new CustomEvent('artic-auth-changed', { detail: profile }));
  }

  function initialize() {
    if (!window.firebase) throw new Error('Firebase SDK is not loaded.');
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    auth = app.auth();
    db = app.firestore();
    storage = typeof app.storage === 'function' ? app.storage() : null;
    functions = typeof app.functions === 'function' ? app.functions('asia-northeast3') : null;
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

    readyPromise = new Promise(resolve => {
      auth.onAuthStateChanged(async user => {
        const profile = user ? await loadProfile(user) : null;
        cacheProfile(profile);
        resolve(profile);
      });
    });
  }

  async function loadProfile(user) {
    const emails = [user.email, ...(user.providerData || []).map(p => p.email)].filter(Boolean);
    const articEmail = emails.find(email => isAllowedEmail(email));
    if (!articEmail) return null;
    const bootstrap = TEAM_DIRECTORY.find(member => member.email.toLowerCase() === articEmail.toLowerCase());
    let storedProfile = null;
    try {
      const snapshot = await db.collection('users').doc(user.uid).get();
      if (snapshot.exists) storedProfile = snapshot.data();
    } catch (error) {
      console.warn('User profile could not be loaded from Firestore.', error);
    }

    if (!storedProfile) return null;
    return {
      ...(bootstrap || {}),
      ...storedProfile,
      uid: user.uid,
      email: articEmail,
      projects: storedProfile.projects || {},
    };
  }

  async function signIn(identifier, password) {
    const normalizedIdentifier = identifier.trim().toLocaleLowerCase('ko-KR');
    const member = TEAM_DIRECTORY.find(item =>
      item.loginId.toLocaleLowerCase('ko-KR') === normalizedIdentifier
      || item.displayName.toLocaleLowerCase('ko-KR') === normalizedIdentifier
    );
    const email = member?.email || (normalizedIdentifier.includes('@') ? normalizedIdentifier : null);
    if (!email) throw new Error('등록되지 않은 이름 또는 팀원 ID입니다.');
    if (!isAllowedEmail(email)) throw new Error('artic.live 계정만 로그인할 수 있습니다.');
    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      const profile = await loadProfile(credential.user);
      if (!profile) {
        await auth.signOut();
        throw new Error('계정 권한 프로필이 등록되지 않았습니다.');
      }
      cacheProfile(profile);
      return profile;
    } catch (error) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Firebase에서 이메일/비밀번호 로그인을 먼저 활성화해주세요.');
      }
      if (error.code?.startsWith('auth/')) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
      throw error;
    }
  }

  function isAllowedEmail(email) {
    return email?.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN) || false;
  }

  function isPortalAdmin() {
    return currentProfile?.email?.toLowerCase() === PORTAL_ADMIN_EMAIL;
  }

  async function rejectGoogleCredential(credential, message) {
    if (credential.additionalUserInfo?.isNewUser) {
      await credential.user.delete().catch(() => auth.signOut());
    } else {
      await auth.signOut();
    }
    cacheProfile(null);
    const error = new Error(message);
    error.code = 'artic/google-access-denied';
    throw error;
  }

  async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await auth.signInWithPopup(provider);
    const profile = await loadProfile(credential.user);
    if (!profile) {
      return rejectGoogleCredential(credential, 'artic. 도메인으로 등록되지 않은 계정입니다.');
    }
    cacheProfile(profile);
    return profile;
  }

  async function linkGoogle() {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await user.linkWithPopup(provider);
    const profile = await loadProfile(user);
    cacheProfile(profile);
    return profile;
  }

  async function unlinkGoogle() {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    await user.unlink('google.com');
    const profile = await loadProfile(user);
    cacheProfile(profile);
    return profile;
  }

  function isGoogleLinked() {
    return auth.currentUser?.providerData.some(p => p.providerId === 'google.com') || false;
  }

  function getGoogleLinkedEmail() {
    const googleProvider = auth.currentUser?.providerData.find(p => p.providerId === 'google.com');
    return googleProvider?.email || null;
  }

  async function adminCreateMember(displayName, email, password) {
    if (!isPortalAdmin()) throw new Error('관리자만 새 멤버를 등록할 수 있습니다.');
    const normalizedEmail = email.trim().toLowerCase();
    if (!isAllowedEmail(normalizedEmail)) throw new Error('artic.live 이메일만 등록할 수 있습니다.');

    const secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, `member-create-${Date.now()}`);
    const secondaryAuth = secondaryApp.auth();
    let createdUser = null;
    try {
      const credential = await secondaryAuth.createUserWithEmailAndPassword(normalizedEmail, password);
      createdUser = credential.user;
      await createdUser.updateProfile({ displayName: displayName.trim() });
      await db.collection('users').doc(createdUser.uid).set({
        loginId: normalizedEmail,
        displayName: displayName.trim(),
        memberKey: '',
        projects: {},
      });
      return { uid: createdUser.uid, email: normalizedEmail, displayName: displayName.trim() };
    } catch (error) {
      if (createdUser) await createdUser.delete().catch(() => {});
      throw error;
    } finally {
      await secondaryAuth.signOut().catch(() => {});
      await secondaryApp.delete().catch(() => {});
    }
  }

  async function requestProjectParticipation(projectId) {
    const profile = currentProfile;
    if (!profile || !auth.currentUser) throw new Error('로그인이 필요합니다.');
    if (!['ptr', 'tnt'].includes(projectId)) throw new Error('올바르지 않은 프로젝트입니다.');
    if (hasProject(projectId)) throw new Error('이미 참여 중인 프로젝트입니다.');

    const requestRef = db.collection('projectJoinRequests').doc(`${profile.uid}_${projectId}`);
    try {
      await requestRef.set({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName || profile.loginId,
        projectId,
        status: 'pending',
        requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      if (error.code === 'permission-denied') throw new Error('이미 참여 요청을 보냈습니다.');
      throw error;
    }
  }

  async function sendPasswordReset(identifier) {
    const normalizedIdentifier = identifier.trim().toLocaleLowerCase('ko-KR');
    const member = TEAM_DIRECTORY.find(item =>
      item.loginId.toLocaleLowerCase('ko-KR') === normalizedIdentifier
      || item.displayName.toLocaleLowerCase('ko-KR') === normalizedIdentifier
    );
    const email = member?.email || (normalizedIdentifier.includes('@') ? normalizedIdentifier : null);
    if (!email) throw new Error('이름 또는 가입 이메일을 먼저 입력해주세요.');
    if (!isAllowedEmail(email)) throw new Error('artic.live 계정만 사용할 수 있습니다.');
    await auth.sendPasswordResetEmail(email);
  }

  async function signOut() {
    await auth.signOut();
    cacheProfile(null);
  }

  function hasProject(projectId) {
    return Boolean(currentProfile?.projects?.[projectId]);
  }

  function hasRole(projectId, roles) {
    const accepted = Array.isArray(roles) ? roles : [roles];
    return accepted.includes(currentProfile?.projects?.[projectId]);
  }

  function canAccessAny(projectIds) {
    return projectIds.some(hasProject);
  }

  initialize();

  window.ArticAuth = {
    auth: () => auth,
    db: () => db,
    storage: () => storage,
    functions: () => functions,
    directory: TEAM_DIRECTORY.map(({ email, ...member }) => member),
    ready: () => readyPromise,
    signIn,
    signInWithGoogle,
    linkGoogle,
    unlinkGoogle,
    isGoogleLinked,
    getGoogleLinkedEmail,
    adminCreateMember,
    requestProjectParticipation,
    sendPasswordReset,
    signOut,
    getProfile: () => currentProfile,
    hasProject,
    hasRole,
    canAccessAny,
    isAllowedEmail,
    isPortalAdmin,
    reloadProfile: async () => {
      const user = auth.currentUser;
      const profile = user ? await loadProfile(user) : null;
      cacheProfile(profile);
      return profile;
    },
  };
})();
