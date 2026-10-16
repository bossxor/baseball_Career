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

현재fixture56개/6분야작성,목표·중계2분야는사용자핵심선택대기. 완료판정과pending구분은STATUS를따른다.
