import test from 'node:test';
import assert from 'node:assert/strict';
import { createKboClubGame } from '../src/kbo-club-game.js';
import type { KboClubGame } from '../src/kbo-club-game.js';
import { startKboClubSeason } from '../src/kbo-club-progress.js';
import { clubSeasonBlock } from '../src/kbo-club-progress.js';
import { kboClubGameContext } from '../src/kbo-club-progress.js';
import { closeKboClubSeason, startNextKboClubSeason } from '../src/kbo-club-year.js';
import { applyKboFinanceRebuild, kboClubBalance, kboSalaryRise } from '../src/kbo-finance.js';
import { autoClubBullpen, planKboClubRoster, recommendClubCallup, setKboClubBullpen, validateClubBullpen } from '../src/kbo-club-manage.js';
import { assertKboRecruitmentWorld } from '../src/kbo-draft.js';
import { KBO_MONEY } from '@playball/rules';
import type { KboGuarantee } from '../src/kbo-finance.js';

function review(): KboClubGame {
  const g = structuredClone(startKboClubSeason(createKboClubGame({ worldKey: 'ops-w', seed: 'ops-seed', difficulty: 'REALISTIC', clubId: 'LG' }), 0));
  const all = [...g.schedule.KBO, ...g.schedule.FUTURES].map(x => x.worldDay), first = Math.min(...all), last = Math.max(...all);
  g.days = { ...g.days!, days: Array.from({ length: last - first + 1 }, (_, i) => ({ day: first + i, evidence: 'test', result: { injured: [], recovered: [] } })) };
  g.phase = 'SEASON_REVIEW'; delete g.progress;
  return g;
}

test('finance rebuild keeps guarantees and covers the deficit for one season; salary rise is a read', () => {
  const created = createKboClubGame({ worldKey: 'ops-w', seed: 'ops-seed', difficulty: 'REALISTIC', clubId: 'LG' });
  const rise = kboSalaryRise(created.world, 'LG');
  assert.equal(rise.annualBaseWon, KBO_MONEY.annualBudgetWon);
  assert.equal(rise.payrollWon, created.world.clubs.find(c => c.id === 'LG')!.reservedSalaryWon);
  assert.equal(applyKboFinanceRebuild(created.world).length, 0);
  const opened = review();
  const closed = closeKboClubSeason(opened, opened.revision);
  const guarantees: KboGuarantee[] = Array.from({ length: 5 }, (_, i) => ({
    obligationKey: JSON.stringify(['kbo-guarantee', `src-${i}`, '2027', 'RELEASE']),
    sourceContractKey: `src-${i}`, playerKey: `ghost-${i}`, clubId: 'LG', reason: 'RELEASE' as const, createdSeasonKey: '2027',
    dues: [{ seasonKey: '2028', amountWon: KBO_MONEY.maximumSalaryWon }],
  }));
  closed.world.finance = { guarantees, grants: [] };
  const before = guarantees.map(g => g.dues[0]!.amountWon);
  const next = startNextKboClubSeason(closed, closed.revision);
  assert.doesNotThrow(() => assertKboRecruitmentWorld(next.world));
  const grant = next.world.finance?.grants.find(g => g.reason === 'FINANCE_REBUILD' && g.clubId === 'LG');
  assert.ok(grant && grant.seasonKey === '2028' && grant.amountWon > 0);
  assert.deepEqual(next.world.finance?.guarantees.filter(g => g.clubId === 'LG').map(g => g.dues[0]!.amountWon), before);
  assert.ok(kboClubBalance(next.world, 'LG').availableWon >= 0);
  assert.equal(next.world.clubs.find(c => c.id === 'LG')!.budgetWon, KBO_MONEY.annualBudgetWon);
  const again = applyKboFinanceRebuild(next.world);
  assert.equal(again.length, 0);
});

