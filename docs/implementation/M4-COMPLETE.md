# M4 완료 — 웹 핵심 12화면 (+ HTTP 셸)

2026-10-26. **마일스톤 마감.** M2 풀 엔진 명령 매핑은 범위 밖(M2 후속). UI 셸 + M3 파이프라인으로 핵심 루프 닫힘.

## 완료 기준 (120 M4)

| 항목 | 증거 |
|---|---|
| 핵심 12화면 렌더 | S01–S09·S22·S23·S28, 상태 문구=catalog |
| 이어하기 | S01 resume → `#/career/:id` |
| 실제 API 연동 | `createHttpApi` + `UI_*` / career·screen GET |
| 키보드 | 생성 form Enter 다음/확정; IME 조합 중 Enter 진행 차단 |
| 한글 입력 | `lang=ko` · compositionstart/end · 조합 중 오류 숨김 |
| V08 일부 | 터치≥44/48 · focus 3px · 16px · reduced-motion · 웹폰트 swap — [v08-a11y.test.ts](../../apps/web/test/v08-a11y.test.ts) |

## 구현 요약

- fixture + HTTP `PlayballApi`, 로그인 게이트(Neon Auth / 개발 토큰)
- revision 충돌 → `conflict` + 재로드; 오프라인 → `OFFLINE`
- API UI 셸: `UI_SEED` / `UI_ADVANCE` / `UI_CHOOSE`

## 검증

- `npm run test:web` (카탈로그·화면·HTTP·로그인·V08 정적)
- `apps/api/test/m4-ui-shell.test.ts`
- web typecheck / vite build / smoke(health.auth)

## 후속 (M4 밖)

| 항목 | 넘김 |
|---|---|
| 풀 M2 커리어 엔진 명령 | M2 |
| 대표 픽셀·200% 확대·스크린리더 실기기 | M5 / V08 전부 |
| Neon 실계정 브라우저 E2E(비밀값) | 운영 환경에서 수동 |

## 환경

```
VITE_API_BASE=http://127.0.0.1:8787
VITE_AUTH_BASE=<NEON_AUTH_BASE_URL>   # 선택
VITE_DEV_TOKEN=dev:<allowlisted-subject>
```
