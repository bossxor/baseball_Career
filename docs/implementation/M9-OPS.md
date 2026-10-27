# M9 — 운영·배포 셸

**완료:** [M9-COMPLETE](M9-COMPLETE.md). 실호스트 결제·DNS·production 쓰기는 후속(V11).

## 공개 엔드포인트 (비밀 없음)

| 경로 | 의미 |
|---|---|
| `GET /api/health` | 프로세스 생존 |
| `GET /api/ready` | DB `SELECT 1` + `game_saves` 스키마 접근 · 없으면 503 |
| `GET /api/version` | app/api/rules/schema/minClient |

## 자산·출처 (V12 셸)

- `docs/implementation/asset-provenance.json`
- `npm run verify:assets` — 폰트 OFL 동봉 · `.env.example` 실자격 거부

## 권장 호스트 매핑 (미연결)

| 역할 | 호스트 |
|---|---|
| API | `https://api.againplayball.kr` |
| 웹(정적) | 동일 오리진 또는 별도 CDN — 운영 계정에서 확정 |
| Neon | `aws-ap-southeast-1` (설계 29 CLI 조회) |

## 롤백 원칙 (29)

1. 빌드 실패 → 현재 서비스 유지  
2. 호환 migration 실패 → 쓰기 중지·진단  
3. 런타임 회귀 → 이전 호환 앱/커밋으로 복귀  
4. DB drop / 강제 push / 일괄 리셋 = **금지**

## 검증

- `apps/api/test/health.test.ts` (ready/version)
- `npm run verify:assets`

## 후속 (실실행)

| 항목 | 차단 |
|---|---|
| DNS · TLS · 리버스 프록시 | 도메인/호스트 계정 |
| Neon production migrate | 운영 승인 |
| 메일 재설정 실발송 | M3 보류분 |
| 구단 로고 배포 권리 | V12 실확인 |
