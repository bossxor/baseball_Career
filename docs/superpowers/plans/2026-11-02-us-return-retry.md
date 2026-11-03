# 2026-11-03 implementation checkpoint

The gateway, explicit returned-US rights, native preparation, KBO/US activation, E35 owner and package/API dispatch were implemented through `d76f99d`. The checkboxes below retain the original acceptance checklist; they are not an up-to-date completion ledger. Read `docs/implementation/M2-US-RETURN-RETRY-20261103.md` and `M2-RESUME-VALIDATION-20261103.md` for actual focused/runtime evidence. The resumed native three-optional-season E35/JSON archive run passed1/1 (exit0); the frozen whole gate is running. Real large-save HTTP/PostgreSQL acceptance remains unproven after PGlite reproduced an out-of-memory UPDATE; an explicit isolated PostgreSQL test target is required. Whole-M2 completion is not claimed.

# Returned-US optional retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use superpowers:requesting-code-review before the final gate. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect an actually undrafted returned-US player to optional independent preparation, fresh lawful contracts and explicit E35 retirement without losing the mandatory return or original US career evidence.

**Architecture:** Add one returned-US retry owner that retains the completed `UsAmateurReturnCareer` as an immutable origin. Reuse `RetryCareerLedger`, `PreparationSeason`, native draft/contract writers and the existing US continuity epoch; do not forge a school root or reopen the two mandatory years. Extract only shared production writers needed by both original return and optional-retry activation.

**Tech Stack:** Existing TypeScript, node:test/tsx, workspace API command pipeline; no dependency additions.

**Spec:** `docs/design/13-MLB-CAREER.md`, `21-MILITARY-CONTRACT-RETURN.md`, `23-US-CONTRACTS-RIGHTS.md`, `34-ARCHETYPES-COLLEGE-ODDS.md`, `66-RETRY-CAREER-OPPORTUNITIES.md`, `14-CANONICAL-DECISIONS.md`; existing whole-M2 plan `2026-10-28-m2-complete.md`. This document is a plan, not implementation or execution evidence.

## Global Constraints

- Work/Git/build: `E:/AI/Game/baseball_career`, branch `codex/m2-career-engine`. Fetch and compare before implementation. Preserve unrelated DD evidence and `.superpowers`; no forced push, main/M6 merge, PC shutdown or unrelated cleanup.
- Existing user delegation authorizes routine recommended implementation choices. Do not ask the same policy questions again.
- Optional preparation lifetime maximum3, charge1 only at actual complete48-team-game season settlement. Mandatory return2 seasons and18-month service consume0. Repeated completion adds0.
- Preserve ever-US-pro history. New college entry and college-resume routes stay unavailable. The returned-US domestic draft is an explicit exception derived from23's actual completed return evidence, not a general weakening of66's ever-pro rule.
- Domestic returned-US draft evaluation maximum age35; maximum career age45. Do not expose a preparation season when its next evaluation would already be ineligible and it has no other real evaluation route.
- No guaranteed offer, minimum guaranteed re-employment, manufactured budget, new salary formula, new contract term, or silent military exemption. Reuse approved minor1-year/$30,000/current-level and existing slot/budget rules.
- Retain original US/mandatory/optional records, identity, growth, health, repertoire, relationships, training/style usage, currencies and receipts. Output root revision is input revision+1 on ownership handoff.
- Engine-owned authority only. HTTP callers provide CAS, event version and owned IDs; never eligibility flags, substitute player snapshots, budgets or prepared worlds.
- Focused RED→GREEN per task; one frozen whole check for the finished bundle. Commit only selected reviewed files and logs; push and verify remote hash under existing authorization.

## Review Focus

- An old or forged undrafted receipt must not open another episode or reset lifetime use; test this in Task1.
- US-pro history must continue blocking college while only the actual completed returned-US exception permits a domestic draft; test ordinary pro plus forged exception in Task1.
- A surviving US option must prevent E35, and accepting it after optional preparation must use the latest optional player/year rather than the mandatory ending player; test this in Task4.
- Actual service-world NPC growth/books/RNG/supply must remain authoritative; an offscreen independent background must not overwrite it or masquerade as native official US seasons; test this in Tasks2/4.
- Stale command/event/quote IDs, partial seasons and JSON resumes must preserve records/money/use counts atomically; pin these in Tasks2/3/5.

## File boundaries and interfaces

Create `packages/engine/src/us-return-retry.ts` for this owner and its engine commands. Add focused tests in `packages/engine/test/us-return-retry.test.ts` and a labelled test helper `us-return-retry-fixture.ts` only if shared setup needs it. Keep independent game simulation in `preparation-season.ts`.

