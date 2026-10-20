import {validateTraits,traitLogitEffects,defenseTraitTemporary,traitRunningBonus,traitPitchThreshold} from './traits.js';
import { RULES_VERSION, PITCH_IDS, OUTCOMES, assertAbilities } from '@playball/rules';
import { advanceBases } from './bases.js';
import { baseLogits, effectiveAbilities, finite, matchupEffects, pitcherReviewThreshold, ranged, sampleOutcome, softmax } from './probabilities.js';
import { createStreams, nextFloat, nextInteger } from './rng.js';
import { emptyBatting, emptyPitching } from './stats.js';
import type { Appearance, GameInput, GameState, PitchEntry, PitcherDecisions, PitcherSnapshot } from './types.js';

export function selectRepresentativePitch(entries: readonly PitchEntry[], uniform: number): PitchEntry {
  ranged(uniform, 0, 1);
  if (uniform === 1 || entries.length < 2 || entries.length > 4) throw new RangeError('Invalid representative pitch input');
  const sorted = [...entries].sort((a, b) => a.pitchId < b.pitchId ? -1 : a.pitchId > b.pitchId ? 1 : 0);
  if (new Set(sorted.map(p => p.pitchId)).size !== entries.length) throw new RangeError('Duplicate pitches');
  let total = 0;
  for (const entry of sorted) {
    if (!PITCH_IDS.includes(entry.pitchId) || !Number.isInteger(entry.mastery) || entry.mastery < 1 || entry.mastery > 5 || !Number.isInteger(entry.weight) || entry.weight < 10 || entry.weight > 90) throw new RangeError('Invalid pitch loadout');
    total += entry.weight;
  }
  if (total !== 100) throw new RangeError('Pitch weights must sum to 100');
  let cumulative = 0;
  for (const entry of sorted) { cumulative += entry.weight; if (uniform < cumulative / 100) return entry; }
  return sorted[sorted.length - 1]!;
}

function validateInput(input: GameInput): void {
  if (!input.simulationKey || !input.seed || input.rulesVersion !== RULES_VERSION || !['REGULAR', 'POSTSEASON', 'INTERNATIONAL'].includes(input.competition) || input.teams.length !== 2) throw new RangeError('Invalid/unsupported game input');
  if(input.traitRulesVersion!==undefined && input.traitRulesVersion!==1) throw new RangeError('UNSUPPORTED_TRAIT_RULES');
  for(const team of input.teams) for(const [kind,players] of [['HITTER',team.lineup],['PITCHER',team.pitchers]] as const) for(const player of players) {
    if(input.traitRulesVersion===1 && player.traitLogits.length || player.traits && input.traitRulesVersion!==1) throw new RangeError('INVALID_TRAIT_INPUT');
    if(player.traits) validateTraits(kind,player.traits);
  }
  const keys = input.teams.flatMap(team => [team.simulationKey, ...team.lineup.map(p => p.simulationKey), ...team.pitchers.map(p => p.simulationKey)]);
  if (keys.some(key => !key) || new Set(keys).size !== keys.length) throw new RangeError('Simulation keys must be unique');
  for (const team of input.teams) {
    if (team.lineup.length !== 9 || team.fielders.length !== 8 || new Set(team.fielders.map(f => f.simulationKey)).size !== 8) throw new RangeError('Nine hitters and eight distinct fielders required');
    if (!team.pitchers.some(p => p.available)) throw new RangeError('ROSTER_INVALID: no available pitcher');
    for (const player of team.lineup) {
      if (!player.available) throw new RangeError('ROSTER_INVALID: unavailable hitter');
      assertAbilities('HITTER', player.abilities);
      effectiveAbilities('HITTER', player.abilities, player.fatigue, player.morale, player.temporary);
      if (!['R', 'L', 'S'].includes(player.bats)) throw new RangeError('Invalid batter handedness');
    }
    for (const fielder of team.fielders) {
      if (!team.lineup.some(p => p.simulationKey === fielder.simulationKey)) throw new RangeError('Fielder outside lineup');
      ranged(fielder.fit, 0, 100);
    }
    for (const pitcher of team.pitchers) {
      assertAbilities('PITCHER', pitcher.abilities);
      effectiveAbilities('PITCHER', pitcher.abilities, pitcher.fatigue, pitcher.morale, pitcher.temporary);
      if (!['SP', 'RP', 'CP'].includes(pitcher.role) || !Number.isSafeInteger(pitcher.recentOuts) || pitcher.recentOuts < 0) throw new RangeError('Invalid pitcher role/workload');
      const pitch = selectRepresentativePitch(pitcher.repertoire, 0);
      matchupEffects(pitcher.pitchForm, pitch.pitchId, pitch.mastery, pitcher.throws, 'R', 'BALANCED', pitcher.traitLogits);
    }
  }
}

