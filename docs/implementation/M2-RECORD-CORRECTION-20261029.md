# Explicit career official-record correction — 2026-10-29

Scope: design107 §8. `correctCareerGameContribution` is a server-only scoring-owner transaction for school, KBO and US roots. It accepts the expected career revision, expected record revision, exact before-contribution fingerprint, official replacement contribution and stable correction ID. External client game payloads are not official correction authority.

The initial scope is a current-season REGULAR contribution on an already closed date while the career remains in SEASON_PROGRESS with no pending game. Scope, date, team result, participant identities, PA/BF/outs, starts and appearance counts stay fixed. These accounting boundaries preserve committed health, fatigue, growth and payroll without replaying the game. Statistical corrections that need participation-accounting changes require a separate transport operation.

The transaction clones the source, rebases only the affected closed date's contribution evidence, commits the record replacement and rebuilds that game's existing-pair direct-duel evidence before evaluating unlocks. Relationships formed by that game do not gain a retrospective duel. A CORRECTED receipt preserves the original and corrected contribution, duel and trait evidence. Existing trait ownership and T14 targets remain; newly qualified evidence can unlock at this transaction for the next actual game. Persisted completed starter-season receipts replay chronologically from official records, preserving owned T16 even when an unsealed counter resets. Existing goal/achievement refresh reducers mark invalidated unlocks CORRECTED while retaining rewards.

Exact correction-ID replay returns the same stored receipt without incrementing revisions. Reusing its ID with a different command fails. The pure `auditCareerRecordCorrections` guard checks receipt seals, revision chains, current corrected contributions/duels, retained trait ownership and current-season closed-date evidence; it does not call public root/view guards.

Historical archived years, finalized growth/health, academic year seals, college cup/result/recruitment boundaries, pro postseason/year close and independent national selection projections are rejected. This command does not silently rewrite immutable archives or previously sealed administrative source snapshots. Historical record transport and Android/UI scoring-authority entry points remain separate work.

## Pending verification

Tests use explicitly controlled official contribution/date/health fixtures to check new T14 qualification, declining pre-unlock evidence, preserved owned traits/targets, JSON determinism, exact receipt replay, stale/tampered evidence, unchanged source/world/health, CORRECTED goal rewards, chronological T16 recomputation and sealed/pending root rejection. Pro fixtures verify current command boundary rejection; this is not a claim of played KBO/US correction acceptance.

No runtime tests, full checks or Git commands were executed in this implementation pass. Parent integration owns root fields, exports, pure audit hooks and the requested final single verification. No new passing evidence is asserted here.
