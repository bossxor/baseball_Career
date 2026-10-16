# 56. 특성 상세 계약 — 판정·중첩·AI·S38

47의12특성과계수를사용한다. API/자료형/오류는[64](64-EXPANSION-COMMON-CONTRACT.md). 아래는추가설계결정D이며실행검증전. 특성은로그잇효과·수비·진루·교체의4처리유형으로분리한다.

## 해금 판정의 정확한 범위

OFFICIAL은HS/COLLEGE/INDEPENDENT/FUTURES/KBO/ROOKIE/A/AA/AAA/MLB/국제의실제공식경기,연습/자체청백전제외. ‘한시즌’은worldSeasonId+competitionId+REGULAR한묶음이며다른레벨을합쳐문턱을넘기지않는다. ‘커리어’는OFFICIAL전체,PS는phase=POSTSEASON만. 능력조건은버프없는영구값,해금시점만검사하고나중에노쇠해도박탈없음.

| 특성 | 정확한 evidence 조건 |
|---|---|
|T01|같은시즌정규PA≥150 AND (2B+3B+HR)≥20 |
|T02|같은시즌정규BB≥30 |
|T03|커리어추가홈진루성공≥20,단순기본진루미포함 |
|T04|커리어실제수비출장100경기 AND DEFENSE≥70,DH단독출장제외 |
|T05|타석시작만루의커리어H≥10 AND CLUTCH≥70 |
|T06|커리어PS HR≥5 |
|T07|같은시즌정규K≥100 |
|T08|같은시즌정규투수outs≥300 AND COMMAND≥65,보직무관 |
|T09|커리어SV≥20 AND COMPOSURE≥65 |
|T10|같은시즌정규선발등판≥20 AND STAMINA≥70 |
|T11|타석시작만루상대BF≥30 AND COMPOSURE≥70 |
|T12|커리어SV≥100 |

경기최종커밋→통계누적→미해금정의조건평가→해금행/근거/ E84동일transaction. 경기중문턱을넘겨도그경기의장착과확률은불변. 같은특성은playerId+traitId고유. 기록정정이있으면획득근거에정정표식,이미소비한경기결과소급변경없음.

## 장착 창과 효과 처리

windowId=playerId:worldSeasonId:PRE또는MID. MID는소속리그정규절반올림에서한번,이적/승강으로다시열리지않음. 부상/복무로지난창은복귀시미사용MID를한번만열고시즌넘기면소멸. 창당변경확정1회,동일목록은NO_CHANGE로기회미소모. 비워두기허용,종류일치/해금/중복없음/2개이하/시그니처1개이하필수. 프리시즌창은정규첫경기전에닫힘.

T01첫대면키=(gameId,batterId,pitcherId),타석시작전에방문0이면활성,볼넷/사구도방문소모. 교체후재등판금지규칙때문에회피없음. T05/T11은타석시작만루,타석도중진루상태로재평가안함. T09는inning≥8 AND abs(scoreDiff)≤3,T12는inning≥9 AND 자기팀리드,동점비활성.

타자와현재투수의활성logit벡터를동일결과키별합산→[-.06,.06]cap(양측전체특성합)→구종/성향추가→[-.10,.10]cap→softmax. T04는유효수비계산후본인값+2/clamp100→8야수평균에한번. T03은기본추가진루p+.02후[.40,.90],상대투수특성p변화없음. T10은SP교체검토수+3후105상한,하드110/피로80검토유지. 특성보유수가평균종합을바꾸지않음.

## AI 선택의 고정 평가

변경창에유효장착조합0~2개전부열거,시그니처상한검사. 상대능력50/피로0/구종벡터0기준으로무주자.45/1루.25/득점권.20/만루.10,5회.50/8회동점.25/9회1점리드.25의조합을평가. PS활성상황가중.10/정규.90. 타자효용=BB×.7+1B+2B×1.6+3B×2+HR×2.4-K×.2,투수효용=K×.6+OUT×.3-BB×.8-HBP×.9-1B-2B×1.2-3B×1.6-HR×1.8. 조합별기본대비차이를가중합.

비logit특성은T03예상시도.10×p개선,T04수비출장가능일때+.001×수비실제증가,T10선발이면+.001×검토투구수실제증가를효용에더함. DH전문이면T04효용0. 최고조합,차1e-9이하동률은장착수적음→traitId정렬문자열. 매경기재최적화없음. 이효용은AI선택기준이며실제승률예측값으로표시하지않음.

## 데이터와 API

| 엔티티 | 필드·제약 |
|---|---|
|trait_definitions|traitId PK,version,kind,signature,predicateKey,handlerType,effectVector;사용중정의수정금지 |
|player_trait_unlocks|saveId/playerId/traitId UNIQUE,definitionVersion,evidenceKey,unlockedAt;원본내보내기포함 |
|trait_loadouts|saveId/playerId PK,traitIds sorted,windowId,changesUsed0/1,rowRevision |
|trait_effect_evidence|gameId/playCursor/traitId/side UNIQUE,활성조건/원벡터/cappedVector;중요로그보존 |

GET expansion/traits?playerId=… →{playerId,window:{id,canChange,used},equippedIds,unlocks:[{traitId,progress,evidenceRef}],definitionVersion}.
preview/command type=EQUIP_TRAITS,payload={playerId,windowId,traitIds:[T02,T05]}. preview에before/after/changesRemaining/ignoredInOverall반환. T05미해금→422 NOT_ELIGIBLE/traitIds,두시그니처→422 SLOT_CONFLICT,경기진행중→422 WINDOW_CLOSED. 성공result={outcome:APPLIED,equippedIds,changesUsed:1};반복같은명령receipt동일.

## S38 흐름과 검수

보유/미해금탭→선택초안→2슬롯/시그니처수→조건/실제효과도움말→preview→적용. 해금진척과단순현재능력조건을구분표시. 상태충돌은초안유지후새창유효성검사,이미창닫혔으면읽기전용전환. 필요한fixture TR-D01~08은기계가독목록참조:29→30BB단1해금,반복경기,3장착거절,같은목록미소모,만루경계,cap합산,첫대면BB소모,복사도감초기화. 실제확률분포/AI성능은구현후게이트.