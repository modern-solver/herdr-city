import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter } from '../src/adapter.js';
import { createFixtureClient, loadFixtureBundle } from '../src/fixtures.js';
import { extractAgents } from '../src/herdr-cli.js';
import { fingerprint } from '../src/map.js';

test('fixture bundle has several districts including a blocked grok prompt', () => {
  const bundle = loadFixtureBundle();
  const ws = new Set(bundle.agents.map((a) => a.workspace_id));
  assert.ok(ws.size >= 3);
  assert.ok(bundle.agents.some((a) => a.agent_status === 'blocked'));
  assert.match(bundle.panes['w8:p1'], /Allow this action/);
});

test('adapter reads panes only when the agent fingerprint changes', async () => {
  const fixture = createFixtureClient();
  let listN = 0;
  const agents = await fixture.agentList();
  const client = {
    kind: 'test',
    async agentList() {
      listN += 1;
      if (listN === 1) return agents;
      return agents.map((a) => (a.pane_id === 'w1:p1' ? { ...a, revision: a.revision + 1, agent_status: 'idle' } : a));
    },
    async workspaceList() { return fixture.workspaceList(); },
    paneRead: (id) => fixture.paneRead(id),
  };
  const adapter = createAdapter({ client, now: () => 1_700_000_000_000 });
  await adapter.tick();
  const firstReads = fixture.reads.length;
  assert.equal(firstReads, agents.length);
  await adapter.tick();
  assert.equal(fixture.reads.length, firstReads + 1);
  assert.equal(fixture.reads.at(-1), 'w1:p1');
  await adapter.stop();
});

test('fixture tick maps blocked prompt and masks secrets', async () => {
  const client = createFixtureClient();
  const adapter = createAdapter({ client, now: () => Date.now() });
  const snap = await adapter.tick();
  const atlas = snap.districts.find((d) => d.id === 'w8');
  assert.ok(atlas);
  const bot = atlas.robots[0];
  assert.equal(bot.waiting || bot.status === 'wait', true);
  assert.match(bot.prompt, /Allow this action/);
  assert.equal(bot.prompt.includes('ghp_'), false);
  assert.equal(bot.prompt.includes('sk-thisIs'), false);
  const ask = snap.asks.find((a) => a.session === 'w8');
  assert.ok(ask);
  assert.match(ask.input.command, /Allow this action/);
  const city = snap.districts.map((d) => d.title).sort();
  assert.deepEqual(city, ['atlas-api', 'etl-jobs', 'handbook', 'mastopia']);
  await adapter.stop();
});

test('fingerprint used by the adapter matches herdr AgentInfo fields', () => {
  const a = extractAgents({ result: { agents: [{ pane_id: 'w1:p1', agent_status: 'working', revision: 3, state_change_seq: 9, terminal_title_stripped: 'claude', cwd: '/x' }] } })[0];
  assert.match(fingerprint(a), /w1:p1\|working\|3\|9/);
});
