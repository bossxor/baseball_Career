# 2026-11-10 현재 소스 우선 큐 — 86504ac

아래 `aab7027` 기준 표는 과거 감사다. 현재 소스에는 시즌 순위·역할·일부 CH와 은퇴 업적·수상·이정표 투영이 존재한다(`career-season-review.ts`, `career-retirement-summary.ts`). 이를 누락으로 재구현하지 않는다. 연결 코드는 최신 소스에서 실행 검증되지 않았다.

## 현재 실제 구현 작업

| 담당 | 누락·경계 |
| --- | --- |
| 엔진 03 | `us-career-entry.ts`, `us-minor-history.ts`, `us-minor-market.ts`, `us-military-plan.ts`: 독립 최초 1년의 실제 등록·계약 수명·시장·복무 복귀를 연결하고 6년/기존 저장 보존. `us-amateur-return.ts` 귀국 출신을 고교 직행으로 오분류하지 않는다. 사용자 확정 U: 국내 프로 계약 경력이 없는 독립 출신의 미국 종료 후 국내 복귀는 의무 준비 2시즌·국내 드래프트 평가 35세 상한, 선택 준비 예산 차감 0, 복무 중첩을 적용한다. 아직 엔진/API 연결과 검증은 미완료. |
| API 02 | `career-amateur-preparation-shell.ts`의 `applyAmateurPreparation` 정산 이후 `career-us-entry-shell.ts`의 `stageAmateurUsEntry` 및 실제 평가·서명·등록 연결 확인/구현. 현재 stage 호출은 학교·대학 shell에 있으며 독립 정산 shell에서 호출하지 않는다. 서버 실제 owner·원장 사용. |
| 대학 대표 04 | `college-national.ts`의 선발·경기·복귀 owner를 실제 동일 세계 KBO authority와 revision/공식 원장에 연결하고 API·화면까지 제공. `returnCollegeNationalTournament` 양쪽 원본/revision 및 원자 저장을 보존한다. |
| 은퇴 요약 | 사용자 확정 U: 확정 개인 수상·올스타 건수 우선, 동률 최신, 부족 시 공식 출장 최신 연도로 보충. 수상·선정 연도에 별도 출장 조건을 추가하지 않는다. API DTO 및 테스트 코드 작성, 실행 검증 대기. 순수 투영에서 취소·무효·중복·타인·리그별 연도 합산·출장0·구 저장 경계를 최종 확인한다. 기존 보관 원장의 중복 영수증 거부는 유지한다. |

### 독립 출신 귀국 U — 구현·최종 확인 경계

- 엔진: `us-amateur-return.ts`, `us-amateur-return-career.ts`의 출신 판별·검증과 `us-return-retry.ts`를 실제 독립 원장에 연결한다. 기존 고교/대학 출신·구 저장 및 선택 준비 예산·복무 중첩을 보존한다.
- API: `career-us-return-shell.ts`, `career-us-return-flow.ts` 및 재도전 shell/flow에서 실제 서버 소유 출신과 명령을 전달한다. 없는 권한·기록을 채워 넣지 않는다.
- 최종 검증: `packages/engine/test/us-amateur-return-career.test.ts`, `us-return-retry.test.ts`, `apps/api/test/m2-us-return-retry-http.test.ts` 등 관련 회귀를 작성/보강해 의무 2시즌·35세 상한 경계·예산 차감 0·복무 중첩·기존 출신/저장 보존을 확인한다. 지금 실행하지 않는다.
- 설계 14 변경의 `node docs/design/rebuild-design-package.mjs`와 `npm run verify:design`은 모든 구현 후 팀장 최종 검증 단계로 이월한다.

## 최종 검증 큐 — 지금 실행하지 않음

