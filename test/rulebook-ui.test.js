// Module: test/rulebook-ui.test.js
// Purpose: Unit tests for U7 rulebook view rendering, district compliance, rules table, and fetch contract
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderDistrictCardHtml,
  filterRules,
  renderRulesTableHtml,
  renderRulebookOverviewHtml,
  renderRulebookView,
  fetchRulebook,
} from '../page/src/rulebook-view.js';

test('renderDistrictCardHtml renders compliance card, readable badge, and file status', () => {
  const district = {
    id: 'w1',
    title: 'mastopia',
    cwd: 'C:\\Users\\shaun\\mastopia',
    readable: true,
    files: [
      { path: 'CHANGELOG.md', present: true },
      { path: 'briefs/', present: true },
      { path: 'briefs/lead-escalations.md', present: false },
    ],
    missing: ['briefs/lead-escalations.md'],
  };

  const html = renderDistrictCardHtml(district);
  assert.match(html, /data-district-id="w1"/);
  assert.match(html, /<strong>mastopia<\/strong>/);
  assert.match(html, /<small class="sub-id">w1<\/small>/);
  assert.match(html, /class="badge badge-live">Readable<\/span>/);
  assert.match(html, /C:\\Users\\shaun\\mastopia/);
  assert.match(html, /file-present.*CHANGELOG\.md/);
  assert.match(html, /file-missing.*briefs\/lead-escalations\.md/);
  assert.match(html, /class="badge badge-error">briefs\/lead-escalations\.md<\/span>/);
});

test('renderDistrictCardHtml renders compliant badge when no files are missing', () => {
  const district = {
    id: 'w2',
    title: 'skyborne',
    cwd: 'C:\\Users\\shaun\\skyborne',
    readable: true,
    files: [
      { path: 'CHANGELOG.md', present: true },
      { path: 'briefs/', present: true },
      { path: 'briefs/lead-escalations.md', present: true },
    ],
    missing: [],
  };

  const html = renderDistrictCardHtml(district);
  assert.match(html, /All required files present/);
  assert.doesNotMatch(html, /Missing required:/);
});

test('renderDistrictCardHtml renders an inline error card for failed district source', () => {
  const failedDistrict = {
    id: 'w-corrupt',
    title: 'broken-district',
    error: 'Access denied or disk unmounted',
  };

  const html = renderDistrictCardHtml(failedDistrict);
  assert.match(html, /district-card-error/);
  assert.match(html, /Source Error|District Error/);
  assert.match(html, /broken-district/);
  assert.match(html, /Access denied or disk unmounted/);
});

test('filterRules filters by ID, area, keyword, or check column', () => {
  const sampleRules = [
    { id: 'GOV-01', area: 'GOV', text: 'Every change MUST go through a PR.', check: 'branch protection' },
    { id: 'SPEND-03', area: 'SPEND', text: 'Prefer cheapest model.', check: null },
    { id: 'SEC-02', area: 'SEC', text: 'Mask tokens in terminal output.', check: 'secret scan' },
  ];

  // Exact ID match
  const byId = filterRules(sampleRules, 'GOV-01');
  assert.equal(byId.length, 1);
  assert.equal(byId[0].id, 'GOV-01');

  // Area match
  const byArea = filterRules(sampleRules, 'SPEND');
  assert.equal(byArea.length, 1);
  assert.equal(byArea[0].id, 'SPEND-03');

  // Keyword match in text
  const byText = filterRules(sampleRules, 'tokens');
  assert.equal(byText.length, 1);
  assert.equal(byText[0].id, 'SEC-02');

  // Check column match
  const byCheck = filterRules(sampleRules, 'branch protection');
  assert.equal(byCheck.length, 1);
  assert.equal(byCheck[0].id, 'GOV-01');

  // Blank query returns all
  assert.equal(filterRules(sampleRules, '').length, 3);
  assert.equal(filterRules(sampleRules, null).length, 3);

  // No match
  assert.equal(filterRules(sampleRules, 'nonexistent-xyz').length, 0);
});

