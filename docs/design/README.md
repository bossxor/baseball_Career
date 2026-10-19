현재 추가설계: [112 능력100과성적](112-ABILITY-CEILING-PERFORMANCE-BALANCE.md). 100은능력상한이지안타확률이아니며SLG최대는4.000입니다. 고정산식예시와실제시즌검증을구분합니다.

최신 아트 U(2026-10-19): 메인 그림체는 **2번 청춘 야구 애니**로 변경했습니다. [111 현재 기준](111-ANIMATION-MAIN-ART-DIRECTION.md)을 우선합니다. 본문의 빈티지 선택은 이전 이력이며 원본은 보존합니다.

최신 시각1.8: [마감 보드](finish-board.html)에추가17배치/136상태·새빈티지6장면을작성했습니다. 기존28대표+추가17=45화면ID 연결이며최종브라우저검수와구분합니다. [109 범위](109-FINISH-BOARD-ART-AUDIT.md).

화면 마감 명세: [108 전체45화면](108-ALL-SCREEN-FINALIZATION.md)에 읽기 순서·주행동·8종 상태·크기별 배치를 정리했습니다. 대표 시안 미명시17화면은 후속 제작 대상으로 구분합니다.

상세 경계 추가: [107 라이벌·히든 특성](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)에서 발생·결투 WIN·완봉 예외·연속 시즌·정정을 구체화했습니다. 새 기본안 D와 사용자 확정 U를 구분하며 실제 구현은 시작하지 않았습니다.

시각1.7: [106 확장 UI 연결](106-EXPANSION-UI-CLOSURE.md)에서102~104의 남은 대표 배치를 연결했습니다. [시안](art-direction-lab.html)은30대표/78상태,핵심45화면/99이벤트는유지합니다. [61항목 진입점](state-ui-preview-coverage.json)은NOT_EXECUTED이며실제 앱/브라우저 검수와구분합니다. 최신파일은V:\docs\design,이어하기는버튼만 표시합니다.

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