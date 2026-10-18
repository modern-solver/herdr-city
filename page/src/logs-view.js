// Module: page/src/logs-view.js
// Purpose: Event logs view rendering, ring buffer telemetry, filtering, and API contract consumption (U5)
// Maintainer: builder-gemini

import { escapeHtml } from './sessions-view.js';

export function formatTimestampMs(ts) {
  if (ts == null || !Number.isFinite(Number(ts))) return '-';
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return '-';
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function getEventTypeBadgeHtml(type) {
  const safeType = String(type || 'event').toLowerCase();
  if (safeType === 'needs_you') {
    return `<span class="badge badge-wait">${escapeHtml(type)}</span>`;
  }
  if (safeType === 'status_change') {
    return `<span class="badge badge-cli">${escapeHtml(type)}</span>`;
  }
  if (safeType === 'needs_you_cleared') {
    return `<span class="badge badge-live">${escapeHtml(type)}</span>`;
  }
  if (safeType === 'error' || safeType === 'adapter_error') {
    return `<span class="badge badge-error">${escapeHtml(type)}</span>`;
  }
  return `<span class="badge badge-model">${escapeHtml(type || 'event')}</span>`;
}

export function renderLogEventRowHtml(event) {
  if (!event) return '';

  const timeStr = formatTimestampMs(event.ts);
  const typeBadge = getEventTypeBadgeHtml(event.type);

  const paneBadge = event.paneId ? `<span class="badge badge-cli">${escapeHtml(event.paneId)}</span>` : '';
  const nameEl = event.name ? `<strong>${escapeHtml(event.name)}</strong>` : '';
  const districtEl = event.districtTitle
    ? `<span class="log-district">${escapeHtml(event.districtTitle)}</span>`
    : '';

  let transitionHtml = '';
  if (event.fromStatus || event.toStatus) {
    const from = escapeHtml(event.fromStatus || 'none');
    const to = escapeHtml(event.toStatus || 'none');
    transitionHtml = `<span class="log-transition">${from} &rarr; ${to}</span>`;
  }

  const textHtml = event.text ? `<div class="log-text">${escapeHtml(event.text)}</div>` : '';

  return (
    `<div class="log-event-row log-type-${escapeHtml(String(event.type || ''))}">` +
    `<div class="log-event-header">` +
    `<div class="log-event-meta-left">` +
    `<time class="log-time">${timeStr}</time>` +
    typeBadge +
    paneBadge +
    nameEl +
    districtEl +
    `</div>` +
    `<div class="log-event-meta-right">${transitionHtml}</div>` +
    `</div>` +
    textHtml +
    `</div>`
  );
}

export function filterLogEvents(events, { type = 'all', query = '' } = {}) {
  if (!Array.isArray(events)) return [];
  const safeType = String(type || 'all').toLowerCase();
  const q = String(query || '').trim().toLowerCase();

  return events.filter((e) => {
    if (safeType !== 'all' && String(e?.type || '').toLowerCase() !== safeType) {
      return false;
    }
    if (!q) return true;
    const text = String(e?.text || '').toLowerCase();
    const name = String(e?.name || '').toLowerCase();
    const pane = String(e?.paneId || '').toLowerCase();
    const dist = String(e?.districtTitle || '').toLowerCase();
    const from = String(e?.fromStatus || '').toLowerCase();
    const to = String(e?.toStatus || '').toLowerCase();
    return (
      text.includes(q) ||
      name.includes(q) ||
      pane.includes(q) ||
      dist.includes(q) ||
      from.includes(q) ||
      to.includes(q)
    );
  });
}

export function renderLogsListHtml(events, { type = 'all', query = '' } = {}) {
  const filtered = filterLogEvents(events, { type, query });

  if (!Array.isArray(events) || events.length === 0) {
    return (
      `<div class="logs-empty" id="logsEmpty">` +
      `No log events recorded in buffer.` +
      `</div>`
    );
  }

  if (filtered.length === 0) {
    return (
      `<div class="logs-empty" id="logsFilteredEmpty">` +
      `No log events matching filters.` +
      `</div>`
    );
  }

  const rows = filtered.map((e) => renderLogEventRowHtml(e)).join('\n');
  return `<div class="logs-list" id="logsListContainer">${rows}</div>`;
}

export function renderLogsNoticesHtml(data, adapterError = null) {
  const bounded = data?.bounded || {};
  const count = Number.isFinite(bounded.count) ? bounded.count : (data?.events?.length || 0);
  const chars = Number.isFinite(bounded.chars) ? bounded.chars : 0;
  const maxEvents = bounded.maxEvents || 500;
  const maxChars = bounded.maxChars || 262144;

  const charsFormatted = chars.toLocaleString('en-US');
  const maxCharsFormatted = maxChars.toLocaleString('en-US');

  const headerNotice =
    `<div class="logs-header-banner" id="logsHeaderBanner" role="note">` +
    `<span class="logs-banner-icon" aria-hidden="true">&#9432;</span> ` +
    `In-Memory Event Ring Buffer: ` +
    `<strong>${count}</strong> / ${maxEvents} events &bull; ` +
    `<strong>${charsFormatted}</strong> / ${maxCharsFormatted} characters` +
    `</div>`;

  const effectiveAdapterError = adapterError || data?.error;
  const adapterNotice = effectiveAdapterError
    ? `<div class="logs-adapter-notice" id="logsAdapterNotice" role="status">` +
      `<span class="badge badge-error">Adapter Notice</span> ${escapeHtml(effectiveAdapterError)}` +
      `</div>`
    : '';

  return `${headerNotice}${adapterNotice}`;
}

export function renderLogsOverviewHtml(
  data,
  { type = 'all', query = '', adapterError = null } = {},
) {
  const noticesHtml = renderLogsNoticesHtml(data, adapterError);

  const types = [
    { value: 'all', label: 'All Event Types' },
    { value: 'status_change', label: 'status_change' },
    { value: 'needs_you', label: 'needs_you' },
    { value: 'needs_you_cleared', label: 'needs_you_cleared' },
    { value: 'error', label: 'error' },
    { value: 'adapter_error', label: 'adapter_error' },
  ];

  const typeOptions = types
    .map((t) => {
      const selected = t.value === type ? ' selected' : '';
      return `<option value="${t.value}"${selected}>${escapeHtml(t.label)}</option>`;
    })
    .join('');

  const filterBarHtml =
    `<div class="logs-filter-bar">` +
    `<div class="filter-item">` +
    `<label for="logsTypeFilter" class="filter-label">Type:</label>` +
    `<select id="logsTypeFilter" class="filter-select">${typeOptions}</select>` +
    `</div>` +
    `<div class="filter-item filter-search-wrap">` +
    `<label for="logsSearchInput" class="filter-label">Filter:</label>` +
    `<input type="search" id="logsSearchInput" class="filter-input" ` +
    `placeholder="Search log messages, agents, or panes…" value="${escapeHtml(query)}" />` +
    `</div>` +
    `</div>`;

  const events = Array.isArray(data?.events) ? data.events : [];
  const listHtml = renderLogsListHtml(events, { type, query });

  return (
    `<div class="logs-overview" id="logsOverview">` +
    `<div class="logs-notices" id="logsNotices">${noticesHtml}</div>` +
    filterBarHtml +
    `<div id="logsListWrap">${listHtml}</div>` +
    `</div>`
  );
}

export function renderLogsView(
  container,
  { data, error, adapterError, loading, type, query } = {},
) {
  if (!container) return;
  if (loading) {
    container.innerHTML =
      '<div class="logs-loading" id="logsLoading">Loading event logs…</div>';
    return;
  }

  // Fatal error: no events and error occurred
  if (error && (!data || !Array.isArray(data.events))) {
    container.innerHTML =
      `<div class="logs-error" id="logsError" role="alert">` +
      `Failed to load logs from server: ${escapeHtml(error)}</div>`;
    return;
  }

  const isMounted = Boolean(
    (container.querySelector && container.querySelector('#logsOverview')) ||
    (container.innerHTML && container.innerHTML.includes('id="logsOverview"'))
  );

  const existingSelect = container.querySelector ? container.querySelector('#logsTypeFilter') : null;
  const existingInput = container.querySelector ? container.querySelector('#logsSearchInput') : null;

  const activeType = type !== undefined ? type : (existingSelect ? existingSelect.value : 'all');
  const activeQuery = query !== undefined ? query : (existingInput ? existingInput.value : '');

  if (!isMounted) {
    container.innerHTML = renderLogsOverviewHtml(data, {
      type: activeType,
      query: activeQuery,
      adapterError,
    });
    container._lastLogsJson = JSON.stringify({ data, adapterError });
    container._currentLogsData = data;

    const selectEl = container.querySelector ? container.querySelector('#logsTypeFilter') : null;
    const inputEl = container.querySelector ? container.querySelector('#logsSearchInput') : null;

    const updateList = () => {
      const listWrap = container.querySelector ? container.querySelector('#logsListWrap') : null;
      if (!listWrap) return;
      const curType = selectEl ? selectEl.value : 'all';
      const curQuery = inputEl ? inputEl.value : '';
      const currentData = container._currentLogsData;
      const events = Array.isArray(currentData?.events) ? currentData.events : [];
      listWrap.innerHTML = renderLogsListHtml(events, { type: curType, query: curQuery });
    };

    if (typeof selectEl?.addEventListener === 'function') selectEl.addEventListener('change', updateList);
    if (typeof inputEl?.addEventListener === 'function') inputEl.addEventListener('input', updateList);
    return;
  }

  container._currentLogsData = data;
  const rawJson = JSON.stringify({ data, adapterError });
  if (container._lastLogsJson === rawJson) {
    return;
  }
  container._lastLogsJson = rawJson;

  // Data changed: update notices and list wrap, preserving filter select and input
  const noticesEl = container.querySelector ? container.querySelector('#logsNotices') : null;
  if (noticesEl) {
    noticesEl.innerHTML = renderLogsNoticesHtml(data, adapterError);
  }

  const listWrap = container.querySelector ? container.querySelector('#logsListWrap') : null;
  if (listWrap) {
    const events = Array.isArray(data?.events) ? data.events : [];
    listWrap.innerHTML = renderLogsListHtml(events, { type: activeType, query: activeQuery });
  }
}

export async function fetchLogs(
  fetchFn = (typeof window !== 'undefined' ? window.fetch : null),
  { after = null, limit = 100 } = {},
) {
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'fetch is not available', events: [], bounded: null };
  }
  try {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', String(limit));
    if (after != null) params.set('after', String(after));
    const qs = params.toString();
    const url = `/api/logs${qs ? `?${qs}` : ''}`;
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        events: [],
        bounded: null,
      };
    }
    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    return {
      ok: true,
      data,
      events,
      bounded: data?.bounded || null,
      error: data?.error || null,
      adapterError: data?.error || null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || 'Network error',
      events: [],
      bounded: null,
    };
  }
}
