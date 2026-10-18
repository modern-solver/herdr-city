// Module: test/filters-ui.test.js
// Purpose: Unit tests for U3 session list filters toolbar, segmented controls, debounced search, and active chips
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLI_OPTIONS,
  STATUS_OPTIONS,
  DEBOUNCE_DELAY_MS,
  parseFilterParams,
  buildFilterQueryParams,
  updateUrlFilterHash,
  renderFilterChipsHtml,
  renderFiltersBarHtml,
  syncFilterInputs,
  bindFilterEvents,
  updateFilterChips,
  renderFiltersView,
} from '../page/src/filters-view.js';
import { fetchSessions } from '../page/src/sessions-view.js';

test('CLI_OPTIONS and STATUS_OPTIONS contain spec constants', () => {
  assert.deepEqual(CLI_OPTIONS, ['All', 'claude', 'grok', 'gemini', 'cursor']);
  assert.deepEqual(STATUS_OPTIONS, ['All', 'working', 'idle', 'blocked']);
  assert.equal(DEBOUNCE_DELAY_MS, 300);
});

test('parseFilterParams extracts and sanitizes filter values from URLSearchParams, string, or object', () => {
  // 1. From query string with all 5 params
  const rawUrl = '#sessions?q=atlas&district=w8&cli=grok&status=blocked&model=grok-4';
  const parsed1 = parseFilterParams(rawUrl);
  assert.deepEqual(parsed1, {
    q: 'atlas',
    district: 'w8',
    cli: 'grok',
    status: 'blocked',
    model: 'grok-4',
  });

  // 2. From URLSearchParams instance
  const sp = new URLSearchParams('district=atlas-api&cli=Claude&status=working');
  const parsed2 = parseFilterParams(sp);
  assert.equal(parsed2.district, 'atlas-api');
  assert.equal(parsed2.cli, 'claude');
  assert.equal(parsed2.status, 'working');
  assert.equal(parsed2.q, null);
  assert.equal(parsed2.model, null);

  // 3. From plain object with invalid options
  const parsed3 = parseFilterParams({
    q: '  search query  ',
    district: '',
    cli: 'UNKNOWN_CLI',
    status: 'invalid_status',
    model: null,
  });
  assert.equal(parsed3.q, 'search query');
  assert.equal(parsed3.district, null);
  assert.equal(parsed3.cli, null);
  assert.equal(parsed3.status, null);
  assert.equal(parsed3.model, null);

  // 4. Null / empty input
  assert.deepEqual(parseFilterParams(null), {
    q: null,
    district: null,
    cli: null,
    status: null,
    model: null,
  });
});

test('buildFilterQueryParams serializes only active non-null filters', () => {
  const filters = {
    q: 'auth',
    district: 'atlas',
    cli: null,
    status: 'blocked',
    model: '',
  };
  const sp = buildFilterQueryParams(filters);
  assert.equal(sp.get('q'), 'auth');
  assert.equal(sp.get('district'), 'atlas');
  assert.equal(sp.get('status'), 'blocked');
  assert.equal(sp.has('cli'), false);
  assert.equal(sp.has('model'), false);
  assert.equal(sp.toString(), 'q=auth&district=atlas&status=blocked');
});

test('updateUrlFilterHash formats hash and updates mock window location', () => {
  const mockWin = { location: { hash: '#sessions' } };

  const hash1 = updateUrlFilterHash({ cli: 'grok', status: 'idle' }, { win: mockWin });
  assert.equal(hash1, '#sessions?cli=grok&status=idle');
  assert.equal(mockWin.location.hash, '#sessions?cli=grok&status=idle');

  // Empty filters clear query
  const hash2 = updateUrlFilterHash({}, { win: mockWin });
  assert.equal(hash2, '#sessions');
  assert.equal(mockWin.location.hash, '#sessions');
});

test('renderFiltersBarHtml renders all spec controls and pre-selects active values', () => {
  const activeFilters = {
    q: 'foo"bar',
    district: 'w8',
    cli: 'gemini',
    status: 'blocked',
    model: 'pro',
  };

  const html = renderFiltersBarHtml(activeFilters);

  // Controls present
  assert.match(html, /id="filterSearch"/);
  assert.match(html, /id="filterDistrict"/);
  assert.match(html, /id="filterCli"/);
  assert.match(html, /id="filterStatusGroup"/);
  assert.match(html, /id="filterModel"/);
  assert.match(html, /id="btnFilterReset"/);
  assert.match(html, /id="filterChipsBar"/);

  // Values escaped & pre-selected
  assert.match(html, /value="foo&quot;bar"/);
  assert.match(html, /value="w8"/);
  assert.match(html, /value="pro"/);
  assert.match(html, /<option value="gemini" selected>gemini<\/option>/);
  assert.match(html, /<button type="button" class="seg-btn active" data-status="blocked">Needs you<\/button>/);
});

