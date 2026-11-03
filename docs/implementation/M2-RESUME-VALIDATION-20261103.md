# M2 최신화·실행 검증 — 2026-11-03

## 기준

`b6165a2`에서 원격 `d76f99d`까지 fast-forward했다. 사건 선택/E33/E36/E85와 대학 저장 API, 귀국 선택 준비 및 현재 미국 제안 owner가 이미 구현돼 있으므로 이전 미구현 목록을 다시 구현하지 않는다. 작업 위치는 E:/AI/Game/baseball_career, 브랜치는 codex/m2-career-engine. 기존 .superpowers 및 M2-DD 미추적 증거는 보존·커밋 제외한다.

이전 인계의 E35 검사 세션17083과 최종 결과 파일은 이 작업 위치에서 확인되지 않았고 해당 테스트 프로세스도 없었다. 기존 검사 완료로 추정하지 않는다. 실제 의무 귀국2시즌 접두를 현재 소스로 재생성했다. 원래 미국6시즌과 최초 미지명 시장은 기존에 표시된 제어 fixture이며, 의무48+48경기와 이후 선택 준비 경기는 native worker를 사용한다. 임시 캐시는 `%TEMP%/baseball-m2-native-return-20261103.json`; 읽을 때 데이터 SHA256과 실제 원장 검증을 수행한다. cache의 sourceCommit 고정 라벨은 이전 생성기 이력이며 이번 생성 실행 기준은 d76f99d다.

## 구현과 조사

### 제한된 오류 로깅

실제 저장 오류에서 Drizzle 외부 오류 메시지가 전체 세이브의 SQL 파라미터를 로그에 복사해 약235MB 로그를 만들었다. `app.onError`는 제한된 깊이의 원인 chain을 따라 실제 원인을 기록하며 메시지는500자로 제한한다. 원인이 없는 query wrapper/params는 원문을 기록하지 않는다. 클라이언트는 기존 INTERNAL_ERROR와 requestId만 받는다.

실제 RED2→GREEN2 및 추가 실제 줄바꿈 회귀 포함3/3 통과. 순환 cause도 종료되고 requestId를 보존한다. 리뷰의 regex 이스케이프 우려는 실제 줄바꿈 테스트가 변경 없이 통과해 재현되지 않았다. 그 테스트를 추가했고 잘못된 수정은 하지 않았다.

### 실제 HTTP·장기 JSONB 저장 경계

새 테스트는 저장 API의 OPEN/US 계약, 실제 선택 선수의 KBO 계약 전환, 실제3시즌 E35 확인을 저장 영수증·재시도·외부/내부 revision·다른 사용자 차단과 함께 검사하도록 작성했다. 이전 순수 dispatch/JSON 검사를 HTTP 실행으로 승격하지 않는다. 같은 native 경기/정산 시나리오를 엔진과 API가 재사용하도록 테스트 helper만 추출했으며 프로덕션 엔진 계산은 바꾸지 않았다.

현재 기본 PGlite에서 약174MB 귀국 원본을 삽입한 뒤 새 root로 UPDATE하는 HTTP OPEN이500으로 실패했다. 제한된 실제 원인은 `out of memory`였다. 같은 입력의 disk filesystem에서도 재현돼 임시 파일 저장 방식만으로 해결되지 않았다. DB test helper는 기존 상태로 되돌렸다. 이 결과를 계약/급여/권한 owner 결함이나 실제 PostgreSQL 통과로 해석하지 않는다.

`m2-us-return-retry-http.test.ts`는 `PLAYBALL_LARGE_SAVE_DATABASE_URL`로 명시적으로 제공하는 격리 PostgreSQL에 연결하는 opt-in 통합 검사다. 명령은 `npx tsx --test --test-concurrency=1 apps/api/test/m2-us-return-retry-http.test.ts`. 해당 환경변수와 native prefix가 없으면 native 접두는 직접 생성한다. URL 미설정 시3건을 명시적으로 제외하며 PASS로 세지 않는다. 기존 DATABASE_URL을 자동 사용하지 않는다. 각 테스트는 고유 사용자/저장만 생성·정리하고 권한·영수증·실제 기록을 확인한다. 실제 PostgreSQL 실행/다중 기기 검증과 장기 이력의 저장 크기/메모리 개선은 미완료다.

원래235MB 실패 로그는 gzip으로 동일 내용을 보존했다(`M2-20261103-retry-http-focused.log.gz`). 원문도 임시 디렉터리에 보존했다. 원인 메시지와 실패 단언은 open-red/open-disk 로그에 별도 보존했다.

## 실행 중·남은 범위

- 실제 의무 귀국2시즌 접두 생성 종료0: resume-native-prefix.log.
- 실제 선택3시즌·새 국내 평가·미국 제안 처리·명시 E35/JSON 보관: 1/1 통과, 종료0,973177.5424ms. 각48경기, 누적예산3·의무2시즌 소모0. 최종 recordRevision54228. resume-exhaustion-native.log 및 .exitcode.txt를 본다.
- 오류 로깅3개 회귀 통과. 신규 PostgreSQL HTTP3개는 환경 미설정으로 제외.
- 공유 helper 추출과 신규 타입/lint 통과. 신선한 엔진/오류/HTTP 검사 리뷰 후 source506파일을 동결했다. 전체 npm run check는 resume-final-check.log에서 실행 중이다. 이전 통과 수를 이번 전체 통과로 합산하지 않는다.
- API 인접 회귀15중12통과·실패0·별도 PostgreSQL3제외,68842.991ms(resume-api-regressions.log). 기존 대학 선택/은퇴/특성 HTTP와 귀국 root pure dispatch를 포함한다. 신규 대용량3건을 실제 HTTP 통과로 세지 않는다.

전체99사건/24경로/PF, 실제 웹 연결, KBO 배경 OFFSEASON_STAGING_ONLY와 미국 비활동 workload 근사 등 기존 한계는 유지한다. 현재 엔진 owner를 가짜 학교/계약/원장으로 바꾸거나, 테스트 자원 부족을 가짜 성공/계약 보장으로 우회하지 않는다.

## 최신 경로 해시

최종 소스에서 기존17구간·118명령을 재실행해 종료0을 확인했다. `evidence/M2-20261103-resume-paths.json.gz`의 sourceManifestHash는 `4c6dd5fef7bb7991898fac712ca78387afa625c04c994666c3279cbad747298c`다. 학교 진로/대학 복학/구종/포스팅/협상/대표 경기/KBO 첫 경기/P13 부상 회복 구간을 포함한다. 제어 접두와 구간별 미증명 부분은 보고서에 유지했다. 전체24경로 완료 또는 새 귀국 E35 전체 명령 해시를 뜻하지 않는다. 새 E35는 별도의 native 테스트 실행 증거다.
