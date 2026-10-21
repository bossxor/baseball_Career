# M2-AY — 프로 시즌 마감 T16과 정규 시즌 성장 정산

2026-10-21. 프로 정규 시즌 마감에 T16 판정을 연결하고, 시즌 리뷰 단계의 성장 정산 명령을 추가했다. 새 게임 수치/확률·설정·DB 스키마 변경은 없다.

## 시즌 마감 T16

- `advanceKboCareer`가 마지막 예정일을 넘겨 `SEASON_REVIEW`로 들어갈 때 `settleStarterSeasonTraits`를 한 번 실행한다(107 §7). KBO·FUTURES 중 한 대회에서 선발 outs가 `3×G` 이상이면 그 시즌을 충족으로 센다. 학교 기록을 포함한 연속값이 5가 되면 T16을 해금한다.
- 해금 영수증의 리그는 실제 충족 근거 대회(선발 outs/G가 큰 순)로 적는다. `settleStarterSeasonTraits`와 `refreshCareerTraits`는 이제 같은 `TraitSource` 구조 타입을 받아 학교·프로가 함께 쓴다. 학교 경로의 동작은 바뀌지 않았다.

## 정규 시즌 성장 정산

- `settleKboSeasonGrowth(career, revision)`: SEASON_REVIEW에서만 실행한다. 42의 규칙대로 한 개의 PRO 기간(세계 성장 달력 전체 [0,W), levelSeasonDays=W)을 만들고, 출장 분모는 PRO 기준(타자 PA 500, 선발 outs 450, 구원·마무리 outs 150)이다. 출장 수는 이번 시즌 KBO·FUTURES 공식 정규 경기의 내 PA 또는 outs 합이다. 재활 비율은 경기가 있었던 날 중 재활 중이던 날의 비율로, 닫힌 일마감 영수증의 부상/회복 순서로 계산한다. 이전 시즌에서 이어진 부상은 재활 상태로 시작한다.
- 기존 시즌 성장 원장(`settleClosedGrowthPeriods`)을 그대로 쓰므로 같은 기간 키 재호출은 추가 지급이 없다(duplicate). 일마감 영수증이 처음부터 끝까지 이어지지 않으면, 같은 날 두 리그 출장이 있으면, 재활 중 출장이 있으면 거절한다.
- 시즌 중 집중/유형 변경 이력이 둘 이상이면 아직 기간 분할을 지원하지 않아 `UNSUPPORTED_PRO_PLAN_SPLIT`로 거절한다(프로 MID 변경 창이 아직 없어 현재 경로에서는 발생하지 않음). 노쇠·나이·연도 전환은 연말 단계로 남긴다.

## 검증

kbo-progress 8/8(신규: 프로 T16 정산·리그 표기·재처리0, 마지막 날 이후 SEASON_REVIEW 진입과 정산 1회·이후 진행 거절)과 kbo-season-growth 2/2(통제된 시즌 리뷰 fixture에서 기대 예산 일치·1회 지급·재처리 duplicate, 잘못된 단계·일마감 누락·이중 출장·재활 중 출장 거절). 두 리그 720경기씩 실제 완주는 단위 테스트 범위 밖이며 일마감 자체는 kbo-day/kbo-progress가 검증한다. 전체 `npm run check` 단일 실행 389/389 통과·실패 0(869.0초): lint·소스/테스트 타입·전체 테스트/build·M1 골든·이벤트 동기화·설계 정적10종 포함. [전체 검사](evidence/M2-AY-check.log).

## 미완료

프로 MID 유형/집중 변경 창과 기간 분할, 연말 노쇠·나이·연도 전환·새 세계 시즌, 포스트시즌, AI 로테이션 재편성, 계약·연봉 지급, API/계정/DB/UI.
