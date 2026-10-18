import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const REQUIRED_PATHS = ['CHANGELOG.md', 'briefs/', 'briefs/lead-escalations.md'];
export const REPORTED_PATHS = [...REQUIRED_PATHS, 'docs/MAS-House-Rules-Handbook.md'];

const mappedNetworkDrives = new Set();
let mappedDrivesLoaded = false;
let handbookCache = { path: null, mtimeMs: null, result: null };

export function isRemoteCwd(cwd) {
  if (cwd == null || String(cwd).trim() === '') return false;
  const raw = String(cwd).trim();
  const posix = raw.replace(/\\/g, '/');
  if (/^\/\/\?\/UNC\//i.test(posix)) return true;
  if (/^\/\/\?\//.test(posix)) return false;
  if (/^\/\/[^/]/.test(posix)) return true;
  const drive = raw.match(/^([A-Za-z]):/);
  if (drive) {
    loadMappedNetworkDrives();
    if (mappedNetworkDrives.has(drive[1].toUpperCase())) return true;
  }
  return false;
}

export function setMappedNetworkDrives(letters) {
  mappedNetworkDrives.clear();
  mappedDrivesLoaded = true;
  for (const letter of letters || []) mappedNetworkDrives.add(String(letter).toUpperCase());
}

export function parseHandbook(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const title = firstHeading(lines) || 'Modern Age Solutions (MAS) House Rules Handbook';
  let version = '';
  let date = '';
  const rules = [];
  const seen = new Set();
  const addRule = (id, body, check) => pushRule(rules, seen, id, body, check);
  forEachTable(lines, (kind, idx, rows) => {
    if (kind === 'meta') {
      ({ version, date } = applyMetaRows(rows, idx, version, date));
      return;
    }
    for (const row of rows) addRule(row[idx.id], row[idx.rule], normalizeCheck(row[idx.check]));
  });
  parseListRules(lines, addRule);
  return { handbook: { version, date, title }, rules };
}

export async function inspectDistrict({ id, title, cwd }) {
  const unread = unreadDistrict(id, title, cwd);
  if (!cwd || isRemoteCwd(cwd)) return unread;
  try {
    const st = await fs.stat(cwd);
    if (!st.isDirectory()) return unread;
  } catch {
    return unread;
  }
  const files = [];
  for (const rel of REPORTED_PATHS) {
    files.push({ path: rel, present: await pathPresent(cwd, rel) });
  }
  const missing = files.filter((f) => REQUIRED_PATHS.includes(f.path) && f.present === false).map((f) => f.path);
  return { id, title, cwd, readable: true, files, missing };
}

export async function buildRulebook({ snap, cwdByDistrict = {}, cwdMap = null, handbookPath }) {
  const loaded = await loadHandbook(handbookPath);
  const districts = [];
  for (const doc of snap?.docs || []) {
    const cwd = cwdMap && Object.prototype.hasOwnProperty.call(cwdMap, doc.id)
      ? cwdMap[doc.id]
      : cwdByDistrict[doc.id] || null;
    districts.push(await inspectDistrict({ id: doc.id, title: doc.title, cwd }));
  }
  return { v: 1, error: loaded.error, handbook: loaded.handbook, rules: loaded.rules, districts };
}

function loadMappedNetworkDrives() {
  if (mappedDrivesLoaded) return;
  mappedDrivesLoaded = true;
  if (process.platform !== 'win32') return;
  try {
    const out = execFileSync('net', ['use'], { encoding: 'utf8', timeout: 800, windowsHide: true });
    for (const line of String(out).split(/\r?\n/)) {
      const m = line.match(/\b([A-Za-z]):\s+\\\\/);
      if (m) mappedNetworkDrives.add(m[1].toUpperCase());
    }
  } catch {
    /* local `net use` failed; UNC regex still applies */
  }
}

function unreadDistrict(id, title, cwd) {
  return {
    id,
    title,
    cwd: cwd || null,
    readable: false,
    files: REPORTED_PATHS.map((p) => ({ path: p, present: null })),
    missing: [],
  };
}

function firstHeading(lines) {
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/);
    if (m) return m[1].trim();
  }
  return '';
}

