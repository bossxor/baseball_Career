# HTTP season profiling, 2026-11-07

Baseline `d29db0f`. Windows 10.0.26300, Node 24.20.0, AMD Ryzen 5 9600X, 12 logical CPUs, 66,126,716,928 bytes RAM. Run each league alone: `node --import tsx scripts/profile-career-api.mjs <school|college|kbo|us> docs/implementation/evidence/CODEX-20261107-profile-<league>.json`.

PGlite in-memory storage, Hono `app.request` HTTP request handling, server-offered commands and DB transaction; not a network socket or production PostgreSQL. Fixtures supply the preceding career; season games themselves are not fabricated. Source career and resulting career hashes are in each JSON. V8 inspector samples the entire measured loop, including screen reads and DB reads; command wall times include the HTTP command and transaction. Inspector adds overhead. Raw profile and exclusive top-frame sample times are included; samples are estimates and must not be confused with measured component wall time.

| League | Result | Regular games | Measured loop wall time | Evidence |
| --- | --- | ---: | ---: | --- |
| College | SEASON_REVIEW; six HTTP commands, two event choices | 216 | 30.805 s | `CODEX-20261107-profile-college.json` |
| School | blocked at E43; 36 commands | 72 | 9.740 s | `CODEX-20261107-profile-school.json` |
| KBO | running | — | — | pending |
| US | not started | — | — | pending |

The team lead reported overlapping rules/engine/db builds, one HTTP test and a test typecheck during the KBO run. Exact overlap intervals are not captured. KBO wall time is not a clean comparison with the earlier college run; rerun under isolated conditions before comparing.

KBO session `40678` was launched before school API commit `78243ce` was cherry-picked and before the per-command progress logging change. Its loaded code is the launch-time code, not the current tree. Its progress is console-only until exit; later runs log each command and next world day.

College top exclusive sampled frames: `structuredClone` 15.217 s, `canonicalJson` 4.699 s, anonymous `game.js` 1.720 s. These are sampled attribution estimates, not disjoint wall-clock components; `canonicalJson` includes uses other than seals. Ranking individual frames does not establish the three largest requested components.

`node scripts/analyze-career-profile.mjs <profile.json>` walks each sample from leaf to parent and assigns it once to the nearest recognized function or file. College sample-time estimates are clone 49.92%, simulation 14.56%, DB 7.40%, day close 4.05%, validation 2.22%, seal 0%, JSON 0%, GC 4.39%, idle 0%, unclassified 17.45%; full breakdown is `CODEX-20261107-profile-college-analysis.json`. Zero for seal/JSON means no samples matched, not no cost. Classification is heuristic; native functions, helpers and stack context can hide or misattribute work. DB time excludes waits. These are exclusive sampled estimates, not component wall-time ratios. Separate boundary timings are still needed.

School E43 is raised after 16 protagonist team games. `schoolCareerHome` has no command for this event; `resolveCareerWindowEvent` accepts `eventKey`, `eventVersion`, `FORFEIT_TRAINING` (or an offered training choice), but `CAREER_SCHOOL_*` exposes no window command. Do not invoke the engine directly in this HTTP proof. E41 and hidden-trait decisions may require separate API support; not yet exercised.
