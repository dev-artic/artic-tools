/**
 * shared/header.js
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for global header behaviour:
 *   - KST live clock
 *   - Theme toggle (dark / light) with localStorage persistence
 *   - iframe <-> parent message sync (SET_THEME, TOGGLE_SIDEBAR)
 *
 * Consumed by:
 *   - /index.html        (portal)
 *   - /paytable/index.html  (PTR app, both direct and iframe)
 * ─────────────────────────────────────────────────────────────────
 */

/* ────────── Clock ────────── */
function initClock() {
  function tick() {
    const el = document.getElementById('kst-clock');
    if (!el) return;
    const t = new Date().toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
    el.textContent = 'KST ' + t;
  }
  tick();
  setInterval(tick, 1000);
}

/* ────────── Theme ────────── */
function setTheme(theme) {
  const iconPath = document.getElementById('theme-icon-path');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (iconPath) {
      iconPath.setAttribute('d',
        'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42' +
        'M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' +
        'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z');
    }
  } else {
    document.body.classList.remove('light-theme');
    if (iconPath) {
      iconPath.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    }
  }
  localStorage.setItem('artic-theme', theme);

  /* Sync theme button active state on login screen (PTR app) */
  const darkBtn  = document.getElementById('login-theme-dark');
  const lightBtn = document.getElementById('login-theme-light');
  if (darkBtn && lightBtn) {
    lightBtn.classList.toggle('active', theme === 'light');
    darkBtn.classList.toggle('active',  theme !== 'light');
  }

  /* Propagate to child iframe if this is the portal shell */
  const iframe = document.getElementById('app-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'SET_THEME', theme }, '*');
  }
}

function toggleTheme() {
  setTheme(document.body.classList.contains('light-theme') ? 'dark' : 'light');
}

function initTheme() {
  const savedWallpaper = localStorage.getItem('artic-portal-wallpaper');
  if (savedWallpaper) {
    const brightness = localStorage.getItem('artic-portal-wallpaper-brightness') || 'dark';
    setTheme(brightness === 'light' ? 'light' : 'dark');
  } else {
    const saved = localStorage.getItem('artic-theme');
    if (saved) {
      setTheme(saved);
    } else {
      setTheme('light');
    }
  }
}

/* ────────── Auto-init on DOM ready ────────── */
document.addEventListener('DOMContentLoaded', function () {
  initClock();
  initTheme();

  /* iframe integration — runs after DOM is ready so document.body is safe */
  if (window !== window.top) {
    /* in-iframe class is already set by the paytable inline script;
       we just need to register the message listener here */
    window.addEventListener('message', function (event) {
      if (!event.data) return;
      if (event.data.type === 'SET_THEME') {
        setTheme(event.data.theme);
      } else if (event.data.type === 'TOGGLE_SIDEBAR') {
        if (typeof toggleMobileSidebar === 'function') toggleMobileSidebar();
      }
    });
  }
});
