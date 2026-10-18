// Module: page/src/rulebook-view.js
// Purpose: MAS house rules and district compliance view rendering and API contract consumption (U7)
// Maintainer: builder-gemini

import { escapeHtml } from './sessions-view.js';

export function renderDistrictCardHtml(district) {
  if (!district) return '';

  if (district.error && !district.cwd && !district.files) {
    const src = escapeHtml(district.id || 'Unknown district');
    const title = escapeHtml(district.title || district.id || '-');
    return (
      `<div class="district-card district-card-error" data-district="${src}">` +
      `<div class="district-header">` +
      `<div class="district-meta-left">` +
      `<span class="badge badge-error">District Error</span>` +
      `<strong>${title}</strong>` +
      `</div>` +
      `</div>` +
      `<div class="district-error-body">${escapeHtml(district.error)}</div>` +
      `</div>`
    );
  }

  const id = escapeHtml(district.id || '-');
  const title = escapeHtml(district.title || district.id || '-');
  const cwd = district.cwd ? escapeHtml(district.cwd) : '';
  const readableBadge = district.readable
    ? '<span class="badge badge-live">Readable</span>'
    : '<span class="badge badge-error">Unreadable</span>';

  const files = Array.isArray(district.files) ? district.files : [];
  const filesListHtml = files
    .map((f) => {
      const p = escapeHtml(f.path || '');
      if (f.present === true) {
        return (
          `<li class="file-item file-present">` +
          `<span class="icon-status" aria-hidden="true">&#10004;</span> ${p}</li>`
        );
      }
      if (f.present === false) {
        return (
          `<li class="file-item file-missing">` +
          `<span class="icon-status" aria-hidden="true">&#10006;</span> ${p}</li>`
        );
      }
      return `<li class="file-item file-unknown"><span class="icon-status" aria-hidden="true">—</span> ${p}</li>`;
    })
    .join('');

  const missing = Array.isArray(district.missing) ? district.missing : [];
  let statusBannerHtml = '';
  if (missing.length > 0) {
    const chips = missing
      .map((m) => `<span class="badge badge-error">${escapeHtml(m)}</span>`)
      .join(' ');
    statusBannerHtml =
      `<div class="district-missing-wrap">` +
      `<small class="missing-label">Missing required:</small> ` +
      `<div class="badge-group">${chips}</div>` +
      `</div>`;
  } else if (district.readable) {
    statusBannerHtml =
      `<div class="district-ok-wrap">` +
      `<span class="badge badge-live">&#10004; All required files present</span>` +
      `</div>`;
  }

  return (
    `<div class="district-card" data-district-id="${id}">` +
    `<div class="district-header">` +
    `<div class="district-meta-left">` +
    `<strong>${title}</strong>` +
    `<small class="sub-id">${id}</small>` +
    `</div>` +
    `<div class="district-meta-right">${readableBadge}</div>` +
    `</div>` +
    (cwd ? `<div class="district-cwd"><code>${cwd}</code></div>` : '') +
    `<ul class="district-files-list">${filesListHtml}</ul>` +
    statusBannerHtml +
    `</div>`
  );
}

export function filterRules(rules, query) {
  if (!Array.isArray(rules)) return [];
  const q = String(query || '').trim().toLowerCase();
  if (!q) return rules;
  return rules.filter((r) => {
    const id = String(r?.id || '').toLowerCase();
    const area = String(r?.area || '').toLowerCase();
    const text = String(r?.text || '').toLowerCase();
    const check = String(r?.check || '').toLowerCase();
    return id.includes(q) || area.includes(q) || text.includes(q) || check.includes(q);
  });
}

export function renderRulesTableHtml(rules, filterQuery = '') {
  const filtered = filterRules(rules, filterQuery);

  if (!Array.isArray(rules) || rules.length === 0) {
    return (
      `<div class="rules-empty" id="rulesEmpty">` +
      `No house rules loaded. Check that MAS-House-Rules-Handbook.md exists.` +
      `</div>`
    );
  }

  if (filtered.length === 0) {
    return (
      `<div class="rules-empty" id="rulesFilteredEmpty">` +
      `No rules matching filter "${escapeHtml(filterQuery)}".` +
      `</div>`
    );
  }

  const rows = filtered
    .map((r) => {
      const id = escapeHtml(r.id || '-');
      const area = escapeHtml(r.area || '-');
      const text = escapeHtml(r.text || '-');
      const check = r.check
        ? `<span class="badge badge-model">${escapeHtml(r.check)}</span>`
        : '<span class="muted">—</span>';

      return (
        `<tr>` +
        `<td class="cell-id"><strong>${id}</strong></td>` +
        `<td class="cell-area"><span class="badge badge-cli">${area}</span></td>` +
        `<td class="cell-text">${text}</td>` +
        `<td class="cell-check">${check}</td>` +
        `</tr>`
      );
    })
    .join('');

  return (
    `<div class="rulebook-table-wrap">` +
    `<table class="sessions-table rulebook-table" id="rulebookTable">` +
    `<thead>` +
    `<tr>` +
    `<th>Rule ID</th>` +
    `<th>Area</th>` +
    `<th>Rule Text</th>` +
    `<th>Check</th>` +
    `</tr>` +
    `</thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>` +
    `</div>`
  );
}

