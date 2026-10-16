# 06. 데이터·서버·운영 계약

## 아키텍처 결정

TypeScript 단일 저장소, React/Vite 공통 웹UI, Capacitor Android, Hono Node API, pg pool + Drizzle, Neon PostgreSQL, private 객체 버킷. 이 선택은 설계 기본안이며 실제 의존성 설치/앱 생성은 하지 않는다. API 호스트를 결정한 뒤 런타임/드라이버를 최종 점검한다. Node 장기실행 런타임이면 pool 재사용, edge로 바뀌면 Neon 공식 가이드로 재선정한다.

게임 엔진은 순수함수 applyCommand(state,command,rng,rules) → nextState/events/result. 입력시간·실행기기·Math.random·네트워크가 엔진 결과에 개입하지 않는다. ID는 커밋된 명령과 seed에서 결정론적으로 파생하거나 서버 생성 ID를 명령입력에 고정한다. 정렬 tie-break는 안정 ID, 시간대는 게임 날짜/UTC 저장/Asia-Seoul UI로 구분한다.

UI → API 인증/검증 → 세이브 행 잠금 → 중복검사/버전검사 → 엔진 → 제약검사 → 트랜잭션 커밋 → 응답. 엔진 계산이 길어지면 청크를 줄인다. 외부 API/스토리지 호출을 행 잠금 트랜잭션 안에 넣지 않는다.

## JSON 상태 계약

SaveState: schemaVersion, rulesVersion, engineVersion, mode, gameDate, seedState, phase, league, playersById, teamsById, schedule, records, timeline, pendingEvent, modifiers, settings.

CareerState 추가: protagonistId, highSchool, proRegistrationHistory, focusPlan, phaseProgress, retryCount, retirementReason, archiveId.
ClubState 추가: managedTeamId, lineup, pitchingPlan, budgetsBySeason, reservations, offers, draftState, importOrigins.

Player: id, name, birthYear, ageAtSeasonStart, kind, throws, bats, position, role, abilities, growthFractions, potential, aptitude, fatigue, morale, injury, contractId, teamId, level, retired, originArchiveId?. 숫자는 유한값·범위 검증. 영구 능력치와 임시 modifier 분리. 타자 능력치를 투수 키로 해석하지 않는다.

ScheduleGame: id, season, dayIndex, homeTeamId, awayTeamId, status, rngSeed, resultId?. GameResult: scoreByInning, battingLines, pitchingLines, decisions, playSummary, outsRecorded. 같은 gameId를 다시 완료할 수 없다. 리그가 날짜를 진행하면 그 날 모든 경기를 완료하고 다음 날짜로 넘어간다.

## 관계형 엔티티

모든 주키 UUID, 시각 timestamptz. FK/삭제 정책은 명시적으로 관리한다.

| 테이블 | 열/검증/인덱스 |
| --- | --- |
| profiles | id=인증subject, display_name, created_at. 비밀번호 없음 |
| game_saves | id, owner_id FK, mode enum, revision bigint≥0, versions, phase, summary JSONB, state JSONB, created/updated_at, deleted_at. index(owner_id,updated_at desc) |
| command_receipts | save_id FK, command_id, request_hash, result JSONB, resulting_revision, created_at. PK(save_id,command_id) |
| archived_players | id, owner_id, source_save_id UNIQUE(출처값), snapshot JSONB, version, checksum, created_at, hidden_at. 원본 수정 API 없음 |
| imported_players | club_save_id FK, archive_id, instance_player_id, source_version, imported_at_age=19. PK(club_save_id,archive_id) |
| save_backups | id, owner_id, save_id, revision, object_key UNIQUE, sha256, size, status, created_at. 준비완료에만 다운로드 허용 |
| operation_jobs | id, owner_id, save_id, type, status, source_revision, attempts, next_attempt_at, error_code. 백업 재시도용 |

원본 snapshot은 DB UPDATE 권한을 서비스 내부 저장 계층에서 제한하고 공개 수정 route를 만들지 않는다. 세이브 soft delete는30일 후 정리 기본안. 보관 선수는 출처 세이브 정리와 별개 유지. 프로필 삭제 시 별도 명시적 계정삭제 흐름을 정의하고 v1 설정에 미완성 버튼을 노출하지 않는다.

## 명령과 응답

POST /api/saves/{id}/commands
요청: commandId, expectedRevision, type, payload. header의 사용자 ID는 신뢰하지 않고 세션 subject 사용.
응답: commandId, revision, summary, stateChanges 또는 state, emittedEvents, nextActions.

허용 type: SET_FOCUS, ADVANCE_CHUNK, RESOLVE_EVENT, ACCEPT_DRAFT, ACCEPT_CONTRACT, RETIRE, SET_LINEUP, SET_PITCHING_PLAN, MOVE_ROSTER, SUBMIT_OFFER, WITHDRAW_OFFER, RELEASE_PLAYER, DRAFT_PLAYER, AUTO_DRAFT, COMPLETE_OFFSEASON.

생성 POST /api/saves는 별도 creationRequestId로 중복방지. body mode와 설정 및 archiveIds, expectedArchiveVersions를 받는다. 생성 중 보관선수 소유권과 스냅샷을 다시 확인한다. 목록 API는 state 대신 summary만 반환하며 cursor 페이지당20, archive50. 상세 state 초기 한도5MiB, 명령 body64KiB, 백업 압축 해제 후10MiB 상한 기본안. 크기를 초과하면 조용히 잘라내지 않고 명시적 오류로 처리한다.

