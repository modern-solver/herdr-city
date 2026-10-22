/**
 * Purpose: shared leak-test helpers. boundaryText straddles the cut; assertClean rejects tokens, prefixes, suffixes.
 * Owner: builder-grok
 */
import assert from 'node:assert/strict';
import { MASK } from '../../src/mask.js';

export const GHP = 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signaturepartshere';
export const SK = 'sk-abcdefghijklmnopqrstuvwxyz123456';
export const AKIA = 'AKIAIOSFODNN7EXAMPLE';
export const LEAK_TOKENS = [GHP, JWT, SK, AKIA];
export const TOKS = ` ${GHP} ${JWT} ${SK} ${AKIA} `;

/** Prefixes of length >= 4 that must never appear unmasked. */
export const LEAK_PREFIXES = ['ghp_', 'sk-a', 'sk-ab', 'sk-abc', 'AKIA', 'eyJh', 'eyJhb', 'eyJhbG'];

/**
 * Place `token` so it straddles the cut.
 * keep tail (default): token + pad + tail; cut at (len - max) falls inside token.
 * keep head: pad + token + tail; cut at max falls inside token.
 * Pad with `#` so ghp_/JWT regexes cannot eat the filler.
 */
export function boundaryText(max, token, tail = '', { keep = 'tail' } = {}) {
  const t = String(token);
  const end = String(tail);
  const overlap = Math.min(16, t.length);
  if (keep === 'head') {
    return `${'#'.repeat(Math.max(0, max - overlap))}${t}${end}`;
  }
  const pad = Math.max(0, max - overlap - end.length);
  return `${t}${'#'.repeat(pad)}${end}`;
}

/** Naive slice must start (tail) or end (head) inside `token`. */
export function assertCutInsideToken(raw, max, token, { keep = 'tail' } = {}) {
  const t = String(token);
  const s = String(raw);
  if (keep === 'head') {
    const kept = s.slice(0, max);
    let ok = false;
    for (let k = 1; k < t.length; k += 1) {
      if (kept.endsWith(t.slice(0, k))) {
        ok = true;
        break;
      }
    }
    assert.equal(ok, true, 'naive head cut must end inside token');
    return;
  }
  const kept = s.slice(-max);
  let ok = false;
  for (let k = 1; k < t.length; k += 1) {
    if (kept.startsWith(t.slice(k))) {
      ok = true;
      break;
    }
  }
  assert.equal(ok, true, 'naive tail cut must start inside token');
}

export function assertClean(json, tokens = LEAK_TOKENS) {
  const s = typeof json === 'string' ? json : JSON.stringify(json);
  for (const token of tokens) {
    assert.equal(s.includes(token), false, `full token leaked`);
    const nMax = Math.min(token.length, 12);
    for (let n = 4; n <= nMax; n += 1) {
      const prefix = token.slice(0, n);
      assert.equal(s.includes(prefix), false, `partial prefix leaked: ${prefix}`);
    }
    const sMax = Math.min(token.length, 16);
    for (let n = 8; n <= sMax; n += 1) {
      const suffix = token.slice(-n);
      assert.equal(s.includes(suffix), false, `partial suffix leaked: ${suffix}`);
    }
  }
  for (const prefix of LEAK_PREFIXES) {
    assert.equal(s.includes(prefix), false, `named prefix leaked: ${prefix}`);
  }
  assert.equal(s.includes(MASK), true);
}
