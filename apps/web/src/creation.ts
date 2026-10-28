import { HITTER_TYPES, PITCHER_TYPES, HITTER_ABILITIES, PITCHER_ABILITIES, ABILITY_LABELS, FOCUS_COUNT, PITCH_FORMS, UNITS_PER_POINT, normalizePlayerName, overall } from '@playball/rules';
import type { PlayerKind, AbilityKey } from '@playball/rules';
import type { CreationRequest } from './model.js';

/** S02 creation draft and its pure validation (01: 이름→타자/투수→포지션→투타→유형→집중→확인). */
export type PitchForm = (typeof PITCH_FORMS)[number];
export interface CreationDraft {
  name: string; kind: PlayerKind | null; position: string | null; throws: 'R' | 'L' | null; bats: 'R' | 'L' | 'S' | null;
  pitchForm: PitchForm | null; archetype: string | null; focus: readonly string[]; secondaryPitch?: string | null;
}
export const emptyDraft = (): CreationDraft => ({ name: '', kind: null, position: null, throws: null, bats: null, pitchForm: null, archetype: null, focus: [] });
export const CREATION_STEPS = ['NAME', 'KIND', 'POSITION', 'HANDS', 'TYPE', 'FOCUS', 'CONFIRM'] as const;
export type CreationStep = (typeof CREATION_STEPS)[number];
export const STEP_LABELS: Readonly<Record<CreationStep, string>> = { NAME: '이름', KIND: '타자/투수', POSITION: '포지션', HANDS: '투타', TYPE: '유형', FOCUS: '집중 육성', CONFIRM: '확인' };
export const POSITIONS: Readonly<Record<PlayerKind, readonly string[]>> = { HITTER: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'], PITCHER: ['SP', 'RP', 'CP'] };
export const POSITION_LABELS: Readonly<Record<string, string>> = { C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수', SS: '유격수', LF: '좌익수', CF: '중견수', RF: '우익수', DH: '지명타자', SP: '선발', RP: '중간', CP: '마무리' };
export const FORM_LABELS: Readonly<Record<PitchForm, string>> = { OVERHAND: '오버핸드', THREE_QUARTER: '스리쿼터', SIDEARM: '사이드암', UNDERHAND: '언더핸드' };
export const PITCH_FORM_LIST: readonly PitchForm[] = PITCH_FORMS;
/** Left-handed throwers cannot play these positions (lineup rule). */
export const LEFT_THROW_BLOCKED = ['C', '2B', '3B', 'SS'] as const;
export const typesFor = (kind: PlayerKind) => (kind === 'HITTER' ? HITTER_TYPES : PITCHER_TYPES);
export const abilitiesFor = (kind: PlayerKind): readonly AbilityKey[] => (kind === 'HITTER' ? HITTER_ABILITIES : PITCHER_ABILITIES);
export const SECONDARY_PITCHES: Readonly<Record<string, string>> = { P02: '투심', P03: '슬라이더', P04: '커브', P05: '체인지업', P06: '스플리터', P07: '커터' };
export type FieldErrors = Partial<Record<'name' | 'kind' | 'position' | 'throws' | 'bats' | 'pitchForm' | 'secondaryPitch' | 'archetype' | 'focus', string>>;

/** Errors that block leaving `step`; the messages sit next to the input. Never throws. */
export function validateStep(d: CreationDraft, step: CreationStep): FieldErrors {
  const e: FieldErrors = {};
  if (step === 'NAME') {
    try { normalizePlayerName(d.name); } catch (x) { e.name = (x as Error).message === 'INVALID_NAME' ? '이름에 쓸 수 없는 문자가 있습니다.' : '이름은 공백을 뺀 1~12글자로 입력하세요.'; }
  }
  if (step === 'KIND' && !d.kind) e.kind = '타자와 투수 중 하나를 선택하세요.';
  if (step === 'POSITION') {
    if (!d.kind) e.kind = '먼저 타자/투수를 선택하세요.';
    else if (!d.position || !POSITIONS[d.kind].includes(d.position)) e.position = '포지션을 선택하세요.';
  }
  if (step === 'HANDS') {
    if (!d.throws) e.throws = '던지는 손을 선택하세요.';
    if (!d.bats) e.bats = '치는 쪽을 선택하세요.';
    if (d.kind === 'PITCHER' && !d.pitchForm) e.pitchForm = '투구폼을 선택하세요.';
    if (d.kind === 'PITCHER' && (!d.secondaryPitch || !Object.hasOwn(SECONDARY_PITCHES, d.secondaryPitch))) e.secondaryPitch = '포심과 함께 사용할 보조 구종을 선택하세요.';
    if (d.throws === 'L' && d.position && (LEFT_THROW_BLOCKED as readonly string[]).includes(d.position)) e.throws = '좌투는 포수·2루수·3루수·유격수를 맡을 수 없습니다. 포지션이나 던지는 손을 바꾸세요.';
  }
  if (step === 'TYPE' && (!d.kind || !d.archetype || !Object.hasOwn(typesFor(d.kind), d.archetype))) e.archetype = '유형을 선택하세요.';
  if (step === 'FOCUS' && (!d.kind || d.focus.length !== FOCUS_COUNT || new Set(d.focus).size !== FOCUS_COUNT || d.focus.some(k => !abilitiesFor(d.kind!).includes(k as AbilityKey)))) e.focus = `서로 다른 육성 능력 ${FOCUS_COUNT}개를 선택하세요.`;
  return e;
}
export const firstInvalidStep = (d: CreationDraft): CreationStep | null => CREATION_STEPS.find(s => s !== 'CONFIRM' && Object.keys(validateStep(d, s)).length > 0) ?? null;
/** Toggle one focus ability: a fifth pick is refused instead of dropping an earlier one silently. */
export function toggleFocus(d: CreationDraft, key: string): CreationDraft {
  if (d.focus.includes(key)) return { ...d, focus: d.focus.filter(k => k !== key) };
  return d.focus.length >= FOCUS_COUNT ? d : { ...d, focus: [...d.focus, key] };
}
/** Changing kind resets everything that depends on it. */
export function setKind(d: CreationDraft, kind: PlayerKind): CreationDraft {
  return d.kind === kind ? d : { ...d, kind, position: null, pitchForm: null, secondaryPitch: null, archetype: null, focus: [] };
}
export interface Preview { archetypeLabel: string; overall: string; abilities: readonly { key: AbilityKey; label: string; value: number; focus: boolean }[] }
/** S02 empty state until a type and four focus abilities exist; then the starting abilities of the chosen type. */
export function previewOf(d: CreationDraft): Preview | null {
  if (!d.kind || !d.archetype || d.focus.length !== FOCUS_COUNT || !Object.hasOwn(typesFor(d.kind), d.archetype)) return null;
  const type = typesFor(d.kind)[d.archetype]!, keys = abilitiesFor(d.kind);
  const units = Object.fromEntries(keys.map((k, i) => [k, type.initial[i]! * UNITS_PER_POINT]));
  return { archetypeLabel: type.label, overall: overall(d.kind, units).display, abilities: keys.map((k, i) => ({ key: k, label: ABILITY_LABELS[k], value: type.initial[i]!, focus: d.focus.includes(k) })) };
}
/** Complete, valid draft → the command payload. The caller supplies the idempotency id (a retry reuses it). */
export function toCreationRequest(d: CreationDraft, commandId: string): CreationRequest | null {
  if (firstInvalidStep(d)) return null;
  return { commandId, name: normalizePlayerName(d.name), kind: d.kind!, position: d.position!, throws: d.throws!, bats: d.bats!, pitchForm: d.kind === 'PITCHER' ? d.pitchForm : null, ...(d.kind === 'PITCHER' ? { secondaryPitch: d.secondaryPitch! } : {}), archetype: d.archetype!, focus: [...d.focus] };
}
