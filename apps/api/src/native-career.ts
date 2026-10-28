import {
  advanceHighSchoolCareer, confirmCareerPlayer, confirmCareerPreseason, createHighSchoolCareer, createHighSchoolWorld,
  eventDefinition, recordTotals, resolveCareerFocusEvent, resolveCareerWindowEvent,
} from '@playball/engine';
import type { CreationInput, HighSchoolCareer } from '@playball/engine';
import { PITCH_IDS } from '@playball/rules';
import type { PitchId } from '@playball/rules';
import type { CareerView, ChooseNext, DecisionView, ProgressMode, UiShellState } from './ui-shell.js';
import { applyUiSeed, isPlayScreenId } from './ui-shell.js';

export type NativeCareerState = UiShellState & { career?: HighSchoolCareer; careerEngine?: 'M2' };
const unsupported = '이 경로의 실제 플레이 화면은 아직 연결되지 않았습니다. 기록을 확인하거나 커리어로 돌아가세요.';
const invalid = (): never => { throw Object.assign(new Error('NATIVE_CAREER_ACTION_UNAVAILABLE'), { code: 'INVALID_REQUEST' }); };
const positionLabels: Record<string, string> = { C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수', SS: '유격수', LF: '좌익수', CF: '중견수', RF: '우익수', DH: '지명타자', SP: '선발', RP: '중간', CP: '마무리' };
const phaseLabels: Record<string, string> = { EVENT_DECISION: '사건 선택', PRESEASON_SETUP: '시즌 준비', SEASON_PROGRESS: '정규시즌', SEASON_REVIEW: '시즌 결산', CAREER_ROUTE: '졸업 진로' };
const saveSummary = (career: HighSchoolCareer) => ({ name: career.world.players[career.world.protagonistKey]!.name, seasonKey: career.world.seasonKey });
const currentEvent = (career: HighSchoolCareer) => {
  const phase = career.phaseContext;
  return phase.phase === 'EVENT_DECISION' ? career.events.find(e => e.eventKey === phase.eventKey && e.status === 'OPEN') : undefined;
};

function recordsOf(career: HighSchoolCareer): CareerView['recentRecords'] {
  const player = career.world.players[career.world.protagonistKey]!;
  const totals = recordTotals(career.records, { leagueKey: 'HS', phase: 'REGULAR', seasonKey: career.world.seasonKey });
  const batting = totals.batting[player.simulationKey], pitching = totals.pitching[player.simulationKey];
  return [
    { label: '팀 경기', value: String(totals.teams[career.world.protagonistSchoolId]?.games ?? 0) },
    ...(player.kind === 'HITTER' ? [
      { label: '출장', value: String(batting?.games ?? 0) }, { label: '타석', value: String(batting?.PA ?? 0) },
      { label: '안타', value: String(batting?.H ?? 0) }, { label: '홈런', value: String(batting?.HR ?? 0) },
      { label: '타율', value: batting?.AB ? (batting.H / batting.AB).toFixed(3) : '—' },
    ] : [
      { label: '출장', value: String(pitching?.games ?? 0) },
      { label: '이닝', value: `${Math.floor((pitching?.outs ?? 0) / 3)}.${(pitching?.outs ?? 0) % 3}` },
      { label: '탈삼진', value: String(pitching?.K ?? 0) },
    ]),
  ];
}

export function nativeCareerView(saveId: string, career: HighSchoolCareer): CareerView {
  const player = career.world.players[career.world.protagonistKey]!, phase = career.phaseContext;
  const event = currentEvent(career), plan = phase.phase === 'SEASON_PROGRESS' ? phase.advancePlan : null;
  const nextActions: CareerView['nextActions'] = [];
  if (event) nextActions.push({ id: 'open:S06', label: '사건 확인', kind: 'EVENT', primary: true });
  else if (phase.phase === 'PRESEASON_SETUP') nextActions.push({ id: 'confirm-preseason', label: '시즌 준비 확정', kind: 'PLAN', primary: true });
  else if (phase.phase === 'SEASON_PROGRESS') nextActions.push({ id: 'advance', label: plan ? '진행 계속' : '진행', kind: 'ADVANCE', primary: true });
  else nextActions.push({ id: 'unavailable', label: '다음 단계', kind: 'PLAN', disabledReason: unsupported });
  nextActions.push({ id: 'open:S16', label: '기록 보기', kind: 'RECORDS' });
  const mode = plan?.mode ?? 'NEXT_MAJOR_EVENT';
  return {
    saveId,
    protagonist: { name: player.name, kindLabel: player.kind === 'HITTER' ? '타자' : '투수', positionLabel: positionLabels[player.position] ?? player.position, ageLabel: `${player.age}세` },
    stage: { leagueLabel: '고교', teamName: career.world.schools.find(s => s.id === career.world.protagonistSchoolId)!.name, seasonLabel: `${career.world.seasonKey} 고교 3학년`, phaseLabel: phaseLabels[phase.phase] ?? '다음 단계 준비' },
    progress: { mode, alternatives: plan ? [] : (['NEXT_MAJOR_EVENT', 'ONE_GAME', 'ONE_WEEK'] as const).filter(m => m !== mode) },
    pendingEventTitle: event ? eventDefinition(event.definitionId).title : null,
    recentRecords: recordsOf(career), nextActions,
  };
}

function supportedChoice(definitionId: string, command: string): boolean {
  return ['E01', 'E02', 'E03'].includes(definitionId) && command === 'KEEP_FOCUS'
    || definitionId === 'E41' && command === 'ACK_EVENT'
    || definitionId === 'E43' && ['DEFER_TRAINING', 'FORFEIT_TRAINING'].includes(command);
}

export function nativeDecisionView(saveId: string, career: HighSchoolCareer, screenId: string): DecisionView {
  if (!isPlayScreenId(screenId)) return invalid();
  if (screenId === 'S16') return { saveId, screenId, summary: recordsOf(career), options: [{ id: 'back', label: '커리어로 돌아가기' }], notice: '이번 고교 정규시즌의 확정 기록입니다. 팀 경기와 내 출장은 다를 수 있습니다.' };
  if (screenId === 'S06') {
    const event = currentEvent(career);
    if (event) {
      const definition = eventDefinition(event.definitionId);
      return {
        saveId, screenId, summary: [{ label: '사건', value: definition.title }, { label: '내용', value: definition.body }], notice: null,
        options: definition.choices.filter(c => event.offeredChoices.includes(c.command)).map(c => ({ id: c.command, label: c.label, ...(supportedChoice(event.definitionId, c.command) ? {} : { disabledReason: '이 선택의 실제 입력 화면은 아직 연결되지 않았습니다.' }) })),
      };
    }
  }
  return { saveId, screenId, summary: [], notice: unsupported, options: [{ id: 'unavailable', label: '진행할 수 없음', disabledReason: unsupported }] };
}

export function seedNativeCareer(state: NativeCareerState, payload: unknown) {
  if (state.career) return invalid();
  const seeded = applyUiSeed(state, payload), p = seeded.nextState.ui!.protagonist;
  if (typeof state.nonce !== 'string' || typeof state.creationId !== 'string') return invalid();
  const secondaryPitch = (payload as { secondaryPitch?: unknown }).secondaryPitch;
  if (p.kind === 'PITCHER' && (typeof secondaryPitch !== 'string' || secondaryPitch === 'P01' || !PITCH_IDS.includes(secondaryPitch as PitchId))) throw new RangeError('SECONDARY_PITCH_REQUIRED');
  // shortcut: school/difficulty controls are not in S02 yet; use the approved normal starting year and first school until those controls are connected.
  const world = createHighSchoolWorld({
    worldKey: state.creationId, seasonKey: '2027', seasonYear: 2027, seed: state.nonce, schoolId: 'H01',
    player: { ...p, simulationKey: 'protagonist', difficulty: 'GROWTH' } as CreationInput,
    ...(p.kind === 'PITCHER' ? { secondaryPitch: secondaryPitch as PitchId } : {}),
  });
  const career = confirmCareerPlayer(createHighSchoolCareer(world, 'GROWTH'), 0);
  return { nextState: { ...seeded.nextState, career }, summary: { type: 'UI_SEED', ...saveSummary(career) }, eventIds: ['E01'], phase: career.phaseContext.phase };
}

export function advanceNativeCareer(state: NativeCareerState, payload: unknown) {
  const career = state.career!, body = payload as { mode?: ProgressMode; actionId?: string };
  if (!body || body.mode !== undefined && !['NEXT_MAJOR_EVENT', 'ONE_GAME', 'ONE_WEEK'].includes(body.mode)) return invalid();
  if (body.actionId !== undefined && body.actionId !== 'confirm-preseason') return invalid();
  if (body.actionId === 'confirm-preseason') {
    const next = confirmCareerPreseason(career, career.revision);
    return { nextState: { ...state, career: next }, summary: { type: 'UI_ADVANCE', phase: next.phaseContext.phase, ...saveSummary(next) }, eventIds: [], phase: next.phaseContext.phase };
  }
  const result = advanceHighSchoolCareer(career, career.revision, body.mode);
  return { nextState: { ...state, career: result.career }, summary: { type: 'UI_ADVANCE', stopReason: result.stopReason, ...saveSummary(result.career) }, eventIds: result.career.events.filter(e => !career.events.some(old => old.eventKey === e.eventKey)).map(e => e.definitionId), phase: result.career.phaseContext.phase };
}

export function chooseNativeCareer(state: NativeCareerState, payload: unknown) {
  const career = state.career!, body = payload as { screenId?: string; optionId?: string };
  if (!body || typeof body.screenId !== 'string' || typeof body.optionId !== 'string') return invalid();
  if (body.screenId === 'S16' && body.optionId === 'back') return { nextState: state, summary: { type: 'UI_CHOOSE', ...saveSummary(career) }, eventIds: [], phase: career.phaseContext.phase, next: { kind: 'career' } as ChooseNext };
  const event = currentEvent(career);
  if (body.screenId !== 'S06' || !event || !supportedChoice(event.definitionId, body.optionId) || !event.offeredChoices.includes(body.optionId)) return invalid();
  const input = { eventKey: event.eventKey, eventVersion: event.version, command: body.optionId };
  const next = ['E01', 'E02', 'E03'].includes(event.definitionId)
    ? resolveCareerFocusEvent(career, career.revision, { ...input, command: 'KEEP_FOCUS' })
    : resolveCareerWindowEvent(career, career.revision, input).career;
  return { nextState: { ...state, career: next }, summary: { type: 'UI_CHOOSE', screenId: body.screenId, optionId: body.optionId, ...saveSummary(next) }, eventIds: [], phase: next.phaseContext.phase, next: { kind: 'career' } as ChooseNext };
}

