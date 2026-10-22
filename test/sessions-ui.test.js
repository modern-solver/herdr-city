// Module: test/sessions-ui.test.js
// Purpose: Unit tests for U2 sessions list view rendering, table construction, and API contract consumption
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  formatRelativeTime,
  getStatusBadgeHtml,
  truncateString,
  renderSessionRow,
  renderSessionsTableHtml,
  renderSessionsView,
  fetchSessions,
} from '../page/src/sessions-view.js';
import { VALID_MODES } from '../page/src/console-router.js';

test('VALID_MODES includes live, fixture, and demo', () => {
  assert.deepEqual(VALID_MODES, ['live', 'fixture', 'demo']);
});

test('escapeHtml escapes HTML special characters to prevent XSS (leak rule)', () => {
  assert.equal(
    escapeHtml('<script>"foo" & \'bar\'</script>'),
    '&lt;script&gt;&quot;foo&quot; &amp; &#39;bar&#39;&lt;/script&gt;',
  );
  assert.equal(escapeHtml(null), '');
});

test('formatRelativeTime formats durations accurately', () => {
  const base = 1000000000;
  assert.equal(formatRelativeTime(null), '-');
  assert.equal(formatRelativeTime(0), '-');
  assert.equal(formatRelativeTime(base, base + 2000), 'just now');
  assert.equal(formatRelativeTime(base, base + 45000), '45s ago');
  assert.equal(formatRelativeTime(base, base + 300000), '5m ago');
  assert.equal(formatRelativeTime(base, base + 7200000), '2h ago');
  assert.equal(formatRelativeTime(base, base + 172800000), '2d ago');
});

test('truncateString caps string length with ellipsis', () => {
  assert.equal(truncateString(null), '-');
  assert.equal(truncateString(''), '-');
  assert.equal(truncateString('short', 10), 'short');
  assert.equal(truncateString('this is a very long string that should truncate', 20), 'this is a very lo…');
});

test('getStatusBadgeHtml renders appropriate classes and attributes', () => {
  const workingBadge = getStatusBadgeHtml('working', 'Working');
  assert.match(workingBadge, /class="badge badge-status status-working"/);
  assert.match(workingBadge, />Working</);

  const idleBadge = getStatusBadgeHtml('idle', 'Idle');
  assert.match(idleBadge, /class="badge badge-status status-idle"/);
  assert.match(idleBadge, />Idle</);

  const blockedBadge = getStatusBadgeHtml('blocked', 'Needs you', 'Allow file edit?');
  assert.match(blockedBadge, /class="badge badge-status status-blocked"/);
  assert.match(blockedBadge, /title="Allow file edit\?"/);
  assert.match(blockedBadge, /class="status-dot alert"/);
  assert.match(blockedBadge, />Needs you</);
});

test('renderSessionRow generates complete table row with all contract fields', () => {
  const sample = {
    id: 'w8:p1',
    paneId: 'w8:p1',
    districtId: 'w8',
    districtTitle: 'atlas-api',
    name: 'grok-api',
    cli: 'grok',
    model: 'grok-4',
    status: 'blocked',
    statusLabel: 'Needs you',
    cwd: 'C:\\Users\\Shaunak\\src\\atlas-api',
    lastSeenAt: 1760700000000,
    activity: 'Allow this action?',
    prompt: 'Allow this action?',
    error: null,
  };

  const rowHtml = renderSessionRow(sample);
  assert.match(rowHtml, /data-pane-id="w8:p1"/);
  assert.match(rowHtml, /atlas-api/);
  assert.match(rowHtml, /<small class="sub-id">w8<\/small>/);
  assert.match(rowHtml, /<strong>grok-api<\/strong>/);
  assert.match(rowHtml, /class="badge badge-cli">grok<\/span>/);
  assert.match(rowHtml, /class="badge badge-model">grok-4<\/span>/);
  assert.match(rowHtml, /class="badge badge-status status-blocked"/);
  assert.match(rowHtml, /href="#screen\?paneId=w8%3Ap1"/);
  assert.match(rowHtml, /class="btn-inspect"/);
});

