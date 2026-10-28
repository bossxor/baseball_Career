# M2 closure audit — 2026-10-28

Read-only source audit against `ef03ff9` on `codex/m2-career-engine`; concurrent edits are not validated here. No engine/test edits, Git changes, or test execution. Source references are evidence of implementation shape, never runtime PASS. The companion JSON inventories all 99 events and distinguishes trigger gaps from missing domain behavior.

## Completion decision

M2 is materially incomplete. Roadmap120 requires the entire career engine, 99 events, trait/pitch/goal/relation effects, 24 path fixture hashes and PF-D review. Current tests cover many useful slices, often from explicitly controlled completed-season fixtures. Neither their count nor an event catalogue/ACK dispatcher proves full career execution.

### Missing executable domains, in priority order

| Required domain | Exact existing boundary | Missing behavior / required evidence |
|---|---|---|
| Agent, counteroffer, additional role review; P15/E91–93 and E10/14/15 | `lineup.ts:lineupCompetition`, `kbo-callup.ts:reviewKboCallup`; no `HIRE_AGENT`, `REQUEST_SALARY_COUNTER`, `REQUEST_ROLE_REVIEW` implementation outside catalogue | 59/50/103: three specialists, first immediate hire and next-season annual change, currency-separated cumulative 2% salary fees; fixed offer set request once, 10/20/30% raises, trust/bonus odds, dedicated RNG, budget reservation and rejected-original preservation; per-world-season 20-game bucket role task before next lineup, no appearance promise. Prove JSON/CAS/deadline/budget failure atomicity. These rules are specified; no new policy question is needed merely because implementation is absent. |
| Independent preparation and exhausted retry; P16/E06/07/34/35/68 | `career-kbo.ts:prepareCareerKboDraft` rejects any earlier assessment; `high-school-route.ts` only original graduation; no preparation ledger or commands | 66: lifetime `careerPreparationUsed` max3, uncontracted episodes, real48-game preparation season, original world growth/training/XP ledger, actual reevaluation/offers, allowed age20–22 college entry, exhausted legal routes then archive. Mandatory return/service periods consume0. No automatic minimum contract. |
| High-school-direct US domestic return; P10/E67/68 | `us-kbo-return.ts:eligible` requires `kboTransfer.origin` and `US_MINOR`; current route only KBO-origin minor control expiry | 13/21/23/66: direct-US return eligibility, mandatory two-season preparation including overlapping18-month service without double counting, draft eligibility and retry budget preservation. Existing domestic authority work solves KBO-origin ownership, not this route. |
| College early draft and return; P04/E73/74 | `career-kbo.ts:route` calls `collegeGraduationRouteView`; `college-year.ts:closeCollegeSeasonForNextYear/startNextCollegeSeason`; admission only ADMITTED/ENROLLED/GRADUATED | 43: one second-year early attempt, actual result/contract choice, unsigned third-year continuation, professional signing forbids return, independent graduation opportunity. No E73/E74 trigger or academic attempt ledger. |
| College military leave/resume; P12/E76 | `high-school-career.ts:assertCollegeCareerRevision` requires `entryYear+academicYear-1===calendar.year`; no school service owner | 43/21: freeze incomplete academic year, preserve completed records, advance age/world calendar during service, resume same year without replaying old schedule, no preparation-budget charge. Existing invariant rejects the required elapsed years. School national participation also needs an actual root owner; KBO tournament primitives alone do not cover eligible AG college players. |
| All12 career achievements; P14/E90 | `season-goals.ts:CareerGoalLedger/refreshCareerSeasonGoals` implements G01–10 only; no achievement ledger on latest branch | 58: A01–12 source-bound unlocks, cosmetics only, correction history and retained reward; same final domain commit, replay-safe. Selective earlier achievement implementation exists; see below. Account-wide ownership uniqueness is M3, but engine predicates/outputs are M2. |
| Position preparation, pitcher role plan and requests; E12/13/14/15 | `lineup.ts:initialPositionFits/automaticFieldLineup`; roster fit tables, no plan/confirm/cancel owner | Actual current registration/health/hand eligibility, scheduled progress, explicit confirm/cancel and next-lineup application. Generic scorer or changing a player snapshot is not a plan. |
| Remaining career event occurrence wrappers | See all99 JSON and families below | Existing effects often exist without required event creation/resolution; event-specific typed source, occurrence key, actual predicate, legal choice/domain commit and exact resume must be tested. Do not implement fake effects for legitimate navigation/ACK choices. |
| Unified proof ledger | `docs/design/end-to-end-design-paths.json` remains DESIGN_EXPECTATIONS_ONLY; no P01–24 executable hash report found | Fixed initial fixture/version, real command/effect trace, final hash, invariant report, JSON resume and failure branch per M2 portion. Controlled fixtures must remain labeled; native long paths need separately recorded execution. |

