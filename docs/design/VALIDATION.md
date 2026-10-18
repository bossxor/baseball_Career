# v0.13 화면 연결·생성 복구 정적 검증 — 2026-10-19

검증 대상은 설계 파일 구조·링크·목업 구문·예시 산술입니다. 실제 게임이나 저장 복구 실행 검증이 아닙니다.

명령: `node docs/design/verify-design.mjs`

```text
PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.
PASS: 80 explicit design fixtures across 8 detailed modules; automatic traits and cheat pitch XP examples. Fixture execution is NOT implemented.
CONFIRMED: cosmetic-only rewards and read-only commentary; no pending choices in these eight detailed modules.
PASS: 82 world design expectations across 8 modules, 24 invariant contracts, 12 planned run scenarios, narrowing-range examples. World simulations are NOT executed.
PASS: 30 cross-contract expectations (12 command, 6 exact-effect, 12 web/APK resume); 192 expectations in these three fixture sets. Actual interruption recovery is NOT tested.
PASS: 45 screen-action bindings and 10 creation recovery design expectations; 202 total design expectations. Runtime creation recovery is NOT tested.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

기능80+세계82+교차30+생성10=202개 서면 기대값. 45화면 연결표의 화면 ID·행동 유무·명령 유형과 S02/S12의 OWNER_CREATE 분류를 검사했습니다. 이는 실제 버튼이 해당 API를 호출하거나 중단 복구가 성공한다는 증거가 아닙니다.

실제 Neon/API/인증·파일·브라우저/Android 종료·2기기 복구·작업자 종료·DB 경합·게임 엔진·밸런스 실험·빌드·APK 검증은 미실행입니다. 픽셀 검수는 이전 MXC 오류 이후 재검증하지 않았습니다. 원격 production 서비스 변경은 없습니다. 통합 MD와 SHA 목록을 갱신했으며 HTML은 변경하지 않았습니다.