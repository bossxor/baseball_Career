import { KBO_MONEY, KBO_ROSTER_LIMITS, roleScore } from '@playball/rules';
import type { KboClubGame } from './kbo-club-game.js';
import { kboClubRosterIssues, validateClubLineup } from './kbo-club-game.js';
import { kboFreeAgentTerms, kboPlayerContractValue, kboRenewalSalaryWon } from './kbo-contract-value.js';
import { recordTotals } from './records.js';
import { recentBattingPerformance, recentPitchingPerformance } from './lineup.js';
import { emptyBatting, emptyPitching } from './stats.js';
import { kboAiRoleNeed } from './kbo-ai-offseason.js';
import { kboClubBalance, kboRosterSeasonCharge, reserveKboOffseasonGuarantee } from './kbo-finance.js';
import type { KboInitialContract } from './kbo-world.js';
import type { KboFreeAgentPool } from './kbo-free-agents.js';

const assertRevision = (g: KboClubGame, expected: number) => { if (g.schemaVersion !== 1 || g.revision !== expected) throw new RangeError('CLUB_GAME_REVISION_CHANGED'); };

/** S14 승강: the manager sets the 28-man first team from my club's roster. Structure must hold (28, pitchers 10..15, two catchers,
 * every fielding position); injured players may stay on it. Only between games (preseason or no pending game). A stored lineup
 * that no longer fits is dropped, never silently changed. */
export function setKboClubFirstTeam(source: KboClubGame, expectedRevision: number, firstTeam: readonly string[]): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase === 'SEASON_REVIEW' || (source.phase === 'SEASON_PROGRESS' && source.progress?.pendingGame)) throw new RangeError('CLUB_FIRST_TEAM_LOCKED');
  const game = structuredClone(source), club = game.world.clubs.find(c => c.id === game.userClubId)!;
  if (firstTeam.length !== KBO_ROSTER_LIMITS.firstTeam || new Set(firstTeam).size !== firstTeam.length || firstTeam.some(k => !club.roster.includes(k))) throw new RangeError('INVALID_CLUB_FIRST_TEAM');
  club.firstTeam = [...firstTeam].sort();
  if (kboClubRosterIssues(game).some(i => i !== 'FIRST_TEAM_INJURED')) throw new RangeError('INVALID_CLUB_FIRST_TEAM');
  if (game.lineup && validateClubLineup(game, game.lineup.draft).length) delete game.lineup;
  game.revision++;
  return game;
}

export interface ClubOffer { playerKey: string; annualSalaryWon: number; years: number }
/** S17 읽기: the free agents with their 08 terms (value ×1.2, age-based length) from last season's official lines. */
export function kboClubFreeAgents(game: Pick<KboClubGame, 'freeAgents' | 'records' | 'world'>) {
  const totals = recordTotals(game.records, { leagueKey: 'KBO', phase: 'REGULAR', seasonKey: game.world.seasonKey });
  return Object.entries(game.freeAgents.players).sort(([a], [b]) => (a < b ? -1 : 1)).map(([playerKey, e]) => {
    const t = kboFreeAgentTerms(e.player, totals.batting[playerKey], totals.pitching[playerKey]);
    return { playerKey, name: e.player.name, kind: e.player.kind, position: e.player.position, age: e.player.age, injured: !!e.injury, origin: e.origin, desiredAnnualSalaryWon: t.annualSalaryWon, desiredYears: t.years };
  });
}
/** Up to three offers for the coming free-agent rounds. They are used by the next offseason (the AI runs my club only when no plan
 * exists); each round resolves with the shared 40 odds, and an offer the club cannot afford then is dropped by the market. */
export function planKboClubOffers(source: KboClubGame, expectedRevision: number, offers: readonly ClubOffer[]): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_REVIEW' || !source.seasonClose) throw new RangeError('CLUB_OFFERS_NOT_OPEN');
  if (offers.length > 3 || new Set(offers.map(o => o.playerKey)).size !== offers.length) throw new RangeError('INVALID_CLUB_OFFERS');
  for (const o of offers) {
    if (!Object.hasOwn(source.freeAgents.players, o.playerKey) || !Number.isSafeInteger(o.annualSalaryWon) || o.annualSalaryWon % 10_000 !== 0 || o.annualSalaryWon < KBO_MONEY.minimumSalaryWon || o.annualSalaryWon > KBO_MONEY.maximumSalaryWon || !Number.isInteger(o.years) || o.years < 1 || o.years > 4) throw new RangeError('INVALID_CLUB_OFFERS');
  }
  const game = structuredClone(source);
  if (offers.length) game.offerPlan = offers.map(o => ({ ...o })); else delete game.offerPlan;
  game.revision++;
  return game;
}

