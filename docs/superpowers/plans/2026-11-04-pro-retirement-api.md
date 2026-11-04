# 프로 은퇴·보관 저장 API 계획

Inline executing-plans; native retirement/archive owner 재사용. 기존 S09/E36/E37/E69 규칙을 변경하지 않는다.

- [x] RED: 저장 dispatcher의 은퇴 명령 미지원 재현.
- [x] KBO/US 요청·확인/취소·최대나이 처리와 공개 보관 조회 연결. strict payload/command enum; 원장/기록/seed/신원 보존.
- [x] 공개 확인 화면은 현재 E36와 실제 계약 조건만 보여준다. 보관은 native allowlist; M6 선수 복사/지도자/계정 라이브러리는 범위 밖.
- [x] 집중 회귀/HTTP 소유권·CAS·재실행·잘못된 선택/나이/phase 검증, 타입/lint/API build, 독립 리뷰.
- [x] 문서/evidence·V: 문서 동기화·커밋/푸시. 전체 check는 뒤에 모아1회, 미수집 이전 결과를 PASS로 쓰지 않는다.
