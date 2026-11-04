# 업적·별칭 저장 API — 2026-11-04

기존 career-support shell에서 CAREER_HONOR_ACHIEVEMENT(E90 OPEN_ACHIEVEMENTS)와 CAREER_HONOR_ALIAS(E42 ACK_EVENT)를 native owner에 연결했다. CAREER_HONORS 조회는 native 업적/보상/현재·연간 별칭만 공개하며 firstReceipt/sources/receiptKey/sourceRevision/completionReceipt를 제거한다. 학교 확정 봉인/필수선택/archived 등 별칭 처리 불가 상태는 선택지도 숨긴다. 업적 refresh/별칭 정산은 읽기/선택에서 새로 실행하지 않는다. 기념 보상 외 돈/성장 부여 없음.

기록 정정 함수는 SERVER ONLY로 공식 scoring owner 전용이다. 클라이언트가 기록 contribution이나 보상 원장을 주입하는 명령을 추가하지 않았다.

## 검증
- API4 + native 업적11/별칭5 =20/20, fail0·skip0, 26633.9889ms.
- 전체 테스트 타입·변경 lint·API build 종료0, 독립 읽기 전용 리뷰 지적 없음.
- 실제 US 가입의 A01/E90와 HTTP PGlite 저장 CAS/재전송/소유권·기념 보상 보존, KBO E42 메타데이터만 변경, 학교/KBO/US 순수 공개 조회, 입력 주입/잘못된 명령/버전 차단.
- E42는 통제100일 성장 원장으로 annual owner를 격리한 fixture다. 실제 KBO 연말 경로가 아니다. 이전 고교 별칭 이력을 보존해2개인데 최초 테스트가1개로 가정한 오류를 실제 이력 길이/최종 스냅샷 기준으로 고쳤다.
- native 대학 졸업 회귀는 controlled academic year helper와 실제 graduation owner이며 전체 대학 시즌 시뮬레이션이 아니다.

## 증거/잔여
evidence/M2-20261104-honors-final.log/.exitcode.txt 및 -types/-lint/-build.log, -static.exitcode.txt. red/green/focused 로그는 진단 이력이다. 일반 웹 버튼/전체99사건·24경로·PF·실제 대형 DB 미완료. 전체90394는 결과 미수집/PASS 아님. M2 관리 추정65% 유지.
