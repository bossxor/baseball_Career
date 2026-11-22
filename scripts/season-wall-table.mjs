import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const leagues = ['school', 'college', 'kbo', 'us'];
const engineKeys = ['simulation', 'dayClose', 'validation', 'clone', 'seal', 'residualMs'];
const saveKeys = ['serializationMs', 'hashingMs', 'sqlWriteMs'];

function milliseconds(value, key) {
  assert.ok(Number.isFinite(value) && value >= 0, 'Invalid wall time: ' + key);
  return value;
}

export function seasonWallTable(reports) {
  assert.deepEqual(reports.map(r => r.league).sort(), [...leagues].sort(), 'Expected one complete profile per league');
  const rows = [];
  for (const league of leagues) {
    const r = reports.find(report => report.league === league);
    assert.ok(['postgres', 'pglite'].includes(r.backend) && r.status === 'season_review' &&
      r.finalPhase === 'SEASON_REVIEW' && r.initialHashUnchanged === true &&
      [r.initialHash, r.finalHash].every(hash => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)) &&
      Number.isSafeInteger(r.finalGames) && r.finalGames > 0, 'Incomplete season: ' + league);
    assert.ok(r.method === 'CPU profiling disabled' || (!r.method && r.command?.split(/\s+/).includes('--no-cpu')), 'Expected --no-cpu: ' + league);
    assert.ok(!r.memoryMode && !r.command?.split(/\s+/).includes('--memory'), 'Expected memory diagnostics off: ' + league);
    for (const key of ['backend', 'databaseVersion', 'node', 'platform', 'arch', 'fixture', 'engineTimingMethod', 'saveTimingMethod']) {
      assert.ok(typeof r[key] === 'string' && r[key] && r[key] === reports[0][key], 'Incompatible profile field: ' + key);
    }
    const count = r.commands?.length ?? r.commandCount;
    const engine = r.engineTimingTotals;
    assert.ok(Number.isSafeInteger(count) && count > 0 && engine?.measuredCommands === count, 'Incomplete engine timing: ' + league);
    let save = r.saveTimingTotals;
    if (!save && r.commands) {
      save = { measuredCommands: count };
      for (const key of saveKeys) save[key] = r.commands.reduce((sum, c) => sum + milliseconds(c.saveTiming?.[key], key), 0);
    }
    assert.equal(save?.measuredCommands, count, 'Incomplete save timing: ' + league);
    const times = Object.fromEntries(engineKeys.map(key => [key, milliseconds(engine[key], key)]));
    const engineMs = Object.values(times).reduce((sum, ms) => sum + ms, 0);
    assert.ok(Math.abs(engineMs - milliseconds(engine.elapsedMs, 'engine.elapsedMs')) < 0.01, 'Overlapping engine categories: ' + league);
    for (const key of saveKeys) times[key] = milliseconds(save[key], key);
    const measured = Object.values(times).reduce((sum, ms) => sum + ms, 0);
    assert.ok(Number.isFinite(r.wallMs) && r.wallMs > 0 && measured <= r.wallMs + 0.01, 'Invalid season wall total: ' + league);
    times.outsideEngineAndWrites = Math.max(0, r.wallMs - measured);
    const categories = Object.fromEntries(Object.entries(times).map(([key, ms]) => [key, { ms, percent: 100 * ms / r.wallMs }]));
    const topThree = Object.keys(times).sort((a, b) => times[b] - times[a]).slice(0, 3);
    const row = { league, games: r.finalGames, commands: count, wallMs: r.wallMs, initialHash: r.initialHash, finalHash: r.finalHash, categories, topThree };
    if (league === 'kbo' && Object.hasOwn(engine, 'gameContext')) {
      const ms = milliseconds(engine.gameContext, 'gameContext');
      assert.ok(ms <= times.residualMs, 'Game context exceeds engine residual');
      row.engineResidualDetail = { gameContext: { ms, percent: 100 * ms / r.wallMs } };
    }
    rows.push(row);
  }
  return rows;
}

export function assertSeasonReplayEquivalent(before, after) {
  for (const report of [before, after]) {
    assert.ok(leagues.includes(report.league) && report.status === 'season_review' &&
      report.finalPhase === 'SEASON_REVIEW' && report.initialHashUnchanged === true &&
      Number.isSafeInteger(report.finalGames) && report.finalGames > 0, 'Expected a completed season');
    for (const key of ['initialHash', 'commandSequenceHash', 'finalHash']) {
      assert.match(report[key] ?? '', /^[a-f0-9]{64}$/, 'Expected SHA-256: ' + key);
    }
  }
  for (const key of ['league', 'initialHash', 'commandSequenceHash', 'finalGames', 'finalHash']) {
    assert.equal(after[key], before[key], 'Season replay differs: ' + key);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const read = path => JSON.parse(readFileSync(path, 'utf8'));
  if (args[0] === '--compare') {
    assert.equal(args.length, 3, 'Expected --compare before.json after.json');
    const before = read(args[1]), after = read(args[2]);
    assertSeasonReplayEquivalent(before, after);
    console.log(JSON.stringify({ equivalent: true, league: after.league, finalHash: after.finalHash }));
  } else {
    console.log(JSON.stringify(seasonWallTable(args.map(read)), null, 2));
  }
}
