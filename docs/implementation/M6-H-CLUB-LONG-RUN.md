# M6-H — 장기 시뮬레이션 체크포인트

2026-10-26. 73의 L01~L12 목록을 그대로 두고, L04만 구단 시즌 루프에 저장한다. 50시즌을 돌리지 않았다. 경기 0인 체크포인트를 균형 통과로 세지 않는다. 브랜치 `m6/club-mode`.

- **`openClubLongRun`**: L04만 연다. 나머지 11개는 `LONG_RUN_NOT_WIRED`(계획만).
- **`stepClubLongRun`**: `maxDays` 0은 같은 개정. 1~7은 기존 시즌 시작/하루 진행을 부른다. `balance`는 `INCONCLUSIVE`만 허용하고 `PASSED` 저장은 거절한다.
- **재개**: JSON으로 넣고 빼면 `creationKey`가 같다.

## 검증

kbo-club-long-run 1/1(목록 12개, L01 거절, 0일 재개, PASSED 위조 거절). 전체 `npm run check` 단일 실행 664개 중 통과662·실패0·건너뜀2(기존)·취소0(1536.1초) + 웹 21/21, lint/타입/build/골든/이벤트/설계10종 통과. [전체 검사](evidence/M6-H-check.log).

## 미완료

L04 50시즌×10 seed 실주행과 균형 판정, L01~L03·L05~L12 실행, 구단 모드 병역·국제대회·AI 전략 라벨.
