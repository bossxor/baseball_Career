# Native 고교 웹 이어하기·정확한 명령 재전송 — 2026-11-05

## 구현
기존 커리어 화면과 HTTP 어댑터를 그대로 사용한다. 소유한 고교 native 저장의 GET /career를 공개 선수·종합·학교·경기수와 현재 owner가 제공하는 명령으로 연결했다. 생성 확인·E01/E02/E03 집중 유지·프리시즌 시작·정규 진행만 제공한다. 알 수 없는 사건을 UI 셸로 대체하거나 임의 ACK하지 않는다. 화면 단계는 한국어 표시다.

웹은 school: 행동을 클릭할 때 현재 공개 행동과 저장 버전을 다시 읽고 CAREER_SCHOOL_*를 보낸다. UI_ADVANCE로 대체하지 않는다. 명령 ID마다 최초 saveRevision·type·payload 전체를 복사해 보관한다. 네트워크 응답 상실뿐 아니라 명령 영수증 수신 후 화면 재조회 실패에도 원래 요청을 재전송한다. 명령과 화면 재조회가 모두 성공한 뒤 해제한다. saveId+commandId로 구분하고 기존 409 갱신 규칙을 유지했다. 기존 UI 진행·구단 명령의 후속 조회도 같은 처리로 보호한다.

## 실행 근거
- 실제 PGlite API + createHttpApi 통합: DB fixture 없는 생성, 웹 이어하기→선수 확인→집중 유지→프리시즌→첫 worker, 두 번째 클라이언트에서 읽기, POST 응답 상실 및 성공 영수증 뒤 GET 상실 재전송을 확인한다.
- RED: 후속 GET 실패 뒤 재시도 시 COMMAND_ID_REUSED 재현. 원래 payload/expectedRevision을 후속 조회까지 유지하도록 수정했다.
- 웹 전체25/25·fail0·skip0, 학교 HTTP2/2·fail0·skip0, API/웹 타입·린트 종료0. 최종 집계/소요시간은 아래 로그를 근거로 삼는다.
- API/Web production build 종료0. 동결 engine/rules를 다시 빌드하지 않았다. build-gates.json 및 api-build.log/build.log 참고.
- 독립 읽기 전용 리뷰 조치 필요 사항 없음.
- evidence/M2-20261105-school-web-final.log, -api-final.log, -gates.json, -types.log/-webtypes.log/-lint.log. -refresh-red.log와 exitcode는 수정 전 재현이다.

## 한계
생성 웹 폼은 아직 기존 셸이며 native 학교·연도·난이도·구종 입력 UI는 남아 있다. API로 만든 실제 고교 저장의 이어하기와 위 행동만 연결했다. 다른 학교 사건/졸업·KBO 화면 전체·미국 전체·포스트시즌·99사건/24경로/PF 완성으로 세지 않는다. 이 검사는 두 HTTP 클라이언트의 DB 공유 검증이며 실제 Android/iPhone 실기기나 배포 환경 검사가 아니다. source 동결 복무2년과 후속 미국 시즌 검사는 별도이며 아직 PASS로 세지 않는다. 전체 npm run check 미실행.
