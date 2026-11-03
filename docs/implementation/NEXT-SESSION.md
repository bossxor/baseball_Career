# 최신 — 메이저 재계약·원구단 FA 저장 API

M2-US-MAJOR-YEAR-API-20261104.md를 먼저 읽는다. 기존 native NEXT_MAJOR_YEAR/ACCEPT_MAJOR_FA2명령과 실제 연말 quote 연결. 소유 funding만 재사용하고 지원금 추정0. 승인 counter 표시5680000→6248000 불일치를 RED로 잡아 native 가격/키와 통일했다. 최종 API5/5·정적 검사·독립 리뷰 통과. 통제6등록시즌 뒤 FA/보장 승계이며 native6년 전체가 아니다. 원구단 외 시장은 별도 범위다.

US_PLAY는 총19명령이다. 현재 source 전체 check·실제 대형 PostgreSQL·기본 화면·99/24/PF는 아직 남는다. 사용자는 원구단+타 구단 최대3곳 MLB FA 비교를 승인했다(14/13 반영). 다음 묶음에서 새 시장의 소유권/계약/로스터·연도별 금전 연속성을 구현한다. 현재 current-club-only native를 전체 시장 완료로 세지 않는다. 기존 사용자 us-amateur-return-career.test.ts21줄은 그대로 보존한다. PC 종료 금지, V: 문서/증거 Copy-Item만. 최종 커밋은 git log/remote로 확인한다. 아래는 과거 인계다.

# 최신 — 가상 US 고정 AL/NL·포스트시즌 API

M2-US-LEAGUES-POSTSEASON-API-20261104.md를 먼저 읽는다. 원격 bc0f51b까지 최신화했고 사용자 승인으로 가상30구단 고정 ID 소속표를 생성/legacy metadata에 연결했다. 공개3명령(CONFIGURE_LEAGUES/START_POSTSEASON/ADVANCE_POSTSEASON), 소속/PS 공개 조회 연결. 묶음11/11·정적 검사 종료0, 독립 리뷰 조치 사항 없음. controlled 정규 접두 뒤 새 API native FINAL1경기와 기존 PS native46경기 우승 검증이며 native 정규8790경기 증거는 아니다. 전체 check는 새 source에 재실행하지 않았다.

과거 세션17083은 종료0·2/2, 실제 선택3시즌 E35/JSON 보관 완료다. 실행 중으로 보지 않는다. 대형 DB 저장/화면/메이저 연말 API/99·24·PF는 남았다. 다음은 기존 메이저 재계약·FA writer의 저장 명령 연결이다. 다른 작업자의 us-amateur-return-career.test.ts21줄 WIP는 수정/스테이징하지 않고 저장소 밖 backup에 보존한다. PC 종료 금지, V: 문서/증거 Copy-Item만. 최종 Git hash는 log/rev-parse로 확인한다. 아래는 과거 인계다.

# 최신 구현 — 미국 다음 해·만료 계약

[M2-US-YEAR-API-20261103.md](M2-US-YEAR-API-20261103.md)를 먼저 읽는다. 다음 마이너 연도·만료 견적·사건 탐색·실제 제안 수락4명령과 연말 blocker/제안 사건 조회 연결. 기존 잔액/봉인 funding만 사용하며 임의 지원금 없음. 연말 포함4/4 및 만료 양성1/1·lint·타입·API build 통과, 읽기 리뷰 문제 없음. 다음은 서버 소유 AL/NL registry 생성·PS API, 메이저 연말, 실제 화면, 대형 저장/99·24·PF 잔여다. M2 전체 미완료. 사용자의 끝까지 계속 요청으로 이전5% 중단선 해제. PC 종료 금지. 아래는 과거 기록이다.

# 최신 구현 묶음 — 미국 복무·복귀 후 경기 API

[현재 구현·검증·다음 작업](M2-US-MILITARY-API-20261103.md)을 먼저 읽는다. 복무 동결/해지·실제 시즌 진행·전역·옵션/새 제안 8명령, 일반 미국 캠프/일정/개막/경기/사건/훈련·스타일 10명령과 공개 조회를 연결했다. 최초 묶음9/9, 리뷰에서 찾은 복귀 후 일반 플레이 연결 보완5/5, 최종 사건/훈련 보완3/3, lint·전체 테스트 타입·API build 통과. 검사 수에는 중복이 있어 합산하지 않는다. 전체 장기 검증은 반복하지 않았다. 실제 화면·미국 PS/연말/다음 해 입구·대형 DB 저장·99/24/PF 잔여는 남아 있으며 M2 전체 완료 아님. 주간 잔여4%에서 인계·푸시 후 새 구현 중단. PC 종료 금지. 아래는 과거 기록이다.

# 최신 구현 묶음 — 미국 의무 귀국 앞단 연결

[현재 구현·검증·인계](M2-RESUME-ENVELOPES-20261103.md)를 먼저 읽는다. CAREER_US_RETURN_ 9명령과 US_RETURN_PROGRAM 조회를 기존 엔진에 연결해 귀국 요청→의무 2년→드래프트/국내 진입/미국 옵션 및 기존 선택 재도전으로 이어지게 했다. 묶음 회귀 19/19·정적 검사 통과 후 리뷰에서 조회의 진행/정산 준비도·복귀옵션을 보완했다. 수정 범위 3/3·lint·타입·API build도 통과했다. 사용자 요청대로 구현을 묶고 검증·수정했으며 기존 장기 17구간 재검증은 중단했다. 대용량 실제 DB/기본 웹 버튼/99사건·24경로 전체 증거는 남아 있고 M2 완료 아님. 입력 경계 수정 77274df는 이미 푸시했다. PC 종료 금지. 아래는 과거 기록이다.

# 최신 재개 — 입력 경계·귀국 명령 체인

[현재 변경·검증·저장 계측](M2-RESUME-ENVELOPES-20261103.md)을 먼저 읽는다. 명령/생성 null JSON의 500을 INVALID_REQUEST/400으로 수정했고 실제 HTTP 회귀 16/16, lint·전체 테스트 타입·API build·HTTP smoke가 통과했다. 귀국 후 미국 재계약 3명령의 입력/출력/상태 해시·JSON 재실행도 종료 0이다. 의무 독립 48+48은 실제 worker이며 원래 미국 6년/초기 미지명 시장은 제어 fixture다. 전체 P10 완료는 아니다. 174MB root 중 현재 preparation 33.96MB가 마지막 보관 이력과 중복됨을 계측했다. 실제 PostgreSQL 대용량 저장과 PGlite 메모리 부족은 미해결이다. 이번 변경 뒤 전체 check는 재실행하지 않았다. 아래 기록은 과거 인계다. PC 종료 금지.

# 최신 검증·인계 확정 — 2026-11-03

구현 e6df2ee 푸시·원격 일치 후 전체 check 종료0을 확인했다. 엔진/API1058중1053통과·실패0·환경5건 제외, 웹24/24·HTTP smoke 통과. source506파일 변경·추가0. 실제 선택3시즌 E35/JSON 보관이 집중 및 최종 전체에서 통과했다. [최종 인계](M2-HANDOFF-20261103-VERIFIED.md)와 [전체 변경·증거](M2-RESUME-VALIDATION-20261103.md)를 먼저 읽는다. 대용량 PostgreSQL HTTP3건은 연결 미설정으로 미검증이며, PGlite의174MB 장기 이력 UPDATE 메모리 부족은 미해결이다. M2 전체 완료 아님. 아래 실행 중 세션은 과거 이력이다.

# 최신화 후 검증 재개 — 2026-11-03

원격 d76f99d까지 최신화했다. [현재 구현·실행·저장 자원 경계](M2-RESUME-VALIDATION-20261103.md)를 먼저 읽는다. 의무 귀국2시즌을 재생성했고 선택3시즌 E35·JSON 보관이1/1 통과했다. 전체 check는 source506파일 동결 후 실행 중이다. 장기174MB 저장의 PGlite UPDATE 메모리 부족을 확인했고 실제 PostgreSQL HTTP3건은 별도 연결 전까지 미검증이다. 오류 로그의 전체 저장 원문 복사 문제는 원인·길이 제한과3개 회귀로 수정했다. 아래 세션17083/완료 추정은 과거 기록이다. M2 전체 완료 아님.

# 최신 검증 — API 기존/신규 경로9/9 통과

제품 코드7f7bbae 변경 없이 API3파일 묶음9/9(기존 HTTP7 + 새 pure dispatch/JSON2), 실패0·제외0,195129ms 통과. evidence/M2-20261103-return-api-regressions.log와 .exitcode.txt를 본다. 새 returned root의 실제 HTTP/Neon/외부 CAS 검수는 여전히 남는다. E35 장기 검사 세션17083은2시즌 정산 후3시즌째 진행 중이며 최종 .exitcode.txt부터 확인한다. 기존 큰 runtime JSON2개·zz-dbg.log 보존, PC 종료 금지. 아래 인계의 다음 작업을 계속한다.

# 최신 — 귀국 재도전 저장 API16명령 연결

기능 기준6e888cd 이후 career-us-return-retry-shell.ts와 기존 retry shell을 연결했다. 실제 gateway/JSON/허용 DTO/US 평가·거절/준비 시작 집중2/2, API build·전체 테스트 타입·변경3파일 lint 종료0. evidence/M2-20261103-return-api-batch.log를 본다. HTTP/Neon/외부 저장 CAS/idempotency까지 실행한 검사는 아니다.

E35 실제3선택시즌 검사는 세션17083 / evidence/M2-20261103-return-exhaustion-native.log 진행 중이다. 실제 선택2시즌48경기 정산을 기록했고3시즌째다. 종료 시 .exitcode.txt와 전체 테스트 결과를 먼저 확인한다. 실패면 고친다. 이전 source snapshot이므로 최종 whole gate로 세지 않는다. 다음은 실제 E35 원본의 API 확인/전환 저장 검수, fresh review, 전체 check1회/HTTP smoke다. STATUS M2 관리용 추정65%·전체87.5% 유지. PC 종료 금지, V:는 문서/증거 Copy-Item만. 최종 commit/remote는 git log/rev-parse로 확인한다.

# 최신 체크포인트 — 귀국 선택 준비·KBO/US 실제 진입 확인

M2-US-RETURN-RETRY-20261103.md의 마지막 절부터 읽는다. 실제 선택48경기·KBO 새 계약/첫 날짜·최신 선택 선수의 US 계약/첫 날짜 통과. 후속 미국 계약은 제어 시즌 closure 뒤 native writer 검사이며 full native US season이 아니다. JSON US 복원/군복무 NPC current quote 묶음2/2, checkpoint build/전체 테스트 타입/lint 종료0. E35 실제3선택시즌 검사는 세션17083 / evidence/M2-20261103-return-exhaustion-native.log 실행 중이며 .exitcode.txt로 완료를 확인한다. 최신 source는 시작 후 나이/이전 평가 archive 검증을 보강했으므로 이 검사는 최종 전체 gate가 아니다.

다음은 E35 결과 처리와 API의 US_RETURN_RETRY discriminator·strict payload·공개 DTO 연결이다. package exports는 추가됐지만 API/웹 연결은 아직 없다. sourceMinorYears/majorYears와 retryOfferKey의 새 US epoch, 원본 한 번+delta archive를 보존한다. STATUS 상단은 관리용 추정 M2 65%, 전체87.5%로 갱신했다. 전체 check는 이 묶음 연결을 끝낸 뒤1회만 실행한다. 큰 runtime JSON2개·zz-dbg.log는 보존, PC 종료 금지. Git 최종 커밋/remote는 git log와 rev-parse로 확인한다. 아래는 이전 인계다.

# 최신 구현 중 — 귀국 선택48경기·KBO 실제 첫 경기 확인

기준5363de3 이후 미커밋 묶음은 M2-US-RETURN-RETRY-20261103.md를 먼저 읽는다. Task1 gateway/authority 통과, Task2 실제 선택48경기1/1, Task3 native 새 KBO 계약·첫 날짜1/1 통과(535919ms, 종료0). Task4 현재 미국 quote·복귀 조항·명시적 거절 연결 중이며 실제 미국 계약/경기와 후속 갱신을 마쳐야 한다. Task5 실제 E35·package/API, Task6 최종 whole check는 남았다. 오래된 세션23438/51159는 이미 종료0이며 실행 중이 아니다. 큰 runtime JSON2개·zz-dbg.log는 보존, PC 종료 금지. 아래는 이전 인계다.

# 최신 구현 중 — 귀국 미지명 후 선택 준비 root

