import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGame, runGameChunk, canonicalJson } from '../packages/engine/dist/index.js';
import { game } from '../packages/engine/test/fixtures.ts';

let state = createGame(game());
while (state.status !== 'FINAL') {
  const result = runGameChunk(state);
  assert.notEqual(result.stopReason, 'ENGINE_LIMIT');
  state = result.state;
}
const expected = JSON.parse(readFileSync(new URL('../packages/engine/test/golden.json', import.meta.url), 'utf8'));
const actual = createHash('sha256').update(canonicalJson(state)).digest('hex');
assert.equal(actual, expected.sha256);
console.log(`PASS: compiled engine in independent Node process matches source golden SHA256 ${actual}`);
