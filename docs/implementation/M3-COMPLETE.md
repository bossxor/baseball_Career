# M3 완료 — 계정·DB·세이브 명령 파이프라인

2026-10-26 · 브랜치 `m3/save-command-pipeline`.

## 완료 기준 (120 / 92)

| 게이트 | 증거 |
|---|---|
| V02 | Neon Managed Better Auth 활성(`m3-dev`). email/password 가입·JWT(`GET /token`)·JWKS 검증. allowlist 거부. owner 격리 404. [m3-v02-auth.test.ts](../../apps/api/test/m3-v02-auth.test.ts) · [로그](evidence/M3-COMPLETE-check.log) |
| V03 | Neon unique/멱등/rollback/F08. [m3-neon.test.ts](../../apps/api/test/m3-neon.test.ts) |

이메일 확인: Auth 설정에 OTP 방식 가능, m3-dev는 `require_email_verification=false`(개발). 재설정은 shared email provider 경로로 콘솔 설정 가능 — 이번 슬라이스에서 실제 메일 발송 실증은 생략(공유 SMTP 의존).

## API

- `GET /api/health`
- `POST /api/game-creations` (셸 세이브, creationId 멱등)
- `GET /api/saves`, `GET /api/saves/:id` (summary만)
- `POST/GET /api/saves/:id/commands` (행 잠금·receipt·revision)

인증: Bearer JWT(Neon) 또는 `AUTH_MODE=dev`일 때 `dev:<subject>`.

## 범위 밖 (의도적)

- 전체 커리어 생성 엔진 연결(M2/M4)
- 웹 UI·쿠키 로그인 화면(M4)
- 네이티브 login exchange(M8)
- `packages/engine` 수정 없음

## 운영

- Neon project `baseball_career` · branch `m3-dev`
- `.env`: `DATABASE_URL`, `DATABASE_URL_DIRECT`, `NEON_AUTH_BASE_URL`
- 스키마: `node scripts/m3-apply-schema.mjs`
