# M6-F — 구단 저장/API/화면 셸

2026-10-26. 인계 5번의 연결만 한 묶음으로 넣었다. 새 확률은 없다. 난이도 기본값은 `REALISTIC`(D). 브랜치 `m6/club-mode`.

- **명령 5개** (`applyKboClubCommand`, 세이브 명령 `CLUB_CREATE`/`CLUB_START`/`CLUB_LINEUP`/`CLUB_FIRST_TEAM`/`CLUB_ADVANCE`): 기존 구단 함수를 부른다. 세이브 개정은 M3 영수증이 맡고, 같은 `commandId` 재전송은 경기를 다시 만들지 않는다. 구단 게임은 세이브 `state.club`에 둔다. `budgetWon` 같은 예산 숫자는 바꾸지 않는다.
- **읽기 S13–S19** (`kboClubScreen`): 홈·선수단·라인업·선수(잠재력 없음)·시장·순위·끝난 경기. 진행 중 경기는 종료로 적지 않는다. `GET /api/saves/:id/screens/S13`–`S19`.
- **화면**: `PlayballApi.createClub`/`club`/`clubCommand`. 웹은 엔진을 보지 않고 서버가 준 줄·링크·버튼만 그린다. 픽스처는 리그를 만들지 않는 자리표시(D)다. 제안·재계약·불펜 버튼과 픽셀 배치는 다음이다.

## 검증

kbo-club-command 1/1, API 저장 1/1(생성 멱등·재생성 거절·S13·자동 라인업), 웹 2/2(픽스처 멱등·HTTP `CLUB_CREATE`). 전체 `npm run check` 단일 실행 663개 중 통과661·실패0·건너뜀2(기존)·취소0(1998.2초) + 웹 21/21, lint/타입/build/골든/이벤트/설계10종 통과. [전체 검사](evidence/M6-F-check.log).

## 미완료

제안/재계약/불펜 명령의 화면 연결, 픽셀 배치, 12개 장기 시뮬레이션과 균형 판정, 구단 모드 병역·국제대회·AI 전략 라벨.
