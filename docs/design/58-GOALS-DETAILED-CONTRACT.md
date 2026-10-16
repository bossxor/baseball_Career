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

GET expansion/goals?playerId→{seasonSlots,eligibleDefinitions,recommendedIds,replaceWindow,achievements,rewards,gameplayRewardDelta:0}. SET_GOALS={playerId,seasonId,goalIds:[G01,G03],scopeByGoal};REPLACE_GOAL={playerId,seasonId,slot,newGoalId,newScope};preview는현재진척/자격/보상보유/교체사용후상태. 성공result={slots,replacementUsed,rewardGrantCount}. 동일목표중복/4개는422 SLOT_CONFLICT,완료슬롯교체422 NOT_ELIGIBLE,MID기회0이면422 LIMIT_REACHED,기준기록변경409 PREVIEW_STALE.

EQUIP_COSMETIC은PATCH /api/cosmetic-preferences/{scopeRef}={expectedPreferenceRevision,slot:TITLE|FRAME|BACKGROUND|STAMP,rewardId|null},소유보상/type일치검사. 이외형설정은save revision/난수불변,서버프로필선호revision CAS. 이름표시/카드theme만변경,미보유422 NOT_ELIGIBLE.

## S40·실패·검수

시즌/커리어/기념보상탭→정확scope/기한/진척→목표초안→preview→확정. 완료후보상은이미해금됐음을표시,애니메이션실패후재수령버튼없음. 409는최신진척재조회,기록없음과조회장애를구분,규정분모0도목표선택/시즌진행가능.

GOAL-D01 HR19→20완료1/02같은receipt보상증가0/03KBO12+MLB8은G03미달/04완료슬롯교체거절/05BB22MID교체22/30/06BB33신규선택거절/07미선택시진행/08구원300아웃G06미달/09부상복귀명령만G08미달/10계정같은보상재화0/11정정기념유지/12전체gameplayDelta0. 보상수치가게임밸런스에영향없는것을엔진/DB/화면테스트각각검증한다.