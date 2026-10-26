# M5 — 나머지 화면 셸 (진행)

2026-10-26. **진짜 서브** 경로: M5 → M7 → M8 → M9. M2·M6는 다른 환경.

## 범위

| 포함 | 제외 |
|---|---|
| 나머지 33화면(S10–S21·S24–S27·S29–S45) Decision 스텁 | M2 풀 엔진 명령 |
| `#/play/:saveId/Sxx` 라우트 확대 | M6 구단 AI·경제 실로직 |
| fixture + API `ui-shell` 카탈로그 동기 | 픽셀·SR 실기기(후속) |
| 홈 설정(세이브 있을 때 S21), 커리어 허브(S10/S20/S21) | |

## 패턴

- 공통 `Decision` + 상태 문구=`screen-state-catalog` / `m5-screens.json`
- M5 스텁 옵션: `back` → career; S28 `college` → S34; S09 `archive` → S10
- notice: `M5 셸 — 엔진·구단 연동 전 스텁`

## 검증

- `npm run test:web`
- `apps/api/test/m5-ui-shell.test.ts`