export function createGame(input: GameInput): GameState {
  validateInput(input);
  const active = input.teams.map(team => {
    const starter = team.pitchers.findIndex(p => p.available && p.role === 'SP');
    return starter >= 0 ? starter : team.pitchers.findIndex(p => p.available);
  }) as [number, number];
  return {
    engineVersion: input.traitRulesVersion===1?'1.1.0':'1.0.0', input: structuredClone(input), status: 'LIVE', inning: 1, half: 0, outs: 0, halfPlateAppearances: 0, playCursor: 0,
    scores: [0, 0], scoreByInning: [[0], []], bases: [null, null, null], nextBattingIndex: [0, 0], activePitcherIndex: active,
    rng: createStreams(input.seed, input.simulationKey),
    batting: Object.fromEntries(input.teams.flatMap(t => t.lineup.map(p => [p.simulationKey, emptyBatting()]))),
    pitching: Object.fromEntries(input.teams.flatMap(t => t.pitchers.map(p => [p.simulationKey, emptyPitching()]))),
    appearances: input.teams.map((team, i) => ({ pitcherKey: team.pitchers[active[i]!]!.simulationKey, team: i as 0 | 1, starter: true, order: i, enteredAt: 0, entryLead: 0, saveSituation: false, maintainedLead: true, blownSave: false })),
    decisiveLead: null, decisions: null, plays: [], completedInnings: 0,
  };
}

function activePitcher(state: GameState, team: 0 | 1): PitcherSnapshot {
  const pitcher = state.input.teams[team].pitchers[state.activePitcherIndex[team]];
  if (!pitcher || !pitcher.available) throw new RangeError('ROSTER_INVALID: unavailable active pitcher');
  return pitcher;
}
function appearanceOf(state: GameState, key: string): Appearance {
  const result = state.appearances.find(a => a.pitcherKey === key);
  if (!result) throw new RangeError('Missing pitching appearance');
  return result;
}

function reviewPitcher(state: GameState, team: 0 | 1): void {
  const current = activePitcher(state, team), line = state.pitching[current.simulationKey]!;
  if (line.BF === 0) return; // Replacement review follows a completed PA, never a phantom appearance.
  const A = effectiveAbilities('PITCHER', current.abilities, current.fatigue, current.morale, current.temporary);
  const starter = appearanceOf(state, current.simulationKey).starter;
  const threshold = traitPitchThreshold(pitcherReviewThreshold(A.STAMINA!, starter),starter,current.traits);
  if (line.pitches < threshold && current.fatigue < 80 && (starter || line.outs < 6)) return;
  const lead = state.scores[team] - state.scores[team === 0 ? 1 : 0];
  const preference = state.inning >= 9 && lead > 0 && lead <= 3 ? ['CP', 'RP', 'SP'] : state.inning >= 7 ? ['RP', 'CP', 'SP'] : ['RP', 'SP', 'CP'];
  const candidates = state.input.teams[team].pitchers.map((p, index) => ({ p, index })).filter(({ p }) => p.available && !state.appearances.some(a => a.pitcherKey === p.simulationKey));
  candidates.sort((a, b) => preference.indexOf(a.p.role) - preference.indexOf(b.p.role) || a.p.fatigue - b.p.fatigue || a.p.recentOuts - b.p.recentOuts || (a.p.simulationKey < b.p.simulationKey ? -1 : a.p.simulationKey > b.p.simulationKey ? 1 : 0));
  const next = candidates[0];
  if (!next) return; // No free replacement; last eligible pitcher keeps the fatigue penalty.
  state.activePitcherIndex[team] = next.index;
  const occupied = state.bases.filter(Boolean).length;
  state.appearances.push({ pitcherKey: next.p.simulationKey, team, starter: false, order: state.appearances.length, enteredAt: state.playCursor, entryLead: lead, saveSituation: lead > 0 && (lead <= 3 || lead <= occupied + 2), maintainedLead: true, blownSave: false });
}

