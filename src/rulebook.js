import fs from 'node:fs';
import path from 'node:path';

export const REQUIRED_PATHS = ['CHANGELOG.md', 'briefs/', 'briefs/lead-escalations.md'];
export const REPORTED_PATHS = [...REQUIRED_PATHS, 'docs/MAS-House-Rules-Handbook.md'];

export function parseHandbook(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  let title = 'Modern Age Solutions (MAS) House Rules Handbook';
  let version = '';
  let date = '';
  const rules = [];
  const seen = new Set();

  function addRule(id, body, check) {
    const rid = String(id || '').trim();
    if (!rid || seen.has(rid)) return;
    seen.add(rid);
    rules.push({
      id: rid,
      area: rid.split('-')[0],
      text: String(body || '').trim(),
      check,
    });
  }

  for (const line of lines) {
    const heading = line.match(/^#\s+(.+)/);
    if (heading) {
      title = heading[1].trim();
      break;
    }
  }

  for (let i = 0; i < lines.length; ) {
    const cells = splitRow(lines[i]);
    if (cells && headerIndex(cells, ['field', 'value'])) {
      const idx = headerIndex(cells, ['field', 'value']);
      i += 1;
      if (isSep(lines[i])) i += 1;
      while (i < lines.length) {
        const row = splitRow(lines[i]);
        if (!row) break;
        if (isSep(lines[i])) {
          i += 1;
          continue;
        }
        const field = String(row[idx.field] || '').trim().toLowerCase();
        const value = String(row[idx.value] || '').trim();
        if (field === 'version') version = value;
        if (field === 'date') date = value;
        i += 1;
      }
      continue;
    }
    if (cells && headerIndex(cells, ['id', 'rule', 'check'])) {
      const idx = headerIndex(cells, ['id', 'rule', 'check']);
      i += 1;
      if (isSep(lines[i])) i += 1;
      while (i < lines.length) {
        const row = splitRow(lines[i]);
        if (!row) break;
        if (isSep(lines[i])) {
          i += 1;
          continue;
        }
        addRule(row[idx.id], row[idx.rule], normalizeCheck(row[idx.check]));
        i += 1;
      }
      continue;
    }
    i += 1;
  }

  for (const line of lines) {
    let s = line.trim();
    if (s.startsWith('- ')) s = s.slice(2);
    else if (s.startsWith('* ')) s = s.slice(2);
    const m = s.match(/^([A-Z]+-\d+):\s*(.*)$/);
    if (m) addRule(m[1], m[2], null);
  }

  return { handbook: { version, date, title }, rules };
}

export function inspectDistrict({ id, title, cwd }) {
  const emptyFiles = REPORTED_PATHS.map((p) => ({ path: p, present: null }));
  if (!cwd) {
    return { id, title, cwd: null, readable: false, files: emptyFiles, missing: [] };
  }
  try {
    if (!fs.statSync(cwd).isDirectory()) throw new Error('not dir');
  } catch {
    return { id, title, cwd, readable: false, files: emptyFiles, missing: [] };
  }
  const files = REPORTED_PATHS.map((p) => ({ path: p, present: pathPresent(cwd, p) }));
  const missing = files.filter((f) => REQUIRED_PATHS.includes(f.path) && f.present === false).map((f) => f.path);
  return { id, title, cwd, readable: true, files, missing };
}

export function buildRulebook({ snap, cwdByDistrict = {}, cwdMap = null, handbookPath }) {
  let error = null;
  let handbook = null;
  let rules = [];
  try {
    if (!handbookPath || !fs.existsSync(handbookPath) || !fs.statSync(handbookPath).isFile()) {
      error = 'handbook_missing';
    } else {
      const parsed = parseHandbook(fs.readFileSync(handbookPath, 'utf8'));
      handbook = parsed.handbook;
      rules = parsed.rules;
      error = null;
    }
  } catch {
    error = 'handbook_missing';
    handbook = null;
    rules = [];
  }

  const districts = (snap?.docs || []).map((doc) => {
    const cwd = cwdMap && Object.prototype.hasOwnProperty.call(cwdMap, doc.id)
      ? cwdMap[doc.id]
      : cwdByDistrict[doc.id] || null;
    return inspectDistrict({ id: doc.id, title: doc.title, cwd });
  });

  return { v: 1, error, handbook, rules, districts };
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
  let s = String(raw || '').trim();
  s = s.replace(/^\[check\]\s*/i, '').trim();
  if (!s || s === '—' || s === '-') return null;
  return s;
}

function pathPresent(cwd, rel) {
  const parts = rel.replace(/\/$/, '').split('/');
  const full = path.join(cwd, ...parts);
  try {
    const st = fs.statSync(full);
    return rel.endsWith('/') ? st.isDirectory() : st.isFile();
  } catch {
    return false;
  }
}