test('renderSessionsTableHtml handles empty array and populates headers', () => {
  const emptyHtml = renderSessionsTableHtml([]);
  assert.match(emptyHtml, /id="sessionsEmpty"/);
  assert.match(emptyHtml, /No agent sessions found matching current filters\./);

  const tableHtml = renderSessionsTableHtml([
    {
      id: 'w1:p1',
      paneId: 'w1:p1',
      districtTitle: 'dist1',
      name: 'bot1',
      cli: 'claude',
      model: 'claude-3-5',
      status: 'idle',
      cwd: '/tmp',
      lastSeenAt: 1000,
      activity: 'idle',
    },
  ]);
  assert.match(tableHtml, /id="sessionsTable"/);
  assert.match(tableHtml, /<th scope="col">District<\/th>/);
  assert.match(tableHtml, /<th scope="col">CLI &amp; Model<\/th>/);
  assert.match(tableHtml, /<th scope="col">Status<\/th>/);
  assert.match(tableHtml, /<th scope="col">Action<\/th>/);
  assert.match(tableHtml, /data-pane-id="w1:p1"/);
});

test('renderSessionsView manages loading, error, and content states in container', () => {
  const container = { innerHTML: '' };

  renderSessionsView(container, { loading: true });
  assert.match(container.innerHTML, /id="sessionsLoading"/);

  renderSessionsView(container, { error: 'Failed to connect to herdr' });
  assert.match(container.innerHTML, /id="sessionsError"/);
  assert.match(container.innerHTML, /Failed to load sessions from server: Failed to connect to herdr/);

  renderSessionsView(container, {
    sessions: [
      {
        id: 'w2:p1',
        paneId: 'w2:p1',
        districtTitle: 'dist2',
        name: 'bot2',
        cli: 'gemini',
        model: 'flash',
        status: 'working',
        cwd: '/repo',
        lastSeenAt: 5000,
        activity: 'running tests',
      },
    ],
  });
  assert.match(container.innerHTML, /id="sessionsTable"/);
  assert.match(container.innerHTML, /data-pane-id="w2:p1"/);
});

test('fetchSessions queries API contract and parses response data', async () => {
  const mockPayload = {
    v: 1,
    generatedAt: 1760700000000,
    mode: 'fixture',
    error: null,
    filters: { district: null, cli: null, model: null, status: null, q: null },
    sessions: [
      {
        id: 'w8:p1',
        paneId: 'w8:p1',
        districtId: 'w8',
        districtTitle: 'atlas-api',
        name: 'grok-api',
        cli: 'grok',
        model: 'grok-4',
        status: 'blocked',
        statusLabel: 'Needs you',
        cwd: 'C:\\Users\\Shaunak\\src\\atlas-api',
        lastSeenAt: 1760700000000,
        activity: 'Allow this action?',
        prompt: 'Allow this action?',
        error: null,
      },
    ],
  };

  let requestedUrl = '';
  const mockFetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => mockPayload,
    };
  };

  const res = await fetchSessions(mockFetch, { status: 'blocked', cli: 'grok' });
  assert.equal(res.ok, true);
  assert.equal(res.sessions.length, 1);
  assert.equal(res.sessions[0].name, 'grok-api');
  assert.equal(requestedUrl, '/api/sessions?status=blocked&cli=grok');
});

test('fetchSessions handles HTTP error and network failures gracefully', async () => {
  const httpErrorFetch = async () => ({
    ok: false,
    status: 503,
  });

  const httpRes = await fetchSessions(httpErrorFetch);
  assert.equal(httpRes.ok, false);
  assert.equal(httpRes.error, 'HTTP 503');
  assert.deepEqual(httpRes.sessions, []);

  const networkErrorFetch = async () => {
    throw new Error('Connection refused');
  };

  const netRes = await fetchSessions(networkErrorFetch);
  assert.equal(netRes.ok, false);
  assert.equal(netRes.error, 'Connection refused');
  assert.deepEqual(netRes.sessions, []);
});