5363de3 이후 docs/implementation/M2-US-RETURN-RETRY-20261103.md와 docs/superpowers/plans/2026-11-02-us-return-retry.md를 먼저 읽는다. Task1 gateway/authority 집중 각2/2, 실제 의무 복귀2시즌 접두 생성 종료0. Task2 선택48경기 연결 구현 중이며 native 검사 세션23438 / evidence/M2-20261103-return-preparation-green.log를 확인한다. Task3~6은 남아 있고 새 root는 아직 package/API에 노출하지 않았다. 현재 source WIP를 삭제/reset하지 말 것. 기존 큰 runtime JSON2개·zz-dbg.log 보존, PC 종료 금지. 아래는 이전 인계다.
# 최신 재개 지점 — E73 조기 드래프트·계속 재학 추가

기준6d7a3e6 이후 API2파일 변경. 공개 사건 키/버전과 유효 routeCommands를 추가하고 COLLEGE_EARLY_DRAFT·COLLEGE_CONTINUE를 기존 writer에 연결했다. 계속 재학은 eventVersion과 명시적 forfeitUnusedTraining boolean을 검사한다. lint/전체 테스트 타입/API build 통과, 추가 읽기 검토 Critical/Important 없음. 전체 API 검사는 종료0이며 evidence/M2-20261103-choice-route-batch.log와 .exitcode.txt를 먼저 확인한다. RED는 choice-route-red.log. 최종 API32중30통과·환경2제외·실패0, 웹24/24·API build·타입/lint·설계10종·HTTP smoke 통과. 기능 팁 fcd379e 원격 일치, 엔진 런타임 전체는 반복하지 않았다. 다음은 귀국 재도전 root·실제 웹 버튼·99/24/PF 증거다. PC 종료 금지. 아래는 이전 인계다.
# 최신 상태 — 2026-11-03 선택·복학·특성 저장 API

**기능 팁 afa1aa1:** 원격 일치 확인. 이후 ACK 검토 보강은 테스트/인계만 변경했고 focused1/1·lint 통과, 제품 코드 변경0이다. 최종 인계 커밋은 git log -1로 확인한다.

9be891b 이후 [API 호출·원장·검증·잔여](M2-CHOICE-API-20261103.md)를 구현했다. 읽기4종과 저장명령6종으로 대학 집중 선택·E73 미국 열람/실제 서명·E74 복학·일반 특성/진로 알림 ACK를 기존 M3 소유자/CAS/명령 영수증에 연결했다. 새 확률·연봉·성장·DB 스키마/의존성을 추가하지 않았다.

최종 API31개 중29통과·환경2개 제외·실패0, 웹24/24, 전체 lint/typecheck/build·engine/event/design10종/Android shell/assets 정적 검증·HTTP smoke 종료0. 동결 API4파일 변경0, engine/rules는9be891b와 동일하다. 새 전체 engine/rules 런타임 검사는 반복하지 않았으며 이전 전체1025개 결과를 새 source의 전체 check 통과로 세지 않는다. 로그는 evidence/M2-20261103-choice-api-final-batch.log와 choice-api-result.json. 최종 읽기 검토 Critical/Important 없음.

작업/Git/build는 baseball-career-m2 / codex/m2-career-engine, V:는 문서·증거 Copy-Item만. PC 종료 금지, 기존 큰 runtime JSON2개·zz-dbg.log 보존. 최종 커밋은 git log -1과 원격 해시로 확인한다. 다음은 귀국 미지명 선택 준비 root·웹 버튼 연결·99사건/24경로/PF 증거다. M2 전체 미완료. 아래는 과거 이력이다.

# 이전 상태 — 2026-11-03 사건 선택 구현·검증 정리

기준 b6165a2 이후 E33 나이·구 저장 호환, E36/E74 자발 은퇴와 E37 저장/보관 명령, E71 대학 집중·E73 미국 비교/서명, 프로 E85 요약을 구현했다. [변경·원장·검증·다음 작업](M2-EVENT-CLOSURE-20261103.md)을 먼저 읽는다.

전체 check 최초1회는1025중1022통과·E73 1실패·환경2제외/종료1. 해당 오류를 재현·수정한 뒤 대학2/2·웹24/24·전체 build·정적 검증·HTTP smoke 종료0을 별도 확인했다. 전체 장시간 검사를 반복하지 않았으며 단일 check 종료0으로 표시하지 않는다. 최초 소스495파일 중 기록된 E73 수정1개 외494개 동일, 수정 후 별도 읽기 검토에서 Critical/Important 없음. 로그는 evidence/M2-20261103-event-check.log, college-correction-test.log, corrected-tail-check.log 및 source-after-correction.json이다.

작업/Git/build는 baseball-career-m2 / codex/m2-career-engine, V:는 문서 Copy-Item만 사용한다. 기존 큰 runtime JSON2개와 zz-dbg.log는 미포함·보존한다. PC 종료하지 않는다. 최종 커밋은 git log -1과 원격 해시로 확인한다.

M2 전체 미완료. 다음은 귀국 미지명 선택 준비 root의 실제 KBO/US/은퇴 세 출구, E71/E73/E85의 API·웹 호출 점검 및 99사건/24경로/PF 실행 증거다. 이번 신규 HTTP 검증은 E36/E37에 한정된다. 아래 중단/진행 중 기록은 과거 이력이다.

# 사용량 마감 인계 — 2026-11-02

구현 `f607520` 커밋·푸시 및 원격 일치 확인. 5시간 잔여7%에서 새 구현을 멈추고 최종 인계를 정리했다. [최종 상태·검증·다음 순서](M2-HANDOFF-20261102-FINAL.md)를 먼저 읽는다. 전체check 엔진/API1012중1010통과·실패0·환경2건 제외, 웹24/24·HTTP smoke·484파일 동결 통과. M2 전체 완료 아님. 다음은 E33 나이 조건/기존 저장 호환, 아마추어 자발적 E36, E71/E73/E74 선택 연결, 프로 E85 요약, 귀국 미지명 선택 준비 root다. 실행 중 runner 없음. 아래 기록은 과거 이력이다.

# 최신 M2 재개 — 2026-11-02

원격 `c925d37`까지 최신화한 뒤 미국 재계약 revision·복무 NPC/긴급 등록 연속성·독립2년 구종 시즌을 보강했다. 전체 check 종료0: 엔진/API1012중1010통과·실패0·환경2건 제외, 웹24/24·HTTP smoke 통과. 동결484파일 변경0. 경로18구간225명령의 해시/JSON 재실행 증거를 보존했다. [변경·검증·남은 범위](M2-RESUMED-VERIFICATION-20261102.md)를 먼저 읽는다. M2 전체 완료는 아니며 다음은 사건 감사의 실제 선택 누락과 귀국 후 선택 준비 root다. 아래 중단·실행 세션은 과거 이력이다.

# 최신 체크포인트 — 2026-11-02 사용자 요청으로 마감

추가 구현과 장시간 검사를 중단했다. 작업 시작 기준은 973cb89이며 현재 커밋은 이 문서를 포함한 git log -1로 확인한다. [변경·검증·남은 작업](M2-RETURN-CONTINUITY-20261102.md)을 먼저 읽는다. 작업/Git/build는 baseball-career-m2 / codex/m2-career-engine, V:는 문서 Copy-Item만 사용한다. PC 종료하지 않았다.

미국 귀국 후 재계약의 기록·건강·성장·나이·재정 연도·1년 계약 원장을 보강했다. 타 구단 갱신의 보유 구단과 동료/목표/구종 알림도 수정했다. 최종 소스는 lint·엔진/전체 테스트 타입 검사까지 통과했다. 리뷰 보강 전 집중 재계약은 1/1 통과했으나, 보강 후 타 구단 후속 갱신 회귀는 아직 실행 완료되지 않았다.

전체 check는 사용자 마감 요청으로 중단했다. 로그에 출력된 통과 93건·실패 0건이며 최종 집계가 없고 종료 코드는 -1이다. 미실행 영역을 통과로 해석하지 않는다. P16 별도 명령 재실행도 약 15분 후 중단해 완료 해시가 없다. 검사 중 소스 488파일 SHA256 변경 0. 기존 큰 runtime JSON 2개와 zz-dbg.log는 삭제하거나 이번 커밋에 넣지 않는다.

재개 순서: 현재 Git/원격 비교, return-continuity 문서 읽기, us-amateur-return-career.test.ts의 타 구단 재계약/다음 갱신 회귀를 먼저 확인한 뒤 남은 통합 검사를 묶어 실행한다. 귀국 미지명 후 선택 준비 root, 현역/2년 후 재계약 완주, 24경로/99사건/PF 전체 증거는 여전히 남는다. M2 전체 완료 아님. 아래 실행 중·사용량 중단 기록은 과거 이력이다.

**최신화 2026-11-02:** origin/main(4885afc, M6·M3~M9 수정 포함)을 병합했다. 충돌 코드 3곳(high-school-game 수동 라인업+positionFits, kbo-roster-repair 구단모드 빈 protagonistKey, season-goals 병역 목록)은 양쪽 기능을 모두 살렸다. 직전 전체 check 실패 원인은 us-amateur-return-career.test.ts의 낡은 단언 2개(structuredClone이 null 프로토타입을 바꿔 deepEqual 실패, E08 신규 캠프 알림에 ACK_EVENT 대신 KEEP_FOCUS)였고 테스트만 고쳤다. 전체 check 결과는 이 병합 커밋 검증 로그(evidence/M2-20261102-main-merge-check.log)를 확인한다. M2 전체 완료 아님.

**사용량 마감 확인:** 2026-11-02 최종 조회5시간사용92%·잔여8%. 새작업중지, 현재묶음코드/집중증거/남은일을커밋·푸시한다. 전체검사세션59753은계속실행되며로그/종료코드를다음번에확인한다. PC종료없음.

# M2 재개 묶음 체크포인트 — 2026-11-02

기준a7a3ec4. 재도전 native 집중4/4, 최신 경계/자발적은퇴2/2, 미국직행6시즌후실제마이너반복재계약1/1 통과. 새로운 source변경을 포함한 전체 npm run check는실행중(세션59753), evidence/M2-20261102-resume-check.log 및 .exitcode.txt를 먼저확인한다. 전체통과/M2완료아님. 사용량사용91%·잔여9%를확인해8%마감준비에들어갔다. PC종료하지않는다.

## 이번 변경

- KBO재도전 E34/E35/E36: 실제예산0은0제안유지, 실제재원/수요있는수락후활성화계약/프리시즌/등록/일정/정규진입연결. 양수오퍼를강제하지않았다. RETRY_REVIEW/RETRY_PREPARATION으로정규명령과분리, 원세계/구단/등록/권리/병역/대표원장변조차단, 자발적은퇴/별도안전은퇴조회. 준비48경기·사용량1회정산과지속3회소진명시적은퇴검증. 기존프로/과거2회/아마추어병역접두는제어fixture다.
- 미국직행 재계약: 사용자확정1년/$30,000/레벨유지/타구단최대3곳. 기존시장·예산·경쟁점수를재사용, 최초6시즌원점과연속계약epoch/급여/권리를검증. 실제두번갱신·타구단이동·JSON동일·변조거절집중1건통과(119883ms).14에기록했다.
- E68: 완료준비/서비스원장재검증, 원선수/계약/기록/건강/예산근거강화, 준비중선수기록projection/원US전체원장보관/KBO활성화시전체병합. 미지명은AMATEUR_RETURN_UNDRAFTED로열린다. 실제E66귀국확정receipt로현역서비스owner를도출한다. 원본을가짜새계약으로복원하지않는다.
- 서비스성장정책: 새귀국root만 serviceGrowthPolicy=SOURCE_DIFFICULTY로원난이도를사용,현역0성장/잔여훈련기간의기존치트배율을복원. 옛flag없는원장은REALISTIC계산을유지해소급재계산을피했다. 중복전체US원장검증을제거하되CAS와실제source검증1회는유지한다.
- 증거runner: 입력/source/output SHA256,JSON재개/원본불변,source추가삭제변조감지,실패별도영수증. P02/P08/P09/P11/P23의한정된endpoint/선행구간을추가했다. 아직실행해시최종보고서없음. 모든24경로를PASS로바꾸지않았다.

## 검사 해석과 다음 우선순위

