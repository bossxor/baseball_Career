import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { applyKboNational, kboNationalStopDay, proNationalFlow } from '../apps/api/src/career-pro-national-shell.ts';
import { canonicalSha256 as hash } from '../packages/engine/src/canonical-seal.ts';
import { advanceKboCareerRun, startKboRegularSeason } from '../packages/engine/src/kbo-progress.ts';
import { nextNationalMatch } from '../packages/engine/src/national-bracket.ts';
import { auditCareerNationalDays } from '../packages/engine/src/national-day-audit.ts';
import { advanceCareerNationalMatch, closeCareerNationalDay, prepareCareerNationalMatch } from '../packages/engine/src/national-progress.ts';
import { resolveBlockingEvent } from './m2-native-pitcher.mjs';
import { loadPitcherCheckpoint, savePitcherCheckpoint } from './m2-pitcher-checkpoint.mjs';

const [prefixPath, checkpointPath] = process.argv.slice(2);
assert.ok(prefixPath && checkpointPath, 'Usage: node --import tsx scripts/verify-native-kbo-ag.mjs <WBC state.gz> <AG checkpoint.gz>');
const sourceProof = 'docs/implementation/evidence/M2-20261127-native-wbc-preseason.json';
const wbc = JSON.parse(readFileSync(sourceProof, 'utf8'));
const initial = JSON.parse(gunzipSync(readFileSync(prefixPath)));
const prefixHash = wbc.receipts.at(-1).resultHash;
assert.equal(hash(initial), prefixHash);
assert.equal(initial.world.seasonKey, '2034');
assert.ok(initial.national.returnedCompetitions.some(id => initial.national.competitions.find(r => r.competitionId === id)?.tournament === 'WBC'));

