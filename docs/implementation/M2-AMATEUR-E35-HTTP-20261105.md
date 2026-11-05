# 아마추어 E35 공개 조회·HTTP 확정 — 2026-11-05

## 구현
기존 E35 open/confirm은 있었지만 AMATEUR_RETIREMENT 조회가 E36만 처리해 E35 열기 뒤 GET400이었다. native amateurRetryExhaustionView를 추가하고 retryExit owner에 따라 기존 화면 경로를 분기한다. E36 경로는 유지한다.

공유 owner는 E35 actor/world/season/완료 task·resume 등록/단계·발생일·revision 범위·원래 평가 basis와 실제 DOMAIN retirement receipt를 검증한다. ARCHIVED 조회는 원래 CAREER_ROUTE evidence의 읽기 복사본을 검사하며 저장 상태를 재활성화하지 않는다. 공개 필드는 상태·선수 식별/표시·event/version·소비한 준비 횟수·병역·receipt/가능 명령뿐이며 sourceBasis/seed/rng/잠재력은 공개하지 않는다. E35 두 명령의 추가 payload 필드를 거절한다. 새 규칙/급여/확률/seed 변경 없음.

## 실행 증거
- RED: E35 open HTTP200 뒤 AMATEUR_RETIREMENT GET400 재현.
- focused: E35 HTTP + 기존 E36 HTTP2/2,313743.261ms.
- 최종: 같은2/2,fail0·skip0,227708.0553ms. 발생일/미래 또는 preparation 이전 resume revision 변조 거절을 추가했다.
- 실제 PGlite HTTP: 소유권, OPEN/CONFIRM 재전송, stale save CAS, 잘못된 event version/추가 입력, ARCHIVED 재조회, 원장/횟수/records/health/national 불변.
- type/lint/build 종료0. 독립 읽기 전용 리뷰에서 확인된 회귀 없음; resume/day 경계도 보완했다.
- evidence/M2-20261105-amateur-e35-http-red/focused/final.log와 exitcode, build 로그·native-preflight/prefix-e35 gates 참고.

## 증거 한계
평가 이전 아마추어/체육요원과 optional 이전2회는 controlled prefix, 공유 최종48경기와 평가/은퇴 명령은 native다. 실제 optional3년·전체24경로·기본 웹 완료를 주장하지 않는다. 이 PGlite 검사는 아마추어 E35 owner의 HTTP 검사다. 별도 대형 PostgreSQL US return E35/Neon/Managed Auth 제외5건은 그대로 미검증이며 대신했다고 쓰지 않는다.

## 다음
실제 서비스2년 source-frozen background는 계속 별도 실행한다. native service 통과 전 원본 WIP를 커밋하지 않는다. 재계약 첫 시즌 전체 정산/최신 KBO authority/미국 E96/실제 웹·99/24/PF·전체 check는 잔여다.
