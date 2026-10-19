최신 확장: [100 히든 특성](100-HIDDEN-TRAITS.md)의 사용자확정 T13~T16을 추가해 총16개다. 기존12개는 공개 특성,신규4개는 해금 전 이름·암시만 공개한다. 보유 전체 자동 적용과 기존cap은 유지한다. T14의 수치 기준은2026-10-19 후속 확정(시즌 라이벌 투수 상대20PA·OPS .900·관계 승리)이다.

# 56. 특성 상세 계약 — 판정·자동적용·중첩·S38

47의기존12특성 및100의히든4특성과계수를사용한다. API/자료형/오류는[64](64-EXPANSION-COMMON-CONTRACT.md). 아래는추가설계결정D이며실행검증전. 특성은로그잇효과·수비·진루·교체의4처리유형으로분리한다.

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

## 해금·효과 적용 순서

[65 사용자결정](65-USER-TRAITS-XP-STAFF.md):기록해금후보유특성모두자동적용. 장착슬롯/시그니처수상한/변경창/AI조합선택폐기. 경기종료시해금은그경기를소급수정하지않고다음타석snapshot부터반영. 대학/프로/국제이동으로해금초기화안함. AI/동료/상대도같은해금/자동적용규칙.

T01첫대면키=(gameId,batterId,pitcherId),타석시작전에방문0이면활성,BB/HBP도방문소모. T05/T11타석시작만루. T09는inning≥8 AND abs(scoreDiff)≤3,T12는inning≥9 AND 자기팀리드,동점비활성. 타자/현재투수전체보유중조건충족logit합을[-.06,.06]cap→구종/성향합→[-.10,.10]cap→softmax. 시그니처2개라도조건충족하면모두원벡터에포함.

T04는피로/적합도처리전본인유효수비+2/clamp100→적합도→야수8명평균에한번. T03기본추가진루p+.02후[.40,.90]. T10은SP교체검토수+3후105상한,하드110/피로80검토유지. 이비logit효과는logitcap에섞지않음. 총보정이cap에닿으면상세도움말에원합/적용합구분,누락특성이라고표시하지않음.

## AI와 원본

AI는기록과영구능력으로동일조건을해금하고수동선택/순위최적화없음. 주인공만해금조건을완화하지않음. 치트는특성전부해금효과없음. archive의unlockedTraits/evidence/definitionVersion보존,어린복사본은해금0/기록0으로시작. 원본도감은출처탭. 지도자는현역특성을선수단에복사하지않음.

## 데이터와 API

| 엔티티 | 필드·제약 |
|---|---|
|trait_definitions|traitId/version복합PK,kind,signature,predicateKey,handlerType,effectVector;세이브고정버전 |
|player_trait_unlocks|saveId/playerId/traitId UNIQUE,definitionVersion,evidenceKey,unlockedAt;append-only |
|trait_effect_evidence|gameId/playCursor/traitId/side UNIQUE,conditionSnapshot,rawVector,combinedCappedVector;중요로그보존 |

traitLoadouts테이블은채택하지않는다. GET expansion/traits?playerId=… →{playerId,autoApply:true,unlocks:[{traitId,progress,evidenceRef}],definitionVersion,currentConditionEffects}. 자동해금은경기/기록정산명령의transaction에포함,클라이언트UNLOCK_TRAIT명령없음. EQUIP_TRAITS요청은422 NOT_ELIGIBLE/automaticTraits로거절,효과없음. 핀한표시특성이필요하면개인UI선호값일뿐활성여부와무관.

## S38 흐름·실패·검수

보유/미해금탭→조건진척/영구능력→실제상황별효과→획득근거경기. 기본안의2슬롯/적용버튼을삭제,‘보유 특성은 조건이 맞으면 모두 적용됩니다’표시. 조회실패는도감0으로취급안함. 다른기기진행후새목록조회,이화면열람으로save revision/난수변경0.

TR-D01 BB29→30단1해금/02같은경기receipt재처리중복0/03T05와T06둘다보유하면PS만루동시원합적용/04원벡터.08→cap.06/05무주자T05미활성/06첫대면BB소모/07원본보유12개복사0/08도감읽기난수0. 구현시경계·transaction·권한·응답유실을[64](64-EXPANSION-COMMON-CONTRACT.md)와fixture로실행검증한다.

미해금 히든 응답은traitId/hidden/name/hint만 허용하고 progress/predicateKey/evidenceRef/효과·문턱을 포함하지 않는다. 일반 특성의 진척 응답과 해금 후의 상세 응답을 구분한다. 클라이언트용 번들·캐시·정적JSON에 서버 규칙 파일을 포함하지 않는다. 해금은 최종 경기/관계·시즌 정산의 같은 영수증 안에서 한 번,다음 실제 타석부터 적용하며 이전 경기 재계산은 없다. T14는 같은 라이벌/시즌/대회 정규 기록의 원분모로 검사,관계 승리 선택지를 누른 사실이 아니라 확정된 이벤트 결과가 근거다.

후속 경계 계약 D: [107 라이벌·히든 경계](107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)의 프로 형성/직접 결투 WIN·T14 대상 집합/완봉·연속 시즌/정정 규칙을 해당 범위에 적용한다. 사용자 확정 해금 문턱·효과는 유지한다.
