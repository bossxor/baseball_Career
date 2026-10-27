# GPT 검증 인계 — M2-DO

작업 트리: `C:\Users\N-052\.codex\visualizations\2026\10\16\01a142f8-66ea-7782-ba3e-b52df94ae1be\baseball-career-m2`
브랜치: `codex/m2-career-engine`
구현 커밋: `26f355714f8e65f1a208b1244497664f4946758b`
인계 본문 커밋: `ed7c17372ad491a90e567b42fc92bca456fa6acb`
이 해시를 본문에 적은 커밋이 그 다음 팁이다. `git rev-parse HEAD`와 `git status --short`로 확인할 것. 강제 푸시 없음. `V:\.git` 없음.

## 1. 브랜치·커밋·푸시·작업 트리

- 기준이었던 DN: `c95f2518409e5463e76331768d57725a656adf39`
- main 병합: `25c7905` Merge remote-tracking branch `origin/main` into `codex/m2-career-engine`
- DO 구현: `26f355714f8e65f1a208b1244497664f4946758b` 푸시됨
- 인계 본문: `ed7c17372ad491a90e567b42fc92bca456fa6acb` 푸시됨
- 원격: `origin/codex/m2-career-engine`. main에는 푸시하지 않았다.
- 구현 커밋과 인계 본문 커밋의 작업 트리는 깨끗했다.

## 2. 병합한 main과 충돌

- 가져온 main: `f087e00` Merge PR #13, 부모 `6cf02c3` `fix(m3-m9): close verified API, web and Android defects`
- 병합 베이스: `7e8180a`
- 충돌 없음. ort 병합. DN을 지우지 않았다.
- 미커밋 변경은 인계 문서 작성 전에 없었다.

## 3. 구현한 범위와 남은 범위

구현:

- 적립 MLB 6시즌이고 남은 보장 연차가 없으면 현재 구단 FA 1건을 미리 보고 체결한다.
- 체결 연봉은 기존 `usMajorContractValue`. 기간은 기존 `usMlbOfferYears` (시작 나이 ≤29면 5, ≤32면 3, ≤35면 2, 그 외 1).
- 보장 연차가 남으면 다음 해는 그 연봉을 다시 계산하지 않고 1년만 줄인다.
- 옵션 3시즌을 쓰면 강등 제안 전에 `STAY` 또는 `FA`를 기록한다. `STAY`만 강등 제안으로 넘어간다. `FA`는 선수를 옮기지 않는다.

미구현:

- 다른 구단 명단 교체와 복수 제안. 설계 13의 구단 비교.
- KBO 포스팅, 해외 FA, 국내 복귀, 재도전 (완료 계획 5).
- 해외 병역, 국가대표 대회 경기 (완료 계획 6).
- 남은 99사건, 24경로 해시, PF-D (완료 계획 7–8).
- API 명령, 저장 화면, 브라우저, Neon, APK.
- `US_MAJOR_FA_UNFUNDED` 분기의 실행. 통제 fixture 구단은 연봉을 낼 수 있다.

M2 영역은 약 50%로 유지한다. 이 묶음으로 완료가 아니다.

## 4. 파일·함수·호출

- `packages/engine/src/us-major-renewal.ts`
  - `usMajorRenewalPreview`, `startNextUsMajorSeason`: 보장 연차가 있으면 동결 연장. 6시즌 적립이고 연차가 1이면 여전히 거부.
  - `usMajorFreeAgencyPreview(c, funding)`, `acceptUsMajorFreeAgency(c, revision, funding)`
- `packages/engine/src/us-major-history.ts`
  - `usMajorAnnualContract`, `usMajorGuaranteedContract`, `usMajorFaContract`
  - `openingUsMajorYear`: 남은 연차는 보장 계약, 연차 1에서 금액이 같으면 FA 계약 키를 허용.
- `packages/engine/src/us-year-transition.ts`
  - `stageUsControlledMajorYear(c, revision, allowFreeAgent=false)`
  - FA 체결만 `allowFreeAgent=true`. 보장 연차 연장은 세 번째 인자 없이 통과.
