import fs from 'node:fs';
import { maskThenTruncate } from './output-filter.js';
import { DEFAULT_PATTERNS_PATH } from './paths.js';

const ERROR_RE = /\b(error:|fatal:|panic:|traceback|exception\b|ERROR\b|FAILED\b)\b/i;
const PROMPT_MAX = 800;
const ERROR_MAX = 400;

function capPrompt(text) {
  return maskThenTruncate(text, PROMPT_MAX, { keep: 'tail' }).text;
}

function capError(text) {
  return maskThenTruncate(text, ERROR_MAX, { keep: 'tail' }).text;
}

export function loadPromptPatterns(filePath = DEFAULT_PATTERNS_PATH) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const clis = Array.isArray(parsed.clis) ? parsed.clis : [];
  return clis.map((cli) => ({
    id: String(cli.id || 'unknown'),
    matchKinds: (cli.matchKinds || []).map((k) => String(k).toLowerCase()),
    matchTitles: (cli.matchTitles || []).map((k) => String(k).toLowerCase()),
    patterns: (cli.patterns || []).map((p) => ({
      type: p.type === 'contains' ? 'contains' : 'regex',
      value: String(p.value || ''),
      capture: p.capture || 'block',
    })),
  }));
}

export function inferCliKind(agent = {}) {
  const blob = [
    agent.agent,
    agent.display_agent,
    agent.name,
    agent.title,
    agent.terminal_title,
    agent.terminal_title_stripped,
    agent.tokens?.model,
    agent.model,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/\b(claude|anthropic)\b/.test(blob)) return 'claude';
  if (/\b(grok|xai)\b/.test(blob)) return 'grok';
  if (/\b(gemini|google)\b/.test(blob)) return 'gemini';
  if (/\b(codex|openai)\b/.test(blob)) return 'codex';
  return String(agent.agent || 'unknown').toLowerCase();
}

function matchingClis(clis, kind, agent) {
  const title = String(agent.terminal_title_stripped || agent.terminal_title || '').toLowerCase();
  return clis.filter((cli) => {
    if (cli.matchKinds.includes('*') || cli.matchKinds.includes(kind)) return true;
    return cli.matchTitles.some((t) => title.includes(t));
  });
}

function extractWithPattern(text, pattern) {
  if (pattern.type === 'contains') {
    const idx = text.toLowerCase().lastIndexOf(pattern.value.toLowerCase());
    if (idx < 0) return null;
    return slicePrompt(text, idx);
  }
  const re = new RegExp(pattern.value, 'gim');
  let match;
  let last = null;
  while ((match = re.exec(text))) last = match;
  if (!last) return null;
  if (last.groups?.prompt) return capPrompt(last.groups.prompt.trim());
  if (last[1]) return capPrompt(last[1].trim());
  return slicePrompt(text, last.index);
}

function slicePrompt(text, idx) {
  const from = text.lastIndexOf('\n', idx);
  const start = from < 0 ? 0 : from + 1;
  const chunk = text.slice(start).split('\n').slice(0, 12).join('\n').trim();
  return capPrompt(chunk);
}

export function detectPrompt(paneText, agent, clis) {
  const text = String(paneText || '');
  if (!text.trim()) return null;
  const kind = inferCliKind(agent);
  const candidates = matchingClis(clis, kind, agent);
  for (const cli of candidates) {
    for (const pattern of cli.patterns) {
      try {
        const found = extractWithPattern(text, pattern);
        if (found) return { cli: cli.id, text: found };
      } catch {
        // bad regex in config: skip
      }
    }
  }
  if (String(agent.agent_status).toLowerCase() === 'blocked') {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const tail = lines.slice(-8).join('\n');
    if (tail) return { cli: kind, text: capPrompt(tail) };
  }
  return null;
}

export function detectError(paneText) {
  const text = String(paneText || '');
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (ERROR_RE.test(lines[i])) {
      return capError(
        lines
          .slice(Math.max(0, i - 1), i + 2)
          .join('\n')
          .trim(),
      );
    }
  }
  return null;
}
