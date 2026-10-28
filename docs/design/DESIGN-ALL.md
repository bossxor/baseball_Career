# 다시, 플레이볼 — 게임 설계 기준본1.0 · 청춘 야구 애니 시각 확장1.9

---

<!-- SOURCE: START-HERE.md -->

# 구현 진행 안내 — 2026-10-26

M0/M1 완료. **M2 커리어는 계속 진행 중**(main/엔진 쪽). **M3 계정·DB·명령 인프라는** 브랜치 `m3/save-command-pipeline`에서 V02/V03까지 완료 — [M3-COMPLETE](../implementation/M3-COMPLETE.md). M2와 병렬이며 engine 미수정. 최신 증거는 [PROGRESS](../implementation/PROGRESS.md)·[STATUS](STATUS.md) 우선. 아래 옛 NOT_EXECUTED/설계 인계는 이력이다.

---

최종 점검(2026-10-20): [131 구현 직전 리뷰](131-FINAL-DESIGN-REVIEW.md)에서5개 문서/패키지 정합 문제를 기존 기준으로 정정했다. [130 인계](130-PREIMPLEMENTATION-HANDOFF.md)와 STATUS를 함께 읽는다. 실제 실행 검수는 미실행이며 이번 작업은 앱 구현을 시작한 기록이 아니다.

최신 안내(2026-10-19): 진행 현황은 [STATUS](STATUS.md), 분야별 현재 기준 문서는 [91](91-CURRENT-CONTRACT-INDEX.md), 사용자 결정은 [14](14-CANONICAL-DECISIONS.md)를 봅니다. 최근 문서: [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 선수 표시·투구폼, [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) 손·타석 분포, [122](122-API-SCHEMA-LOG-ALIGNMENT.md) API 정합, [123](123-EFFECT-SUM-EXAMPLES.md) 합산 예제, [124](124-IMAGE-PRODUCTION-BRIEF.md) 이미지 제작 명세, [125](125-EVENT-CHOICE-DISPATCH.md) 사건 선택지 처리, [120](120-IMPLEMENTATION-ROADMAP.md) 구현 로드맵. 기대값 묶음 목록은 [expectation-sets-index.json](expectation-sets-index.json).

# 다시, 플레이볼 — 여기서 시작하세요

2026-10-19 / 서면 설계 기준본1.0 / 실제 앱 미구현.

이 패키지는 소수 친구용 야구 커리어·독립 구단 시뮬레이션의 이식 가능한 설계다. 사용자는 상세설계를 먼저 완성하고 나중에 구현하기로 했다. 현재 사람의 요청이 설계이면 설계를 다듬고,구현 착수 지시가 있으면 기존 승인 범위의 필요한 작업을 진행한다. 이 파일을 받았다는 사실만으로 서비스 배포·DB 구축을 자동 시작하지 않는다.

## 먼저 읽을 문서

1. [STATUS](STATUS.md): 현재 서면 완료/실행 미검증.
2. [14 통합 결정](14-CANONICAL-DECISIONS.md): U 사용자 확정/D 기본안/V 실행 증거.
3. [91 현재 적용 지도](91-CURRENT-CONTRACT-INDEX.md):25분야의 최신 원문. [JSON](current-contract-index.json)으로도 제공.
4. [92 종결·인계](92-DESIGN-CLOSURE-HANDOFF.md):10서면 종결 항목과12실행 게이트.
5. 담당 분야의 원문과카탈로그. 전체 요구 지도는 [README](README.md).

현재는45화면/99이벤트/298서면 기대값/24통합 경로/6플랫폼 대상/12장기 실험 계획이다. 기대값 파일의 NOT_IMPLEMENTED를 실제 게임 테스트 통과로 해석하지 않는다. [정적 검증 기록](VALIDATION.md)을 확인한다.

## 바뀌면 안 되는 핵심

타자·투수각6능력/집중정확4개/영구6능력산술평균100상한. 고교 KBO·대학·조건부미국·포스팅·국제/병역·은퇴보관 필수. 구단은 커리어 없이 시작 가능하고 보관 선수0명 가능. 보관 복사본은19세/능력별최고50%/새P/병역재시작,원본 불변.

특성은보유전체자동효과,목표보상기념품만,중계는확정경기감상. 실제확률1숫자배지숨김/단순변경적용확률없음/정확한강화증가·비용우선. 구단치트는내구단전체P100·양의성장3배·구종XP3배·무제한자금·적격탐색/유효영입보장,이후영입/보관포함. 상세 수혜·상한은85/90.

## 충돌 처리

사람의 최신 명시 결정 > U > 같은 범위의 명시적 정정 > 분야 상세 > 초기 초안. 숫자가 큰 문서가 모든 규칙을 대체하지 않는다.91의 분야 지도와 폐기안을 사용한다. 역사적33/37화면·40/69/83이벤트·장착2특성·구단성장1배·미국오퍼0선택 등 폐기안으로 되돌리지 않는다.

## 패키지 사용

GitHub https://github.com/bossxor/baseball_Career 의 docs/design이 원본. 다른 컴퓨터에는 이 폴더 전체를 옮긴다. MD는 상대경로,HTML은같은assets를사용한다. [DESIGN-ALL](DESIGN-ALL.md)은전달용통합본,[MANIFEST](MANIFEST-SHA256.csv)는무결성목록이다. 기존 ZIP은 생성 시점 자료이므로 최신Git과 구분한다.

`node docs/design/verify-design.mjs`는저장소루트에서실행한다. 문서구조/링크/예시산술검사이며앱빌드/Neon/기기시험아님. design-board.html은정적목업으로로그인·경기·저장요청을실행하지않는다.

토큰/DBURL/서명키/비밀번호를문서·Git에넣지않는다. 실제인증·도메인·빌드도구·서비스지원·배포자산·기기·밸런스는92의실행게이트다. 다른 환경용 요청문은 [HANDOFF-PROMPT](HANDOFF-PROMPT.md).

## 이전 최신 안내 이력

위 ‘최신 안내’가 우선합니다. 아래는 당시 최신이었던 안내를 순서대로 보존한 것입니다.

이미지 제작 인계: [124 이미지 제작 명세](124-IMAGE-PRODUCTION-BRIEF.md). API·스키마 정합 [122](122-API-SCHEMA-LOG-ALIGNMENT.md), 새 효과 합산 예제 [123](123-EFFECT-SUM-EXAMPLES.md).

최신: [119 선수 표시·투구폼·좌우 상성](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) · [120 구현 착수 대비 로드맵](120-IMPLEMENTATION-ROADMAP.md). 사람 외형 없이 이름·던지는 손/타석·투구폼만 사용하며 실루엣 이미지는 별도 제작합니다. 진행/재개위치는 STATUS·CONTINUATION-CHECKPOINT를 확인합니다.

최신: [118 은퇴·보관·구단연속성](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md). 연속작업의마지막사용량·재개위치는 [CONTINUATION-CHECKPOINT](CONTINUATION-CHECKPOINT.md)에기록합니다.

최신: [116 중반커리어](116-MIDCAREER-DECISIONS-AND-SETBACKS.md) · [117 기본빠른진행U](117-CAREER-NEXT-MAJOR-EVENT-PROGRESSION.md). 진행/재개위치는STATUS·DETAIL-PLAN을확인합니다.

최신상세설계: [115 구단오프시즌](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md). 최신진행/다음작업은STATUS·DETAIL-PLAN맨위에서확인합니다.

최신 구단 설계: [114 첫시즌 운영](114-FIRST-CLUB-SEASON-OPERATIONS.md). 최신진행과다음작업은 [STATUS](STATUS.md)·[DETAIL-PLAN](DETAIL-PLAN.md)의맨위에기록합니다.

최신동선: [첫커리어 보드](first-career-board.html) · [113 상세설계](113-FIRST-CAREER-SEASON-EXPERIENCE.md). 공통7/분기19장면으로KBO·대학·미국·미지명경로를검토합니다. 실제게임진행은없습니다.

현재 추가설계: [112 능력100과성적](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md). 100은능력상한이지안타확률이아니며SLG최대는4.000입니다. 고정산식예시와실제시즌검증을구분합니다.

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

현재 후속 시안: [17화면 마감 보드](finish-board.html) · [109 제작/점검 범위](109-FINISH-BOARD-ART-AUDIT.md). 기존 대표28화면과합쳐45ID의대표 배치를 연결했습니다. 최종 렌더 승인/실앱 검증은아직이며PNG는9개입니다.

화면 마감 명세: [108 전체45화면](108-ALL-SCREEN-FINALIZATION.md)에 읽기 순서·주행동·8종 상태·크기별 배치를 정리했습니다. 대표 시안 미명시17화면은 후속 제작 대상으로 구분합니다.

상세 경계 추가: [107 라이벌·히든 특성](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)에서 발생·결투 WIN·완봉 예외·연속 시즌·정정을 구체화했습니다. 새 기본안 D와 사용자 확정 U를 구분하며 실제 구현은 시작하지 않았습니다.

시각1.7: [106 확장 UI 연결](106-EXPANSION-UI-CLOSURE.md)에서102~104의 남은 대표 배치를 연결했습니다. [시안](art-direction-lab.html)은30대표/78상태,핵심45화면/99이벤트는유지합니다. [61항목 진입점](state-ui-preview-coverage.json)은NOT_EXECUTED이며실제 앱/브라우저 검수와구분합니다. 최신파일은V:\docs\design,이어하기는버튼만 표시합니다.

---

<!-- SOURCE: README.md -->

# 구현 진행 안내 — 2026-10-26

M0/M1 완료. M2 커리어 **진행 중**. M3(Neon Auth·세이브 명령)는 병렬 브랜치에서 완료 — [M3-COMPLETE](../implementation/M3-COMPLETE.md). 최신 증거는 [PROGRESS](../implementation/PROGRESS.md)·[STATUS](STATUS.md). 아래 설계 본문은 계약 원문이며 APK/전체 커리어 완료를 뜻하지 않습니다.

---

최종 점검(2026-10-20): [131 구현 직전 리뷰](131-FINAL-DESIGN-REVIEW.md)에서5개 문서/패키지 정합 문제를 기존 기준으로 정정했다. [130 인계](130-PREIMPLEMENTATION-HANDOFF.md)와 STATUS를 함께 읽는다. 실제 실행 검수는 미실행이며 이번 작업은 앱 구현을 시작한 기록이 아니다.

최신 안내(2026-10-19): 진행 현황은 [STATUS](STATUS.md), 분야별 현재 기준 문서는 [91](91-CURRENT-CONTRACT-INDEX.md), 사용자 결정은 [14](14-CANONICAL-DECISIONS.md)를 봅니다. 최근 문서: [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 선수 표시·투구폼, [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) 손·타석 분포, [122](122-API-SCHEMA-LOG-ALIGNMENT.md) API 정합, [123](123-EFFECT-SUM-EXAMPLES.md) 합산 예제, [124](124-IMAGE-PRODUCTION-BRIEF.md) 이미지 제작 명세, [125](125-EVENT-CHOICE-DISPATCH.md) 사건 선택지 처리, [120](120-IMPLEMENTATION-ROADMAP.md) 구현 로드맵. 기대값 묶음 목록은 [expectation-sets-index.json](expectation-sets-index.json).

# 다시, 플레이볼 — 상세설계 기준본1.0

2026-10-19. 소수 친구용 야구 선수 커리어·독립 구단 시뮬레이션의 서면 설계 패키지입니다. 실제 앱·Neon 서비스 연결·웹/APK 빌드는 아직 구현하지 않았습니다.

## 처음 읽을 파일

[START-HERE](START-HERE.md) → [현재 현황](STATUS.md) → [14 통합 결정](14-CANONICAL-DECISIONS.md) → [91 분야별 현재 계약](91-CURRENT-CONTRACT-INDEX.md) → [92 종결·구현 인계](92-DESIGN-CLOSURE-HANDOFF.md).

[DESIGN-ALL](DESIGN-ALL.md)은 모든 원문을 모은 전달용 복사본,[HANDOFF-PROMPT](HANDOFF-PROMPT.md)는 다른 채팅용 요청문입니다. 원문을 수정한 후 통합본·SHA·검수기록을 갱신합니다.

## 유지할 제품 범위

- 한 선수의 고교 시작→KBO/대학/조건부 미국→프로·국제/병역→은퇴·보관.
- 실제 KBO/MLB 구단 배경과 가상 선수,가상 대학9학교. 미국 직행·포스팅·MiLB/MLB 커리어 필수.
- 커리어와 별개로 시작할 수 있는 독립 구단 운영. 보관 선수 사용0명 가능.
- 보관 복사본은19세/능력별커리어최고50%/새상향P·상한100/병역재시작/기록초기화,원본불변.
- 타자:컨택·파워·선구안·수비·주루·클러치. 투수:구속·구위·제구·위기관리·체력·견제.
- 집중육성정확4개,종합은영구6능력산술평균·최대100.0. 기용점수는별도.
- 스타일·시즌1회강화/확정성장·국제대회·대표실제출장·병역/복무/복귀.
- 기록해금된특성전체자동효과,구종/타격성향,기념품목표,에이전트·관계,은퇴지도자,확정문자중계,연대기/카드.
- 확률있는선택의대상·기준시점·실제효과표시,실제1숫자배지숨김,단순변경확률없음. 강화정확효과·비용우선.
- 커리어치트:주인공P100·양의자연성장/구종XP3배·강화성공보장. 구단치트:내구단전체P100·양의성장/구종XP3배·무제한자금·적격탐색/유효영입보장. 이후영입/보관포함.
- Android/iPhone/Windows/macOS 온라인웹+Android APK. 같은계정서버확정진행이어하기,응답유실·중단복구.
- Neon PostgreSQL과private 객체파일,소유자격리·비밀값서버보관.

U는사용자확정,D는구체기본안,V는실행증거필요입니다. 수치D를사용자가개별승인했다거나게임균형이실증됐다고해석하지않습니다. 새로운사용자지시가없으면원본필수범위를줄이지않습니다.

## 빠른 문서 지도

| 분야 | 현재 진입점 |
|---|---|
| 생성·능력·정밀도 | [79](79-CREATION-FIELDS-VALIDATION-COPY.md)/[35](35-SIX-ABILITIES-FOUR-FOCUS.md)/[90](90-NUMERIC-LEDGER-CONSISTENCY.md) |
| 커리어·재도전·대학·미국 | [19](19-CAREER-STATE-MACHINE.md)/[66](66-RETRY-CAREER-OPPORTUNITIES.md)/[43](43-COLLEGE-CAREER.md)/[23](23-US-CONTRACTS-RIGHTS.md) |
| 국제·병역 | [20](20-INTERNATIONAL-COMPETITIONS.md)/[21](21-MILITARY-CONTRACT-RETURN.md) |
| 경기·성장·난이도 | [24](24-GAME-ENGINE-SCORING.md)/[41](41-SIX-STAT-ENGINE.md)/[42](42-GROWTH-DIFFICULTY-REBIRTH.md)/[85](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)/[90](90-NUMERIC-LEDGER-CONSISTENCY.md) |
| 구단·시장·지도자·왕조 | [44](44-CLUB-ECONOMY-AI.md)/[40](40-SCOUTING-RECRUITMENT-ODDS.md)/[61](61-STAFF-DETAILED-CONTRACT.md)/[68](68-FRANCHISE-CYCLES-LEAGUE-HISTORY.md) |
| 확장8기능 | [55](55-EXPANSION-INTEGRATION.md)/56~65,분야별최신정정포함 |
| 화면·사건·확률·시각 | [77](77-SCREEN-QUERY-COMMAND-BINDINGS.md)/[80](80-SCREEN-STATES-NAVIGATION-RECOVERY.md)/[81](81-EVENT-OCCURRENCE-COLLISION-AUDIT.md)/[82](82-PROBABILITY-EFFECTS-CONFIRMATION-AUDIT.md)/[83](83-VISUAL-ASSETS-ACCESSIBILITY-HANDOFF.md) |
| 명령·저장·복원·연도 | [74](74-PREVIEW-COMMAND-RECONCILIATION.md)/[76](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)/[78](78-NEW-GAME-CREATION-RECOVERY.md)/[70](70-BACKUP-RESTORE-IDENTITY-COMPATIBILITY.md)/[72](72-WORLD-YEAR-TRANSITION.md) |
| 플랫폼·인증·업데이트·파일 | [86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md)/[87](87-PLATFORM-LOGIN-ACCOUNT-HANDOFF.md)/[88](88-CLIENT-UPDATES-COMPATIBILITY-RECOVERY.md)/[89](89-PLATFORM-FILES-DOWNLOAD-SHARING.md) |
| 최종검수·인계 | [84](84-DESIGN-GATES-END-TO-END-PATHS.md)/[91](91-CURRENT-CONTRACT-INDEX.md)/[92](92-DESIGN-CLOSURE-HANDOFF.md) |

정확한25분야 원문목록은 [current-contract-index.json](current-contract-index.json),종결상태는 [design-closure-register.json](design-closure-register.json)입니다. 초기01~18과이후문서는삭제하지않고이력을보존하되91의명시정정·폐기안을적용합니다.

## 현재 검증 상태

45화면/99이벤트/298서면기대값/24통합경로/6플랫폼×8필수흐름/12장기실험계획. 기대값은모두NOT_IMPLEMENTED,실행게이트는NOT_EXECUTED입니다.

`node docs/design/verify-design.mjs`는문서구조·ID·링크·HTML구문/자산·예시산술·기준본지도를검사합니다. 게임/DB/API/브라우저/Android시험이아닙니다. [VALIDATION](VALIDATION.md)과[STATUS](STATUS.md)에실제수행범위를기록합니다.

현재추가사용자질문은없습니다. 서면기준이작성됐으며다음실행작업은구현후92의게이트에서증명합니다. 사용자의구현착수지시전에는앱/DB/배포를자동시작하지않습니다.

## 이전 최신 안내 이력

위 ‘최신 안내’가 우선합니다. 아래는 당시 최신이었던 안내를 순서대로 보존한 것입니다.

이미지 제작 인계: [124 이미지 제작 명세](124-IMAGE-PRODUCTION-BRIEF.md). API·스키마 정합 [122](122-API-SCHEMA-LOG-ALIGNMENT.md), 새 효과 합산 예제 [123](123-EFFECT-SUM-EXAMPLES.md).

최신: [119 선수 표시·투구폼·좌우 상성](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) · [120 구현 착수 대비 로드맵](120-IMPLEMENTATION-ROADMAP.md). 사람 외형 없이 이름·던지는 손/타석·투구폼만 사용하며 실루엣 이미지는 별도 제작합니다. 진행/재개위치는 STATUS·CONTINUATION-CHECKPOINT를 확인합니다.

최신: [118 은퇴·보관·구단연속성](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md). 연속작업의마지막사용량·재개위치는 [CONTINUATION-CHECKPOINT](CONTINUATION-CHECKPOINT.md)에기록합니다.

최신: [116 중반커리어](116-MIDCAREER-DECISIONS-AND-SETBACKS.md) · [117 기본빠른진행U](117-CAREER-NEXT-MAJOR-EVENT-PROGRESSION.md). 진행/재개위치는STATUS·DETAIL-PLAN을확인합니다.

최신상세설계: [115 구단오프시즌](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md). 최신진행/다음작업은STATUS·DETAIL-PLAN맨위에서확인합니다.

최신 구단 설계: [114 첫시즌 운영](114-FIRST-CLUB-SEASON-OPERATIONS.md). 최신진행과다음작업은 [STATUS](STATUS.md)·[DETAIL-PLAN](DETAIL-PLAN.md)의맨위에기록합니다.

최신동선: [첫커리어 보드](first-career-board.html) · [113 상세설계](113-FIRST-CAREER-SEASON-EXPERIENCE.md). 공통7/분기19장면으로KBO·대학·미국·미지명경로를검토합니다. 실제게임진행은없습니다.

현재 추가설계: [112 능력100과성적](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md). 100은능력상한이지안타확률이아니며SLG최대는4.000입니다. 고정산식예시와실제시즌검증을구분합니다.

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

이전 시각1.8 제작 이력: [마감 보드](finish-board.html)에추가17배치/136상태·새빈티지6장면을작성했습니다. 기존28대표+추가17=45화면ID 연결이며최종브라우저검수와구분합니다. [109 범위](109-FINISH-BOARD-ART-AUDIT.md).

화면 마감 명세: [108 전체45화면](108-ALL-SCREEN-FINALIZATION.md)에 읽기 순서·주행동·8종 상태·크기별 배치를 정리했습니다. 대표 시안 미명시17화면은 후속 제작 대상으로 구분합니다.

상세 경계 추가: [107 라이벌·히든 특성](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)에서 발생·결투 WIN·완봉 예외·연속 시즌·정정을 구체화했습니다. 새 기본안 D와 사용자 확정 U를 구분하며 실제 구현은 시작하지 않았습니다.

시각1.7: [106 확장 UI 연결](106-EXPANSION-UI-CLOSURE.md)에서102~104의 남은 대표 배치를 연결했습니다. [시안](art-direction-lab.html)은30대표/78상태,핵심45화면/99이벤트는유지합니다. [61항목 진입점](state-ui-preview-coverage.json)은NOT_EXECUTED이며실제 앱/브라우저 검수와구분합니다. 최신파일은V:\docs\design,이어하기는버튼만 표시합니다.

---

<!-- SOURCE: STATUS.md -->

# 전체 구현 진행률: 기존 추정 약84% 완료 · 약16% 남음

**현재 집중 범위 M2: 약60% 검증 완료 기준 · 약40% 구현/통합 검증 잔여.** 2026-10-28 갱신. 이는 기존 범위 추정이며 전체84%는 다른 브랜치 통합까지 다시 계산한 수치가 아니다. 현재 수정분을 더해 임의로 퍼센트를 올리지 않았다.

## 지금 어디까지 왔나

- 최신 검증 완료 코드: **271900f** / codex/m2-career-engine. EL까지 전체 검증 완료.
- 마지막 전체 검사: **796개 중794통과 · 실패0 · Neon환경2개 건너뜀 / 웹22개 통과**.
- 이미 연결한 큰 범위: 선수 생성·고교/대학 진로·KBO/미국 진입, 실제 경기·성장/구종·부상, KBO 계약/포스팅/해외FA·병역 주요 경로, 국가대표 대진/경기·휴식, 미국 계약 원점과 최초 마이너 갱신/구단 이동.
- 실제 전체 커리어·모든 국제/복무 조합·DB/실기기까지 통과했다는 뜻은 아니다.

## 이번 작업과 남은 구현

| 영역 | 현재 상태 | 구체적인 진행 |
|---|---|---|
| 미국 마이너 최초 제안 수락/이적 | 검증 통과(EL) |1년/$30,000, E66 수락 종료, 현재 레벨 유지, 원점/예산 보존 |
| 미국 반복 갱신·갱신 후 MLB 콜업 | 수정 진행·통합 검증 대기 | 두 연결 오류를 재현/수정했고 집중2개 통과. 기존 EL 저장 호환·실제 다음 첫 경기·역사 사건 바인딩 추가 확인 중 |
| 미국 E61 강등·권리 조회 | 구현 중 | 기존 호출자 호환을 유지하며 권리 조회와 실제 강등 연결을 병렬 작업 중 |
| 미국에서 국내 복귀 | 미구현 | 최신 미국 선수/기록/부상과 같은 연도 KBO 세계, 국내 보유권·KRW/USD 원장 소유권부터 연결 필요 |
| 대표 긴급 후보·미국 후보/국적 | 남은 구현 | 봉인 후보 고갈 시 실제 하위리그 추가, 미국 후보 자격/차출·국적 연결 |
| 공통 국제 날짜·정규/PS 연계 | 부분 구현 | WBC/대회·복귀 경로는 있으나 전체 날짜·복무·연말 조합은 연결/통합 확인 잔여 |
| 99사건·24경로·PF-D | 감사·통합 검증 잔여 | 미감사와 미구현을 다시 대조. 문자열/ACK/통제 fixture만으로 완료 표기하지 않음 |

## 앞으로의 진행 방식

**작은 기능마다 전체 테스트를 반복하지 않는다.** 남은 M2를 큰 기능군으로 이어 구현하고, 타입/문법·데이터 손상 위험만 짧게 확인한다. 기능별 테스트 항목은 MD에 모은 뒤 마지막에 통합 실행한다.

상태는 **구현 중 / 구현 완료·검증 대기 / 검증 통과**로 기록한다. 현재 미커밋 수정분은 EL 통과 수에 포함하지 않는다.

- [일괄 구현 작업판·통합 테스트 T01~T09](../implementation/M2-BULK-IMPLEMENTATION-AND-TEST-PLAN.md)
- [다음 작업 인계](../implementation/NEXT-SESSION.md)
- [마지막 검증 완료 EL 상세](../implementation/M2-EL-MINOR-MARKET-ACCEPT.md)

아래는 이전 단계의 실행 기록이다. 과거의 미구현/답변 대기 문구는 위 현재 상태를 우선한다.

**M2-EL 검증 완료 (2026-10-28):** 마이너 만료 제안 수락·E66 DOMAIN 닫기·1년/$30k 갱신·원구단/타구단 이동·재무 재생. 집중9/9, 전체 npm run check 종료0: 엔진/API 796개 중794통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산 통과. duration_ms 962830. 실제 Neon/브라우저/APK 검증은 아니다. 국내 복귀 실행은 후속. [EL](../implementation/M2-EL-MINOR-MARKET-ACCEPT.md).

**M2-EK 검증 완료 (2026-10-28):** 마이너 만료 비교 창/실제 제안/E66 두 조회. 집중7/7, 전체 npm run check 종료0: 엔진/API 794개 중792통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 998088.3797, 동결 대상461파일 실행 동결 확인. 이후 중복 CR1개만 정리했고 TypeScript emit은 동일하다. 실제 Neon/브라우저/APK 검증은 아니다. 계약 수락·이적/실제 국내 복귀는 후속. [EK](../implementation/M2-EK-MINOR-MARKET-COMPARISON.md).

**M2-EJ 검증 완료 (2026-10-28):** KBO 출신 계약 원점·연도 재생·첫 콜업·서명 기간 연결. 전체 npm run check 종료0: 엔진/API 787개 중785통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 810442.1035, 동결 대상460파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. [EJ](../implementation/M2-EJ-KBO-US-CONTRACT-ORIGIN.md).

**M2-EI 검증 완료 (2026-10-28):** 대표 SP 휴식·불펜2연투 휴식을 실제 날짜 기반 준비에 연결, 과거/준비된 경기 보존. 전체 npm run check 종료0: 엔진/API 781개 중779통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1179771.366, 동결 대상456파일 재개 기준점 이후 변경0(이전 중단 기준과4파일 바이트 차이는 freeze.resumed 기록). 실제 Neon/브라우저/APK 검증은 아니다. [EI](../implementation/M2-EI-NATIONAL-PITCHER-REST.md). 아래10/27 마감/미구현 표기는 당시 이력이며 대표 휴식은 이번 묶음이다. 미국 MiLB 계약 연결은 잔여.

**세션 마감 (2026-10-27):** 5시간 잔여4%에서 EH까지 정리·커밋/푸시. 전체778/776·Neon환경2·웹22/22·실패0. [인계](../implementation/NEXT-SESSION.md) · [다음 계획](../implementation/M2-POST-EH-IMPLEMENTATION-PLAN.md). 새 기능 구현은 이 체크포인트 뒤 이어간다. PC 종료 안 함.

**새 사용자 결정 — 후속 구현 (2026-10-27):** KBO 출신 MiLB는 서명 기간 만료 후 미국 재계약/FA/국내 복귀 비교, 대표 RP/CP는2일 연속 실제 등판 후 다음 날 휴식.14/20/23에 기록했다. 이 결정의 실행 구현은 EH 동결 코드 이후이며 [연결 계획](../implementation/M2-POST-EH-IMPLEMENTATION-PLAN.md)에 호출자·남은 검사를 정리했다. 아래 과거 답변 대기는 당시 이력이다.

**M2-EH 검증 완료 (2026-10-27):** 대표 부상 교체의 첫 경기 전/라운드 경계를 실제 경기 준비에 연결. 과거 출장·부분 저장 재개·후보 고갈 원본 보존 검사. 의료/전력은 통제 fixture. 전체 npm run check 종료0: 엔진/API 778개 중776통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 716580.0985, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. [EH](../implementation/M2-EH-NATIONAL-INJURY-BOUNDARY.md). 긴급 하위리그/US 공통 후보 등 잔여로 M2 추정 유지.

**M2-EG 검증 완료 (2026-10-27):** 해외 진입의 병역 초기화·세계 경계·연말 조회 오류 수정, 실제 미국75경기/지급 검사. 전체 npm run check 종료0: 엔진/API 775개 중773통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 663675.2997, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. [EG](../implementation/M2-EG-OVERSEAS-ENTRY-CONTINUITY.md). 계약 만료 정책 답변 대기·완전 연도 이행은 후속.

**M2-EF 검증 완료 (2026-10-27):** WBC 종료 뒤 새 프로 개막·calendar-1 보존·복귀 급여 예측 버전·E46 첫 FINAL. 전체 npm run check 종료0: 엔진/API 774개 중772통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 672040.6242, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. [EF](../implementation/M2-EF-WBC-PROFESSIONAL-CALENDAR.md). 아래 EE의 WBC 답변 대기는 당시 이력이다.

**M2-EE 검증 완료 (2026-10-27):** 국제 단계·연속 날짜/건강/정규 복귀 감사·XP 참조 공유 수정. 전체 npm run check 종료0: 엔진/API 769개 중767통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 633942.4905, 동결 대상454파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. [EE](../implementation/M2-EE-NATIONAL-PHASE-DAY-AUDIT.md). WBC 날짜 질문 대기·국제/미국풀/99/24 잔여.

**M2-ED 검증 완료 (2026-10-27):** 한국 FINAL당 부상 remainingTeamGames 소모. 전체 npm run check 종료0: 767/765·Neon2·웹22/22. duration_ms 745981. [ED](../implementation/M2-ED-NATIONAL-INJURY-TICK.md). 증거 `evidence/M2-ED-check.log`.

**M2-EC 검증 완료 (2026-10-27):** 초청 7/2/1 봉인·날짜당 한국 피로 1회. 전체 npm run check 종료0: 767/765·Neon2·웹22/22. duration_ms 1103862. [EC](../implementation/M2-EC-NATIONAL-DAY-CLOSE.md). 증거 `evidence/M2-EC-check.log`.

**M2-EB 검증 완료 (2026-10-27):** E62 초청·E64 ACCEPT/REMAIN 도메인 재개. 전체 npm run check 종료0: 766/764·Neon2·웹22/22. duration_ms 1011454. [EB](../implementation/M2-EB-POSTING-EVENT-RESUME.md). 증거 `evidence/M2-EB-check.log`.

**M2-EA 검증 완료 (2026-10-27):** 포스팅 구단결정 E63·오퍼 E64 큐/완료/취소. 전체 npm run check 종료0: 765/763·Neon2·웹22/22·스모크. duration_ms 624903. [EA](../implementation/M2-EA-POSTING-EVENTS.md).

**M2-DZ 검증 완료 (2026-10-27):** 미국 FREEZE/TERMINATE에 18개월 2블록 봉인·정산 전 COMPLETED 거절. 집중1/1. 전체 npm run check 종료0: 765/763·Neon2·웹22/22·스모크. duration_ms 710245. native 2시즌 E2E 아님. [DZ](../implementation/M2-DZ-US-MILITARY-18MO.md).

**M2-DY 검증 완료 (2026-10-27):** DX bracket을 실제 선발28·기록·구종XP·봉인에 연결, P12 `max(11/15, 양PS종료+1)` window 봉인. 집중24/24. 전체 npm run check 종료0: 엔진/API 765개 중763통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1044505. 검증 중 실행 소스 미편집. 실제 Neon/브라우저/APK 아님. [DY](../implementation/M2-DY-INTERNATIONAL-TIMELINE.md). 일마감·초청기한·부상교체·WBC/OLY/P12 E2E·해외18개월·99/24/PF 잔여.

**M2-DX 검증 완료 (2026-10-27):** 4대회 대진 reducer·실제107경기 통제 fixture·pendingGame/21회 재개. 집중10/10. 전체 npm run check 종료0: 엔진/API 762개 중760통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1089016.2584, 원본443파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. 커리어 시간축 1차는 DY. [DX](../implementation/M2-DX-INTERNATIONAL-BRACKET.md).

**M2-DW 검증 완료 (2026-10-27):** 국가대표 실제28명·E44/E45·한자리 충원·AG 실제 기용·MLB 실제 데뷔E65. 집중25/25. 전체 npm run check 종료0: 엔진/API 757개 중755통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1168717.4243, 원본441파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. [DW](../implementation/M2-DW-NATIONAL-SELECTION.md). 국제 달력/중단/부상/XP·99/24/PF 잔여, M2 완료 아님.

**M2-DV 검증 완료 (2026-10-27):** 국가대표 사건5종·AG 공식 기록·투수 출장·체육요원 시즌 중복 정산 방지. 전체 npm run check 종료0: 엔진/API 741개 중739통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 804191.6272, 원본434파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. [DV](../implementation/M2-DV-NATIONAL-INTEGRITY.md). E45/28명 AI·달력/중단 worker·국제 부상/XP와24경로·PF-D08~15 잔여. M2 전체 약50% 추정 유지.

**M2-DU 구현 (2026-10-27):** AG 8개국 실제 INTERNATIONAL 대진·경기·결과 봉인. [DU](../implementation/M2-DU-ASIAN-GAMES.md). M2 영역 약 50% 유지.

**M2-DT 구현 (2026-10-27):** 국가대표 초청/결과 봉인·ATHLETE_ELIGIBLE·체육요원 3시즌. [DT](../implementation/M2-DT-NATIONAL-BENEFIT.md). M2 영역 약 50% 유지.

**M2-DS 구현 (2026-10-27):** 미국 28세 병역 기한 FREEZE/TERMINATE·완료. 한국 등록 미생성. [DS](../implementation/M2-DS-US-MILITARY-PLAN.md). M2 영역 약 50% 유지(국가대표·99·24경로 잔여).

**M2-DR 구현 (2026-10-27):** 포스팅/해외FA 봉인 제안 → `activateKboUsCareer` 미국 루트. 계약금 없음, 복귀권 보존. [DR](../implementation/M2-DR-US-ACTIVATION.md). M2 영역 약 50% 유지.

**M2-DQ 구현 (2026-10-27):** 해외 FA 9시즌(보상금·승인 없음, 국내권 RELEASED)과 포스팅 귀국 협상. 미국 루트 활성화는 다음. [DQ](../implementation/M2-DQ-OVERSEAS-FA-RETURN.md). M2 영역 약 50% 유지.

**M2-DP 구현 (2026-10-27):** KBO 포스팅 요청·구단 승인/보류·제안 0~3·체결 시 복귀권 snapshot·보상금 구단만. 미국 루트 생성·해외 FA·귀국 협상은 다음. [DP](../implementation/M2-DP-POSTING.md). M2 영역 약 50% 유지.

**M2-DO 구현 (2026-10-27):** 6시즌 적립 뒤 원소속 MLB FA 1건 체결과 보장 연차 동결, 옵션 3시즌 소진 시 잔류/FA 선택. 다른 구단 이적·포스팅·귀국은 없다. API/화면 미연결. 검사 수치는 [DO](../implementation/M2-DO-MAJOR-FA.md). M2 영역 약 50% 유지.

**M2-DN 검증 완료 (2026-10-27):** 상무/현역 목표 예외·MLB FA 전1년 재계약·루트4·연봉/일일 지급/이월·재승격 중복 계약 방지. 전체 npm run check 종료0: 총716개 중714통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms839708.6663, 동결418파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. [DN](../implementation/M2-DN-MAJOR-RENEWAL.md). 실제 새해 첫날75경기와 통제7시즌은 별도 근거다. 잔여5% 시 기록·커밋·푸시, PC 종료 금지.

**M2-DM 기본 경로 검증 완료:** 시즌 목표10종·기념 보상·E90 outbox. 전체 npm run check 종료0: 총710개 중708통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms809722.8611, 동결412파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. [DM](../implementation/M2-DM-SEASON-GOALS.md). 다음은 상무/현역 목표 등록 예외·미국 계약. MLB 연봉 최종800000/나이별5·3·2·1년 제안 결정은13/14에 반영했다.

**M2-DL 검증 완료:** 미국 수동/45세 은퇴·실제 레벨별 공개 보관·기록/수입 보존. 전체 npm run check 종료0: 총699개 중697통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms496580.9465, 동결410파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. [DL](../implementation/M2-DL-US-RETIREMENT-ARCHIVE.md). 전체83%/남음17%와 M2영역50%는 남은 핵심 경로가 있어 유지하며 기능 범위 가중 추정이다. PC 종료 금지 지시 유지.

**M2-DK 검증 완료:** 전체 npm run check 종료0: 총695개 중693통과·실패0·Neon환경 부재2개 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms562628.2466, 동결406파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. [DK](../implementation/M2-DK-US-YEARS-LEARNING-SUPPLY.md). M2 영역50%는 유지하며 전체83%/남음17%는 병렬 보고 포함 추정치다. PC 종료 지시는 철회됐다.

**M2-DJ 검증 완료:** 숙련0 XP 이월/다음 PRE 재학습과 실제 MLB PS 연결. 집중23/23·8/8, 전체 check 종료0: 엔진/API676·웹20 통과·실패0·Neon2환경 부재 건너뜀. 실제 PS46경기 우승을 확인했다. 이전 DI230897f는 main/작업 브랜치 푸시 완료. M2 영역50%는 미국 다음 해/FA/해외 병역·국제·24경로 잔여가 있어 유지한다. [DJ](../implementation/M2-DJ-RELEARNING-AND-MLB-POSTSEASON.md).

**M2-DI 검증 완료:** 사용자 요청에 따라 별도 작업 초안을 두지 않고 구종 학습 분기 정산·학교 사전 학습 명령·다일 청크 메타데이터·일마감 복제 비용 개선을 본 저장소에 반영했다. 집중27/27과 고교12실제 등록경기 학습 정산을 확인했다. 전체 check 종료0: 엔진/API671·웹20 통과, 실패0·Neon2환경 부재 건너뜀. 후속 DJ에서 숙련0 XP 이월/재학습·MLB PS를 연결했다. 미국 native검증은 기존3600경기에서 구/신 비교3675경기를 거쳐 현재3857경기·마감80일에 저장했다. 전체8790경기 완료 아님.

2026-10-27 · **M2 진행 중**(최신 완료 DN) + **M6 기능 마감**(브랜치 `m6/club-mode`, main 병합 전) + **M3·M4·M5·M7·M8·M9 완료(셸)**. **기능 범위 가중 추정치**. 다음=국제 대회 경기 / L04 50시즌 실주행 / M2 전체 check 재실행 / 실배포·실기기.

M2-DJ: 엔진/API676개·웹20개 통과, 실패0·Neon2개 환경 부재로 건너뜀. 보유권 정책 확정(다음 해 권리 해제 후 타구단1년 비교). DD 18개월은 미완료. M2 전체 완료 아님. [인계](../implementation/NEXT-SESSION.md).

M3: **완료**(V02/V03). 메일 재설정 실발송만 M9로 보류. [M3 완료](../implementation/M3-COMPLETE.md).

M4: **완료**(핵심12·HTTP·IME/터치 V08 일부). 풀 엔진=M2. [M4 완료](../implementation/M4-COMPLETE.md).

M5: **완료(셸)** — 33화면 Decision 스텁·라우트·fixture/API. 픽셀·SR 실기기는 수동 잔여. [M5 완료](../implementation/M5-COMPLETE.md).

**M6 기능 마감(2026-10-27, `m6/club-mode`):** A~M. M6-M은 상대 명단 강 65, 중 55, 약 45다. 대회 경기를 치르지 않아 구단 90%(기여 18), 전체 83%를 유지한다. [마감](https://github.com/bossxor/baseball_Career/blob/m6/club-mode/docs/implementation/M6-CLOSE.md).

**현재 작업:** M2는 DU 아시안게임까지다. E44–48/E55·99사건·24경로·PF-D·WBC/OLY는 남았다. 구단은 상대 명단까지이며 L04 실주행은 아직이다. 실 DNS·실기기는 후속.

| 구현 영역 | 전체 비중 | 영역 완료 추정 | 전체 기여 |
|---|---:|---:|---:|
| M0 저장소·검증 골격 | 5% | 100% | 5% |
| M1 경기 시뮬레이션 엔진 | 10% | 100% | 10% |
| M2 선수 커리어·사건 엔진 | 30% | 55% | 16% |
| M3 계정·DB·기기 간 저장 명령 | 12% | 100% | 12% |
| M4 실제 핵심 웹 플레이 화면 | 10% | 100% | 10% |
| M5 나머지 실제 화면·접근성 | 5% | 100% | 5% |
| M6 구단 운영·AI·장기 경제 | 20% | 90% | 18% |
| M7 내보내기·백업·중계 | 4% | 100% | 4% |
| M8 모바일 패키징·실기기 | 2% | 100% | 2% |
| M9 배포·운영·출시 검증 | 2% | 100% | 2% |
| **합계** | **100%** | — | **84%** |

계산: 전체 완료 = 비중 × 영역 완료율의 합, 남음 = 100 − 전체 완료. 비중은 [120 구현 순서](120-IMPLEMENTATION-ROADMAP.md)의 범위를 바탕으로 만든 작업 추정치(D)다. 구현량·난도가 드러나면 근거와 함께 재평가하며, 같은 AI 기능을 M2와 M6에 중복 가산하지 않는다. M2는 내 선수 경로·사건, M6는 독립적인 리그 AI/재정 기반에 대한 평가다. 설계보드·준비된 이미지·빈 웹/API 골격은 실제 플레이 화면이나 클라우드 저장 완료로 세지 않는다.

**완료:** M3 [COMPLETE](../implementation/M3-COMPLETE.md) · M4 [COMPLETE](../implementation/M4-COMPLETE.md) · M5 [COMPLETE](../implementation/M5-COMPLETE.md) · M7 [COMPLETE](https://github.com/bossxor/baseball_Career/blob/6eda98e6650aa4d0c23619831f726bd063d30521/docs/implementation/M7-COMPLETE.md) · M8 [COMPLETE](https://github.com/bossxor/baseball_Career/blob/6eda98e6650aa4d0c23619831f726bd063d30521/docs/implementation/M8-COMPLETE.md) · M9 [COMPLETE](https://github.com/bossxor/baseball_Career/blob/6eda98e6650aa4d0c23619831f726bd063d30521/docs/implementation/M9-COMPLETE.md).

**M8 완료:** [M8-COMPLETE](https://github.com/bossxor/baseball_Career/blob/6eda98e6650aa4d0c23619831f726bd063d30521/docs/implementation/M8-COMPLETE.md). 실기기·release=후속.

**M9 완료:** [M9-COMPLETE](https://github.com/bossxor/baseball_Career/blob/6eda98e6650aa4d0c23619831f726bd063d30521/docs/implementation/M9-COMPLETE.md). 실 DNS/배포·메일·로고 권리=후속.

**M7 완료:** [M7-COMPLETE](https://github.com/bossxor/baseball_Career/blob/6eda98e6650aa4d0c23619831f726bd063d30521/docs/implementation/M7-COMPLETE.md). PNG 렌더·중계 UI·실기기 공유=후속.

**M5 완료:** [M5-COMPLETE](../implementation/M5-COMPLETE.md). 픽셀·SR 실기기=수동 잔여, 엔진/구단=M2/M6.

**M6 진행:** [M6-H](https://github.com/bossxor/baseball_Career/blob/m6/club-mode/docs/implementation/M6-H-CLUB-LONG-RUN.md). 구단 75%. L04 체크포인트. 50시즌 실주행은 후속. main 병합 전. `b82f7e2` 푸시됨.

**M4 완료:** [M4-COMPLETE](../implementation/M4-COMPLETE.md). 풀 엔진=M2.

**직전 검증 완료 M2:** M2-DH — 미국 정규시즌 묶음. 엔진/API663·웹20 통과, 실패0, Neon 2개 건너뜀. 8790경기 실주행은 미완. M2 영역 50% 유지. [DH](../implementation/M2-DH-US-FIRST-SEASON.md).

**이전 완료:** M2-DF — 오프시즌 출구/보유권 비교 경로. 집중12/12·전체632/632. M2 잔여 계속.

**이전 완료:** M2-DE — 실제 AI 수락/갱신·동일 공식 건강 등록 E96·영수증/계약/경기/등록 봉인·과거 읽기/ACK·JSON/중복/변조 거부. 집중6/6·전체625/625·실패0·취소0. [DE](../implementation/M2-DE-AI-TEAM-REUNIONS.md).
**이전 완료:** M2-CZ — 상무 실제 공동 등록 E96·과거 증거 조회/ACK·구 저장 증거 소급 없음. 집중38/38·전체 check591/591·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. [CZ](../implementation/M2-CZ-SANGMU-TEAM-REUNION.md).

**이전 완료:** M2-CY — 실제 신규 입대 관계 분리·이력 보존·실제 상대 출장 E95. 집중30/30·전체 check585/585·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. [CY](../implementation/M2-CY-SANGMU-RELATION-SEPARATION.md).

**이전 완료:** M2-CX — 상무 전역/모집 공석 보충 원장2·보조 선수만의 실제 경기·구 저장 보존. [CX](../implementation/M2-CX-SANGMU-VACANCIES.md). 집중22/22·전체 check580/580·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. 전체 추정은35%/65% 유지.

**이전 완료:** M2-CW — 미지급 기간의 개막 부상 증거/새 기간 버전·옛 지급/무증거 구 저장 보존. 집중25/25·전체 check574/574·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. 공석 보충은 CX, 당시 후속이던 NPC 계약 결정/실제 복귀는 DA/DB에서 완료했다. [CW](../implementation/M2-CW-OPENING-REHABILITATION.md).

**주요 남은 구현:** M2 잔여(18개월 복무 검증·미국 다음 시즌과 8790경기 실주행·나머지 사건), M6 잔여(12개 장기 시뮬레이션·병역/국제/AI 전략, 브랜치 `m6/club-mode`), 실 DNS·실기기·release.

**계속 작업하는 사람의 갱신 규칙:** 구현 마일스톤마다 이 맨 위 블록의 기준 마일스톤·변경·남은 범위를 갱신하고 기능 완료율을 다시 평가한다. 수치가 그대로면 그대로인 이유를 이력에 기록한다. PROGRESS/NEXT-SESSION·증거 로그와 함께 저장하고, 설계 패키지/해시를 재생성하여 검증 후 같은 커밋에 포함한다. 전체 실행 결과는 기능 진척과 별도로 기록한다.

---

## 아래는 이전 시점의 기록

# 구현 진행 안내 — 2026-10-21

M2-AF(2026-10-21): 고교 NPC 희소 분포·미국 스카우트 평가65에 이어 미국 오퍼 고정/30게임일 기한·계약/권리/자리·예산 예약, 미국30조직 가상3,420명 초기 생성과 모집 재고를 연결했다. 평균 성장/숨김 P/구 저장값은 유지한다. 공식 미국 메타데이터·재무 공급자/초기 NPC 계약·활성 마이너 등록/경기·세계 작업자·플레이 UI/계정/DB/APK는 후속이다. 관련23/23과19/19, 타입·빌드·정적 검사 및 한계는 [진행](../implementation/PROGRESS.md)·[인계](../implementation/NEXT-SESSION.md)·[M2-AF](../implementation/M2-AF-US-INITIAL-ROSTERS.md)를 따른다. 아래는 이전 이력이다.

---

# 현재 작업 — 구현 직전 최종 설계 리뷰·정정 완료

2026-10-20: 구현 직전 최종 리뷰131에서 생성 API·생성 전 잠재력/홈 안내·추가진루/동률키·공개 DTO·패키지 무결성의5개 정합 문제를 발견하고 기존 확정 기준으로 정정했다. 새 게임 규칙은 추가하지 않았다. 이번 요청은 마지막 점검이며 실제 앱/엔진/API/DB/APK 구현은 시작하지 않음. 실제 렌더·키보드·스크린리더와 V01~V12는 미실행 상태를 유지한다.

[131 최종 리뷰](131-FINAL-DESIGN-REVIEW.md) · [130 인계 기준](130-PREIMPLEMENTATION-HANDOFF.md) · [120 구현 순서](120-IMPLEMENTATION-ROADMAP.md). 다음에 명시적으로 구현을 요청하면 M0부터 진행한다. 이미 확정한 게임 규칙을 반복 질문하지 않고 실제 실행 검증은 구현 뒤 별도로 기록한다. 아래는 이전 이력이다.

---

# 현재 작업 — 구현 전 설계 인계 마감 / 실제 실행 검수는 열림

2026-10-20: 구현 전 가능한 세 항목을130 인계 기준과 기계 판독 준비표로 마감했다. 보드 최신화·확인된 소스 문제 수정·정적 접근성13검사·45화면/8상태 대조는 완료했다. 실제 렌더·키보드·스크린리더는 보안 정책 차단/미실행으로 남기고 증거 없이 PASS로 올리지 않는다. 진입 README/START-HERE/HANDOFF와92의 낡은 현재 안내를 수정했다. 이미지80/TODO0/CODE_ONLY11·45화면/99이벤트/핵심298/23기대값 묶음 유지, 신규 게임 규칙과 구현 착수 없음.

[130 인계 기준](130-PREIMPLEMENTATION-HANDOFF.md) · [준비표](preimplementation-readiness.json) · [최신 설계 보드](design-board.html). 현재 가능한 서면 작업은 인계 완료이며 같은 질문·미확인 PASS·형식적 문서 추가를 반복하지 않는다. 새로운 설계 변경이나 허용 환경의 실제 검수 증거가 있으면 이어간다. 별도 요청 전 게임/엔진/API/Neon/인증/APK 구현은 시작하지 않는다. 아래는 이전 이력이다.

---

# 현재 작업 — 메인 보드 최신화·정적 접근성 점검 완료 / 실제 렌더 차단

2026-10-20: 설계 보드에 최신 승인 모음·팀 배지·카드·아이콘11묶음 링크를 반영하고 접근성 소스를 보완했다. 파일 기반13검사 통과(이미지60·입력37·표6). 실제 file: 보드 관찰은 브라우저 URL 보안 정책으로 차단돼 렌더·키보드·스크린리더 검수는 미실행. 우회하지 않았으며45화면의 미검수 플래그를 유지한다. 이미지80/TODO0/CODE_ONLY11과 게임 규칙은 불변, 게임 구현 미착수.

[최신 설계 보드](design-board.html) · [129 점검 결과와 제한](129-DESIGN-BOARD-REFRESH-ACCESSIBILITY.md) · [기계 판독 결과](design-board-accessibility-audit.json). 다음 작업자는 실제 렌더를 PASS로 바꾸거나 다른 주소/브라우저로 우회하지 않는다. 게임/엔진/API/Neon/인증/APK는 별도 착수 지시 전 구현하지 않는다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 코드 표시11묶음 승인 반영 완료

2026-10-20: 사용자 승인에 따라 코드 표시11묶음의 비교 보드·승인 기록·화면별 표시 가이드를 반영했다. 현재 수정 가능한 승인 작업 기준이며 실제 앱 구성요소는 NOT_IMPLEMENTED다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1과45화면/99이벤트/핵심298은 유지한다. 게임 구현은 시작하지 않으며 최종픽셀·브라우저·기기·접근성 실행 검수는 미실행이다.

[승인 표시 보드](code-display-board.html) · [127 표시 명세](127-CODE-DISPLAY-SPECIFICATION.md) · [128 화면 점검](128-PREIMPLEMENTATION-SCREEN-AUDIT.md). 표시안 승인 질문을 반복하지 않는다. 다음은 허용 환경의 실제 렌더 검수이며 임시 서버·다른 브라우저로 정책 차단을 우회하지 않는다. 별도 구현 착수 지시 전 앱/엔진/API/Neon/인증/APK 구축으로 넘어가지 않는다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 구현 전 표시 명세·화면 대조 완료 / 시각 승인 대기

2026-10-20: 구현 전 코드 표시11묶음의 상세 명세127과 전45화면 정적 대조128을 작성했다. 45개 행의8상태·읽기 순서·주행동·슬롯 일치와360/390/768/1280 계약을 확인했다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1 유지.83/108의 낡은 실루엣 미제작·빈티지/얼굴 프리셋 표기를 기존 승인 기준으로 정정. 게임 규칙·45화면/99이벤트/핵심298 불변. 실제 렌더·접근성·기기 시험은 미실행, 구현 미착수.

[127 표시 명세](127-CODE-DISPLAY-SPECIFICATION.md) · [128 점검 결과](128-PREIMPLEMENTATION-SCREEN-AUDIT.md). 아이콘11묶음 비교 보드는 C:/Users/N-052/AppData/Local/Temp/baseball-code-display-review-20261020/review-board.html 에 있고 미승인이라 저장소 미반영. 다음은 이 시각안 사용자 확인과 실제 허용 환경 렌더 검수이며 게임 구현으로 넘어가지 않는다. 아래는 이전 이력이다.

---

# 현재 작업 — 이미지 파일 제작 목록 승인 반영 완료

2026-10-20: 사용자 승인 마지막11종(메달3·대회 독자엠블럼4·연대기테마3·스플래시1)을 반영했다. 이미지 레지스터92항목은 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1이다. 제작 목록의 이미지 파일은 모두 준비됐으며 CODE_ONLY11묶음 표시 명세와 화면45×8상태/접근성/반응형 마감 검수는 남는다. 실제 브라우저·기기·APK 설치·DB 시험 미실행. 게임 규칙·45화면/99이벤트/핵심298 불변, 앱 구현 미착수.

[승인 이미지 전체 보드](approved-art-board.html) · [마지막11종 승인 기록](assets/brand/APPROVED-FINAL-IMAGES-v1.json). 미승인 시안은 반영하지 않았다. 다음은 구현 전 표시 명세와 화면/인계 정합 점검이다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 컬러 도장13종 승인 반영

2026-10-20: 컬러 기록 도장13종 사용자 승인 반영. 프레임3·배경3·도장13·책장표지1, 기념 보상20항목 모두 파일 완료. 레지스터 EXISTS69/TODO11/CODE_ONLY11/LEGACY_REFERENCE1. 남은 이미지는 메달3·연대기 테마3·스플래시1(P1 7항목), 대회 엠블럼4(P2). 게임 규칙·45화면/99이벤트/핵심298 유지. 앱/DB/API/APK 구현은 시작하지 않음.

다음11항목 시안도 저장소 밖에 제작하고 사용자 승인 후 반영한다. 아래는 이전 이력이다.

---

# 현재 작업 — 기념 보상7개 승인 반영 / 컬러 도장13종 확인 대기

2026-10-20: 사용자 승인 프레임3·배경3·책장표지1만 반영. PNG4개는 생성 원본1122×1402를 보존하고 레지스터 실제 규격을 기록했다. 도장13종은 색상 추가 요청으로 수정 시안만 저장소 밖에 보관하며 미반영. EXISTS56/TODO24/CODE_ONLY11/LEGACY_REFERENCE1. 게임 규칙·45화면/99이벤트/핵심298 불변. 구현 미착수.

컬러 도장 시안: C:/Users/N-052/AppData/Local/Temp/baseball-stamps-color-v2-20261020. 사용자 승인 후 반영하고 남은11항목 제작으로 이어간다. 아래는 이전 이력이다.

---

# 현재 작업 — 컬러 팀 배지10개 승인 반영

2026-10-20: 대학9·군 체육팀1 컬러 배지10개 사용자 승인 반영. 학교마다 고유 주색·보조색을 사용하며 선수 사건 일러스트 네이비 원칙과 구분한다. 이미지 레지스터92항목은 EXISTS49/TODO31/CODE_ONLY11/LEGACY_REFERENCE1. 남은 P1 27개·P2 4개. 게임 규칙·45화면/99이벤트/핵심298은 불변이며 구현은 시작하지 않았다.

[승인 이미지 보드](approved-art-board.html) · [배지 승인 기록](assets/badges/APPROVED-BADGES-v1.json). 다음은 기념 보상 외형 시안이며 묶음별 승인 절차를 유지한다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 구현 전 마감 계속 진행

2026-10-20 사용자 범위: 남은 작업 모두 진행, 구현은 시작하지 않음. [126 마감 계획](126-PREIMPLEMENTATION-ART-CLOSURE.md). 배지10개 시안은 저장소 밖 임시 폴더에서 제시했고 사용자 승인 대기다. 이미지 레지스터의41TODO/39EXISTS는 아직 변경하지 않았다. 다음은 해당 묶음 승인 후 반영이다.

## 직전 완료 이력

# 설계 현황 — 우리팀 네이비 통일·라이벌 구분 완료

## 현재 요약 (2026-10-20)

- 야간 라이벌의 버건디 상대 수정본을 사용자가 최종 승인해 추가사건 atlas를 새 v2 PNG로 연결했다. 기존3개를 포함해 활성4PNG의 우리팀 네이비 통일이 완료됐고 낮·야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 구분된다. 원본4PNG는 보존했다. 레지스터41TODO/39EXISTS·45화면/99이벤트/핵심298은 유지한다.
- [승인본 보드](approved-art-board.html), [원본·수정 기록](assets/art-lab/NAVY-UNIFORM-GENERATION.json).
- 실루엣14종·로고2·아이콘1·신규6컷·네이비4PNG 승인 반영. 검증3개 모두 종료코드0/PASS.
- 다음은 P1 나머지37항목·P2 4항목의 시안·승인이다. 미승인 자산을 저장소에 넣지 않는다.
- 실제 앱/브라우저/DB/API/APK 검수는 미실행이다.

## 이전 진행 이력

# 설계 현황 — 네이비 수정3PNG 반영 / 야간 라이벌 최종 확인 대기

## 현재 요약 (2026-10-20)

- 우리팀 네이비 수정본 중 메인·기본사건·고교3PNG는 사용자 승인에 따라 새 v2 파일로 연결했다. 원본3PNG는 보존했다. 추가사건 atlas의 야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 추가 수정했고 이 최종본만 사용자 확인 대기다. 이미지 레지스터 TODO41/EXISTS39와 게임 규칙은 그대로다.
- 신규 청춘6컷은 이미 승인·푸시 완료. 이번 네이비3PNG 검증3개도 종료코드0/PASS.
- [승인본 보드](approved-art-board.html), [수정 기록](assets/art-lab/NAVY-UNIFORM-GENERATION.json).
- 실제 앱/브라우저/DB/APK 검수는 미실행이다.

## 이전 진행 이력

# 설계 현황 — 청춘 장면6컷 반영 / 네이비 통일 시안 승인 대기

## 현재 요약 (2026-10-20)

- P1 청춘 애니6컷을 사용자 승인 후 반영했다. 라이벌은 흰색/네이비 팀과 버건디 팀으로 구분한다. finish 보드의 대학·마이너·기록·계약 화면은 의미에 맞는 패널로 연결했다. 전체92항목 중 TODO41/EXISTS39/CODE_ONLY11/LEGACY_REFERENCE1이다.
- 우리팀 복장 네이비 통일 U. 기존 활성4PNG 수정 시안은 임시 폴더에 제작 완료·승인 대기 상태이며 승인 전 연결하지 않는다.
- 승인6컷 검증3개 모두 종료코드0/PASS. 네이비 수정4PNG는 별도 승인 대기.
- P0 17항목 파일 완료. 45화면·99이벤트·핵심298·23기대값 묶음 유지. 실제 앱/DB/브라우저/APK는 미실행이다.
- 작업 V:\docs\design, 승인 변경만 기존 정상 Git 체크아웃으로 커밋·푸시한다.

## 이전 진행 이력

# 설계 현황 — P0 이미지 파일 승인 반영 완료

## 현재 요약 (2026-10-20)

- 사용자가 앱 아이콘1(네이비 배경)을 승인했다. Android 전경/배경/단색 SVG3개와 PWA192/512/maskable512·apple180 PNG4개·favicon SVG를 반영했다. P0의17항목(실루엣14·브랜드3묶음) 파일 제작은 모두 완료다. 전체92항목은 TODO47/EXISTS33/CODE_ONLY11/LEGACY_REFERENCE1이며 앱 연결·OS 설치 검수는 미실행이다.
- [승인본 보드](approved-art-board.html), [이미지 레지스터](image-production-register.json).
- 검증3개 모두 종료코드0/PASS. PNG 규격·불투명도와 전경 안전영역 검사 포함.
- 실루엣14종·로고2·아이콘1, 기본 배색 네이비/블루.
- 45화면·99이벤트·핵심298 기대값·23기대값 묶음은 유지한다. 실제 앱/DB/브라우저/APK는 미구현/미검수다.
- 다음은 P1 이미지의 별도 시안·사용자 승인이다. 미승인 이미지는 저장소에 넣지 않는다.
- 파일은 V:\docs\design, 승인 변경만 정상 Git 체크아웃으로 커밋·푸시한다.

## 이전 진행 이력 — 아이콘 승인 전

# 설계 현황 — 실루엣14종 승인 반영 완료

## 현재 요약 (2026-10-20)

- 사용자가 남은8종 전체를 승인해 A 스타일·네이비/블루 SVG로 반영했다. 타자6투타조합·투수4폼×2손, 실루엣14/14와 로고2가 모두 승인됐다. 전체 이미지92항목 중 TODO49/EXISTS31/CODE_ONLY11/LEGACY_REFERENCE1. Android/PWA 아이콘2묶음과 P1/P2 이미지는 별도 미완료다.
- [전체 승인 보드](approved-art-board.html), [제작 레지스터](image-production-register.json), [누적 승인 기록 v3](assets/brand/APPROVED-ART-v3.json).
- 화면 슬롯은 투타/폼 14개 조합 전체를 참조한다. 이미지 로딩 실패 때만 이니셜로 대체한다.
- 검증3개 모두 종료코드0/PASS, 6타자+8투수의 전체 슬롯 조합 검사 포함.
- 고정 범위 45화면·99이벤트·핵심298 기대값·23기대값 묶음은 유지한다. 실제 앱/DB/브라우저/APK 구현·검수는 미실행이다.
- 작업 파일 V:\docs\design. 기존 정상 Git 체크아웃으로 승인 변경만 커밋·푸시한다.
- 다음 P0는 Android/PWA 아이콘 묶음이다. 로고 선택과 별개로 완성도·규격 시안을 보여주고 승인받아야 한다.

## 이전 진행 이력 — 두 번째 묶음 당시 현황

# 설계 현황 — 두 번째 실루엣 묶음 승인 반영

## 현재 요약 (2026-10-20)

- 사용자가 2차 시안 1~4번(우투좌타·좌투좌타 타자, 좌투 오버핸드·우투 쓰리쿼터 투수)을 모두 승인했다. A 스타일·네이비/블루 배색으로 SVG 4종을 추가했다. 실루엣 6/14 완료, 남은 실루엣 8종은 별도 승인 대기다. 전체 이미지 레지스터 92항목은 TODO57/EXISTS23/CODE_ONLY11/LEGACY_REFERENCE1이다.
- [승인본 보드](approved-art-board.html), [이미지 제작 명세](124-IMAGE-PRODUCTION-BRIEF.md), [누적 승인 기록](assets/brand/APPROVED-ART-v2.json).
- 슬롯은 정확한 투타/투구폼의 6개 승인본을 가리키며 미승인 조합은 이니셜 카드로 대체한다.
- 고정 범위 45화면·99이벤트·핵심298 기대값·23기대값 묶음. 실제 앱/DB/브라우저/APK 구현·검수는 미실행이다.
- 작업 파일은 V:\docs\design. 정상 Git 체크아웃으로 승인 변경만 커밋·푸시한다.
- 이번 검증 3개 모두 종료코드0/PASS.
- 다음은 남은 8실루엣의 별도 묶음 시안·승인이다. 아직 만들거나 완료 처리하지 않았다.

## 이전 진행 이력 — 첫 묶음 당시 현황

# 설계 현황 — 첫 이미지 묶음 승인 반영

## 현재 요약 (2026-10-20)

- 사용자 선택 1~6 수정: 결정표·후속 문서 반영 여부·기대값 색인·E63 승인/보류 해결 규칙·이미지 승인 절차를 정리했다. 1단계 결과 승인 후 2단계를 시작했고 첫 묶음 선택을 반영했다.
- 기대값 색인은 23묶음이며 핵심 298개는 기존 6파일만 집계한다. 빠른 진행 12·첫 구단 복구 7·오프시즌 충돌 12는 별도다.

- 점검 정리: 14에 119/121/122/124/125 사용자 결정을 기록, START-HERE·README·HANDOFF의 겹친 ‘최신’ 배너를 한 줄로 합치고 이력으로 이동, S16 카탈로그에 좌우 분리 기록 반영, 기대값 묶음 23개 색인 [expectation-sets-index.json](expectation-sets-index.json) 추가.

- 심층 점검(경제·이벤트): 경제 수치(예산120억·총연봉80~95억·미래보장108억·직원 급여)는 충돌 없음. 이벤트 선택지 68종 처리 방식이 비어 있어 [125](125-EVENT-CHOICE-DISPATCH.md)로 DOMAIN/NAVIGATE/ACK 분류·BLOCKING 해결 시점을 확정했다. 보드 S02에 손·타석·투구폼 입력, S16에 좌우 분리 기록 표 시안을 추가했다(렌더 미확인).

- 이미지 제작 인계: [124](124-IMAGE-PRODUCTION-BRIEF.md)+image-production-register.json(92항목. 작성 당시 제작 필요 61·있음 19였고 이후 승인 반영으로 현재는 제작 필요 0·있음 80·코드 제작 11·보존 1). 이미지는 다른 곳에서 제작한다. API·스키마·로그 정합은 [122](122-API-SCHEMA-LOG-ALIGNMENT.md), 새 효과 합산 예제는 [123](123-EFFECT-SUM-EXAMPLES.md).

- 최신 사용자 확정: [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) 생성 선수 손 우투85/좌투15·타석 분포, S16 좌우 분리 기록. PORTRAIT 슬롯은 SILHOUETTE_CARD로 전환했고 **실루엣 2종 승인 반영·12종 제작 대기**(119).

- 구현 착수 대비: [120](120-IMPLEMENTATION-ROADMAP.md) 모듈 경계·마일스톤 M0~M9·게이트 V01~V12 매핑. 구현 착수 지시 전에는 시작하지 않는다.

- 최신 사용자 확정: [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 선수는 사람 외형 없이 이름+던지는 손/타석+투구폼4종, 초상은 실루엣+이름 카드. 투구폼×구종 친화와 반대손 좌우 상성 기능은 U이며 계수·친화표는 D다. 41/08/79/48/57 본문에 반영했고 이전 SVG 시안은 삭제 이력으로 남기고 현재는 투수 A·타자 A 승인본 2종을 반영했다.

- 이전 상세설계: [118 은퇴·보관·구단연속성](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md).9장면·12검수계획·19세반값과계보claim을연결했습니다.
- 직전 작업: [114 구단 첫시즌](114-FIRST-CLUB-SEASON-OPERATIONS.md), [113 첫커리어](113-FIRST-CAREER-SEASON-EXPERIENCE.md), [112 능력100과성적](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md), [111 아트U](111-ANIMATION-MAIN-ART-DIRECTION.md).
- 고정 범위:45화면/99이벤트,6능력·집중4,웹4환경+Android APK,단독구단·선택보관투입·이어하기버튼만.
- 상태: 문서/시안/정적검사 단계. 실제 앱·Neon·DB·경기엔진·브라우저/실기기·build/APK는미구현/미검수입니다.
- 작업 파일:V:\docs\design. 매작업마다최신요약·아래이력·통합MD/MANIFEST를갱신하고커밋·푸시합니다.
- 현재: E13 취소 문구 정정과 유지/취소/읽음 결과 문구 의미 감사를 마쳤습니다. 62개 이벤트·90개 선택지의 중복 결과 문구를 선택지별로 분리했고 verify에 이벤트 내 resultCopy 중복 검사를 추가했습니다. 다음은 미제작 실루엣의 별도 묶음 시안·승인입니다. 연령별 얼굴 라이브러리는 119의 실루엣 카드로 대체됐습니다.

## 이전 작업 이력


2026-10-19. 현재는 상세설계와 정적·로컬 UI 시안 단계다. 실제 앱·Neon·APK·외부 배포는 시작하지 않았다. 최신 작업 파일은V:\docs\design에 계속 반영한다.

## 이번에 마친 연결

[106 확장 UI 인계](106-EXPANSION-UI-CLOSURE.md)에서102~104의 남은 대표 UI를 연결했다.100/101은105의 연결을 유지한다.

- 목표·도전: 추천3/전체 적격 목표·선택0~3, MID 진척22/30·불가 사유,기념 카드 외형,12개 공개 도전과제·자동 해금/정정.
- 에이전트: 상향률별 금액·확률70/55/40 예시,성공 오퍼와기본 오퍼 유지 실패를 구분.
- 관계: 상대 카드·같은kind 비교·실제 투타 직접 전적과5개 빈 사유. T14가 막히지 않도록 실제 프로 대결 근거의관계 형성도51/60/E94에 연결D. 고교 기본 라이벌은 유지.
- 지도자: 내 원본/가상 탭,현역 claim 사용 불가,보장7500만원/미지급 채무,담당 변경 전후 효과와다음 세계일 효력.
- 중계: 확정된 같은5타석 로그의재생/배속/한 타석/되감기/스킵·스코어 숨김. 전략 개입/경기 재추첨 없음.
- 연대기·내보내기: 핀 피드/시즌·scope별 책/필터,공식 카드와 안전한 메모 초안,PNG/JSON 미리보기·처리 라인·실패 후 확인 경로.

[비교 보드](art-direction-lab.html)는30대표 배치/26흐름×3=78상태다. 도전과제와내보내기는하위 배치이므로28개 기존 화면ID를 재사용한다. 기본45화면 목업/99이벤트는 유지한다. 모든45화면의완성 픽셀 렌더를 마쳤다는 뜻은 아니다.

## 자료와 실제 동작 범위

[확장 예시 데이터](expansion-preview-data.json)와[61항목 연결 지도](state-ui-preview-coverage.json)를 작성했다.100~104의61항목을 원문/대표 시안 진입점으로 빠짐없이 연결했으며각 실행 상태는NOT_EXECUTED다. 기존298게임 fixture도NOT_IMPLEMENTED를 유지한다.

시안에서목표 체크/외형·탭/책 필터/메모 미리보기/고정 로그 감상은기기 메모리에서만 동작하도록 작성했다. 실제 세계 확정·목표 저장·협상/고용·프로필 저장·파일 생성 API는 없다. 게임 결과·능력·잠재력·자금·보상·난수는바꾸지 않는다.

기념 보상만,보유 특성 자동 적용,히든의 서버용 정의/공개DTO 경계,6능력·집중4·100상한·반값19세/원본 불변·구단 치트 정책을 유지한다. 이어하기 진입은버튼만 표시하며중단/복구 설명 카드를 다시 만들지 않았다. PNG8개는기존 자산을 재사용한다.

## 검수와 한계

node docs/design/verify-design.mjs 통과.78개 순수 템플릿/12개 도전 조건/연봉 p·금액/지도자 보장·효과/직접 전적/책 필터·메모 escape·내보내기 상태를 검사했다. 순수 중계 reducer의커서 경계·배속·정지·입력 불변과고정 로그 보존,61개 지도의원문/항목 일치도확인했다.

실제 브라우저 클릭·타이머·키보드·aria-live·레이아웃·선호 저장은미검수다. file: 정책 차단을우회하지 않았다. 실제 API/권한·DB/원자성·게임 엔진·파일 생성·로그인·강제 종료/복원·장기 밸런스·build/APK도미실행이다. 정적PASS를61개 실환경PASS로 해석하지 않는다.

## 다음 단계의 경계

100~104의이번 남은 대표 UI 연결은완료했다. 구현 전 인계는14/91/92와106을 기준으로 하며,추가 기능을 만들기보다기존 계약을실제 앱에서 실행 게이트로 증명해야 한다. 별도 구현 착수 지시는아직 없으므로이번 작업은설계·시안·검수 자료에서 마친다. 설계의추가 검토나실제 화면 피드백은계속 반영할 수 있다.

Git 작업본과V드라이브205파일이같음을 확인해기준 해시를 보존했다. 동기화 직전이를 재확인하고수정 파일·통합MD·MANIFEST를 갱신한 뒤커밋·push한다. 원래 baseball-design 미리보기의HTML/공개 helper도함께 갱신한다.

## 2026-10-19 후속: 라이벌·히든 경계 상세설계

[107](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)에 프로 직접대결 관계 형성,결투 WIN/LOSS/NO_DECISION,같은 시즌 T14 결합·복수 상대 집합,끝내기 안타,단축/무승부/합작 완봉,선발 규정이닝·복무/이적·5시즌 연속,정정·멱등 처리를 추가했다. 문턱·효과 U는 유지하고 세부 발생/판정은 D로 구분했다. 100의이미 확정된 계수를 미정으로 적은 문장도 정정했다.

새 서버용 경계 사례36개는NOT_IMPLEMENTED다. 기존298게임/61UI 기대값과 별도이며실제 테스트 통과 수로 합치지 않는다. 원문51/56/60/100과분야 지도C10/C18을 연결했다. 신규 공개 히든 힌트·확률 배지·중단 안내 UI는추가하지 않았다. 실제 앱·DB·브라우저·APK는 여전히 미실행이다.

다음 설계는45화면의최종 상태별 배치·문안·이미지 제작 명세다. 107은해당 화면의완성 디자인을 주장하지 않는다. 작업 전Git/V의208파일 일치를 확인하고기준 해시를보존했다. 변경 후통합MD·MANIFEST·V사본을 갱신한다.

## 108 화면 마감 명세

[108](108-ALL-SCREEN-FINALIZATION.md)과screen-finish-register.json에45화면별 읽기 순서·주행동·예외·기존 그림 슬롯·8종 상태·4뷰포트 제작 기준을 작성했다. 대표28화면에포함되지 않은17화면을후속 시안 제작 대상으로 구분한다. 흐름에서인접 화면을참조하는 것만으로해당 화면 전용 디자인 완료로 세지 않는다. 실제 새 시안/새 PNG/픽셀 검수는이번에완료하지 않았다.

## 2026-10-19 시각1.8: 17화면 시안·이미지·점검

[109](109-FINISH-BOARD-ART-AUDIT.md)에네단계의현상태를정리했다. [마감 보드](finish-board.html)에서S01/04/10/11/15/18/20/21/22/25/26/27/29/31/32/33/34의각배치·8상태136예시·4너비·글자확대를비교한다. 기존28대표+추가17의합집합45,기본45/99카탈로그는유지. 이는최종픽셀/사용자승인/실브라우저완료가아니다.

새빈티지6컷아틀라스1PNG를생성·직접출력확인·프로젝트복사하고프롬프트/원본경로/등록부를보존했다. 현재PNG9개다. 이미지원본은삭제하지않는다. 시안의선택·3타순중복검사는로컬메모리만,실제경기/계약/파일저장없음. S01은이어하기문구유지/중단안내없음,히든서버용정의는공개보드에없다.

나머지는사용자디자인피드백·실제렌더/접근성검수·필요초상파생제작이며,실제게임/Neon/APK/build는여전히미구현·미검수다. 1~4단계의서면·시안확장은진행했으나실행증거없이완료승인으로표시하지않는다. V사본과원래baseball-design미리보기도갱신한다.

## 2026-10-19 사용자 피드백: 얼굴 잘림·그림 보강·2번 전환

스크린샷의얼굴잘림은정사각장면을185px중앙크롭한문제였다. 전체패널과자연비율가로img로수정했다. S04에는전용hero/18세초상/회고이미지3종을넣었다. 처음비교안을만든뒤사용자가‘2번을메인그림체로변경’을확정했으므로111이현재아트U다. 기본45목업/대표30보드/추가17보드의활성배경·장면·초상을청춘애니로연결했다. 기존빈티지/시네마틱은보존한다.

신규7PNG(비교빈티지2/청춘고교2/청춘12장면아틀라스2/청춘투수1)를추가해총16개다. 아침·낮·중성실내·푸른야간을섞고석양편중을줄였다. 기존도구선호key는v3로바꾸어이전빈티지기본선호가복원되지않게했다. 게임세이브는무관하다. 생성출력은직접확인했으며실제브라우저픽셀·이미지세부·접근성검수는남아있다. 설계/시안작업만,실앱/Neon/DB/build/APK는미실행이다.

## 2026-10-19 후속: 능력100·잠재력·성적과극단밸런스

사용자질문을112로정리했다. 현재08/41의고정산식에서50vs50/D50은AVG.265/SLG.425,100vs50/D50은.467/.858,100vs100/D100은.218/.371,100vs1/D1은.536/.934다. 모두무주자·피로0·사기1·특성/구종/성향0의고정장기비율이며실제시즌결과가아니다. 현재산식을변경하지않았다.

AVG상한1.000과SLG상한4.000/OPS5.000·짧은표본·AB0·P100과현재A를구분했다. 상한성장/강화·복사19세50.0·화면도움말·기록넓이의기존계약을연결했다. 새6개균형실험은NOT_EXECUTED이며기존실행상태는불변이다. 앱/시즌실험/DB/build/APK는시작하지않았다.

## 2026-10-19 첫커리어·진로별첫시즌 동선

113에서안내정책/공통7/진로별19장면을작성하고first-career-board.html에청춘애니기존이미지로읽기시안을연결했다. 생성/계획/실제출장/강화/유형/결산/진로를구분하고KBO지명·미지명/대학/미국의첫시즌을대조한다. 실제지명재추첨·계약·경기·저장은없다.

미국카드의55/50/유효오퍼/권리경계를대조하며미달·오퍼0이면숨긴다. 안내완료가첫안타/1군/MLB출장을보장하지않고,미출장/미지명도합법적다음경로로이어간다. 기존45화면/99이벤트·시즌1회강화·이어하기버튼만·6능력/집중4·치트범위/기념보상을유지한다. 새26장면은설계자료이며실제온보딩/DOM/브라우저/DB/APK/build실행은미검수다.

## 114 완료 기록

구단의가상선수만/선택보관/치트시작을구분하고첫라인업·첫경기·발견/영입·시즌운영·PS·오프시즌준비의16장면을연결했다. 7복구사례를작성했고같은스냅샷에서18.4억→탐색18.35억→제안17.35억→성공17.35억/실패18.35억의배타분기를명확히했다. 실제명령/추첨/세계생성은실행하지않았다.

## 115 완료 기록

추천검토순서와실제기한/69세계일순서를구별했다. 드래프트60명시같은차례정리,FA동시성공예약/응답유실재조회,병역/만료효력,직원보장채무,새해동일job과미래108억원상한을12사례로구체화했다. 구단모드에전선수개인병역조종을새로추가하지않고확정공백·계약·등록관리의D범위를명시했다. 실제경기·시장·DB·연도전환은미실행이다.

115 연결점검에서구단드래프트의지명규칙과조회전용S18사이의누락을찾았다. S18에구단DRAFT하위화면/조건부query·SAVE_COMMAND2종/차례version·지명고유키·복구를명시하고원문77/45화면자료/기본목업·마감설명을갱신했다. 게임화면수45는유지하며실제지명구현은없다.

## 116~117 완료 기록

주전경쟁·포지션전환·방출·대표/병역·해외를12경험으로연결했다. E13옛‘E12 B’표기를실제START_POSITION_PLANreceipt/같은계획24경기로고쳤다. 사용자확정으로커리어기본진행은‘다음주요사건까지’이며1경기/1주일은대안이다. domain필수정지와표현정지를구분해읽음만으로선택을확정하지않고,홈이어하기버튼만·숨은근접도비노출·같은경기재추첨0을유지한다. 실제빠른진행/기용/적응/DB/브라우저는미실행이다.

## 118 완료 기록

후반커리어/은퇴시점→S09읽기원본→선택구단생성/19세복사또는지도자의9장면·12검수계획을작성했다. 원본41/복사19,peak전부100→현재전부50/종합50.0,기록0/병역리셋·히든0,같은root계보중복불가·다른세계재사용·가상선수전체개인보관없음을명확히했다. 연대기projection실패가확정snapshot을무효화하지않는다. 실제은퇴/claim/복원은미실행이다.

## 연속작업 종료 체크포인트 (사용자요청: 남음1%)

내장사용량조회에서5시간99%사용/1%남음,주간47%사용/53%남음을확인해새설계작업을종료한다. 116중반경험·117기본빠른진행U·118은퇴/보관/구단연속성을작성/정적검사/푸시했다. 당시 미완료였던 E13 CANCEL_POSITION_PLAN 결과 문구는 이후 후속 작업에서 정정했다. 상세재개위치는CONTINUATION-CHECKPOINT.md. 구현/DB/브라우저/build/APK는미실행이다.

## 2026-10-20 1단계 선택 수정

사용자 승인 1~6 전체와 E63 A안을 반영했다. 14의 현재 그림체·기본 진행을 정정하고 U/D를 구분했다. 최신/미반영 안내와 재개 위치를 정리하고 별도 기대값 3묶음을 색인에 추가했다. E63 승인 후 이동은 실제 결정까지 OPEN, 보류는 사유 확인으로 종료한다. 분기별 검증은 BLOCKING ACK·뒤바뀐 정책·잘못된 명령을 거부하는 음성 사례를 포함한다. 이미지 단계별 승인 절차를 14/124/제작 레지스터/체크포인트에 기록했다. 이미지 파일·status·화면 슬롯 참조는 그대로다.

## 2026-10-20 첫 이미지 묶음 승인 반영

2026-10-20 사용자 확정: 투수 A·타자 A·로고 2, 배색은 1번 네이비·블루. 승인 SVG 3개와 팔레트 CSS·출처 기록만 반영했다. 실루엣 2/14 완료, 나머지 12개와 앱 아이콘은 별도 묶음 승인 대기. 이미지 레지스터는 92항목 중 TODO61/EXISTS19/CODE_ONLY11/LEGACY_REFERENCE1이다. 게임 규칙·45화면·99이벤트·핵심298 기대값은 불변.

[승인본 보기](approved-art-board.html). 검증 후 승인 범위만 커밋·푸시한다. 다음 묶음은 다시 보여주고 확인받는다.

검증 결과: verify-design / verify-state-ui / verify-art-direction 모두 PASS(종료코드0). 최초 슬롯 사본 불일치는 수정 후 통과했다. 실제 브라우저·앱 검증은 미실행이다.


**최근 완료:** M2-DF — 다음 해 원구단 예산 부족 시 타구단1년 제안 비교/이월 활성화·구단 권리 해제·변조/중복 거부·현역/상무 계약 소속. 신규7개·집중12/12·전체632/632·실패0·취소0·종료0, lint/타입/build/골든/이벤트/설계10종 통과. [DF](../implementation/M2-DF-OFFSEASON-EXIT.md) · [M2 완료 계획](../implementation/M2-COMPLETION-PLAN.md). 좁은 추가 경로이므로 전체35%/65% 추정을 유지한다.

M2-DH 미국 첫 정규시즌 묶음/특성 집계 성능 개선은 전체 check를 통과했다. 실제 미국 실주행은 58마감일·2400경기이며 아직8790경기 완료가 아니다. M2 전체 완료도 아니다. 나머지 분야의 완료(셸) 기록은 병렬 main 6eda98e 보고를 보존했으며 실배포/실기기 검증을 이 M2 환경에서 실행한 의미가 아니다.

진행률 산술 정정: 표의 가중합은70%(M2 15 + 나머지55)다. 기존 헤더71%는 산술 불일치였으며 기능을 되돌린 것이 아니다. M2 영역50%는 전체 경로/99사건/24통합 검증 잔여가 있어 유지한다.

M6-E(2026-10-26, `m6/club-mode` `456a6b0`): 구단 영역 25%→55%, 기여 5→11. 가중합 70+6=76%. M2 영역 50%는 그대로다.

M6-F(2026-10-26, `m6/club-mode` `31df4c6`): 구단 영역 55%→65%, 기여 11→13. 가중합 76+2=78%.

M6-G(2026-10-26, `m6/club-mode` `00fda87`): 구단 영역 65%→70%, 기여 13→14. 가중합 78+1=79%. 제안·재계약/방출·불펜·다음 시즌 명령. 전체 663 중 661 통과.

---

<!-- SOURCE: DETAIL-PLAN.md -->

# 현재 작업 — 구현 직전 최종 설계 리뷰·정정 완료

2026-10-20: 구현 직전 최종 리뷰131에서 생성 API·생성 전 잠재력/홈 안내·추가진루/동률키·공개 DTO·패키지 무결성의5개 정합 문제를 발견하고 기존 확정 기준으로 정정했다. 새 게임 규칙은 추가하지 않았다. 이번 요청은 마지막 점검이며 실제 앱/엔진/API/DB/APK 구현은 시작하지 않음. 실제 렌더·키보드·스크린리더와 V01~V12는 미실행 상태를 유지한다.

[131 최종 리뷰](131-FINAL-DESIGN-REVIEW.md) · [130 인계 기준](130-PREIMPLEMENTATION-HANDOFF.md) · [120 구현 순서](120-IMPLEMENTATION-ROADMAP.md). 다음에 명시적으로 구현을 요청하면 M0부터 진행한다. 이미 확정한 게임 규칙을 반복 질문하지 않고 실제 실행 검증은 구현 뒤 별도로 기록한다. 아래는 이전 이력이다.

---

# 현재 작업 — 구현 전 설계 인계 마감 / 실제 실행 검수는 열림

2026-10-20: 구현 전 가능한 세 항목을130 인계 기준과 기계 판독 준비표로 마감했다. 보드 최신화·확인된 소스 문제 수정·정적 접근성13검사·45화면/8상태 대조는 완료했다. 실제 렌더·키보드·스크린리더는 보안 정책 차단/미실행으로 남기고 증거 없이 PASS로 올리지 않는다. 진입 README/START-HERE/HANDOFF와92의 낡은 현재 안내를 수정했다. 이미지80/TODO0/CODE_ONLY11·45화면/99이벤트/핵심298/23기대값 묶음 유지, 신규 게임 규칙과 구현 착수 없음.

[130 인계 기준](130-PREIMPLEMENTATION-HANDOFF.md) · [준비표](preimplementation-readiness.json) · [최신 설계 보드](design-board.html). 현재 가능한 서면 작업은 인계 완료이며 같은 질문·미확인 PASS·형식적 문서 추가를 반복하지 않는다. 새로운 설계 변경이나 허용 환경의 실제 검수 증거가 있으면 이어간다. 별도 요청 전 게임/엔진/API/Neon/인증/APK 구현은 시작하지 않는다. 아래는 이전 이력이다.

---

# 현재 작업 — 메인 보드 최신화·정적 접근성 점검 완료 / 실제 렌더 차단

2026-10-20: 설계 보드에 최신 승인 모음·팀 배지·카드·아이콘11묶음 링크를 반영하고 접근성 소스를 보완했다. 파일 기반13검사 통과(이미지60·입력37·표6). 실제 file: 보드 관찰은 브라우저 URL 보안 정책으로 차단돼 렌더·키보드·스크린리더 검수는 미실행. 우회하지 않았으며45화면의 미검수 플래그를 유지한다. 이미지80/TODO0/CODE_ONLY11과 게임 규칙은 불변, 게임 구현 미착수.

[최신 설계 보드](design-board.html) · [129 점검 결과와 제한](129-DESIGN-BOARD-REFRESH-ACCESSIBILITY.md) · [기계 판독 결과](design-board-accessibility-audit.json). 다음 작업자는 실제 렌더를 PASS로 바꾸거나 다른 주소/브라우저로 우회하지 않는다. 게임/엔진/API/Neon/인증/APK는 별도 착수 지시 전 구현하지 않는다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 코드 표시11묶음 승인 반영 완료

2026-10-20: 사용자 승인에 따라 코드 표시11묶음의 비교 보드·승인 기록·화면별 표시 가이드를 반영했다. 현재 수정 가능한 승인 작업 기준이며 실제 앱 구성요소는 NOT_IMPLEMENTED다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1과45화면/99이벤트/핵심298은 유지한다. 게임 구현은 시작하지 않으며 최종픽셀·브라우저·기기·접근성 실행 검수는 미실행이다.

[승인 표시 보드](code-display-board.html) · [127 표시 명세](127-CODE-DISPLAY-SPECIFICATION.md) · [128 화면 점검](128-PREIMPLEMENTATION-SCREEN-AUDIT.md). 표시안 승인 질문을 반복하지 않는다. 다음은 허용 환경의 실제 렌더 검수이며 임시 서버·다른 브라우저로 정책 차단을 우회하지 않는다. 별도 구현 착수 지시 전 앱/엔진/API/Neon/인증/APK 구축으로 넘어가지 않는다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 구현 전 표시 명세·화면 대조 완료 / 시각 승인 대기

2026-10-20: 구현 전 코드 표시11묶음의 상세 명세127과 전45화면 정적 대조128을 작성했다. 45개 행의8상태·읽기 순서·주행동·슬롯 일치와360/390/768/1280 계약을 확인했다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1 유지.83/108의 낡은 실루엣 미제작·빈티지/얼굴 프리셋 표기를 기존 승인 기준으로 정정. 게임 규칙·45화면/99이벤트/핵심298 불변. 실제 렌더·접근성·기기 시험은 미실행, 구현 미착수.

[127 표시 명세](127-CODE-DISPLAY-SPECIFICATION.md) · [128 점검 결과](128-PREIMPLEMENTATION-SCREEN-AUDIT.md). 아이콘11묶음 비교 보드는 C:/Users/N-052/AppData/Local/Temp/baseball-code-display-review-20261020/review-board.html 에 있고 미승인이라 저장소 미반영. 다음은 이 시각안 사용자 확인과 실제 허용 환경 렌더 검수이며 게임 구현으로 넘어가지 않는다. 아래는 이전 이력이다.

---

# 현재 작업 — 이미지 파일 제작 목록 승인 반영 완료

2026-10-20: 사용자 승인 마지막11종(메달3·대회 독자엠블럼4·연대기테마3·스플래시1)을 반영했다. 이미지 레지스터92항목은 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1이다. 제작 목록의 이미지 파일은 모두 준비됐으며 CODE_ONLY11묶음 표시 명세와 화면45×8상태/접근성/반응형 마감 검수는 남는다. 실제 브라우저·기기·APK 설치·DB 시험 미실행. 게임 규칙·45화면/99이벤트/핵심298 불변, 앱 구현 미착수.

[승인 이미지 전체 보드](approved-art-board.html) · [마지막11종 승인 기록](assets/brand/APPROVED-FINAL-IMAGES-v1.json). 미승인 시안은 반영하지 않았다. 다음은 구현 전 표시 명세와 화면/인계 정합 점검이다. 아래는 이전 작업 이력이다.

---

# 현재 작업 — 컬러 도장13종 승인 반영

2026-10-20: 컬러 기록 도장13종 사용자 승인 반영. 프레임3·배경3·도장13·책장표지1, 기념 보상20항목 모두 파일 완료. 레지스터 EXISTS69/TODO11/CODE_ONLY11/LEGACY_REFERENCE1. 남은 이미지는 메달3·연대기 테마3·스플래시1(P1 7항목), 대회 엠블럼4(P2). 게임 규칙·45화면/99이벤트/핵심298 유지. 앱/DB/API/APK 구현은 시작하지 않음.

다음11항목 시안도 저장소 밖에 제작하고 사용자 승인 후 반영한다. 아래는 이전 이력이다.

---

# 현재 작업 — 기념 보상7개 승인 반영 / 컬러 도장13종 확인 대기

2026-10-20: 사용자 승인 프레임3·배경3·책장표지1만 반영. PNG4개는 생성 원본1122×1402를 보존하고 레지스터 실제 규격을 기록했다. 도장13종은 색상 추가 요청으로 수정 시안만 저장소 밖에 보관하며 미반영. EXISTS56/TODO24/CODE_ONLY11/LEGACY_REFERENCE1. 게임 규칙·45화면/99이벤트/핵심298 불변. 구현 미착수.

컬러 도장 시안: C:/Users/N-052/AppData/Local/Temp/baseball-stamps-color-v2-20261020. 사용자 승인 후 반영하고 남은11항목 제작으로 이어간다. 아래는 이전 이력이다.

---

# 현재 작업 — 컬러 팀 배지10개 승인 반영

2026-10-20: 대학9·군 체육팀1 컬러 배지10개 사용자 승인 반영. 학교마다 고유 주색·보조색을 사용하며 선수 사건 일러스트 네이비 원칙과 구분한다. 이미지 레지스터92항목은 EXISTS49/TODO31/CODE_ONLY11/LEGACY_REFERENCE1. 남은 P1 27개·P2 4개. 게임 규칙·45화면/99이벤트/핵심298은 불변이며 구현은 시작하지 않았다.

[승인 이미지 보드](approved-art-board.html) · [배지 승인 기록](assets/badges/APPROVED-BADGES-v1.json). 다음은 기념 보상 외형 시안이며 묶음별 승인 절차를 유지한다. 아래는 이전 작업 이력이다.

---

# 구현 전 마감 계획 — 2026-10-20

[126](126-PREIMPLEMENTATION-ART-CLOSURE.md)의41이미지·11표시 명세·45화면 점검을 진행한다. 배지10개 시안 승인 대기이며 미승인 SVG는 저장소에 없다. 구현 착수 금지.

---

# 현재 작업 — 네이비4PNG 승인 반영 완료

야간 라이벌의 버건디 상대 수정본을 사용자가 최종 승인해 추가사건 atlas를 새 v2 PNG로 연결했다. 기존3개를 포함해 활성4PNG의 우리팀 네이비 통일이 완료됐고 낮·야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 구분된다. 원본4PNG는 보존했다. 레지스터41TODO/39EXISTS·45화면/99이벤트/핵심298은 유지한다.

---

# 현재 작업 — 네이비3PNG 반영

우리팀 네이비 수정본 중 메인·기본사건·고교3PNG는 사용자 승인에 따라 새 v2 파일로 연결했다. 원본3PNG는 보존했다. 추가사건 atlas의 야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 추가 수정했고 이 최종본만 사용자 확인 대기다. 이미지 레지스터 TODO41/EXISTS39와 게임 규칙은 그대로다.

---

# 현재 작업 — 승인6컷 반영·네이비 팀복장 통일

P1 청춘 애니6컷을 사용자 승인 후 반영했다. 라이벌은 흰색/네이비 팀과 버건디 팀으로 구분한다. finish 보드의 대학·마이너·기록·계약 화면은 의미에 맞는 패널로 연결했다. 전체92항목 중 TODO41/EXISTS39/CODE_ONLY11/LEGACY_REFERENCE1이다.

다음은 기존 활성4PNG의 네이비 수정본 승인이다.

---

# 현재 작업 — P0 이미지 파일 승인 반영 완료

사용자가 앱 아이콘1(네이비 배경)을 승인했다. Android 전경/배경/단색 SVG3개와 PWA192/512/maskable512·apple180 PNG4개·favicon SVG를 반영했다. P0의17항목(실루엣14·브랜드3묶음) 파일 제작은 모두 완료다. 전체92항목은 TODO47/EXISTS33/CODE_ONLY11/LEGACY_REFERENCE1이며 앱 연결·OS 설치 검수는 미실행이다.

---

# 현재 작업 — 실루엣14종 승인 완료

사용자가 남은8종 전체를 승인해 A 스타일·네이비/블루 SVG로 반영했다. 타자6투타조합·투수4폼×2손, 실루엣14/14와 로고2가 모두 승인됐다. 전체 이미지92항목 중 TODO49/EXISTS31/CODE_ONLY11/LEGACY_REFERENCE1. Android/PWA 아이콘2묶음과 P1/P2 이미지는 별도 미완료다.

다음은 P0 앱 아이콘 묶음의 별도 시안·승인이다.

---

# 현재 작업 — 두 번째 실루엣 묶음

사용자가 2차 시안 1~4번(우투좌타·좌투좌타 타자, 좌투 오버핸드·우투 쓰리쿼터 투수)을 모두 승인했다. A 스타일·네이비/블루 배색으로 SVG 4종을 추가했다. 실루엣 6/14 완료, 남은 실루엣 8종은 별도 승인 대기다. 전체 이미지 레지스터 92항목은 TODO57/EXISTS23/CODE_ONLY11/LEGACY_REFERENCE1이다.

검증·커밋·푸시 후 다음 묶음을 별도 제시한다.

---

# 현재 작업 — 첫 이미지 묶음 승인 반영

2026-10-20 사용자 확정: 투수 A·타자 A·로고 2, 배색은 1번 네이비·블루. 승인 SVG 3개와 팔레트 CSS·출처 기록만 반영했다. 실루엣 2/14 완료, 나머지 12개와 앱 아이콘은 별도 묶음 승인 대기. 이미지 레지스터는 92항목 중 TODO61/EXISTS19/CODE_ONLY11/LEGACY_REFERENCE1이다. 게임 규칙·45화면·99이벤트·핵심298 기대값은 불변.

---

# 현재 승인 작업 — 2026-10-20

2026-10-20 사용자 확정: 1단계 설계 점검·선택 수정·검증·커밋·푸시 결과를 제시하고 승인받은 뒤 2단계를 시작한다. 이미지 시안은 저장소 밖 임시 폴더에만 두고, 우투 오버핸드 투수·우투우타 타자·로고 마크를 각 2~3안 제시한다. 사용자가 고른 안만 저장소에 반영한다. 미선택·거절 시 반영하지 않으며, 후속 제작도 묶음마다 승인받는다. 승인본 반영 후 레지스터 status·화면 슬롯 참조·STATUS를 갱신하고 세 검증 스크립트를 재실행한다. 승인한 변경만 기존 정상 Git 체크아웃으로 커밋·푸시하며 V:의 .git는 변경하지 않는다.

1단계 수정 범위: 1~6 모두 승인, E63은 A안. 이미지 파일은 아직 제작·추가하지 않는다.

---

# 현재 설계 작업 계획 (2026-10-19)

## 최신 완료

- 107~108: 특성/관계경계와45화면마감명세.
- 109~111: 추가17화면/이미지보강/잘림수정,2번청춘애니메인U.
- 112: 능력100과성적의분모·고정산식·미실행균형계획.
- 113: 첫커리어공통7/진로19장면·읽기동선시안.
- 114: 구단첫시즌16장면/7복구/3시작·연속원장.
- 115: 오프시즌8묶음/12충돌·미래예산/드래프트·라운드·단일연도전환.
- 118: 후반커리어/은퇴보관/새선수·지도자9장면/12검수계획.
- 116~117: 중반커리어12경험/E13후속정정·기본주요사건빠른진행U.

## 다음 상세 검토

1. 콘텐츠/화면/명령의잔여의미연결감사와연령별아트라이브러리제작범위.
2. 사용자시안피드백에따른개별배치·문안수정.
3. 구현착수시92의실행게이트로실제동작검증. 현재는구현자동착수없음.

## 진행 문서 운영

매작업에서STATUS.md맨위의최신상태와누적이력을함께갱신합니다. 분야별MD/원문연결/current-contract-index/통합MD/MANIFEST/V사본도일치시킵니다. 정적PASS·시안작성·실제브라우저/게임시험을구분합니다. 아래는이전단계의계획이력입니다.

---

현재단계:서면설계기준본1.0. 기존항목의진행이력은아래에보존합니다. 최신종결은 [92](92-DESIGN-CLOSURE-HANDOFF.md),적용원문은 [91](91-CURRENT-CONTRACT-INDEX.md),실행미검증은 [STATUS](STATUS.md)를따릅니다. 구버전'예정/답변대기'문장만보고작업을재시작하지않습니다.

# 항목별 상세설계와 커밋 순서

각 항목은 해당 MD·문서지도·진행현황을 함께 수정하고, 링크/규칙충돌/diff를 검토한 뒤 커밋·push한다. 파일 저장 한 번마다 불완전한 중간문장을 커밋하는 방식이 아니라 검토 가능한 설계 항목을 단위로 한다. 사용자 요청으로 GitHub 반영이 허용돼 있다. 강제 push·기존 이력 삭제는 하지 않는다.

| 순서 | 상세설계 | 상태 | 문서 |
| --- | --- | --- | --- |
| 01 | 커리어 상태 전이·사건 처리 | 서면 설계 완료 | [19](19-CAREER-STATE-MACHINE.md) |
| 02 | 국제대회 달력·선발·출전·결과 | 서면 설계 완료 | [20](20-INTERNATIONAL-COMPETITIONS.md) |
| 03 | 병역·상무·계약 정지·해외 복귀 | 서면 설계 완료 | [21-MILITARY-CONTRACT-RETURN.md](21-MILITARY-CONTRACT-RETURN.md) |
| 04 | 스타일·집중육성·강화·잠재력·노쇠 | 서면 설계 완료 | [22-DEVELOPMENT-STYLE-TRAINING.md](22-DEVELOPMENT-STYLE-TRAINING.md) |
| 05 | 미국직행·마이너·포스팅·보유권 | 서면 설계 완료 | [23-US-CONTRACTS-RIGHTS.md](23-US-CONTRACTS-RIGHTS.md) |
| 06 | 경기 엔진·투수교체·기록 판정 | 서면 설계 완료 | [24-GAME-ENGINE-SCORING.md](24-GAME-ENGINE-SCORING.md) |
| 07 | 구단 AI·경제·드래프트·장기 공급 | 서면 설계 완료 | [25-CLUB-AI-ECONOMY.md](25-CLUB-AI-ECONOMY.md) |
| 08 | 이벤트69종 조건표·실제 문안 검수 | 서면 설계 완료 | [26-EVENT-CONTENT-CONTRACT.md](26-EVENT-CONTENT-CONTRACT.md) |
| 09 | 전체33화면 최종 입력·반응형 목업 | 입력 계약/정적 초안 작성, 시각검수 차단 | [27-UI-INTERACTION-RESPONSIVE.md](27-UI-INTERACTION-RESPONSIVE.md) |
| 10 | DB/API/인증/테스트 fixture 계약 | 서면 설계 완료 | [28-DATA-API-AUTH-TESTS.md](28-DATA-API-AUTH-TESTS.md) |
| 11 | 운영·백업·APK·배포·실환경 확인 | 서면 설계 완료 | [29-OPERATIONS-RELEASE-RUNBOOK.md](29-OPERATIONS-RELEASE-RUNBOOK.md) |
| 12 | 통합 경로 재검토·설계 검토본 | 서면 설계 완료 | [30-INTEGRATED-DESIGN-REVIEW.md](30-INTEGRATED-DESIGN-REVIEW.md) |

앱 구현은 아직 착수하지 않는다. 실행으로만 입증 가능한 밸런스/인증/기기 검증은 문서완료와 분리한다. 다음 채팅은 이 표의 첫 '예정'부터 진행한다.

## 사용자 변경04~07 반영

34:유형·대학·조건부미국경로·지명예측.35:능력6개·집중4개·평균종합.36:구단숨김치트.37:명칭과공식팀로고. 모두문서/시각초안범위이며실행과배포허가검증은별도.

## 전체 보완 작업

39 문서정합 →40 확률 →41 경기 →42 성장 →43 대학 →44 구단 →45 이벤트 →46 UI. 사용자 지시로 모두 순차 진행하며 항목별 커밋한다.

## v0.8 보완 결과

39~46 모두작성. 37화면/83이벤트카탈로그와학교·탐색·영입입력시연추가. 실제시각/엔진/DB/APK검증은STATUS의미완료항목으로남긴다. 단순히다음예정항목부터재시작하지말고사용자의현재요청과STATUS를우선한다.


v0.9확장47~54:추천8기능모두서면계약작성.55의API/교차효과/45화면/99이벤트로연결. 구현미착수.


추가8기능의기초설계와상세실행계약은구분한다.64공통및56/57/59/60/61/63작성,58/62는질문답변후작성. 세부필드·명령·오류·서면fixture를채우되실제코드테스트로보고하지않음.


v0.10후속완료:기념보상/감상형중계답변을반영해58/62작성. 56~63전8개서면상세계약+64공통+65사용자결정+80개검수기대값. 현재목록의선택대기는해소,실행검증은STATUS미완료항목.


v0.11:66~73서면8분야추가,사용자장기경험3선택반영. 80기능fixture+82세계fixture구조검사,24불변조건/12실험계획. 실제시뮬레이션은PLANNED,설계에서자동구현으로넘어가지않는다.


v0.12:74미리보기·확정·응답유실교차계약,75사용자정확효과공개선택,76웹/APK중단이어하기필수작성. 교차기대값30추가(총192). 홈상태시연은실제저장기능아님.


v0.13:77 전체45화면 조회·행동 연결과78 소유자 범위 새 게임 생성/중단 복구를 작성했습니다. 생성 기대값10개로 총202개. 다음 검토 항목은 STATUS를 따르며 실제 동작 검증은 구현 후 진행합니다.


v0.14:79~84로 요청된 남은6개 설계 검토를 작성,85로 구단 전체 치트P100·성장3배와하드경쟁/AI정책을 반영했습니다. 274개 서면 기대값·45복구행·99근거행·20확률표면·24경로. 실제 화면/엔진/Neon/이어하기/밸런스/build/APK 검수는 구현 후 게이트입니다. 별도 지시 전 구현을 시작하지 않습니다.


2026-10-19 플랫폼 보완: [86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md). 네 환경의 웹 플레이+Android APK를 기본 목표로 정리합니다. iPhone은 Safari/홈 화면 웹앱,Windows/macOS는브라우저. 별도iOS·데스크톱 설치형은후속 선택 범위. 실제 호환 검수 미실행.


v0.15:87~89플랫폼로그인·기기전환·업데이트·파일전달상세계약작성.6개대상×8필수흐름/24서면기대값을추가했고총298개. 실제호환·인증·APK·다운로드·공유시험은구현후계획. 구현자동착수없음.


기준본1.0:90수치/XP정합,91분야별현재계약25개,92서면종결10개·실행게이트12개. 추가사용자질문없음. 앱구현/실환경검수는별도착수단계.


시각확장1.1:사용자요청으로93~95추가.최신선택은빈티지기록실U,3스타일비교/12빈티지장면/투명초상/45이미지슬롯/캐릭터제작규약. 게임규칙변경없음. 브라우저file열기정책차단,정적검사와PNG시각확인만수행.

시각 확장1.2: [96 상세 흐름](96-VISUAL-DETAIL-FLOWS.md)에 대표8화면/상세12상태·타자/투수 초상2개·예외/재개 설계를 추가했다. 기존 본문의1초상/4대표 화면/7PNG 집계는1.1 시점의 기록이며 현재는2초상/8대표 화면/8PNG다. 게임 규칙은 변경하지 않았다.

시각 확장1.3: [97 상세 경험](97-RESULTS-SEASON-DRAFT-EXPERIENCE.md)에서 경기·시즌·드래프트9상태를 더해 대표11화면/총21상태로 확장했다. 기존 게임 규칙·PNG8개는 유지한다.

시각 확장1.4: [98 구단 경험](98-CLUB-OPERATIONS-IMPORT-EXPERIENCE.md)에서 선수단·탐색·영입·예산·보관 투입15상태를 추가했다. 현재 대표16종/36상태,PNG8개. 기존45게임 화면·99이벤트·사용자 확정 규칙은 유지한다.

시각 확장1.5: [99 생성·진로](99-CREATION-AMATEUR-US-JOURNEY.md)를 추가해 대표20화면/48상태,기존PNG8개를 유지한다. 이어하기 진입은 버튼만 표시한다.

상태별 UI 2026-10-19: [100](100-HIDDEN-TRAITS.md)~[104](104-COMMENTARY-CHRONICLE-STATE-UI.md)를 작성하고 91 지도·검수 항목에 연결했다(STATUS 참조). 남은 일은 보드/MANIFEST/DESIGN-ALL 재생성과 실행 게이트 정의다.

2026-10-19 인수 후 연결: [105](105-EXTERNAL-HANDOFF-INTEGRATION.md).100/101 원문·공개/서버용 자료·특성/구종 시안·정적 검수 연결,22대표/54상태.102~104의 추가 대표 시안은 후속이며 실제API/게임 실행은 미검수다. 패키징은 rebuild-design-package.mjs로 숫자순 재생성한다.

2026-10-19 후속: [106](106-EXPANSION-UI-CLOSURE.md)에서102~104 원문·30대표/78상태·로컬 조작·61항목 연결 지도를 마쳤다. 실제 게임/브라우저 실행은미검증이다. 고정 로그 감상과메모 미리보기는세계 결과를 바꾸지 않는다.

116~117 현재후속: 중반커리어12경험/E13명령근거정정·기본NEXT_MAJOR_EVENT U와12검수항목. 다음은커리어후반·은퇴보관·선수/지도자구단연결의최종경험검토다. 실제구현은여전히미착수다.

## 사용량 임계치 재개 항목

2026-10-19 남음1%확인으로이번연속작업종료. 다음첫항목은E13 CANCEL_POSITION_PLAN결과문구정정과테스트다. 116~118서면/정적검사는완료했지만E13취소문구는발견만했고미수정이다. CONTINUATION-CHECKPOINT.md의정확한상태를우선한다.

2026-10-19 후속: E13/62개 이벤트 결과 문구 분리, [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 선수 표시·투구폼·좌우 상성, [120](120-IMPLEMENTATION-ROADMAP.md) 구현 로드맵을 작성했다. 실루엣 이미지는 다른 곳에서 제작한다.

---

<!-- SOURCE: 14-CANONICAL-DECISIONS.md -->

# 14. 통합 결정표와 세계 달력

M2-Z 대학 다음 연도 기본안D:19~21세 정규 학생은 같은 신원/P/구종/성장 결과를 유지하고1세 증가한다.22세 NPC 졸업생만 같은 포지션의19세 신입생으로 교체하며 대학 학교별 생성 분포를 재사용한다. 임시 충원 신원/기록은 과거 세계에 남기고 정규 진급 대상에서는 제외한다. NPC 시즌 중 별도 영구 강화는 아직 없으며 도입 전 시작 snapshot이 필요하다.

## 2026-10-21 대학 선수권 구현 기본안D

43의7월 선수권은7월1일 준결승,7월3/5/7일 결승으로 배치한다. 준결승은 상위 seed 홈, 결승은 원래 상위 seed 홈-하위 홈-상위 홈이다. 동률 순위는01의 승률→상대승률→득실차→시즌 seed 추첨을 따르며 다자 동률은 묶음 미니리그, 승패0 미정 승률은 확정 승률 뒤에 둔다. 정규 분모와 자연성장 예산은 증가하지 않는다. 구체 날짜/홈 순서/미정 승률 순서는 구현 기본안D이고 사용자 개별 수치 승인U나 균형 검증V가 아니다.

## 2026-10-20 성장 달력 확정

M2-V 대학 초기 세계 구현 기본안D: 첫 대학 세계는43의9개 학교·각25명(야수15/투수10)으로 생성한다. NPC 나이는19~22세 균등, 종합은40~65/최빈52 삼각분포를 정수 반올림하며 학교 입학 최소종합이40보다 높으면 최솟값/최빈값을 그 문턱까지 올린다. 주인공의 기존 능력·잠재력·투타/폼·구종 숙련은 다시 추첨하지 않고 선택 학교의 같은 포지션 슬롯을 대체한다. 이 수치는 미정 부분을 채운 조정 가능한D이며 사용자 수치 확정U나 실제 균형 검증으로 표시하지 않는다. 기존 고교35~65/최빈48과 난수 소비는 유지한다. 첫 대학 초기 명단 생성이며 기존 고교 NPC들의 진학/프로 진로를 자동 확정하지 않는다.

사용자는 세계 공통 성장기간 2~10월, 고교 정규기간 2~6월, 주간 휴식일 포함 및 국제대회 전용 창 제외를 승인했다. 당시에는 미국 직행 종합52와 기존 성장 배율을 유지했다. 미국 문턱은 아래2026-10-21 미국 스카우트 평가 U로 대체하며 성장 배율은 유지한다. 고교 졸업 시 완료된 등록기간만 정산하고 같은 세계시즌의 후속 등록기간과 예산을 공유한다.

구현 기본안 `calendar-1`은 1월1일을 dayIndex0으로 하고 그레고리력 윤년을 반영한다. 고교54라운드를 2월1일~6월30일의 가용 날짜에 균등 배치한다. 국제창은20의 개최연도/기간에 따라 WBC 2월8~28일(21일), OLY 7월15~28일(14일), AG 9월1~14일(14일), P12 11월15~28일(14일)로 예약한다. 이는 독자 게임 날짜 기본값이며 실제 국제대회 일정이 아니다. P12는 성장기간 밖이다. 세계 성장가능일수W와 고교 전체정규일수는 각 날짜 집합에서 국제창을 제외해 산출하며, 경기 수나 압축 fixture 길이로 대신하지 않는다.

이전에 생성한 압축 일정은 그대로 보존한다. 달력 없는 세이브에는 임의W나 시즌시작 능력을 복원해 지급하지 않고 호환 오류를 반환한다. 고교 기간 비례 정산으로 졸업시52가 보장되지 않으며, 실제 도달성 결과와 진로 제안 생성은 별도로 기록한다.

설계 기준본1.0, 현재 결정표 정정 2026-10-22. [91 현재 계약 지도](91-CURRENT-CONTRACT-INDEX.md)와 [92 종결·실행 게이트](92-DESIGN-CLOSURE-HANDOFF.md)를 함께 읽는다. 앞 문서의 제안이 충돌하면 이 문서가 우선한다. 사용자 확정 요구를 바꾸는 우선권은 없다. 아래 숫자는 구현 가능한 기준안을 정한 것이며 사용자가 개별 수치까지 승인했다는 뜻은 아니다.

## 결정 상태

- U: 사용자 확정. 구현자가 임의로 축소하지 않는다.
- D: 이번 설계의 기본 결정. 수정 시 결정 이유와 영향 문서를 갱신한다.
- V: 구현/환경 실증 필요. 문서만으로 통과했다고 표시하지 않는다.

| ID | 결정 | 상태 |
| --- | --- | --- |
| R01 | 선수 커리어/독립 구단 운영, 내 선수 투입 선택 | U |
| R02 | 실제 구단 배경, 가상 선수 | U |
| R03 | 능력치별 커리어 최고값의50%로 어린 선수 재육성, 원본 유지 | U |
| R04 | 구단 복사본 시작19세, 부상/피로/기록/연차 초기화 | D |
| R05 | 병역대상 복사본은 병역도 다시 시작, 원본 완료/메달 혜택 계승 안 함 | U |
| R06 | 타자/투수, 고교→국내/대학/조건부미국→은퇴, 포스팅 필수 | U |
| R07 | 스타일/특별강화/국제대회/병역 포함 | U |
| R08 | 기본 시작2027, 사용자 연도변경은 v1 제외 | D |
| R09 | 단일 게임 세계의 국내/미국/국제대회 가상 달력 | D |
| R10 | 온라인 우선, 기기 간 revision 충돌 거부 | D |
| R11 | 앱 이름 다시, 플레이볼 | U |
| R12 | 계정당 활성 세이브10개, 보관 선수 수 하드상한 없음, 보관 목록50개 페이지네이션 | D |
| R13 | Neon PostgreSQL/객체 저장소, 서버만 비밀값 보유 | U/D |
| R14 | 메인그림체는2번청춘야구애니(111),선수카드는얼굴없는실루엣(119),기존검은고딕/Noto Sans KR유지 | U(그림체·네이비/블루)/D(기타세부토큰) |
| R15 | 설계 문서 우선, 앱 구현은 다음 명시적 착수 단계 | U |
| R16 | 커리어 기본은 다음 주요 사건까지 빠르게 진행(117),1경기/1주일 대안·필수 선택 정지 | U |
| R17 | 시즌당1회 강화에 확정 성장 선택지 포함 | U |
| R18 | 선수 커리어에 현실형·성장형 난이도 모두 제공 | U |
| R19 | 가져올 능력은 능력치별 커리어 최고값의50% | U |
| R20 | 잠재력 상향 재설정, 현재 엔진100상한 유지 | U(조건부 판단 반영)/D(보정폭) |
| R21 | 복사본 병역도 어린 선수로 재시작 | U |
| R22 | 난이도 영역 이스터에그로 숨겨진 치트 모드 제공 | U |
| R23 | 커리어 치트 주인공: 강화 성공 보장·6잠재력100·양의성장/구종XP3배 | U |
| R24 | 거포형·거포수비형 등 선수 유형 중심 스타일 | U |
| R25 | 고교 졸업 후 대학 진학 경로 포함 | U |
| R26 | 미국직행은 능력충족+유효오퍼 있을 때만 노출 | U |
| R27 | 드래프트 예상 라운드·지명확률, 단순설정 적용100% 배제 | U |
| R28 | 타자·투수 각6능력, 주요육성 정확4개 | U |
| R29 | 표시종합은 영구능력6개의 산술평균, 최대100 | U |
| R30 | 구단숨김치트:자금무제한·적격탐색/유효영입수락보장·내구단전체P100/양의성장3배,이후영입/보관포함 | U |
| R31 | 실제 구단 공식 로고 출처 우선 사용 | U |
| R32 | 확률 있는 선택 모두 표시, 실제100%는 숫자 숨김 | U |
| R33 | 주인공 일반1.5/하드1/치트3배·일반/하드초기A/P공통,하드NPC보정은85 | D(42/85) |
| R34 | 보관복사19세/잠재력상향seed5~10/원본유형기본유지·집중4개재선택 | D(42) |
| R35 | 탐색공식·동시제안확률경쟁·외부미계약선택 포함 | D(40) |
| R36 | 가상대학9교/정규48/상위4선수권/휴학학년동결 | D(43) |
| R37 | 구단120억/초기50명/연봉80~95억/시설·탐색운영비/긴급대체 | D(44) |
| R38 | 화면45종/이벤트99종/기계가독설계카탈로그 | D(55) |
| R39 | 특성·구종성향·목표·에이전트·관계·은퇴지도자·중계·연대기 모두v1에추가 | U |
| R40 | 확장기능의효과/비용/확률/보존수치D,특성장착제한은폐기 | D(56~65) |
| R41 | 기록해금된 보유특성 전체가 상황조건에 따라 자동효과 | U |
| R42 | 목표/도전 보상은 기념품만,성장·돈·훈련권 없음 | U |
| R43 | 문자 중계는 확정경기 감상/스킵/다시보기 | U |
| R44 | 같은 구단세계 같은 원본은 현역선수 또는 지도자 한 역할 | U |
| R45 | 웹/APK 중단후 이어하기,서버확정진행·미해결선택·작업 복구 | U |
| R46 | 강화 정확 증가량·실제 비용 우선,상한 추론 허용 | U |
| R47 | 구단치트 구종XP3배/소속기간·퇴단P보존,하드경쟁/AI수치 | D(85/90) |
| R48 | 네 환경 웹+Android APK 기본,별도iOS/PC 설치형은후속선택 | D(86) |
| R49 | 구종 기본예산20과실제소비cap동시검사·반값1e-4 half-up | D(90) |
| R50 | 이어하기 진입은 버튼만,중단/복구 상태 안내는 내부 처리 | U(76,2026-10-19) |

## 충돌 해소

1. 어린 선수의 성장: 사용자 결정32에 따라 능력별 커리어 최고값50%와 새 상향 잠재력으로 시작한다. 현재 엔진의100 상한은 유지하며 구체보정폭5~10/시작19세는42기본안이다.
2. 국제대회 때문에 실존 경기 일정을 재현하지 않는다. '게임 세계 일정'이라는 명칭을 사용한다.
3. 13의 미국 PS/국제 경기 재경기·추첨 제안은 폐기한다. 정규시즌은 국내12회무승부/미국12회무승부라는 동일 단순규칙, 토너먼트는10회부터무사2루 승부치기,20회까지 동점이면 중단 저장 후 다음 청크에21회부터 계속. 추첨/승리기록 없는 진출은 사용하지 않는다. 서버요청을 무한히 붙들지 않는다.
4. 자동승부치기 주자는 그 이닝 다음 타자의 직전 타순 선수, 득점은 개인R과 책임투수R에 포함하지만 ER에는 제외. ordinary/automatic 주자 flag로 구분한다. 08의 '실책없음이므로 모든R=ER' 규칙은 자동주자에 한해 예외다.
5. PS 실제 형식과 정원은 게임 독자 규칙. KBO5개팀/MLB리그별6개팀이라는 사양을 유지하고 실제 기준연도 규정이라고 표시하지 않는다.
6. KBO포스팅/국내FA/해외FA는7/8/9 등록시즌 게임값. 등록기준은 '1군 명단에100개 국내 경기일'로 통일한다. 국제/상무/현역/마이너는 미포함. 대표 보상등록일 가산 없음.
7. 나이는시즌시작1회증가. 18개월복무는나이+1.5로저장하지않고 시작시즌/종료시즌/단계를 저장해 달력에 따른 정수나이만 표시한다.
8. 직행 미국복귀 준비2시즌 중 복무18개월은 포함관계다. 복무완료 후 잔여반년을독립훈련으로진행. 이미완료/비대상은독립리그2시즌. 미국계약 복귀옵션이있어미국으로다시가는경로는국내드래프트대기2시즌을강제하지않는다.
9. 은퇴가상최대45세는모든리그공통. 45세다음시즌으로넘기려는선택은제공하지않는다. 45세에복귀대기시작이불가하면즉시이유와은퇴/현계약마무리를표시한다.

## 연간 처리 순서

전년도 계약정리→나이증가/등록연차확정→병역기한확인→미국/국내명단확정→WBC창(해당연도)→프리시즌 스타일/집중 선택→정규진행→48경기 특별강화→72경기 스타일변경/올림픽창→120경기 아시안게임창→국내144/미국162 경기완료→PS→프리미어12창→성장/노쇠→기록/수상→대표/병역 혜택확정→포스팅/FA/복귀계획→다음시즌 또는 은퇴.

대회창은 세계 달력의 barrier다. KBO144와MLB162의 경기수 차이를 날짜별동시진행으로 처리하고, 체크포인트는해당선수소속리그팀경기수를기준으로표시한다. 국제창은고정세계dayIndex에있고'올림픽72경기후'는UI근사설명일뿐정확한조건은세계달력이다. 미뤄진MLB경기는해당세계시즌내배정하고구단전체경기수검증필수.

리그일정은 시즌 시작 전에 모든 국제창을 비운 뒤 생성한다. 국제창은WBC최대21일/올림픽14일/AG14일/Premier12 14일 슬롯, 실제경기수가적으면남은날휴식. 연장중단으로창을넘길때는국내재개날짜를연장하고고정연도경계를넘기지않도록오프시즌을줄인다. 1일에같은선수2경기출장금지.

## 같은 시점 사건 우선순위

서버미완료명령복구→경기종료확정→부상/등록안전처리→의무병역/계약기한→대표대회진행→콜업/강등→의무계약제안→성장/수상요약→스타일/특별훈련→일반서사. 동일ID처리한사건은다시선택하지않는다. 병역필수단계에서새미국계약을수락해기한을피할수없다.

## 구현 후에만 판단 가능한 것

성적분포/성장밸런스/목업실제줄바꿈/웹뷰로그인/배포비용/Neon지역과권한은V다. 문서기준을세웠다고실증완료로표시하지않는다.

## 상세 계약 적용

19의 통합 phase/명령 계약은02/12/13의 상태 이름을 대체한다. 의무 작업 큐와 정산 시점은19를 적용한다. 사용자 확정 요구와 본문14의 경기·연차 규칙은 유지한다.

20의 국제대회 상세 계약은12의 달력·선발·출전·대진 제안을 구체화한다. 20의 승부치기 자동주자 정의, 최근2시즌 평가, 구단 모드의 참가 결정, 부상 교체와 병역 자격 증거를 우선 적용한다. 새로운 현실 규약을 주장하는 변경이 아니라 게임 규칙 상세화다.

상세설계 03 [병역·상무·계약 정지·해외 복귀](21-MILITARY-CONTRACT-RETURN.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 04 [스타일·집중육성·강화·잠재력·노쇠](22-DEVELOPMENT-STYLE-TRAINING.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 05 [미국직행·마이너·포스팅·보유권](23-US-CONTRACTS-RIGHTS.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 06 [경기 엔진·투수교체·기록 판정](24-GAME-ENGINE-SCORING.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 07 [구단 AI·경제·드래프트·장기 공급](25-CLUB-AI-ECONOMY.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 08 [이벤트69종 조건표·실제 문안 검수](26-EVENT-CONTENT-CONTRACT.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 09 [전체33화면 최종 입력·반응형 목업](27-UI-INTERACTION-RESPONSIVE.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 10 [DB/API/인증/테스트 fixture 계약](28-DATA-API-AUTH-TESTS.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 11 [운영·백업·APK·배포·실환경 확인](29-OPERATIONS-RELEASE-RUNBOOK.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

상세설계 12 [통합 경로 재검토·설계 검토본](30-INTEGRATED-DESIGN-REVIEW.md): 해당 분야의 이전 모호한 제안은 이 상세 계약으로 구체화한다. 사용자 확정 요구를 임의 변경하지 않으며 실제 실행 검증은 분리한다.

사용자 결정31은진행속도/강화/난이도에대한최신확정요구다. 구체적인증가량·확률·배율은아직제안값이며사용자가승인했다고해석하지않는다.

사용자 결정32는모든이전가져오기제안보다우선:능력별최고50%,상향잠재력재설정(현구조100상한),병역재시작. 기존은퇴능력그대로/병역계승관련서면테스트의기대값도이규칙으로교체한다.

사용자 결정33은숨겨진치트난이도를추가한다. 일반3→하드4로카드해금,선택은수동. 기존일반난이도2종은유지. 커리어주인공적용/현재폼해금/난이도고정/원본출처와구단자동계승없음은구현기본안이다.

최신34~37은유형/대학/진로확률/능력6개/집중4개/구단치트/명칭과로고를구체화한다. 이전1~2집중·가중종합표시·미국오퍼0선택경로·대학후속범위는폐기한다. 실제미확정결과에만확률을표시하고단순설정적용100%는없다.


최신 확률 표시 규칙: [38 공통 계약](38-PROBABILITY-DISPLAY.md)을 따른다. 확률 선택은 모두 표시하되 실제 100%의 숫자 배지는 숨긴다. 보장 효과와 내부 확률은 유지한다.


## v0.8 상세 보완 우선순위

최신사용자확정→14의U→40~46분야별기본안→19~38이전상세→01~18기초. 39는정합기록. 가중종합/은퇴능력그대로/구전술가산/대학후속/치트100숫자표시는폐기. 수치기본안D는작성완료이며사용자개별수치승인이나밸런스실증V를대신하지않는다.


최신확장47~55가새8기능과교차계약의원본이다. 이전37화면/83이벤트집계는45/99로갱신한다. v0.8기존게임기능은유지,6능력/100상한/강화1회유지. 사용자개별수치승인이나앱실행검증으로해석하지않는다.


## 사용자후속확정과상세계약진행

U:특성기록해금/보유전체자동적용,개인치트구종숙련3배,동일세계원본현역또는지도자한역할(65). 구장착2/시그니처1/구종치트1배제안은폐기. 후속기술계약64및56/57/59/60/61/63작성. 목표는기념보상만/중계는확정경기감상형으로후속답변확정,58/62작성완료.


U후속:기념보상만유지,확정경기감상·스킵·다시보기(65). 기술상세계약56~64와서면80fixture연결. 기존목표·중계답변대기표기는해소됐으며실제엔진/앱검증은별도다.


## v0.11 장기 플레이 사용자 확정

U:여러해재도전+현실탈락혼합(66),스카우팅으로잠재력범위점진축소(67),팀별전성기·암흑기자연발생(68). D:평생선택형준비3시즌/재도전후대학입학최대22세/관측20경기단계/AI전략·라벨수치. 69~73충돌·복원·불변조건·연도전환·장기실험은기술계약,실행미검증.


## v0.12 사용자 확정과 교차 계약

U:강화는정확한증가량·비용을우선표시(75),상한추론가능함허용. U:웹앱·APK모두중단후이어하기필수(76),최근게임/미해결선택/진행중경기/작업/결과receipt복원. 74는순수preview·단일명령·결과불명·비동기job재조회계약. 세부수치는D,실제강제종료/네트워크/실기기시험은미실행.


## v0.13 기술 계약 보완

77은45화면의 조회·명령 연결,78은새 게임 생성 중 saveId가 없을 때의 owner/creationId 복구 계약입니다. 기존 사용자 요구를 구현하기 위한 D이며 새로운 게임 규칙 U가 아닙니다. 구단 독립 시작·보관 투입 선택·웹/APK 이어하기를 유지합니다.

## v0.14 생성·복구·이벤트·확률·시각·통합 및 난이도

79~84가 남은6개 서면 검토의 최신 계약입니다. 45화면 복구/99이벤트 근거/20확률 표면/24통합 경로와274개 서면 기대값. 미리보기는 생성전 RNG0,실제 로스터는78에서 확정. 숨김 난이도는 발견용UI이며 클릭 증명 권한 아님.

U: 구단 치트는 내 구단 모든 선수와 이후 영입/보관 투입의6잠재력100·양의 자연성장3배. 무제한 자금·적격 탐색/유효 수락 보장도 유지. D: 구종XP3배/cap60 및 소속기간 계산,퇴단P100보존·성장배율종료. 기존 구단1배/P미보장 문구를85로 대체. 원본은 수정하지 않음.

구단 난도는 설계자 재량. D: 구단 하드 동일 예산/성장/P·AI 판단 강화. 커리어 하드 경쟁환경은 D NPC P+5상한100·성장/구종XP1.2배·cap24,주인공 기존P/성장1배. 수치D는 실제 장기 밸런스 검증 전. 상세는85,구현/배포 자동 착수 아님.

2026-10-19 플랫폼 보완: [86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md). 네 환경의 웹 플레이+Android APK를 기본 목표로 정리합니다. iPhone은 Safari/홈 화면 웹앱,Windows/macOS는브라우저. 별도iOS·데스크톱 설치형은후속 선택 범위. 실제 호환 검수 미실행.


## v0.15 플랫폼 공통 흐름

87로그인/계정전환·기기간이어하기,88웹/PWA/APK업데이트·구저널·호환조회,89기념품/백업다운로드·OS공유. 모두기술D이며현재게임규칙변경없음.16의결과확인후로그아웃은87의비차단·owner분리보완을따름. 플랫폼6대상×8필수흐름은실행계획,서면기대값24추가로총298개. 실제기기·SDK·파일·업데이트미검증.


## 시각확장 사용자 최신 선택 — 2026-10-19

U:93의세번째빈티지기록실을메인그림체로선택. 앞선시네마틱선택은대체.93~95의비교보드·12사건장면·투명초상·45화면이미지슬롯·제작규약추가. 게임규칙/298기대값수는변경없음. 실제브라우저file열기는보안정책차단,정적검사와PNG내용확인만수행.


## 외부 작업 인수 후 확정 — 2026-10-19

U:100~104의 확정 UI 요구와 히든4개/슬라이더 규칙을 유지한다. T14 숙적 킬러는 같은 라이벌 투수 상대 시즌20타석 이상·OPS .900 이상+관계 이벤트 승리로 후속 확정했다. 원기록·동일 라이벌/정규시즌 범위를 사용한다. 기존cap/보유전체자동효과·기념보상만·감상중계·이어하기버튼만 요구는 유지한다. 연결 범위와 미실행 상태는105.

2026-10-19 최신 사용자확정U: 메인그림체를2번청춘야구애니로변경.111의새12사건/초상/낮·실내·야간구도와110의잘림수정을적용한다. 빈티지는이전비교안으로보존하며기존게임규칙은불변.

## 선수 표시·투구폼·사건 처리 확정 — 2026-10-19

| 결정 | 내용 | 근거 |
|---|---|---|
| U | 사건 선택지마다 결과 문구를 분리(E13 취소 문구 등 62개 사건·90개 선택지), 같은 사건 안 문구 중복 금지 | 이벤트 카탈로그 정정 |
| U | 선수에게 사람 외형 없음. 이름·던지는 손/타석·투구폼만 사용, 선수 표현은 실루엣+이름 카드 | [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) |
| U | 투구폼 4종·폼당 2구종 소폭 친화·반대손 소폭 상성 기능. 계수·친화표는 D, 양타는 항상 반대손으로 취급(119) | 119 |
| U | 생성 선수 손 우투85/좌투15, 타석은 우투 선수 우타80·좌타12·양타8, 좌투 선수 좌타70·우타25·양타5, S16 좌우 분리 기록 | [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) |
| U | 투구폼 없는 구버전 투수 생성 요청은 거절·업데이트 안내 | [122](122-API-SCHEMA-LOG-ALIGNMENT.md) |
| U | 필수 사건의 ‘화면 이동’ 선택은 이동한 화면에서 결정 확정 시 해결, 비필수는 선택 즉시 해결 | [125](125-EVENT-CHOICE-DISPATCH.md) |
| U | 이미지 시안은 저장소 밖에서 제작·비교하고 사용자 승인본만 저장소에 반영. 단계·묶음별 승인(2026-10-20), 제작 목록은 124 | [124](124-IMAGE-PRODUCTION-BRIEF.md) |
| D | AI 투구폼 분포 45/35/15/5, 좌투 보정식, 카드 테마 3종, 메달·엠블럼 수 | 119/121/124, 실행 실험 후 확정 |


## 2026-10-20 점검 후 사용자 승인 정정

- U: 기본 진행은 117의 다음 주요 사건까지 빠르게 진행. 옛 R16의 월별 기본 진행 표기는 대체한다.
- U/D 구분: 폼·좌우 소폭 영향 기능은 U. 친화 구종표·±.01 계수·AI 폼 분포는 기존 D 기본안이며 수치 승인으로 격상하지 않는다. 양타가 항상 반대손 효과를 받는 방식은 U다. 수치 변경 없이 이 구분만 정리한다.
- U: E63은 승인 시 후속 도메인 결정까지 대기하고, 보류 시 사유 확인(ACK)으로 종료한다(125).
- 2026-10-20 사용자 확정: 1단계 설계 점검·선택 수정·검증·커밋·푸시 결과를 제시하고 승인받은 뒤 2단계를 시작한다. 이미지 시안은 저장소 밖 임시 폴더에만 두고, 우투 오버핸드 투수·우투우타 타자·로고 마크를 각 2~3안 제시한다. 사용자가 고른 안만 저장소에 반영한다. 미선택·거절 시 반영하지 않으며, 후속 제작도 묶음마다 승인받는다. 승인본 반영 후 레지스터 status·화면 슬롯 참조·STATUS를 갱신하고 세 검증 스크립트를 재실행한다. 승인한 변경만 기존 정상 Git 체크아웃으로 커밋·푸시하며 V:의 .git는 변경하지 않는다.

## 2026-10-20 첫 이미지 묶음 승인 U

2026-10-20 사용자 확정: 투수 A·타자 A·로고 2, 배색은 1번 네이비·블루. 승인 SVG 3개와 팔레트 CSS·출처 기록만 반영했다. 실루엣 2/14 완료, 나머지 12개와 앱 아이콘은 별도 묶음 승인 대기. 이미지 레지스터는 92항목 중 TODO61/EXISTS19/CODE_ONLY11/LEGACY_REFERENCE1이다. 게임 규칙·45화면·99이벤트·핵심298 기대값은 불변.

청춘 야구 애니의 사건 그림체와 기존 글자체는 유지한다. 선수 SVG 기본 배색과 브랜드 마크 배색은 NAVY_BLUE_V1이며 팀 팔레트 변경을 지원한다. [승인본 보드](approved-art-board.html), [출처·선택 기록](assets/brand/APPROVED-ART-v1.json).

## 2026-10-20 두 번째 실루엣 묶음 승인 U

사용자가 2차 시안 1~4번(우투좌타·좌투좌타 타자, 좌투 오버핸드·우투 쓰리쿼터 투수)을 모두 승인했다. A 스타일·네이비/블루 배색으로 SVG 4종을 추가했다. 실루엣 6/14 완료, 남은 실루엣 8종은 별도 승인 대기다. 전체 이미지 레지스터 92항목은 TODO57/EXISTS23/CODE_ONLY11/LEGACY_REFERENCE1이다.

게임 규칙·색상·기존 승인 형태는 변경하지 않았다. [누적 승인 기록](assets/brand/APPROVED-ART-v2.json)과 [승인 보드](approved-art-board.html)를 따른다.

## 2026-10-20 남은 실루엣 전체 승인 U

사용자가 남은8종 전체를 승인해 A 스타일·네이비/블루 SVG로 반영했다. 타자6투타조합·투수4폼×2손, 실루엣14/14와 로고2가 모두 승인됐다. 전체 이미지92항목 중 TODO49/EXISTS31/CODE_ONLY11/LEGACY_REFERENCE1. Android/PWA 아이콘2묶음과 P1/P2 이미지는 별도 미완료다.

[현재 누적 승인 기록](assets/brand/APPROVED-ART-v3.json)과 [전체 승인 보드](approved-art-board.html). 선수 본인 얼굴·능력·확률 등 게임 규칙은 변경하지 않았다.

## 2026-10-20 앱 아이콘1 승인 U

사용자가 앱 아이콘1(네이비 배경)을 승인했다. Android 전경/배경/단색 SVG3개와 PWA192/512/maskable512·apple180 PNG4개·favicon SVG를 반영했다. P0의17항목(실루엣14·브랜드3묶음) 파일 제작은 모두 완료다. 전체92항목은 TODO47/EXISTS33/CODE_ONLY11/LEGACY_REFERENCE1이며 앱 연결·OS 설치 검수는 미실행이다.

[아이콘 승인·규격 기록](assets/brand/APPROVED-ICONS-v1.json). 앱 아이콘 배경은 네이비이며 승인 로고2의 형태는 유지한다.

## 2026-10-20 장면6컷 승인·우리팀 배색 통일 U

P1 청춘 애니6컷을 사용자 승인 후 반영했다. 라이벌은 흰색/네이비 팀과 버건디 팀으로 구분한다. finish 보드의 대학·마이너·기록·계약 화면은 의미에 맞는 패널로 연결했다. 전체92항목 중 TODO41/EXISTS39/CODE_ONLY11/LEGACY_REFERENCE1이다.

U: 우리팀으로 표현된 선수의 모자·유니폼 장식·속옷은 네이비로 통일한다. 잔디/나무 같은 배경 초록과 상대팀 고유색·사복은 팀 유니폼으로 간주하지 않는다. 기존 활성4PNG 수정 시안은 저장소 밖에서 제시하고 별도 승인 후 교체한다. 원본과 과거 비교 자산은 보존한다.

## 2026-10-20 네이비 수정본 승인·야간 라이벌 구분

우리팀 네이비 수정본 중 메인·기본사건·고교3PNG는 사용자 승인에 따라 새 v2 파일로 연결했다. 원본3PNG는 보존했다. 추가사건 atlas의 야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 추가 수정했고 이 최종본만 사용자 확인 대기다. 이미지 레지스터 TODO41/EXISTS39와 게임 규칙은 그대로다.

낮·야간의 해당 라이벌 장면은 같은 팀이 아니라 상대팀 선수다. 우리팀과 구분 가능한 버건디 상대 복장으로 표시한다. 추가 수정한 야간 파일은 확인 후 별도 반영한다.

## 2026-10-20 야간 라이벌 최종 승인 U

야간 라이벌의 버건디 상대 수정본을 사용자가 최종 승인해 추가사건 atlas를 새 v2 PNG로 연결했다. 기존3개를 포함해 활성4PNG의 우리팀 네이비 통일이 완료됐고 낮·야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 구분된다. 원본4PNG는 보존했다. 레지스터41TODO/39EXISTS·45화면/99이벤트/핵심298은 유지한다.

이 색상 규칙은 해당 익명 사건 일러스트의 팀 구분이며 실존 구단 로고·유니폼 팔레트나 선수 SVG의 팀별 재색칠 기능을 바꾸지 않는다.

## 2026-10-20 남은 마감 범위 U

사용자는 남은 작업을 모두 진행하되 구현 전까지만 진행하도록 지시했다. 이미지41항목과 CODE_ONLY11묶음의 표시 명세·화면/인계 정합 점검을 [126](126-PREIMPLEMENTATION-ART-CLOSURE.md) 순서로 진행한다. 시안별 사용자 승인 절차는 유지하며 별도 구현 착수 지시 전 앱/DB/API/APK 구축은 시작하지 않는다.

## 2026-10-20 학교별 컬러 배지 승인 U

2026-10-20: 대학9·군 체육팀1 컬러 배지10개 사용자 승인 반영. 학교마다 고유 주색·보조색을 사용하며 선수 사건 일러스트 네이비 원칙과 구분한다. 이미지 레지스터92항목은 EXISTS49/TODO31/CODE_ONLY11/LEGACY_REFERENCE1. 남은 P1 27개·P2 4개. 게임 규칙·45화면/99이벤트/핵심298은 불변이며 구현은 시작하지 않았다.

## 2026-10-20 기념 보상7종 승인·도장 컬러 요청 U

2026-10-20: 사용자 승인 프레임3·배경3·책장표지1만 반영. PNG4개는 생성 원본1122×1402를 보존하고 레지스터 실제 규격을 기록했다. 도장13종은 색상 추가 요청으로 수정 시안만 저장소 밖에 보관하며 미반영. EXISTS56/TODO24/CODE_ONLY11/LEGACY_REFERENCE1. 게임 규칙·45화면/99이벤트/핵심298 불변. 구현 미착수. 도장은 기존 단색 제작 초안보다 사용자 색상 요청을 우선한다. 진한 문양과 밝은 테두리의 컬러 수정안은 별도 승인 후 반영한다.

## 2026-10-20 컬러 기록 도장13종 승인 U

2026-10-20: 컬러 기록 도장13종 사용자 승인 반영. 프레임3·배경3·도장13·책장표지1, 기념 보상20항목 모두 파일 완료. 레지스터 EXISTS69/TODO11/CODE_ONLY11/LEGACY_REFERENCE1. 남은 이미지는 메달3·연대기 테마3·스플래시1(P1 7항목), 대회 엠블럼4(P2). 게임 규칙·45화면/99이벤트/핵심298 유지. 앱/DB/API/APK 구현은 시작하지 않음.

## 2026-10-20 마지막 이미지11종 승인 U

2026-10-20: 사용자 승인 마지막11종(메달3·대회 독자엠블럼4·연대기테마3·스플래시1)을 반영했다. 이미지 레지스터92항목은 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1이다. 제작 목록의 이미지 파일은 모두 준비됐으며 CODE_ONLY11묶음 표시 명세와 화면45×8상태/접근성/반응형 마감 검수는 남는다. 실제 브라우저·기기·APK 설치·DB 시험 미실행. 게임 규칙·45화면/99이벤트/핵심298 불변, 앱 구현 미착수.

## 2026-10-20 코드 표시11묶음 현재 기준 승인 U

2026-10-20: 사용자 승인에 따라 코드 표시11묶음의 비교 보드·승인 기록·화면별 표시 가이드를 반영했다. 현재 수정 가능한 승인 작업 기준이며 실제 앱 구성요소는 NOT_IMPLEMENTED다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1과45화면/99이벤트/핵심298은 유지한다. 게임 구현은 시작하지 않으며 최종픽셀·브라우저·기기·접근성 실행 검수는 미실행이다.

## 2026-10-20 구현 착수 U

사용자가 구현 시작을 명시 승인했습니다. M0부터 120 순서로 진행하고, 진행사항·검증·다음 작업을 [구현 진행 문서](../implementation/PROGRESS.md)에 기록합니다. 남은 사용량 1% 확인 시 진행 문서를 갱신해 진행분을 커밋하되 마일스톤마다 선제 저장합니다. 동일 계정 앱↔PC 이어하기는 기존 R10 및74/76/87 계약을 유지합니다. 새로운 게임 규칙은 추가하지 않았습니다.

## 2026-10-20 병살 보정 U

사용자가 M1 구현 중 미정 계수에 대해 수비10점당 +2%p·타자 주루10점당 -2%p를 선택했다. 1루 주자·2아웃 미만·인플레이 OUT에서만 병살 추첨: p=clamp(.20+.002*(D-50)-.002*(RUNNING-50),.05,.35). D는41의 수비8명 적합도 반영 평균, RUNNING은 해당 타자의 현재 유효 주루다. 성공이면 타자와1루주자2아웃, 득점0. 기존2아웃 타석에는 적용하지 않는다.

## 2026-10-20 구종 학습 슬롯 교체 U

사용자는 활성 구종4개에서 새 구종 학습을 위해 하나를 비활성화할 경우 프리시즌 구성 변경1회를 함께 사용하는 안을 선택했다. 비활성화·학습 계획·기본XP10 예약을 하나의 명령으로 확정하며 구성 변경 기회가 이미 소진됐으면 해당 교체는 거절한다. 빈 슬롯에서의 학습 확정은 구성 변경 기회를 추가로 소모하지 않는다.

## 2026-10-20 고교 리그·생성 실력 U

사용자는 고교 가상9팀·학교당25명(야수15/투수10), 상대8팀과각6경기인48경기를 승인했다. 고교 NPC 시작 종합은35~65·중심48로 승인했으며 초기 유형의 능력 모양과 기존 잠재력·하드 NPC+5 정책을 유지한다. 구현 기본 분포 D는 최솟값35/최빈48/최댓값65 삼각분포를 정수 반올림하고 유형 배열에 종합 차이만 공통 가산한다. 종합은 개별6능력의 범위가 아니다. 첫 생성 고교 코호트는18세로 시작한다. 학교별 구성 D는 야수 C/1B/2B/3B/SS 각2·LF/CF/RF 각1·DH2, 투수 SP4/RP4/CP2로 수비·기용 후보를 확보한다. 주인공은 선택 학교의 같은 역할1명을 대체한다.

## 2026-10-20 미국 직행 문턱·고교 성장 시점 U

사용자는 종합50 시작·기존 연간 성장량으로 졸업 종합55를 달성할 수 없는 충돌을 확인하고 미국 아마추어 직행 공통 종합문턱을52로 조정하는 안을 선택했다. 아마평가50·유효오퍼1이상·계약/학적 등 자격 검사는 유지한다. 졸업 진로 조회 전에 완료된 고교 등록기간의 성장만 부분 정산하고 같은 세계시즌의 다른 등록기간 성장과 중복 지급하지 않는 방식도 함께 승인했다. 기간 정규화·난이도 배율·계절별 공동예산을 임의 확대하지 않는다. 기간별 배분과 연도 정산의 구현·도달성은 후속 실제 고교 경로 테스트로 증명한다.

## 2026-10-20 고교 부상 최소 임시 충원 U

사용자는 고교 부상으로 경기 가능 야수가9명 미만이면 필요한 인원만 임시 가상 선수로 충원하고, 원선수가 복귀하면 임시 선수를 편성에서 제외하는 안을 승인했다. 구현 기준 D: 좌투 제한이 있는 C/2B/3B/SS에 필요한 우투 야수4명도 확보하며, 가용 투수가0명이면1명만 충원한다. 부상 선수까지 기존 로스터를 지우거나 초기25명 생성 기준을 완화하지 않는다. 임시 선수의 편성 해제는 공식 기록/신원 삭제가 아니다. 실제 임시 선수 생성과 등록은 상위 세계 명령으로 원자 처리한다.

## 2026-10-21 KBO 선수단 생성 세부 구현 D

44의 기존50명/24투수·26야수/1군28명/종합35~85·중심55/연령 비율/초기 총연봉80~95억원을 실제 생성으로 연결한다. 중심55의 구현 분포는35/55/85 삼각분포의 정수 반올림이며, 유형 배열에 공통 offset을 적용하되100 상한을 넘는 몫은 상한 내 축으로 균등 재분배해 종합을 보존한다. 연령 최대잔여 동률은 낮은 버킷 순으로 정해50명 기준10/18/15/7명을 생성하고 역할과 독립적으로 섞는다. 공통 연봉 비율 조정의 목표는 허용 범위 안인90억원이며 최저3천만원/최대30억원과 만원 단위를 지킨다. 1군 투수13명의 시작 보직은 SP5/RP6/CP2다. 초기 상위5 종합 합계 균형 검사는10구단 평균 대비±10%, 실패 구단만 같은 후보 stream의 다음 값으로 보정하며100회 후 명시적으로 실패한다. 이는 기존D 범위의 구현 기본값이며 사용자 신규 수치 승인U·장기 밸런스 검증V가 아니다. 선수 모집/지명/계약 수락은 생성과 별도 작업이다.

## 2026-10-21 KBO 지명 구단 배정 U

사용자는 KBO 지명 구단을 실제 포지션 수요로 결정하고 희망 구단은 선호만 반영하는 안을 선택했다. 희망 구단의 우선/확정 지명을 보장하지 않으며 실제 로스터 자리·보장 예산이 있는 구단만 후보로 삼는다. 개인 평가 기반 지명 확률·라운드는34의 공통 평가/추첨식을 유지하고 구단 배정은 별도 저장 근거로 고정한다.

## 2026-10-21 첫 국내 지명·신인 계약 구현 D

08/34/43/44의 개인 지명 모형을 실제 선수단에 연결한다. 졸업 다음 연도를 신인 계약 대상 시즌으로 준비하고05의1년 최저연봉·44의계약금0원/정원60/미래90% 보장을 지킨다. 구단 수요100/50/10과 C2/SP5/구원 RP+CP8/기타 야수1의 필요 인원을 사용하고 같은 수요면 해당 필수인원 경계의 현역 roleScore가 낮은 구단을 우선한다. 희망 구단은 수요/경계점수 동률에만 반영하며 마지막 동률은 구단 ID다. 이는 사용자 포지션 수요 우선 결정을 구체화한 구현 기본값 D이며 새로운 수치 승인 U나 장기 밸런스 검증 V가 아니다. 지명 결과/계약 수락/다음 시즌 실제 활성화를 분리하고 불변 기초 선수단에 신인 signing의 로스터/연봉 예약을1회 결합한다. 고교 계약 거절 후 대학 진학 시 프로그램 이력은 보존한다. 프로 세계의 후속 연도 작업자가 연결되기 전에는 지난 평가 세계를 새500명으로 재생성하지 않는다.

## 2026-10-21 고교 성장과 평균 중심 NPC 요구 U

사용자는 미국 직행52를 유지하며 고교 성장량을 조정하는 방향을 선호하되, NPC 대부분은 고교 평균 주변에 모이고 극단적인 고/저능력 선수는 드물어야 한다고 요청했다. 학교마다 상한65 선수가3~5명씩 흔히 생기는 구성은 원하지 않으며 주인공이 육성으로 두각을 나타낼 여지가 있어야 한다. 초기 NPC 종합 분포와 개별 유형 능력 편차, 주인공 기간 성장은 구분한다. 현재200세계/44,800명 실측과 절단 정규분포 후보 비교를 [검토 문서](../implementation/SCHOOL-GROWTH-DISTRIBUTION-REVIEW.md)에 저장했다. 종합60 이상 리그 평균0.45명/2.34명 후보와 NPC 개별 유형 편차 조정은 사용자 선택 대기이며, 주인공 고교 성장2배도 산술 검토 후보일 뿐 승인/적용 수치로 간주하지 않는다. 기존 저장값의 성장 지급 이력과 규칙 버전은 실제 변경 시 보존한다.

## 2026-10-21 고교 NPC 희소 스타·평균 성장 U / 구현 D

사용자는 고교 NPC 종합60 이상이 리그224명당평균약0.5명, 약74%가44~52에 모이는 안과 NPC 개별 유형 편차 축소를 선택했다. 후속으로 플레이어도 평균적인 성장 경로가 맞고, 일반적으로53에 도달해 미국 직행이 평범해지는 구성은 원하지 않는다고 정정했다. 따라서 주인공 고교 성장2배 제안은 철회한다. 새 고교 세계 버전2는35~65의 평균48/표준편차4 절단 정규분포와 NPC 유형 편차60%(구현 D)를 사용한다. 내 선수 초기 유형/합300/P와 기존 일반1.5/하드1/치트3 성장·기존 지급은 유지한다. 학교별 강제 스타 수는 없고 대학/프로 분포는 바꾸지 않는다. schoolBalanceVersion:2를 저장하고 없는 값은1로 읽어 기존 해시와 NPC를 보존한다. 당시 미국 자격은 결정 대기였으며, 아래 같은 날짜 미국 스카우트 평가 U가 이를 대체한다. 특별 성장 이벤트는 추가하지 않는다. [범위·호환·실측](../implementation/M2-AD-SCHOOL-BALANCE-V2.md)을 따른다.

## 2026-10-21 미국 스카우트 평가·반복 커리어 차이 U

사용자는 평균 성장을 유지하고 미국 직행의 종합52 문턱을 없애는1안을 선택했다. 미국 스카우트 최종 평가65 이상·실제 유효오퍼1개 이상·권리/학적/계약 자격이 필요하다. 평가는13의 역할 실력50%+보정성적30%+스카우팅 잠재력 범위 중앙 전망20%+고정 seed 변동[-5,5)이며 종합과 다른 점수다. 내 선수 시작 능력/일반1.5·하드1·치트3 성장은 바꾸지 않는다. 미국 직행은 마이너 계약부터다.

반복 커리어에서는 같은 유형도 잠재력 seed·성적·기회·부상·경쟁 등으로 최상급 또는 평범한 선수의 경로가 달라지기를 원한다. 투타 손/선수 유형은 기존 능력 배분·상대 궁합·합법 포지션으로 영향을 주며 특정 조합이나 기본 성장으로 미국 진출을 보장하지 않는다. 새로운 숨김 성장 배율/타고난 등급 추첨은 이번 승인에 추가하지 않는다. 전체 커리어 결과의 빈도는 장기 실행 후 V로 기록하며 생성 표본만으로 증명했다고 하지 않는다.

## 2026-10-21 미국 직행 오퍼30게임일 U

사용자는 제안 후30게임일 동안 유효한 안을 선택했다. 발급일 이상·발급일+30 미만만 수락 가능하고30일 경계부터 미국 카드를 숨긴다. 국내/대학은 별도 진로를 확정하기 전까지 비교할 수 있다. 제안 세트/경과일을 저장하며 기한만료로 같은 졸업시즌을 재추첨하지 않는다.

## 2026-10-21 미국 초기 능력 분포 U / 구성 D

사용자는 Rookie35·A45·AA55·AAA65·MLB75를 중심으로 표준편차4·평균±8 범위의 종 모양 초기 NPC 분포를 선택했다. 구현은 표준정규 z를[-2,2]에서 조건부 추출한 뒤 중심+4z를 정수 반올림한다. 4는 절단 전 모형의 표준편차이며 절단 후 관측 표준편차가 정확히4라는 뜻은 아니다. 구단별 극단값 인원을 강제로 맞추지 않는다.

초기 로스터는23의 마이너 최소 야수12·투수10과 MLB26을 사용해 조직당114명/전체30조직3,420명으로 구성한다. 마이너 투수 SP4/RP4/CP2,MLB 투수 SP5/RP6/CP2와 야수13명은 구현 기본값 D다. 초기 나이 범위는 Rookie18~22/A19~24/AA20~27/AAA21~32/MLB22~38의 D이며 장기 성장·은퇴 분포 V가 아니다. 전체6능력 평균을 맞추고1~100 상한을 지키며, NPC를 치트 사용자 소유 선수로 취급해 잠재력100을 강제하지 않는다.

## 2026-10-21 특성 해금 알림 U

사용자는 히든 특성(T13~T16)의 최초 해금만 E84 알림 카드에서 진행을 한 번 멈추고, 일반 특성(T01~T12) 해금은 멈추지 않고 읽지 않은 해금 요약(E85 읽기 화면)에 모아 보여주는 안을 선택했다. 117의 표현 정지 분류와 같으며 E84/E85 정의·효과·해금 조건은 바꾸지 않는다.

## 2026-10-21 고교 라이벌 후보0·인원 고정 U

사용자는 고교당25명 고정·후보 없으면 라이벌 없이 진행하는 안을 선택했다. 전체9학교225명(내 선수1+NPC224)을 유지하고 예외26명/전체226명은 허용하지 않는다. 후보0이면 NO_CANDIDATE를 저장하며 추가 선수 생성·재추첨·강제 능력치 상향은 없다. 동료 후보가 있으면 동료 관계/알림만 정상 생성한다. 이 결정은51/60의 종전 후보0 시 선수1명 추가 조항을 대체한다. 관계가 없어도 커리어 진행은 막히지 않는다.

## 2026-10-21 새 팀 최초 등록 동료 U

사용자는 대학·프로 새 팀 첫 등록마다 실제 같은 팀 선수 중 같은 종류·나이 차가 작은 순으로 동료1명을 추가하는 안을 선택했다. 고교 관계는 삭제하지 않고 보존한다. 같은 종류·나이 차 동률은 선수 ID순 D이며 기존 TEAMMATE 쌍은 제외한다. 같은 세계의 주인공·리그·팀별 첫 등록을 영수증으로 기록해 같은 팀의 다음 시즌마다 다시 뽑지 않는다. 후보0이면 추가 생성 없이 빈 첫 등록 결과를 저장한다. 라이벌이 같은 팀에 합류한 경우 기존 RIVAL을 지우지 않고 TEAMMATE를 별도로 연결하는60의 규칙을 유지한다. 새 팀 형성은 E94이며 실제 분리 후 재회 E96과 구분한다.

구현 범위 D: M2-AN은 실제 대학 최초 등록에 연결한다. 기존 대학 재학생 저장값에 새 최초 등록을 소급 생성하지 않는다. 프로는 실제 활성 등록 트랜잭션이 생긴 뒤 같은 규칙을 적용하며 계약 예약만으로 관계를 만들지 않는다.

## 2026-10-22 무소속 NPC 공급·성장 구현 기본안 D (M2-BN)

15의 FA 하한80명은 구단 정원과 별도인 리그 공용 무계약 풀로 유지한다. 실제 부족분만 세계/시즌/기존공급수 고정 배치로 보충하며, 독립등록 신규선수는22~30세·종합35~50이다. 범위 안 나이/정수 종합은 균등 추첨하고 기존 유형별6능력 프로필·손/폼·잠재력 생성 규칙을 재사용한다. 특정 구단 수요를 보고 스타를 만들거나 계약 없이 구단에 등록하지 않는다. 무소속 NPC의 연말 성장은 기존 PRO0출장 예산·NPC 난이도 정책으로 정산하고 노쇠도1회 적용한다. 무소속 상태로 공식 경기/구종XP를 생성하지 않는다. Y02는 정산된 능력/P/최고값을 보존하고 나이만1회 증가,45세 시즌 뒤 은퇴한다. 이 기간 해석/분포는 구현 기본안 D이며 사용자 개별 수치 승인 U나 장기 밸런스 검증 V가 아니다.

## 2026-10-22 AI 비FA 재계약 준비 기본안 D (M2-BQ)

AI는 기존 구단50명 규모를 비FA 재계약 목표로 사용하되, 남은 보장계약·사용자 선수가 수락한 계약은 목표를 넘더라도 유지한다. 실제 만료 NPC만44의 필요자리 우선/공개전망 중앙값/현재 역할가치/비용으로 비교하며08의1년 비FA 산식과35명 보호예산을 지킨다. 재계약하지 않은 선수는 신원·능력/P/구종·이전계약을 가진 무계약 FA가 되며 기록을 삭제하지 않는다. 초기 시설2의 평가범위를 사용하고 실제 정규 등록 팀경기20회 관측마다67의 stage를 최대4까지 누적한다. 재조회·무등록 시간으로 관측을 추가하지 않는다. 이는 자동운영 구현 기본안 D이며 선수별 사용자 방출 명령이나 FA 수락확률을 대체하지 않는다.

FA로 이동한 부상은 선수 프로필에 보존한다. 무등록 기간에는 치료 팀경기를 생성하지 않고, 시즌 전체 무소속 재활은 기존 성장식의 재활비율1로 계산한다. 경미/중간 잔여 팀경기는 새 계약 뒤 실제 등록 팀경기에서 이어지고, 중대 부상은 기존 health 규칙대로 진단한 시즌 마감에서 종료한다.

## 2026-10-22 AI 두 리그 최소 편성 보충 U

사용자는 계약상35명 하한을 유지하되, 1군28명과 독립 퓨처스 일정의 실제 편성에 필요한 인원만 최저계약으로 보충하는 안을 선택했다. 같은 선수를 양 리그에 중복 등록하거나 2군 일정을 생략하지 않는다. 안전 보충을 고정50명 충원으로 해석하지 않는다. 기존 AI 재계약 목표50명과 안전 보충 최소 인원은 서로 다른 기준이다. 부상 등 출전 가능 여부도 편성 검사에 반영하며 지원 예산은 기존44의 실제 부족분에만 적용한다.

## 2026-10-22 상무 퓨처스 일정·연간 선발 정원 U

사용자는 상무를 포함한 퓨처스11팀·팀당144경기·홈72/원정72·상대별14~15경기를 선택했다. KBO1군은 기존10팀·팀당144경기를 유지한다. 상무는 매년 야수10명·투수10명을 선발하며 종전 야수5명·투수5명 정원을 대체한다. 연간 선발 정원과 최초 군팀의 이전 기수 편성은 별개다. 새 일정은 군팀 실제 등록·복무·계약 정지/복귀와 버전 호환을 준비한 뒤 활성화한다. 기존10팀 퓨처스 저장 일정과 확정 경기 기록은 소급 변경하지 않는다. 이는 사용자 결정 U의 기록이며 상무 경기/병역 구현 완료나 실행검증 V를 의미하지 않는다.

## 2026-10-22 복무 두 번째 블록6월30일 완료 U

사용자는18개월 게임 복무의 두 번째 시즌6월30일 완료를 선택했다. 팀 경기 수나 국제대회 때문에 완료일을 이동하지 않는다. 첫 블록은 다음 시즌의 국내 정규기간 전체, 둘째 블록은 그 다음 시즌6월30일까지다. 구현 처리 순서 D: 완료일의 경기/일마감을 먼저 확정한 뒤 복무 완료·복귀를 처리하며, 원구단 실제 등록은 다음 날짜부터 재개해 같은 날짜 상무/원구단 중복 출장을 막는다. 기존 확정 복무 기록과 경기 결과는 소급 재작성하지 않는다. 실제 현역·상무 각 경로의 구현 범위와 옛 저장 호환은 구현 진행 문서로 구분한다.

## 2026-10-22 복귀 잔여 계약의 시즌 중 만료 U

사용자는 복귀 후 잔여 계약 경기일수가 시즌 중 소진되면 재계약을 선택하고 남은 시즌만 일할 계약하는1번을 확정했다. 시즌 종료까지 기존 일급으로 자동 연장하는 안은 채택하지 않았다. 이미 지급한 영수증/동결 원금은 소급 변경하지 않는다. 실제 제안·승인·일할 지급·시즌 진행 재개는 후속 구현이며 제안 산식/거절 분기는 기존 계약 설계를 대조하고 비어 있는 게임 정책만 추가 확인한다. 이번 기록은 선택 U이며 실제 재계약 경로 완료 V가 아니다.

## 2026-10-22 복귀 잔여 시즌 원구단 재계약 구현 D (M2-CL)

사용자 U의 일할 재계약 중 원구단 수락 경로는 기존08/01 비FA 제안 연봉 산식을 연환산 기준으로 재사용한다. 마지막 지급일 뒤 E30 계약 창에서 한 번 고정하고 명시 수락한 다음 날짜부터 지급한다. 제안은 자동 수락/연장하지 않는다. 실제 원구단 정규 등록 경기마다 round(연환산 연봉/144)를 지급하고, 해당 시즌 마지막 정규 급여일에 round(연환산 연봉×실제 등록일수/144)와의 잔여를 정산한다. 추가 경기일을 만들거나 이미 지급한 복무 원장을 수정하지 않는다. 포스트시즌은 기존 정책대로 별도 등록일 급여를 생성하지 않는다. 승격/강등을 고려해 양 리그의 남은 원구단 경기 날짜 합집합을 최대 예약액 근거로 사용하고, 실제 경기 진행에 따라 해제한다. 새 일할 계약은 현재 시즌에만 적용하고 다음 시즌 계약을 보장하지 않는다. 원래 동결 계약·지급 영수증과 새 일할 지급 원장은 모두 보존한다. 거절 이후 경로는 별도 사용자 선택/후속 구현이며 원구단 수락 경로 완료를 전체 시장 구현으로 표시하지 않는다.


## 2026-10-22 시즌 중 일할 재계약 거절 — 사용자 확정 U (M2-CL 이후 경로)

원구단의 시즌 중 일할 재계약을 거절하면 다른 구단의 제안을 비교한다. 계약을 맺기 전에는 경기 진행을 보류한다. 거절을 자동 은퇴·자동 원구단 연장·무계약 출장으로 처리하지 않는다. M2-CL은 원구단 수락 경로까지이며 다른 구단 제안과 실제 이적은 후속 구현이다.


## 2026-10-22 상무 성장 기간 연결 — 구현 D (M2-CM)

21·42의 기존 규칙을 새 입대와 다음 미진행 시즌에 적용한다. growthPolicyVersion1은 상무 등록기간·6월30일 복귀·육성 계획 경계로 성장기간을 나누고 하나의 세계시즌 예산에 누적한다. 상무 공식 FUTURES 경기와 복귀 후 원구단의 실제 등록 영수증만 읽으며 팀 경기 수는 이어서 센다. 과거 지급/기존 진행 시즌은 자동 재계산하지 않는다. 노쇠·강화·난이도 수치 변경은 없고 ACTIVE/NPC 연결은 별도다.


## 2026-10-22 시즌 중 제안 비교 후 원구단 복귀 선택 — 사용자 확정 U

다른 구단 제안을 비교한 뒤에도 새 계약을 맺기 전이라면 원구단의 제안을 다시 수락할 수 있다. 비교를 선택했다고 원구단 제안을 영구 소멸시키지 않는다. 계약 전 경기 보류는 유지한다. 실제 비교/이적 연결은 후속 구현이며 원구단 수락 경로는 M2-CL을 따른다.


## 2026-10-22 현역 복무 실제 경로 — 구현 D (M2-CN)

S26 명시 확인은 원구단 보유권과 동결 계약을 보존한 ACTIVE 프로그램을 만들고 다음 시즌부터 실제 두 리그 등록/출장·구종 경기XP·등록일 급여·자연성장을0으로 연결한다. NONE 휴식만 매일1회, 부상 잔여 팀경기는 날짜로 소모하지 않는다. E51 첫 블록·6월30일 복귀 E53·다음 원구단 등록일 지급을 기존 달력/급여 원장으로 처리한다. 확정 저장은 KBO 루트v2로 구분해 구버전 진행을 거절하고 기존v1 학교/상무/일반 저장은 읽기 보존한다. 전체28세 기한·E49/E54·복귀6경기0.95는 후속 구현이며 기존 설계값을 바꾸지 않는다.

## 2026-10-22 병역 계획·기한·복귀 컨디션 — 구현 D (M2-CO)

기존21의28세 기한을 군 기록 필드 없는 저장에도 적용하고 E49/E54 명시 열기/선택을 연결한다. START_SERVICE는 S26 검토로만 이동하며 실제 입대 확정 전에는 기한 차단이 유지된다. 유예는26세 이하, 상무 지원은 기존19~27세·건강 조건을 따른다. 25/26세 남은 유예·27세 마지막 유예를 공개 조회한다. 새 현역 실제 복귀 후6개 등록 팀경기의 유효 능력0.95를 공식 경기/건강 영수증으로 계산한다. 벤치·부상 등록 포함, INT/휴식 제외, 영구 능력 불변이다. 새 계획/연도/현역 전환은 KBO 루트v3로 보호하고 기존v1/v2는 읽기 보존한다. 이미 완료된 옛 복무에 효과를 소급 생성하지 않는다. 게임 수치 변경이나 사용자 신규 결정U가 아니다.

## 2026-10-22 시즌 중 타구단 제안 연봉 — 사용자 확정 U

사용자는 계약 소진 뒤 타구단 제안의 연봉 환산액을 기존 선수 가치 산식으로 정하고 잔여 시즌의 실제 등록 경기일만 지급하는 안을 승인했다. 원구단 재계약 제안은 비교 중에도 유지한다. 환산액은 기존 만원 반올림·최저/최대 연봉 경계를 따르며 실제 타구단 계약/지급 연결은 후속 구현이다.

## 2026-10-22 시즌 중 계약 비교 — 구현 D (M2-CP)

원구단 E30을 유지한 비교 요청은 날짜/계약/권리/돈을 바꾸지 않고 진행을 보류한다. 타구단은 기존 선수 가치의 만원 반올림 연봉, 정원/잔여 일정/예산 조건을 검사하고 포지션 수요 순으로 고정 비교한다. 새 추첨·1군 보장 없음. 실제 타구단 수락/이적은 후속이며 원구단 재수락은 기존 명령으로 가능하다.

## 2026-10-23 이적 관계 분리 연결 — 구현 D (M2-CR)

60의 SEPARATED/transferReceipt를 실제 성공한 CQ 이적에 연결한다. 원구단 실제 등록 FORMED/REUNITED_TEAM 관계만 분리하고 기존 type/모든 milestone을 보존한다. 군팀 대여·현역 제외, 부상 등록 포함. 원구단 수락/실패/단순 조회는 불변이다. 새 동료 E94는 유지하며 상대 출장 E95/같은 팀 재회 E96은 후속이다. 새 게임 수치/사용자 결정/저장 스키마 변경은 없다.

## 2026-10-23 실제 상대 출장 재회 연결 — 구현 D (M2-CS)

60/107의 실제 동일 경기 양쪽 출장과 경기 당시 등록 근거를 KBO/퓨처스 정규·포스트시즌 마감에 연결한다. SEPARATED에서 REUNITED_OPPONENT/E95를 기록하며 단순 벤치/같은 팀/과거 조회로 만들지 않는다. 비차단 OPEN_RELATIONS 확인은 읽음만 변경하고 진행 단계/경기/RNG/T14를 변경하지 않는다. 상무의 부족한 상대 등록 근거는 후속 연결 전까지 재회를 만들지 않는다. 새 게임 수치/사용자 결정/스키마 변경은 없다.

## 2026-10-23 이적의 같은 팀 재회 연결 — 구현 D (M2-CT)

60의 실제 공동 등록/E96을 성공한 시즌 중 주인공 이적에 연결한다. SEPARATED/REUNITED_OPPONENT 관계·목적지 실제 등록을 대조하고 선택적 이적 영수증 sharedRelationKeys로 과거 근거를 보존한다. RIVAL 종류/이전 이력은 유지하고 별도 TEAMMATE/E94와 공존한다. 부상 등록 포함, 군팀 대여/현역 제외, 이전 저장 조회 소급 없음이다. 새 게임 수치/사용자 결정 변경은 없다. AI 영입/군팀 공동 등록은 후속이다.

## 2026-10-23 상무 군팀 비상 보충 — 사용자 확정 U

사용자는 상무에서 부상으로 건강한 야수9명·투수1명을 채우지 못하면 낮은 능력의 군팀 전용 가상 선수를 필요한 만큼만 임시 등록하고, 원래 선수가 복귀하면 제외하는 안을 승인했다. 매년 야수10·투수10 정규 선발과 별도 비상 보충이며 조기 입대/기권으로 대신하지 않는다. 실제 명단·건강·기록 조회 연결은 후속 구현이고 이번 공동 검사 결과를 그 구현의 통과로 세지 않는다.


## 2026-10-23 상무 임시선수 실력 — 사용자 확정 U

사용자는 군팀 전용 임시선수의 실력을 기존 KBO 비상 대체 선수와 같은 종합35~45로 승인했다. 정규 선발·계약·병역 판정에는 포함하지 않으며 부상으로 부족한 최소 경기 인원만 채운다. 신규 시즌 활성화·구 저장 보존과 실제 검증 결과는 M2-CU 구현 기록을 따른다.


## 2026-10-23 군팀 건강·정규 성장 종료 경계 — 구현 D (M2-CU/CV)

새 군팀 시즌은 루트v5에서 실제 FUTURES:SANGMU 건강과 종합35~45 최소 임시선수를 연결한다. 진행 중 원장 없는 구 저장은 기존 난수 순서를 유지하고 새 시즌 시작에서만 활성화한다. 임시선수는 별도 군팀 신원/구종 원장에 보존하며 계약·복무 프로그램·정규 선발을 만들지 않는다. 현재 군팀 신원과 제외 후 과거 등록 조회를 읽기 투영으로 제공하고 다음 시즌 입대 예약은 현재 민간 소속으로 유지한다. 포스트시즌 건강 전이를 정규 성장의 끝 상태와 혼동하지 않도록 종료 경계를 복원한다. 기존 성장 수치·연간 한도·지급 영수증은 바꾸지 않는다. 실제 통과/미완료 범위는 구현 CU/CV 문서의 최종 검증을 따른다.


## 2026-10-23 개막 재활 증거 — 구현 D (M2-CW)

이미 보존한 개막 unavailable 증거를 새 미지급 정규/병역 성장 기간에 재사용한다. 새 기간은 opening-health-v1로 구분하고 옛 지급 기간의 계산/검증/금액은 유지한다. 증거 없는 구 저장에 개막 사실을 만들지 않는다. 기존 성장 수치/연간 한도/잠재력/사용자 결정 변경이 아니며 실제 검증 결과는 구현 CW 문서를 따른다.


## 2026-10-23 NPC 복무 복귀·군팀 공석 — 사용자 확정 U

NPC 복귀 뒤 남은 계약 일수가 시즌 중 소진되면 기존 AI 선수 가치·포지션 수요·예산으로 재계약 또는 FA를 결정한다. 내 선수의 계약 비교·선택은 유지한다.

6월30일 전역·신규 지원자 부족으로 정규 군팀 인원이 부족해도 확정된 상무 시즌을 마치도록 종합35~45 군팀 보조 선수를 필요한 만큼만 충원한다. 부상 보충 외 전역·모집 공석에도 허용하되 정규 입대·복무 프로그램·민간 계약을 만들지 않는다. CU의 부상 전 정규 명단 충족 제한을 이 후속 경로에서 확장한다. CW574개 검증은 이 신규 NPC 정책의 구현 통과가 아니다.


## 2026-10-23 상무 공석 보충 — 구현 D (M2-CX)

승인한 전역·모집 공석 최소 보충은 기존 군팀 보조 원장2로 구분한다. 진행 중 원장1은 부상 전 정규 명단 제한을 유지하고 새 확정 군팀 시즌 개시에서만 승격한다. 보조만 남은 확정 일정은 실제 경기 투영을 유지하되 계약/입대/복무를 만들지 않는다. NPC 실제 복귀/급여/성장은 후속이다. 검증 결과는 CX 구현 기록을 따른다.


## 2026-10-23 입대 관계 분리 — 구현 D (M2-CY)

기존60의 실제 소속 분리 규칙을 신규 확정 NPC 입대에 연결한다. 실제 같은 민간 구단이었던 관계만 입대 프로그램 증거로 SEPARATED를 기록한다. RIVAL/TEAMMATE 종류·이전 이력/공지/경기/RNG를 유지하며 군팀에 같이 대여된 주인공·미선발/기존 분리 관계는 유지한다. 이미 입대한 저장의 조회 소급은 없다. 새 사용자 결정이나 게임 수치 변경이 아니며 검증은 CY 구현 기록을 따른다.


## 2026-10-23 상무 공동 등록 E96 — 구현 D (M2-CZ)

기존60의 실제 공동 등록/재회 규칙을 군팀 공식 경기의 건강 등록 행에 연결한다. 이전 분리 관계만 재회하며 벤치/부상 등록을 인정한다. 경기·관계·당시 등록 신원으로 공유 등록 증거를 봉인하고 현재 소속/피로/능력으로 추정하지 않는다. 기존 E96 필드·관계 종류/이력·게임/RNG/돈/성장 수치는 유지하고 구 군팀 증거를 소급 생성하지 않는다. 새 사용자 선택이나 게임 확률 변경은 아니며 실제 검증 범위는 CZ 구현 기록을 따른다.

## 2026-10-23 NPC 병역 기존 채무의 예산 예외 — 사용자 확정 U

기존 병역 계약의 원금·과거 지급은 보존한다. 실제 신규 입대로 지급 시점이 밀려 미래 예산90%를 넘더라도 기존 급여 채무를 삭제하거나 선발을 취소하지 않는다. 초과 구단의 신규 선택 영입은 제한하고 필수 명단 복구만 기존 안전망으로 처리한다. 재정재건 지원은 실제 지급 연도의 부족분만 정확한 원 단위로 기록하며, 미래 연도 지원을 미리 만들거나 영구 예산·경쟁 영입 자금으로 사용하지 않는다.

구현 D: 새 실제 NPC 입대의 KBO 루트v6/분리 계약 원장을 대상으로 적용하며, 기존v1~5 원장·과거 성장/급여를 소급 수정하지 않는다. 동결 잔여 최대576일과 반년 복귀를 반영해 미래6년까지 채무를 조회한다. 일반 계약·보장금만으로 한도를 넘은 입력은 계속 거절한다. 현재 연도 지원금을 받은 구단의 선택 영입은 그 시즌에 제한한다. AI 재계약·FA·드래프트·잔여 시즌 이적에도 같은 판단을 적용하며 최소 명단 복구는 예외다. 내 선수의 다음 해1년 재계약은 올해 지원금 여부 대신 대상 연도의 실제 채무+새 연봉90% 한도로 판단해 기존 선택 흐름을 유지한다. 실제 복귀/급여/성장의 검증 결과는 M2-DA/DB 구현 기록을 따른다.

## 2026-10-24 NPC 원구단 복귀 공동 등록 — 구현 D (M2-DC)

기존60의 실제 같은 팀 등록 E96을 새 NPC 병역 복귀 경로에 연결한다. 실제 복귀 영수증 이후 원구단의 같은 KBO 또는 Futures 공식 정규 경기 건강 명단에 양쪽이 함께 있어야 하며 벤치·부상 등록을 인정한다. 복귀 일마감 당일·군팀 대기·다른 리그·현재 master roster만으로 재회를 추정하지 않는다. 복무 계약 또는 그 잔여 시즌 연속 계약이 이어진 복귀만 이 경로의 생성 대상이며 일반 AI 영입은 별도다.

이전 분리 관계의 종류/이력을 보존하고 실제 복귀 날짜·프로그램·공식 경기·당시 정렬 등록 신원을 봉인한다. 과거 읽기/ACK는 현재 소속·계약에서 추정하지 않는다. 같은 날 공동 경기 뒤 계약이 만료되면 재회 이정표를 먼저 기록하고 이후 분리를 보존한다. 반복 처리로 그 마지막 분리를 되돌리지 않는다. 기존 사건 필드·게임/RNG/돈/성장 수치·루트v6는 유지하고 구 저장에 소급 공지를 만들지 않는다. 새 사용자 수치 결정이 아니며 실행 검증은 DC 구현 기록을 따른다.

## 2026-10-26 연말 원구단 예산 부족의 진로 — 사용자 확정 U

다음 시즌 원구단 예산으로 내 선수의 만료 계약을 재계약할 수 없으면 다음 해 보유권을 해제하고 다른 구단의1년 계약 제안을 비교한다. 기존 계약의 원금/과거 지급 보장 정책은 유지한다. 원구단 권리를 유지한 무계약 훈련/재협상으로 대신하지 않는다.

구현 D(M2-DF): 이번 시즌 마감 자료·소속·급여·권리는 비교/수락으로 소급 변경하지 않고, 다음 시즌 전환에서 선택 계약/새 소속/원구단 권리 해제를 원자적으로 활성화한다. 기존 역할 가치 산식·포지션 수요·대상 연도 채무/예산·만료 예정 자리를 사용하며1군 출전을 보장하지 않는다. 제안이 없으면 명시적인 빈 목록과 기존 은퇴 선택을 제공하고 계약 전에는 연도 진행을 보류한다. 새 권리를 쓰는 현역/상무 복무도 선택한 구단의 계약을 동결한다. 루트v7은 구v1~6의 급여/성장을 소급 변경하지 않는다.

## 2026-10-26 미국 시즌 급여·부상·육성·첫 콜업 — 사용자 확정 U

마이너 시즌 연봉 $30,000은 모든 미국 레벨이 공유하는 정규시즌 첫 날짜부터 마지막 날짜까지 분할 지급한다. 승강으로 분모/이미 지급한 금액을 바꾸지 않는다. 매 날짜 누적 정수 권리액의 차액을 지급하고 마지막 날짜에 정수 오차를 정산한다.

부상으로 경기 인원이 부족하면 같은 조직의 건강한 선수를 우선 보충한다. 다른 레벨의 최소 경기 인원을 해치면 낮은 능력의 임시 선수만 필요한 만큼 충원한다. 원래 부상 선수의 신원/기록을 삭제하지 않는다. 임시 능력35~45는 기존 비상 선수 공통 수준을 재사용하는 구현 D다. MLB26명은 유지하고 교체된 부상 선수/역할은 조직 예비 명단에 보존하며 복귀 후 원래 자리에 복원한다. 임시 선수의 과거 경기 기록은 제외하지 않는다.

특별강화는 현재 레벨 시즌 경기 수의1/3(올림), MID 플레이스타일은 절반(올림)에 연다. Rookie60경기는20/30, A100경기는34/50이다. 승격/강등으로 세계 시즌당 강화1회·MID 변경1회를 초기화하지 않는다. 구종 숙련 치트3배·능력 상한100은 기존 결정을 유지한다.

첫 MLB 콜업은 기존 게임 최저 기준 연 $800,000을 콜업 다음 날짜부터 일할 적용한다. 이미 받은 마이너 급여와 계약금은 그대로 보존한다. 기존 $30,000 예약과 겹치는 부분을 빼고 추가 잔여 보장액만 구단 예산에서 예약한다. MLB 등록/콜업 수락을 실제 첫 출장으로 기록하지 않는다. 이후 FA·재협상은 기존 가치 산식을 따른다. 현실 최저연봉/노사협약을 재현한다는 뜻은 아니다.

구현/검증 상태는 implementation의 최신 인계를 따른다. 이 결정 기록 자체가 전체 미국 커리어 완료 증거는 아니다.

## 2026-10-26 U — 부상으로 미완성인 구종의 다음 시즌 재학습

사용자는 부상 등으로 시즌말 숙련1 미만인 구종의 기존 XP를 보존하고 다음 프리시즌에 같은 구종 학습을 다시 선택하는 안을 확정했다. 네 분기 정산과 예약 해제를 모두 마쳤으면 숙련0이라는 이유만으로 연말/진로 전환을 막지 않는다. 다음 해 재선택은 그 해 학습1회와 기존 연간 예약 예산을 사용하며 과거 미지급분 소급/무료 XP/자동 활성은 없다. 미완료 분기·미해제 예약은 여전히 연말 마감 대상이다. [57 상세계약](57-REPERTOIRE-DETAILED-CONTRACT.md).

## 2026-10-26 U — 미국 은퇴 공석은 조직 승격 우선

사용자는 미국 NPC 은퇴 공석을 조직 내 승격으로 우선 채우고 신인은 Rookie에만 보충하는 안을 선택했다. 상위 레벨 평균 실력을 가진 외부 선수를 바로 생성해 공석을 메우지 않는다. 기존 선수 신원·능력·기록을 보존해 이동하며 부족분을 아래 레벨로 연쇄 보충한다. 새 신인은 기존 Rookie 생성 분포를 사용한다. 이 결정이 장기 리그 실력 균형 검증 완료를 뜻하지 않는다. [13 미국 경로](13-MLB-CAREER.md).

## 2026-10-26 U — MLB 부상 등록과 FA 서비스

사용자는 MLB 등록을 유지한 부상 기간도 시즌100등록경기/6등록시즌 FA 계산에 포함하도록 확정했다. 출장 PA/outs가 없어도 공식 MLB 정규 등록 영수증이 있으면 센다. 마이너·포스트시즌은 이100경기에 더하지 않는다. 같은 선수·시즌·날짜의 중복 등록은 거부하며 등록 근거가 없는 옛 기록을 출장 수에서 추정해 채우지 않는다.

## 2026-10-27 U — 국제대회 상대 프리셋 종합

사용자는 다른 나라 팀 프리셋 종합을 강 65, 중 55, 약 45로 확정했다. 여섯 능력은 그 값과 같아서 종합은 65.0, 55.0, 45.0이다. 한국 우승 확률은 넣지 않는다. 이 기록이 국제 대회 경기 구현 완료를 뜻하지 않는다. [12](12-STYLE-INTERNATIONAL-MILITARY.md) [20](20-INTERNATIONAL-COMPETITIONS.md).

## 2026-10-27 U — 미국 연봉 최종 최저 보장

사용자는 미국 재계약의 성적 보정 후 최종 연봉도 최소 $800,000으로 보장하도록 확정했다. 기존 기본액에 성적 배율을 적용한 뒤 최종 clamp($800,000,$40,000,000)를 적용한다. 최저 기본액에0.8배가 적용되어 $640,000이 되는 구 해석은 폐기한다. 첫 콜업의 연 $800,000 일할 지급 정책과 기존 지급액 보존은 유지한다. 구현은 후속 미국 재계약 묶음에 연결한다.


## 2026-10-27 U — MLB 제안 기간의 나이 경계

사용자는 계약 시작 시즌 나이를 기준으로29세 이하5년,30~32세3년,33~35세2년,36세 이상1년을 확정했다.33세 이상1~2년이라는 기존 미정 구간을 이 기준으로 교체한다. 첫 콜업의 잔여 시즌 일할 지급 정책은 유지한다.

## 2026-10-27 U — MLB FA 전 자동1년 재계약

사용자는 MLB FA 자격 전의 구단 보유기간에는 매년1년씩 자동 재계약하도록 확정했다. 나이별5/3/2/1년은 FA·포스팅의 MLB 제안 기간에 적용하며, 첫 콜업의 잔여 시즌 일할 계약은 유지한다. 연봉은 기존 미국 가치 산식을 사용하고 성적 보정 후 최저800000달러를 보장한다. MLB등록100경기 기준6등록시즌 FA 판정은 유지하며 이 자동 재계약이 FA 자격을 초기화하지 않는다.

## 2026-10-27 U — AG 아시아 참가국 정정

사용자는 아시안게임 프리셋의 호주(AUS)를 홍콩(HKG)으로 교체하고 기존 중간 실력55를 유지하도록 확정했다. 참가국은 아시아 국가만 사용한다는20의 규칙을 따른다. 다른 상대의65/55/45와 한국 진출 보장 없음은 유지한다.

## 2026-10-27 U — 국가대표 다중 리그 평가 표본

사용자는 당해 최소 표본(타자50PA/투수30아웃)을 채운 가장 높은 리그를 먼저 사용하고, 없으면 직전 시즌의 같은 기준으로 고르도록 확정했다. WBC는 개막 전이므로 기존20대로 전년 성적만 평가한다. 정규 성적만 사용하고 대표/PS를 섞지 않는다. 리그 보정치는20의 기존값을 유지하며 새로고침/승강 뒤 이미 봉인된 선발 점수를 재추첨하지 않는다.

## 2026-10-27 국제대회 참가국·실력 프리셋 — 사용자 확정 U

한국은 실제 선발 선수 능력치를 사용한다. WBC20팀은 한국, 강65(미국·일본·도미니카·베네수엘라·푸에르토리코·멕시코), 중55(쿠바·대만·네덜란드·캐나다·호주·파나마·콜롬비아), 약45(이탈리아·영국·체코·이스라엘·중국·브라질)이다. OLY6팀은 한국·일본·미국·대만·도미니카·쿠바, P12 12팀은 한국·일본·미국·도미니카·베네수엘라·푸에르토리코·멕시코·쿠바·대만·네덜란드·캐나다·호주이며 상대 실력은 같은 공통 표를 사용한다. AG의 HKG55 결정은 유지한다. 실제 진출국/전력 예측이 아닌 게임용 고정 프리셋이며 이 결정의 기록은 해당 대회 실행 구현 완료 증거가 아니다.

## 2026-10-27 P12와 포스트시즌 날짜 충돌 — 사용자 확정 U

P12는 11월15일과 양 리그 PS 실제 종료 다음 날 중 늦은 날에 개막하고14일간 유지한다. PS 때문에 늦어지면 P12를 연기하며 정규/PS 경기 날짜를 당겨 해결하지 않는다. 이미 확정·진행된 저장의 경기 날짜는 보존하고 새 일정 연결부터 적용한다. 현재 calendar-1·national-bracket-1의 고정 P12 fixture는 기존 동작의 검증 이력이며 이 새 시간축 정책의 구현 완료 증거가 아니다.

## 2026-10-27 WBC와 정규 개막 충돌 — 사용자 확정 U

WBC 개최 연도의 새 프로 시즌은 WBC 종료 뒤부터 정규 경기를 배치한다. WBC의 기존 대회 날짜·기간은 유지한다. 이미 진행 중인 저장의 날짜·확정 경기·seed·급여 원장은 보존한다. calendar-1은 구 규칙 그대로 읽고, 신규 프로 진입·연도 전환부터 calendar-2를 쓴다. 학교 일정·자연성장 예산·시즌 경기 수·연봉 산식은 바꾸지 않는다.

## 2026-10-27 KBO 출신 미국 마이너 계약 종료 — 사용자 확정 U

포스팅·해외FA로 체결한 미국 마이너 계약은 서명한 기간 종료 후 미국 재계약·FA 또는 국내 복귀를 비교한다. 고교 직행의6시즌 보유 규칙을 KBO 출신에게 추가 적용하지 않는다. 유효 다년계약과 이미 지급한 급여·이전 등록연차·국내 복귀권은 보존한다. 계약 종료 후 새 제안의 미정 수치는 임의 확정하지 않는다. 이 기록 자체는 해당 비교/계약 경로의 구현 완료를 뜻하지 않는다.

## 2026-10-27 대표팀 불펜 연투 — 사용자 확정 U

대표팀 RP·CP는 두 세계일 연속으로 실제 등판했으면 다음 날 휴식한다. 단순 명단등록/경기 없는 날/PA·BF 없는 벤치 기록을 등판으로 세지 않는다. 선발은 기존 등판 후 최소3세계일 휴식을 유지한다. 준비된 pendingGame과 과거 확정 경기는 이 결정으로 재작성하지 않는다.

## 2026-10-28 KBO 출신 새 미국 마이너 제안 — 사용자 확정 U

서명한 기존 계약 기간 종료 후 비교하는 새 마이너 재계약/FA 제안의 기본 조건은1년·연$30,000이다. 기존 유효 다년계약/지급 급여는 보존하며 이 결정으로 과거 제안을 재가격하지 않는다. 미국/국내 진로 비교 결정은 유지한다. 구현은 후속이다.

## 2026-10-28 KBO 출신 마이너 만료 진로 비교 — 사용자 확정 U

KBO 출신 선수의 미국 마이너 계약이 끝나면 원구단 재계약과 예산·포지션 수요를 충족하는 타 구단 최대3곳의 새 제안을 비교한다. 국내 복귀 옵션도 함께 제공하며 기존 국내 보유권·우선협상 규칙을 따른다. 새 마이너 제안의 기본1년·연$30,000은 유지한다. 유효 기존 계약·이미 지급한 급여·봉인 제안은 소급 변경하지 않는다. 이 결정의 runtime 연결은 후속 구현이다.

## 2026-10-28 KBO 출신 마이너 첫 MLB 콜업 계약 — 사용자 위임 확정 U

다년 마이너 계약 중 첫 MLB 콜업 시 추천안인 ‘콜업 시즌까지만 MLB 계약, 이후 FA 전 매년1년 재계약’을 적용한다. 급여는 기존 결정대로 콜업 다음 날부터 연$800,000을 일할 적용한다. 이미 받은 마이너 급여는 유지하며, 종전 마이너의 남은 기간 전체에 MLB 급여를 보장하지 않는다. 기존에 봉인·진행된 저장을 소급 재가격하지 않는다. 사용자는 추천 방식으로 진행하도록 위임했다. 구현은 후속이다.

## 2026-10-28 미국 마이너 만료 후 새 계약의 등록 레벨 — 사용자 확정 U

KBO 출신의 미국 마이너 계약 만료 후 원구단 재계약과 타 구단 새 계약 모두 현재 마이너 레벨을 유지한다. 계약만으로 AAA나 MLB로 자동 승격하지 않는다. 이후 승격·강등은 기존 실제 경기 평가·명단·예산 조건을 따른다. 새 계약1년·연$30,000, 원구단/타 구단 최대3곳/국내 복귀 비교 결정은 유지한다. 실행 시장은 후속이다.

## 2026-10-28 미국 마이너 새 제안의 포지션 수요 — 사용자 확정 U

타 구단은 현재 마이너 레벨의 같은 포지션 선수보다 경쟁 점수가 높을 때 새 제안 후보가 된다. 기존 명단 교체 방식처럼 같은 종류·포지션의 가장 낮은 경쟁 점수를 비교 기준으로 사용한다. 기존 경쟁 점수 산식을 재사용하고 별도 점수 문턱·확률은 추가하지 않는다. 예산 충족과 타 구단 최대3곳, 원구단 재계약·국내 복귀 비교 및 현재 레벨 유지 조건은 유지한다. 시장 실행 연결은 후속이다.

---

<!-- SOURCE: 01-GAME-RULES.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

최신 가져오기 규칙: [사용자 결정32](32-USER-IMPORT-REBIRTH.md). 아래의 능력치 그대로/기존잠재력·병역혜택 계승 제안은 폐기되며, 능력별 최고50%·상향잠재력·병역재시작으로 읽고 관련 기대값을 교체한다.

# 01. 게임 규칙 사양

수치는 rulesVersion=1의 제안 기본값. 사용자 확정 요구와 구별하며 밸런스 검증 후 변경한다. 커리어 시작 시 규칙 버전을 고정한다.

## 1. 선수 생성

생성 순서: 이름 → 타자/투수 → 포지션/보직 → 투타 → 유형 → 집중 육성 → 확인. 고교 3학년, 게임 나이 18세, 희망 구단 선택 가능. 희망은 지명 보장이 아니다.

이름은 NFC 정규화 후 앞뒤 공백 제거, 1~12 글자소, 제어문자/개행 불허, HTML은 텍스트로 렌더링. 등번호 0~99는 프로 입단 후 선택하고 중복이면 가능한 번호 목록 표시. 가상 고교 이름은 기본 목록에서 선택. 능력치 재뽑기는 없다. 유형 변경 미리보기는 생성 전 자유롭게 할 수 있다.

타자 상세 포지션: C, 1B, 2B, 3B, SS, LF, CF, RF, DH. 투수 보직: SP, RP, CP. 좌투는 C/2B/3B/SS를 선택할 수 없으며 사유를 화면에 표시. 투수 타격과 이도류는 v1 제외. DH 선수도 공통 수비 능력치는 보유하나 수비 기여는 계산하지 않는다.

능력치 1~100 정수. 성장 누적 계산은 내부 소수로 하고 UI만 정수 표시한다. 타자: 컨택/파워/선구안/수비/주루/클러치. 투수: 구속/구위/제구/위기관리/체력/견제. 구속능력과 실제 km/h는 구분하며 구속능력 1~100을 125~165km/h로 선형 표시하는 기본안이다. 투구폼은 외형/서사만, 초기 성적 보너스 없음.

초기 능력 배열은 [35의 타자8종·투수6종 표](35-SIX-ABILITIES-FOUR-FOCUS.md)를 사용한다. 각종류6개,합300/평균50으로시작한다.

유형별 가치는 같다고 가정하지 않고 유형 승률/프로 진입률을 검증한다. 잠재력은 생성 seed로 각 능력의 현재값~95 범위에서 생성하며 기본 분포는 중심 75의 절단 정규분포다. 정확한 잠재력은 숨기고 스카우트 전망(발전 여지 적음/보통/큼)을 보여준다. 확정 후 동일 선수 재생성 시 난수 결과를 바꾸지 않는다.

## 2. 성장·체력·부상

시즌 전 서로 다른 집중 능력 정확히4개 선택. 성장 예산80%를선택4개에균등배분하고나머지20%를미선택2개에유형가중배분(35). 상한에 막힌 예산은 남은 능력으로 재분배하며 성장 불가능하면 소멸. 전체 능력 100 상한.

성장 예산 기본: 나이 18~22 = 10점, 23~27 = 6점, 28~31 = 3점, 32 이상 = 1점. seasonGrowth = base × 출장계수(0.7~1.1) × 훈련계수(0.8~1.2). 부상 중에도 출장 0으로 성장 전체가 무조건 0이 되지 않는다. 점수는 능력치 합산 증가량이며 모든 능력이 각각 10 오르는 뜻이 아니다. 프로 첫해와 고교 성장을 이중 적용하지 않는다.

노쇠 예산: 32~34 = 2점, 35~37 = 5점, 38~40 = 9점, 41~44 = 12점. 성장 후 감소 적용. 타자는주루,투수는구속/체력에60%,나머지능력에40%배분(42의최종배분계약). 현재 능력치 1 하한. 조숙/만성 특성은 v1.1 후보이며 v1에서 숨겨진 예외를 두지 않는다.

투수 체력은 재능 수치이며 타자에게 별도 체력 능력은 없다. 피로는 양쪽 모두 0~100 상태다. 야수 경기 출전 +5, 하루 휴식 -8. SP 등판 기준+40, RP/CP 기준+15에41의체력배율적용, 투수 휴식 -10. 피로 60 초과 시 경기 능력 배율 max(0.8, 1-(피로-60)×0.005). 고피로 선발 강제 시 확인 문구. 커리어 기용은 AI가 결정하므로 사용자가 과로를 강요받지 않는다.

부상 기본 확률은 출전 경기당 0.15%, 피로80 초과면 2배. 경미 3~7경기 80%, 중간 8~30경기 18%, 중대 잔여시즌 2%. 부상 기간 동안 출장 금지, 달력 일수와 출장 경기 수를 혼용하지 않고 '팀 경기 수' 기준으로 회복. 재활 이벤트는 복귀 후 첫 검증 시점에 한 번. 중대 부상 후 영구 능력 감소는 v1 제외. 자동 진행은 부상 선택 사건에서 멈춘다.

## 3. 기용·1/2군

화면 종합은 영구6개능력의 산술평균(최대100.0). 기용에만별도roleScore를사용하며41의역할가중표를따른다.

후보 경쟁 점수 = roleScore×0.8 + 최근 성적 지수×0.2. 성적 지수는 최소 50타석/10이닝 이후 0~100 범위로 정규화하고 그 전은 50. 부상자는 제외. 포지션 적합성과 로스터 슬롯을 먼저 확인하고 점수를 비교한다. 2군 선수는 20팀경기마다 콜업 검토. 1군 기용도 같은 주기로 재검토. 이벤트 선택이 즉시 출전을 보장하지 않는다.

## 4. 리그·일정

10개 구단, 팀별 상대 9팀과 16경기씩 = 144경기, 리그 총 720경기. 상대별 홈8/원정8. 9라운드 순환 대진을 16회 배치해 한 라운드 5경기로 생성하며 6라운드 후 휴식일을 둔다. 현실 3연전 일정의 재현은 v1 제외. 더블헤더·우천 취소 없음. 2군도 독립 동일 일정으로 단순화한다.

승률 = 승/(승+패), 무승부 제외. 승패가 모두 0이면 미정. 동률은 상대승률 → 득실차 → 시즌 seed 기반 사전 추첨 순서. 개인 타이틀은 규정타석 팀경기×3.1 올림, 규정이닝 팀경기×1.0. 누적 타이틀에는 규정 제한 없음.

포스트시즌 독자 규칙: 4위와 5위 2선승(4위 1승 선취 부여), 승자가 3위와 3전2선승, 승자가 2위와 5전3선승, 승자가 1위와 7전4선승. 상위시드 홈 우선, 2-2-1/2-2-3 홈 분배. 정규시즌 12이닝 무승부, PS는10회부터무사2루승부치기,20회마다청크저장후이어감(20/24). 실제 KBO 규정이라고 표시하지 않는다.

## 5. 경기와 기록 계약

한 타석은 BB/HBP/K/1B/2B/3B/HR/인플레이아웃 중 하나. v1은 실책·희생번트·희생플라이·고의사구·주자견제·도루를 제외하고 화면에 단순화 안내. 파워는 장타 분포, 컨택은 K/안타, 선구는 BB, 주력은 추가 진루, 수비는 인플레이 안타 확률에 관여한다.

기준 결과 가중치: BB .085 / HBP .010 / K .200 / 1B .160 / 2B .045 / 3B .005 / HR .030 / OUT .465. 타자/투수 차이를 중심 50에서 정규화한 뒤 로짓 가중치에 반영하고 softmax로 확률 합 1을 유지한다. 세부 회귀 계수는 캘리브레이션 항목이며 구현 전 엔진 수식 부록으로 확정해야 한다. 수치 미확정 상태를 완성 엔진 사양이라고 간주하지 않는다.

진루 기본: BB/HBP는 밀어내기만. 1B는 각 주자 한 베이스, 2루 주자는 주력60 이상이고 2아웃이면 홈 시도 성공확률 70%; 실패하면 주루아웃. 2B는 각 주자 두 베이스, 1루 주자는 주력60 이상이고 2아웃이면 동일 홈 시도. 3B는 모든 주자 득점, HR은 타자 포함 득점. OUT은 주자 정지; 병살은 주자1루·2아웃 전 상태에서 인플레이아웃의 20%로 시도, 수비/주력 보정 후 확률 제한 5~35%. 병살 3아웃이면 같은 플레이 득점 없음. 끝내기 HR은 모두 득점, 다른 끝내기는 승리 확정에 필요한 득점까지만 계산.

투구 수는 타석결과별 평균+seed 변동으로 추정. SP 90구 또는 피로80부터 교체 검토, 110구 강제 교체. RP/CP는 30구/2이닝 상한. 최소 투수 1명은 남겨야 하며 투수 고갈 시 마지막 투수를 유지하고 능력 페널티를 적용해 종료 가능하게 한다. 승리투수는 선발5이닝 조건과 리드 유지, 구원은 마지막 리드 획득 직전 투수를 기본 적용. 세이브/홀드/승계주자·자책점 귀속은 별도 상세 부록을 완료하기 전 구현 금지 항목이다.

AB=PA-BB-HBP, AVG=H/AB, OBP=(H+BB+HBP)/PA, SLG=TB/AB, OPS=OBP+SLG. 이 단순 엔진에는 희생타가 없다. ERA=ER×27/outs, WHIP=(BB+H)×3/outs, K9=K×27/outs. 이닝 표시는 outs/3 몫과 나머지(예: 5.2), 소수 5.2를 산술에 사용하지 않는다. PS와 정규시즌 기록 분리. WAR은 검증된 산식 없이 임의 표시하지 않는다.

## 6. 돈·계약·은퇴

모든 돈은 원 단위 정수, 화면은 만원/억원. 개인 연봉은 소비 자원 없이 커리어 성취 기록으로 사용. 신인 최소 연봉 기본 3천만원. 실제 최저연봉이라고 표시하지 않는다. 구단 예산은 별도 문서.

비FA는 1년 재계약. 제안 연봉=전년 연봉과 역할·출장·성적 지표에서 계산하고 최소3천만/최대30억 제한. FA는 1군 등록 8시즌(시즌당 100등록경기 충족) 후 자격, 1~4년 제안. 현실 제도와 다름. 등록은 부상자 명단 포함 여부를 v1에서 포함으로 명시한다. 2군 시즌은 누적하지 않는다. 제안은 확정 seed로 한 번 생성하고 새로고침으로 바뀌지 않는다.

수동 은퇴는 프로 첫 시즌 종료 이후 오프시즌에 가능. 강제 은퇴 검토는 35세 이상·2시즌 연속 1군50타석/20이닝 미달이면 재도전 이벤트 후 실패 시 은퇴. 45세 시즌 종료 시 최종 은퇴. 정확히 41세 일괄 은퇴시키지 않는다. 계약 중 은퇴는 경고 후 남은 개인 계약 종료, 구단 비용은 지급 보장액 규칙을 따른다. 보관은 은퇴 결과와 같은 트랜잭션에서 확정.

## 7. 가져온 선수

능력별커리어영구최고값의50%로19세복사본생성. 일시modifier는최고값제외. 잠재력은min(100,max(최고값,원잠재력)+고정seed5~10). 병역/기록/부상/피로/계약/연차초기화,원본불변. 42의공통정책적용. 같은 원본은 세이브당 한 명, 다른 원본의 동명이인은 허용.


경기최신수식: [41 여섯능력엔진](41-SIX-STAT-ENGINE.md). 위기관리대칭보정·체력/교체·역할평가를구체화하며구전술logit가산을폐기한다.

---

<!-- SOURCE: 02-FLOWS.md -->

최신 가져오기 규칙: [사용자 결정32](32-USER-IMPORT-REBIRTH.md). 아래의 능력치 그대로/기존잠재력·병역혜택 계승 제안은 폐기되며, 능력별 최고50%·상향잠재력·병역재시작으로 읽고 관련 기대값을 교체한다.

# 02. 상세 진행과 상태 전이

모든 '확정'은 서버 성공 후 화면 전환한다. 뒤로 가기는 조회 화면을 닫으며 확정된 명령을 되돌리지 않는다. 원치 않는 은퇴/방출/복원만 확인창을 사용하고 일상 진행마다 확인하지 않는다.

## 공통 진입

실행 → 세션 복원 → 내 세이브 목록. 세션 없음: 로그인과 '게임 소개' 표시. 인증 오류: 재로그인 후 원래 화면 복귀. 네트워크 없음: 마지막 읽은 상태와 '오프라인·진행 불가' 표시. 로컬 사본을 클라우드 원본으로 자동 승격하지 않는다.

처음 사용자: 두 카드 '선수로 살기'/'구단 운영하기'. 설명은 각각 '고교부터 은퇴까지 내 선수의 일대기', '가상 선수단으로 나만의 시즌 운영'. 선수 보관함이 비어도 구단 시작 가능. 최근 플레이 있으면 최근 세이브 이어하기를 상단에 추가하고 새 게임 두 카드는 유지.

## 커리어 상태 전이표

| 상태 | 표시/허용 행동 | 성공 후 | 거절 조건 |
| --- | --- | --- | --- |
| DRAFT_FORM | 생성 6단계, 미리보기 | HS_PRE | 유효하지 않은 이름/포지션 |
| HS_PRE | 유형 요약, 집중 능력 정확히4개 | HS_PLAY | 집중 능력 4개미만/초과/중복 |
| HS_PLAY | 고교 시즌 진행, 중간 이벤트 | HS_RESULT | 미해결 이벤트 |
| HS_RESULT | 성적, 스카우트 평가, 드래프트 참가 | DRAFT_RESULT | 시즌 미완료 |
| DRAFT_RESULT | 지명 구단/라운드/계약, 수락 | PRO_PRE | 이미 수락 |
| UNDRAFTED | 재도전 경로/야구 마무리 | RETRY_PRE 또는 RETIRED | 대상 경로 미지원 |
| RETRY_PRE/PLAY | 1년 훈련리그, 집중 선택/진행 | RETRY_RESULT | 재도전 횟수 초과 |
| RETRY_RESULT | 계약 제안 수락/종료 | PRO_PRE 또는 RETIRED | 제안 만료 |
| PRO_PRE | 계약/소속, 집중 선택, 역할 희망 | PRO_PLAY | 계약 미확정 |
| PRO_PLAY | 다음 구간 진행, 이벤트 응답 | PRO_RESULT | 이벤트 대기/처리중 |
| PRO_RESULT | 시즌 성적·성장·순위, 다음 | POSTSEASON 또는 OFFSEASON | 잔여 정규경기 |
| POSTSEASON | 다음 시리즈/요약 | OFFSEASON | 시리즈 미완료 |
| OFFSEASON | 수상, 계약·진로 이벤트 | CONTRACT 또는 RETIRED | 미해결 의무 이벤트 |
| CONTRACT | 제안 비교·선택, 재도전/은퇴 | PRO_PRE 또는 RETRY_PRE/RETIRED | 부족한 조건/오래된 제안 |
| RETIRED | 은퇴 이유·기록·보관 결과 | ARCHIVED | 보관 실패 시 같은 명령 재조회 |
| ARCHIVED | 보관함 열기, 새 커리어, 홈 | 조회만 | 진행 명령 모두 금지 |

재도전은66의최대3준비시즌기본안. 대학/복무기간불소모,실제오퍼·권리·나이조건에따라여러경로재검토하고남은경로없으면조기은퇴보관. 대학진학/복학은43및66의입학나이계약.

## 시즌 진행 버튼의 정확한 동작

최신 사용자 결정31에 따라 기본 CTA는 '다음 달까지', 보조 CTA는 '시즌 빠른 진행'이다. 아래의 기존 구간 길이는 엔진 내부 체크포인트 제안이며 기본 사용자 진행 단위가 아니다. 프리시즌이면 시작 확인 요약, 시즌중이면 다음 체크포인트(최대 24팀경기) 또는 가장 먼저 발생한 의무 이벤트까지 진행. 내부 요청은 최대 6팀경기로 분할하고 각 청크를 저장. UI 진행률은 시뮬레이션 완료 팀경기/144로 표시하며 연출 애니메이션을 진짜 진행으로 오해하지 않게 한다.

처리중 입력 차단. 사용자가 멈추기를 누르면 현재 청크 커밋 후 멈춤. 앱을 닫으면 최근 커밋에서 이어간다. 응답 유실 시 같은 commandId 재조회. 애니메이션 생략은 연출만 빠르게 하고 난수를 다시 돌리지 않는다. 이벤트는 서술·선택지·효과 종류·위험·확정 버튼. 하나 선택 후 다른 것을 다시 고를 수 없다.

시즌 결과는 ① 핵심 성적 ② 능력치 증감 ③ 팀 결과 ④ 주요 사건 ⑤ 다음 행동 순서. 성장/노쇠 합산과 전후 능력치를 함께 제공. PS 대상이 아닌 선수는 리그 PS 결과를 자동 요약하되 본인 기록을 생성하지 않는다.

## 계약과 은퇴

제안 카드에 기간/연봉/총액/기대 역할/경쟁 정도 표시. '계약하기'는 선택 구단과 기간을 한 번 확인 후 확정. 이미 계약한 제안을 다시 적용하지 않는다. 경쟁 정도는 출장 보장과 구별. 제안 거절 시 남은 제안 목록을 보여주고 모두 거절 전 재도전 또는 은퇴 결과를 확인한다.

은퇴 확인에는 '이 커리어는 종료되며 선수는 보관함에 남습니다'와 저장 능력치 표시. 은퇴 처리와 archived_players 생성은 같은 트랜잭션. 성공 화면은 41세 등 실제 종료 나이를 표시하며 19세 복사본은 구단에서 가져올 때만 생성한다.

## 보관함 → 구단 가져오기

신규 구단 설정에서 '내 선수 사용' 기본 OFF. ON이면 보관함 선택 화면. 타자/투수/포지션 필터, 이름 검색, 능력치/종료연도 정렬. 각 카드에 원본 나이와 '투입 시 19세'를 같이 표시. 상세에는 '기록과병역은새출발,능력별커리어최고의절반으로재육성' 안내.

최대 선택은 활성 로스터 한도와 포지션 제약 내에서 28명. 0명 선택도 생성 가능. 선택 인원과 중복/포지션 부족을 요약. 각 선수 대체 후보를 미리 보고 변경 가능. 구단 생성 전 취소하면 아무 것도 바뀌지 않는다. 생성은 새 세이브/선수 복사/원본 연결을 한 트랜잭션에서 수행. 이미 생성된 구단에 중도 투입은 v1 제외.

## 저장 관리

세이브 카드: 모드·선수/구단명·시즌·진행단계·마지막 저장. 이름 수정은 세이브 표시명만 변경. 보관 선수의 이름/성적 편집 없음. 삭제는 대상 이름과 '보관 선수는 유지' 안내, 취소 기본 포커스. 백업 목록은 생성시각·revision·준비/실패 상태. 복원은 새 세이브 생성으로 작동.

## 모든 화면의 공통 예외

| 상황 | 사용자 문구 | 가능한 행동 |
| --- | --- | --- |
| 401 | 다시 로그인하면 이어갈 수 있어요 | 로그인, 홈 |
| 403/404 | 이 저장 데이터를 열 수 없어요 | 내 세이브 목록 |
| 409 | 다른 기기에서 진행한 내용이 있어요 | 최신 상태 불러오기 |
| 422 | 선택 조건을 확인해 주세요 | 문제 필드로 이동 |
| 429 | 잠시 후 다시 진행해 주세요 | Retry-After 후 재시도 |
| 네트워크 유실 | 저장 결과를 확인하고 있어요 | 같은 명령 확인, 중복 실행 금지 |
| 서버 실패 | 진행 내용을 확인하지 못했어요 | 같은 명령 재시도, 저장 목록 |
| 저장 버전 높음 | 앱 업데이트가 필요해요 | 업데이트 안내, 읽기 가능한 요약 |
| 보관함 비어 있음 | 아직 보관한 선수가 없어요 | 커리어 시작, 가상 선수로 구단 시작 |
| 파일 백업 실패 | 게임은 저장됐지만 백업 생성에 실패했어요 | 백업만 재시도 |

로그아웃은 저장 중 명령 확인 후 처리하고 비밀 토큰/로컬 사용자 캐시를 정리한다. Android 뒤로 가기는 모달 닫기 → 상세 닫기 → 모드 홈 → 종료 순서. 종료 때문에 서버 커밋을 되돌리지 않는다.


2026-10-19 사용자필수:웹·APK중단후이어하기. [76 이어하기계약](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의홈최근게임/서버resumeDescriptor/송신전저널/receipt재조회/경기·선택·작업복원과12검수시나리오를적용한다. 서버확정진행은종료이벤트와무관히보존,미송신초안은별도기기선호다. 미리보기/확정의복구는[74](74-PREVIEW-COMMAND-RECONCILIATION.md).

---

<!-- SOURCE: 03-UX-DESIGN.md -->

# 03. 화면과 시각 디자인

디자인 제안: '야구 기록실'. 밝은 종이색 배경, 짙은 남색 타이틀, 녹색 진행 버튼, 넓은 성적 숫자와 얇은 표선. 참고 게임의 로고/아트/문구를 복제하지 않는다. 본 문서는 시각 사양이며 실제 렌더링 검증은 미완료.

## 토큰

배경 #F4F6F8, 카드 #FFFFFF, 본문 #172B4D, 보조글 #526477, 선 #DCE3EB, 진행 #146C43, 강조 #B4540B, 위험 #B42318. 상승/하락은 색만 쓰지 않고 +/−와 화살표 병행. 구단 색은 카드 왼쪽 표식과 유니폼 실루엣에만 제한해 본문 대비를 보장한다.

서체는제목검은고딕/본문Noto Sans KR,실패시시스템한글sans-serif. 배포 시 폰트 라이선스가 확인된 파일만 포함. 본문16px/1.5, 보조14px, 화면제목24px/700, 주요숫자32px/700. 숫자는 tabular-nums. 간격4/8/12/16/24/32px, 카드 모서리12px, 버튼10px. 버튼 최소높이48px, 터치영역 최소44px, 아이콘 단독 버튼은 aria-label.

360~767px: 좌우16px, 단일열, 하단 탐색+고정 CTA. 768~1199px: 좌우24px, 주요2열. 1200px 이상: 최대1200px 중앙, 왼쪽 탐색200px + 본문. 표는 가로 스크롤 가능하되 이름열 고정. 모바일에서 기록 숫자를 임의 생략하지 않고 기본열/전체기록 전환 제공.

하단 탐색은 모드에 따라 4항목. 커리어: 홈/기록/리그/보관함. 구단: 구단/선수단/리그/운영. 공통 상단 홈 아이콘으로 모드 선택. 저장 상태는 오른쪽에 '저장됨 14:32', 처리중 '저장 중'. 메뉴를 바꿔도 모드와 세이브가 유지된다.

## 공통 컴포넌트

PlayerHeader(이름·나이·구단·역할), AbilityGrid(값·전후차·설명), StatRow, SeasonTimeline, TeamBadge(텍스트/직접 제작 실루엣), ChoiceCard(선택/효과/위험), EventPanel, SaveStatus, PrimaryAction, EmptyState, ErrorBanner, ConfirmDialog, AccessibleTabs, ResponsiveTable, ProgressStrip.

ChoiceCard 클릭은 선택만 하고 하단 '이 선택으로 진행'이 확정한다. 키보드 방향키/Space로 선택, Enter로 확정. 모달은 열기 전 포커스 기억, 내부 포커스 순환, Escape 닫기 가능(진행 중 저장 결과 확인창은 이탈 안내). 토스트만으로 핵심 오류를 전달하지 않는다.

## 화면별 설계

| ID | 화면/구조 | 주 행동 | 부 행동/빈 상태 |
| --- | --- | --- | --- |
| S01 | 모드 선택: 소개→최근 세이브→커리어/구단 카드 | 이어하기 또는 새 모드 | 모든 저장, 설정 |
| S02 | 생성: 단계표→입력→유형 프리뷰→확인 | 다음/선수 생성 | 이전, 취소. 입력 유지 |
| S03 | 커리어 홈: 선수헤더→시즌단계→핵심기록→능력치→타임라인 | 다음 이야기 | 집중 선택, 기록 상세 |
| S04 | 고교 결산: 스카우트 평가→성적→전후능력치 | 드래프트 참가 | 고교 기록 |
| S05 | 드래프트: 라운드·구단명→역할전망→계약 | 입단 | 미지명은 재도전/마무리 |
| S06 | 이벤트: 시점→제목→본문→선택카드→예상영향 | 선택 확정 | 능력치/규칙 도움말 |
| S07 | 시즌 결산: 올해/통산 탭→성적→증감→팀결과→사건 | 다음 단계 | 경기 목록 |
| S08 | 계약: 제안 카드 비교→조건 설명 | 선택 구단 계약 | 재도전/은퇴 |
| S09 | 은퇴: 종료사유→대표기록→연도표→보관완료 | 보관함 열기 | 새 커리어, 홈 |
| S10 | 보관함: 검색/필터→선수카드 | 선수 상세 | 비어있으면 커리어 시작 |
| S11 | 보관 상세: 능력치→원본 기록→투입 안내 | 새 구단에 사용 | 원본 출처 보기 |
| S12 | 구단 생성: 구단→내 선수OFF/ON→대체 미리보기 | 구단 만들기 | 0명 허용, 취소 |
| S13 | 구단 홈: 순위·예산→다음상대→최근결과→할일 | 다음 경기/일주일 | 라인업, 운영 |
| S14 | 로스터: 1군/2군/부상 탭→필터→선수표 | 기용/이동 | 포지션 부족 안내 |
| S15 | 라인업: 타순9칸+수비배치 / 투수역할 | 적용 | 자동 편성, 되돌리기(미확정만) |
| S16 | 선수 상세: 능력치·계약·시즌/통산·출처 탭 | 모드별 기용/계약 | 원본은 읽기만 |
| S17 | 시장: FA/방출후보→조건비교 | 계약 제안 | 예산 부족 이유 |
| S18 | 리그: 순위/일정/개인기록/PS | 경기 상세 | 아직 경기없음 |
| S19 | 경기: 점수판→타자표→투수표→주요사건 | 홈 복귀 | 이전/다음 경기 |
| S20 | 저장: 목록→백업→복원 | 백업/새 세이브 복원 | 준비중/실패 배지 |
| S21 | 설정: 애니메이션/글자크기/소리 | 자동 저장 | 로그아웃 |

## 모바일 와이어프레임 — 커리어 홈

```text
┌──────────────────────────────────┐
│ ‹ 내 게임              저장됨    │
│ 김도윤  23세  /  서울 구단        │
│ 유격수 · 1군 · 프로 5년차         │
├──────────────────────────────────┤
│ 2031 시즌  72 / 144 경기          │
│ ━━━━━━━━━━━━━────────────         │
│ AVG .302   HR 12   OPS .861       │
├──────────────────────────────────┤
│ 올해의 육성   컨택 / 수비         │
│ 컨택 72 ↑2   파워 64   수비 81 ↑1 │
├──────────────────────────────────┤
│ 최근 이야기                      │
│ 6월 · 첫 올스타 후보에 올랐다     │
│ 5월 · 주전 경쟁에서 기회를 얻었다 │
├──────────────────────────────────┤
│ [        다음 이야기        ]    │
│ 다음 선택 또는 시즌 구간까지     │
│ 홈       기록      리그    보관함 │
└──────────────────────────────────┘
```

구단 홈은 같은 틀에서 선수헤더 대신 구단명·순위·승패, 핵심 숫자는 게임차/잔여예산/부상자, CTA는 '1경기'와 '1주일'. 이벤트 화면은 기록 영역을 선택카드로 교체하고 의무 이벤트가 없을 때 홈을 가리지 않는다.

## 상세 인터랙션

능력치 터치: 현재/지난시즌/집중효과/피로 영향을 설명하는 바텀시트. 기록열 제목: 산식 도움말. 선수 이름: 선수 상세. 구단명: 해당 팀 로스터. 시즌 타임라인: 사건 결과 읽기 전용. 경기결과 카드: 박스스코어. 기록 정렬은 한 번 오름·두 번 내림, 동률은 선수ID로 안정 정렬.

라인업 모바일은 드래그만 제공하지 않는다. 슬롯 선택 → 선수 목록 → 적용 방식이 기본, 드래그는 보조. 빈 포지션은 붉은 글자+아이콘+오류 사유. 화면 하단 고정 버튼은 safe-area와 가상키보드를 고려하며 표 마지막 행을 가리지 않는다.

## 접근성·연출

텍스트 대비 목표 WCAG AA, 포커스 테두리 2px, 200% 확대에서도 주요 입력 사용 가능. 모션 감소 설정에서는 숫자 카운팅과 카드 이동 제거. 사운드는 기본 OFF. 주요 결과는 한 번에 읽을 수 있고 자동 넘김하지 않는다. 선수 초상화 없이도 전체 플레이 가능하도록 이니셜·포지션 실루엣 사용. 대성공/실패 문구는 능력 변화량과 함께 표시해 서사와 결과가 어긋나지 않게 한다.

## 시각 검증 전 미완료 항목

실제 360/390/768/1280px 렌더링, 한글 줄바꿈, 긴 구단/선수명, 표 100행, 큰 글자, 대비 측정, 안드로이드 하단바 겹침 검증은 목업 단계에서 증명해야 한다. 이 문서만으로 픽셀 검증 완료라고 표시하지 않는다.

## Typography v3 (2026-10-16)

제목/메인카피: Black Han Sans(검은고딕) Regular. 본문/버튼/표: Noto Sans KR Variable, 본문400·강조700. 주요기록숫자: Windows Bahnschrift 우선, 없으면 Noto Sans KR. 시스템에 서체를 설치하지 않고 assets/fonts의 파일을 @font-face로 불러온다. 공식 Google Fonts 저장소에서 받은 원본과 OFL을 함께 보관한다. 이 원본 TTF는 디자인 검토용이며 배포 전 WOFF2/서브셋 용량 최적화가 필요하다. 렌더링 검증은 별도다.

---

<!-- SOURCE: 04-EVENTS.md -->

# 04. 이벤트 발생 목록 — 최신99종

상세문안은[전체문안](EVENT-CATALOG.md),발생/기술계약은45/55/66~73의최신분야문서를따른다.

|ID|사건|발생|
|---|---|---|
|E01|마지막 고교의 겨울|HS_PRE, 고유|
|E02|타격 자세의 갈림길|고교 타자, 12경기|
|E03|마운드의 과제|고교 투수, 12경기|
|E04|스카우트의 질문|HS_RESULT|
|E05|지명을 기다리는 날|DRAFT_RESULT|
|E06|이름이 불리지 않았다|UNDRAFTED|
|E07|다시 받은 기회|RETRY_RESULT, 제안 존재|
|E08|프로의 첫 캠프|첫 PRO_PRE|
|E09|첫 1군 호출|FUTURES, 자리 존재, 경쟁점수 충족|
|E10|짧은 기회의 무게|첫 콜업 후20경기|
|E11|두 번째 숙제|2군 한 시즌 종료|
|E12|주전과 백업 사이|1군 타자, 출장비율<40%|
|E13|낯선 수비 자리|E12 START_POSITION_PLAN 확정 후 계획24경기 완료|
|E14|선발의 문|RP, 체력≥60, SP 공석|
|E15|마지막 아웃의 자리|RP, 위기≥60, CP 공석|
|E16|구속보다 안정|투수, BB9>4.5, 20이닝 이후|
|E17|긴 무안타|타자, 최근20AB H=0|
|E18|장타가 필요한 때|타자, 100AB HR≤1|
|E19|흔들린 두 경기|SP, 최근2등판 ER≥10|
|E20|코치의 조언|최근20경기성적지수≤40,일반조언쿨다운충족|
|E21|작은 통증|부상 판정 경미 시|
|E22|긴 재활|부상 중간/중대 시|
|E23|돌아온 그라운드|부상 회복 직후|
|E24|처음 받은 박수|첫100H 또는 첫10승/20SV|
|E25|올스타의 초대|시즌중 성적 상위, 고유 시즌|
|E26|라이벌의 등장|동포지션 경쟁점수±5|
|E27|포스트시즌의 긴장|첫PS|
|E28|우승 뒤의 겨울|팀 우승, OFFSEASON|
|E29|첫 개인상|첫 수상|
|E30|재계약 제안|비FA CONTRACT|
|E31|FA 시장의 문|자격 충족 CONTRACT|
|E32|익숙한 유니폼|FA 원구단/타구단 제안 존재|
|E33|베테랑의 역할|나이≥33, 백업 전환|
|E34|전력 외 통보|계약 미보유, 팀 후보 제외|
|E35|마지막 테스트 결과|준비시즌3회소진/유효오퍼0/대학복학등다른합법진로0|
|E36|떠날 시기를 고르다|수동 은퇴 가능 OFFSEASON|
|E37|마지막 인사|RETIRED|
|E38|장기집권의 부담|구단 3연패, CLB_REVIEW|
|E39|기회를 원하는 유망주|구단2군,22세이하,경쟁점수상위|
|E40|한정된 겨울 예산|구단 오프시즌, 예산<예정연봉|
|E41|새 시즌의 유형|프리시즌 또는 정규일정 절반,유형변경기회남음|
|E42|다른 이름의 선수|결산별칭변화. '이번 시즌의 변화가 선수의 인상을 바꿨습니다.'|
|E43|한 번의 특별훈련|정규일정1/3경기해금,세계시즌usage=0|
|E44|국가의 부름|최종후보. '대표팀이 합류 의사를 물었습니다.'|
|E45|대표팀 밖에서|선발탈락. '이번 명단에는 이름이 없었습니다.'|
|E46|첫 국제무대|대회첫실제출장. '유니폼 앞의 이름이 달라졌습니다.'|
|E47|메달과 다음 의무|올림픽메달/AG금+게임자격충족|
|E48|돌아오는 비행기|대회종료. '팀의 결과와 내 경기를 돌아봅니다.'|
|E49|겨울의 병역계획|미해결오프시즌. '다가올 시즌과 복무 계획을 함께 생각합니다.'|
|E50|상무 선발 발표|지원1회확정. '지원 결과가 도착했습니다.'|
|E51|잠시 내려놓는 배트|현역복무시작. '원구단을 떠나 복무를 시작합니다.'|
|E52|부대의 그라운드|상무첫블록. '군 체육팀에서 야구와 복무를 이어갑니다.'|
|E53|다시 받는 유니폼|18개월완료. '복무를 마치고 원구단으로 돌아왔습니다.'|
|E54|남은 마지막 겨울|27세미해결. '게임 규칙상 다음 시즌 전에는 복무 계획을 확정해야 합니다.'|
|E55|계속되는 활동의무|ATHLETE_SERVICE오프시즌. '선수 활동과 함께 이행할 의무를 확인합니다.'|
|E56|졸업 뒤 다음 무대|고교졸업진로상태,미국카드는능력과유효오퍼조건부|
|E57|바다 건너의 계약서|'첫 시작은 메이저 무대보다 작은 구장일 수 있습니다.'|
|E58|낯선 클럽하우스|'언어도 준비도 낯설지만 오늘의 훈련은 시작됩니다.'|
|E59|다음 레벨의 문|승격조건충족. '한 단계 높은 팀에서 기회를 받았습니다.'|
|E60|메이저리그의 전화|'구단이 메이저리그 합류를 알렸습니다.'|
|E61|다시 내려가는 길|강등확정조건. '상위 명단에 남지 못했습니다.'|
|E62|포스팅을 요청하다|'국내에서 쌓은 시간 뒤에 새로운 무대를 생각합니다.'|
|E63|구단의 대답|'원구단이 요청에 답했습니다.'|
|E64|협상의 끝|'제안과 남은 시간을 함께 봅니다.'|
|E65|처음 선 빅리그|실제첫출장. '명단의 이름이 경기 기록의 이름이 됐습니다.'|
|E66|미국에서 맞는 FA|'새 팀과 새로운 역할을 고를 수 있게 됐습니다.'|
|E67|돌아갈 그라운드|'다시 국내에서 뛰는 길을 확인합니다.'|
|E68|기다림도 커리어|'복귀를 준비하는 시간이 지나갑니다.'|
|E69|두 리그의 마지막 인사|'어느 리그의 기록도 다른 기록을 지우지 않습니다.'|
|E70|졸업 뒤의 캠퍼스|고교졸업/대학진학검토|
|E71|대학의 첫 유니폼|대학입학확정후1회|
|E72|대학선수권의 초대|대학정규상위4확정|
|E73|두 번째 봄 다음의 선택|2학년시즌결산/조기지명미시도|
|E74|다시 학교 그라운드로|조기미지명/미계약복학가능|
|E75|졸업과 다음 무대|4학년결산|
|E76|미뤄 둔 학년|휴학중복무완료|
|E77|새로운 관찰 보고서|탐색명령성공receipt|
|E78|이번 탐색의 빈자리|탐색명령실패receipt|
|E79|제안서를 보내기 전에|구단제안초안확인|
|E80|협상 라운드의 마감|제안라운드결과receipt|
|E81|그라운드를 지키는 예산|재정재건필요|
|E82|다시 시작하는 선수|보관복사생성미리보기|
|E83|숨겨진 난이도의 약속|해금후치트카드를직접선택한뒤|
|E84|나만의 무기를 얻다|특성해금조건충족receipt|
|E85|쌓아 온 나만의 무기|보유특성정보조회또는새특성해금요약|
|E86|새로운 공의 연습|프리시즌새구종학습가능|
|E87|손끝에 익은 구종|구종XP등급기준통과receipt|
|E88|타구를 만드는 접근|성향변경창/타자|
|E89|이번 시즌의 약속|프리시즌목표선택가능|
|E90|숫자 너머의 한 걸음|목표달성기록receipt|
|E91|함께 볼 계약서|프로계약후에이전트선택가능|
|E92|한 번의 역제안|유효오퍼/미사용재협상횟수|
|E93|내 역할을 묻다|20팀경기검토창/출장가능|
|E94|같은 출발선의 이름|고교관계선수고정생성|
|E95|다시 마주한 유니폼|라이벌관계단계변경후첫실제대진|
|E96|이번에는 같은 편|라이벌또는동료실제같은팀등록|
|E97|그라운드 곁의 두 번째 삶|은퇴원본지도자고용미리보기|
|E98|한 타석씩 남길 경기|중요경기직전/중계알림ON|
|E99|한 장에 남긴 시간|새연대기장면확정receipt|

---

<!-- SOURCE: 05-CLUB.md -->

최신 생성 입력은 [79](79-CREATION-FIELDS-VALIDATION-COPY.md)를 따릅니다. 생성 전 실제 가상 로스터/개인 잠재력 추첨 미리보기 초안은 폐기하고 구성 기준을 표시합니다. 실제 선수단은78의 단일 생성 작업에서 확정합니다. 숨김 치트 해금은 클릭 증명을 요구하는 서버 권한이 아닌 발견용 UI입니다.

최신 가져오기 규칙: [사용자 결정32](32-USER-IMPORT-REBIRTH.md). 아래의 능력치 그대로/기존잠재력·병역혜택 계승 제안은 폐기되며, 능력별 최고50%·상향잠재력·병역재시작으로 읽고 관련 기대값을 교체한다.

# 05. 독립 구단 운영

## 새 구단 게임

실제 구단명 선택 → 시작 연도(기본2027, 현실 일정과 무관) → 가상 선수단 미리보기 → 내 선수 사용 OFF/ON → 난이도 기본(동일예산) → 생성. 전체 리그를 seed로 생성하고 특정 구단만 유리한 선수분포를 주지 않는다. 내 선수 없이도 모든 메뉴와 엔딩을 이용할 수 있다.

구단별 50명: 투수24/야수26. 1군28명은 투수13/야수15 기본, 전체1군 투수 최소10/최대15. 야수는 C2명, 내야4자리 각1, 외야3자리 각1, DH 또는 대체타자1명 확보. 2군은 나머지. 부상자가 생기면 대체 콜업 추천을 제공하고 자동편성 허용. 구단 전체 선수 최소35/최대60, 자유계약 선수 풀 최소80명을 리그 공용으로 유지.

생성 나이19~38:19~22 20%,23~27 35%,28~32 30%,33~38 15%. 능력 OVR 분포35~85, 중심55; 소수 스타가 존재하지만 구단별 상위5명 합산편차10%이내를 생성검사 목표로 한다. 난수 재추첨 버튼을 제공하지 않고 미리보기에서 확정 전 seed를 저장한다.

## 가져오기와 대체

원본 능력별커리어최고50%,19세,프로0년,신규 기록. 각 선수에 동일 포지션 대체후보를 제시한다. 투수는 투수끼리, 야수는 적합 수비 슬롯을 보존하는 후보끼리 교체. 후보가 없으면 같은 분류의 전체 최저 경쟁점수 선수 중 슬롯 조건 유지 후보를 찾는다. 불가능하면 원인을 보여주고 선택 축소를 요구한다. 최대28명이어도 투수/포수/수비 구성이 불가능하면 생성 불가.

대체 선수는 FA 풀로 이동하고 연결 해제, 이전 소속 기록은 출처로만 유지. 가져온 선수의 첫 계약은 1년·최소연봉으로 명시한다. 강력한 보관 선수를 쓰면 쉬워질 수 있음을 설정 화면에 안내하되 시작능력은최고50%이고추가하향은없다. 리그는 개인 플레이용이며 공개 랭킹과 비교하지 않는다.

## 라인업과 기용

타순9명, 수비8자리+DH. 중복선수 금지, 부상선수 금지, 좌투 제한 및 적합도 검사. 비주포지션은 적합도0~100에 따라 수비능력에0.5~1.0 배율, UI에 벌점 표시. 자동편성은 출루가 높은 1·2번, 장타중심3·4·5번, 이후 공격점수순; 수비슬롯 최소조건 먼저 충족.

선발5명 순환, 불펜 역할 CP1/SU2/MR4/LR1 기본. 등판 간 휴식과 피로 반영. 수동 CP 부상이면 대체 추천, 자동모드면 위기/구위/피로 순으로 선택. 매 경기 전 유효성 검증. 오류가 있으면 진행 대신 해당 슬롯으로 이동. 자동편성은 적용 전 변경목록 보여주며 기존 프리셋을 저장할 수 있다.

## 진행 단위

1경기/1주일(달력7일)/다음 중요시점. 기본 CTA1경기, 빠른진행1주일. 부상·로스터부족·계약만료·내 선수 중요사건에서 자동 중지. 무관한 타팀 일반 사건은 뉴스로만 기록. 최대 청크1경기일(리그5경기) 후 저장. 다른 구단의 동일 날짜 경기도 함께 확정해 일정과 순위가 뒤처지지 않게 한다.

## 예산·계약

독자 게임 경제: 연간 운영예산120억원, 연봉계약 총액에 당해 연도분을 예약. 관중/티켓수입은v1제외,스카우트시설과탐색비용은40/44적용. 잔여예산=연간예산-활성계약 당해연봉-방출지급보장액. 음수 계약 금지. 신인/가져온선수도 총액에 포함. 모든 AI 구단도 동일 제약.

1년~4년 계약, 보장연봉, 옵션 없음. 방출해도 당해 잔여연봉100% 지급 의무 유지. 다년 잔여 지급은 다음 연도 예산에 보장액으로 예약한다. 은퇴한 구단선수도 보장계약은 유지하는 단순 정책으로 안내. 선수 부족인데 예산이 없으면 최저연봉 긴급선수1명에 한해 예산 대출이 아니라 기존가용예산 필요: 새 시즌 예산부터 최소로스터분을 보호예산으로 분리해 이 상황을 방지한다. 보호예산은35명 미달 시에만 사용한다.

FA 목록은 포지션/나이/OVR/희망연봉/희망기간/원소속 표시. 제안은 한 경기일/오프시즌 한 라운드 후 결과. 사용자 제안 후 AI도 평가하며 최대연봉만이 유일한 요소는 아니다: 총보장액70%, 역할전망20%, 선호10%. 동일 seed로 결과 재현. 제안 시 예산 예약, 실패/철회 시 해제. 중복 계약은 리그 트랜잭션에서 금지.

## 드래프트·오프시즌

구단 오프시즌 상태: 시즌결산→수상→은퇴/방출 검토→보류선수 재계약→FA 3라운드→신인드래프트→로스터 검증→스프링캠프→다음시즌. 신규 선수100명 생성, 전년 역순10라운드, 라운드마다 같은 순서. 사용자 차례에서 포지션·나이·현재/전망을 비교해 선택 또는 자동지명. 기본 신인계약1년 최소연봉. 최대60명 초과하면 자동지명하지 않고 방출/보류선택으로 이동. 드래프트 지명권 매매와 보상선수는 제외.

AI는 역할공백 보완→재계약→FA→드래프트 순으로 운영. 사용자만 연봉제약을 지키게 하지 않는다. 팀 강약과 선수 가치는 시즌마다 재평가하지만 완전히 새로 재생성하지 않는다.

## 장기 플레이와 종료

구단은 우승해도 종료하지 않고 계속 운영. 사용자가 '운영 마무리'를 누르면 시즌 종료 뒤 명예기록 요약으로 보관하고 읽기 전용. 그 구단의 가상 선수를 자동으로 개인 선수 보관함에 넣지 않는다. 현재는 개인 커리어 종료 선수만 보관 대상.

구단 모드에서 선수 계약·기용 결과가 원본 개인 커리어에 역반영되지 않는다. 구단 세이브 복원/복제는 새 saveId를 사용하고 선수출처를 유지한다. 이로 인해 서로 다른 게임에 같은 원본이 존재하는 것은 허용한다.

---

<!-- SOURCE: 06-TECH.md -->

최신 확정(2026-10-19): [125](125-EVENT-CHOICE-DISPATCH.md) 아래 ‘허용 type’ 목록은 초기 목록이다. 사건 선택지 명령은 RESOLVE_EVENT 안에서 125의 분류로 처리하고 화면 명령은 77/screen-action-bindings.json을 따른다.

# 06. 데이터·서버·운영 계약

## 아키텍처 결정

TypeScript 단일 저장소, React/Vite 공통 웹UI, Capacitor Android, Hono Node API, pg pool + Drizzle, Neon PostgreSQL, private 객체 버킷. 이 선택은 설계 기본안이며 실제 의존성 설치/앱 생성은 하지 않는다. API 호스트를 결정한 뒤 런타임/드라이버를 최종 점검한다. Node 장기실행 런타임이면 pool 재사용, edge로 바뀌면 Neon 공식 가이드로 재선정한다.

게임 엔진은 순수함수 applyCommand(state,command,rng,rules) → nextState/events/result. 입력시간·실행기기·Math.random·네트워크가 엔진 결과에 개입하지 않는다. ID는 커밋된 명령과 seed에서 결정론적으로 파생하거나 서버 생성 ID를 명령입력에 고정한다. 정렬 tie-break는 안정 ID, 시간대는 게임 날짜/UTC 저장/Asia-Seoul UI로 구분한다.

UI → API 인증/검증 → 세이브 행 잠금 → 중복검사/버전검사 → 엔진 → 제약검사 → 트랜잭션 커밋 → 응답. 엔진 계산이 길어지면 청크를 줄인다. 외부 API/스토리지 호출을 행 잠금 트랜잭션 안에 넣지 않는다.

## JSON 상태 계약

SaveState: schemaVersion, rulesVersion, engineVersion, mode, gameDate, seedState, phase, league, playersById, teamsById, schedule, records, timeline, pendingEvent, modifiers, settings.

CareerState 추가: protagonistId, highSchool, proRegistrationHistory, focusPlan, phaseProgress, careerPreparationUsed, preparationEpisodeId, retirementReason, archiveId.
ClubState 추가: managedTeamId, lineup, pitchingPlan, budgetsBySeason, reservations, offers, draftState, importOrigins.

Player: id, name, birthYear, ageAtSeasonStart, kind, throws, bats, pitchForm(투수만, 119), position, role, abilities, growthFractions, potential, aptitude, fatigue, morale, injury, contractId, teamId, level, retired, originArchiveId?. 숫자는 유한값·범위 검증. 영구 능력치와 임시 modifier 분리. 타자 능력치를 투수 키로 해석하지 않는다.

ScheduleGame: id, season, dayIndex, homeTeamId, awayTeamId, status, rngSeed, resultId?. GameResult: scoreByInning, battingLines, pitchingLines, decisions, playSummary, outsRecorded. 같은 gameId를 다시 완료할 수 없다. 리그가 날짜를 진행하면 그 날 모든 경기를 완료하고 다음 날짜로 넘어간다.

## 관계형 엔티티

모든 주키 UUID, 시각 timestamptz. FK/삭제 정책은 명시적으로 관리한다.

| 테이블 | 열/검증/인덱스 |
| --- | --- |
| profiles | id=인증subject, display_name, created_at. 비밀번호 없음 |
| game_saves | id, owner_id FK, mode enum, revision bigint≥0, versions, phase, summary JSONB, state JSONB, created/updated_at, deleted_at. index(owner_id,updated_at desc) |
| command_receipts | save_id FK, command_id, request_hash, result JSONB, resulting_revision, created_at. PK(save_id,command_id) |
| archived_players | id, owner_id, source_save_id UNIQUE(출처값), snapshot JSONB, version, checksum, created_at, hidden_at. 원본 수정 API 없음 |
| split_stat_summaries | player_id FK, scope_key, vs_hand(L/R), stats JSONB, aggregate_version. UNIQUE(player_id,scope_key,vs_hand) (121/122) |
| imported_players | club_save_id FK, archive_id, instance_player_id, source_version, imported_at_age=19. PK(club_save_id,archive_id) |
| save_backups | id, owner_id, save_id, revision, object_key UNIQUE, sha256, size, status, created_at. 준비완료에만 다운로드 허용 |
| operation_jobs | id, owner_id, save_id, type, status, source_revision, attempts, next_attempt_at, error_code. 백업 재시도용 |

원본 snapshot은 DB UPDATE 권한을 서비스 내부 저장 계층에서 제한하고 공개 수정 route를 만들지 않는다. 세이브 soft delete는30일 후 정리 기본안. 보관 선수는 출처 세이브 정리와 별개 유지. 프로필 삭제 시 별도 명시적 계정삭제 흐름을 정의하고 v1 설정에 미완성 버튼을 노출하지 않는다.

## 명령과 응답

POST /api/saves/{id}/commands
요청: commandId, expectedRevision, type, payload. header의 사용자 ID는 신뢰하지 않고 세션 subject 사용.
응답: commandId, revision, summary, stateChanges 또는 state, emittedEvents, nextActions. 여기의 state/stateChanges는67/75/100의 공개 정책을 적용한 게임 화면용 DTO이며 DB SaveState JSONB를 그대로 직렬화한 값이 아니다. 일반 응답에는 rawP·서버 seed·미해금 히든 조건/진척을 포함하지 않는다. 백업용 완전 상태는70의 내부 보존 계약으로 구분한다.

허용 type: SET_FOCUS, ADVANCE_CHUNK, RESOLVE_EVENT, ACCEPT_DRAFT, ACCEPT_CONTRACT, RETIRE, SET_LINEUP, SET_PITCHING_PLAN, MOVE_ROSTER, SUBMIT_OFFER, WITHDRAW_OFFER, RELEASE_PLAYER, DRAFT_PLAYER, AUTO_DRAFT, COMPLETE_OFFSEASON.

새 게임 생성은78의 POST /api/game-creations와 owner 범위 creationId를 사용한다. 이전 POST /api/saves 생성 경로와 creationRequestId 명칭은 폐기한다. body mode와 설정 및 archiveIds, expectedArchiveVersions를 받는다. 생성 중 보관선수 소유권과 스냅샷을 다시 확인한다. 목록 API는 state 대신 summary만 반환하며 cursor 페이지당20, archive50. 상세 state 초기 한도5MiB, 명령 body64KiB, 백업 압축 해제 후10MiB 상한 기본안. 크기를 초과하면 조용히 잘라내지 않고 명시적 오류로 처리한다.

| HTTP/코드 | 의미 |
| --- | --- |
| 400 INVALID_REQUEST | 문법 오류 |
| 401 AUTH_REQUIRED | 세션 없음/만료 |
| 404 SAVE_NOT_FOUND | 없음 또는 타사용자 소유. 존재 노출 방지 |
| 409 REVISION_CONFLICT | 최신 상태와 충돌 |
| 409 COMMAND_ID_REUSED | 같은 ID에 다른 내용 |
| 409 INVALID_PHASE | 현 단계에서 허용 안 됨 |
| 422 ROSTER_INVALID / BUDGET_EXCEEDED | 규칙 위반, 필드/슬롯 정보 제공 |
| 422 SAVE_VERSION_UNSUPPORTED | 읽거나 변환할 수 없는 버전 |
| 429 RATE_LIMITED | Retry-After 반환 |
| 503 SERVICE_UNAVAILABLE | 재시도 가능한 장애 |

중복검사는 revision 검사보다 먼저 한다. 같은 요청 재시도는 현재 revision이 바뀌었어도 원래 결과를 반환한다. receipt는 세이브 수명 동안 유지하고 결과 전체 대신 필요한 command 결과+revision만 저장해 크기를 제한한다. 대형 state를 매 receipt에 중복 저장하지 않는다.

## 인증 설계 경계

초대 사용자 소수만 허용, 계정별 세이브 완전 분리. 인증 우선 후보는16의Neon Managed Better Auth이며87의웹/APK흐름을따른다. 실제프로젝트지원·refresh/logout/deep-link/동일계정재로그인은92의V02에서먼저실증한다. 후보를확정운영연결로표시하지않는다. 앱 공통 고정 API키를 APK에 넣어 인증을 대체하지 않는다.

웹 쿠키는 HttpOnly/Secure/SameSite와 CSRF 검증. Android는 시스템 브라우저 로그인+검증된 리디렉션, PKCE 지원 여부 확인 후 결정하며 토큰은 OS 보안 저장소. 로그에는 requestId/commandId/코드/지연만, 토큰·DB URL·선수 전체 state·다운로드 서명 URL 출력 금지.

## 백업·복원·오프라인

시즌 종료시 자동 백업 job 1개, 수동 백업 가능. private game-backups, key users/{owner}/saves/{save}/{backup}.json.gz. SDK는 Neon skill의 Files SDK adapter 우선 검토. AWS_* 변수는 서버에서만. 버킷 지역 지원 여부 확인 전 배포하지 않는다.

백업은 sourceRevision과 state 복사본을 먼저 확정해 진행 도중 revision이 바뀌어도 일관성을 유지한다. job pending→upload→체크섬 확인→ready. 실패 최대3회(1분/5분/30분), 이후 수동 재시도. 같은 job key로 멱등 업로드, ready 전에는 다운로드 불가. 정리 job은 DB 참조 없는 객체만 대상으로 하며 운영 정책 확정 후 적용.

다운로드: 소유권 확인 후 만료5분 URL. 복원: 압축폭탄 제한→JSON 스키마→지원 버전→체크섬→일관성 제약→새 saveId 생성. 원래 command receipt를 새 세이브에 복사하지 않는다. 복원 revision=0, imported origins/선수 ID는 새 세이브 namespace에서 충돌 없게 remap. 같은 원본 재사용은 세이브별 제약이므로 허용.

오프라인은 읽기만. 대기중 명령을 여러 기기에서 자동 큐잉하지 않는다. 서버 성공확인 전에 클라우드저장 완료를 표시하지 않는다.

## Neon·환경·배포 계획

org-purple-shadow-03640418 / polished-truth-68571504. 초기 production 연결은 사용자 요청. 작업은 dev 브랜치에서 검증하고 운영과 연결값 분리. neon.ts 기존값 보존. 서비스는 postgres와 private object-storage만 요청 범위, Auth/Functions 추가는 설계 선택 후 명시한다.

서버 변수: DATABASE_URL, DATABASE_URL_UNPOOLED(마이그레이션 환경만), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION, AUTH_* 확정 후, ALLOWED_ORIGINS. 공개 클라이언트는 API_BASE_URL만. .env*, .neon, 서명키, credentials는 gitignore. .env.example은 키 이름/용도만.

웹 호스트는 정적자산 캐시, API는 HTTPS와 상태조회. 운영 APK의 API URL은 https 고정, 로컬 테스트 빌드와 구분. Android 서명키는 저장소 밖 보관+복구용 별도 사본, 버전코드 단조증가, 패키지명은 출시 전 확정. 사용자 데이터는 APK 재설치로 삭제되지 않고 계정 재로그인으로 복구.

## 마이그레이션·장애 대응

DB migration은 Drizzle로 버전관리, direct 연결. schema 버전 N→N+1 변환은 dev에서 실제 유사세이브 검증, 변환 전 백업. 새 앱은 구버전 세이브를 읽고 변환할 수 있어야 하며 다운그레이드는 미지원. 기능 플래그로 쓰기를 잠시 막고 점검 화면 제공. 롤백은 이전 호환 앱으로 전환하거나 백업을 새 세이브로 복원, 운영 DB 일괄 덮어쓰기는 기본 대응이 아니다.

관측 지표: 명령 성공률, 중복 재시도수,409수, 저장/조회 p95, 게임청크 계산시간, state크기, 백업 실패. 서버 콜드스타트가 있으므로 저장중 상태를 유지하고 시간초과가 곧 진행취소라는 문구를 쓰지 않는다. 비용 예산/알림 금액은 실제 Neon 요금제 확인 후 정하며 무료 운영을 보장하지 않는다.


2026-10-19 플랫폼 보완: [86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md). 네 환경의 웹 플레이+Android APK를 기본 목표로 정리합니다. iPhone은 Safari/홈 화면 웹앱,Windows/macOS는브라우저. 별도iOS·데스크톱 설치형은후속 선택 범위. 실제 호환 검수 미실행.

---

<!-- SOURCE: 07-ACCEPTANCE.md -->

# 07. 검증, 미결정과 구현 착수 조건

이 문서는 초기 검증 목록이다. 최신 범위는 STATUS.md와14 통합결정, 추가 시나리오는12/13의T31~T50, 전체 화면 계약은17을 함께 적용한다. 이벤트 총69종,화면S01~S33이며아래이전집계40종/21화면표기는역사적중간단계다.

설계는 세부 문서가 존재하는 것과 모순 없이 구현 가능한 것을 구별한다. 사용자 요구에 따라 앱 구현은 시작하지 않는다. 이하 완료 기준이 채워지면 설계 검토본을 제시하고 구현 단계로 전환한다.

## 요구 추적

| 사용자 요구 | 설계 위치 | 증명 방법 |
| --- | --- | --- |
| 커리어 일대기 | 01/02/04 | 고교→드래프트→프로→은퇴 스크립트 |
| 가상 선수/실제 구단 | 01/05 | 실제 선수 roster 없는 생성 fixture |
| 독립 구단 모드 | 02/05 | 보관 선수0명·커리어0개로2시즌 |
| 선택적 내 선수 | 02/05 | OFF/ON 두 생성 흐름 |
| 능력별최고50%·어린 나이 | 01/02/05/06 | 41세→19세, 능력별영구최고×.5(하한1) |
| 웹/APK | 03/06 | 동일계정 이어하기와 버전호환 |
| Neon 저장 | 06 | DB와 파일 실제 쓰기/조회 |
| 상세 설계 먼저 | 전 문서 | 미결정/게이트 확인 전 구현 없음 |

## 필수 테스트 시나리오

T01 이름 경계/이모지 글자소/빈문자/스크립트 텍스트 안전.
T02 좌투·포지션 제한과 키보드 입력 검증.
T03 타자/투수 모든 유형의 고교 시작·지명·미지명 종결.
T04 조건 없는 이벤트 추첨은 진행을 막지 않음.
T05 이벤트 A/B 각 선택 이후 허용 상태로 이동, 동일선택 재시도 중복효과 없음.
T06 부상/계약/콜업 사건 동시발생 우선순위와 대기 만료.
T07 한 시즌144경기/팀,720경기/리그,상대홈원정8씩,중복일정 없음.
T08 3아웃/끝내기/만루BB/병살/동점12회/PS재경기.
T09 투수교체 후 승계주자/자책점/승패·세이브·홀드 산식 (세부 설계 보완 필요).
T10 기록 합계: H=1B+2B+3B+HR, 팀득점=개인R합, 상대피안타=H, outs 정수.
T11 성장점 상한/하한, 집중4개와80/20 분배, 노쇠 순서, 피로버프 원복.
T12 등록시즌/계약만료/FA자격, 모든제안거절 탈출경로.
T13 만45세 은퇴, 수동은퇴, 아마추어은퇴 모두 보관.
T14 41세 선수 가져오기에서19세/능력별최고50%/부상없음/신규기록/원본불변.
T15 같은원본 같은세이브 중복금지, 다른세이브 허용, 동명이인 구별.
T16 보관함0명으로 구단 생성·운영·우승·다음시즌.
T17 투수만28명 가져오기 등 로스터불능 조합 거절.
T18 FA 동시영입/제안예약/방출보장액/최소로스터 보호예산.
T19 같은commandId 재시도,동일ID 다른payload거절,성공응답 유실복구.
T20 서로 다른기기 같은revision 명령 중1개만 커밋,다른기기409.
T21 은퇴·보관DB 트랜잭션 실패 시 둘다 롤백,재시도1개보관.
T22 서버재시작/중간청크 종료 후 같은seed 결과 유지.
T23 타사용자 save/archive/backup 접근404,서명URL 발급거절.
T24 DB 저장성공/스토리지실패를 분리 표시,백업재시도 성공.
T25 깨진gzip/체크섬오류/알수없는버전/초과크기 복원거절.
T26 이전버전세이브 변환 후 핵심능력/기록/seed 보존.
T27 모바일360/390px,PC1280,200%글자,긴이름,빈목록,키보드포커스.
T28 APK 뒤로가기/재설치/세션만료/로그인복귀/저장중 종료.
T29 build 통과,웹실행,Android release 설치·서명·업데이트검증.
T30 운영환경 변수가 번들/APK/로그/Git에 없는지 검사.

## 밸런스 실험 계획

고정 seed100개 리그×5시즌: 타율 .230~.290,팀 경기당 득점3.5~5.5,BB/PA6~12%,K/PA15~25%,HR/PA1.5~4.5%를 초기 목표 구간으로 사용. 이 범위는 실제 연도 데이터 인용이 아니라 게임 검증 목표다. 통과해도 현실야구 재현이라고 주장하지 않는다.

유형당1000명 커리어: 지명률/1군정착률/수명/누적성적/능력치 분포 비교. 최고유형이 다른유형보다 주전정착률20%p 이상 높으면 검토. 집중선택별 성장차가 보이며 어떤 선택도 다른선택보다 항상 우월하지 않아야 한다. 불러온 선수 포함 리그는 별도 집계해 일반 밸런스와 혼동하지 않는다.

노쇠로 전부40대 초반에 같은성적으로 끝나거나19세 강력선수 상한과 버그가 섞이지 않는지 확인. 잠재력100·능력100·피로100 극단 입력도 종료 가능. 리그50시즌 시뮬레이션으로 예산/로스터/FA 고갈/세이브크기 점검.

## 사양 충돌 점검과 수정 필요

1. 경기확률·투수승패/SV/HLD/ER·승계주자 귀속의 기본 산식을 08에 추가했다. 독자 단순화 규칙이며 실험 검증은 남았다.
2. 이벤트40종의 본문·결과문을 09에 추가했다. 변수 fixture와 화면 줄바꿈, 조건별 문안 검수는 남았다.
3. 수상 산식·자격·동률 규칙을 08에 추가했다. 임의 WAR 표시는 제외했다.
4. 성장 예산·출장/훈련 계수·상한 재배분·적합도 성장량을 08에 추가했다. 분포 검증은 남았다.
5. 계약가격·FA수락·최소로스터 보호액·재정재건 탈출규칙을 08에 추가했다. AI 장기 검증은 남았다.
6. 역할 희망과 실제 기용 우선순위·경쟁지수를 08에 추가했다. 모든 선수에 동일 적용하는지 검증해야 한다.
7. 실제 구단 목록·구단별 색·브랜딩 데이터 확인, 대상 기준연도 명시가 필요하다. 현실 경기규정과 혼동하지 않게 도움말 작성.

## 아직 선택이 필요한 제품 결정

| 항목 | 제안 기본값 | 영향 |
| --- | --- | --- |
| 앱 이름 | Baseball Career(작업명) | 패키지명·타이틀·아이콘 |
| 가져오기 나이 |19세| 사용자 '어린나이' 요구 구체값 |
| 시각 방향 |밝은 야구 기록실| 목업 검토 대상 |
| 초기 완성범위 |타자/투수 모두| 타자만은 내부 검증단계 |
| 해외 진출 |v1 필수(13문서)| 고교 직행·포스팅·미국 커리어·복귀 |
| 대학/이도류 |v1 이후 후보| 확장 시 커리어 상태 추가 |
| 세이브 제한 |계정당 활성10개| 데이터/목록 UX |
| 계정/호스팅 |관리형 인증+Node API| APK 로그인과 비용에 직접 영향 |

대부분 제안은 문서 내 기본값으로 계속 설계할 수 있다. 인증/호스트는 외부계정·지원런타임 확인이 필요한 기술 선택이라 실제 구축 전 해결한다.

## 설계 게이트

D1 요구사항 정합성: 최신 사용자 요구가 문서마다 일치.
D2 규칙 완결: 미정 수식/기록 판정 없음, 모든 상태에서 종료/다음행동 존재.
D3 콘텐츠 완결: 이벤트40종 본문·선택·효과·후속·종결 검수.
D4 UX 검토: 주요21화면,로딩/빈/실패/저장충돌까지 시각 목업에서 확인.
D5 데이터/API: 인증·소유권·멱등·버전·백업 스키마 매핑 완료.
D6 운영 준비: Git 작업경로,Neon지역,호스팅,로그인,APK서명/배포 계획 확정.
D7 사용자 검토: 변경 가능한 기본값과 범위를 설명하고 설계 검토본을 확인. 사용자 요청대로 그 전에 앱 구현 시작하지 않음.

현재 D1 초안정합, D2 산식/분기 초안 작성, D3 40종 문안 초안 작성, D4 21화면 사양과 주요7화면 보드 작성, D5 인증외 계약 초안, D6 일부 미확인, D7 미실시. '완벽한 설계 완료'로 표시하지 않는다. 다음은 전체 화면 목업 확장, 문서 시나리오 점검, 인증·호스트 검토이며 앱 구현이 아니다.

---

<!-- SOURCE: 08-FORMULAS.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 08. 수式·판정 부록

이 부록은 앞 문서의 산식 미정 항목을 채우는 독자 게임 규칙이다. 숫자는 캘리브레이션 전 기본값. 버그 수정과 밸런스 변경을 구분하고 rulesVersion을 올린다.

## 결정론과 단위

PRNG는 PCG32,32bit 출력/2^32를[0,1)로 변환. 구현체는 테스트 벡터로 고정하며 엔진 버전마다 난수 호출순서를 변경하지 않는다. 게임·부상·성장·이벤트는 독립 스트림을 사용해 서사 추가가 이미 정한 경기결과를 바꾸지 않게 한다. 모든 퍼센트는0~1,금액은 원 정수,투구아웃은 정수. 확률 누적 마지막 구간은 반드시1.0으로 끝낸다. 수치 계산은 Number를 사용하되 결과 직렬화는 능력잔여점1e-4 정밀도,금액반올림은 만원 단위. 플랫폼간 동일결과 fixture 필수.

## 타석 확률

유효능력 A는 clamp(영구능력+임시효과,1,100)×피로배율×사기배율. 비교차 d(x,y)=clamp((x-y)/50,-1,1). 컨택 C, 파워 P, 선구 E, 주루 S, 상대 제구 Q, 구위 V, 구속 G. 수비 D는 실제수비8명 적합도보정 평균. 표의 base는01문서와 동일.

BB logit=ln(.085)+.6d(E,Q)
HBP logit=ln(.010)-.15d(Q,50)
K logit=ln(.200)+.45d(V,C)+.25d(G,C)-.2d(E,Q)
1B logit=ln(.160)+.35d(C,V)-.2d(D,50)
2B logit=ln(.045)+.3d(P,V)+.2d(C,Q)
3B logit=ln(.005)+.45d(S,50)+.15d(P,V)
HR logit=ln(.030)+.8d(P,V)+.15d(C,Q)
OUT logit=ln(.465)+.2d(D,50)-.25d(C,V)

주자있음이면41의위기관리대칭보정t=.001×(위기-50)를K/OUT에더하고BB/HR에서차감. 각 확률 exp(logit-maxLogit)/합. 확률을 개별로 잘라 합이1에서 벗어나게 하지 않는다. 좌우상성은 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)로 반대손 타자 1B+.01/같은손 투수 K+.01을 소폭 적용하고 투구폼×대표구종 친화(±.01)와 함께 구종·성향·특성 합산 ±.10 cap 안에서 계산한다. 모든능력50이고 좌우 보정·투구폼 친화가 0인 중립 입력이면 base 분포와 일치한다(119).

성적지수 타자=clamp(50+100×(OPS-.700),0,100),투수=clamp(50+10×(4.00-ERA),0,100). 미달표본은50. 콜업 점수는01의 가중평균. 요청한 역할이 비어 있으면 가산2점,주전보장계약 없음. 동률은 피로낮음→선수ID. 이벤트는 점수보다 우선해 강제주전으로 만들지 않는다.

## 성장 계산

출장계수=0.7+0.4×min(1,PA/500) 타자,투수는 SP outs/450,RP/CP outs/150. 현재시즌고교는 PA/100 또는 outs/90으로 별도 정규화. 훈련계수 기본1,재활기간비율r이면 max(.8,1-.2r). 별도 훈련버프 event가 있으면 최대1.2. 둘을 적용한 예산은0.0001정밀도로 저장.

예산배분: 집중4개80%,미선택2개유형가중20%(35/42). 현재값=잠재력인 능력은 후보에서제외,집중쪽 전부상한이면 그 몫도 비집중 후보로 이동. 42의원래weight비례상한재분배,모든잔여weight0일때균등. 이미A에반영한소수를다시growthFractions로가산하지않는다. 노쇠도 같은방식으로1하한까지 재분배. 포지션적합도는 시즌 전전환계획+해당자리30경기이면+10,미달이면+3,상한100. 기존주포지션은100.

## 기록·투수교체

각 주자에 responsiblePitcherId와 reachedBy를 저장한다. v1은실책없으나승부치기자동주자의득점은ER에서제외(24). 구원투수가 승계주자를 홈으로 보내도 책임투수의 ER/R로 합산한다. 경기R은 실제득점선수, RBI는 타석득점의 원인타자(병살0,밀어내기1). 내야아웃에는진루없으므로 희생타점없음.

선발W: 결정적 리드(이후 동점없음) 획득 시점의 자기팀 직전수비 투수가 선발이고5이닝 이상이면 부여. 5이닝미달이면 리드이후등판구원 중 outs최대→ER최소→이른등판순. 구원W: 결정적리드 획득 직전수비투수,단 선발조건 예외 우선. L은결정적리드의 결승득점주자 responsiblePitcherId. 동점경기W/L없음.

SV 독자 단순규칙: 승리팀 마지막투수이며 W투수아님,구원등판으로 최소1out,리드유지,등판시리드1~3 또는 잠재동점주자가 베이스/타석/대기타석에 존재 또는 마지막3이닝이상투구. HLD: 구원등판,등판시동일세이브상황,최소1out,리드유지후교체,최종W/SV투수아님. 해당게임최종판정후확정. BS: 세이브/홀드상황에서자신등판중동점허용,승계주자책임과무관. 동일투수BS와W는가능, HLD와L/SV는불가. 현실기록규칙의완전재현은아님.

투구수는 BB/HBP기본5,K기본5,HIT기본3,OUT기본3에균등정수[-1,1]가산,최소1. 경기아웃기록과투구수는별도다. 선발교체는타석종료때적용하며하드상한을넘긴타석을중간삭제하지않는다.

## 계약 산식

역할기본가치 타자=3천만원+max(0,OVR-40)×1천만원+PA×10만원+max(0,OPS-.600)×5억원. 투수=3천만원+max(0,OVR-40)×1천만원+outs×20만원+max(0,5-ERA)×5천만원. 기록표본미달이면 OPS .600/ERA5 사용. 연봉value는3천만~30억원에제한. 비FA제안은round만원(.5×전년연봉+.5×value),신인전년연봉은최저값.

FA희망연봉=value×1.2,희망기간=나이≤29 4년/≤32 3년/≤35 2년/그외1년. 수락기준점수=금전비율.7+역할비율.2+선호.1. 금전비율=min(1.2,제안총액/희망총액)/1.2,역할비율 주전/선발1·로테/필승.8·백업/추격.5,선호는사전고정0~1. 해당점수식은구판이며현재수락확률은40의money/role/preference와outside경쟁분포를사용한다. 구임계수락/최고점선택은폐기. 이 산식으로 인간/AI동일평가. 항상제안이존재한다고보장하지않는다.

최소로스터보호예산=max(0,35-다음시즌계약인원)×최저연봉. 자유계약제안으로보호예산을사용할수없다. 방출보장액+최소보호액이연간기본예산을초과하면다음시즌계약진행불가대신'재정재건' 선택을제공:보장액은유지,해당세이브다음연도에만예산을필요최소액까지확대하고재정지원기록을남긴다. 파산탈출없는소프트락보다명시적구제를택한다. 이규칙은사용자/AI동일.

## 수상

정규시즌만. 타자기여점=PA×max(0,OPS-.500)+수비경기×수비/100×.1. 투수기여점=outs×max(0,6-ERA)/3+K×.05. 타자·투수점수는각자자격선수내평균/표준편차로z점수환산,sd0이면0. MVP는전체z최고. 최소PA200 또는outs150 필요. 포지션상은해당수비경기최다포지션으로귀속,최소50경기,동포지션기여점최고. SP상은선발등판≥15,RP상은구원등판≥30,CP는SV최고(동률ERA/outs/ID). 신인상은프로등록첫해선수중MVP방식. 타격왕/ERA왕은규정분모충족. 누적왕은양의기록필수,동률공동수상. MVP/포지션/신인상동률은출장분모→선수ID. '공식KBO수상산식'이라고표시하지않는다.

## 지명·재도전

커리어드래프트지명점수=OVR×.7+고교성적지수×.3+seed변동[-5,5]. 45미만미지명,45이상모집구단포지션수요점수순선택. 라운드는34의구간표(1라운드81이상,10라운드45이상49미만)를사용. 구단수요는해당세이브로스터로계산,선호구단은동점가산1. 재도전은66의준비예산/실제오퍼평가,준비후최저계약자동보장없음. 능력만으로상위지명을보장하지않는다.

## 명시적 단순화

이 게임은 리얼리즘보다 커리어/구단 운영의 일관성을 먼저 검증한다. 오차가 큰 성적은 계수조정으로 해결하고 임의로좋은결과를사후덮어쓰지않는다. 모든규칙은도움말에서요약하고 실제리그와다른점을밝힌다. 이부록으로산식초안은채웠지만,100seed/유형별실험을수행하기전밸런스완료가아니다.


경기최신수식: [41 여섯능력엔진](41-SIX-STAT-ENGINE.md). 위기관리대칭보정·체력/교체·역할평가를구체화하며구전술logit가산을폐기한다.


엔진RNG/동률의선수·구단·경기ID는70의simulationKey기준이며복원DB rowId변경으로판정이바뀌지않는다.

능력상한·성적설명 후속: [112](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md)에능력100/잠재력100/실제AVG·SLG를구분하고고정대조군4개와균형실험6개를작성했다. 기존산식을바꾸거나시즌성적을보장하지않는다.

---

<!-- SOURCE: 09-EVENT-COPY.md -->

# 09. 이벤트 문안 원본 안내

최신99종의본문/선택/결과는[전체문안](EVENT-CATALOG.md)과[event-catalog-v2.json](event-catalog-v2.json)을사용한다. 기존두선택고정·체력성장·숨은morale효과는폐기했다. 조건/우선순위/명령효과는[45](45-EVENT-CATALOG-REVISION.md). 게임의결과명령이성공한뒤에만결과문구를표시한다.

---

<!-- SOURCE: 10-REVIEW-DECISIONS.md -->

# 10. 문서 교차 검토와 추가 결정

2026-10-16. 이 절은 앞 문서의 모호한 교차 규칙을 보완한다. 실제 구현/플레이 테스트 결과가 아니라 설계 검토다.

## 확인한 불변 조건

- 구단 시작에 커리어 완료/보관 선수는 필요하지 않다.
- 41세 원본을19세로 가져와도 원본을 변경하지 않는다.
- 가져오기 화면 미리보기와 서버 확정의 원본 능력치/버전을 일치시킨다.
- 은퇴와 보관은 멱등이며 은퇴 후 진행 명령을 거부한다.
- 모든 자동진행은 선택 사건 앞에서 중단하고 요청 재시도는 같은 결과를 반환한다.
- 예산이나 로스터 오류에서 진행 버튼을 단순 비활성화하지 않고 해결 화면을 연결한다.
- 보관함이 빈 경우에도 독립 구단 시작 버튼이 존재한다.
- 한 선수 커리어를 구단 모드가 역으로 수정하지 않는다.

## 발견한 모호함과 해결

1. 재도전 횟수: 고교 미지명/지명거절 후 amateurRetryCount 최대1. 프로 전력외/계약거절은 proRetryCount를 별도로 최대3회, 같은 오프시즌에는1회. 45세 시즌종료 후는 재도전 불가. E05/E06은아마추어카운터,E30/E34는프로카운터. 허용횟수가없으면선택지에은퇴만표시한다.
2. 은퇴 마지막 인사: E37은 이미 확정된 보관 snapshot을 수정하지 않고 별도의 career epilogue 표시 메타데이터에 저장. 숫자/기록/능력치 영향없음. 입력을 생략해도 보관 완료.
3. 여러 명 가져오기: 한명씩 대체하고 마지막에 검증하는 대신 전체 선택 조합에 대해 후보매칭을 구한 후 한 번에 적용. 같은 가상 선수를 두번대체하지 않음. 확인화면 취소는 생성을 취소하며 FA풀도 바뀌지 않음.
4. 원본 숨김: 숨김은 선택필터에서제외하지만 이미생성한복사본에는영향없음. 클라이언트에서숨긴ID를직접보내도서버가소유권·선택가능상태를검증한다.
5. 구단 백업 복원: 같은세이브덮어쓰기가아닌새세이브,가져온선수의출처도복원. 원본이숨겨졌거나사라져도이미복원된복사본의능력치는백업값유지. 출처를못열면'원본을열수없음'표시.
6. 커리어 콜업과 리그 로스터: 콜업은빈슬롯또는대체선수강등까지묶어서한명령으로처리. 사용자선수만29번째로추가하지않음.
7. 시즌 모드 차이: 커리어는사용자선수기용요청만,구단은로스터직접결정. 사용자커리어의AI구단도같은예산·로스터제약을적용한다.
8. 세이브 용량: 커리어는전체리그시즌요약과현재시즌경기박스스코어를유지,과거경기별상세는백업/이력테이블확장전최근1시즌만유지. 선수별연도성적과주요기록은삭제하지않는다. 구단은같은정책. 과거세부기록을제거하기전UI에서보존범위를알린다.
9. 시즌 시각: 나이는시즌시작에한번증가,생일당일증가없음. 가져온해는19세로시작하고다음시즌20세. 원본은은퇴시즌나이보존.
10. 엔진 업데이트: 진행중세이브의rulesVersion을자동교체하지않음. 버그수정은호환가능한engineVersion만올리고동일seed재현범위변경을릴리즈노트로명시. 필요시새게임권장,기존경기결과재계산없음.

## 화면별 입력 검증 추가

S02 생성 필수필드는앞단계에서표시,마지막확정에서전체재검사. 취소하면로컬폼만삭제,서버세이브생성전이므로선수보관/진행횟수에영향없음.
S08 계약은단일선택,선택카드에총보장액을자동합산. '연봉'과'총액'을같은표현으로혼용하지않음.
S12 가져오기선택에서19세와원본능력치동시표시. 0명선택시'내선수없이생성'표시,선택유도경고없음.
S14 로스터이동은1군정원과대체슬롯검증,실패시필드와해결대상선수링크표시.
S15 라인업은변경중초안과저장된라인업분리. 화면이탈은'적용하지않은변경'만확인하며서버결과를되돌리지않음.
S17 계약제안은만원단위정수,허용연수1~4,음수/NaN/예산초과거부. 미예약예산은동시제안에서원자적으로차감.
S20 백업다운로드는준비완료만,복원은지원버전만. 숨김선수와삭제세이브는일반목록에서제외하고관리화면에서보존기간을표시.

## 설계 산출물 검수 기록

문서 링크:11개파일작성시점내부Markdown링크누락없음.
이벤트정의:E01~E40 40종. 문안:E01~E40 40종. 단순행개수만검사했으며실행조건fixture검증을대체하지않음.
주요시각보드:시작/커리어/이벤트/시즌결산/가져오기/구단/저장충돌7종. 전체21화면의레이아웃사양은03에있으나전부렌더링된목업은아님.

## 구현 전 남은 실증

렌더링없는문서만으로줄바꿈·대비·터치사용성을보장하지않는다. 브라우저도구복구후전체화면목업확장과시각검수. 실제Neon프로젝트지역/권한조회,인증·호스팅서비스선택과Android로그인지원공식문서확인. 게임코드구현이필요한밸런스실험은설계수치확정의최종검증단계로구분하고사용자에게설명한다. 이단계에서는앱을착수하지않았다.

---

<!-- SOURCE: 11-ART-DIRECTION.md -->

# 11. 이미지와 아트 방향

사용자 요청: 참고 사이트처럼 야구 이미지가 있는 게임다운 화면. 기존 기록실 레이아웃에 원본 야구장 일러스트와 가상 선수 초상화를 더한다. 앱 구현이 아닌 디자인 보드 보완이다.

## 이미지 배치

| 위치 | 이미지 | 텍스트·가독성 규칙 |
| --- | --- | --- |
| 시작 화면 | 석양의 야구장, 타석으로 향하는 익명 선수 | 상단/좌측 짙은 오버레이, 제목은 HTML 텍스트 |
| 커리어 상단 | 선수 초상+구단색 배경+작은 구장 배경 | 이름·나이·역할은 이미지 밖 또는 단색 위 |
| 이벤트 | 벤치·불펜·드래프트·재활 등 상황별 삽화 | 상단 짧은 배너, 선택카드에 이미지 겹치지 않음 |
| 시즌 결산 | 기록 카드 주변 작은 월계수·구장 모티프 | 성적표는 흰 바탕, 필수 숫자를 그림에 굽지 않음 |
| 보관함 | 선수 카드, 유니폼 컬러, 포지션 표식 | 원본 은퇴나이와 투입19세를 글자로 구분 |
| 구단 홈 | 홈구장 전경 | 점수/예산은 별도 카드, 모바일 배너 낮게 |

## 통일된 스타일

따뜻한 빛과 짙은 녹색·남색을 사용하는 일러스트. 과도하게 사진 같은 인물보다 친근한 스포츠게임 느낌. 실제선수얼굴은사용하지않고가상선수/무브랜드유니폼사용. 구단로고는37의사용자선택에따라공식출처자산을디자인검토에사용하며배포권리는별도확인. 선수 초상은 체형·얼굴·헤어 변주와 투타 포즈로 확장하며 나이 표시는 UI에서 관리한다. 같은 초상을 사용해도 보관원본/복사본 나이를 그림으로 오인시키지 않는다.

## 자산 목록과 제작 순서

P0: 공통구장1,선수초상1로 보드 방향 검토.
P1: 타자/투수 기본초상 각4,드래프트/벤치/불펜/훈련/재활/은퇴 상황배너6,기본유니폼 색변주.
P2: 포스트시즌/우승/고교/계약 삽화,희귀업적용 장식. 모든 조합을 AI로 생성해 크기를 늘리지 않고 공통 자산 재사용.

자산은생성이미지와원본프롬프트를같이관리. 유니폼문자·숫자는UI 또는별도그래픽으로추가하며AI가생성한깨진문자를그대로노출하지않음. 사람손·글러브·배트형태를검수. 초상화없음/로딩실패시이니셜실루엣대체.

## 성능·접근성

주배경은원본보존후웹용AVIF/WebP파생을빌드시생성하는계획. 모바일배너목표250KB이하,초상100KB이하,최초이미지합계700KB이하. 실제측정전달성했다고표시하지않음. 아래화면은lazy-loading,가로세로크기예약,이미지없이도모든버튼사용가능. 장식은alt빈문자,정보성초상은선수명설명. 모션감소설정존중,자동배경동영상없음.

## 생성 도구와 프롬프트 기록

built-in image_gen 사용. 최종 프롬프트는 assets/GENERATED-ASSETS.md에 생성 결과를 연결한 후 기록한다. 프로젝트용 참조는 assets/ 내 복사본만 사용하고 생성도구 기본출력폴더에 의존하지 않는다.

---

<!-- SOURCE: 12-STYLE-INTERNATIONAL-MILITARY.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

최신 가져오기 규칙: [사용자 결정32](32-USER-IMPORT-REBIRTH.md). 아래의 능력치 그대로/기존잠재력·병역혜택 계승 제안은 폐기되며, 능력별 최고50%·상향잠재력·병역재시작으로 읽고 관련 기대값을 교체한다.

# 12. 플레이 스타일·특별강화·국가대표·병역

국제대회의 최신 상세 계약은 [20](20-INTERNATIONAL-COMPETITIONS.md)을 따른다. 아래 초기 제안과 충돌하면20의 달력·선발·기용·교체·승부치기·혜택 증거 규칙이 우선한다.

2026-10-16 / v0.5 설계 추가. 사용자 요청에 따라 네 체계를 v1 목표 범위에 포함한다. 이전 '국제대회 없음' 또는 단순 시즌 반복 사양보다 이 절이 우선한다. 앱 구현은 시작하지 않는다.

## 1. 참고 조사와 사실의 경계

https://slbcareer.com/ 공개 HTML이 참조한 배포 클라이언트에서 스타일 변화, 능력치 강화 훈련/사용완료, 아시안게임/WBC/올림픽/프리미어12 선발·성적, 상무/현역 복무·복귀 문구를 확인했다. 실제 로그인 플레이·모든조건 검증은 하지 않았다. '특별강화'라는 정확한 표제는 찾지 못했고 강화 훈련의 존재를 확인했다. 원본 내부계수·보정·문구는 복제하지 않는다.

현실 참고:
- 병무청은 올림픽3위이상/아시아경기대회1위입상자를 체육요원 편입대상으로 안내한다. 일반적 현역복무와 다른 복무제도이며 단순 병역면제와 동일하게 표시하지 않는다. https://www.mma.go.kr/incheon/contents.do?mc=mma0000752
- 체육요원 복무·활동 의무가 별도로 존재한다. https://www.mma.go.kr/navigation/contents.do?mc=mma0000758
- 올림픽 야구는 모든 회차 개최가 보장된 종목으로 가정하지 않는다. LA2028 포함은 IOC 발표로 확인된다. https://newsroom.olympics.com/record/1285

이후의 연도·선발정원·연령·복무기간·연봉·등록일수는 게임용 단순화 규칙이다. 현실 법률·선발규정·미래 일정을 재현한다고 표시하지 않는다. WBC/프리미어12 성적에는 병역효과를 주지 않는다.

## 2. 선수유형과 육성

유형은35의초기분포/성장배분,집중은정확4개. 구타석전술logit가산은폐기한다. 여섯능력효과는41,일반/하드배율은42.

## 3. 특별강화

42의정규일정1/3해금·세계시즌공유1회·확정+1/도전60%+2/컨디셔닝-20. 치트성공보장,상승량/횟수/상한유지. 실제100확률숫자는38대로숨긴다. 상무블록마다횟수초기화없음.

## 4. 국제대회 달력과 선발

세이브마다고정 tournamentCalendar를보관. 기본'게임 반복달력'은 WBC2026기준4년간격/아시안게임2026기준4년간격/프리미어122027기준4년간격/올림픽2028기준4년간격. 이는미래공식일정예측이아닌가상반복설정임을새게임도움말에표시. 현실기준모드는확인된개최회차만명시데이터로넣는후속선택. 시작기본2027이므로첫WBC2030,첫올림픽2028.

WBC는프리시즌직전,올림픽은정규시즌72경기후휴식창,아시안게임은120경기후휴식창,프리미어12는PS후. 대회창에서는국내리그를같이멈춰국제/리그이중출전방지. 두대회같은해에는분리된창으로순서고정. 모든구단경과시간동일. 부상회복일수는팀경기기준이므로대회창에서는국가대표실제경기만회복/피로대상이며국내휴식선수는대회일수만큼피로회복한다.

선발은한국선수풀에서28명(투수13,야수15),C2명과수비필수슬롯보장. 현재부상/현역복무/은퇴는제외. 상무선수는아시안게임선발가능,다른대회는 구단/대표설계상제외하는v1단순화. WBC/올림픽/프리미어12는 1군기록보유자, 아시안게임은1/2군가능.대회별실제U연령/와일드카드규정은적용하지않고화면에게임선발규칙명시.

선발점수=.6×역할OVR+.4×최근성적지수,표본미달최근지수50,동률출장분모→seed사전추첨. 아시안게임만미해결병역선수에+3을제안하되선발보장없음. 보정설정은신규세이브규칙에명시. 대표명단발표→참가/부상위험을이유로사양→최종명단확정. 사양시능력페널티없음,병역기회상실안내. 탈락은읽기전용뉴스,진행막지않음.

## 5. 대회 진행과 성적

대회는조별리그+토너먼트독자형식. WBC20팀/5팀4조,각조상위2→8강/4강/결승; 올림픽6팀/3팀2조,상위2→4강/동메달전/결승; 아시안게임8팀/4팀2조,상위2→4강/동메달전/결승; 프리미어1212팀/6팀2조,상위2→4강/3위전/결승. 실제개최회차형식재현아님. 각 단계 단판, 정규9이닝. 국제경기는 조별을 포함해10회부터 무사2루 승부치기,20회동점이면 저장 후21회부터 재개한다. 재경기·추첨 제안은14/20에 의해 폐기했다.

다른나라선수는가상생성,나라별팀능력프리셋(강/중/약)고정 seed. 2026-10-27 사용자 확정: 프리셋 종합은 강 65, 중 55, 약 45이고 여섯 능력은 그 값과 같다. 한국만우승확률하드코딩하지않음. 국내와같은경기엔진/피로/부상계산. 국제PA/H/HR/outs/W/L는 국내통산에 합산하지않고대회별기록. 참가만하고미출전이면0기록,선발명단등록과실제출장을별도보관. 포지션/보직이맞지않으면대표팀내백업가능.

메달·기여판정: 팀결과와개인참가자격을별도. 게임의체육요원자격조건는 최종등록+실제1경기이상출장+아시안게임금또는올림픽동이상. 이는현실추천절차전체를모사한조건이아니며게임단순화다. 대회불참/선발탈락/기존복무완료/WBC우승은병역상태변경없음. 은/동아시안게임도변경없음.

보상: 우승/메달은명예·수상·타임라인. 참가morale+3,금/우승+5로대체(중첩아님). 영구능력일괄상승/FA등록일수가산없음(v1독자안). 대회누적피로와부상은복귀시보존.

## 6. 병역 상태와 선택

대상은생성설정의'대한민국병역대상커리어'기본ON. OFF는'비대상'으로고정,아시안게임보정없음. 실제유저의성별/건강/국적정보를수집하지않고가상선수게임설정으로만관리. 나이·유예상한은게임설정기본값이며현실법적기한이라고쓰지않는다.

MilitaryState: NOT_APPLICABLE / UNRESOLVED / APPLICATION_PENDING / SERVING_SPORTS / SERVING_ACTIVE / ATHLETE_ELIGIBLE / ATHLETE_SERVICE / COMPLETED. '면제'라는한상태로대표메달과복무완료를섞지않는다.

매오프시즌병역대상19~27세는계획선택: 이번입대/상무지원/다음시즌검토. 27세가마지막시즌유예,28세시즌시작전해결상태가아니면현역입대. 경고는25/26/27세오프시즌에남은기회표시. 최종입대는갑자기자동진행시키지않고의무확인단계에서멈춤. 의료판정·국외여행허가·실제입영제도세부는게임범위밖.

상무지원:19~27세미해결,직전2시즌경쟁점수로포지션별한정정원선발. 게임모집투수5/야수5,포지션균형우선,지원성공보장없음. 탈락후현역또는다음시즌검토(기한내). 같은모집재지원불가. 같은해대표대회는달력순서상먼저끝난결과만병역선택에반영. 아직열리지않은대회금메달을기정사실로유예하지않는다.

## 7. 복무 18개월 단순 모델

게임복무는모두18개월=첫시즌전체+다음시즌전반72팀경기. 정확한현실일수재현아님. calendarAdvance는 나이·다른팀시즌도진행. 복무동안은부대소속표시,원구단보유권은보존,1군슬롯제외.

상무:별도군체육팀에서퓨처스경기,성장은일반2군식,특별강화블록당1회. 기록은군체육팀/퓨처스구분,1군기록·FA등록누적없음. 복무중일반원구단경기출장없음. 국가대표자격획득으로체육요원대상에 된경우, 게임에서 는 이미진행중복무계획을즉시취소하지않고시즌블록종료에정리, 이중완료보상없음.

현역:야구공식출장0,피로0수렴,첫해성장0, 반년복무성장0, 하지만나이노쇠는경과비율대로1회적용. 제대직후몸만들기6국내경기동안유효능력95%,그후정상. 원본영구능력값을0.95배저장하지않음. 복귀시자동1군보장없고기용경쟁.

체육요원:자격획득→오프시즌편입확정→ATHLETE_SERVICE(국내경기가능)→게임3시즌의활동의무기간후COMPLETED. 매오프시즌의무활동확인선택,현실시간봉사미니게임/개인정보입력없음. 기초훈련은오프시즌서사에서 처리, 기간단축보상없음. 실제법정기간/봉사시간의정확한시뮬레이션이아닌단순모델임을도움말에명시. 의무를무시해법률위반하는선택은제공하지않는다.

계약:상무/현역기간은원구단계약시계일시정지,원구단연봉지급0,구단예산예약해제. 남은계약을복귀날재개하되부분시즌은경기분율로산정. FA등록도미포함. 체육요원은경기활동가능하므로정상계약/등록판정. 이것은게임경제규칙으로실제계약법규주장아님.

## 8. 구단 운영과 내 선수 투입

구단모드도동일대표명단·대회·병역엔진을사용. 감독은대표차출결과를확인하고선수본인의참가의사를설정하되단순국내경기이점때문에모든대표를강제사양시키는AI는없음. 대표휴식창으로국내진행은같이멈춤. 복무입대/복귀알림에대체로스터추천. 가상선수만으로운영해도병역사건발생.

보관선수19세투입 시병역처리(사용자확정U, 14 R05·R21, [32](32-USER-IMPORT-REBIRTH.md)): 병역대상 복사본은 원본 상태와 무관하게 UNRESOLVED로 다시 시작하며 원본의 COMPLETED/ATHLETE_ELIGIBLE/ATHLETE_SERVICE·메달 혜택을 승계하지 않는다. 타깃 구단 세계의 병역대상 설정이 비대상이면 NOT_APPLICABLE이다. 원본의 완료 이력을 이유로 비대상으로 바꾸지 않는다. 복무중은원칙적으로은퇴/보관대상이아니며불완전snapshot은투입거절. 과거국제성적은출처탭에만,새구단국제기록0, 동일메달보상재적용없음. 이전의 ‘원본 완료→복사본 완료’ 기본안은 폐기했다.

## 9. 추가 상태·화면·데이터

커리어:STYLE_SELECT / SPECIAL_TRAINING / NATIONAL_SELECTION / INTERNATIONAL_PLAY / INTERNATIONAL_RESULT / MILITARY_PLAN / MILITARY_APPLICATION_RESULT / MILITARY_SERVICE / RETURN_READY를추가. 되돌아갈resumePhase/competitionId필수.국제대회중에는국내ADVANCE거절, 정상국내복귀후다음명령허용.

S22 스타일선택:현재·후보카드·장단점·이번시즌변경잔여·적용미리보기.
S23 특별강화:남은1회·대상능력·성공확률·상한반영상승값·피로비용·결과전후.
S24 국가대표:대회명·해당연도·명단·내역할·참가/사양·병역효과있음/없음.
S25 대회:조순위/대진·다음상대·내기록·출전상태·결과/메달.
S26 병역계획:상태·게임유예한계·상무조건/지원·현역선택·다음기회.
S27 복무/복귀:18개월진행(1시즌+72경기)·누적복무기간·원구단보유권·성장/기록·복귀경쟁.

추가필드:playStyle,styleChangesUsed,derivedArchetype,trainingUsageBySeason,militaryState,militaryProgram,serviceProgressMonths,athleteDutySeasonsRemaining,nationalEligibility,internationalRecords,tournamentCalendar,competitionState,resumePhase. Tournament별selectionId/resultId/militaryBenefitApplied를보관.

명령:SET_PLAY_STYLE,START_SPECIAL_TRAINING,ACCEPT_NATIONAL_CALLUP,DECLINE_NATIONAL_CALLUP,ADVANCE_INTERNATIONAL,CHOOSE_MILITARY_PLAN,APPLY_SPORTS_UNIT,ADVANCE_SERVICE,CONFIRM_RETURN,CONFIRM_ATHLETE_DUTY. 모든명령expectedRevision/commandId규칙공통. 메달/병역혜택은 UNIQUE(playerId,competitionId,benefitType)와같은상태키로1회만적용.

## 10. 이벤트

E41~55의최신본문/선택/조건은45와event-catalog-v2.json. 이문서의구전술직접가산선택은폐기하고분야명령으로만적용.

## 11. 검증추가

T31 스타일변경후과거성적불변/선택횟수/로그확률정규화.
T32 강화성공/실패/상한/횟수/재시도,건너뛰기후다른시즌으로횟수오염없음.
T33 대회미개최연도없음/가상달력도움말/동일해다중대회중복혜택금지.
T34 선발탈락/사양/미출전메달에임의병역완료없음.
T35 AG금/올림픽동자격,AG은/WBC우승은변경없음.
T36 상무탈락후탈출,현역18개월/나이+1.5시즌표현일관성,경기동시출장불가.
T37 제대부상/피로/계약재개/FA등록정지/자동주전없음.
T38 국가대표기록국내합산없음,강화와상무상태충돌검사.
T39 원본완료선수19세복사시병역완료유지, 미해결원본은미해결,원본불변.
T40 메달/복무결과응답유실재시도혜택1회,웹/APK이중지원차단.

남은검토:공식대회명표기/달력모드, 병역기본ON/OFF설정위치, 19세복사본병역계승정책, 국제대회 추가연장엔진의 실행 검증.모두문서검토대상이며구현 미착수.

---

<!-- SOURCE: 13-MLB-CAREER.md -->

# 13. 미국 직행·포스팅·MLB 커리어

2026-10-16 / v0.6. 사용자 확정 요구로 고교 졸업 직후 미국 진출과 KBO 포스팅을 v1 필수 기능에 편입한다. 이전의 해외진출 후속 범위 표기는 폐기한다. 실제 앱 구현은 시작하지 않는다.

## 1. 진출 경로

**고교 직행:** 고교 시즌 → 진로 선택 → 미국 구단의 국제 아마추어 계약 제안 → 계약 → 마이너리그 → 상위 레벨 승격 → MLB 콜업 → MLB 커리어/FA 또는 국내 복귀.

**포스팅:** KBO 커리어 → 게임 자격 충족 → 원구단 승인 요청 → 승인/보류 → 협상창 → MLB/마이너 계약 비교 → 미국 이적 또는 원구단 잔류.

**해외 FA:** KBO에서 게임상 해외 FA 자격 충족 → 원구단 포스팅 승인 없이 해외 제안 검토 → 미국 진출. 국내 FA와 해외 자격은 별도 필드로 둔다.

고교 직행은 MLB 구단과 계약하는 길이며 즉시 메이저리그 주전을 뜻하지 않는다. UI 버튼은 '미국 프로 진출'로 쓰고 계약 레벨을 명시한다. 국내/미국 어느 길도 성공을 보장하지 않지만 실패 뒤 재도전/복귀/은퇴 경로가 있어야 한다.

## 2. 공식 자료와 게임 규칙

국제 아마추어 계약은 미국 드래프트와 구분한다. 근거: https://www.mlb.com/glossary/transactions/international-amateur-free-agency-bonus-pool-money

포스팅은 원구단을 통한 해외 협상·이적 절차를 참고한다. 근거: https://www.mlb.com/glossary/transactions/korean-posting-system

MLB 정원·계약과 선수 등록은 상위/하위 명단을 구분하는 구조를 참고한다. 근거: https://www.mlb.com/glossary/transactions/40-man-roster

KBO는 실제 포스팅 요청 사례를 공개한다. https://www.koreabaseball.com/MediaNews/Notice/View.aspx?bdSe=11773

아래 자격 연차·보상금·연령·기간·복귀 절차는 별도의 게임 기본값이다. 실제 최신 규약 전체를 구현한다고 표시하지 않는다. 실제 아마추어 보너스풀·노사협약·국외여행 허가를 게임 금액/허가로 대체해 현실적으로 가능하다고 주장하지 않는다.

## 3. 고교 졸업 진로 선택

HS_RESULT 뒤 CAREER_ROUTE로 이동. 'KBO 드래프트 도전'/'미국 구단 제안 확인'을 동등한 선택 카드로 제공한다. 미국 제안 보기만으로 KBO 지명권을 포기하지 않는다. 미국 계약을 최종 수락하면 같은 졸업 연도 국내 드래프트는 종료한다. 이미 국내 계약을 수락했다면 고교 직행 버튼을 다시 사용할 수 없다.

사용자확정U(2026-10-21): 미국 스카우트 평가=roleScore×.5+해당 고교/대학 보정성적지수×.3+스카우팅 잠재력 범위의6능력 중앙값 평균×.2+seed변동[-5,5). 최종 평가65 이상만 제안후보다. 종합52와 별도 아마평가50 문턱은 폐기한다. 평가65 이상에서도 유효 제안·학적/권리/계약 자격을 모두 확인해야 미국 진로를 표시한다. 제안은 최대3구단이고 재조회로 평가를 다시 뽑지 않는다. 잠재력은 평가 범위를 사용하고 숨김 실제 P를 직접 쓰지 않는다. 제안0이면 미국 카드를 숨기고 국내/대학 등 합법 진로를 유지한다. 미국 직행은 마이너 계약이며 MLB 진출/승격을 보장하지 않는다.

계약 카드: 구단/초기 레벨/계약금/연봉/보유기간/성장 환경/포지션 경쟁/병역 안내. 초기 Rookie 또는 A, 제안점수70이상은 A로 시작. 18세가 바로 MLB 계약을 받는 별도 예외는 v1에 두지 않는다. 실제 계약 성립 절차의 단순화임을 표시한다.

계약금(게임): $50,000~$2,000,000,기존 금액곡선의 제안점수50~90 선형(현 자격은65 이상, 금액곡선 자체는 유지). 마이너 연봉은 게임 $30,000/시즌, 초상위 계약금만으로 능력치상승없음. 계약금은1회 지급·통산수입에만 포함,사용자 결제자원 아님. 미성년 서명·비자 서류 실제 입력을 요구하지 않는다. 기본계약 보유기간6시즌,나이와자유계약자격은연차필드별도.

## 4. 마이너리그와 콜업

레벨: Rookie → A → AA → AAA → MLB. 게임 일정 Rookie60/A100/AA120/AAA144/MLB162. 미래 실제 MiLB 일정의 재현 아님. 각 MLB 구단마다 위4개 육성팀과 가상 선수풀 생성,MLB는30구단. 생성된선수ID는상위팀승격해도유지.

미국도 같은1~100절대능력치척도를 사용. 진출만으로능력치0.8배하지않는다. MLB 상대선수분포가높아성적변화가발생하게 한다. 레벨기준OVR Rookie35/A45/AA55/AAA65/MLB75. 주전경쟁 점수는08의 OVR/성적 혼합을 사용하되 성적지수 중심은 레벨별기준OPS/ERA(초안 .700/4.00)로정규화. 기준값은분포검증후조정.

24경기마다 승격 검토: 레벨기준+5이상 경쟁점수,최소타자80PA/투수SP60outs/RP30outs,상위자리여유가있으면1레벨승격. 강등은레벨기준-10미만이2회연속,부상재활은별도재활배치. MLB 콜업은AAA+상위명단자리+역할경쟁점수75이상. 계약상MLB등록이면하위시작조건을생략하되기용보장없음.

핵심 명단은 MLB26명/확장계약명단40명. 상위명단이꽉차면AI가정리해자리를만들거나콜업보류사유표시. 마이너옵션3시즌,옵션연도소모는해당시즌마이너배치20경기이상으로단순화. 소진후강등은해당선수에게마이너잔류동의/FA선택이필요하며엔진이동일단계를건너뛰지않는다. 실제웨이버권리/Rule5/연봉조정전체는v1제외하고'계약정리'대체규칙을도움말로설명.

커리어 진행은 시즌단위 UI를유지하며구간별콜업/강등/계약사건에서중지. 첫메이저콜업·첫출전·첫안타/승·올스타·PS·우승을별도타임라인. 2군/마이너생활을실패엔딩으로즉시종료하지않는다.

## 5. KBO 포스팅

게임 자격: KBO1군등록7시즌(시즌100등록경기충족) 이상,계약보유,병역COMPLETED/NOT_APPLICABLE. ATHLETE_SERVICE는편입확정후국내활동중이므로해외이행요건미확인상태로자동허가하지않고게임에서는활동의무완료후허용. 이 제한은게임기본안이다. FA등록연차와포스팅등록연차를별도계산해설정변경시혼동방지.

오프시즌 '포스팅 요청'에 자격 체크리스트와 남은조건 표시. 요청 횟수시즌1회,통산상한없음. 구단승인점수=최근성적지수×.6+역할OVR×.4,65이상승인,미달보류. 팀의우승확률만으로영구거절하지않는다. 결정은난수재추첨없이점수기반,보류시다음시즌재요청가능. 구단모드에서사용자구단은승인/보류직접결정,AI는동일점수기준.

승인→협상창30게임일. 국내리그는오프시즌이며날짜만증가. 제안은기간1~5년/통화USD/계약종류MLB또는MiLB/연간보장액/초기역할/명단상태를표시. 제안생성시점에확정하고새로고침마다바뀌지않음. 역할OVR75이상은MLB제안후보,65~74는마이너+캠프후보,미달은제안없음. 실제제안수는0~3,같은 구단 중복 없음.

MLB연봉기본게임식=clamp(max($800,000,(OVR-65)×$400,000)×(.8+.4×최근성적지수/100),$800,000,$40,000,000). 성적보정후에도최종최저$800,000보장(2026-10-27 U). 제안기간은계약시작시즌나이≤29 5년/30~32 3년/33~35 2년/36이상1년(2026-10-27 U). 실제최저연봉표가아닌게임값. 포스팅보상금은보장총액20%독자단순식,MLB구단이KBO구단에지급하며선수연봉에서차감하지않는다. 원화구단예산반영환율은아래고정환율적용.

계약체결:원구단활성계약종료→해외보유권/복귀연결기록→미국계약→이적→로스터대체를한명령으로 커밋.협상실패/전제안거절/기한만료면원구단기존계약그대로복귀,제안연봉/보상금지급없음. 포스팅승인만으로선수를FA로풀지않는다.

## 6. 해외 FA·MLB FA

KBO해외FA게임자격은1군등록9시즌으로제안,포스팅보상금없음,원구단승인불필요. 국내FA8시즌과분리해UI에'국내FA/해외FA'각각표시. 병역출국제약은같은게임조건사용. 해외FA후제안없으면국내FA시장으로이어져무소속소프트락방지.

미국MLB FA는게임MLB등록6시즌(각162경기일환산172등록일을현실그대로재현하지않고100등록경기기준)로단순화. 마이너보유기간끝나면마이너FA,동일해MLB계약중이면계약우선. 조정연봉은자동재계약산식으로대체하고서비스타임조작메뉴없음.

MLB단장모드는요구범위밖. 다만KBO구단모드의AI세계에도해외진출/귀환이존재하고포스팅수입·선수공백이반영된다.

## 7. 병역·국가대표와 해외

고교직행은미해결이어도선택가능한게임진로이며현실출국허가보장을뜻하지않는다.12의해외미해결상태와동일게임유예기한관리. 매미국오프시즌대표/복무/계약순서검토,28세시작전미해결은미국계약일시정지후복무경로로이동. 외국팀계약중에동시에국내경기출전금지.

상무지원은미국계약동결/해지선택과함께국내복귀보유권을검사. 미국계약동결은구단동의와복귀옵션이제안서에있을때만가능;없으면계약종료후지원. 미국구단에국내보류권이있는것처럼서술하지않는다. 복무완료시유효복귀옵션있으면해당미국구단캠프,없으면미국FA또는국내복귀선택. 보관함원본은이모든이력유지.

해외한국선수도대표후보풀에포함. WBC/올림픽/프리미어12는국제규칙허용하에가상차출,아시안게임은게임선발규칙적용. 미국계약의대표차출허용설정은제안시명시. 불허면선발전'구단미동의'사유표시,선발되었다가이유없이사라지지않음. 대표출장중MLB/마이너리그도공통휴식창을적용하는독자세계달력으로국내와일관성유지.

## 8. 국내 복귀

원래KBO경력선수:미국계약정리→복귀의향→국내보유권조회→원구단복귀협상또는FA시장. 포스팅이적전KBO보유권을snapshot으로남기며무조건자유계약으로돌아오지않음. 해외FA로떠난선수는국내FA제안. 원구단거절/계약실패는국내다른제안가능여부를보유권정책에따라표시하고1시즌재도전또는은퇴선택제공.

고교직행선수:미국계약종료→국내복귀신청→게임2시즌복귀준비→국내드래프트. 2시즌은실제규약이라고표시하지않는게임설정. 미해결이면일부기간복무와연결하되군18개월+나머지준비6개월,같은시간을따로두번더하지않음. 완료/비대상은독립리그2시즌으로성장/기록별도. 국내복귀준비시작후해당경로의최대종료나이전까지끝낼수있는지미리표시,드래프트종료상한게임35세. 불가면미국재계약/은퇴선택으로이어짐.

35세상한은아마추어복귀드래프트게임규칙으로KBO경력자의보유권복귀에는적용하지않음. 국내드래프트탈락뒤66의잔여준비예산과게임나이/보유권을검사,귀국의무준비는선택형준비예산불소모. 복귀준비단계에서선수가원구단과미국구단에동시에등록되지않음.

## 9. 리그·돈·기록

MLB게임일정30팀각162경기. 상대29팀×5경기=145,추가17경기를리그단위정규그래프로배분해총2430경기,구단홈81/원정81검증.실제디비전일정재현아님. 일정생성실패 시임의누락금지.PS는각리그15팀중상위6:1/2위부전승,3-6/4-5 3전2선승→DS5전3선승→CS7전4선승→WS7전4선승. AL/NL별순위,정규동률규칙은기존상대전적/득실/seed. 마이너PS는v1제외,승격기록과시즌결산중심.

KBO와MLB성적은분리. 전체커리어표의탭KBO/MLB/MiLB/국가대표/전체이력. 전체이력은각리그원시기록합과연도표를보여주되통합타율/ERA를대표기록으로쓰지않고리그별표시우선. KBO1000안타와MLB1000안타별도업적,합산2000은'프로전체'명시. 마이너성적을메이저수상자격에포함하지않음.

돈은currency+amount정수,원화/달러를혼합정수합산하지않음. 비교용게임환율$1=₩1,300을세이브생성시고정,현실환율이라고표시하지않음. 보관함통산수입은통화별합계와게임환산참고값분리. 계약금·연봉·포스팅보상금원장을분리해선수수입에구단보상금을넣지않음.

## 10. 상태·화면·데이터

추가상태 CAREER_ROUTE / US_AMATEUR_OFFERS / US_PRESEASON / US_SEASON / POSTING_REQUEST / POSTING_NEGOTIATION / US_CONTRACT / US_FREE_AGENCY / RETURN_ROUTE / RETURN_PREPARATION / RETURN_DRAFT. 각중간상태resumePhase/보유권/기한필수. 메뉴에이유없는비활성버튼대신자격체크리스트제공.

S28 졸업진로선택:국내/미국,마이너출발안내,취소복귀.
S29 미국제안비교:계약종류/레벨/계약금/연봉/기간/병역·차출조건.
S30 미국커리어홈:레벨사다리/현재팀/콜업조건/리그별기록.
S31 포스팅요청:등록연차/병역/승인조건,승인·보류결과.
S32 해외협상:30일창/제안들/마이너계약주의/잔류.
S33 국내복귀:출신경로/보유권/대기기간/병역겹침/드래프트예정.

필드 routeOrigin,leagueId,organizationId,affiliateId,usLevel,internationalSigning,postingEligibility,postingHistory,negotiationDeadline,reserveRights,mlbServiceSeasons,minorControlSeasons,optionYearsUsed,returnProgram,contractsByCurrency,careerRecordsByLeague. 계약ID는리그이동해도이력보존,활성계약만1개.

명령 CHOOSE_CAREER_ROUTE,ACCEPT_US_AMATEUR_OFFER,REQUEST_POSTING,RESOLVE_POSTING_REQUEST,ACCEPT_US_OFFER,DECLINE_US_OFFERS,REQUEST_RETURN,ADVANCE_RETURN_PREPARATION,ACCEPT_RETURN_CONTRACT. UI이벤트선택과서버명령의원자적처리는기존멱등규칙공통.

## 11. 추가 사건 E56~E69

| ID | 사건/본문 | 선택/결과 |
| --- | --- | --- |
| E56 졸업 뒤의 두 길 | '국내 지명과 미국 구단의 관심, 어느 길을 먼저 볼까요?' | KBO참가/미국제안조회.조회만으로확정안됨 |
| E57 바다 건너의 계약서 | '첫 시작은 메이저 무대보다 작은 구장일 수 있습니다.' | 계약/국내경로복귀 |
| E58 낯선 클럽하우스 | '언어도 준비도 낯설지만 오늘의 훈련은 시작됩니다.' | 기본집중계획/컨디셔닝,과도한별도보너스없음 |
| E59 다음 레벨의 문 | 승격조건충족. '한 단계 높은 팀에서 기회를 받았습니다.' | 승격확인/현재레벨준비요청(24경기뒤재검토) |
| E60 메이저리그의 전화 | '구단이 메이저리그 합류를 알렸습니다.' | 콜업확인,첫출전과분리 |
| E61 다시 내려가는 길 | 강등확정조건. '상위 명단에 남지 못했습니다.' | 마이너재도전/권리있을때만FA선택 |
| E62 포스팅을 요청하다 | '국내에서 쌓은 시간 뒤에 새로운 무대를 생각합니다.' | 승인요청/잔류 |
| E63 구단의 대답 | '원구단이 요청에 답했습니다.' | 승인시협상/보류시이유확인 |
| E64 협상의 끝 | '제안과 남은 시간을 함께 봅니다.' | 조건확인후계약/원구단잔류 |
| E65 처음 선 빅리그 | 실제첫출장. '명단의 이름이 경기 기록의 이름이 됐습니다.' | 첫출장기록,능력즉시상승없음 |
| E66 미국에서 맞는 FA | '새 팀과 새로운 역할을 고를 수 있게 됐습니다.' | 제안비교/국내복귀검토 |
| E67 돌아갈 그라운드 | '다시 국내에서 뛰는 길을 확인합니다.' | 보유권복귀/직행선수준비프로그램 |
| E68 기다림도 커리어 | '복귀를 준비하는 시간이 지나갑니다.' | 복무/독립리그블록진행 |
| E69 두 리그의 마지막 인사 | '어느 리그의 기록도 다른 기록을 지우지 않습니다.' | 리그별기록보관,은퇴로통합 |

이로써기획카탈로그는E01~E69. 실제연결검증·문구렌더링은미완료.

## 12. 수용 테스트 T41~T50

T41 국내계약확정후고교미국직행명령거부,미국제안0개후국내진행가능.
T42 고교직행의마이너출발/승격/강등/실제MLB첫출장/리그별기록분리.
T43 포스팅자격미달/승인거절/제안없음/거절/기한만료시원구단계약유지.
T44 계약체결에만보상금1회,선수연봉차감없음,동시국내외계약불가.
T45 미국162경기/홈81/2430총경기와마이너일정,동일날두레벨출장차단.
T46 병역기한/미국계약정지/복귀옵션/대표차출허가일관성.
T47 고교직행귀국준비2시즌과복무18개월중첩,나이/노쇠/연차중복계산없음.
T48 KBO경력복귀보유권과고교직행드래프트복귀구분.
T49 USD/KRW표시/합계/고정게임환율,포스팅금수입귀속정확성.
T50 MLB은퇴선수보관/19세가져오기시능력치그대로·국제/MLB원본기록보존·새구단기록0.

구단명목록/구단이미지,마이너리그성적분포,해외계약/반환규칙상세도움말은후속설계검토에서확정. 선수모드해외경로는필수이며구단운영의MLB단장모드는자동추가하지않는다.

## 2026-10-21 미국 직행 제안 기한 U

사용자는 미국 직행 제안을 제안 후30게임일 동안 유효하게 유지하는 안을 선택했다. 발급일 포함 issuedWorldDay≤현재일<issuedWorldDay+30에서만 수락 가능하며30일 경계부터 만료다. 만료/전체 거절/다른 진로 확정 후 같은 졸업시즌의 제안을 다시 생성하지 않는다. 제안 열람은 국내/대학 진로를 닫지 않으며 만료해도 현재 합법 진로를 유지한다. 날짜 진행/기한과 제안 점수·구단·계약 조건은 저장하며 조회/복원으로 재추첨하지 않는다.

## 2026-10-21 미국 초기 능력 분포 U / 구성 D

사용자는 Rookie35·A45·AA55·AAA65·MLB75를 중심으로 표준편차4·평균±8 범위의 종 모양 초기 NPC 분포를 선택했다. 구현은 표준정규 z를[-2,2]에서 조건부 추출한 뒤 중심+4z를 정수 반올림한다. 4는 절단 전 모형의 표준편차이며 절단 후 관측 표준편차가 정확히4라는 뜻은 아니다. 구단별 극단값 인원을 강제로 맞추지 않는다.

초기 로스터는23의 마이너 최소 야수12·투수10과 MLB26을 사용해 조직당114명/전체30조직3,420명으로 구성한다. 마이너 투수 SP4/RP4/CP2,MLB 투수 SP5/RP6/CP2와 야수13명은 구현 기본값 D다. 초기 나이 범위는 Rookie18~22/A19~24/AA20~27/AAA21~32/MLB22~38의 D이며 장기 성장·은퇴 분포 V가 아니다. 전체6능력 평균을 맞추고1~100 상한을 지키며, NPC를 치트 사용자 소유 선수로 취급해 잠재력100을 강제하지 않는다.

## 2026-10-26 미국 시즌 급여·부상·육성·첫 콜업 — 사용자 확정 U

마이너 시즌 연봉 $30,000은 모든 미국 레벨이 공유하는 정규시즌 첫 날짜부터 마지막 날짜까지 분할 지급한다. 승강으로 분모/이미 지급한 금액을 바꾸지 않는다. 매 날짜 누적 정수 권리액의 차액을 지급하고 마지막 날짜에 정수 오차를 정산한다.

부상으로 경기 인원이 부족하면 같은 조직의 건강한 선수를 우선 보충한다. 다른 레벨의 최소 경기 인원을 해치면 낮은 능력의 임시 선수만 필요한 만큼 충원한다. 원래 부상 선수의 신원/기록을 삭제하지 않는다. 임시 능력35~45는 기존 비상 선수 공통 수준을 재사용하는 구현 D다. MLB26명은 유지하고 교체된 부상 선수/역할은 조직 예비 명단에 보존하며 복귀 후 원래 자리에 복원한다. 임시 선수의 과거 경기 기록은 제외하지 않는다.

특별강화는 현재 레벨 시즌 경기 수의1/3(올림), MID 플레이스타일은 절반(올림)에 연다. Rookie60경기는20/30, A100경기는34/50이다. 승격/강등으로 세계 시즌당 강화1회·MID 변경1회를 초기화하지 않는다. 구종 숙련 치트3배·능력 상한100은 기존 결정을 유지한다.

첫 MLB 콜업은 기존 게임 최저 기준 연 $800,000을 콜업 다음 날짜부터 일할 적용한다. 이미 받은 마이너 급여와 계약금은 그대로 보존한다. 기존 $30,000 예약과 겹치는 부분을 빼고 추가 잔여 보장액만 구단 예산에서 예약한다. MLB 등록/콜업 수락을 실제 첫 출장으로 기록하지 않는다. 이후 FA·재협상은 기존 가치 산식을 따른다. 현실 최저연봉/노사협약을 재현한다는 뜻은 아니다.

구현/검증 상태는 implementation의 최신 인계를 따른다. 이 결정 기록 자체가 전체 미국 커리어 완료 증거는 아니다.

## 2026-10-26 MLB PS 구현 기본값 D

서버가 제공하는 고정 AL/NL 소속 각15개 조직으로 정규순위를 따로 계산한다. 인터리그 경기도 시즌 승패에 포함하며 동률 그룹 상대전적은 해당 리그의 동률 팀끼리만 비교한다. WC3-6/4-5 승자가 각각 DS2위/1위와 만나며 재시딩하지 않는다. 게임 홈 배치는 WC 전 경기 상위시드, DS2-2-1, CS/WS2-3-2다. WS 홈 우선은 전체 MLB 정규순위(기존 승률·동률 규칙)다. 이 배치는 구현 기본값이며 실제 노사협약/현실 일정 재현을 주장하지 않는다.

PS 경기의 타석·구종 XP·부상·피로·공식 기록·특성은 같은 경기 엔진으로 처리한다. 정규 공통 급여를 PS에서 다시 지급하거나 연간 성장 예산을 새로 만들지 않는다. 경기 결과/통계 영수증과 브래킷은 JSON 재개와 연말 검증에서 함께 검사한다. 미국 정규8790경기 실주행과 PS 실제 엔진 검증은 서로 다른 증거로 표시한다.

## 2026-10-26 사용자 확정 — 은퇴 공석 공급

미국 NPC가 은퇴해 생긴 빈자리는 같은 조직 아래 레벨 선수의 승격을 우선 사용하고 신인은 Rookie에만 보충한다. 상위 레벨 평균 능력의 외부 선수 직행 생성은 사용하지 않는다. 이동만으로 능력/잠재력/기록을 바꾸지 않고, Rookie 신인은 기존 평균35·표준편차4·±8 분포를 사용한다. NPC 잠재력의 기존 난이도 규칙도 유지한다. 조직 내 승격·최소 선수단 충원과 장기 리그 균형은 구분해 검증한다.

## 2026-10-26 U — MLB 부상 등록과 FA 서비스

사용자는 MLB 등록을 유지한 부상 기간도 시즌100등록경기/6등록시즌 FA 계산에 포함하도록 확정했다. 출장 PA/outs가 없어도 공식 MLB 정규 등록 영수증이 있으면 센다. 마이너·포스트시즌은 이100경기에 더하지 않는다. 같은 선수·시즌·날짜의 중복 등록은 거부하며 등록 근거가 없는 옛 기록을 출장 수에서 추정해 채우지 않는다.

구현 D: 기존 마이너6시즌 내 연도 전환은 서버 재정 추가 입력을 검증하고 다음 시즌 연봉30000만 예약한다. 원래 계약금·기록·옵션 소모 이력을 보존한다. 메이저 재계약/FA·28세 미해결 병역·45세 다음 시즌은 필요한 선택 없이 자동 진행하지 않는다. 구버전US 루트1/2는 유지하며 실제 다음 해 활성화 명령에서만3으로 확장한다. 상세 구현/제한은 implementation 최신 인계를 따른다.

## 2026-10-27 U — 미국 연봉 최종 최저 보장

사용자는 미국 재계약의 성적 보정 후 최종 연봉도 최소 $800,000으로 보장하도록 확정했다. 기존 기본액에 성적 배율을 적용한 뒤 최종 clamp($800,000,$40,000,000)를 적용한다. 최저 기본액에0.8배가 적용되어 $640,000이 되는 구 해석은 폐기한다. 첫 콜업의 연 $800,000 일할 지급 정책과 기존 지급액 보존은 유지한다. 구현은 후속 미국 재계약 묶음에 연결한다.

## 2026-10-27 U — MLB 제안 기간의 나이 경계

사용자는 계약 시작 시즌 나이를 기준으로29세 이하5년,30~32세3년,33~35세2년,36세 이상1년을 확정했다.33세 이상1~2년이라는 기존 미정 구간을 이 기준으로 교체한다. 첫 콜업의 잔여 시즌 일할 지급 정책은 유지한다.

## 2026-10-27 U — MLB FA 전 자동1년 재계약

사용자는 MLB FA 자격 전의 구단 보유기간에는 매년1년씩 자동 재계약하도록 확정했다. 나이별5/3/2/1년은 FA·포스팅의 MLB 제안 기간에 적용하며, 첫 콜업의 잔여 시즌 일할 계약은 유지한다. 연봉은 기존 미국 가치 산식을 사용하고 성적 보정 후 최저800000달러를 보장한다. MLB등록100경기 기준6등록시즌 FA 판정은 유지하며 이 자동 재계약이 FA 자격을 초기화하지 않는다.

---

<!-- SOURCE: 15-LONG-TERM-RECORDS.md -->

# 15. 장기 운영·기록·명예의 전당

## 연도 갱신과 선수 공급

모든 선수는 선수ID를 유지하며 나이/능력/계약만 갱신. 나이18~44의신규고교유망주를매년KBO100명,미국구단당국제 후보10명(총300명) 생성하는게임기본안. 실제선수 유입통계 재현 아님. FA풀은최소80명,부족하면당해연도'독립리그등록'선수를추가하되스타급무한생성금지(OVR35~50,나이22~30). 어떤선수도계약없이자동으로구단에들어가지않는다.

KBO각팀최소35/최대60,미국각organization게임전체최소100/최대160(MLB26포함),레벨별최소야수12/투수10. 정원초과시은퇴/계약만료/방출의명시사건으로정리. 기록을삭제해서정원만맞추지않음. 고갈시는긴급등록선수최소연봉계약을AI/사용자같은규칙으로제안.

구단AI 오프시즌순서:보장계약확인→은퇴제거→주전/백업포지션공백산출→핵심재계약→부족영역FA제안→드래프트→최소정원충족→캠프. 영입가치=역할개선점수×.6+나이잠재가치×.2+포지션부족×.2,영입가능예산안에서만선택. 계약이좋은선수를새시즌마다방출하는현상은방출보장금비용을점수에반영해억제한다.

KBO 예산120억은기본동일. 시즌수익·시설·물가상승미구현이므로연봉함수금액도연도인플레없음. 미국AI게임예산구단당연$200m,국제아마추어계약금게임한도연$5m(현실보너스풀아님). 팀별통화다름. 30년지나도외부환율/인플레이션으로경제가깨지지않음. 적자는14/08의구제규칙을계정우대없이적용하고기록한다.

## 기록 보존 범위

영구:선수별연도/리그/레벨통계,수상,주요계약,이적,복무,대표기록,보관원본. 경기박스스코어는현재+직전시즌,타석로그는최근5경기. 보존기간지난상세를볼때'시즌합계는유지되며이경기상세는보존기간이지났습니다'표시. 자동백업에는보관당시상세범위만포함. 영구원시통계는상세로그정리후에도재집계할수있게시즌행에확정한다.

랭킹은세이브세계안의리그기록실. 다른사용자공개랭킹/동기화없음. 필터:리그/정규·PS/연도·통산/타자·투수. 동률누적타이틀공동,자격률은규정타석/이닝필터,소수는표시자리반올림전원시비교. 수상은리그별이며KBO/MLB/Olympic목록을섞어MVP한개로만들지않음.

## 명예의 전당

공식협회명예의전당과구별한게임개인기록실. 은퇴선수는전부보관함,조건을충족한선수에'게임 명예의 전당'배지를추가한다. 못들어가도보관·가져오기가능.

평가점수(게임)=정규시즌리그MVP×20+포지션상×5+대표금/우승×5+KBO1군출전시즌×2+MLB출전시즌×4+타자min(40,프로H/100)+min(30,프로HR/20) 또는투수min(40,프로outs/300)+min(30,(W+SV*.5)/10). 프로는KBO1군/MLB만,마이너제외.점수100이상전당,70이상구단레전드,그외커리어보관.같은시즌같은상중복없음.실제 명예의 전당 선발 기준이 아니다.

은퇴페이지:대표리그/최종나이/주포지션→최고시즌→통산리그별표→국제기록→복무/부상/이적타임라인→전당등급→원본능력→보관완료.최고시즌은해당리그기여점수최고,동률출장→이른연도.영구결번은한구단10시즌+구단전당점수70이상시게임배지,실제구단영구결번과혼동금지.

## 장기 플레이 종료

커리어는은퇴까지,구단은사용자수동마무리까지.구단세계시즌최대100회후읽기전용보관을게임안정성한도로표시하고마지막2시즌에안내.세이브원시크기가5MiB를넘으면승인없이성적삭제하지않고경기상세테이블분리마이그레이션으로해결.설계목표50시즌검증,100시즌경계검증.

## 데이터 확인 규칙

연도넘김전모든대회/계약/팀정원/경기결과정합성검사.실패하면'세계갱신실패'요청ID와복구안내, 부분새시즌저장금지.원본보관능력의체크섬은계속유지한다.새규칙버전이생겨도과거전당점수는계산당시버전과같이저장해임의소급강등없음.


확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.

---

<!-- SOURCE: 16-AUTH-OPERATIONS.md -->

플랫폼 후속 계약: [87 로그인·계정 전환](87-PLATFORM-LOGIN-ACCOUNT-HANDOFF.md), [88 업데이트·호환](88-CLIENT-UPDATES-COMPATIBILITY-RECOVERY.md), [89 파일 저장·공유](89-PLATFORM-FILES-DOWNLOAD-SHARING.md)를 적용합니다. 로그아웃은 결과 확인을 무한히 기다리지 않으며 이전 owner의 미확정 요청은 다른 계정에 노출·재실행하지 않습니다.

# 16. 계정·배포·운영 설계

## 기본 배치 결정

설계 기본안은 하나의 Node 서비스에서 Hono API와 빌드된 웹 정적 파일을 함께 제공하는 방식이다. 웹/API 동시 배포와 같은 origin 쿠키를 우선해 소수 사용자 운영을 단순하게 한다. 기존06의 웹/API 별도 호스트 제안보다 이 결정이 우선한다. Android APK는 같은 웹 빌드 자산을 포함하고 운영 HTTPS API를 호출한다. 향후 부하가 생기면 정적 호스트를 분리하되 API 계약은 유지한다.

호스팅 기본 후보는 Render Node Web Service. Node 웹 서비스 배포를 공식 문서에서 확인했다. 이 설계는 유료 플랜 가입이나 실제 배포 승인이 아니며 무료·무중단·성능을 보장하지 않는다. 운영자가 계정/지역/비용을 정한 뒤 환경을 생성한다. https://render.com/docs/deploy-node-express-app

DB/비공개 파일은 기존 지정 Neon 프로젝트를 사용한다. 새 프로젝트를 임의로 생성하지 않는다. 지역 또는 기능 제한이 있으면 기존 보호설정을 해제하지 않고 보고한다.

## 인증 기본 결정

기존 로그인 없음이 확인된 상태에서는 Neon Managed Better Auth를 우선 후보로 한다. 공식 neon-auth 스킬의 권고를 따른다. 이는 `auth: true`를 이미 배포했다는 뜻이 아니다. 실제 프로젝트의 AWS/네트워크 제한과 SDK를 확인하고 적용한다. https://neon.com/docs/ai/skills/neon-auth/SKILL.md

v1 로그인 기능: 이메일/비밀번호, 이메일 확인, 비밀번호 재설정, 로그인/로그아웃, 세션 복원. 소셜 로그인은 추가 기능이며 필수가 아니다. 사용자 비밀번호를 게임 DB 테이블에 직접 저장하지 않는다. 소수 친구는 서버의 허용 사용자 목록에 등록된 인증 subject만 게임 API 접근 허용. 게임 API의 allowlist는 인증 제공자의 계정 생성 허용과 구분한다.

웹은 관리형 SDK를 사용해 인증하고 API에서 검증된 세션/JWT의 subject를 확인한다. 발급 토큰은 만료/issuer/audience/서명을 검증한다. JWKS를 캐시하되 key rotation 시 재조회. 이미 발급된 JWT가 로그아웃 즉시 모두 무효화된다고 주장하지 않는다. 앱 API 세션 레코드가 있으면 서버에서 별도 철회 가능하다.

Android는 시스템 브라우저의 같은 웹 로그인으로 시작해 HTTPS App Link로 복귀하는 계약을 우선한다. 네이티브 세션 교환은 로그인 직후 서버가 만든 일회용 code(60초, 단일 사용, client nonce/PKCE challenge 결합)만 전달한다. access/refresh token을 URL에 넣지 않는다. code는 웹 로그인 세션 subject와 바인딩하고 앱은 verifier로 교환한다. 앱 세션은 서버에 hash로 보관한 opaque refresh secret과 15분 access token, 회전·철회 규칙을 가진다. 자체 비밀번호 인증을 만든다는 뜻이 아니라 외부 인증의 앱 세션 연결이다.

위 연결은 구현 시 관리형 인증과 Android에서 반드시 실증할 항목이다. 지원되지 않는 흐름이면 라이브러리 문서를 재검토하고 임의 우회하지 않는다. Android App Links는 도메인과 앱 연결 설정이 필요하다. https://capacitorjs.com/docs/guides/deep-links

## 계정 상태와 UX

회원가입→이메일 확인→허용 여부 확인→게임 홈. 비허용 계정은 '현재 초대한 사용자만 이용할 수 있습니다'와 로그아웃을 제공한다. 인증 실패는 이메일 존재 여부를 드러내지 않는 공통 안내. 비밀번호 변경/재설정은 제공자 지원 흐름을 사용하고 게임 화면에 임의 이메일 발송 API를 만들지 않는다.

로그아웃은 진행 중 명령의 결과 조회 후 로컬 세션과 사용자 캐시 정리, 세이브 자체 삭제 없음. 계정 삭제는 재인증+명시 확인 뒤 게임 데이터 삭제 job, 외부 인증 계정 삭제, 완료 확인까지 별도 작업으로 처리한다. 실패 시 pending 상태를 유지하며 접근은 제한한다. 운영 백업의 삭제 반영 기간은 최대30일 기본 정책으로 도움말에 기재한다.

## 환경과 배포 명세

환경3개: 로컬 / 개발 / 운영. Neon도 개발 브랜치와 production 분리. 개발을 production 데이터로 쓰지 않는다. 런타임 버전은 착수 시 지원 중 Node LTS와 Capacitor/Android 호환표를 확인해 lockfile/도구파일로 고정하며 지금 특정 최신 버전을 추측해 고정하지 않는다.

예정 명령(아직 존재/실행하지 않음): `npm run dev`, `npm run build`, `npm run start`, `npm run test:engine`, `npm run test:integration`, `npm run android:sync`, `npm run android:release`. 실제 구현자가 이 계약에 맞춰 scripts를 작성한다.

운영 순서: CI 정적검사·빌드·단위테스트→개발 migration→개발 통합/전체경로→운영 백업→호환 migration→API/웹 배포→health/version 확인→스모크→서명 APK→업데이트 테스트. 배포 실패 시 기존 앱 유지, DB를 역삭제하는 무작정 down migration 금지.

릴리스마다 API 최소 clientVersion과 save schemaVersion 공지. APK는 같은 서명키·packageId·증가 versionCode. 서명키는 문서 묶음/Git/ZIP에 포함하지 않음. 운영 키 분실 대비 외부 별도 백업. APK 업데이트 때문에 계정 클라우드 데이터가 없어지지 않아야 한다.

## 운영 수치 기본안

명령 timeout30초, 게임 청크 계산 목표1초 미만, 5초 초과 시 청크 축소 검토. DB cold start는 별도 측정. 사용자당 명령 분당60, 생성 분당5, 백업 시간당10, 로그인 제한은 인증 제공자 정책+API 제한. 실제 사용자 실패가 반복되면 이유를 보고 조정한다.

일반 자동백업 시즌당1, 최근10개+수동최근10개 유지. 삭제된 세이브30일 후 정리. 원본 보관 선수는 숨김으로 처리하고 사용자의 최종 삭제 확인 전 지우지 않는다. 객체 청소는 DB 참조와 job 상태 모두 확인한다. 백업이 아닌 일반 진행은 스토리지 장애에도 작동한다.

## 확인해야 할 실제 환경

Neon 지역/권한/기존 서비스, Auth 사용가능 여부, 운영 사용자 허용목록, HTTPS 도메인/App Links 소유권, 호스트 계정·플랜, Android 개발도구·실기기·서명키. 전부 실환경 확인 전에는 '작동 확인'으로 표시하지 않는다. 설계·인수인계 패키지에는 자격증명 대신 필요한 변수명만 포함한다.

---

<!-- SOURCE: 17-SCREEN-CONTRACTS.md -->

# 17. 전체 화면 계약과 와이어프레임

모든 화면은03의 색·서체·컴포넌트와02의 공통 오류 상태를 공유한다. `design-board.html`은 일부 화면의 시각 검토안이고 이 문서의33화면 전체가 렌더링 검수됐다는 의미는 아니다.

## 기본 구조

모바일: 상단(뒤로/세이브/저장상태) → 제목·그림 → 핵심정보 → 입력/표/선택 → 도움말/오류 → 하단 CTA → 모드 탐색. PC는 동일 우선순위로 정보/선택을2열 배치. API 로딩 중 기존 내용은 유지하고 결과 확정 버튼만 비활성화. 오류 메시지는 관련 입력 옆, 전역 장애는 상단 배너.

## 화면별 입출력

| ID | 읽는 데이터 | 입력/버튼 | 다음 화면 | 필수 예외 |
| --- | --- | --- | --- | --- |
| S01 홈 | 최근 saves.summary, archiveCount | 이어하기/커리어/구단/설정 | 저장 phase에 맞는 화면 | 세이브0개도 새 모드 사용 |
| S02 생성 | 유형/포지션/초기능력 정의 | 이름/투타·투구폼(투수)/유형/집중, 생성 | S03 고교 | 이름·좌투·투구폼검증, 초안취소 |
| S03 커리어 | protagonist,phase,progress,nextActions | 다음이야기/기록/현재계획 | S06/07/22~27 | 명령결과유실/사건대기 |
| S04 고교결산 | 고교기록/평가 | 진로선택 | S28 | 성적0도 진행가능 |
| S05 드래프트 | 지명/계약/미지명 | 수락/재도전/종료 | S03/09 | 중복수락 금지 |
| S06 사건 | 고정된 eventInstance | 선택→확정 | resumePhase | 만료/조건불충족 |
| S07 결산 | season/abilitiesDelta/teamResult | 다음/상세 | PS/S08/S26 | 국가대표/정규기록 분리 |
| S08 계약 | offerId/가격/기간/역할 | 비교/수락/거절/은퇴 | S03/09 | 제안0,기한만료 |
| S09 은퇴 | reason/archiveId/leagueRecords | 보관함/새게임 | S10/S01 | 저장실패 재시도 |
| S10 보관목록 | 소유 snapshot.summary | 검색/필터/정렬/상세 | S11 | 빈목록/숨김 |
| S11 보관상세 | 원본능력/리그별기록/병역 | 새구단사용/출처 | S12 | 원본없음/버전미지원 |
| S12 구단생성 | 팀/가상로스터/선택원본 | OFF/ON/선수선택/대체/생성 | S13 | 0명가능/조합불능 |
| S13 구단홈 | 순위/예산/다음경기/할일 | 1경기/1주일/설정 | S19/S06 | 의무할일에서중단 |
| S14 선수단 | roster/injury/contracts | 필터/선수상세/승강 | S16/13 | 정원/필수포지션 |
| S15 라인업 | 타순/수비/투수계획 | 슬롯→선수/자동/적용 | S13 | 중복/부상/미적용초안 |
| S16 선수상세 | 능력/적합도/계약/출처/좌우 분리 기록 | 기용/계약/보관탭 | 해당상세 | 원본읽기전용 |
| S17 시장 | FA/내제안/예약예산 | 제안금액·기간/철회 | S13/08 | 동시계약/예산예약 |
| S18 리그 | 순위/일정/개인기록/PS | 탭/연도/필터 | S19/16 | 규정미달/보존지난상세 |
| S19 경기 | 점수/이닝/박스/사건 | 이전/다음/복귀 | S18/13 | 진행중경기는종료로표시금지 |
| S20 저장 | save/backup/jobs | 표시명/백업/복원/삭제 | S01/복원세이브 | pending/지원버전/소유권 |
| S21 설정 | localPrefs/account/version | 글자/모션/소리/로그아웃/삭제 | S01 | 계정삭제 재인증 |
| S22 스타일 | 현재/후보/변경횟수 | 선택/유지 | resumePhase | 부상/횟수/투타종류 |
| S23 강화 | 남은회수/대상/상한 | 기본/도전/휴식/건너뛰기 | 결과→resume | 실패재추첨금지 |
| S24 대표선발 | 대회/명단/역할/차출허가 | 참가/사양 | S25/resume | 부상·군복무·허가거절 |
| S25 국제대회 | 조별/토너먼트/내성적 | 다음경기/결산/복귀 | S25/S03 | 미출전/연장중단 |
| S26 병역 | 상태/게임기한/선발조건 | 지원/현역/유예/확인 | S27/03 | 한계연령/탈락 |
| S27 복무복귀 | 블록/계약보유권/예정복귀 | 다음블록/복귀확인 | S03/30/33 | 동시리그등록금지 |
| S28 졸업진로 | KBO/대학/유효미국제안 | 드래프트/학교/조건부미국 | S05/34/29 | 조회만으로진로고정안함 |
| S29 미국제안 | 구단/레벨/통화/조건 | 비교/수락/국내로 | S30/05 | 계약0/확정후되돌림불가 |
| S30 미국홈 | 레벨사다리/기록/계약/조건 | 구간진행/진로 | S06/08/33 | 콜업이실제출장아님 |
| S31 포스팅 | 연차/병역/승인/점수 | 요청/잔류 | S32/03 | 미달이유/시즌재요청불가 |
| S32 해외협상 | 기한/제안/계약종류 | 수락/거절/잔류 | S30/03 | 기한만료시원계약유지 |
| S33 국내복귀 | 보유권/대기/병역겹침 | 경로선택/준비진행/취소 | S05/08/27 | 나이초과/계약정리미완료 |

로그인/가입/확인/재설정/초대제한은 S01의 공통 인증 서브화면으로 취급하고33개 숫자에 임의로 중복계산하지 않는다.

## 추가 화면 와이어프레임

계약: `[구단명·계약유형] → [기간 / 연봉 / 총액] → [예상역할 / 경쟁 / 병역·차출] → [선택 비교] → [최종수락]`.

선수단: `[1군 28/28 | 2군 | 부상] → [포지션검색] → [이름/나이/역할/피로/계약표] → [선택선수 상세] → [승강 적용]`.

라인업: `[타순1~9] + [수비포지션] → [선발5/불펜역할] → [오류슬롯목록] → [자동편성/적용]`. 수비 다이아몬드 그래픽은 보조이며 동일기능 목록을 제공.

복무: `[복무종류 / 경과 12/18개월] → [지난기간별도기록/성장] → [원구단/복귀옵션] → [다음블록/복귀]`.

MLB홈: `[조직/현재제휴팀/레벨] → [Rookie-A-AA-AAA-MLB 사다리] → [이번시즌기록] → [다음승격검토조건] → [다음이야기]`. MLB등록과출전은별도표시.

국내복귀: `[출발경로] → [미국계약상태] → [원구단보유권 또는 복귀준비] → [군복무와겹치는기간] → [예정드래프트/계약] → [선택확정]`.

## 화면 통과 기준

모든 CTA는 nextActions에있는명령만표시. 잘못된화면주소직접접근은현재상태화면으로안내. 360px/390px/768px/1280px,200%확대,키보드,이미지로드실패,서체로드실패,이름12글자,계약금긴숫자,표0/100행을시각검수한다. 이문서는그테스트의대상명세이며실제통과증거가아니다.


## 추가 화면 v0.8

S34 대학선택/S35 대학홈/S36 스카우트/S37 예산. 전체입출력과상태문구는[46](46-ALL-SCREENS-FLOWS.md),[화면카탈로그](screen-state-catalog.json). 기존33종과합37종이다.


2026-10-19 사용자필수:웹·APK중단후이어하기. [76 이어하기계약](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의홈최근게임/서버resumeDescriptor/송신전저널/receipt재조회/경기·선택·작업복원과12검수시나리오를적용한다. 서버확정진행은종료이벤트와무관히보존,미송신초안은별도기기선호다. 미리보기/확정의복구는[74](74-PREVIEW-COMMAND-RECONCILIATION.md).

---

<!-- SOURCE: 18-PATH-WALKTHROUGHS.md -->

최신 가져오기 규칙: [사용자 결정32](32-USER-IMPORT-REBIRTH.md). 아래의 능력치 그대로/기존잠재력·병역혜택 계승 제안은 폐기되며, 능력별 최고50%·상향잠재력·병역재시작으로 읽고 관련 기대값을 교체한다.

# 18. 전체 경로 시나리오 점검

아래는 엔진 실행 결과가 아니라 문서 상태 전이 검토다. 예시 성적과 선발 결과는 테스트 fixture의 입력값이며 확률 보장이 아니다. 각 경로에서 진행·포기·실패의 종착점을 정의한다.

## A. 국내 타자 → 대표팀 → 은퇴 → 구단

18세 생성→고교집중→고교진행→강화선택→고교결산→국내진로→지명수락→19세프리시즌스타일→2군→20경기콜업검토→1군기회→시즌결산/성장→재계약. 반복 중 국가대표선발→참가→실제출장→AG금→자격확인→체육요원편입→활동의무3시즌→완료. 은퇴확정과보관을한번커밋. 원본41세의컨택72/파워64를구단새게임에서19세/능력별커리어최고50%/새상향잠재력/병역미해결/기록0으로복사. 원본41세기록불변. 구단생성시내선수OFF를골라도전체구단플레이가능.

확인점: 능력치와 원본나이를혼동하지않음,금메달이바로'병역면제'가아님,명예의전당미달도보관가능.

## B. 국내 투수 → 상무 탈락 → 현역 → 복귀

고교투수생성→KBO입단→RP→SP경쟁요청→실제기용검토→2시즌뒤미해결병역계획. 상무지원1회확정→탈락→기한내면유예/현역. 예시는현역선택→계약남은기간정지→18개월블록진행(시즌+전반)→공식기록0/나이는달력대로→복귀→6경기조정→원구단기용경쟁→다음시즌. 유예를반복해28세시작에무기한회피할수없음.

확인점: 탈락후같은선발재추첨금지,부대와원구단동시출전없음,군복무중등록연차누적없음,강제주전보장없음.

## C. 고교 미국 직행 → MLB 성공

고교결산→미국제안조회→A레벨계약수락→동일졸업연도KBO진로종료→A/AA/AAA에서기록/잠재성장→콜업조건+40명자리→MLB등록→실제첫출장→MLB성적/수상/FA. 국제대표기록은MLB합계밖. 병역미해결이면해외체류자도게임기한검사. 해결뒤미국복귀옵션있으면캠프,없으면FA/국내복귀.

확인점: 미국계약이메이저출전보장아님,콜업없는마이너시즌도진행가능,미국리그가갑자기영구능력을깎지않음.

## D. 고교 미국 직행 실패 → 국내 복귀

마이너재계약실패→국내복귀검토→미국계약정리→고교직행보유권없음확인→2시즌준비. 미해결이면18개월복무+나머지6개월준비,이미완료면독립리그2시즌. 게임드래프트종료나이35세확인→지명/미지명→1회재도전가능조건검사→계약또는은퇴·보관.

확인점: 2년+군18개월을중복가산하지않음,대기중원구단이있는것처럼표시하지않음,나이초과면시작전이유와다른경로제공.

## E. KBO 포스팅 실패/성공

등록7시즌/병역조건충족→원구단승인요청. 점수미달이면보류/다음시즌가능. 승인후협상30게임일→제안0/거절/기한만료면기존KBO계약유지. 성공fixture는계약수락→보상금구단입금1회→기존계약종료→미국계약1개활성→MLB/AAA시작. 재시도는같은결과,추가보상금없음. 복귀시KBO보유권조회후원구단협상.

확인점: 승인만으로국내보유권삭제안됨,포스팅보상금을선수수입에넣지않음,직행복귀2시즌과경력선수복귀혼동금지.

## F. 대표팀 실패와 병역 미해결

선발탈락→국내시즌계속. 선발후사양→대회혜택없음. 참가후미출전메달→게임자격미달. AG은/동→미해결유지. WBC우승→국제명예/사기만,병역변경없음. 올림픽실제출장동메달→편입자격. 어느분기도정규시즌기록에대표안타를합산하지않음.

## G. 내 선수 없는 구단 3시즌

구단생성OFF→가상로스터/라인업검증→1주일씩진행→부상콜업추천→시즌결산→은퇴/계약/FA3라운드→드래프트→최소정원보충→다음시즌. 모든강한선수의동시FA나방출보장액으로예산부족이면보호예산/명시적재정지원탈출. AI다른팀에도동일규칙. 세계시즌3년지나도선수생성seed/원시기록연결유지.

## H. 저장·복원·두 기기

웹revision10과APKrevision10. 웹명령커밋11→APK요청409→최신조회11. 웹응답유실후동일commandId는원래결과11반환. 은퇴보관트랜잭션실패면둘다미완료,성공응답유실후재시도는보관ID한개. 백업실패는일반저장과분리. 복원은새saveId/revision0,원본/기존진행삭제없음. 로그아웃후다른계정은해당데이터조회404.

## 공통 소프트락 점검

제안0/정원초과/예산부족/경기연장/대회미선발/강화상한/잠재력상한/병역기한/복귀연령초과/구버전앱 각각 이유+해결행동을제공. 가능한행동이진짜없으면수동은퇴/읽기전용복구중하나를명시하고빈화면으로보내지않는다.

실제 시뮬레이션과 UI 테스트는07 및12/13의 T01~T50을 구현한 후 실행한다. 이문서의경로검토를자동테스트통과로보고하지않는다.


장기후속66~73:재도전3준비시즌기본안/잠재력점진정보/자연구단주기/충돌·복원·연도전환검증. 예시경로도최신사용자결정을적용하고이전정적검토를실행성공으로해석하지않는다.

---

<!-- SOURCE: 19-CAREER-STATE-MACHINE.md -->

최신 확정(2026-10-19): [125](125-EVENT-CHOICE-DISPATCH.md) RESOLVE_EVENT는 선택지를 DOMAIN/NAVIGATE/ACK로 처리하고, BLOCKING 사건은 이동한 화면의 도메인 결정이 커밋될 때 해결된다.

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 상세설계 01 — 커리어 상태 전이와 사건 처리

상태: 서면 설계 완료, 실행 검증 전. 기존02·12·13의 상태명이 충돌하는 부분은 이 문서의 통합 이름을 따른다. 사용자 요구와14의 규칙을 바꾸지 않는다. 게임 엔진 코드 구현은 하지 않는다.

## 1. 목적과 경계

한 선수의 고교·국내·미국·대표팀·복무·은퇴를 하나의 상태 계약으로 설명한다. phase 문자열 하나에 리그/계약/부상을 전부 섞지 않는다. 상태의 유효성을 서버에서 확인하고 잘못된 명령은 상태를 변경하지 않는다.

### 분리해서 저장할 축

| 축 | 값 | 의미 |
| --- | --- | --- |
| phase | 아래 상태표 | 현재 사용자에게 요구하는 행동 |
| careerRoute | UNDECIDED/KBO/COLLEGE/US_DIRECT/COLLEGE_DIRECT/KBO_TO_US/RETURN_TO_KBO | 경력 이동 출처 |
| registration | NONE/HS/COLLEGE/FUTURES/KBO/ROOKIE/A/AA/AAA/MLB/INDEPENDENT/SPORTS_UNIT | 실제 출장 소속 레벨 |
| availability | HEALTHY/INJURED/REHAB/SERVING/RETIRED | 출장 가능 상태 |
| contractState | UNSIGNED/ACTIVE/SUSPENDED/NEGOTIATING/ENDED | 계약 상태 |
| military | 12의 상태 enum | 병역·대체복무 상태 |
| competition | DOMESTIC/INTERNATIONAL/NONE | 현재 경기 문맥 |

예: `phase=SEASON_REVIEW`, `registration=AAA`는 미국 마이너 결산이다. `phase=SERVICE_PROGRESS`, `contractState=SUSPENDED`는 현역 복무다. `availability=INJURED`만으로 계약이나 은퇴 단계로 이동하지 않는다.

## 2. 단계 자료 계약

phaseContext는 phase별 구분 합집합으로 검증한다. 모든 phase에 임의 필드를 허용하는 JSON 객체는 사용하지 않는다.

공통: phaseEnteredRevision, seasonId, allowedActionIds, blockingTaskIds.
경기 진행: competitionId, scheduleCursor, segmentTarget, pendingGameId.
계약: offerSetId, offerIds, deadlineGameDay, rightsSnapshotId.
대표: selectionId, competitionId, registrationFinalized, resumeToken.
복무: programId, startedGameDay, completedMonths, returnRights, resumeToken.
사건: eventInstanceId, offeredChoiceIds, sourcePhase, resumeToken.

allowedActionIds는 서버가 phase와 하위 규칙에서 계산한다. 클라이언트가 전송한 허용 목록은 신뢰하지 않는다. resumeToken에는 sourcePhase/sourceCompetition/seasonId/checkpoint를 담으며 만료된 시즌으로 복귀하지 않게 검증한다.

## 3. 통합 상태표

| phase | 진입 조건 | 허용 사용자 명령 | 정상 다음 상태 | 실패/대체 경로 |
| --- | --- | --- | --- | --- |
| CREATED | 생성이 원자적으로 완료됨 | CONFIRM_PLAYER | PRESEASON_SETUP | 생성 거절은 세이브 미생성 |
| PRESEASON_SETUP | 유효 소속·경기 가능, 고교 포함 | SET_FOCUS, SET_PLAY_STYLE, CONFIRM_PRESEASON | SEASON_PROGRESS | 계약/병역 미완료면 먼저 해당 단계 |
| SEASON_PROGRESS | 일정·라인업 유효, 의무 사건 없음 | ADVANCE_CHUNK, REQUEST_PAUSE | EVENT_DECISION/SEASON_REVIEW | 부상/콜업은 사건 또는 등록 처리 |
| EVENT_DECISION | 고정 eventInstance가 존재 | RESOLVE_EVENT | 검증된 resumeToken의 단계 | 사건 무효면 무효 이유 기록 후 복귀 |
| SEASON_REVIEW | 해당 리그 정규 일정 완료 | ACK_SEASON_REVIEW | POSTSEASON_PROGRESS/OFFSEASON_REVIEW | 잔여 경기 있으면 진입 거절 |
| POSTSEASON_PROGRESS | 소속 리그 PS 진행 중 | ADVANCE_CHUNK | OFFSEASON_REVIEW | 팀 탈락이면 리그 결과 요약 진행 |
| OFFSEASON_REVIEW | 리그와 해당 창 대표 일정 완료 | ACK_REVIEW, REQUEST_RETIRE | OFFSEASON_TASKS/RETIRE_CONFIRM | 수상·성장 이중 정산 금지 |
| CAREER_ROUTE | 고교 결산 완료, 국내외 계약 없음 | VIEW_US_OFFERS, CHOOSE_KBO_ROUTE | US_OFFER_SELECTION/KBO_DRAFT | 미국 제안0이면 국내/재도전 |
| KBO_DRAFT | 국내 참가 확정 | ACK_DRAFT_RESULT, ACCEPT_DRAFT, CHOOSE_RETRY | PRESEASON_SETUP/RETRY_SETUP | 미지명·거절은 횟수/나이 검사 |
| US_OFFER_SELECTION | 조회용 미국 제안 세트 생성 | ACCEPT_US_AMATEUR_OFFER, RETURN_TO_ROUTE | PRESEASON_SETUP/CAREER_ROUTE | 계약 수락 전까지 국내 경로 유지 |
| RETRY_SETUP | 재도전 횟수·나이 유효 | CONFIRM_RETRY, REQUEST_RETIRE | PRESEASON_SETUP/RETIRE_CONFIRM | 다음 시즌의 레벨 INDEPENDENT |
| OFFSEASON_TASKS | 정리해야 할 의무 목록 생성 | 현재 최우선 task의 명령 | 병역/계약/진로/다음 PRESEASON | 목록이 비면 NEXT_SEASON_READY |
| POSTING_REQUEST | KBO 계약·연차·병역 조건 유효 | REQUEST_POSTING, KEEP_CURRENT_TEAM | POSTING_NEGOTIATION/OFFSEASON_TASKS | 보류면 같은 시즌 재요청 불가 |
| POSTING_NEGOTIATION | 원구단 승인, 기한 유효 | ACCEPT_US_OFFER, DECLINE_US_OFFERS, ADVANCE_NEGOTIATION_DAY | OFFSEASON_TASKS | 실패하면 원구단 계약 보존 |
| CONTRACT_SELECTION | 생성된 계약 세트 존재 | ACCEPT_CONTRACT, DECLINE_CONTRACT, REQUEST_RETURN, REQUEST_RETIRE | OFFSEASON_TASKS/RETURN_ROUTE | 제안0도 재도전/은퇴 연결 |
| RETURN_ROUTE | 해외 계약 종료/유효 정리 의사 | CONFIRM_RETURN_ROUTE, CANCEL_RETURN | RETURN_PREPARATION/CONTRACT_SELECTION | 보유권·연령 불충족이면 이유 제공 |
| RETURN_PREPARATION | 준비 프로그램 확정 | ADVANCE_RETURN_BLOCK | KBO_DRAFT/OFFSEASON_TASKS | 복무 기간과 같은 달력 공유 |
| MILITARY_PLAN | 대상·기한 검사 결과 필요 | APPLY_SPORTS_UNIT, CHOOSE_ACTIVE_SERVICE, DEFER_SERVICE | MILITARY_APPLICATION/SERVICE_PROGRESS/OFFSEASON_TASKS | 최종 유예 종료면 DEFER 없음 |
| MILITARY_APPLICATION | 지원·모집 ID 고정 | ACK_APPLICATION_RESULT | SERVICE_PROGRESS/MILITARY_PLAN | 탈락 후 같은 모집 재지원 거절 |
| SERVICE_PROGRESS | 프로그램 시작·보유권 처리 완료 | ADVANCE_SERVICE_BLOCK | RETURN_READY | 원구단·미국 동시 경기 불가 |
| RETURN_READY | 복무 또는 준비 기간 완료 | CONFIRM_RETURN | OFFSEASON_TASKS/SEASON_PROGRESS/CONTRACT_SELECTION | 유효 계약 없으면 무소속 시장 |
| NATIONAL_SELECTION | 초청 ID·대회 창·참가 가능 | ACCEPT_NATIONAL_CALLUP, DECLINE_NATIONAL_CALLUP | INTERNATIONAL_PROGRESS/resume | 부상/구단 미동의는 설명 후 복귀 |
| INTERNATIONAL_PROGRESS | 최종 대표 등록, 대회 진행 중 | ADVANCE_INTERNATIONAL | INTERNATIONAL_REVIEW | 의무 부상 사건에서 중단 |
| INTERNATIONAL_REVIEW | 대회 결과·실제 출전 기록 완료 | ACK_INTERNATIONAL_RESULT | resume/OFFSEASON_TASKS | 혜택은 최초 확정 시 한 번 |
| NEXT_SEASON_READY | 의무 목록0, 계약/명단/나이 검증 | START_NEXT_SEASON | PRESEASON_SETUP/MILITARY_PLAN | 45세 최종 시즌 이후 RETIRE_CONFIRM |
| RETIRE_CONFIRM | 수동 은퇴 가능 또는 의무 은퇴 | CONFIRM_RETIRE, CANCEL_RETIRE | ARCHIVED/이전 단계 | 의무 은퇴에는 취소 후 시즌 연장 불가 |
| ARCHIVED | 은퇴·기록·원본 보관 커밋 완료 | 조회, SAVE_EPILOGUE | 읽기 전용 | 경기/성장/계약 명령 전부 거절 |

고교의 SEASON_REVIEW 완료는 PS 대신 CAREER_ROUTE로 간다. 미국/국내 홈은 별도 상태가 아니라 registration에 따라 같은 phase를 다른 정보로 렌더링한다. 상태표에서만 쓰는 명령명과06의 기존 일반 명령 목록은 이 상세 계약으로 합친다. 고교·프로 재도전 카운터는10의 구분 유지.

## 4. 시즌 결산의 정확한 한 번 처리

정규 완료 → PS(해당 시) → 프리미어12(해당 창) → 정산 배치 순서다. 정규 종료 화면에서는 아직 적용되지 않은 성장에 대해 '예상'만 표시할 수 있으며 확정 성장+수상을 거짓으로 먼저 표시하지 않는다. OFFSEASON_REVIEW 진입 시 ledgerId=(playerId,seasonId,SETTLEMENT)로 정산한다.

정산 항목: 시즌 원시통계 확정, 정규/PS 분리, 집중 성장·강화 별도 반영, 실제 경과분 노쇠, 역할/스타일 별칭, 부상/피로 정리, 수상/국제 결과, 등록 연차. 각 항목 적용 여부와 버전을 기록한다. 강화로 이미 증가한 능력치를 결산에서 다시 더하지 않는다.

## 5. 오프시즌 작업 큐

우선순위: 최종 은퇴 판정 → 병역 의무/체육요원 확인 → 해외 계약 정리/보유권 → 포스팅/FA/복귀 의향 → 기존 계약 갱신 또는 시장 계약 → 다음 시즌 소속/최소 로스터 확인 → 프리시즌.

작업 키는 (playerId,seasonId,taskType,sourceId), 상태는 PENDING/OFFERED/DONE/CANCELLED. 하나의 작업이 중복 생성돼도 키로 합친다. 다음 시즌을 시작하면 이전 시즌 PENDING이 남지 않아야 한다. 미해결인데 잘못 NEXT_SEASON_READY에 들어간 세이브는 작업 큐로 복귀시키고 사유를 표시한다.

대표 참가로 체육요원 자격이 생기면 같은 시즌의 미확정 입대 작업을 취소/대체한다. 이미 복무 시작을 커밋했다면12의 블록 종료 정리 정책을 적용한다. 포스팅 계약과 KBO 재계약 중 하나가 확정되면 서로 배타적인 제안은 취소하고 예약 금액을 반환한다.

## 6. 사건 중단과 복귀

게임 청크는 최대6팀경기지만 사건이 첫 경기 뒤 발생하면 그 경기일까지 커밋하고 나머지는 실행하지 않는다. 경기 중 부상은 현재 타석과 합법적 교체를 먼저 마무리한 뒤 이닝/경기를 완료한다. 경기 연장 때문에 요청을 분할하면 pendingGame 상태를 보존하고 다른 대회 명령을 허용하지 않는다.

RESOLVE_EVENT는 같은 eventInstance에 한 번만 효과를 적용한다. 부상·병역 등 새로운 안전 조건이 생겨 원래 선택지가 무효가 되면 서버가 선택 세트를 다시 검증한다. 이미 처리된 선택은 결과 조회만 가능하다. 동시에 두 개의 선택 모달을 띄우지 않는다.

## 7. 저장 불변 조건

1. 선수는 같은 세계 날짜에 하나의 소속·경기만 갖는다.
2. 활성 유급 계약은 한 개, 정지 계약과 복귀 옵션은 별도 이력이다.
3. phase=ARCHIVED면 retired=true이고 유효 archiveId가 있다.
4. unresolved event는 blockingTask와 연결되고 해당 source가 존재한다.
5. resumeToken은 현재 세이브와 같은 season/world를 가리킨다.
6. season 정산, 국제 혜택, 강화 횟수, 포스팅 보상금은 각 고유 키로 한 번만 적용된다.
7. 계약/입대/은퇴 확정이 실패하면 상태와 부수 효과가 함께 롤백된다.
8. 다른 기기의 오래된 revision은 진행을 덮어쓰지 않는다. 처리했던 commandId 재시도는 원래 결과를 반환한다.
9. 희망 스타일·포지션·콜업 요청이 실제 등록을 자동 보장하지 않는다.
10. US 계약 조회만으로 국내 진로를 닫지 않으며 수락 커밋이 배타 경로를 확정한다.

## 8. 오류 응답과 클라이언트

INVALID_PHASE: 현재 phase·허용행동 요약 반환, 화면 최신 조회. EVENT_EXPIRED: 이유와 새 사건/복귀 단계. CONTRACT_EXPIRED: 현재 유효 제안 재조회. INVARIANT_VIOLATION: 명령 롤백·참조ID·읽기 가능 최근 상태 제공, 클라이언트 임의 수리 금지. 구버전 phase는 schemaVersion 변환 단계에서 처리하며 unknown phase를 SEASON_PROGRESS로 덮어쓰지 않는다.

진행 버튼은 한 명령 처리 중 disabled. 앱을 닫았다 열면 pending command 결과 확인 → 세이브 조회 → phase 화면 복원 순서다. 응답 유실을 진행 실패로 단정해 다른 commandId를 자동 발급하지 않는다.

## 9. 서면 검증과 후속 테스트

국내입단/미지명, 미국 제안0/수락, 콜업/강등, 대표 참가/사양, 병역탈락/입대/복귀, 포스팅성공/실패, 복귀연령초과, 수동/의무은퇴는18의 경로와 대조했다. 상태표상 정상 경로 또는 이유 있는 종료 행동이 존재한다. 이 검토는 자동실행 테스트 통과가 아니다.

추가 테스트 ST01: 모든 phase의 허용/거절 명령 표 기반 생성.
ST02: 같은 명령10회 재시도로 효과1회.
ST03: EVENT_DECISION에서 앱 재시작해 같은 선택지 복원.
ST04: 대표/복무 뒤 원래 시즌·계약 단계 복귀.
ST05: 강화 후 정산 시 능력 중복가산 없음.
ST06: 포스팅 후 원구단/미국 계약 동시활성 없음.
ST07: 은퇴 저장 중 DB 오류 시 archive만 따로 남지 않음.
ST08: 미지의 phase/누락 resumeToken은 안전 오류와 복구 경로.

다음 상세설계02는 국제대회 일정·대표 선발·출장·승부치기·병역 자격의 정확한 계약을 다룬다. 현재문서만으로전체상세계획이끝났다고표시하지않는다.


대학세부상태·학교9종·일정·조기지명/복학/졸업·휴학은[43 대학커리어](43-COLLEGE-CAREER.md)를따른다.


장기세계후속66~73:재도전/평가범위/자연구단주기/사건충돌/provisional원장/복원simulationKey/불변조건/연도generation/실험계획. 해당분야의이전1회준비·복원물리ID난수해석은각최신문서로대체한다.

첫플레이 동선 후속: [113](113-FIRST-CAREER-SEASON-EXPERIENCE.md)에서생성→고교→졸업→진로별첫시즌의안내·주행동·정산/등록/출장경계를연결한다. 새도메인사건/보상/지명보장은없고 [동선보드](first-career-board.html)는읽기시안이다.

117 사용자확정: 커리어홈의기본진행은‘다음주요사건까지’. 1경기/1주일은대안이며필수선택/시즌경계에서정지한다. 116의중반경험·E13명령기반후속도함께적용한다.

118 후속:[118](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md)은후반커리어→은퇴원본→19세복사/지도자역할의경험과계보claim경계를연결한다. 기존원본불변·반값·병역리셋·같은세계역할하나규칙은유지한다.

사용자확정U(2026-10-20): 고교 SEASON_REVIEW→CAREER_ROUTE 경계에서는 완료된 고교 기간 성장만 멱등 부분 정산한 뒤 진로 evaluator를 실행한다. 세계시즌 전체 정산과 별개 기간 지급 원장으로 중복을 막는다. 일반 정규 결산에 아직 적용하지 않은 미래 기간 성장을 확정값으로 앞당기지 않는다.

---

<!-- SOURCE: 20-INTERNATIONAL-COMPETITIONS.md -->

# 상세설계 02 — 국제대회 달력·선발·출전·결과

상태: 서면 설계 완료, 실행 검증 전. 사용자 요구인 아시안게임·WBC·올림픽과 기존 프리미어12를 대상으로 한다. 대회별 인원·달력·경기 형식·선발 기준은 독자 게임 규칙이며 실제 대회 최신 규약의 재현을 주장하지 않는다. 현실 병역 제도와의 경계는12의 공식 출처 설명을 유지한다.

## 1. 이번 항목의 결정

1. 국제대회는 전 세계 세이브에 하나만 생성하고 국내/미국 선수들이 같은 대표팀·대회를 공유한다.
2. 개최→선발→참가의사→최종등록→기용→실제출장→대회성적→개인보상/자격을 각각 구분한다.
3. 병역 보상은 우승 버튼이 아니라 참가·성적 증거에서 파생한 자격 이벤트다. 즉시 COMPLETED로 만들지 않는다.
4. 국제기록은 정규시즌·PS·마이너·상무 기록에 합산하지 않는다.
5. 명단을 새로고침하거나 명령을 재전송해 선발·대진·결과를 다시 뽑을 수 없다.

## 2. 반복 달력과 대회 정의

세계의 seasonYear와 대회별 anchorYear/period=4로 개최를 판정한다. 기본2027 시작, anchor WBC2026/AG2026/OLY2028/P12 2027. 따라서2027 P12,2028 OLY,2029 없음,2030 WBC+AG,2031 P12 순서다. 미래의 실제 일정이라고 표시하지 않는다.

| 대회 | 슬롯 | 참가팀 | 조별 | 진출/최종전 |
| --- | --- | --- | --- | --- |
| WBC | 정규 개막 전21세계일 |20|4조×5팀,단일리그|각조2팀→8강→4강→결승 |
| OLY | 여름14세계일 |6|2조×3팀,단일리그|각조2팀→4강→동메달/결승 |
| AG | 늦여름14세계일 |8|2조×4팀,단일리그|각조2팀→4강→동메달/결승 |
| P12 | 양대리그 PS 종료 후14세계일 |12|2조×6팀,단일리그|각조2팀→4강→3위/결승 |

대회 ID=(worldId,seasonYear,tournamentType). 기본 참가국 프리셋과 국가 ID는 버전 관리한 데이터 파일로 제공하며 현실 본선 진출국을 예측하지 않는다. 한국은 게임 플레이를 위해 기본 본선 참가국이다. 한국 참가도 현실 예선 통과 보장을 뜻하지 않는다. AG는 아시아 지역 국가 프리셋만 사용한다.

세계 날짜는 시즌 내 정수 dayIndex. 슬롯의 시작점은 정규경기 캘린더 전후의 고정 구간이며 리그별 팀경기 수를 직접 날짜로 사용하지 않는다. 예: OLY72경기 후라는 이전 문구는 제거하고 '여름 국제대회 휴식기'로 표시한다. 시즌 생성은 국제 슬롯을 먼저 예약하고 KBO144/MLB162/육성리그 경기와 휴식일을 배치한다. 슬롯 중에는 모든 소속리그 공식 경기를 멈춘다. 이중 출전 방지용 게임 단순화다.

선발 초청은 슬롯 시작7세계일 전. 참가/사양 답변 마감은 시작2일 전. 최종등록은 시작1일 전, 이후 선수 교체는 아래 부상 규칙만 허용한다. 경기 없는 준비기간에 경기 기반 등록연차를 주지 않는다.

## 3. 후보 자격

후보의 nationalTeamId는 생성 시 정한 가상선수 국적 필드이며 실제 사용자의 국적 정보를 수집하지 않는다. v1 주인공은 KOR 고정, 병역대상 ON/OFF는 별도 설정이다.

공통 제외: 은퇴, 현역 복무, 출전금지 부상, 이미 다른 대표로 최종등록, 계약상 차출 불허. 부상이 남은 선수를 '대회 중 낫겠지'라는 이유로 선발하지 않는다. 임시 재활 상태도 제외한다.

| 소속 | WBC/OLY/P12 | AG |
| --- | --- | --- |
| KBO1군 | 가능 | 가능 |
| KBO2군 | 해당 시즌 또는 직전 시즌1군기록 있으면 가능 | 가능 |
| MLB | 가능 | 가능 |
| 미국 마이너 | 해당 시즌 또는 직전 시즌MLB기록 있으면 가능 | 가능 |
| 상무 | 제외하는 게임 규칙 | 가능 |
| 현역/독립훈련/고교 | 불가 | 불가 |

해외 선수도 같은 한국 후보풀에 포함하며 해외계약의 차출 허가를 먼저 검사한다. AG에 실제 연령/와일드카드 제한을 재현하지 않고 '게임 대표 선발 규칙'으로 명시한다. 기존12의 단순 '1군기록 보유'는 위 최근2시즌 범위로 구체화한다.

## 4. 평가 점수와 레벨 보정

역할 OVR은08, 성적지수는 타자50+100×(OPS-.700),투수50+10×(4-ERA)를0~100 제한한다. 최근국내/미국정규기록만,대표/PS는선발점수에재합산하지 않는다. 당해표본이50PA 또는30outs 이상이면 당해,미달이면 직전시즌 충분표본,둘다미달이면 성적지수50. WBC는개막전이므로직전시즌만평가한다. 2026-10-27 사용자 확정: 여러 리그에서 뛴 경우 당해 충분 표본 중 가장 높은 리그, 없으면 직전 시즌 충분 표본 중 가장 높은 리그를 사용한다. WBC는 직전 시즌만 검사한다. 양쪽 모두 부족하면 성적지수50이며 리그 보정을 임의 적용하지 않는다.

표본 리그 보정: MLB+8/KBO0/AAA-8/AA-15/A-20/Rookie-25/퓨처스·상무-12. 성적지수에만 보정 후 다시0~100 제한,영구능력치는변경하지 않는다. 해외리그성적을같은OPS라는이유로무조건같게평가하지않는다. 계수는캘리브레이션전기본값이다.

selectionScore=.6×roleOVR+.4×adjustedPerformance. AG의UNRESOLVED/APPLICATION_PENDING에+3,다른병역상태+0,전체상한100. 동률은해당역할출장분모많음→사전seed순위→playerId. 잠재력·이름·유저선수여부보너스없음. 평가자료/점수/선발규칙버전을selectionSnapshot에고정한다.

## 5. 최종 28명 구성

투수13: SP5/RP7/CP1. CP후보없으면 RP의위기관리최고를CP역할로임시배정한다. 등록포지션이아닌대회역할만바뀐다. SP부족은체력높은RP를전환하되최소체력50,불가하면후보충원검토.

야수15: C2,1B1,2B1,3B1,SS1,LF1,CF1,RF1,DH1,유틸리티5. 한선수는한등록슬롯만채운다. 주포지션슬롯을먼저충족하고유틸은남은점수순. 대체적합도60이상만수비대체가능,좌투제한유지. 동점최적조합은선수ID안정정렬. 같은선수중복선발금지.

예비명단은역할별최대3명. 사용자에게보이는초청은현재본명단또는예비승격제안으로구분한다. 선발후사양/부상으로빠지면예비순위→나머지후보순으로충원하고기존선수선발결과를전부재추첨하지않는다. 후보부족은신규한국스타를즉시만드는대신최소역할제약을충족한기존하위리그선수를긴급초청하고'긴급선발'표시. 건강한동일국적선수로도28명/필수수비가불가능하면대회를강제로깨뜨리지않고캘린더생성불변조건오류로진행을중단한다.

후보가정상적으로충분하도록세계생성검사를통과해야한다. 테스트용병적상태에서경고와복구참조ID없이빈명단경기를실행하지않는다.

## 6. 참가 의사·마감·구단 모드

커리어:선발초청S24→참가/사양. 응답없이자동진행하면마감에서중단하며자동사양하지않는다. 참가가승격·주전·메달을보장하지않음을확정전표시한다. 사양에는영구능력감소/도덕페널티없고수상·혜택기회가없어지는것만설명한다.

구단:내구단선수목록으로여러초청을한화면에서확인한다. 선수AI의참가의사는기본참가,건강위험조건이면사양. 사용자는차출계약허가정책과대체선수만관리하며개별선수의병역혜택을박탈하기위해일괄불참을강제하는메뉴는v1제외. 기존12의감독이참가의사를설정한다는모호한안보다이계약이우선한다.

최종등록이후일반사양불가. 부상/새의무사유만교체검토. 등록명단과당일활성선수를분리해교체전에해당선수가출장했는지보존한다.

## 7. 선발과 실제 경기 기용

대표팀기용AI는모든사용자/가상선수에동일. 타순/수비는구단자동편성규칙,투수는5선발을대회일정에맞춰순환하되등판후최소3세계일휴식,피로60이상선발제외. CP/RP도피로와최근2일등판검사. 수비슬롯/건강을우선검사한뒤경쟁점수선택. 필요시SP대신오프너를쓰되역할변경을기록한다.

사용자는커리어중내선수출장명령을낼수없다. 백업으로선발된경우전경기미출전도가능. 실제출장은gameResult에선수의타석/수비아웃/투구아웃/주자교체등이기록됐을때officialAppearance=true. 현재v1대주자교체엔진미지원이므로그경로로출장을만들지않는다. 명단등록만으로출장수1을부여하지않는다.

탈락후한국선수의대회출장은끝나지만다른나라결승까지세계결과를완료해야INTERNATIONAL_REVIEW를확정한다. 미선발선수의UI는한국결과뉴스를읽고원래단계로복귀,자기기록행은생성하지않는다.

## 8. 부상·교체·복귀

최종등록전부상:초청취소/사유통지/예비승격. 최종등록후대회첫경기전:부상선수제외+같은역할예비등록가능. 첫경기이후:이미끝난조/라운드다음경계에서만교체,교체된선수재등록불가. 경기중부상은벤치/불펜으로처리하고국내원소속으로즉시경기를뛰게하지않는다.

의료판정은경기엔진확정값,사용자가임의로재검사해서부상을취소하지않음. 대체선수는실제합류후경기부터기록. 팀메달이후병역게임자격은최종또는과거유효등록이력+실제출전+미해결상태를검사하며부상교체선수도실제출장이있으면자격후보가될수있다. 단순벤치등록만한선수는제외하는게임정책.

대회창부상회복단위는기존팀경기기준모델을유지:소속대체대표팀의예정경기1개완료당remainingGames-1,같은세계일소속리그경기는없어중복차감없음. 탈락후회복은원소속국내재개경기부터계속. 비참가선수는국제휴식일마다피로-8(야수)/-10(투수)만적용,부상남은경기를날짜만으로차감하지않는다. 실제의학모델아님.

## 9. 대진·동률·연장

조편성은경기전세계seed로한번확정. 실력프리셋강/중/약을가능한고르게배분,한국진출보장조작없음. 2026-10-27 사용자 확정: 강 65, 중 55, 약 45. 여섯 능력은 그 종합과 같다. 조별완전단일리그,각경기홈/원정은고정시드로균형배분한다.

조순위:승률→동률집단내승률→동률집단내득실차→전체득실차→전체실점적음→조편성시고정추첨순. 3팀이상동률이면해당집단의경기만계산하고한번갈라진소집단은해당소집단으로처음부터재평가. 아무팀도안갈라지면다음기준으로넘어가며무한재귀금지. 대회전체가몰수판정없이진행되므로보통조별무승부없음.

조별을포함한모든국제경기는14의10회무사2루승부치기. 20회동점이면이닝경계저장,다음청크에21회부터계속. 경기결과확정전조순위/후속대진을진행하지않는다. 자동주자는그이닝다음타자의직전타순선수로선정한다. 이전14의'직전이닝 마지막 타자'는엄밀하지않아이계약으로정정한다. 자동주자의득점은R에포함/ER제외.

준결승은A1-B2/A2-B1. WBC8강은A1-B2/B1-A2/C1-D2/D1-C2,준결승은앞2경기승자/뒤2경기승자,동일조재대결도허용. 올림픽/AG준결승패자는동메달전,P12는3위전,WBC는3위전없음. 결승승자는우승/금,패자는준우승/은으로대회정의에맞게표시한다. 서로다른단계에서메달과4강표기를중복생성하지않음.

## 10. 기록과 혜택 원장

선발원장:selectionId,candidateScore,invitationStatus,finalRosterEntryId,role,replacementHistory.
출장원장:(competitionId,gameId,playerId),officialAppearance,PA,defensiveOuts,pitchingOuts,batting/pitchingLine.
결과:competitionId,teamId,finalRank,medal,completedAtRevision,playerAppearances.
혜택원장:(playerId,competitionId,benefitType),eligibilityEvidence,resultVersion,appliedRevision. source키중복금지.

팀우승은미출전최종등록선수도'대표팀 우승 명단'으로기록할수있지만'개인대회출장'과'체육요원게임자격'은별도다. 출전0이면개인통계0/병역자격없음. 참가사기+3,우승/금+5로대체하는12규칙유지,미참가+0. 은/동은참가+3,금만+5. 영구능력/등록일수보너스없음.

병역게임자격은 UNRESOLVED/APPLICATION_PENDING에서 AG금 또는 OLY금/은/동+실제1경기출장+유효등록증거를충족하면ATHLETE_ELIGIBLE. 이미COMPLETED/NOT_APPLICABLE이면기록만,재혜택없음. SERVING_SPORTS는중복복무전환을이자리에서자동처리하지않고병역상세03의작업큐에자격후보를전달. WBC/P12는어떤성적도병역혜택없음. 실제추천·편입절차를완료했다는표시금지.

## 11. 상태·명령·응답

19의NATIONAL_SELECTION→INTERNATIONAL_PROGRESS→INTERNATIONAL_REVIEW→검증된resumeToken사용. 대회전체phase는CREATED/INVITING/ROSTER_LOCKED/GROUP/KNOCKOUT/COMPLETED,이와사용자커리어phase를구분한다. 한국탈락·미참가사용자의조회화면을바꿔도세계대회상태는공통으로유지한다.

ACCEPT/DECLINE_NATIONAL_CALLUP payload:selectionId,invitationVersion. ADVANCE_INTERNATIONAL:competitionId,maxGameDays(기본1,최대3). ACK_INTERNATIONAL_RESULT:competitionId,resultVersion. 모두commandId/expectedRevision공통. 잘못된국적/마감/다른대회/미해결사건은명령거절+현재유효단계안내. 결과ACK를누르기전에도이미정산커밋됐다면새로고침시같은결과를보여주고혜택재적용금지.

국제기록·부상·피로·일정·혜택원장과복귀상태는한세이브트랜잭션에서확정. 세계세이브한개를사용하므로대표명단이사용자기기마다다르게생성되지않음. 모드별독립세이브는서로다른세계이며명단/결과공유하지않는다.

## 12. 화면 상세

S24:대회/가상개최일정→선발/예비/탈락배지→역할/비교점수도움말→차출조건→병역효과있음/없음→참가/사양. 탈락자는불필요한확정모달대신뉴스.
S25:현재라운드→한국/내선수구분→다음상대→조순위/대진탭→팀성적과개인출장→진행/결과확인. 출전0인선수에가짜성적/영웅서사금지.
대회결산:메달/최종순위→내실제기록→사기/부상/피로→자격변경없음또는편입대상알림→국내/미국/병역단계복귀. WBC에면제기대문구노출금지.

## 13. 테스트 계약 INT01~INT18

| ID | 입력/상황 | 기대 결과 |
| --- | --- | --- |
| INT01 |2027~2031달력|P12/OLY/없음/WBC+AG/P12,고유대회ID |
| INT02 |국내·미국다른경기수|국제창공통휴식,동일선수동일날2경기없음 |
| INT03 |MLB/AAA/상무/현역/부상후보|표의자격과성적보정일치 |
| INT04 |같은명단생성재요청|같은후보점수/seed/초청결과 |
| INT05 |포수2/좌투제한/같은선수겹침|정원28,고유ID28,필수슬롯충족 |
| INT06 |사양후예비승격|전체재추첨없이하나의공석충원 |
| INT07 |기한지나사용자미응답|자동진행중지,자동사양안함 |
| INT08 |전경기벤치후금메달|명단수상은가능,개인출장0/병역자격없음 |
| INT09 |부상교체전실제출장1|원출장보존,교체후중복출장없음,자격후보검사 |
| INT10 |3팀동률집단분리|부분집단재평가종료,seed최종안정정렬 |
| INT11 |승부치기자동주자득점|R포함/ER제외,직전타순선수배치 |
| INT12 |20회동점뒤앱종료|pendingGame복원,21회재개,대진선진행금지 |
| INT13 |AG은/동 또는WBC/P12우승|병역상태변경없음 |
| INT14 |미해결+OLY동+실제출장|ATHLETE_ELIGIBLE1회,COMPLETED아님 |
| INT15 |이미병역완료+금|명예기록만,자격중복없음 |
| INT16 |결과응답유실/기기중복ACK|사기·혜택·통계한번만적용 |
| INT17 |미선발/한국조기탈락|세계대회종료기록과유효resume정상복귀 |
| INT18 |대표기록후국내결산|국내누적에국제H/outs혼입없음 |

서면상으로각분기와기존18의국제대회경로를대조했다. 엔진/기기/DB실행테스트는미실시. 다음상세계획은병역·상무·계약정지·해외복귀다.

## 2026-10-27 국제대회 참가국·실력 프리셋 — 사용자 확정 U

한국은 실제 선발 선수 능력치를 사용한다. WBC20팀은 한국, 강65(미국·일본·도미니카·베네수엘라·푸에르토리코·멕시코), 중55(쿠바·대만·네덜란드·캐나다·호주·파나마·콜롬비아), 약45(이탈리아·영국·체코·이스라엘·중국·브라질)이다. OLY6팀은 한국·일본·미국·대만·도미니카·쿠바, P12 12팀은 한국·일본·미국·도미니카·베네수엘라·푸에르토리코·멕시코·쿠바·대만·네덜란드·캐나다·호주이며 상대 실력은 같은 공통 표를 사용한다. AG의 HKG55 결정은 유지한다. 실제 진출국/전력 예측이 아닌 게임용 고정 프리셋이며 이 결정의 기록은 해당 대회 실행 구현 완료 증거가 아니다.

## 2026-10-27 P12와 포스트시즌 날짜 충돌 — 사용자 확정 U

P12는 11월15일과 양 리그 PS 실제 종료 다음 날 중 늦은 날에 개막하고14일간 유지한다. PS 때문에 늦어지면 P12를 연기하며 정규/PS 경기 날짜를 당겨 해결하지 않는다. 이미 확정·진행된 저장의 경기 날짜는 보존하고 새 일정 연결부터 적용한다. 현재 calendar-1·national-bracket-1의 고정 P12 fixture는 기존 동작의 검증 이력이며 이 새 시간축 정책의 구현 완료 증거가 아니다.

## 2026-10-27 WBC와 정규 개막 충돌 — 사용자 확정 U

WBC 개최 연도의 새 프로 시즌은 WBC 종료 뒤부터 정규 경기를 배치한다. WBC의 기존 대회 날짜·기간은 유지한다. 이미 진행 중인 저장의 날짜·확정 경기·seed·급여 원장은 보존한다. calendar-1은 구 규칙 그대로 읽고, 신규 프로 진입·연도 전환부터 calendar-2를 쓴다. 학교 일정·자연성장 예산·시즌 경기 수·연봉 산식은 바꾸지 않는다.

## 2026-10-27 대표팀 불펜 연투 — 사용자 확정 U

대표팀 RP·CP는 두 세계일 연속으로 실제 등판했으면 다음 날 휴식한다. 단순 명단등록/경기 없는 날/PA·BF 없는 벤치 기록을 등판으로 세지 않는다. 선발은 기존 등판 후 최소3세계일 휴식을 유지한다. 준비된 pendingGame과 과거 확정 경기는 이 결정으로 재작성하지 않는다.

---

<!-- SOURCE: 21-MILITARY-CONTRACT-RETURN.md -->

# 상세설계 03 — 병역·상무·계약 정지·해외 복귀

서면 설계 완료, 실행검증 전. 가상 선수의 게임 규칙이며 실제 입영·복무·고용·국외여행 제도를 안내하지 않는다. 현실과의 경계는12의 출처 설명 유지. 기본 병역대상 여부는 생성 때 고정, 실제 사용자 민감정보를 받지 않는다.

## 상태와 증거

militaryStatus는 NOT_APPLICABLE,UNRESOLVED,APPLICATION_PENDING,SERVING_SPORTS,SERVING_ACTIVE,ATHLETE_ELIGIBLE,ATHLETE_SERVICE,COMPLETED. eligibilitySource와 serviceProgram을 분리한다. 대표 메달은20의 자격 증거를 넘길 뿐 완료 상태를 바로 만들지 않는다.

Program: programId,kind,startedWorldDay,startedSeason,scheduledBlocks,completedBlocks,contractDisposition,originalRights,returnOptionId,benefitEvidenceId,lastProcessedDay. 종류 ACTIVE/SPORTS/ATHLETE. 실제 미래복무일수를 예측하지 않도록 UI에는 '게임 복무18개월' 표시.

| 현재 | 명령/사건 | 다음 | 필수 검사 |
| --- | --- | --- | --- |
| UNRESOLVED | 상무지원 | APPLICATION_PENDING |19~27게임나이,동일모집미지원 |
| APPLICATION_PENDING | 합격수락 | SERVING_SPORTS | 계약정리·블록확정 |
| APPLICATION_PENDING | 탈락확인 | UNRESOLVED | 같은모집재지원불가 |
| UNRESOLVED | 현역확정 | SERVING_ACTIVE | 소속·계약정지 |
| UNRESOLVED/APPLICATION_PENDING | 유효메달자격 | ATHLETE_ELIGIBLE |20의증거원장 |
| ATHLETE_ELIGIBLE | 편입확인 | ATHLETE_SERVICE | 경쟁중지원/입대예약취소 |
| SERVING_SPORTS/ACTIVE | 전체블록완료 | COMPLETED | elapsed중복없음 |
| ATHLETE_SERVICE | 의무기간완료 | COMPLETED | 확인3시즌완료 |

확정 이후 중간 취소로 복무 시작 전 능력/계약을 복구하지 않는다. 잘못된 증거를 발견한 데이터 오류는 사용자 선택이 아니라 운영 복구 절차로 다룬다.

## 게임 기한과 작업 순서

19세부터 오프시즌 계획 노출,25·26세에 남은 시즌 안내,27세가 마지막 유예 시즌. 28세 시즌 시작 전 미해결이면 의무 계획 화면에서 멈춘다. 남아있는 상무 모집 결과를 먼저 처리하고 미합격이면 현역 계획만 제공. 은퇴로 병역상태를 완료시키지 않으며 은퇴 원본에 미해결 상태를 보존한다.

같은 오프시즌 순서: 이미 종료된 국제대회 혜택→미확정 모집 정리→병역기한→계약/해외진로. 미래 대회가 열린다는 이유만으로 기한 뒤 유예 불가. 최종 의무계획은 '확인하지 않고 자동 경기진행'을 허용하지 않는다. 상무 지원 마감과 국제대회 결과가 겹치면 세계 날짜 순서로 처리한다.

## 상무 선발

모집은 시즌마다 한 번,지원자에 roleScore를 계산해 고정 snapshot. 투수10/야수10 게임정원(2026-10-22 사용자 확정,14 U). 종전5명씩의 정원과 C1/내야2/외야2·SP2/RP2/CP1 세부배분은 대체되며 신규 정원의 확정 배분으로 사용하지 않는다. 10명 기준 세부 역할 배분은 후속 구현 명세에서 구분해 기록한다. score=.6OVR+.4최근2시즌성적지수,표본가중은 PA/outs 합계. 동률은젊은나이→안정seed→ID. 건강한 선수만지원,지원중부상은결과전재검사. 탈락은수치페널티없음.

합격 조회와 입대 확정을 분리한다. 기한 내 입대 사양은 UNRESOLVED로 돌아가지만 같은 모집 재합격 기회는 소모. 지원명령 재시도는 같은 applicationId/결과. 유효후보가적으면남은정원공석,게임이새스타를만들어주지않는다.

## 상무 포함 퓨처스 일정

2026-10-22 사용자 확정(14 U): 상무 포함11팀, 팀당144경기, 상대별14~15경기, 홈72/원정72. 1군은 기존10팀·144경기 유지. 연간 야수10·투수10 선발만으로 초기 군팀을 완성했다고 간주하지 않으며 이전 기수·실제 지원자·건강한 필수자리와 원구단 보유권/별도 등록을 먼저 준비한다. 새 일정 버전 활성화 전 기존10팀 저장 일정과 확정 기록은 유지한다.

## 18개월과 달력

프로그램은 두 블록: 다음 세계시즌의 전체 국내 정규기간과 그다음 시즌6월30일까지(2026-10-22 사용자 확정,14 U). 6월30일 경기/일마감 뒤 복무를 완료하고 원구단 등록은 다음 날짜부터 재개한다. 국제창이나 팀 경기 수로 이 날짜를 옮기지 않는다. 블록 완료점은미리기록한worldDay로처리,팀경기수를복무시간으로매일환산하지않는다. 국제창은포함된시간이며별도복무기간을더하지않는다. 나이는시즌시작정수증가,노쇠는해당시즌에서복무한비율을기록해정산1회.

ACTIVE: 공식출장0,성장0,휴식피로감소. SPORTS: 군체육팀 퓨처스경기,성장예산은연간기본×복무블록의시즌비율×퓨처스출장계수. 같은해복귀후원구단성장과합쳐연간한도이내. 특별강화는해당시즌의공통1회키를사용해군체육팀/원구단각각1회가되지않음. 이전12의'블록당1회'는이계약으로정정한다.

SPORTS 중 AG 자격을 얻어도 즉시 경기중 소속을 변경하지 않는다. 자격후보 작업을 만들고 현재 복무블록 종료 때 기존 프로그램 정산→잔여의무 대체편입→ATHLETE_SERVICE 순서. COMPLETED와같은혜택을동시에주지않음. 실제부대행정제도모사가아닌게임전환이다.

ATHLETE_SERVICE는경기활동가능한3개시즌의무확인. 편입첫해가오프시즌이면다음완전시즌부터카운트. 시즌종료확인마다1회차감,은퇴해도기록상남은의무는원본에보존. 구단 복사본은 14 R05·R21과 32에 따라 병역을 UNRESOLVED로 다시 시작하며 원본의 편입·완료·메달 혜택을 승계하지 않는다.

## KBO 계약과 재정

입대 확정 시 남은계약경기일수/지급액/보유권을스냅샷. ACTIVE/SPORTS 기간은게임계약정지,원구단연봉0,정규등록연차0. 정지된계약은활성1군계약수가아니지만보유권남음. 계약기간연수를정수+1로매번조정하지않고remainingPaidGameDays로계산.

예: 연봉1억/144경기 중72경기치미이행이면복귀후72일만재개,일급은round(연봉/144),마지막일에반올림잔여정산. 시즌전체선납이아닌일별원장으로예약/지급/정지를구분. 구단예산에는그해실제재개분만예약,방출하면정지중보장액의게임방출정책을미리표시. 복귀선수 때문에 예산/정원이막히면 로스터정리 또는08의명시적재정구제,선수삭제금지.

원구단소속선수의보유권은유지. 구단모드입대알림에대체선수추천. 전역후원구단로스터슬롯이없으면보유권소속2군복귀,자동1군주전없음. 원구단선수모두가군체육팀으로영구이적하는표시금지.

2026-10-22 사용자 확정(14 U): 복귀 잔여 계약이 시즌 중 소진되면 재계약을 선택하고 남은 시즌만 일할 계약한다. 자동 연장은 하지 않는다. 마지막 지급일은 정상 마감하고 다음 경기 전에 계약 선택을 처리한다. 실제 제안/승인/지급/재개 연결의 구현 상태는 implementation 진행 기록을 따른다.

M2-CL 구현 D: 원구단의 잔여 시즌 제안은 기존 비FA 연환산 연봉 산식으로 고정한다. 실제 정규 등록일 일급과 시즌 마지막 정규 급여일의 반올림 잔여를 별도 원장에 기록한다. 포스트시즌은 기존 지급 제외 정책을 유지하며, 시즌 급여 정산 뒤에도 기존 시즌 마감·다음 시즌 재계약 순서를 따른다. 승격/강등에 대비한 양 리그 원구단 경기 날짜 합집합을 최대 예약으로 사용하며 미사용분은 해제한다. 원래 복무 계약·지급 영수증은 새 계약으로 덮어쓰지 않고, 계약 교체 시 과거 원장으로 보존한다. E30의 적용 기간을 확인하며 중도 은퇴 명령은 기존처럼 시즌 결산 뒤에만 가능하다.

## 미국 계약과 국내 준비

미국계약은 returnOptionId/동결허용 조항이있을때만합의정지,없으면종료/구단협상결과를확인해야입대확정. 미지급보장액은해외계약원장에보존,임의원화전환없음. 복귀옵션은구단/레벨/마감/보장여부를포함하며기한지난옵션은자동취업권이아님.

고교직행의국내복귀2시즌준비와현역18개월은포함관계. programDay를공유해같은기간중복가산금지.18개월완료후잔여반년독립훈련→복귀드래프트. 미국으로돌아갈유효옵션을선택하면국내복귀준비는중도종료하고새국내드래프트예약취소. 국내입단계약과미국옵션을동시에수락불가.

## 복귀 처리

블록완료→COMPLETED원장커밋→RETURN_READY→보유권/옵션/무계약검사→소속결정→몸만들기. 현역은첫6개원소속팀경기동안effectiveMultiplier=.95,실제출장여부와무관하게소속팀경기완료마다감소. 군체육팀복귀는해당디버프없음. 국제차출휴식창은6경기차감에포함하지않음. 원본능력치를0.95배덮어쓰지않는다.

부상은복무상태와별도. 복무중부상remainingGames를날짜로몰래회복시키지않음. 복귀의학모델은시즌정산/게임의료이벤트로정리하고새출전가능판정을한다. 현실판정결과를의미하지않는다.

## UI·오류·검증

S26:현재상태/게임마지막유예/상무조건/계약영향/예상복귀→계획선택→확정. S27:전체18개월·현재블록·기록·원구단/옵션·반년잔여→다음블록/복귀. 은퇴나이와복무개월을섞지않음.

MIL01 기한전유예/마지막기한거절. MIL02 지원중메달로대체된모집취소. MIL03 합격재시도동일결과. MIL04 블록재전송에기간/성장1회. MIL05 반년복귀성장연간중복없음. MIL06 지급/예약/보장액일치. MIL07 원구단과상무동일날출장없음. MIL08 해외동결옵션없음경고. MIL09 국내준비2년과18개월중첩. MIL10 전역완료뒤원소속2군/무계약FA분기. MIL11 사후자격/복무완료중복보상없음. MIL12 6경기디버프만료후영구능력불변. 전부향후실행테스트명세다.


## 2026-10-22 시즌 중 일할 재계약 거절 — 사용자 확정 U (M2-CL 이후 경로)

원구단의 시즌 중 일할 재계약을 거절하면 다른 구단의 제안을 비교한다. 계약을 맺기 전에는 경기 진행을 보류한다. 거절을 자동 은퇴·자동 원구단 연장·무계약 출장으로 처리하지 않는다. M2-CL은 원구단 수락 경로까지이며 다른 구단 제안과 실제 이적은 후속 구현이다.


## 2026-10-22 상무 성장 기간 연결 — 구현 D (M2-CM)

21·42의 기존 규칙을 새 입대와 다음 미진행 시즌에 적용한다. growthPolicyVersion1은 상무 등록기간·6월30일 복귀·육성 계획 경계로 성장기간을 나누고 하나의 세계시즌 예산에 누적한다. 상무 공식 FUTURES 경기와 복귀 후 원구단의 실제 등록 영수증만 읽으며 팀 경기 수는 이어서 센다. 과거 지급/기존 진행 시즌은 자동 재계산하지 않는다. 노쇠·강화·난이도 수치 변경은 없고 ACTIVE/NPC 연결은 별도다.


## 2026-10-22 시즌 중 제안 비교 후 원구단 복귀 선택 — 사용자 확정 U

다른 구단 제안을 비교한 뒤에도 새 계약을 맺기 전이라면 원구단의 제안을 다시 수락할 수 있다. 비교를 선택했다고 원구단 제안을 영구 소멸시키지 않는다. 계약 전 경기 보류는 유지한다. 실제 비교/이적 연결은 후속 구현이며 원구단 수락 경로는 M2-CL을 따른다.


## 2026-10-22 현역 복무 실제 경로 — 구현 D (M2-CN)

S26 명시 확인은 원구단 보유권과 동결 계약을 보존한 ACTIVE 프로그램을 만들고 다음 시즌부터 실제 두 리그 등록/출장·구종 경기XP·등록일 급여·자연성장을0으로 연결한다. NONE 휴식만 매일1회, 부상 잔여 팀경기는 날짜로 소모하지 않는다. E51 첫 블록·6월30일 복귀 E53·다음 원구단 등록일 지급을 기존 달력/급여 원장으로 처리한다. 확정 저장은 KBO 루트v2로 구분해 구버전 진행을 거절하고 기존v1 학교/상무/일반 저장은 읽기 보존한다. 전체28세 기한·E49/E54·복귀6경기0.95는 후속 구현이며 기존 설계값을 바꾸지 않는다.

## 2026-10-22 병역 계획·기한·복귀 컨디션 — 구현 D (M2-CO)

기존21의28세 기한을 군 기록 필드 없는 저장에도 적용하고 E49/E54 명시 열기/선택을 연결한다. START_SERVICE는 S26 검토로만 이동하며 실제 입대 확정 전에는 기한 차단이 유지된다. 유예는26세 이하, 상무 지원은 기존19~27세·건강 조건을 따른다. 25/26세 남은 유예·27세 마지막 유예를 공개 조회한다. 새 현역 실제 복귀 후6개 등록 팀경기의 유효 능력0.95를 공식 경기/건강 영수증으로 계산한다. 벤치·부상 등록 포함, INT/휴식 제외, 영구 능력 불변이다. 새 계획/연도/현역 전환은 KBO 루트v3로 보호하고 기존v1/v2는 읽기 보존한다. 이미 완료된 옛 복무에 효과를 소급 생성하지 않는다. 게임 수치 변경이나 사용자 신규 결정U가 아니다.

## 2026-10-22 시즌 중 타구단 제안 연봉 — 사용자 확정 U

사용자는 계약 소진 뒤 타구단 제안의 연봉 환산액을 기존 선수 가치 산식으로 정하고 잔여 시즌의 실제 등록 경기일만 지급하는 안을 승인했다. 원구단 재계약 제안은 비교 중에도 유지한다. 환산액은 기존 만원 반올림·최저/최대 연봉 경계를 따르며 실제 타구단 계약/지급 연결은 후속 구현이다.

## 2026-10-22 시즌 중 계약 비교 — 구현 D (M2-CP)

원구단 E30을 유지한 비교 요청은 날짜/계약/권리/돈을 바꾸지 않고 진행을 보류한다. 타구단은 기존 선수 가치의 만원 반올림 연봉, 정원/잔여 일정/예산 조건을 검사하고 포지션 수요 순으로 고정 비교한다. 새 추첨·1군 보장 없음. 실제 타구단 수락/이적은 후속이며 원구단 재수락은 기존 명령으로 가능하다.

## 2026-10-23 상무 군팀 비상 보충 — 사용자 확정 U

사용자는 상무에서 부상으로 건강한 야수9명·투수1명을 채우지 못하면 낮은 능력의 군팀 전용 가상 선수를 필요한 만큼만 임시 등록하고, 원래 선수가 복귀하면 제외하는 안을 승인했다. 매년 야수10·투수10 정규 선발과 별도 비상 보충이며 조기 입대/기권으로 대신하지 않는다. 실제 명단·건강·기록 조회 연결은 후속 구현이고 이번 공동 검사 결과를 그 구현의 통과로 세지 않는다.


### 상무 임시선수 실력 추가 확정 U — 2026-10-23

기존 KBO 비상 대체 선수 수준인 종합35~45를 사용한다. 정규 연간 선발 인원·민간 계약/정원·개인 병역 판정에 포함하지 않는다. 부상 전 정규 인원으로 합법 편성이 가능한 군팀에 한해 최소 보충하며, 빈 기수/만료된 기수의 대체 입대로 쓰지 않는다. 신원·구종·지난 출장 기록은 제외 후에도 보존한다. 신규 시즌 시작 시 적용하고 이미 진행 중인 구 저장의 부상 추첨 순서는 유지한다. 실제 구현/검증은 [M2-CU](../implementation/M2-CU-SANGMU-HEALTH-EMERGENCY.md)를 따른다.


## 2026-10-23 NPC 복무 복귀·군팀 공석 — 사용자 확정 U

NPC 복귀 뒤 남은 계약 일수가 시즌 중 소진되면 기존 AI 선수 가치·포지션 수요·예산으로 재계약 또는 FA를 결정한다. 내 선수의 계약 비교·선택은 유지한다.

6월30일 전역·신규 지원자 부족으로 정규 군팀 인원이 부족해도 확정된 상무 시즌을 마치도록 종합35~45 군팀 보조 선수를 필요한 만큼만 충원한다. 부상 보충 외 전역·모집 공석에도 허용하되 정규 입대·복무 프로그램·민간 계약을 만들지 않는다. CU의 부상 전 정규 명단 충족 제한을 이 후속 경로에서 확장한다. CW574개 검증은 이 신규 NPC 정책의 구현 통과가 아니다.


구현 참조: 승인한 공석 보충은 [M2-CX](../implementation/M2-CX-SANGMU-VACANCIES.md)에서 원장2·기존 원장1 보존/새 시즌 승격·보조만의 실제 경기·건강/기록으로 집중22/22·전체580/580을 통과했다. NPC 실제 복귀/급여/AI 소진 계약 판단의 완료를 뜻하지 않는다.

## 2026-10-23 NPC 병역 기존 채무의 예산 예외 — 사용자 확정 U

기존 병역 계약의 원금·과거 지급은 보존한다. 실제 신규 입대로 지급 시점이 밀려 미래 예산90%를 넘더라도 기존 급여 채무를 삭제하거나 선발을 취소하지 않는다. 초과 구단의 신규 선택 영입은 제한하고 필수 명단 복구만 기존 안전망으로 처리한다. 재정재건 지원은 실제 지급 연도의 부족분만 정확한 원 단위로 기록하며, 미래 연도 지원을 미리 만들거나 영구 예산·경쟁 영입 자금으로 사용하지 않는다.

구현 D: 새 실제 NPC 입대의 KBO 루트v6/분리 계약 원장을 대상으로 적용하며, 기존v1~5 원장·과거 성장/급여를 소급 수정하지 않는다. 동결 잔여 최대576일과 반년 복귀를 반영해 미래6년까지 채무를 조회한다. 일반 계약·보장금만으로 한도를 넘은 입력은 계속 거절한다. 현재 연도 지원금을 받은 구단의 선택 영입은 그 시즌에 제한한다. AI 재계약·FA·드래프트·잔여 시즌 이적에도 같은 판단을 적용하며 최소 명단 복구는 예외다. 내 선수의 다음 해1년 재계약은 올해 지원금 여부 대신 대상 연도의 실제 채무+새 연봉90% 한도로 판단해 기존 선택 흐름을 유지한다. 실제 복귀/급여/성장의 검증 결과는 M2-DA/DB 구현 기록을 따른다.

## 2026-10-24 NPC 원구단 복귀 공동 등록 — 구현 D (M2-DC)

기존60의 실제 같은 팀 등록 E96을 새 NPC 병역 복귀 경로에 연결한다. 실제 복귀 영수증 이후 원구단의 같은 KBO 또는 Futures 공식 정규 경기 건강 명단에 양쪽이 함께 있어야 하며 벤치·부상 등록을 인정한다. 복귀 일마감 당일·군팀 대기·다른 리그·현재 master roster만으로 재회를 추정하지 않는다. 복무 계약 또는 그 잔여 시즌 연속 계약이 이어진 복귀만 이 경로의 생성 대상이며 일반 AI 영입은 별도다.

이전 분리 관계의 종류/이력을 보존하고 실제 복귀 날짜·프로그램·공식 경기·당시 정렬 등록 신원을 봉인한다. 과거 읽기/ACK는 현재 소속·계약에서 추정하지 않는다. 같은 날 공동 경기 뒤 계약이 만료되면 재회 이정표를 먼저 기록하고 이후 분리를 보존한다. 반복 처리로 그 마지막 분리를 되돌리지 않는다. 기존 사건 필드·게임/RNG/돈/성장 수치·루트v6는 유지하고 구 저장에 소급 공지를 만들지 않는다. 새 사용자 수치 결정이 아니며 실행 검증은 DC 구현 기록을 따른다.

## 2026-10-26 연말 원구단 예산 부족의 진로 — 사용자 확정 U

다음 시즌 원구단 예산으로 내 선수의 만료 계약을 재계약할 수 없으면 다음 해 보유권을 해제하고 다른 구단의1년 계약 제안을 비교한다. 기존 계약의 원금/과거 지급 보장 정책은 유지한다. 원구단 권리를 유지한 무계약 훈련/재협상으로 대신하지 않는다.

구현 D(M2-DF): 이번 시즌 마감 자료·소속·급여·권리는 비교/수락으로 소급 변경하지 않고, 다음 시즌 전환에서 선택 계약/새 소속/원구단 권리 해제를 원자적으로 활성화한다. 기존 역할 가치 산식·포지션 수요·대상 연도 채무/예산·만료 예정 자리를 사용하며1군 출전을 보장하지 않는다. 제안이 없으면 명시적인 빈 목록과 기존 은퇴 선택을 제공하고 계약 전에는 연도 진행을 보류한다. 새 권리를 쓰는 현역/상무 복무도 선택한 구단의 계약을 동결한다. 루트v7은 구v1~6의 급여/성장을 소급 변경하지 않는다.

---

<!-- SOURCE: 22-DEVELOPMENT-STYLE-TRAINING.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 상세설계 04 — 성장·스타일·강화·잠재력·노쇠

서면 계약, 밸런스 실험 전.08/12의기본수치사용,본계약은중복적용·상한·시점·사용성을구체화한다.

## 데이터와 구분

영구능력 A:1~100,내부0.0001정밀도. UI는내림정수,상승표시는내림후차이,상세에는소수1자리. 잠재력 P는능력별최소현재A/최대100. 생성분포는01,성장잔여점 F는작은소수로별도. 초상/유형/역할OVR/파생별칭은능력값아님.

style는 공격/투구방향,focus는 성장배분,training은시즌한번의영구능력/피로명령,modifier는기한있는유효능력효과. modifier를영구A에가산저장한뒤만료시빼는구현금지. 계약·레벨·메달은성장값에숨겨진추가배수를주지않는다.

## 연간 성장 한도

08의나이별예산은1세계시즌의전체성장점이다. 고교/퓨처스/KBO/마이너/MLB/상무/복귀를이동해도시즌마다각각받지않음. 기간가중예산=연간예산×해당기간세계정규일수/세계정규총일수×출장계수×훈련계수. 기간합은≤1. 대표휴식창은별도경험예산을생성하지않음. 선수강화+1/+2는별도원장으로1회,결산에재가산하지않음.

시즌중잠재력/나이가바뀌지않도록시즌시작snapshot 사용. 정산계산순서:기간별성장예산합→집중배분→상한재분배→소수누적→노쇠배분→최종하한→파생OVR/별칭재계산. 현재능력이P에도달하면그능력성장몫을재분배한다. 전능력상한이면남은성장점소멸,피로/불만페널티없음.

## 집중과 스타일

프리시즌집중정확4개,중간이벤트로바뀌면적용이후기간만새배분. 이전성장기간은focusHistory로남긴다. 포지션전환이벤트가집중을바꾸면효과미리보기후확정,원하지않는배분을뒤에서자동적용하지않음.

플레이스타일선택은프리시즌1번+정규72번째팀경기후1번. 부상/복무로해당경기통과시복귀구간에서미사용기회1회만제안,시즌넘기면소멸. 같은스타일유지는횟수소모없음,다른스타일확정때소모. 이미양쪽기회를썼으면효과설명조회만가능. 기록중과거타석재계산없음. 도전강화와별도카운터.

유형은성장배분에만적용하며12의구전술logit보정은폐기한다. 타석도중스타일변경명령불가,현재경기완료후다음경기에적용. 유형변경으로경기능력이나투구수에추가보너스를주지않는다. 위기관리는41의상황보정만적용한다.

## 강화 세부

worldSeasonId별 usage 0/1,상무와원구단공유(21). 훈련기회는42대로리그정규일정1/3(올림),KBO48/대학16/고교해당일정1/3. 승격으로체크포인트2번을지나도한번만제안.

확정 성장(사용자 선택 제공 확정, 수치 제안):상한여유≥1이면+1/피로+5. 도전:상한여유≥1이면60%+2,실패0,피로+10양쪽공통. 현재A98/P99인도전은실제+1경고. P-A<1이면해당능력대상불가,남은소수만얻는강화를소모시키지않음. 컨디셔닝은피로0이면효과0경고와확정가능,강제로새능력보상주지않음.

선택대기에서는usage미소모,START_SPECIAL_TRAINING커밋때결과seed·usage·A·피로·receipt동시에저장. 화면연출실패는서버결과다시읽기. 건너뛰기는'이번기회를닫음'으로표시하되오프시즌전재진입가능여부를고정:명시적건너뛰기는그시즌기회포기,부상자동연기는미사용유지.

## 노쇠와 부상

08의감소예산은세계시즌1회,기여기간합비율만적용.32세이상성장과감소모두가능,순증/증가/감소를따로보여준다. 부상입은날능력을무조건낮추지않음;v1영구부상감소없음. 부상효과는출장중지와훈련계수에만,노쇠는나이때문에별도.

같은해고교졸업과프로입단이겹쳐도시즌ID를공유해성장2배금지. 고교시즌/미국단축시즌이공존하면세계정규일수의서로다른기간을배정하고겹치는기간출전불가. 커리어중잠재력상향이벤트는없으며구단복사생성때만42의재설정적용.

## 19세 가져오기

사용자 결정 [32](32-USER-IMPORT-REBIRTH.md)를 적용한다. 능력치별 커리어 영구 최고값의50%로 시작하고 잠재력은 더 높게 새로 설정하되100상한을 유지한다. 원본은 불변, 복사본의 성장잔여/기록/병역은 새 출발이다. 기존 종료능력 그대로/기존잠재력 유지 규칙은 폐기한다.

## UI와 검증

능력상세:지난시즌A→집중성장→강화→노쇠→현재A, 임시보정별도. 잠재력은정확숫자대신발전전망,가져오기상한도동일표현. 미세성장이정수표시를못넘으면'소폭발전,표시값변화없음'으로거짓+1금지.

DEV01 기간이동연간예산보존. DEV02 전상한/한능력상한재분배. DEV03 소수누적재시도. DEV04 스타일동일선택횟수0. DEV05 타석중변경거절. DEV06 강화성공/실패피로공통. DEV07 상한미리보기. DEV08 상무복귀강화중복거절. DEV09 노쇠한번. DEV10 19세복사원본불변. DEV11 잠재력상한미세성장. DEV12 여러유형고정seed커리어분포. 실행전사양이다.

## 치트 프리셋 예외

[33](33-SECRET-CHEAT-DIFFICULTY.md):해당주인공잠재력100,양의자연성장예산3배,도전강화성공100%. 강화공유1회/영구능력100상한/노쇠기본값/군현역성장0은유지. 강화상승량자체는3배하지않음.


[42 성장기본안](42-GROWTH-DIFFICULTY-REBIRTH.md)에서난이도배율·강화시점·잠재력분포·19세/보정5~10·유형유지를설계기본값으로채웠다. 사용자개별수치승인과구분하며이전미정/고교절반/균형형초기화문장은대체한다.

---

<!-- SOURCE: 23-US-CONTRACTS-RIGHTS.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 상세설계 05 — 미국 진출·명단·포스팅·보유권

게임용 상세 계약, 현실 선수계약/노사협약 완전재현 아님.13의 진출 경로·기본 수치와19의 상태를 사용한다. 게임 선수 국적은KOR,실제 개인정보 미수집.

## 계약과 권리 엔티티

Contract: id,playerId,organizationId,type(KBO/US_MINOR/US_MAJOR),currency,guaranteedAnnualAmounts,signingBonus,startsWorldDay,remainingPaidDays,status,callupTerms,releaseTerms,militaryReturnOption,nationalReleaseAllowed. 금액은통화별정수,제안과계약은별도ID. Rights: sourceType(DRAFT/RESERVE/POSTING/FA),holderOrgId,territory(KR/US),activeFrom,activeUntil,releaseReason. 서로다른영토보유권존재가동시활성계약을허용하지는않음.

OfferSet은평가snapshot·기한·제안0개사유를포함. 조회는진로선택을확정하지않고ACCEPT가계약·등록·권리·예산을함께커밋한다. 수락전변경된권리/예산/기한을재확인한다.

## 고교 직행

국내계약0/고교결산완료→미국제안조회.13의점수로0~3구단. 제안세트는졸업시즌당1개,보면고정. 조건:초기Rookie/A,게임보유6시즌,계약금/연봉,대표차출/복무옵션. 같은고교시즌국내계약이미수락이면진로돌리기거절. 미국계약제안없음/전체거절은국내드래프트또는아마추어재도전으로연결.

미국팀계약은메이저즉시출전계약과다름을확정창에서두번용어로강조하지않고한번명확히표시. 계약금은선수수입원장1회,성장점/현금재화와무관. 대금입금애니메이션은실제결제아님.

## 마이너 명단과 승강

Rookie/A/AA/AAA각최소야수12·투수10. 조직전체100~160,MLB26/계약보호40 포함. 명단변경은승격선수·대체강등선수·양쪽정원검사를하나의명령으로처리. '자리없음'이면기준충족과실제콜업보류를구분표시. 선수기록과seasonGrowth는이동후에도같은ID/세계시즌.

최소표본/검토24경기/OVR기준은13. 해당24경기는현재레벨팀경기,승격후검토카운터0. 새로고침/레벨왕복으로검토기회를늘리지않도록다음가능worldDay도최소7일뒤. 부상재활강등은보직실패서사가아닌별도reason. MLB옵션연도는한시즌한번소모,20게임일이상배치조건. 옵션없음선수는동의/계약정리FA중가능한권리만노출한다.

MLB콜업알림/명단등록/실제첫출장을세개기록.26명빈자리에등록돼도백업미출전가능. 첫출장없이미국계약종료해도미국진출커리어와마이너기록을보관한다.

## 포스팅 원자성

조건7등록시즌/유효KBO계약/게임병역조건→신청→구단승인/보류. 승인과30일협상창시작은postingId로1회. 계약완료전원구단rights/연봉/등록이유지되고게임오프시즌이므로동시공식출장없음. 불성립시기존계약을'새재계약'으로한번더지급하지않는다.

성공commit:제안유효확인→미국예산예약→KBO기존계약종료→국내복귀보유권snapshot→미국계약활성→포스팅보상금구단원장→선수미국등록→경쟁제안취소. DB실패는전부롤백,응답유실은같은postingId/commandId결과조회. 보상금은13의게임20%이고선수계약금/연봉에서차감하지않음.

해외FA9시즌은postingId없이제안생성,국내보류권의해외FA해제여부를rights에명시. 국내FA8시즌만충족한선수에게해외승인불필요라고잘못표시하지않음.

## 계약 종료·국내 복귀 분기

| 출처/상태 | 국내 경로 | 미국 잔류 경로 |
| --- | --- | --- |
| KBO포스팅 후복귀보유권있음 | 원구단복귀협상,원구단권리포기시국내FA | 미국재계약/FA |
| KBO해외FA 후권리해제 | 국내FA제안 | 미국FA |
| 고교미국직행 | 게임2시즌준비→국내드래프트 | 미국계약/마이너FA |
| 미국현계약유효 | 정리합의후만복귀확정 | 현계약유지 |
| 유효복무복귀옵션 | 옵션정리후국내경로 | 조건맞는미국구단캠프 |

원구단과합의안됐다고다른국내구단과자동계약불가. 보유권기간무한소프트락을막기위해게임원구단우선협상은해당오프시즌30일,기한내유효최저제안도없으면rightsRELEASED로명시. 제안있는데선수가거절하면해당오프시즌원구단우선권유지,미국재도전/은퇴선택가능. 현실보유권제도를주장하지않는게임정책.

고교직행준비기간과드래프트35세종료조건은13/21,기존KBO경력자에게그조건을잘못적용하지않음. 다년계약정리보장금은원통화유지,고정환율은화면참고용. 미지급액을서로다른리그수입에두번합산금지.

## 대표·병역 연결

20의해외차출허가검사,21의계약정지/옵션복귀사용. 현역입대와새미국계약수락이동시에요청되면세이브행잠금+revision으로하나만성공. 국외진로버튼으로병역기한을초기화하지않음. 계약조항은제안때보여주고수락후추가하지않는다.

## UI·오류·테스트

S29/S32는같은비교표:currency/연봉/총보장/계약금/기간/초기레벨/차출/복무/보유권. 주전기대와보장은다르게표시. S30 레벨사다리는현재등록과검토조건을각각표시. S33 원구단권리·준비기간·나이제한을첫화면에서확인.

US01 제안조회만후국내진로. US02 수락동시요청계약1개. US03 콜업정원충족. US04 옵션시즌1회소모. US05 포스팅실패기존계약불변. US06 보상금1회/선수수입불포함. US07 해외FA/국내FA구별. US08 복귀권리있음/해제/기한만료. US09 직행복귀준비/병역중첩. US10 옵션복귀기한. US11 통화별원장보존. US12 MLB0경기라도은퇴보관가능. 문서테스트목표이며실행미실시.


확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.


장기세계후속66~73:재도전/평가범위/자연구단주기/사건충돌/provisional원장/복원simulationKey/불변조건/연도generation/실험계획. 해당분야의이전1회준비·복원물리ID난수해석은각최신문서로대체한다.

## 2026-10-21 미국 직행 제안 기한 U

사용자는 미국 직행 제안을 제안 후30게임일 동안 유효하게 유지하는 안을 선택했다. 발급일 포함 issuedWorldDay≤현재일<issuedWorldDay+30에서만 수락 가능하며30일 경계부터 만료다. 만료/전체 거절/다른 진로 확정 후 같은 졸업시즌의 제안을 다시 생성하지 않는다. 제안 열람은 국내/대학 진로를 닫지 않으며 만료해도 현재 합법 진로를 유지한다. 날짜 진행/기한과 제안 점수·구단·계약 조건은 저장하며 조회/복원으로 재추첨하지 않는다.

## 2026-10-27 KBO 출신 미국 마이너 계약 종료 — 사용자 확정 U

포스팅·해외FA로 체결한 미국 마이너 계약은 서명한 기간 종료 후 미국 재계약·FA 또는 국내 복귀를 비교한다. 고교 직행의6시즌 보유 규칙을 KBO 출신에게 추가 적용하지 않는다. 유효 다년계약과 이미 지급한 급여·이전 등록연차·국내 복귀권은 보존한다. 계약 종료 후 새 제안의 미정 수치는 임의 확정하지 않는다. 이 기록 자체는 해당 비교/계약 경로의 구현 완료를 뜻하지 않는다.

## 2026-10-28 KBO 출신 새 미국 마이너 제안 — 사용자 확정 U

서명한 기존 계약 기간 종료 후 비교하는 새 마이너 재계약/FA 제안의 기본 조건은1년·연$30,000이다. 기존 유효 다년계약/지급 급여는 보존하며 이 결정으로 과거 제안을 재가격하지 않는다. 미국/국내 진로 비교 결정은 유지한다. 구현은 후속이다.

## 2026-10-28 마이너 만료 후 비교 구단과 국내 복귀 — 사용자 확정 U

KBO 출신의 미국 마이너 계약 종료 후 원구단 재계약과 예산·포지션 수요를 충족하는 타 구단 최대3곳을 비교한다. 국내 복귀 옵션을 같은 진로 비교에 포함하며 국내 보유권·우선협상 규칙을 유지한다. 새 마이너 제안은 기본1년·연$30,000이다. 구현 완료 기록은 아니다.

## 2026-10-28 KBO 출신 마이너 첫 MLB 콜업 — 사용자 위임 확정 U

추천 방식으로 첫 콜업의 MLB 계약은 해당 시즌까지만 적용하고, 이후 FA 전에는 매년1년 재계약한다. 콜업 다음 날부터 연$800,000 일할 적용과 이미 지급한 마이너 급여 보존은 유지한다. 기존 다년 마이너 기간 전체를 MLB 급여로 새로 보장하지 않는다. 이미 봉인·진행한 저장을 재가격하지 않는다. 실행 연결은 후속이다.

## 2026-10-28 마이너 새 계약의 레벨 유지 — 사용자 확정 U

마이너 계약 만료 후 원구단 재계약과 다른 구단 새 계약 모두 현재 마이너 레벨을 유지한다. 계약만으로 자동 승격하지 않으며 승격은 기존 실제 경기 평가·명단·예산 절차를 따른다.1년·연$30,000과 원구단/타 구단 최대3곳/국내 복귀 비교 조건을 유지한다. 실행 시장 연결은 후속이다.

## 2026-10-28 마이너 제안의 경쟁 점수 수요 — 사용자 확정 U

타 구단 후보는 현재 레벨·같은 종류/포지션에서 기존 명단 교체와 같은 최저 경쟁 점수보다 높은 선수로 정한다. 기존 경쟁 점수 산식·예산을 사용하고 별도 확률/추가 문턱은 만들지 않는다. 타 구단 최대3곳·원구단 재계약·국내 복귀 비교와 현재 레벨 유지 조건을 지킨다.

---

<!-- SOURCE: 24-GAME-ENGINE-SCORING.md -->

# 상세설계 06 — 경기 엔진·교체·기록 판정

게임 전용 단순 엔진. 실제 공식기록 규약의 모든 예외를 재현하지 않는다.08의 타석확률,20의 국제연장 정의를 따른다. 타석을완료하고구간을저장하는순수엔진계약이다.

## 입력과 결정론

GameInput:고정gameId/seed/rulesVersion/홈원정/명단/라인업/유효능력snapshot. GameState:inning,half,outs,scores,bases,nextBattingIndex,activePitchers,pitchCounts,bullpenAvailability,playCursor,rngState,lines,phase. 엔진시간/실제기기/외부API는입력에없음. 경기중유효능력변경은다음타석부터적용하고seed호출순서를기록한다.

한타석 처리순서:명단/아웃검사→교체검토→능력/피로/스타일계산→결과추첨→주자이동계산→아웃/득점합법성→기록줄→교체예정/부상판정→3아웃공수교대/끝내기→다음타자. 타자교체는원래타순유지,교체선수의다른타순중복금지,교체된선수재출장불가.

## 타석·진루 테이블

| 결과 | 타자 | 주자 | 아웃 |
| --- | --- | --- | --- |
| BB/HBP |1루|밀린주자만1칸,만루1득점|0 |
| K |아웃|정지|1 |
| 1B |1루|기본1칸,2루주자추가홈시도규칙|0또는추가주루아웃 |
| 2B |2루|기본2칸,1루주자추가홈시도|0또는주루아웃 |
| 3B |3루|전원득점|0 |
| HR |홈|전원득점|0 |
| OUT |아웃|정지,조건부병살|1또는2 |

주자이동은원래3루→2루→1루순서로새베이스배열에구성. 추가홈시도는41의2아웃·주루≥60 조건과 주루/현재투수견제 기반 p=clamp(.70+.002×(RUNNING-50)-.0015×(PICKOFF-50),.40,.90)을 사용한다. 초기 고정70% 규칙은 폐기한다. 2아웃에서추가주루아웃이면타자의안타는유지,3아웃이발생한후다른주자추가득점없음. 병살은타자/1루주자강제아웃,3아웃이면그플레이득점0. 병살이3아웃을넘어4아웃으로기록되지않게경계검사.

실책/희생타/도루/고의사구/낫아웃/타격방해는v1제외. UI전체기록에서이항목을가짜실제값처럼표시하지않음. 안타주루아웃은타격기록H/AB유지,타점은실제합법득점만. HBP는BB와분리해OBP에는포함하고WHIP의BB에는불포함.

## 이닝·종료

9회초종료후홈리드면9회말생략.9회말이후홈이리드하면즉시끝내기,HR은전체주자득점/타점. 비HR끝내기는필요최소득점까지만인정하고선행주자와타자기록이충돌하지않는지검사. 정규12회종료동점은무승부,PS/국제는10회부터무사2루,20회후청크중단저장후이어감. 정규미국12회무승부는게임독자규칙으로도움말표시.

승부치기주자=다음타자직전타순선수,자동주자flag=true. 다음타자와같은ID로잘못놓지않음. 자동주자R은책임투수R에포함/ER제외. 후속정상타자가득점하면책임투수ER에포함. 주자마다responsiblePitcherId를보존해투수교체로승계책임이바뀌지않는다.

## 투수 운용

선발은08의90구/피로80검토·110구상한,불펜30구/2이닝교체검토. 현재타석은끝내고교체하므로110구를넘긴타석을삭제하지않음. 보직/피로/최근등판/남은이닝으로적임자선정,동률은70의 불변 simulationKey 기준이며 복원 시 바뀌는 물리 rowId를 사용하지 않는다. 마지막가용투수는상한초과에도지속할수있되피로페널티유지. 투수고갈때가상투수를공짜로추가하지않음.

시뮬레이션에투구수와타석수둘다상한감시. 한이닝300타석에도종료안되면결과추첨조작대신ENGINE_LIMIT오류로안전저장중지,진단seed기록. 이는확률상극단입력복구장치이며추첨승리기능아님. 요청당타석1000개또는완료이닝20개까지처리하고나머지는pendingGame에저장한다.

## 공식기록 게임 판정

08의W/L/SV/HLD/BS게임산식사용. 결정적리드는마지막으로동점이깨진득점이후다시동점이되지않은상황,결승득점주자의책임투수에L. 선발W의5이닝은outs≥15,구원기여동률은outs/ER/이른등판순. 각판정은종료후한번만수행하고이닝중예상W를최종W로저장하지않음.

다른분모:PA/AB/BB/HBP/K/H/TB/R/RBI;투수BF/outs/H/HR/BB/HBP/K/R/ER. outs=수비아웃합,주루아웃도그때등판투수outs에포함. ERA분모0이면null,화면'-'. 팀H=개인H합,팀R=개인R합=상대투수R합. 타자K=상대투수K합. 실책없는엔진이어도자동주자때R≠ER가능.

## 커밋과 이력

진행중게임과마감결과를구분. game.status COMPLETED인경기통계는다시합산하지않음. 마감시gameResult/누적기록/일정커서/피로/부상/승패순위/receipt를동일세이브트랜잭션. 경기이력의보존기간이끝나도확정시즌합계는삭제안함.

REC01 만루BB. REC02 2아웃진루실패. REC03 1/2아웃병살. REC04 홈리드9말생략. REC05 끝내기HR/비HR. REC06 자동주자ER0. REC07 승계주자책임. REC08 4.2/5.0선발W경계. REC09 BS+W/HLD배타. REC10 경기청크중단복구. REC11 경기완료재시도기록1회. REC12 HBP/WHIP분리. REC13 전원부상/가용투수부족오류. REC14 고정seed플랫폼일치. REC15 시즌팀/개인합계. fixture실행은엔진구현후수행.


경기최신수식: [41 여섯능력엔진](41-SIX-STAT-ENGINE.md). 위기관리대칭보정·체력/교체·역할평가를구체화하며구전술logit가산을폐기한다.

---

<!-- SOURCE: 25-CLUB-AI-ECONOMY.md -->

# 상세설계 07 — 구단 AI·계약·드래프트·장기 공급

게임 경제 기본값은05/08/15,MLB권리와입대원장은21/23. 현실구단재정·선발규정재현이아니다. 가상선수만으로시작가능하고내선수는선택이다.

## 세이브 생성과 가져오기

모든구단/로스터/계약을seed로생성한후사용자구단선택,원본선택0~28명. 대체는선수별탐욕알고리즘이아닌전체포지션매칭으로한번에검사. 필요한C2/수비8자리/투수최소10을유지하는후보를선정하고동일가상선수중복대체금지. 미리보기후생성최종커밋때원본소유/숨김/버전을재확인. 실패하면세이브/FA이동/복사본전부롤백.

원본은불변,복사본19세/기록0/피로0/계약1년최저연봉/성장잔여0. 시작능력은능력별커리어최고50%,잠재력은새상향설정(100상한),병역도재시작하며32를따른다. 원본이강력해리그가쉬워질수있으나자동하향없음,설정요약에'보관선수 사용'배지. 같은원본세이브당1개,다른세이브재사용허용.

## 운영 일자 트랜잭션

사용자진행전필수검사→당일제안/기한정리→등록변경→AI라인업→세계당일전경기→피로/부상→콜업추천→순위/개인기록→다음날. 하루를분할하면세계day마감플래그로다른팀결과누락을방지.1주일은달력7일,대표휴식창/의무사건이면일찍중단하고실제경과일표시.

사용자팀라인업은저장한설정유지,부상등불능이면'자동대체허용'설정에따라추천확인또는자동교체. AI는최소인원미달을무시해경기하지않음. 자동대체는적용내용뉴스로남김.

## 예산 원장

통화별account는seasonBudget,paidSalary,reservedSalary,guaranteedReleaseCost,reservedOffers,protectedMinimum,postingIncome,supportGrant. available=budget+postingIncome+supportGrant-paid-reserved-guaranteed-reservedOffers-protectedMinimum. double-count없도록일급지급때같은만큼reserved감소/paid증가.

계약제안의예약은총다년액이아닌당해분과미래연도보장액예산검사를함께수행. 미래보장합계가해당연도기본예산의90%를넘으면거절해최소인원여유확보. 동시FA제안은예약액을각각잡고실패/철회/만료때해제. 지급과예약해제는offerId/contractId별고유원장.

방출은미지급보장금유지,새팀계약을해도v1원보장금을자동상계하지않는게임규칙. 방출확정창은당해와향후지급의무를구분. 입대는21대로정지,복귀시잔여일급재예약. 예산부족새영입은거부,기존계약/최소로스터때문에불능이면명시적재정지원기록으로해결하고몰래채무삭제안함.

## AI 의사결정

v1은36의탐색스카우트를포함한다. AI와사용자모두현재능력/전망을기준으로평가. AI만숨은정확잠재력을조회하지않음. NeedScore:필수포지션공백100/백업부족50/단순업그레이드10. 가치=.6현재역할개선+.2전망+.2NeedScore-방출보장금비용정규화. 동일값은낮은계약비용→젊은선수→ID.

AI기한:정규20팀경기마다로스터검토,오프시즌매협상라운드1번. 무의미한같은선수왕복승강은7세계일금지,부상긴급대체만예외. 사용자복사본을원본출처때문에기피/우대하지않고능력과계약만평가. 다른팀은사용자시야밖이라도동일성장/은퇴적용.

## FA·드래프트와 선수 공급

FA협상3라운드,모든팀동시제안후40의확률경쟁계약으로선택. 08의구결정론수락임계식은폐기. 사용자만먼저선착순서명하는방식아님. 결과확정후경쟁제안취소/예약해제. 제안동점은금액/기간/팀ID. 라운드중응답유실은결과재조회,후보/희망가재생성없음.

KBO신인100명/역순10라운드,직행미국계약선수는국내후보에서제외. 국내복귀드래프트후보는게임자격을검사해추가하며기본100명생성값과별도출처표시. 드래프트는사용자차례에서멈춤/자동선택가능. 정원60넘으면지명보류가아닌정리단계로이동,방출보장비용확인후재개. 모든라운드후미지명은재도전풀.

은퇴선수는로스터에서빠지고영구기록실에는남음. 최소FA80명은15의낮은OVR독립선수충원,연간충원수/비용을진단에기록해고갈을가리기위한스타무한생성금지. 구단운영에서가상선수를개인보관함으로자동추가하지않음.

## 장기 검증 지표

연도별구단정원/미지급보장/잔여예산/FA수/평균나이/OVR분포/은퇴수/신인수/재정지원수/선수ID연결을출력한다.50시즌에서영입불능/무선수경기/중복계약0,기록성장과세이브크기는측정. 재정지원이팀연도의5%넘으면산식검토목표,현실수치근거아님.

CLB01 보관0명시작. CLB02 선택28명필수포지션실패. CLB03 FA동시낙찰1팀. CLB04 연봉예약지급보존. CLB05 방출뒤미래보장유지. CLB06 입대복귀분할예산. CLB07 AI승강왕복방지. CLB08 신인/귀국선수중복없음. CLB09 50시즌공급/경제. CLB10 백업복원후원본복사동일권리. 실행전계약이다.


[44 구단상세](44-CLUB-ECONOMY-AI.md)에서초기계약·스카우트시설비용·AI제안·긴급대체풀을구체화한다. 예산과정원제약은구단치트외공통적용.

오프시즌운영후속: [115](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md)의추천순서/실제기한구분·드래프트같은차례복구·FA예약/마감·병역/만료·미래보장108억원예시를함께읽는다. 기존도메인순서·권리·단일연도전환은유지한다.

---

<!-- SOURCE: 26-EVENT-CONTENT-CONTRACT.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 상세설계 08 — 이벤트69종 조건·문안·효과 계약

사건은 정해진 조건과 명령을 안내한다. 문구가 능력/계약/병역 상태를 직접 변경하지 않고 검증된 게임 명령이 효과를 적용한다. 서면 검수이며69개분기의fixture실행은미실시.

## 분류와 호출

E01~07 고교/진로, E08~20 육성/기용, E21~23 부상, E24~29 기록/시즌, E30~37 계약/은퇴, E38~40 구단, E41~43 스타일/강화, E44~48 대표, E49~55 병역, E56~69 해외경로. 국가대표/병역/계약상태를 일반35%추첨으로만노출하지않고해당의무task가호출한다.

고유 의무 사건: E05~09,E13,E21~24,E27~37,E41~44,E46~69는상태/마일스톤조건에따라발생. E25는해당올스타선발조건, E38/E39/E40은구단운영조건. 일반추첨은E10/E11/E12/E14~20/E26중충족후보만. 같은시즌일반최대3/체크포인트1. phase/선수kind/부상검사우선,지난사건과부정합이면후보제외. 일반사건쿨다운2시즌,카탈로그에시즌1회지정된것은해당지정우선.

고유키=(saveId,eventDefinitionId,sourceTaskId). 마일스톤은(playerId,milestoneId),훈련은(playerId,seasonId,training),대회는(playerId,competitionId,eventType),계약은offerSetId. ID만고유라모든시즌재계약을한번만막는오류금지. 커리어1회는E01~10의최초성격/E24/E27/E29/E46/E60/E65,단E05~07재도전은해당진로program별1회.

## 선택 정의

choiceId는안정코드,버튼순서를효과ID로쓰지않음. label/body/preview/result/successFollowup/failureFollowup/expiryReason을구분. 현재입력에없는성적을문안변수로사용금지. 원본표의'선택지결과조회'는조회행동이며기회재추첨아님.

확정순서:source 유효→선택가능성재검사→effect계산→실제상한절삭값반영→ledger키예약→상태와효과커밋→결과문렌더링. 결과문은실제 delta/actualRole/actualAppearance에서만생성. 출전희망을출전확정으로서술하지않음.

## 중요한 정정

- E21 통증은이미확정된의료결과뒤선택. 진단을다시추첨하지않음.
- E22 정상복귀는회복기간단축이나영구버프가아니라기용요청/피로차이.
- E30 거절은프로재도전총3/시즌1 제한,모든제안거절후은퇴행동필수.
- E35 B는읽기전용,영원히확정못하는화면이아니라A은퇴버튼유지.
- E37 자유인사는은퇴snapshot에영향없는별도메타데이터.
- E41 강제로스타일바뀜과선택변경은구분,횟수는22.
- E43 부상연기는기회유지,사용자건너뛰기는그시즌포기.
- E47 면제/복무완료대신자격후보. 실제출장증거필수.
- E49/E54 유예기한전후가능선택동적,기한후유예버튼없음.
- E57 계약조회만으로국내진로포기안함,수락때만고정.
- E59 승격을사양하면24경기와최소7세계일후검토,중복추첨없음.
- E61 옵션없음FA권리있는선수만선택,모든강등에FA버튼금지.
- E64 포스팅실패는원계약보존,임의능력감소없음.
- E68 국내준비2시즌과18개월복무포함관계.

## 문안과 접근성

한사건본문목표2~4문장/한선택제목20글자이내,효과는별도2줄. 200%확대시스크롤가능,선택확정하단버튼이내용을가리지않음. 긴이름은중립문장/조사유틸,게임내자유텍스트HTML탈출. 이름을비난하는실패문안금지,희망이실패했을때객관기록으로설명한다.

후속조건:선택뒤최초정규검토시점에다시판정. 결과달성시'요청한역할에서N경기',미달성시'기회로이어지지않음'. 상한때'강화대성공+2'로고정출력하지않고실제상승량. 대표탈락이면'대표로뛰었다'생성금지. 군복무/미국진출은실제리그상태값에서문장선택.

## 효과 fixture 포맷

각69종마다given{phase,playerKind,registration,availability,sourceId,revision,rng},when{choiceId},expect{nextPhase,actualDeltas,ledgerKeys,remainingChoices,renderedVariables}. 필수케이스정상/경계/조건소멸/동일명령재시도/다른choice동일명령ID/두기기동시선택. unsupported변수와누락된후속단계는콘텐츠빌드실패로처리한다.

## 69종 원본과 연결표

아래표는정의원본의모든ID를한번씩수록한다. 상세효과는04/12/13,전체문안E01~40은09,후반사건의본문은12/13의각행을사용한다. 본문의조건별결과템플릿은본계약과분야별상세문서로보강한다. 런타임콘텐츠작성때표의자연어조건을추측구현하지않고위fixture로코드/데이터의정합성을검증한다.

| ID | 사건 | 발생 조건/본문 참조 | 정의 원본 |
| --- | --- | --- | --- |
| E01 | 마지막 고교의 겨울 | HS_PRE, 고유 | [04-EVENTS.md](04-EVENTS.md) |
| E02 | 타격 자세의 갈림길 | 고교 타자, 12경기 | [04-EVENTS.md](04-EVENTS.md) |
| E03 | 마운드의 과제 | 고교 투수, 12경기 | [04-EVENTS.md](04-EVENTS.md) |
| E04 | 스카우트의 질문 | HS_RESULT | [04-EVENTS.md](04-EVENTS.md) |
| E05 | 지명을 기다리는 날 | DRAFT_RESULT | [04-EVENTS.md](04-EVENTS.md) |
| E06 | 이름이 불리지 않았다 | UNDRAFTED | [04-EVENTS.md](04-EVENTS.md) |
| E07 | 다시 받은 기회 | RETRY_RESULT, 제안 존재 | [04-EVENTS.md](04-EVENTS.md) |
| E08 | 프로의 첫 캠프 | 첫 PRO_PRE | [04-EVENTS.md](04-EVENTS.md) |
| E09 | 첫 1군 호출 | FUTURES, 자리 존재, 경쟁점수 충족 | [04-EVENTS.md](04-EVENTS.md) |
| E10 | 짧은 기회의 무게 | 첫 콜업 후20경기 | [04-EVENTS.md](04-EVENTS.md) |
| E11 | 두 번째 숙제 | 2군 한 시즌 종료 | [04-EVENTS.md](04-EVENTS.md) |
| E12 | 주전과 백업 사이 | 1군 타자, 출장비율<40% | [04-EVENTS.md](04-EVENTS.md) |
| E13 | 낯선 수비 자리 | E12 START_POSITION_PLAN 확정 후 계획24경기 완료 | [04-EVENTS.md](04-EVENTS.md) |
| E14 | 선발의 문 | RP, 체력≥60, SP 공석 | [04-EVENTS.md](04-EVENTS.md) |
| E15 | 마지막 아웃의 자리 | RP, 위기≥60, CP 공석 | [04-EVENTS.md](04-EVENTS.md) |
| E16 | 구속보다 안정 | 투수, BB9>4.5, 20이닝 이후 | [04-EVENTS.md](04-EVENTS.md) |
| E17 | 긴 무안타 | 타자, 최근20AB H=0 | [04-EVENTS.md](04-EVENTS.md) |
| E18 | 장타가 필요한 때 | 타자, 100AB HR≤1 | [04-EVENTS.md](04-EVENTS.md) |
| E19 | 흔들린 두 경기 | SP, 최근2등판 ER≥10 | [04-EVENTS.md](04-EVENTS.md) |
| E20 | 코치의 조언 | 일반, morale≤40 | [04-EVENTS.md](04-EVENTS.md) |
| E21 | 작은 통증 | 부상 판정 경미 시 | [04-EVENTS.md](04-EVENTS.md) |
| E22 | 긴 재활 | 부상 중간/중대 시 | [04-EVENTS.md](04-EVENTS.md) |
| E23 | 돌아온 그라운드 | 부상 회복 직후 | [04-EVENTS.md](04-EVENTS.md) |
| E24 | 처음 받은 박수 | 첫100H 또는 첫10승/20SV | [04-EVENTS.md](04-EVENTS.md) |
| E25 | 올스타의 초대 | 시즌중 성적 상위, 고유 시즌 | [04-EVENTS.md](04-EVENTS.md) |
| E26 | 라이벌의 등장 | 동포지션 경쟁점수±5 | [04-EVENTS.md](04-EVENTS.md) |
| E27 | 포스트시즌의 긴장 | 첫PS | [04-EVENTS.md](04-EVENTS.md) |
| E28 | 우승 뒤의 겨울 | 팀 우승, OFFSEASON | [04-EVENTS.md](04-EVENTS.md) |
| E29 | 첫 개인상 | 첫 수상 | [04-EVENTS.md](04-EVENTS.md) |
| E30 | 재계약 제안 | 비FA CONTRACT | [04-EVENTS.md](04-EVENTS.md) |
| E31 | FA 시장의 문 | 자격 충족 CONTRACT | [04-EVENTS.md](04-EVENTS.md) |
| E32 | 익숙한 유니폼 | FA 원구단/타구단 제안 존재 | [04-EVENTS.md](04-EVENTS.md) |
| E33 | 베테랑의 역할 | 나이≥33, 백업 전환 | [04-EVENTS.md](04-EVENTS.md) |
| E34 | 전력 외 통보 | 계약 미보유, 팀 후보 제외 | [04-EVENTS.md](04-EVENTS.md) |
| E35 | 마지막 테스트 결과 | 재도전 후 제안없음 | [04-EVENTS.md](04-EVENTS.md) |
| E36 | 떠날 시기를 고르다 | 수동 은퇴 가능 OFFSEASON | [04-EVENTS.md](04-EVENTS.md) |
| E37 | 마지막 인사 | RETIRED | [04-EVENTS.md](04-EVENTS.md) |
| E38 | 장기집권의 부담 | 구단 3연패, CLB_REVIEW | [04-EVENTS.md](04-EVENTS.md) |
| E39 | 기회를 원하는 유망주 | 구단2군,22세이하,경쟁점수상위 | [04-EVENTS.md](04-EVENTS.md) |
| E40 | 한정된 겨울 예산 | 구단 오프시즌, 예산<예정연봉 | [04-EVENTS.md](04-EVENTS.md) |
| E41 | 타석의 새로운 기준 | 프리시즌/시즌72경기. '지금의 장점을 어떤 접근으로 보여줄까요?' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E42 | 다른 이름의 선수 | 결산별칭변화. '이번 시즌의 변화가 선수의 인상을 바꿨습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E43 | 한 번의 특별훈련 | 시즌훈련기회. '한 가지를 더 다듬을 시간이 생겼습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E44 | 국가의 부름 | 최종후보. '대표팀이 합류 의사를 물었습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E45 | 대표팀 밖에서 | 선발탈락. '이번 명단에는 이름이 없었습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E46 | 첫 국제무대 | 대회첫실제출장. '유니폼 앞의 이름이 달라졌습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E47 | 메달과 다음 의무 | 올림픽메달/AG금+게임자격충족 | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E48 | 돌아오는 비행기 | 대회종료. '팀의 결과와 내 경기를 돌아봅니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E49 | 겨울의 병역계획 | 미해결오프시즌. '다가올 시즌과 복무 계획을 함께 생각합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E50 | 상무 선발 발표 | 지원1회확정. '지원 결과가 도착했습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E51 | 잠시 내려놓는 배트 | 현역복무시작. '원구단을 떠나 복무를 시작합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E52 | 부대의 그라운드 | 상무첫블록. '군 체육팀에서 야구와 복무를 이어갑니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E53 | 다시 받는 유니폼 | 18개월완료. '복무를 마치고 원구단으로 돌아왔습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E54 | 남은 마지막 겨울 | 27세미해결. '게임 규칙상 다음 시즌 전에는 복무 계획을 확정해야 합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E55 | 계속되는 활동의무 | ATHLETE_SERVICE오프시즌. '선수 활동과 함께 이행할 의무를 확인합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E56 | 졸업 뒤의 두 길 | '국내 지명과 미국 구단의 관심, 어느 길을 먼저 볼까요?' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E57 | 바다 건너의 계약서 | '첫 시작은 메이저 무대보다 작은 구장일 수 있습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E58 | 낯선 클럽하우스 | '언어도 준비도 낯설지만 오늘의 훈련은 시작됩니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E59 | 다음 레벨의 문 | 승격조건충족. '한 단계 높은 팀에서 기회를 받았습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E60 | 메이저리그의 전화 | '구단이 메이저리그 합류를 알렸습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E61 | 다시 내려가는 길 | 강등확정조건. '상위 명단에 남지 못했습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E62 | 포스팅을 요청하다 | '국내에서 쌓은 시간 뒤에 새로운 무대를 생각합니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E63 | 구단의 대답 | '원구단이 요청에 답했습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E64 | 협상의 끝 | '제안과 남은 시간을 함께 봅니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E65 | 처음 선 빅리그 | 실제첫출장. '명단의 이름이 경기 기록의 이름이 됐습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E66 | 미국에서 맞는 FA | '새 팀과 새로운 역할을 고를 수 있게 됐습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E67 | 돌아갈 그라운드 | '다시 국내에서 뛰는 길을 확인합니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E68 | 기다림도 커리어 | '복귀를 준비하는 시간이 지나갑니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E69 | 두 리그의 마지막 인사 | '어느 리그의 기록도 다른 기록을 지우지 않습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |


## 검수 결과와 남은 실증

정의ID69/고유69/빈본문참조0을정적검사한다. EN/일본어혼입/비밀키/복제코드없는지검수. 실행조건의도달가능성·UI문구폭·사건효과중복은엔진/목업실행후검증이며문서완료와구분한다.


최신카탈로그는[45 이벤트83종](45-EVENT-CATALOG-REVISION.md). 기존69종의본문/선택명령을갱신하고대학·탐색·제안·재건·가져오기14종추가. 구문안은시점보관이며런타임원본은v2설계카탈로그를따른다.

---

<!-- SOURCE: 27-UI-INTERACTION-RESPONSIVE.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 상세설계 09 — 33화면 입력·반응형·디자인 검토

서면 입력 계약 및 정적 시각초안. 실제 브라우저 자동화는 MXC sandbox의 permission path cannot be represented losslessly 오류로 실행되지 않았다. 픽셀/접근성/안드로이드 화면검수를 통과했다고 표시하지 않는다. 정적 목업에는 게임/로그인/저장 요청이 없다.

## 입력 컴포넌트 계약

TextField:고유label/id,설명/오류aria-describedby,입력원문보존후검증값별도. Select/Radio:커스텀div대신native컨트롤기본,선택과확정분리. MoneyField:통화라벨고정/최소최대/만원·달러단위표시,NaN/소수불허. Table:caption/열머리/정렬상태,이름열고정,가로스크롤안내. SlotPicker:드래그보조+클릭선택기본. Modal:취소기본포커스/확정대상명/배경포커스차단.

기본44px터치/48px버튼,본문16px. 모바일CTA하단safe-area,키보드열림시입력과오류가시영역보장. 선택확정중진행중문구+disabled,조회탭은계속읽기가능. 현재상태에서불가능한액션은숨김또는이유함께비활성,알수없는CTA를누른뒤에만이유를알려주지않음.

## 반응형 규칙

360/390:단일열·좌우16px·주요숫자3열·표외부스크롤.768:주정보/보조정보2열,선택카드최소280px.1280:최대1200px/탐색200px/본문+상세패널. 200%글자에서고정높이텍스트상자금지,카드min-height만. 긴이름/계약금은word-break/전체금액도움말,글자크기자동축소로숨기지않음. 표에없는통계는0이아닌'-'/미제공.

## 상태별 레이아웃

첫조회:skeleton후실내용,로드실패:재시도/홈. 진행중:현재상태유지+상단저장중. 결과불명:동일command확인,새명령불가. 충돌:최신상태불러오기,자동덮어쓰기없음. 빈보관함:커리어시작/가상선수구단시작. 제안0:잔류/재도전/은퇴유효경로. 부상/기한/권리제약은해당슬롯에이유표시.

색만으로상승/하락/메달/병역구분하지않음. 배경이미지앞본문은오버레이대비,이미지오류시단색배경과이니셜. 검은고딕은제목만,Noto는본문/폼. 영어숫자서체가없어도자릿수폭유지. 모든서체로딩실패시시스템고딕. 이미지대체문구는선수정보만,장식구장은빈alt또는aria-hidden.

## 화면·행동 매핑

17의S01~S33테이블을입력/다음화면원본으로사용. 상세한경기/계약/병역조건은19~26이서버권한계약. 정적목업의예시값은카탈로그규칙/실제저장상태를뜻하지않음. 폼확인/계약버튼은시각검토용이며외부요청하지않는다.

추가21개구조카드를실제컨트롤/표/리그레벨/병역진행표가있는정적시각초안으로확장한다. 카드에효과와실패경로를남기고이전'주요정보/입력명세'텍스트만표시한와이어프레임과구분. 수정된보드도렌더링확인전'완성디자인승인'이라고표시하지않는다.

## 시각 검수 매트릭스

각33화면×4해상도(360/390/768/1280),타자/투수,첫사용/데이터있음/실패/저장중조합. 모든조합스크린샷을기계적으로무한생성하지않고레이아웃유형별대표샘플검수후새위험발견시에만확장. 긴한글12글자/1억달러계약/100행/기록0/부상/미선발/비대상병역을포함.

UX01 폼label연결. UX02 tab/shift-tab/enter/escape. UX03 200%확대. UX04 safe-area/키보드. UX05 긴표/고정열. UX06 서체/이미지실패. UX07 선택후효과미리보기. UX08 실수방지확인대상명. UX09 충돌의최신조회. UX10 백업실패와일반저장구분. UX11 dark OS설정이어도대비명시. UX12 APK뒤로가기. 실행검수전명세다.

남은차단은렌더링도구/실기기실증이다. 입력/반응형설계완료와시각승인미완료를STATUS에서분리한다.


최신 확률 표시 규칙: [38 공통 계약](38-PROBABILITY-DISPLAY.md)을 따른다. 확률 선택은 모두 표시하되 실제 100%의 숫자 배지는 숨긴다. 보장 효과와 내부 확률은 유지한다.

---

<!-- SOURCE: 28-DATA-API-AUTH-TESTS.md -->

# 상세설계 10 — 저장 계약·API·인증·테스트 데이터

앱 코드나DB migration미작성.06/16의스키마를구체화하고구현자가임의보안우회를하지않게계약을고정한다. 실제인증SDK/Android교환/DB동작은구현후증명한다.

## 저장 구조 조정

한세이브세계의행동은game_saves행하나를잠가순서를보장. state JSONB가너무커질것에대비해immutable game_results/season_records를관계테이블로분리한다. state에는현재세계의가용선수/일정커서/작업큐/권리참조만. 과거선수의모든연도성적을세계JSON에무한중복저장하지않음. 선수원본archived_players snapshot은완결상태를독립보존.

추가테이블:
- game_results(save_id,game_id PK,season_id,competition_id,summary,boxscore,created_at),소유권은save연결.
- season_records(save_id,player_id,league_id,season_id,phase PK,raw_stats,awards,version).
- career_ledger(save_id,entry_key PK,type,source_id,delta,evidence,applied_revision),성장/보상/예산멱등원장.
- auth_allowed_subjects(subject PK,status,created_at),초대게임접근제어.
- native_sessions(id,subject,refresh_hash,expires_at,revoked_at,rotation_family),선택한앱세션설계용.
- login_exchanges(code_hash PK,subject,challenge,redirect_id,expires_at,consumed_at),일회용앱복귀.

profiles/game_saves/archive/import/backups/command_receipts는06유지. delete cascade는경기/원장/receipt에만,독립보관원본은명시삭제흐름. 돈bigint원/달러각각,outs int≥0,타자기록원시수치int≥0,versions int≥1,revision bigint≥0. JSON수치NaN/Infinity거절,외부ID문자열최대128,본문UTF8크기검증.

## 명령 처리 원자성

인증→allowlist→payload schema→save소유권→트랜잭션/행잠금→receipt조회→동일IDrequest hash일치검사→expectedRevision→phase/source/evidence검증→순수엔진→불변조건→state/분리기록/원장/receipt커밋. 엔진응답에서현재시각을직접생성하지않고서버명령입력값사용.

request_hash는type/payload/expectedRevision의canonical JSON으로계산,토큰/헤더/재시도시각불포함. receipt에결과revision/작은결과/이벤트ID만,5MiB state전체중복없음. 동일commandId다른내용409,동일내용은저장된원래결과반환. source검증실패명령은성공receipt가아니라재시도금지오류이며부수효과0.

반복조회로완료결과를찾을수있게GET /api/saves/:id/commands/:commandId제공,없음404는다른사용자/미실행구분노출없음. 사용자가진행중새로고침하면이조회부터하고그다음save최신조회. 응답불명인명령과다른명령을동시에보내지않음.

## API 계약

공통요청헤더Authorization또는웹세션,Client-Version,Request-ID.명령POST에는commandId/expectedRevision/type/payload.성공{commandId,revision,phase,summary,eventIds,nextActions,result};오류{code,messageKey,requestId,fieldErrors?,currentRevision?,retryAfter?}.민감예외stack/SQL/접속문자열전달금지. 게임 화면용 state/stateChanges는67/75/100의 공개 DTO projection을 거친다. 서버 SaveState를 그대로 반환하지 않고 일반 응답의 rawP/seed와 미해금 히든 조건·진척을 제외한다. 원본 보관·백업 내부 상태와 화면 응답은 별도 자료형이다.

목록cursor는updatedAt+id의 안정적인 조합,타사용자목록접근불가.상세기록API에는leagueId/seasonId/phase필터필수에서 대표/MLB/마이너통계를혼합하지않음.정렬열은정적allowlist,사용자문자열SQL직접연결금지.문자입력은문자열로렌더링.

본문한도명령64KiB,서버state5MiB경고/분리마이그레이션,백업압축해제10MiB.타임아웃30초안에못끝나면청크축소/pending진행을사용.타임아웃을rollback보장으로알리지않음.

## 인증·앱 연결

관리형 인증 후 API 검증과 allowlist 검사를 별도로 실시한다. 웹 쿠키는 HttpOnly/Secure/SameSite와 CSRF 검증을 사용하며, 네이티브는16의 시스템 브라우저 교환 계약을 따른다. 원격 SDK가 정식 지원하는 세션 검증 흐름을 사용하고, secret 없는 공개 클라이언트에서 서명을 생성하거나 위조하지 않는다.

login exchange는서버난수256bit/code hash보관/60초/단일사용/PKCEchallenge/등록redirect와 연결.URL에는code+state만,access/refresh/JWT없음.exchange/refresh token은URL로그와분석대상제외.앱secret는 OS보안저장소, localStorage를영구refresh보관소로쓰지않음.

API access15분/refresh30일게임기본설계.refresh회전은이전hash재사용시family철회.고아세션/동시정상refresh의경합은기존회전결과를같은requestId로짧게조회하도록설계하고재사용공격과구별.공급자지원확인전임의자체JWT구현확정하지않음.

## fixture와 테스트 계층

세트 F01 고교미지명/제안0,F02 타자주전/F03 투수콜업,F04 41세원본19세복사,F05 MLB계약/포스팅실패,F06 AG금/미출전/F07 상무탈락/복무복귀,F08 두기기revision충돌,F09 자동주자ER/F10 예산예약동시제안.모든seed/초기state/명령/예상delta를버전고정.

순수엔진테스트: DB없이정확한상태/합계/난수재현.DB통합:개발Neon브랜치에서 실제트랜잭션/unique/rollback/소유권.스토리지통합:private버킷작은파일업로드/체크섬/다운로드/삭제, 테스트데이터만정리.API E2E:가입/로그인/보호접근/클라우드진행/재로그인/원본보관.Android:실기기AppLinks/중단복귀/업데이트.

성공스냅샷을코드와 같은 식으로 재생성해 비교하는 테스트는 피한다.경계기록은사전에수작업으로기대값정의하고property검사로H합/outs/금액원장보존.시간/난수/외부계정은주입가능하게분리.테스트가운영게임세이브를 임의 수정하지않음.

## 배포전 차단

계정삭제/backup소유권/JWT검증/PKCE원회사용/receipt재시도/DBrollback중하나라도검증미완료면공개배포금지.로컬prototype와실제접근제어없는공개웹을동일완성으로보지않는다.서면설계완료가이통과를대체하지않음.


최신 확률 표시 규칙: [38 공통 계약](38-PROBABILITY-DISPLAY.md)을 따른다. 확률 선택은 모두 표시하되 실제 100%의 숫자 배지는 숨긴다. 보장 효과와 내부 확률은 유지한다.

## v0.8 추가 데이터·API 계약

40~46의설계구체화를따른다. 실제SQL/배포명령은아직없다. 새필드는처음구현할스키마에포함,이미존재하는게임세이브가있다고가정한데이터덮어쓰기없음.

| 논리 엔티티 | 추가 필드/제약 |
|---|---|
| rules_versions | abilitySchemaVersion2,growth/odds/college/economy/event/UI버전;세이브별고정 |
| players | kind별정확6abilities/potential/careerPeak;overall파생/roleScore분리 |
| development_plans | worldSeasonId,focus4중복없음,style,periodHistory,growth원장 |
| imported_players | sourcePeakVersion,importDraftId,19세startingAbilities,boost6개,resetMilitary,sourcePreset |
| college_enrollments | schoolId,academicYear,completedYears,status,earlyDraftAttempted,휴학/복학원장 |
| scouting_searches | ownerClubId,worldMonthId,조건,N/level/q,pSnapshot,cost,commandId/result선수ID;횟수원장 |
| scouting_reports | discoveredPlayerId,level,평가일,potentialRange6개;같은선수P재생성없음 |
| offer_rounds/offers | fixedAiOfferVersion,score/weight/outsideWeight/pSnapshot,예약슬롯/당해·미래예산,receipt |
| club_accounts | paid/reservedOperations추가;시설level1~5;무제한은mode열,Infinity금액불허 |
| event_instances | catalogVersion2,E01~83,sourceEntityId,occurrenceKey,choiceSnapshot,resumePhase,receipt |

preview명령는READ연산,난수소비/비용/usage없음. 실제SCOUT/UPGRADE_SCOUT/SUBMIT_OFFER/RESOLVE_ROUND/ENROLL_COLLEGE/ADVANCE_ACADEMIC_YEAR/CONFIRM_IMPORT는revision+idempotencyKey검사. 계약확정은선수당활성계약1개/제안예약해제/계약원장하나의transaction. 구단치트의효과는서버세이브preset에서읽고클라이언트가p=1을전송해도무시한다.

학교권리/원본소유/후보풀/시즌기회가바뀌면409후최신preview,유효조건없음422와reasonCode,결과불명은동일commandId조회. 앱이자기DB권한으로다른친구세이브/비공개파일을읽지못하는28의원칙유지. 입력진로가숨겨져도서버에서조건재검사한다.

확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.


2026-10-19 사용자필수:웹·APK중단후이어하기. [76 이어하기계약](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의홈최근게임/서버resumeDescriptor/송신전저널/receipt재조회/경기·선택·작업복원과12검수시나리오를적용한다. 서버확정진행은종료이벤트와무관히보존,미송신초안은별도기기선호다. 미리보기/확정의복구는[74](74-PREVIEW-COMMAND-RECONCILIATION.md).

---

<!-- SOURCE: 29-OPERATIONS-RELEASE-RUNBOOK.md -->

# 상세설계 11 — 운영·백업·APK·배포 실행 계획

문서계약과읽기전용환경조회만수행. 실제배포/버킷생성/DB테이블변경/로그인구현/APK빌드는하지않았다.

## 확인 사실

2026-10-16 CLI조회:지정프로젝트 polished-truth-68571504,이름baseball_career,조직org-purple-shadow-03640418,지역aws-ap-southeast-1. 설치된Neon공식스킬의객체저장소지원지역과일치. 기존서비스/보호설정/Auth지원/버킷/DB접속성공을이조회만으로보장하지않음. GitHub계정과push는연속설계커밋에서검증. Node/npm/Java/ADB실행파일존재확인,Android Studio/SDK/Gradle호환/실기기/서명은별도.

## 사전 점검 순서

1. 정상checkout/AGENTS/변경파일/remote확인. 사용자의기존설정/문서덮어쓰기금지.
2. Neon CLI프로필은비밀출력없이확인. 로그인필요시사용자가브라우저인증,대체프로젝트생성금지.
3. .neon/neon.ts/.env*존재와관리변수이름만검사. 이미공급된DATABASE_URL이면보존. dev브랜치생성/연결은실제구축단계에서수행.
4. 요청한postgres/private object-storage선언과live plan비교. Auth추가는선택한인증설계와실제지원/보호설정확인후별도선언. 허용IP/PrivateNetworking을편의상해제하지않음.
5. direct migration→개발테스트→운영backup→호환migration→서비스→APK순서.

## 백업 원자성·보존

소스revision을잠깐확정하고고정snapshot을job에참조,객체업로드는긴DB잠금밖에서실행. pending/uploaded/ready/failed상태,체크섬일치후ready. 동일backupId/key로재시도. 인접게임진행이revision을올려도원backup의state를바꾸지않음. 일반진행저장과파일실패분리.

복원은소유권→크기제한→gzip완료→스키마/버전→SHA256→불변조건→새saveId. 원본/새세이브선수IDnamespace매핑,이전receipt복사없음. 프로필/인증세션은게임백업에포함하지않음. imported원본참조를못열어도복사본자체능력은독립보존.

자동10/수동10보존. 보존정리job은새backup ready후실행,업로드중마지막정상백업을먼저삭제하지않음. 삭제키는DB소유권/참조/보존검사후확정,로그에서명URL/secret없음. 실패시기존ready파일유지. 계정삭제시30일내보존기간정책적용,운영복구시에삭제계정데이터재노출방지목록유지.

## 서버·웹 배포

Node단일호스트가API/정적웹제공(16). health는프로세스/ready는DB기본조회+schema호환,응답에비밀/DB주소없음. 버전endpoint는app/api/schema최소호환버전만. DB장애면새명령일시거부,이미받은명령은receipt확인후재개.

시크릿은호스트환경에만,GitHub Actions로그의env전체출력금지. 공개빌드에는API주소/버전/기능표시만. dev/prodAPI주소와Neon연결혼합금지. 캐시해시는정적자산,저장API는private/no-store. 보관원본다운로드도공개CDN으로캐시하지않음.

실패대응:빌드실패현재서비스유지;호환migration실패쓰기중지/진단;런타임회귀는이전호환서비스복귀;새schema세이브를옛앱이못읽으면읽기거부/업데이트안내. 운영state일괄리셋/DBdrop/강제push를복구절차로사용하지않음.

## Android 릴리스

고정packageId는출시명결정뒤정하고서명키를새빌드마다만들지않음. 키는저장소/ZIP밖에보관,외부별도백업. 버전코드단조증가/표시버전동기화. 로컬웹자산포함,HTTPS운영API사용,cleartext운영허용금지. 시스템브라우저로그인/AppLinks/DigitalAssetLinks인증서fingerprint연결확인.

release APK설치→로그인복귀→보호API→커리어저장→강제종료/재개→웹같은계정조회→기존서명업데이트→보관원본/백업복원. debug성공을release성공으로대체하지않음. APK를다른사람에게보내는배포/스토어등록은이설계의실행이아니다.

## 실증 차단표

| 항목 | 현재 | 완료 증거 |
| --- | --- | --- |
| GitHub문서push | 확인 | local HEAD=origin/main |
| Neon프로젝트지역 | 확인 | 필터링CLI메타데이터 |
| DB마이그레이션/트랜잭션 | 미실시 | 개발브랜치테스트출력 |
| private파일업/다운 | 미실시 | 실파일체크섬/접근거부 |
| 웹/APK로그인 | 미실시 | 가입/복원/로그아웃/권한거부 |
| 반응형렌더링 | 도구오류 | 각대표화면시각기록 |
| release APK/업데이트 | 미실시 | 실기기버전/서명/진행복원 |
| 호스트가격/도메인 | 미결정 | 소유계정/플랜선택,임의결제없음 |

## 릴리스 승인 자료

npm run build실제출력,엔진/DB/API테스트요약,private스토리지E2E,보안권한음성케이스,웹/APK재로그인/버전호환,미해결결함과사용자영향,롤백대상커밋/마이그레이션버전. 문서에명령을적은것은실행결과가아니다.

## 추가 읽기 전용 조회 결과

production 브랜치 br-nameless-dust-a10jtrs6:ready/primary/default 확인. 데이터베이스SQL이나파일서비스실행검증이아닌브랜치메타데이터다.
로컬실행버전:Node v24.19.0,npm11.17.0,OpenJDK21.0.12.1,ADB1.0.41/37.0.1. Capacitor/Gradle호환이나APK빌드통과를뜻하지않는다.


장기세계후속66~73:재도전/평가범위/자연구단주기/사건충돌/provisional원장/복원simulationKey/불변조건/연도generation/실험계획. 해당분야의이전1회준비·복원물리ID난수해석은각최신문서로대체한다.


2026-10-19 사용자필수:웹·APK중단후이어하기. [76 이어하기계약](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의홈최근게임/서버resumeDescriptor/송신전저널/receipt재조회/경기·선택·작업복원과12검수시나리오를적용한다. 서버확정진행은종료이벤트와무관히보존,미송신초안은별도기기선호다. 미리보기/확정의복구는[74](74-PREVIEW-COMMAND-RECONCILIATION.md).


2026-10-19 플랫폼 보완: [86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md). 네 환경의 웹 플레이+Android APK를 기본 목표로 정리합니다. iPhone은 Safari/홈 화면 웹앱,Windows/macOS는브라우저. 별도iOS·데스크톱 설치형은후속 선택 범위. 실제 호환 검수 미실행.

---

<!-- SOURCE: 30-INTEGRATED-DESIGN-REVIEW.md -->

최신 가져오기 규칙: [사용자 결정32](32-USER-IMPORT-REBIRTH.md). 아래의 능력치 그대로/기존잠재력·병역혜택 계승 제안은 폐기되며, 능력별 최고50%·상향잠재력·병역재시작으로 읽고 관련 기대값을 교체한다.

# 상세설계 12 — 통합 경로 검토본과 구현 전 게이트

설계 검토본. 사용자 최종 승인·제품 동작·밸런스 통과를 대신하지 않는다. 상세설계01~12의 문서 계약을 작성했고, 실행이나 계정 소유가 필요한 검증은 차단 항목으로 남겼다. 이 검토본으로 앱 구현을 자동 착수하지 않는다.

## 최신 문서 우선순위

사용자의최신확정요구→14공통결정→19~29분야별상세계약→01~18기본안. 현재30의통합정정은분야별모호함에한해적용. DETAIL-PLAN/STATUS의현재값이옛ZIP/구버전통합본보다우선.19상태,20국제,21병역,22성장,23미국,24경기,25구단,26이벤트,27UI,28저장·인증,29운영담당.

## 최종 교차 정정

1. 보관함100명상한폐기. 은퇴선수영구보존요구때문에한도도달로은퇴가막히거나기록이삭제되면안된다. 목록페이지당50,API페이지네이션/인덱스/보관비용측정. 활성세이브10개제한은새게임시도에만적용,은퇴보관/복원에필요한안전슬롯을삭제선택으로정리할수있게한다.
2. 상무강화블록당1회라는초기안은21/22의세계시즌공유1회로대체. 부대/복귀연속사용중복없음.
3. 대표등록/실제출장/팀메달/개인자격/복무완료별도. 후보선발과희망보직은경기출전보장아님.
4. 국제연장재경기/추첨승리초기안폐기.20/24의승부치기·청크저장적용. 자동주자는다음타자직전타순.
5. 고교미국제안조회만으로국내진로종료하지않음. 포스팅승인만으로원구단계약/권리종료하지않음.
6. 보관원본은최종영구능력/최종나이,19세복사본은새연차/새기록. 성장/P/병역정책은14/22,개인기록과구단기록역반영없음.
7. 현재문서의게임산식·연령·기간·등록기준·연장규칙은독자기본값. 현실제도/실제계약가능성을보장하지않음.
8. 과거'UI33화면완료'는입력/구조/정적초안범위. 실브라우저/Android가독성승인은현재미완료.

## 요구별 최종 연결

| 요구 | 정의 | 정상·실패 경로 |
| --- | --- | --- |
| 타자/투수일대기 |19/22/24|고교·성장·출장·은퇴,미지명·부상·강등 |
| 독립구단 |25|원본0명으로운영,예산/정원탈출 |
| 어린선수투입 |14/22/25|능력별최고50%의19세,원본불변,선택취소 |
| 미국직행/포스팅 |23|마이너/MLB/계약실패/국내권리복귀 |
| 스타일/강화 |22|시점·상한·실패·기회공유 |
| 국가대표 |20|선발/미선발/사양/출전0/부상교체 |
| 병역 |21|유예기한/지원탈락/복무/체육요원/복귀 |
| Neon클라우드 |28/29|멱등/권한/충돌/백업실패/복원 |
| 웹/APK |27~29|반응형/세션복원/버전호환/업데이트 |
| 다른환경인계 |START-HERE/HANDOFF/통합MD|상대링크/현재Git원본/기존ZIP구분 |

## 교차 시나리오 리뷰

국내성공/국내미지명/현역복귀/상무탈락/상무대표자격/고교미국성공/미국실패국내준비/포스팅성공·실패/국내복귀보유권/대표미출전메달/가상선수구단3시즌/41세원본19세투입/웹APK동시명령/은퇴응답유실/백업복원과원본출처를문서상대조. 정상진행또는유효한실패행동을정의했다. 실행엔진으로경로도달성을증명한것은아니다.

## 게이트 판정

| 게이트 | 판정 | 설명 |
| --- | --- | --- |
| D1 요구 정합 | 서면 점검 | 확정 요구 누락 없이 문서 연결 |
| D2 규칙/분기 | 계약 작성 |19~25,실행 불변조건은 미검증 |
| D3 이벤트 |69종 연결/효과 계약 |조건 fixture와 실제문구폭 미검증 |
| D4 화면 |33개 정적 초안/입력 계약 |렌더링도구오류,시각승인차단 |
| D5 데이터/API |계약 작성 |Auth/DB통합/기기로그인 미검증 |
| D6 운영 |일부읽기확인 |Neon지역/production/Git확인,호스팅/도메인/서명미확정 |
| D7 사용자 검토 | 미실시 |이번최종문서작성은사용자승인대행아님 |

## 구현이 시작될 때의 순서

현재 구현하지 않는다. 이후 착수 지시를 받으면: 저장소/버전고정→순수경기엔진fixture→성장/상태기계→DB명령멱등/보관→짧은타자·투수커리어→대표/병역→미국경로→구단운영→웹전체UX→APK/실서비스E2E→장기분포조정. 개발중작은단위를검증하되필수미국/구단/병역기능을완성범위에서빼지않는다.

공개배포전필수:의존성실버전공식문서확인,Neondev브랜치테스트,실제로그인/권한거부,private파일체크섬,전체엔진합계,실기기서명APK,빌드출력. 이들이없으면작동확인완료로보고하지않는다.

## 완료의 의미

남은 항목마다 작성→정적검사→독립커밋→push하는 흐름으로 문서화를 진행했다. 현재 가능한 상세 계약과 인수인계는 정리했으나 문서만으로 재미·성능·모든분기의실행가능성·화면픽셀을완벽히보장할수없다. 남은차단을숨기지않고단계별실증으로해소한다.

## 이번 통합 정적 검사 결과

화면ID 고유33, 이벤트ID 고유69, HTML 이미지·폰트 참조 누락0, 추적된 .env/credentials/서명키 파일0. 각 항목의 Markdown 상대 링크와 git diff --check를 통과한 후 커밋한다. 비밀파일명 검사는 모든 내용의 보안검사를 대신하지 않는다. 브라우저 실행은 MXC 경로 표현 오류로 차단됐고, build/엔진/DB/로그인/APK 테스트는 실행하지 않았다.

---

<!-- SOURCE: 31-USER-PACING-TRAINING-DIFFICULTY.md -->

# 사용자 결정 01 — 진행 속도·확정 강화·난이도

사용자 답변을 반영한 확정 요구다. 이전의 모든 기본 제안보다 우선한다. 앱 구현은 시작하지 않는다. 세 가지 방향만 확정됐으며 개별 확률·배율은 승인받은 값으로 취급하지 않는다.

## U16. 월별 기본 진행과 시즌 빠른 진행

사용자가 선택한 방향: 월별 성적·사건 확인을 기본으로 하고, 중요한 사건에서 멈추며, 원하면 시즌 빠른 진행도 사용한다.

커리어 기본 CTA는 '다음 달까지'. 보조 CTA는 '시즌 빠른 진행'. 둘 다 같은 경기·성장·사건 엔진과 seed를 사용하고 결과에 속도 보너스/페널티가 없다. 월별 화면에서 해당 월 성적, 누적 성적, 기용·피로·능력 관련 이야기, 다음 할 일을 보여준다.

프리시즌/계약/대표/병역 단계는 월 진행 대신 현재 의무 행동을 표시한다. '다음 달'을 누르면 목표 월 말 또는 가장 먼저 도착한 의무 사건에서 중단한다. 계약·은퇴·스타일·강화·대표 참가·병역 등 사용자 선택을 건너뛰어 자동 확정하지 않는다. 시즌 빠른 진행도 해당 사건에서 멈추고, 답한 뒤 계속할지 사용자가 결정한다.

진행 요청은 내부 청크(기존 최대6팀경기)로 분할하고 각 청크를 저장한다. 월은 사용자 UI의 진행 단위, 청크는 저장/복구 단위로 구분한다. 사용자가 중간에 앱을 닫으면 마지막 커밋 날짜에서 복원하고 남은 빠른 진행을 자동 재개하지 않는다.

기존 '다음 이야기/24팀경기까지'는 기본 진행 방식으로 사용하지 않는다. 24경기 콜업 평가,48경기 강화,72경기 스타일 검토는 엔진 조건으로 유지하지만 월별 진행 중 그 조건을 만나는 경우에만 해당 선택에서 멈춘다. 세계 날짜를 월 표시에 매핑하는 calendarVersion은 세이브에 고정한다. 특정 월에 경기가 없으면 휴식/복무/오프시즌 상태를 보여주고 가짜 성적을 만들지 않는다.

## U17. 시즌당 한 번 강화, 확정 성장 포함

사용자 확정: 강화 기회는 시즌당1회이며 확정 성장 선택지도 제공한다. 확정 성장과 확률 도전은 같은1회 기회를 공유하며 각각1회씩 주는 것이 아니다.

메뉴의 첫 선택지는 '확정 성장', 다음은 '도전 강화', 보조는 '컨디셔닝'. 확정 성장은 실패가 없는 영구 능력 증가다. 기존 기본값은 확정+1/도전60%로+2·실패0/컨디셔닝피로-20이지만 이 구체 수치·피로 비용은 설계 제안이며 사용자 확정이 아니다. 강화 화면은 확정/확률 여부, 실제 상한 반영 변화량과 비용을 함께 표시한다.

확정 성장 선택이 있어도 잠재력 상한을 몰래 넘기지 않는다. 상한 때문에 증가할 수 없으면 대상 변경/다른 선택/기회 건너뛰기를 안내한다. 세계 시즌당 공유1회, 소속팀/상무/마이너/콜업으로 횟수 초기화 없음. 강화 커밋의 멱등·응답 유실 복구는22를 따른다.

## U18. 현실형과 성장형 모두 제공

새 선수 커리어 생성 시 '현실형'과 '성장형'을 선택할 수 있어야 한다. 현실형은 2군·경쟁·방출·실패도 경험하는 경력, 성장형은 더 안정적으로 성장하며 스타를 목표로 하는 경험이다. 이름/설명은 사용자 선택 의도를 반영하며 어느 난이도도 성공을 보장하지 않는다.

세부기본안은42에서작성:일반1.5/하드1배,초기능력·잠재력분포공통,부상·진출조건공통,난이도생성후고정. 수치의사용자개별승인이아닌설계기본안이다.

설계 제안: 선택한 difficultyPresetId/version을 세이브에 저장하고 생성 요약에서 공개한다. 보호된 기록·난수·강화 성공 결과를 사후 조작하지 않는다. 동일 게임 내 동료·상대의 난이도 처리와 보관 선수 출처 배지는 명시적으로 설계한다. 구단 운영 난이도까지 이번 답변으로 확정된 것으로 확대하지 않는다.

## 관련 화면·데이터 변경

S02 선수 생성: 진행 방식 안내와 난이도2종 비교 추가. S03/S30:월 목표 진행/시즌 빠른 진행/현재 날짜·저장상태. S23:확정 성장 선택지 명시. 세이브 설정은progressMode(MONTH/SEASON_FAST),difficultyPresetId,difficultyVersion,calendarVersion. 진행 속도는 언제든 변경 가능한 편의 설정, 난이도변경은생성후불가(42기본안)으로 구분한다.

PC01 같은 seed로 월별/빠른 진행 최종 결과 동일. PC02 두 방식 모두 의무 사건 앞에서 중단. PC03 월간 성적과 통산 분리. PC04 중간 종료 후 커밋 날짜 복원. PC05 확정 강화 성공100%와 공유1회. PC06 상한 도달 때 허위 증가 없음. PC07 현실형/성장형 생성과 저장 복원. PC08 미확정 배율을 사용자 승인값으로 표시하지 않음. 실행 전 테스트 명세다.

## 이어서 물어볼 사항

가져오기최고50%/상향잠재력/병역재시작은32사용자확정,보정5~10/19세/난이도는42기본안으로채웠다.

## 숨김 프리셋 추가

사용자 결정 [33](33-SECRET-CHEAT-DIFFICULTY.md)에서일반2종외숨겨진치트모드를추가했다. 치트의성장3배/잠재력100/강화확률100%는이번사용자가정한값이며,기존일반2종의세부배율미확정상태와구분한다.


[42 성장기본안](42-GROWTH-DIFFICULTY-REBIRTH.md)에서난이도배율·강화시점·잠재력분포·19세/보정5~10·유형유지를설계기본값으로채웠다. 사용자개별수치승인과구분하며이전미정/고교절반/균형형초기화문장은대체한다.

---

<!-- SOURCE: 32-USER-IMPORT-REBIRTH.md -->

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 원본 복사 시 던지는 손·타석·투구폼은 원본에서 그대로 승계한다(정체성, 변경 없음).

# 사용자 결정 02 — 최고 능력 절반·새 잠재력·병역 재시작

사용자 답변과 조건부 선택을 반영한다. 이전의 '은퇴 능력 그대로19세 복사/기존 잠재력 유지/병역 혜택 계승' 규칙을 대체한다. 보관 원본은 여전히 불변이며 내 선수 투입은 선택, 구단 운영은 독립이다.

## 확정 요구와 판단

U19: 능력치별 커리어 최고값의50%로 시작한다. 전성기 한 시즌/한 시점 전체 벡터가 아니다. 각 능력의 최고값 시점은 서로 달라도 된다.

U20: 잠재력은 상향해 새로 설정한다. 사용자 조건은 '100 초과가 밸런스에 문제가 없으면 허용, 아니면100 상한'이다. 현재1~100 엔진의 clamp/능력차정규화/성장상한/AI평가/표시계약 때문에100 초과는 잘리거나 전반적 재조정이 필요하다. 따라서 이번 설계는 능력·잠재력100 상한을 유지한다. 이는 실행 밸런스 실험을 마쳤다는 뜻이 아닌 현재 구조의 일관성 판단이다.

U21: 새 구단 복사본은 어린 선수의 병역을 다시 시작한다. 원본의 메달·복무 완료·체육요원 자격을 복사본에 승계하지 않는다. 원본의 모든 병역·대표 이력은 출처 탭에 보존한다.

시작19세는 기존 설계 기본값(D)을 유지. 정확한 잠재력 보정 폭·절반 계산의 표시 반올림 방식은 아래 제안값으로 표시한다. 앱 구현 미착수.

## 영구 최고값 산정

careerPeakAbilities[k]는 생성 능력을 초기값으로 하고 영구 능력 갱신이 확정될 때 max(기존최고,새영구능력)로 갱신한다. 집중 성장·영구 강화 후 상승은 포함, 피로·사기·스타일·부상·복귀조정 등 임시 유효능력은 제외한다. 노쇠로 떨어져도 과거 최고값은 감소하지 않는다. 타자와 투수의 서로 다른 키를 변환하거나 투구 km/h 표시값을 절반으로 만들지 않는다. 투수는 구속능력1~100의 최고값을 반으로 계산한다.

은퇴 snapshot은 finalAbilities,careerPeakAbilities,finalPotential,peakEvidenceVersion을 모두 저장한다. 잠재력이 커리어 동안 바뀌는 기능이 향후 생기면 careerPeakPotential도 별도 유지한다. 현재v1에서는 잠재력 변화가 없어 finalPotential을 원잠재력으로 쓴다. 가장 좋은 시즌 성적에서 능력치를 역추정하지 않는다.

기존 snapshot에 최고값이 없으면 '최고치 정보 없음'으로 투입을 보류하고 확정된 이력에서 재구성하는 호환 절차를 거친다. 은퇴 능력을 최고값이라고 조용히 대입하지 않는다. 현재 구현 전이므로 새 archive 스키마부터 필드를 포함한다.

## 복사본 생성 제안식

영구 시작 Anew[k]=max(1,peak[k]×0.5). 현재 내부0.0001 정밀도, 표시는22의 내림정수 규칙을 따른다. 최고값91이면 내부45.5, 정수 표시45, 상세45.5. 정수반올림으로정확히절반에서벗어나지않음. 최고값1의하한예외는최소능력1을보존하는게임경계다.

잠재력 제안식: Pnew[k]=min(100,max(peak[k],sourcePotential[k])+boost[k]),boost는고정seed로5~10점. boost범위는D이며사용자가개별승인한수치가아니다. 최고능력보다못한새상한을만들지않고,가능하면원잠재력보다높아진다. 원잠재력100이면새상한100,더높게만들었다고거짓표시하지않는다. Anew보다Pnew가낮을수없다.

예시: peak100/P100→시작50/새상한100. peak90/P95→시작45/새상한100(보정5이상). peak80/P85→시작40/새상한90~95. 새상한 도달은 성장·출장·나이에 따른 결과이며 반드시100이 된다는 보장은 없다.

재설정 난수는 구단 생성 미리보기의 importDraftId와원본ID에 고정한다. 화면 재열기/새로고침/네트워크 재시도로 잠재력을 바꾸지 않는다. 다른 구단 세이브에서 새 육성 캐릭터로 가져오면 다른 importDraft seed를 사용할 수 있으나, 이는 로컬 개인플레이의 설계 제안이다.

## 초기화와 병역

복사본은 새ID/19세/건강/피로0/기록0/프로등록0/성장잔여0/1년게임최저연봉. 잠재력 새 설정, 초기유형은원본유지기본,생성미리보기에서변경하고집중4개다시선택(42). 원본 medal/award/peak는 출처 탭, 복사본의 새 명예/국제기록에 가산하지 않는다.

병역대상 복사본은 UNRESOLVED로 생성하고 원본COMPLETED/ATHLETE_SERVICE/ATHLETE_ELIGIBLE 상태는 승계하지 않는다. 타깃 구단 세계의 병역대상 설정이 비대상이면 NOT_APPLICABLE이며, 원본의 실제 완료 이력을 가져와서 비대상으로 바꾸지는 않는다. 실제 사용자 성별·건강·국적을 추정하지 않는다. 다시 대표팀 선발/상무지원/현역 경로를 진행할 수 있다.

원본 강화 usage·이벤트해결·등록연차·FA자격·은퇴플래그·복무program은 새 복사본에 복사하지 않는다. 원본 snapshot을 수정하지 않고 출처 참조로 연결한다.

## UI·데이터·검증 변경

S11 원본:종료 나이/최종 능력/능력별 최고/이전 기록. S12 미리보기:원본최고→50%시작값→발전전망,19세,병역 재시작,기록 초기화. '능력치 그대로' 문구는 제거하고 '최고 능력의 절반으로 다시 육성' 사용. 정확한잠재력숨김정책은유지,원본이100이었다면'다시 최고단계까지 발전 여지'를보여준다.

imported_players에peakSnapshotVersion,importPolicyVersion,importDraftId,startingAbilities,reinitializedPotential,militaryReset=true를 기록한다. 클라이언트의 임의 peak/boost를 신뢰하지 않고 서버가 소유 원본과 고정 seed에서 계산한다.

IMP01 모든peak100→시작50/상한100. IMP02 능력별서로다른시점최고값수집. IMP03 임시버프최고값제외. IMP04 홀수최고의소수절반. IMP05 원잠재력95→상향100/100→100. IMP06 원본병역완료→복사본미해결. IMP07 새대회성적없이옛메달재혜택없음. IMP08 미리보기재시도잠재력동일. IMP09 원본없음/peak없는구버전호환. IMP10 원본불변과구단0명선택유지. 모두 실행 전 명세다.


[42 성장기본안](42-GROWTH-DIFFICULTY-REBIRTH.md)에서난이도배율·강화시점·잠재력분포·19세/보정5~10·유형유지를설계기본값으로채웠다. 사용자개별수치승인과구분하며이전미정/고교절반/균형형초기화문장은대체한다.


확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.

118 후속:[118](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md)은후반커리어→은퇴원본→19세복사/지도자역할의경험과계보claim경계를연결한다. 기존원본불변·반값·병역리셋·같은세계역할하나규칙은유지한다.

---

<!-- SOURCE: 33-SECRET-CHEAT-DIFFICULTY.md -->

최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 사용자 결정 03 — 난이도 선택의 숨겨진 치트 모드

게임 설계와 디자인 보드 입력 시연 범위다. 실제 게임 엔진/API/DB 구현은 하지 않는다. 사용자 요청은 숨겨진 난이도, 강화확률100%, 잠재력100, 성장3배다. 다음 상세는 구현 가능한 기본안으로 구체화하며 제안값은 구분한다.

## 1. 표시와 기존 난이도

처음에는 치트 관련 버튼·회색 잠금카드·물음표·해금 안내를 표시하지 않는다. 정상 난이도 선택 영역의 특정 순서 입력을 완료했을 때에만 아래에 '치트 모드' 카드가 생긴다. 해금만으로 선택하거나 선수 생성을 자동 확정하지 않는다.

기존 성장형·현실형 두 난이도는 유지한다. 버튼 표시명은 사용자 예시와 맞춰 '일반(성장형)'/'하드(현실형)'을 기본 제안으로 사용하며, 이름이 바뀌어도 stable difficulty ID는 GROWTH/REALISTIC으로 유지한다. 해금 순서는 표시 텍스트가 아닌 이 ID의 클릭으로 판정한다. 이름 매핑은 화면 명칭 제안이며 일반/하드의 개별 배율을 이번에 확정하는 것은 아니다.

## 2. 이스터에그 입력 상태

정확한 순서: 일반→일반→일반→하드→하드→하드→하드. 난이도 영역에서 발생한 7번의 활성화가 연속 순서와 일치해야 한다. 이미 선택된 같은 카드도 매번 클릭으로 센다. 다른 폼 입력이나 스크롤은 난이도 입력 횟수가 아니므로 카운터에 영향 없다. 난이도 화면을 떠나거나 새 생성 폼을 시작하면 초기화하는 기본안이다. 시간 제한은 없어 빠른 클릭을 강요하지 않는다.

상태는 progress 0~7, unlocked bool. 일반 클릭:progress0~2면+1,3이면3유지(마지막 일반3번의 접미사),4~6이면1로돌아감. 하드 클릭:progress3~6이면+1,0~2면0. progress7이면unlocked=true,이후입력은해금상태유지. 따라서 하드먼저4회는해금안됨,일반3/하드2/일반/하드4도해금안됨. 다른난이도가추가되면그난이도활성화는progress0으로리셋.

native button click 한 종류로 처리하며 pointerdown/up/keyDown까지 별도로 누적하지 않는다. Tab 이동은 카운트하지 않고 Enter/Space 활성화는 클릭과 동일하다. 키를 누른 채 반복 발화되는 key repeat는 하나의 활성화로 취급하도록 실제UI에서검증한다. '더블클릭' 특수이벤트를추가로세지않는다.

해금 직후 카드가 일반/하드 아래에 나타나며 focus는 원래 하드 버튼에 유지한다. 비밀을 찾기 전에는 알림 없음, 찾은 후에만 '새로운 난이도가 열렸습니다'를 aria-live로 안내한다. '치트 모드' 카드를 직접 선택해야 선수 생성 요약에 반영한다. 해금 뒤 일반으로 바꿔도 같은 생성 폼에서는 카드가 사라지지 않는다.

기본은 현재 생성 폼에서만 해금. 기기/계정 영구 해금, 기존 진행중 세이브의 난이도 변경은 이번 범위에 자동 추가하지 않는다. 치트로 만든 세이브를 불러올 때는 저장된 난이도를 복원하며 다시 이스터에그 입력을 요구하지 않는다.

## 3. 치트 프리셋

| 항목 | 치트 적용 | 적용하지 않는 것 |
| --- | --- | --- |
| 강화 확률 | 능력 도전 강화 성공100% | 횟수 무제한/상한 돌파/결과값 추가3배 아님 |
| 잠재력 | 대상 선수의 모든 능력별 잠재력100 | 시작 능력치를 모두100으로 만드는 효과 아님 |
| 성장 | 양의 자연 성장 예산3배 | 노쇠/부상/피로/상금/계약금/강화증가량3배 아님 |

세계 시즌 공유 강화1회는 유지. 확정 성장 선택지도 유지하고 도전 강화가100% 성공하더라도 기존 제안된 비용/증가량/상한 규칙은 유지한다. 정상난이도 강화60% 등의 수치는 별도밸런스제안. 선택후효과는강화성공보장으로안내하고100%숫자배지는38대로숨긴다.

성장식:22의정상연간성장예산×3→기간/출장/훈련계수→집중배분→P상한→노쇠. 양의성장과음의노쇠를먼저상계한뒤순증에3을곱하지않는다. 상한에잘리는경우실제증가량만표시. 성장이없는일반현역복무기간은0×3=0,영구능력상한100유지.

기본 적용 대상은 치트 난이도로 생성한 커리어 주인공 한 명. 동료·상대·타구단·대표선수 전체가 같이3배 성장하지 않는다. 드래프트·MLB진출·대표선발·병역·계약·실제경기승리는기존평가로계산하므로치트만으로자동성공/면제시키지않는다. 부상위험감소와강제주전은추가요구없으므로없다.

## 4. 서버와 저장

difficultyPresetId=SECRET_CHEAT,version,beneficiaryPlayerIds=[protagonistId],trainingSuccessOverride=1,potentialPolicy=ALL_100,positiveGrowthMultiplier=3를 서버 정의 프리셋에서 조회. 클라이언트가 임의 배율이나능력값을보내면거절한다. 생성 확정 때 난이도와잠재력100을같이커밋한다. UI해금상태는현재폼메모리,게임효과는저장된서버프리셋이원본이다.

이스터에그는발견용UI이지권한비밀/보안경계가아니다. 자신의새게임에치트프리셋을고르는것은허용하지만타사용자세이브수정은여전히금지. 해금카운터를신뢰해소유권검증을대체하지않는다. HTTP로preset을지정한사실을부정행위라고추정하지않으며일반적인payload/인증검증은동일하다.

일단커리어를시작하면난이도는고정하는기본안으로한다. 기록/보관원본에는originDifficultyPresetId와version을남긴다. 치트세이브도개인용정상저장/백업/은퇴보관가능,공개랭킹은기존범위밖이다.

## 5. 보관 선수 가져오기와 연결

치트 출신 원본도32의능력별커리어최고값50%로가져온다. 최고100이면시작50,새잠재력상한100,병역재시작. 원본의100잠재력은새잠재력계산상100상한과정합하지만성장3배/강화100%프리셋을구단복사본에자동승계하지않는다. 출처표시는보존. 구단숨김치트는36/44에추가확정되었으며개인성장치트자동계승은없음.

## 6. 화면·예외·테스트

S02 난이도카드추가,해금전DOM접근성목록에도치트선택없음. 선택후생성요약에효과3개와최대100/시즌강화1회표시. 화면밖다른플레이어에게배너노출하지않음. S03/S30상세설정에는선택된효과를확인가능하게하며치트난이도를일반으로속여저장하지않는다.

CH01 일반3+하드4해금. CH02 하드4먼저실패. CH03 중간잘못된입력리셋. CH04 같은선택반복카운트. CH05 키보드활성화중복없음. CH06 해금후수동선택. CH07 새폼초기화/저장불러오기프리셋복원. CH08 잠재력100/시작능력기본값. CH09 양의성장3배/노쇠원배. CH10 도전강화100%/횟수1. CH11 현역0성장/상한절삭. CH12 원본보관과50%복사에치트자동계승없음. CH13 동료/상대효과없음. CH14 타사용자권한검증. 모두구현전테스트명세다.


최신 확률 표시 규칙: [38 공통 계약](38-PROBABILITY-DISPLAY.md)을 따른다. 확률 선택은 모두 표시하되 실제 100%의 숫자 배지는 숨긴다. 보장 효과와 내부 확률은 유지한다.


65사용자추가확정:개인치트는구종양의XP도3배/연간구종cap60. 기존6능력자연성장3배와각별도원장,강화증가량·횟수는기존대로. [57](57-REPERTOIRE-DETAILED-CONTRACT.md).

---

<!-- SOURCE: 34-ARCHETYPES-COLLEGE-ODDS.md -->

# 사용자 결정04 — 선수 유형·대학 진학·진로 조건·확률

앞선 도구 실패로 저장되지 않았던 요청과 추가 답변을 함께 반영한다. 사용자 확정 요구는 거포형·거포수비형 등 유형 중심 표현, 대학 진학 추가, 미국 경로는 능력과 유효 오퍼가 있을 때만 노출, 드래프트 예상 라운드·지명 확률 표시, 단순 설정의 적용100% 배제다. 실제 앱 구현은 하지 않는다.

## 1. 선수 유형

타자:균형형/거포형/거포수비형/교타형/출루형/출루수비형/수비주루형/5툴형. 투수:균형형/강속구형/제구형/구위제구형/이닝소화형/위기관리형. 최종 여섯 능력 구성과 육성4개는35를 따른다.

초기 유형은 생성 능력 분포, 시즌 유형은 성장 방향이다. 둘을 같은 이름 계열로 표현하되 기존 능력치를 유형 변경으로 덮어쓰지 않는다. 거포수비형은 파워·수비 성장에 실제 영향을 줘야 하며 타석 공격 logit만 바꾸는 이름표가 아니다. 이전 컨택우선/장타승부 전술 선택 메뉴는 이 유형 중심 선택으로 대체하고, 기존 타석logit 보너스를 자동 중복 적용하지 않는다.

기본 유형의 스타일 배분 초안:거포는파워50/컨택20/선구안10/수비5/주루5/클러치10,거포수비는파워35/수비35/컨택10/선구안5/주루5/클러치10. 나머지 유형은35의 여섯 키만 사용하며 합100을 검증한다. 구체 배분은 설계 기본값으로 사용자 수치 확정과 구분한다.

## 2. 대학 진학

고교 결산의 상시 경로는 KBO드래프트와대학진학. 미국진출은 아래조건충족시만추가. 대학은 가상 야구부 명단에서 입학 가능한 경로를 제공하며 선택 후 입학 제안0으로 막히지 않는다. 학업성적·수능·실제 개인정보 입력, 학비 결제 시스템은 만들지 않는다.

게임 학년은19세1학년→20세2학년→21세3학년→22세4학년,연48경기를 기본안으로 한다. 실제 대학야구/KBO 특정연도 자격 재현이 아니다. 2학년 시즌 뒤 조기드래프트 또는재학,4학년 뒤 졸업드래프트 또는조건부미국진출. 2학년미지명은3학년복귀,4학년미지명은아마추어재도전횟수검사후독립훈련/은퇴. 조기 프로계약 수락 시 학적LEFT_FOR_PRO,졸업학위자동생성없음.

collegeYear/yearsCompleted/schoolTeamId/enrollmentStatus/earlyDraftAttempted를저장한다. 대학은registration=COLLEGE로 기존월별진행/유형/육성4개/세계시즌강화1회/부상/성장을공유. 고교와같은기간성장중복없음. 대학기록은고교/프로/국제와분리,영구능력최고값원장에는포함.

대학복무는학년정지/세계날짜와나이진행,제대후복학. 대학생도21의게임병역기한유지. AG게임후보에는대학생허용을추가하고다른국제대회는20의최근프로1군기록기준유지. 대학성적지수보정D=-18,OVR은동일척도. 대학직행미국계약은routeOrigin=COLLEGE_DIRECT로기록하고아마추어미국진출의국내복귀권리를적용한다.

## 3. 미국 경로 노출 보장

미국직행카드는현재소유세이브의능력조건충족+유효한미국계약제안≥1개일때만노출. 미달이면잠긴카드/오퍼없는선택버튼도표시하지않는다. 조건 검사와오퍼세트생성을진로화면응답전에같이수행한다. 이전 '미국부터선택→오퍼0' 정상경로는폐기한다.

사용자확정U(2026-10-21):13의 미국 스카우트 평가65 이상·유효오퍼1개 이상·계약/학적/나이제약 유효일 때만 미국 진로를 표시한다. 종합52·별도 아마평가50 조건은 폐기한다. 역할 실력/보정성적/스카우팅 전망과 고정 seed 평가변동을 합산하며 종합점수와 구분한다. 실제 제안은 offerSetId/version/유효기한과 함께 저장한다. 제안 생성 실패/제안0은 미국 카드 숨김으로 처리하고 다른 합법 진로는 유지한다.

버튼은'미국 프로 진출·계약 제안N건'. 선택하면이미생성된제안을비교한다. 화면이오래돼기한/권리가달라진예외는최신진로다시조회로복귀,국내선택을몰래확정하지않음. 미국제안조회만으로국내진로포기없고최종계약수락때만확정. 대학2/4학년검토도같은계약,포스팅신청은별도국내경력조건이므로그대로유지.

## 4. 확률을 표시할 대상

강화성공률/드래프트지명률/미확정경쟁선발가능성처럼의미있는불확실결과에만표시. 유형·집중4개·난이도·입학가능대학선택·메뉴·조회·잔류의확정동작에'적용100%'를붙이지않는다. 실제확률100%는숫자배지를숨긴다. 치트강화도동일하며38공통계약을따른다.

모든확률에는대상·조건·기준시점·정확/예상라벨을동반. '지명확률70%'가1라운드70%또는주전70%라는뜻이아님. 단순탐색목록에숫자를채우려고임의확률생성금지. 명단확정후에는확률이아닌선발/탈락결과. 미래능력/타인변화를계산할수없으면범위또는'평가 대기'를표시하고거짓숫자없음.

## 5. 드래프트 라운드와 확률 계약

게임제안모형:평가확정점수B+균등평가변동U[-5,5]로최종점수S,지명선S≥45. B는역할평가0.7+고교/대학리그보정성적지수0.3. 수치는D로고정버전관리한다. 계약가능한구단슬롯이없으면0%/참가불가사유,가짜개별지명률제공없음.

이단순모형의정확지명확률=clamp((B+5-45)/10,0,1). B40이하0%,B45는50%,B50이상100%. 평가는선수에게보이는규칙으로서명시하며확정오퍼를받은것과구분한다. 기존08라운드식은10라운드가사실상안나오는모순이있어아래구간으로정정한다.

라운드구간D:1=[81,∞),2=[77,81),3=[73,77),4=[69,73),5=[65,69),6=[61,65),7=[57,61),8=[53,57),9=[49,53),10=[45,49),미지명<45. 각확률은[B-5,B+5]와구간의교집합길이/10. 예상라운드는지명조건부최빈구간,동률이면라운드범위. 전체가능범위와각라운드분포는도움말. score는확정seed로한번만추첨,미리보기조회는난수미소모.

예:B45이면지명50%,10라운드40%+9라운드10%+미지명50%,'지명될 경우10라운드유력'표시. 예시카드는반드시예시표시. 현실드래프트의경쟁/구단지명순위를정밀재현하는모형은아니며향후전체후보경쟁모형을도입하면동일preview/evaluator로교체하고version을올린다.

S28:KBO드래프트카드에예상라운드/지명확률,대학은성장/추가지명기회,미국은실제제안수. S05결과는실제라운드/미지명,예상과결과를혼용하지않음. scoutPreview{assessmentId,version,asOfRevision,probabilityKind,selectionProbability,roundProbabilities,conditionalLikelyRounds}. 실제판정과같은스냅샷/식사용,공개확률과실제기준불일치금지.

AR01 유형키6개합계. COL01 고교대학진학/2학년미지명복학/4학년졸업. ROUTE01 능력미달미국카드없음. ROUTE02 노출시유효오퍼≥1. ODDS01 B45의확률합100. ODDS02 양끝점/동률라운드범위. ODDS03 조회seed불변. ODDS04 단순설정확률배지없음. ODDS05 치트훈련100%실제반영. 실행검증전계약이다.


대학세부상태·학교9종·일정·조기지명/복학/졸업·휴학은[43 대학커리어](43-COLLEGE-CAREER.md)를따른다.

## 2026-10-21 미국 직행 제안 기한 U

사용자는 미국 직행 제안을 제안 후30게임일 동안 유효하게 유지하는 안을 선택했다. 발급일 포함 issuedWorldDay≤현재일<issuedWorldDay+30에서만 수락 가능하며30일 경계부터 만료다. 만료/전체 거절/다른 진로 확정 후 같은 졸업시즌의 제안을 다시 생성하지 않는다. 제안 열람은 국내/대학 진로를 닫지 않으며 만료해도 현재 합법 진로를 유지한다. 날짜 진행/기한과 제안 점수·구단·계약 조건은 저장하며 조회/복원으로 재추첨하지 않는다.

---

<!-- SOURCE: 35-SIX-ABILITIES-FOUR-FOCUS.md -->

# 사용자 결정05 — 6개 능력·4개 육성·종합평균

사용자 확인:타자 컨택/파워/선구안/수비/주루/클러치,투수 구속/구위/제구/위기관리/체력/견제. 각능력과잠재력상한100,육성집중은서로다른4개를선택,종합점수는여섯능력산술평균. 이전4개표시/7개타자능력/1~2집중선택/가중OVR주표시는폐기한다.

## 여섯 키와 역할

| 타자 키 | 표시 | 경기 영향 |
| --- | --- | --- |
| CONTACT | 컨택 | 삼진·인플레이안타 |
| POWER | 파워 | 장타분포 |
| DISCIPLINE | 선구안 | 볼넷·스윙판단 |
| DEFENSE | 수비 | 포지션적합도와안타억제·송구복합 |
| RUNNING | 주루 | 추가진루·주루아웃회피 |
| CLUTCH | 클러치 | 지정득점권타석에서작은유효능력보정 |

| 투수 키 | 표시 | 경기 영향 |
| --- | --- | --- |
| VELOCITY | 구속 | 삼진·타구결과;1~100능력과km/h별도 |
| STUFF | 구위 | 삼진·피안타·피장타 |
| COMMAND | 제구 | 볼넷·사구 |
| COMPOSURE | 위기관리 | 지정위기상황보정 |
| STAMINA | 체력 | 투구부담/회복·교체 |
| PICKOFF | 견제 | 주자추가진루·주루성공확률억제 |

견제능력이추가됐다고즉시별도견제아웃/도루엔진을구현하는뜻은아니다. v1에서는기존추가진루시도에영향,향후도루/견제플레이가생기면확장한다. 타자의체력·송구와투수의수비는독립성장능력에서제외,피로는상태로유지하고야수내구/투수수비는고정기본프로필로처리한다. 없어지는능력을숨은일곱번째잠재성장축으로남기지않는다.

## 종합 점수

overallExact=sum(영구능력6개)/6,화면은소수1자리반올림. 내부평가/동률비교에는반올림전값. 능력평균을100이상으로반올림하지않음. 모두100이면100.0,모두50이면50.0. 예72/64/68/81/70/65의합420,종합70.0. 선택스타일/포지션/피로로표시종합을몰래바꾸지않음. 경기현재상태는별도의컨디션으로표시.

포지션별기용에는roleScore가필요하면별도사용하되'종합'으로표시하지않는다. 기존문서의roleOVR이종합과혼용된것은overall/roleScore로분리한다. 예포수수비/선발체력가중으로기용점수를계산할수있지만상세도움말에서만공개. 드래프트/미국노출은34의평가기준에서어느점수를쓰는지명시한다. 기본능력조건은 해당 진로 원문을 따르고 포지션 선발은roleScore. 미국 직행은13/34의 별도 스카우트 평가를 사용하며 종합 문턱은 없다.

## 주요 육성 4개

UI는현재종류6개중서로다른4개정확선택,4/4상태·선택기술명표시. 0~3개일때확정불가,5번째선택시'최대4개'안내,자동으로기존선택빼지않음. 선수유형추천4개를한번에선택하는버튼가능,사용자가변경가능. 유형/난이도선택에는확률숫자없음.

성장배분D:연간성장예산80%를선택4개(각20%),나머지20%는미선택2개에유형weight대로배분. 선택전능력상한이면상한없는다른능력으로재분배,총예산보존. 전부상한이면소멸. 분배비율은사용자확정수치가아닌새기본안으로표시. 이전집중50%+유형50%는이안으로대체. 치트는양의예산3배후이분배,강화증가량은별도.

유형weight6개D:균형16.666…씩,거포[20,50,10,5,5,10],거포수비[10,35,5,35,5,10],교타[45,5,25,10,10,5],출루[25,5,45,10,10,5],출루수비[10,5,35,35,5,10],수비주루[5,5,10,35,40,5],5툴[20,20,10,20,20,10]. 투수강속구[40,30,10,5,10,5],제구[5,15,45,20,10,5],구위제구[10,35,35,5,10,5],이닝소화[5,10,20,10,50,5],위기관리[5,15,20,40,15,5],투수균형같은비율. 합100검사.

## 경기 보정 초안과 정합

득점권(2/3루주자있음)타석에서clutchDelta=(CLUTCH-50)×0.05를컨택/파워유효능력에적용,±2.5점범위. 투수위기관리의기존상황효과와별도로합산하되둘다영구평균에영향없음. 클러치100이라득점권안타100%아님.

기존추가홈진루성공70%는p=clamp(.70+.002×(주루-50)-.0015×(견제-50),.40,.90)로제안. 선행타석상태의현재투수견제를사용하고결과를주루원장에기록. 주루가순수속도만뜻하지않음을도움말로설명. 투수투구/삼진식에견제를다시가산하지않음.

## 데이터·초기유형·가져오기

abilitySchemaVersion=2와종류별정확6개키. 초기생성은이전초안배열을그대로혼합하지않고6개유형데이터표로재작성,일반/하드초기총점동일여부는난이도후속검토. 실제구버전세이브는아직없으므로구현시처음부터v2,향후외부호환필요시명시변환. 빠진클러치/견제를0이나숨은100으로조용히만들지않는다.

원본careerPeakAbilities도여섯키,최고각각50%로복사하고종합평균다시계산(원본종합최고를반으로가져오지않음). 치트잠재력은6개전부100. 강화대상도6개. 레이더는6축/숫자목록함께,소수표시와업다운기호유지.

ABI01 키6개. ABI02 평균100상한/예시70.0. ABI03 집중정확4/중복거절. ABI04 예산80/20합보존. ABI05 주루·클러치실제영향. ABI06 견제의진루확률상한. ABI07 원본6키최고값/복사평균. ABI08 치트6개잠재력. ABI09 표시종합과기용점수분리. 실행전계약이다.

## 초기 능력 배열 기본안

순서는표의6개키,모든일반유형의초기합계300/평균50을유지한다. 이는사용자승인수치가아닌스타일비교용기본안이다.

| 타자 유형 | 컨택 | 파워 | 선구안 | 수비 | 주루 | 클러치 |
| --- | --- | --- | --- | --- | --- | --- |
| 균형형 |50|50|50|50|50|50|
| 거포형 |40|70|45|40|40|65|
| 거포수비형 |40|65|35|70|35|55|
| 교타형 |70|30|60|45|50|45|
| 출루형 |55|30|75|45|45|50|
| 출루수비형 |45|30|65|70|40|50|
| 수비주루형 |35|30|40|75|75|45|
| 5툴형 |55|55|40|55|55|40|

| 투수 유형 | 구속 | 구위 | 제구 | 위기관리 | 체력 | 견제 |
| --- | --- | --- | --- | --- | --- | --- |
| 균형형 |50|50|50|50|50|50|
| 강속구형 |70|65|35|40|50|40|
| 제구형 |40|45|75|55|45|40|
| 구위제구형 |40|65|65|45|45|40|
| 이닝소화형 |40|40|55|45|75|45|
| 위기관리형 |40|45|55|75|45|40|

포수/내야/외야별별도능력추가는없고포지션적합도는6개재능외의배치상태다. 체력/수비임시유효보정은종합평균에서제외한다.


경기최신수식: [41 여섯능력엔진](41-SIX-STAT-ENGINE.md). 위기관리대칭보정·체력/교체·역할평가를구체화하며구전술logit가산을폐기한다.

능력상한·성적설명 후속: [112](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md)에능력100/잠재력100/실제AVG·SLG를구분하고고정대조군4개와균형실험6개를작성했다. 기존산식을바꾸거나시즌성적을보장하지않는다.

---

<!-- SOURCE: 36-CLUB-SECRET-CHEAT.md -->

최신 v0.14: [85 난이도·구단 치트](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)가 상충하는 이전 규칙을 대체합니다. 구단 치트는 내 구단 전체의 잠재력100·양의 자연성장/구종XP3배를 적용하며 이후 영입·보관 투입 포함입니다. 일반 구단과 원본 기록에는 소급하지 않습니다.

# 사용자 결정06 — 구단 운영 숨김 치트

사용자 확인:자금 제한 없이 운영,스카우트탐색100%성공과선수영입제안100%수락둘다. 커리어치트와별도구단프리셋이며구단독립시작/가져오기선택기능유지. 실제게임구현미착수.

## 해금·선택·효과

구단 새게임 난이도에서도 일반3번→하드4번으로숨김치트카드노출. 기본화면에잠금치트/힌트없음,해금만으로선택하지않고확인. 입력·접근성·현재폼범위·기존세이브복원규칙은33공유. 초기돈10배가아니라예산제약이없는모드다.

clubDifficultyPreset=SECRET_CLUB_CHEAT,budgetPolicy=UNLIMITED,scoutSearchSuccess=1,recruitAcceptanceOverride=1. 계정권한을늘리는값아니며자기세이브만. 구단치트가켜졌다고모든선수잠재력100/자연성장3배/개인강화100%를자동적용하지않음. 커리어치트와그효과는분리하고사용자추가선택전혼합하지않는다.

## 무제한 예산

화면가용예산'무제한'표시,돈을숫자Infinity/NaN으로저장하지않는다. 모든계약금/연봉/보상금은유한정수로원장에남기고예산부족검사만해당사용자구단에면제. 다른AI구단은정상예산. 방출보장금/복무정지/다년계약/통화/실제지급이력은그대로관리해마이너스계약·중복지급버그를가리지않는다.

무제한이어도선수정원/포지션/나이/부상/기존계약/영토보유권은무시하지않는다. 비정상금액을전송해API범위를넘길수없음. 실제결제/호스트청구에어떤효과도없다.

## 스카우트 탐색

기존스카우팅후속범위중최소기능을v1로추가:시장화면에서포지션/연령대/현재능력대조건으로선수풀탐색제안. 일반모드는탐색결과규칙/성공확률을별도정하고,치트는존재하는적격선수를반드시발견. 새스타를만들거나계약중선수의보유권을삭제하지않는다.

조건맞는선수0이면'해당조건선수없음'으로탐색버튼을비활성하고조건수정안내. 불가능한조건에서100%성공을써놓고빈목록반환금지. 유효조건에서는즉시완료/결과수보장으로기본설계,현실시간대기/광고/반복결제없음. 결과출처·계약가능상태·능력평균/유형을표시.

## 영입 제안 수락

계약 가능한 FA/자유선수에게유효한제안이면선수수락100%. 오프시즌제안라운드마감에정상확정되며사용자가확인하기전임의계약하지않음. 유효성은정상계약기간/최저연봉/공석/이미다른팀과확정계약안됨등. 예산제약만면제,정원초과면정리화면/예약상태.

동시팀제안이있는경우치트구단의유효제안이해당라운드최우선. 이미라운드확정전이직한선수는새영입대상이아니므로100%표시없음. 같은선수에게중복계약불가. 타구단계약중선수강탈·포스팅불허강제무시·드래프트순번무시·무조건트레이드성공은이번효과밖.

본인구단여러제안은모두보장되므로정원슬롯을예약하고공석보다많이확정하지않음. 유효제안commit/예산원장/선수권리/경쟁제안정리는원자적처리. 취소한제안에100%수락을강제로적용하지않는다.

## 화면·확률·저장

구단생성치트선택후3효과표시. 구단홈'가용예산 무제한'. 시장FA카드'유효 제안 수락 보장',탐색카드'적격 선수 탐색 보장'. 실제100%숫자배지는숨기며일반모드의불확실한탐색/영입확률은표시한다(38공통계약). 라인업/이동/설정에는단순적용100%배지없음. 조건0인경우확률대신불가사유.

프리셋은세이브에고정,일반세이브로새로고침했다고치트추가안됨. 공개경쟁기능은현재범위밖,원본/백업/구단종료요약에모드출처보존. import원본이치트출신이라고구단치트자동해금/적용하지않는다.

CC01 기본숨김/해금순서. CC02 무제한예산유한원장. CC03 적격탐색결과보장/조건0거절. CC04 유효FA수락100/기존타팀계약거절. CC05 슬롯예약중복방지. CC06 타팀정상예산. CC07 커리어치트효과자동혼합없음. CC08 저장/복원/모드표시. 실행전계약이다.

---

<!-- SOURCE: 37-BRAND-TEAM-LOGOS.md -->

# 사용자 결정07 — 다시, 플레이볼과 공식 구단 로고

## 앱 이름

사용자가 선택한 이름은 **다시, 플레이볼**. 화면 타이틀·앱 표시명·설계 이름을 통일한다. 저장소 이름 baseball_Career와기존내부ID는이름변경때문에자동변경하지않음. Android packageId/도메인/스토어상품명과상표검토는출시전별도이며가용성확정이라고주장하지않는다. 과거문서의Baseball Career는이전작업명이다.

화면 보조문구 기본안:'한 선수의 인생, 나만의 구단'. 로고타입은현재검은고딕텍스트를사용,별도앱아이콘최종디자인은이번실제구단로고수집과구분한다.

## 공식 구단 로고 확보

사용자선택은공식출처우선. 2026-10-16 KBO공식홈과MLB공식홈/공식팀메타데이터에서출처를확인해로컬설계자산으로보관했다. KBO10 PNG,MLB30 SVG(공식 team-cap-on-light 엠블럼),실패0. 원본로고를재색칠/변형해새로제작한것으로표시하지않음.

- KBO 출처 페이지: https://www.koreabaseball.com/
- MLB 출처 페이지: https://www.mlb.com/
- MLB 팀 메타데이터: https://statsapi.mlb.com/api/v1/teams?sportId=1
- 파일별 원본 URL·팀ID·다운로드일: [sources.json](assets/team-logos/sources.json)

공식공개파일을확보한것과배포용상표/저작물사용허가를받은것은다르다. 허가확인전현재자산은설계검토용이며외부정식배포사용범위는출시검토항목으로남긴다. 임의권리문구/자체제작라이선스를붙이지않는다.

## 파일과 표시

assets/team-logos/kbo/{kboCode}.png,mlb/{mlbId}.svg. 내부팀ID는출처파일의레거시코드(SK/HT/OB등)와공식표시명(SSG/KIA/두산등)을분리매핑한다. 오래된파일경로연도만보고현재브랜드명을추정하지않고출처페이지의표시이름을사용한다.

팀선택카드는로고72~96px/팀명/선택상태,표/순위는24~32px,구단헤더는56px기본. object-fit:contain,흰/투명카드배경,원본비율유지. 로고를얇은행전체배경으로깔아글자를가리지않음. 클릭영역은이미지와텍스트를포함해최소44px. SVG는img로불러오고inline외부스크립트실행없음.

파일수집때SVG태그와script/foreignObject없는지기본검사. 이미지실제작게줄였을때의선명도·특정어두운로고의대비는브라우저렌더링검수전이다. 로드실패는팀약칭배지,팀명은항상텍스트로유지한다.

실제구단은10+30,가상대학/마이너/군체육팀은별도독자배지체계로설계하며실제메이저로고를그하위팀공식로고인것처럼혼용하지않는다. 사용자구단선택에서지금선수모드에MLB단장모드가추가된것처럼보여주지않음.

## 검증

BR01 팀ID고유/KBO10·MLB30. BR02 40파일존재/0바이트없음. BR03 PNG시그니처/SVG구조. BR04 출처대장각파일대응. BR05 제목명칭통일. BR06 팀선택/순위/구단홈비율/대체텍스트. BR07 권리확인상태보존. 실제배포허가/시각실행검증은미완료다.

---

<!-- SOURCE: 38-PROBABILITY-DISPLAY.md -->

# 38. 확률 표시 공통 계약

최신 사용자 확정: 스카우트 등을 포함해 확률이 있는 모든 선택에 확률을 표시하되, 실제 확률이 100%이면 숫자 배지를 표시하지 않는다. 이전 문서의 치트 강화·탐색·영입에 100%를 표시한다는 UI 규칙보다 우선한다. 효과 자체와 내부 확률은 변경하지 않는다. 설계 계약이며 게임 구현은 아직 없다.

## 적용 범위

| 선택/결과 | 표시 계약 |
|---|---|
| 스카우트 탐색 | 조건에 맞는 선수를 발견할 성공률. 발견과 영입을 혼동하지 않음 |
| 영입·FA·계약 제안 | 현재 제안 조건에서 수락할 확률. 조건 변경 시 재평가 |
| 드래프트 | 예상 라운드와 지명 확률을 함께 표시. 라운드는 확정 약속이 아님 |
| 특별강화·훈련 | 성공률과 성공/실패 시 성장·피로·소모를 함께 표시 |
| 대표팀·군팀·경쟁 선발 | 확률 모형이 있으면 해당 선발의 확률/추정치를 표시 |
| 이벤트·부상 위험·회복·포지션 적응 | 선택으로 발생하는 확률 결과를 각각 표시. 실제 확률 처리가 있는 항목에 적용 |
| 경기 전술 등 향후 추가 선택 | 확률 결과가 있다면 같은 공통 계약에 등록 |

단순 조회·메뉴 이동·집중 능력 변경·확정 진로 선택에는 확률 배지가 없다. 미국 오퍼 목록 확인에는 오퍼 수를 보여준다. 확률을 숨기는 조건을 확률 없는 동작과 혼동하지 않는다. 네트워크 요청 성공률은 게임 선택 확률이 아니다.

## 숫자와 문구

- 실제 적용 확률이 0보다 크고 1보다 작으면 선택 카드와 최종 확인 화면에 표시한다. 예: ‘탐색 성공률 65%’, ‘영입 수락 예상 40%’. 이 숫자는 화면 설명용 예시로 밸런스 확정값이 아니다.
- 실제 적용 확률이 정확히 1이면 숫자 배지를 숨긴다. 필요한 효과 안내는 ‘확정 성장’, ‘적격 선수 탐색 보장’, ‘유효 제안 수락 보장’으로 쓴다. 치트도 동일하다. 잠재력 100은 능력 수치이므로 그대로 표시한다.
- 조건상 불가능하면 버튼을 비활성화하고 ‘해당 조건 선수 없음’, ‘계약 정원 초과’ 등 사유를 표시한다. 유효한 선택의 확률 모형이 실제 0을 반환하면 ‘성공률 0%’와 원인을 표시한다.
- 100% 숨김 판정은 반올림 이전의 실제 값으로 한다. 99.96%를 100%로 반올림하지 않으며 0.04%를 0%로 만들지 않는다. 아주 작은 잔여 확률은 정밀 표기나 ‘99.99% 초과·확정 아님’처럼 오해 없는 문구를 쓴다.
- 추정치는 ‘예상’과 평가 기준 시점을 표시한다. 추정 구간의 상단이 100%여도 전체를 보장으로 취급하지 않는다. 계산 근거가 없으면 ‘평가 대기’로 표시하고 숫자를 만들지 않는다.

## 미리보기와 결과 계약

공통 preview는 outcomeKey, 적용 probability 또는 추정 범위, exact/estimated/pending 상태, evaluatedAt, 조건/세이브 버전, 불가 사유를 제공하도록 설계한다. 모든 확률 결과를 열거하고 화면의 대표 확률이 무엇의 확률인지 명시한다. 조회는 난수를 소비하거나 당첨을 확정하지 않는다.

실행은 같은 조건 버전과 규칙으로 계산한다. 조건이 바뀌었으면 새 확률과 비용을 보여준 뒤 재확인한다. 치트 적용 후 유효 확률이 1이면 일반 모드의 기본 확률을 현재 성공률처럼 노출하지 않는다. 내부 감사 기록과 확률 모형은 숫자 배지를 숨겨도 유지한다.

기존 구단 AI 점수는 자동으로 수락 확률이 되지 않는다. 스카우트·영입 확률 모형은40에정의했다. 구현연결전버튼은설계시연상태며점수를그대로백분율로바꾸지않는다.

## 검수 계약

P01 일반 탐색/영입/강화/드래프트의 실제 확률 노출. P02 기본기 및 치트의 확률 1은 숫자 숨김. P03 99.96/0.04의 오표시 없음. P04 불가 사유와 pending 구분. P05 조건 변경 후 재평가. P06 같은 preview/실행 모형. P07 확정 동작에 확률 배지 없음. P08 복수 결과·추정 구간의 대상 명시. P09 신규 확률 선택도 공통 컴포넌트 사용. 실제 실행 검증 전이다.

---

<!-- SOURCE: 39-DESIGN-RECONCILIATION.md -->

# 39. 최신 요구와 기존 문서 정합 정리

사용자 요청에 따라 남은 상세설계 전체를 진행한다. 사용자 확정은 변경하지 않으며 새 수치는 설계자가 선택한 v1 기본안이다. 사용자 개별 수치 승인이나 실험 완료를 뜻하지 않는다.

## 단일 해석

| 주제 | 현재 계약 | 폐기된 본문 |
|---|---|---|
| 능력 | 타자/투수 각6개,35의키 | 타자7개/투수수비/송구성장 |
| 종합 | 영구6개 산술평균,소수1자리 | 역할가중값을종합으로표시 |
| 집중 | 정확4개,80/20 | 1~2개/50대50 |
| 유형 | 거포수비형등초기분포·성장배분 | 컨택우선등전술보너스자동중복 |
| 가져오기 | 능력별영구최고50%,19세,상향잠재력100상한,병역새출발 | 은퇴능력유지/복무혜택복사 |
| 진로 | KBO/대학/유효미국오퍼조건부 | 대학후속범위/미국선택후오퍼0 |
| 확률 | 불확실결과표시,실제1이면숫자숨김 | 단순적용100%/치트100%배지 |
| 구단 | 가상로스터,보관0명가능,별도숨김치트 | 개인커리어완료필수/스카우트없음 |
| 연장 | 정규12회무승부,PS/국제10회승부치기 | 15회후재경기 |

01의초기배열/종합,02의집중입력,07의검수,08의성장/드래프트/자동주자,22의집중/구전술,25의스카우트/협상,30의가져오기를본문수정했다. 문서제목의옛시점이나폐기설명에등장하는이전값은활성규칙이아니다. 다른환경에서는먼저START-HERE와14,최신39~46을읽는다.

## 이후 상세화 순서

40 탐색/수락확률 →41 여섯능력엔진 →42 성장/난이도/가져오기 →43 대학 →44 구단경제 →45 사건카탈로그 →46 전체화면/검수. 분야별이전수식은새문서의명시된교체표를따른다. 하나의세이브는rulesVersion하나를고정하며문서개정때진행중게임결과를소급수정하지않는다.

## 정적·실행 검증 분리

문서링크/수식예시/표합계/콘텐츠ID/HTML구문은설계단계에서검사한다. 경기분포/50시즌경제/실제인증/DB/웹/APK는구현후검증한다. 문서완료로실행검증을대체하지않는다.

---

<!-- SOURCE: 40-SCOUTING-RECRUITMENT-ODDS.md -->

# 40. 스카우트 탐색·영입 수락 확률 상세

v1 설계 기본안. 실제 구단이나 실제 선수의 행동 추정이 아니다. 25/08의 결정론적 FA 최고점 수락을 이 문서로 교체한다. 모든 확률 UI는38을 따른다. 확률0.65 같은값은0~1로저장하고마지막에퍼센트로표시한다.

## 탐색 대상과 비용

시장 후보 풀은 해당 세이브의 FA·미계약 신인·독립선수다. 타구단 계약선수는 정보조회만 가능하며 탐색 성공을 영입 가능으로 안내하지 않는다. 조건은 포지션군/나이구간/현재종합구간,교집합이다. 검색 직전 적격 N명을서버가계산한다. N=0은실행불가·비용0. 선수1명발견은그선수계약이나잠재력상향을보장하지않는다.

스카우트시설 L=1~5,초기2. 1회500만원,시즌세계월별2회(사용자구단/AI동일),요청확정시소모. 실패해도비용/횟수소모,통신실패는receipt조회. 연령구간최소3세/종합구간최소10점을UI에제시하며더좁게검색해도허용하되성공률이낮아진다.

적격수계수 n=min(N,20)/20. 좁은조건개수 q=I(연령폭<5)+I(종합폭<20)+I(포지션한자리). pSearch=clamp(.35+.08L+.20n-.08q,.10,.90). 예L2/N20/q1이면.63, L5/N20/q0이면.90. 치트는N>0일때1,비용과월횟수는정상기록하되예산부족검사면제. 치트는탐색횟수무제한효과가아니다.

성공이면 아직발견하지않은적격선수에서seed로min(3,N)명을중복없이발견한다. 발견선수는시즌내시장목록에유지,이미발견한선수만남으면‘새 후보 없음’으로재탐색불가. p계산N도미발견적격수다. 실패시새탐색시도는새명령/비용으로허용하되재시도버튼은동일명령을조회한다. 시장FA공개목록은계속이용가능해실패로선수단보충이막히지않는다.

## 정보 정확도

현재능력6개와종합은정확표시. 숨은잠재력은범위전망으로만표시하며별도확률‘적중’추첨없음. 전망구간폭은L1/2/3/4/5에서각각20/16/12/8/6점. 선수별고정seed로구간중심을조정하되진짜P를포함하고[A,100]에제한한다. 구간식은w=min(레벨별폭,100-A),u=선수/레벨고정seed균등[0,w],lower=clamp(P-u,A,100-w),upper=lower+w. P가구간에포함되며현재A가높으면폭이줄어든다. 같은레벨재조회구간불변,레벨업보고서는이전보고범위와교집합으로표시가능. 범위의중앙값을확정잠재력으로저장하지않는다. 반복검색/시설업그레이드로P를재생성하지않음. 보고서는스카우트레벨·평가일을보존한다.

## 제안 점수

희망연봉/기간은08의연봉가치식사용,overall을연봉가치에사용한다. 희망총액H,제안총액T. money=min(T/H,1.5)/1.5, role는선수의실제보직기회0~1, preference는선수/구단고정seed 0~1. score=.70money+.20role+.10preference. 역할은보장계약이아니며선수단현재경쟁/공석에서계산. UI에서실제출장보장이라쓰지않는다.

모든유효제안j의weight wj=exp(6×(scorej-.60)). 제안을받지않고대기할outsideWeight는1/2라운드1.0,3라운드.5. pAccept(j)=wj/(outsideWeight+sum(wk)). 대상선수당전체제안과미계약선택의확률합은1. 미계약시다음라운드로이동하고3라운드후잔류FA. 낮은점수도유효하면낮은확률이며구임계.65/.5를동시에적용하지않는다.

예score=.60인단독제안은1라운드50%,동점2구단제안은각33.33…%와미계약33.33…%. 3라운드동일단독제안은66.66…%. 경쟁제안증가는자기확률을낮추고자기제안금액증가는다른조건동일시자기확률을높인다. 돈을많이줘도일반모드수락보장없음.

치트구단의유효제안이있으면그구단확률1/타팀0/outside0. 이v1은사용자구단하나만치트가능,복수치트동률은정의밖이므로import로허용하지않는다. 기존계약/보유권/정원제약으로불가능한선수는확률추첨에넣지않는다.

## 라운드·미리보기·원자성

AI제안전체를라운드시작때seed로고정하고사용자의금액변경에반응해재추첨하지않는다. 사용자는여러선수에게제안할수있지만동일선수자기제안은하나. UI미리보기는현재고정AI제안+자기초안으로계산한정확확률이며‘이번 협상 라운드 기준’시점표시. AI개별예산/숨은P를응답에싣지않는다.

제안마감확정전소속/권리/정원/예약예산버전검사→변경있으면확률재미리보기→사용자확정→선수별단일누적분포추첨→단한계약+실패제안예약해제. 추첨순서는선수ID고정이며추첨후다른선수의확률을몰래다시계산하지않는다. 정원과예산은모든사용자제안이동시성공해도유효하도록사전예약한다. 확인화면의확률은최종검사후스냅샷에고정한다.

Career에서받은확정계약서를‘수락’하는행동은추첨이아니다. 포스팅승인도23의정해진조건판정이면확률을붙이지않는다. 대표/상무의순위기반선발은현재예상순위·기준선을표시하고확률모형이없는상태에서억지백분율을만들지않는다. 향후확률선발로바꿀경우동일preview계약등록이필수다.

## 검증 예시

SC01 N0비용0. SC02 .63/.90예시. SC03 발견중복0. SC04 같은명령재시도횟수1. SC05 진짜P보고범위포함. OF01 단독.5/동점각1/3. OF02 확률합1. OF03 자기금액단조. OF04 치트1/숫자숨김. OF05 슬롯초과거절. OF06 버전변경재확인. OF07 3라운드미계약FA유지. 실행전계약이다.

장기세계후속66~73:재도전/평가범위/자연구단주기/사건충돌/provisional원장/복원simulationKey/불변조건/연도generation/실험계획. 해당분야의이전1회준비·복원물리ID난수해석은각최신문서로대체한다.


잠재력보고서의관측stage/범위교집합/본인평가레벨/이적정보보존은[67](67-POTENTIAL-ASSESSMENT-PROGRESSION.md)이구체화한다. 탐색발견p와평가범위는별개다.

구단첫시즌후속: [114](114-FIRST-CLUB-SEASON-OPERATIONS.md)의16장면/7복구/3시작/연속원장을함께적용한다. 기존생성·소유권·확률·경제·치트범위를바꾸지않고실제운영순서를연결한경험설계다.

오프시즌운영후속: [115](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md)의추천순서/실제기한구분·드래프트같은차례복구·FA예약/마감·병역/만료·미래보장108억원예시를함께읽는다. 기존도메인순서·권리·단일연도전환은유지한다.

---

<!-- SOURCE: 41-SIX-STAT-ENGINE.md -->

# 41. 여섯 능력의 경기 영향과 역할 평가

35의능력키/산술평균을유지한다. 08의타석base와softmax를사용하되아래상황효과와기용가중으로명확화한다. 모든숫자는캘리브레이션전설계기본안이며실제야구통계적사실이아니다.

## 계산 순서

119 확정: 08 logit 이후 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 투구폼×대표구종 친화와 좌우 상성을 구종·성향·특성 합산에 포함한다. 이 값은 영구/일시 능력이나 종합에 반영되지 않는다.

영구A→일시modifier합→[1,100]clamp→피로배율→사기배율→유효능력[1,100]clamp→상황보정→[1,100]clamp→08logit→softmax. 사기미구현초기값1,유형은추가logit을주지않는다. 종합은영구A6개평균으로고정,경기유효값과구분한다.

타석상태의주자/아웃/점수는추첨직전snapshot을사용한다. 득점권RISP=2루또는3루에주자존재. clutchDelta=RISP일때.05×(CLUTCH-50),아니면0. 컨택/파워에각각더한다. 위기관리는주자존재일때t=.001×(COMPOSURE-50)를K/OUTlogit에더하고BB/HR에서뺀다. 범위±.05로대칭이며08의‘50이상만보정’비대칭문장은교체한다. 타자클러치와투수위기는각각한번만적용.

## 각 능력의 연결

| 능력 | 직접 연결 | 영향을 주지 않는 것 |
|---|---|---|
| 컨택 | K/1B/2B/HR/OUT의08계수 | 영입수락확률 |
| 파워 | 2B/3B/HR | 볼넷추가보너스 |
| 선구안 | BB/K | 수비능력 |
| 수비 | 출장야수8명의포지션보정평균D,1B억제/OUT증가 | 별도실책/송구성장축 |
| 주루 | 3B가중·추가홈진루성공률 | 도루성적가짜생성 |
| 클러치 | 득점권에서C/P±2.5 | 무주자일괄보너스 |
| 구속 | K | 표시km/h를다시성적계수로가산 |
| 구위 | K/1B/2B/3B/HR/OUT | 계약연차 |
| 제구 | BB/HBP/K/2B/HR | 부상면역 |
| 위기관리 | 주자있을때K/OUT/BB/HR | 영구능력증가 |
| 체력 | 등판피로·투수교체기준 | 타석logit추가가산 |
| 견제 | 추가홈진루억제 | v1별도견제아웃생성 |

구속표시km/h=125+40×(VELOCITY-1)/99,소수1자리. 이는외형환산이며실제선수속도예측이아니다. C/SS/CF등적합도는35의별도상태0~100,수비기여=DEFENSE×(.5+.5fit/100). 투수는야수8명평균D에포함하지않는다. DH수비는제외한다.

## 추가진루

안타후2아웃이고주루≥60인주자만추가홈시도. 1B의2루주자,2B의1루주자에적용하며그외기본진루는24. p=clamp(.70+.002×(RUNNING-50)-.0015×(현재투수PICKOFF-50),.40,.90). 주루70/견제50→.74,주루70/견제100→.665. 주루50은시도조건미달,식을계산해도자동시도안함. 두조건은별도단계다.

이선택은v1엔진자동판단으로로그에시도·성공률을남긴다. 향후사용자전술버튼을만들면실행전확률을카드에표시한다. 주루아웃도투수아웃수에포함,3아웃뒤추가득점금지. 확률결과에서반환되는진루와주자정보를UI가다시추첨하지않는다.

## 체력과 교체

SP등판피로증가=40×(1-.003×(STAMINA-50)),범위34~45.88. RP/CP는15×동일배율. 휴식-10/일은동일하며[0,100]clamp. 야수출전+5/휴식-8,숨은체력능력없음.

SP교체검토투구수=round(90+.30×(STAMINA-50)),75~105,하드상한110. RP/CP검토=round(30+.10×(STAMINA-50)),25~35,2이닝검토공유. 피로80검토와불펜가용성은24유지,타석중강제종료없음. 높은체력은효과를주되피로감소와교체에2중임의가산하지않는다.

## roleScore 가중표

종류별 열 순서는35와같다. 각 행합100. roleScore=sum(A×weight)/100,피로는기용최종경쟁때별도검사한다.

| 역할 | 컨택 | 파워 | 선구안 | 수비 | 주루 | 클러치 |
|---|---|---|---|---|---|---|
| C/2B/SS/CF |20|15|15|30|10|10|
| 1B/3B/LF/RF |25|25|20|15|5|10|
| DH |30|30|25|0|5|10|

| 역할 | 구속 | 구위 | 제구 | 위기관리 | 체력 | 견제 |
|---|---|---|---|---|---|---|
| SP |15|25|25|10|20|5|
| RP/CP |15|30|25|20|5|5|

기용 경쟁=.8roleScore+.2최근성적,적합도/등록가능조건우선. 드래프트 점수는 해당 평가 원문/구현 계약을 따른다. 미국 자격은13/34의 스카우트 평가65 이상이며 종합 문턱은 없다. 미국 평가의 실력 성분에는roleScore를 사용하고 화면 종합과 구분한다. 구단평가개선량은해당자리roleScore차,연봉가치는overall.

## 설계 검증과 구현후 분포 게이트

ENG01 모두50/피로0/사기1/무주자/좌우·폼 중립에서base합1(119 보정은 별도 PF-D). ENG02 각확률[0,1]/합1. ENG03 전체100능력도안타확정아님. ENG04 체력50은40/15/90/30. ENG05 주루70예시. ENG06 위기관리50중립. ENG07 roleScore모두50→50. ENG08 종합은상황효과불변.

구현후같은seed집합100개×각유형×타자/투수,추가10만타석고정대조군을비교. 리그타율.220~.300/평균ERA3~6/HR/PA.015~.055는이상징후검토범위이며현실재현인증아님. 능력을올렸는데의도한지표가기대방향과반대면수식/표본/교란을검토한다. 설계단계에성적분포통과를주장하지않는다.

확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.

능력상한·성적설명 후속: [112](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md)에능력100/잠재력100/실제AVG·SLG를구분하고고정대조군4개와균형실험6개를작성했다. 기존산식을바꾸거나시즌성적을보장하지않는다.

## M1 병살 보정 확정 (2026-10-20 U)

사용자 선택으로01의 미정 수비·주루 계수를 확정했다. 인플레이 OUT이고1루 주자가 있으며 타석 전0/1아웃일 때 p=clamp(.20+.002*(D-50)-.002*(현재 타자 RUNNING-50),.05,.35). 수비10점당+2%p/타자주루10점당-2%p. D는 위의8명 수비 평균이다. 병살 성공은2아웃·1루주자 제거·타자 아웃·진루/득점0이며,2아웃에서는 추첨하지 않고1아웃만 추가한다. 이 기본20%는 OUT 발생 후 조건부 확률이며 전체 PA 병살확률20%라는 의미가 아니다.

---

<!-- SOURCE: 42-GROWTH-DIFFICULTY-REBIRTH.md -->

최종 수치 정합: [90](90-NUMERIC-LEDGER-CONSISTENCY.md)의기본XP20/예약/배율후소비/실제숙련증가분리와정수잔여규칙을함께적용합니다. 실제cap잔여만으로지급하지않으며팀이동으로기본예산을초기화하지않습니다. 반값가져오기의1e-4단위반올림도90을따릅니다.

최신 v0.14: [85 난이도·구단 치트](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)가 상충하는 이전 규칙을 대체합니다. 구단 치트는 내 구단 전체의 잠재력100·양의 자연성장/구종XP3배를 적용하며 이후 영입·보관 투입 포함입니다. 일반 구단과 원본 기록에는 소급하지 않습니다.

# 42. 성장·난이도·강화·보관 선수 재육성 기본안

사용자가수치까지확정한치트효과외의아래숫자는설계자가이번에채운v1기본안이다. 서로다른현재규칙을동시에적용하지않는다. 난이도/성장/가져오기정책버전을세이브에저장한다.

## 일반 난이도

| 표시 | 내부ID | 양의자연성장 | 잠재력 | 부상/노쇠/드래프트 |
|---|---|---|---|---|
| 일반 · 성장형 | GROWTH | 기준의1.5배 | 아래동일분포 | 공통규칙 |
| 하드 · 현실형 | REALISTIC | 기준의1배 | 아래동일분포 | 공통규칙 |
| 숨김 치트 | SECRET_CHEAT | 기준의3배 | 주인공6개100 | 공통규칙,강화성공보장 |

초기능력은35의합300,일반/하드동일. 생성기준P[k]=clamp(round(75+10Z),max(A[k],60),95),Z는고정seed절단정규-2~2. 두난이도에서같은생성seed면동일A/P,성장속도만다름. 임의로미국조건완화/숨은선발가산/부상감면안함. 치트는1.5×3이아닌기준×3. 난이도는생성후고정,진행방식월별/빠른시즌은변경가능.

잠재력전망은40의보고범위,본인기본시설레벨2상당. ‘성장형’이잠재력100이나메달획득을보장한다는설명금지. 치트해금일반3→하드4는33/36유지,선택수동.

## 연간 예산과 기간 정규화

나이18~22:10 /23~27:6 /28~31:3 /32이상:1점은6개총합의양의기준예산. 각세계시즌기간i의D=해당기간등록레벨의달력상성장가능정규일수,세계성장가능일수W. 겹치는등록기간없음,총D≤W. G=sum(baseAge×D/W×appearance×training)×difficultyMultiplier. 나이/잠재력snapshot은세계시즌시작값.

appearance=.7+.4×min(1,개인출장분모/그기간표준분모). 타자연간PA500/투수SP아웃450/RP아웃150,고교·대학은연간PA100/아웃90. 기간표준분모는각레벨연간분모×D/해당레벨전체정규일수로정규화,0일기간예산0. 훈련은정상1,재활비율r이면max(.8,1-.2r),이벤트상한1.2. 현역일반복무기간은별도규칙으로G0,상무는자기등록리그분모. 대표팀출장은자연성장분모에중복가산안함.

부상은기본출장계수를0으로만들지않으나자연성장전액보장도아님. 이동시각레벨연간예산을새로만들지않음. 대학2→프로도같은세계시즌원장. 빠른진행도같은기간분할로계산한다.

## 집중 4개와 상한 재분배

1. 집중4개각G×.20. 미선택2개는합G×.20를35유형weight의두값비율로배분. 양쪽weight0이면균등.
2. 각능력에min(배정,P-A)적용,초과예산은여유있는6개에현재기본배분weight비례재분배. 모든남은weight0이면균등. 매반복최소한능력하나상한도달또는예산소진.
3. 원장정밀도1e-4,합계맞춤마지막잔여는고정능력키순서배분. 이미A에반영한분수를growthFractions로다시더하지않음. carry는1e-4미만미반영잔여만뜻한다.
4. 전상한이면잔여소멸사유기록. 강화와노쇠는자연성장예산과별도원장.

예G10/집중4개면각2. 미선택이주루/클러치이고거포weight5/10이면각.6667/1.3333. 1능력이상한이면초과분만재분배한다. 성장후41의상황효과를영구최고값에기록하지않는다.

## 시즌 강화

세계시즌1회,팀정규진행1/3시점(144경기48,대학48경기16,고교는그일정의1/3올림)에해금. 이후오프시즌마감전사용가능. 기존고교절반시점은이일관규칙으로교체. 부상중능력강화는복귀후사용,연기로그와잔여기회표시. 건너뛰기는최종포기확인,자동진행이대신포기안함.

| 선택 | 성공/실패 | 피로 변화 | 표시 |
|---|---|---|---|
| 확정 성장 | 선택1능력+1 | +5 | 확정 성장 |
| 도전 강화 | .60으로선택1능력+2/실패0 | 양쪽+10 | 성공률60% |
| 컨디셔닝 | 능력0 | -20 | 피로회복 |

치트도전은성공보장,증가량+2/피로+10동일,성공률숫자숨김. P-A<1이면능력대상불가,여유1~2면실제증가량표시. 전체상한이면컨디셔닝/포기제공,없는+1을보여주지않음. 피로0컨디셔닝은‘회복량0’경고후선택가능. 확정성장도동일시즌기회를쓴다.

## 노쇠

32~34총2 /35~37총5 /38~40총9 /41~44총12점. 45이상은총15점과기존은퇴조건검사. 타자는주루에60%,나머지5개균등40%;투수는구속/체력각30%,나머지4개각10%. 하한1에서초과감소는남은능력에배분,전부1이면잔여소멸. 자연성장→강화기록(실행시점에이미반영)→해당기간노쇠정산,강화를시즌말다시더하지않음. 노쇠는난이도/치트로3배하지않는다.

## 보관 선수 가져오기

시작19세고정,별도나이선택없음. Anew[k]=max(1,.5×careerPeak[k]),Pnew[k]=min(100,max(peak[k],sourceP[k])+b[k]),b는고정importDraftId/원본ID/능력키seed정수5~10. boost범위·19세는이번설계기본안이다. 원잠재력100이면상한100,하한예외외에는정확히절반. 같은미리보기재조회로재추첨안함.

초기성장유형은원본시즌유형을기본선택하되생성미리보기에서자유변경가능,복사본집중4개도다시선택. 원본능력/기록/메달변경없음. 병역미해결·성장잔여0·기록0·부상없음. 구단난이도는복사본의치트성장효과를자동계승하지않음. 구단가상선수/복사본자연성장은기준1배,구단치트는자금/탐색/영입만적용.

## 검증 계약

GR01 일반/하드동일초기A/P. GR02 10→15/10/30난이도예산. GR03 기간합보존. GR04 G10예시총합10. GR05 강화usage공유. GR06 고교/대학해금같은비율. GR07 원본최고91→45.5. GR08 P95+5→100. GR09 원본치트→일반구단자연성장1배. GR10 노쇠배분합/하한. 실제성장체감은구현후100seed커리어검증대상이다.

확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.


65사용자추가확정:개인치트는구종양의XP도3배/연간구종cap60. 기존6능력자연성장3배와각별도원장,강화증가량·횟수는기존대로. [57](57-REPERTOIRE-DETAILED-CONTRACT.md).


2026-10-19 사용자추가확정:강화정확증가량·비용우선(75). 스카우팅범위는유지하되실제효과로상한추론가능함을허용,개별행동snapshot과원본P필드공개는분리한다.

사용자확정U(2026-10-20): 고교 졸업 진로를 조회하기 전에 완료된 고교 등록기간의 성장만 부분 정산한다. 같은 세계시즌의 프로/다른 등록기간 성장과 중복하지 않으며 원래 세계시즌 기간 예산은 늘리지 않는다. 미리 받은 성장분을 최종 결산에서 재가산하지 않고 기간별 지급/소멸 증거를 남긴다. 미국 자격은 후속2026-10-21 U에 따라13/34의 스카우트 평가65로 대체했으며 종합 문턱은 없다. 성장 배율/예산은 유지한다.

---

<!-- SOURCE: 43-COLLEGE-CAREER.md -->

# 43. 대학 진학·대학리그·졸업 이후 상세

대학진학은v1필수경로다. 가상학교/독자학년·일정·지명규칙이며실제대학입시나현행리그제도를재현하지않는다. 34의연48경기·2학년조기지명·4학년졸업을구체화한다. 개인학업정보/시험/학비결제없음.

## 학교 목록과 입학

| 학교ID | 표시명 | 야구부특징 | 입학최소종합 | 초기주전기준roleScore |
|---|---|---|---|---|
| U01 | 한빛대 | 타격경쟁 |55|60|
| U02 | 청해대 | 투수경쟁 |55|60|
| U03 | 백림대 | 수비육성 |52|57|
| U04 | 동운대 | 균형경쟁 |52|57|
| U05 | 서강산대 | 공격진루 |48|53|
| U06 | 남해솔대 | 긴이닝운용 |48|53|
| U07 | 해오름대 | 신인기회 |1|48|
| U08 | 온누리대 | 재도약 |1|48|
| U09 | 새길대 | 폭넓은선수단 |1|48|

명칭은가상작업명이며실재학교공식연계없음. 학교특징은로스터/AI기용구성차이,숨은+능력/성장배수없음. 높은학교가기본선택이되지않도록예상경쟁순위/포지션수/예상역할을미리표시한다. ‘주전기준’은시즌전평가선이며출장보장아님. 입학조건은확정조건이라입학확률없음. 하위3학교는모든건강한진학가능선수를받아진학제안0으로막히지않는다.

학교선택→로스터에자기포지션슬롯포함확인→제안확인→COLLEGE_PRE입학. 미국오퍼열람만으로이경로가닫히지않음. 대학입학확정후같은졸업시점의고교드래프트와미국제안은종료한다. 같은시점에서중복신분등록금지.

## 일정과 기록

9팀,상대8팀과각6경기(홈3/원정3)=팀48/리그216경기. 9라운드순환×6회,라운드마다1팀휴식·4경기,팀당매주기8경기. 시즌2~6월세계정규기간에배치,주당최대6경기,6연속경기후휴식. 일정generator는기간중충돌이없도록54개라운드일과휴식을예약한다.

상위4팀은7월대학선수권:1vs4/2vs3단판→결승3전2선승. 토너먼트는정규48경기에포함안함,개인/팀기록대회별분리,자연성장예산추가없음. 정규12회동점/선수권10회승부치기는공통엔진. 규정타석ceil(48×3.1)=149/규정이닝48,실제경기수변화시공통식재계산. 기록0도학년마감진행가능.

COLLEGE_PRE→COLLEGE_REGULAR→COLLEGE_CUP(진출시)→COLLEGE_RESULT→CAREER_ROUTE. 중간월별진행/강화16경기해금/집중4개/대표휴식은공통. 대학성적평가는performanceCollege=clamp(rawPerformance-18,0,100),미달표본raw50. 대학최고능력은careerPeak에포함하되프로통산에는대학기록을합치지않는다.

## 학년별 선택

| 학년마감 | 선택 | 실패/거절 이후 |
|---|---|---|
| 1학년 | 2학년진급·병역진로 | 필수복무조건이면복무단계 |
| 2학년 | 조기KBO드래프트·재학·유효미국오퍼있으면직행 | 미지명/계약전거절은3학년복귀가능 |
| 3학년 | 4학년진급·병역진로 | 중도드래프트추가회차없음 |
| 4학년 | 졸업KBO드래프트·유효미국직행·선수생활종료 | 미지명은남은재도전권검사 |

earlyDraftAttempted는2학년한번,졸업드래프트는별도정규기회. 2학년조기미지명은66의독립준비예산을소모하지않는다. 대학졸업후미지명은66의평생준비예산최대3중잔여를사용가능,고교때1회사용했다면잔여2. 프로계약체결후대학복귀는v1없음. 지명만받고계약안한경우복학가능조건을화면에서명시한다.

드래프트B=.7overall+.3performanceCollege,34의확률/예상라운드공유. 모든일반선택의확률1은숫자숨김. 미국 전체조건은13/34의 스카우트 평가65 이상/유효오퍼1개 이상/권리·학적 자격이며 학교 선택으로 면제하지 않는다. 종합 문턱은 없다. 2학년직행학적LEFT_FOR_PRO/4학년학년마감후직행은GRADUATED.

## 병역·대표팀·실패 복구

대학재학이면21의유예가능검사를하되자동면제없음. 휴학은completedYears유지/진행중학년미완료,제대후같은학년재시작. 완료한학기기록은그시즌기록에보존,재시작으로기록삭제없음. academicYear와worldSeasonId를구분해나이는휴학중진행한다. 졸업나이는입학19+실제세계경과연수이므로복무후무조건22로되돌리지않음.

AG후보대학생허용,WBC/P12/올림픽은20의선발대상/게임기록조건검사. AG선발·메달·개인자격·실제복무는별도. 대학팀과대표팀동시날짜출장금지. 장기부상도학년은진행하며은퇴강요없음. 학교전학은v1제외,졸업후학적탭읽기전용.

API명령ENROLL_COLLEGE/ADVANCE_ACADEMIC_YEAR/ENTER_EARLY_DRAFT/GRADUATE_COLLEGE,offerSetVersion/collegeYear/상태버전검사. 대학엔티티/일정/통계는대학leagueId분리. 등록취소/복무복귀의학년변화는학적원장에남긴다.

## 검증 계약

COL02 입학조건미달대학은사유,하위3개가능. COL03 팀48/리그216/홈원정3대3. COL04 조기미지명후3학년. COL05 조기프로계약후복학불가. COL06 졸업후재도전한도. COL07 휴학학년동결/나이진행. COL08 미국오퍼0노출없음. COL09 대학통산분리. COL10 선수권예산중복없음. COL11 4학년마감졸업학적. 실행검증전이다.

---

<!-- SOURCE: 44-CLUB-ECONOMY-AI.md -->

최신 확정(2026-10-19): [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) 구단 가상·AI 선수의 던지는 손은 우투85/좌투15, 타석은 던지는 손별 분포(우투 선수는 우타80/좌타12/양타8, 좌투 선수는 좌타70/우타25/양타5)를 따른다.

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 구단 가상 선수·AI 선수는 생성 시 던지는 손·타석·투구폼(오버 45/쓰리쿼터 35/사이드 15/언더 5, 초안D)을 서버 난수로 배정해 저장한다.

# 44. 구단 초기화·경제·AI·막힘 방지 상세

기본구단운영은모든팀동일예산,숨김치트는사용자구단한팀만. 실제구단재정자료를사용하지않는독자경제다. 기존05/25중상충하는간단원장은아래원장으로대체한다.

## 시작 선수단

KBO10팀,팀50명(투수24/야수26),1군28(투수13/야수15),전체최소35/최대60. 1군투수10~15/포수2/8수비자리/DH포함타순9명을충족한다. 야수26기본분배C4/1B3/2B3/3B3/SS3/LF3/CF3/RF3/DH1. 투수24는SP8/RP12/CP4. CP도구원불펜슬롯공유.

연령분포19~22 20%/23~27 35%/28~32 30%/33~38 15%,최대잔여법으로정수50배분. 초기종합35~85/중심55,포지션roleScore를치우치게배열하되6개평균유지. 각팀상위5종합합계의전체평균대비±10%와필수포지션검사. 생성검사실패시seed를다시뽑지않고저장된후보stream의다음후보로결정론수정,최대100회후명시적생성실패. 사용자재뽑기버튼없음.

초기계약1~4년은선수별고정seed,연봉은08value를공통비율로조정해팀당총보장당해액80~95억원범위,개인최저3천만원/최대30억원. 범위와개인최저가동시불가능하면생성검사실패. 치트도같은초기분포라처음부터일방적올스타배치안함. import0~28은대체규칙25/42,원본없는새계정도생성가능.

## 예산과 비용

연간기본120억원,잔액다음연도이월없음. 시즌별salary paid/reserved,방출보장,제안예약,최소보호액은25유지. paidOperations와reservedOperations를추가해스카우트/시설비용도단일예산에서차감한다. available=budget+postingIncome+supportGrant-paidSalary-reservedSalary-guaranteedReleaseCost-reservedOffers-protectedMinimum-paidOperations-reservedOperations. 같은계약의잔여예약과방출보장액은동시에세지않는다.

초기총연봉과입단계약금은별개항목. v1신인/보관복사본계약금0/연봉최저,연봉만예약. 스카우트1회500만원,시설2레벨시작. 시설3/4/5업그레이드각2/4/8억원,오프시즌단계별1회씩즉시유효,저장영속,매년유지비없음. 시설레벨이능력자체/새P를바꾸지않는다. 이전‘시설비용v1없음’은이스카우트최소범위만예외. 구장/관중/티켓/후원경제는이번v1에추가하지않음.

미래연도보장액은연기본예산90%이하,최소선수보호액은35명미달분×최저연봉. 치트는예산검사만면제하고모든금액유한정수원장유지,비용0이라고속이지않는다. 가용예산화면‘무제한’,실제지출내역숫자유지.

## 시장과 AI 행동

매오프시즌3협상라운드,시즌중FA는새협상부터3경기일라운드(매세계일1회마감)로처리. 같은날직접선착순계약안함. 40의고정AI제안/수락분포공유. 제안가능연봉최저~30억원/1~4년,당해·미래예약과정원미리검사,타구단계약자는제안불가. 슬롯부족에는성공률대신정리안내.

AI매20팀경기로스터평가/매라운드제안. NeedScore필수공백100/백업부족50/개선10. priority=.6×max(0,목표roleScore-현역roleScore)+.2×발전전망중앙+.2×NeedScore-10×(연봉/기본예산). 공백현역점수0. 후보상위순평가,예산내최대3명동시제안. 제안역할을허위주전보장으로만들지않고실제경쟁군에서계산한다.

희망연봉대비제안비율.9~1.2는선수/구단/라운드seed고정. 같은라운드에사용자초안확인후AI금액을바꾸지않음. 제안기간은선수희망기간(최대4),보장예산미달이면기간을줄여재평가,최저1년불가시제안없음. 연봉높은AI무한지출없음. AI시설업그레이드는다음시즌정원/최소연봉예약후가용예산10억원이상일때한단계,최대5.

## 재정난·선수 부족

1. 정상진행전부상/등록/라인업검사. 부족하면가용2군콜업추천.
2. 투수/포수등필수슬롯이없으면건강한FA조회·공석확보·예산미리보기. 사용자가선택하기전임의방출없음.
3. FA풀해당역할0이면15의낮은종합독립대체선수추가(35~45),추가인원/원인로그. 스타생성안함.
4. 계약여력부족이면재정재건지원필요최소액을계산해명시적지원후최저연봉대체계약. 사용자확인,AI동일규칙. 기존보장채무삭제없음.
5. 긴급보충은일반경쟁영입과별도리그안전제도:대체풀선수최저계약수락확정,숫자확률없음. 로스터35미달/필수슬롯불능복구에만사용,전력보강용반복생성불가.

한시즌초과지원도막아서세이브를멈추지않고이상진단에누적. 지원팀연도비율>5%면밸런스실패검토대상. 정상진행버튼이왜막혔는지해결행동과함께표시한다.

## 드래프트·장기 선수 공급

매년국내신인기본100명,10팀×10라운드역순,실제후보전체정렬/지명은구단모드. 커리어예상라운드34는별도개인평가모형이며구단모드현재차례에서실제선수선택을확률로뒤집지않는다. 구단선택카드는현잔여순위/다음차례까지남을예상여부를표시하고정확확률모형없는잔존율은숫자표시하지않는다.

기본FA80명하한/연령증가/은퇴/계약만료는15. 신규P분포는42의생성식이나선수별현재능력하한을따름. 모든선수난이도성장1배,주인공전용일반1.5/치트3효과를타팀에전파하지않음. 가상선수은퇴는리그기록실에보존,개인보관함자동추가없음.

## 검증 계약

ECO01 생성50/24/26/28/모든수비자리. ECO02 초기총연봉80~95억원. ECO03 지급/예약이동돈보존. ECO04 시설업그레이드중복청구없음. ECO05 동일선수계약1팀. ECO06 긴급대체필수조건. ECO07 50시즌공급·정원·채무·지원률. ECO08 무제한자금도NaN/Infinity없음. ECO09 예산낮을때선수상실없는탈출경로. 수치는실행후검증한다.

장기세계후속66~73:재도전/평가범위/자연구단주기/사건충돌/provisional원장/복원simulationKey/불변조건/연도generation/실험계획. 해당분야의이전1회준비·복원물리ID난수해석은각최신문서로대체한다.


직원 원장 연결 D(61/106): reservedOperations는활성 운영예약과미지급 보장채무를 포함하는 총 구속액이다. 직원 해임으로reservedStaff→guaranteedStaff 분류만 이동해도총 구속액/가용액은 불변이다. 직원 세부 보장액을가용식에서 다시 차감하거나해임 때 비용을 지우지 않는다.

구단첫시즌후속: [114](114-FIRST-CLUB-SEASON-OPERATIONS.md)의16장면/7복구/3시작/연속원장을함께적용한다. 기존생성·소유권·확률·경제·치트범위를바꾸지않고실제운영순서를연결한경험설계다.

---

<!-- SOURCE: 45-EVENT-CATALOG-REVISION.md -->

최신추가:[55](55-EXPANSION-INTEGRATION.md)의E84~99를포함해총99종. 아래83종은v0.8기준이며동일한발생/멱등계약을새사건에도적용한다.

# 45. 이벤트 83종 콘텐츠·발생·명령 계약

기존E01~69를새능력/육성4개/대학/확률표시규칙에맞게갱신하고E70~83을추가했다. [event-catalog-v2.json](event-catalog-v2.json)은ID/제목/본문/선택라벨/명령/결과안내/조건/복귀계약을담은설계용카탈로그다. 게임실행코드나서버핸들러가구현된것은아니다. [전체문안](EVENT-CATALOG.md)에서83종을읽을수있다. 이전09/12/13의선택지·직접능력가산과충돌하면본카탈로그와40~44가우선한다.

## 사건의 역할

사건은조건이충족된사실을알리거나유효명령을선택하게한다. 텍스트를읽었다고능력/피로/돈을별도가산하지않는다. 실제효과는42성장/24경기/40계약/21복무등분야명령에서한번만적용한다. resultCopy는그명령결과가성공한뒤에만사용,실패응답에서성공문구를출력하지않는다. 카탈로그의command는아직구현되지않은설계핸들러이름이다.

모든선택은38미리보기계약공유. 확률추첨선택은강화/탐색/구단제안등분야별p를반환한다. 포지션전환/순위선발/확정오퍼수락은조건판정이므로가짜성공확률없음. E79는제출전수락확률,제출행위자체의성공확률이아니다. E77/78/80은결과통지로다시추첨하지않는다. E83은이미해금하고선택한폼에서만노출,일반사용자에게이스터에그힌트사건발생금지.

## 발생 조건 보강

| 대상 | 기계화할 조건과 상호배제 |
|---|---|
| E01~04 | 마지막고교시즌;E02타자/E03투수배타,12팀경기후1회;E04진로화면진입전 |
| E05~07 | 지명결과/미지명결과/재도전계약존재를분리;E06대학재학자는복학우선 |
| E08~15 | 첫캠프/첫콜업고유;E10콜업뒤20팀경기;E12최근20경기출장비율<.4;E13계획24경기경과;SP체력60/CP위기60와공석동시 |
| E16~20 | BB9>4.5및outs≥60;최근20AB무안타;100AB후HR≤1;최근2선발ER합≥10;E20은최근20경기성적지수≤40인일반조언으로교체,미정morale변수에의존안함 |
| E21~23 | 동일injuryId발생/장기재활/회복단계별1회;회복전출장선택없음 |
| E24 | 첫100H/첫10W/첫20SV각milestoneKey한번,한번의UI에서동시달성합침 |
| E25 | 정규절반에포지션별기여점상위25%(올림),최소규정분모절반;실제올스타경기는v1없음 |
| E26 | 같은자리최상위경쟁자와role경쟁점수차절대값≤5;부상경쟁자제외 |
| E27~29 | 첫PS고유,우승seasonId고유,첫수상awardType고유 |
| E30~36 | 계약자격/실제제안/재도전자격/은퇴가능상태를서버에서검사;버튼없는계약생성금지 |
| E37/E69 | 은퇴sourceReceipt공유,미국출장기록있으면E69/그외E37. 보관snapshot하나만생성 |
| E38~40 | 3연속우승결산/22세이하2군상위경쟁자/예산부족;치트E40예산부족사건없음 |
| E41~43 | 유형변경창/결산별칭변화/세계시즌강화해금각별도. E17/18추천도추가변경기회생성안함 |
| E44~48 | 후보제안/최종탈락/첫실제출장/개인자격/대회종료별competitionId단계 |
| E49~55 | 21복무상태전이별;상무지원receipt하나/미해결기한/활동의무감소세계시즌1회 |
| E56~69 | 고교/대학직행·승강·포스팅·국내복귀는23/43상태전이별;조회만으로권리변경없음 |
| E70~76 | 대학입학검토/입학receipt/선수권진출/2학년/조기미계약복학/4학년/휴학복무완료 |
| E77~83 | 탐색성공/실패receipt,제안초안/라운드receipt,재건필요,import미리보기,해금후선택폼 |

## 우선순위·반복·유효기간

필수부상/기한복무/계약마감은priority100,졸업·입대·승강등상태전이는80,시즌결산/수상60,조언/라이벌20. 같은priority는발생일→eventId순. 강제처리시점이먼사건은해당시점전까지큐에남기며먼저확정할다른의무사건과기한충돌을만들지않는다.

필수선택은월별/빠른시즌모두중단. 기록알림은결산요약으로합칠수있으며게임효과는동일. 조언은같은eventId시즌1회/서사조언전체최소20팀경기간격. 상태전이·부상·계약별사건은sourceEntityId별1회라동일시즌새부상도누락안함. E41은변경창ID,강화는worldSeasonId,마일스톤은milestoneKey가sourceEntity다.

종료된제안/취소된부상계획/현재상태와맞지않는조언은expired로표시후해당resumePhase복귀,미해결선택이새해에남아성장2번주는일없음. decline과defer를구분,‘나중에’가가능한경우에만노출. 사건모달뒤로가기는미해결유지,자동으로첫선택실행안함.

## 콘텐츠·접근성 검수

제목최대24글자/본문최대240글자기본가이드,긴문구는스크롤가능. 실제값은placeholder별로텍스트이스케이프,존재하지않는팀/오퍼이름노출금지. 색이외성공/실패문구,읽기순서제목→사실→비용/확률→선택→확인. 원래두갈래문안을억지로유지하지않고확인한개만필요한사건은한개로단순화.

83종모두정상조건/조건불충족/해결재시도/버전충돌fixture를구현시작성한다. JSON의fixturePositive/Negative는서면계약이고실행테스트가아니다. 특히E06복학/E43시즌공유/E47메달자격/E53학년복귀/E63계약유지/E69보관멱등/E79경쟁확률/E82원본불변을교차검증한다.

---

<!-- SOURCE: 46-ALL-SCREENS-FLOWS.md -->

최신추가:[55](55-EXPANSION-INTEGRATION.md)의S38~45를포함해총45화면. 아래37화면의상태계약도유지하며카탈로그는전체45종이다.

# 46. 전체37화면·세부 흐름·시각 마무리 계약

기존33화면에대학선택S34/대학홈S35/탐색S36/예산S37추가. [화면상태카탈로그](screen-state-catalog.json)는전체입력/데이터/다음화면/예외와빈상태·조회실패·저장중·충돌·로딩문구를정의한다. 보드상태검토는설계내용을보여주는입력시연이며API나게임상태를변경하지않는다.

## 시각 방향

현재서체·일러스트스타일유지. 제목검은고딕/본문Noto Sans KR/숫자tabular,폰트실패시시스템고딕. 남색/녹색/밝은배경,카드12px/버튼10px/본문16px/48pxCTA. 공식로고는37출처목록,선수는가상초상. 구장위필수정보는단색패널. 360/390단일열,768두열,1280최대1200+탐색. 최상위CTA하나,확정창에대상/실제비용/성공·실패결과명시. 모바일가로스크롤은표내부만. 200%확대/키보드/안전영역은실기기검수대상.

## 추가 화면 구조

| ID | 위에서 아래로 | CTA | 실패 후 |
|---|---|---|---|
| S34 | 졸업요약→학교필터→9학교→경쟁미리보기→입학확인 | 이학교로진학 | 조건사유/다른학교/진로복귀 |
| S35 | 학교·학년→월일정→6능력·종합→기록→학년진로 | 월별/빠른시즌/육성 | 복무·사건중단/미지명복학 |
| S36 | 시설·월잔여→포지션/연령/종합→성공률·비용→보고서 | 탐색확인/선수상세/제안 | N0비활성/조건수정/공개FA |
| S37 | 가용→총예산→지급/예약/보호→운영비→미래연도→원장 | 원장/시설/재건 | 예산사유/정원정리/최소대체 |

S17제안폼:희망/제안연봉·기간·역할→수락확률→라운드기준→예약예산→확인. S12의탐색예시는S36으로이동,65/40고정샘플대신40의실제식을입력시연한다. 제출은아직서버에전송하지않는다.

## 전체 주요 경로

1. S01→S02→S03고교→S04→S28. KBO는S05,대학S34→S35,미국유효오퍼있을때S29→S30. 미국미달카드없음.
2. 대학2학년S35→S28→S05미지명→S35복학. 4학년졸업→S28→S05/S29,남은재도전자격검사.
3. S03/S30/S35→S06사건→S22유형/S23강화→원래홈. S07시즌결산→대표/병역/계약기한우선→S08→다음시즌.
4. S24→S25→원소속. S26→S27→복무완료후소속홈,대학생은학년복학.
5. 은퇴S09→S10→S11. 독립구단S01→S12→S13,보관0명가능. 보관선택시최고→반값/19세/병역/유형/집중4개확인.
6. S13→S36발견→S16→S17→제안확률/예산확인→라운드결과S06→S14. 실패예약해제,다음유효라운드로.
7. S13→S37원장/시설/재건→S13. S14→S15라인업검사→S19경기→S18리그/기록.
8. 각홈→S20백업/복원,S21설정. 로그아웃/세이브삭제/계정삭제는구분,28/29의확인·재인증정책.

## 상태·뒤로가기

빈상태와권한/삭제/조회실패구별. 무출장은0경기/분모없는율은‘-’. 로딩skeleton에는가짜선수/확률없음. 저장중확정disabled/조회읽기가능,결과불명receipt조회전새명령금지. 충돌은초안유지후최신버전재미리보기,자동덮어쓰기없음.

초안뒤로취소가능,체결계약/강화추첨은뒤로취소불가. APK뒤로:모달→탭이전→모드홈→종료확인. 새로고침은서버phase/receipt복원,이스터에그해금은현재폼범위. 잘못된route직접접속은권한/phase검사후유효홈안내.

## 검수 범위

학교선택/탐색·영입수식/전체화면상태문구는로컬입력시연. 난수추첨/돈지급/저장/로그인없음. UX13 S01~37연결/100확률숫자없음/대상명시. UX14 긴한글·큰금액·0기록·미선발·모든능력100·투수·보관0명. UX15 360/390/768/1280/200%. UX16 키보드·포커스·label. UX17 로딩/실패/결과불명/충돌. 정적검사와실브라우저시각검수를구분해VALIDATION에기록한다.

---

<!-- SOURCE: 47-TRAITS-SIGNATURES.md -->

최신 확장: [100 히든 특성](100-HIDDEN-TRAITS.md)의 사용자확정 T13~T16을 추가해 총16개다. 기존12개는 공개 특성,신규4개는 해금 전 이름·암시만 공개한다. 보유 전체 자동 적용과 기존cap은 유지한다. T14의 수치 기준은2026-10-19 후속 확정(시즌 라이벌 투수 상대20PA·OPS .900·관계 승리)이다.

# 47. 고유 특성·시그니처 기술

사용자가추천8종모두추가를요청해v1필수범위로편입한다. 이하수치는설계기본안D,실험전이다. 영구능력6개/상한100/산술평균/집중4개/시즌강화1회는유지한다. 특성은능력추가축이아니라조건부경기효과다.

## 획득과 장착

65사용자결정:기록조건달성시해금하고보유효과모두자동적용. 장착2/시그니처1/변경창없음. 조건활성·중첩·원본·API는56상세계약.

| ID | 이름 | 종류 | 해금 기준 | 활성 조건·효과(logit) |
|---|---|---|---|---|
| T01 | 첫 대면의 강타자 | 타자 일반 | 한시즌PA150,장타20 | 투수첫대면타석2B+.02/HR+.02/BB-.02 |
| T02 | 끈질긴 승부 | 타자 일반 | 한시즌BB30 | BB+.03/K-.02 |
| T03 | 빈틈을 달리는 발 | 타자 일반 | 추가홈진루20성공 | 추가진루p+.02(최종.90상한) |
| T04 | 수비의 중심 | 타자 일반 | 수비100경기/수비70 | 본인수비유효값+2(clamp100) |
| T05 | 만루 해결사 | 타자 시그니처 | 커리어만루H10/CLUTCH70 | 만루1B+.04/2B+.03/K-.02 |
| T06 | 가을의 한 방 | 타자 시그니처 | PS HR5 | PS HR+.04/BB-.02 |
| T07 | 탈삼진 본능 | 투수 일반 | 한시즌K100 | K+.03/BB+.01 |
| T08 | 낮게 제압하기 | 투수 일반 | 한시즌outs300/COMMAND65 | OUT+.03/HR-.02 |
| T09 | 흔들림 없는 끝 | 투수 일반 | SV20/COMPOSURE65 | 8회이후점수차3이하K+.02/BB-.02 |
| T10 | 긴 호흡 | 투수 일반 | 한시즌선발20/체력70 | SP교체검토투구수+3(105상한) |
| T11 | 만루 탈출 | 투수 시그니처 | 만루상대30PA/COMPOSURE70 | 만루K+.04/OUT+.03/HR-.02 |
| T12 | 마지막 문지기 | 투수 시그니처 | 커리어SV100 | 9회이후리드K+.04/BB-.03 |

현재타석단위엔진에서T01은해당경기투수와첫대면타석에활성화한다. 투구단위판정이없으므로초구별통계는생성하지않는다.

## 적용·보존

양측조건충족보유특성전체logit합은결과별[-.06,.06]로제한. 구종/성향48과합한신규효과전체는결과별[-.10,.10],마지막softmax정규화. 기본위기·클러치효과는41,피로와수비보정각한번. K/BB가실제얼마변하는지는상대에따라변하므로도감계수를‘성공률+3%’로바꾸지않는다. 타석결과를사용자가선택하는확률버튼없음. 진루전술선택을만들면최종p를38대로노출.

타팀/동료도같은기록조건과자동적용. 치트자동해금없음. 원본보존/어린복사해금초기화는56.

## 데이터·화면·실패

[56 상세계약](56-TRAITS-DETAILED-CONTRACT.md)의필드·조회API·S38·fixture가원본이다. 장착API는채택하지않는다.


미해금 히든 응답은traitId/hidden/name/hint만 허용하고 progress/predicateKey/evidenceRef/효과·문턱을 포함하지 않는다. 일반 특성의 진척 응답과 해금 후의 상세 응답을 구분한다. 클라이언트용 번들·캐시·정적JSON에 서버 규칙 파일을 포함하지 않는다. 해금은 최종 경기/관계·시즌 정산의 같은 영수증 안에서 한 번,다음 실제 타석부터 적용하며 이전 경기 재계산은 없다. T14는 같은 라이벌/시즌/대회 정규 기록의 원분모로 검사,관계 승리 선택지를 누른 사실이 아니라 확정된 이벤트 결과가 근거다.

---

<!-- SOURCE: 48-PITCHES-BATTING-APPROACH.md -->

최신 확정(2026-10-19): [119 선수 표시·투구폼·실루엣](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)이 이 문서의 해당 내용(사람 외형/얼굴 프리셋, 타석 추가 능력 없음, 구종 벡터 외 보정)을 대체·보강한다. 투구폼×구종 친화와 좌우 상성이 소폭 추가된다.

표시·편집 최신 계약: [101 구종 상태 UI](101-REPERTOIRE-STATE-UI.md)의 사용자확정 비례 자동보정/최대잔여/pitchId 동률/하한10 재배분을 적용한다. 슬라이더는 로컬 초안이며 확정 전 실제 구성·기회·난수 변경은 없다.

# 48. 구종 구성·숙련·타격 성향

능력은여전히투수구속/구위/제구/위기관리/체력/견제6개다. 구종숙련은별도메뉴의0~5등급이며종합평균에일곱번째능력처럼합산하지않는다. 아래는투구단위게임이아닌타석단위엔진의구종대표모형이다.

## 구종과 구성

| ID | 구종 | 결과별기본logit벡터(미기재0) |
|---|---|---|
| P01 | 포심 | K+.03/HR+.02 |
| P02 | 투심 | OUT+.03/HR-.02/K-.01 |
| P03 | 슬라이더 | K+.04/BB+.02/1B-.01 |
| P04 | 커브 | K+.02/2B-.02/BB+.02 |
| P05 | 체인지업 | 1B-.03/HR-.01/BB+.02 |
| P06 | 스플리터 | K+.04/BB+.03/HR-.02 |
| P07 | 커터 | OUT+.02/2B-.02/K+.01 |

시작은포심등급2+사용자선택보조1종등급1. 보유최대4종,활성최소2/최대4. 보조로투심선택가능,같은구종중복불가. 활성구종비율은각최소10%/합100%,포심필수는생성때만이고이후투심주력변경가능. 프리시즌/정규절반변경,경기중구성교체불가. 구종비율은실제투구통계가아닌운용계획으로표시한다.

타석마다이비율로대표구종하나를전용pitchPlan스트림에서뽑고base벡터×(mastery/5)를41logit에더한다. 미숙련등급0구종은학습중이며활성불가. 구종다양성추가보너스없음. 상대의타격성향은아래대로적용. 구종추첨은추가실제구수/구종별투구통계를만들지않는다. 문자중계는‘이번타석대표구종’으로명시한다.

## 숙련 성장·새 구종

등급누적XP기준[0,10,30,60,100,150]. 경기에서사용한대표구종마다아웃1개당.02XP,타석당상한.06. 연간전체구종획득XP기본상한20/개인치트60(등록레벨/대표/복무팀모두공유),일반현역복무0. 현재사용중비율과기회에따라성장,실제기록없이버튼반복으로성장안함. 상한초과XP는소멸기록,65사용자결정대로개인치트구종양의XP3배/연간cap60,일반·하드구종1배.

새구종학습은프리시즌1종선택,숙련0/XP0에서기본훈련으로시즌매정규진행1/4마다2.5XP를배정(총10). 이기본10도연간기본20공유예산에포함(치트실제30/60),기존구종실전XP와우선예약해같은시즌20을넘기지않는다. 4체크포인트완료후일반등급1/치트등급2,다음변경창에활성가능. 복무/부상으로훈련불가기간은기간비례감소,실제예산과완료예상시점을미리표시. 한도4에도달하면학습시교체할구종을확인,기존구종은보관숙련으로남지만활성/학습4슬롯만사용. 재장착으로숙련복제없음.

특별강화1회에구종무료추가강화버튼을만들지않음. 새구종선택은학습계획,확률추첨아님. 성장형이필수루트가되지않도록AI/사용자모두동일숙련규칙.

## 타격 성향

| 성향 | 효과(logit) | 대가 |
|---|---|---|
| 균형 | 0 | 없음 |
| 당겨치기 | HR+.03/2B+.01 | 1B-.02/OUT+.01 |
| 밀어치기 | 1B+.03/2B+.01 | HR-.03 |
| 전방향 | 1B+.015/2B+.015 | HR-.015/BB-.01 |

타구방향좌표가없는v1에는방향별실제타구비율/시프트성공률을생성하지않고접근성향으로설명한다. 초기유형과독립선택,프리시즌/정규절반변경,영구능력불변. 구종상성의숨은추가가산은이번v1없음. 구종/성향/특성의총새logit은47의±.10cap,softmax로최종확률합1.

## 저장·가져오기·화면

pitchRepertoire(typeId,xp,mastery,active,usageWeight),pitchTrainingPlan/seasonXpLedger,battingApproach,skillModelVersion. archive에는완전보존. 복사본은구종종류유지/숙련max(1,floor(원본등급/2))/학습중0/새XP는해당등급기준값,원본과독립. 타격성향은기본유지·구단생성전변경가능. 기본능력반값과숙련반값은별도표시. 구단가상투수도동일보유상한.

S39은타자는성향카드,투수는구종카드·등급·XP·비율합계·학습계획. 합99/101이면확정불가,예상학습은확정성장가능기간기준이며무조건완료약속아님. 명령SET_REPERTOIRE/SET_PITCH_TRAINING/SET_BATTING_APPROACH는창/종류/XP원장/revision검사. 구종정보없으면호환필요안내,임의로숨은숙련5생성금지.

PIT01 비율합/2~4슬롯/20XP공유/학습중활성금지/숙련cap/합산logitcap/대표구종스트림분리/복사별도/6능력평균불변검증. 결과분포와연간등급속도는구현후장기검증.

[57 상세계약](57-REPERTOIRE-DETAILED-CONTRACT.md)이성장예약/분기정산/비율경계/API/AI/복사숙련의최종계약이다.

---

<!-- SOURCE: 49-GOALS-ACHIEVEMENTS.md -->

표시·상태 최신 계약: [102](102-GOALS-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 49. 시즌 목표·커리어 도전 과제

목표는성장동기를제공하지만능력/잠재력/돈/강화기회추가보상은없다. 기존수상/특성해금과조건이겹쳐도각자기록만남기며효과를이중지급하지않는다. 일일접속/광고/현실시간한정/보상회수없음.

## 시즌 목표

프리시즌선택최대3개,추천은현재리그/포지션/전시즌분모를기준으로제시. 선택안해도일정진행가능. 첫시즌표본없으면입문목표추천. 반시즌에미완료목표1개교체가능,완료보상을받고교체해추가지급하는방식없음. 본래목표변경내역보존.

| ID | 목표 | 집계 범위 | 보상 |
|---|---|---|---|
| G01 | 첫50타석 | 소속정규개인PA≥50 | 기록카드프레임‘첫걸음’ |
| G02 | 선발50경기 | 타자정규선발경기≥50 | 소개별칭‘라인업의한자리’ |
| G03 | 한시즌20홈런 | 같은리그정규HR≥20 | 홈런기념카드배경 |
| G04 | 한시즌30볼넷 | 정규BB≥30 | 도감스탬프 |
| G05 | 한시즌100탈삼진 | 정규K≥100 | 투수카드배경 |
| G06 | 선발100이닝 | 정규SP아웃≥300 | 이닝기념카드 |
| G07 | 한시즌20세이브 | 정규SV≥20 | 별칭‘마지막아웃’ |
| G08 | 부상에서복귀 | 실제첫복귀출장 | 재도약카드 |
| G09 | 팀포스트시즌진출 | 최종팀순위확정 | 팀성적기념스탬프 |
| G10 | 대학선수권첫출장 | 대학선수권실제PA/투수BF>0 | 캠퍼스기념카드 |

G03/G05등무리한목표는수락가능하되현재예상출장/난도를표시,달성확률모형없으면퍼센트생성안함. 기록은DOMESTIC/US/COLLEGE/INTERNATIONAL/POSTSEASON분리,목표에지정한scope만합산. 팀우승은소속종료전에실제등록이력있을때기념이력,메달/개인출장효과와혼동안함.

## 커리어 도전 과제

A01첫프로계약/A02첫KBO출장/A03첫MLB출장/A04첫국제출장/A05대학졸업/A06포스팅계약/A07복무완료/A08리그통산1000H/A09리그통산100W/A10리그통산200SV/A11고교라이벌재회/A12두리그출장후은퇴. 같은선수내고유해금,계정도감에는달성한여러선수출처를보존한다. 원본기록을복사본의달성기록으로재사용하지않음.

보상ID는안정적고유값,동일보상해금은계정당1회. 이미보유하면‘보유중’표시,대체재화없음. 목표실패/부상/미지명/시즌종료에능력감소나과금재도전없음. 치트세이브도이용가능하고원본모드출처만표시,친구와공개순위경쟁은없음.

## 화면·저장

S40 탭‘이번시즌/커리어/보상’,카드에현재값/목표/집계범위/기한/보상,불가능조건과미집계이유. ‘완료’는기록receipt확정후,클라이언트버튼연타로카운트하지않음. 기념보상장착은외형설정으로확률배지없음.

seasonGoals(saveId,seasonId,slot,definitionId,scope,status,sourceReceipt),achievementUnlocks(ownerId,playerId,achievementId,evidence),cosmeticUnlocks(ownerId,rewardId). UNIQUE출처키로재처리불변,기록정정시달성취소는전체원장재검토절차로그하고다른선수보상삭제안함. 명령SET_GOALS/REPLACE_GOAL/EQUIP_COSMETIC,계정소유/revision/교체횟수검사.

GOAL01 범위분리/최대3/교체1/미선택진행/미달페널티0/보상중복0/복사달성초기화/치트출처/복무목표조건검증. 목표완료뉴스는55의이벤트로연결하고연대기54에서보상을재지급하지않는다.

65사용자답변으로기념보상만/감상형중계확정. 상세처리순서·스키마·API·상태·복구·검수는[상세계약](58-GOALS-DETAILED-CONTRACT.md).

---

<!-- SOURCE: 50-AGENTS-RELATIONSHIPS.md -->

표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 50. 에이전트·구단 관계·조건 재협상

에이전트는프로첫계약후선택가능,선택없이직접협상도가능하다. 가상인물3종,전문분야만차이,실제에이전트이름/현실계약법재현없음. 구단운영의사용자영입수락모형40과커리어본인이받은확정오퍼23을구분한다.

## 에이전트와 수입

| ID | 전문 | 대응 요청과 p가산 |
|---|---|---|
| AG01 | 금전협상 | 국내연봉재협상+.08 |
| AG02 | 역할설계 | 기용검토요청+.08 |
| AG03 | 해외계약 | 미국연봉재협상+.08 |

모두실제지급개인연봉의2%수수료,미지급/복무정지기간수수료0. 구단연봉지출은총액그대로,개인수입원장gross/fee/net별도. 계약금은이번v1수수료대상아님. 연말계약후다음시즌1회교체/해지가능,기간소급수수료변경없음. 임의실제결제없음. 대학/고교는상담미리보기만,수수료계약은프로부터.

## 구단 관계

relationshipTrust0~100,초기50,명시적약속이행+5/약속위반-10/정상등록시즌완료+2,시즌변화합[-10,+10]. 부상/대표차출/법정설정복무/재협상거절은약속위반아님. 사용자가수락한‘다음검토까지현보직준비’등검증가능약속만원장화. 관계가낮아도소유권/정당계약/복무/선발능력조건은유지,자동강등·능력하락없음.

## 요청 확률

재협상은기존유효오퍼하나를기준으로offerSet당1회. 연봉증액x=.10/.20/.30,기간동일. pSalary=clamp(.75-1.5x+.002×(trust-50)+specialistBonus,.10,.90). 예trust50/x.10/보너스0→.60,전문가→.68. 기존오퍼는요청실패에도기한까지유지하므로길이막히지않는다. 성공하면같은offerSet의대체상향오퍼하나,구기본오퍼중복수락불가. 금액상한·구단예산이안되면비활성/사유,치트성장모드가이확률을1로만들지않음.

기용검토요청은20팀경기마다1회,부상/복무중불가. pReview=clamp(.50+.01×(자기roleScore-해당경쟁자roleScore)+.002×(trust-50)+specialistBonus,.10,.90). 성공은추가평가실시,주전/선발보장아님. 최종기용은41을그대로사용. UI는‘기용 검토 요청 수용률’이라고쓰고‘주전 성공률’이라고쓰지않는다. 경쟁자없으면공석기용검사로즉시결정해확률추첨하지않음.

포스팅은23의연차/병역/구단승인조건이우선. 에이전트가조건을면제하거나확률승인으로몰래바꾸지않음. 상담카드에서필요조건·권리·기간·유효오퍼를비교한다. 새에이전트를고용해같은offerSet/세계경기구간의요청횟수초기화불가.

## 흐름·저장·실패

S41은에이전트비교→수수료순수입→관계이력→유효요청→확률·성공/실패결과→확정. 직접협상도같은요청으로bonus0. 오퍼기한이이미지났으면최신S08로,성공판정후화면응답실패는receipt조회. 관계증감은사유와전후값을표시하고보이지않는호감도주사위없음.

agentContracts/playerIncomeLedger/clubRelationships/relationshipEntries/negotiationRequests에owner/save/player/offerSet/구간/version/receipt와pSnapshot저장. 명령HIRE_AGENT/CHANGE_AGENT/REQUEST_SALARY_COUNTER/REQUEST_ROLE_REVIEW. 서버가실제예산·권리·참가자·기한·수수료를검사하며관계숫자를클라이언트가전송해도신뢰하지않음. 원본은퇴수입/관계보존,어린복사본은에이전트없음/관계50/소득0/새요청원장.

AGT01 .60/.68예시/조건변경재preview/실패기본오퍼보존/한번한정/수수료부분지급/복무0/정상행동관계감점없음/기용보장없음/포스팅기준불변검증. 구단치트의FA수락보장36은이개인협상요청에적용하지않는다.

실행처리순서/필드/명령입출력/예외/검수fixture는[상세계약](59-AGENTS-DETAILED-CONTRACT.md)을따른다. 공통[64](64-EXPANSION-COMMON-CONTRACT.md).

---

<!-- SOURCE: 51-RIVALS-TEAMMATES.md -->

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 라이벌·동료의 던지는 손/타석/투구폼도 같은 규칙으로 생성 때 고정하며 외형 대신 이름·손·폼으로 식별한다.

표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 51. 라이벌·동료·재회 서사

기존E26의일시경쟁뉴스를지속되는선수관계로확장한다. 관계상대는실제세이브선수ID이며이벤트마다가짜신규선수를생성하지않는다. 관계로타격/주전/계약을몰래보장하지않음.

## 생성·진행

고교를 시작할 때 같은 종류·나이 차1 이하·종합 차5 이하인 후보 중 고정seed로 라이벌1명을 정한다. 사용자확정U(2026-10-21): 후보가 없으면 NO_CANDIDATE로 두고 라이벌 없이 진행한다. 고교당25명/전체225명을 고정하고 추가 선수 생성·재추첨·사용자 실력에 맞춘 상대 상향을 하지 않는다. 고교동료1명은실제같은팀명단에서선택. 같은ID가두관계역할을동시에받지않음. 유효후보없으면동료없음허용,기본학교경기가관계없음때문에막히지않는다.

라이벌은첫대결→지명후각자의길→프로재회→동료합류또는해외재회→한쪽은퇴의관계단계. 전이조건은실제팀/레벨/대진/이적/은퇴원장. 해외에서만나려면두선수가그리그에실제등록되어야하며이벤트가MLB승격을강제하지않는다. 상대AI경력은세계일정과같은성장/등록/부상/은퇴규칙,사용자를따라자동상향하지않음.

동료는같은팀등록후20팀경기공존→첫동반PS→우승→이적후재회. 호감도주사위/의무선물/현실시간접속없음. 관계에대답하는대사선택은기록카드문구만바꾸며경기효과없음,확률배지없음. 선택안하고뉴스로넘겨도기용불이익없음.

## 맞대결 기록

타자vs투수는실제PA/AB/H/HR/BB/K/타점,분모0율은‘-’. 타자끼리또는투수끼리라이벌이면직접상대타석인척하지않고같은경기각자의기록비교. 리그·정규/PS/국제분리,과거대진없으면0경기. 같은팀동료기간의자체청백전은공식맞대결에넣지않음.

관계기록은경기receipt에서멱등집계,이벤트클릭으로승수추가안함. 국제대회다른나라팀으로임의전환시켜맞대결을만들지않음. 상대가국내에남거나조기은퇴한평범한경력도정상결말이며은퇴이벤트가실패처리되지않는다.

## 반복·보관·화면

재회알림은관계상태변경뒤첫실제대진/공존에한번,매시리즈반복안함. 큰장면은53중요경기후보,54연대기는실제경기/이적근거참조. 보관원본관계는snapshot이력,어린복사본은대상세계의새관계를만들고원본라이벌을자동복제하지않는다.

S42는상대초상·경력현재상태→관계연표→실제맞대결→동반기록→장면열람. 타선다른리그/은퇴면‘현재맞대결예정없음’표시,강제라이벌생성버튼없음. 관계화면은플레이어본인세이브만읽는다.

playerRelationships(saveId,playerA,playerB,type,stage,startedAt,sourceEvent),rivalMatchupSummaries(gameScope,stats),relationMilestones(uniqueEvidenceId). 원본선수가로스터에서사라져도tombstone요약/영구선수기록실로참조유지,상대은퇴로기록삭제안함. 명령ACK_RELATION_EVENT/PIN_RELATION_MOMENT는읽음/핀만수정,실제이적/대진생성안함.

REL01 동일ID중복없음/후보0/상대조기은퇴/타자끼리비교/미국실제재회/관계보너스0/원본관계불변/경기재시도중복0/국제범위분리검증.

실행처리순서/필드/명령입출력/예외/검수fixture는[상세계약](60-RELATIONS-DETAILED-CONTRACT.md)을따른다. 공통[64](64-EXPANSION-COMMON-CONTRACT.md).


T14 연결 D(106): 고교 기본 라이벌same-kind는 유지한다. 프로의 실제 타자-투수 기록을 근거로E94 관계 형성 영수증이 확정된 쌍은cross-kind RIVAL도 허용한다. 고교 관계 삭제·모든 상대 자동 라이벌·강제 선수 생성은 없다. 관계 형성,실제 대결,WIN 관계 이벤트는 별도 근거이며타석 조회/선택 문구로 승리를 추정하지 않는다.

후속 경계 계약 D: [107 라이벌·히든 경계](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)의 프로 형성/직접 결투 WIN·T14 대상 집합/완봉·연속 시즌/정정 규칙을 해당 범위에 적용한다. 사용자 확정 해금 문턱·효과는 유지한다.

## 2026-10-21 새 팀 최초 등록 동료 U

사용자는 대학·프로 새 팀 첫 등록마다 실제 같은 팀 선수 중 같은 종류·나이 차가 작은 순으로 동료1명을 추가하는 안을 선택했다. 고교 관계는 삭제하지 않고 보존한다. 같은 종류·나이 차 동률은 선수 ID순 D이며 기존 TEAMMATE 쌍은 제외한다. 같은 세계의 주인공·리그·팀별 첫 등록을 영수증으로 기록해 같은 팀의 다음 시즌마다 다시 뽑지 않는다. 후보0이면 추가 생성 없이 빈 첫 등록 결과를 저장한다. 라이벌이 같은 팀에 합류한 경우 기존 RIVAL을 지우지 않고 TEAMMATE를 별도로 연결하는60의 규칙을 유지한다. 새 팀 형성은 E94이며 실제 분리 후 재회 E96과 구분한다.

구현 범위 D: M2-AN은 실제 대학 최초 등록에 연결한다. 기존 대학 재학생 저장값에 새 최초 등록을 소급 생성하지 않는다. 프로는 실제 활성 등록 트랜잭션이 생긴 뒤 같은 규칙을 적용하며 계약 예약만으로 관계를 만들지 않는다.

---

<!-- SOURCE: 52-RETIRED-STAFF.md -->

표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 52. 은퇴 선수의 코치·스카우트 전환

은퇴선수보관과어린복사본육성은유지하고지도자전환을별도선택으로추가한다. 원본snapshot은불변,새구단세계의staffInstance를만든다. 은퇴후구단운영을시작하지않아도보관/연대기열람가능하다.

## 자격·유형·효과

소유은퇴원본이면프로출장이없어도지도자생성가능. 이름/초상/경력은원본출처,코치등급은등록프로시즌0~2:1/3~7:2/8이상:3. 미성년원본을현실채용인것처럼설명하지않고독자게임후일담임을명시한다. 지도자버전은원본은퇴나이기록을보존하고현역19세선수처럼표시하지않음.

| 직무 | 슬롯 | 연간급여 | 효과 |
|---|---|---|---|
| 육성코치 | 구단1명 |1.5억원 | 담당타자또는투수의훈련계수에등급1/2/3각+.02/.04/.05 |
| 스카우트 | 구단1명 |1억원 | 등급2/3일때40평가시설L+1(최대5),등급1은보고서정리만 |

코치효과는훈련계수합최대1.2안에포함,자연성장예산과같은기간가중. 능력상한100/잠재력/강화횟수불변,구종XP20상한추가증가없음. 스카우트효과는그대로최종탐색확률/전망구간미리보기에반영,치트p1에보너스중첩안함. 고용했다고원본의고유특성/수상/병역혜택을선수단전체에복사하지않는다.

가상직원풀에도같은등급/급여인력을제공해커리어완료를구단운영필수조건으로만들지않음. 초기슬롯은비어있고시설2레벨탐색은가능. AI도같은선수단/예산조건에서선택,일반AI는가상직원사용. 감독으로전환해별도전술게임을추가하는것은이번8기능범위밖.

## 고용·이동·중복

선택→직무/원본출처/효과/당해급여/슬롯미리보기→확정. 오프시즌1년계약,중도가입은잔여운영일수비례급여. 해임해도남은보장운영급여유지,후임과중복예산검사. 직원은선수35~60정원에포함하지않음. 같은원본은같은세이브에서지도자1명만,다른세이브재사용가능.

같은구단세계에동일원본19세현역복사본과지도자중복투입은불가로기본설계한다. 이미복사본이있으면‘이세계에서선수로활동중’안내,다른원본/가상직원선택. 원본을숨겨도이미고용한지도자경력스냅샷은유지,계정삭제는기존삭제정책따름. 해임이원본보관삭제를뜻하지않는다.

## 화면·데이터·경제

S43은빈슬롯→원본/가상직원목록→등급근거→담당선수→비용/현재효과→고용/해임확인. 구단예산S37의staffPaid/staffReserved를운영비상세하위항목으로표시,paidOperations/reservedOperations에이미포함했으면별도추가차감안함. 무제한구단도유한급여원장을남긴다. 고용은조건충족확정행동이므로100확률배지없음.

staffInstances(sourceArchiveId?,role,grade,worldAge,assignment),staffContracts,staffOperationEntries,staffEffectPeriods. HIRE_RETIRED_STAFF/HIRE_GENERIC_STAFF/ASSIGN_STAFF/DISMISS_STAFF명령에원본소유/정원/예산/중복원본/revision검사,서버에서등급계산. 원본archive행에는coachGrade를덮어쓰지않음.

STAFF01 원본불변/가상직원대체/슬롯2개/동일원본현역중복거절/급여예약보존/효과기간가중/훈련cap1.2/치트돈원장/스카우트Lcap검증. 실제성장및50시즌경제검증에직원운영비와고용패턴을추가한다.

실행처리순서/필드/명령입출력/예외/검수fixture는[상세계약](61-STAFF-DETAILED-CONTRACT.md)을따른다. 공통[64](64-EXPANSION-COMMON-CONTRACT.md).

---

<!-- SOURCE: 53-IMPORTANT-GAME-COMMENTARY.md -->

표시·상태 최신 계약: [104](104-COMMENTARY-CHRONICLE-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 53. 중요 경기 문자 중계·다시 보기

문자중계는확정된경기엔진로그의표현이다. 중계속도/스킵/앱종료/재열람이타석난수나시즌성장에영향을주지않는다. 실시간조작야구/투구미니게임은추가하지않는다.

## 중요 경기 선정과 시작

첫KBO/MLB/국제실제출장예정,대학/프로/국제결승,은퇴마지막경기,라이벌재회첫경기,기록직전경기를후보로한다. 데뷔는등록만으로확정하지않고실제라인업예정후선택,결과적으로출장0이면데뷔장면생성안함. 은퇴경기는미리은퇴의사와유효계약/일정이있을때만,일정없으면별도작별행사카드이며가짜경기없음.

빠른시즌진행중에도‘중요 경기 미리보기’설정ON이면해당경기직전한번중단:중계로보기/결과만보기. 중요선택사건중단과달리이읽기중단은설정OFF가능. 선수기용/부상등의무결정은OFF여도멈춤. 후보이유여러개는gameId한개카드로합침.

## 경기 확정과 재생

사용자가진행하면24의같은엔진/청크/트랜잭션으로경기를끝까지처리,완료receipt후중계재생. ENGINE_LIMIT/pending이면확정된구간까지와‘계속처리중’을표시하고완료라고쓰지않음. 경기미완료단계는클라이언트애니메이션으로가짜종료하지않는다. 서버결과요청은commandId로멱등,중계읽음cursor는별도편의값.

S44상단이닝·점수·아웃·주자→현재타석→대표구종(투수보유시)→문장로그→속도/건너뛰기→박스스코어. 속도1/2/4배,일시정지/한타석/끝까지,모션축소는즉시텍스트. 결과를숨기는연출은가능하나중계선택이결과를결정하지않는다. 중간에닫기후같은gameId/receipt로다시읽는다.

## 문장 템플릿과 표시

| 로그 | 텍스트 예 |
|---|---|
| PA_START | ‘7회말, 1사 2루. 김도윤의 타석입니다.’ |
| REPRESENTATIVE_PITCH | ‘이번 타석 대표 구종: 슬라이더.’ |
| 1B | ‘중전 안타’처럼엔진에없는방향은쓰지않고‘안타! 주자가 이동합니다.’ |
| HR | ‘담장을 넘겼습니다. {legalRuns}점 홈런!’ |
| K/BB | ‘삼진으로 물러납니다.’ / ‘볼넷으로 출루합니다.’ |
| ADVANCE | ‘홈 진루 시도 · 성공률 {effectiveP}. {result}’(자동판정회고) |
| WALKOFF | ‘끝내기! 확정 스코어 {home}:{away}.’ |
| MILESTONE | ‘이 타석에서 {scope} 통산 {record}을 달성했습니다.’ |

실제타구방향/구속측정/초구/심판판정/수비호수비가없는로그에는그런구체묘사를만들지않는다. 점수는합법득점원장,기록은박스스코어와동일. 팀로고실패시이니셜,장식이미지없어도모든정보읽기가능. 소리기본OFF/개별설정,중계화면자동음성없음.

## 보관·API·검증

기본상세로그보존정책15에별도importantGameSnapshots를추가:데뷔/결승/라이벌첫재회/은퇴/실제개인기록달성경기와사용자가핀한경기는압축로그영구보존,이외상세는기존보존기간. 핀은임의개수하드삭제상한없음,목록50건페이지네이션/비용측정. 일시중계대상지정만되고실제이정표없던경기는일반보존정책.

gameReceipts/playLogChunks/commentaryTemplateVersion/importantGameSnapshots,unique(gameId,playCursor,eventType). READ_COMMENTARY/PIN_GAME는조회·핀만,경기resultHash보존. 원본보관후구규칙버전경기를재시뮬레이션해현규칙결과로교체하지않는다. 보존로그없는옛경기는요약기록만열람,‘다시보기없음’명시.

LIVE01 중계/결과모드동일resultHash/속도난수불변/앱중단복구/부분경기표시/타구방향가짜0/점수합/중복핀0/대표구종표시/구로그버전검증. 접근성은자동로그전부를매문장aria-live로읽지않고현재타석요약과수동읽기영역을분리한다.

65사용자답변으로기념보상만/감상형중계확정. 상세처리순서·스키마·API·상태·복구·검수는[상세계약](62-COMMENTARY-DETAILED-CONTRACT.md).

---

<!-- SOURCE: 54-CHRONICLE-MEMORY-CARDS.md -->

표시·상태 최신 계약: [104](104-COMMENTARY-CHRONICLE-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 54. 나만의 야구 연대기·기념 카드

모든선수의고교→대학/프로→국제/복무→해외→은퇴를실제기록으로묶는다. 참고게임의문구/아트를복제하지않고보드의자체가상초상/구장일러스트와HTML텍스트를쓴다. 런타임LLM/이미지생성서비스는필수의존성이아니다.

## 자동 장면과 타임라인

입학/졸업/지명/첫계약/실제첫출장/첫안타·홈런·승리·세이브/첫대표출장/우승·개인상/부상복귀/복무시작·완료/포스팅/해외계약/라이벌재회/은퇴/지도자취임을대상으로한다. sourceReceipt+momentType고유키,게임날짜→이벤트종류→ID로정렬. 읽지않아도기록되고다시보면중복장면을만들지않는다.

동일경기여러기록은한대표카드+세부배지,원래evidence는모두보존. 원본의국내/미국/대학/국제기록은필터분리,팀우승·개인출장·병역자격·실제복무완료를서로다른문장으로쓴다. 올림픽등록만한선수에게‘결승을승리로이끌었다’같은미확인공헌문구없음.

사용자는장면핀/제목메모(60글자)/설명메모(300글자)/표지선택가능. 공식기록숫자는수정불가,사용자메모는기록과구분하고HTML로해석하지않는다. 카드숨김은장면기록삭제가아니며필터로다시볼수있음. 날짜/나이는그사건시점값,19세복사본으로원본은퇴카드나이를바꾸지않음.

## 카드와 시즌·은퇴 책장

| 카드 | 필수 데이터 | 표현 |
|---|---|---|
| 첫무대 | 날짜/구단/레벨/실제출장근거 | 초상+유니폼색+기록 |
| 이정표 | 정확scope/통산값/경기ID | 큰숫자+증거경기링크 |
| 시즌표지 | 연도/소속별정규기록/수상 | 시즌최고장면+기록표 |
| 복무/재활 | 시작·완료/경과/복귀소속 | 회복·재출발문구,가짜출장0 |
| 두리그여정 | 국내·미국리그별기록 | 합산하지않는두패널 |
| 마지막인사 | 은퇴나이/최종/능력별최고/원본ID | 커리어요약과재육성/지도자연결 |

S45탭‘연대기/시즌책장/핀한장면’,연도·리그·유형필터,카드선택→큰카드→증거경기또는세부기록. S11보관상세에서바로연결. 프로미진출·기록0인아마추어은퇴도학교와마지막선택을보관,빈카드로멈추지않음.

## 로컬 내보내기

카드PNG(1080×1350)/연대기JSON내려받기제공,이용자버튼선택때만파일생성. 외부메신저/게시물자동전송없음. PNG는현재필터의단일선택카드,일괄공유는후속범위. 글자는이미지틀에맞춰잘라버리지않고긴제목줄바꿈/설명줄수경고·확인. 한글폰트준비후렌더,이미지실패시동일내용텍스트카드대체.

기본수출에는이름/가상선수기록/구단표시/게임모드출처만,이메일/내부소유자ID/인증값없음. 공식로고사용은37의배포권리정책,미확인자산은내보내기에색상/팀명대체. 진짜개인선수사진업로드기능은이번범위없음. 내려받기실패해도저장된기록/원본변경없음.

## 저장·복원·검증

careerMoments(saveId,playerId,type,gameDate,ageSnapshot,evidenceRef,presentationVersion),momentPreferences(ownerId,momentId,pin,hidden,caption),seasonBooks/archiveChronicles. export는이읽기모형에서생성하고카드내보내기로수상·능력·보상지급없음. 버전별템플릿변경시원문/수치evidence보존,깨진참조는남은요약과‘상세기록없음’표시,근거없으면AI로채우지않는다.

TIM01 사건멱등/미출장메달문구/리그분리/은퇴원본나이/복사본별연대기/긴한글/폰트실패/개인정보미포함/로컬다운로드실패/구기록상세없음/원본불변검증. PNG실제렌더·글꼴/Android다운로드는구현후필수검수다.

실행처리순서/필드/명령입출력/예외/검수fixture는[상세계약](63-CHRONICLE-DETAILED-CONTRACT.md)을따른다. 공통[64](64-EXPANSION-COMMON-CONTRACT.md).

---

<!-- SOURCE: 55-EXPANSION-INTEGRATION.md -->

최신결정:[65](65-USER-TRAITS-XP-STAFF.md). 상세API공통[64](64-EXPANSION-COMMON-CONTRACT.md),기능별56~63전체작성. 기념보상만/감상형중계도사용자답변으로확정,미답변선택없음.

# 55. 추가8기능 통합·데이터·사건·화면 계약

사용자확정U:47~54의8기능모두v1필수. 수치·장착수·보상·수수료·역할충돌정책은설계기본안D. 앱구현은계속미착수. 최신화면45종(S01~45),이벤트99종(E01~99). event-catalog-v2.json은구조schema2/콘텐츠버전3이다.

| 기능 | 화면 | 사건 | 원본/복사본 |
|---|---|---|---|
|47특성 |S38|E84/85|원본보존,어린복사해금초기화 |
|48구종/성향 |S39|E86~88|복사숙련절반하한1/성향유지변경가능 |
|49목표 |S40|E89/90|계정보상보존/새선수달성0 |
|50에이전트 |S41|E91~93|복사에이전트없음/관계50/수입0 |
|51관계 |S42|E94~96|원본관계보존/상대자동복제없음 |
|52지도자 |S43|E97|새직원ID/동일세계같은원본현역중복불가 |
|53중계 |S44|E98|gameId/receipt/hash보존,재추첨없음 |
|54연대기 |S45|E99|사건시점나이/기록보존,복사별도 |

## 사건과 화면

E84/87/90/99는결과알림으로같은날요약가능,개별근거유지. E85/86/88/89/91선택창은건너뛰기가능. E92/93요청에는38확률미리보기필수,실제100숫자숨김. E98읽기중단설정은복무/계약등의무중단을해제하지않는다. 45의중복키/우선순위/만료계약유지.

커리어홈S03/대학S35/미국S30의선수메뉴→S38/39/40/41/42/45. 보관S11→S45또는S43고용대상선택,기존S12어린복사경로도유지. 구단S13→S43직원/S37예산,선수상세S16→도감/구종/관계읽기. 경기S19→S44상세로그,이정표→S45근거카드. 모드별접근권한없는화면은직접URL로도변경불가.

## 엔진·성장 계약

41유효능력/클러치/위기→08base logit→48구종·성향과47특성합을결과별[-.10,.10]으로제한→softmax. 특성합자체는[-.06,.06]. 계수를성공률퍼센트포인트로오역하지않음. 수비/진루/교체특성은각단계한번만,평균종합/영구최고에포함안함.

42성장훈련계수에코치효과합산후최대1.2,같은기간가중. 구종XP일반20/개인치트60,세계시즌강화1회유지. 커리어치트양의6능력성장3배/잠재력100/도전성공보장,구단치트돈/탐색/영입은기존대로. 특성은기록으로자동해금·전체보유자동효과,개인치트구종XP3배는65사용자확정. 개인재협상보장은없음.

## API·데이터·복원

28논리엔티티에playerTraits/pitchRepertoire/pitchTrainingPlans/seasonGoals/achievementUnlocks/cosmeticUnlocks/agentContracts/playerIncomeLedger/clubRelationships/playerRelationships/staffInstances/staffContracts/importantGameSnapshots/careerMoments/momentPreferences추가. 개인행owner/save검사,공용정의버전과진척분리. archive에스킬·관계·수입·연대기evidence추가,원본행불변.

쓰기명령은revision/idempotencyKey/receipt,중계·목표·카드조회는난수소비0. 구종대표선택pitchPlan/개인요청negotiation전용스트림. 표현·연대기에는PRNG없음. engineVersion증가,새버전끼리중계ON/OFF동일hash. 이미끝난구경기를새엔진으로재생성하지않는다. 구스킬없는세이브는고지된호환절차로새스트림만초기화,기존rngState리셋없음.

Neon객체저장소에중요로그/연대기첨부파일을비공개owner키로저장,28의권한·서명URL공유. 카드다운로드는이용자선택으로기기내파일생성,외부메시지/게시없음. 이번설계수정으로productionDB/버킷을변경하지않는다.

## 추가검증

특성/구종조합100seed/10만타석효과방향,중계속도/스킵hash동일,직원급여포함50시즌경제,원본50%복사와스킬초기화,요청실패오퍼보존,PNG한글/Android다운로드. 정적카탈로그통과는이실행검증을대체하지않는다.

---

<!-- SOURCE: 56-TRAITS-DETAILED-CONTRACT.md -->

최신 확장: [100 히든 특성](100-HIDDEN-TRAITS.md)의 사용자확정 T13~T16을 추가해 총16개다. 기존12개는 공개 특성,신규4개는 해금 전 이름·암시만 공개한다. 보유 전체 자동 적용과 기존cap은 유지한다. T14의 수치 기준은2026-10-19 후속 확정(시즌 라이벌 투수 상대20PA·OPS .900·관계 승리)이다.

# 56. 특성 상세 계약 — 판정·자동적용·중첩·S38

47의기존12특성 및100의히든4특성과계수를사용한다. API/자료형/오류는[64](64-EXPANSION-COMMON-CONTRACT.md). 아래는추가설계결정D이며실행검증전. 특성은로그잇효과·수비·진루·교체의4처리유형으로분리한다.

## 해금 판정의 정확한 범위

OFFICIAL은HS/COLLEGE/INDEPENDENT/FUTURES/KBO/ROOKIE/A/AA/AAA/MLB/국제의실제공식경기,연습/자체청백전제외. ‘한시즌’은worldSeasonId+competitionId+REGULAR한묶음이며다른레벨을합쳐문턱을넘기지않는다. ‘커리어’는OFFICIAL전체,PS는phase=POSTSEASON만. 능력조건은버프없는영구값,해금시점만검사하고나중에노쇠해도박탈없음.

| 특성 | 정확한 evidence 조건 |
|---|---|
|T01|같은시즌정규PA≥150 AND (2B+3B+HR)≥20 |
|T02|같은시즌정규BB≥30 |
|T03|커리어추가홈진루성공≥20,단순기본진루미포함 |
|T04|커리어실제수비출장100경기 AND DEFENSE≥70,DH단독출장제외 |
|T05|타석시작만루의커리어H≥10 AND CLUTCH≥70 |
|T06|커리어PS HR≥5 |
|T07|같은시즌정규K≥100 |
|T08|같은시즌정규투수outs≥300 AND COMMAND≥65,보직무관 |
|T09|커리어SV≥20 AND COMPOSURE≥65 |
|T10|같은시즌정규선발등판≥20 AND STAMINA≥70 |
|T11|타석시작만루상대BF≥30 AND COMPOSURE≥70 |
|T12|커리어SV≥100 |

경기최종커밋→통계누적→미해금정의조건평가→해금행/근거/ E84동일transaction. 경기중문턱을넘겨도그경기의장착과확률은불변. 같은특성은playerId+traitId고유. 기록정정이있으면획득근거에정정표식,이미소비한경기결과소급변경없음.

## 해금·효과 적용 순서

[65 사용자결정](65-USER-TRAITS-XP-STAFF.md):기록해금후보유특성모두자동적용. 장착슬롯/시그니처수상한/변경창/AI조합선택폐기. 경기종료시해금은그경기를소급수정하지않고다음타석snapshot부터반영. 대학/프로/국제이동으로해금초기화안함. AI/동료/상대도같은해금/자동적용규칙.

T01첫대면키=(gameId,batterId,pitcherId),타석시작전에방문0이면활성,BB/HBP도방문소모. T05/T11타석시작만루. T09는inning≥8 AND abs(scoreDiff)≤3,T12는inning≥9 AND 자기팀리드,동점비활성. 타자/현재투수전체보유중조건충족logit합을[-.06,.06]cap→구종/성향합→[-.10,.10]cap→softmax. 시그니처2개라도조건충족하면모두원벡터에포함.

T04는피로/적합도처리전본인유효수비+2/clamp100→적합도→야수8명평균에한번. T03기본추가진루p+.02후[.40,.90]. T10은SP교체검토수+3후105상한,하드110/피로80검토유지. 이비logit효과는logitcap에섞지않음. 총보정이cap에닿으면상세도움말에원합/적용합구분,누락특성이라고표시하지않음.

## AI와 원본

AI는기록과영구능력으로동일조건을해금하고수동선택/순위최적화없음. 주인공만해금조건을완화하지않음. 치트는특성전부해금효과없음. archive의unlockedTraits/evidence/definitionVersion보존,어린복사본은해금0/기록0으로시작. 원본도감은출처탭. 지도자는현역특성을선수단에복사하지않음.

## 데이터와 API

| 엔티티 | 필드·제약 |
|---|---|
|trait_definitions|traitId/version복합PK,kind,signature,predicateKey,handlerType,effectVector;세이브고정버전 |
|player_trait_unlocks|saveId/playerId/traitId UNIQUE,definitionVersion,evidenceKey,unlockedAt;append-only |
|trait_effect_evidence|gameId/playCursor/traitId/side UNIQUE,conditionSnapshot,rawVector,combinedCappedVector;중요로그보존 |

traitLoadouts테이블은채택하지않는다. GET expansion/traits?playerId=… →{playerId,autoApply:true,unlocks:[{traitId,progress,evidenceRef}],definitionVersion,currentConditionEffects}. 자동해금은경기/기록정산명령의transaction에포함,클라이언트UNLOCK_TRAIT명령없음. EQUIP_TRAITS요청은422 NOT_ELIGIBLE/automaticTraits로거절,효과없음. 핀한표시특성이필요하면개인UI선호값일뿐활성여부와무관.

## S38 흐름·실패·검수

보유/미해금탭→조건진척/영구능력→실제상황별효과→획득근거경기. 기본안의2슬롯/적용버튼을삭제,‘보유 특성은 조건이 맞으면 모두 적용됩니다’표시. 조회실패는도감0으로취급안함. 다른기기진행후새목록조회,이화면열람으로save revision/난수변경0.

TR-D01 BB29→30단1해금/02같은경기receipt재처리중복0/03T05와T06둘다보유하면PS만루동시원합적용/04원벡터.08→cap.06/05무주자T05미활성/06첫대면BB소모/07원본보유12개복사0/08도감읽기난수0. 구현시경계·transaction·권한·응답유실을[64](64-EXPANSION-COMMON-CONTRACT.md)와fixture로실행검증한다.

미해금 히든 응답은traitId/hidden/name/hint만 허용하고 progress/predicateKey/evidenceRef/효과·문턱을 포함하지 않는다. 일반 특성의 진척 응답과 해금 후의 상세 응답을 구분한다. 클라이언트용 번들·캐시·정적JSON에 서버 규칙 파일을 포함하지 않는다. 해금은 최종 경기/관계·시즌 정산의 같은 영수증 안에서 한 번,다음 실제 타석부터 적용하며 이전 경기 재계산은 없다. T14는 같은 라이벌/시즌/대회 정규 기록의 원분모로 검사,관계 승리 선택지를 누른 사실이 아니라 확정된 이벤트 결과가 근거다.

후속 경계 계약 D: [107 라이벌·히든 경계](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)의 프로 형성/직접 결투 WIN·T14 대상 집합/완봉·연속 시즌/정정 규칙을 해당 범위에 적용한다. 사용자 확정 해금 문턱·효과는 유지한다.

---

<!-- SOURCE: 57-REPERTOIRE-DETAILED-CONTRACT.md -->

표시·편집 최신 계약: [101 구종 상태 UI](101-REPERTOIRE-STATE-UI.md)의 사용자확정 비례 자동보정/최대잔여/pitchId 동률/하한10 재배분을 적용한다. 슬라이더는 로컬 초안이며 확정 전 실제 구성·기회·난수 변경은 없다.

최종 수치 정합: [90](90-NUMERIC-LEDGER-CONSISTENCY.md)의기본XP20/예약/배율후소비/실제숙련증가분리와정수잔여규칙을함께적용합니다. 실제cap잔여만으로지급하지않으며팀이동으로기본예산을초기화하지않습니다. 반값가져오기의1e-4단위반올림도90을따릅니다.

최신 v0.14: [85 난이도·구단 치트](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)가 상충하는 이전 규칙을 대체합니다. 구단 치트는 내 구단 전체의 잠재력100·양의 자연성장/구종XP3배를 적용하며 이후 영입·보관 투입 포함입니다. 일반 구단과 원본 기록에는 소급하지 않습니다.

# 57. 구종·숙련·성향 상세 계약

48구종7종/성향4종과[65](65-USER-TRAITS-XP-STAFF.md)의개인치트구종3배적용. 공통API/단위/오류는[64](64-EXPANSION-COMMON-CONTRACT.md). XP는1e-4단위정수,표시등급은누적[0,10,30,60,100,150]이하최대index다.

## 구성과 대표 구종

pitchBook은배운이력최대7종,활성+학습slot은최대4. 시작P01등급2/XP30+사용자보조1종등급1/XP10. 활성2~4종/각weight정수10~90/합100,학습0등급은weight0/active=false. 미사용이력은숙련유지,복귀는구성창에서만. 비율은정렬pitchId순누적구간,PRNG u∈[0,1),경계u=.60은60%구간다음구종. 매실제타석대표구종1회pitchPlan스트림소비. 고의사구없는엔진이므로정상PA모두대상,취소/오류rollback은rng복원. 조회·중계·hover미소비.

타자성향벡터는해당타자의타석마다동일,타구방향통계아님. 투수구종벡터×등급/5→타자성향→56보유특성합산cap→softmax. 등급은타석시작snapshot,타석결과로XP문턱넘어도다음타석부터새등급. 결과PA내구종별실제구수통계생성금지.

## 성장 예산과 학습 정산

baseSeasonCap=20,배수m=개인커리어SECRET_CHEAT주인공3/그외1,actualCap=20m. 연간원장은baseGranted/baseReserved/actualGranted,baseGranted+baseReserved≤20. 새구종선택시baseReserved10,기존실전은남은base10내획득,학습없으면실전base20까지. 세계시즌1원장이라고교→프로/상무/미국이동중복없음.

실전candidateBase=min(.06,그타석투수기록outs×.02). 대표구종에min(candidateBase,20-baseGranted-baseReserved)×mXP. 주루아웃도해당투수outs라후속타석아웃과이중기록하지않음. 학습은등록리그정규일정진행률25/50/75/100%에각base2.5reserved해제,해당분기건강·훈련가능등록일/분기전체등록일비율을곱한값만grant. 일반현역0,상무는등록훈련가능일. 분모0이면grant0. 미지급예약잔여는그분기마감때해제,다음실전기회만재사용가능,과거실전소급지급없음.

각entry.actualDelta=min(baseDelta×m,150-currentXp),상한으로버려진actualXP도base예산소비로기록,다른구종에부활안함. 실제cap60/20검사. 예치트건강학습4회각7.5XP→총30/등급2,실전최대30추가가능. 일반학습총10/등급1. 부상분기절반이면일반1.25/치트3.75. 소수반올림잔여는1e-4정밀도세계원장에보존,자연능력성장원장과혼합안함.

## 변경·AI·가져오기

프리시즌/정규절반각창1회구성변경,학습계획은PRE만1회. 성향변경은별도동일창1회,같은내용NO_CHANGE기회0. 새학습취소는확정전만,확정후기존진척은book에남고시즌재선택없음. 4슬롯가득이면미리선택한비활성화대상확인,활성2종미달구성거절. 복무로놓친MID는복귀시1회/시즌넘기면소멸.

AI투수는등급높음→구종ID순상위최대4활성,2종보다적으면생성/호환오류이지무료능력생성안함. 2종60/40,3종50/30/20,4종40/30/20/10. 새학습은보유구종누적XP합이50이상이고slot여유있을때미보유최소ID1종,아니면기존숙련집중. AI타자성향은생성된preferenceApproach를유지,매타석상대에맞춰무료변경안함. 개인성향·AI모두같은효과.

복사원본이력모든종류보존,등급≥1은max(1,floor(등급/2)),XP는그등급최소값;원본학습등급0은0. 활성구성은원본중숙련유효2~4와원래비율,학습0이활성에있었다면불일치로미리보기보류. 새세계성장예산0소비에서시작,개인치트출처를구단에승계하지않음.

## 데이터·API

| 엔티티 | 필드·제약 |
|---|---|
|pitch_books|saveId/playerId/pitchId UNIQUE,xpUnits0~1500000,mastery파생 |
|pitch_loadouts|playerId PK,slotPitchIds≤4,activeWeights JSON,windowId,changesUsed0/1,rowRevision |
|pitch_training_plans|playerId/seasonId UNIQUE,pitchId,quarterPaidMask0~15,baseReservedUnits |
|pitch_xp_entries|playerId/sourceEvidenceKey UNIQUE,baseUnits,actualUnits,multiplier,capLossUnits |
|batting_approaches|playerId PK,approachId enum,windowId,changesUsed,rowRevision |

GET expansion/repertoire?playerId →{kind,book,loadout,training,seasonBudget:{baseCap:20,multiplier,actualCap,spent,reserved},allowedActions}. SET_REPERTOIRE={playerId,windowId,slots:[pitchId],weights:[{pitchId,percent}]};SET_PITCH_TRAINING={playerId,seasonId,pitchId,replaceSlotPitchId?};SET_BATTING_APPROACH={playerId,windowId,approachId}. preview는before/after/비율합/학습예상/예산. 합99는422 INVALID_ALLOCATION/weights,학습미허용은422 WINDOW_CLOSED,숙련0활성은422 NOT_ELIGIBLE. 성공receipt에는최종bookVersion/설정/기회사용만.

S39는종류별화면분리,학습XP와활성비율을같은숫자로표시하지않음. XP가P상한100인것처럼표현금지. fixture PIT-D01~08:경계.60/합99/등급0활성/치트학습30등급2/연간60cap/부상3.75/다중리그동일원장/복사등급5→2 XP30. 예산·PRNG·호환·응답유실실행검증은구현후.
최신 사용자확정U(2026-10-20): 활성4종에서 새 학습을 위해1종을 비활성화하면 PRE 구성 변경1회를 함께 사용한다. 슬롯 교체·학습 계획·예약을 원자 확정한다. 기회 소진 시 교체 불가. 빈 슬롯 학습은 별도 구성 변경을 소모하지 않는다.

## 2026-10-26 사용자 확정 — 다음 해 미완성 구종 재학습

부상 등으로 시즌말 숙련1 미만이어도4분기 정산·예약 해제가 끝났으면 연말/진로 전환 가능. 기존 구종 XP는 그대로 보존하고 학습 계획·연간 예약/소모 원장만 정상 연도 전환한다. 다음 PRE에서 같은 숙련0 구종을 다시 학습 대상으로 선택할 수 있다. 기존 XP를0으로 덮지 않으며 새 시즌 학습1회와 base10 예약을 사용한다. 숙련1 이상 구종의 새 구종 학습 재선택은 불가, 숙련0은 계속 비활성. 미완료 분기·미해제 예약의 무시나 과거 부상분 소급 지급은 없다.

---

<!-- SOURCE: 58-GOALS-DETAILED-CONTRACT.md -->

표시·상태 최신 계약: [102](102-GOALS-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 58. 목표·도전 과제 상세 계약 — 선택·집계·기념 보상

사용자확정U:보상은기념외형만유지. 능력/잠재력/돈/강화횟수/구종XP효과0. 49의목표10종/도전12종,64의API·멱등·오류를구체화한다. 아래교체/집계규칙은설계기본안D.

## 상태와 선택 시점

시즌슬롯0~3,PRE창에서동시선택/수정가능,정규첫경기명령이확정되면목록잠금. 선택0개도진행. 목표status=ACTIVE/COMPLETED/REPLACED/EXPIRED/CORRECTED,completionReceipt/evidence는완료뒤불변참조. 시즌중반소속리그정규절반올림에서교체창1회,미완료ACTIVE슬롯한개만교체,완료슬롯은보상후비우기/재사용불가. 리그이동으로교체창재생성없음,시즌종료때미사용기회소멸.

MID신규목표는현재시즌수치가이미target이상이면선택불가(ALREADY_SATISFIED),현재수치가미달이면시즌시작이후같은scope의전체진척으로시작한다. 예BB22→G04교체면22/30,BB33이면선택불가. 목표를PRE에선택했으나정규0경기로끝나면EXPIRED,페널티없음. 원본선수의과거기록을복사본시즌에대입하지않음.

## 목표별 집계·추천

scope={worldSeasonId,leagueId,phase,teamId?},선택시leagueId고정. 국내/미국/대학/국제/PS전적합산없음. 미국마이너각leagueId도별도. 이적해도같은leagueId면이어집계,다른leagueId이동은원scope결과만유지,미완료목표에‘이전리그기록기준’표시/MID잔여교체가능. 기록율이아닌원시count사용.

| ID | 자격·정확 predicate | rewardId/type |
|---|---|---|
|G01|타자,REGULAR PA≥50|R-G01/FRAME |
|G02|타자,REGULAR startedGames≥50|R-G02/TITLE |
|G03|타자,REGULAR HR≥20|R-G03/BACKGROUND |
|G04|타자,REGULAR BB≥30|R-G04/STAMP |
|G05|투수,REGULAR K≥100|R-G05/BACKGROUND |
|G06|투수,REGULAR선발등판outs합≥300|R-G06/FRAME |
|G07|투수,REGULAR SV≥20|R-G07/TITLE |
|G08|선택시실제부상/재활중,회복후같은시즌실제출장≥1|R-G08/BACKGROUND |
|G09|선택팀정규명단이력1경기일이상,그팀PS진출최종확정|R-G09/STAMP |
|G10|대학등록,대학선수권실제PA>0또는투수BF>0|R-G10/FRAME |

G06은구원아웃미포함. G09다른팀으로이적해도목표팀은선택때고정,목표팀결과와개인출장을혼동안함. G08수동가짜부상/복귀확인만으로완료불가. 졸업/병역으로남은기회없으면달성불가사유표시하되능력감소없음.

추천은현재종류/레벨자격필터→전시즌같은scope실적r과target비율r/target이.5~1.2면우선→진척이큰항목→goalId순,최대3개. 전시즌분모0이면타자G01/G04/G09,투수G05/G06/G09중유효조건순. G08은현재부상중일때만추천,G10대학만. 추천은자동선택아니며‘달성률75%’같은근거없는p없음. 사용자는추천밖유효목표도선택가능.

## 도전 과제와 보상 정산

A01프로첫계약(KBO/MiLB/MLB)/A02KBO첫실제출장/A03MLB첫실제출장/A04국제첫실제출장/A05대학GRADUATED/A06포스팅후해외계약실제체결/A07병역COMPLETED(비대상제외)/A08동일leagueId커리어H≥1000/A09동일leagueIdW≥100/A10동일leagueIdSV≥200/A11고교라이벌과첫실제재회/A12KBO와MLB실제출장후은퇴. 각각R-A01~R-A12의도감스탬프, A12는책장표지. 최초자격판정후UNIQUE(playerId,achievementId)해금,여러선수달성출처는모두남김.

경기/상태전이최종commit→기록집계→완료predicate→goalCompletion/achievementUnlock→cosmeticUnlock(owner,rewardId) ON CONFLICT보유유지→E90/outbox원자커밋. 보상수령버튼없이자동해금,열람/연대기생성/PNG다운로드로재지급없음. 같은보상계정보유면‘보유중’,대체재화0. 치트출처배지유지,치트라서보상박탈안함. 정정으로기준미달이면완료행CORRECTED/evidence이력남김,이미해금한기념외형은회수하지않음. 다른선수의동일보상근거삭제안함.

## 데이터·API

| 엔티티 | 필드·제약 |
|---|---|
|goal_definitions|goalId/version복합PK,kind,scopePolicy,predicateKey,target,rewardId |
|season_goal_slots|saveId/playerId/seasonId/slot UNIQUE,definitionId,scope,status,progress,selectedRevision,completedEvidence? |
|goal_replacement_usage|playerId/seasonId UNIQUE,used0/1,windowId |
|achievement_unlocks|playerId/achievementId UNIQUE,evidenceRef,definitionVersion |
|cosmetic_unlocks|ownerSubject/rewardId UNIQUE,firstEvidenceRef,unlockedGameInstant |
|cosmetic_sources|owner/rewardId/playerId/evidence UNIQUE,추가달성출처 |
|cosmetic_preferences|owner/playerOrProfile/slot UNIQUE,rewardId,preferenceRevision;게임능력필드없음 |

GET expansion/goals?playerId→{seasonSlots,eligibleDefinitions,recommendedIds,replaceWindow,achievements,rewards,gameplayRewardDelta:0}. SET_GOALS={playerId,seasonId,goalIds:[G01,G03],scopeByGoal};REPLACE_GOAL={playerId,seasonId,slot,newGoalId,newScope};preview는현재진척/자격/보상보유/교체사용후상태. 성공result={slots,replacementUsed,rewardGrantCount}. 계정보상삽입은rewardId오름차순으로처리하고unique충돌시기존행을유지한다. 동일목표중복/4개는422 SLOT_CONFLICT,완료슬롯교체422 NOT_ELIGIBLE,MID기회0이면422 LIMIT_REACHED,기준기록변경409 PREVIEW_STALE.

EQUIP_COSMETIC은PATCH /api/cosmetic-preferences/{scopeRef}={expectedPreferenceRevision,slot:TITLE|FRAME|BACKGROUND|STAMP,rewardId|null},소유보상/type일치검사. 이외형설정은save revision/난수불변,서버프로필선호revision CAS. 이름표시/카드theme만변경,미보유422 NOT_ELIGIBLE.

## S40·실패·검수

시즌/커리어/기념보상탭→정확scope/기한/진척→목표초안→preview→확정. 완료후보상은이미해금됐음을표시,애니메이션실패후재수령버튼없음. 409는최신진척재조회,기록없음과조회장애를구분,규정분모0도목표선택/시즌진행가능.

GOAL-D01 HR19→20완료1/02같은receipt보상증가0/03KBO12+MLB8은G03미달/04완료슬롯교체거절/05BB22MID교체22/30/06BB33신규선택거절/07미선택시진행/08구원300아웃G06미달/09부상복귀명령만G08미달/10계정같은보상재화0/11정정기념유지/12전체gameplayDelta0. 보상수치가게임밸런스에영향없는것을엔진/DB/화면테스트각각검증한다.

---

<!-- SOURCE: 59-AGENTS-DETAILED-CONTRACT.md -->

표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 59. 에이전트·관계·재협상 상세 계약

50의3전문분야/2%수수료/확률식을구체화한다. 64공통처리,캐릭터주인공의개인협상과40구단FA선수수락을서로다른명령으로처리한다.

## 오퍼와 역제안 상태

유효기본오퍼ACTIVE에서preview→REQUEST_SALARY_COUNTER확정→ACCEPTED_COUNTER또는REJECTED_COUNTER. 검증실패는4xx로미사용,추첨실패는200/outcome=REJECTED로offerSet.requestUsed=true. 성공은기존오퍼와같은구단/기간/통화/마감의상향오퍼1개생성,기본오퍼는SUPERSEDED표시. 하나의offerSet은원오퍼/상향오퍼중단한계약만체결가능. 거절시기본ACTIVE유지,요청날짜가마감게임일종료를넘으면422 NOT_ELIGIBLE로추첨없음.

금액은만원단위(KRW)/100USD단위에서반올림half-up,상향률.10/.20/.30. 원연봉/상향연봉을구단당해·미래예산으로검사한뒤p계산. 상향delta예약은요청transaction에서잡고성공시상향오퍼예약으로유지,거절시즉시해제. 기본오퍼예약을이중차감하지않음. 다른기기/상대구단예산변경이면409 PREVIEW_STALE,새p·조건확인후다시확정. 클라이언트가p=1/증액.99전송시schema거절.

pSalary=clamp(.75-1.5x+.002(trust-50)+bonus,.10,.90),보너스국내AG01/미국AG03일때.08그외0. u<p이면성공,u=p는실패. 전용negotiation스트림1회만소비,명령재시도소비0. 성공은상향제안일뿐계약자동체결아님,계약수락은23의권리/등록/군복무검사유지.

## 기용 요청

bucket=floor(팀정규누적경기/20),playerId+worldSeasonId+bucket당요청1회. 시즌시작0경기구간도가능하나프로명단/건강/계약필수. 투타종류·해당포지션의현재정상출장경쟁자중roleScore최고1명,동률선수ID를comparisonPlayer로고정. pReview의두점수/관계/agent를preview에명시. 성공receipt에추가검토task생성,다음라인업검사전41경쟁식한번수행. 실패해도일반20경기검토는유지. 경쟁자0이면요청확정형검토로odds=[]/숫자확률없음,기회는검토처리로그에남김.

부상/현역복무/은퇴는422 NOT_ELIGIBLE. 상무는상무실제소속내경쟁자로검토가능. 소속변경으로같은worldSeason/bucket이미쓴기회를초기화하지않음. ‘주전 요청성공’대신‘추가평가 수용’표시.

## 관계 원장과 약속

관계저장은seasonStartTrust와rawSeasonDelta,표시는clamp(seasonStartTrust+clamp(rawSeasonDelta,-10,10),0,100). 같은시즌+15후-10이면raw5/적용+5,순서대로포화시켜+10후-10=0으로왜곡하지않음. 이적한새구단은새관계50,구관계는읽기보존.

v1약속enum PREPARE_CURRENT_ROLE:20팀경기검토기간현역할유지,사용자가자발적역할전환확정하면위반. 감독기용변경/부상/복무/국가대표/강등/소속변경은위반아님(취소또는충족가능성재검사). 약속수락은명시버튼으로만,시스템요청거절을약속위반으로처리안함. fulfilled+5/broken-10/정규등록시즌완료+2는각sourceEvidence키1회. 약속은선수·구간당최대1개,반복수락파밍없음.

## 수수료 정산·데이터

급여지급receipt별grossMinor와그날유효agentContract확인. 누적feeTarget=floor(계약유효누적gross×.02),이번fee=feeTarget-기지급fee,net=gross-fee. 지급단위마다따로반올림해수수료누락/초과하지않음. 유효하지않은기간gross는누적대상제외. 통화별원장,미지급급여/계약금/복무정지0수수료. agent교체는다음세계시즌시작효력/연1회,직접협상해지는같은교체기회사용. 첫프로가입은최초1회즉시가능,새offerSet요청횟수는agent교체와무관.

| 테이블 | 필드·제약 |
|---|---|
|agent_contracts|playerId,agentId,startGameDay,endGameDay?,feeBps=200,status,version;동시ACTIVE1 |
|club_relationships|playerId/teamId UNIQUE,seasonStartTrust,rawSeasonDelta,currentTrust,revision |
|relationship_entries|playerId/sourceEvidenceKey UNIQUE,type,rawDelta,seasonId |
|negotiation_requests|playerId/offerSetId UNIQUE또는roleBucket UNIQUE,type,pSnapshot,rngRef,outcome,counterOfferId? |
|player_income_entries|salaryReceiptId UNIQUE,currency,gross,agentFee,net;gross=fee+net |

GET expansion/agents →{currentAgent,availableAgents,feeProjection,relationships,requestsRemaining,baseOfferRefs}. HIRE_AGENT/CHANGE_AGENT={playerId,agentId|null,effectiveSeasonId};REQUEST_SALARY_COUNTER={playerId,offerSetId,baseOfferId,raiseBps:1000|2000|3000};REQUEST_ROLE_REVIEW={playerId,roleBucket}. preview는before/after/odds.target/costs/기한. 성공result={outcome,counterOfferId?,reviewTaskId?,requestUsed:true,baseOfferState}. 4xx오류는64를따른다.

S41담당비교→순수입/관계근거→요청대상→p/실패후경로→확인→결과. AG-D01직접.60/02국내전문가.68/03u=.68실패/04실패후기본오퍼유효/05중복동일receipt/06예산변경재확인/07분할급여총합100000000/fee2000000/net98000000/08관계raw15-10=5/09부상약속위반없음/10기용검토성공에도출장미보장을fixture로정의.

---

<!-- SOURCE: 60-RELATIONS-DETAILED-CONTRACT.md -->

최신 확정(2026-10-19): [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) 좌우 분리 기록(vs 좌/우투수·vs 좌/우타)은 60의 직접대결 집계 규칙(PA/AB 판정)을 그대로 쓰는 별도 읽기 모형이다.

표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 60. 라이벌·동료 상세 계약

51의서사를실제선수/소속/경기evidence로구동한다. 승격/이적/국적/경기를강제생성하지않는다. 64의소유·멱등계약,관계읽기는난수0.

## 관계의 저장 축과 후보

relationship.type=RIVAL또는TEAMMATE,stage=FORMED/SEPARATED/REUNITED_OPPONENT/REUNITED_TEAM/RETIRED. 현재stage는최근상태요약,이전단계는milestone행으로보존. 선수쌍은정렬ID로normalPairKey,주인공관점primaryPlayerId별화면을만든다. 같은쌍동일type중복없음,라이벌이동료가되어도과거type를덮지않고TEAMMATE관계추가/연결한다.

고교라이벌후보는같은kind/나이차≤1/영구overall차≤5/현재HS/자기ID제외. 같은고교는가능하나고교동료와동일ID배정금지. 후보정렬ID뒤별도relationFormation seed로하나,사용자확정U(2026-10-21): 후보0이면 NO_CANDIDATE를 기록하고 라이벌 없이 정상 진행한다. 고교당25명/전체225명 고정이며 라이벌 보충 선수 생성·재추첨은 하지 않는다. 동료는실제팀정규명단다른선수중같은kind/나이차작음/ID순1명,없으면추가생성없이없음.

## 상태 전이

| 이벤트 | 전제 | 결과·근거 |
|---|---|---|
|관계형성|유효선수2명/중복없음|FORMED/E94,evidence=formationReceipt |
|졸업후소속분리|같은팀아님/등록경로확정|SEPARATED,transferReceipt |
|서로상대팀실제출장|SEPARATED/동일gameId실제출장양쪽참|REUNITED_OPPONENT/E95,gameReceipt |
|실제같은팀등록|서로다른팀후현재같은teamId|REUNITED_TEAM/E96,registrationReceipt |
|둘중한명은퇴|retirementReceipt존재|RETIRED,이전이정표보존 |

벤치등록만한상대는‘대진예정’뉴스만,실제재회마일스톤아님. TEAMMATE공존20경기는양쪽같은팀정규명단게임일의교집합개수,같은게임일1회/우천·휴식0. 동반PS/우승은그대회명단교집합과팀결과근거. 입대/부상은관계삭제아님. 상대은퇴후재회는현역맞대결로분류안함.

## 맞대결 집계와 기록 정정

직접대결은gameId/playCursor에batterId와pitcherId가해당쌍일때만. BB/HBP는PA1/AB0,안타는AB1/H1,안타후주루아웃도H유지. RBI는타석합법득점만. 직접대결키=(pairKey,leagueId,competitionPhase,worldSeasonId),리그/PS/국제혼합없음. 다른포지션같은kind는comparison모드,각자gameStats와실제동시출장경기수만반환,직접대결AVG를만들지않음.

summary는증거로그의읽기모형,집계키gameId/playCursor/aggregateVersion UNIQUE. 같은receipt재실행증분0. 기록정정시old contribution취소+new contribution원자교체,relation milestone근거가없어지면CORRECTED표시/과거확정게임결과불변. 과거로그제거전pair contribution와summary영구보존,선수은퇴해도선수요약tombstone가참조유지.

## 데이터·API·S42

player_relationships(saveId,normalPairKey,type,primaryPlayerId,stage,version),relation_milestones(relationshipId,type,evidenceKey UNIQUE,gameInstant),relation_game_contributions(pairKey,gameId,playCursor UNIQUE,scope,stats),relation_summaries(pairKey,scope UNIQUE,stats,version). owner는save에서파생,타세이브ID연결금지. 라이벌기록을원본archive에스냅샷,어린복사본은새세계새후보.

GET expansion/relationships?playerId →{relationships:[{id,type,stage,otherPlayerSummary,upcomingMeetings}],cursor};GET /api/saves/{id}/relationships/{relationId}?scope=… →{mode:DIRECT|COMPARISON,rawStats,rates,milestones,sourceVersion}. 핀은63의개인moment preference,ACK_RELATION_EVENT={eventInstanceId}는읽음만저장/경기효과없음. client CREATE_RIVAL명령은없음.

S42상대선택→고교/국내/미국연표→scope필터→실제전적→evidence경기/연대기. 예정없음/은퇴/로그없음은서로다른문구,다른kind가아닌경우‘직접상대전적미제공’표시. 캐시후상대소속변경은요약version갱신,과거이름·구단은당시snapshot사용.

REL-D01 후보0정상처리/02본인제외/03같은ID중복역할방지/04벤치만재회미달/05BB면PA1AB0/06동일경기재처리합불변/07타자끼리DIRECT금지/08상대은퇴기록유지/09국제기록분리/10복사본원본라이벌자동복제0. 모든전이는입력evidence와기대행을fixture로명시한다.

T14 연결 D(106): 고교 기본 라이벌same-kind는 유지한다. 프로의 실제 타자-투수 기록을 근거로E94 관계 형성 영수증이 확정된 쌍은cross-kind RIVAL도 허용한다. 고교 관계 삭제·모든 상대 자동 라이벌·강제 선수 생성은 없다. 관계 형성,실제 대결,WIN 관계 이벤트는 별도 근거이며타석 조회/선택 문구로 승리를 추정하지 않는다.

후속 경계 계약 D: [107 라이벌·히든 경계](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)의 프로 형성/직접 결투 WIN·T14 대상 집합/완봉·연속 시즌/정정 규칙을 해당 범위에 적용한다. 사용자 확정 해금 문턱·효과는 유지한다.

## 2026-10-21 새 팀 최초 등록 동료 U

사용자는 대학·프로 새 팀 첫 등록마다 실제 같은 팀 선수 중 같은 종류·나이 차가 작은 순으로 동료1명을 추가하는 안을 선택했다. 고교 관계는 삭제하지 않고 보존한다. 같은 종류·나이 차 동률은 선수 ID순 D이며 기존 TEAMMATE 쌍은 제외한다. 같은 세계의 주인공·리그·팀별 첫 등록을 영수증으로 기록해 같은 팀의 다음 시즌마다 다시 뽑지 않는다. 후보0이면 추가 생성 없이 빈 첫 등록 결과를 저장한다. 라이벌이 같은 팀에 합류한 경우 기존 RIVAL을 지우지 않고 TEAMMATE를 별도로 연결하는60의 규칙을 유지한다. 새 팀 형성은 E94이며 실제 분리 후 재회 E96과 구분한다.

구현 범위 D: M2-AN은 실제 대학 최초 등록에 연결한다. 기존 대학 재학생 저장값에 새 최초 등록을 소급 생성하지 않는다. 프로는 실제 활성 등록 트랜잭션이 생긴 뒤 같은 규칙을 적용하며 계약 예약만으로 관계를 만들지 않는다.


## 2026-10-25 AI 확정 영입 공동 등록 — 구현 D (M2-DE)

실제 같은 팀 등록 E96 규칙을 기존 AI FA 수락 결과·비FA 갱신 확정 행에 연결한다. 실제 수락/확정 계약과 같은 정규 경기의 건강 등록이 필요하며 제안만으로는 생성하지 않는다. AI 영수증/계약·공식 경기·당시 정렬 등록 신원을 봉인하고 과거 읽기/ACK는 현재 소속에서 추정하지 않는다. 관계 종류와 기존 E94 형성 정책·게임/RNG/돈/성장 수치를 바꾸지 않는다. 새 사용자 결정/시장 확률이 아니며 실행 검증은 DE 구현 기록을 따른다.

---

<!-- SOURCE: 61-STAFF-DETAILED-CONTRACT.md -->

표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 61. 은퇴 지도자 상세 계약 — 역할 claim·급여·효과

52와65확정:같은구단세계같은소유원본은현역복사또는지도자하나. 보관원본불변/가상직원제공. 가격·등급은기존D,연봉코치KRW150000000/스카우트100000000.

## 역할 원장과 전이

source_role_claims PK(saveId,sourceArchiveId),role=PLAYER|COACH|SCOUT,instanceId,active=true. 이claim은별도활성표이므로동시고유행1개,이력은claim_history append-only. 구단생성import도같은표를획득한다. 서버잠금순서는save→정렬sourceArchiveId→예산계정→슬롯,모든명령공유해교착을피한다.

소유검사→은퇴snapshot버전→역할claim→직무공석→예산/미래보장검사→급여예약→staffInstance/contract/효과기간→claim/receipt커밋. 중간실패전부rollback. 동일원본다른역할활성이면422 SLOT_CONFLICT,원본숨김은새선택목록만숨기고기존claim삭제아님. 다른세계는별도claim허용. 가상직원은sourceArchiveId=null로claim없으나동일genericCandidateId중복활성불가.

고용ACTIVE→해임DISMISSED/기한EXPIRED. 해임은효과기간종료/활성슬롯·claim해제,미지급보장급여는남김. 현역복사선수은퇴시PLAYERclaim해제,원본을다음허용직원선택창에지도자로쓸수있음. 원본source와구단복사본의새archive는서로다른고유ID,출처를타고동일선수를무한동시고용하는회피는rootSourceArchiveId기준claim으로막는다.

## 급여·담당·효과

계약시작은다음세계운영일,종료는해당세계시즌재정종료일exclusive. W=저장된seasonFinanceDays,남은D일비례보장총액=floor(annualSalary×D/W). 예W200/D100코치75000000원. 지급일별cumulativeTarget=floor(guaranteedTotal×elapsedContractDays/contractDays),이번paid=target-기지급. 지급만큼reservedOperations감소/paidOperations증가,가용액변화0. 해임시남은reserved를guaranteedStaffOperations로분류만변경,추가이중차감없음. 만료뒤보장잔액정산누락은운영오류.

staffPaid/reserved/guaranteed는운영비의하위항목,선수salary원장과구분. 무제한예산도유한급여원장,실제청구없음. 계약중교체는후임보장액도검사,기존빚삭제없음. 직원1코치/1스카우트는선수정원에포함안함.

코치는assignment=BATTERS|PITCHERS,고용확정때선택,당일변경최대1회/다음세계일부터효력. pendingGame있으면명령확정불가. effectiveTraining=clamp(baseTraining+eventTrainingBonus+coachBonus,0,1.2);코치등급1/2/3의+.02/.04/.05. 기존재활base.8~1.0를먼저계산하고합산. 각선수기간별담당일수에비례,같은날두담당집단에중복적용안함. 개인치트3배는그훈련계수적용한기준자연성장에한번.

스카우트effectiveLevel=min(5,facilityLevel+I(grade≥2)),확률/전망범위미리보기에같이반영. 월탐색횟수2는증가안함,급여지급일을바꿔확률재추첨불가. 등급은소스snapshot의완료프로등록시즌0~2/3~7/8이상→1/2/3,실제등판수·나이와혼동안함. 고용뒤원본고유특성/잠재력연결보너스없음.

## AI와 엔티티

AI는오프시즌로스터·미래급여예약후가용≥해당직원보장액+10억원일때만빈슬롯고용,코치우선→스카우트,등급3가상후보선택. 유지비부족시새계약갱신하지않고기존보장금유지. 플레이어원본보유에의존안함. 현재구단상태로검증하되같은날사용자행동을보고AI후보재추첨없음.

staff_instances(id,saveId,rootSourceArchiveId?,sourceSnapshotHash,role,grade,assignment,status,rowRevision),staff_contracts(id,annualMinor,guaranteedMinor,currency,startDay,endDay,paidMinor),staff_pay_entries(contractId,dayIndex UNIQUE,targetPaidMinor,deltaMinor),staff_effect_periods(staffId,assignment,startDay,endDay). source_role_claims에는actor ownership을복사하지않고save/archive소유관계검사.

## API·S43·검수

GET expansion/staff?clubId →{slots,candidates,costProjection,activeSourceClaims,allowedActions}. HIRE_RETIRED_STAFF={clubId,sourceArchiveId,snapshotVersion,role,assignment?};HIRE_GENERIC_STAFF={clubId,candidateId,role,assignment?};ASSIGN_STAFF={staffId,assignment};DISMISS_STAFF={staffId}. preview필수,보장총액/현재효과/효력일/해임후빚명시. result={outcome,staffId,contractId,claimRole?,effectsStartDay,budgetRevision}. 실행재시도는동일receipt/직원중복0.

S43공석→후보필터(원본/가상)→역할claim상태→등급근거→급여/효과preview→확정→운영홈. 사용불가원본은현재역할과다른후보링크,자동방출/해임안함. STAFF-D01 현역claim때고용거절/02동시import와고용중1개/03원본hash불변/04반년75000000/05해임보장잔액/06코치훈련1.18+.05→1.2/07스카우트L5유지/08급여재처리중복0/09다른세계재사용/10후임예산검사.
118 후속:[118](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md)은후반커리어→은퇴원본→19세복사/지도자역할의경험과계보claim경계를연결한다. 기존원본불변·반값·병역리셋·같은세계역할하나규칙은유지한다.

---

<!-- SOURCE: 62-COMMENTARY-DETAILED-CONTRACT.md -->

최신 확정(2026-10-19): [122](122-API-SCHEMA-LOG-ALIGNMENT.md) playRecord logSchemaVersion 2에 batterBatsAtTime/effectiveBatSide/pitcherThrowsAtTime/pitcherFormAtTime snapshot이 추가된다.

표시·상태 최신 계약: [104](104-COMMENTARY-CHRONICLE-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 62. 감상형 문자 중계 상세 계약 — 로그·해시·읽기 복원

사용자확정U:이미확정된경기감상/스킵/다시보기. 경기전전략·타석중전략명령은중계에추가하지않는다. 실제라인업/기용등기존필수행동은경기확정전에처리. 53기본안과64공통계약을구체화한다.

## 진행과 재생 상태 분리

서버경기상태=QUEUED/SIMULATING/PENDING/FINAL/ERROR. FINAL만공식종료결과/resultHash가존재. 클라이언트감상상태=READY/PLAYING/PAUSED/FINISHED/UNAVAILABLE. 감상선택이엔진seed/배열정렬/타석호출수를바꾸지않는다. ‘중계보기/결과보기’선택은동일게임진행command를호출하고presentationMode는클라이언트선호로만저장,엔진입력에서제외한다.

중요경기후보는gameId+reasonKey고유:첫예상KBO/MLB/국제출장,결승,첫라이벌실제재회예정,사전은퇴선언후마지막예정출장,기록문턱직전. 후보정렬은필수사건뒤→gameDay→gameId. 같은경기이유여러개합침,같은후보상태version에서반복팝업없음. 설정OFF는후보읽기중단만생략. 실제출장0이면데뷔/재회/은퇴출장moment안만듦.

일반진행청크내pending이면서버현재확정타석까지의프레임과‘경기 처리 중’만표시. 응답유실은원commandId조회,다른ID로경기재시작금지. FINAL도달후완전로그감상,현재UI일시정지는서버엔진중지명령이아님. 결과스킵은클라이언트cursor를마지막프레임으로옮기며game/save revision변경0.

## 정규 로그 형식

playRecord={logSchemaVersion:1,gameId,playCursor:int≥0,paSequence,kind,gameInstant,inning,half:TOP|BOTTOM,batterId?,pitcherId?,representativePitchId?,before:{outs,bases:[runnerId|null]×3,homeScore,awayScore},resultCode?,after:{…},legalRuns:[{runnerId,responsiblePitcherId,earnedFlag}],effectiveProbability?,evidenceRefs:[]}. kind는PA_START/REPRESENTATIVE_PITCH/PA_RESULT/ADVANCE_RESULT/PITCHER_CHANGE/INNING_END/GAME_END/MILESTONE. 같은(gameId,playCursor)고유,중계문장마다새경기효과를발생시키지않음.

outs전후/점수전후는해당이벤트실제snapshot. 정규1B후주루아웃은PA_RESULT/ADVANCE_RESULT를각원기록으로표시,3아웃후불법득점문장없음. GAME_END는최종receipt후한개,로그RBI/outs는24박스스코어와일치. 대표구종은57이이미선택한ID,없으면문장생략. 타구방향/실제초구/좌우코스/실측구속/기상등없는필드는문장에추론하지않음.

템플릿입력은로그snapshot만사용,현재선수나이·현재구단으로옛경기를바꾸지않는다. 홈런legalRuns개수로{runs}확정,국제타이브레이커자동주자ER은24원장그대로. 자동추가진루는실제판정의effectiveP와결과를회고표시,원p와특성후p를혼동안함. p=1숫자는38대로숨기고‘성공 보장’문구사용. p없는조회/스킵에확률배지없음.

## chunk·해시·보존

최대200playRecord/응답,chunk는최대256KiB비압축UTF8를기준으로정규JSON뒤gzip. 인덱스에시작/끝cursor,count,sha256OfUncompressed,previousChunkHash,compression,objectKey,logSchemaVersion. chain순서와checksums검사,FINAL manifest={gameId,engineVersion,logSchemaVersion,commentaryTemplateVersion,resultHash,chunkHashes,boxscoreRef,finalCursor}. resultHash는정렬canonical JSON(gameSimulationKey,engineVersion,finalScore,simulationKey기준boxscore,기록판정원시원장)SHA256이며UIcursor/속도/템플릿미포함. 구기록은당시hash유지,새버전으로경기를재시뮬레이션하지않음.

데뷔/실제기록달성/결승/라이벌재회/은퇴경기/사용자핀은important_game_snapshots영구보존. 일반상세만15보존기간적용. 원본archive참조로그는save삭제전원본보존namespace에manifest+chunk참조이관확인. refcount0인일반chunk만만료청소,불변참조있는파일삭제금지. 사용자가핀할때이미로그없으면summary핀만가능/다시보기없음명시. 자동중요후보였으나실제이정표없는경기는일반정책.

## API와 엔티티

commentary_manifests(gameId UNIQUE,status,versions,resultHash,finalCursor,chunkRefs),play_log_chunks(gameId,startCursor UNIQUE,hash,objectKey,count),important_game_snapshots(owner,scopeRef,gameId UNIQUE,reasonKeys,manifestHash),commentary_preferences(owner,scopeRef,gameId UNIQUE,preferenceRevision,cursor,speed,spoilerRevealed,pinned). live플레이상태와읽기cursor분리,내부storage key를공개API에노출안함.

GET /api/saves/{saveId}/games/{gameId}/commentary?afterCursor&limit→{status,resultHash|null,logVersion,records,nextCursor,finalCursor|null,canReplay,summary}. archive게임은GET /api/archives/{archiveId}/games/{gameId}/commentary. opaque cursor는gameId/logVersion/마지막순서와owner에결합,다른게임cursor는422 INVALID_CURSOR. chunk손상은503 LOG_INTEGRITY_ERROR,요약조회/재검증안내,임의새경기생성없음.

PATCH /api/commentary-preferences/{scopeRef}/{gameId}={expectedPreferenceRevision,cursor,speed:1|2|4,spoilerRevealed,pinned?}→{preferenceRevision,preferences}. cursor≤현재최대확정값,미완료경기마지막을최종종료로간주안함. 두기기cursor경합409는자동큰값채택안함(다시보기되감기보존),기기내읽기위치는유지하고명시적저장선택. 화면속도/다음타석/되감기는로컬,위치저장은타석전환debounce/종료시,실패해도경기결과유지.

## S44·접근성·검수

입장→상태/manifest검사→저장cursor복원→1타석/재생1·2·4배/정지/되감기/결과스킵→박스스코어또는기록홈. 재방문FINAL은처음/이어서선택,기본스코어스포일러여부는기기선호. 자동음성OFF,aria-live는사용자가넘긴현재타석요약만,전체로그는스크롤리스트. reducedMotion은타석결과즉시표시,배경애니메이션없음. 그림실패대체텍스트,문장오류시해당원기록fallback.

LIVE-D01 중계ON/OFF같은resultHash/02스킵rng0/03속도4도동일결과/04BB/HBP개별처리/05partial은FINAL아님/06로그재요청중복카운트0/07checksum불일치요약fallback/08archive원본로그보존/09없는방향문장0/10홈런legalRuns2면2점/11되감기cursorCAS충돌/12중계조회능력·보상delta0. 실제브라우저/Android중단·네트워크회복·키보드및박스스코어일치는구현후실행검수한다.

장기세계후속66~73:재도전/평가범위/자연구단주기/사건충돌/provisional원장/복원simulationKey/불변조건/연도generation/실험계획. 해당분야의이전1회준비·복원물리ID난수해석은각최신문서로대체한다.

---

<!-- SOURCE: 63-CHRONICLE-DETAILED-CONTRACT.md -->

표시·상태 최신 계약: [104](104-COMMENTARY-CHRONICLE-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 63. 연대기·카드 상세 계약 — 근거·메모·PNG·복원

54의기록표현기능을구체화한다. 목표보상방법과무관하게이문서는실제근거기록을복제표현하고수치/보상을지급하지않는다. 64공통인증,원본은퇴snapshot불변.

## 장면 생성과 보존

주요게임/등록/계약/복무/학적명령이commit할때moment_event_outbox에(sourceReceiptId,momentType,playerId,evidenceRef)고유행저장. projection worker가정의버전별template와gameInstant/당시나이/팀/리그/rawStatSnapshot을채워career_moments생성. UNIQUE(sourceReceiptId,momentType,playerId). 같은경기여러성과는groupKey=gameId로대표카드1개/배지목록,각근거행유지. 표시지연은‘장면 정리 중’,worker실패가경기명령rollback/재추첨을유발하지않음.

순서=(worldSeason ordinal,dayIndex,gameSequence,playCursor,momentId),최신순목록은역순cursor. season_book은해당시즌모든소속scope별기록과momentId참조,국내/미국합산없음. 은퇴완료조건은최종수치snapshot확정,연대기projection미완료라도보관상태PRESENTATION_PENDING표시후복구가능. 원본의sourceReceipt와momentRawSnapshot을독립보존해활성save삭제에도원본읽기가능. 선수나팀이름변경은과거당시값을덮지않음.

본문필수placeholder가없으면TEMPLATE_INPUT_MISSING으로표현만pending,역산/가짜경기생성없음. 상세로그없어도장면raw숫자/날짜는표시,재생링크만비활성. 경기기록정정은evidenceVersion증가와카드CORRECTED표시,옛이미지대체시기록변경이력보존.

## 사용자 선호 분리

moment_preferences(ownerSubject,momentId UNIQUE,preferenceRevision,pinned,hidden,userTitle,userCaption,coverTheme). 공식제목/기록은immutable,사용자제목60/설명300글자소NFC/제어문자불허/HTML이스케이프. 핀/숨김은별개bool,숨긴핀은‘숨김포함’필터에서조회가능. 같은장면두기기메모는expectedPreferenceRevision CAS,409후자동병합/덮어쓰기없음. 선호변경은save revision/PRNG/수상/보상불변.

## 카드 생성 규격

PNG단일카드1080×1350,sRGB,배경불투명,상단브랜드/시점→초상→제목최대3줄→scope/기록표→사용자메모최대6줄→게임모드출처. 제목40px/본문28px/숫자64px기본,줄넘침은글자축소대신preview에서메모편집·다른레이아웃선택. 한국어폰트glyph사전검사,준비전렌더금지. 그림실패는단색/이니셜,폰트도모든한글표시불가면FAILED/사용자에게텍스트JSON대안. 공식로고미허가상태는팀명/색상대체,이미지에강제로다운로드한외부파일을섞지않음.

JSON은{exportSchemaVersion,presentationVersion,playerDisplayName,scope,createdGameInstant,moments:[{momentRef,type,gameInstant,age,scope,rawStats,publicEvidenceRef,userTitle,userCaption}]}이며local내려받기전전체개수표시. 인증값/이메일/ownerSubject/스토리지비밀키/내부DB접속/내부행ID는제외,publicEvidenceRef는내려받은묶음내참조용익명ID. 가져오기지원은현재백업시스템과별개이므로이JSON을게임세이브복원파일이라표시하지않음.

## export job과 파일 생명주기

QUEUED→RENDERING→UPLOADING→READY/FAILED/CANCELLED. owner+exportRequestId+동일payloadHash멱등,다른내용같은ID409. snapshot은momentVersion/preferenceRevision/themeVersion에고정,대기중메모수정해도기존job수출내용은바뀌지않음. 네트워크재시도같은job조회,신규상태로다시만들기는새requestId명시.

private object key=owner namespace/exports/jobId/output.png,업로드checksum/크기검사후READY. 파일24시간후정리,서명다운로드URL5분,만료는job조회로새URL. 영구장면/기념카드정의는남고임시이미지만정리. READY전고아파일은업로드TTL뒤청소,상태FAILED가장면삭제/재지급으로이어지지않음. 서버최대파일10MiB/유저동시job2/같은outputHash재사용가능,이한도는연대기보관개수하드삭제상한아님.

## 엔티티·API·S45

career_moments(momentId,scopeRef,playerId,momentType,gameInstant,ageSnapshot,rawSnapshot,evidenceKey,presentationVersion,status),moment_event_outbox(sourceReceiptId/type/playerId UNIQUE,status,retryCount),season_books(scopeRef/seasonId UNIQUE,scopeRecordRefs),moment_preferences는위정의,card_export_jobs(owner/requestId UNIQUE,status,inputHash,outputHash,objectKey,expiresAt,errorCode).

GET /api/saves/{saveId}/players/{playerId}/moments?seasonId&leagueId&type&cursor,GET /api/archives/{archiveId}/moments,GET /api/moments/{momentId}는owner권한검사후{official,preferences,evidenceAvailability,canExport}. PATCH /api/moment-preferences/{momentId}={expectedPreferenceRevision,pinned?,hidden?,userTitle?,userCaption?,themeId?}→{preferenceRevision,preferences};POST /api/card-exports={exportRequestId,scopeRef,momentId,format:PNG|JSON,expectedMomentVersion,expectedPreferenceRevision,themeId};GET /api/card-exports/{jobId}→{status,preview?,downloadUrl?,expiresAt?,errorCode?}. 외부전송endpoint없음.

S45필터→카드→공식/메모구분→미리보기→수출확인→job상태→기기저장. 422 TEXT_OVERFLOW이면대상필드편집,409 VERSION_CHANGED면현재모습재preview,503 EXPORT_FAILED면같은job상태확인/새job선택. PIN장면누르기는코스메틱선호만,화면나가기취소가공식카드를삭제하지않음.

CHR-D01 같은outbox2회장면1/02국제0출장이면출장성과문장없음/03원본나이41유지/04메모CAS/05긴제목초과/06업로드실패공식기록불변/07서명URL만료파일존재/08export에ownerSubject없음/09게임세이브아닌JSON안내/10원본source-save삭제후카드읽기. 실제PNG픽셀/한글/Android저장은별도실행게이트.
118 후속:[118](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md)은후반커리어→은퇴원본→19세복사/지도자역할의경험과계보claim경계를연결한다. 기존원본불변·반값·병역리셋·같은세계역할하나규칙은유지한다.

---

<!-- SOURCE: 64-EXPANSION-COMMON-CONTRACT.md -->

# 64. 확장 상세설계 공통 API·오류·검수 계약

56~63은47~54를구현가능한행동계약으로구체화한다. 본문수치D는독자게임기본안,실행통과와구분. 앱코드/SQL배포는하지않는다. 28의인증/소유권/행잠금/멱등계약유지.

## 자료형·시간

ID는문자열1~128자,revision은10진정수문자열,일반count는0이상정수. moneyMinor는통화최소단위bigint의10진문자열/통화KRW또는USD,통화혼합합산없음. probability는[0,1]유한수,능력과XP는1e-4정수단위저장(예XP2.5→25000),표시등급은정수. GameInstant={worldSeasonId,dayIndex,gameId?,playCursor?};서버UTC는작업TTL/로그에만,성장·기한·조건은게임달력. 시즌바뀌었다고실제연월일로경력을추측하지않음.

모든정의행은definitionVersion/engineVersion,소유행은saveId/ownerSubject/rowRevision를갖는다. 상태보존근거는sourceReceiptId/evidenceKey,목록cursor는안정정렬키+ID의불투명서버문자열,limit기본20/최대50. 없는데이터는null/빈목록,기록분모0비율null. 보유0과조회실패구분.

## 공통 경로

- GET /api/saves/{saveId}/expansion/{traits|repertoire|goals|agents|relationships|staff}:현재모형+allowedActions+reasonCodes.
- POST /api/saves/{saveId}/previews: {type,payload,expectedRevision}. read-only계산,세계수정/난수/예산소모0. response={previewId,sourceRevision,rulesVersion,effects,costs,odds,reasonCodes,validUntilUtc}.
- POST /api/saves/{saveId}/commands:28의{commandId,expectedRevision,type,payload,previewId?}. 응답{commandId,revision,phase,summary,eventIds,nextActions,result}. preview는행동관련스냅샷과payload hash에묶고UTC10분TTL,클라이언트값p/급여/등급은채택안함.
- GET /api/saves/{saveId}/commands/{commandId}:같은receipt조회,타인/없는명령은모두404.
- 읽기중계/연대기및개인핀/메모·내보내기는62/63의별도resourceRevision. 게임진행save revision을불필요하게늘리지않음.

일반게임변경명령은유효preview필수. 단순ACK와정보조회에는preview없음. 성공receipt가있으면preview만료/현재revision보다먼저그성공응답반환. 같은ID다른request hash는409. 새명령만인증→소유→잠금→revision→preview fingerprint→상태/조건→필요한추첨→원장+상태+receipt원자커밋. 실패확정추첨도성공HTTP200/result.outcome=REJECTED로횟수원장소모,검증오류4xx는횟수·난수0.

## 오류 코드

| HTTP | code | UI 행동 |
|---|---|---|
|401|AUTH_REQUIRED|재로그인후원래조회복귀,명령재실행은receipt확인부터 |
|403|ACCESS_REVOKED|접근정책안내,데이터상세노출없음 |
|404|RESOURCE_NOT_FOUND|타인/삭제/없는ID구분노출없이목록으로 |
|409|REVISION_CONFLICT|최신모형조회,초안유지후재preview |
|409|COMMAND_ID_REUSED|새행동인지확인,기존ID내용교체금지 |
|409|PREVIEW_STALE|조건·가격·p재표시후다시확인 |
|422|WINDOW_CLOSED / NOT_ELIGIBLE / INVALID_ALLOCATION / SLOT_CONFLICT / INSUFFICIENT_BUDGET|해당입력옆사유와해결행동 |
|422|LIMIT_REACHED / EVIDENCE_MISSING / IMMUTABLE_RECORD|남은횟수·근거·읽기전용안내 |
|429|RATE_LIMITED|retryAfter따라재시도,게임비용추가없음 |
|503|RESULT_UNKNOWN|실패라고재추첨하지않고같은commandId조회 |

오류payload는28형식+fieldErrors/allowedActions,SQL/secret/타인자료없음. 구단치트예산검사면제와실제권리/정원검사는별개. 불가능상태는reasonCode,확률은38대로실제1숫자숨김/추정표시구별.

## 화면 처리와 수용 기준

CLEAN→DIRTY→PREVIEWING→CONFIRMING→SUBMITTING→APPLIED또는REJECTED. 조회/검증실패는DIRTY로입력유지,결과불명은RECONCILING에서receipt확인. SUBMITTING/RECONCILING확정버튼잠금,조회이동가능. 뒤로가기는확정전초안폐기확인,확정후되돌리기아님. 두기기동시같은revision명령은한개만성공.

각완료된상세문서의fixture는입력/명령/기대결과/상태delta/금지delta/화면행동까지명시한다. 기계가독목록[expansion-acceptance-fixtures.json](expansion-acceptance-fixtures.json)은설계데이터,테스트실행완료가아니다. 구현자는이를기대값으로엔진·DB·API·웹/APK테스트를작성한다. 필수:정상·경계·조건불가·멱등·다른기기충돌·응답유실·원본불변·개인자료권한. 64의고정gate를충족하지않으면기능완료라고쓰지않음.

현재fixture80개/8분야작성,목표·중계사용자핵심선택해소. 서면계약작성과실행검증은STATUS에서구분한다.


장기전이오류확장:423 WORLD_TRANSITION_PENDING은동일job조회(72),503 ASSESSMENT_INCONSISTENT/INVARIANT_VIOLATION은진단과최근확정상태(67/71),422 UNSUPPORTED_BACKUP_VERSION은원본보존(70). 오류복구로추첨·비용재적용없음.


2026-10-19 사용자필수:웹·APK중단후이어하기. [76 이어하기계약](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의홈최근게임/서버resumeDescriptor/송신전저널/receipt재조회/경기·선택·작업복원과12검수시나리오를적용한다. 서버확정진행은종료이벤트와무관히보존,미송신초안은별도기기선호다. 미리보기/확정의복구는[74](74-PREVIEW-COMMAND-RECONCILIATION.md).


추가 연결: [77 전체 화면 바인딩](77-SCREEN-QUERY-COMMAND-BINDINGS.md), [78 saveId 없는 생성 계약](78-NEW-GAME-CREATION-RECOVERY.md). OWNER_CREATE는 기존 save 명령 endpoint에 포함하지 않습니다.

---

<!-- SOURCE: 65-USER-TRAITS-XP-STAFF.md -->

# 65. 사용자 추가 확정 — 특성·구종·원본 역할·보상·감상형 중계

사용자답변확정U(2026-10-16):①기록으로특성해금,보유효과모두적용②개인치트의구종숙련성장3배③같은세계동일원본은현역선수또는지도자한역할. 이전장착2/시그니처1/개인치트구종성장1배는폐기한다.

## 특성

특성해금즉시보유상태,실제효과는조건이맞는다음타석snapshot부터자동적용. 장착/해제/변경창/AI선택없음. 두시그니처를모두해금하면둘다조건평가. ‘모두적용’은만루효과가무주자에도작동한다는뜻이아니며조건충족한보유특성전체를합산한다. logit기존합산cap±.06/구종·성향포함±.10은밸런스기본안D로명시. cap은보유특성을슬롯때문에배제하는규칙이아니라최종수치제한이다. 수비/주루/교체효과는각자처리단계의cap.

## 구종

기본연간구종성장예산20XP,개인치트주인공은양의구종XP를3배,연간상한도60XP. 기본학습10+실전최대10을배분한경우치트학습30+실전최대30. 연간cap20을유지해실제로3배가막히는계산금지. 등급최대5/누적XP150/활성비율/구종4슬롯은유지. 일반·하드구종배수1,기본능력일반1.5/하드1/치트3과분리. 구단복사본에원본개인치트배수자동승계없음.

## 원본 역할

같은saveId+sourceArchiveId에는현역복사또는활성지도자하나. 다른세계재사용가능,소유원본불변. 지도자해임해도보장급여는원장에남지만활성역할은해제,그뒤현역복사투입자체는구단생성/복사허용단계규칙을따름. 아무시점에나복사버튼을새로만들지는않는다. 동시요청은원본역할claim을transaction잠금/고유제약으로하나만확정.

## 변경 반영 대상

47/56특성,S38/E85,48/57구종,33치트설명,52/61지도자,55통합,14/STATUS/보드/카탈로그/fixture. 기능추가8종자체는유지한다. 진행중구세이브는아직없으므로구현첫버전에이요구를사용하고기존구현데이터를임의덮어쓰지않음.

## 사용자 후속 확정 — 목표와 중계

U:시즌목표·도전과제보상은기념보상만유지(능력/잠재력/재화/강화/구종XP보상없음). U:중요경기문자중계는확정경기감상·스킵·다시보기,중계에서경기전/타석별전략개입없음. [58 목표상세](58-GOALS-DETAILED-CONTRACT.md)와[62 중계상세](62-COMMENTARY-DETAILED-CONTRACT.md)작성,대기결정해소. 확정된5선택이이전설계기본안보다우선한다.

---

<!-- SOURCE: 66-RETRY-CAREER-OPPORTUNITIES.md -->

# 66. 사용자 장기 플레이 결정과 재도전 경로

사용자확정U:여러해재도전기회와현실적인탈락·조기은퇴를혼합,잠재력은스카우팅으로범위를점진축소,리그는팀별전성기·암흑기자연발생. 아래기간/평가문턱은설계기본안D,현실제도재현아님. 기존‘독립훈련1회뒤무조건종료’는이문서로교체.

## 재도전 예산과 자격

careerPreparationUsed 최대3시즌(기본안),한번의미계약기간episode별현재진척보존. 고교/대학정규재학시즌은이예산미소모,현역·상무복무도미소모. 고교미지명·대학졸업미지명·프로방출/계약만료뒤미계약선수가실제독립준비시즌을완료하면1소모. 귀국의무준비기간은예산불소모이며그기간에선택형준비시즌을중복등록하지않는다. 게임최대45세와병역기한은유지,조건미달진로를가짜선택지로노출하지않음.

미계약결과→가능경로비교→선택확정→한세계준비시즌→평가→실제오퍼또는다음경로. 진행중언제든허용마감시점수동은퇴가능. 남은기회가있어도계약보장없음. 3시즌소진후유효프로/대학경로없으면최종실패정리→은퇴보관,기록·도감·연대기보존. 부상장기재활은회복기회와남은활동일표시,동일시즌을새로시작해예산초기화안함.

| 경로 | 자격 | 결과·실패 후 |
|---|---|---|
| 독립준비·국내재평가 | 준비잔여>0/나이·복무·권리유효 | 준비시즌정규48경기/월별진행→드래프트또는자유선수계약자격별평가 |
| 대학입학 | 고교학력미프로계약자/최대입학게임나이22/남은4학년을최대나이내완료가능 | 가상학교43조건,입학제안실존/학년과나이는분리 |
| 대학복학 | 조기드래프트미계약/학적유효 | 이전학년진행43,준비기회불소모 |
| 국내프로재계약 | 실제유효오퍼/보유권유효 |23계약수락,지명자격있는경우만드래프트 |
| 미국직행 | 능력기준충족/현재권리·학적허용/유효오퍼≥1 |34의카드노출계약유지,오퍼0이면카드없음 |
| 군복무/귀국준비 |21/23의기한·권리유효 | 별도필수기간,단순재도전예산으로면제안함 |
| 은퇴 | 계약·등록정리가능상태 | 원본영구보관,프로0기록도허용 |

대학입학나이는entryAge=currentAge,일반고교직후19세/독립재도전후20~22세가능. academicYear는1부터시작,19세로되돌리지않음. 프로계약체결경력이있으면대학신입경로없음. 대학학력/실제입시정보는입력받지않음. 22세기본상한은게임선택이며추후변경가능D.

## 준비 시즌의 성장·지명

정규48경기/훈련가능일/출장계수는43대학분모(PA100/outs90)공유,성적보정은독립리그D=-20. 성장·구종XP·특성·강화는세계시즌하나의원장,한시즌다중경로중복없음. 16경기강화해금/24경기유형창,기존사용기회는다시생성안함. 대표/병역중단은해당세계달력기준.

아마추어재지명예측B=.7overall+.3performanceAdjusted,34의p와라운드표유지. 이미프로였던선수는같은점수를드래프트순번으로표시하지않고구단40의동시시장평가/실제오퍼로진행. ‘몇차례준비하면무조건최저연봉’구규칙폐기. 마지막실제오퍼가소멸해도기회남음/복학가능이면그경로를남김. 경로버튼에는가능이유/소모1시즌/현재잔여/예상연령,확정참가자격을100%배지로표시안함.

## 상태·데이터·명령

UNCONTRACTED_REVIEW→PREPARATION_PRE→PREPARATION_REGULAR→PREPARATION_RESULT→ROUTE_REVIEW또는RETIRE_DECISION. episodeId는미계약발생receipt마다새ID,careerPreparationUsed는평생누적. preparation_periods(saveId,playerId,worldSeasonId UNIQUE,episodeId,start/endDay,usageCharged,evidenceReceipt),career_route_opportunities(playerId,routeId,reasonCodes,offerRefs,expiresGameDay),collegeEnrollment.entryAge추가.

GET /api/saves/{id}/career-routes?playerId→{routes,preparation:{used,remaining,consumesNextSeason},rights,militaryTasks,ageAtCompletion}. START_PREPARATION={playerId,episodeId,seasonId,routePreviewId};ENROLL_COLLEGE는entryAge서버계산. 예산0은422 LIMIT_REACHED,권리불가422 NOT_ELIGIBLE,오퍼변동409 PREVIEW_STALE. 준비완료소모와연간성장/기록정산동일transaction,통신재시도usage증가0.

## 검수 기대값

RETRY01 used0→준비완료1/02동일완료재시도1유지/03복무18개월준비소모0/04프로경력대학입학불가/05대학20세입학후학년1·나이20/06used3·오퍼0·복학불가은퇴가능/07예산남아도미국오퍼0카드없음/08기존강화사용뒤독립진입재강화불가/09마지막오퍼거절후남은준비경로/10원본보관및군기한유지. 경로도달성과재도전재미는구현후시뮬레이션검증.

---

<!-- SOURCE: 67-POTENTIAL-ASSESSMENT-PROGRESSION.md -->

# 67. 잠재력 스카우팅 정보의 점진 공개

사용자확정U:일반/하드잠재력은스카우팅으로점점좁아지는범위. 개인치트주인공은잠재력100고정공개유지. 실제P는생성/복사시서버에서고정,평가를새로고침한다고P를다시뽑지않는다.

## 평가 대상과 갱신

현재능력6개는정확표시,잠재력은능력별[L,U]와전망문구. 최초reportStage0,등록소속팀정규20경기경과마다최대1단계상승,최대4. 이적/승강/대회이동은누적평가진척과기존범위를유지,팀변경일의전후게임구간만분할해중복누적없음. 복무일반현역/무등록기간은관측경기0,대학/상무/독립준비실제등록팀경기는관측가능. 오래쉰선수에게시계시간만으로평가가자동좁아지지않음.

커리어본인은평가조회무료,관측20경기가지났을때서버진행정산으로reportStage확정,조회/버튼연타로stage증가없음. ownEffectiveLevel=min(5,2+floor(완료프로등록시즌/2)),프로미진출은2. 구단타인은시설+직원유효레벨40/61,선수발견이후관측stage를누적한다. 구단유료탐색성공p는‘발견’의확률이며전망적중률을추가추첨하지않음.

## 범위 계산과 누적 신뢰

baseWidth(L1~5)=[20,16,12,8,6],w=min(100-A,max(2,baseWidth-2×stage)). A는현재영구능력,P는고정진짜잠재력. 고정seed(playerSimulationKey,abilityKey,assessmentModelVersion)에서z∈[0,1]1개,rawLow=clamp(P-z×w,A,100-w),rawHigh=rawLow+w. 새표시범위는기존확정범위와raw범위의교집합,다시[A,100]과교집합. 진짜P가반드시포함되므로정상데이터에서공집합없음. 공집합이면ASSESSMENT_INCONSISTENT읽기오류,새P생성/기존범위확대금지.

내부1e-4,화면하한floor/상한ceil로바깥반올림해P를거짓배제하지않음. 표시폭이그대로면‘관측자료갱신,표시범위변화없음’,거짓으로정밀해졌다고쓰지않음. 새로운저레벨구단으로이적해도이전확정정보를잊어범위를넓히지않음. 예기존[82,94]/새raw[85,93]→[85,93],다음[84,95]가와도[85,93]. 같은레벨재열람은동일보고서.

현재A가99이면미래P가능범위[99,100]처럼2보다좁아질수있고A100이면[100,100],물리적경계의정확함을숨기려거짓범위만들지않음. 치트P100은범위평가를우회한확정능력숫자이며강화성공률100숫자숨김정책과별개.

## 사용처와 자동 의사결정

화면평가/스카우트AI의전망점수는표시범위중앙값,숨은P로영입성공/연봉을AI만유리하게계산하지않음. 성장엔진만실제P로상한처리한다. 현재A가표시범위하한보다커지면새보고서없이도이미확정사실A를반영해하한올림,stage기회소모없음. 잠재력에닫힌성장은‘현재 전망 상한에 가까움’같이확정하지않은문구로설명,일반클라이언트API에rawP누출안함.

원본archive도일반선수는공개범위와내부보존P분리. 구단복사잠재력새설정은서버내부P사용,화면은새playerId의stage0보고서. 원본정밀보고서가복사본의새P범위를증명하지않으므로그대로복사안함. 치트원본잠재력100공개는원본출처,일반구단복사본도계산상P100이면보고서정책을따르고치트프리셋자동적용안함.

## 데이터·API·화면

assessment_progress(saveId,playerId UNIQUE,observedTeamGames,stage,lastSettledCursor),ability_assessments(playerId,abilityKey,version UNIQUE,lowUnits,highUnits,stage,level,evidenceSpan,createdGameInstant),assessment_public_summaries(playerId,abilityKey UNIQUE,currentLow/currentHigh,version). rawP/seed는API응답제외,서버정의버전고정. 저장된보고서원장으로새로고침시점차이불변.

GET expansion/assessments?playerId→{mode:RANGE|FIXED_CHEAT,abilities:[{abilityKey,current,potentialRange?,fixedPotential?,outlook}],stage,nextObservationGames,reportHistoryCursor}. 읽기권한만,paid확률preview없음. 기록갱신명령은공통일진행내부hook,client SET_POTENTIAL/REFRESH_FOR_BETTER_ROLL명령없음. 보고서확정receipt재처리version증가0. 정보없음은평가대기,실제범위0~0으로표시안함.

S16능력행잠재력셀/ S36스카우트보고서/ S39숙련과별도:‘잠재력 85~93 · 관측3단계 · 2031시즌평가’/‘다음갱신까지12팀경기’. 독자도움말에범위는성공확률아님을명시. ASSESS01 교집합단조축소/02이적저레벨확대0/03관측19→20stage1/04재조회rng소비0/05A100범위100/06일반rawP응답없음/07치트100표시/08복사보고서초기화/09보고서불일치안전오류/10AI범위중앙값사용.

2026-10-19 사용자추가확정:강화정확증가량·비용우선(75). 스카우팅범위는유지하되실제효과로상한추론가능함을허용,개별행동snapshot과원본P필드공개는분리한다.

---

<!-- SOURCE: 68-FRANCHISE-CYCLES-LEAGUE-HISTORY.md -->

# 68. 자연스러운 구단 전성기·암흑기와 장기 리그

사용자확정U:팀마다전성기·암흑기가자연발생하는세계. 승패뒤에서확률을조작해평준화하거나특정구단을강제로왕조/약체로정하지않는다. 44동일기본예산/실제선수성장·노쇠·계약·역순드래프트를사용한다.

## 변화의 원인과 금지된 보정

초기리그seed는생성공정성검사만,구단별선수초기연령·계약기간차이와드래프트결과는이후그대로진행한다. 시즌끝에평균능력을리그평균으로맞추거나우승팀능력-5/꼴찌성공률+20%를붙이지않음. 신인/FA/외국세계공급은팀취향을보기전에고정seed로생성,사용자팀필요포지션에맞춰스타를새로만들지않음. 역순드래프트는기존공개회복장치이며자동역전보장아님.

전성기는성장한주전동시전성기/좋은계약/유망주정착/수비·투수조합,침체는노쇠/부상/불리한보장계약/졸업·군복무공백/지명실패에서발생한다. 동일예산이라도장기다년계약의미래여유차이가남아야한다. 사용자복사선수/구단치트효과는정해진구단에만적용,타팀추격버프없음.

## 구단 운영 철학

구단마다strategyId=DEVELOPMENT/BALANCED/CONTEND를초기seed로고정선택,매시즌첫검토때상태로전환. 철학은능력보정이아닌돈/자리배분평가가중치. 공석NeedScore100은어느전략에서도선행충족,선수최소정원/계약예산불변.

| 전략 | 역할개선/전망/필요자리 가중 | 계약 경향 |
|---|---|---|
| 육성 |.4/.4/.2 | 25세이하동점우선/신인기용/장기보장최대3년권고 |
| 균형 |.6/.2/.2 |44기본평가/최대4년 |
| 우승도전 |.7/.1/.2 | 즉시roleScore개선우선/고령계약2년권고 |

전략전환조건은이전정규최종순위상위3+주전평균나이≤32→CONTEND,최근2년하위3또는주전평균나이≥33→DEVELOPMENT,그외BALANCED. 최초한시즌자료부족시seed초기전략유지. 주전코어는수비8자리+DH각선발경기최다1명(같은선수중복시다음후보),SP선발등판상위5명/RP구원아웃상위3명/CP세이브상위1명의최대18명고유집합. 동률simulationKey,빈자리는현재건강한해당roleScore상위후보. 코어개인출장가중치는야수선발경기/투수등판수로각양의분모,0출장은1로하며전체가중평균나이를계산한다. 전환은오프시즌1회,3일연패로수시로스터를뒤집지않음.

장기보장기간권고를어겨야필수공백이해결되면정상예산내예외가능,이유기록. FA제안40의선수수락분포는모든팀동일,전략이계약성공확률을직접가산하지않음. AI는67공개전망중앙값,숨은P정답안봄. staff효과와급여61은실제원장반영.

## 연대기·정보 화면

franchiseSeasonHistory에는순위/승률/득실/주전평균나이/평균종합/급여·보장/신인1군기여/복무·부상일/주전이탈/FA성과/전략을해마다확정저장. ‘전성기’표시=최근3시즌중2회PS진출AND승패있는시즌평균승률≥.55,‘암흑기’=최근3시즌모두하위3. 첫3시즌전에는평가중. 라벨은설명용읽기모형,보상·능력·팬재화효과0.

‘세대교체’는기존주전핵심5명의시즌대비대체율≥.4,해당선수·계약·부상근거로서술. 몇연패했는지보다왜전력이변했는지를S18리그역사/S13구단리포트에보여준다. 타팀의내부rawP/개인친구세이브노출없음. 기록이없는연도는0승률로꾸미지않고null.

## 갱신·저장·검수

strategyDecisionKey=(clubId,nextSeasonId),historyKey=(clubId,seasonId),duplicate처리0. 세계연도전이72에서모든10팀동시준비/검증후활성화,사용자팀만새해선수단을받지않음. 연봉/나이/보장계약/유망주는이전행에서전이하고전구단선수재생성금지. 파산구제는최소로스터안전제도만,우승용지원없음.

DYNASTY01 우승후숨은감소0/02꼴찌확률버프0/03세대교체ID연속/04보장급여손실유지/05전략전환연1회/06정보라벨기록근거/07공급seed사용자필요독립/08동일금액동일수락식/09치트타팀전파0/10연도전이중단후중복신인0. 50/100시즌기록에서왕조·침체양상은측정하되‘모든팀이반드시우승1회’같은강제합격기준을두지않는다.

---

<!-- SOURCE: 69-EVENT-COLLISIONS-PROVISIONAL-STATE.md -->

# 69. 사건 충돌·복귀·경기중 임시 상태 처리

19/21/23/56~64를실행순서로교차정리한다. 사건중복을피하려규칙효과를삭제하지않고같은source를한번만처리한다. 게임날짜가같아도서버커밋순서가유일하며UI모달순서로세계순서를바꾸지않는다.

## 세계일 처리 순서

미완료pendingGame이어가기→당일경기전만료계약/복무·차출등록검사→라인업·등록유효성→세계동일날짜경기→경기최종commit→부상/통계·구종XP·특성/목표·관측정산→경기후경력·국가대표·복무후속→요구선택queue→당일마감→다음일. 같은날명령연쇄는sequenceNo로정렬,동일event priority는source발생순→eventId. 기한은‘해당게임일마감전’기준,날짜넘김직전미해결필수선택검사.

queue는taskId/sourceEvidenceKey/type/deadline/resumeContext/status. 단하나active blocking task,나머지는유효한queue. source가사라지면CANCELLED_WITH_REASON,스스로새세계일로무한순환하는resume금지. resumeContext={saveId,worldSeasonId,phase,competitionId,registrationId,sourceRevision},대표/복무복귀는이context가가리키는기간이이미끝났으면현재합법phase resolver를사용하고과거일정재실행안함.

## 충돌 처리표

| 동시 상황 | 원자 처리와 사용자 행동 |
|---|---|
| 부상과첫대표차출 |경기부상확정후출장자격재검사,차출참가가불가하면사유/대체명단,대표탈락으로능력패널티없음 |
| 같은경기특성+목표+이정표 |경기통계한번→각unique근거정산→결과알림묶음,능력/보상재지급없음 |
| 특성해금과같은경기후반 |해금은경기최종commit후,그경기타석에소급효과없음 |
| 구종등급업과pending청크 |GameState.provisionalPitchBook/seasonBudgetDelta에보존,다음타석등급계산에사용하되세계book/XP원장은최종경기commit때한번반영 |
| 은퇴확정과미진행다음경기 |은퇴가능phase와계약정리우선,이미최종경기commit한기록만원본에포함,스케줄상의예정경기를자동승리로지우지않음 |
| 국제자격확정과미시작입대 |개인자격/실제복무규칙21검사후미확정입대task대체,이미복무시작receipt를취소해과거를바꾸지않음 |
| 포스팅계약과국내재계약 |같은player계약권리잠금,최초유효커밋1개,다른preview409후원제안취소/예약해제 |
| 해외오퍼조회와대학선택 |조회효과0,대학입학또는해외계약확정때배타route닫힘,오퍼조회이력으로대학카드숨김금지 |
| 조기미지명과복무기한 |복학자격보존하되복무의무우선,학년동결/나이진행,준비66소모없음 |
| 강화사용과리그이동 |worldSeasonId사용원장하나,새리그해금체크포인트로기회재생성없음 |
| 지도자고용과원본복사 |61rootSource claim한개,승인된한요청만commit,실패요청급여/선수생성모두0 |
| 재도전완료와나이45 |해당시즌완료기록보존후다음진로예상나이검사,46세일정강제생성없음 |
| 에이전트역제안과기한마감 |deadline마감sequence보다앞선유효명령만,기한경과는추첨없음/사용기회미소모 |
| 스카우트관측과이적 |당일정규등록팀경기관측키(playerId,gameDay)고유,두팀20경기분모를동시에가산하지않음 |
| 목표완료와기록정정 |완료evidence버전이력,기념보상유지/표시CORRECTED,이미경기결과를다시추첨하지않음 |

## 경기중 상태와 취소

GameState의provisionalStats/XP/기록evidence는청크커밋안전저장되지만공식커리어누적과구분. 경기완료transaction에서provisionalDelta→world원장applyKey(gameId,deltaType)로전환,두개동시에합산안함. checksum/rngCursor/saveRevision이맞지않으면이어가기중단/진단,공식결과없는경기를완료로표시안함.

일반사용자는pendingGame을취소해좋은결과가나올때까지재추첨할수없음. 복구는동일snapshot/stream으로재실행,자발적캐릭터삭제/새세이브는기존보존정책. 내부엔진불변조건위반은71에따라안전중단,사용자클라이언트가점수/XP를임의수리하지않음.

## 데이터·API·검수

blocking_tasks(saveId/taskId UNIQUE,sourceKey,type,priority,deadlineGameInstant,resumeContext,status),day_settlements(saveId/dayIndex/settlementType UNIQUE,receiptId),game_provisional_ledgers(gameId/deltaType/entityId UNIQUE,delta,stateVersion,appliedAtFinalReceipt?). pending경기이어가기는기존진행명령/receipt조회,새CONTINUE는현재pendingContextVersion확인필수. error=409 RESUME_CONTEXT_CHANGED/422 BLOCKING_TASK_PENDING/503 INVARIANT_VIOLATION,허용다음행동만반환.

COLLISION01 구종XP중간등급업최종1회/02특성같은경기소급0/03복무후학년복귀/04지도자·복사동시성/05두계약1개/06당일입대·차출정리/07오래된resume과거경기실행0/08등록관측중복0/09에이전트마감추첨0/10강화세계시즌1회. 구현후일정경계에동일사건을인위주입해table-driven검증한다.
오프시즌운영후속: [115](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md)의추천순서/실제기한구분·드래프트같은차례복구·FA예약/마감·병역/만료·미래보장108억원예시를함께읽는다. 기존도메인순서·권리·단일연도전환은유지한다.

## 2026-10-20 구현 연결 기준 D — 경기 후 부상과 최소 충원

부상 추첨은 실제 출장자에게 경기당1회다. 피로80초과는 기본0.15%의2배다. 구현 위험도 snapshot은69의 경기 후 처리에서 해당 경기 출장 피로를1회 반영한 값으로 고정한다. 같은 경기 재처리는 다시 추첨/회복하지 않는다. 진단한 경기는 회복 기간에서 제외하고 이후 등록 팀의 실제 경기만3~7/8~30경기를 줄인다. 중상은 해당 시즌 마감 시 해제하며 경증/중등도 잔여는 임의 일수 경과로 지우지 않는다. 회복 결과 근거는1회만 만들고 실제 복귀 사건 발행은 세계 처리에서 연결한다. 초기 구현은 경기 후 진단이며 타석 중 부상 교체를 구현했다고 간주하지 않는다.

고교 부상 최소 임시 충원은14의 사용자 승인과 구현 기준을 따른다. 임시 선수 해제 후에도 공식 기록의 선수 참조는 보존한다. 기본25명 생성 검사는 그대로 유지하고 진행 중 로스터 검사는 별도로 적용한다.

---

<!-- SOURCE: 70-BACKUP-RESTORE-IDENTITY-COMPATIBILITY.md -->

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 백업·복원과 archive는 던지는 손·타석·투구폼을 선수 정체성 필드로 포함해 보존한다.

# 70. 백업·새 세이브 복원·버전 호환 상세

29의새saveId복원/10자동·10수동백업을유지한다. 백업을복원하며행ID를바꿨다고pending경기의난수·원본참조·중계해시를잃지않게정의한다. 실제migration코드나원격복원은이번설계에서실행하지않는다.

## 식별자 3종

rowId는DB외부참조식별자,simulationKey는세이브내엔진의불변논리ID,originRef는원본출처다. 생성처음에는rowId와다르게고정simulationKey부여. RNG stream/game resultHash/동률게임판정은ownerSubject·물리rowId가아닌simulationKey와고정rulesVersion으로계산한다. 같은Key는같은save내유일,다른복원세이브에서는허용. 원본은퇴archiveId는불변개인보관식별자.

복원시새saveId/rowId발급,simulationKey/논리경력/시계/모든rngState는보존. idMap=(restoreJobId,entityType,oldRowId,newRowId,simulationKey)고유. pendingGame명단/베이스주자/책임투수/계약/학적/resume/sourceclaim등모든가변FK를map한다. immutable중계chunk는원당시snapshot/논리키와hash그대로,restoreAlias를통해현재선수정보링크만해석. 옛고정로그의playerId문자열을바꿔checksum을깨지않음.

예S1/P1/G1→S2/P2/G2,simulationPlayerKey SP1/simulationGameKey SG1유지. 이어지는타석의같은입력·동일선택이면같은논리결과. 두세이브가이후다른선택을하면다른결과가정상,복원후미래가무조건같다고보장하지않는다. 이미확정된경기의originResultHash는재생성하지않음. rowId를엔진동률기준으로쓰던구스키마는engineIdentityVersion변환계약없이는resume불가/읽기복구안내.

## 백업 묶음

manifest={backupId,sourceSaveId,sourceRevision,schemaVersion,rulesVersion,engineVersion,identityVersion,createdGameInstant,contentHash,sections:[{name,count,uncompressedBytes,sha256}],attachmentRefs}. sections는world/players/contracts/rosters/schedules/records/ledgers/pendingGames/assessment/traits/pitches/goals/relations/staff/tasks/rng/retirementRefs. 읽기위치·핀·메모는optionalPreferences분리,인증세션/refresh/호스트secret없음.

sourceRevision고정snapshot을DB읽기일관성트랜잭션으로확보→업로드는세계lock밖→checksum/길이/필수section검사→READY. 동시에게임진행이계속돼도snapshot내용은안바뀜. snapshot freeze실패는백업재시도,현재게임삭제없음. 압축해제총10MiB기본한도초과는ZIP폭탄같은파일을거절하고정상대용량에대해서는서버관리형snapshot확장정책으로분리,제한회피로통계삭제안함.

## 복원 작업 상태와 순서

REQUESTED→VERIFYING→TRANSFORMING→STAGING→VALIDATING→READY→ACTIVATED또는FAILED. ownerSubject검사/backup READY→hash·section·version·크기검사→idMap고정→지원변환vN→vN+1순수단계→새world/staging행작성→71불변조건→sourceRoleClaims새save내재구성→active save노출. 활성세이브10개한도는복원미리보기에서슬롯정리안내,기존원본게임자동삭제없음. job재시도는같은idMap/targetSaveId/seed사용.

모든원장/evidence는백업의진행완료상태를보존,그자료를초기화해강화/목표/재도전기회를다시받지못함. 단API command_receipts는새save에복사하지않고sourceReceiptAlias를명령근거로보존,기존실행명령재전송시‘이백업에서이미반영된행동’인originActionKey를domain원장이차단. 새행동은새commandId,이미완료된source를다시추첨하지않음.

## 원본·파일·실패

복사선수의starting/peak/새P/기록은백업자체보존,sourceArchive가없어도현역운영가능. 소유원본이존재하면originRef연결검증,없거나타인원본이면개인정보연결을제거하고‘출처상세없음’,원래snapshot출처요약만. 이미은퇴완료sourceArchive가같은owner/hash로있으면재사용,있는데hash다르면RESTORE_ARCHIVE_CONFLICT/원본덮어쓰기없음. sourceclaim은rootSource 논리참조를새save에서만생성,옛save claim삭제안함.

중요로그/연대기첨부는immutablecontentHash와owner reference검사,임시PNG재생성가능파일은복원필수아님. 파일없음이면게임불변조건과별개의attachment DEGRADED상태/요약읽기,공식기록을빈값으로만들지않음. 필수pendingGame state/hash누락은복원불가. staging실패는기존save/READY백업무변경,미노출staging만job소유확인후청소.

## API·검수

POST /api/restores/preview={backupId}→{supportedVersions,targetSlotAvailable,estimatedRows,attachmentsStatus,blockingReasons};POST /api/restores={restoreRequestId,backupId,backupHash,displayName,previewId};GET /api/restores/{jobId}→{status,targetSaveId?,warnings,failedStage?}. 같은requestId다른backup409,불가version422 UNSUPPORTED_BACKUP_VERSION,hash503 BACKUP_INTEGRITY_ERROR,상한422 SAVE_SLOT_REQUIRED. 원본overwrite모드는없음.

RESTORE01 새물리ID/논리ID·rng동일/02pending다음타석동일/03강화usage1유지/04재도전used유지/05중계원hash불변/06실패원게임·백업무변경/07sourceArchive없어도복사운영/08타인archive참조제거/09완료원장중복실행0/10활성10개자동삭제없음/11같은job같은map/12원본hash충돌정지. 실제파일/DB FK/개발브랜치복원/E2E는구현후필수증거.

---

<!-- SOURCE: 71-INVARIANTS-DIAGNOSTICS-SAFE-STOP.md -->

# 71. 세계 불변조건·진단·안전 중단 계약

불변조건은정상적인패배/방출/적자를막는규칙이아니라손상된세이브전이를차단하는서버검사다. 명령영향범위검사는매commit,전체세계검사는시즌전환/복원에서실행. 실제구현테스트통과아님.

| ID | 검사 | 실패 시 |
|---|---|---|
| INV01 | 종류별정확6능력키/영구A·P1~100/P≥A/유한정밀도 | 게임변경rollback |
| INV02 | overall=영구6개평균/일시효과미포함 | 파생값재계산후차이진단 |
| INV03 | 선수동일세계일실제출장1경기이하 | 일정/기록commit차단 |
| INV04 | 선수ACTIVE유급계약≤1/정지계약은권리원장일치 | 계약전이차단 |
| INV05 | 한팀타순9중복0/필수수비자리/투수정원 | 경기시작차단·정리경로 |
| INV06 | 팀R=개인R합=상대책임투수R합 | 경기최종commit차단 |
| INV07 | 팀H=개인H합/타자K=상대투수K/AB=PA-BB-HBP | 경기최종commit차단 |
| INV08 | outs정수/합법3아웃/자동주자R포함·ER제외 | 경기최종commit차단 |
| INV09 | 타석p각[0,1]/softmax합1(허용오차1e-12) | 추첨전차단/rng불소모 |
| INV10 | 세계시즌강화usage0/1/원장근거고유 | 강화/정산차단 |
| INV11 | 구종2~4활성/weight합100/등급0활성0/정의버전일치 | 구성/경기시작차단 |
| INV12 | 구종baseGranted+reserved≤20/actualGranted≤20m/중복XP0 | XP정산차단 |
| INV13 | 특성해금행고유/정의조건evidence존재/전체보유조건평가 | 특성정산차단 |
| INV14 | 목표·도전기념보상gameplayDelta0/보상ID계정고유 | 보상정산차단 |
| INV15 | scope별통계혼합0/교차리그recordKey고유 | 집계정산차단 |
| INV16 | 급여gross=fee+net/paid·reserved·보장동일채무중복0 | 금전명령차단 |
| INV17 | 역할claim(saveId,rootSource)당활성1/직무슬롯 | 복사/고용차단 |
| INV18 | 원본snapshot hash불변/출처쓰기권한없음 | 원본변경차단·경보 |
| INV19 | 미해결task필수source/resume가현재세계에속함 | 날짜진행차단·복귀resolver |
| INV20 | pending경기provisional delta와최종원장동시가산0 | 경기finalization차단 |
| INV21 | 재도전used0~3/준비완료키고유/복무기간불소모 | 경로정산차단 |
| INV22 | 현재공개요약범위A≤L≤P≤U≤100/이전공개범위보다확대0(역사보고서는당시A기준) | 평가모형중단·구보고서유지 |
| INV23 | 모든활성팀/계약/등록/일정의activeGenerationId일치 | 연도활성화차단 |
| INV24 | simulationKey save내유일/복원rng보존/중계immutablehash검사 | 복원활성화·재생차단 |

INV02같은결정론읽기파생값만재계산가능,원시능력/성적/돈/권리/seed자동수리금지. INV05정상적부상으로명단부족이면손상경보가아니라44정리화면,정리완료전경기불가. availableBudget음수는기존보장채무때문일수있으므로NaN/Infinity/중복채무와구분하고재건경로를제시한다.

## 오류·진단 자료

client오류{code:INVARIANT_VIOLATION,requestId,invariantIds,phase,lastCommittedRevision,allowedActions:[READ_LATEST,READ_RECEIPT,EXPORT_DIAGNOSTIC_REQUEST]}서버내부행/연결문자열/원잠재력값은노출안함. serverdiagnostic에는rules/engine/schemaVersion,simulationKeys,source/targetrevision,검사전후checksum,stage,예외타입,관련명령hash만. 사용자토큰/secret/개인친구데이터/서명URL로그금지.

실패한명령은공식세계state rollback,같은transaction의RNG진행/원장/receipt성공행도rollback. 이미pending청크로확정된부분은보존하고finalization단계만실패상태표시. 읽기가능최근revision을제공,새명령으로다른결과가나올때까지재추첨하는복구버튼없음. 운영자가수정해야하면별도개발복사본에서원인재현→호환수정정의→사용자세이브보존후적용계획,운영전체리셋금지.

## 검증 분류와 도구 계약

검사함수는읽기전용report={scope,checkedRevision,checks:[{id,status:PASS|FAIL|NOT_APPLICABLE,evidenceRefs}],reportHash}. 클라이언트자가진단은서버결과표시만,일반사용자가raw검사파일로실제P를열람하는API없음. 개발fixture는각조건의최소반례와정상경계를주입하고바로앞단계의rng/원장손상여부를비교한다.

INV-D01 만루자동주자득점R1/ER0정상/02p합1.0001차단·rng0/03overall일시buff미반영/04중복salary채무차단/05연도generation혼합차단/06미관측평가범위확대차단/07특성보유전체조건평가/08불변원본hash/09투수0가용은정리행동/10실패transaction게임·원장·RNG동시rollback. 완전세계검사는비동기준비가능하나검사통과reportHash없이는72/70활성화불가.

---

<!-- SOURCE: 72-WORLD-YEAR-TRANSITION.md -->

# 72. 세계 연도 전환의 단계별 준비·원자 활성화

10개국내팀/미국조직/대학/독립준비/복무선수의같은세계달력을함께넘긴다. 날짜하루진행과달리연도전환은큰준비작업을나눠저장하되사용자에게반쯤새시즌인세계를노출하지않는다. 구현전계약이며production일괄변경실행없음.

## 시작 가능 조건

현재세계경기·국제·PS최종완료,수상/성장/노쇠/강화포기확인/병역기한/현재계약·포스팅·FA·드래프트의필수사용자선택마감,미해결pendingGame0,필수task0. 다음시즌을결정해야하는선택이남아있으면그화면으로보내고job이대신계약/은퇴/입대선택안함. 구단100시즌한도/선수다음나이초과는마지막안내·읽기보관경로,넘길수없는시즌을억지생성안함.

NEXT_SEASON확정에sourceRevision/activeGenerationId/targetSeasonId를고정,yearTransitionId unique(saveId,targetSeasonId). 시작때save의writeGate=YEAR_TRANSITION,일반변경명령은423 WORLD_TRANSITION_PENDING(64오류확장)/조회·receipt·진행상태확인허용. 같은요청재시도는기존job,두기기다른요청도동일target으로job2개생성안함.

## 상태와 단계

REQUESTED→PREPARING→VALIDATING→READY→ACTIVATING→COMPLETED,실패는FAILED_RECOVERABLE또는FAILED_BLOCKED. old active generation은COMPLETED전까지현재세계원본. 각staging단계는stepKey/입력hash/출력hash/checkpoint를남기고같은키재시도기존출력재사용.

| 단계 | 입력·처리 | 중복 방지 |
|---|---|---|
|Y01|source영구기록/시즌·성장원장마감검사/변경불가snapshot|settlement키로재성장0 |
|Y02|나이+1/병역·학적·계약이월/사망모형없음|targetSeason/playerId고유;같은출력age사용 |
|Y03|모든조직정원/부상회복상태/계약보장·staff예산이월|행별sourceVersion확인 |
|Y04|선수공급/FA하한/후보source이월|rookieBatchKey(targetSeason,region),오프시즌이미생성분재사용 |
|Y05|스케줄·국제창·대학·독립준비일정준비|scheduleSeed/버전고정,관측일중복검사 |
|Y06|68 AI전략/기용기본안/예산검사/전망정보이월|팀별strategyKey,숨은P사용없음 |
|Y07|연도시작원장/새강화usage/기회창생성|season별0새원장,이전소모이력유지 |
|Y08|71전체불변조건/정원·경기수·파일참조검사|reportHash/sourceHash결합 |

성장/노쇠는이미전년도마감에서처리한값을Y01에서검사만,새해나이증가와동시에다시가산/감산안함. source에미완료정산이있으면차단해원단계복귀,job이매재시도예산다시적용안함. 대학복학학년/준비used/잠재력관측범위/구종XP성숙등은이월,새해계정이아니므로초기화안함.

## 활성화와 실패

READY는완료reportHash를확보한상태. 짧은행잠금transaction으로sourceRevision/activeGenerationId/writeGate/job상태를재확인→activeGenerationId를target으로교체→worldSeasonId/phase=각합법PRE단계/rngState참조갱신→jobCOMPLETED/receipt/새revision커밋. 전체선수와계약관계는generation참조로같은순간활성,1팀씩업데이트가시화금지. 읽기API는단일activeGeneration snapshot으로조회한다.

PREPARING장애는기존세계를읽기가능,재시도같은job/seed. VALIDATING실패는source영구자료무변경,진단report와복귀가능행동제시. source불변이고아직활성화전이면CANCEL_YEAR_TRANSITION으로staging참조만폐기하고old gate해제가능,다음재시작도같은대상시즌고정seed/공급batch재사용(취소로재추첨불가). 활성화후취소불가,기존백업새세이브복원70으로분리.

worker lease=jobId+stepKey+leaseVersion,시간만료후다른worker가이어받아도출력고유키동일. 원격파일upload와길이큰통계는행잠금밖. 고아staging청소는job소유/참조0/실패완료상태확인뒤만,원본기록/보관archive/activegeneration청소금지. 사용자에게정확하지않은전체퍼센트를만들지않고‘나이·계약이월 10/10팀’같은현재단계진척만표시.

## 데이터·API·검수

year_transition_jobs(saveId,targetSeasonId UNIQUE,sourceRevision,sourceGeneration,targetGeneration,status,currentStep,sourceHash,validationHash,leaseVersion),year_transition_steps(jobId,stepKey UNIQUE,inputHash,outputHash,status),world_generations(saveId,generationId UNIQUE,status,sourceGenerationId),rookie_batches(saveId,seasonId,region UNIQUE,seedKey,playerSimulationKeys). immutable이전기록은generation별중복복사대신참조,현재행은copy-on-write.

POST /api/saves/{id}/commands type=NEXT_SEASON,payload={targetSeasonId},previewId필수→{outcome:PENDING,jobId};GET /api/saves/{id}/year-transitions/{jobId}→{status,step,unitProgress,retryable,activeGenerationId};RETRY_YEAR_TRANSITION/CANCEL_YEAR_TRANSITION={jobId,expectedJobVersion}. pending성공receipt가있는NEXT_SEASON은같은job반환,job완료조회에서최종revision제공.

YEAR01 중간worker중단뒤age증가1/02신인batch1/03원세대최종까지읽기가능/04활성세대전팀동시/05전년도성장중복0/06미해결필수선택시job0/07취소재시작seed동일/08lease동시두worker효과1/09이전reportHash로새source활성화거절/10대학·준비·관측·원본참조이월. 100시즌경계와강제장애각단계실험은구현후73의게이트.
오프시즌운영후속: [115](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md)의추천순서/실제기한구분·드래프트같은차례복구·FA예약/마감·병역/만료·미래보장108억원예시를함께읽는다. 기존도메인순서·권리·단일연도전환은유지한다.

---

<!-- SOURCE: 73-LONG-RUN-FAULT-BALANCE-VALIDATION.md -->

# 73. 장기 시뮬레이션·고장 주입·밸런스 검증 설계

이문서는실험을실행한보고서가아니라구현후수행할재현계획이다. 기능추가로숫자를임의조정하기전에불변조건/기록/분포의어느층에서문제가발생했는지구분한다. 검증설계와실제게임테스트통과를혼동하지않는다.

## 실험 매트릭스

| ID | 입력·규모 | 주요 비교 |
|---|---|---|
| L01 | 타자8유형×일반/하드/치트×고정100seed | 진출/출장/성장/은퇴분포 |
| L02 | 투수6유형×3난이도×100seed |6능력·구종XP/보직/부상/노쇠 |
| L03 | 동일GameInput10만타석·원소하나변경대조군 |softmax/조건특성·구종/효과방향 |
| L04 | KBO10팀50시즌×10seed,보관0명 | 계약/선수공급/자연왕조·침체/구단비용 |
| L05 | 같은세계보관복사0/1/28명비교 | 원본hash/역할claim/리그왜곡을사용자설정효과로구분 |
| L06 | 구단치트50시즌×5seed |유한원장/정원/퇴단P수혜출처/소속기간성장배율 |
| L07 | 세계시즌99→100/종료경계 |읽기보관/통계·원본삭제0 |
| L08 | 성장상한6개100/모두1/잠재력여유1e-4 |clip/분배/허위상승0 |
| L09 | 연도전환각8단계worker종료/lease만료/응답유실 |효과1회/old generation보존 |
| L10 | 대표·복무·대학·해외·재도전달력충돌seed100 |복귀/예산/출장동시성 |
| L11 | 같은snapshot백업복원후같은다음10명령 |simulationKey/RNG/논리결과동일 |
| L12 | 중계1/2/4배·스킵/되감기·PNGexport반복 |게임resultHash/원장변화0 |

seed집합은버전고정JSON목록、실험ID·engine/rules/schema/definitionVersion·소스커밋·입력hash·하드웨어/런타임·startedAt/endedAt기록. 실험실패seed를목록에서삭제하고새seed로통과시키지않음. 월별/빠른시즌은동일seed쌍실험,읽기편의설정은결과독립.

## 필수 합격과 검토 지표

HARD:71불변조건위반0,중복활성계약/원본역할/선수출장0,정산중복0,재시도동일receipt,원본hash변경0,명령검증실패RNG소모0,중계읽기세계변화0,연도generation혼합0,복원신뢰성. 하나라도실패하면성적분포가그럴듯해도배포검증불합격.

REVIEW:리그평균타율/OPS/ERA/HR율/K율/BB율/득점·9이닝,연령별성장·상한도달나이,초기유형별진출률·미지명률,재도전횟수별계약/은퇴,평균계약금액·미래보장·재정지원·유망주기용,전성기/암흑기기간·연속우승·팀승률분산. 41의타율.220~.300/ERA3~6/HR율.015~.055는경보대역,공식현실수치인증아님. 작은표본의우승수차이를버그로단정하지않음.

프랜차이즈성적은모든팀우승한번/10팀동일승률을합격조건으로쓰지않음. 재정지원팀연도>5%/긴급대체인력급증/FA80명하한상시충원은경제·공급검토경보. 초반합리적차이를없애려타팀능력을몰래평준화안함. 치트원본28명의강세는의도효과가능,정원/기록손상과구분.

## 통계와 고장 주입

비교는같은seed쌍의지표차이,평균/중앙값/p10/p90/표본수/95%bootstrap구간(고정통계전용seed)보고. 경기엔진PRNG와통계bootstrapPRNG분리. 효과0에가깝고CI가넓으면‘증거부족’,억지성공판정안함. 다수능력동시변경대조군으로인과를단정하지않고능력하나·모형하나변경후해석.

고장지점=요청수신후/행잠금후/추첨후commit전/commit후응답전/파일upload후ready전/년전환lease중간/restore staging끝/preview후타기기commit. 각지점에예외/네트워크끊김/중복요청/서버재시작을주입. 명령전후정상잔고·RNG·계약·출처·receipt를관측하며production유저데이터에주입하지않음. 실제개발Neon분리브랜치와테스트파일prefix에서만수행한다.

## 산출물과 실행 경계

artifacts/{runId}/manifest.json,metrics.csv,invariants.json,failed-cases.json,seed-fixtures.json,source-commit.txt. 로그에token/DBURL/서명URL/사용자실명자료없음. 보고서상태=PLANNED/RUNNING/PASSED/FAILED/INCONCLUSIVE,조건fixture존재만으로PASSED금지. 사용자PC사양/호스팅이정해지기전처리속도p95목표를추측해서통과기준으로쓰지않고목표와측정기준을먼저고정한다.

85의 하드 경쟁자/구단 AI/치트 팀 전체 성장 정책을 대조군에 포함한다. 현재모든L01~12는PLANNED. 설계용정적검사는카탈로그·예시수식·검수기대값의필드만검사한다. 앱구현/실험실행/DB작업을별도착수지시전시작하지않는다.

---

<!-- SOURCE: 74-PREVIEW-COMMAND-RECONCILIATION.md -->

# 74. 미리보기·확정·응답 유실의 교차 계약

2026-10-19 교차 점검. 28/64의공통처리를유지하며40계약·57구종·59개인협상·61직원·70복원·72연도전환이같은규약을사용하게정리한다. 구현코드는아직없다.

## 명령과 미리보기의 책임

preview는조회다. source save revision/규칙버전/관련entity revision/payloadHash에묶여10분유효,돈·횟수·PRNG·선수생성효과0. 후보·AI제안·새진로오퍼같은지속계획은세계진행/협상라운드시작명령에서먼저고정하며preview가새후보를굴리지않는다. 계획이없으면PLAN_NOT_READY와유효현재행동안내,빈목록을성공탐색인것처럼보여주지않음.

previewId는서버소유row또는무결성검증가능토큰,ownerSubject/saveId/type/sourceRevision/payloadHash/rulesVersion/validUntil에결합. 클라이언트의effects/odds/costs를명령입력으로신뢰하지않음. 조건이달라지면PREVIEW_STALE,기존수락확률을유지하려경쟁자·예산·선수권리를동결해버리는계약아님. 일반명령은expectedRevision일치필수,해당모드에서제약없는순수핀/메모는별도resourceRevision.

## 단일 요청과 receipt

요청저널은commandId/type/payload/expectedRevision/previewId/requestHash를확정직전에보존,재시도때이내용을바꾸지않는다. 서버는소유save잠금→같은commandId receipt확인→있으면원응답(현재preview만료여부보다우선)→없으면revision/preview/권리검사→추첨과원장→상태·receipt한transaction. 같은ID다른본문은409 COMMAND_ID_REUSED. commandId는owner/save범위로고유,다른사용자receipt조회404.

도전강화실패·탐색실패·역제안거절은실행된결과이므로HTTP200/outcome=REJECTED와비용/횟수원장이있다. 오류422와달리다시같은기회를새ID로자동실행하지않음. 검증실패는PRNG/원장효과0. NO_CHANGE는원래상태와동일한구성일때고유receipt저장하되세계revision/기회/비용/난수불변,preview가현재상태와맞지않으면NO_CHANGE로기만하지않고409.

## 결과를 모르는 상태

commit뒤연결끊김은클라이언트RECONCILING. 같은commandId를주DB에서조회,성공receipt확인후결과표시. 404하나만으로‘서버가실행하지않았다’고단정하지않음(원요청진행중가능). 같은원요청을동일ID로재전송해대기/멱등확인,새ID발급금지. 아직진행중이면202 COMMAND_PENDING/retryAfter,자동재확인최대대기후사용자에게나중에조회행동. 확정되지않은성공·실패연출없음.

이프로토콜때문에command reservation을쓴다면PENDING과terminal receipt는구분,실패프로세스의lease회수뒤동일원요청/seed부터재개. reservation존재가비용지급이나추첨성공을의미하지않음. RNG상태는게임transaction과같이저장하므로서버가추첨직후죽어commit이없으면동일snapshot재실행,다른결과seed를만들지않음.

## 비동기 job·동시성

NEXT_SEASON/복원/카드내보내기수락의receipt는jobId와PENDING응답을불변보존한다. job완료를맞추려고원receipt본문을수정하지않음. 재시도는같은jobId,상태는전용GET jobendpoint로조회,최종revision은job결과에서제공. 복원과카드수출은save변경명령과개인resource job의구분을70/63대로유지.

서로다른기기두명령이같은expectedRevision이면첫변경만성공,다른명령은409후새모형·새preview. 서로다른선수라고save lock을건너뛰지않음. 역할claim/선수활성계약고유제약은잠금에추가보호. 같은날여러명령중일부만성공했을때클라이언트가나머지를자동최신revision으로재작성하지않음.

목록/도감조회나개인메모변경은세계revision을증가시키지않으므로현재게임preview를무효화하지않음. 다만예산/권리/정원/능력/오퍼같은근거가실제변하면source revision과payload hash를재검증. 검증코드는64/72오류목록,423연도전환잠금은일반명령재실행대신job조회.

## 서버·클라이언트 금지 사항과 검수

온라인우선게임이므로오프라인에세계명령을여러개쌓았다가나중에새revision으로일괄재생하지않는다. 미확정원요청하나만저널로보존,로그인복구후receipt부터조회. 비밀토큰은그저널에함께넣지않음. 서버시각TTL만료는게임세계날짜/기한이아니며진행없는데오퍼의게임기한을앞당기지않음.

검수기대값CP01 preview반복효과0/CP02같은ID다른payload409/CP03commit응답유실receipt1/CP04실패추첨사용기회1/CP05TTL만료뒤성공receipt원응답/CP06동시두기기변경1/CP07NO_CHANGE원장0/CP08job중복0/CP09개인메모세계revision0/CP10진행중404뒤새ID생성0/CP11사전계획없음미리보기추첨0/CP12검증오류RNG0. 기계가독기대값은[cross-contract-fixtures.json](cross-contract-fixtures.json),실제네트워크·DB실행은미실시.

## 잠재력과 효과 미리보기 — 사용자 확정

U:일반·하드도정확한증가량·비용을우선표시. 공개전망범위를유지하기위해실제효과를모호하게만들지않는다. 예능력90/P91.25에서정상도전+2는성공+1.25/실패0/피로양쪽+10/성공률60%를표시. 치트는P100을적용한해당대상의정확증가량·비용/성공보장으로숫자확률숨김. 미리보기는원능력의잠재력과같다고보장하는정보가아니라현재대상의실제행동효과다.

원본rawP필드는일반응답에서계속제외하지만상한으로잘린증가량으로일부P를추론할수있음은허용한사용자선택이다. 스카우팅범위를비밀유지장치나치트방지보장으로설명하지않음. 처리단위1e-4를정확상세표시,기본요약은소수1자리이고상한절삭배지/상세열기로오해방지. 구체응답·원본·선택해제조건은75를따른다.

---

<!-- SOURCE: 75-EXACT-EFFECTS-PUBLIC-INFORMATION.md -->

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 투구폼×구종 친화(±.01)와 좌우 상성(반대손 1B+.01/같은 손 K+.01)은 생성·구종 화면 도움말에 정확한 값으로 표시하고 확률 배지는 만들지 않는다.

# 75. 정확한 강화 미리보기와 공개 정보 계약

2026-10-19 사용자확정U:잠재력범위공개보다행동의정확한증가량·비용표시를우선. 67의스카우트범위는유지하지만실행효과로상한을추론하는것은허용. 원본rawP를클라이언트에별도그대로보내는정책으로확대하지않음.

## 강화 preview 필드

preview.effects={abilityKey,beforeExact,onSuccess:{gainExact,afterExact,fatigueDelta},onFailure:{gainExact,afterExact,fatigueDelta}|null,capApplied,limitingFactors:[POTENTIAL_CAP|ABILITY_CAP],eligible,reasonCodes};costs={worldSeasonTrainingUses:1,moneyMinor:"0",currency:KRW};odds=[{target:ENHANCEMENT_SUCCESS,probability,kind:EXACT}]. 확정성장/컨디셔닝은odds=[]/onFailure=null,도전은실제p와두결과,치트는p=1/onFailure=null이나UI100%숫자숨김. eligible=false면costs의실제기회소모도0.

도전nominalGain2,eligible는P-A≥1,성공gain=min(2,P-A,100-A). 확정nominal1동일경계. 컨디셔닝은gain0/fatigueDelta=-min(20,currentFatigue). 성공·실패피로는현재피로상한100을적용한실제차이,예피로95도전+10은실제+5. 불가대상은actual effects지급0/비용0/기회미소모,상한여유부족이유와다른대상/컨디셔닝선택을제공.

예A90/P91.25/피로95:도전60%,성공+1.25→91.25/실패0→90,양쪽피로+5→100,기회1. 개인치트는P100고정이므로A90일때성공+2가정확하다. 치트에서상한절삭+1.25가되는별도예는A98.75/P100이며성공보장·실패분기없음. 1e-4미만반올림을위해행동효과를거짓+2로표시하지않음. 선택후실행은동일snapshot/규칙이며변경시409재preview,성공연출과원장수치일치.

## 스카우팅·근거·프라이버시

현재평가범위의이전공개정보는유지,강화실행·정확효과열람으로알게된확정성장한계는별도publicKnowledgeEvidence에기록가능. Pcap에의한절삭으로P가정확하게드러난경우,도움말에는‘강화 상한으로 확인한 정보’라고출처를구분한다. 이를관측20경기stage가올랐다고처리하지않음. 원본보관은그원본evidence유지,새복사본의새P를자동증명하는자료로복사하지않음.

개인플레이게임에서읽기preview를돈/확률재추첨으로제한하지않음. API에rawP/seed/다른친구자료를추가노출하지않고도정확한본인행동효과만반환한다. scout AI는67의공개전망만사용하며강화preview를무한자동질의해비공개P를역산하는AI최적화루틴은없음.

## S23와 검수

대상→현재능력/세계시즌잔여→선택별정확성공·실패효과/실제피로/기회비용→상한절삭상세→확정. 선택·비용·확률변경시다시확인. 검수fixture EF01+1.25절삭/EF02피로95→100실제+5/EF03불가대상기회0/EF04컨디셔닝피로8→0실제-8/EF05치트p1숫자숨김/EF06preview재열람상태·난수0. 구현전서면계약이며현재보드예시는게임과연동되지않는다.

---

<!-- SOURCE: 76-CROSS-PLATFORM-INTERRUPTION-RESUME.md -->

# 76. 웹·APK 중단 후 이어하기 — 필수 사용자 기능

2026-10-19 사용자확정U:웹앱과앱모두중간에끊겨도이어하기가능. 기존28/64/69/70/72/74의서버저장·명령복구를홈진입부터끝까지연결한다. 현재는설계이며자동저장이나실기기중단테스트가구현된것은아니다.

## 저장과 홈

공식진행은서버commit된세이브가원본,게임종료버튼/브라우저종료이벤트를기다리지않는다. 경기청크/pendingGame/중요선택/강화·계약/일자마감/복무·진로/은퇴처리시점의transaction에즉시저장. 서버가성공응답을보냈다면웹·APK를강제종료해도그revision을이어받는다. 전송되기전초안/최종확정하지않은선택은공식효과가없으며가능하면이기기초안으로복원한다.

S01 최근 게임에는 선수/구단명·모드·현재 시즌 등 대상 식별 정보와 **이어하기** 버튼만 표시한다. 중단 종류·미완료 명령·복구 단계·저널 상태·저장 상태 설명은 사용자에게 표시하지 않고 내부 조회에만 사용한다. 세이브선택목록도유지,서로다른커리어/구단을자동합치지않음. 서버profiles.lastPlayedSaveRef는가장최근명시적PLAY/CONTINUE선택으로갱신,다른기기의단순목록조회로바꾸지않음. 로컬최근게임과서버최근게임이다르면두카드를표시할수있고버튼대상saveId를명확히한다.

## 진입 복원 순서

1. 세션복원/필요시로그인,로그아웃된사용자의이전계정저널은새계정에재실행안함.
2. 같은owner의로컬inflightCommand확인,있으면74의receipt조회. 원응답불명은동일ID재조회·재전송,새ID자동발급금지.
3. 최신save summary/revision과server resumeDescriptor조회,기기캐시state로덮어쓰지않음.
4. resumeDescriptor.kind에맞는화면복원. 이어받는주체는서버phase/allowedActions이며브라우저옛URL아님.
5. 초안이있으면draft.sourceRevision/대상entityVersion/필드schema검사. 현재와같으면복원하되확정은다시버튼,다르면‘저장된 초안’읽기제공후최신모형으로재preview.
6. 성공결과를확인하면저널ACK/CLEAR,이미확정된강화·계약은같은결과만보여줌. 결과확인화면에서뒤로가도당첨을다시뽑지않음.

## 상태별 이어갈 위치

| kind | 복원 위치·행동 |
|---|---|
|HOME|현재커리어/구단/대학/미국홈,다음합법일정 |
|EVENT_DECISION|동일eventInstance/선택가능항목,초안있으면선택표시만 |
|PENDING_GAME|같은gameId/provisional cursor/rngSnapshot,이어처리후최종경기결과 |
|RESULT_RECEIPT|이미확정된강화/계약/탐색receipt,효과재적용0 |
|YEAR_JOB|같은yearTransitionId단계조회,기존세계읽기가능/일반진행잠금 |
|RESTORE_JOB|같은restoreJobId상태,대상새saveId를중복생성안함 |
|SERVICE/ROUTE|복무program/학년/준비episode/권리/현재날짜,달력재시작없음 |
|COMMENTARY|62의같은확정경기와이기기읽기cursor,읽기위치유실시경기처음보기가능/세계결과불변 |
|ARCHIVED|완료보관원본과연대기. 은퇴transaction미완료면원게임최신phase/receipt부터확인 |
|INTEGRITY_BLOCKED|최근정상진행·진단참조·허용복구행동,새게임으로자동대체안함 |

## 웹·APK 로컬 보존

웹은IndexedDB에ownerNamespace/saveRef/inflightCommand와허용UI초안,APK는앱sandbox영속저장소에동일저널. command는송신전에journal완료,받은receipt요약도결과연출전에저장. 토큰/DBURL/서명URL/원잠재력·전체세계snapshot을저널에넣지않음. refresh세션은16/28의보안저장정책,저널은인증대체가아님.

visibilitychange/pagehide/앱background에서는초안·중계읽기위치저장best effort만,종료직전네트워크요청성공을저장보장으로삼지않음. OS강제종료후기기저장소가남으면저널복원,시크릿창/브라우저데이터삭제/앱재설치면로컬초안은사라질수있지만같은계정로그인으로서버공식진행은복원. 같은계정다른기기는그서버확정상태를이어가며다른기기의미전송초안까지복사한다고약속하지않음.

오프라인에서는‘최근 확정 진행’의읽기요약과연결안내. 경기·강화·계약을로컬확정해나중에합치지않음. 서버에접수된요청은접속끊김뒤정해진청크또는필수선택앞까지마감될수있고,클라이언트가없는데시즌끝까지추가명령을발급하지않음. 재접속 시 최신 확정 날짜의 해당 게임 화면으로 연결한다. 중단 원인·복구 진행 안내를 별도로 표시하지 않는다.

## API·화면·검수

GET /api/saves/{saveId}/resume→{saveId,revision,phase,kind,targetRefs,allowedActions,lastCommittedAt,blockingReasons,commandStatus?,jobStatus?}. 요약화면읽기API이며새경기·비용·추첨없음. POST /api/profiles/last-played={saveId,expectedPreferenceRevision}는소유권확인/개인선호revision,세계revision불변. 로컬draftSchemaVersion과command requestHash는불변,unknown field초안은삭제전메시지/본문값복원만허용.

S01 **이어하기** 버튼→내부 최신 상태/영수증 확인→필요 로그인→이어갈 화면. 버튼은 처리 중에도 같은 문구를 유지하고 중복 클릭을 막으며 aria-busy로만 표현한다. 중단 상태/복구 중 문구·별도 안내 카드·중단 유형 선택기는 표시하지 않는다. S20은자동저장(공식진행)과수동백업(파일)을구분,백업실패가자동저장실패로보이지않게표시. 인계시각다른기기revision이면최신확정내용을보여주고오래된선택은재확인. 네트워크실패에처음부터하기를기본버튼으로제공하지않음.

RESUME01 홈최근게임/02선택중강제종료/03강화commit응답유실/04진행중경기동일ID/05연도job중단/06복무중날짜/07웹→APK동일계정/08다른계정저널차단/09오프라인세계수정0/10로컬데이터삭제후서버진행/11은퇴중단보관중복0/12중계cursor만유실. 실제웹새로고침·브라우저강제종료·Androidforce-stop·재부팅·토큰만료·기기2대의E2E검증은구현후필수다.

생성 요청이 접수됐지만 saveId를 아직 모르는 상태는 [78 새 게임 생성 복구](78-NEW-GAME-CREATION-RECOVERY.md)를 적용합니다. 화면별 명령 유형은 [77](77-SCREEN-QUERY-COMMAND-BINDINGS.md)을 따릅니다.


## 2026-10-19 사용자 표시 단순화 U

사용자 요청: “중단 상태는 알려줄 필요 없고 그냥 이어하기 버튼만”. 홈/저장 목록의 이어하기 진입에 적용한다. 정상 복원 과정의 배지·원인·단계·팝업·중단 예시 드롭다운을 제거한다. 같은 명령/경기/영수증 복구,중복 효과 방지,소유권 검사는 내부에서 그대로 수행한다. 원래 API의 kind/commandStatus/jobStatus는 렌더링 대상이 아니다.

로그인이 실제로 필요하면 로그인 화면,연결 실패 시 짧은 연결 오류와 재시도,삭제/접근 불가 시 저장 목록으로 안내한다. 아직 선택하지 않은 계약·사건은 해당 선택 화면으로 연결한다. 복구 과정을 설명하는 화면을 끼우지 않는다. 진행 중 신규 게임 명령의 실제 오류를 성공으로 감추거나 오프라인에서 새 결과를 확정한다는 뜻은 아니다.

정적 목업의 이어하기는 키보드로도 사용할 수 있는 링크 버튼이며 #career 화면 예시로 이동한다. 실제 서버 이어하기는 구현 전이며 실제 앱에서는 원래 URL이 아닌 최신 resumeDescriptor의 목적지로 연결한다.

---

<!-- SOURCE: 77-SCREEN-QUERY-COMMAND-BINDINGS.md -->

최신 확정(2026-10-19): [125](125-EVENT-CHOICE-DISPATCH.md) S06 RESOLVE_EVENT의 선택지 명령 분류와 NAVIGATE targetScreen은 event-catalog-v2.json의 dispatchClass/targetScreen이 기준이다.

# 77. 전체 화면의 조회·명령·결과 연결 계약

2026-10-19. [screen-action-bindings.json](screen-action-bindings.json)은S01~45의기본queryKey/행동/actionClass를지정한다. 기존화면카탈로그의데이터·빈상태·오류문구와함께읽는다. 논리키를정한것이며실제API/라우터구현이나이름자동검색이아니다. 아래가대표행동의정규화이름이며기초문서의동의어는같은핸들러에명시매핑한다.

## 조회 모형

queryKey는도메인projection이름,새범용‘모든데이터’endpoint가아님. 28/56~76의해당GET경로를사용한다. 기본{viewVersion,sourceRevision,phase,allowedActions,blockingReasons,data}와scope/saveId/owner검사를공유. projection에는화면에필요한공개필드만,전체state/원잠재력/다른사람데이터/seed를반환하지않음. 서명URL은필요한소유파일조회에만짧은만료로발행한다.

READ_ONLY/QUERY행의메뉴이동·카드선택은세계명령이아니다. S04/S28졸업진로비교는조회,실제계약수락/대학입학에서만배타진로가정해진다. S09은은퇴를다시실행하지않고이미확정된receipt와원본을읽는다. S38은모든보유특성자동효과조회,장착API를복원하지않음.

## 명령과 결과 라우팅

SAVE_COMMAND는64/74의expectedRevision+preview+commandId,조회혼합화면의각행동은유형별구분. S40 SET_GOALS/REPLACE_GOAL은세계명령이나EQUIP_COSMETIC은58개인resourcePreference CAS. S44읽기/되감기/속도는세계명령0,위치저장만개인preference. S45장면조회와메모는63,카드생성은export job. S21음량·폰트·모션은기기선호,로그아웃·계정삭제는별도인증/재인증명령이며설정저장에묶지않음.

명령성공뒤클라이언트가고정다음화면을가정하지않고result.eventIds/phase/allowedActions/resumeDescriptor를따른다. 예S03진행은S06선택/S23기회/S26복무/S07결산/pendingGame중서버현재합법대상. 이벤트안에서같은명령을재실행해다음화면을판단하지않음. outcome=REJECTED도정상확정결과로보여주고효과·비용원장은receipt값을사용한다.

JOB_REQUEST인S20백업·복원은jobId조회,기존save를현재파일내용으로자동덮지않음. OWNER_CREATE인S02/S12는아직saveId가없으므로64의save명령경로를억지로호출하지않고78의소유자생성명령계약사용. 미해결원요청은화면변경뒤에도동일저널에서추적한다.

## 화면별 입력 검증과 접근

프런트검증은즉시도움말일뿐,서버는종류/학적/권리/나이/슬롯/예산/기회재검사. 조회캐시가오래되면기존수치를회색읽기상태로유지하고확정만막는다. 세이브직접URL을열면먼저owner+phase검사,예전화면에서뒤로가기했다고이전시즌강화가능해지지않음. 서버가불가로반환한진로를클라이언트숨김만으로보호하지않음.

폼초안key=(owner,saveOrCreationId,screenId,entityId,schemaVersion),sourceRevision보존. 다른선수/다른시즌폼으로초안자동이식금지. 라인업은9자리중복검사/구종은비율합/육성은정확4개/특성은읽기전용/제안은금액·기간이라는도메인검증차이를유지. 선택카드에확률이있다면정확한대상/최종p/비용,실제1은숫자숨김.

## 수용 기준

S01~45모두연결행1개,알수없는actionClass/빈actions없음. QUERY만으로save revision/PRNG/원장이변하지않음. MIXED행의개인설정을세계명령으로묶지않음. SAVE_COMMAND는receipt조회/충돌복구단계를갖고OWNER_CREATE는생성후saveId모를때복구할수있어야한다. 정적검사는매핑존재만증명,실제버튼이동·권한·폼·모바일뒤로가기는구현후화면통합테스트다.
## S18 구단 드래프트 하위 화면 연결 D(115)

기존45화면의S18안에구단DRAFT하위화면을연결한다. READ_LEAGUE_RECORDS는QUERY,CLUB_DRAFT_PICK/CLUB_DRAFT_AUTO_PICK은구단모드·현재차례에서만허용하는SAVE_COMMAND다. query는clubDraftState로현재draftId/targetSeason/round/pick/team/잔여후보와version을읽는다. payload={draftId,round,pickNumber,playerId,expectedDraftVersion};자동선택은playerId대신추천snapshot참조를보내서버가유효후보를재검사한다. 외부모드/차례아님/중복후보/정원/예산/preview불일치는거절하며한지명receipt키는saveId+draftId+round+pickNumber다. 기존commandId·expectedRevision·preview계약을같이쓴다. 응답유실은같은receipt확인,오래된차례를새차례로자동승인하지않는다. 후보를열람한것만으로선택/계약/1군등록이변하지않는다.

S18의원래리그/기록탭은읽기전용이고커리어S05의지명결과수락과혼용하지않는다. 46번째게임화면을만들지않았다. 기본목업과마감보드에는읽기용설명배치를추가했지만실제지명버튼/서버는미구현이다.

117 사용자확정: 커리어홈의기본진행은‘다음주요사건까지’. 1경기/1주일은대안이며필수선택/시즌경계에서정지한다. 116의중반경험·E13명령기반후속도함께적용한다.

---

<!-- SOURCE: 78-NEW-GAME-CREATION-RECOVERY.md -->

최신 확정(2026-10-19): [122](122-API-SCHEMA-LOG-ALIGNMENT.md) 생성 payload에 투수 pitchForm이 추가되고 creationSchemaVersion이 오른다. 투구폼 없는 구버전 요청은 거절·업데이트 안내.

최신 생성 입력은 [79](79-CREATION-FIELDS-VALIDATION-COPY.md)를 따릅니다. 생성 전 실제 가상 로스터/개인 잠재력 추첨 미리보기 초안은 폐기하고 구성 기준을 표시합니다. 실제 선수단은78의 단일 생성 작업에서 확정합니다. 숨김 치트 해금은 클릭 증명을 요구하는 서버 권한이 아닌 발견용 UI입니다.

# 78. 새 게임 생성과 생성 중단 복구

2026-10-19 / 설계 기본안 D. 웹·APK 이어하기 요구 U를 S02 선수 생성과 S12 구단 생성까지 확장한다. [76 이어하기](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md), [77 화면 연결](77-SCREEN-QUERY-COMMAND-BINDINGS.md), [74 명령 복구](74-PREVIEW-COMMAND-RECONCILIATION.md)를 함께 적용한다. 실제 API·DB·작업자는 미구현이다.

## 사용자 흐름

1. 모드 선택 → 이름·역할·팀·난이도·외형 등 입력. 커리어 집중 능력은 해당 역할의 6개 중 서로 다른 4개. 구단은 독립 시작할 수 있고 보관 선수 투입은 선택이다.
2. 확인 화면에 시작 나이·소속·6능력·평균 종합·선택한 난이도·클라우드 저장 계정을 표시한다. 79대로 생성 전에는 개인 잠재력을 아직 추첨하지 않으며 분포 설명만 표시한다. 생성 완료 후67의 첫 공개 평가 범위를 표시한다. 숨김 난이도는 기존 해금 동작 뒤에만 나타난다. 단순 생성 버튼에 확률 배지를 붙이지 않는다.
3. 시작을 누르면 creationId와 정규화된 요청을 로컬 저널에 먼저 기록하고 서버에 전송한다. 입력을 잠그고 '새 게임을 준비하고 있어요'와 진행 단계를 표시한다. 단계는 준비/리그 생성/검증/저장 완료이며 가짜 진행률·예상 시간은 쓰지 않는다.
4. 완료된 saveId로 첫 화면을 연다. 커리어는 고교 시작 상태, 구단은 개막 준비 상태이며 구체 날짜·초기 능력은 기존 생성 규칙을 따른다. 신규 생성 자체가 졸업·드래프트·영입·첫 경기 진행을 실행하지 않는다.
5. 앱을 닫았다면 홈에는76의 최신 U대로 '이어하기' 버튼만 표시한다. 별도 생성 중단 상태·복구 설명 카드는 만들지 않는다. 서버 resumeDescriptor로 같은 생성 작업/완료 게임에 연결하며 필요한 상태·실패 사유·동일 요청 재시도는 생성 화면에서 처리한다. 확인 전 새 creationId로 동일 요청을 반복하지 않는다.

## 소유자 범위의 API

인증된 owner는 세션에서 결정하며 요청의 ownerId를 신뢰하지 않는다. saveId가 없으므로 기존 /saves/{saveId}/commands를 사용하지 않는다.

| 요청 | 계약 |
|---|---|
| POST /api/game-creations | {creationId, mode:CAREER 또는 CLUB, creationSchemaVersion, rulesVersion, payload}. 서버가 owner+creationId에 요청 해시·예약된 saveId·작업 상태를 영속 저장한 뒤 202 {creationId,status,jobId} 또는 완료 receipt 200을 반환 |
| GET /api/game-creations/{creationId} | 같은 owner만 조회. {creationId,status,stage,jobId,saveId?,resumeDescriptor?,errorCode?,retryable}. 성공이면 동일 saveId를 반복 반환 |
| GET /api/game-creations?status=unresolved | 계정 소유의 대기·실행·재시도 가능 실패를 페이지 조회. 새 기기에서 로컬 저널이 없어도 찾기. 완료됐지만 클라이언트 확인 전인 항목도 포함 |
| POST /api/game-creations/{creationId}/ack | 성공 receipt를 읽었다는 개인 확인 기록만 변경. 세계 revision·최근 플레이를 자동 변경하지 않음 |

404는 실행되지 않았다는 증거가 아니다. 서버 조회 장애·접수 직전 경합이면 동일 creationId와 동일 payload로 POST를 재전송한다. 같은 ID의 다른 payload는 409 CREATION_ID_REUSED. 입력을 바꾸려면 이전 작업의 확정 상태를 확인하고 새 ID로 명시적 새 게임을 만든다. 기기간 서로 다른 ID로 만든 게임은 별개로 허용하며 이름으로 중복 제거하지 않는다. 저장 공간 제한이 있다면 접수 시 owner 단위로 슬롯을 예약하여 두 탭이 동시에 한도를 넘지 못하게 한다. 한도 값은 기존 저장 정책을 따르며 이 문서에서 새 유료 제한을 도입하지 않는다.

## 원자성과 재시도

상태는 ACCEPTED → RUNNING → SUCCEEDED 또는 FAILED_RETRYABLE/FAILED_FINAL. 초기 검증 실패 4xx는 슬롯·세계·RNG를 만들지 않는다. ACCEPTED부터 creationId·예약 saveId·rulesVersion·콘텐츠 버전·서버 seed를 고정한다. seed는 클라이언트에 노출하지 않는다. 작업자 lease 만료 후 다른 작업자가 이어받아도 같은 생성 계획과 seed를 사용한다.

큰 리그는 임시 generationId 아래 생성한다. 공개 save 목록과 이어하기에는 불변조건 검사를 통과한 최종 상태만 등록한다. 생성 receipt의 SUCCEEDED, 초기 save revision, 초기 스냅샷 활성 포인터, 슬롯 예약 전환은 한 번의 최종 DB 트랜잭션으로 확정한다. 임시 선수·일정은 읽기 화면에 노출하지 않는다. 재시도 시 새 세계를 추가하거나 능력을 다시 추첨하지 않는다. 이미지 업로드·초상 생성·카드 내보내기 성공을 필수 생성 완료 조건으로 삼지 않고 기본 초상으로 시작할 수 있다.

SUCCEEDED는 불변 receipt. 이후 유저가 세이브를 삭제한 경우 같은 ID 재전송으로 복구·재생성하지 않고 SAVE_DELETED를 안내한다. 생성 실패 시 기존 게임은 변경하지 않는다. FAILED_RETRYABLE은 같은 POST로 동일 계획 작업을 재개하고 재시도 횟수·원인을 기록한다. FAILED_FINAL은 슬롯 예약을 해제하고 오류 receipt를 보존한다. 새 ID의 새 시도는 사용자 동작이 필요하다. 처리 중 취소는 초기 버전에서 제공하지 않고 앱 종료·다른 게임 열기는 허용한다. 임시 데이터 정리는 활성 lease와 최종 receipt를 확인한 후 수행한다.

## 생성 입력과 보관 원본

서버 검증은 이름 길이·허용 문자, 역할별 능력키, 집중 4개, 초기 분배·나이·팀 자격, 잠긴 난이도 권한, mode별 허용 필드를 검사한다. 클라이언트 전달 능력·돈·해금 여부를 신뢰하지 않는다. 생성 폼 조회와 수정은 RNG를 소비하지 않는다. 미리보기는 공개된 시작 규칙만 사용하고 숨은 잠재력·리그 생성 seed를 추첨하지 않는다.

보관 선수를 선택했다면 immutable archiveId+version+투입 역할을 요청에 고정하고 owner·원본 존재·같은 세계 중복 금지를 재검사한다. 19세·능력별 최고값 절반·새 잠재력 상한100·병역 재시작을 적용한다. 한 세계에서 선수/지도자 중 하나만 허용하며 원본을 소모하지 않는다. 보관 선수 없이도 구단 생성이 완결된다. 생성 중 원본 삭제 경합은 원본 읽기 잠금/참조 무결성으로 막고, 삭제가 먼저 확정됐으면 생성 검증 실패로 처리한다.

## 로컬 초안과 계정 전환

초안은 owner/creationId/mode/schemaVersion을 키로 저장하고 서버 접수 전에는 '이 기기의 초안'으로 표시한다. 다른 기기로 초안이 전송됐다고 표현하지 않는다. 서버 접수 후 진행 상황은 같은 계정 어느 기기에서든 조회할 수 있다. 로그아웃은 해당 owner의 로컬 초안·저널 접근을 잠그고 다음 계정에 노출하지 않는다. 서버 게임은 로그아웃으로 삭제하지 않는다. 만료 로그인 복구 뒤 원래 owner를 확인한 후 같은 요청을 재개한다.

생성 성공만으로 기존 최근 플레이를 덮지 않는다. 실제 새 게임 열기 시 [76](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의 last-played CAS를 적용한다. 여러 생성 작업이 완료됐어도 홈에 작업 상태 카드를 나열하지 않는다. 실제 대상 선택이 필요하면 기존 저장/작업 목록에서 명시적으로 선택하며, 조회만으로 임의의 작업을 최근 플레이로 바꾸지 않는다. 홈은 이어하기 버튼만 유지하고 이미 확인된 완료 항목은 일반 저장 목록에서 접근한다.

## 검수와 구현 준비

[creation-acceptance-fixtures.json](creation-acceptance-fixtures.json)의 CR01~10은 응답 유실, 중복 payload 충돌, 작업자 재시작, 계정 격리, 두 기기 발견, 임시 데이터 비노출, 원본 선택 없음, 삭제 후 재전송, 원본 충돌, 최근 플레이 보존의 서면 기대값이다. 정적 검사는 파일 구조·고유 ID만 확인한다. 실제 생성·작업자 종료·트랜잭션 경합·브라우저 재시작·APK 종료 검수는 구현 후 별도로 실행한다.
고교 생성 사용자확정U(2026-10-20): 가상9학교·학교당25명(야수15/투수10), 정규48/리그216경기. NPC 시작 종합35~65·중심48. 학교별 상세 역할·삼각분포/정수화의 구현 기본안과 첫18세 코호트는14의 해당 기록을 따르며 향후 신입/학년 이월은 별도 세계연도 규칙에 연결한다. 이 원자 생성 계약의 DB 게시/receipt 구현은 M3에서 검증한다.

---

<!-- SOURCE: 79-CREATION-FIELDS-VALIDATION-COPY.md -->

최신 확정(2026-10-19): [121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md) 생성되는 AI 선수의 손·타석 분포와 좌투 제한 보정이 정해졌고(주인공은 직접 선택), S16에 좌우 분리 기록이 추가된다.

최신 확정(2026-10-19): [119 선수 표시·투구폼·실루엣](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)이 이 문서의 해당 내용(사람 외형/얼굴 프리셋, 타석 추가 능력 없음, 구종 벡터 외 보정)을 대체·보강한다. 투수 생성에는 투구폼 필드가 추가된다.

최신 v0.14: [85 난이도·구단 치트](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)가 상충하는 이전 규칙을 대체합니다. 구단 치트는 내 구단 전체의 잠재력100·양의 자연성장/구종XP3배를 적용하며 이후 영입·보관 투입 포함입니다. 일반 구단과 원본 기록에는 소급하지 않습니다.

# 79. 선수·구단 생성 입력과 검증 문구

2026-10-19 / 서면 상세설계. U는 기존 사용자 확정, 나머지 UI·검증 선택은 D다. [01](01-GAME-RULES.md), [35](35-SIX-ABILITIES-FOUR-FOCUS.md), [42](42-GROWTH-DIFFICULTY-REBIRTH.md), [44](44-CLUB-ECONOMY-AI.md), [78](78-NEW-GAME-CREATION-RECOVERY.md)를 입력 필드 수준으로 연결한다.

## S02 선수 생성 단계

이름·고교 → 타자/투수 → 포지션/보직·투타 → 초기 유형 → 집중 4개 → 난이도·희망 구단 → 최종 확인. 단계 이동은 저장된 세계를 만들지 않는다. 같은 폼에서는 뒤로 가도 입력을 보존한다. 고교 3학년 18세로 시작하며 생년월일·실제 학교·실명 인증을 요구하지 않는다. 첫 기본 선택은 타자/균형형/일반이며 이름·포지션·집중은 확인 전 사용자가 선택한다. 기본 선택은 변경 가능하고 확정 버튼이 자동 실행되지 않는다.

| 필드 | 입력·정규화 | 불가 문구/동작 |
|---|---|---|
| 이름 | NFC 후 앞뒤 공백 제거, 1~12 글자소. 내부 공백 허용, 제어문자·줄바꿈 금지. HTML은 텍스트로 출력 | '이름을 입력해 주세요.' / '이름은 12글자까지 입력할 수 있어요.' / '이름에는 줄바꿈이나 제어문자를 넣을 수 없어요.' |
| 고교 | 가상 목록의 schoolId, 기본 학교 선택 가능 | '선택한 학교 정보를 다시 불러와 주세요.' |
| 선수 종류 | HITTER/PITCHER 하나 | '타자 또는 투수를 선택해 주세요.' |
| 포지션 | 타자 C/1B/2B/3B/SS/LF/CF/RF/DH | '주 포지션을 선택해 주세요.' |
| 투수 보직 | SP/RP/CP 하나. 실제 기용 보장 아님 | '희망 보직을 선택해 주세요.' |
| 던지는 손 | R/L. 좌투 C/2B/3B/SS 불가 | '좌투는 이 게임에서 포수·2루수·3루수·유격수로 시작할 수 없어요.' |
| 타석 | R/L/S. 양타는 상대 투수 손의 반대 타석으로 취급, 초기 추가 능력 없음 D. 경기 타석 판정의 좌우 상성에는 119대로 사용 | '타석 방향을 선택해 주세요.' |
| 투구폼 | 투수만. OVERHAND/THREE_QUARTER/SIDEARM/UNDERHAND 하나. 표시·소폭 친화(119), 능력 보너스 없음. 생성 후 변경 없음. 타자는 숨김 | '투구 폼을 선택해 주세요.' |
| 유형 | 타자8/투수6의35 배열, 각 합300 | '현재 선수 종류에 맞는 유형을 다시 선택해 주세요.' |
| 집중 | 해당 종류 정확4개, 중복 불가 | 미달 '육성 능력을 4개 선택해 주세요. (현재 n/4)' / 다섯째 '최대 4개까지 선택할 수 있어요.' |
| 난이도 | GROWTH/REALISTIC/SECRET_CHEAT. 기본 일반 | '선택한 난이도 정보를 다시 확인해 주세요.' |
| 희망 구단 | KBO 팀 목록 또는 '선호 없음'. 희망은 지명 보장 없음 | 폐기 팀 ID이면 다시 선택, 없는 팀으로 자동 대체하지 않음 |
| 초상 | 사람 외형 선택 없음(119). 투타·투구폼에 맞는 실루엣+이름 카드를 자동 표시 | 자산 오류면 이니셜 카드, 시작 차단 없음 |

등번호는 생성 필수 입력이 아니며 프로 입단 후 0~99 중 중복을 검사한다. 게임 나이·현재 능력·잠재력·자금·군복무 완료 여부는 직접 입력하지 않는다. 이름 글자소 계산은 프런트/서버가 같은 버전의 분할 규칙을 사용하며 한글 조합 중 IME 입력을 잘라내지 않는다. 서버는 UTF-8 요청 크기 상한도 별도로 검사한다. 스크립트처럼 보이는 이름도 실행하지 않고 텍스트로 처리한다.

선수 종류를 바꾸면 이전 종류 입력을 임시 보관하고 새 종류의 포지션·유형·집중을 다시 선택하도록 표시한다. 종류별 이전 초안으로 돌아갈 수 있으나 타자 키를 투수 요청에 섞지 않는다. 손 변경으로 포지션이 불법이 되면 손 선택은 보존하고 포지션 오류를 표시한다. 자동으로 1루수로 바꾸지 않는다. 유형 변경은 초기 배열 미리보기만 갱신하고 집중4개는 유효하면 유지한다. '추천 육성 적용'은 눌렀을 때만4개를 바꾼다.

## 능력과 최종 확인

35의 고정 배열을 그대로 표시한다. 능력은 서버 정의로부터 계산하며 자유 분배·주사위 재뽑기는 없다. 6개 영구 능력의 산술평균을 '종합 50.0 / 100'으로 표시한다. 수비 보정·피로·기용점수는 종합에 섞지 않는다. 일반/하드의 초기 배열은 동일하며 양의 자연성장만42의 차이를 가진다.

생성 전 일반/하드의 실제 잠재력은 아직 추첨하지 않았으므로 정확한 개인 전망 범위처럼 표시하지 않는다. '잠재력은 시작 후 스카우트 평가로 확인합니다'와 생성 분포의 설명만 제공한다. 서버 생성 완료 후67의 첫 평가 범위를 표시한다. 치트는 고정 정책이므로 '각 잠재력 100 · 성장 3배 · 도전 강화 성공 보장'을 보여줄 수 있다. 100은 능력 수치이며 확률 배지가 아니다. 구종 숙련도 성장3배와 시즌 강화1회 유지도 확인 요약에 포함한다.

일반3→하드4 순서의 숨김 해금은33의 현재 폼 메모리 동작이다. 해금은 자동 선택하지 않는다. 서버는 지원하는 프리셋과 소유권을 검사하되 브라우저 클릭 증명이나 비밀 권한 토큰을 요구하지 않는다. 이는78의 '잠긴 난이도 권한 검사'를 대체한다. 각 화면의 잠금 표시로 이스터에그 존재를 미리 알리지 않는다.

확인 순서: 이름/고교/18세 → 종류·포지션·투타 → 초상 → 유형/6능력/종합 → 집중4개 → 난이도 효과 → 희망 구단과 지명 비보장 → 저장 계정 → '이 선수로 시작'. 입력 오류는 첫 오류에 포커스를 옮기고 상단 오류 요약에서 해당 필드로 이동한다. 생성 실패에도 검증 가능한 입력을 유지한다.

## S12 구단 생성

| 필드 | 규칙 | 문구/미리보기 |
|---|---|---|
| 운영 구단 | 실제 KBO10팀 중1. MLB 단장 모드 아님 | '운영할 구단을 선택해 주세요.' |
| 시작 연도 | D 기본2027, v1 고정 읽기 전용 | '게임용 달력이며 실제 시즌 일정과 다릅니다.' |
| 저장 이름 | D 선택 입력, 1~24 글자소. 빈 값은 구단명+시작연도 | '저장 이름은 24글자까지 입력할 수 있어요.' |
| 난이도 | 일반/하드/숨김 구단 치트, 생성 후 고정 | 일반/하드는 동일 초기예산·성장,하드는85의 AI 판단 강화 |
| 내 선수 사용 | 기본OFF, 원본0개여도 모든 생성 가능 | OFF일 때 보관 선택 입력을 전송하지 않음 |
| 보관 선택 | ON이면1~28, 동일 원본1회, 유효한 역할/대체 슬롯 | '사용할 보관 선수를 선택하거나 내 선수 사용을 꺼 주세요.' |
| 투입 설정 | 19세, 능력별 최고50%, 병역 재시작, 유형/집중4개 재설정 | '선수 또는 지도자 중 한 역할로만 사용할 수 있어요.' |

구단 하드는85의 동일 예산·동일 성장·더 정교한 AI 판단을 적용한다. 구단 치트는 무제한 예산·적격 탐색/유효 제안 수락 보장에 더해 내 구단 전체 잠재력100·양의 자연성장/구종숙련3배다. 이후 영입·보관 투입에도 적용하며 현재 능력을 즉시100으로 올리지는 않는다.

### 선수단 미리보기 순서 정합

생성 전에는 총50명/투수24/야수26/1군28과 가상 리그·초기 분포·보관 선수 공개 능력만 보여준다. '생성 후 실제 선수단이 정해집니다'를 표시하며 가짜 이름을 실제 생성 결과처럼 보여주지 않는다. 실제 개별 로스터·대체 대상은78의 서버 생성 작업에서 동일 seed로 한 번 확정한다. 작업 완료 후 개막 전 S14에서 실제 선수단과 보관 투입/방출된 대체 선수를 확인한다.

이는05의 '생성 전 seed와 전체 가상 로스터를 미리 저장' 초안을 대체한다. 수치 입력 폼의 순수 조회와 세계 생성의 확정 시점을 일치시키며, 오류 재시도로 새 능력을 뽑지 않는다. 보관 원본 투입은 요청에 고정된 순서로 슬롯 적합성을 검사하고 같은 분류의 최저 기용점수 후보→stable player key 순으로 대체한다. 모든 보관 투입을 적용한 최종 로스터가 합법이어야 한다. 실패하면 부분 세계는 공개하지 않으며 기존 원본은 불변이다.

구단 확인: 팀/게임연도 → 가상 선수단 생성 기준 → 보관 사용 여부와19세·반값·병역 안내 → 난이도/예산 정책 → 저장 계정 → '구단 만들기'. 생성 중 앱 종료와 응답 유실은78을 따른다.

## 검수 기준

한글 조합 입력·공백 이름·13글자소·좌투 전환·타자↔투수·집중3/4/5·유형 변경·치트 해금 후 수동 선택·보관OFF·동일 원본 중복·생성 실패 입력 보존을 확인한다. [final-design-fixtures.json](final-design-fixtures.json)의 creation 모듈은 서면 기대값이며 실제 입력기나 서버 검증 시험이 아니다.
첫플레이 동선 후속: [113](113-FIRST-CAREER-SEASON-EXPERIENCE.md)에서생성→고교→졸업→진로별첫시즌의안내·주행동·정산/등록/출장경계를연결한다. 새도메인사건/보상/지명보장은없고 [동선보드](first-career-board.html)는읽기시안이다.

---

<!-- SOURCE: 80-SCREEN-STATES-NAVIGATION-RECOVERY.md -->

# 80. 45개 화면 상태·복귀·뒤로가기

2026-10-19. [화면별 복구표](screen-recovery-matrix.json)는 S01~45 각각의 빈 상태·차단 사례·복구 행동·이탈 정책을 정의한다. 기존 [화면 상태](screen-state-catalog.json)의 기본 문구와 [77](77-SCREEN-QUERY-COMMAND-BINDINGS.md)의 행동 연결을 함께 사용한다. 구현·화면 시험은 미실행이다.

## 공통 상태 전이

| 상태 | 사용자에게 보이는 내용 | 허용 행동과 전이 |
|---|---|---|
| LOADING | '정보를 불러오고 있어요.' 첫 조회 skeleton, 이전 데이터 있으면 기준 시각과 함께 유지 | 재조회 성공 READY/EMPTY. 확정 차단, 뒤로가기 허용 |
| READY | 현재 revision의 실제 데이터 | permitted action만 확정. 폼 입력은 초안 |
| EMPTY | 화면별 원인과 다음 합법 행동 | 조회 실패를 빈 결과로 바꾸지 않음. 필터0/전체0/기록 미생성 구분 |
| AUTH_REQUIRED | '진행을 확인하려면 다시 로그인해 주세요.' | 동일 owner 로그인 후 저널 조회부터. 로그인 전 게임 명령 전송 없음 |
| OFFLINE | '연결이 끊겼어요. 마지막으로 확인한 기록을 보고 있어요.' | 캐시 조회·기기 설정만. 다음 경기·강화·계약·생성 실행 불가. '연결 확인' 제공 |
| SUBMITTING | '선택을 처리하고 있어요.' 확정 버튼 비활성 | 같은 행동 재전송 금지. 앱 종료는 작업 취소 아님. 결과 저장 전에 저장완료 표시 금지 |
| RESULT_UNKNOWN | '선택이 처리됐는지 확인하고 있어요. 다시 실행하지 않아도 됩니다.' | journal의 동일 ID 조회/동일 payload 재시도. 실패라고 단정하거나 새 ID 자동 발행 금지 |
| CONFLICT | '다른 곳에서 진행한 내용이 있어요. 최신 상태에서 다시 확인해 주세요.' | 초안 보존,최신 조회→검증→새 미리보기→사용자 확인. 가격·대상 자동 교체 없음 |
| FORBIDDEN_OR_DELETED | '이 저장에 접근할 수 없거나 삭제됐어요.' | 홈/목록 복귀. 다른 계정 데이터나 삭제 사유 상세를 유출하지 않음 |

검증 422는 필드 오류로 READY에 머물며 입력을 유지한다. 429는 재시도 가능 시각을 표시하고 자동 반복하지 않는다. 5xx/timeout은 변경 명령이면 RESULT_UNKNOWN부터, 순수 조회면 '불러오지 못했어요. 다시 확인해 주세요.'로 처리한다. 구체 오류코드는 화면 문구 아래 진단 ID로 제공하며 DB·토큰·seed를 노출하지 않는다. 클라이언트 시간으로 계약 기한이나 군복무 완료를 판정하지 않는다.

## 뒤로가기와 이탈 정책

- ROOT: 홈의 Android 뒤로가기는 OS 기본 종료 동작을 따르며 가짜 저장 완료 토스트를 띄우지 않는다.
- HOME: 현재 세이브 홈 또는 상위 목록으로 복귀. 세계 날짜·기록은 이동만으로 변하지 않는다.
- READ: 기존 목록의 필터·정렬·스크롤을 보존하고 복귀. 이전 선수/연도의 조회 캐시를 새 대상의 데이터처럼 보여주지 않는다.
- DRAFT: 편집 내용이 있으면 '초안으로 남기기 / 변경 버리기 / 계속 편집'을 제공한다. 초안은 같은 owner·대상·schemaVersion에만 복원하며 최신 검증 전 제출하지 않는다.
- CHOICE: 닫기/뒤로가기는 선택 미확정. 필수 사건은 task로 남고 홈에서 이어하기로 돌아온다. 뒤로가기를 거절·포기·은퇴로 해석하지 않는다.
- JOB: 닫아도 서버 작업은 계속. '진행 상황은 저장 관리에서 확인할 수 있어요.'를 표시하며 작업 ID를 보존한다.
- PREFERENCE: 기기 설정은 즉시 적용, 서버 개인 설정 실패는 해당 설정의 저장 상태만 표시한다. 게임 저장 실패로 통합하지 않는다.
- MIXED: 조회·기기/개인 설정·세계 변경·export job을 행동별로 분리한다. S40/S44/S45의 모든 버튼에 하나의 세계 저장 동작을 묶지 않는다.

SUBMITTING/RESULT_UNKNOWN에서는 어느 정책이든 이동을 막아 앱을 가두지 않는다. '결과 확인 중이며 나가도 확인을 계속합니다'를 안내하고 저널을 유지한다. 필수 선택의 진행 차단은 세계 날짜 진행에만 적용하며 기록 조회·설정·홈 이동은 가능하다. 화면 강제 종료 이벤트에 서버 저장을 의존하지 않는다.

## 포커스·키보드·내비게이션

오류 요약→첫 오류 필드,모달 닫힘→열었던 버튼,화면 전환→화면 제목 순으로 포커스를 옮긴다. 네트워크 자동 재시도·toast 등장 때 사용자 포커스를 빼앗지 않는다. Enter는 이름 IME 조합 중 제출하지 않는다. 선택카드에 Enter를 눌렀다고 최종 계약이 성립하지 않으며 별도 확인 CTA를 사용한다.

웹 history와 APK 뒤로가기는 같은 논리 경로를 사용한다. deep link는 owner+현재 phase 조회 후 합법 화면으로 이동한다. 복원 전용 job 화면은 완료 뒤 원본이 아닌 새 saveId를 연다. soft keyboard가 열리면 48px 주요 버튼을 키보드 위 또는 스크롤로 접근 가능하게 유지하고 safe-area와 본문 마지막 행을 겹치지 않는다. 화면 확대가 전역 가로 스크롤을 만들면 표 내부 스크롤 또는 단일열로 바꾼다.

## 화면별 검수 방식

각 화면은 복구표의 commonStates를 기본 적용하되 실재하지 않는 상태를 게임 상태로 생성하지 않는다. 예 S38 특성0은 정상 EMPTY, S29 제안0은 진로 복귀, S19 미완료 경기는 공식 빈 결과가 아니라 pending 안내다. 45행 전수 구조검사와 대표 레이아웃/복구 시나리오 실환경 검수를 분리한다. 확정 요청 전후 네트워크 끊김·계정 변경·두 탭·APK force-stop은 구현 후 시험한다.

2026-10-19 사용자 표시 정정 U: 홈/저장목록 이어하기의 정상 복원은76 최신 계약을 따른다. 중단 상태·복구 단계·RESULT_UNKNOWN 내부 안내를 별도 카드/문구로 노출하지 않고 **이어하기** 버튼에서 해당 게임 화면으로 연결한다. 실제 인증/연결 오류나 새 선택의 재확인만 필요한 화면에서 최소로 제공한다. 위 공통 기술 상태는 내부 복구 분류로 유지한다.

---

<!-- SOURCE: 81-EVENT-OCCURRENCE-COLLISION-AUDIT.md -->

# 81. 99개 이벤트 발생 근거·중복·충돌 최종 검토

2026-10-19. [발생 근거 감사표](event-occurrence-audit.json)는 E01~99 전부의 사건 범위·고유 근거·반복 정책·큐 분류를 정의한다. 기존 [45](45-EVENT-CATALOG-REVISION.md), [69](69-EVENT-COLLISIONS-PROVISIONAL-STATE.md)의 실제 조건·세계일 순서를 대체하지 않고 누락된 소스 구분을 채운다. occurrenceKey의 단순 id:saveId:season:source 표기보다 이 문서의 typed evidence 계약을 우선한다.

## 사건과 UI 안내 구분

E79 제안 초안·E82 보관 투입 미리보기·E83 난이도 확인은 폼 표현이다. 저장된 세계의 필수 사건으로 만들지 않으며 아직 saveId가 없어도 owner/draftId로 다룬다. CONFIRM_IMPORT는 생성 요청의 선택을 확정하는 폼 행동이고 실제 복사본은78 생성 커밋에서만 만든다. 이미 존재하는 구단으로 원본을 넣는 기능을 이 이름만으로 추가하지 않는다. E97도 고용 미리보기와 실제 HIRE_RETIRED_STAFF를 구분한다.

OPEN_*/BACK_*/WATCH_*/SKIP_*는 기본적으로 조회·내비게이션·감상 선호이며 도메인 변경 명령으로 추정하지 않는다. ACK_*는 사건 읽음/확인만, 이미 확정된 부상·수상·특성·기록 효과를 재적용하지 않는다. ACCEPT/CONFIRM/ADVANCE라도 이름으로 권한을 정하지 않고 각 분야의 서버 핸들러에 명시 매핑한다. CHOOSE_FOCUS는 정확4개 검증을 갖는 SET_FOCUS, KEEP_FOCUS는 현재 계획 유지이며 새 성장 지급이 아니다.

## 고유 근거 계약

persisted eventInstance의 unique key는 (saveId,eventDefinitionId,typedEvidenceKey). evidenceKey는 임의 문자열 연결이 아니라 버전이 있는 구조체를 canonical 직렬화한다. 복원 분기는70의 simulationKey를 근거로 복사하되 물리 eventInstance/receipt ID는 분리한다. 원본 서버 ID를 다른 save에서 그대로 unique로 재사용하지 않는다.

- 부상 E21~23은 injuryId+진단/재활/회복 단계. 같은 시즌에 다른 부상이 나도 새 사건이며 같은 부상 알림 재조회는 중복이 아니다.
- 계약·드래프트는 offerSet/routeProgram/window ID. 한 시즌 두 계약 창을 합치거나 첫 계약이 다음 시즌 사건을 영구 차단하지 않는다.
- 첫 기록 E24는 첫100안타/10승/20세이브 각각 milestoneKey. 같은 경기 다중 달성은 알림 묶음이지만 근거 원장은 각각 보존한다.
- 대표 E44/45는 최종 선발의 상호배타 결과. E46은 첫 실제 출장 근거, E47은 개인 병역 자격 근거이며 단순 메달 획득·명단 등록으로 대체하지 않는다.
- E37/E69는 하나의 은퇴 receipt에 대한 국내/미국 경력별 문안 대안. 원본을 두 개 만들지 않는다.
- E84/E85는 동일 특성 근거의 신규 알림/도감 조회. 모든 보유 효과 자동 적용을 유지하고 장착 선택을 재도입하지 않는다.
- E87은 pitchId+통과 등급+확정 receipt. pending 경기의 임시 XP는 공식 알림을 미리 지급하지 않는다.
- E95/E96은 관계 단계와 실제 대진/같은 팀 등록 증거. 미래 일정이나 단순 이적 제안으로 발생하지 않는다.
- E98은 경기 전 감상 방식 선택의 UI 알림. 실제 완전 감상은 FINAL 로그만 사용하고, 경기 미완료이면 처리 중 안내와 현재 확정 청크만62에 따라 제공한다. 감상 선택/스킵이 경기 RNG나 점수를 변경하지 않는다.

## 큐와 기한

FORM/PRESENTATION은 세계 차단 큐 밖. NOTICE는 묶어서 읽을 수 있고 읽지 않아도 기한을 소모하지 않는다. OPTIONAL은26의 일반 사건 후보에서 자격·시즌 상한·쿨다운을 검사한다. 같은 체크포인트 최대1/시즌 최대3,일반2시즌 쿨다운은 기존값 유지. 최초 E10은 첫 콜업 조건과 일반 후보 기회 조건을 둘 다 만족해야 하며 필수 콜업을 차단하지 않는다.

DEADLINE/REGISTRATION/HEALTH/CONTRACT/ROUTE/SEASON은 분류이지 무조건적인 모달 순서가 아니다. 실제 기한→69의 세계일 처리 단계→source sequenceNo→eventId 순으로 정렬한다. 게임 중 pendingGame을 먼저 완료하며 만료 전 합법 명령의 권리는 커밋 순서로 판단한다. active blocking task는 하나. 다른 task는 원래 deadline을 보존하고, 앞선 시스템 작업 때문에 선택이 불가능했던 기간을 사용자 방치로 처벌하지 않도록 같은 게임일을 넘기지 않는다.

## 경계 사례 판정표

| 경계 상황 | 최종 판정 |
|---|---|
| 대학2학년 조기 미지명 | 복학 가능하면 E74,잔여 준비 횟수만으로 E35 강제 은퇴 금지 |
| 대학 조기지명 후 계약 거절 | 계약 미체결 상태와 학적 자격 재검사,학교 복귀 경로 보존 |
| 4학년 졸업과 미지명 | 졸업 확정→합법 재도전·미국 유효 오퍼 검사→전부 없을 때만 은퇴 |
| 미국 조건 충족, 유효 오퍼0 | 미국 진로 카드 없음. KBO/대학 등 나머지 합법 경로 유지 |
| 미국 오퍼 조회 후 대학 입학 | 조회는 진로 고정 아님. 입학 커밋 후 미국 수락 preview는 충돌 |
| 오퍼 확인 중 기한 만료 | 기한 후 추첨·비용0,유효 다른 경로. 가짜 '계약 완료' 출력 금지 |
| 포스팅 실패·제안0 | 국내 원계약 보존. 능력 하락·자동 FA 없음 |
| 복무 기한과 국가대표 명단 | 개인 자격 확정 전 복무 의무 유지,명단만으로 면제 없음 |
| 메달·개인 자격·복무 시작 |21의 자격 및 현재 실제 복무 상태 우선,과거 receipt 소급 취소 없음 |
| 휴학 중 군복무 완료 | 세계 날짜/나이는 진행,학년 동결 후 현재 학교 합법 상태 복원 |
| 당일 부상과 차출 | 부상 최종 근거 후 자격 재검사,참가 불가 이유와 대체 처리 |
| 시즌 중 리그 이동·강화 | worldSeasonId당1회,이동 후 새 기회 지급 없음 |
| 부상으로 강화 연기 | 기회 유지,기간 끝 직전 미해결 처리. 자동 진행이 대신 포기하지 않음 |
| 같은 경기 특성·목표·연대기 |통계1회,각 고유 근거 정산,목표 보상은 기념품만 |
| 은퇴와 미완료 경기 |은퇴 가능 phase 검사,pending 경기 공식화 전 기록을 원본에 합산하지 않음 |
| 지도자 채용과 선수 복사 |source claim1개,패자 요청은 생성·비용·급여0 |
| 창 닫기·앱 종료 |task 미확정 유지,거절·포기로 변환하지 않음 |
| 오래된 이벤트 deep link |현재 owner/근거/phase 재검사,해결된 효과 재실행0 |

본문 문안은 도메인의 실제 delta와 receipt에 맞춰 렌더링한다. 확정 전 '입단했습니다/복무가 끝났습니다' 같은 결과 문구를 성공처럼 먼저 쓰지 않는다. 군복무·리그 규칙은 독자 게임 규칙이며 현실 법률·규약 안내로 표시하지 않는다.

## 수용 조건

99개 ID가 감사표에 정확1회. 각 typedEvidence source가 없으면 이벤트를 발행하지 않고 진단하며 임의 sourceEntityId로 보충하지 않는다. 발생 근거 확인과 최종 선택 시 조건 검사를 모두 수행한다. 같은 근거 replay는 신규 효과0,다른 부상/계약/대회 근거는 적절한 새 사건. 감사표 검사는 구조 검사이며 실제99개 핸들러 실행 시험이 아니다.
첫플레이 동선 후속: [113](113-FIRST-CAREER-SEASON-EXPERIENCE.md)에서생성→고교→졸업→진로별첫시즌의안내·주행동·정산/등록/출장경계를연결한다. 새도메인사건/보상/지명보장은없고 [동선보드](first-career-board.html)는읽기시안이다.

---

<!-- SOURCE: 82-PROBABILITY-EFFECTS-CONFIRMATION-AUDIT.md -->

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 투구폼·좌우 상성은 새 확률 표면이 아니라 기존 타석 logit 합산의 구성요소이며 ±.10 cap 안에서 원합·적용합 구분 표시를 따른다.

# 82. 확률·정확 효과·최종 확인 표시 최종 계약

2026-10-19. U: 의미 있는 확률 결과는 모두 표시, 실제 확률1의 숫자 배지는 숨김, 단순 변경에 '적용100%' 없음. U: 정확한 강화 증가량·비용을 잠재력 비공개보다 우선. [38](38-PROBABILITY-DISPLAY.md), [75](75-EXACT-EFFECTS-PUBLIC-INFORMATION.md)의 표시 원칙을 [20개 표면 등록부](probability-surface-register.json)로 연결한다.

## 표기와 분모

EXACT는 동일 preview/commit evaluator로 계산한 값, ESTIMATED는 미래 상태를 모델링한 전망이며 '예상'과 평가 시점을 붙인다. RANKED는 점수·순위 기반이고 백분율을 발명하지 않는다. CONDITIONAL은 '부상이 발생했을 때 중대 부상 비율'처럼 조건을 반드시 적는다. 확률이 없는 DETERMINISTIC/EVIDENCE/TECHNICAL은 odds=[]다. 100이라는 능력치·잠재력 수치는 정상 표시한다.

형식 데이터는 {surfaceId,target,outcomeKey,kind,probability?,range?,conditioningEvent?,asOfRevision,rulesVersion,partitionGroup?,eligible,reasonCodes}. 확률 필드가 없다고0으로 바꾸지 않는다. 서버 NaN/Infinity/범위 밖 값을 받으면 '확률 정보를 확인하지 못했어요'로 해당 확정 행동을 차단하고 진단한다. 0과1은 오차 허용으로 뭉개지 않고 최종 evaluator의 정확한 값으로 판정한다.

D 표시 규칙: 0<p<1인 값은 우선 소수2자리 백분율로 반올림하고 끝0 제거. 반올림 결과가0 또는100이면 소수 정밀도를 늘린다. 여전히 끝점으로 보이면 '0.0001% 미만' / '99.9999% 초과 · 확정 아님'처럼 비확정임을 유지한다. 정확p=0은 '성공률 0%'와 이유,정확p=1은 숫자 배지 없음. 추정 범위 상단이1인 것은 확정이 아니며 '예상 70~100%'처럼 범위와 예상 라벨을 함께 표시할 수 있다.

| 실제 p | UI 예시 |
|---|---|
| .63 | 탐색 성공률 63% |
| .9996 | 성공률 99.96% |
| .0004 | 성공률 0.04% |
| 1 | 성공 보장. 숫자 확률 없음 |
| 0, 유효 선택 | 성공률 0% + 원인 |
| 후보0으로 실행 불가 | 해당 조건의 새 후보 없음 + 실행 비활성,비용0 |
| 미평가 | 평가 대기 + 확정 차단 또는 확률과 무관한 합법 조회 |

독립·상관 결과의 주변 확률을 합100으로 강제하지 않는다. 같은 partitionGroup의 상호배타·전체 결과만 합1을 검사한다. 영입은 내 구단/다른 구단/미계약의 분포이며 공개 UI에 타구단 비공개 제안 금액을 노출하지 않는다. 도전 강화는 성공/실패,드래프트는1~10라운드/미지명,부상 중증도는 부상 발생 조건부3분류다.

## 최종 확인 카드

대상명 → 현재 상태·기준 라운드 → 실제 비용/횟수 → 확률 대상과 숫자 → 성공·실패의 정확 효과 → 변화하지 않는 조건·불가 이유 → 최종 CTA. 숨은 정보가 없어도 긴 도움말에 핵심 실패 비용을 감추지 않는다. 카드 선택은 미리보기이고 최종 CTA가 명령이다. 제출 직전 revision이 바뀌면 새 값을 비교 표시하고 다시 확인받는다. 변경된 확률로 자동 실행하지 않는다.

강화: A90/P91.25/피로95이면 '성공률60% / 성공+1.25 / 실패+0 / 어느 쪽이든 피로+5 / 시즌 기회1회'. 치트 A98.75/P100이면 '성공 보장 / +1.25 / 실제 피로 변화 / 기회1회'다. 실제 상한 여유<1은 대상 불가로 표시한다. 효과를 정수로 둥글려 원장보다 크게 약속하지 않는다.

스카우트: '새 적격 후보 발견63% / 성공시 최대3명 / 비용500만원 / 남은 월 횟수'. 발견은 계약·최고 잠재력 보장이 아니다. 실패 비용·횟수 소모도 함께 표시한다. 치트에서는 적격 N>0이면 발견 보장,수치 배지 없음. 후보0은 치트도 불가다.

영입: '이번 라운드 수락 가능성'과 금액·기간·예약을 표시한다. 명령 전송 성공률처럼 쓰지 않는다. 받는 커리어 오퍼의 수락은 이미 존재하는 계약 조건 확인이며 구단 영입 추첨 UI를 복사하지 않는다.

드래프트: '지명 확률50% / 지명된다면10라운드 유력'을 구분한다. B45의 전체 분포는10라운드40%,9라운드10%,미지명50%. 확정 결과 화면에는 실제 라운드·구단·계약만 주정보로 표시하고 과거 전망은 비교 정보다. 지명률이 확정이어도 라운드 전망은 유용하므로 숫자 배지만 숨기고 예상 라운드를 지우지 않는다.

## 자동 진행과 조회 경계

다음 경기 전에는 실제 출전 조건의 경기당 부상 위험을 선수 상태 도움말에서 확인할 수 있다. 수주/시즌 자동 진행에 경기당 위험을 기간 전체 확률처럼 복사하지 않는다. 미래 출장·피로 경로가 미확정이면 누적 숫자를 만들지 않고 '출전 경기별로 판정,부상·필수 선택 발생 시 중단'으로 설명한다. 회복은 남은 팀 경기수이며 매일 회복 확률을 별도 추첨하지 않는다.

타석·진루는 사용자가 개별 행동을 선택하는 게임이 아니다. 확정 중계의 계산 근거 상세에서 실제 판정 확률을 회고 조회하고 중계 보기·스킵 버튼에는 확률을 붙이지 않는다. 내부 RNG의 모든 가지를 홈 화면에 나열하는 것으로 '모든 선택 확률 표시'를 해석하지 않는다. 결과 확률을 숨은 잠재력·seed 공개 통로로 확대하지 않는다.

일반 서사 발생의 모형이 실제 정의돼 있으면 발생률을 선택 성패와 분리해 도움말에 공개한다. 아직 실행 모형이 없는 텍스트 이벤트에는 임의 성공률을 추가하지 않는다. 순위 선발·포지션 적응 완료도 기존 도메인 조건 판정이면 기간·점수·자격으로 표시한다.

## 검수

등록부 모든 화면 ID가 존재하고 kind별 필수 데이터가 채워져야 한다. 0/1/근접 끝점/추정 범위/복수 결과/기준 시점 변경/치트 override/후보0을 점검한다. 정적 설계 검사는 등록부와 예시값만,실제 화면의 p와 명령 evaluator 일치는 구현 후 통합 시험으로 입증한다.

---

<!-- SOURCE: 83-VISUAL-ASSETS-ACCESSIBILITY-HANDOFF.md -->

# 현재 적용 아트 기준 — 2026-10-20

청춘 야구 애니 사건 그림·얼굴 없는 실루엣14종이 승인 반영됐다. 이미지 레지스터 EXISTS80/TODO0이며 실루엣 미제작·빈티지 최신·나이별 얼굴 프리셋 문구는 폐기된 이력이다. [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)·[124](124-IMAGE-PRODUCTION-BRIEF.md)·[127](127-CODE-DISPLAY-SPECIFICATION.md)·[128](128-PREIMPLEMENTATION-SCREEN-AUDIT.md)을 해당 범위에서 우선한다. 실제 픽셀/브라우저 검수 완료는 아니다.

# 83. 시각 디자인·이미지·접근성 인계 기준

2026-10-19. [03](03-UX-DESIGN.md), [27](27-UI-INTERACTION-RESPONSIVE.md), [37](37-BRAND-TEAM-LOGOS.md), [46](46-ALL-SCREENS-FLOWS.md)의 시각 방향을 구현자가 재현할 수 있게 정리한다. 이 문서는 서면 검수 기준이며 기존 HTML의 픽셀 검수 통과나 사용자 디자인 최종 승인을 뜻하지 않는다.

## 화면의 시각 우선순위

모든 화면에서 세이브·모드·게임 시각 → 현재 상황 → 핵심 수치 → 입력·효과·확률 → 최종 행동 순서를 유지한다. 커리어의 대표 정보는 이름·나이·소속·역할·종합,구단은 팀·일정·순위·가용 예산이다. 진행 버튼과 같은 크기의 장식 버튼을 여러 개 놓지 않는다. 계정 메일·내부 ID·기술 로그를 게임 헤더에 노출하지 않는다.

배경 #F4F6F8,카드 #FFFFFF,본문 #172B4D,보조 #526477,선 #DCE3EB,진행 #146C43,강조 #B4540B,위험 #B42318. 구단색은 로고·얇은 표식·유니폼에 사용하고 본문 배경 대비를 우선한다. 정보 의미는 색+텍스트/아이콘으로 전달한다. 상승 +1.25/하락 −0.5,선택됨 체크,미해결 라벨처럼 색 없이도 읽을 수 있어야 한다.

제목 검은고딕,본문 Noto Sans KR,실패시 시스템 한글 고딕. 본문16/행간1.5,보조14,제목24,핵심 종합32,카드 숫자26을 D 기본으로 한다. 숫자는 tabular-nums. 글자 확대시 폰트 크기를 자동 축소해 맞추지 않는다. 모바일 시스템 큰 글자·웹200% 확대에서도 정보와 행동을 보존한다. 글꼴 파일·라이선스는 자산 목록을 유지하고 실제 배포 패키지에 포함할 때 확인한다.

## 그림과 로고 배치

| 자산/영역 | 용도 | 대체·제약 |
|---|---|---|
| 승인 청춘 애니 hero(활성 파일은 레지스터) | 홈 hero·시즌 표지,텍스트 위에는 단색/그라데이션 | 장식 alt 빈 문자열. 불러오기 실패시 남색 배경 |
| 승인 사건 장면 | 사건 분위기·회고 | 선수 본인의 외형 확정이 아님. 선수 식별 카드는 승인 실루엣 사용 |
| 팀 공식 로고 | 팀 선택·계약·순위·헤더 | 팀명 텍스트 항상 병행,32~48px contain. 로고 실패시 팀 약칭+색 표식 |
| 선수 실루엣+이름 카드 | 선수 식별 | 승인 타자6·투수8의 투타/폼에 맞춤. 나이는 텍스트, 개인 사진 업로드 없음 |
| 라인업 다이아몬드 | 수비 위치 시각 보조 | 동일 기능의 접근 가능한 슬롯 목록 필수 |
| 능력 레이더 | 여섯 능력 분포 보조 | 6개 수치 목록과 종합 평균 필수. 면적만으로 능력 비교 금지 |
| 기념 카드 | 시즌·은퇴·연대기 내보내기 | 외부 배포 권리 미확인 로고는 팀명·색상으로 대체. 개인 인증 정보 제외 |

현재 저장소 자산을 디자인 참고로 보유한 사실이 외부 배포 권한 확인은 아니다. 새로운 실제 선수 얼굴이나 참고 사이트의 아트를 복제하지 않는다. 초상 미생성·파일 오류가 경기·계약·생성 자체를 막지 않는다. 로딩 중 이미지 공간을 예약해 확인 버튼이 갑자기 이동하지 않게 한다. 중요한 수치·확률·효과를 이미지 안에만 적지 않는다.

## 반응형 유형별 규칙

| 유형 | 화면 | 모바일 | 큰 화면 |
|---|---|---|---|
| 홈·대시보드 | S01/03/13/30/35 | 단일열,이어하기·진행 우선 | 주정보/일정·할일 보조2열 |
| 생성·폼 | S02/12/15/17/22/36/39/43 | 단계 하나씩,요약 접기,오류 인접 | 입력/고정되지 않는 요약 패널 |
| 결정·계약 | S05/06/08/23/24/26/28/29/31~34/41 | 카드 세로,성패 효과 비교 | 카드2열 가능,최종 확인 동일 |
| 기록·목록 | S04/07/10/14/18/19/25/37/38/40/42/45 | 핵심 열+전체 기록 전환,표 내부 스크롤 | 고정 이름열+정렬·필터 |
| 선수·보관 | S09/11/16 | 실루엣 카드→헤더→종합→6능력→상세 | 실루엣 카드·능력/기록2열 |
| 작업·설정·복무 | S20/21/27 | 현재 상태와 다음 합법 행동 | 진행 단계/설명 패널 |
| 문자 중계 | S44 | 한 타석 텍스트·고정 점수판·감상 제어 | 중계/박스스코어2열 |

분류는 시각 재사용 기준이며45화면 전수 승인으로 대신하지 않는다. 360/390/768/1280px에서 화면 내용이 잘리는지 본다. 360px에서는6능력3열×2행 또는 긴 이름시2열×3행,종합은 별도 한 줄이다. 100.0/100과+1.25처럼 자릿수 경계에서도 겹치지 않는다. 표 외 문서 전체의 가로 스크롤은 없게 한다.

하단 CTA와 모드 탐색은 safe-area를 포함하며 스크롤 끝에 같은 높이 여백을 둔다. 키보드 표시시 선택 필드·오류·확정 버튼 접근을 보장한다. min-height만 사용하고 카드의 긴 사건 문안을 고정 높이로 자르지 않는다. 버튼48px/터치44px 이상,인접한 삭제·확정 버튼 간격을 확보한다.

## 접근성·동작 검수 항목

V01 제목 계층과 랜드마크, V02 모든 폼 label·설명·오류 연결, V03 키보드 focus-visible, V04 대화상자 focus trap/복귀, V05 200%·시스템 큰 글자, V06 360px·safe-area·키보드, V07 이미지 실패·alt, V08 폰트 실패·레이아웃 안정, V09 표 caption/열머리/정렬 상태, V10 색 이외 상태 구분, V11 reduced-motion, V12 결과·오류 live 영역, V13 긴 숫자·이름·라벨, V14 확률 극단값·보장 배지 숨김, V15 중계 속도·스킵·일시정지.

알림 live는 결과 완료·새 난이도 발견 등 의미 있는 한 번의 변경에 사용한다. 중계 매 타석과 배경 갱신을 동시에 screen reader에 강제로 읽히지 않는다. 읽기 속도·소리·모션은 개인 설정이며 경기 결과와 무관하다. 등장 효과·축하 애니메이션은 건너뛰기 가능하고 확률 실패를 다른 색의 작은 문구로만 숨기지 않는다.

## 실제 검수 산출물

각 대표 시각 유형마다 정상/로딩/오류/긴 데이터/200% 샘플을 캡처하고 {screenId,viewport,deviceOrBrowser,fontState,assetState,gameFixture,sourceCommit,result,issueRefs}를 기록한다. 기본 유형 검수 뒤45화면을 한 번씩 확인하고 새 문제가 있는 조합만 확대한다. 브라우저 rendering,실기기 터치,키보드와 OS 뒤로가기는 별도 증거다.

현재 상태: 서면 기준 작성,기존 정적 목업·로컬 이미지/로고 존재. HTML 구문·경로 검사는 가능하지만 렌더링/터치/스크린리더 검수는 미실행이다. 이 상태를 시각 승인 완료로 기록하지 않는다. 최종 구현 착수 전 패키지는 [84](84-DESIGN-GATES-END-TO-END-PATHS.md)를 따른다.
후속 제작 명세: [108 전체45화면 마감](108-ALL-SCREEN-FINALIZATION.md)과 [화면별 등록부](screen-finish-register.json)의 읽기 순서·크기·8상태·우선 그림 목록을 함께 적용한다. 기존 이미지의 보유와 새 최종 시안 제작/실제 렌더 검수는 구분한다.

109 후속: [마감 보드](finish-board.html)에기존 대표28에포함되지 않던17개화면의배치·8종 상태를추가하고새6컷PNG를적용했다. 위 본문의미제작17/PNG8개는이전시점이다. 현재총9PNG·45화면ID 대표연결,최종픽셀/브라우저실행미검수는유지한다. 상세범위와후속은 [109](109-FINISH-BOARD-ART-AUDIT.md).

---

<!-- SOURCE: 84-DESIGN-GATES-END-TO-END-PATHS.md -->

# 84. 설계 인계 게이트·24개 통합 경로

2026-10-19. 사용자가 요청한 남은6개 설계 검토를79~84로 정리하고 후속 난이도 결정은85에 반영한다. [통합 경로24개](end-to-end-design-paths.json)는 앱을 구현한 뒤 실행할 입력·효과의 연결 검수 계약이다. 파일 존재나 정적 구조검사를 실제 경로 통과로 보고하지 않는다.

## 요구 추적

| 요구 | 최신 계약 | 통합 경로 |
|---|---|---|
| 선수1명 커리어·가상 선수·실제 구단 배경 |19/37/79|P01/02|
| 타자·투수6능력·집중4개·평균 종합 |35/41/42/79|P01/02/13|
| 고교 KBO·대학·조건부 미국 |23/34/43/66/79|P03~10|
| 대학 조기 미지명 복학 |43/66/81|P04/05|
| 대표·국제대회·병역·상무 |20/21/69/81|P10~12|
| 시즌1회 강화·확정 성장·정확 효과 |42/75/82|P13|
| 특성 자동효과·구종 숙련·기념 보상 |56~58/65|P02/14|
| 협상·동료·라이벌 |59/60/81|P14/15/23|
| 은퇴·원본 보관·젊은 복사 선택 |32/42/61/70/79|P16~19|
| 독립 구단·보관0명·유한 경제 |44/61/79|P17/19~21|
| 확률 모두 표시·실제1 숫자 숨김 |38/40/75/82|P13/15/20/24|
| 커리어·구단 숨김 치트 |33/36/65/85|P02/13/24|
| 하드 경쟁 환경·구단 AI |85|P01/02/20/24|
| 확정 경기 감상·스킵·다시보기 |62/65/81|P23|
| 웹·APK 종료 후 이어하기 |74/76/78/80|P22/23|
| Neon 저장·백업·파일 |28/29/64/70/74/78|P21~23|
| 자연 전성기·암흑기 |68/72/73|P21|
| 이미지·서체·공식 로고 확인 |03/37/83|각 대표 유형|

모든 경로는 개별 정상 결과와 실패/미달 결과를 분리한다. 특정 seed가 반드시 스타·메달·미국 계약을 만들도록 조작하는 테스트가 아니다. 필요한 경계는 입력 fixture로 명시하고 RNG·작업자 장애를 주입하는 테스트는 개발 환경에서 수행한다.

## 설계 완료 판정과 실행 게이트

| 게이트 | 현재 산출물·상태 | 실제 통과에 필요한 증거 |
|---|---|---|
| G01 사용자 요구 추적 | 위 표와14/85,서면 작성 | 사용자 확정 U 변경 없음 또는 변경 기록 |
| G02 입력·화면·에러 계약 |79/80,45행 복구표 | 구현 후 실제 폼·라우터·기기 입력 시험 |
| G03 이벤트·확률 계약 |81/82,99행/20표면 | evaluator·handler 동일성,기한·충돌 시험 |
| G04 시각·접근성 기준 |83,기존 목업·이미지 | 브라우저/기기 캡처·키보드·확대·터치 |
| G05 통합 경로·불변조건 |24경로/71/73,계획 | 실제 receipts/state hashes/실패 보고서 |
| G06 저장·보안·배포 |28/29/70/74/76/78,계약 | 로그인·owner 격리·Neon·파일·백업/복원·웹/APK 실환경 |
| G07 난이도·밸런스 |42/68/73/85,수치D | 동일 seed 대조·장기 리그·성장/퇴단/XP 분석 |

G01의 문서 추적과 카탈로그 구조는 정적으로 검사할 수 있다. G02~07의 실제 실행 증거는 앱 구현 후에만 얻는다. 설계 문서가 상세해졌다는 이유로 구현·DB 배포·스토어 공개를 자동 시작하지 않는다. 사용자의 이후 착수 지시가 있으면 요구 범위를 유지한 채 작동하는 단위로 구현한다.

## 문서 우선순위와 인계

사람의 최신 결정 > U 결정 기록 > 14의 최신 연결 > 해당 분야 최신 문서 > 이전 초안. 85의 구단 치트 P100·성장3배는 이전 '구단 성장1배/새 P 정책 유지' 문구를 대체한다. 79는 생성 전 실제 로스터/개인 잠재력 추첨 미리보기 초안을 대체한다. 81 typed evidence는 단순 이벤트 고유키를 구체화한다. 이 우선순위는 통합 MD를 읽을 때도 동일하다.

인계 파일: START-HERE,STATUS,14,79~85,관련 기존 상세 문서,JSON 등록부·274개 서면 기대값,DESIGN-ALL,MANIFEST-SHA256. 스크립트는 문서 구조·링크·예시 산술만 검증한다. 원격 GitHub commit을 인계 기준으로 기록하고 실제 build/DB/Android가 통과했다고 적지 않는다.

## 구현 시 첫 검수 단위

생성·인증·저장 슬롯·조회·단일 명령 receipt·이어하기를 함께 만드는 것이 첫 작동 단위다. 이후 한 경기·기록→성장/강화→고교 진로→대학/미국/병역→은퇴/보관→구단 경제/시장→장기 연도→확장8기능 순으로 연결한다. 이는 구현 순서 제안이며 후반 기능을 최종 범위에서 제외하는 뜻이 아니다. 구현 전에 production 자격 정보나 실제 친구 계정으로 테스트 데이터를 만들지 않는다.

현재 남은 것은 이 문서에서 약속한 실환경 검증과 밸런스 확인이다. 새로운 취향 요구가 없다면 기능을 끝없이 늘리는 설계 단계보다 이 계약을 구현하며 검증할 준비가 된 서면 기준으로 삼는다. 다만 시각 최종 승인·실행 안정성·밸런스가 완료됐다는 의미로 '완벽'이라고 주장하지 않는다.

플랫폼후속인계:86지원범위및87~89의로그인·업데이트·파일계약을포함합니다. 최신서면기대값은298개이며CP01~06의8필수흐름을실제구현후검수합니다. 위274개표기는v0.14시점집계입니다.

---

<!-- SOURCE: 85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md -->

최종 수치 정합: [90](90-NUMERIC-LEDGER-CONSISTENCY.md)의기본XP20/예약/배율후소비/실제숙련증가분리와정수잔여규칙을함께적용합니다. 실제cap잔여만으로지급하지않으며팀이동으로기본예산을초기화하지않습니다. 반값가져오기의1e-4단위반올림도90을따릅니다.

# 85. 커리어 하드 경쟁 환경·구단 하드·구단 치트 확정

2026-10-19. 이 대화의 사용자 후속 결정이 [36](36-CLUB-SECRET-CHEAT.md), [42](42-GROWTH-DIFFICULTY-REBIRTH.md), [57](57-REPERTOIRE-DETAILED-CONTRACT.md), [79](79-CREATION-FIELDS-VALIDATION-COPY.md)의 상충 부분을 대체한다. 사용자 방향 U와 아래 제안 수치 D를 구분한다.

## 사용자 결정과 적용 범위

U: 빠르게 성장하고 높은 잠재력을 가진 경쟁 환경 요청은 커리어 모드와 혼동했던 구단 질문에서 나온 것이다. 커리어 하드 경쟁자 규칙으로 정리하고 구단 난도 세부는 설계자에게 맡겼다. D: 커리어 하드는 NPC 경쟁 환경 강화,구단 하드는 동일 예산·동일 성장에서 AI 구성·영입 판단 강화를 사용한다.

U: 구단 치트는 내 구단 모든 선수의6잠재력100. 신규 영입·보관 투입 포함. U: 구단 치트의 내 구단 성장3배는 반드시 포함. 구종 숙련도도 성장3배로 연결하는 D를 사용하며 기존 커리어 구종3배 U와 일관되게 한다. 무제한 예산·적격 탐색 보장·유효 제안 수락 보장도 유지한다. 강화 성공 보장은 기존 커리어 주인공 치트 효과이며 구단 모든 선수에게 새 특별강화 행동을 만드는 요구로 확대하지 않는다.

## 모드별 정책표

| 모드 | 사용자 선수 양의 자연성장 | NPC 자연성장 | 잠재력 | AI |
|---|---|---|---|---|
| 커리어 일반 | 기준1.5배 | 기준1배 | 기존 생성 분포 | 기본 판단 |
| 커리어 하드 | 기준1배 | D 기준1.2배 | 주인공은 기존, NPC는 D 기본P+5/상한100 | 강화 판단 |
| 커리어 치트 | 주인공3배 | 기준1배 | 주인공6개100, NPC 기본 | 기본 판단 |
| 구단 일반 | 내 구단·상대1배 | 기준1배 | 기본 분포 | 기본 판단 |
| 구단 하드 | 내 구단·상대1배 | 기준1배 | 기본 분포 | 강화 판단 |
| 구단 치트 | 내 구단 선수3배 | 상대 기준1배 | 내 구단 선수6개100 | 상대 기본 판단 |

'성장3배'는 기준×3이지 일반1.5×3이나 NPC1.2×3이 아니다. 노쇠·피로·부상·강화 증가·기념 보상·지도자 보너스 수치 자체를3배하지 않는다. 성장 예산은42의 기간·출장·훈련 반영값에 난이도 배율을 한 번 적용한 뒤 집중 배분과 잠재력/능력 상한을 적용한다. 코치 보정과 구종XP는 기존57/61의 산식 위치를 유지하며 동일 배율을 다시 곱하지 않는다. 이벤트·코치의 고정 효과를 별도 원장으로 지급하는 경우 그 원장까지3배로 확대하지 않는다.

## 커리어 하드 NPC 생성과 성장 D

NPC는 주인공 이외의 가상 선수 전체이며 같은 팀 포지션 경쟁자도 포함한다. 팀을 옮겼다고 잠재력이나 성장 배율을 다시 바꾸지 않는다. 같은 generation seed의 기본 P를42 분포로 생성한 뒤 능력별 +5,상한100. 예 기본P82→87,95→100,현재A는 그대로. 주인공의 초기능력·P는 일반/하드 동일 seed 동일값,hard P 보너스0이다. 높은 잠재력은 처음부터 능력이 높다는 의미가 아니다.

처음 세계 생성 NPC와 향후 신인 모두 같은 규칙. 초기 노장도 현재 능력보다 낮은 P를 만들지 않는다. 보관 원본처럼 명시된 출처 규칙이 있는 선수는 source policy로 생성하고 하드 보너스를 중복 가산하지 않는다. 커리어에는 사용자 원본을 경쟁 NPC로 임의 주입하는 기능을 추가하지 않는다.

NPC 양의 자연성장 예산은42의 기간 정규화 후1.2배. 기본 예산10이면12,노쇠는 동일. 구종 XP도 NPC1.2배·세계시즌 cap24 D,주인공 하드 cap20. 일반 NPC cap20/주인공 치트 cap60은 유지. 하드의 강한 경쟁은 기용·선발 점수에 반영되지만 숨은 주인공 감점·경기 당첨률 보정·강제 패배는 없다. 부상률·계약 규정·드래프트 공개 evaluator를 몰래 어렵게 바꾸지 않는다.

숫자 +5/1.2/cap24는 D이며 장기 실험 전 확정 밸런스가 아니다. 성장·은퇴 분포가 무너지면 규칙 버전과 변경 기록을 남기고 재검토한다. 효과를 켜기 위해 진행 중 세계의P를 재추첨하지 않는다.

## 구단 하드 AI D

일반도 합법·일관된 AI를 사용하며 일부러 정원 오류나 터무니없는 계약을 만들지 않는다. 하드는 다음 검토를 추가한다.

1. 현재 1군 필수 포지션과2군 대체 깊이,부상·복무·계약 종료 예정 공백을 함께 평가한다.
2. 공개 스카우트 전망 범위를 써서 당해+향후2시즌의 연령·보직·비용을 비교한다. 숨은 raw P를 읽거나 주인공 preview를 역산하지 않는다.
3. 단순 전체 종합 최고 대신 포지션 필요도·노쇠·예산 예약·미래 보장액을 반영해 후보 집합을 평가한다.
4. 현재 계약 후보에서 합법 조합을 안정적으로 탐색하되 동일 seed/상태는 같은 계획을 만든다. 계획 생성은 실제 도메인 체크포인트에서 한 번,화면 새로고침마다 재추첨하지 않는다.
5. 스카우트 시설·횟수·비용·발견 확률은40과 동일. 조건 선택·공개 후보 비교가 정교해지는 것이며 탐색 보장이나 추가 행동권은 없다.

양쪽의 초기 예산·선수 공급·P 분포·기본 성장·성공률 evaluator는 동일하다. AI hard의 시간당 처리비용은 구현 후 측정하며 서버 작업 예산을 넘으면 같은 계획 작업을 이어간다. 짧은 처리 제한을 이유로 사용자와 다른 계약 유효성 규칙을 쓰지 않는다.

## 구단 치트 잠재력100의 생애 D

생성 때 사용자팀 모든 등록 선수,실제 영입/신인 계약/보관 투입/긴급 대체 계약이 확정돼 사용자팀 소유가 된 선수의6P를100으로 올린다. 내1군·2군·부상자 모두 포함. FA에 제안만 했거나 타팀 선수를 조회한 경우는 적용하지 않는다. 새 계약·팀 소유 변경과 P 변경을 같은 트랜잭션에 기록한다. 현재A는 상승시키지 않는다.

내 구단에서 나간 선수는 한 번 설정된 P100을 유지한다. D: 숨은 상한을 다시 낮춰 이미 획득한 성장·능력보다 낮게 만들지 않고,과거 치트 수혜 provenance를 남긴다. 새 팀에서는 자연성장·XP3배는 종료된다. 원래 보관 원본의 P/능력/기록은 바꾸지 않는다. 보관 복사본의 '반값A/새P'를 먼저 생성한 다음 치트 팀 정책으로 P100을 적용한다. 이 경우 원본 공개 전망을 복사본P의 증거로 재사용하지 않는다.

P100 확정 사실은 해당 선수 화면에 고정 정책으로 공개할 수 있다. '잠재력100'은 숫자 확률 배지가 아니므로 숨기지 않는다. 원본 출처와 현재 구단 치트 수혜는 별도 필드다. 같은 선수의 재영입은 P를 재추첨하거나 추가100을 가산하지 않는다.

## 성장 기간과 연간 XP

선수·worldSeasonId 성장 원장을 공유한다. 시즌 중 입단/이적/방출은 연속·비중복 등록 기간으로 나누고 각 기간의 소유팀 정책을 고정한다. 예 적격 성장일 절반 상대팀,절반 사용자 치트팀,다른 계수 같고 연간기준10이면 10×.5×1 + 10×.5×3 =20. 시즌 말 소속만 보고 전체30을 지급하지 않는다. 1군↔2군·부상 복귀가 같은 시즌 예산을 초기화하지 않는다.

구종XP는 획득 시점의 정책으로 양의 XP×3. 치트팀 소속일 때 해당 세계시즌 active cap60,다른 소속 cap20. player+season의 이미 쓴 XP를 유지한다. 치트기간30을 이미 쓴 뒤 일반팀으로 가면 회수하지 않고 일반기간 잔여 max(0,20−30)=0,재영입해도 새60을 추가하지 않고 cap60의 남은30만 가능하다. 특정 구종별 cap가 아니라 기존57의 시즌 XP 원장 범위를 그대로 따른다.

실제 부상 중 성장·현역복무 G0·학년 동결·노쇠·영구능력 최고 기록은 기존 규칙 유지. 정상적인 잠재력100은 자연성장을 즉시100까지 보장하지 않는다. 모든 능력100이면 초과 성장 예산 소멸 이유를 기록한다.

## 버전·저장·검수

새 difficultyPolicyVersion=2와 effectScope·beneficiaryPredicate·sourcePolicy를 save에 고정한다. 아직 출시된 앱 세이브가 없으므로 문서 v1을 실제 운영 데이터 마이그레이션으로 취급하지 않는다. 향후 실행 세이브가 있다면 조용한 자동 변경 대신 별도 호환 정책이 필요하다. 백업·복원·이어하기는 저장된 정책과 선수별 provenance를 그대로 복원한다.

서버는 클라이언트 arbitrary multiplier/P 값을 받지 않고 프리셋에서 계산한다. 홈·생성 요약·선수 상세·예산·스카우트 미리보기의 설명이 같은 정책을 사용해야 한다. 이스터에그 입력은33/36 그대로. 구단 치트의 새로운 효과를 초기 화면에 미리 광고하지 않는다.

검수12개: 하드 NPC P+5상한,주인공P불변,NPC성장12,구단 하드 동등 예산,치트 초기·영입·보관P100,실제A불변,반시즌20,퇴단P유지/배율종료,XP재영입 cap중복0,원본 불변. 실제 밸런스/경기/시장 시뮬레이션은 구현 후73 계획으로 수행한다.
능력상한·성적설명 후속: [112](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md)에능력100/잠재력100/실제AVG·SLG를구분하고고정대조군4개와균형실험6개를작성했다. 기존산식을바꾸거나시즌성적을보장하지않는다.

---

<!-- SOURCE: 86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md -->

플랫폼 후속 계약: [87 로그인·계정 전환](87-PLATFORM-LOGIN-ACCOUNT-HANDOFF.md), [88 업데이트·호환](88-CLIENT-UPDATES-COMPATIBILITY-RECOVERY.md), [89 파일 저장·공유](89-PLATFORM-FILES-DOWNLOAD-SHARING.md)를 적용합니다. 로그아웃은 결과 확인을 무한히 기다리지 않으며 이전 owner의 미확정 요청은 다른 계정에 노출·재실행하지 않습니다.

# 86. 안드로이드·아이폰·윈도우·맥 지원 범위

2026-10-19. U: 최초 요청은 웹앱+Android APK였으며 네 환경 모두 가능한지 확인했다. 기존06의 React/Vite 공통 UI·Hono API·Neon 저장 구조를 유지하고 브라우저 지원 대상을 명시한다. 아래는 지원 목표와 검수 계약이며 현재 실행 가능한 앱이 출시됐다는 의미가 아니다.

## 배포 형태와 범위

| 환경 | 기본 제공 목표 | 별도 설치형 |
|---|---|---|
| Android | 모바일 웹,홈 화면 웹앱 | 서명된 APK,기존 필수 범위 |
| iPhone | Safari 모바일 웹,홈 화면에 추가한 웹앱 | iOS 네이티브 패키지는 후속 선택 범위 |
| Windows | PC 브라우저 웹 | 전용 exe 설치형은 후속 선택 범위 |
| macOS | Safari/Chrome 계열 PC 웹 | 전용 dmg/app 설치형은 후속 선택 범위 |

APK는 안드로이드용이며 iPhone·Windows·macOS 설치 파일이 아니다. 네 환경의 브라우저 플레이는 하나의 반응형 웹을 배포해 지원한다. iPhone에서는 Safari의 홈 화면 추가로 앱처럼 실행하는 사용 경로를 제공한다. 이 경로를 App Store에서 설치하는 iOS 앱이라고 표현하지 않는다. 데스크톱 웹앱 설치 제공 여부는 브라우저 기능을 감지하고 설치 버튼이 없는 경우에도 일반 URL 플레이가 가능하게 한다.

D: 첫 배포는 네 환경의 웹+Android APK. iOS 네이티브나 Windows/macOS 전용 설치형은 사용자가 원할 때 추가한다. 지금 질문을 별도3종 네이티브 배포 지시로 확대하지 않는다. 모든 필수 게임 모드는 브라우저와APK에서 같아야 하며 iPhone이라고 대학·병역·구단 운영을 빼지 않는다.

## 공통 코드와 플랫폼 어댑터

공유: 화면·6능력·확률/효과 컴포넌트·폼 검증·API 클라이언트·진행 상태/명령 저널 규약. 엔진·RNG·세계 revision·계약/금액 판정은 서버가 권한을 가진다. 브라우저마다 계산 차이로 공식 기록이 달라지지 않게 한다. Neon DB/스토리지 비밀키는 서버 환경에만 둔다.

플랫폼 어댑터: 로컬 저널/초안,로그인 복귀,파일 다운로드·공유,앱 resume/visibility 이벤트,뒤로가기. 웹은 IndexedDB와 서버 인증 세션,Android는 앱 샌드박스 저널과28의 네이티브 인증 계약. UI가 Capacitor 전용 API를 직접 호출하지 않고 웹 fallback을 제공한다. 브라우저에 없는 공유·다운로드 기능 때문에 경기나 저장이 막히지 않는다.

iPhone Safari와 홈 화면 웹앱은 로그인/로컬 저장을 공유한다고 가정하지 않는다. 각 실행 환경에서 필요하면 로그인하고 같은 계정의 서버 확정 진행을 조회한다. PC↔스마트폰 역시 동일 로그인 계정으로 이어간다. 로그인 세션·미송신 초안이 기기 간 자동 복사된다는 뜻이 아니다. 두 기기에서 동시에 확정하면74의 revision 충돌과 receipt 규칙으로 중복을 막는다.

## PWA와 온라인 경계

manifest는 앱명 '다시, 플레이볼',icons,start_url,scope,standalone 표현을 갖는다. HTTPS 운영에서 홈 화면 경로를 검수한다. 웹 manifest·서비스워커를 갖추는 것은 구현 작업이며 현재 이 설계만으로 설치 기능이 동작하는 것은 아니다.

서비스워커를 사용할 경우 버전이 붙은 정적 UI 자산만 캐시한다. 인증·저장·개인 기록 API·짧은 서명 URL을 public cache에 넣지 않는다. 오프라인은 설치 셸·기기 설정·이전에 확인한 캐시 읽기까지,새 경기·계약·강화 등 세계 진행은 불가다. PWA 설치와 오프라인 게임 가능을 혼동하지 않는다.

새 자산 다운로드 후 업데이트 안내를 제공하고 미확정 명령/저널을 유실시키는 강제 reload를 하지 않는다. API 최소 호환 버전보다 오래된 웹/APK는 갱신 안내 후 새 명령을 차단하며 오래된 코드로 새 schema를 쓰지 않는다. iOS 배경 전환 때 작업자가 계속 실행된다고 가정하지 않고76의 서버 상태 조회로 복귀한다.

## iOS 네이티브를 추가한다면

기존 웹 UI를 Capacitor iOS로 재사용할 수 있지만 iOS 프로젝트·플러그인·인증 복귀·보안 저장·서명·배포·실기기 검수가 추가된다. APK를 변환하거나 확장자만 바꾸는 작업이 아니다. Capacitor 공식 문서상 iOS 빌드에는 macOS와Xcode 환경이 필요하다. 로컬 Mac 또는 macOS 빌드 환경 확보를 실제 착수 때 확인하며 현재 접근 가능하다고 주장하지 않는다.

배포 방식·Apple 계정·서명·테스트 배포/스토어 제공은 그 단계에서 별도로 정한다. 비용 결제·계정 등록·App Store 공개를 이번 설계 작업으로 실행하지 않는다. PC 전용 설치형도 동일하게 별도 래퍼·서명·업데이트 계약과 검수가 필요하다.

## 검수 대상

출시 시 안정 버전 및 직전 주요 버전을 D 브라우저 검수 정책으로 삼고 실제 OS/브라우저/기기 버전을 결과에 기록한다. Android APK 최소 OS는 채택할 Capacitor·플러그인 버전과 실기기 검수로 확정하며 임의 버전 숫자를 호환 보장처럼 적지 않는다.

CP01 Android Chrome 웹,CP02 iPhone Safari 웹,CP03 iPhone 홈 화면 웹앱,CP04 Windows Chrome/Edge 웹,CP05 macOS Safari/Chrome 웹,CP06 Android release APK. 각 대상에서 생성→1경기→저장→종료→같은 환경 복귀→다른 환경 동일 계정 이어하기,로그아웃·계정 격리,긴 이름·6능력·종합·확률·파일 다운로드를 시험한다. CP01~06은 검수 계획이며 실제 통과 결과가 아니다.

## 근거와 인계

2026-10-19 공식 문서 확인: [Capacitor 환경 설정](https://capacitorjs.com/docs/getting-started/environment-setup)은 Web/Android/iOS 대상과 iOS의 macOS/Xcode 빌드 환경을 안내한다. [Apple iPhone 사용 설명서](https://support.apple.com/en-mide/guide/iphone/iphea86e5236/27/ios/27)는 Safari에서 홈 화면 웹앱으로 추가하는 방법을 안내한다. 배포 시 문서를 다시 확인한다.

기존 웹/APK 표현은 이 문서의 네 환경 웹 지원을 포함하도록 읽는다. [76 이어하기](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md), [80 화면 복귀](80-SCREEN-STATES-NAVIGATION-RECOVERY.md), [83 시각 기준](83-VISUAL-ASSETS-ACCESSIBILITY-HANDOFF.md), [84 게이트](84-DESIGN-GATES-END-TO-END-PATHS.md)를 CP01~06에 적용한다. 최신 서면 기대값 수는 STATUS를 따르며 플랫폼6대상은 별도 계획으로 센다.

---

<!-- SOURCE: 87-PLATFORM-LOGIN-ACCOUNT-HANDOFF.md -->

# 87. 플랫폼별 로그인·계정 전환·기기 간 이어하기

2026-10-19 / 서면 기술 기본안 D. [16](16-AUTH-OPERATIONS.md)·[28](28-DATA-API-AUTH-TESTS.md)의 인증 후보·허용 목록·앱 세션 계약은 유지한다. 실제 인증 SDK/관리형 서비스 지원을 확인하거나 배포한 문서가 아니다. [86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md)의 네 환경 웹+Android APK를 연결한다.

## 공통 진입 상태

BOOT → CHECK_SESSION → SIGNED_OUT / VERIFY_EMAIL / ACCESS_PENDING / AUTHENTICATED → RECONCILE → HOME_OR_RESUME. CHECK_SESSION 중 저장 목록·이전 계정 이름을 먼저 렌더링하지 않는다. RECONCILE은 같은 owner의 creation/command 저널 확인→서버 최신 저장→resumeDescriptor→초안 검증 순서다. 로그인 성공을 새 게임 생성이나 자동 다음 경기 명령으로 연결하지 않는다.

| 상태 | 문구와 행동 |
|---|---|
| 세션 없음 | '로그인하면 저장된 게임을 이어갈 수 있어요.' 로그인/가입 |
| 이메일 확인 전 | '이메일 확인 후 다시 로그인해 주세요.' 제공자 지원 확인·재발송 흐름 |
| 인증됨·게임 미허용 | '현재 초대한 사용자만 이용할 수 있어요.' 다시 확인/로그아웃 |
| 세션 유효·목록0 | 정상 신규 계정. 선수 커리어/독립 구단 시작 |
| 세션 만료·미확정 명령 있음 | '다시 로그인한 뒤 처리 결과를 확인할게요.' 같은 ID 보존 |
| 인증 서버/네트워크 장애 | '로그인 상태를 확인하지 못했어요.' 재시도. 로그아웃 확정·새 계정 생성으로 오인하지 않음 |
| 계정 변경 | 이전 데이터 가림→현재 owner namespace 선택→서버 조회 |
| 서버 계정 철회·삭제 진행 | 쓰기 차단,계정 작업 상태·로그아웃·지원용 진단 ID |

허용 목록은 서버 인증 subject 기준이다. 자기 이메일을 입력해 게임 접근 권한을 추가하는 공개 버튼·공유 초대 코드를 도입하지 않는다. 가입 가능한 것과 게임 이용 가능한 것은 별개이며 인증 오류로 이메일 존재 여부를 노출하지 않는다. 구현 단계의 운영자 등록 방법은 서버 관리 경로로 정한다.

## 환경별 인증 경로

CP01/02/04/05의 브라우저 웹은 같은 origin 서비스와 관리형 인증 SDK를 우선한다. HttpOnly/Secure 쿠키·CSRF·세션 검증은28을 따른다. 프런트가 임의 JWT를 만들거나 앱 DB에 비밀번호를 저장하지 않는다. API가 확인한 owner 식별자는 UI의 임의 이메일/요청 ownerId와 구분한다.

CP03 iPhone 홈 화면 웹앱은 별도 실행 환경으로 취급한다. Safari에서 로그인했으니 홈 화면 실행도 인증됐다고 가정하지 않고 세션을 다시 확인한다. 필요한 경우 그 환경에서 제공자 로그인 흐름을 수행하고 서버 저장 목록을 조회한다. Safari의 미송신 초안·선택 상태까지 자동 이동시키지 않는다.

CP06 Android APK는 시스템 브라우저 로그인→검증된 HTTPS App Link 복귀→일회용 code+state와 PKCE verifier 교환→앱 세션 저장이다. access/refresh token을 URL·명령 저널에 넣지 않는다. code60초/단일사용/등록redirect와 client challenge 바인딩은 기존16/28 유지. 앱 종료·콜백 재수신은 exchange 처리의 멱등/소모 상태를 확인하며 새 게임 명령을 실행하지 않는다.

복귀 링크를 받은 것만으로 로그인 성공으로 처리하지 않는다. 앱이 시작한 state와 origin/host/path,유효 세션 교환 결과를 확인한다. 링크 검증 실패·만료·다른 기기 열기는 '앱에서 로그인을 다시 시작해 주세요.'를 안내한다. 외부 인증 SDK가 이 흐름을 지원하는지는 구현 시 검수하고,지원 불가라면 토큰 URL 전달 같은 임의 우회를 사용하지 않는다. 도메인·서명·App Links 연결은 실환경 검수 항목이다.

## 같은 계정으로 다른 기기에서 계속하기

1. 새 환경에서 로그인·게임 허용 여부 확인.
2. 계정의 미확인 생성 작업과 최근 저장 목록 조회. 생성 접수 후 응답 유실은78의 owner-scoped creationId로 발견한다.
3. 사용자가 저장을 열면 서버 resumeDescriptor와 현재 revision을 받는다. 이전 환경의 화면 URL이나 캐시 state를 서버에 덮어쓰지 않는다.
4. 미해결 사건·pending 경기·복무·연도/복원 job은 동일 대상에 연결한다. 다른 기기의 명령이 아직 진행 중이면 현재 작업을 보여주고 충돌하는 새 명령을 차단한다.
5. lastPlayedSaveRef는 명시적 열기/이어하기에서 개인 preference CAS로만 갱신한다. 단순 로그인·목록 조회·생성 완료로 바꾸지 않는다.

양쪽 기기의 조회는 동시에 가능하다. 쓰기는 서버 revision/단일 명령 원자성으로 조정하고 '새 기기가 이전 기기를 강제로 인수'하는 잠금은 추가하지 않는다. 뒤늦은 기기는409 후 초안 유지·최신 상태·새 미리보기·재확인 순서를 따른다. 성공한 효과를 취소하거나 두 기기의 경기를 병합하지 않는다.

다른 기기에 송신 저널이 없더라도 이미 서버가 접수한 작업·blocking task·resume 대상은 소유자 조회로 발견돼야 한다. 서버 접수 전 초안이나 전송되지 않은 클릭을 원격에서 복구한다고 약속하지 않는다. 홈은 '서버 저장됨/처리 중/이 기기의 초안'을 서로 다른 상태로 표시한다.

## 로그아웃과 계정 전환 정합

기존16의 '결과 조회 후 로그아웃'은 가능한 경우 먼저 결과를 확인한다는 순서다. 네트워크가 끊겼다고 로그아웃을 무기한 막지 않는다. owner가 바뀌기 전에 UI의 이름·저장 목록·캐시를 가리고 개인 구독/폴링을 중지한다. 토큰·세션 참조를 정리하며 사용자 게임을 삭제하지 않는다.

미확정 명령 ID는 인증값이 없는 최소 owner-scoped journal로 분리 보존할 수 있다. 다른 계정은 접근/표시/재송신할 수 없고 원래 계정으로 재로그인했을 때만 결과를 조회한다. 웹 저장소 자체를 사용자가 지웠다면 서버 접수 결과만 복구 가능하다. 로그아웃 과정에서 저널을 지우는 클라이언트는 그 전에 서버 owner-scoped 결과 복구 경로를 보장해야 한다.

온라인 로그아웃은 제공자 세션 종료와 앱 세션 철회를 요청한다. 오프라인이면 '이 기기에서 로그아웃했습니다. 서버 세션 종료는 연결 후 확인이 필요합니다.'처럼 범위를 명확히 한다. 공유 브라우저에서 남아 있는 제공자 세션을 곧바로 게임 자동 로그인으로 사용해 이전 계정을 노출하지 않도록 명시적 재진입을 요구한다. 전체 기기 로그아웃은 실제 제공자/앱 서버의 철회 완료가 확인될 때만 완료로 표시한다.

이미 인증·접수된 명령은 로그아웃이 취소 명령이 아니다. 서버 트랜잭션이 완료될 수 있고 재로그인 후 동일 receipt를 보여준다. 계정 삭제는 별도 재인증·삭제 job이며 로그아웃과 결합하지 않는다. subject를 삭제했는데 기존 서버 작업이 데이터를 되살리는 경합은 삭제 상태/쓰기 잠금으로 차단하는 기존 운영 검수를 적용한다.

## 진단과 수용 조건

로그에 requestId/clientPlatform/clientRelease/authState/errorCode 정도만 남기고 이메일·token·교환code·verifier·쿠키는 제외한다. 인증 성공과 게임 접근 거부를 서로 다른 진단 코드로 구분하되 화면에서 타인 정보를 드러내지 않는다.

[플랫폼 검수 계획](platform-experience-contracts.json)의 CP01~06 및 [기대값](platform-experience-fixtures.json)의 auth8개를 구현 후 실행한다. 계정A 미확정 명령→로그아웃→B 로그인→A 재로그인,두 기기 같은 save 확정 경합,Android 콜백 만료/중복,홈 화면 별도 로그인·PC 이어하기를 포함한다.

외부 동작 근거: [Capacitor deep links](https://capacitorjs.com/docs/guides/deep-links), [Android App Links](https://developer.android.com/training/app-links/about). 2026-10-19 확인. 서비스별 인증 SDK·도메인 연결은 구현 시 다시 확인한다.

---

<!-- SOURCE: 88-CLIENT-UPDATES-COMPATIBILITY-RECOVERY.md -->

최신 확정(2026-10-19): [122](122-API-SCHEMA-LOG-ALIGNMENT.md) 투구폼 필드 추가로 minWriteClientContractVersion을 올린다. 구버전은 쓰기 전에 REQUIRED_FOR_WRITE로 안내된다.

# 88. 웹·PWA·APK 업데이트와 버전 호환

2026-10-19 / 기술 기본안 D. [29](29-OPERATIONS-RELEASE-RUNBOOK.md)·[74](74-PREVIEW-COMMAND-RECONCILIATION.md)·[76](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)·[86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md)의 갱신/복구 원칙을 UI·API·캐시 계약으로 구체화한다. 실제 서비스워커·APK·릴리스 파이프라인은 미구현이다.

## 버전의 의미와 조회

clientReleaseId는 배포 식별자,clientContractVersion은 단조 증가 정수,apiContractVersion은 응답/명령 계약,saveSchemaVersion은 데이터 구조,rulesVersion/engineVersion은 게임 판정 규칙이다. 이들을 앱 표시 버전 문자열 하나로 비교하지 않는다. UI를 업데이트했다고 진행 중 세이브의 난이도·잠재력·RNG 규칙을 자동 변경하지 않는다.

GET /api/client-policy의 논리 응답: {policyVersion,apiContractVersion,minWriteClientContractVersion,minReadClientContractVersion,reconciliationContractVersion,latestClientReleaseId,maintenance:{readAllowed,writeAllowed,messageKey},webReleaseManifest?,androidReleaseManifest?}. 운영 HTTPS origin에서 조회하며 URL은 서버가 지정한 배포 allowlist 범위만 허용한다. 공개 응답에는 save·계정·DB주소·서명키가 없다. 실제 호스트/API 경로는 구현 시 버전 정책에 맞춰 확정한다.

인증 전 정책 조회는 가능하지만 개인 결과 조회는 항상 인증/owner 검사를 거친다. 세션 복원 뒤·앱 resume·최초 쓰기 전에 정책 상태를 확인하고 서버도 각 요청의 clientContractVersion을 검사한다. 오래된 정책 캐시만으로 쓰기를 허용하지 않는다. 정책 조회 실패는 점검 중 확정이 아니라 연결 확인 상태이며 오프라인 새 명령은 금지한다.

## 상태와 사용자 행동

| 상태 | 화면 | 허용 범위 |
|---|---|---|
| CURRENT | 일반 저장 상태 | 현재 계약의 합법 행동 |
| OPTIONAL_UPDATE | '새 버전이 있어요.' 지금 업데이트/나중에 | 현재 버전이 호환되면 플레이 계속 |
| UPDATE_PREPARING | 다운로드·검증 중 | 기존 화면/초안 보존,혼합 자산 전환 없음 |
| UPDATE_READY | '업데이트를 적용할 수 있어요.' | 안전 지점에서 명시적 적용 |
| REQUIRED_FOR_WRITE | '계속 진행하려면 업데이트가 필요해요.' | 지원되는 조회·receipt/job 확인·업데이트 |
| REQUIRED_FOR_READ | 새 형식 화면 읽기 차단 | 최소 결과 확인 계약과 업데이트 안내,오래된 스키마로 임의 파싱 금지 |
| MAINTENANCE | 점검 안내·다시 확인 | 서버 readAllowed/writeAllowed에 맞춤 |
| UPDATE_FAILED | '업데이트를 준비하지 못했어요.' | 기존 호환 버전 유지·재시도,새 게임 유도 없음 |

사용자가 강화를 확정한 직후 새 버전이 나왔다고 결과를 실패로 바꾸지 않는다. 이미 접수된 요청은 원래 rules/engine/command contract로 끝내고 receipt를 남긴다. 차단은 새 게임 변경 명령에 적용하며 기존 job을 새 작업으로 대체하지 않는다.

## 미확정 요청과 업데이트 경계

1. 입력 중 초안을 owner/entity/schemaVersion 기준으로 로컬 저장.
2. 송신 중 요청은 원래 ID·payloadHash·expectedRevision·원 요청 본문을 안전 저널에 확정. 원본에 인증값을 포함하지 않는다.
3. 가능한 경우 receipt 조회를 마친 뒤 전환. 작업이 길거나 네트워크가 끊겨도 앱을 무기한 가두지 않고 저널 보존을 확인한 후 '업데이트 후 결과 확인' 경로를 제공한다.
4. 새 클라이언트는 먼저 구 저널 버전을 읽는 migration adapter로 결과를 확인한다. 새 필드·새 ID로 미확정 요청을 재작성하지 않는다.
5. 지원되는 원 요청을 재전송해야 한다면 동일 ID/본문을 유지한다. 서버가 오래된 command contract를 더 이상 접수하지 않으면 결과 조회만 수행하고 명시적 호환 오류를 보여준다. 404만으로 미실행을 단정하거나 새 요청으로 자동 실행하지 않는다.

오래된 클라이언트에도 최소 reconciliation contract v1을 유지한다. 인증 후 {id,status:UNKNOWN|PENDING|COMMITTED|REJECTED,saveId?,resultRevision?,jobId?,requiresClientUpdate} 같은 안정된 외피로 처리 여부를 조회할 수 있게 한다. 상세 결과가 현재 앱에서 읽히지 않으면 새 버전으로 이동하며 '성공했음/실패했음'을 추정하지 않는다. UNKNOWN은 서버 미접수 증명이 아니다. 원래 명령/생성/복원 endpoint의 조회를 바탕으로 제공하며 새로운 범용 임의 실행 endpoint를 만들지 않는다.

저널 스키마 업그레이드는 복사→검증→새 활성 포인터 교체 순서로 수행한다. 실패시 원본 저널을 유지한다. 사용자가 브라우저 데이터 삭제나 앱 재설치를 했다면 로컬 미송신 초안은 복구 불가일 수 있으나 서버 접수 작업은 owner 조회로 확인한다.

## 웹/PWA 자산 전환

릴리스 manifest는 immutable releaseId와 자산 경로/hash/크기를 갖는다. 새 파일 전체 준비·검증 전 기존 캐시를 삭제하지 않는다. 오프라인이면 현재 설치 셸만 제공하며 정책/공식 진행을 최신처럼 표시하지 않는다. HTML·JS·CSS가 서로 다른 release로 섞이지 않게 원자 배포하고 이전 호환 release의 해시 자산을 일정 기간 유지한다. 유지기간은 실제 저장 비용·클라이언트 관측 후 운영값으로 고정한다.

서비스워커가 있다면 waiting worker를 감지해 업데이트를 안내한다. 자동 skipWaiting/clients.claim과 강제 reload를 새 게임 명령 처리 중에 무조건 실행하지 않는다. 사용자가 적용을 선택하면 각 열린 탭에 쓰기 중지·저널 보존을 요청하고 준비 여부를 확인한다. 준비 안 된 탭이 있으면 안내하고 기존 버전을 유지한다. BroadcastChannel 등 통신 지원이 없으면 탭 종료 후 재열기 경로를 사용하며 조용히 모든 탭을 전환하지 않는다.

강제종료 등으로 협의 없이 worker가 바뀌어도 서버의 버전 검사·저널·receipt가 중복 효과를 차단해야 한다. 탭 간 메시지는 보조 UX이며 권한 경계가 아니다. 캐시 정리는 정적 앱 자산 범위에서만 수행하고 IndexedDB 저널·초안·개인 설정을 '캐시 비우기'로 일괄 삭제하지 않는다. 인증/API/서명 URL 응답은 서비스워커 공개 캐시 대상이 아니다.

새 버전 청크 로드 실패는 '화면 파일을 불러오지 못했어요'와 업데이트/재접속 안내,재로드 전 초안/저널 보존을 제공한다. 기존 상태가 없다고 세이브를 생성하거나 DB 구조를 클라이언트에서 수리하지 않는다.

## Android APK 전환

기존 packageId·서명키·단조 증가 versionCode를 유지한다. 업데이트 manifest의 배포 URL·앱 ID·versionCode·sha256을 검증 가능한 배포 메타데이터로 제공하고,실제 설치 호환은 Android 서명/패키지 규칙과 릴리스 검수로 확인한다. 다운로드 파일 hash만으로 앱 서명 확인을 대체하지 않는다.

앱 내부에서 보안 설정을 자동 변경하거나 알 수 없는 출처 설치를 대신 승인하지 않는다. 사용자가 설치 경로를 선택하고 OS 설치 절차를 수행한다. 일반 앱 업데이트는 사용자 데이터/저널 보존을 목표로 하며 '삭제 후 재설치'를 기본 해결책으로 제시하지 않는다. 잘못된 서명/설치 실패면 기존 앱과 서버 진행을 유지한다.

업데이트 후 세션 확인→구 저널 reconciliation→최신 save resume 순서를 따른다. APK에 포함된 웹 자산과 원격 API의 호환을 검사하고 임의 원격 URL을 앱 UI로 실행하지 않는다. 앱 최소 지원OS·WebView·플러그인·업데이트 서명 검수는 실제 도구 버전을 선택한 뒤 수행한다.

## 서버 배포·롤백

호환 DB 확장→이전/새 클라이언트가 읽을 수 있는 API 배포→웹/APK 배포→관측→필요시 최소 버전 상향 순서를 기본으로 한다. 파괴적 구조 변경은 별도 migration/복원 계획을 세운 뒤 실행한다. 운영 쓰기를 끊어야 하면 명시 점검 상태와 진행 중 작업의 안정 종료 지점을 먼저 정한다.

서버 롤백 대상은 현재 save schema와 호환되는 버전만. 새 형식 데이터를 읽지 못하는 옛 바이너리를 강제로 켜거나 기존 세계를 과거 스냅샷으로 자동 덮어쓰지 않는다. 게임 규칙·확률·난이도 변경은 save policyVersion 고정을 존중한다. 장기 작업은 version이 고정된 worker/계획으로 이어가며 재배포로 RNG를 재추첨하지 않는다.

## 수용 조건과 근거

[플랫폼 기대값](platform-experience-fixtures.json)의 update8개: 미확정 요청·강제 업데이트·구 저널·두 탭·다운로드 실패·서명 오류·API 호환·저널 보존. 실제 worker 전환·WebView·서명 업데이트·rollout 시험은 미실행이다.

외부 근거: [Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)은 waiting/activation/skipWaiting과 혼합 버전 위험을 설명한다. 2026-10-19 확인. 위 안전 지점·최소 조회 계약·저널 adapter는 이 앱의 설계 선택이며 브라우저가 자동 보장하는 기능이 아니다.

---

<!-- SOURCE: 89-PLATFORM-FILES-DOWNLOAD-SHARING.md -->

# 89. 기념 카드·백업 파일 저장과 공유의 플랫폼 계약

2026-10-19 / 기술 기본안 D. [63 연대기](63-CHRONICLE-DETAILED-CONTRACT.md), [70 백업/복원](70-BACKUP-RESTORE-IDENTITY-COMPATIBILITY.md), [86 플랫폼](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md)에 연결한다. PNG 생성·다운로드·OS 공유·APK 권한을 실제로 실행한 보고서가 아니다.

## 파일 종류와 화면 문구

| 종류 | 화면 | 용도·표시 |
|---|---|---|
| 기념 카드 PNG | S45 | '이미지 저장'/'공유'. 선수·시즌의 기념 이미지,게임 진행 복원용 아님 |
| 연대기 JSON | S45 | '연대기 기록 내려받기'. 공개 기록·사용자 메모,게임 백업과 구분 |
| 게임 백업 | S20 | '게임 백업 내려받기'. 버전·게임 시점·원본 revision·크기·검증상태 |
| 복원 대상 | S20 | 서버의 소유 READY 백업 선택→미리보기→새 저장 슬롯 복원 |

백업 성공은 서버 파일 READY/체크섬 검증 상태,다운로드 성공은 별도 기기 전달 상태다. 브라우저가 파일 전달을 시작한 사실만 확인 가능하면 '다운로드를 시작했어요. 기기의 다운로드 목록을 확인해 주세요.'라고 말한다. OS 저장 위치까지 확인하지 못한 채 '사진 앱에 저장됨'이라고 표시하지 않는다. 파일 미리보기를 열어 본 것과 다운로드를 구분한다.

기념 PNG/연대기 JSON에는63의 허용 정보만 포함한다. 게임 백업은 실제 세계·난수·계약·원장을 담는 소유자용 자료이고 공유 카드와 같은 공개 자료로 취급하지 않는다. 백업 목록의 저장 시점은 파일 생성 서버 시각과 게임 시점을 함께 보여주며 가장 최근 파일이 현재 진행과 같다고 단정하지 않는다.

## 생성·전달 상태 분리

export job QUEUED/RENDERING/UPLOADING/READY/FAILED와 기기 전달 IDLE/PREPARING/TRANSFER_REQUESTED/HANDED_OFF/CANCELLED/FAILED를 별도로 유지한다. READY 파일을 여러 번 내려받는 것은 새 세계 행동이나 새 기념 보상 지급이 아니다. 다운로드 중 앱을 닫아도 공식 경기·연대기·백업 정의는 유지한다.

1. 사용자가 파일 생성/백업을 확인하면 원 requestId로 서버 작업을 시작한다.
2. 같은 job의 READY와 hash·mime·크기를 조회한다. 대기중이면 상태만 보여준다.
3. 저장 또는 공유를 누를 때 owner 권한 확인 후 짧은 다운로드 권한을 받는다.63의 export URL5분/파일24시간 정책 유지.
4. 플랫폼 전달 기능을 선택한다. 지원이 없거나 실패하면 파일 다시 받기/미리보기/텍스트 대안을 제공한다.
5. 임시 URL 만료는 같은 job을 재조회해 파일 존재와 소유권을 확인한 후 새 권한을 받는다. 403만으로 만료라고 가정해 무한 갱신하지 않는다.

이미 임시 PNG가 정리됐다면 '이미지 파일의 보관 기간이 지났어요. 같은 기록으로 다시 만들 수 있어요.'와 명시적 재생성을 제공한다. 기존 job이 실패한 상태를 성공으로 바꾸지 않고 새 requestId를 사용한다. 영구 연대기 기록을 다시 추첨하거나 보상 조건을 재실행하지 않는다. READY 백업 파일의 유지·삭제는29 정책을 따르며 PNG의24시간 TTL을 적용하지 않는다.

## 브라우저·홈 화면 웹앱

기본 동작은 인증된 파일 전달 endpoint 또는 소유자 조회로 발급된 private 다운로드 권한이다. same-origin 응답의 Content-Type/Content-Disposition을 정확히 설정하고 공개 응답 캐시를 막는다. 외부 객체 저장소 전달 경로를 쓰면 필요한 CORS/헤더 노출·한시 권한을 개발 환경에서 검수한다. 인증 쿠키를 임의 외부 URL에 붙이지 않는다.

Web Share는 HTTPS·사용자 동작·지원 여부를 검사하고,파일 공유가 가능하면 파일을 준비한 다음 '준비된 파일 공유' 버튼을 다시 눌러 OS 공유창을 연다. 긴 비동기 렌더 작업 뒤 최초 클릭의 사용자 활성화가 남아 있다고 가정하지 않는다. navigator.share 존재만으로 파일 공유 가능이라 판정하지 않고 canShare({files}) 등의 실제 기능 검사를 사용한다.

미지원이면 '파일 내려받기'를 기본 대안으로 제공한다. iPhone에서 다운로드·미리보기·OS 메뉴의 동작은 실기기에서 검수하고,사용자가 선택한 파일 저장/공유 대상은 앱이 대신 결정하지 않는다. 공유창 닫기는 CANCELLED이며 파일 생성 실패나 게임 저장 실패가 아니다. 공유 API 성공도 상대방이 실제로 받았다는 증거로 표시하지 않는다.

공유 대상에 임시 서명 URL·계정용 API URL을 넘기지 않는다. 준비된 PNG 파일이나 안전한 허용 텍스트를 전달한다. 현재 게임은 비공개 소수 사용자용이며 다운로드 링크를 공개 링크로 바꾸는 기능을 넣지 않는다. 이메일·메신저 자동 전송 endpoint는 이 파일 저장 흐름에 필요하지 않다.

## Android APK

샌드박스의 임시 파일→선택한 OS 저장/공유 어댑터 순서로 전달한다. 앱 내부 경로를 외부에 노출하는 file:// 대신 채택 플러그인과 OS의 안전한 content URI 전달 계약을 사용한다. 실제 플러그인 버전·Provider 설정·MIME·읽기 권한 수명을 구현 시 확인한다. 파일명이나 URL 문자열을 경로로 그대로 연결하지 않는다.

가능하면 OS 파일 선택/공유 UI를 사용하며 게임 시작 전에 사진·전체 저장소 접근 권한을 요구하지 않는다. 선택한 기능이 권한을 필요로 할 때만 기능과 이유를 설명한다. 거절해도 경기·서버 저장·연대기 조회는 계속 가능하고 기념 파일은 다른 기기의 웹에서 다시 받을 수 있다. 저장 권한을 앱 로그인 권한처럼 취급하지 않는다.

OS에 전달한 임시 파일은 공유가 읽을 시간을 확보한 후 성공/취소/만료 기준으로 청소한다. 앱 복귀 즉시 삭제해 공유 대상이 빈 파일을 받게 하지 않는다. 청소 대상은 job 소유 샌드박스 파일에 한정하며 사용자가 별도 저장한 파일을 삭제하지 않는다. 구체 유지 시간은 플러그인·실기기 동작 검수 뒤 운영값으로 고정한다.

## 이름·형식·검증

이름 예: 다시플레이볼_선수명_2030시즌_기념카드.png. 파일명에는 실제 계정 이메일·owner ID·토큰·DB object key를 넣지 않는다. NFC 정규화,제어문자·경로 구분자 제거,예약 이름 처리,확장자 서버 고정,최대80글자소 D를 적용한다. Content-Disposition의 UTF-8 이름과 단순 fallback을 함께 제공한다. Windows/macOS/iPhone에서 이름이 잘리는 경우에도 파일 내용·mime는 같아야 한다.

PNG는63의1080×1350·sRGB·10MiB 한도와 한글 폰트 검사,JSON은 UTF-8/exportSchemaVersion,백업은70의 manifest/hash/압축해제 크기/버전 검사를 따른다. 저장소 object key는 사용자가 입력한 파일명이 아니라 서버 job namespace로 생성한다. 파일 hash 불일치·지원하지 않는 mime는 전달을 중단하고 같은 정상 object를 다시 조회한다. 게임 state나 원본 archive를 수정해 파일 오류를 우회하지 않는다.

## 플랫폼 검수·근거

[플랫폼 표](platform-experience-contracts.json)의 CP01~06에서 다운로드 지원·파일 공유 지원을 별도로 관찰한다. 각 실제 산출물 hash·파일명·MIME·한글·미리보기·취소·오프라인·URL 만료·권한 거절을 검수한다. [플랫폼 기대값](platform-experience-fixtures.json)의 files8개는 서면 기대값이다.

공식 근거: [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API), [navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). 2026-10-19 확인. 지원은 브라우저·OS·파일 종류별로 기능 감지하고 실기기에서 검증하며,문서 존재만으로 모든 플랫폼의 공유 기능을 보장하지 않는다.

---

<!-- SOURCE: 90-NUMERIC-LEDGER-CONSISTENCY.md -->

# 90. 최종 수치 정합 — 구종 예산·정밀도·시즌 경계

2026-10-19 / 기술 기본안 D. [57 구종](57-REPERTOIRE-DETAILED-CONTRACT.md)과 [85 난이도](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)의 중복 예산 해석을 닫는다. 사용자 요구인 성장3배·능력상한100·시즌 기회 제한·이적 후 이어하기는 유지한다. 실제 저장 원장이 존재하지 않는 설계 단계이므로 운영 데이터 마이그레이션이 아니다.

## 발견한 충돌과 최종 의미

57의 baseGranted/baseReserved20과85의 실제 XP active cap20/24/60은 서로 다른 제약이다. 실제 cap 잔여만으로 XP를 지급하거나 팀을 바꿀 때 base 예산을 새로 주면 중복 성장한다. 또 구종별150상한에 잘린 양을 미소비로 취급하면 다른 구종으로 예산이 재생성된다. 다음 세 수치를 분리한다.

| 필드 | 의미 |
|---|---|
| baseSpentUnits | 세계시즌에 소비한 기본 XP 예산. 기존 baseGranted는 이 소비 의미로 통일 |
| baseReservedUnits | 새 구종 학습에 예약한 기본 예산,소비 아님 |
| actualBudgetSpentUnits | 당시 배율을 적용해 소비한 실제 XP 예산. 구종150상한 손실도 포함 |
| actualBookGrantedUnits | 실제 pitch book에 들어간 XP 누적. 예산 손실과 구분 |
| scalingRemainder | 배율 계산에서 아직 미반영된1e-4미만 잔여,분모5의0~4 정수 |

키는 (saveId,playerSimulationKey,worldSeasonId). 투수1명의 모든 구종이 같은 시즌 예산을 공유한다. 이적/승강/복무복귀/재영입/백업복원으로 초기화하지 않는다. 새 세계의19세 보관 복사본은 새로운 선수/원장으로 시작하고 원본을 수정하지 않는다.

## 배율과 두 상한

baseCapUnits=200000 (20 XP). 기본 m=1,n=5;치트 수혜 시 m=3,n=15;커리어 하드 NPC m=1.2,n=6. 공통 분모d=5로 계산하며 서로 곱하지 않는다. activeActualCapUnits는 각각200000/600000/240000. 커리어 주인공·NPC·구단 소속 수혜 조건은85를 따른다.

일반 실전의 기본 가용 B=200000−baseSpentUnits−baseReservedUnits. 학습 분기는 해당 분기의 예약분을 먼저 해제한 뒤57의 건강/등록 가능 비율에 따른 candidateBaseUnits를 계산한다. 같은 분기의 evidence는0지급이어도 완료 처리한다. 미지급 과거 분기를 새 팀에서 소급 지급하지 않는다.

실제 잔여 R=max(0,activeActualCapUnits−actualBudgetSpentUnits). R=0 또는 B=0이면 지급0,base 추가 소비0. 그 외에는 다음 최대 기본 소비량을 사용한다. 수치는 정수이며 부동소수점 반올림으로 예산을 넘기지 않는다.

```text
b = min(candidateBaseUnits, B, floor((5*R + 4 - scalingRemainder)/n))
scaledNumerator = n*b + scalingRemainder
budgetDebitUnits = floor(scaledNumerator/5)
nextRemainder = scaledNumerator mod 5
bookGainUnits = min(budgetDebitUnits, 1500000-currentPitchXpUnits)
capLossUnits = budgetDebitUnits-bookGainUnits
```

b=0이면 원장을 소비하지 않고 잔여도 유지한다. 유효 지급은 baseSpent+=b,actualBudgetSpent+=budgetDebit,actualBookGranted+=bookGain,구종XP+=bookGain. 손실은 capLoss로 남기며 기본 예산과 실제 예산으로 환급하지 않는다. 모든 entry는 sourceEvidenceKey+정책 버전에 고정하고 final game/분기 정산의 멱등 원장에서 한 번만 적용한다.

실전 배율은 해당 타석 확정 source의 정책,분기 학습은 해당 분기 정산 source의 정책으로 고정한다. 분기 건강/등록일 비율은57대로 유지한다. 읽기 요청이나 나중의 이적이 이미 지급한 XP를 다시 계산하지 않는다. 자연6능력의 기간별 성장은42/85의 별도 원장이며 이 XP 원장에 섞지 않는다.

## 경계 예시

| 상황 | 최종 결과 |
|---|---|
| 시즌 내내 일반,기본20소비 | 실제20소비. 기본 예산0 |
| 시즌 내내 치트,기본20소비 | 실제60소비. 구종별150상한 손실도 예산 소비 |
| 일반에서 기본10/실제10소비 후 치트 | 기본잔여10,실제 cap잔여50. 추가 최대30,시즌 합계40. 50추가가 아님 |
| 치트에서 기본10/실제30소비 후 일반 | 실제잔여0,추가 지급0. 기존 XP30회수 안 함 |
| 위 선수가 같은 시즌 치트 재영입 | 기본잔여10/실제잔여30,추가 최대30. 새60지급 아님 |
| 기본20을 일반에서 모두 쓴 뒤 치트 입단 | 실제 cap잔여40이어도 기본잔여0,추가0 |
| XP149인 구종에 치트 기본1 | 예산실제3소비/구종+1/손실2. 다른 구종 환급0 |
| 학습 기본10예약,일반 실전 | 기본 가용10,학습 예약을 실전이 사용하지 않음 |
| 하드 NPC 기본0.0001×5회 | 6/5잔여를 누적해 실제합0.0006. 매회 반올림 지급으로 예산 부풀림 없음 |

85의 '실제 cap의 남은30'은 최대 예산이며 기본 가용·구종 상한·현재 합법 source를 모두 통과해야 한다. UI seasonBudget.spent는 actualBudgetSpent,bookGained는 실제 지급,baseRemaining/reserved/activeActualCap을 별도로 반환한다. cap20으로 돌아왔는데 과거 spent30이라고 오류·음수 잔여·되돌리기를 하지 않는다.

## 반값 가져오기와 표시 정밀도

능력과XP의 저장 단위는64의1e-4 정수,원본 최고값 반감만 중간1/2 단위가 생길 수 있다. D: 양수 반올림 half-up을 한 번 적용해 importAbilityUnits=max(10000,floor((sourcePeakUnits+1)/2)). 최대 절대 오차는0.00005점이다. 예91.2501→45.6251. 일반적인 정수·소수1자리 최고값은 정확히 절반이다. floor로 모든 능력을 불필요하게 깎거나 생성 미리보기와 실제 반올림을 다르게 하지 않는다.

원본 최고값은 그대로 보존하고 복사본에만 이 정밀도 규칙을 적용한다. 종합은 저장된6능력 합/6의 유리값을 기준으로 소수1자리 half-up 표시,미리 반올림한 각 표시값의 평균을 쓰지 않는다. 6개100은100.0. 역할 점수·피로·일시 보정은 평균에서 제외한다. 강화 효과는75의 정확한 원장 단위로 표시한다.

## 완료 기준

baseSpent+baseReserved≤20,새 entry의 actualBudgetSpent 증분이 active cap을 넘기지 않음,bookGain+capLoss=budgetDebit,구종별XP≤150,같은 evidence재실행 효과0. 이적 때문에 과거 spent가 현재 cap을 넘는 상태는 허용하되 새 지급은0이다. 정적 검증기는 위 예시 산술만 확인하며 실제 경기/분기/DB/복원 실행 검증은 미실행이다.

---

<!-- SOURCE: 91-CURRENT-CONTRACT-INDEX.md -->

# 91. 현재 적용 계약 지도 — 설계 기준본1.0

M3 병렬(2026-10-26): C15/C17/C22는 `PARTIAL`(명령 receipt·JWT allowlist·owner 격리·셸 생성). C16 백업/연도 복원·전 명령 타입·웹 UI는 미완. M2 엔진 계약은 이 갱신으로 완료 처리하지 않는다. 증거 [M3-COMPLETE](../implementation/M3-COMPLETE.md).

M2-CQ 구현 후속:14/21의 시즌 중 잔여 계약 비교·타 구단 수락은 [CQ](../implementation/M2-CQ-KBO-REMAINDER-TRANSFER.md)를 따른다. 기존 지급 구단 귀속·실제 등록일 급여·성장/강화1회·v4 호환 경계를 보존하며 실제 웹/API/DB 구현과 분리한다.

2026-10-20 성장 달력 후속:14의 최신 사용자 확정인 세계2~10월·고교2~6월·국제창 제외와 `calendar-1` 날짜를42의 기간 정규화에 적용한다. 실제 구현/수치 충돌은 `../implementation/M2-T-GROWTH-CALENDAR.md`를 따른다.

M2-U 구현 후속:19/34/43/125의 고교 결산·E04 blocking·대학 입학 결정은 `../implementation/M2-U-GRADUATION-COLLEGE-ROUTE.md`를 따른다. 실제 대학 시즌/구단 모집과 설계 검증의 미실행 범위는 별도로 유지한다.

M2-V 구현 후속:43/72의 대학 첫 세계·연말 마감·다음 연도 등록 부분은 `../implementation/M2-V-COLLEGE-YEAR-ENTRY.md`를 따른다. 대학 NPC 수치는14의 기본안D이며 고교 승인 분포를 바꾸지 않는다. M2-V 당시 대학 실제 경기까지는 미구현이었으며 M2-W 후속을 우선한다. 전체 세계/DB 작업자는 남아 있다.

M2-W 구현 후속:43의 대학 프리시즌/정규48경기와 학교 공통 진행·강화/MID·평가/특성의 COLLEGE 연결은 `../implementation/M2-W-COLLEGE-REGULAR-SEASON.md`를 따른다. 전체229/229·check/HTTP smoke를 통과했으며 대학 선수권·성장/학년 결과는 미구현이다.

M2-X 구현 후속:01/43의 대학 순위·상위4 선수권/별도 기록과14의 날짜/홈 기본안은 `../implementation/M2-X-COLLEGE-CUP.md`를 따른다. 전체236/236·check/HTTP smoke 통과, 대학 학년 결과/진급은 남아 있다.

M2-Y 구현 후속:42/43의 대학 정규 성장·선수권 건강 감사/예산 분리·학년 완료는 `../implementation/M2-Y-COLLEGE-YEAR-RESULT.md`를 따른다. 전체241/241·check/HTTP smoke 통과, 다음 연도 등록/NPC 지속성장은 남아 있다.

M2-Z 구현 후속:43/72의 대학 학생 세계 연말 마감·NPC 지속성장/졸업 교체·다음 학년 등록 부분은 `../implementation/M2-Z-COLLEGE-NEXT-YEAR.md`를 따른다. 전체247/247·check/HTTP smoke 통과, 세계 전체 NPC 진로/타 리그 작업자는 남아 있다.

M2-AA 구현 후속:43/E75의4학년 졸업·필수 사건·GRADUATED 진로 조회는 `../implementation/M2-AA-COLLEGE-GRADUATION.md`를 따른다. 집중10/10·전체252/252·check/HTTP smoke 통과이며 같은 세계연도 성장 원장은 후속 등록을 위해 보존한다.

2026-10-19. 이전 문서의 기본안 위에 사용자 변경이 누적돼 단순 파일명 순서로 구현하면 충돌할 수 있다. [기계가독 적용표](current-contract-index.json)는25개 분야의 현재 적용 원문과 범위를 지정한다. 설계 문서를 새 게임 기능으로 확장하는 문서가 아니라 기존 계약의 검색·우선순위 인계표다.

## 읽는 순서와 우선순위

START-HERE → STATUS →14의 U/D/V → 이 지도에서 담당 분야 → 해당 상세 원문·JSON 등록부 →92 실행 게이트. DESIGN-ALL은 문서를 모은 전달용 복사본이고 원문을 수정한 뒤 재생성한다.

사람의 최신 명시 결정 > 사용자 확정 U > 해당 범위의 명시적 후속 정정 > 해당 분야의 상세 계약 > 초기 초안. 숫자가 가장 큰 문서가 모든 분야의 원문을 대체하지 않는다. 예90은 XP 예산·정밀도를 구체화하지만 병역기한은21,드래프트 구간은34,경기 공식은24/41/08을 사용한다. currentSources는 우선 확인 순서이며 각 원문의 scope에 한정한다.

사용자 요구 U는 임의로 줄이지 않는다. 수치 D는 초기 구현에 사용할 구체 기본안이며 밸런스 실증 통과 뜻이 아니다. V는 실제 서비스·SDK·기기·시뮬레이션이 있어야 확인할 항목이다. 설계 단계에서 아직 없는 테스트·API·Neon 연결 성공을 기록하지 않는다.

## 분야별 진입점

| 분야 | 우선 확인 |
|---|---|
| 제품/플랫폼 |14/84/86|
| 생성·6능력·집중4개 |79/78/35/90/119/121/122|
| 커리어·재도전·대학·드래프트 |66/19/43/34/116|
| 미국·포스팅·국내 복귀 |23/34/66|
| 국제대회·병역·시간 |20/21/14/69|
| 성장·강화·잠재력·난이도 |90/85/75/67/42|
| 구종·숙련·타격성향 |90/85/57/65/101/119|
| 특성·목표 |65/56/58/100/102|
| 경기·기록 |24/41/08|
| 구단·시장·자연 주기 |85/44/40/61/68|
| 은퇴·보관·지도자 |90/85/42/32/61/70/103/118|
| 이벤트·일자 처리 |81/69/45/26/125|
| API·미리보기·명령 |74/75/64/77/28/78/122|
| 저장·복원·연도 |70/72/71/29|
| 이어하기·계정·화면 |87/80/76/78|
| 에이전트·관계 |59/60/103|
| 중계·연대기·파일 |89/62/63/65/104/122|
| 확률·효과 표시 |82/75/38/40/34/123|
| 디자인·로고·접근성 |130/129/127/128/126/124/119/111/108/96/97/98/93/94/95/83/46/27/37/03/11|
| 인증·플랫폼·업데이트 |87/88/89/86/28/16/29|
| 실행 검수 |131/92/84/73/71/120|

각 숫자의 정확한 파일 링크는JSON에 기록한다. 기존의33/37화면,40/69/83이벤트 표는 작성 시점 자료이며 현재 카탈로그45화면/99이벤트를 우선한다. 현재 필수 범위를 역사적인 수치로 축소하지 않는다.

## 잘못 구현하기 쉬운 폐기안

- 타자/투수4능력,육성1~2개,가중 점수를 주 종합으로 표시: 폐기. 종류별6능력/정확4개/영구6능력평균.
- 원본 은퇴나이·최종 능력 그대로 현역 투입,병역·메달 혜택 계승: 폐기. 19세/능력별 최고50%/새P/병역재시작,원본 불변.
- 미국을 먼저 고른 뒤 오퍼0 막힘: 폐기. 조건과 유효 오퍼가 모두 있는 경우만 진로 카드 노출.
- 대학·고졸 미국·포스팅을 나중 범위로 누락: 폐기. 필수 경로.
- 특성2개 장착·시그니처1개 제한: 폐기. 기록 해금된 보유 효과 전체가 상황 조건에 따라 자동 적용.
- 목표 보상에 성장/돈/훈련권,중계에 경기 중 전략 개입: 폐기. 기념 보상과 확정 경기 감상.
- 구단 치트에 돈·영입만,성장1배/P기본: 폐기. 내 구단 전체P100·양의자연성장3배·구종XP3배와 기존 경제 보장.
- 구단 치트가 상대 선수 조회·제안만으로 효과 적용: 폐기. 실제 팀 소유 확정 시 적용.
- 실제 XP cap만 남으면 기본20을 다 쓴 뒤에도 추가 지급: 폐기.90의 두 예산을 함께 검사.
- 실제 확률1의 숫자 배지,단순 변경의 적용100%: 폐기. 보장 문구/확률 없는 동작 구분.
- 가입 자체로 친구 허용목록 통과,APK를iPhone/PC 설치 파일로 제공: 폐기. 인증후게임접근/플랫폼 형태 분리.
- 업데이트·로그아웃·중계·다른 기기의 조회로 효과 재추첨: 폐기. 동일 receipt/공식 서버 상태를 복원.

## 선택과 실행을 남겨야 하는 것

관리형 인증 후보·기술 구조·기본 수치는 결정된 D를 사용한다. 실제 서비스 지원·SDK 버전·운영 호스트/도메인·서명키·파일 권리·기기 호환·밸런스는92의 V다. V는 앞으로 같은 설계 질문을 반복하기 위한 빈칸이 아니라 구현/배포 시 필요한 증거 목록이다. 별도 iOS/PC 네이티브·오프라인 세계 진행·공개 랭킹 등 선택 범위를 원본 필수 게임과 혼동하지 않는다.

이 지도 자체의 검수는25행·고유ID·원문존재·핵심분야포함을 정적으로 검사한다. 원문 간 모든 의미가 자동 증명됐다는 뜻은 아니다. 새 사용자 결정이 생기면 원문·14·지도·STATUS·검수 기대값·통합MD를 같은 변경 단위로 갱신한다.

시각확장1.1:93~95의빈티지기록실선택U·비교보드·12장면/초상·45이미지슬롯을C21의우선진입점으로추가했습니다. 게임규칙기준본1.0/298기대값수유지,실제브라우저/기기검수미실행.

상태별 UI 확장(2026-10-19): 100~104는 56~63의 계약을 바꾸지 않고 화면 상태·표시 방식만 정한다(100은 히든 특성 T13~T16 추가). 해당 분야 진입점에 추가했고 25행 구조는 그대로다. 검수 항목은 [state-ui-expectations.json](state-ui-expectations.json)에 NOT_EXECUTED로 두며 기존 298 기대값 수와 합치지 않는다.

2026-10-19 인수 후 연결: [105](105-EXTERNAL-HANDOFF-INTEGRATION.md).100/101 원문·공개/서버용 자료·특성/구종 시안·정적 검수 연결,22대표/54상태.102~104의 추가 대표 시안은 후속이며 실제API/게임 실행은 미검수다. 패키징은 rebuild-design-package.mjs로 숫자순 재생성한다.

2026-10-19 후속: [106](106-EXPANSION-UI-CLOSURE.md)에서102~104 원문·30대표/78상태·로컬 조작·61항목 연결 지도를 마쳤다. 실제 게임/브라우저 실행은미검증이다. 고정 로그 감상과메모 미리보기는세계 결과를 바꾸지 않는다.

최신 후속: [107 라이벌·히든 경계](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)는C10/C18의상세 D이고, [108 화면 마감](108-ALL-SCREEN-FINALIZATION.md)은45화면 제작 명세다. 서버용 경계 사례36개는NOT_IMPLEMENTED,45화면의최종픽셀/브라우저 검수는미완료다. 대표28/미명시17을구분하며구현을자동시작하지 않는다.

109 시각1.8후속: C21/C25의시안제작/검수범위는 [109](109-FINISH-BOARD-ART-AUDIT.md)를추가진입점으로 사용한다. 기존대표28+추가17=45ID의배치작성이지최종화면승인/실앱PASS가아니다.

2026-10-19 최신 사용자확정U: 메인그림체를2번청춘야구애니로변경.111의새12사건/초상/낮·실내·야간구도와110의잘림수정을적용한다. 빈티지는이전비교안으로보존하며기존게임규칙은불변.

능력상한·성적설명 후속: [112](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md)에능력100/잠재력100/실제AVG·SLG를구분하고고정대조군4개와균형실험6개를작성했다. 기존산식을바꾸거나시즌성적을보장하지않는다.

첫플레이 동선 후속: [113](113-FIRST-CAREER-SEASON-EXPERIENCE.md)에서생성→고교→졸업→진로별첫시즌의안내·주행동·정산/등록/출장경계를연결한다. 새도메인사건/보상/지명보장은없고 [동선보드](first-career-board.html)는읽기시안이다.

구단첫시즌후속: [114](114-FIRST-CLUB-SEASON-OPERATIONS.md)의16장면/7복구/3시작/연속원장을함께적용한다. 기존생성·소유권·확률·경제·치트범위를바꾸지않고실제운영순서를연결한경험설계다.

오프시즌운영후속: [115](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md)의추천순서/실제기한구분·드래프트같은차례복구·FA예약/마감·병역/만료·미래보장108억원예시를함께읽는다. 기존도메인순서·권리·단일연도전환은유지한다.

## 2026-10-20 점검 정정

현재 결정은 14의 R14(청춘 애니)·R16(117 빠른 진행)을 따른다. 119/121의 미반영 안내를 실제 반영 상태로 정정했다. E63 승인/보류 해결 정책은 125의 분기별 규칙을 적용한다. 기대값 색인 23묶음 중 핵심 6파일 합은 298로 유지한다. 이미지 작업은 124의 단계·묶음별 사용자 승인 절차를 따른다. 과거의 ‘최신’ 후속 안내는 해당 시점의 이력이다.

---

<!-- SOURCE: 92-DESIGN-CLOSURE-HANDOFF.md -->

시각확장1.1:사용자가더많은이미지/선택시안을요청해 [93](93-ART-DIRECTION-CHOICE-LAB.md)~[95](95-CHARACTER-EVENT-ART-PRODUCTION.md)를추가했습니다. 당시그림체는빈티지기록실이었으며 현재는111의청춘애니·119의실루엣을 적용하고서면기준본1.0의게임규칙은유지합니다. 현재시각검수상태는STATUS/VALIDATION을따릅니다.

# 92. 상세설계 기준본1.0 — 종결 점검과 구현 인계

2026-10-19. 사용자가 요청한 설계 우선·남은 항목 계속 진행을 기준으로 기능·흐름·이벤트·수치·저장·플랫폼의 서면 계약을 정리했다. 이 기준본은 앱 완성/사용자 최종 시각 승인/실행 검증 완료가 아니다. 별도 구현 착수 지시 전에는 실제 앱·DB·APK를 만들지 않는다.

## 종결 범위

| 점검 | 최종 서면 기준 | 상태 |
|---|---|---|
| CL01 제품 범위 | 커리어·독립 구단·선택 보관 투입·대학/미국/국제/병역·8확장기능 | SPECIFIED |
| CL02 생성·초기값 |79/78,6능력 고정 배열/집중4/18세/순수 미리보기/단일 생성 | SPECIFIED |
| CL03 화면·디자인 |45화면 상태/행동/복귀,83의 이미지·폰트·모바일·접근성 기준 | SPECIFIED |
| CL04 사건·효과 |99이벤트 근거/중복/충돌,특성 전체/기념보상/확정 중계 | SPECIFIED |
| CL05 확률·정확 값 |20표면,실제1숫자숨김·드래프트라운드·상한 절삭 | SPECIFIED |
| CL06 난이도·수혜 |85,커리어 하드/NPC·구단 AI·내 구단 치트P100/성장3배 | SPECIFIED |
| CL07 시즌·정밀도 |90,기본XP/예약/실제소비/숙련지급 분리·반값 반올림 | SPECIFIED |
| CL08 데이터·시간·원자성 |API/receipt/불변조건/백업복원/연도 세대/원본claim | SPECIFIED |
| CL09 플랫폼 |86~89,네 환경 웹+APK/로그인/전환/업데이트/파일 | SPECIFIED |
| CL10 인계·검수 |25분야 적용 지도,298서면 기대값/24통합경로/6플랫폼/12장기실험 | SPECIFIED |

[종결 등록부](design-closure-register.json)는 위10개와 아래 실행 게이트12개를 분리한다. SPECIFIED는 실제 동작 PASS가 아니다. 판단이 필요한 새 사용자 질문은 현재 없으며,미래에 범위·취향을 바꾸는 요청이 오면 새 결정을 기록한다.

## 현재 규칙에서 제외된 과거 해석

14의 통합표를 최신 사용자 결정으로 갱신했다. 91의 폐기안 목록과 분야별 적용표를 우선한다. 이전 문서는 결정 이력을 보존하되 오래된 '미정/후속' 한 문장만 보고 이미 필수인 기능을 빼거나 새 게임 규칙을 만들지 않는다. 298은 서면 기대값 수,45는화면,99는이벤트,24는통합경로,6은플랫폼 대상이다.

90의 정합 예시는 일반에서 기본10/실제10을 쓰고 치트팀으로 옮기면 추가 최대30/시즌합40,기본20을 이미 썼으면 치트여도 추가0이다. 구종150상한 손실은 예산을 되살리지 않는다. 원본 능력 반감은1e-4 half-up 정밀도만 예외이며 원본 자체는 불변이다.

## 구현 시 실행해야 할 게이트

| ID | 필요한 실행 증거 | 현재 |
|---|---|---|
| V01 | 선택 런타임·패키지/lockfile·호환 버전·실제 npm run build | NOT_EXECUTED |
| V02 | 관리형 인증 사용가능성·이메일 확인/재설정·허용목록·owner격리 | EXECUTED(2026-10-26 M3·Neon Auth JWT/allowlist/owner; 메일 재설정 실발송은 공유 SMTP 의존으로 미실증) |
| V03 | 개발 Neon DB/행잠금/unique/rollback/receipt·2기기 경합 | EXECUTED(2026-10-26 M3·Neon m3-dev) |
| V04 | private 파일 업/다운/hash·권한 거부·보존 청소 | NOT_EXECUTED |
| V05 |24통합 경로의 초기 fixture/명령/결과 hash/불변조건 | NOT_EXECUTED |
| V06 |웹·PWA·APK 강제종료/응답유실/저널/복원·서버 job | NOT_EXECUTED |
| V07 |6플랫폼×8필수 흐름의 실제OS/브라우저/기기 증거 | NOT_EXECUTED |
| V08 |대표 화면 픽셀·글자 확대·키보드·터치·접근성·한글 PNG | PARTIAL(2026-10-26 M4 핵심12 정적·IME·터치/포커스; 픽셀·200%·SR 실기=M5) |
| V09 |12장기실험·성장/XP·하드/치트·시장/리그 균형 | NOT_EXECUTED |
| V10 |Android 서명 release APK·로그인복귀·업데이트 설치 | NOT_EXECUTED |
| V11 |운영 계정/호스트/도메인·예산·로그/복구·배포/롤백 | NOT_EXECUTED |
| V12 |실제 배포 자산의 출처/폰트·로고 사용조건·공개할 파일 확인 | NOT_EXECUTED |

인증은16의 Neon Managed Better Auth 우선 후보를 D로 유지하고 실제 프로젝트 지원·SDK 연결은 V02에서 확인한다. 기존06의 'provider 미결정'은 현재 후보/검증 상태로 읽는다. 지원 불가가 실제로 확인되면 원인과 대체안을 제시하고 필요한 선택만 사용자에게 묻는다. 서비스 보호설정 해제·임의 다른 프로젝트·인증 API키 공유로 대신하지 않는다.

최소OS·SDK/플러그인·도메인·서명·배포 비용은 실제 채택 환경의 V01/V07/V10/V11에 포함한다. 알 수 없는 실제 수치를 설계 완료를 위해 꾸며 채우지 않는다. 게임 수치D와 엔진 불변조건의 엄격 통과 조건은73을 따른다.

## 후속 선택 범위

별도 iOS 네이티브,Windows/macOS 전용 설치형,오프라인 세계 변경,소셜로그인,공개랭킹/멀티플레이,실제 개인정보/선수사진 업로드는 현재 필수 서면 범위에 자동 추가하지 않는다. 네 환경의 온라인 웹 플레이·Android APK와 기존 필수 게임 기능은 그대로 유지한다.

## 구현 착수 후 순서

1. 환경/인증/DB의 작동 가능성 실증과 lockfile,개발 브랜치·비밀환경 분리.
2. 생성→서버 저장→단일 명령→receipt→강제종료 이어하기의 첫 수직 기능.
3. 경기/기록/성장·강화/진로를 연결하고 불변조건을 통과.
4. 대학·미국·병역·국제대회·은퇴보관·구단운영/경제를 연결.
5.8확장기능·플랫폼 파일/업데이트·장기연도를 연결하고 실환경 검수.
6.배포 전 실행 게이트/미해결 결함/호환 롤백을 검토.

이는 기능을 마지막까지 유지하며 구현할 순서이며 문서 작성 완료가 지금 실제 실행을 지시하는 것은 아니다. 향후 사용자가 구현을 지시하면 같은 준비 승인을 반복해서 묻지 않고 필요한 작업을 진행한다. 계정·결제·공개 배포 등 별도 외부 결정은 구체 자료가 준비된 시점에 필요한 정보만 확인한다.

## 인계 패키지

START-HERE/README/STATUS/14/91/92를 먼저 전달한다. 분야별 원문·카탈로그 JSON·예시 기대값·정적 목업과assets를 함께 보관한다. DESIGN-ALL은 재생성한 통합본,MANIFEST-SHA256은 파일 무결성 목록,GitHub main의 커밋이 기준 이력이다. 토큰/DBURL/비밀번호/서명키를 인계 문서에 넣지 않는다.

기준본 완료는 서면 범위를 끝없이 늘리는 대신 실제 구현·검수로 넘어갈 준비가 된다는 뜻이다. 현재 단계의 산출물은 검토 가능한 설계이며,실제 플레이 가능·수치 균형·기기 호환이라는 주장은 실행 증거를 얻은 뒤에만 한다.
## 107 추가 경계 인계

[107](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)은특성/관계 분야의상세 D 계약이다. 프로라이벌 형성·실제 결투 WIN,완봉·연속 시즌·정정 예외를 다루며사용자 확정 문턱·효과를 바꾸지 않는다. server-only/rival-trait-edge-expectations.json의36개 추가사례는전부NOT_IMPLEMENTED이며종전298개와별도다. 현재25분야 지도에서C10/C18에 연결한다.

109 후속: [마감 보드](finish-board.html)에기존 대표28에포함되지 않던17개화면의배치·8종 상태를추가하고새6컷PNG를적용했다. 위 본문의미제작17/PNG8개는이전시점이다. 현재총9PNG·45화면ID 대표연결,최종픽셀/브라우저실행미검수는유지한다. 상세범위와후속은 [109](109-FINISH-BOARD-ART-AUDIT.md).

2026-10-19 최신 사용자확정U: 메인그림체를2번청춘야구애니로변경.111의새12사건/초상/낮·실내·야간구도와110의잘림수정을적용한다. 빈티지는이전비교안으로보존하며기존게임규칙은불변.

## 현재 구현 전 인계

[130](130-PREIMPLEMENTATION-HANDOFF.md)·[준비표](preimplementation-readiness.json)가 이미지/표시 승인과 실제 렌더 차단 상태를 구분한다. 기존 V01~V12 실행 게이트는 미실행이며 변경하지 않았다.

---

<!-- SOURCE: 93-ART-DIRECTION-CHOICE-LAB.md -->

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

# 93. 아트 방향 선택과 이미지 비교 보드

2026-10-19. U: 사용자는세번째 **빈티지 기록실**을메인그림체로선택했다. 앞선시네마틱선택은최신수정으로대체한다. 기존글자체와게임규칙은유지하고이미지/색/질감/장면을확장한다. [비교 보드](art-direction-lab.html), [아트 등록부](art-direction-catalog.json).

## 만든 것과 선택 상태

| 방향 | 시안 | 상태 |
|---|---|---|
| 시네마틱 구장 | 남색노을·조명·사실적인구장 | 비교안으로보존 |
| 청춘 야구 애니 | 밝은하늘·선명한캐릭터 | 비교안으로보존 |
| 빈티지 기록실 | 크림종이·짙은녹색잉크·오커·절제된하프톤 | 최신사용자선택U |

빈티지메인1종/투명선수초상1종/사건12장면을현재기준으로제작했다. 원본PNG는assets/art-lab,메인3안과이전사건초안은비교용으로함께보관한다. 사건12장면은3열×2행의정확한정사각패널아틀라스2개로저장했다. 화면에서CSS로해당패널을표시하며픽셀편집/임의늘이기를하지않는다.

## 보드에서 비교할 수 있는 것

메인3방향,선수홈/이벤트/구단홈/은퇴카드4종,휴대폰/PC배치,이미지작게/균형/크게,12사건장면. 기본은빈티지/휴대폰/균형이다. 메인3안은선수홈hero에서직접비교하고이벤트·구단·은퇴는선택된빈티지장면을공통사용한다고화면에명시한다.

선택값은playball-art-lab-v2의로컬설계선호이며게임난이도·세이브·서버자료를바꾸지않는다. 복사버튼은스타일/이미지비중/화면/선호사건을텍스트로제공한다. 클립보드미지원이면읽기전용텍스트상자로선택/복사대안. 외부메시지·클라우드저장요청은없다. 보드의게임CTA는동작없는시각요소다.

능력예시72/80/64/68/66/76의종합은71.0. 확률·정확증가·비용·회복기간은실제HTML문자,그림에구워넣지않는다. 생성된그림이당첨·계약·개인자격상태를결정하지않는다. 특별강화60%/정확+1.25/실패0/실제피로+5/기회1등은모두예시라벨을붙인다.

## 이미지와 글의 비중 D

메인홈hero160/225/300px를작게/균형/크게비교값으로사용한다. 플레이데이터를확인하려고매번큰그림을여러화면길이스크롤하지않게기본은균형. 기록표·계약금액·라인업은이미지보다본문우선이다. 사건은장면1개→제목/시점→본문→선택효과/확률→최종확인순서,별도자동전체화면영상은없다.

기본색D:배경#F5F0E4계열/카드#FFFDF7/녹색#52644C/본문#293B32,금빛은성과강조. 기존BlackHanSans제목/NotoSansKR본문/숫자tabular를유지한다. 모든본문에종이노이즈를덮지않고그림영역에만질감. 실제배포토큰의대비·작은글자·확대는83의실기기검수대상이다.

## 크롭·실패·접근성

hero는텍스트공간과선수머리를보존하는focalpoint,사건패널은장면별0~65%세로초점으로크롭한다. 아틀라스전체비율3:2/패널1:1,300%×200%배경을정사각원본타일에사용한후창에서잘라낸다. 메달을드는손/얼굴/서류등핵심을가리지않게선택장면별로확인한다.

초상은투명배경,실패시이니셜/단색. 장식구장빈alt,사건은의미있는짧은대체설명,수치목록·버튼텍스트는이미지밖에유지. 애니메이션은의미있는선택에필요하지않으며reduced-motion을존중한다. 이미지다운로드실패가게임/저장을차단하지않는다.

## 제작·검수 기록

생성은built-in image_gen,CLI/API키사용없음. [최종프롬프트묶음](assets/art-lab/GENERATION-PROMPTS.json)에메인3종/사건원본·정리/빈티지변환/추가6장면/초상프롬프트를보관한다. 각결과는도구출력에서시각확인했고프로젝트assets에복사했다. PNG크기와초상모서리alpha0을확인했다. 기존파일은교체하지않고새이름으로추가했다.

브라우저자동열기는file:프로토콜보안정책으로거절됐다. 이를우회하지않았으며실제HTML렌더링/클릭/모바일줄바꿈/스크린리더를통과했다고기록하지않는다. 직접로컬HTML을열어비교가능한파일을제공하고정적구문/ID/자산/카탈로그연결을검사한다.

확장설계는 [94 화면별 이미지 슬롯](94-SCREEN-IMAGE-STORYBOARD.md), [95 캐릭터·사건 아트 제작](95-CHARACTER-EVENT-ART-PRODUCTION.md)로이어진다. 이시각추가는기존게임설계기준본1.0을확장하는것이며앱구현·Neon배포는시작하지않는다.
시각 확장1.2: [96 상세 흐름](96-VISUAL-DETAIL-FLOWS.md)에 대표8화면/상세12상태·타자/투수 초상2개·예외/재개 설계를 추가했다. 기존 본문의1초상/4대표 화면/7PNG 집계는1.1 시점의 기록이며 현재는2초상/8대표 화면/8PNG다. 게임 규칙은 변경하지 않았다.

---

<!-- SOURCE: 94-SCREEN-IMAGE-STORYBOARD.md -->

이미지 제작 인계(2026-10-19): 화면별 이미지 제작 인계표는 [124](124-IMAGE-PRODUCTION-BRIEF.md)다.

실루엣 이미지 표기(2026-10-20 현재): 선수 초상 자리는 사람 외형 초상이 아니라 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 실루엣+이름 카드를 쓴다. **타자6·투수8 실루엣14종은 사용자 승인·파일 반영을 완료했다.** 현재 이미지 제작 레지스터는 EXISTS80/TODO0이며 실제 브라우저/기기 검수는 별도다. screen-image-slots.json의 SILHOUETTE_CARD/silhouetteCard 슬롯이 그 자리이며, 시안·보드의 기존 초상 PNG는 예시 자산일 뿐 선수 외형 확정이 아니다.

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

# 94. 45개 화면 이미지 슬롯·사건 스토리보드

초기 작성은2026-10-19 빈티지안이었으며 현재는111/119/124에 따라 청춘 애니 장면과 얼굴 없는 실루엣을 [45화면슬롯표](screen-image-slots.json)에 연결한다. 모든화면에큰배경을붙이는대신정보목적에맞춰hero/초상/장면/작은뱃지/데이터우선으로나눈다. 화면수와게임명령은기존45개를유지한다.

## 시각 흐름

첫시작은구장한장으로분위기를잡고,선수생성은초상과입력폼,커리어홈은현재선수/6능력/일정,큰진로선택은장면카드로전환한다. 은퇴는유니폼·글러브·기록표로마무리하고구단홈은단장책상/구장과선수단·예산을결합한다. S18기록/S20저장/S21설정/S37재정은데이터를먼저보여준다.

메인큰이미지1개,내용중간의보조이미지최대1개를D기본으로한다. 같은화면에구장hero·대형초상·큰사건그림을동시에3개쌓지않는다. 목록은작은초상/팀뱃지와텍스트,선택은장면의차이를짧은제목/효과설명으로보충한다. 실제수치는그림에포함하지않는다.

## 12장면 스토리보드

| 장면 | 화면·대표 사건 | 문안/결과 가드 |
|---|---|---|
| 새로운 시즌 | S03/S04, E01/E08/E41 | 훈련준비의중립그림,능력상승은실제delta |
| 대학 진학 | S34/S35, E70~76 | 학교·학적·조기드래프트/복학을텍스트로구분 |
| 미국으로 | S29/S30/S33, E57/E58 | 실제유효제안/확정이동근거,MLB자동출장아님 |
| 국제무대 | S25/S45, E47/E48 | 금메달그림은해당메달근거확정일때만,개인자격/복무완료와별개 |
| 마지막 유니폼 | S09/S45, E37/E69/E99 | 실제은퇴·장면근거,원본보관한번 |
| 구단의 내일 | S12/S13/S36, E38~40/E77~81 | 예산·정원·발견/영입은별도결과 |
| 지명을 기다리며 | S05/S28, E04~06 | 중립대기그림,지명/미지명문구별도 |
| 한 번의 특별훈련 | S23, E43 | 성공·실패모두장면은훈련,효과숫자는실제결과 |
| 다시 뛰는 준비 | S06, E21~23 | 같은injuryId/현재회복단계,즉시완치이미지아님 |
| 돌아오는 길 | S27, E53/E76 | 실제복무완료·합법복귀,지원/차출때미리사용안함 |
| 다음 리그의 제안 | S31/S32/S41, E62~64 | 검토중립장면,서명/수락/FA를그림으로확정하지않음 |
| 같은 출발선 | S42, E94~96 | 실제대진·같은팀등록·관계생성근거를각각구분 |

전용그림없는사건은도메인중립장면또는텍스트카드로표현한다. 메달이없는국제대회종료에는훈련/구장,복무진행중에는중립훈련,계약실패에는중립협상장면을사용한다. 장면이미지는게임의숨은당첨을앞서누설하지않고서버state→조건가드→sceneId→assetVersion순으로선택한다.

## 결과 연출 D

성공은결과제목/실제delta/작은금빛표식,실패는원인·소모·다음합법행동을같은크기로표시한다. 별도축하그림이없어도성공값을표시할수있고,같은훈련이미지를썼다고성공장면처럼문구를꾸미지않는다. 스킵·애니메이션끔·이미지실패가결과hash/난수/보상에영향없다.

중요사건만이미지를전환하고매일수십장이어지는장식은피한다. 먼저현재그림과레이아웃공간을유지하다새이미지준비후교체한다. 이미지가늦으면단색/초상/본문을바로보여주고게임확정명령을기다리게하지않는다. 회상그림은당시팀/나이정보와현재화면을명확히분리한다.

## 모바일과 PC

휴대폰은장면→제목→효과→선택순서,PC는장면/문안2열가능. 패널은1:1원본이고넓은창은중앙비율을유지해크롭한다. 아틀라스를3:2로잘못생각해각패널을가로늘이지않는다. 금메달을든손은상단0%,단장책상은하단65%등장면별focalpoint를등록한다. 시각요소를설명하는텍스트는이미지아래에고정한다.

## 연결·검수

슬롯표의각screenId가실제카탈로그에있고,assetRefs는등록된12scene/hero/portrait또는NONE/EVENT_RESOLVER만사용한다. 가상스타일선택은모든게임규칙과별개다. 비교보드는S03/S06/S13/S09의대표배치만구현한정적목업이고45화면전체를이미지목업으로완성했다고주장하지않는다.

실제45화면이미지연결·성과가드·크롭·키보드·파일실패·읽기순서는구현후83/92의실행검수대상이다. 브라우저의로컬file주소차단때문에현재보드렌더링은검수하지못했다. 정적파일구조/자산/스크립트검사와생성된PNG시각확인만분리해기록한다.
시각 확장1.2: [96 상세 흐름](96-VISUAL-DETAIL-FLOWS.md)에 대표8화면/상세12상태·타자/투수 초상2개·예외/재개 설계를 추가했다. 기존 본문의1초상/4대표 화면/7PNG 집계는1.1 시점의 기록이며 현재는2초상/8대표 화면/8PNG다. 게임 규칙은 변경하지 않았다.

시각 확장1.3: [97 상세 경험](97-RESULTS-SEASON-DRAFT-EXPERIENCE.md)에서 경기·시즌·드래프트9상태를 더해 대표11화면/총21상태로 확장했다. 기존 게임 규칙·PNG8개는 유지한다.

시각 확장1.4: [98 구단 경험](98-CLUB-OPERATIONS-IMPORT-EXPERIENCE.md)에서 선수단·탐색·영입·예산·보관 투입15상태를 추가했다. 현재 대표16종/36상태,PNG8개. 기존45게임 화면·99이벤트·사용자 확정 규칙은 유지한다.

시각 확장1.5: [99 생성·진로](99-CREATION-AMATEUR-US-JOURNEY.md)를 추가해 대표20화면/48상태,기존PNG8개를 유지한다. 이어하기 진입은 버튼만 표시한다.

2026-10-19 후속: [106](106-EXPANSION-UI-CLOSURE.md)에서102~104 원문·30대표/78상태·로컬 조작·61항목 연결 지도를 마쳤다. 실제 게임/브라우저 실행은미검증이다. 고정 로그 감상과메모 미리보기는세계 결과를 바꾸지 않는다.

후속 제작 명세: [108 전체45화면 마감](108-ALL-SCREEN-FINALIZATION.md)과 [화면별 등록부](screen-finish-register.json)의 읽기 순서·크기·8상태·우선 그림 목록을 함께 적용한다. 기존 이미지의 보유와 새 최종 시안 제작/실제 렌더 검수는 구분한다.

109 후속: [마감 보드](finish-board.html)에기존 대표28에포함되지 않던17개화면의배치·8종 상태를추가하고새6컷PNG를적용했다. 위 본문의미제작17/PNG8개는이전시점이다. 현재총9PNG·45화면ID 대표연결,최종픽셀/브라우저실행미검수는유지한다. 상세범위와후속은 [109](109-FINISH-BOARD-ART-AUDIT.md).

---

<!-- SOURCE: 95-CHARACTER-EVENT-ART-PRODUCTION.md -->

실루엣 이미지 표기(2026-10-20 현재): 선수 초상 자리는 사람 외형 초상이 아니라 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 실루엣+이름 카드를 쓴다. **타자6·투수8 실루엣14종은 사용자 승인·파일 반영을 완료했다.** 현재 이미지 제작 레지스터는 EXISTS80/TODO0이며 실제 브라우저/기기 검수는 별도다. screen-image-slots.json의 SILHOUETTE_CARD/silhouetteCard 슬롯이 그 자리이며, 시안·보드의 기존 초상 PNG는 예시 자산일 뿐 선수 외형 확정이 아니다.

최신 확정(2026-10-19): [119 선수 표시·투구폼·실루엣](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)이 이 문서의 해당 내용(사람 외형/얼굴 프리셋, 타석 추가 능력 없음, 구종 벡터 외 보정)을 대체·보강한다. 얼굴 프리셋 대신 실루엣+이름 카드를 쓴다.

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

# 95. 캐릭터·사건 아트 제작 계약 — 초기 빈티지안 이력 포함

2026-10-19 초기 U:빈티지기록실(이후111 청춘 애니·119 실루엣 결정으로 해당 표현 범위 대체). D:캐릭터식별/나이/유니폼/장면가드/성능/대체기준을제작규약으로고정한다. 실제캐릭터제너레이터나런타임AI서비스를추가하는문서가아니다. 현재정적생성아트는선택·표현확인용이다.

## 그림체와 팔레트

크림종이/짙은녹색·남색잉크/따뜻한오커,겹친면과절제된선,부드러운하프톤. 과한필름그레인·옛신문얼룩·작은글자뒤질감은피한다. 얼굴은자연스러운성인비율,실제선수얼굴·특정작가/프랜차이즈복제없음. 실제구단로고는검증된별도UI자산으로두고생성캐릭터유니폼에AI가문자/로고를그리게하지않는다.

현재투명초상은가상선수의예시프리셋1종이며모든선수의고유초상을완성했다는뜻이아니다. 선택시안확장제작은투수/야수·표정·나이대·포즈·유니폼을같은그림체로만든다. 서체는기존검은고딕/Noto Sans KR,숫자tabular를유지한다.

## 캐릭터 ID와 능력 분리

appearance={presetId,identityFamilyId,ageBand,poseId,uniformPaletteId,capStyleId,portraitVersion}. 미리제작한프리셋과정적레이어를기본으로하며게임을할때마다외부AI호출/요금/인터넷그림생성을요구하지않는다. 실제빌드자산선택과portraitVersion을저장한다.

외형선택은능력/P/시드/드래프트/관계/부상확률과무관하다. 초상새로고침·스타일전환이선수능력을재추첨하지않는다. NPC외형은생성때고정하고게임판정PRNG와별도식별규약을사용한다. 외형동률/같은프리셋은텍스트이름·나이·포지션·팀으로식별하며외형만으로같은원본이라고판정하지않는다.

## 나이·역할·팀·보관

D나이대18~24/25~34/35~45,같은identityFamilyId에서나이표현만변경한다. 특정나이마다새사람처럼얼굴을다시뽑지않고나이대프리셋이없으면기존가상초상과정확한텍스트나이를유지한다. 늙은초상을사용했다고능력감소를추가하지않는다.

투수는글러브/투구준비,야수는필딩/배트포즈의시각분류. SP/RP/CP·주포지션은텍스트와기용데이터가원본이다. 왼손잡이를단순수평반전하면서로고/투타/글러브가틀리지않도록별도pose검수한다. 팔·손가락·글러브·방망이·공위치의해부학적오류를검수하고이미지가실제구종/타석결과를증명하지않게한다.

팀이적은유니폼팔레트/팀표시만현재등록에따라변경한다. 과거경기·카드·원본보관은그시점의appearance/팀/나이를snapshot으로참조한다. 원본41세와19세복사본은identityFamily연결은가능하나서로다른instance/나이대,기록은원본불변이다. 지도자는원본은퇴나이를표시하고현역19세초상처럼라벨링하지않는다.

## 사건 아트 매핑과 누설 방지

sceneId는94의12종과도메인중립fallback. assetVersion은내용hash와따로버전관리한다. outcomeStage=BEFORE_DECISION/COMMITTED_SUCCESS/COMMITTED_FAILURE/READ_ONLY_MEMORY를두고,이미지resolver는서버가허용한단계/evidence만사용한다. 클라이언트가이미지를미리받았다는이유로메달·선발·계약결과를노출하지않는다.

중립훈련/협상/전화대기그림은실패에도쓸수있다. 메달/복귀/은퇴그림은확정근거가필수다. renderer가데이터부족을추측해채우지않고기록없는장면은본문중립카드를사용한다. 실제도루·견제아웃·투구코스가없는엔진에그림을추가했다고새통계나명령을발명하지않는다.

## 자산 규격·성능·권한

현재원본PNG메인1672×941/아틀라스1536×1024/초상1130×1392. atlas는정사각패널6개,초상외곽alpha0확인. 최종배포파생자산은원본을보존하고hero/카드/썸네일크기에맞춰별도버전파일로만든다. 모바일에서는현재hero·선택장면먼저,갤러리나접힌카드는지연로딩한다. 최적화형식·용량은실제렌더링/품질측정후결정하며원본PNG를그대로최종모바일용량으로승인하지않는다.

아트파일은공개앱번들자산으로배포가능한소유/조건을확인하고,개인초상업로드/비공개연대기파일은89의private권한과구분한다. 원본생성프롬프트·생성모드·자산hash·출처·버전·현재선택/비교상태를기록한다. 생성원본경로만참조하지않고프로젝트에복사한다.

## 품질 체크리스트

ART01 같은그림체/팔레트,ART02 얼굴/손/장비,ART03 문자/브랜드혼입,ART04 투명가장자리/크롭,ART05 모바일얼굴/메달가시성,ART06 실제나이/팀snapshot,ART07 결과단계가드,ART08 외형변경게임효과0,ART09 로딩/실패fallback,ART10 alt/읽기순서/모션,ART11 파일크기/배포파생품질,ART12 공식로고/폰트조건과개인자료분리.

PNG의내용은image_gen도구출력에서시각확인했다. 브라우저HTML·성능·실기기·전체프리셋라이브러리검수는미실행이다.93~95는사용자요청으로추가한시각상세계약이고기존298개게임기대값/45화면/99이벤트수는변경하지않는다. 새규칙이나런타임API를구현한것은아니다.
시각 확장1.2: [96 상세 흐름](96-VISUAL-DETAIL-FLOWS.md)에 대표8화면/상세12상태·타자/투수 초상2개·예외/재개 설계를 추가했다. 기존 본문의1초상/4대표 화면/7PNG 집계는1.1 시점의 기록이며 현재는2초상/8대표 화면/8PNG다. 게임 규칙은 변경하지 않았다.

후속 제작 명세: [108 전체45화면 마감](108-ALL-SCREEN-FINALIZATION.md)과 [화면별 등록부](screen-finish-register.json)의 읽기 순서·크기·8상태·우선 그림 목록을 함께 적용한다. 기존 이미지의 보유와 새 최종 시안 제작/실제 렌더 검수는 구분한다.

109 후속: [마감 보드](finish-board.html)에기존 대표28에포함되지 않던17개화면의배치·8종 상태를추가하고새6컷PNG를적용했다. 위 본문의미제작17/PNG8개는이전시점이다. 현재총9PNG·45화면ID 대표연결,최종픽셀/브라우저실행미검수는유지한다. 상세범위와후속은 [109](109-FINISH-BOARD-ART-AUDIT.md).

---

<!-- SOURCE: 96-VISUAL-DETAIL-FLOWS.md -->

# 96 — 빈티지 상세 화면과 상태별 이미지 계약

2026-10-19 / 시각 확장1.2 / DESIGN_PREVIEW_ONLY. 사용자 확정 U: 세 번째 그림체 **빈티지 기록실**, 만든 이미지 프로젝트 폴더 보관. 아래 레이아웃·표현·예시값은 D이며 기존 게임 수식과 사용자 결정을 바꾸지 않는다.

[이미지 비교 보드](art-direction-lab.html)에서 대표 화면 8종, 타자/투수, 휴대폰/PC, 이미지 비중, 상세 4종의 상태 3단계를 비교한다. [상태 카탈로그](visual-flow-catalog.json)는 구현 시 필요한 근거와 기대 화면을 분리한다. 원래 45개 게임 화면에 상태 시안을 붙였으며 새 게임 화면 ID를 만들지 않았다.

## 공통 화면 구조

상단: 브랜드·저장 상태 → 사건 일러스트 → 제목·상태 → 현재 수치 → 행동별 효과/비용 → 확인 → 결과 영수증. 수치·확률·잔여 기회는 이미지 위에 그리지 않고 HTML 글자로 제공한다. 낮은 이미지 비중에서도 수치와 선택은 동일하다. 휴대폰은 단일열, 넓은 화면은 기존 카드 그리드를 사용한다.

상태 선택 버튼은 목업 외부의 ‘상태 시안’이다. 결과 시안을 고르는 것은 실제 선택·추첨·복구·회복이 아니다. 세계 ID, 명령 ID, 실제 저장 영수증은 이 HTML에 없다. 기존 브라우저 로컬 설정 v2에 검증된 player/phase 열거값을 추가하고 과거 설정은 새 필드를 기본값으로 보충한다. 화면 전환 시 상태 시안은 첫 단계로 돌아간다.

그림이 실패하면 실제 상태 글자와 데이터 카드를 유지한다. 초상은 기존 이미지 오류 대체 표시를 사용한다. CSS 배경 이미지의 자동 실패 감지와 실제 보조기기 읽기 순서는 구현·브라우저 검수에서 추가 증명해야 한다. 아직 동작 확인한 것으로 기록하지 않는다.

## 선수 홈: 타자와 투수

| 구분 | 6능력 예시 | 주요 육성 4개 | 종합 |
|---|---|---|---|
| 타자 김도윤·23세 | 컨택72 / 파워80 / 선구안64 / 수비68 / 주루66 / 클러치76 | 컨택·파워·선구안·클러치 | 71.0 |
| 투수 이준서·26세 | 구속78 / 구위76 / 제구72 / 위기관리70 / 체력74 / 견제62 | 구속·구위·제구·체력 | 72.0 |

종합은 영구 능력 6개의 산술평균, 소수 한 자리. 역할 점수·구종 숙련도와 혼합하지 않는다. 최대100. 초상은 실존 인물 사진이 아닌 가상 성인 두 명이며 능력·잠재력·성격을 판정하는 입력이 아니다. 은퇴 카드 예시는 김도윤 원본으로 고정돼 있으며 선수 시안 선택은 선수 홈·성장 화면에만 적용한다.

## 성장·특별강화: S23 / 구종 계획 S39

1. 계획: 6능력·집중4개, 시즌 잔여 기회1, 피로40을 먼저 제시한다. 예시 대상은 타자 파워80 또는 투수 구위76. 실제 잠재력 여유가2 이상인 예시다.
2. 확정 성장: 실제 +1, 피로+5, 기회1회 소비. 적용 확률 배지를 붙이지 않는다.
3. 도전 성장: 성공률60%, 성공 실제+2 / 실패+0. 결과와 무관하게 피로+10·기회1회 사용. p=1이면 숫자 배지를 숨긴다는 기존 규칙을 유지한다.
4. 최종 확인: 최신 previewVersion/worldVersion으로 대상·증가량·비용을 갱신한다. 조건이 바뀌면 재확인한다. 취소는 소비하지 않는다.
5. 확정 결과: 시안은 성공 영수증이 존재하는 분기(+2, 피로50, 기회0)를 보여준다. 결과 재열람/이어하기가 추가 성장을 적용하지 않는다.

잠재력·피로 상한에 막힌 실제 효과는 90의 정밀도 계약을 따른다. 현재 시안은 상한에 막히지 않는 예시이며 명목 +2를 모든 상황의 확정 증가량으로 사용하지 않는다. 실패·상한 부족·시즌 소진은 아래 예외 표를 따른다.

투수 구종 카드: 포심 누적XP30/Lv.2, 슬라이더 누적XP10/Lv.1, 배분60:40. 비중은 성공확률과 구분한다. 기본 시즌 예산20·예약/실제 소비/개별XP150 상한·치트3배·정산은 90을 적용한다. 카드의 수치만으로 이번 달 XP 획득을 미리 확정하지 않는다.

## 재활: S16 / 사건 S06

회복 중 잔여12경기 → 중간 확인6경기 → 복귀 판정0경기의 서로 다른 시점 예시다. 같은 injuryId에 대한 소속팀 경기 잔여량을 표시한다. 달력 날짜나 페이지를 닫은 시간으로 회복시키지 않는다.

출전 가능 여부·현재 허용된 훈련을 상태 텍스트로 제공한다. 잔여0과 복귀 판정 근거를 함께 확인한 후 ‘복귀 가능’을 사용한다. 선발 배정·구단 계약·능력 완전 복원 보장은 별도다. 재활 그림은 회복 중에도 사용할 수 있지만 ‘완치’ 문구나 승리 연출을 대신하지 않는다.

## 계약: S08 / 미국 제안 S29 / 협상 S32

예시 유효 제안: 가상 미국 구단 A, 보장1년/$900,000, 응답기한2032.12.12, 40인 명단 신분·선발 보직 미보장. 실제 리그 법규를 확정한 문서가 아닌 게임 계약 표시 예시이며 권리·이동 규칙은 23을 따른다.

유효 제안 목록 → 조건 비교·서명 확인 → 계약 영수증의 순서다. offerId·expiresAt·offerVersion·원소속/권리·현재 worldVersion을 확인한다. 능력 조건과 유효 오퍼를 충족하지 않으면 미국 진출 선택을 표시하지 않는다. 제안이 만료되면 서명 대신 갱신 안내와 현재 가능한 진로로 돌아가는 행동을 제공한다.

이미 받은 제안의 수락은 추첨이 아니므로 적용 확률을 표시하지 않는다. 추가 협상처럼 실제 추첨이 있는 행동은 기존 확률 계약으로 별도 카드에 표시한다. 현재 시안에 임의의 협상 성공률은 만들지 않았다. 서명과 입국·등록·첫 출전은 별도 사건이다.

## 대표팀·대회: S24 / S25 / 병역 연결 S26

| 상태 | 필수 근거 | 표시 | 그림 |
|---|---|---|---|
| 선발 후보 | candidateRecord | 검토 대상, 아직 최종 선발 아님 | 중립 훈련 |
| 최종 명단 | finalRosterRecord | 최종 선발, 실제 출전은 별도 | 중립 훈련 |
| 대회 결산 | 팀 금메달 결과 + 개인 실제 출전 기록 | 금메달, 개인 병역 자격 확인 필요 | 메달 장면 |

선발 전망 수치가 제공되는 화면에서는 추정 범위·기준 시점을 표시하고 p=1 배지는 숨긴다. 아직 계산하지 않은 전망을 그럴듯한 숫자로 채우지 않는다. 현재 시안은 확정 명단/성과의 구분을 우선한다. 아시안게임 예시를 WBC·올림픽의 병역 자격으로 자동 전용하지 않는다.

팀 성적 → 개인 실제 출전 → 개인 자격 심사 → 행정 반영 → 복무 완료를 구분한다. 금메달 화면에서 ‘군 문제 해결’ 또는 ‘복무 완료’라고 쓰지 않는다. 후보·명단 상태에 메달 이미지를 사용하지 않는다. 자격 규칙·가상 대회 설정·예외는 20/21이 기준이다.

## 예외·중단·재개 문구

| 상황 | 표시와 행동 | 소비/진행 원칙 |
|---|---|---|
| 강화 기회 소진 | ‘이번 시즌 기회를 사용했습니다’ + 결과 보기 | 새 소비 없음 |
| 잠재력 여유 부족 | 실제 증가량·사용 불가 사유 + 다른 대상 보기 | 확인 전 소비 없음 |
| 재활 중 출전 시도 | ‘회복 중에는 출전할 수 없습니다’ + 부상 상세 | 경기 명령 거절 |
| 오퍼 없음/만료 | 미국 선택 숨김 또는 오래된 화면의 만료 안내 | 계약 생성 없음 |
| 대표팀 탈락 | 후보 검토 결과 표시, 시즌으로 복귀 | 명단/성과를 만들지 않음 |
| 확인 전 연결 끊김 | 마지막 확정 상태 + 다시 조회 | 초안은 확정 아님 |
| 명령 전송 후 결과 미수신 | ‘처리 결과를 확인하고 있습니다’ | 같은 commandId 영수증 조회 우선 |
| 다른 기기에서 상태 변경 | 변경 이유와 새 미리보기 | 오래된 확인 재사용 금지 |
| 앱 재실행 | 최근 서버 확정 상태/미완료 영수증 복구 | 76의 이어하기 계약 적용 |

성공뿐 아니라 실패·만료·권한 없음·미확정·구버전 상태도 구현 시 별도 검증한다. 이 표는 동작 구현의 대체물이 아니다.

## 제작·검수·인계

새 PNG: [투수 초상](assets/art-lab/player-pitcher-almanac-v1.png), 1130×1392, alpha. 원본은 생성 폴더에 보존하고 프로젝트와 기존 로컬 목업 폴더에 복사한다. 총 PNG8파일, 선택 스타일 초상2개/사건12패널/메인1개. [자산기록](assets/art-lab/ASSET-REGISTER.md)과 [생성프롬프트](assets/art-lab/GENERATION-PROMPTS.json)에 도구·입력·제약·검수 범위를 남긴다.

도구 출력 이미지를 확인했다. 초상 가장자리의 미세한 색 테두리·실제 축소 가독성·밝고 어두운 배경 합성은 추후 제작 검수 항목이다. 전체 캐릭터 라이브러리 완성으로 간주하지 않는다.

정적 검사는 4흐름×3상태 데이터, 근거/화면 ID, 타자·투수 평균/집중 개수, 선택된 상태의 HTML 문자열 생성, PNG/자산/스크립트 구문을 검사한다. 실행 엔진·DB·기기 테스트는 하지 않는다. file: 브라우저 정책 차단은 유지하며 다른 경로로 우회하지 않는다. 실제 픽셀 렌더·클릭·줄바꿈·클립보드·localStorage는 미검수다.

시각 확장1.3: [97 상세 경험](97-RESULTS-SEASON-DRAFT-EXPERIENCE.md)에서 경기·시즌·드래프트9상태를 더해 대표11화면/총21상태로 확장했다. 기존 게임 규칙·PNG8개는 유지한다.

---

<!-- SOURCE: 97-RESULTS-SEASON-DRAFT-EXPERIENCE.md -->

# 97 — 경기 결과·시즌 결산·드래프트의 상세 경험

2026-10-19 / 시각 확장1.3 / DESIGN_PREVIEW_ONLY. 빈티지 기록실 그림체와 기존 게임 규칙을 유지하며, 결과가 생기는 시점과 사용자가 확인하는 시점을 구분한다. [보드](art-direction-lab.html)는 대표11종, 상세7흐름×3상태=21개 상태 시안이다. [상태 데이터](visual-flow-catalog.json), [수치·예외 예시](result-experience-examples.json)를 함께 사용한다.

규칙 원문은 [24 경기](24-GAME-ENGINE-SCORING.md), [62 감상 중계](62-COMMENTARY-DETAILED-CONTRACT.md), [82 확률](82-PROBABILITY-EFFECTS-CONFIRMATION-AUDIT.md), [80 복구](80-SCREEN-STATES-NAVIGATION-RECOVERY.md), [90 정밀도](90-NUMERIC-LEDGER-CONSISTENCY.md)다. 이 문서는 화면·표시 순서·예외 문구를 구체화하며 수식·보상·난이도·시즌 진행 규칙을 덮어쓰지 않는다.

## 경기 결과 S19 / 감상 연결 S44

상단에는 경기 상태와 날짜·대회·홈/원정을 둔다. 처리 중에는 확정된 마지막 진행과 조회 상태만 제공하고 최종 승패를 꾸며내지 않는다. FINAL이 확인된 뒤 최종 점수 → 이닝별 득점 → 내 선수 → 팀·개인 상세 → 감상/요약 경로를 제공한다. 이미지보다 점수와 처리 상태가 먼저다. S19의 구장 장식은 선택적이며 이 시안은 데이터 중심 배치다.

| 상태 시안 | 내용 | 가능한 행동 | 변경하지 않는 값 |
|---|---|---|---|
| 처리 중 | pendingGameId와 마지막 확정 진행, 아직 최종 결과 없음 | 처리 조회, 홈으로 이동, 같은 경기 이어 확인 | 최종 승패·공식 기록 미생성 |
| 최종 결과 | finalGameReceipt와 박스스코어 | 기록 조회, 로그 유무에 따라 감상 또는 요약 | 게임 진행 재호출 없음 |
| 다시 보기 | 확정 manifest/resultHash에 연결된 감상 | 처음/이어서, 재생·정지, 1/2/4배, 스킵·되감기 | 결과·난수·성장·세계 날짜 불변 |

보드의 다시보기 상태는 **이미 결과를 공개한 뒤 진입한 요약 시안**이다. 실제 S44에서 스포일러 숨김 설정으로 처음 감상하면 사용자 공개 전 최종 점수/승리 배지를 노출하지 않는다. 중계 재생·이어서/속도 버튼 자체의 동작 구현은 이번 보드에 포함하지 않는다.

예시 점수: 원정 B는 001000002=3점, 홈 A는 02000101X=4점. 9회초 종료 시 홈이 앞서 9회말 미실시. X는0득점 이닝이 아니라 미실시다. R/H만 표시하며 현재 엔진이 제외한 실책을 E=0으로 꾸미지 않는다. 연장에서는 실제 존재하는 이닝을 추가하고 표 내부만 가로 스크롤한다. 홈 구단이 끝내기로 이기면 X 대신 실제 마지막 이닝 점수를 표시한다.

타자 예시 4타수1안타·1홈런·2타점, 투수 예시6이닝·2자책·7탈삼진은 각각의 별도 화면 예시다. 현재 엔진에서 승리팀 선발이라는 이유만으로 W를 붙이지 않는다. 실제 기용0이면 ‘이번 경기는 출전하지 않았습니다’를 표시하고 개인 성적을 0타수0안타나 ERA0.00으로 오해하게 만들지 않는다.

다시보기 로그가 없거나 보존 기간이 끝난 경우: ‘상세 중계는 남아 있지 않지만 경기 요약은 볼 수 있어요.’ 요약과 결과는 유지한다. 로그가 손상되면 만료로 바꾸지 않고 ‘중계 기록을 확인하지 못했어요’와 진단/재조회 경로를 제공한다. 새 경기로 재생성하지 않는다.

## 시즌 결산 S07

첫 화면은 연도·리그/소속 구간·시즌 정산 상태를 먼저 표시한다. 이적·복무·국제 기록을 무조건 한 리그 합계에 넣지 않는다. 예시는 가상2032 단일 리그 기록이며 전환 시 실제 scope를 query에 고정한다.

정산 중 → 확정 결산 → 다음 할 일로 나눈다. 결산 열기/닫기는 정산 명령이나 새 시즌 생성 명령이 아니다. 성장·수상·수입·도전 보상은 해당 정산 영수증을 조회해 보여준다. 화면을 재방문하거나 여러 기기로 열어도 같은 영수증을 재적용하지 않는다.

| 예시 | 원기록 | 표시 |
|---|---|---|
| 타자 | AB500/H150/TB250/BB50/HBP5 | AVG .300 / OBP .369 / SLG .500 / OPS .869 |
| 투수 | 아웃450/ER50/H140/BB45/K150 | IP150.0 / ERA3.00 / WHIP1.23 / K150 |

타자 OBP=(H+BB+HBP)/(AB+BB+HBP)=205/555. 희생타 제외 엔진의 분모를 적용한다. OPS는 표시 반올림 값을 더하지 않고 원정밀도 OBP+SLG에서 반올림한다. 투수 이닝은 아웃을3으로 나눈 야구 표기이며150.1을150.1십진이닝으로 계산하지 않는다. ERA=ER×27/outs, WHIP=(H+BB)×3/outs. 분모0은 —, 실제0과 구별한다.

6능력 변화는 이전 영구 능력 → 정산 후 영구 능력, 실제 delta, 변동 원인으로 보여준다. 잠재력 범위를 임의로 확정 숫자로 바꾸지 않고 정확 효과 미리보기 규칙을 유지한다. 구종XP와 영구6능력은 별도 카드다. 이번 보드의 성장 영역은 조회 원칙 안내이며 모든 시즌 성장 항목의 입력/산출 예시를 새로 구현한 것은 아니다.

다음 할 일: 미응답 계약·필수 진로·병역 기한처럼 기존 task resolver의 우선순위를 사용한다. 보드는 계약 응답1개가 남은 예시다. 필수 사건은 세계 날짜 진행을 막지만 기록·설정 조회는 허용한다. 마감시간은 서버 게임 달력 기준이며 현실 자정·기기 시계로 소진하지 않는다. 할 일0이면 기존 합법 ‘다음 시즌 준비’ 행동을 보여주고 클릭 확인 전 새 시즌을 생성하지 않는다.

## 드래프트 S05 / 진로 연결 S28

사용자 확정 U: 예상 라운드와 지명 가능성 제공. 판정 전 전체 확률 분포, 판정 후 실제 라운드·구단·계약 순서다. 미국은 능력 조건과 유효 오퍼가 없으면 선택을 표시하지 않는 기존 결정을 유지한다.

현재 원문의 B45 예시: 전체 지명률50%, 전체 결과 분포10라운드40%/9라운드10%/미지명50%. ‘지명된다면10라운드 유력’은 조건부 최빈 라운드 설명이며10라운드40%를 지명된 사람만의40%로 쓰지 않는다. 1~8라운드 가능성이0인 이 예시에서는 해당 분포 행을 생략한다. 실제 구단 배정은 해당 세계의 수요·동점 처리 규칙을 따르며 특정 구단 계약을 전망만으로 보장하지 않는다.

보드의3개 상태는 선형 순서가 아니다: 전망 → **지명 또는 미지명**의 서로 배타적인 결과다. 지명 예시는9라운드이므로 유력10라운드와 다를 수 있음을 직접 확인한다. 같은 드래프트에서 두 결과를 함께 기록하는 설계가 아니다.

지명 결과: 실제9라운드/가상 구단A → 유효 계약 조건 조회 → 별도 계약 확인. ‘지명됐으니 계약 완료’라고 표시하지 않는다. 전망 재계산은 결과 변경이 아니며 확정 이후 주정보는 실제 결과다.

미지명 결과: 현재 나이·학적·예산·기회에 맞는 다음 합법 행동만 제공한다. 대학 진학이 항상 가능하거나 계약이 자동 보장된다고 쓰지 않는다. 현재 시즌의 진로가 닫혔으면 적법한 후속 기간·재도전 규칙을 안내한다. 단순히 닫기/뒤로가기를 누르는 것을 은퇴 동의로 해석하지 않는다. 은퇴는 별도 확인과 원본 보관 계약을 따른다.

전체 지명 p=1은 숫자 배지를 숨기고 예상 라운드를 남긴다. p=0은 실제 불가능한 전망임을0%로 표시하며 적격한 대안을 제공한다. 기록 조회·새로고침·추첨 애니메이션 스킵은 새로운 추첨이나 기회를 만들지 않는다.

## 세 화면의 예외와 복귀

| 상황 | 처리 |
|---|---|
| 경기 진행 응답 유실 | 원 commandId 조회, 새로운 경기나 새seed 생성 금지 |
| 감상 위치 저장 충돌 | 게임 결과 유지, 로컬 감상 위치 보존·명시적 선택; 큰 cursor 자동 승리 금지 |
| FINAL인데 로그 없음 | 요약 가능/다시보기 불가를 분리 |
| 기록 분모0 | —, 실제0과 구별 |
| 개인 미출전 | 미출전 문구, 허위 비율·데뷔 기록 없음 |
| 시즌 정산 미완료 | 이전 시즌 값에 현재 최종 라벨 금지 |
| 확정 결산 재방문 | 같은 영수증 조회, 성장·자금 중복 없음 |
| 새 시즌 처리 중 종료 | 해당 작업 조회 후 확정 시즌으로 복귀 |
| 전망 기준 데이터 변경 | 변경 표시·새 조회, 확정 결과 재추첨 없음 |
| 미지명 후 적격 경로0 | 가능한 종료·보관 확인, 불가 진로 노출 금지 |
| 과거 팀명/선수 개명 | 당시 snapshot과 현재 표시 이름을 구별; 보관 원본을 현재 소속으로 변조하지 않음 |
| 계정 변경/접근 만료 | 캐시 비공개화, 동일 소유자 확인 후 복구; 타인 기록 노출 금지 |

## 접근성·이미지·검수

점수표는 caption/행·열 헤더를 가진 표이며 좁은 화면에서는 표 내부만 스크롤한다. 키보드로 표 영역 접근 가능, 결과는 색·축하 이미지 없이도 구분한다. 전체 점수 로그를 aria-live로 반복 낭독하지 않는다. 표/긴 팀명/글자 확대/스크린리더 실제 시험은 구현 후다.

이미지 추가 생성 없이 기존 저장된 ‘드래프트 대기’와 ‘시즌 준비’ 아틀라스를 사용한다. 지명·미지명은 같은 중립 장면이며 결과를 그림으로 미리 누설하지 않는다. 시즌 결산에 메달·은퇴 장면을 근거 없이 사용하지 않는다. PNG는 기존8개이며 V:\docs\design\assets\art-lab에 보관한다.

정적 검증: 상세7흐름21상태, 점수합·X/이닝 구조 예시, 타자/투수 원분모 산술, 드래프트 분포 합1/지명률/라운드 조건, 순수 HTML 문자열·스크립트·링크 정합. [예외 기대값](result-experience-examples.json)은 NOT_IMPLEMENTED로 보존하며 기존298 게임 fixture 수에 합산하지 않는다. 실제 경기엔진·저장·브라우저·로그/기기 시험이 통과한 것은 아니다. file: 정책 차단을 우회하지 않는다.

---

<!-- SOURCE: 98-CLUB-OPERATIONS-IMPORT-EXPERIENCE.md -->

# 98 — 구단 운영·시장·예산·보관 투입 상세 경험

2026-10-19 / 시각 확장1.4 / DESIGN_PREVIEW_ONLY. [보드](art-direction-lab.html)에 선수단·탐색·영입·예산·보관 투입5종/15상태를 더해 대표16종, 상세12흐름/36상태를 구성한다. 원래45게임 화면과99이벤트는 유지한다. PNG8개를 재사용하며 그림을 늘리는 것보다 현재 상태·비용·다음 합법 행동을 먼저 보여준다.

기준 원문: [40 탐색·수락 확률](40-SCOUTING-RECRUITMENT-ODDS.md), [44 경제·등록](44-CLUB-ECONOMY-AI.md), [32 반값 복사](32-USER-IMPORT-REBIRTH.md), [67 잠재력 전망](67-POTENTIAL-ASSESSMENT-PROGRESSION.md), [85 난이도·치트](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md), [90 정밀도·원장](90-NUMERIC-LEDGER-CONSISTENCY.md). 이 문서는 화면 계약을 구체화하며 수식과 생성·소유권 정책을 바꾸지 않는다.

## 구단 운영의 연결

구단 홈 → 진행을 막는 이유 확인 → 선수단/등록/라인업 또는 시장으로 이동 → 조건·비용 확인 → 최신 재검사 → 명령 확정 → 영수증 조회 → 구단 홈에서 다시 진행한다. 시장 탐색 실패로 공개 FA 목록까지 닫지 않는다. 정원 부족 때문에 탐색 정보조회 자체를 막지는 않지만 불가능한 영입 확정은 차단한다.

목업 외부의 상태 버튼은 서로 다른 예시를 비교한다. 특히 정상 등록/포수 부족/부상 대체는 독립 사례이며 정상→강제 부상 발생 순서가 아니다. 탐색 성공/실패 역시 같은 명령의 동시 결과가 아니다. 치트 저장 조회는 **이미 해당 난이도로 생성한 세계의 예시**로, 게임 초기 선택 화면에 치트를 공개하는 기능이 아니다. 이스터에그 입력·수동 선택은 기존33/36 계약을 유지한다.

## 선수단과 등록 S14 / 라인업 S15

상단은 전체 계약 인원,1군 등록,현재 출장 가능 인원과 진행 차단 이유를 구분한다. 필터는 1군/2군,투수/야수,포지션,부상/복무,계약 종료 예정. 정렬은 종합·역할 적합·나이·당해 보장액을 선택하며 같은 값은 안정된 선수ID 순서 D다. 이름/포지션을 고르면 상세로 이동하고 등록 변경은 별도 확인한다.

현재 보드 정상 예시: 전체50명/1군28명/투수13·야수15/포수2/유효 타순9. 단순 종합 순으로 자동 방출하거나 포수·수비 자리 요건을 무시하지 않는다. 전체 최소35·최대60,1군 투수10~15·포수2·수비8자리/DH 포함 타순9명이라는 원문 검사를 사용한다.

포수 부족 예시: 1군28명 중 등록 포수1. ‘포수가 한 명 부족합니다’ →2군 적격 후보 조회→기존 등록 선수와 교체할 대상 직접 선택→변경 전후 인원·포지션 확인→등록 원자 반영. 29번째 선수로 몰래 추가하지 않는다. 2군에 적격 포수가 없으면 시장·긴급 보충의 기존 합법 경로를 안내한다.

부상 대체 예시: 등록 인원은28/포수2지만 주전 중견수 부상으로 유효 타순8. 건강한 적격 대체 후보를 선택해 수비·타순 중복을 검사한다. 1군 등록/선수 소유/실제 출장/치료 완료를 같은 상태로 묶지 않는다. 부상자를 조회하거나 대체 버튼을 열었다고 부상을 끝내지 않는다.

## 스카우트 발견 S36

조건 → 미리보기 → 최종 확정 → 발견 또는 실패 → 보고서/공개시장/새 탐색으로 연결한다. 조건 초안 변경만으로 비용을 청구하지 않는다. 실제 적용 시 최신 미발견 적격수 N·시설·기회·권한·예산을 다시 확인한다.

예시 조건: 중견수/19~35세/종합40~80, L2/N20/q1. p=.35+.08×2+.20×1−.08×1=.63. 화면에는 ‘발견 성공률63%’와 비용500만원·월 잔여2회를 함께 둔다. 성공이면 미발견 적격 후보3명을 중복 없이 공개, 비용500만원·잔여1회. 실패이면 신규 후보0,같은 비용·잔여1회다. 이미 발견한 후보와 공개 FA 목록은 유지한다.

후보 박민재: 현재6능력 예시72/60/64/58/66/52→종합62.0. 보고서 컨택72/잠재력80~96은 능력별 전망 범위의 예시이며 종합 잠재력이나 ‘적중률’이 아니다. 평가일·시설/직원 유효 레벨·관측 단계와 다음 평가 조건을 보여준다. 원래 P를 반복 검색으로 바꾸거나 범위의 중앙값을 확정 상한으로 저장하지 않는다. 보드는 후보 목록과 보고서 한 행만 시연하며 모든 선수 보고서 상세를 완성한 것은 아니다.

N0 또는 미발견 후보0이면 실행 불가·비용0·이유와 조건 바꾸기. 월 기회0도 같은 방식으로 표시한다. 치트는 적격N>0·잔여 기회 존재 시 발견 보장,숫자 확률 배지는 숨긴다. 치트도 유료 탐색 원장과 월 기회를 소비한다. 무제한 자금은 탐색 횟수 무제한이 아니다.

## 영입과 라운드 S17

받은 커리어 계약서를 수락하는 화면과 구단이 제안하는 시장 화면을 구분한다. 이 화면은 사용자가 구단으로서 제안하며 실제 수락 추첨이 존재한다.

예시: 단독 유효 제안 점수.60,1라운드,대기 weight1.0→수락50%/대기50%. 연봉1억원/보장1년/총보장1억원,이번 제안 당해 예약1억원/정원1자리. 화면에는 ‘이번1라운드 수락 가능성50%’와 기준 시점·마감·당해/미래 예약·불가 이유를 제공한다. 경쟁 구단의 비공개 금액·개별 예산·숨은P·seed는 공개하지 않는다.

제안 초안은 실제 계약이 아니다. 최신 미리보기에서 모든 제안이 동시에 성공해도 유효하도록 예산·정원을 예약한다. 같은 선수 자기 제안은1개. 권리/현재 계약/정원/당해 및 미래 보장액·제안 버전 검사를 통과해야 라운드를 확정한다. 후보를 바꾸거나 금액을 수정하면 새 미리보기 후 다시 확인한다. 서버는 클라이언트가 보낸 임의 확률값을 신뢰하지 않는다.

성공 예시: 제안 예약1억원 감소→연봉 예약1억원 증가,가용액은 유지. 한 선수의 소유팀/활성 계약은 하나이며1군 등록은 별도다. 거절/타팀 선택/대기는 실제 판정에 맞춰 자기 제안 예약을 해제하고,대기이면 남은 합법 라운드를 안내한다. 기존 동일 명령 결과 조회와 다음 라운드의 새 제안은 구별한다.

치트의 유효 제안은 수락 보장,숫자 배지 숨김. 타팀 계약자·권리 불가·정원 초과를 성공으로 바꾸지 않는다. 조건 변화가 생기면 추첨 직전 값을 몰래 바꾸지 않고 새 확인 화면을 제공한다. ‘주전 기회’ 평가는 실제 고정 출장을 보장하는 계약 문구가 아니다.

## 예산과 원장 S37

모든 금액은 정수 원으로 저장,화면은 억/만원 단위를 명시한다. 수입·지급·예약·보호액을 다른 열로 분리하고 세부보기에서 원 단위 값을 제공한다. 제안 예약과 연봉 예약을 두 번 차감하지 않는다.

| 항목 | 예시 |
|---|---:|
| 기본 연간 예산 |120억원|
| 지급 연봉 |40억원|
| 잔여 연봉 예약 |50억원|
| 방출 보장액 |3억원|
| 제안 예약 |5억원|
| 최소 인원 보호액 |2억원|
| 지급 운영비 |1억6천만원|
| 기타 수입/운영 예약 |0원|
| 가용 |18억4천만원|

탐색1회 후 지급 운영비1억6500만원/가용18억3500만원. 별도의 새 제안1억원 예약을 반영하면 가용17억4천만원이며,이 예시는 탐색 비용 반영 전18억4천만원 기준이다. 두 예시는 독립 출발점으로 비용을 중복해서 합치지 않는다.

영입 성공 때 예약 분류만 이동하면 가용은 그대로다. 제안 철회/실패의 예약 해제,연봉 실제 지급,방출 보장으로의 이전은 원문 트랜잭션별로 한 번만 반영한다. 미래 연도는 해당 연도 보장액을 별도로 표시하고 미래90% 검사도 확인한다. 같은 계약 잔여 예약과 방출 보장액을 이중 계산하지 않는다.

치트 세계의 가용은 ‘무제한’. 원장 입력은 유한 정수이며 Infinity/NaN/초대형 가짜 잔액으로 대체하지 않는다. 지급·예약 내역과 같은 식으로 계산한 유한 잔액은 감사용 상세이며 구매 가능 한도라고 표시하지 않는다. 정상모드 자금난에서는 필요한 최소 지원·긴급 대체 계약의 기존 확인 경로를 제공하고 보장 채무를 삭제하지 않는다.

## 보관 선수 투입 S11 → 새 구단 생성 S12

투입은 선택이며0명으로도 시작한다. 이번 시안은 기존 **새 구단 생성**에서의 투입 흐름이다. 진행 중인 세계에 원본을 임의로 추가하는 새 기능을 의미하지 않는다. 생성 미리보기에서는 전체0~28명 매칭을 먼저 검사하고 포수/수비/투수 요건을 유지하는 가상선수 대체 대상을 함께 보여준다. 임의 추가로 정원을 늘리거나 적격 선수를 자동 방출하지 않는다.

원본 김도윤41세의 영구 최고값92/100/88/86/90/94→복사본19세46/50/44/43/45/47,평균45.8. 최고 시점은 능력마다 다를 수 있고 임시 버프는 최고값에 포함하지 않는다. 최종 은퇴 능력을 최고값으로 조용히 대입하지 않는다. 90의 정수단위 반감과 표시 반올림이 기준이다.

| 원본 | 새 선수 |
|---|---|
| 종료41세,원래 누적기록·메달·병역 |19세,새 통산0,대상인 경우 병역 미해결|
| 영구 최고6개/원본 잠재력 보존 |최고별50%/새 상향 잠재력·상한100|
| 원본 당시 유형·초상 출처 |유형 기본 유지·집중4 재선택·어린 외형 프리셋|
| 은퇴 기록·강화 사용·기존 자격 |새 세계 규칙,원본 사용량/자격을 승계하지 않음|

새 P 계산은 기존 고정 importDraftId/원본ID/능력키와5~10보정식에 따른다. 일반/하드는 새 평가 범위로 표시하고 원본 정밀 보고서를 새 P의 근거로 복사하지 않는다. 치트 새 구단의 소유가 확정되면 복사 규칙을 먼저 적용하고6P100 정책을 이어 적용한다. A를100으로 올리지 않는다. 내 구단 전체의 양의 성장/구종XP3배이며 부상·현역복무·노쇠·상한과 세계시즌 원장 제약은 그대로다.

같은 원본 root를 같은 구단 세계에서 선수와 지도자로 중복 투입하지 않는다. 원본 소유/버전·최고값 정보·중복 출처·매칭·정원·최저연봉 예약을 마지막에 재검사한다. 생성 실패는 세계·복사본·대체 가상선수 이동·예약 전부 롤백. 응답이 끊기면 같은 생성 명령/작업 결과를 먼저 조회한다. 원본 snapshot은 성공/실패 모두 불변이다.

## 예외·이어하기·접근성

20개 실행 전 기대값을 [구단 예시](club-experience-examples.json)에 남긴다. 기회0/후보0/예산 부족/정원 부족/권리 불가/최신 상태 변경/중복 결과/병역 초기화/원본 중복/치트 제한을 구분한다. 새 명령은 명시적인 새 비용·기회 확인 후만 만들고,네트워크 오류를 게임 실패 판정으로 취급하지 않는다.

큰 그림은 단장 책상 또는 보관 원본 회상1개,선수단/예산은 텍스트·표를 먼저 둔다. 이름·금액·전망 범위를 그림에 굽지 않는다. 성공/실패는 동일 크기 본문으로 원인·실제 소비·다음 행동을 제공한다. 필터·정렬·스크롤은 해당 세계/목록에 보존하되 다른 계정에서 개인 캐시를 노출하지 않는다.

모바일 긴 이름·수치 확대·키보드/스크린리더·잘못된 입력·다중 제안 경합은 구현 후 검수다. 이번 검사는 정적 링크·스크립트·36개 순수 HTML 문자열·산술/자료 정합만 수행한다. 기존298게임 기대값과 별도이며 실제 경기/시장/DB/원장/저장 테스트가 통과한 것은 아니다. file: 접근 차단을 우회하지 않는다.

구단첫시즌후속: [114](114-FIRST-CLUB-SEASON-OPERATIONS.md)의16장면/7복구/3시작/연속원장을함께적용한다. 기존생성·소유권·확률·경제·치트범위를바꾸지않고실제운영순서를연결한경험설계다.

---

<!-- SOURCE: 99-CREATION-AMATEUR-US-JOURNEY.md -->

# 99 — 선수 생성·졸업 진로·대학·미국 커리어 상세 경험

2026-10-19 / 시각 확장1.5 / DESIGN_PREVIEW_ONLY. [비교 보드](art-direction-lab.html)에4종/12상태를 추가해 대표20종·상세16흐름/48상태로 확장한다. 원래45게임 화면/99이벤트와 PNG8개는 유지한다. [상태 카탈로그](visual-flow-catalog.json),[진로 예시](journey-experience-examples.json)를 함께 사용한다.

기준 원문은 [79 생성 필드](79-CREATION-FIELDS-VALIDATION-COPY.md),[35 초기6능력](35-SIX-ABILITIES-FOUR-FOCUS.md),[43 대학](43-COLLEGE-CAREER.md),[23 미국 권리](23-US-CONTRACTS-RIGHTS.md),[41 평가](41-SIX-STAT-ENGINE.md),[82 확률](82-PROBABILITY-EFFECTS-CONFIRMATION-AUDIT.md)다. 아래 화면·문구는 상세 기본안이며 기존 자격·성장·권리 규칙을 변경하지 않는다. 실제 리그 최신 제도를 주장하는 문서가 아닌 게임 설계다.

## 생성 S02

기본 흐름: 이름·고교→선수 종류/포지션·투타→유형/6능력→집중4개→난이도·희망 구단→계정·최종 확인. 보드의3상태는 이 흐름을 묶은 대표 배치이며 실제 모든 입력 필드의 세부 검증은79를 따른다. 본 비교 보드의 값은 고정 예시,실제 입력·선택 동작은 기존45화면 보드와 향후 앱 구현에서 연결한다.

타자 예시 거포형40/70/45/40/40/65,투수 강속구형70/65/35/40/50/40. 각각 합300·종합50.0/100. 육성은 해당6개 중 서로 다른4개,유형은 자유 능력 분배나 재뽑기 기능이 아니다. 유형 변경과 추천 육성 적용은 별도 행동이며5번째를 고르면 기존 선택을 몰래 해제하지 않는다.

이름은1~12글자소/NFC·앞뒤 공백 정리/제어문자 금지,고교는 가상ID,나이는18세로 고정. 좌투 C/2B/3B/SS를 금지하고 손을 바꿨다고 포지션을 자동 교체하지 않는다. 종류 전환은 종류별 초안을 보존하되 타자 키와 투수 키를 섞지 않는다.

일반·하드 생성 전에는 실제 개인 P가 아직 없어 잠재력 범위를 꾸미지 않는다. ‘시작 후 스카우트 평가로 확인’으로 표시한다. 초기 폼에 숨김 치트 버튼·암시 문구를 노출하지 않는다. 기존 일반3→하드4 입력으로 해금한 후 수동 선택한다는 규칙은 유지한다. 확인은 단순 설정이므로 적용 확률 배지 없이,이름/18세/유형/6능력/집중4/난이도/희망 구단 비보장/계정/‘이 선수로 시작’ 순서다.

마지막 확정 전 세계를 만들지 않는다. 입력 오류는 입력 유지·첫 오류로 이동. 생성 요청 후 앱을 닫았다면 다음 실행에서 **이어하기**로 동일 생성 요청/세계에 연결한다. 생성·복구 상태 설명 카드를 새로 만들지 않는다. 실제 로그인이나 연결 오류만 필요한 때 짧게 표시한다.

## 졸업 진로 S28 / 미국 제안 연결 S29

| 상황 | 표시하는 카드 | 표시하지 않는 것 |
|---|---|---|
| 졸업 완료·국내 계약 없음·미국 자격/제안 미충족 | KBO 드래프트 전망·대학 등 현재 합법 진로 | 비활성 미국 카드·오퍼 없는 진출 버튼 |
| 미국 스카우트 평가≥65·유효 미국 제안≥1·법적 게임 상태 충족 | 국내·대학·미국 제안 확인 | 계약 수락을 하지 않았는데 다른 진로를 종료하는 처리 |
| 같은 졸업 시점 KBO/미국 계약 확정 또는 대학 입학 확정 | 확정한 다음 커리어 화면 | 이전 시점의 중복 진로 재선택 |

미국 카드 노출에는 미국 스카우트 평가65 이상과 유효 제안이 **동시에** 필요하다. 종합52는 자격 문턱이 아니며 평가가 충분해도 유효 제안0이면 카드가 없다. 카드가 있던 오래된 화면에서 제안이 만료되면 최신 합법 진로로 돌아온다. 제안 세트는 해당 시점에 고정하며 새로고침으로 수·금액·잠재력을 재추첨하지 않는다. 제안 열람과 계약 서명을 분리한다.

보드 국내 사례 B45는 전체 지명50%/지명된다면10라운드 유력. 유효 미국 제안 사례는 종합55·국내 성적지수50으로 국내 B53.5, 별도 미국 스카우트 평가65다. 변동±5의 전체 분포는10R5%/9R40%/8R40%/7R15%이므로 예상8~9라운드로 표시한다. 전체 지명 확률은1이어서 숫자 배지를 숨긴다. 실제 라운드가 전망과 다를 수 있다. 학교 선택·기존 계약서 확인·설정 변경에는 확률 배지를 붙이지 않는다.

## 대학 선택 S34 / 대학 커리어 S35

9개 가상대학의 최소종합·주전 평가 기준을43 원문에서 가져온다. 입학 조건은 확정 조건,입학 성공률을 만들지 않는다. 종합50 예시에서 최소48인 서강산대/남해솔대와 최소1인 해오름대/온누리대/새길대가 입학 가능하다. 한빛대·청해대는55,백림대·동운대는52 조건을 표시한다. 미국 버튼을 숨기는 규칙과 달리 학교 목록은 조건 미달 사유와 함께 비교할 수 있다.

학교별 실제 포지션 슬롯·경쟁 순위·예상 역할을 확인하고 입학 확정을 별도로 수행한다. 주전 평가 기준은 출전 보장이나 추가 성장 배수가 아니다. 하위3학교는 건강하고 진학 가능한 선수를 받는 원문의 막힘 방지 규칙을 따른다. 이미 프로 계약을 체결한 상태에 강제로 입학 경로를 만들지 않는다.

일정:9팀·상대8팀×6=팀48/리그216,학교별 홈24·원정24. 상위4팀의 선수권은 별도 기록이며 성장 예산을 추가로 지급하지 않는다. 대학 기록·프로 기록·국제 기록을 구분한다. 미출전/부상이어도 합법 학년 마감을 진행할 수 있다.

2학년 마감에는 조기 드래프트1회 또는 재학을 제공하고,미국은 별도 자격·유효 오퍼가 있을 때만 제공한다. 조기 미지명/계약 전 거절은3학년 복귀 가능,독립 준비 예산을 소비하지 않는다. 프로 계약 체결 후 복학은 제공하지 않는다. 조기 시도와 졸업 드래프트는 다른 기회다.

병역 휴학은 학년과 세계 연도를 분리한다. 완료 학년은 보존하고 진행 중 학년은 복무 후 다시 시작하되 당시 기록을 지우지 않는다. 나이는 세계 달력대로 진행한다. 제대했다고 입학 때 나이나22세로 되돌리지 않는다. 실제 병역 자격과 대표팀 성과는 기존20/21 계약을 따른다.

## 미국 커리어 S30 / 협상·복귀 연결

계약 조건 확인→서명→현재 Rookie/A 등록→레벨별 경기/검토→명단 이동→실제 출전의 흐름이다. 고교 직행은 미국 구단과의 계약이며 초기 육성 레벨을 카드와 확인창에 명시한다. 계약금/연봉/통화/기간/차출·복무 조항/보유권은 수락 전에 제공한다. 계약금은 확정 영수증으로1회 개인 수입에 기록하고 능력 성장 재화로 바꾸지 않는다.

모든 리그에서 같은1~100능력 척도. 미국으로 이동했다고 능력을 일정 비율로 깎지 않는다. 상대 분포와 실제 출장에 따라 성적이 달라지는 원문 엔진을 사용한다. Rookie/A/AA/AAA/MLB 정규 기록을 레벨별로 분리하며 세계시즌 성장·XP 소비 원장은 공유한다.

콜업 검토는 현재 레벨의 실제 표본·검토 시점·능력/성적·권리/정원을 확인한다. 조건 충족과 승격 확정을 분리하고,적격하지만 자리가 없으면 같은 레벨에서 준비한다. 조회·새로고침·레벨 왕복으로 검토 기회를 늘리지 않는다. 정확한 확률 모형이 없는 콜업에 임의 승격률을 만들지 않는다.

보드 마지막 사례는 MLB 명단 등록/실제 출전0. 첫 출장 기록과 데뷔 기념품은 실제 출전 이후다. MLB0경기로 미국 생활이 끝나도 마이너 기록과 커리어를 보관할 수 있다. 부상 재활 강등은 실패/방출과 다른 이유로 표시한다.

포스팅은 자격→원구단 승인/보류→협상→유효 제안 서명 또는 기존 계약 유지의 기존23 계약을 따른다. 포스팅 보상금은 구단 수입이며 개인 연봉에서 차감하지 않는다. 미국 계약 종료/국내 복귀는 원구단 보유권·직행 출신 준비기간·유효 옵션을 검사한다. 고교 직행과 KBO 경력자의 복귀 조건을 섞지 않는다. 이 페이지는 새 포스팅 수식이나 복귀 연차를 제안하지 않는다.

## 예외와 이어가기

[진로 예시](journey-experience-examples.json)에16개 실행 전 예외를 기록한다. 이름·좌투 조합·집중 개수·종류 전환·생성 중복·미국 경계 조건/오퍼0/만료·진로 확정 경합·복학·학년/나이·콜업 정원·등록/출장을 분리한다.

정상 재진입에서는 사용자가 누르는 **이어하기**만 제공하고 내부 저장/영수증/학적/등록을 확인한 뒤 해당 화면으로 연결한다. 중단 종류 선택기나 복구 안내 단계를 노출하지 않는다. 필요한 미확정 계약/진로는 원래 선택 화면에서 확인한다. 이전 URL로 이동했다고 종료한 진로를 다시 열거나 새 세계를 만들지 않는다.

이미지는 기존 훈련/대학/해외 장면을 재사용한다. 오퍼 없는 진로에 출국 그림을 미리 붙이지 않는다. 생성은 폼과6능력 우선으로 별도 큰 그림 없이 표현한다. 모든 예시는 가상 선수·학교이며 기존 글자체와 빈티지 스타일을 유지한다.

정적 검사:20대표 화면/48순수 HTML 문자열 상태,초기 합300/평균50,미국 자격 경계·유효 오퍼,대학9팀48/216,초기 대학5개 조건, B53.5분포 합1/최빈8·9라운드,등록과 출장0 문구. 실제 생성·드래프트·진학·콜업·저장·브라우저 동작은 미시험이다. 기존298게임 기대값과 별도이며 file: 브라우저 제한을 우회하지 않는다.

---

<!-- SOURCE: 100-HIDDEN-TRAITS.md -->

# 100. 히든 특성 — 도감 진척 표시와 신규 T13~T16 (확정)

사용자확정U(2026-10-19):①일반특성은거의정확한수치로조건진척표시②히든특성은존재여부와추측가능한이름·한줄암시만,진척/수치은닉③신규히든4개(타자2+투수2),T01~T12는그대로공개④효과는기존보다약간강하되같은cap안⑤해금근거는희귀기록사건·스토리관계사건·누적장기기록혼합⑥해금즉시조건·효과·근거경기전체공개. T13~T16의이름·조건·효과배율은사용자확정U(2026-10-19);세부계수도아래 효과 계수 표로 확정. [56](56-TRAITS-DETAILED-CONTRACT.md)·[65](65-USER-TRAITS-XP-STAFF.md)의자동적용/소급금지/cap규칙을그대로따른다.

## 도감 표시 규칙

| 대상 | 미해금 카드 | 해금 후 |
|---|---|---|
|T01~T12(일반)|이름·조건·진척표시(예 정규 BB 27/30). 능력조건은 현재 영구값/문턱|효과·근거경기|
|T13~T16(히든)|이름+한줄암시만. 진척막대·수치·조건종류·근접도 표시없음|조건·효과·근거경기 전체공개|

- 히든은 ‘??? ’대신 이름을 보여준다. 이름은 계열을 추측할 수 있어도 정확한 문턱은 노출하지 않는다.
- 히든 존재 개수는 도감 헤더에 ‘숨겨진 특성 4’로 표시(개수는 공개, 내용은 비공개).
- API: 미해금 히든은 `progress`/`evidenceRef`/`predicateKey`를 응답에서 제외하고 `hidden:true,name,hint`만 반환. 해금 후에만 전체 필드. 클라이언트 번들/정적 JSON에도 문턱 수치를 두지 않고 서버가 판정한다. 이로써 UI 은닉이 아닌 응답 수준 은닉.
- 일반 특성 ‘거의 정확’= 정수 진척(현재/문턱)이며 소수 확률 같은 내부 계산값은 노출 안함.
- 도감 열람은 읽기전용이며 난수·save revision 변경 0(기존 S38과 동일).

## 신규 히든 특성 T13~T16 (확정)

| ID | 이름(확정) | 처리유형 | 해금 근거(비공개) | 암시 한줄(공개) |
|---|---|---|---|---|
|T13 타자|끝내기 본능|로그잇효과|커리어 끝내기 안타 3회 이상(희귀 기록 사건)|“마지막 순간에 배트가 먼저 안다.”|
|T14 타자|숙적 킬러|로그잇효과|같은 라이벌 투수 상대 정규 한시즌 PA≥20·OPS≥.900 + 해당 관계 이벤트 승리 확정|“누군가에게만은 지고 싶지 않다.”|
|T15 투수|완봉의 맛|로그잇효과|커리어 완봉 3회 이상(희귀 기록 사건)|“마지막 아웃까지 마운드를 내주지 않는다.”|
|T16 투수|꾸준한 에이스|로그잇효과|OFFICIAL 정규 5시즌 연속 선발 규정이닝(누적·장기)|“해마다 같은 자리에 서 있다.”|

효과크기(확정): 기존 T01~T12 대비 최대 +약 25%이내로 약간 강하게. logit 개별효과는 기존 최대치의 1.25배 이내이며 합산cap ±.06, 구종·성향 포함 ±.10은 그대로. 히든이라서 cap을 넘거나 cap 제외 처리하지 않는다. 구체 계수는 아래 확정 표를 사용하고 [08](08-FORMULAS.md)·[75](75-EXACT-EFFECTS-PUBLIC-INFORMATION.md)의 효과 공개 절차를 따른다.

## 판정·공정성 규칙

- 해금 판정은 서버가 경기 최종커밋 후 [56](56-TRAITS-DETAILED-CONTRACT.md)과 같은 transaction에서 수행. 해금즉시 다음 타석 snapshot부터 적용, 소급 변경 없음.
- T14/T16처럼 시즌·관계 근거는 worldSeasonId+competitionId 묶음 기준, 다른 레벨 합산 금지(56 규칙).
- AI·동료·상대도 같은 조건으로 해금(주인공만 조건 완화 없음). 개인치트로 히든 일괄 해금 없음.
- 어린 복사본은 히든 해금 0/기록 0으로 시작. archive의 hiddenUnlocked/evidence/definitionVersion 보존.
- 해금 순간 연출: 단순 토스트가 아닌 ‘숨겨진 특성 해금’ 카드 1회+도감에서 근거 경기 열람. 해금 전엔 어떤 알림·추가 힌트도 노출 없음.
- 상세도움말: 총보정이 cap에 닿으면 ‘원합/적용합’ 구분(기존 규칙), 히든이라고 누락 표시 안함.

## 화면 상태(S38 확장)

| 상태 | 설명 |
|---|---|
|H0 목록 로딩|스켈레톤. 실패 시 ‘불러오지 못함’이며 도감 0개로 취급 금지|
|H1 일반 미해금|이름·조건·정수 진척|
|H2 히든 미해금|이름+한줄암시, 진척 없음, 탭 시 ‘조건은 해금 후 공개됩니다’|
|H3 해금 직후|근거 경기·효과 전체 표시, 해금 카드|
|H4 보유 목록|일반+히든 통합, 히든은 ‘숨겨졌던 특성’ 표식|
|H5 다른기기 진행|재조회 후 새 해금 반영, 중복 알림 0|

## 검수 항목(확정)

HT-D01 미해금 히든 응답에 progress/predicateKey 없음/02 해금 후 전체 필드/03 같은 경기 receipt 재처리 중복 해금 0/04 T13 끝내기 2회→3회 1해금/05 합산 cap +.06 초과 시 원합·적용합 구분/06 원본 복사 시 히든 해금 0/07 도감 열람 난수 0/08 AI 동일 조건 해금.

## 남은 확인

T13~T16 이름·조건·효과계수는 사용자확정U(2026-10-19)이다. 105에서47/56·공개 시안·서버용 설계 정의·정적 검증에 연결했다. 실제 API·해금/DB 실행검증은 미실행이다.
## 효과 계수 (확정)

기존 시그니처 .04 대비 약 25% 강하게, 합산 cap ±.06, 구종·성향 포함 ±.10 안에서 적용(위 cap 규칙 동일). 활성 조건은 56과 같은 타석 시작 snapshot.

| ID | 활성 조건 | logit 효과 |
|---|---|---|
|T13 끝내기 본능|inning≥9, BOTTOM, 동점 또는 1점 차 뒤짐|1B +.05 / 2B +.04 / K -.03 |
|T14 숙적 킬러|107의 조건을 충족한 라이벌 투수 집합의 상대 타석|HR +.05 / 2B +.03 / K -.03 |
|T15 완봉의 맛|본인 선발, inning≥7, 본인 실점 0|OUT +.05 / BB -.03 / HR -.02 |
|T16 꾸준한 에이스|본인 선발 등판 중|OUT +.04 / BB -.03 |

해금 즉시 위 조건·효과·근거 경기가 모두 공개된다(위 표시 규칙).

2026-10-19 후속 사용자확정U: T14는 같은 라이벌 투수 상대 시즌20타석 이상·OPS .900 이상+관계 이벤트 승리. OPS는 표시 반올림이 아닌 원기록 분수로 검사하며 AB0은 달성 처리하지 않는다. 당시 라이벌 쌍·worldSeasonId·competitionId·REGULAR를 묶고 실제 승리 영수증을 근거로 사용한다. 서버용 규칙은server-only/hidden-trait-rules.json,미해금 공개 DTO 예시는hidden-traits-locked-preview.json으로 분리했다. 보드·47/56 연결과 정적 검증을 추가했으며 실제 판정/DB/응답 은닉 시험은 미실행이다.

후속 경계 계약 D: [107 라이벌·히든 경계](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)의 프로 형성/직접 결투 WIN·T14 대상 집합/완봉·연속 시즌/정정 규칙을 해당 범위에 적용한다. 사용자 확정 해금 문턱·효과는 유지한다.

---

<!-- SOURCE: 101-REPERTOIRE-STATE-UI.md -->

최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 구종 화면(투수)에는 본인 투구폼의 친화 구종 표시(예 ‘오버핸드: 포심·커브 K+.01’)를 정확한 값으로 두고 숙련·예산과 섞지 않는다.

# 101. 구종 화면(S39) 상태별 UI — 비율 슬라이더·숙련 표시·변경 소진

사용자확정U(2026-10-19):①활성 비율은슬라이더+자동보정②숙련은등급별+다음등급까지XP③구성변경기회소진시읽기전용+다음창안내. 규칙원문은[57](57-REPERTOIRE-DETAILED-CONTRACT.md)·[65](65-USER-TRAITS-XP-STAFF.md)이며 여기서는 화면배치만 정한다. 자동보정 알고리즘은 사용자확정U(2026-10-19), 문구는 초안D.

## 비율 슬라이더 + 자동보정

- 활성 2~4종, 각 weight 정수10~90, 합100(57). 슬라이더로 구종A를 움직이면 나머지 활성 구종이 현재 비율에 비례해 조정되어 합100 유지. 합99/101 입력은 UI에서 만들 수 없다(서버는 여전히 422 INVALID_ALLOCATION 검증).
- 보정 순서(확정): ①A를 [10, 100-10×(나머지수)]로 clamp ②나머지에 (100-A)를 기존비율로 배분 ③정수 반올림 잔여는 최대잔여법, 동률은 pitchId순 ④10 미만이 되는 구종은 10으로 고정 후 재배분.
- 슬라이더 이동 중 값은 로컬 미리보기이고 난수·save revision 변경 0. 확정 전까지 서버에 쓰지 않는다.
- 숙련0 구종은 활성 슬라이더에 노출하지 않는다(57: 학습0등급 weight0/active=false).
- 비율 영역과 숙련 영역은 분리하고 같은 숫자로 표시하지 않는다(57 S39). 비율은 ‘%’, 숙련은 ★.

## 숙련 표시

| 항목 | 표시 |
|---|---|
|등급|★0~★5 (누적XP [0,10,30,60,100,150] 이하 최대 index)|
|진척|‘다음 등급까지 12/40’ 형태. ★5는 ‘최대 등급’|
|개인치트|표시 방식 동일(XP는 1e-4 정수 내부값, 화면은 정수XP 소수 버림)|
|상한|P(투수 능력) 상한100처럼 표현 금지|

연간 구종 성장 예산(기본20, 치트주인공 상한60)은 별도 요약줄 ‘올해 구종 성장 예산 사용/예약/남음’으로 표시하며 등급 진척과 합산하지 않는다.

## 구성 변경 기회 소진

- 창(프리시즌/정규절반)마다 구성변경 1회, 성향변경 별도 1회(57). 기회 소진 시 구성 편집은 읽기전용: 슬라이더/슬롯 교체 비활성, 상단에 ‘이번 창의 변경 기회를 사용했습니다. 다음 변경 가능: 정규 절반’ 표시.
- 같은 내용 확정(NO_CHANGE)은 기회 소모 없음 안내(57). 소진 상태에서는 편집 UI와 확정 버튼을 모두 숨기고 현재 구성만 보여준다(초안).
- 학습 계획은 프리시즌(PRE)만 1회. 소진/창 닫힘이면 ‘다음 프리시즌에 선택’ 안내, 확정 후 취소 불가(57).
- 복무로 놓친 MID 창은 복귀 시 1회 안내, 시즌 넘기면 소멸 문구.

## 화면 상태(S39 확장)

| ID | 상태 | 요점 |
|---|---|---|
|P0|로딩/실패|실패는 ‘불러오지 못함’, 구종 0종으로 취급 금지|
|P1|투수 구성 편집가능|슬롯4, 활성 슬라이더, 숙련★, 예산 요약|
|P2|투수 구성 읽기전용|기회 소진/창 닫힘, 다음 창 안내|
|P3|학습 계획 선택|PRE만. 미보유 구종 선택, 4슬롯 가득이면 비활성화 대상 먼저 선택|
|P4|학습 진행/분기 정산|분기별 지급분, 부상분기 비례 안내(예 치트 3.75)|
|P5|타자 성향|S39 타자 분기. 구종 영역 없음, 성향4종 중 선택, 창당 1회|
|P6|다른 기기 진행|재조회 후 최신 반영, 로컬 미확정 편집 폐기 안내|
|P7|응답유실 재시도|같은 receipt면 중복 소모 없이 최종 상태 표시|

## 검수 항목(초안)

RS-D01 슬라이더 이동 합100 유지/02 10 미만 방지/03 경계 .60 구간 확인은 엔진 fixture 유지/04 기회 소진 시 편집·확정 비활성/05 NO_CHANGE 기회 소모 0/06 ★5 최대 표시/07 학습 부상 분기 3.75 표시/08 숙련0 활성 슬라이더 미노출/09 열람 난수 0. 실행검증은 구현 후.

## 남은 확인

문구는 초안. 105에서48/57·상세 비교 보드의 순수 슬라이더·정적 검증에 연결했다. 실제 서버 확정/변경 기회·브라우저 실행검증은 미실행이다.

## 타자 성향 카드 (P5, 확정)

사용자확정U(2026-10-19):성향 4종은 카드 선택, 카드마다 정확한 효과 표시, 창당 1회 변경 유지. 효과값은 [48](48-PITCHES-BATTING-APPROACH.md) 원문을 그대로 쓴다.

| 카드 | 표시 효과(logit) | 표시 대가 |
|---|---|---|
|균형|효과 없음|대가 없음|
|당겨치기|HR +.03 / 2B +.01|1B -.02 / OUT +.01|
|밀어치기|1B +.03 / 2B +.01|HR -.03|
|전방향|1B +.015 / 2B +.015|HR -.015 / BB -.01|

- 카드 4장을 한 화면에 나란히 배치(모바일은 세로 목록), 현재 선택 카드에 ‘적용 중’ 표식. 효과와 대가를 한 카드에 함께 보여 효과만 강조하지 않는다.
- 타구방향 좌표가 없는 v1이므로 ‘밀어/당겨 타구 비율’, ‘시프트 성공률’ 같은 방향별 실제 수치는 표시하지 않고 접근 방식 설명만 쓴다(48).
- 총보정은 특성·구종과 합쳐 ±.10 cap 안에서 softmax. cap에 닿으면 상세에서 원합/적용합을 구분.
- 변경: 카드 선택 → 확정. 창(프리시즌/정규절반)당 1회, 같은 카드 재선택은 NO_CHANGE로 기회 소모 0. 소진되면 카드 선택 UI는 읽기전용으로 현재 카드만 표시하고 ‘다음 변경 가능: 정규 절반’ 안내(위 변경 소진 규칙 동일). 구단 생성 전에는 변경 가능.
- 영구 능력은 성향으로 바뀌지 않음. 구종 영역과 별개 화면 영역이며 투수 전용 비율 슬라이더는 타자에게 노출하지 않음.

검수 PA-D01 카드 4장 정확 효과 표시/02 같은 카드 NO_CHANGE 기회 0/03 소진 시 읽기전용/04 방향별 실제 수치 미표시/05 cap 시 원합·적용합/06 열람 난수 0.

표시 정밀화 D: ‘다음 등급까지12/40’은 획득/필요 구간 진척과 남은XP를 혼동할 수 있어 ‘다음 등급까지28 XP · 구간 진척12/40’로 구분한다. XP30/★2 예시는 다음60까지30XP,XP10/★1은 다음30까지20XP다.

---

<!-- SOURCE: 102-GOALS-STATE-UI.md -->

# 102. 목표·도전과제(S40) 상태별 UI

사용자확정U(2026-10-19):①PRE 선택은 추천 3 + 전체 목록 ②진행 중 목표는 정확 수치+막대 ③도전과제 12종은 미달성도 조건 전부 공개 ④기념 외형 장착은 기념 보상 탭+선수 카드 미리보기 ⑤MID 교체창의 선택 불가 목표는 회색+사유 표시. 규칙원문은 [58](58-GOALS-DETAILED-CONTRACT.md)이며 보상은 기념 외형만, 게임 능력/잠재력/재화/구종XP 영향 0(gameplayRewardDelta:0)을 유지한다. 문구·배치는 초안D.

## 탭 구성

시즌 / 커리어 / 기념 보상 3탭(58). 도전과제는 커리어 탭에 두며 12종 조건은 숨기지 않는다(히든 특성과 달리 능력 영향이 없어 은닉 이점이 없음).

## PRE 목표 선택

- 상단 ‘추천 3’: 58의 추천 규칙(자격 필터→전시즌 실적비율 .5~1.2→진척→goalId순)을 그대로 사용. 카드에는 근거 문구(예 ‘지난 시즌 BB 24, 목표 30’)만 두고 ‘달성률 75%’ 같은 확률·퍼센트 예측은 없다. 추천은 자동선택이 아니다.
- 하단 ‘전체 목록’: 종류/레벨 자격에 맞는 목표만(G01~G10 중). 추천 밖 목표도 자유 선택. 슬롯 0~3, 선택 0개로도 진행 가능.
- 선택 흐름: 목표 담기 → 슬롯 3칸 요약 → preview(현재 진척·자격·보상 보유·교체 사용 후 상태) → 확정. 정규 첫 경기 명령 확정 후 잠금 표시 ‘이번 시즌 목표가 확정되었습니다’.
- 같은 목표 중복·4개 시도는 UI에서 막고 서버는 422 SLOT_CONFLICT로 재검증.

## 진행 표시

활성 목표 카드: 이름 · 정확 수치(예 BB 22/30) · 진척 막대 · scope(리그·정규 시즌) · 기한. 이적으로 다른 leagueId로 옮기면 ‘이전 리그 기록 기준’ 표시, MID 잔여 교체 가능 안내. 기록 없음과 조회 장애를 구분하고 규정 분모 0이어도 목표 선택/시즌 진행은 가능.

## MID 교체창

미완료 ACTIVE 슬롯 1개만 1회 교체. 선택 불가 목표는 목록에 남겨 회색 처리하고 사유 한 줄을 붙인다.

| 사유 코드 | 표시 문구(초안) |
|---|---|
|ALREADY_SATISFIED|이미 달성 수치입니다 (예 BB 33/30)|
|NOT_ELIGIBLE|현재 종류/리그 자격이 아닙니다|
|LIMIT_REACHED|이번 시즌 교체 기회를 사용했습니다|
|SLOT_CONFLICT|이미 선택한 목표입니다|

완료 슬롯은 교체 불가(보상 후 비우기, 재사용 불가). 교체 후 신규 목표는 시즌 시작 이후 같은 scope 전체 진척에서 시작(BB22→G04 교체면 22/30).

## 도전과제·기념 보상

- 도전과제 A01~A12는 미달성도 이름·조건·현재 진척(해당 시)을 표시, 달성 시 ‘달성’ 표식+근거 경기 링크. 보상은 자동 해금이며 수령 버튼이 없다. 이미 보유한 보상은 ‘보유 중’, 대체 재화 없음.
- 기념 보상 탭: 칭호/프레임/배경/스탬프 슬롯별 보유 목록 + 선수 카드 미리보기. 선택하면 카드에 즉시 미리보기, ‘적용’으로 프로필 선호(cosmetic_preferences)에 저장. 미보유는 잠금 표시, 서버는 422 NOT_ELIGIBLE. 저장은 save revision/난수 불변, expectedPreferenceRevision으로 충돌 시 최신 재조회.
- 해금 연출은 1회 카드이며 연출 실패 후에도 재수령 버튼 없음. 정정으로 기준 미달이 되면 목표 행은 CORRECTED로 표시하되 이미 해금한 외형은 회수하지 않는다.

## 화면 상태

| ID | 상태 | 요점 |
|---|---|---|
|GL0|로딩/실패|실패는 ‘불러오지 못함’, 목표 0개로 취급 금지|
|GL1|PRE 선택|추천3+전체목록, 슬롯 3칸|
|GL2|확정/잠금|정규 첫 경기 후 목록 잠금|
|GL3|진행 중|정확 수치+막대, scope 표시|
|GL4|MID 교체창|1회, 회색+사유|
|GL5|완료|COMPLETED, 근거 불변, 보상 해금 표시|
|GL6|만료/달성불가|EXPIRED·졸업/병역으로 불가 사유 표시, 능력 감소 없음|
|GL7|커리어 도전과제|12종 조건 공개, 달성 근거|
|GL8|기념 보상 장착|슬롯별 목록+카드 미리보기|
|GL9|충돌/재조회|409 PREVIEW_STALE 시 최신 진척 재조회|

## 검수 항목(초안)

GU-D01 추천 근거 문구에 퍼센트 예측 없음/02 BB22→G04 교체 시 22/30/03 BB33 회색+ALREADY_SATISFIED/04 완료 슬롯 교체 불가/05 선택 0개 진행/06 도전과제 미달성 조건 공개/07 보유 보상 재화 0/08 장착 저장 시 난수·save revision 불변/09 미보유 장착 422/10 조회 장애와 기록 없음 구분/11 gameplayRewardDelta 0. 실행검증은 구현 후.

## 남은 확인

문구·배치는 초안D이며106에서 원문·대표 시안·순수 로컬 조작·정적 검수에 연결했다. 실제 앱/API/DB/기기 검증은 미실행이다.

최신 연결 범위는 [106](106-EXPANSION-UI-CLOSURE.md),실행 전61항목의 원문/시안 진입점은state-ui-preview-coverage.json이다. NOT_EXECUTED를 유지한다.

---

<!-- SOURCE: 103-AGENTS-RELATIONS-STAFF-STATE-UI.md -->

# 103. 에이전트·라이벌·지도자(S41~S43) 상태별 UI

사용자확정U(2026-10-19):①연봉 상향 요청은 상향률별 p 정확 표시 ②S42는 상대 카드 목록→상세 ③빈 상태는 이유별 문구 분리 ④S43은 탭 2개(내 원본/가상) ⑤고용 미리보기는 보장총액+해임 시 남는 빚 ⑥코치 담당 변경은 현재/변경 후 효과 비교. 규칙원문은 [59](59-AGENTS-DETAILED-CONTRACT.md)·[60](60-RELATIONS-DETAILED-CONTRACT.md)·[61](61-STAFF-DETAILED-CONTRACT.md). 문구·배치는 초안D.

## S41 에이전트·재협상

- 흐름: 담당 비교 → 순수입/관계 근거 → 요청 대상 → p/실패 후 경로 → 확인 → 결과(59).
- 연봉 상향 요청 미리보기: +10%/+20%/+30% 세 행에 상향 금액(만원 단위 half-up)과 성공 확률 p를 정확 수치로 나란히 표시. 모든 p는 [.10,.90] 범위이며 p=1이나 증액 .99 같은 입력은 없다. 전용 난수 스트림은 확정 때만 소비하고 미리보기·재시도는 소비 0.
- 같은 화면에 ‘실패해도 기본 오퍼는 유지됩니다’, ‘이 오퍼 묶음의 요청 기회 1회’를 함께 표시. 성공은 상향 오퍼 생성일 뿐 계약 자동 체결이 아니며 기본 오퍼는 SUPERSEDED 표시.
- 기용 요청은 ‘추가 평가 수용’으로 표기하고 ‘주전 요청 성공’ 문구를 쓰지 않는다. 경쟁자 0이면 odds 없이 ‘검토 요청 확정’ 문구만.
- 409 PREVIEW_STALE이면 새 p·조건을 다시 보여주고 재확인. 수수료는 2%, 급여별 gross/fee/net 근거 표시.

## S42 라이벌·동료

- 진입: 상대 카드 목록(라이벌/동료 구분, 단계 FORMED·SEPARATED·REUNITED_OPPONENT·REUNITED_TEAM·RETIRED 표시) → 카드 탭 → 상세(연표→scope 필터→실제 전적→근거 경기/연대기).
- 상세 모드: 투타 직접대결(DIRECT)이면 대결 전적, 같은 kind끼리(타자-타자 등)면 비교(COMPARISON)로 각자 시즌 스탯과 실제 동시 출장 경기수만 표시하고 직접대결 AVG는 만들지 않는다.
- scope는 리그/PS/국제를 섞지 않고 탭 또는 필터로 분리.
- 빈 상태 문구를 이유별로 분리:

| 이유 | 문구(초안) |
|---|---|
|예정 없음|아직 예정된 맞대결이 없습니다|
|은퇴|상대가 은퇴했습니다. 기록은 그대로 보존됩니다|
|로그 없음|이 범위에는 경기 기록이 없습니다|
|직접전적 미제공|같은 종류 선수끼리는 직접 상대 전적을 제공하지 않습니다|
|조회 실패|불러오지 못했습니다(기록 없음과 구분)|

- 열람은 읽기전용이며 난수·save revision 변경 0. 벤치 등록만 한 재회는 ‘대진 예정’ 뉴스까지만 표시.

## S43 은퇴 지도자 고용

- 후보 탭 2개: ‘내 원본’(은퇴 선수 원본, 역할 claim 상태 표시: 현역 복사/지도자 중) / ‘가상’(sourceArchiveId=null 후보). 사용 불가 원본은 회색+‘현재 역할: 현역’ 링크로 해당 화면 이동. 자동 방출·해임 없음.
- 후보 카드에 등급(1/2/3)과 근거(완료 프로 등록 시즌 0~2/3~7/8이상)를 표시. 실제 등판수·나이와 혼동하지 않음.
- 고용 미리보기: 연봉(코치 1.5억, 스카우트 1억 KRW 기준 D) · 보장총액(남은 일수 비례) · 효력 시작일/종료일 · 해임 시 남는 빚(미지급 보장분은 guaranteed 분류로 남음, 이중 차감 없음) · 담당/현재 효과.
- 코치 담당(타자/투수) 변경: 현재 담당 효과와 변경 후 효과를 정확히 나란히 비교(예 +.04 → +.05, 훈련계수 상한 1.2), 효력은 ‘다음 세계일부터’ 명시, 당일 변경 1회. pendingGame이면 확정 불가 안내.
- 스카우트는 effectiveLevel=min(5, 시설 레벨+등급2 이상 보너스)을 미리보기에 반영.

## 화면 상태

| ID | 상태 | 요점 |
|---|---|---|
|AG0|로딩/실패|실패는 협상 0건으로 취급 금지|
|AG1|담당 비교|수수료·순수입 근거|
|AG2|상향 요청 미리보기|세 상향률 p+금액|
|AG3|결과|성공(상향 오퍼 생성)/실패(기본 오퍼 유지)|
|RL0|상대 목록|카드+단계|
|RL1|상대 상세 DIRECT|전적·마일스톤|
|RL2|상대 상세 COMPARISON|직접 AVG 없음|
|RL3|빈 상태|이유별 문구|
|ST1|공석·탭|내 원본/가상|
|ST2|고용 미리보기|보장총액·해임 후 빚|
|ST3|담당 변경|현재/변경 후 비교|
|ST4|충돌|SLOT_CONFLICT, 현재 역할 링크|

## 검수 항목(초안)

AG-U01 세 상향률 p·금액 표시/02 실패 후 기본 오퍼 유효/03 미리보기 난수 0/04 기용 요청 ‘추가 평가 수용’ 문구/RL-U01 카드 단계 표시/02 같은 kind DIRECT 금지/03 이유별 빈 문구/04 열람 난수 0/ST-U01 현역 claim 후보 회색+링크/02 반년 보장 75000000/03 해임 시 남는 빚 표시/04 코치 1.18+.05→1.2 비교/05 효력 ‘다음 세계일’ 표시. 실행검증은 구현 후.

## 남은 확인

문구·배치는 초안D이며106에서 원문·대표 시안·순수 로컬 조작·정적 검수에 연결했다. 실제 앱/API/DB/기기 검증은 미실행이다.

최신 연결 범위는 [106](106-EXPANSION-UI-CLOSURE.md),실행 전61항목의 원문/시안 진입점은state-ui-preview-coverage.json이다. NOT_EXECUTED를 유지한다.

---

<!-- SOURCE: 104-COMMENTARY-CHRONICLE-STATE-UI.md -->

# 104. 감상형 중계(S44)·연대기(S45) 상태별 UI

사용자확정U(2026-10-19):[중계] ①중요경기 후보는 경기 전 카드 1회+홈 배지 ②재생 컨트롤은 하단 고정 바(1타석·재생·배속·스킵) ③재방문 FINAL은 처음부터/이어서 선택+스코어 숨김 선호. [연대기] ④목록은 시즌별 책+최신순 피드 ⑤공식 영역+‘내 메모’ 박스로 구분 ⑥내보내기는 미리보기→확인→상태 라인. 규칙원문은 [62](62-COMMENTARY-DETAILED-CONTRACT.md)·[63](63-CHRONICLE-DETAILED-CONTRACT.md). 중계는 경기 전 전략·타석 중 전략 개입이 없고 연대기·중계는 능력/보상 delta 0을 유지한다. 문구·배치는 초안D.

## S44 감상형 문자 중계

- 중요경기 후보(첫 KBO/MLB/국제 출장, 결승, 첫 라이벌 재회 예정, 사전 은퇴 선언 후 마지막 예정 출장, 기록 문턱 직전): 경기 직전 ‘중계로 볼까요?’ 카드를 같은 후보 상태 version에서 한 번만 표시하고 같은 경기 이유가 여럿이면 하나로 합친다. 놓쳐도 홈과 기록에 배지로 남는다. 설정 OFF면 후보 읽기만 생략. 실제 출장 0이면 데뷔/재회/은퇴 장면을 만들지 않는다.
- 진입 선택 ‘중계보기/결과보기’는 같은 경기 진행 command를 호출하고 엔진 seed·결과에 영향 0. presentationMode는 클라이언트 선호로만 저장.
- 하단 고정 바: [1타석 진행] [재생/정지] [배속 1·2·4배] [결과 스킵]. 되감기는 타석 단위. 결과 스킵은 클라이언트 커서만 마지막 프레임으로 이동하고 game/save revision 변경 0. 속도·다음 타석·되감기는 로컬 처리, 위치 저장은 타석 전환 debounce/종료 시.
- 재방문 FINAL: ‘처음부터 / 이어서’ 선택. 최종 스코어 공개 여부는 기기 선호(기본 숨김). 두 기기 커서 충돌(409)은 자동으로 큰 값을 택하지 않고 읽기 위치는 유지, 저장은 명시 선택.
- 진행 중 pending이면 서버 확정 타석까지 프레임과 ‘경기 처리 중’만 표시. 부분 로그는 FINAL이 아니다. 응답 유실은 원 commandId로 조회.
- 접근성: 자동 음성 OFF, aria-live는 사용자가 넘긴 현재 타석 요약만, 전체 로그는 스크롤 목록. reducedMotion이면 타석 결과 즉시 표시.
- 로그 손상(503 LOG_INTEGRITY_ERROR)은 요약 fallback과 안내, 새 경기 생성 없음. 핀 시 로그가 없으면 요약 핀만 가능하다고 명시.

## S45 연대기

- 목록: 기본은 최신순 카드 피드(핀 맨 위 고정), 상단에 시즌/리그/종류 필터와 ‘시즌별 책’ 전환. 시즌 책은 소속 scope별로 구분하고 국내/미국 합산 없음. 같은 경기 여러 성과는 대표 카드 1개+배지 목록.
- 카드: 공식 영역(제목·기록·근거, 불변)과 별도 ‘내 메모’ 박스(사용자 제목 60자/설명 300자, NFC·HTML 이스케이프)를 라벨로 구분. 메모는 공식 제목을 대체하지 않는다. 핀/숨김은 별개 bool, 숨긴 핀은 ‘숨김 포함’ 필터에서 조회.
- 상태: ‘장면 정리 중’(projection 지연), TEMPLATE_INPUT_MISSING은 표현만 보류(가짜 경기 생성 없음), CORRECTED 표식(기록 정정), PRESENTATION_PENDING(은퇴 직후). 상세 로그가 없으면 숫자·날짜는 표시하고 재생 링크만 비활성.
- 메모 편집 충돌(409)은 자동 병합 없이 최신 재조회 후 다시 편집.
- 내보내기: 카드 PNG(1080×1350)/JSON 선택 → 미리보기(메모 줄 수·레이아웃 확인) → 확인 → 상태 라인 QUEUED→RENDERING→UPLOADING→READY(24시간 보관, 5분 서명 URL). 422 TEXT_OVERFLOW는 메모 편집/레이아웃 변경, 409 VERSION_CHANGED는 현재 모습 재미리보기, 503은 같은 job 확인 또는 새 requestId. JSON은 ‘게임 세이브 복원 파일이 아님’ 안내.
- 선호 변경과 내보내기는 save revision/난수/보상 불변이고 외부 전송 endpoint 없음.

## 화면 상태

| ID | 상태 | 요점 |
|---|---|---|
|LV0|후보 카드|경기 전 1회, 놓치면 홈 배지|
|LV1|재생|하단 바 4컨트롤|
|LV2|처리 중(pending)|확정 타석까지만|
|LV3|재방문 FINAL|처음/이어서, 스코어 숨김 선호|
|LV4|로그 손상|요약 fallback|
|LV5|스킵 완료|마지막 프레임, revision 불변|
|CH0|로딩/실패|실패는 장면 0개로 취급 금지|
|CH1|피드/책 전환|핀 상단, 필터|
|CH2|카드 상세|공식 영역+내 메모 박스|
|CH3|메모 편집|CAS 충돌 시 재조회|
|CH4|내보내기 미리보기|레이아웃·줄 수 확인|
|CH5|내보내기 진행|상태 라인|
|CH6|내보내기 실패|TEXT_OVERFLOW/VERSION_CHANGED/EXPORT_FAILED|

## 검수 항목(초안)

LV-U01 후보 카드 같은 version 1회/02 설정 OFF 후보 읽기 생략/03 스킵 rng 0, revision 불변/04 속도 4배 동일 결과/05 스코어 숨김 선호 저장/06 partial은 FINAL 아님/07 로그 손상 fallback/CH-U01 메모가 공식 제목을 대체 안함/02 핀+숨김 필터/03 정정 CORRECTED/04 메모 CAS 409/05 내보내기 상태 라인/06 JSON 복원 파일 아님 안내/07 내보내기 메모 길이 초과 편집 유도. 실행검증은 구현 후.

## 남은 확인

문구·배치는 초안D이며106에서 원문·대표 시안·순수 로컬 조작·정적 검수에 연결했다. 실제 앱/API/DB/기기 검증은 미실행이다.

최신 연결 범위는 [106](106-EXPANSION-UI-CLOSURE.md),실행 전61항목의 원문/시안 진입점은state-ui-preview-coverage.json이다. NOT_EXECUTED를 유지한다.

---

<!-- SOURCE: 105-EXTERNAL-HANDOFF-INTEGRATION.md -->

# 105 — 외부 작업 인수·히든 특성/구종 편집 연결

2026-10-19. 사용자가 다른 환경에서 작업한 뒤 이어서 진행을 요청했다. GitHub main의6개 새 커밋을 fast-forward로 가져왔고,그 시점 Git 작업본과 V:\docs\design의199개 파일은 모두 SHA256가 같았다. 기존100~104와61개 상태 UI 기대값을 덮어쓰거나 초기화하지 않았다. 이 문서는 이번 연결 범위와 남은 실행을 구분한다.

## 사용자 확정과 현재 반영

| 분야 | 확인한 최신 계약 | 이번 반영 |
|---|---|---|
|100 히든 특성|기존12 공개+신규4 히든,이름/암시만,전체 자동 적용,cap 유지|47/56 최신 문서 연결,서버 전용 정의와 공개 DTO 분리,기존45화면 보드에 미해금 카드4개 추가|
|T14 후속 질문|같은 라이벌 투수 상대 시즌20PA·OPS .900 이상+관계 이벤트 승리|원기록 비교·같은 라이벌/시즌/대회 범위·승리 영수증을 명시|
|101 구종·성향|비례 슬라이더/최대잔여/pitchId 동률/최소10 재배분|48/57 연결,로컬 미리보기 함수와3구종 편집·읽기전용·성향4카드 시안|
|102 목표·도전|추천3+전체목록/정확 진척/MID사유/기념보상|원문·색인·기대값 보존,통합MD에 포함. 새 대표 시안은 다음 작업|
|103 관계·지도자|협상확률/라이벌 빈 상태/지도자 비용과 효과|원문·색인·기대값 보존,통합MD에 포함. 새 대표 시안은 다음 작업|
|104 중계·연대기|감상 제어·스포일러/공식기록과 내 메모/내보내기|원문·색인·기대값 보존,통합MD에 포함. 새 대표 시안은 다음 작업|

[비교 보드](art-direction-lab.html)는22대표 화면/18상세흐름×3=54상태다. 구종 슬라이더만 실제 로컬 초안 값을 조정하며 게임 세계·명령·변경 기회를 저장하지 않는다. 구성 확인 CTA는 배치 예시이며 서버 확정 기능은 없다. 원래45게임 화면/99이벤트/8PNG와298게임 fixture는 유지한다. 신규 히든4개는 다른 환경에서 승인된 게임 규칙 확장이므로 ‘단순 외형 변경뿐’이라고 해석하지 않는다.

## 히든 데이터 경계

[서버용 규칙](server-only/hidden-trait-rules.json)은 설계/개발 자료이며 런타임 공개 assets로 배포하면 안 된다. GitHub 설계 문서는 스포일러를 포함할 수 있다. 저장소에 문서가 있다는 것과 실제 클라이언트 API·번들·캐시에 판정 정의를 싣는 것은 구분한다.

[미해금 공개 예시](hidden-traits-locked-preview.json)는traitId/hidden/name/hint만 허용한다. 조건·효과·근접도·progress·predicateKey·evidenceRef는 없고,보드에도 해당4개 공개 필드만 넣는다. 실제 서버는 소유권과 해금 여부를 확인한 뒤 일반/미해금 히든/해금 히든을 다른 직렬화 경로로 응답한다. 브라우저에 전체 정의를 내려준 뒤CSS로 숨기지 않는다.

해금 후 상세는 해당 선수에게 공개된 서버 응답을 사용한다. 정적 비교 보드의 해금 상세 예시는 일반T02를 사용하고,T13~T16의 비공개 문턱을 클라이언트 정적 문자열에 포함하지 않는다. 따라서 해금 히든의 완전한 서버 상세 API를 이번 HTML에서 구현한 것은 아니다.

T14의 OPS는 반올림 표시값이 아닌 원기록으로 비교한다. AB>0·PA≥20·관계 승리 영수증이 모두 필요하고,같은 라이벌 투수/세계시즌/대회 정규 기록만 사용한다. H/AB/TB/BB/HBP의 정확 유리값에 대해OPS≥9/10을 판정한다. .89996을 화면에서.900으로 표시했다고 해금하지 않는다. 이벤트의 ‘승리 선택지’를 누른 사실이 아니라 확인된 WIN 결과가 근거다.

경기 종료/관계/시즌 정산의 확정 영수증 안에서 해당 해금 evidence를 한 번만 반영한다. 이미 끝난 경기 결과를 다시 계산하지 않으며 다음 실제 타석 snapshot부터 효과를 적용한다. T13/T15의 희귀 경기 증거와T16의 연속 정규시즌 자격 증거는 엔진·기록 원장에서 공급해야 하며 실제 판정 연동은 아직 미구현이다.

## 비율 자동 보정

[ui-preview-helpers.js](ui-preview-helpers.js)는 두 보드가 사용할 수 있는 **설계 시안용** 순수 함수다. 이번에는 상세 비교 보드의3구종 편집에 연결했다. 기존45화면의2구종 편집은 기존 동작을 유지한다.

1. 입력은 활성2~4종/각 정수10~90/합100/고유pitchId.
2. 사용자가 옮긴A를10~100−10×나머지수로 제한한다.
3. 남은 총량을 나머지의 기존 비율대로 배분한다.
4. 10 미만이 될 구종을10으로 고정하고 나머지에 재배분한다.
5. 정수 바닥값의 남는 단위를 최대잔여,동률pitchId 오름차순으로 배분한다.

입력 배열을 변경하지 않고 같은 값은 같은 결과다. 예60/30/10에서첫비율80→80/10/10,60/20/20에서첫65→65/18/17. 입력 정렬을 바꿔도ID별 결과는 같다. UI 이동 중에는 같은 슬라이더 노드를 유지해 포커스를 보존하도록 작성했지만 실제 브라우저 포커스 검수는 미실행이다.

비율은 확률 정책의 운영 계획이며 숙련XP·연간 성장 예산과 별도다. 숙련은 ★와다음등급 남은XP/해당구간 진척을 구분한다. 소진 상태는 편집·확정 컨트롤 없이 현재 확정 구성과 다음 변경 창을 보여준다. 미확정 초안 비율을 소진 상태의 실제 구성처럼 표시하지 않는다.

## 검수와 저장

[verify-state-ui.mjs](verify-state-ui.mjs)를 기존 정적 검증에 연결했다. 공개DTO 허용필드/서버 파일의HTML 참조 없음/승인T14 경계/기존cap,슬라이더2~4종의121개 입력값·ID순서 독립·하한·합계·입력불변을 검사한다. 61개 상태 UI 기대값은 NOT_EXECUTED,기존298도 NOT_IMPLEMENTED를 유지한다. 실제 서버 직렬화 보안·해금 transaction·UI input 이벤트·브라우저/기기·DB·게임 결과는 시험하지 않았다.

최신 작업 결과는 계속V:\docs\design에 동기화한다. 이번에는 이전MANIFEST가 미갱신 상태였으므로 작업 시작 시199개 실제 파일 해시를 별도 기준으로 보존했고,동기화 직전에 그 기준과 다시 비교해 다른 수정이 끼어들지 않았는지 확인한다. MANIFEST와DESIGN-ALL은100~105를 포함해 다시 생성한다. Git 기록은 기존6커밋을 보존한 채 새 커밋을 추가한다. 홈 이어하기는 버튼만 표시하는 R50을 유지한다.


후속: 이 문서에서 다음 작업으로 남긴102~104 대표 UI는106에서 연결했다. 105는인수 시점 이력,현재 현황은STATUS/106을 따른다.

---

<!-- SOURCE: 106-EXPANSION-UI-CLOSURE.md -->

# 106 — 100~104 상세 UI 연결·검수 인계

2026-10-19 / 시각 확장1.7 / DESIGN_PREVIEW_ONLY. 사용자가 남은 연결을 모두 진행하도록 요청했다. 이 문서는102 목표,103 협상/관계/지도자,104 중계/연대기의 기존 확정 계약을 대표 시안과 검수 자료에 연결한다.100/101은105에서 연결한 내용을 유지한다. 새 앱·DB·APK·서비스 구현을 시작한 문서가 아니다.

## 연결 결과

[비교 보드](art-direction-lab.html)에8개 배치를 추가해30대표 배치/26흐름×3상태=78시안이다. 도전과제는S40의 하위 배치,내보내기는S45의 하위 배치여서 사용한 게임 화면ID는28개다. 원래45화면/99이벤트 카탈로그와 기본45화면 목업은 그대로다. 모든45화면의 최종 픽셀 렌더가 완성됐다는 뜻은 아니다.

| 대표 배치 | 세 상태·조작 |
|---|---|
|시즌 목표 S40|PRE 추천3+전체 적격 목록/최대3개 로컬 선택, MID 정확 진척·불가 사유, 보유 프레임·선수 카드 미리보기|
|도전과제 S40|12개 공개 조건,실제 출전 근거의 자동 해금,정정 이력과 기념 외형 유지|
|에이전트 S41|상향10/20/30의 금액·정확 p,상향 오퍼 생성 성공,기본 오퍼 유지 실패|
|라이벌·동료 S42|상대 카드,동일kind 시즌 비교,실제 투타 직접대결·범위 구분|
|지도자 S43|내 원본/가상 탭과 현역 claim 차단,보장액·해임 채무,담당 이동 전후 효과|
|감상 중계 S44|후보·재방문 처음/이어서,고정 로그 재생·속도·되감기·스킵·점수 숨김,로그 불가 요약|
|연대기 S45|핀 피드·시즌/리그 책·필터,공식 카드와 안전한 메모 초안,기록 정정·장면 표현 보류|
|내보내기 S45|PNG/JSON·메모 미리보기,대기/제작/준비/완료 라인,넘침·버전변경·작업 결과 재확인|

보드의 상태 선택은 독립 사례를 비교하며3단계를 누르면 서버 게임이 순서대로 실행되는 것이 아니다. 모든 세계 확정 CTA는 배치 예시다. 현재 동작하는 것은목표 체크·외형 미리보기·탭·필터·메모 미리보기·고정 중계 조작 등 로컬 시연뿐이다.

## 목표·도전·기념 보상

PRE 추천은 자동 선택이나 성공확률이 아니다. 타자/KBO 계속 등록 예시에 적격5목표와 추천G01/G02/G04를 표시한다. 신규 선수의 적격 목록은 서버가 실제 scope/명단 이력을 검사해 따로 제공한다.0개로도 계속할 수 있고 최대3개이며,체크 변경만으로 시즌 목표를 확정하지 않는다.

MID 예시는BB22/30을 새 목표의 현재 진척으로 이어받는다. 이미33/30인 다른 사례는 회색+사유로 선택을 막는다. 완료 슬롯은 교체 불가,보상 후 슬롯 재사용도 없다. 실제 교체는 해당 세계시즌/리그의 사용량과 최신 상태를 재검사한다.

A01~A12의 조건은 미달성도 공개한다. 계약/등록과 실제 출장,학적 졸업·병역 완료·리그별 통산·실제 라이벌 재회를 구별한다. 보상은 자동 해금,수령 버튼 없음,중복 보유 재화0이다. 정정 이후에도 이미 해금한 기념 외형은 유지한다. 외형 선택은 프로필 선호로 별도 CAS 저장하며능력·잠재력·자금·강화·구종XP 효과0이다. 시안에서는 카드 테두리만 로컬로 바뀌며 서버 선호를 저장하지 않는다.

## 협상·관계의 근거

국내 담당/신뢰60/보너스.08의 예시에서 연봉1억원에10/20/30% 상향 요청은1.1억/1.2억/1.3억원,p=.70/.55/.40. p는59의 현재 오퍼/예산 검사 후 값이며다른 신뢰·담당·조건이면 새로 계산한다. 성공은상향 오퍼 생성이고 계약은 별도 수락,실패는기본 오퍼 유지·요청 기회 소진이다. 지급 수수료2%는누적 원장으로 계산하며미지급 급여·계약금·정지기간에 임의 청구하지 않는다.

같은kind 관계는 각자 시즌 비교,실제 타자-투수 쌍은DIRECT로 구분한다. 예시PA26/AB24/H6/BB2/TB10은AVG.250/OPS.724다. 리그·정규/PS·국제·세계시즌을 섞지 않는다. 빈 상태는103의5사유를 별도 데이터로 유지하며조회 실패를 ‘기록 없음’으로 바꾸지 않는다.

### 숙적 킬러의 관계 연결 D

T14의 사용자 확정은 ‘라이벌 투수 상대20PA·OPS.900·관계 이벤트 승리’다. 고교 기본 라이벌 생성의same-kind 규칙은 유지하고,프로의 실제 타자-투수 대결 기록을 근거로관계 형성 사건E94가 확정되면cross-kind RIVAL도 표현할 수 있도록 연결한다. 기존 고교 라이벌을 지우거나 모든 상대 투수를 자동 라이벌로 만들지 않는다. 실제 선수 쌍·공식 경기 근거·중복pair 제약을 사용하고 유령 상대나 승격을 강제 생성하지 않는다.

이는T14를 도달 불가능하게 만들지 않기 위한 기술D 연결이며새로운 무작위 형성 확률을 정하지 않는다. E94의99개 이벤트 내ID·creationReceipt 근거는 유지하고,발생 조건과 공통 문안을 고교/실제 프로 대결 관계 모두에 맞게 연결했다. 관계 형성 자체와 ‘관계 이벤트 승리’는 다르다. 승리 조건은 해당 쌍의확정된 WIN 영수증이고문구 선택/팀 승리 추정으로 대신하지 않는다. 같은 시즌의 실제 대결 원기록은 관계 형성 전 기록도 보존하며,해금이 되더라도과거 경기 결과는 바꾸지 않는다. 사건 판정·서버 저장의 실제 구현은 미착수다.

## 지도자의 비용과 효과

코치 연봉1억5천만원/재정200일/잔여100일이면보장7500만원. 새 고용 직후지급0이면즉시 해임해도미지급 보장7500만원이 남는다. 별도 현재 계약 예시는지급1500만원/미지급6000만원이다. 두 상태를 같은 시점의 값처럼 섞지 않는다.

해임 시활성 예약→보장 채무로 분류만 바꾸며가용액을 늘리거나 이중 차감하지 않는다. 운영비 집계에서reservedOperations는 활성 예약과미지급 보장채무를 포함하는 총 구속액이고staff의세부 분류와 별도다.44의식에 같은 금액을 또 더 빼지 않는다.

등급3코치의+.05를타자에서 투수로 옮기는 예시: 타자는min(1.2,1.18+.05)=1.20→1.18,투수는1.04→1.09. 다음 세계일부터·당일1회·경기 처리 중 확정 불가다. 과거 담당 기간의 효과를 재계산하거나 양쪽에 같은 날 중복 적용하지 않는다. 스카우트 등급2 이상은시설 보정+1/상한5,월 탐색2회는 그대로다.

## 중계와 연대기의 로컬 동작

중계 예시는 이미 확정된 동일 경기의9회초 연속5타석 로그다. 안타→2점홈런→삼진→땅볼→삼진이며최종 홈4:원정3. 재생/1·2·4배/1타석/되감기/스킵/처음부터는읽기 커서만 바꾸고로그를 수정하거나 경기 난수를 소비하지 않는다. 자동 재생 타이머는순수 커서 함수 위에만 있고화면 전환 때 중지한다. 실제 경기 엔진의 타이밍·진행 명령이 아니다.

점수 숨김은 기본켜짐이며마지막까지 점수를 감출 수 있다. 수동으로 넘긴현재 장면만aria-live polite,자동 재생은off로 작성했다. DOM 노드 갱신·키보드·음성/포커스의실제 동작은 아직 시험하지 않았다. 부분 진행 로그는FINAL이 아니며이번 고정FINAL시안과 구별한다. 전략 입력이나 주루 지시를 추가하지 않는다.

연대기는연도/리그 필터와핀 피드/시즌·scope별 책으로 전환한다. 공식 제목·날짜·원기록은읽기전용이고‘내 메모’만NFC 초안/미리보기로 바꾼다. HTML문자열은escape하고미리보기 출력은textContent를 사용한다. 실제 저장은예상 선호revision으로CAS,충돌 시최신/내 초안을 자동 병합하지 않는 원문 계약을 따른다.

내보내기는실제PNG/JSON파일을 이번에 만들지 않는다. PNG1080×1350,파일24시간/서명링크5분은63의 계약이다. JSON은세이브 복원 파일이 아니다. 연결 실패가 곧 서버 작업 실패라는 뜻은 아니므로동일 작업을 조회한 뒤확정 실패일 때만 새 요청을 명시적으로 만든다. 정상 게임 재진입은여전히이어하기 버튼만 사용한다. 전용 내보내기 화면의상태 라인은104의 확정 요구대로 제공한다.

## 검수 인계

[확장 예시 데이터](expansion-preview-data.json)와[61항목 연결 지도](state-ui-preview-coverage.json)를 추가했다. 지도는원문·대표 시안의 진입점으로,61개 E2E 통과 증거가 아니다. 각 행의실행 상태는NOT_EXECUTED,기존298게임 fixture도NOT_IMPLEMENTED를 유지한다.

정적 검사는78개 순수 템플릿/12도전 조건/협상확률·금액/지도자 보장·효과/직접전적/책 필터/메모 escape/내보내기 표시를 확인한다. 순수 중계 함수의커서 경계·배속·정지·입력 불변과 고정 로그 보존도 확인한다. 실제 UI 클릭·타이머·접근성/DB·보상 원자성·파일 생성·권한/API·기기·build/APK 시험은 미실행이다. 자동브라우저file:차단을 우회하지 않는다.

기존45화면 보드와새30배치 비교 보드를 함께 읽는다.100~104의남은 대표 UI 연결은이 문서로 정리됐고,앞으로는이동/렌더/실행 게이트를 실제 앱에서 증명해야 한다. 추가 기능을 계속 늘렸다는 의미나어떤 설계도더 검토할 수 없다는 선언은 아니다. 구현 착수는별도 사용자 지시를 따른다. V:\docs\design을최신 작업 파일 위치로 유지하고Git 커밋·push와통합MD/MANIFEST를 함께 갱신한다.

---

<!-- SOURCE: 107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md -->

# 107. 라이벌 사건·히든 특성의 경계 판정

2026-10-19 / 상세설계 추가 / DESIGN_RULES_NOT_IMPLEMENTED.

사용자가 요청한 남은 설계의 첫 묶음이다. [100](100-HIDDEN-TRAITS.md)의 U(사용자 확정)인 특성 이름·효과·해금 문턱과 [51](51-RIVALS-TEAMMATES.md)/[60](60-RELATIONS-DETAILED-CONTRACT.md)의 실제 선수 관계를 연결한다. 아래의 발생 빈도·세부 판정은 D(구현 가능한 기본안)이며 사용자가 개별 확정한 것으로 표기하지 않는다. 실제 야구 단체의 현행 규정 재현이 아니라 이 게임의 규칙이다.

## 1. 적용 범위와 우선순위

- T13 끝내기 안타 3회, T14 같은 라이벌 투수 상대 정규 한 시즌 PA≥20·OPS≥.900 및 관계 이벤트 승리, T15 완봉 3회, T16 연속 5시즌 선발 규정이닝은 유지한다.
- 100의 확정 효과와 특성 합산 cap ±.06/구종·성향 포함 ±.10은 변경하지 않는다. 장착 선택·특성 보상 재화·치트 자동 해금은 없다.
- 이 문서는 프로 cross-kind 관계의 발생/관계 WIN, T13~T16의 경계만 구체화한다. 기존 고교 same-kind 라이벌/동료와 재회 상태 전이는 그대로다.
- 모든 문턱은 최종 승인된 공식 원기록으로 판정한다. 확률 추첨이 없는 기록 판정에 성공확률·100% 배지를 붙이지 않는다. 경기 자체의 결과 확률은 경기 엔진을 따른다.

## 2. 프로 직접대결 라이벌의 형성 D

| 항목 | 조건 |
|---|---|
| 선수 | 같은 세이브의 실제 타자와 실제 투수, 서로 다른 ID, 형성 시점 둘 다 현역 |
| 공식 범위 | FUTURES/KBO/ROOKIE/A/AA/AAA/MLB의 REGULAR. HS/COLLEGE/INDEPENDENT/국제/PS는 이 추가 형성 루틴에서 제외 |
| 누적 근거 | 동일 worldSeasonId+competitionId에서 실제 직접대결 PA≥12, 서로 다른 FINAL 경기≥3 |
| 후보 제외 | 이미 같은 pair의 RIVAL이 있거나 현재 같은 팀, 삭제·무효 경기만으로 문턱 달성, 다른 세이브·보관 원본 ID |
| 정렬 | PA 내림차순 → 직접대결 경기 수 내림차순 → 상대 playerId 오름차순. 능력·사용자 선호·숨은 주사위로 바꾸지 않음 |
| 빈도 | primaryPlayerId당 한 worldSeasonId에 신규 프로 직접대결 관계 최대 1개. 고교 기존 관계는 이 슬롯을 소비하지 않음 |
| 시점 | 경기 FINAL 집계 후 후보 검사. 한 경기의 후보를 함께 모아 정렬하고 하나만 선택. 후보 0이면 정상 진행 |
| 저장 | normalPairKey+RIVAL 유일 관계와 FORMATION receipt/E94를 같은 transaction에 기록 |

AI도 같은 후보 조건을 쓴다. 전체 세계에서 후보를 정규화한 pair 순으로 처리하며, 양쪽 중 하나라도 해당 연도 형성 슬롯을 이미 사용했으면 건너뛴다. 하나의 pair를 새로 형성하면 양쪽 슬롯을 소비한다. 같은 pair를 다시 만나도 연도마다 E94를 재생성하지 않는다. 조건은 누적 기록에 기반하므로 접속 시간·화면 열람 순서로 상대가 바뀌지 않는다.

E94가 FINAL 경기 직후 생성돼도 그 경기는 ‘관계 형성의 근거’다. 그 경기를 관계 WIN으로 다시 쓰지 않는다. 신규 관계의 첫 도전은 **형성 이후 다음 실제 직접대결 경기**부터다. T14의 시즌 통계에는 형성 전 같은 상대의 공식 기록도 포함한다.

## 3. 관계 도전의 WIN/LOSS/NO_DECISION D

관계 형성이나 대사 선택을 승리로 처리하지 않는다. cross-kind RIVAL이 이미 존재하는 경기에서 타자가 해당 투수를 직접 상대한 **그 경기 기록**으로 판정한다.

| 결과 | 정확 조건 | 문구 기본안 |
|---|---|---|
| WIN | 해당 경기 직접대결 PA≥3 AND H≥1 AND TB≥2 | “오늘의 맞대결은 내 쪽이었다.” |
| LOSS | 해당 경기 직접대결 PA≥3 AND H=0 | “이번 맞대결에서는 안타를 만들지 못했다.” |
| NO_DECISION | 위 어느 쪽도 아님. 조기 교체·볼넷 위주·1안타만 등의 경우 | “다음 맞대결을 기다립니다.” |

TB≥2는 2루타 이상 1개 또는 단타 2개 등 실제 타격 성과다. 팀 승패·투수 승패와 독립이며 타격 외 별도 결투 RNG는 없다. WIN/LOSS는 타자 관점으로 저장한다. 투수는 상대 타자의 LOSS를 자신의 서사적 승리로 볼 수 있지만 T14용 batter-WIN으로 전환하지 않는다.

`DIRECT_DUEL_RESOLVED`는 기존 관계의 하위 milestone 유형이다. E01~E99의 신규 최상위 사건 ID를 만들지 않는다. E95는 종전대로 분리 후 첫 실제 재회 알림이며 이 milestone과 구별한다. 매 경기 팝업을 추가하지 않고 S42 연표에서 결과를 확인한다. 같은 pair/동일 scope의 해당 시즌 첫 WIN만 연대기 자동 후보로 제안하고 이후 기록도 실제 전적에 보존한다.

`evidenceKey=(relationshipId,gameId,DIRECT_DUEL_RESOLVED)` UNIQUE. 필드는 batterId/pitcherId/worldSeasonId/competitionId/phase/gameReceiptId/statRevision/PA/H/TB/outcome이다. 다른 시즌·PS·국제 WIN을 정규 T14 근거로 대체하지 않는다. 열람/읽음/핀/대사 선택은 이 행을 만들거나 바꾸지 않는다.

## 4. T14 시즌 OPS·승리 결합

- 대상은 동일 RIVAL 투수 한 명, worldSeasonId+competitionId+REGULAR 한 묶음이다. 선수 이적 전후 같은 대회 기록은 합치고 KBO+MLB, A+AA, 정규+PS는 합치지 않는다.
- v1 엔진은 희생타를 생성하지 않으므로 `PA=AB+BB+HBP`, `OBP=(H+BB+HBP)/(AB+BB+HBP)`, `SLG=TB/AB`. AB=0이면 해금 불가. 표시 OPS 반올림 전 분수로 .900을 비교한다.
- PA와율의 분모는 별도 필드로 보존한다. 이후 희생플라이 등을 지원할 때 OBP에 SF를 포함하는 새 통계 정의 버전으로 이행하며, 현재 없는 SF를 가짜 경기 기록으로 추가하지 않는다.
- WIN 근거는 동일 시즌·대회·정규의 관계 형성 이후 확정된 직접대결 승리 1회 이상이다. 그 경기와 PA20 도달 경기가 같을 필요는 없다.
- 최소 20PA/.900에 먼저 도달했어도 WIN이 없으면 미해금. WIN을 나중에 얻으면 그 경기 FINAL 후 모든 조건을 재평가한다. 반대 순서도 같다. 도감 조회는 판정을 새로 실행하지 않는다.
- 같은 시즌 두 라이벌이 각각 충족할 수 있다. T14는 1개만 보유하되 `qualifiedRivalPitcherIds`는 충족한 투수 ID의 집합으로 저장한다. 첫 획득 뒤에도 새로운 쌍의 조건 충족을 검사해 근거를 추가하고 다음 경기부터 해당 상대에도 효과를 적용한다. 다른 라이벌·팀의 모든 투수에게 효과를 확대하지 않는다.
- 최초 해금 receipt의 이름·효과·근거는 100을 따른다. 해금 이후 새 대상 추가는 특성 획득 연출을 다시 띄우지 않고 도감 근거 목록만 갱신한다. 상대 은퇴 후에도 과거 근거를 보존한다.

## 5. T13 끝내기 안타 경계

공식 FINAL 경기의 마지막 득점 플레이가 합법적인 홈팀 끝내기이며 결과가 1B/2B/3B/HR로 공식 기록된 타자에게 1회다. 끝내기 홈런·주자가 득점한 안타는 포함, 볼넷/몸에 맞는 공/단순 주루·폭투만의 끝내기는 제외한다. 한 플레이에 여러 점·여러 주자가 들어와도 1회다.

연장·자동주자·공식 단축 경기라도 위 안타 조건이면 누적 근거다. 취소/몰수/가상 결과에는 안타 근거를 새로 만들지 않는다. 활성 효과는 사용자 확정대로 inning≥9의 BOTTOM·동점 또는 1점 차 뒤짐에만 적용한다. 따라서 단축 경기에서 해금 근거를 얻을 수 있어도 7회 효과가 켜지지는 않는다. 끝내기가 확정된 타석 자체에는 새로 얻은 특성을 소급 적용하지 않는다.

## 6. T15 완봉 경계 D

완봉 근거는 **FINAL·자기 팀 승리·상대 팀 R=0·본인 선발·본인만 투구·계획된 정규 이닝 이상 수비 완료**를 모두 충족한 공식 경기다. 기본 9이닝 경기면 본인 outs≥27, 7이닝으로 사전 편성된 공식 경기면 outs≥21이다. 상대 팀 타석이 없었던 홈 9회말을 별도 투구 이닝으로 요구하지 않는다.

| 예외 | 처리 |
|---|---|
| 9회 또는 연장 10회까지 혼자 던져 무실점 승리 | 1회. 연장이라도 단일 경기 1회 |
| 0:0 공식 무승부 | 완투는 따로 기록할 수 있으나 T15 완봉 근거 0 |
| 우천으로 예정 9회가 5회 FINAL | 게임 승리는 유지, T15 근거 0. 사전 편성 7회와 구별 |
| 중단 후 재개 | 같은 gameId의 최종 결과만 1회. 중간 스냅샷은 0 |
| 구원투수가 한 타자라도 상대함 | 팀 무실점이라도 개인 완봉 근거 0 |
| 자동주자 득점으로 R=1/ER=0 | 근거 0. 자책점 0을 무실점으로 대신하지 않음 |
| 몰수·취소·노게임 | 새 완봉 근거 0. 가상 투구 아웃을 생성하지 않음 |

활성화는 기존대로 본인 선발·inning≥7·본인 R=0의 타석 시작 snapshot이다. 선발의 승리투수 자격이나 ERA를 추가 문턱으로 붙이지 않는다. 이미 보유한 특성의 활성과 새로운 완봉 해금 누적은 다른 판정이다.

## 7. T16 연속 5시즌의 경계 D

시즌은 선수의 ‘등판한 다섯 시즌’이 아니라 연속된 worldSeasonIndex 5개다. 각 연도에 OFFICIAL REGULAR의 한 competitionId에서 선발로 던진 outs 합계가 `3×G` 이상이어야 한다. G는 해당 대회의 **정규 마감 시 팀별 최종 공식 경기 수의 최댓값**이며 무승부 포함/취소 미편성 제외/PS 제외다. 선수의 중도 입단·부상·입대 때문에 G를 줄이지 않는다. 팀 경기 수가 동일하면 01의 팀경기×1.0과 같다. 연도별 G와 계산 근거를 시즌 정산에 고정한다.

- 선발 등판에서 얻은 아웃만 numerator다. 선발·구원 합산으로 규정이닝을 넘겨도 선발 outs 미달이면 실패. `144경기→432outs`, `162경기→486outs`이다. 야구식 143.2이닝은 431outs로 저장하고 143.2라는 소수로 곱하지 않는다.
- 한 연도에 서로 다른 대회 두 곳을 합치지 않는다. KBO 80이닝+MLB 90이닝은 각자 문턱 미달이면 실패. 같은 대회 내 이적은 합산한다.
- 연도 간 대회 변경은 허용한다. KBO에서 독립 충족한 2년+MLB에서 독립 충족한 3년이 연속이면 5년이다. 같은 연도 두 대회에서 각각 충족해도 연속 시즌 수는 1 증가한다. 근거 대표는 선발 outs/G가 큰 대회→competitionId순이고 나머지 충족 근거도 보존한다.
- 시즌 정규 마감 전에는 잠정 충족으로 저장하고 해금하지 않는다. 시즌 정산 완료 시 한 번 연속값을 갱신한다. 포스트시즌 추가 이닝으로 미달을 채우지 않는다.
- 부상/미계약/복무/출장 0의 연도에도 카운터를 건너뛰지 않는다. 해당 연도에 다른 적격 공식 대회에서 독립 충족하지 못했다면 0으로 리셋한다. 복무팀 경기가 실제 OFFICIAL이면 기존 범위대로 평가하되 병역 기간만으로 경기 기록을 지급하지 않는다.
- 세계 전체가 공식 정규경기 0인 연도는 적격 시즌이 없어 연속값 0. 개발 오류나 정산 지연은 0시즌으로 위장하지 않고 기존 연도 전환 오류로 처리한다.
- 다섯 번째 시즌 정산 receipt에서 해금한다. 다음 실제 선발 경기부터 효과를 적용하며 종료된 시즌을 재계산하지 않는다. 해금 후 부상·보직 변경·연속값 초기화로 특성을 박탈하지 않는다.

## 8. 멱등·정정·저장·이어하기

경기 종료 transaction 순서: 경기 FINAL → 통계 contribution 확정 → 이미 형성된 pair의 결투 결과 → 신규 관계 형성 → T13/T14/T15 및 T14 대상 추가 평가 → 관련 receipt/outbox. 신규 관계는 같은 경기에서 결투를 만들지 않는다. 시즌 마감은 최종 경기 contribution 반영 완료 후 T16을 평가한다. pending 최종 경기가 있으면 시즌 정산을 완료하지 않는다.

해금 전 기록 정정은 contribution과 결투 근거를 같은 revision으로 다시 계산해 미달을 그대로 반영한다. 해금 후 정정은 [56](56-TRAITS-DETAILED-CONTRACT.md)의 정책을 구체화해 **보유 특성과 이미 확보한 T14 대상은 유지**하고 근거에 CORRECTED·변경 전후·정정 receipt를 남긴다. 과거 경기 RNG/결과를 다시 만들지 않는다. 정정으로 신규 조건을 충족하면 정정 receipt에서 해금하고 다음 타석부터 적용한다. T16의 아직 미해금 카운터는 영향을 받는 연도부터 완료된 연도를 순서대로 재평가한다.

거절된 외부 입력/클라이언트 위변조는 공식 기록 정정으로 취급하지 않는다. 관리자가 원본 세이브를 복원하는 기능은 별도 70의 세계/receipt 정체성을 따른다. 어린 복사본은 특성·대상 집합·결투·연속값 모두 초기화하고 원본 archive는 바꾸지 않는다.

명령 응답이 끊겨도 같은 receipt를 재조회하므로 관계/승리/해금 중복 0. UI 진입은 계속 ‘이어하기’ 버튼이며 중단 사유·복구 단계를 홈에 새로 표시하지 않는다. 미해금 DTO에는 이 문서의 문턱·진척·근거를 내보내지 않는다. 서버용 설계 자료는 공개 시안에 포함하지 않는다.

## 9. 화면 문안과 장면 연출 인계

| 위치 | 표시 |
|---|---|
| E94 형성 | 두 선수 초상/해당 경기 구장 배경, “자꾸 마주치는 이름”, 상대·공식 경기 날짜, ‘관계 보기’/‘계속’. 수치 능력 보상 없음 |
| S42 연표 | 형성/재회/결투 결과를 다른 유형으로 표시. WIN은 ‘맞대결 우세’, LOSS는 ‘맞대결 열세’, NO_DECISION은 ‘다음 대결’. 세부에서 PA/H/TB·경기 링크 |
| S38 미해금 | 이름·암시만. “12PA 남음”·승리 여부·연속 연도 같은 숨은 진행 정보 없음 |
| S38 해금 | 기존 1회 해금 카드, 효과/정확 조건/근거 공개. T14는 충족한 상대별 근거 목록, 정정 표식 |
| 연대기 | 같은 시즌·쌍의 첫 WIN 후보 1개. 핀은 선호, 능력 효과 없음 |

선택 문구는 경기 이후의 감상이며 성공 여부를 바꾸는 선택지가 아니다. 자동 진행의 정지 여부는 기존 필수 결정/중요 사건 설정을 따르고, 관계 카드 열람을 의무로 만들지 않는다. 사진/그림 배치는 후속 화면 마감에서 기존 빈티지 연감 그림체로 제작한다. 이 문서는 완성 이미지나 실제 렌더 검수의 증거가 아니다.

## 10. 서면 기대값·인계

[서버용 경계 사례](server-only/rival-trait-edge-expectations.json)에 형성/결투/OPS/완봉/연속/정정/복사 사례를 수록한다. 기존 298개 게임 fixture나 61개 UI 기대값을 실행 완료로 바꾸지 않는다. 새 사례도 전부 NOT_IMPLEMENTED다. 정적 검사는 문턱·예시 산술·참조·상태만 확인하며 실제 엔진·트랜잭션·화면 검증이 아니다.

다음 설계 묶음은 45개 화면의 최종 상태별 구성과 이미지 제작 명세다. 30대표 배치/78상태 시안을 45개 완성 화면으로 과장하지 않는다. 실제 앱 구현은 별도 착수 지시 전까지 시작하지 않는다.

---

<!-- SOURCE: 108-ALL-SCREEN-FINALIZATION.md -->

# 108. 45개 화면의 최종 디자인 마감 명세

2026-10-19 / DESIGN_SPECIFICATION_ONLY. [83](83-VISUAL-ASSETS-ACCESSIBILITY-HANDOFF.md)의 반응형·접근성, [94](94-SCREEN-IMAGE-STORYBOARD.md)의 그림 슬롯, [80](80-SCREEN-STATES-NAVIGATION-RECOVERY.md)의 상태 계약에 **화면별 읽기 순서·주행동·마감 조건**을 연결한다. 아래 명세 작성은 최종 화면 제작/사용자 승인/실제 브라우저 검수 완료와 다르다. 신규 기능이나 46번째 화면을 추가하지 않는다.

## 마감 현황의 기준

45개 모두 기본 목업·상태·이미지 슬롯이 있다. 현재 art-direction-catalog.json이 명시한 대표 화면은28개다. 별도 대표 화면으로 명시되지 않은 **17개**는 S01 홈, S04 고교결산, S10 보관목록, S11 보관상세, S15 라인업, S18 리그, S20 저장, S21 설정, S22 스타일, S25 국제대회, S26 병역, S27 복무복귀, S29 미국제안, S31 포스팅, S32 해외협상, S33 국내복귀, S34 대학 선택. 흐름 카탈로그는 S26 등 인접 화면도 참조하므로 그 참조만으로 해당 화면 전용 디자인을 만들었다고 세지 않는다. 이 화면들이 설계 자체가 없다는 뜻은 아니다. 109에서 이17개 화면의 정적 대표 예시를 보강했다. 현재 그림체는 청춘 애니이며 최종 픽셀 검수는 별도다.

[화면별 기계 판독 명세](screen-finish-register.json)는 45개 행에 읽기 순서·주행동·기존 이미지 슬롯·대표 배치·8종 마감 상태를 담는다. finalPixelStatus=NOT_FINALIZED, browserReview=NOT_EXECUTED를 실제 증거 없이 바꾸지 않는다. 화면별 8상태가 모두 별도 페이지라는 뜻은 아니며 불필요한 제출 상태는 읽기전용으로 명시해 검수한다.

## 전 화면 읽기 순서와 개별 마감 조건

주행동은 현 상태에서 유효한 1개를 가장 강조한다. 슬래시로 적힌 것은 상태별 대안이며 같은 화면에 모두 주요 CTA로 띄우라는 뜻이 아니다. 실제 확정 명령은77의 화면 바인딩을 따른다.

| 화면 | 배치 | 위에서 아래 읽기 순서 | 주행동 | 개별 마감 조건 |
|---|---|---|---|---|
| S01 홈 | DASHBOARD | 앱 제목 → 최근 게임 이름·모드 → 이어하기 → 새 게임 | 이어하기 | 최근 저장 없음은 새 게임 두 경로만; 중단 상태·복구 안내 카드는 없음 |
| S02 생성 | FORM | 이름·던지는 손·타석·(투수)투구폼 → 거포형 등 유형 → 실루엣 카드 → 6능력·종합 → 집중4 요약 | 커리어 시작 | 집중3/5개·좌투 불가 포지션·빈 이름은 해당 필드 옆 오류 |
| S03 커리어 | DASHBOARD | 나이·소속·역할·종합 → 6능력 → 일정 → 현재 계획 → 다음 진행 | 다음 이야기 | 벤치·부상·미계약은 실제 현재 할 일; 경기가 없는 기간을 실패처럼 꾸미지 않음 |
| S04 고교결산 | RECORD | 고교 최종 성적 → 성장 전후 → 평가 → 가능한 졸업 진로 | 진로 선택 | 출장0·미지명 전망도 결산; 미국 카드 숨김은 능력과 실제 오퍼 조건에 따름 |
| S05 드래프트 | DECISION | 지명 전 예상 라운드·지명확률 → 발표 결과 → 실제 제안 → 다음 진로 | 해당 계약 확인 | 지명 전 전망과 확정 라운드 분리; 미지명에 수락 버튼 없음 |
| S06 사건 | DECISION | 사건 날짜·맥락 → 장면 → 본문 → 선택별 확률·효과·비용 → 확인 | 선택 확인 | 확률1 숫자 배지 숨김; 기한 소진·선행 선택 변경은 최신 사건 재조회 |
| S07 결산 | RECORD | 시즌·리그 → 개인 성적 → 팀 결과 → 6능력 변화 → 기념 기록 | 다음 시즌 준비 | PS·국제와 정규 분리; 성장0·우승 아님도 정상 회고 |
| S08 계약 | DECISION | 실제 오퍼 목록 → 금액·기간·역할·마감 → 비교 → 수락 확인 | 선택한 제안 수락 | 유효 오퍼0·마감 경과는 합법적 다음 진로 제공; 서명 장면은 수락 이후 |
| S09 은퇴 | PLAYER | 은퇴 당시 실루엣 카드·나이 → 사유 → 리그별 기록 → 원본 보관 완료 | 보관 선수 보기 | 보관 확정 전 중복 은퇴 금지; 새 구단 자동 생성하지 않음 |
| S10 보관목록 | RECORD | 보관 검색·정렬 → 원본 카드의 이름·은퇴나이·역할·종합 | 선수 상세 보기 | 보관0명도 정상; 회색 빈 카드가 영입/삭제처럼 동작하지 않음 |
| S11 보관상세 | PLAYER | 원본 나이·소속 → 커리어 최고6능력 → 기록 → 19세 복사 설명 | 새 구단에서 사용 | 원본과 복사 예상 수치를 나란히 구별; 원본 기록 수정 없음 |
| S12 구단생성 | FORM | 팀 선택 → 보관 사용 OFF/ON → 선택 원본·대체 슬롯 → 새 로스터 요약 | 구단 시작 | OFF가 유효 기본 경로; 사용 중 원본 claim·초과 명단은 해당 슬롯 오류 |
| S13 구단홈 | DASHBOARD | 팀·날짜 → 순위·다음 경기 → 가용 예산 → 할 일 → 진행 | 1경기 진행 | 부상·필수 선택·오퍼 만료가 있으면 해당 합법 행동으로 연결 |
| S14 선수단 | RECORD | 선수단 수·등록 상태 → 역할 필터 → 이름·종합·부상·계약 목록 | 선택 선수 보기 | 승강 불가 사유와 인원 제한은 해당 선수 옆; 빈 검색은 필터 초기화 |
| S15 라인업 | FORM | 라인업 검증 요약 → 타순·수비 목록 → 선발·불펜 → 변경 요약 | 라인업 적용 | 같은 선수 중복·빈 수비·부상 등 필수 오류 먼저; 다이아몬드만으로 입력하지 않음 |
| S16 선수상세 | PLAYER | 실루엣 카드·이름·역할 → 종합·6능력 → 실제 기록 → 계약·출처 → 기용 | 현재 모드의 기용/계약 보기 | 원본 출처는 새 선수의 현재 기록과 분리; 타구단 선수에 기용 명령 없음 |
| S17 시장 | FORM | FA/내 제안 → 실제 후보 → 금액·기간·역할 → 성공확률·예약액 → 제안 | 제안 보내기 | 스카우트 발견과 영입 성공을 혼동하지 않음; 만료/권리/예산 최신 확인 |
| S18 리그 | RECORD | 리그·시즌·정규/PS 필터 → 순위/일정/개인기록 → 상세 | 선택 기록 보기 | 분모0은 대시; 무경기 시즌·동률 수상·다른 리그 기록 분리 |
| S19 경기 | RECORD | 확정 경기 점수 → 이닝별 → 타자/투수 박스 → 근거 장면 | 원래 화면으로 | 확정 로그 불가는 요약 유지; 진행 중 스냅샷을 FINAL로 표시하지 않음 |
| S20 저장 | UTILITY | 세이브 목록 → 선택 상세 → 백업/복원 → 파괴 작업 별도 영역 | 선택한 저장 관리 | 삭제·복원은 대상명과 영향 확인; 오류를 세이브0으로 오인하지 않음 |
| S21 설정 | UTILITY | 글자·모션·소리 → 계정 → 버전 → 로그아웃/삭제 별도 영역 | 설정별 저장/계정 행동 | 즉시 선호와 서버 계정 작업 구별; 계정 삭제는 일반 설정 적용과 합치지 않음 |
| S22 스타일 | FORM | 현재 스타일 → 후보 유형 → 정확 변경 효과 → 남은 기회 | 스타일 선택 확인 | 확률 없는 변경에 적용100% 없음; 거포형·거포수비형 등 게임 명칭 사용 |
| S23 강화 | DECISION | 시즌 기회 → 대상 능력 → 확정/도전 성장 → 비용·정확 증가·확률 | 선택한 성장 확인 | 시즌1회 사용 완료·상한·피로 제약 표시; 실패도 이미 소비된 기회 유지 |
| S24 대표선발 | DECISION | 실제 대회·차출 허가 → 명단·역할 → 일정·병역 관련 조건 | 참가/사양 확인 | 후보 전망과 확정 선발 구분; 실제 출장 전 메달·병역 결과 선표시 금지 |
| S25 국제대회 | RECORD | 국제대회 단계 → 대진·순위 → 실제 개인 출장 → 확정 결과 → 복귀 | 다음 경기/복귀 | 명단 포함과 실제 출장 다름; 탈락·미출장도 정상 결산 |
| S26 병역 | DECISION | 현재 병역 상태 → 게임 내 기한 → 가능한 경로 → 비용·선발확률·일정 | 선택 경로 확인 | 메달만으로 자동 해결 가정 금지; 실제 게임 조건 충족 결과만 표시 |
| S27 복무복귀 | UTILITY | 현재 복무 블록 → 계약·보유권 → 예정 복귀 → 가능한 다음 행동 | 다음 블록/복귀 확인 | 달력과 팀 경기 회복 혼용 금지; 복귀 선수의 실제 등록과 계약 확인 |
| S28 졸업진로 | DECISION | 졸업 요약 → KBO·대학 카드 → 자격 충족 시 미국 카드 → 비교 | 선택 경로 상세 | 미국 조건 미달은 카드 자체 없음; 오퍼 열람만으로 다른 진로 닫지 않음 |
| S29 미국제안 | DECISION | 실제 미국 오퍼 → 구단·레벨 → 통화·기간·보너스·권리 → 비교 | 제안 수락 | 유효 오퍼0이면 수락 제거; 메이저 계약과 마이너 계약 구분 |
| S30 미국홈 | DASHBOARD | 현재 미국 레벨·등록 상태 → 종합·실제 기록 → 일정 → 진로 | 현재 구간 진행 | 계약은 MLB 실제 출장 아님; 벤치/강등/방출에도 실제 다음 경로 제공 |
| S31 포스팅 | DECISION | 포스팅 자격·권리 → 승인 전망/확정 → 신청 조건 → 선택 | 포스팅 요청 | 자격 미달·구단 거절·군 문제를 별도 사유로 표시; MLB 오퍼 보장 없음 |
| S32 해외협상 | DECISION | 해외 오퍼·마감 → 계약 종류·역할 → 비용·보유권 → 수락/잔류 | 선택 제안 수락 | 오퍼 소멸은 잔류 등 실제 대안으로; 국내 계약과 이중 수락 방지 |
| S33 국내복귀 | DECISION | 국내 보유권 → 대기·병역 → 합법 경로 → 준비 일정 | 귀국 경로 확인 | 권리 해결 전 FA처럼 계약 불가; 준비 진행 취소와 확정 이적 분리 |
| S34 대학 선택 | FORM | 학교별 입학 조건·경쟁 → 선택 학교 상세 → 진학 후 일정 | 입학 확인 | 미충족 조건은 학교 카드 사유; 열람만으로 입학 확정하지 않음 |
| S35 대학 커리어 | DASHBOARD | 학년·학교 → 정규/선수권 → 개인 기록 → 다음 달·학년 진로 | 현재 학사 구간 진행 | 미출장·유급/졸업·중도 프로 경로를 실제 학적과 연결 |
| S36 스카우트 탐색 | FORM | 시설·월 기회 → 탐색 조건 → 비용·발견확률 → 보고서 | 탐색 요청 | 탐색 실패와 후보0·보고서 조회 실패 구별; 치트도 적격 조건/월2회 유지 |
| S37 구단 예산 | RECORD | 가용액 → 지급·예약·채무 → 원장 → 시설/재건 | 선택 재정 작업 확인 | 치트는 제한 없음 표시+유한 원장; 해임 채무가 가용액으로 환원되지 않음 |
| S38 특성·시그니처 | RECORD | 보유/미해금 → 공개 진척 또는 히든 이름·암시 → 효과·근거 | 특성 상세 보기 | 히든 미해금은 문턱/근접도 없음; 보유 전체 조건부 자동 적용 |
| S39 구종·타격성향 | FORM | 현재 구종2~4·숙련 → 배분 합100 → 학습 → 타격성향 | 계획 변경 확인 | 모든 구종 최소10; 상한·학습 비용·다음 효력 시점 표시 |
| S40 목표·도전과제 | RECORD | 시즌 목표0~3 → 정확 진척 → 공개 도전과제 → 기념 외형 | 목표 확인/외형 선택 | 추천은 자동 선택 아님; 완료 목표 교체 불가·이미지 보상 능력효과0 |
| S41 에이전트·구단관계 | DECISION | 담당·전문분야·수수료 → 실제 오퍼 → 상향별 금액·확률 → 요청 | 상향 요청 | 성공은 새 오퍼 생성; 실패는 기본 유지·기회 소진·급여 미지급분 수수료 없음 |
| S42 라이벌·동료 | RECORD | 상대 카드 → 관계 연표 → DIRECT/COMPARISON → 근거 경기 | 선택한 관계/경기 보기 | 벤치만 재회 아님; 107의 형성/결투/WIN 구별·다른kind 직접 타석만 |
| S43 코치·스카우트 | FORM | 코치/스카우트 슬롯 → 내 원본/가상 → 급여·보장 → 담당 효과 | 고용/담당 변경 확인 | 같은 원본 PLAYER/STAFF 동시 불가; 해임 미지급 보장·다음날 효력 확인 |
| S44 중요경기중계 | VIEWER | 확정 경기 → 현재 타석 → 숨김 가능한 점수 → 재생·배속·다시보기 | 재생/정지 | 관람만·결과 재추첨0; 로그 불가시 요약·자동 낭독 강제 없음 |
| S45 야구연대기 | RECORD | 핀 피드/시즌 책 → 필터 → 공식 카드 → 내 메모 → 내보내기 | 메모 저장/내보내기 | 공식 기록 수정 불가; 충돌은 초안 보존·파일 만료는 작업 재조회 |

## 크기별 구성 D

- 360/390px: 상단 제목·날짜·뒤로가기 → 그림/선수 요약 → 핵심 데이터 → 세부 → 주행동. 목록은 실제 데이터를 먼저 보여주고 장식 hero는 목록 위 높이120px 이내로 줄인다. 커리어/구단 홈의 큰 hero는200px 이내, 폼 초상은160px 이내다. 높이는 최대값이며 글자 확대시 데이터 영역을 자르지 않는다.
- 768px: 폼/결정은 입력과 요약의2열을 허용하되 좁으면 단일열. 모달 확인은 뷰포트보다 커지면 내부 스크롤과 보이는 닫기/확정 경로를 제공한다.
- 1280px: 본문 최대1200px, 대시보드 주열/보조열=2:1, 선수 상세는 초상·6능력/기록2열, 목록은 본문 폭 사용. 큰 그림 때문에 핵심 수치가 첫 화면 아래로 모두 밀리지 않게 한다.
- 6능력은 작은 화면3×2, 긴 이름·200% 글자에서2×3 또는 단일열. 종합은 항상 별도 텍스트이며 레이더만으로 대신하지 않는다. 표만 내부 가로 스크롤 가능하며 페이지 전체는 가로로 넘치지 않는다.
- 하단 고정 CTA가 있는 화면만 동일 높이+safe-area만큼 본문 끝 여백을 둔다. 키보드가 열렸을 때 입력/오류/확정 접근을 유지한다. 고정 버튼으로 표의 마지막 행을 가리지 않는다.

## 8종 상태의 제작 기준

| 상태 | 제작·문안 규칙 |
|---|---|
| NORMAL | 위45행 읽기 순서와 단일 주행동. 확률·금액·효과는 이미지 밖 텍스트 |
| LOADING | 예약된 카드 높이/스켈레톤, 오래된 데이터를 최신으로 확정하지 않음. S01은 이어하기 문구 유지·aria-busy만 |
| EMPTY | 데이터0/필터0/적격0 각각 이유. 조회 실패를 빈 상태로 바꾸지 않음 |
| ERROR | 실패한 조회/명령의 위치와 재확인 행동. 입력 초안 유지, 같은 확정 명령 새 생성 금지 |
| SUBMITTING | 같은 명령 중복 방지. 읽기전용 화면은 해당 없음; S01 홈에는 중단/복구 설명 추가 금지 |
| CONFLICT | 실제 재확인이 필요한 변경을 해당 화면에서 확인. 메모 초안 자동 덮어쓰기 금지 |
| LONG_CONTENT | 한글 이름16자·긴 구단명·100.0/큰 금액·다단락 사건·200% 글자. 축소글씨/말줄임만으로 결정정보 숨기지 않음 |
| ASSET_FAILURE | 슬롯 크기 유지+팀명/선수명·역할/단색 배경. 실루엣 카드·로고 없다고 경기·계약을 차단하지 않음 |

기본 오류·빈 문안은screen-state-catalog.json을 따른다. 위 표는 이를 대체하는 공통 새 문자열이 아니라 제작 기준이다. 장면의 우승/메달/계약/은퇴 결과는94/95의 확정 근거 가드를 통과한 때만 사용한다.

## 이미지 제작 순서와 재사용

1. 승인된 청춘 애니 hero와12장면의 현재 활성 파일을 슬롯에서 사용한다. 모든 화면에 새 그림을 하나씩 만들지 않는다. 장면을 크롭해도 얼굴/공/손/메달의 의미가 잘리면 별도 컷이 필요하다.
2. 선수 카드는119의 승인 얼굴 없는 실루엣14종을 투타·폼에 맞춰 사용한다. 이름/팀/나이/기록은HTML텍스트다. 고교/19세 복사본과 은퇴 원본은 실제 나이 텍스트와 출처로 구분한다.
3. 우선 보강 컷: 대학 생활, 미국 마이너 원정, 프로 직접대결 라이벌, 복무·복귀, 은퇴 회고. 기존 장면이 조건과 맞으면 재사용하며 부족한 구도를 새로 제작한다. 이미지 생성 전 용도·크롭·결과 가드·fallback·출처 기록을 함께 정한다.
4. 기념 카드/프레임은 기념 보상만. 로고는 기존37/자산 등록부의 확인 결과를 사용하고 미확인 배포 자산은 팀명+색 표식으로 대체한다. 새로 공식 로고를 확보했다고 주장하지 않는다.

초기 PNG8개라는 집계는 작성 당시 이력이다. 현재 이미지 레지스터 EXISTS80/TODO0이며 실제 픽셀·배포 크기/용량·접근성 검수는 별도다.

## 검수와 다음 인계

각 화면 360/390/768/1280에서 먼저 정상 상태를 캡처하고,8종 중 실제 해당 상태를 추가한다. 캡처에는 screenId/상태/fixture/viewport/서체/그림버전/sourceCommit을 붙인다. 폼은 키보드와 포커스, 표는 확대/정렬, 감상 중계는 속도/음성/점수 숨김을 별도 확인한다. 파일 경로 정책 차단을 임시 서버나 다른 자동 브라우저로 우회하지 않는다.

이번 정적 검사는45개ID/참조/슬롯 일치·대표 연결·상태 누락만 증명한다. 실제 픽셀·터치·접근성·게임 동작의 PASS가 아니다. 다음 제작은 미연결 대표 화면부터 실제 시안으로 그리고, 필요한 이미지 구도를 제작한 뒤 사용자가 볼 수 있는 폴더에 저장한다. 이어하기 진입과 확률1 배지 숨김 규칙을 계속 유지한다.

109 후속: [마감 보드](finish-board.html)에기존 대표28에포함되지 않던17개화면의배치·8종 상태를추가하고새6컷PNG를적용했다. 위 본문의미제작17/PNG8개는이전시점이다. 현재총9PNG·45화면ID 대표연결,최종픽셀/브라우저실행미검수는유지한다. 상세범위와후속은 [109](109-FINISH-BOARD-ART-AUDIT.md).

## 2026-10-20 구현 전 점검

[127 코드 표시11묶음](127-CODE-DISPLAY-SPECIFICATION.md)과 [128 화면별 정적 대조](128-PREIMPLEMENTATION-SCREEN-AUDIT.md)를 연결했다. 화면45개·8상태·그림 슬롯의 서면 대조는 완료, 실제 브라우저/기기 최종 마감은 미실행이다.

---

<!-- SOURCE: 109-FINISH-BOARD-ART-AUDIT.md -->

실루엣 이미지 표기(2026-10-20 현재): 선수 초상 자리는 사람 외형 초상이 아니라 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 실루엣+이름 카드를 쓴다. **타자6·투수8 실루엣14종은 사용자 승인·파일 반영을 완료했다.** 현재 이미지 제작 레지스터는 EXISTS80/TODO0이며 실제 브라우저/기기 검수는 별도다. screen-image-slots.json의 SILHOUETTE_CARD/silhouetteCard 슬롯이 그 자리이며, 시안·보드의 기존 초상 PNG는 예시 자산일 뿐 선수 외형 확정이 아니다.

# 109. 남은 17개 화면 시안·새 6장면·설계 점검

2026-10-19 / DESIGN_PREVIEW_ONLY / 실제 앱 구현 착수 아님.

## 네 단계의 실제 진행

| 단계 | 이번 결과 | 완료라고 부르지 않는 부분 |
|---|---|---|
| 1 예외 판정 | 107의 라이벌 형성/결투/히든·완봉·연속 시즌·정정 D와36개 서면 사례 작성 | 실제 엔진 판정/DB/원자성 검증 |
| 2 화면 마감 | 108의45개 명세에 이어, 별도 [마감 보드](finish-board.html)로 미연결17개 화면의 구체 배치·8종 검토 상태 작성 | 사용자 최종 선택, 실제 브라우저·실기기·픽셀/키보드 검수 |
| 3 이미지 | 빈티지 연감 새6장면 아틀라스1PNG 생성·원본 보존·프로젝트 복사·시안 적용 | 모든 연령/포지션 초상과 최종 배포 파생물 전체 제작 |
| 4 문서 점검 | ID/원문/시안 참조·예시 수치·핵심 결정·공개 데이터 경계의 정적 검사와 인계 갱신 | 실환경 증거가 필요한 게이트의 승인 |

첫 두 단계가 모두 최종 승인됐다는 뜻이 아니다. 단계별로 서면 명세, 시안 작성, 화면 검수, 실제 앱 검증을 구분한다. 107의 D는 사용자 개별 확정 U로 승격하지 않는다.

## 17화면의 구체 제작

S01 홈, S04 고교결산, S10 보관목록, S11 보관상세, S15 라인업, S18 리그, S20 저장, S21 설정, S22 스타일, S25 국제대회, S26 병역, S27 복무복귀, S29 미국제안, S31 포스팅, S32 해외협상, S33 국내복귀, S34 대학선택.

단순 화면 이름 목록이 아니라 각자의 실제 문안·카드·기록표·조건·행동 배치를 작성했다. `finish-board-data.json`과 같은 내용을 `finish-board-data.js`에 넣어 로컬 file 환경에서도 fetch 없이 읽도록 했다. `finish-board.js`는 순수 문자열 렌더와 로컬 화면 선택/너비/크기/타순 중복 예시 검사만 제공한다. 서버·로그인·세계/파일 저장·실제 계약 API는 호출하지 않는다.

검토 상태는 NORMAL/LOADING/EMPTY/ERROR/SUBMITTING/CONFLICT/LONG_CONTENT/ASSET_FAILURE 8개,17×8=136개 문자열 예시다. 같은128개 이상의 배치가 각자 새로 그려진 독립 디자인이라는 뜻은 아니며 공통 상태 틀과 화면별 데이터가 조합된다. 상태 선택기는 게임 화면 밖의 **설계 검토 도구**다. S01 안에는 중단 상태 선택기·복구 안내·진행 설명을 넣지 않는다. 이어하기 문구는 로딩/확정 처리 중에도 유지한다.

너비360/390/768/1280과 글자 기본/크게/200% 비교를 제공한다. 검사 도구의 좁은 컨테이너에서는 넓은 시안을 가로로 살펴볼 수 있다. 이것은 제품이 페이지 가로 넘침을 허용한다는 규칙이 아니라 큰 화면 비교용 도구다. 실제 모바일 페이지는83/108의 넘침 방지 기준을 따른다.

라인업은3개의 예시 타순 선택과 중복 검사만 있다. 실제9명·수비·부상·로스터 전체 검증을 구현한 것으로 세지 않는다. 학교는43의 조건을 사용해 종합54에서 한빛대55미달/백림대52충족/해오름대1충족을 비교한다. 계약 화면은 금액/기간이 생략된 요약 단계에서 수락 버튼을 주지 않고 상세 비교로 연결하는 배치다. 임의 확률을 만들어 채우지 않는다.

기존 비교 보드30배치/26흐름78상태와 이번17배치136상태는 별도다. 기존 대표 게임화면28+추가17의 합집합45를 확인하되 이를45개 최종 시각 승인으로 부르지 않는다. 기본45목업/99이벤트/298기존 기대값/61UI 항목의 수와 실행 상태는 유지한다.

## 새 장면 자산

파일: [career-scenes-finish-v1.png](assets/art-lab/career-scenes-finish-v1.png).1536×1024,3열×2행의512px 정사각6컷. `background-size:300% 200%`로 패널 하나를 선택하고 가로 카드에는 중앙 크롭한다. 생성된 원본은 .codex/generated_images에 남기고 동일 PNG를 프로젝트와V사본에 저장한다. 프롬프트·원본 경로는 [FINISH-GENERATION](assets/art-lab/FINISH-GENERATION.json),해시는MANIFEST에 기록한다.

| 패널 | 장면 | 사용·결과 가드 |
|---|---|---|
| 위 왼쪽 | 대학 캠퍼스에서 구장으로 향하는 선수 | 진학/학교 비교. 실제 입학 전에는 입학 완료 장면으로 설명하지 않음 |
| 위 가운데 | 미국 마이너 원정 버스 | 미국 제안·해외 진로의 분위기. MLB 승격/계약 성공을 뜻하지 않음 |
| 위 오른쪽 | 타자·투수 라이벌 맞대결 | 스타일·중립 경기 맥락. 승패/관계 WIN을 그림으로 확정하지 않음 |
| 아래 왼쪽 | 가방·글러브를 든 복귀 선수 | 복귀·병역 경로의 중립 이미지. 실제 복무 완료는 별도 텍스트 근거 |
| 아래 가운데 | 유니폼을 돌아보는 은퇴 선수 | 원본 보관·회고. 어린 복사본을 은퇴 얼굴로 표시하지 않음 |
| 아래 오른쪽 | 새벽 빈 구장과 글러브 | 홈/관리/목록의 중립 배경. 게임 결과를 암시하지 않음 |

생성 도구 출력을 직접 보고6패널/빈티지 톤/인물·도구/장면 구별을 확인했다. 실제 HTML 크롭과 모든 화면 배치의 시각 검수는 미실행이다. 현재 신규 일러스트 PNG는 총9개이며 예전 문서의8개는 당시 보유 수다. 이 이미지는 공식 구단 로고의 출처나 권리 상태를 바꾸지 않는다.

## 문서 점검 결과와 후속 작업

| 확인 | 결과 |
|---|---|
| 원본45 ID·슬롯·화면별 마감 행 | 정적 일치 검사 |
| 기존 대표28/신규17의 누락·중복 | 합집합45/교집합0 검사 |
| 새17×8 상태·자료 JS/JSON·구문 | 순수 렌더/일치 검사. DOM 작동 증거 아님 |
| S01 이어하기만·100% 단순변경 배지 제거 | 렌더 문자열 경계 검사 |
| 능력별 최고 절반 예시 | 90/100/88/86/92/94 →45/50/44/43/46/47,평균45.8 |
| 대학 입학 조건·권리 있는 진로 |43/23/107/108 연결. 입학/계약 실행 아님 |
| 미해금 히든 서버용 정의 | 공개 마감 데이터/스크립트에 포함하지 않음 |
| 보관/목표/치트/확률/이어하기 U | 기존 원문과 정적 검사 유지 |
| 서체·기존 PNG·공식 로고 | 기존 파일 보존, 신규6컷과 프롬프트 등록 |
| 다른 환경 인계 |START-HERE/STATUS/통합MD/MANIFEST/V사본 갱신 |

남은 시각 작업은 이 시안에 대한 사용자 피드백 반영과 실제 렌더 검수, 필요할 때 선수 연령·역할별 초상과 카드 변형 제작이다. 전체 미정 게임 기능을 새로 만들 필요가 있다는 뜻은 아니다. 데이터/API/Neon/게임엔진·장기 균형·로그인·강제종료·APK/build는92의 구현 후 실행 게이트다. 실제 실행하지 않은 게이트를 정적 PASS로 닫지 않는다.

이전 file: 자동 브라우저 정책 차단을 우회하지 않는다. 사용자에게 로컬 보드 경로와 이미지 파일을 제공하고,현재 검증은 순수 템플릿·자료/산술·문서 일관성까지만 보고한다.

---

<!-- SOURCE: 110-GRADUATION-STYLE-CROP-REVISION.md -->

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

# 110. 얼굴 잘림 수정·낮 장면·2번 그림체 비교

2026-10-19 / 사용자 실제 스크린샷 피드백. S04에서 머리 윗부분이 잘리고 그림이 적어 밋밋하다는 의견, 모든 장면이 저녁 같다는 의견을 반영한다. 사용자는2번 그림체로 바꿀 수 있는지 물었다. **전체 메인 그림체를2번으로 확정한 것으로 처리하지 않고**, 고교 결산에서 구체적인 비교안을 만든다. 기존 선택된 빈티지 자산은 보존한다.

## 잘림 원인과 수정

기존512px 정사각 장면을390px 폭으로 표시한 뒤 높이185px 창에서 세로 중앙을 잘라 보여줬다. 위쪽 약102.5px가 가려져 인물 머리가 사라졌다. 데스크톱 고정 높이/크롭 규칙도 동일한 문제를 만들 수 있었다.

- S04에는 각 그림체의 전용 가로 그림을 사용한다. img는 width:100%, height:auto, object-fit:contain으로 원본 전체를 보여주며 고정 높이·세로 이동을 사용하지 않는다.
- 나머지 정사각 아틀라스는패널1:1 비율의자연 흐름과 background-size300% 200%를 유지한다. 낮은 창에서 중앙을 자르지 않는다. 큰 화면에서는 그림 자체 최대560px로 가운데 정렬하고추가 수직 크롭을하지 않는다.
- 상단 바는그림 밖의별도 행이다. 사용자 스크린샷에서잘린 것은브랜드 바가 아니라그림의윗부분이며, 이를구분해수정한다.

## 화면 안의 이미지 구성

고교 결산 정상/긴 글자 상태는1)마지막 고교 시즌 전용가로 장면 2)18세 선수초상과이름·역할·간단한소개 3)시즌기록·드래프트전망·성장수치 4)구장 회고 이미지 순서다. 기존텍스트카드만반복하는구성에선수 식별과장면회고를추가했다. 수치·확률·기록은계속HTML텍스트이며이미지안에굽지않는다. 이미지실패검토상태는대체텍스트/배경으로돌아가며초상과보조이미지도숨겨실제정보를보존한다.

## 2번 그림체 제안

[마감 보드](finish-board.html)는S04부터열리고화면밖‘고교 결산 그림체 비교’에서 **2번 청춘 야구 애니·맑은 낮 / 3번 빈티지 기록실**을전환한다.2번은밝은하늘·중성낮빛·깨끗한선/색면,기존안은종이질감·따뜻한톤이다. 비교기본표시는2번이지만전역선택 U와기존30대표보드의기본값을자동변경하지않는다. 다른16화면에서는해당선택기를비활성화해아직만들지않은2번스타일이적용된것처럼보이지않게한다. 서체는유지한다.

장면시간대 D: 훈련/고교·대학일상은아침이나낮,경기는일정에맞는낮/야간,협상·운영은중성실내광,해외이동은시간대별혼합,은퇴는상황에맞는차분한빛. 빈티지또는청춘그림체라는이유만으로석양을강제하지않는다. 현재전체아틀라스의시간대를모두새로그린것은아니다.

새4PNG는가로장면2개/초상2개이며기존9개와합쳐일러스트PNG13개다.4원본은생성폴더에그대로남기고프로젝트/V사본에복사한다. [프롬프트기록](assets/art-lab/GRADUATION-STYLE-GENERATION.json)에사용처/원본파일/요청을보존한다. 이두캐릭터초상은그림체비교용가상선수이며실제선수사진이아니다.

## 검증·경계

사용자 스크린샷과CSS수치로잘림을추적했다. 순수렌더에서그림체별가로img·초상·회고3이미지/8상태·fallback을검사하고기존45ID·확률·이어하기검사를유지한다. 원본PNG크기·파일참조·자료JS/JSON일치와크롭규칙제거는정적검사다. 실제브라우저렌더/손가락입력/200%확대는이번에도미검수이며file:정책차단을우회하지않는다.

기존게임규칙·기록·능력·DB·APK구현은바꾸지않는다. 전체그림체를2번으로확정하면이비교안을기준으로나머지장면/초상·UI팔레트를일관되게확장한다.

---

<!-- SOURCE: 111-ANIMATION-MAIN-ART-DIRECTION.md -->

실루엣 이미지 표기(2026-10-20 현재): 선수 초상 자리는 사람 외형 초상이 아니라 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 실루엣+이름 카드를 쓴다. **타자6·투수8 실루엣14종은 사용자 승인·파일 반영을 완료했다.** 현재 이미지 제작 레지스터는 EXISTS80/TODO0이며 실제 브라우저/기기 검수는 별도다. screen-image-slots.json의 SILHOUETTE_CARD/silhouetteCard 슬롯이 그 자리이며, 시안·보드의 기존 초상 PNG는 예시 자산일 뿐 선수 외형 확정이 아니다.

# 111. 메인 그림체 변경 — 청춘 야구 애니 U

2026-10-19 사용자 확정: **2번을 메인 그림체로 변경**. 93~110에서 기존 선택으로 기록된 ‘빈티지 기록실’은 이전 결정 이력이다. 이번 U가 메인 그림체 범위에서 우선한다. 글꼴·게임 규칙·확률·능력·기록·저장·플랫폼 범위는 바꾸지 않는다.

## 변경한 시안

- 기본45화면 보드: 메인 구장/선수 예시·배경 팔레트를 밝은 청춘 애니로 변경했다.
- 대표30배치/78상태 비교 보드: 기본 선택을animation으로 바꾸고12사건 장면/타자·투수초상을 새 그림체로 연결했다. 이전로컬 선호가빈티지를기본으로복원하지않도록비교도구의선호key/version을v3로갱신한다. 게임 세이브와는무관하다.
- 추가17배치 마감 보드: 전역animation·낮/실내/야간의새장면으로연결하고S04에는전용가로장면·18세초상·회고이미지를넣었다. S04에서만이전빈티지그림체와비교할수있다. 다른16화면의기본은청춘애니이며비교선택기는비활성화한다.

## 시간대와 구도 D

그림체와시간대를분리한다. 훈련은맑은아침,학교/해외이동은낮,협상·운영·재활·은퇴는중성창빛,라이벌야간경기는푸른하늘/흰조명이다. 자동석양·모든장면오렌지광은사용하지않는다. 메달그림은종전처럼실제해당성과근거가있을때만사용한다.

110에서추적한잘림원인은정사각그림을185px고정높이로중앙크롭한것이다. 마감보드의아틀라스는정사각패널전체,가로hero는width100%/heightauto/contain으로표시한다. 대표보드에서도사건그림은자연흐름의전체패널을쓰고청춘hero는전체가로그림아래에제목을따로놓는다. 이미지에제목을덮어인물이나대비를희생하지않는다. 실제브라우저렌더검수는별도다.

## 자산·이전안 보존

이번추가7PNG: 빈티지비교가로/초상2개,청춘고교가로/초상2개,청춘사건아틀라스2개12컷,청춘투수초상1개. 기존9개와합쳐일러스트PNG16개다. 기존빈티지/시네마틱원본을삭제하거나덮어쓰지않는다. 새파일명은별도버전이며생성원본도보존한다. [고교생성기록](assets/art-lab/GRADUATION-STYLE-GENERATION.json)과 [메인전환기록](assets/art-lab/ANIMATION-MAIN-GENERATION.json)에프롬프트·원본·패널용도를기록한다.

기존의투명초상2개는레거시자산으로보존한다. 활성청춘초상은밝은배경을포함한새타자/투수이미지이며투명컷아웃이라고표시하지않는다. 어린복사본/고령원본의전체연령프리셋을이번에모두제작한것은아니다. 초상은예시선수용,실제선수사진/개인업로드는없다.

## 검증과 한계

기본선택/활성사건파일/12패널/활성초상/기존45ID·확률·이어하기/미해금데이터경계·S04두스타일3이미지·fallback을정적검사한다. 새이미지출력에서인물과시간대를직접확인했다. 야간모자등생성된작은문양/장비세부는최종아트검수대상이다. 정적PASS를실제크롭·뷰포트·키보드·사용자승인으로올리지않는다. file:정책차단을우회하지않는다.

실제앱/DB/API/Neon/build/APK는여전히시작하지않았다. 110의‘전체선택미확정’표현은질문직후의이력이며이문서의사용자확정U로대체한다.

---

<!-- SOURCE: 112-ABILITY-CEILING-PERFORMANCE-BALANCE.md -->

최신 확정(2026-10-19): 이 문서의 극단 비율은 투구폼·좌우 보정 0 기준이다. 새 보정의 합산 예제는 [123](123-EFFECT-SUM-EXAMPLES.md)이며 장기 영향은 119의 FX 실험에서 확인한다.

# 112. 능력치100과 실제 성적·극단 능력 밸런스

2026-10-19. 사용자 질문: “능력치가 모두100이면 타율1/장타율1인가?” 기존 [08 산식](08-FORMULAS.md)/[41 여섯 능력](41-SIX-STAT-ENGINE.md)을 확인하고 수치 예시와 설명·검수 기준을 추가한다. 신규 경기 엔진 구현이나 성공률 상향이 아니다. 아래 숫자는 캘리브레이션 전 현재 D 산식의 해석이며 실제 시즌 실험 결과가 아니다.

## 서로 다른 네 가지 값

| 값 | 의미 | 100의 의미 |
|---|---|---|
| 현재 능력 A | 지금 가진6능력,종합은 영구6능력 평균 | 해당 능력의게임내상한. 안타확률100%가 아님 |
| 잠재력 P | 성장 가능한 능력 상한 | 최대100까지성장가능. 현재A를즉시100으로바꾸지않음 |
| 타석 결과 확률 | 상대·수비·피로·상황·특성 등을 적용한8결과 분포 | 같은한타석의BB/HBP/K/1B/2B/3B/HR/OUT합1 |
| 타율/출루율/장타율 | 이미 확정된 실제 경기 원기록으로 계산한 비율 | 능력눈금과별개이며분모·단위도다름 |

커리어치트의 P100·성장3배·강화성공보장과 구단치트의 소유선수P100·성장3배는85의확정대로다. 경기의 안타·홈런·우승 보장으로확대하지않는다. 현재능력모두100인타자를 별도로가정해도 실제아웃/삼진/볼넷이발생할수있다. 높은수비·주루·클러치가모두매타석타격보너스로중복가산되는것도아니다.

## 타격 비율의 분모·표시

- AVG=H/AB. 범위0~1.000, AB=0이면null/‘-’. 볼넷·사구는타수에넣지않는다.
- OBP=(H+BB+HBP)/(AB+BB+HBP). 현v1은희생타를만들지않으므로SF분모를가짜추가하지않는다. 범위0~1.000.
- SLG=TB/AB, TB=1B+2×2B+3×3B+4×HR. 최대4.000. 1.000은상한이아니다.100타수25홈런/75아웃이면타율.250·장타율1.000이다.
- OPS=OBP+SLG, 이론최대5.000. 장타율/OPS를UI확률컴포넌트에넣어100%로clamp하거나능력레이더의100상한을재사용하지않는다.
- 짧은표본에서첫타석안타로AVG1.000이되는것은정상이다. 만능타자의1.000을막기위해실제기록을임의절삭하지않는다. ‘능력100이보장하지않음’과‘실제결과1.000은금지’는다르다.

## 현재 산식의 고정 대조군

공통: 무주자/피로0/사기1/임시보정0/특성·구종·성향보정0/중립구장. 타자6능력은같은값,투수6능력은같은값,수비D는실제수비8명의적합도반영후평균을별도고정했다. 타자본인수비능력100을상대수비D로잘못쓰지않는다.

다음은08의softmax확률을그대로계산한 **고정조건의장기비율**이다. `sum(p_hit)/sum(p_AB)`, `sum(weighted_bases)/sum(p_AB)`이며실제600타석이나시즌의성적을생성한것이아니다. 상대교체/주자/피로/특성/일정이변하는실제시즌성적은달라진다.

| 타자6능력 | 투수6능력 | 수비D | AVG | OBP | SLG | HR/PA | K+OUT/PA |
|---|---|---|---|---|---|---|---|
|50|50|50|.265|.335|.425|3.00%|66.50%|
|100|50|50|.467|.555|.858|7.79%|44.51%|
|100|100|100|.218|.286|.371|2.79%|71.41%|
|100|1|1|.536|.614|.934|7.89%|38.57%|

K+OUT는타석기본결과분류확률이다. 추가주루아웃/병살의아웃수나전체팀아웃비율과같지않다. 안타확률/PA와AVG의타수분모도다르다.100vs50사례의안타/PA는약38.94%지만AVG는약.467이다.

100vs100이50vs50과같지않은이유: 대결차계수는상쇄돼도 상대수비D의절대값,주루의3B보정,제구의HBP보정이남는다. 이는현재명시산식의성질이며숨은만능선수페널티가아니다. 동일능력리그의타고투저정도를바꾸려면수비등의기준점/계수를별도균형변경으로버전관리한다. 이번질문만으로산식을몰래바꾸지않는다.

[정밀 예시 데이터](ability-performance-examples.json)에8결과확률과반올림전지표를기록한다. 실제해당선수의미공개잠재력/미해금특성/다른친구자료를공개하는API가아니라설계용중립예시다.

## 100상한 근처의 행동·화면

- 종합 옆 도움말: “종합은 여섯 능력의 평균입니다. 실제 성적은 상대와 경기 상황에 따라 달라집니다.” 선수생성/상세의능력정보와기록탭을구분한다.
- 잠재력 도움말: “성장 가능한 상한입니다. 현재 능력과 다릅니다.” 일반·하드의정확P비공개/관측범위는67/75를유지한다.
- 기록의SLG/OPS는.999를넘어도1.000/1.250/4.000/5.000을정상표시한다. 확률%배지나능력진행막대를재사용하지않고tabular-nums폭을확보한다.
- 도전 강화는성공추첨의보장이며성공효과는남은상한으로절삭한다. A=100이면75의불가대상/기회미소모,다른대상이나컨디셔닝을제공한다. 모든능력100일때유료반복강화나숨은100초과성장을추가하지않는다.
- 자연성장은실제현재A/P상한에서멈추며3배를적용해도넘지않는다. 피로·노쇠·부상/역할/등록·계약등다른규칙은계속적용된다. 종합100이현재상황유효값100을항상보장하지않는다.
- 19세복사본은원본6최고가전부100이어도현재6능력50으로시작하며종합50.0이다. 새P와치트상한100은그후성장의상한이다. 원본은불변이다.

## 구현 후 균형 실험 인계 D

| 실험 | 입력·검사 | 판정의 경계 |
|---|---|---|
| B100-01 중립 | 50vs50/D50의10만타석·고정seed군 | base분포복원/실측표본오차를검사. 이번엔난수실험미실행 |
| B100-02 상한 | 100vs50/D50·100vs100/D100·100vs1/D1 | 모든8확률양수/합1·아웃가능. 만능선수시즌1.000을강제하지않음 |
| B100-03 단일축 | 상대·D고정후C/P/E/S를각각변화 | 컨택K감소/파워장타분포/선구BB증가등의도한 지표를검사. 다른결과의정규화변화도기록 |
| B100-04 상황 | 같은영구100에서무주자/RISP·피로/특성cap비교 | clamp·적용순서41/56/90을그대로검증. 클러치를무주자에추가하지않음 |
| B100-05 시즌 | 실제일정·상대교체·불펜/피로가있는100선수100seed시즌 | AVG/OBP/SLG/HR/K/출장·승률분포. 고정대조군표를성적보장으로사용하지않음 |
| B100-06 장기치트 | 커리어/구단치트20시즌,선수100 도달 후/원본복사 | 성장/원장cap·리그득점폭주·대체선수·은퇴가정상인지기존장기게이트와함께검사 |

실제리그의모든선수를50으로 고정한중립실험과평균적인게임리그는동의어가아니다.41/84의리그범위는전체실제생성군의점검범위다.개인100vs50의.467을그리그AVG범위위반으로기계적으로실패처리하지않는다.

이번정적검사는산식/수치예시/설명분모의일관성까지만이다. 새6실험은NOT_EXECUTED이며기존298/61/36의실행상태를바꾸지않는다. 실제경기·시즌·Neon/API/브라우저/build/APK는이번에시작하지않는다.

---

<!-- SOURCE: 113-FIRST-CAREER-SEASON-EXPERIENCE.md -->

# 113. 첫 커리어·고교 졸업·진로별 첫 시즌의 경험 설계

2026-10-19 / 상세 D / 실제 앱 미구현. 새로운 리그·규칙을 추가하지 않고19/23/43/66/78/79/81의 계약을 플레이어가 읽는 순서와 안내 문안으로 연결한다. 메인 그림체는111의 청춘 야구 애니다.

## 첫 플레이의 목표

처음부터 모든 시스템을 읽게 하지 않는다. 생성에서는 ‘어떤 선수인가’,고교에서는‘어떻게 키우나’,졸업에서는‘어느 무대로 가나’,첫 소속에서는‘등록과 실제 출장’을 차례로 이해하게 한다. 튜토리얼을 봤다는 이유로능력/돈/오퍼/지명확률을지급하지않는다. 안내를넘겨도같은게임규칙과기록을유지한다.

첫 화면의선택은커리어/구단이며,기존세이브가있으면그위에이어하기가있다. 구단독립시작과보관0명경로를이온보딩때문에잠그지않는다. 이문서는선수커리어의첫시즌만다룬다.

## 안내 정책 D

1. 화면에보이는도움말은현재행동하나만설명한다. ‘다음’버튼을가리는연속모달/강제하이라이트투어는없다.
2. 이름·종류·집중4개·난이도·진로·계약등도메인선택은실제확인이필요하다. 안내문닫기는그선택을대신확정하지않는다.
3. 최초설명은개인표현선호로기록하고도움말에서다시읽을수있다. 스킵/다시보기는세계시간·난수·경기·비용·강화기회를소모하지않는다. 게임세이브의도메인revision과분리한다.
4. 모바일첫뷰에는현재소속·나이·핵심상황·다음주행동이보인다. 애니장면은자연비율로전체표시하고설명은이미지밖텍스트다. 이미지오류는그림자리만대체한다.
5. 확률이있는실제선택은서버의해당preview를표시한다. 단순설명읽기에적용100%를붙이거나이문서의고정사례확률을실전모든선수에복사하지않는다.

## 공통 일곱 장면

| 순서 | 화면·근거 | 선수에게 보이는 설명 | 필요한 확인/진행 |
|---|---|---|---|
| C01 내 선수 | S02/79/78 | “18세, 마지막 고교 시즌에서 시작합니다.” 6능력·평균50.0·집중4개·유형 표시 | 입력검증→같은생성요청확정. 희망구단은지명보장아님 |
| C02 첫 계획 | S03/E01 | “이번 시즌에 키울 네 가지를 확인하세요.” P와A차이는짧은도움말 | 생성때고른4개를복원,유지가능. 다시골라야만진행되는중복입력금지 |
| C03 첫 일정 | S03/19 | “출장은 기용과 일정에 따라 결정됩니다.” 기록0/타율‘-’ 정상 | 현재합법구간진행. 데뷔/첫안타/승리를튜토리얼보상으로강제하지않음 |
| C04 성장의 선택 | S06/23/E02·E03 | 12경기계획검토와16경기강화해금시점을구분 | 해당조건·사건생성근거가실제충족될때만등장. 강화시즌1회·건너뛰기허용 |
| C05 선수의 방향 | S22/34/26 | 24경기유형창에서“지금 유형을 유지해도 됩니다.” | 유형효과·사용가능횟수확인. 초점/유형/강화를한버튼으로묶어차감하지않음 |
| C06 고교 회고 | S04/E04 | 출장·기록·정산전후를구분하고“다음 무대를 고를 시간입니다.” | 실제정산완료값만확정성장으로표시. 보기좋은성적으로덮지않음 |
| C07 졸업 진로 | S28/23/43/66 | KBO·대학·조건충족시미국의차이와지명전망 | 조회와수락을분리. 미국카드=미국 스카우트 평가≥65·유효오퍼≥1·권리/학적유효 |

위순서는설명상장면이지7개모달을추가하는규칙이아니다. 경기진행도중부상/필수결정이먼저발생하면기존큐가우선하며안내가이를막지않는다. 고교12/16/24의문턱을접속횟수나가이드페이지수로바꾸지않는다. E02/03은선수종류와사건자격을따르고두종류를한선수에게함께지급하지않는다.

## KBO 첫 시즌

전망→실제지명E05또는미지명E06→실제계약확인S08→첫프로캠프E08→현재등록/경쟁→실제출장또는벤치→정규결산/해당PS/오프시즌정산의흐름이다.

- 전망예시는B45대조군의지명50%/지명된다면10라운드유력이다. 실제선수는현재평가값으로다시계산한다. ‘예상10라운드’와‘실제지명’은별도카드다.
- KBO계약이있어도첫시즌1군을보장하지않는다. FUTURES등록·콜업E09·1군실제첫출장을구별한다. E10의선택형사건이1군등록/진행의전제조건이되면안된다.
- 첫타석을아웃으로마쳐도축하도감으로첫안타를꾸미지않는다. 미출장결산도프로입단경력과실제출장0을따로보존한다.
- 정규종료를누른순간PS/국제창이남았다면최종오프시즌성장을앞당기지않는다.19의단일정산원장을유지한다.

## 대학 첫 학년

학교비교S34→입학확인→19세/1학년진입→48경기정규와실제기용→선수권자격확인→학년마감S35. 입학조건은추첨확률이아니며,학교명성/특징에숨은성장배수를붙이지않는다.

- 종합54인사례는한빛대55미달,백림대52충족,해오름대1충족이다. 주전기준과입학최소는서로다르다.
- 입학수락전학교를비교해도KBO/미국진로가닫히지않는다. 수락커밋이배타적인동시진로를종료한다.
- 1학년에게2학년조기지명버튼을미리실행가능하게보이지않는다. 첫학년안내는현재기록/경쟁/다음학년정도로마친다.
- 선수권참가/우승과기본48경기를혼합하지않는다. 학년진행과나이를각자기록하고준비예산3시즌을대학재학으로소모하지않는다.

## 미국 직행 첫 시즌

유효제안조회S29→금액·기간·계약종류·시작레벨·권리확인→실제수락→조직명단등록S30→현재레벨일정/승격검토→실제출장·결산. 미국팀계약은MLB즉시출장계약과다르다는문장을계약확인에한번명확히쓴다.

- Rookie/A/AA/AAA등실제오퍼의시작레벨로간다. 이가이드를봤다고모든선수를MLB로옮기지않는다.
- 공항/이동그림은진출분위기,승격·등록·MLB실제출장의근거가아니다. 확정계약/등록상태는텍스트와receipt가권위다.
- 제안조회후다른진로복귀가능. 오퍼만료·사전조건변경은기존preview재검사후유효대안으로돌아간다. 원래부터오퍼0이면미국카드를아예표시하지않는다.
- 마이너첫시즌내승격/MLB출장이없어도정상경력이다. 같은세계시즌의강화·성장·구종예산은레벨이동으로초기화하지않는다.

## 미지명·탈락 이후

결과E06→현재가능경로목록→대학입학/유효미국제안/독립준비/은퇴중실제자격을가진선택. ‘실패했으니이선수삭제’나‘새로시작해야진행가능’으로몰지않는다. 동시에지명을보장하거나준비예산을리셋하지도않는다. 대학조기미지명은학적유효시복학,4학년이후미지명은졸업후합법경로를66으로검사한다.

## 진행 속도·중단·이어하기

안내를닫거나천천히읽는시간은게임달력을소모하지않는다. 실제ADVANCE는선택구간과기존세계일정만진행한다. 단기/빠른진행은현재계약/등록/부상·필수사건큐를검사하며필수결정에서정지한다. 안내완료횟수로성장3배나일일접속보상을주지않는다.

앱/웹을닫았다돌아오면홈의이어하기하나로현재화면에돌아간다. 안내는닫은선호를따르되미확정진로·계약을완료로추정하지않는다. 마지막으로본가이드장면이아니라서버확정도메인상태가실제재개위치다. 중단원인/복구단계카드는홈에추가하지않는다.

## 시안·서면 사례·구현 인계

[첫 커리어 동선 보드](first-career-board.html)에서공통7장면과KBO/대학/미국/미지명사례를순서대로검토한다. UI밖‘검토용사례’는서버진로를선택하는게임버튼이아니다. 미국카드표시조건도조건충족/능력미달/오퍼0으로대조한다. 시안내이전/다음은장면커서만변경하며난수·기록·저장·오퍼를생성하지않는다.

[구조화 동선](first-career-flow.json)은단계별화면/기존E01~99근거/문안/주행동/주의점을기록한다. 같은99개에새온보딩사건ID를추가하지않는다. 별도실제게임검증은NOT_EXECUTED다. 정적검사는ID/참조/미국경계/고정장면/단계순서만확인한다. 실제첫세이브/서버원자성/경기진행/이어하기·브라우저·APK시험은하지않는다.

117 사용자확정: 커리어홈의기본진행은‘다음주요사건까지’. 1경기/1주일은대안이며필수선택/시즌경계에서정지한다. 116의중반경험·E13명령기반후속도함께적용한다.

---

<!-- SOURCE: 114-FIRST-CLUB-SEASON-OPERATIONS.md -->

# 114. 구단 생성부터 첫 시즌·첫 오프시즌까지

2026-10-19 / 경험 상세 D / DESIGN_ONLY. 기존 [44 경제·AI](44-CLUB-ECONOMY-AI.md), [40 탐색·영입](40-SCOUTING-RECRUITMENT-ODDS.md), [98 구단 경험](98-CLUB-OPERATIONS-IMPORT-EXPERIENCE.md)의 규칙을 한 시즌의 실제 선택 순서로 연결한다. 새 구장/티켓/후원 경제나 멀티플레이를 추가하지 않는다. 실제 앱은 구현하지 않는다.

## 세 가지 시작 사례

| 시작 | 생성 전 설명 | 생성 후 상태 |
|---|---|---|
| 가상 선수만 | 커리어·보관 원본이 없어도 바로 운영 가능 | KBO10팀 중 선택1팀,가상 계약선수50명/1군28명 |
| 보관 선수 사용 | 선택 원본·대체 대상·새19세능력을 비교 | 동일50명 구성 안에서 대체,원본 불변·새 선수ID/기록0/병역 재시작 |
| 숨김 치트 | 기존 이스터에그 해금 뒤 사용자가 직접 선택 | 초기현재능력을스타군단으로바꾸지않고소유선수P100/양의성장·구종XP3배/무제한예산·적격발견/유효영입보장 |

보관 사용은 선택이다. 보관함0명일 때도 첫 행으로 완결된다. 19세 복사본을 넣는 것은 추가51번째 선수 영입이 아니라 기존 생성의 대체 규칙을 따른다. 같은 원본을 같은 세계에서 선수와지도자로동시에쓰지못한다. 다른 원본 선택/보관 사용 안 함으로돌아갈수있으며,막혔다고원본을삭제하거나이미고용된지도자를몰래해임하지않는다.

## 첫 시즌의 16개 운영 장면

| 순서 | 화면 | 먼저 보여줄 정보 | 다음 행동·경계 |
|---|---|---|---|
| B01 모드·구단 | S12 | 실제KBO팀명·로고·가상로스터설명·난이도 | 구단선택. 희망선수커리어생성은필수아님 |
| B02 보관 선택 | S12 | 사용안함/사용,원본·대체선수 | 원본선택/취소만으로세계나새P를생성하지않음 |
| B03 생성 확인 | S12 | 팀·난이도·보관사용수·대체결과·시작정원 |78의동일creationId원자생성. 이미지를못불러와도기본표현으로진행 |
| B04 첫 홈 | S13 | 현재날짜·다음경기·순위미정·가용액·필수할일 | 첫경기전순위/성적을우승전망처럼확정하지않음 |
| B05 선수단 확인 | S14 | 계약50/1군28/투수13·야수15/포수2 | 선수상세·2군후보확인. 종합최고28명자동선택으로포수요건을깨지않음 |
| B06 라인업 | S15 | 타순9·실제수비8자리·선발/불펜·불가사유 | 자동추천은초안,미리보기/적용을구분. 같은선수중복/부상/등록검사 |
| B07 첫 경기 | S13/S19 | 출전가능·명단·진행구간 |1경기/1주일의기존진행. 감상선택이결과를재추첨하지않음 |
| B08 필요 포지션 | S14/S36 | 현재공백·대체깊이·나이·경쟁·당해비용 | 스카우트가필수입장료가아님. 공개FA목록도계속열림 |
| B09 탐색 미리보기 | S36 | 조건·적격미발견수·발견확률·500만원·월잔여 | 조건초안은무료. N0/월0은실행불가·비용0 |
| B10 탐색 결과 | S36 | 실제신규후보수·원장·잔여횟수 | 성공과실패모두정상소모. 통신오류는동일receipt확인 |
| B11 후보 보고서 | S16/S36 | 정확현재6능력·종합·잠재력전망범위·평가일 | 발견과영입가능·선수소유·잠재력확정을구분 |
| B12 영입 제안 | S17 | 연봉·기간·역할·라운드p·예약금/자리·마감 | 아직계약아님. 여러제안이전부성공해도성립하도록예약 |
| B13 라운드 결과 | S17 | 우리팀수락/타팀수락/대기·예약변동 | 계약소유확정과1군등록은별도. 치트도유효조건검사 |
| B14 시즌 운영 | S13/S14/S37 | 부상·포지션·계약만료·일정·원장 |필수결정에서자동진행정지. 안내열람/현실시간으로경기를넘기지않음 |
| B15 정규·PS 회고 | S18/S19/S37 | 확정순위/실제PS자격·기록·지급/채무 | 정규끝을리그전체완료·차년도활성화로앞당기지않음 |
| B16 오프시즌 준비 | S17/S37/S43 | 만료/은퇴/공석·드래프트·협상·직원/시설 | 의무계약/최소정원등을해결한후72의단일연도전환 |

위 장면은 실제 상태 변화에 연결되는 설명 묶음이다. 16개 새 필수 사건/모달을 추가하지 않는다. 구단 진행을위해선수50명의모든상세/안내를열도록강제하지않는다. 관리자가선택을확정하기전임의방출·강제시설구매·기본영입을실행하지않는다.

## 같은 원장으로 이어지는 탐색·제안 예시

초기구단의확정재정이라고주장하지않는 **운영중스냅샷**을98의기존예시에서가져온다. 연간기본120억원,지급연봉40억원,예약연봉50억원,방출보장3억원,기존제안예약5억원,최소보호2억원,지급운영비1.6억원이면가용18.4억원이다. 기존38/98의독립사례와아래연속사례를혼동하지않는다.

| 시점 | 실제 변동 | 가용액 |
|---|---|---|
| A 시작스냅샷 | 기존원장 |18억4000만원 |
| B 탐색1회 | 운영비500만원지급,월2→1 |18억3500만원 |
| C 연봉1억원/1년제안 | 새제안예약1억원,계약선수는아직증가안함 |17억3500만원 |
| D 성공분기 | 새제안예약1억원해제→연봉예약1억원전환 |17억3500만원 그대로 |
| D 실패분기 | 새제안예약1억원해제,선수미영입 |18억3500만원 |

성공과실패는C에서갈라진별도결과다. 한명에게둘다적용하지않는다. 정상탐색실패도B의비용을되돌리지않는다. 네트워크오류를실패로보고새비용을즉시다시청구하지않는다. 치트는화면가용액만‘제한 없음’이며위금액/계약/지급/예약변동은유한정수로보존한다.

발견예시 L2/N20/q1은63%,성공시신규후보최대3명/실패0명이다. 영입예시는점수.60/단독제안/대기weight1의해당라운드수락50%다. **발견63%와영입50%를같은행동의확률처럼묶지않는다.** 후보목록/제안조건/라운드가바뀌면실제preview를다시확인한다. 치트실제p1의숫자배지는숨기고구체보장범위는난이도설명에서확인한다.

## 첫 영입 뒤 등록·기용

계약성공은계약선수총수증가이며,팀정원최대60과예약슬롯을검사한다. 기존50명사례에서유효FA1명을영입하면51명일수있지만,이는생성시보관선수대체와다른상황이다. 1군28명은자동29명이되지않는다. 2군대기또는기존등록선수와승강을확인한다.

라인업/선발기용은현재유효선수만사용한다. 타자9명중같은선수를두타순에넣지않고수비8자리·DH·포수2·1군투수10~15와등록조건을구분한다. 원본에전설적인기록이있어도19세능력절반선수에게주전을자동보장하지않는다.

## 운영 중 막힘을 푸는 일곱 가지 사례

| 상황 | 표시·해결 | 하면 안 되는 처리 |
|---|---|---|
| 포수1명 |2군적격포수→교체전후명단확인→원자등록 |29번째선수를몰래추가/포수요건무시 |
| 부상으로유효타순8명 |건강한적격대체/수비·타순재검사 |부상조회만으로치료완료/즉시출장 |
| 적격N0/새후보0 |조건변경/기존공개FA,탐색비용0 |실패로추첨해500만원차감 |
| 월탐색0회 |다음세계월기회·공개FA안내 |치트라고월2회제한삭제/기기월초리셋 |
| 일반예산/미래보장부족 |제안금액/기간조정·예약/채무확인 |기존보장채무삭제/동일돈중복예약 |
| 영입후1군자리없음 |현재2군·등록교체검토 |계약실패로롤백한척하거나1군자동초과 |
| 필수역할FA0·선수단불능 |44의건강한대체풀/필요최소재건지원확인 |스타무한생성/재정지원으로빚삭제 |

긴급대체는필수공백/최소정원복구를위한기존제도다. 일반영입실패후원하는스타를무료로나오게하는장치가아니다. 복구가능행동을구단홈의할일로노출하지만홈의이어하기는계속버튼하나이며중단원인/복구진척안내를추가하지않는다.

## 치트와 하드의 첫 시즌 설명

- 일반/하드는같은초기예산·현재능력/성장기준이다. 구단하드는상대AI의공백·미래비용·전망활용판단이더정교한기존85를따른다. 커리어하드의NPC성장1.2배/P+5를구단하드로복사하지않는다.
- 치트의P100은내1/2군·부상자·신규영입·보관복사본포함이다. P를높여도현재A와종합은즉시100이되지않고양의자연성장/구종XP에3배를한번적용한다.112의실제경기확률을보장하지않는다.
- 무제한예산이어도실제선수권리·정원·한세계원본중복·월탐색횟수·시설레벨상한을지킨다. 타구단계약선수에불법제안을보내거나지도자를선수로중복생성하지않는다.
- 후보를봤다는이유로P100을적용하지않고실제소유팀변경과같은transaction에서부여한다. 이적이후의성장배율범위는85를그대로따른다.

## 정규시즌 종료·첫 오프시즌

정규144팀경기·리그720경기의실제완료를검사하고PS는자격있는팀만진행한다. 개인/팀의정규·PS기록과확정시즌성장은기존정산시점대로보존한다. 정규끝에선수나이를미리한살더하거나한번더성장시키지않는다.

그뒤계약만료/은퇴·필수슬롯·신인선택·실제FA협상라운드·직원계약/시설투자·차년도보장액을정리한다. 신규신인100명/10팀×10라운드는실제남은선수와순번으로지명하며커리어의지명50%모형을내지명에적용하지않는다. 후원/관중수입·장식보상으로예산을새로추가하지않는다.

새해연간기본예산120억원은잔액이월이아니며미래보장채무·다년계약·직원보장·선수상태는규칙대로계속된다. 연도전환은72의staging검증과단일활성화이며나이·성장·신인·새원장각1회다. 의무작업이남았는데빈모달을닫았다는이유로다음해로넘기지않는다.

## 표현·이어하기·검수 인계

기존 [구단 시안](art-direction-lab.html)의선수단/탐색/영입/예산/보관투입과 [마감 보드](finish-board.html)의라인업·리그·관리를사용한다. 이문서를위해새게임화면이나새아트스타일을추가하지않는다. 그림은선수식별/운영맥락이며예산·계약·전력성공의증거가아니다.

[구조화 운영 동선](club-first-season-flow.json)에16장면/7복구사례/3시작사례/연속원장예시를수록한다. 각항목실행상태는NOT_EXECUTED다. 정적검사는참조/금액/확률범위·카운트/시작선택의독립성만검사한다. 실제팀생성·명단·경기·동시영입·원자성·연도전환·강제종료/복원·브라우저/APK는미실행이다. 다음상세설계후보는첫오프시즌의드래프트·협상마감·계약/병역·로스터작업이겹칠때의운영순서다.

오프시즌운영후속: [115](115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md)의추천순서/실제기한구분·드래프트같은차례복구·FA예약/마감·병역/만료·미래보장108억원예시를함께읽는다. 기존도메인순서·권리·단일연도전환은유지한다.

---

<!-- SOURCE: 115-CLUB-OFFSEASON-DEADLINES-AND-DEPENDENCIES.md -->

# 115. 구단 첫 오프시즌 — 마감·드래프트·계약·병역·등록의 순서

2026-10-19 / 상세 기본안 D / DESIGN_ONLY. [114 첫 시즌](114-FIRST-CLUB-SEASON-OPERATIONS.md)에서 이어진다. [69 세계일 순서](69-EVENT-COLLISIONS-PROVISIONAL-STATE.md), [81 사건 큐](81-EVENT-OCCURRENCE-COLLISION-AUDIT.md), [40 시장 라운드](40-SCOUTING-RECRUITMENT-ODDS.md), [72 연도 전환](72-WORLD-YEAR-TRANSITION.md)의 실제 순서를 바꾸지 않고 구단 운영의 의존성과 문안을 연결한다. 현실 야구의 현행 계약·병역·드래프트 제도 안내가 아니다.

## 1. 순서의 원칙

오프시즌은‘드래프트화면을봤으니FA다음으로이동’하는선형튜토리얼이아니다. **실제 게임 기한 → 69의 같은 세계일 처리 단계 → source sequenceNo → eventId**가우선이다. 화면에먼저열린카드·목록정렬·휴대폰시계·접속시간은권위가아니다.

- 미완료pendingGame은동일경기부터완료한다. 결과가확정되지않은경기를취소하고선수은퇴/방출로없애지않는다.
- 실제마감이없는추천작업은별도로모아미뤄도된다. 시설/직원교체권유를의무로만들어다음시즌을막지않는다.
- active blocking task는한개다. 다른유효작업은큐에남고,앞선필수작업이해결되면원래기한과최신상태로다시노출한다.
- 시스템필수작업때문에해당선택을할수없었던시간을접속지연/사용자방치로처벌하지않는다. 필수선택을열어놓은채자동으로세계일마감을통과하지않는다.
- 누르지않은수락·방출·입대·은퇴를‘계속’버튼하나로묶어자동확정하지않는다. 최종다음시즌확정은이미유효하게끝난작업만검사한다.

## 2. 오프시즌 홈의 할 일

S13에‘지금결정해야할일’한개와‘다음으로예정된일’목록을표시한다. 각카드는대상선수/구단·실제기한·내가해야할행동·정리후돌아갈곳을담는다. 기한없는시설투자를빨간마감으로꾸미지않는다. 없는입대/오퍼/드래프트를체크리스트를채우려고생성하지않는다.

| 작업 묶음 | 선행 조건 | 현재 행동 | 끝났다고 판단하는 근거 |
|---|---|---|---|
| O01 전 시즌 닫기 | 정규/PS/해당국제창과pending경기완료 | 실제결과·기록·성장/노쇠·수상정산확인 | 기존season settlement receipt |
| O02 퇴단·계약·보유권 | 유효은퇴/만료/병역/복귀근거 | 은퇴·보유권·계약정지/잔여의무확인 | 선수별retirement/contract/service receipt |
| O03 필요한 자리 | 현재계약/차년도명단과작업예약 | 필수포지션/35~60정원·다년보장점검 | 최신로스터·예산preview |
| O04 신인 드래프트 | 기존등록/권리·국내후보배치·실제차례 | 남은선수열람→내차례지명/자동선택검토 | 해당draftId/round/pick의receipt |
| O05 재계약·FA | 실제창·라운드·권리/슬롯/예산유효 | 후보별조건/p·예약확인→라운드마감 | negotiationRound receipt·선수별단일계약 |
| O06 보완 운영 | 실제직원/시설작업자격·채무/차년도계획 | 필요한고용/해임/시설선택,안해도유효하면유지 | 기존staff/facility receipt |
| O07 최종 점검 | 앞선실제필수기한·작업완료 | 차년도정원/계약/필수포지션·등록초안확인 | 같은sourceRevision 검증보고서 |
| O08 새 시즌 | 세계필수작업0·게임/정산최종확정 | NEXT_SEASON확정·동일job결과조회 |72의단일활성화/COMPLETED receipt |

이는추천검토순서다. O04보다빨리마감되는O05오퍼가있으면그기한과의존성을따라먼저처리할수있다. 계약만료예정표를열었다고만료시간을앞당기거나선수를FA로풀지않는다. 연말만료를기다려야하는경우현재계약과차년도제안의효력시점을따로표시한다.

## 3. 신인 드래프트의 한 차례

국내기본신인100명·10팀×10라운드·역순의기존규칙을쓴다. 해외직행계약으로국내후보자격이없어진선수는제외하고국내복귀등별도자격출처는중복되지않게추가한다. 같은targetSeason의배치를오프시즌/새해생성에서각각다시만들지않는다.

내차례전에현재잔여후보/다음차례까지남을전망을확인하되정확모형없는잔존확률을숫자로꾸미지않는다. 실제내차례에서남은유효선수를선택하는것에커리어의‘지명확률50%’를적용하지않는다. 치트도이미타팀에지명된선수를내차례에되가져오지못한다.

1. 최신차례/선수권리·미지명상태를재조회한다.
2. 계약선수/지명예약을포함해해당선수를수용할정원과예산검사를한다. 정원60에서61번째선수를임의추가하거나지명을몰래보류하지않고기존25의정리단계로이동한다.
3. 사용자가필요한정리를확정하면같은draftId/같은차례에서계속한다. 미확정차례를지났다고간주해다음라운드로움직이지않는다.
4. 지명receipt를한번확정한다. 계약체결/소유등록효력은실제계약단계를따로기록하고,지명정보만으로실제출장·개인기록을생성하지않는다.
5. 자동선택은합법후보/정원/비용검사를같이한다. 오류가나면사용자선택으로멈추며방출까지자동확정하는권한으로확대하지않는다.

## 4. FA 라운드의 마감과 경합

모든팀의동일라운드제안이있는시장이다. AI조건은라운드시작snapshot에고정하고사용자초안/새로고침을보고재추첨하지않는다. 같은선수자기팀제안은한개이며여러선수제안은모두성공해도유효하도록당해/미래예산과자리를예약한다.

제안마감확정전소속/권리/예산/정원/제안version재검사→바뀌면최신p와비용을보여재확인→유효확정→선수ID순고정추첨→단일계약·나머지예약해제의기존40을따른다. 선수A낙찰후선수B의확률을몰래새로바꾸지않는다. 후보들에따라다른분포를쓰지만모든확률합은선수별1이다.

‘이번라운드수락50%’는해당조건의분포예시이지3라운드최종수락50%가아니다. 매라운드조건/대기/타팀선택이달라질수있으므로1−(1−p)^3을항상최종확률로보이지않는다. 3라운드후미계약은FA유지이며게임을이어가기위한자동수락/자동은퇴가아니다.

마감sequence이전유효수락과마감sequence이후요청을구별한다. 네트워크응답이늦었다는이유로이미커밋된선수를다른팀에다시팔지않는다. 접수시각판정/명령id·receipt계약을따르며클라이언트시각은신뢰하지않는다. 같은라운드‘결과확인’은새추첨버튼이아니다.

## 5. 병역·계약 만료·복귀가 겹칠 때

구단모드의병역알림은선수의확정상태/보유권/예상공백/대체후보를보여준다. 커리어모드주인공의개인입대선택화면을구단선수전원에게복제해의무답변을요구하지않는다. 기존세계의NPC군경력판정과기한은유지하고,구단의사용자행동은유효계약/명단/대체선수관리다. **새개인병역조종기능을이문서에서추가하지않는D경계**다.

- 이미끝난국제개인자격→미확정모집정리→병역기한→계약/해외경로의21순서를따른다. 메달그림/대표명단만으로완료상태를만들지않는다.
- 같은세계일에만료와입대가있으면실제효력순서를확정한후계약을정지할수있는지검사한다. 이미만료된계약을입대정지로되살리지않고,정지된계약을달력상연도말이라는이유로임의파기하지않는다.
- 입대계약은remainingPaidGameDays/보유권/지급·예약으로정리하며매번계약연수+1을가산하지않는다. 방출보장·미지급채무를사라지게하지않는다.
- 복귀선수는원소속2군등현재합법정원으로검토한다. 포수/투수공백은44의대체경로로해결하되자동1군주전이나기존선수삭제는없다.

## 6. 열두 가지 충돌 사례

| ID | 동시에 보이는 상황 | 정상 결과 |
|---|---|---|
| OS01 | 미완료경기와시즌정산 | 같은경기FINAL먼저,그후한번정산 |
| OS02 | 오늘마감FA와내일드래프트 | 오늘유효FA결정/마감후내일차례,화면추천순서는무관 |
| OS03 | 드래프트내차례와계약60명 | 정리단계에서멈춤,허용정리후같은차례재검사 |
| OS04 | 같은선수재계약과포스팅계약 | 권리잠금/첫유효커밋1개,나머지preview충돌·예약해제 |
| OS05 | FA여러명모두성공 | 전부성공가정예약이있어정원/예산유효,추첨후p재계산없음 |
| OS06 | 라운드결과응답유실 | 같은round/receipt조회,재추첨/중복지급0 |
| OS07 | 국제자격과미확정입대 | 개인근거확정후미확정작업대체,이미시작복무는21블록규칙 |
| OS08 | 만료시점이입대정지보다먼저 | 만료효력유지,없는계약의정지·연장없음 |
| OS09 | 복귀선수와1군28명 | 유효2군/등록교체검토,자동29명없음 |
| OS10 | 직원해임과연도전환 | 미지급보장채무보존,가용액부풀림/새해삭제없음 |
| OS11 | 남은필수작업과다음시즌 | NEXT_SEASON job생성0,현재해야할선택으로연결 |
| OS12 | 두기기에서같은다음시즌 | targetSeason당동일job/나이·예산·신인·활성화1회 |

## 7. 미래 예산과 새해의 숫자

일반·하드의미래연도보장액은연간기본예산의90%상한이다. 기본120억원이면108억원이며,정확히108억원은해당검사만통과하고108억1만원은실패한다. 통과했어도당해가용액/정원/권리/기간등다른검사는별도다.

예: 다음해현재보장107억원에2억원추가제안은109억원이므로실패한다. 같은대상의1억원조건으로바꿔108억원이되면그검사는통과하나새preview·확인을거친다. 이미유효하게예약한금액을다른화면이중복사용하지않는다. 치트는예산제약면제지만실제비용/보장원장은유한값으로남는다.

새해기본120억원은전년잔액가산이아니다. 전년가용18억3500만원이남았어도‘138억3500만원기본예산’으로만들지않는다. 계약·미지급보장·staff등기존이월의무는계속유효하며새기본예산에서일관되게계산한다. 전년성장/노쇠는다시지급하지않고나이+1/새시즌사용량·신인/일정은72의고유키로한번만활성화한다.

## 8. 재진입·표현·검증

오프시즌도앱/웹을닫은후홈의이어하기하나로현재합법작업에돌아온다. 큐/명령/연도전환은서버상태로확인하며홈에중단원인/복구단계를새로노출하지않는다. 기존전용작업화면의필요한현재상태·재확인행동은제공한다. 시안을먼저열었다는이유로오프시즌작업을완료처리하지않는다.

새장면/화면/무작위사건을늘리지않고기존S13/S14/S17/S18/S26/S27/S37/S43과작업중인권리/등록내용을사용한다. 파괴적선택은대상/잔여보장/정원영향을구체적으로확인한다. 시설투자·보상외형·기록열람은선택사항이며의무순서를막지않는다.

[구조화 사례](club-offseason-dependencies.json)는8작업묶음/12충돌/미래예산경계를기록한다. 정적검사는참조·중복·의존관계/예시금액/마감순서사례만확인한다. 실제드래프트/라운드/소유권잠금·동시성/연도전환/DB·브라우저/build/APK는미실행이다. 기존298/61/36기대값을실행완료로바꾸지않는다.

## S18 구단 드래프트 하위 화면 연결 D(115)

기존45화면의S18안에구단DRAFT하위화면을연결한다. READ_LEAGUE_RECORDS는QUERY,CLUB_DRAFT_PICK/CLUB_DRAFT_AUTO_PICK은구단모드·현재차례에서만허용하는SAVE_COMMAND다. query는clubDraftState로현재draftId/targetSeason/round/pick/team/잔여후보와version을읽는다. payload={draftId,round,pickNumber,playerId,expectedDraftVersion};자동선택은playerId대신추천snapshot참조를보내서버가유효후보를재검사한다. 외부모드/차례아님/중복후보/정원/예산/preview불일치는거절하며한지명receipt키는saveId+draftId+round+pickNumber다. 기존commandId·expectedRevision·preview계약을같이쓴다. 응답유실은같은receipt확인,오래된차례를새차례로자동승인하지않는다. 후보를열람한것만으로선택/계약/1군등록이변하지않는다.

S18의원래리그/기록탭은읽기전용이고커리어S05의지명결과수락과혼용하지않는다. 46번째게임화면을만들지않았다. 기본목업과마감보드에는읽기용설명배치를추가했지만실제지명버튼/서버는미구현이다.

---

<!-- SOURCE: 116-MIDCAREER-DECISIONS-AND-SETBACKS.md -->

# 116. 커리어 중반 — 경쟁·전환·방출·대표·병역·해외 진로

2026-10-19 / 상세 D. 첫 시작113 이후에 반복되는 의사결정을19/20/21/23/26/41/66/69/81과 연결한다. 필수 선택과 일반 서사·단순 결과 통지를 구분하고, 좋은 선택지를 눌렀다는 이유로 주전/계약/메달을 지급하지 않는다. 메인 그림체는111의 청춘 야구 애니다.

## 공통 화면의 읽기 순서

현재 나이·소속·등록·보직 → 실제 근거 기록/경쟁 상태 → 지금 가능한 선택 → 비용·기간·효과·해당 확률 → 확정이다. 역할 변경 가능 조건과 실제 팀의 자리, 명단 등록과 출장은 서로 다른 항목으로 보여준다. 이름/초상/원본 출처 때문에 선수 AI가 별도 우대하지 않는다.

### 열두 경험 묶음

| ID | 상황·근거 | 설명·선택 | 결과와 다음 합법 행동 |
|---|---|---|---|
| MC01 | 퓨처스의 실제 콜업 E09 | 자리·현재 경쟁·등록 변경을 확인 | 콜업확정/대기. 등록됐어도출장0가능 |
| MC02 | 첫콜업뒤20팀경기 E10 | 역할재평가요청/현재운용유지 | 기존점수로검토,서사대답만으로주전보장없음 |
| MC03 | 타자최근20경기출장비율<40% E12 | 현재포지션유지/가능전환자리계획 | 유효계획만시작. 현재등록포지션즉시변경없음 |
| MC04 | 전환계획24경기근거 E13 | 새자리등록확인/기존자리복귀 | 실제확정이후부터적용,새포지션도기용경쟁 |
| MC05 | RP→SP/CP 공석 E14/15 | SP체력60/CP위기60와실제자리검토 | 자격·최신공석재검사. 요청성공률이라는가짜숫자없음 |
| MC06 | 실제무안타·장타부족·볼넷/실점 E16~20 | 육성4/스타일/휴식의유효행동 | 조언자체능력상승0,변경기회·상한·효력기간유지 |
| MC07 | 실제부상·재활·회복 E21~23 | 남은팀경기·출전금지·대체상태 | 회복은증거로확정,복귀주전/즉시능력복원재추첨없음 |
| MC08 | 계약만료/방출·유효오퍼 | 실제권리·보장액·미계약진로검토 | 계약선택/재도전/허용은퇴. 제안0도66의가능경로 |
| MC09 | 대표초청/미선발 E44/45 | 실제대회·차출허가·참가/사양 | 초청/등록/출장/결과분리.미선발이면현재커리어계속 |
| MC10 | 국제실제출장·혜택 E46~48 | 개인출장근거·최종대회결과·후속의무 | 개인병역자격은21검사,팀메달만으로COMPLETED없음 |
| MC11 | 복무기한/복귀 | 게임기한·유효계약/보유권·프로그램 | 필수계획에서멈춤,복귀는현재소속·명단·유효경로 |
| MC12 | 포스팅/해외FA·국내복귀 | 연차/병역/권리·실제오퍼·마감 | 요청/승인/오퍼/수락/등록/출장을각각기록.실패는원계약보존 |

E10/E12/E14~20 등 일반 선택형 서사는26/81의후보·시즌최대3·쿨다운·체크포인트조건을통과한때만등장한다. 표에있는순서대로전부강제발생시키지않는다. 필수콜업/계약/병역이선택형사건추첨을기다리면안된다.

## 포지션 전환의 의미 기반 연결 D

발견한문서충돌: E12의현재선택지는첫째 START_POSITION_PLAN,둘째 ACK_EVENT인데E13트리거는옛‘E12 B후24경기’로남아있었다. 후속조건을선택지번호가아니라 **START_POSITION_PLAN확정receipt + 같은positionPlanId의24경기완료**로정정한다. 현재자리유지를눌렀다면새plan/E13근거가생기지않는다. 기존E13의ONCE_PER_PLAN과근거키를유지한다.

- 대상은투타/수비합법성·현재선수종류를통과한타자포지션이다. 좌투금지자리나투수/타자상호전환·이도류를추가하지않는다.
- D 진행분모: 계획시작이후건강·유효등록상태의소속팀공식정규경기24개. 벤치도계획훈련가능기간이면포함,부상·일반현역복무·무등록기간은미포함. 시작근거경기를다시1회차로소급하지않는다.
- 관측키는planId+worldGameId다. 이적·승강·연도변경때같은계획진척을보존하되동일경기2회누적은없다. E13을열었다고24를다시더하거나적합도100을지급하지않는다.
- 완료는READY상태이지등록변경성공자체가아니다. 당시최신자리/명단/건강과계획version을확인해 CONFIRM_POSITION 또는 CANCEL_POSITION_PLAN을실행한다. 늦게열어사정이바뀌면새preview와사유를제공한다.
- E13은현재NOTICE후속이며카드를안봤다고성장·전체커리어가영구차단되지않는다. 미확정기간은기존등록자리와유효계획상태를사용한다. 확정후다음경기부터새등록을사용하고과거수비기록/기용을재작성하지않는다.

## 부진과 갈림길의 표현

“당신의선택이틀렸습니다”보다실제근거를보여준다. 예: “최근20타수안타가없습니다”,“지난20팀경기중실제출장이적었습니다”,“현재선발자리가없습니다”. 출장0/AB0을비율0으로허위표시하지않고비교범위·최근경기분모를같이읽게한다.

원하는역할을요청해도현재공석/경쟁/부상/권리조건을검사한다. 현재계획유지에는숨은호감도/기용페널티를추가하지않는다. 스타일과집중변경은이후기간에만적용하고,부진누적을초기화해기록을좋게보이게하지않는다. 개인치트의성장3배/잠재력100은경쟁·경기성공보장이아니다.

## 방출·복무·해외 실패 뒤 복귀

프로방출뒤에대학신입경로를가짜복구선택지로제공하지않는다. 학적/계약경력·나이·준비잔여를66으로검사하고유효오퍼/독립준비/군복무·권리준비/허용은퇴를표시한다. 준비잔여가있어도다음계약보장은없다. 원본보관은프로출장0/미해결병역도그대로보존한다.

대표사양·미선발은현재국내/미국일정으로복귀한다. 대표경기와원소속경기를같은세계일에겹쳐생성하지않는다. 입대기한과대회가겹치면실제개인근거와21/69의순서다. 미래메달가능성으로의무기한을넘겨주지않는다.

포스팅실패/오퍼0은원계약을유지하고같은시즌기회·기한제약을따른다. 해외계약확정전원구단연봉을다시재계약처럼지급하지않는다. 미국첫출장없이돌아와도마이너·미국계약경력은남으며국내복귀는실제보유권/준비프로그램으로이어진다.

## 재개와 인계

기본빠른진행은새사용자결정117을따른다. 각상황의필수선택에서멈추되중단상태카드를홈에새로만들지않고이어하기버튼으로현재합법화면에연결한다. 단순조회/동선가이드열람을사건해결로기록하지않는다.

[구조화 사례](midcareer-experience-cases.json)는12묶음과전환경계사례를수록한다. 카탈로그E13·04/26/EVENT의옛선택지번호표기를함께정정한다. 같은99개사건의의미연결을고친것이지새사건추가가아니다. 실제기용/포지션적응/대회/계약/DB·브라우저·APK는미실행이다.

---

<!-- SOURCE: 117-CAREER-NEXT-MAJOR-EVENT-PROGRESSION.md -->

# 117. 커리어 기본 진행 — 다음 주요 사건까지 빠르게 U

2026-10-19 사용자 확정 U: 커리어 홈의 기본 진행 버튼은 **다음 주요 사건까지 빠르게 진행**. 1경기/1주일도속도메뉴에서선택가능하게한다. 아래의정확한멈춤범위와처리계획은D다. 새난수·성장보너스·자동선택을추가하지않는다.

## 주행동과 속도

S03·S30·S35의커리어주행동은“다음 주요 사건까지”다. 상태별필수작업이있으면그작업을먼저표시하며,이를건너뛰는빠른진행버튼을내지않는다. “1경기”는현재경기FINAL까지,“1주일”은최대7세계일이며둘다필수선택에서일찍멈춘다. 이번U를구단S13의1경기/1주일기본선택에임의적용하지않는다.

처음한번읽을수있는도움말: “일정은 빠르게 진행하고, 중요한 선택과 시즌 정리에서 멈춥니다.” 설명닫기/속도변경은경기를진행하지않고추첨하지않는다. 매번가이드를다시확인하게하지않는다.

## 주요 사건의 기본 분류 D

| 종류 | 기본 동작 | 근거 |
|---|---|---|
| 진로/계약/병역/대표참가·등록등실제필수선택 | 즉시해당합법결정화면에서정지 | 기존blocking task/기한·phase |
| 실제부상·복귀/콜업·승격등경력변경 | 경기FINAL후발생근거를정리하고정지 | injury/registration/event receipt |
| 시즌강화/유형창의최초유효제시 | 해당창에서한번정지,유지/건너뛰기허용 | 실제eligibility+같은시즌/기회key |
| 정규·PS·국제결산/학년·졸업/오프시즌필수정리 | 다음단계로자동수락하지않고정지 | season/competition/academic receipt |
| 희귀이정표·히든특성해금의최초알림 | 결과확정뒤기념카드에서한번정지 | 기존공개허용된milestone/unlock receipt |
| 선택형서사가정상선정됨 | 실제선택이있는카드에서정지 |26/81후보·쿨다운·시즌한도 |
| 일반뉴스·일상기록·단순평가갱신 | 모아읽는요약,각각강제정지하지않음 | 기존읽기통지/개인선호 |

정지는두종류다. **실제blocking task**는도메인선택이필요하고, **표현상정지**는읽기카드일뿐이라같은효과/의무를재발행하지않는다. 기념품·메모·평가열람을필수세계작업으로바꾸지않는다. 표준일반특성매개해금이나매안타뉴스마다멈추지않는다. 미해금히든의근접도/진행을주요사건예고로누출하지않는다.

## 동일 사건에 계속 멈추는 문제 방지

표현정지키=(owner,saveId,sourceReceiptId,presentationKind)이고같은카드를표시/넘긴선호는별도표현revision으로보존한다. 다음진행때같은근거를새사건으로재발행하지않는다. 실제선택이아직미해결이면카드읽음만으로진행허용하지않는다.

강화창을건너뛰었다고시즌사용1회를차감하지않는다. 이미쓴강화기회는리그/팀이동이나빠른진행재개로생기지않는다. 같은세계시즌기회창을다시열수있는권한과‘기본빠른진행이첫제시에서멈추는표현선호’는별개다.

## 진행 계획과 안전한 청크

기존ADVANCE_CAREER 명령에targetMode=NEXT_MAJOR_EVENT|ONE_GAME|ONE_WEEK와stopPolicyVersion을담는설계확장을사용한다. 서버는허용모드/phase/현재미완료명령을검사하고기존expectedRevision/commandId를따른다. 클라이언트가주요사건목록이나새seed를전달해결과를고르지못한다.

한진행계획은현재phase/시즌경계를넘어새계약·진로·다음학년/시즌을자동확정하지않는다. 아직주요사건이없으면현재계획의다음정산/기한/시즌경계가종착점이다. 무한미래·무한동일세계일루프를돌지않는다.

한청크는24의최대1000타석/20이닝등기존엔진상한을따르고,결과와cursor/중단근거를확정한뒤다음청크로이어간다. 주요선택근거가발생한게임일의처리순서는69를그대로따른다. 부상을미리알아서경기중타석을삭제하거나표현카드때문에다른팀의같은날경기를누락하지않는다.

사용자의‘잠깐멈추기’는현재안전청크경계에서정지하고이미확정된경기를취소하지않는다. 화면을닫으면접수된청크는결과확정까지처리할수있지만추가청크를무한예약하지않는다. 남은계획/미확정경기는서버에보존하고다음이어하기에서같은진행을복원한다. 브라우저가닫힌채현실시간만큼시즌이자동으로흘러가는방치형규칙은추가하지않는다.

## 화면·재개

진행중에는중복진행을막고현재시즌/실제완료구간을보여준다. 추정전체퍼센트·보장완료시간을꾸미지않는다. 속도메뉴를읽거나기록조회는허용하되새진행명령동시실행은금지한다. 안전청크외의순간정지/되감기/나쁜결과재추첨은없다.

홈의이어하기는계속버튼하나이며중단원인·복구단계·빠른진행저널을노출하지않는다. 현재필수선택이있으면그화면으로,없고같은진행계획이남았으면그맥락으로연결한다. 명령receipt를모르는상태에서는먼저같은요청결과를확인하고새청크를중복생성하지않는다.

## 설계 검수 항목

FP01 기본NEXT_MAJOR_EVENT/FP02 1경기·1주일도필수선택정지/FP03 같은기념근거중복정지0/FP04 읽음과실제의무해결분리/FP05 강화창스킵기회차감0/FP06 정규종료가새시즌자동확정안함/FP07 부상확정후현재게임일처리보존/FP08 일반뉴스묶음/FP09 화면종료후무한진행없음/FP10 이어하기는같은계획·receipt/FP11 숨은근접도예고0/FP12 요청중복시청크중복0. 전부실제실행은NOT_EXECUTED다.

이문서의원칙을79/113의안내와77의S03/S30/S35바인딩에연결한다. 실제빠른진행엔진·서버·UI타이머/모바일백그라운드작동·강제종료시험은구현후검증한다.

---

<!-- SOURCE: 118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md -->

# 118. 커리어 후반·은퇴 원본·새 선수/지도자로 이어가기

2026-10-19 / 경험 상세 D. 19/32/42/61/63/70의 기존 결정을 한 사람의 마지막 시즌과 다음 플레이 흐름으로 연결한다. 강제감동연출·새경기보상·원본능력수정은추가하지않는다. 주요사건빠른진행도은퇴/보관/구단선택을자동확정하지않는다.

## 후반 커리어의 목표

전성기기록을유지하는것만이성공인것처럼표현하지않는다. 역할축소·리그이동·재활·복무/복귀·미계약기간을실제기록으로남기고,현재갈수있는길을보여준다. 선수의은퇴는개인커리어의종료지만보관/연대기·독립구단플레이로이어질수있다.

## 아홉 장면

| ID | 상태·화면 | 화면 내용 | 다음 행동·경계 |
|---|---|---|---|
| LC01 | 후반시즌 S03/S30 | 현재능력/역할과커리어최고값·리그별기록을구분 | 현재경력진행. 노쇠로최고값을낮추지않음 |
| LC02 | 계약갈림길 S08 | 실제오퍼·기간/역할·권리·대안 | 수락/거절/유효재도전/은퇴검토. 오퍼보장없음 |
| LC03 | 은퇴검토 S06/현재허용phase | 시점·계약정리영향·남길기록·되돌릴수없음 | CONFIRM_RETIRE전취소가능,의무은퇴기한은다음시즌연장불가 |
| LC04 | 은퇴확정후 S09 | 실제최종시즌나이/이유·원본보관결과·기록 | 원본보기/연대기/다른게임. 은퇴다시실행버튼없음 |
| LC05 | 보관목록/상세 S10/S11 | final/능력별peak/리그별통산/출처 | 읽기/새구단에서사용. 기록0도원본보존 |
| LC06 | 새구단시작 S12 | 보관사용안함/선수사용과대체결과 | 기존커리어에서단장으로자동전환하지않음 |
| LC07 | 19세선수선택 S12 | 원본나이→19세,peak50%,새P·병역/기록초기화 | 같은생성확정내새ID. 원본은불변 |
| LC08 | 지도자고용 S43 | 원본/가상직원·등급근거·급여·효과·현재claim | 선수/코치/스카우트중활성역할1개,자동해임/방출없음 |
| LC09 | 새세계의다음이야기 S13 | 현재19세선수또는직원의진짜상태·구단일정 | 소유권·등록·기용/효력일을따라진행 |

## 마지막 경기와 마지막 기록

은퇴검토는서버가허용한경계에서만가능하다. 미완료경기중은퇴확정으로나쁜경기를삭제하지않으며,이미확정된시즌성장/노쇠/수상을두번정산하지않는다. 나이는시즌시작에한번이며‘은퇴보관을열었으니+1’은없다. 게임최대45세/46세일정미생성정책을유지하되모든선수가41세에일괄은퇴하는것은아니다.

마지막예정경기를‘은퇴기념전승리’로새로만들지않는다. 실제출장이없다면그해기록0/출장0을표시한다. 은퇴연출은스킵가능하고스킵해도같은archive/receipt를얻는다. 영상/초상/연대기projection실패는은퇴수치snapshot을무효로하거나원본을두개만드는이유가아니다.

계약/보장액/보유권의정리는해당경력의유효preview와원장을따른다. 구단에서이미발생한방출/직원보장채무를선수은퇴이벤트로삭제하지않는다. 은퇴버튼을누른것만으로아직정리되지않은계약을종료됐다고표시하지않는다.

## 원본의 수치와 기록

archive는최종현재6능력·능력별영구최고값·잠재력서버보존/공개전망·리그별성적·병역·학적·대표·특성/구종·관계/경력출처의불변snapshot이다. 평균종합과실제타율/장타율은112처럼다른축이다. 경기일시버프/피로를영구최고값으로저장하지않는다.

개인보관에는본인커리어의은퇴원본을한번만추가한다. 구단가상선수전원을은퇴때자동개인보관으로늘리지않는다. 상세로그의보존기한이지나도시즌/통산·주요장면원자료와출처를보존하고,재생불가는기록없음과구분한다.

은퇴원본숨김은선택목록의표현선호이며기존구단복사본/직원/claim을삭제하지않는다. 실제삭제·백업복원은70의참조/소유/버전계약과관리확인경로를따른다. 원래세이브가삭제됐다는이유로독립보관원본을다시게임중플레이어로만들지않는다.

## 새 선수·지도자의 선택은 다른 게임

원본을새구단에안넣어도가상선수만으로완결된다. 넣을때peak가[100,100,100,100,100,100]이면현재[50,50,50,50,50,50]/종합50.0이며19세로시작한다. 원본이41세면원본카드에는계속41세,새카드에는19세다. 원본최고92/100/88/86/90/94는46/50/44/43/45/47·종합45.8이다.

새선수는원본메달·병역완료·특성/히든해금·관계·커리어통산·재도전사용량을승계한현재기록으로표시하지않는다. 보존출처와새플레이의기록0을탭으로분리한다. 능력/잠재력100상한과일반·하드공개전망·치트정책을유지한다.

지도자는19세로선수복사하는규칙을적용하지않는다. 61의완료프로등록시즌에따른등급/직무/급여/효력일을사용하고,원본타격능력100을그대로선수단전원에게부여하지않는다. 프로0시즌원본도기본등급정책을검사하고동시에가상직원대안을제공한다.

## 원본 계보·역할 중복

세계W1의원본A→복사선수B→B의은퇴원본B'는각각다른엔티티지만rootSourceArchiveId=A다. W1에서A/그후손을현역선수와코치로동시에배치해중복제한을피하지못한다. 선수B은퇴로활성PLAYER claim이해제된후다음합법직원창에서A계보의지도자고용이가능하다. 고용/생성동시요청은동일root claim의첫유효커밋1개만성공한다.

다른세계W2는별도claim이라같은원본계보를다른역할로사용할수있다. 원본이름이나표시초상이같다는이유만으로다른가상선수를같은사람으로합치지않는다. 복원한새세이브에서는새saveId의claim을재구성하되같은세계내중복금지는유지한다.

## 체크와 후속

LC-D01 은퇴응답유실archive1개/02 연대기표현실패에도snapshot보존/03 원본41·복사19/04 peak100→50/05 본인기록0원본허용/06 가상선수전체개인보관0/07 현역계보와직원동시불가/08 은퇴후claim해제·합법고용/09 다른세계역할분리/10 복사본병역재시작/11 메달·히든·통산출처구분/12 감상스킵효과0. 전부실제실행은NOT_EXECUTED다.

[구조화 경계](latecareer-continuity-cases.json)에장면9개와12개기대값을작성한다. 이문서는118의명령을새로구현하지않고기존은퇴/보관/생성/고용을연결한다. 실제고용claim/은퇴원자성/파일보존·브라우저·DB/build/APK는미검증이다.

---

<!-- SOURCE: 119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md -->

이미지 제작 인계(2026-10-19): 실루엣 14종을 포함한 전체 이미지 제작 목록은 [124](124-IMAGE-PRODUCTION-BRIEF.md)와 image-production-register.json에 있다.

# 119. 선수 표시 정보·투구폼·좌우 상성·실루엣 아트 라이브러리

사용자확정U(2026-10-19):①선수에게 사람 외형은 필요 없다. 필요한 것은 이름, 던지는 손/타석(좌투좌타 등), 투수면 투구 스타일 ②투구폼은 4종(오버핸드·쓰리쿼터·사이드암·언더핸드) ③투구폼과 좌우는 표시 전용이 아니라 특정 구종·상성에 소폭 영향 ④폼당 2구종 소폭 친화 ⑤좌우 상성은 반대손 소폭 ⑥초상은 실루엣 포즈+이름 카드 ⑦NPC는 같은 라이브러리 재사용+팔레트 변형. 이 문서는 [95](95-CHARACTER-EVENT-ART-PRODUCTION.md)의 얼굴·identityFamily·나이대 얼굴 재사용 규칙, [79](79-CREATION-FIELDS-VALIDATION-COPY.md)의 ‘타석은 추가 능력 없음’, [48](48-PITCHES-BATTING-APPROACH.md)·[57](57-REPERTOIRE-DETAILED-CONTRACT.md)의 구종 벡터를 이 범위에서 대체·보강한다. 수치와 분포는 초안D이며 밸런스 실증 전이다.

## 선수 표시 정보 (외형 제거)

| 항목 | 값 | 비고 |
|---|---|---|
|이름|기존 생성 입력|카드 제목|
|던지는 손|R/L|기존 규칙(좌투 C/2B/3B/SS 불가) 유지|
|타석|R/L/S|S는 상대 투수 손의 반대 타석으로 취급|
|투구폼|OVERHAND/THREE_QUARTER/SIDEARM/UNDERHAND|투수만. 타자는 null. 생성 때 선택, 이후 변경 없음|

- 얼굴·헤어·체형·피부 등 사람 외형 선택과 appearance 프리셋(95의 presetId/identityFamilyId/ageBand)은 사용하지 않는다. 외형 필드가 능력·P·시드·관계에 무관하던 원칙은 그대로이며 표시용 값만 남는다.
- appearance 대체 스키마: {silhouetteId,uniformPaletteId,ageLabel,portraitVersion}. ageLabel은 숫자 나이 텍스트이며 나이대에 따라 그림이 변하지 않는다. 복사 19세·원본 41세 모두 같은 실루엣 규칙이고 지도자는 원본 은퇴 나이를 텍스트로 표시한다.
- 원본 복사(반값)는 던지는 손/타석/투구폼을 원본에서 그대로 승계한다(정체성). 구단 가상 선수와 AI는 생성 시 서버 난수로 배정하고 저장한다. 이후 변경하지 않는다.

## 투구폼 × 대표구종 소폭 친화 (D)

대표구종이 아래와 일치할 때만 그 타석 logit에 더한다(숙련 등급 비례 없음, 구종 벡터와 별개). 합산 ±.10 cap 안, 특성 cap과 별도 가산 후 최종 cap.

| 투구폼 | 친화 구종 | 효과 |
|---|---|---|
|오버핸드|포심(P01), 커브(P04)|K +.01 |
|쓰리쿼터|슬라이더(P03), 포심(P01)|K +.01 |
|사이드암|슬라이더(P03), 투심(P02)|OUT +.01 |
|언더핸드|체인지업(P05), 투심(P02)|OUT +.01 |

- 대표구종이 친화 목록 밖이면 보정 0. 구종 구성·숙련·학습 규칙은 바뀌지 않는다.
- AI 투구폼 분포(초안): 오버핸드 45 / 쓰리쿼터 35 / 사이드암 15 / 언더핸드 5(%). 별도 appearance 난수가 아니라 생성 시 정식 세계 생성 스트림의 한 값으로 기록한다.

## 좌우 상성 (D)

| 조건 | 효과 |
|---|---|
|타자 타석이 투수 던지는 손과 반대(양타는 항상 반대로 취급)|타자 1B +.01 |
|타자 타석이 투수 던지는 손과 같음|투수 K +.01 |

- 양타 처리는 사용자확정U(2026-10-19): 일반 타자와 동일하게 항상 반대손 효과를 받는다(절반·중립 안 채택). 현재 D 계수는 +.01이며 계수 승인과 처리 방식 U를 구분한다. 항상 이득이라는 점은 아래 FX03에서 실행으로 확인한다.
- 같은 PA에서 둘 중 정확히 하나만 적용된다. 좌우 상성은 능력치가 아니라 타석 단위 logit이며 추가 영구 능력이 아니다. 특성·구종·성향과 합쳐 ±.10 cap, softmax로 확률합 1.
- 79의 ‘양타: 초기 추가 능력 없음’은 유지된다(생성 시 능력 보너스 없음). 이제 타석은 경기 타석 판정에 쓰이고, 능력 표시와 종합에는 반영되지 않는다.
- 미리보기/도움말에는 정확한 효과 값을 표시한다(75). 확률 배지를 새로 만들지 않는다.

## 실루엣 아트 라이브러리 (1차 제작 범위)

승인 반영(2026-10-20): 실루엣 14종이 assets/silhouettes에 있으며 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim)를 쓴다. 아래 3변수 표기는 초기 초안이다.

- 사람 얼굴 없이 유니폼 실루엣 SVG를 CSS 변수로 색을 입힌다. 팀/리그 팔레트 변형은 이미지 파일을 늘리지 않고 팔레트 값만 바꾼다(NPC·라이벌·동료·감독도 동일 라이브러리).
- 타자: 투타 6조합 포즈(우투우타·우투좌타·우투양타·좌투우타·좌투좌타·좌투양타)를 배트 포즈 실루엣으로 제작.
- 투수: 투구폼 4 × 던지는 손 2 = 8 실루엣. 사용자가 고른 ‘6+6’은 타자 6조합으로 만족하고 투수는 폼 4종 결정으로 8로 확대(요청 변경 사유).
- 총 1차 14개 실루엣(14개 모두 승인·반영). 좌우 단순 반전 금지: 글러브·배트·공 위치를 포즈별로 검수(95 규칙 유지).
- 이름 카드: 이름 · 던지는 손/타석 아이콘 · 투수면 투구폼 라벨 · 나이 텍스트 · 소속 팔레트. 부상/은퇴 상태는 라벨로 구분.
- 기존 청춘 애니 PNG(초상·사건 아틀라스)는 사건 장면·hero용으로 유지하고 ‘선수 초상’ 자리에는 실루엣 카드를 쓴다. 사건 장면의 사람 모습은 선수 본인 외형을 의미하지 않는다는 표시 규칙을 둔다.
- 실제 사진·개인 업로드 없음(95 유지). 실루엣 SVG는 공개 번들 자산이며 개인 업로드와 private 권한이 섞이지 않는다.

## 균형 실험 (구현 후, NOT_EXECUTED)

[73](73-LONG-RUN-FAULT-BALANCE-VALIDATION.md)의 L01~L12 카운트와 별도다. 상한 수치는 설계에서 꾸며 정하지 않고 실행 결과로 결정한다.

| ID | 실험 | 지표 |
|---|---|---|
|FX01|동일 GameInput 10만 타석, 폼 친화·좌우 효과 켬/끔 대조|K/OUT/1B 확률 변화 방향·크기, cap 도달 비율|
|FX02|투타 6조합 × 같은/반대손 장기 시즌|조합별 OPS·K율 격차|
|FX03|양타 대 우타/좌타 같은 능력 장기 시즌|양타 우위 폭(항상 반대손 +.01의 효과)|
|FX04|투구폼 4종 × 구종 구성 장기 시즌|폼별 ERA·K율 격차, 친화 구종 사용 비율|

격차가 크면 새 사용자 결정으로 계수나 양타 규칙을 조정한다.

## 그림 슬롯 전환 (반영)

screen-image-slots.json에서 S02/S11/S16/S22/S43의 imageRole PORTRAIT를 SILHOUETTE_CARD로, 슬롯 참조 almanacPortrait를 silhouetteCard로 바꿨다(S03/S10/S14/S17/S40/S42도 참조 갱신). screen-finish-register.json도 같다. **silhouetteCard는 타자6·투수8, 14개 승인 SVG를 정확한 투타/폼으로 참조한다**. 이니셜은 이미지 로딩 실패 때만 대체한다. 기존 얼굴 PNG는 과거 비교 자산으로 보존하며 승인된 조합의 선수 카드에 사용하지 않는다.

## 영향 범위 (후속 반영 대상)

| 문서/자료 | 변경 |
|---|---|
|79 생성 필드|투수 선택 시 ‘투구폼’ 필드 추가, 타자는 숨김. 검증 문구 ‘투수 폼을 선택해 주세요’|
|41/08 엔진|PA logit에 폼×구종 친화·좌우 상성을 구종/성향/특성 합산 순서 안에 포함|
|48/57 구종|친화 표를 보조 열로 표시, 숙련·학습 규칙 불변|
|75 정확 효과|S39·생성 화면의 도움말에 새 효과 표시|
|95/111 아트|얼굴 프리셋/나이대 얼굴 규칙을 실루엣 규칙으로 대체|
|화면 S02·S39·S42·선수 카드|초상 → 실루엣+이름 카드|
|DB|players.pitchForm enum(투수 NOT NULL, 타자 NULL), appearance 스키마 교체, archive·복사 승계|
|fixture|아래 검수 항목 추가(NOT_IMPLEMENTED)|

## 검수 항목 (초안, NOT_EXECUTED; [player-display-expectations.json](player-display-expectations.json))

PF-D01 오버핸드+포심 K+.01 / 02 오버핸드+슬라이더 보정 0 / 03 사이드+투심 OUT+.01 / 04 우투 vs 좌타 타자 1B+.01 / 05 우투 vs 우타 투수 K+.01 / 06 양타는 항상 반대손 / 07 같은 PA에 좌우 보정은 하나만 / 08 폼+좌우+특성+구종 합이 ±.10 cap에서 원합·적용합 구분 / 09 타자 pitchForm null, 투수 NOT NULL / 10 복사 19세가 손·타석·폼 승계 / 11 좌투 포수 생성 거절 유지 / 12 실루엣 14종 존재와 좌우 반전 금지 / 13 능력 종합에 폼·타석 영향 0 / 14 지도자 카드에 은퇴 나이 텍스트 / 15 NPC가 같은 실루엣+팔레트만 변경.

## 남은 확인

AI 투구폼 분포・친화 표・효과 계수는 D 기본안이며 실제 밸런스 실험은 미실행이다. 관련 41/08/79/48/57/95/111·보드·기대값에는 설계가 반영돼 있다. 기존 1차 SVG 시안은 사용자 판단으로 삭제했다. 2026-10-20부터 시안은 저장소 밖 임시 폴더에서 비교하고 사용자 승인본만 반영한다(124). 14종 구성·좌우 반전 금지·팔레트 변형 규칙은 유지한다.
## 첫 묶음 승인 반영

2026-10-20 사용자 확정: 투수 A·타자 A·로고 2, 배색은 1번 네이비·블루. 승인 SVG 3개와 팔레트 CSS·출처 기록만 반영했다. 실루엣 2/14 완료, 나머지 12개와 앱 아이콘은 별도 묶음 승인 대기. 이미지 레지스터는 92항목 중 TODO61/EXISTS19/CODE_ONLY11/LEGACY_REFERENCE1이다. 게임 규칙·45화면·99이벤트·핵심298 기대값은 불변.

## 두 번째 묶음 승인 반영

사용자가 2차 시안 1~4번(우투좌타·좌투좌타 타자, 좌투 오버핸드·우투 쓰리쿼터 투수)을 모두 승인했다. A 스타일·네이비/블루 배색으로 SVG 4종을 추가했다. 실루엣 6/14 완료, 남은 실루엣 8종은 별도 승인 대기다. 전체 이미지 레지스터 92항목은 TODO57/EXISTS23/CODE_ONLY11/LEGACY_REFERENCE1이다.

## 전체14종 승인 완료

사용자가 남은8종 전체를 승인해 A 스타일·네이비/블루 SVG로 반영했다. 타자6투타조합·투수4폼×2손, 실루엣14/14와 로고2가 모두 승인됐다. 전체 이미지92항목 중 TODO49/EXISTS31/CODE_ONLY11/LEGACY_REFERENCE1. Android/PWA 아이콘2묶음과 P1/P2 이미지는 별도 미완료다.

아래 과거 묶음별 집계는 작성 당시 이력이며 현재는 14종 모두 반영된 상태다.

---

<!-- SOURCE: 120-IMPLEMENTATION-ROADMAP.md -->

# 구현 진행 안내 — 2026-10-21

M2-AF(2026-10-21): 고교 NPC 희소 분포·미국 스카우트 평가65에 이어 미국 오퍼 고정/30게임일 기한·계약/권리/자리·예산 예약, 미국30조직 가상3,420명 초기 생성과 모집 재고를 연결했다. 평균 성장/숨김 P/구 저장값은 유지한다. 공식 미국 메타데이터·재무 공급자/초기 NPC 계약·활성 마이너 등록/경기·세계 작업자·플레이 UI/계정/DB/APK는 후속이다. 관련23/23과19/19, 타입·빌드·정적 검사 및 한계는 [진행](../implementation/PROGRESS.md)·[인계](../implementation/NEXT-SESSION.md)·[M2-AF](../implementation/M2-AF-US-INITIAL-ROSTERS.md)를 따른다. 아래는 이전 이력이다.

---

# 120. 구현 착수 대비 — 모듈 경계·마일스톤·게이트 매핑

2026-10-19. 구현 착수 지시가 아직 없으므로 이 문서는 **착수 시 바로 쓸 순서표**이며 앱·DB·APK는 만들지 않는다. 기본 구조는 [06](06-TECH.md)(React/Vite·Hono·Drizzle·Neon·Capacitor)을 따르고, 순서와 완료 기준은 초안D다. 사용자가 착수를 지시하면 첫 마일스톤부터 시작하고 순서 변경은 새 결정으로 기록한다.

## 모듈 경계 (TypeScript 단일 저장소)

| 패키지 | 책임 | 의존 방향 |
|---|---|---|
|rules|08/41/24 공식·상수·정의 버전(구종·특성·이벤트·119 투구폼/좌우 표)|없음(순수 데이터+순수 함수)|
|engine|applyCommand(state,command,rng,rules), 결정론 PRNG 스트림, 불변조건|rules|
|api|Hono 라우트, 인증, 행 잠금, receipt, 멱등, 오류 코드(64/74/77)|engine, rules, db|
|db|Drizzle 스키마·마이그레이션·테스트 DB 헬퍼|없음|
|web|React/Vite 화면 45개, 화면 상태 카탈로그, 로컬 저널|api 클라이언트 타입|
|android|Capacitor 셸, 로그인 복귀, 파일 공유|web|

규칙: 엔진은 시간·네트워크·Math.random에 접근하지 않는다(06). 화면은 규칙 수치를 복제하지 않고 rules에서 가져온다. 문서 기대값은 엔진 단위 테스트 입력 fixture의 원천이며 전체 묶음 목록은 [expectation-sets-index.json](expectation-sets-index.json)이다(298 핵심과 나머지 묶음은 합산하지 않음).

## 마일스톤 (수직 슬라이스 순서)

| M | 범위 | 완료 기준(증거) | 게이트 |
|---|---|---|---|
|M0|저장소·린트·타입·빌드 골격, rules 패키지에 고정 상수 이식|npm run build, 정적 verify 스크립트 이식|V01|
|M1|경기 엔진(타석 logit→softmax→이닝→경기), 결정론 PRNG, 불변조건|08/24/41 기대값 fixture 전부 통과, 같은 seed 두 번 실행 해시 동일|V05 일부|
|M2|커리어 엔진(생성→고교→드래프트/대학/미국→프로→은퇴), 이벤트 99, 특성·구종·목표·관계 효과|통합경로 24개 fixture 해시, 119 PF-D 검수|V05|
|M3|DB·인증·세이브 명령 파이프라인(행 잠금·receipt·응답유실·2기기 경합)|Neon 개발 브랜치에서 unique/rollback/경합 테스트|V02, V03|
|M4|웹 UI 핵심 화면(홈·생성·시즌 진행·결과)과 이어하기 버튼|45화면 중 핵심 12개 렌더·키보드·한글 입력, 실제 API 연동|V08 일부|
|M5|나머지 화면·확장 UI(100~106 상태)와 접근성·반응형|대표 화면 픽셀/글자 확대/터치 검수|V08|
|M6|구단 모드(보관 투입·시장·구단 AI·경제), 연도 전환|구단 fixture·장기 시뮬레이션 12계획 실행|V09|
|M7|파일(PNG/JSON 내보내기)·중계·연대기·백업 복원|V04, 76 중단 재개, hash 검수|V04, V06|
|M8|Android APK·로그인 복귀·업데이트·실기기|서명 release APK 설치·복귀·업데이트|V07, V10|
|M9|운영·배포·롤백·자산 권리 확인|배포 리허설, 출처 기록|V11, V12|

## 순서 근거

- 엔진을 UI보다 먼저 두는 이유: 설계의 위험(확률 정합·XP 예산·cap·불변조건)이 모두 엔진에 있고, UI 변경은 엔진 결과를 바꾸지 않기 때문이다.
- DB·인증(M3)을 엔진 직후에 두는 이유: 응답유실·중복·경합(74/76)이 UI 흐름의 전제이기 때문이다.
- 장기 균형(M6의 12계획)은 구단 모드가 있어야 의미가 있으므로 구단 구현 뒤에 실행한다. 균형 수치는 D이며 실행 결과에 따라 새 결정 후 조정한다.

## 마일스톤 공통 규칙

- 각 마일스톤은 해당 문서의 기대값을 자동 테스트로 옮기고 통과 수를 기록한다. 정적 설계 PASS를 구현 PASS로 합치지 않는다.
- 실행 결과가 설계와 다르면 설계 문서를 먼저 갱신하고(91 색인·STATUS 포함) 코드를 바꾼다.
- 새 사용자 요구는 [14](14-CANONICAL-DECISIONS.md)에 기록한 뒤 해당 마일스톤 범위에 편입한다.
- 구현 중 알게 된 실제 환경 수치(SDK 버전·비용·도메인)는 92의 V 게이트 결과에 기록하며 설계 문서에 꾸며 쓰지 않는다.

## 착수 전 사용자 확인 항목 (질문 목록)

착수 지시와 함께 다음만 필요하다. 이미 정한 설계 질문은 반복하지 않는다.
1. 호스트·도메인·예산 한도(V11).
2. 기존 Neon 프로젝트 사용 권한과 인증 사용 가능 여부 확인(V02).
3. Android 서명 키 보관 방식(V10).
4. 첫 마일스톤 시작 승인(M0).

## 남은 확인

순서와 완료 기준은 초안이다. 실제 개발 환경(Node/SDK 버전)·팀 규모·일정은 정해지지 않았다. 구현은 시작하지 않았다.

---

<!-- SOURCE: 121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md -->

# 121. 던지는 손·타석 생성 분포와 좌우 분리 기록

사용자확정U(2026-10-19):①생성 선수의 던지는 손은 우투 85/좌투 15 ②타석은 우투 선수 우타80/좌타12/양타8, 좌투 선수 좌타70/우타25/양타5 ③좌우 분리 기록(시즌·커리어 타자 vs 좌/우투수, 투수 vs 좌/우타)을 넣는다. [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 좌우 상성(반대손 1B+.01, 같은 손 K+.01, 양타는 항상 반대손)이 실제로 쓰이는 전제와 확인 수단이다. 세부 생성 순서·화면 배치는 초안D.

## 생성 분포 (플레이어 생성은 제외)

적용 대상: 드래프트 풀, 고교·대학 선수, 라이벌/동료(51/60의 기존 고교 명단에서 선택; 후보0이면 추가 생성 없음), 구단 가상 선수, 국내·미국 AI 선수. 주인공은 사용자가 79에서 직접 고르므로 분포를 적용하지 않는다.

| 던지는 손 | 비율 | 타석 분포 |
|---|---|---|
|우투|85%|우타 80 / 좌타 12 / 양타 8 |
|좌투|15%|좌타 70 / 우타 25 / 양타 5 |

- 투구폼은 119의 분포(오버 45/쓰리쿼터 35/사이드 15/언더 5)를 던지는 손과 독립으로 배정한다. 투수에게만 적용한다.
- 좌투 제한(79): C/2B/3B/SS는 좌투로 생성하지 않는다. 포지션이 먼저 정해진 야수는 제한 포지션이면 우투 고정, 나머지 포지션은 좌투 확률을 보정해 전체 좌투 비율이 15% 근처가 되게 한다. 보정식(초안): pL = 0.15 / (1 − f), f는 해당 생성 묶음에서 제한 포지션(C/2B/3B/SS)이 차지하는 야수 비율. 투수는 보정 없이 pL=.15. 표본이 작은 소규모 묶음의 실제 비율은 흔들릴 수 있으며 비율은 모집단 기준이다.
- 난수: 손·타석·폼은 생성 묶음의 정식 세계 생성 난수 스트림 하나(`handedness`)에서 playerId 정렬 순으로 뽑아 선수 행에 영구 저장한다(119). 이후 변경하지 않으며 외형 난수와 분리하지 않는다. 같은 seed·같은 입력이면 같은 값이다.
- 기존 선수(archive 복사, 가져오기, 원본 보관)는 저장된 손·타석·폼을 그대로 승계한다. 라이벌 후보를 기존 선수에서 고를 때 손·타석은 후보 필터가 아니다(60).
- 무작위가 전혀 없는 입력 fixture에서는 손·타석을 명시 입력한다.

## 좌우 분리 기록

화면: 기록은 새 화면 없이 S16 선수상세의 기록 영역에 ‘좌우 분리’ 하위 탭으로 둔다(45화면 유지). 선수 종류에 따라 한 가지만 보인다.

| 선수 | 행 | 열 |
|---|---|---|
|타자|vs 좌투수 / vs 우투수|PA·AB·H·2B·3B·HR·BB·K·AVG·OBP·SLG·OPS |
|투수|vs 좌타 / vs 우타|BF·outs·H·HR·BB·K·피AVG·피OPS |

- 범위(scope): 기존 기록과 같은 키(worldSeasonId, leagueId, competitionPhase). 시즌 탭과 커리어 탭(같은 리그/레벨 합산이며 국내·미국·국제·PS를 섞지 않음, 24/60)을 둔다.
- 분류 기준은 경기 당시 snapshot의 투수 던지는 손과 타자 타석이다. 양타 타자는 상대 투수 손의 반대 타석으로 분류하므로 투수 입장에서는 ‘우투 vs 양타’가 좌타 행으로, ‘좌투 vs 양타’가 우타 행으로 집계된다.
- 집계 규칙은 60과 동일: BB/HBP는 PA1/AB0, 안타는 AB1/H1, RBI는 합법 득점만. AB가 0이면 비율은 ‘-’로 표시하고 0.000으로 쓰지 않는다. 표본이 작을 때의 경고 배지나 ‘상성 유리’ 같은 판정 문구는 없다.
- 이 표는 능력치가 아니라 119의 좌우 상성 효과를 확인하기 위한 읽기 전용 집계다. 효과의 정확한 값은 75의 도움말에 표시하고 확률 배지는 만들지 않는다. 기록 열람은 난수·save revision·능력에 영향이 없다.
- 데이터: split_stat_summaries(playerId, scopeKey, vsHand, stats, aggregateVersion) UNIQUE(playerId, scopeKey, vsHand). playRecord(62)의 batterId/pitcherId와 경기 시점 hand snapshot에서 읽기 모형으로 만들고, 기록 정정 시 이전 기여를 취소하고 새 기여로 원자 교체한다(60). archive에는 최종 요약과 hand snapshot을 보존한다.
- API: GET /api/saves/{saveId}/players/{playerId}/split-records?scope=… → {kind, rows:[{vsHand, stats}], aggregateVersion}. 없는 기록은 빈 행이 아니라 ‘기록 없음’ 상태. 조회 장애와 기록 없음은 구분한다.

## 화면 상태

| ID | 상태 |
|---|---|
|SP0|로딩/실패(실패는 0기록으로 취급 금지)|
|SP1|기록 있음 2행 표|
|SP2|한쪽 행 AB0(해당 행 ‘-’)|
|SP3|기록 없음|
|SP4|정정 후 갱신(최신 aggregateVersion)|

## 검수 항목 (초안, NOT_EXECUTED)

GN-D01 손 비율 대량 생성 우투85±허용오차/02 우투 타석 80/12/8, 좌투 70/25/5/03 C·2B·3B·SS 좌투 0/04 좌투 보정 pL와 전체 15% 근접/05 같은 seed 같은 손·타석·폼/06 복사 선수 승계/07 주인공은 분포 비적용/SP-D01 타자 vs 좌우 행 분리/02 양타 분류(우투 상대 → vs 우투, 좌투 상대 → vs 좌투 기록은 타자 입장 그대로)/03 투수 쪽 양타는 반대 행/04 BB는 PA1 AB0/05 AB0은 ‘-’/06 정정 원자 교체/07 열람 난수 0/08 국내·미국 합산 없음.

## 남은 확인

허용오차·소표본 분포 검증 방식은 구현 후 FX 실험(119)에서 정한다. 손·타석·폼 설계와 좌우 기록 조회 계약은 관련 원문·122 API·보드 S02/S16·검수 기대값에 반영했다. 구현·화면 렌더와 생성 분포 실험은 미실행이다.

---

<!-- SOURCE: 122-API-SCHEMA-LOG-ALIGNMENT.md -->

# 122. 투구폼·좌우 분리 기록의 API·스키마·로그 정합

사용자확정U(2026-10-19): 구버전 클라이언트가 투구폼 없이 투수를 생성하면 **거절하고 업데이트를 안내**한다(추천안). 이 문서는 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)·[121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md)이 만든 새 필드·조회가 기존 API·로그·DB·화면 바인딩과 어긋나지 않게 맞춘다. 구현·실행은 하지 않았다.

## 1. 생성 요청 (78/79/88)

- 생성 payload에 `pitchForm`(OVERHAND|THREE_QUARTER|SIDEARM|UNDERHAND)을 추가하고 `creationSchemaVersion`을 한 단계 올린다. 타자 payload에는 `pitchForm`을 보내지 않으며 보내면 422 INVALID_FIELD.
- 투수 payload에 `pitchForm`이 없으면 서버는 임의 값을 채우지 않고 422 `CLIENT_UPDATE_REQUIRED`(요청의 clientContractVersion이 새 필수 버전 미만일 때) 또는 422 `INVALID_PITCH_FORM`(버전은 맞지만 값이 없거나 잘못됨)으로 거절한다. 거절은 생성 job·saveId 예약·난수를 소비하지 않는다.
- 클라이언트 정책(88): 이 변경과 함께 `minWriteClientContractVersion`을 올려 구버전은 쓰기 전에 REQUIRED_FOR_WRITE로 안내된다. 조회·receipt/job 확인은 허용한다. 이미 접수된 같은 creationId 재전송은 접수 당시 payload 해시로 처리하며(78) 새 필드 때문에 기존 job을 무효화하지 않는다.
- 입력 초안: 로컬 초안은 schemaVersion을 포함하며(88) 구버전 초안에 pitchForm이 없으면 투수 유형 선택 후 ‘투구 폼을 선택해 주세요’ 오류로 입력을 보존한다.

## 2. 경기 로그 (62)

playRecord의 logSchemaVersion을 1→2로 올리고 PA 판정에 필요한 손 snapshot을 추가한다.

| 필드 | 의미 |
|---|---|
|batterBatsAtTime|경기 시점 타자 타석 R/L/S|
|effectiveBatSide|투수 손 기준 실제 판정 타석 R/L(양타는 반대)|
|pitcherThrowsAtTime|경기 시점 투수 던지는 손 R/L|
|pitcherFormAtTime|경기 시점 투구폼|

- 손·타석·폼은 생성 후 변하지 않지만(119) 정정·복사·원본 보관과 무관하게 로그가 자기완결되도록 snapshot으로 저장한다. v1 로그는 읽기 호환만 유지하며 split 집계에는 선수 행의 손 정보로 보강하지 않는다(해당 PA는 ‘분류 불가’로 집계 제외, 총합 불일치 경고).
- resultHash 입력(62)에는 위 필드가 포함되므로 logSchemaVersion 2 이후 경기는 해시 규칙이 달라진다. 이전 경기 hash는 불변이다.

## 3. DB (06)

| 변경 | 내용 |
|---|---|
|players|`pitch_form` enum NULL 허용(투수 NOT NULL 제약은 kind=PITCHER CHECK), `throws`·`bats`는 기존|
|split_stat_summaries|playerId, scopeKey, vsHand(L/R), stats JSONB, aggregateVersion. UNIQUE(playerId,scopeKey,vsHand)|
|archive 요소|throws/bats/pitch_form과 최종 split 요약 보존(70)|

## 4. 화면·바인딩 (77/17/screen-state-catalog)

- S16 선수상세의 쿼리 바인딩에 `READ_PLAYER_SPLIT_RECORDS`를 추가했다(screen-action-bindings.json, 화면 45행 유지). 조회 API는 121의 GET split-records.
- S02 생성 행(17/catalog)의 입력에 ‘투구폼(투수)’ 필드를 반영했다.
- 읽기 전용 조회이며 난수·save revision을 바꾸지 않는다.

## 검수 항목 (초안, NOT_EXECUTED)

API-D01 투수 payload에 pitchForm 없음 → 422, job·saveId 0/02 타자 payload에 pitchForm → 422/03 구버전 클라이언트 쓰기 전 업데이트 안내/04 같은 creationId 재전송은 접수 payload 해시로 처리/05 logSchemaVersion 2 playRecord에 손·폼 snapshot/06 v1 로그 PA는 split 분류 불가로 제외/07 resultHash는 새 필드 포함/08 players CHECK(투수 pitch_form NOT NULL)/09 archive가 손·폼 보존/10 split-records 조회 난수 0.

---

<!-- SOURCE: 123-EFFECT-SUM-EXAMPLES.md -->

# 123. 투구폼·좌우 보정 합산 정적 산술 예제

[119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)의 투구폼×구종 친화(±.01)와 좌우 상성(±.01)이 특성·구종·성향과 합쳐지는 순서를 숫자로 고정한다. 순서: ①특성 logit 합을 outcome별로 [-.06,.06] cap ②구종(×숙련/5)·성향·폼 친화·좌우 보정을 더함 ③최종 [-.10,.10] cap ④08의 base logit(모두 50·무주자 base 확률)에 더해 softmax. 값은 [effect-sum-examples.json](effect-sum-examples.json)에 있고 verify-design.mjs가 재계산해 대조한다. 실제 경기·시즌 결과가 아니라 산식 확인용이다.

기준 확률(08): BB .085 / HBP .010 / K .200 / 1B .160 / 2B .045 / 3B .005 / HR .030 / OUT .465.

|ID|시나리오|원합(상한 전)|적용합|결과 확률(4자리)|비고|
|---|---|---|---|---|---|
|X01|우투 오버핸드 포심(숙련5) vs 좌타|K +0.04 / 1B +0.01 / HR +0.02|K +0.04 / 1B +0.01 / HR +0.02|K 0.206 / 1B 0.1599 / HR 0.0303 / OUT 0.4602|-|
|X02|우투 오버핸드 포심(숙련5) vs 우타(같은 손)|K +0.05 / HR +0.02|K +0.05 / HR +0.02|K 0.208 / 1B 0.1583 / HR 0.0303 / OUT 0.46|-|
|X03|우투 쓰리쿼터 슬라이더(숙련3) vs 양타(반대 처리)|BB +0.012 / K +0.034 / 1B +0.004|BB +0.012 / K +0.034 / 1B +0.004|K 0.2052 / 1B 0.1593 / HR 0.0297 / OUT 0.461|-|
|X04|만루 9회 리드, T11+T12 상한 도달(우투 쓰리쿼터 슬라이더 숙련5, 같은 손)|BB -0.01 / K +0.12 / 1B -0.01 / HR -0.02 / OUT +0.03|BB -0.01 / K +0.1 / 1B -0.01 / HR -0.02 / OUT +0.03|K 0.2141 / 1B 0.1535 / HR 0.0285 / OUT 0.4642|상한 도달: K|
|X05|히든 T13 좌타 vs 우투(반대 손)|K -0.03 / 1B +0.06 / 2B +0.04|K -0.03 / 1B +0.06 / 2B +0.04|K 0.193 / 1B 0.1689 / HR 0.0298 / OUT 0.4623|-|
|X06|우투 사이드암 투심(숙련4) vs 우타(같은 손)|K +0.002 / HR -0.016 / OUT +0.034|K +0.002 / HR -0.016 / OUT +0.034|K 0.1972 / 1B 0.1575 / HR 0.0291 / OUT 0.4735|-|
|X07|우투 오버핸드 슬라이더(숙련5, 친화 아님) vs 좌타|BB +0.02 / K +0.04|BB +0.02 / K +0.04|K 0.2061 / 1B 0.1584 / HR 0.0297 / OUT 0.4605|-|

## 읽는 법

- 원합과 적용합이 다르면 상세 도움말에 둘을 모두 보여 준다(56/75). 예제 X04는 K의 원합 .12가 최종 상한 .10으로 줄어든다.
- X07은 슬라이더가 오버핸드 친화 목록(포심·커브)에 없어 폼 보정이 0이다. 좌우 1B +.01과 구종의 1B -.01이 상쇄되어 1B 보정은 0이다.
- X03은 양타가 우투 상대에서 반대 타석(좌)으로 취급되어 1B +.01을 받는다.
- 이 예제는 밸런스 실증이 아니다. 격차·상한 조정은 119의 FX01~FX04 실행 후 새 결정으로 한다. 기존 [112](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md)의 극단 비율(AVG .265 등)은 폼·좌우 보정 0 기준이며 새 보정이 반영되지 않았다.

## 검수 항목 (초안, NOT_EXECUTED)

ES-D01 X01~X07 적용합 재계산 일치/02 확률합 1/03 X04 K 원합 .12→.10/04 특성합 .08→.06 선행 cap/05 양타 반대손 처리(X03)/06 친화 밖 구종은 폼 0(X07)/07 같은 손 투수 K+.01(X02, X06)/08 보정 0이어도 확률합 1.

---

<!-- SOURCE: 124-IMAGE-PRODUCTION-BRIEF.md -->

# 124. 이미지 제작 명세 — 다른 곳에서 바로 만들 수 있는 목록

2026-10-19. 이 문서와 [image-production-register.json](image-production-register.json)은 앱에 필요한 **모든 이미지**를 한 곳에 모은 제작 인계표다. 시안은 저장소 밖 임시 폴더에서 제작하고, 사용자가 선택한 승인본만 이 저장소에 반영한다(2026-10-20 후속 결정). 제작한 파일을 넣고 레지스터의 status를 바꾸는 절차는 아래 ‘제작 후 반영’을 따른다. 실제 렌더·접근성 검수와 사용자 승인은 제작 후 별도다.

## 한눈에 보기

- 레지스터 항목 92개: 제작 필요(TODO) 0개, 이미 있음 80개, 코드로 만들면 되는 것(이미지 불필요) 11개, 보존 1개.
- 우선순위: P0 미제작 0개, 승인 반영 17개(실루엣 14 + 로고 마크 1 + 아이콘 2묶음), P1 미제작 0개, P2 미제작 0개. P0는 앱을 처음 띄울 때 필요한 것이고 P1은 해당 기능 화면, P2는 선택이다.
- 코드로 만드는 것(CODE_ONLY: 마이너·고교·국가 배지, 특성·구종·성향·폼·투타·목표 아이콘, 수비 다이어그램, 칭호)은 이미지 생성이 필요 없다.

## 공통 제작 규칙

1. **그림체**: 일러스트(PNG)는 [111](111-ANIMATION-MAIN-ART-DIRECTION.md)의 청춘 야구 애니. 기존 활성 파일(hero-animation-v1, career-events-animation-v1/extra-v1, graduation-animation-day-v1)과 같은 선·색감으로 맞춘다. 프롬프트·원본 경로 기록은 assets/art-lab의 *-GENERATION.json 형식을 따라 새 JSON으로 남긴다.
2. **시간대**: 훈련은 맑은 아침, 학교·이동은 낮, 협상·운영·재활·은퇴는 중성 창빛, 라이벌 야간 경기는 푸른 하늘+흰 조명. 자동 석양·전체 오렌지 광은 쓰지 않는다.
3. **글자·로고 금지**: 이미지 안에 글자, 숫자, 실제 구단·대회·국가 로고를 그리지 않는다(모자 문양 포함). 모든 텍스트는 코드가 렌더한다. 실제 선수 얼굴·사진 금지.
4. **선수 표현**: 선수 카드의 사람 표현은 사람 외형이 아니라 실루엣+이름 카드([119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)). 사건 장면 속 인물은 선수 본인의 외형 확정이 아니다.
5. **결과 누설 금지**: 이미지로 계약·메달·선발 결과를 미리 알리지 않는다. 메달·승리 그림은 확정 근거가 있을 때만 표시되며 평소엔 중립 그림을 쓴다([95](95-CHARACTER-EVENT-ART-PRODUCTION.md)).
6. **실루엣**: 좌우 단순 반전 금지(글러브·배트·공 위치가 틀어진다). 색은 CSS 변수로만 받는다.
7. **형식**: 일러스트 PNG는 원본을 보존하고 -v1, -v2 식으로 새 파일로 추가한다. 아이콘·배지·실루엣은 SVG(script·foreignObject·image·text 금지, title 포함). 1536×1024 아틀라스는 정사각 패널 3×2, 세로형 카드는 1080×1350.
8. **접근성**: 모든 이미지는 장식이거나 대체 텍스트를 가진다. 이미지만으로 정보를 전달하지 않는다.
9. **저작권·출처**: 만든 방법·도구·프롬프트·생성일을 기록하고, 외부 소재는 쓰지 않는다. 공개 배포 권리 확인은 [92](92-DESIGN-CLOSURE-HANDOFF.md)의 V12.

## 폴더 계획

assets/silhouettes/(SVG 14), assets/badges/(대학 9·군 체육팀 1), assets/rewards/(프레임 3·배경 3·스탬프 13·표지 1), assets/medals/(메달 3·대회 엠블럼 4), assets/cards/(카드 테마 3), assets/brand/(로고·앱 아이콘), assets/art-lab/(청춘 애니 일러스트 PNG).

## 이미지 목록

### G1 선수 실루엣(SVG)

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-SIL-H-RR|타자 우투우타 실루엣|assets/silhouettes/hitter-RR.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|우투 선수의 우타석. 배트는 정면 기준 왼쪽 어깨 위, 글러브는 정면 기준 오른쪽 허리|
|IMG-SIL-H-RL|타자 우투좌타 실루엣|assets/silhouettes/hitter-RL.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|좌타석. 배트는 정면 기준 오른쪽 어깨 위, 글러브는 정면 기준 오른쪽 허리|
|IMG-SIL-H-RS|타자 우투양타 실루엣|assets/silhouettes/hitter-RS.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|양타. 두 배트 포즈를 겹쳐 한쪽은 옅게, 글러브는 정면 기준 오른쪽 허리|
|IMG-SIL-H-LR|타자 좌투우타 실루엣|assets/silhouettes/hitter-LR.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|우타석, 글러브는 정면 기준 왼쪽 허리|
|IMG-SIL-H-LL|타자 좌투좌타 실루엣|assets/silhouettes/hitter-LL.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|좌타석, 글러브는 정면 기준 왼쪽 허리|
|IMG-SIL-H-LS|타자 좌투양타 실루엣|assets/silhouettes/hitter-LS.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|양타, 글러브는 정면 기준 왼쪽 허리|
|IMG-SIL-P-R-OVERHAND|투수 우투 오버핸드 실루엣|assets/silhouettes/pitcher-R-overhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔이 머리 위로 수직. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-R-THREEQUARTER|투수 우투 쓰리쿼터 실루엣|assets/silhouettes/pitcher-R-threequarter.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 45도 위. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-R-SIDEARM|투수 우투 사이드암 실루엣|assets/silhouettes/pitcher-R-sidearm.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 수평. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-R-UNDERHAND|투수 우투 언더핸드 실루엣|assets/silhouettes/pitcher-R-underhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 낮게 아래로. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-OVERHAND|투수 좌투 오버핸드 실루엣|assets/silhouettes/pitcher-L-overhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔이 머리 위로 수직. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-THREEQUARTER|투수 좌투 쓰리쿼터 실루엣|assets/silhouettes/pitcher-L-threequarter.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 45도 위. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-SIDEARM|투수 좌투 사이드암 실루엣|assets/silhouettes/pitcher-L-sidearm.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 수평. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-UNDERHAND|투수 좌투 언더핸드 실루엣|assets/silhouettes/pitcher-L-underhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수 5개(--sil-ink/--sil-uniform/--sil-accent/--sil-skin/--sil-trim, 승인본 기준)|있음|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 낮게 아래로. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|

### G2 사건 장면 12(청춘 애니)

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-SCN-TRAINING|사건 장면 새로운 시즌|assets/art-lab/career-events-animation-navy-v2.png|정사각 패널, 열0/행0, 3×2 아틀라스 1536×1024|있음|S04, S07, S24, S25, S27, S28|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E01/E08/E41|
|IMG-SCN-COLLEGE|사건 장면 대학 진학|assets/art-lab/career-events-animation-navy-v2.png|정사각 패널, 열1/행0, 3×2 아틀라스 1536×1024|있음|S28, S34, S35|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E70/E71/E73/E75|
|IMG-SCN-OVERSEAS|사건 장면 미국으로|assets/art-lab/career-events-animation-navy-v2.png|정사각 패널, 열2/행0, 3×2 아틀라스 1536×1024|있음|S28, S29, S30, S33|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E57/E58|
|IMG-SCN-INTERNATIONAL|사건 장면 국제무대|assets/art-lab/career-events-animation-navy-v2.png|정사각 패널, 열0/행1, 3×2 아틀라스 1536×1024|있음|S07, S25, S45|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E47/E48|
|IMG-SCN-RETIREMENT|사건 장면 마지막 유니폼|assets/art-lab/career-events-animation-navy-v2.png|정사각 패널, 열1/행1, 3×2 아틀라스 1536×1024|있음|S09, S11, S12, S45|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E37/E69/E99|
|IMG-SCN-FRONTOFFICE|사건 장면 구단의 내일|assets/art-lab/career-events-animation-navy-v2.png|정사각 패널, 열2/행1, 3×2 아틀라스 1536×1024|있음|S12, S13, S17, S36|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E38/E39/E40/E77/E79/E81|
|IMG-SCN-DRAFT|사건 장면 지명을 기다리며|assets/art-lab/career-events-animation-extra-navy-v2.png|정사각 패널, 열0/행0, 3×2 아틀라스 1536×1024|있음|S05, S28|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E04/E05/E06|
|IMG-SCN-ENHANCEMENT|사건 장면 한 번의 특별훈련|assets/art-lab/career-events-animation-extra-navy-v2.png|정사각 패널, 열1/행0, 3×2 아틀라스 1536×1024|있음|S23|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E43|
|IMG-SCN-REHAB|사건 장면 다시 뛰는 준비|assets/art-lab/career-events-animation-extra-navy-v2.png|정사각 패널, 열2/행0, 3×2 아틀라스 1536×1024|있음|-|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E21/E22/E23|
|IMG-SCN-SERVICE|사건 장면 돌아오는 길|assets/art-lab/career-events-animation-extra-navy-v2.png|정사각 패널, 열0/행1, 3×2 아틀라스 1536×1024|있음|S27, S33|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E53/E76|
|IMG-SCN-POSTING|사건 장면 다음 리그의 제안|assets/art-lab/career-events-animation-extra-navy-v2.png|정사각 패널, 열1/행1, 3×2 아틀라스 1536×1024|있음|S08, S31, S32, S41|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E62/E63/E64|
|IMG-SCN-RIVAL|사건 장면 같은 출발선|assets/art-lab/career-events-animation-extra-navy-v2.png|정사각 패널, 열2/행1, 3×2 아틀라스 1536×1024|있음|S42, S45|청춘 애니, 시간대 NIGHT_WHITE_FLOODLIGHTS, 이벤트 E26/E94/E95/E96|

### G3 마감 장면 6컷

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-FIN-COLLEGE|마감 장면 대학(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|있음|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 대학 캠퍼스 그라운드. 시간대 규칙 준수|
|IMG-FIN-MINOR-AWAY|마감 장면 마이너 원정(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|있음|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 마이너 원정 이동/구장. 시간대 규칙 준수|
|IMG-FIN-RIVAL-NEUTRAL|마감 장면 중립 라이벌(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|있음|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 중립 구장에서 마주 선 두 선수. 시간대 규칙 준수|
|IMG-FIN-RETURN|마감 장면 복귀(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|있음|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 귀국/복귀 장면. 시간대 규칙 준수|
|IMG-FIN-RETIRE|마감 장면 은퇴(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|있음|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 은퇴 기념 장면. 시간대 규칙 준수|
|IMG-FIN-STADIUM|마감 장면 구장(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|있음|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 구장 전경. 시간대 규칙 준수|

### G4 Hero·졸업 장면

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-HERO-MAIN|메인 hero 배경|assets/art-lab/hero-animation-navy-v2.png|1672×941|있음|S01, S03, S19, S30|청춘 애니 활성. 시간대 변형은 선택(P2)|
|IMG-HERO-GRAD|고교 졸업 가로 장면|assets/art-lab/graduation-animation-day-navy-v2.png|가로 hero|있음|S04|S04 전용|

### G5 실제 구단 로고

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-LOGO-KBO|KBO 구단 로고|assets/team-logos/kbo/*.png|공식 출처, 10개|있음|S14, S18|사용 허가는 92의 V12에서 확인. 수정·재색칠 금지|
|IMG-LOGO-MLB|MLB 구단 로고|assets/team-logos/mlb/*.svg|공식 team-cap-on-light 엠블럼, 30개|있음|S18, S29, S30|사용 허가는 V12. 마이너 하위팀에 혼용 금지|

### G6 가상 팀 배지

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-BADGE-U01|가상 대학 배지 한빛대|assets/badges/college-u01.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U02|가상 대학 배지 청해대|assets/badges/college-u02.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U03|가상 대학 배지 백림대|assets/badges/college-u03.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U04|가상 대학 배지 동운대|assets/badges/college-u04.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U05|가상 대학 배지 서강산대|assets/badges/college-u05.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U06|가상 대학 배지 남해솔대|assets/badges/college-u06.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U07|가상 대학 배지 해오름대|assets/badges/college-u07.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U08|가상 대학 배지 온누리대|assets/badges/college-u08.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U09|가상 대학 배지 새길대|assets/badges/college-u09.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|있음|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-ARMY|군 체육팀(상무) 배지|assets/badges/military-team.svg|64×64 viewBox|있음|S26, S27|독자 디자인. 실제 부대 마크 사용 금지|
|IMG-BADGE-MINOR|가상 마이너(Rookie/A/AA/AAA) 팀 배지|(코드 생성)|MLB 30구단×4 = 120팀. 약칭 2~3글자+팔레트로 코드 생성|코드 제작|S18, S29|이미지 제작 불필요. 모회사 로고와 혼용 금지(37)|
|IMG-BADGE-HS|가상 고교 배지|(코드 생성)|가상 학교 목록(schoolId)별 약칭+팔레트|코드 제작|S02, S04|수는 고교 목록 크기. 이미지 제작 불필요|
|IMG-BADGE-NAT|국가대표 참가국 배지|(코드 생성)|국가 코드 약칭+팔레트|코드 제작|S24, S25|실제 국기·협회 엠블럼 사용은 V12 권리 확인 전 금지|

### G7 기념 보상 외형

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-RWD-R-G01|기념 프레임 R-G01|assets/rewards/r-g01.svg|선수 카드 테두리, 9-slice 가능, 가운데 투명|있음|S40, S45|목표 G01 달성 기념. 능력 효과 없음(58)|
|IMG-RWD-R-G06|기념 프레임 R-G06|assets/rewards/r-g06.svg|선수 카드 테두리, 9-slice 가능, 가운데 투명|있음|S40, S45|목표 G06 달성 기념. 능력 효과 없음(58)|
|IMG-RWD-R-G10|기념 프레임 R-G10|assets/rewards/r-g10.svg|선수 카드 테두리, 9-slice 가능, 가운데 투명|있음|S40, S45|목표 G10 달성 기념. 능력 효과 없음(58)|
|IMG-RWD-R-G03|기념 배경 R-G03|assets/rewards/r-g03.png|1122×1402 PNG 생성 원본, 세로 카드 배경, 글자 없음; 원본 보존. UI는 카드 비율에 맞춰 표시|있음|S40, S45|카드 텍스트 가독성 우선|
|IMG-RWD-R-G05|기념 배경 R-G05|assets/rewards/r-g05.png|1122×1402 PNG 생성 원본, 세로 카드 배경, 글자 없음; 원본 보존. UI는 카드 비율에 맞춰 표시|있음|S40, S45|카드 텍스트 가독성 우선|
|IMG-RWD-R-G08|기념 배경 R-G08|assets/rewards/r-g08.png|1122×1402 PNG 생성 원본, 세로 카드 배경, 글자 없음; 원본 보존. UI는 카드 비율에 맞춰 표시|있음|S40, S45|카드 텍스트 가독성 우선|
|IMG-RWD-R-G04|도감 스탬프 R-G04|assets/rewards/r-g04.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-G09|도감 스탬프 R-G09|assets/rewards/r-g09.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A01|도감 스탬프 R-A01|assets/rewards/r-a01.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A02|도감 스탬프 R-A02|assets/rewards/r-a02.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A03|도감 스탬프 R-A03|assets/rewards/r-a03.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A04|도감 스탬프 R-A04|assets/rewards/r-a04.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A05|도감 스탬프 R-A05|assets/rewards/r-a05.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A06|도감 스탬프 R-A06|assets/rewards/r-a06.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A07|도감 스탬프 R-A07|assets/rewards/r-a07.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A08|도감 스탬프 R-A08|assets/rewards/r-a08.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A09|도감 스탬프 R-A09|assets/rewards/r-a09.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A10|도감 스탬프 R-A10|assets/rewards/r-a10.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A11|도감 스탬프 R-A11|assets/rewards/r-a11.svg|256×256 viewBox, 기록별 컬러 도장, 글자 없음; 제목은 UI 텍스트|있음|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A12|책장 표지 R-A12|assets/rewards/r-a12.png|1122×1402 PNG 생성 원본, 세로 카드 배경, 글자 없음; 원본 보존. UI는 카드 비율에 맞춰 표시|있음|S45|KBO·MLB 실제 출장 후 은퇴 기념|
|IMG-RWD-TITLES|칭호 R-G02/R-G07|(텍스트)|이미지 없음|코드 제작|S40|텍스트 칭호|

### G8 메달·대회 엠블럼

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-MEDAL-GOLD|메달 금|assets/medals/gold.svg|128×128 viewBox, 글자 없음|있음|S25, S45|메달 근거가 있을 때만 사용(111). 실제 대회 공식 메달 디자인 사용 금지|
|IMG-MEDAL-SILVER|메달 은|assets/medals/silver.svg|128×128 viewBox, 글자 없음|있음|S25, S45|메달 근거가 있을 때만 사용(111). 실제 대회 공식 메달 디자인 사용 금지|
|IMG-MEDAL-BRONZE|메달 동|assets/medals/bronze.svg|128×128 viewBox, 글자 없음|있음|S25, S45|메달 근거가 있을 때만 사용(111). 실제 대회 공식 메달 디자인 사용 금지|
|IMG-COMP-WBC|대회 엠블럼 WBC|assets/medals/comp-wbc.svg|96×96 viewBox, 독자 디자인|있음|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|
|IMG-COMP-OLY|대회 엠블럼 OLY|assets/medals/comp-oly.svg|96×96 viewBox, 독자 디자인|있음|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|
|IMG-COMP-AG|대회 엠블럼 AG|assets/medals/comp-ag.svg|96×96 viewBox, 독자 디자인|있음|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|
|IMG-COMP-P12|대회 엠블럼 P12|assets/medals/comp-p12.svg|96×96 viewBox, 독자 디자인|있음|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|

### G9 연대기 카드 테마

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-CARD-DEFAULT|연대기 카드 테마 DEFAULT|assets/cards/theme-default.png|1122×1402 PNG 생성 원본, 글자·로고 없음, 사용자 메모6줄 중앙 여백|있음|S45|테마 개수는 D 3종(63의 coverTheme). 한글 텍스트는 코드가 렌더|
|IMG-CARD-OFFSEASON|연대기 카드 테마 OFFSEASON|assets/cards/theme-offseason.png|1122×1402 PNG 생성 원본, 글자·로고 없음, 사용자 메모6줄 중앙 여백|있음|S45|테마 개수는 D 3종(63의 coverTheme). 한글 텍스트는 코드가 렌더|
|IMG-CARD-RETIRE|연대기 카드 테마 RETIRE|assets/cards/theme-retire.png|1122×1402 PNG 생성 원본, 글자·로고 없음, 사용자 메모6줄 중앙 여백|있음|S45|테마 개수는 D 3종(63의 coverTheme). 한글 텍스트는 코드가 렌더|

### G10 브랜드·앱 아이콘

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-BRAND-MARK|로고 마크 ‘다시, 플레이볼’|assets/brand/logo-mark.svg|정사각 viewBox, 글자 최소(마크 중심)|있음|S01, S21|타이틀 로고타입은 현재 검은고딕 텍스트(37). 실제 구단 로고와 무관|
|IMG-BRAND-ANDROID|Android 적응형 아이콘|assets/brand/android-adaptive-{fg,bg,mono}.svg|foreground/background/monochrome 각 432×432 안전영역 288|있음|-|APK 런처 아이콘(86/29). 배경은 단색 가능|
|IMG-BRAND-PWA|PWA/웹 아이콘|assets/brand/icon-{192,512,maskable-512}.png, favicon.svg, apple-touch-180.png|192/512/maskable512, favicon(SVG), 180|있음|-|manifest(86). 홈 화면 추가 경로 검수|
|IMG-BRAND-SPLASH|스플래시 아이콘|assets/brand/splash-icon.svg|Android 12 스플래시 아이콘 288, 단색 배경|있음|-|큰 일러스트 불필요|

### G11 코드로 만드는 아이콘·다이어그램

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-ICON-TRAIT|특성 배지 T01~T16|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S38|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-PITCH|구종 아이콘 P01~P07|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S39|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-APPROACH|타격 성향 카드 아이콘 4종|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S39|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-FORM|투구폼 아이콘 4종|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S02, S39|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-HAND|투타 아이콘(우/좌/양)|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S02, S16|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-GOAL|목표 G01~G10·도전 A01~A12 아이콘|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S40|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-FIELD|수비 배치 다이어그램|(SVG 코드)|야구장 벡터|코드 제작|S15|FIELD_DIAGRAM. 이미지 생성 불필요|

### G12 레거시

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-LEGACY|비교용 빈티지/시네마틱/선수 초상 PNG|assets/art-lab/*(almanac|cinematic|player-*).png|기존 PNG|보존|기존 PNG|보존|-|삭제하지 않음. 선수 초상 PNG는 시안 예시일 뿐 선수 외형 확정이 아님(119)|

## 화면별 이미지 참조(제작 완료 파일 포함; 현재 상태는 상단 레지스터 기준)

|화면|수|항목 ID|
|---|---|---|
|S01|1|IMG-BRAND-MARK|
|S02|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S03|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S04|6|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM|
|S09|6|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM|
|S10|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S11|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S14|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S16|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S17|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S21|1|IMG-BRAND-MARK|
|S22|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S24|4|IMG-COMP-WBC, IMG-COMP-OLY, IMG-COMP-AG, IMG-COMP-P12|
|S25|7|IMG-MEDAL-GOLD, IMG-MEDAL-SILVER, IMG-MEDAL-BRONZE, IMG-COMP-WBC, IMG-COMP-OLY, IMG-COMP-AG, IMG-COMP-P12|
|S26|1|IMG-BADGE-ARMY|
|S27|7|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-ARMY|
|S28|15|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-U01, IMG-BADGE-U02, IMG-BADGE-U03, IMG-BADGE-U04, IMG-BADGE-U05, IMG-BADGE-U06, IMG-BADGE-U07, IMG-BADGE-U08, IMG-BADGE-U09|
|S33|6|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM|
|S34|15|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-U01, IMG-BADGE-U02, IMG-BADGE-U03, IMG-BADGE-U04, IMG-BADGE-U05, IMG-BADGE-U06, IMG-BADGE-U07, IMG-BADGE-U08, IMG-BADGE-U09|
|S35|15|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-U01, IMG-BADGE-U02, IMG-BADGE-U03, IMG-BADGE-U04, IMG-BADGE-U05, IMG-BADGE-U06, IMG-BADGE-U07, IMG-BADGE-U08, IMG-BADGE-U09|
|S40|25|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-RWD-R-G01, IMG-RWD-R-G06, IMG-RWD-R-G10, IMG-RWD-R-G03, IMG-RWD-R-G05, IMG-RWD-R-G08, IMG-RWD-R-G04, IMG-RWD-R-G09, IMG-RWD-R-A01, IMG-RWD-R-A02, IMG-RWD-R-A03, IMG-RWD-R-A04, IMG-RWD-R-A05, IMG-RWD-R-A06, IMG-RWD-R-A07, IMG-RWD-R-A08, IMG-RWD-R-A09, IMG-RWD-R-A10, IMG-RWD-R-A11|
|S42|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S43|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S45|30|IMG-RWD-R-G01, IMG-RWD-R-G06, IMG-RWD-R-G10, IMG-RWD-R-G03, IMG-RWD-R-G05, IMG-RWD-R-G08, IMG-RWD-R-G04, IMG-RWD-R-G09, IMG-RWD-R-A01, IMG-RWD-R-A02, IMG-RWD-R-A03, IMG-RWD-R-A04, IMG-RWD-R-A05, IMG-RWD-R-A06, IMG-RWD-R-A07, IMG-RWD-R-A08, IMG-RWD-R-A09, IMG-RWD-R-A10, IMG-RWD-R-A11, IMG-RWD-R-A12, IMG-MEDAL-GOLD, IMG-MEDAL-SILVER, IMG-MEDAL-BRONZE, IMG-COMP-WBC, IMG-COMP-OLY, IMG-COMP-AG, IMG-COMP-P12, IMG-CARD-DEFAULT, IMG-CARD-OFFSEASON, IMG-CARD-RETIRE|

앱 아이콘·로고 마크는 화면이 아닌 앱 패키지용이며 위 표에 화면 없이 별도 P0로 둔다.

## 제작 브리프 요약

- **실루엣(P0)**: 얼굴 없는 유니폼 인물 실루엣. 투수 8(우·좌×오버핸드/쓰리쿼터/사이드암/언더핸드), 타자 6(투타 6조합). 화면 정면 기준으로 던지는 팔·배트·글러브 위치를 목록 메모대로 맞춘다. 양타는 두 배트 포즈를 겹쳐 한쪽을 옅게. 팔레트는 CSS 변수.
- **마감 장면(P1)**: 111의 활성 일러스트와 같은 그림체로 3×2 아틀라스 1장(대학·마이너 원정·중립 라이벌·복귀·은퇴·구장). 청춘 애니6컷 승인 파일이 있으며 활성 파일·참조는 레지스터를 따른다.
- **기념 보상(P1)**: 프레임 3, 배경 3, 스탬프 13, 표지 1. 스탬프는 글자 없는 도장. 2026-10-20 사용자 요청으로 컬러 포인트 수정안을 별도 승인 후 반영한다. 카드 위 텍스트 가독성을 우선하고 중앙 여백을 남긴다.
- **가상 대학·상무 배지(P1)**: 실제 마크와 무관한 단순 문양. 대학 이름은 43의 U01~U09.
- **메달·대회 엠블럼**: 메달 3(P1), 엠블럼 4(P2). 실제 대회 로고 금지.
- **카드 테마(P1)**: 연대기 카드 1080×1350 배경 3종(기본·오프시즌·은퇴).
- **브랜드·앱 아이콘(P0/P1)**: 로고 마크, Android 적응형 아이콘, PWA·favicon, 스플래시. 구단 로고와 무관.

## 제작 후 반영 절차

1. 파일을 폴더 계획대로 넣고 규칙을 지켰는지 확인한다(SVG는 script·foreignObject·image·text 없음).
2. image-production-register.json에서 해당 항목 status를 EXISTS로 바꾸고 file/크기를 실제 값으로 갱신한다.
3. screen-image-slots.json의 silhouetteCard 등 슬롯 참조와 시안 보드가 새 파일을 가리키게 하고, assets/art-lab 일러스트는 생성 기록 JSON을 추가한다.
4. verify-design.mjs와 verify-art-direction.mjs를 실행하고 STATUS·119·이 문서를 갱신한다.
5. 브라우저 렌더·접근성·모바일 확인은 별도로 수행하고 결과를 구분해 기록한다.

## 검수 항목 (초안, NOT_EXECUTED)

IM-D01 TODO 항목마다 파일 경로·규격·화면이 있음/02 실루엣 14종 파일명 일치/03 SVG에 script·image·text 없음/04 일러스트에 글자·로고 없음/05 메달 근거 없는 화면에 메달 이미지 없음/06 실제 구단 로고 파일 수정 없음/07 레지스터 상태와 파일 존재 일치/08 화면별 필요 수와 슬롯 JSON 일치.

## 남은 확인

이미지 제작 목록의80항목 파일은 모두 준비됐다. 코드 표시11묶음과 실제 렌더·사용 권리 확인(V12) 검수는 별도다. 연대기 카드 테마3종은 승인 반영했다. 아래 제작 이력의 대기·수치는 당시 상태다.

## 2026-10-20 단계별 제작·승인 절차 (현재 기준 U)

2026-10-20 사용자 확정: 1단계 설계 점검·선택 수정·검증·커밋·푸시 결과를 제시하고 승인받은 뒤 2단계를 시작한다. 이미지 시안은 저장소 밖 임시 폴더에만 두고, 우투 오버핸드 투수·우투우타 타자·로고 마크를 각 2~3안 제시한다. 사용자가 고른 안만 저장소에 반영한다. 미선택·거절 시 반영하지 않으며, 후속 제작도 묶음마다 승인받는다. 승인본 반영 후 레지스터 status·화면 슬롯 참조·STATUS를 갱신하고 세 검증 스크립트를 재실행한다. 승인한 변경만 기존 정상 Git 체크아웃으로 커밋·푸시하며 V:의 .git는 변경하지 않는다.

1. 1단계의 선택 수정·검증·커밋·푸시 결과를 제시하고 사용자의 1단계 결과 승인을 기다린다.
2. 승인 후에만 P0부터 시작한다. 첫 묶음은 우투 오버핸드 투수·우투우타 타자·로고 마크 각각 스타일이 다른 2~3안이다. 공통 제작 규칙과 119를 모두 지키고 실제 UI에 쓸 수 있는 완성도로 제작한다.
3. 시안·비교 보드는 저장소 밖 임시 폴더에 둔다. 미선택·거절한 시안과 제작 중 파일은 저장소에 넣지 않는다.
4. 선택한 스타일로 나머지를 만들 때도 매 묶음마다 다시 보여주고 승인받는다. 승인 없이 다음 묶음 제작·반영을 진행하지 않는다.
5. 승인본만 추가하고 레지스터 status·screen-image-slots.json 참조·STATUS 및 제작 출처를 갱신한다. 검증 3개와 통합MD·무결성 목록을 갱신하고 승인한 변경만 기존 체크아웃으로 커밋·푸시한다.

이번 1단계에서는 이미지 status와 화면 슬롯 참조를 변경하지 않는다.

## 첫 묶음 반영 — 2026-10-20

2026-10-20 사용자 확정: 투수 A·타자 A·로고 2, 배색은 1번 네이비·블루. 승인 SVG 3개와 팔레트 CSS·출처 기록만 반영했다. 실루엣 2/14 완료, 나머지 12개와 앱 아이콘은 별도 묶음 승인 대기. 이미지 레지스터는 92항목 중 TODO61/EXISTS19/CODE_ONLY11/LEGACY_REFERENCE1이다. 게임 규칙·45화면·99이벤트·핵심298 기대값은 불변.

[승인본 보드](approved-art-board.html). SVG의 색은 CSS 변수이며 외부 img에서도 승인 배색이 보이도록 동일한 네이비·블루 기본값을 둔다. 팀 팔레트 변경은 신뢰된 inline SVG의 CSS 변수로 적용한다. 시안 비교안·거절안은 반영하지 않았다. Android/PWA 아이콘은 로고 선택만으로 완성 처리하지 않는다.

## 두 번째 묶음 반영 — 2026-10-20

사용자가 2차 시안 1~4번(우투좌타·좌투좌타 타자, 좌투 오버핸드·우투 쓰리쿼터 투수)을 모두 승인했다. A 스타일·네이비/블루 배색으로 SVG 4종을 추가했다. 실루엣 6/14 완료, 남은 실루엣 8종은 별도 승인 대기다. 전체 이미지 레지스터 92항목은 TODO57/EXISTS23/CODE_ONLY11/LEGACY_REFERENCE1이다.

두 번째 승인 SVG만 반영하고 비교 PNG·제작 스크립트는 저장소 밖에 유지했다. [누적 출처 기록](assets/brand/APPROVED-ART-v2.json).

## 실루엣 전체 승인 반영 — 2026-10-20

사용자가 남은8종 전체를 승인해 A 스타일·네이비/블루 SVG로 반영했다. 타자6투타조합·투수4폼×2손, 실루엣14/14와 로고2가 모두 승인됐다. 전체 이미지92항목 중 TODO49/EXISTS31/CODE_ONLY11/LEGACY_REFERENCE1. Android/PWA 아이콘2묶음과 P1/P2 이미지는 별도 미완료다.

[전체14종 보드](approved-art-board.html), [출처·승인 기록 v3](assets/brand/APPROVED-ART-v3.json). 비교 시안·미승인 다른 자산은 반영하지 않았다. 이전 묶음별 남은 개수는 당시 이력이다.

## 아이콘1 승인 반영 — 2026-10-20

사용자가 앱 아이콘1(네이비 배경)을 승인했다. Android 전경/배경/단색 SVG3개와 PWA192/512/maskable512·apple180 PNG4개·favicon SVG를 반영했다. P0의17항목(실루엣14·브랜드3묶음) 파일 제작은 모두 완료다. 전체92항목은 TODO47/EXISTS33/CODE_ONLY11/LEGACY_REFERENCE1이며 앱 연결·OS 설치 검수는 미실행이다.

네 PNG는 완전 불투명이고 각 규격을 확인했다. Android 전경의 실제 alpha 픽셀 전체가 432캔버스 중앙 반경144 안전영역에 든다. 동일 전경은 maskable 중앙 반경40% 안에 든다. 앱 manifest·Android 리소스 연결과 실제 설치·테마 검수는 별도다.

## 청춘 사건6컷 승인 — 2026-10-20

P1 청춘 애니6컷을 사용자 승인 후 반영했다. 라이벌은 흰색/네이비 팀과 버건디 팀으로 구분한다. finish 보드의 대학·마이너·기록·계약 화면은 의미에 맞는 패널로 연결했다. 전체92항목 중 TODO41/EXISTS39/CODE_ONLY11/LEGACY_REFERENCE1이다.

우리팀 복장은 네이비로 통일한다. 기존 활성 hero/사건2장/고교 hero의 초록 팀 복장 정정은 시안 승인 후 새 버전으로 연결한다. 미승인 수정본과 원본을 덮어쓰지 않는다.

## 우리팀 네이비 수정본 — 2026-10-20

우리팀 네이비 수정본 중 메인·기본사건·고교3PNG는 사용자 승인에 따라 새 v2 파일로 연결했다. 원본3PNG는 보존했다. 추가사건 atlas의 야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 추가 수정했고 이 최종본만 사용자 확인 대기다. 이미지 레지스터 TODO41/EXISTS39와 게임 규칙은 그대로다.

[NAVY-UNIFORM-GENERATION](assets/art-lab/NAVY-UNIFORM-GENERATION.json)에 수정 프롬프트·원본·신규 파일과 해시를 기록했다. 상대팀 라이벌은 동일 구단 소속으로 표현하지 않는다.

## 야간 라이벌 최종 승인 — 2026-10-20

야간 라이벌의 버건디 상대 수정본을 사용자가 최종 승인해 추가사건 atlas를 새 v2 PNG로 연결했다. 기존3개를 포함해 활성4PNG의 우리팀 네이비 통일이 완료됐고 낮·야간 라이벌은 우리팀 흰색/네이비 vs 상대 버건디로 구분된다. 원본4PNG는 보존했다. 레지스터41TODO/39EXISTS·45화면/99이벤트/핵심298은 유지한다.

[NAVY-UNIFORM-GENERATION](assets/art-lab/NAVY-UNIFORM-GENERATION.json)에4개 활성 파일과 생성·편집 출처를 기록했다. 네이비 통일 수정본의 승인 대기는 모두 해소됐다.

## 컬러 도장 승인 반영

2026-10-20: 컬러 기록 도장13종 사용자 승인 반영. 프레임3·배경3·도장13·책장표지1, 기념 보상20항목 모두 파일 완료. 레지스터 EXISTS69/TODO11/CODE_ONLY11/LEGACY_REFERENCE1. 남은 이미지는 메달3·연대기 테마3·스플래시1(P1 7항목), 대회 엠블럼4(P2). 게임 규칙·45화면/99이벤트/핵심298 유지. 앱/DB/API/APK 구현은 시작하지 않음.

## 마지막11종 승인 반영

2026-10-20: 사용자 승인 마지막11종(메달3·대회 독자엠블럼4·연대기테마3·스플래시1)을 반영했다. 이미지 레지스터92항목은 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1이다. 제작 목록의 이미지 파일은 모두 준비됐으며 CODE_ONLY11묶음 표시 명세와 화면45×8상태/접근성/반응형 마감 검수는 남는다. 실제 브라우저·기기·APK 설치·DB 시험 미실행. 게임 규칙·45화면/99이벤트/핵심298 불변, 앱 구현 미착수.

## 코드 표시11묶음 명세

[127](127-CODE-DISPLAY-SPECIFICATION.md)에11묶음의 크기·문양·라벨·상태·대체·접근성·화면 참조를 정리했다. CODE_ONLY는 유지하고 시각 비교 보드는 사용자 승인 대기다. 앱 컴포넌트 구현 완료가 아니다.

## 코드 표시11묶음 승인 반영

2026-10-20: 사용자 승인에 따라 코드 표시11묶음의 비교 보드·승인 기록·화면별 표시 가이드를 반영했다. 현재 수정 가능한 승인 작업 기준이며 실제 앱 구성요소는 NOT_IMPLEMENTED다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1과45화면/99이벤트/핵심298은 유지한다. 게임 구현은 시작하지 않으며 최종픽셀·브라우저·기기·접근성 실행 검수는 미실행이다. [승인 보드](code-display-board.html).

---

<!-- SOURCE: 125-EVENT-CHOICE-DISPATCH.md -->

# 125. 사건 선택지 처리 분류 — RESOLVE_EVENT 디스패치와 해결 시점

사용자확정U(2026-10-19): ‘화면 열기’ 선택지는 **필수(blocking) 사건이면 이동한 화면에서 실제 결정이 확정될 때 해결**하고, 비필수 사건은 이동하면 바로 해결한다. 이 문서는 S06의 `RESOLVE_EVENT`([19](19-CAREER-STATE-MACHINE.md))가 선택지 91종 명령을 어떻게 처리하는지 정한다. 기존에는 S06 바인딩이 `RESOLVE_EVENT` 하나만 있고 선택지 명령 68종의 처리 방식이 정의되지 않았다. 분류 규칙은 초안D이며 [event-catalog-v2.json](event-catalog-v2.json)의 각 선택지에 `dispatchClass`와 `targetScreen`, 각 사건에 `resolutionPolicy`로 기록했다.

## 선택지 분류 (164개 선택지, 91종 명령)

| 분류 | 수 | 처리 | 예 |
|---|---|---|---|
|DOMAIN|70|`RESOLVE_EVENT{eventInstanceId, choiceCommand, payload}` 안에서 해당 도메인 명령을 같은 트랜잭션으로 실행하고 사건을 해결한다|CHOOSE_FOCUS, ACCEPT_CAREER_OFFER, CONFIRM_POSITION, CANCEL_POSITION_PLAN, DEFER_CALLUP, APPLY_MILITARY_TEAM|
|NAVIGATE|50|`targetScreen`으로 이동한다. 사건 해결 시점은 아래 resolutionPolicy를 따른다|OPEN_CAREER_OFFERS→S08, OPEN_ROUTE→S28, REQUEST_RETIRE→S09, WATCH_IMPORTANT_GAME→S44|
|ACK|44|상태를 바꾸지 않고 사건을 해결한다(확인·유지)|ACK_EVENT, KEEP_FOCUS, ACK_INJURY, SKIP_COMMENTARY|

- CANCEL_*, DEFER_*, DECLINE_*, REMAIN_ORIGINAL은 ‘하지 않음’이어도 기록이 남는 도메인 결정이므로 DOMAIN이다(예: 승격 보류는 다음 평가 대기 상태를 기록).
- KEEP_FOCUS는 기존 계획을 그대로 두는 확인이라 ACK다. 결과 문구는 이미 선택지별로 분리됐다(62개 사건 문구 정리).

## 사건 해결 시점 (resolutionPolicy)

| 정책 | 사건 수 | 규칙 |
|---|---|---|
|BLOCKING_UNTIL_DOMAIN_COMMIT|35|진로·계약·병역·대표·등록·포지션 확정 등 실제 결정이 필요한 사건. NAVIGATE를 골라도 사건은 열린 상태로 남고, 이동한 화면에서 eventInstanceId를 참조한 도메인 명령이 커밋될 때 해결된다. 결정 없이 돌아오면 같은 선택지를 다시 보여준다|
|BY_POSTING_DECISION|1|E63만 사용. 승인(APPROVED)은 후속 도메인 결정까지 대기, 보류(DEFERRED)는 사유 확인 ACK로 해결|
|RESOLVE_ON_SELECT|63|읽기·조언·열람 사건. 어떤 선택지든 고르는 즉시 해결되며, NAVIGATE는 해결 후 화면만 이동한다|

항상 BLOCKING 사건(35개): E04, E05, E06, E07, E09, E13, E23, E30, E31, E32, E33, E34, E35, E36, E44, E47, E48, E49, E50, E54, E56, E57, E59, E60, E61, E64, E66, E67, E70, E73, E74, E75, E76, E82, E83.

## 세부 규칙

- **진행과의 관계**: BLOCKING 사건은 [69](69-EVENT-COLLISIONS-PROVISIONAL-STATE.md)의 blocking task와 연결되어 [117](117-CAREER-NEXT-MAJOR-EVENT-PROGRESSION.md)의 ‘다음 주요 사건까지’ 진행을 그 지점에서 멈춘다. RESOLVE_ON_SELECT 사건은 표현 정지일 뿐 진행을 막지 않는다.
- **이동 후 해결**: 이동한 화면의 도메인 명령은 `sourceEventInstanceId`를 함께 보내고, 서버는 같은 트랜잭션에서 사건을 RESOLVED로 바꾼다. 같은 화면에서 다른 경로로 결정해도(예: 오퍼 비교 후 은퇴 확인) 그 결정이 사건을 해결한다.
- **기한**: BLOCKING 사건에 기한이 있으면 기한 도달 시 69/81의 기한 처리 결과(예: 재계약 마감→FA 전환)를 도메인 결정으로 보고 사건을 EXPIRED_BY_DEADLINE으로 닫는다. 기본 선택을 사용자 몰래 고르지 않는다.
- **무효화**: 이동 중 부상·병역 등으로 선택지가 무효가 되면 서버가 선택 세트를 다시 검증한다(19). 이미 해결된 사건은 결과 조회만 가능하다.
- **중복·재시도**: RESOLVE_EVENT와 이동 화면의 도메인 명령 모두 같은 commandId 재전송은 같은 receipt를 돌려준다(74). 사건 해결은 eventInstance당 한 번이다.
- **화면 복귀**: 이동한 화면의 ‘이전’은 S06의 같은 사건으로 돌아오며, BLOCKING 사건은 홈 이어하기에서도 이 사건으로 재개한다(이어하기 버튼만, 중단 설명 카드 없음).
- **API**: RESOLVE_EVENT payload = {eventInstanceId, expectedEventVersion, choiceCommand, choicePayload?}. NAVIGATE 응답 = {navigation:{targetScreen, sourceEventInstanceId}, eventStatus: OPEN|RESOLVED}. 잘못된 분류의 명령은 422 INVALID_CHOICE.

## 검수 항목 (초안, NOT_EXECUTED)

EV-D01 모든 선택지에 dispatchClass 존재/02 NAVIGATE는 45화면 중 targetScreen 보유/03 BLOCKING 사건은 ACK만으로 해결 불가/04 E30에서 OPEN_CAREER_OFFERS 후 결정 없이 복귀하면 사건 OPEN/05 같은 사건에서 이동 화면의 계약 확정이 사건 RESOLVED/06 기한 도달 시 EXPIRED_BY_DEADLINE과 기한 처리 결과 기록/07 RESOLVE_ON_SELECT 사건은 이동 즉시 RESOLVED/08 같은 commandId 재전송 receipt 동일/09 사건 해결은 1회/10 무효화 후 선택 세트 재검증.

## 남은 확인

BLOCKING 판정은 선택지 명령 기준의 자동 분류(초안)다. 실제 기한·blocking task와의 1:1 연결은 구현 시 69의 task 생성과 함께 검증한다. 구현·실행은 하지 않았다.

## E63 승인·보류 분기 (2026-10-20 사용자 확정 A안)

- 저장된 원구단 답변을 postingDecision(APPROVED/DEFERRED)으로 읽어 분기를 정한다. 조회·재개 시 재추첨하지 않는다.
- APPROVED: OPEN_POSTING_OFFERS만 제공. 화면 이동만으로 사건이 해결되지 않는다. 후속 계약 수락·거절·협상 마감 등 기존 도메인 결정이 같은 트랜잭션에서 사건을 닫는다. 결정 없이 복귀하면 OPEN 유지.
- DEFERRED: ACK_EVENT(보류 사유 확인)만 제공하고 확인 시 RESOLVED. 협상 오퍼가 없는 승인 화면으로 이동시키지 않는다.
- 다른 분기의 choiceCommand 전송은 422 INVALID_CHOICE, 사건 해결·계약 변경 없음. 분기 데이터가 없거나 알 수 없는 값이면 실패 상태로 표시하고 재조회한다. 승인·보류 중 어느 쪽으로도 추정하지 않는다.
- 카탈로그는 resolutionPolicy=BY_POSTING_DECISION 및 resolutionBranches에 분기별 허용 명령·정책을 기록한다. 항상 BLOCKING 35 + 조건부 E63 1 + 즉시 해결 63 = 99다. 선택지 164·명령 91·DOMAIN70/NAVIGATE50/ACK44는 그대로다.
- EV-D03은 각 실제 분기의 정책으로 검사한다. BLOCKING 분기에 ACK를 허용하면 실패하며, E63의 보류 ACK는 RESOLVE_ON_SELECT 분기이므로 합법이다.

---

<!-- SOURCE: 126-PREIMPLEMENTATION-ART-CLOSURE.md -->

# 126. 구현 전 이미지·화면 설계 마감 계획

2026-10-20 사용자 확정 범위: 남은 작업을 모두 진행하되 **구현 전까지만**. 시안은 묶음별로 제시하고 승인본만 저장소에 반영한다. 이 계획은 작업 순서 D이며 새로운 게임 규칙을 추가하지 않는다.

## 배지 승인 반영 현황

2026-10-20: 대학9·군 체육팀1 컬러 배지10개 사용자 승인 반영. 학교마다 고유 주색·보조색을 사용하며 선수 사건 일러스트 네이비 원칙과 구분한다. 이미지 레지스터92항목은 EXISTS49/TODO31/CODE_ONLY11/LEGACY_REFERENCE1. 남은 P1 27개·P2 4개. 게임 규칙·45화면/99이벤트/핵심298은 불변이며 구현은 시작하지 않았다. 배지 시안 승인 대기는 종료됐다. 아래 최초 계획의41항목 중10항목 완료, 실제 잔여31항목이다.

## 최초 계획 시점의 완료된 파일

실루엣14종, 브랜드 로고2, 아이콘1, 청춘 장면6컷, 활성4PNG 네이비 통일과 라이벌 팀 구분은 승인·반영·정적검사·푸시 완료다. 전체 이미지 레지스터92항목 중 EXISTS39/TODO41/CODE_ONLY11/LEGACY_REFERENCE1이다.

## 남은 이미지41항목

| 묶음 | 항목 수 | 우선순위 | 다음 단계 |
|---|---:|---|---|
| 가상 대학9 + 군 체육팀 배지 |10|P1|사용자 승인·파일 반영 완료|
| 기념 프레임3 + 배경3 + 스탬프13 + 책장 표지1 |20|P1|그룹별 시안·승인|
| 금/은/동 메달 |3|P1|시안·승인|
| 연대기 카드 테마 |3|P1|시안·승인|
| 스플래시 아이콘 |1|P1|시안·승인|
| 대회 독자 엠블럼 |4|P2|시안·승인|

개별 ID·파일·규격·사용 화면은 [124](124-IMAGE-PRODUCTION-BRIEF.md)와 [레지스터](image-production-register.json)를 따른다. 배지는 실제 학교/부대 로고를 사용하지 않고 기존43의 가상 학교 이름·설명만 사용한다. 학교 배지와 장식은 능력 효과를 추가하지 않는다.

## 표시 명세로 마감할11묶음

고교/마이너/국가 배지, 칭호, 특성, 구종, 타격성향, 투구폼, 투타, 목표·도전 아이콘, 수비 배치도는 CODE_ONLY11묶음이다. 이미지 제작 수에 더하지 않는다. 구현 전에는 표시 크기·의미·색/형태 구분·읽기 대체·미해금/빈 상태 명세와 정적 예시를 마감한다. 실제 앱 컴포넌트·게임 동작은 구현하지 않는다.

## 승인본 반영 단위

1. 저장소 밖 임시 폴더에서 완성도 있는 시안 제작·제시.
2. 사용자가 승인한 항목만 저장소에 반영. 미선택/거절본은 반영하지 않음.
3. 출처/제작 프롬프트·레지스터 status·정확한 화면 참조·STATUS/체크포인트 갱신.
4. 세 정적 검증과 통합MD/무결성 목록 갱신, 승인 변경만 기존 정상 Git 체크아웃으로 커밋·푸시. V:의 .git는 수정하지 않음.
5. 다음 묶음을 제시하고 반복 승인. 이미 승인한 결정을 반복 질문하지 않음.

## 이미지 이후의 구현 전 마감

[108 화면 마감](108-ALL-SCREEN-FINALIZATION.md)의45화면×8상태·반응형·오류/빈 상태·이미지 실패 대체·접근성/확률 표시 명세를 점검한다. 신규 이미지로 인한 크롭·상태 오표현·결과 누설을 검사하고 문서 충돌/링크/최신 표기·사용자 결정 누락을 다시 감사한다. [91](91-CURRENT-CONTRACT-INDEX.md)·[14](14-CANONICAL-DECISIONS.md)·진행/검증 문서를 같은 기준으로 인계한다.

현재 file: 자동 브라우저 정책 차단을 우회하지 않는다. 실제 렌더 증거가 없으면 화면 마감 등록부의 NOT_FINALIZED/NOT_EXECUTED를 유지한다. 정적 예시를 실제 기기/브라우저 PASS로 올리지 않는다. 실행 가능한 허용 환경에서의 렌더 확인이 남으면 인계에 명시한다.

## 구현 중단선

이 단계에서 앱/엔진/API/Neon DB 구축·인증 연결·앱 컴포넌트·게임 명령·APK 빌드·실제 배포를 시작하지 않는다. 정적 디자인 보드와 자산 연결은 설계 산출물이다. [120 구현 로드맵](120-IMPLEMENTATION-ROADMAP.md)의 M0 착수는 별도 사용자 지시 이후다. [92 실행 게이트](92-DESIGN-CLOSURE-HANDOFF.md)의 실제 환경/설치/밸런스 시험을 문서 검사로 대체하지 않는다.

## 기념 보상 후속 진행

2026-10-20: 사용자 승인 프레임3·배경3·책장표지1만 반영. PNG4개는 생성 원본1122×1402를 보존하고 레지스터 실제 규격을 기록했다. 도장13종은 색상 추가 요청으로 수정 시안만 저장소 밖에 보관하며 미반영. EXISTS56/TODO24/CODE_ONLY11/LEGACY_REFERENCE1. 게임 규칙·45화면/99이벤트/핵심298 불변. 구현 미착수.

## 기념 보상20종 마감

2026-10-20: 컬러 기록 도장13종 사용자 승인 반영. 프레임3·배경3·도장13·책장표지1, 기념 보상20항목 모두 파일 완료. 레지스터 EXISTS69/TODO11/CODE_ONLY11/LEGACY_REFERENCE1. 남은 이미지는 메달3·연대기 테마3·스플래시1(P1 7항목), 대회 엠블럼4(P2). 게임 규칙·45화면/99이벤트/핵심298 유지. 앱/DB/API/APK 구현은 시작하지 않음.

## 현재 이미지 제작 종료 상태

2026-10-20: 사용자 승인 마지막11종(메달3·대회 독자엠블럼4·연대기테마3·스플래시1)을 반영했다. 이미지 레지스터92항목은 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1이다. 제작 목록의 이미지 파일은 모두 준비됐으며 CODE_ONLY11묶음 표시 명세와 화면45×8상태/접근성/반응형 마감 검수는 남는다. 실제 브라우저·기기·APK 설치·DB 시험 미실행. 게임 규칙·45화면/99이벤트/핵심298 불변, 앱 구현 미착수.

## 표시 명세·화면 정합 점검 완료

2026-10-20: 구현 전 코드 표시11묶음의 상세 명세127과 전45화면 정적 대조128을 작성했다. 45개 행의8상태·읽기 순서·주행동·슬롯 일치와360/390/768/1280 계약을 확인했다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1 유지.83/108의 낡은 실루엣 미제작·빈티지/얼굴 프리셋 표기를 기존 승인 기준으로 정정. 게임 규칙·45화면/99이벤트/핵심298 불변. 실제 렌더·접근성·기기 시험은 미실행, 구현 미착수.

## 코드 표시11묶음 승인 반영

2026-10-20: 사용자 승인에 따라 코드 표시11묶음의 비교 보드·승인 기록·화면별 표시 가이드를 반영했다. 현재 수정 가능한 승인 작업 기준이며 실제 앱 구성요소는 NOT_IMPLEMENTED다. 이미지 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1과45화면/99이벤트/핵심298은 유지한다. 게임 구현은 시작하지 않으며 최종픽셀·브라우저·기기·접근성 실행 검수는 미실행이다. [승인 보드](code-display-board.html).

## 설계 보드 후속 점검

2026-10-20: 설계 보드에 최신 승인 모음·팀 배지·카드·아이콘11묶음 링크를 반영하고 접근성 소스를 보완했다. 파일 기반13검사 통과(이미지60·입력37·표6). 실제 file: 보드 관찰은 브라우저 URL 보안 정책으로 차단돼 렌더·키보드·스크린리더 검수는 미실행. 우회하지 않았으며45화면의 미검수 플래그를 유지한다. 이미지80/TODO0/CODE_ONLY11과 게임 규칙은 불변, 게임 구현 미착수. [129](129-DESIGN-BOARD-REFRESH-ACCESSIBILITY.md)를 현재 검수 증거로 함께 읽는다.

## 구현 전 가능한 작업 마감

2026-10-20: 구현 전 가능한 세 항목을130 인계 기준과 기계 판독 준비표로 마감했다. 보드 최신화·확인된 소스 문제 수정·정적 접근성13검사·45화면/8상태 대조는 완료했다. 실제 렌더·키보드·스크린리더는 보안 정책 차단/미실행으로 남기고 증거 없이 PASS로 올리지 않는다. 진입 README/START-HERE/HANDOFF와92의 낡은 현재 안내를 수정했다. 이미지80/TODO0/CODE_ONLY11·45화면/99이벤트/핵심298/23기대값 묶음 유지, 신규 게임 규칙과 구현 착수 없음. [130](130-PREIMPLEMENTATION-HANDOFF.md)을 현재 인계 기준으로 따른다.

---

<!-- SOURCE: 127-CODE-DISPLAY-SPECIFICATION.md -->

# 127. 코드 표시11묶음 상세 명세

2026-10-20 / DESIGN_SPECIFICATION_ONLY. [124 이미지 제작표](124-IMAGE-PRODUCTION-BRIEF.md)의 CODE_ONLY11묶음을 표시 규칙으로 마감한다. 게임 규칙·해금·능력·경제·명령은 변경하지 않는다. 아래 크기·획·배치·문양 표시안은2026-10-20 사용자가 현재 기준으로 승인했다. 이후 수정 가능한 작업 기준이며 최종 픽셀 검수 승인과는 구분한다. 실제 앱 컴포넌트·아이콘 번들 구현 완료가 아니다.

## 공통 표시와 접근성

- 일반 아이콘 viewBox24, 선2, round cap/join, 채움 최소, currentColor. 작은 목록24px·카드32px·미리보기48px. 아이콘을 늘려 텍스트를 대체하지 않는다.
- 장식이면 aria-hidden=true. 이름 텍스트가 없는 독립 아이콘이면 접근 가능한 이름을 부여한다. 같은 문구를 아이콘과 텍스트로 두 번 낭독하지 않는다. 실제 사용 시 버튼48px·터치44px 이상은 [83](83-VISUAL-ASSETS-ACCESSIBILITY-HANDOFF.md)을 따른다.
- 기본 잉크는 짙은 네이비, 액센트는 파랑. 승인 학교 배지·도장은 각자 고유 색 유지. 색은 보조 정보이며 선택은 체크+선택됨, 오류는 문구+아이콘, 미해금은 자물쇠+텍스트로 구분한다. 비활성 여부와 단순 미선택을 같은 낮은 불투명도로 뭉개지 않는다.
- 본문16px/줄간격1.5, 보조14px, 숫자 tabular-nums. 텍스트 대비4.5:1·의미 있는 그래픽3:1을 검수 목표로 두고 실제 렌더로 확인한다. 이미지를 배경으로 쓸 때 본문 아래 불투명 단색 면을 유지한다.
- ID·명칭은 게임 정의의 정식 값을 사용한다. 번역·약칭은 표시값이며 식별키를 대신하지 않는다. hover만으로 도움말을 숨기지 않고 터치/키보드로도 읽도록 설계한다.
- 빈 목록은 정상 빈 사유, 조회 오류는 재시도, 로딩은 예약 공간. 아이콘 실패 시 이름/약칭과 상태 라벨을 남긴다. 긴 이름은 줄바꿈하고 수락 조건·효과를 말줄임으로 숨기지 않는다.
- 확률 값은 [82](82-PROBABILITY-EFFECTS-CONFIRMATION-AUDIT.md)·[75](75-EXACT-EFFECTS-PUBLIC-INFORMATION.md) 기준. 실제 확률1 숫자 배지는 숨기며 단순 선택에 적용100%를 붙이지 않는다. 아이콘 색·화살표는 확률이나 수치 효과를 새로 뜻하지 않는다.

## 묶음별 표시 계약

| 등록부 ID | 크기·표현 | 표기·행동·경계 | 화면 |
|---|---|---|---|
| IMG-BADGE-MINOR |32/40px 약칭 방패, 레벨 칩 별도 | 소속 조직 팔레트+리그/레벨 텍스트. Rookie/A/AA/AAA를 모양 하나로 추측하게 하지 않음. 30×4=120개는 표현 조합 수이며120개 PNG 제작 아님. 메이저 실제 구단 로고를 가상 마이너 로고처럼 복제하지 않음 |S18/S29|
| IMG-BADGE-HS |32/40px 학교 약칭+단순 문양 | schoolId에 연결된 이름·약칭·팔레트만 사용. 학교 수를 새로 정하지 않음. 이름만 같아도 ID로 구분. 대학 승인9배지와 혼용하지 않음 |S02/S04|
| IMG-BADGE-NAT |32/40px 참가국 코드 칩 | 실제 참가 명단의 국가 코드+한국어명. 국기·공식 협회 로고 새 제작 없음. 선정/참가/우승은 별도 상태 텍스트, 국가 칩으로 메달 결과 암시 금지 |S24/S25|
| IMG-RWD-TITLES |텍스트 칩, 아이콘 없음 | R-G02/R-G07 이름은 기존 보상 정의에서 조회, 출처·보유중/선택됨 표시. 칭호 효과0. 보유하지 않은 칭호 적용 불가. 작은 왕관을 새 보상으로 만들지 않음 |S40|
| IMG-ICON-TRAIT |24/32px 문양+정식명 | T01~T12 공개 진척, T13~T16 미해금은 허용된 이름+암시+공통 미해금 문양만. 조건/진척/효과를 문양·alt·색 농도로 누설하지 않음. 보유 효과 전체 조건부 자동 적용, 장착 슬롯 없음 |S38|
| IMG-ICON-PITCH |24/32px 공+기하 궤적 | P01~P07 아래 대응표. 궤적은 식별용이며 실제 회전·낙차·타구 데이터를 주장하지 않음. 숙련/XP/사용 비율은 별도 텍스트. 미학습·학습중·보유비활성·활성 상태를 구분 |S39|
| IMG-ICON-APPROACH |24/32px 부채꼴+방향선 | 균형/당겨치기/밀어치기/전방향. 좌우 그림을 실제 타구 방향 좌표로 해석하지 않도록 명칭 우선. 타격 초기 유형과 독립, 기존 logit 효과·변경 창 그대로 |S39|
| IMG-ICON-FORM |24/32px 어깨 중심과 팔 각도 | 오버핸드/쓰리쿼터/사이드암/언더핸드. 상완 각도는 도식이며 실제 투구 분석 아님. 좌/우투는 별도 라벨. 얼굴·몸 이미지나 좌우 반전 새 실루엣 대신 단순 도식 |S02/S39|
| IMG-ICON-HAND |텍스트 R/L/S와 한글 라벨 | 던짐은 우투/좌투, 타석은 우타/좌타/양타. R/L 단독 표시로 투타를 섞지 않음. 선택 불가 조합·포지션 사유는 기존119/79. 양타에 던짐 S를 만들지 않음 |S02/S16|
| IMG-ICON-GOAL |24/32px 목표/기록 문양+라벨 | G01~G10 목표10개, A01~A12 도전12개. 시즌 목표/상시 도전 탭 구분. 목표 미선택·진행·완료·만료, 도전 미해금·보유·정정 출처를 텍스트로 구분. 기념 도장13종은 해금 외형이며 이 메뉴 아이콘과 별개 |S40|
| IMG-FIELD |320×280 기준 SVG 수비 다이아몬드 | 보조 그림이며 아래 타순/수비 슬롯 목록이 같은 정보 제공. 포지션별 선수명·비어 있음·부상/불가 사유. 색점만 표시 금지. 드래그 전용 입력 없음, 기존 적용/미리보기 검증 그대로. 모바일 그림에 긴 이름이 겹치면 이름 목록을 우선하고 포지션 약칭 표시 |S15|

## 구종 식별 도식

| ID | 이름 | 그림 도식 |
|---|---|---|
|P01|포심|직선 한 줄과 공|
|P02|투심|완만한 곡선 두 줄|
|P03|슬라이더|옆으로 꺾이는 단일 곡선|
|P04|커브|크게 휘어지는 원호|
|P05|체인지업|같은 방향의 점선과 공|
|P06|스플리터|끝에서 아래로 꺾이는 선|
|P07|커터|짧은 측면 굴곡|

P01~P07 명칭·효과 원문은 [57](57-REPERTOIRE-DETAILED-CONTRACT.md)·[48](48-PITCHES-BATTING-APPROACH.md). 궤적 길이·공 크기·채도는 능력/숙련의 수치 축이 아니다.

## 상태 조합 예시

1. 공개 특성 보유: 정식명·공개 효과·보유중, 현재 상황 비활성은 그 사유만 표시. 미해금 히든: 이름·암시·미해금, 문턱·진척 막대 없음. 모든 히든 미해금 공통 문양으로 숨은 조건 패턴을 암시하지 않음.
2. 포심 활성: 이름·숙련·XP·비중을 각각 라벨. 학습중 커브: 완료 전망·현재 계획을 텍스트로 표시하되 학습 성공률 배지 없음. 구종 최소2/최대4·최소비중10·합100은 기존 계약 검사이며 도식이 값을 계산하지 않음.
3. 목표 추천: 추천 라벨만, 자동 선택 아님. 완료 도전의 기념 도장과 현재 목표의 선택 체크는 구별. 보상 효과 없음. 기록 정정 라벨은 사실을 남기고 기념 외형 자동 회수로 바꾸지 않음.
4. 국가 배지: 이름·참가 단계·확정 메달을 각각 분리. 같은 배지와 팀색이 병역 해결을 뜻하지 않음.
5. 투타: 우투·양타를 두 필드로 읽기. 구단 가져오기 선수도 손·타석·폼을 보존한다. 기호만 보고 능력·나이·상성을 추론하게 하지 않음.
6. 수비 목록: SS 김예시(가상 시안) → 변경/해제와 해당 오류를 같은 행에서 확인. 비어 있는 CF는 비어 있음 텍스트. 신규 라인업 편집 동작을 설계하지 않고 기존 S15 명령을 따른다.

## 규격·시안·인계

- 360/390/768/1280px와200% 확대에서 문양·명칭·상태가 겹치지 않는지 검수. 미선택/선택/잠김/오류/긴 이름/이미지 실패를 비교한다. 색각·흑백에서도 이름+형태+상태로 구분한다.
- [시각 비교 보드](code-display-board.html)는 사용자 승인 후 저장소에 반영했다. 새 수정 시안은 별도 승인 전 저장소 밖에 둔다. 레지스터 status는 CODE_ONLY 그대로, 앱 구현 여부는 NOT_IMPLEMENTED 유지. EXISTS80항목과 더해 제작 완료91개라고 세지 않는다.
- 이 문서는 표시 상세 명세이며 실제 컴포넌트 구현·브라우저/스크린리더 실증 완료가 아니다. [128 마감 점검](128-PREIMPLEMENTATION-SCREEN-AUDIT.md)을 함께 인계한다.

## 문양 대응표 D

이 대응은 작은 표시 아이콘의 주제이며 효과 수치·보상·조건을 변경하지 않는다. 서로 다른 ID가 같은 계열 문양을 쓰더라도 정식명·출처 텍스트로 구별한다.

| 특성 ID | 문양 주제 | 특성 ID | 문양 주제 |
|---|---|---|---|
|T01|배트와 번쩍임|T07|공과 수직 속선|
|T02|겹친 원호|T08|아래로 향한 공|
|T03|발자국|T09|수평 저울|
|T04|방패|T10|순환 호흡선|
|T05|베이스 세 점|T11|열린 탈출 화살표|
|T06|잎과 배트|T12|글러브 방패|
|T13~T16 미해금|공통 자물쇠; 개별 조건 암시 문양 없음|T13~T16 해금 후|기록 공개 상태의 일반 특성 프레임|

| 목표 ID | 메뉴 문양 | 목표 ID | 메뉴 문양 |
|---|---|---|---|
|G01|홈플레이트|G06|이닝 순환선|
|G02|명단 체크|G07|글러브 방패|
|G03|배트와 공|G08|복귀 화살표|
|G04|진루 화살표|G09|토너먼트 가지|
|G05|공과 속선|G10|학사모|

도전 A01~A11 메뉴는 승인 기념 도장의 주제(계약·모자·공·지구·학사모·비행·복무방패·배트·트로피·글러브·재회)를 작은 단색선으로 축약하며, 메뉴 사용 자체는 기념 도장의 획득/해금을 뜻하지 않는다. A12는 책 문양이다. 메뉴 아이콘과 해금 후 컬러 도장은 용도·크기·상태가 다르다.

## 표시안 승인 반영

2026-10-20 사용자: 일단 그렇게 반영. 현재 표시안11묶음을 승인 작업 기준으로 채택했다. [승인 기록](assets/design-guides/APPROVED-CODE-DISPLAY-v1.json). CODE_ONLY11묶음은 이미지 파일80항목과 별개이며 실제 앱 구성요소는 NOT_IMPLEMENTED다.

---

<!-- SOURCE: 128-PREIMPLEMENTATION-SCREEN-AUDIT.md -->

# 128. 구현 전 화면·인계 마감 점검

2026-10-20 / STATIC_DOCUMENT_AUDIT_ONLY. 기준 커밋7068cd7의 이미지 승인 상태와 현재 명세를 대조했다. [기계 판독 점검표](preimplementation-screen-audit.json). 새 게임 기능·명령·DB·앱 컴포넌트 구현은 없다.

## 이번에 완료한 서면 점검

- 화면45개 고유ID와 등록부·그림 슬롯 행의 완전 일치. 45×8=360개 상태 자리와360/390/768/1280 네 크기 계약 존재. 이는 실행된 화면1440개라는 뜻이 아니다.
- 모든 행의 읽기 순서·주행동·개별 예외 요건 존재. 새 메달·배지·도장·카드의 화면 참조와 기존 등록부 동기화 유지.
- 제작 이미지80항목 존재, TODO0, CODE_ONLY11묶음 표시 명세127 연결. 승인 이미지 보유와 화면 최종 픽셀 승인은 별개다.
- 미해금 히든 비공개, 실제 확률1 숫자 배지 숨김, 단순 변경에 적용100% 없음, 이어하기만 보이는 홈, 얼굴 없는14실루엣, 원본과19세 복사 구분은 기존 계약을 유지한다.
- 83/94/95/109/111의 미제작 실루엣·빈티지 최신 표기와108의 이전 그림 제작 순서를 기존 사용자 승인 기준으로 정정했다. 초기 서체·수치·게임 계산을 변경하지 않았다.

## 화면별 정적 대조

| 화면 | 이름 | 배치 | 선언 상태 수 | 코드 표시 관련 | 참조 점검 |
|---|---|---|---:|---|---|
|S01|홈|DASHBOARD|8|—|일치|
|S02|생성|FORM|8|IMG-BADGE-HS, IMG-ICON-FORM, IMG-ICON-HAND|일치|
|S03|커리어|DASHBOARD|8|—|일치|
|S04|고교결산|RECORD|8|IMG-BADGE-HS|일치|
|S05|드래프트|DECISION|8|—|일치|
|S06|사건|DECISION|8|—|일치|
|S07|결산|RECORD|8|—|일치|
|S08|계약|DECISION|8|—|일치|
|S09|은퇴|PLAYER|8|—|일치|
|S10|보관목록|RECORD|8|—|일치|
|S11|보관상세|PLAYER|8|—|일치|
|S12|구단생성|FORM|8|—|일치|
|S13|구단홈|DASHBOARD|8|—|일치|
|S14|선수단|RECORD|8|—|일치|
|S15|라인업|FORM|8|IMG-FIELD|일치|
|S16|선수상세|PLAYER|8|IMG-ICON-HAND|일치|
|S17|시장|FORM|8|—|일치|
|S18|리그|RECORD|8|IMG-BADGE-MINOR|일치|
|S19|경기|RECORD|8|—|일치|
|S20|저장|UTILITY|8|—|일치|
|S21|설정|UTILITY|8|—|일치|
|S22|스타일|FORM|8|—|일치|
|S23|강화|DECISION|8|—|일치|
|S24|대표선발|DECISION|8|IMG-BADGE-NAT|일치|
|S25|국제대회|RECORD|8|IMG-BADGE-NAT|일치|
|S26|병역|DECISION|8|—|일치|
|S27|복무복귀|UTILITY|8|—|일치|
|S28|졸업진로|DECISION|8|—|일치|
|S29|미국제안|DECISION|8|IMG-BADGE-MINOR|일치|
|S30|미국홈|DASHBOARD|8|—|일치|
|S31|포스팅|DECISION|8|—|일치|
|S32|해외협상|DECISION|8|—|일치|
|S33|국내복귀|DECISION|8|—|일치|
|S34|대학 선택|FORM|8|—|일치|
|S35|대학 커리어|DASHBOARD|8|—|일치|
|S36|스카우트 탐색|FORM|8|—|일치|
|S37|구단 예산|RECORD|8|—|일치|
|S38|특성·시그니처|RECORD|8|IMG-ICON-TRAIT|일치|
|S39|구종·타격성향|FORM|8|IMG-ICON-PITCH, IMG-ICON-APPROACH, IMG-ICON-FORM|일치|
|S40|목표·도전과제|RECORD|8|IMG-RWD-TITLES, IMG-ICON-GOAL|일치|
|S41|에이전트·구단관계|DECISION|8|—|일치|
|S42|라이벌·동료|RECORD|8|—|일치|
|S43|코치·스카우트|FORM|8|—|일치|
|S44|중요경기중계|VIEWER|8|—|일치|
|S45|야구연대기|RECORD|8|—|일치|

## 실제 렌더에서 확인할 수용 기준

| 영역 | 확인 내용 | 현재 증거 |
|---|---|---|
| 헤더/크롭 |360px·큰 글자에서 제목/뒤로가기/날짜 안 잘림, 그림 contain/장면 의미 보존, 세이프 영역 |서면 기준만, NOT_EXECUTED|
| 이름/수치 |한글16자·긴 팀명·100.0·큰 금액, 텍스트 줄바꿈과 표 내부 스크롤, 페이지 가로 넘침 없음 |서면 기준만, NOT_EXECUTED|
| 확률/선택 |숫자 확률과 효과/비용·미충족 이유를 이미지 밖 표시, p=1 숫자 숨김, 확률 없는 변경 배지 없음 |정적 계약 확인, 실제 UI NOT_EXECUTED|
| 잠김/히든 |숨은 문턱·근접도·효과를 DOM/alt/색에 포함하지 않음, 전체 보유 효과 자동 적용 |정적 허용목록 존재, 실제 API/렌더 NOT_EXECUTED|
| 입력/접근성 |키보드 포커스·200%·읽기 순서·오류 연결·44px/48px·색 외 상태 |서면 기준만, NOT_EXECUTED|
| 자산 실패 |로고/실루엣 카드/배경 실패 시 이름·역할·단색면 유지, 입력과 계약을 막지 않음 |대체 계약 존재, 실제 렌더 NOT_EXECUTED|
| 결과 누설 |확정 전 메달/서명/우승 그림 금지, 도장 보유와 현재 시즌 진척 분리 |슬롯 가드 존재, 실제 렌더 NOT_EXECUTED|
| 감상/저장 |중계는 확정 로그 감상, 홈은 이어하기 버튼, 복구 설명 카드 없음 |정적 계약 확인, 실제 동작 NOT_EXECUTED|

## 남은 일과 구현 중단선

1. 127 비교 보드11묶음은2026-10-20 사용자 승인 후 [정적 보드](code-display-board.html)로 반영 완료. 앱 구성요소는 미구현.
2. 허용된 환경에서45화면 렌더/입력/큰 글자 확인. 브라우저 정책 차단을 임시 서버·다른 자동 브라우저로 우회하지 않는다. 현재 모든 finalPixelStatus=NOT_FINALIZED와 browserReview=NOT_EXECUTED를 유지한다.
3. [92](92-DESIGN-CLOSURE-HANDOFF.md)의 서비스·기기·권리·밸런스 실행 게이트는 구현/실제 환경의 증거로만 해소한다. 문서 반복 작성으로 PASS를 만들지 않는다.
4. 다른 작업자는 START-HERE → STATUS →14 →91 →127/128 → 담당 상세 계약 순서로 읽는다. 앱/엔진/API/Neon/인증/APK 구축은 별도 구현 착수 지시 전 시작하지 않는다.

현재11묶음 표시안은 작업 기준으로 승인됐다. 남은 검수는 실제 허용 환경에서의 렌더·입력·접근성 확인이며 새 게임 규칙 선택이 아니다. 새로운 경기·성장·드래프트·병역 규칙을 추가로 결정할 필요가 생기면 선택지를 제시하고 사용자 결정을 받는다. 기술 실행이나 권리 검수 미완료를 새 게임 규칙 질문으로 바꾸지 않는다.

## 설계 보드 후속 점검

2026-10-20: 설계 보드에 최신 승인 모음·팀 배지·카드·아이콘11묶음 링크를 반영하고 접근성 소스를 보완했다. 파일 기반13검사 통과(이미지60·입력37·표6). 실제 file: 보드 관찰은 브라우저 URL 보안 정책으로 차단돼 렌더·키보드·스크린리더 검수는 미실행. 우회하지 않았으며45화면의 미검수 플래그를 유지한다. 이미지80/TODO0/CODE_ONLY11과 게임 규칙은 불변, 게임 구현 미착수. [129](129-DESIGN-BOARD-REFRESH-ACCESSIBILITY.md)를 현재 검수 증거로 함께 읽는다.

---

<!-- SOURCE: 129-DESIGN-BOARD-REFRESH-ACCESSIBILITY.md -->

# 129. 설계 보드 최신화·접근성 점검

2026-10-20 / STATIC_SOURCE_CHECKED_RENDER_BLOCKED. 사용자가 메인 설계 보드 최신화와 화면 렌더·접근성 검수를 요청했다. 게임 기능 구현은 하지 않는다.

## 반영 결과

- [메인 설계 보드](design-board.html)에 최신 승인 모음을 추가: 대학/군 체육팀 컬러 배지10개, 연대기 카드3종, 코드 표시11묶음 보드와 승인 이미지 전체 링크.
- 승인 브랜드 아이콘·청춘 애니 메인 장면·얼굴 없는 실루엣을 사용. 네이비/블루 기준에 맞춰 본문·선택·링크·헤더를 정리하고 기존 글꼴을 유지했다.
- 대학 선택 시연과 대학 홈·군 체육팀에 승인 배지를 연결했다. 그림 때문에 선발·획득 결과를 암시하지 않도록 승인 자산 참고 영역과 실제 게임 예시를 구분했다.
- 보관 복사 예시를6능력으로 보강: 최고92/88/86/94/80/76 → 시작46/44/43/47/40/38, 종합43.0. 19세·최고치50%·원본 불변 규칙을 그대로 설명한다.
- 본문 건너뛰기·포커스 외곽선·내비게이션 이름·화면 제목 연결, 표 캡션2개와 열머리 scope, 표 내부 스크롤 영역, 줄바꿈/좁은 화면 스타일과 reduced-motion을 보완했다.
- 버튼처럼 그려져 있었지만 동작이 없던61개는 네이티브 disabled 버튼으로 표시했다. 기존 난이도·학교·확률·상태·중계 감상 입력 시연은 유지하며 실제 게임 명령을 새로 만들지 않았다.

## 실행한 파일 기반 접근성 점검

[기계 판독 결과](design-board-accessibility-audit.json). HTML 파일을 로컬 파서로 읽고 명시한 색상 토큰만 계산했다. 브라우저 DOM/axe 실행이나 실제 스크린리더 점검이 아니다.

| 검사 | 결과 |
|---|---|
|SA01 · unique source IDs|PASS_STATIC|
|SA02 · language and landmark markup|PASS_STATIC|
|SA03 · image alternative attribute|PASS_STATIC|
|SA04 · static input names|PASS_STATIC|
|SA05 · table captions and column scope|PASS_STATIC|
|SA06 · in-page anchor references|PASS_STATIC|
|SA07 · nonfunctional example button semantics|PASS_STATIC|
|SA08 · declared keyboard and motion styles|PASS_STATIC|
|SA09 · declared narrow layout and table overflow styles|PASS_STATIC|
|SA10 · static file references|PASS_STATIC|
|SA11 · approved catalog visibility in source|PASS_STATIC|
|SA12 · six-ability archive example|PASS_STATIC|
|SA13 · selected opaque token contrast|PASS_STATIC|

총13개 정적 검사 통과. 소스 이미지60개 alt 속성, 정적 입력37개 이름 연결, 표6개 캡션/열머리, ID/앵커/파일 참조를 확인했다. 런타임 생성 라디오·상태 선택·포커스·키보드 처리는 미실행이다.

선택한 단색 토큰6쌍의 대비는6.09~12.79:1이다. 배경 일러스트 위 텍스트·모든 상속색·실제 계산된 CSS 대비나 전체 WCAG 준수를 증명하지 않는다.

## 렌더 검수 시도와 차단

현재 사용자가 열어둔 file: 설계 보드를 cua.getTab으로 관찰하려고 했으나 브라우저 URL 보안 정책이 거절했다. 허용 프로토콜이http/https이며 file:은 허용되지 않는다는 응답이었다. 현재 URL을 임시 서버·다른 브라우저·CDP로 바꾸는 우회는 시도하지 않았다.

- 실제 뷰포트 캡처:0
- 360/390/768/1280px 렌더:BLOCKED_BY_BROWSER_URL_POLICY
-200% 확대·키보드 포커스·터치·스크린리더:NOT_EXECUTED
- 화면45개 finalPixelStatus=NOT_FINALIZED / browserReview=NOT_EXECUTED 유지
- WCAG 준수 결론:NOT_ESTABLISHED

따라서 이 작업의 완료 범위는 보드 최신화·정적 접근성 보완·파일 기반 검증이다. 실제 화면 잘림·오버레이 대비·키보드 시연은 허용된 검수 환경이나 사용자 직접 확인의 별도 증거가 있어야 마감한다. 별도 사용자 요청 없이 웹 게시·앱 서버/DB 구축을 진행하지 않는다.

## 저장·인계

원본은 V:/docs/design 이다. 기존 열람용 복사 폴더의 보드와 연결 파일도 같은 승인본으로 갱신한다. 원본 MD·상태·검증·통합 설계서·무결성 목록을 갱신하고 기존 정상 Git 체크아웃으로 커밋·푸시한다. V:의 .git는 수정하지 않는다.

---

<!-- SOURCE: 130-PREIMPLEMENTATION-HANDOFF.md -->

# 130. 구현 전 설계 인계 기준 — 완료 범위와 열린 검수

2026-10-20 / DESIGN_HANDOFF_WITH_OPEN_EXECUTION_GATES. 사용자는 실제 구현 전에 할 수 있는 화면 확인·문제 수정·최종 인계 세 항목을 진행하도록 요청했다. 이 문서는 구현 허가나 모든 실행 검수 통과 선언이 아니다. 기준 작업 커밋497b170 이후의 마감 인계이며 실제 최종 파일 버전은 Git 이력과 무결성 목록을 따른다.

## 세 항목의 현재 결과

| 요청 | 처리한 범위 | 현재 제한 |
|---|---|---|
|실제 화면·접근성 검수|기존 관찰 시도의 보안 차단 근거 확인, 정적13검사와 화면45×8상태·4크기 계약 대조, 후속 검수 절차 정리|실제 렌더·키보드·스크린리더 미실행. 같은 file: 차단을 반복하거나 다른 주소로 우회하지 않음|
|발견한 화면 문제 수정|최신 승인 모음 연결,6능력 보관 예시,표 캡션·열머리·포커스·건너뛰기·비동작 버튼 구분과 좁은 화면 CSS 보완|실제 픽셀에서 발견한 문제를 고쳤다고 주장하지 않음. 렌더 이후 추가 발견 가능|
|최종 인계|이130·기계 판독 준비표·진입 문서·현재 계약 지도·체크포인트·검증 기록·통합MD·무결성 목록 정리|앱/엔진/API/Neon/인증/APK 착수는 별도 사용자 지시 필요|

## 현재 기준 표

[기계 판독 인계표](preimplementation-readiness.json). 모든 수치는 논리 항목 수이며 이미지 물리 파일 총수나 실제 테스트 실행 수로 바꾸지 않는다.

| 분야 | 현재 상태 | 해석 |
|---|---|---|
|제품·규칙·사용자 결정|SPECIFIED|기존 결정·분야별 원문 기준. 신규 게임 규칙 없음.|
|화면45·이벤트99·기대값|STATIC_CHECKED_NOT_EXECUTED|핵심298·전체23묶음은 서면 기대값. 실제 엔진 시험 통과 아님.|
|이미지 파일 제작|FILES_READY|EXISTS80/TODO0/CODE_ONLY11/LEGACY1. 이미지 존재와 게임 내 연동은 별개.|
|코드 표시11묶음|APPROVED_WORKING_BASELINE|현재 시각안 승인. 실제 앱 구성요소는 미구현.|
|45화면×8상태·4크기|SPECIFIED_STATIC_REFERENCES_CHECKED|정상/로딩/빈/오류/제출/충돌/긴내용/자산실패 계약. 실제 렌더0.|
|메인 보드·정적 접근성 수정|STATIC_CHECKED|13파일 검사 통과. 소스 이미지60·입력37·표6. 실제 계산 스타일/스크린리더 준수 미판정.|
|실제 화면 렌더 검수|BLOCKED_BY_BROWSER_URL_POLICY|file: 관찰 차단. 주소 변환/대체 브라우저/CDP 우회 없음.|
|200%·키보드·터치·스크린리더|NOT_EXECUTED|실제 허용 환경 증거 필요. 정적 소스 검사로 PASS 대체 금지.|
|다른 환경으로 설계 인계|PACKAGED|현재 기준·승인 자산·차단 사항·검증 방법과 구현 중단선 정리.|
|게임·API·DB·인증·빌드·APK|NOT_IMPLEMENTED_NOT_AUTHORIZED|사용자 구현 착수 지시 전 시작하지 않음. V01~V12 실행 증거는 구현 단계에서 별도.|

## 다른 곳에서 이어갈 때 읽을 순서

1. [START-HERE](START-HERE.md) → [STATUS](STATUS.md) → [14 사용자 결정](14-CANONICAL-DECISIONS.md).
2. [91 현재 계약 지도](91-CURRENT-CONTRACT-INDEX.md)에서 담당 범위의 원문을 찾는다. 가장 큰 문서 번호가 모든 규칙을 대체하지 않는다.
3. 시각 작업은 [124 제작 목록](124-IMAGE-PRODUCTION-BRIEF.md)·[127 코드 표시](127-CODE-DISPLAY-SPECIFICATION.md)·[128 화면 대조](128-PREIMPLEMENTATION-SCREEN-AUDIT.md)·[129 검수 증거](129-DESIGN-BOARD-REFRESH-ACCESSIBILITY.md).
4. 실행 검수는 [92](92-DESIGN-CLOSURE-HANDOFF.md), 구현 순서 참고는 [120](120-IMPLEMENTATION-ROADMAP.md). 이 문서를 읽었다는 이유로 M0를 시작하지 않는다.
5. [HANDOFF-PROMPT](HANDOFF-PROMPT.md)를 새 채팅에 전달하고 현재 실제 파일·Git 상태를 확인한다. 대화 기억만으로 진행하지 않는다.

## 다시 결정하지 않을 핵심

- 커리어·독립 구단과 보관 선수 선택 투입, 고교/대학/KBO/미국 직행·포스팅·국제대회·병역 경로는 원래 범위다.
- 종류별6능력·주요 성장4개·영구6능력 평균 종합 상한100. 능력100이 타율1.000을 보장하지 않으며 장타율은1을 넘을 수 있다.
- 보관 원본은 불변,19세·능력별 커리어 최고50%·새 잠재력·병역 재시작. 같은 원본은 같은 구단 세계에서 선수 또는 지도자 한 역할만.
- 특성 기록 해금·보유 효과 전체 조건부 자동 적용. 목표/도전 보상은 기념 외형만. 중계는 확정 로그 감상·스킵·다시보기.
- 개인/구단 치트의 이미 정한 보장·잠재력100·양의성장 및 구종XP3배 범위는14와 해당 상세를 따른다. 확률1 숫자 배지와 단순 변경 적용100%는 표시하지 않는다.
- 메인 청춘 야구 애니, 선수 카드 얼굴 없는14실루엣, 기본 네이비/블루. 학교 배지는 고유 색, 사건 그림 우리팀 네이비와 상대 버건디 구분. 실제 구단 공식 로고를 임의 재색칠하지 않는다.
- 웹은Android/iPhone/Windows/macOS, 설치형Android APK가 기본. APK가iOS/PC 설치 파일은 아니다. 별도 네이티브 배포는 원래 선택 범위.

## 실제 화면 검수의 실행 조건과 기록

현재 로컬 file: 주소는 브라우저 URL 정책에 차단됐다. 현재 차단을 우회하기 위해 임시 서버·다른 자동 브라우저·CDP를 쓰지 않는다. 사용자 직접 확인이나 허용된 검수 환경에서 확보한 실제 증거가 있을 때만 아래 결과를 갱신한다. 허용된 환경이 생겼다는 사실도 먼저 확인하며 웹 게시·공개 배포를 자동 진행하지 않는다.

- 45화면의 정상 상태를 먼저 보고, 화면별 해당8상태와360/390/768/1280 크기의 경계 사례를 확인한다. 읽기전용 제출 상태는 해당 없음 사유를 기록한다. 선언된 조합을 실행한 조합으로 세지 않는다.
- 이름16자·긴 팀명·종합100.0·큰 금액, 헤더와 세이프 영역·키보드, 그림 크롭과 표 내부 스크롤을 확인한다.
- 200% 확대·Tab/Shift+Tab·Enter/Space·포커스 복귀·실제 접근 가능한 이름·동적 상태 알림·reduced-motion을 확인한다. 스크린리더 결과는 사용한 제품/버전을 기록한다.
- 이미지 실패는 로고/실루엣 카드/배경 각각 이름·역할·단색면 대체를 확인한다. 실제 확률1 숫자 숨김·미해금 히든 비공개·확정 전 결과 그림 금지를 확인한다.
- 증거에는 screenId/state/viewport/zoom/inputMethod/browserOrDevice/fontState/assetState/sourceCommit/result/issueRefs와 캡처를 연결한다. 빈 템플릿의 결과값은 NOT_EXECUTED다.
- 문제는 해당 증거에 연결해 수정하고 같은 사례를 재확인한다. 모든 범위가 통과하기 전45개 finalPixelStatus/browserReview를 일괄 PASS로 바꾸지 않는다.

## 검증·패키지 사용법

V: 루트에서 다음 세 정적 검사를 사용한다. 앱 빌드나 브라우저 시험이 아니다.

~~~text
node docs/design/verify-design.mjs
node docs/design/verify-state-ui.mjs
node docs/design/verify-art-direction.mjs
~~~

DESIGN-ALL은 원문을 모은 전달본, MANIFEST-SHA256.csv는 파일 무결성 목록이다. 원문 수정 후 둘을 다시 만들고 검증 기록과 함께 커밋·푸시한다. 기존 정상 작업용 Git 체크아웃을 사용하며 비어 있는 V:/.git는 수정/초기화하지 않는다. 열람용 폴더는 복사본이고 원본은 V:/docs/design이다. 비밀값은 인계 파일/로그에 넣지 않는다.

## 구현 전 마감의 종료선

현재 가능한 서면·정적 작업은 인계했다. 열린 실제 검수는 위 한계대로 남겨두며 문서를 늘려 실행 PASS를 대신하지 않는다. 별도 구현 착수 요청이 오면120의 M0 전에 해당 요청과 필요한 실행 시점 정보를 확인한다. 기존 사용자 결정을 다시 질문하지 않는다. 실제 서비스/서명/배포 정보는 해당 마일스톤에서만 묻는다.

## 구현 직전 최종 리뷰

[131](131-FINAL-DESIGN-REVIEW.md)의5개 정합 정정과 패키지 무결성 보완을 반영했다. 이는 기존 규칙의 해석 정리이며 구현·실행 PASS를 추가하지 않는다.

---

<!-- SOURCE: 131-FINAL-DESIGN-REVIEW.md -->

# 131. 구현 직전 최종 설계 리뷰

2026-10-20 / FINAL_DOCUMENT_REVIEW. 사용자 요청은 마지막 설계 점검이며 이번 작업에서 앱·엔진·API·DB·APK 구현은 시작하지 않았다. 검토 시작 Git 기준155abd2. 기존 자동 검증만 반복하지 않고 초기 원문과 후속 확정 계약의 의미 충돌을 대조했다.

## 결론

이번 검토 범위에서 새 게임 규칙을 선택해야 할 미결정 사항은 발견하지 않았다. 아래5개 문서/인계 정합 문제를 기존 확정 원문에 맞춰 정정했다. 기본 구현 골격 M0를 시작할 설계 자료는 갖춰져 있다. 이 판단은 실제 경기 밸런스·API/DB·인증·빌드·기기·최종 화면 검수 PASS와 다르다.

## 발견 사항과 정정

| ID | 중요도 | 발견한 위험 | 기존 기준·처리 | 상태 |
|---|---|---|---|---|
|FR01|높음|06의 POST /api/saves·creationRequestId를 그대로 구현하면78의 생성 job·이어하기·멱등 계약과 다른 API를 만들 수 있음|06을78의 POST /api/game-creations·owner 범위 creationId로 통일, 이전 명칭은 폐기임을 명시|문서 정정 완료|
|FR02|높음|78에 생성 전 개인 잠재력 범위와 홈의 만들던 게임 카드·여러 완료 작업 나열 설명이 남아79/76 최신 기준과 충돌|생성 전 분포 설명/생성 후 평가 범위로 구분. 홈 이어하기 버튼만, 상태 처리는 생성 화면·필요한 대상 선택은 기존 목록. 최근 플레이 임의 변경 금지 유지|문서 정정 완료|
|FR03|높음|24의 추가홈진루 성공률70% 고정과 동률ID 문구는41의 주루/견제 산식·70의 복원 불변키와 다르게 옮겨질 수 있음|2아웃·주루≥60 및41의 clamp 산식을 명시. 동률은 물리rowId가 아닌 simulationKey를 사용한다고 정리|문서 정정 완료|
|FR04|높음|06의 응답 state/stateChanges가 DB SaveState 원본인지 공개 DTO인지 명확하지 않아 잠재력/seed/히든 조건 비공개 계약을 누락할 수 있음|06/28에67/75/100 공개 projection을 명시. 일반 화면 응답과70 내부 백업 상태를 구분. 실제 응답 누출이 발생했다는 뜻은 아님|문서 정정 완료|
|FR05|보통|SHA 목록에 Git에 없는 Windows Thumbs.db 포함. HTML/CSS의CRLF와 Git LF 정규화 때문에 새 체크아웃의 바이트 검증이 달라질 수 있음|생성기에서 OS 캐시 제외, 현재 두 파일 LF 정리, .gitattributes에 CSS/SVG LF 규칙 추가. 원본 그림·게임 규칙은 변경하지 않음|패키지 정정 완료|

고정 성공률·생성 경로·홈 문구의 최초 표현을 단순히 여러 문서에 보존하는 대신 실제 구현자가 먼저 읽는 원문을 수정했다. 이 정정은 새 확률·API 기능·해금/보상·게임 규칙을 추가하지 않는다.

## 검토한 범위와 증거의 한계

| 영역 | 점검 |
|---|---|
|생성·종류·초기값|79/78/122의6능력·집중4·투구폼·치트 발견·단일 생성·공개 시점|
|성장·치트·XP|90/85의 기본예산/실제소비/지급·상한손실·이적과 복원·배율 중복 금지|
|경기·기록|24/41/08과 자동 산술 검사의 주루/견제·자동주자·outs·AVG/SLG·능력100 비보장|
|진로·대학·병역|34/43/21 및 기존 동선 검사의 미국 카드 조건·대학 일정·복무와 메달 구분|
|API·저장·복구|06/28/64/74/70/72의 소유권·receipt·revision·원자 활성화·불변 논리키·공개 정보|
|화면·자료|45화면/99이벤트·핵심298/전체23기대값 묶음·이미지80/TODO0·CODE_ONLY11의 원본 대조|
|Git·인계|원본V:와 정상 체크아웃·열람용 복사본·통합MD·파일 목록의 정합. 비어 있는V:/.git는 수정하지 않음|

이는 모든 문장의 무오류 증명이나 실행 검증이 아니다. 스크립트가 검증하는 산술/정적 참조와 사람이 대조한 의미 범위를 구분한다. 전체 문서의 과거 진행 이력은 현재 기준으로 재해석하지 않는다.

## 구현을 시작할 때 지킬 것

1. [120](120-IMPLEMENTATION-ROADMAP.md)의 M0부터 시작해 빌드/타입/규칙 정의의 골격을 먼저 확인한다. 디자인 보드의 시연 코드를 실제 엔진으로 복사하지 않는다.
2. 서비스 연결 시 실제 런타임·인증 지원·SDK·접속 환경을 [92 V 게이트](92-DESIGN-CLOSURE-HANDOFF.md)에서 확인한다. 현재 설계의 후보를 이미 연결된 서비스라고 쓰지 않는다.
3. 핵심298과 전체23기대값 묶음은 테스트를 옮길 원본이다. NOT_EXECUTED를 실제 실행 전 PASS로 바꾸지 않는다. 같은 계산식으로 기대값까지 다시 생성해 자기 검증하지 않는다.
4. 기존 file: 렌더 관찰 차단은 그대로다.129의 실제 렌더·키보드·스크린리더 미실행과 V01~V12를 열린 항목으로 인계한다. 정책 우회나 개발 전 실행 성공 주장은 하지 않는다.
5. 사용자 착수 요청이 오면 현재 사람의 요청을 우선한다. 이 리뷰 자체는 앱 생성·배포·운영 DB 쓰기를 실행한 기록이 아니다.

현재 기본 구조는06의 TypeScript/React·Vite/Hono Node/Drizzle·Neon/Capacitor 설계안이다. 실제 의존성 버전·인증/호스팅·APK 서명·자산 배포 권리·장기 밸런스는 해당 구현 단계에서 확인해야 한다. 새 게임 규칙 질문으로 기존 결정을 반복하지 않는다.

## 최종 검증 결과

verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 모두 종료코드0/PASS. 설계 파일359개를 MANIFEST의 경로·크기·SHA256으로 작업 폴더와 Git staged blob 양쪽에서 확인해359/359 일치, tracked 파일 집합도 정확히 일치했다. OS 캐시 항목0. 실제 앱 빌드/경기/DB/브라우저 검수가 아니라 설계 파일·정적 계약의 검증 결과다.

---

<!-- SOURCE: EVENT-CATALOG.md -->

# 이벤트 전체 문안 — 99종 설계용

## E01 · 마지막 고교의 겨울

마지막 고교 시즌을 앞둔 겨울입니다. 잘하는 것을 더 날카롭게 만들까요, 빈 곳을 메울까요?

발생: HS_PRE, 고유

- 육성4개선택 → 시즌집중계획을저장했습니다. (CHOOSE_FOCUS)
- 현재계획유지 → 현재 계획을 그대로 유지합니다. 새로 저장되는 계획은 없습니다. (KEEP_FOCUS)

## E02 · 타격 자세의 갈림길

배트가 늦는 장면과 멀리 날아간 타구를 함께 돌려봅니다. 코치는 스윙의 방향을 정해 보자고 합니다.

발생: 고교 타자, 12경기

- 컨택포함육성계획검토 → 4개육성계획을확인했습니다. (CHOOSE_FOCUS)
- 유지 → 현재 계획을 그대로 유지합니다. 새로 저장되는 계획은 없습니다. (KEEP_FOCUS)

## E03 · 마운드의 과제

빠른 공과 정확한 공 사이에서 무엇을 먼저 다듬을지 결정할 때입니다.

발생: 고교 투수, 12경기

- 제구또는구속포함계획검토 → 4개육성계획을확인했습니다. (CHOOSE_FOCUS)
- 유지 → 현재 계획을 그대로 유지합니다. 새로 저장되는 계획은 없습니다. (KEEP_FOCUS)

## E04 · 스카우트의 질문

스카우트가 성적표를 덮고 어떤 야구를 하고 싶은지 묻습니다.

발생: HS_RESULT

- 졸업진로비교 → 희망구단은지명을보장하지않습니다. (OPEN_ROUTE)

## E05 · 지명을 기다리는 날

{team}의 지명 명단에 이름이 올랐습니다. 프로의 문 앞에서 첫 계약을 바라봅니다.

발생: DRAFT_RESULT

- 계약확인 → 계약확정전에는소속이바뀌지않습니다. (ACCEPT_CAREER_OFFER)
- 계약거절후진로확인 → 계약을 거절했습니다. 소속은 바뀌지 않고 가능한 진로를 다시 확인합니다. (DECLINE_DRAFT)

## E06 · 이름이 불리지 않았다

마지막 이름이 불린 뒤에도 자리에 남았습니다. 이번 드래프트에는 지명되지 않았습니다.

발생: UNDRAFTED

- 재학또는재도전검토 → 가능한진로와남은재도전횟수를확인합니다. (OPEN_UNDRAFTED_ROUTES)
- 선수생활종료검토 → 선수 생활 종료를 검토합니다. 확정 전에는 은퇴하지 않습니다. (REQUEST_RETIRE)

## E07 · 다시 받은 기회

다시 준비한 시즌 끝에 계약서가 도착했습니다. 화려한 출발은 아니지만 그라운드로 갈 길이 열렸습니다.

발생: RETRY_RESULT, 제안 존재

- 계약확인 → 선택한진로를확정했습니다. (ACCEPT_CAREER_OFFER)
- 종료검토 → 선수 생활 종료를 검토합니다. 확정 전에는 은퇴하지 않습니다. (REQUEST_RETIRE)

## E08 · 프로의 첫 캠프

프로의 첫 캠프입니다. 주변의 훈련 속도와 경쟁의 밀도가 낯설게 느껴집니다.

발생: 첫 PRO_PRE

- 육성4개확인 → 프로첫시즌계획을저장했습니다. (CHOOSE_FOCUS)
- 현재계획유지 → 현재 계획을 그대로 유지합니다. 새로 저장되는 계획은 없습니다. (KEEP_FOCUS)

## E09 · 첫 1군 호출

감독실에서 연락이 왔습니다. 1군에 빈자리가 생겨 합류 여부를 묻습니다.

발생: FUTURES, 자리 존재, 경쟁점수 충족

- 1군합류 → 1군등록과실제출장은별개입니다. (ACCEPT_CALLUP)
- 다음평가대기 → 이번 호출은 보류합니다. 다음 평가에서 다시 검토될 수 있으며 1군 등록은 되지 않습니다. (DEFER_CALLUP)

## E10 · 짧은 기회의 무게

첫 호출 이후의 시간이 지나고 있습니다. 기회를 붙잡는 방식에 대해 코치와 이야기합니다.

발생: 첫 콜업 후20경기

- 역할평가요청 → 현재경쟁점수로역할을재평가합니다. (REQUEST_ROLE_REVIEW)
- 현역할유지 → 현재 역할을 유지합니다. 역할 재평가는 요청하지 않았습니다. (ACK_EVENT)

## E11 · 두 번째 숙제

지난시즌을돌아보며다음시즌에집중할네가지능력을정리합니다.

발생: 2군 한 시즌 종료

- 육성4개재검토 → 다음시즌의성장계획을준비했습니다. (CHOOSE_FOCUS)
- 현재계획유지 → 현재 계획을 그대로 유지합니다. 새로 저장되는 계획은 없습니다. (KEEP_FOCUS)

## E12 · 주전과 백업 사이

선발보다 벤치에서 지켜보는 날이 많아졌습니다. 지금 자리를 지킬지 새 수비 위치도 준비할지 결정할 때입니다.

발생: 1군 타자, 출장비율<40%

- 전환자리선택 → 새자리는적응훈련과기용경쟁이필요합니다. (START_POSITION_PLAN)
- 현재포지션유지 → 현재 포지션을 유지합니다. 전환 계획은 시작되지 않습니다. (ACK_EVENT)

## E13 · 낯선 수비 자리

새 자리에서의 훈련 기간이 지났습니다. 코치는 이제 등록 포지션을 바꿀지 묻습니다.

발생: E12 START_POSITION_PLAN 확정 후 계획24경기 완료

- 전환확정 → 이후 경기부터 새 자리로 등록 포지션을 바꿉니다. (CONFIRM_POSITION)
- 기존자리복귀 → 기존 등록 포지션을 유지하고 전환 계획을 종료합니다. (CANCEL_POSITION_PLAN)

## E14 · 선발의 문

선발 자리에 공백이 생겼습니다. 코치가 긴 이닝을 맡을 생각이 있는지 묻습니다.

발생: RP, 체력≥60, SP 공석

- 선발경쟁지원 → 선발자격과공석을다시검사합니다. (REQUEST_SP_REVIEW)
- 불펜유지 → 불펜 보직을 유지합니다. 선발 경쟁 검토는 요청하지 않았습니다. (ACK_EVENT)

## E15 · 마지막 아웃의 자리

마지막 아웃을 맡을 후보를 찾고 있습니다. 준비의 방식과 부담이 달라질 수 있습니다.

발생: RP, 위기≥60, CP 공석

- 마무리경쟁지원 → 마무리자격과공석을다시검사합니다. (REQUEST_CP_REVIEW)
- 현보직유지 → 현재 보직을 유지합니다. 마무리 경쟁 검토는 요청하지 않았습니다. (ACK_EVENT)

## E16 · 구속보다 안정

볼넷으로 시작한 이닝이 길어지고 있습니다. 공의 위력보다 먼저 손볼 과제가 보입니다.

발생: 투수, BB9>4.5, 20이닝 이후

- 제구포함육성검토 → 포함할능력4개를직접확인했습니다. (CHOOSE_FOCUS)
- 현재계획유지 → 현재 계획을 그대로 유지합니다. 새로 저장되는 계획은 없습니다. (KEEP_FOCUS)

## E17 · 긴 무안타

안타가 나오지 않는 타석이 이어졌습니다. 타격 코치가 잠깐 접근을 바꿔 보자고 합니다.

발생: 타자, 최근20AB H=0

- 교타형계획검토 → 변경기회가있을때새유형을선택합니다. (OPEN_STYLE)
- 현재유형유지 → 현재 유형을 유지합니다. 유형 변경은 하지 않았습니다. (ACK_EVENT)

## E18 · 장타가 필요한 때

공은 맞지만 담장 근처까지 가는 타구가 드뭅니다. 강하게 치는 접근을 잠시 시도할 수 있습니다.

발생: 타자, 100AB HR≤1

- 거포형계획검토 → 능력은즉시바뀌지않고이후성장에반영됩니다. (OPEN_STYLE)
- 현재유형유지 → 현재 유형을 유지합니다. 유형 변경은 하지 않았습니다. (ACK_EVENT)

## E19 · 흔들린 두 경기

두 번의 등판에서 많은 점수를 내줬습니다. 로테이션을 한 번 쉬고 정리할 기회가 있습니다.

발생: SP, 최근2등판 ER≥10

- 한차례등판휴식요청 → 부상여부와팀운용을검사해휴식계획을반영합니다. (REQUEST_REST)
- 현재운용유지 → 현재 운용을 유지합니다. 휴식 계획은 만들지 않았습니다. (ACK_EVENT)

## E20 · 코치의 조언

기록을 보고도 무엇부터 바꿔야 할지 선뜻 답이 나오지 않습니다. 오늘은 혼자만 생각하지 않아도 됩니다.

발생: 최근20경기성적지수≤40,일반조언쿨다운충족

- 육성계획확인 → 조언만으로영구능력이오르지않습니다. (OPEN_DEVELOPMENT)
- 현재계획유지 → 현재 계획을 유지합니다. 조언만으로 영구 능력이 오르지 않습니다. (ACK_EVENT)

## E21 · 작은 통증

경기 뒤 작은 통증이 남았습니다. 검사 결과 회복에 시간이 필요합니다.

발생: 부상 판정 경미 시

- 회복일정확인 → 부상기간에는경기에출장하지않습니다. (ACK_INJURY)

## E22 · 긴 재활

예상보다 재활 기간이 길어졌습니다. 복귀 뒤 첫 경기들을 어떻게 맞을지 의료진과 상의합니다.

발생: 부상 중간/중대 시

- 재활일정확인 → 회복까지팀경기수를기준으로진행합니다. (ACK_INJURY)

## E23 · 돌아온 그라운드

다시 출전할 수 있다는 소식을 받았습니다. 곧바로 원래 역할을 요청할 수도, 짧게 적응할 수도 있습니다.

발생: 부상 회복 직후

- 복귀확인 → 복귀후현재경쟁에서다시기회를얻습니다. (CONFIRM_RETURN)

## E24 · 처음 받은 박수

전광판에 개인 기록이 소개됐습니다. 혼자 남긴 숫자처럼 보여도 그 뒤에는 함께한 사람들이 있습니다.

발생: 첫100H 또는 첫10승/20SV

- 기록확인 → 첫이정표를커리어에남겼습니다. (ACK_EVENT)

## E25 · 올스타의 초대

올스타 행사 초대가 도착했습니다. 축제에 함께하거나 남은 시즌을 위해 쉴 수 있습니다.

발생: 시즌중 성적 상위, 고유 시즌

- 올스타선정확인 → 선정이력만남기며가상올스타경기기록은만들지않습니다. (ACK_EVENT)

## E26 · 라이벌의 등장

같은 자리를 노리는 선수가 좋은 모습을 보입니다. 경쟁을 피할 수는 없지만 대응은 고를 수 있습니다.

발생: 동포지션 경쟁점수±5

- 경쟁상황확인 → 경쟁은능력과최근기록으로판정합니다. (OPEN_COMPETITION)
- 계속진행 → 계속 진행합니다. 경쟁 상황 확인은 하지 않았습니다. (ACK_EVENT)

## E27 · 포스트시즌의 긴장

처음 맞는 포스트시즌입니다. 한 타석과 한 이닝의 무게가 다르게 느껴집니다.

발생: 첫PS

- 포스트시즌시작 → 포스트시즌기록은정규와분리합니다. (ACK_EVENT)

## E28 · 우승 뒤의 겨울

긴 시즌의 마지막에 팀이 우승했습니다. 축하가 지나면 다음 시즌도 찾아옵니다.

발생: 팀 우승, OFFSEASON

- 우승기록확인 → 우승이자연성장예산을추가하지않습니다. (ACK_EVENT)

## E29 · 첫 개인상

처음으로 개인상 명단에 이름을 올렸습니다. 마이크 앞에서 짧은 소감을 남깁니다.

발생: 첫 수상

- 수상이력확인 → 수상이확정된뒤기록실에남깁니다. (ACK_EVENT)

## E30 · 재계약 제안

구단이 계약 조건을 제시했습니다. 적용 기간과 역할, 연봉을 확인합니다.

발생: 비FA CONTRACT — 다음 시즌 또는 복귀 잔여 시즌 일할 재계약

- 조건비교 → 계약서수락은확정행동입니다. (OPEN_CAREER_OFFERS)
- 은퇴검토 → 선수 생활 종료를 검토합니다. 확정 전에는 은퇴하지 않습니다. (REQUEST_RETIRE)

## E31 · FA 시장의 문

FA 자격을 얻었습니다. 익숙한 팀과 새로운 팀이 각기 다른 미래를 제안합니다.

발생: 자격 충족 CONTRACT

- FA제안비교 → 없는계약을가짜제안으로보이지않습니다. (OPEN_CAREER_OFFERS)
- 국내복귀가능검토 → 국내 복귀 가능 여부를 보유권과 병역까지 함께 확인합니다. (OPEN_RETURN)

## E32 · 익숙한 유니폼

남는 길과 떠나는 길이 모두 열려 있습니다. 유니폼보다 계약 조건과 앞으로의 역할도 함께 봅니다.

발생: FA 원구단/타구단 제안 존재

- 선택제안계약확인 → 마지막확정전금액과기간을확인합니다. (ACCEPT_CAREER_OFFER)
- 다른제안비교 → 다른 제안과 비교합니다. 계약은 확정되지 않았습니다. (BACK_TO_OFFERS)

## E33 · 베테랑의 역할

이제 어린 선수들이 먼저 조언을 구합니다. 팀에서 요구하는 역할도 조금씩 달라지고 있습니다.

발생: 나이≥33, 백업 전환

- 백업역할수락 → 제안이있을때만다른계약을선택할수있습니다. (ACCEPT_ROLE)
- 다른제안검토 → 다른 계약 제안을 확인합니다. 백업 역할은 수락하지 않았습니다. (OPEN_CAREER_OFFERS)

## E34 · 전력 외 통보

다음 시즌 전력 구상에서 제외됐다는 연락을 받았습니다. 남은 기회를 시험하거나 유니폼을 내려놓을 수 있습니다.

발생: 계약 미보유, 팀 후보 제외

- 남은진로검토 → 권리와재도전자격을검사합니다. (OPEN_UNCONTRACTED_ROUTES)
- 종료검토 → 선수 생활 종료를 검토합니다. 확정 전에는 은퇴하지 않습니다. (REQUEST_RETIRE)

## E35 · 마지막 테스트 결과

여러 번의 준비를 마쳤지만 현재 체결할 계약과 남은 진로가 없습니다. 여기까지의 기록을 보관할 수 있습니다.

발생: 준비시즌3회소진/유효오퍼0/대학복학등다른합법진로0

- 은퇴및기록보관 → 남은합법진로가없을때마지막기록을보관합니다. (CONFIRM_RETIRE)

## E36 · 떠날 시기를 고르다

{age}세 시즌을 마쳤습니다. 지금의 기량과 지나온 기록을 보며 다음 봄을 생각합니다.

발생: 수동 은퇴 가능 OFFSEASON

- 은퇴확정 → 은퇴를 확정합니다. 이후 은퇴 정산과 연대기 정리로 이어집니다. (CONFIRM_RETIRE)
- 계속플레이 → 은퇴하지 않고 계속 플레이합니다. (CANCEL_RETIRE)

## E37 · 마지막 인사

마지막으로 그라운드를 돌아봅니다. 시작할 때는 알 수 없던 기록과 이야기가 남았습니다.

발생: RETIRED

- 보관선수확인 → 국내커리어의기록을저장했습니다. (OPEN_ARCHIVE)

## E38 · 장기집권의 부담

패배가 이어지고 있습니다. 당장의 변화와 기존 기용의 유지 사이에서 결정을 내릴 수 있습니다.

발생: 구단 3연패, CLB_REVIEW

- 선수단과계약검토 → 연속우승만으로숨은능력하락은없습니다. (OPEN_CLUB_REVIEW)
- 현운영유지 → 현재 운영을 유지합니다. 검토 화면은 열지 않았습니다. (ACK_EVENT)

## E39 · 기회를 원하는 유망주

2군의 어린 선수가 꾸준히 좋은 평가를 받고 있습니다. 지금 1군에 자리를 만들지 검토할 수 있습니다.

발생: 구단2군,22세이하,경쟁점수상위

- 기용검토 → 출전은등록과라인업확정뒤반영됩니다. (OPEN_LINEUP)
- 현기용유지 → 현재 기용을 유지합니다. 기용 검토는 열지 않았습니다. (ACK_EVENT)

## E40 · 한정된 겨울 예산

다음 시즌 예산과 필요한 계약을 함께 놓아 보니 모두 잡을 수는 없습니다. 먼저 지킬 자리를 정해야 합니다.

발생: 구단 오프시즌, 예산<예정연봉

- 예약과지급검토 → 예약과 지급 내역을 확인합니다. 기존 보장 지급 의무는 남아 있습니다. (OPEN_BUDGET)
- 재정재건검토 → 재정 재건 검토를 엽니다. 기존 보장 지급 의무는 그대로 남습니다. (OPEN_REBUILD)

## E41 · 새 시즌의 유형

지금의 장점을 어떤 선수 유형으로 키워 갈까요? 능력은 그대로 두고 이후의 성장 방향을 선택합니다.

발생: 프리시즌 또는 정규일정 절반,유형변경기회남음

- 유형변경 → 변경은이후성장배분에적용합니다. (OPEN_STYLE)
- 현재유형유지 → 현재 유형을 유지합니다. 유형 변경은 하지 않았습니다. (ACK_EVENT)

## E42 · 다른 이름의 선수

이번 시즌의 변화가 선수의 인상을 바꿨습니다. 달라진 별칭과 능력을 함께 확인합니다.

발생: 결산별칭변화. '이번 시즌의 변화가 선수의 인상을 바꿨습니다.'

- 유형이력확인 → 표시별칭이바뀌어도추가보너스는없습니다. (ACK_EVENT)

## E43 · 한 번의 특별훈련

이번 세계 시즌에 한 번 쓸 특별훈련 기회입니다. 확정 성장과 도전 강화, 컨디셔닝을 비교합니다.

발생: 정규일정1/3경기해금,세계시즌usage=0

- 강화선택 → 세계시즌강화기회는한번입니다. (OPEN_TRAINING)
- 나중에사용 → 특별훈련을 나중에 사용합니다. 이번 세계 시즌의 강화 기회는 한 번이며 아직 소비되지 않았습니다. (DEFER_TRAINING)
- 시즌기회포기확인 → 포기를 확인하면 이번 세계 시즌의 강화 기회가 사라집니다. (FORFEIT_TRAINING)

## E44 · 국가의 부름

대표팀이 합류 의사를 물었습니다. 대회 일정과 차출 조건을 확인한 뒤 답합니다.

발생: 최종후보. '대표팀이 합류 의사를 물었습니다.'

- 참가 → 최종등록과실제출장은별도로확인합니다. (ACCEPT_NATIONAL)
- 사양 → 대표팀 참가를 사양했습니다. 최종 등록과 실제 출장은 이루어지지 않습니다. (DECLINE_NATIONAL)

## E45 · 대표팀 밖에서

이번 명단에는 이름이 없었습니다. 원래 소속에서 다음 기회를 준비합니다.

발생: 선발탈락. '이번 명단에는 이름이 없었습니다.'

- 결과확인 → 미선발이능력감소를뜻하지않습니다. (ACK_EVENT)

## E46 · 첫 국제무대

유니폼 앞의 이름이 달라졌습니다. 실제 첫 출장의 기록을 남깁니다.

발생: 대회첫실제출장. '유니폼 앞의 이름이 달라졌습니다.'

- 첫출장확인 → 국제대회개인기록을남겼습니다. (ACK_EVENT)

## E47 · 메달과 다음 의무

팀의 메달과 개인 자격을 따로 확인합니다. 자격을 얻어도 남은 활동 의무가 있습니다.

발생: 올림픽메달/AG금+게임자격충족

- 자격과남은의무확인 → 게임상자격과복무완료는다릅니다. (OPEN_SERVICE_ELIGIBILITY)

## E48 · 돌아오는 비행기

팀의 결과와 내가 뛴 경기를 돌아봅니다. 피로와 부상 상태를 안고 원소속으로 돌아갑니다.

발생: 대회종료. '팀의 결과와 내 경기를 돌아봅니다.'

- 원소속복귀 → 국제대회피로와부상은유지합니다. (CONFIRM_NATIONAL_RETURN)

## E49 · 겨울의 병역계획

다가올 시즌과 복무 계획을 함께 생각합니다. 지원 조건과 유예 기한을 확인합니다.

발생: 미해결오프시즌. '다가올 시즌과 복무 계획을 함께 생각합니다.'

- 상무지원 → 유예불가시사유와가능한복무경로를표시합니다. (APPLY_MILITARY_TEAM)
- 현역입대검토 → 현역 입대를 검토합니다. 확정 전에는 입대하지 않습니다. (START_SERVICE)
- 기한내유예 → 기한 안에서 유예를 요청합니다. 유예 가능 여부와 남은 기한은 서버가 검사합니다. (DEFER_SERVICE)

## E50 · 상무 선발 발표

지원 결과가 도착했습니다. 선발 여부에 따라 입대와 다음 복무 계획을 확인합니다.

발생: 지원1회확정. '지원 결과가 도착했습니다.'

- 선발결과확인 → 탈락하면다음가능한복무선택을안내합니다. (CONFIRM_MILITARY_RESULT)

## E51 · 잠시 내려놓는 배트

복무를 시작합니다. 원소속의 계약과 권리는 정해진 규칙에 따라 보존됩니다.

발생: 현역복무시작. '원구단을 떠나 복무를 시작합니다.'

- 다음복무구간 → 일반복무기간출장과자연성장은없습니다. (ADVANCE_SERVICE)

## E52 · 부대의 그라운드

군 체육팀에서 야구와 복무를 이어갑니다. 소속이 바뀌어도 세계 시즌의 강화 기회는 공유합니다.

발생: 상무첫블록. '군 체육팀에서 야구와 복무를 이어갑니다.'

- 육성4개확인 → 세계시즌성장과강화횟수는공유합니다. (CHOOSE_FOCUS)
- 상무일정진행 → 상무 일정을 진행합니다. 세계 시즌 성장과 강화 횟수는 공유됩니다. (ADVANCE_SERVICE)

## E53 · 다시 받는 유니폼

복무를 마쳤습니다. 원소속과 남은 계약을 확인하고 다시 기용 경쟁을 준비합니다.

발생: 18개월완료. '복무를 마치고 원구단으로 돌아왔습니다.'

- 복귀계획확인 → 소속권리와복귀가능명단을검사합니다. (CONFIRM_SERVICE_RETURN)

## E54 · 남은 마지막 겨울

게임 규칙상 더 미룰 수 없는 복무 시점이 다가왔습니다. 가능한 계획을 확정합니다.

발생: 27세미해결. '게임 규칙상 다음 시즌 전에는 복무 계획을 확정해야 합니다.'

- 마지막지원 → 무기한유예는선택할수없습니다. (APPLY_MILITARY_TEAM)
- 현역입대검토 → 현역 입대를 검토합니다. 확정 전에는 입대하지 않으며 무기한 유예는 선택할 수 없습니다. (START_SERVICE)

## E55 · 계속되는 활동의무

선수 활동과 함께 이행할 의무를 확인합니다. 남은 기간과 완료 조건을 살펴봅니다.

발생: ATHLETE_SERVICE오프시즌. '선수 활동과 함께 이행할 의무를 확인합니다.'

- 잔여의무확인 → 완료조건을채운뒤복무완료로전환합니다. (ACK_SERVICE_OBLIGATION)

## E56 · 졸업 뒤 다음 무대

국내 지명과 대학 진학을 비교합니다. 능력과 유효한 미국 제안이 있다면 해외 진로도 살펴볼 수 있습니다.

발생: 고교졸업진로상태,미국카드는능력과유효오퍼조건부

- KBO대학미국진로비교 → 미국은능력과유효제안이있을때만보입니다. (OPEN_ROUTE)

## E57 · 바다 건너의 계약서

첫 시작은 메이저 무대보다 작은 구장일 수 있습니다. 계약의 레벨과 조건을 확인합니다.

발생: '첫 시작은 메이저 무대보다 작은 구장일 수 있습니다.'

- 미국계약확인 → 오퍼조회만으로국내진로를포기하지않습니다. (ACCEPT_CAREER_OFFER)
- 다른진로비교 → 다른 진로와 비교합니다. 미국 계약은 확정되지 않았습니다. (BACK_TO_ROUTE)

## E58 · 낯선 클럽하우스

언어도 준비도 낯설지만 오늘의 훈련은 시작됩니다. 이번 시즌의 육성 계획을 확인합니다.

발생: '언어도 준비도 낯설지만 오늘의 훈련은 시작됩니다.'

- 육성4개검토 → 새리그합류로성장예산이초기화되지않습니다. (CHOOSE_FOCUS)
- 현재계획유지 → 현재 계획을 유지합니다. 새 리그 합류로 성장 예산이 초기화되지 않습니다. (ACK_EVENT)

## E59 · 다음 레벨의 문

한 단계 높은 팀에서 기회를 받았습니다. 새 레벨에서도 실제 출장은 경쟁으로 결정됩니다.

발생: 승격조건충족. '한 단계 높은 팀에서 기회를 받았습니다.'

- 승격수락 → 승격을 수락합니다. 합류 후 출장 경쟁이 이어집니다. (CONFIRM_PROMOTION)
- 다음평가대기 → 승격을 미룹니다. 다음 평가에서 다시 검토될 수 있습니다. (DEFER_PROMOTION)

## E60 · 메이저리그의 전화

구단이 메이저리그 합류를 알렸습니다. 명단 등록과 첫 출장은 따로 기록합니다.

발생: '구단이 메이저리그 합류를 알렸습니다.'

- 메이저합류확인 → 명단등록만으로첫출장기록을만들지않습니다. (CONFIRM_CALLUP)

## E61 · 다시 내려가는 길

상위 명단에 남지 못했습니다. 남은 계약과 다시 올라갈 조건을 확인합니다.

발생: 강등확정조건. '상위 명단에 남지 못했습니다.'

- 마이너재도전 → 마이너 재도전을 확정합니다. (CONFIRM_DEMOTION)
- 계약권리확인 → 계약 권리를 확인합니다. FA 선택은 실제 권리가 있을 때만 가능합니다. (OPEN_RIGHTS)

## E62 · 포스팅을 요청하다

국내에서 쌓은 시간 뒤에 새로운 무대를 생각합니다. 신청 조건과 원구단의 판단 기준을 확인합니다.

발생: '국내에서 쌓은 시간 뒤에 새로운 무대를 생각합니다.'

- 승인요청 → 경력과병역조건을먼저확인합니다. (REQUEST_POSTING)
- 원구단잔류 → 원 구단에 남습니다. 포스팅은 요청하지 않았습니다. (ACK_EVENT)

## E63 · 구단의 대답

원구단이 포스팅 요청에 답했습니다. 승인 여부와 이유, 다음 선택을 확인합니다.

발생: '원구단이 요청에 답했습니다.'

- 승인후협상조회 → 승인 후 협상 조회를 엽니다. 승인만으로 원 계약은 종료되지 않습니다. (OPEN_POSTING_OFFERS)
- 보류사유확인 → 보류 사유를 확인합니다. 협상은 시작되지 않았습니다. (ACK_EVENT)

## E64 · 협상의 끝

제안과 남은 시간을 함께 봅니다. 계약이 체결되기 전까지 원구단과의 권리는 유지됩니다.

발생: '제안과 남은 시간을 함께 봅니다.'

- 계약확정검토 → 계약 확정 전 검토를 엽니다. 마감 내 미체결이면 원 계약을 유지합니다. (ACCEPT_CAREER_OFFER)
- 원구단잔류 → 원 구단 계약을 유지합니다. (REMAIN_ORIGINAL)

## E65 · 처음 선 빅리그

명단의 이름이 경기 기록의 이름이 됐습니다. 첫 메이저리그 출장 순간을 남깁니다.

발생: 실제첫출장. '명단의 이름이 경기 기록의 이름이 됐습니다.'

- 첫메이저출장확인 → 실제출장시점의기록을보관합니다. (ACK_EVENT)

## E66 · 미국에서 맞는 FA

새 팀과 새로운 역할을 고를 수 있게 됐습니다. 미국 제안과 가능한 국내 복귀를 비교합니다.

발생: '새 팀과 새로운 역할을 고를 수 있게 됐습니다.'

- 미국제안비교 → 미국 FA 제안을 비교합니다. (OPEN_CAREER_OFFERS)
- 국내복귀검토 → 국내 복귀를 검토합니다. 보유권과 병역을 함께 검사합니다. (OPEN_RETURN)

## E67 · 돌아갈 그라운드

다시 국내에서 뛰는 길을 확인합니다. 보유권과 병역, 필요한 준비 기간을 살펴봅니다.

발생: '다시 국내에서 뛰는 길을 확인합니다.'

- 복귀경로확인 → 귀국이기존권리를자동삭제하지않습니다. (CONFIRM_DOMESTIC_RETURN)
- 현재경로유지 → 현재 경로를 유지합니다. 복귀는 확정되지 않았습니다. (CANCEL_RETURN)

## E68 · 기다림도 커리어

복귀를 준비하는 시간이 지나갑니다. 날짜와 나이는 계속 흐르며 기록은 보존됩니다.

발생: '복귀를 준비하는 시간이 지나갑니다.'

- 준비구간진행 → 세계날짜와나이는계속진행합니다. (ADVANCE_RETURN_PROGRAM)

## E69 · 두 리그의 마지막 인사

어느 리그의 기록도 다른 기록을 지우지 않습니다. 두 무대의 시간을 나눠 보관합니다.

발생: '어느 리그의 기록도 다른 기록을 지우지 않습니다.'

- 두리그기록확인 → 국내와미국의기록을구분해보관했습니다. (OPEN_ARCHIVE)

## E70 · 졸업 뒤의 캠퍼스

야구를계속할학교와그곳의경쟁상황을살펴봅니다.

발생: 고교졸업/대학진학검토

- 학교비교 → 학교를 비교합니다. (OPEN_COLLEGES)
- 진로비교로 → 진로 비교로 돌아갑니다. 학교는 선택되지 않았습니다. (BACK_TO_ROUTE)

## E71 · 대학의 첫 유니폼

새야구부의일정과내자리의경쟁을확인합니다.

발생: 대학입학확정후1회

- 육성4개확인 → 선택결과를확인했습니다. (CHOOSE_FOCUS)
- 일정확인 → 일정만 확인했습니다. 계획은 바뀌지 않습니다. (ACK_EVENT)

## E72 · 대학선수권의 초대

정규시즌뒤대학선수권대진이정해졌습니다.

발생: 대학정규상위4확정

- 대진확인 → 선택결과를확인했습니다. (ACK_EVENT)

## E73 · 두 번째 봄 다음의 선택

드래프트에나설지다음학년을준비할지결정할시간입니다.

발생: 2학년시즌결산/조기지명미시도

- 조기드래프트검토 → 조기 드래프트 참가를 검토합니다. 확정 전에는 소속이 바뀌지 않습니다. (ENTER_EARLY_DRAFT)
- 재학유지 → 재학을 유지하고 학년을 진행합니다. (ADVANCE_ACADEMIC_YEAR)
- 유효미국제안조회 → 유효한 미국 제안이 있을 때만 조회합니다. (OPEN_US_IF_VALID)

## E74 · 다시 학교 그라운드로

프로계약을맺지않았다면학교에서다음시즌을준비할수있습니다.

발생: 조기미지명/미계약복학가능

- 3학년복귀 → 3학년으로 복귀해 학년을 진행합니다. (ADVANCE_ACADEMIC_YEAR)
- 종료검토 → 선수 생활 종료를 검토합니다. 확정 전에는 은퇴하지 않습니다. (REQUEST_RETIRE)

## E75 · 졸업과 다음 무대

대학기록을남기고다음진로를확인합니다.

발생: 4학년결산

- 졸업진로확인 → 선택결과를확인했습니다. (GRADUATE_COLLEGE)

## E76 · 미뤄 둔 학년

나이는흘렀지만완료하지않은학년에서다시시작합니다.

발생: 휴학중복무완료

- 복학확인 → 선택결과를확인했습니다. (RESUME_COLLEGE)

## E77 · 새로운 관찰 보고서

조건에맞는후보를발견했습니다. 발견이계약을뜻하지는않습니다.

발생: 탐색명령성공receipt

- 발견선수확인 → 선택결과를확인했습니다. (OPEN_SCOUT_REPORT)

## E78 · 이번 탐색의 빈자리

이번탐색에서는새후보를발견하지못했습니다. 사용한비용과남은횟수를확인합니다.

발생: 탐색명령실패receipt

- 조건검토 → 탐색 조건을 검토합니다. (OPEN_SEARCH)
- 공개FA목록 → 공개 FA 목록을 엽니다. (OPEN_MARKET)

## E79 · 제안서를 보내기 전에

연봉과기간에따라이번라운드의수락가능성이달라집니다.

발생: 구단제안초안확인

- 확률과예약확인후제출 → 확률과 예약을 확인한 뒤 제안서를 제출합니다. (SUBMIT_OFFER)
- 초안취소 → 제안서 초안을 취소합니다. 제안은 전송되지 않습니다. (CANCEL_DRAFT_OFFER)

## E80 · 협상 라운드의 마감

계약과미체결결과를확인합니다. 실패제안의예약금액은해제됩니다.

발생: 제안라운드결과receipt

- 결과확인 → 선택결과를확인했습니다. (OPEN_OFFER_RESULTS)

## E81 · 그라운드를 지키는 예산

보장지급을유지하면서필수선수단을꾸릴지원안을확인합니다.

발생: 재정재건필요

- 지원원장확인 → 지원 원장을 확인합니다. (CONFIRM_REBUILD)
- 예산검토 → 예산 검토로 돌아갑니다. (BACK_TO_BUDGET)

## E82 · 다시 시작하는 선수

능력별최고치의절반,새잠재력과병역상태로어린선수를만듭니다.

발생: 보관복사생성미리보기

- 미리보기확인 → 미리보기를 확인합니다. (CONFIRM_IMPORT)
- 선택취소 → 선택을 취소합니다. 원본과 현재 세계는 바뀌지 않습니다. (CANCEL_IMPORT)

## E83 · 숨겨진 난이도의 약속

선택한모드의보장효과와유지되는제약을확인합니다.

발생: 해금후치트카드를직접선택한뒤

- 선택확인 → 선택 내용을 확인합니다. (CONFIRM_DIFFICULTY)
- 난이도다시선택 → 난이도를 다시 고릅니다. 확정 전에는 저장되지 않습니다. (BACK_TO_DIFFICULTY)

## E84 · 나만의 무기를 얻다

쌓아 온 기록이 새로운 특성의 조건을 채웠습니다. 보유 특성은 조건에 맞는 상황에서 모두 자동 적용됩니다.

발생: 특성해금조건충족receipt

- 특성도감확인 → 확정된결과와선택내역을확인합니다. (OPEN_TRAITS)

## E85 · 쌓아 온 나만의 무기

장착을 고를 필요 없이 보유 특성을 모두 활용합니다. 각 효과의 활성 조건과 실제 합산 보정을 확인합니다.

발생: 보유특성정보조회또는새특성해금요약

- 보유특성과조건확인 → 보유특성의활성조건을확인했습니다. (OPEN_TRAITS)

## E86 · 새로운 공의 연습

새 구종을 배우려면 시간이 필요합니다. 활성 구성과 학습 계획을 비교합니다.

발생: 프리시즌새구종학습가능

- 학습계획확인 → 학습 계획을 확인합니다. (SET_PITCH_TRAINING)
- 현재구종집중 → 현재 구종 집중을 유지합니다. (ACK_EVENT)

## E87 · 손끝에 익은 구종

훈련과 실전이 쌓여 구종 숙련 단계가 올랐습니다. 능력 종합과는 별도 기록입니다.

발생: 구종XP등급기준통과receipt

- 구종숙련확인 → 확정된결과와선택내역을확인합니다. (OPEN_REPERTOIRE)

## E88 · 타구를 만드는 접근

당겨치기와 밀어치기, 전방향과 균형 중 이번 구간의 접근을 고릅니다.

발생: 성향변경창/타자

- 성향비교 → 성향을 비교합니다. (SET_BATTING_APPROACH)
- 현재성향유지 → 현재 성향을 유지합니다. (ACK_EVENT)

## E89 · 이번 시즌의 약속

기록을 바라보는 작은 목표를 정합니다. 선택하지 않아도 시즌은 진행할 수 있습니다.

발생: 프리시즌목표선택가능

- 목표최대3개선택 → 목표를 최대 3개까지 고릅니다. (SET_GOALS)
- 목표없이진행 → 목표 없이 진행합니다. 불이익은 없습니다. (ACK_EVENT)

## E90 · 숫자 너머의 한 걸음

선택한 목표를 달성했습니다. 기록의 범위와 새 기념 보상을 확인합니다.

발생: 목표달성기록receipt

- 달성과보상확인 → 확정된결과와선택내역을확인합니다. (OPEN_ACHIEVEMENTS)

## E91 · 함께 볼 계약서

수수료와 전문 분야를 비교합니다. 직접 협상을 이어갈 수도 있습니다.

발생: 프로계약후에이전트선택가능

- 에이전트조건확인 → 에이전트 조건을 확인합니다. (HIRE_AGENT)
- 직접협상유지 → 직접 협상을 유지합니다. (ACK_EVENT)

## E92 · 한 번의 역제안

원하는 연봉과 요청 수용률을 확인합니다. 실패해도 기존 제안은 기한까지 유지됩니다.

발생: 유효오퍼/미사용재협상횟수

- 확률확인후역제안 → 확률을 확인한 뒤 역제안을 요청합니다. (REQUEST_SALARY_COUNTER)
- 기본오퍼유지 → 기본 오퍼를 유지합니다. (ACK_EVENT)

## E93 · 내 역할을 묻다

다시 평가받을 기회를 요청할 수 있습니다. 요청이 수용되어도 주전은 경쟁으로 결정됩니다.

발생: 20팀경기검토창/출장가능

- 수용확률확인 → 수용 확률을 확인합니다. (REQUEST_ROLE_REVIEW)
- 현역할유지 → 현재 역할을 유지합니다. (ACK_EVENT)

## E94 · 같은 출발선의 이름

야구를 하며 기억에 남는 이름이 생겼습니다. 각자의 길은 다르게 이어질 수 있습니다.

발생: 고교관계선수고정생성 또는 실제프로대결근거관계형성확정

- 라이벌정보확인 → 확정된결과와선택내역을확인합니다. (OPEN_RELATIONS)

## E95 · 다시 마주한 유니폼

서로 다른 시간을 보낸 두 선수가 다시 같은 경기에 나섭니다. 실제 맞대결과 경력을 비교합니다.

발생: 라이벌관계단계변경후첫실제대진

- 관계와기록확인 → 확정된결과와선택내역을확인합니다. (OPEN_RELATIONS)

## E96 · 이번에는 같은 편

이번에는 같은 유니폼입니다. 이전 맞대결과 앞으로의 동료 기록을 나누어 남깁니다.

발생: 라이벌또는동료실제같은팀등록

- 동료연표확인 → 확정된결과와선택내역을확인합니다. (OPEN_RELATIONS)

## E97 · 그라운드 곁의 두 번째 삶

선수로 남긴 기록을 바탕으로 코치나 스카우트 역할을 살펴봅니다. 보관 원본은 유지됩니다.

발생: 은퇴원본지도자고용미리보기

- 효과와급여확인 → 효과와 급여를 확인합니다. (HIRE_RETIRED_STAFF)
- 보관만유지 → 보관만 유지합니다. 고용하지 않습니다. (ACK_EVENT)

## E98 · 한 타석씩 남길 경기

이 경기의 장면을 한 타석씩 볼까요? 결과만 확인해도 같은 경기가 진행됩니다.

발생: 중요경기직전/중계알림ON

- 중계보기 → 확정된 로그로 중계를 봅니다. (WATCH_IMPORTANT_GAME)
- 결과보기 → 결과만 봅니다. 결과는 중계 여부와 같습니다. (SKIP_COMMENTARY)

## E99 · 한 장에 남긴 시간

기록과 선택이 한 장의 기억으로 남았습니다. 장면을 핀하거나 근거 경기를 돌아볼 수 있습니다.

발생: 새연대기장면확정receipt

- 연대기확인 → 연대기를 확인합니다. (OPEN_CHRONICLE)
- 계속진행 → 계속 진행합니다. (ACK_EVENT)

---

<!-- SOURCE: HANDOFF-PROMPT.md -->

# 구현 진행 안내 — 2026-10-20

M0/M1 완료 후 M2 커리어 구현 중이며 M2-A 선수 육성 기반을 검증했습니다. 다음은 구종 학습/NPC·세계 생성·고교 시즌 연결입니다. 최신 실행 증거·미완료 범위는 [구현 진행 문서](../implementation/PROGRESS.md)를 우선합니다. 아래 설계 인계/NOT_EXECUTED는 구현 전 이력이며 커리어·DB·인증·APK 전체 완료를 뜻하지 않습니다.

---

# 다른 채팅·개발 환경에서 이어갈 요청문

이 저장소는 '다시, 플레이볼'의 구현 전 설계 패키지다. 먼저 START-HERE.md, STATUS.md,14-CANONICAL-DECISIONS.md,91-CURRENT-CONTRACT-INDEX.md,130-PREIMPLEMENTATION-HANDOFF.md,131-FINAL-DESIGN-REVIEW.md와 preimplementation-readiness.json을 읽고 실제 Git/파일 상태를 확인하라. 과거 대화를 안다고 가정하지 말라.

현재 별도 구현 착수 권한은 없다. 설계 계속 요청을 앱/엔진/API/Neon/인증/APK/호스팅 구축 요청으로 해석하지 말라. 사용자가 명시적으로 구현을 지시하면120의 순서와92의 실행 게이트를 사용한다.

핵심 범위는 커리어·독립 구단·선택 보관 투입·대학/KBO/미국 직행/포스팅·국제대회/병역이다. 6능력·집중4·평균 종합,19세·능력별 최고50%·새P·병역 재시작·원본 불변,특성 전체 자동 적용,기념 보상만,확정 경기 감상,이어하기 버튼만,확률1 숫자 숨김,치트의 정해진 잠재력/성장/구종XP/경제 범위를 유지하라. 정확한 계산과 자격은 분야 원문을 따른다.

45화면/99이벤트/핵심298 서면 기대값·전체23기대값 묶음이다. 이미지 레지스터 EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1, 코드 표시11묶음은 승인된 작업 기준이다. 청춘 야구 애니·얼굴 없는14실루엣·기본 네이비/블루·학교 고유 컬러·사건 속 상대 버건디를 적용한다. 승인 보드 approved-art-board.html,code-display-board.html,메인 design-board.html을 참고하라.

파일 기반 접근성13검사는 통과했지만 실제 렌더/키보드/스크린리더/터치는 미실행이다. file: 보드 관찰이 브라우저 URL 보안 정책에 차단됐으며 임시 서버·다른 자동 브라우저·CDP로 우회하지 않았다.129의 증거를 읽고 같은 차단을 반복하거나 정적 PASS를 실제 실행 PASS로 바꾸지 말라. 실제 엔진·DB·인증·이어하기·빌드/APK·밸런스·V01~V12는 아직 통과하지 않았다.

현재 원본 V:/docs/design, 비어 있는 V:/.git는 수정/초기화하지 않는다. 기존 정상 작업용 체크아웃 경로는 CONTINUATION-CHECKPOINT.md와 실제 Git 상태를 확인하라. 다른 PC에서는 새 정상 clone을 쓰고 기록된 로컬 경로를 그대로 실행하지 말라. 코드/비밀값/개인 토큰을 문서나 출력에 넣지 말라.

기존 권한 범위의 설계 변경은 해당 MD·14 사용자 결정·91 색인·STATUS·검증·통합MD·SHA를 맞추고 승인 변경만 커밋·푸시하라. 시각 수정안은 저장소 밖에서 보여주고 사용자 승인본만 반영한다. 이미 승인한 표시안을 반복 승인받지 말라. 새 게임 규칙이 필요할 때만 선택지를 제시하라. 모든 판단은 현재 실제 사람의 요청과 해당 범위의 최신 명시 결정을 우선한다.

최종131 정정: 생성은78의 /api/game-creations·creationId, 홈은이어하기만, 생성 전 개인P추첨 없음, 추가진루는41 산식, 동률은simulationKey, 게임 화면 state는공개 DTO이다. 기존 실제 사용자 구현 착수 요청이 있으면 그 요청을 우선하고 과거 설계 단계의 권한 없음 기록을 영구 금지로 해석하지 말라.

---

<!-- SOURCE: VALIDATION.md -->

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

## 2026-10-19 시각 확장1.5 검수

99에 생성·졸업 진로·대학·미국4흐름12상태를 추가했다. 대표20종/상세16흐름48상태,기존PNG8개 재사용. journey-experience-examples.json의16예외는 NOT_IMPLEMENTED이며 기존298게임 기대값과 별도다. 사용자R50의 이어하기 버튼 표시도 유지했다.

실행 명령: node docs/design/verify-design.mjs. 기존 검사 PASS와 추가 출력:

```text
PASS: journey examples: 2 initial arrays total 300, US visibility boundaries, 9 colleges / 48 team and 216 league games, B53.5 round distribution, MLB registration with zero appearances; 16 NOT_IMPLEMENTED edge expectations.
PASS: 2 alpha portrait assets, 20 preview variants, 16 detail flows / 48 state templates, evidence guards, hitter overall 71.0 and pitcher 72.0 / focus 4; pure HTML-string checks only.
```

처음 검사는S30 해외 회상 장면이 화면 슬롯에 등록되지 않아 실패했다. 해당 허용 자산과 ‘당시 진출 회상/현재 등록은 실제 텍스트’ 가드를 추가하고 재검사해 통과했다. 생성 유형 합300/집중4,학교9개/종합50의 입학 가능5개,미국55/50 경계와오퍼0/종료 진로,B53.5 분포10R.05/9R.4/8R.4/7R.15,MLB등록·실제출장0 문자열을 확인했다.

이는 UI에서 서버 자격 검사를 실제로 수행했다는 증거가 아니다. 실제 폼 입력·새 세계 생성·계약 원자성·학년·일정·승격·저장/복구·버튼/렌더링·브라우저·기기 시험은 미실행이다. 정상 이어하기에 중단/복구 상태 설명을 다시 노출하지 않았고 새 이미지 생성은 없다.

## 외부 작업 인수·100/101 연결 — 2026-10-19

GitHub 새6커밋을 fast-forward 반영했고V문서199파일과 모두 같음을 확인했다.100~104/61개 UI 기대값을 보존하고100/101 원문·대표 시안·서버용/공개용 설계 자료를 연결했다. 사용자 후속 확정 T14는20PA·OPS.900·관계 승리다.

node docs/design/verify-design.mjs 통과. 추가 검사는 공개 locked DTO의traitId/hidden/name/hint 허용필드,HTML의server-only 참조 부재,기존cap,T14 원기록 경계(표시.900으로 반올림돼도 실제.89996은불가),입력 배열 보존과 비율 보정2~4종의121개 목표값·ID순서 독립·하한·합100을 확인한다. 기존48상태에서 새2흐름6상태를 더해54순수 템플릿 상태를 검사했다.

최초 보드 검사는확장 전의16흐름 상수 때문에 실패했고18흐름/22화면/54상태로 검수 등록을 갱신한 뒤 통과했다. 실제 API 직렬화·캐시·클라이언트 번들 보안 시험,특성 해금/원장 transaction·슬라이더 input/포커스/기기 시험은 미실행이다.61개 상태 UI 기대값의 NOT_EXECUTED와298게임 fixture의 NOT_IMPLEMENTED를 유지한다.

DESIGN-ALL은100~105를 포함해 숫자순으로 재생성한다. 이전MANIFEST가 미갱신이어서 인수 시 실제199파일 해시를 보존한 기준으로 V폴더 덮어쓰기 충돌을 검사한 뒤 새SHA를 대조한다. 전체 문서가 Git에 공개될 수 있으나 server-only 정의를 실제 게임 공개assets로 배포해서는 안 된다는 경계를105에 명시했다.

## 102~104 남은 대표 UI 연결 — 2026-10-19

106에8개 배치/24상태를 추가해총30대표/26흐름78상태다. 기존45게임 화면/99이벤트와8PNG를 유지한다. S40 도전·S45 내보내기 하위 배치를별도로 세어대표 배치30개/고유 화면ID28개다.

node docs/design/verify-design.mjs 통과. 추가 출력:

```text
PASS: expansion templates: 12 public challenges, PRE/MID/reward separation, salary previews 70/55/40, staff debt, DIRECT/COMPARISON, hidden-score viewer controls, chapter filters, escaped notes and export states.
PASS: expansion arithmetic, read-only commentary reducer and immutable log, note escaping, 61 source-to-preview mappings; runtime tests remain NOT_EXECUTED.
```

순수 문자열 검사는12개 공개 도전조건/목표0선택/MID22·33 사례/협상 금액11000·12000·13000만원과 p70/55/40/직원 보장액/같은kind 비교·실제 투타 분리/점수 숨김·현재 장면aria-live/시즌책 필터/HTML문자를 포함한 메모 escape/내보내기 상태를 확인했다. 순수 함수는중계 step/back/skip/reset/play/tick/speed 경계·입력 불변·동일 로그 보존,보장7500만−지급1500만=6000만,훈련1.18+.05 cap1.2와1.04+.05=1.09,OPS.724를 검사했다.

E94는실제 프로 대결 근거의관계 형성도 허용하도록발생 조건·공통 문안만51/60/106과 연결했다. 관계 형성·실제 대결·관계WIN은 별도 evidence이며임의 승리/선수 생성은 없다. 직원 보장채무는운영 예약 총 구속액에 포함해해임으로 가용액이부풀지 않는 의미를44에 보완했다. 앱의실제 이벤트 판정/예산 transaction은실행하지 않았다.

61개 상태 UI 기대값은원문/대표 진입점 지도를 추가했을 뿐NOT_EXECUTED,기존298게임 기대값도NOT_IMPLEMENTED다. 실제 DOM 이벤트·타이머·키보드/포커스·음성·레이아웃·CAS·보상·권한·내보내기파일·DB·강제종료 복구·엔진/API·APK/build는미시험이다. file: 자동 브라우저 정책 차단을우회하지 않았다.

Git/V문서205파일 일치 후기준을 저장했고동기화 전외부 변경을 다시 검사한다. 원래 미리보기HTML과공개 helper를갱신하며서버용 히든 정의는공개 미리보기 폴더에 복사하지 않는다. 최종MANIFEST SHA와Git main을 확인한다.

## 107 라이벌·히든 경계 문서 검증 (2026-10-19)

추가한 서버용 서면 사례36개의고유ID/원문 참조/NOT_IMPLEMENTED 상태,결투 WIN/LOSS/NO_DECISION·정확 OPS .900과반올림 경계·개인 완봉·선발 규정 outs·연속시즌 예시산술을 정적 검사한다. 이는문서 예시 내부일관성 검사이며실제 경기 엔진 구현/원자성/정정/응답 은닉 테스트가 아니다. 형성 후보 전세계처리 순서·다중기기/시즌 정산은실환경 검증 대상으로 남긴다.

공개 시안에는서버용 경계 JSON/문턱을 배포하지 않는다. 45화면/99이벤트/298기존 게임 기대값/61UI 기대값 수는유지한다. 새36사례는별도 상세 경계 계획이다. 앱 build/Neon/브라우저/APK 테스트는실행하지 않는다.

108의45개마감 행은원본 화면ID·제목·그림슬롯·대표28개집합과일치하고,8상태와4뷰포트 계획을검사한다. 전행NOT_FINALIZED/NOT_EXECUTED다. 관련 흐름 참조가있어도 별도대표화면 완료로 올리지 않는다.

실행 결과: `node docs/design/verify-design.mjs` PASS, `git diff --check` PASS. 추가 출력은 `PASS: 36 server-only edge expectations indexed; duel, exact OPS, shutout and consecutive-season example arithmetic consistent. All 36 remain NOT_IMPLEMENTED.` 및 `PASS: 45 screen finish specifications, 28 declared representatives / 17 pending, 8 states and 4 viewports; final pixels and browser review remain unfinished.` 이다.

## 시각1.8 — 마감 보드·새6컷 (2026-10-19)

node docs/design/verify-design.mjs PASS. 추가결과:

PASS: supplemental 17 screens x 8 = 136 pure render examples; original 28 + 17 = 45 IDs, resume-only home, local lineup example, escaping and six-panel PNG metadata.

17화면×8상태문자열,기존28과합집합45/교집합0,JS/JSON자료일치,노출하면안되는히든정의0,이어하기문구유지,3타순중복예시,이스케이프,보관19세45.8,학교조건,새1536×1024PNG메타데이터를검사했다. 생성출력은도구이미지로직접확인했고원본+프로젝트사본을유지한다. 최초연결검사에서기본HTML에마감보드링크가빠진것을발견해헤더에연결하고재검사를통과했다.

실제DOM이벤트/입력·focus/픽셀/이미지크롭/4뷰포트렌더/키보드/200%확대/스크린리더는미검수다. file: 정책차단을우회하지않았고이번에앱/Neon/API/DB/build/APK를실행하지않았다. 298기존게임/61UI/36새경계기대값은기존미실행상태를유지한다.

V사본은작업전212파일해시일치를확인했으며동기화전외부변경을다시검사한다. 원래baseball-design미리보기에는HTML/공개JS/JSON/신규PNG만복사하며서버용히든정의/경계fixture는복사하지않는다.

## 시각1.9 — 사용자스크린샷 잘림 수정·청춘애니 U (2026-10-19)

스크린샷과CSS의185px고정높이/중앙이동으로얼굴잘림을추적했다. 고교는자연비율가로img/초상/회고3이미지,정사각아틀라스는전체패널흐름으로수정. 사용자가2번메인변경을확정한뒤111을현재U로추가하고3개보드의기본·활성사건·초상을연결했다. v3로컬선호는설계도구값이며게임세이브를변경하지않는다.

node docs/design/verify-design.mjs PASS. 추가출력: PASS: confirmed anime default, 12 new time-varied scenes, active portraits, uncropped square/full-width layouts, S04 two styles x eight states, three-image normal view and image-failure fallback.

가로img자연비율·185px/중앙translate제거·두스타일8상태·S04정상3이미지/실패0이미지·자료파일/선택기준·활성12사건/초상을정적으로확인했다. 생성원본7개를도구출력으로직접보고프로젝트사본/프롬프트를보존했다. 기존빈티지는삭제하지않았다. 생성작은모자문양/장비세부와실제HTML레이아웃·200%확대·입력/접근성은최종검수대상이다. 실제브라우저/file정책은우회하지않았고앱/엔진/Neon/build/APK는미실행이다.

작업시작시Git/V220파일일치를확인해기준해시를보존했고,동기화전에외부변경을다시확인한다. 원래미리보기에도공개HTML/JS/JSON/관련PNG/현재변경문서를복사하며서버용정의는배포하지않는다.

## 112 능력상한·성적 예시 (2026-10-19)

node docs/design/verify-design.mjs PASS, git diff --check PASS. 추가출력: PASS: four fixed ability-ceiling distributions, displayed AVG/SLG, positive out probabilities and correct PA/AB denominators; six balance runs remain NOT_EXECUTED.

08의가중치산식과softmax를독립적인고정예시로비교해8결과합1/양수,AVG/OBP/SLG분모와표시값,100타수25홈런의AVG.250/SLG1.000을확인했다. 4예시의무주자/피로0/특성0조건과장기비율범위를명시했다. 이는난수타석/실제시즌/게임엔진구현검증이아니다. 새6균형계획은NOT_EXECUTED,기존게임/UI/경계항목은기존미실행상태를유지한다. 앱/Neon/DB/브라우저/build/APK는미실행이다.

작업전231파일의Git/V일치를확인하고Windows Thumbs.db는보존했다. 동기화전외부변경을다시검사하며통합MD/MANIFEST를갱신한다.

## 113 첫커리어 동선 (2026-10-19)

node docs/design/verify-design.mjs PASS, git diff --check PASS. 추가출력: PASS: first-career storyboard 7 common + 19 branch stages, 45/99 source references, US eligibility boundaries/card hiding, immutable read-only templates. Real onboarding remains NOT_EXECUTED.

26단계의고유ID/기존화면·사건참조/이미지존재/19세분기/공통7장면·자료JS/JSON일치·55/50/오퍼1경계·권리차단·카드숨김·위변조US선택의공통경로회귀·순수렌더입력불변을확인했다. 실제DOM클릭·화면픽셀·첫세이브·기용/경기·계약원자성·이어하기/DB·브라우저·APK/build는미실행이다. 가이드의E02/E03배열은종류별관련원문참조이며동시사건생성을뜻하지않는다. 기존45/99카탈로그및실행상태는불변이다.

작업전Git/V234파일해시일치를확인하고Windows Thumbs.db는보존한다. 동기화전외부변경을다시확인하고원래미리보기에는공개동선HTML/JS/JSON/문서와연결HTML만반영한다.

## 114 구단 첫 시즌 운영 (2026-10-19)

node docs/design/verify-design.mjs PASS, git diff --check PASS. 추가출력: PASS: club first-season 16 stages / 7 recovery cases / 3 starts, source screen links, half-peak import and finite chained search-offer ledger. Runtime remains NOT_EXECUTED.

16단계고유ID/45화면참조,7복구사례,가상선수독립시작·보관반값19세/원본불변·치트현재능력추가0/P100/성장3/월2를정적으로확인했다. 같은원장에서18.4억→18.35억→17.35억→성공17.35억/실패18.35억의예약전환/해제를검사하고발견63%와영입50%예시를분리했다. 실제생성/영입/기용/동시성/연도전환·엔진/DB·브라우저·APK/build는미실행이다.

STATUS.md의최신요약과DETAIL-PLAN.md의최신계획을맨위로갱신하고이전이력은보존했다. 작업전Git/V240파일일치를확인했으며동기화전외부변경을검사한다. Windows Thumbs.db는보존한다.

## 115 구단오프시즌 마감·의존성·드래프트 연결 (2026-10-19)

node docs/design/verify-design.mjs PASS, git diff --check PASS. 추가출력: PASS: offseason 8 groups / 12 collision cases, deadline ordering and future-budget edges; S18 draft query/commands separated. Real draft/market/year transition remains NOT_EXECUTED.

8작업묶음/12충돌고유ID·기존화면참조·권위순서·추천순서비강제,가상게임일110FA/111드래프트의기한순서,미래120억×90%=108억과107+2실패/107+1통과/108억1만원실패를검사했다. S18을MIXED로보완해기록QUERY와구단현재차례지명SAVE_COMMAND2종·draftVersion검사를연결했고45화면/99이벤트/기존실행상태는유지했다. 기본목업의embedded catalog도동일하게갱신했다.

실제지명/FA추첨/권리잠금/병역/동시성/원장/연도전환·브라우저·Neon/DB·build/APK는미실행이다. 이번UI추가는드래프트하위화면의읽기설명이지실행버튼/서버구현이아니다. STATUS·DETAIL-PLAN의최신요약/다음단계를갱신했다. 작업전Git/V243파일해시일치를확인했고동기화전외부변경을재검사한다. Thumbs.db는보존한다.

## 116~117 중반 경험·빠른진행U (2026-10-19)

node docs/design/verify-design.mjs PASS. 12경험/참조·E13의명령receipt/24적격팀경기경계·유지선택은계획생성0·기본NEXT_MAJOR_EVENT/속도대안·S03/S30/S35연결·12FP 미실행상태를정적으로확인했다. 옛E12 B조건은현재원문/카탈로그에서정정했으며99사건을유지한다. 실제적응/기용/빠른진행청크/복원·브라우저·DB/API/build/APK는미실행이다. 사용량93%확인후중간저장하며계속작업한다.

## 118 은퇴·보관·새구단 연속성 (2026-10-19)

node docs/design/verify-design.mjs PASS, git diff --check PASS. 9장면/12미실행계획·원본41/복사19·peak100→50/종합50.0·기록/병역/히든초기화·계보claim정책·다른세계역할·0프로출장보관·전체구단NPC자동보관0·연대기표현실패와snapshot분리를정적으로확인했다. 실제은퇴/고용원자성/보관권한/DB·브라우저·APK/build는미실행이다. 사용량98%/남음2%확인후중간저장한다.

## 연속작업 임계치 저장

5시간사용99%/남음1%,주간47%/남음53%의내장도구값을확인해요청대로새설계를멈췄다. 이후는진행·인계문서와통합MD/MANIFEST만갱신한다. 118까지마지막전체정적검사는PASS. E13취소결과문구문제는당시검토발견으로만기록했다(이후 아래 후속 검증에서 정정). 최종V해시·git diff --check·원격main일치를확인한다.

## 2026-10-19 후속 검증 (E13 정정 이후)

E13 CANCEL_POSITION_PLAN 결과 문구를 ‘기존 등록 포지션 유지·전환 계획 종료’로 정정했고, 같은 문제가 있던 62개 사건·90개 선택지의 결과 문구도 선택지별로 분리했다. 이후 verify-design.mjs에 추가한 정적 검사는 다음과 같다.

| 검사 | 내용 |
|---|---|
| 결과 문구 중복 | 같은 사건 안에서 선택지 resultCopy가 서로 달라야 한다 |
| 사건 선택지 처리(125) | 모든 선택지에 dispatchClass, NAVIGATE는 45화면 중 targetScreen, BLOCKING 사건은 ACK만으로 해결 불가 |
| 합산 산술 예제(123) | effect-sum-examples.json 7개를 특성 cap .06·최종 cap .10·softmax로 재계산해 대조, 확률합 1 |
| 선수 표시 기대값(119/121) | player-display-expectations.json 30개 ID 고유, 근거 문서 존재 |
| 이미지 제작 레지스터(124) | 92항목 ID 고유, status·그룹·화면 ID 유효, 실루엣 14종, TODO는 우선순위 보유 |
| 기대값 묶음 색인 | expectation-sets-index.json 20묶음 파일/문서 존재, 핵심 6파일 합 298 |

함께 실행한 verify-state-ui.mjs와 verify-art-direction.mjs도 PASS다(그림 슬롯 silhouetteCard 참조 포함). 모두 문서·데이터·산술 정적 검사이며 게임 엔진·DB·API·브라우저 렌더·APK 실행 검증이 아니다. 실루엣 등 이미지는 이 저장소에서 제작하지 않았고(124), 보드 HTML의 S02·S16 시안은 태그 구조만 확인했으며 렌더는 미확인이다.


## 2026-10-20 1단계 승인 수정 검증

사용자가 점검 항목 1~6 전체 및 E63 A안을 승인했다. 현재 결정표는 청춘 애니·기본 NEXT_MAJOR_EVENT를 가리키며, 기능 U와 계수/분포 D를 구분했다. STATUS/119/121/체크포인트의 낡은 미반영 안내를 정정했다. 기대값 색인은 별도 3묶음을 추가해 23묶음이며 핵심은 6파일 298개를 유지한다. 이미지 시안은 1단계 결과 승인 후 저장소 밖에서 제작하고 선택·승인본만 반영한다.

V: 루트에서 실행한 결과(모두 종료코드 0):

| 명령 | 결과 |
|---|---|
| node docs/design/verify-design.mjs | PASS |
| node docs/design/verify-state-ui.mjs | PASS |
| node docs/design/verify-art-direction.mjs | PASS |

추가 출력:

```text
PASS: E63 approved branch waits for domain commit; deferred branch allows ACK; invalid blocking ACK, swapped policy and wrong branch command are rejected (static design checks).
PASS: 23 expectation sets indexed; FP12, first-club recovery7 and offseason12 match source counts and remain NOT_EXECUTED; core total remains 298.
```

E63의 항상 필수 35개·분기별 1개·즉시 해결 63개는 총 99개다. 승인 분기는 NAVIGATE만으로 OPEN을 닫지 않으며 보류 분기는 사유 확인 ACK로 끝난다. 검증기는 잘못된 BLOCKING ACK·뒤바뀐 정책·승인 분기의 잘못된 명령을 정적 음성 사례로 검사한다. 실제 서버/API의 해결 트랜잭션·동시성·재개는 구현 후 검증 대상이다. 이미지 파일과 개별 이미지 status·화면 슬롯은 변경하지 않았다. 실제 렌더·게임·DB·APK/build는 실행하지 않았다.

## 2026-10-20 승인 아트 첫 묶음 검증

사용자가 배색 1(네이비·블루), 투수 A·타자 A·로고2를 선택했다. 승인 SVG 3개·CSS 팔레트·출처/선택 JSON·승인본 전용 보드를 추가하고, screen-image-slots와 screen-finish-register의 S01/S21 브랜드 참조를 맞췄다. 디자인 보드·아트 비교 보드의 선수 예시 참조도 승인 SVG로 교체했다. 나머지 12실루엣은 이니셜 fallback이며 임의로 완성 처리하지 않았다. 미선택 SVG·초록 비교안·색상 비교안은 저장소 밖에만 있다.

최초 검증에서 화면 마감 등록부의 S01/S21 슬롯 사본이 브랜드 참조를 빠뜨린 불일치를 발견했다. 원본 슬롯과 동기화한 뒤 V:에서 세 명령을 다시 실행해 모두 종료코드0/PASS를 확인했다.

| 명령 | 결과 |
|---|---|
| node docs/design/verify-design.mjs | PASS |
| node docs/design/verify-state-ui.mjs | PASS |
| node docs/design/verify-art-direction.mjs | PASS |

추가 출력:

```text
PASS: approved pitcher A, hitter A and logo2 SVGs; navy-blue palette, CSS paints, forbidden-element guards and real slot bindings; 2/14 silhouettes ready, 61 image TODOs remain.
```

SVG title/viewBox·CSS변수 색·script/foreignObject/image/text 부재·음수 반전 부재·실제 파일/선택/화면 연결·레지스터 61TODO/19EXISTS를 정적으로 확인했다. PNG 미리보기로 선택된 세 형태와 배색을 육안 확인한다. 실제 브라우저 DOM·4뷰포트·키보드·접근성·앱/Neon/API/DB/build/APK는 미검증이다. 45화면/99이벤트/핵심298은 유지한다.

## 2026-10-20 두 번째 승인 실루엣 묶음 검증

사용자가 시안 1~4(우투좌타·좌투좌타·좌투 오버핸드·우투 쓰리쿼터)를 모두 승인했다. 네 SVG와 누적 승인 기록 v2를 추가하고 레지스터·정확한 투타/폼별 슬롯·승인 보드를 갱신했다. 첫 승인 SVG 3개와 미승인 시안은 변경하지 않았다. 누적 실루엣6/14, 레지스터 TODO57/EXISTS23이며 나머지8실루엣은 이니셜 fallback이다.

V:에서 아래 명령을 실행해 모두 종료코드0/PASS를 확인했다.

| 명령 | 결과 |
|---|---|
| node docs/design/verify-design.mjs | PASS |
| node docs/design/verify-state-ui.mjs | PASS |
| node docs/design/verify-art-direction.mjs | PASS |

추가 출력:

```text
PASS: approved pitcher A, hitter A and logo2 SVGs; navy-blue palette, CSS paints, forbidden-element guards and real slot bindings; 6/14 silhouettes ready, 57 image TODOs remain.
```

7개 누적 승인 SVG의 title/viewBox·CSS변수색·금지요소 부재·반전변환 부재와 슬롯6개/승인보드7개/실제파일 연결을 검사했다. 이전에 제시한 PNG 4종과 동일한 곡선·배치이며 title만 승인 상태로 정정했다. 정적 PASS이며 실제 DOM/브라우저 렌더·기기 접근성·게임/DB/Neon/build/APK는 미실행이다. 45화면·99이벤트·핵심298 기대값은 유지한다.

## 2026-10-20 실루엣14종 전체 승인 검증

남은8종 사용자 승인 후 SVG8개와 누적 승인 기록 v3를 반영했다. 레지스터와 슬롯은 14/14, 승인 보드는 로고 포함15개 SVG를 담는다. 기존7개 승인 SVG는 변경하지 않았다. TODO49/EXISTS31이며 아이콘2묶음은 별도 미완료다.

검증에 타자 R/L×R/L/S 6조합·투수 R/L×4폼 8조합의 정확한 전체 연결과 중복 방지 검사를 추가했다. 최초 검사에서 새 타자3개 슬롯의 투타 코드가 손/타석으로 분리되지 않은 것을 발견해 정정했다. 이후 아래 명령은 모두 종료코드0/PASS다.

| 명령 | 결과 |
|---|---|
| node docs/design/verify-design.mjs | PASS |
| node docs/design/verify-state-ui.mjs | PASS |
| node docs/design/verify-art-direction.mjs | PASS |

```text
PASS: approved pitcher A, hitter A and logo2 SVGs; navy-blue palette, CSS paints, forbidden-element guards and real slot bindings; 14/14 silhouettes ready, 49 image TODOs remain.
```

SVG title/viewBox·CSS변수색·금지요소 부재·단순 반전 부재·실제 파일 및 슬롯 참조·전체 조합을 정적으로 검사했다. 승인된 PNG 8종의 곡선은 유지하고 title만 승인 상태로 정정했다. 실제 브라우저/기기·DOM·접근성·앱/게임/Neon/DB/build/APK는 미실행이며 45화면/99이벤트/핵심298은 유지한다.

## 2026-10-20 네이비 아이콘1 승인 검증

사용자가 아이콘1을 선택해 Android 전경/배경/단색 SVG3개와 웹 아이콘 PNG4개(192/512/maskable512/apple180)·favicon SVG를 반영했다. 제작 레지스터·화면 자산 연결·보드 favicon/apple-touch 참조·승인 보드를 갱신했다. P0 17항목은 모두 파일 EXISTS이며 전체 TODO47/EXISTS33이다.

V: 루트에서 verify-design.mjs·verify-state-ui.mjs·verify-art-direction.mjs 모두 종료코드0/PASS. 추가 출력:

```text
PASS: approved navy icon1; Android 3 SVGs / web 5 assets, PNG dimensions and safe-area evidence, registry/slot bindings; P0 files complete. App/device integration remains NOT_EXECUTED.
```

sharp로 PNG4개 실제 크기와 전체 alpha255를 확인했다. Android 전경432의 모든 alpha 픽셀을 검사했고 경계 [128,136,303,313], 중심으로부터 최대거리118.23 미만으로 반경144 안전영역을 만족했다. maskable 전경 반경 비율은 .274 미만으로 .4 안에 든다. SVG 금지요소·title/viewBox·실제파일/레지스터/슬롯 연결도 정적 검증했다. PNG512를 육안 확인했다. 이는 OS 설치 화면 검증이 아니며 Android 리소스·실제 PWA manifest 연결·기기 설치·APK/build는 미실행이다.

## 2026-10-20 청춘 장면6컷 승인·우리팀 색상 통일 원칙

사용자가 라이벌 오른쪽 선수 버건디 수정본의6컷 전체를 승인했다. 1536×1024 atlas 원본과 생성/편집 프롬프트를 보존하고 finish 보드·스크린 슬롯·제작 레지스터·승인 보드를 연결했다. 기존 빈티지6컷은 비교 이력으로 보존한다. S34 대학은 대학 패널, S29 마이너는 원정 패널로 명시 연결하고 계약 화면은 승패를 암시하지 않는 구장 패널로 배정했다. S04 선수 카드 예시는119의 승인 실루엣을 쓴다.

V:에서 verify-design.mjs·verify-state-ui.mjs·verify-art-direction.mjs 각각 종료코드0/PASS. 추가 출력:

```text
PASS: approved six anime finish scenes, square atlas positions and per-screen semantic bindings; rival teams differentiated; runtime rendering remains NOT_EXECUTED.
```

6개 정사각 패널 좌표·원문/슬롯·화면별 패널 ID와 위치·데이터 JSON/JS 일치를 정적으로 검사했다. 45화면/99이벤트/핵심298은 유지한다. 실제 브라우저 렌더/기기/DB/API/build/APK는 미실행이다. 우리팀 네이비 통일은 사용자 확정 원칙으로 기록했고 기존 활성4PNG의 네이비 수정본은 별도 승인 대기로 저장소 밖에 보관한다. 수정본 원래 크기는 hero/고교1672×941, 사건2장1536×1024이며 아직 활성 파일을 교체하지 않았다.

## 2026-10-20 승인 네이비 수정3PNG 반영

사용자가4개 네이비 수정본을 승인하면서 추가사건의 야간 라이벌 구분 문제를 제기했다. 다른3개(메인·기본사건·고교)의 승인은 유지해 v2 PNG로 반영했다. 기존 파일을 덮어쓰지 않고 활성 HTML/JS/JSON 참조만 신규 파일로 바꿨다. 생성 프롬프트·출처·해시는 NAVY-UNIFORM-GENERATION.json에 기록했다. 야간 라이벌은 상대 모자/상의를 버건디로 추가 수정했으며 이 최종 수정본만 임시 폴더에서 사용자 확인 대기다.

V:에서 verify-design.mjs·verify-state-ui.mjs·verify-art-direction.mjs 모두 종료코드0/PASS. 활성 PNG 존재/크기·장면 참조 일치·first-career와finish 데이터 JSON/JS 일치·순수 HTML 템플릿 검사 통과. 메인/고교1672×941, 기본사건1536×1024 유지. 실제 픽셀/브라우저·기기/DB/API/build/APK는 미검증이다. 제작 레지스터41TODO/39EXISTS 및45화면/99이벤트/핵심298은 그대로다.

## 2026-10-20 야간 라이벌 최종 승인 반영

사용자가 야간 상대팀의 버건디 수정본을 최종 승인했다. career-events-animation-extra-navy-v2.png를 추가하고 활성6패널·첫 커리어 동선·제작 레지스터·승인 보드 참조를 연결했다. NAVY-UNIFORM-GENERATION.json은4개 승인 기록과 야간 팀 구분을 포함하며 pending=null/allFourApproved=true다. 기존4개 PNG 원본은 보존했다.

V:에서 verify-design.mjs·verify-state-ui.mjs·verify-art-direction.mjs 모두 종료코드0/PASS. 추가 출력:

```text
PASS: all four approved navy story-art versions bound; night rival white/navy vs burgundy, originals preserved; runtime visual review remains NOT_EXECUTED.
```

1536×1024 PNG·정사각6패널·활성 참조·기존 원본 존재·41TODO/39EXISTS·45화면/99이벤트/핵심298을 정적으로 확인했다. 사용자에게 제시된 생성 결과는 육안 확인됐으나 실제 HTML 픽셀/기기/DOM·DB/API/build/APK 검수는 미실행이다. 해당 네이비 수정4PNG의 승인 대기는 모두 해소됐다.

## 2026-10-20 컬러 팀 배지 승인 검증

대학9·군 체육팀1 배지 승인 반영 후 verify-design.mjs, verify-state-ui.mjs, verify-art-direction.mjs 모두 종료코드0/PASS. 10개 SVG의 고유 주색·보조색, 금지 요소 부재, 64×64 viewBox, 대체 제목과 대학·군 체육팀 화면 참조를 정적으로 확인했다. 레지스터 EXISTS49/TODO31. 실제 브라우저·앱·DB·APK 실행 검수는 미실행이며 구현을 시작하지 않았다.

## 2026-10-20 기념 보상7종 승인 반영

verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 모두 종료코드0/PASS. 승인 프레임3 SVG와 배경3·표지1 PNG의 파일 존재·실제 PNG1122×1402 규격·화면 참조를 확인했다. 생성 원본은 수정하지 않고 보존했다. 레지스터 EXISTS56/TODO24. 컬러 도장13종은 저장소 밖 사용자 승인 대기이며 실제 앱·브라우저·DB·APK 검수는 미실행이다.

## 2026-10-20 컬러 도장13종 승인 반영

verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 모두 종료코드0/PASS. 도장13종의 256×256 viewBox·title·금지 요소 부재·색상·화면 참조를 확인했다. EXISTS69/TODO11. 기념 보상20항목 파일 완료. 다음11항목은 저장소 밖 시안으로 사용자 승인 전 미반영. 실제 브라우저·기기·게임·DB·APK 검수는 미실행이며 구현 미착수.

## 2026-10-20 마지막 이미지11종 승인 반영·파일 제작 마감

verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 최종 실행 모두 종료코드0/PASS. 메달3·엠블럼4·카드3·스플래시1의 실제 규격·SVG title/금지 요소·화면 참조를 확인했다. 레지스터92항목=EXISTS80/TODO0/CODE_ONLY11/LEGACY_REFERENCE1. 기존 완료 검사의 TODO>0 가정은 완료 수치 검사로 교체했고, 구단 로고·앱 아이콘 묶음은 명시적 files 목록으로 존재 검사를 보강했다. 첫 검사 실패 원인 두 가지는 이 수정 후 재검사에서 해소됐다. 실제 브라우저·앱·DB·APK 실행 검수는 미실행이며 구현 전 상태를 유지한다.

## 2026-10-20 코드 표시11묶음·45화면 정합 마감

127 표시 상세와128 화면 대조·기계 판독 등록부를 작성했다. verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 최종 실행 모두 종료코드0/PASS.11개 CODE_ONLY ID의 명세 연결·구현 미착수 상태와45화면의8상태·현재 그림 참조·미실행 렌더 상태를 대조했다.83/94/95/108/109/111의 낡은 아트 표기는 승인된 청춘 애니/실루엣 기준으로 정리했다. 시각 비교 보드는 저장소 밖 사용자 승인 대기. 브라우저 실행0, 최종픽셀/터치/스크린리더/API/DB/APK 검수 미실행을 유지한다.

## 2026-10-20 코드 표시11묶음 시각안 승인 반영

사용자가 현재 작업 기준으로 승인한11묶음 정적 보드·SVG 비교도·승인 기록을 반영했다. verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 모두 종료코드0/PASS. 승인 기록의11 ID와 레지스터·화면별 가이드 참조를 대조했으며 CODE_ONLY/NOT_IMPLEMENTED는 유지했다. 이미지 EXISTS80/TODO0, 코드 표시11묶음 시각 승인 완료. 실제 브라우저·최종픽셀·스크린리더·기기·게임·Neon/DB·APK 검수는 미실행이다.

## 2026-10-20 메인 설계 보드 최신화·접근성 파일 점검

최신 승인 배지10·카드3·표시11묶음 연결과 네이비/블루 기준·본문 건너뛰기·포커스·표 캡션/열머리·좁은 화면 CSS를 보완했다. 소스의61개 비동작 버튼은 네이티브 disabled 예시로 구분했다. 파일 기반 접근성13검사 PASS_STATIC(이미지60·입력37·표6), 명시한 단색 토큰6쌍 대비6.09~12.79:1. verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 최종 검사 모두 종료코드0/PASS. 대학 배지의 동적 경로는 실제9개 파일 명시 목록으로 연결했고, 증거 해시는 Windows 줄바꿈을 LF로 정규화해 검증한다. 초기 검사 중 이 두 부분의 실패는 수정 후 재검사에서 해소했다. 현재 file: URL의 cua.getTab 관찰은 브라우저 보안 정책에 거절됐다. 다른 주소/브라우저/CDP 우회는 시도하지 않았다. 실제 렌더0·키보드/스크린리더/터치·200%·기기 검수 NOT_EXECUTED, WCAG 준수 미판정. 상세129와 design-board-accessibility-audit.json을 따른다.

## 2026-10-20 구현 전 세 항목 인계 마감

130-PREIMPLEMENTATION-HANDOFF.md와 preimplementation-readiness.json을 현재 인계 기준으로 작성하고 README/START-HERE/HANDOFF/92의 낡은 현재 안내를 정정했다. 확인된 보드 소스 문제 수정·정적 접근성13검사·45화면/8상태 참조 대조와 인계 정리는 완료, 실제 렌더/키보드/스크린리더는 기존 보안 차단/미실행 상태다. verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 최종 실행 모두 종료코드0/PASS. 인계표 수치(45화면/99이벤트/핵심298/23기대값 묶음/EXISTS80/TODO0/CODE_ONLY11/LEGACY1)를 원본과 대조했고 V01~V12 runtimePassed=false·전체 기대값 NOT_EXECUTED를 유지했다. 새 게임 규칙·구현 착수 권한을 추가하지 않았으며 실제 실행 PASS로 대체하지 않는다.

## 2026-10-20 구현 직전 최종 문서 리뷰

131 최종 리뷰에서5개 정합 위험을 기록·정정했다:06 생성 endpoint/creationId,78 생성 전 잠재력 및 홈 이어하기 문구,24 추가진루 확률/논리 동률키,06/28의 게임 화면 공개 DTO 경계,OS 캐시·LF 패키지 정합. 기존78/79/76/41/70/67/75/100의 확정 의미만 반영했으며 새 게임 규칙/실제 앱 코드는 추가하지 않았다. verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 최종 실행 모두 종료코드0/PASS. 원격 main과 작업 기준155abd2 일치 확인. 실제 렌더·키보드·스크린리더·V01~V12·엔진/DB/인증/build/APK는 미실행이며 단순 문서 점검으로 PASS 처리하지 않는다.

## 최종 검증 결과

verify-design.mjs / verify-state-ui.mjs / verify-art-direction.mjs 모두 종료코드0/PASS. 설계 파일359개를 MANIFEST의 경로·크기·SHA256으로 작업 폴더와 Git staged blob 양쪽에서 확인해359/359 일치, tracked 파일 집합도 정확히 일치했다. OS 캐시 항목0. 실제 앱 빌드/경기/DB/브라우저 검수가 아니라 설계 파일·정적 계약의 검증 결과다.

## 2026-10-20 구현 M0 실제 검증

사용자 구현 승인 후 M0를 착수·완료했다. npm ci / npm run check / npm run smoke 성공. check는 린트·소스/테스트 타입 검사·단위7/7·rules/API/Web build·기존 설계 정적10종을 포함한다. 개발 서버 실제 HTTP200과 프록시→API도 확인했다. 전체 출력과 다음 M1 작업은 [구현 진행](../implementation/PROGRESS.md)에 기록한다. 이 결과는 전체 경기 fixture/인증/DB/기기/APK 또는 V01~V12 전체 통과를 뜻하지 않으며 기존 구현 전 준비표는 역사적 스냅샷으로 보존한다.

## 2026-10-20 M1 경기 엔진 코어 실제 검증

M1 순수 경기 코어를 추가했고 단위67/67·린트·타입·rules/engine/API/web 빌드·설계 정적10종·웹/API HTTP smoke가 통과했다. BP4조건/X7예제·4조건각10만PA·타자8/투수6유형각100시드 및 기본100경기(97승부/3무승부)를 실행했다. 단발/PA단위 JSON재개/별도 Node 빌드 엔진의 골든SHA256이 일치한다. 사용자 선택 병살 수비/주루10점당±2%p를14/41에 기록했다. 실제 리그 시즌 균형/커리어/DB receipt/인증/브라우저·OS교차/APK는 미실행이다. 상세 [M1 인계](../implementation/M1-ENGINE.md)·[현재 진행](../implementation/PROGRESS.md)을 따른다.

## 2026-10-20 M2-A 육성 기반 실제 검증

생성/잠재력·성장/노쇠·시즌강화·구종XP 기본 계산의 신규16검사와 기존67검사를 합해83/83 통과. npm ci132 audit/취약점0, lint/typecheck/build/빌드엔진 골든/설계정적10종/웹API HTTP smoke 통과. M1 결과 해시 불변. M2 전체/고교·대학·드래프트·이벤트99·DB/인증·기기 이어하기/APK 완료가 아니다. 상세 [M2-A 인계](../implementation/M2-A-DEVELOPMENT.md)·[진행](../implementation/PROGRESS.md)을 따른다.


## 2026-10-23 구현 검증 참조 — M2-CU/CV

상무 건강/군팀 임시 편성과 정규 성장 종료 경계는 공동 집중39/39·전체 npm run check566/566·실패0·취소0, lint/타입/build/골든/이벤트/설계10종을 통과했다. 실제 포스트시즌·성장/시즌 마감·AI 연도 전환 자기검사도 별도 통과했으며 그 정규 경기는 통제된 시계다. [CU](../implementation/M2-CU-SANGMU-HEALTH-EMERGENCY.md) · [CV](../implementation/M2-CV-POSTSEASON-GROWTH-HEALTH.md) · [전체 로그](../implementation/evidence/M2-CU-check.log). 실제 UI/계정/Neon DB·Storage/APK 검증이나 이 문서의 정적 기대값 전체 구현 완료를 뜻하지 않는다. 개막 부상 시작 증거 보정은 다음 작업이다.


## 2026-10-23 구현 검증 참조 — M2-CW

개막 재활 증거는 집중25/25·전체 npm run check574/574·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. 테스트 duration_ms1081868.4695. [CW](../implementation/M2-CW-OPENING-REHABILITATION.md) · [전체](../implementation/evidence/M2-CW-check.log). 옛 지급은 보존한다. NPC 복귀/추가 정책·실제 UI/계정/Neon/APK 통과는 아니다.


## 2026-10-23 구현 검증 참조 — M2-CX

상무 전역/모집 공석 보충은 집중22/22·전체 npm run check580/580·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. [CX](../implementation/M2-CX-SANGMU-VACANCIES.md) · [전체](../implementation/evidence/M2-CX-check.log). 첫 타입 실패/두 번째 중단은 통과로 세지 않는다. 실제 NPC18개월 복무·복귀 급여·UI/계정/Neon/APK는 후속이다.


## 2026-10-23 구현 검증 참조 — M2-CY

실제 입대의 관계 분리는 집중30/30·전체 npm run check585/585·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. [CY](../implementation/M2-CY-SANGMU-RELATION-SEPARATION.md) · [전체](../implementation/evidence/M2-CY-check.log). 저장소 밖 군팀 E96 초안·NPC 실제 반년 복귀/급여·UI/계정/Neon/APK의 검증은 아니다.


## 2026-10-23 구현 검증 참조 — M2-CZ

상무 실제 공동 등록 E96은 집중38/38·전체 npm run check591/591·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. [CZ](../implementation/M2-CZ-SANGMU-TEAM-REUNION.md) · [전체](../implementation/evidence/M2-CZ-check.log). NPC 실제18개월 복귀/급여·연간 성장/미래 채무·UI/계정/Neon/APK의 완료를 뜻하지 않는다.


## 2026-10-26 구현 검증 참조 — M2-DF

연말 재원 부족의 타구단1년 제안/다음 해 보유권 해제는 신규7개·집중12/12·전체632/632·실패0·취소0·종료0, lint/타입/build/골든/이벤트/설계10종 통과. [DF](../implementation/M2-DF-OFFSEASON-EXIT.md). 동결265개 실제 소스에서 실행했고, 별도 JSON 비교/수락/Y02 재개도 동일했다. 미진행 정규 시계가 포함된 fixture이며18개월 전체·US 실제 리그·전체 M2 완료 증거가 아니다.
