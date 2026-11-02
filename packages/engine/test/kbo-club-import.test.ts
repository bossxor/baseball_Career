import test from 'node:test';
import assert from 'node:assert/strict';
import { abilityKeys, UNITS_PER_POINT } from '@playball/rules';
import { createKboClubGame, kboClubRosterIssues } from '../src/kbo-club-game.js';
import { archivedPlayerOf, importReplacementCandidates, importedPlayerOf, importArchivedPlayers } from '../src/kbo-club-import.js';
import type { ArchivedPlayerSnapshot, ClubImportRequest } from '../src/kbo-club-import.js';
import type { KboCareer } from '../src/kbo-career-entry.js';
import { canonicalJson } from '../src/game.js';

const pts = (n: number) => n * UNITS_PER_POINT;
const hitterArchive = (position = 'CF', peakPoints = [90, 81, 60, 1, 100, 75]): ArchivedPlayerSnapshot => {
  const keys = abilityKeys('HITTER'), peaks = Object.fromEntries(keys.map((k, i) => [k, pts(peakPoints[i]!)]));
  return { archiveId: `a-${position}`, name: '김보관', kind: 'HITTER', position, throws: 'R', bats: 'L', pitchForm: null, archetype: 'CONTACT', finalAbilities: { ...peaks }, careerPeaks: peaks, finalPotential: Object.fromEntries(keys.map(k => [k, pts(95)])), peakEvidenceVersion: 1, retiredAge: 38, topPitchId: null };
};
const pitcherArchive = (): ArchivedPlayerSnapshot => {
  const keys = abilityKeys('PITCHER'), peaks = Object.fromEntries(keys.map(k => [k, pts(80)]));
  return { archiveId: 'a-SP', name: '박선발', kind: 'PITCHER', position: 'SP', throws: 'L', bats: 'R', pitchForm: 'THREE_QUARTER', archetype: 'COMMAND', finalAbilities: { ...peaks }, careerPeaks: peaks, finalPotential: Object.fromEntries(keys.map(k => [k, pts(70)])), peakEvidenceVersion: 1, retiredAge: 40, topPitchId: 'P03' };
};
const base = () => createKboClubGame({ worldKey: 'imp-w', seed: 'imp-seed', difficulty: 'REALISTIC', clubId: 'LG' });
const request = (archive: ArchivedPlayerSnapshot, replaceKey: string, draft = 'draft-1'): ClubImportRequest => ({ archive, replaceKey, focus: abilityKeys(archive.kind).slice(0, 4), importDraftId: draft });

test('copy: half of every ability peak (1-point floor), identity kept, new potential 5..10 above the better of peak/old potential, fixed by the draft', () => {
  const r = request(hitterArchive(), 'x'), p = importedPlayerOf(r, 'seed', 'k'), keys = abilityKeys('HITTER');
  assert.deepEqual(keys.map(k => p.abilities[k]), [pts(45), pts(40.5), pts(30), pts(1), pts(50), pts(37.5)]);
  assert.deepEqual([p.age, p.name, p.throws, p.bats, p.position, p.fatigue, p.archetype], [19, '김보관', 'R', 'L', 'CF', 0, 'CONTACT']);
  assert.deepEqual(p.careerPeaks, p.abilities);
  for (const k of keys) { assert.ok(p.potential[k]! >= Math.min(pts(100), Math.max(r.archive.careerPeaks[k]!, r.archive.finalPotential[k]!) + pts(5)) || p.potential[k] === pts(100)); assert.ok(p.potential[k]! <= pts(100)); assert.ok(p.potential[k]! >= p.abilities[k]!); }
  assert.deepEqual(importedPlayerOf(r, 'seed', 'k'), p, 'reopening never changes the potential');
  // Low peaks leave room under the 100 cap, so a different draft id draws a different boost.
  const lowArchive = { ...hitterArchive('CF', [40, 40, 40, 40, 40, 40]), finalPotential: Object.fromEntries(abilityKeys('HITTER').map(k => [k, pts(45)])) }, low = request(lowArchive, 'x'), lowA = importedPlayerOf(low, 'seed', 'k');
  assert.notDeepEqual(importedPlayerOf({ ...low, importDraftId: 'draft-2' }, 'seed', 'k').potential, lowA.potential);
  assert.ok(abilityKeys('HITTER').every(k => lowA.potential[k]! >= pts(50) && lowA.potential[k]! <= pts(55)));
  assert.throws(() => importedPlayerOf({ ...r, focus: ['CONTACT'] }, 'seed', 'k'), /four different/);
  const noPeak = { ...hitterArchive(), peakEvidenceVersion: 2 as unknown as 1 };
  assert.throws(() => importedPlayerOf({ ...r, archive: noPeak }, 'seed', 'k'), /ARCHIVE_PEAKS_REQUIRED/);
});

