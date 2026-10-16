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