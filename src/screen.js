/**
 * Purpose: build GET /api/screen payload from cached pane text and session.
 * Owner: builder-grok
 */
import { maskSecrets } from './mask.js';

export const SCREEN_CAP = 80000;

export function capPaneText(text) {
  const masked = maskSecrets(String(text ?? ''));
  if (masked.length <= SCREEN_CAP) return { text: masked, truncated: false };
  return { text: masked.slice(-SCREEN_CAP), truncated: true };
}

export function lineCount(text) {
  const s = String(text ?? '');
  if (s === '') return 0;
  return s.split('\n').length;
}

export function buildScreen({ paneId, rawText, truncated, updatedAt, session }) {
  const capped = capPaneText(rawText);
  return {
    v: 1,
    paneId,
    updatedAt,
    lineCount: lineCount(capped.text),
    truncated: Boolean(truncated) || capped.truncated,
    text: capped.text,
    session,
  };
}
