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
