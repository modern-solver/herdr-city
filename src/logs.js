/**
 * Purpose: bounded in-memory event log. Mask full text before any cap (SEC-03).
 * Owner: builder-grok
 */
import { maskSecrets } from './mask.js';

export const MAX_EVENTS = 500;
export const MAX_CHARS = 262144;
export const LOG_TEXT_MAX = 800;

export function maskThenClip(text) {
  const masked = maskSecrets(String(text ?? ''));
  if (masked.length <= LOG_TEXT_MAX) return masked;
  return masked.slice(-LOG_TEXT_MAX);
}

export function parseLogQuery(searchParams) {
  const limitRaw = searchParams.get('limit');
  let limit = 100;
  if (limitRaw != null && limitRaw !== '') {
    const n = Number(limitRaw);
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      return { ok: false, message: 'limit must be an integer 1-200' };
    }
    limit = n;
  }
  const afterRaw = searchParams.get('after');
  let after = null;
  if (afterRaw != null && afterRaw !== '') {
    const n = Number(afterRaw);
    if (!Number.isFinite(n)) {
      return { ok: false, message: 'after must be a unix ms timestamp' };
    }
    after = n;
  }
  return { ok: true, after, limit };
}

function sessionFields(s) {
  return {
    paneId: s.paneId ?? null,
    districtId: s.districtId ?? null,
    districtTitle: s.districtTitle ?? null,
    name: s.name ?? null,
  };
}

export function collectTickEvents({ prevByPane, sessions, ts, adapterError }) {
  const events = [];
  if (adapterError) {
    events.push({
      type: 'adapter_error',
      paneId: null,
      districtId: null,
      districtTitle: null,
      name: null,
      fromStatus: null,
      toStatus: null,
      text: adapterError,
      ts,
    });
    return events;
  }
  const live = new Set(sessions.map((s) => s.paneId));
  for (const s of sessions) {
    const prev = prevByPane.get(s.paneId);
    const fromStatus = prev ? prev.status : null;
    const fields = sessionFields(s);
    if (fromStatus !== s.status) {
      events.push({
        type: 'status_change',
        ...fields,
        fromStatus,
        toStatus: s.status,
        text: s.activity || `${fromStatus || 'none'} -> ${s.status}`,
        ts,
      });
    }
    if (s.status === 'blocked' && s.prompt != null) {
      const dup = prev && prev.status === 'blocked' && prev.prompt === s.prompt;
      if (!dup) {
        events.push({
          type: 'needs_you',
          ...fields,
          fromStatus,
          toStatus: s.status,
          text: s.prompt,
          ts,
        });
      }
    }
    if (prev && prev.status === 'blocked' && s.status !== 'blocked') {
      events.push({
        type: 'needs_you_cleared',
        ...fields,
        fromStatus: 'blocked',
        toStatus: s.status,
        text: prev.prompt || '',
        ts,
      });
    }
    if (s.error && (!prev || !prev.error)) {
      events.push({
        type: 'error',
        ...fields,
        fromStatus,
        toStatus: s.status,
        text: s.error,
        ts,
      });
    }
  }
  for (const [paneId, prev] of prevByPane) {
    if (live.has(paneId) || prev.status !== 'blocked') continue;
    events.push({
      type: 'needs_you_cleared',
      paneId,
      districtId: prev.districtId ?? null,
      districtTitle: prev.districtTitle ?? null,
      name: prev.name ?? null,
      fromStatus: 'blocked',
      toStatus: null,
      text: prev.prompt || '',
      ts,
    });
  }
  return events;
}

export function createLogBuffer() {
  const events = [];
  let nextId = 1;

  function occupancy() {
    let chars = 0;
    for (const e of events) chars += e.text.length;
    return { count: events.length, chars };
  }

  function trim() {
    let { chars } = occupancy();
    while (events.length > MAX_EVENTS || chars > MAX_CHARS) {
      const old = events.shift();
      chars -= old.text.length;
    }
  }

  function append(partial, ts) {
    const ev = {
      id: `log-${nextId++}`,
      ts,
      type: partial.type,
      paneId: partial.paneId ?? null,
      districtId: partial.districtId ?? null,
      districtTitle: partial.districtTitle ?? null,
      name: partial.name ?? null,
      fromStatus: partial.fromStatus ?? null,
      toStatus: partial.toStatus ?? null,
      text: maskThenClip(partial.text),
    };
    events.push(ev);
    trim();
    return ev;
  }

  function query({ after = null, limit = 100 } = {}) {
    let out = events.slice().reverse();
    if (after != null) out = out.filter((e) => e.ts > after);
    return out.slice(0, limit);
  }

  function bounded() {
    const { count, chars } = occupancy();
    return { maxEvents: MAX_EVENTS, maxChars: MAX_CHARS, count, chars };
  }

  return { append, query, bounded };
}