1. 전체check종료결과부터확인한다. 실패한분야만집중재실행. 이전4f0cde7 전체964/962/환경2/웹22와이번집중검사를합산하지않는다.
2. E68집중실행은실제2년432경기와완료/JSON근거를지난뒤, 준비projection에NPC전체기록을기대한낡은assert에서실패했다(550844ms). 원본과활성화후전체기록검사는유지하고중간검사는선수행으로수정했다. 이변경후별도장시간재실행을전체check로통합했다. M2-20261102-return-final-focused.log는INTERRUPTED이며PASS아님. 실제KBO계약/정규첫날까지현재전체검사에서확인해야한다.
3. E68귀국중US재계약취소는여전히 US_AMATEUR_RETURN_RESIGNING_NOT_SUPPORTED로안전거절. 새미국시장에는최초6년만료후재계약만연결했다. 귀국중연속US세계/계약epoch, 미지명뒤선택준비root변환, 현역18개월완주증거가남는다.
4. KBO재도전배경은OFFSEASON_STAGING_ONLY. 공식144경기/NPC연간성장/서비스·대표중세계연동을완료한증거가아니다. 실제미지원복무/정지계약/대표진행세계는거절한다.
5. 증거runner는편집이끝난소스에서 scripts/verify-m2-closure.mjs --paths-only 먼저실행. P10/P16검증된시나리오계약연결,P13/P14등나머지endpoint와24경로/PF/99실제증거가남는다. M3/M6/M7/실기기항목을M2 PASS로대체하지않는다.

작업/Git/build는baseball-career-m2 / codex/m2-career-engine. V는문서Copy-Item만,V.git/강제푸시/훅스킵/main·M6병합금지. 원본과실패로그보존. 최신커밋은git log/원격해시로확인한다.

# M2 구현 재개 — 2026-11-02

사용자가 재개를 지시했다. [현재 작업판](M2-ACTIVE-20261102.md). 아래 중단 기록은 이전 이력이며 현재 상태는 구현 중이다.

# 저장·인계 체크포인트 — 2026-11-02

사용자 요청으로 추가 구현을 중지했다. [현재 상태·검증·재개 순서](M2-CHECKPOINT-20261102.md)를 먼저 읽는다. E70 집중 통과, E34/E35/E68와 경로 runner는 WIP다. 프로 재도전 E34/E35/E36 집중 career-retry-completion 5/5 통과(2026-11-02 재검증, 제어 fixture). API 연결: CAREER_RETRY_* 명령 11종+화면 RETRY_ROUTES/RETRY_PREP/RETRY_RETIREMENT, 커리어 전체를 세이브 state.career JSON에 저장(apps/api/src/career-retry-shell.ts, API 테스트 m2-career-retry 통과). KBO 커리어 API 생성 경로와 웹 UI는 미연결, 귀국 native2시즌 통과, 미국 재계약(resignUsAfterAmateurReturn: 복귀옵션 오퍼, 경과 시즌 NPC 성장·고령화는 고정 근사 업무량(ponytail), usReturnContinuation 이력 epoch, 1년 독립 후 재계약→프리시즌/일정 발행 검증; 서비스 연도 경로·2년 후 경로 미검증), 경로 해시 미완료. 이번 전체 check 미실행이며 M2 전체 미완료. 마지막 전체 통과는4f0cde7이다.

# 최신 검증 완료 — 2026-11-01

원격71669c0 최신 일치 확인 후 E07 재도전 제안·E69 미국 출장 경력 은퇴 사건을 연결했다. 전체 npm run check 종료0: 엔진/API964중962통과·실패0·Neon환경2건 건너뜀, 웹22/22·HTTP smoke 통과. 동결443파일 변경0. [상세·검증·다음 M2 범위](M2-RETRY-RETIREMENT-EVENTS-20261101.md). 다음은 E34/E35/E68 root와 E70 근거 계약·전체 경로 증거다. M2 전체 완료 아님.

# 재도전·은퇴 사건 통합 중 — 2026-11-01

원격71669c0 최신 일치 확인. [E07/E69 구현·근거·다음 범위](M2-RETRY-RETIREMENT-EVENTS-20261101.md). 집중 진로9/9·은퇴25/25 통과, 전체 검사 실행 중. 이전 전체958/956 통과를 이번 변경의 검증으로 합산하지 않는다.

# 최신 후속 검증 완료 — 2026-10-30

도전 E90 공개 조회와 만료 US 복귀 제안 회귀를 완료했다. 전체 npm run check 종료0: 엔진/API958중956통과·실패0·Neon환경2건 건너뜀, 웹22/22. 동결441파일 변경0. [상세·다음 M2 범위](M2-OUTBOX-RETURN-20261030.md). M2 전체 완료 아님.

# 후속 구현 검증 중 — 2026-10-30

`aae0228` 푸시·원격 일치 확인 후 [도전 공지·복귀 제안](M2-OUTBOX-RETURN-20261030.md)을 진행했다. 집중44/44·보관US1/1·제안/복무15/15, 전체 검사 실행 중. 이전 통과 수를 새 변경의 전체 통과로 표시하지 않는다.

# 최신 검증 완료 — 2026-10-30

원격 a46240c 최신화와 복귀/급여/날짜/수상/진로 사건 회귀를 통합했다. 전체 npm run check 종료0: 엔진/API950중948통과·실패0·Neon환경2건 건너뜀, 웹22/22. HTTP smoke 통과, 동결438파일 변경0. [검증·잔여·다음 작업](M2-SYNC-20261030.md). M2 전체 완료 아님.

# 최신화 재개 — 2026-10-30

실제 작업 위치 E:/AI/Game/baseball_career, codex/m2-career-engine. 원격 a46240c까지 반영했다. [현재 수정·검증](M2-SYNC-20261030.md)을 먼저 읽는다. 이전 마감 후 재개한 상태다. 전체 검사 로그 M2-SYNC-20261030-check.log와 exitcode를 확인한다. 아래의 이전 실행 세션/사용량 중단 상태를 현재 상태로 취급하지 않는다. PC 종료하지 않는다.

# 사용량 마감 체크포인트 — 2026-10-29

사용자 마감 기준은5시간 잔여8%. 마지막 조회에서사용99%/잔여1%가 확인되어 새 구현을 중단했다. PC 종료하지 않는다. 기준2f5c9f9 이후 현재 묶음을 미완료 체크포인트로 커밋·푸시한다.

[이번 구현·남은 범위](M2-20261029-BATCH.md). lint/전체 typecheck 통과 후 npm run check의 엔진/API 런타임이 실행 중이다. 이 체크포인트는 전체 통과 또는 M2 완료가 아니다. 진행 중 로그는 evidence/M2-20261029-BATCH-check.log, 커밋 가능한 시점 스냅샷은 evidence/M2-20261029-BATCH-checkpoint.log. 실행 세션38446이 살아 있으면 먼저 종료 결과를 확인한다. 빌드/정적 검사 이후 source는 동결했다.

## 다음 작업자가 먼저 처리할 것

1. 전체 로그의 완료/실패 목록을 먼저 확인한다. 전체를 처음부터 반복하지 말고 실패한 파일만 집중 재실행한다. 아직 전체 스택이 출력되지 않은 실패1건: career-achievements.test.ts 'international/posting and archive alone cannot invent milestones; A12 needs both actual leagues plus retirement receipt'. 현재 view는unavailableReason:null을 반환하지만 오래된 테스트는A04/A06에 사유가 있다고 기대한다. 두 기능은 실제 구현됐으므로 스택 확인 후 LOCKED/지원상태 기대값을 최신 계약에 맞춘다. A12 동작 자체를 약화하지 않는다.
2. 읽기 전용 리뷰 P2: pro-career-awards.ts assignment는DH도최다포지션에포함한다. DH60/CF50이면CF상자격이누락된다. 연간 포지션상은DH를제외한최다수비포지션으로선정하고별도회귀테스트를추가한다.
3. 읽기 전용 리뷰 P2: KBO미지명 후 실제US계약성공 시E06이열린채남는다. career-route-notices.ts settleNotices에서 실제 미국 signing receipt를 근거로종료/무효화하고 미지명→US계약회귀를추가한다. ACK로계약하지않는다.
4. source freeze436파일목록 evidence/M2-20261029-BATCH-source-freeze.json. 이후 수정 시변경파일/타입·lint·집중재검증을 기록한다. 미완료원장/급여/seed/공식경기/신원보존.
5. M2전체미완료: 프로방출/미계약준비root,미국귀국의무root,E07/E34/E35/E68/E69/E70/E99,99사건/24경로/PF-D 실제증거. atomicDB/M6/실기기별도. 최신사용자별칭결정과일반서사24경기/35%/균등은14에기록했다.

작업/Git/build: baseball-career-m2 / codex/m2-career-engine. V는문서Copy-Item만, V.git/강제푸시/훅스킵/main·M6병합금지. 현재원격해시는마감커밋의git log로확인한다.

# M2 일괄 구현 재개 — 2026-10-29

기준 커밋2f5c9f9, origin/codex/m2-career-engine 일치 확인. 작업은 baseball-career-m2 체크아웃이다. 사용자 마감 기준은5시간 사용량 **잔여8%**로 갱신했다. PC 종료하지 않는다. 구현 묶음 후 전체 npm run check1회, 이전 집중 통과 수를 새 변경의 검증으로 표시하지 않는다.

진행 중: 실제 독립48경기 루트/평생3회/KBO 재평가, 대학 AG owner의 건강·연간 체육요원 의무 및 프로 인계, 프로 포지션 적합도 실제 슬롯 증거와 연말+10/+3, 올스타·수상E25/E29. 조언 E19/E20/E26을45의 최신 조건으로 수정. 타입 검사에서 누락 root모듈과 readonly테스트오류를 찾았으며 수정 후 통합 검증 대기.

M2전체 완료 아님. 99사건/24경로/PF-D의실행증거·record correction transaction·native 복무/국제 조합은 계속 확인한다. M3두루트DB저장·M6·실기기범위는분리한다.

# 최신 작업 — US national + PS E84 + advice/retry/FA 집중 (2026-10-29)

- US national owner **4/4** → `77ddfb7`. 증거 `evidence/M2-US-NATIONAL-focused.log`.
- PS E84 KBO/US date+championship **4/4**. 증거 `evidence/M2-PS-E84-focused.log`.
- advice/repertoire **11/11**, retry/prep/return **4/4**, KBO FA **7/7**. 엔진 typecheck 통과.
- 국내 복귀 엔진 `acceptUsKboReturn` **6/6** 이미 있음. **atomic DB transport는 M3** (이 worktree에 api 패키지 없음).
- 전체 `npm run check`/Neon/브라우저/APK 미실행. college AG owner·99/24/PF-D·30일 복귀 확정 증거 잔여. M2약60% 유지. main/M6 병합·강제푸시·PC 종료 없음. V: 문서 Copy-Item만.

다음: **99사건/24경로/PF-D 실제 증거 → bulk 통합 full check → M3 dual-root CAS.**

# 최신 상태 — M2 BULK 통합 검증 통과 (2026-10-28)

원격 e26271b의 일괄 구현을 최신화하고 저장/사건 열람 경계를 수정했다. **전체 npm run check 종료0: 엔진/API844개 중842통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22.** lint·타입·build·엔진골든·이벤트·설계10종·Android셸·자산·HTTP 스모크 통과. 엔진/API duration_ms171601.1983, 소스 동결463파일 변경0. 실제 브라우저/Neon/Android 기기·전체24경로 통과는 아니다.

작업/Git은 E:/AI/Game/baseball_career·codex/m2-career-engine. 이전 4885afc 기반 로컬 시안은 origin/codex/m2-finish **8edf1ba**로 별도 보존했다. 중복 US4 계약 시안·별도 도전/UI를 최신 원장에 합치지 않았다. main/M6 병합·강제푸시·PC 종료 없음.

이번 수정: 없는 선택값 비교 오류, 낮은 국내 authority revision의 과거 목표 이력 보존, archive 열람 후 소유권 영수증 보존, 학교 목표 열람의 검증/재봉인, 봉인된 학교 루트의 일반 E94 읽기 거절, 무시한 E89의 뒤늦은 ACK. 제어 fixture와 기존 관계 테스트도 실제 투수 숙적 추가를 검증하도록 고쳤다. 첫 실패 로그를 보존했다.

다음(당시): **PS E84/학교 US year-end 관계 열람 wrapper → 미국 국제대회 owner·국내 세계 atomic handoff → 전역 후30게임일 복귀 확정 →99사건/24경로/PF-D 실제 증거.** 사용자 확정 기한은13/14/21에 기록했고 실행은 후속이다. M2 약60%는 기존 범위 추정으로 유지하며 전체 완료 아님. [이번 구현·검증·인계](M2-RESUME-20261028.md).

# 최신 작업 — M2 일괄 연결 체크포인트 (2026-10-28)

