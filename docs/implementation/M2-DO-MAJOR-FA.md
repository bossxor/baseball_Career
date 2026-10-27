# M2-DO — 원소속 MLB FA와 옵션 소진 선택

2026-10-27. DN의 1년 재계약 다음에 붙인다. 설계 13의 연봉식과 나이별 5/3/2/1년을 그대로 쓴다. 새 숫자는 없다.

## 한 일

- 적립 MLB 6시즌이고 남은 보장 연차가 없으면 `usMajorFreeAgencyPreview` / `acceptUsMajorFreeAgency`.
- 제안은 현재 구단 하나. 연봉은 `usMajorContractValue`, 기간은 `usMlbOfferYears`. 계약금은 0이고 기존 계약금 수입은 다시 넣지 않는다.
- 보장 연차가 남으면 `startNextUsMajorSeason`이 그 연봉을 재계산하지 않고 1년씩 줄인다.
- 옵션 `used>=3`이면 강등 제안 전에 `recordUsMinorOptionChoice('STAY'|'FA')`. 같은 선택은 개정 번호를 올리지 않는다. 다른 선택은 `US_OPTION_CHOICE_CONFLICT`. STAY만 강등 제안으로 넘어가고, FA는 `OPTION_FA_ELECTED`로 남으며 선수를 옮기지 않는다.

## 하지 않은 일

- 다른 구단 명단 교체. 설계 13의 구단 비교는 미구현이다.
- 예산이 연봉보다 작을 때의 `US_MAJOR_FA_UNFUNDED`. 통제 fixture 구단은 연봉을 낼 수 있어 이 분기를 실행하지 않았다.
- 포스팅, 국내 복귀, 해외 병역, 국가대표.
- API 명령, 저장 화면, 브라우저, Neon, 실기기.

## 검사

통제 6시즌 뒤 FA 체결과 이듬해 동결 연봉은 `packages/engine/test/us-major-renewal.test.ts`. 이것은 8790경기 시즌이 아니다. 전체 `npm run check` 종료 0. 엔진/API 725개 중 723 통과, 실패 0, Neon 환경 부재 2건 건너뜀. 웹 22/22. duration_ms 917911.8787. 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. 벽시계 elapsed_ms 1037913. 증거는 `docs/implementation/evidence/M2-DO-check.log`. 브라우저, Neon, 실기기는 실행하지 않았다.

## 호출

`acceptUsMajorFreeAgency` → `stageUsControlledMajorYear(..., true)` → `fundUsMinorYear` → 루트4. 화면과 저장 API는 이 함수를 호출하지 않는다.
