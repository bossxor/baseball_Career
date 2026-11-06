# M2 Major FA E66 국내 복귀 authority — 2026-11-06

## 구현
- 기존 마이너 만료 복귀(`us-kbo-return.ts`, E67 견적 + `acceptUsKboReturn` 원자 이전)를 KBO 출신 **Major FA(E66 `majorFaWindow`)**까지 확장했다. 새 산식·확률·급여 정책 없음. 견적은 호출자가 소유한 **최신 KBO authority(receipt/revision/host)** 에서만 만들고 출국 snapshot에서 최신 예산·세계·나이를 추정하지 않는다.
- E66 시장 키는 `marketOf(c)`: US_MAJOR는 `majorFaWindow`(eventKey/windowId), US_MINOR는 `minorMarket`. 수락 시 E67·E66을 같은 영수증으로 닫고 US를 ARCHIVED, `minorMarket`/`majorFaWindow`를 제거한다. KBO 쪽 소유권 영수증(US/authority 양쪽 revision) 규칙은 기존과 동일하다.
- 미국에 남기로 하면 `acceptUsMajorFreeAgency`가 먼저 `cancelUsKboReturnQuote`로 열린 E67만 취소하고 기존 서명·E66 완료 경로를 그대로 쓴다(마이너 시장과 동일 패턴).
- 직행(고교/대학) 출신 Major는 `kboTransfer.origin`이 없어 여전히 `US_KBO_RETURN_NOT_AVAILABLE`이다(아마추어 복귀 프로그램은 별도 경로).

## 테스트 (`packages/engine/test/kbo-us-activation.test.ts`)
- RED: 새 Major FA 복귀 테스트가 `US_KBO_RETURN_NOT_AVAILABLE`로 실패함을 확인.
- GREEN: 2/2 (open→accept 원자 이전·입력 불변·ARCHIVED·E66 RESOLVED / authority stale·교체·위조 marketId·미국 잔류 시 E67만 취소·직행 거절).
- 회귀: `us-kbo-return.test.ts`, `us-major-fa-window.test.ts` — 12/12 통과, fail0·skip0. `tsc -p tsconfig.tests.json --noEmit`=0, 변경 파일 eslint=0.

## 증거의 한계
- KBO 출신 Major FA 6년 접두는 controlled 공식 성적/날짜 접두와 native 연도 전환 fixture이며 native 6년 전체 경기 증거가 아니다. authority host는 controlled 최신 도메인 world(revision 100)다.
- 열린 E67이 있는 동안의 은퇴 요청 경로는 마이너와 동일하게 다른 OPEN 사건 차단으로 남아 있다(미검증/미변경).
- API 명령은 추가하지 않았다(마이너 복귀도 API 미연결). 웹/API 연결은 후속.
