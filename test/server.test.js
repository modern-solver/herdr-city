import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';

test('JSON API on 127.0.0.1 serves city snapshot with blocked prompt', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
  const { port } = server.raw.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/city`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.districts.length >= 3);
  const blocked = body.asks.find((a) => a.session === 'w8');
  assert.ok(blocked);
  assert.match(blocked.input.command, /Allow this action/);
  const health = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal((await health.json()).ok, true);
  const answer = await fetch(`http://127.0.0.1:${port}/api/answer`, { method: 'POST', body: '{}' });
  assert.equal(answer.status, 409);
  await adapter.stop();
  await server.close();
});
