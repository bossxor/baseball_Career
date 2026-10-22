# M2-CB — 상무 복무 프로그램·정지 계약 원장 (순수, 미연결)

2026-10-22. 21의 복무 두 블록과 계약 정지 산식을 순수 함수로 먼저 고정했다. 세계·로스터·재정에는 연결하지 않았다(M2-CA와 같은 단계).

- `suspendKboContract(contract, remainingPaidGameDays)`: 입대 확정 시 남은 계약경기일수 스냅샷. 일급 = round(연봉/144), 재개 총액 = round(연봉×잔여일/144), 마지막 날에 반올림 잔여를 정산한다. 계약기간을 정수+1로 조정하지 않는다(잔여일 상한 = 계약연수×144). 예: 연봉 1억·잔여 72일 → 일급 694,444원, 총 5천만원, 마지막 날 50,000,000−694,444×71.
- `resumedContractPayment(s, resumedDays, days)`: 이미 재개한 일수 뒤 `days`일의 금액. 분할 지급 합이 총액과 정확히 같고 같은 일수 재계산은 같은 값이다(중복 지급 방지).
- `enlistInSangmu`: 선발 시즌 다음 시즌 전체 국내 정규기간(FULL_DOMESTIC_SEASON) + 그 다음 시즌 전반(FIRST_HALF_SEASON) 두 블록, 정지 계약과 원구단 보유 정보를 가진 SPORTS 프로그램. 팀경기를 복무시간으로 환산하지 않는다.
- `completeSangmuBlock`: 블록 완료 worldDay를 한 번 기록한다. 같은 날 재전송은 같은 결과, 다른 날은 `SERVICE_BLOCK_EVIDENCE_REUSED`, 순서 위반/이전 블록 이전 날짜는 `INVALID_SERVICE_BLOCK`. 두 번째 블록 완료 때 복귀 옵션 키가 생긴다(MIL04 일부).

## 검증

kbo-military-program 2/2(일급/마지막 날 정산/분할 합/범위 거절, 블록 순서·중복·불변), lint·타입·build·M1 골든. [집중 로그](evidence/M2-CB-focused.log).

## 미완료

선수 소속 이동(원구단 로스터/1군 제외·보유권 유지)·군팀 등록·월/일 원장·구단 예산 예약 분리, 복귀 슬롯(MIL10), 노쇠 복무 비율, 공통 연간 성장 원장 연동, 내 선수 지원/합격/입대 명령과 S26/S27, 11팀 일정 활성화.

## 전체 검사

M2-CA·CB 포함 트리 전체 `npm run check` 단일 실행 466/466 통과·실패 0(1002.7초). [전체 검사](evidence/M2-CB-check.log).
