# 미국 이적 관계 분리·E95 구현 계획

Goal: 설계60/107의 확정 이적 분리·실제 양쪽 출장 재회를 US 정규/MLB PS와 기존 관계 저장 API에 연결한다.
Architecture: 기존 KBO 근거 검증 원칙·event owner를 재사용한다. 미국 전용 health 등록/실제 FINAL owner를 사용하고 현재 로스터로 과거 만남을 추정하지 않는다.
Tech Stack: 기존 TypeScript engine/API. 새 의존성 없음.
Spec: docs/design/60-RELATIONS-DETAILED-CONTRACT.md, 기존 KBO E95 구현.

- [x] 실제 native 첫 경기의 상대를 사용해 재회/읽기 회귀 RED.
- [x] us-reunion-events: 양쪽 실제 출장/health 등록 검증·중복 방지·공개 읽기/선택.
- [x] US 정규 날짜/MLB PS FINAL hook와 US 관계 API adapter 연결.
- [x] 실제 minor/Major 외국단 수락 트랜잭션에만 원래 같은 레벨 동료 분리. 영구 원장과 ID 보존.
- [x] 집중 native/API·기존 이적 회귀, 타입/린트/build 묶음, 독립 리뷰, 문서/evidence·커밋/푸시.

E96 공동 등록·옛 KBO 신원 생성·국제전·소급 알림·새 게임 수치는 범위 밖이다. 전체 시즌/전체 M2 완료를 주장하지 않는다.
