# M2 regular pro hidden-trait notices

`pro-trait-notices.ts` adds the E84 notice adapter for KBO and US regular-season workers. Existing school `trait-notices.ts` APIs remain unchanged. Hidden T13–T16 get one notice per player/trait/world; ordinary traits do not stop progress. Historical E84 notices suppress another first notice across seasons, including resolved notices.

## Worker integration contract

`raiseProHiddenTraitNotice(career, closedDay, regularProgress)` returns the same career type or `null`. Its input phase and resume must be actual `SEASON_PROGRESS` with `pendingGame === null`, the same `nextWorldDay`, and `nextWorldDay === closedDay + 1`. The day must be the last closed KBO day ledger entry or US regular `season.days` entry and match the current trait refresh cursor/season. The writer only copies the root, event array and phase; records, world and trait ledger are shared without mutation.

Call the writer immediately after day-close trait refresh, before another event changes the phase. Also check the current closed boundary at the worker loop's beginning: after navigating to S38, a second hidden trait unlocked on the same day must stop before advancing another game. Same-season pending receipts may precede the latest closed day and source record revision. Future, foreign-season, other-player, unowned and non-pro-league receipts do not qualify. E84 uses the current top-level protagonist and actual registration club/competition, while its unlock source may be another pro level played earlier in that season.

Run `settleStarterSeasonTraits` before the final notice check and before setting `SEASON_REVIEW`; this catches last-day T16 without widening the existing event resume type. `nextWorldDay` may be the day after the regular season ends, but the saved resume remains `SEASON_PROGRESS`. After the notice resolves, the worker can finish normal review transition.

The writer deliberately does not increment the career revision. Like existing pro window writers, E84's `resume.sourceRevision` is `career.revision + 1`; the enclosing worker must call its existing finish path exactly once, incrementing the revision before publishing the notice.

`resolveProHiddenTraitNotice(career, expectedRevision, {eventKey,eventVersion,command})` accepts only this active E84 and the existing `OPEN_TRAITS` choice. It validates revision, event/version through `resolveEventChoice`, same source world/season/player, registration, receipt and closed resume boundary. It returns `{career,navigation}` with S38 navigation, the saved regular progress phase, a resolved event and revision +1. Repeated selection cannot navigate again. All changes are structural; source records are not cloned or overwritten.

The persistence owner supplies an already validated career root. Trait unlock receipts currently contain season, league, day and record revision, but no independent world key; this adapter binds them through their owning root and checks E84's world/season at resolution. It does not add a new receipt schema or silently migrate historical receipts missing required pro source tags.

## Explicit scope

Postseason notice progression is **not included**. Current KBO/US `EVENT_DECISION.resume` contracts accept regular progress only; adding postseason resumes requires a separate lifecycle contract. National games, school notices, trait thresholds, trait generation, numerical effects and UI trait-book rules are unchanged.

## Verification status

`pro-trait-notices.test.ts` covers KBO/US registration and top-level identity, first hidden vs ordinary notice behavior, S38 navigation and one-time resolution, JSON restoration, structural sharing/original immutability, stale revision/version/command/world/registration/resume/receipt rejection, closed-day gating, receipt filtering, same-season backlog, multiple hidden notices and T16 before review. US sources in these tests are controlled adapter fixtures, not complete signing/season lifecycle proof.

Runtime tests and full checks: **PENDING**, intentionally not executed during M2 bulk implementation. No Git operations were performed. Parent owns regular-worker, resolver dispatcher and export integration plus permitted static engine validation.
