import { UNITS_PER_POINT, abilityKeys, roleScore } from '@playball/rules';
import type { AbilityUnits, PlayerKind } from '@playball/rules';
import type { KboClubGame } from './kbo-club-game.js';
import { recordTotals } from './records.js';

/** 12: 28 Korean players. WBC/OLY/P12 need a first-team game. AG may use Futures and Sangmu. */
/** 2026-10-27 U: other countries use these overalls. All six abilities equal that value. */
export const NATIONAL_PRESET_OVERALL = { STRONG: 65, MID: 55, WEAK: 45 } as const;
export type NationalPreset = keyof typeof NATIONAL_PRESET_OVERALL;
const PRESET_ORDER = ['STRONG', 'MID', 'WEAK'] as const;
export type NationalEvent = 'WBC' | 'OLY' | 'AG' | 'P12';
const EVENTS = new Set<NationalEvent>(['WBC', 'OLY', 'AG', 'P12']);
const FIELD = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const;

interface Candidate { key: string; kind: PlayerKind; position: string; score: number }

export function selectClubNationalRoster(game: Pick<KboClubGame, 'world' | 'records' | 'health' | 'sangmu'>, type: NationalEvent) {
  if (!EVENTS.has(type)) throw new RangeError('UNKNOWN_NATIONAL_EVENT');
  const seasonKey = game.world.seasonKey;
  const totals = recordTotals(game.records, { leagueKey: 'KBO', phase: 'REGULAR', seasonKey });
  const played = (key: string) => (totals.batting[key]?.games ?? 0) + (totals.pitching[key]?.games ?? 0) > 0;
  const serving = new Set(Object.keys(game.sangmu?.members ?? {}));
  const pool: Candidate[] = [];
  const add = (key: string, kind: PlayerKind, position: string, abilities: AbilityUnits) => {
    if (Object.hasOwn(game.health.injuries, key)) return;
    if (serving.has(key) && type !== 'AG') return;
    if (type !== 'AG' && !played(key)) return;
    pool.push({ key, kind, position, score: roleScore(kind, abilities, position) });
  };
  for (const player of Object.values(game.world.players)) add(player.simulationKey, player.kind, player.position, player.abilities);
  if (type === 'AG') for (const [key, member] of Object.entries(game.sangmu?.members ?? {})) add(key, member.player.kind, member.player.position, member.player.abilities);
  const byScore = (a: Candidate, b: Candidate) => b.score - a.score || (a.key < b.key ? -1 : 1);
  const hitters = pool.filter(player => player.kind === 'HITTER').sort(byScore);
  const chosen: Candidate[] = [];
  const take = (match: (player: Candidate) => boolean, count: number) => {
    let got = 0;
    for (const player of hitters) if (got < count && match(player) && !chosen.includes(player)) { chosen.push(player); got++; }
  };
  take(player => player.position === 'C', 2);
  for (const position of FIELD) if (position !== 'C') take(player => player.position === position, 1);
  for (const player of hitters) if (chosen.length < 15 && !chosen.includes(player)) chosen.push(player);
  const pitchers = pool.filter(player => player.kind === 'PITCHER').sort(byScore).slice(0, 13);
  return { seasonKey, type, playerKeys: [...chosen, ...pitchers].map(player => player.key) };
}

/** Stores one roster per event per season. Does not play the tournament. */
export function saveClubNationalRoster(source: KboClubGame, expectedRevision: number, type: NationalEvent): KboClubGame {
  if (source.schemaVersion !== 1 || source.revision !== expectedRevision) throw new RangeError('CLUB_GAME_REVISION_CHANGED');
  if (source.national?.some(roster => roster.seasonKey === source.world.seasonKey && roster.type === type)) throw new RangeError('NATIONAL_ALREADY_SELECTED');
  const game = structuredClone(source);
  const roster = selectClubNationalRoster(game, type);
  game.national = [...(game.national ?? []), roster];
  game.revision++;
  return game;
}

function fnv(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash;
}

/** 20: spread 강/중/약 as evenly as the country count allows. The seed order is fixed. */
export function assignNationalPresets(seed: string, countryIds: readonly string[]) {
  const order = [...countryIds].sort((a, b) => fnv(JSON.stringify(['national-preset', seed, a])) - fnv(JSON.stringify(['national-preset', seed, b])) || (a < b ? -1 : 1));
  return order.map((countryId, index) => {
    const preset = PRESET_ORDER[index % 3]!;
    return { countryId, preset, overall: NATIONAL_PRESET_OVERALL[preset] };
  });
}

const HITTER_SLOTS = ['C', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', '1B', '2B', 'LF', 'CF', 'RF'] as const;
const PITCHER_SLOTS = ['SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'RP', 'RP', 'CP', 'CP'] as const;

export function nationalPresetAbilities(kind: PlayerKind, overall: number): AbilityUnits {
  const units = overall * UNITS_PER_POINT;
  return Object.fromEntries(abilityKeys(kind).map(key => [key, units])) as AbilityUnits;
}

/** One foreign national team at a single preset. Korea is not generated here. */
export function nationalOpponentRoster(countryId: string, overall: number) {
  const hitters = HITTER_SLOTS.map((position, index) => ({ key: `${countryId}:H:${index}`, kind: 'HITTER' as const, position, abilities: nationalPresetAbilities('HITTER', overall) }));
  const pitchers = PITCHER_SLOTS.map((position, index) => ({ key: `${countryId}:P:${index}`, kind: 'PITCHER' as const, position, abilities: nationalPresetAbilities('PITCHER', overall) }));
  return [...hitters, ...pitchers];
}
