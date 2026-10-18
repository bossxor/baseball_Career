# 71. 세계 불변조건·진단·안전 중단 계약

불변조건은정상적인패배/방출/적자를막는규칙이아니라손상된세이브전이를차단하는서버검사다. 명령영향범위검사는매commit,전체세계검사는시즌전환/복원에서실행. 실제구현테스트통과아님.

| ID | 검사 | 실패 시 |
|---|---|---|
| INV01 | 종류별정확6능력키/영구A·P1~100/P≥A/유한정밀도 | 게임변경rollback |
| INV02 | overall=영구6개평균/일시효과미포함 | 파생값재계산후차이진단 |
| INV03 | 선수동일세계일실제출장1경기이하 | 일정/기록commit차단 |
| INV04 | 선수ACTIVE유급계약≤1/정지계약은권리원장일치 | 계약전이차단 |
| INV05 | 한팀타순9중복0/필수수비자리/투수정원 | 경기시작차단·정리경로 |
| INV06 | 팀R=개인R합=상대책임투수R합 | 경기최종commit차단 |
| INV07 | 팀H=개인H합/타자K=상대투수K/AB=PA-BB-HBP | 경기최종commit차단 |
| INV08 | outs정수/합법3아웃/자동주자R포함·ER제외 | 경기최종commit차단 |
| INV09 | 타석p각[0,1]/softmax합1(허용오차1e-12) | 추첨전차단/rng불소모 |
| INV10 | 세계시즌강화usage0/1/원장근거고유 | 강화/정산차단 |
| INV11 | 구종2~4활성/weight합100/등급0활성0/정의버전일치 | 구성/경기시작차단 |
| INV12 | 구종baseGranted+reserved≤20/actualGranted≤20m/중복XP0 | XP정산차단 |
| INV13 | 특성해금행고유/정의조건evidence존재/전체보유조건평가 | 특성정산차단 |
| INV14 | 목표·도전기념보상gameplayDelta0/보상ID계정고유 | 보상정산차단 |
| INV15 | scope별통계혼합0/교차리그recordKey고유 | 집계정산차단 |
| INV16 | 급여gross=fee+net/paid·reserved·보장동일채무중복0 | 금전명령차단 |
| INV17 | 역할claim(saveId,rootSource)당활성1/직무슬롯 | 복사/고용차단 |
| INV18 | 원본snapshot hash불변/출처쓰기권한없음 | 원본변경차단·경보 |
| INV19 | 미해결task필수source/resume가현재세계에속함 | 날짜진행차단·복귀resolver |
| INV20 | pending경기provisional delta와최종원장동시가산0 | 경기finalization차단 |
| INV21 | 재도전used0~3/준비완료키고유/복무기간불소모 | 경로정산차단 |
| INV22 | 현재공개요약범위A≤L≤P≤U≤100/이전공개범위보다확대0(역사보고서는당시A기준) | 평가모형중단·구보고서유지 |
| INV23 | 모든활성팀/계약/등록/일정의activeGenerationId일치 | 연도활성화차단 |
| INV24 | simulationKey save내유일/복원rng보존/중계immutablehash검사 | 복원활성화·재생차단 |

INV02같은결정론읽기파생값만재계산가능,원시능력/성적/돈/권리/seed자동수리금지. INV05정상적부상으로명단부족이면손상경보가아니라44정리화면,정리완료전경기불가. availableBudget음수는기존보장채무때문일수있으므로NaN/Infinity/중복채무와구분하고재건경로를제시한다.

## 오류·진단 자료

client오류{code:INVARIANT_VIOLATION,requestId,invariantIds,phase,lastCommittedRevision,allowedActions:[READ_LATEST,READ_RECEIPT,EXPORT_DIAGNOSTIC_REQUEST]}서버내부행/연결문자열/원잠재력값은노출안함. serverdiagnostic에는rules/engine/schemaVersion,simulationKeys,source/targetrevision,검사전후checksum,stage,예외타입,관련명령hash만. 사용자토큰/secret/개인친구데이터/서명URL로그금지.

실패한명령은공식세계state rollback,같은transaction의RNG진행/원장/receipt성공행도rollback. 이미pending청크로확정된부분은보존하고finalization단계만실패상태표시. 읽기가능최근revision을제공,새명령으로다른결과가나올때까지재추첨하는복구버튼없음. 운영자가수정해야하면별도개발복사본에서원인재현→호환수정정의→사용자세이브보존후적용계획,운영전체리셋금지.

## 검증 분류와 도구 계약

검사함수는읽기전용report={scope,checkedRevision,checks:[{id,status:PASS|FAIL|NOT_APPLICABLE,evidenceRefs}],reportHash}. 클라이언트자가진단은서버결과표시만,일반사용자가raw검사파일로실제P를열람하는API없음. 개발fixture는각조건의최소반례와정상경계를주입하고바로앞단계의rng/원장손상여부를비교한다.

INV-D01 만루자동주자득점R1/ER0정상/02p합1.0001차단·rng0/03overall일시buff미반영/04중복salary채무차단/05연도generation혼합차단/06미관측평가범위확대차단/07특성보유전체조건평가/08불변원본hash/09투수0가용은정리행동/10실패transaction게임·원장·RNG동시rollback. 완전세계검사는비동기준비가능하나검사통과reportHash없이는72/70활성화불가.