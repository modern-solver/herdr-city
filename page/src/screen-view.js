// Module: page/src/screen-view.js
// Purpose: Pane screen viewer rendering, metadata ribbon, ANSI pass-through, and auto-scroll (U4)
// Maintainer: builder-gemini

import { escapeHtml, formatRelativeTime, getStatusBadgeHtml } from './sessions-view.js';

export function renderScreenRibbonHtml(data) {
  if (!data) return '';
  const paneId = data.paneId || data.session?.paneId || '-';
  const name = data.session?.name || paneId;
  const districtTitle = data.session?.districtTitle || data.session?.districtId || '-';
  const districtId = data.session?.districtId
    ? `<small class="sub-id">${escapeHtml(data.session.districtId)}</small>`
    : '';
  const cliBadge = data.session?.cli
    ? `<span class="badge badge-cli">${escapeHtml(data.session.cli)}</span>`
    : '';
  const modelBadge = data.session?.model
    ? `<span class="badge badge-model">${escapeHtml(data.session.model)}</span>`
    : '';
  const statusBadge = getStatusBadgeHtml(
    data.session?.status,
    data.session?.statusLabel,
    data.session?.prompt,
  );
  const lineCount = Number.isFinite(data.lineCount) ? `${data.lineCount} lines` : '';
  const updated = data.updatedAt ? `Updated ${formatRelativeTime(data.updatedAt)}` : '';

  return (
    `<div class="screen-ribbon" id="screenRibbon">` +
    `<div class="screen-meta-left">` +
    `<span class="badge badge-cli">${escapeHtml(paneId)}</span>` +
    `<h3 class="screen-title">${escapeHtml(name)}</h3>` +
    `<div class="cell-wrap"><span>${escapeHtml(districtTitle)}</span>${districtId}</div>` +
    `<div class="badge-group">${cliBadge}${modelBadge}${statusBadge}</div>` +
    `</div>` +
    `<div class="screen-meta-right">` +
    (lineCount ? `<span class="screen-lines">${escapeHtml(lineCount)}</span>` : '') +
    (updated ? `<span class="screen-time">${escapeHtml(updated)}</span>` : '') +
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
    `<pre class="screen-pre"><code class="screen-code" id="screenCode">${escapeHtml(text)}</code></pre>` +
    `</div>`
  );
}

export function renderScreenView(
  container,
  { data, error, loading, paneId, autoScroll = true } = {},
) {
  if (!container) return;
  if (!paneId) {
    if (container.dataset) delete container.dataset.currentPaneId;
    container.innerHTML =
      `<div class="screen-prompt" id="screenSelectPrompt">` +
      `No pane selected. Choose an agent session from the ` +
      `<a href="#sessions">Sessions tab</a> to view its terminal screen.</div>`;
    return;
  }
  if (loading) {
    const hasExisting = container.querySelector ? container.querySelector('#screenViewport') : null;
    if (!hasExisting) {
      if (container.dataset) delete container.dataset.currentPaneId;
      container.innerHTML =
        `<div class="screen-loading" id="screenLoading">` +
        `Reading pane output for ${escapeHtml(paneId)}…</div>`;
    }
    return;
  }
  if (error) {
    const hasExisting = container.querySelector ? container.querySelector('#screenViewport') : null;
    if (!hasExisting) {
      if (container.dataset) delete container.dataset.currentPaneId;
      container.innerHTML =
        `<div class="screen-error" id="screenError" role="alert">` +
        `Unable to read pane ${escapeHtml(paneId)}. Pane may have closed or herdr returned an error.</div>`;
    }
    return;
  }
  if (!data) {
    if (container.dataset) delete container.dataset.currentPaneId;
    container.innerHTML =
      `<div class="screen-empty" id="screenEmpty">No recent output recorded for this pane.</div>`;
    return;
  }

  const isSamePane = container.dataset?.currentPaneId === paneId;
  const existingViewport = container.querySelector ? container.querySelector('#screenViewport') : null;
  const existingCode = container.querySelector ? container.querySelector('#screenCode') : null;

  // In-place update: update metadata and text without rebuilding viewport to preserve scroll and selection
  if (isSamePane && existingViewport && existingCode) {
    const ribbonWrap = container.querySelector('#screenRibbonWrap');
    if (ribbonWrap) {
      ribbonWrap.innerHTML = renderScreenRibbonHtml(data);
    }

    const autoScrollEl = container.querySelector('#screenAutoScroll');
    const effectiveAutoScroll = autoScrollEl ? autoScrollEl.checked : autoScroll;

    // Truncation banner in-place toggle
    const toolbarEl = container.querySelector('#screenToolbar');
    let truncEl = container.querySelector('#screenTruncationBanner');
    if (data.truncated && !truncEl && toolbarEl) {
      toolbarEl.insertAdjacentHTML(
        'afterend',
        '<div class="screen-truncation-banner" id="screenTruncationBanner" role="status">' +
          '<span class="badge badge-error">Notice</span> Output truncated at 80,000 characters.</div>',
      );
    } else if (!data.truncated && truncEl) {
      truncEl.remove();
    }

    const prevScrollTop = existingViewport.scrollTop;
    const newHtml = escapeHtml(data.text || '');

    // Only update innerHTML if text changed to preserve user text selection
    if (existingCode.innerHTML !== newHtml) {
      existingCode.innerHTML = newHtml;
      if (effectiveAutoScroll) {
        if (typeof existingViewport.scrollHeight === 'number') {
          existingViewport.scrollTop = existingViewport.scrollHeight;
        }
      } else {
        existingViewport.scrollTop = prevScrollTop;
      }
    } else {
      // Content unchanged; preserve scroll position
      if (effectiveAutoScroll) {
        if (typeof existingViewport.scrollHeight === 'number') {
          existingViewport.scrollTop = existingViewport.scrollHeight;
        }
      } else {
        existingViewport.scrollTop = prevScrollTop;
      }
    }
    return;
  }

  // Initial render or pane switch
  if (!container.dataset) container.dataset = {};
  container.dataset.currentPaneId = paneId;

  const ribbonWrapHtml = `<div id="screenRibbonWrap">${renderScreenRibbonHtml(data)}</div>`;
  const toolbarHtml = renderScreenToolbarHtml({ autoScroll, truncated: Boolean(data.truncated) });
  const viewportHtml = renderScreenViewportHtml(data.text);

  container.innerHTML = `${ribbonWrapHtml}${toolbarHtml}${viewportHtml}`;

  const autoScrollEl = container.querySelector ? container.querySelector('#screenAutoScroll') : null;
  const effectiveAutoScroll = autoScrollEl ? autoScrollEl.checked : autoScroll;
  if (effectiveAutoScroll) {
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
