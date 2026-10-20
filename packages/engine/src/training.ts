import { abilityKeys } from '@playball/rules';
import { validateDevelopmentPlayer } from './player.js';
import type { DevelopmentPlayer } from './player.js';
import { nextFloat } from './rng.js';
import type { RngState } from './rng.js';

export interface TrainingContext { seasonId: string; completedTeamGames: number; scheduledTeamGames: number; injured: boolean; windowOpen: boolean; careerCheat: boolean }
export type TrainingChoice = { type: 'GUARANTEED' | 'CHALLENGE'; ability: string } | { type: 'CONDITIONING' | 'SKIP' };
export function trainingPreview(player: DevelopmentPlayer, usedSeasons: readonly string[], choice: TrainingChoice, context: TrainingContext) {
  validateDevelopmentPlayer(player);
  if (!context.seasonId || !Number.isInteger(context.scheduledTeamGames) || context.scheduledTeamGames < 1 || !Number.isInteger(context.completedTeamGames) || context.completedTeamGames < 0 || context.completedTeamGames > context.scheduledTeamGames) throw new RangeError('INVALID_TRAINING_CONTEXT');
  let reason: string | null = usedSeasons.includes(context.seasonId) ? 'LIMIT_REACHED' : !context.windowOpen || context.completedTeamGames < Math.ceil(context.scheduledTeamGames / 3) ? 'WINDOW_CLOSED' : null;
  let gainUnits = 0, fatigueDelta = 0, probability: number | null = null;
  if (choice.type === 'GUARANTEED' || choice.type === 'CHALLENGE') {
    if (!abilityKeys(player.kind).includes(choice.ability as never)) throw new RangeError('INVALID_ABILITY');
    const capacity = player.potential[choice.ability]! - player.abilities[choice.ability]!;
    if (context.injured) reason ??= 'INJURED';
    if (capacity < 10_000) reason ??= 'POTENTIAL_CAP';
    gainUnits = Math.min(choice.type === 'CHALLENGE' ? 20_000 : 10_000, capacity);
    fatigueDelta = Math.min(choice.type === 'CHALLENGE' ? 10 : 5, 100 - player.fatigue);
    probability = choice.type === 'CHALLENGE' ? context.careerCheat ? 1 : .60 : null;
  } else if (choice.type === 'CONDITIONING') fatigueDelta = -Math.min(20, player.fatigue);
  else if (choice.type !== 'SKIP') throw new RangeError('INVALID_TRAINING_CHOICE');
  return { eligible: reason === null, reason, gainUnits: reason === null ? gainUnits : 0, fatigueDelta: reason === null ? fatigueDelta : 0, probability, uses: reason === null ? 1 : 0 };
}
/** Server-owned context/policy, never accepted as arbitrary client flags in the API. */
export function applySeasonTraining(source: DevelopmentPlayer, usedSeasons: readonly string[], choice: TrainingChoice, context: TrainingContext, rng: RngState) {
  const preview = trainingPreview(source, usedSeasons, choice, context);
  if (!preview.eligible) throw new RangeError(preview.reason!);
  const player = structuredClone(source); let state = rng, success = true;
  if (choice.type === 'CHALLENGE' && preview.probability !== 1) { const draw = nextFloat(state); state = draw.state; success = draw.value < preview.probability!; }
  if (choice.type === 'GUARANTEED' || choice.type === 'CHALLENGE') {
    if (success) {
      player.abilities = { ...player.abilities, [choice.ability]: player.abilities[choice.ability]! + preview.gainUnits };
      player.careerPeaks = { ...player.careerPeaks, [choice.ability]: Math.max(player.careerPeaks[choice.ability]!, player.abilities[choice.ability]!) };
    }
  }
  player.fatigue += preview.fatigueDelta;
  return { player, usedSeasons: [...usedSeasons, context.seasonId], success, gainUnits: success ? preview.gainUnits : 0, state };
}
