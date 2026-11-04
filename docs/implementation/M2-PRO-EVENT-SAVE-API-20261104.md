# 프로 사건 저장 API — 2026-11-04

## 변경과 소유권

f96ad8c 이후 CAREER_PRO_EVENT_ADVICE/RESULT/AWARD/REPERTOIRE 네 명령과 PRO_EVENTS 조회를 연결했다. 입력은 careerRevision·eventKey·eventVersion·command와 해당 선택에 필요한 필드만 허용한다. native 조언/의료/수상/구종 처리기가 자격·버전·도메인 영수증을 소유하고, 기존 저장 파이프라인이 계정 소유권·CAS·같은 commandId 재실행을 소유한다. 사건 문자열이나 ACK만으로 도메인 완료라고 세지 않는다.

E12는 실제 포지션 TRAINING 계획을 시작한다. E23은 기록된 진단/회복이 있어야 CONFIRM_RETURN을 처리하고 건강·능력·급여를 바꾸지 않는다. E29 ACK는 이미 확정한 수상 영수증을 보존한다. E86은 기존 구종 학습/XP 예약, E88은 기존 접근 선택/사용 창을 실제로 소비한다. 새 성장·확률·돈·자동 사건 추첨은 추가하지 않았다.

공개 조회는 native view 중 선택/알림/계획 상태만 allowlist로 내보낸다. raw receipt, 비교선수 내부 점수, 잠재력·RNG·시드는 제외한다. 현재의 일반 웹 화면 버튼 연결이나99개 사건 전체 검증은 이 묶음에 포함되지 않는다.

## 연결에서 발견한 결함

- prototype 이름의 choice(__proto__/constructor/toString)가 객체 필드 조회로 TypeError를 만들던 신규 입력 경계: RED 재현 후 Map으로 수정.
- 계획 확정 후에도 구종/접근 알림이 실행할 수 없는 훈련 선택을 보여주던 기존 native view: resolver의 실제 available commands를 공통 helper로 읽기에도 사용.
- 독립 리뷰 P2: repertoire ACK가 ARCHIVED/EVENT_DECISION에서도 revision과 notice를 쓰던 기존 native 경로. RED 재현 후 같은 helper가 해당 상태·pendingGame에서 선택을 차단한다. 재리뷰에서 두 재현 케이스 해결/남은 지적 없음 확인.

## 실행 증거

- 최초 네 도메인은 UNSUPPORTED_COMMAND로 실패하는 RED를 확인.
- 초기 새 API6/6, 최종 새 API8 + 기존 native 조언/구종/수상19 =27/27, 실패0·제외0,37271.3729ms. 중간 수치와 합산하지 않는다.
- 의료 선택은 실제 HTTP/PGlite 저장에서 입력 주입·잘못된 사건 버전 거부, 소유권404, commandId 재실행 동일 응답, stale save409, 저장 후 JSON 재조회·건강/월드 보존을 확인했다.
- 전체 테스트 타입·변경6파일 lint·엔진/API build 종료0. 정적/빌드 증거는 pro-events-types/lint/build/api-build 및 static.exitcode.txt.
- 증거 파일: evidence/M2-20261104-pro-events-final.log/.exitcode.txt와 red/boundary-red/availability-red/phase-red.

## 경계 / 다음

원래 학교·프로 진입 및 조언용 기록/의료 저널/수상 시즌은 CONTROLLED 접두다. 실제 native 선택 처리와 HTTP 저장을 검증했으며 native 전체 경력·실제 Neon·대형 PostgreSQL·실기기 증거가 아니다. 과거 전체 check 세션90394는 재개 시 프로세스/종료 코드가 없고930통과 표식에서 끝나 ENDED_WITHOUT_RESULT로 기록했다. 새 전체 PASS 아님. 전체 검사를 반복 시작하지 않았다.

다음은 에이전트/목표의 기존 처리기를 같은 저장 경계에 연결하고, 공개 preview에 들어갈 내부 견적/평가 자료 노출을 방지하는 것이다. 이후99사건/24경로/PF 감사와 실제 화면 연결이 남는다. 관리용 M2 추정65% 유지. 기존 사용자 WIP21줄·큰 runtime JSON/zz-dbg.log 보존, V: 문서/증거 Copy-Item만, PC 종료 금지.
