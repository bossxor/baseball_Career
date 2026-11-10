# 인계 — 2026-11-10 사용자 중단·1% 마감

사용자가 사용량1%에서 구현 중단과 커밋을 지시했다. 원격86504ac를 fast-forward한 뒤 팀원이 구현한 독립 미국1년 계약 수명/귀국출신과 은퇴 가장빛난3년을 통합했다. 독립귀국은 사용자 확정2시즌·35세상한·예산차감0·복무중첩, 은퇴3년은 확정개인수상·올스타건수/최신동률/공식출장fallback을 적용한다. 테스트 코드는 작성만 했고 사용자 지시대로 테스트·빌드·타입·린트·시뮬레이션·설계 검증을 실행하지 않았다. 설계 패키지 재생성도 최종 단계 대기다. 구현/검증 완료를 주장하지 않는다.

미완료 작업은 별도 원격 WIP 브랜치로 보존한다. `codex/m2-independent-api-1110`: 독립 정산→미국 평가/등록·병역 Flow 및 대학 라우팅. `codex/m2-college-national-1110`: 실제 NPC KBO 호스트와 대학 대표 수직 연결. `codex/m2-independent-lifecycle-1110`: 독립 미국 도메인 및 작성한 회귀. `codex/m2-remaining-docs-1110`: 은퇴3년·사용자 결정·현재 큐 문서. 공통 기준86504ac이고 일부 파일/공용 라우팅이 겹칠 수 있으므로 통합 때 diff로 순차 병합한다. WIP는 검증된 기능으로 간주하지 않는다. 각 작업트리의 이전 WIP는 기존 stash에 보존했다.

다음은 모든 작업브랜치의 미완료 연결을 마무리하고, 전체 M2 구현 후 마지막 통합 검증1회다. 대학 NPC호스트의 다년 진행/국제 복귀/연말, 독립 미국/병역 수명과 공용 라우팅 및 대용량 저장 호환을 특히 확인한다. 미결정134·상한·M6는 보류한다.

# 2026-11-10 은퇴 가장 빛난 3년 사용자 확정 U

확정 개인 수상·올스타 선정 건수 순, 동률 최신 연도, 후보 부족 시 공식 출장 최신 연도로 채운다. 수상·선정 연도에는 별도 출장 조건을 추가하지 않는다. 새 점수·리그 가중치는 없다. 은퇴 요약 API의 순수 투영과 회귀 코드를 작성했으며 실행 검증하지 않았다. 중복·취소 투영은 순수 함수에서 다루고 기존 보관 원장의 중복 거부 검증은 유지한다. 독립 출신 귀국 U와 대학 대표 수직 연결도 [잔여 큐](M2-REMAINING-IMPLEMENTATION-QUEUE-20261110.md)에서 추적한다.

# 2026-11-10 독립 출신 미국 종료 후 국내 복귀 — 사용자 확정 U

국내 프로 계약 경력이 없는 독립 출신에는 기존 의무 준비 2시즌·국내 드래프트 평가 35세 상한을 적용한다. 선택 준비 예산 차감은 0이며 복무 중첩을 유지한다. 엔진·API 연결과 관련 테스트는 [잔여 큐](M2-REMAINING-IMPLEMENTATION-QUEUE-20261110.md)대로 작업 중이며 실행 검증은 아직 하지 않았다. 설계 패키지 재생성·`verify:design`도 최종 단계로 이월한다. 아래의 귀국 규칙 미결정 표기는 이 결정 이전 이력이다.

# 2026-11-10 OJT 작업 재개 — 기준 86504ac

통합 작업 경로는 `C:/Users/OJT/.codex/worktrees/tf-fast-season/baseball_career`다. 아래 N-052 경로·채팅 ID는 이전 호스트 이력이다. 팀별 현재 경로와 실제 채팅 ID는 [TF 운영](TF-OPERATIONS.md)을 따른다. 이전 WIP는 stash에 보존됐으며 복원·삭제하지 않는다.

독립 최초 미국 계약 수명·귀국 출신은 엔진팀, 독립 준비 정산→미국 평가/등록 호출은 API 담당, 대학 대표 실제 KBO authority·API/화면 수직 연결은 대표 담당이 작업 중이다. 원본·원장·revision을 임의 생성하지 않는다. 은퇴 상위 3년은 수상·올스타 건수와 최신 연도 기준으로 사용자 확정됐으며 구현 후 최종 검증 대기다. 전체 구현 전 테스트·시뮬레이션·빌드·타입·린트·검증 스크립트를 실행하지 않는다. 구현과 검증을 분리하고 최종 통합 검증 1회에 확인 항목을 누적한다. 아래는 이전 이력이다.

# 최신 마감 — 2026-11-10

먼저 [M2-HANDOFF-20261110.md](M2-HANDOFF-20261110.md)를 읽는다. 통합 코드 원본은 visualizations의 baseball-career-m2, 브랜치 codex/tf-fast-season이다. 현재 앱의 m2-return-retirement는 웹 작업자 체크아웃이므로 문서만 보고 전체 코드가 최신이라고 가정하지 않는다.

사용량5% 알림에서 완료분을 커밋·푸시한다. 코드 기준 af049f7까지 학교/대학/독립/미국/귀국 연결, 성장 projection, 체크박스4선택, 확정 결과/업적/일부CH, 독립 미국 계약 프로필과 출국 레이어를 반영했다. M2 관리 추정약84%(범위75~90)·전체93.2%; 검증 통과율이 아니다. 독립미국 실제등록/계약수명/복무/귀국원점·대학대표KBO authority·빛난3년 규칙은 남았다.

중간 검사는 실행하지 않는다. M2 구현 후 최종1회 검증 방침, 팀장 위임 운영, 원본 WIP 보존을 유지한다. 최신 인계의 작업자·경로·남은 파일을 기준으로 이어간다. 아래는 과거 이력이다.

# 최신 진행률 — 2026-11-10 코드 구현과 검증 분리

M2 코드 구현은 약83%(거친 범위75~90%)·잔여약17%로 재산정했다. 기능8묶음을 동일 가중치로 나눈 관리 추정이며 검증 통과율이 아니다. 기존65% 고정 집계를 정정했다. 전체 표의 M2 기여는24.9%이고 전체 코드 구현 추정은92.9%·잔여7.1%다. [산정 근거](M2-IMPLEMENTATION-ESTIMATE-20261110.md).

통합기준7eea6b3: 웹4선택 UI7b90a3e, 엔진 성장 요약2ecdf7e, API 준비/결산 성장7eea6b3. 중간 검사는 실행하지 않았으며 M2 구현 후 최종1회 검증 방침을 유지한다. 작업자01은 독립 미국 도메인,02는 확정 원장의 결과/은퇴 표시, 팀장은 통합·문서를 맡는다. 대학 대표팀 authority·독립 미국 경로·남은 결과 표시 등 실제 잔여는 구현 큐에 남긴다. 아래는 이전 이력이다.

# 현재 운영 — 2026-11-10 작업자 위임

사용자 지시에 따라 팀장은 직접 제품 구현을 멈추고 배정/통합/문서만 맡는다. 공통 aab7027 기준으로01엔진·02API·03웹·04실제 구현 큐 역할을 기존 프로젝트 채팅에 재배정했고 모두 작업 시작을 확인했다. [실제 채팅/파일 경계/작업 폴더](TF-OPERATIONS.md). 중간 검증은 실행하지 않는다. 최종 검증1회 전까지 실행 통과나 M2 전체 완료로 표시하지 않는다.

01·03의 담당 파일 로컬 커밋을 통합하고, 같은 primary를 쓰는02·04는 수정 목록을 받아 팀장이 순차 커밋한다. 담당 코드 동시 편집·타 작업 WIP 변경·무단 push를 하지 않는다. 아래는 이전 구현 이력이다.

# 최신 구현 — 2026-11-10 M2 호출 연결 묶음·검증 이월

구현 최우선 지시를 적용해 중간 검사를 실행하지 않는다. 고교 훈련 진입/재진입·확정/도전/피로·최근 성장 결과, 고교/대학 스타일, 고교/대학4능력 육성, E84 공개 특성, 대학 E73 미국 오퍼 비교/서명, 미국 최초 입단의 평가→서명→마감→등록, 드래프트 예상 라운드/확률, 귀국 지명 거절 뒤 무옵션 E36/E37을 소스에 연결했다. 미국 초기 $3M·Rookie/A 신입1자리·차출/병역복귀 옵션 허용은 사용자 확정이며14에 기록했다. 새 테스트는 작성만 하고 실행하지 않았다. 구현 완료와 실행 검증 완료는 다르다.

[구현 목록·최종 확인 항목·남은 연결](M2-IMPLEMENTATION-FIRST-20261110.md). 다음은 학교/대학의 나머지 사건·대표팀·병역·재도전 호출자를 채우는 작업이다. 실제 미구현만 우선하고24경로/PF/실기기/성능 증명은 최종 검증1회로 이월한다. M2 전체 완료·통과 주장은 아직 하지 않는다. 아래는 과거 이력이다.

# 최신 작업 방식 — 2026-11-10 사용자 지시

M2 구현을 먼저 모두 끝낸다. 진행 중이던 전체 check는 사용자 요청으로 중단했으며 최종 실패/통과 판정이 아니다. 이후 중간 테스트·시뮬레이션·빌드·타입·린트·검증 스크립트는 실행하지 않는다. 필요한 테스트 코드와 확인 항목은 누적하고 M2 전체 구현 후 단일 최종 검증을 한 번만 진행한다. 구현 여부와 검증 여부를 분리해 기록한다. 기존 기록·시드·원장·보안·호환성은 유지한다.

현재 구현: 분할 저장은 로컬 커밋 2b34671, 설계 패키지 갱신 c9faed9. 최초 귀국 KBO 제안 거절·미국 옵션 없음의 E36/E37 경로는 별도 작업 폴더에서 구현 중이며 중간 검사도 중단했다. 잔여 작업은 실제 미구현 동작과 호출 연결만 우선하며, 기존 미증명 경로/실기기/성능 수치는 최종 검증 목록으로 이동한다. M6는 이 범위에서 구현하지 않는다. 아래는 이전 이력이다.

# 최신 구현 — 2026-11-10 분할 저장 연결

사용자가 로컬 구현을 승인했고, 기존 JSONB를 유지하는 PARTS_V1 상태 저장을 명령·조회·생성·복원·백업·측정기에 연결했다. 원본 실패 지점에서 실제 API가100경기를 추가 진행해 HTTP200,235조각·245,611,715바이트를 저장했다. 원본 저장·기존 경기 기록 해시 보존, 중복 영수증 재전송·stale409도 통과했다. 이는 전체 시즌 완주 증거가 아니다.

집중14/14·최종 codec/HTTP3/3·API/테스트 타입·변경 범위 lint를 통과했다. 전체 check는 공유 폴더의 기존 미커밋 진단/Android 생성 파일 린트에서 종료1이므로 전체 통과가 아니다. 기존 파일을 보존하고 이번 변경만 담은 관리형 검증 체크아웃에서 전체 검사를 실행한다. [구현·증거·잔여](M2-SPLIT-SAVE-20261110.md).

Claude 최신 원격 d29db0f의 설계/벤치마킹이 현재 브랜치의 조상인 것을 확인했다. 설계135 기준으로 개발하며 미확정134 등은 적용하지 않는다. 운영 DB 변경·push는 미실시. 관리 추정 M2 65%·native4/24 유지. 귀국 무옵션 은퇴는 조사만 완료됐으며 구현되지 않았다. 장기 메모리·대형 백업 전체 문자열·실제 귀국 재검증·전체 시즌 및 전체 check는 잔여다. 아래는 과거 이력이다.


# 최신 상태 — 2026-11-10 저장 한도 원인 확정

미국 실제 PostgreSQL API는 정규3,226경기·29명령 뒤 단일 JSONB 객체268,435,455바이트 내부 한도로 HTTP500(종료1)이 발생했다. 실패 입력 JSON은219,543,841바이트다. PGlite의 별도2GiB WASM 메모리 한도도 합성 실험으로 재현했다. DB 교체·메모리 증설만으로 해결되지 않는다.

귀국 HTTP는2건 중1통과·1실패·제외0이며 미국 수락에서 같은 JSONB 한도에 걸렸다. 독립 준비2시즌은 native, 초기 미국6시즌은 controlled이며 군 복무2년 증거가 아니다. 실제 두 실행 모두 source manifest 불변을 확인했다.

실제 다음 상태221,115,560바이트를 임시 테이블211개 조각으로 저장·재조회한 실험은 canonical 해시 일치·롤백·원본 보존을 통과했다. 제품 저장 변경은 아직 하지 않았다. 장기 문자열/메모리·원자성·구 저장/백업/복구를 포함한 변경안을 검토 중이다. 상세와 실행 증거는 [저장 경계 보고](M2-JSONB-BOUNDARY-20261110.md)에 있다.

측정기 안전 경계1/1·기존 명령 회귀4/4·자체검사/린트 종료0. 최신 전체 check·실기기·시즌 완주·24경로 폐쇄는 미검증이며 M2 관리65%·native4/24를 유지한다. 최초 귀국 지명 거절 뒤 무옵션 은퇴 경로는 독립 체크아웃에서 구현 중이다. 아래는 과거 이력이다.


# 인계 — 2026-11-08 미국 저장 재현 최종 결과

구현·회귀 커밋 `0092a0c`는 원격 `codex/tf-fast-season`에 푸시했다. 새 일반 US 일별 근거의 원문 중복은 봉인으로 교체했고 구 저장 읽기·조언·감사·정정·복무 연결 및 집중27건과 귀국 재도전2건은 통과했다. 그러나 **미국 시즌 저장 차단은 해결되지 않았다.**

- 수정 후 실제 Hono/PGlite API: 2,104경기·8명령·166.702초 후 HTTP500 OOM, 종료1. 실패 직전 JSONB 159,326,670바이트. [결과](evidence/CODEX-20261108-us-seal-verified.json), [로그](evidence/CODEX-20261108-us-seal-verified.log). source 초기 해시는 불변이다. 첫 실패의 조언 reader는 이미 수정했으며 이번 실패는 DB update 반환 전이다.
- 오래된 행 버전 누적 가설을 구분하기 위해 시험 DB에서 요청 사이 `VACUUM`을 실행했다. 실제 행 보존 자체 검사는 통과했지만, API는 2,108경기·8명령·165.548초 후 같은 HTTP500 OOM으로 실패했다. [비교 결과](evidence/CODEX-20261108-us-vacuum.json), [비교 로그](evidence/CODEX-20261108-us-vacuum.log). 행 정리만으로 해결된다는 가설은 채택하지 않았다. 재현용 [패치](evidence/CODEX-20261108-vacuum-experiment.patch)를 보존하고 시험 옵션은 실행 소스에서 제거했다. VACUUM을 제품 API에 추가하지 않았다.
- 두 실행의 벽시계 예산 때문에 요청 경계가 달라 게임 수를 속도 개선율이나 결과 동등성으로 해석하지 않는다. 전체 시즌 결과 해시 동등성·135 항목별 표·시즌 완주는 미증명이다. OOM이 일반 PostgreSQL에서도 발생하는지는 확인하지 못했다. 다음은 실제 PostgreSQL 경로와 PGlite 드라이버/가상 파일시스템의 큰 JSONB 할당을 분리해 확인하는 작업이다. 추가 정확성 축소나 검증 생략은 금지한다.
- 귀국 재도전의 대용량 HTTP 소유권·재전송, 소진 은퇴 전체 Flow와 최초 지명 거절 뒤 무옵션 은퇴 소유자, 학교 훈련 재진입·성장 결과 표시·브라우저/실기기·최신 전체check는 남아 있다. M2 완료·24경로 native 증명 수를 임의로 올리지 않았다. 주간 한도 잔여를 검증 결과 기록과 Git 저장에 확보했다.

아래는 실행 중 시점을 포함한 이전 이력이다.

# 인계 — 2026-11-08 귀국 재도전·미국 일별 근거 수정

귀국 미지명 이후 별도 재도전 소유자의 홈/Flow를 연결했다. 선택 준비·훈련·국내 지명·미국 제안 수락/거절·소진 은퇴 명령을 기존 소유자로 전달하며, 지명 수락은 확인→서명을 거친다. 정산은 주인공48경기뿐 아니라 마지막 리그 날짜 종료와 pending 경기 없음까지 확인한다. 기존 완료 schema1 fixture를 사용한 진로/미국 수락·거절·stale 검사 및 정산 경계 회귀 2/2가 통합 소스에서 통과했다. 이는 현재 소스의 새 native2년 실행 증거가 아니다. 대용량 PostgreSQL HTTP 소유권·재전송 회귀는 작성했으나 미실행이다. 최초 귀국 지명 거절은 미지명 전용 재도전 예외에 포함하지 않으며, 유효한 미국 복귀 옵션이 없는 경우의 은퇴 소유자 연결은 남았다.

US 저장 실패 직전 상태 실측은 약227MB, 그중 일별 근거 원문 사본85.8MB·공식 records.games65.7MB였다. 새 일반 시즌의 일별 경기 근거를 원문 대신 SHA-256 봉인으로 저장한다. 공식 기록·급여·성장·타석 시뮬레이션은 유지한다. 구 원문 및 복무 gameKey 근거 읽기를 유지하고, 일 마감 조언·성장 감사·기록 정정·복무 과거 이력 읽기를 함께 고쳤다. 정정은 새 봉인을 검증한 뒤 다시 봉인한다. 새 저장은 이 수정 이전 엔진에서 읽을 수 없다.

통합 엔진/측정기 집중 회귀27/27, 귀국 재도전2/2, 엔진 빌드·전체 테스트 타입 검사·변경 범위 lint가 통과했다. [엔진 회귀](evidence/CODEX-20261108-seal-integration-tests.log), [귀국 회귀](evidence/CODEX-20261108-return-retry-after-seal.log). 첫 봉인 API 재현은 누락된 조언 reader에서 실패한 뒤 호환 수정했다. 당시 실패 증거 `us-sealed.*`는 성공으로 세지 않는다.

수정 후 전체 US API 시즌은 실행 중이며 세션12566, [실행 로그](evidence/CODEX-20261108-us-seal-verified.log), 결과 파일 `CODEX-20261108-us-seal-verified.json`과 종료 코드 파일에서 최종 상태를 확인한다. 로그/JSON 종료 전에는 OOM 해결·시즌 완주·성능 목표 달성으로 표시하지 않는다. 전후 전체 시즌 결과 해시·135 항목별 벽시계 표·최신 전체check·브라우저/실기기·소진 은퇴의 전체 Flow는 미검증이다. 0e35641 전체check의 통과 수에 이번 집중검사를 합산하지 않는다. M2 전체와 24경로 native 증명은 아직 완료가 아니다.

# 인계 — 2026-11-08 잔여 사용량 마감

최신 집중 검증은 메모리 진단 HTTP 응답 불변·단계 순서와 무제안 귀국 요청→준비 시작→실제 진행 커서 저장→재조회 2/2 통과, 전체 테스트 타입 검사와 변경 범위 lint 통과다. [집중 로그](evidence/CODEX-20261108-followup-tests.log). 첫 회귀의 완료 경기 수 기대 오류는 실제 pending 경기/일 마감/공식 경기 증거 검사로 수정했다. 최신 변경 후 전체 check·브라우저·실기기·전체 귀국 2년 재검증은 하지 않았다. 이전 전체 check 결과와 구분한다.

기준 `0e35641` 이후 US 마이너 무제안의 국내 복귀 요청과 별도 귀국 소유 상태의 홈·Flow를 연결했다. 기존 명령만 사용하며 준비 시즌 시작·진행·정산·지명 선택을 표시한다. 무제안은 통제 fixture이며 자연 발생 경로 증명이나 귀국 전체 2년 플레이 완료는 아니다. 최신 추가 변경은 집중 검증 대상이고, 이전 전체 check 통과(1,174+57)는 `0e35641` 시점의 결과다.

US OOM 진단은 CPU 프로파일 없이 한 번 재현했다. `engine-return`과 `serialize-return` 다음 `update-return` 전에 `transaction-error`가 발생했다. 실패한 JSONB 직렬화 결과는 197,802,095바이트, RSS는 엔진 반환 약3.02GB·직렬화 후3.41GB·트랜잭션 오류 시4.51GB였다. DB update 호출 내부로 범위를 좁혔으며 드라이버/DB 내부의 정확한 할당과 메모리 한계 종류는 미확정이다. [재현 결과](evidence/CODEX-20261108-us-memory.json), [메모리 로그](evidence/CODEX-20261108-us-memory.stderr.log)를 보존했다. 진단 채널은 구독 시에만 단계 이름을 발행하고 원문 상태를 노출하지 않는다.

다음 작업은 미국 큰 상태 저장의 update/드라이버/DB 메모리 계측과 실제 PostgreSQL 경로 확인이다. 135의 항목별 벽시계 표와 미국 시즌 완주는 아직 미완료이므로 최적화·정확성 축소를 시작하지 않았다. 귀국 준비 완료 후 미지명·거절·선택 준비 시즌·미국 복귀의 전 흐름, 학교 훈련 UI, 브라우저·실기기 플레이도 남았다. 사용자 미확정 134 등은 보류한다. 팀원 기존 WIP와 원본 프로파일은 Git stash에 보존했고 통합 소스를 기준으로 작업했다.

# 인계 — 2026-11-08 전체 자동 검증 통과

작업 브랜치는 `codex/tf-fast-season`, 작업 트리는 `C:/Users/OJT/.codex/worktrees/tf-fast-season/baseball_career`다. 학교 사건 ID는 표시 당시 사건·버전에 고정했다. KBO 재계약·FA, 미국 재계약·FA·마이너 만료 제안과 확인→서명을 연결했고, 견적 변경 시 확인·서명을 해제한다. KBO 무제안 FA는 은퇴 요청·취소·확정을 지원하며 취소 시 시장을 보존한다. 은퇴 확정 후 FA 활성 뷰는 숨기고 공개 보관·작별 사건을 유지한다.

- 검증: 전체 `npm run check` 종료 코드 0. API·엔진 1,180건 중 1,174 통과·6 건너뜀·실패 0, 웹 57/57. 린트·전체 타입·빌드·엔진·이벤트·설계·Android 셸·에셋 검사까지 완료했다. [전체 로그](evidence/CODEX-20261108-full-check.log)와 [종료 코드](evidence/CODEX-20261108-full-check.exitcode.txt)를 보존했다.
- 건너뜀: 대규모 저장 PostgreSQL HTTP 3건, Neon 1건, Managed Auth 1건, 선택적 복무 2년 네이티브 1건. 해당 경로의 이번 실행 통과를 뜻하지 않는다. 첫 검사에서 테스트 타입 오류 5건으로 중단됐고 이를 수정한 뒤 전체 검사를 통과했다. 첫 실패 로그도 보존했다.
- 측정: 고교 216경기 69.374초, 대학 216경기 30.805초, KBO 1,440경기 1,436.012초. KBO는 실행 경합이 있어 직접 속도 비교에 사용하지 않는다. 미국은 1,800경기 후 저장 중 OOM으로 중단됐다. [측정 요약](evidence/CODEX-20261108-profile-summary.md). CPU 표본 비율은 항목별 벽시계 비율이 아니므로 135의 0단계는 미완료이며 최적화는 미착수다.
- 다음 작업: 미국 저장 실패의 엔진 반환/직렬화/DB 경계별 메모리 계측과 전체 시즌 증명, 항목별 측정표 완성 후 동일 결과 해시를 유지하는 최적화. US 마이너 무제안 귀국 상태 웹 연결, 학교 훈련 재진입·E84 탐색·학교/대학 확정 성장 표시도 남았다.
- SLB-05/09/13/21은 부분 구현이다. 브라우저 확인·서명 상호작용과 실기기 플레이는 미검증이다. M2 전체 완료가 아니며 24경로 원본 증명 수는 임의로 늘리지 않았다. 134·능력 기여 막대·구단명 변경은 결정 전 보류한다. 다른 채팅의 작업 트리와 WIP는 보존했다.

아래는 이전 시점의 기록이다.

# 2026-11-08 계약 Flow 부분 구현·집중 검증

root에 통합된 SLB-13/09 범위는 KBO 재계약·FA 선택, US 재계약·FA·마이너 만료 제안이다. 확인 후 서명 단계로 진행하며 견적이 바뀌면 확인을 해제한다. 무제안 KBO FA E31의 기존 은퇴 가능 상태 동기화 수정은 root에 통합됐고 전체 자동 검증을 통과했다. US 마이너 귀국 상태는 웹 미연결이다. 계약 Flow 집중 검증은 API 3/3·웹 12/12 통과했으며 브라우저는 미검증이다. 전체 완료로 표시하지 않는다.

