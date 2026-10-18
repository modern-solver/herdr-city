/**
 * Purpose: shared leak-test helpers. boundaryText straddles the TAIL cut; assertClean rejects tokens and prefixes.
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

/** Prefixes of length >= 4 that must never appear unmasked (task-2145). */
export const LEAK_PREFIXES = ['ghp_', 'sk-a', 'sk-ab', 'sk-abc', 'AKIA', 'eyJh', 'eyJhb', 'eyJhbG'];

/**
 * Place `token` so it straddles the TAIL cut at (len - max).
 * Without mask-first, the kept tail would start mid-token.
 * Pad with `#` so ghp_/JWT regexes cannot eat the filler (not in [A-Za-z0-9_-]).
 */
export function boundaryText(max, token) {
  const t = String(token);
  const overlap = Math.min(4, t.length);
  return `${t}${'#'.repeat(Math.max(0, max - overlap))}`;
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
  }
  for (const prefix of LEAK_PREFIXES) {
    assert.equal(s.includes(prefix), false, `named prefix leaked: ${prefix}`);
  }
  assert.equal(s.includes(MASK), true);
}
