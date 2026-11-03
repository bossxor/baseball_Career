# 최신 검증·인계 확정 — 2026-11-03

구현 e6df2ee 푸시·원격 일치 후 전체 check 종료0을 확인했다. 엔진/API1058중1053통과·실패0·환경5건 제외, 웹24/24·HTTP smoke 통과. source506파일 변경·추가0. 실제 선택3시즌 E35/JSON 보관이 집중 및 최종 전체에서 통과했다. [최종 인계](M2-HANDOFF-20261103-VERIFIED.md)와 [전체 변경·증거](M2-RESUME-VALIDATION-20261103.md)를 먼저 읽는다. 대용량 PostgreSQL HTTP3건은 연결 미설정으로 미검증이며, PGlite의174MB 장기 이력 UPDATE 메모리 부족은 미해결이다. M2 전체 완료 아님. 아래 실행 중 세션은 과거 이력이다.

# M2 귀국 미지명 후 선택 준비 — 실행 원장

기준5363de3, codex/m2-career-engine, 지정 C: 체크아웃에서 작업한다. 기존 계획 docs/superpowers/plans/2026-11-02-us-return-retry.md의 Task1~6을 순서대로 실행한다. Caveman·Ponytail·Superpowers executing-plans/TDD를 적용한다. 전체 M2/99사건/24경로 완료는 별도다.

Ruling: 계획의 E: 작업 경로는 다른 환경의 과거 경로이며 현재 사용자가 지정한 baseball-career-m2 체크아웃을 따른다. V:는 문서/증거 Copy-Item만 한다.
Ruling: 수분이 드는 의무 복귀 native 접두를 테스트 프로세스마다 재생성하지 않도록 명시적 테스트 전용 환경변수 경로의 로컬 캐시를 허용한다. 기본 테스트는 직접 생성하며 캐시도 실제 명령으로 생성·원장 검증한다. 원래 미국6시즌은 기존 제어 fixture, 의무 복귀2시즌은 실제 경기, 첫 미지명 시장은 법적 급여상한을 채운 제어 KBO 시장과 native draw로 명확히 구분한다. 캐시 원본은 저장소 밖에 두고 작은 해시/명령수/출처만 증거로 남긴다. CI/제품 코드에 캐시나 환경변수를 추가하지 않는다.

- [x] Task1: 원본/미지명/병역/중복 진입 검증, 예외 드래프트 권한
- [x] Task2: 실제 선택 준비48경기·1회 차감·최신 선수/세계/기록 유지
- [x] Task3: 새 KBO 평가·계약·활성화·경기
- [ ] Task4: 실제 유효 미국 옵션/현재 제안·최신 연도 재계약·경기
- [ ] Task5: 실제 경로 소진 E35·API/공개 조회
- [ ] Task6: JSON/명령 증거·최종 검토·전체 check1회·문서/V/Git

사용자가 승인하지 않은 새 수치/확률/연봉을 만들지 않는다. 불명확한 게임 규칙은 질문한다. 비가역 작업·main/M6 임의 병합·PC 종료 금지. 기존 큰 runtime JSON2개와 zz-dbg.log는 보존한다.

## 진행 체크포인트

Task1 gateway2/2 및 순수 authority2/2 통과, engine build/lint 통과. 처음 실패는 잘못된 테스트 regex(/RETRY/가 실제 PREPARATION_BUDGET_MISMATCH를 못 받음)였고 오류 코드를 포함하도록 테스트만 수정했다. source 자체는 변조된 예산을 이미 거절했다.

실제 의무 복귀2시즌 생성 종료0. 원래 미국6시즌은 제어 접두, 복귀2시즌은 native48+48, 최초 KBO 미지명 시장은 실제 계약을 법적90% 급여총액으로 맞춘 제어 시장이며 실제 native draw가 round:null을 만들었다. 캐시는 저장소 밖 native-return-prefix-5363de3.json, 데이터 해시와 출처를 포함하고 읽을 때 원장과 해시를 검사한다. 환경변수 없으면 같은 과정을 직접 생성한다.

