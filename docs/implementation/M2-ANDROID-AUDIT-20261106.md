
## 6. Device re-test at 3f82e1b APK (sha256 66267b55…0b3a), SM-S948N — verified
Evidence: `evidence/M2-ANDROID-device-b-{1-login,2-home-retry,3-keyboard,4-landscape}.png` (app area only).
- Insets: with viewport-fit=cover content stays clear of status bar and 3-button nav bar (portrait, and nav bar on the right in landscape). No overlap seen.
- Keyboard: focused name field stays visible above the IME.
- API unreachable: Home shows error box plus **"다시 시도"** button; no crash. (Pressing it not exercised.)
- Rotation (via `wm user-rotation lock 1`, restored to `free` afterwards): landscape renders two-column, typed text "Tester" preserved, no relaunch.
- logcat (app pid): no FATAL/AndroidRuntime/ERR_/cleartext; the earlier safe-area CSS console error did not reappear.
Still not verified: `#/flow/<id>`, Back on flow, offline→retry replay, D3 fix (not yet changed in web at this head — not re-tested), real login.

## 7. Device re-test at 214bbb1 (Pretendard / green redesign), SM-S948N
APK sha256 `4a7380d61fbcbe9b6b4b9ffe5771ca1e409ce98c6db88451f262993f3605991c` (10,259,579 B; log `evidence/M2-ANDROID-build3-20261106.log`). Screens: `evidence/M2-ANDROID-device-c-{1-login,2-home,3-create}.png` (app area only).
Verified on device:
- Font: Pretendard renders (heading/body glyphs consistent). It is a bundled woff2 (`/assets/PretendardVariable-*.woff2`, `font-display:swap`) served from APK assets, so no network needed; the phone was not put in airplane mode, but no request is made to a font host.
- Readability/clipping: login, home (error box + 다시 시도 + 새 커리어/새 구단), create step 1 with keyboard dismissed: no clipped text, full-width buttons ≥ ~48dp, stepper chips wrapped onto two rows without truncation. Status bar / gesture bar: no overlap.
- Console: only the benign Capacitor SystemBars `Error injecting safe area CSS` line at load; no FATAL, ERR_, cleartext.
NOT verified: Flow, Career, Decision, Club screens (need a reachable API/save; app has no deep-link intent filter), the "뒤로" link tap size (small text link, looks <44dp tall — check in web CSS), airplane-mode font test.
