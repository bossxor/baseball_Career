표시·편집 최신 계약: [101 구종 상태 UI](101-REPERTOIRE-STATE-UI.md)의 사용자확정 비례 자동보정/최대잔여/pitchId 동률/하한10 재배분을 적용한다. 슬라이더는 로컬 초안이며 확정 전 실제 구성·기회·난수 변경은 없다.

최종 수치 정합: [90](90-NUMERIC-LEDGER-CONSISTENCY.md)의기본XP20/예약/배율후소비/실제숙련증가분리와정수잔여규칙을함께적용합니다. 실제cap잔여만으로지급하지않으며팀이동으로기본예산을초기화하지않습니다. 반값가져오기의1e-4단위반올림도90을따릅니다.

최신 v0.14: [85 난이도·구단 치트](85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md)가 상충하는 이전 규칙을 대체합니다. 구단 치트는 내 구단 전체의 잠재력100·양의 자연성장/구종XP3배를 적용하며 이후 영입·보관 투입 포함입니다. 일반 구단과 원본 기록에는 소급하지 않습니다.

# 57. 구종·숙련·성향 상세 계약

48구종7종/성향4종과[65](65-USER-TRAITS-XP-STAFF.md)의개인치트구종3배적용. 공통API/단위/오류는[64](64-EXPANSION-COMMON-CONTRACT.md). XP는1e-4단위정수,표시등급은누적[0,10,30,60,100,150]이하최대index다.

## 구성과 대표 구종

pitchBook은배운이력최대7종,활성+학습slot은최대4. 시작P01등급2/XP30+사용자보조1종등급1/XP10. 활성2~4종/각weight정수10~90/합100,학습0등급은weight0/active=false. 미사용이력은숙련유지,복귀는구성창에서만. 비율은정렬pitchId순누적구간,PRNG u∈[0,1),경계u=.60은60%구간다음구종. 매실제타석대표구종1회pitchPlan스트림소비. 고의사구없는엔진이므로정상PA모두대상,취소/오류rollback은rng복원. 조회·중계·hover미소비.

타자성향벡터는해당타자의타석마다동일,타구방향통계아님. 투수구종벡터×등급/5→타자성향→56보유특성합산cap→softmax. 등급은타석시작snapshot,타석결과로XP문턱넘어도다음타석부터새등급. 결과PA내구종별실제구수통계생성금지.

## 성장 예산과 학습 정산

baseSeasonCap=20,배수m=개인커리어SECRET_CHEAT주인공3/그외1,actualCap=20m. 연간원장은baseGranted/baseReserved/actualGranted,baseGranted+baseReserved≤20. 새구종선택시baseReserved10,기존실전은남은base10내획득,학습없으면실전base20까지. 세계시즌1원장이라고교→프로/상무/미국이동중복없음.

실전candidateBase=min(.06,그타석투수기록outs×.02). 대표구종에min(candidateBase,20-baseGranted-baseReserved)×mXP. 주루아웃도해당투수outs라후속타석아웃과이중기록하지않음. 학습은등록리그정규일정진행률25/50/75/100%에각base2.5reserved해제,해당분기건강·훈련가능등록일/분기전체등록일비율을곱한값만grant. 일반현역0,상무는등록훈련가능일. 분모0이면grant0. 미지급예약잔여는그분기마감때해제,다음실전기회만재사용가능,과거실전소급지급없음.

각entry.actualDelta=min(baseDelta×m,150-currentXp),상한으로버려진actualXP도base예산소비로기록,다른구종에부활안함. 실제cap60/20검사. 예치트건강학습4회각7.5XP→총30/등급2,실전최대30추가가능. 일반학습총10/등급1. 부상분기절반이면일반1.25/치트3.75. 소수반올림잔여는1e-4정밀도세계원장에보존,자연능력성장원장과혼합안함.

## 변경·AI·가져오기

