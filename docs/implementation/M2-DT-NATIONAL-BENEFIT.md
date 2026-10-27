# M2-DT — 국가대표 차출·병역 혜택 원장

2026-10-27.

## 한 일

- `kbo-national.ts`: 초청 ACCEPT/DECLINE, 대회 결과 봉인, ATHLETE_ELIGIBLE 1회, 체육요원 3시즌→COMPLETED.
- INT13/14/15: AG 은·WBC 금은 상태 불변. OLY 동+출장→ATHLETE_ELIGIBLE. 이미 COMPLETED면 명예만.
- `KboMilitaryStatus`에 `ATHLETE_ELIGIBLE`/`ATHLETE_SERVICE` 추가. 연도 전환에서 duty 시즌 소모.

## 하지 않은 일

- 28명 선발 점수/대진/실제 국제 경기 시뮬, S24/S25 화면, 99사건 E47/E55 도메인 연결, 24경로·PF-D.

## 검사

`packages/engine/test/kbo-national.test.ts` 3/3. 전체 `npm run check` 종료 0: 엔진/API 735개 중 733 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 619230.9032. 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. 증거 `evidence/M2-DT-check.log`.
