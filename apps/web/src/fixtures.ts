import type { PlayballApi } from './api.js';
import type {
  CareerView, ChooseReceipt, CreationReceipt, CreationRequest, DecisionView, HomeData, NextAction, PlayScreenId, ProgressMode, SaveSummary,
} from './model.js';
import { POSITION_LABELS } from './creation.js';

type Phase = 'season' | 'settle' | 'path' | 'draft' | 'contract' | 'retired';
interface FixtureSave {
  summary: SaveSummary; request: CreationRequest; day: number; phase: Phase;
  pendingEvent: boolean; styleLeft: number; boostLeft: number; lastChoice?: string;
}
const PLAY: readonly PlayScreenId[] = ['S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S22', 'S23', 'S28'];

const catalogs: Record<PlayScreenId, { summary: DecisionView['summary']; options: DecisionView['options']; notice?: string }> = {
  S04: {
    summary: [{ label: '타율', value: '.312' }, { label: '평가', value: '드래프트 후보' }],
    options: [{ id: 'to-path', label: '졸업 진로로', primary: true }],
  },
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
    options: [
      { id: 'accept', label: '수락', primary: true },
      { id: 'retry', label: '재도전' },
      { id: 'end', label: '종료' },
    ],
  },
  S06: {
    summary: [{ label: '사건', value: '선택이 필요한 사건' }],
    options: [
      { id: 'opt-a', label: '집중 훈련', primary: true },
      { id: 'opt-b', label: '휴식' },
    ],
  },
  S07: {
    summary: [{ label: '시즌', value: '고교 3학년' }, { label: '능력 변화', value: '접촉 +2' }],
    options: [{ id: 'next', label: '다음', primary: true }, { id: 'detail', label: '상세' }],
  },
  S08: {
    summary: [{ label: '제안', value: '연봉 4,500만 · 1년 · 육성' }],
    options: [
      { id: 'accept', label: '수락', primary: true },
      { id: 'reject', label: '거절' },
      { id: 'retire', label: '은퇴' },
    ],
  },
  S09: {
    summary: [{ label: '사유', value: '커리어 종료' }, { label: '보관', value: '준비됨' }],
    options: [{ id: 'archive', label: '보관함', primary: true }, { id: 'new', label: '새 게임' }],
  },
  S22: {
    summary: [{ label: '현재 유형', value: '균형' }, { label: '남은 변경', value: '1회' }],
    options: [
      { id: 'keep', label: '유지', primary: true },
      { id: 'power', label: '파워형' },
      { id: 'contact', label: '컨택형' },
    ],
  },
  S23: {
    summary: [{ label: '남은 강화', value: '1회' }, { label: '상한', value: '능력 +3' }],
    options: [
      { id: 'basic', label: '기본', primary: true },
      { id: 'challenge', label: '도전' },
      { id: 'rest', label: '휴식' },
      { id: 'skip', label: '건너뛰기' },
    ],
  },
};

