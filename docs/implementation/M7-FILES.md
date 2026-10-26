# M7 — 내보내기·백업 (진행)

2026-10-26. V04 + 복원 셸.

## 슬라이스

| 항목 | 상태 |
|---|---|
| `private_files` 테이블 | READY |
| `POST/GET /api/saves/:id/backups` | 멱등 requestId |
| `GET /api/files/:id` · `/content` | hash · private · 타 owner 403 |
| `POST /api/restores/preview` · `/restores` | 새 saveId, 원본 백업무변경 |
| S20 / S45 fixture 안내 | 옵션 문구 (HTTP 연동 후속) |
| `POST .../exports/chronicle` | CHRONICLE_JSON · 24h TTL · 비밀값 제외 |
| PNG 카드 렌더 / 중계 | 후속 |

## 검증

- `apps/api/test/m7-private-files.test.ts`
- `apps/api/test/m7-restore.test.ts`
- `apps/api/test/m7-chronicle-export.test.ts`
