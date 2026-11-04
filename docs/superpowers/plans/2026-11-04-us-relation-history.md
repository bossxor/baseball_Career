# 미국 관계 읽기·E94 연결 계획

기존 relationship-history / relation-notices projector와 native US root guard 재사용. 현재 미국 선수·레벨별 실제 명단, 저장된 amateurHistory/previousSeasons, minorYears/majorYears/military.service.supply의 실제 은퇴 신원만 read adapter에 넣는다. 저장에 없는 과거 KBO 신원은 native UNKNOWN_REFERENCE/UNAVAILABLE을 유지한다. 가상 신원/등록/경기 생성이나 schema migration 없음.

- [x] RED: 현재 US E94/관계 조회 API의 미지원 확인.
- [x] native us-relations adapter + E94 meta-only owner, 기존 API dispatch/read 연결. E95/E96 새 재회 writer/과거근거 생성은 범위 밖, 해당 처리 거부.
- [x] 현재/고교/은퇴/누락 신원·정확 scope·JSON재개·읽기 순수성·실제HTTP CAS/소유권/버전 검사.
- [x] 집중 회귀·types/lint/engine/API build·독립 리뷰·문서/evidence·V docs 복사·커밋/푸시.
