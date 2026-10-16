# v0.8 설계 정적 검증 — 2026-10-16

검증대상은문서·카탈로그·보드이며앱빌드/게임플레이가아니다.

실행명령: `node docs/design/verify-design.mjs`

```text
PASS: 83 event contracts, 37 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

- 이벤트ID E01~E83연속/고유,본문·조건·선택명령·결과안내누락없음. 문구조건이실제플레이에서도달한다는증명은아님.
- 화면S01~S37이카탈로그와HTML에연결,로딩/빈상태/실패/저장중/충돌문구포함. HTML ID중복없음,내부앵커/이미지/MD상대링크누락없음.
- 두스크립트구문파싱통과,HTML임베드상태JSON과원본일치. 초기유형14종각합300. 탐색예시63%,경쟁수락분포합1/제안금액단조성,종합70,추가진루.74/.665,드래프트B45=.5,성장분배/91→45.5/예산18.4억/대학216경기계산확인.
- 보드본문의100%숫자배지없음. CSSwidth100%/잠재력100/내부확률1은별개.
- 브라우저검수호출은`failed to prepare MXC sandbox: permission path cannot be represented losslessly`로실패했다. 실제스크린샷·모바일픽셀·키보드·터치·폰트검수는미실시.
- package.json/앱구현이없어npm build/서버시작/Neon서비스E2E/APK빌드를실행하지않았다. 별도구현착수후필수.

반복검증은같은명령으로가능하다. JSON은설계데이터이며명령핸들러는아직구현되지않았다. 통합MD와MANIFEST는최종원본을기준으로재생성한다. 과거보고서의33화면/69종집계는현재37/83으로대체한다.