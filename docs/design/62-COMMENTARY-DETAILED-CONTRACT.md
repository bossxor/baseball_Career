# 62. 감상형 문자 중계 상세 계약 — 로그·해시·읽기 복원

사용자확정U:이미확정된경기감상/스킵/다시보기. 경기전전략·타석중전략명령은중계에추가하지않는다. 실제라인업/기용등기존필수행동은경기확정전에처리. 53기본안과64공통계약을구체화한다.

## 진행과 재생 상태 분리

서버경기상태=QUEUED/SIMULATING/PENDING/FINAL/ERROR. FINAL만공식종료결과/resultHash가존재. 클라이언트감상상태=READY/PLAYING/PAUSED/FINISHED/UNAVAILABLE. 감상선택이엔진seed/배열정렬/타석호출수를바꾸지않는다. ‘중계보기/결과보기’선택은동일게임진행command를호출하고presentationMode는클라이언트선호로만저장,엔진입력에서제외한다.

중요경기후보는gameId+reasonKey고유:첫예상KBO/MLB/국제출장,결승,첫라이벌실제재회예정,사전은퇴선언후마지막예정출장,기록문턱직전. 후보정렬은필수사건뒤→gameDay→gameId. 같은경기이유여러개합침,같은후보상태version에서반복팝업없음. 설정OFF는후보읽기중단만생략. 실제출장0이면데뷔/재회/은퇴출장moment안만듦.

일반진행청크내pending이면서버현재확정타석까지의프레임과‘경기 처리 중’만표시. 응답유실은원commandId조회,다른ID로경기재시작금지. FINAL도달후완전로그감상,현재UI일시정지는서버엔진중지명령이아님. 결과스킵은클라이언트cursor를마지막프레임으로옮기며game/save revision변경0.

## 정규 로그 형식

playRecord={logSchemaVersion:1,gameId,playCursor:int≥0,paSequence,kind,gameInstant,inning,half:TOP|BOTTOM,batterId?,pitcherId?,representativePitchId?,before:{outs,bases:[runnerId|null]×3,homeScore,awayScore},resultCode?,after:{…},legalRuns:[{runnerId,responsiblePitcherId,earnedFlag}],effectiveProbability?,evidenceRefs:[]}. kind는PA_START/REPRESENTATIVE_PITCH/PA_RESULT/ADVANCE_RESULT/PITCHER_CHANGE/INNING_END/GAME_END/MILESTONE. 같은(gameId,playCursor)고유,중계문장마다새경기효과를발생시키지않음.

outs전후/점수전후는해당이벤트실제snapshot. 정규1B후주루아웃은PA_RESULT/ADVANCE_RESULT를각원기록으로표시,3아웃후불법득점문장없음. GAME_END는최종receipt후한개,로그RBI/outs는24박스스코어와일치. 대표구종은57이이미선택한ID,없으면문장생략. 타구방향/실제초구/좌우코스/실측구속/기상등없는필드는문장에추론하지않음.

템플릿입력은로그snapshot만사용,현재선수나이·현재구단으로옛경기를바꾸지않는다. 홈런legalRuns개수로{runs}확정,국제타이브레이커자동주자ER은24원장그대로. 자동추가진루는실제판정의effectiveP와결과를회고표시,원p와특성후p를혼동안함. p=1숫자는38대로숨기고‘성공 보장’문구사용. p없는조회/스킵에확률배지없음.

## chunk·해시·보존

최대200playRecord/응답,chunk는최대256KiB비압축UTF8를기준으로정규JSON뒤gzip. 인덱스에시작/끝cursor,count,sha256OfUncompressed,previousChunkHash,compression,objectKey,logSchemaVersion. chain순서와checksums검사,FINAL manifest={gameId,engineVersion,logSchemaVersion,commentaryTemplateVersion,resultHash,chunkHashes,boxscoreRef,finalCursor}. resultHash는정렬canonical JSON(gameId,engineVersion,finalScore,boxscore,기록판정원시원장)SHA256이며UIcursor/速度/템플릿미포함. 구기록은당시hash유지,새버전으로경기를재시뮬레이션하지않음.

데뷔/실제기록달성/결승/라이벌재회/은퇴경기/사용자핀은important_game_snapshots영구보존. 일반상세만15보존기간적용. 원본archive참조로그는save삭제전원본보존namespace에manifest+chunk참조이관확인. refcount0인일반chunk만만료청소,불변참조있는파일삭제금지. 사용자가핀할때이미로그없으면summary핀만가능/다시보기없음명시. 자동중요후보였으나실제이정표없는경기는일반정책.

## API와 엔티티

commentary_manifests(gameId UNIQUE,status,versions,resultHash,finalCursor,chunkRefs),play_log_chunks(gameId,startCursor UNIQUE,hash,objectKey,count),important_game_snapshots(owner,scopeRef,gameId UNIQUE,reasonKeys,manifestHash),commentary_preferences(owner,scopeRef,gameId UNIQUE,preferenceRevision,cursor,speed,spoilerRevealed,pinned). live플레이상태와읽기cursor분리,내부storage key를공개API에노출안함.

GET /api/saves/{saveId}/games/{gameId}/commentary?afterCursor&limit→{status,resultHash|null,logVersion,records,nextCursor,finalCursor|null,canReplay,summary}. archive게임은GET /api/archives/{archiveId}/games/{gameId}/commentary. opaque cursor는gameId/logVersion/마지막순서와owner에결합,다른게임cursor는422 INVALID_CURSOR. chunk손상은503 LOG_INTEGRITY_ERROR,요약조회/재검증안내,임의새경기생성없음.

PATCH /api/commentary-preferences/{scopeRef}/{gameId}={expectedPreferenceRevision,cursor,speed:1|2|4,spoilerRevealed,pinned?}→{preferenceRevision,preferences}. cursor≤현재최대확정값,미완료경기마지막을최종종료로간주안함. 두기기cursor경합409는자동큰값채택안함(다시보기되감기보존),기기내읽기위치는유지하고명시적저장선택. 화면속도/다음타석/되감기는로컬,위치저장은타석전환debounce/종료시,실패해도경기결과유지.

## S44·접근성·검수

입장→상태/manifest검사→저장cursor복원→1타석/재생1·2·4배/정지/되감기/결과스킵→박스스코어또는기록홈. 재방문FINAL은처음/이어서선택,기본스코어스포일러여부는기기선호. 자동음성OFF,aria-live는사용자가넘긴현재타석요약만,전체로그는스크롤리스트. reducedMotion은타석결과즉시표시,배경애니메이션없음. 그림실패대체텍스트,문장오류시해당원기록fallback.

LIVE-D01 중계ON/OFF같은resultHash/02스킵rng0/03속도4도동일결과/04BB/HBP개별처리/05partial은FINAL아님/06로그재요청중복카운트0/07checksum불일치요약fallback/08archive원본로그보존/09없는방향문장0/10홈런legalRuns2면2점/11되감기cursorCAS충돌/12중계조회능력·보상delta0. 실제브라우저/Android중단·네트워크회복·키보드및박스스코어일치는구현후실행검수한다.