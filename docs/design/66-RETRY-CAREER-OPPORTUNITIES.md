# 66. 사용자 장기 플레이 결정과 재도전 경로

사용자확정U:여러해재도전기회와현실적인탈락·조기은퇴를혼합,잠재력은스카우팅으로범위를점진축소,리그는팀별전성기·암흑기자연발생. 아래기간/평가문턱은설계기본안D,현실제도재현아님. 기존‘독립훈련1회뒤무조건종료’는이문서로교체.

## 재도전 예산과 자격

careerPreparationUsed 최대3시즌(기본안),한번의미계약기간episode별현재진척보존. 고교/대학정규재학시즌은이예산미소모,현역·상무복무도미소모. 고교미지명·대학졸업미지명·프로방출/계약만료뒤미계약선수가실제독립준비시즌을완료하면1소모. 같은시즌국내재도전과귀국준비가겹쳐도sourcePeriod고유키로중복소모없음. 게임최대45세와병역기한은유지,조건미달진로를가짜선택지로노출하지않음.

미계약결과→가능경로비교→선택확정→한세계준비시즌→평가→실제오퍼또는다음경로. 진행중언제든허용마감시점수동은퇴가능. 남은기회가있어도계약보장없음. 3시즌소진후유효프로/대학경로없으면최종실패정리→은퇴보관,기록·도감·연대기보존. 부상장기재활은회복기회와남은활동일표시,동일시즌을새로시작해예산초기화안함.

| 경로 | 자격 | 결과·실패 후 |
|---|---|---|
| 독립준비·국내재평가 | 준비잔여>0/나이·복무·권리유효 | 준비시즌정규48경기/월별진행→드래프트또는자유선수계약자격별평가 |
| 대학입학 | 고교학력미프로계약자/최대입학게임나이22/남은4학년을최대나이내완료가능 | 가상학교43조건,입학제안실존/학년과나이는분리 |
| 대학복학 | 조기드래프트미계약/학적유효 | 이전학년진행43,준비기회불소모 |
| 국내프로재계약 | 실제유효오퍼/보유권유효 |23계약수락,지명자격있는경우만드래프트 |
| 미국직행 | 능력기준충족/현재권리·학적허용/유효오퍼≥1 |34의카드노출계약유지,오퍼0이면카드없음 |
| 군복무/귀국준비 |21/23의기한·권리유효 | 별도필수기간,단순재도전예산으로면제안함 |
| 은퇴 | 계약·등록정리가능상태 | 원본영구보관,프로0기록도허용 |

대학입학나이는entryAge=currentAge,일반고교직후19세/독립재도전후20~22세가능. academicYear는1부터시작,19세로되돌리지않음. 프로계약체결경력이있으면대학신입경로없음. 대학학력/실제입시정보는입력받지않음. 22세기본상한은게임선택이며추후변경가능D.

## 준비 시즌의 성장·지명

정규48경기/훈련가능일/출장계수는43대학분모(PA100/outs90)공유,성적보정은독립리그D=-20. 성장·구종XP·특성·강화는세계시즌하나의원장,한시즌다중경로중복없음. 16경기강화해금/24경기유형창,기존사용기회는다시생성안함. 대표/병역중단은해당세계달력기준.

아마추어재지명예측B=.7overall+.3performanceAdjusted,34의p와라운드표유지. 이미프로였던선수는같은점수를드래프트순번으로표시하지않고구단40의동시시장평가/실제오퍼로진행. ‘몇차례준비하면무조건최저연봉’구규칙폐기. 마지막실제오퍼가소멸해도기회남음/복학가능이면그경로를남김. 경로버튼에는가능이유/소모1시즌/현재잔여/예상연령,확정참가자격을100%배지로표시안함.

## 상태·데이터·명령

UNCONTRACTED_REVIEW→PREPARATION_PRE→PREPARATION_REGULAR→PREPARATION_RESULT→ROUTE_REVIEW또는RETIRE_DECISION. episodeId는미계약발생receipt마다새ID,careerPreparationUsed는평생누적. preparation_periods(saveId,playerId,worldSeasonId UNIQUE,episodeId,start/endDay,usageCharged,evidenceReceipt),career_route_opportunities(playerId,routeId,reasonCodes,offerRefs,expiresGameDay),collegeEnrollment.entryAge추가.

GET /api/saves/{id}/career-routes?playerId→{routes,preparation:{used,remaining,consumesNextSeason},rights,militaryTasks,ageAtCompletion}. START_PREPARATION={playerId,episodeId,seasonId,routePreviewId};ENROLL_COLLEGE는entryAge서버계산. 예산0은422 LIMIT_REACHED,권리불가422 NOT_ELIGIBLE,오퍼변동409 PREVIEW_STALE. 준비완료소모와연간성장/기록정산동일transaction,통신재시도usage증가0.

## 검수 기대값

RETRY01 used0→준비완료1/02동일완료재시도1유지/03복무18개월준비소모0/04프로경력대학입학불가/05대학20세입학후학년1·나이20/06used3·오퍼0·복학불가은퇴가능/07예산남아도미국오퍼0카드없음/08기존강화사용뒤독립진입재강화불가/09마지막오퍼거절후남은준비경로/10원본보관및군기한유지. 경로도달성과재도전재미는구현후시뮬레이션검증.