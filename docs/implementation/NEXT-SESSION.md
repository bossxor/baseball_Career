# 다음 환경 구현 인계 — 2026-10-23

## 최신 상태 — M2-CW 완료

기반 CU/CV는 c2706c61f0c83a56f3cf64b79dfeeb894cc82b33. 원격=로컬·clean·추적1320개 V: 일치 확인 후 CW를 구현했다. 개막 부상 증거/기간 버전·옛 지급 보존, 집중25/25·전체 check574/574·실패0·취소0, lint/타입/build/골든/이벤트/설계10종 통과. 테스트 duration_ms1081868.4695. 마지막 커밋은 git log -1을 따른다. [CW 상세](M2-CW-OPENING-REHABILITATION.md) · [집중](evidence/M2-CW-focused-final.log).

검사 동안 packages/apps/docs/design 소스를 고정했다. 전체 결과는 evidence/M2-CW-check.log와 M2-CW-check-exit.txt=0. 완료 문서 정적 검증·소스 불변·V:/index 증거는 M2-CW-post-docs.json/source-sync.json을 따른다. 다음은 NPC 군팀 실제 복귀/급여/성장 연결이며 아래 병역 점검표를 읽는다.

## 최신 상태 — M2-CU/CV 완료

이번 검증의 기반 커밋은 a5bc5ba59fa432b551f31f623d2cf119364ee7b7(main). 재개 시 origin/main·체크아웃·V: 추적1290개가 모두 일치하고 작업트리가 깨끗했다. CU/CV 공동 전체 검사566/566·실패0·취소0 및 lint/타입/build/골든/이벤트/설계10종이 통과했다. 검증본을 V:에 동기화하고 같은 커밋으로 저장하는 인계다. 실제 최신 커밋은 git log -1을 따른다. 첫 중단 검사는 통과로 세지 않는다.

CU: 사용자 승인 종합35~45 군팀 임시선수·최소 야수9/투수1/우투 중요 수비수4 보충·회복 뒤 등록 제외·신원/구종/기록 보존·실제 FUTURES:SANGMU 건강·S42 군팀 신원·실제 E95 연결. 새 상무 시즌 시작에서 루트v5/원장을 활성화하고 이미 진행 중인 원장 없는 구 저장의 건강 RNG 순서는 보존한다. 다음 시즌 입대 예약을 현재 군팀 등록으로 오인하는 읽기 회귀도 수정했다.

CV: 실제 한국시리즈 마지막 부상 뒤 정규 성장 최초 정산이 CHANGED_GROWTH_HEALTH_EVIDENCE로 막히는 경로를 재현했다. 정규 범위 뒤의 부상/회복 전이만 역순으로 복원해 정규 마지막 상태와 비교한다. 정규·SPORTS/ACTIVE 분할이 같은 내부 helper를 쓴다. 부상·경기·RNG·지급된 기간을 재작성하지 않고 정규 시작 상태 계산은 유지한다.

최종 집중39/39(CU 신규8·CV 신규6·기존25), 실패0·취소0, 전체 테스트 타입 검사 통과. 공동 전체 check566/566·실패0·취소0이 통과했다. 테스트 duration_ms1145193.7649. [집중 로그](evidence/M2-CV-focused-final.log) · [CU 상세](M2-CU-SANGMU-HEALTH-EMERGENCY.md) · [CV 상세](M2-CV-POSTSEASON-GROWTH-HEALTH.md). 전체 앱 추정35% 완료·65% 남음 유지: 작은 내부 경로와 회귀 수정이며 실제 UI/계정/Neon 저장·NPC 반년 복귀는 미완료다.

## 최종 검증과 인계

- evidence/M2-CU-check.log, M2-CU-check-exit.txt=0, M2-CU-source-freeze.json. 첫 중단 로그/사유는 M2-CU-check-first-run.*이며 최종 통과가 아니다.
- 실제 연도 이월 자기검사: node --import tsx docs/implementation/evidence/M2-CU-year-carry.mjs. 정규 경기는 통제된 시계, 포스트시즌·성장/시즌 마감·AI 연도 전환은 실제 명령이다.10명 신원/구종 보존·활성 등록0·JSON 동일·원본 불변을 검사한다. CV 적용 전 실패 로그도 보존한다.
- 고정 소스의 전체 검사 뒤 완료 문서·설계 패키지 재생성/정적10종·MANIFEST·HTTP 기본 smoke를 별도로 재검증한다. HTTP는 웹/API 골격이며 실제 UI/계정/DB/Storage 검증이 아니다. 마지막 Git 해시는 git log -1을 따른다.

## 다음 작업 — NPC 병역 연결 (개막 증거는 CW 완료)

사용자 추가 확정: NPC 계약 소진은 기존 AI 가치·수요·예산으로 재계약/FA, 전역·모집 공석도 종합35~45 군팀 보조 선수를 최소 충원한다. 보조 선수에 입대/복무/민간 계약을 만들지 않는다. 실제 구현은 아직이며14/21/병역 점검표를 따른다.

개막 sourceBasis unavailable 재사용·opening-health-v1은 CW에서 완료했다. 옛 지급 계산/periodKey/금액은 유지한다. TEMP 초안 대신 저장소의 CW 코드와 신규8개/집중25개/전체574개 검증을 따른다.

[병역 연결 점검표](M2-NEXT-MILITARY-INTEGRATION-NOTES.md)의 마지막 섹션을 먼저 읽는다. NPC6월30일 복귀는 실제 잔여 급여·보유권/슬롯·군팀 후반 편성·성장/노쇠의 동일 원장이 필요하다. settleKboServicePayrollDay는 현재 주인공 계약 하나만 처리하고 closeKboNpcSeasons는 민간 world.players만 성장시킨다. 날짜 한 줄이나 기존 연말 복귀 호출만으로 완료 처리하지 않는다.

CV는 종료 경계, CW는 새 미지급 기간의 개막 증거를 바로잡았다. 이미 지급된 기간은 재작성하지 않는다. 군팀/AI 공동 등록 E96·ATHLETE/해외 병역·미국 실제 리그·실제 화면/클라우드 저장·구단 조작/보관 선수 투입·APK/배포도 후속이다.

## 작업 환경과 검증 계약

수정/Git/빌드 원본: C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-repo. V:는 검증 원본 미러이며 V:/.git을 만들지 않는다. 재개 때 실제 origin/main·체크아웃·V:를 먼저 비교하고 사용자/다른 창 변경을 보존한다.

마일스톤마다 전체 npm run check·관련 집중 검사·STATUS/PROGRESS/상세·증거 로그·설계 패키지/해시 재생성/검증·V: 동기화·커밋/푸시. 공동 검사한 CU/CV는 같은 최종 소스와 결과로 저장한다. 미검증 변경을 이전552/552 통과에 섞지 않는다.

## 사용량 경계

최신 사용자 기준은 잔여5%다. 실제 조회가5% 이하일 때 새 구현을 동결하고 진행/검증 구분을 갱신해 커밋·푸시한다. 이번 재개 시 단기 잔여99%로 리셋됐음을 확인했다. 이전 실행의5%를 현재 잔여로 쓰지 않는다. 리셋 크레딧을 사용하지 않으며 이번 실행에 PC 종료 요청은 없다.

## 이전 기록

[PROGRESS](PROGRESS.md)의 아래 항목은 당시 이력이다. 직전 완료 CT는 전체552/552·c4c4f9e 기능 커밋 및 a5bc5ba 인계 커밋까지 푸시했다. 더 오래된 [NEXT-SESSION 보존본](NEXT-SESSION-HISTORY-20261023.md)도 유지한다.
