import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { seasonWallTable } from './season-wall-table.mjs';

const school = JSON.parse(readFileSync(new URL('../docs/implementation/evidence/M2-20261121-school-profile-smoke.json', import.meta.url)));
const examples = () => ['school', 'college', 'kbo', 'us'].map(league => ({ ...structuredClone(school), league }));

test('exclusive categories including both residuals cover the measured season', () => {
  const reports = examples();
  // Also accept raw files from the profiler before saveTimingTotals was emitted.
  const raw = reports[1];
  raw.commands = [{ saveTiming: raw.saveTimingTotals }];
  raw.engineTimingTotals.measuredCommands = 1;
  delete raw.saveTimingTotals;
  reports[2].engineTimingTotals.gameContext = 500;
  const rows = seasonWallTable(reports.reverse());
  assert.deepEqual(rows.map(r => r.league), ['school', 'college', 'kbo', 'us']);
  for (const row of rows) {
    assert.deepEqual(row.topThree, ['outsideEngineAndWrites', 'residualMs', 'sqlWriteMs']);
    assert.ok(Math.abs(Object.values(row.categories).reduce((sum, c) => sum + c.percent, 0) - 100) < 1e-8);
  }
  assert.equal(rows[2].engineResidualDetail.gameContext.ms, 500);
});

test('partial, mixed and double-counted profiles cannot produce a baseline', () => {
  const changes = [
    r => r.pop(),
    r => { r[1].league = 'us'; },
    r => { r[0].status = 'unsupported_event'; },
    r => { r[0].backend = 'postgres'; },
    r => { r[1].command += ' --memory'; },
    r => { r[1].method = 'CPU samples'; },
    r => { r[1].saveTimingTotals.measuredCommands--; },
    r => { r[1].engineTimingTotals.clone++; },
    r => { r[1].wallMs = 1; },
    r => { r[2].engineTimingTotals.gameContext = r[2].engineTimingTotals.residualMs + 1; },
  ];
  for (const change of changes) {
    const reports = examples();
    change(reports);
    assert.throws(() => seasonWallTable(reports));
  }
});
