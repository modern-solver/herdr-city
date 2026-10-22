/**
 * Purpose: leak tests for screen, sessions, city and logs JSON. Secrets at start, middle, end, boundary.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { LOG_TEXT_MAX } from '../src/logs.js';
import { SCREEN_CAP } from '../src/screen.js';
import { maskThenTruncate } from '../src/output-filter.js';
import {
  AKIA,
  GHP,
  JWT,
  LEAK_TOKENS,
  SK,
  TOKS,
  assertClean,
  assertCutInsideToken,
  boundaryText,
} from './helpers/leak.js';

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
  const raw = `${TOKS}mid ${boundaryText(SCREEN_CAP, GHP, ` ${JWT}`)}`;
  assertCutInsideToken(raw, SCREEN_CAP, GHP);
  const out = maskThenTruncate(raw, SCREEN_CAP, { keep: 'tail' });
  assertClean(out.text, LEAK_TOKENS);
});

test('GET /api/screen JSON has no secrets at start, middle, end or tail boundary', async () => {
  const pane = `${TOKS}mid${TOKS} ${boundaryText(SCREEN_CAP, GHP, ` ${JWT} ${SK}`)}`;
  assertCutInsideToken(pane, SCREEN_CAP, GHP);
  await withServer(leakClient({ pane }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=w9:p1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/sessions JSON has no secrets at start, middle, end or activity boundary', async () => {
  const title = `${TOKS}mid ${boundaryText(ACTIVITY_MAX, GHP, ` ${AKIA} mid ${SK}`)}`;
  assertCutInsideToken(title, ACTIVITY_MAX, GHP);
  const pane = 'plain output';
  await withServer(leakClient({ pane, title, status: 'idle' }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/sessions`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/city JSON has no secrets at start, middle, end or activity boundary', async () => {
  // idle + title hits maskedClip(title, 240) (not prompt/error paths).
  const title = `${TOKS}mid ${boundaryText(ACTIVITY_MAX, GHP, ` ${AKIA} mid ${SK}`)}`;
  assertCutInsideToken(title, ACTIVITY_MAX, GHP);
  await withServer(leakClient({ pane: 'plain output', title, status: 'idle' }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/city`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/screen truncated stays true when masked text exceeds cap', async () => {
  const extra = '#'.repeat(1000);
  const pane = `${TOKS}mid ${boundaryText(SCREEN_CAP, GHP, ` ${JWT}`)}${extra}`;
  await withServer(leakClient({ pane }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=w9:p1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.truncated, true);
    assert.equal(body.text.length, SCREEN_CAP);
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/logs JSON has no secrets at start, middle, end or text boundary', async () => {
  // needs_you: capPrompt keep head, then log append keep tail.
  const prefix = `Allow this action?\n${TOKS}mid `;
  const before = `${JWT} `;
  const overlap = 16;
  const padLen = LOG_TEXT_MAX - overlap - prefix.length - before.length;
  const pane = `${prefix}${before}${'#'.repeat(Math.max(0, padLen))}${GHP}${'#'.repeat(300)} ${SK}${TOKS}`;
  assertCutInsideToken(pane, LOG_TEXT_MAX, GHP, { keep: 'head' });
  await withServer(leakClient({ pane, title: `${TOKS}title${TOKS}` }), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/logs`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.events.length >= 1);
    assertClean(body, LEAK_TOKENS);
  });
});

test('GET /api/logs adapter_error JSON has no secrets at the 800-char tail boundary', async () => {
  const msg = `${TOKS}mid${TOKS} ${boundaryText(LOG_TEXT_MAX, GHP, ` ${JWT} ${SK}${TOKS}`)}`;
  assertCutInsideToken(msg, LOG_TEXT_MAX, GHP);
  const client = {
    kind: 'test',
    async agentList() {
      throw new Error(msg);
    },
    async workspaceList() {
      return [];
    },
    async paneRead() {
      return '';
    },
  };
  await withServer(client, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/logs`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.events.some((e) => e.type === 'adapter_error'));
    assertClean(body, LEAK_TOKENS);
    const ev = body.events.find((e) => e.type === 'adapter_error');
    assert.equal(ev.text.length <= LOG_TEXT_MAX, true);
  });
});
