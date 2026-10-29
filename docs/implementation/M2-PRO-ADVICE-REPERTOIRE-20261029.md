# M2 프로 조언·구종/성향 사건 구현 인계

근거: 설계26/81/116/57/60/107. 일반 서사는 사용자 확정24팀경기마다35%, 자격후보 균등, 시즌최대3, 동일사건 이후2시즌 제외. 구종 E86/87/88은 일반추첨과 분리된 훈련창/확정등급 정책이다.

## 엔진 소유권

- `pro-career-advice.ts`: 별도 `career-advice-1` seed stream과 체크포인트 원장. E10 실제 첫콜업수락+후속20경기, E11 이전정산시즌의 소속팀 FUTURES 전경기 등록/KBO0, E12 출장비율, E14/15 실제공석·SP체력60/CP위기60, E16 BB9, E17 증명가능무안타, E18 장타부족, E19 최근2등판실점, E20 명시적사기값, E26 동포지션 경쟁점수. 후보를 실제 명단/건강으로 재검사한다.
- E10 코칭검토는 현보직의 현재 경쟁점수·순위 receipt다. 새확률/보너스/강제역할변경/출장보장이 없다. 에이전트의 추가검토수락추첨과 독립이다.
- E12 `START_POSITION_PLAN`은 등록포지션을 바꾸지 않는다. 시작경기 제외, 이후건강·등록된 공식정규24경기, 동일경기 중복0, 연도/팀/리그이동 보존, READY→최신version 확정/취소. 좌투불가자리 및 투타전환 제외. 기존자리100/다른자리0 적합도를 보존하며 확정으로100을 만들지 않는다.
- E14/15 요청은 실제 같은등록명단의 건강한RP 후보와 동일점수/피로/ID 기준으로 비교하며 가산점·성공확률이 없다. 실제포지션변경은 승리한 주인공에게만 적용된다.
- E19 휴식: 일반회전/에이전트검토 후 `prepareCareerAdviceGame`을 호출한다. 실제해당팀/리그/정규경기에서만 건강한 기존투수를 선택한다. 바뀌면 `restProof`를 pendingGame에 저장하고 FINAL 커밋 직후 `settleCareerAdviceRest`로1회정산한다. 대체0이면 원기용/미해결요청 보존. 입력context 불변, 변경0이면 동일참조.
- `repertoire-events.ts`: E86 선택은 기존 school/KBO/US 학습writer를 호출한다. E87은 확정 XP entry의 실제 등급통과 receipt별, E88은 PRE/MID 유효창별1회. `careerBattingApproaches`를 경기snapshot에 반영한다. 조회/확인으로 XP를 다시 지급하지 않는다.
- `pro-career-results.ts`: 실제health 진단 E21/22와 회복 E23, 프로리그별 실제100H/10W/20SV E24, 실제첫PS출장 E27, 실제우승+SEASON_REVIEW E28. E23은 이미끝난의료결과의 복귀확정 receipt이며 회복재추첨/능력복원/기용보장0이다. 다른부상은 별도 injuryId이고 시즌경계중증회복도 같은부상근거로 연결한다.

## 호출과 호환성

경기/health/XP FINAL 이후 `refreshProCareerAdvice(c,closedDay)`와 `refreshCareerRepertoireEvents(c)`, 일반/PS/시즌정산근거 확정 이후 `refreshProCareerResultEvents(c)`. 각 서버호출의 revision 커밋은 기존 소유자가 맡는다. 사용자명령 resolver만 revision을1 증가한다. 조회 view는 US root view의 재귀호출을 막기 위해 root revision assert를 반복호출하지 않고 해당원장만 검증한다.

선택원장은 optional root필드 `advice`, `repertoireEvents`, `proResults`이고 기존저장은 원장없음 기본동작을 유지한다. `adviceMorale?:number`는 server-owned0..100 권위값만 허용하며 기본50이나 성적에의한 임의증감을 만들지 않는다. 경기엔진의 `morale`은 양수 능력배율이므로 이 수치의 producer로 대체하지 않는다.

## 남는 실제 범위

- E20 사기producer/변동정책은 아직 없으며 권위필드가 없으면 후보가 아니다.
- E17 공식기록은 경기집계뿐이다. 마지막20AB 경계경기 전체가무안타인 suffix≥20AB만 증명할 수 있어 보수적으로 제외되는 실제무안타가 있을 수 있다. 없는PA 순서/안타를 만들지 않는다.
- E11 이전시즌 명단/정산근거가 없는 legacy저장에는 사실을 추측해 사건을 발행하지 않는다.
- E25 올스타 및 E29 개인상 확정producer/선정정책이 없어서 성공ACK 스텁을 추가하지 않았다.
- 포지션별 실제수비출장기록은 현재 GameContribution에 자리별로 저장되지 않으므로 설계08의 해당자리30경기 적합도성장을 이24경기훈련완료로 대체하지 않는다.
- 이 문서는 모듈구현 인계이며 root/진행/context/명령dispatch/API/UI의 실제도달성 및 실행검증 통과주장이 아니다.

## 작성한 검증

`packages/engine/test/pro-advice-repertoire-events.test.ts`: 별도stream·24경기추첨·JSON재개·멱등성,24경기계획/최신version/좌투,실제휴식기용과FINAL정산/pendingproof불변성,E86 KBO/US writer,E88 approach창,E87 확정XP,실제진단/회복/효과중복0. 부모요청에 따라 테스트·runtime·full gate·Git 명령은 실행하지 않았다.
