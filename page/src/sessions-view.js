// Module: page/src/sessions-view.js
// Purpose: Sessions list view rendering, table construction, and status badge formatting for U2
// Maintainer: builder-gemini

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatRelativeTime(timestamp, now = Date.now()) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) return '-';
  const diff = Math.max(0, now - ts);
  if (diff < 5000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function getStatusBadgeHtml(status, statusLabel, prompt) {
  const normStatus = String(status || 'idle').toLowerCase();
  const safeStatus = ['working', 'idle', 'blocked', 'error'].includes(normStatus)
    ? normStatus
    : 'idle';
  const defaultLabel =
    safeStatus === 'blocked'
      ? 'Needs you'
      : safeStatus === 'error'
        ? 'Error'
        : safeStatus === 'working'
          ? 'Working'
          : 'Idle';
  const label = statusLabel || defaultLabel;
  const hasAlertPrompt = (safeStatus === 'blocked' || safeStatus === 'error') && prompt;
  const titleAttr = hasAlertPrompt ? ` title="${escapeHtml(prompt)}"` : '';
  const indicator =
    safeStatus === 'blocked' || safeStatus === 'error'
      ? '<span class="status-dot alert" aria-hidden="true"></span>'
      : '';
  return `<span class="badge badge-status status-${safeStatus}"${titleAttr}>${indicator}${escapeHtml(label)}</span>`;
}

export function truncateString(str, max = 40) {
  if (!str) return '-';
  const s = String(str);
  return s.length > max ? `${s.slice(0, max - 3)}…` : s;
}

export function renderSessionRow(session) {
  const paneId = session.paneId || session.id || '';
  const districtTitle = session.districtTitle || session.districtId || '-';
  const districtId = session.districtId
    ? `<small class="sub-id">${escapeHtml(session.districtId)}</small>`
    : '';

  // Failed source or adapter error record for a specific source/district
  if (session.error && !session.cli && !session.model) {
    const src = escapeHtml(session.districtId || paneId);
    return (
      `<tr class="row-source-error" data-source="${src}">` +
      `<td class="cell-district"><div class="cell-wrap">` +
      `<span>${escapeHtml(districtTitle)}</span>${districtId}</div></td>` +
      `<td colspan="7" class="cell-source-error-msg"><span class="badge badge-error">` +
      `Source error</span> ${escapeHtml(session.error)}</td>` +
      `</tr>`
    );
  }

  const name = session.name || paneId || '-';
  const paneCaption = `<small class="sub-id">${escapeHtml(paneId)}</small>`;
  const cliBadge = session.cli
    ? `<span class="badge badge-cli">${escapeHtml(session.cli)}</span>`
    : '';
  const modelBadge = session.model
    ? `<span class="badge badge-model">${escapeHtml(session.model)}</span>`
    : '';
  const statusBadge = getStatusBadgeHtml(
    session.status,
    session.statusLabel,
    session.prompt || session.error,
  );
  const cwd = session.cwd || '-';
  const cwdShort = truncateString(cwd, 32);
  const activity = session.activity || session.prompt || session.error || '-';
  const actShort = truncateString(activity, 36);
  const lastSeen = formatRelativeTime(session.lastSeenAt);
  const inspectUrl = `#screen?paneId=${encodeURIComponent(paneId)}`;

  return (
    `<tr data-pane-id="${escapeHtml(paneId)}">` +
    `<td class="cell-district"><div class="cell-wrap">` +
    `<span>${escapeHtml(districtTitle)}</span>${districtId}</div></td>` +
    `<td class="cell-agent"><div class="cell-wrap"><strong>${escapeHtml(name)}</strong>` +
    `${paneCaption}</div></td>` +
    `<td class="cell-tool"><div class="badge-group">${cliBadge}${modelBadge}</div></td>` +
    `<td class="cell-status">${statusBadge}</td>` +
    `<td class="cell-cwd" title="${escapeHtml(cwd)}">${escapeHtml(cwdShort)}</td>` +
    `<td class="cell-activity" title="${escapeHtml(activity)}">${escapeHtml(actShort)}</td>` +
    `<td class="cell-time">${escapeHtml(lastSeen)}</td>` +
    `<td class="cell-action"><a href="${inspectUrl}" class="btn-inspect" ` +
    `aria-label="Inspect pane ${escapeHtml(paneId)}">Inspect</a></td>` +
    `</tr>`
  );
}

export function renderSessionsTableHtml(sessions, { adapterError } = {}) {
  const hasSessions = Array.isArray(sessions) && sessions.length > 0;
  if (!hasSessions && !adapterError) {
    return (
      '<div class="sessions-empty" id="sessionsEmpty">' +
      'No agent sessions found matching current filters.</div>'
    );
  }

  const errorRow = adapterError
    ? `<tr class="row-adapter-error" id="rowAdapterError"><td class="cell-district">` +
      `<span class="badge badge-error">Adapter</span></td><td colspan="7" ` +
      `class="cell-adapter-error-msg"><span class="adapter-error-text">` +
      `${escapeHtml(adapterError)}</span></td></tr>`
    : '';

  const rows = hasSessions ? sessions.map((s) => renderSessionRow(s)).join('\n') : '';

  return (
    `<table class="sessions-table" id="sessionsTable" aria-label="Agent sessions">` +
    `<thead><tr>` +
    `<th scope="col">District</th>` +
    `<th scope="col">Agent</th>` +
    `<th scope="col">CLI &amp; Model</th>` +
    `<th scope="col">Status</th>` +
    `<th scope="col">Directory</th>` +
    `<th scope="col">Activity</th>` +
    `<th scope="col">Last Seen</th>` +
    `<th scope="col">Action</th>` +
    `</tr></thead>` +
    `<tbody>${errorRow}${rows}</tbody>` +
    `</table>`
  );
}

export function renderSessionsView(container, { sessions, error, adapterError, loading } = {}) {
  if (!container) return;
  if (loading) {
    container.innerHTML =
      '<div class="sessions-loading" id="sessionsLoading">Loading sessions…</div>';
    return;
  }

  const effectiveAdapterError =
    adapterError || (Array.isArray(sessions) && sessions.length > 0 ? error : null);

  // Fatal error: no sessions list at all and error occurred
  if (error && !effectiveAdapterError && (!Array.isArray(sessions) || sessions.length === 0)) {
    container.innerHTML =
      `<div class="sessions-error" id="sessionsError" role="alert">` +
      `Failed to load sessions from server: ${escapeHtml(error)}</div>`;
    return;
  }

  const noticeHtml = effectiveAdapterError
    ? `<div class="sessions-adapter-notice" id="sessionsAdapterNotice" role="status">` +
      `<span class="badge badge-error">Adapter notice</span> ${escapeHtml(effectiveAdapterError)}</div>`
    : '';

  const tableHtml = renderSessionsTableHtml(sessions, { adapterError: effectiveAdapterError });
  container.innerHTML = `${noticeHtml}${tableHtml}`;
}

export async function fetchSessions(
  fetchFn = (typeof window !== 'undefined' ? window.fetch : null),
  query = {},
) {
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'fetch is not available', sessions: [], adapterError: null };
  }
  try {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') params.set(k, String(v));
    }
    const qStr = params.toString();
    const url = `/api/sessions${qStr ? `?${qStr}` : ''}`;
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, sessions: [], adapterError: null };
    }
    const data = await res.json();
    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
    const adapterError = data?.error || null;
    return { ok: true, data, sessions, adapterError, error: adapterError };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error', sessions: [], adapterError: null };
  }
}
