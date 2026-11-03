# M2 사건 선택 연결 — 2026-11-03

## 최신 기준

origin/codex/m2-career-engine의 b6165a2까지 fast-forward했다. 이전 미국 복귀 변경은 전체 1012개 중 1010 통과·환경 2개 제외, 웹 24/24와 smoke가 이미 검증됐으므로 같은 검사를 먼저 반복하지 않는다. 기존 큰 runtime JSON 두 개와 zz-dbg.log는 보존한다.

## 이번 구현 묶음

1. E33: 봉인 시점 나이 33세 이상과 실제 백업 역할을 함께 검사한다. 새 창만 정책을 봉인하고 기존 창·서명 영수증은 이전 해석을 유지한다. 가격·역할·추첨은 바꾸지 않는다.
2. 아마추어 E36: 완료된 고교/대학/독립 진로 또는 실제 E74 미계약 복학 검토에서 명시 은퇴 요청·취소·확정을 추가한다. 진행 중 경기·학기·복무·프로 계약에서는 거절한다. 미해결 병역과 원본 기록을 보존하며, 취소는 원래 선택으로 돌아간다. E35의 평생 3회 소진 판정은 그대로다.
3. E71/E73: 기존 대학 집중 writer와 유효 미국 제안의 탐색/서명 owner를 연결한다. 열람만으로 학적·조기 드래프트 기회를 소비하지 않는다.
4. E85: 프로 root의 일반 특성 모아 읽기와 실제 ACK cursor를 추가한다. 숨은 특성·NPC는 공개하지 않으며 경기·계약·연말 봉인을 바꾸지 않는다.

변경은 독립 영역으로 분담하고 최종 연결/검토/전체 검사는 부모가 수행한다. index.ts와 HighSchoolCareer의 공용 필드는 부모가 관리한다. 집중 RED/GREEN 후 변경을 모아 전체 check 1회만 실행한다. 전체 검사 동시 파일 2개와 낮은 우선순위를 유지한다.

## 판정과 남은 범위

설계 13/19/23/26/43/66과 최신 사건 감사를 따른다. 새 확률·연봉·성장·병역 정책을 만들지 않는다. 전체 M2 또는 24경로 완료를 주장하지 않는다. 미국 귀국 미지명 후 선택 준비 root는 기존 별도 계획의 후속이다.

## 진행

- E33: RED 재현, 신규 경계 3/3와 FA 전체 9/9, lint 통과. 부모 통합 검토 대기.
- E71/E73: 실제 대학 PRE 집중 writer와 고정 미국 제안 비교/조기 KBO 비교/미국 서명 연결. 집중 2/2 통과. 단순 탐색은 열린 E73과 학적·시도를 유지한다.
- E85: KBO/US 일반 특성 allowlist와 ACK cursor, 준비 시즌 mirror와 미국 연말 봉인 보존. 집중 5/5, lint 통과.
- E36/E74: 명시 은퇴 요청·취소·확정·E37 보관 이동, 미해결 병역·기록 보존. 엔진 3건과 실제 저장 HTTP 1건, 합계 4/4 통과. REQUEST_RETIRE 탐색을 은퇴 완료로 세지 않는다. 고교·대학 이전 시즌은 제어 접두이며 모든 학기를 native로 증명한 검사는 아니다.
- 최종 읽기 검토에서 Critical/Important 결함 없음. 엔진 build/lint 통과. 테스트 타입의 readonly 변경/optional 설정 두 곳을 정리한 뒤 전체 검사 1회로 통합 검증한다.

## 호출 및 원장 소유권

- `amateur-retirement.ts`: 완료 진로 또는 실제 E74 검증 후 E36를 만든다. 취소는 저장된 phase와 원래 열린 진로 사건으로 돌아간다. 확정은 E36 DOMAIN 영수증과 원래 열린 사건 취소·ARCHIVED·E37를 함께 반환한다. `openAmateurArchive`는 확정 후의 읽기 이동만 소유한다. 원본 world/records와 재도전 예산은 보존한다.
- API: 기존 저장 명령 파이프라인의 `CAREER_RETRY_AMATEUR_REQUEST_RETIRE`, `...RESOLVE_RETIRE`, `...OPEN_ARCHIVE` 및 `AMATEUR_RETIREMENT` 읽기 화면을 사용한다. HTTP 입력은 revision·event key/version·결정만 전달하고 자격·능력치·원장을 전달하지 않는다. E35 소진 명령은 별도로 유지한다.
- `snapshot.roleEventPolicy`가 새 FA 창의 E33 해석을 봉인한다. 없는 구 창의 E33/계약 영수증을 소급 무효화하지 않는다.
- E71 선택 영수증은 `routeNotices.collegeFocusChoices`에 남는다. E73 quote는 실제 기존 US recruitment 소유이며 학년을 계속하면 과거 비교로 보관한다.
- E85의 `summaryCursor`와 root revision만 ACK가 바꾼다. 숨은 특성/NPC/내부 추가 필드는 공개하지 않는다.

## 통합 검사

소스 495파일을 SHA256으로 고정하고 `npm run check` 1회를 실행 중이다. 로그는 `evidence/M2-20261103-event-check.log`, 종료 코드는 `.exitcode.txt`다. 엔진 build/lint 및 테스트 타입 검사는 통과했다. 실제 종료 결과 전에는 새 전체 통과로 표시하지 않는다.

### E73 통합 회귀 수정