const p15 = JSON.parse(gunzipSync(readFileSync('docs/implementation/evidence/M2-20261126-P15-native-season.json.gz')));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
for (const row of p15.sourceManifest.filter(row => /^packages\/(engine|rules)\/src\//.test(row.file))) {
  assert.equal(sha(row.file), row.sha256, row.file);
}
const sourceHash = hash({
  prefixHash, engineSources: p15.sourceManifestHash,
  verifier: sha('scripts/verify-native-kbo-ag.mjs'),
  calendarBoundary: sha('apps/api/src/career-pro-national-shell.ts'),
  eventResolver: sha('scripts/m2-native-pitcher.mjs'),
});
const checkpoint = { path: checkpointPath, sourceHash };
const creation = 'KBO_2034_AFTER_WBC';
const resumed = loadPitcherCheckpoint(checkpoint, creation, initial);
const trace = { state: resumed?.state ?? initial, rows: resumed?.rows ?? [] };
const previousOfficialGames = initial.records.games;

function record(command, input, run) {
  const before = trace.state;
  const sourceHash = trace.rows.at(-1)?.resultHash ?? prefixHash;
  const output = run(before);
  const result = output.career ?? output;
  assert.ok(result.revision > before.revision, command);
  assert.equal(hash(before), sourceHash, 'Command mutated input: ' + command);
  trace.state = result;
  const resultHash = hash(result);
  trace.rows.push({ command, input, inputHash: hash(input), sourceHash, resultHash,
    sourceRevision: before.revision, resultRevision: result.revision });
  if (trace.rows.length % 3 === 0 || command.startsWith('CAREER_KBO_NATIONAL_RESOLVE')) {
    savePitcherCheckpoint(checkpoint, creation, trace, { phase: result.phaseContext.phase });
  }
  console.error(JSON.stringify({
    command, commands: trace.rows.length, phase: result.phaseContext.phase,
    nextWorldDay: result.phaseContext.nextWorldDay ?? result.phaseContext.resume?.nextWorldDay ?? null,
    seasonRecords: Object.keys(result.records.games).length - Object.keys(previousOfficialGames).length,
  }));
}

function takeNational(command) {
  record(command.type + ':' + command.id, command.payload,
    c => applyKboNational({ schemaVersion: 1, career: c }, command).nextState.career);
}

function playNationalDay(c, day) {
  const id = c.phaseContext.competitionId;
  const bracket = state => state.national.brackets.find(row => row.competitionId === id);
  let next = c;
  for (let step = 0; nextNationalMatch(bracket(next))?.day === day; step++) {
    assert.ok(step < 100, 'AG daily step budget exceeded');
    if (!bracket(next).pendingGame) next = prepareCareerNationalMatch(next, next.revision);
    const result = advanceCareerNationalMatch(next, next.revision);
    assert.notEqual(result.stopReason, 'ENGINE_LIMIT');
    next = result.career;
  }
  return closeCareerNationalDay(next, next.revision, day);
}

const hasReturned = c => c.national.competitions.some(row =>
  row.tournament === 'AG' && row.seasonKey === c.world.seasonKey && c.national.returnedCompetitions?.includes(row.competitionId));
if (trace.state.phaseContext.phase === 'PRESEASON_SETUP') record('START_KBO_SEASON', {}, c => startKboRegularSeason(c, c.revision));
for (let step = 0; !hasReturned(trace.state); step++) {
  assert.ok(step < 200, 'AG route command budget exceeded');
  const state = trace.state;
  const phase = state.phaseContext;
  const national = proNationalFlow({ schemaVersion: 1, career: state });
  const action = ['national-select', 'ACK_EVENT', 'ACCEPT_NATIONAL', 'national-start', 'CONFIRM_SERVICE_ELIGIBILITY', 'CONFIRM_NATIONAL_RETURN']
    .map(id => national?.commands.find(command => command.id === id)).find(Boolean);
  if (action) {
    takeNational(action);
  } else if (phase.phase === 'EVENT_DECISION') {
    resolveBlockingEvent({ state, command: record });
  } else if (phase.phase === 'INTERNATIONAL_PROGRESS') {
    record('PLAY_AG_DAY', { day: phase.nextWorldDay }, c => playNationalDay(c, phase.nextWorldDay));
  } else {
    assert.equal(phase.phase, 'SEASON_PROGRESS', 'A domestic season close would skip the AG window');
    record('ADVANCE_KBO_TO_AG', { dayBudget: 14 }, c => {
      const out = advanceKboCareerRun(c, c.revision, 14, () => true, kboNationalStopDay);
      assert.ok(!['ENGINE_LIMIT', 'CONTRACT_DECISION_REQUIRED'].includes(out.stopReason), out.stopReason);
      return out;
    });
  }
}

const state = trace.state;
auditCareerNationalDays(state);
assert.equal(state.phaseContext.phase, 'SEASON_PROGRESS');
const result = state.national.competitions.find(row => row.tournament === 'AG' && row.seasonKey === state.world.seasonKey);
assert.ok(result);
const bracket = state.national.brackets.find(row => row.competitionId === result.competitionId);
assert.equal(state.phaseContext.nextWorldDay, bracket.window.endDay);
const preserved = Object.fromEntries(Object.keys(previousOfficialGames).map(key => [key, state.records.games[key]]));
assert.equal(hash(preserved), hash(previousOfficialGames));
const selection = state.national.selections.find(row => row.selectionId && row.tournament === 'AG' && row.seasonKey === state.world.seasonKey);
assert.equal(selection.roster.slots.length, 28);
const scored = selection.scores.find(row => row.playerKey === state.protagonistKey);
const benefit = state.national.benefits.some(row => row.competitionId === result.competitionId);
assert.ok(!benefit || result.officialAppearance && result.medal === 'GOLD');
assert.equal(trace.rows[0].sourceHash, prefixHash);
savePitcherCheckpoint(checkpoint, creation, trace, { phase: state.phaseContext.phase, completed: true });
console.log(JSON.stringify({
  scope: 'ACTUAL_KBO_AND_AG_FROM_VERIFIED_WBC_RETURN', sourceProof, prefixHash,
  ag: { registered: result.registered, appeared: result.officialAppearance, finalRank: result.finalRank, medal: result.medal,
    games: result.gameKeys.length, closedDays: bracket.dayReceipts.length, candidate: scored?.score ?? null, benefit },
  returnedDay: state.phaseContext.nextWorldDay, commandCount: trace.rows.length, finalStateHash: trace.rows.at(-1).resultHash, receipts: trace.rows,
}, null, 2));
