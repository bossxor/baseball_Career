# M2-AH — 특성 해금 알림(E84)과 일반 해금 요약

2026-10-21. 사용자 결정(14의 2026-10-21 특성 해금 알림 U)과 [117](../design/117-CAREER-NEXT-MAJOR-EVENT-PROGRESSION.md)의 표현 정지 분류를 구현했다.

- `raiseHiddenTraitNotice`: 내 선수의 히든 특성(T13~T16) 해금 receipt마다 E84를 한 번만 만든다. 이미 E84가 있는 traitId는 다시 만들지 않는다. 고교/대학 정규 진행은 일마감 직후 이 알림이 있으면 `MAJOR_EVENT`로 멈춘다. 시즌 마감에서 해금된 T16은 SEASON_REVIEW를 저장한 채 E84에서 멈춘다.
- `resolveHiddenTraitNotice`: E84의 유일한 NAVIGATE 선택(OPEN_TRAITS)만 받는다. 사건을 해결하고 S38 이동 정보를 돌려주며 저장해 둔 단계(진행 중 또는 시즌 정리)로 복귀한다. 같은 사건 재해결과 다른 명령은 거절한다.
- 일반 특성(T01~T12) 해금은 진행을 멈추지 않는다. `unreadTraitSummary`는 마지막 확인 이후의 일반 해금만 돌려주고, `acknowledgeTraitSummary`가 확인 위치를 한 번 옮긴다. 이미 확인한 상태의 재확인은 revision을 바꾸지 않는다.
- 효과·해금 조건·사건 정의는 바꾸지 않았다. 해금 효과는 기존대로 다음 경기 snapshot부터 적용된다.

검증: 알림/요약 집중4개와 특성·도감·T16·고교216경기·대학·선수권 경로 포함 38/38(1096.1초), 타입·lint·build·M1 골든·이벤트 동기화·설계 정적10종 통과. npm run check 전체 단일 재완주는 하지 않았다. [집중](evidence/M2-AH-focused.log) · [타입](evidence/M2-AH-types.log) · [lint](evidence/M2-AH-lint.log) · [build](evidence/M2-AH-build.log) · [골든](evidence/M2-AH-engine.log) · [이벤트](evidence/M2-AH-events.log) · [설계](evidence/M2-AH-design.log).

미완료: 대학 선수권(POSTSEASON) 진행 중 해금된 히든 특성은 다음 정규 진행의 일마감에서 알린다. 선수권 루프 안의 즉시 정지는 하지 않는다. E85 사건 인스턴스 생성(도감 조회 계기)과 API/화면 연결은 후속이다.
