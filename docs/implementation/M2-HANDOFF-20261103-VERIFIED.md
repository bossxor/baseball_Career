# M2 최종 검증 인계 — 2026-11-03

## Git과 작업 위치

E:/AI/Game/baseball_career, codex/m2-career-engine. 시작 b6165a2에서 origin의 d76f99d까지 fast-forward했다. 제품/집중 증거 커밋 e6df2eee7fd6b4a5cc7c6c2ab797819ff2a4b85a를 푸시하고 원격 일치를 확인했다. 이 최종 인계 커밋은 git log -1로 확인한다. .superpowers 및 M2-DD 미추적 자료는 기존 자료이므로 보존·커밋 제외했다. PC 종료·사용량 초기화·외부 DB 접속은 없다.

마감 전 사용량:5시간86%사용/14%잔여, 주간91%사용/9%잔여. 기존5% 마감과 정리·푸시 여유를 확보하여 새 구현을 추가하지 않았다.

## 이번에 확정한 것

- 원격에서 이미 구현한 E33/E36/E71/E73/E74/E85와 귀국 선택 준비 owner를 중복 구현하지 않았다.
- 실제 의무 귀국2시즌 접두를 재생성했다. 미국 원래6시즌과 초기 미지명 시장은 명시한 제어 fixture, 의무48+48 및 선택48+48+48은 실제 worker다.
- 실제 선택3시즌 뒤 국내 평가/필요한 명시 거절·미국 실제 평가/명시 거절·E35·JSON ARCHIVED를 집중1/1로 완료했고 최종 전체에서도 통과했다. 선택 사용량은 완료 시점에만3회, 의무 사용량0, 최종 recordRevision54228이다. 원본을 덜 검증하거나 사용량을 직접 주입하지 않았다.
- 같은 native 준비/평가 시나리오를 엔진 및 별도 HTTP 통합 검사가 재사용하도록 테스트 helper만 추출했다. 엔진/rules 제품 코드는 d76f99d와 같다.
- 실제 저장 오류에서 약235MB SQL 파라미터 로그가 만들어지는 문제를 재현했다. API는 제한된 cause 깊이와500자 메시지, query wrapper/params 제거를 사용하고 클라이언트는 기존 requestId/INTERNAL_ERROR만 받는다. RED2→GREEN2, 추가 실제 줄바꿈 포함3회귀 통과. 리뷰의 줄바꿈 regex 우려는 변경 없이 재현 테스트가 통과해 적용하지 않았다. 해당 입력은 회귀로 남겼다.

## 최종 검사

`npm run check` 종료0: 엔진/API1058중1053통과·실패0·제외5, runtime1915578.1941ms. 웹24/24, lint·전체 타입·build·엔진 골든·이벤트·설계10종·Android셸·자산 통과. HTTP smoke 종료0. 동결506파일 변경·추가0. 실제 브라우저/기기 실행은 이 검사 범위가 아니다.

제외5건은 기존 실제 Neon/Auth 환경2개와 신규 대용량 PostgreSQL HTTP3개다. 새3개를 통과로 세지 않는다. 전체 check 성공은 M2 전체 요구 완료나 실제 대용량 저장 성공을 뜻하지 않는다.

최신 source에 대해 경로17구간·118명령 해시/JSON 재실행도 종료0이다. sourceManifestHash `4c6dd5fef7bb7991898fac712ca78387afa625c04c994666c3279cbad747298c`. 제어 접두·부분 구간은 그대로 표시했다. 전체24경로/새 returned E35의 완전한 명령 체인 해시 보고서는 아니다.

## 실제 저장의 남은 경계

기본 PGlite에 native 약174MB 귀국 원본을 삽입한 뒤 HTTP OPEN으로 새 root를 UPDATE하면500, 실제 cause `out of memory`였다. disk filesystem에서도 재현했다. 임베디드 DB 자원 부족을 엔진 owner 오류로 단정하지 않고, 실제 PostgreSQL 성공도 추정하지 않는다. 저장 크기/반복 이력 구조와 실제 PostgreSQL의 메모리 요구를 후속 검증해야 한다. 공통 DB test helper 변경은 되돌려 기존 검사 조건을 유지했다.

`apps/api/test/m2-us-return-retry-http.test.ts`는 명시적인 격리 `PLAYBALL_LARGE_SAVE_DATABASE_URL`에서 실행하는3검사다. 기존 DATABASE_URL을 자동 사용하지 않는다. HTTP OPEN/US 계약 재시도와 외부/내부 CAS·다른 사용자 차단, 실제 최신 선택 선수의 KBO 계약 전환, 실제3시즌 E35 확인 저장을 검사한다. 고유 사용자·저장만 정리한다. 현재 이 환경변수는 없고 docker/psql/postgres/pg_ctl 실행 파일도 확인되지 않아 실행하지 않았다.

실행 예: `npx tsx --test --test-concurrency=1 apps/api/test/m2-us-return-retry-http.test.ts`. `PLAYBALL_NATIVE_RETURN_PREFIX`에 이번 native 접두 캐시를 지정하면 같은 원장을 읽으며 데이터 SHA256과 owner 검증을 수행한다. 미지정이면 의무2시즌을 직접 생성한다. 캐시 경로는 `%TEMP%/baseball-m2-native-return-20261103.json`; 저장소 밖 파일이다. 캐시 생성기의 고정 sourceCommit5363de3은 옛 라벨이며 이번 실행 기준 d76f99d와 실제 파일/원본 SHA는 source-freeze 증거에 기록했다.

대형 실패 로그는 `retry-http-focused.log.gz`로 동일 내용을 보존했다. 원문도 임시 디렉터리에 보존했다. 제한된 원인/단언 로그는 retry-http-open-red.log와 open-disk.log에 있다. 전체 원문을 다시 콘솔에 출력하지 않는다.

## 다음 우선순위

1. 격리 실제 PostgreSQL을 제공해 대용량 HTTP3건을 실행한다. 필요하면 원본 보존·세이브 호환·권한/CAS·기존 backup/restore를 포함해 반복 이력의 저장 방식을 설계/수정한다. 자원 부족을 테스트 성공이나 가짜 작은 원장으로 우회하지 않는다.
2. 새 returned owner의 KBO/US/E35 경로를 기존 closure runner의 실제 입력/출력/상태 해시·JSON 재실행 보고서에 연결한다. 현재17부분구간과 native E35 테스트만으로24경로 완료를 선언하지 않는다.
3. 99사건 직접 발생/효과·PF의 남은 검수, 실제 웹 버튼/화면, 늦은 나이 및 복무·국제 중단 조합을 기존 감사/계획과 대조한다. 이미 구현한 owner를 다시 만들지 않는다.
4. 기존 KBO OFFSEASON_STAGING_ONLY와 미국 비활동 고정 workload 근사는 여전히 한계다. 실제 배경 경기/구종 XP를 실행한 증거로 바꾸지 않는다. M3/M4/M5/M6/M7/M8의 환경·화면·기기 증거를 M2 엔진 완료로 대체하지 않는다.

주요 자료: M2-RESUME-VALIDATION-20261103.md, M2-US-RETURN-RETRY-20261103.md, ../superpowers/plans/2026-11-02-us-return-retry.md. 주요 증거: evidence/M2-20261103-resume-final-check.log 및 .exitcode.txt, resume-final-smoke.log, resume-final-freeze-check.json, resume-validation-result.json, resume-exhaustion-native.log, resume-paths.json.gz. 현재 실행 중인 검사는 없다. 다음 시작은 Git/원격 비교와 이 인계부터 한다.
