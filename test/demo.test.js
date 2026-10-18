import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { parseArgs, resolveBindHost } from '../src/cli.js';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';

const argv = ['node', 'src/cli.js'];

function request({ port, path, headers }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, text });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('default binds 127.0.0.1 and does not read PORT', () => {
  const opts = parseArgs(argv, { PORT: '9999', MASTOPIA_PORT: '7741' });
  assert.equal(opts.demo, false);
  assert.equal(opts.host, '127.0.0.1');
  assert.equal(opts.port, 7741);
  const noMastopia = parseArgs(argv, { PORT: '9999' });
  assert.equal(noMastopia.port, 7740);
  assert.equal(noMastopia.host, '127.0.0.1');
});

test('--demo reads PORT and still binds 127.0.0.1 without host opt-in', () => {
  const flag = parseArgs([...argv, '--demo'], { PORT: '9999', MASTOPIA_PORT: '7741' });
  assert.equal(flag.demo, true);
  assert.equal(flag.fixture, true);
  assert.equal(flag.host, '127.0.0.1');
  assert.equal(flag.port, 9999);
  const envDemo = parseArgs(argv, { MASTOPIA_DEMO: '1', MASTOPIA_PORT: '7741' });
  assert.equal(envDemo.demo, true);
  assert.equal(envDemo.host, '127.0.0.1');
  assert.equal(envDemo.port, 7741);
});

test('demo plus --host 0.0.0.0 or MASTOPIA_HOST binds 0.0.0.0', () => {
  const flag = parseArgs([...argv, '--demo', '--host', '0.0.0.0'], {});
  assert.equal(flag.host, '0.0.0.0');
  const envHost = parseArgs([...argv, '--demo'], { MASTOPIA_HOST: '0.0.0.0' });
  assert.equal(envHost.host, '0.0.0.0');
});

test('live plus 0.0.0.0 opt-in is refused', () => {
  assert.ok(resolveBindHost('0.0.0.0', false).error);
  const orig = process.exit;
  let code;
  try {
    process.exit = (c) => {
      code = c;
    };
    parseArgs(argv, { MASTOPIA_HOST: '0.0.0.0' });
  } finally {
    process.exit = orig;
  }
  assert.equal(code, 2);
});

test('demo without opt-in binds 127.0.0.1; demo plus opt-in binds 0.0.0.0', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const live = createServer({ adapter, host: '127.0.0.1', port: 0 });
  const demoLocal = createServer({ adapter, host: '127.0.0.1', port: 0, demo: true });
  const demoLan = createServer({ adapter, host: '0.0.0.0', port: 0, demo: true });
  try {
    const liveInfo = await live.listen();
    assert.equal(liveInfo.host, '127.0.0.1');
    assert.equal(live.raw.address().address, '127.0.0.1');
    const localInfo = await demoLocal.listen();
    assert.equal(localInfo.host, '127.0.0.1');
    assert.equal(demoLocal.raw.address().address, '127.0.0.1');
    const lanInfo = await demoLan.listen();
    assert.equal(lanInfo.host, '0.0.0.0');
    const bound = demoLan.raw.address().address;
    assert.ok(bound === '0.0.0.0' || bound === '::');
  } finally {
    await live.close();
    await demoLocal.close();
    await demoLan.close();
    await adapter.stop();
  }
});

test('without demo GET /health with Host example.com returns 403', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const res = await request({ port, path: '/health', headers: { Host: 'example.com' } });
    assert.equal(res.status, 403);
    assert.match(res.text, /mastopia binds 127\.0\.0\.1 only/);
  } finally {
    await server.close();
    await adapter.stop();
  }
});

test('with demo GET /health with Host example.com returns 200', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0, demo: true });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const res = await request({ port, path: '/health', headers: { Host: 'example.com' } });
    assert.equal(res.status, 200);
    const body = JSON.parse(res.text);
    assert.equal(body.ok, true);
    assert.equal(body.mode, 'demo');
    assert.equal(body.host, '127.0.0.1');
  } finally {
    await server.close();
    await adapter.stop();
  }
});

test('without demo GET /api/session with Origin example.com returns 403', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const id = (adapter.getSnapshot().docs || [])[0]?.id || 'w8';
    const res = await request({
      port,
      path: `/api/session?id=${id}`,
      headers: { Origin: 'http://example.com', 'x-mastopia-token': server.token },
    });
    assert.equal(res.status, 403);
  } finally {
    await server.close();
    await adapter.stop();
  }
});

test('with demo GET /api/session with Origin example.com does not fail Origin', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({ adapter, host: '0.0.0.0', port: 0, demo: true });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const id = (adapter.getSnapshot().docs || [])[0]?.id || 'w8';
    const res = await request({
      port,
      path: `/api/session?id=${id}`,
      headers: { Origin: 'http://example.com', 'x-mastopia-token': server.token },
    });
    assert.notEqual(res.status, 403);
    assert.ok(res.status === 200 || res.status === 404);
  } finally {
    await server.close();
    await adapter.stop();
  }
});
