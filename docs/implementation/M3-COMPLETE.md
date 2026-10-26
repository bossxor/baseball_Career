# M3 완료 — 계정·DB·세이브 명령 파이프라인

2026-10-26 · `main` 병합 대상 브랜치 `merge/m3-into-main` (원본 `m3/save-command-pipeline`).

## 완료 기준 (120 / 92)

| 게이트 | 상태 | 증거 |
|---|---|---|
| V02 | EXECUTED | Managed Better Auth JWT·JWKS·allowlist·owner 격리. [m3-v02-auth.test.ts](../../apps/api/test/m3-v02-auth.test.ts) |
| V03 | EXECUTED | Neon unique/멱등/rollback/F08. [m3-neon.test.ts](../../apps/api/test/m3-neon.test.ts) |

**이메일 재설정 실발송:** M3 범위에서 **의도적 보류**. Auth 콘솔에 shared email provider 경로만 두고, SMTP 실발송 실증은 운영 준비(M9)로 넘김. V02의 가입·JWT·allowlist·owner는 통과.

## API

- `GET /api/health`
- `POST /api/game-creations` (셸, creationId 멱등)
- `GET /api/saves`, `GET /api/saves/:id`
- `GET /api/saves/:id/career`, `GET /api/saves/:id/screens/:screenId` (M4 UI 셸 뷰)
- `POST/GET /api/saves/:id/commands` (`ALLOCATE_DEMO`, `UI_SEED`/`UI_ADVANCE`/`UI_CHOOSE`)

인증: Bearer JWT(Neon) 또는 `AUTH_MODE=dev` → `dev:<subject>`.

## 범위 밖 (의도적 · M2/후속)

- 풀 커리어 엔진 명령 매핑 (M2)
- 네이티브 login exchange (M8)
- `packages/engine` 게임 규칙 확장 없음 (demo allocate만 호출)

## 운영

- Neon `baseball_career` · branch `m3-dev`
- `.env`: `DATABASE_URL`, `DATABASE_URL_DIRECT`, `NEON_AUTH_BASE_URL`
- 스키마: `node scripts/m3-apply-schema.mjs`