### Already assigned, still required

* PS final-game E84/date/multiple-notice resume, school US relation read reseal: active PS agent.
* Overseas frozen/terminated service, actual18-month progression and earned option confirmation within30 game days after discharge: active US service agent. An option must already exist; do not fabricate one.
* National US candidates→selection/tournament→same-day US health/payroll/calendar owner, and US→latest domestic world multi-owner engine result: parent. DB transaction execution is M3; an atomic pure engine result and honest CAS requirements remain M2.

## 99-event reconciliation

The JSON lists each catalogue trigger and dispatch classes. Literal source search is triage only. Existing M2-EVENT-CONNECTION-AUDIT manual reviews remain relevant, but their NOT_AUDITED values are not a source-level gap classification.

| Events | Source finding | Required closure |
|---|---|---|
| E01–04 | Career focus/winter12-game/route wrappers exist | Keep native replay/JSON evidence. |
| E05–07 | Draft primitive/acceptance exists through original E04, but these event IDs have no trigger | Attach actual selected/undrafted/retry sources; retry domain missing. |
| E08–09 | Actual camp/callup event owners exist | Existing focused evidence; full path proof remains. |
| E10–20 | No typed event occurrences; role/position/rest requests absent | Implement domain owners above; focus/style/development navigation must read existing authorized plan/window. Actual performance streak/coaching triggers still required. |
| E21–23 | Injury/recovery ledger exists in `health.ts`; no E21–23 trigger/CONFIRM_RETURN owner | Attach diagnosis/recovery to real health receipts; confirm cannot heal or manufacture appearance. |
| E24–29 | No actual first applause/allstar/rival/PS/champion/award event source | PS engine exists, relationship rival exists; attach respective real outcomes. Allstar/personal-award determination not found. |
| E30 | KBO renewal, remainder/exit E30 sources exist | Retain real sources; full contract route proof. |
| E31–35 | No career event triggers; AI FA market is not protagonist FA negotiation | Own protagonist domestic FA, role offer, release, final retry result; preserve existing renewal path. |
| E36–37 | KBO/US retirement/archive owners exist | School/uncontracted exhausted-route archive still missing. |
| E38–40 | Club review/prospect/budget events | M6 domain; no M2 PASS claim. |
| E41/43 | Actual style/training window owners exist | Keep domain/navigation distinction and source-bound opportunity. |
| E42 | No challenge/difficulty-season occurrence | Career-side trigger M2; full UI M4/M5 and club variation M6. |
| E44–48/55 | National primitives/KBO owner exist | US owner in parent scope; college eligible AG owner still missing. |
| E49–54 | KBO military actual sources and service blocks exist | Long native18-month proof distinct from two controlled blocks; US service assigned separately. |
| E56–57 | School US offers/signing primitives exist, IDs absent | Actual graduation/contract event wrappers, not fabricated extra contract. |
| E58–65 | Actual US camp/level/debut/posting owners exist | Recent E61 fixes supersede old audit gap; keep actual demotion/OPEN_RIGHTS proof, do not reroll. |
| E66–67 | Minor expiry market and KBO-origin return exist | Major-US FA E66 occurrence, direct-US return and latest domestic owner proof remain distinct. |
| E68–69 | No direct-US preparation/two-league retirement occurrence | Preparation domain; E69 derive existing final dual-league actual appearances. |
| E70–72 | Enrollment/camp/cup primitives exist, IDs absent | Attach school admission/camp/actual cup qualification typed sources. |
| E73–74/76 | No early draft/unsigned return/leave-resume | Missing college domains above. |
| E75 | Actual graduation event and route exists | Four-year tests use controlled completed-season fixtures; native chain proof not implied. |
| E77–81 | Club search/offers/rebuild | M6 domain. |
| E82 | Import form | M6/M7; not a world-event instance (`createWorldEvent` rejects FORM). |
| E83 | Creation hidden difficulty form | M2 input rules exist; form UI M4/M5. FORM is deliberately not world event. |
| E84 | Actual hidden-trait notice | PS agent handles actual closed PS date/final-game gap. |
| E85 | Unread trait summary exists in `trait-notices.ts`, no world event | Reading surface; do not force an unnecessary world-event effect. Verify unread read/update contract. |
| E86–88 | Pitch learning/repertoire/approach primitives exist, IDs absent | Tie actual training/completed-learning/valid approach window to notice sources; no passive XP or duplicate learning quarters. |
| E89–90 | Actual goal selection/completion outbox exists | A01–12 achievements missing despite E90 navigation support. |
| E91–93 | Catalogue only | Agent/counter/review domain above. |
| E94–96 | Actual formation/reunion owners exist | Preserve typed sources/native actual appearances; school reseal and US cross-owner scope handled separately. |
| E97 | Retired staff hire form | M6; archive identity projection M2 precursor, staff hire is not M2. |
| E98 | Commentary presentation | M7 read-only presentation; immutable game result/log precursor already M1/M2. |
| E99 | Chronicle navigation | M7 generation/export; actual M2 career events/achievement sources must be available, not a fake chronicle world mutation. |