기존 `CANCELLED_BY_USER` 전체 check는 통과가 아니다. 최종 통합 소스에서 작성된 회귀를 포함해 `npm run check` 1회, 실제 독립 1년 계약 만료/재계약/복무 및 귀국 출신·대학 대표 양쪽 CAS/공식 기록 보존·기존 6년과 구 저장 호환·저장 분할/복원/재전송을 확인한다. 24경로·99사건·PF-D, 브라우저/실기기, 성능·원장 해시는 별도 환경과 증거를 기록하며 미실행은 PASS가 아니다. 추가 실행은 전체 구현 뒤 팀장이 조율한다.

# M2 남은 구현 큐 — 2026-11-10

기준 `aab7027a0dbe910a20afe7f9d7152f8ff59a0f67`. 정적 대조만 수행했다. 아래는 구현과 증거 부족을 분리한 작업 배정이며 M2 완료 판정이 아니다. 기존 WIP·원장·시드·권한과 호환성을 보존한다. 새 규칙이나 산식이 필요하면 임의로 정하지 않고 팀장에게 올린다.

## 과거 기준의 구현 누락 (현재 상태는 위 표 우선)

| 담당 | 파일 / 구체 작업 | 의존성 |
| --- | --- | --- |
| 02 API | `apps/api/src/career-season-review.ts`: SLB-05 결과에 현재 팀 성적만 있고 순위·역할 배지·CH 및 세부 보수는 투영되지 않는다. 실제 공개 가능한 확정 원장 값을 확인해 제공한다. 없는 값은 추정하지 않는다. | 01이 원장 출처 확인; 산식 미결이면 결정 요청 |
| 03 웹 | `apps/web/src/screens/SeasonReview.tsx`, `apps/web/src/model.ts`: 위에서 제공되는 확정 결과 값 표시. 기존 기록·성장 표시 유지. | 02 DTO |
| 02 API | `apps/api/src/career-retirement-summary.ts`: 현재 공개 archive는 선수·리그별 기록·수입만 요약한다. SLB-21의 주요 업적·빛난 3년·이정표에 쓸 공개 근거를 확인해 존재하는 확정 값만 투영한다. | 01 원장 확인; 승인 산식/공개 DTO가 없으면 결정 요청 |
| 03 웹 | `apps/web/src/screens/RetirementSummary.tsx`, `apps/web/src/model.ts`: 위에서 제공하는 은퇴 업적·3년·이정표를 표시한다. 기존 해외·2군·독립 기록과 수입 유지. | 02 DTO |

## 추가 호출자 조사 후 배정

### 2026-11-10 사건 호출자 정적 대조

| 우선순위 | 담당·파일 | 확인된 누락과 의존성 |
| --- | --- | --- |
| 높음 | 02 API 후속: `apps/api/src/career-college-shell.ts`, `engine-command.ts`, `career-views.ts` | 대학 대표 E44/E45: `packages/engine/src/college-national.ts`의 후보·선발·수락/거절 owner는 export돼 있지만 `apps/api/src`에 해당 함수/`COLLEGE_NATIONAL` 호출이 없다. 서버 소유 원본과 revision으로 선발 및 선택을 연결한다. 현재 02의 결산/은퇴 작업과 겹치므로 완료 후 배정. |
| 높음 | 02 API 후속, 이후 03 웹: 위 API 경계 및 `apps/web/src/screens/Flow.tsx` | 대학 대표 E46/E47: 같은 엔진의 대회 시작·경기·일 마감·혜택 확인 공개 명령이 없다. 확정된 owner를 호출하고 웹에서 서버 허용 선택지를 제공한다. 선발 연결에 의존한다. |
| 높음 | 팀장 결정 후 02 API, 03 웹: `college-national.ts`, 저장 명령 경계 | 대학 대표 E48/E55: 복귀·체육요원 owner는 있으나 API 호출이 없다. 특히 `returnCollegeNationalTournament`는 대학과 KBO 양쪽 원본/revision을 요구한다. 기존 소유권·CAS·원자 저장 경계를 확인하고 다중 원장 저장 방식이 필요하면 팀장에게 올린다. 임의 단일 저장이나 사용자 상태 주입 금지. |