- `packages/engine/src/us-contract-value.ts`: `usMajorContractValue`, `usMlbOfferYears` 기존 식.
- `packages/engine/src/us-levels.ts`: `recordUsMinorOptionChoice`. `reviewUsLevel`이 `consent==='STAY'`가 아니면 `MINOR_CONSENT_REQUIRED` 또는 `OPTION_FA_ELECTED`.
- `packages/engine/src/index.ts`는 모듈을 그대로 다시보낸다.
- 테스트: `packages/engine/test/us-major-renewal.test.ts`

호출: `acceptUsMajorFreeAgency` → preview/market → `stageUsControlledMajorYear(..., true)` → `fundUsMinorYear` → 루트4 아카이브. `startNextUsMajorSeason`은 그 다음 해에 `usMajorGuaranteedContract`.

## 5. 엔진에서 화면까지

엔진 함수만 있다. `apps/api`는 `startNextUsMajorSeason`과 `acceptUsMajorFreeAgency`를 호출하지 않는다. 저장 명령, 화면, 웹 라우트에 연결되지 않았다. 급여 차감은 엔진 인벤토리 예산에서 한 번 한다. 계약금 원장에는 넣지 않는다.

## 6. 저장

- `schemaVersion`은 4를 유지한다. 구버전 루트 1–3 분기는 바꾸지 않았다.
- 계약 키 추가: `us-major-fa`, `us-major-guarantee`. 기존 `us-major-annual`은 그대로다.
- 시즌 옵션에 `consent?: 'STAY'|'FA'`만 추가했다. 없는 옛 저장은 선택이 없는 것으로 읽는다. 다음 시즌으로 옵션을 복사할 때 `used`와 `seasons`만 넘기고 `consent`는 버리므로 해마다 다시 고른다.
- 별도 마이그레이션 함수는 없다. 깨진 아카이브는 `openingUsMajorYear`가 `US_MAJOR_RENEWAL_QUOTE_CHANGED` 또는 `INVALID_US_MAJOR_YEAR_HISTORY`로 거부한다. 실패 시 원본 객체를 바꾸지 않는다.
- 복구: 거부된 저장을 자동으로 고치지 않는다. 원본 커리어를 유지하고 명령을 다시 내지 않는다.

## 7. 테스트

