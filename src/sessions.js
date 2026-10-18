/**
 * Purpose: map herdr agents to console session objects and apply list filters.
 * Owner: builder-grok
 */
import { inferCliKind } from './prompt-detect.js';
import {
  agentDisplayName,
  districtTitle,
  inspectPane,
  maskedClip,
  modelBadge,
} from './map.js';

const ACTIVITY_MAX = 240;
const STATUSES = new Set(['working', 'idle', 'blocked']);

export function consoleStatus(herdrStatus) {
  const st = String(herdrStatus || '').toLowerCase();
  if (st === 'working') return 'working';
  if (st === 'blocked' || st === 'waiting') return 'blocked';
  return 'idle';
}

export function statusLabel(status) {
  if (status === 'blocked') return 'Needs you';
  if (status === 'working') return 'Working';
  return 'Idle';
}

function emptyToNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export function parseSessionFilters(searchParams) {
  const status = emptyToNull(searchParams.get('status'));
  if (status && !STATUSES.has(status)) {
    return { ok: false, message: 'status must be working, idle, or blocked' };
  }
  return {
    ok: true,
    filters: {
      district: emptyToNull(searchParams.get('district')),
      cli: emptyToNull(searchParams.get('cli')),
      model: emptyToNull(searchParams.get('model')),
      status,
      q: emptyToNull(searchParams.get('q')),
    },
  };
}

export function mapSession(agent, workspaces, paneText, lastSeenAt, clis) {
  const { prompt, errorText } = inspectPane(paneText, agent, clis);
  const status = consoleStatus(agent.agent_status);
  const cli = inferCliKind(agent);
  const cwd = agent.foreground_cwd || agent.cwd || null;
  const districtId = agent.workspace_id || 'unknown';
  const title = agent.terminal_title_stripped || agent.terminal_title || '';
  const activity = maskedClip(prompt?.text || errorText || title, ACTIVITY_MAX);
  return {
    id: agent.pane_id,
    paneId: agent.pane_id,
    districtId,
    districtTitle: districtTitle(districtId, workspaces, agent),
    name: agentDisplayName(agent),
    cli,
    model: modelBadge(agent),
    status,
    statusLabel: statusLabel(status),
    cwd,
    lastSeenAt,
    activity,
    prompt: prompt?.text || null,
    error: errorText || null,
  };
}

export function mapSessions({ agents, workspaces = [], panes = {}, lastActive = {}, now = Date.now(), clis = [] }) {
  const sessions = agents.map((agent) => {
    const lastSeenAt = lastActive[agent.pane_id] || now;
    return mapSession(agent, workspaces, panes[agent.pane_id] || '', lastSeenAt, clis);
  });
  sessions.sort((a, b) => {
    const t = String(a.districtTitle).localeCompare(String(b.districtTitle));
    if (t !== 0) return t;
    return String(a.paneId).localeCompare(String(b.paneId));
  });
  return sessions;
}

function includesInsensitive(hay, needle) {
  return String(hay || '').toLowerCase().includes(String(needle).toLowerCase());
}

export function filterSessions(sessions, filters) {
  return sessions.filter((s) => {
    if (filters.district && !includesInsensitive(s.districtId, filters.district)
      && !includesInsensitive(s.districtTitle, filters.district)) {
      return false;
    }
    if (filters.cli && String(s.cli).toLowerCase() !== String(filters.cli).toLowerCase()) {
      return false;
    }
    if (filters.model && !includesInsensitive(s.model, filters.model)) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.q) {
      const hit = [s.name, s.districtTitle, s.districtId, s.cwd, s.activity, s.cli, s.model, s.error]
        .some((field) => includesInsensitive(field, filters.q));
      if (!hit) return false;
    }
    return true;
  });
}
