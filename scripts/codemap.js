/**
 * Purpose: generate docs/CODEMAP.md from git-tracked files using Node built-ins.
 * Owner: builder-grok
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CODEMAP_REL = 'docs/CODEMAP.md';

const SKIP_DIR_NAMES = new Set(['.git', 'node_modules']);
const SKIP_PREFIXES = ['web/assets/', 'docs/images/', 'page/src/icons/'];
const SKIP_EXT = new Set(['.png', '.woff2', '.jpg', '.jpeg', '.gif', '.webp']);

export function toPosix(rel) {
  return rel.split(path.sep).join('/');
}

export function normalizeEol(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function shouldSkip(rel, isDir) {
  if (!rel) return true;
  const posix = toPosix(rel);
  if (posix === CODEMAP_REL) return true;
  const base = path.basename(posix);
  if (SKIP_DIR_NAMES.has(base)) return true;
  if (posix.startsWith('.') && posix !== '.github' && !posix.startsWith('.github/')) {
    return true;
  }
  for (const prefix of SKIP_PREFIXES) {
    if (posix === prefix.slice(0, -1) || posix.startsWith(prefix)) return true;
  }
  if (!isDir && SKIP_EXT.has(path.extname(posix).toLowerCase())) return true;
  return false;
}

export function walk(dir, root, acc = []) {
  const names = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));
  for (const name of names) {
    const full = path.join(dir, name);
    const rel = toPosix(path.relative(root, full));
    const isDir = fs.statSync(full).isDirectory();
    if (shouldSkip(rel, isDir)) continue;
    acc.push({ rel, isDir });
    if (isDir) walk(full, root, acc);
  }
  return acc;
}

export function listGitFiles(root) {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'buffer' });
  if (r.status !== 0) {
    const err = r.stderr ? r.stderr.toString('utf8') : 'git ls-files failed';
    throw new Error(err.trim() || 'git ls-files failed');
  }
  const out = r.stdout ? r.stdout.toString('utf8') : '';
  return out.split('\0').filter(Boolean).map(toPosix);
}

export function entriesFromGit(root) {
  const files = listGitFiles(root).sort((a, b) => a.localeCompare(b));
  const seen = new Set();
  const acc = [];
  function addDir(rel) {
    if (!rel || seen.has(rel + '/')) return;
    const parent = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    if (parent) addDir(parent);
    if (shouldSkip(rel, true)) return;
    seen.add(rel + '/');
    acc.push({ rel, isDir: true });
  }
  for (const file of files) {
    if (shouldSkip(file, false)) continue;
    const dir = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
    if (dir) addDir(dir);
    seen.add(file);
    acc.push({ rel: file, isDir: false });
  }
  return acc.sort((a, b) => a.rel.localeCompare(b.rel) || Number(b.isDir) - Number(a.isDir));
}

export function parseExports(text) {
  const names = [];
  const decl = /export\s+(?:async\s+)?(?:function|const|class|let|var)\s+([A-Za-z_$][\w$]*)/g;
  let m = decl.exec(text);
  while (m) {
    names.push(m[1]);
    m = decl.exec(text);
  }
  const brace = /export\s*\{([^}]+)\}/g;
  let b = brace.exec(text);
  while (b) {
    for (const part of b[1].split(',')) {
      const asMatch = part.match(/as\s+([A-Za-z_$][\w$]*)/);
      const plain = part.match(/([A-Za-z_$][\w$]*)\s*$/);
      const name = asMatch ? asMatch[1] : plain ? plain[1] : '';
      if (name) names.push(name);
    }
    b = brace.exec(text);
  }
  return [...new Set(names)].sort((a, c) => a.localeCompare(c));
}

export function localImportsFromText(text) {
  // Relative from-specifiers only. Bare side-effect imports and import() are skipped.
  const found = [];
  const re = /from\s+['"](\.[^'"]+)['"]/g;
  let m = re.exec(text);
  while (m) {
    found.push(m[1]);
    m = re.exec(text);
  }
  return [...new Set(found)].sort((a, b) => a.localeCompare(b));
}

export function resolveImport(fromFile, spec) {
  const dir = path.posix.dirname(fromFile);
  let resolved = path.posix.normalize(`${dir}/${spec}`);
  if (resolved.startsWith('../')) return resolved;
  if (resolved.startsWith('./')) resolved = resolved.slice(2);
  return resolved;
}

function readmePurpose(root, dirRel) {
  const full = path.join(root, dirRel, 'README.md');
  if (!fs.existsSync(full)) return '';
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('Purpose:')) return line.slice('Purpose:'.length).trim();
  }
  return '';
}

function jsMeta(root, fileRel) {
  const text = fs.readFileSync(path.join(root, fileRel), 'utf8');
  const specs = localImportsFromText(text);
  return {
    exports: parseExports(text),
    imports: specs.map((s) => resolveImport(fileRel, s)),
  };
}

function fmtList(items) {
  return items.length ? items.map((i) => `\`${i}\``).join(', ') : '(none)';
}

export function renderModules(root, entries) {
  const lines = ['## Modules', '', '| Path | Purpose |', '|---|---|'];
  for (const e of entries) {
    if (!e.isDir || e.rel.includes('/')) continue;
    const purpose = readmePurpose(root, e.rel);
    if (!purpose) continue;
    lines.push(`| \`${e.rel}/\` | ${purpose} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function renderJsModules(root, entries) {
  const files = entries
    .filter((e) => !e.isDir && e.rel.endsWith('.js'))
    .map((e) => e.rel);
  const mapped = files.filter((f) => f.startsWith('src/') || f.startsWith('scripts/'));
  const meta = new Map();
  for (const f of mapped) meta.set(f, jsMeta(root, f));
  const dependents = new Map();
  for (const f of files) {
    if (f.startsWith('src/') || f.startsWith('scripts/') || f.startsWith('test/')) {
      const imps = jsMeta(root, f).imports;
      for (const dep of imps) {
        if (!dependents.has(dep)) dependents.set(dep, []);
        dependents.get(dep).push(f);
      }
    }
  }
  const lines = [
    '## src and scripts',
    '',
    '| Path | Exports | Imports | Dependents |',
    '|---|---|---|---|',
  ];
  for (const f of mapped) {
    const m = meta.get(f);
    const deps = (dependents.get(f) || []).sort((a, b) => a.localeCompare(b));
    lines.push(`| \`${f}\` | ${fmtList(m.exports)} | ${fmtList(m.imports)} | ${fmtList(deps)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function generateCodemapText(root = ROOT) {
  const entries = entriesFromGit(root);
  const header = [
    '# CODEMAP',
    '',
    'Generated by `npm run codemap` (`scripts/codemap.js`). Do not edit by hand.',
    'Uses `git ls-files`. Untracked paths are omitted. Vendor binaries are omitted.',
    '',
  ].join('\n');
  return `${header}\n${renderModules(root, entries)}\n${renderJsModules(root, entries)}`;
}

export function writeCodemap(root = ROOT) {
  const text = generateCodemapText(root);
  const out = path.join(root, CODEMAP_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, text);
  return out;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  writeCodemap();
}
