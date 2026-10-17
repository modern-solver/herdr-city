import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPromptPatterns } from '../src/prompt-detect.js';
import { mapCity, setMapPatterns, fingerprint, IDLE_ASLEEP_MS } from '../src/map.js';

const clis = loadPromptPatterns();
setMapPatterns(clis);

const now = 1_700_000_000_000;

test('fingerprint changes when status or revision changes', () => {
  const a = { pane_id: 'w1:p1', agent_status: 'working', revision: 1, state_change_seq: 1 };
  const b = { ...a, agent_status: 'blocked' };
  const c = { ...a, revision: 2 };
  assert.notEqual(fingerprint(a), fingerprint(b));
  assert.notEqual(fingerprint(a), fingerprint(c));
  assert.equal(fingerprint(a), fingerprint({ ...a }));
});

test('maps workspace to district and agent to robot with model badge', () => {
  const { docs, robots } = mapCity({
    now,
    lastActive: { 'w1:p1': now, 'w1:p2': now },
    workspaces: [{ workspace_id: 'w1', label: 'herdr-city' }],
    agents: [
      { name: 'reviewer', agent: 'claude', pane_id: 'w1:p1', workspace_id: 'w1', agent_status: 'working', tokens: { model: 'claude-opus' } },
      { name: 'tester', agent: 'claude', pane_id: 'w1:p2', workspace_id: 'w1', agent_status: 'idle', tokens: { model: 'claude-sonnet' } },
    ],
    panes: { 'w1:p1': 'thinking', 'w1:p2': 'idle' },
  });
  assert.equal(docs.length, 1);
  assert.equal(docs[0].id, 'w1');
  assert.equal(docs[0].title, 'herdr-city');
  assert.equal(docs[0].agents[0].id, 'main');
  assert.equal(docs[0].agents[0].name, 'reviewer');
  assert.equal(docs[0].agents[0].model, 'claude-opus');
  assert.equal(docs[0].agents[0].status, 'working');
  assert.equal(robots[1].name, 'tester');
});

test('blocked becomes amber wait with Needs you ask carrying prompt text', () => {
  const pane = 'Needs your approval\nAllow this action?\nRun: npm test\n';
  const { docs, asks } = mapCity({
    now,
    lastActive: { 'w8:p1': now },
    workspaces: [{ workspace_id: 'w8', label: 'atlas-api' }],
    agents: [{ name: 'grok-api', agent: 'grok', pane_id: 'w8:p1', workspace_id: 'w8', agent_status: 'blocked', tokens: { model: 'grok-4' } }],
    panes: { 'w8:p1': pane },
  });
  assert.equal(docs[0].agents[0].waiting, true);
  assert.equal(docs[0].agents[0].kind, 'wait');
  assert.equal(asks.length, 1);
  assert.match(asks[0].input.command, /Allow this action/);
  assert.equal(asks[0].state, 'terminal');
});

test('error text on screen maps to red error', () => {
  const { docs } = mapCity({
    now,
    lastActive: { 'w2:p1': now },
    agents: [{ name: 'broken', agent: 'claude', pane_id: 'w2:p1', workspace_id: 'w2', agent_status: 'working' }],
    panes: { 'w2:p1': 'error: make failed\nFAILED tests' },
  });
  assert.equal(docs[0].agents[0].status, 'error');
  assert.equal(docs[0].agents[0].kind, 'error');
});

test('idle longer than 10 minutes keeps a stale updatedAt for dim/asleep', () => {
  const idleSince = now - IDLE_ASLEEP_MS - 1000;
  const { docs } = mapCity({
    now,
    lastActive: { 'wD:p1': idleSince },
    agents: [{ name: 'docs-bot', agent: 'gemini', pane_id: 'wD:p1', workspace_id: 'wD', agent_status: 'idle' }],
    panes: { 'wD:p1': 'idle' },
  });
  assert.equal(docs[0].updatedAt, idleSince);
  assert.ok(now - docs[0].updatedAt > IDLE_ASLEEP_MS);
});