export type ClubRosterAction =
  | { playerKey: string; action: 'RENEW' }
  | { playerKey: string; action: 'RELEASE' }
  | { playerKey: string; action: 'TRADE'; counterClubId: string; counterPlayerKey: string };

/** S14/S17: the manager decides, per player, before the next season. Unlisted expiring contracts stay with the AI.
 * A trade has no new odds (D): the other club accepts only an existing role gap of 100. */
export function planKboClubRoster(source: KboClubGame, expectedRevision: number, actions: readonly ClubRosterAction[]): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_REVIEW' || !source.seasonClose) throw new RangeError('CLUB_ROSTER_PLAN_NOT_OPEN');
  const club = source.world.clubs.find(c => c.id === source.userClubId)!;
  const seen = new Set<string>(), incoming = new Set<string>();
  for (const a of actions) {
    if (seen.has(a.playerKey) || !club.roster.includes(a.playerKey)) throw new RangeError('INVALID_CLUB_ROSTER_PLAN');
    seen.add(a.playerKey);
    if (a.action === 'TRADE') {
      if (a.counterClubId === source.userClubId || incoming.has(a.counterPlayerKey)) throw new RangeError('INVALID_CLUB_ROSTER_PLAN');
      const other = source.world.clubs.find(c => c.id === a.counterClubId);
      if (!other?.roster.includes(a.counterPlayerKey)) throw new RangeError('INVALID_CLUB_ROSTER_PLAN');
      incoming.add(a.counterPlayerKey);
    }
  }
  const game = structuredClone(source);
  if (actions.length) game.rosterPlan = actions.map(a => ({ ...a })); else delete game.rosterPlan;
  game.revision++;
  return game;
}

/** Mutates the already-cloned next-season game. Expiring keys the manager handled are removed from the AI list. */
export function applyKboClubRosterPlan(game: KboClubGame, prior: Readonly<Record<string, KboInitialContract>>, closedSeasonKey: string, expiring: string[], pool: KboFreeAgentPool): void {
  const plan = game.rosterPlan ?? [];
  if (!plan.length) return;
  const mine = game.userClubId;
  const totals = recordTotals(game.records, { leagueKey: 'KBO', phase: 'REGULAR', seasonKey: closedSeasonKey });
  for (const a of plan) {
    if (a.action !== 'TRADE') continue;
    const counter = game.world.clubs.find(c => c.id === a.counterClubId)!;
    const incoming = game.world.players[a.counterPlayerKey]!;
    const need = kboAiRoleNeed(incoming, counter.roster.map(k => game.world.players[k]!));
    if (need.needScore !== 100) throw new RangeError('CLUB_TRADE_REFUSED');
    if (expiring.includes(a.playerKey) || expiring.includes(a.counterPlayerKey)) throw new RangeError('CLUB_TRADE_EXPIRING');
    swapClub(game, a.playerKey, mine, a.counterPlayerKey, a.counterClubId);
  }
  for (const a of plan) {
    if (a.action === 'RENEW') {
      if (!expiring.includes(a.playerKey)) throw new RangeError('CLUB_RENEWAL_NOT_EXPIRING');
      const old = prior[a.playerKey]!, player = game.world.players[a.playerKey]!;
      const salary = kboRenewalSalaryWon(old.annualSalaryWon, kboPlayerContractValue(player, totals.batting[a.playerKey], totals.pitching[a.playerKey]).valueWon);
      const club = game.world.clubs.find(c => c.id === mine)!;
      club.reservedSalaryWon = kboRosterSeasonCharge(game.world, mine) - game.world.contracts[a.playerKey]!.annualSalaryWon + salary;
      const balance = kboClubBalance(game.world, mine);
      const protectedWon = Math.max(0, KBO_ROSTER_LIMITS.minimum - club.roster.length) * KBO_MONEY.minimumSalaryWon;
      if (club.paidSalaryWon + club.reservedSalaryWon + balance.guaranteedWon + protectedWon > club.budgetWon + balance.supportWon) throw new RangeError('CLUB_RENEWAL_UNAFFORDABLE');
      game.world.contracts[a.playerKey] = { playerKey: a.playerKey, clubId: mine, signingBonusWon: 0, status: 'ACTIVE', contractKey: JSON.stringify(['kbo-user-renewal', game.world.worldKey, game.world.seasonKey, a.playerKey]), seasonKey: game.world.seasonKey, years: 1, annualSalaryWon: salary };
      club.reservedSalaryWon = kboRosterSeasonCharge(game.world, mine);
      expiring.splice(expiring.indexOf(a.playerKey), 1);
    } else if (a.action === 'RELEASE') {
      releaseToPool(game, pool, a.playerKey, prior[a.playerKey]!, closedSeasonKey);
      const at = expiring.indexOf(a.playerKey);
      if (at >= 0) expiring.splice(at, 1);
    }
  }
}

