/** UI shell state (fixture parity). Full career engine stays M2; M5 remainder screens are Decision stubs. */
import m5 from './m5-screens.json' with { type: 'json' };

export type UiPhase = 'season' | 'settle' | 'path' | 'draft' | 'contract' | 'retired';
export type M4PlayScreenId = 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S22' | 'S23' | 'S28';
export type M5ScreenId =
  | 'S10' | 'S11' | 'S12' | 'S13' | 'S14' | 'S15' | 'S16' | 'S17' | 'S18' | 'S19' | 'S20' | 'S21'
  | 'S24' | 'S25' | 'S26' | 'S27' | 'S29' | 'S30' | 'S31' | 'S32' | 'S33' | 'S34' | 'S35' | 'S36'
  | 'S37' | 'S38' | 'S39' | 'S40' | 'S41' | 'S42' | 'S43' | 'S44' | 'S45';
export type PlayScreenId = M4PlayScreenId | M5ScreenId;
export type ProgressMode = 'NEXT_MAJOR_EVENT' | 'ONE_GAME' | 'ONE_WEEK';

export type Protagonist = {
  name: string;
  kind: 'HITTER' | 'PITCHER';
  position: string;
  throws: string;
  bats: string;
  pitchForm: string | null;
  archetype: string;
  focus: string[];
};

export type UiShellState = {
  schemaVersion: number;
  stampCount?: number;
  ui?: {
    day: number;
    phase: UiPhase;
    pendingEvent: boolean;
    styleLeft: number;
    boostLeft: number;
    protagonist: Protagonist;
  };
  [key: string]: unknown;
};

export type NextAction = { id: string; label: string; kind: string; primary?: boolean; disabledReason?: string };
export type CareerView = {
  saveId: string;
  protagonist: { name: string; kindLabel: string; positionLabel: string; ageLabel: string };
  stage: { leagueLabel: string; teamName: string; seasonLabel: string; phaseLabel: string };
  progress: { mode: ProgressMode; alternatives: readonly ProgressMode[] };
  nextActions: NextAction[];
  pendingEventTitle: string | null;
  recentRecords: { label: string; value: string }[];
};
export type DecisionView = {
  screenId: PlayScreenId;
  saveId: string;
  summary: { label: string; value: string }[];
  options: { id: string; label: string; primary?: boolean; disabledReason?: string }[];
  notice: string | null;
};
export type ChooseNext =
  | { kind: 'career' }
  | { kind: 'home' }
  | { kind: 'screen'; screenId: PlayScreenId };

const POS: Record<string, string> = {
  C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수', SS: '유격수', LF: '좌익수', CF: '중견수', RF: '우익수', DH: '지명타자',
  SP: '선발', RP: '중간', CP: '마무리',
};
const M4_PLAY: readonly M4PlayScreenId[] = ['S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S22', 'S23', 'S28'];
const M5_IDS = m5.ids as readonly M5ScreenId[];
const M5_TITLES = m5.titles as Record<M5ScreenId, string>;
const PLAY = new Set<string>([...M4_PLAY, ...M5_IDS]);

type Catalog = { summary: DecisionView['summary']; options: DecisionView['options']; notice?: string };

const m4Catalogs: Record<M4PlayScreenId, Catalog> = {
  S04: { summary: [{ label: '타율', value: '.312' }, { label: '평가', value: '드래프트 후보' }], options: [{ id: 'to-path', label: '졸업 진로로', primary: true }] },
  S28: {
    summary: [{ label: '국내', value: '드래프트 참가' }, { label: '대학', value: '비교 가능' }],
    options: [
      { id: 'to-draft', label: '드래프트 참가', primary: true },
      { id: 'college', label: '대학 진학' },
      { id: 'us', label: '미국 제안 조회', disabledReason: '유효 미국 제안이 없습니다.' },
    ],
    notice: '조회만으로 진로가 고정되지 않습니다.',
  },
  S05: {
    summary: [{ label: '지명', value: 'KBO 3라운드 · 가상구단' }],
    options: [{ id: 'accept', label: '수락', primary: true }, { id: 'retry', label: '재도전' }, { id: 'end', label: '종료' }],
  },
  S06: {
    summary: [{ label: '사건', value: '선택이 필요한 사건' }],
    options: [{ id: 'opt-a', label: '집중 훈련', primary: true }, { id: 'opt-b', label: '휴식' }],
  },
  S07: {
    summary: [{ label: '시즌', value: '고교 3학년' }, { label: '능력 변화', value: '접촉 +2' }],
    options: [{ id: 'next', label: '다음', primary: true }, { id: 'detail', label: '상세' }],
  },
  S08: {
    summary: [{ label: '제안', value: '연봉 4,500만 · 1년 · 육성' }],
    options: [{ id: 'accept', label: '수락', primary: true }, { id: 'reject', label: '거절' }, { id: 'retire', label: '은퇴' }],
  },
  S09: {
    summary: [{ label: '사유', value: '커리어 종료' }, { label: '보관', value: '준비됨' }],
    options: [{ id: 'archive', label: '보관함', primary: true }, { id: 'new', label: '새 게임' }],
  },
  S22: {
    summary: [{ label: '현재 유형', value: '균형' }, { label: '남은 변경', value: '1회' }],
    options: [{ id: 'keep', label: '유지', primary: true }, { id: 'power', label: '파워형' }, { id: 'contact', label: '컨택형' }],
  },
  S23: {
    summary: [{ label: '남은 강화', value: '1회' }, { label: '상한', value: '능력 +3' }],
    options: [
      { id: 'basic', label: '기본', primary: true }, { id: 'challenge', label: '도전' },
      { id: 'rest', label: '휴식' }, { id: 'skip', label: '건너뛰기' },
    ],
  },
};

