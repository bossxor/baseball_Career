# EK 이후 구현 인계 — 미구현 후속

2026-10-28. 이 문서는 새 게임 규칙이나 완료 증거가 아니다. 현재 EK는 봉인 비교와 E66 두 조회까지이며 실제 수락·이적·국내 등록은 없다.

## 다음 수락 writer

- 현재 minorMarket은 OPEN·현재 시즌/계약/구단에 묶인다. E66의 BLOCKING_UNTIL_DOMAIN_COMMIT는 실제 계약/복귀 commit 때만 completeBlockingEvent와 경제 receipt로 닫는다. NAV는 사건/자금을 바꾸지 않는다.
- 새 마이너 조건은1년·연$30,000·계약금0·현재 레벨 유지. 원구단과 실제 예산/경쟁 점수 수요를 충족한 타 구단 최대3곳을 비교한다. 같은 포지션의 최저 건강한 정규 선수보다 높아야 하며 없으면 타 구단 후보가 아니다. 새 확률/점수 문턱을 발명하지 않는다.
- UsMinorYearArchive에 새 서명 계약/구단/봉인 창 근거를 보존하고 openingUsMinorInventory/openingUsMajorYear/usCareerView가 계약 epoch와 보유 구단을 재생하도록 함께 확장한다. 현재 reader는 원래 계약/같은 구단의 유효 연도만 지원한다. 새 서명에도 고교6시즌 보유를 더하지 않는다.
- usContractOrigin의 최초 offer/inventory는 원래 원점이다. 이를 현재 계약/새 구단으로 덮어쓰지 않는다. 새 구단 holder와 최초 출처를 혼동하지 않는다. 만료 뒤 현재1년 계약의 급여/구단으로 다시 초기화하는 후속 재생 근거가 필요하다.
- stageUsYear와 retireAndSupplyUsNpcs/fundUsMinorYear를 재사용한다. 이적 뒤 원구단 최소 명단이 모자라면 기존 조직 승격·Rookie 보충 정책을 확장하고, 임의 상위리그 신인/가짜 상대 구단 교환 선수를 만들지 않는다. 실제 선수 ID·부상·기록·구종·관계·연도 예산/사용 창을 보존한다. 새 팀 최초 등록 동료는 formRegisteredTeamTeammate/queueRelationFormationNotices를 따른다.
- 현재 OPEN 창은 현재 시즌 reader에 묶여 있으므로 수락 후 과거 창을 새해 OPEN으로 둔 채 활성화하면 검증이 거부된다. 실제 경제 archive와 사건 receipt에 과거 창을 남기고 새 활성 root의 상태 계약을 명시한다. 단순히 필드를 지우거나 guard를 완화해 통과시키지 않는다.

## 국내 복귀

현재 kbo-return.ts는 출국 당시 posting.sealedPlayer와 과거 KBO 세계를 복원하는 범위다. 미국에서 진행한 최신 능력치·나이·구종·기록·부상을 옛 선수로 덮어쓰면 안 된다.72의 같은 세계/연도 원칙과 서버의 원래 KBO 세대/기록 보관을 연결할 실제 입력/원장 소유권이 먼저 필요하다. 최신 국내 세계가 US root에 자동으로 존재한다고 가정하지 않는다. 포스팅 우선권과 해외FA의 해제 권리를 구분하며 USD/원화·두 활성 계약을 섞지 않는다.

## 검증/남은 감사

- EK 수요 양성 테스트는 경쟁자 능력을 낮춘 통제 fixture다. native NPC 성장/전체 미국 시즌으로 세지 않는다. 계약 수락 뒤 원구단/타 구단의 실제 다음 첫 경기와 급여/JSON 재개·수정된 성적에도 봉인 제안 보존·중복/오래된 명령을 검증할 것.
- 기존 ‘minor market rejects early entry’ 테스트의 해당 assert는 stale revision으로 먼저 거부돼, 올바른 현재 revision의 조기 진입을 단독 입증하지 못한다. 다음 writer 묶음에서 정확한 revision과 US_MINOR_MARKET_NOT_AVAILABLE을 별도로 확인한다. 조기 입구 guard 자체는 소스 검토됐으며 검증기를 약화하지 않는다.
- E66은 부분 엔진 NAV 검수이며 실제 계약/복귀·자동 UI 완료가 아니다.99사건/24경로/PF-D의 완료 표기를 근거 없이 올리지 않는다. 긴급 대표/US 후보·E61 성공 강등 등 기존 잔여도 남는다.

원점 없는 구 KBO 미국 저장의 과거 예산/나이는 현재 live 값에서 추정하지 않는다. 작업/Git/build는 기존 codex/m2-career-engine 체크아웃만, V는 문서 Copy-Item만. main/M6 임의 병합·강제푸시·훅 스킵·PC 종료 금지.
