# v0.15 플랫폼 경험 상세설계 정적 검증 — 2026-10-19

검증 대상은 설계 문서·등록부·기대값 구조·링크·HTML 구문·예시 산술입니다. 실제 로그인·업데이트·다운로드·공유 실행 시험이 아닙니다.

명령: `node docs/design/verify-design.mjs`

```text
PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.
PASS: 80 explicit design fixtures across 8 detailed modules; automatic traits and cheat pitch XP examples. Fixture execution is NOT implemented.
CONFIRMED: cosmetic-only rewards and read-only commentary; no pending choices in these eight detailed modules.
PASS: 82 world design expectations across 8 modules, 24 invariant contracts, 12 planned run scenarios, narrowing-range examples. World simulations are NOT executed.
PASS: 30 cross-contract expectations (12 command, 6 exact-effect, 12 web/APK resume); 192 expectations in these three fixture sets. Actual interruption recovery is NOT tested.
PASS: 45 screen-action bindings and 10 creation recovery design expectations; 202 expectations before the final audit set. Runtime creation recovery is NOT tested.
PASS: 45 screen recovery rows, 99 event occurrence rows, 20 probability surfaces, 24 planned paths, 72 final fixtures; 274 expectations before the platform set. Runtime/UI/AI checks are NOT executed.
PASS: six platform contracts with eight required flows each, and 24 platform expectations (8 auth, 8 update, 8 files); 298 unique design expectations total. Browser/device/auth/update/file behavior is NOT executed.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

총298개 서면 기대값=기능80+세계82+교차30+생성복구10+최종검토72+플랫폼24. 플랫폼24는 auth8/update8/files8,전부 NOT_IMPLEMENTED. 주어진 입력으로 실제 SDK·서버·브라우저·기기를 실행한 결과가 아닙니다.

플랫폼6대상(CP01~06)의 고유ID·인증/저널/업데이트/파일 경로·필수 흐름8개·오프라인 쓰기 금지·공유 기능감지·증거 필드를 검사했습니다. iPhone 홈 화면 별도 세션 확인과 Android 시스템 브라우저/PKCE/App Link 경로를 구조로 구분했습니다. 6×8=48은 계획된 흐름 조합이며 실제48시험 통과가 아닙니다.

기존 45화면/99이벤트/20확률표면/24통합경로·24불변조건·장기실험12계획은 유지합니다. 실제 사례가 아닌 문서 산술 예시와 서면 구조를 검증한 것입니다. MD 링크·HTML ID/앵커/자산·스크립트 구문·임베드화면카탈로그 일치·확률1 숫자 배지 부재 검사도 통과했습니다.

실제 미검증: 로그인/허용목록·관리형 인증 SDK·App Link 도메인/서명·두 계정/기기·강제종료·PWA worker/두 탭 전환·APK 서명 업데이트·PNG/한글·OS 다운로드/공유·브라우저 픽셀/접근성·Neon DB/파일/백업복원·게임/AI/밸런스·build/APK. 기존MXC 오류 이후 화면 렌더링 재검수는 하지 않았습니다. 이번에 실제 원격 서비스 변경·계정 이메일 전송·외부 공유는 없습니다.

Capacitor/Android/MDN/web.dev 공식 문서를 읽어 외부 동작 조건을 확인했으며 각87~89에 링크를 기록했습니다. 이 확인은 앱의 실환경 연결 증거가 아닙니다. SDK 선택·최소OS·플러그인·배포 서명은 구현 시 다시 확인합니다.

통합MD·SHA목록 갱신,git diff 공백 검사를 수행합니다. 실제 실행 게이트는84/STATUS에 남기며 설계 완료를 앱 완성으로 표시하지 않습니다. HTML은이번변경없음.