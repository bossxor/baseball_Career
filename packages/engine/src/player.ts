import { abilityKeys, assertAbilities, assertFocus, HITTER_TYPES, PITCHER_TYPES, PITCH_FORMS, normalizePlayerName } from '@playball/rules';
import type { AbilityUnits, PlayerKind, Difficulty, Archetype } from '@playball/rules';
import { clamp } from './probabilities.js';
import type { PitchForm, Hand, BatSide } from './probabilities.js';
import { nextFloat } from './rng.js';
import type { RngState } from './rng.js';

export interface DevelopmentPlayer {
  simulationKey: string; name: string; kind: PlayerKind; age: number; position: string;
  throws: Hand; bats: BatSide; pitchForm: PitchForm | null; archetype: string; focus: readonly string[];
  abilities: AbilityUnits; potential: AbilityUnits; careerPeaks: AbilityUnits; fatigue: number;
}
export interface CreationInput {
  simulationKey: string; name: string; kind: PlayerKind; position: string; throws: Hand; bats: BatSide;
  pitchForm: PitchForm | null; archetype: string; focus: readonly string[]; difficulty: Difficulty;
}
export function archetypeFor(kind: PlayerKind, id: string): Readonly<Archetype> {
  const table = kind === 'HITTER' ? HITTER_TYPES : PITCHER_TYPES;
  if (!Object.hasOwn(table, id)) throw new RangeError('INVALID_ARCHETYPE');
  return table[id]!;
}
export function validateDevelopmentPlayer(player: DevelopmentPlayer): void {
  assertAbilities(player.kind, player.abilities); assertAbilities(player.kind, player.potential); assertAbilities(player.kind, player.careerPeaks);
  assertFocus(player.kind, player.focus); archetypeFor(player.kind, player.archetype);
  for (const key of abilityKeys(player.kind)) if (player.abilities[key]! > player.potential[key]! || player.careerPeaks[key]! < player.abilities[key]!) throw new RangeError('INVALID_PLAYER_CAP');
  if (!Number.isFinite(player.fatigue) || player.fatigue < 0 || player.fatigue > 100 || !Number.isSafeInteger(player.age) || player.age < 18 || !player.simulationKey || player.simulationKey.length > 128) throw new RangeError('INVALID_PLAYER_STATE');
}
/** Box-Muller, reject outside[-2,2], no hidden cached normal. Fixed order by six canonical keys. */
function truncatedNormal(rng: RngState) {
  let state = rng;
  for (let i = 0; i < 10_000; i++) {
    const a = nextFloat(state), b = nextFloat(a.state); state = b.state;
    const z = Math.sqrt(-2 * Math.log(1 - a.value)) * Math.cos(2 * Math.PI * b.value);
    if (Math.abs(z) <= 2) return { value: z, state };
  }
  throw new Error('GENERATION_LIMIT');
}
export function createCareerPlayer(input: CreationInput, rng: RngState) {
  const name = normalizePlayerName(input.name), keys = abilityKeys(input.kind);
  if (!input.simulationKey || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(input.difficulty) || !['R','L'].includes(input.throws) || !['R','L','S'].includes(input.bats)) throw new RangeError('INVALID_CREATION');
  const positions = input.kind === 'HITTER' ? ['C','1B','2B','3B','SS','LF','CF','RF','DH'] : ['SP','RP','CP'];
  if (!positions.includes(input.position) || input.throws === 'L' && ['C','2B','3B','SS'].includes(input.position)) throw new RangeError('INVALID_POSITION');
  if (input.kind === 'HITTER' ? input.pitchForm !== null : !PITCH_FORMS.includes(input.pitchForm!)) throw new RangeError('INVALID_PITCH_FORM');
  assertFocus(input.kind, input.focus);
  const type = archetypeFor(input.kind, input.archetype);
  const abilities = Object.fromEntries(keys.map((key, i) => [key, type.initial[i]! * 10_000]));
  const potential: Record<string, number> = {};
  let state = rng;
  for (const key of keys) {
    const normal = truncatedNormal(state); state = normal.state;
    potential[key] = input.difficulty === 'SECRET_CHEAT' ? 1_000_000 : clamp(Math.round(75 + 10 * normal.value), Math.max(abilities[key]! / 10_000, 60), 95) * 10_000;
  }
  const player: DevelopmentPlayer = { simulationKey: input.simulationKey, name, kind: input.kind, age: 18, position: input.position, throws: input.throws, bats: input.bats, pitchForm: input.pitchForm, archetype: input.archetype, focus: [...input.focus], abilities, potential, careerPeaks: { ...abilities }, fatigue: 0 };
  validateDevelopmentPlayer(player);
  return { player, state };
}
