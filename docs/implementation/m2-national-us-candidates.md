# M2 national candidate source seam

`nationalUsCandidates` is a read projection over explicitly supplied current `KboCareer` and `UsCareer` roots from the same world, year and seed. The persistence owner must load both roots under its compare-and-swap boundary and pass their expected revisions. Equality cannot establish that a caller fetched the latest persisted root. `recordProjectionRevision` belongs to that caller's projection lineage and must be at least both source record revisions; it must not be written back into either career ledger.

KBO candidates retain `kboNationalCandidates` policy. The US addition is only the protagonist whose same-world, same-player Korean high-school registration is present in `amateurHistory.world` or a school season archive. College graduates may prove origin through that archive. US NPCs have no nationality source and are excluded. This temporary policy treats confirmed Korean-school origin as KOR eligibility; it does not introduce nationality metadata.

Current US registration, live contract release permission, injury, archive phase and military status feed existing `national-selection` rules. Frozen/terminated service statuses map to ACTIVE service and remain unavailable until the existing military lifecycle marks completion. No ranking weights, eligibility tournament rules, record samples or simulation values are added. The returned candidate array and game contributions are detached copies.

Records from both roots are projected without changing either root. Identical shared game keys are deduplicated; differing contributions for one game key are rejected. Duplicate candidate player ownership is rejected even if player copies happen to match. A stale KBO pre-transfer player must be resolved by the world/source owner before this adapter can use that US player; the adapter never prefers one career silently.

## Actual caller integration

`openKboNationalSelection` currently calls `createNationalSelection` with `kboNationalCandidates(c)` and `c.records`. Its caller must explicitly supply the current US root and revisions, obtain this projection and pass **both** `projection.candidates` and `projection.records` into `createNationalSelection`. Spreading the projection plus `tournament` supplies that function's existing input shape. Persist only the resulting selection in the owning career, never overwrite either ledger with `projection.records`. The selection's `sourceRecordRevision` then identifies this explicit projection. Keep projection source revision metadata alongside the owning operation.

`national-progress.ts` also obtains emergency replacement candidates from `kboNationalCandidates(c)` and reads player identities from `c.world.players`; national lineup records likewise need this projected ledger. That execution path needs the same source context/identity resolver before a selected overseas player can play. Calling this helper alone does not finish US national tournament integration. The parent owns caller/export changes.

Source/policy gaps: no durable shared world registry currently establishes which root owns a transferred player or advances both leagues to the same date; source revision equality does not solve that. US NPC nationality generation remains deferred. US callup/event lifecycle and tournament progression need an explicit owner rather than borrowing KBO phase types.

## Validation

`packages/engine/test/national-us-candidates.test.ts` covers selection scoring on actual MLB contribution data, unknown NPC exclusion, detached projection, release/injury/service/retirement gates, stale/foreign/origin mismatch rejection, duplicate ownership, conflict refusal, exact-record dedupe and college origin archives. These are controlled adapter sources, not a claim of validated full US activation.

Runtime tests and full checks: **PENDING**, intentionally not executed during M2 bulk implementation. Static engine type check is delegated to the parent.
