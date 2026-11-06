# Career state size — seal conversion (P05)

Date 2026-11-07, branch `claude/tf-lead`. Pattern: store `canonicalSeal(x)` (71 bytes), compare with `matchesCanonicalSeal(stored, canonicalSeal(expected))`, which also accepts old saves that stored the raw canonical JSON.

## Converted seals (bytes per stored value, controlled fixtures)

| Seal (stored field) | File | Before | After | Legacy raw seal accepted | Test |
| --- | --- | ---: | ---: | --- | --- |
| `collegeCup.regularBasis` | college-cup.ts | 100,616 | 71 | yes | state-size-seals |
| `collegeService.sourceEvidence` | college-service.ts | 583,609 | 71 | yes | state-size-seals |
| `collegeService.sourceRecordsBasis` | college-service.ts | 70,478 | 71 | yes | state-size-seals |
| `collegeService.yearEvidence[i]` (one per leave year) | college-service.ts | 583,717 | 71 | yes | state-size-seals |
| `remainderRenewal.sourceBasis` | kbo-remainder-renewal.ts | 225,887 | 71 | yes | state-size-seals |
| `remainderRenewal.comparison.sourceBasis` | kbo-remainder-renewal.ts | 1,328,990 | 71 | yes (comparison compared as sourceBasis seal + equality of the other fields) | state-size-seals |
| `amateurRetirement.sourceBasis` | amateur-retirement.ts | 748,736 | 71 | yes | state-size-seals |
| `collegeNational` session `schoolBasis`, `schoolHealthBasis` | college-national.ts | not measured (needs a national fixture) | 71 | same pattern, no dedicated legacy test | existing college-national tests pass |
| `retryExit.sourceBasis` | career-retry-exhaustion.ts | not measured | 71 | same pattern, no dedicated legacy test | existing retry tests |
| `preparation quote.basis` | career-pro-retry.ts | not measured | 71 | same pattern, no dedicated legacy test | existing retry tests |

Fixture worlds are smaller than real native runs (real: `collegeEarlyRoute` 54 MB after year 2 before the earlier fix), so real savings are larger.

Left alone on purpose: comparison-only `canonicalJson` uses (`same()`, `before===after` checks) and `career-agent` `previewId`/`offerSetKey` (small keys, part of public ids).

## Next largest cause (not fixed)

Controlled fixture, `enrolledCollegeCareer` + `completedCollegeAcademicYear` + `closeCollegeSeasonForNextYear`/`startNextCollegeSeason`, JSON bytes after each completed academic year.

| Year | Total | `previousSeasons` | `health` | `records` | `world` | `days` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2.48 MB | 0.67 MB | 0.90 MB | 0.28 MB | 0.32 MB | 0.28 MB |
| 2 | 4.79 MB | 2.21 MB | 1.48 MB | 0.47 MB | 0.32 MB | 0.27 MB |
| 3 | 7.69 MB | 4.32 MB | 2.12 MB | 0.65 MB | 0.31 MB | 0.25 MB |
| 4 | 11.37 MB | 7.04 MB | 2.81 MB | 0.86 MB | 0.33 MB | 0.29 MB |

Top 10 fields at year 4: previousSeasons 7,035,008; health 2,811,665 (all in `health.games`); records 857,337; world 330,302; days 285,829; ownAssessment 17,145; events 4,539; repertoireEvents 4,272; goals 4,063; routeNotices 4,027.

Cause: every `previousSeasons[i]` archives the whole `health` ledger as it stood at that year (`health.games` is cumulative), plus `world` and `days`. Archived `health` per entry: 0.36, 0.90, 1.49, 2.12 MB, i.e. about 4.9 MB of the 7.0 MB, so growth is quadratic in years. `world` (0.2–0.33 MB) and `days` (0.1–0.29 MB) are copied once per year as well.

Suggested next step (design decision, not done here): archive only the closed season's health rows (or a seal plus the season's own rows) instead of the cumulative ledger; keep one `health.games` for the live ledger.

## Verification

- `npm run typecheck --workspace @playball/engine`: pass.
- `npx eslint packages/engine`: pass (after removing the temporary measuring script).
- Targeted tests: college-service, college-national, college-cup, amateur-retirement, kbo-remainder-* , canonical-seal: 37/37 pass; new `state-size-seals.test.ts` 4/4 pass.
- Wider run (retry, national, route, us-return-retry): 43/45 in one combined run; the two us-return-retry failures (~130 ms, fixture contention) both pass when run alone (~175 s each).
- No committed golden evidence JSON depends on these seals; the KBO entry command hashes were already updated in 00cf5db.
