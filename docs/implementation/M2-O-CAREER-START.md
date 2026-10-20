# M2-O 커리어 시작과 첫 사건 실제 명령

2026-10-20. 19의 canonical phase를 구분 합집합으로 저장하는 고교 커리어 상태를 만들었다.

- 고교 생성 결과와 난이도·revision, 공식 기록/건강/일마감/임시 등록 원장, 사건과 계획 이력을 같은 상태에 둔다. 난이도는 이후 명령에서 교체하는 값이 아니다.
- CONFIRM_PLAYER만 CREATED에서 E01을 만들며 source world/season/학교·복귀 PRESEASON_SETUP을 고정한다. 생성이나 확인만으로 경기를 자동 진행하지 않는다.
- KEEP_FOCUS는 기존4개를 유지해 확인 완료한다. CHOOSE_FOCUS는 역할별 정확4개 검증과 선수/계획 갱신 성공 뒤에만 도메인 receipt로 E01을 완료한다. 검증 실패는 사건/선수/revision을 변경하지 않는다.
- 프리시즌 집중 변경과 유형 변경은 해당 phase에서만 허용한다. 다른 유형 확정은 PRE 기회1회, 같은 유형 유지는 기회 미소모다. 현재 능력/잠재력/생성 RNG를 초기화하지 않는다. 경기 전 계획 이력은 같은0경기 경계의 최신 계획으로 남긴다.
- 첫 사건 완료 뒤 CONFIRM_PRESEASON으로 첫 일정일의 SEASON_PROGRESS에 진입한다. 매 명령은 expectedRevision을 검사하고 새 revision을 반환한다. 서버 저장/commandId 중복 receipt는 M3에서 구현한다.

집중5/5·전체178/178, lint/typecheck/build/M1 골든/사건 동기화/설계 정적10종 통과. JSON 복원과 첫 사건 동일, 잘못된phase/revision/eventVersion/등록 근거 거절, focus2개 실패 시 원본 불변, 유형 변경1회와 능력 보존을 확인했다.

아직 미구현: 실제 ADVANCE 청크·E02/03/강화/유형창/부상 주요 정지·고교 졸업 정산/진로·나머지 도메인 사건·UI/API/DB. 이 단계는 첫 사건 E01만 처리하며 다른 사건을 범용 ACK로 닫지 않는다. 다음 구현은19/69/117의 같은 날짜 전체 경기/일마감/필수 선택과 서버 pending game 재개를 연결한다.
