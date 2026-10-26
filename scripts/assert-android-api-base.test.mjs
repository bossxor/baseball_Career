import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = join(dirname(fileURLToPath(import.meta.url)), 'assert-android-api-base.mjs');

function run(env) {
  return spawnSync(process.execPath, [script], { env: { ...process.env, ...env }, encoding: 'utf8' });
}

test('assert-android-api-base rejects local and accepts https remote', () => {
  assert.notEqual(run({ VITE_API_BASE: '' }).status, 0);
  assert.notEqual(run({ VITE_API_BASE: 'http://example.com' }).status, 0);
  assert.notEqual(run({ VITE_API_BASE: 'https://127.0.0.1:3001' }).status, 0);
  assert.notEqual(run({ VITE_API_BASE: 'https://localhost' }).status, 0);
  const ok = run({ VITE_API_BASE: 'https://api.againplayball.kr' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /OK Android API base/);
});
