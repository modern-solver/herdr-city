/**
 * Purpose: tests for GET /api/logs ring buffer, masking-before-cap, and bounds.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { MASK } from '../src/mask.js';
import { LOG_TEXT_MAX, MAX_CHARS, MAX_EVENTS, createLogBuffer } from '../src/logs.js';
import { maskThenTruncate } from '../src/output-filter.js';

test('GET /api/logs includes a needs_you event after a fixture tick', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  try {
    await adapter.start();
    await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
    const { port } = server.raw.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/logs`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.v, 1);
    const hit = body.events.find((e) => e.type === 'needs_you' && e.paneId === 'w8:p1');
    assert.ok(hit);
    assert.match(hit.text, /Allow this action/);
    assert.equal(hit.id.startsWith('log-'), true);
    assert.equal(body.bounded.maxEvents, MAX_EVENTS);
    assert.equal(body.bounded.maxChars, MAX_CHARS);
    assert.equal(body.bounded.count, body.events.length);
    assert.equal(
      body.bounded.chars,
      body.events.reduce((n, e) => n + e.text.length, 0),
    );
    const dumped = JSON.stringify(body);
    assert.equal(dumped.includes('ghp_'), false);
    assert.equal(dumped.includes('sk-thisIs'), false);
    const bad = await fetch(`http://127.0.0.1:${port}/api/logs?limit=0`);
    assert.equal(bad.status, 400);
  } finally {
    await adapter.stop();
    await server.close();
  }
});

test('after 501 status changes the log length is 500', async () => {
  let seq = 0;
  let status = 'idle';
  const client = {
    kind: 'test',
    async agentList() {
      seq += 1;
      status = status === 'idle' ? 'working' : 'idle';
      return [
        {
          pane_id: 'w1:p1',
          workspace_id: 'w1',
          name: 'bot',
          agent_status: status,
          revision: seq,
          state_change_seq: seq,
        },
      ];
    },
    async workspaceList() {
      return [];
    },
    async paneRead() {
      return 'ok';
    },
  };
  const adapter = createAdapter({ client, now: () => seq });
  try {
    for (let i = 0; i < 501; i++) await adapter.tick();
    const logs = adapter.getLogs({ limit: 200 });
    assert.equal(logs.bounded.count, 500);
    assert.ok(logs.bounded.chars > 0);
    assert.ok(logs.events.length <= 200);
  } finally {
    await adapter.stop();
  }
});

test('bounded chars drop oldest events under 262144', () => {
  const buf = createLogBuffer();
  for (let i = 0; i < 400; i++) {
    buf.append({ type: 'status_change', text: 'y'.repeat(LOG_TEXT_MAX) }, i);
  }
  const b = buf.bounded();
  assert.ok(b.count <= MAX_EVENTS);
  assert.ok(b.chars <= MAX_CHARS);
  assert.equal(b.count, Math.floor(MAX_CHARS / LOG_TEXT_MAX));
  assert.equal(b.chars, b.count * LOG_TEXT_MAX);
});

test('adapter_error is one event per outage episode', async () => {
  let down = true;
  let n = 0;
  const client = {
    kind: 'test',
    async agentList() {
      n += 1;
      if (down) throw new Error('herdr down');
      return [
        {
          pane_id: 'w1:p1',
          workspace_id: 'w1',
          name: 'bot',
          agent_status: 'idle',
          revision: n,
          state_change_seq: n,
        },
      ];
    },
    async workspaceList() {
      return [];
    },
    async paneRead() {
      return 'ok';
    },
  };
  const adapter = createAdapter({ client, now: () => n });
  try {
    await adapter.tick();
    await adapter.tick();
    await adapter.tick();
    let logs = adapter.getLogs({ limit: 200 });
    const first = logs.events.filter((e) => e.type === 'adapter_error');
    assert.equal(first.length, 1);
    down = false;
    await adapter.tick();
    down = true;
    await adapter.tick();
    await adapter.tick();
    logs = adapter.getLogs({ limit: 200 });
    const errors = logs.events.filter((e) => e.type === 'adapter_error');
    assert.equal(errors.length, 2);
  } finally {
    await adapter.stop();
  }
});

test('token straddling the 800-char cap is masked before clip', () => {
  const ghp = 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signaturepartshere';
  const raw = `${'x'.repeat(LOG_TEXT_MAX - 5)} ${ghp} ${jwt}`;
  const headCut = raw.slice(0, LOG_TEXT_MAX);
  assert.equal(headCut.includes('ghp_'), true);
  const out = maskThenTruncate(raw, LOG_TEXT_MAX, { keep: 'tail' }).text;
  assert.equal(out.length <= LOG_TEXT_MAX, true);
  assert.equal(out.includes('ghp_'), false);
  assert.equal(out.includes('eyJ'), false);
  assert.equal(out.includes(MASK), true);
});
