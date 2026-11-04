# 미국 관계 history·E94 저장 연결 — 2026-11-04

## 변경
- native us-relations adapter가 실제 현재 조직/레벨 명단과 저장된 고교·대학 world, minorYears/majorYears/military.service.supply의 은퇴 선수 신원을 기존 relationship-history projector에 제공한다. 실제 자료가 없는 옛 KBO 신원은 UNKNOWN_REFERENCE/UNAVAILABLE로 유지한다.
- 미국 E94는 기존 formation evidence 검증/prepareRelationNoticeRead를 사용한다. revision과 해당 notice만 변경하고 현재 phase/로스터/기록/계약/수입을 보존한다.
- 기존 관계 API 목록/상세/해결이 미국 owner를 선택한다. KBO/학교 기능과 입력 검증 유지. 저장 schema/세계/가상선수/등록 추가 없음.
- E95/E96의 옛 KBO 재회 owner와 자동 미국 재회 writer는 여전히 범위 밖이다. E94 projection만 처리하며 다른 사건을 형성 알림처럼 위조하지 않는다.

## 검증
- API 미국5+기존 학교/KBO4+native history6=15/15, fail0·skip0, 30849.7607ms.
- 리뷰의 scope 통계 검증 보완으로 mixed league/phase/year contribution 한 건 추가: 집중1/1, 4774.3157ms. 두 로그는 중복 없는16개 검사를 입증하며 한 번의16개 실행이라고 쓰지 않는다.
- 실제 native 미국 첫 등록/E94, 실제 PGlite HTTP 소유권/CAS/재전송, JSON 재개와 기록/급여/phase 보존.
- 고교 이력 테스트는 실제 저장 school 선수를 native formation owner에 넣은 controlled 과거 형성이다. 기본 US fixture에는 고교 관계가 없는데 있다고 가정한 최초 테스트를 고쳤다.
- 은퇴 테스트는 controlled finished-US 접두의 동료 나이45를 설정하고 실제 next-year supply owner로 제거/보존했다. 전체 정규시즌이 아니다. majorYears·military supply 가지는 정적 리뷰만 했고 별도 실행하지 않았다.
- 전체 테스트 타입·변경 lint·engine/API build 종료0. 독립 리뷰 blocking 지적 없음; scope 통계 보완 실행 통과.

## 증거/잔여
evidence/M2-20261104-us-relations-final.log/.exitcode.txt, -scope.log/.exitcode.txt, -types/-lint/-engine-build/-api-build.log, -static.exitcode.txt. 최초 -focused는 진단 이력이다. 전체90394 미수집/PASS 아님. Major E66/귀국, 미국 E95/E96/부족한 과거 신원,99/24/PF·실제 웹·대형DB 잔여. M2 관리 추정65% 유지.