| HTTP/코드 | 의미 |
| --- | --- |
| 400 INVALID_REQUEST | 문법 오류 |
| 401 AUTH_REQUIRED | 세션 없음/만료 |
| 404 SAVE_NOT_FOUND | 없음 또는 타사용자 소유. 존재 노출 방지 |
| 409 REVISION_CONFLICT | 최신 상태와 충돌 |
| 409 COMMAND_ID_REUSED | 같은 ID에 다른 내용 |
| 409 INVALID_PHASE | 현 단계에서 허용 안 됨 |
| 422 ROSTER_INVALID / BUDGET_EXCEEDED | 규칙 위반, 필드/슬롯 정보 제공 |
| 422 SAVE_VERSION_UNSUPPORTED | 읽거나 변환할 수 없는 버전 |
| 429 RATE_LIMITED | Retry-After 반환 |
| 503 SERVICE_UNAVAILABLE | 재시도 가능한 장애 |

중복검사는 revision 검사보다 먼저 한다. 같은 요청 재시도는 현재 revision이 바뀌었어도 원래 결과를 반환한다. receipt는 세이브 수명 동안 유지하고 결과 전체 대신 필요한 command 결과+revision만 저장해 크기를 제한한다. 대형 state를 매 receipt에 중복 저장하지 않는다.

## 인증 설계 경계

초대 사용자 소수만 허용, 계정별 세이브 완전 분리. 서비스 provider는 결정 기록에서 미결정. 후보는 웹/APK 지원 관리형 인증이며 선택 전에 refresh/logout/deep-link 복귀/동일계정 재로그인 검증이 필요하다. 이 부분은 구현 착수 전 해결할 blocker다. 앱 공통 고정 API키를 APK에 넣어 인증을 대체하지 않는다.

웹 쿠키는 HttpOnly/Secure/SameSite와 CSRF 검증. Android는 시스템 브라우저 로그인+검증된 리디렉션, PKCE 지원 여부 확인 후 결정하며 토큰은 OS 보안 저장소. 로그에는 requestId/commandId/코드/지연만, 토큰·DB URL·선수 전체 state·다운로드 서명 URL 출력 금지.

## 백업·복원·오프라인

시즌 종료시 자동 백업 job 1개, 수동 백업 가능. private game-backups, key users/{owner}/saves/{save}/{backup}.json.gz. SDK는 Neon skill의 Files SDK adapter 우선 검토. AWS_* 변수는 서버에서만. 버킷 지역 지원 여부 확인 전 배포하지 않는다.

백업은 sourceRevision과 state 복사본을 먼저 확정해 진행 도중 revision이 바뀌어도 일관성을 유지한다. job pending→upload→체크섬 확인→ready. 실패 최대3회(1분/5분/30분), 이후 수동 재시도. 같은 job key로 멱등 업로드, ready 전에는 다운로드 불가. 정리 job은 DB 참조 없는 객체만 대상으로 하며 운영 정책 확정 후 적용.

다운로드: 소유권 확인 후 만료5분 URL. 복원: 압축폭탄 제한→JSON 스키마→지원 버전→체크섬→일관성 제약→새 saveId 생성. 원래 command receipt를 새 세이브에 복사하지 않는다. 복원 revision=0, imported origins/선수 ID는 새 세이브 namespace에서 충돌 없게 remap. 같은 원본 재사용은 세이브별 제약이므로 허용.

오프라인은 읽기만. 대기중 명령을 여러 기기에서 자동 큐잉하지 않는다. 서버 성공확인 전에 클라우드저장 완료를 표시하지 않는다.

## Neon·환경·배포 계획

org-purple-shadow-03640418 / polished-truth-68571504. 초기 production 연결은 사용자 요청. 작업은 dev 브랜치에서 검증하고 운영과 연결값 분리. neon.ts 기존값 보존. 서비스는 postgres와 private object-storage만 요청 범위, Auth/Functions 추가는 설계 선택 후 명시한다.

서버 변수: DATABASE_URL, DATABASE_URL_UNPOOLED(마이그레이션 환경만), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION, AUTH_* 확정 후, ALLOWED_ORIGINS. 공개 클라이언트는 API_BASE_URL만. .env*, .neon, 서명키, credentials는 gitignore. .env.example은 키 이름/용도만.

웹 호스트는 정적자산 캐시, API는 HTTPS와 상태조회. 운영 APK의 API URL은 https 고정, 로컬 테스트 빌드와 구분. Android 서명키는 저장소 밖 보관+복구용 별도 사본, 버전코드 단조증가, 패키지명은 출시 전 확정. 사용자 데이터는 APK 재설치로 삭제되지 않고 계정 재로그인으로 복구.

## 마이그레이션·장애 대응

DB migration은 Drizzle로 버전관리, direct 연결. schema 버전 N→N+1 변환은 dev에서 실제 유사세이브 검증, 변환 전 백업. 새 앱은 구버전 세이브를 읽고 변환할 수 있어야 하며 다운그레이드는 미지원. 기능 플래그로 쓰기를 잠시 막고 점검 화면 제공. 롤백은 이전 호환 앱으로 전환하거나 백업을 새 세이브로 복원, 운영 DB 일괄 덮어쓰기는 기본 대응이 아니다.

관측 지표: 명령 성공률, 중복 재시도수,409수, 저장/조회 p95, 게임청크 계산시간, state크기, 백업 실패. 서버 콜드스타트가 있으므로 저장중 상태를 유지하고 시간초과가 곧 진행취소라는 문구를 쓰지 않는다. 비용 예산/알림 금액은 실제 Neon 요금제 확인 후 정하며 무료 운영을 보장하지 않는다.
