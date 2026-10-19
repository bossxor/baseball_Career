# 90. 최종 수치 정합 — 구종 예산·정밀도·시즌 경계

2026-10-19 / 기술 기본안 D. [57 구종](57-REPERTOIRE-DETAILED-CONTRACT.md)과 [85 난이도](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)의 중복 예산 해석을 닫는다. 사용자 요구인 성장3배·능력상한100·시즌 기회 제한·이적 후 이어하기는 유지한다. 실제 저장 원장이 존재하지 않는 설계 단계이므로 운영 데이터 마이그레이션이 아니다.

## 발견한 충돌과 최종 의미

57의 baseGranted/baseReserved20과85의 실제 XP active cap20/24/60은 서로 다른 제약이다. 실제 cap 잔여만으로 XP를 지급하거나 팀을 바꿀 때 base 예산을 새로 주면 중복 성장한다. 또 구종별150상한에 잘린 양을 미소비로 취급하면 다른 구종으로 예산이 재생성된다. 다음 세 수치를 분리한다.

| 필드 | 의미 |
|---|---|
| baseSpentUnits | 세계시즌에 소비한 기본 XP 예산. 기존 baseGranted는 이 소비 의미로 통일 |
| baseReservedUnits | 새 구종 학습에 예약한 기본 예산,소비 아님 |
| actualBudgetSpentUnits | 당시 배율을 적용해 소비한 실제 XP 예산. 구종150상한 손실도 포함 |
| actualBookGrantedUnits | 실제 pitch book에 들어간 XP 누적. 예산 손실과 구분 |
| scalingRemainder | 배율 계산에서 아직 미반영된1e-4미만 잔여,분모5의0~4 정수 |

키는 (saveId,playerSimulationKey,worldSeasonId). 투수1명의 모든 구종이 같은 시즌 예산을 공유한다. 이적/승강/복무복귀/재영입/백업복원으로 초기화하지 않는다. 새 세계의19세 보관 복사본은 새로운 선수/원장으로 시작하고 원본을 수정하지 않는다.

## 배율과 두 상한

baseCapUnits=200000 (20 XP). 기본 m=1,n=5;치트 수혜 시 m=3,n=15;커리어 하드 NPC m=1.2,n=6. 공통 분모d=5로 계산하며 서로 곱하지 않는다. activeActualCapUnits는 각각200000/600000/240000. 커리어 주인공·NPC·구단 소속 수혜 조건은85를 따른다.

일반 실전의 기본 가용 B=200000−baseSpentUnits−baseReservedUnits. 학습 분기는 해당 분기의 예약분을 먼저 해제한 뒤57의 건강/등록 가능 비율에 따른 candidateBaseUnits를 계산한다. 같은 분기의 evidence는0지급이어도 완료 처리한다. 미지급 과거 분기를 새 팀에서 소급 지급하지 않는다.

실제 잔여 R=max(0,activeActualCapUnits−actualBudgetSpentUnits). R=0 또는 B=0이면 지급0,base 추가 소비0. 그 외에는 다음 최대 기본 소비량을 사용한다. 수치는 정수이며 부동소수점 반올림으로 예산을 넘기지 않는다.

```text
b = min(candidateBaseUnits, B, floor((5*R + 4 - scalingRemainder)/n))
scaledNumerator = n*b + scalingRemainder
budgetDebitUnits = floor(scaledNumerator/5)
nextRemainder = scaledNumerator mod 5
bookGainUnits = min(budgetDebitUnits, 1500000-currentPitchXpUnits)
capLossUnits = budgetDebitUnits-bookGainUnits
```

b=0이면 원장을 소비하지 않고 잔여도 유지한다. 유효 지급은 baseSpent+=b,actualBudgetSpent+=budgetDebit,actualBookGranted+=bookGain,구종XP+=bookGain. 손실은 capLoss로 남기며 기본 예산과 실제 예산으로 환급하지 않는다. 모든 entry는 sourceEvidenceKey+정책 버전에 고정하고 final game/분기 정산의 멱등 원장에서 한 번만 적용한다.

실전 배율은 해당 타석 확정 source의 정책,분기 학습은 해당 분기 정산 source의 정책으로 고정한다. 분기 건강/등록일 비율은57대로 유지한다. 읽기 요청이나 나중의 이적이 이미 지급한 XP를 다시 계산하지 않는다. 자연6능력의 기간별 성장은42/85의 별도 원장이며 이 XP 원장에 섞지 않는다.

## 경계 예시

| 상황 | 최종 결과 |
|---|---|
| 시즌 내내 일반,기본20소비 | 실제20소비. 기본 예산0 |
| 시즌 내내 치트,기본20소비 | 실제60소비. 구종별150상한 손실도 예산 소비 |
| 일반에서 기본10/실제10소비 후 치트 | 기본잔여10,실제 cap잔여50. 추가 최대30,시즌 합계40. 50추가가 아님 |
| 치트에서 기본10/실제30소비 후 일반 | 실제잔여0,추가 지급0. 기존 XP30회수 안 함 |
| 위 선수가 같은 시즌 치트 재영입 | 기본잔여10/실제잔여30,추가 최대30. 새60지급 아님 |
| 기본20을 일반에서 모두 쓴 뒤 치트 입단 | 실제 cap잔여40이어도 기본잔여0,추가0 |
| XP149인 구종에 치트 기본1 | 예산실제3소비/구종+1/손실2. 다른 구종 환급0 |
| 학습 기본10예약,일반 실전 | 기본 가용10,학습 예약을 실전이 사용하지 않음 |
| 하드 NPC 기본0.0001×5회 | 6/5잔여를 누적해 실제합0.0006. 매회 반올림 지급으로 예산 부풀림 없음 |

85의 '실제 cap의 남은30'은 최대 예산이며 기본 가용·구종 상한·현재 합법 source를 모두 통과해야 한다. UI seasonBudget.spent는 actualBudgetSpent,bookGained는 실제 지급,baseRemaining/reserved/activeActualCap을 별도로 반환한다. cap20으로 돌아왔는데 과거 spent30이라고 오류·음수 잔여·되돌리기를 하지 않는다.

## 반값 가져오기와 표시 정밀도

능력과XP의 저장 단위는64의1e-4 정수,원본 최고값 반감만 중간1/2 단위가 생길 수 있다. D: 양수 반올림 half-up을 한 번 적용해 importAbilityUnits=max(10000,floor((sourcePeakUnits+1)/2)). 최대 절대 오차는0.00005점이다. 예91.2501→45.6251. 일반적인 정수·소수1자리 최고값은 정확히 절반이다. floor로 모든 능력을 불필요하게 깎거나 생성 미리보기와 실제 반올림을 다르게 하지 않는다.

원본 최고값은 그대로 보존하고 복사본에만 이 정밀도 규칙을 적용한다. 종합은 저장된6능력 합/6의 유리값을 기준으로 소수1자리 half-up 표시,미리 반올림한 각 표시값의 평균을 쓰지 않는다. 6개100은100.0. 역할 점수·피로·일시 보정은 평균에서 제외한다. 강화 효과는75의 정확한 원장 단위로 표시한다.

## 완료 기준

baseSpent+baseReserved≤20,새 entry의 actualBudgetSpent 증분이 active cap을 넘기지 않음,bookGain+capLoss=budgetDebit,구종별XP≤150,같은 evidence재실행 효과0. 이적 때문에 과거 spent가 현재 cap을 넘는 상태는 허용하되 새 지급은0이다. 정적 검증기는 위 예시 산술만 확인하며 실제 경기/분기/DB/복원 실행 검증은 미실행이다.