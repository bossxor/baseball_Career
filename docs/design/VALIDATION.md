# 시각 확장1.1 검증 — 2026-10-19

기존 게임 설계 기준본1.0에 사용자선택 빈티지 기록실 이미지/비교보드를 추가했습니다. 다음은 문서·자산·스크립트·데이터 정적 검사이며 실제 HTML 화면/클릭/게임 실행 검증이 아닙니다.

명령: `node docs/design/verify-design.mjs` (내부에서 verify-art-direction.mjs 호출)

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
PASS: baseline 1.0 has 25 source topics, 10 specified closures and 12 NOT_EXECUTED gates; XP double-budget/cap-loss/remainder and import rounding examples. These are static/document arithmetic checks only.
PASS: chosen vintage direction, 3 hero alternatives, 12 scene data/crops, alpha PNG metadata, 45 image-slot contracts, lab script/IDs/assets and example overall 71.0.
NOT TESTED: art-lab browser rendering, interactive clicks, viewport layout, clipboard and localStorage; file: browser navigation was policy-blocked.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

기존298서면게임기대값/45화면/99이벤트는유지했습니다. 시각추가별도집계:메인3방향,선택빈티지사건12장면/아틀라스2개,투명초상1개,PNG전체7개(이전사건비교아틀라스포함),45화면이미지슬롯,대표시각목업4종.

검사:선택스타일almanac,유일선택1/비교2,12sceneID/이벤트참조/3×2좌표/장면초점과HTML데이터일치,원본PNG시그니처·크기·초상alpha채널,45screenID/assetRef/가드,새보드스크립트구문·ID·자산/링크·게임네트워크호출부재·기본값·예시능력평균71.0. 기존검사는원문지도25/서면종결10/실행게이트12/XP예시·문서링크/HTML카탈로그등을유지했습니다.

built-in image_gen으로8회생성/편집(초기아틀라스정리·빈티지변환포함),각출력을시각확인하고선택본/비교본을프로젝트에복사했습니다. 원본그림을다른도구로픽셀편집하지않았습니다. 메인1672×941,아틀라스1536×1024,초상1130×1392. System.Drawing읽기전용검사에서초상pixel(0,0)alpha0도확인했습니다. 생성/편집프롬프트는assets/art-lab/GENERATION-PROMPTS.json,사용/비교상태는ASSET-REGISTER.md에보존했습니다.

실제자동브라우저열기실패:in-app browser가file:프로토콜을허용하지않는URL보안정책으로거절했습니다. 에이전트는서버/다른브라우저/CDP/우회열기를하지않았습니다. 따라서HTML픽셀렌더링·모바일줄바꿈·장면크롭의실제보임·키보드/버튼/클립보드/localStorage는미검수입니다. 도구이미지출력확인과HTML정적검사를브라우저검수로표시하지않습니다.

이전MXC오류와이번file프로토콜정책차단은별개입니다. 신규그림의성과/복무/계약가드는서면규약이며실제게임resolver는미구현입니다. 앱/Neon/API/인증/PNG수출/강제종료/업데이트/AI/밸런스/build/APK도미실행입니다. 원격서비스/운영데이터변경없음.

기존45화면목업의hero/초상과기본색을빈티지로연결하고비교보드링크를추가했습니다. 원래열린로컬목업폴더에도HTML/7PNG/프롬프트/기록을복사하고해시를확인합니다. 통합MD와패키지SHA를갱신하고git diff공백검사를수행합니다. 이검증은게임완성이나실제디자인최종렌더승인이아닙니다.
## 2026-10-19 시각 확장1.2 검수

기준본1.0은 유지했다. 96에 성장·재활·계약·대표팀4흐름×3상태와 예외/중단 후 재개를 추가했다. 보드 대표8종, 타자/투수2초상, PNG전체8개. 새 투수는 built-in image_gen 참조 생성1회(전체9회),1130×1392/alpha, 출력 이미지 확인 및 프로젝트 복사. 원본은 보존했다.

실행 명령: node docs/design/verify-design.mjs. 기존 정적 검사 모두 PASS, 추가 출력:

```text
PASS: 2 alpha portrait assets, 8 preview variants, 4 detail flows / 12 state templates, evidence guards, hitter overall 71.0 and pitcher 72.0 / focus 4; pure HTML-string checks only.
```

추가 검사는 고립된 순수 템플릿 함수에서 문자열만 생성한다. DOM·브라우저·게임 엔진·저장·네트워크를 실행하지 않는다. 대표팀 후보/명단은 중립 그림, 금메달 근거 상태만 메달 그림인지 검사한다. 재활12/6/0, 강화 타자80→82/투수76→78 예시, 투수 구종 누적XP30/10 표기와 평균72.0을 확인했다. 상태 카탈로그12건은 기존298 게임 기대값과 별도인 디자인 예시이며 runtime PASS를 뜻하지 않는다.

