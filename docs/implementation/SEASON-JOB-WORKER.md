# 시즌 작업 실행

빌드와 `packages/db/drizzle/0002_season_jobs.sql` 마이그레이션을 적용한 DB를 사용한다. 기존 `M3_CORE_SQL` 부트스트랩에도 같은 테이블이 포함된다. 세이브·명령 영수증과 작업 상태는 동일 DB에 저장한다.

API와 작업자를 별도 Node 프로세스로 실행한다. 두 프로세스에 같은 `DATABASE_URL`과 `PLAYBALL_SEASON_JOBS=1`을 설정한다. 기존 API 인증 환경도 유지한다.

```powershell
npm run build
$env:PLAYBALL_SEASON_JOBS = '1'
npm start
```

별도 터미널에서 같은 환경을 설정한 뒤 실행한다.

```powershell
$env:PLAYBALL_SEASON_JOBS = '1'
npm run worker:season
```

API는 인증된 `GET /api/saves/:id/season-job`과 `POST /api/saves/:id/season-job`을 제공한다. POST 본문은 `requestId`와 문자열 `expectedRevision`이다. 클라이언트는 응답을 잃었을 때 같은 요청 ID를 재사용한다. 테스트는 `createApp({seasonJobs:true})`로 명시 활성화할 수 있다.

웹의 ‘이번 시즌 끝까지’는 작업 API가 켜져 있으면 서버에 작업을 요청한다. 커리어 진행 화면에 다시 들어오면 새 작업을 만들기 전에 저장에 남은 작업을 확인한다. 실행 중에는 2초마다 서버의 완료 경기 수와 전체 경기 수를 읽고, 화면 이탈 시 조회만 중단한다. 작업이 끝나면 최신 진행 화면에서 결정 사건이나 시즌 결산을 보여준다. 작업 API가 비활성인 서버에서는 기존 화면 내 이어가기 방식을 사용한다.

작업자는 저장된 `RUNNING` 작업을 읽어 서버 명령을 실행한다. 빈 대기열은 1초 간격으로 조회하고 오류는 1초부터 최대 30초까지 지연 후 재시도한다. SIGINT/SIGTERM을 받으면 진행 중 트랜잭션을 마친 뒤 DB 풀을 닫는다. 재시작한 작업자는 저장된 revision과 단계 번호부터 이어간다. 동기 엔진은 작업자 프로세스에서 실행되므로 API 폴링 요청을 막지 않는다.

기본값은 비활성이다. 활성 API의 readiness는 `season_jobs` 테이블을 확인한다. 작업자 프로세스의 생존 여부는 운영 프로세스 관리자가 감시한다.
