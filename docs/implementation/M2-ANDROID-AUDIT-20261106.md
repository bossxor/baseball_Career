
## 6. Device re-test at 3f82e1b APK (sha256 66267b55…0b3a), SM-S948N — verified
Evidence: `evidence/M2-ANDROID-device-b-{1-login,2-home-retry,3-keyboard,4-landscape}.png` (app area only).
- Insets: with viewport-fit=cover content stays clear of status bar and 3-button nav bar (portrait, and nav bar on the right in landscape). No overlap seen.
- Keyboard: focused name field stays visible above the IME.
- API unreachable: Home shows error box plus **"다시 시도"** button; no crash. (Pressing it not exercised.)
- Rotation (via `wm user-rotation lock 1`, restored to `free` afterwards): landscape renders two-column, typed text "Tester" preserved, no relaunch.
- logcat (app pid): no FATAL/AndroidRuntime/ERR_/cleartext; the earlier safe-area CSS console error did not reappear.
Still not verified: `#/flow/<id>`, Back on flow, offline→retry replay, D3 fix (not yet changed in web at this head — not re-tested), real login.
