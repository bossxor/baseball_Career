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