브라우저 file: 정책 차단은 계속 유지한다. 새로운 자동 브라우저 시도나 우회는 하지 않았다. 실제 픽셀·버튼·모바일·클립보드·localStorage와 앱/Neon/build/APK는 미시험이다. 93~95 및 위1.1 검수는 이전 단계의 이력이며 최신 파일 수와 대표 화면 수는1.2를 따른다.

## 2026-10-19 시각 확장1.3 검수

97에 경기·시즌·드래프트의9상태와 예외/표시 산술을 추가했다. 대표11화면, 상세7흐름×3상태=21, PNG는8개 그대로. 원래45화면/99이벤트/298게임 기대값은 그대로다. result-experience-examples.json의14개 NOT_IMPLEMENTED 예외는 별도 디자인 기대값이다.

명령: node docs/design/verify-design.mjs. 기존 검사 PASS와 추가 출력:

```text
PASS: result/season/draft examples: inning totals 3:4 and X, batting .300/.369/.500/.869, pitching 150.0/3.00/1.23, B45 draft distribution; 14 NOT_IMPLEMENTED edge expectations.
PASS: 2 alpha portrait assets, 11 preview variants, 7 detail flows / 21 state templates, evidence guards, hitter overall 71.0 and pitcher 72.0 / focus 4; pure HTML-string checks only.
```

순수 문자열 검사에서 처리 중 경기에는 FINAL/점수표가 없고, 확정 상태에서는3:4와X·선수별 성적·결산 수치·같은 resultHash 안내가 존재하는지 확인했다. 드래프트 전망50%/10라운드 유력과9라운드 결과/미지명 대안을 구분했다. 원정/홈 점수합, 타자 원분모, 투구 아웃→야구 이닝/ERA/WHIP, B45 전체 분포 합1·지명률·최빈 라운드의 산술을 검사했다.

실제 엔진 박스스코어 보존·중계 hash·중복 정산·확률 추첨·세이브 복구를 실행한 것이 아니다. 표 스크롤·접근성·긴 이름·모바일 렌더·클릭도 미시험이다. file: URL 정책 차단을 우회하지 않았고 새로운 자동 브라우저 접근을 시도하지 않았다. 저장할 이미지 신규 생성/편집은 없으며 기존8개를 재사용했다.

통합MD/MANIFEST를 갱신하고 최신 네트워크 설계 폴더의 기존 파일이 변경되지 않았는지 확인한 뒤 동기화한다. 동기화본은 manifest의 SHA256와 대조한다. 구버전 design-v0.7은 다시 만들지 않는다.

## 2026-10-19 시각 확장1.4 검수

98 구단5흐름/15상태를 추가해 대표16종/상세12흐름36상태가 됐다. 신규PNG는 없고 기존8개를 재사용한다. club-experience-examples.json의20예외는 NOT_IMPLEMENTED이며 기존298게임 기대값과 별도다. 이전 결과 경험14예외도 그대로 유지한다.

실행 명령: node docs/design/verify-design.mjs. 기존 검사 PASS와 추가 출력:

```text
PASS: club examples: search .63 / offer .50, finite ledger 1,840,000,000 -> 1,835,000,000, reservation transfer conserved, report 80~96, rebirth overall 45.8 and capped potentials; 20 NOT_IMPLEMENTED edge expectations.
PASS: 2 alpha portrait assets, 16 preview variants, 12 detail flows / 36 state templates, evidence guards, hitter overall 71.0 and pitcher 72.0 / focus 4; pure HTML-string checks only.
```

새 검사는 L2/N20/q1 탐색.63,단독score.60/1R 수락.50,월 기회2→1,예산 원장 가용18.4억→탐색 후18.35억,별도 제안 예약 후17.4억/예약 분류 이동 보존,전망80~96,19세 반값 능력/종합45.8/새P 상한,보드 문구·36상태 데이터를 검사한다. 실제 시장 추첨·예산 예약·DB 잠금·등록 검증·소유권·생성 롤백·치트 효과·저장 복구를 실행한 것은 아니다.

브라우저 file: 정책 차단은 유지하고 우회하지 않았다. 실제 렌더/클릭/표·글자 확대/키보드/스크린리더/네트워크/클립보드/localStorage는 미시험이다. 정적 문자열 PASS를 화면 동작 PASS로 바꾸지 않는다. 기존 PNG 생성 기록과 원본은 그대로 보존한다.

최신 네트워크 설계 폴더의 기존 manifest 파일을 먼저 대조한 후 수정본을 동기화하고 새 manifest SHA256로 확인한다. 원래 미리보기HTML도 같은 해시로 갱신한다. design-v0.7을 재생성하지 않으며 최신 docs/design만 업데이트한다.


2026-10-19 이어하기 표시 수정: node docs/design/verify-design.mjs 통과. 홈의 중단 상태 드롭다운/안내 문구/관련 스크립트를 제거하고 이어하기 링크 버튼으로 교체했다. 이전 예시 요소 ID가 없고 #career 링크가 있으며45화면 카탈로그와 HTML 내 데이터가 일치함을 정적으로 확인했다. 실제 복구·클릭/브라우저 검수는 미실행이며 서버 원장·명령 멱등성 설계는 유지한다.
