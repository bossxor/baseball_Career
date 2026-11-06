# M2 closure gap table — 2026-11-06

M2 is **not complete**. This table says, per design path (`docs/design/end-to-end-design-paths.json`, read-only), which genuinely native chain (real engine commands from player creation, no controlled prefix) exists, and what blocks the rest. A path is `ENGINE_NATIVE_PATH_PROVEN` only when `scripts/verify-m2-closure.mjs` re-verifies a native slice from its receipts (`nativeSliceVerdict` in `scripts/m2-native-paths.mjs`: rebuilt creation state hash, receipt hash linkage, command-chain hash, required commands in order). Statuses are never hand-edited. Proven here = **engine command chain only**; S-screens (M4/M5), persistence/idempotency (M3), club (M6), chronicle/export (M7) and device (M8) remain external, and no "completion" is claimed.

Cost unit: measured single-pass wall time on the shared machine — HS216 season ≈ 4 min (227 s), one college year (216 league games + cup + review) ≈ 6.5 min; the runner executes every command twice (JSON replay), so double it.

Evidence and the native-run status are in the section "Runs" at the bottom.

## Ranked gap table

| Rank | Path | Flow | Native now? | Blocking engine gap (file / function) | Cost |
|---|---|---|---|---|---|
| 1 | P01 | 타자 생성→고교→KBO 지명·계약 | **PROVEN (engine-native)** | none: creation→HS216→`prepareCareerKboDraft`→`resolveCareerKboDraft`→`decideCareerKboDraft`→`closeSchoolSeasonForKbo`→`startSignedKboCareer` all native | done (HS trunk 4 min ×2) |
| 2 | P07 | 미국 미달→다른 진로 | **PROVEN (engine-native)** | none; US inventory/world is an external caller input (`usDirectInventory`, same as `career-us.test`) | shares trunk |
| 3 | P12 | 대학생 휴학→복무→복학 | **PROVEN (engine-native)** | none; native HS→admission, then `startCollegeMilitaryLeave`→`advanceCollegeMilitaryService`→`resumeCollegeAfterService` | shares trunk, +1 min |
| 4 | P03 | 고교→대학1→2학년 | **PROVEN (engine-native)** | none; `advanceCollegeCareer` plays 216 league games natively | +13 min |
| 5 | P04 | 대학2 조기 미지명→복학 | **partial (variant, run B)** | native chain runs, but the native player IS drafted at the early draft (round 8, score 56.8), so the undrafted branch the path requires is not reached; only drafted→`DECLINE`→E74 return is executed. Needs a weaker native player or seed search for a null round (`career-kbo.ts:resolveCareerKboDraft`) | +13 min over P03 |
| 6 | P05 | 대학4 졸업→KBO | achievable, driver not built | four native college years; `graduateCollegeCareer` then KBO sign | +40 min over P04 |
| 7 | P15 | 에이전트 고용→역제안 | **no — engine bug** | native KBO regular season dies: `advanceKboCareer` throws `INVALID_PRO_TRAIT_PHASE` at world day 67 (`pro-trait-notices.ts:50 raiseProHiddenTraitNotice` ← `kbo-progress.ts:163 interruptHidden`); `career.phaseContext` keeps a non-null `pendingGame` after `Object.assign` of a cloned career (hypothesis: stale `progress` alias, `kbo-progress.ts:144`). Deterministic; state saved in the shared notes folder. Then `closeKboSeason`→`hireCareerAgent`→`offerKboRenewal`→counter driver | S for the fix (engine worker), then M |
| 8 | P02 | 투수 생성→보직 경쟁→구종 훈련 | partly | no standalone role-competition command (only `kbo-opening-roster.ts:confirmKboOpeningRoster`); E86 learning exists (`repertoire-events.ts`); needs pitcher HS trunk (+4 min) | M |
| 9 | P13 | 부상→강화 연기→복귀 | partly | natural diagnosis not driven: needs a seed where protagonist is injured in first 12 HS games (`health.ts`); recovery/deferral/one training use exist (controlled diagnosis today, `injuryTrainingPath`) | M (seed search ~4 min/probe) |
| 10 | P06 | 적격 고졸→미국 제안→마이너 | blocked by balance | native default hitter finishes HS at overall 51.6 and `careerUsDirectView` is hidden (`US_DIRECT_MIN_SCOUT_SCORE`, `draft.ts`); needs seed search to find an eligible native player or a college→US comparison chain (`carryCollegeUsComparison`) | M–L |
| 11 | P11 | 대표 차출→출장→자격 | blocked | native player (~52 overall) is never selected (`kbo-national-selection.ts`); `openNationalCallup` needs a closed pro review; needs multi-season native growth | L |
| 12 | P08 | 국내→포스팅→해외 | blocked | `kbo-posting.ts:kboPostingEligibility` needs ≥7 closed native KBO registration seasons + military COMPLETED; no native multi-season driver (`closeKboSeason`→`stageKboAgeAndContracts`→`startNextKboSeason` ×7) nor native military completion | XL (7 KBO seasons) |
| 13 | P09 | 포스팅 실패→잔류 | blocked | same prerequisite as P08, then request/defer/no-offer/remain branches (those reducers are already exercised in `postingPaths`) | XL (shares P08 trunk) |
| 14 | P10 | 미국 종료→국내 준비+복무→드래프트 | blocked (helper links) | no native US-season→return chain: 6 US seasons + 2 mandatory return years (`us-amateur-return-career.ts`, `us-return-retry.ts`, `us-return-preparation.ts`); fixture `nativeUndraftedUsReturn` is controlled closed years | XL |
| 15 | P16 | 미지명·방출→재도전 소진→은퇴 | blocked (helper links) | native pro career + release + three independent retry uses (`career-pro-retry.ts`); `retryNoOfferPrefix` is controlled | XL |
| 16 | P14 | 같은 경기 특성·목표·연대기 | blocked | chronicle producer (E99/S45) is M7; no engine command emits one-game stat+trait+goal+chronicle receipt | M7-owned |
| 17 | P17–P21 | CLUB mode | blocked (M6) | `kbo-club-*.ts` commands exist but no unified native chain; P18 needs a native ARCHIVED original (depends on P16) | M6-owned |
| 18 | P22 | 다기기 복원 | blocked (M3) | HTTP persistence/idempotency lives in `apps/api`, not an engine chain | API-owned |
| 19 | P23 | 중계·카드·백업 | blocked (M7) | replay/card/export external; only read-only committed record reads provable (`controlledKbo`) | M7-owned |
| 20 | P24 | 하드 경쟁·치트→이적→재영입 | blocked | spans club cheat (M6) and difficulty policy; no native chain | M6-owned |

