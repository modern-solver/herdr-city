// Module: page/src/console-router.js
// Purpose: Route parsing and lifecycle interval helpers for mastopia console UI
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
  const isConsole = String(pathname || '').startsWith('/console');
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
