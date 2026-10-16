# 72. 세계 연도 전환의 단계별 준비·원자 활성화

10개국내팀/미국조직/대학/독립준비/복무선수의같은세계달력을함께넘긴다. 날짜하루진행과달리연도전환은큰준비작업을나눠저장하되사용자에게반쯤새시즌인세계를노출하지않는다. 구현전계약이며production일괄변경실행없음.

## 시작 가능 조건

현재세계경기·국제·PS최종완료,수상/성장/노쇠/강화포기확인/병역기한/현재계약·포스팅·FA·드래프트의필수사용자선택마감,미해결pendingGame0,필수task0. 다음시즌을결정해야하는선택이남아있으면그화면으로보내고job이대신계약/은퇴/입대선택안함. 구단100시즌한도/선수다음나이초과는마지막안내·읽기보관경로,넘길수없는시즌을억지생성안함.

NEXT_SEASON확정에sourceRevision/activeGenerationId/targetSeasonId를고정,yearTransitionId unique(saveId,targetSeasonId). 시작때save의writeGate=YEAR_TRANSITION,일반변경명령은423 WORLD_TRANSITION_PENDING(64오류확장)/조회·receipt·진행상태확인허용. 같은요청재시도는기존job,두기기다른요청도동일target으로job2개생성안함.

## 상태와 단계

REQUESTED→PREPARING→VALIDATING→READY→ACTIVATING→COMPLETED,실패는FAILED_RECOVERABLE또는FAILED_BLOCKED. old active generation은COMPLETED전까지현재세계원본. 각staging단계는stepKey/입력hash/출력hash/checkpoint를남기고같은키재시도기존출력재사용.

| 단계 | 입력·처리 | 중복 방지 |
|---|---|---|
|Y01|source영구기록/시즌·성장원장마감검사/변경불가snapshot|settlement키로재성장0 |
|Y02|나이+1/병역·학적·계약이월/사망모형없음|targetSeason/playerId고유;같은출력age사용 |
|Y03|모든조직정원/부상회복상태/계약보장·staff예산이월|행별sourceVersion확인 |
|Y04|선수공급/FA하한/후보source이월|rookieBatchKey(targetSeason,region),오프시즌이미생성분재사용 |
|Y05|스케줄·국제창·대학·독립준비일정준비|scheduleSeed/버전고정,관측일중복검사 |
|Y06|68 AI전략/기용기본안/예산검사/전망정보이월|팀별strategyKey,숨은P사용없음 |
|Y07|연도시작원장/새강화usage/기회창생성|season별0새원장,이전소모이력유지 |
|Y08|71전체불변조건/정원·경기수·파일참조검사|reportHash/sourceHash결합 |

성장/노쇠는이미전년도마감에서처리한값을Y01에서검사만,새해나이증가와동시에다시가산/감산안함. source에미완료정산이있으면차단해원단계복귀,job이매재시도예산다시적용안함. 대학복학학년/준비used/잠재력관측범위/구종XP성숙등은이월,새해계정이아니므로초기화안함.

## 활성화와 실패

READY는완료reportHash를확보한상태. 짧은행잠금transaction으로sourceRevision/activeGenerationId/writeGate/job상태를재확인→activeGenerationId를target으로교체→worldSeasonId/phase=각합법PRE단계/rngState참조갱신→jobCOMPLETED/receipt/새revision커밋. 전체선수와계약관계는generation참조로같은순간활성,1팀씩업데이트가시화금지. 읽기API는단일activeGeneration snapshot으로조회한다.

PREPARING장애는기존세계를읽기가능,재시도같은job/seed. VALIDATING실패는source영구자료무변경,진단report와복귀가능행동제시. source불변이고아직활성화전이면CANCEL_YEAR_TRANSITION으로staging참조만폐기하고old gate해제가능,다음재시작도같은대상시즌고정seed/공급batch재사용(취소로재추첨불가). 활성화후취소불가,기존백업새세이브복원70으로분리.

worker lease=jobId+stepKey+leaseVersion,시간만료후다른worker가이어받아도출력고유키동일. 원격파일upload와길이큰통계는행잠금밖. 고아staging청소는job소유/참조0/실패완료상태확인뒤만,원본기록/보관archive/activegeneration청소금지. 사용자에게정확하지않은전체퍼센트를만들지않고‘나이·계약이월 10/10팀’같은현재단계진척만표시.

## 데이터·API·검수

year_transition_jobs(saveId,targetSeasonId UNIQUE,sourceRevision,sourceGeneration,targetGeneration,status,currentStep,sourceHash,validationHash,leaseVersion),year_transition_steps(jobId,stepKey UNIQUE,inputHash,outputHash,status),world_generations(saveId,generationId UNIQUE,status,sourceGenerationId),rookie_batches(saveId,seasonId,region UNIQUE,seedKey,playerSimulationKeys). immutable이전기록은generation별중복복사대신참조,현재행은copy-on-write.

POST /api/saves/{id}/commands type=NEXT_SEASON,payload={targetSeasonId},previewId필수→{outcome:PENDING,jobId};GET /api/saves/{id}/year-transitions/{jobId}→{status,step,unitProgress,retryable,activeGenerationId};RETRY_YEAR_TRANSITION/CANCEL_YEAR_TRANSITION={jobId,expectedJobVersion}. pending성공receipt가있는NEXT_SEASON은같은job반환,job완료조회에서최종revision제공.

YEAR01 중간worker중단뒤age증가1/02신인batch1/03원세대최종까지읽기가능/04활성세대전팀동시/05전년도성장중복0/06미해결필수선택시job0/07취소재시작seed동일/08lease동시두worker효과1/09이전reportHash로새source활성화거절/10대학·준비·관측·원본참조이월. 100시즌경계와강제장애각단계실험은구현후73의게이트.