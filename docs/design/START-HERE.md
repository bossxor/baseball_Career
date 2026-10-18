최신v0.12:[74 명령복구](74-PREVIEW-COMMAND-RECONCILIATION.md) · [75 정확효과](75-EXACT-EFFECTS-PUBLIC-INFORMATION.md) · [76 웹·APK이어하기](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md). 사용자필수이어하기/정확증가량표시반영,총192서면검수기대값. 실제게임·저장·복구는구현전.

최신v0.11:[66 재도전](66-RETRY-CAREER-OPPORTUNITIES.md) · [67 잠재력관측](67-POTENTIAL-ASSESSMENT-PROGRESSION.md) · [68 구단주기](68-FRANCHISE-CYCLES-LEAGUE-HISTORY.md) · 69~73 충돌/복원/불변조건/연도전환/장기실험설계. 서면기대값총162개,실제실험미실행. 앱미구현.

최신v0.10:[65 사용자확정5항목](65-USER-TRAITS-XP-STAFF.md)과[64 공통계약](64-EXPANSION-COMMON-CONTRACT.md),56~63전체8기능상세계약/검수기대값80개작성. [STATUS](STATUS.md)에서서면완료와실행미검증을구분하세요. 앱미구현.

최신v0.9:[55 추가8기능통합](55-EXPANSION-INTEGRATION.md)을먼저확인. 47~54모두v1필수로추가,45화면/99이벤트. 세부수치는설계기본안,앱미구현.

최신 v0.8: [39 정합](39-DESIGN-RECONCILIATION.md) · [40 확률](40-SCOUTING-RECRUITMENT-ODDS.md) · [41 경기](41-SIX-STAT-ENGINE.md) · [42 성장](42-GROWTH-DIFFICULTY-REBIRTH.md) · [43 대학](43-COLLEGE-CAREER.md) · [44 구단](44-CLUB-ECONOMY-AI.md) · [45 이벤트83종](45-EVENT-CATALOG-REVISION.md) · [46 화면37종](46-ALL-SCREENS-FLOWS.md). 새수치는설계기본안D,실행검증전. 앱미구현.

최신 명칭은 **다시, 플레이볼**. 능력6개/육성4개/평균종합/대학/미국노출/확률/구단치트는 [34](34-ARCHETYPES-COLLEGE-ODDS.md)~[37](37-BRAND-TEAM-LOGOS.md)을 우선 읽으세요. 이전 대학후속범위와1~2집중선택은폐기됐습니다.

최신 사용자 결정: [32](32-USER-IMPORT-REBIRTH.md)는 이전 능력 그대로/병역계승 규칙을 대체합니다.

# 최신 편집 위치 안내

현재 원본은 https://github.com/bossxor/baseball_Career 의 docs/design 입니다. [DETAIL-PLAN.md](DETAIL-PLAN.md)에서 다음 상세설계를 확인합니다. 기존 v0.7 ZIP은 시점 보관본이며 이후 커밋을 포함하지 않습니다.

# 여기서 시작하세요

이 폴더는 야구 시뮬레이션 프로젝트의 이식 가능한 설계 패키지입니다. 이전 채팅을 읽을 수 없어도 이 문서부터 시작하면 됩니다.

## 현재 상태

- 단계: 상세 설계 v0.9. 앱 코드 구현/DB 스키마 배포/APK 빌드 미착수.
- 목적: 소수 친구용 웹앱+Android APK, 선수 커리어와 독립 구단 운영.
- 필수: KBO 가상선수, 고교 미국직행, 포스팅, MiLB/MLB, 국가대표/병역, 스타일/강화, 은퇴보관, 능력별최고50%·새잠재력·병역재시작의 어린선수 선택투입, Neon 저장.
- 앱 이름: 다시, 플레이볼. 목표 GitHub: https://github.com/bossxor/baseball_Career
- 이 폴더의 HTML은 정적 목업입니다. 버튼이 실제 게임을 실행하지 않습니다.

## 읽는 순서

1. [README](README.md): 요구와 문서지도.
2. [통합 결정표](14-CANONICAL-DECISIONS.md): 최우선 규칙과 최신값.
3. [인수인계 현황](STATUS.md): 완료/미확인/다음 작업.
4. [경로 시나리오](18-PATH-WALKTHROUGHS.md): 전체 경험.
5. 담당 분야의최신문서40~46및19~38. 07의 오래된 화면/이벤트개수는 STATUS의최신집계를우선.
6. [다른 채팅용 요청문](HANDOFF-PROMPT.md).

## 규칙 우선순위

사람 사용자의 최신 지시 > 이 패키지에서 U로 표시한 확정 요구 > 14 통합결정 > 분야별최신문서(40~46,그외19~38) > 01~11 초기설계. 확정요구변경은사람의지시를기록한다. 서로다른수치를그냥동시에구현하지않는다. 문서분량을줄인다는이유로MLB/병역/독립구단을빼지않는다.

## 다른 컴퓨터로 이동

폴더 전체를 복사하거나 제공 ZIP을 풉니다. Markdown 링크·HTML 이미지·폰트는 상대경로라 같은 구조를 유지하면 됩니다. `design-board.html`을 브라우저로 열면 시각 보드를 볼 수 있습니다. Git 저장소에는 `docs/design/` 아래로 이 폴더 내용을 복사하는 것을 권장합니다. 기존문서가있으면비교한뒤병합하고덮어쓰지않습니다.

MD만 읽는 AI에는 `DESIGN-ALL.md` 또는 본 폴더의MD파일들을 전달합니다. 이미지는MD에없어도규칙을이해할수있게문서화했고,시각검토시assets와HTML을함께전달합니다. 경로는현재PC전용절대경로가아닌상대경로로설명합니다.

## 비밀값과 설치 의존성

이패키지에는API키/DBURL/비밀번호/로그인토큰/서명키가없습니다. Neon프로젝트ID/조직ID는인프라식별자일뿐자격증명이아닙니다. CLI/MCP/스킬설치상태와로그인은컴퓨터마다다르므로새환경에서확인합니다. 자격증명을다른채팅에붙여넣도록요청하지않습니다.

## 구현 착수 전

문서설계와실증을구분하고 STATUS의차단사항을확인합니다. 사용자는설계를먼저원합니다. 새채팅에이문서가전달됐다는이유만으로구현/배포를자동시작하지말고현재사람요청을따릅니다. 실제구현이승인되면요구범위는유지하고작동하는단위로순차개발합니다.
