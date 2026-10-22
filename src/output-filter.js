/**
 * Purpose: mask full text then truncate. Shared by screen, sessions and city output.
 * Owner: builder-grok
 */
import { maskSecrets } from './mask.js';

export function maskThenTruncate(text, maxChars, { keep = 'tail' } = {}) {
  const masked = maskSecrets(String(text ?? ''));
  if (maxChars == null || !Number.isFinite(maxChars) || masked.length <= maxChars) {
    return { text: masked, truncated: false };
  }
  const cut = keep === 'head' ? masked.slice(0, maxChars) : masked.slice(-maxChars);
  return { text: cut, truncated: true };
}