# 2026-11-08 TF 재개·측정 상태

팀장 독립 검증: KBO 프로파일 결과는 `season_review` / `SEASON_REVIEW`, 1,440경기·55명령·벽시계 1,436,011.7258ms, 초기 해시 불변이다. 최종 해시 `533754a33db04115da7a73a1dc043653e4d8273e3d2effbb5212b6214262bb33`. CPU 샘플은 복제 48.7751%, DB 11.6909%, 시뮬레이션 10.3875%, 미분류 20.2708%이며 경합·계측 오버헤드가 있다. 이 비율은 항목별 벽시계 비율이 아니다.

팀장 원본 JSON 검증: 고교는 `season_review`, 216경기·102명령·벽시계 69,373.8182ms, 소스 불변, 최종 해시 `1d304251844ba3558a0dbfdd0ef67af07523dfda79cbde48463aa762e9f44e24`다. 미국은 정규 1,800경기 후 `RESOLVE_LEVEL` 저장에서 HTTP 500 `INTERNAL_ERROR`, 서버 stderr `out of memory`로 중단됐다. 약 93.038초·5명령·`EVENT_DECISION`이며 시즌 완료가 아니다.

설계 135의 정확한 항목별 벽시계 표와 측정 0단계는 미완료다. 엔진팀은 새 CPU 실행 중단·증거 정리, UI팀은 KBO/US 계약 Flow, QA팀은 읽기 전용 검토를 맡는다. 결과 확인 전 해당 작업 통과로 표시하지 않는다. 전체 check는 미실행이며 성능 최적화는 미착수다. 아래는 이전 이력이다.

## QA 코드 검토 — 실행 재현 미실시

학교 E43 미루기 후 훈련 UI 재진입 경로가 없고, E84 navigation 응답을 웹에서 사용하지 않는다. 학교·대학 성장 정산은 `SEASON_REVIEW` 이후라 현재 결과 화면에서 능력 변화 표시 경로가 없다. 학교 stale action ID의 E43/E41 충돌 수정은 root에 통합됐으며 HTTP 1/1·변경 범위 lint 통과를 확인했다. 이 항목은 코드 검토에서 확인된 미완료이며 실행 재현은 하지 않았다.

# 인계 — 2026-11-07 Codex 구현 체크포인트

- 작업 브랜치 `codex/tf-fast-season`, 기준 `origin/claude/tf-lead`의 `d29db0f`. 팀장 작업 경로는 `C:/Users/OJT/.codex/worktrees/tf-fast-season/baseball_career`다. 계정 공용 5시간 잔여15% 확인 뒤 인계·저장으로 전환했다.
- 통합 완료 범위는 시즌 결과의 공식 기록·확정 성장/보수 표시, 은퇴 공개 요약, 고교 E43/E41/E84 해결 API다. 각각의 HTTP/표시/타입·린트 검사는 기록대로 통과했다. CH·순위·역할 배지와 은퇴 업적·상위3년은 남아 있다. 전체 check는 실행하지 않았다.
- 135 측정 0단계는 미완료다. 대학 실제 Hono/PGlite 216경기·6명령은30.805초, CPU 샘플 복제49.92%다. 이 비율은 벽시계 구성비가 아니다. 최초 고교는 E43에서72경기 후 막혔고 API를 수정했다. 수정 후 고교와 미국 측정은 대기한다. 1단계 최적화는 시작하지 않았다.
- KBO 프로파일은 별도 `tf-season-profile/baseball_career`에서 PID22636·실행 세션40678로 계속 실행 중이다. 마지막 확인은31명령·누적1219경기·670초다. 누적에는 이전 고교216경기가 포함된다. 종료 성공은 미확인이다. JSON은 종료 시 `docs/implementation/evidence/CODEX-20261107-profile-kbo.json`에 기록된다. 빌드 경합·launch 이후 API 변경을 메모했으므로 깨끗한 비교 기준으로 인용하지 않는다.
- 재개 순서는 KBO 프로세스/결과 확인 → 수정 후 고교·미국의 실제 API 측정 → 네 리그 표 완성 → 무손실 최적화와 전후 결과해시 비교 → 조용한 전체 check1회다. 실행 명령과 제한은 [프로파일 메모](evidence/CODEX-20261107-profile-notes.md)를 따른다.
- 계약 Flow는 미구현이다. RED 테스트 패치는 [보존본](evidence/CODEX-20261107-contract-flow-red.patch)에 있다. 적용하면 현재 실패하는 테스트이므로 제품 회귀 통과로 세지 않는다. 원래 WIP는 `tf-season-review/baseball_career`에 보존했다.
- 134, 능력 표시 합계형, 구단명 변경은 사용자 결정 대기다. 다른 작업 공간/WIP는 보존했다. 권한에 막힌 Git/빌드는 팀장 실행으로 모으고 추가 승인창을 반복 요청하지 않는다.

# 2026-11-07 TF 인계 전환

팀장 보고: 시즌 결과 UI·은퇴 요약 UI·학교 사건 API는 root에 통합됐다. FA 후속 WIP는 결과 확인 전 미완료다. 설계 135 측정 0단계는 미완료: KBO는 1,219경기 이후 실행 중으로 최종 종료 결과 미확인, US는 대기, 학교는 E43 연결 후 재측정 대기다. 전체 `npm run check`는 미실행이며 성능 최적화는 미착수다. 기존 측정·구현 세부와 설계-구현 불일치 표를 유지하고 결과 확인 후 갱신한다.

# 2026-11-07 SLB-21 은퇴 요약 부분 구현

UI 입력 커밋 `ebfaa2d313b7064c9d2a25c051d8b9686f5f1475`는 팀장 통합 예정이다. 공개 archive DTO의 선수·은퇴 정보, 리그/단계별 공식 통산 및 제공되는 수입만 Flow에 표시하고 열린 farewell 명령을 유지한다. 업적·가장 빛난 3년은 공개 DTO와 승인 산식이 없어 미표시이므로 부분 구현이다. 신규 커리어 점수와 미확정 134는 구현하지 않았다. 팀장 보고: HTTP 1/1, 표시 3/3(시즌 결과 2·은퇴 1), API·웹·테스트 타입 및 변경 범위 lint 통과. 통합 후 전체 check와 브라우저·실기기 검증은 미확인이다.

# 2026-11-07 고교 사건 연결 QA

팀장 보고: 학교 사건 연결 수정 `78243ce8d9629f09d94e5ed5502344f7efc54f8e`를 통합 기준 `fa770d3`에 반영했다. 고교 72경기 E43의 API `nextActions` 공백을 수정하고 `RESOLVE_WINDOW`/`RESOLVE_HIDDEN`/`TRAIN`과 홈 E43 미루기·E41 확인·E84 확인을 연결했다. HTTP 3/3·API/테스트 타입·변경 범위 lint 통과 보고. 학교 훈련 선택 UI 재진입은 후속이다. 이 수정 포함 고교 전체 재측정은 예정이며 성능 개선 완료 근거가 아니다.

# 2026-11-07 SLB-05 시즌 결과 부분 구현

UI 입력 커밋 `a33601dcd6876f6ecd8d33d0feff9e24421f2f57`는 팀장 통합 예정이다. 시즌 결산 Flow에 공식 정규 기록과 이닝·율을 표시하고, 확정 성장·보수 원장이 있는 값만 표시한다. CH·팀 순위·역할 배지는 미구현이므로 부분 구현이다. 팀장 보고: HTTP 1/1·전체 테스트 타입 통과. 담당자 보고: 화면 2/2·변경 범위 lint 통과. 통합 소스 전체 `npm run check`와 브라우저·실기기 검증은 아직 확인하지 않았다.

# 2026-11-07 Codex TF 인계·배정

지정 기준은 `origin/claude/tf-lead`의 `d29db0f`, 작업 브랜치는 `codex/tf-fast-season`이다. 03은 설계 135의 0단계 측정, 02는 SLB-05 시즌 결과 화면을 담당한다. 팀장은 결과 검수·통합 후 조용한 전체 `npm run check` 1회를 담당한다. 현재 작업과 검증 결과는 미확인이다.

측정표와 상위 3개 병목이 나오기 전 성능 최적화 착수·완료를 주장하지 않는다. 전체 check와 설계 135 §5 검수도 결과 확인 전 미완료다. [최신 인계](NEXT-SESSION.md)의 설계-구현 불일치 표를 유지한다. 아래는 이전 이력이다.

# 2026-11-07 Claude 팀 마감 — 설계 이관

- 사용자 확정: 커리어 진행 템포(타석 개입 없음, SLB 수준 빠른 시즌 진행). 성능 설계 [135](../design/135-FAST-SEASON-PROGRESS.md).
- 제안: 100 초과 선수 표현 [134](../design/134-OVER-100-RATING-ANALYSIS.md)(권장 D, 결정 대기).
- 벤치마킹 7차 중 중단, MLB 포스팅 존재 확인으로 6차 판정 정정.
- 구현은 다른 TF팀으로 이관. 인계: [NEXT-SESSION](NEXT-SESSION.md) 맨 위, 프롬프트 [HANDOFF-CLAUDE-TF-20261107](HANDOFF-CLAUDE-TF-20261107.md).

# 2026-11-07 저녁 Claude 팀 — 설계 반영과 구현 동기화

- 확정 결정(14)에 SLB 반영 원칙·불채택 목록과 "설계 변경 시 구현 동기화" 규칙 추가, 설계 패키지·manifest 재생성(verify:design 통과).
- 구현 점검: 비가역 명령 확인 원칙에 맞춰 재도전 '준비 시즌 시작'(평생 기회 1회 소모)에 확인 문구 추가, 회귀 테스트(native-school-flow-http 5/5).
- 추적: [SLB 구현 설계서 §6](../benchmark/SLB_CAREER_IMPLEMENTATION_SPEC.md) 구현 위치표, [인계](NEXT-SESSION.md) 설계-구현 불일치 표, AGENTS.md 규칙.

# 2026-11-07 오후 Claude 팀 — SLB 3차 플레이와 구현 설계서

- SLB Career 3차 직접 플레이: 타자 18시즌(대학 4년, 1R 지명, 1군·MVP·골든글러브, 비FA 다년 제안, 상무 합격·전역·콜업, 라이벌, WBC·프리미어12, FA 3회·1+1 상호옵션, 노쇠, 41세 은퇴·레거시·기록실). [3차 기록](../benchmark/SLB_CAREER_PLAYTHROUGH_03.md).
- 다른 팀이 그대로 구현할 수 있는 [구현 설계서](../benchmark/SLB_CAREER_IMPLEMENTATION_SPEC.md)(SLB-01~23, 채택/변형/불채택, 근거 설계 문서, 엔진 현황, 수용 기준)와 [백로그](../benchmark/SLB_CAREER_BACKLOG.md) 갱신.
- 4·5차(04 작업자): 투수 불펜·선발→마무리 커리어, 보직 변경 제안, 금메달 병역특례·FA 인정 일수, 부가 콘텐츠·은퇴 저장 확인. 부상 0회(투수 14시즌·타자 18시즌). 미확인: 해외 진출·강제 은퇴·로그인 필요 기능.
- 통합 검사: 00cf5db까지 전체 통과(1163/1169). eb327cd·29ded68 포함 전체 check는 `us-amateur-return-career` 테스트에서 비정상적으로 오래 걸려 두 번 미완료. 측정 결과 29ded68 전후 모두 같은 테스트가 단독 10분 초과 — 회귀 아님(장기 네이티브 테스트·CPU 경합). 조용한 시간에 재실행 필요.

# 2026-11-07 Claude 팀 착수·SLB 플레이·장면 적용

Codex와 별개로 Claude Code 팀(브랜치 `claude/tf-lead`, 기준 `d71236b`)이 같은 목표를 병행한다. 운영: [TF-OPERATIONS-CLAUDE](TF-OPERATIONS-CLAUDE.md). SLB Career를 직접 플레이해(생성~프로 1년차) [기록](../benchmark/SLB_CAREER_PLAYTHROUGH.md)·[분석](../benchmark/SLB_CAREER_UX_ANALYSIS.md)·[백로그](../benchmark/SLB_CAREER_BACKLOG.md)를 남겼다. 이는 아래 11-06 항목의 'SLB 미완료'를 대체한다. 승인 애니 장면 12종(`art-*`)을 `apps/web/src/styles.css`에 적용했다(`c3b305d`). 웹 테스트 50/50, 웹 빌드·verify:assets·verify:android·verify:design 통과. 전체 `npm run check`와 실기기는 미실행이며 엔진 코드는 바꾸지 않았다. 문서 색인: [DECISIONS](../DECISIONS.md)·[CHANGELOG](../CHANGELOG.md).

# 2026-11-06 TF 후속 구현

- KBO. AI·콜업 검토가 복제한 상태를 병합해도 진행 중인 커서를 유지한다. 같은 오류를 재현한 회귀와 공식 201경기(59~90일), 로스터 검토 10건, JSON 재개를 확인했다. 고교 접두는 통제했다.
- 대학·저장. E73/E74 계속 재학·조기 KBO 지명·복귀와 E75 졸업→KBO 입단을 웹에 연결했다. 통제 학년 자료에서 실제 HTTP/PGlite 명령을 확인했다. 대형 검증용 원문 사본을 64KiB 단위 SHA-256으로 줄였고, 기존 원문 봉인을 읽는다. 새 봉인 저장을 읽으려면 호환 리더가 필요하다.
- 미국. 시즌·월 진행 API를 일괄 엔진 작업에 연결했다. 시간 제한 판단은 API가 맡고 엔진은 같은 진행 결과와 중단 사유를 유지한다.
- 검증. 엔진 회귀 76건, 웹/API 경계 HTTP 6건, 전체 린트·타입, 컴파일 엔진 골든 해시 확인. SHA 청크 경계는 별도 테스트로 확인했다.
- 남은 확인. [폐쇄 격차표](M2-CLOSURE-GAPS-20261106.md) 기준의 4/24 상태 유지. P05 실제 대학 4년과 P15 실제 정규·포스트시즌/에이전트 전체, 500MB 이상 저장, 전체 check, 실기기는 미검증이다. 대학 미국 제안 화면은 남아 있다.

# 2026-11-06 TF 착수와 로그인 에셋

[TF 운영](TF-OPERATIONS.md)에서 역할과 작업 범위를 관리한다. [SLB 직접 플레이](../benchmark/SLB_CAREER_PLAYTHROUGH.md)는 접속 승인 거부로 미완료다. [승인 네이비 메인](../assets/ASSET_INVENTORY.md)을 로그인에 연결했고 로컬 브라우저 1280×800·390×844에서 크롭과 폼 배치를 확인했다. 로그인 인증과 실기기는 별도 검증이다. 아래는 이전 작업 이력이다.

# 최신 구현 — 2026-11-05: 고교 native 웹 이어하기·재전송 보완

[M2-SCHOOL-WEB-RESUME-20261105.md](M2-SCHOOL-WEB-RESUME-20261105.md). 기존 웹 커리어 화면에서 실제 고교 저장을 읽고 서버가 제공한 생성 확인/집중 유지/프리시즌/경기 명령을 실행한다. 실제 API+웹 어댑터로 두 클라이언트 읽기·POST 응답 상실·후속 GET 상실을 검증했다. COMMAND_ID_REUSED 재현 후 요청 전체를 재조회 성공까지 유지하도록 보완했다. 웹25/25·학교HTTP2/2·타입/린트0. 생성 폼·나머지 사건/졸업/KBO 전체 화면은 아직 남아 있다.

현재 복무 검사는 PID12812의 source9502bc35dfb67a94 동결 실행, 후속 첫 미국 정규시즌은 pwsh PID2576이 원래 process 종료를 대기한다. 실제 최종 보고서가 없으므로 둘 다 PASS로 세지 않는다. 동결 engine/rules/src/dist와 engine/test 수정·중복 생성·반복 폴링 금지. 서비스 테스트 WIP/큰JSON/zz는 보존했다. 두 검사 통과와 잔여 수정 후에만 전체 npm run check1회. PC 종료 금지, V 문서 Copy-Item만. M2 관리65%·전체87.5% 유지. 아래는 과거 이력이다.

# 최신 구현 — 2026-11-05: DB fixture 없는 고교 native 시작·첫 worker

[M2-SCHOOL-START-HTTP-20261105.md](M2-SCHOOL-START-HTTP-20261105.md). 소유한 빈 CAREER 저장에서 실제 생성→선수 확인→집중 유지→프리시즌→경기 worker, 타자/투수 및 KBO/M3/M4 회귀 묶음8/8·타입/린트0. 기존 저장 덮어쓰기/CLUB mode/seed 주입 거절. 웹 생성 UI 연결과 고교 전체 경로는 아직 남아 있다.

[M2-US-RETURN-SEASON-DRIVER-20261105.md](M2-US-RETURN-SEASON-DRIVER-20261105.md)의 후속 검사는 pwsh PID2576이 Wait-Process로 복무 검사 PID12812 종료를 기다린다. 실제 복무1/1 PASS와 source 일치 후에만 재계약 첫 미국 정규시즌/급여/성장 검증을 실행한다. WAITING은 PASS가 아니다. 두 검사 로그 반복 폴링/중복 생성 금지·engine/rules/test 동결·서비스 WIP/큰파일 보존·PC 종료 금지. 전체 check 미재실행. 관리 M2 65% 유지. 아래는 과거 이력이다.

# 최신 구현 — 2026-11-05: KBO 입단 native HTTP 연결

[M2-KBO-ENTRY-HTTP-20261105.md](M2-KBO-ENTRY-HTTP-20261105.md). 실제 저장 명령 지명 준비→결과→서명→아마추어 연말 마감→KBO 첫 등록, 타자/투수2/2·타입/린트0·읽기 전용 리뷰 이상 없음. 실제5명령 해시를 보존했다. controlled 고교 접두이므로 전체24경로/웹 생성 완료가 아니다.

복무2년은 source9502bc35dfb67a94의 별도 hidden background이며 아직 완료 증거 없음. 동결 engine/rules/test 수정·반복 폴링 금지. 원본 서비스 WIP/큰JSON/zz 보존. 전체 check 미재실행. 다음은 실제 서비스 완료/재계약 첫 시즌 완주·최신 KBO 귀국 authority·E96·웹 native 생성/연결·99/24/PF다. PC 종료 금지. 아래는 과거 이력이다.

# 최신 구현 — 2026-11-05: 아마추어 E35 공개 조회·HTTP 확인 완료

[M2-AMATEUR-E35-HTTP-20261105.md](M2-AMATEUR-E35-HTTP-20261105.md)와 [서비스 실행](M2-NATIVE-SERVICE-CACHE-20261105.md)을 먼저 읽는다. E35 open 뒤 GET400을 고쳐 실제 HTTP2/2(E35+기존E36), actor/basis/day/revision 범위·receipt·CAS/replay/소유권·공개 필드를 검증했다. optional 이전2회는 controlled라 전체3native시즌 증거가 아니다.

서비스 인프라는16e39cf로 푸시됐다. 실제 서비스2년 선택 검사는 sourceSha9502bc35dfb67a94d09bf58822b914b84804620839390bbae05393268ea8bd7c의 hidden background이며 완료로 세지 않는다. service-prefix-run.run.json/.exitcode.txt가 최종 근거다. 반복 폴링/중복생성/동결한 엔진 파일 수정 금지. 원본 서비스 WIP/큰JSON/zz 보존. 아래는 과거 이력이다.

# 최신 구현 — 2026-11-05: 서비스 접두 캐시·완료 원장 보완, 실제2년 백그라운드 실행

[M2-NATIVE-SERVICE-CACHE-20261105.md](M2-NATIVE-SERVICE-CACHE-20261105.md)를 먼저 읽는다. 캐시/동결공유/잠금8건과 서비스 경계/연속성3건 통과. source/runtime bytes·canonical SHA256·owner 검증, 체크포인트·단일 writer·중단 후 보존 복구, 실제 정정 원장 교차 검증/US 재계약 전달을 구현했다. 정산 경계 자료는 controlled며 native2년 증거가 아니다.

실제 서비스2년 검사는 PID 12812 hidden background로 시작했고 현재 완료로 세지 않는다. source 9502bc35dfb67a94d09bf58822b914b84804620839390bbae05393268ea8bd7c. service-prefix-run.run.json/.log/.exitcode.txt를 확인한다. 반복 폴링/중복 생성 금지. rules/engine source·dist·engine tests 동결. 원본 서비스 테스트 WIP와 기존 큰파일 보존. test patch 복구 순서는 위 문서. 통과한 뒤에만 WIP 커밋 및 전체 npm run check1회 검토. 다음은 재계약 첫 시즌 전체 정산·최신 KBO authority·E96·99/24/PF·웹 연결이다. PC 종료 금지. 아래는 과거 이력이며 당시 최신 표기는 현재가 아니다.

# 최신 구현 — 2026-11-05: 미국 이적 관계 분리·E95 검증 완료

[M2-US-OPPONENT-REUNIONS-20261105.md](M2-US-OPPONENT-REUNIONS-20261105.md)를 먼저 읽는다. 실제 정규 일마감/MLB PS FINAL hook·US 공개 관계/저장 읽기와 확정 minor/Major 외국단 이적 분리를 연결했다. 최종12/12·fail0·skip0, 전체 타입/린트/build 종료0·리뷰 보완 완료. 부상 예비 등록과 legacy fallback 유지. native 정규/controlled PS·계약 접두를 구분한다.

다음은 미국 E96 같은 팀 재회와 Major 국내 복귀 최신 KBO authority다.99/24/PF·웹·대형DB·실제2년 복무/전체 runtime은 미완료. M2 관리65%·전체87.5% 유지. 원본 사용자 WIP18줄/큰파일 보존. commit/push 최종값은 git log/remote로 확인한다. PC 종료 금지·V 문서 Copy-Item만. 아래는 과거 이력이다.

# 최신 구현 — 2026-11-05: 은퇴 재요청·복무 시즌 진행 수정 완료

[M2-RETIREMENT-AND-SERVICE-PROGRESS-20261105.md](M2-RETIREMENT-AND-SERVICE-PROGRESS-20261105.md)를 먼저 읽는다. 은퇴 취소 뒤 E36 재요청 충돌과 귀국 복무 완료 신호를 수정했다.21/21+집중1/1·전체 타입/린트/웹24/빌드 종료0. 실제2년 완주는 미검증이며 old cap3000 검사는 중지 종료1로 분리 기록했다. 사용자 WIP 원본과 개선본 patch를 보존했다.

현재 source는 git log/remote로 확인한다. 다음은 미국 E95/E96와 Major 국내 복귀 authority 잔여 연결이다. M2 관리추정65%·전체87.5% 유지. PC 종료 금지. 아래는 과거 기록이며 당시 실행 중/최신 표기는 현재 상태가 아니다.

# 최신 구현 — 2026-11-05: Major FA E66 저장·서명 연결

[M2-MAJOR-FA-E66-20261105.md](M2-MAJOR-FA-E66-20261105.md)를 먼저 읽는다. 실제 E66 계약 창/저장 OPEN·NAV와 기존 FA 수락/은퇴 성공의 DOMAIN 해소를 연결했다.15/15·types/lint/engine/API build0·독립 리뷰 통과. 원구단 agent 증액/legacy 창 없는 FA와 금융 replay 유지. OPEN_RETURN은 S33 NAV까지만이며 실제 Major 국내 복귀 authority/등록은 잔여다.

다음은 새 RED로 발견한 은퇴 취소 뒤 재요청 ID 충돌과 귀국 service 완료 신호/검사 cap 보완이다. 이전 실제2년 선택 검사는 cap3000<최소3516으로 완주 불가해 중지했다. stop-reason 증거를 확인하며 종료1을 새 제품 실패나 PASS로 세지 않는다. 기존 사용자 WIP15줄/큰파일 보존. PC 종료 금지. 아래는 과거 이력이다.

# 최신 구현 — 2026-11-05: 프로 은퇴 인사·보관 이동 API 완료

[M2-PRO-ARCHIVE-NAVIGATION-20261105.md](M2-PRO-ARCHIVE-NAVIGATION-20261105.md)를 먼저 읽는다. E37/E69 OPEN_ARCHIVE를 실제 native archive/이벤트 owner에 연결했고 기존+신규API7/7·types/lint/build0·독립 리뷰 통과. 사건 metadata/revision만 바뀌고 과거 세계/급여/기록·ARCHIVED를 보존한다. legacy 카드 없어도 보관 조회 유지.

