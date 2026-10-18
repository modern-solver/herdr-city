/**
 * Purpose: leak tests for screen, sessions and city JSON. Secrets at start, middle, end, boundary.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { SCREEN_CAP } from '../src/screen.js';
import { maskThenTruncate } from '../src/output-filter.js';
import { AKIA, GHP, JWT, LEAK_TOKENS, SK, TOKS, assertClean, boundaryText } from './helpers/leak.js';

const ACTIVITY_MAX = 240;

function leakClient({ pane, title = 'bot', status = 'blocked' }) {
  return {
    kind: 'test',
    async agentList() {
      return [
        {
          pane_id: 'w9:p1',
          workspace_id: 'w9',
          name: 'bot',
          agent: 'grok',
          agent_status: status,
          revision: 1,
          state_change_seq: 1,
          terminal_title_stripped: title,
          cwd: '/tmp/leak',
        },
      ];
    },
    async workspaceList() {
      return [{ workspace_id: 'w9', label: 'leak-lab' }];
    },
    async paneRead() {
      return pane;
    },
  };
}

async function withServer(client, fn) {
  const adapter = createAdapter({ client });
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  try {
    await adapter.start();
    await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
    const { port } = server.raw.address();
    await fn(port);
  } finally {
    await adapter.stop();
    await server.close();
  }
}

test('maskThenTruncate masks full text then keeps the tail', () => {
  const raw = `${boundaryText(SCREEN_CAP, `${GHP} ${JWT}`)}${TOKS}`;
  const out = maskThenTruncate(raw, SCREEN_CAP, { keep: 'tail' });
  assert.equal(out.truncated, true);
  assertClean(out.text, LEAK_TOKENS);
});

test('GET /api/screen JSON has no secrets at start, middle, end or tail boundary', async () => {
  const pane = `${TOKS}mid${TOKS}${boundaryText(SCREEN_CAP, GHP)} ${JWT} ${SK} ${AKIA}${TOKS}`;
  await withServer(leakClient({ pane }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=w9:p1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.truncated, true);
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/sessions JSON has no secrets at start, middle, end or activity boundary', async () => {
  const title = `${TOKS}mid${TOKS}${boundaryText(ACTIVITY_MAX, GHP)} ${JWT}${TOKS}`;
  const pane = 'plain output';
  await withServer(leakClient({ pane, title, status: 'idle' }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/sessions`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/city JSON has no secrets at start, middle, end or activity boundary', async () => {
  const pane = `${TOKS}plain output${TOKS}${boundaryText(ACTIVITY_MAX, GHP)}${TOKS}`;
  await withServer(leakClient({ pane, title: `${TOKS}title${TOKS}` }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/city`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/ops-desk JSON has no secrets at start, middle, end or prompt boundary', async () => {
  const pane = `Allow this action?\n${TOKS}mid${TOKS}${boundaryText(800, GHP)} ${JWT}${TOKS}`;
  await withServer(leakClient({ pane, title: `${TOKS}title${TOKS}` }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/ops-desk`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.items.length >= 1);
    assertClean(body, LEAK_TOKENS);
  });
});
