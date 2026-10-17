// Module: test/console-ui.test.js
// Purpose: Unit and integration tests for P1 console UI routing, shell, and lifecycle
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import {
  VALID_TABS,
  DEFAULT_TAB,
  POLL_INTERVAL_ACTIVE_MS,
  POLL_INTERVAL_HIDDEN_MS,
  parseHash,
  parseRoute,
  getPollInterval,
} from '../page/src/console-router.js';

test('console-router parses valid and fallback hash routes', () => {
  assert.equal(DEFAULT_TAB, 'sessions');
  assert.deepEqual(VALID_TABS, ['sessions', 'screen', 'logs', 'rulebook', 'ops-desk']);

  const empty = parseHash('');
  assert.equal(empty.tab, 'sessions');

  const defaultHash = parseHash('#');
  assert.equal(defaultHash.tab, 'sessions');

  const sessions = parseHash('#sessions');
  assert.equal(sessions.tab, 'sessions');

  const logs = parseHash('#logs');
  assert.equal(logs.tab, 'logs');

  const invalid = parseHash('#nonexistent');
  assert.equal(invalid.tab, 'sessions');
});

test('console-router parses hash query parameters', () => {
  const screen = parseHash('#screen?paneId=w8:p1');
  assert.equal(screen.tab, 'screen');
  assert.equal(screen.params.get('paneId'), 'w8:p1');

  const withSlash = parseHash('#/ops-desk?filter=urgent');
  assert.equal(withSlash.tab, 'ops-desk');
  assert.equal(withSlash.params.get('filter'), 'urgent');
});

test('console-router distinguishes city view from console dashboard', () => {
  const city = parseRoute('/', '');
  assert.equal(city.view, 'city');
  assert.equal(city.tab, 'sessions');

  const consoleRoot = parseRoute('/console', '');
  assert.equal(consoleRoot.view, 'console');
  assert.equal(consoleRoot.tab, 'sessions');

  const consoleLogs = parseRoute('/console', '#logs');
  assert.equal(consoleLogs.view, 'console');
  assert.equal(consoleLogs.tab, 'logs');
});

test('console-router sets active and hidden polling intervals', () => {
  assert.equal(getPollInterval(false), POLL_INTERVAL_ACTIVE_MS);
  assert.equal(getPollInterval(false), 2000);

  assert.equal(getPollInterval(true), POLL_INTERVAL_HIDDEN_MS);
  assert.equal(getPollInterval(true), 10000);
});

test('server serves 3D city on / and console dashboard on /console', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
  const { port } = server.raw.address();

  const cityRes = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(cityRes.status, 200);
  const cityHtml = await cityRes.text();
  assert.match(cityHtml, /id="stage"/);
  assert.match(cityHtml, /id="btnGoConsole"/);
  assert.match(cityHtml, /href="\/console"/);

  const consoleRes = await fetch(`http://127.0.0.1:${port}/console`);
  assert.equal(consoleRes.status, 200);
  const consoleHtml = await consoleRes.text();
  assert.match(consoleHtml, /id="consoleShell"/);
  assert.match(consoleHtml, /id="consoleModeBadge"/);
  assert.match(consoleHtml, /id="btnConsoleRefresh"/);
  assert.match(consoleHtml, /id="btnSwitchToCity"/);
  assert.match(consoleHtml, /id="tab-sessions"/);
  assert.match(consoleHtml, /id="tab-screen"/);
  assert.match(consoleHtml, /id="tab-logs"/);
  assert.match(consoleHtml, /id="tab-rulebook"/);
  assert.match(consoleHtml, /id="tab-ops-desk"/);
  assert.doesNotMatch(consoleHtml, /__MASTOPIA_TOKEN__/);

  await adapter.stop();
  await server.close();
});