다음은 미국 Major FA E66 사건 연결이다. 실제2년 복무 재서명1건은 세션17857에서 실행 중(복무 수정5f6a1ca 기준). 결과와 검증 source 범위를 분리해 확인한다. 이전 전체 종료1은 그대로 남는다. 사용자 WIP/큰파일 보존·PC 종료 금지. 아래는 과거 기록이다.

# 최신 구현 — 2026-11-05: 복무 휴식일 판정 보완·실제2년 회귀 실행 중

[M2-US-SERVICE-ADVICE-DAY-20261105.md](M2-US-SERVICE-ADVICE-DAY-20261105.md)를 먼저 읽는다. 기존2fb681e를 보완해 실제 빈 날짜 receipt/현재 schedule 연결을 확인한다.29/29·build/types/lint0·독립 리뷰 지적 없음. 이전 실패의 실제2년 native 재서명 회귀1건은 세션17857에서 실행 중이며 PASS로 쓰지 않는다. evidence/M2-20261105-native-service-run.json/.log/.exitcode.txt와 engine/rules freeze를 확인한다. 기존 사용자 WIP15줄과 큰 파일 원본 보존.

사용자는 인계 종료가 아니라 이 체크아웃에서 계속 구현을 지시했다. E37/E69 보관 이동 API를 구현 중이며 native 실행과 무관한 API 작업을 이어간다. 전체 check는 매 수정 반복하지 않는다. PC 종료 금지·V는 docs 복사만. 아래는 과거 기록이다.

# 최신 상태 — 2026-11-05: 전체 실패 결과 확정·후속 수정 검증 필요

[M2-HANDOFF-20261105.md](M2-HANDOFF-20261105.md)를 먼저 읽는다. 전체 check는 이미 종료1:1120건 중1113통과·2실패·5제외, source583파일 실행 중 변경0. 두 실패는 기존 테스트 WIP의 ADVICE_DAY_NOT_CLOSED이며 당시 DBG도 포함했다. 다음 웹/최종 build 단계는 도달하지 않았다.

다른 곳의 수정2fb681e가 현재 HEAD/remote에 반영돼 있다. 미국 season.days를 종료 근거에 추가한1줄 변경이며 수정 후 통과 증거는 아직 확인하지 못했다. 다음은 이 수정의 작은 경계 회귀와 실제2년 복무 테스트 검증이다. 현재 WIP15줄은 원본 보존하고 evidence 패치로 백업했으므로 다른 체크아웃에서도 재현할 수 있다. 전체 검사를 즉시 다시 시작하거나 이미 끝난 세션51745를 기다리지 않는다. PC 종료 금지·V는 문서 복사만. 아래는 과거 이력이다.

# 최신 —6묶음 푸시·전체 검사 진행 중

M2-20261104-SAVE-API-CHECKPOINT.md를 먼저 읽는다. 기능 source는cc16fb5이며 여섯 묶음 커밋/푸시 완료. 이번 신규 API33건은 현재 전체 실행에서도33/33 통과했다. 전체 로그 중간 표식64통과/0실패이며 최종 PASS가 아니다. 린트/전체 타입 통과, native 미국 귀국·재도전 두 긴 파일 실행 중이다. 사용량 잔여8%에서 관찰한 한 경로의 native 의무 준비2년 완료 출력까지 확인. 해당 검사/전체 종료를 뜻하지 않는다. source583파일 중간 해시 변경0, 최종 freeze-check는 종료 뒤 확인한다.

전체 npm run check 세션51745, powershell PID26896. evidence/M2-20261104-batch-run.json·-check.log·-check.exitcode.txt·-freeze-check.json을 확인한다. 이 채팅에서write_stdin51745가 가능하면 사용하고, 다른 환경은 PID/로그/exitcode로 판정한다. 중복 전체 검사를 시작하지 않는다. -checkpoint.log/-run-checkpoint.json/-midrun-freeze-check.json은 중간 스냅샷일 뿐이다. 종료코드 파일이 없으면 완료로 쓰지 않는다. 이전90394는 결과 미수집/PASS 아님.

M2 관리추정65%·전체87.5% 유지. Major E66/최신 KBO 귀국 authority·미국 E95/E96·99/24/PF·실제 화면·대형DB 잔여. 기존 사용자 WIP21줄/큰JSON/zz 보존. PC 종료 금지. V는 문서 Copy-Item만. 최종 문서 커밋은git log/remote로 확인. 아래는 과거 기록이다.

# 최신 — 미국 관계 history·E94 저장 API 검증 완료

M2-US-RELATIONS-API-20261104.md를 먼저 읽는다. 실제 US 레벨 명단/학교 archive/저장 은퇴 supply만 사용해 공개 관계 목록·상세와 E94 native 읽기 owner를 연결했다. 누락된 과거 KBO 신원은 UNKNOWN_REFERENCE 유지, E95/E96는 별도 owner 미완료.15/15+mixed-scope1/1·types/lint/engine/API build0·독립 리뷰 blocking 지적 없음. 실제 HTTP CAS/재전송/소유권 검증.

현재 묶음 뒤 전체 check를1회 실행할 예정이며 결과를 확인하기 전 PASS로 쓰지 않는다. 기존90394는 결과 미수집. 사용자 WIP21줄/큰JSON/zz 보존. PC 종료 금지. Major E66/귀국·미국 재회·99/24/PF·실제 웹·대형DB 잔여. 최종 commit/remote는 git 확인. 아래는 과거 이력이다.

# 최신 — 업적·별칭 저장 API 검증 완료

M2-CAREER-HONORS-API-20261104.md를 먼저 읽는다. E90 업적 열람/E42 별칭 확인과 CAREER_HONORS 공개 조회를 기존 shell/native owner로 연결했다. API4+native16=20/20·타입/lint/API build 종료0·독립 리뷰 지적 없음. 기념 보상/별칭 이력 유지, 내부 receipt/보상 근거 비공개. 실제 HTTP는 US A01/E90 저장을 검증했다. E42 연말은 controlled 원장이다.

다음은 US 관계 E94·공개 history adapter의 실제 저장 자료 범위와 Major E66/귀국이다. 근거 없는 과거 KBO 선수 신원/등록은 생성하지 않는다. 99/24/PF·기본 실제 웹·대형DB 잔여, 전체90394 결과 미수집. 사용자 WIP 보존·PC 종료 금지. Git 최종 hash는 log/remote 확인. 아래는 과거 기록이다.

# 최신 — 프로 은퇴·보관 저장 API 검증 완료

M2-PRO-RETIREMENT-API-20261104.md를 먼저 읽는다. KBO/US native 요청·확인/취소·최대나이와 공개 계약 확인/보관 조회를 저장 API에 연결했다. API4+native9=13/13, 타입/lint/API build 종료0·독립 리뷰 지적 없음. 실제 KBO HTTP CAS/재전송/소유권·보관 재조회 검증. 정규시즌 접두는 controlled이며 native 전체 시즌 증거는 아니다.

99사건12개 행에 scoped API/native 증거를 추가했으며 자동 전체 시즌/기본 웹 완료와 구분한다. 미국 관계 adapter·Major E66/귀국, 24/PF·실제 화면·대형 DB가 잔여. 전체90394 결과 미수집/PASS 아님. 사용자 WIP 보존, PC 종료 금지. 최종 commit/remote는 git 확인. 아래는 과거 이력이다.

# 최신 — 학교·대학·KBO 관계 저장 API 검증 완료

M2-CAREER-RELATIONS-API-20261104.md를 먼저 읽는다. 관계 목록/범위 상세와 E94~E96 native 처리·대학 연말 재봉인을 저장 API에 연결했다. 새 API4+native21=25/25, 타입/lint/API build 종료0·독립 리뷰 지적 없음. 미국은 history adapter/과거 신원 보존 부족으로 명시 거부하며 완료로 세지 않는다.

다음은 프로 은퇴/보관 API, 미국 Major E66/귀국 및 관계 adapter다. 전체90394 결과 미수집/PASS 아님. 사용자 WIP 보존, PC 종료 금지. M2 전체/99·24·PF·일반 웹 완료 아님. 최종 커밋/푸시는 git log/remote 확인. 아래는 과거 기록이다.

# 최신 — 시즌 목표·에이전트 저장 API 검증 완료

M2-CAREER-SUPPORT-API-20261104.md를 먼저 읽는다. 목표3명령·agent5명령과2공개 조회를 native owner에 연결했다. native preview context는 SHA256 토큰으로 공개하고 서버가 현재 quote를 다시 구해 검증한다. 미국 자금/미래 권한은 실제 owner만 사용하며 지원 추정0. 지원 API7/7, 앞 프로 사건과 결합15/15, 타입/lint/API build 종료0·독립 리뷰 지적 없음. native 역할/연봉 확률·RNG 결과 동일, HTTP 소유권/CAS/재실행 검증.

다음은 관계 E94~96 공개 읽기/해결 및 미국 Major E66/국내 복귀 연결 범위다. 이전 전체90394는 결과 미수집/PASS 아님. 기존 WIP21줄·큰 runtime JSON 보존. M2 전체/99·24·PF·일반 웹 연결 완료를 주장하지 않는다. PC 종료 금지. Git hash는 log/remote 확인. 아래는 과거 기록이다.

# 최신 — 프로 사건 저장 API 검증 완료

M2-PRO-EVENT-SAVE-API-20261104.md를 먼저 읽는다. CAREER_PRO_EVENT_ 네 도메인(조언/의료·기록/수상/구종), PRO_EVENTS 공개 조회와 저장 CAS 배선. 새 API8+기존native19=27/27, 타입/lint/엔진·API build 종료0. prototype 입력·닫힌 훈련창 표시·archived/필수선택 repertoire 처리 빈틈을 RED로 재현·수정. 독립 리뷰 P2 해결 확인. 원래 경력/의료/기록 접두는 controlled, 실제 선택/HTTP 저장 검증이다.

기존 전체90394는 결과 미수집이며 PASS 아님. 다음은 기존 에이전트·목표 처리기의 저장 명령/공개 preview, 이후99/24/PF·실제 화면이다. 사용자 WIP와 큰 runtime JSON 보존. PC 종료 금지. 최종 hash는 Git log/remote로 확인한다. 아래는 과거 기록이다.

# 최신 확인 — 이전 전체 검사 결과 미수집

2026-11-04 재개 시 세션90394는 존재하지 않고 해당 node 검사 프로세스도 없다. 종료 코드/최종 집계 파일 없음, 로그는930통과·실패 표식0에서 끝났다. 전체 PASS로 쓰지 않는다. 원인 추정 없이 ENDED_WITHOUT_RESULT로 기록했다. source536파일은 재개 전 변경0. 원격/HEAD f96ad8c 일치; 기존 WIP 보존. 다음 묶음은 기존 프로 조언·의료/기록·수상·구종 사건의 공개 저장 명령 연결이다. 전체 검사는 구현을 더 모은 뒤 재실행한다. PC 종료 금지. 아래 실행 중 표기는 과거 기록이다.

# 최신 인계 — 구현23cac7d 푸시·전체 검사 실행 중

MLB FA 원구단+타 구단 최대3곳 비교·실제 이적/역대 구단 지급/보장·옵션·동료 연결을 구현23cac7d로 커밋·푸시하고 원격 일치를 확인했다. 집중12/12·로스터3/3·견적1/1·KBO1/1, build/type/lint·독립 리뷰 통과. M2-US-MAJOR-FA-TRANSFER-20261104.md를 먼저 읽는다. M2 전체 완료 아님.

사용량 잔여1% 확인으로 현재 상태를 인계한다. 전체 npm run check는 세션90394에서 실행 중이며 종료/통과를 주장하지 않는다. evidence/M2-20261104-major-fa-check.exitcode.txt 유무와 log 마지막을 먼저 확인한다. 실행 프로세스는 us-amateur-return-career.test.ts와 us-return-retry.test.ts이며 긴 실제 복무/재도전 경로다. 로그는 파일 순서 출력으로 현재930통과·실패 표식0에서 지연되고 후속 파일도 이미 실행됐다. 현재 source536파일의 중간 해시 대조 변경0; 종료 시 생성되는 major-fa-freeze-check.json을 확인해야 최종 검증이다. 실행 중 검사를 중복 시작하지 않는다. 이 채팅 세션이 유효하면 write_stdin90394로 확인하고, 다른 환경이면 node 프로세스/로그/종료코드 파일로 판정한다.

기존 사용자 테스트 WIP21줄과 큰 runtime JSON2개·zz-dbg.log는 보존/미스테이징했다. 전체 검사에는 현재 사용자 WIP도 포함돼 있다. 실제 Neon/Managed Auth/대형 PostgreSQL 환경 제외를 최종 통과와 구분한다. 기본 웹 화면의 미국 명령 연결·99사건 감사/24경로/PF·대형 DB는 남는다. PC 종료 금지, V: 문서/증거 Copy-Item만. 아래는 과거 이력이다.

# 최신 — MLB FA 타 구단 비교·실제 이적

[M2-US-MAJOR-FA-TRANSFER-20261104.md](M2-US-MAJOR-FA-TRANSFER-20261104.md)를 먼저 읽는다. 원구단+타 구단 최대3곳 조회/offerKey 수락, 현재 레벨·구단별 지급 이력·보장/옵션·동료 연결. 집중 묶음12/12·로스터3/3·견적1/1·KBO1/1과 build/type/lint 통과. 독립 리뷰 KBO-origin holder P1 수정·회귀/재리뷰 확인. FA6시즌 접두는 controlled이며 native6년 전체가 아니다.

구현23cac7d 커밋·푸시/원격 일치 확인. 전체 npm run check 세션90394 진행 중. evidence/M2-20261104-major-fa-check.log/.exitcode.txt와 freeze-check.json을 먼저 확인하고 실패면 고친다. source536 manifest는 최초 nonexistent config 오류 후 static 단계 중 기록했으며 코드 변경 없음. 현재 source 전체 통과/커밋/푸시 완료를 추정하지 않는다. 사용자 WIP21줄·큰 runtime JSON·zz-dbg.log 보존. PC 종료 금지. Git 최종 상태는 log/rev-parse로 확인한다. 아래는 과거 이력이다.

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

사용자 요청으로 추가 구현을 중지했다. [현재 상태·검증·재개 순서](M2-CHECKPOINT-20261102.md)를 먼저 읽는다. E70 집중 통과, E34/E35/E68와 경로 runner는 WIP다. 프로 준비 집중1통과/1실패, 귀국 native2시즌 중지, 경로 해시 미완료. 이번 전체 check 미실행이며 M2 전체 미완료. 마지막 전체 통과는4f0cde7이다.

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

# 최신화·복귀 통합 — 2026-10-30

원격 a46240c까지 반영. [이번 수정과 검증](M2-SYNC-20261030.md). 집중29/29·복무10/10·lint/타입 통과. 전체 통합 검사 실행 중이며 M2 전체 완료 아님.

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

# M2 전체 구현 계속 — 2026-10-29

PS 사건·해외 복무 세계·대학 조기 진출/휴복학·에이전트 실제 협상을 구현 중이다. [현재 작업판](M2-COMPLETION-WORKBOARD.md)에서 검증 완료와 WIP를 구분한다. 실제 복무 NPC75경기·본인 출장/급여0·원본 불변·JSON 재개를 집중 확인했다. 전체 통합은 다음 묶음 마감 때 실행한다. M2 전체 완료 아님.

# 최신 상태 — M2 BULK 통합 검증 통과 (2026-10-28)

원격 e26271b의 일괄 구현을 최신화하고 저장/사건 열람 경계를 수정했다. **전체 npm run check 종료0: 엔진/API844개 중842통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22.** lint·타입·build·엔진골든·이벤트·설계10종·Android셸·자산·HTTP 스모크 통과. 엔진/API duration_ms171601.1983, 소스 동결463파일 변경0. 실제 브라우저/Neon/Android 기기·전체24경로 통과는 아니다.

작업/Git은 E:/AI/Game/baseball_career·codex/m2-career-engine. 이전 4885afc 기반 로컬 시안은 origin/codex/m2-finish **8edf1ba**로 별도 보존했다. 중복 US4 계약 시안·별도 도전/UI를 최신 원장에 합치지 않았다. main/M6 병합·강제푸시·PC 종료 없음.

이번 수정: 없는 선택값 비교 오류, 낮은 국내 authority revision의 과거 목표 이력 보존, archive 열람 후 소유권 영수증 보존, 학교 목표 열람의 검증/재봉인, 봉인된 학교 루트의 일반 E94 읽기 거절, 무시한 E89의 뒤늦은 ACK. 제어 fixture와 기존 관계 테스트도 실제 투수 숙적 추가를 검증하도록 고쳤다. 첫 실패 로그를 보존했다.

다음: **PS E84/학교 US year-end 관계 열람 wrapper → 미국 국제대회 owner·국내 세계 atomic handoff → 전역 후30게임일 복귀 확정 →99사건/24경로/PF-D 실제 증거.** 사용자 확정 기한은13/14/21에 기록했고 실행은 후속이다. M2 약60%는 기존 범위 추정으로 유지하며 전체 완료 아님. [이번 구현·검증·인계](M2-RESUME-20261028.md).

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

# 최신 상태 — M2-EJ 검증 완료 (2026-10-28)

[상세](M2-EJ-KBO-US-CONTRACT-ORIGIN.md). 새 KBO 미국 계약 원점·시작 나이·다년 MLB/마이너 연도 재생·첫 콜업 급여/1년 전환·서명 기간 만료를 연결했다. 집중10/10+추가2/2, 전체 npm run check 종료0: 엔진/API 787개 중785통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 810442.1035, 동결 대상460파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. EI d819f51은 원격 일치 확인. M2약58%·전체 미완료. 만료 시장/국내 복귀 인계는 다음이며 사용자 결정을 다시 묻지 않는다.

# 최신 상태 — M2-EI 검증 완료 (2026-10-28)

[EI 상세](M2-EI-NATIONAL-PITCHER-REST.md). 대표 SP3세계일 휴식·RP/CP2일 연속 실제 등판 뒤 휴식을 날짜 기반 실제 준비에 연결. 국내 등판 포함·당일/미래/전년/벤치 제외·legacy/준비된 경기 보존. 집중17/17+최종3/3, 전체 npm run check 종료0: 엔진/API 781개 중779통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1179771.366, 동결 대상456파일 재개 기준점 이후 변경0(이전 중단 기준과4파일 바이트 차이는 freeze.resumed 기록). 실제 Neon/브라우저/APK 검증은 아니다. M2약57%·전체 미완료. 다음은 미국 계약 원점/서명기간 연결 등. fetch한main/M6는 미병합.

# 세션 마감 체크포인트 — M2-EH (2026-10-27)

5시간 한도 사용96%·잔여4% 확인으로 사용자5% 마감 기준 도달. 새 묶음 중지, EH까지 검증/정리해 own branch에 커밋·푸시한다. 전체778/776·실패0·Neon환경2·웹22/22·집중26/26·스모크 통과. PC 종료 안 함. 기능 해시는 푸시 뒤 최종 인계 핀에서 확정한다.

[EH 상세](M2-EH-NATIONAL-INJURY-BOUNDARY.md) · [다음 연결 계획](M2-POST-EH-IMPLEMENTATION-PLAN.md) · [사용량 체크포인트](evidence/M2-EH-usage-checkpoint.json). 최신 사용자 결정2개는14/20/23에 기록했으나 미국 MiLB 만료 비교/대표 불펜2연투 휴식의 추가 runtime 구현은 아직 하지 않았다. E61 성공 강등/OPEN_RIGHTS도 남았다. 이 답변을 다시 물어보지 말 것. M2약57%·전체 미완료. 실행 코드/테스트는 full gate 이후 변경0이며 추가 변경은 문서/증거뿐이다. V: 문서 Copy-Item만.

## 신규 확정 결정 (2026-10-27, 구현 후속)

KBO 출신 MiLB는 서명 기간 종료 뒤 미국 재계약/FA/국내 복귀 비교(고교6시즌 추가 적용 안 함). 대표 RP/CP는 이틀 연속 실제 등판 뒤 다음 날 휴식.14/20/23에 기록했다. 아래 이전 답변 대기 문구는 이 답변 전 이력이다. 현재 EH full gate의 실행 코드는 동결돼 이 결정의 추가 runtime 수정은 다음 묶음이다.

# 최신 상태 — M2-EH 검증 완료 (2026-10-27)

[EH 상세](M2-EH-NATIONAL-INJURY-BOUNDARY.md). 첫 한국 경기 전/다음 라운드의 부상 교체를 실제 prepare에 연결, 같은 GROUP/준비된 경기/과거출장 보존. 의료·90/100 전력은 통제 fixture, 결과16경기와 JSON 재개는 실제 실행. 후보 고갈은 원본 유지 거부. 전체 npm run check 종료0: 엔진/API 778개 중776통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 716580.0985, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. 최초 비자격 하위리그 긴급합류/US 풀/99/24는 남았다. M2약56%·전체 미완료.

# 최신 상태 — M2-EG 검증 완료 (2026-10-27)

[EG 상세](M2-EG-OVERSEAS-ENTRY-CONTINUITY.md). KBO→미국 병역 완료/비대상 보존·동일 세계/seed/다음 시즌 검사·연말 조회의 없는 고교 미국계약 접근 수정. 포스팅→캠프→실제 미국75경기·지급·JSON 재개 검사(과거7시즌은 통제 fixture). 전체 npm run check 종료0: 엔진/API 775개 중773통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 663675.2997, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. M2약56% 유지·전체 미완료. 마이너 계약 만료 정책 질문 답변 대기.

# 최신 상태 — M2-EF 검증 완료 (2026-10-27)

[EF 상세](M2-EF-WBC-PROFESSIONAL-CALENDAR.md). 사용자 WBC 결정 반영: 신규 프로 calendar-2는 WBC 종료 뒤 개막, 구 calendar-1/고정해시/원장 보존. WBC47경기·21일→캠프→실제 KBO10경기, 신규 미국75경기와 legacy75 해시 별도 검사, E46 첫 FINAL 알림. 전체 npm run check 종료0: 엔진/API 774개 중772통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 672040.6242, 동결 대상455파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. M2 전체 미완료. EE의 날짜 답변 대기 문구는 아래 과거 이력이다.

## 최신 작업 — M2-EE 검증 완료

기능 `fa61a6e319df58ab452ca024664d30d782195b68` 원격 푸시 확인. [EE 상세](M2-EE-NATIONAL-PHASE-DAY-AUDIT.md). 새 국제 단계·14일 연속 날짜/건강 감사·E48 정규 복귀, FINAL XP 원본 참조 공유 수정. 집중22/22. 전체 npm run check 종료0: 엔진/API 769개 중767통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 633942.4905, 동결 대상454파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. AG 전 정규 구간은 통제 prefix이며 전체 시즌 아님. WBC 개막 날짜 충돌 사용자 답변 대기. M2약55% 유지·완료 아님. PC 종료 금지.

## 최신 작업 — M2-ED 검증 완료

[ED 상세](M2-ED-NATIONAL-INJURY-TICK.md). closeCareerNationalDay→한국 FINAL health settle. 전체 check 767/765·Neon2·웹22/22. duration_ms 745981. 증거 `evidence/M2-ED-check.log`. M2≈55%. PC 종료 금지.

## 최신 작업 — M2-EC 검증 완료

[EC 상세](M2-EC-NATIONAL-DAY-CLOSE.md). 초청 기한 봉인·closeCareerNationalDay. 전체 check 767/765·Neon2·웹22/22. duration_ms 1103862. 증거 `evidence/M2-EC-check.log`. M2≈55%. PC 종료 금지.

## 최신 작업 — M2-EB 검증 완료

[EB 상세](M2-EB-POSTING-EVENT-RESUME.md). E62 invite·E64 ACCEPT/REMAIN 도메인 재개. 집중 posting 4/4. 전체 check 766/764·Neon2·웹22/22. duration_ms 1011454. 증거 `evidence/M2-EB-check.log`. M2≈54%. PC 종료 금지.

## 최신 작업 — M2-EA 검증 완료

[EA 상세](M2-EA-POSTING-EVENTS.md). E63 sealed decision 큐·E64 오픈·체결 시 취소. 전체 check 765/763·duration_ms 624903. 증거 `evidence/M2-EA-check.log`.

## 최신 작업 — M2-DZ 검증 완료

[DZ 상세](M2-DZ-US-MILITARY-18MO.md). 해외 18개월 2블록·즉시 COMPLETED 거절. 집중1/1. 전체 check 765/763·Neon2·웹22/22·스모크. duration_ms 710245. M2≈53%. 다음=국제 일마감/99/24/PF. PC 종료 금지.

