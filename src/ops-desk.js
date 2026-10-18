/**
 * Purpose: build GET /api/ops-desk queue of blocked sessions that have a prompt.
 * Owner: builder-grok
 */
import { consoleStatus } from './sessions.js';

export function opsDeskId(paneId, agent) {
  const seq = agent?.state_change_seq ?? agent?.revision ?? 0;
  return `${paneId}:${seq}`;
}

export function updateBlockedSince(blockedSince, agents, t) {
  const live = new Set(agents.map((a) => a.pane_id));
  for (const agent of agents) {
    if (consoleStatus(agent.agent_status) === 'blocked') {
      if (blockedSince[agent.pane_id] == null) blockedSince[agent.pane_id] = t;
    } else {
      delete blockedSince[agent.pane_id];
    }
  }
  for (const id of Object.keys(blockedSince)) {
    if (!live.has(id)) delete blockedSince[id];
  }
  return blockedSince;
}

export function buildOpsDesk({ sessions, agents = [], blockedSince = {}, generatedAt }) {
  const byPane = new Map(agents.map((a) => [a.pane_id, a]));
  const items = sessions
    .filter((s) => s.status === 'blocked' && s.prompt != null)
    .map((s) => {
      const agent = byPane.get(s.paneId);
      const since = blockedSince[s.paneId] ?? s.lastSeenAt;
      return {
        id: opsDeskId(s.paneId, agent),
        paneId: s.paneId,
        districtId: s.districtId,
        districtTitle: s.districtTitle,
        name: s.name,
        cli: s.cli,
        model: s.model,
        prompt: s.prompt,
        since,
        waitMs: generatedAt - since,
        recommendation: null,
      };
    })
    .sort((a, b) => a.since - b.since || String(a.paneId).localeCompare(String(b.paneId)));
  return { v: 1, generatedAt, items };
}