test('fetchSessions preserves succeeded sessions and extracts adapterError when data.error present', async () => {
  const mockPayload = {
    v: 1,
    generatedAt: 1760700000000,
    mode: 'fixture',
    error: 'herdr agent list timeout for district w9',
    filters: { district: null, cli: null, model: null, status: null, q: null },
    sessions: [
      {
        id: 'w8:p1',
        paneId: 'w8:p1',
        districtId: 'w8',
        districtTitle: 'atlas-api',
        name: 'grok-api',
        cli: 'grok',
        model: 'grok-4',
        status: 'working',
        cwd: 'C:\\Users\\Shaunak\\src\\atlas-api',
        lastSeenAt: 1760700000000,
        activity: 'building',
      },
    ],
  };

  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => mockPayload,
  });

  const res = await fetchSessions(mockFetch);
  assert.equal(res.ok, true);
  assert.equal(res.sessions.length, 1);
  assert.equal(res.sessions[0].name, 'grok-api');
  assert.equal(res.adapterError, 'herdr agent list timeout for district w9');
});

test('renderSessionsTableHtml renders succeeded rows and inline error row for adapter notice', () => {
  const sessions = [
    {
      id: 'w8:p1',
      paneId: 'w8:p1',
      districtTitle: 'atlas-api',
      name: 'grok-api',
      cli: 'grok',
      model: 'grok-4',
      status: 'working',
      cwd: '/src/atlas-api',
      lastSeenAt: 1760700000000,
      activity: 'running',
    },
  ];

  const html = renderSessionsTableHtml(sessions, {
    adapterError: 'District w9 unreachable: connection refused',
  });

  // Table must not be blanked
  assert.match(html, /id="sessionsTable"/);
  assert.match(html, /data-pane-id="w8:p1"/);
  assert.match(html, /<strong>grok-api<\/strong>/);
  // Inline error row present
  assert.match(html, /id="rowAdapterError"/);
  assert.match(html, /class="adapter-error-text">District w9 unreachable: connection refused<\/span>/);
});

test('renderSessionRow renders an inline error row for a failed source entry', () => {
  const failedSource = {
    districtId: 'w9',
    districtTitle: 'atlas-worker',
    error: 'Failed to inspect agent process: exit 1',
  };

  const rowHtml = renderSessionRow(failedSource);
  assert.match(rowHtml, /class="row-source-error"/);
  assert.match(rowHtml, /data-source="w9"/);
  assert.match(rowHtml, /atlas-worker/);
  assert.match(rowHtml, /class="badge badge-error">Source error<\/span>/);
  assert.match(rowHtml, /Failed to inspect agent process: exit 1/);
});

test('renderSessionsView renders adapter notice banner and table without blanking', () => {
  const container = { innerHTML: '' };
  const sessions = [
    {
      id: 'w1:p1',
      paneId: 'w1:p1',
      districtTitle: 'dist1',
      name: 'bot1',
      cli: 'claude',
      model: 'claude-3-5',
      status: 'idle',
      cwd: '/tmp',
      lastSeenAt: 1000,
      activity: 'idle',
    },
  ];

  renderSessionsView(container, {
    sessions,
    adapterError: 'Adapter warning: partial scan',
  });

  // Notice banner present
  assert.match(container.innerHTML, /id="sessionsAdapterNotice"/);
  assert.match(container.innerHTML, /Adapter warning: partial scan/);
  // Table and rows intact
  assert.match(container.innerHTML, /id="sessionsTable"/);
  assert.match(container.innerHTML, /data-pane-id="w1:p1"/);
  assert.match(container.innerHTML, /id="rowAdapterError"/);
  // Must NOT display fatal error container
  assert.doesNotMatch(container.innerHTML, /id="sessionsError"/);
});
