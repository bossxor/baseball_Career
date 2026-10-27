# M2-ED — 국제 날짜 마감 부상 잔여 소모

2026-10-27. `closeCareerNationalDay`가 한국 예정 FINAL 경기마다 `settleTeamGameHealth`(teamKey=`{tournament}:KOR`)로 remainingTeamGames를 1회 차감한다. 같은 날 소속리그 마감과 이중 차감하지 않으며 KBO day closer를 호출하지 않는다. 정규 일마감 감사 확장·교체 worker는 후속.
