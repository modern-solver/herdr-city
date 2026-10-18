import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHandbook, inspectDistrict, isRemoteCwd, setMappedNetworkDrives } from '../src/rulebook.js';
import { createFixtureClient } from '../src/fixtures.js';
import { createAdapter } from '../src/adapter.js';
import { createServer } from '../src/server.js';

const handbookPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'rulebook-handbook.md');

function makeDistrict(missingChangelog) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mastopia-rulebook-'));
  fs.mkdirSync(path.join(dir, 'briefs'));
  fs.writeFileSync(path.join(dir, 'briefs', 'lead-escalations.md'), '# log\n');
  if (!missingChangelog) fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), '# Changelog\n');
  return dir;
}

test('parseHandbook reads GOV-01 from ID/Rule/Check tables and list lines', () => {
  const parsed = parseHandbook(fs.readFileSync(handbookPath, 'utf8'));
  assert.equal(parsed.handbook.version, '2.0');
  assert.equal(parsed.handbook.date, '2026-10-17');
  const gov = parsed.rules.find((r) => r.id === 'GOV-01');
  assert.ok(gov);
  assert.equal(gov.area, 'GOV');
  assert.match(gov.text, /MUST go through a PR/);
  assert.equal(gov.check, 'branch protection');
  const list = parsed.rules.find((r) => r.id === 'SKL-06');
  assert.ok(list);
  assert.equal(list.check, null);
});

test('inspectDistrict lists CHANGELOG.md in missing when absent', async () => {
  const dir = makeDistrict(true);
  const row = await inspectDistrict({ id: 'w1', title: 'mastopia', cwd: dir });
  assert.equal(row.readable, true);
  assert.ok(row.missing.includes('CHANGELOG.md'));
  const changelog = row.files.find((f) => f.path === 'CHANGELOG.md');
  assert.equal(changelog.present, false);
});

test('isRemoteCwd refuses UNC and mapped network drives before fs', () => {
  assert.equal(isRemoteCwd('\\\\evil.example\\share\\repo'), true);
  assert.equal(isRemoteCwd('//evil.example/share/repo'), true);
  assert.equal(isRemoteCwd('\\\\?\\UNC\\evil.example\\share\\repo'), true);
  assert.equal(isRemoteCwd('C:\\Users\\shaun\\mastopia'), false);
  setMappedNetworkDrives(['Z']);
  try {
    assert.equal(isRemoteCwd('Z:\\mapped\\repo'), true);
  } finally {
    setMappedNetworkDrives([]);
  }
});

test('inspectDistrict does not follow a UNC cwd', async () => {
  const started = Date.now();
  const row = await inspectDistrict({
    id: 'wX',
    title: 'remote',
    cwd: '\\\\evil.example\\share\\repo',
  });
  assert.ok(Date.now() - started < 200);
  assert.equal(row.readable, false);
  assert.equal(row.missing.length, 0);
  assert.ok(row.files.every((f) => f.present === null));
});

test('GET /api/rulebook includes GOV-01 when the handbook file is present', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const present = makeDistrict(false);
  const missing = makeDistrict(true);
  const server = createServer({
    adapter,
    host: '127.0.0.1',
    port: 0,
    handbookPath,
    cwdMap: { w1: present, w8: missing },
  });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/rulebook`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.v, 1);
    assert.equal(body.error, null);
    assert.ok(body.rules.some((r) => r.id === 'GOV-01'));
    const w8 = body.districts.find((d) => d.id === 'w8');
    assert.ok(w8.missing.includes('CHANGELOG.md'));
  } finally {
    await server.close();
    await adapter.stop();
  }
});

test('GET /api/rulebook is 200 with handbook_missing when the file is absent', async () => {
  const adapter = createAdapter({ client: createFixtureClient() });
  await adapter.start();
  const server = createServer({
    adapter,
    host: '127.0.0.1',
    port: 0,
    handbookPath: path.join(os.tmpdir(), 'mastopia-no-handbook.md'),
  });
  try {
    await server.listen();
    const { port } = server.raw.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/rulebook`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.error, 'handbook_missing');
    assert.equal(body.handbook, null);
    assert.deepEqual(body.rules, []);
  } finally {
    await server.close();
    await adapter.stop();
  }
});