function forEachTable(lines, onTable) {
  for (let i = 0; i < lines.length; ) {
    const cells = splitRow(lines[i]);
    const metaIdx = cells && headerIndex(cells, ['field', 'value']);
    const ruleIdx = cells && headerIndex(cells, ['id', 'rule', 'check']);
    if (!metaIdx && !ruleIdx) {
      i += 1;
      continue;
    }
    i += 1;
    if (isSep(lines[i])) i += 1;
    const rows = [];
    while (i < lines.length) {
      const row = splitRow(lines[i]);
      if (!row) break;
      if (isSep(lines[i])) {
        i += 1;
        continue;
      }
      rows.push(row);
      i += 1;
    }
    onTable(metaIdx ? 'meta' : 'rules', metaIdx || ruleIdx, rows);
  }
}

function applyMetaRows(rows, idx, version, date) {
  let nextVersion = version;
  let nextDate = date;
  for (const row of rows) {
    const field = String(row[idx.field] || '').trim().toLowerCase();
    const value = String(row[idx.value] || '').trim();
    if (field === 'version') nextVersion = value;
    if (field === 'date') nextDate = value;
  }
  return { version: nextVersion, date: nextDate };
}

function parseListRules(lines, addRule) {
  for (const line of lines) {
    let s = line.trim();
    if (s.startsWith('- ')) s = s.slice(2);
    else if (s.startsWith('* ')) s = s.slice(2);
    const m = s.match(/^([A-Z]+-\d+):\s*(.*)$/);
    if (m) addRule(m[1], m[2], null);
  }
}

function pushRule(rules, seen, id, body, check) {
  const rid = String(id || '').trim();
  if (!rid || seen.has(rid)) return;
  seen.add(rid);
  rules.push({ id: rid, area: rid.split('-')[0], text: String(body || '').trim(), check });
}

async function loadHandbook(handbookPath) {
  if (!handbookPath) return { error: 'handbook_missing', handbook: null, rules: [] };
  try {
    const st = await fs.stat(handbookPath);
    if (!st.isFile()) return { error: 'handbook_missing', handbook: null, rules: [] };
    if (handbookCache.path === handbookPath && handbookCache.mtimeMs === st.mtimeMs && handbookCache.result) {
      return handbookCache.result;
    }
    const parsed = parseHandbook(await fs.readFile(handbookPath, 'utf8'));
    const result = { error: null, handbook: parsed.handbook, rules: parsed.rules };
    handbookCache = { path: handbookPath, mtimeMs: st.mtimeMs, result };
    return result;
  } catch {
    return { error: 'handbook_missing', handbook: null, rules: [] };
  }
}

function splitRow(line) {
  const t = String(line || '').trim();
  if (!t.startsWith('|')) return null;
  const inner = t.endsWith('|') ? t.slice(1, -1) : t.slice(1);
  return inner.split('|').map((c) => c.trim());
}

function isSep(line) {
  const cells = splitRow(line);
  if (!cells) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, '')) || c === '');
}

function headerIndex(cells, names) {
  const lower = cells.map((c) => c.toLowerCase());
  const idx = {};
  for (const name of names) {
    const i = lower.indexOf(name);
    if (i < 0) return null;
    idx[name] = i;
  }
  return idx;
}

function normalizeCheck(raw) {
  let s = String(raw || '').trim().replace(/^\[check\]\s*/i, '').trim();
  if (!s || s === '—' || s === '-') return null;
  return s;
}

async function pathPresent(cwd, rel) {
  const full = path.join(cwd, ...rel.replace(/\/$/, '').split('/'));
  try {
    const st = await fs.stat(full);
    return rel.endsWith('/') ? st.isDirectory() : st.isFile();
  } catch {
    return false;
  }
}
