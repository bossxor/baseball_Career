# College AG owner integration — 2026-10-29

Scope: design20/21/43. The college owner uses the existing national selection, bracket, game, injury replacement, health and KBO host-return reducers.

- Actual KBO candidates and the Korean high-school-origin college protagonist share one selection projection. AG is the supported college tournament. The school regular season and cup must finish before admission; the real KBO root must be paused at the AG window.
- Each international date closes once. College and KBO player health, fatigue and pitch XP remain with their owners. Return produces both roots and expected revisions, preserves the school date/cup/result receipts, and advances only the result's aggregate record revision.
- The persisted pre-AG school health snapshot has a canonical seal. The reader rejects changed school records, health rows, source facts, pending games and national result evidence. School growth audits replay academic receipts against the pre-AG injury state, since September health may legitimately differ.
- Academic annual closure invokes athlete-duty advancement after finalized growth and health closure, before producing the immutable year-end basis. Only a completed academic year at the matching growth season can consume one of three distinct duty seasons. The admission season is excluded; repeat settlement is inert. Pro admission must preserve the remaining balance and military state.

## Pending verification

New `college-national.test.ts` covers invitation deadlines, native pending AG JSON continuation, stale revisions, changed school/health/game seals, actual AG owner return, KBO date auditing, retained academic growth evidence and the annual duty hook.

The fixture explicitly uses controlled school regular scores and KBO pre-window date receipts. The cup and AG use their existing workers. The duty fixture uses a labelled controlled legacy earned-benefit receipt; it does not claim a native medal or three played years.

Tests, type checks and full checks were not executed during this implementation pass. The parent task owns the requested single final verification and commit. No new success evidence is asserted here.
