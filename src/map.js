import path from 'node:path';
import { detectError, detectPrompt, inferCliKind } from './prompt-detect.js';
import { maskThenTruncate } from './output-filter.js';

export const IDLE_ASLEEP_MS = 10 * 60 * 1000;

export function fingerprint(agent) {
  return [
    agent.pane_id,
    agent.agent_status,
    agent.revision,
    agent.state_change_seq,
    agent.terminal_title_stripped || agent.terminal_title || '',
    agent.cwd || '',
  ].join('|');
}

export function districtTitle(workspaceId, workspaces, agent) {
  const ws = workspaces.find((w) => w.workspace_id === workspaceId);
  if (ws?.label) return ws.label;
  const cwd = agent?.foreground_cwd || agent?.cwd;
  if (cwd) {
    const base = path.basename(String(cwd).replace(/[\\/]+$/, ''));
    if (base) return base;
  }
  return workspaceId || 'workspace';
}

export function agentDisplayName(agent) {
  return agent.name || agent.display_agent || agent.agent || agent.pane_id;
}

export function modelBadge(agent) {
  const tokens = agent.tokens && typeof agent.tokens === 'object' ? agent.tokens : {};
  return tokens.model || agent.display_agent || agent.agent || inferCliKind(agent);
}

export function inspectPane(rawPane, agent, clis = []) {
  const masked = maskThenTruncate(rawPane || '').text;
  return {
    masked,
    prompt: detectPrompt(masked, agent, clis),
    errorText: detectError(masked),
  };
}

export function maskedClip(text, max = 240) {
  return maskThenTruncate(text, max, { keep: 'tail' }).text;
}

function cityStatus(agentStatus, errorText, idleMs) {
  const st = String(agentStatus || 'unknown').toLowerCase();
  if (errorText) return 'error';
  if (st === 'working') return 'working';
  if (st === 'blocked') return 'idle';
  if (st === 'done') return idleMs >= IDLE_ASLEEP_MS ? 'idle' : 'done';
  if (st === 'idle' || st === 'unknown') return 'idle';
  return 'idle';
}

function kindFor(status, waiting, errorText) {
  if (errorText) return 'error';
  if (waiting) return 'wait';
  if (status === 'working') return 'think';
  if (status === 'done') return 'done';
  return 'idle';
}

export function mapCity({ agents, workspaces = [], panes = {}, now = Date.now(), lastActive = {} }) {
  const byWs = new Map();
  for (const agent of agents) {
    const ws = agent.workspace_id || 'unknown';
    if (!byWs.has(ws)) byWs.set(ws, []);
    byWs.get(ws).push(agent);
  }

  const docs = [];
  const asks = [];
  const robots = [];

  for (const [workspaceId, group] of byWs) {
    group.sort((a, b) => String(a.pane_id).localeCompare(String(b.pane_id)));
    const title = districtTitle(workspaceId, workspaces, group[0]);
    const mappedAgents = group.map((agent, i) => {
      const { prompt, errorText } = inspectPane(panes[agent.pane_id] || '', agent, mapCity._clis || []);
      const statusRaw = String(agent.agent_status || 'unknown').toLowerCase();
      const waiting = statusRaw === 'blocked' || statusRaw === 'waiting';
      const activeAt = lastActive[agent.pane_id] || now;
      const idleMs = now - activeAt;
      const status = cityStatus(statusRaw, errorText, idleMs);
      const id = i === 0 ? 'main' : String(agent.pane_id);
      const name = agentDisplayName(agent);
      const model = modelBadge(agent);
      const activity = waiting
        ? prompt?.text || 'Needs you'
        : errorText
          ? errorText.split('\n')[0]
          : agent.terminal_title_stripped || agent.title || (status === 'working' ? 'Working' : 'Idle');
      robots.push({
        id,
        workspaceId,
        paneId: agent.pane_id,
        name,
        model,
        herdrStatus: statusRaw,
        cityStatus: waiting ? 'wait' : status,
        waiting,
        prompt: prompt?.text || null,
        error: errorText,
        idleMs,
      });
      if (waiting && prompt?.text) {
        asks.push({
          id: `${agent.pane_id}:${agent.state_change_seq || agent.revision || 'p'}`,
          session: workspaceId,
          agent: id,
          tool: 'Prompt',
          input: { command: prompt.text },
          since: activeAt,
          until: null,
          state: 'terminal',
          terminalOnly: true,
        });
      }
      return {
        id,
        name,
        role: model,
        type: i === 0 ? 'lead' : inferCliKind(agent),
        status,
        kind: kindFor(status, waiting, errorText),
        tool: waiting ? 'Prompt' : '',
        activity: maskedClip(activity, 240),
        activitySince: activeAt,
        parent: i === 0 ? null : 'main',
        waiting,
        tools: 0,
        model,
        paneId: agent.pane_id,
        herdrStatus: statusRaw,
      };
    });

    const newest = Math.max(...mappedAgents.map((a) => a.activitySince), 0);
    const waitingAgent = mappedAgents.find((a) => a.waiting);
    const headline =
      waitingAgent?.activity ||
      mappedAgents.find((a) => a.status === 'error')?.activity ||
      mappedAgents.find((a) => a.status === 'working')?.activity ||
      'On screen';
    const startedAt = Math.min(...group.map((a) => lastActive[a.pane_id] || now));

    docs.push({
      v: 2,
      id: workspaceId,
      title,
      headline: maskedClip(headline, 240),
      startedAt,
      updatedAt: waitingAgent ? now : newest,
      turns: 0,
      tokens: { total: 0, in: 0, out: 0, cw: 0, cr: 0, helpers: [] },
      waiting: waitingAgent ? { agent: waitingAgent.id, tool: 'Prompt', since: waitingAgent.activitySince } : null,
      agents: mappedAgents,
      feed: mappedAgents
        .map((a) => ({
          ts: a.activitySince,
          agent: a.name,
          agentId: a.id,
          kind: a.kind,
          text: a.activity,
        }))
        .sort((x, y) => y.ts - x.ts)
        .slice(0, 50),
    });
  }

  return { docs, asks, robots };
}

mapCity._clis = [];
export function setMapPatterns(clis) {
  mapCity._clis = clis;
}

export function snapshotPayload({ docs, asks, robots, mode, error }) {
  return {
    v: 1,
    mode,
    generatedAt: Date.now(),
    error: error || null,
    docs,
    districts: docs.map((d) => ({
      id: d.id,
      title: d.title,
      headline: d.headline,
      waiting: !!d.waiting,
      robots: d.agents.map((a) => ({
        id: a.id,
        name: a.name,
        model: a.model,
        status: a.waiting ? 'wait' : a.status,
        paneId: a.paneId,
        activity: a.activity,
        prompt: asks.find((q) => q.session === d.id && q.agent === a.id)?.input?.command || null,
      })),
    })),
    asks,
    robots,
  };
}
