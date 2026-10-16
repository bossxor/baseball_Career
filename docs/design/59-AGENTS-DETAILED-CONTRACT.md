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

trust=clamp(50+clamp(시즌누적변화,-10,10)+이전시즌확정이월변화,0,100). 실제저장은seasonStartTrust와rawSeasonDelta,표시는clamp(seasonStartTrust+clamp(rawSeasonDelta,-10,10),0,100). 같은시즌+15후-10이면raw5/적용+5,순서대로포화시켜+10후-10=0으로왜곡하지않음. 이적한새구단은새관계50,구관계는읽기보존.

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

S41담당비교→순수입/관계근거→요청대상→p/실패후경로→확인→결과. D-AG01직접.60/02국내전문가.68/03u=.68실패/04실패후기본오퍼유효/05중복동일receipt/06예산변경재확인/07분할급여총합100000000・fee2000000・net98000000/08관계raw15-10=5/09부상약속위반없음/10기용검토성공에도출장미보장을fixture로정의.