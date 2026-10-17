/**
 * Purpose: fail when docs/CODEMAP.md does not match the generated tree.
 * Owner: builder-grok
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateCodemapText, CODEMAP_REL, ROOT } from '../scripts/codemap.js';

test('docs/CODEMAP.md matches generateCodemapText', () => {
  const expected = generateCodemapText(ROOT);
  const actual = fs.readFileSync(path.join(ROOT, CODEMAP_REL), 'utf8');
  assert.equal(actual, expected);
});
