# M2 은퇴 재요청·복무 시즌 진행 보완 — 2026-11-05

## 구현
- KBO/US E36 확인 사건은 요청 revision을 포함한 ID로 만든다. 취소 후 같은 시즌 다시 요청해도 과거 RESOLVED 사건과 충돌하지 않는다.
- 기존 저장의 E36 plain receipt ID도 수락한다. E37/E69·영구 은퇴 receipt·보관 선수 ID는 유지한다. KBO native 잘못된 명령은 거절한다.
- 귀국 준비 wrapper는 실제 복무 worker의 SEASON_REVIEW만 SEASON_COMPLETE로 정규화한다. SERVICE_BLOCK_COMPLETE는 그대로 둔다. 연말 정산은 기존 별도 명령이며 자동 성장/급여/연도 변경은 없다.
- 테스트 반복 상한은 실제 일정에서 보수적으로 계산하고 기록 revision·phase·pending cursor의 진행을 확인한다. 제품의 worker 예산은 바꾸지 않는다.

## 검증
- retirement-repeat-final: API10 + US 은퇴5 + Major E66 6 =21/21, 실패/제외0,268682.4691ms.
- return-service-progress-focused:1/1,54056.749ms. 앞 날짜는 controlled 원장이며 실제 마지막 휴식일/다음 review worker만 실행했다. 실제2년 완주 증거가 아니다.
- followup-gates.exitcode: lint=0 types=0 web=0 build=0. 웹24/24,1964.0158ms. 전체 npm run check 재실행 결과가 아니다.
- 각 RED/최종 로그는 evidence/M2-20261105-retirement-repeat-* 및 M2-20261105-return-service-progress-*.
- 독립 read-only 리뷰: blocking 지적 없음. 신규 의존성·게임 규칙·금액·시드 변경 없음.

## 실제2년 회귀 중지 기록
5f6a1ca + 기존 사용자 WIP15줄로 시작한 선택 검사는 약22분 뒤 직접 중지했다. 한 시즌8790경기, 경기당 최소8이닝, worker당 최대20이닝으로 최소3516호출이 필요한데 당시 cap3000이었다. 종료1은 중지 결과이며 PASS/새 제품 실패가 아니다. source binding/stop-reason/run/freeze JSON에 남겼다. 후속 구현 때문에 freeze는 false이며 초기 source manifest와5f6a1ca binding으로 실행 대상을 구분한다.

기존 사용자 WIP 원본은 M2-20261105-existing-service-test-wip.patch에 보존돼 있다. 진행 검사/상한을 추가한 현재 버전은 M2-20261105-service-test-progress-wip.patch에 보존한다. 해당 테스트 source와 기존 대형 JSON/zz-dbg는 미커밋으로 유지한다. 다음 작업자는 이미 적용된 source에 patch를 중복 적용하지 않는다.

## 남음
실제2년 완주·전체 runtime 재검사, Major 국내 복귀 최신 KBO authority, 미국 E95/E96,99사건/24경로/PF 실행 증거와 실제 웹 binding. M2 관리 추정65% 유지. fixture를 실제 시즌으로 세지 않는다.
