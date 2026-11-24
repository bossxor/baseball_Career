# M8 — Android Capacitor 셸

**완료:** [M8-COMPLETE](M8-COMPLETE.md).

| 항목 | 값 |
|---|---|
| applicationId | `kr.againplayball.app` |
| 서명 | debug (`assembleDebug`) |
| 기기 저장 전용 | `VITE_API_BASE` 없이 APK 빌드 · 로그인 없이 플레이 |
| 계정 저장 옵션 | `VITE_API_BASE`에 공개 HTTPS API 주소 설정 · 홈에서 ‘계정 저장 열기’ 선택 |

```powershell
$env:VITE_API_BASE = ''
npm run build:android
```
