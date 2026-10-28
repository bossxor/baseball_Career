## 부모 통합 갱신 — 2026-10-28

이후 사용자 확정으로 시즌당1명 투수숙적 형성과 E94를 추가했다. 학교/KBO/US 정규 FINAL에 duel→formation writer를 연결했고, generic E94 reader도 새 출처를 검증한다. 프로 정규E84도 별도 모듈로 연결했다. 아래의 신규형성/E84 미연결 문구는 이 문서 초기 slice 한계다. 최신 범위/잔여/런타임 대기는 [현재 체크포인트](M2-BULK-CHECKPOINT.md)를 우선한다.

# M2 bulk — T14 실제 직접대결 원장과 해금 reader

107의 기존 직접대결 계약을 구현했다. 새 수치/확률/승리 규칙/최상위 사건은 만들지 않았다. 테스트는 작성만 했으며 실행하지 않았다.

## 구현 범위

- relationships.ts: 선택 저장 필드 RelationshipLedger.directDuels와 DirectDuelReceipt를 추가했다. 기존 저장본의 원장 없음은 정상이다. 유일키는 (relationKey,gameKey,DIRECT_DUEL_RESOLVED)이며 실제 관계 pair, 타자/투수, 경기/시즌/대회/phase, 기록 revision, PA/H/TB/outcome을 저장한다. gameKey는 기존 FINAL contribution의 식별자다. 기존 원장에 별도 경기 receipt ID가 없으므로 허구의 receipt ID를 만들지 않았다.
- settleRelationshipDirectDuels(source,gameKey): 지정한 공식 contribution 1개만 검사하고, 그 경기일 전에 이미 형성된 실제 cross-kind RIVAL에 한해 directDuelOutcome으로 WIN/LOSS/NO_DECISION을 저장한다. 형성 당일/이전 경기, same-kind/TEAMMATE/직접 matchup 없음은 저장하지 않는다. 원본 불변이며 동일 경기 재마감/JSON 재개는 중복 receipt를 만들지 않는다. 관계가 없으면 undefined를 반환한다.
- validateDirectDuelReceipts(source): 유일키/관계 pair/형성일/실제 경기 scope/기록 revision 범위/카운트와 outcome을 검증한다. malformed receipt는 거절한다. source 게임 기록과의 현재 PA/H/TB 일치 여부는 directDuelMatchesRecords가 읽는다.
- high-school-traits.ts: 기존 TraitSource에 실제 관계 원장 읽기만 추가했다. 동일 타자/라이벌 투수/시즌/대회 REGULAR의 현재 기록과 일치하는 확정 WIN이 있어야 기존 qualifiesRivalSeason에 시즌 전체 matchup 원기록을 넘긴다. 따라서 형성 전 같은 상대 기록은 포함하고 다른 시즌/대회/PS의 WIN은 합산하지 않는다. AB0/정확한 분수 OPS .900 판정은 기존 helper를 재사용한다.
- 이미 보유한 T14의 새 충족 투수는 owned 대상 집합에 추가하되 unlock receipt/E84는 다시 만들지 않는다. 과거 소유권·대상은 정정 뒤에도 삭제하지 않는다.

## 경기 마감 연결 계약

settleRelationshipDirectDuels의 source는 {world:{players},records,relationships?}이다. 각 실제 FINAL contribution이 기록된 직후 다음 순서로 호출한다.

1. 경기 FINAL 및 putGameContribution 반환 원장 교체.
2. const relations=settleRelationshipDirectDuels(career,gameKey); if(relations)career.relationships=relations;
3. 그 경기에 근거한 신규 관계 형성. 신규 형성 경기 자체는 WIN으로 재사용하지 않는다.
4. 그 날의 FINAL 기록이 모두 반영된 뒤 refreshCareerTraits.

호출 위치는 high-school-progress.ts(학교/대학 공용), kbo-progress.ts, us-season.ts의 실제 경기 마감이다. 프로 PS 마감에서 별도로 호출하더라도 receipt의 phase를 유지하므로 정규 T14 근거가 되지 않는다. 후속 사용자 확정에 따른 cross-kind RIVAL 신규 형성은 M2-BULK-PITCHER-RIVAL.md에 분리했다. 실제 cross-kind 관계가 없으면 T14는 해금되지 않는다.

## 정정 경계

현재 공식 contribution과 이전 receipt의 PA/H/TB가 달라지면 이전 receipt를 새 해금 근거에서 제외한다. 이미 보유한 T14/대상은 유지하며, 재마감은 기존 receipt를 추정한 결과로 교체하지 않는다. 따라서 정정 때문에 진행을 영구 오류로 막거나 과거 경기/RNG를 다시 만들지 않는다.

107의 전용 CORRECTED receipt(변경 전후/정정 ID) 작성 및 정정으로 새롭게 충족된 WIN 재평가는 이번에 새 API로 만들지 않았다. 정정 transaction의 실제 receipt 출처와 함께 후속 연결해야 한다. 현재 구현의 revision은 기존 RecordLedger.revision이며 별도 경기별 stat revision을 가정하지 않는다.

## E84 프로 연결 제안만

trait-notices.ts는 HighSchoolCareer를 받고 소유자는 world.protagonistKey, 등록은 world.protagonistSchoolId에서 읽는다. 프로 커리어는 최상위 protagonistKey를 사용한다. 프로의 실제 EVENT_DECISION/resume/해결 reducer와 등록 식별자를 확인한 뒤 공통 읽기 source에 식별자를 명시적으로 넘기는 최소 adapter가 필요하다. 캐스트로 연결하지 않았으며 최초 T14 해금 receipt만 알림 대상으로 삼아야 한다.

## 작성한 검증과 한계

direct-duel-traits.test.ts: 실제 contribution/split 근거, 최초 해금, 원본 불변, 동일마감/JSON 중복 방지, 형성일 이전/당일 제외, same-kind/TEAMMATE 제외, LOSS/NO_DECISION/PS/다른 시즌·대회 제외, receipt 변조·중복 거절, 정정 시 신규해금 배제와 기존 보유 유지, 두 번째 라이벌 대상 추가를 검증하도록 작성했다. high-school-traits.test.ts에는 승리 원장 없는 PA20/OPS .900만으로는 미해금인 회귀 조건을 추가했다. 통제 fixture의 writer/reader 계약 검증이며 프로 신규 라이벌 자동 형성의 실제 커리어 성공 검증은 아니다.

런타임, 전체 check, Git, V/M6, 경기 시뮬레이션은 실행하지 않았다. 원기록·확정 경기·seed를 수정하지 않으며 경기 결과를 소급 재계산하지 않는다. 후속 사용자 확정에 따른 cross-kind 형성은 M2-BULK-PITCHER-RIVAL.md에서 연결했다. 정정 receipt writer와 프로 E84는 미연결이다.
