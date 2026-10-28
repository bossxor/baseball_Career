# M2 일괄 구현 체크포인트 — 2026-10-28

마지막 전체 검증 기준은 EL(271900f)이다. 이번 묶음은 **구현/연결 중·런타임 검증 대기**이며 M2 완료가 아니다. 사용자가 단계별 전체 검사를 중단하고 큰 묶음 후 통합 검사를 요청했다. 작은 기능마다 npm run check를 다시 돌리지 않는다.

## 변경과 호출 경계

- 반복 마이너 갱신: us-minor-history가 계약 epoch마다 원래 재무 원점에서 재생한다. 최초 EL root-only 갱신 저장은 읽을 때 수정하지 않고 다음 쓰기 때 승인된 metadata만 archive에 보완한다. us-career-entry/us-major-history/us-season이 현재 갱신 계약으로 첫 콜업과 다음 MLB 연도 급여를 검증한다. 역사 E66 stage/phase/competition binding 추가.
- E61: resolveUsLevelEventResult는 NAV와 domain 결과를 함께 반환한다. 기존 resolveUsLevelEvent 반환형은 유지한다. 새 API index 공개 완료. transport/UI 연결은 별도다.
- 대표 긴급 후보: 봉인 후보가 실제 고갈될 때만 기존 실제 하위리그에서 추가한다. 새 후보끼리 별도 시드 추첨, 기존 순위/출장/pending 보존, emergencyAdmissions로 저장 재생. national-progress EH 경계에 연결했다.
- 목표 사건: openCareerSeasonGoalSelection/resolveCareerGoalEvent로 E89 선택과 E90 실제 완료/보상 출처를 연결했다. 두 API index 공개. E90 refresh는 기존 진행 루프에 있음. E89를 고교 focus 해소/대학 입학·이월/KBO 진입·이월/미국 진입·마이너·메이저 갱신/국내 복귀의 실제 PRE 반환에 연결했다. caller commit revision을 그대로 쓰고 별도 +1 하지 않는다.
- 미국 대표 후보: nationalUsCandidates는 동일 world/year와 두 revision, 별도 record projection revision을 요구하고 확인된 한국 고교 출신 주인공/KBO 후보만 결합한다. 중복 선수·충돌 기록 거부. **selection/tournament/US 건강·급여 시간축 소유자까지 연결한 기능은 아니다.** 국적 없는 미국NPC는 추가하지 않는다.
- 국내 복귀: openUsKboReturn → usKboReturnView → acceptUsKboReturn. KBO 출신 만료 US_MINOR만 대상. 원본 출국 KBO snapshot과 별도로 현재 같은 세계의 다음 연도 domestic authority를 요구한다. 실제 최신 US 선수·구종·기록·관계·목표·traits를 인계한다. 국내 host RNG를 유지하고 미국 건강 시즌 마감 결과를 인계한다. 원소속 우선권/해외FA 해제와 기존 가치·계약 산식을 재사용한다.

## 관계·프로 특성 추가 연결

- 학교/대학·KBO·US 정규 FINAL contribution commit → 기존 관계 directDuels receipt → 새 투수숙적 형성 → 닫힌 날짜 특성 평가 순서로 연결했다. 형성 경기 자체는 관계 승리로 세지 않는다. 기존 라이벌 보존, 세계 시즌당 최대1명 추가, 이전 관계 유지. 다수 실제 후보는 해당 경기 PA내림차순·simulationKey안정순으로 선택하며 새 확률/seed추첨을 추가하지 않았다.
- T14는 동일 시즌/리그 정규20PA·OPS .900과 형성 뒤 WIN receipt를 결합한다. 보유 이후 새 충족 투수는 대상만 추가하고 해금/보상을 중복하지 않는다. 통계 정정으로 이전 봉인 PA/H/TB와 달라지면 신규 해금 근거에서 제외하고 이미 보유한 특성/대상은 유지한다. 정정 전용 receipt writer는 잔여다.
- 새 E94는 기존 학교/KBO 형성 notice reader도 검증할 수 있도록 relation-notices의 formationContext를 확장했다. 미국은 explicit pitcher-rival view/resolve API를 공개했다.
- KBO/US 정규 E84: 닫힌 날짜 경계/최초숨은특성/동시해금 backlog/마지막 T16을 실제 worker에 연결했다. S38 navigation 1회 후 정확한 regular resume로 돌아간다. 공개 resolver는 root CAS/세계/등록/receipt를 확인한다. 관련 없는 outbox 읽기로 revision이 증가해도 닫힌 날짜·출처가 유지되면 해소 가능하다. PS resume는 아직 별도다.

## 국내 복귀 저장 계약

acceptUsKboReturn 반환값은 archivedUs/kbo/ownership이다. persistence owner는 US source revision과 domestic authority revision을 동시에 CAS하고 **세 결과를 하나의 트랜잭션으로 커밋**해야 한다. receipt 문자열만으로 저장의 최신성을 보장하지 않는다. 이 트랜잭션 transport는 아직 없다. 엔진만 호출한 fixture를 실제 다년 세계 연동 완료로 표시하지 않는다.

