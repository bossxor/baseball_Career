# M2-CE — 내 선수 상무 지원(S26/S27)과 병역 상태 전이

2026-10-22. 21의 상태표 중 상무 경로(UNRESOLVED → APPLICATION_PENDING → SERVING_SPORTS → COMPLETED)를 내 프로 커리어에 연결했다. 현역(ACTIVE)·국가대표(ATHLETE) 경로는 아직 없다.

- **상태/조회**: `career.military`(status·applications·program). `kboMilitaryPlan`이 S26용 현재 상태·나이·지원 가능(19~27)·마지막 유예(27)·다음 시즌 전 필수 결정(다음 나이 ≥28)·최근 지원·프로그램을 읽는다. 기록이 없으면 UNRESOLVED.
- **`applyToSangmu`**(시즌 마감 뒤 오프시즌, 건강, 열린 사건은 E30만 허용): 같은 선발 스냅샷(`selectSangmuCohort`, NPC와 경쟁·구단 상한 포함)으로 합격 여부와 점수를 지금 고정한다. 같은 모집의 재호출은 같은 지원을 그대로 돌려준다(MIL03). 합격 조회와 입대 확정은 분리돼 상태는 APPLICATION_PENDING이며, 같은 결과에서 **BLOCKING E50(상무 선발 발표)**을 연다(`application.eventKey`). `resolveSangmuApplication`이 `CONFIRM_MILITARY_RESULT` 도메인 커밋으로 E50을 닫는다(입대·거절 확인·사양 모두). 열려 있는 동안 연도 전환은 `OPEN_EVENT`로 막힌다. 병역이 계약보다 먼저라는 순서(21) 때문에 재계약 제안(E30)은 열린 E50과 함께 낼 수 있게 했다.
- **`resolveSangmuApplication`**: 합격이면 ENLIST(입대)/DECLINE, 탈락이면 ACK_REJECTION만 허용(그 외는 `INVALID_MILITARY_COMMAND`). DECLINE·탈락 확인은 UNRESOLVED로 돌아가며 그 모집에는 다시 지원할 수 없다. 입대는 계약 문제가 정리돼 남은 계약일이 있어야 한다(없으면 `CONTRACT_DECISION_REQUIRED`).
- **복무 모델(대여 방식, 구현 기본값 D)**: 내 선수는 `world.players`·원구단 로스터·권리에 그대로 두고 `sangmu.loaned`에 올려 FUTURES 투영에서만 원구단 명단을 빠져 상무 명단에 들어간다. 입대 시즌 명단 확정은 대여 선수를 1군 후보에서 빼고(등록 = FUTURES), 콜업 검토는 건너뛴다. 상무 선발은 같은 모집에서 내 몫 1자리를 예약한다(`reserved`). 복무 중 성장은 퓨처스 출장 기준 일반 정산이며 21의 `연간기본×복무 비율×퓨처스 계수`와 계약 정지/원구단 연봉 0(MIL06)은 아직 적용하지 않는다.
- **연도 전환**: 연도 전환 준비에 `MILITARY_RESULT_PENDING`(지원 결과 미확인)·`MILITARY_PLAN_REQUIRED`(다음 나이 28 이상 미해결, 병역 기록이 있는 커리어에만 — 현역 경로가 없어 기록이 없는 커리어를 막지 않는다) 차단을 추가했다. 전환 때 복무 블록이 시즌 마지막 날로 완료 기록되고(둘째 블록도 시즌 말에 닫는 ponytail 한계는 M2-CD와 같음) 두 블록을 마치면 COMPLETED가 되어 대여가 끝난다. 상무 인원이 합법 라인업(야수 9·선발 1)을 못 채우면 일정 확정이 `SANGMU_TEAM_NOT_FIELDABLE`로 거절한다.

## 검증

kbo-military-state 2/2(지원 고정·재호출 동일·잘못된 명령·거절 확인/거절 후 재지원 불가·28세 지원 거절·연도 전환 차단, 능력 최상 내 선수의 합격→계약 미정리 입대 거절→입대→다음 시즌 상무 선발 내 슬롯 예약→개막 명단이 FUTURES·1군 제외→11팀 일정→상무로 실제 출장→두 번째 블록 완료로 COMPLETED·대여 해제). 전체 `npm run check` 단일 실행 474/474 통과·실패 0(971297 ms). [전체 검사](evidence/M2-CE-check.log).

## 미완료

사건 E49·E51~E55 발행(E50만 구현), 현역(ACTIVE) 복무와 6경기 .95 배수, 국가대표 자격(ATHLETE_ELIGIBLE/SERVICE)·메달 전이, 계약 정지·일일 지급 원장·구단 예산, 복무 성장 계수·서비스 연차 0, 복귀 후 원구단 슬롯/무계약 분기, 반년 복귀, 상무 부상/긴급 등록(대여 선수는 상무 경기에서 부상하지 않음), S26/S27 화면 데이터 API.

## E50 추가 검증 (M2-CF)

지원 결과 BLOCKING E50 추가 후 전체 `npm run check` 단일 실행 474/474 통과·실패 0(1149925 ms). [전체 검사](evidence/M2-CF-check.log).
