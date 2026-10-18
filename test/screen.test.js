/**
 * Purpose: tests for GET /api/screen masking, 400/404, and the 80000-character cap.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';
import { MASK } from '../src/mask.js';
import { SCREEN_CAP, buildScreen, capPaneText } from '../src/screen.js';

async function listen(adapter) {
  const server = createServer({ adapter, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.raw.listen(0, '127.0.0.1', resolve));
  const { port } = server.raw.address();
  return { server, port };
}

test('GET /api/screen?paneId=w8:p1 text is masked', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const { server, port } = await listen(adapter);
  const res = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=w8:p1`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.v, 1);
  assert.equal(body.paneId, 'w8:p1');
  assert.equal(body.truncated, false);
  assert.ok(body.lineCount >= 1);
  assert.match(body.text, /Allow this action/);
  assert.equal(body.text.includes('ghp_'), false);
  assert.equal(body.text.includes('sk-thisIs'), false);
  assert.equal(body.text.includes(MASK), true);
  assert.equal(JSON.stringify(body).includes('ghp_'), false);
  assert.equal(body.session.paneId, 'w8:p1');
  assert.equal(body.session.status, 'blocked');
  assert.equal(body.session.districtTitle, 'atlas-api');
  await adapter.stop();
  await server.close();
});

test('GET /api/screen missing paneId is 400; unknown pane is 404', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const { server, port } = await listen(adapter);
  const missing = await fetch(`http://127.0.0.1:${port}/api/screen`);
  assert.equal(missing.status, 400);
  const blank = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=`);
  assert.equal(blank.status, 400);
  const unknown = await fetch(`http://127.0.0.1:${port}/api/screen?paneId=nope:p9`);
  assert.equal(unknown.status, 404);
  await adapter.stop();
  await server.close();
});

test('capPaneText cuts at 80000 and buildScreen masks the cap', () => {
  const secret = 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const raw = `${secret}\n${'x'.repeat(SCREEN_CAP)}`;
  const capped = capPaneText(raw);
  assert.equal(capped.truncated, true);
  assert.equal(capped.text.length, SCREEN_CAP);
  const screen = buildScreen({
    paneId: 'w9:p1',
    rawText: capped.text,
    truncated: capped.truncated,
    updatedAt: 1,
    session: { paneId: 'w9:p1' },
  });
  assert.equal(screen.truncated, true);
  assert.equal(screen.text.includes('ghp_'), false);
  assert.equal(screen.text.includes(MASK), true);
});
