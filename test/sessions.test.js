/**
 * Purpose: tests for console session mapping and GET /api/sessions filters.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { consoleStatus, filterSessions } from '../src/sessions.js';

test('consoleStatus maps herdr blocked and waiting to blocked', () => {
  assert.equal(consoleStatus('working'), 'working');
  assert.equal(consoleStatus('blocked'), 'blocked');
  assert.equal(consoleStatus('waiting'), 'blocked');
  assert.equal(consoleStatus('idle'), 'idle');
  assert.equal(consoleStatus('done'), 'idle');
});

test('GET /api/sessions returns fixture panes with cwd, cli, model, status', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
  const { port } = server.raw.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/sessions`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.v, 1);
  assert.ok(body.sessions.length >= 4);
  const grok = body.sessions.find((s) => s.paneId === 'w8:p1');
  assert.ok(grok);
  assert.ok(grok.cwd);
  assert.equal(grok.cli, 'grok');
  assert.ok(grok.model);
  assert.equal(grok.status, 'blocked');
  assert.equal(grok.statusLabel, 'Needs you');
  assert.equal(grok.districtTitle, 'atlas-api');
  const city = await fetch(`http://127.0.0.1:${port}/api/city`);
  assert.equal(city.status, 200);
  await adapter.stop();
  await server.close();
});

test('GET /api/sessions?status=blocked returns the atlas-api grok row', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
  const { port } = server.raw.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/sessions?status=blocked`);
  const body = await res.json();
  assert.ok(body.sessions.some((s) => s.paneId === 'w8:p1'));
  assert.equal(body.sessions.every((s) => s.status === 'blocked'), true);
  assert.equal(body.filters.status, 'blocked');
  await adapter.stop();
  await server.close();
});

test('GET /api/sessions?q=atlas matches district title', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
  const { port } = server.raw.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/sessions?q=atlas`);
  const body = await res.json();
  assert.ok(body.sessions.some((s) => s.paneId === 'w8:p1'));
  await adapter.stop();
  await server.close();
});

test('filterSessions ANDs district, cli and status', () => {
  const rows = [
    { districtId: 'w8', districtTitle: 'atlas-api', cli: 'grok', model: 'grok-4', status: 'blocked', name: 'grok-api', cwd: 'x', activity: 'a', error: null },
    { districtId: 'w1', districtTitle: 'mastopia', cli: 'claude', model: 'opus', status: 'working', name: 'c', cwd: 'y', activity: 'b', error: null },
  ];
  const out = filterSessions(rows, { district: 'atlas', cli: 'grok', model: null, status: 'blocked', q: null });
  assert.equal(out.length, 1);
  assert.equal(out[0].cli, 'grok');
});