현재 구현 커밋 **7572941**. 정적 검사 통과·런타임 통합 대기. 이 문서 핀의 Git log와 origin/codex/m2-career-engine을 비교하고 이어갈 것. 마지막 전체 통과 EL271900f와 혼동하지 않는다.

먼저 [현재 구현·원장 소유권·검증 대기·남은 작업](M2-BULK-CHECKPOINT.md)을 읽는다. EL271900f가 마지막 전체 통과 기준이다. 현재 반복 갱신/E61/긴급 대표/목표 사건/국내 복귀/US후보/투수숙적·T14/프로 정규E84 변경은 런타임 검증 대기다. source helper와 실제 저장·경기 caller 미연결을 구분하며 M2 완료를 주장하지 않는다. 테스트는 모아서 최종 통합한다. frontend-design 추가 적용, 기존 승인 시각 방향 유지.

# 최신 작업 방식 — M2 일괄 구현 (2026-10-28)

사용자가 작은 단계별 전체 검사 반복을 중단하고 남은 M2를 구현한 뒤 통합 검증하도록 변경했다. [일괄 구현/테스트 작업판](M2-BULK-IMPLEMENTATION-AND-TEST-PLAN.md)이 현재 기준이다. 구현 중/구현 완료·검증 대기/검증 통과를 구분한다. 최신 full pass는EL271900f이며 현재 미커밋 변경은 그 통과 수에 포함하지 않는다.

# 최신 상태 — M2-EL 검증 완료 (2026-10-28)

[상세](M2-EL-MINOR-MARKET-ACCEPT.md). 마이너 만료 제안 수락·E66 DOMAIN 닫기·1년/$30k·원/타 구단 이동·재무 재생. 집중9/9, 전체 npm run check 종료0: 엔진/API 796개 중794통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산 통과. duration_ms 962830. 실제 Neon/브라우저/APK 검증은 아니다. 국내 복귀 실행은 후속. 다음은 [EL 이후 구현 인계](M2-POST-EL-IMPLEMENTATION-PLAN.md). 원점 없는 legacy KBO 저장을 현재 예산으로 자동 복원하지 않는다. M6/main 임의 병합·강제푸시·훅 스킵 금지, V는 문서 Copy-Item만. M2약60%·전체 미완료.

# 세션 마감 — M2-EK 푸시 확인 (2026-10-28)

사용자가 잔여9% 시점에 커밋/푸시 마감을 요청해 새 구현을 멈췄다. 기능 c8c73b2fb5e6670f6f19e826512d687304bcb69c를 own branch origin/codex/m2-career-engine에 푸시하고 동일 해시를 확인했다. 전체794/792·실패0·Neon환경2·웹22/22·HTTP 스모크 통과. 마지막 중복 CR1개 정리는 TypeScript emit 동일을 검증했다. 소스 WIP 없음. M2약59%·전체 미완료. PC 종료 안 함.

다음은 [EK 이후 구현 인계](M2-POST-EK-IMPLEMENTATION-PLAN.md)를 읽는다. 현재 EK는 실제 봉인 제안/예산·포지션 수요 비교와 E66 두 조회까지다. 계약 수락/새해 재무 재생/조직 이동/실제 US→KBO 최신 세계 인계는 아직 없다. 원점 없는 legacy KBO 저장을 현재 예산으로 자동 복원하지 않는다. M6/main 임의 병합·강제푸시·훅 스킵 금지, V는 문서 Copy-Item만.

# 최신 상태 — M2-EK 검증 완료 (2026-10-28)

[상세](M2-EK-MINOR-MARKET-COMPARISON.md). 만료 마이너 실제 제안/예산·수요 비교 창과 E66 두 조회 연결. 집중7/7, 전체 npm run check 종료0: 엔진/API 794개 중792통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 998088.3797, 동결 대상461파일 실행 동결 확인. 이후 중복 CR1개만 정리했고 TypeScript emit은 동일하다. 실제 Neon/브라우저/APK 검증은 아니다. 조회만이며 계약 수락·이적·국내 복귀 실행은 후속이다. 이전 EJ 기능12af4ff/핀f5b16ad 푸시 확인. M2약59%·전체 미완료.

# 최종 푸시 확인 — M2-EJ (2026-10-28)

기능12af4ff9b0420e3f63c92f981657c4c8b7c671fc를 origin/codex/m2-career-engine에 푸시하고 동일 해시를 확인했다. 작업 트리는 깨끗하다. 전체787/785·실패0·Neon환경2·웹22/22·HTTP 스모크 통과. M2약58%·전체 미완료. 첫 전체 검사의 오류 코드1건은 기존 계약을 복원하고 재검증했으며 실패 로그도 보존했다.

다음은 새 마이너 계약 시장과 실제 US→KBO 인계다. 사용자 확정은1년·연$30,000, 원구단과 타 구단 최대3곳·국내 복귀 비교, 모든 새 마이너 계약에서 현재 레벨 유지다. 첫 KBO 마이너 MLB 콜업은 해당 시즌만 계약, 이후 FA 전1년 재계약이다. 국내 세계/최신 선수 인계는 아직 미구현이다. 원점 없는 구 KBO 저장의 과거 예산은 추정하지 않는다. PC 종료·main/M6 병합 금지.

# 최신 상태 — M2-EJ 검증 완료 (2026-10-28)

[상세](M2-EJ-KBO-US-CONTRACT-ORIGIN.md). 새 KBO 미국 계약 원점·시작 나이·다년 MLB/마이너 연도 재생·첫 콜업 급여/1년 전환·서명 기간 만료를 연결했다. 집중10/10+추가2/2, 전체 npm run check 종료0: 엔진/API 787개 중785통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 810442.1035, 동결 대상460파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. EI d819f51은 원격 일치 확인. M2약58%·전체 미완료. 만료 시장/국내 복귀 인계는 다음이며 사용자 결정을 다시 묻지 않는다.

# 작업 재개 — 사용자 지시 (2026-10-28)

사용자가 세 스킬 적용과 작업 재개를 지시했다. 이전 중단 실행은 완료 증거에서 제외하고 전체 검사를 새로 실행했다. 새 마이너 제안1년·연$30,000 결정은14/23에 기록했으며 실행 연결은 후속이다.

# 최신 상태 — M2-EI 검증 완료 (2026-10-28)

[EI 상세](M2-EI-NATIONAL-PITCHER-REST.md). 대표 SP3세계일 휴식·RP/CP2일 연속 실제 등판 뒤 휴식을 날짜 기반 실제 준비에 연결. 국내 등판 포함·당일/미래/전년/벤치 제외·legacy/준비된 경기 보존. 집중17/17+최종3/3, 전체 npm run check 종료0: 엔진/API 781개 중779통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1179771.366, 동결 대상456파일 재개 기준점 이후 변경0(이전 중단 기준과4파일 바이트 차이는 freeze.resumed 기록). 실제 Neon/브라우저/APK 검증은 아니다. M2약57%·전체 미완료. 다음은 미국 계약 원점/서명기간 연결 등. fetch한main/M6는 미병합.

# 최종 푸시 확인 — M2-EH (2026-10-27)

최신 기능 **13392bc855d1a66afd70563be9f5cba7e269f817**를 origin/codex/m2-career-engine에 푸시하고 원격 해시 일치를 확인했다. 실행 코드 WIP 없음. 이 최종 핀은 문서만 변경한다. 전체778/776·실패0·Neon환경2·웹22/22·집중26/26·스모크 통과. 이전 기능 EF cb1538d, EG62b2e9b도 같은 브랜치에 있다.

5시간 잔여4% 확인 후 사용자 기준에 따라 새 작업을 멈추고 진행 문서/증거를 저장했다. [다음 구현 계획](M2-POST-EH-IMPLEMENTATION-PLAN.md)을 읽고 이어갈 것. 승인된 MiLB 서명 기간 종료 비교·RP/CP2연투 뒤 휴식은14/20/23에 기록됐고 실행 구현은 다음 묶음이다. 다시 질문하지 않는다. M2약57%·전체 미완료. PC 종료 안 함. V: 문서만 Copy-Item.

# 세션 마감 체크포인트 — M2-EH (2026-10-27)

5시간 한도 사용96%·잔여4% 확인으로 사용자5% 마감 기준 도달. 새 묶음 중지, EH까지 검증/정리해 own branch에 커밋·푸시한다. 전체778/776·실패0·Neon환경2·웹22/22·집중26/26·스모크 통과. PC 종료 안 함. 기능 해시는 푸시 뒤 최종 인계 핀에서 확정한다.

[EH 상세](M2-EH-NATIONAL-INJURY-BOUNDARY.md) · [다음 연결 계획](M2-POST-EH-IMPLEMENTATION-PLAN.md) · [사용량 체크포인트](evidence/M2-EH-usage-checkpoint.json). 최신 사용자 결정2개는14/20/23에 기록했으나 미국 MiLB 만료 비교/대표 불펜2연투 휴식의 추가 runtime 구현은 아직 하지 않았다. E61 성공 강등/OPEN_RIGHTS도 남았다. 이 답변을 다시 물어보지 말 것. M2약56%·전체 미완료. 실행 코드/테스트는 full gate 이후 변경0이며 추가 변경은 문서/증거뿐이다. V: 문서 Copy-Item만.

다음 구현은 [EH 이후 연결 계획](M2-POST-EH-IMPLEMENTATION-PLAN.md)을 함께 읽는다. 이 계획의 미국 계약 원점/대표 휴식/긴급 합류/E61은 아직 미구현이다.

## 신규 확정 결정 (2026-10-27, 구현 후속)

KBO 출신 MiLB는 서명 기간 종료 뒤 미국 재계약/FA/국내 복귀 비교(고교6시즌 추가 적용 안 함). 대표 RP/CP는 이틀 연속 실제 등판 뒤 다음 날 휴식.14/20/23에 기록했다. 아래 이전 답변 대기 문구는 이 답변 전 이력이다. 현재 EH full gate의 실행 코드는 동결돼 이 결정의 추가 runtime 수정은 다음 묶음이다.

# 최신 상태 — M2-EH 검증 완료 (2026-10-27)

[EH 상세](M2-EH-NATIONAL-INJURY-BOUNDARY.md). 첫 한국 경기 전/다음 라운드의 부상 교체를 실제 prepare에 연결, 같은 GROUP/준비된 경기/과거출장 보존. 의료·90/100 전력은 통제 fixture, 결과16경기와 JSON 재개는 실제 실행. 후보 고갈은 원본 유지 거부. 전체 npm run check 종료0: 엔진/API 778개 중776통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 716580.0985, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. 최초 비자격 하위리그 긴급합류/US 풀/99/24는 남았다. M2약56%·전체 미완료.

# 최신 기능 체크포인트 — M2-EG (2026-10-27)

기능 **62b2e9b9f43e8705b45bdb8dac5b46a6cfa7b961**를 own branch origin/codex/m2-career-engine에 푸시하고 해시 일치를 확인했다. 전체775/773·실패0·Neon2·웹22/22·집중15/15·스모크 통과. 실제 KBO 진입 신원→통제7등록시즌 포스팅→미국 캠프→실제75경기·급여를 확인했다. M2약56%·전체 미완료.

다음: 대표 부상 교체의 첫 경기 전/라운드 경계 연결. KBO 출신의 MiLB 계약 만료 정책은 사용자 답변 대기. 미국 history/callup의 고교 원점 가정·미국 공통 후보·정규/PS 전체 감사·99/24/PF-D 잔여. E49~54는 감사에 부분 엔진 증거로만 기록했고 native18개월/UI 완료가 아니다. PC 종료/M6 병합 금지. V: 문서 Copy-Item만.

# 최신 상태 — M2-EG 검증 완료 (2026-10-27)

[EG 상세](M2-EG-OVERSEAS-ENTRY-CONTINUITY.md). KBO→미국 병역 완료/비대상 보존·동일 세계/seed/다음 시즌 검사·연말 조회의 없는 고교 미국계약 접근 수정. 포스팅→캠프→실제 미국75경기·지급·JSON 재개 검사(과거7시즌은 통제 fixture). 전체 npm run check 종료0: 엔진/API 775개 중773통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 663675.2997, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. M2약56% 유지·전체 미완료. 마이너 계약 만료 정책 질문 답변 대기.

# 최신 기능 체크포인트 — M2-EF (2026-10-27)

기능 **cb1538d1d082682efe1bd63c95e7330bda19d47f**를 origin/codex/m2-career-engine에 푸시하고 원격 일치를 확인했다. 전체774/772·실패0·Neon2·웹22/22·집중26/26·스모크 통과. WBC47경기·21일→캠프→국내10경기, 새 미국75경기와 legacy75 고정해시를 별도로 검사했다. M2약56%·전체 미완료.

