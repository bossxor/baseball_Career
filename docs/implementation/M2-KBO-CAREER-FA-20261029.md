# KBO 내 선수 FA 계약 엔진

출처:01 §6(1군100등록경기 충족8시즌·부상등록포함·확정seed),08(가치×1.2·계약시작 나이에 따른4/3/2/1년·연봉 경계),기존44/40 AI FA의 구단 역할 수요/고정 가격 stream·미래예산90%/최대명단60. 수락확률이나 신규FA문턱을 만들지 않는다. 인간이 실제 제안을 선택해 수락한다.

## 명령과 확정 결과

`openKboCareerFa`는 종료된 계약·시즌 마감·국내 권리를 확인하고 기존 `kboServiceTimeView`의 실제 공식 KBO 정규경기+당시 등록 건강 영수증을 읽는다. bench/부상 등록은 포함, Futures/PS/나이/현재 명단 추정은 제외한다. 자격8시즌 뒤 다음해 시작 나이로 `kboFreeAgentTerms`를 평가한다. 가격은 기존 NPC `kbo-ai-fa-price` stream의0.9+0.3u를 그대로 사용하고만원반올림·3천만~30억 경계로 제한한다. 원구단과 타구단은 실제 유지 계약 명단·포지션 수요·90%미래채무·구단 모집 제한을 모두 통과해야 제안한다. 최대 희망기간을 감당할 수 없으면 예산에 맞는 기간으로 줄이며1년도 불가하면 제안하지 않는다.

발행된 quote에는 원선수/이전계약·해당 기록 표본·구단별 권위 예산/유지명단/수요 snapshot과 seed를 봉인한다. 새로고침·JSON복원·공식기록정정은 발행 가격을 바꾸지 않는다. 현재 예산/정원/권리 악화는 수락 시 다시 검사하고 실패하면 기존 계약·제안·능력·급여·기록을 그대로 보존한다.

E31은 실제 frozen 제안선택으로 DOMAIN `SELECT_FA_OFFER`를 커밋한 다음 E32를 연다. 실제 역할이 backup(.5)이면 E33을 열고 `ACCEPT_ROLE`, 나머지는 `ACCEPT_CAREER_OFFER`로 계약을 확정한다. 비교/선택/수락은 별도 CAS 명령이며 ACK로 계약사건을 완료시키지 않는다. `declineKboCareerFaSelection`은 선택을 해제하고 같은 제안의 새 E31을 열어 협상실패 뒤 원안 비교를 보존한다. 선택만으로 현시즌 소속/보유권/돈을 바꾸지 않는다.

수락 결과 `freeAgency.windows[].state=ACCEPTED`와 실제 다음 계약 `{contractKey,playerKey,clubId,seasonKey,years,annualSalaryWon,signingBonusWon:0,status:ACTIVE}`, 계약영수증 및 호환 `renewal`을 저장한다. 이전 원계약 snapshot은 FA창에 보존된다. `activateKboCareerFa(source,next)`는 Y02에서 이미 작성된 실제 다년계약을 검사하고 다음 소속/권리/등록/관계를 활성화한다. 신규 이적선수는1군 보장 없이 기존 신규시즌 명단 경쟁으로 간다. 연간 지급/예약/AI 최소명단 복구는 기존 Y02~Y04 실행을 따른다.

## 부모 공유파일 연결 계약

- `KboCareer.freeAgency?:KboCareerFaLedger`; 구schema1~7을 유지한다. `assertKboCareerFaLedger`는 순수 snapshot validator로 root-reader에서 재귀 없이 호출 가능하다.
- `KboRenewal.years`를1~4로 확장하고, `acceptedRenewal`에서 해당 FA를 `assertAcceptedKboCareerFa`로 검사한다. 같은 구단 FA도 다년계약이므로 검사한다.
- `stageKboAgeAndContracts`의renewed years와 `startNextKboSeason`의 새 계약 years는 실제 renewal.years. FA 새계약의 계약금은0이며 이전 rookie 계약금/복무 원장을 새계약에 남기지 않는다. 새 실제 복무 선택으로 별도로 만든 servicePay는 활성검사가 보존한다.
- 기존 타구단 offseason-exit 활성화/관계 처리와 FA를 분기한다. FA창의 원계약과 닫힌 급여는 덮어쓰지 않는다. 부모 Y02는 source/next 세계시즌을 바꾸기 전후 어느 쪽에서든 FA helper를 호출할 수 있다.
- 실제 offerKboRenewal 진입에서 국내 FA자격이면 새 FA 명령으로 연결한다. UI/DB 권한·세이브 행 revision CAS/원자 저장은 외부 adapter 후속이며,클라이언트가 quote snapshot/eligibility/budget를 직접 넣지 않는다.

## 작성된 검증 — 실행 안 함

`kbo-career-fa.test.ts`7개:8×100 실제 등록/7시즌·99·Futures거절,계약시작나이 경계4/3/2/1·연봉 cap·seed/JSON고정·private필드 비노출,E31실제 비교→E32/E33실제계약·선택거절의 원안보존,CAS/event version·위조가격/영수증·예산악화거절·공식정정후재가격없음,Y02다른구단 활성·권리/등록/원능력/원기록 보존,실재 backup역할 E33수락,기존 타구단 bench10명을 옮긴 유지명단60명 차단·모든 구단 예산막힘의 실제 빈 제안 목록.

사용자 지시에 따라 테스트·타입체크·Git명령을 실행하지 않았다. 최종 전체 check1회와 부모 공유파일 연결의 실제 검증은 부모 작업에 합류한다. 작성 자체는 실행 통과 증거가 아니다.
