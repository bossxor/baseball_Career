# M2-S 고교 실제 기록 기반 특성 해금 — 부분 완료

2026-10-20. [56](../design/56-TRAITS-DETAILED-CONTRACT.md)·[65](../design/65-USER-TRAITS-XP-STAFF.md)·[107](../design/107-RIVAL-HIDDEN-TRAIT-EDGE-RULES.md)의 기록 해금 규칙을 고교 커리어 일마감에 연결했다. 새 게임 규칙은 추가하지 않았다.

- `HighSchoolCareer.traits`(CareerTraitLedger)에 선수별 보유 특성과 해금 영수증(playerKey·traitId·worldDay·recordRevision)을 append-only로 저장한다. 새 커리어는 빈 원장으로 시작한다.
- 일마감 직후 그날까지 공식 기록이 있는 모든 선수(주인공·AI·임시 선수 동일 규칙)를 `evaluateTraitUnlocks`로 평가한다. 시즌 조건은 HS 정규 같은 시즌만, 커리어 조건은 공식 기록 전체 범위를 합산한다. 다른 리그·단계의 시즌 수치는 섞지 않는다.
- 같은 날 재처리와 이미 처리한 날짜는 변화가 없다. 기존 보유 특성은 기록 정정이나 노쇠로 박탈하지 않는다.
- 기록 원장의 `DOUBLE_BOOKED_PLAYER` 검사로 한 선수는 하루 한 경기만 뛰므로, 일마감 평가는 경기 확정 직후 평가와 같은 효과다. 해금은 이미 확정된 경기를 바꾸지 않고 다음 경기 snapshot부터 적용된다(`highSchoolGameContext`의 traits).
- T14 라이벌 대상은 관계 생성 전이라 빈 목록으로 둔다. T16(5시즌 연속 규정이닝)은 한 고교 시즌만 있어 연속 시즌 수를 0으로 둔다. 둘 다 근거를 꾸미지 않기 위한 처리이며 관계·다시즌 원장 연결 때 채운다.

검증: 집중4/4(근거 없음 0해금, BB30 경계에서 T02 1회 해금·영수증, 같은 날/이전 날 재처리0·입력 불변, 정정 후 보유 유지·투수 전용 특성 비해금, 다음 경기 문맥 반영과 진행 지속). 전체 199/199, lint·typecheck·build·M1 골든·사건 동기화·설계 정적10종 통과([전체 검사](evidence/M2-S-check.log)).

미완료: 라이벌 관계 evidence(T14)·다시즌 원장(T16)·특성 해금 알림 사건/도감 화면·공개 API 투영·DB transaction.
