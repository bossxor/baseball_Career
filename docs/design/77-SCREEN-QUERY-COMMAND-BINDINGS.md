# 77. 전체 화면의 조회·명령·결과 연결 계약

2026-10-19. [screen-action-bindings.json](screen-action-bindings.json)은S01~45의기본queryKey/행동/actionClass를지정한다. 기존화면카탈로그의데이터·빈상태·오류문구와함께읽는다. 논리키를정한것이며실제API/라우터구현이나이름자동검색이아니다. 아래가대표행동의정규화이름이며기초문서의동의어는같은핸들러에명시매핑한다.

## 조회 모형

queryKey는도메인projection이름,새범용‘모든데이터’endpoint가아님. 28/56~76의해당GET경로를사용한다. 기본{viewVersion,sourceRevision,phase,allowedActions,blockingReasons,data}와scope/saveId/owner검사를공유. projection에는화면에필요한공개필드만,전체state/원잠재력/다른사람데이터/seed를반환하지않음. 서명URL은필요한소유파일조회에만짧은만료로발행한다.

READ_ONLY/QUERY행의메뉴이동·카드선택은세계명령이아니다. S04/S28졸업진로비교는조회,실제계약수락/대학입학에서만배타진로가정해진다. S09은은퇴를다시실행하지않고이미확정된receipt와원본을읽는다. S38은모든보유특성자동효과조회,장착API를복원하지않음.

## 명령과 결과 라우팅

SAVE_COMMAND는64/74의expectedRevision+preview+commandId,조회혼합화면의각행동은유형별구분. S40 SET_GOALS/REPLACE_GOAL은세계명령이나EQUIP_COSMETIC은58개인resourcePreference CAS. S44읽기/되감기/속도는세계명령0,위치저장만개인preference. S45장면조회와메모는63,카드생성은export job. S21음량·폰트·모션은기기선호,로그아웃·계정삭제는별도인증/재인증명령이며설정저장에묶지않음.

명령성공뒤클라이언트가고정다음화면을가정하지않고result.eventIds/phase/allowedActions/resumeDescriptor를따른다. 예S03진행은S06선택/S23기회/S26복무/S07결산/pendingGame중서버현재합법대상. 이벤트안에서같은명령을재실행해다음화면을판단하지않음. outcome=REJECTED도정상확정결과로보여주고효과·비용원장은receipt값을사용한다.

JOB_REQUEST인S20백업·복원은jobId조회,기존save를현재파일내용으로자동덮지않음. OWNER_CREATE인S02/S12는아직saveId가없으므로64의save명령경로를억지로호출하지않고78의소유자생성명령계약사용. 미해결원요청은화면변경뒤에도동일저널에서추적한다.

## 화면별 입력 검증과 접근

프런트검증은즉시도움말일뿐,서버는종류/학적/권리/나이/슬롯/예산/기회재검사. 조회캐시가오래되면기존수치를회색읽기상태로유지하고확정만막는다. 세이브직접URL을열면먼저owner+phase검사,예전화면에서뒤로가기했다고이전시즌강화가능해지지않음. 서버가불가로반환한진로를클라이언트숨김만으로보호하지않음.

폼초안key=(owner,saveOrCreationId,screenId,entityId,schemaVersion),sourceRevision보존. 다른선수/다른시즌폼으로초안자동이식금지. 라인업은9자리중복검사/구종은비율합/육성은정확4개/특성은읽기전용/제안은금액·기간이라는도메인검증차이를유지. 선택카드에확률이있다면정확한대상/최종p/비용,실제1은숫자숨김.

## 수용 기준

S01~45모두연결행1개,알수없는actionClass/빈actions없음. QUERY만으로save revision/PRNG/원장이변하지않음. MIXED행의개인설정을세계명령으로묶지않음. SAVE_COMMAND는receipt조회/충돌복구단계를갖고OWNER_CREATE는생성후saveId모를때복구할수있어야한다. 정적검사는매핑존재만증명,실제버튼이동·권한·폼·모바일뒤로가기는구현후화면통합테스트다.