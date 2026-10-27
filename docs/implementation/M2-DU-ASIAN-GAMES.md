# M2-DU — 아시안게임 실제 대진·경기

2026-10-27.

## 한 일

- `national-tournament.ts`: AG 8개국·조별 RR·4강·동메달·결승. `competition:'INTERNATIONAL'` 실제 `createGame`/`runGameChunk`.
- 수락된 AG 초청 필요. 종료 후 `sealNationalCompetitionResult`. 금+출장 시 ATHLETE_ELIGIBLE.
- 상대 종합 65/55/45 프리셋(사용자 확정).

## 하지 않은 일

- WBC/OLY/P12 전체 대진, 28명 선발 점수 AI, 99사건 E47/E55, 24경로·PF-D, 화면.

## 검사

`kbo-national.test.ts` 4/4. 전체 `npm run check` 종료 0: 엔진/API 736개 중 734 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 776919.0793. 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. 증거 `evidence/M2-DU-check.log`.