test('club game with an import: the copy replaces the weakest same-position player in the same tier, the replaced one enters the pool, the club stays valid', () => {
  const plain = base(), club = plain.world.clubs.find(c => c.id === 'LG')!, archive = hitterArchive('CF');
  const candidates = importReplacementCandidates(plain.world, 'LG', archive);
  assert.ok(candidates.length >= 1 && candidates.every(k => plain.world.players[k]!.position === 'CF' && plain.world.players[k]!.kind === 'HITTER'));
  const victim = candidates[0]!, wasFirst = club.firstTeam.includes(victim), oldContract = plain.world.contracts[victim]!;
  const g = createKboClubGame({ worldKey: 'imp-w', seed: 'imp-seed', difficulty: 'REALISTIC', clubId: 'LG', imports: [request(archive, victim)] });
  const mine = g.world.clubs.find(c => c.id === 'LG')!, copyKey = g.imports[0]!.playerKey;
  assert.equal(g.imports[0]!.replacedKey, victim);
  assert.ok(mine.roster.includes(copyKey) && !mine.roster.includes(victim) && mine.roster.length === club.roster.length);
  assert.equal(mine.firstTeam.includes(copyKey), wasFirst);assert.equal(mine.firstTeam.length, club.firstTeam.length);
  assert.deepEqual([g.world.contracts[copyKey]!.years, g.world.contracts[copyKey]!.annualSalaryWon], [1, 30_000_000]);
  assert.ok(!Object.hasOwn(g.world.players, victim) && !Object.hasOwn(g.world.contracts, victim));
  const out = g.freeAgents.players[victim]!;
  assert.deepEqual([out.origin, out.previousClubId, out.previousContract!.annualSalaryWon], ['RELEASED', 'LG', oldContract.annualSalaryWon]);
  assert.equal(mine.reservedSalaryWon, club.reservedSalaryWon + 30_000_000 - oldContract.annualSalaryWon);
  assert.deepEqual(kboClubRosterIssues(g), []);
  for (const other of plain.world.clubs.filter(c => c.id !== 'LG')) assert.deepEqual(g.world.clubs.find(c => c.id === other.id), other, 'other clubs are untouched');
  assert.notEqual(g.creationKey, plain.creationKey);
  assert.equal(canonicalJson(createKboClubGame({ worldKey: 'imp-w', seed: 'imp-seed', difficulty: 'REALISTIC', clubId: 'LG', imports: [request(archive, victim)] })), canonicalJson(g));
  assert.ok(Object.keys(plain.freeAgents.players).length >= 80);
});

test('a pitcher copy gets a fresh two-pitch book and replaces a starter; bad picks are refused with a reason', () => {
  const plain = base(), archive = pitcherArchive(), victim = importReplacementCandidates(plain.world, 'LG', archive)[0]!;
  const g = createKboClubGame({ worldKey: 'imp-w', seed: 'imp-seed', difficulty: 'REALISTIC', clubId: 'LG', imports: [request(archive, victim)] }), key = g.imports[0]!.playerKey;
  assert.deepEqual(Object.keys(g.world.repertoires[key]!.book).sort(), ['P01', 'P03']);assert.equal(g.world.players[key]!.pitchForm, 'THREE_QUARTER');assert.equal(g.world.players[key]!.position, 'SP');
  const lg = plain.world.clubs.find(c => c.id === 'LG')!, other = lg.roster.find(k => plain.world.players[k]!.position !== 'CF')!;
  const make = (imports: ClubImportRequest[]) => () => createKboClubGame({ worldKey: 'imp-w', seed: 'imp-seed', difficulty: 'REALISTIC', clubId: 'LG', imports });
  assert.throws(make([request(hitterArchive('CF'), other)]), /INVALID_IMPORT_REPLACEMENT/);
  const cf = importReplacementCandidates(plain.world, 'LG', hitterArchive('CF'));
  assert.throws(make([request(hitterArchive('CF'), cf[0]!), { ...request({ ...hitterArchive('CF'), archiveId: 'a-2' }, cf[0]!), importDraftId: 'draft-2' }]), /INVALID_IMPORT_REPLACEMENT/);
  assert.throws(make([request(hitterArchive('CF'), cf[0]!), request(hitterArchive('CF'), cf[0]!)]), /INVALID_CLUB_IMPORT/);
  assert.throws(make(Array.from({ length: 29 }, (_, i) => request({ ...hitterArchive('CF'), archiveId: `a${i}` }, cf[0]!, `d${i}`))), /INVALID_CLUB_IMPORT/);
});

test('archive source: only a frozen retired career is readable; the player identity and peaks come from it', () => {
  const g = base(), key = Object.keys(g.world.players)[0]!, p = g.world.players[key]!;
  const frozen = { phaseContext: { phase: 'ARCHIVED' }, retirement: { reason: 'VOLUNTARY' }, protagonistKey: key, world: { worldKey: 'w', players: g.world.players, repertoires: g.world.repertoires } } as unknown as KboCareer;
  const a = archivedPlayerOf(frozen);
  assert.deepEqual([a.name, a.position, a.retiredAge, a.peakEvidenceVersion], [p.name, p.position, p.age, 1]);
  assert.deepEqual(a.careerPeaks, p.careerPeaks);
  assert.throws(() => archivedPlayerOf({ ...frozen, phaseContext: { phase: 'SEASON_REVIEW' } } as unknown as KboCareer), /ARCHIVE_NOT_READY/);
  void importArchivedPlayers;
});