## Highest-value next engine/driver work
0. **ENGINE BUG (blocks every full native KBO season: P15, P11, P08/P09, P16, P02 completion)**: native KBO day 67 of the first season throws `INVALID_PRO_TRAIT_PHASE` (see row P15). Fix first; the same alias pattern may exist in `us-season.ts`.
1. **Native KBO multi-season loop** (`closeKboSeason`→`stageKboAgeAndContracts`→`startNextKboSeason`) as a driver: unlocks P15 now and P08/P09/P11/P16 later.
2. **Native player strength**: P06/P11 need an eligible native player; options (seed search vs. a college→US route) are a driver choice, not a rule decision.
3. **P10/P16 helper links**: a native US-season→return chain and native release→retry chain do not exist as engine commands.
4. Everything labelled M3/M6/M7 stays out of M2 closure.

## Runs

| Run | Command | Result | Evidence |
|---|---|---|---|
| A | `node --import tsx scripts/verify-m2-closure.mjs <out.json> --scenarios=nativePaths --native=P01,P07,P12,P03 --tolerate-source-drift` (`--max-old-space-size=6144`, single process, ~63 min wall on a shared machine) | exit 0. **P01, P03, P07, P12 = ENGINE_NATIVE_PATH_PROVEN**; the other 20 stay FULL_PATH_NOT_PROVEN with a reason. 109/110/138/212 commands, each executed twice (JSON replay + source immutability). | `evidence/M2-20261106-closure-native-a.{json,log,exitcode.txt}` |
| B | same with `--native=P04` | P04 stays unproven even if the variant passes (see NEXT-SESSION for the outcome) | `evidence/M2-20261106-closure-native-b.*` |

### Caveats the proof does not cover
- `--tolerate-source-drift`: other workers edited engine files during the run. All modules were loaded before the start manifest was hashed, so the executed code is the start manifest; the report records `sourceDrift.changedFiles` (us-*/test scratch files, none on the executed native paths). Rerun without the flag on a quiet tree before citing for release.
- P03 asserts 216 college league games (48 per team), HS records preserved, year 2 entered with 1 completed year. The design assertion "기간 성장 중복0" is **not asserted separately** (growth settlement runs inside the native commands).
- P01 "희망팀 비보장": preference LG, draft gave LT (probed before tracing); one draw, not a distribution.
- P07 US roster world/inventory (30 orgs, 3,000,000 USD each) is an external caller input, as in the unit tests.
- Proof = engine command chain from creation. Screens, persistence/idempotency, club, chronicle and device stay external. **Not M2 completion**: 4 of 24 paths, 99 events remain source-triage only, PF-D not executed.
