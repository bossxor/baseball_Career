import assert from 'node:assert/strict';
import test from 'node:test';
import { createKboClubGame } from '../src/kbo-club-game.js';
import { overall, UNITS_PER_POINT } from '@playball/rules';
import { assignNationalPresets, nationalOpponentRoster, saveClubNationalRoster, selectClubNationalRoster } from '../src/kbo-club-national.js';

test('national selection fills an Asian Games roster and leaves a record-less P12 empty', () => {
  const game = createKboClubGame({ worldKey: 'nat', seed: 'm6l', clubId: 'LG', difficulty: 'REALISTIC' });
  const ag = selectClubNationalRoster(game, 'AG');
  const players = ag.playerKeys.map(key => game.world.players[key]!);
  assert.equal(players.filter(player => player.kind === 'HITTER').length, 15);
  assert.equal(players.filter(player => player.kind === 'PITCHER').length, 13);
  assert.ok(players.filter(player => player.position === 'C').length >= 2);
  assert.equal(new Set(ag.playerKeys).size, 28);
  assert.equal(selectClubNationalRoster(game, 'P12').playerKeys.length, 0);
  const saved = saveClubNationalRoster(game, game.revision, 'AG');
  assert.equal(saved.national?.[0]?.playerKeys.length, 28);
  assert.throws(() => saveClubNationalRoster(saved, saved.revision, 'AG'), /NATIONAL_ALREADY_SELECTED/);
});

test('foreign presets are 65/55/45 and split evenly', () => {
  const ids = Array.from({ length: 19 }, (_, index) => `C${index}`);
  const first = assignNationalPresets('m6-int', ids);
  const again = assignNationalPresets('m6-int', ids);
  assert.deepEqual(again, first);
  const counts = { STRONG: 0, MID: 0, WEAK: 0 };
  for (const row of first) counts[row.preset]++;
  assert.deepEqual(Object.values(counts).sort(), [6, 6, 7]);
  const strong = first.find(row => row.preset === 'STRONG')!;
  assert.equal(strong.overall, 65);
  const roster = nationalOpponentRoster(strong.countryId, strong.overall);
  assert.equal(roster.length, 28);
  assert.equal(roster.filter(player => player.position === 'C').length, 2);
  assert.equal(roster.filter(player => player.kind === 'PITCHER').length, 13);
  const hitter = roster.find(player => player.kind === 'HITTER')!;
  assert.equal(overall('HITTER', hitter.abilities).display, '65.0');
  assert.equal(hitter.abilities.CONTACT, 65 * UNITS_PER_POINT);
});
