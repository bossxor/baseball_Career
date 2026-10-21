# M2-AL — 고교 관계 형성 E94 알림과 읽음 상태

2026-10-21. 재개 기준은634c2dc(M2-AK)다. origin/main과 로컬 HEAD가 같고 작업 트리가 깨끗했다. V:/와 Git 체크아웃의 관련 텍스트396개를 비교해 차이0을 확인했다. 기존 다른 창의 구현을 덮지 않았다.

## 연결한 기능

- relation-notices.ts가 이미 확정된 고교 관계/형성 milestone을 E94 NOTICE로 투영한다. 고교 프리시즌 확정 시 생성하고, 기존 HS 진행 저장값은 다음 실제 일마감에서 누락 알림만 보충한다. 같은 형성 evidence는 알림1개이며 재처리/JSON 복원으로 읽음 상태를 되돌리거나 알림을 새로 만들지 않는다.
- relationNotices는 선택 저장 필드다. 기존 events의 필수 과제와 분리해 읽지 않은 E94가 E01/12·16·24경기 선택/E84나 경기 진행을 막지 않는다. NOTICE의 별도 outbox 저장은 구현 방식 D이며 새 관계 확률/보상/정지 규칙을 추가한 것이 아니다.
- unreadRelationNotices는 명시적 공개 필드만 반환한다. 이름/관계/대상/기록일/화면 S42를 제공하며 raw P/능력치/seed/RNG/resume/소스 snapshot을 노출하지 않는다. 조회는 상태·revision·난수 변경0이다.
- resolveCareerRelationNotice의 OPEN_RELATIONS는 해당 알림만 읽음 처리하고 S42와 relationKey를 반환한다. 현재 phase/필수 과제/실제 pending 경기 cursor와 RNG를 복구하거나 덮지 않는다. revision/event version·정상 관계/형성 evidence/현재 세계를 검증하며 낡은 입력·위조·중복을 거절한다.
- 연말 봉인의 sourceBasis는 전체 커리어 메타데이터를 포함한다. 읽음 명령이 봉인 후에도 다음 대학 등록을 막지 않도록 기존 봉인 유효성을 먼저 검사하고 같은 영수증의 새 revision/메타데이터 seal만 갱신한다. 게임/선수/성장/건강 근거는 불변이며 잘못된 봉인을 새로 서명하지 않는다.

## 사용자 결정

사용자는 고교25명 고정·라이벌 후보가 없으면 라이벌 없이 진행을 선택했다. 51/60의 기존 후보0 추가 생성 조항을 폐기하고14/51/60/121을 맞췄다. 전체225명, 후보0은 NO_CANDIDATE, 추가 NPC/재추첨/사용자에 맞춘 상대 상향은 없다. 동료 후보가 있으면 동료 관계/알림만 정상 생성한다. M2-AI의 당시 차이는 이 결정으로 해소됐다.

## 검증

- 수정 전 관계/이벤트14/14 통과.
- 최종 관련38/38(23.09초): 새 알림9개 검사와 기존 관계·이벤트·히든 알림·고교 시작/졸업 진로 회귀. 실제 하루 경기·pending 중 읽음 후 재개 결과, 고교 연말 봉인→읽음→대학 실제 등록, 구 저장값 보충/중복0·25명 고정·입력 불변을 확인했다.
- [집중](evidence/M2-AL-focused.log) · [기준](evidence/M2-AL-before.log) · [타입](evidence/M2-AL-types.log) · [lint](evidence/M2-AL-lint.log) · [build](evidence/M2-AL-build.log) · [골든](evidence/M2-AL-engine.log) · [이벤트](evidence/M2-AL-events.log) · [설계](evidence/M2-AL-design.log) · [HTTP](evidence/M2-AL-smoke.log).
- 타입 검사 첫 실행은 테스트의 optional 알림 배열을 확인 없이 대입해 exactOptionalPropertyTypes에서 실패했다. 값 존재를 assert한 뒤 대입하도록 테스트만 수정했다. 제품 타입 검사를 완화하지 않았고 [최종 봉인 경로](evidence/M2-AL-seal-final.log)도 따로 확인한다.
- 전체 npm run check나 고교216경기·대학4년 정규864경기를 이번 단계에서 재완주하지 않았다. 기존 M2-AI 전체305/305와 M2-AK 장기39/39는 해당 커밋의 이전 검증이다. 실제 브라우저/DB/계정/API/APK도 미검증이다.

## 다음과 호환

E95/E96은 실제 분리·재회·등록/경기 근거가 연결된 뒤 구현한다. 고교 후보0 추가 생성은 후속 대상이 아니다. 대학/프로 관계 재형성·NPC 진로 추적·T14 프로 cross-kind/결투 WIN·과거 관계 현재 세계 밖 조회 보강·실제 S42/API는 남아 있다.

새 필드가 없는 저장값은 빈 알림으로 읽는다. 관계가 없는 저장값에 가짜 관계/알림을 만들지 않는다. 대학 세계에서 옛 고교 형성을 현재 연도의 새 사건으로 재생성하지 않는다. 이미 있는 E94 이력은 보존한다. writer를 중단하더라도 기존 읽음/history reader를 유지해야 한다.
