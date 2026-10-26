# M9 완료 — 운영·배포 셸

2026-10-26. **마일스톤 마감(운영 셸)**. 실 DNS/TLS/호스트 결제·production migrate·메일 실발송·로고 배포 권리는 후속(V11/V12 실실행).

## 완료 기준 (120 M9 / V11·V12 일부)

| 항목 | 증거 |
|---|---|
| health | `GET /api/health` — 비밀 없음 |
| ready | `GET /api/ready` — DB+`game_saves` · 없으면 503 |
| version | `GET /api/version` — app/api/rules/schema/minClient |
| 자산 출처 | `asset-provenance.json` · `npm run verify:assets` (OFL) |
| 롤백 원칙 | [M9-OPS](M9-OPS.md) / 설계 29 |

## 검증

- `apps/api/test/health.test.ts`
- `npm run verify:assets`

## 후속

| 항목 | 넘김 |
|---|---|
| `api.againplayball.kr` DNS·TLS | 도메인/호스트 계정 |
| Neon production migrate | 운영 승인 |
| 메일 재설정 실발송 | 공급자 키 |
| 구단 로고 배포 권리 | V12 실확인 |
| M8 실기기·release | 수동 / V07·V10 |