다음: KBO→미국 활성화의 병역 초기화와 연말의 고교 미국계약 가정 확인. 포스팅/MiLB 계약 만료 정책은 사용자에게 질문 중이며 답변 전 새 보유기간을 임의 확정하지 않는다. 대표 부상 교체/미국 공통 풀·전체 정규/PS 감사·99/24/PF-D는 남았다. PC 종료/M6 병합 금지. V: 문서만 Copy-Item. 아래 EE의 WBC 질문은 EF에서 답변/반영한 과거 이력이다.

# 최신 상태 — M2-EF 검증 완료 (2026-10-27)

[EF 상세](M2-EF-WBC-PROFESSIONAL-CALENDAR.md). 사용자 WBC 결정 반영: 신규 프로 calendar-2는 WBC 종료 뒤 개막, 구 calendar-1/고정해시/원장 보존. WBC47경기·21일→캠프→실제 KBO10경기, 신규 미국75경기와 legacy75 해시 별도 검사, E46 첫 FINAL 알림. 전체 npm run check 종료0: 엔진/API 774개 중772통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 672040.6242, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. M2 전체 미완료. EE의 날짜 답변 대기 문구는 아래 과거 이력이다.

# 최신 기능 체크포인트 — M2-EE (2026-10-27)

기능 **fa61a6e319df58ab452ca024664d30d782195b68** (`fa61a6e`)를 `origin/codex/m2-career-engine`에 푸시하고 원격 해시 일치를 확인했다. 실행 코드 미커밋 WIP 없음. 이 인계 핀은 문서만 변경한다. 전체769/767·실패0·Neon2·웹22/22, 집중22/22. 실제28 AG16경기/14일 및 복귀 후 실제 국내10경기이며, 대회 전 정규 구간은 CONTROLLED_PREFIX다. M2 전체 완료 아님.

다음 작업 전 **WBC 날짜 질문 답변부터 확인**: 현재 정규2/1·WBC2/8은 개막전 WBC 설계와 충돌. 선택지는 새 시즌 정규를 WBC 종료 뒤로 배치(권장) 또는 WBC를1/11~31로 이동이다. 답변 전 임의 확정 금지. 진행된 저장/경기/seed 보존. 국제 교체·미국 공통 풀·전체 정규/PS 감사·99/24/PF-D는 잔여. PC 종료/M6 병합 금지.

## 최신 작업 — M2-EE 검증 완료

[EE 상세](M2-EE-NATIONAL-PHASE-DAY-AUDIT.md). 새 국제 단계·14일 연속 날짜/건강 감사·E48 정규 복귀, FINAL XP 원본 참조 공유 수정. 집중22/22. 전체 npm run check 종료0: 엔진/API 769개 중767통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 633942.4905, 동결 대상454파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. AG 전 정규 구간은 통제 prefix이며 전체 시즌 아님. WBC 개막 날짜 충돌 사용자 답변 대기. M2약55% 유지·완료 아님. PC 종료 금지.

## 최신 작업 — M2-ED 검증 완료

[ED 상세](M2-ED-NATIONAL-INJURY-TICK.md). 국제 한국 FINAL당 부상 잔여 소모. 전체 check 767/765·duration_ms 745981. M2≈55%. 다음=정규 일마감 감사·INTERNATIONAL phase·99잔여·24/PF-D. M6 금지. PC 종료 금지.

## 최신 작업 — M2-EC 검증 완료

[EC 상세](M2-EC-NATIONAL-DAY-CLOSE.md). 초청 7/2/1·날짜 피로 1회. 전체 check 767/765·duration_ms 1103862. M2≈55%.

## 최신 작업 — M2-EB 검증 완료

[EB 상세](M2-EB-POSTING-EVENT-RESUME.md). E62·E64 ACCEPT/REMAIN. 전체 check 766/764·duration_ms 1011454. M2≈54%.

## 최신 작업 — M2-EA 검증 완료

[EA 상세](M2-EA-POSTING-EVENTS.md). E63/E64 포스팅 큐·완료/취소. 전체 check 765/763·Neon2·웹22/22. duration_ms 624903. M2≈53%.

## 최신 작업 — M2-DZ 검증 완료

[DZ 상세](M2-DZ-US-MILITARY-18MO.md). 해외18개월 2블록. 전체 check 765/763. M2≈53%. 다음=국제 일마감/기한·99사건·24경로/PF-D. M6 금지. PC 종료 금지.

## 최신 작업 — M2-DY 검증 완료

[DY 상세](M2-DY-INTERNATIONAL-TIMELINE.md). 커리어 AG↔DX bracket·실제28·FINAL 기록/XP·P12 window. 전체 check 765/763·Neon2·웹22/22·스모크. PC 종료 금지.

## 최신 작업 — M2-DX 검증 완료

[DX 상세](M2-DX-INTERNATIONAL-BRACKET.md). 순수 대진 reducer. 커리어 연결은 DY로 이어짐. PC 종료 금지.

## 최신 작업 — M2-DW 검증 완료

[DW 상세](M2-DW-NATIONAL-SELECTION.md). 사용자 확정: 당해 충분 표본 중 최고리그, 없으면 전년(단 WBC 전년만). 실제28명 봉인·E44/E45·한자리 충원·실제 AG 기용, 실제 MLB 데뷔 E65·PF-D08/09/11/13 엔진검사. 집중25/25. 전체 npm run check 종료0: 엔진/API 757개 중755통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1168717.4243, 원본441파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. 국제 달력/중단/부상/XP·미국 통합·99/24/PF 잔여, M2 완료 아님. PC 종료 금지.

## 최신 상태 — M2-DV 국가대표 연결 검증 완료

[DV 상세](M2-DV-NATIONAL-INTEGRITY.md). E44/E46/E47/E48/E55·실제 AG 기록·투수 출장·체육요원 시즌 중복 차감 방지. E45/28명 AI·부상/XP·중단 worker는 후속이며 M2 완료 아님. 집중16/16. 전체 npm run check 종료0: 엔진/API 741개 중739통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 804191.6272, 원본434파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다.

## 인계 — 2026-10-27 DU까지 푸시, GPT 이어감

DT `86f068b` + DU(AG 실경기) 푸시. [HANDOFF-TO-GPT](HANDOFF-TO-GPT.md). 다음=E44–48/E55→99잔여→24경로·PF-D. M2 미완료·약50%. PC 종료 금지.

## 최신 상태 — M2-DT 국가대표 혜택 · 전체 검사 통과

[DT 상세](M2-DT-NATIONAL-BENEFIT.md). 초청/결과 봉인·ATHLETE_ELIGIBLE·체육요원. 전체 npm run check 종료 0: 735개 중 733 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 619230.9032. 증거 `evidence/M2-DT-check.log`.

## 최신 상태 — M2-DS 해외 병역 계획 · 전체 검사 통과

[DS 상세](M2-DS-US-MILITARY-PLAN.md). 28세 기한 FREEZE/TERMINATE·완료. 전체 npm run check 종료 0: 732개 중 730 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 726746.4544. 증거 `evidence/M2-DS-check.log`. 다음은 국가대표·99사건·24경로·PF-D. M2 영역 약 50% 유지. PC 종료 금지. M2 싹 다할 때까지 중단하지 않는다.

## 최신 상태 — M2-DR 미국 루트 활성화 · 전체 검사 통과

[DR 상세](M2-DR-US-ACTIVATION.md). 포스팅/해외FA → `activateKboUsCareer`. 전체 npm run check 종료 0: 731개 중 729 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 694977.322. 증거 `evidence/M2-DR-check.log`. 다음은 해외 병역·국가대표·99사건·24경로. M2 영역 약 50% 유지. PC 종료 금지.

## 최신 상태 — M2-DQ 해외 FA·귀국 · 전체 검사 통과

[DQ 상세](M2-DQ-OVERSEAS-FA-RETURN.md). 해외 FA 9시즌·보상금 없음·국내권 RELEASED, 포스팅 귀국 원구단 협상. 전체 npm run check 종료 0: 730개 중 728 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 825735.1666. 증거 `evidence/M2-DQ-check.log`. 다음은 미국 루트 활성화·해외 병역·99사건·24경로. M2 영역 약 50% 유지. PC 종료 금지.

## 최신 상태 — M2-DP 포스팅 · 전체 검사 통과

[DP 상세](M2-DP-POSTING.md). 7시즌 등록·병역 COMPLETED/NOT_APPLICABLE·오프시즌 포스팅 요청, 구단 점수 승인/보류, 고정 제안, 체결 시 복귀권·구단 보상금. 미국 커리어 루트는 만들지 않았다. 전체 npm run check 종료 0: 엔진/API 728개 중 726 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 774374.7154. 증거 `evidence/M2-DP-check.log`. 다음은 해외 FA·국내 복귀·미국 루트 활성화. M2 영역 약 50% 유지. PC 종료 금지.

## 최신 상태 — M2-DO 원소속 FA · 전체 검사 통과

[DO 상세](M2-DO-MAJOR-FA.md). origin/main f087e00(M3/M9 PR13, 6cf02c3)을 이 브랜치에 병합했다. 강제 푸시 없음. DN c95f251은 부모로 남는다. 6시즌 뒤 원소속 FA 1건, 보장 연차 연봉 동결, 옵션 3시즌 소진 시 STAY/FA 선택을 넣었다. 다른 구단 이적·포스팅·귀국·해외 병역은 없다. API/화면 미연결. 전체 npm run check 종료 0: 엔진/API 725개 중 723 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 917911.8787. 골든 SHA256 113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92. 증거 `evidence/M2-DO-check.log`. 브라우저/Neon/실기기 아님. M2 영역 약 50% 유지. 다음은 포스팅/귀국이다. PC 종료 금지.

## 원격 통합 주의 — 2026-10-27

검사 도중 origin/main에 f087e005ee4495fd12d729a301d3cc27334ec96d(M3/M9 수정 PR13)이 추가됐다. DN 검증은 DM7e8180a 기반 M2 브랜치의 증거이며 이 새 main 수정의 통합 검증은 아니다. main을 덮어쓰지 않고 codex/m2-career-engine에 커밋/푸시한다. 다음 작업자는 이 브랜치 DN을 보존해 main과 병합하고 통합 검사를 진행한다. 사용자는 잔여7%를 알리며 현재 묶음 완료 뒤 커밋/푸시하도록 변경했다. 다음 묶음은 시작하지 않으며 PC 종료하지 않는다.

## 최신 상태 — M2-DN 묶음 검증 완료

[DN 상세](M2-DN-MAJOR-RENEWAL.md). 상무/현역 목표 예외·MLB FA 전1년 재계약·루트4·급여/옵션/서비스 보존·재승격 중복 계약 방지를 묶었다. 전체 npm run check 종료0: 총716개 중714통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms839708.6663, 동결418파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 집중 계약5/5·목표12/12. 실제 첫날75경기와 통제7시즌을 구분한다. 직전 완료 DM7e8180a. DN 현재 변경은 이 검증 뒤 커밋/푸시한다. 다음은 MLB FA/옵션 권리·포스팅/귀국·해외 병역/국제다. 사용자 지시: 잔여5%면 진행 기록/커밋/푸시, PC 종료 금지. 아래 과거 잔여5% PC 종료 문구는 철회된 이력이다.

## 이전 DM의 다음 묶음 안내 (DN에서 목표 예외와 연간 재계약 구현)

상무 복무 중 목표의 실제 팀은 원구단이 아닌 SANGMU다. 현역은 실제 경기 등록이 없어 새 목표 자격/교체 UI를 구분해야 한다. 현재 기본 목표 등록 어댑터의 이 두 예외를 먼저 보강한다. 그 다음 미국 메이저 재계약/FA/옵션 권리·계약 스키마/재정/일할 원장을 확장한다. M2 계속 진행·PC 종료 금지. 국제 상대65/55/45 프리셋 문서는 V:의 병렬 설계 변경을 보존했으며 실제 경기 구현을 주장하지 않는다.

## 최신 구현 — M2-DM 시즌 목표10종 · 전체 검증 완료

