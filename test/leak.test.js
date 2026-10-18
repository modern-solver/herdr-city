/**
 * Purpose: leak tests for screen, sessions and city JSON. Secrets at start, middle, end, boundary.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { MASK } from '../src/mask.js';
import { SCREEN_CAP } from '../src/screen.js';
import { maskThenTruncate } from '../src/output-filter.js';

const GHP = 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signaturepartshere';
const SK = 'sk-abcdefghijklmnopqrstuvwxyz123456';
const AKIA = 'AKIAIOSFODNN7EXAMPLE';
const TOKS = ` ${GHP} ${JWT} ${SK} ${AKIA} `;

function assertClean(body) {
  const s = JSON.stringify(body);
  assert.equal(s.includes('ghp_'), false);
  assert.equal(s.includes('sk-abcdefghijklmnopqrst'), false);
  assert.equal(s.includes('AKIAIOSFODNN7EXAMPLE'), false);
  assert.equal(s.includes('eyJhbGci'), false);
  assert.equal(s.includes(MASK), true);
}

function leakClient({ pane, title = 'bot' }) {
  return {
    kind: 'test',
    async agentList() {
      return [
        {
          pane_id: 'w9:p1',
          workspace_id: 'w9',
          name: 'bot',
          agent: 'grok',
          agent_status: 'blocked',
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
  const raw = `${'x'.repeat(SCREEN_CAP - 5)} ${GHP} ${JWT}`;
  const head = raw.slice(0, SCREEN_CAP);
  assert.equal(head.includes('ghp_'), true);
  const out = maskThenTruncate(raw, SCREEN_CAP, { keep: 'tail' });
  assert.equal(out.truncated, true);
  assert.equal(out.text.includes('ghp_'), false);
  assert.equal(out.text.includes('eyJ'), false);
  assert.equal(out.text.includes(MASK), true);
});

test('GET /api/screen JSON has no secrets at start, middle, end or tail boundary', async () => {
  const pane = `${TOKS}mid${TOKS}${'x'.repeat(SCREEN_CAP - 5)} ${GHP} ${JWT}${TOKS}`;
  await withServer(leakClient({ pane }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=w9:p1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body);
  });
});

test('GET /api/sessions JSON has no secrets at start, middle, end or activity boundary', async () => {
  const title = `${TOKS}mid${TOKS}${'z'.repeat(240 - 5)} ${GHP} ${JWT}${TOKS}`;
  const pane = `plain output${TOKS}`;
  await withServer(leakClient({ pane, title }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/sessions`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body);
  });
});

test('GET /api/city JSON has no secrets at start, middle, end or activity boundary', async () => {
  const pane = `${TOKS}plain output${TOKS}${'x'.repeat(200)} ${GHP}${TOKS}`;
  await withServer(leakClient({ pane, title: `${TOKS}title${TOKS}` }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/city`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body);
  });
});
