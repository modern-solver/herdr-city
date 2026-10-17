import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MASK, maskSecrets } from '../src/mask.js';

test('masks token-looking strings and env assignments', () => {
  const src = [
    'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'sk-thisIsAFakeOpenAIKeyValueForTests12345',
    'AIzaSyA-fakeGoogleKey_abcdefghijklmnop',
    'xai-abcdefghijklmnopqrstuvwxyz0123456789',
    'AKIAIOSFODNN7EXAMPLE',
    'Bearer abcdefghijklmnop',
    'API_KEY=supersecretvalue',
    'password: hunter2hunter2',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signaturepartshere',
  ].join('\n');
  const out = maskSecrets(src);
  assert.equal(out.includes('ghp_'), false);
  assert.equal(out.includes('sk-thisIs'), false);
  assert.equal(out.includes('AIzaSyA'), false);
  assert.equal(out.includes('xai-abcd'), false);
  assert.equal(out.includes('AKIAIOSFODNN7EXAMPLE'), false);
  assert.equal(out.includes('abcdefghijklmnop'), false);
  assert.equal(out.includes('supersecretvalue'), false);
  assert.match(out, new RegExp(MASK));
  assert.match(out, /API_KEY=/);
});

test('leaves ordinary pane text alone', () => {
  const t = 'Working on src/adapter.js\nRead herdr-cli.js';
  assert.equal(maskSecrets(t), t);
});
