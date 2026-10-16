# v0.9 설계 정적 검증 — 2026-10-16

대상은문서·카탈로그·HTML설계시연이며실제게임/브라우저/Neon/APK검증이아니다.

명령: `node docs/design/verify-design.mjs`

```text
PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

- E01~99연속/고유,제목·본문·조건·선택·결과안내필드누락없음. S01~45모두카탈로그/HTML에존재,로딩/빈상태/오류/저장중/충돌문구포함.
- HTML ID중복/내부링크·자산누락없음,세스크립트구문파싱/임베드상태JSON일치. 실제DOM동작·키보드/모바일가독성통과아님.
- 기존수식예시와추가역제안.60/.68/개인수수료2%/직원연봉후잔액/복사구종등급하한/새효과합산cap계산확인. 설계수식을검사한것이며실제엔진구현테스트아님.
- 실제100확률숫자배지없음. 구종운용비율/능력100/잠재력100은서로다른표시다.
- 브라우저는앞선검수에서MXC sandbox permission path cannot be represented losslessly오류로차단됐다. 이번확장화면은실제렌더링검수하지않았다.
- 확장8기능과기존기능모두앱미구현. 100seed커리어/10만타석/50시즌경제·직원·스킬조합,실제Neon/API/인증/백업/PNG/Android다운로드/build/APK는구현후필수검증.

이번작업에서원격productionDB/버킷/인증설정변경없음. Git커밋과정적설계검사만수행했다. 통합MD/카탈로그/원래HTML미리보기복사본/SHA목록갱신.