Task2 구현 중: 원래 독립 준비 세계 구성만 공통 helper로 추출하고 실제 최신 세계/선수로 다음1년을 편성한다. 선택 준비는 기존48경기 worker·훈련·스타일·성장 writer를 재사용한다. 소스 US/NPC 전체 기록은 immutable origin에 유지하고 active 독립 ledger는 원래 준비 방식대로 내 경기·독립 경기만 가진다. 활성화 때 완전 원장을 합쳐야 한다. 원장 revision과 원본 기록을 버리는 최적화가 아니다.

선택1시즌 native 검사는 세션23438 / evidence/M2-20261103-return-preparation-green.log 실행 중이다. source는 아직 최종 동결 상태가 아니며 이후 Task3~5까지 묶고 최종 전체검사는1회 수행한다. package exports/API는 Task5에서 연결하므로 현재 새 root를 앱 UI 완료로 세지 않는다.

Task2 첫 native 선택 시즌은1/1 종료0(877536ms). 실제48경기·정산 전0/후1·중복 정산 불변·JSON 재개 동등을 확인했다. 이 실행 뒤 Task3 필드/공통 활성화가 추가되었으므로 최종 source 동결 검증은 별도로 한다.

Ruling: 변하지 않는 origin은 clone 후 전체 검증·깊은 freeze하고 WeakSet으로 재검증을 줄인다. 원래 caller origin은 freeze하지 않는다. JSON 복원/다른 객체/현재 retry와 preparation은 매번 검증하며, 얕게 freeze한 위조 원본도 거절한다. WeakSet은 원본을 강하게 보유하지 않는다. RED 후경계2/2 통과. 동일원본의 반복검증2회 전5443ms/후2.9ms는 warm guard 측정이며 전체경기속도/heap leak 벤치마크가 아니다.

Task3 native 최신 선수 평가·KBO 계약/등록 writer를 원래 귀국 경로와 공통화했다. 전체 원본 기록과 현재 독립 기록은 충돌 row를 덮지 않고 활성화 때 합친다. 원래 귀국 history는한번 저장하고 새 retry archive는 originReturnId 참조+delta로 저장해 대형 source 중복을 줄인다. 타입/lint 통과, 실제 KBO 첫 경기 검사51159 실행 중이다.

사용자 U: 원래 미국 복귀 옵션은 추가 선택 준비에도 유지하며 수락 시 현재 예산·등록 조건을 확인한다.14/23/66에 기록했다. 옵션의 소유 scope로 유효성을 표시하고 가짜0/1 만료일을 만들지 않는다. 기존 날짜형 오퍼는 실제 날짜 비교를 유지한다(집중3/3).

## 최신 실행 — Task3 실제 KBO 진입 확인

Task3 실제 최신 선택 선수의 새 native 드래프트·계약·첫 KBO 날짜가1/1 통과했다(535919ms, evidence/M2-20261103-return-kbo-native.log, 종료0). 원래 미국6시즌은 제어 접두이며 의무2시즌/추가1시즌/KBO 첫 날짜는 실제 worker다. KBO 평가 세계는 새 native 생성이며 부재 기간의 native KBO 배경 시즌을 실행한 증거가 아니다.

Task4 진행: 기존 마이너 순수 제안 계산을 공통화했다. 원래 복귀 조항의 키/허가 조건은 유지하고 현재 예산·동일 포지션 경쟁자·등록 가능한 명단을 다시 확인한다. 유효한 실제 프로 제안에 고교 스카우트75 문턱을 재사용하지 않으며, 일반 프로/아마추어 권한 제한은 유지한다. 현재 제안은 한 번 평가해 저장하고 명시적 거절 영수증을 만든다. source 시장이 없으면 미평가로 시작해 실제 최신 owner에서 새 평가한다.

현재 quote는 실제 service world가 있으면 그 이후에만 오프스크린 성장을 적용한다. 추가 자금 입력이 없는 부재 연도는 실제 장부 잔액만 이월한다. 기존 역할별 고정 workload 근사와 Rookie-only 공석 보충을 재사용하며 새 native US 경기나 구종 XP 실행으로 세지 않는다.

