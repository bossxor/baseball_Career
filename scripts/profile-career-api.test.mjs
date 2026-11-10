import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';

test('season profiler rejects remote, ordinary and query-overridden database URLs without exposing credentials', () => {
  const password = 'profile-guard-secret';
  for (const connectionString of [
    `postgres://tester:${password}@example.invalid/playball_profile_test`,
    `postgres://tester:${password}@127.0.0.1/postgres`,
    `postgres://tester:${password}@127.0.0.1/playball_profile_test?host=example.invalid`,
  ]) {
    const output = path.join(os.tmpdir(), `profile-guard-${randomUUID()}.json`);
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/profile-career-api.mjs', 'us', output, '--postgres', '--no-cpu'], {
      env: {...process.env, PLAYBALL_PROFILE_DATABASE_URL: connectionString},
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30_000,
    });
    assert.equal(run.error, undefined);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Profile database must be local/);
    assert.ok(!`${run.stdout}${run.stderr}`.includes(password));
    assert.equal(existsSync(output), false);
  }
});
