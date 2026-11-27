# M2 closure gap table — 2026-11-06

M2 is **not complete**. This table says, per design path (`docs/design/end-to-end-design-paths.json`, read-only), which genuinely native chain (real engine commands from player creation, no controlled prefix) exists, and what blocks the rest. A path is `ENGINE_NATIVE_PATH_PROVEN` only when `scripts/verify-m2-closure.mjs` re-verifies a native slice from its receipts (`nativeSliceVerdict` in `scripts/m2-native-paths.mjs`: rebuilt creation state hash, receipt hash linkage, command-chain hash, required commands in order). Statuses are never hand-edited. Proven here = **engine command chain only**; S-screens (M4/M5), persistence/idempotency (M3), club (M6), chronicle/export (M7) and device (M8) remain external, and no "completion" is claimed.

Cost unit: measured single-pass wall time on the shared machine — HS216 season ≈ 4 min (227 s), one college year (216 league games + cup + review) ≈ 6.5 min; the runner executes every command twice (JSON replay), so double it.

Evidence and the native-run status are in the section "Runs" at the bottom.

## TF 후속

## TF 후속 2026-11-27 — 남은 15경로 우선순위와 P11 시도

현재 증명 9/24(P01·P02·P03·P04·P05·P06·P07·P12·P13). P15는 에이전트 역제안까지만 통과해 유지 보류. 남은 15 = P15, P11, P08, P09, P10, P16, P14, P17~P24.

| 순위 | 경로 | 지금 증명 가능? | 원인 분류 | 다음 단계 |
|---|---|---|---|---|
| 1 | P11 대표 차출·출장·자격 | **아니오 — 이번 시도 미증명** | 엔진 버그 + 드라이버(선수 강도) | 아래 P11 상세 |
| 2 | P15 에이전트 역제안(실제 만료 포함) | 부분 | 드라이버: 유한 기한 오퍼의 실제 만료를 네이티브로 유도하는 경로 없음 | 기한 있는 오퍼가 자연 발행되는 시즌 탐색 또는 통제 검사 유지 |
| 3 | P08 포스팅, P09 포스팅 보류 | 아니오 | 엔진 버그(Futures 라인업)·드라이버(7시즌 루프 ≈ 9시간+)·규칙 선택(28세 병역 계획 입력) | 아래 버그 수정 뒤 `verify-native-kbo-p11.mjs` 계열 시즌 루프를 7시즌 확장, 병역 계획 선택은 팀장 결정 |
| 4 | P16 미지명·방출→재도전 소진 | 아니오 | 엔진 미구현 체인(네이티브 방출→재도전 3회 명령 연결 없음) | 방출 명령 선행 확인 후 별도 설계 |
| 5 | P10 미국 종료→국내 준비+복무 | 아니오 | 엔진 미구현 체인(미국 6시즌+복귀 2년 네이티브 경로 없음) | XL |
| 6 | P14 같은 경기 특성·목표·연대기 | 아니오 | 타 마일스톤(M7 연대기 생산자) | M7 |
| 7 | P17~P21 클럽, P24 | 아니오 | 타 마일스톤(M6) | M6 |
| 8 | P22 다기기, P23 중계·카드·백업 | 부분(웹·API 검증 별도) | 타 마일스톤(M3/M7) | 엔진 체인으로는 증명 불가 |

