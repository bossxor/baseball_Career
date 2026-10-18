# 67. 잠재력 스카우팅 정보의 점진 공개

사용자확정U:일반/하드잠재력은스카우팅으로점점좁아지는범위. 개인치트주인공은잠재력100고정공개유지. 실제P는생성/복사시서버에서고정,평가를새로고침한다고P를다시뽑지않는다.

## 평가 대상과 갱신

현재능력6개는정확표시,잠재력은능력별[L,U]와전망문구. 최초reportStage0,등록소속팀정규20경기경과마다최대1단계상승,최대4. 이적/승강/대회이동은누적평가진척과기존범위를유지,팀변경일의전후게임구간만분할해중복누적없음. 복무일반현역/무등록기간은관측경기0,대학/상무/독립준비실제등록팀경기는관측가능. 오래쉰선수에게시계시간만으로평가가자동좁아지지않음.

커리어본인은평가조회무료,관측20경기가지났을때서버진행정산으로reportStage확정,조회/버튼연타로stage증가없음. ownEffectiveLevel=min(5,2+floor(완료프로등록시즌/2)),프로미진출은2. 구단타인은시설+직원유효레벨40/61,선수발견이후관측stage를누적한다. 구단유료탐색성공p는‘발견’의확률이며전망적중률을추가추첨하지않음.

## 범위 계산과 누적 신뢰

baseWidth(L1~5)=[20,16,12,8,6],w=min(100-A,max(2,baseWidth-2×stage)). A는현재영구능력,P는고정진짜잠재력. 고정seed(playerSimulationKey,abilityKey,assessmentModelVersion)에서z∈[0,1]1개,rawLow=clamp(P-z×w,A,100-w),rawHigh=rawLow+w. 새표시범위는기존확정범위와raw범위의교집합,다시[A,100]과교집합. 진짜P가반드시포함되므로정상데이터에서공집합없음. 공집합이면ASSESSMENT_INCONSISTENT읽기오류,새P생성/기존범위확대금지.

내부1e-4,화면하한floor/상한ceil로바깥반올림해P를거짓배제하지않음. 표시폭이그대로면‘관측자료갱신,표시범위변화없음’,거짓으로정밀해졌다고쓰지않음. 새로운저레벨구단으로이적해도이전확정정보를잊어범위를넓히지않음. 예기존[82,94]/새raw[85,93]→[85,93],다음[84,95]가와도[85,93]. 같은레벨재열람은동일보고서.

현재A가99이면미래P가능범위[99,100]처럼2보다좁아질수있고A100이면[100,100],물리적경계의정확함을숨기려거짓범위만들지않음. 치트P100은범위평가를우회한확정능력숫자이며강화성공률100숫자숨김정책과별개.

## 사용처와 자동 의사결정

화면평가/스카우트AI의전망점수는표시범위중앙값,숨은P로영입성공/연봉을AI만유리하게계산하지않음. 성장엔진만실제P로상한처리한다. 현재A가표시범위하한보다커지면새보고서없이도이미확정사실A를반영해하한올림,stage기회소모없음. 잠재력에닫힌성장은‘현재 전망 상한에 가까움’같이확정하지않은문구로설명,일반클라이언트API에rawP누출안함.

원본archive도일반선수는공개범위와내부보존P분리. 구단복사잠재력새설정은서버내부P사용,화면은새playerId의stage0보고서. 원본정밀보고서가복사본의새P범위를증명하지않으므로그대로복사안함. 치트원본잠재력100공개는원본출처,일반구단복사본도계산상P100이면보고서정책을따르고치트프리셋자동적용안함.

## 데이터·API·화면

assessment_progress(saveId,playerId UNIQUE,observedTeamGames,stage,lastSettledCursor),ability_assessments(playerId,abilityKey,version UNIQUE,lowUnits,highUnits,stage,level,evidenceSpan,createdGameInstant),assessment_public_summaries(playerId,abilityKey UNIQUE,currentLow/currentHigh,version). rawP/seed는API응답제외,서버정의버전고정. 저장된보고서원장으로새로고침시점차이불변.

GET expansion/assessments?playerId→{mode:RANGE|FIXED_CHEAT,abilities:[{abilityKey,current,potentialRange?,fixedPotential?,outlook}],stage,nextObservationGames,reportHistoryCursor}. 읽기권한만,paid확률preview없음. 기록갱신명령은공통일진행내부hook,client SET_POTENTIAL/REFRESH_FOR_BETTER_ROLL명령없음. 보고서확정receipt재처리version증가0. 정보없음은평가대기,실제범위0~0으로표시안함.

S16능력행잠재력셀/ S36스카우트보고서/ S39숙련과별도:‘잠재력 85~93 · 관측3단계 · 2031시즌평가’/‘다음갱신까지12팀경기’. 독자도움말에범위는성공확률아님을명시. ASSESS01 교집합단조축소/02이적저레벨확대0/03관측19→20stage1/04재조회rng소비0/05A100범위100/06일반rawP응답없음/07치트100표시/08복사보고서초기화/09보고서불일치안전오류/10AI범위중앙값사용.

2026-10-19 사용자추가확정:강화정확증가량·비용우선(75). 스카우팅범위는유지하되실제효과로상한추론가능함을허용,개별행동snapshot과원본P필드공개는분리한다.