Add optional history types to `kbo-career-entry.ts` and `us-career-entry.ts` for the new immutable retry archive; preserve existing `usAmateurReturnHistory`. Modify `us-amateur-return-career.ts` only to reuse internal actual activation writers and terminal evidence, not to append optional years to its mandatory ledger. Shared internal activation code may live in `us-return-activation.ts`; it is not a new public option/strategy API.

Extend the existing `RetryRouteAuthority` with an optional returned-US draft proof reference, not a caller boolean. The reference contains `returnId`, `sourceContractKey`, `initialUndraftedReceipt` and `draftMaximumAge:35`. Its gateway validates the full origin, identity, military completion, no domestic signing and the actual matching `AMATEUR_RETURN_UNDRAFTED` episode. Generic routing additionally requires that episode/reference match and the current evaluation age be eligible. Without this reference, existing `hasProContractHistory` draft exclusion remains unchanged.

The new root stores `version:1`, `revision`, `origin:UsAmateurReturnCareer`, `retry:RetryCareerLedger`, `status:'REVIEW'|'PREPARING'|'RETIRE_CONFIRM'|'ARCHIVED'`, optional current `preparation:PreparationSeason`, completed optional seasons, current/previous native draft assessments, owned US opportunity evidence and event/retirement receipts. It never changes `origin.return.years` or pretends to be `HighSchoolCareer`/`KboCareer` before an actual contract activation.

All commands below consume the root's own `revision`. Views return explicit allowlisted fields. Names in this plan are the implementation contract; avoid adding parallel synonyms.

### Task1: Genuine gateway and explicit returned-US draft authority

**Files:** Create `us-return-retry.ts`, `us-return-retry.test.ts`; modify `retry-career.ts`, `preparation-season.ts`; add a short clarification to14/66 that23's proven returned-US route is the sole exception.

**Produces:** `openUsAmateurReturnRetry(origin:UsAmateurReturnCareer,revision:number):UsAmateurReturnRetryCareer`, `assertUsAmateurReturnRetryCareer(c):void`, `usAmateurReturnRetryRoutesView(c)` and exported root type.

- [ ] Write gateway/authority tests first: actual `DRAFT_READY` return plus a native `round:null` result opens once; signed, unresolved, forged result/episode/identity and uncompleted return reject without mutation. Existing used2 remains2, mandatory periods remain uncharged.
- [ ] Add ordinary ever-pro authority and forged returned-US reference tests. Assert no college-entry/resume route in every US-pro case; only validated returned-US proof has `rights.draftEligible:true`. Ordinary KBO/US pro remains false even if an unrelated episode or flag is supplied.
- [ ] Run the new focused tests and record their failing assertions before production edits.
- [ ] Implement the gateway. Validate the existing full origin and native draft, then retain an immutable clone and reuse `origin.retry` including its existing actual `AMATEUR_RETURN_UNDRAFTED` episode. Do not create another episode for a mere page load.
- [ ] Add the narrow reference validation to generic retry draft visibility and `preparationSeasonView`; retain the generic ever-pro exclusion unless the complete exception matches. Set `hasProContractHistory:true`, `mandatoryReturnActive:false`, and actual completed/not-applicable military status at this gateway.
- [ ] Re-run `us-return-retry.test.ts`, `retry-career-ledgers.test.ts` and existing `career-retry-completion.test.ts`; record exact outputs and commit this domain slice.

### Task2: Actual optional preparation after either mandatory owner

**Files:** `us-return-retry.ts`, `us-amateur-return-career.ts` only for extracting the existing private independent-world construction; new tests/helper.

**Produces:** `startUsAmateurReturnRetryPreparation(c,revision,{routePreviewId})`, `confirmUsAmateurReturnRetryPreseason(c,revision)`, `advanceUsAmateurReturnRetryPreparation(c,revision,mode)`, `trainUsAmateurReturnRetryPreparation(c,revision,choice)`, `settleUsAmateurReturnRetryPreparation(c,revision,forfeitUnusedTraining=false)`, `usAmateurReturnRetryPreparationView(c)`.

- [ ] Write RED tests for both completed independent and completed-service origins. Reject active mandatory years, an available accepted contract, stale preview, a pending game and a duplicate world season. Next world/age must advance exactly1 from the current owner; using the original US age/player must fail preservation assertions.
- [ ] Reuse the most recent real independent population. For service-origin first optional preparation, use existing current service-world identities/players/books to construct the existing9-team/48-game independent format; do not generate a new skill population or restore older US NPC abilities. Keep the full original world in the archive.
- [ ] Start `PreparationSeason` without `mandatoryReturn`. Reuse its confirm/advance/train/complete functions; publish its exact retry/records/health/development/traits/relationships/style fields as one root result. Keep mandatory and optional completed-season arrays separate.
- [ ] Run one actual complete independent216-game league/own48 sequence for the final optional use. Assert used2→3 only on settlement, repeated settlement remains3, early settlement fails, JSON/replay produces equal canonical output, and original source/mandatory receipt hashes remain unchanged.
- [ ] Test training/style/health and own repertoire carryover. Existing strengthening use and training for a prior season must not be recreated. Preserve public view allowlisting.
- [ ] Run focused preparation regressions and commit. Label any controlled prior2 optional uses and controlled service contribution rows explicitly; they are not native earlier seasons.

