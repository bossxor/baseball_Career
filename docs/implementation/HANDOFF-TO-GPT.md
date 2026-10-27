# 최신 인계 — M2-ED 국제 부상 잔여 소모 (2026-10-27)

[ED 상세](M2-ED-NATIONAL-INJURY-TICK.md). 브랜치 `codex/m2-career-engine`. 기능 팁 **`d9a48b6`**(EC `5b51579` 위).  
`closeCareerNationalDay`가 한국 FINAL마다 `settleTeamGameHealth`(teamKey=`{tournament}:KOR`)로 remainingTeamGames 차감. KBO closer 미호출.  
전체 check 767/765·Neon2·웹22/22. duration_ms 745981. 증거 `evidence/M2-ED-check.log`.  
미연결: 정규 일마감 감사 확장·INTERNATIONAL phase·부상 교체 worker·미국 풀·99잔여(~대부분 NOT_AUDITED)·24경로/PF-D. M6·PC종료 금지. V: 문서만 Copy-Item.

## 호출 흐름 (국제)

`openKboNationalSelection`→응답→`startNationalTournament`→(`prepare`/`advance`)*→날짜마다 `closeCareerNationalDay`→완료 시 seal.  
초청 미응답(INVITED)이면 start 거절(자동 사양 없음).

## 원장

| 원장 | 변경 | 중복 키 |
| --- | --- | --- |
| `national.invitations` | 7/2/1 기한 봉인 | selectionId |
| `national.brackets.fatigueSettledDays` | 날짜 1회 | competitionId+day |
| `health.games` | 한국 FINAL마다 | gameKey+`{T}:KOR` |
| `records`/`repertoires` | FINAL만 | gameKey / 등록 playerKey |

## fixture vs 실제

- AG 커리어 28·DX 전경기·날짜 피로/health: 집중 테스트.
- DX 107 통제55: 커리어 증거 아님.
- 정규 day closer에 WBC/P12 날짜 넣지 말 것.

## GPT 집중 검수

동기화: fatigueSettledDays↔health chronologic; INVITED 블록; P12 window 재봉인. 메모리: pending만. 경계: 한국 없는 날 부상 미차감·탈락 후 국내 재개.

# 최신 인계 — M2-EC 국제 초청 기한·날짜 피로 (2026-10-27)

[EC 상세](M2-EC-NATIONAL-DAY-CLOSE.md). 기능 팁 **`5b51579`**. 초청 7/2/1·피로 1회. 전체 check 767/765·duration_ms 1103862.

# 최신 인계 — M2-EB 포스팅 E62·E64 도메인 재개 (2026-10-27)

[EB 상세](M2-EB-POSTING-EVENT-RESUME.md). 기능 팁 **`c5cf395`**. E62–E64 재개. 전체 check 766/764·duration_ms 1011454.

# 최신 인계 — M2-EA 포스팅 E63/E64 큐 (2026-10-27)

[EA 상세](M2-EA-POSTING-EVENTS.md). 기능 팁 **`046f39e`**. E63/E64 큐. 전체 check 765/763·duration_ms 624903. E62·ACCEPT/REMAIN은 EB.

# 최신 인계 — M2-DZ 해외 18개월 병역 달력 (2026-10-27)

[DZ 상세](M2-DZ-US-MILITARY-18MO.md). 브랜치 `codex/m2-career-engine`. 기능 팁 **`3de576a`**(DY `198eede` 위).  
`chooseUsMilitaryPlan`→`service` 2블록 봉인→시즌별 `settleUsMilitaryServiceBlock`→둘 다 끝난 뒤에만 `completeUsMilitaryService`. 즉시 COMPLETED 불가.  
전체 check 765/763·Neon2·웹22/22·스모크 duration_ms 710245. fixture 시즌 identity 이동≠native 2시즌 E2E.  
다음: 국제 일마감/초청기한, 99도메인, 24경로/PF-D. M6 병합·PC종료 금지. V: 문서만 Copy-Item.

# 최신 인계 — M2-DY 국제 시간축 1차 연결 검증 완료 (2026-10-27)

[DY 상세](M2-DY-INTERNATIONAL-TIMELINE.md). 브랜치 `codex/m2-career-engine`. 기능 팁 **`198eede`** (원격 푸시됨). 전체 npm run check 종료0: 엔진/API 765개 중763통과·실패0·Neon2건너뜀, 웹22/22. duration_ms 1044505. HTTP 스모크 통과. 검증 중 실행 소스 미편집. 실제 Neon/브라우저/APK 아님.

## 이번 구현 호출 흐름

