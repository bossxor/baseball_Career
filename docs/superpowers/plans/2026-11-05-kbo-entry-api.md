# KBO 진입 저장 API 구현 계획

Goal: 기존 native 지명/계약/연말/등록 함수를 소유 저장의 HTTP 명령·공개 조회에 연결한다.
Architecture: API adapter만 추가. 기존 engine/rules bytes·서비스 background source를 변경하지 않는다. server-owned amateur root의 kboRecruitment와 실제 서명/연말 receipt만 활성화한다.
Tech Stack: 기존 TypeScript/Hono/M3 save CAS/PGlite, 새 의존성 없음.
Spec: M2 잔여 웹 진입 전제, 기존 career-kbo/kbo-entry/kbo-career-entry native 계약.

- [ ] HS hitter/pitcher controlled 졸업 source → HTTP PREPARE/RESOLVE/DECIDE/CLOSE_YEAR/ACTIVATE·JSON재개·서명/등록/권리/돈/신원 보존 RED.
- [ ] 엄격한 payload·revision/version·아마추어/KBO owner 구분, 신규 native 공개 DTO 조회.
- [ ] 재전송/타인/오래된save/중복활성화/미서명 실패·비공개 필드 검증, 실제 명령의 before/after canonical SHA256 증거.
- [ ] 집중 API/기존 shell·타입/린트 확인. engine source 동결을 보존하며 문서·Co-Authored-By 커밋/푸시.

기본 웹의 실제 화면 연결, 새 게임 생성 Native SEED, 미국 귀국 최신 KBO authority, 전체 native HS/KBO 시즌 및24경로 완료는 별도다. Full path label을 올리지 않는다.