##24 paths: retain whole acceptance, attribute each owner

All24 remain unverified as complete paths. This table does not change their acceptance or count partial evidence as PASS.

| Path | M2 coverage and remaining work | Other milestone dependency |
|---|---|---|
| P01 | Creation→HS→KBO primitives/tests exist; native combined trace/hash absent | Actual screens/API M4/M3 |
| P02 | Pitch creation/competition/learning primitives; explicit role plan/review missing | UI M4/M5 |
| P03 | HS→college→next-year exists; combined native trace/hash absent | UI M4/M5 |
| P04 | Second-year early draft/unsigned third-year return missing | UI M4/M5 |
| P05 | Fourth-year graduation/KBO exists from controlled years; native chain/hash absent | UI M4/M5 |
| P06 | Direct-US fixed offers→activation exists; combined native trace/hash absent | UI M4/M5 |
| P07 | Invisible ineligible/zero-offer US route tested; path trace/hash absent | UI M4/M5 |
| P08 | Posting→US actual command boundaries exist; latest shared owner/proof required | UI M4/M5, transport M3 |
| P09 | Posting defer/no-offer/remain paths exist in focused tests; path trace/hash absent | UI M4/M5 |
| P10 | Direct-US two-season return preparation+18-month inclusion→draft missing | Persistence M3; UI M4/M5 |
| P11 | KBO national actual appearance/eligibility exists; US/college root owners missing | UI M4/M5 |
| P12 | College leave/service/resume missing | Persistence M3; UI M4/M5 |
| P13 | Injury/training defer/apply primitives exist; E21–23 occurrence missing; chain/hash absent | UI M4/M5 |
| P14 | Goal/trait effects exist; career achievements missing; same-game aggregate/hash proof absent | Chronicle M7; UI M5 |
| P15 | Agents/fees/counter domain missing | CAS/receipt persistence M3; UI M5 |
| P16 | Preparation exhaustion/legal-route0 retirement missing | Archive persistence M3/files M7 |
| P17 | No M2 club implementation required | M6 entire club flow |
| P18 | M2 archive identity/peaks precursor exists | M6 young-copy/opening roster; PF-D10 |
| P19 | M2 archive identity precursor exists | M6 exclusive role claim/staff hire |
| P20 | No M2 club implementation required; recruitment probability primitive reusable | M6 entire market flow |
| P21 | M2 career year ledgers are not club long-run proof | M6 economy/year/long-run; M3 persistence |
| P22 | Deterministic reducer/JSON resume is M2 contribution only | M3 owner/idempotency/Neon/two-device; M8 actual devices |
| P23 | M1/M2 immutable result/records contribution only | M7 commentary/replay/card/backup; M3 persistence/M8 devices |
| P24 | M2 hard career/XP cap contribution exists | M6 club cheat/transfer/re-recruit; M4/M5 UI |

