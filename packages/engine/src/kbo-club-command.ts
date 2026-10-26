import { UNITS_PER_POINT, abilityKeys, overall } from '@playball/rules';
import type { Difficulty } from '@playball/rules';
import type { KboClubGame, ClubLineupDraft } from './kbo-club-game.js';
import {
  applyKboClubLineup, autoClubLineup, clearKboClubLineup, createKboClubGame, kboClubHome, kboClubRoster,
} from './kbo-club-game.js';
import { advanceKboClubGame, startKboClubSeason } from './kbo-club-progress.js';
import { kboClubFreeAgents, setKboClubFirstTeam } from './kbo-club-manage.js';

/** S13–S19 read models and the five save commands that change a club game. The save pipeline checks its own revision;
 * these calls use the game revision already stored on the game. */
export const CLUB_SCREEN_IDS = ['S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19'] as const;
export type ClubScreenId = (typeof CLUB_SCREEN_IDS)[number];
export interface ClubScreenLine { label: string; value: string }
export interface ClubScreenCommand { id: string; label: string; type: string; payload: Record<string, unknown> }
export interface ClubScreenView {
  screenId: ClubScreenId;
  title: string;
  lines: ClubScreenLine[];
  links: { screenId: ClubScreenId; label: string }[];
  commands: ClubScreenCommand[];
}

const TITLES: Record<ClubScreenId, string> = {
  S13: '구단 홈', S14: '선수단', S15: '라인업', S16: '선수', S17: '시장', S18: '리그', S19: '경기',
};
const NAV: ClubScreenView['links'] = [
  { screenId: 'S13', label: '홈' }, { screenId: 'S14', label: '선수단' }, { screenId: 'S15', label: '라인업' },
  { screenId: 'S17', label: '시장' }, { screenId: 'S18', label: '리그' }, { screenId: 'S19', label: '경기' },
];
const isScreen = (id: string): id is ClubScreenId => (CLUB_SCREEN_IDS as readonly string[]).includes(id);
function fail(code: string): never { throw new RangeError(code); }
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export function kboClubScreen(game: KboClubGame, screenId: string, query: { playerKey?: string; gameKey?: string } = {}): ClubScreenView {
  if (!isScreen(screenId)) fail('UNKNOWN_CLUB_SCREEN');
  const home = kboClubHome(game);
  const links = NAV.filter(link => link.screenId !== screenId);
  const commands: ClubScreenCommand[] = [];
  if (screenId === 'S13' && game.phase === 'PRESEASON_SETUP') commands.push({ id: 'start', label: '시즌 시작', type: 'CLUB_START', payload: {} });
  if (screenId === 'S13' && game.phase === 'SEASON_PROGRESS') commands.push({ id: 'day', label: '1일 진행', type: 'CLUB_ADVANCE', payload: { maxDays: 1 } });
  if (screenId === 'S15') {
    commands.push({ id: 'auto', label: '자동 편성', type: 'CLUB_LINEUP', payload: { auto: true } });
    if (game.lineup) commands.push({ id: 'clear', label: '라인업 해제', type: 'CLUB_LINEUP', payload: { clear: true } });
  }
  return { screenId, title: TITLES[screenId], lines: linesFor(game, home, screenId, query), links, commands };
}

function linesFor(game: KboClubGame, home: ReturnType<typeof kboClubHome>, screenId: ClubScreenId, query: { playerKey?: string; gameKey?: string }): ClubScreenLine[] {
  if (screenId === 'S13') {
    const mine = home.standings.find(s => s.mine);
    return [
      { label: '구단', value: home.club.name },
      { label: '시즌', value: `${home.seasonKey} · ${home.phase}` },
      { label: '순위', value: mine ? `${mine.rank}위 ${mine.W}승 ${mine.L}패` : '순위 없음' },
      { label: '가용 예산', value: won(home.budget.availableWon) },
      { label: '다음 경기', value: home.nextGame ? `${home.nextGame.opponentName} · ${home.nextGame.worldDay}일` : '남은 경기 없음' },
      ...home.todos.map(todo => ({ label: '할 일', value: todo.code })),
    ];
  }
  if (screenId === 'S14') return kboClubRoster(game).map(p => ({ label: p.tier === 'FIRST' ? '1군' : '2군', value: `${p.name} · ${p.position} · ${p.overall}${p.injured ? ' · 부상' : ''}` }));
  if (screenId === 'S15') {
    const draft = game.lineup?.draft ?? autoClubLineup(game);
    return [
      { label: game.lineup ? '저장된 선발' : '자동 선발', value: nameOf(game, draft.startingPitcher) },
      { label: '타순', value: draft.battingOrder.map(key => nameOf(game, key)).join(', ') },
    ];
  }
  if (screenId === 'S16') return playerLines(game, query.playerKey);
  if (screenId === 'S17') return kboClubFreeAgents(game).map(p => ({ label: p.origin, value: `${p.name} · ${p.position} · ${won(p.desiredAnnualSalaryWon)} · ${p.desiredYears}년` }));
  if (screenId === 'S18') return home.standings.map(s => ({ label: `${s.rank}위`, value: `${s.name} ${s.W}승 ${s.L}패${s.mine ? ' · 내 구단' : ''}` }));
  return gameLines(game, query.gameKey);
}