미국 원래 계약 재계약·조항/현재예산·군복무 실제 NPC/기록 보존 회귀3/3 통과(179410ms). 이후 원래 복귀 경로의 가짜 만료일0/1은 소유 scope로 바꿨고 새 집중 묶음에서 재검사 중이다. source 시장 부재 테스트의 첫 실패는 열린 E66만 남긴 불법 fixture였다. source 시장과 그 사건/래퍼 영수증을 함께 제거한 제어 분기로 수정했고 실제 복귀 경기/미지명 결과는 유지했다(수정 후 현재 owner2/2). 일반 게임 규칙을 완화하지 않았다.

현재 source는 최종 동결 전이다. 미국 실제 재계약/첫 경기·그 다음 갱신, used3의 실제 E35, package/API 연결, 최종 전체 check는 아직 남았다. 현 단계의 집중 통과를 M2 전체 완료/전체 회귀 통과로 표시하지 않는다.

## 2026-11-03 최신 체크포인트 — 미국 최신 선수 복귀 확인

Task4: native 선택1시즌의 최신 선수로 미국 재계약·첫 실제 US 날짜를 실행했다. 같은 선수/평가 연도/능력/기록/used1을 유지했다. 별도 제어 full-year closure 뒤 실제 openUsMinorMarket/acceptUsMinorMarketOffer로 다음1년 계약을 확인했다(1/1, 480318ms, return-us-optional-native.log, 종료0). 이 후속 시즌의 정규/PS 전체는 native playthrough가 아니며 제어 closure라는 경계를 유지한다.

JSON 복원한 미국 계약의 첫 실제 날짜와 군복무 NPC/current quote 보존 묶음2/2 통과(239722ms, return-us-json-service.log, 종료0). 과거/현재 원장과 실제 service NPC 성장/RNG/책을 유지하고 현재 quote 단계에서는 신규 자금이나 급여 예약을 만들지 않았다. 새 예약은 현재 예산에서30,000달러1회이며 소득 지급은 기존 일일 writer가 소유한다.

호출 흐름: 실제 미지명 UsAmateurReturnCareer → openUsAmateurReturnRetry → native PreparationSeason → 새 KBO 평가/계약/activateReturnedUsKbo 또는 실제 현재 US quote/거절/수락 → native US continuation epoch. 원본 전체는 목적지 usAmateurReturnHistory에 한 번 저장하고 선택 준비 delta는 originReturnId로 참조한다. US 원장 reader는 retryOfferKey가 있을 때 실제 반환 원본/봉인 quote/계약·예약을 검증하며, 부재 연도의 가짜 US 시즌 archive를 추가하지 않는다. sourceMinorYears/sourceMajorYears 이후의 실제 새 시즌만 기존 연도 reader가 재생한다. 기존 epoch는 변경하지 않는다.

Task5 엔진: 실제3회 소진과 실제 국내 종료 평가·미국 no-offer/명시적 거절을 확인한 뒤 E35를 열고, 사건 버전/CAS를 다시 확인해 ARCHIVED로 전환하는 구현과 package exports를 추가했다. 열린 E35는 다른 변경 명령을 막고 이력·능력·경기 수·used를 변경하지 않는다. 현재 실제3시즌 검사 세션17083 / evidence/M2-20261103-return-exhaustion-native.log 실행 중이며 아직 통과로 세지 않는다. 완료 시 같은 이름의 .exitcode.txt를 확인한다.

35세를 넘은 실제 US 제안 보유자는 허용된 선택 준비를 마친 후 국내 재평가가 나이로 불가할 수 있다. 이때 예전 드래프트 결과를 최신 결과로 재사용하지 않고 INELIGIBLE_AGE로 구분한다. 이전 국내 평가 archive도 실제 평가가 가능했던 나이의 시즌만 요구한다. 이 경계는 기존35세 규칙의 연결 보정이며 별도 늦은 나이 native 전체 경로는 아직 실행하지 않았다.

최신 build·전체 테스트 타입·변경19파일 lint는 return-checkpoint-static.log 종료0. 이전 static 실패는 테스트의 잘못된 ONE_DAY 문자열과 사용하지 않는 변수였고 수정 후 통과했다. 설계10종 통과, 문서 패키지138절·해시359개를 재생성했다. M2 추정은 사용자 요청으로55%에서65%로 재평가했으며 전체 가중87.5%다. 관리용 추정이고 검증 완료율이 아니다.

