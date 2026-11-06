# M2 미국 E96 같은 팀 재회·과거 신원 보존 — 2026-11-06

## 구현
- **E96 owner**: `settleUsOpponentReunions`(정규 일마감/MLB PS FINAL hook 그대로)가 같은 닫힌 날의 실제 경기 health 등록(`evidence.roster`)에서 주인공과 SEPARATED/REUNITED_OPPONENT 상대가 **같은 팀 한 줄**에 함께 등록된 경우 E96과 `REUNITED_TEAM` milestone을 만든다. 벤치·부상 예비도 실제 등록이면 인정, 오늘의 클럽 소속은 보지 않는다. 영수증 `["us-shared-registration",relationKey,gameKey,정렬 roster]`가 근거이며 읽기 때 같은 경기 기록으로 재검증한다(`INVALID_US_TEAM_REUNION_NOTICE`). 새 파일/hook 배선 없음 — us-season/us-postseason-progress는 변경하지 않았다.
- 양쪽이 다른 팀이면 기존 E95만. 같은 날 E96 중복 예약/이미 같은 영수증이면 재생성하지 않는다(멱등).
- 목록/읽음: `unreadUsRelationNotices`·`resolveUsRelationNotice`가 E96을 처리(OPEN_RELATIONS→S42, notice/revision만 변경). 이월된 KBO E96(영수증 접두 `kbo-…`)은 US가 해석하지 않는다.
- **누락 과거 신원**: KBO→US 활성화 시 US 세계/아마추어 이력에 없는 과거 KBO 관계 상대(현역·FA풀·은퇴)의 신원을 `UsCareer.relationIdentities`에 봉인하고 `us-relations` 읽기가 detached 출처로 쓴다. 기존 저장은 그대로(없으면 UNKNOWN_REFERENCE 유지). 공개 DTO는 기존 identity 필드만 노출(능력치·잠재력 비공개).

## 테스트
- `us-team-reunions.test.ts` 2건(native 첫 US 정규일 + controlled 분리 관계 접두), `kbo-us-activation.test.ts` 신원 보존 RED→GREEN(RED: HISTORICAL_ONLY 기대, UNKNOWN_REFERENCE 실제).
- 묶음 38건(신규 E96 2 + 신원 1 포함, US 재회 5·KBO 활성화·API m2-us-relations)에서 1건 실패: 기존 "같은 팀 쌍은 E95를 만들지 않는다" 테스트가 이제 같은 팀이면 E96 REUNITED_TEAM이 되는 의도된 변경과 충돌. 테스트를 "E95 불가, 같은 팀은 E96"로 갱신 후 us-reunion-events 5/5 재실행 통과. 갱신 후 전체 묶음 재실행은 하지 않았다(나머지 37건은 갱신 전 통과). types/lint 0.

## 한계
- E96 테스트는 별도 RED 실행 없이 소스와 같은 작업에서 작성했고 이후 GREEN을 확인했다(신원 보존은 RED 확인). 팀 재회 PS 경로는 E95의 envelope와 같은 코드이나 E96 전용 PS 테스트는 없다.
- 관계는 controlled 접두(분리 이정표 수동 삽입). 실제 AI 이적으로 같은 팀이 되는 native 장기 경로는 미검증. 웹/API 새 명령 없음(기존 US 관계 읽기 명령이 E96도 처리 — API 전용 E96 테스트 없음).
