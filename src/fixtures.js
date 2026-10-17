import fs from 'node:fs';
import path from 'node:path';
import { extractAgents, extractWorkspaces } from './herdr-cli.js';
import { FIXTURES_DIR } from './paths.js';

export function loadFixtureBundle(dir = FIXTURES_DIR) {
  const list = JSON.parse(fs.readFileSync(path.join(dir, 'agent-list.json'), 'utf8'));
  const workspaces = JSON.parse(fs.readFileSync(path.join(dir, 'workspace-list.json'), 'utf8'));
  const panesDir = path.join(dir, 'panes');
  const panes = {};
  for (const name of fs.readdirSync(panesDir)) {
    if (!name.endsWith('.txt')) continue;
    const id = name.replace(/\.txt$/, '').replace(/_/g, ':');
    panes[id] = fs.readFileSync(path.join(panesDir, name), 'utf8');
  }
  return {
    agents: extractAgents(list),
    workspaces: extractWorkspaces(workspaces),
    panes,
  };
}

export function createFixtureClient(dir = FIXTURES_DIR) {
  const bundle = loadFixtureBundle(dir);
  const reads = [];
  const fps = new Map();
  return {
    kind: 'fixture',
    reads,
    async agentList() {
      return bundle.agents.map((a) => ({ ...a }));
    },
    async workspaceList() {
      return bundle.workspaces.map((w) => ({ ...w }));
    },
    async paneRead(paneId) {
      reads.push(paneId);
      const text = bundle.panes[paneId];
      if (text == null) throw new Error(`no fixture pane for ${paneId}`);
      fps.set(paneId, (fps.get(paneId) || 0) + 1);
      return text;
    },
  };
}
