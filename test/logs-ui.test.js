// Module: test/logs-ui.test.js
// Purpose: Unit tests for U5 event logs view rendering, ring buffer telemetry, filtering, and fetch contract
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimestampMs,
  getEventTypeBadgeHtml,
  renderLogEventRowHtml,
  filterLogEvents,
  renderLogsListHtml,
  renderLogsOverviewHtml,
  renderLogsView,
  fetchLogs,
} from '../page/src/logs-view.js';

test('formatTimestampMs formats millisecond timestamps with millisecond precision', () => {
  const ts = 1760700000123;
  const formatted = formatTimestampMs(ts);
  assert.match(formatted, /^\d{2}:\d{2}:\d{2}\.123$/);
  assert.equal(formatTimestampMs(null), '-');
  assert.equal(formatTimestampMs(NaN), '-');
});

test('getEventTypeBadgeHtml renders color-coded badges matching event types', () => {
  assert.match(getEventTypeBadgeHtml('needs_you'), /class="badge badge-wait">needs_you<\/span>/);
  assert.match(getEventTypeBadgeHtml('status_change'), /class="badge badge-cli">status_change<\/span>/);
  assert.match(getEventTypeBadgeHtml('needs_you_cleared'), /class="badge badge-live">needs_you_cleared<\/span>/);
  assert.match(getEventTypeBadgeHtml('error'), /class="badge badge-error">error<\/span>/);
  assert.match(getEventTypeBadgeHtml('adapter_error'), /class="badge badge-error">adapter_error<\/span>/);
});

