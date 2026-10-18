import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';

test('POST /api/answer and write routes return 409 readonly', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const paths = ['/api/answer', '/api/send-keys', '/api/send-text', '/api/prompt'];
    for (const path of paths) {
      const res = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', body: '{}' });
      assert.equal(res.status, 409, path);
      const body = await res.json();
      assert.equal(body.ok, false, path);
      assert.equal(body.reason, 'readonly', path);
    }
  } finally {
    await server.close();
    await adapter.stop();
  }
});