function swapClub(game: KboClubGame, userKey: string, userClubId: string, counterKey: string, counterClubId: string): void {
  const user = game.world.clubs.find(c => c.id === userClubId)!, counter = game.world.clubs.find(c => c.id === counterClubId)!;
  user.roster = user.roster.map(k => k === userKey ? counterKey : k).sort();
  counter.roster = counter.roster.map(k => k === counterKey ? userKey : k).sort();
  user.firstTeam = user.firstTeam.filter(k => k !== userKey);
  counter.firstTeam = counter.firstTeam.filter(k => k !== counterKey);
  game.world.contracts[userKey] = { ...game.world.contracts[userKey]!, clubId: counterClubId };
  game.world.contracts[counterKey] = { ...game.world.contracts[counterKey]!, clubId: userClubId };
  user.reservedSalaryWon = kboRosterSeasonCharge(game.world, userClubId);
  counter.reservedSalaryWon = kboRosterSeasonCharge(game.world, counterClubId);
}

function releaseToPool(game: KboClubGame, pool: KboFreeAgentPool, key: string, prior: KboInitialContract, closedSeasonKey: string): void {
  const club = game.world.clubs.find(c => c.roster.includes(key));
  if (!club) throw new RangeError('INVALID_CLUB_ROSTER_PLAN');
  reserveKboOffseasonGuarantee(game.world, prior, closedSeasonKey, 'RELEASE');
  const player = game.world.players[key]!, book = game.world.repertoires[key], injury = game.health.injuries[key];
  pool.players[key] = { player: structuredClone(player), ...(book ? { repertoire: structuredClone(book) } : {}), ...(injury ? { injury: structuredClone(injury) } : {}), origin: 'RELEASED', enteredSeasonKey: game.world.seasonKey, previousClubId: prior.clubId, previousContract: structuredClone(prior) };
  club.roster = club.roster.filter(k => k !== key);
  club.firstTeam = club.firstTeam.filter(k => k !== key);
  delete game.world.players[key]; delete game.world.contracts[key]; delete game.world.repertoires[key]; delete game.health.injuries[key];
  club.reservedSalaryWon = kboRosterSeasonCharge(game.world, club.id);
}

export type BullpenRole = 'CP' | 'SU' | 'MR' | 'LR';
const BULLPEN_COUNT: Record<BullpenRole, number> = { CP: 1, SU: 2, MR: 4, LR: 1 };
export type BullpenIssue = { code: 'BULLPEN_COUNT' | 'NOT_RELIEVER' | 'DUPLICATE_PLAYER' | 'CP_INJURED'; playerKey?: string };

/** 05 CP1/SU2/MR4/LR1. Only first-team RP/CP. An injured CP is a recommendation, not a silent swap. */
export function validateClubBullpen(game: Pick<KboClubGame, 'world' | 'userClubId' | 'health' | 'bullpen'>): BullpenIssue[] {
  const slots = game.bullpen?.slots; if (!slots) return [];
  const issues: BullpenIssue[] = [], seen = new Set<string>(), counts: Record<BullpenRole, number> = { CP: 0, SU: 0, MR: 0, LR: 0 };
  const first = new Set(game.world.clubs.find(c => c.id === game.userClubId)!.firstTeam);
  for (const [key, role] of Object.entries(slots)) {
    const p = game.world.players[key];
    if (seen.has(key)) issues.push({ code: 'DUPLICATE_PLAYER', playerKey: key });
    seen.add(key);
    if (!p || p.kind !== 'PITCHER' || p.position === 'SP' || !first.has(key) || !BULLPEN_COUNT[role]) issues.push({ code: 'NOT_RELIEVER', playerKey: key });
    else counts[role]++;
    if (role === 'CP' && Object.hasOwn(game.health.injuries, key)) issues.push({ code: 'CP_INJURED', playerKey: key });
  }
  if ((Object.keys(BULLPEN_COUNT) as BullpenRole[]).some(role => counts[role] !== BULLPEN_COUNT[role])) issues.push({ code: 'BULLPEN_COUNT' });
  return issues;
}

