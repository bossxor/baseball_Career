# US national tournament owner — source implementation, execution pending

`us-national.ts` connects the latest same-world/year/seed KBO root and verified Korean-school-origin US protagonist to the existing national selection and real game engine. It does not construct a KBO career around the US player, infer US NPC nationality, generate candidate players, change strengths, or reroll the sealed draw/selection. `national-tournament.ts` accepts the smaller structural team context; `national-progress.ts` exposes its pure Korea progress/outcome projections.

## Commands and dates

`openUsNationalSelection` requires the current source revisions and a date within the existing invitation window. E44 acceptance/decline uses that authoritative date; unanswered invitations stop the domestic date owner at the response deadline. `startUsNationalTournament` requires an answered selection, no domestic pending game, matching source clocks, and no domestic fixture inside the tournament. WBC resumes preseason; OLY/AG reserve the live regular gap; P12 requires actual completed KBO/MLB postseason dates and the existing postponed window evidence.

`prepareUsNationalMatch` and `advanceUsNationalMatch` use actual selected player abilities/books, bracket games, persisted pending state, engine pitch development and official contributions. Replacements use the existing reserve/emergency rules only at the first Korea game or a stage boundary, preserving sealed initial scores and completed games. All nations finish before the result seals. An actual first appearance creates E46/A04; registration without an appearance does not qualify for the AG/OLY benefit. E47 reviews the already evidenced eligibility; E48 requires the atomic host handoff rather than a receipt-only ACK.

Every date closes once after all games on that date. All US and host players receive the existing appearance/rest fatigue operation once; injury recovery ticks only for their registered Korea game, with separate health RNG owners. Regular US dates append the existing closed-day shape and call the existing cumulative USD salary/agent-fee writer. Preseason/postseason dates create no regular salary. Annual natural growth retains the existing growth calendar/budget; actual international pitch XP is committed from the game engine without a new multiplier or medal growth bonus.

## Atomic return and explicit ownership

The host is pinned by its complete source fingerprint and expected revision until return. It must not run a second domestic/date writer during the session. `returnUsNationalTournament` returns both replacement roots plus both expected source revisions; persistence must compare and swap both together. Revision equality alone does not prove a caller loaded the latest persisted root.

The returned KBO root contains its actual player/repertoire/health changes, all shared completed international contributions, complete draw/selection/day evidence, and regular-gap dates. Its existing service/personal/NPC payroll hooks retain the original registration/144-game rules; international appearances do not fabricate domestic salary registration. Existing source contracts, records, seed and already closed dates are preserved. Serving member books remain with their existing member owner.

`NationalLedger.hostReturns` is the ownership receipt: KBO/US identity sets, external US health evidence, shared game keys, settled fatigue dates and changed KBO pitch-book keys. The host never acquires US player identities, injuries or health RNG. `national-day-audit.ts` verifies that the split health owners collectively cover the precise registered Korea roster and actual appearances. The host's personal result and any eligibility come from **its own** protagonist's records. It remains in its own INTERNATIONAL_REVIEW with the ordinary E47/E48 review; the US root returns to its original phase and the shared end date.

The nonrecursive `assertUsNationalState` checks source/session ownership, books, old projected record conflicts, exact daily record/health evidence, sealed actual results and active phase/day linkage. It is suitable for the root reader guard and JSON-restored pending state. Return replays and stale/changed host sources are rejected.

`confirmUsAthleteService` admits an eligible offseason player to the existing three-full-season duty rule. `advanceUsAthleteDutySeason` consumes a finalized year once, rejects missing/gapped finalization, starts next season, and marks completion after the third season. The annual growth owner must invoke this before carrying the ledger into the next year. E55 notices use the existing event definition and national resolver.

## Authored checks and remaining boundaries

`test/us-national.test.ts` authors real signing-root invitation/deadline/decline, actual pending JSON replay, full native WBC games and two-root handoff/health/XP/CAS/host-result checks. Its complete host identity rename is fixture isolation for the two independent protagonists, not a production transfer policy. A separate explicitly controlled legacy-medal/final-growth fixture checks duty counting; it does not prove three native seasons. Existing candidate adapter checks remain separate.

**Focused runtime PASS (2026-10-29):** `npx tsx --test packages/engine/test/us-national.test.ts` → 4/4 pass, fail 0, duration_ms 61838.6688. Evidence: `evidence/M2-US-NATIONAL-focused.log`. Engine `tsc --noEmit` clean. Fixture notes: same world/seed/year KBO+US roots; prior-year MLB BF sample with pitcherSplits; pending resume compared via `canonicalJson` (null-prototype vs JSON plain object). Full `npm run check` / Neon / browser / APK not run — parent bulk gate. College AG owner runtime, DB CAS dual-root persist (M3), and full screens remain separate.
