# M2-DS — 해외(미국) 병역 기한 계획

2026-10-27.

## 한 일

- `us-military-plan.ts`: 28세 기한 `MILITARY_PLAN_REQUIRED`일 때 `FREEZE`/`TERMINATE` 선택.
- `FREEZE`는 `militaryReturnOption`이 true일 때만. 계약 키를 동결하고 등록은 유지.
- `TERMINATE`는 주인공을 reserves로 내리고, 같은 kind 예비/하위 레벨로 정원을 메운다. 한국 등록을 만들지 않는다.
- `completeUsMilitaryService`로 `COMPLETED`. 연도 전환 blocker 해제.
- `UsCareer.military` 상태: `UNRESOLVED|FROZEN_SERVICE|TERMINATED_SERVICE|COMPLETED|NOT_APPLICABLE`.

## 하지 않은 일

- 국가대표 차출/메달/체육요원, 99사건 도메인, 24경로·PF-D, API/화면.
- FREEZE 성공 경로는 major fixture의 서명 봉인을 깨지 않도록 집중 검사에 넣지 않았다(거절·TERMINATE·완료는 검증).

## 검사

`packages/engine/test/us-military-plan.test.ts` 1/1. 전체 `npm run check` 종료 0: 엔진/API 732개 중 730 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 726746.4544. 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. 증거 `evidence/M2-DS-check.log`.