## 최신 작업 — M2-DY 검증 완료

[DY 상세](M2-DY-INTERNATIONAL-TIMELINE.md). DX 대진↔실제28·기록·구종XP·봉인, P12 actualWindow. 집중24/24. 전체 npm run check 종료0: 엔진/API 765개 중763통과·실패0·Neon2건너뜀, 웹22/22. duration_ms 1044505. HTTP 스모크 통과. PC 종료 금지.

## 최신 작업 — M2-DX 검증 완료

[DX 상세](M2-DX-INTERNATIONAL-BRACKET.md). 승인4대회 프리셋·균등 조편성·홈원정 균형·실제107경기·단일 pendingGame/JSON/20회 동점21회 재개. 집중10/10. 순수 reducer fixture. 커리어 연결은 DY. 전체 npm run check 종료0: 엔진/API 762개 중760통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. duration_ms 1089016.2584. PC 종료 금지.

## 최신 작업 — M2-DW 검증 완료

[DW 상세](M2-DW-NATIONAL-SELECTION.md). 사용자 확정: 당해 충분 표본 중 최고리그, 없으면 전년(단 WBC 전년만). 실제28명 봉인·E44/E45·한자리 충원·실제 AG 기용, 실제 MLB 데뷔 E65·PF-D08/09/11/13 엔진검사. 집중25/25. 전체 npm run check 종료0: 엔진/API 757개 중755통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1168717.4243, 원본441파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. 국제 달력/중단/부상/XP·미국 통합·99/24/PF 잔여, M2 완료 아님. PC 종료 금지.

# M2-DV 최신 작업 — 국가대표 사건·국제 기록

[DV 상세](M2-DV-NATIONAL-INTEGRITY.md). E44/E46/E47/E48/E55·실제 AG 기록·투수 출장·체육요원 시즌 중복 차감 방지. E45/28명 AI·부상/XP·중단 worker는 후속이며 M2 완료 아님. 집중16/16. 전체 npm run check 종료0: 엔진/API 741개 중739통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 804191.6272, 원본434파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다.

# M2-DU 최신 작업 — 아시안게임 실제 대진

2026-10-27 · [상세](M2-DU-ASIAN-GAMES.md). AG 8개국 INTERNATIONAL 실경기·봉인. 전체 npm run check 종료 0: 736개 중 734 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 776919.0793. 증거 `evidence/M2-DU-check.log`. M2 추정 50% 유지. 다음=E44–48/E55·99·24·PF-D.

# M2-DT 최신 작업 — 국가대표 차출·병역 혜택

2026-10-27 · [상세](M2-DT-NATIONAL-BENEFIT.md). 초청/결과 봉인·ATHLETE_ELIGIBLE·체육요원3시즌. 전체 npm run check 종료 0: 735개 중 733 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 619230.9032. 증거 `evidence/M2-DT-check.log`. M2 추정 50% 유지.

# M2-DS 최신 작업 — 해외 병역 기한 계획

2026-10-27 · [상세](M2-DS-US-MILITARY-PLAN.md). FREEZE/TERMINATE·완료. 전체 npm run check 종료 0: 732개 중 730 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 726746.4544. 증거 `evidence/M2-DS-check.log`. M2 추정 50% 유지. 다음=국가대표·99사건·24경로.

# M2-DR 최신 작업 — 포스팅→미국 루트

2026-10-27 · [상세](M2-DR-US-ACTIVATION.md). 전체 npm run check 종료 0: 731개 중 729 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 694977.322. 증거 `evidence/M2-DR-check.log`. M2 추정 50% 유지.

# M2-DQ 최신 작업 — 해외 FA·포스팅 귀국

2026-10-27 · [상세](M2-DQ-OVERSEAS-FA-RETURN.md). 전체 npm run check 종료 0: 730개 중 728 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 825735.1666. 증거 `evidence/M2-DQ-check.log`. M2 추정 50% 유지.

# M2-DP 최신 작업 — KBO 포스팅

2026-10-27 · [상세](M2-DP-POSTING.md). 자격·요청·승인/보류·제안·체결(복귀권·구단 보상금). 미국 루트·해외 FA·귀국은 다음. 전체 npm run check 종료 0: 728개 중 726 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 774374.7154. 증거 `evidence/M2-DP-check.log`. M2 추정 50% 유지.

# M2-DO 최신 작업 — 원소속 MLB FA·옵션 선택

2026-10-27 · [상세](M2-DO-MAJOR-FA.md). main f087e00 병합 후 원소속 FA 체결과 보장 연차 동결, 옵션 소진 선택을 넣었다. 다른 구단·포스팅·귀국·API/화면은 없다. 전체 npm run check 종료 0: 엔진/API 725개 중 723 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 917911.8787. 증거 `evidence/M2-DO-check.log`. 브라우저/Neon/실기기 아님. M2 추정 50%는 유지한다.

# M2-DN 최신 작업 — 복무 목표·MLB 연간 계약 묶음

2026-10-27 · [상세](M2-DN-MAJOR-RENEWAL.md). 상무/현역 목표, 최종 최저연봉, 연도별 계약/재정/일일 급여, 서비스·옵션 이월, 재승격 중복 차감 방지를 묶어 구현했다. 전체 npm run check 종료0: 총716개 중714통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms839708.6663, 동결418파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. M2 추정50%는 유지한다.

# M2-DM 최신 작업 — 시즌 목표10종

2026-10-27 · [상세](M2-DM-SEASON-GOALS.md). 집중11/11, 실제 고교8경기에서 목표 전후 world/기록 동일·대학 선수권2경기에서G09/G10 달성과 정규 분리. 전체 npm run check 종료0: 총710개 중708통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms809722.8611, 동결412파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 미국 연봉 최종800000 보장 결정은13/14 갱신, 다음 계약 묶음 적용. 직전 DL7489497 main/작업 브랜치 푸시 완료. M2 전체 추정50%는 남은 핵심 경로와 통합 검수가 있어 유지한다.

# M2-DL 최신 작업 — 미국 은퇴·보관

2026-10-27 · E36 확인/취소·확정/E37,45세 은퇴·마이너 포함 공개 기록 보관을 연결했다. 집중4/4, 기존 연도7건 통과. 전체 npm run check 종료0: 총699개 중697통과·실패0·Neon환경 부재2건 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms496580.9465, 동결410파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. M2 전체 완료 선언 아님. [상세](M2-DL-US-RETIREMENT-ARCHIVE.md). DK21fb82e는 main/작업 브랜치 모두 푸시·원격 일치. 종료 지시 철회.

# M2-DK 최신 작업 — 미국 마이너 연도 이월·학습 일정·공급

2026-10-26 · 원래 마이너6시즌 실제 다음 해 개막/루트3·기존 저장 보존, 승격 우선 Rookie 공급, 구종 공식 일정 분기, 부상 대체 콜업 보호, MLB100등록/6시즌 서비스를 연결했다. 집중 구종7/7·공급/승강11/11·서비스2/2·연도7/7. 통제6시즌과 실제 새해75경기/PS46경기는 별도 증거. 2026-10-27 사용량97%사용/3%남음 확인으로 사용자5%중단 기준에 따라 보존. DK 전체 첫 검사는695개 중692통과·1실패·Neon환경2건 건너뜀. 레거시 잘못된 저장 입력의 오류 코드/누락 주인공 검증을 수정했고 해당 회귀1/1·lint·typecheck는 종료0. 수정 후 전체 npm run check 재실행은 미완료이며 DK를 전체 검증 완료로 표시하지 않는다. 위 내용은946bd4e 보존 시점 기록이며 이후 최종 재검증이 통과했다. 전체 npm run check 종료0: 총695개 중693통과·실패0·Neon환경 부재2개 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms562628.2466, 동결406파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. M2 전체 미완료. [DK 상세](M2-DK-US-YEARS-LEARNING-SUPPLY.md). 직전 DJ10dbf94 main/작업 브랜치 푸시 완료.

# M2-DJ 최신 완료 — 구종 이월·실제 MLB 포스트시즌

2026-10-26 · 사용자 확정 숙련0 구종의 기존 XP 보존/다음 PRE 재학습, AL/NL 부분 순위·12팀 브래킷·실제 PS 경기/건강/XP/특성·봉인 기록·JSON 재개를 연결했다. 집중23/23 및8/8. 전체 npm run check 종료0: 엔진/API676·웹20 통과, 실패0·Neon2환경 부재 건너뜀. lint/타입/build/골든/이벤트/설계10종/Android·자산 검사·HTTP 스모크 통과. duration_ms1008130.2884. 실제PS46경기 우승US25/급여30000유지. 직전 DI230897f는 main/작업 브랜치 모두 푸시·원격 해시 일치. [DJ 상세](M2-DJ-RELEARNING-AND-MLB-POSTSEASON.md).

# M2-DI 최신 완료 — 구종 학습 실제 연결

2026-10-26 · 기존 M2 체크아웃에 직접 구현. 학교·KBO·상무·미국 학습 분기, 불변 건강 영수증 복제 개선, 미국 다일 검토 참조를 연결했다. 집중27/27과 추가8/8(중복 합산하지 않음), native 구/신 대조35청크 완전 일치. 미국 native 현재3857경기/마감80일로 안전 저장. 전체 npm run check 종료0: 엔진/API671통과·Neon2환경 부재 건너뜀·실패0, 웹20/20. lint/타입/build/골든/이벤트/설계10종/Android·자산 검사 및 HTTP 스모크 통과. duration_ms1381930.2751. 후속 DJ는 사용자 확정 숙련0 XP 이월/재학습 처리. 초기 테스트 RNG 태그 타입오류는 수정했고 superseded 로그로 구분한다. M2 완료 아님. [상세](M2-DI-PITCH-LEARNING.md) · [전체 완료 범위](M2-COMPLETION-PLAN.md).

# 구현 진행·다른 환경 이어가기

## 최신 검증 완료 — M2-DH (2026-10-26)

미국 준비/일정/실제 경기/공통 급여/부상 대체/승강/옵션/성장과 특성 성능 개선을 묶어 구현했다. 전체 check 엔진/API663·웹20 통과·실패0·Neon2환경 미설정 건너뜀. 테스트748933ms. [DH 상세](M2-DH-US-FIRST-SEASON.md). 원본332개를 고정해 검사했다. user 요청대로 전체검사는 묶음당1회; 타입 검사에서 발견한2개 테스트의 readonly 대입은 수정 후 정식 결과를 다시 검증했고 superseded 로그로 보존했다.

미국 native 실주행은 별도이며 최신 저장 58일·2400경기·AA다. V:/.local-verification/M2-DH-US-native/latest.json과코드zip을 사용한다. 첫 복무 DD는 기존부분상태 그대로이며완료로 표시하지 않는다. 다음 DI 초안은 C:/Users/N-052/AppData/Local/Temp/baseball-M2-DI-us-lifecycle에 격리했다. 구종 학습분기 실제 연결, 다일 청크 메타데이터 수정, 미국 연도 전환/FA/은퇴 등을 이어간다. 현재 M2 전체 완료 아님. main은 병렬 6eda98e까지 달라져 자동 덮어쓰지 않고 M2 브랜치를 보존한다.


M2-DG는 codex/m2-career-engine 브랜치로 이어간다. 병렬 M4가 main a63d3e7에 올라와 main은 덮어쓰지 않았다. M2 전체637개는 이 브랜치 원본의 증거이며 M3/M4 병합 후 재검증은 별도다.

## 2026-10-26 M2-DG 완료

M2-DG 미국 계약 후 아마추어 정산/다음 시즌 실제 등록을 정식 반영했다. 신규 집중5/5·정식 전체637/637·실패0·취소0·종료0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1905122.3771. 직전 DF337911e·632/632도 보존한다. M2 전체 완료가 아니다. [DG 상세](M2-DG-US-CAREER-ENTRY.md).

작업/Git/빌드는 C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-m2 (codex/m2-career-engine)에서 진행한다. 원래 baseball-career-repo 체크아웃에는 다른 창의 웹 화면 변경이 있어 그대로 보존했다. 그 작업을 덮어쓰거나 함께 stage하지 않는다. V:는 M2 변경 파일만 보호 동기화하고 V:/.git을 생성하지 않는다. 이전 문서의 원래 체크아웃 경로는 이력이다. [분담/연동](M2-M3-INTEGRATION-NOTES.md).

## M4 웹 UI 핵심 화면 — 시작 (2026-10-26)