/** D: no new rating. Registered CP takes the CP slot, then existing roleScore, then id. */
export function autoClubBullpen(game: Pick<KboClubGame, 'world' | 'userClubId' | 'health'>): Record<string, BullpenRole> {
  const club = game.world.clubs.find(c => c.id === game.userClubId)!;
  const relievers = club.firstTeam.map(k => game.world.players[k]!).filter(p => p.kind === 'PITCHER' && p.position !== 'SP')
    .sort((a, b) => Number(b.position === 'CP') - Number(a.position === 'CP') || roleScore(b.kind, b.abilities, b.position) - roleScore(a.kind, a.abilities, a.position) || (a.simulationKey < b.simulationKey ? -1 : 1));
  const roles: BullpenRole[] = ['CP', 'SU', 'SU', 'MR', 'MR', 'MR', 'MR', 'LR'];
  if (relievers.length < roles.length) throw new RangeError('NO_CLUB_BULLPEN');
  return Object.fromEntries(roles.map((role, i) => [relievers[i]!.simulationKey, role]));
}

export function setKboClubBullpen(source: KboClubGame, expectedRevision: number, slots: Readonly<Record<string, BullpenRole>> | null): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase === 'SEASON_REVIEW') throw new RangeError('CLUB_BULLPEN_LOCKED');
  const game = structuredClone(source);
  if (!slots) { delete game.bullpen; game.revision++; return game; }
  game.bullpen = { slots: { ...slots } };
  if (validateClubBullpen(game).some(i => i.code !== 'CP_INJURED')) throw new RangeError('CLUB_BULLPEN_INVALID');
  game.revision++;
  return game;
}

/** Healthy same-position futures player, 01/08 score (roleScore×.8 + performance×.2). Recommendation only. */
export function recommendClubCallup(game: Pick<KboClubGame, 'world' | 'userClubId' | 'health' | 'records'>) {
  const club = game.world.clubs.find(c => c.id === game.userClubId)!, first = new Set(club.firstTeam);
  const totals = recordTotals(game.records, { leagueKey: 'KBO', phase: 'REGULAR', seasonKey: game.world.seasonKey });
  const futuresTotals = recordTotals(game.records, { leagueKey: 'FUTURES', phase: 'REGULAR', seasonKey: game.world.seasonKey });
  const score = (key: string, league: 'KBO' | 'FUTURES') => {
    const p = game.world.players[key]!, lines = league === 'KBO' ? totals : futuresTotals;
    const bat = lines.batting[key] ? { ...emptyBatting(), ...pickLine(lines.batting[key]!, Object.keys(emptyBatting())) } : emptyBatting();
    const pit = lines.pitching[key] ? { ...emptyPitching(), ...pickLine(lines.pitching[key]!, Object.keys(emptyPitching())) } : emptyPitching();
    const perf = p.kind === 'HITTER' ? recentBattingPerformance(bat) : recentPitchingPerformance(pit);
    return .8 * roleScore(p.kind, p.abilities, p.position) + .2 * perf;
  };
  for (const injuredKey of club.firstTeam.filter(k => Object.hasOwn(game.health.injuries, k)).sort()) {
    const me = game.world.players[injuredKey]!;
    const candidates = club.roster.filter(k => !first.has(k) && !Object.hasOwn(game.health.injuries, k) && game.world.players[k]!.kind === me.kind && game.world.players[k]!.position === me.position)
      .map(k => ({ key: k, score: score(k, 'FUTURES'), fatigue: game.world.players[k]!.fatigue }))
      .sort((a, b) => b.score - a.score || a.fatigue - b.fatigue || (a.key < b.key ? -1 : 1));
    const best = candidates[0];
    if (best) return { injuredKey, candidateKey: best.key, candidateScore: best.score };
  }
  return null;
}

function pickLine<T extends object>(source: T, keys: readonly string[]): Partial<T> {
  return Object.fromEntries(Object.entries(source).filter(([k]) => keys.includes(k))) as Partial<T>;
}
