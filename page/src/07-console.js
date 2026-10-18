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

  async function refreshScreenData(paneId) {
    const container = document.getElementById('screenContainer');
    if (!container) return;
    if (!paneId) {
      renderScreenView(container, { paneId: null });
      updateConsoleTimestamp(document, 'No pane selected');
      return;
    }
    const autoScrollEl = document.getElementById('screenAutoScroll');
    const autoScroll = autoScrollEl ? autoScrollEl.checked : true;
    const res = await fetchScreen(window.fetch, paneId);
    if (!res.ok) {
      renderScreenView(container, { paneId, error: res.error });
      updateConsoleTimestamp(document, `Error reading ${paneId}`);
      return;
    }
    renderScreenView(container, { paneId, data: res.data, autoScroll });
    const now = new Date();
    updateConsoleTimestamp(document, `Updated ${now.toLocaleTimeString()}`);
  }

  async function refreshOpsDeskData() {
    const container = document.getElementById('opsDeskContainer');
    if (!container) return;
    const res = await fetchOpsDesk(window.fetch);
    if (!res.ok) {
      renderOpsDeskView(container, { error: res.error });
      updateConsoleTimestamp(document, 'Error reading ops desk');
      return;
    }
    renderOpsDeskView(container, { items: res.items, adapterError: res.adapterError });
    const now = new Date();
    const countNote = `${res.items.length} item${res.items.length === 1 ? '' : 's'}`;
    const statusNote = res.adapterError ? ' (adapter notice)' : '';
    updateConsoleTimestamp(document, `Updated ${now.toLocaleTimeString()} (${countNote})${statusNote}`);
  }

  async function refreshRulebookData() {
    const container = document.getElementById('rulebookContainer');
    if (!container) return;
    const res = await fetchRulebook(window.fetch);
    if (!res.ok) {
      renderRulebookView(container, { error: res.error });
      updateConsoleTimestamp(document, 'Error reading rulebook');
      return;
    }
    renderRulebookView(container, { data: res.data, adapterError: res.adapterError });
    const now = new Date();
    const dN = res.districts?.length || 0;
    const rN = res.rules?.length || 0;
    const countNote = `${dN} district${dN === 1 ? '' : 's'}, ${rN} rule${rN === 1 ? '' : 's'}`;
    const statusNote = res.adapterError ? ' (adapter notice)' : '';
    updateConsoleTimestamp(document, `Updated ${now.toLocaleTimeString()} (${countNote})${statusNote}`);
  }

  async function refreshLogsData() {
    const container = document.getElementById('logsContainer');
    if (!container) return;
    const res = await fetchLogs(window.fetch);
    if (!res.ok) {
      renderLogsView(container, { error: res.error });
      updateConsoleTimestamp(document, 'Error reading logs');
      return;
    }
    renderLogsView(container, { data: res.data, adapterError: res.adapterError });
    const now = new Date();
    const count = res.events?.length || 0;
    const countNote = `${count} event${count === 1 ? '' : 's'}`;
    const statusNote = res.adapterError ? ' (adapter notice)' : '';
    updateConsoleTimestamp(document, `Updated ${now.toLocaleTimeString()} (${countNote})${statusNote}`);
  }

  function refreshActiveTab(params) {
    const effectiveParams = params || parseHash(window.location.hash).params;
    if (activeTab === 'sessions') {
      refreshSessionsData();
    } else if (activeTab === 'screen') {
      const paneId = effectiveParams?.get ? effectiveParams.get('paneId') : effectiveParams?.paneId;
      refreshScreenData(paneId);
    } else if (activeTab === 'ops-desk') {
      refreshOpsDeskData();
    } else if (activeTab === 'rulebook') {
      refreshRulebookData();
    } else if (activeTab === 'logs') {
      refreshLogsData();
    } else {
      updateConsoleTimestamp(document, 'No data yet');
    }
  }

  function handleTabSwitch() {
    const { tab, params } = parseHash(window.location.hash);
    activeTab = tab;
    renderTabPanel(activeTab, document);
    if (isConsolePath()) {
      refreshActiveTab(params);
    }
  }

  const poller = createPollingManager({
    onTick: () => {
      refreshActiveTab();
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
        refreshActiveTab();
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