##119 PF-D01–15

| Items | Evidence found | Closure attribution |
|---|---|---|
| D01–07 | `packages/engine/test/probabilities.test.ts` explicit119 tests; `matchupEffects` | M1/M2 executable tests exist; final frozen gate must rerun |
| D08 | `player-display-contract.test.ts` positive/negative raw/applied combined cap provenance | M2 executable test exists |
| D09 | Same file null/non-null JSON malformed identity rejection | M2 engine exists; actual DB schema/null constraint M3 |
| D10 | Archive stores identity; current branch has no young-copy implementation | M6 actual19-year copy inheritance; keep dependency open |
| D11 | Same file left-handed catcher rejection and legal alternatives | M2 executable test exists |
| D12 |14 approved SVGs registered; design static checks exist | Asset presence/static is not no-mirror visual verification; M4/M5 display verification, design art review |
| D13 | Same file all hands/sides/forms preserve6-ability overall/initial growth | M2 executable test exists |
| D14 | Archive age is available | Actual retired staff card is M6/M5; no staff-card execution proof found |
| D15 | NPC identity/pitch-form distribution is tested; same silhouette/palette rendering proof absent | M2 NPC identities; M4/M5 rendered cards; club copy palette M6 |

FX01–04 remain separate balancing experiments, not silently counted by PF unit tests. Roadmap120 places long club balance after M6; retain explicit unexecuted result status.

## Selective preserved work at `codex/m2-finish` `8edf1ba`

* `packages/engine/src/career-achievements.ts` plus `career-achievements*.test.ts`: source-bound A01/02/03/05/07–12, correction retention, cosmetic-only rewards/E90 outbox. A04/A06 are deliberately rejected/marked unavailable because this older branch lacks current national/posting domains. Port only this concern; extend current source predicates for A04/A06 and US service before claiming12/12. Existing tests are evidence of prior implementation, not fresh validation against current roots.
* `apps/api/src/native-career.ts` and web changes connect creation to actual HS engine, event acknowledgements/three advance modes/read-only records. This is useful M4/transport integration, not M2 completion. It only supports limited E01/02/03/41/43 choices and fixed H01/GROWTH2027 controls.
* `apps/web/src/screens/Create.tsx`, creation/API tests include secondary pitch input and native route integration. Preserve latest approved design when porting.
* Do not port duplicate `us-contracts.ts`/`us-contract-history.ts` or overwrite current national/posting/major/minor-market/US-origin code. Whole-branch merge loses current implementation. Club modules belong M6; preserve separately.

## Verification limits

This audit ran searches, reads, and read-only Git comparisons only. It did not run tests, alter implementation, merge branches, or validate Neon/browser/device behavior. Its status is GAP_AUDIT, not M2 PASS.
