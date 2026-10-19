최신 변경: [34 유형·대학·진로확률](34-ARCHETYPES-COLLEGE-ODDS.md), [35 능력6개·육성4개·평균](35-SIX-ABILITIES-FOUR-FOCUS.md), [36 구단치트](36-CLUB-SECRET-CHEAT.md)가 해당 분야의 이전 제안을 대체한다. 미국오퍼0경로·집중1~2개·단순적용100%·대학후속범위는 폐기한다.

# 상세설계 08 — 이벤트69종 조건·문안·효과 계약

사건은 정해진 조건과 명령을 안내한다. 문구가 능력/계약/병역 상태를 직접 변경하지 않고 검증된 게임 명령이 효과를 적용한다. 서면 검수이며69개분기의fixture실행은미실시.

## 분류와 호출

E01~07 고교/진로, E08~20 육성/기용, E21~23 부상, E24~29 기록/시즌, E30~37 계약/은퇴, E38~40 구단, E41~43 스타일/강화, E44~48 대표, E49~55 병역, E56~69 해외경로. 국가대표/병역/계약상태를 일반35%추첨으로만노출하지않고해당의무task가호출한다.

고유 의무 사건: E05~09,E13,E21~24,E27~37,E41~44,E46~69는상태/마일스톤조건에따라발생. E25는해당올스타선발조건, E38/E39/E40은구단운영조건. 일반추첨은E10/E11/E12/E14~20/E26중충족후보만. 같은시즌일반최대3/체크포인트1. phase/선수kind/부상검사우선,지난사건과부정합이면후보제외. 일반사건쿨다운2시즌,카탈로그에시즌1회지정된것은해당지정우선.

고유키=(saveId,eventDefinitionId,sourceTaskId). 마일스톤은(playerId,milestoneId),훈련은(playerId,seasonId,training),대회는(playerId,competitionId,eventType),계약은offerSetId. ID만고유라모든시즌재계약을한번만막는오류금지. 커리어1회는E01~10의최초성격/E24/E27/E29/E46/E60/E65,단E05~07재도전은해당진로program별1회.

## 선택 정의

choiceId는안정코드,버튼순서를효과ID로쓰지않음. label/body/preview/result/successFollowup/failureFollowup/expiryReason을구분. 현재입력에없는성적을문안변수로사용금지. 원본표의'선택지결과조회'는조회행동이며기회재추첨아님.

확정순서:source 유효→선택가능성재검사→effect계산→실제상한절삭값반영→ledger키예약→상태와효과커밋→결과문렌더링. 결과문은실제 delta/actualRole/actualAppearance에서만생성. 출전희망을출전확정으로서술하지않음.

## 중요한 정정

- E21 통증은이미확정된의료결과뒤선택. 진단을다시추첨하지않음.
- E22 정상복귀는회복기간단축이나영구버프가아니라기용요청/피로차이.
- E30 거절은프로재도전총3/시즌1 제한,모든제안거절후은퇴행동필수.
- E35 B는읽기전용,영원히확정못하는화면이아니라A은퇴버튼유지.
- E37 자유인사는은퇴snapshot에영향없는별도메타데이터.
- E41 강제로스타일바뀜과선택변경은구분,횟수는22.
- E43 부상연기는기회유지,사용자건너뛰기는그시즌포기.
- E47 면제/복무완료대신자격후보. 실제출장증거필수.
- E49/E54 유예기한전후가능선택동적,기한후유예버튼없음.
- E57 계약조회만으로국내진로포기안함,수락때만고정.
- E59 승격을사양하면24경기와최소7세계일후검토,중복추첨없음.
- E61 옵션없음FA권리있는선수만선택,모든강등에FA버튼금지.
- E64 포스팅실패는원계약보존,임의능력감소없음.
- E68 국내준비2시즌과18개월복무포함관계.

## 문안과 접근성

한사건본문목표2~4문장/한선택제목20글자이내,효과는별도2줄. 200%확대시스크롤가능,선택확정하단버튼이내용을가리지않음. 긴이름은중립문장/조사유틸,게임내자유텍스트HTML탈출. 이름을비난하는실패문안금지,희망이실패했을때객관기록으로설명한다.

후속조건:선택뒤최초정규검토시점에다시판정. 결과달성시'요청한역할에서N경기',미달성시'기회로이어지지않음'. 상한때'강화대성공+2'로고정출력하지않고실제상승량. 대표탈락이면'대표로뛰었다'생성금지. 군복무/미국진출은실제리그상태값에서문장선택.

## 효과 fixture 포맷

각69종마다given{phase,playerKind,registration,availability,sourceId,revision,rng},when{choiceId},expect{nextPhase,actualDeltas,ledgerKeys,remainingChoices,renderedVariables}. 필수케이스정상/경계/조건소멸/동일명령재시도/다른choice동일명령ID/두기기동시선택. unsupported변수와누락된후속단계는콘텐츠빌드실패로처리한다.

## 69종 원본과 연결표