### P11 시도 결과 (증명 아님)
- 드라이버: `scripts/verify-native-kbo-p11.mjs`(AG 복귀 저장에서 이어 시즌 마감·재계약·다음 시즌·대표 선발을 반복, 3명령마다 중간 저장, 재개 가능). 증거: `evidence/M2-20261127-P11-native-attempt.json`.
- 실제 엔진 명령 201건(AG 복귀 36건 포함)으로 2034 잔여 시즌·포스트시즌·성장·마감·재계약, 2035 정규시즌·P12, 2036 OLY까지 진행.
- 선발 결과: WBC 2034 55.6/컷 57.7, AG 2034 58.6/컷 60.7, P12 2035 후보 아님, OLY 2036 후보 아님 → 모두 미선발(E45). 후보 아님 원인: 이 투수는 2군(FUTURES)만 뛰어 P12·OLY의 KBO 리그/기록 조건을 못 채움(2034 11아웃, 2035 142아웃).
- **엔진 버그(확인됨)**: 2036년 224일차 `ROSTER_INVALID: no legal field lineup`. LT 2군 타자가 정확히 9명이고 1명이 부상이면 건강한 8명으로 라인업을 못 만든다(`kbo-game-world.ts:24`가 2군 로스터를 만들고 `lineup.ts:49`가 던짐; `kbo-roster-repair.ts missing()`의 최소 깊이는 시즌 시작 때만 보장). 재현 `scripts/m2-futures-lineup-repro.mjs`: 전원 가용이면 통과, 부상 반영 시 같은 오류. 결정적이며 이 버그가 모든 장기 네이티브 KBO 시즌(P08/P09 포함)을 막는다.
- 이 버그의 수정은 규칙 선택이라 임의로 고치지 않았다. 선택지: (A) AI 구단 시즌 중 부상 시 기존 `signKboRequiredReplacement`로 2군 필수 인원을 보충(권장: 기존 사전시즌 보충 규칙 재사용, 결정적), (B) 1군 후보 야수를 해당 일 2군 경기에 임시 배치(1군 동일 일 출전과 충돌 규칙 필요), (C) 2군 최소 타자 수를 10명 이상으로 상향(부상 2명 이상이면 다시 실패).
- **수정 완료 `25faf45`(A안, AI 구단만)**: `repairKboFuturesGameDepth`(`kbo-npc-military.ts`)가 2군 경기 직전 `planEmergencyRoster`로 건강 타자 9명·우투 수비 4명 미달을 보고 `signKboRequiredReplacement`(최소 계약)로 보충. 회귀 `kbo-futures-depth.test.ts` + 관련 엔진 88건 통과. 같은 저장에서 재개해 224일차를 통과하고 2036 포스트시즌·재계약·2037시즌을 이어갔다.
- **새 차단(규칙 결정 필요)**: 2037년 75일차에 같은 오류가 **주인공 구단 SS 2군**(타자 10명 중 부상 2명)에서 발생. A안은 AI 구단만 대상이라 제외했다. 선택지: (A') 주인공 구단에도 같은 보충 적용(최소 계약, 구단 인건비 자동 증가, 결정적; 권장), (B') 1군 야수 임시 배치, (C') 사용자에게 로스터 사건으로 노출. 결정 전까지 P11 재개 불가.
- 남은 P11 조건: 위 버그 수정 후 같은 저장에서 재개 `node --max-old-space-size=8192 --import tsx scripts/verify-native-kbo-p11.mjs <WBC state.gz> <AG checkpoint.gz> <P11 checkpoint.gz> --last-season=2038`(2038 WBC·AG). 그래도 미선발이면 선수 강도 문제이며 별도 결정이 필요하다: 더 강한 생성 조건·시드 탐색, 또는 선발 점수 컷 규칙 변경(규칙 결정, 임의 변경 금지).

2026-11-23 P04 통과. 실제 미지명과 E74 학적 유지·3학년 진입을 명령 325건으로 검증했다. 아래 P04 부분 증명 행은 이전 기록이며 누적 8/24다. [실행 증거](evidence/M2-20261123-P04-native-summary.json)

2026-11-22 P13 통과. 실제 고교 경기 부상과 훈련 차단, 자연 회복과 E43, 한 번의 훈련 지급을 60개 명령으로 검증했다. 아래 P13 부분 증명 행은 이전 기록이며 누적 엔진 증명은 7/24다. [실행 증거](evidence/M2-20261122-P13-native-summary.json).

2026-11-21 P06 통과. 실제 고교 216경기에서 시작해 유효 오퍼 3건과 루키 등록을 확인했다. 명령 108건과 독립 영수증 재검증 통과. 아래 P06 미달 행은 이전 기본 시드 결과이며 누적 엔진 증명은 6/24다. [실행 근거](evidence/M2-20261121-P06-native-summary.json).

2026-11-17 P05 재실행 통과. 실제 대학 정규 864경기와 졸업, KBO 8라운드 지명·입단까지 533개 엔진 명령이 재검증됐다. 아래 P05 차단 행은 11월 6일의 기록이다. 누적 엔진 증명은 5/24이며 DB·웹·실기기는 별도다. [실행 근거](NEXT-SESSION.md).

KBO 진행 커서 오류를 분리 재현해 수정했다. 통제 고교 접두 후 공식 KBO/FUTURES 201경기를 시뮬레이션하고 59~90일을 닫았다. 88회 진행 중 AI 로스터 검토 10건과 67일 이후 JSON 재개를 확인했다. P15 전체 경로 증거는 아직 없다.

P05의 대학 진로·졸업·KBO 지명·아마추어 연말 검증용 상태 사본은 분할 SHA-256으로 교체했다. 기존 원문 봉인도 검증할 수 있다. 통제 대학 학년에서 졸업·계약·입단은 확인했다. 실제 대학 4년 전체, 500MB 이상 상태 저장, 새 코드에서의 24경로 재증명은 별도다. 아래 표는 당시 런 기록이다.

## Ranked gap table

| Rank | Path | Flow | Native now? | Blocking engine gap (file / function) | Cost |
|---|---|---|---|---|---|
| 1 | P01 | 타자 생성→고교→KBO 지명·계약 | **PROVEN (engine-native)** | none: creation→HS216→`prepareCareerKboDraft`→`resolveCareerKboDraft`→`decideCareerKboDraft`→`closeSchoolSeasonForKbo`→`startSignedKboCareer` all native | done (HS trunk 4 min ×2) |
| 2 | P07 | 미국 미달→다른 진로 | **PROVEN (engine-native)** | none; US inventory/world is an external caller input (`usDirectInventory`, same as `career-us.test`) | shares trunk |
| 3 | P12 | 대학생 휴학→복무→복학 | **PROVEN (engine-native)** | none; native HS→admission, then `startCollegeMilitaryLeave`→`advanceCollegeMilitaryService`→`resumeCollegeAfterService` | shares trunk, +1 min |
| 4 | P03 | 고교→대학1→2학년 | **PROVEN (engine-native)** | none; `advanceCollegeCareer` plays 216 league games natively | +13 min |
| 5 | P04 | 대학2 조기 미지명→복학 | **partial (variant, run B)** | native chain runs, but the native player IS drafted at the early draft (round 8, score 56.8), so the undrafted branch the path requires is not reached; only drafted→`DECLINE`→E74 return is executed. Needs a weaker native player or seed search for a null round (`career-kbo.ts:resolveCareerKboDraft`) | +13 min over P03 |
| 6 | P05 | 대학4 졸업→KBO | **blocked — engine/persistence (state size)** | run C reached graduation (531 commands over 4 native college years) and died at `PREPARE_KBO_DRAFT` with `Invalid string length`: career state exceeds the V8 max string (~0.5 GB). Size after year 2 = 123 MB (`collegeEarlyRoute` 54 MB, `previousSeasons` 31 MB, `records` 16 MB, `collegeCup` 7.5 MB, `days` 7.6 MB). Not a driver defect; the same bloat blocks M3 DB saves. Fix = stop duplicating per-year snapshots in state, or streaming hash in harness | L (engine) |
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
| C | `--native=P03,P05` (~3h20, single process) | exit 1 at P05 graduation draft (state > max string length). P03 slice finished with the new growth-ledger assertions; its receipts re-verify offline (`scripts/m2-reverify-slice.mjs`, same command-chain hash `3ed043e1…` as run A = deterministic) | `evidence/M2-20261106-closure-native-c-failed.json`, `-c.log`, `-c.exitcode.txt`, `-c-p03-reverify.json` |
| B | same with `--native=P04` | exit 0 (~60 min). `P04-native-decline-variant`, 323 commands: HS216 → two college years → E73 early draft → native pick (round 8) → DECLINE → E74 return → year 3. **P04 remains FULL_PATH_NOT_PROVEN** (undrafted branch not reached). | `evidence/M2-20261106-closure-native-b.*` |

### Caveats the proof does not cover
- `--tolerate-source-drift`: other workers edited engine files during the run. All modules were loaded before the start manifest was hashed, so the executed code is the start manifest; the report records `sourceDrift.changedFiles` (us-*/test scratch files, none on the executed native paths). Rerun without the flag on a quiet tree before citing for release.
- P03 asserts 216 college league games (48 per team), HS records preserved, year 2 entered with 1 completed year. "기간 성장 중복0" is now asserted (run C): closed-year ledger passes `validateSeasonGrowthLedger`, unique period keys, ability delta = ledger gains − aging, and the next year starts with an empty ledger from the carried abilities (1 period, 90,659 units).
- P01 "희망팀 비보장": preference LG, draft gave LT (probed before tracing); one draw, not a distribution.
- P07 US roster world/inventory (30 orgs, 3,000,000 USD each) is an external caller input, as in the unit tests.
- Proof = engine command chain from creation. Screens, persistence/idempotency, club, chronicle and device stay external. **Not M2 completion**: 4 of 24 paths, 99 events remain source-triage only, PF-D not executed.

## Cause per blocked path (engine vs driver)
- Engine/persistence: P05 (state size), P15/P11/P08/P09/P16/P02-completion (KBO season day-67 `INVALID_PRO_TRAIT_PHASE`), P10/P16 (no native US-return / release-retry chain), P14 (chronicle = M7).
- Driver/seed search only (no engine change needed): P04 undrafted branch, P06, P13.
- Other milestone: P17–P24 (M6/M3/M7).