/** In-memory stand-in for the server (not persisted, no accounts). Same commandId → same result. */
export function createFixtureApi(): PlayballApi {
  const saves = new Map<string, FixtureSave>(), created = new Map<string, string>();
  const acted = new Map<string, CareerView>(), chosen = new Map<string, ChooseReceipt>();

  const view = (s: FixtureSave): CareerView => {
    const p = s.request, week = Math.floor(s.day / 7) + 1;
    const nextActions: NextAction[] = [];
    if (s.phase === 'retired') {
      nextActions.push({ id: 'open:S09', label: '은퇴 결과', kind: 'OPEN_SCREEN', primary: true });
    } else if (s.pendingEvent) {
      nextActions.push({ id: 'open:S06', label: '사건 확인', kind: 'EVENT', primary: true });
    } else if (s.phase === 'settle') {
      nextActions.push({ id: 'open:S04', label: '고교 결산', kind: 'OPEN_SCREEN', primary: true });
    } else if (s.phase === 'path') {
      nextActions.push({ id: 'open:S28', label: '졸업 진로', kind: 'OPEN_SCREEN', primary: true });
    } else if (s.phase === 'draft') {
      nextActions.push({ id: 'open:S05', label: '드래프트', kind: 'OPEN_SCREEN', primary: true });
    } else if (s.phase === 'contract') {
      nextActions.push({ id: 'open:S08', label: '계약 제안', kind: 'OPEN_SCREEN', primary: true });
      nextActions.push({ id: 'open:S07', label: '시즌 결산', kind: 'OPEN_SCREEN' });
    } else {
      nextActions.push({ id: 'advance', label: '진행', kind: 'ADVANCE', primary: true });
      if (s.styleLeft > 0) nextActions.push({ id: 'open:S22', label: '유형 변경', kind: 'PLAN' });
      if (s.boostLeft > 0) nextActions.push({ id: 'open:S23', label: '강화', kind: 'PLAN' });
      nextActions.push({ id: 'records', label: '기록 보기', kind: 'RECORDS' });
    }
    return {
      saveId: s.summary.saveId,
      protagonist: { name: p.name, kindLabel: p.kind === 'HITTER' ? '타자' : '투수', positionLabel: POSITION_LABELS[p.position] ?? p.position, ageLabel: '18세' },
      stage: { leagueLabel: '고교', teamName: '가상고등학교', seasonLabel: '고교 3학년', phaseLabel: s.phase === 'season' ? `${week}주차` : s.phase },
      progress: { mode: 'NEXT_MAJOR_EVENT', alternatives: ['ONE_GAME', 'ONE_WEEK'] },
      pendingEventTitle: s.pendingEvent ? '선택이 필요한 사건' : null,
      recentRecords: s.day === 0 ? [] : [{ label: '진행한 날', value: `${s.day}일` }],
      nextActions,
    };
  };

  return {
    async home(): Promise<HomeData> {
      const list = [...saves.values()].map(s => s.summary);
      return { saves: list, archiveCount: 0, resume: list.length ? { saveId: list[0]!.saveId, label: list[0]!.phaseLabel } : null };
    },
    async career(saveId: string): Promise<CareerView> {
      const s = saves.get(saveId);
      if (!s) throw new Error('NOT_FOUND');
      return view(s);
    },
    async create(request: CreationRequest): Promise<CreationReceipt> {
      const prior = created.get(request.commandId);
      if (prior) return { saveId: prior };
      const saveId = `fixture-${saves.size + 1}`;
      saves.set(saveId, {
        summary: { saveId, mode: 'CAREER', title: request.name, seasonLabel: '고교 3학년', phaseLabel: '시작', savedAtLabel: '방금', revision: 1 },
        request, day: 0, phase: 'season', pendingEvent: false, styleLeft: 1, boostLeft: 1,
      });
      created.set(request.commandId, saveId);
      return { saveId };
    },
    async act(saveId: string, actionId: string, mode: ProgressMode, commandId: string): Promise<CareerView> {
      const s = saves.get(saveId);
      if (!s) throw new Error('NOT_FOUND');
      const prior = acted.get(commandId);
      if (prior) return prior;
      if (actionId === 'advance') {
        s.day += mode === 'ONE_GAME' ? 1 : mode === 'ONE_WEEK' ? 7 : 3;
        if (s.day >= 21) { s.phase = 'settle'; s.pendingEvent = false; }
        else if (s.day > 0 && s.day % 3 === 0) s.pendingEvent = true;
        s.summary = { ...s.summary, phaseLabel: `${Math.floor(s.day / 7) + 1}주차`, revision: s.summary.revision + 1 };
      }
      const out = view(s);
      acted.set(commandId, out);
      return out;
    },
    async decision(saveId: string, screenId: PlayScreenId): Promise<DecisionView> {
      const s = saves.get(saveId);
      if (!s) throw new Error('NOT_FOUND');
      if (!PLAY.includes(screenId)) throw new Error('NOT_FOUND');
      const base = catalogs[screenId];
      let options = base.options;
      if (screenId === 'S22' && s.styleLeft <= 0) options = [];
      if (screenId === 'S23' && s.boostLeft <= 0) options = [];
      return { screenId, saveId, summary: base.summary, options, notice: base.notice ?? null };
    },
    async choose(saveId: string, screenId: PlayScreenId, optionId: string, commandId: string): Promise<ChooseReceipt> {
      const s = saves.get(saveId);
      if (!s) throw new Error('NOT_FOUND');
      const prior = chosen.get(commandId);
      if (prior) return prior;
      s.lastChoice = `${screenId}:${optionId}`;
      s.summary = { ...s.summary, revision: s.summary.revision + 1 };
      let next: ChooseReceipt['next'] = { kind: 'career' };
      if (screenId === 'S06') { s.pendingEvent = false; s.day += 1; }
      else if (screenId === 'S04' && optionId === 'to-path') { s.phase = 'path'; next = { kind: 'screen', screenId: 'S28' }; }
      else if (screenId === 'S28' && optionId === 'to-draft') { s.phase = 'draft'; next = { kind: 'screen', screenId: 'S05' }; }
      else if (screenId === 'S28') { s.phase = 'season'; }
      else if (screenId === 'S05' && optionId === 'accept') { s.phase = 'contract'; }
      else if (screenId === 'S05' && optionId === 'end') { s.phase = 'retired'; next = { kind: 'screen', screenId: 'S09' }; }
      else if (screenId === 'S08' && optionId === 'retire') { s.phase = 'retired'; next = { kind: 'screen', screenId: 'S09' }; }
      else if (screenId === 'S08' && optionId === 'accept') { s.phase = 'season'; s.pendingEvent = false; }
      else if (screenId === 'S09' && optionId === 'new') next = { kind: 'home' };
      else if (screenId === 'S22') { s.styleLeft = Math.max(0, s.styleLeft - 1); }
      else if (screenId === 'S23') { s.boostLeft = Math.max(0, s.boostLeft - 1); }
      else if (screenId === 'S07') { /* stay */ }
      const receipt = { next };
      chosen.set(commandId, receipt);
      return receipt;
    },
  };
}
