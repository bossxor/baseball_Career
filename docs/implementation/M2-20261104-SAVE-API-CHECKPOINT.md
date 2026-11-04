> 이 문서는2026-11-04 중간 기록이다. 전체 검사 종료/후속 수정과 다음 작업은 [2026-11-05 최신 인계](M2-HANDOFF-20261105.md)가 우선한다.

# M2 저장 명령 연결 체크포인트 — 2026-11-04

## 확정·푸시한 묶음
| 커밋 | 범위 | 집중 실행 근거 |
|---|---|---|
|53d973a|프로 조언/의료·기록/수상/구종|API8+native19=27/27|
|992c58f|목표·에이전트·공개 견적 보호|API7/7, 앞 API와 결합15/15|
|d441a13|학교/대학/KBO 관계·연말 재봉인|API4+native21=25/25|
|9686d3a|프로 은퇴/취소/확정·공개 보관|API4+native9=13/13|
|6834bb9|업적/E90·별칭/E42 메타데이터|API4+native16=20/20|
|cc16fb5|US 실제 관계 자료·E94|API5+기존API4+native6=15/15, scope 신규1/1 별도|

새 API 테스트는6파일33건이다. 위 서로 겹치는 실행 횟수를 모두 더해 독립 통과 수로 쓰지 않는다. source prefix controlled/native/API HTTP의 구분은 각 상세 문서가 우선한다.

## 호출/원장 소유권
모든 쓰기는 기존 owned save command transaction→applyEngineCommand→기존 native owner→CAS/revision/command receipt 흐름이다. 클라이언트가 world/records/budgets/funding/rewards를 제공하지 못한다. 같은 command 재전송은 기존 저장 영수증을 반환하며 domain owner를 중복 실행하지 않는다.
- 프로 사건: advice/proResults/proAwards/repertoireEvents의 native 소유권. 실제 source/game evidence를 확인하며 ACK가 생성 조건을 대신하지 않는다.
- 목표/agent: goals/agents native owner. 공개 previewId는 SHA256, 제출 때 현재 native preview와 비교한다. 내부 RNG/점수/건강/roster/futureBudget은 비공개.
- 관계: 학교는 원래 연말 봉인을 검증 후 read metadata를 재봉인한다. KBO/US는 해당 root owner로 읽고 현재 phase를 보존한다.
- 은퇴: native E36와 frozen archive. 원장/신원/계약 이력은 보존하며 M6 선수 복사/등록은 하지 않는다.
- 업적/별칭: 기존 unlock/reward/history 소유권 유지. 읽기 API가 새 unlock이나 시즌 정산을 실행하지 않는다.

## 전체 검사
cc16fb5 이후 source583파일을 동결해 npm run check를1회 실행했다. 현재 결과 확인 전이다. evidence/M2-20261104-batch-run.json, -check.log, -check.exitcode.txt, -source-manifest.json, -freeze-check.json을 함께 확인한다. 전체 검사에는 기존 사용자 테스트 WIP21줄도 포함했다. 이전90394는 종료/집계 미수집이며 PASS가 아니다.

## 잔여·다음 우선순위
1. 전체 검사 결과/변경 해시부터 확인. 실패하면 해당 원인을 고친 뒤 필요한 검증만 재실행.
2. Major E66 시장 사건과 미국→국내 latest KBO authority/원자적 소유권 이전. departure snapshot에서 최신 세계/예산을 만들지 않는다.
3. 미국 E95/E96 실제 재회 owner/근거 및 오래된 누락 신원. 현재 US read는 저장된 자료만 사용하며 없으면 UNKNOWN_REFERENCE다.
4. 99사건 수동 감사와 실제24경로/PF-D 실행 해시. NOT_AUDITED61개는61개 미구현이라는 뜻이 아니다.17개는 이번 scoped API partial이며 전체 웹/시즌 완료가 아니다.
5. 기본 웹의 실제 native career 명령 연결, 대형 실제 PostgreSQL 저장, 실기기/Neon 환경. 기존 M4~M9 완료율을 이번에 재검증했다고 주장하지 않는다.

