# 상세설계 10 — 저장 계약·API·인증·테스트 데이터

앱 코드나DB migration미작성.06/16의스키마를구체화하고구현자가임의보안우회를하지않게계약을고정한다. 실제인증SDK/Android교환/DB동작은구현후증명한다.

## 저장 구조 조정

한세이브세계의행동은game_saves행하나를잠가순서를보장. state JSONB가너무커질것에대비해immutable game_results/season_records를관계테이블로분리한다. state에는현재세계의가용선수/일정커서/작업큐/권리참조만. 과거선수의모든연도성적을세계JSON에무한중복저장하지않음. 선수원본archived_players snapshot은완결상태를독립보존.

추가테이블:
- game_results(save_id,game_id PK,season_id,competition_id,summary,boxscore,created_at),소유권은save연결.
- season_records(save_id,player_id,league_id,season_id,phase PK,raw_stats,awards,version).
- career_ledger(save_id,entry_key PK,type,source_id,delta,evidence,applied_revision),성장/보상/예산멱등원장.
- auth_allowed_subjects(subject PK,status,created_at),초대게임접근제어.
- native_sessions(id,subject,refresh_hash,expires_at,revoked_at,rotation_family),선택한앱세션설계용.
- login_exchanges(code_hash PK,subject,challenge,redirect_id,expires_at,consumed_at),일회용앱복귀.

profiles/game_saves/archive/import/backups/command_receipts는06유지. delete cascade는경기/원장/receipt에만,독립보관원본은명시삭제흐름. 돈bigint원/달러각각,outs int≥0,타자기록원시수치int≥0,versions int≥1,revision bigint≥0. JSON수치NaN/Infinity거절,외부ID문자열최대128,본문UTF8크기검증.

## 명령 처리 원자성

인증→allowlist→payload schema→save소유권→트랜잭션/행잠금→receipt조회→동일IDrequest hash일치검사→expectedRevision→phase/source/evidence검증→순수엔진→불변조건→state/분리기록/원장/receipt커밋. 엔진응답에서현재시각을직접생성하지않고서버명령입력값사용.

request_hash는type/payload/expectedRevision의canonical JSON으로계산,토큰/헤더/재시도시각불포함. receipt에결과revision/작은결과/이벤트ID만,5MiB state전체중복없음. 동일commandId다른내용409,동일내용은저장된원래결과반환. source검증실패명령은성공receipt가아니라재시도금지오류이며부수효과0.

반복조회로완료결과를찾을수있게GET /api/saves/:id/commands/:commandId제공,없음404는다른사용자/미실행구분노출없음. 사용자가진행중새로고침하면이조회부터하고그다음save최신조회. 응답불명인명령과다른명령을동시에보내지않음.

## API 계약

공통요청헤더Authorization또는웹세션,Client-Version,Request-ID.명령POST에는commandId/expectedRevision/type/payload.성공{commandId,revision,phase,summary,eventIds,nextActions,result};오류{code,messageKey,requestId,fieldErrors?,currentRevision?,retryAfter?}.민감예외stack/SQL/접속문자열전달금지. 게임 화면용 state/stateChanges는67/75/100의 공개 DTO projection을 거친다. 서버 SaveState를 그대로 반환하지 않고 일반 응답의 rawP/seed와 미해금 히든 조건·진척을 제외한다. 원본 보관·백업 내부 상태와 화면 응답은 별도 자료형이다.

목록cursor는updatedAt+id의 안정적인 조합,타사용자목록접근불가.상세기록API에는leagueId/seasonId/phase필터필수에서 대표/MLB/마이너통계를혼합하지않음.정렬열은정적allowlist,사용자문자열SQL직접연결금지.문자입력은문자열로렌더링.

본문한도명령64KiB,서버state5MiB경고/분리마이그레이션,백업압축해제10MiB.타임아웃30초안에못끝나면청크축소/pending진행을사용.타임아웃을rollback보장으로알리지않음.

## 인증·앱 연결

관리형 인증 후 API 검증과 allowlist 검사를 별도로 실시한다. 웹 쿠키는 HttpOnly/Secure/SameSite와 CSRF 검증을 사용하며, 네이티브는16의 시스템 브라우저 교환 계약을 따른다. 원격 SDK가 정식 지원하는 세션 검증 흐름을 사용하고, secret 없는 공개 클라이언트에서 서명을 생성하거나 위조하지 않는다.

login exchange는서버난수256bit/code hash보관/60초/단일사용/PKCEchallenge/등록redirect와 연결.URL에는code+state만,access/refresh/JWT없음.exchange/refresh token은URL로그와분석대상제외.앱secret는 OS보안저장소, localStorage를영구refresh보관소로쓰지않음.

API access15분/refresh30일게임기본설계.refresh회전은이전hash재사용시family철회.고아세션/동시정상refresh의경합은기존회전결과를같은requestId로짧게조회하도록설계하고재사용공격과구별.공급자지원확인전임의자체JWT구현확정하지않음.

