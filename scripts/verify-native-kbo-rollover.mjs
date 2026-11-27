import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { canonicalSha256 as hash } from '../packages/engine/src/canonical-seal.ts';
import { resolveCareerAgentEvent } from '../packages/engine/src/career-agent.ts';
import { acceptKboRenewal } from '../packages/engine/src/kbo-renewal.ts';
import { kboYearTransitionReadiness, startNextKboSeason } from '../packages/engine/src/kbo-year-transition.ts';
import { confirmKboPreseasonPlan } from '../packages/engine/src/kbo-preseason.ts';
import { confirmKboOpeningRoster } from '../packages/engine/src/kbo-opening-roster.ts';
import { confirmKboSeasonSchedule } from '../packages/engine/src/kbo-schedule.ts';
import { kboNationalCandidates } from '../packages/engine/src/kbo-national-selection.ts';
import { createNationalSelection } from '../packages/engine/src/national-selection.ts';
import { PITCHER_CREATIONS, nativeSliceVerdict } from './m2-native-paths.mjs';
import { loadPitcherCheckpoint } from './m2-pitcher-checkpoint.mjs';
import { applyKboNational, proNationalFlow } from '../apps/api/src/career-pro-national-shell.ts';
import { advanceCareerNationalMatch, closeCareerNationalDay, prepareCareerNationalMatch } from '../packages/engine/src/national-progress.ts';
import { nextNationalMatch } from '../packages/engine/src/national-bracket.ts';
import { auditCareerNationalDays } from '../packages/engine/src/national-day-audit.ts';

const args = process.argv.slice(2);
const withWbc = args.includes('--wbc');
const wbcStatePath = args.find(arg => arg.startsWith('--save-wbc-state='))?.slice('--save-wbc-state='.length);
const [checkpointPath, archivePath = 'docs/implementation/evidence/M2-20261126-P15-native-season.json.gz'] = args.filter(arg => !arg.startsWith('--'));
assert.ok(!wbcStatePath || withWbc, 'WBC state export requires --wbc');
assert.ok(checkpointPath, 'Usage: node --import tsx scripts/verify-native-kbo-rollover.mjs <P15 checkpoint.gz> [P15 proof.gz]');
const proof = JSON.parse(gunzipSync(readFileSync(archivePath)));
const slice = proof.slices.find(row => row.id === 'P15-native-season-renewal-and-counter');
const required = ['START_KBO_SEASON', 'CLOSE_KBO_SEASON', 'OFFER_KBO_RENEWAL', 'OPEN_CAREER_AGENT_EVENTS', 'REQUEST_SALARY_COUNTER', 'ACCEPT_KBO_RENEWAL'];
assert.equal(proof.sourceDrift, null);
assert.equal(hash(proof.sourceManifest), proof.sourceManifestHash);
assert.ok(slice);
const verdict = nativeSliceVerdict(slice, required, hash);
assert.ok(verdict.ok, verdict.problem);
const production = proof.sourceManifest.filter(({ file }) => /^packages\/(engine|rules)\/src\//.test(file));
const currentPaths = ['engine', 'rules'].flatMap(packageName => {
  const directory = `packages/${packageName}/src`;
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(ts|json)$/.test(entry.name))
    .map(entry => `${entry.parentPath}/${entry.name}`.replaceAll('\\', '/'));
});
assert.deepEqual([...currentPaths].sort(), production.map(row => row.file).sort());
for (const { file, sha256 } of production) {
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), sha256, file);
}