test('renderLogEventRowHtml renders all contract fields, transitions, and escapes text', () => {
  const event = {
    type: 'status_change',
    paneId: 'w8:p1',
    districtId: 'w8',
    districtTitle: 'atlas-api',
    name: 'grok-api',
    fromStatus: 'working',
    toStatus: 'blocked',
    text: '<script>alert("secret")</script> and normal activity',
    ts: 1760700000456,
  };

  const html = renderLogEventRowHtml(event);
  assert.match(html, /log-type-status_change/);
  assert.match(html, /w8:p1/);
  assert.match(html, /<strong>grok-api<\/strong>/);
  assert.match(html, /atlas-api/);
  assert.match(html, /working &rarr; blocked/);
  assert.match(html, /\.456/);

  // Escaping check
  assert.match(html, /&lt;script&gt;alert\(&quot;secret&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('filterLogEvents filters by event type and search keyword', () => {
  const events = [
    { type: 'status_change', paneId: 'w1:p1', name: 'alpha', text: 'starting' },
    { type: 'needs_you', paneId: 'w8:p1', name: 'grok-api', text: 'Allow push?' },
    { type: 'needs_you_cleared', paneId: 'w8:p1', name: 'grok-api', text: 'Push allowed' },
    { type: 'error', paneId: 'w2:p1', name: 'worker', text: 'Disk full' },
  ];

  // Filter by type
  const typeFiltered = filterLogEvents(events, { type: 'needs_you' });
  assert.equal(typeFiltered.length, 1);
  assert.equal(typeFiltered[0].type, 'needs_you');

  // Filter by search query across pane / name / text
  const queryFiltered = filterLogEvents(events, { query: 'grok-api' });
  assert.equal(queryFiltered.length, 2);

  const textFiltered = filterLogEvents(events, { query: 'Disk full' });
  assert.equal(textFiltered.length, 1);
  assert.equal(textFiltered[0].paneId, 'w2:p1');

  // Combined type and query
  const combined = filterLogEvents(events, { type: 'needs_you', query: 'Push' });
  assert.equal(combined.length, 1);

  // Blank filter returns all
  assert.equal(filterLogEvents(events, { type: 'all', query: '' }).length, 4);
});

test('renderLogsListHtml renders empty and populated list states', () => {
  // Empty buffer
  const emptyHtml = renderLogsListHtml([]);
  assert.match(emptyHtml, /id="logsEmpty"/);
  assert.match(emptyHtml, /No log events recorded in buffer\./);

  // Filter mismatch
  const mismatchHtml = renderLogsListHtml([{ type: 'error', text: 'failed' }], { type: 'needs_you' });
  assert.match(mismatchHtml, /id="logsFilteredEmpty"/);
  assert.match(mismatchHtml, /No log events matching filters\./);

  // Populated list
  const populatedHtml = renderLogsListHtml([{ type: 'status_change', paneId: 'w1:p1', ts: 1760700000000 }]);
  assert.match(populatedHtml, /id="logsListContainer"/);
  assert.match(populatedHtml, /w1:p1/);
});

test('renderLogsOverviewHtml renders ring buffer limits telemetry and filter bar', () => {
  const data = {
    v: 1,
    generatedAt: 1760700000000,
    bounded: {
      count: 42,
      chars: 8400,
      maxEvents: 500,
      maxChars: 262144,
    },
    events: [
      { type: 'needs_you', paneId: 'w8:p1', text: 'Approval needed' },
    ],
  };

  const html = renderLogsOverviewHtml(data);
  assert.match(html, /id="logsOverview"/);
  assert.match(html, /42<\/strong> \/ 500 events/);
  assert.match(html, /8,400<\/strong> \/ 262,144 characters/);
  assert.match(html, /id="logsTypeFilter"/);
  assert.match(html, /id="logsSearchInput"/);
  assert.match(html, /Approval needed/);
});

test('renderLogsOverviewHtml displays adapter notice banner without blanking list', () => {
  const data = {
    v: 1,
    bounded: { count: 1, chars: 100 },
    events: [{ type: 'status_change', paneId: 'w1:p1', text: 'running' }],
  };

  const html = renderLogsOverviewHtml(data, { adapterError: 'herdr connection timeout' });
  assert.match(html, /id="logsAdapterNotice"/);
  assert.match(html, /herdr connection timeout/);
  assert.match(html, /w1:p1/);
});

test('renderLogsView manages loading, fatal error, and content states with event binding', () => {
  const container = { innerHTML: '', querySelector: () => null };

  // 1. Loading state
  renderLogsView(container, { loading: true });
  assert.match(container.innerHTML, /id="logsLoading"/);

  // 2. Fatal error state
  renderLogsView(container, { error: 'Failed to fetch', data: null });
  assert.match(container.innerHTML, /id="logsError"/);
  assert.match(container.innerHTML, /Failed to fetch/);

  // 3. Content state with select and input binding
  let changeBound = false;
  let inputBound = false;
  const mockSelect = {
    value: 'all',
    addEventListener: (evt) => {
      if (evt === 'change') changeBound = true;
    },
  };
  const mockInput = {
    value: '',
    addEventListener: (evt) => {
      if (evt === 'input') inputBound = true;
    },
  };
  const mockListWrap = { innerHTML: '' };
  const mockContainer = {
    innerHTML: '',
    querySelector: (sel) => {
      if (sel === '#logsTypeFilter') return mockSelect;
      if (sel === '#logsSearchInput') return mockInput;
      if (sel === '#logsListWrap') return mockListWrap;
      return null;
    },
  };

  renderLogsView(mockContainer, {
    data: {
      bounded: { count: 2, chars: 400 },
      events: [{ type: 'status_change', paneId: 'w1:p1', text: 'tick' }],
    },
  });

  assert.match(mockContainer.innerHTML, /id="logsOverview"/);
  assert.equal(changeBound, true, 'change listener bound to type filter');
  assert.equal(inputBound, true, 'input listener bound to search filter');
});

test('filter select and input elements survive a poll when logs data is refreshed', () => {
  const mockSelect = {
    value: 'status_change',
    addEventListener: () => {},
  };
  const mockInput = {
    value: 'login',
    addEventListener: () => {},
  };
  const mockListWrap = { innerHTML: '' };
  const mockNotices = { innerHTML: '' };

  const container = {
    innerHTML: '',
    querySelector: (sel) => {
      if (sel === '#logsTypeFilter') return mockSelect;
      if (sel === '#logsSearchInput') return mockInput;
      if (sel === '#logsListWrap') return mockListWrap;
      if (sel === '#logsNotices') return mockNotices;
      if (sel === '#logsOverview') {
        return container.innerHTML.includes('id="logsOverview"') ? {} : null;
      }
      return null;
    },
  };

  const initialData = {
    bounded: { count: 2, chars: 200 },
    events: [
      { type: 'status_change', paneId: 'w1:p1', text: 'login successful' },
      { type: 'needs_you', paneId: 'w8:p1', text: 'prompt' },
    ],
  };

  // 1. Initial render
  renderLogsView(container, { data: initialData });
  assert.match(container.innerHTML, /id="logsOverview"/);

  // 2. User sets filter controls
  mockSelect.value = 'status_change';
  mockInput.value = 'login';

  // 3. Next poll with updated data
  const polledData = {
    bounded: { count: 3, chars: 300 },
    events: [
      { type: 'status_change', paneId: 'w2:p1', text: 'login failed' },
      { type: 'status_change', paneId: 'w1:p1', text: 'login successful' },
      { type: 'needs_you', paneId: 'w8:p1', text: 'prompt' },
    ],
  };
  renderLogsView(container, { data: polledData });

  // Filter select and input values must survive the poll!
  assert.equal(mockSelect.value, 'status_change', 'type filter preserved after poll');
  assert.equal(mockInput.value, 'login', 'search filter preserved after poll');

  // List wrap must update with the filtered results
  assert.match(mockListWrap.innerHTML, /login failed/);
  assert.match(mockListWrap.innerHTML, /login successful/);
  assert.doesNotMatch(mockListWrap.innerHTML, /prompt/);
});

test('fetchLogs queries API endpoint and parses response data and errors', async () => {
  // 1. Missing fetch function
  const missingRes = await fetchLogs(null);
  assert.equal(missingRes.ok, false);
  assert.equal(missingRes.error, 'fetch is not available');

  // 2. Success 200
  let queriedUrl = '';
  const mockFetch = async (url) => {
    queriedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        v: 1,
        bounded: { count: 5, chars: 1000 },
        events: [{ type: 'status_change', paneId: 'w1:p1' }],
      }),
    };
  };

  const res = await fetchLogs(mockFetch, { limit: 50 });
  assert.equal(res.ok, true);
  assert.equal(queriedUrl, '/api/logs?limit=50');
  assert.equal(res.events.length, 1);
  assert.equal(res.bounded.count, 5);

  // 3. HTTP 400 error
  const mock400 = async () => ({ ok: false, status: 400 });
  const badRes = await fetchLogs(mock400);
  assert.equal(badRes.ok, false);
  assert.equal(badRes.status, 400);
  assert.equal(badRes.error, 'HTTP 400');

  // 4. Network error
  const mockFail = async () => {
    throw new Error('Socket timeout');
  };
  const failRes = await fetchLogs(mockFail);
  assert.equal(failRes.ok, false);
  assert.equal(failRes.error, 'Socket timeout');
});
