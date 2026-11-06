# M2 Android shell audit — 2026-11-06

Branch head: codex/m2-career-engine (working tree, web worker's creation/flow screens included).

## 1. Checks
- `npm run verify:android` → PASS.
- `npm run assert:android-api` → fails without `VITE_API_BASE` (by design); with `https://api.againplayball.kr` → OK.

## 2. Debug APK (`apps/web/android/app/build/outputs/apk/debug/app-debug.apk`, not committed)
- size 10,259,678 B; sha256 `c316be8e7c5a9f8d04862773266451a2efb4ff0d9d9a09e5458e85996f44b70c`
- applicationId `kr.againplayball.app`, versionCode 1 / 1.0, minSdk 24, target/compileSdk 36, debuggable=true (debug build), allowBackup=false
- permissions: INTERNET + `kr.againplayball.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (AndroidX-generated, not ours)
- baked API base `https://api.againplayball.kr`; no `http://` endpoints in bundle (only the w3.org namespace string); capacitor.config: androidScheme https, allowMixedContent false
- log: `evidence/M2-ANDROID-build-20261106.log`

## 3. Defects
| # | Where | Status |
|---|-------|--------|
| D1 | `scripts/build-android.mjs` run(): `shell:true` split `C:\Program Files\nodejs\node.exe` → build failed on Windows | **fixed** (quote args) |
| D2 | same file: `gradlew.bat` not found by cmd without `.\` | **fixed** |
| D3 | `apps/web/src/screens/Create.tsx` step is state (`onStep`), not history. Hardware Back at step 2+ leaves `#/create` entirely (Capacitor back = `webview.goBack()`, else exit). Flow `#/flow/<id>` uses `location.hash=` so Back works there. | **open (web)** |
| D4 | `apps/web/index.html` viewport has no `viewport-fit=cover`. Verified in Capacitor 8.5.3 `SystemBars.java`: without it the native view is padded by system bars + IME, so content is never obscured; but no edge-to-edge and no `env(safe-area-inset-*)` use in styles.css. Not a bug, a design choice. | **info** |
| D5 | Soft keyboard: handled natively (decor padding = IME inset, SystemBars.java:~190). `.screen{min-height:100svh}` fine. Not device-verified. | info |
| D6 | Offline: `http.ts:53` maps `navigator.onLine===false` and fetch failure to `ApiError('OFFLINE')`; command intents retained in `sentCommands` for same-id retry. Memory-only: app kill loses pending intent (token also in sessionStorage → re-login). By design, not verified on device. | info |
| D7 | Manifest: only INTERNET; `allowBackup=false` (checked by verify:android); `.gitignore` has `*.jks`, `*.keystore`; no signing config in `app/build.gradle` (release unsigned). | OK |
| D8 | `release.minifyEnabled false` | open, release hardening later |
| D9 | No `dataExtractionRules` needed since allowBackup=false. | OK |

Suggested web diffs (m2-web owns):
- D3: in Create.tsx shell, push a history entry per step: `onStep = s => { history.pushState({step:s}, ''); setStep(s); }` plus a `popstate` listener restoring the step (or encode step in hash `#/create/NAME`).
- Optional D4: `viewport-fit=cover` + `.screen{padding-bottom:max(16px,env(safe-area-inset-bottom))}`; then Capacitor injects `--safe-area-inset-*` too.

## 4. Device test — SM-S948N (R5KL10FHTTN, Android 17, WebView 156), same debug APK
Evidence (app area only, status bar cropped, 1/3 scale): `evidence/M2-ANDROID-device-{1-login,2-home-api-fail,3-create-name,4-keyboard,5-create-step2}.png`, `evidence/M2-ANDROID-device-logcat-app.txt` (pid-filtered).

Device-verified:
- install + launch OK; login renders; content sits between status bar and nav bar (native padding, not edge-to-edge).
- "개발 토큰으로 계속" → Home. API unreachable (https://api.againplayball.kr): red box "진행을 확인하지 못했습니다… 연결과 저장 결과를 다시 확인하세요", 새 커리어/새 구단 buttons still usable, no crash. No explicit retry button on Home.
- Create form: step 1 (이름) → step 2 (타자/투수) render; soft keyboard does not cover the focused name field.
- **D3 confirmed**: Back on create step 2 exits the app to the launcher.
- logcat: no FATAL/AndroidRuntime, no cleartext/CSP/ERR_ lines. One console error at load: `Error injecting safe area CSS: TypeError: Cannot read properties of null (reading 'style')` (Capacitor SystemBars runs before documentElement exists; layout was correct).

NOT verified: rotation (needs changing the device rotation setting; skipped), `#/flow/<id>` and Back there (needs a save from a reachable API), create path beyond step 2, offline→retry replay, real login.

Repro for the rest: `adb install -r <apk>`, `adb shell am start -n kr.againplayball.app/.MainActivity`, with a build whose `VITE_API_BASE` is a reachable https host; open `#/flow/<saveId>`, toggle airplane mode, act, restore, verify retry; rotate the device with the form open.