const creation = slice.prefix.creation;
const restored = loadPitcherCheckpoint({ path: checkpointPath, sourceHash: proof.sourceManifestHash }, creation, PITCHER_CREATIONS[creation]());
assert.ok(restored);
const archivedRows = slice.commandReceipts;
assert.deepEqual(restored.rows, archivedRows.slice(0, restored.rows.length));
let state = restored.state;
function replayArchived(row, run) {
  const source = state;
  assert.equal(hash(source), row.sourceHash);
  assert.equal(source.revision, row.sourceRevision);
  assert.equal(hash(row.input), row.inputHash);
  state = run(source, row.sourceRevision, structuredClone(row.input));
  assert.equal(hash(source), row.sourceHash);
  assert.equal(state.revision, row.resultRevision);
  assert.equal(hash(state), row.resultHash);
  assert.equal(row.outputHash, row.resultHash);
}
const tail = archivedRows.slice(restored.rows.length);
assert.deepEqual(tail.map(row => row.command), ['REQUEST_SALARY_COUNTER', 'ACCEPT_KBO_RENEWAL']);
replayArchived(tail[0], resolveCareerAgentEvent);
replayArchived(tail[1], acceptKboRenewal);
assert.equal(hash(state), verdict.finalStateHash);
assert.equal(state.renewal.status, 'ACCEPTED');

const before = state;
const oldRecordsHash = hash(before.records);
const ready = kboYearTransitionReadiness(before);
assert.equal(ready.ready, true);
const receipts = [];
function publish(command, run, { recordMatches = false, batched = false } = {}) {
  const source = state;
  const sourceHash = hash(source);
  state = run(source, source.revision);
  if (batched) assert.ok(state.revision > source.revision, command);
  else assert.equal(state.revision, source.revision + 1, command);
  assert.equal(hash(source), sourceHash, command);
  if (!recordMatches) assert.equal(hash(state.records), hash(source.records), command);
  receipts.push({ command, sourceRevision: source.revision, sourceHash, resultRevision: state.revision, resultHash: hash(state) });
}
publish('START_NEXT_KBO_SEASON', startNextKboSeason);
const key = before.protagonistKey;
const contract = state.world.contracts[key];
assert.equal(state.phaseContext.phase, 'PRESEASON_SETUP');
assert.equal(state.world.seasonKey, ready.targetSeasonKey);
assert.equal(state.world.players[key].age, before.world.players[key].age + 1);
assert.equal(contract.contractKey, before.renewal.offerKey);
assert.equal(contract.seasonKey, ready.targetSeasonKey);
assert.equal(contract.annualSalaryWon, before.renewal.annualSalaryWon);
assert.equal(contract.status, 'ACTIVE');
assert.deepEqual(state.proSeasons.slice(0, -1), before.proSeasons ?? []);
assert.equal(state.proSeasons.at(-1).seasonKey, before.world.seasonKey);
assert.deepEqual(state.proSeasons.at(-1).seasonClose, before.seasonClose);
assert.deepEqual(state.proSeasons.at(-1).postseason, before.postseason);

function takeNational(id) {
  const command = proNationalFlow({ schemaVersion: 1, career: state })?.commands.find(choice => choice.id === id);
  assert.ok(command, 'Expected national flow command ' + id);
  publish(command.type + ':' + id, c => applyKboNational({ schemaVersion: 1, career: c }, command).nextState.career);
}