export function calculatePitcherDecisions(state: GameState): PitcherDecisions {
  const result: PitcherDecisions = { W: null, L: null, SV: null, HLD: [], BS: state.appearances.filter(a => a.blownSave).map(a => a.pitcherKey) };
  const withHolds = () => {
    result.HLD = state.appearances.filter(a => {
      const teamAppearances = state.appearances.filter(other => other.team === a.team);
      return a !== teamAppearances[teamAppearances.length - 1] && !a.starter && a.saveSituation && a.maintainedLead && state.pitching[a.pitcherKey]!.outs > 0 && a.pitcherKey !== result.W && a.pitcherKey !== result.L && a.pitcherKey !== result.SV;
    }).map(a => a.pitcherKey);
    return result;
  };
  const decisive = state.decisiveLead;
  if (!decisive || state.scores[0] === state.scores[1]) return withHolds();
  const candidate = appearanceOf(state, decisive.winningCandidateKey);
  if (!candidate.starter || state.pitching[candidate.pitcherKey]!.outs >= 15) result.W = candidate.pitcherKey;
  else {
    const relief = state.appearances.filter(a => a.team === decisive.team && !a.starter && a.enteredAt >= decisive.cursor);
    relief.sort((a, b) => state.pitching[b.pitcherKey]!.outs - state.pitching[a.pitcherKey]!.outs || state.pitching[a.pitcherKey]!.ER - state.pitching[b.pitcherKey]!.ER || a.order - b.order);
    result.W = relief[0]?.pitcherKey ?? null;
  }
  result.L = decisive.losingPitcherKey;
  const winners = state.appearances.filter(a => a.team === decisive.team);
  const last = winners[winners.length - 1]!;
  if (!last.starter && last.pitcherKey !== result.W && state.pitching[last.pitcherKey]!.outs > 0 && last.entryLead > 0 && last.maintainedLead && (last.saveSituation || state.pitching[last.pitcherKey]!.outs >= 9)) result.SV = last.pitcherKey;
  return withHolds();
}

function finish(state: GameState): void { state.status = 'FINAL'; state.decisions = calculatePitcherDecisions(state); }

