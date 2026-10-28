# M2-EL — 마이너 만료 제안 수락

2026-10-28. 기준 tip 46a3358 위. own branch 유지, PC 종료·main/M6 병합 없음.

## 실행 범위

`acceptUsMinorMarketOffer`가 봉인된 OPEN 창의 한 제안을 수락한다. 조건은 1년·연 $30,000·계약금 0·현재 레벨 유지. E66은 `ACCEPT_CAREER_OFFER`로 `completeBlockingEvent` 닫고, 만료 통제 연도를 `UsMinorYearArchive`에 남긴다. 새 계약 키는 `us-minor-renewal`이며 `usContractOrigin` 최초 원점은 덮지 않는다. 현재 보유 구단은 `minorRenewal.organizationId`로 재생한다.

타 구단 수락 시 원구단 공석은 예비→하위 승격→Rookie 신인 순으로 채운다. 상위 리그 임의 신인을 만들지 않는다. 밀린 경쟁자는 대상 구단 예비로 보낸다. 새 팀 최초 등록 동료는 `formRegisteredTeamTeammate`/`queueRelationFormationNotices`를 따른다. 원구단 재계약은 로스터 이동 없이 같은 조직에서 새 1년 항을 연다.

OPEN `minorMarket`은 수락 후 제거한다. 과거 창을 새해 OPEN으로 두지 않는다. `openingUsMinorInventory`는 통제 연도 수만큼 archive를 재생한 뒤 마지막 해에만 renewal 급여/구단/funding을 적용한다.

## 미포함

국내 복귀 실행·최신 US→KBO 세계 인계·E66 자동 UI 완료·99/24/PF-D 완료 표기 상승은 없다. 원점 없는 legacy 예산 추정 없음.

## 검증

집중 9/9(EK 조회 7 + accept 원구단/타구단 2). 전체 npm run check 종료0: 엔진/API 796개 중794통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산 통과. duration_ms 962830, 엔진 테스트 duration_ms 839623.1663. 실제 Neon/브라우저/APK 검증은 아니다. evidence/M2-EL-*에 로그·소스 동결을 남긴다.