test('manager renewal stays, release keeps the future guarantee and moves the player to FA, a full roster refuses a trade', () => {
  const opened = review();
  const closed = closeKboClubSeason(opened, opened.revision);
  const mine = Object.values(closed.world.contracts).filter(c => c.clubId === 'LG');
  const renew = mine.find(c => c.years === 1)!, release = mine.find(c => c.years >= 2 && c.playerKey !== renew.playerKey)!;
  const other = closed.world.clubs.find(c => c.id !== 'LG')!;
  const planned = planKboClubRoster(closed, closed.revision, [
    { playerKey: renew.playerKey, action: 'RENEW' },
    { playerKey: release.playerKey, action: 'RELEASE' },
  ]);
  const next = startNextKboClubSeason(planned, planned.revision);
  assert.equal(next.world.contracts[renew.playerKey]?.clubId, 'LG');
  assert.equal(next.world.contracts[renew.playerKey]?.years, 1);
  assert.ok(next.world.contracts[renew.playerKey]?.contractKey.includes('kbo-user-renewal'));
  assert.notEqual(next.world.contracts[release.playerKey]?.contractKey, release.contractKey);
  const due = next.world.finance?.guarantees.find(g => g.playerKey === release.playerKey);
  assert.equal(due?.reason, 'RELEASE');
  assert.ok((due?.dues.length ?? 0) >= 1);
  assert.equal(due?.dues[0]?.amountWon, release.annualSalaryWon);
  const held = mine.find(c => c.years >= 2)!;
  const trade = planKboClubRoster(closed, closed.revision, [{ playerKey: held.playerKey, action: 'TRADE', counterClubId: other.id, counterPlayerKey: other.roster.find(k => closed.world.contracts[k]!.years >= 2)! }]);
  assert.throws(() => startNextKboClubSeason(trade, trade.revision), /CLUB_TRADE_REFUSED/);
});

test('bullpen chart is CP1/SU2/MR4/LR1, an injured CP stops and recommends a call-up, other-club health is not a stop by itself', () => {
  const game = createKboClubGame({ worldKey: 'ops-w', seed: 'ops-seed', difficulty: 'REALISTIC', clubId: 'LG' });
  const slots = autoClubBullpen(game);
  const counts = { CP: 0, SU: 0, MR: 0, LR: 0 };
  for (const role of Object.values(slots)) counts[role]++;
  assert.deepEqual(counts, { CP: 1, SU: 2, MR: 4, LR: 1 });
  const set = setKboClubBullpen(game, game.revision, slots);
  assert.deepEqual(validateClubBullpen(set), []);
  const cp = Object.entries(slots).find(([, role]) => role === 'CP')![0];
  set.health.injuries[cp] = { severity: 'MILD', remainingTeamGames: 1, diagnosedGameKey: 'x', seasonKey: '2027' };
  assert.equal(validateClubBullpen(set).some(i => i.code === 'CP_INJURED'), true);
  const armed = setKboClubBullpen(game, game.revision, slots);
  const started = startKboClubSeason(armed, armed.revision);
  const ctx = kboClubGameContext(started, 'KBO');
  assert.equal(ctx.bullpenSlots?.LG?.[cp], 'CP');
  assert.equal(kboClubGameContext(started, 'FUTURES').bullpenSlots, undefined);
  started.health.injuries[cp] = { severity: 'MILD', remainingTeamGames: 1, diagnosedGameKey: 'x', seasonKey: '2027' };
  const call = recommendClubCallup(started);
  const lg = started.world.clubs.find(c => c.id === 'LG')!;
  assert.equal(call?.injuredKey, cp);
  assert.equal(started.world.players[call!.candidateKey]!.position, started.world.players[cp]!.position);
  assert.equal(lg.firstTeam.includes(call!.candidateKey), false);
  const blocked = structuredClone(started);
  blocked.world.contracts[cp]!.seasonKey = '2026';
  assert.equal(clubSeasonBlock(blocked), 'CONTRACT_EXPIRED');
});