function playWbc() {
  takeNational('national-select');
  const selection = state.national.selections.find(row => row.tournament === 'WBC' && row.seasonKey === state.world.seasonKey);
  assert.equal(selection.roster.slots.length, 28);
  const selected = selection.roster.slots.some(row => row.playerKey === state.protagonistKey);
  const benefitCount = state.national.benefits.length;
  takeNational(selected ? 'ACCEPT_NATIONAL' : 'ACK_EVENT');
  takeNational('national-start');
  const competitionId = state.phaseContext.competitionId;
  const bracket = c => c.national.brackets.find(row => row.competitionId === competitionId);
  const window = bracket(state).window;
  for (let day = window.startDay; day < window.endDay; day++) {
    assert.equal(state.phaseContext.phase, 'INTERNATIONAL_PROGRESS');
    assert.equal(state.phaseContext.nextWorldDay, day);
    publish('PLAY_WBC_DAY:' + day, source => {
      let next = source;
      for (let step = 0; nextNationalMatch(bracket(next))?.day === day; step++) {
        assert.ok(step < 100, 'WBC daily step budget exceeded');
        if (!bracket(next).pendingGame) next = prepareCareerNationalMatch(next, next.revision);
        const out = advanceCareerNationalMatch(next, next.revision);
        assert.notEqual(out.stopReason, 'ENGINE_LIMIT');
        next = out.career;
      }
      return closeCareerNationalDay(next, next.revision, day);
    }, { recordMatches: true, batched: true });
    if (state.events.some(e => e.definitionId === 'E46' && e.status === 'OPEN' && e.evidence.fields.competitionId === competitionId)) takeNational('ACK_EVENT');
    console.error(JSON.stringify({ tournament: 'WBC', day, finalGames: bracket(state).results.length }));
  }
  auditCareerNationalDays(state);
  const result = state.national.competitions.find(row => row.competitionId === competitionId);
  assert.ok(result);
  assert.equal(result.seasonKey, state.world.seasonKey);
  assert.equal(result.registered, selected);
  assert.equal(bracket(state).dayReceipts.length, window.endDay - window.startDay);
  assert.equal(state.national.benefits.length, benefitCount);
  const priorGames = Object.fromEntries(Object.entries(state.records.games).filter(([key]) => !result.gameKeys.includes(key)));
  assert.equal(hash(priorGames), hash(before.records.games));
  assert.ok(result.gameKeys.every(key => state.records.games[key].scope.phase === 'INTERNATIONAL'));
  takeNational('CONFIRM_NATIONAL_RETURN');
  assert.equal(state.phaseContext.phase, 'PRESEASON_SETUP');
  assert.ok(state.national.returnedCompetitions.includes(competitionId));
  return { selected, officialAppearance: result.officialAppearance, finalRank: result.finalRank,
    games: result.gameKeys.length, closedDays: bracket(state).dayReceipts.length, endDay: window.endDay, benefitGranted: false };
}

const wbc = withWbc ? playWbc() : null;
publish('CONFIRM_KBO_PRESEASON', confirmKboPreseasonPlan);
publish('CONFIRM_KBO_ROSTER', confirmKboOpeningRoster);
publish('CONFIRM_KBO_SCHEDULE', confirmKboSeasonSchedule);
const schedule = state.competitionSchedule;
assert.equal(schedule.seasonKey, ready.targetSeasonKey);
assert.equal(schedule.leagues.KBO.length, 720);
if (wbc) assert.ok(schedule.leagues.KBO.every(game => game.worldDay >= wbc.endDay));
assert.ok(schedule.leagues.FUTURES.length >= 720);
const ag = state.world.calendar.international.find(window => window.type === 'AG');
let nationalSelection = null;
if (ag) {
 const roster = createNationalSelection({ worldKey: state.world.worldKey, seasonKey: state.world.seasonKey,
   seed: state.world.seed, tournament: 'AG', candidates: kboNationalCandidates(state), records: state.records });
 const own = roster.scores.find(row => row.playerKey === key);
 const slot = roster.roster.slots.find(row => row.playerKey === key);
 nationalSelection = { scope: 'PRESEASON_RANK_PROBE', rosterSize: roster.roster.slots.length, selected: !!slot,
   role: slot?.role ?? null, score: own?.score ?? null, performanceSeason: own?.performanceSeason ?? null };
 assert.equal(hash(state), receipts.at(-1).resultHash);
}
if (wbcStatePath) writeFileSync(wbcStatePath, gzipSync(JSON.stringify(state), { level: 1 }), { flag: 'wx' });

console.log(JSON.stringify({ scope: 'NATIVE_KBO_YEAR_ROLLOVER_AND_SCHEDULE_PUBLICATION', fromSeason: before.world.seasonKey, toSeason: state.world.seasonKey,
  archivedReceipts: verdict.commands, resumedReceipts: restored.rows.length, archivedFinalHash: verdict.finalStateHash,
  oldRecordsHash, contractSalaryWon: contract.annualSalaryWon, age: state.world.players[key].age, phase: state.phaseContext.phase,
  schedule: { kbo: schedule.leagues.KBO.length, futures: schedule.leagues.FUTURES.length },
  calendar: state.world.calendar.international.map(window => window.type), nationalSelection, ...(wbc ? { wbc } : {}), receipts }, null, 2));
