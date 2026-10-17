// Module: page/src/console-router.js
// Purpose: Route parsing, tab switching, view visibility, and polling helpers for mastopia console UI
// Maintainer: builder-gemini

export const VALID_TABS = ['sessions', 'screen', 'logs', 'rulebook', 'ops-desk'];
export const DEFAULT_TAB = 'sessions';
export const POLL_INTERVAL_ACTIVE_MS = 2000;
export const POLL_INTERVAL_HIDDEN_MS = 10000;

export function parseHash(hash) {
  const clean = String(hash || '').replace(/^#\/?/, '');
  const [routePart, queryPart] = clean.split('?');
  const tab = VALID_TABS.includes(routePart) ? routePart : DEFAULT_TAB;
  const params = new URLSearchParams(queryPart || '');
  return { tab, params };
}

export function parseRoute(pathname, hash) {
  const isConsole = String(pathname || '') === '/console';
  const { tab, params } = parseHash(hash);
  return {
    view: isConsole ? 'console' : 'city',
    tab,
    params,
  };
}

export function getPollInterval(isHidden) {
  return isHidden ? POLL_INTERVAL_HIDDEN_MS : POLL_INTERVAL_ACTIVE_MS;
}

export function closeCityConsolePanel(doc = document) {
  const p0Console = doc?.getElementById?.('console');
  if (p0Console) {
    p0Console.dataset.open = 'false';
  }
}

export function renderTabPanel(targetTab, doc = document) {
  const safeTab = VALID_TABS.includes(targetTab) ? targetTab : DEFAULT_TAB;
  for (const tab of VALID_TABS) {
    const btn = doc?.getElementById?.(`tab-${tab}`);
    const pane = doc?.getElementById?.(`view-${tab}`);
    const isCurrent = tab === safeTab;

    if (btn) {
      btn.setAttribute('aria-selected', String(isCurrent));
      if (btn.classList?.toggle) {
        btn.classList.toggle('active', isCurrent);
      }
    }
    if (pane) {
      pane.hidden = !isCurrent;
    }
  }
  return safeTab;
}

export function setViewVisibility(isConsole, doc = document) {
  const consoleShell = doc?.getElementById?.('consoleShell');
  if (consoleShell) consoleShell.hidden = !isConsole;

  const setDisplay = (id, visible) => {
    const el = doc?.getElementById?.(id);
    if (el) el.style.display = visible ? '' : 'none';
  };
  setDisplay('stage', !isConsole);
  setDisplay('reelHud', !isConsole);

  const hud = doc?.querySelector?.('.hud');
  if (hud) hud.style.display = isConsole ? 'none' : '';

  const foot = doc?.querySelector?.('.foot');
  if (foot) foot.style.display = isConsole ? 'none' : '';

  if (isConsole) {
    closeCityConsolePanel(doc);
  }
}

export function updateConsoleTimestamp(doc = document, text = 'No data yet') {
  const stamp = doc?.getElementById?.('consoleLastUpdated');
  if (stamp) {
    stamp.textContent = text;
  }
}

export function createPollingManager({
  onTick,
  isHiddenFn = () => (typeof document !== 'undefined' ? document.hidden : false),
  activeMs = POLL_INTERVAL_ACTIVE_MS,
  hiddenMs = POLL_INTERVAL_HIDDEN_MS,
}) {
  let timer = null;
  let currentDelay = null;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
      currentDelay = null;
    }
  }

  function start() {
    stop();
    if (typeof onTick === 'function') onTick();
    const delay = isHiddenFn() ? hiddenMs : activeMs;
    currentDelay = delay;
    timer = setInterval(() => {
      if (typeof onTick === 'function') onTick();
    }, delay);
    return delay;
  }

  function onVisibilityChange() {
    return start();
  }

  return {
    start,
    stop,
    onVisibilityChange,
    isRunning: () => timer !== null,
    getInterval: () => currentDelay,
  };
}