- 환경: Windows, 저장소 위 경로, `npm run check`
- 결과: 종료 0. 엔진/API 725개 중 723 통과, 실패 0, 건너뜀 2 (`Neon V03`, `V02 Managed Auth`). 웹 22/22. `duration_ms 917911.8787`. 벽시계 `elapsed_ms 1037913`.
- 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`
- 증거: `docs/implementation/evidence/M2-DO-check.log`
- 집중 명령: `packages/engine`에서 `npx tsx --test test/us-major-renewal.test.ts`

## 8. 실제 실행과 fixture

- 실제 경기 시뮬레이션으로 주장하지 않는다.
- `closedUsMajorFixture`와 `finishControlledMajorSeason`으로 6시즌을 닫은 뒤 FA를 체결하고, 그 다음 통제 시즌을 한 번 더 닫아 동결 연봉을 확인했다.
- 옵션 선택은 선수를 옮기는 경기 없이 함수만 검사했다. `reviewUsLevel`의 24경기 강등까지 이 묶음에서 다시 돌리지 않았다.
- 브라우저, Neon, APK는 실행하지 않았다. Android 검사는 셸 정적 검사다.

## 9. 알려진 한계

- `US_MAJOR_FA_UNFUNDED`는 예산이 연봉보다 작을 때 던진다. fixture 예산을 0으로 만들면 커리어 검증이 먼저 깨져 이 분기를 실행하지 못했다.
- 다른 구단 제안은 일부러 만들지 않았다. 빈 성공으로 위장하지 않는다.
- 옵션 `FA`는 자유계약 시장을 열지 않는다. 강등만 막는다.
- 아카이브는 시즌 전체를 복사한다. 이번 묶음이 새로 만든 누수는 아니고, 장기 원장 분리는 아직이다.
- 엔진/저장/화면 병목을 따로 재지 않았다. 화면 경로는 없다.
- shortcut: FA 체결과 연간 재계약이 아카이브 작성 코드를 각각 가진다.

## 10. 사용자 결정

이 묶음에서 새로 확정한 게임 숫자는 없다. 연봉과 기간은 2026-10-27에 이미 설계 13과 14에 있는 값을 사용했다. 원소속만 체결하는 것은 구현 한계이지 새 규칙이 아니다.

## 11. GPT가 먼저 재현할 것

1. `npm run check`를 다시 돌리기 전에 집중 테스트로 FA 급여·연차·계약금 1회·원본 다이제스트를 재현한다.
2. 같은 커리어에 `acceptUsMajorFreeAgency`를 두 번 호출하면 두 번째는 개정 불일치로 거부되고 첫 결과가 유지되는지 본다.
3. 보장 2년차의 연봉이 성적과 무관하게 1년차와 같은지, 연차가 1 줄었는지 본다.
4. 옵션 `used` 2는 거부, 3에서 `STAY` 후 같은 선택은 개정을 올리지 않는지, `FA`로 바꾸면 `US_OPTION_CHOICE_CONFLICT`이며 등록 레벨이 MLB인지 본다.
5. API와 화면에서 이 함수로 가는 경로가 없는 것을 검색으로 확인한다.
6. 문제가 있으면 재현 테스트를 먼저 남기고, 검사를 지우거나 단정을 약하게 만들지 말고 고친다.

## 12. 재현 입력과 예상

명령:

```
cd packages/engine
npx tsx --test test/us-major-renewal.test.ts
```

입력은 테스트 안의 `closedUsMajorFixture()`와 `funding` (구단마다 `addedBudgetUsd: 20_000_000`). 별도 사용자 seed를 넣지 않는다.

통과 시 기대:

- 6시즌 통제 뒤 `usMajorRenewalPreview`와 `startNextUsMajorSeason`은 `US_MAJOR_RENEWAL_NOT_AVAILABLE`.
- 옛 개정으로 체결하면 `REVISION`. 원본 다이제스트는 그대로.
- 제안 1건, `organizationId`는 주인공 구단. 한 차례 실행에서 그 제안은 구단 `US15`, 5년, 연봉 `9904000` USD였다. 테스트는 이 리터럴 대신 미리보기와 체결값이 같은지 본다. 선수를 바꾸면 금액은 달라질 수 있다.
- `signingBonusUsd === 0`, `SIGNING_BONUS` 수입은 1건, `records` 참조는 같다.
- 이듬해 계약 연봉은 같고 `years`는 1 작다. 계약금은 여전히 1건.
- 옵션 `used < 3`은 `US_OPTION_CHOICE_NOT_REQUIRED`. `STAY`는 개정 +1. 같은 선택은 같은 객체. 반대 선택은 `US_OPTION_CHOICE_CONFLICT`. 레벨은 `MLB`.

전체 검사: 저장소 루트에서 `npm run check`. 기대는 위 7절과 같다. 건너뜀 2건은 Neon 환경 부재이며 삭제하지 않는다.

## GPT에게 요청하는 검증

완료 주장만 믿지 말 것. 아래를 재현한 뒤 고칠 것.

- 각 기능의 연결 누락과 데이터 형식·식별자·통화·날짜 불일치
- 중복 명령·동시 저장·응답 유실·오래된 revision에 따른 동기화 오류
- 저장→종료→재개와 연속 실행 결과의 일치
- 계약금·급여·성장·보상·서비스타임 중복 및 누락
- 부분 실패 시 원본 보존과 원자성
- 같은 seed·입력에서 결과를 유지하는지
- 장기 기록 보관에 따른 정상적인 메모리 증가와 실제 누수의 구분
- 불필요한 복제·전체 원장 순회·직렬화·반복 조회
- 엔진 처리·저장·화면 렌더의 병목을 각각 측정
- Null·누락·오염 데이터의 검증과 오류를 숨기는 기본값 처리
- 수정 전 재현 검사와 수정 후 회귀 검사
- 실제 Neon·브라우저·APK 검증 여부를 명확히 구분

게임 규칙과 정상 결과를 유지할 것. 수정 후 전체 `npm run check`, `STATUS.md` / `PROGRESS.md` / `NEXT-SESSION.md`와 증거 로그 갱신, 커밋, `origin/codex/m2-career-engine` 푸시까지 할 것. 강제 푸시와 기존 변경 삭제 금지. 비밀키와 `.env`는 넣지 말 것. PC를 끄지 말 것.