test('renderFilterChipsHtml generates dismissible chips with labels and dismiss buttons', () => {
  // Empty filters -> empty string
  assert.equal(renderFilterChipsHtml({}), '');

  const activeFilters = {
    q: 'deploy',
    district: 'atlas',
    cli: 'grok',
    status: 'blocked',
    model: 'grok-4',
  };
  const html = renderFilterChipsHtml(activeFilters);

  assert.match(html, /data-filter-key="q"/);
  assert.match(html, /Search: &quot;deploy&quot;/);
  assert.match(html, /data-filter-key="district"/);
  assert.match(html, /District: atlas/);
  assert.match(html, /data-filter-key="cli"/);
  assert.match(html, /CLI: grok/);
  assert.match(html, /data-filter-key="status"/);
  assert.match(html, /Status: Needs you/);
  assert.match(html, /data-filter-key="model"/);
  assert.match(html, /Model: grok-4/);

  // Dismiss buttons with aria-label
  assert.match(html, /aria-label="Remove q filter"/);
  assert.match(html, /aria-label="Remove cli filter"/);
  assert.match(html, /data-dismiss-key="status"/);
});

test('syncFilterInputs updates input elements and segmented buttons preserving active focus', () => {
  const searchEl = { id: 'filterSearch', value: 'old query' };
  const distEl = { id: 'filterDistrict', value: 'old dist' };
  const modelEl = { id: 'filterModel', value: '' };
  const cliEl = { id: 'filterCli', value: 'claude' };
  const segBtns = [
    { dataset: { status: '' }, classList: { toggle: (cls, on) => { segBtns[0].active = on; } } },
    { dataset: { status: 'working' }, classList: { toggle: (cls, on) => { segBtns[1].active = on; } } },
    { dataset: { status: 'blocked' }, classList: { toggle: (cls, on) => { segBtns[2].active = on; } } },
  ];

  const mockContainer = {
    ownerDocument: { activeElement: searchEl }, // user is actively typing in searchEl!
    querySelector: (sel) => {
      if (sel === '#filterSearch') return searchEl;
      if (sel === '#filterDistrict') return distEl;
      if (sel === '#filterModel') return modelEl;
      if (sel === '#filterCli') return cliEl;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel.includes('.seg-btn')) return segBtns;
      return [];
    },
  };

  syncFilterInputs(mockContainer, {
    q: 'new query',
    district: 'new dist',
    cli: 'grok',
    status: 'blocked',
    model: 'gemini-1.5',
  });

  // Focused searchEl should NOT have been overwritten
  assert.equal(searchEl.value, 'old query');
  // Unfocused fields should have updated
  assert.equal(distEl.value, 'new dist');
  assert.equal(modelEl.value, 'gemini-1.5');
  assert.equal(cliEl.value, 'grok');
  assert.equal(segBtns[2].active, true, 'blocked status button marked active');
  assert.equal(segBtns[0].active, false);
});

test('bindFilterEvents handles debounced text input, dropdown change, and reset', async () => {
  let changedFilters = null;
  let resetCalled = false;
  let inputListener = null;
  let cliListener = null;
  let resetListener = null;

  const searchEl = {
    id: 'filterSearch',
    value: '',
    addEventListener: (evt, fn) => {
      if (evt === 'input') inputListener = fn;
    },
  };
  const distEl = { id: 'filterDistrict', value: '' };
  const modelEl = { id: 'filterModel', value: '' };
  const cliEl = {
    id: 'filterCli',
    value: '',
    addEventListener: (evt, fn) => {
      if (evt === 'change') cliListener = fn;
    },
  };
  const actBtn = { dataset: { status: 'working' } };
  const resetBtn = {
    id: 'btnFilterReset',
    addEventListener: (evt, fn) => {
      if (evt === 'click') resetListener = fn;
    },
  };

  const mockContainer = {
    querySelector: (sel) => {
      if (sel === '#filterSearch') return searchEl;
      if (sel === '#filterDistrict') return distEl;
      if (sel === '#filterModel') return modelEl;
      if (sel === '#filterCli') return cliEl;
      if (sel === '#filterStatusGroup .seg-btn.active') return actBtn;
      if (sel === '#btnFilterReset') return resetBtn;
      return null;
    },
    querySelectorAll: () => [],
  };

  const binder = bindFilterEvents(mockContainer, {
    onFilterChange: (f) => {
      changedFilters = f;
    },
    onReset: () => {
      resetCalled = true;
    },
    debounceMs: 20, // fast debounce for test
  });

  // 1. CLI change is immediate
  cliEl.value = 'cursor';
  cliListener();
  assert.equal(changedFilters?.cli, 'cursor');
  assert.equal(changedFilters?.status, 'working');

  // 2. Debounced search input
  changedFilters = null;
  searchEl.value = 'mastopia';
  inputListener();
  assert.equal(changedFilters, null, 'not fired immediately before debounce timer');

  await new Promise((r) => setTimeout(r, 35));
  assert.equal(changedFilters?.q, 'mastopia');

  // 3. Reset button
  resetListener();
  assert.equal(resetCalled, true);
  assert.equal(searchEl.value, '');
  assert.equal(cliEl.value, '');

  binder.destroy();
});