M2/M3와 겹치지 않는 `apps/web`: 뼈대+S01 홈·S02 생성·S03 커리어, `PlayballApi`+fixture, 웹 테스트 11개(`test:web`, check 포함). 실제 API 연동·나머지 9화면은 다음. [M4](https://github.com/bossxor/baseball_Career/blob/a63d3e71d2e1c75cccf87d9d2fccb530c3c23ae2/docs/implementation/M4-WEB-UI.md).


## 병렬 환경 작업 기록


ready/version/자산 OFL·STATUS M9 100%(기여2). 실 DNS/배포=후속. [COMPLETE](M9-COMPLETE.md).
## M9 운영 셸 (2026-10-26)

`/api/ready`·`/api/version` · `verify:assets`/provenance · STATUS 70%. 실 DNS·배포는 후속. [M9](M9-OPS.md).
## M8 마일스톤 마감 (2026-10-26)

Capacitor debug 셸·`kr.againplayball.app`·HTTPS API 게이트·STATUS M8 100%(기여2). 실기기/release=후속. [COMPLETE](M8-COMPLETE.md).
## M8 Capacitor Android 셸 (2026-10-26)

`kr.againplayball.app` · debug APK · `VITE_API_BASE` https 비로컬 강제. JDK21. 실기기/release는 후속. [M8](M8-ANDROID.md).
## M7 마일스톤 마감 (2026-10-26)

백업·복원·연대기JSON 셸·STATUS M7 100%(기여4). PNG/중계/APK공유는 후속. [COMPLETE](M7-COMPLETE.md).
## M7 연대기 JSON export (2026-10-26)

`POST /exports/chronicle` → CHRONICLE_JSON private file, 24h TTL, 비밀값 제외, 게임백업 아님 표시. [M7](M7-FILES.md).
## M7 복원 preview·activate (2026-10-26)

`/restores/preview`·`/restores` 새 saveId, 원본 백업무변경, hash 불일치 거부. [M7](M7-FILES.md).
## M7 private 파일·백업 V04 슬라이스 (2026-10-26)

`private_files` + backups API + owner 403/hash 다운로드. 복원·PNG·연대기·중계는 후속. [M7](M7-FILES.md).
## M5 마일스톤 마감 (2026-10-26)

33화면 셸·STATUS M5 100%(기여5). 픽셀·SR 실기·엔진/구단 연동은 후속. [COMPLETE](M5-COMPLETE.md).
## M5 나머지 화면 셸 (2026-10-26)

S10–S21·S24–S27·S29–S45 Decision 스텁 + 라우트·fixture/API ui-shell 동기. 홈 설정→S21, S28 college→S34. 엔진/M6/픽셀·SR 제외. [M5](M5-WEB-UI.md).

## M6-M 국제대회 상대 명단 (2026-10-27)

강 65, 중 55, 약 45. 28명 명단. 경기는 없음. 구단 90% 유지. [M6-M](M6-M-CLUB-OPPONENTS.md).

## M6 기능 마감 (2026-10-27)

A~L을 구단 90%로 닫는다. 국제 경기와 12개 실주행은 통과가 아니다. [마감](M6-CLOSE.md).

## M6-L 국가대표 선발 (2026-10-26)

28명 선발. 상대 국가 경기는 없다. 완료율 유지. [M6-L](M6-L-CLUB-NATIONAL.md).

## M6-K 구단 상무 복귀 (2026-10-26)

두 블록이 끝난 선수는 원소속 2군으로 돌아온다. [M6-K](M6-K-CLUB-SANGMU-RETURN.md).

## M6-J 구단 상무 입대 (2026-10-26)

한 시즌 한 번, 기존 선발을 유닛으로 옮기고 1군을 다시 채운다. [M6-J](M6-J-CLUB-SANGMU.md).

## M6-I 전략 라벨·상무 관찰·국제 창 (2026-10-26)

68 전략은 읽기 라벨. 상무는 기존 선발을 보기만 하고, 국제는 달력 창만 보여 준다. [M6-I](M6-I-CLUB-LABELS.md).

## M6-H 장기 시뮬레이션 체크포인트 (2026-10-26)

73 L01~L12는 계획. L04만 저장·재개하고 경기 0을 균형 통과로 세지 않는다. [M6-H](M6-H-CLUB-LONG-RUN.md).

## M6-G 제안·재계약·불펜·다음 시즌 명령 (2026-10-26)

시즌 검토의 제안/재계약/방출, 불펜 자동, 다음 시즌을 세이브 명령으로 저장한다. [M6-G](M6-G-CLUB-DECISIONS.md).

## M6-F 구단 저장/API/화면 셸 (2026-10-26)

구단 생성·시즌 시작·라인업·1군·1일 진행을 세이브 명령으로 저장하고 S13–S19를 읽는다. [M6-F](M6-F-CLUB-SHELL.md).

## M6-E 재정 재건·재계약/방출·불펜·승강 뉴스 (2026-10-26)

08 재정 재건 보조금, 내 구단 재계약/방출/트레이드, 불펜 CP/SU/MR/LR, 콜업 추천과 타 구단 뉴스. [M6-E](M6-E-CLUB-OPS.md).

## M4 마일스톤 마감 (2026-10-26)

## M6-D 구단 모드 한 해 닫기 (2026-10-26)

포스트시즌·연말 마감·다음 시즌 전환·1군 편성·FA 제안 계획(묶음 구현 후 한 번에 검증). 관찰: 5회 오프시즌 뒤 급여가 예산 상한 근처. [M6-D](M6-D-CLUB-YEAR.md).

## M6-C 손으로 만든 라인업 적용 (2026-10-26)

`lineupOverrides`(엔진 추가)·`applyKboClubLineup`/`clearKboClubLineup`·경기 전 검증 `LINEUP_INVALID` 정지. [M6-C](M6-C-CLUB-LINEUP.md).

## M6-B 내 선수 사용(보관 투입) — 구현 (2026-10-26)

보관 스냅샷→19세 복사본(최고값 절반·새 잠재력)·대체 후보·FA 풀 이동·합법 1군 검사. [M6-B](M6-B-CLUB-IMPORT.md).

## M6-A 독립 구단 새 게임 뿌리·시즌 진행 — 시작 (2026-10-26)

`createKboClubGame`·S13/S14 읽기·S15 라인업 검사·`advanceKboClubGame`(전 리그 날짜 진행, 내 구단 건강 정지). 별도 작업 폴더/브랜치 `m6/club-mode`. [M6-A](M6-A-CLUB-GAME.md).

IME 조합 게이트·V08 정적(터치/포커스/16px/reduced-motion)·STATUS M4 100%. 픽셀·SR 실기·풀 엔진은 후속. [COMPLETE](M4-COMPLETE.md).
## M3/M4 마감 (2026-10-26)

M3 V02/V03 완료·메일 실발송 M9 보류. M4 핵심12+HTTP+로그인/충돌. CI typecheck에 engine build 추가. [M3](M3-COMPLETE.md) · [M4](M4-COMPLETE.md).
# 구현 진행·다른 환경 이어가기

## 병렬 완료 — M3 계정·DB·명령 파이프라인 (2026-10-26)

브랜치 `m3/save-command-pipeline`을 main에 병합. Neon `m3-dev` + Managed Better Auth JWT·allowlist·owner 격리·행 잠금/receipt/F08·셸 game-creations/saves. api 테스트7/7. 메일 재설정 실발송·전 커리어 명령 매핑은 미완(의도). [완료](M3-COMPLETE.md) · [증거](evidence/M3-COMPLETE-check.log).

## M4-B HTTP PlayballApi + API UI 셸 (2026-10-26)

`createHttpApi` · `UI_SEED/ADVANCE/CHOOSE` · career/screen GET. 웹14·API m4-ui-shell 통과. 풀 커리어 엔진 연결은 후속. [M4](M4-WEB-UI.md).
## M4 웹 UI 핵심 12화면 (2026-10-26)

S01–S03에 이어 S04–S09·S22·S23·S28을 공통 `Decision` + `#/play/:id/Sxx`로 추가. fixture `decision`/`choose` 멱등. 웹 테스트13. 실 HTTP API·접근성 실기는 다음. [M4](M4-WEB-UI.md).
## M4 웹 UI 핵심 화면 — 시작 (2026-10-26, 이전)

M2/M3와 겹치지 않는 `apps/web`: 뼈대+S01 홈·S02 생성·S03 커리어, `PlayballApi`+fixture, 웹 테스트 11개. 실제 API 연동·나머지 9화면은 다음. [M4](M4-WEB-UI.md).

## 2026-10-26 M2-DF 완료

STATUS를 먼저 갱신한 뒤 원구단 예산 부족의 다음 해 권리 해제/타 구단1년 비교를 사용자 선택대로 연결했다. 신규7개·집중12/12·전체632/632·실패0·취소0·종료0, lint/타입/build/골든/이벤트/설계10종 통과, duration_ms2330706.9176. 별도 JSON 비교/수락/Y02 재개 결과도 동일했다. [DF 범위/호환](M2-DF-OFFSEASON-EXIT.md). 기존 DE625/625는 이전 코드의 증거다. 실제 V:의 원격 변경79개를 보호 최신화했고 옛 DD 상태는 복구하지 못했으며 새 고정 DC 원본 저장/재개 실행기로2030 day60·마감30일·60정규 경기까지 진행했다. 아직18개월 완료가 아니다. [DD 보관/재개](evidence/M2-DD-full-service-checkpoint-notes.md) · [M2 전체 계획](M2-COMPLETION-PLAN.md).

## 최신 완료 — M2-DE AI 영입 공동 등록 E96

2026-10-25 · 최종 전체 npm run check625/625·실패0·취소0, lint·타입·build·엔진 골든·이벤트·설계10종·HTTP 골격 smoke 통과. 테스트 duration_ms400562.5889·종료0. 신규 집중6/6에서 실제 Y02 AI FA 수락·재계약, 양 관계 종류, 공식 공동 등록·벤치 부상·JSON/control 불변·변조 거부·소속/계약 변경 후 조회/ACK·중복/구 저장을 검증했다.

실제 수락/갱신 영수증과 현재 계약이 일치하는 선수만 같은 KBO/FUTURES 정규 경기 건강 명단으로 재회한다. AI 영수증·계약 키·공식 경기·정렬 등록 신원을 봉인하며 과거 읽기는 현재 계약/소속에서 추정하지 않는다. 기존 군팀·이적·군 복귀 E96, 관계 종류와 이력, 게임/RNG/돈/성장을 보존한다. [DE 상세](M2-DE-AI-TEAM-REUNIONS.md) · [전체](evidence/M2-DE-check.log) · [동결](evidence/M2-DE-source-freeze.json). 이전 DC3064193도619/619·원격 해시 일치를 확인했다.

DD 실제18개월 검증은 고정 DC3064193 worktree에서 별도 진행한다. 아직 완료 통과가 아니다. 첫 부분 실행은2030 day110·80마감일·380정규 경기까지 진행한 뒤 중단했다. 전체 native JSON 상태/원본 증거/단계/호출 수를 Git 밖에 원자적으로 저장하는 검증기를 추가했고 실제3일 저장→5일 재개를 확인했다. 최신 상태·정확한 경로/재개 명령/제한은 [DD 체크포인트](evidence/M2-DD-full-service-checkpoint-notes.md)를 따른다. 검증기와 엔진 스냅샷·의존성을 임의로 바꿔 재개하지 않는다.

일반 연말 예산 부족 시 원구단 보유권 처리 질문은 답변 대기다: 다음해 권리 해제 후 타구단1년 비교(추천) 또는 권리 유지·무계약 준비/재협상. 임의로 전면 FA를 허용하지 않았다. 최신 사용자 경계는 단기 잔여5%이며 여유를 남겨 인계·커밋·푸시한다. UI/DB/APK·장기 균형과 실제18개월 완료는 미검증, 전체 가중35%/65% 유지. 실제 마지막 커밋/원격은 git log -1·ls-remote로 확인한다.

## 최신 완료 — M2-DC 원구단 복귀 공동 등록 E96

2026-10-25 · 전체 npm run check619/619·실패0·취소0, lint·타입·build·엔진 골든·이벤트·설계10종·HTTP 골격 smoke 통과. 테스트 duration_ms412025.3614, 종료0. 집중6/6에서 실제 두 복무 블록·원구단 경기/등록·JSON 재개·벤치 부상·60명 대기·변조 거부·과거 조회/ACK·당일 만료 후 분리/재처리를 확인했다. 첫 중단 검사는 superseded 이력이며 최종 통과가 아니다.

복귀 날짜·프로그램·공식 경기·정렬 건강 명단을 봉인해 복귀일 이후 같은 원구단/리그의 실제 공동 등록만 E96으로 연결한다. 기존 관계 종류·이력·게임/RNG/급여/성장을 보존하며 NPC 급여 만료 전에 재회를 기록한다. 과거 조회는 현재 소속/계약에서 추정하지 않는다. 군팀/이적 E96과 구 저장은 유지한다. [DC 상세](M2-DC-RETURN-REUNION-NOTES.md) · [전체](evidence/M2-DC-check.log) · [동결](evidence/M2-DC-source-freeze.json).

재개 시점 단기 사용4%/잔여96% 리셋을 확인했다. 최신 사용자 경계는 잔여5%이며 검증·인계·커밋/푸시 여유를 남긴다. 다음은 고정 DC 코드의 실제18개월 복무 검증(M2-DD)과 실제 AI 영입 후 공동 등록 E96 누락(M2-DE, 수정 전1/1 재현)이다. 일반 연말 계약 부족 시 보유권 처리 질문은 사용자 답변 대기이며 그 경로를 임의 FA로 구현하지 않는다. UI/DB/APK·장기 균형은 미완료, 전체 가중35%/65% 유지. 원격/마지막 해시는 git log -1과 ls-remote로 확인한다.

## 최신 완료 — M2-DA/DB NPC 병역 복귀·급여·성장

원격837ce74까지 최신화 후 사용자 확정 정책을 적용했다: 기존 급여 보장·신규 영입 제한·실제 지급 연도 부족분만 재정재건 지원. 신규 실제 입대v6·원금/과거 영수증 보존·6월30일 복귀/60명 대기·등록일 급여·AI 잔여 계약/FA·군팀/복귀/FA 연간 성장·노쇠1회·미래6년 채무를 연결했다. E09/AI 이동/만료·이적 공석의 급여 예약도 등록 변경 전에 합산한다.

최종 전체 npm run check **613/613·실패0·취소0**(신규22개 포함), lint·타입·build·엔진 골든·이벤트·설계10종 통과. 테스트 duration_ms405753.5182, 종료0. HTTP 골격 smoke도 통과했다. [상세/호환/한계](M2-DA-DB-NPC-MILITARY.md) · [전체 로그](evidence/M2-DA-DB-check.log). 군팀/원구단 실제 경기와 통제된 미진행 시계의 통합 검사이며18개월 전체/장기 균형 검증은 아니다. 전체 앱 가중 추정35% 완료·65% 남음 유지: 실제 UI/계정/Neon 저장은 아직 없다.

다음 작은 후보는 [NPC 원구단 복귀 후 실제 공동 등록 E96](M2-DC-RETURN-REUNION-NOTES.md)이다. 현재 군팀 공동 등록·주인공 이적 E96과 별도다. c0b4a90에서 실제6월30일 복귀 뒤 같은 FUTURES:OB 건강 등록/급여에도 SEPARATED·E96=0인 누락을 단일 검사1/1로 재현했다. 수정 전 증거이며 활성 코드는 그대로다. 내 선수의 다음해 예산도 부족할 때 오프시즌 무소속/타구단 출구, ATHLETE/해외 병역·미국 실제 리그·UI/DB/APK도 남아 있다.

환경: E:/AI/Game/baseball_career, main. 옛 V: 미러/PC 종료·이전 사용량 기록은 이 세션의 현재 상태가 아니다. 이전 요청은 잔여30% 경계였으며 최신 재개 요청/상태는 위 블록을 따른다. 검증 소스 동결·문서 후속 검증 증거와 Git 원격 확인은 evidence/M2-DA-DB-*를 따른다. 기능 c0b4a90은 origin/main 해시 일치·clean을 확인했다. 후속 문서/재현 증거 커밋의 마지막 해시는 git log -1로 확인한다. 보관 패치는 승인 전 이력이며 활성 소스에 재적용하지 않는다.

## 2026-10-23 M2-CZ 완료

816ff2e·원격/로컬 clean·V:1374개 일치 후 재개. 사용량 구간 리셋(잔여100%) 확인, 이번 경계는 잔여5% 정리/푸시 뒤 PC 종료다. 실제 상무 공동 등록 E96·등록 증거/과거 조회/ACK를 연결했고 집중38/38·타입 통과. 전체 check591/591·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과, duration_ms1062499.9007. [CZ](M2-CZ-SANGMU-TEAM-REUNION.md).

## 2026-10-23 사용량5% 경계 최종 정리

2026-10-23 06:50 UTC 실제 단기 잔여5%·주간 잔여70%를 확인하고 신규 구현을 동결했다. 최신 활성 소스는 CY585/585·실패0·취소0, 기능 커밋8ca630f까지 푸시/원격/V: 일치를 확인했다. 후속은 군팀 E96 초안의 정식 반영과 NPC 실제 복귀/급여/성장/미래 채무다. 문서 정리본만 재검증·동기화·커밋/푸시한다. 리셋 크레딧/PC 종료 없음. [인계](NEXT-SESSION.md).

## 2026-10-23 원격/미러 최종 검증

8ca630f까지 origin/main=HEAD·clean·추적1371개 V: 바이트 일치. CW574·CX580·CY585 각각 전체 검사를 통과하고 별도 커밋/푸시했다. 현재 신규 활성 코드 미커밋 없음. 군팀 E96의 초안6개/타입은 저장소 밖이며 정식 구현 결과에 포함하지 않는다. [현재 인계](NEXT-SESSION.md).

## 2026-10-23 M2-CY 완료

실제 상무 입대 때 이전 민간 동료 관계를 분리하고 RIVAL/이력/공지·게임 상태를 보존한다. 집중30/30·전체 check585/585·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1086125.6368. [CY](M2-CY-SANGMU-RELATION-SEPARATION.md). 가중35%/65% 유지.

## 2026-10-23 M2-CX 완료

상무 공석 보충 원장2·보조 선수만의 실제 경기·구 저장1 보존/새 시즌 승격을 구현했다. [상세](M2-CX-SANGMU-VACANCIES.md). 집중22/22·전체 check580/580·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms1106360.2722. 앞선 타입 실패/중단 로그는 이력으로 보존하며 통과로 세지 않는다. 가중35%/65% 유지.

## 2026-10-23 M2-CW 완료

직전 CU/CV c2706c6 푸시·원격/로컬 clean·V: 추적1320개 일치 후 CW를 진행했다. 새 미지급 정규/병역 성장에 개막 unavailable을 재사용하고 opening-health-v1을 기록한다. 옛 지급/증거 없는 구 저장은 기존 계산을 보존한다. 집중25/25·전체 npm run check574/574·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. 테스트 duration_ms1081868.4695. 완료 문서/설계 재검증·검증 소스 불변 증거와 함께 V: 동기화·커밋/푸시한다. [CW](M2-CW-OPENING-REHABILITATION.md) · [집중](evidence/M2-CW-focused-final.log). 전체 추정35%/65% 유지.

## 최신 상태 — M2-CU/CV 완료 (2026-10-23)

재개 기반 a5bc5ba 및 V: 추적1290개 일치 확인 후, 상무 건강/비상 편성과 정규 성장 종료 경계를 공동 구현·검증했다. 승인 종합35~45 최소 보충·회복 제외·군팀 신원/구종/기록 보존·실제 건강 등록·S42/E95·새 시즌 루트v5·진행 중 구 저장 보존·미래 입대 예약 조회를 연결했다. 포스트시즌 진단 때문에 정규 성장 정산이 막히는 실제 경로도 수정했다.

최종 집중39/39(CU 신규8·CV 신규6·기존25), 전체 npm run check566/566·실패0·취소0. lint/전체 타입/build/소스·컴파일 골든/이벤트/설계10종 통과. 테스트 duration_ms1145193.7649. 정규는 통제된 시계, 실제 포스트시즌/성장/마감/AI 연도 전환으로 임시10명 보관·활성0·JSON 동일·원본 불변도 확인했다. 첫 중단 검사/실패 로그는 이력이며 통과로 세지 않는다. [CU](M2-CU-SANGMU-HEALTH-EMERGENCY.md) · [CV](M2-CV-POSTSEASON-GROWTH-HEALTH.md) · [전체](evidence/M2-CU-check.log) · [집중](evidence/M2-CV-focused-final.log) · [이월](evidence/M2-CU-year-carry.log).

전체 가중 추정35% 완료·65% 남음 유지. NPC 반년 복귀/급여/성장·실제 UI/계정/Neon/APK는 미완료다. 다음은 기존 개막 부상 증거를 쓰는 미지급 성장 기간 보정이며, 옛 지급 기간은 보존한다. 저장소 밖 초안6개 통과를 이번 정식 결과에 섞지 않는다. 검증 파일을 V:에 동기화하고 같은 커밋으로 저장한다. 실제 최신 커밋은 git log -1을 따른다. [인계](NEXT-SESSION.md).

---

## 2026-10-23 사용량 경계 최종 정리

실제 상대 출장 E95와 시즌 중 실제 이적의 공동 등록 E96을 완료했다. 집중31/31·전체552/552·실패0·취소0, lint/타입/build/골든/이벤트/설계10종·문서 재검증·MANIFEST359·HTTP 기본 smoke 통과. 기능커밋 c4c4f9eb820a867211989f4f92705441702deae5는 main에 푸시했고, 원격=로컬·작업트리 clean·추적1289개 V: 바이트 일치를 확인했다.

사용량 조회 2026-10-23 01:18:56 UTC에서 단기 잔여5%·주간 잔여85%를 관측했다. 사용자 지시의5% 이하 기준에 도달해 신규 구현을 동결하고 이 인계를 저장한다. 리셋 크레딧은 사용하지 않았고 이번 실행에 PC 종료 요청은 없다.

상무 군팀 전용 임시선수 최소 보충은 사용자 결정만14/21과 병역 점검표에 반영했으며 실제 구현/검증은 남아 있다. 군팀 건강·등록·기록 신원 보존과 기존 planEmergencyRoster 재사용, 복무 중 NPC 관계 이름 조회 재현을 다음 작업자가 먼저 검토한다. 실제 UI/계정/Neon 저장·미국 리그 및 AI/군팀 E96도 남아 있다. 미검증 활성 코드나 런타임 변경을 이번 통과에 섞지 않았다. [현재 인계](NEXT-SESSION.md). 마지막 문서 커밋도 푸시하고 원격/로컬/V: 일치를 다시 확인한다.

## 최신 상태 — M2-CT 완료 (2026-10-23)

M2-CT 완료(2026-10-23): 실제 시즌 중 주인공 이적의 같은 팀 재회 E96·등록 증거 보존·E94/E95/E96 비차단 읽기 연결. 이전 RIVAL 종류/관계/맞대결·성장·돈은 보존한다. 부상 등록 포함·대여/현역 제외, 이전 v4 저장 조회 소급 없음. 집중6/6·전체 npm run check552/552·실패0·취소0, lint/타입/build/소스·컴파일 골든/이벤트/설계10종 통과. duration_ms 1804555.025. [상세](M2-CT-KBO-TEAM-REUNION.md). 전체35% 완료·65% 남음 유지: 기존 M2 관계 하위 경로 보강이며 실제 UI/계정/DB·미국/국제대회·NPC 병역이 큰 미완료 범위다.

원본/Git/빌드: C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo. 검증 파일을 V:에 동기화하고 커밋/push한다. V:/.git 생성 없음. 이번 사용량 경계는 잔여5%, PC 종료 요청 없음. 다음은 AI 영입으로 같은 팀이 된 관계의 실제 등록 근거/E96 또는 NPC 군팀 복귀·급여·성장·후반 편성이다. 상무 E95는 상대 등록 원장이 없어 미연결이며 실제 UI/계정/DB 저장도 후속이다.

## 최신 상태 — M2-CS 완료 (2026-10-23)

M2-CS 완료(2026-10-23): 실제 KBO/퓨처스 정규·포스트시즌 양쪽 상대 출장과 경기 당시 등록 근거로 E95/REUNITED_OPPONENT를 기록한다. 벤치/같은 팀/과거 조회 제외, E94/E95 읽기는 메타데이터만 변경한다. 집중7/7·E96 공동 전체 npm run check552/552·실패0·취소0, lint/타입/build/소스·컴파일 골든/이벤트/설계10종 통과. duration_ms 1804555.025. [상세](M2-CS-KBO-OPPONENT-REUNION.md). 전체35% 완료·65% 남음 유지: 기존 M2 관계 하위 경로 보강이며 실제 UI/계정/DB·미국/국제대회·NPC 병역이 큰 미완료 범위다.

원본/Git/빌드: C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo. 검증된 파일은 V:에 동기화하고 커밋/push한다. V:/.git 생성 없음. 이번 사용량 종료 기준은 잔여5%이며 PC 종료 요청은 없다. 공동 검증으로 시즌 중 이적의 E96도 마무리하며 최신 후속은 위 CT 항목을 따른다. 상무 E95는 상대 등록 원장이 없어 미연결이다.

## 최신 구현 — M2-CR (2026-10-23)

M2-CR 완료(2026-10-23): 실제 타구단 이적의 원구단 등록 동료/라이벌을 분리하고 모든 이전 이력·새 동료/E94를 보존했다. 부상 등록 포함·대여/현역 제외·원구단 재수락/실패/조회 불변, CQ 형태 기존 저장의 소급 변경0. 관계/실제 이적/원구단 재계약 집중13/13, 최종 전체 npm run check539/539·실패0·취소0, lint/타입/build/소스·컴파일 골든/이벤트/설계10종 통과. duration_ms 1419750.6262. [상세](M2-CR-KBO-TRANSFER-RELATIONS.md). 전체35% 완료·65% 남음 유지: 기존 M2 이적 하위 경로 보강이며 UI/계정/DB·미국/국제대회·NPC 병역이 큰 미완료 범위다.

## 사용량 경계 최종 정리 — 2026-10-23

사용자 요청대로 Git을 최신 main 7d713c5까지 받은 뒤 구현을 재개했다. 사용량 재조회에서 단기 사용71%/잔여29%·주간 잔여74%를 관측해 신규 구현을 동결했다. 정확히30%를 관측했다고 기록하지 않는다. 리셋 크레딧은 사용하지 않았다.

**완료·원격 반영:** M2-CQ `fb96d5c` — 실제 시즌 중 타 구단 잔여 계약 수락, 원구단 과거 지급 귀속·새 구단 등록일 지급, 양 구단 편성/권리/등록, 계획 날짜/연간 성장·강화 이력, 군 복귀6경기·다음 시즌 v4 보존. 전체 check535/535·실패0·취소0(379.54초), lint/타입/build/compiled 골든·고교 해시6개/이벤트/설계10종·HTTP smoke 통과. 설계359개 working/staged 바이트·SHA256 일치. [CQ 상세](M2-CQ-KBO-REMAINDER-TRANSFER.md) · [전체 검사](evidence/M2-CQ-check-final.log) · [HTTP smoke](evidence/M2-CQ-smoke.log).

**미완료 보존:** M2-CR 관계 분리 후속은 초안 helper/테스트 생성 중 한도에 도달했다. 활성 source/test를 검증된 CQ로 복원했고 git diff로 동일함을 확인했다. [미검증 초안/복구 방법](drafts/M2-CR-UNVERIFIED/README.md)과 [다음 관계 작업](M2-CR-KBO-TRANSFER-RELATIONS.md)을 남겼다. 초안은 타입/lint/실행 미검증이며 CQ535개 통과 결과를 적용하지 않는다. 현재 CQ 이적의 기존 원구단 관계 stage 전이는 아직 없다. 새 동료/E94와 과거 관계 이력 보존만 구현돼 있다.

**재개 우선순위:** 작은 CR 관계 분리부터 집중/전체 검증으로 완료하거나, [NPC 병역 연결 점검표](M2-NEXT-MILITARY-INTEGRATION-NOTES.md)의 급여/성장/후반 군팀 편성을 한 원자 범위로 구현한다. NPC 반년 복귀는 날짜 한 줄 수정으로 완성되지 않는다. 실제 E95/E96·미국 리그·나머지 사건, UI/계정/Neon/DB/APK는 남아 있다. STATUS35% 완료·65% 남음 유지.

현재 Git/빌드 원본은 E:/AI/Game/baseball_career, main, Node24.20.0/npm11.19.0이다. V:는 이 머신에 없어 동기화하지 않았다. 새 환경은 git status/remote/HEAD를 확인하고 사용자 변경을 보존한 뒤 git pull --ff-only 한다. .git 재초기화·의존성 추가/업그레이드는 하지 않았다. 아래 이전 실행의 PC 종료/5% 지시는 이번 실행의 동작이 아니다. 이번에는 추가 PC 종료 요청이 없어 실행하지 않는다.

최종 인계 문서도 별도 커밋·push하고 실제 원격 main=로컬 HEAD·작업 트리 clean을 확인한다. 최종 문서 커밋 해시는 git log -1을 따른다.


## 현재 구현 재개 — 2026-10-23

최신 사용자 지시: Git 최신화 후 사용량 잔여30%까지 자율 구현한다. 이전 종료/5% 기준은 이전 실행의 이력이며 이번 실행은 현재 지시를 우선한다. 리셋 크레딧은 사용하지 않는다. 검증된 단계마다 진행/증거/STATUS를 갱신하고 커밋·push한다.

현재 체크아웃은 `E:/AI/Game/baseball_career`, main이며 `7d713c5`까지 fast-forward했다. Node24.20.0/npm11.19.0. V: 드라이브는 이 머신에 없어 다른 머신의 V: 동기화 절차를 실행하지 않는다. Git/빌드/검증·원격 저장은 이 체크아웃에서 수행한다. .git 재초기화/의존성 변경은 없다.

M2-CQ 완료: 실제 타 구단 잔여 계약 수락·원구단 과거 지급 귀속·대상 양 구단 편성/권리/등록·성장/강화 경계·새 동료/E94를 연결했다. [M2-CQ 상세](M2-CQ-KBO-REMAINDER-TRANSFER.md). 기존/신규 집중35/35 후 군 복귀 통합3/3·투수 실제 이적1/1·테스트 타입/lint 통과. legacy SPORTS가 이적 성공 뒤 진행 불가가 되는 결함을 재현하고 게시 전 원자 거절로 보강했다. 기존 원구단 수락/옛 성장 정책은 유지한다. 최초 전체 검사는 보강을 반영하기 위해 중단했고 최종 전체 check535/535·실패0·취소0(379.54초)·lint/타입/build/골든/이벤트/설계10종·HTTP smoke 종료코드0를 확인했다. [전체 검사](evidence/M2-CQ-check-final.log) · [HTTP smoke](evidence/M2-CQ-smoke.log). STATUS 전체35% 완료·65% 남음을 유지한다: 계약 하위 경로 하나가 완성됐으며 UI/계정/DB·미국/국제와 NPC 군팀 연결의 큰 범위가 남아 있다. 아래 M2-CP 종료/PC 종료 지시는 이전 실행 기록이다.


## 사용량 경계 최종 정리 — 2026-10-22

최신 기능 커밋 aea1c9275596232c035f62c86c56f02a8ba5006c (M2-CP)는 origin/main push·V: 동기화 완료. 전체 check518/518·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. STATUS 전체35% 완료·65% 남음.

사용량 조회 2026-10-22 12:43:22 UTC: 단기 남음3%·주간 남음7%, 낮은 잔여량이5% 이하임을 실제 관측했다. 새 구현을 중단하고 이 인계를 저장한다. 리셋 크레딧은 사용하지 않았다. 사용자 명시 지시대로 마지막 문서 커밋/push·원격 HEAD·체크아웃/V: 일치와 작업트리 청결을 확인한 뒤 컴퓨터 종료를 요청할 예정이다. 이 문서는 실제 전원 차단을 관측한 기록이 아니다.

다음은 실제 타구단 수락/이적: 원구단 과거 지급 귀속·새 구단 잔여 지급·편성/권리·등록 이력/성장/강화 구간을 원자 처리한다. [구현 점검표](M2-NEXT-REMAINDER-TRANSFER-NOTES.md). 비교·원구단 재수락은 완료됐으나 타구단 실제 계약/이적은 미구현이다. NPC상무·미국 실제 리그·나머지 사건·계정/Neon 저장·웹/APK도 남아 있다.

계속 작업은 NEXT-SESSION 최신 상태와 PROGRESS, M2-CP 상세를 읽고 origin/main 및 V:를 먼저 비교한다. 기존 체크아웃에서 구현/빌드/Git을 하고 검증한 파일만 V:에 동기화한다. V:/.git 생성 금지. 마일스톤마다 전체 check·STATUS 최상단 평가·MD/증거·커밋/push를 반복한다.

## 최신 구현 — M2-CP

M2-CP(2026-10-22): 시즌 중 비교 요청·기존 선수 가치 기준 타구단 고정 제안·예산/정원/수요 검사·후보0개 사유·원구단 제안 유지/재수락·경기 보류를 연결했다. 전체 npm run check518/518·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. duration_ms 972333.8608. [상세](M2-CP-REMAINDER-OFFER-COMPARISON.md). 전체35%·남음65% 유지: 계약 비교 하위 흐름이며 실제 타구단 이적/미국/나머지 사건·UI/계정/DB는 미완료다.

## 이전 구현 — M2-CO

M2-CO(2026-10-22): 기록 필드 없는 저장까지28세 기한을 적용하고 E49/E54 계획·25/26세 유예 안내·S26 검토/명시 입대 구분·현역 복귀6개 등록 팀경기0.95를 연결했다. 실제6경기/원본 능력 불변·JSON·변조·유예 차단 검증. KBO 루트v3는 새 계획/연도/현역 전환에서 생성하며 기존v1/v2 읽기는 보존한다. 전체 check514/514·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CO-MILITARY-DEADLINE-AND-RETURN.md). STATUS35% 완료·65% 남음 유지: 병역 하위 흐름을 채웠으나 미구현 미국/국제대회/협상과 실제 UI·계정/DB가 큰 범위여서 M2영역50% 추정을 유지했다.

## 이전 구현 — M2-CN

M2-CN(2026-10-22): 현역 명시 확인·계약 정지·양 리그 등록/출장/구종 경기XP/자연성장0·휴식·E51·6월30일 E53 복귀·등록일 지급을 연결했다. 현역 확정은 KBO 루트v2로 보호하고 학교v1 guard는 유지한다. 최종 전체 check506/506·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CN-ACTIVE-SERVICE-PATH.md). STATUS35% 완료·65% 남음 유지: 군 복무 경로의 핵심 연결이며 전체28세 의무 계획·복귀6경기 효과와 다른 커리어/실제 UI·계정/DB는 아직 남아 있다.

## 이전 구현 — M2-CM

M2-CM(2026-10-22): 상무 등록기간·6월30일 복귀·육성 계획 경계로 자연성장을 분할하고 한 시즌 예산에 누적한다. 강화 창도 실제 등록 팀의 경기 수를 이어서 읽는다. 기존 지급은 보존하며 새 입대/다음 미진행 시즌에서 적용한다. 최종 전체 check501/501·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CM-MILITARY-GROWTH-PERIODS.md). STATUS35% 완료·65% 남음 유지: 작은 M2 기간 정산 연결이며 나머지 커리어/실제 UI·계정·구단 조작은 미완료다.

## 이전 구현 — M2-CL

M2-CL(2026-10-22): 복귀 잔여 계약 소진 뒤 원구단 E30 제안·명시 수락·잔여 시즌 일할 지급·정규 종료 반올림 정산·다음 연도 계약 원장 보존을 연결했다. 전체 check496/496·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CL-REMAINDER-RENEWAL.md). STATUS 최상단35% 완료·65% 남음 유지: 작은 M2 계약 경로로 영역50% 추정을 올리지 않았다. 거절/다른 구단 경로는 사용자 확정·후속 구현이며 ACTIVE/28세·병역 성장·실제 UI/계정/DB/APK는 미완료다.

아래 사용량 경계 최종 인계는 이전 작업 이력이다. 이번 요청으로 계속 구현 중이며 현재 상태는 위 CL을 따른다.

## 사용량 경계 최종 인계 — 2026-10-22

기능 기준 082e5c73e11b8ae595e4f2c1b21c702dd352c0bd(M2-CK)는 origin/main push 및 V: 동기화 완료. 전체 check491/491·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. STATUS 최상단은 전체 구현 추정35% 완료·65% 남음이며, 구현 마일스톤마다 평가/갱신한다.

