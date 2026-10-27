# M2 사건 연결 감사 — 진행 중

99개 설계 사건을 실제 도메인 검수 대상으로 기록한다. 아래 참조는 문자열 탐색 결과이며 실행 완료 증거가 아니다. 동적 ID는 누락될 수 있고 guard/목록에서 ID를 참조하는 것만으로 트리거가 구현된 것은 아니다. 기존 구현을 NOT_IMPLEMENTED로 단정하거나 ACK/이동을 실제 도메인 완료로 세지 않는다.

DV의5개는 집중 검사16개에 포함된 도메인/자격·복귀/의무 알림 처리만 검증했다. 전체 국제 달력·선발 완료를 뜻하지 않는다. DW의 E45(실제28명 탈락)·E65(실제 MLB 출장)도 집중25개에 포함해 검증했다. 전체 DW 검사도 통과했다. 전체 국제 달력 완료를 뜻하지 않는다. 나머지는 실행 소스와 테스트를 직접 읽어 분류해야 한다. [기계 목록](M2-EVENT-CONNECTION-AUDIT.json). EA/EB 소스·4개 포스팅 테스트와 실제 root/evidence의 EB 전체 로그를 대조해 E62~E64를 수동 입구의 도메인 검사로 분류했다. 자동 오프시즌/UI/실제7시즌 증거는 아니다. E48의 EE 새 단계/날짜 감사는 집중22 및 전체 EE 검사를 통과했다. E46은 EF에서 실제 첫 FINAL 이전/이후·ACK·나머지 경기의 중복 방지를 집중26 및 전체 gate로 확인했다. 자동 초청/UI 완료 증거가 아니다.