기존 사용자 WIP와 큰 runtime JSON/zz 로그는 삭제/스테이징하지 않는다. V는 docs/evidence Copy-Item만. PC 종료 금지. M2 완료 추정65%·전체87.5%는 관리 추정이며 실행 커버리지가 아니다.

## 다음 구현의 실제 연결 지점
- Major FA: us-major-renewal.ts의 preview/accept는 실제 계약·조직 이동까지 한다. E66 outbox/window는 아직 없다. 기존 us-minor-market.ts의 minor-only invariant를 느슨하게 바꾸지 말고, native root guard/연도 blocker/견적 봉인/수락 영수증이 동일한 major window를 검증하게 연결해야 한다. 기존 세금/급여/기간/수요 기준을 바꾸지 않는다.
- KBO 출신 복귀: us-kbo-return.ts의 open/accept는 신뢰된 original KBO source와 최신 UsKboReturnAuthority를 별도로 요구한다. API/저장 모델에 이를 공급하는 writer는 현재 검색으로 확인되지 않았다. US root의 kboTransfer는 출국 메타데이터이지 최신 국내 세계가 아니다. 클라이언트 world/예산/원장을 받거나 출국 snapshot을 현재 세계로 복제해 검사를 통과시키지 않는다. 실제 같은 세계/목표 연도·동일 공식 기록을 갖는 저장 owner부터 확보한다.
- 복귀 커밋은 archivedUs/kbo/ownership.requiresAtomicCommit 세 결과를 한 저장 트랜잭션에서 반영해야 한다. 관련 save root의 소유권·양쪽 revision·같은 명령 재전송·한쪽 실패 rollback을 검사한다. 두 활성 계약/선수 복제/원화와 USD 합산 금지.
- 직접 미국 진출자 귀국은 career-us-return-shell.ts의 기존 UsAmateurReturnCareer이며 위 KBO 출신 복귀와 다른 owner다. 기존 의무 준비/복무 경로를 major FA fallback이라는 이유로 우회하지 않는다.
- 프로 E37/E69는 native 은퇴 producer와 archive GET은 연결됐지만 사건의 OPEN_ARCHIVE navigation lifecycle은 별도로 대조한다. 일반 player library/M6 복사와 혼동하지 않는다.

위 내용은 구현 위치/소유권의 인계이며 새 게임 규칙/완료 증거가 아니다.

## 긴 전체 검사 재실행 시 시간 절약 지점
현재 긴 두 API 파일은 nativeUndraftedUsReturn의6년 controlled US 접두+실제 의무 준비2년을 각 프로세스에서 다시 만든다. helper에 기존 PLAYBALL_NATIVE_RETURN_PREFIX 입력/출력 기능이 있다. 다음 실행은 새 source 동결본에서 이 prefix를 외부 임시 경로에 **한 번 native 생성**한 뒤, artifact canonical SHA256/assertUsAmateurReturnCareer와 생성 시 source manifest를 검증하고 동일 코드 검사들에서만 재사용할 수 있다. 과거 raw runtime JSON이나 출처 없는 fixture를 새 native 실행 증거로 바꾸지 않는다.

동시에 여러 worker가 같은 빈 cache 경로를 생성하게 하지 않는다. bootstrap을 완료/검증한 후 read-only 캐시로 공유한다. source/seed/게임 규칙이 바뀌면 다시 생성한다. helper의 기존 sourceCommit 문자열만으로 현재 코드임을 증명하지 말고 외부 실행 manifest를 함께 남긴다. 이번 전체 실행은 cache 환경을 설정하지 않은 fresh 경로이며 진행 중 환경을 바꾸지 않았다. 이는 다음 검사의 실행 방법 제안이고 현재 검사 단축/완료 주장이 아니다.

## 잔여8% 마감 관찰
2026-11-04 전체 검사는 세션51745/PID26896에서 계속 실행 중이다. 관찰한 한 경로의 Native mandatory return year 1/2 complete 출력까지 확인했다. 아직 최종 집계/종료코드가 없으므로 해당 파일 전체와 전체 check PASS를 주장하지 않는다. 신규 API33/33·중간 source583파일 변경0 증거는 보존했다. -checkpoint.log는 이 시점 스냅샷이며 실제 진행 로그는 -check.log다. 컴퓨터/검사 프로세스를 종료하지 않았다.