export function renderRulebookNoticesHtml(data, adapterError = null) {
  const isHandbookMissing = data?.error === 'handbook_missing' || !data?.handbook;

  const handbookNotice = isHandbookMissing
    ? `<div class="rulebook-notice rulebook-notice-warn" id="handbookMissingNotice" role="status">` +
      `<span class="badge badge-wait">Notice</span> ` +
      `Handbook file <code>docs/MAS-House-Rules-Handbook.md</code> not found in process working directory.` +
      `</div>`
    : '';

  const effectiveAdapterError = adapterError
    || (data?.error && data.error !== 'handbook_missing' ? data.error : null);
  const adapterNotice = effectiveAdapterError
    ? `<div class="rulebook-notice rulebook-notice-error" id="rulebookAdapterNotice" role="status">` +
      `<span class="badge badge-error">Adapter Notice</span> ${escapeHtml(effectiveAdapterError)}` +
      `</div>`
    : '';

  return `${handbookNotice}${adapterNotice}`;
}

export function renderRulebookOverviewHtml(data, { filterQuery = '', adapterError = null } = {}) {
  const noticesHtml = renderRulebookNoticesHtml(data, adapterError);

  const districts = Array.isArray(data?.districts) ? data.districts : [];
  const districtCards = districts.map((d) => renderDistrictCardHtml(d)).join('\n');
  const districtsGridHtml = districts.length > 0
    ? `<div class="districts-grid" id="districtsGrid">${districtCards}</div>`
    : `<div class="districts-empty" id="districtsEmpty">No districts active in this environment.</div>`;

  const handbookTitle = escapeHtml(data?.handbook?.title || 'MAS House Rules Handbook');
  const handbookMeta = data?.handbook
    ? `<span class="handbook-meta">v${escapeHtml(data.handbook.version || '1.0')}` +
      (data.handbook.date ? ` (${escapeHtml(data.handbook.date)})` : '') +
      `</span>`
    : '';

  const rules = Array.isArray(data?.rules) ? data.rules : [];
  const rulesTableHtml = renderRulesTableHtml(rules, filterQuery);

  const dCount = districts.length;
  const dLabel = `${dCount} district${dCount === 1 ? '' : 's'}`;
  const rCount = rules.length;
  const rLabel = `${rCount} rule${rCount === 1 ? '' : 's'}`;

  return (
    `<div class="rulebook-overview" id="rulebookOverview">` +
    `<div class="rulebook-notices" id="rulebookNotices">${noticesHtml}</div>` +
    `<section class="rulebook-section" id="sectionDistricts">` +
    `<div class="section-header">` +
    `<h3>District Compliance Overview</h3>` +
    `<span class="section-count" id="districtsCount">${dLabel}</span>` +
    `</div>` +
    `<div id="districtsContainer">${districtsGridHtml}</div>` +
    `</section>` +
    `<section class="rulebook-section" id="sectionRules">` +
    `<div class="section-header">` +
    `<h3 id="rulesTitle">${handbookTitle} ${handbookMeta}</h3>` +
    `<span class="section-count" id="rulesCount">${rLabel}</span>` +
    `</div>` +
    `<div class="rulebook-filter-bar" id="rulebookFilterBar">` +
    `<label for="rulebookFilter" class="filter-label">Filter rules:</label>` +
    `<input type="search" id="rulebookFilter" class="filter-input" ` +
    `placeholder="Search by ID (e.g. GOV-) or keyword…" value="${escapeHtml(filterQuery)}" />` +
    `</div>` +
    `<div id="rulebookTableContainer">${rulesTableHtml}</div>` +
    `</section>` +
    `</div>`
  );
}

