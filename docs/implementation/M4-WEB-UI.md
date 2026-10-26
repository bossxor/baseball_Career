# M4 — 웹 UI 핵심 화면 (진행 기록)

2026-10-26. `apps/web` DTO + `@playball/rules`. 엔진/DB 패키지는 웹 번들에 넣지 않음.

## 핵심 12개 화면

S01–S09 · S22 · S23 · S28. 상태 문구 = `screen-state-catalog.json`.

## 구현됨

- 뼈대·S01–S03·Decision(S04–S09/S22/S23/S28)·fixture 멱등.
- **HTTP 경계**: `createHttpApi` (`apps/web/src/http.ts`). `VITE_API_BASE`(+`VITE_DEV_TOKEN`) 있으면 사용, 없으면 fixture.
- **API UI 셸**: `UI_SEED` / `UI_ADVANCE` / `UI_CHOOSE` + `GET …/career` · `GET …/screens/:id` (`apps/api/src/ui-shell.ts`). M3 명령 파이프라인 재사용. 풀 커리어 엔진 아님.

## 검증

- `npm run test:web` 14
- `apps/api/test/m4-ui-shell.test.ts` + 기존 m3-pipeline
- web typecheck/build

## 미완료

풀 M2 엔진 커리어 명령 매핑, 실 Neon+Auth 브라우저 E2E, IME/확대/서체 실기, 오프라인·충돌 UI, 구단/설정(M5).
