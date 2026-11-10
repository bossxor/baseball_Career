# 대용량 JSONB 저장 경계 검증

2026-11-10 KST. 기준 커밋은 c4d9f50이며 실제 실행의 수정본은 각 source manifest로 식별한다.

## 확인한 저장 경계

경기 계산을 제외한 합성 JSON으로 INSERT → 전체 SELECT → 트랜잭션 내 UPDATE/영수증 INSERT → COMMIT을 비교했다. 실패하면 ROLLBACK 뒤 기존 generation과 영수증 개수를 조회한다.

| 데이터 | 환경 | 결과 |
|---|---|---|
| 약64MiB 문자열 | PGlite0.3.16 / PostgreSQL17.5 WASM32 | 저장·조회·갱신 통과, generation1·영수증1 |
| 약64MiB 다중 경기 형태 객체 | 같은 PGlite | UPDATE에서 SQLSTATE53200, MemoryContextAllocationFailure |
| 같은 다중 객체 | PostgreSQL17.5 Windows64 | 저장·조회·갱신 통과, generation1·영수증1 |

PGlite 실패 시 WASM heap은 2,147,483,648바이트였다. 설치된 `@electric-sql/pglite/dist/pglite.js`의 getHeapMax도 같은 값이다. ROLLBACK 후 generation0·영수증0으로 이전 값이 보존됐다. 이 실험의 오류 코드는 실제 포착한 값이다. 11월8일 미국 API 로그에는 메시지만 남아 있으므로 당시 SQLSTATE까지 확인한 것으로 해석하지 않는다.

이는 합성 DB 경계 실험이다. 실제 시즌의 엔진·급여·성장·경로 증거는 아래 별도 실행에서 다룬다. native PostgreSQL 서버는 별도 프로세스이므로 진단기의 Node RSS를 전체 서버 메모리와 비교하지 않는다.

## 추가한 측정 기능

- `scripts/probe-large-jsonb.mjs`가 위 비교와 원자성 확인을 재현한다. pglite/postgres, text/objects, MiB, 결과 파일을 받는다. `--self-check`는 인자와 작은 payload만 확인한다.
- `scripts/profile-career-api.mjs`는 기존 PGlite 기본값을 유지하고 `--postgres`를 추가했다. `PLAYBALL_PROFILE_DATABASE_URL`은 localhost와 playball_profile_ 테스트 DB 이름으로 제한한다. 보고서에는 backend와 databaseVersion을 기록하며 연결 문자열을 출력하지 않는다.
- 임시 로컬 PostgreSQL17.5를 사용했다. 바이너리와 시험 DB는 `.local-verification` 아래에 보관한다. 외부 앱 DB를 사용하지 않았다. 바이너리 출처는 [embedded-postgres](https://github.com/leinelissen/embedded-postgres)와 [17.5 패키지](https://www.npmjs.com/package/@embedded-postgres/windows-x64/v/17.5.0-beta.15)다.

실제 비교 명령은 다음과 같다. PostgreSQL 실행 전 해당 테스트 환경 변수를 설정한다.

```sh
node scripts/probe-large-jsonb.mjs --self-check
node scripts/probe-large-jsonb.mjs pglite objects 64 result.json
node scripts/probe-large-jsonb.mjs postgres objects 64 result.json
node --import tsx scripts/profile-career-api.mjs us result.json --postgres --memory --no-cpu
```

## 실행 증거

- `evidence/CODEX-20261110-pglite-objects-64.json`과 exitcode1은 의도한 한계 재현이다. rollback의 atomic=true도 확인한다.
- `evidence/CODEX-20261110-postgres-objects-64.json`, `CODEX-20261110-pglite-text-64.json`과 comparison-gates는 두 제어 실험 통과 근거다.
- 진단기 자체 검사·린트 종료0, 명령 진단/권한/재실행/동시 CAS 회귀4/4를 확인했다.
- 실제 미국 API 정규시즌은 `CODEX-20261110-postgres-us.{run.json,json,log,source.json,final-source.json,exitcode.txt}`로 수집한다. source가 실행 전후 일치해야 결과를 인용한다. 출발점은 통제 프리시즌이며 해당 시즌의 경기 worker는 실제 명령으로 실행한다.
- 대용량 귀국 HTTP 검사 중 앞의2건은 `CODEX-20261110-return-postgres.*`에 별도로 수집한다. 초기 미국6시즌 접두는 통제 자료이고 mandatory 준비 경기는 native fixture가 생성한다. 복무2년 증거와 구분한다.

## 실제 실행 최종 결과

미국 API 실행은 종료1이다. 실제 정규경기3,226개·29명령·1,289,927.8ms 후 HTTP500으로 중단했다. 마지막 시도 입력 JSON은219,543,841바이트였고, 오류는 `total size of jsonb object elements exceeds the maximum of 268435455 bytes`다. 이는 PGlite의 WASM 메모리 한도와 별개의 PostgreSQL JSONB 컨테이너 한도다. 출력 게임 수를 전체 리그 시즌 완주로 해석하지 않는다. 실행 전후 source manifest는 동일하며 출발 fixture도 변경되지 않았다.

귀국 HTTP는2건 중1건 통과·1건 실패·제외0, 종료1이다. 초기 미국6시즌은 통제 접두이고 독립 준비2시즌은 native 명령으로 생성했다. 미국 재계약 수락 HTTP가 같은 JSONB 한도로500을 반환했다. Flow 소유권·재실행 검사는 통과했다. 이는 군 복무2년 또는 재계약 후 미국 시즌 완주의 증거가 아니다.

## 분할 저장 임시 검증

`evidence/CODEX-20261110-storage-split-poc.json`은 저장 실패 직전 실제 상태에서 다음 명령을 수행해 얻은221,115,560바이트를 비교했다. 단일 JSONB INSERT는 SQLSTATE54000과268435455바이트 한도로 실패했다. 같은 JSON을 최대1MiB 문자 조각211개로 임시 테이블에 저장하고 다시 읽은 결과 canonical SHA-256이 동일했다. 롤백 검증과 원본 저장의 revision·DB 해시 불변도 통과했다. 임시 테이블만 사용했으며 제품 저장 형식을 변경하지 않았다.

이 임시 검증은 문자열 전체를 합치므로 장기 커리어의 V8 문자열 한도와 메모리 문제를 해결하지 않는다. 이후 사용자가 호환 저장 경계의 로컬 구현을 승인했다. 전체 JSON 문자열을 만들지 않는 구조 codec·공통 reader/writer·영수증 원자성과 API 연결은 [분할 저장 구현](M2-SPLIT-SAVE-20261110.md)에서 별도로 기록한다. 운영 DB에는 적용하지 않았다.

## 남은 확인

시즌 완주·포스트시즌·연간 성장 정산·전체24경로 완료는 미증명이다. 설계135의 성능 목표와 전후 전체 상태 동등성도 별도 검증한다. 전체 npm run check와 실기기 검사는 이번 묶음에서 실행하지 않았다. M2 관리 추정65%와 native4/24를 임의로 올리지 않는다.
