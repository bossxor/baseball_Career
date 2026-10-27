# M2-DY — DX 대진 ↔ 커리어 시간축 연결 (1차)

2026-10-27. 기준 `acea915`(DX). 순수 `national-bracket-1` reducer에 실제 커리어 선발·기록·구종 XP를 묶는 1차 어댑터다. M2 전체 완료가 아니다.

## 구현

- `p12ActualWindow` / `nationalCalendarWindow`: P12는 `max(명목 11/15, 양 리그 PS 종료일+1)`·14일. `calendar-1`은 그대로 두고 대진 `window`에만 봉인한다. `P12_POSTSEASON` evidence=`["p12-window-1", year, kboEnd, usEnd]`.
- `NationalBracket.window`: 조별·녹아웃 날짜가 같은 startDay를 쓴다. 기존 CALENDAR 대진은 명목 슬롯과 동일.
- `national-progress.ts`: `startNationalTournament` → `prepareCareerNationalMatch` → `advanceCareerNationalMatch`.
  - 한국은 DW 봉인 28명 `koreaNationalTeam`(손/폼/구종/특성/기용).
  - 상대국은 승인 프리셋 65/55/45 통제 스냅샷.
  - 단일 `pendingGame`, FINAL에서 기록 `putGameContribution` + 동일 시즌 구종 XP(원소속/상무 book만 커밋, NPC ephemeral 폐기).
  - 대회 완료 시 `sealNationalCompetitionResult`(등록/출장 근거).
- 레거시 `playAsianGamesTournament` batch는 유지(기존 DU/DW 증거). 새 경로는 DX reducer를 재사용한다.

## 검증

집중: `national-progress` 3 + 기존 national/bracket/selection/kbo-national 합쳐 24/24.  
전체 npm run check 종료0: 엔진/API 765개 중763통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1044505(테스트 duration_ms 921438.0949). 검증 동안 실행 소스 미편집. 실제 Neon/브라우저/APK 검증은 아니다. 증거 `evidence/M2-DY-check.log`.

구분:

| 증거 | 내용 |
| --- | --- |
| 실제 커리어 AG | `enteredKboCareer`→선발28→수락→DX bracket 전경기→봉인. 한국 타석 키가 `KOR-h*`가 아닌 선발 playerKey |
| P12 window | 명목 보존·늦은 PS 연기·bracket 날짜 이동. 양 리그 실제 PS worker 종료일을 자동 수집해 여는 E2E는 후속 |
| DX 107 | 통제55 fixture(변경 없음). 커리어 28 증거가 아님 |

## 아직 아님

- `INTERNATIONAL_PROGRESS` phase·정규/PS day closer와의 날짜 감사 확장
- 날짜당 피로/부상/휴식 1회 마감, 초청 7일 전 기한, 부상 교체 worker
- WBC/OLY/P12 커리어 E2E, 미국 공통 후보 풀(국적 필드 추정 금지)
- 해외 병역 실제 18개월, 99사건 잔여, 24경로 해시, PF-D 잔여
- M6

## 소유권

| 원장 | 변경 지점 | 중복 방지 |
| --- | --- | --- |
| `national.brackets` | start/prepare/advance | competitionId 1회 |
| `records.games` | FINAL contribution | gameKey |
| `world.repertoires` / sangmu | FINAL pitchDevelopment | 등록된 playerKey만 |
| `national.competitions` | seal | competitionId |
