import assert from 'node:assert/strict';
import test from 'node:test';
import { createKboClubGame } from '../src/kbo-club-game.js';
import { clubEraLabel, clubInternationalWindows, clubMilitaryWatch, clubStrategyReport, initialClubStrategy, nextClubStrategy } from '../src/kbo-club-labels.js';

test('strategy labels, sangmu watch and international windows do not move the roster', () => {
  assert.equal(nextClubStrategy('BALANCED', [], null), 'BALANCED');
  assert.equal(nextClubStrategy('BALANCED', [1], 30), 'CONTEND');
  assert.equal(nextClubStrategy('CONTEND', [8, 9], 28), 'DEVELOPMENT');
  assert.equal(nextClubStrategy('DEVELOPMENT', [5], 30), 'BALANCED');
  assert.equal(clubEraLabel([{ rank: 1, postseason: true, winRate: 0.6 }, { rank: 2, postseason: false, winRate: 0.5 }]), 'EVALUATING');
  assert.equal(clubEraLabel([{ rank: 8, postseason: false, winRate: 0.4 }, { rank: 9, postseason: false, winRate: 0.4 }, { rank: 10, postseason: false, winRate: 0.3 }]), 'SLUMP');
  assert.equal(clubEraLabel([{ rank: 1, postseason: true, winRate: 0.6 }, { rank: 2, postseason: true, winRate: 0.6 }, { rank: 4, postseason: false, winRate: 0.6 }]), 'PEAK');
  const game = createKboClubGame({ worldKey: 'labels', seed: 'm6i', clubId: 'LG', difficulty: 'REALISTIC' });
  const before = game.world.clubs.find(club => club.id === 'LG')!.roster.length;
  const report = clubStrategyReport(game.world);
  assert.equal(report.length, 10);
  assert.equal(report.find(row => row.clubId === 'LG')?.strategy, initialClubStrategy(game.world.seed, game.world.worldKey, 'LG'));
  assert.equal(report.every(row => row.era === 'EVALUATING'), true);
  const watch = clubMilitaryWatch(game);
  assert.ok(watch.mine.length <= 3);
  assert.equal(game.world.clubs.find(club => club.id === 'LG')!.roster.length, before);
  assert.deepEqual(clubInternationalWindows(game), game.world.calendar.international.map(window => ({ type: window.type, startDay: window.startDay, endDay: window.endDay })));
});
