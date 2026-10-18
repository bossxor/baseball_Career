# v0.11 장기 설계 정적 검증 — 2026-10-19

대상은설계문서·카탈로그·HTML입력시연·검수기대값의구조와예시산술이다. 실제게임엔진/DB/API실험은실행하지않았다.

실행: `node docs/design/verify-design.mjs`

```text
PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.
PASS: 80 explicit design fixtures across 8 detailed modules; automatic traits and cheat pitch XP examples. Fixture execution is NOT implemented.
CONFIRMED: cosmetic-only rewards and read-only commentary; no pending choices in these eight detailed modules.
PASS: 82 world design expectations across 8 modules, 24 invariant contracts, 12 planned run scenarios, narrowing-range examples. World simulations are NOT executed.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

기존기능80개와장기세계82개,총162개의서면given/action/expected를확인했다. 세계불변조건24종과장기실험12계획이있으나실행status는NOT_IMPLEMENTED/PLANNED다. 서로다른리그기록/복원ID·RNG/원본hash/연도generation등이실제코드에서지켜지는지는구현후시험한다.

이번에66~73과기존문서의재도전1회/대학입학나이/잠재력평가/복원식별자관련규칙을정합화했다. 사용자확정3방향과설계기본수치(준비3회·입학22세·관측20경기등)를구분한다. 기존8기능상세계약과45화면/99이벤트유지.

실제브라우저렌더링은이전MXC오류이후확인하지않았고이번에도픽셀검수미실행. 엔진·Neon·인증·파일복원·빌드·PNG·Android/APK미검증. 원격DB/서비스설정변경없음. 통합MD/SHA/기존열린HTML복사본은최신원본으로동기화한다.