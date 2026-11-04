# 시즌 목표·에이전트 저장 API — 2026-11-04

## 구현 / 호출 소유권

기준53d973a 이후 CAREER_GOALS_OPEN/RESOLVE/REPLACE, CAREER_AGENT_OPEN/RESOLVE/CHANGE/PROMISE/OPEN_US_SALARY 총8명령과 CAREER_GOALS/CAREER_AGENT 읽기 화면을 추가했다. 목표는 실제 학교/대학/KBO/US GoalCareer owner를 재사용하고 agent는 실제 프로 계약만 처리한다. 입력은 버전/사건/선택 식별자·필요한 값만 허용하고 원장·건강·자금·미래 예산 주입은 거절한다. 기존 저장 파이프라인이 소유권/CAS/commandId 재실행을 소유한다.

목표 선택·중간 교체·E90 보상은 기존 native 규칙이며 기념 보상만 유지한다. 고용·다음 해 agent 변경·역할 약속·평가 요청·연봉 요청도 기존 제한·확률·난수를 사용한다. 미국 연봉 quote는 이미 봉인된 server funding/future authority만 재사용하고, 없으면 현재 잔액+추가0·미래 권한 없음으로 native 함수를 호출한다. 새 지원금이나 보장액을 만들지 않는다.

## 공개 미리보기

native previewId는 로스터/부상/비교점수/지원금/sourceBasis를 담을 수 있다. 공개 DTO는 native context를 보내지 않고 SHA256 토큰을 보낸다. 요청 시 서버는 현재 owner의 native preview를 다시 계산해 토큰을 검사하고 원래 native ID를 실제 처리기에 전달한다. 새 저장 상태·추첨 없음. 공개 확률/연봉/사용 여부/불가 이유는 native quote에서 그대로 가져온다. 토큰·실제 원장 권한을 혼동하지 않으며 계정/버전 검증은 기존 경계가 계속 수행한다.

목표 슬롯/이력/기념 보상도 allowlist로 투영해 completionReceipt/firstReceipt/의료 game key나 추가 내부 필드를 내보내지 않는다. agent 공개 view는 실제 계약/수입 합계/신뢰도/요청 결과와 공개 선택만 사용하며 draw/RNG/숨은 잠재력·비교선수 점수·개별 구단 예산은 내보내지 않는다.

## 검증

- 최초 목표/고용 명령이 UNSUPPORTED_COMMAND로 실패하는 RED 확인.
- 최종 지원 API7/7, 실패0·제외0,34091.5955ms: KBO/US/대학 목표 native 선택, agent 고용, 역할/연봉 공개 토큰·실제 native 처리 결과/난수 일치, stale/raw token 거절, 실제 기존 USD 잔액만 사용, 주입/다른 도메인 거절, 목표 교체 중간 시점/1회 제한, 실제 HTTP/PGlite 소유권/CAS/재실행/저장/조회.
- 앞 프로 사건8건과 함께 실제 두 API 파일 결합15/15,36243.5242ms, 실패0·제외0. 이전 검사와 합산하지 않는다.
- 전체 테스트 타입·변경4파일 lint·API build 종료0. 독립 읽기 리뷰 조치할 결함 없음.
- 증거: evidence/M2-20261104-career-support-red/final/types/lint/build 및 static.exitcode.txt, pro-support-integration.log/.exitcode.txt.

## 검증 범위 / 다음

이전 경력/의료/정규·PS/연봉 부킹 접두는 CONTROLLED이며 native 전체 경력 증거가 아니다. 현재의 실제 선택/API 저장과 이전 native 계산 결과의 일치만 주장한다. 일반 웹 화면과99사건/24경로/PF 전체, 실제 Neon·대형 PostgreSQL·실기기는 별도다. 이전 전체 검사90394는 결과 미수집 상태이고 이번에 재시작하지 않았다. M2 전체 완료 아님, 관리 추정65% 유지.

다음 확인 대상: 기존 관계 E94~96 공개 읽기/해결 배선과 미국 메이저 FA의 E66/국내 복귀 owner 범위. 메이저 제안 비교/서명 자체는23cac7d로 구현됐지만 E66은 minor-market owner에만 묶여 있어 전체 미국 FA 사건 완료로 세지 않는다. 새 게임 규칙이 필요한 부분은 질문하고, 설계에 이미 있는 정책은 재사용한다.

작업/Git/build는 기존M2체크아웃, V: 문서·증거 Copy-Item만. 기존 사용자 테스트 WIP21줄과 큰 runtime JSON/zz-dbg.log 보존. PC 종료 금지.
