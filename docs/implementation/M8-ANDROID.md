# M8 — Android Capacitor 셸 (진행)

2026-10-26.

## 결정

| 항목 | 값 |
|---|---|
| applicationId | `kr.againplayball.app` |
| 앱 표시명 | 다시플레이볼 |
| 서명 | debug 기본 키스토어 (`assembleDebug`) — release 키는 저장소 밖 |
| API | 빌드 시 `VITE_API_BASE` **https + 비로컬** 필수. 권장 호스트명 `https://api.againplayball.kr` (DNS/프록시는 운영에서 연결) |

## 빌드

```sh
set VITE_API_BASE=https://api.againplayball.kr
set VITE_AUTH_BASE=<NEON_AUTH_BASE_URL>
npm run build:android
```

산출: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`

## 검증

- `node --test scripts/assert-android-api-base.test.mjs`
- Capacitor `appId` = `kr.againplayball.app`
- 실기기 설치·로그인 복귀·업데이트는 후속(V07/V10)
