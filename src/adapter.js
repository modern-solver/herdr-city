import { fingerprint } from './map.js';
import { mapCity, setMapPatterns, snapshotPayload } from './map.js';
import { loadPromptPatterns } from './prompt-detect.js';
import { DEFAULT_PATTERNS_PATH } from './paths.js';
import { mapSessions } from './sessions.js';

const POLL_MS = 2000;

export function createAdapter({ client, patternsPath = DEFAULT_PATTERNS_PATH, now = () => Date.now() }) {
  const clis = loadPromptPatterns(patternsPath);
  setMapPatterns(clis);
  const paneCache = new Map(); // pane_id -> { fp, text }
  const lastActive = {};
  let lastSnapshot = snapshotPayload({ docs: [], asks: [], robots: [], mode: client.kind, error: null });
  let lastSessions = [];
  let listeners = new Set();
  let timer = null;
  let started = false;

  async function tick() {
    let agents = [];
    let workspaces = [];
    let error = null;
    try {
      agents = await client.agentList();
      workspaces = await client.workspaceList();
    } catch (err) {
      error = String(err.message || err);
      lastSnapshot = { ...lastSnapshot, error, generatedAt: now() };
      emit();
      return lastSnapshot;
    }

    const t = now();
    for (const agent of agents) {
      const fp = fingerprint(agent);
      const prev = paneCache.get(agent.pane_id);
      const status = String(agent.agent_status || '').toLowerCase();
      if (status === 'working' || status === 'blocked' || status === 'waiting') {
        lastActive[agent.pane_id] = t;
      } else if (lastActive[agent.pane_id] == null) {
        const idleFor = Number(agent._idle_for_ms);
        lastActive[agent.pane_id] = Number.isFinite(idleFor) ? t - idleFor : t;
      }
      if (!prev || prev.fp !== fp) {
        try {
          const text = await client.paneRead(agent.pane_id);
          paneCache.set(agent.pane_id, { fp, text: String(text || '') });
        } catch (err) {
          paneCache.set(agent.pane_id, { fp, text: prev?.text || '' });
          error = error || String(err.message || err);
        }
      }
    }
    const livePanes = new Set(agents.map((a) => a.pane_id));
    for (const id of paneCache.keys()) {
      if (!livePanes.has(id)) paneCache.delete(id);
    }

    const panes = {};
    for (const [id, v] of paneCache) panes[id] = v.text;
    const mapped = mapCity({ agents, workspaces, panes, now: t, lastActive });
    lastSnapshot = snapshotPayload({ ...mapped, mode: client.kind, error });
    lastSnapshot.docs = mapped.docs;
    lastSessions = mapSessions({
      agents,
      workspaces,
      panes,
      lastActive,
      now: t,
      clis,
    });
    emit();
    return lastSnapshot;
  }

  function emit() {
    for (const fn of listeners) fn(lastSnapshot);
  }

  return {
    getSnapshot() { return lastSnapshot; },
    getSessions() {
      return {
        generatedAt: lastSnapshot.generatedAt,
        mode: lastSnapshot.mode,
        error: lastSnapshot.error,
        sessions: lastSessions,
      };
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async start() {
      if (started) return;
      started = true;
      await tick();
      timer = setInterval(() => { tick().catch(() => {}); }, POLL_MS);
      if (typeof timer.unref === 'function') timer.unref();
    },
    async stop() {
      started = false;
      if (timer) clearInterval(timer);
      timer = null;
    },
    tick,
  };
}