## fixture와 테스트 계층

세트 F01 고교미지명/제안0,F02 타자주전/F03 투수콜업,F04 41세원본19세복사,F05 MLB계약/포스팅실패,F06 AG금/미출전/F07 상무탈락/복무복귀,F08 두기기revision충돌,F09 자동주자ER/F10 예산예약동시제안.모든seed/초기state/명령/예상delta를버전고정.

순수엔진테스트: DB없이정확한상태/합계/난수재현.DB통합:개발Neon브랜치에서 실제트랜잭션/unique/rollback/소유권.스토리지통합:private버킷작은파일업로드/체크섬/다운로드/삭제, 테스트데이터만정리.API E2E:가입/로그인/보호접근/클라우드진행/재로그인/원본보관.Android:실기기AppLinks/중단복귀/업데이트.

성공스냅샷을코드와 같은 식으로 재생성해 비교하는 테스트는 피한다.경계기록은사전에수작업으로기대값정의하고property검사로H합/outs/금액원장보존.시간/난수/외부계정은주입가능하게분리.테스트가운영게임세이브를 임의 수정하지않음.

## 배포전 차단

계정삭제/backup소유권/JWT검증/PKCE원회사용/receipt재시도/DBrollback중하나라도검증미완료면공개배포금지.로컬prototype와실제접근제어없는공개웹을동일완성으로보지않는다.서면설계완료가이통과를대체하지않음.


최신 확률 표시 규칙: [38 공통 계약](38-PROBABILITY-DISPLAY.md)을 따른다. 확률 선택은 모두 표시하되 실제 100%의 숫자 배지는 숨긴다. 보장 효과와 내부 확률은 유지한다.

## v0.8 추가 데이터·API 계약

40~46의설계구체화를따른다. 실제SQL/배포명령은아직없다. 새필드는처음구현할스키마에포함,이미존재하는게임세이브가있다고가정한데이터덮어쓰기없음.

| 논리 엔티티 | 추가 필드/제약 |
|---|---|
| rules_versions | abilitySchemaVersion2,growth/odds/college/economy/event/UI버전;세이브별고정 |
| players | kind별정확6abilities/potential/careerPeak;overall파생/roleScore분리 |
| development_plans | worldSeasonId,focus4중복없음,style,periodHistory,growth원장 |
| imported_players | sourcePeakVersion,importDraftId,19세startingAbilities,boost6개,resetMilitary,sourcePreset |
| college_enrollments | schoolId,academicYear,completedYears,status,earlyDraftAttempted,휴학/복학원장 |
| scouting_searches | ownerClubId,worldMonthId,조건,N/level/q,pSnapshot,cost,commandId/result선수ID;횟수원장 |
| scouting_reports | discoveredPlayerId,level,평가일,potentialRange6개;같은선수P재생성없음 |
| offer_rounds/offers | fixedAiOfferVersion,score/weight/outsideWeight/pSnapshot,예약슬롯/당해·미래예산,receipt |
| club_accounts | paid/reservedOperations추가;시설level1~5;무제한은mode열,Infinity금액불허 |
| event_instances | catalogVersion2,E01~83,sourceEntityId,occurrenceKey,choiceSnapshot,resumePhase,receipt |

preview명령는READ연산,난수소비/비용/usage없음. 실제SCOUT/UPGRADE_SCOUT/SUBMIT_OFFER/RESOLVE_ROUND/ENROLL_COLLEGE/ADVANCE_ACADEMIC_YEAR/CONFIRM_IMPORT는revision+idempotencyKey검사. 계약확정은선수당활성계약1개/제안예약해제/계약원장하나의transaction. 구단치트의효과는서버세이브preset에서읽고클라이언트가p=1을전송해도무시한다.

학교권리/원본소유/후보풀/시즌기회가바뀌면409후최신preview,유효조건없음422와reasonCode,결과불명은동일commandId조회. 앱이자기DB권한으로다른친구세이브/비공개파일을읽지못하는28의원칙유지. 입력진로가숨겨져도서버에서조건재검사한다.

확장계약:[55](55-EXPANSION-INTEGRATION.md). 47특성/48구종성향/49목표/50개인협상/51관계/52지도자/53확정경기중계/54연대기를추가한다. 기본6능력·상한100·강화1회유지,구종XP/원본스킬복사/직원비용/로그보존예외는각최신문서적용.


2026-10-19 사용자필수:웹·APK중단후이어하기. [76 이어하기계약](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)의홈최근게임/서버resumeDescriptor/송신전저널/receipt재조회/경기·선택·작업복원과12검수시나리오를적용한다. 서버확정진행은종료이벤트와무관히보존,미송신초안은별도기기선호다. 미리보기/확정의복구는[74](74-PREVIEW-COMMAND-RECONCILIATION.md).