원장 소유자: 이전 USD 급여·inventory·원점은 archivedUs에 보존. 신규 KRW 계약 예약은 최신 KBO host에만 반영. 공식 기록은 host가 모든 US rows를 동일 내용으로 가지고 있어야 하며 충돌/누락 시 거절한다. 미국 재계약을 대신 수락하면 경쟁 E67을 취소하고 E66은 그 기존 writer가 닫는다. accepted domesticReturn은 은퇴와 다른 archive 사유이며 quote/ownership validator를 통과해야 root reader가 허용한다. retirement와 중복 archive 불가.

## 실행 대기

집중 회귀: kbo-us-activation, us-levels-windows, national-injury-replacement, national-progress, season-goals, us-kbo-return, national-us-candidates, high-school-traits, direct-duel-traits, pitcher-rival, pro-trait-notices. 타입 검사는 실제 경기 실행 증거가 아니다. 최종 전체 npm run check는 전체 구현 묶음 후1회. 구체적인 T01~T09는 M2-BULK-IMPLEMENTATION-AND-TEST-PLAN.md 참고.

검증 방식 변경 전에 실행한 반복 갱신/콜업·기존 EL/legacy 집중5개가 통과한 로그를 회수했다(69266ms). 당시 이후 코드 변경은 통과 범위에 포함하지 않는다. 마지막 전체796/794·skip2·web22 수치를 이번 코드 통과 수로 인용하지 않는다. static 로그는 evidence/M2-BULK-static.log.

## 아직 남은 주요 작업

1. 국내 authority의 실제 세계 진행/기록 projection과 저장 atomic handoff caller.
2. 미국 대표 selection/tournament·일마감·차출/부상 owner transaction.
3. 프로 PS E84의 resume 계약, 전용 정정 receipt. 정규 E84와 actual duel/T14/새 투수숙적 형성은 아래와 같이 연결했으나 런타임 대기.
4. 고교 미국 직행 귀국 준비/재도전 누적 경로 및99사건 실제 trigger/domain 감사.
5. 24경로/PF-D 해당 M2 실제 실행·JSON 재개 증거. M6/실기기는 이 브랜치에서 제외.

## UI 작업 규칙 추가

사용자가 frontend-design을 추가했다. 승인된 청춘 야구 애니·글자체·네이비 우리팀 유니폼·팀별 로고색을 유지하고 실제 화면 작업 때 적용한다. 이번 엔진 묶음에서 디자인 보드/프런트 UI를 임의 재설계하지 않았다. 새 화면을 만들 때 기존 token과 정보 우선순위로 짧은 시안 계획을 세우고 키보드 focus/대비/모바일/reduced-motion/실제 렌더를 함께 확인한다.

작업/build/Git은 baseball-career-m2·codex/m2-career-engine. V는 docs Copy-Item만. V .git 생성·main/M6 임의 병합·force push·훅 스킵·PC 종료 금지.

## 이번 체크포인트 정적 검사

엔진 타입·테스트 타입 검사 종료0, 변경 TypeScript41파일 lint에서 테스트 미사용변수1건을 발견해 수정한 뒤 해당 lint 종료0, git diff --check 종료0. 실패/수정 로그는 evidence/M2-BULK-static.log에 함께 보존했다. 런타임·전체 npm run check·HTTP/DB/기기 검사는 아직 실행하지 않았다.

## 2026-10-28 최신화 후 경계 수정·검증 중

국내 복귀 KBO 목적 루트 revision은 max(미국 source revision, 국내 authority revision)+1이다. ownership의 authoritySourceRevision은 실제 국내 CAS 원본을 보존하고 authorityNextRevision은 합쳐진 목적 루트 revision을 가리킨다. 과거 목표의 selectedRevision/사건 sourceRevision은 재작성하지 않는다. US archive의 usArchivedRevision은 소유권 이동 당시 고정 영수증이며 이후 읽기 메타데이터 revision 증가로 재작성하지 않는다. source+1 인접 관계와 현재 revision 이하를 검증한다. 이 계약의 atomic transport는 계속 미구현이다.

E89 SET_GOALS만 현 PRE/등록/현재 시즌을 요구한다. 과거 ACK는 사건을 닫되 저장된 phase를 되살리지 않는다. 학교 목표 outbox 열람은 기존 year-end seal을 먼저 검증한 뒤 메타데이터 변경분을 재봉인한다. 일반 투수 숙적 resolver는 학교 year-end seal이 있으면 wrapper-required로 거절하며 학교용 검증·재봉인 wrapper를 사용한다.

## 최종 통합 검증 — 재개 묶음

이 문서의 위쪽 실행 대기/정적 검사 표기는 e26271b 당시 이력이다. 재개 수정 뒤 전체 check 종료0: 엔진/API844개 중842통과·실패0·Neon환경2건 건너뜀, 웹22/22·HTTP smoke 통과. 동결463파일 변경0, duration_ms171601.1983. 현재 엔진 경계 회귀 통과이며 실제 국내 세계 owner transaction·US 국제 owner·PS E84·99/24/PF-D 전체는 계속 남아 있다. 상세는 M2-RESUME-20261028.md와 evidence/M2-BULK-resume-check-final.log를 따른다.
