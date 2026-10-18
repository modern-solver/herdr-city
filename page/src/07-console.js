// Module: page/src/07-console.js
// Purpose: P1 console shell lifecycle, events, health polling, and navigation binding
// Maintainer: builder-gemini

(function initConsoleApp() {
  let activeTab = DEFAULT_TAB;

  function isConsolePath() {
    return window.location.pathname === '/console';
  }

  function updateModeBadge(mode) {
    const badge = document.getElementById('consoleModeBadge');
    if (!badge) return;
    const safeMode = String(mode || 'live').toLowerCase();
    if (!VALID_MODES.includes(safeMode)) return;
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
      // Retain current badge if server unreachable
    }
  }

  async function refreshSessionsData() {
    const container = document.getElementById('sessionsContent');
    const countEl = document.getElementById('sessionsCount');
    if (!container) return;
    const res = await fetchSessions(window.fetch);
    if (!res.ok) {
      renderSessionsView(container, { error: res.error });
      updateConsoleTimestamp(document, 'Error loading data');
      return;
    }
    renderSessionsView(container, { sessions: res.sessions, adapterError: res.adapterError });
    if (countEl) {
      const n = res.sessions.length;
      countEl.textContent = `${n} session${n === 1 ? '' : 's'}`;
    }
    const now = new Date();
    const statusNote = res.adapterError ? ' (adapter notice)' : '';
    updateConsoleTimestamp(document, `Updated ${now.toLocaleTimeString()}${statusNote}`);
  }

  function handleTabSwitch() {
    const { tab } = parseHash(window.location.hash);
    activeTab = tab;
    renderTabPanel(activeTab, document);
    if (isConsolePath() && activeTab === 'sessions') {
      refreshSessionsData();
    }
  }

  const poller = createPollingManager({
    onTick: () => {
      if (activeTab === 'sessions') {
        refreshSessionsData();
      } else {
        updateConsoleTimestamp(document, 'No data yet');
      }
    },
    isHiddenFn: () => document.hidden,
    activeMs: POLL_INTERVAL_ACTIVE_MS,
    hiddenMs: POLL_INTERVAL_HIDDEN_MS,
  });

  function handleRouteSwitch() {
    const onConsole = isConsolePath();
    setViewVisibility(onConsole, document);

    if (onConsole) {
      closeCityConsolePanel(document);
      handleTabSwitch();
      poller.start();
    } else {
      poller.stop();
    }
  }

  function handleVisibilityChange() {
    if (!isConsolePath()) return;
    poller.onVisibilityChange();
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
        if (activeTab === 'sessions') {
          refreshSessionsData();
        } else {
          updateConsoleTimestamp(document, 'No data yet');
        }
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
