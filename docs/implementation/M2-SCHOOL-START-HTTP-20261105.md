# Native 고교 커리어 생성·첫 경기 HTTP — 2026-11-05

## 구현
DB fixture 주입 없이 소유한 빈 CAREER 저장에서 CAREER_SCHOOL_CREATE를 실행한다. 학교·시즌 연도·난이도·선수 설정·투수 보조 구종은 명시 입력을 받고 기존 엔진 생성 검증을 사용한다. world/선수 key는 기존 서버 nonce를 사용하고 seed는 독립 서버 난수로 한 번 생성·저장한다. nonce가 공개 사건 키에 포함되므로 seed를 nonce로 파생하지 않는다. 같은 명령 재전송은 기존 저장 트랜잭션/영수증을 재사용한다.

CONFIRM_PLAYER→RESOLVE_FOCUS→CONFIRM_PRESEASON→ADVANCE는 기존 native 명령을 호출한다. SCHOOL_CAREER 공개 조회는 선수 표시/현재 능력·종합·학교·팀 경기수·현재 사건 식별자만 반환한다. 잠재력·세계 seed/rng·다른 선수·내부 basis를 노출하지 않는다. KEEP_FOCUS에 사용하지 않는 focus payload를 넣으면 거절한다.

빈 M3 저장의 허용 필드/초기 stamp만 받고 ui/club/career 등 기존 데이터를 덮어쓰지 않는다. 저장 mode는 잠근 DB 행에서 확인하며 CLUB 저장에는 실행할 수 없다. 기존 UI_SEED 저장/명령은 유지했다. 새 게임 규칙/분포/급여/확률/성장량 변경 없음.

## 검증
- RED: CREATE 명령 미연결로 HTTP400, 타자·투수 모두 실패.
- 집중: 타자·투수2/2, native 생성부터 첫 경기 worker까지 실제 HTTP. DB state를 주입하지 않았다.
- 최종 묶음: 학교2+KBO입단2+M3인증/재전송/rollback/두기기CAS3+기존 M4셸1 =8/8, 실패0·제외0, duration_ms37910.4592.
- 학교9·학교당25·전체225·주인공18세·달력·단일 생성, 주입 payload/타인 저장/잘못된 집중/CLUB mode/덮어쓰기 거절, 같은 영수증 replay, 무시될 focus 거절, 저장 JSON 왕복을 확인했다.
- 최종 타입·린트 종료0. 중간 PitchId import 타입 오류는 rules 타입으로 수정했고 최종 로그에 오류 없음.
- 읽기 전용 리뷰의 seed 파생 노출·ignored focus 입력을 보완했다.
- evidence/M2-20261105-school-start-red/focused.*, school-start-gates.json/types.log/lint.log, school-kbo-api-regression.log/.exitcode.txt.

## 한계
첫 worker는 고교 경기 일정의 실제 일부다. 주인공 첫 출장·고교 전체 시즌/졸업/KBO입단 전체 연쇄·전체24경로 PASS가 아니다. 일반 웹 생성 UI는 기존 셸이며 native 생성의 학교/연도/난이도/구종 입력과 공개 화면 연결은 다음 단계다. 실제 복무2년/후속 미국 정규시즌은 별도 실행 중이며 전체 npm run check는 아직 실행하지 않았다.
