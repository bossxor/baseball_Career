# 실제 서비스2년 접두 검증 구동 — 2026-11-05

## 범위
PLAYBALL_NATIVE_RETURN_PREFIX 기본 파일은 INDEPENDENT_UNDRAFTED, 같은 기본 경로 + .service.json은 SERVICE_COMPLETE다. + .service.json.checkpoint는 SERVICE_CHECKPOINT이며 통과 증거가 아니다. schema2 파일은 canonical SHA256, Node 버전, 실제 설정/규칙 source/실행 rules/engine dist·engine source·engine test fixture 해시와 도메인 owner를 확인한다. schema1 구 파일은 자동 승격/덮어쓰지 않는다.

서비스 생성은 기존 native start/advance/settle 명령만 호출한다. 100걸음마다 원자적 체크포인트를 저장한다. 같은 소스에서만 재개하며 변경된 소스면 중단한다. 헤더의 fingerprint는 파일 바이트 기반이라 docs/API-only 수정은 native 캐시를 무효화하지 않는다. 새 캐시의 완료가 기존 fixture를 새 native 실행으로 바꾸지는 않는다.

## 실행과 결과
scripts/run-m2-native-service.ps1은 단일 worker다. Codex의 run_in_background 도구가 없으므로 Start-Process -WindowStyle Hidden으로 이 스크립트를 실행한다. 반복 폴링하지 않고 독립 API/docs 작업을 진행한다. source.json, final-source.json, run.json, log, exitcode.txt를 남긴다. PASS는 실제 선택 테스트 종료0과 sourceUnchanged=true를 모두 충족할 때만이다.

실행 전 rules/engine을 빌드하고 작은 경계 검사/타입/린트를 통과시킨다. worker 시작 후 rules/engine source·dist·engine test 파일을 동결한다. 원래 service WIP 테스트는 실제 통과 전 커밋하지 않는다. 새 프로세스의 4GB heap 상한은 검사 자원이며 게임 worker 예산·확률·seed를 바꾸지 않는다.

## 강제 종료 뒤 잠금 복구
단일 writer .lock에는 pid/host/startedAt이 있다. 중단 시 잠금을 자동 삭제하거나 경쟁 writer가 자동 회수하지 않는다. 재개 전 다음 절차를 단일 작업자만 수행한다.
1. 해당 캐시를 쓰는 다른 worker/생성기가 시작되지 않도록 먼저 중단/배제한다.
2. .lock의 host가 현재 컴퓨터 hostname과 같은지 확인한다. 다르면 원 호스트에서 검사한다.
3. Get-Process -Id와 Get-CimInstance Win32_Process로 기록 PID의 종료를 확인한다. PID가 살아 있거나 재사용됐으면 회수하지 않는다.
4. 종료가 확인된 lock을 Move-Item -LiteralPath로 같은 폴더의 고유 .abandoned-시각 이름으로 보존한다. 삭제/Force 금지.
5. 같은 소스 fingerprint로 동일 CacheBase를 사용해 runner를 다시 시작한다. 체크포인트 owner/SHA/manifest 검증 뒤에만 이어진다. 중간 체크포인트는 실제2년 PASS가 아니다.

검사 환경 키가 없는 PostgreSQL3/Neon1/ManagedAuth1은 미검증으로 유지하며 PGlite로 대체하지 않는다. 이 문서는 전체 M2 완료나 전체 npm run check PASS를 뜻하지 않는다.

## 첫 생성의 안전한 가속
source와 service의 과거 기록 값이 모두 일치하는지 확인한 뒤, 검사 구동부만 과거 기록을 깊게 동결하고 참조를 공유한다. 기존 엔진 same/원장 검증은 그대로 실행한다. 변조된 과거 기록은 공유 전에 거절한다. 최초 native 명령을 원본/공유 입력에서 각각 실행해 결과 canonical SHA256의 일치를 확인한다. 비교용 원본 분기는 버리고 공유 입력의 결과만 커밋한다. 첫 비교의 실행 시간은 로그에 남기며 전체2년의 속도 개선률로 단정하지 않는다.

## 현재 실행 — 2026-11-05
실제 서비스2년 + 원 오퍼 재계약 선택 검사는 hidden background RUNNING으로 시작했다. PID 12812, sourceCommit b29c1196402d29761db355c11843e501207761b6, sourceSha256 9502bc35dfb67a94d09bf58822b914b84804620839390bbae05393268ea8bd7c. 코드와 WIP 바이트는 evidence/M2-20261105-service-prefix-run.source.json에 기록돼 있다.

캐시: C:\Users\N-052\AppData\Local\Temp\playball-native-return-9502bc35dfb67a94.json.service.json
체크포인트: C:\Users\N-052\AppData\Local\Temp\playball-native-return-9502bc35dfb67a94.json.service.json.checkpoint
실행/종료: evidence/M2-20261105-service-prefix-run.run.json / .log / .exitcode.txt. 종료 파일이 없거나 RUNNING이면 PASS가 아니다. 시작 당시 prefix/checkpoint 모두 없었다. 보고서가 종료0·tests1/pass1/fail0/skip0·sourceUnchanged=true를 모두 확인해야 실제 선택 검사를 통과로 쓴다.

사전 검증: cache/pinning/recovery8/8, service 정산/연속성3건(+당시cache5개 포함 실행8/8), type/lint0, build0. 서비스 경계는 controlled 날짜/기록이며 native2년 완주를 뜻하지 않는다. 최초 엔진 정정 원장 버전 변조와 재계약 때 정정 원장 유실을 RED로 재현하고 수정했다. 공식 정정은 독립된 시즌 경계로 집계하며, 실제 최신 ledger와 유효한 revision을 US 재계약에 전달한다.

강제 종료된 예전 약4시간/3100걸음 실행은 통과도 제품 실패도 아니다. 기존 로그/큰JSON/zz는 보존하며 이번 source의 증거와 혼합하지 않는다.

## 다른 환경의 미커밋 테스트 복구
현재 폴더에는 이미 캐시 연결 WIP가 있으므로 재적용하지 않는다. us-service-fixture.ts는 이미0d5bd4d에 추적돼 있다. 깨끗한 다른 환경은 먼저 기존15줄 patch를 apply --check 후 적용하고, 이어 service-cache-bridge-wip.patch를 apply --check 후 적용한다. 둘의 적용/텍스트 왕복을 별도 임시 폴더에서 검증했다. service-cache-current-wip.patch는 HEAD 대비 전체 대안이므로 기존 patch와 중복 적용하지 않는다. 플랫폼 줄바꿈도 source 바이트 해시에 포함되므로 재사용할 cache의 manifest와 반드시 비교한다. 실제2년 선택 검사 통과 전 원본 테스트 WIP를 커밋하지 않는다.
