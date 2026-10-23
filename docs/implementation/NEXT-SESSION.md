# 다음 환경 구현 인계 — 2026-10-23

## 최신 상태 — M2-CU/CV 완료

이번 검증의 기반 커밋은 a5bc5ba59fa432b551f31f623d2cf119364ee7b7(main). 재개 시 origin/main·체크아웃·V: 추적1290개가 모두 일치하고 작업트리가 깨끗했다. CU/CV 공동 전체 검사566/566·실패0·취소0 및 lint/타입/build/골든/이벤트/설계10종이 통과했다. 검증본을 V:에 동기화하고 같은 커밋으로 저장하는 인계다. 실제 최신 커밋은 git log -1을 따른다. 첫 중단 검사는 통과로 세지 않는다.

CU: 사용자 승인 종합35~45 군팀 임시선수·최소 야수9/투수1/우투 중요 수비수4 보충·회복 뒤 등록 제외·신원/구종/기록 보존·실제 FUTURES:SANGMU 건강·S42 군팀 신원·실제 E95 연결. 새 상무 시즌 시작에서 루트v5/원장을 활성화하고 이미 진행 중인 원장 없는 구 저장의 건강 RNG 순서는 보존한다. 다음 시즌 입대 예약을 현재 군팀 등록으로 오인하는 읽기 회귀도 수정했다.

CV: 실제 한국시리즈 마지막 부상 뒤 정규 성장 최초 정산이 CHANGED_GROWTH_HEALTH_EVIDENCE로 막히는 경로를 재현했다. 정규 범위 뒤의 부상/회복 전이만 역순으로 복원해 정규 마지막 상태와 비교한다. 정규·SPORTS/ACTIVE 분할이 같은 내부 helper를 쓴다. 부상·경기·RNG·지급된 기간을 재작성하지 않고 정규 시작 상태 계산은 유지한다.

최종 집중39/39(CU 신규8·CV 신규6·기존25), 실패0·취소0, 전체 테스트 타입 검사 통과. 공동 전체 check566/566·실패0·취소0이 통과했다. 테스트 duration_ms1145193.7649. [집중 로그](evidence/M2-CV-focused-final.log) · [CU 상세](M2-CU-SANGMU-HEALTH-EMERGENCY.md) · [CV 상세](M2-CV-POSTSEASON-GROWTH-HEALTH.md). 전체 앱 추정35% 완료·65% 남음 유지: 작은 내부 경로와 회귀 수정이며 실제 UI/계정/Neon 저장·NPC 반년 복귀는 미완료다.

## 최종 검증과 인계

- evidence/M2-CU-check.log, M2-CU-check-exit.txt=0, M2-CU-source-freeze.json. 첫 중단 로그/사유는 M2-CU-check-first-run.*이며 최종 통과가 아니다.
- 실제 연도 이월 자기검사: node --import tsx docs/implementation/evidence/M2-CU-year-carry.mjs. 정규 경기는 통제된 시계, 포스트시즌·성장/시즌 마감·AI 연도 전환은 실제 명령이다.10명 신원/구종 보존·활성 등록0·JSON 동일·원본 불변을 검사한다. CV 적용 전 실패 로그도 보존한다.
- 고정 소스의 전체 검사 뒤 완료 문서·설계 패키지 재생성/정적10종·MANIFEST·HTTP 기본 smoke를 별도로 재검증한다. HTTP는 웹/API 골격이며 실제 UI/계정/DB/Storage 검증이 아니다. 마지막 Git 해시는 git log -1을 따른다.

## 다음 작업 — 개막 부상 증거, 그다음 NPC 병역 연결

개막 sourceBasis가 이미 보존한 unavailable로 미지급 정규/병역 성장의 초기 재활 상태를 복원한다. 실제 등록 회복 사례에서 기존105000 대 기대84000 단위를 재현했다. 옛 지급 periodKey/금액/검증은 유지하며 새 기간에는 명시 opening-health-v1 접미사를 검토한다. 저장소 밖 초안6개 통과는 이번 커밋의 정식 코드/결과가 아니다. 이 PC의 TEMP/baseball-CW-draft에 native3개·kbo-opening-growth-health.test.ts·별도 실행본이 있으며, 다른 환경에서는 [CV 후속 감사](M2-CV-POSTSEASON-GROWTH-HEALTH.md)의 재현 순서를 따른다.

[병역 연결 점검표](M2-NEXT-MILITARY-INTEGRATION-NOTES.md)의 마지막 섹션을 먼저 읽는다. NPC6월30일 복귀는 실제 잔여 급여·보유권/슬롯·군팀 후반 편성·성장/노쇠의 동일 원장이 필요하다. settleKboServicePayrollDay는 현재 주인공 계약 하나만 처리하고 closeKboNpcSeasons는 민간 world.players만 성장시킨다. 날짜 한 줄이나 기존 연말 복귀 호출만으로 완료 처리하지 않는다.

CV는 정규 종료 경계만 바로잡는다. 이전 시즌 부상이 포스트시즌에 회복된 경우의 정규 시작 재활 추론은 별도 감사가 필요하며 이미 지급된 기간을 재작성하지 않는다. 군팀/AI 공동 등록 E96·ATHLETE/해외 병역·미국 실제 리그·실제 화면/클라우드 저장·구단 조작/보관 선수 투입·APK/배포도 후속이다.

## 작업 환경과 검증 계약

수정/Git/빌드 원본: C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo. V:는 검증 원본 미러이며 V:/.git을 만들지 않는다. 재개 때 실제 origin/main·체크아웃·V:를 먼저 비교하고 사용자/다른 창 변경을 보존한다.

마일스톤마다 전체 npm run check·관련 집중 검사·STATUS/PROGRESS/상세·증거 로그·설계 패키지/해시 재생성/검증·V: 동기화·커밋/푸시. 공동 검사한 CU/CV는 같은 최종 소스와 결과로 저장한다. 미검증 변경을 이전552/552 통과에 섞지 않는다.

## 사용량 경계

최신 사용자 기준은 잔여5%다. 실제 조회가5% 이하일 때 새 구현을 동결하고 진행/검증 구분을 갱신해 커밋·푸시한다. 이번 재개 시 단기 잔여99%로 리셋됐음을 확인했다. 이전 실행의5%를 현재 잔여로 쓰지 않는다. 리셋 크레딧을 사용하지 않으며 이번 실행에 PC 종료 요청은 없다.

## 이전 기록

[PROGRESS](PROGRESS.md)의 아래 항목은 당시 이력이다. 직전 완료 CT는 전체552/552·c4c4f9e 기능 커밋 및 a5bc5ba 인계 커밋까지 푸시했다. 더 오래된 [NEXT-SESSION 보존본](NEXT-SESSION-HISTORY-20261023.md)도 유지한다.
