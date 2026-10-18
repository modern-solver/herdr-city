/**
 * Purpose: build GET /api/screen payload from cached pane text and session.
 * Owner: builder-grok
 */
import { maskSecrets } from './mask.js';

export const SCREEN_CAP = 80000;

export function capPaneText(text) {
  const raw = String(text ?? '');
  if (raw.length <= SCREEN_CAP) return { text: raw, truncated: false };
  return { text: raw.slice(0, SCREEN_CAP), truncated: true };
}

export function lineCount(text) {
  const s = String(text ?? '');
  if (s === '') return 0;
  return s.split('\n').length;
}

export function buildScreen({ paneId, rawText, truncated, updatedAt, session }) {
  const text = maskSecrets(rawText || '');
  return {
    v: 1,
    paneId,
    updatedAt,
    lineCount: lineCount(text),
    truncated: Boolean(truncated),
    text,
    session,
  };
}