프리시즌/정규절반각창1회구성변경,학습계획은PRE만1회. 성향변경은별도동일창1회,같은내용NO_CHANGE기회0. 새학습취소는확정전만,확정후기존진척은book에남고시즌재선택없음. 4슬롯가득이면미리선택한비활성화대상확인,활성2종미달구성거절. 복무로놓친MID는복귀시1회/시즌넘기면소멸.

AI투수는등급높음→구종ID순상위최대4활성,2종보다적으면생성/호환오류이지무료능력생성안함. 2종60/40,3종50/30/20,4종40/30/20/10. 새학습은보유구종누적XP합이50이상이고slot여유있을때미보유최소ID1종,아니면기존숙련집중. AI타자성향은생성된preferenceApproach를유지,매타석상대에맞춰무료변경안함. 개인성향·AI모두같은효과.

복사원본이력모든종류보존,등급≥1은max(1,floor(등급/2)),XP는그등급최소값;원본학습등급0은0. 활성구성은원본중숙련유효2~4와원래비율,학습0이활성에있었다면불일치로미리보기보류. 새세계성장예산0소비에서시작,개인치트출처를구단에승계하지않음.

## 데이터·API

| 엔티티 | 필드·제약 |
|---|---|
|pitch_books|saveId/playerId/pitchId UNIQUE,xpUnits0~1500000,mastery파생 |
|pitch_loadouts|playerId PK,slotPitchIds≤4,activeWeights JSON,windowId,changesUsed0/1,rowRevision |
|pitch_training_plans|playerId/seasonId UNIQUE,pitchId,quarterPaidMask0~15,baseReservedUnits |
|pitch_xp_entries|playerId/sourceEvidenceKey UNIQUE,baseUnits,actualUnits,multiplier,capLossUnits |
|batting_approaches|playerId PK,approachId enum,windowId,changesUsed,rowRevision |

GET expansion/repertoire?playerId →{kind,book,loadout,training,seasonBudget:{baseCap:20,multiplier,actualCap,spent,reserved},allowedActions}. SET_REPERTOIRE={playerId,windowId,slots:[pitchId],weights:[{pitchId,percent}]};SET_PITCH_TRAINING={playerId,seasonId,pitchId,replaceSlotPitchId?};SET_BATTING_APPROACH={playerId,windowId,approachId}. preview는before/after/비율합/학습예상/예산. 합99는422 INVALID_ALLOCATION/weights,학습미허용은422 WINDOW_CLOSED,숙련0활성은422 NOT_ELIGIBLE. 성공receipt에는최종bookVersion/설정/기회사용만.

S39는종류별화면분리,학습XP와활성비율을같은숫자로표시하지않음. XP가P상한100인것처럼표현금지. fixture PIT-D01~08:경계.60/합99/등급0활성/치트학습30등급2/연간60cap/부상3.75/다중리그동일원장/복사등급5→2 XP30. 예산·PRNG·호환·응답유실실행검증은구현후.
최신 사용자확정U(2026-10-20): 활성4종에서 새 학습을 위해1종을 비활성화하면 PRE 구성 변경1회를 함께 사용한다. 슬롯 교체·학습 계획·예약을 원자 확정한다. 기회 소진 시 교체 불가. 빈 슬롯 학습은 별도 구성 변경을 소모하지 않는다.

## 2026-10-26 사용자 확정 — 다음 해 미완성 구종 재학습

부상 등으로 시즌말 숙련1 미만이어도4분기 정산·예약 해제가 끝났으면 연말/진로 전환 가능. 기존 구종 XP는 그대로 보존하고 학습 계획·연간 예약/소모 원장만 정상 연도 전환한다. 다음 PRE에서 같은 숙련0 구종을 다시 학습 대상으로 선택할 수 있다. 기존 XP를0으로 덮지 않으며 새 시즌 학습1회와 base10 예약을 사용한다. 숙련1 이상 구종의 새 구종 학습 재선택은 불가, 숙련0은 계속 비활성. 미완료 분기·미해제 예약의 무시나 과거 부상분 소급 지급은 없다.