사용량은 직전 확인6%에서 새 구현을 동결했고 필수 전체 검사/푸시 완료 후 재조회 시 단기 사용98%·잔여2%, 주간 사용78%였다. 정확히5%를 관측했다고 기록하지 않는다. 추가 구현은 중단하고 이 인계만 저장·push한다. 리셋 크레딧 사용/PC 종료는 없다.

사용자 확정: 복귀 잔여 계약이 시즌 중 끝나면 재계약 선택·남은 시즌 일할 계약(1번). 14 U·21에 반영했으며 실제 제안/승인/일할 계약/진행 재개는 아직 미구현이다. 현재 마지막 지급일을 정상 마감하고 다음 경기 전에 CONTRACT_DECISION_REQUIRED로 멈춘다. 다음 작업은 이 계약 경로, 이후 ACTIVE·28세 전체 기한·E49/E51/E54·복무 성장0/휴식·복귀6경기0.95다. SPORTS 성장 기간 분할·NPC6월 복귀·군팀 건강/긴급 편성도 남아 있다.

계속 작업: 기존 Git 체크아웃에서 origin/main과 V:를 비교한 뒤 구현한다. V:/.git을 만들지 않는다. 마일스톤마다 npm run check·MD/증거·STATUS 평가·설계 패키지/해시 재생성·검증·V: 동기화·커밋/push를 수행한다. 실제 플레이 UI·계정/Neon 저장·APK는 아직 없다.

- M2-CK(2026-10-22): 병역 계약 공개 조회와 은퇴 잔여 지급 일수 정합을 보강했고, 마지막 급여일 뒤 다일 작업자가 다음 경기를 게시하기 전에 멈추도록 수정했다. 수정 전1건 실패 재현·새 회귀4/4 통과, 최종 전체 check491/491·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CK-PAYMENT-VIEW-AND-COMPLETION-GUARD.md). STATUS 최상단35% 완료·65% 남음 유지: 작은 M2 계약 경계 보강으로 영역50%를 올리지 않았다. 기존 지급분의 소급 변경은 없고, 사용자는 계약 소진 시 재계약 선택·남은 시즌 일할 계약을 확정했으며 실제 제안/승인/재개 연결은 후속이다.

- M2-CJ(2026-10-22): 새 내 선수 상무 계약의 복무 급여0·복귀 등록일 지급·구단 paid/reserved 원장·잔여 경기일수 이월을 실제 일마감/연도 전환에 연결했다. 집중14/14 후 보강, 최종 전체 check487/487·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CJ-SERVICE-PAYROLL-WIRING.md). 전체35%·남음65% 유지: 작은 M2 계약 슬라이스로 영역50%를 올리지 않았다. 시즌 중 잔여 계약 소진 후 재계약/자동 연장은 사용자 답변 대기이며 추가 지급은 명시 거절한다. 다음: 계약 조회/은퇴 잔여 일수 정합, ACTIVE·28세·병역 성장.

- M2-CI(2026-10-22): 새 내 선수 상무 복무를 둘째 시즌6월30일 일마감 복귀에 연결하고 E52 집중4개 확인·E53 복귀 확인을 추가했다. 전체 check485/485·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CI-SANGMU-JUNE-RETURN-EVENTS.md). 전체 구현 추정35% 완료·65% 남음(STATUS 최상단). 병역의 작은 커리어 슬라이스 추가이므로 M2 영역50% 추정을 유지했다. 다음: 실제 계약 지급/예산·ACTIVE/28세·성장 계수. NPC 반년 복귀는 아직 남아 있다.

- M2-CH(2026-10-22): 시즌+날짜 비교로 다음 해 더 작은 날짜의 복무 완료/지급을 허용하고, 원장v2와v1 명시 전환을 추가했다. 집중12/12 통과·전체 check482/482·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. [상세](M2-CH-MILITARY-YEAR-BOUNDARY.md). 두 번째 시즌6월30일 복무 완료 사용자 결정은 다음 구현에 반영한다.

- M2-CG(2026-10-22): 정지 계약의 복귀 증거/등록일 지급 영수증·중복 방지·최종 잔액 정산 기반, 상무 입대 시 실제 수락 재계약 스냅샷 수정. 전체 check479/479·실패0·취소0·lint/타입/build/골든/이벤트/설계10종 통과. 객체 공유 보강 후 지급5/5도 통과했다. 최초 전체 실행은 검수 보강을 위해 중단했고 최종 전체 검사는 다시 완주했다. [상세](M2-CG-CONTRACT-PAYMENT-RECEIPTS.md). 이번부터 체크아웃에서 작업하고 검증된 파일을 V:로 동기화한다.

## 상무 결정 갱신 — 2026-10-22

사용자가 퓨처스11팀·144경기·홈72/원정72와 매년 야수10·투수10 선발을 확정했다.14 U·21과 [연결 준비 메모](M2-NEXT-MILITARY-INTEGRATION-NOTES.md)에 기록했다. 아래5% 체크포인트의 응답 대기 문구는 답변 전 당시 이력이다. 현재는 응답 대기가 아니며 실제 군팀/병역 구현은 아직 없다. 이번에는 결정 기록과 설계 정적 검증만 수행한다.

- M2-BX(2026-10-22): 신인 AI 지명의 OTHER 야수 묶음 오류를 수정했다. 유격수 공석에서 CP를 먼저 뽑던 실패를 재현했고, 재계약/FA와 같은 주포지션별 필요도 helper를 재사용했다. 관련12/12·실제 다음 시즌/드래프트2/2·타입/lint/build/골든/HTTP 통과. [BX](M2-BX-KBO-ROOKIE-POSITION-NEED.md).

- M2-BW(2026-10-22): 은퇴 보관 신원/6능력 현재·개별 최고값/구종·리그/단계별 기록 조회와 옛 개인 계약의 정확한 잔여연수 메타데이터를 추가했다. 최종 조회/실제 은퇴 집중14/14·타입/lint/build/골든/HTTP 통과. 전체457/457 이후 보완분은 별도 검증이며 전체 묶음 재실행은 하지 않았다. [BW](M2-BW-KBO-RETIREMENT-ARCHIVE-VIEW.md).

- M2-BV(2026-10-22): 실제 KBO 정규 공식 경기+등록 영수증으로100경기 마감 연차와 포스팅7/국내FA8/해외FA9 등록 문턱을 분리했다. 집중6/6·전체457/457에 포함. 실제 개막일 미출전 벤치 등록1경기도 검증했다. 계약/병역/오퍼 자격을 자동 부여하지 않는다. [BV](M2-BV-KBO-SERVICE-TIME.md).

- M2-BU(2026-10-22): FA/은퇴 동료를 현재 로스터에 복원하지 않고 역사 신원으로 읽는다. 개막 전 방출 계약의 구단을 과거 등록으로 꾸미지 않으며 실제 등록 근거가 없으면 소속은 비워 둔다. 최종 관계8건 통과(조회 합계14건에 포함). 기존 PRE 읽기 범위·관계 단계는 유지한다. [BU](M2-BU-KBO-DETACHED-RELATION-READS.md).

- M2-BT(2026-10-22): 실제 다음 시즌에 NPC 은퇴·재계약·FA3회·신인 지명·남은 필수자리만 보충·두 리그 편성·다년 계약 이월을 원자 연결했다. 전체 check457/457·실패0·1158.11초, 실제 전환5/5 및10회 통제 AI 운영 반복 통과. 이후 작은 조회/은퇴 메타데이터 보완은 BW의 최종14/14를 따른다. [BT](M2-BT-KBO-AI-OFFSEASON-ACTIVATION.md).

- M2-BS(2026-10-22): 두 리그 최소 건강편성·필요 인원만 최저계약·정원 부족시 중복 역할 NPC 방출/당해 포함 보장연봉을 추가했다. 복구/재무9/9·타입/lint/build/골든 통과.35명 예시는38명으로 복구하며50명 강제 충원은 없다. 실제 연도 전환 연결은 다음이다. [BS](M2-BS-KBO-DUAL-LEAGUE-REPAIR.md).

- M2-BR(2026-10-22): AI FA3회 시장·동결 제안/예약·동일 선수 단일 계약·확률/재무 검증을 추가했다. 신규4/4·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 최소 편성 보충 U를14에 반영했다. 아직 startNextKboSeason에는 미연결이며 편성 복구 후 원자 활성화가 다음이다. [BR](M2-BR-KBO-AI-FA-MARKET.md).

- M2-BQ(2026-10-22): 다년/내 계약을 보존한 AI 만료 재계약 준비·FA 이동·공개전망 평가/관측과 부상 이월을 추가했다. 집중12/12·기존 전환2/2·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 실제 활성화 writer는 아직 미연결, 두 리그 최소 편성 보충은 사용자 승인 완료, 실제 복구 연결이 다음이다. [BQ](M2-BQ-KBO-AI-RENEWAL-PREPARATION.md).

- M2-BP(2026-10-22): NPC 은퇴 후 보장연봉/옛 은퇴 계약 복원·현재/미래 예산·최소35 보호액·당해 지원 도구를 연결했다. 전체 check431/431(1011.78초)·HTTP 통과, 초기3난이도 세계해시 불변. 다음은 AI 만료 재계약/FA 실제 경합과 최소로스터 복구다. [BP](M2-BP-KBO-GUARANTEED-FINANCE.md).

- M2-BO(2026-10-22): 개인/AI 공통08 계약 가치와40 FA 제안·outside 경쟁분포/고정 RNG 판정을 추가했다. 신규9/9·기존 재계약/전환7/7·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 실제 AI 계약/시장 예약은 다음이다. [BO](M2-BO-KBO-CONTRACT-VALUE-AND-OFFER-ODDS.md).

- M2-BN(2026-10-22): 공용 FA80명 하한·독립선수 부족분 고정 공급·연말 성장/노쇠1회·나이/구종 이월/45세 은퇴를 연결했다. 기존 전환7/7 전후·신규5/5·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. AI 재계약/방출·FA 경합은 다음이다. [BN](M2-BN-KBO-FREE-AGENT-POOL.md).

- 사용량5% 체크포인트(2026-10-21 16:44 KST): primary95% 사용/주간46% 사용 확인. M2-AT a4a8196·M2-AU c0d9497은 main에 push 완료다. 집중39/39 및10/10·실제 두 리그 개막일10경기·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 추가 전체 npm test는5% 체크포인트에서 장기 파일2개를 명시적으로 중단했다. 종료 로그는356통과/2파일 종료 표시·653.38초이며 전체 통과가 아니다. 부분 로그는 evidence/M2-AU-full-tests-partial.log. 새 기능은 추가하지 않고 결과/인계 정리만 마무리한다.

- M2-AU(2026-10-21): 최소 공용 경기 세계 타입과 프로1군/퓨처스 배타 로스터 투영을 연결했다. 실제 개막일10경기·타석JSON 재개/공식 범위/1회 게시를 검증했고 관련10/10·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 추가 전체 테스트는5% 체크포인트에서 의도적으로 중단(356통과·장기 파일2개 종료 표시). 커리어 루트의 정규 phase/건강·날짜 원자 마감은 다음이다. [상세](M2-AU-KBO-GAME-WORLD.md).

- M2-AT(2026-10-21): 실제 KBO/퓨처스 각720·팀144·상대 홈8/원정8을 국제창 제외 세계 날짜에 배치하고 확정/복원/공개 fixture 조회를 연결했다. 관련39/39·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 경기/출장·성장 지급은 아직 없고 실제 경기 worker가 다음이다. [상세](M2-AT-KBO-SEASON-SCHEDULE.md).

- M2-AS(2026-10-21): 확정 계획에서 실제 개막1군28/퓨처스 명단·내 경쟁 리그를 원자 확정했다. 기존 편성 재사용/세 난이도 생성 해시 불변, 최종40/40·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 첫 경기/출장·일정은 아직 없고 실제 달력/경기가 다음이다. [상세](M2-AS-KBO-OPENING-ROSTER.md).

- M2-AR(2026-10-21): 프로 S42용 과거/현역 관계 읽기·공식 범위별 비교와 E94 읽음/S42 탐색을 연결했다. 기존21/21 전후 동일·최종46/46·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 프리시즌 확정 계획과 학교 원본을 보존한다. 다음은1군/퓨처스 편성·달력/경기 및 성향/포지션이다. [상세](M2-AR-KBO-RELATION-READS.md).

- M2-AQ(2026-10-21): 프로 첫 캠프 E08 비차단 알림·집중4/유형 PRE1회·구종 비율/학습과 계획 확정/스냅샷 잠금을 연결했다. 관련44/44+기존 학교16/16+대학 졸업1/1·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 다음은 프로 S42 조회/읽음·성향/포지션·1군/퓨처스 편성/일정이다. [상세](M2-AQ-KBO-PRESEASON-PLAN.md).

- M2-AP(2026-10-21): 학교 서명/연말에서 별도 KboCareer 실제 등록으로 전환. NPC500명 보존·내 선수501번째/대상 구단51명·연봉 예약1회·나이/새 예산·고교 관계/프로 새 동료 E94를 연결했다. 관련30/30+대학 졸업 등록1/1·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 다음은 프로 프리시즌·1군/퓨처스 실제 일정/경기와 S42 adapter. [상세](M2-AP-KBO-ROOKIE-ACTIVATION.md).

- M2-AO(2026-10-21): KBO 계약 후 명시적 학교 연말 마감/봉인과 관계·일반 특성 읽음의 봉인 보존. 최종 전체 check337/337(1131.07초)·lint/타입/build/골든/이벤트/설계10종·HTTP 통과. 실제 고교/대학216경기 회귀 포함. 다음은 signing의 실제 프로 로스터/연봉1회 반영·나이/구종/새 예산 활성화이며 아직 프로 경기는 없다. [상세](M2-AO-KBO-AMATEUR-YEAR-END.md).

- M2-AN(2026-10-21): 사용자 승인한 새 팀 첫 등록 동료1명을 실제 대학 입학에 연결. 고교 관계 보존, 같은 팀 학년/복귀 중복0, E94 등록 근거/비차단 읽음. 관련39/39(83.18초)·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 프로 실제 등록은 후속. [상세](M2-AN-TEAM-ENTRY-TEAMMATE.md).

- M2-AM(2026-10-21): 대학 진입 후 고교 관계의 과거 신원/등록·기록 조회와 E94 이름 보존. 관련21/21·타입/lint/build/골든/이벤트/설계10종/HTTP 통과. 다음은 사용자 승인한 새 팀 최초 등록 동료1명. [상세](M2-AM-RELATION-HISTORY.md).

마지막 갱신: 2026-10-22 (Asia/Seoul)

## 이어가기 체크포인트 — 2026-10-22 10:26 KST

실제5% 체크포인트: 단기 사용95%/잔여5%, 주간 사용61%를 확인했다. 추가 기능 구현을 중단하고 BT~BX 검증분과 진행/인계를 모두 커밋·push했다. 기능 기준 a95ec68, 직전 문서 기준 c671d88은 원격과 일치했다. 상무 두 질문은 답변 대기이며 선택 전 규칙 변경은 없다. 아래94% 기록은 바로 앞 사전정리 이력이다.

기능 기준 커밋 a95ec68은 origin/main push/원격 일치·clean을 확인했다. 단기 사용94%/잔여6%, 주간 사용61%를 확인해5% 경계 전에 선제 인계한다.5% 도달이라고 과장하지 않는다. 상무 일정/선발 규모 두 질문의 응답은 아직 없으며 새 군팀 규칙을 적용하지 않았다. 완료 범위는 BT~BX와 각 증거 로그를 따른다. 이 체크포인트 문서만 추가 커밋·push한다. PC 종료/리셋 크레딧 사용은 없다.

## 현재 위치

### 2026-10-22 상무(군 체육부대) 경로 — M2-CA~CE (전체 check 474/474)

| 단계 | 내용 | 문서 |
|---|---|---|
| M2-CA | 11팀 퓨처스 일정(14/15경기·홈72/원정72)·연간 선발 야수10·투수10 | [CA](M2-CA-SANGMU-FOUNDATION.md) |
| M2-CB | 복무 두 블록·정지 계약(일급 round(연봉/144)) 순수 원장 | [CB](M2-CB-SANGMU-PROGRAM-LEDGER.md) |
| M2-CC | 부대 소속 이동/복귀·FUTURES 11번째 학교 투영 | [CC](M2-CC-SANGMU-UNIT.md) |
| M2-CD | 커리어 연결(선발 명령·일정·진행·연도 전환) | [CD](M2-CD-SANGMU-CAREER-WIRING.md) |
| M2-CE | 내 선수 지원/입대/복무 대여·병역 기한 차단 | [CE](M2-CE-SANGMU-APPLICATION.md) |

미구현: 현역(ACTIVE)·ATHLETE 경로, 계약 정지/지급 원장·구단 예산, 복무 성장 계수·서비스 연차 0, 사건 E49·E51~E55(E50만 구현), 상무 부상/긴급 등록, 반년 복귀, 화면/API.

### 2026-10-22 정리: 프로(KBO) 커리어는 엔진에서 시즌 반복 → 은퇴까지 닫혀 있다 (M2-AV ~ M2-BX)

한 시즌 경로(KboCareer, packages/engine):
`startKboRegularSeason` → `advanceKboCareer`(두 리그 일마감·E43/E41/E09 창·건강 정지·특성·AI 라인업/승강) → SEASON_REVIEW(T16) → `startKboPostseason`/`advanceKboPostseason` → `settleKboSeasonGrowth` → `closeKboSeason`(내 성장 확정·노쇠·**모든 NPC 성장·노쇠**) → `offerKboRenewal`/`acceptKboRenewal`(E30, 08 산식) → `kboYearTransitionReadiness` → `startNextKboSeason`(Y02 나이·계약 전원 원자 적용, 45세 NPC 은퇴, **AI 재계약·FA3라운드·신인100명 드래프트·남은 필수자리만 보충·양 리그 편성**, 새 달력/원장, PRESEASON_SETUP 복귀) → 같은 프리시즌→개막 명단→일정→정규 시즌 명령 반복.
끝: `requestKboRetirement`/`resolveKboRetirement`(E36) 또는 `retireKboAtMaxAge`(45세) → 은퇴 영수증·E37·ARCHIVED → `kboRetirementArchiveView`(리그/단계별 기록·6능력/최고값·구종). `kboForcedRetirementReview`는 35세+·2시즌 미달 판정(읽기).

| 단계 | 내용 | 문서 |
|---|---|---|
| M2-AV~AX | 두 리그 일마감, 정규 시즌 진행, 건강 정지·특성 | [AV](M2-AV-KBO-DAY-CLOSE.md) [AW](M2-AW-KBO-SEASON-PROGRESS.md) [AX](M2-AX-KBO-DAY-HOOKS.md) |
| M2-AY~AZ | T16·시즌 성장 정산, E43/E41 창, 리그별 라인업 | [AY](M2-AY-KBO-SEASON-CLOSE-GROWTH.md) [AZ](M2-AZ-KBO-WINDOWS-LINEUP.md) |
| M2-BA~BB | 콜업 E09, AI 정기 승강 | [BA/BB](M2-BA-KBO-CALLUP.md) |
| M2-BC | 연말 마감(노쇠·건강·강화 포기) | [BC](M2-BC-KBO-SEASON-CLOSE.md) |
| M2-BD~BF | 포스트시즌 대진·실제 경기·일마감 후처리 | [BD](M2-BD-KBO-POSTSEASON-BRACKET.md) [BE/BF](M2-BE-KBO-POSTSEASON-GAMES.md) |
| M2-BG | 연도 전환 시작 조건(Y01) | [BG](M2-BG-KBO-YEAR-READINESS.md) |
| M2-BH | 재계약 E30, Y02 staging, 다음 시즌 원자 활성화 | [BH](M2-BH-KBO-RENEWAL-NEXT-SEASON.md) |
| M2-BI | 프로 NPC 연말 성장·노쇠 | [BI](M2-BI-KBO-NPC-YEAR-END.md) |
| M2-BJ | 45세 NPC 은퇴 | [BJ](M2-BJ-KBO-NPC-RETIREMENT.md) |
| M2-BK | 내 선수 은퇴(E36·45세) | [BK](M2-BK-KBO-MY-RETIREMENT.md) |
| M2-BL | 강제 은퇴 검토 조건(읽기) | [BL](M2-BL-KBO-FORCED-RETIREMENT-REVIEW.md) |
| M2-BM | 신인 100명 공급·AI 드래프트 | [BM](M2-BM-KBO-ROOKIE-SUPPLY.md) |
| M2-BN~BS | FA 풀/가치·확률·보장채무·재계약/시장·최소 편성 기반 | [BN](M2-BN-KBO-FREE-AGENT-POOL.md) [BS](M2-BS-KBO-DUAL-LEAGUE-REPAIR.md) |
| M2-BT | AI 오프시즌 실제 연도전환 활성화 | [BT](M2-BT-KBO-AI-OFFSEASON-ACTIVATION.md) |
| M2-BU~BW | FA/은퇴 관계 신원·등록 연차·은퇴 보관 읽기 | [BU](M2-BU-KBO-DETACHED-RELATION-READS.md) [BV](M2-BV-KBO-SERVICE-TIME.md) [BW](M2-BW-KBO-RETIREMENT-ARCHIVE-VIEW.md) |

검증 상태: 마지막 전체 `npm run check`는 BT/BV 기준457/457·실패0(1158.11초)다. 이후 등록 근거 조회와 은퇴 보관/메타데이터 보완은 최종14/14·타입/lint/build/compiled 골든/HTTP로 별도 검증했다. 최종 추가분을 포함한 전체 일괄 재실행은 하지 않았다.

아직 없는 것(다음 후보): 상무 포함11팀·144경기/매년 야수10·투수10 확정 규칙의 병역 실제 연결, 내 FA/포스팅 실제 계약, 재도전 사건·E30 거절(프로 재도전 3회)·강제 은퇴 실패 은퇴, 은퇴 보관 DB/실제 화면·선수 가져오기(엔진 읽기 BW 완료), 72 Y05 국제창·대학 일정 / Y06 AI 전략 / Y08 전체 불변 검사, 저장소 job/staging(DB)·API·화면(엔진 순수 상태까지만), 병역/미국/MLB 경로의 프로 연결, 내 선수 강등 정책(설계 불명).

### 이전 항목

- M2-AL(2026-10-21): 고교 관계 형성을 E94 알림·S42 이동/읽음으로 연결했다. 필수 과제/진행과 분리하고 실제 pending 경기 재개·연말 봉인 후 대학 진입을 보존한다. 관련38/38(23.09초). 사용자 확정으로 고교25명 고정·후보0은 NO_CANDIDATE이며 추가 생성은 폐기했다. [M2-AL](M2-AL-RELATION-FORMATION-NOTICES.md).

- 이어받은 M2-AK: 동료20경기 milestone(39/39), M2-AJ: S42 관계 상세, M2-AI: 고교 관계 형성(전체305/305), M2-AH: 히든 최초 해금 알림, M2-AG: T16 시즌 근거/도감까지 구현됐다. 아래 상세 링크/로그를 보존한다. 최신 항목이 중간에 있었던 요약을 이 위치에서 정리했다.

- M2-AF(2026-10-21): 미국30조직·가상3,420명/투수구종1,590명 생성, 확정된 레벨 평균/절단 분포와 JSON 복원, 실제 정원/재무 할당 기반 모집 재고를 연결했다. 관련19/19·KBO714배분/세계3해시 전후 일치. 생성→오퍼3개→단일 자리/예산 예약 경로를 검증했다. [M2-AF](M2-AF-US-INITIAL-ROSTERS.md). M2-AE는 fa828e2로 push 완료다. 실제 미국 계약/경기/등록 활성화·공식 메타데이터/재무 공급자는 후속이며 현재 입력은 통제 fixture다.

- M2-AE(2026-10-21): 미국 직행 실제 오퍼 평가/고정·자리/예산 검사·공개 비교·거절·30게임일 만료·US_MINOR 계약/권리/등록 예약과1회 자리/예산 차감을 연결했다. 관련23/23(71.69초) 통과. 기존 KBO/대학 진로와 경쟁 수락을1회로 제한하며 원본 기록/성장·나이를 보존한다. 자동 미국 선수단 생성/공유 세계 작업자·활성화/마이너 경기·수입 실제 지급은 후속이다. [M2-AE 범위·증거·호환](M2-AE-US-DIRECT-OFFERS.md)를 우선한다.

