# M2-J 사건 처리 기반

2026-10-20. 19의27개 phase와 사건 선택 처리 기반을 구현했다.

- 설계 원문에서99개 정의·164개 선택지·91개 명령을 생성한다. verify:events가 생성본 동기화를 검사한다. 전체 숨김 조건은 웹에 제공하지 않는다.
- 발생 근거 필드·논리 키, 세계/시즌/phase/경쟁/등록 resume context와 버전을 검증한다. 같은 근거는 완료 사건을 되살리지 않는다. FORM/PRESENTATION은 세계 작업으로 생성하지 않는다.
- ACK만 허용된 확인 사건을 완료한다. 필수 NAV는 이동만 한다. DOMAIN은 실행 계획을 반환하며 실제 도메인 성공 후 같은 저장 transaction에서 완료해야 한다. 서버용 완료 함수에 임의 client receipt를 전달해서는 안 된다.
- E63은 확정 APPROVED/DEFERRED 근거에 맞는 선택과 완료 정책을 사용한다. 마감은 일 마감과 도메인 deadline 반영 후 처리한다. 대기열은 마감/발생순서/키로 정렬하며 세계/시즌 혼합을 거절한다.

집중8/8·전체153/153, lint/typecheck/build/M1 골든/사건 원문 동기화/설계 정적10종 통과. evidence/M2-J-focused.log와M2-J-check.log에 증거를 보관한다.

미완료:99개 발생 predicate·도메인 handler, 실제 고교 진행, pending game FINAL transaction, resume 대상 유효성, DB receipt/동시성/공개API/UI. 메타데이터99개가 전체 사건 구현 완료라는 뜻은 아니다. 다음은 사용자 승인 부상 시 최소 임시 충원과 실제 고교 일정 처리다.
