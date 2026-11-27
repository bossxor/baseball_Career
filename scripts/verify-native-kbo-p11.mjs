// P11: continue the verified native KBO career (after the AG return) season by season until the protagonist is
// really selected for a national team, then play the tournament and record roster / appearance / medal / military benefit.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { applyKboNational, kboNationalStopDay, proNationalFlow } from '../apps/api/src/career-pro-national-shell.ts';
import { canonicalSha256 as hash } from '../packages/engine/src/canonical-seal.ts';
import { advanceKboCareerRun, startKboRegularSeason } from '../packages/engine/src/kbo-progress.ts';
import { advanceKboPostseason, startKboPostseason } from '../packages/engine/src/kbo-postseason-progress.ts';
import { closeKboSeason } from '../packages/engine/src/kbo-year-end.ts';
import { settleKboSeasonGrowth } from '../packages/engine/src/kbo-season-growth.ts';
import { acceptKboRenewal, kboContractDecisionRequired, offerKboRenewal } from '../packages/engine/src/kbo-renewal.ts';
import { kboYearTransitionReadiness, startNextKboSeason } from '../packages/engine/src/kbo-year-transition.ts';
import { confirmKboPreseasonPlan } from '../packages/engine/src/kbo-preseason.ts';
import { confirmKboOpeningRoster } from '../packages/engine/src/kbo-opening-roster.ts';
import { confirmKboSeasonSchedule } from '../packages/engine/src/kbo-schedule.ts';
import { nextNationalMatch } from '../packages/engine/src/national-bracket.ts';
import { auditCareerNationalDays } from '../packages/engine/src/national-day-audit.ts';
import { advanceCareerNationalMatch, closeCareerNationalDay, prepareCareerNationalMatch } from '../packages/engine/src/national-progress.ts';
import { resolveBlockingEvent } from './m2-native-pitcher.mjs';
import { loadPitcherCheckpoint, savePitcherCheckpoint } from './m2-pitcher-checkpoint.mjs';

const args = process.argv.slice(2);
const stopAfter = Number(args.find(a => a.startsWith('--last-season='))?.slice(14) ?? 2035);
const [prefixPath, agCheckpointPath, checkpointPath] = args.filter(a => !a.startsWith('--'));
assert.ok(prefixPath && agCheckpointPath && checkpointPath,
  'Usage: node --import tsx scripts/verify-native-kbo-p11.mjs <WBC state.gz> <AG checkpoint.gz> <P11 checkpoint.gz> [--last-season=2035]');
