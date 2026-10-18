# v0.12 교차 계약·이어하기 정적 검증 — 2026-10-19

검증대상은설계문서/카탈로그/HTML시연/기대값구조/예시산술. 실제웹·APK이어하기나엔진·DB실험을실행한것은아니다.

명령: `node docs/design/verify-design.mjs`

```text
PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.
PASS: 80 explicit design fixtures across 8 detailed modules; automatic traits and cheat pitch XP examples. Fixture execution is NOT implemented.
CONFIRMED: cosmetic-only rewards and read-only commentary; no pending choices in these eight detailed modules.
PASS: 82 world design expectations across 8 modules, 24 invariant contracts, 12 planned run scenarios, narrowing-range examples. World simulations are NOT executed.
PASS: 30 cross-contract expectations (12 command, 6 exact-effect, 12 web/APK resume); 192 design expectations total. Actual interruption recovery is NOT tested.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

기대값총192=기능80+장기세계82+교차계약30. 교차30은명령복구12/정확효과6/웹·APK중단이어하기12. 각given/action/expected와NOT_IMPLEMENTED표시를검사했다. 예시A90/P91.25강화+1.25,개인치트A90/P100강화+2,A98.75/P100강화+1.25,피로95도전실제+5를확인했다.

홈이어하기안내와서버resumeDescriptor계약을작성하고서로다른중단상태시연을추가했다. 단로컬시연에는실제서버명령/클라우드저장/로그인/복구기능없음. 실제브라우저force-close/Androidforce-stop/재부팅/오프라인/토큰만료/2기기전환/commit응답유실은구현후테스트필수.

HTML ID/앵커/로컬자산/문서링크/스크립트구문/임베드화면JSON검사통과. 픽셀렌더링은이전MXC오류이후미검수. 실제Neon/API/인증/백업·파일/빌드/PNG/APK검증미실행,원격DB/서비스변경없음. 통합MD·SHA·원래열린HTML복사본을같은내용으로갱신했다.