`openKboNationalSelection` → 수락 → `startNationalTournament` → (`prepareCareerNationalMatch`/`advanceCareerNationalMatch`)* → FINAL마다 records+구종XP → 완료 시 `sealNationalCompetitionResult`.  
한국 팀: `koreaNationalTeam`(DW 28). 상대: `nationalControlTeam`(65/55/45).  
P12: `p12ActualWindow({kboPostseasonEndDay,usPostseasonEndDay})`를 create/start에 넘기면 bracket.window에 봉인. calendar-1 불변.

## 원장

| 원장 | 소유/변경 | 중복 키 |
| --- | --- | --- |
| `national.brackets` | national-progress | competitionId |
| `records.games` | FINAL contribution | gameKey |
| repertoires | FINAL pitchDevelopment | 등록 playerKey만 |
| `national.competitions` | seal | competitionId |

저장/재개: pendingGame JSON 동등. 구버전 brackets 없음 → optional 필드. 레거시 `playAsianGamesTournament` 유지.

## fixture vs 실제

- 실제 커리어 AG: enteredKboCareer+선발28+DX 전경기 봉인(집중).
- P12 window: helper+bracket 날짜(양 리그 PS worker 자동 수집 E2E는 후속).
- DX 107: 통제55, 커리어 증거 아님.

## 미연결·위험

INTERNATIONAL phase/일마감·초청기한·부상/피로 날짜마감, WBC/OLY/P12 커리어 E2E, 미국 공통풀(국적 추정 금지), DS 18개월 경과, 99/24/PF-D. KBO day closer에 WBC/P12 날짜를 넣지 말 것. M6 병합 금지. PC 종료 금지. V: 문서만 Copy-Item.

## GPT 집중 검수

동기화: bracket.window ↔ groupMatches.day; FINAL XP와 records 원자성; revision stale; P12_POSTSEASON evidence 재생성. 메모리: 완료 GameState를 brackets에 쌓지 않음(pending만). 경계: 미선발/사양 후에도 세계 대회 완료 가능 여부·E48 남발.

# 최신 인계 — M2-DX 순수 국제 대진 reducer 검증 완료 (2026-10-27)

[DX 상세](M2-DX-INTERNATIONAL-BRACKET.md). 순수 reducer. 커리어 1차 연결은 DY. PC 종료 금지.

# 최신 인계 — M2-DW 검증 완료 (2026-10-27)

[DW 상세](M2-DW-NATIONAL-SELECTION.md). 전체 npm run check 종료0: 엔진/API 757개 중755통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1168717.4243, 원본441파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. 집중25/25. 실제28명 점수/표본/봉인·E44/E45·한자리 충원·AG 실제기용과 E65 첫 MLB PA/BF를 연결했다. 사용자 결정: 당해 충분표본 최고리그, 없으면전년, WBC전년만. 국대 달력/worker/부상/피로/XP·WBC/OLY/P12·미국공통풀·99도메인·24경로·PF 잔여다. DS는 FREEZE/TERMINATE 플래그와 즉시완료 helper만 있고 실제18개월 해외복무 연결은 미완료임을 추가 점검했다. 완료선언 금지. M6 수정/PC 종료 금지. V: 문서만 Copy-Item.

# 최신 인계 — M2-DV 검증 완료 (2026-10-27)

[DV](M2-DV-NATIONAL-INTEGRITY.md). 전체 npm run check 종료0: 엔진/API 741개 중739통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 804191.6272, 원본434파일 변경0. 실제 Neon/브라우저/APK 검증은 아니다. 집중16/16. E44/E46/E47/E48/E55와 기록/병역 중복 정산을 보강했다. 다음은28명 선발/E45·국제 달력/중단 worker·부상/XP·WBC/OLY/P12,99 실제 도메인·24경로·PF-D08~15다. 원문119의 검수는15개이며119개가 아니다.24경로의구단P17~21/M6·혼합P24·실기기P22는별도증거가필요하다. M2 전체 완료 아님. 아래 DU 프롬프트는 이전 이력이다. PC 종료 금지.

# GPT 인계 — M2 이어서 (2026-10-27, DU까지 푸시)

M2 **완료 아님**. 사용자 지시: 여기까지 끊고 GPT가 이어서 완성.

## 0. 체크아웃

```
C:\Users\N-052\.codex\visualizations\2026\10\16\01a142f8-66ea-7782-ba3e-b52df94ae1be\baseball-career-m2
```

- 브랜치: `codex/m2-career-engine`
- 원격 푸시 팁(검증 기준): **`b2a2234`** (DU). DT=`86f068b`, 인계문서=`803a898`.
- `git fetch && git rev-parse HEAD origin/codex/m2-career-engine` 로 확인.
- 강제 푸시 금지. `V:\.git` 건드리지 말 것(문서만 Copy-Item 동기화).
- PC 종료 금지(사용자 지시 이력).

## 1. 푸시된 완료 묶음 (DO→DU)

