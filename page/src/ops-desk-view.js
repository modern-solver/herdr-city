// Module: page/src/ops-desk-view.js
// Purpose: Ops desk queue view rendering, card layout, wait timers, and API contract consumption (U6)
// Maintainer: builder-gemini

import { escapeHtml } from './sessions-view.js';

export function formatWaitDuration(waitMs) {
  const ms = Number(waitMs);
  if (!Number.isFinite(ms) || ms < 1000) return 'Waiting <1s';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `Waiting ${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (min < 60) return `Waiting ${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `Waiting ${hr}h ${remMin}m`;
}

export function renderOpsDeskCardHtml(item) {
  if (!item) return '';

  // Failed source or adapter error record for a specific source/district
  if (item.error && !item.cli && !item.prompt) {
    const src = escapeHtml(item.districtId || item.id || 'Unknown source');
    const districtTitle = item.districtTitle || item.districtId || '-';
    return (
      `<div class="ops-card ops-card-error" data-source="${src}">` +
      `<div class="ops-card-header">` +
      `<div class="ops-card-meta-left">` +
      `<span class="badge badge-error">Source Error</span>` +
      `<strong>${escapeHtml(districtTitle)}</strong>` +
      `</div>` +
      `</div>` +
      `<div class="ops-card-error-body">${escapeHtml(item.error)}</div>` +
      `</div>`
    );
  }

  const name = item.name || item.paneId || '-';
  const paneId = item.paneId || item.id || '';
  const paneCaption = `<small class="sub-id">${escapeHtml(paneId)}</small>`;
  const districtTitle = item.districtTitle || item.districtId || '-';
  const districtId = item.districtId ? `<small class="sub-id">${escapeHtml(item.districtId)}</small>` : '';
  const cliBadge = item.cli ? `<span class="badge badge-cli">${escapeHtml(item.cli)}</span>` : '';
  const modelBadge = item.model ? `<span class="badge badge-model">${escapeHtml(item.model)}</span>` : '';
  const waitLabel = formatWaitDuration(item.waitMs);
  const prompt = item.prompt || '(empty prompt)';
  const inspectUrl = `#screen?paneId=${encodeURIComponent(paneId)}`;

  return (
    `<div class="ops-card" data-pane-id="${escapeHtml(paneId)}" data-since="${escapeHtml(item.since)}">` +
    `<div class="ops-card-header">` +
    `<div class="ops-card-meta-left">` +
    `<strong>${escapeHtml(name)}</strong>${paneCaption}` +
    `<div class="badge-group">${cliBadge}${modelBadge}</div>` +
    `<div class="cell-wrap"><span>${escapeHtml(districtTitle)}</span>${districtId}</div>` +
    `</div>` +
    `<div class="ops-card-meta-right">` +
    `<span class="badge badge-wait">${escapeHtml(waitLabel)}</span>` +
    `</div>` +
    `</div>` +
    `<blockquote class="ops-prompt-quote">` +
    `<p class="ops-prompt-text">${escapeHtml(prompt)}</p>` +
    `</blockquote>` +
    `<div class="ops-card-footer">` +
    `<span class="badge badge-recommendation">Recommendation: null (P1 placeholder)</span>` +
    `<a href="${inspectUrl}" class="btn-inspect" aria-label="Inspect pane ${escapeHtml(paneId)}">` +
    `Inspect Pane Screen</a>` +
    `</div>` +
    `</div>`
  );
}

export function renderOpsDeskQueueHtml(items, { adapterError } = {}) {
  const headerBanner =
    `<div class="ops-header-banner" id="opsHeaderBanner" role="note">` +
    `<span class="ops-banner-icon" aria-hidden="true">&#9888;</span> ` +
    `City Hall Ops Desk — Display Only (P1). Respond directly in herdr terminal.` +
    `</div>`;

  const noticeHtml = adapterError
    ? `<div class="ops-adapter-notice" id="opsAdapterNotice" role="status">` +
      `<span class="badge badge-error">Adapter Notice</span> ${escapeHtml(adapterError)}</div>`
    : '';

  const hasItems = Array.isArray(items) && items.length > 0;
  if (!hasItems) {
    const emptyBanner =
      `<div class="ops-empty-banner" id="opsEmpty">` +
      `<span class="ops-check-icon" aria-hidden="true">&#10004;</span> ` +
      `All agent queues clear. No items require attention.</div>`;
    return `${headerBanner}${noticeHtml}${emptyBanner}`;
  }

  // Sort by since ascending (longest waiting prompt first)
  const sorted = [...items].sort((a, b) => Number(a.since || 0) - Number(b.since || 0));
  const cards = sorted.map((item) => renderOpsDeskCardHtml(item)).join('\n');

  return `${headerBanner}${noticeHtml}` + `<div class="ops-queue" id="opsQueue">${cards}</div>`;
}

export function renderOpsDeskView(container, { items, error, adapterError, loading } = {}) {
  if (!container) return;
  if (loading) {
    container.innerHTML = '<div class="ops-loading" id="opsLoading">Loading ops desk queue…</div>';
    return;
  }

  const effectiveAdapterError = adapterError || (Array.isArray(items) && items.length > 0 ? error : null);

  // Fatal error: no items list at all and error occurred
  if (error && !effectiveAdapterError && (!Array.isArray(items) || items.length === 0)) {
    container.innerHTML =
      `<div class="ops-error" id="opsError" role="alert">` +
      `Failed to load ops desk from server: ${escapeHtml(error)}</div>`;
    return;
  }

  container.innerHTML = renderOpsDeskQueueHtml(items, { adapterError: effectiveAdapterError });
}

export async function fetchOpsDesk(fetchFn = typeof window !== 'undefined' ? window.fetch : null) {
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'fetch is not available', items: [], adapterError: null };
  }
  try {
    const url = '/api/ops-desk';
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, items: [], adapterError: null };
    }
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const adapterError = data?.error || null;
    return { ok: true, data, items, adapterError, error: adapterError };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error', items: [], adapterError: null };
  }
}
