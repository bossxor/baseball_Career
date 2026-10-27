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

test('assert-android-api-base also rejects IPv6 loopback, private ranges and .localhost', () => {
  for (const base of ['https://[::1]', 'https://[fd00::1]', 'https://0.0.0.0', 'https://10.0.0.5', 'https://172.20.1.1', 'https://192.168.0.5', 'https://169.254.1.1', 'https://app.localhost', 'https://intranet', 'https://[::ffff:127.0.0.1]']) {
    assert.notEqual(run({ VITE_API_BASE: base }).status, 0, base);
  }
  assert.equal(run({ VITE_API_BASE: 'https://172.32.0.1' }).status, 0, 'only 172.16-31 is private');
});
