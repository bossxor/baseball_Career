# 귀국 복무 연도 완료 신호·긴 검사 상한 보완

조사: advanceUsMilitaryWorld는 SEASON_REVIEW, 독립 준비 worker는 SEASON_COMPLETE를 반환한다. 귀국 wrapper는 그대로 전달해 같은 연도 완료를 다르게 노출한다. 기존 사용자 복무 테스트는 SEASON_COMPLETE만 기다리고3000회 cap을 쓴다.8790경기×최소8완료이닝÷명령20이닝=최소3516회라3000으로는 원천적으로 완주 불가. 자기 선택 회귀는 중지했고 stop-reason 증거를 보존했다.

- [ ] controlled prior service dates 뒤 실제 마지막 native day가 wrapper에서 SEASON_COMPLETE를 내는 RED 회귀.
- [ ] wrapper의 완료 stop label만 통일. phase/계약/성장/복무 blocks는 그대로 실제 owner가 처리한다.
- [ ] 기존 사용자15줄 재현 테스트는 백업을 보존하고 실제 schedule 기반 충분한 test-only 상한·무진행 즉시 실패로 보완한다. 게임 worker1000PA/20이닝 cap 변경 금지.
- [ ] 작은 회귀/static/build와 독립 리뷰, native전체2년 미실행/미완료를 명시하고 진행 자료에 반영한다.