test('updateFilterChips and renderFiltersView manage mounting and chip updates', () => {
  const chipsBar = { innerHTML: '' };
  const mockContainer = {
    innerHTML: '',
    querySelector: (sel) => {
      if (sel === '#sessionsFilterBar') {
        return mockContainer.innerHTML.includes('id="sessionsFilterBar"') ? {} : null;
      }
      if (sel === '#filterChipsBar') return chipsBar;
      return null;
    },
    querySelectorAll: () => [],
  };

  // Mount filter view
  renderFiltersView(mockContainer, { activeFilters: { cli: 'grok' } });
  assert.match(mockContainer.innerHTML, /id="sessionsFilterBar"/);

  // Update chips with echoed filters from server
  updateFilterChips(mockContainer, { district: 'atlas', cli: 'grok', status: 'blocked' });
  assert.match(chipsBar.innerHTML, /District: atlas/);
  assert.match(chipsBar.innerHTML, /CLI: grok/);
  assert.match(chipsBar.innerHTML, /Status: Needs you/);
});

test('fetchSessions passes query filter parameters and extracts filters response', async () => {
  let requestedUrl = '';
  const mockFetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        v: 1,
        mode: 'fixture',
        filters: {
          district: 'atlas',
          cli: 'grok',
          status: 'blocked',
          model: null,
          q: null,
        },
        sessions: [
          {
            id: 'w8:p1',
            paneId: 'w8:p1',
            districtTitle: 'atlas-api',
            cli: 'grok',
            status: 'blocked',
          },
        ],
      }),
    };
  };

  const res = await fetchSessions(mockFetch, {
    district: 'atlas',
    cli: 'grok',
    status: 'blocked',
  });

  assert.equal(res.ok, true);
  assert.equal(requestedUrl, '/api/sessions?district=atlas&cli=grok&status=blocked');
  assert.equal(res.sessions.length, 1);
  assert.deepEqual(res.filters, {
    district: 'atlas',
    cli: 'grok',
    status: 'blocked',
    model: null,
    q: null,
  });
});

test('filter values and focus survive poll ticks without re-rendering controls', () => {
  const searchEl = { value: '', addEventListener: () => {} };
  const districtEl = { value: '', addEventListener: () => {} };
  const cliEl = { value: '', addEventListener: () => {} };
  const modelEl = { value: '', addEventListener: () => {} };
  const chipsBar = { innerHTML: '', _lastChipsJson: null };
  const statusGroup = {
    addEventListener: () => {},
    querySelectorAll: () => [],
  };
  const resetBtn = { addEventListener: () => {} };

  const elements = {
    '#filterSearch': searchEl,
    '#filterDistrict': districtEl,
    '#filterCli': cliEl,
    '#filterModel': modelEl,
    '#filterChipsBar': chipsBar,
    '#filterStatusGroup': statusGroup,
    '#btnFilterReset': resetBtn,
  };

  const mockContainer = {
    innerHTML: '',
    querySelector: (sel) => {
      if (sel === '#sessionsFilterBar') {
        return mockContainer.innerHTML.includes('id="sessionsFilterBar"') ? {} : null;
      }
      return elements[sel] || null;
    },
    querySelectorAll: () => [],
  };

  // 1. Initial mount on tab entry
  renderFiltersView(mockContainer, { activeFilters: {} });
  assert.match(mockContainer.innerHTML, /id="sessionsFilterBar"/);

  // 2. User types into filter inputs
  searchEl.value = 'mastopia';
  districtEl.value = 'atlas';
  cliEl.value = 'grok';

  // 3. 2000 ms poll tick occurs with same activeFilters
  renderFiltersView(mockContainer, { activeFilters: {} });

  // 4. Filter inputs must survive poll tick
  assert.equal(searchEl.value, 'mastopia', 'search filter preserved after poll');
  assert.equal(districtEl.value, 'atlas', 'district filter preserved after poll');
  assert.equal(cliEl.value, 'grok', 'cli filter preserved after poll');
});

