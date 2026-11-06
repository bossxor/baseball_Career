
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

## 8. Device re-test at 2d09e65 (SVG illustrations), SM-S948N (density 600)
Standard APK sha256 `2fe6a24193366887ffb9f7b49923897ab1b4f91c116ae70258faf033c19b9f6e` (log `evidence/M2-ANDROID-build4-20261106.log`). Screens: `evidence/M2-ANDROID-device-d-{1-login-hero,2-home-error-art,3-create-school-art,4-create-focus-step}.png`.
Verified: SVG illustrations (stadium hero, bat/ball error art, glove empty art, school scene, emblem) render fully, no clipping/breakage; they are inline in the 313 KB JS bundle (no image requests, APK still ~10.2 MB, first screen visible 234 ms after `am start -W`). Pretendard (2 MB woff2) renders. Create wizard (이름→타자/투수→포지션→투타→유형→집중 육성) works; radio/checkbox rows are ~50dp tall; "뒤로" button 168px ≈ 45dp; stepper chips 146px ≈ 39dp (<44dp, only if tappable).
Fixture-mode debug build (VITE_API_BASE unset, bypasses assert script; UI review only, not for distribution; log `evidence/M2-ANDROID-build5-fixture-20261106.log`) lets Home open without API (empty-save state OK). Phone was re-flashed afterwards with the standard APK above.
Defects (web, report to m2-web):
- W1 content scrolls under the transparent status bar; status icons/clock are unreadable over illustrations and the sticky stepper (seen on login after focusing a field, home scrolled, create focus step). Suggest a fixed scrim: `body::before{content:"";position:fixed;inset:0 0 auto 0;height:env(safe-area-inset-top);background:var(--bg);z-index:50}`; same idea for bottom with env(safe-area-inset-bottom).
- W2 in the API-error state Home shows hero + error art + empty art, so 새 커리어/새 구단 fall below the fold (scroll needed). Consider hiding the hero on error/empty.
- W3 stepper chips 39dp tall if they are interactive.
Not verified: finishing the create wizard (my adb automation of the checkbox step was unreliable: only 2/4 focus abilities got ticked), hence Flow/Career/Decision/Club screens still unseen. Offline-font test not done.
Note: during this session Android opened the system "USB 설정" screen on top of the app once (USB re-enumeration) and one of my taps landed on its "파일 전송" row (already selected, current `sys.usb.config=mtp,adb`); I did not change any other setting. A "N-052에서 복사했어요" clipboard toast also appeared (OS cross-device clipboard, not from the app).