[DM 상세](M2-DM-SEASON-GOALS.md). PRE3/중반교체1·범위 고정·기념 전용·E90 불변 outbox·마감 해시 전 정산을 학교/KBO/미국에 연결했다. 집중11/11, native고교8경기/선수권2경기. 전체 npm run check 종료0: 총710개 중708통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms809722.8611, 동결412파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 다음 소스 편집 가능. 직전 DL7489497 main/작업 브랜치 모두 푸시했다. 미국 최종 연봉800000 보장 및 계약 시작 나이별5/3/2/1년 제안 기간 확정(13/14); 다음 미국 재계약/FA에 적용. 목표의 계정 DB/소식 읽기 소비자는 이 엔진 검증 범위가 아니다. 최신 지시: M2 계속, 종료 금지.

## 최신 구현 — M2-DL 미국 은퇴/보관 · 전체 검증 완료

수동 E36 확인/취소·확정/E37,45세 은퇴·공개 보관 DTO를 추가했다. [DL 상세](M2-DL-US-RETIREMENT-ARCHIVE.md). 집중4/4, 기존 연도7건 유지. 전체 npm run check 종료0: 총699개 중697통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms496580.9465, 동결410파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 다음 구현 편집 가능. 실제 장기 커리어/DB 보관 완주가 아니다. 미국 최종 최저연봉800000 보장 질문 답변 대기. 최신 사용자 지시: M2 완성까지 계속, PC 종료 금지.

## 사용자 최신 지시 — 2026-10-27

사용자는 체크포인트946bd4e 푸시 뒤 “마무리 하지말고 M2 완성, 종료도 하지마”로 변경했다. 이전 잔여5% 중단/PC종료 지시는 철회됐다. 종료 명령/예약은 실행하지 않았다. DK 전체 검사와 HTTP 스모크가 통과했다. 전체 npm run check 종료0: 총695개 중693통과·실패0·Neon환경 부재2개 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms562628.2466, 동결406파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 다음 작업자는 현재 실행 여부/결과부터 확인하고 재검증 통과 뒤 미국 메이저 재계약/FA를 같은 체크아웃에서 이어간다.

# 다음 환경 구현 인계 — 2026-10-26

## 최신 상태 — M2-DK 전체 검증 완료

미국 마이너 연도 이월/루트3·승격 우선 Rookie 공급·공식 일정 구종 분기·부상 대체 교환 보호·MLB100등록/6시즌 서비스까지 구현했다. [DK 상세](M2-DK-US-YEARS-LEARNING-SUPPLY.md). 구종7/7·공급/승강11/11·서비스2/2·연도7/7. 통제6시즌과 실제 새해75경기/PS46경기를 구분한다. 2026-10-27 사용량97%사용/3%남음 확인으로 사용자5%중단 기준에 따라 보존. DK 전체 첫 검사는695개 중692통과·1실패·Neon환경2건 건너뜀. 레거시 잘못된 저장 입력의 오류 코드/누락 주인공 검증을 수정했고 해당 회귀1/1·lint·typecheck는 종료0. 수정 후 전체 npm run check 재실행은 미완료이며 DK를 전체 검증 완료로 표시하지 않는다. 위 내용은946bd4e 보존 시점 기록이며 이후 최종 재검증이 통과했다. 전체 npm run check 종료0: 총695개 중693통과·실패0·Neon환경 부재2개 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms562628.2466, 동결406파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. M2 전체 미완료.

다음은 미국 메이저 재계약/FA·옵션 소진 동의/정리 경로, 포스팅·국내 복귀, 해외 병역/국가대표, 남은99사건/24경로다. startNextUsMinorSeason은 원래6시즌 안의 마이너만 개시하며 Major/FA는 CONTRACT_DECISION_REQUIRED다. MLB 서비스 helper와 부상 등록 포함 사용자 결정은13/14에 반영했다. 서버 재정 추가 입력을 UI payload에 직접 노출하지 않는다.

US1/2 기존 저장 보존, 검증된 새해 명령만3 생성. 원본 불변/JSON/과거 금융 연결 검사가 있다. 과거 게임 원장이 여전히 root에 있어 장기 분리 저장은 필수 후속이다(실제3857경기 JSON409498755B). 원시 기록을 삭제하는 축소는 하지 않았다. DI native 지문을 우회해 현 소스로 재개하지 않는다.

사용량 최신 확인97%사용/3%남음.. 과거75%와 같은 구간이 아니다. 리셋 크레딧 미사용. 실제 잔여5%에서 진행/증거/검증/커밋·푸시·원격을 정리하고 정상 PC 종료하는 사용자 지시 유지. 작업/Git/build는 baseball-career-m2, 별도 구현 초안 없음, V: 보호 미러·V:/.git 생성 금지.

## 최신 상태 — M2-DJ 전체 검증 완료

구종 숙련0 XP 이월/다음 PRE 같은 구종 재학습과 실제 MLB PS worker를 연결했다. 구종 집중23/23, PS/순위/성장8/8. 정규8790경기는 통제 fixture이고 PS만 native 우승까지다. [DJ 상세](M2-DJ-RELEARNING-AND-MLB-POSTSEASON.md). 전체 check 종료0: 엔진/API676통과·Neon2건 환경 부재 건너뜀·실패0, 웹20/20. lint/타입/build/골든/이벤트/설계10종/Android·자산·HTTP 스모크 통과. 동결399파일 변경0, duration_ms1008130.2884. 실제 PS46경기(day240~285)·US25 우승·급여30000불변. 다음 묶음의 전체 검사는 관련 기능을 모아1회 실행한다. 직전 DI230897f는 main/작업 브랜치 모두 푸시했다.

사용자 추가 확정: 미국 은퇴 공석은 조직 내 승격 우선, 신인은 Rookie에만 보충(14/13). 상위 레벨 외부 평균선수 즉석 생성 금지. 아래 레벨로 공석을 연쇄 보충하고 기존 선수의 신원/능력/기록은 그대로 유지한다. 장기 실력 균형 통과를 주장하지 않는다.

구종 후속 점검도 필요:57의 분기 완료는 등록리그 일정 진행률이고 실제 XP 분모는 해당 분기의 등록일이다. DI helper는 현재 개인 등록 영수증 수로 분기 경계를 계산하므로 무등록 기간/군 복무/짧은 레벨로의 이동에서 분기4회 정산이 지연될 가능성을 검사해야 한다. 일정 완료와 건강 등록 비율을 분리하고 분모0은 지급0/예약 해제로 처리한다. 규칙은57에 이미 있으며 새 무료 성장을 만들지 않는다. 다음 DK에서 먼저 일정 기준/등록 비율을 분리하는 회귀 검사를 추가한다. 계획의 최초 등록 리그 일정/경기ID를 봉인하고 각 경계까지 FINAL 공식 기록을 확인한다. 분기 분모는 그 날짜 구간의 실제 등록, 건강 비율만 XP에 반영한다. 이미 지급된 구 저장 분기와 달라지면 영수증을 덮거나 재지급하지 않고 명시적 호환 오류로 막는다.

다음은 미국 연도 이월/공급·6시즌 마이너 권리·MLB100등록경기 서비스/6시즌FA·계약·45세 은퇴, 해외28세 병역 기한·복귀·국제대회다. 현재 usCareerView가 첫 미국 시즌/아마추어 signing/초기 inventory에 강하게 묶여 있으므로 이 증거를 버리지 않고 연도 이월 영수증/이전 시즌과 연결해야 한다. 시즌마다 계약금 재지급/서비스·옵션 사용 리셋/연간 XP 재지급을 막아야 한다. 재정은 기존 initialUsRecruitmentInventory와 같이 신뢰할 수 있는 서버 재정 입력을 받으며 능력치로 예산을 추정하지 않는다.

M2 작업은 계속 baseball-career-m2 체크아웃에서 직접 진행하고 별도 구현 초안을 만들지 않는다. V: 보호 미러·V:/.git 생성 금지. 병렬 M6 코드는 섞지 않는다. DI native3857경기 저장은 이전395파일 지문으로 봉인되어 현재 DJ 소스에서 바로 재개하면 안 된다. 완료/근거/미실행을 구분한다.

## 최신 상태 — M2-DI 전체 검사 완료 (2026-10-26)

기존 M2 체크아웃에 직접 구종 학습 분기/학교 명령/상무 경로·건강 원장 복제 개선·미국 다일 진행 참조를 구현했다. 전체 npm run check 종료0: 총673 중671통과·Neon 환경 부재2개 건너뜀·실패0, 웹20/20. lint/타입/build/골든/이벤트/설계10종/Android·자산 검사와 HTTP 스모크 통과. 집중27/27+8/8은 중복 합산하지 않는다. [DI 상세](M2-DI-PITCH-LEARNING.md).

origin/main6eda98e(M8/M9 셸)를 병합하며 문서는 양쪽 보존했다. 병렬 M6-F 보고는 STATUS에 보존했지만 그 브랜치 런타임을 이 M2 검사에서 검증한 것은 아니다. 전체 가중78%/남음22%는 다른 영역 보고 포함 추정이며 M2 영역50%는 유지한다. 작업/Git/빌드: baseball-career-m2 / codex/m2-career-engine. 별도 구현 초안 사용 금지, V:는 보호 미러·V:/.git 생성 금지.

**바로 다음 DJ:** 사용자가 부상 등으로 숙련1 미만인 구종의 기존 XP 보존·다음 PRE 같은 구종 학습 재선택을 확정했다(14/57). 현재 schoolYearEndRepertoire의 숙련1 강제가 이월을 막고 beginPitchLearning의 book 보유 거부가 재선택을 막는다. 네 분기/예약 해제 검사는 유지하되 숙련0 완결 계획을 정상 이월하고 새해 재선택 시 XP를0으로 덮지 않게 공통 함수와 실제 대학 진입 회귀 검사부터 고친다. DI 동결 뒤 결정이라 아직 코드 미반영. 이후 MLB PS·미국 다음 해/FA·해외 병역/국가대표와 전체24경로를 계속한다.

미국 native는3857경기·마감80일·호출1757에 PARTIAL_SAFE_STOP. 진행 날짜 중간의 FINAL 기록도 포함되어8790 완료가 아니다. 전체 검사와의 경쟁을 피하려 STOP 파일을 뒀다. [재개 안내](evidence/M2-DI-native-checkpoint-notes.md)의 지문을 지키며 소스 변경 후 임의 재개 금지. DD18개월도 별도 미완료. 실제 사용량 최신 조회27%사용/73%남음·주간4%사용, 리셋 크레딧 미사용. 실제 잔여5%에서 정리·커밋·푸시·원격 검증 후 정상 PC 종료 요청 유지.

## 최신 검증 완료 — M2-DH (2026-10-26)

미국 준비/일정/실제 경기/공통 급여/부상 대체/승강/옵션/성장과 특성 성능 개선을 묶어 구현했다. 전체 check 엔진/API663·웹20 통과·실패0·Neon2환경 미설정 건너뜀. 테스트748933ms. [DH 상세](M2-DH-US-FIRST-SEASON.md). 원본332개를 고정해 검사했다. user 요청대로 전체검사는 묶음당1회; 타입 검사에서 발견한2개 테스트의 readonly 대입은 수정 후 정식 결과를 다시 검증했고 superseded 로그로 보존했다.

미국 native 실주행은 별도이며 최신 저장 58일·2400경기·AA다. V:/.local-verification/M2-DH-US-native/latest.json과코드zip을 사용한다. 첫 복무 DD는 기존부분상태 그대로이며완료로 표시하지 않는다. 다음 DI 초안은 C:/Users/N-052/AppData/Local/Temp/baseball-M2-DI-us-lifecycle에 격리했다. 구종 학습분기 실제 연결, 다일 청크 메타데이터 수정, 미국 연도 전환/FA/은퇴 등을 이어간다. 현재 M2 전체 완료 아님. main은 병렬 6eda98e까지 달라져 자동 덮어쓰지 않고 M2 브랜치를 보존한다.


## 이전 작업 — M2 미국 시즌 묶음 (2026-10-26)

사용자 요청: 작은 기능마다 전체 검사를 반복하지 않고, 관련 기능을 묶어 집중 검사 후 전체 check1회. 작업은 baseball-career-m2 / codex/m2-career-engine. origin/main82a5f8d의 M3/M4/M5/M7을 merge --no-commit으로 통합 중이며, 문서 충돌을 양쪽 보존해 정리했다. 통합 최종 검사는 아직이다. V:/.git 금지.

이전 DG314939b /637개 통과는 별도 원본의 증거다. 현재 DH 프리시즌/일정 패치를 실제 반영했고, us-season/us-roster-repair/us-growth/us-windows를 작성 중이다. 초기 집중8/8(실제75경기/JSON/급여)과 후속 시즌6/6(부상 대체·성장 미완료 거부) 통과. 새 전체 결과는 아직 없다. 실제 연간 성장 긍정/승강/연도 전환/MLB PS·국제대회·24통합 경로는 남아 있다. 전체 M2 완료라고 표시하지 않는다.

