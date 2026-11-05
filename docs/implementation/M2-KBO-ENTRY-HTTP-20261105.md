# KBO 입단 HTTP 연결 — 2026-11-05

## 구현 범위
기존 native 지명 준비·결과·서명·아마추어 연말 마감·KBO 첫 등록을 CAREER_KBO_ENTRY_PREPARE/RESOLVE/DECIDE/CLOSE_YEAR/ACTIVATE 저장 명령으로 연결했다. KBO_RECRUITMENT 공개 조회는 아마추어 지명 단계와 입단 직후 PRESEASON_SETUP을 구분한다.

입력은 careerRevision과 명령별 허용 필드만 받는다. 세계·예산·시드·선수·권리·급여는 서버 소유의 기존 엔진 원장에서 가져온다. 기존 소유권·CAS·명령 영수증 트랜잭션을 재사용한다. 새 게임 규칙/확률/급여 변경 없음.

## 실행 증거
- RED: 공개 조회 미연결로 타자·투수 모두 HTTP400.
- 최종 집중: 타자·투수 2/2, 실패0·제외0, duration_ms21764.621.
- 실제 HTTP 지명 준비→확정→서명→연말 마감→입단. 잘못된 버전/추가 payload/타인 저장/마감 전 입단/중복 입단을 거절한다. 같은 명령 ID 재전송은 같은 영수증을 반환한다.
- 선수 신원·나이+1·계약/보유권·예산 예약·단일 등록·기록·아마추어 보관·투수 구종 보존을 확인했다.
- 타입·린트 종료0. 독립 읽기 전용 리뷰 조치 필요 사항 없음.
- evidence/M2-20261105-kbo-entry-focused.log/.exitcode.txt, gates.json, types.log, lint.log.
- hitter/pitcher-commands.json은 실제 5명령 전후 canonical SHA256이다. 전체 경로 완료 해시가 아니다.

## 한계와 다음 작업
출발점은 controlled 고교 결산본과 native 진로 사건이다. 전체 고교 native 시즌/24경로 증거가 아니며 실제 웹 신규 커리어 생성·플레이 연결은 아직 남아 있다. PGlite HTTP 검사이며 환경 키가 필요한 PostgreSQL/Neon/Managed Auth 검사를 대체하지 않는다. KBO 해외 귀국의 최신 authority 연결과도 별도다.

실제 복무2년 검사는 별도의 동결 source에서 계속 수행 중이며 완료로 세지 않는다. 원본 서비스 테스트 WIP는 실제 통과 후에만 커밋한다. 전체 npm run check는 이 묶음에서 실행하지 않았다.
