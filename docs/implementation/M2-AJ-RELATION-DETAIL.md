# M2-AJ — 관계 상세(S42) 비교·직접 대결 투영

2026-10-21. [60](../design/60-RELATIONS-DETAILED-CONTRACT.md)의 맞대결 집계 규칙을 읽기 전용 투영 `relationDetailView`로 구현했다. 새 게임 규칙은 추가하지 않았다.

- 같은 종류 관계(고교 기본 라이벌·동료)는 COMPARISON이다. 두 선수가 모두 출장한 같은 경기만 모아 각자의 기록을 비교하고, 직접 상대 전적인 것처럼 표시하지 않는다(안내 문구 포함).
- 다른 종류 관계는 DIRECT다. 실제 타자-투수 타석(matchups)만 합산한다. 프로 cross-kind 관계 형성은 아직 없으므로 지금은 테스트에서만 만든다.
- 범위는 leagueKey·phase(·seasonKey)로 고정하며 리그·정규/PS/국제를 섞지 않는다. 비율은 분모 0이면 '-'로 표시한다.
- 범위에 경기가 없으면 EMPTY(NO_GAMES_IN_SCOPE), 상대가 현재 세계에 없으면 UNAVAILABLE(OTHER_NOT_IN_CURRENT_WORLD), 없는 관계는 UNKNOWN_RELATION 오류다. 상태·난수·revision을 바꾸지 않는다.

검증: 관계 테스트5/5(실제 1주 진행 후 비교 합계·EMPTY·오류·입력 불변, cross-kind 실제 타석 합계·UNAVAILABLE), 테스트 타입·lint 통과. [집중](evidence/M2-AJ-focused.log).

미완료: 단계 전이(분리/재회/은퇴)와 이정표, 동료 20경기 공존 등 milestone, E94~96, 요약 캐시·정정 교체, API/화면 연결.
