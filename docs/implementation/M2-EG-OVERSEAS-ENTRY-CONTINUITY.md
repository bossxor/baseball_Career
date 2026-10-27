# M2-EG — KBO 해외 진입의 병역·세계·연말 조회

2026-10-27. 기준5433f78(EF 기능cb1538d). 한국어/YAGNI, PC 종료/M6 병합 없음.

## 수정과 호출 범위

activateKboUsCareer는 이미 COMPLETED/NOT_APPLICABLE인 상태를 새 미국 root에도 그대로 둔다. UNRESOLVED로 초기화해28세 기한에서 다시 복무를 요구하던 회귀를 막는다. 새 활성화는 동일 worldKey/seed·국내 계약 다음 시즌 명단만 받으며, 부적격 병역/타 세계/다른 시즌은 예산/원본을 수정하기 전에 거부한다. 저장 조회만으로 이미 만들어진 구 root를 소급 변경하지 않는다.

usYearTransitionReadiness는 KBO_TRANSFER이면 kboSeasonKey 다음 해를 미국 시작 시즌으로 읽는다. 없는 고교 usRecruitment.program.signing을 무조건 읽어 TypeError를 내던 부분을 고쳤다. 고교 직행 원점은 기존 계약 시즌을 유지하며 누락된 원점은 명시 오류로 거부한다. 이 수정은 조회/첫 개막까지이며 KBO 출신의 미국 재계약/콜업/귀국 전체를 완료하지 않는다.

## 실행과 증거

기존 테스트는 초기 활성화 상태만 읽었다. 실제 고교/KBO 진입 helper의 동일 선수 신원을 이용하고 과거7등록시즌만 통제해 포스팅→캠프→실제 미국 첫75경기·일할 급여·JSON 재개/원본 불변까지 확장했다. 과거7시즌은 native가 아니다. 기존 NPC 신원을 주인공으로 바꾼 fixture의 잘못된 고교 연결과 불완전 development 필드를 고쳤다. 확정 오퍼가 있는2042 고정 fixture를 사용하며 같은 저장을 재추첨하지 않는다.

회귀 테스트는 수정 전 병역 완료/비대상을 UNRESOLVED로 읽어 실패했다. 병역 수정 뒤에도 유효 development를 가진 입력에서 연말 조회가 없는 program 접근으로 실패함을 별도 보존했다. 최종 집중15/15·타입/lint 뒤 실행 소스를 동결하고 전체 npm run check를1회 실행했다. 전체 npm run check 종료0: 엔진/API 775개 중773통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 663675.2997, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다.

## 제한과 다음

포스팅·해외FA의 마이너 계약 종료와6시즌 보유 적용 범위는 사용자에게 질문 중이다. 답변 전 보유기간/연봉/서비스 수치를 새로 확정하지 않는다. 미국 history reader·첫 MLB 콜업 급여는 아직 고교 직행 원점을 가정하는 곳이 있어 KBO 출신의 완전 연도 전환/계약 이행은 후속이다. 구 저장을 잘못 고친다고 병역/계약을 추정 복원하지 않는다. 대표 부상 교체/미국 공통 풀·전체 정규/PS 감사·99/24/PF-D도 잔여.

## E49~E54 기존 도메인 검수

병역 계획/상무 선발/첫 복무 블록/실제6월30일 복귀의 source→caller→command→test를 직접 읽고 사건 감사 JSON domainReview에 기록했다. 자동/전체 커리어/UI 완료 표시는 올리지 않았다. E51/E52 확인 자체가 복무 일수 진행을 대신하지 않으며 E49 START_SERVICE도 실제 입대가 아님을 명시했다. source/fixture/actual worker 범위를 분리했다. 전체 EG gate에서 해당 기존 테스트의 실행과 통과를 확인했다.