추가 사용자 확정: 미국 연봉은 공통 정규시즌 기간 분할·마지막 정수 오차 정산. 부상은 조직 내 건강 선수 보충을 우선하고 불가하면 낮은 능력 임시 최소 충원. 강화/스타일은 현재 레벨 경기 수의1/3·절반에 개방하고 승격해도 시즌 사용 횟수 유지.14/13과 구현 문서에 최종 기록한다.


M2-DG는 codex/m2-career-engine 브랜치로 이어간다. 병렬 M4가 main a63d3e7에 올라와 main은 덮어쓰지 않았다. M2 전체637개는 이 브랜치 원본의 증거이며 M3/M4 병합 후 재검증은 별도다.

## 최신 완료 — M2-DG (2026-10-26)
다음 후보는 별도 DH 미국 프리시즌 초안과 실제 미국 시즌/승강이다. DH 폴더는 C:/Users/N-052/AppData/Local/Temp/baseball-DH-us-preseason-20261026이며 정식637개에 포함하지 않는다. DD 최신 상태는2030 day105·75마감일·354경기, V:/.local-verification/M2-DD-3064193-20261026/3003864151e4에 코드/원본/실행기/해시를 보관했다. 재개 시 STOP 파일만 제거하고 동일 지문으로 latest.json에서 재개한다.


M2-DG 미국 계약 후 아마추어 정산/다음 시즌 실제 등록을 정식 반영했다. 신규 집중5/5·정식 전체637/637·실패0·취소0·종료0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1905122.3771. 직전 DF337911e·632/632도 보존한다. M2 전체 완료가 아니다. [DG 상세](M2-DG-US-CAREER-ENTRY.md).

작업/Git/빌드는 C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-m2 (codex/m2-career-engine)에서 진행한다. 원래 baseball-career-repo 체크아웃에는 다른 창의 웹 화면 변경이 있어 그대로 보존했다. 그 작업을 덮어쓰거나 함께 stage하지 않는다. V:는 M2 변경 파일만 보호 동기화하고 V:/.git을 생성하지 않는다. 이전 문서의 원래 체크아웃 경로는 이력이다. [분담/연동](M2-M3-INTEGRATION-NOTES.md).

