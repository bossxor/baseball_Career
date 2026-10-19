표시·상태 최신 계약: [104](104-COMMENTARY-CHRONICLE-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 63. 연대기·카드 상세 계약 — 근거·메모·PNG·복원

54의기록표현기능을구체화한다. 목표보상방법과무관하게이문서는실제근거기록을복제표현하고수치/보상을지급하지않는다. 64공통인증,원본은퇴snapshot불변.

## 장면 생성과 보존

주요게임/등록/계약/복무/학적명령이commit할때moment_event_outbox에(sourceReceiptId,momentType,playerId,evidenceRef)고유행저장. projection worker가정의버전별template와gameInstant/당시나이/팀/리그/rawStatSnapshot을채워career_moments생성. UNIQUE(sourceReceiptId,momentType,playerId). 같은경기여러성과는groupKey=gameId로대표카드1개/배지목록,각근거행유지. 표시지연은‘장면 정리 중’,worker실패가경기명령rollback/재추첨을유발하지않음.

순서=(worldSeason ordinal,dayIndex,gameSequence,playCursor,momentId),최신순목록은역순cursor. season_book은해당시즌모든소속scope별기록과momentId참조,국내/미국합산없음. 은퇴완료조건은최종수치snapshot확정,연대기projection미완료라도보관상태PRESENTATION_PENDING표시후복구가능. 원본의sourceReceipt와momentRawSnapshot을독립보존해활성save삭제에도원본읽기가능. 선수나팀이름변경은과거당시값을덮지않음.

본문필수placeholder가없으면TEMPLATE_INPUT_MISSING으로표현만pending,역산/가짜경기생성없음. 상세로그없어도장면raw숫자/날짜는표시,재생링크만비활성. 경기기록정정은evidenceVersion증가와카드CORRECTED표시,옛이미지대체시기록변경이력보존.

## 사용자 선호 분리

moment_preferences(ownerSubject,momentId UNIQUE,preferenceRevision,pinned,hidden,userTitle,userCaption,coverTheme). 공식제목/기록은immutable,사용자제목60/설명300글자소NFC/제어문자불허/HTML이스케이프. 핀/숨김은별개bool,숨긴핀은‘숨김포함’필터에서조회가능. 같은장면두기기메모는expectedPreferenceRevision CAS,409후자동병합/덮어쓰기없음. 선호변경은save revision/PRNG/수상/보상불변.

## 카드 생성 규격

PNG단일카드1080×1350,sRGB,배경불투명,상단브랜드/시점→초상→제목최대3줄→scope/기록표→사용자메모최대6줄→게임모드출처. 제목40px/본문28px/숫자64px기본,줄넘침은글자축소대신preview에서메모편집·다른레이아웃선택. 한국어폰트glyph사전검사,준비전렌더금지. 그림실패는단색/이니셜,폰트도모든한글표시불가면FAILED/사용자에게텍스트JSON대안. 공식로고미허가상태는팀명/색상대체,이미지에강제로다운로드한외부파일을섞지않음.

JSON은{exportSchemaVersion,presentationVersion,playerDisplayName,scope,createdGameInstant,moments:[{momentRef,type,gameInstant,age,scope,rawStats,publicEvidenceRef,userTitle,userCaption}]}이며local내려받기전전체개수표시. 인증값/이메일/ownerSubject/스토리지비밀키/내부DB접속/내부행ID는제외,publicEvidenceRef는내려받은묶음내참조용익명ID. 가져오기지원은현재백업시스템과별개이므로이JSON을게임세이브복원파일이라표시하지않음.

## export job과 파일 생명주기

QUEUED→RENDERING→UPLOADING→READY/FAILED/CANCELLED. owner+exportRequestId+동일payloadHash멱등,다른내용같은ID409. snapshot은momentVersion/preferenceRevision/themeVersion에고정,대기중메모수정해도기존job수출내용은바뀌지않음. 네트워크재시도같은job조회,신규상태로다시만들기는새requestId명시.

private object key=owner namespace/exports/jobId/output.png,업로드checksum/크기검사후READY. 파일24시간후정리,서명다운로드URL5분,만료는job조회로새URL. 영구장면/기념카드정의는남고임시이미지만정리. READY전고아파일은업로드TTL뒤청소,상태FAILED가장면삭제/재지급으로이어지지않음. 서버최대파일10MiB/유저동시job2/같은outputHash재사용가능,이한도는연대기보관개수하드삭제상한아님.

## 엔티티·API·S45

career_moments(momentId,scopeRef,playerId,momentType,gameInstant,ageSnapshot,rawSnapshot,evidenceKey,presentationVersion,status),moment_event_outbox(sourceReceiptId/type/playerId UNIQUE,status,retryCount),season_books(scopeRef/seasonId UNIQUE,scopeRecordRefs),moment_preferences는위정의,card_export_jobs(owner/requestId UNIQUE,status,inputHash,outputHash,objectKey,expiresAt,errorCode).

GET /api/saves/{saveId}/players/{playerId}/moments?seasonId&leagueId&type&cursor,GET /api/archives/{archiveId}/moments,GET /api/moments/{momentId}는owner권한검사후{official,preferences,evidenceAvailability,canExport}. PATCH /api/moment-preferences/{momentId}={expectedPreferenceRevision,pinned?,hidden?,userTitle?,userCaption?,themeId?}→{preferenceRevision,preferences};POST /api/card-exports={exportRequestId,scopeRef,momentId,format:PNG|JSON,expectedMomentVersion,expectedPreferenceRevision,themeId};GET /api/card-exports/{jobId}→{status,preview?,downloadUrl?,expiresAt?,errorCode?}. 외부전송endpoint없음.

S45필터→카드→공식/메모구분→미리보기→수출확인→job상태→기기저장. 422 TEXT_OVERFLOW이면대상필드편집,409 VERSION_CHANGED면현재모습재preview,503 EXPORT_FAILED면같은job상태확인/새job선택. PIN장면누르기는코스메틱선호만,화면나가기취소가공식카드를삭제하지않음.

CHR-D01 같은outbox2회장면1/02국제0출장이면출장성과문장없음/03원본나이41유지/04메모CAS/05긴제목초과/06업로드실패공식기록불변/07서명URL만료파일존재/08export에ownerSubject없음/09게임세이브아닌JSON안내/10원본source-save삭제후카드읽기. 실제PNG픽셀/한글/Android저장은별도실행게이트.
118 후속:[118](118-LATECAREER-ARCHIVE-CLUB-CONTINUITY.md)은후반커리어→은퇴원본→19세복사/지도자역할의경험과계보claim경계를연결한다. 기존원본불변·반값·병역리셋·같은세계역할하나규칙은유지한다.
