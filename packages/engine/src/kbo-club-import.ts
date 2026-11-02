import { abilityKeys, assertFocus, roleScore, KBO_MONEY, UNITS_PER_POINT } from '@playball/rules';
import type { PlayerKind, PitchId } from '@playball/rules';
import type { ActiveKboRosterWorld, KboCareer } from './kbo-career-entry.js';
import type { DevelopmentPlayer } from './player.js';
import { validateDevelopmentPlayer } from './player.js';
import { createWorldStream, nextInteger } from './rng.js';
import { createRepertoire } from './repertoire.js';
import type { KboFreeAgentPool } from './kbo-free-agents.js';
import { assertKboFreeAgentPool } from './kbo-free-agents.js';

/** 32/05: a frozen retired career is copied into a new club game as a 19-year-old. Identity and handedness carry over
 * unchanged; abilities start at half of each ability's career peak; the potential is re-rolled upward; records, medals,
 * military history and contract do not carry over (the source stays immutable). */
export interface ArchivedPlayerSnapshot {
  archiveId: string; name: string; kind: PlayerKind; position: string; throws: DevelopmentPlayer['throws']; bats: DevelopmentPlayer['bats'];
  pitchForm: DevelopmentPlayer['pitchForm']; archetype: string; finalAbilities: DevelopmentPlayer['abilities']; careerPeaks: DevelopmentPlayer['abilities'];
  finalPotential: DevelopmentPlayer['potential']; peakEvidenceVersion: 1; retiredAge: number; topPitchId: PitchId | null;
}
/** Reads the allowlisted copy source from an ARCHIVED pro career. A career whose player has no career peaks cannot be copied. */
export function archivedPlayerOf(source: KboCareer): ArchivedPlayerSnapshot {
  const p = source.world.players[source.protagonistKey];
  if (source.phaseContext.phase !== 'ARCHIVED' || !source.retirement || !p) throw new RangeError('ARCHIVE_NOT_READY');
  validateDevelopmentPlayer(p);
  const book = source.world.repertoires[p.simulationKey];
  const top = book ? (Object.entries(book.weights).filter(([id]) => id !== 'P01').sort(([a, x], [b, y]) => (y as number) - (x as number) || (a < b ? -1 : 1))[0]?.[0] as PitchId | undefined) ?? null : null;
  return {
    archiveId: JSON.stringify(['archive', source.world.worldKey, source.protagonistKey]), name: p.name, kind: p.kind, position: p.position, throws: p.throws, bats: p.bats, pitchForm: p.pitchForm,
    archetype: p.archetype, finalAbilities: structuredClone(p.abilities), careerPeaks: structuredClone(p.careerPeaks), finalPotential: structuredClone(p.potential), peakEvidenceVersion: 1, retiredAge: p.age, topPitchId: top,
  };
}

export interface ClubImportRequest { archive: ArchivedPlayerSnapshot; replaceKey: string; focus: readonly string[]; importDraftId: string }
export interface ClubImportReceipt { importDraftId: string; archiveId: string; playerKey: string; replacedKey: string }

/** 05: replacement candidates are same-kind, same-position players of my club (hitters keep their fielding slot, pitchers are
 * replaced by pitchers of the same role), weakest role score first. Empty means this archive cannot be used. */
export function importReplacementCandidates(world: ActiveKboRosterWorld, clubId: string, archive: ArchivedPlayerSnapshot, taken: ReadonlySet<string> = new Set()): string[] {
  const club = world.clubs.find(c => c.id === clubId);
  if (!club) throw new RangeError('MISSING_KBO_CLUB');
  return club.roster.filter(k => !taken.has(k) && world.players[k]!.kind === archive.kind && world.players[k]!.position === archive.position)
    .sort((a, b) => roleScore(archive.kind, world.players[a]!.abilities, archive.position) - roleScore(archive.kind, world.players[b]!.abilities, archive.position) || (a < b ? -1 : 1));
}

/** The 19-year-old copy (D constants: half of each ability peak with a 1-point floor; potential = min(100, max(peak, old potential) + 5..10),
 * the boost drawn from a stream fixed by the import draft id and the archive id, so reopening or retrying never changes it). */
