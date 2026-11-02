import assert from 'node:assert/strict';
import test from 'node:test';
import { applyKboClubCommand, kboClubScreen } from '../src/kbo-club-command.js';

test('club save commands and S13-S19 reads', () => {
  const created = applyKboClubCommand(null, { type: 'CLUB_CREATE', payload: { seed: 'm6f', difficulty: 'REALISTIC', clubId: 'LG' } });
  assert.equal(created.userClubId, 'LG');
  assert.equal(created.revision, 0);
  assert.throws(() => applyKboClubCommand(created, { type: 'CLUB_CREATE', payload: { seed: 'm6f', difficulty: 'REALISTIC', clubId: 'LG' } }), /CLUB_ALREADY_CREATED/);
  assert.throws(() => applyKboClubCommand(null, { type: 'CLUB_CREATE', payload: { seed: '', difficulty: 'REALISTIC', clubId: 'NO' } }), /INVALID_KBO_CLUB_GAME/);

  const home = kboClubScreen(created, 'S13');
  assert.equal(home.lines.find(line => line.label === '구단')?.value, 'LG 트윈스');
  assert.equal(home.commands[0]?.type, 'CLUB_START');
  assert.equal(kboClubScreen(created, 'S14').lines.length, 50);
  assert.equal(kboClubScreen(created, 'S18').lines.length, 10);
  assert.match(kboClubScreen(created, 'S19').lines[0]!.value, /아직 경기/);
  const rosterKey = created.world.clubs.find(club => club.id === 'LG')!.roster[0]!;
  const detail = JSON.stringify(kboClubScreen(created, 'S16', { playerKey: rosterKey }));
  assert.equal(detail.includes('potential'), false);
  assert.throws(() => kboClubScreen(created, 'S16', { playerKey: 'missing' }), /CLUB_PLAYER_NOT_FOUND/);

  const lined = applyKboClubCommand(created, { type: 'CLUB_LINEUP', payload: { auto: true } });
  assert.equal(lined.lineup?.draft.battingOrder.length, 9);
  assert.equal(kboClubScreen(lined, 'S15').lines[0]?.label, '저장된 선발');
  const cleared = applyKboClubCommand(lined, { type: 'CLUB_LINEUP', payload: { clear: true } });
  assert.equal(cleared.lineup, undefined);

  const first = created.world.clubs.find(club => club.id === 'LG')!.firstTeam;
  const kept = applyKboClubCommand(cleared, { type: 'CLUB_FIRST_TEAM', payload: { playerKeys: first } });
  assert.equal(kept.revision, cleared.revision + 1);
  assert.throws(() => applyKboClubCommand(kept, { type: 'CLUB_ADVANCE', payload: { maxDays: 1 } }), /INVALID_CLUB_PHASE/);

  const started = applyKboClubCommand(kept, { type: 'CLUB_START', payload: {} });
  assert.equal(started.phase, 'SEASON_PROGRESS');
  assert.equal(kboClubScreen(started, 'S13').commands[0]?.type, 'CLUB_ADVANCE');

  const pen = applyKboClubCommand(created, { type: 'CLUB_BULLPEN', payload: { auto: true } });
  const roles = Object.values(pen.bullpen?.slots ?? {});
  assert.deepEqual(roles.filter(role => role === 'CP').length, 1);
  assert.equal(roles.length, 8);
  assert.ok(kboClubScreen(pen, 'S15').commands.some(command => command.type === 'CLUB_BULLPEN'));
  assert.throws(() => applyKboClubCommand(pen, { type: 'CLUB_OFFERS', payload: { offers: [] } }), /CLUB_OFFERS_NOT_OPEN/);
  assert.throws(() => applyKboClubCommand(pen, { type: 'CLUB_ROSTER', payload: { actions: [] } }), /CLUB_ROSTER_PLAN_NOT_OPEN/);
  assert.throws(() => applyKboClubCommand(pen, { type: 'CLUB_NEXT', payload: {} }), /CLUB_SEASON_NOT_CLOSED/);
  assert.throws(() => applyKboClubCommand(pen, { type: 'CLUB_OFFERS', payload: {} }), /INVALID_CLUB_OFFERS/);
});
