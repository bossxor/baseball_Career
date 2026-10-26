# M4 완료 — 웹 핵심 12화면 (+ HTTP 셸)

2026-10-26. M2 풀 엔진 연결은 범위 밖. UI 셸 + M3 파이프라인으로 핵심 루프를 닫음.

## 완료

- 핵심 12화면: S01–S09 · S22 · S23 · S28 (`Decision` 공통)
- fixture `PlayballApi` + `createHttpApi` (`VITE_API_BASE`)
- 로그인 게이트: Neon Auth 이메일 (`VITE_AUTH_BASE`) 또는 개발 토큰
- revision 충돌 → `conflict` + 「최신 저장 불러오기」; 오프라인 → `OFFLINE`/`error`
- API `UI_*` 명령·career/screen GET

## 검증

- `npm run test:web` (로그인·충돌·HTTP stub 포함)
- `apps/api/test/m4-ui-shell.test.ts`
- web typecheck/build

## V08 / 명시적 보류

| 항목 | 상태 |
|---|---|
| 핵심 12 렌더·상태 문구 | 완료 (SSR 테스트) |
| 한글 IME 조합 중 실기 | 보류 (브라우저 수동) |
| 200% 확대·서체 실패 | 보류 (브라우저 수동) |
| Neon 실계정 브라우저 E2E | 보류 (환경 비밀값) |
| 풀 M2 커리어 명령 | M2 후속 |

## 환경

```
VITE_API_BASE=http://127.0.0.1:8787
VITE_AUTH_BASE=<NEON_AUTH_BASE_URL>   # 선택
VITE_DEV_TOKEN=dev:<allowlisted-subject>
```
