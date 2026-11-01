# M2 retry WIP handoff — 2026-11-02

Stopped immediately on user instruction to save/handoff/commit/push. No Git operations performed by this owner.

## Changed files

- `packages/engine/src/career-pro-retry.ts` — NEW KBO root retry bridge, owned empty-market E34, native independent preparation, market quotes, acceptance, E35 exhaustion/explicit retirement.
- `packages/engine/src/retry-kbo-world.ts` — NEW contractless-world staging via existing AI renewals/FA, rookie supply and roster repair.
- `packages/engine/src/career-retry-exhaustion.ts` — NEW amateur E35 pending/archive commands.
- `packages/engine/src/kbo-career-entry.ts` — optional `retryPro?: KboRetryPro`.
- `packages/engine/src/high-school-career.ts` — optional `retryExit?: AmateurRetryExit`; `ARCHIVED` school phase.
- `packages/engine/src/kbo-career-fa.ts` — exported existing quote reducer as `quoteKboCareerMarket`; existing FA owner calls renamed reducer.
- `packages/engine/src/kbo-roster-repair.ts` — optional protagonistKey permits contractless AI staging; supplied keys retain existence guard.
- `packages/engine/src/retry-career.ts` — military-plan route now prevents premature RETIRE_DECISION in result acknowledgement.
- `packages/engine/test/career-retry-completion.test.ts` — NEW focused WIP tests; one passing, one failing assertion.
- `packages/engine/test/retry-completion-scenario.ts` — NEW unrun P16 scenario/helper; controlled historical prior2 budget, native last48, explicit E35 confirmation. Stores full command outputs; memory cost not checked.

No index/API/UI wiring changed. No E70/US-return source files changed.

## Public functions

`career-pro-retry.ts`: `openKboUncontractedRetry`, `reviewKboUncontractedRoutes`, `kboRetryRoutesView`, `startKboRetryPreparation`, `confirmKboRetryPreseason`, `advanceKboRetryPreparation`, `trainKboRetryPreparation`, `settleKboRetryPreparation`, `kboRetryPreparationView`, `acceptKboRetryOffer`, `openKboRetryExhaustion`, `confirmKboRetryExhaustion`.

`career-retry-exhaustion.ts`: `openAmateurRetryExhaustion`, `confirmAmateurRetryExhaustion`.

`retry-kbo-world.ts`: `advanceRetryKboWorld` (internal staging helper).

`retry-completion-scenario.ts`: `retryNoOfferPrefix`, `runRetryExhaustionScenario` (unrun).

## Verified evidence

- Red-before-code: focused test failed missing `career-pro-retry.js`.
- `npx tsc -p packages/engine/tsconfig.json --noEmit` passed after pro/amateur E35 source addition. Subsequent source edit only filters pending own E35 from amateur route query; not rerun after freeze. New scenario helper also uncompiled/unrun.
- `node --import tsx --test packages/engine/test/career-retry-completion.test.ts`: 1 pass / 1 fail, ~69 seconds. Empty genuine KBO market opens E34, stale CAS/route preview rejected, ever-pro college/draft excluded, preparation entry preserves root/military/records.
- Second test completed actual native independent48 and settlement, charged lifetime once, reported PRO_MARKET_REVIEW; then failed `assert.ok(view.offers.length)`. Actual offers=0 under deliberately saturated club-budget prefix. Acceptance assertions after that line did not run. This failure needs a separate legal positive-offer fixture; no guaranteed offer should be added to satisfy it.
- No focused E35 execution yet. No JSON/CAS acceptance/retirement proof beyond entry and initial native competition replay.
- No broad check, Git, commit, push, API tests or browser tests.

## Unfinished / review risks

1. Complete native E35 pro/amateur tests, actual last optional3 evidence, valid positive-offer acceptance fixture, playable return checks. Existing focused test remains red.
2. Wire exports, API/domain callers, UI and archive readers only after source review. Current root commands can still be called outside retry bridge; parent guards must block incompatible old KBO commands during active retry.
3. Pro gate currently supports genuine KBO expired empty `assertKboOffseasonExit`, not separate release or US-origin exit receipts. Does not accept mere declined available offer.
4. US-origin offers/return-right authority not integrated. Pro retry authority currently projects no US offers; verify all real legal US/mandatory routes before E35. Do not claim complete cross-league route authority.
5. Amateur authority checks current school route colleges, owned US visibility, enrolled resume, actual domestic result and completed military metadata. Review stale/current assessment identity and military completion provenance.
6. Background KBO years use native offseason owners but do not simulate official pro games/NPC annual growth or fully advance suspended military worlds. Existing military/national commitments need comprehensive preservation review before calling full-world progression complete.
7. Review health merge on activation: independent protagonist health is retained; staged market-world NPC health not separately carried into retryPro. Also reset trait/alias/goal/current-season metadata and prior pro archive integration before asserting normal next-season playability.
8. Market snapshots and original roots remain private. Query view is allowlisted; audit all persistence/query boundary use and quote revalidation against live authority.
9. Native test output was observed through exec session9836, now completed/closed. No known running sessions or helper PIDs.

Task is WIP, not M2 complete. Parent owns final save/commit/push and honest scope report.
