# M2 bulk: goal event outbox bridge

2026-10-28. Implementation and test cases added; runtime tests and the final full gate are PENDING. This is not an M2 completion claim.

## Existing behavior preserved

`season-goals.ts` owns goal selection, scoped official progress, cosmetic reward receipts, corrections and E90 outbox generation. Existing progress/year/retirement callers keep `refreshCareerSeasonGoals`, including its no-goals identity behavior. Goal notices stay outside the blocking career event queue. E89 never chooses goals automatically; selection remains optional and limited to three, and rewards remain cosmetic.

## Added boundaries

- `refreshCareerPreseasonGoalSelection(c)` is an internal server boundary for a caller's already committed preseason entry. It creates one optional E89 using the current committed revision, without adding another revision. Non-preseason roots, roots with current regular records, already selected seasons, existing E89 cards (including acknowledged cards), and unavailable active-service players retain identity. Entry commands call this helper after their own revision increment.
- `openCareerSeasonGoalSelection(c, revision)` remains the direct public CAS command. It requires preseason with no current regular records and adds one revision only when it creates the card. Both openers reuse the same private event builder.
- `resolveCareerGoalEvent(c, revision, {eventKey, eventVersion, command, goalIds?})` resolves goal-owned notices only. E89 `SET_GOALS` calls `setCareerSeasonGoals` and closes the event with a domain receipt in the same returned revision. ACK skips without selecting any goals. E90 `OPEN_ACHIEVEMENTS` returns S40 navigation and resolves the existing notice without another cosmetic grant.
- Resolution validates career revision, event version, player/world/season binding, current preseason registration for E89, and actual goal completion plus reward source for E90. Historical E90 notices use their own season context. JSON round trips retain source and event identity.

## Production integration

Automatic entry wiring calls the preseason helper after high-school E01 focus resolution, college enrollment and year continuation, KBO signed entry and year continuation, and US signed entry and minor/major year continuation. These calls preserve each entry command's existing revision count. The helper alone is not the automatic trigger: production callers must remain wired to it.

Export the public opener and resolver from the existing `season-goals.js` export in `packages/engine/src/index.ts`. The internal helper need not become part of the package's public API. Outbox choices go to `resolveCareerGoalEvent`; callers commit its `career` and use `navigation` for E90. `careerSeasonGoalsView(c).notices` supplies eventKey, definitionId, version, status, commands, goalId and stage.

## Fixture impact and verification

Real preseason fixtures now contain an E89 before any E90 completion notices. E90 tests find notices by definitionId/eventKey and count E90 separately. US next-year and KBO entry tests compare retained seasons/rewards and the old notice prefix, then verify the appended E89. The E89 direct-command test removes the automatically created ledger first, so it still verifies the public opener's revision increment. No shared fixture was changed to hide the new card. Repository search found goal-notice index/count assumptions only in `season-goals.test.ts`.

Added tests cover native US/KBO/college automatic entry, the existing native school focus path, committed source revision, idempotence, no automatic selection, no blocking E89 queue, regular-season continuation without choosing, active-service/current-record exclusions, direct CAS revision, max-three existing selection behavior, ACK, stale/duplicate resolution, JSON replay, E90 navigation, unchanged rewards/world, and changed completion source rejection.

- Runtime tests: PENDING; not run during this bulk edit.
- Type checks: PENDING for the final integrated source; parent owns the gate.
- Full check: PENDING; parent owns it after bulk integration.

No UI/API transport, new goal/economy rules or general event dispatcher was added. Native long-season tests remain authored evidence until the parent runs them.
