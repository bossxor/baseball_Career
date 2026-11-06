# 웹 고교 생성·진로/KBO 입단 흐름·재도전 화면 — 2026-11-06

## 구현
- **고교 생성 폼(S02)**: 기존 단계 뒤에 `학교·난이도` 단계 추가. 학교 9곳, 난이도 성장형/현실형(숨김 난이도 미노출), 투수는 보조 구종(포심 제외 6종). 시즌 연도는 세계 기본 2027 고정. HTTP 어댑터 `create`는 `CAREER_SCHOOL_CREATE`를 보낸다(웹은 seed/worldKey/잠재력을 보내지 않음). 명령 ID `<creationId>:school`을 `sentCommands`에 유지하므로 응답 유실 재시도 시 원 payload 전체를 재전송한다(COMMAND_ID_REUSED 수정 보존). 픽스처 API는 school 필드를 무시.
- **서버 제공 흐름 화면**: `GET /screens/CAREER_FLOW`(apps/api/src/career-flow-screen.ts)가 {title, lines, commands[{id,label,type,payload,confirm?}], notice}를 준다. 웹 `#/flow/<saveId>`(screens/Flow.tsx)는 명령을 그대로 재전송만 한다(클라이언트가 명령을 만들지 않음). `confirm`이 있는 명령(은퇴·지명 거절 등)은 두 번째 명시 탭이 필요한 인라인 확인 카드. 커리어 홈은 `open:FLOW` 행동으로 연결.
- **고교 흐름**: 시즌 결산 → 졸업 진로 열기 → KBO 지명 준비/결과/서명·거절 → 시즌 마감 → KBO 입단. 새 API 명령은 얇은 디스패치 2개만 추가: `CAREER_SCHOOL_ACK_SEASON_REVIEW`, `CAREER_SCHOOL_OPEN_ROUTE`(엔진 `acknowledgeHighSchoolSeasonReview`/`openHighSchoolCareerRoute` 그대로, 기존 CAS·receipt 경로). 그 외 KBO 입단 명령은 기존 `CAREER_KBO_ENTRY_*`. 대학/미국 진로·은퇴는 해당 안내 문구만(명령 없음).
- **재도전 셸(KBO)**: 무소속 안내(OPEN/REVIEW) → 진로(준비 시즌/입단 제안/은퇴) → 준비 시즌(시작·1경기·한 달·정산) → 은퇴 확인(E36)·보관. 아마추어 E35 은퇴 확인/보관 화면도 같은 흐름. KBO 커리어 홈(`kboCareerHome`)은 프로 시즌이 웹 미지원임을 명시.
- 공개 필드만: 드래프트 `score`/`baseScore`/seed/rng/potential은 응답과 payload에 넣지 않는다(테스트가 검사).

## 검증
- 웹: 신규 `native-school-flow-http.test.ts`(실제 PGlite+createApp+createHttpApi): 학교 목록=엔진 목록, 타자/투수 폼 요청 → 생성 응답 유실 재시도 동일 명령, 첫 3단계까지; 고교 결산→KBO 입단 전체(후속 GET 유실 재시도·원 payload 재전송); 재도전 준비 시작/은퇴 확인. `flow-screens.test.tsx` 마크업 3건.
- API: `m2-school-flow.test.ts`(위조/stale/조기 OPEN_ROUTE 거절, 같은 commandId receipt, 공개 필드).
- 최종 집계·exit code는 evidence/M2-20261106-web-final.log/.exitcode.txt.

## 한계/미검증
- 브라우저(모바일 폭)로 생성 폼 학교·난이도·확인 단계만 확인. Flow 화면은 서버 연결 미리보기 없이 마크업 테스트만(확인 카드 시각 점검 미실시). 실기기 미검증.
- 재도전 `CAREER_RETRY_TRAIN`(훈련 선택)은 노출하지 않음 — 정산 시 남은 훈련은 서버 규칙상 포기 확인 명령으로만 제공. 훈련 선택 UX는 규칙(능력 선택 목록 공개 방식) 결정 필요.
- 재도전 입단 제안 수락(`CAREER_RETRY_ACCEPT`)은 제안이 있는 경우의 명령 생성만 구현, 실제 제안 보유 시나리오 테스트 없음.
- 대학/미국 진로 선택, 프로 시즌 진행, 미국 복귀 재도전(`CAREER_RETRY_US_RETURN_*`) 화면은 미연결.
- KBO 재도전 `CAREER_RETRY_OPEN` 가능 여부는 엔진 호출로 판정(읽기 시 clone 비용). KBO E36은 엔진에 취소 명령이 없어 확정만 제공.
- 전체 npm run check 미실행. M2 완료로 세지 않는다.

## 2026-11-06 추가: 시즌 진행(play 루프) — 대학 · 미국 · KBO
- 공통 envelope는 기존 `CAREER_FLOW`(title/lines/commands/notice) 하나. 웹은 변경 없이 서버가 내려준 명령만 재전송한다.
- 대학: `career-college-shell.ts`(`CAREER_COLLEGE_*`) — 진학·입학·시즌·훈련 창·컵·결산·학년 마감. 테스트 `native-college-flow-http.test.ts`.
- 미국: `career-us-flow.ts`(기존 `CAREER_US_PLAY_*` 재사용) — 준비·진행·창/레벨/특성 이벤트·포스트시즌·다음 시즌. 테스트 `native-us-flow-http.test.ts`.
- KBO 프로: `career-kbo-play-shell.ts`(`CAREER_KBO_PLAY_*`) — 준비·진행·훈련 창·포스트시즌·성장 정산·시즌 마감. 테스트 `native-kbo-play-http.test.ts`. 재도전 셸은 폴백으로 유지.
- 권장안으로 정한 규칙: E41 스타일 변경 미제공(확인만), CHALLENGE 훈련 미제공, 대학 시작 시 포커스/아키타입 변경 생략.
- 미연결: 대학 2학년 조기 드래프트/미국 선택·4학년 졸업, 미국 마이너 시장/메이저 FA·병역, KBO 계약 결정(FA/갱신)·병역·은퇴, 프로 경기 상세 보기. 실기기·브라우저 화면 미확인.
