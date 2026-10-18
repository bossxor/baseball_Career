# 다시, 플레이볼

웹앱과 Android APK로 즐기는 선수 커리어·구단 운영 야구 시뮬레이션 프로젝트입니다. 현재 상세 설계 단계이며 앱 구현은 시작하지 않았습니다.

- [설계 시작 안내](docs/design/START-HERE.md)
- [문서 지도](docs/design/README.md)
- [진행 현황](docs/design/STATUS.md)
- [통합 설계서](docs/design/DESIGN-ALL.md)
- [다른 환경용 요청문](docs/design/HANDOFF-PROMPT.md)

설계는 항목별로 작성·검토한 뒤 논리적인 작업 단위마다 커밋합니다. 확정 요구와 설계 기본값, 실제 실행으로 검증해야 할 항목을 구분합니다.
최신 보완 v0.9: 45화면/99이벤트. 특성·구종·목표·에이전트·라이벌·은퇴 지도자·문자 중계·연대기를 모두 설계 범위에 추가했습니다. [보완 설계 안내](docs/design/39-DESIGN-RECONCILIATION.md)에서 분야별 문서를 확인할 수 있습니다.

정적 검사: `node docs/design/verify-design.mjs` (게임·Neon·빌드 검증 제외).

[추가8기능통합설계](docs/design/55-EXPANSION-INTEGRATION.md)에서각문서와신규화면/사건을확인할수있습니다. 앱구현은아직시작하지않았습니다.

상세계약 v0.10: [공통API와수용기준](docs/design/64-EXPANSION-COMMON-CONTRACT.md), [사용자선택확정](docs/design/65-USER-TRAITS-XP-STAFF.md),56~63의8개기능계약과80개서면검수기대값을작성했습니다. 구현·실제테스트는별도입니다.

장기설계 v0.11: [재도전](docs/design/66-RETRY-CAREER-OPPORTUNITIES.md), [잠재력평가](docs/design/67-POTENTIAL-ASSESSMENT-PROGRESSION.md), [구단주기](docs/design/68-FRANCHISE-CYCLES-LEAGUE-HISTORY.md),69~73의충돌·복원·불변조건·연도전환·장기실험계획추가. 실제게임실험은미실행입니다.

최신 v0.12: [웹·APK 이어하기 필수설계](docs/design/76-CROSS-PLATFORM-INTERRUPTION-RESUME.md), [정확한 강화효과](docs/design/75-EXACT-EFFECTS-PUBLIC-INFORMATION.md), [중복실행 방지](docs/design/74-PREVIEW-COMMAND-RECONCILIATION.md). 총192개 서면 검수 기대값, 앱 구현 전입니다.


최신 v0.13: [45화면 조회·명령 연결](docs/design/77-SCREEN-QUERY-COMMAND-BINDINGS.md), [새 게임 생성 중단 복구](docs/design/78-NEW-GAME-CREATION-RECOVERY.md). 총202개 서면 검수 기대값이며 실제 앱은 미구현입니다.


최신 v0.14: [남은6항목 설계·통합 경로](docs/design/84-DESIGN-GATES-END-TO-END-PATHS.md), [난이도·구단 전체 치트 잠재력100/성장3배](docs/design/85-DIFFICULTY-COMPETITORS-CLUB-CHEAT.md). 274개 서면 기대값,실제 앱 구현·실행 검증은 시작 전입니다.
