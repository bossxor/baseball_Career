# M2 bulk — E61 demotion and rights navigation

2026-10-28. Implementation pending final bulk execution; this file is not passing runtime evidence. User requested batching remaining M2 work before one final full check. No tests, full check, commit/push, main/M6 merge or V copy were run for this slice.

## Owned changes and contract

- `packages/engine/src/us-levels.ts`: adds `resolveUsLevelEventResult(c, revision, {eventKey,eventVersion,command})`, returning `{career, navigation}`. E61 `OPEN_RIGHTS` returns the existing S08 navigation and the identical source career; its blocking event stays open. Domain results return the committed career and `navigation:null`.
- Existing `resolveUsLevelEvent(...):UsCareer` delegates to the same validated handler. Existing promotion/callup/demotion callers retain their return type; navigation through this legacy API retains `US_RIGHTS_VIEW_ONLY`. Integrator must export the new result API from engine index and use it for navigation-aware callers; index was outside this worker's ownership.
- The handler recomputes the offered review and originating event, and checks the pending-game/day resume boundary before either navigation or domain execution. Rebound event player/club/definition/resume/choices cannot dispatch a different action using an otherwise valid review.
- Recomputed event source revision uses the saved trigger revision: `advanceUsCareer` publishes its revision after preparing the event, while direct controlled review calls do not. A regression covers the worker-published revision shape for navigation and actual demotion.
- Existing E61 domain writer performs the roster swap and resumes progress. Existing 24-current-level-team-game reviews, two consecutive low reviews, seven-day spacing, compatible healthy slot, protected roster and option consent rules are reused without changing numbers. MLB demotion retains its major contract, salary basis, income and protected status.
- `packages/engine/test/us-levels-windows.test.ts`: adds four regressions for AAA→AA success after two actual review calls; unchanged S08 navigation; stale/tampered evidence refusal; and actual MLB→AAA domain call after exhausted-option STAY consent, with the FA/no-consent refusals preserved.

## Static evidence

Targeted ESLint passed for both owned TypeScript files. `tsc -p tsconfig.tests.json --noEmit` was run once as a short static check: it reported only three TS2542 readonly assignments in another worker's `kbo-us-activation.test.ts:191`, which was not edited here. The parent was informed. This is not a passing global typecheck claim.

## Final bulk queue

1. Export `resolveUsLevelEventResult` from `packages/engine/src/index.ts` and wire any navigation-aware transport/caller if this batch adds one. Existing career-only callers need no migration.
2. After all source/fixture edits finish, run the focused pending command: `node --import tsx --test packages/engine/test/us-levels-windows.test.ts`.
3. Run the parent-owned final `npm run check` once and HTTP smoke with the frozen complete batch. Include existing callup/debut/major-renewal and KBO-transfer tests to verify stricter event binding preserves their saved contexts.
4. Inspect E61 navigation's unchanged career/revision/event/registration/money assertions and domain replay/JSON assertions. Include exhausted options without consent, FA consent, STAY consent, and malformed source review/event/resume.

The new fixtures contain controlled team-game/performance rows and invoke actual review/domain APIs; they are not native 48-game simulations. No new API/HTTP/UI route, FA contract resolution, injury-rehab assignment, domestic return or full-season simulation was added. Pending runtime results must be recorded before claiming completion.
