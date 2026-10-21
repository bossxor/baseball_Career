# M2-BC — 프로 시즌 연말 마감(노쇠·건강·미사용 강화)

2026-10-21. 학교의 연말 마감(closeSchoolSeasonForKbo)과 같은 순서로 프로 한 시즌을 닫는 `closeKboSeason`을 추가했다. 새 게임 수치/확률·설정·DB 스키마 변경은 없다.

- SEASON_REVIEW에서만, 열린 사건이 없고 아직 닫지 않은 시즌에만 실행한다.
- 정규 시즌 성장(`settleKboSeasonGrowth`의 PRO 기간)이 먼저 지급돼 있어야 한다(KBO_SEASON_GROWTH_NOT_SETTLED).
- 이번 시즌 특별강화를 쓰지 않았으면 명시적 포기(`forfeitUnusedTraining=true`)가 있어야 한다(TRAINING_FORFEIT_REQUIRED). 포기는 기존 training.ts의 SKIP으로 시즌 기회를 성장 없이 사용한다. 시즌 리뷰 단계는 모든 예정 경기가 끝났다는 뜻이므로 창은 열린 것으로 계산한다.
- 노쇠를 세계 성장 달력 전체 경과일로 한 번 적용하고(`finalizeSeasonGrowth`) 시즌 건강을 닫는다(`closeSeasonHealth`, 해당 시즌 MAJOR 부상 정리).
- 결과 영수증 `seasonClose`(시즌·노쇠 손실·포기 여부)를 남긴다. 나이 증가·계약·다음 세계 시즌 개시(72의 연도 전환)는 다음 단계다.

## 검증

kbo-season-growth 3/3(신규: 성장 미지급 거절, 강화 포기 필요, 포기 후 노쇠 원장 확정·건강 시즌 마감·강화 사용 기록·영수증, 재마감·잘못된 단계 거절). 첫 전체 검사는 lint(prefer-const) 1건으로 실패했고 수정 후 재실행했다. 전체 `npm run check` 단일 실행 399/399 통과·실패 0(890.2초). [전체 검사](evidence/M2-BC-check.log).
