# M5 완료 — 나머지 33화면 셸

2026-10-26. **마일스톤 마감(셸)**. 풀 엔진=M2, 구단 실로직=M6, 픽셀·SR 실기기는 정책/수동으로 남김(M4와 동일 패턴).

## 완료 기준 (120 M5)

| 항목 | 증거 |
|---|---|
| 나머지 33화면 라우트·렌더 | S10–S21·S24–S27·S29–S45 → `Decision` + `#/play/:id/Sxx` |
| 상태 문구 | `m5-screens.json` = `screen-state-catalog` (웹 테스트) |
| fixture / HTTP 셸 | `apps/web` fixture · `apps/api` ui-shell 동기 |
| 허브 진입 | 홈 설정→S21(세이브 있을 때), 커리어 S10/S20/S21, S28 college→S34 |

## 검증

- `npm run test:web` (M5 stub 포함)
- `apps/api/test/m5-ui-shell.test.ts`
- web/api typecheck · vite build · `verify:design`

## 후속 (M5 밖)

| 항목 | 넘김 |
|---|---|
| 대표 픽셀·200% 확대·스크린리더 실기기 | 수동/허용 환경 (V08 잔여) |
| 화면별 엔진·구단 실데이터 | M2 / M6 |
| 내보내기·백업·중계 | M7 |

## 범위 메모

스텁 notice `M5 셸 — 엔진·구단 연동 전 스텁`. 선택 `back`은 career로만 되돌린다.
