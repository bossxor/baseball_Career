# 미국 복무·경기 API 구현 묶음 — 2026-11-03

## 기준과 방식

E:/AI/Game/baseball_career, codex/m2-career-engine, 시작 e44318b. fetch 후 원격과 ahead/behind 0/0 확인. 사용자 요청대로 구현을 먼저 묶고 검증·리뷰 수정·커밋 순서로 진행했다. 기존 DD 미추적 증거와 .superpowers는 보존하며 PC를 종료하지 않는다.

## 연결한 기능

- career-us-military-shell.ts: CAREER_US_MILITARY_ 접두 8명령 PLAN, START_YEAR, ADVANCE, COMPLETE, CONFIRM_RETURN, DECLINE_RETURN, ACCEPT_OFFER, DECLINE_OFFER.
- US_MILITARY_PLAN/US_MILITARY_SERVICE 조회: 실제 엔진의 동결/해지 선택, 복무 블록·현재 커서·단계·시즌·30게임일 옵션·새 계약 제안을 공개한다.
- START_YEAR는 실제 연도 전환과 복무 일정/정규시즌 시작을 함께 반환한다. 중간 단계 실패 시 원본 상태를 저장하지 않는다. ADVANCE는 1~7일 제한의 기존 native worker다. 블록 정산은 실제 닫힌 날짜의 기존 worker가 담당하므로 클라이언트가 완료 블록을 보내거나 별도 수동 완료를 주입하지 않는다.
- 리뷰에서 복귀 확인 후 일반 미국 플레이 API가 없어 후속 진행이 막히는 것을 발견했다. career-us-play-shell.ts에 CAREER_US_PLAY_ 접두 10명령 RESOLVE_CAMP, CONFIRM_PRESEASON, PUBLISH_SCHEDULE, START, ADVANCE, RESOLVE_HIDDEN, RESOLVE_WINDOW, RESOLVE_LEVEL, TRAIN, CHANGE_STYLE을 연결했다. E84 처리의 실제 navigation도 summary에 보존한다.
- US_CAREER 조회는 기존 공개 선수/계약 view와 현재 캠프 선택, 현재 사건의 식별자·선택지, 시즌 날짜/지급 진행만 반환한다. 동결 또는 미확정 옵션의 일반 플레이는 엔진 guard로 거부한다.
- engine-command.ts와 career-views.ts가 새 명령과 조회를 호출한다. 모든 명령은 저장된 owner와 내부 careerRevision을 사용하며 외부 저장 CAS/멱등 영수증 트랜잭션을 그대로 통과한다. world·예산·가짜 날짜·정산·자격 권한 입력은 허용하지 않는다. 새로운 의존성·금액 공식·복무 기간·보장 계약은 추가하지 않았다.

## 검사 결과

최초 묶음: API 복무/기존 입력 경계와 엔진의 만료 후 새 제안 회귀 **9/9, 실패·제외 0**, 65699.9336ms. lint·전체 테스트 타입·API build 종료 0.

리뷰 보완 후 해당 범위: 복무/일반 미국 플레이 **5/5, 실패·제외 0**, 15707.4231ms. 수정한 전체 파일 lint·전체 테스트 타입·API build도 종료 0이다. 최종 리뷰에서 E41/E43 및 승강급 중단 후 처리 입구도 필요함을 확인해 기존 resolver와 훈련/스타일 명령을 연결했다. 실제 제어20경기 E43 발생→조회→OPEN_TRAINING→원래 진행 복원→명시 SKIP 소비를 추가 검사했다. 최종 수정 범위 3/3 및 lint·전체 테스트 타입·API build 종료 0이다. 새 검사들을 고유 건수로 합산하지 않는다. 9와5에는 중복 테스트가 있으므로 고유14건으로 합산하지 않는다. 전체 장시간 check는 반복하지 않았다.

검사에서 확인한 경계:

- 기존 모집/계약 writer의 실제 동결옵션이 있는 제어 시즌 종료 접두에서 FREEZE/TERMINATE와 stale revision 거부.
- 복무 일정 실제 개시와 제한 native 경기 진행, 복무 중 지급0·즉시 전역 거부·JSON 조회.
- 제어 공식 경기 행으로 닫은 18개월 날짜에서 실제 블록/전역 writer, 30게임일 기한, 확인/거절의 원본 불변성.
- 실제 확인된 복귀 owner에서 일반 US API ADVANCE 실행. 예정된 유효 미국 시즌에서도 실제 START/ADVANCE와 JSON 공개 진행 조회.
- 기존 엔진 회귀의 만료 계약 새1년 제안, 명시 수락·거절, day29/day30, 미결 제안 상태의 native chunk/JSON. 이 기존 엔진 검사를 신규 ACCEPT_OFFER/DECLINE_OFFER의 대형 HTTP 저장 검사로 바꾸어 세지 않는다.

최초 읽기 리뷰는 복무 권한/원장 문제를 발견하지 않았고 위 일반 플레이 진입 누락을 지적했다. 이를 수정한 후 해당 범위만 검증했다. 명령 목록·조회는 실제 연결됐지만 기본 웹 화면은 여전히 별도 연결 범위다.

증거: evidence/M2-20261103-military-api-check.log/.exitcode.txt, military-api-static.log/.json, us-continuation-fix.log/.exitcode.txt, us-continuation-static.log/.json, us-window-fix.log/.json. 검사 세션은 모두 종료했다. 최종 Git 커밋은 git log -1로 확인한다.

## 다음 구현과 한계

다음은 실제 화면/클라이언트가 엔진 명령을 쓰도록 연결하고 일반 미국 시즌 종료·PS·재계약/다음 해 명령 입구를 이어야 한다. 이번 일반 플레이 연결을 미국 전체 커리어 주기 완료로 표시하지 않는다. 99사건/24경로/PF의 남은 직접 효과 증거도 유지한다.

실제 native 18개월 전체 경기·대용량 HTTP/실제 PostgreSQL·기기/브라우저 실행은 이번 검사의 범위가 아니다. 기존 장기 PGlite UPDATE 메모리 부족과 PostgreSQL 대형 저장 미검증은 미해결이다. M2 전체 완료 아님. 이전 세부 인계는 M2-RESUME-ENVELOPES-20261103.md와 M2-HANDOFF-20261103-VERIFIED.md를 따른다.

## 사용량 마감 인계

마지막 조회 주간 사용량96%/잔여4%, 5시간 잔여66%. 기존5% 마감 지침에 따라 새 구현을 중단하고 검증된 묶음·진행사항을 커밋·푸시한다. 사용량 초기화나 PC 종료는 하지 않는다. 검사 세션은 모두 종료했다. 최종 커밋/원격 일치는 git log -1 및 ls-remote로 확인한다. 다음 시작은 이 문서와 현재 HEAD를 읽고, 구현 묶음 후 검증 1회·수정 방식으로 이어간다.
