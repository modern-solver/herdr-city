/**
 * Purpose: build GET /api/screen payload from cached pane text and session.
 * Owner: builder-grok
 */
import { maskThenTruncate } from './output-filter.js';

export const SCREEN_CAP = 80000;

export function capPaneText(text) {
  return maskThenTruncate(text, SCREEN_CAP, { keep: 'tail' });
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
