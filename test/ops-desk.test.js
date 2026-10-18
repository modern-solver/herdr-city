/**
 * Purpose: tests for GET /api/ops-desk blocked-prompt queue.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { buildOpsDesk, updateBlockedSince } from '../src/ops-desk.js';

test('GET /api/ops-desk lists the blocked grok prompt; recommendation is null', async () => {
  let t = 1_000;
  const adapter = createAdapter({ client: createFixtureClient(), now: () => t });
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  try {
    await adapter.start();
    t = 11_000;
    await adapter.tick();
    await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
    const { port } = server.raw.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/ops-desk`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.v, 1);
    const grok = body.items.find((item) => item.paneId === 'w8:p1');
    assert.ok(grok);
    assert.equal(grok.id, 'w8:p1:21');
    assert.equal(grok.districtTitle, 'atlas-api');
    assert.equal(grok.cli, 'grok');
    assert.match(grok.prompt, /Allow this action/);
    assert.equal(grok.prompt.includes('ghp_'), false);
    assert.equal(grok.prompt.includes('sk-thisIs'), false);
    assert.equal(grok.recommendation, null);
    assert.equal(grok.since, 1_000);
    assert.equal(grok.waitMs, 10_000);
    assert.equal(
      body.items.every((item) => item.recommendation === null),
      true,
    );
    assert.equal(
      body.items.every((item) => !('approve' in item) && !('deny' in item)),
      true,
    );
    assert.equal(
      body.items.every((item) => item.prompt != null),
      true,
    );
    const dumped = JSON.stringify(body);
    assert.equal(dumped.includes('ghp_'), false);
    assert.equal(dumped.includes('sk-thisIs'), false);
  } finally {
    await adapter.stop();
    await server.close();
  }
});

test('ops-desk sorts by since ascending (longest wait first)', () => {
  const sessions = [
    {
      paneId: 'w2:p1',
      status: 'blocked',
      prompt: 'later',
      districtId: 'w2',
      districtTitle: 'b',
      name: 'b',
      cli: 'claude',
      model: 'x',
      lastSeenAt: 5,
    },
    {
      paneId: 'w1:p1',
      status: 'blocked',
      prompt: 'earlier',
      districtId: 'w1',
      districtTitle: 'a',
      name: 'a',
      cli: 'grok',
      model: 'y',
      lastSeenAt: 1,
    },
  ];
  const out = buildOpsDesk({
    sessions,
    agents: [
      { pane_id: 'w2:p1', state_change_seq: 1 },
      { pane_id: 'w1:p1', state_change_seq: 2 },
    ],
    blockedSince: { 'w2:p1': 5000, 'w1:p1': 1000 },
    generatedAt: 9000,
  });
  assert.equal(out.items.map((i) => i.paneId).join(','), 'w1:p1,w2:p1');
  assert.equal(out.items[0].waitMs, 8000);
});

test('blockedSince resets when the blocked episode ends', () => {
  const since = {};
  const pane = { pane_id: 'w1:p1', agent_status: 'blocked' };
  updateBlockedSince(since, [pane], 1000);
  assert.equal(since['w1:p1'], 1000);
  updateBlockedSince(since, [{ ...pane, agent_status: 'blocked' }], 2000);
  assert.equal(since['w1:p1'], 1000);
  updateBlockedSince(since, [{ ...pane, agent_status: 'idle' }], 3000);
  assert.equal(since['w1:p1'], undefined);
  updateBlockedSince(since, [{ ...pane, agent_status: 'blocked' }], 4000);
  assert.equal(since['w1:p1'], 4000);
  updateBlockedSince(since, [], 5000);
  assert.equal(since['w1:p1'], undefined);
});
