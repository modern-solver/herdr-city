import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectError, detectPrompt, inferCliKind, loadPromptPatterns } from '../src/prompt-detect.js';

const clis = loadPromptPatterns();

test('infers CLI kind from agent / title / model', () => {
  assert.equal(inferCliKind({ agent: 'claude' }), 'claude');
  assert.equal(inferCliKind({ terminal_title: 'grok · api' }), 'grok');
  assert.equal(inferCliKind({ tokens: { model: 'gemini-2.5-pro' } }), 'gemini');
});

test('detects Claude permission prompt', () => {
  const text = 'Claude needs permission to run a command.\nBash command\nnpm test\nDo you want to proceed?';
  const found = detectPrompt(text, { agent: 'claude' }, clis);
  assert.ok(found);
  assert.equal(found.cli, 'claude');
  assert.match(found.text, /proceed|Bash command|permission/i);
});

test('detects Grok approval prompt', () => {
  const found = detectPrompt('Allow this action?\ngh api foo', { agent: 'grok' }, clis);
  assert.ok(found);
  assert.equal(found.cli, 'grok');
  assert.match(found.text, /Allow this action/);
});

test('detects Gemini allow-execution prompt', () => {
  const found = detectPrompt('Gemini CLI wants to run\nAllow execution?\nls', { agent: 'gemini' }, clis);
  assert.ok(found);
  assert.equal(found.cli, 'gemini');
});

test('blocked without a known banner still returns the pane tail', () => {
  const found = detectPrompt('weird ui\nreally?\nlast line', { agent: 'codex', agent_status: 'blocked' }, clis);
  assert.ok(found);
  assert.match(found.text, /last line/);
});

test('detectError finds trailing error lines', () => {
  const err = detectError('ok\nerror: boom\nFAILED x');
  assert.match(err, /error: boom/);
  assert.equal(detectError('all good'), null);
});
