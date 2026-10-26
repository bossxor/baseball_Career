# M7 — 내보내기·백업 (진행)

2026-10-26. V04 슬라이스: owner-only private 파일 + 백업 스냅샷.

## 이번 슬라이스

| 항목 | 상태 |
|---|---|
| `private_files` 테이블 | READY |
| `POST/GET /api/saves/:id/backups` | 멱등 requestId |
| `GET /api/files/:id` · `/content` | hash 헤더 · Cache-Control private · 타 owner 403 |
| 복원 job / PNG / 연대기 / 중계 | 후속 |
| 웹 S20 실버튼 연동 | 후속 |

## 검증

- `apps/api/test/m7-private-files.test.ts`
