# E68 return checkpoint — 2026-11-02

Stopped on explicit user instruction. This is an unfinished implementation checkpoint, not an M2 closure claim.

## Files owned by this task

- `packages/engine/src/us-amateur-return-career.ts` — new standalone return root, native independent/service workers, E68 start receipts, root revision checks, domestic draft preparation/result/signing and KBO activation.
- `packages/engine/src/us-growth.ts` — `settleUsMilitaryReturnWorldGrowth`: native NPC growth after protagonist service growth was already finalized; avoids a second protagonist growth/aging pass.
- `packages/engine/src/kbo-career-entry.ts` — only added optional `KboCareer.usAmateurReturnHistory`; other concurrent changes belong to the retry agent.
- `packages/engine/test/us-amateur-return-career.test.ts` — unfinished native two-season test using a controlled six-year US baseline. Baseline fixture matchup rows are explicitly certified because existing fixture lacks valid matchup contributions.

`us-amateur-return.ts` and public index were not changed. No Git action, full gate, or global documentation edits were performed.

## New public APIs (not yet exported from index)

From `us-amateur-return-career.ts`:

- `UsAmateurReturnCareer`
- `assertUsAmateurReturnCareer`
- `requestUsAmateurReturn`
- `startUsAmateurReturnYear`
- `advanceUsAmateurReturn`
- `settleUsAmateurReturnYear`
- `prepareUsAmateurReturnDraft`
- `resolveUsAmateurReturnDraft`
- `decideUsAmateurReturnDraft`
- `startSignedUsAmateurReturnKboCareer`
- `cancelUsAmateurReturnAfterUsSigning`
- `usAmateurReturnCareerView`

From `us-growth.ts`: `settleUsMilitaryReturnWorldGrowth`.

## Current design

The return root retains the original complete US root as `source`. Current native preparation or US service owner results travel separately. Independent preparation registers nine existing US Rookie affiliate populations, carries their actual identities/abilities/books, and runs the existing real 48-game schedule. Only registered population is projected into the independent world; the complete original US world remains archived. Mandatory preparation periods consume no optional retry budget. Service uses TERMINATE, native US service-season start and bounded shared-date workers; calendar completion is required before the existing service-year growth helper and native NPC growth settle. Two years then create a real KBO draft program and its real signing reservation. The new KBO activation carries records, health, current repertoire, actual player, military status, retry budget, and the complete return archive.

These paths have compiled but are not validated end to end.

## Verification evidence

- `npx tsc -p packages/engine/tsconfig.json --noEmit`: PASS at final stopped checkpoint (exit 0).
- First focused native test: FAIL after ~19 seconds with `BATTING_SPLIT_MISMATCH` from the existing controlled US source fixture. The local test fixture was then repaired to provide opponent matchup rows and update archived date evidence.
- Subsequent native two-season run did not finish before the explicit stop instruction. Session 52276 was interrupted while old deep-root cloning was still loaded. Root commands were changed to immutable shallow root copies to avoid repeatedly cloning the entire archived six-year US history; draft updates allocate new draft objects.
- Final focused native run session 89768 was interrupted with Ctrl+C on explicit stop instruction, exit 1, no test completion output. No two-season, service-full-year, signing, activation, cancellation, or JSON end-to-end PASS is claimed.
- Test-wide typecheck had unrelated concurrent `college-review-notice.test.ts` readonly errors and a local controlled pitching-total type error. The local pitching-total fields were fixed; test-wide typecheck was not rerun after that repair.
- No lint/full test suite/full build/full verification gate.

## Known unfinished work / risks

1. Direct-US release is not a native available source: `UsCareer` reader rejects TERMINATED contracts outside military history. Existing `openUsAmateurReturn` only admits a fully closed expired direct minor contract. Real released source ownership still needs implementation.
2. Existing `us-minor-market.ts` requires `kboTransfer.origin`; direct-amateur professional re-signing is not implemented. Returning from independent years additionally needs an explicit US continuation contract/world epoch. Do not restore the old US world or invent a renewal.
3. `cancelUsAmateurReturnAfterUsSigning` only consumes an actual native accepted military return offer. It validates original activation identity, live contract, records prefix, dates and actual expiry. Since this return root starts TERMINATE, that adapter does not provide a reachable direct-US re-signing path. It is incomplete and untested.
4. The independent two-season test is unfinished and runtime-heavy because it preserves approximately six full US seasons of controlled records. Add a reusable non-test scenario helper and command log only after acceptance paths are proven; none exists yet.
5. Root validation should be strengthened to replay/cross-check every completed preparation/service archive against the return ledger, verify source player/contract and live owner projections, and reject forged or duplicated completion receipts. Current structural validation alone is not sufficient closure proof.
6. Native service-year completion, service growth, NPC growth, calendar gaps, JSON replay, mandatory budget preservation, historical health/book carry, draft age policy and KBO activation all require focused tests.
7. Service root `retry` metadata currently remains at source season during the service years; align its season/age at native completion before exposing retry routes after draft failure.
8. Domestic draft failure does not yet open a new `AMATEUR_RETURN_UNDRAFTED` episode or connect the optional retry root. Coordinate with retry owner.
9. The proposed KBO activation directly consumes actual signing receipts and roster reservations, preserving return history through an explicit field, rather than synthesizing an amateur completion. Existing KBO/native preseason compatibility needs verification.
10. No API, M3, public export wiring, generated catalogue, or distribution integration was added.

Resume from the saved files. Do not claim completed M2 based on this checkpoint.

## Exact resume commands

From `E:\AI\Game\baseball_career`:

```powershell
npx tsc -p packages/engine/tsconfig.json --noEmit
npx tsx --test packages/engine/test/us-amateur-return-career.test.ts
```

The focused test has no P10 export/scenario helper yet. Do not label its controlled US baseline as native US season proof.
