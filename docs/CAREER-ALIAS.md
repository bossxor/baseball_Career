# Career alias presentation and E42

The user's approved rule is “selected player type + earned record alias.” The type label comes from the existing HITTER_TYPES/PITCHER_TYPES archetype definitions. Design 49 supplies the only record alias labels: G02 `라인업의한자리` and G07 `마지막아웃`. No new thresholds, labels or ability, growth, game or financial bonuses are introduced.

`careerAliasView` derives the current display from the current selected archetype and all proven record alias badges. Stable order is G02 then G07; display joins the existing type label and earned labels with ` · `. A canonical TITLE reward must reference a matching COMPLETED/CORRECTED goal slot or preserved goal history completion receipt. Corrected commemorative rewards remain available. Raw statistics alone do not invent an alias.

Call `settleCareerSeasonAlias(career, sourceBeforeClosure?)` after the genuine full-year growth finalizer and goal refresh, before creating the year-end seal. It requires validated finalized growth and full world growth-day aging. The first baseline uses the season-start archetype and previously earned rewards; creating the initial type alone does not fabricate E42. Later closures compare the last settled alias with the current derived display. Each season records one receipt; an actual change creates one E42 with the exact existing SEASON_WINDOW fields. Replays are idempotent and add no revision.

Root integration needs optional `aliases?: CareerAliasLedger`, pure `assertCareerAliases`, the view, and `resolveCareerAliasEvent` for existing ACK_EVENT acknowledgement. Preserve the ledger across school, college and pro world transitions. The observer does not write to the shared event queue or alter any gameplay state.

Tests cover initial baseline, selected type changes, proven goal rewards, retained corrected rewards, forged/missing reward proof, full-year growth gating, yearly comparison, replay, history validation and unchanged player/record/growth state. Runtime tests are deferred to the parent task's single final verification gate.