### Task3: Fresh domestic assessment and actual signed KBO activation

**Files:** `us-return-retry.ts`, `us-amateur-return-career.ts`, optional internal `us-return-activation.ts`, `kbo-career-entry.ts`, focused tests.

**Produces:** `prepareUsAmateurReturnRetryDraft(c,revision,preferredClubId=null)`, `resolveUsAmateurReturnRetryDraft(c,revision,programVersion)`, `decideUsAmateurReturnRetryDraft(c,revision,programVersion,decision)`, `startSignedUsAmateurReturnRetryKboCareer(c,revision):KboCareer`.

- [ ] Write RED for a fresh native assessment using the latest completed optional player's actual abilities and `PreparationSeason.result.baseScore`. Assessment year is preparation year+1. Reuse of the initial return reservation or stale player must reject; same-year query/JSON does not redraw.
- [ ] Reuse `prepareKboDraft`/`resolveKboDraft`/`decideKboDraft`; derive assessmentKey from immutable origin returnId, actual optional completion receipt and current assessment year. Archive previous assessments; create no automatic signing or guaranteed selection.
- [ ] Distinguish current domestic states: unassessed, pending draw, real zero-slot/undrafted result, available unsigned offer, explicit decline, signed. Only actual terminal no-contract evidence permits another optional start; unassessed/pending cannot be treated as zero offers for E35.
- [ ] Extract the existing actual returned-amateur KBO activation writer shared with the original mandatory path. Its validated callers supply the real draft/signing, latest settled owner, retry ledger, original US archive and input revision. It reserves salary/rights/roster once, ages into signing year once and merges complete source+current records without replacing newer rows.
- [ ] Test first actual KBO date after native draft/signing/preseason/opening/schedule activation. Assert original USD income/history, optional records, health, books, latest player and lifetime used remain exact; preserve original return and new retry archives. Stale signing/CAS/JSON failure is atomic.
- [ ] Run original return and KBO activation regressions and commit. A newly generated draft-world fixture is not proof of native background KBO seasons; state that boundary in evidence.

### Task4: Surviving US opportunity and latest optional-year re-sign

**Files:** `us-return-retry.ts`, `us-amateur-return-career.ts`, `us-minor-market.ts` only as needed to extract existing pure quote/acceptance logic, optional shared activation module, `us-career-entry.ts`, focused tests.

**Produces:** `resignUsAfterAmateurReturnRetry(c,revision,{routePreviewId,offerKey}):UsCareer`; owned US opportunity states in routes view.

- [ ] Write RED: a valid source US return-option offer blocks E35 even with optionalUsed3 and a real domestic no-offer result. Its explicit acceptance uses the latest optional endingPlayer/books/health/development/records and enters optional season+1; using `origin.return.years.at(-1)` must fail assertions.
- [ ] Model US opportunities as `UNASSESSED`, `AVAILABLE`, `NO_OFFER`, `EXPIRED` or `DECLINED`, with owned quote/option receipt and actual validity scope. Absence of `origin.source.minorMarket` means unassessed, not proven no offers. A source offer without the required surviving return clause is not automatically valid years later.
- [ ] Preserve source-specific readiness: `openUsAmateurReturn` permits `MILITARY_PLAN_REQUIRED`, but ordinary `openUsMinorMarket` does not. Do not fake completed military on the immutable source to pass that gate. If no actual source quote exists, evaluate a new current-year re-entry opportunity from the validated completed return/retry owner, reusing existing budget/competition/slot rules rather than inventing an expired contract or passing readiness booleans.
- [ ] Keep actual expired/declined option disposition; do not manufacture `expiresGameDay:1` plus `worldDay:0` as expiry proof. A still-valid source-specific return clause remains a legal route until a real receipt/disposition closes it. Freeze/restore only remaining guarantees; a new offer remains explicit acceptance.
- [ ] Share the existing US activation writer at the proven ownership boundary. Retain original contract/renewal history and continuation epoch; set remaining control1 for the new1-year contract, actual holder organization, current financial year and one salary reservation. Preserve source money plus actual service zero-pay receipts.
- [ ] For an actual retained service world, continue its real NPC state/supply/RNG once. For elapsed optional years with no native US world, retain the existing explicitly documented fixed-workload background limitation; do not rerun approximation over already settled service years or claim native US games/pitch XP. New current quotes recheck legal roster/budget; no slot or budget means a real no-offer result.
- [ ] Test current-year first US date and next actual renewal across JSON, alternate holder, oldest surviving NPC/book preservation, used3 still3, unavailable/missing option rejection and no double reservation. Run original one/two-year independent and service-return regressions; commit.

