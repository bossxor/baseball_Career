# M2 재개 — 입력 경계·귀국 명령 증거·저장 크기

## 시작과 범위

작업 위치 E:/AI/Game/baseball_career, 브랜치 codex/m2-career-engine. 시작 HEAD 814aac8. 원격 fetch 후 개발 브랜치와 ahead/behind 0/0을 확인했다. 기존 DD 미추적 자료와 .superpowers는 보존한다. PC 종료 금지.

기존 인계의 대용량 실제 PostgreSQL 검증 환경은 여전히 없다. 저장 형식 변경을 추측으로 시작하지 않고, 공개 입력 오류 수정과 계획에 남아 있던 귀국 owner 명령 해시 증거를 진행했다. M2 전체 완료를 선언하지 않는다.

## 사용자 요청에 따른 구현 묶음 전환

사용자가 구현을 먼저 묶고 마지막에 한 번 검증·수정·커밋하도록 요청했다. 입력 경계 수정은 이미 77274df로 커밋·푸시된 상태였다. 이후에는 아래 의무 귀국 연결을 먼저 일괄 구현하고 회귀/정적 검사를 묶어 실행했다. 이미 시작한 기존 17구간 장기 재검증은 중단했다. 로그에는 모든 scenario endpoint 완료가 있지만 최종 JSON 증거·성공 종료가 없으므로 새 17구간 통과로 계산하지 않는다.

## 의무 귀국 API 연결

기존 엔진의 미국 계약 종료 이후 의무 귀국 앞단이 API에서 빠져 있었다. career-us-return-shell.ts에 CAREER_US_RETURN_ 접두의 REQUEST, START_YEAR, ADVANCE, SETTLE_YEAR, DRAFT_PREPARE, DRAFT_RESOLVE, DRAFT_DECIDE, KBO_ACTIVATE, US_ACCEPT 9명령을 연결했다. engine-command.ts와 career-views.ts에 호출 경로를 추가했다. US_RETURN_PROGRAM 조회는 엔진 공개 view를 사용한다.

클라이언트는 careerRevision, 사건/프로그램 버전, 선택한 구단/계약 식별자만 보낸다. 공급 world·예산·자격·정산 이력·진행 일수는 거부한다. ADVANCE는 기존 제한 worker를 호출하며 의무 기간은 선택 준비 예산을 소비하지 않는다. 실제 완료 owner는 기존 CAREER_RETRY_US_RETURN_OPEN으로 이어진다. 기본 웹 화면을 실제 게임 엔진 화면으로 바꾸는 작업은 이 묶음에 포함하지 않았다.

묶음 회귀 19/19, 실패·제외 0, 60666.1362ms. 원래 미국 6년은 제어 fixture이며 REQUEST 뒤 시작·제한 진행은 실제 worker다. 완료 owner 검사는 실제 의무 독립 48+48 접두를 읽는다. 이 신규 9명령 전체를 실제 HTTP/대형 DB 저장으로 실행한 증거는 아니다. lint·전체 테스트 타입·API build도 모두 종료 0이다.

읽기 리뷰에서 재접속 시 현재 시즌 진행/정산 가능 여부 및 선택할 미국 복귀 계약 식별자가 부족한 것을 발견했다. 공개 조회에 phase·시즌·완료 경기·커서, settleReady, 실제 보존된 복귀옵션만 골라 공개한 usOptions를 추가했다. 아직 시작하지 않은 상태, 진행 중 상태, 의무 2년 정산 완료 상태의 구분과 원래 계약 키 연결을 회귀에 보강했다. 수정 후 해당 회귀 3/3, lint·전체 테스트 타입·API build 모두 종료 0이다. 결과는 return-program-fix.json을 읽는다.

증거: evidence/M2-20261103-return-program-check.log/.exitcode.txt, return-program-static.log/.json, return-program-fix.log/.json. 사용자가 요청한 묶음 구현 후 검증·수정 방식으로 진행했다. 전체 장시간 check를 반복하지 않았다.

## 구현과 확인

- commands.ts와 game-creations.ts에서 null JSON을 속성 접근 전에 거부한다. 배열과 원시 값도 객체 요청으로 받지 않는다. 기존 INVALID_REQUEST/400 응답을 유지한다.
- 실제 HTTP 회귀에서 두 경로 모두 null 입력이 기존 500을 내는 것을 확인했다. 수정 후 null·boolean·number·string·array·빈 객체를 거부하고, 저장 내용·리비전·명령 영수증·생성 슬롯이 바뀌지 않음을 확인했다. 그 뒤 정상 명령/생성도 성공한다.
- request-envelopes, m3-pipeline, m3-m9-fixes, error-logging: 16/16 통과, 실패·제외 0. 새 회귀만 먼저 실행한 RED는 2/2 실패였다.
- 변경 파일 lint, 전체 테스트 타입, API build 종료 0. HTTP smoke는 제한 환경의 로컬 접속 EACCES로 처음 실패했고, 로컬 연결을 허용한 재실행에서 종료 0이었다. smoke는 HTML/자산/API 프록시까지만 확인한다.
- 독립 읽기 리뷰에서 조치할 문제는 없었다. 리뷰는 실제 실행 결과를 대신하지 않는다.

## 귀국 재계약 명령 체인

기존 closure runner에 nativeReturnedUs 시나리오를 연결했다. initialFixture가 일반 world root가 아닌 귀국 source root인 경우도 rulesVersion을 읽는다. 기존 source manifest, 명령 전후 불변성, 입력 해시, 출력/상태 해시, 같은 입력의 JSON 재실행 검사를 그대로 사용한다.

