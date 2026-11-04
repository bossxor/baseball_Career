# 프로 은퇴·보관 저장 API — 2026-11-04

## 변경
- CAREER_PRO_RETIRE_REQUEST / RESOLVE / MAX_AGE를 KBO·US native owner에 연결했다. RESOLVE는 CONFIRM_RETIRE/CANCEL_RETIRE만 허용한다. 임의 문자열이 KBO 확인으로 처리되지 않도록 API에서 검증한다.
- CAREER_PRO_RETIREMENT은 현재 E36 task/version과 실제 계약 조건을 공개한다. CAREER_PRO_ARCHIVE는 native 공개 보관 projector만 사용한다.
- 기존 기록/세계/계약/급여/병역/신원을 보존한다. 나이·확률·급여 규칙 추가 없음. archived 기록 조회에 현역 출전/병역 제한을 새로 씌우지 않는다.
- 보관 선수 복사·구단 운영·계정 라이브러리 저장/가져오기는 이번 범위가 아니다. E37/E69를 읽었다고 ACK 완료시키는 새 owner도 만들지 않았다.

## 검증
- 새 API4 + native US 은퇴5/KBO archive4 =13/13, fail0·skip0, 61445.4981ms.
- 전체 테스트 타입·변경 파일 lint·API build 종료0. 독립 리뷰 추가 지적 없음.
- KBO 정규시즌은 통제 일마감 접두다. 이후 native PS 실제 경기·성장·연말 owner를 거쳤다. 미국은 controlled certified contribution/date fixture다. 실제 정규 full-season 경로 증거로 세지 않는다.
- API KBO/US 요청/취소/확정/45세 최대나이, 저장 JSON 재개·원장/기록 보존, 입력/과거 revision/eventversion/phase 검증. 실제 PGlite HTTP는 KBO 확인·archive reload·소유권·CAS·같은 command 재전송을 검증했다.
- 첫 실행12/13 실패는 테스트가 공개 확인 DTO의 definitionId/commands까지 엄격한 쓰기 payload에 복사한 오류다. eventKey/version만 명시해 수정했다. 제품의 입력 제한은 유지했다.

## 증거
- evidence/M2-20261104-retirement-final.log / .exitcode.txt
- evidence/M2-20261104-retirement-types.log, -lint.log, -build.log, -static.exitcode.txt
- red/focused 로그는 초기 진단 이력이다. 이전 전체90394 결과 미수집과 별개며 전체 check 통과를 주장하지 않는다.

## 감사·다음
99사건 감사 중12개(E12/E23/E29/E86/E88/E89/E91~96)에 scoped API/native 증거를 연결했다. 일부 직접 HTTP 미검사/미국 관계 adapter/자동 trigger·기본 웹 경계를 각 행에 남겼다. E36/E37/E69는 다음 감사에서 source와 API 증거를 대조할 수 있다. 미국 Major E66·귀국/관계 adapter, 24경로/PF·실제 웹 연결·대형 DB가 남는다. M2 관리 추정65% 유지.