### Task5: Explicit final failure, package and API integration

**Files:** `us-return-retry.ts`, `packages/engine/src/index.ts`, root history types, `apps/api/src/career-retry-shell.ts`, `career-views.ts`, `apps/api/test/m2-us-return-retry.test.ts`.

**Produces:** `openUsAmateurReturnRetryExhaustion(c,revision)`, `confirmUsAmateurReturnRetryExhaustion(c,revision,{eventKey,eventVersion,command:'CONFIRM_RETIRE'})`, `usAmateurReturnRetryRetirementView(c)`; actual package exports and API dispatch/read paths.

- [ ] Write RED for used3 plus real domestic no-contract result and proven no valid US option/offer. E35 is unavailable while US assessment is missing/pending, any genuine contract offer exists, military/mandatory work remains, or a signed root is awaiting activation. Declined offers require their real disposition receipt; never synthesize absence.
- [ ] Confirm E35 only after rechecking the exact owned basis and event version; archive records/player/source/optional histories without simulating another date. Test wrong version, stale quote, repeat confirmation and JSON preservation. Retire at the actual latest optional age/year, including pro0 domestic records.
- [ ] Export the new owner type, commands and allowlisted views. Add `CAREER_RETRY_US_RETURN_*` dispatch before generic KBO casting. Save the whole root in `state.career`; never cast it into a school/pro owner. Route existing retry screens by a validated owner discriminator.
- [ ] API tests exercise actual gateway/owned command dispatch, save JSON, CAS failure, public view with no seed/RNG/P/raw history, E35 confirmation and resulting archive. Reject externally supplied authority/player/world/budget data. Transport CAS/idempotency remains the existing M3 pipeline; do not add another persistence engine.
- [ ] Run focused engine/API checks and commit. Web visual design/full creation navigation is not claimed by API/read coverage; record any actual unconnected entry point.

### Task6: Frozen evidence and hard acceptance stop

**Files:** focused runtime evidence, `PROGRESS.md`, `NEXT-SESSION.md`, relevant workboard/whole-M2 proof inventory under `docs/implementation`; extend existing P10/P16 proof scenarios only after the new owner is stable.

- [ ] Fresh review of the whole change follows Review Focus, including current offer authority, ordinary ever-pro exclusion and source immutability. Fix important issues with RED→GREEN; record lesser deferred findings explicitly.
- [ ] Freeze engine/rules/tests/API/scripts. Run `npm run check` once, then HTTP smoke and required design regeneration/manifest checks; capture exit code and source hashes. Do not count an interrupted or partial run as a pass.
- [ ] Retain command input/output/source/result hashes and per-command JSON replay for one real optional48 completion→fresh domestic assessment→actual KBO signing/play and one actual surviving US option→current latest-year re-sign/play. Run a genuine no-routes E35 branch. Controlled prior US seasons/service rows/prior2 optional uses are disclosed individually.
- [ ] Update progress/handoff with exact completed paths, counts, failures, policy evidence and remaining M2 gaps. Commit/push selected files and verify HEAD equals remote branch hash.

**Hard acceptance stop:** This slice is complete only when all three actual exits (new KBO contract and play; valid US option/current re-sign and play; no lawful routes plus explicit E35 archive) are proven, optional48 charges once, mandatory/service charges0, original/mandatory/optional histories survive JSON, ordinary pro draft/college exclusions hold, and the frozen whole gate passes. Do not substitute generic retry ledger tests, typecheck, ACK/catalogue coverage or a partially run fixture for these exits. Missing real US opportunity assessment or use of an obsolete mandatory endingPlayer is a failed acceptance item, not an external dependency.

**Remaining limits:** Current KBO staging has no proof of background official144 games/NPC annual growth; independent return's US background retains its documented workload approximation. Full world workers, durable dual-root CAS/Neon and device/UI execution remain their actual M3/M6/M4/M8 scopes. These limits must be labelled in reports; they cannot excuse missing M2 ownership, current player/year, economic receipts or route authority. Completing this slice alone does not complete all99 events/24 paths/PF or whole M2.

## Plan self-review

This plan covers the gateway, source-specific draft exception, actual preparation budget, every contract/no-offer state, both live US/KBO activation paths, E35 and real public callers. Review Focus conditions each have owning tests. Existing primitives remain authoritative; no fake school/expired contract, generalized eligibility bypass or new dependency is proposed. Implementation and focused proof now exist; use the checkpoint above to locate unfinished acceptance rather than restarting completed tasks.
