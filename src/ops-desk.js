/**
 * Purpose: build GET /api/ops-desk queue of blocked sessions that have a prompt.
 * Owner: builder-grok
 */

export function opsDeskId(paneId, agent) {
  const seq = agent?.state_change_seq ?? agent?.revision ?? 0;
  return `${paneId}:${seq}`;
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
