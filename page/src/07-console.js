// Module: page/src/07-console.js
// Purpose: P1 console shell, navigation header, route switcher, and tab router
// Maintainer: builder-gemini

(function initConsoleApp() {
  const VALID_TABS = ['sessions', 'screen', 'logs', 'rulebook', 'ops-desk'];
  const DEFAULT_TAB = 'sessions';
  const POLL_ACTIVE_MS = 2000;
  const POLL_HIDDEN_MS = 10000;

  let pollTimer = null;
  let activeTab = DEFAULT_TAB;

  function parseHashRoute(hash) {
    const raw = String(hash || '').replace(/^#\/?/, '');
    const [name, query] = raw.split('?');
    const tab = VALID_TABS.includes(name) ? name : DEFAULT_TAB;
    return { tab, query: new URLSearchParams(query || '') };
  }

  function isConsolePath() {
    return window.location.pathname.startsWith('/console');
  }

  function updateModeBadge(mode) {
    const badge = document.getElementById('consoleModeBadge');
    if (!badge) return;
    const safeMode = String(mode || 'live').toLowerCase();
    badge.textContent = safeMode;
    badge.className = `mode-badge mode-${safeMode}`;
  }

  async function fetchServerHealth() {
    try {
      const res = await fetch('/health', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.mode) updateModeBadge(data.mode);
    } catch {
      updateModeBadge('offline');
    }
  }

  function renderTabPanel(targetTab) {
    for (const tab of VALID_TABS) {
      const btn = document.getElementById(`tab-${tab}`);
      const pane = document.getElementById(`view-${tab}`);
      const isCurrent = tab === targetTab;

      if (btn) {
        btn.setAttribute('aria-selected', String(isCurrent));
        btn.classList.toggle('active', isCurrent);
      }
      if (pane) {
        pane.hidden = !isCurrent;
      }
    }
  }

  function handleTabSwitch() {
    const { tab } = parseHashRoute(window.location.hash);
    activeTab = tab;
    renderTabPanel(activeTab);
  }

  function setElementVisibility(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = visible ? '' : 'none';
  }

  function setViewVisibility(isConsole) {
    const consoleShell = document.getElementById('consoleShell');
    if (consoleShell) consoleShell.hidden = !isConsole;

    setElementVisibility('stage', !isConsole);
    setElementVisibility('reelHud', !isConsole);

    const hud = document.querySelector('.hud');
    if (hud) hud.style.display = isConsole ? 'none' : '';

    const foot = document.querySelector('.foot');
    if (foot) foot.style.display = isConsole ? 'none' : '';

    const p0Console = document.getElementById('console');
    if (p0Console && isConsole) p0Console.dataset.open = 'false';
  }

  function handleRouteSwitch() {
    const onConsole = isConsolePath();
    setViewVisibility(onConsole);

    if (onConsole) {
      handleTabSwitch();
      startPolling();
    } else {
      stopPolling();
    }
  }

  function pollTick() {
    const stamp = document.getElementById('consoleLastUpdated');
    if (stamp) {
      const now = new Date();
      stamp.textContent = `Updated ${now.toLocaleTimeString()}`;
    }
  }

  function startPolling() {
    stopPolling();
    pollTick();
    const delay = document.hidden ? POLL_HIDDEN_MS : POLL_ACTIVE_MS;
    pollTimer = setInterval(pollTick, delay);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function handleVisibilityChange() {
    if (!isConsolePath()) return;
    startPolling();
  }

  function navigateTo(path) {
    if (window.location.pathname === path) return;
    window.history.pushState(null, '', path);
    handleRouteSwitch();
  }

  function bindEvents() {
    window.addEventListener('hashchange', () => {
      if (isConsolePath()) handleTabSwitch();
    });

    window.addEventListener('popstate', handleRouteSwitch);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const refreshBtn = document.getElementById('btnConsoleRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        pollTick();
      });
    }

    const toConsoleBtn = document.getElementById('btnGoConsole');
    if (toConsoleBtn) {
      toConsoleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('/console');
      });
    }

    const toCityBtn = document.getElementById('btnSwitchToCity');
    if (toCityBtn) {
      toCityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('/');
      });
    }

    const cityHomeLink = document.getElementById('consoleHomeLink');
    if (cityHomeLink) {
      cityHomeLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('/');
      });
    }
  }

  function init() {
    bindEvents();
    handleRouteSwitch();
    fetchServerHealth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
