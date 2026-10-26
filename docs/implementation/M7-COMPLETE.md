# M7 완료 — 내보내기·백업·연대기 JSON (셸)

2026-10-26. **마일스톤 마감(파일 셸)**. PNG 픽셀 렌더·중계 감상·실기기 공유는 후속(M8/수동).

## 완료 기준 (120 M7 / V04 일부)

| 항목 | 증거 |
|---|---|
| private 파일 소유·hash | `private_files` · `X-Content-SHA256` · 타 owner 403 |
| 게임 백업 | `POST/GET .../backups` 멱등 |
| 복원 | `POST /restores/preview` · `/restores` 새 saveId, 원본 불변 |
| 연대기 JSON | `POST .../exports/chronicle` · `notAGameBackup` · 24h TTL · 비밀값 제외 |

## 검증

- `m7-private-files.test.ts` · `m7-restore.test.ts` · `m7-chronicle-export.test.ts`

## 후속

| 항목 | 넘김 |
|---|---|
| PNG 1080×1350 카드 렌더 | 폰트/이미지 파이프 |
| 중계 감상 UI | UI 후속 |
| APK 파일 공유·로그인 복귀 | M8 |
| 객체 스토리지 실버킷 | 운영(M9) |
