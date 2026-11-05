# 은퇴 취소 뒤 재요청 사건 충돌 수정

RED로 KBO/US의 E36 evidence가 매 요청 동일해 eventKey가 재사용됨을 확인했다. 재요청 resolve가 과거 RESOLVED 사건을 먼저 찾는 원인이다.

- [x] 실제 native 요청→취소→재요청 API RED 재현.
- [ ] E36 신규 확인 ID에 요청 sourceRevision을 결합. E37/E69 영구 보관 receipt는 유지하고 기존 plain receipt 형식의 대기 E36도 수락한다.
- [ ] 반복/과거결정 보존/legacy/저장·JSON/CAS·MajorE66 은퇴 회귀와 types/lint/build·독립 리뷰.
- [ ] 문서/증거·커밋/푸시. 게임 규칙/은퇴나이/지급/신원 변경 없음.