- 최신 운영 지시(2026-10-21): 구현을 계속하고 사용량 잔여5%에서 진행·인계 MD를 최신화한 뒤 검증된 작업을 모두 커밋·push한다. 이전1%·3% 기준은5%로 대체한다. PC 종료/리셋 크레딧 사용 요청은 없다.

- M2-AD 검증 완료: 관련64/64(4.17초), 타입/테스트 타입·lint·전체 build·compiled 골든·이벤트 동기화·설계 정적10종·HTTP smoke 통과. NPC 생성2·미국 평가65·평균 성장 유지·구 저장값 보존을 확인했다. 전체 장기 시즌 묶음은 중간 정정으로 중단한 뒤 재완주하지 않았다. 실제 미국 오퍼/마이너 경로와 KBO 다음 시즌 활성화가 후속이다. 코드·문서·실측·로그를 함께 커밋/push한다.

- M2-AD(2026-10-21) 진행: NPC 분포2·구버전 복원과 미국 스카우트 평가65 분리를 구현했다. 플레이어 성장2배는 철회했다. 반복 커리어 잠재력/손·유형 효과는 기존 규칙을 활용하며 미국 진출을 보장하지 않는다. [범위·호환·증거](M2-AD-SCHOOL-BALANCE-V2.md). 검증 결과는 해당 문서를 따른다.

- 고교 밸런스 검토(2026-10-21): 사용자에게 평균 중심/극단값 희소화 요구를 받았다.200세계의NPC44,800명을 실측해 종합65는 학교당최대1명,60이상은최대6명을 확인했다. 평균48 절단 정규분포 후보와 주인공만의 고교 성장 조정 산술을 [검토 문서](SCHOOL-GROWTH-DISTRIBUTION-REVIEW.md)에 저장했다. 스타 빈도와 NPC 개별 능력 편차를 질문했으며 제품 게임 규칙은 바꾸지 않았다.

- M2-AC(2026-10-21) 검증 완료: 고교/대학 졸업 진로에서 첫 KBO 지명 평가를 준비하고 실제 구단 수요 기반 결과를 고정하며1년 신인 계약/권리/다음 시즌 자리·연봉을 예약한다. 계약 거절 후 고교의 대학 진학은 유지한다. 최종 관련38/38(106.3초)·타입/테스트 타입·린트·전체 빌드·compiled M1 골든·이벤트 동기화·설계 정적10종·HTTP smoke를 통과했다. 전체 테스트 묶음은 이번 단계에서 다시 실행하지 않았다. 프로 경기/연도 활성화와 E05/E06 화면 사건은 후속이며 [범위/제약](M2-AC-KBO-DRAFT-SIGNING.md)에 기록했다. 미국 고교 직행52 도달성 충돌의 조정 방식은 사용자에게 질문했으며 답변 전 규칙을 바꾸지 않는다.

- 재개(2026-10-21): 사용자가 다른 환경에서 진행한 구현을 Git 최신화한 뒤 이어 가도록 지시했다. 기존 작업 체크아웃에서 origin/main을688e56b→8b54f4a로 fast-forward하고, 변경84개를 V:/에 반영했다. V:/의 별도 변경 충돌은0개였다. 이전 환경의 구현 중단/PC 종료 지시는 당시 실행 이력이며 현재 실행에 적용하지 않는다.
- 이전에는 V:/에서 수정했다. 2026-10-22 최신 사용자 지시부터 작업 원본은 정상 Git/빌드 체크아웃이며 경로는 C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo다. V:/.git은 초기화하지 않는다. 사용량 잔여5% 확인 시 진행/인계 MD를 갱신하고 검증된 변경을 커밋·push한다. 리셋 크레딧은 사용하지 않는다.
- M2-AB 검증 완료: 실제10구단과 가상500명/초기 계약/예약 예산 생성, JSON 복원 검증을 구현했다. 원격8b54f4a 기준 전체252/252·check 종료코드0(테스트1341.1초), 새 코드 집중6/6과 추가 후 전체 워크스페이스 타입/테스트 타입·빌드·compiled M1 골든·이벤트 동기화·설계 정적10종·HTTP smoke 종료코드0을 확인했다. 전체258개를 한 번에 실행했다는 뜻은 아니다. [M2-AB](M2-AB-KBO-ROSTER-WORLD.md)와 로그를 함께 저장한다. 실제 지명·주인공 계약·게임 UI/계정/DB는 아직 연결 전이다. KBO 지명 구단은 포지션 수요 우선/희망 구단 선호만 반영한다는 사용자 결정을14에 저장했다.

## 이전 실행 이력

- 최종 검증·인계(2026-10-21): 추가 기능 구현 중단. M2-AA 기능/문서/검사 증거를 `39bda6e`로 커밋하고 origin/main push 성공을 확인했다. 전체252/252(232.3초)·check/HTTP smoke 종료코드0, 설계 정적10종·working/staged manifest359/359 일치. [최종 인계](NEXT-SESSION.md)에 재개 기준/검증 한계/남은 구현을 저장했다. 이 문서 인계를 별도 커밋·push한 뒤 실제 원격 HEAD 일치·clean을 다시 확인하고 승인된 PC 종료 명령을 실행한다. 리셋 크레딧 미사용.

- 사용자 최신 지시(2026-10-21): **지금 추가 기능 구현 중단**. 마지막 M2-AA 검증·인계 정리·커밋/push 성공 확인 뒤 PC 종료만 수행한다. 최종 보강(졸업 전체 세계 snapshot/달력·seed 변조 거절)을 포함한 전체252/252·check/HTTP smoke를 통과했다. [다음 환경 인계](NEXT-SESSION.md)는 현 체크아웃과 실제 재개 명령/남은 범위로 재정리했다.

- 사용자 운영 지시(2026-10-21): 단기 사용량을 활용해 구현을 계속하되 종료 준비에 필요한 여유를 남긴다. 단계별 진행 MD/검증/커밋/push를 유지하며,사용자 후속 지시로3%를 고집하지 않고 인계·검증·커밋·푸시·종료를 모두 마칠 사용량이 남았을 때 새 구현을 멈추고 다음 환경 인계를 정리해 커밋·푸시 성공을 확인한 뒤 PC를 종료한다. PC 종료는 사용자가 명시적으로 승인했다. 최근 확인은 사용92%/잔여8%이며 리셋 크레딧은 사용하지 않는다.

- 2026-10-21 M2-AA:4학년 결과→필수 E75→GRADUATED/진로 조회를 연결했다. 집중10/10·전체252/252(232.3초), check 종료코드0·lint/타입/빌드/골든/고교 해시6개/이벤트/설계 정적10종·HTTP smoke 통과. [전체 검사](evidence/M2-AA-check.log) · [HTTP smoke](evidence/M2-AA-smoke.log). 같은 세계시즌 후속 등록의 성장/강화/건강 예산을 보존하고, 공개 조회는 KBO 모집 대기/미국 오퍼0 숨김을 유지한다. [M2-AA 인계](M2-AA-COLLEGE-GRADUATION.md). M2-AA `39bda6e` push 완료다. 이 단계가 이번 실행의 마지막 신규 구현이다. 최종 인계 문서 push와 원격 확인 뒤 PC 종료를 마무리한다.

- 2026-10-21 M2-Z: 대학 연말 마감·NPC224명 성장/보존·졸업생만 신입생 교체·다음 학년 실제 등록을 연결했다. 집중18/18·전체247/247(약230초)·check/빌드/타입/lint/골든/고교 해시6개/이벤트/설계 정적10종·HTTP smoke 통과. 실제 대학216경기부터2학년 실제 등록까지의 경로도 확인했다. [전체 검사](evidence/M2-Z-check.log) · [HTTP smoke](evidence/M2-Z-smoke.log).1→2→3→4학년·5학년 차단/중간 부상 이월과 구종/P 보존을 확인했다. [M2-Z 인계](M2-Z-COLLEGE-NEXT-YEAR.md). M2-Y `f34d813`까지 push 완료다.

- 2026-10-21 M2-Y: 대학 정규/선수권 건강 이력 감사·고교 부상 이월과 정규 기간 성장·학년 완료1회/결과를 연결했다. 집중7/7·전체241/241(약232초)·check/빌드/타입/lint/골든/이벤트/설계 정적10종·HTTP smoke 통과. 실제 대학216→선수권→대학 성장/학년 결과도 통과했다. [전체 검사](evidence/M2-Y-check.log) · [HTTP smoke](evidence/M2-Y-smoke.log). [M2-Y 인계](M2-Y-COLLEGE-YEAR-RESULT.md). 다음은 대학 연말 마감/다음 학년 실제 등록·NPC 지속성장/졸업 교체다. M2-X `c46a1af`까지 push 완료다.

- 2026-10-21 M2-X: 대학 순위와 상위4 선수권 실제 경기·우승/결승 중단·정규/PS 분리와 건강/XP/특성을 연결했다. 집중14/14·전체236/236(약234초)·check/빌드/타입/lint/골든/고교 해시6개/이벤트/설계 정적10종·HTTP smoke 통과. 실제 대학216→선수권4/5경기와 원장/관측 보존을 검증했다. [전체 검사](evidence/M2-X-check.log) · [HTTP smoke](evidence/M2-X-smoke.log). [M2-X 인계](M2-X-COLLEGE-CUP.md). M2-W `16e9fd8`은 원격 반영 완료이며 이번 단계도 검증 후 커밋·푸시한다.

- 2026-10-21 M2-W: 대학 프리시즌·COLLEGE 정규리그 명령·연도별 평가/특성·대학 임시 충원을 구현했다. [M2-W 인계](M2-W-COLLEGE-REGULAR-SEASON.md). 집중22/22·전체229/229(약261초), check/lint/타입/빌드/골든/해시6개/이벤트/설계 정적10종·HTTP smoke를 통과했다. 실제 대학216경기/팀48경기·고교 기록216개/역사 보존·관측48→96/단계4·투수XP를 확인했다. [전체 검사](evidence/M2-W-check.log) · [HTTP smoke](evidence/M2-W-smoke.log). 대학 선수권/성장 정산/학년 진급은 다음 단계다.

- 2026-10-20 M2-V: 대학 입학 후 고교 연말 마감→다음 연도 대학 세계/실제 포지션 등록을 구현했다. 나이1회·능력/P/구종 이월·고교 역사/216경기 보존·새 성장/XP 원장·경미 부상 이월과 중대 시즌 마감을 연결했다. [M2-V 인계](M2-V-COLLEGE-YEAR-ENTRY.md). M2-V 당시 대학 PRESEASON_SETUP까지였으며 대학 경기/학년 진행과 KBO 실제 모집은 다음 작업이다.
- M2-V 검증: 집중18/18·전체 **220/220**(약235초), `npm run check` 종료코드0. lint·소스/테스트 타입·전체 빌드·M1 골든·고교 세계 해시6개·이벤트 동기화·설계 정적10종 통과. 실제216경기→대학 입학→연말 마감→2033 대학 등록에서 기록/능력 보존·성장 재지급0을 확인했다. HTTP smoke 종료코드0·설계 manifest359/359 일치. [전체 검사](evidence/M2-V-check.log) · [HTTP smoke](evidence/M2-V-smoke.log). 코드·MD·증거를 같은 로컬 커밋으로 저장한다.

- M2-V 준비 리팩터링: 학교 NPC 생성과 공통 로스터 검증을 분리했다. 변경 전에 고정한 타자/투수×난이도3종의 세계 전체 SHA256 6개가 모두 일치하며, 세계/임시 충원 집중10/10·타입·lint 통과. 기존 고교 생성 분포와 난수 소비는 유지했다. 체크포인트 커밋은 `dac8b4c`이며, 이번 공유 코드 추출도 별도 커밋으로 저장한다.

- Git 저장 정책(2026-10-21 최신 사용자 지시): 검증된 단계마다 코드·진행 MD·증거를 커밋하고 origin/main에 push한다. M2-T/U/V의 `dac8b4c`·`c8f388e`·`1a9a3f1` push를 완료했다. 이전 항목의 커밋/푸시 미수행은 당시 이력이다. Git 작성자 미설정 환경에서는 커밋별 `Codex <codex@localhost>`를 사용하며 전역 Git 설정을 변경하지 않는다.

- 2026-10-20 M2-U: 실제 고교 결산 확인→성장 부분 정산→필수 E04→S28 진로 비교→대학 입학 확정→다음 시즌 준비를 연결했다. 대학9곳의48/52/55 경계·공개 allowlist·낡은 제안/중복 입학 거절을 구현했다. [M2-U 인계](M2-U-GRADUATION-COLLEGE-ROUTE.md). KBO 실제 모집/추첨과 대학 다음 연도 세계는 아직 미구현이며 미국52 충돌은 유지한다.
- M2-U 검증: 집중6/6, `npm run check` 종료코드0·**213/213 테스트 통과**(약215초). lint·소스/테스트 타입·전체 빌드·M1 골든·이벤트 동기화·설계 정적10종 통과. 실제216경기 이후 E04/S28/대학 입학, JSON 재개, 기록 보존과 성장1회 지급을 확인했다. HTTP smoke 종료코드0, manifest359/359 해시 일치. [전체 검사](evidence/M2-U-check.log) · [HTTP smoke](evidence/M2-U-smoke.log). 커밋·푸시는 하지 않았다.

- 2026-10-20 M2-T: 사용자 승인 성장 달력(세계2~10월·고교2~6월)을 구현하고 실제 기록·재활·계획 이력 기반 고교 부분 정산을 연결했다. [M2-T 인계](M2-T-GROWTH-CALENDAR.md). 일반/하드의 첫 졸업 미국52 도달성 충돌을 확인했으며 수치를 임의 변경하지 않았다. 아래의 이전 다음 작업 안내보다 이 항목을 우선한다.
- M2-T 검증: `npm run check` 종료코드0, **206/206 테스트 통과**. lint·소스/테스트 타입·전체 빌드·M1 골든·이벤트 동기화·설계 정적10종 통과. `npm run smoke` 종료코드0, 웹/자산/실제API HTTP 통과. 설계 manifest359/359 해시 일치. 새 달력의 실제216경기와16경기 강화·24경기 유형 변경, 부분 성장/중복0·다음 등록기간 원장 공유를 확인했다. [전체 검사](evidence/M2-T-check.log) · [HTTP smoke](evidence/M2-T-smoke.log). UI·DB·오퍼/진로 연결은 미구현이며 이번 로컬 변경은 커밋·푸시하지 않았다.

- 사용자 구현 착수 승인: 2026-10-20. 설계 기준 커밋 `2b524a3`.
- 현재 마일스톤: **M0/M1 완료, M2 진행 중**. 현재 KBO 실제 시즌 반복·AI 오프시즌·은퇴와 읽기 투영은 BT~BX 요약이 기준이다. 아래 대학 중심 설명은 이전 범위 이력이다. 고교216경기·평가·특성·성장 정산·E04/대학 입학에 이어 M2-X의 대학 프리시즌·정규216경기·상위4 선수권과 기록/평가/특성까지 연결했습니다. M2-Y의 성장/학년 완료도 연결했습니다. M2-Z에서 NPC 성장/연말 마감과1→4학년 재학도 연결했습니다. M2-AA의4학년 필수 졸업/진로 조회까지 연결했습니다. 다음은 실제 KBO 모집/조기 지명/계약과 졸업 후 진로입니다. M2 전체 완료가 아닙니다.
- M1 범위: 결정론 PCG32·독립 스트림, 타석 확률·구종/성향/폼/좌우 효과, 주자·아웃·이닝·경기, 투수 운용/기록/판정, JSON 중단 재개.
- 병살 보정 계수는 이번 사용자 선택을14/41에 기록했습니다. 웹 시작 화면은 여전히 임시 개발 안내이며 S01 최종 홈이 아닙니다.
- 같은 계정으로 앱↔PC 이어하기 요구는 기존 74/76/87 계약을 유지하며 M3/M4에서 구현·검증합니다.

## 다음 작업자가 먼저 할 일

1. Git 상태와 최신 remote를 확인하고 미커밋 변경을 보존합니다.
2. 이 문서와 DEVELOPMENT, 설계 14/91/120 및 작업 분야 원문을 읽습니다.
3. Node 24에서 `npm ci`, `npm run check`, `npm run smoke`를 실행합니다.
4. NEXT-SESSION의 최신 BT~BW 체크포인트·분야 인계·실제 코드를 먼저 읽습니다. 미국 자격은 스카우트 평가65·유효오퍼·권리이며30게임일 기한/예약까지 M2-AE/AF에 연결됐습니다. 고교25명 고정/후보0 정상 상태, 고교 부분 정산·세계2~10월/고교2~6월, 공식 기록 scope와 원본 보존을 유지합니다. 프로 시즌 반복·은퇴까지는 위 "현재 위치" 요약(M2-AV~BX)이 최신이며 AI 오프시즌은 연결했습니다. NPC 진로/관계 재회·병역/해외 실제 경로는 후속입니다.
5. 마일스톤별로 이 문서에 완료 범위·실제 검사 결과·실패·다음 작업을 기록하고 커밋·푸시합니다.

## 구현과 설계의 경계

rules의 6능력/집중4개/종합 반올림/최고값 반감은35·90을 따르고 기용 역할 가중은41입니다. 경기 코어·선수 육성·고교 실제 기록 기반 특성 해금·부분 성장·대학 입학/첫 등록과 대학 정규 진행까지 연결했습니다. 고교/대학→KBO 모집/계약·프로 다시즌 전이/AI 오프시즌·은퇴 읽기는 구현했습니다. 전체 보관 선수 가져오기·모든 리그 간 전이·남은 관계 특성/재회·졸업 미계약 재도전·인증·Neon 저장·APK는 후속입니다. 대학 학년 결과/진급과4학년 졸업은 M2-Y/Z/AA에서 구현했습니다. 설계 fixture 전체의 NOT_EXECUTED 상태를 일괄 구현 PASS로 바꾸지 않습니다.

## M2-BM 프로 신인 100명 공급·AI 드래프트 — 부분 완료

연도 전환에서 매년 신인 100명(고정 묶음 키)을 역순위 10라운드로 지명, 1년 최저연봉. AI 방출/FA는 다음. [M2-BM](M2-BM-KBO-ROOKIE-SUPPLY.md).

## M2-BL 강제 은퇴 검토 조건 — 부분 완료

35세+·최근 2마감 시즌 1군 50타석/20이닝 미달 판정(읽기). 재도전 사건/실패 은퇴는 다음. [M2-BL](M2-BL-KBO-FORCED-RETIREMENT-REVIEW.md).

## M2-BK 내 프로 선수 은퇴·보관 — 부분 완료

수동 은퇴 E36(취소/확정, 열린 E30 함께 종료)과 45세 최종 은퇴가 은퇴 영수증·E37·ARCHIVED를 한 결과로 만든다. 강제 은퇴 검토·은퇴 페이지는 다음. [M2-BK](M2-BK-KBO-MY-RETIREMENT.md).

## M2-BJ 45세 NPC 은퇴 — 부분 완료

다음 시즌 활성화에서 45세 시즌을 마친 NPC가 은퇴(세계에서 제거·retiredPlayers 보관·해당 1군만 재선택). 신인 공급은 다음. [M2-BJ](M2-BJ-KBO-NPC-RETIREMENT.md).

## M2-BI 프로 NPC 연말 성장·노쇠 — 부분 완료

closeKboSeason에서 모든 프로 NPC가 정규 시즌 공식 출장 기반 자연 성장(PRO 한 구간)과 시즌 노쇠를 한 번 받는다(대학 M2-Z 방식). [M2-BI](M2-BI-KBO-NPC-YEAR-END.md).

## M2-BH 비FA 재계약 E30·Y02·다음 프로 시즌 활성화 — 부분 완료

내 선수 1년 재계약(08 산식, BLOCKING E30)·수락, Y01 계약 차단, Y02 나이·계약 staging, startNextKboSeason 원자 활성화로 둘째 프로 시즌이 실제로 열리고 경기된다. NPC 노화/성장·은퇴·신인 공급·AI 오프시즌은 다음. [M2-BH](M2-BH-KBO-RENEWAL-NEXT-SEASON.md).

## M2-BG 프로 연도 전환 시작 조건 — 부분 완료

72 Y01 시작 조건을 읽기 전용 kboYearTransitionReadiness로 구현했다(리뷰 단계·PS 완료·연말 마감·열린 사건·진행 경기·성장 확정·최대 45세). 3/3·lint·타입·build·골든 통과. [M2-BG](M2-BG-KBO-YEAR-READINESS.md).

## M2-BF 포스트시즌 일마감 후처리 — 부분 완료

PS 경기일 마감 후 특성 해금(T06)과 내 선수 건강 정지를 연결했다. 전체 check 404/404. [M2-BE/BF](M2-BE-KBO-POSTSEASON-GAMES.md).

## M2-BE KBO 포스트시즌 실제 경기 — 부분 완료

startKboPostseason/advanceKboPostseason으로 정규 1~5위 시드의 포스트시즌을 하루 한 경기씩 실제 엔진으로 진행해 우승팀을 정하고 SEASON_REVIEW로 돌아간다(POSTSEASON 기록·일마감 연속). 전체 check 403/403. [M2-BE](M2-BE-KBO-POSTSEASON-GAMES.md).

## M2-BD KBO 포스트시즌 대진 상태 — 부분 완료

01 규칙(와일드카드 4위 선취·3/5/7전·홈 패턴)의 순수 대진 상태 기계를 추가했다. 3/3·lint·타입·build·골든 통과. 실제 PS 경기 연결은 다음. [M2-BD](M2-BD-KBO-POSTSEASON-BRACKET.md).

## M2-BC 프로 시즌 연말 마감 — 부분 완료

closeKboSeason: 성장 지급 확인→미사용 강화 명시적 포기→노쇠 1회→건강 시즌 마감→seasonClose 영수증. 전체 check 399/399. 다음은 나이 증가·계약·다음 세계 시즌 개시(72). [M2-BC](M2-BC-KBO-SEASON-CLOSE.md).

## M2-BB AI 클럽 20경기 정기 승강 — 부분 완료

각 AI 클럽의 FUTURES 20팀경기마다 사건 없이 같은 경쟁 점수로 강한 퓨처스 선수를 같은 포지션/보직의 가장 약한 1군 선수와 맞바꾼다. 내 선수는 제외. 전체 check 398/398. [M2-BA/BB](M2-BA-KBO-CALLUP.md).

## M2-BA 퓨처스 콜업 검토·첫 1군 호출 — 부분 완료

퓨처스 20팀경기마다 경쟁 점수(roleScore×.8+성적지수×.2)로 같은 포지션/보직의 가장 약한 1군 선수와 비교하고, 첫 호출이면 E09에서 멈춰 ACCEPT 시 맞교대·KBO 등록, DEFER 시 유지한다. 관련3/3, 전체 check 397/397. [M2-BA](M2-BA-KBO-CALLUP.md).

## M2-AZ 프로 강화·유형 창과 AI 라인업 문맥 — 부분 완료

48경기 E43·72경기 E41 창(정지·해결·강화·MID 유형 변경)과 계획 분할 성장, 리그별 최근 20경기 블록 라인업 문맥을 연결했다. 관련 통과, 전체 check 394/394. [M2-AZ](M2-AZ-KBO-WINDOWS-LINEUP.md).

## M2-AY 프로 시즌 마감 T16·정규 시즌 성장 정산 — 부분 완료

SEASON_REVIEW 진입 시 T16 연속 선발 시즌을 1회 정산하고(리그별 근거 표기), settleKboSeasonGrowth로 PRO 기간 1개·PRO 출장 분모·일마감 기반 재활 비율의 시즌 성장을 1회 지급한다. 관련10/10, 전체 check 389/389 통과. [M2-AY](M2-AY-KBO-SEASON-CLOSE-GROWTH.md).

## M2-AX 프로 일마감 후 건강 정지·특성 해금 — 부분 완료

내 선수의 부상/회복이 있는 날 HEALTH_CHANGE로 멈추고, 두 리그의 같은 시즌 공식 기록으로 특성 해금을 평가한다(refreshCareerTraits를 구조 타입·leagueKeys로 일반화). 관련6/6, 전체 check 385/385 통과. [M2-AX](M2-AX-KBO-DAY-HOOKS.md).

## M2-AW 프로 정규 시즌 진행 명령 — 부분 완료

startKboRegularSeason/advanceKboCareer로 KboCareer에 정규 시즌 phase·날짜 원장·두 리그 날짜순 경기 큐(안전 청크·JSON 재개)·구종 장부 부분 병합·두 리그 일마감을 연결했다. 관련4/4, 전체 check 383/383 통과. [M2-AW](M2-AW-KBO-SEASON-PROGRESS.md).