아래표는정의원본의모든ID를한번씩수록한다. 상세효과는04/12/13,전체문안E01~40은09,후반사건의본문은12/13의각행을사용한다. 본문의조건별결과템플릿은본계약과분야별상세문서로보강한다. 런타임콘텐츠작성때표의자연어조건을추측구현하지않고위fixture로코드/데이터의정합성을검증한다.

| ID | 사건 | 발생 조건/본문 참조 | 정의 원본 |
| --- | --- | --- | --- |
| E01 | 마지막 고교의 겨울 | HS_PRE, 고유 | [04-EVENTS.md](04-EVENTS.md) |
| E02 | 타격 자세의 갈림길 | 고교 타자, 12경기 | [04-EVENTS.md](04-EVENTS.md) |
| E03 | 마운드의 과제 | 고교 투수, 12경기 | [04-EVENTS.md](04-EVENTS.md) |
| E04 | 스카우트의 질문 | HS_RESULT | [04-EVENTS.md](04-EVENTS.md) |
| E05 | 지명을 기다리는 날 | DRAFT_RESULT | [04-EVENTS.md](04-EVENTS.md) |
| E06 | 이름이 불리지 않았다 | UNDRAFTED | [04-EVENTS.md](04-EVENTS.md) |
| E07 | 다시 받은 기회 | RETRY_RESULT, 제안 존재 | [04-EVENTS.md](04-EVENTS.md) |
| E08 | 프로의 첫 캠프 | 첫 PRO_PRE | [04-EVENTS.md](04-EVENTS.md) |
| E09 | 첫 1군 호출 | FUTURES, 자리 존재, 경쟁점수 충족 | [04-EVENTS.md](04-EVENTS.md) |
| E10 | 짧은 기회의 무게 | 첫 콜업 후20경기 | [04-EVENTS.md](04-EVENTS.md) |
| E11 | 두 번째 숙제 | 2군 한 시즌 종료 | [04-EVENTS.md](04-EVENTS.md) |
| E12 | 주전과 백업 사이 | 1군 타자, 출장비율<40% | [04-EVENTS.md](04-EVENTS.md) |
| E13 | 낯선 수비 자리 | E12 START_POSITION_PLAN 확정 후 계획24경기 완료 | [04-EVENTS.md](04-EVENTS.md) |
| E14 | 선발의 문 | RP, 체력≥60, SP 공석 | [04-EVENTS.md](04-EVENTS.md) |
| E15 | 마지막 아웃의 자리 | RP, 위기≥60, CP 공석 | [04-EVENTS.md](04-EVENTS.md) |
| E16 | 구속보다 안정 | 투수, BB9>4.5, 20이닝 이후 | [04-EVENTS.md](04-EVENTS.md) |
| E17 | 긴 무안타 | 타자, 최근20AB H=0 | [04-EVENTS.md](04-EVENTS.md) |
| E18 | 장타가 필요한 때 | 타자, 100AB HR≤1 | [04-EVENTS.md](04-EVENTS.md) |
| E19 | 흔들린 두 경기 | SP, 최근2등판 ER≥10 | [04-EVENTS.md](04-EVENTS.md) |
| E20 | 코치의 조언 | 일반, morale≤40 | [04-EVENTS.md](04-EVENTS.md) |
| E21 | 작은 통증 | 부상 판정 경미 시 | [04-EVENTS.md](04-EVENTS.md) |
| E22 | 긴 재활 | 부상 중간/중대 시 | [04-EVENTS.md](04-EVENTS.md) |
| E23 | 돌아온 그라운드 | 부상 회복 직후 | [04-EVENTS.md](04-EVENTS.md) |
| E24 | 처음 받은 박수 | 첫100H 또는 첫10승/20SV | [04-EVENTS.md](04-EVENTS.md) |
| E25 | 올스타의 초대 | 시즌중 성적 상위, 고유 시즌 | [04-EVENTS.md](04-EVENTS.md) |
| E26 | 라이벌의 등장 | 동포지션 경쟁점수±5 | [04-EVENTS.md](04-EVENTS.md) |
| E27 | 포스트시즌의 긴장 | 첫PS | [04-EVENTS.md](04-EVENTS.md) |
| E28 | 우승 뒤의 겨울 | 팀 우승, OFFSEASON | [04-EVENTS.md](04-EVENTS.md) |
| E29 | 첫 개인상 | 첫 수상 | [04-EVENTS.md](04-EVENTS.md) |
| E30 | 재계약 제안 | 비FA CONTRACT | [04-EVENTS.md](04-EVENTS.md) |
| E31 | FA 시장의 문 | 자격 충족 CONTRACT | [04-EVENTS.md](04-EVENTS.md) |
| E32 | 익숙한 유니폼 | FA 원구단/타구단 제안 존재 | [04-EVENTS.md](04-EVENTS.md) |
| E33 | 베테랑의 역할 | 나이≥33, 백업 전환 | [04-EVENTS.md](04-EVENTS.md) |
| E34 | 전력 외 통보 | 계약 미보유, 팀 후보 제외 | [04-EVENTS.md](04-EVENTS.md) |
| E35 | 마지막 테스트 결과 | 재도전 후 제안없음 | [04-EVENTS.md](04-EVENTS.md) |
| E36 | 떠날 시기를 고르다 | 수동 은퇴 가능 OFFSEASON | [04-EVENTS.md](04-EVENTS.md) |
| E37 | 마지막 인사 | RETIRED | [04-EVENTS.md](04-EVENTS.md) |
| E38 | 장기집권의 부담 | 구단 3연패, CLB_REVIEW | [04-EVENTS.md](04-EVENTS.md) |
| E39 | 기회를 원하는 유망주 | 구단2군,22세이하,경쟁점수상위 | [04-EVENTS.md](04-EVENTS.md) |
| E40 | 한정된 겨울 예산 | 구단 오프시즌, 예산<예정연봉 | [04-EVENTS.md](04-EVENTS.md) |
| E41 | 타석의 새로운 기준 | 프리시즌/시즌72경기. '지금의 장점을 어떤 접근으로 보여줄까요?' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E42 | 다른 이름의 선수 | 결산별칭변화. '이번 시즌의 변화가 선수의 인상을 바꿨습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E43 | 한 번의 특별훈련 | 시즌훈련기회. '한 가지를 더 다듬을 시간이 생겼습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E44 | 국가의 부름 | 최종후보. '대표팀이 합류 의사를 물었습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E45 | 대표팀 밖에서 | 선발탈락. '이번 명단에는 이름이 없었습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E46 | 첫 국제무대 | 대회첫실제출장. '유니폼 앞의 이름이 달라졌습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E47 | 메달과 다음 의무 | 올림픽메달/AG금+게임자격충족 | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E48 | 돌아오는 비행기 | 대회종료. '팀의 결과와 내 경기를 돌아봅니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E49 | 겨울의 병역계획 | 미해결오프시즌. '다가올 시즌과 복무 계획을 함께 생각합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E50 | 상무 선발 발표 | 지원1회확정. '지원 결과가 도착했습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E51 | 잠시 내려놓는 배트 | 현역복무시작. '원구단을 떠나 복무를 시작합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E52 | 부대의 그라운드 | 상무첫블록. '군 체육팀에서 야구와 복무를 이어갑니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E53 | 다시 받는 유니폼 | 18개월완료. '복무를 마치고 원구단으로 돌아왔습니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E54 | 남은 마지막 겨울 | 27세미해결. '게임 규칙상 다음 시즌 전에는 복무 계획을 확정해야 합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E55 | 계속되는 활동의무 | ATHLETE_SERVICE오프시즌. '선수 활동과 함께 이행할 의무를 확인합니다.' | [12-STYLE-INTERNATIONAL-MILITARY.md](12-STYLE-INTERNATIONAL-MILITARY.md) |
| E56 | 졸업 뒤의 두 길 | '국내 지명과 미국 구단의 관심, 어느 길을 먼저 볼까요?' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E57 | 바다 건너의 계약서 | '첫 시작은 메이저 무대보다 작은 구장일 수 있습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E58 | 낯선 클럽하우스 | '언어도 준비도 낯설지만 오늘의 훈련은 시작됩니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E59 | 다음 레벨의 문 | 승격조건충족. '한 단계 높은 팀에서 기회를 받았습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E60 | 메이저리그의 전화 | '구단이 메이저리그 합류를 알렸습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E61 | 다시 내려가는 길 | 강등확정조건. '상위 명단에 남지 못했습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E62 | 포스팅을 요청하다 | '국내에서 쌓은 시간 뒤에 새로운 무대를 생각합니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E63 | 구단의 대답 | '원구단이 요청에 답했습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E64 | 협상의 끝 | '제안과 남은 시간을 함께 봅니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E65 | 처음 선 빅리그 | 실제첫출장. '명단의 이름이 경기 기록의 이름이 됐습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E66 | 미국에서 맞는 FA | '새 팀과 새로운 역할을 고를 수 있게 됐습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E67 | 돌아갈 그라운드 | '다시 국내에서 뛰는 길을 확인합니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E68 | 기다림도 커리어 | '복귀를 준비하는 시간이 지나갑니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |
| E69 | 두 리그의 마지막 인사 | '어느 리그의 기록도 다른 기록을 지우지 않습니다.' | [13-MLB-CAREER.md](13-MLB-CAREER.md) |


## 검수 결과와 남은 실증

정의ID69/고유69/빈본문참조0을정적검사한다. EN/일본어혼입/비밀키/복제코드없는지검수. 실행조건의도달가능성·UI문구폭·사건효과중복은엔진/목업실행후검증이며문서완료와구분한다.


최신카탈로그는[45 이벤트83종](45-EVENT-CATALOG-REVISION.md). 기존69종의본문/선택명령을갱신하고대학·탐색·제안·재건·가져오기14종추가. 구문안은시점보관이며런타임원본은v2설계카탈로그를따른다.