전체 검사에서 `open E73 owns fixed US comparison` 1건이 `Unsupported canonical value`로 실패했다. 같은 테스트를 단독 재현한 로그는 `evidence/M2-20261103-college-integration-failure.log`다. E73 국내 비교 전환에서 원래 없던 `earlyDraftAttempted`를 명시적인 undefined로 복원해 canonicalJson이 거절한 것이 원인이다. 비교 전 원본과 같은 필드 존재 여부를 복원했고, quote/선수/학적의 다른 변경 거절은 유지한다.

수정 후 대학 선택 테스트 2/2 통과(`evidence/M2-20261103-college-correction-test.log`, 종료0). 전체 검사를 새로 시작하지 않았으며 최초 실패와 수정 후 집중 검증을 별도로 보존한다. 최초 495파일 동결은 수정 이전 소스다. 검사 진행 중 수정한 단일 파일의 시간·전후 SHA256은 `evidence/M2-20261103-college-correction.json`에 기록했다. 전체 실행 결과와 수정 이후 잔여 검사 결과를 합쳐 보고하되 최초 `npm run check`를 통과로 표시하지 않는다.

수정 후 잔여 검사 묶음은 종료0이다. 변경 파일 lint, 웹24/24, 전체 build, engine/event/design10종/Android shell/assets 정적 검증, 웹·API HTTP smoke를 실행했다(`evidence/M2-20261103-corrected-tail-check.log`). 이 smoke는 인증·DB·저장소·APK·브라우저 렌더 실기기 검증은 아니다. 최초 소스495개와 비교하면 E73 수정 파일1개만 다르고 나머지494개는 동일하다(`evidence/M2-20261103-source-after-correction.json`). 엔진/API 전체 테스트 프로세스는 계속 실행 중이므로 최종 집계는 아직 확정하지 않는다.

E73 수정 후 별도 읽기 검토에서도 Critical/Important 결함을 발견하지 못했다. 원본 필드 존재 여부만 복원하며 다른 학적·모집 근거 변경 거절을 유지한다. 검토자는 파일·테스트·Git을 변경하지 않았다.

검증 경계: 이번 새 HTTP 저장 배선은 E36/E37 아마추어 은퇴 명령이다. E71/E73 선택과 E85 프로 요약은 엔진 export/도메인 회귀를 검증했으며, 이 새 명령의 웹 버튼·API 호출·실기기 실행 증거를 추가한 것은 아니다. 기존 API/UI 전체 완료율의 증거로 합산하지 않는다. 후속 연결 점검에서 이 구분을 유지한다.

## 최종 검증 — 2026-11-03

- 전체 `npm run check` 최초1회는 종료1. lint/typecheck를 통과하고 엔진/API **1025개 중1022 통과·1실패·환경2개 제외**, 실행시간4227615ms를 기록했다. 실패는 위에서 재현·수정한 E73 비교→조기 KBO 전환1건뿐이다. 원래 실패 로그/종료코드는 보존한다.
- 수정 후 대학 선택 전체 **2/2·실패0·종료0**. 웹 **24/24**, 전체 build, engine/events/design10종/Android shell/assets 및 HTTP smoke도 종료0이다. 전체 장시간 검사를 다시 돌리지 않고 실패 범위와 잔여 단계를 별도로 확인했다. 단일 `npm run check`가 최종 소스에서 종료0이었다고 주장하지 않는다.
- 최초 동결495파일 중 수정한 `career-us.ts`1개 외494개는 최종 시점에도 동일하다. 시간·전후 해시·각 검사 결과는 `source-after-correction.json`에 남겼다. 동결 이후 새 기능을 끼워 넣지 않았다.
- 미국 의무 복귀2 native시즌, 보관 원본 유지, 복귀 후 재서명 및 실제 복무 NPC경기 회귀도 최초 전체 실행에서 통과했다. 각 테스트의 제어 접두·실제 경기 경계는 원래 로그의 라벨을 따른다.
- 느린 실행 참고용 작업 프로세스1시점 CPU/working set을 `M2-20261103-check-resource-snapshot.json`에 기록했다. 최대치·누수 분석·성능 벤치마크로 해석하지 않는다.
- 최종 소스/검토/선택된 증거만 커밋한다. 기존 큰 runtime JSON2개와 zz-dbg.log는 보존·미포함한다. 현재 커밋은 `git log -1`, 원격은 `origin/codex/m2-career-engine`으로 확인한다.

## 이어서 할 일

1. `docs/superpowers/plans/2026-11-02-us-return-retry.md`에 따른 귀국 미지명 후 선택 준비 root. 진짜 미지명·병역·미국 옵션/새 제안 원장, 최신 선수/연도,48경기1회 차감, KBO/US 실제 계약 후 경기 및 E35 세 출구까지 증명이 필요하다. 이 묶음에서는 구현하지 않았다.
2. E71/E73/E85 새 엔진 명령의 API·웹 실제 호출 점검. 이번 새 HTTP 회귀는 E36/E37만 포함한다.
3. 99사건/24경로/PF의 실제 미완료 증거 연결. 기존 제어 fixture 또는 부분 경로 해시를 전체 native 경로로 승격하지 않는다. M2 전체 완료는 아니다.

최종 V 대조에서14·58·102가 Git HEAD보다 오래된 문서임을 확인했다. 국제대회65/55/45 결정과 M2-DN 복무 중 목표 안내가 V에 빠져 있었으며, 세 파일은 체크아웃의 HEAD 원문과 동일했다. V 원본을 저장소 밖에 백업하고 기존 Git 내용을 Copy-Item으로 동기화했다. 새 게임 규칙을 추가한 것이 아니다. V 설계359파일도 최종 MANIFEST와 대조한다.
