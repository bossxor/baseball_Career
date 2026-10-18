# 74. 미리보기·확정·응답 유실의 교차 계약

2026-10-19 교차 점검. 28/64의공통처리를유지하며40계약·57구종·59개인협상·61직원·70복원·72연도전환이같은규약을사용하게정리한다. 구현코드는아직없다.

## 명령과 미리보기의 책임

preview는조회다. source save revision/규칙버전/관련entity revision/payloadHash에묶여10분유효,돈·횟수·PRNG·선수생성효과0. 후보·AI제안·새진로오퍼같은지속계획은세계진행/협상라운드시작명령에서먼저고정하며preview가새후보를굴리지않는다. 계획이없으면PLAN_NOT_READY와유효현재행동안내,빈목록을성공탐색인것처럼보여주지않음.

previewId는서버소유row또는무결성검증가능토큰,ownerSubject/saveId/type/sourceRevision/payloadHash/rulesVersion/validUntil에결합. 클라이언트의effects/odds/costs를명령입력으로신뢰하지않음. 조건이달라지면PREVIEW_STALE,기존수락확률을유지하려경쟁자·예산·선수권리를동결해버리는계약아님. 일반명령은expectedRevision일치필수,해당모드에서제약없는순수핀/메모는별도resourceRevision.

## 단일 요청과 receipt

요청저널은commandId/type/payload/expectedRevision/previewId/requestHash를확정직전에보존,재시도때이내용을바꾸지않는다. 서버는소유save잠금→같은commandId receipt확인→있으면원응답(현재preview만료여부보다우선)→없으면revision/preview/권리검사→추첨과원장→상태·receipt한transaction. 같은ID다른본문은409 COMMAND_ID_REUSED. commandId는owner/save범위로고유,다른사용자receipt조회404.

도전강화실패·탐색실패·역제안거절은실행된결과이므로HTTP200/outcome=REJECTED와비용/횟수원장이있다. 오류422와달리다시같은기회를새ID로자동실행하지않음. 검증실패는PRNG/원장효과0. NO_CHANGE는원래상태와동일한구성일때고유receipt저장하되세계revision/기회/비용/난수불변,preview가현재상태와맞지않으면NO_CHANGE로기만하지않고409.

## 결과를 모르는 상태

commit뒤연결끊김은클라이언트RECONCILING. 같은commandId를주DB에서조회,성공receipt확인후결과표시. 404하나만으로‘서버가실행하지않았다’고단정하지않음(원요청진행중가능). 같은원요청을동일ID로재전송해대기/멱등확인,새ID발급금지. 아직진행중이면202 COMMAND_PENDING/retryAfter,자동재확인최대대기후사용자에게나중에조회행동. 확정되지않은성공·실패연출없음.

이프로토콜때문에command reservation을쓴다면PENDING과terminal receipt는구분,실패프로세스의lease회수뒤동일원요청/seed부터재개. reservation존재가비용지급이나추첨성공을의미하지않음. RNG상태는게임transaction과같이저장하므로서버가추첨직후죽어commit이없으면동일snapshot재실행,다른결과seed를만들지않음.

## 비동기 job·동시성

NEXT_SEASON/복원/카드내보내기수락의receipt는jobId와PENDING응답을불변보존한다. job완료를맞추려고원receipt본문을수정하지않음. 재시도는같은jobId,상태는전용GET jobendpoint로조회,최종revision은job결과에서제공. 복원과카드수출은save변경명령과개인resource job의구분을70/63대로유지.

서로다른기기두명령이같은expectedRevision이면첫변경만성공,다른명령은409후새모형·새preview. 서로다른선수라고save lock을건너뛰지않음. 역할claim/선수활성계약고유제약은잠금에추가보호. 같은날여러명령중일부만성공했을때클라이언트가나머지를자동최신revision으로재작성하지않음.

목록/도감조회나개인메모변경은세계revision을증가시키지않으므로현재게임preview를무효화하지않음. 다만예산/권리/정원/능력/오퍼같은근거가실제변하면source revision과payload hash를재검증. 검증코드는64/72오류목록,423연도전환잠금은일반명령재실행대신job조회.

## 서버·클라이언트 금지 사항과 검수

온라인우선게임이므로오프라인에세계명령을여러개쌓았다가나중에새revision으로일괄재생하지않는다. 미확정원요청하나만저널로보존,로그인복구후receipt부터조회. 비밀토큰은그저널에함께넣지않음. 서버시각TTL만료는게임세계날짜/기한이아니며진행없는데오퍼의게임기한을앞당기지않음.

검수기대값CP01 preview반복효과0/CP02같은ID다른payload409/CP03commit응답유실receipt1/CP04실패추첨사용기회1/CP05TTL만료뒤성공receipt원응답/CP06동시두기기변경1/CP07NO_CHANGE원장0/CP08job중복0/CP09개인메모세계revision0/CP10진행중404뒤새ID생성0/CP11사전계획없음미리보기추첨0/CP12검증오류RNG0. 기계가독기대값은[cross-contract-fixtures.json](cross-contract-fixtures.json),실제네트워크·DB실행은미실시.

## 잠재력과 효과 미리보기의 남은 선택

공개범위정책67과강화효과정책42를교차하면정확한증가량으로상한을일부추론할수있다. 이부분은사용자에게‘정확한증가량·비용우선’과‘공개전망기준증가범위’중선택을요청했다. 답변전어느정책도추가확정하지않으며기존게임수치는변경하지않는다. 해당결정은정보표현정책으로분리하고위멱등/동시성계약은독립확정한다.