export function importedPlayerOf(request: ClubImportRequest, worldSeed: string, key: string): DevelopmentPlayer {
  const a = request.archive;
  if (a.peakEvidenceVersion !== 1 || abilityKeys(a.kind).some(k => !Number.isSafeInteger(a.careerPeaks[k]))) throw new RangeError('ARCHIVE_PEAKS_REQUIRED');
  assertFocus(a.kind, request.focus);
  let rng = createWorldStream(worldSeed, JSON.stringify(['kbo-import-potential', request.importDraftId, a.archiveId]), 'potential');
  const abilities: Record<string, number> = {}, potential: Record<string, number> = {};
  for (const k of abilityKeys(a.kind)) {
    abilities[k] = Math.max(UNITS_PER_POINT, Math.floor(a.careerPeaks[k]! / 2));
    const draw = nextInteger(rng, 6); rng = draw.state;
    potential[k] = Math.min(100 * UNITS_PER_POINT, Math.max(a.careerPeaks[k]!, a.finalPotential[k]!) + (5 + draw.value) * UNITS_PER_POINT);
    if (potential[k]! < abilities[k]!) potential[k] = abilities[k]!;
  }
  const player: DevelopmentPlayer = { simulationKey: key, name: a.name, kind: a.kind, age: 19, position: a.position, throws: a.throws, bats: a.bats, pitchForm: a.pitchForm, archetype: a.archetype, focus: [...request.focus], abilities, potential, careerPeaks: { ...abilities }, fatigue: 0 };
  validateDevelopmentPlayer(player);
  return player;
}

/** Applies every import of one new club game at once (mutates the caller's clone). Each copy replaces one candidate: the
 * replaced player leaves the club and enters the free-agent pool (origin RELEASED, kept identity and history), the copy takes his
 * roster tier, and gets the one-year minimum contract. Because this happens while the game is being created, the replaced contract
 * is treated as never signed (no guarantee is owed). The club must still be playable afterwards. */
export function importArchivedPlayers(world: ActiveKboRosterWorld, pool: KboFreeAgentPool, clubId: string, requests: readonly ClubImportRequest[], seed: string): { receipts: ClubImportReceipt[]; pool: KboFreeAgentPool } {
  const club = world.clubs.find(c => c.id === clubId);
  if (!club || requests.length > 28 || new Set(requests.map(r => r.archive.archiveId)).size !== requests.length || new Set(requests.map(r => r.importDraftId)).size !== requests.length) throw new RangeError('INVALID_CLUB_IMPORT');
  const taken = new Set<string>(), receipts: ClubImportReceipt[] = [], next = structuredClone(pool);
  for (const request of requests) {
    if (!importReplacementCandidates(world, clubId, request.archive, taken).includes(request.replaceKey)) throw new RangeError('INVALID_IMPORT_REPLACEMENT');
    const key = JSON.stringify(['kbo-import', request.importDraftId, request.archive.archiveId]);
    if (Object.hasOwn(world.players, key)) throw new RangeError('IMPORT_ALREADY_APPLIED');
    const copy = importedPlayerOf(request, seed, key), old = world.players[request.replaceKey]!, oldContract = world.contracts[request.replaceKey]!, tier = club.firstTeam.includes(request.replaceKey);
    next.players[request.replaceKey] = { player: structuredClone(old), ...(world.repertoires[request.replaceKey] ? { repertoire: structuredClone(world.repertoires[request.replaceKey]!) } : {}), origin: 'RELEASED', enteredSeasonKey: world.seasonKey, previousClubId: clubId, previousContract: structuredClone(oldContract) };
    club.roster = club.roster.filter(k => k !== request.replaceKey).concat(key).sort();
    club.firstTeam = (tier ? club.firstTeam.filter(k => k !== request.replaceKey).concat(key) : club.firstTeam).sort();
    club.reservedSalaryWon += KBO_MONEY.minimumSalaryWon - oldContract.annualSalaryWon;
    delete world.players[request.replaceKey]; delete world.contracts[request.replaceKey]; delete world.repertoires[request.replaceKey];
    world.players[key] = copy;
    world.contracts[key] = { contractKey: JSON.stringify(['kbo-import-contract', request.importDraftId, request.archive.archiveId]), playerKey: key, clubId, seasonKey: world.seasonKey, years: 1, annualSalaryWon: KBO_MONEY.minimumSalaryWon, signingBonusWon: 0, status: 'ACTIVE' };
    if (copy.kind === 'PITCHER') world.repertoires[key] = createRepertoire(request.archive.topPitchId ?? 'P02', world.seasonKey);
    taken.add(request.replaceKey); taken.add(key); receipts.push({ importDraftId: request.importDraftId, archiveId: request.archive.archiveId, playerKey: key, replacedKey: request.replaceKey });
  }
  assertKboFreeAgentPool(next, Object.keys(world.players));
  return { receipts, pool: next };
}
