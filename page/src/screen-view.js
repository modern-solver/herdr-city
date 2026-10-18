// Module: page/src/screen-view.js
// Purpose: Pane screen viewer rendering, metadata ribbon, ANSI pass-through, and auto-scroll (U4)
// Maintainer: builder-gemini

const _esc = (s) => {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const _fmtTime = (ts) => {
  if (typeof formatRelativeTime === 'function') return formatRelativeTime(ts);
  return ts ? `${Math.floor((Date.now() - Number(ts)) / 1000)}s ago` : '-';
};

const _statusBadge = (status, label, prompt) => {
  if (typeof getStatusBadgeHtml === 'function') return getStatusBadgeHtml(status, label, prompt);
  return `<span class="badge badge-status">${_esc(label || status || 'idle')}</span>`;
};

export function renderScreenRibbonHtml(data) {
  if (!data) return '';
  const paneId = data.paneId || data.session?.paneId || '-';
  const name = data.session?.name || paneId;
  const districtTitle = data.session?.districtTitle || data.session?.districtId || '-';
  const districtId = data.session?.districtId
    ? `<small class="sub-id">${_esc(data.session.districtId)}</small>`
    : '';
  const cliBadge = data.session?.cli
    ? `<span class="badge badge-cli">${_esc(data.session.cli)}</span>`
    : '';
  const modelBadge = data.session?.model
    ? `<span class="badge badge-model">${_esc(data.session.model)}</span>`
    : '';
  const statusBadge = _statusBadge(
    data.session?.status,
    data.session?.statusLabel,
    data.session?.prompt,
  );
  const lineCount = Number.isFinite(data.lineCount) ? `${data.lineCount} lines` : '';
  const updated = data.updatedAt ? `Updated ${_fmtTime(data.updatedAt)}` : '';

  return (
    `<div class="screen-ribbon" id="screenRibbon">` +
    `<div class="screen-meta-left">` +
    `<span class="badge badge-cli">${_esc(paneId)}</span>` +
    `<h3 class="screen-title">${_esc(name)}</h3>` +
    `<div class="cell-wrap"><span>${_esc(districtTitle)}</span>${districtId}</div>` +
    `<div class="badge-group">${cliBadge}${modelBadge}${statusBadge}</div>` +
    `</div>` +
    `<div class="screen-meta-right">` +
    (lineCount ? `<span class="screen-lines">${_esc(lineCount)}</span>` : '') +
    (updated ? `<span class="screen-time">${_esc(updated)}</span>` : '') +
    `</div>` +
    `</div>`
  );
}

export function renderScreenToolbarHtml({ autoScroll = true, truncated = false } = {}) {
  const truncationBanner = truncated
    ? `<div class="screen-truncation-banner" id="screenTruncationBanner" role="status">` +
      `<span class="badge badge-error">Notice</span> Output truncated at 80,000 characters.</div>`
    : '';

  return (
    `<div class="screen-toolbar" id="screenToolbar">` +
    `<div class="screen-tools-left">` +
    `<label class="screen-autoscroll-label">` +
    `<input type="checkbox" id="screenAutoScroll" ${autoScroll ? 'checked' : ''}> ` +
    `Auto-scroll to bottom</label>` +
    `</div>` +
    `<div class="screen-tools-right">` +
    `<a href="#sessions" class="btn-city-link" aria-label="Back to Sessions">&larr; Back to Sessions</a>` +
    `</div>` +
    `</div>` +
    truncationBanner
  );
}

export function renderScreenViewportHtml(text) {
  if (text == null || text === '') {
    return (
      `<div class="screen-viewport" id="screenViewport">` +
      `<div class="screen-empty" id="screenEmpty">No recent output recorded for this pane.</div>` +
      `</div>`
    );
  }
  // P1 passes ANSI escape sequences through unchanged; rendered as raw text in preformatted block
  return (
    `<div class="screen-viewport" id="screenViewport">` +
    `<pre class="screen-pre"><code class="screen-code" id="screenCode">${_esc(text)}</code></pre>` +
    `</div>`
  );
}

export function renderScreenView(
  container,
  { data, error, loading, paneId, autoScroll = true } = {},
) {
  if (!container) return;
  if (!paneId) {
    container.innerHTML =
      `<div class="screen-prompt" id="screenSelectPrompt">` +
      `No pane selected. Choose an agent session from the ` +
      `<a href="#sessions">Sessions tab</a> to view its terminal screen.</div>`;
    return;
  }
  if (loading) {
    container.innerHTML =
      `<div class="screen-loading" id="screenLoading">` +
      `Reading pane output for ${_esc(paneId)}…</div>`;
    return;
  }
  if (error) {
    container.innerHTML =
      `<div class="screen-error" id="screenError" role="alert">` +
      `Unable to read pane ${_esc(paneId)}. Pane may have closed or herdr returned an error.</div>`;
    return;
  }
  if (!data) {
    container.innerHTML =
      `<div class="screen-empty" id="screenEmpty">No recent output recorded for this pane.</div>`;
    return;
  }

  const ribbonHtml = renderScreenRibbonHtml(data);
  const toolbarHtml = renderScreenToolbarHtml({ autoScroll, truncated: Boolean(data.truncated) });
  const viewportHtml = renderScreenViewportHtml(data.text);

  container.innerHTML = `${ribbonHtml}${toolbarHtml}${viewportHtml}`;

  if (autoScroll) {
    const vp = container.querySelector ? container.querySelector('#screenViewport') : null;
    if (vp && typeof vp.scrollHeight === 'number') {
      vp.scrollTop = vp.scrollHeight;
    }
  }
}

export async function fetchScreen(
  fetchFn = (typeof window !== 'undefined' ? window.fetch : null),
  paneId,
) {
  if (!paneId) {
    return { ok: false, error: 'paneId is required', data: null };
  }
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'fetch is not available', data: null };
  }
  try {
    const url = `/api/screen?paneId=${encodeURIComponent(paneId)}`;
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, data: null };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error', data: null };
  }
}
