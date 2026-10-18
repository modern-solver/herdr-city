// Module: page/src/filters-view.js
// Purpose: Session list filters toolbar, segmented controls, debounced search, and active chips for U3
// Maintainer: builder-gemini

import { escapeHtml } from './sessions-view.js';

export const CLI_OPTIONS = ['All', 'claude', 'grok', 'gemini', 'cursor'];
export const STATUS_OPTIONS = ['All', 'working', 'idle', 'blocked'];
export const DEBOUNCE_DELAY_MS = 300;

export function parseFilterParams(input) {
  let params;
  if (input instanceof URLSearchParams) {
    params = input;
  } else if (typeof input === 'string') {
    const qPart = input.includes('?') ? input.split('?')[1] : input.replace(/^#\/?/, '');
    params = new URLSearchParams(qPart);
  } else if (input && typeof input === 'object') {
    return {
      q: cleanFilterValue(input.q),
      district: cleanFilterValue(input.district),
      cli: validateCliOption(input.cli),
      status: validateStatusOption(input.status),
      model: cleanFilterValue(input.model),
    };
  } else {
    params = new URLSearchParams();
  }

  return {
    q: cleanFilterValue(params.get('q')),
    district: cleanFilterValue(params.get('district')),
    cli: validateCliOption(params.get('cli')),
    status: validateStatusOption(params.get('status')),
    model: cleanFilterValue(params.get('model')),
  };
}

function cleanFilterValue(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function validateCliOption(val) {
  const s = cleanFilterValue(val);
  if (!s) return null;
  const lower = s.toLowerCase();
  const found = CLI_OPTIONS.slice(1).find((opt) => opt.toLowerCase() === lower);
  return found || null;
}

function validateStatusOption(val) {
  const s = cleanFilterValue(val);
  if (!s) return null;
  const lower = s.toLowerCase();
  const found = STATUS_OPTIONS.slice(1).find((opt) => opt.toLowerCase() === lower);
  return found || null;
}

export function buildFilterQueryParams(filters = {}) {
  const params = new URLSearchParams();
  const parsed = parseFilterParams(filters);
  for (const [k, v] of Object.entries(parsed)) {
    if (v != null && v !== '') {
      params.set(k, v);
    }
  }
  return params;
}

export function updateUrlFilterHash(filters, { win = (typeof window !== 'undefined' ? window : null) } = {}) {
  const params = buildFilterQueryParams(filters);
  const qs = params.toString();
  const newHash = qs ? `#sessions?${qs}` : '#sessions';
  if (win?.location) {
    if (win.location.hash !== newHash) {
      win.location.hash = newHash;
    }
  }
  return newHash;
}

export function renderFilterChipsHtml(filters = {}) {
  const parsed = parseFilterParams(filters);
  const chips = [];

  if (parsed.q) {
    chips.push(renderChipItemHtml('q', `Search: &quot;${escapeHtml(parsed.q)}&quot;`));
  }
  if (parsed.district) {
    chips.push(renderChipItemHtml('district', `District: ${escapeHtml(parsed.district)}`));
  }
  if (parsed.cli) {
    chips.push(renderChipItemHtml('cli', `CLI: ${escapeHtml(parsed.cli)}`));
  }
  if (parsed.status) {
    const label = parsed.status === 'blocked' ? 'Needs you' : parsed.status;
    chips.push(renderChipItemHtml('status', `Status: ${escapeHtml(label)}`));
  }
  if (parsed.model) {
    chips.push(renderChipItemHtml('model', `Model: ${escapeHtml(parsed.model)}`));
  }

  return chips.join('\n');
}

function renderChipItemHtml(key, labelHtml) {
  const safeKey = escapeHtml(key);
  return (
    `<div class="filter-chip" data-filter-key="${safeKey}">` +
    `<span class="chip-label">${labelHtml}</span>` +
    `<button type="button" class="chip-dismiss" data-dismiss-key="${safeKey}" ` +
    `aria-label="Remove ${safeKey} filter">×</button>` +
    `</div>`
  );
}

export function renderFiltersBarHtml(activeFilters = {}) {
  const parsed = parseFilterParams(activeFilters);
  const qVal = parsed.q ? escapeHtml(parsed.q) : '';
  const distVal = parsed.district ? escapeHtml(parsed.district) : '';
  const modelVal = parsed.model ? escapeHtml(parsed.model) : '';

  const cliOptionsHtml = CLI_OPTIONS.map((opt) => {
    const val = opt === 'All' ? '' : opt;
    const isSel = (parsed.cli || '') === val;
    return `<option value="${escapeHtml(val)}"${isSel ? ' selected' : ''}>${escapeHtml(opt)}</option>`;
  }).join('');

  const statusBtnsHtml = STATUS_OPTIONS.map((opt) => {
    const val = opt === 'All' ? '' : opt;
    const isAct = (parsed.status || '') === val;
    const label = opt === 'blocked' ? 'Needs you' : opt;
    return (
      `<button type="button" class="seg-btn${isAct ? ' active' : ''}" ` +
      `data-status="${escapeHtml(val)}">${escapeHtml(label)}</button>`
    );
  }).join('');

  const chipsHtml = renderFilterChipsHtml(parsed);

  return (
    `<div class="sessions-filter-bar" id="sessionsFilterBar">` +
    `<div class="filter-controls">` +
    `<input type="search" id="filterSearch" name="q" placeholder="Search sessions (name, activity...)" ` +
    `value="${qVal}" class="filter-input filter-search" aria-label="Search sessions">` +
    `<input type="text" id="filterDistrict" name="district" placeholder="District..." ` +
    `value="${distVal}" class="filter-input filter-district" aria-label="Filter by district">` +
    `<select id="filterCli" name="cli" class="filter-select filter-cli" aria-label="Filter by CLI">` +
    `${cliOptionsHtml}` +
    `</select>` +
    `<div class="filter-seg" id="filterStatusGroup" role="group" aria-label="Filter by status">` +
    `${statusBtnsHtml}` +
    `</div>` +
    `<input type="text" id="filterModel" name="model" placeholder="Model..." ` +
    `value="${modelVal}" class="filter-input filter-model" aria-label="Filter by model">` +
    `<button type="button" id="btnFilterReset" class="btn-filter-reset" ` +
    `aria-label="Reset all filters">Reset</button>` +
    `</div>` +
    `<div class="filter-chips-bar" id="filterChipsBar" role="region" aria-label="Active filters">` +
    `${chipsHtml}` +
    `</div>` +
    `</div>`
  );
}

export function syncFilterInputs(container, filters = {}) {
  if (!container) return;
  const parsed = parseFilterParams(filters);
  const doc = container.ownerDocument || (typeof document !== 'undefined' ? document : null);
  const activeEl = doc?.activeElement;

  const searchEl = container.querySelector('#filterSearch');
  if (searchEl && activeEl !== searchEl) {
    searchEl.value = parsed.q || '';
  }

  const districtEl = container.querySelector('#filterDistrict');
  if (districtEl && activeEl !== districtEl) {
    districtEl.value = parsed.district || '';
  }

  const modelEl = container.querySelector('#filterModel');
  if (modelEl && activeEl !== modelEl) {
    modelEl.value = parsed.model || '';
  }

  const cliEl = container.querySelector('#filterCli');
  if (cliEl && activeEl !== cliEl) {
    cliEl.value = parsed.cli || '';
  }

  const statusBtns = container.querySelectorAll('#filterStatusGroup .seg-btn');
  for (const btn of statusBtns) {
    const btnVal = btn.dataset.status || '';
    const isActive = btnVal === (parsed.status || '');
    btn.classList.toggle('active', isActive);
  }
}

export function bindFilterEvents(
  container,
  { onFilterChange, onReset, onDismissChip, debounceMs = DEBOUNCE_DELAY_MS } = {},
) {
  if (!container) return { destroy: () => {} };

  let debounceTimer = null;

  function getCurrentFilterValues() {
    const searchEl = container.querySelector('#filterSearch');
    const distEl = container.querySelector('#filterDistrict');
    const cliEl = container.querySelector('#filterCli');
    const modelEl = container.querySelector('#filterModel');
    const actBtn = container.querySelector('#filterStatusGroup .seg-btn.active');

    return {
      q: cleanFilterValue(searchEl?.value),
      district: cleanFilterValue(distEl?.value),
      cli: validateCliOption(cliEl?.value),
      status: validateStatusOption(actBtn?.dataset.status),
      model: cleanFilterValue(modelEl?.value),
    };
  }

  function triggerChange(filters) {
    if (typeof onFilterChange === 'function') {
      onFilterChange(filters);
    }
  }

  function handleDebouncedInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      triggerChange(getCurrentFilterValues());
    }, debounceMs);
  }

  const searchEl = container.querySelector('#filterSearch');
  if (typeof searchEl?.addEventListener === 'function') {
    searchEl.addEventListener('input', handleDebouncedInput);
  }

  const distEl = container.querySelector('#filterDistrict');
  if (typeof distEl?.addEventListener === 'function') {
    distEl.addEventListener('input', handleDebouncedInput);
  }

  const modelEl = container.querySelector('#filterModel');
  if (typeof modelEl?.addEventListener === 'function') {
    modelEl.addEventListener('input', handleDebouncedInput);
  }

  const cliEl = container.querySelector('#filterCli');
  if (typeof cliEl?.addEventListener === 'function') {
    cliEl.addEventListener('change', () => {
      triggerChange(getCurrentFilterValues());
    });
  }

  const statusGroup = container.querySelector('#filterStatusGroup');
  if (typeof statusGroup?.addEventListener === 'function') {
    statusGroup.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('.seg-btn');
      if (!btn) return;
      const btns = statusGroup.querySelectorAll ? statusGroup.querySelectorAll('.seg-btn') : [];
      for (const b of btns) b.classList?.remove?.('active');
      btn.classList?.add?.('active');
      triggerChange(getCurrentFilterValues());
    });
  }

  const resetBtn = container.querySelector('#btnFilterReset');
  if (typeof resetBtn?.addEventListener === 'function') {
    resetBtn.addEventListener('click', () => {
      if (searchEl) searchEl.value = '';
      if (distEl) distEl.value = '';
      if (modelEl) modelEl.value = '';
      if (cliEl) cliEl.value = '';
      const btns = statusGroup?.querySelectorAll ? statusGroup.querySelectorAll('.seg-btn') : [];
      for (const b of btns) {
        b.classList?.toggle?.('active', !b.dataset?.status);
      }
      const emptyFilters = { q: null, district: null, cli: null, status: null, model: null };
      if (typeof onReset === 'function') {
        onReset(emptyFilters);
      } else {
        triggerChange(emptyFilters);
      }
    });
  }

  const chipsBar = container.querySelector('#filterChipsBar');
  if (typeof chipsBar?.addEventListener === 'function') {
    chipsBar.addEventListener('click', (e) => {
      const dismissBtn = e.target?.closest?.('.chip-dismiss');
      if (!dismissBtn) return;
      const key = dismissBtn.dataset?.dismissKey;
      if (!key) return;
      if (typeof onDismissChip === 'function') {
        onDismissChip(key);
      } else {
        const cur = getCurrentFilterValues();
        cur[key] = null;
        syncFilterInputs(container, cur);
        triggerChange(cur);
      }
    });
  }

  return {
    destroy: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    },
  };
}

export function updateFilterChips(container, filters = {}, onDismissChip) {
  if (!container) return;
  const chipsBar = container.querySelector('#filterChipsBar');
  if (!chipsBar) return;
  chipsBar.innerHTML = renderFilterChipsHtml(filters);
}

export function renderFiltersView(
  container,
  { activeFilters = {}, onFilterChange, onReset, onDismissChip, debounceMs = DEBOUNCE_DELAY_MS } = {},
) {
  if (!container) return;
  const bar = container.querySelector('#sessionsFilterBar');
  if (!bar) {
    container.innerHTML = renderFiltersBarHtml(activeFilters);
    bindFilterEvents(container, {
      onFilterChange,
      onReset,
      onDismissChip,
      debounceMs,
    });
  } else {
    syncFilterInputs(container, activeFilters);
  }
}
