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
