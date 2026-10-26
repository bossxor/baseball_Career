# M3-A — 세이브 명령 파이프라인 (첫 슬라이스)

2026-10-26 · 브랜치 `m3/save-command-pipeline` · 기반 `origin/main` df65ec2.

## 범위

- `packages/db`: profiles, auth_allowed_subjects, game_saves, command_receipts + bootstrap SQL
- API: Bearer `dev:<subject>` + allowlist (V02 스텁), `POST/GET /api/saves/:id/commands`
- 행 잠금 → receipt 멱등 → expectedRevision → `allocateCapped` 엔진 1경로 → 커밋
- 오류: AUTH_REQUIRED, SAVE_NOT_FOUND, COMMAND_ID_REUSED, REVISION_CONFLICT

## 검증

PGlite 통합: apps/api/test/m3-pipeline.test.ts · [로그](evidence/M3-A-pipeline-test.log)

- V02 미인증/비허용 401
- V03 멱등 재시도, COMMAND_ID_REUSED, 실패 payload 후 revision 유지
- F08 동시 expectedRevision → 200 + 409(+currentRevision)

## 한계

- Neon Managed Auth / 실 Neon 브랜치 미연결. `DATABASE_URL` + `.env.example` 준비만.
- 게임 생성·전 명령 타입·공개 DTO·쿠키 세션 미구현.
- `packages/engine` 소스 변경 없음.

## 다음

Neon `DATABASE_URL` 연결 후 같은 테스트를 실 DB에서 재실행. 관리형 인증으로 `dev:` 스텁 교체.