const stub = (id: M5ScreenId): Catalog => ({
  summary: [{ label: '화면', value: M5_TITLES[id] }],
  options: [{ id: 'back', label: '돌아가기', primary: true }],
  notice: 'M5 셸 — 엔진·구단 연동 전 스텁',
});

function catalogFor(id: PlayScreenId): Catalog {
  if ((M4_PLAY as readonly string[]).includes(id)) return m4Catalogs[id as M4PlayScreenId];
  return stub(id as M5ScreenId);
}

function requireUi(state: UiShellState) {
  if (!state.ui) throw Object.assign(new Error('UI_NOT_SEEDED'), { code: 'INVALID_REQUEST' });
  return state.ui;
}

export function careerView(saveId: string, state: UiShellState): CareerView {
  const ui = requireUi(state);
  const p = ui.protagonist;
  const week = Math.floor(ui.day / 7) + 1;
  const nextActions: NextAction[] = [];
  if (ui.phase === 'retired') nextActions.push({ id: 'open:S09', label: '은퇴 결과', kind: 'OPEN_SCREEN', primary: true });
  else if (ui.pendingEvent) nextActions.push({ id: 'open:S06', label: '사건 확인', kind: 'EVENT', primary: true });
  else if (ui.phase === 'settle') nextActions.push({ id: 'open:S04', label: '고교 결산', kind: 'OPEN_SCREEN', primary: true });
  else if (ui.phase === 'path') nextActions.push({ id: 'open:S28', label: '졸업 진로', kind: 'OPEN_SCREEN', primary: true });
  else if (ui.phase === 'draft') nextActions.push({ id: 'open:S05', label: '드래프트', kind: 'OPEN_SCREEN', primary: true });
  else if (ui.phase === 'contract') {
    nextActions.push({ id: 'open:S08', label: '계약 제안', kind: 'OPEN_SCREEN', primary: true });
    nextActions.push({ id: 'open:S07', label: '시즌 결산', kind: 'OPEN_SCREEN' });
  } else {
    nextActions.push({ id: 'advance', label: '진행', kind: 'ADVANCE', primary: true });
    if (ui.styleLeft > 0) nextActions.push({ id: 'open:S22', label: '유형 변경', kind: 'PLAN' });
    if (ui.boostLeft > 0) nextActions.push({ id: 'open:S23', label: '강화', kind: 'PLAN' });
    nextActions.push({ id: 'open:S10', label: '보관함', kind: 'OPEN_SCREEN' });
    nextActions.push({ id: 'open:S20', label: '저장', kind: 'OPEN_SCREEN' });
    nextActions.push({ id: 'open:S21', label: '설정', kind: 'OPEN_SCREEN' });
    nextActions.push({ id: 'records', label: '기록 보기', kind: 'RECORDS' });
  }
  return {
    saveId,
    protagonist: {
      name: p.name,
      kindLabel: p.kind === 'HITTER' ? '타자' : '투수',
      positionLabel: POS[p.position] ?? p.position,
      ageLabel: '18세',
    },
    stage: {
      leagueLabel: '고교', teamName: '가상고등학교', seasonLabel: '고교 3학년',
      phaseLabel: ui.phase === 'season' ? `${week}주차` : ui.phase,
    },
    progress: { mode: 'NEXT_MAJOR_EVENT', alternatives: ['ONE_GAME', 'ONE_WEEK'] },
    pendingEventTitle: ui.pendingEvent ? '선택이 필요한 사건' : null,
    recentRecords: ui.day === 0 ? [] : [{ label: '진행한 날', value: `${ui.day}일` }],
    nextActions,
  };
}

