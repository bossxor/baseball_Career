import type { PlayballApi } from './api.js';
import type { CareerView, CreationReceipt, CreationRequest, HomeData, ProgressMode, SaveSummary } from './model.js';
import { POSITION_LABELS } from './creation.js';

interface FixtureSave { summary: SaveSummary; request: CreationRequest; day: number }
/** In-memory stand-in for the server (not persisted, no accounts). It keeps the contract that matters to the UI:
 * a creation or action retried with the same commandId returns the same result and never creates or advances twice. */
export function createFixtureApi(): PlayballApi {
  const saves = new Map<string, FixtureSave>(), created = new Map<string, string>(), acted = new Map<string, number>();
  const view = (s: FixtureSave): CareerView => {
    const p = s.request, week = Math.floor(s.day / 7) + 1, pending = s.day > 0 && s.day % 3 === 0;
    return {
      saveId: s.summary.saveId,
      protagonist: { name: p.name, kindLabel: p.kind === 'HITTER' ? '타자' : '투수', positionLabel: POSITION_LABELS[p.position] ?? p.position, ageLabel: '18세' },
      stage: { leagueLabel: '고교', teamName: '가상고등학교', seasonLabel: '고교 3학년', phaseLabel: `${week}주차` },
      progress: { mode: 'NEXT_MAJOR_EVENT', alternatives: ['ONE_GAME', 'ONE_WEEK'] },
      pendingEventTitle: pending ? '선택이 필요한 사건' : null,
      recentRecords: s.day === 0 ? [] : [{ label: '진행한 날', value: `${s.day}일` }],
      nextActions: pending ? [{ id: 'resolve-event', label: '사건 확인', kind: 'EVENT', primary: true }]
        : [{ id: 'advance', label: '진행', kind: 'ADVANCE', primary: true }, { id: 'records', label: '기록 보기', kind: 'RECORDS' }],
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
      saves.set(saveId, { summary: { saveId, mode: 'CAREER', title: request.name, seasonLabel: '고교 3학년', phaseLabel: '시작', savedAtLabel: '방금', revision: 1 }, request, day: 0 });
      created.set(request.commandId, saveId);
      return { saveId };
    },
    async act(saveId: string, actionId: string, mode: ProgressMode, commandId: string): Promise<CareerView> {
      const s = saves.get(saveId);
      if (!s) throw new Error('NOT_FOUND');
      if (!acted.has(commandId)) {
        acted.set(commandId, s.day);
        if (actionId === 'advance') s.day += mode === 'ONE_GAME' ? 1 : mode === 'ONE_WEEK' ? 7 : 3 - (s.day % 3);
        if (actionId === 'resolve-event') s.day += 1;
        s.summary = { ...s.summary, phaseLabel: `${Math.floor(s.day / 7) + 1}주차`, revision: s.summary.revision + 1 };
      }
      return view(s);
    },
  };
}
