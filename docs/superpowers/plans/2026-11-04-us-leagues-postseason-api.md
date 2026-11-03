# Fixed fictional US leagues and postseason API

> Execute inline with Superpowers executing-plans; preserve the current checkout and unrelated WIP. User approved fictional30 clubs with a fixed AL/NL registry on2026-11-04.

## Design and scope

Keep existing US01–US30 identities/names/players. Store a versioned membership table on the US world: AL US01/03/05/07/09/11/13/15/17/19/21/23/25/27/29; NL US02/04/06/08/10/12/14/16/18/20/22/24/26/28/30. This is a literal server catalogue, independent of organization array order, standings and RNG. The alternation is an implementation allocation, not a new strength or financial rule.

New recognized worlds receive metadata during creation. Unrecognized custom registries remain unconfigured; never infer their membership. Existing saves remain valid without metadata. An explicit metadata-only command configures recognized legacy saves before postseason begins; it preserves dates, records, population, RNG and money. It cannot rewrite an active/completed current postseason. Native low-level functions that accept an explicit trusted server membership remain compatible for controlled fixtures; the public API accepts no membership or bracket input.

Reuse the native PS seeding/game/health/XP/record writers and the existing save pipeline. No salary/growth/rules changes, dependencies, manual winner command, background simulation shortcut or extra persistence layer.

## Tasks

- [x] Registry: pure fixed catalogue and validation; world creation/initial/active guards; recognized legacy CAS command and package exports. RED/GREEN: order independence, tampering, unknown IDs, one-time metadata, old-save/identity/RNG/record/income preservation.
- [x] API: CONFIGURE_LEAGUES, START_POSTSEASON, ADVANCE_POSTSEASON with strict payloads, owned conference selection and public league/PS views. RED/GREEN: owned start, forged seed/membership rejection, stale revision, native bounded chunk, JSON resume and unchanged regular payroll.
- [x] Batch focused registry/PS/API regression after implementation; investigate failures first. Preserve full existing check evidence1058/1053/skip5 as historical, not validation of new source. Final whole gate only after the new bundle is reviewed/frozen.
- [x] Record exact evidence, synchronize approved changed documents to V: with Copy-Item, commit/push selected files and verify remote. Keep the unrelated local us-amateur-return-career.test.ts WIP outside this commit.

## Acceptance boundary

A controlled regular-season closure followed by a native PS game is not a native8790-game regular season. PS progress/FINAL evidence must be real; no forced winner. Unknown legacy IDs and actual PostgreSQL large-state persistence remain explicit limits.
