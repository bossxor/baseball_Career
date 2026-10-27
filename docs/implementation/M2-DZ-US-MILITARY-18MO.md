# M2-DZ — 해외(미국) 병역 18개월 달력

2026-10-27. 기준 DY `198eede`. DS의 FREEZE/TERMINATE·즉시 COMPLETED helper를 18개월 두 블록 경과 없이는 완료할 수 없게 보강했다.

## 구현

- `chooseUsMilitaryPlan`이 `service` 프로그램을 봉인: 계획 시즌+1 정규 전체, +2시즌 6월30일(14 U·국내와 동일 completionDays).
- `settleUsMilitaryServiceBlock`: 해당 서비스 시즌·SEASON_REVIEW에서만 다음 미완료 블록을 완료일 evidence로 봉인.
- `completeUsMilitaryService`: `completedBlocks===2`일 때만 COMPLETED. 시간 경과 없는 즉시 완료는 `US_MILITARY_SERVICE_INCOMPLETE`.
- 한국 등록/급여/상무 경로는 만들지 않음(DS와 동일).

## 검증

집중1/1. fixture로 서비스 시즌 달력 identity를 옮긴 뒤 두 블록 정산→완료. **native 미국 2시즌 실주행 year-transition E2E는 아님.**  
전체 npm run check 종료0: 엔진/API 765개 중763통과·실패0·Neon2건너뜀, 웹22/22. duration_ms 710245(테스트 636231.241). HTTP 스모크 통과. 검증 중 실행 소스 미편집. 증거 `evidence/M2-DZ-check.log`.

## 아직 아님

- year-transition 자동 settle 배선(순환 import 회피, 호출자가 SEASON_REVIEW에서 settle)
- 동결 계약 복귀 연봉/옵션 실기용, 99/24/PF, M6
