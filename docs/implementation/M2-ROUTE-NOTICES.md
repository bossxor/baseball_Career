# 진로 사건 원장 연결

`career-route-notices.ts`는 기존 지명·미국 오퍼·입학·선수권 reducer가 확정한 증거만 읽는다. `routeNotices`는 본래 `events`와 별도 원장이다. 진로 계약 명령을 막거나 ACK로 계약을 체결하지 않는다.

- E05/E06: `resolveCareerKboDraft`의 실제 결과 receipt로 지명/미지명을 분리한다. SIGN/DECLINE·입학·준비 참가가 실제 확정된 뒤만 해당 receipt로 종료한다.
- E56/E57: 실제 유효 미국 오퍼가 있을 때 진로 비교와 오퍼별 계약 검토 사건을 만든다. SIGN·거절·만료·다른 진로 확정은 기존 도메인 상태에서 확인한다. 미국 계약을 미리 생성하지 않는다.
- E71: E04 입학 commit receipt가 입학 원장과 일치할 때 생성한다. ACK는 사건 확인만 한다. `CHOOSE_FOCUS`는 별도의 실제 육성 명령이 필요하므로 일반 notice resolver가 거부한다.
- E72: 기존 선수권 bracket에서 주인공 팀의 실제 준결승 진출을 증명할 때 생성한다. 경기 결과·우승 receipt를 만들지 않는다. 과거 시즌은 보관된 bracket과 학년 결과로 검증한다.

`assertCareerRouteNotices`는 생성·root reader를 호출하지 않는 순수 guard다. `resolveCareerRouteNotice`는 카탈로그 ACK/NAV만 처리한다. DOMAIN 선택은 `ROUTE_NOTICE_REQUIRES_DOMAIN_COMMAND`로 실제 분야 명령이 필요함을 알린다. 미국 오퍼 만료를 읽기만 해서 권리·돈·등록이 변경되지 않는다. 결산 source seal 이후에는 producer가 원본을 그대로 반환하고 resolver는 변경을 거부한다.

E70은 연결하지 않았다. 카탈로그 증거는 `enrollmentId`를 요구하지만 현재 입학 검토 단계에는 입학 원장이 없다. 임의 enrollment 식별자/가짜 입학 receipt를 만들지 않았다. E07 및 은퇴·별칭 사건도 본 작업 범위 밖이다.

Writer 연결: KBO 지명 결과/결정, 미국 오퍼 생성/협상일 진행/결정, 고교 대학 입학 확정, 대학 시즌 활성화, 선수권 시작, 독립 준비 참가 확정. Root 필드는 `routeNotices?:CareerRouteNoticeLedger`. 별도 큐의 열림 상태는 기본 도메인 `events.some(OPEN)`에 합치지 않는다.

검증: 실제 분야 fixture를 사용한 receipt·멱등·원본 보존·위조·버전·오퍼 없음/만료·선수권 탈락 테스트 작성. 요청에 따라 테스트·전체 검사·Git은 실행하지 않았다. 실제 전체 검사는 일괄 구현 후 대기한다.
