# M6-G — 제안·재계약·불펜·다음 시즌 명령

2026-10-26. M6-F 뒤에 남은 화면 명령 4개를 같은 세이브 파이프라인에 붙였다. 새 확률은 없다. 브랜치 `m6/club-mode`.

- **`CLUB_OFFERS` / `CLUB_ROSTER` / `CLUB_BULLPEN` / `CLUB_NEXT`**: 기존 `planKboClubOffers`, `planKboClubRoster`, `setKboClubBullpen`, `startNextKboClubSeason`을 부른다. 시즌 마감 전에는 제안·재계약·다음 시즌이 거절된다.
- **화면**: 시즌 검토 중 S17은 희망 조건 제안(한 명, 최대 3명 목록의 앞쪽)과 제안 지우기, S14는 만료 계약의 재계약·방출 한 명, S13은 다음 시즌. S15는 불펜 자동/해제. 버튼 하나는 계획 전체를 그 한 명으로 바꾼다(D). 트레이드는 같은 `CLUB_ROSTER`의 `TRADE` 필드이며 상대 고르기 버튼은 없다(D).

## 검증

kbo-club-command에 불펜 8슬롯, 마감 전 제안/재계약/다음 시즌 거절을 더했다. 전체 `npm run check` 단일 실행 663개 중 통과661·실패0·건너뜀2(기존)·취소0(1922.2초) + 웹 21/21, lint/타입/build/골든/이벤트/설계10종 통과. [전체 검사](evidence/M6-G-check.log).

## 미완료

픽셀 배치, 12개 장기 시뮬레이션과 균형 판정, 구단 모드 병역·국제대회·AI 전략 라벨.