function nameOf(game: KboClubGame, key: string): string {
  return game.world.players[key]?.name ?? key;
}

function playerLines(game: KboClubGame, playerKey: string | undefined): ClubScreenLine[] {
  if (!playerKey) return [{ label: '선수', value: '선수단에서 한 명을 고르세요.' }];
  const club = game.world.clubs.find(c => c.id === game.userClubId)!;
  if (!club.roster.includes(playerKey)) fail('CLUB_PLAYER_NOT_FOUND');
  const player = game.world.players[playerKey]!, contract = game.world.contracts[playerKey]!;
  return [
    { label: '이름', value: `${player.name} · ${player.position} · ${player.age}세` },
    { label: '종합', value: overall(player.kind, player.abilities).display },
    ...abilityKeys(player.kind).map(key => ({ label: key, value: (player.abilities[key]! / UNITS_PER_POINT).toFixed(1) })),
    { label: '계약', value: `${contract.years}년 · ${won(contract.annualSalaryWon)} · ${contract.seasonKey}` },
  ];
}

function gameLines(game: KboClubGame, gameKey: string | undefined): ClubScreenLine[] {
  const pending = game.progress?.pendingGame;
  const lines: ClubScreenLine[] = [];
  if (pending && (pending.job.game.input.teams.some(team => team.simulationKey === game.userClubId))) {
    lines.push({ label: '진행중', value: pending.job.game.input.simulationKey });
  }
  const finals = Object.values(game.records.games)
    .filter(row => row.scope.leagueKey === 'KBO' && row.teams[game.userClubId] && (!gameKey || row.gameKey === gameKey))
    .sort((a, b) => b.worldDay - a.worldDay || (a.gameKey < b.gameKey ? -1 : 1))
    .slice(0, 8);
  if (!lines.length && !finals.length) return [{ label: '경기', value: '아직 경기가 없습니다.' }];
  for (const row of finals) {
    const sides = Object.entries(row.teams).map(([id, line]) => `${game.world.clubs.find(c => c.id === id)?.name ?? id} ${line.R}`);
    lines.push({ label: `${row.worldDay}일`, value: sides.join(' : ') });
  }
  return lines;
}

const DIFFICULTY = new Set<Difficulty>(['GROWTH', 'REALISTIC', 'SECRET_CHEAT']);

/** CREATE makes the game. START, LINEUP, FIRST_TEAM and ADVANCE call the existing club functions. */
export function applyKboClubCommand(game: KboClubGame | null, command: { type: string; payload: unknown }): KboClubGame {
  if (command.type === 'CLUB_CREATE') {
    if (game) fail('CLUB_ALREADY_CREATED');
    const body = command.payload as { worldKey?: unknown; seed?: unknown; difficulty?: unknown; clubId?: unknown } | null;
    const seed = body?.seed, difficulty = body?.difficulty, clubId = body?.clubId;
    const worldKey = typeof body?.worldKey === 'string' && body.worldKey ? body.worldKey : 'kbo-club';
    if (typeof seed !== 'string' || seed.length < 1 || seed.length > 64 || typeof clubId !== 'string' || !DIFFICULTY.has(difficulty as Difficulty) || worldKey.length > 64) fail('INVALID_KBO_CLUB_GAME');
    return createKboClubGame({ worldKey, seed, difficulty: difficulty as Difficulty, clubId });
  }
  if (!game) fail('CLUB_NOT_CREATED');
  const revision = game.revision;
  if (command.type === 'CLUB_START') return startKboClubSeason(game, revision);
  if (command.type === 'CLUB_LINEUP') {
    const body = command.payload as { auto?: unknown; clear?: unknown; draft?: ClubLineupDraft } | null;
    if (body?.clear === true) return clearKboClubLineup(game, revision);
    if (body?.auto === true) return applyKboClubLineup(game, revision, autoClubLineup(game));
    if (body?.draft) return applyKboClubLineup(game, revision, body.draft);
    fail('INVALID_CLUB_LINEUP');
  }
  if (command.type === 'CLUB_FIRST_TEAM') {
    const keys = (command.payload as { playerKeys?: unknown } | null)?.playerKeys;
    if (!Array.isArray(keys) || !keys.every((key): key is string => typeof key === 'string')) fail('INVALID_CLUB_FIRST_TEAM');
    return setKboClubFirstTeam(game, revision, keys);
  }
  if (command.type === 'CLUB_ADVANCE') {
    const maxDays = (command.payload as { maxDays?: unknown } | null)?.maxDays ?? 1;
    if (typeof maxDays !== 'number') fail('INVALID_ADVANCE_DAYS');
    return advanceKboClubGame(game, revision, maxDays).game;
  }
  fail('UNSUPPORTED_COMMAND');
}
