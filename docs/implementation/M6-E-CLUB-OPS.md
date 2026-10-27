# M6-E — 재정 재건·재계약/방출/트레이드·불펜·승강 뉴스

2026-10-26. 인계 순서 1~4를 한 묶음으로 구현하고 집중 테스트 한 번 뒤 전체 검사를 한 번 돌렸다. 새 확률은 없다. 브랜치 `m6/club-mode`.

- **재정 재건(08)** (`applyKboFinanceRebuild`): 방출 보장액+최소 로스터 보호액이 연간 기본 예산(120억)을 넘으면, 보장은 그대로 두고 그 시즌에만 `world.finance.grants`에 `FINANCE_REBUILD`를 남긴다. 구단 `budgetWon`은 영구히 올리지 않는다(다음 해로 새지 않음). 사용자/AI 구단 동일. 같은 시즌 재호출은 더하지 않는다. `kboSalaryRise`는 급여·보장·가용을 읽기만 한다(새 상한 없음). 통제 5시즌의 급여 상승 자체는 이 구제 조건(보장+보호>기본예산)이 아니면 예산을 늘리지 않는다.
- **재계약·방출·트레이드** (`planKboClubRoster`): 시즌 마감 뒤 내 구단 선수별 `RENEW`/`RELEASE`/`TRADE`. 적지 않은 만료 계약은 기존 AI 재계약. `RENEW`는 08 재계약 연봉(불가하면 `CLUB_RENEWAL_UNAFFORDABLE`, 시즌 전환 전체 취소). `RELEASE`는 당해 이후 남은 보장 연봉 100%를 보장 원장에 남기고 FA(`RELEASED`)로 보낸다. 트레이드는 새 확률 없이(D) 상대 구단의 기존 역할 공백 needScore 100일 때만 수락하고, 아니면 `CLUB_TRADE_REFUSED`. 계약은 선수와 함께 움직인다. 만료 예정 선수의 트레이드는 `CLUB_TRADE_EXPIRING`.
- **불펜(05 CP1/SU2/MR4/LR1)** (`setKboClubBullpen`/`autoClubBullpen`): 1군 구원 8명. 자동 배정(D)은 등록 CP를 CP 슬롯에 두고 나머지는 기존 roleScore·ID. 부상 CP는 저장을 허용하고 경기 전 `BULLPEN_INVALID`로 멈춘다(조용히 교체하지 않음). 슬롯이 있을 때만 구원 순서가 CP/SU/MR/LR이고, 없으면 기존 SP/RP/CP 순서라 골든 해시를 바꾸지 않는다.
- **승강·뉴스(05)**: 내 구단 1군 부상은 기존처럼 멈추고, 같은 포지션의 건강한 2군 선수를 `recommendClubCallup`(01/08 점수)으로만 추천한다. 로스터 35~60 이탈은 `ROSTER_BLOCKED`, 이번 시즌을 덮지 않는 계약은 `CONTRACT_EXPIRED`. 타 구단 부상/회복은 `notices`에만 남긴다.

## 검증

kbo-club-ops 3/3(재건 보조금·보장 유지·예산 불변·재적용 0, 재계약 유지·방출 보장·트레이드 거절, 불펜 8슬롯·CP 부상·콜업 추천·계약 시즌 불일치 정지). 전체 `npm run check` 단일 실행 661개 중 통과659·실패0·건너뜀2(기존)·취소0(2154.2초) + 웹 19/19, lint/타입/build/골든/이벤트/설계10종 통과. [전체 검사](evidence/M6-E-check.log).

## 미완료

구단 모드 저장/API/화면(S12~S19), 12개 장기 시뮬레이션과 균형 판정, 구단 모드 병역·국제대회·AI 전략 라벨.