> **M4(웹 UI)는 별도 트랙**: `apps/web`에서 S01/S02/S03를 구현했다. 이어가려면 [M4-WEB-UI.md](https://github.com/bossxor/baseball_Career/blob/a63d3e71d2e1c75cccf87d9d2fccb530c3c23ae2/docs/implementation/M4-WEB-UI.md)를 읽고 `npm run test:web`로 확인한다. M2(엔진)·M3(DB/API)와 파일이 겹치지 않으며, 서버 연동은 `apps/web/src/api.ts`의 `PlayballApi`만 교체하면 된다.

> **M3 완료**: `m3/save-command-pipeline` → main 병합. [M3-COMPLETE](M3-COMPLETE.md). engine 미수정. 메일 재설정 실발송은 후속.

> **M4(웹 UI)**: `apps/web` S01/S02/S03. 이어가려면 [M4-WEB-UI.md](M4-WEB-UI.md) · `npm run test:web`. 서버 연동은 `PlayballApi`만 교체.

## 최신 완료 — M2-DF 연말 계약 비교 (2026-10-26)

origin/main df65ec2로 로컬을 fast-forward하고 STATUS부터 갱신했다. V:는837ce74/df65ec2 중 일치하는 파일만 보호 비교해 원격 변경79개를 최신화했다. 사용자 확정: 다음 해 원구단이 재계약할 재원이 없으면 보유권 해제 후 타 구단1년 제안 비교. [DF](M2-DF-OFFSEASON-EXIT.md)는 신규7개·집중12/12·전체632/632·실패0·취소0·종료0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms2330706.9176. 다음은 미국 커리어 실제 활성화/진행이며 [M2 전체 계획](M2-COMPLETION-PLAN.md)을 따른다. M3는 위 완료 블록. 아래 DE/DC의 연말 질문 대기는26일 사용자 선택으로 해결된 이전 이력이다.

현재 환경은 C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo에서 작업/Git/빌드, V: 보호 미러다. V:/.git 생성 금지. E:/AI/Game 환경은 다른 PC의 이력이다. 옛 DD 실행기/상태는 복구하지 못했지만 새 고정 DC 실행기를 작성해3일 저장→2일 재개·손상 체크섬 거부를 확인했다. 새 실행은2030 day60·마감30일·60정규 경기이며, 원본/코드/실행기는 V: 비공개 보관과 [새 DD 안내](evidence/M2-DD-full-service-checkpoint-notes.md)를 따른다. 원래 부분 상태와 동일 실행으로 주장하지 않는다. 아래의 DD day110/부분 실행은 이전 인계의 보고이며 여기서 재실행/완료한 증거가 아니다.

재개 실제 단기 사용5%/잔여95%, 주간 사용1%/잔여99%로 새 구간임을 확인했다. 과거5% 경계와 혼동하지 않는다. 기존 사용량 잔여5% 정리·커밋/푸시 뒤 정상 종료 요청은 실제 조회 경계에서만 수행한다. 리셋 크레딧 미사용.

## 이전 완료 — M2-DE AI 영입 공동 등록 E96
2026-10-25 · 최종 전체 npm run check625/625·실패0·취소0, lint·타입·build·엔진 골든·이벤트·설계10종·HTTP 골격 smoke 통과. 테스트 duration_ms400562.5889·종료0. 신규 집중6/6에서 실제 Y02 AI FA 수락·재계약, 양 관계 종류, 공식 공동 등록·벤치 부상·JSON/control 불변·변조 거부·소속/계약 변경 후 조회/ACK·중복/구 저장을 검증했다.

실제 수락/갱신 영수증과 현재 계약이 일치하는 선수만 같은 KBO/FUTURES 정규 경기 건강 명단으로 재회한다. AI 영수증·계약 키·공식 경기·정렬 등록 신원을 봉인하며 과거 읽기는 현재 계약/소속에서 추정하지 않는다. 기존 군팀·이적·군 복귀 E96, 관계 종류와 이력, 게임/RNG/돈/성장을 보존한다. [DE 상세](M2-DE-AI-TEAM-REUNIONS.md) · [전체](evidence/M2-DE-check.log) · [동결](evidence/M2-DE-source-freeze.json). 이전 DC3064193도619/619·원격 해시 일치를 확인했다.

DD 실제18개월 검증은 고정 DC3064193 worktree에서 별도 진행한다. 아직 완료 통과가 아니다. 첫 부분 실행은2030 day110·80마감일·380정규 경기까지 진행한 뒤 중단했다. 전체 native JSON 상태/원본 증거/단계/호출 수를 Git 밖에 원자적으로 저장하는 검증기를 추가했고 실제3일 저장→5일 재개를 확인했다. 최신 상태·정확한 경로/재개 명령/제한은 [DD 체크포인트](evidence/M2-DD-full-service-checkpoint-notes.md)를 따른다. 검증기와 엔진 스냅샷·의존성을 임의로 바꿔 재개하지 않는다.

일반 연말 예산 부족 시 원구단 보유권 처리 질문은 답변 대기다: 다음해 권리 해제 후 타구단1년 비교(추천) 또는 권리 유지·무계약 준비/재협상. 임의로 전면 FA를 허용하지 않았다. 최신 사용자 경계는 단기 잔여5%이며 여유를 남겨 인계·커밋·푸시한다. UI/DB/APK·장기 균형과 실제18개월 완료는 미검증, 전체 가중35%/65% 유지. 실제 마지막 커밋/원격은 git log -1·ls-remote로 확인한다.

## 이전 완료 — M2-DC 원구단 복귀 공동 등록 E96

2026-10-25 · 전체 npm run check619/619·실패0·취소0, lint·타입·build·엔진 골든·이벤트·설계10종·HTTP 골격 smoke 통과. 테스트 duration_ms412025.3614, 종료0. 집중6/6에서 실제 두 복무 블록·원구단 경기/등록·JSON 재개·벤치 부상·60명 대기·변조 거부·과거 조회/ACK·당일 만료 후 분리/재처리를 확인했다. 첫 중단 검사는 superseded 이력이며 최종 통과가 아니다.

복귀 날짜·프로그램·공식 경기·정렬 건강 명단을 봉인해 복귀일 이후 같은 원구단/리그의 실제 공동 등록만 E96으로 연결한다. 기존 관계 종류·이력·게임/RNG/급여/성장을 보존하며 NPC 급여 만료 전에 재회를 기록한다. 과거 조회는 현재 소속/계약에서 추정하지 않는다. 군팀/이적 E96과 구 저장은 유지한다. [DC 상세](M2-DC-RETURN-REUNION-NOTES.md) · [전체](evidence/M2-DC-check.log) · [동결](evidence/M2-DC-source-freeze.json).

재개 시점 단기 사용4%/잔여96% 리셋을 확인했다. 최신 사용자 경계는 잔여5%이며 검증·인계·커밋/푸시 여유를 남긴다. 다음은 고정 DC 코드의 실제18개월 복무 검증(M2-DD)과 실제 AI 영입 후 공동 등록 E96 누락(M2-DE, 수정 전1/1 재현)이다. 일반 연말 계약 부족 시 보유권 처리 질문은 사용자 답변 대기이며 그 경로를 임의 FA로 구현하지 않는다. UI/DB/APK·장기 균형은 미완료, 전체 가중35%/65% 유지. 원격/마지막 해시는 git log -1과 ls-remote로 확인한다.

## 이전 완료 — M2-DA/DB NPC 병역 복귀·급여·성장

원격837ce74까지 최신화 후 사용자 확정 정책을 적용했다: 기존 급여 보장·신규 영입 제한·실제 지급 연도 부족분만 재정재건 지원. 신규 실제 입대v6·원금/과거 영수증 보존·6월30일 복귀/60명 대기·등록일 급여·AI 잔여 계약/FA·군팀/복귀/FA 연간 성장·노쇠1회·미래6년 채무를 연결했다. E09/AI 이동/만료·이적 공석의 급여 예약도 등록 변경 전에 합산한다.

최종 전체 npm run check **613/613·실패0·취소0**(신규22개 포함), lint·타입·build·엔진 골든·이벤트·설계10종 통과. 테스트 duration_ms405753.5182, 종료0. HTTP 골격 smoke도 통과했다. [상세/호환/한계](M2-DA-DB-NPC-MILITARY.md) · [전체 로그](evidence/M2-DA-DB-check.log). 군팀/원구단 실제 경기와 통제된 미진행 시계의 통합 검사이며18개월 전체/장기 균형 검증은 아니다. 전체 앱 가중 추정35% 완료·65% 남음 유지: 실제 UI/계정/Neon 저장은 아직 없다.

다음 작은 후보는 [NPC 원구단 복귀 후 실제 공동 등록 E96](M2-DC-RETURN-REUNION-NOTES.md)이다. 현재 군팀 공동 등록·주인공 이적 E96과 별도다. c0b4a90에서 실제6월30일 복귀 뒤 같은 FUTURES:OB 건강 등록/급여에도 SEPARATED·E96=0인 누락을 단일 검사1/1로 재현했다. 수정 전 증거이며 활성 코드는 그대로다. 내 선수의 다음해 예산도 부족할 때 오프시즌 무소속/타구단 출구, ATHLETE/해외 병역·미국 실제 리그·UI/DB/APK도 남아 있다.

환경: E:/AI/Game/baseball_career, main. 옛 V: 미러/PC 종료·이전 사용량 기록은 이 세션의 현재 상태가 아니다. 이전 요청은 잔여30% 경계였으며 최신 재개 요청/상태는 위 블록을 따른다. 검증 소스 동결·문서 후속 검증 증거와 Git 원격 확인은 evidence/M2-DA-DB-*를 따른다. 기능 c0b4a90은 origin/main 해시 일치·clean을 확인했다. 후속 문서/재현 증거 커밋의 마지막 해시는 git log -1로 확인한다. 보관 패치는 승인 전 이력이며 활성 소스에 재적용하지 않는다.

## 이전 완료 — M2-CZ 완료

2026-10-23 재개: origin/main=HEAD816ff2e·clean·추적1374개 V: 일치. 사용량 단기 사용0%/잔여100%로 리셋됐다. 이전5%를 현재 경계로 쓰지 않는다. 이번 사용자 요청은 새 구간 잔여5%에서 문서/커밋/푸시·최종 확인 뒤 PC 종료다. 리셋 크레딧 사용 없음.

실제 군팀 공동 등록 E96을 정식 반영했고 집중38/38·전체 check591/591·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1062499.9007. [CZ](M2-CZ-SANGMU-TEAM-REUNION.md). 소스 동결 후591/591·종료0을 확인했다. 완료 문서 재검증/소스 불변·V:·커밋 증거를 따른다. 마지막 해시는 git log -1. 다음은 NPC 병역 실제 복귀/급여/성장·미래 채무 연결이다.

## 이전 상태 — 사용량5% 경계 인계 (2026-10-23 06:50 UTC)

실제 조회에서 단기 사용95%/잔여5%·주간 사용30%/잔여70%를 확인해 새 구현을 동결했다. 리셋 크레딧 사용 없음, 이번 실행에 PC 종료 요청 없음. CY585/585가 최신 활성 코드 검증이며 군팀 E96은 저장소 밖 초안으로 남겼다. 문서만 추가 정리한 뒤 재검증·V: 동기화·커밋/푸시한다.

## 재개 시 먼저 확인 — CY 푸시/미러 검증 완료

기능 커밋8ca630f6ec1c385d38d0e585482d1ea4c94bac7d까지 원격 origin/main=HEAD·clean·추적1371개 V: 바이트 일치를 확인했다. 이 문서 갱신의 마지막 해시는 git log -1로 확인한다. 전체 검증의 최신 기준은 CY585/585이고 검증 소스 동결/문서 후속 검증 증거는 evidence/M2-CY-*를 따른다. 전체 앱 추정35% 완료·65% 남음 유지.

1. origin/main·체크아웃·V:를 먼저 비교하고 다른 창/사용자 변경을 보존한다. 작업/Git/빌드는 아래 C: 체크아웃, V:는 미러이며 V:/.git 생성 금지다.
2. 이전 CY 인계 당시 작은 후보는 군팀 E96이었고 CZ에서 완료했다. 당시 미구현 재현: 주인공/라이벌이 실제 FUTURES:SANGMU 같은 경기 건강 명단에 있어도 현재는 SEPARATED·E96=0. 저장소 밖 초안6개·타입 통과는 정식585개와 별개다. 병역 점검표의 마지막 섹션과 kbo-team-reunions.ts/kbo-progress.ts를 읽고 정식 반영·타입·집중/전체 검사부터 한다. TEMP native 파일 전체로 최신 코드를 덮어쓰지 말고 현재 Git과 대조한다.
3. 이어 NPC 실제6월30일 복귀/잔여 급여/연간 성장·노쇠/미래 채무/보유권·슬롯을 같은 경로로 구현한다. 날짜만 바꾸거나 프로그램 완료 블록을0으로 되감아 가짜 원장을 만들지 않는다. 현재 군팀 NPC는 민간 연말 성장 루프에서 빠지고 미래 예산 전망도 군팀 분리 채무를 놓치는 점을 재현했다.
4. 이미 확정한 사용자 선택: NPC 잔여 계약 소진은 기존 AI 가치·포지션 수요·예산으로 재계약 또는 FA. 내 선수의 선택 흐름은 유지. 전역/모집 공석도 종합35~45 군팀 최소 보조 허용, 입대/복무/민간 계약 생성 금지.14/21/병역 점검표를 따르며 이 결정을 다시 묻지 않는다.
5. 마일스톤별 전체 npm run check·문서/증거·설계 패키지/해시·V:·커밋/푸시를 완료한다. 새 소스의 결과를 이전585개에 섞지 않는다. UI/계정/Neon/Storage/APK는 아직 미구현/미검증이다.

## 최신 상태 — M2-CY 완료

CX e8ef9df 푸시·원격=로컬 clean·추적1356개 V: 일치 확인 후 실제 신규 입대의 관계 분리를 구현했다. 집중30/30·전체 check585/585·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1086125.6368. [CY](M2-CY-SANGMU-RELATION-SEPARATION.md). 소스를 고정한 최종 전체585/585·종료0을 확인했다. 완료 문서/설계 재검증·검증 원본 불변·V: 동기화/커밋 증거를 따른다. 마지막 커밋은 git log -1. 다음 군팀 E96 초안6개·타입 통과는 아직 저장소 밖이며 실제 반영 뒤 전체 재검사가 필요하다.

## 이전 완료 — M2-CX

CW d2bb078 푸시·로컬/원격 clean·추적1335개 V: 일치 뒤 상무 공석 보충 원장2를 구현했다. 신규6개·군팀 기존8개·CW8개 집중22/22·전체 check580/580·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1106360.2722. 완료 문서 재검증·검증 소스 불변·V: 동기화 증거와 함께 커밋/푸시한다. 실제 최신 해시는 git log -1. 다음은 실제 입대의 관계 분리(저장소 밖 초안5개 검증)와 NPC 실제 복귀/급여/성장/예산 연결이다. [CX](M2-CX-SANGMU-VACANCIES.md).

## 이전 완료 — M2-CW

기반 CU/CV는 c2706c61f0c83a56f3cf64b79dfeeb894cc82b33. 원격=로컬·clean·추적1320개 V: 일치 확인 후 CW를 구현했다. 개막 부상 증거/기간 버전·옛 지급 보존, 집중25/25·전체 check574/574·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. 테스트 duration_ms1081868.4695. 마지막 커밋은 git log -1을 따른다. [CW 상세](M2-CW-OPENING-REHABILITATION.md) · [집중](evidence/M2-CW-focused-final.log).

검사 동안 packages/apps/docs/design 소스를 고정했다. 전체 결과는 evidence/M2-CW-check.log와 M2-CW-check-exit.txt=0. 완료 문서 정적 검증·소스 불변·V:/index 증거는 M2-CW-post-docs.json/source-sync.json을 따른다. 다음은 NPC 군팀 실제 복귀/급여/성장 연결이며 아래 병역 점검표를 읽는다.

## 이전 완료 — M2-CU/CV

이번 검증의 기반 커밋은 a5bc5ba59fa432b551f31f623d2cf119364ee7b7(main). 재개 시 origin/main·체크아웃·V: 추적1290개가 모두 일치하고 작업트리가 깨끗했다. CU/CV 공동 전체 검사566/566·실패0·취소0 및 lint/타입/build/골든/이벤트/설계10종이 통과했다. 검증본을 V:에 동기화하고 같은 커밋으로 저장하는 인계다. 실제 최신 커밋은 git log -1을 따른다. 첫 중단 검사는 통과로 세지 않는다.

CU: 사용자 승인 종합35~45 군팀 임시선수·최소 야수9/투수1/우투 중요 수비수4 보충·회복 뒤 등록 제외·신원/구종/기록 보존·실제 FUTURES:SANGMU 건강·S42 군팀 신원·실제 E95 연결. 새 상무 시즌 시작에서 루트v5/원장을 활성화하고 이미 진행 중인 원장 없는 구 저장의 건강 RNG 순서는 보존한다. 다음 시즌 입대 예약을 현재 군팀 등록으로 오인하는 읽기 회귀도 수정했다.

CV: 실제 한국시리즈 마지막 부상 뒤 정규 성장 최초 정산이 CHANGED_GROWTH_HEALTH_EVIDENCE로 막히는 경로를 재현했다. 정규 범위 뒤의 부상/회복 전이만 역순으로 복원해 정규 마지막 상태와 비교한다. 정규·SPORTS/ACTIVE 분할이 같은 내부 helper를 쓴다. 부상·경기·RNG·지급된 기간을 재작성하지 않고 정규 시작 상태 계산은 유지한다.

최종 집중39/39(CU 신규8·CV 신규6·기존25), 실패0·취소0, 전체 테스트 타입 검사 통과. 공동 전체 check566/566·실패0·취소0이 통과했다. 테스트 duration_ms1145193.7649. [집중 로그](evidence/M2-CV-focused-final.log) · [CU 상세](M2-CU-SANGMU-HEALTH-EMERGENCY.md) · [CV 상세](M2-CV-POSTSEASON-GROWTH-HEALTH.md). 전체 앱 추정35% 완료·65% 남음 유지: 작은 내부 경로와 회귀 수정이며 실제 UI/계정/Neon 저장·NPC 반년 복귀는 미완료다.

## 최종 검증과 인계

- evidence/M2-CU-check.log, M2-CU-check-exit.txt=0, M2-CU-source-freeze.json. 첫 중단 로그/사유는 M2-CU-check-first-run.*이며 최종 통과가 아니다.
- 실제 연도 이월 자기검사: node --import tsx docs/implementation/evidence/M2-CU-year-carry.mjs. 정규 경기는 통제된 시계, 포스트시즌·성장/시즌 마감·AI 연도 전환은 실제 명령이다.10명 신원/구종 보존·활성 등록0·JSON 동일·원본 불변을 검사한다. CV 적용 전 실패 로그도 보존한다.
- 고정 소스의 전체 검사 뒤 완료 문서·설계 패키지 재생성/정적10종·MANIFEST·HTTP 기본 smoke를 별도로 재검증한다. HTTP는 웹/API 골격이며 실제 UI/계정/DB/Storage 검증이 아니다. 마지막 Git 해시는 git log -1을 따른다.

## 다음 작업 — NPC 병역 연결 (개막 증거는 CW 완료)

사용자 추가 확정: NPC 계약 소진은 기존 AI 가치·수요·예산으로 재계약/FA, 전역·모집 공석도 종합35~45 군팀 보조 선수를 최소 충원한다. 보조 선수에 입대/복무/민간 계약을 만들지 않는다. 실제 구현은 아직이며14/21/병역 점검표를 따른다.

개막 sourceBasis unavailable 재사용·opening-health-v1은 CW에서 완료했다. 옛 지급 계산/periodKey/금액은 유지한다. TEMP 초안 대신 저장소의 CW 코드와 신규8개/집중25개/전체574개 검증을 따른다.

[병역 연결 점검표](M2-NEXT-MILITARY-INTEGRATION-NOTES.md)의 마지막 섹션을 먼저 읽는다. NPC6월30일 복귀는 실제 잔여 급여·보유권/슬롯·군팀 후반 편성·성장/노쇠의 동일 원장이 필요하다. settleKboServicePayrollDay는 현재 주인공 계약 하나만 처리하고 closeKboNpcSeasons는 민간 world.players만 성장시킨다. 날짜 한 줄이나 기존 연말 복귀 호출만으로 완료 처리하지 않는다.

CV는 종료 경계, CW는 새 미지급 기간의 개막 증거를 바로잡았다. 이미 지급된 기간은 재작성하지 않는다. 군팀/AI 공동 등록 E96·ATHLETE/해외 병역·미국 실제 리그·실제 화면/클라우드 저장·구단 조작/보관 선수 투입·APK/배포도 후속이다.

## 작업 환경과 검증 계약

수정/Git/빌드 원본: C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo. V:는 검증 원본 미러이며 V:/.git을 만들지 않는다. 재개 때 실제 origin/main·체크아웃·V:를 먼저 비교하고 사용자/다른 창 변경을 보존한다.

마일스톤마다 전체 npm run check·관련 집중 검사·STATUS/PROGRESS/상세·증거 로그·설계 패키지/해시 재생성/검증·V: 동기화·커밋/푸시. 공동 검사한 CU/CV는 같은 최종 소스와 결과로 저장한다. 미검증 변경을 이전552/552 통과에 섞지 않는다.

## 사용량 경계

최신 사용자 기준은 잔여5%다. 실제 조회가5% 이하일 때 새 구현을 동결하고 진행/검증 구분을 갱신해 커밋·푸시한다. 이번 재개 시 단기 잔여99%로 리셋됐음을 확인했다. 이전 실행의5%를 현재 잔여로 쓰지 않는다. 리셋 크레딧을 사용하지 않으며 이번 실행에 PC 종료 요청은 없다.

## 이전 기록

[PROGRESS](PROGRESS.md)의 아래 항목은 당시 이력이다. 직전 완료 CT는 전체552/552·c4c4f9e 기능 커밋 및 a5bc5ba 인계 커밋까지 푸시했다. 더 오래된 [NEXT-SESSION 보존본](NEXT-SESSION-HISTORY-20261023.md)도 유지한다.

## 2026-10-27 DK 최종 검증

전체 npm run check 종료0: 총695개 중693통과·실패0·Neon환경 부재2개 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms562628.2466, 동결406파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 사용자 최신 지시대로 PC를 종료하지 않고 M2 잔여 구현을 계속한다. 미국 메이저 재계약/FA·옵션소진, 해외복무·국제·장기저장·24경로는 미완료다.
