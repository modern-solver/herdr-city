import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractAgents, extractJson, extractPaneText, extractWorkspaces, assertReadOnly } from '../src/herdr-cli.js';

const LIST = {
  id: 'cli:agent:list',
  result: {
    type: 'agent_list',
    agents: [
      { name: 'reviewer', agent: 'claude', pane_id: 'w1:p1', workspace_id: 'w1', agent_status: 'working', revision: 1 },
    ],
  },
};

test('extractAgents reads herdr agent.list result.agents', () => {
  assert.equal(extractAgents(LIST).length, 1);
  assert.equal(extractAgents(LIST)[0].pane_id, 'w1:p1');
  assert.equal(extractAgents(LIST)[0].agent, 'claude');
});

test('extractAgents accepts a bare array', () => {
  assert.equal(extractAgents([{ pane_id: 'w1:p2' }])[0].pane_id, 'w1:p2');
});

test('extractJson finds the last object in noisy stdout', () => {
  const json = extractJson('note\n' + JSON.stringify(LIST));
  assert.equal(json.result.type, 'agent_list');
});

test('extractWorkspaces reads workspace_list', () => {
  const ws = extractWorkspaces({ result: { workspaces: [{ workspace_id: 'w8', label: 'atlas-api' }] } });
  assert.equal(ws[0].label, 'atlas-api');
});

test('extractPaneText uses stdout, or result.read.text when JSON', () => {
  assert.equal(extractPaneText('hello pane'), 'hello pane');
  assert.equal(extractPaneText(JSON.stringify({ result: { type: 'pane_read', read: { text: 'from json' } } })), 'from json');
});

test('assertReadOnly allows list/read and rejects writes', () => {
  assertReadOnly(['agent', 'list']);
  assertReadOnly(['pane', 'read', 'w1:p1']);
  assertReadOnly(['workspace', 'list']);
  assert.throws(() => assertReadOnly(['pane', 'send-keys', 'w1:p1', 'y']), /refusing|only allows/);
  assert.throws(() => assertReadOnly(['server', 'stop']), /only allows|refusing/);
  assert.throws(() => assertReadOnly(['agent', 'prompt', 'reviewer', 'hi']), /only allows|refusing/);
});
