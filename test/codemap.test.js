/**
 * Purpose: fail when docs/CODEMAP.md does not match the generated git tree.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  generateCodemapText,
  CODEMAP_REL,
  ROOT,
  normalizeEol,
  shouldSkip,
  walk,
  entriesFromGit,
} from '../scripts/codemap.js';

function git(dir, args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || 'git failed').trim());
  }
  return r;
}

function makeGitDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemap-'));
  git(dir, ['init']);
  git(dir, ['config', 'user.name', 'codemap-test']);
  git(dir, ['config', 'user.email', 'codemap-test@example.test']);
  git(dir, ['config', 'core.autocrlf', 'false']);
  return dir;
}

test('docs/CODEMAP.md matches generateCodemapText after CRLF normalize', () => {
  const expected = generateCodemapText(ROOT);
  const actual = fs.readFileSync(path.join(ROOT, CODEMAP_REL), 'utf8');
  assert.equal(normalizeEol(actual), normalizeEol(expected));
});

test('walk includes an untracked file that shouldSkip allows', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemap-walk-'));
  fs.writeFileSync(path.join(dir, 'scratch.tmp'), 'x');
  const rels = walk(dir, dir).map((e) => e.rel);
  assert.equal(shouldSkip('scratch.tmp', false), false);
  assert.equal(rels.includes('scratch.tmp'), true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('entriesFromGit omits untracked files', () => {
  const dir = makeGitDir();
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'keep.js'), 'export const KEEP = 1;\n');
  git(dir, ['add', 'src/keep.js']);
  git(dir, ['commit', '-m', 'keep']);
  fs.writeFileSync(path.join(dir, 'scratch.tmp'), 'untracked');
  const rels = entriesFromGit(dir).map((e) => e.rel);
  assert.equal(rels.includes('src/keep.js'), true);
  assert.equal(rels.includes('scratch.tmp'), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('CRLF CODEMAP text matches LF after normalizeEol', () => {
  const lf = generateCodemapText(ROOT);
  const crlf = lf.replace(/\n/g, '\r\n');
  const tmp = path.join(os.tmpdir(), 'CODEMAP-crlf.md');
  fs.writeFileSync(tmp, crlf);
  const readBack = fs.readFileSync(tmp, 'utf8');
  assert.equal(normalizeEol(readBack), normalizeEol(lf));
  fs.rmSync(tmp, { force: true });
});
