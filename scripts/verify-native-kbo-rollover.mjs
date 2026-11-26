import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
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

const [checkpointPath, archivePath = 'docs/implementation/evidence/M2-20261126-P15-native-season.json.gz'] = process.argv.slice(2);
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
function publish(command, run) {
  const source = state;
  const sourceHash = hash(source);
  state = run(source, source.revision);
  assert.equal(state.revision, source.revision + 1, command);
  assert.equal(hash(source), sourceHash, command);
  assert.equal(hash(state.records), oldRecordsHash, command);
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

publish('CONFIRM_KBO_PRESEASON', confirmKboPreseasonPlan);
publish('CONFIRM_KBO_ROSTER', confirmKboOpeningRoster);
publish('CONFIRM_KBO_SCHEDULE', confirmKboSeasonSchedule);
const schedule = state.competitionSchedule;
assert.equal(schedule.seasonKey, ready.targetSeasonKey);
assert.equal(schedule.leagues.KBO.length, 720);
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
console.log(JSON.stringify({ scope: 'NATIVE_KBO_YEAR_ROLLOVER_AND_SCHEDULE_PUBLICATION', fromSeason: before.world.seasonKey, toSeason: state.world.seasonKey,
  archivedReceipts: verdict.commands, resumedReceipts: restored.rows.length, archivedFinalHash: verdict.finalStateHash,
  oldRecordsHash, contractSalaryWon: contract.annualSalaryWon, age: state.world.players[key].age, phase: state.phaseContext.phase,
  schedule: { kbo: schedule.leagues.KBO.length, futures: schedule.leagues.FUTURES.length },
  calendar: state.world.calendar.international.map(window => window.type), nationalSelection, receipts }, null, 2));
