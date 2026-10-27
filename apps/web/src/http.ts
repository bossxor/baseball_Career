import type { PlayballApi } from './api.js';
import { ApiError } from './errors.js';
import type {
  CareerView, ChooseReceipt, ClubCreateRequest, ClubScreen, ClubScreenId, CreationReceipt, CreationRequest, DecisionView, HomeData, PlayScreenId, ProgressMode, SaveSummary,
} from './model.js';

export type HttpApiOptions = {
  baseUrl: string;
  getToken: () => string | Promise<string>;
  /** Called once per 401 so the shell can drop the expired token and show the login screen. */
  onUnauthorized?: () => void;
};

type SaveListItem = {
  id: string; mode: 'CAREER' | 'CLUB'; revision: string; phase: string;
  summary: Record<string, unknown>; updatedAt: string;
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return '방금';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}분 전`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}시간 전`;
  return `${Math.floor(ms / 86_400_000)}일 전`;
}

function toSummary(row: SaveListItem): SaveSummary {
  const title = typeof row.summary.clubId === 'string' ? String(row.summary.clubId)
    : typeof row.summary.name === 'string' ? row.summary.name
    : typeof row.summary.creationId === 'string' ? String(row.summary.creationId)
    : row.id;
  const seasonLabel = typeof row.summary.seasonKey === 'string' ? row.summary.seasonKey : row.mode === 'CLUB' ? '구단' : '고교 3학년';
  return {
    saveId: row.id, mode: row.mode, title, seasonLabel, phaseLabel: row.phase,
    savedAtLabel: relativeTime(row.updatedAt), revision: Number(row.revision),
  };
}

/** M3 HTTP boundary. Default stays fixture; pass `VITE_API_BASE` + token to use this. */
export function createHttpApi(opts: HttpApiOptions): PlayballApi {
  const base = opts.baseUrl.replace(/\/$/, '');
  const revisions = new Map<string, number>();
  // 28: the receipt hash includes expectedRevision, so a retry after a lost response must resend the first value.
  const sentRevision = new Map<string, number>();

  const headers = async (json = true): Promise<HeadersInit> => {
    const h: Record<string, string> = { Authorization: `Bearer ${await opts.getToken()}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  };

  const req = async (path: string, init: RequestInit = {}) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('OFFLINE');
    const res = await fetch(`${base}${path}`, init).catch(() => { throw new ApiError('OFFLINE'); });
    if (res.status === 401) { opts.onUnauthorized?.(); throw new ApiError('AUTH_REQUIRED'); }
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { code?: string; currentRevision?: string };
      if (body.code === 'REVISION_CONFLICT') {
        const rev = body.currentRevision !== undefined ? Number(body.currentRevision) : undefined;
        throw new ApiError('REVISION_CONFLICT', Number.isFinite(rev) ? rev : undefined);
      }
      throw new ApiError(body.code ?? `HTTP_${res.status}`);
    }
    return res.json();
  };

  const command = async (saveId: string, commandId: string, type: string, payload: unknown) => {
    const expectedRevision = sentRevision.get(commandId) ?? revisions.get(saveId) ?? 0;
    sentRevision.set(commandId, expectedRevision);
    try {
      const result = await req(`/api/saves/${encodeURIComponent(saveId)}/commands`, {
        method: 'POST',
        headers: await headers(),
        body: JSON.stringify({ commandId, expectedRevision, type, payload }),
      }) as { revision: string; next?: ChooseReceipt['next'] };
      revisions.set(saveId, Number(result.revision));
      sentRevision.delete(commandId);
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REVISION_CONFLICT') {
        // Not applied: the next attempt may use the fresh revision.
        sentRevision.delete(commandId);
        if (err.currentRevision !== undefined) revisions.set(saveId, err.currentRevision);
      }
      throw err;
    }
  };

  return {
    async home(): Promise<HomeData> {
      const data = await req('/api/saves', { headers: await headers(false) }) as { items: SaveListItem[] };
      const saves = data.items.map(toSummary);
      for (const s of saves) revisions.set(s.saveId, s.revision);
      return {
        saves, archiveCount: 0,
        resume: saves[0] ? { saveId: saves[0].saveId, label: saves[0].phaseLabel } : null,
      };
    },
    async career(saveId: string): Promise<CareerView> {
      const data = await req(`/api/saves/${encodeURIComponent(saveId)}/career`, { headers: await headers(false) }) as CareerView & { revision?: string };
      if (data.revision) revisions.set(saveId, Number(data.revision));
      return data;
    },
    async create(request: CreationRequest): Promise<CreationReceipt> {
      const created = await req('/api/game-creations', {
        method: 'POST', headers: await headers(),
        body: JSON.stringify({ creationId: request.commandId, mode: 'CAREER' }),
      }) as { saveId: string; revision: string };
      revisions.set(created.saveId, Number(created.revision));
      await command(created.saveId, `${request.commandId}:seed`, 'UI_SEED', {
        name: request.name, kind: request.kind, position: request.position,
        throws: request.throws, bats: request.bats, pitchForm: request.pitchForm,
        archetype: request.archetype, focus: [...request.focus],
      });
      return { saveId: created.saveId };
    },
    async act(saveId: string, actionId: string, mode: ProgressMode, commandId: string): Promise<CareerView> {
      if (actionId === 'advance') await command(saveId, commandId, 'UI_ADVANCE', { mode });
      const data = await req(`/api/saves/${encodeURIComponent(saveId)}/career`, { headers: await headers(false) }) as CareerView & { revision?: string };
      if (data.revision) revisions.set(saveId, Number(data.revision));
      return data;
    },
    async decision(saveId: string, screenId: PlayScreenId): Promise<DecisionView> {
      return req(`/api/saves/${encodeURIComponent(saveId)}/screens/${screenId}`, { headers: await headers(false) }) as Promise<DecisionView>;
    },
    async choose(saveId: string, screenId: PlayScreenId, optionId: string, commandId: string): Promise<ChooseReceipt> {
      const result = await command(saveId, commandId, 'UI_CHOOSE', { screenId, optionId });
      return { next: result.next ?? { kind: 'career' } };
    },
    async createClub(request: ClubCreateRequest): Promise<CreationReceipt> {
      const created = await req('/api/game-creations', {
        method: 'POST', headers: await headers(),
        body: JSON.stringify({ creationId: request.commandId, mode: 'CLUB' }),
      }) as { saveId: string; revision: string };
      revisions.set(created.saveId, Number(created.revision));
      await command(created.saveId, `${request.commandId}:club`, 'CLUB_CREATE', {
        worldKey: 'kbo-club', seed: request.commandId, difficulty: 'REALISTIC', clubId: request.clubId,
      });
      return { saveId: created.saveId };
    },
    async club(saveId: string, screenId: ClubScreenId, query: { playerKey?: string; gameKey?: string } = {}): Promise<ClubScreen> {
      const params = new URLSearchParams();
      if (query.playerKey) params.set('playerKey', query.playerKey);
      if (query.gameKey) params.set('gameKey', query.gameKey);
      const suffix = params.size ? `?${params}` : '';
      return req(`/api/saves/${encodeURIComponent(saveId)}/screens/${screenId}${suffix}`, { headers: await headers(false) }) as Promise<ClubScreen>;
    },
    async clubCommand(saveId: string, commandId: string, type: string, payload: Record<string, unknown>): Promise<ClubScreen> {
      await command(saveId, commandId, type, payload);
      return this.club(saveId, 'S13');
    },
  };
}
