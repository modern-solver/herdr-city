// Module: test/ops-desk-ui.test.js
// Purpose: Unit tests for U6 ops desk queue view rendering, card layout, wait timers, and API contract consumption
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatWaitDuration,
  renderOpsDeskCardHtml,
  renderOpsDeskQueueHtml,
  renderOpsDeskView,
  fetchOpsDesk,
} from '../page/src/ops-desk-view.js';

test('formatWaitDuration formats milliseconds into human readable durations', () => {
  assert.equal(formatWaitDuration(null), 'Waiting <1s');
  assert.equal(formatWaitDuration(0), 'Waiting <1s');
  assert.equal(formatWaitDuration(800), 'Waiting <1s');
  assert.equal(formatWaitDuration(15000), 'Waiting 15s');
  assert.equal(formatWaitDuration(204000), 'Waiting 3m 24s');
  assert.equal(formatWaitDuration(8100000), 'Waiting 2h 15m');
});

test('renderOpsDeskCardHtml renders all contract fields, badges, and inspect link', () => {
  const item = {
    id: 'w8:p1:21',
    paneId: 'w8:p1',
    districtId: 'w8',
    districtTitle: 'atlas-api',
    name: 'grok-api',
    cli: 'grok',
    model: 'grok-4',
    prompt: 'Allow git push to production?',
    since: 1760699990000,
    waitMs: 120000,
    recommendation: null,
  };

  const html = renderOpsDeskCardHtml(item);
  assert.match(html, /data-pane-id="w8:p1"/);
  assert.match(html, /<strong>grok-api<\/strong>/);
  assert.match(html, /<small class="sub-id">w8:p1<\/small>/);
  assert.match(html, /class="badge badge-cli">grok<\/span>/);
  assert.match(html, /class="badge badge-model">grok-4<\/span>/);
  assert.match(html, /atlas-api/);
  assert.match(html, /<small class="sub-id">w8<\/small>/);
  assert.match(html, /class="badge badge-wait">Waiting 2m 0s<\/span>/);
  assert.match(html, /Allow git push to production\?/);
  assert.match(html, /Recommendation: null \(P1 placeholder\)/);
  assert.match(html, /href="#screen\?paneId=w8%3Ap1"/);
  assert.match(html, /Inspect Pane Screen/);
});

test('renderOpsDeskCardHtml renders an inline error card for failed source', () => {
  const failedSource = {
    districtId: 'w9',
    districtTitle: 'atlas-worker',
    error: 'Failed to inspect agent blocked state',
  };

  const html = renderOpsDeskCardHtml(failedSource);
  assert.match(html, /class="ops-card ops-card-error"/);
  assert.match(html, /data-source="w9"/);
  assert.match(html, /atlas-worker/);
  assert.match(html, /class="badge badge-error">Source Error<\/span>/);
  assert.match(html, /Failed to inspect agent blocked state/);
});

test('renderOpsDeskQueueHtml sorts cards by since ascending and shows header banner', () => {
  const items = [
    {
      id: 'w1:p1:1',
      paneId: 'w1:p1',
      name: 'bot-newer',
      prompt: 'Newer prompt',
      since: 200000,
      waitMs: 5000,
    },
    {
      id: 'w2:p1:2',
      paneId: 'w2:p1',
      name: 'bot-older',
      prompt: 'Older prompt',
      since: 100000,
      waitMs: 105000,
    },
  ];

  const html = renderOpsDeskQueueHtml(items);
  assert.match(html, /id="opsHeaderBanner"/);
  assert.match(html, /City Hall Ops Desk — Display Only \(P1\)/);

  // Verify older prompt (smaller since timestamp) appears before newer prompt in output
  const olderIndex = html.indexOf('bot-older');
  const newerIndex = html.indexOf('bot-newer');
  assert.ok(olderIndex !== -1);
  assert.ok(newerIndex !== -1);
  assert.ok(olderIndex < newerIndex, 'Older blocked prompt must appear first in queue');
});

test('renderOpsDeskQueueHtml renders empty banner when queue is clear', () => {
  const html = renderOpsDeskQueueHtml([]);
  assert.match(html, /id="opsHeaderBanner"/);
  assert.match(html, /id="opsEmpty"/);
  assert.match(html, /All agent queues clear\. No items require attention\./);
});

test('renderOpsDeskQueueHtml renders adapter notice without blanking queue items', () => {
  const items = [
    {
      id: 'w1:p1:1',
      paneId: 'w1:p1',
      name: 'bot-active',
      prompt: 'Action prompt',
      since: 1000,
      waitMs: 2000,
    },
  ];

  const html = renderOpsDeskQueueHtml(items, {
    adapterError: 'Adapter poll warning: district w9 offline',
  });

  assert.match(html, /id="opsHeaderBanner"/);
  assert.match(html, /id="opsAdapterNotice"/);
  assert.match(html, /Adapter poll warning: district w9 offline/);
  assert.match(html, /bot-active/);
  assert.match(html, /Action prompt/);
});

test('renderOpsDeskView manages loading, fatal error, and content states', () => {
  const container = { innerHTML: '' };

  // 1. Loading
  renderOpsDeskView(container, { loading: true });
  assert.match(container.innerHTML, /id="opsLoading"/);

  // 2. Fatal error
  renderOpsDeskView(container, { error: 'Network timeout', items: null });
  assert.match(container.innerHTML, /id="opsError"/);
  assert.match(container.innerHTML, /Failed to load ops desk from server: Network timeout/);

  // 3. Content with items
  renderOpsDeskView(container, {
    items: [
      {
        paneId: 'w3:p1',
        name: 'claude-agent',
        prompt: 'Run test?',
        since: 500,
        waitMs: 1000,
      },
    ],
  });
  assert.match(container.innerHTML, /id="opsHeaderBanner"/);
  assert.match(container.innerHTML, /claude-agent/);
  assert.match(container.innerHTML, /Run test\?/);
});

test('fetchOpsDesk issues API call, parses response, and handles failures', async () => {
  const mockPayload = {
    v: 1,
    generatedAt: 1760700000000,
    error: null,
    items: [
      {
        id: 'w8:p1:21',
        paneId: 'w8:p1',
        name: 'grok-api',
        prompt: 'Allow action?',
        since: 1760699990000,
        waitMs: 10000,
        recommendation: null,
      },
    ],
  };

  let fetchedUrl = '';
  const mockFetch = async (url) => {
    fetchedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => mockPayload,
    };
  };

  const res = await fetchOpsDesk(mockFetch);
  assert.equal(res.ok, true);
  assert.equal(fetchedUrl, '/api/ops-desk');
  assert.equal(res.items.length, 1);
  assert.equal(res.items[0].name, 'grok-api');

  // Error case
  const mockError = async () => ({ ok: false, status: 500 });
  const errorRes = await fetchOpsDesk(mockError);
  assert.equal(errorRes.ok, false);
  assert.equal(errorRes.status, 500);
  assert.equal(errorRes.error, 'HTTP 500');
});