test('renderRulesTableHtml generates table headers and rows with escaped content', () => {
  const sampleRules = [
    { id: 'GOV-01', area: 'GOV', text: 'Every change MUST go through a PR.', check: 'branch protection' },
    { id: 'XSS-01', area: 'SEC', text: '<script>alert("xss")</script>', check: null },
  ];

  const html = renderRulesTableHtml(sampleRules);
  assert.match(html, /id="rulebookTable"/);
  assert.match(html, /<th>Rule ID<\/th>/);
  assert.match(html, /<th>Area<\/th>/);
  assert.match(html, /<th>Rule Text<\/th>/);
  assert.match(html, /<th>Check<\/th>/);
  assert.match(html, /<strong>GOV-01<\/strong>/);
  assert.match(html, /class="badge badge-cli">GOV<\/span>/);
  assert.match(html, /class="badge badge-model">branch protection<\/span>/);

  // Escaping check
  assert.match(html, /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('renderRulebookOverviewHtml renders overview, notices, district grid, and table', () => {
  const fullData = {
    v: 1,
    error: null,
    handbook: {
      version: '2.0',
      date: '2026-10-17',
      title: 'Modern Age Solutions (MAS) House Rules Handbook',
    },
    rules: [
      { id: 'GOV-01', area: 'GOV', text: 'Every change MUST go through a PR.', check: 'branch protection' },
    ],
    districts: [
      {
        id: 'w1',
        title: 'mastopia',
        cwd: 'C:\\Users\\shaun\\mastopia',
        readable: true,
        files: [{ path: 'CHANGELOG.md', present: true }],
        missing: [],
      },
    ],
  };

  const html = renderRulebookOverviewHtml(fullData);
  assert.match(html, /id="rulebookOverview"/);
  assert.match(html, /District Compliance Overview/);
  assert.match(html, /Modern Age Solutions \(MAS\) House Rules Handbook/);
  assert.match(html, /v2\.0/);
  assert.match(html, /1 district/);
  assert.match(html, /1 rule/);
  assert.match(html, /id="rulebookFilter"/);
  assert.match(html, /GOV-01/);
});

test('renderRulebookOverviewHtml shows handbook missing notice without blanking districts', () => {
  const missingData = {
    v: 1,
    error: 'handbook_missing',
    handbook: null,
    rules: [],
    districts: [
      {
        id: 'w1',
        title: 'mastopia',
        readable: true,
        files: [{ path: 'CHANGELOG.md', present: true }],
        missing: [],
      },
    ],
  };

  const html = renderRulebookOverviewHtml(missingData);
  assert.match(html, /id="handbookMissingNotice"/);
  assert.match(html, /docs\/MAS-House-Rules-Handbook\.md/);
  assert.match(html, /mastopia/);
  assert.match(html, /No house rules loaded/);
});

test('renderRulebookView manages loading, fatal error, and content states', () => {
  const container = { innerHTML: '', querySelector: () => null };

  // 1. Loading state
  renderRulebookView(container, { loading: true });
  assert.match(container.innerHTML, /id="rulebookLoading"/);

  // 2. Fatal error state
  renderRulebookView(container, { error: 'Network failure', data: null });
  assert.match(container.innerHTML, /id="rulebookError"/);
  assert.match(container.innerHTML, /Network failure/);

  // 3. Content state with filter listener binding
  let listenerAttached = false;
  const mockInput = {
    value: '',
    addEventListener: (evt) => {
      if (evt === 'input') listenerAttached = true;
    },
  };
  const mockTableContainer = { innerHTML: '' };
  const mockContainer = {
    innerHTML: '',
    querySelector: (sel) => {
      if (sel === '#rulebookFilter') return mockInput;
      if (sel === '#rulebookTableContainer') return mockTableContainer;
      return null;
    },
  };

  renderRulebookView(mockContainer, {
    data: {
      handbook: { version: '2.0', title: 'Rules' },
      rules: [{ id: 'GOV-01', area: 'GOV', text: 'PR check', check: null }],
      districts: [{ id: 'w1', title: 'd1', readable: true, files: [], missing: [] }],
    },
  });

  assert.match(mockContainer.innerHTML, /id="rulebookOverview"/);
  assert.equal(listenerAttached, true, 'input listener attached for in-place filtering');
});

test('filter value and input element survive a poll when rulebook data is refreshed', () => {
  const mockInput = {
    value: '',
    addEventListener: () => {},
  };
  const mockTableContainer = { innerHTML: '' };
  const mockNotices = { innerHTML: '' };
  const mockDistrictsContainer = { innerHTML: '' };
  const mockDistrictsCount = { textContent: '' };
  const mockRulesCount = { textContent: '' };

  const container = {
    innerHTML: '',
    querySelector: (sel) => {
      if (sel === '#rulebookFilter') return mockInput;
      if (sel === '#rulebookTableContainer') return mockTableContainer;
      if (sel === '#rulebookNotices') return mockNotices;
      if (sel === '#districtsContainer' || sel === '#districtsGrid') return mockDistrictsContainer;
      if (sel === '#districtsCount') return mockDistrictsCount;
      if (sel === '#rulesCount') return mockRulesCount;
      if (sel === '#rulebookOverview') {
        return container.innerHTML.includes('id="rulebookOverview"') ? {} : null;
      }
      return null;
    },
  };

  const initialData = {
    handbook: { version: '2.0', title: 'Rules' },
    rules: [
      { id: 'GOV-01', area: 'GOV', text: 'Rule 1', check: null },
      { id: 'SEC-01', area: 'SEC', text: 'Rule 2', check: null },
    ],
    districts: [{ id: 'w1', title: 'mastopia', readable: true, files: [], missing: [] }],
  };

  // 1. Initial render
  renderRulebookView(container, { data: initialData });
  assert.match(container.innerHTML, /id="rulebookOverview"/);

  // 2. User types into filter input
  mockInput.value = 'SEC-';

  // 3. Next poll tick with new data (new district added)
  const polledData = {
    ...initialData,
    districts: [
      { id: 'w1', title: 'mastopia', readable: true, files: [], missing: [] },
      { id: 'w2', title: 'atlas', readable: true, files: [], missing: [] },
    ],
  };
  renderRulebookView(container, { data: polledData });

  // Filter input value must survive the poll!
  assert.equal(mockInput.value, 'SEC-', 'filter value preserved after poll');
  // Table must filter by the existing input value 'SEC-'
  assert.match(mockTableContainer.innerHTML, /SEC-01/);
  assert.doesNotMatch(mockTableContainer.innerHTML, /GOV-01/);
  // District count must update
  assert.equal(mockDistrictsCount.textContent, '2 districts');
});

test('fetchRulebook calls contract API and handles success and errors', async () => {
  // 1. Missing fetch function
  const missingRes = await fetchRulebook(null);
  assert.equal(missingRes.ok, false);
  assert.equal(missingRes.error, 'fetch is not available');

  // 2. Success 200
  let fetchedUrl = '';
  const mockFetch = async (url) => {
    fetchedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        v: 1,
        error: null,
        handbook: { version: '2.0', title: 'MAS Rules' },
        rules: [{ id: 'GOV-01' }],
        districts: [{ id: 'w1' }],
      }),
    };
  };

  const res = await fetchRulebook(mockFetch);
  assert.equal(res.ok, true);
  assert.equal(fetchedUrl, '/api/rulebook');
  assert.equal(res.rules.length, 1);
  assert.equal(res.districts.length, 1);

  // 3. HTTP 500 error
  const mock500 = async () => ({ ok: false, status: 500 });
  const errRes = await fetchRulebook(mock500);
  assert.equal(errRes.ok, false);
  assert.equal(errRes.error, 'HTTP 500');

  // 4. Network error
  const mockFail = async () => {
    throw new Error('Connection refused');
  };
  const failRes = await fetchRulebook(mockFail);
  assert.equal(failRes.ok, false);
  assert.equal(failRes.error, 'Connection refused');
});
