# 76. 웹·APK 중단 후 이어하기 — 필수 사용자 기능

2026-10-19 사용자확정U:웹앱과앱모두중간에끊겨도이어하기가능. 기존28/64/69/70/72/74의서버저장·명령복구를홈진입부터끝까지연결한다. 현재는설계이며자동저장이나실기기중단테스트가구현된것은아니다.

## 저장과 홈

공식진행은서버commit된세이브가원본,게임종료버튼/브라우저종료이벤트를기다리지않는다. 경기청크/pendingGame/중요선택/강화·계약/일자마감/복무·진로/은퇴처리시점의transaction에즉시저장. 서버가성공응답을보냈다면웹·APK를강제종료해도그revision을이어받는다. 전송되기전초안/최종확정하지않은선택은공식효과가없으며가능하면이기기초안으로복원한다.

S01맨위‘최근 게임 이어하기’카드={선수또는구단명,현재연도·날짜,모드,마지막확정진행요약,미해결선택/경기/작업유형,lastCommittedAt,저장상태}. 세이브선택목록도유지,서로다른커리어/구단을자동합치지않음. 서버profiles.lastPlayedSaveRef는가장최근명시적PLAY/CONTINUE선택으로갱신,다른기기의단순목록조회로바꾸지않음. 로컬최근게임과서버최근게임이다르면두카드를표시할수있고버튼대상saveId를명확히한다.

## 진입 복원 순서

1. 세션복원/필요시로그인,로그아웃된사용자의이전계정저널은새계정에재실행안함.
2. 같은owner의로컬inflightCommand확인,있으면74의receipt조회. 원응답불명은동일ID재조회·재전송,새ID자동발급금지.
3. 최신save summary/revision과server resumeDescriptor조회,기기캐시state로덮어쓰지않음.
4. resumeDescriptor.kind에맞는화면복원. 이어받는주체는서버phase/allowedActions이며브라우저옛URL아님.
5. 초안이있으면draft.sourceRevision/대상entityVersion/필드schema검사. 현재와같으면복원하되확정은다시버튼,다르면‘저장된 초안’읽기제공후최신모형으로재preview.
6. 성공결과를확인하면저널ACK/CLEAR,이미확정된강화·계약은같은결과만보여줌. 결과확인화면에서뒤로가도당첨을다시뽑지않음.

## 상태별 이어갈 위치

| kind | 복원 위치·행동 |
|---|---|
|HOME|현재커리어/구단/대학/미국홈,다음합법일정 |
|EVENT_DECISION|동일eventInstance/선택가능항목,초안있으면선택표시만 |
|PENDING_GAME|같은gameId/provisional cursor/rngSnapshot,이어처리후최종경기결과 |
|RESULT_RECEIPT|이미확정된강화/계약/탐색receipt,효과재적용0 |
|YEAR_JOB|같은yearTransitionId단계조회,기존세계읽기가능/일반진행잠금 |
|RESTORE_JOB|같은restoreJobId상태,대상새saveId를중복생성안함 |
|SERVICE/ROUTE|복무program/학년/준비episode/권리/현재날짜,달력재시작없음 |
|COMMENTARY|62의같은확정경기와이기기읽기cursor,읽기위치유실시경기처음보기가능/세계결과불변 |
|ARCHIVED|완료보관원본과연대기. 은퇴transaction미완료면원게임최신phase/receipt부터확인 |
|INTEGRITY_BLOCKED|최근정상진행·진단참조·허용복구행동,새게임으로자동대체안함 |

## 웹·APK 로컬 보존

웹은IndexedDB에ownerNamespace/saveRef/inflightCommand와허용UI초안,APK는앱sandbox영속저장소에동일저널. command는송신전에journal완료,받은receipt요약도결과연출전에저장. 토큰/DBURL/서명URL/원잠재력·전체세계snapshot을저널에넣지않음. refresh세션은16/28의보안저장정책,저널은인증대체가아님.

visibilitychange/pagehide/앱background에서는초안·중계읽기위치저장best effort만,종료직전네트워크요청성공을저장보장으로삼지않음. OS강제종료후기기저장소가남으면저널복원,시크릿창/브라우저데이터삭제/앱재설치면로컬초안은사라질수있지만같은계정로그인으로서버공식진행은복원. 같은계정다른기기는그서버확정상태를이어가며다른기기의미전송초안까지복사한다고약속하지않음.

오프라인에서는‘최근 확정 진행’의읽기요약과연결안내. 경기·강화·계약을로컬확정해나중에합치지않음. 서버에접수된요청은접속끊김뒤정해진청크또는필수선택앞까지마감될수있고,클라이언트가없는데시즌끝까지추가명령을발급하지않음. 재접속시진행범위/실제확정날짜를알린다.

## API·화면·검수

GET /api/saves/{saveId}/resume→{saveId,revision,phase,kind,targetRefs,allowedActions,lastCommittedAt,blockingReasons,commandStatus?,jobStatus?}. 요약화면읽기API이며새경기·비용·추첨없음. POST /api/profiles/last-played={saveId,expectedPreferenceRevision}는소유권확인/개인선호revision,세계revision불변. 로컬draftSchemaVersion과command requestHash는불변,unknown field초안은삭제전메시지/본문값복원만허용.

S01이어하기버튼→‘저장된 진행 확인 중’→필요로그인→해당화면. S20은자동저장(공식진행)과수동백업(파일)을구분,백업실패가자동저장실패로보이지않게표시. 인계시각다른기기revision이면최신확정내용을보여주고오래된선택은재확인. 네트워크실패에처음부터하기를기본버튼으로제공하지않음.

RESUME01 홈최근게임/02선택중강제종료/03강화commit응답유실/04진행중경기동일ID/05연도job중단/06복무중날짜/07웹→APK동일계정/08다른계정저널차단/09오프라인세계수정0/10로컬데이터삭제후서버진행/11은퇴중단보관중복0/12중계cursor만유실. 실제웹새로고침·브라우저강제종료·Androidforce-stop·재부팅·토큰만료·기기2대의E2E검증은구현후필수다.