| 묶음 | 커밋 | 요지 | 증거 |
|---|---|---|---|
| DO | `26f3557` | 원소속 MLB FA·옵션 STAY/FA | `evidence/M2-DO-check.log` |
| DP | `f25baf2` | KBO 포스팅 7시즌·구단 보상금·복귀권 | `evidence/M2-DP-check.log` |
| DQ | `443481a` | 해외 FA 9시즌·귀국 협상 | `evidence/M2-DQ-check.log` |
| DR | `9538f18` | `activateKboUsCareer` KBO_TRANSFER | `evidence/M2-DR-check.log` |
| DS | `1b0458e` | 미국 28세 FREEZE/TERMINATE·완료 | `evidence/M2-DS-check.log` |
| DT | **`86f068b`** | 국대 초청/결과 봉인·ATHLETE_ELIGIBLE·체육요원 3시즌 | `evidence/M2-DT-check.log` |
| DU | **`b2a2234`** | AG 8개국 실제 INTERNATIONAL 대진·경기·봉인 | `evidence/M2-DU-check.log` |

DT check: 735/733 · DU check: 736/734 · 실패0 · Neon2 · 웹22/22 · 골든 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`.

문서: `M2-DO`…`M2-DU-*.md`, `PROGRESS.md`, `NEXT-SESSION.md`, `docs/design/STATUS.md`.

## 2. 워킹트리

`git status` 깨끗해야 함. 더러운 파일이 있으면 조사 후 처리.

## 3. 남은 M2 (우선순위)

1. **E44–E48·E55** — 국대/체육요원 사건을 `kbo-national`·`national-tournament`에 배선 (`kbo-military-planning`/`kbo-callup` 패턴). WBC/OLY/P12·28명 선발 AI 확장.
2. **99사건 잔여** — 카탈로그 99 대비 도메인 완결 ~22, 알림 ~5–6, **미연결 ~71**. 특히 E44–48·E55·E63·부상·해외 밴드.
3. **24경로** — `docs/design/end-to-end-design-paths.json` 전부 `NOT_IMPLEMENTED`. 실행 해시 하네스 없음.
4. **PF-D** — `probabilities.test.ts`에 D01–07만. D08–119·통합 게이트 없음.
5. API/화면·Neon/브라우저/APK는 M2 엔진 범위 밖이거나 후속. 게임 규칙/연봉/시드/저장 임의 변경 금지. 빈 수치는 사용자에게 물을 것.

감사 요약 출처: 탐색 에이전트(2026-10-27). M2 영역 추정 **약 50%** 유지 중(STATUS).

## 4. 제약 (유지)

- 실제 git checkout만. `V:\`는 문서 protect-sync(Copy-Item), `.git` 금지.
- 묶음마다 집중 테스트 → 묶음 끝 `npm run check` 1회 → STATUS/PROGRESS/NEXT/evidence → 커밋·푸시.
- 강제 푸시·훅 스킵·비밀키 커밋 금지.
- fixture ≠ 실시즌. 완료 선언은 증거 후에만.

## 5. 붙여넣기 프롬프트

```
너는 야구 커리어 시뮬레이션 '다시, 플레이볼' M2를 이어서 완성한다. 한국어·YAGNI. PC 종료 금지.

체크아웃:
C:\Users\N-052\.codex\visualizations\2026\10\16\01a142f8-66ea-7782-ba3e-b52df94ae1be\baseball-career-m2
브랜치: codex/m2-career-engine
먼저: git fetch && git status && git log -5 --oneline
인계: docs/implementation/HANDOFF-TO-GPT.md · NEXT-SESSION.md · PROGRESS.md · docs/design/STATUS.md

푸시 팁: be5b2da (인계 해시 고정). 기능 팁 DU b2a2234 / DT 86f068b.
이미 됨: DO→DP→DQ→DR→DS→DT→DU(AG 8개국 실제 INTERNATIONAL 경기·봉인).

남은 순서:
1) E44–E48·E55를 kbo-national/national-tournament에 사건 배선
2) 99사건 미연결 ~71 도메인 연결(정의/ACK만으로 완료 주장 금지)
3) 24경로 실행 해시(end-to-end-design-paths.json 전부 NOT_IMPLEMENTED)
4) PF-D D08~119(지금은 D01–07만)
5) STATUS/PROGRESS/NEXT/evidence · V: Copy-Item만(V:\.git 금지) · 커밋·푸시(강제푸시·훅스킵·비밀키 금지)

제약: 규칙/연봉/서비스/옵션/시드/저장 임의변경 금지. 빈 수치는 사용자에게. fixture≠실시즌. 묶음마다 집중테스트 → 끝낼 때 npm run check 1회. M2 완료는 증거 후. M6는 이 브랜치에서 하지 말 것.

시작: HANDOFF 읽고 status 깨끗 확인 후 E44부터 구현.
```
