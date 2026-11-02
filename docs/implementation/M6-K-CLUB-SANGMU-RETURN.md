# M6-K — 구단 상무 복귀

2026-10-26. 두 블록이 끝난 선수는 기존 `returnSangmuPlayers`로 원소속 구단 2군에 돌아온다. 1군 자동 기용은 없다. 아무도 지우지 않는다. 브랜치 `m6/club-mode`.

- **`returnClubMilitary` / `CLUB_SANGMU_RETURN`**: 복귀 대상이 없으면 `SANGMU_RETURN_NOT_DUE`. 정원 60이면 유닛에 남긴다.

## 검증

kbo-club-labels에 블록 완료 후 2군 복귀·1군 제외·유닛에서 빠짐을 더했다. 전체 `npm run check` 단일 실행 665개 중 통과663·실패0·건너뜀2(기존)·취소0(1036.2초) + 웹 21/21, lint/타입/build/골든/이벤트/설계10종 통과. [전체 검사](evidence/M6-K-check.log).

## 미완료

국제 창 경기, L04 50시즌×10 seed 실주행과 균형 판정, L01~L03·L05~L12 실행.
