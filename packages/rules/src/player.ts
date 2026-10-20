import { countGraphemes } from 'unicode-segmenter/grapheme';

export type Difficulty = 'GROWTH' | 'REALISTIC' | 'SECRET_CHEAT';
export const NAME_SEGMENTATION_VERSION = 'unicode-segmenter-0.17.3';
export function normalizePlayerName(raw: string): string {
  if (typeof raw !== 'string' || /[\p{Cc}\p{Cs}\p{Zl}\p{Zp}]/u.test(raw)) throw new RangeError('INVALID_NAME');
  const name = raw.normalize('NFC').trim();
  if (!name || countGraphemes(name) > 12) throw new RangeError('INVALID_NAME_LENGTH');
  return name;
}
/** Relative weights: balanced1:1:1:1:1:1 exactly represents six equal16⅔% shares. */
export interface Archetype { label: string; initial: readonly number[]; weights: readonly number[] }
const profile = (label: string, initial: number[], weights: number[]): Readonly<Archetype> => Object.freeze({ label, initial: Object.freeze(initial), weights: Object.freeze(weights) });
export const HITTER_TYPES: Readonly<Record<string, Readonly<Archetype>>> = Object.freeze({
  BALANCED: profile('균형형', [50,50,50,50,50,50], [1,1,1,1,1,1]),
  SLUGGER: profile('거포형', [40,70,45,40,40,65], [20,50,10,5,5,10]),
  SLUGGER_DEFENSE: profile('거포수비형', [40,65,35,70,35,55], [10,35,5,35,5,10]),
  CONTACT: profile('교타형', [70,30,60,45,50,45], [45,5,25,10,10,5]),
  ON_BASE: profile('출루형', [55,30,75,45,45,50], [25,5,45,10,10,5]),
  ON_BASE_DEFENSE: profile('출루수비형', [45,30,65,70,40,50], [10,5,35,35,5,10]),
  DEFENSE_RUNNING: profile('수비주루형', [35,30,40,75,75,45], [5,5,10,35,40,5]),
  FIVE_TOOL: profile('5툴형', [55,55,40,55,55,40], [20,20,10,20,20,10]),
});
export const PITCHER_TYPES: Readonly<Record<string, Readonly<Archetype>>> = Object.freeze({
  BALANCED: profile('균형형', [50,50,50,50,50,50], [1,1,1,1,1,1]),
  VELOCITY: profile('강속구형', [70,65,35,40,50,40], [40,30,10,5,10,5]),
  COMMAND: profile('제구형', [40,45,75,55,45,40], [5,15,45,20,10,5]),
  STUFF_COMMAND: profile('구위제구형', [40,65,65,45,45,40], [10,35,35,5,10,5]),
  INNINGS: profile('이닝소화형', [40,40,55,45,75,45], [5,10,20,10,50,5]),
  COMPOSURE: profile('위기관리형', [40,45,55,75,45,40], [5,15,20,40,15,5]),
});