export function renderRulebookView(
  container,
  { data, error, adapterError, loading, filterQuery } = {},
) {
  if (!container) return;
  if (loading) {
    container.innerHTML =
      '<div class="rulebook-loading" id="rulebookLoading">Loading rulebook &amp; compliance…</div>';
    return;
  }

  // Fatal error: no data at all and error occurred
  if (error && (!data || !data.districts)) {
    container.innerHTML =
      `<div class="rulebook-error" id="rulebookError" role="alert">` +
      `Failed to load rulebook from server: ${escapeHtml(error)}</div>`;
    return;
  }

  const isMounted = Boolean(
    (container.querySelector && container.querySelector('#rulebookOverview')) ||
    (container.innerHTML && container.innerHTML.includes('id="rulebookOverview"'))
  );

  const filterInput = container.querySelector ? container.querySelector('#rulebookFilter') : null;
  const activeQuery = filterQuery !== undefined ? filterQuery : (filterInput ? filterInput.value : '');

  // Mount filter controls and shell once
  if (!isMounted) {
    container.innerHTML = renderRulebookOverviewHtml(data, {
      filterQuery: activeQuery,
      adapterError,
    });
    container._lastRulebookJson = JSON.stringify({ data, adapterError });
    container._currentRulebookData = data;

    const mountedInput = container.querySelector ? container.querySelector('#rulebookFilter') : null;
    const tableContainer = container.querySelector ? container.querySelector('#rulebookTableContainer') : null;
    if (typeof mountedInput?.addEventListener === 'function' && tableContainer) {
      mountedInput.addEventListener('input', (e) => {
        const q = e.target.value;
        const currentData = container._currentRulebookData;
        const rules = Array.isArray(currentData?.rules) ? currentData.rules : [];
        tableContainer.innerHTML = renderRulesTableHtml(rules, q);
      });
    }
    return;
  }

  // Already mounted: update stored data reference
  container._currentRulebookData = data;
  const rawJson = JSON.stringify({ data, adapterError });
  if (container._lastRulebookJson === rawJson) {
    return;
  }
  container._lastRulebookJson = rawJson;

  // Data changed: update only grid/table and notices; keep filter controls intact
  const noticesEl = container.querySelector ? container.querySelector('#rulebookNotices') : null;
  if (noticesEl) {
    noticesEl.innerHTML = renderRulebookNoticesHtml(data, adapterError);
  }

  const districts = Array.isArray(data?.districts) ? data.districts : [];
  const districtsCountEl = container.querySelector ? container.querySelector('#districtsCount') : null;
  if (districtsCountEl) {
    const dCount = districts.length;
    districtsCountEl.textContent = `${dCount} district${dCount === 1 ? '' : 's'}`;
  }

  const districtsContainer = container.querySelector
    ? (container.querySelector('#districtsContainer') || container.querySelector('#districtsGrid'))
    : null;
  if (districtsContainer) {
    const districtCards = districts.map((d) => renderDistrictCardHtml(d)).join('\n');
    districtsContainer.innerHTML = districts.length > 0
      ? `<div class="districts-grid" id="districtsGrid">${districtCards}</div>`
      : `<div class="districts-empty" id="districtsEmpty">No districts active in this environment.</div>`;
  }

  const rules = Array.isArray(data?.rules) ? data.rules : [];
  const rulesCountEl = container.querySelector ? container.querySelector('#rulesCount') : null;
  if (rulesCountEl) {
    const rCount = rules.length;
    rulesCountEl.textContent = `${rCount} rule${rCount === 1 ? '' : 's'}`;
  }

  const tableContainer = container.querySelector ? container.querySelector('#rulebookTableContainer') : null;
  if (tableContainer) {
    tableContainer.innerHTML = renderRulesTableHtml(rules, activeQuery);
  }
}

export async function fetchRulebook(
  fetchFn = (typeof window !== 'undefined' ? window.fetch : null),
) {
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'fetch is not available', data: null, rules: [], districts: [] };
  }
  try {
    const url = '/api/rulebook';
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        data: null,
        rules: [],
        districts: [],
      };
    }
    const data = await res.json();
    const rules = Array.isArray(data?.rules) ? data.rules : [];
    const districts = Array.isArray(data?.districts) ? data.districts : [];
    return {
      ok: true,
      data,
      rules,
      districts,
      error: data?.error || null,
      adapterError: data?.error && data.error !== 'handbook_missing' ? data.error : null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || 'Network error',
      data: null,
      rules: [],
      districts: [],
    };
  }
}
