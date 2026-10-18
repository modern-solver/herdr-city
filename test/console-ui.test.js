// Module: test/console-ui.test.js
// Purpose: Unit and integration tests for P1 console UI routing, shell, and lifecycle
// Maintainer: builder-gemini

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
  closeCityConsolePanel,
  renderTabPanel,
  setViewVisibility,
  updateConsoleTimestamp,
  createPollingManager,
} from '../page/src/console-router.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function createDocStub() {
  const elements = new Map();
  const getOrCreate = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        hidden: false,
        dataset: {},
        style: {},
        classList: {
          _classes: new Set(),
          toggle(cls, force) {
            if (force) this._classes.add(cls);
            else this._classes.delete(cls);
          },
          contains(cls) {
            return this._classes.has(cls);
          },
        },
        attrs: {},
        setAttribute(k, v) {
          this.attrs[k] = String(v);
        },
        getAttribute(k) {
          return this.attrs[k];
        },
      });
    }
    return elements.get(id);
  };

  const hud = { style: {} };
  const foot = { style: {} };

  return {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => {
      if (sel === '.hud') return hud;
      if (sel === '.foot') return foot;
      return null;
    },
    elements,
    hud,
    foot,
  };
}

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

test('console-router distinguishes city view from console dashboard with exact route match', () => {
  const city = parseRoute('/', '');
  assert.equal(city.view, 'city');
  assert.equal(city.tab, 'sessions');

  const consoleRoot = parseRoute('/console', '');
  assert.equal(consoleRoot.view, 'console');
  assert.equal(consoleRoot.tab, 'sessions');

  const consoleLogs = parseRoute('/console', '#logs');
  assert.equal(consoleLogs.view, 'console');
  assert.equal(consoleLogs.tab, 'logs');

  const nearMatch = parseRoute('/consoles', '');
  assert.equal(nearMatch.view, 'city');
});

test('console-router sets active and hidden polling intervals', () => {
  assert.equal(getPollInterval(false), POLL_INTERVAL_ACTIVE_MS);
  assert.equal(getPollInterval(false), 2000);

  assert.equal(getPollInterval(true), POLL_INTERVAL_HIDDEN_MS);
  assert.equal(getPollInterval(true), 10000);
});

test('tab switching manages aria-selected, class and panel hidden state', () => {
  const doc = createDocStub();

  renderTabPanel('logs', doc);
  assert.equal(doc.getElementById('tab-logs').getAttribute('aria-selected'), 'true');
  assert.equal(doc.getElementById('tab-logs').classList.contains('active'), true);
  assert.equal(doc.getElementById('view-logs').hidden, false);
  assert.equal(doc.getElementById('tab-sessions').getAttribute('aria-selected'), 'false');
  assert.equal(doc.getElementById('tab-sessions').classList.contains('active'), false);
  assert.equal(doc.getElementById('view-sessions').hidden, true);

  renderTabPanel('screen', doc);
  assert.equal(doc.getElementById('tab-screen').getAttribute('aria-selected'), 'true');
  assert.equal(doc.getElementById('view-screen').hidden, false);
  assert.equal(doc.getElementById('view-logs').hidden, true);

  const fallback = renderTabPanel('unknown-tab', doc);
  assert.equal(fallback, 'sessions');
  assert.equal(doc.getElementById('tab-sessions').getAttribute('aria-selected'), 'true');
  assert.equal(doc.getElementById('view-sessions').hidden, false);
});

test('closeCityConsolePanel sets dataset.open to false on P0 console', () => {
  const doc = createDocStub();
  const p0 = doc.getElementById('console');
  p0.dataset.open = 'true';

  closeCityConsolePanel(doc);
  assert.equal(p0.dataset.open, 'false');
});

test('setViewVisibility toggles console shell, city elements, and closes P0 panel', () => {
  const doc = createDocStub();
  const p0 = doc.getElementById('console');
  p0.dataset.open = 'true';

  setViewVisibility(true, doc);
  assert.equal(doc.getElementById('consoleShell').hidden, false);
  assert.equal(doc.getElementById('stage').style.display, 'none');
  assert.equal(doc.getElementById('reelHud').style.display, 'none');
  assert.equal(doc.hud.style.display, 'none');
  assert.equal(doc.foot.style.display, 'none');
  assert.equal(p0.dataset.open, 'false');

  setViewVisibility(false, doc);
  assert.equal(doc.getElementById('consoleShell').hidden, true);
  assert.equal(doc.getElementById('stage').style.display, '');
  assert.equal(doc.getElementById('reelHud').style.display, '');
  assert.equal(doc.hud.style.display, '');
  assert.equal(doc.foot.style.display, '');
});

test('updateConsoleTimestamp sets text content on timestamp element', () => {
  const doc = createDocStub();
  updateConsoleTimestamp(doc, 'No data yet');
  assert.equal(doc.getElementById('consoleLastUpdated').textContent, 'No data yet');
});

test('createPollingManager starts, handles visibility changes, and stops', () => {
  let tickCount = 0;
  let isHidden = false;

  const poller = createPollingManager({
    onTick: () => {
      tickCount++;
    },
    isHiddenFn: () => isHidden,
    activeMs: 2000,
    hiddenMs: 10000,
  });

  assert.equal(poller.isRunning(), false);

  const initialInterval = poller.start();
  assert.equal(initialInterval, 2000);
  assert.equal(poller.getInterval(), 2000);
  assert.equal(poller.isRunning(), true);
  assert.equal(tickCount, 1);

  isHidden = true;
  const hiddenInterval = poller.onVisibilityChange();
  assert.equal(hiddenInterval, 10000);
  assert.equal(poller.getInterval(), 10000);
  assert.equal(poller.isRunning(), true);

  poller.stop();
  assert.equal(poller.isRunning(), false);
  assert.equal(poller.getInterval(), null);
});

test('built web/index.html retains prefers-reduced-motion media query', () => {
  const htmlPath = path.join(here, '..', 'web', 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');

  assert.match(content, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(content, /animation-duration:\s*\.01ms\s*!important/);
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
