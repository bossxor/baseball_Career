# M8 완료 — Capacitor Android 셸

2026-10-26. **마일스톤 마감(패키징 셸)**. 실기기 설치·로그인 복귀·release 서명·업데이트는 후속(수동/V07·V10).

## 완료 기준 (120 M8 일부)

| 항목 | 증거 |
|---|---|
| applicationId | `kr.againplayball.app` |
| Capacitor 프로젝트 | `apps/web/android` · `MainActivity` |
| HTTPS API 게이트 | `assert-android-api-base` — 로컬/http 거부 |
| debug APK | `assembleDebug` (JDK 21) · gitignore `*.apk` |
| 정적 검증 | `npm run verify:android` |

## 결정

| 항목 | 값 |
|---|---|
| 패키지 | `kr.againplayball.app` |
| 서명 | debug 기본 키스토어 |
| API | `https://api.againplayball.kr` (DNS/배포는 M9) |

## 후속

| 항목 | 넘김 |
|---|---|
| 실기기 설치·로그인 복귀 | V07 / 수동 |
| release 키·versionCode | 저장소 밖 · V10 |
| App Links / Digital Asset Links | 운영 도메인 확정 후 |
| API DNS·호스트 | M9 |
