현재 작업(2026-10-20): P0 이미지17항목 파일 제작·승인 완료. [승인본](approved-art-board.html), [현황](STATUS.md). 실제 앱·OS 검수는 미실행, P1은 별도 시안 승인.

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