function processPlateAppearance(state: GameState): void {
  const offense = state.half, defense = offense === 0 ? 1 : 0;
  reviewPitcher(state, defense);
  const team = state.input.teams[offense], fielding = state.input.teams[defense], pitcher = activePitcher(state, defense);
  if (state.halfPlateAppearances === 0) {
    state.scoreByInning[offense][state.inning - 1] = 0;
    if (state.inning >= 10 && state.input.competition !== 'REGULAR' && !state.bases.some(Boolean)) {
      const previous = team.lineup[(state.nextBattingIndex[offense] + 8) % 9]!;
      const abilities = effectiveAbilities('HITTER', previous.abilities, previous.fatigue, previous.morale, previous.temporary);
      state.bases[1] = { simulationKey: previous.simulationKey, responsiblePitcherKey: pitcher.simulationKey, automatic: true, running: abilities.RUNNING!, ...(previous.traits?{extraHomeBonus:traitRunningBonus(previous.traits)}:{}) };
    }
  }
  const batter = team.lineup[state.nextBattingIndex[offense]]!;
  const before = { outsBefore: state.outs, basesBefore: state.bases.map(r => r?.simulationKey ?? null) as [string | null, string | null, string | null], scoresBefore: [...state.scores] as [number, number], pitcherThrows: pitcher.throws, batterSide: batter.bats === 'S' ? (pitcher.throws === 'R' ? 'L' as const : 'R' as const) : batter.bats };
  const H = effectiveAbilities('HITTER', batter.abilities, batter.fatigue, batter.morale, batter.temporary);
  const P = effectiveAbilities('PITCHER', pitcher.abilities, pitcher.fatigue, pitcher.morale, pitcher.temporary);
  const fieldDefense = fielding.fielders.reduce((sum, f) => {
    const player = fielding.lineup.find(p => p.simulationKey === f.simulationKey)!;
    return sum + effectiveAbilities('HITTER', player.abilities, player.fatigue, player.morale, defenseTraitTemporary(player.abilities.DEFENSE!,player.temporary,player.traits)).DEFENSE! * (.5 + .5 * f.fit / 100);
  }, 0) / 8;
  const pitchDraw = nextFloat(state.rng.pitchPlan); state.rng.pitchPlan = pitchDraw.state;
  const pitch = selectRepresentativePitch(pitcher.repertoire, pitchDraw.value);
  const context={inning:state.inning,half:state.half===0?'TOP' as const:'BOTTOM' as const,ownerLead:state.scores[offense]-state.scores[defense],loaded:state.bases.every(Boolean),firstMeeting:!state.plays.some(p=>p.batterKey===batter.simulationKey && p.pitcherKey===pitcher.simulationKey),postseason:state.input.competition==='POSTSEASON',pitcherKey:pitcher.simulationKey,starter:appearanceOf(state,pitcher.simulationKey).starter,pitcherRuns:state.pitching[pitcher.simulationKey]!.R};
  const effects=[...batter.traitLogits,...pitcher.traitLogits,...traitLogitEffects('HITTER',batter.traits,context),...traitLogitEffects('PITCHER',pitcher.traits,{...context,ownerLead:-context.ownerLead})];
  const effect = matchupEffects(pitcher.pitchForm, pitch.pitchId, pitch.mastery, pitcher.throws, batter.bats, batter.approach, effects);
  const logits = baseLogits({ contact: H.CONTACT!, power: H.POWER!, discipline: H.DISCIPLINE!, running: H.RUNNING!, clutch: H.CLUTCH!, velocity: P.VELOCITY!, stuff: P.STUFF!, command: P.COMMAND!, composure: P.COMPOSURE!, defense: fieldDefense, runnersOn: state.bases.some(Boolean), risp: Boolean(state.bases[1] || state.bases[2]) });
  for (const outcome of OUTCOMES) logits[outcome] += effect.applied[outcome];
  const probabilities = softmax(logits), result = sampleOutcome(probabilities, state.rng.game);
  state.rng.game = result.state;
  const pitchJitter = nextInteger(state.rng.pitchCount, 3); state.rng.pitchCount = pitchJitter.state;
  const pitches = (['BB', 'HBP', 'K'].includes(result.outcome) ? 5 : 3) + pitchJitter.value - 1;
  const play = advanceBases({ outcome: result.outcome, outs: state.outs, bases: state.bases,
    batter: { simulationKey: batter.simulationKey, responsiblePitcherKey: pitcher.simulationKey, automatic: false, running: H.RUNNING!, ...(batter.traits?{extraHomeBonus:traitRunningBonus(batter.traits)}:{}) },
    defense: fieldDefense, pickoff: P.PICKOFF!, winningRunsNeeded: offense === 1 && state.inning >= 9 ? state.scores[0] - state.scores[1] + 1 : null }, state.rng.baserunning);
  state.rng.baserunning = play.state;
  const batting = state.batting[batter.simulationKey]!, pitching = state.pitching[pitcher.simulationKey]!;
  batting.PA++; pitching.BF++; pitching.pitches += pitches; pitching.outs += play.outsAdded;
  if (result.outcome === 'BB') { batting.BB++; pitching.BB++; }
  else if (result.outcome === 'HBP') { batting.HBP++; pitching.HBP++; }
  else {
    batting.AB++;
    if (result.outcome === 'K') { batting.K++; pitching.K++; }
    if (['1B', '2B', '3B', 'HR'].includes(result.outcome)) {
      batting.H++; pitching.H++; batting.TB += result.outcome === 'HR' ? 4 : Number(result.outcome[0]);
      if (result.outcome === 'HR') { batting.HR++; pitching.HR++; }
    }
  }
  batting.RBI += play.rbi;
  for (const runner of play.scored) {
    state.batting[runner.simulationKey]!.R++;
    state.pitching[runner.responsiblePitcherKey]!.R++;
    if (!runner.automatic) state.pitching[runner.responsiblePitcherKey]!.ER++;
    state.scores[offense]++; state.scoreByInning[offense][state.inning - 1]!++;
    const lead = state.scores[offense] - state.scores[defense];
    if (lead === 0) state.decisiveLead = null;
    if (lead === 1) state.decisiveLead = { team: offense, losingPitcherKey: runner.responsiblePitcherKey, winningCandidateKey: activePitcher(state, offense).simulationKey, cursor: state.playCursor };
    const appearance = appearanceOf(state, pitcher.simulationKey);
    if (state.scores[defense] <= state.scores[offense]) {
      appearance.maintainedLead = false;
      if (appearance.saveSituation) appearance.blownSave = true;
    }
  }
  state.plays.push({ ...before, cursor: state.playCursor, inning: state.inning, half: offense === 0 ? 'TOP' : 'BOTTOM', batterKey: batter.simulationKey, pitcherKey: pitcher.simulationKey, outcome: result.outcome, representativePitch: pitch.pitchId, probabilities, pitches, scored: play.scored, outsAdded: play.outsAdded, attempts: play.attempts });
  state.playCursor++; state.halfPlateAppearances++; state.nextBattingIndex[offense] = (state.nextBattingIndex[offense] + 1) % 9;
  state.bases = play.bases; state.outs += play.outsAdded;
  if (offense === 1 && state.inning >= 9 && state.scores[1] > state.scores[0]) { finish(state); return; }
  if (state.outs < 3) return;
  state.outs = 0; state.bases = [null, null, null]; state.halfPlateAppearances = 0;
  if (offense === 0) {
    if (state.inning >= 9 && state.scores[1] > state.scores[0]) finish(state); else state.half = 1;
  } else {
    state.completedInnings++;
    if (state.inning >= 9 && state.scores[0] !== state.scores[1] || state.input.competition === 'REGULAR' && state.inning >= 12) finish(state);
    else { state.inning++; state.half = 0; }
  }
}

