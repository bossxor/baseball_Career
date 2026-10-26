# M6-J — 구단 상무 입대

2026-10-26. 기존 `selectSangmuCohort`와 `enlistSangmuCohort`로 한 시즌에 한 번 선발을 유닛으로 옮긴다. 복귀 두 블록과 국제 창 경기는 없다. 브랜치 `m6/club-mode`.

- **`enlistClubMilitary` / `CLUB_SANGMU`**: 시즌 진행·포스트시즌 중에는 `SANGMU_SEASON_LOCKED`. 같은 시즌 재호출은 `SANGMU_COHORT_ALREADY_ENLISTED`. 빠진 1군은 기존 선택기로 다시 채운다. 새 선수는 만들지 않는다.
- **관찰**: 입대 전에는 미리보기, 입대 후에는 유닛의 원소속 구단을 읽는다.

## 검증

kbo-club-labels에 입대 후 세계 선수 없음·로스터 문제 없음·재입대 거절을 더했다. 전체 `npm run check` 단일 실행 665개 중 통과663·실패0·건너뜀2(기존)·취소0(1193.8초) + 웹 21/21, lint/타입/build/골든/이벤트/설계10종 통과. [전체 검사](evidence/M6-J-check.log).

## 미완료

상무 복귀, 국제 창 경기, L04 50시즌×10 seed 실주행과 균형 판정, L01~L03·L05~L12 실행.
