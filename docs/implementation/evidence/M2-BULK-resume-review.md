# 별도 읽기 전용 리뷰 — 2026-10-28

범위:271900f..e26271b의 BULK source와 재개 수정. 리뷰어 bulk_resume_review는 checkout을 수정하지 않고 실제 엔진/통제 fixture로 아래4건을 재현했다.

1. 낮은 국내 authority revision으로 복귀하면 과거 목표 revision보다 목적 KBO revision이 작아 INVALID_GOAL_LEDGER/NOTICES. 목적 revision=max(US,authority)+1로 수정하고 CAS 원본은 보존한다.
2. accepted US archive의 E90을 실제 resolver로 읽으면 고정 소유권 영수증을 현 revision에 묶어 INVALID_US_KBO_RETURN. archive commit 인접성/상한 검증으로 수정한다.
3. 일반 E94/목표 E90 읽기가 학교 year-end seal을 무효화. 일반 E94에 wrapper guard, 목표 읽기에 검증 후 재봉인. US 전용 기존 학교 관계 wrapper의 usYearEnd 처리 확장은 이번 범위 밖이다.
4. 무시하거나 직접 목표를 정한 E89가 개막 뒤 ACK 불가능. SET_GOALS만 현재 PRE 조건을 요구하고 과거 ACK는 현 phase를 유지한다.

새 회귀의 RED는 M2-BULK-review-red.log, M2-BULK-read-seals-red.log에 보존했다. 실행 결과는 최종 통합 로그를 따른다.

판단 제외: atomic persistence/transport·24경로/PF-D 전체·PS E84·US 국제 owner·M2 전체 완료. 이들은 명시된 잔여이며 완료로 처리하지 않는다. 리뷰어는 npm 전체/HTTP/DB/기기 검사를 실행하지 않았다.
