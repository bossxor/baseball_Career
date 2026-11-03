# 가상 미국 고정 리그·포스트시즌 API — 2026-11-04

## 시작 상태와 동기화

원격 bc0f51b까지6개 커밋을 fast-forward했다. 작업 원본은 지정 C: M2 체크아웃이고 V:에는 문서/증거만 Copy-Item한다. 기존 미커밋 us-amateur-return-career.test.ts의21줄은 수정/스테이징하지 않았고 전체 파일/patch를 저장소 밖 m2-sync-backups/20261104-local-tests에 보관했다. 큰 runtime JSON2개와 zz-dbg.log도 유지한다. 원격과 V: 문서를 기준 커밋 d76f99d와 비교해 충돌0, 최신 문서/증거81개를 동기화했다(sync-plan.json).

기존 E35 장기 검사는 실제 선택3시즌·각48경기 후 명시적 제안 거절/은퇴/JSON 보관2/2·종료0이었다. 원격 인계에도 별도 확인 및 e6df2ee 기준 전체1058중1053통과·환경5제외·웹24/24·HTTP smoke 종료0이 있다. 이는 이번 새 소속/PS 변경 전의 역사적 증거다.

## 사용자 결정과 구현

가상 미국30구단을 유지하고 고정 AL/NL 각15개를 사용하기로 승인했다. 서버 명시 목록은 US01부터 홀수 ID가 AL, 짝수 ID가 NL이다. 목록은 정렬/현재 순위/RNG로 나누지 않는다. 이름/선수/등록/금액/날짜/기록/강도·성장 규칙을 바꾸지 않는다.

us-conference-registry.ts는 버전1의 ID 목록/검증을 소유한다. 알려진30 ID의 새 세계는 생성 단계에 소속 metadata를 넣고, initial/active world 검증에서 변조·누락/중복/소속 변경을 거절한다. metadata가 없던 기존 세계는 유효하다. 명시적 configureUsCareerConferences는 PS 전 안전한 프리시즌/정규 결산에서 metadata만 추가하고 CAS를 지킨다. 시작/완료된 현 시즌 PS를 재배정하지 않는다. 미등록 custom ID는 추측하지 않으므로 별도 서버 소속표가 필요하다.

CAREER_US_PLAY_CONFIGURE_LEAGUES / START_POSTSEASON / ADVANCE_POSTSEASON3명령을 기존 저장 파이프라인에 연결했다. 입력은 careerRevision만 허용하며 AL/NL·시드·승자·예산을 클라이언트가 주입하지 못한다. 일반 플레이/병역 가드를 거친 뒤 기존 PS 엔진으로 실제 게임을 진행한다. US_CAREER 조회의 leagues/postseason은 공개 소속/대진/진행만 보여 주고 시드/RNG/잠재력은 내보내지 않는다.

낮은 수준의 기존 startUsPostseason은 명시적인 신뢰된 서버 소속 인자를 받는 호환 인터페이스를 유지한다. 예전 controlled fixture가 쓰던 대진을 고쳐서 현재 정식 소속표를 사용한 증거로 바꾸지 않는다. 공개 API는 반드시 현재 저장의 소유 소속표를 사용한다.

## 검증과 한계

RED 후 registry·기존 일반 US/연말 API·신규 legacy 설정/PS API·기존 PS 엔진 묶음11/11, 실패0·제외0,127533ms. 새 API는 실제 소속 대진 생성과 native FINAL1경기·JSON 재개·원본/정규 급여 보존을 확인했다. 기존 PS 회귀는 controlled 정규8790경기 접두 뒤 native PS46경기로 우승을 확정했다. native 정규시즌8790경기를 실제로 돌린 증거가 아니다.

관련 build/전체 테스트 타입/변경 파일 lint 종료0. 독립 최종 읽기 리뷰는 조치할 Critical/Important/Minor를 찾지 않았다. 리뷰는 별도 전체 실행/실제 PostgreSQL 검수가 아니다. 증거는 M2-20261104-us-leagues-static.log, us-leagues-green.log, us-postseason-batch.log와 exitcode다.

이번 변경 뒤 전체 npm run check는 아직 실행하지 않았다. 기존 로컬 WIP는 변경/포함하지 않는다. 대형 PostgreSQL HTTP·PGlite174MB UPDATE 한계·기본 실제 화면·메이저 연말/시장 API·99사건/24경로/PF 잔여는 남아 있으며 M2 완료가 아니다. 다음은 기존 메이저 재계약/FA writer의 저장 입구다. 숫자/연간 지원금을 새로 추정하지 않는다.
