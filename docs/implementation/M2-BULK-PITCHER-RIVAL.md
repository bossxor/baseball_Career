# M2 bulk — 실제 맞대결 뒤 투수 숙적 추가

2026-10-28 후속 사용자 확정: 기존 같은 종류 라이벌은 보존하고 타자에게 투수 숙적을 추가한다. 실제 맞대결 후 관계 사건으로 형성하며 한 세계 시즌에 최대 1명, 과거 관계는 유지한다. 형성 경기 자체는 T14 관계 WIN으로 재사용하지 않는다. 이 후속 확정이 이전 107의 자동 형성 D 세부안보다 우선한다.

## 구현과 선정 D

`pitcher-rival.ts`의 `formPitcherRivalFromGame(source,gameKey)`는 실제 커밋된 REGULAR contribution에서 내 타자와 현재 실제 투수의 직접 matchup만 검사한다. 기존 `directDuelOutcome`의 WIN/LOSS가 나온 상대만 후보이며 새 확률·수치 문턱은 없다. 이미 관계가 있는 상대는 제외한다. 후보 없음/이미 해당 연도 슬롯 사용/타자 아님/정규 아님이면 null이다.

동시 후보는 해당 경기 직접대결 PA 내림차순 → pitcher simulationKey 오름차순으로 정한다. 이는 추가 RNG 없이 재개/입력 순서에 독립적인 최소 구현 선정안 D이며 사용자가 개별 확정한 새 수치로 표기하지 않는다.

`RelationshipLedger.pitcherRivalFormations`는 optional이다. 슬롯 키는 worldKey+seasonKey+primaryPlayerKey 전체에 1개로, 대회/승격/이적별로 다시 받지 않는다. 기존 same-kind RIVAL/TEAMMATE를 지우지 않으며 관계 type도 RIVAL을 재사용한다. formation receipt는 원래 경기/scope/record revision/PA/H/TB/outcome 및 실제 actor/등록 식별자를 보존한다. `validatePitcherRivalFormations`는 세계/주인공/시즌 슬롯/관계 pair/형성 milestone/실제 contribution 출처를 검증한다. 정정으로 과거 관계를 삭제하거나 원래 형성 결과를 재추정하지 않는다.

## 실제 마감과 E94

마감 호출 순서는 FINAL contribution 저장 → `settleRelationshipDirectDuels`(이미 있던 관계만) → `formPitcherRivalFromGame` → 일마감 `refreshCareerTraits`다. 형성 결과가 있으면 `{relationships,relationNotices}`만 원자적으로 반영한다. world/records/seed/phase/revision은 형성 함수가 수정하지 않는다.

신규 관계의 FORMATION milestone과 E94 creationReceiptId는 `pitcherRivalFormationKey(receipt)`를 공유한다. E94는 기존 비차단 relationNotices outbox에 들어가며 새 사건 ID나 강제 정지를 만들지 않는다. 기존 일반 E94 reader는 이 receipt 출처도 검증하도록 연결할 수 있다.

공통 명시 API는 `unreadPitcherRivalNotices`, `preparePitcherRivalNoticeRead`, `resolvePitcherRivalNotice`다. 공개 projection은 이름/관계/사건 식별자와 읽기 정보만 내보낸다. OPEN_RELATIONS는 실제 E94를 검증하고 읽음 상태와 revision만 바꾸며 S42 이동 정보를 반환한다. records/world/관계/진행 단계/RNG/특성은 바꾸지 않는다. 연말 원장 seal을 가진 루트는 prepare API를 사용해 기존 루트별 seal 검증/갱신을 적용해야 한다.

과거 투수 숙적의 다음 시즌 재대결은 formation receipt의 seasonKey로 앞선 시즌 형성을 확인한다. 서로 다른 시즌의 day 숫자를 직접 비교해 초반 재대결을 누락하지 않는다. 원래 형성 경기 자체/같은 날은 직접대결 WIN receipt에서 제외된다.

## 검증 한계

테스트 작성: 기존 관계 보존·E94 출처·형성 경기 제외·동일마감/JSON 중복 방지·입력 불변·세계시즌 전체 1명·다음 시즌 관계 보존/재대결·정규/판정 없음 제외·주인공/receipt/notice 변조 거절·PA/ID 안정 선정·프로 top-level 주인공/등록·OPEN_RELATIONS 읽기 불변.

요청에 따라 테스트/런타임/전체 check/Git/V는 실행하지 않았다. 실제 커리어 자동 진행 결과를 실행 확인했다고 주장하지 않는다. 직접대결/T14의 전용 정정 receipt writer와 프로 E84 연결은 별도 후속이다.
