# v0.14 최종 설계 검토 정적 검증 — 2026-10-19

검증 대상은 문서·JSON 구조·링크·HTML 구문·예시 산술입니다. 실제 게임·UI·API·복구·AI·밸런스의 실행 검증이 아닙니다.

명령: `node docs/design/verify-design.mjs`

```text
PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.
PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.
PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.
PASS: 80 explicit design fixtures across 8 detailed modules; automatic traits and cheat pitch XP examples. Fixture execution is NOT implemented.
CONFIRMED: cosmetic-only rewards and read-only commentary; no pending choices in these eight detailed modules.
PASS: 82 world design expectations across 8 modules, 24 invariant contracts, 12 planned run scenarios, narrowing-range examples. World simulations are NOT executed.
PASS: 30 cross-contract expectations (12 command, 6 exact-effect, 12 web/APK resume); 192 expectations in these three fixture sets. Actual interruption recovery is NOT tested.
PASS: 45 screen-action bindings and 10 creation recovery design expectations; 202 expectations before the final audit set. Runtime creation recovery is NOT tested.
PASS: 45 screen recovery rows, 99 event occurrence rows, 20 probability surfaces, 24 planned paths, 72 final fixtures; 274 unique design expectations total. Runtime/UI/AI checks are NOT executed.
NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.
```

총274개 서면 기대값=기능80+세계82+교차30+생성복구10+최종검토72. 최종72는 생성10/화면10/이벤트10/확률10/시각10/통합경로10/난이도12이며 모두 NOT_IMPLEMENTED입니다. 정적 도구가 기대값의 실제 행동을 실행한 것은 아닙니다.

추가 검사: 화면복구45행,이벤트 근거99행,확률 표면20행,통합 경로24개,각 ID와 기존 카탈로그 참조,정책·빈 필드·실행 상태,전체 fixture 고유ID. 관계 생성 E94와 동일팀 등록 E96이 실제 대진을 요구하지 않도록 근거를 구분했습니다. 부상은 injuryId+stage,폼 안내는 세계 사건과 분리했습니다.

산술 예시: 하드 NPC10×1.2=12,기본P95+5→100상한,반시즌 일반/반시즌 치트의 기준10→20,XP30사용 후 일반잔여0/치트재영입잔여30,원본 최고100/90/80/70/60/50의 반값 평균37.5. 이는 실제 성장 엔진 실행 결과가 아닙니다.

HTML 숨김 치트 설명을 구단 전체 잠재력100·자연성장/구종숙련3배·향후 영입/보관 포함으로 갱신했습니다. 해금 전 노출 방지의 실제 브라우저 동작은 미검수이며 기존 JS 구문/ID/앵커/카탈로그/자산 경로 검사만 통과했습니다. 원래 열린 목업 복사본도 같은 파일로 동기화합니다.

실제 렌더링·스크린리더·모바일 키보드/터치·웹/APK 강제종료·2기기·인증/owner격리·Neon/파일/백업복원·worker장애·장기 밸런스·AI/build/APK는 미실행입니다. 기존 MXC 오류 이후 픽셀 검수 재시도는 없었습니다. 장기 실험12개/불변조건24개/통합경로24개는 계획이며 production 변경은 없습니다.

Git diff 공백 검사와 패키지 SHA 해시는 별도로 확인합니다. 통합MD와SHA목록을 갱신하며,서면 기준 완료와 구현 준비용 실행 게이트를 STATUS/84에서 분리했습니다.

플랫폼86 보완 후 같은 정적 검사를 재실행해 통과했습니다. 공식 Capacitor/Apple 문서를 확인하고CP01~06의 네 환경 웹·홈 화면·release APK 검수 대상을 작성했습니다. 실제 플랫폼 실행 시험은 미실행이며274개 서면 기대값 집계는 유지합니다.