export function decisionView(saveId: string, state: UiShellState, screenId: string): DecisionView {
  if (!PLAY.has(screenId)) throw Object.assign(new Error('UNKNOWN_SCREEN'), { code: 'INVALID_REQUEST' });
  const ui = requireUi(state);
  const id = screenId as PlayScreenId;
  const base = catalogFor(id);
  let options = base.options;
  if (id === 'S22' && ui.styleLeft <= 0) options = [];
  if (id === 'S23' && ui.boostLeft <= 0) options = [];
  return { screenId: id, saveId, summary: base.summary, options, notice: base.notice ?? null };
}

export function applyUiSeed(state: UiShellState, payload: unknown): { nextState: UiShellState; summary: Record<string, unknown> } {
  const p = payload as Partial<Protagonist>;
  if (!p || typeof p.name !== 'string' || (p.kind !== 'HITTER' && p.kind !== 'PITCHER') || typeof p.position !== 'string') {
    throw Object.assign(new Error('INVALID_PAYLOAD'), { code: 'INVALID_REQUEST' });
  }
  const protagonist: Protagonist = {
    name: p.name,
    kind: p.kind,
    position: p.position,
    throws: typeof p.throws === 'string' ? p.throws : 'R',
    bats: typeof p.bats === 'string' ? p.bats : 'R',
    pitchForm: typeof p.pitchForm === 'string' ? p.pitchForm : null,
    archetype: typeof p.archetype === 'string' ? p.archetype : 'BALANCED',
    focus: Array.isArray(p.focus) ? p.focus.filter((x): x is string => typeof x === 'string') : [],
  };
  return {
    nextState: {
      ...state,
      schemaVersion: state.schemaVersion ?? 1,
      ui: { day: 0, phase: 'season', pendingEvent: false, styleLeft: 1, boostLeft: 1, protagonist },
    },
    summary: { type: 'UI_SEED', name: protagonist.name },
  };
}

export function applyUiAdvance(
  state: UiShellState,
  payload: unknown,
): { nextState: UiShellState; summary: Record<string, unknown> } {
  const ui = { ...requireUi(state) };
  const mode = (payload as { mode?: string })?.mode;
  ui.day += mode === 'ONE_GAME' ? 1 : mode === 'ONE_WEEK' ? 7 : 3;
  if (ui.day >= 21) { ui.phase = 'settle'; ui.pendingEvent = false; }
  else if (ui.day > 0 && ui.day % 3 === 0) ui.pendingEvent = true;
  return {
    nextState: { ...state, ui },
    summary: { type: 'UI_ADVANCE', day: ui.day, phase: ui.phase },
  };
}

export function applyUiChoose(
  state: UiShellState,
  payload: unknown,
): { nextState: UiShellState; summary: Record<string, unknown>; next: ChooseNext } {
  const body = payload as { screenId?: string; optionId?: string };
  if (!body?.screenId || !body?.optionId || !PLAY.has(body.screenId)) {
    throw Object.assign(new Error('INVALID_PAYLOAD'), { code: 'INVALID_REQUEST' });
  }
  const screenId = body.screenId as PlayScreenId;
  const optionId = body.optionId;
  const ui = { ...requireUi(state) };
  let next: ChooseNext = { kind: 'career' };
  if (screenId === 'S06') { ui.pendingEvent = false; ui.day += 1; }
  else if (screenId === 'S04' && optionId === 'to-path') { ui.phase = 'path'; next = { kind: 'screen', screenId: 'S28' }; }
  else if (screenId === 'S28' && optionId === 'to-draft') { ui.phase = 'draft'; next = { kind: 'screen', screenId: 'S05' }; }
  else if (screenId === 'S28' && optionId === 'college') { next = { kind: 'screen', screenId: 'S34' }; }
  else if (screenId === 'S28') { ui.phase = 'season'; }
  else if (screenId === 'S05' && optionId === 'accept') { ui.phase = 'contract'; }
  else if (screenId === 'S05' && optionId === 'end') { ui.phase = 'retired'; next = { kind: 'screen', screenId: 'S09' }; }
  else if (screenId === 'S08' && optionId === 'retire') { ui.phase = 'retired'; next = { kind: 'screen', screenId: 'S09' }; }
  else if (screenId === 'S08' && optionId === 'accept') { ui.phase = 'season'; ui.pendingEvent = false; }
  else if (screenId === 'S09' && optionId === 'archive') { next = { kind: 'screen', screenId: 'S10' }; }
  else if (screenId === 'S09' && optionId === 'new') next = { kind: 'home' };
  else if (screenId === 'S22') ui.styleLeft = Math.max(0, ui.styleLeft - 1);
  else if (screenId === 'S23') ui.boostLeft = Math.max(0, ui.boostLeft - 1);
  else if ((M5_IDS as readonly string[]).includes(screenId) && optionId === 'back') next = { kind: 'career' };
  return {
    nextState: { ...state, ui },
    summary: { type: 'UI_CHOOSE', screenId, optionId, phase: ui.phase },
    next,
  };
}

export function phaseOf(state: UiShellState): string {
  return state.ui?.phase ?? 'BOOT';
}