남은 일: E35 실제3회 결과 확인/수정 → apps/api career-retry-shell의 전용 owner/strict payload/JSON/CAS/allowlisted reads 연결 → 최종 fresh review → source 동결 후 전체 npm run check1회·HTTP smoke → 증거/인계/푸시. API와 웹에서 새 root를 플레이할 수 있다고 아직 주장하지 않는다. M2 전체99사건·24경로·PF 증거도 별도다.

## 저장 API 후속 — 2026-11-03

CAREER_RETRY_US_RETURN_ 전용16명령을 기존 applyEngineCommand/applyCareerRetry 저장 흐름에 연결했다. KBO cast 이전에 mode:US_RETURN_RETRY를 구분한다. OPEN만 실제 UsAmateurReturnCareer를 받으며 다른 명령은 새 root를 요구한다. 읽기는 RETRY_ROUTES/PREP/RETIREMENT의 기존 화면 주소에서 허용된 DTO로 연결한다. 새 저장소나 결제/급여 writer를 만들지 않았다.

원본/예산/자격/선수 객체를 payload로 받지 않는다. 명령별 필드 allowlist, 정수 careerRevision/프로그램/사건 버전, 제한된 진행 모드, 명시적 훈련 포기 boolean, 포지션/능력 선택 검증을 거쳐 실제 엔진 명령을 호출한다. 실제 Root↔KBO/US 전환은 결과 전체를 같은 state.career에 저장한다.

RED 이후 실제 미지명 접두→API OPEN→JSON→공개 조회→US 평가/거절→JSON→API START/준비 조회를2/2 확인했다. 잘못된 권한 payload·stale careerRevision·진행 모드를 거절했다. API build·전체 테스트 타입·변경3파일 lint와 함께 return-api-batch.log 종료0(60400ms). 원래 US6시즌은 제어 접두, 의무 복귀2시즌은 native 접두 캐시다. 이는 applyEngineCommand/화면 reader 검사이며 HTTP 인증/Neon DB 트랜잭션·외부 저장 CAS·idempotency 실행 증거가 아니다.

E35 장기 검사는 세션17083에서 현재 선택2시즌 정산(각48경기, recordRevision54012)을 기록했고3시즌째 진행 중이다. log에 일부 진행이 있어도 최종 종료 코드와 테스트 PASS 전에는 완료로 세지 않는다. source snapshot은6e888cd 전후 경계 보강 전이며 최종 source 전체 gate가 아니다.

다음: E35 native 결과 처리, 실제3회 원본으로 API 은퇴 확인/US·KBO 활성화의 저장 연동 검사 보강, 신선한 전체 변경 리뷰, 최종 source 동결 후 npm run check1회+HTTP smoke. 게임 웹 버튼/전체 화면, 실제 계정 기기 간 저장 검수는 아직 이번 묶음에서 하지 않았다. M2 추정65%는 유지한다.

## API 기존 경로 회귀 — 2026-11-03

새 prefix/owner 분기가 기존 KBO·대학 경로를 손상하지 않는지3개 API 테스트 파일을 한 번 묶어 실행했다.9/9 통과·실패0·제외0,195129ms(evidence/M2-20261103-return-api-regressions.log, 종료0). 기존7개는 HTTP app.request와 테스트 DB를 통한 집중/미국 비교·서명/특성 ACK/복학/조기 드래프트·계속 재학/재도전 은퇴 흐름이다. 새2개는 순수 명령 dispatch·JSON·공개 DTO·준비 시작 검사다. 새 returned root 자체의 실제 HTTP/Neon 저장/외부 CAS·idempotency까지 검증한 것으로 합산하지 않는다. 제품 코드 변경 없이 기존7f7bbae를 검사했다.

E35 실제3시즌 장기 검사는 세션17083에서2시즌 정산 이후3시즌째 진행 중이다. 최종 결과/종료 코드가 없으므로 아직 통과/실패로 분류하지 않는다. 다음 세션에서 .exitcode.txt를 우선 확인하고 살아 있는 세션을 재사용한다. 최종 source 전체검사는 아직 실행하지 않았다.