export function runGameChunk(source: GameState, limits: { plateAppearances?: number; completedInnings?: number } = {}) {
  if (source.engineVersion !== (source.input.traitRulesVersion===1?'1.1.0':'1.0.0')) throw new RangeError('Unsupported engine version');
  validateInput(source.input);
  assertGameInvariants(source);
  const maximum = limits.plateAppearances ?? 1000, inningLimit = limits.completedInnings ?? 20;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000 || !Number.isInteger(inningLimit) || inningLimit < 1 || inningLimit > 20) throw new RangeError('Invalid chunk budget');
  const state = structuredClone(source), startInnings = state.completedInnings;
  let count = 0;
  while (state.status === 'LIVE' && count < maximum && state.completedInnings - startInnings < inningLimit) {
    if (state.halfPlateAppearances >= 300) return { state, stopReason: 'ENGINE_LIMIT' as const };
    processPlateAppearance(state); count++;
    if (state.status === 'LIVE' && state.input.competition !== 'REGULAR' && state.completedInnings > startInnings && state.completedInnings % 20 === 0) break;
  }
  assertGameInvariants(state);
  return { state, stopReason: state.status === 'FINAL' ? 'FINAL' as const : 'CHUNK_LIMIT' as const };
}

export function assertGameInvariants(state: GameState): void {
  if (!Number.isInteger(state.outs) || state.outs < 0 || state.outs > 2 || state.playCursor !== state.plays.length) throw new Error('INVARIANT_VIOLATION: game cursor/outs');
  for (const team of [0, 1] as const) {
    const batting = state.input.teams[team].lineup.map(p => state.batting[p.simulationKey]!);
    const pitching = state.input.teams[team === 0 ? 1 : 0].pitchers.map(p => state.pitching[p.simulationKey]!);
    const sum = <T>(items: T[], key: keyof T) => items.reduce((n, line) => n + Number(line[key]), 0);
    if (sum(batting, 'R') !== state.scores[team] || sum(pitching, 'R') !== state.scores[team] || state.scoreByInning[team].reduce((a, b) => a + b, 0) !== state.scores[team]) throw new Error('INVARIANT_VIOLATION: runs');
    for (const [batKey, pitchKey] of [['PA', 'BF'], ['H', 'H'], ['BB', 'BB'], ['HBP', 'HBP'], ['K', 'K'], ['HR', 'HR']] as const) if (sum(batting, batKey) !== sum(pitching, pitchKey)) throw new Error('INVARIANT_VIOLATION: cross-team records');
    const plays = state.plays.filter(play => play.half === (team === 0 ? 'TOP' : 'BOTTOM'));
    if (sum(batting, 'PA') !== plays.length || sum(pitching, 'outs') !== plays.reduce((n, p) => n + p.outsAdded, 0)) throw new Error('INVARIANT_VIOLATION: play/box ledger');
    for (const line of batting) {
      if (line.AB !== line.PA - line.BB - line.HBP || line.H > line.AB || line.TB < line.H) throw new Error('INVARIANT_VIOLATION: batting denominator');
    }
    for (const line of pitching) if (line.ER > line.R) throw new Error('INVARIANT_VIOLATION: earned runs');
    for (const value of [...batting, ...pitching].flatMap(Object.values)) if (!Number.isSafeInteger(finite(value)) || value < 0) throw new Error('INVARIANT_VIOLATION: count');
  }
  if (state.status === 'FINAL' && !state.decisions) throw new Error('INVARIANT_VIOLATION: missing decisions');
}

/** Sorted serialization for external SHA256; no platform/owner/physical-ID fields. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return JSON.stringify(finite(value));
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(',')}}`;
  throw new TypeError('Unsupported canonical value');
}