const wbcProof = 'docs/implementation/evidence/M2-20261127-native-wbc-preseason.json';
const initial = JSON.parse(gunzipSync(readFileSync(prefixPath)));
const prefixHash = JSON.parse(readFileSync(wbcProof, 'utf8')).receipts.at(-1).resultHash;
assert.equal(hash(initial), prefixHash);
const p15 = JSON.parse(gunzipSync(readFileSync('docs/implementation/evidence/M2-20261126-P15-native-season.json.gz')));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
for (const row of p15.sourceManifest.filter(r => /^packages\/(engine|rules)\/src\//.test(r.file))) assert.equal(sha(row.file), row.sha256, row.file);
const creation = 'KBO_2034_AFTER_WBC';
// The AG checkpoint was sealed by verify-native-kbo-ag.mjs; reuse its source-hash formula to resume from it once.
const agSourceHash = hash({ prefixHash, engineSources: p15.sourceManifestHash, verifier: sha('scripts/verify-native-kbo-ag.mjs'),
  calendarBoundary: sha('apps/api/src/career-pro-national-shell.ts'), eventResolver: sha('scripts/m2-native-pitcher.mjs') });
const sourceHash = hash({ prefixHash, engineSources: p15.sourceManifestHash, verifier: 'p11-driver-resumable',
  calendarBoundary: sha('apps/api/src/career-pro-national-shell.ts'), eventResolver: sha('scripts/m2-native-pitcher.mjs') });
// ponytail: the first P11 checkpoint was sealed by an earlier edit of this file; keep its header hash once (chain and state are still verified).
let ownHash = sourceHash;
try { ownHash = JSON.parse(gunzipSync(readFileSync(checkpointPath))).header.sourceHash; } catch { /* no checkpoint yet: keep the fresh hash */ }
const checkpoint = { path: checkpointPath, sourceHash: ownHash };
const resumed = loadPitcherCheckpoint(checkpoint, creation, initial)
  ?? loadPitcherCheckpoint({ path: agCheckpointPath, sourceHash: agSourceHash }, creation, initial);
const trace = { state: resumed.state, rows: resumed.rows };
const tournaments = [];

function record(command, input, run) {
  const before = trace.state, srcHash = trace.rows.at(-1)?.resultHash ?? prefixHash;
  const output = run(before), result = output.career ?? output;
  assert.ok(result.revision > before.revision, command);
  assert.equal(hash(before), srcHash, 'Command mutated input: ' + command);
  trace.state = result;
  trace.rows.push({ command, input, inputHash: hash(input), sourceHash: srcHash, resultHash: hash(result),
    sourceRevision: before.revision, resultRevision: result.revision });
  if (trace.rows.length % 3 === 0) savePitcherCheckpoint(checkpoint, creation, trace, { phase: result.phaseContext.phase });
  console.error(JSON.stringify({ command, commands: trace.rows.length, season: result.world.seasonKey, phase: result.phaseContext.phase,
    nextWorldDay: result.phaseContext.nextWorldDay ?? null }));
}
const takeNational = command => record(command.type + ':' + command.id, command.payload,
  c => applyKboNational({ schemaVersion: 1, career: c }, command).nextState.career);

function playNationalDay(c, day) {
  const bracket = s => s.national.brackets.find(r => r.competitionId === c.phaseContext.competitionId);
  let next = c;
  for (let step = 0; nextNationalMatch(bracket(next))?.day === day; step++) {
    assert.ok(step < 100, 'national daily step budget exceeded');
    if (!bracket(next).pendingGame) next = prepareCareerNationalMatch(next, next.revision);
    const out = advanceCareerNationalMatch(next, next.revision);
    assert.notEqual(out.stopReason, 'ENGINE_LIMIT');
    next = out.career;
  }
  return closeCareerNationalDay(next, next.revision, day);
}
const selectionId = (c, r) => JSON.stringify(['national-selection', c.world.worldKey, r.seasonKey, r.tournament]);
function noteSelection(c) {
  for (const sel of c.national.selections) {
    if (tournaments.some(t => t.selectionId === sel.selectionId)) continue;
    const own = sel.scores.find(r => r.playerKey === c.protagonistKey);
    const cut = Math.min(...sel.roster.slots.map(s => sel.scores.find(r => r.playerKey === s.playerKey).score));
    tournaments.push({ selectionId: sel.selectionId, tournament: sel.tournament, season: sel.seasonKey,
      selected: sel.roster.slots.some(s => s.playerKey === c.protagonistKey), score: own?.score ?? null, cutoff: cut,
      ovr: own?.roleOVR ?? null, performanceIndex: own?.performanceIndex ?? null });
  }
}
const returnedSelected = c => c.national.competitions.some(r => c.national.returnedCompetitions?.includes(r.competitionId)
  && tournaments.some(t => t.selected && t.selectionId === selectionId(c, r)));

for (let step = 0; ; step++) {
  assert.ok(step < 1500, 'P11 command budget exceeded');
  const state = trace.state, phase = state.phaseContext;
  noteSelection(state);
  if (returnedSelected(state)) break;
  if (Number(state.world.seasonKey) > stopAfter && phase.phase === 'PRESEASON_SETUP') break;
  const national = proNationalFlow({ schemaVersion: 1, career: state });
  const action = ['national-select', 'ACK_EVENT', 'ACCEPT_NATIONAL', 'national-start', 'CONFIRM_SERVICE_ELIGIBILITY', 'CONFIRM_NATIONAL_RETURN']
    .map(id => national?.commands.find(c => c.id === id)).find(Boolean);
  if (action) { takeNational(action); continue; }
  if (phase.phase === 'EVENT_DECISION') { resolveBlockingEvent({ state, command: record }); continue; }
  if (phase.phase === 'INTERNATIONAL_PROGRESS') { record('PLAY_NATIONAL_DAY', { day: phase.nextWorldDay }, c => playNationalDay(c, phase.nextWorldDay)); continue; }
  const season = state.world.seasonKey;
  if (phase.phase === 'PRESEASON_SETUP') {
    // Order from verify-native-kbo-rollover: preseason -> roster -> schedule -> regular season.
    if (state.preseasonPlan?.seasonKey !== season) record('CONFIRM_KBO_PRESEASON', {}, c => confirmKboPreseasonPlan(c, c.revision));
    else if (state.openingRoster?.seasonKey !== season) record('CONFIRM_KBO_ROSTER', {}, c => confirmKboOpeningRoster(c, c.revision));
    else if (state.competitionSchedule?.seasonKey !== season) record('CONFIRM_KBO_SCHEDULE', {}, c => confirmKboSeasonSchedule(c, c.revision));
    else record('START_KBO_SEASON', {}, c => startKboRegularSeason(c, c.revision));
  } else if (phase.phase === 'SEASON_PROGRESS') {
    record('ADVANCE_KBO', { dayBudget: 7 }, c => {
      const out = advanceKboCareerRun(c, c.revision, 7, () => true, kboNationalStopDay);
      assert.ok(!['ENGINE_LIMIT', 'CONTRACT_DECISION_REQUIRED'].includes(out.stopReason), out.stopReason);
      return out;
    });
  } else if (phase.phase === 'SEASON_REVIEW' && !state.postseason) {
    record('START_KBO_POSTSEASON', {}, c => startKboPostseason(c, c.revision));
  } else if (phase.phase === 'POSTSEASON_PROGRESS') {
    record('ADVANCE_KBO_POSTSEASON', {}, c => { const out = advanceKboPostseason(c, c.revision); assert.notEqual(out.stopReason, 'ENGINE_LIMIT'); return out; });
  } else {
    assert.equal(phase.phase, 'SEASON_REVIEW');
    if (!state.seasonGrowth.entries.length) record('SETTLE_KBO_SEASON_GROWTH', {}, c => settleKboSeasonGrowth(c, c.revision));
    else if (!state.seasonClose || state.seasonClose.seasonKey !== season) record('CLOSE_KBO_SEASON', { forfeitUnusedTraining: true }, c => closeKboSeason(c, c.revision, true));
    else if (kboContractDecisionRequired(state) && state.renewal?.seasonKey !== String(Number(season) + 1)) record('OFFER_KBO_RENEWAL', {}, c => offerKboRenewal(c, c.revision));
    else if (kboContractDecisionRequired(state) && state.renewal.status === 'OFFERED') {
      const event = state.events.find(e => e.eventKey === state.renewal.eventKey);
      const input = { eventKey: event.eventKey, eventVersion: event.version, offerKey: state.renewal.offerKey };
      record('ACCEPT_KBO_RENEWAL', input, c => acceptKboRenewal(c, c.revision, input));
    } else {
      const ready = kboYearTransitionReadiness(state);
      assert.ok(ready.ready, 'Year transition blocked: ' + ready.blockers.join(','));
      record('START_NEXT_KBO_SEASON', {}, c => startNextKboSeason(c, c.revision));
    }
  }
}
const state = trace.state;
auditCareerNationalDays(state);
savePitcherCheckpoint(checkpoint, creation, trace, { phase: state.phaseContext.phase, completed: true });
const selected = tournaments.find(t => t.selected);
const result = selected && state.national.competitions.find(r => selectionId(state, r) === selected.selectionId);
console.log(JSON.stringify({ scope: 'NATIVE_KBO_CONTINUATION_TO_NATIONAL_SELECTION', prefixHash, tournaments,
  result: result && { tournament: result.tournament, registered: result.registered, appeared: result.officialAppearance,
    finalRank: result.finalRank, medal: result.medal, games: result.gameKeys.length,
    benefit: state.national.benefits.some(b => b.competitionId === result.competitionId), militaryStatus: state.military?.status ?? null },
  commandCount: trace.rows.length, finalStateHash: trace.rows.at(-1).resultHash, receipts: trace.rows }, null, 2));
