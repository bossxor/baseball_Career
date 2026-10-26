import assert from 'node:assert/strict';
import test from 'node:test';
import { createKboClubGame } from '../src/kbo-club-game.js';
import { saveClubNationalRoster, selectClubNationalRoster } from '../src/kbo-club-national.js';

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