| 사건 | 종류 | 선택 처리 | 검수 상태 | 소스 탐색 참조 |
|---|---|---|---|---|
| E01 마지막 고교의 겨울 | ROUTE | DOMAIN:CHOOSE_FOCUS<br>ACK:KEEP_FOCUS | NOT_AUDITED | [high-school-career.ts:116](../../packages/engine/src/high-school-career.ts) |
| E02 타격 자세의 갈림길 | ROUTE | DOMAIN:CHOOSE_FOCUS<br>ACK:KEEP_FOCUS | NOT_AUDITED | [high-school-career.ts:123](../../packages/engine/src/high-school-career.ts)<br>[high-school-progress.ts:77](../../packages/engine/src/high-school-progress.ts) |
| E03 마운드의 과제 | ROUTE | DOMAIN:CHOOSE_FOCUS<br>ACK:KEEP_FOCUS | NOT_AUDITED | [high-school-career.ts:123](../../packages/engine/src/high-school-career.ts)<br>[high-school-progress.ts:77](../../packages/engine/src/high-school-progress.ts) |
| E04 스카우트의 질문 | ROUTE | NAVIGATE:OPEN_ROUTE | NOT_AUDITED | [high-school-route.ts:41](../../packages/engine/src/high-school-route.ts) |
| E05 지명을 기다리는 날 | ROUTE | DOMAIN:ACCEPT_CAREER_OFFER<br>DOMAIN:DECLINE_DRAFT | NOT_AUDITED |  |
| E06 이름이 불리지 않았다 | ROUTE | NAVIGATE:OPEN_UNDRAFTED_ROUTES<br>NAVIGATE:REQUEST_RETIRE | NOT_AUDITED |  |
| E07 다시 받은 기회 | ROUTE | DOMAIN:ACCEPT_CAREER_OFFER<br>NAVIGATE:REQUEST_RETIRE | NOT_AUDITED |  |
| E08 프로의 첫 캠프 | NOTICE | DOMAIN:CHOOSE_FOCUS<br>ACK:KEEP_FOCUS | NOT_AUDITED | [kbo-preseason.ts:37](../../packages/engine/src/kbo-preseason.ts) |
| E09 첫 1군 호출 | NOTICE | DOMAIN:ACCEPT_CALLUP<br>DOMAIN:DEFER_CALLUP | NOT_AUDITED | [kbo-callup.ts:36](../../packages/engine/src/kbo-callup.ts) |
| E10 짧은 기회의 무게 | NOTICE | DOMAIN:REQUEST_ROLE_REVIEW<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E11 두 번째 숙제 | OPTIONAL | DOMAIN:CHOOSE_FOCUS<br>ACK:KEEP_FOCUS | NOT_AUDITED |  |
| E12 주전과 백업 사이 | OPTIONAL | DOMAIN:START_POSITION_PLAN<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E13 낯선 수비 자리 | NOTICE | DOMAIN:CONFIRM_POSITION<br>DOMAIN:CANCEL_POSITION_PLAN | NOT_AUDITED |  |
| E14 선발의 문 | OPTIONAL | DOMAIN:REQUEST_SP_REVIEW<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E15 마지막 아웃의 자리 | OPTIONAL | DOMAIN:REQUEST_CP_REVIEW<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E16 구속보다 안정 | OPTIONAL | DOMAIN:CHOOSE_FOCUS<br>ACK:KEEP_FOCUS | NOT_AUDITED |  |
| E17 긴 무안타 | OPTIONAL | NAVIGATE:OPEN_STYLE<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E18 장타가 필요한 때 | OPTIONAL | NAVIGATE:OPEN_STYLE<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E19 흔들린 두 경기 | OPTIONAL | DOMAIN:REQUEST_REST<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E20 코치의 조언 | OPTIONAL | NAVIGATE:OPEN_DEVELOPMENT<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E21 작은 통증 | HEALTH | ACK:ACK_INJURY | NOT_AUDITED |  |
| E22 긴 재활 | HEALTH | ACK:ACK_INJURY | NOT_AUDITED |  |
| E23 돌아온 그라운드 | HEALTH | DOMAIN:CONFIRM_RETURN | NOT_AUDITED |  |
| E24 처음 받은 박수 | NOTICE | ACK:ACK_EVENT | NOT_AUDITED |  |
| E25 올스타의 초대 | SEASON | ACK:ACK_EVENT | NOT_AUDITED |  |
| E26 라이벌의 등장 | OPTIONAL | NAVIGATE:OPEN_COMPETITION<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E27 포스트시즌의 긴장 | NOTICE | ACK:ACK_EVENT | NOT_AUDITED |  |
| E28 우승 뒤의 겨울 | SEASON | ACK:ACK_EVENT | NOT_AUDITED |  |
| E29 첫 개인상 | NOTICE | ACK:ACK_EVENT | NOT_AUDITED |  |
| E30 재계약 제안 | CONTRACT | NAVIGATE:OPEN_CAREER_OFFERS<br>NAVIGATE:REQUEST_RETIRE | NOT_AUDITED | [kbo-military-planning.ts:31](../../packages/engine/src/kbo-military-planning.ts)<br>[kbo-military-state.ts:44](../../packages/engine/src/kbo-military-state.ts)<br>[kbo-offseason-exit.ts:32](../../packages/engine/src/kbo-offseason-exit.ts)<br>[kbo-remainder-renewal.ts:26](../../packages/engine/src/kbo-remainder-renewal.ts)<br>[kbo-renewal.ts:42](../../packages/engine/src/kbo-renewal.ts)<br>[kbo-retirement.ts:59](../../packages/engine/src/kbo-retirement.ts) |
| E31 FA 시장의 문 | CONTRACT | NAVIGATE:OPEN_CAREER_OFFERS<br>NAVIGATE:OPEN_RETURN | NOT_AUDITED |  |
| E32 익숙한 유니폼 | CONTRACT | DOMAIN:ACCEPT_CAREER_OFFER<br>NAVIGATE:BACK_TO_OFFERS | NOT_AUDITED |  |
| E33 베테랑의 역할 | CONTRACT | DOMAIN:ACCEPT_ROLE<br>NAVIGATE:OPEN_CAREER_OFFERS | NOT_AUDITED |  |
| E34 전력 외 통보 | CONTRACT | NAVIGATE:OPEN_UNCONTRACTED_ROUTES<br>NAVIGATE:REQUEST_RETIRE | NOT_AUDITED |  |
| E35 마지막 테스트 결과 | ROUTE | DOMAIN:CONFIRM_RETIRE | NOT_AUDITED |  |
| E36 떠날 시기를 고르다 | ROUTE | DOMAIN:CONFIRM_RETIRE<br>DOMAIN:CANCEL_RETIRE | NOT_AUDITED | [kbo-retirement.ts:46](../../packages/engine/src/kbo-retirement.ts)<br>[us-retirement.ts:24](../../packages/engine/src/us-retirement.ts) |
| E37 마지막 인사 | ROUTE | NAVIGATE:OPEN_ARCHIVE | NOT_AUDITED | [kbo-retirement.ts:46](../../packages/engine/src/kbo-retirement.ts)<br>[us-retirement.ts:24](../../packages/engine/src/us-retirement.ts) |
| E38 장기집권의 부담 | SEASON | NAVIGATE:OPEN_CLUB_REVIEW<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E39 기회를 원하는 유망주 | SEASON | NAVIGATE:OPEN_LINEUP<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E40 한정된 겨울 예산 | SEASON | NAVIGATE:OPEN_BUDGET<br>NAVIGATE:OPEN_REBUILD | NOT_AUDITED |  |
| E41 새 시즌의 유형 | SEASON | NAVIGATE:OPEN_STYLE<br>ACK:ACK_EVENT | NOT_AUDITED | [high-school-progress.ts:77](../../packages/engine/src/high-school-progress.ts)<br>[kbo-windows.ts:72](../../packages/engine/src/kbo-windows.ts)<br>[us-windows.ts:53](../../packages/engine/src/us-windows.ts) |
| E42 다른 이름의 선수 | SEASON | ACK:ACK_EVENT | NOT_AUDITED |  |
| E43 한 번의 특별훈련 | SEASON | NAVIGATE:OPEN_TRAINING<br>DOMAIN:DEFER_TRAINING<br>DOMAIN:FORFEIT_TRAINING | NOT_AUDITED | [high-school-progress.ts:77](../../packages/engine/src/high-school-progress.ts)<br>[high-school-training.ts:52](../../packages/engine/src/high-school-training.ts)<br>[kbo-windows.ts:72](../../packages/engine/src/kbo-windows.ts)<br>[us-windows.ts:53](../../packages/engine/src/us-windows.ts) |
| E44 국가의 부름 | REGISTRATION | DOMAIN:ACCEPT_NATIONAL<br>DOMAIN:DECLINE_NATIONAL | FOCUSED_VERIFIED_DV | [kbo-national.ts:48](../../packages/engine/src/kbo-national.ts)<br>[kbo-progress.ts:92](../../packages/engine/src/kbo-progress.ts) |
| E45 대표팀 밖에서 | REGISTRATION | ACK:ACK_EVENT | FOCUSED_AND_FULL_DW_PASS |  |
| E46 첫 국제무대 | REGISTRATION | ACK:ACK_EVENT | FOCUSED_VERIFIED_DV | [kbo-national.ts:72](../../packages/engine/src/kbo-national.ts) |
| E47 메달과 다음 의무 | REGISTRATION | NAVIGATE:OPEN_SERVICE_ELIGIBILITY | FOCUSED_VERIFIED_DV | [kbo-national.ts:73](../../packages/engine/src/kbo-national.ts)<br>[kbo-progress.ts:92](../../packages/engine/src/kbo-progress.ts) |
| E48 돌아오는 비행기 | REGISTRATION | DOMAIN:CONFIRM_NATIONAL_RETURN | FOCUSED_VERIFIED_DV | [kbo-national.ts:74](../../packages/engine/src/kbo-national.ts)<br>[kbo-progress.ts:92](../../packages/engine/src/kbo-progress.ts) |
| E49 겨울의 병역계획 | DEADLINE | DOMAIN:APPLY_MILITARY_TEAM<br>DOMAIN:START_SERVICE<br>DOMAIN:DEFER_SERVICE | PARTIAL_ENGINE_DOMAIN_REVIEWED_EG | [kbo-military-planning.ts:15](../../packages/engine/src/kbo-military-planning.ts)<br>[kbo-national.ts:86](../../packages/engine/src/kbo-national.ts) |
| E50 상무 선발 발표 | DEADLINE | DOMAIN:CONFIRM_MILITARY_RESULT | PARTIAL_ENGINE_DOMAIN_REVIEWED_EG | [kbo-military-state.ts:48](../../packages/engine/src/kbo-military-state.ts)<br>[kbo-offseason-exit.ts:45](../../packages/engine/src/kbo-offseason-exit.ts)<br>[kbo-renewal.ts:37](../../packages/engine/src/kbo-renewal.ts) |
| E51 잠시 내려놓는 배트 | DEADLINE | DOMAIN:ADVANCE_SERVICE | PARTIAL_ENGINE_DOMAIN_REVIEWED_EG | [kbo-military-events.ts:20](../../packages/engine/src/kbo-military-events.ts) |
| E52 부대의 그라운드 | DEADLINE | DOMAIN:CHOOSE_FOCUS<br>DOMAIN:ADVANCE_SERVICE | PARTIAL_ENGINE_DOMAIN_REVIEWED_EG | [kbo-military-events.ts:20](../../packages/engine/src/kbo-military-events.ts) |
| E53 다시 받는 유니폼 | DEADLINE | DOMAIN:CONFIRM_SERVICE_RETURN | PARTIAL_ENGINE_DOMAIN_REVIEWED_EG | [kbo-military-events.ts:20](../../packages/engine/src/kbo-military-events.ts) |
| E54 남은 마지막 겨울 | DEADLINE | DOMAIN:APPLY_MILITARY_TEAM<br>DOMAIN:START_SERVICE | PARTIAL_ENGINE_DOMAIN_REVIEWED_EG | [kbo-military-planning.ts:15](../../packages/engine/src/kbo-military-planning.ts)<br>[kbo-national.ts:86](../../packages/engine/src/kbo-national.ts) |
| E55 계속되는 활동의무 | DEADLINE | ACK:ACK_SERVICE_OBLIGATION | FOCUSED_VERIFIED_DV | [kbo-national.ts:125](../../packages/engine/src/kbo-national.ts) |
| E56 졸업 뒤 다음 무대 | ROUTE | NAVIGATE:OPEN_ROUTE | NOT_AUDITED |  |
| E57 바다 건너의 계약서 | ROUTE | DOMAIN:ACCEPT_CAREER_OFFER<br>NAVIGATE:BACK_TO_ROUTE | NOT_AUDITED |  |
| E58 낯선 클럽하우스 | ROUTE | DOMAIN:CHOOSE_FOCUS<br>ACK:ACK_EVENT | NOT_AUDITED | [us-preseason.ts:37](../../packages/engine/src/us-preseason.ts) |
| E59 다음 레벨의 문 | REGISTRATION | DOMAIN:CONFIRM_PROMOTION<br>DOMAIN:DEFER_PROMOTION | NOT_AUDITED | [us-levels.ts:26](../../packages/engine/src/us-levels.ts) |
| E60 메이저리그의 전화 | REGISTRATION | DOMAIN:CONFIRM_CALLUP | NOT_AUDITED | [us-levels.ts:26](../../packages/engine/src/us-levels.ts) |
| E61 다시 내려가는 길 | REGISTRATION | DOMAIN:CONFIRM_DEMOTION<br>NAVIGATE:OPEN_RIGHTS | NOT_AUDITED | [us-levels.ts:26](../../packages/engine/src/us-levels.ts) |
| E62 포스팅을 요청하다 | CONTRACT | DOMAIN:REQUEST_POSTING<br>ACK:ACK_EVENT | FOCUSED_VERIFIED_EB | openKboPostingInvite→resolve REQUEST/ACK |
| E63 구단의 대답 | CONTRACT | NAVIGATE:OPEN_POSTING_OFFERS<br>ACK:ACK_EVENT | FOCUSED_VERIFIED_EA | [kbo-posting.ts](../../packages/engine/src/kbo-posting.ts) resolveKboPostingClub 봉인 decision |
| E64 협상의 끝 | CONTRACT | DOMAIN:ACCEPT_CAREER_OFFER<br>DOMAIN:REMAIN_ORIGINAL | FOCUSED_VERIFIED_EB | resolveKboPostingOfferEvent ACCEPT/REMAIN |
| E65 처음 선 빅리그 | REGISTRATION | ACK:ACK_EVENT | FOCUSED_AND_FULL_DW_PASS |  |
| E66 미국에서 맞는 FA | ROUTE | NAVIGATE:OPEN_CAREER_OFFERS<br>NAVIGATE:OPEN_RETURN | NOT_AUDITED |  |
| E67 돌아갈 그라운드 | ROUTE | DOMAIN:CONFIRM_DOMESTIC_RETURN<br>DOMAIN:CANCEL_RETURN | NOT_AUDITED |  |
| E68 기다림도 커리어 | ROUTE | DOMAIN:ADVANCE_RETURN_PROGRAM | NOT_AUDITED |  |
| E69 두 리그의 마지막 인사 | ROUTE | NAVIGATE:OPEN_ARCHIVE | NOT_AUDITED |  |
| E70 졸업 뒤의 캠퍼스 | ROUTE | NAVIGATE:OPEN_COLLEGES<br>NAVIGATE:BACK_TO_ROUTE | NOT_AUDITED |  |
| E71 대학의 첫 유니폼 | ROUTE | DOMAIN:CHOOSE_FOCUS<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E72 대학선수권의 초대 | ROUTE | ACK:ACK_EVENT | NOT_AUDITED |  |
| E73 두 번째 봄 다음의 선택 | ROUTE | DOMAIN:ENTER_EARLY_DRAFT<br>DOMAIN:ADVANCE_ACADEMIC_YEAR<br>NAVIGATE:OPEN_US_IF_VALID | NOT_AUDITED |  |
| E74 다시 학교 그라운드로 | ROUTE | DOMAIN:ADVANCE_ACADEMIC_YEAR<br>NAVIGATE:REQUEST_RETIRE | NOT_AUDITED |  |
| E75 졸업과 다음 무대 | ROUTE | DOMAIN:GRADUATE_COLLEGE | NOT_AUDITED | [college-graduation.ts:24](../../packages/engine/src/college-graduation.ts) |
| E76 미뤄 둔 학년 | ROUTE | DOMAIN:RESUME_COLLEGE | NOT_AUDITED |  |
| E77 새로운 관찰 보고서 | NOTICE | NAVIGATE:OPEN_SCOUT_REPORT | NOT_AUDITED |  |
| E78 이번 탐색의 빈자리 | NOTICE | NAVIGATE:OPEN_SEARCH<br>NAVIGATE:OPEN_MARKET | NOT_AUDITED |  |
| E79 제안서를 보내기 전에 | FORM | DOMAIN:SUBMIT_OFFER<br>DOMAIN:CANCEL_DRAFT_OFFER | NOT_AUDITED |  |
| E80 협상 라운드의 마감 | NOTICE | NAVIGATE:OPEN_OFFER_RESULTS | NOT_AUDITED |  |
| E81 그라운드를 지키는 예산 | SEASON | DOMAIN:CONFIRM_REBUILD<br>NAVIGATE:BACK_TO_BUDGET | NOT_AUDITED |  |
| E82 다시 시작하는 선수 | FORM | DOMAIN:CONFIRM_IMPORT<br>DOMAIN:CANCEL_IMPORT | NOT_AUDITED |  |
| E83 숨겨진 난이도의 약속 | FORM | DOMAIN:CONFIRM_DIFFICULTY<br>NAVIGATE:BACK_TO_DIFFICULTY | NOT_AUDITED |  |
| E84 나만의 무기를 얻다 | NOTICE | NAVIGATE:OPEN_TRAITS | NOT_AUDITED | [trait-notices.ts:13](../../packages/engine/src/trait-notices.ts) |
| E85 쌓아 온 나만의 무기 | NOTICE | NAVIGATE:OPEN_TRAITS | NOT_AUDITED |  |
| E86 새로운 공의 연습 | OPTIONAL | DOMAIN:SET_PITCH_TRAINING<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E87 손끝에 익은 구종 | OPTIONAL | NAVIGATE:OPEN_REPERTOIRE | NOT_AUDITED |  |
| E88 타구를 만드는 접근 | OPTIONAL | DOMAIN:SET_BATTING_APPROACH<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E89 이번 시즌의 약속 | NOTICE | DOMAIN:SET_GOALS<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E90 숫자 너머의 한 걸음 | NOTICE | NAVIGATE:OPEN_ACHIEVEMENTS | NOT_AUDITED | [season-goals.ts:37](../../packages/engine/src/season-goals.ts) |
| E91 함께 볼 계약서 | CONTRACT | DOMAIN:HIRE_AGENT<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E92 한 번의 역제안 | CONTRACT | DOMAIN:REQUEST_SALARY_COUNTER<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E93 내 역할을 묻다 | CONTRACT | DOMAIN:REQUEST_ROLE_REVIEW<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E94 같은 출발선의 이름 | NOTICE | NAVIGATE:OPEN_RELATIONS | NOT_AUDITED | [kbo-relations.ts:61](../../packages/engine/src/kbo-relations.ts)<br>[relation-notices.ts:38](../../packages/engine/src/relation-notices.ts) |
| E95 다시 마주한 유니폼 | NOTICE | NAVIGATE:OPEN_RELATIONS | NOT_AUDITED | [kbo-relations.ts:61](../../packages/engine/src/kbo-relations.ts)<br>[kbo-reunion-events.ts:34](../../packages/engine/src/kbo-reunion-events.ts) |
| E96 이번에는 같은 편 | NOTICE | NAVIGATE:OPEN_RELATIONS | NOT_AUDITED | [kbo-relations.ts:61](../../packages/engine/src/kbo-relations.ts)<br>[kbo-team-reunions.ts:68](../../packages/engine/src/kbo-team-reunions.ts) |
| E97 그라운드 곁의 두 번째 삶 | FORM | DOMAIN:HIRE_RETIRED_STAFF<br>ACK:ACK_EVENT | NOT_AUDITED |  |
| E98 한 타석씩 남길 경기 | PRESENTATION | NAVIGATE:WATCH_IMPORTANT_GAME<br>ACK:SKIP_COMMENTARY | NOT_AUDITED |  |
| E99 한 장에 남긴 시간 | NOTICE | NAVIGATE:OPEN_CHRONICLE<br>ACK:ACK_EVENT | NOT_AUDITED |  |

## EG 추가 검수 — E49~E54 (전체 EG gate 통과)

기존 소스/호출자/테스트를 직접 대조했다. 문자열 탐색·ACK만으로 완료 처리하지 않는다. E49/E54는 명시 오프시즌 입구이며 자동 초청/UI 증거가 아니다. E50은 실제 고정 선발·지원→상무 프로그램/대여를 처리한다. E51/E52는 이미 등록된 복무 블록을 확인하고 E52의4집중 변경은 기존 명령을 사용한다. E53은 실제6월30일 일마감에서 원구단2군·미지급 원금을 복원하고 선택 후 다음 날 진행한다. 상세 trigger/effect/testPaths/limits는 JSON domainReview다. 해당6행은 PARTIAL_ENGINE_DOMAIN_REVIEWED_EG로 구분한다. 이 검수로 native18개월/UI 완료로 승격하지 않는다.
