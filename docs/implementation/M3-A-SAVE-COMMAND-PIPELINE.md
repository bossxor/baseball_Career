# M3-A — 세이브 명령 파이프라인 (첫 슬라이스)

2026-10-26 · 브랜치 `m3/save-command-pipeline` · 기반 `origin/main` df65ec2.

## 범위

- `packages/db`: profiles, auth_allowed_subjects, game_saves, command_receipts + bootstrap SQL
- API: Bearer `dev:<subject>` + allowlist (V02 스텁), `POST/GET /api/saves/:id/commands`
- 행 잠금 → receipt 멱등 → expectedRevision → `allocateCapped` 엔진 1경로 → 커밋
- 오류: AUTH_REQUIRED, SAVE_NOT_FOUND, COMMAND_ID_REUSED, REVISION_CONFLICT

## 검증

PGlite: apps/api/test/m3-pipeline.test.ts · [로그](evidence/M3-A-pipeline-test.log)

Neon `m3-dev` 브랜치(project baseball_career): apps/api/test/m3-neon.test.ts · [로그](evidence/M3-A-neon-test.log)

- V02 미인증/비허용 401
- V03 멱등 재시도, COMMAND_ID_REUSED, 실패 payload 후 revision 유지
- F08 동시 expectedRevision → 200 + 409(+currentRevision)
- Neon 실 DB에서 unique/rollback/경합 동일 통과

스키마 적용: `node scripts/m3-apply-schema.mjs` (`.env`의 `DATABASE_URL_DIRECT` 사용)

## 한계

- 인증은 아직 Bearer `dev:<subject>` + allowlist. Neon Managed Auth 교체 전.
- 게임 생성·전 명령 타입·공개 DTO·쿠키 세션 미구현.
- `packages/engine` 소스 변경 없음. `.env`는 Git 제외.

## 다음

Managed Auth로 `dev:` 스텁 교체. 커리어 명령 타입 추가 연결은 M2와 병행.
