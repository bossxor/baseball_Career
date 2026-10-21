# M2-BK — 내 프로 선수 은퇴(수동 E36·45세 최종)와 보관

2026-10-21. 01 §6·04 E36/E37·15 보관 규칙을 프로 커리어에 연결했다. 새 수치 없음.

- `requestKboRetirement`: 프로 시즌 연말 마감 뒤 SEASON_REVIEW(오프시즌)에서 수동 은퇴를 요청하면 BLOCKING E36(떠날 시기를 고르다)을 열고 `RETIRE_CONFIRM`으로 간다. E30 재계약 제안이 열려 있어도 가능하다(E30의 REQUEST_RETIRE→S09 경로).
- `resolveKboRetirement`: CANCEL_RETIRE는 E36만 닫고 리뷰로 돌아간다(E30은 그대로 열림). CONFIRM_RETIRE는 E36과 열린 E30을 도메인 커밋으로 닫고, 같은 결과에서 은퇴 영수증(`retirement`: 사유·시즌·나이·구단·남은 개인 계약 연수)과 E37(마지막 인사, OPEN_ARCHIVE)을 남기고 `ARCHIVED`가 된다. 계약 중 은퇴는 남은 개인 계약을 종료하며, 경고 표시는 S09 몫이다.
- `retireKboAtMaxAge`: 45세 시즌을 마친 뒤(72 Y01 MAX_AGE_REACHED) 다른 차단이 없으면 강제로 같은 보관 결과(사유 MAX_AGE)를 만든다. 45세에는 재계약 제안을 만들지 않는다.
- 관계 알림 입력 타입이 모든 커리어 phase를 받도록 넓혔다(동작 변화 없음).

## 검증

kbo-postseason-progress 신규 1개(마감 전/45세 아님 강제 은퇴 거절, E30 열린 상태에서 E36 요청→취소 시 E30 유지→확정 시 전부 닫힘·E37·ARCHIVED·나이/사유, 은퇴 후 다음 시즌 거절, 45세 재계약 거절·MAX_AGE 보관). 전체 `npm run check` 단일 실행 411/411 통과·실패 0(1166.3초, M2-BJ 포함). [전체 검사](evidence/M2-BK-check.log).

## 미완료

35세 이상 2시즌 연속 1군 50타석/20이닝 미달 강제 은퇴 검토·재도전 이벤트, E30 거절(프로 재도전 3회), 은퇴 페이지·기록실(15)·가져오기, 구단 보장액 처리.
