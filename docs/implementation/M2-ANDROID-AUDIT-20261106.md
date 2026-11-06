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

## 4. Device status — NOT VERIFIED
Device `R5KL10FHTTN` (SM-S948N, Android 17/API 37, WebView 156) was connected. APK installed OK (`adb install -r` Success) and `am start -W` returned Status ok, no FATAL/AndroidRuntime in logcat (`evidence/M2-ANDROID-device-logcat.txt`). But keyguard was showing (`isKeyguardShowing=true`), so the screenshot captured only the lock screen (deleted, personal). **No UI of the app was seen; create form / flow screen / back / keyboard are unverified.** Login also needs a live API at the baked base.

Repro once the phone is unlocked:
```
adb install -r apps/web/android/app/build/outputs/apk/debug/app-debug.apk
adb logcat -c; adb shell am start -n kr.againplayball.app/.MainActivity
adb exec-out screencap -p > shell.png ; adb logcat -d | grep -iE "chromium|Capacitor|FATAL"
# create: open #/create, advance steps, press Back (D3), focus name field -> keyboard must not cover field
# flow: open #/flow/<saveId>; toggle airplane mode, act, restore network, verify retry
```
For a reachable API use a build with `VITE_API_BASE` pointing at a real https host.