## M2-AV 프로 두 리그 일마감·전체 검사 기준선 — 부분 완료

깨끗한 HEAD에서 전체 npm run check 377/377을 완주해 M2-AU의 미완주 항목을 해소하고, KBO·FUTURES를 같은 날 하나의 증거로 닫는 closeKboCompetitionDay(클럽 전체 하루1회 피로, 리그별 팀경기 건강)를 추가했다. 관련3/3·타입·lint·build·골든 통과. [M2-AV](M2-AV-KBO-DAY-CLOSE.md).

## M2-AK 동료 20경기 공존 이정표 — 부분 완료

일마감마다 동료 관계의 같은 시즌 정규 팀 경기일이 20일이 되면 COEXIST_20 이정표를 한 번 추가한다. 관계6/6과 장기 경로 포함 39/39, 타입·lint·build·골든 통과. [M2-AK](M2-AK-TEAMMATE-MILESTONE.md).

## M2-AJ 관계 상세 비교·직접 대결 투영 — 부분 완료

60의 같은 종류 비교(공동 출장 경기만)와 다른 종류 직접 대결(실제 타석만), 범위 분리·빈 상태·현재 세계 밖 상대를 읽기 전용으로 구현했다. 관계5/5·테스트 타입·lint 통과. [M2-AJ](M2-AJ-RELATION-DETAIL.md).

## M2-AI 고교 라이벌·동료 형성 — 부분 완료

커리어 시작에 60/51 규칙의 동료1·라이벌1을 형성하고(별도 난수 스트림, 같은 상대 중복 역할 금지) S42 목록 투영을 추가했다. 후보0 시 선수 생성은 후속으로 NO_CANDIDATE를 기록한다. 전체 check 305/305 통과. [M2-AI](M2-AI-HS-RELATIONS.md).

## M2-AH 특성 해금 알림·일반 해금 요약 — 부분 완료

사용자 결정대로 히든 특성 최초 해금만 E84에서 진행을 멈추고(OPEN_TRAITS→S38, 저장 단계 복귀), 일반 특성 해금은 읽지 않은 요약으로 모은다. 집중38/38과 타입·lint·build·골든·이벤트·설계10종 통과. [M2-AH](M2-AH-TRAIT-NOTICES.md).

## M2-AG T16 연속 선발 시즌 근거·특성 도감 투영 — 부분 완료

107 §7의 3×G 선발 outs 시즌 판정과 시즌 마감 1회 연속값 갱신·5시즌 해금을 연결하고, 100 규칙의 S38 읽기 투영(일반 정확 진척·히든 이름/암시만)을 추가했다. 집중28/28·도감2/2와 타입·lint·build·골든·이벤트·설계10종 통과. [M2-AG](M2-AG-T16-STARTER-SEASONS.md).

## M2-S 실제 기록 기반 특성 해금 — 부분 완료

고교 일마감마다 그날까지 공식 기록이 있는 모든 선수를 56/107 해금 조건으로 평가하고, 보유 특성·영수증을 커리어 원장에 저장해 다음 경기 문맥에 반영했다. 재처리0·보유 유지·투수/타자 구분을 검증했다. 집중4/4·전체199/199 통과. T14 관계·T16 다시즌 근거는 비워 두었다. [M2-S 인계](M2-S-CAREER-TRAIT-UNLOCKS.md) · [전체 검사](evidence/M2-S-check.log).

## M2-R 실제 등록 경기 평가 갱신 — 부분 완료

내 선수 평가를 실제 일마감된 등록 팀 정규경기에 연결했다. 216경기 완주에서 내 팀48관측/2단계, 조회/재처리로 진척·RNG 변경0, 숨김P/seed 제외·치트100 투영을 검증했다. 집중3/3·전체195/195 및 빌드/기존 골든/정적10종 통과. [M2-R 인계](M2-R-CAREER-ASSESSMENT.md).

## 사용량1% 종료 체크포인트

2026-10-20: 5시간 사용99%/잔여1%, 주간 사용16%/잔여84% 확인. 새 기능 추가를 멈추고 검증된 M2-R까지 문서/코드/증거를 커밋·푸시한다. [다음 환경 인계](NEXT-SESSION.md). 다음은 실제 성장가능일/등록 달력 정합, 졸업 전 기간 성장과 진로/유효오퍼, 기록 기반 특성/학습 분기다. 웹 UI·인증/Neon 저장·APK는 아직 미구현이다. 사용량 리셋 크레딧은 사용하지 않았다.

## M2-Q 실제 강화·MID 유형 변경 — 부분 완료

48경기 중16경기 해금·피로/부상/난이도·시즌1회 사용·성공/증가/비용 원장을 연결했다. DEFER는 미사용, FORFEIT는 실제 사용 뒤 사건 완료, MID24 유형 변경1회·능력 불변/계획 이력을 검증했다. 집중6/6·전체192/192 및 빌드/기존 골든/정적10종 통과. [M2-Q 인계](M2-Q-CAREER-TRAINING.md). 다음은 실제 등록 경기의 평가 갱신과 졸업 성장·진로 연결이다.

## M2-P 고교 커리어 실제 진행·완주 — 부분 완료

기본 다음 주요 사건/1경기/1주일·안전 청크와 pending 재개를 연결했다.12경기 집중/16경기 강화창/24경기 유형창·부상/복귀·최종 리그결산에서 멈춘다. 실제216경기/각 팀48경기 완주, 집중8/8·전체186/186 및 빌드/기존 골든/정적10종 통과. [M2-P 인계](M2-P-HIGH-SCHOOL-PROGRESS.md). 다음은 실제 강화·MID 유형 효과와 졸업 성장/진로 연결이다.

## M2-O 커리어 시작·첫 사건 실제 명령 — 부분 완료

CREATED→E01 EVENT_DECISION→PRESEASON_SETUP→SEASON_PROGRESS를 실제 상태와 revision 검증으로 연결했다. 집중4개 선택이 성공할 때만 사건을 완료하고 PRE 유형 변경1회/동일유형 유지·능력 불변과 계획 이력을 검증했다. 집중5/5·전체178/178 및 빌드/기존 골든/정적10종 통과. [M2-O 인계](M2-O-CAREER-START.md). 다음은 실제 진행 청크와12/16/24경기 주요 선택·졸업 경계다.

## M2-N 고교 임시 NPC 생성·등록 — 부분 완료

최소 충원 계획을 기존 고교 NPC 분포/잠재력·손/타석/폼 생성과 실제 등록에 연결했다. 복귀 시 초과 임시 선수 등록만 해제하고 신원/구종/공식 기록 참조는 보존한다. 집중4/4·전체173/173 및 빌드/기존 골든/정적10종 통과. [M2-N 인계](M2-N-HIGH-SCHOOL-EMERGENCY.md). 실제 커리어 phase·진행 명령·사건/졸업 연결은 후속이다.

## M2-M 고교 일별 경기 후 처리 — 부분 완료

해당 날짜 모든 경기 FINAL을 확인한 뒤 등록선수 피로/휴식을 하루1회, 출장 부상·등록 팀경기 회복을 반영한다. 같은 날 재처리0·낡은 근거/부분 건강 게시/날짜 역행을 거절한다. 집중3/3·전체169/169와 빌드/기존 골든/정적10종 통과. 실제24경기+휴식일을 검증했다. [M2-M 인계](M2-M-HIGH-SCHOOL-DAY.md). 다음은 임시 NPC 생성/등록과 실제 커리어 phase·사건 연결이다.

## M2-L 고교 세계·실제 경기 연결 — 부분 완료

고교 로스터/수비/선택 선발·구종 book을 실제1.2 경기 snapshot으로 연결했다. 타석 중간JSON재개, FINAL 후 기록+숙련도 동시 반환, 중복 확정0·낡은 세계/기록 revision 거절, 첫날4경기를 검증했다. 집중5/5·전체166/166 및 빌드/기존 골든/정적10종 통과. [M2-L 인계](M2-L-HIGH-SCHOOL-GAME.md). 실제 일별 진행·부상/피로/등록·사건/진로·DB 확정은 후속이다.

## M2-K 부상·최소 임시 충원 기반 — 부분 완료

실제 출장자 경기당 부상 추첨, 팀 경기 기준 회복, 진단 경기 제외, 동일 근거 재처리0, 중상 시즌 마감과 임시 로스터 최소 인원 계산을 구현했다. 사용자 승인은14에 반영했다. 집중8/8·전체161/161 및 빌드/기존 골든/정적10종 통과. [M2-K 인계](M2-K-HEALTH-EMERGENCY.md). 아직 실제 경기 후 세계 처리·임시 NPC 생성/등록·복귀 이벤트 발행은 연결 전이다.

## M2-J 사건 처리 기반 — 부분 완료

99개 사건·164개 선택지의 서버용 정의와 동기화 검사를 추가했다. 근거별 중복 차단, 확인/이동/도메인 명령 구분, 필수 사건의 실제 도메인 확정 후 완료, E63 승인/보류 분기와 대기열을 검증했다. 집중8/8·전체153/153 및 빌드/기존 골든/정적10종 통과. [M2-J 인계](M2-J-EVENTS.md). 99개 발생 조건·도메인 처리기 전체 구현은 후속이다. 부상·최소 충원 기반은 M2-K에서 이어서 검증했다. 실제 고교 진행은 후속이다.

## M2-I 기간 성장·연간 중복 방지 — 부분 완료

고교 졸업 전 부분 지급·동일 세계시즌 공통 예산·기간별focus/유형 배분·소멸 기록·노쇠1회를 구현했다. 집중6/6·전체145/145 및 빌드/기존 골든/정적검증 통과. [M2-I 인계](M2-I-PERIOD-GROWTH.md). 하드 실제 생성 선수의 고교 전체기간+확정 강화1→종합52 계산은 확인했으나 실제 고교 경기/세계 달력/오퍼 생성 통합 경로는 후속이다.

## M2-H 자동 수비 편성·피로·미국 문턱 정정 — 부분 완료

전체 슬롯 배치/좌투 제한·최근 지수·타순·일별 피로를 구현했다. 미국 직행 종합52는 사용자 승인에 따라 공통 rules/문서/시안/검증에 맞췄고 고교 부분 성장 정산도 승인 기록했다. 집중14/14·전체139/139 및 빌드/기존 골든/정적검증 통과. [M2-H 인계](M2-H-LINEUP-US-GATE.md). 이어진 기간 원장은 M2-I에서 검증했다.

## M2-G 실제 타석 구종XP — 부분 완료

경기1.2에 실전outs XP와 다음 타석 숙련 갱신을 연결했다. 엄격 원장 검증·중간JSON재개·FINAL 재처리XP0. 집중4/4·전체133/133 및 빌드/기존 골든/정적검증 통과. [M2-G 인계](M2-G-GAME-PITCH-XP.md). 세계 공식 book 게시/DB transaction과 고교 진행 명령은 후속이다.

## M2-F 확정 기록·좌우/상대별 집계 — 부분 완료

FINAL contribution과 같은 경기 중복0/공식 정정 원자 교체, 리그/phase 구분, 좌우·직접대결 합계 보존·같은 날 중복출장 차단을 구현했다. v2 신원 snapshot은 경기 불변 input만 사용한다. 집중13/13·전체129/129 및 빌드/기존 골든/정적검증 통과. [M2-F 인계](M2-F-RECORDS.md). 실제 DB/공개API·원본 중계 SHA256은 후속이다.

## M2-E 보유 특성 실제 경기 효과 — 부분 완료

조건별 전체 보유 효과·T03 주자 보너스·T04 수비·T10 교체를 실제 경기1.1에 연결했다. M1의1.0 재개와 골든은 유지한다. 집중9/9·전체121/121, lint/타입/빌드/기존 골든/정적10종 통과. [M2-E 인계](M2-E-TRAITS.md). 해금 계산은 있으나 실제 FINAL 기여·관계/완봉/연속시즌 원장과 DB 연결은 후속이다.

## M2-D 스카우팅·드래프트 계산 — 부분 완료

67 평가 범위의 단조 축소·20경기 관측과 공개 투영,34 드래프트 전망/실제 추첨 공통식·미국 진로 표시 문턱을 구현했다. 집중8/8·전체112/112와 lint/타입/빌드/기존 골든/정적10종 통과. [M2-D 인계](M2-D-ASSESSMENT-DRAFT.md). 실제 오퍼·계약·API와 고교 일정 진행 hook은 아직 연결 전이다.

## M2-C 세계 생성·일정 — 부분 완료

승인한 고교9팀·225명·NPC 종합35~65/중심48을 생성하고 내 선수의 실제 슬롯을 대체한다. 고교/대학/KBO/MLB/마이너 일정의 경기 수·홈원정·동일일 중복·휴식을 검사한다. 집중10/10 및 전체104/104와 빌드/기존 골든/정적검증 통과. [M2-C 인계](M2-C-WORLD-SCHEDULE.md). 첫 경기와 고교 시즌 상태 전이는 아직 연결 전이다.

## M2-B 구종 학습·NPC 생성 기반 — 부분 완료

학습 예약/분기 지급/실전XP/중복 차단, 101 슬라이더, 구성 기회, AI/보관 book 변환, 독립 손·타석·폼 생성과 NPC 잠재력 정책을 구현했다. 활성4종에서 새 학습용 비활성화는 사용자 선택대로 PRE 구성 변경1회를 함께 쓴다. 처음 전체93/93 및 이후 추가 회귀를 포함한 집중11/11, 최종 엔진 빌드/HTTP smoke 통과. 아직 실제 세계/일정/화면 연결 전이다. [M2-B 인계](M2-B-REPERTOIRE-NPC.md).

## M2-A 선수 육성 기반 — 부분 완료

- 타자8/투수6 생성 배열·집중4개·NFC/12글자소·투타/투구폼/좌투 제한 검증. 주인공18세/잠재력 분포·치트P100·최고값 초기화.
- 성장 기간 중복 거절·난이도/소속 기간별 배율·집중80/20·1e-4 정수 재분배·상한 소멸·노쇠/최고값 보존.
- 시즌 강화1회 공유·1/3해금·정확 증가/피로 미리보기·확정/도전/컨디셔닝/포기. 치트의 도전 보장은 증가량3배가 아님.
- 구종XP 기본/실제 예산·잔여·상한손실·0지급 포함 evidence 중복 처리. 실제 pitch book/학습 계획/분기 정산과 세계시즌 저장 연결은 후속 작업.
- 기존67+신규16=**83/83 테스트 통과**, lint/소스·테스트 typecheck/rules·engine·API·web build/빌드 엔진 골든 해시/설계 정적10종/웹→API HTTP smoke 통과.
- `npm ci` 재설치 성공,132개 audit·취약점0(실행 당시). unicode-segmenter0.17.3 정확 버전 의존성1개 추가. esbuild allowScripts 경고는 기존과 같고 강제 우회하지 않음.
- 신규 테스트의 통제된 성장 fixture는P100으로 만들어 상한 없는 분배를 검사하며, 실제 일반/하드 생성 분포는 별도 테스트로 검증했다. 제품의 일반 잠재력을100으로 바꾼 것이 아님.
- M1 골든SHA256 유지: 경기 로직·난수 호출 순서 변경 없음. 새 게임 규칙/설계 선택 추가 없음.

증거: [전체 검사](evidence/M2-A-check.log) · [재설치](evidence/M2-A-install.log) · [HTTP smoke](evidence/M2-A-smoke.log). 연결 주의와 다음 작업은 [M2-A 인계](M2-A-DEVELOPMENT.md). **아직 UI에서 선수를 생성하거나 시즌을 플레이할 수 없으며, 실제 DB·계정 이어하기는 미구현**입니다.

## M1 완료 내용과 실제 증거

- `packages/engine` 추가. 시간·네트워크·Math.random·Node 전용 import 금지 린트 적용. 입력과 이전 상태를 변경하지 않습니다.
- PCG-XSH-RR64/32 공식42/54 벡터 일치. game/pitchPlan/pitchCount/baserunning/injury/growth/event/worldCreation 분리. 십진 문자열 상태와 draw 수를 JSON 보존합니다.
- 08/41의 유효 능력 순서와 logit/softmax, 48/119/123의 구종·타격 성향·폼·좌우 효과 및 trait±.06→total±.10 cap 구현. 상시 특성의 조건 충족 여부를 판단하는 M2 코드는 아직 없습니다.
- BB/HBP·기본 진루·추가 홈 진루·조건부 병살·3아웃·끝내기·9말 생략·12회 무승부·PS/국제10회 자동주자·20이닝 청크 구현. 명시적 경기 한도에서 결과를 조작하지 않습니다.
- 선발/불펜 교체·가용 투수 고갈·책임투수/자동주자 ER·W/L/SV/HLD/BS·PA/AB/HBP/WHIP 분모·타자/투수/팀 합계 검사 구현. 장부의 DB 원자 커밋·시즌 누적/명령 receipt는 M3입니다.
- PlayLog에는 타석 전 아웃/베이스/점수·실제 타석 방향·투수 손과 확정 결과를 저장해 향후 특성·좌우 기록의 근거로 사용합니다. 공개 DTO가 아니며 서버 seed/raw 상태를 API로 노출하지 않습니다.

| 실행 | 결과 |
|---|---|
| npm ci | lockfile 재설치 성공, audited131 / 취약점0 (실행 당시) |
| npm run check | 종료코드0: 린트·소스/테스트 타입·67/67 테스트·rules/engine/API/web 빌드·설계 정적10종 |
| 고정 대조군 | BP1~BP4의8결과 확률, X01~X07 효과 원합/적용합/확률 일치 |
| 추첨 실험 | 고정4조건×100,000 PA. 결과별 비율과 산식 차이 <.005. PA만의 표본이며 시즌 아님 |
| 유형 실험 | 타자8/투수6×100 고정시드 대전. 경기 종료·기록 보존. 생성 리그 전체의 균형 통과 선언 아님 |
| 기본100경기 | 97승부/3무승부, 홈 공격 생략35·끝내기10·세이브56 확인 |
| 재개 | 한 번 실행/1타석마다 JSON 저장·재개/별도 Node 프로세스의 빌드 산출물 해시 일치 |
| npm run smoke | 웹→실제API HTTP 응답 통과. 게임 진행 UI/DB 저장 증거 아님 |

고정 fixture SHA256: `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. [골든 파일](../../packages/engine/test/golden.json)은 초기 engine1의 내부 상태·입력·로그까지 포함한 회귀 기준입니다. 스키마 변경 시 무조건 새 해시로 덮어 통과시키지 말고 원인과 버전을 검토합니다.

전체 출력: [M1 검사](evidence/M1-check.log), [빌드 엔진 독립 실행](evidence/M1-compiled.log), [웹/API smoke](evidence/M1-smoke.log). 상세 [M1 인계](M1-ENGINE.md).

초기 검사 수정: 미사용 import1건, 순수 엔진의 표준 Web API(structuredClone/TextEncoder) 타입 라이브러리 누락을 수정했습니다. 로직 대조에서 수비 적합도0/능력1이면 D=.5가 가능하다는 경계도 반영했습니다. M0에서 잘못 적은 쓰리쿼터 enum `THREEQUARTER`를119/79의 `THREE_QUARTER`로 바로잡았습니다. 출시 세이브가 없어 운영 데이터 변환은 없습니다. 최종 대조에서 HLD를 최종 승리팀에만 주던 제한을08 원문에 따라 제거하고 패전팀/무승부 홀드 테스트를 추가했습니다. 최종 검사 실패0.

## M0 완료 내용과 실제 증거

| 확인 | 결과 |
|---|---|
| lockfile 재설치 `npm ci` | 성공, 129 packages audited / 취약점 0 (실행 당시) |
| `npm run check` | 종료코드 0: ESLint·TypeScript(소스/테스트)·단위 테스트·프로덕션 빌드·설계 검증10종 통과 |
| 단위 테스트 | 7/7 통과, 실패0. 35/90 정밀도·종류/집중 입력·원본 불변성과 API liveness/미구현 쓰기 거절 |
| `npm run build` (check 내부) | rules/API tsc 및 Vite 8.3.4 웹 빌드 성공 |
| `npm run smoke` | 종료코드0. 빌드 HTML+JS/CSS2개 HTTP200, 웹 프록시→실제 API→rulesVersion 1.0.0 |
| `npm run dev` | 실제 시작 성공, 웹5173/API3001. 웹과 프록시 응답200 확인 후 수동 종료; 잔여 리스너 없음 |
| GitHub Actions | workflow 추가, 원격 실행 결과는 아직 미확인 |

전체 출력: [M0 check](evidence/M0-check.log), [M0 HTTP smoke](evidence/M0-smoke.log), [M0 개발 서버 확인](evidence/M0-dev.md).

환경: Windows / Node24.19.0 / npm11.17.0 / TypeScript6.0.3 / React19.3.1 / Vite8.3.4 / Hono4.13.13 / Node adapter2.1.5 / ESLint10.13.0. TypeScript 최신7.x는 설치 시 파서 지원 범위(<6.1) 밖이라 6.0.3으로 고정했습니다. peer 강제 우회는 하지 않았습니다.

실패/제약: 최종 검사 실패0. npm 설치 시 esbuild postinstall이 allowScripts 미등록이라는 경고가 있었으며 강제 허용하지 않았습니다. 해당 설치 상태에서 tsx·타입·빌드·HTTP 검사를 모두 통과했습니다. 원본 한국어 폰트 약11.4MB는 유지했고 서브셋/전송 최적화는 M4/M5에서 다룹니다. 브라우저 픽셀·접근성·기기 이어하기·DB/인증/스토리지/APK는 미검증입니다.

게이트 해석: M0의 빌드 기준은 실증됐지만 DB/Android 등 전체 패키지 조합은 미검증이므로 V01 전체를 일괄 통과로 올리지 않습니다. docs/design의 인계 준비표·게이트·NOT_EXECUTED는 구현 전 스냅샷으로 보존합니다. 현재 실행 증거는 이 문서를 우선하고, 이후 해당 마일스톤의 실증 범위만 갱신합니다.

## 사용량과 안전한 중단

현재 지시: 잔여5%에서 진행/인계 MD 갱신·검증분 커밋·푸시. 2026-10-22 10:15 KST 조회는 단기87% 사용(잔여13%)·주간60% 사용이며5% 도달이라고 보고하지 않는다. 완료분은 먼저 저장한다. PC 종료/리셋 크레딧 요청은 없다. 아래 M0~M2-I의1% 지시/수치는 당시 이력이다.

사용자 요청: 남은 사용량이 1%이면 문서를 최신화하고 진행분까지 커밋합니다. 계정 사용량을 확인 가능한 시점마다 조회하되 1% 직전의 정확한 감지는 보장할 수 없으므로 마일스톤마다 선제 기록·커밋합니다. 시작 시5시간73%/주간33%, M0 중68%/32%, M1 중54%/30%, M1 마감43%/28%, M2-A 마감32%/27% 잔여를 확인했습니다. 아직1%에 도달하지 않았습니다. 후속 조회에서 계정 창이 새로 시작되어5시간99%/주간100% 잔여를 확인했습니다. M2-B/C/D도 선제 저장 후 다음 작업으로 이어갑니다. M2-D 중5시간85%/주간98%, M2-G 중65%/94%, M2-I 중47%/92% 잔여 확인. 토큰/DB URL/키는 기록하지 않습니다.

## 경로·Git 방식

현재 공유 복사본은 `V:\`(동일 UNC 공유 폴더)이며 `V:\.git`은 사용하지 않습니다. 정상 체크아웃은 `C:\Users\N-052\.codex\visualizations\2026\10\16\01a142f8-66ea-7782-ba3e-b52df94ae1be\baseball-career-repo`입니다. 2026-10-22 최신 지시대로 정상 체크아웃에서 수정·검증·커밋·푸시하고 검증된 변경을 V:에 동기화합니다. node_modules/dist/비밀값은 복사·커밋하지 않습니다. 다른 PC는 이 특수 경로를 만들 필요 없이 정상 로컬 clone에서 작업합니다.

## 2026-10-27 DK 최종 검증

전체 npm run check 종료0: 총695개 중693통과·실패0·Neon환경 부재2개 건너뜀, 웹20/20. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. 엔진/API duration_ms562628.2466, 동결406파일 변경0. 실제 브라우저/Neon/실기기 검증은 아니다. 사용자 최신 지시대로 PC를 종료하지 않고 M2 잔여 구현을 계속한다. 미국 메이저 재계약/FA·옵션소진, 해외복무·국제·장기저장·24경로는 미완료다.