실제 의무 독립 48+48경기와 초기 미지명 결과 뒤 OPEN → 현재 미국 평가 → 계약 수락 3명령이 종료 0이었다. 원래 미국 6년과 초기 미지명을 만드는 합법 급여 포화는 제어 fixture다. 선택 준비·복무·미국 전체 시즌이나 P10 전체 경로를 이 증거에 포함하지 않는다. 선택 사용량 0, 현재 나이·연도, 실제 연봉 30,000달러 1회 예약, 원래 미국 경기 보존을 단언했다.

- sourceManifestHash: `37914a30ac9c273fe33a38662fdbb06c96a3cbb444e29bdaae107fbc5f12fed7`
- commandChainHash: `8a023cd8384abc400fc593444739f7645d0144c85016bdc319652041d2a6f824`
- finalStateHash: `4dfb90b16fe6bdd7af181a5f580d2694f70cb6596b7cb53141023803492d0ff4`

증거: evidence/M2-20261103-return-trace.json.gz, .log, .exitcode.txt. 추가 전 unknown scenario 실패도 return-trace-red.log에 남겼다. 큰 원문 fixture는 gzip 증거에 포함되며 콘솔에 출력하지 않는다.

실행:

```powershell
$env:PLAYBALL_NATIVE_RETURN_PREFIX='C:/Users/OJT/AppData/Local/Temp/baseball-m2-native-return-20261103.json'
node --import tsx scripts/verify-m2-closure.mjs docs/implementation/evidence/M2-return-next.json.gz --scenarios=nativeReturnedUs
```

제한 환경의 TEMP는 이전 호스트 TEMP와 다르다. 자동 캐시 재생성에 시간을 쓰지 않도록 위 실제 경로를 확인한다. fixture loader는 원본 canonical SHA와 owner 검증을 수행한다.

## 대용량 저장 계측

동일 native 캐시 SHA256 `319bda08f3d092198b221152434dc2ed92defc673e7f7eca6a2b6d0ad91117d8`를 DB 접속 없이 읽었다.

| 항목 | JSON 바이트 |
| --- | ---: |
| 원본 귀국 root | 174,464,008 |
| 원래 미국 source | 79,981,862 |
| 의무 준비 보관 배열 | 59,048,204 |
| 현재 preparation | 33,963,900 |
| 원본 root gzip | 7,147,860 |

현재 preparation은 마지막 completedPreparation과 직렬화 결과가 완전히 같다. 33,963,900바이트가 중복된다. 이 두 필드 내부의 records/health/days 중복도 SHA로 확인했다. 표의 부모·자식 항목과 상세 rows는 겹치므로 합산하지 않는다.

gzip 복원 뒤 원본 직렬화 바이트의 SHA 일치를 단언했다. 압축은 오프라인 크기 측정일 뿐 제품 저장 codec을 도입하거나 메모리 부족을 해결한 결과가 아니다. 중복 제거도 live/archive 동등성 검증과 기존 세이브 복원 경로에 영향을 주므로 임의로 필드를 삭제하지 않았다. 세이브 호환, 권한/CAS, 백업/복원, 손상 입력을 포함해 후속 저장 설계를 검증해야 한다.

재현 코드와 수치: evidence/M2-20261103-large-save-size.mjs.txt 및 .json. 기존 호스트 캐시를 명시해 코드를 node 표준 입력으로 실행한다. 원본 파일 수정이나 DB 쓰기는 없다.

## 다음 작업과 검사 범위

기존 17구간/118명령 재실행은 사용자 요청에 맞춰 중단했다. envelope-paths-status.json과 .log를 확인한다. 성공 종료·최종 JSON 산출물이 없어 새 통과 증거로 세지 않는다. 이전 전체 check 결과는 이전 source의 증거이며 이번 변경 뒤 전체 check를 다시 통과했다고 표시하지 않는다.

다음 우선순위는 격리 실제 PostgreSQL의 대용량 HTTP 3건, 귀국 KBO/E35 명령 체인, 남은 99사건/24경로/PF와 실제 화면 연결이다. 장기 PGlite UPDATE 메모리 부족과 실제 PostgreSQL 미검증은 유지된다. 이전 세부 인계는 M2-HANDOFF-20261103-VERIFIED.md다.

## 이 묶음의 종료 상태

입력 경계 수정 77274df는 원격 개발 브랜치에 푸시했다. 의무 귀국 API·경로 증거·계측·인계는 별도 후속 커밋으로 저장한다. 최종 커밋은 git log -1로 확인한다. 실행 중인 검사는 없다. 이번 후속 변경 뒤 전체 check/smoke를 반복하지 않았으며, 기존 smoke 통과는 77274df 시점이다. 마지막 제품 변경은 API 배선/조회이고 엔진/rules 제품 코드는 그대로다.

다음 작업은 구현 묶음을 먼저 끝내고 검증 1회·수정·커밋하는 사용자 지침을 따른다. 오래된 작업판 체크박스를 미구현으로 간주해 이미 끝난 owner를 다시 만들지 않는다. 실제 PostgreSQL 대형 저장 환경이 없으면 그 환경을 기다리며 동일 장기 회귀를 반복하지 않고, 남은 명시 입구와 실제 화면 연결을 먼저 구현한다. M2 전체 완료는 아직 아니다.