근거: `packages/engine/src/index.ts`는 위 대학 대표 함수를 공개한다. `apps/api/src`와 `apps/web/src`에서 함수명 및 `COLLEGE_NATIONAL` 검색 결과 해당 호출이 없다. 이는 정적 호출 경계의 누락이며 런타임 재현은 아니다. 01의 독립 US 도메인 작업과 중복 배정하지 않는다.

10월 감사의 E21~29, E42, E56~57, E70~72, E73~74/76, E87, E90~93 카탈로그 전용 또는 도메인 부재 표기는 현재 소스의 해당 owner에 의해 오래되었다. E85는 `pro-trait-summary.ts`의 읽기 표면이므로 world event를 새로 만들지 않는다. 이 사실이 전체 경로의 검증 통과를 의미하지는 않는다. `NOT_PROVEN`만으로 구현 누락을 추가하지 않는다.

아래는 미구현으로 확정하지 않았다. 각 담당자는 현재 소스와 호출자를 대조해 실제 누락만 구현하고, 이미 연결된 기능은 중복 작성하지 않는다.

- 01 엔진: `packages/engine/src/pro-career-advice.ts`의 E12~E15 계획·확정은 이미 존재한다. 학교·대학 잔여 사건, 대표팀·병역·재도전의 기존 공개 owner와 허용 명령을 확인해 빠진 도메인 동작만 식별한다.
- 02 API: `apps/api/src/career-views.ts`, `career-flow-screen.ts`, 관련 `career-*-shell.ts`와 명령 라우팅을 대조한다. US 병역 shell은 이미 존재한다. 공개 owner에서 화면/명령으로 닿지 않는 실제 경로만 연결한다.
- 03 웹: `apps/web/src/screens/Flow.tsx`, 관련 화면과 API 모델을 대조해 서버가 제공하는 사건·대표팀·병역·재도전 명령의 도달 불가능한 선택지만 연결한다. 비가역 행동은 기존 확인 원칙을 따른다. 02 공개 계약에 의존한다.
- SLB-14 병역 결과의 3값·단계 카드 및 SLB-15 대표 결과는 기존 DTO와 화면을 먼저 대조한다. 실제 값이 없으면 01→02→03 순으로 연결하고 수치·혜택을 추정하지 않는다.

학교 훈련/E71/E73/US 최초 입단/독립 준비/대학 현역 복무/E36 연결은 기준 소스에 반영됐으나 실행 검증되지 않았다. 검증만으로 구현 완료를 선언하거나 옛 TODO를 재구현하지 않는다. M6, 미결정 134와 능력 상한 변경은 제외한다.

## 마지막 통합 검증에서만 실행

- 승인된 최종 통합 기준에서 전체 `npm run check` 1회: 테스트·타입·린트·빌드 및 기존 설계/Android 검사 포함. 작성만 한 신규 테스트와 환경으로 제외된 항목을 별도 기록한다.
- 실제 경기 시즌 완주와 24경로 native 증거를 통제 fixture 결과와 구분한다. 기존 native 4/24 및 복무 2년 통제 근거를 실제 완주로 올리지 않는다.
- 최신 코드의 학교·대학·KBO·US 흐름, 병역·대표·귀국/은퇴, 저장 분할·복원·재전송·권한/CAS와 기존 원장 보존을 확인한다. 대용량 PostgreSQL, Neon 및 인증 환경 키 부재는 제외 사유를 남긴다.
- PF-D/성능 측정과 결과 해시, 브라우저 접근성·375px/데스크톱 및 Android 실기기 실행은 각 환경과 증거를 구분한다. 미실행 항목은 통과로 표시하지 않는다.

이번 문서 작성에서는 테스트·시뮬레이션·빌드·타입·린트·검증 스크립트를 실행하지 않았다.

