# Native 고교 커리어 시작 API

목표: 실제 웹 연결 전에 DB fixture 주입 없이 소유한 빈 CAREER 저장에서 엔진 커리어를 만들고 첫 native 경기 worker까지 진행한다.

- 기존 생성 nonce로 서버가 world/선수 key를 결정하고 seed는 별도 서버 난수로 생성한다. 클라이언트는 실제 생성 선택(학교·연도·난이도·선수 설정·보조 구종)만 전달한다. 능력/잠재력/seed/세계 payload는 금지한다.
- 기존 ui/career/club을 덮어쓰지 않는다. DB mode·CAS·영수증·권한을 재사용한다. 기존 UI_SEED 저장은 별도 유지한다.
- CREATE/CONFIRM_PLAYER/RESOLVE_FOCUS/CONFIRM_PRESEASON/ADVANCE를 기존 native 함수로 연결한다. 고교 현재 owner만 받고 공개 조회는 명시한 필드만 반환한다.
- HTTP RED 후 타자/투수 생성·단일 신원·비밀 필드 비공개·입력 거절·재전송·첫 worker·JSON 재개 검증. 집중 타입/린트만 실행한다.
- 실제 첫 생성부터 실행한 부분 체인만 증명한다. 전체 시즌/졸업/KBO/웹 완료 또는24경로 PASS를 주장하지 않는다.
