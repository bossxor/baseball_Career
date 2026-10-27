# M2/M3 병행 구현 연동 주의 — 2026-10-26

M2 엔진은 이 환경에서 계속 구현하고 다른 환경은 별도 브랜치에서 M3(인증/Neon 저장/기기 간 재개)를 진행한다. packages/engine·M2 증거를 다른 환경에서 직접 수정하지 않고 공용 package.json/lock·설정 변경은 독립 커밋으로 분리한다. 현재 엔진 변경을 임의로 덮어쓰거나 미검증 원장/숨김 P를 클라이언트에 공개하지 않는다.

## 현재 공개 함수/저장 경계

- 학교 커리어는 기존 학교 revision guard를 사용한다. KBO 루트는 v1~7이며 world 내부 schemaVersion과 루트 버전을 혼동하지 않는다. KBO에는 assertKboCareerRevision을 사용하며 학교 전용 v1 guard로 대체하지 않는다.
- offerKboRenewal은 정상 원구단 제안을 유지한다. 원구단 다음 해 예산이 부족하면 offseasonExit.OPEN을 반환하며 renewal이 있다고 가정하지 않는다. compareKboOffseasonOffers는 같은 비교를 재조회하고 kboOffseasonOffersView가 S08 공개 허용목록을 제공한다.
- acceptKboOffseasonOffer(state,expectedRevision,{eventKey,eventVersion,offerKey})는 이번 시즌의 돈/소속을 변경하지 않고 다음 해 선택을 확정한다. 실제 계약/권리/구단 변경은 startNextKboSeason에서 원자적으로 적용된다. 유효한 제안이 없으면 emptyReason을 표시하고 연도 진행을 막는다.1군 보장은 없다.
- 서버 원본에는 NPC/내 선수의 실제 P·RNG·내부 정산 근거가 있다. DB의 서버 전용 상태와 클라이언트 응답 DTO를 분리하고 엔진의 공개 view만 응답한다. 정상 저장 명령은 클라이언트가 바꾼 전체 상태를 신뢰하는 업로드 API로 만들지 않는다. 외부 백업 복원은 별도 검증 계약을 따른다.
- 같은 원본으로 엔진을 다시 계산하면 같은 결과가 나오지만 DB commandId/receipt/원본 revision의 중복 처리·트랜잭션은 M3 책임이다. 응답 유실 재요청이 수입/성장/연도 전환을 다시 적용하지 않아야 한다.

미국 활성화 startSignedUsCareer/closeSchoolSeasonForUs/usCareerEntryView를M2-DG에서 반영했고 전체637/637 검증을 통과했다. UsCareer는mode=US_CAREER/schemaVersion=1인 독립 루트다. KBO 루트와 혼용하지 않는다. 실제 미국 시즌 경기/진행은 아직 연결하지 않았다. 검증 완료 기록을 확인한 뒤 연동한다. M3가 먼저 완성되어도 실제 UI/전체 M2/기기 간 통합 검증의 완료를 뜻하지 않는다.

## 현재 체크아웃 분리

M2: C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-m2 · codex/m2-career-engine · 기준337911e. 기존 baseball-career-repo의 다른 창 웹 UI 변경은 보존했다. 엔진 마일스톤은 이 별도 브랜치에서 검사/커밋하며 공유 main 갱신 전에 origin/main과 충돌을 확인한다. 공용 파일/V: 동기화는 변경 파일별 원본 해시를 비교하고 다른 작업의 수정은 덮어쓰지 않는다.
