# M2-EE — 국제 단계·연속 날짜·복귀 감사

2026-10-27. 기준 f46f1ec(ED 기능 d9a48b6). fetch 뒤 HEAD와 원격 작업 브랜치 일치, 시작 작업 트리 깨끗. main/M6 병합 없음. 현재 M2 전체 완료 아님.

## 변경과 호출 흐름

startNationalTournament가 INTERNATIONAL_PROGRESS와 원래 단계/등록 날짜를 보존한다. 신규 대진은 dayCloseVersion1·연속 dayReceipts를 사용한다. 경기 있는 날 모든 FINAL을 마감한 뒤에만 다음 날짜로 간다. 휴식일도 마감한다. 마지막 경기 직후 메달을 먼저 봉인하지 않고 대회창 마지막 날까지 마감한 뒤 INTERNATIONAL_REVIEW와 E46~E48 결과를 봉인한다. E48에서 감사가 통과해야 원래 단계로 복귀하고 정규 nextWorldDay를 국제 endDay로 잇는다. 일반/PS/연말 명령은 단계 검사로 우회하지 못한다. phase만 되돌린 불완전 저장도 거부한다.

국제 day closer는 KBO closer를 호출하지 않는다. 정규 기간 안의 국제 날짜만 동일 days 원장에 전용 증거로 연결하여 연속 날짜/정규 성장 재활 상태를 유지한다. WBC/P12처럼 정규 밖 날짜는 국제 원장에 보존하고 정규 day closer에 넣지 않는다. P12 이후 건강 변화는 정규 말일 상태를 역산할 때 국제 영수증까지 고려한다.

실제 한국 선수 출장만 부상 잔여경기를 소모하고, 비참가자/휴식일은 피로 휴식만1회 적용한다. 새 날은 경기키·최종 점수·28명 신원·건강 영수증·정규 원장의 동일 결과를 교차 검사한다. 국내 등록 급여/연차/자연 성장/복귀6경기 카운트를 국제 날에 새로 지급하지 않는다. 신규 날짜 영수증의 키는 competitionId+day, 건강은 gameKey+대회:KOR다. full GameContribution을 별도 원장에 다시 복제하지 않는다.

Grok DY의 FINAL 구종XP commit이 얕은 root 복사 뒤 원본 world.repertoires/Sangmu 멤버를 바꾸던 참조 공유를 고쳤다. 변경하는 repertoire map과 멤버만 소유 복사한다. 날짜 마감은 전체 world/health/과거 원장을 깊게 복제하지 않고 선수 map·변경 선수만 복사하며 기존 순수 health reducer를 사용한다. 매 FINAL/날짜 마감 전후 원본 canonical equality를 검사한다.

## 호환과 검증 범위

dayCloseVersion이 없는 ED 이전 대진은 기존 수동 처리 계약으로 읽기/진행한다. 과거 경기·seed·구종XP·부상 추첨을 소급 재생성하지 않는다. 기존 저장을 읽는 것만으로 새 날짜 영수증을 만들지 않는다.

최종 집중22/22 통과. 전체 npm run check 종료0: 엔진/API 769개 중767통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 633942.4905, 동결 대상454파일 변경0(비문서 파일·기존 root/evidence 포함). 실제 Neon/브라우저/APK 검증은 아니다. 증거는 evidence/M2-EE-*다. AG의 실제28명·16경기·14일 마감·E48 복귀 후 실제 다음 국내 날짜를 검사했다. 대회 전 정규 날짜는 CONTROLLED_PREFIX이며 전체 정규 시즌 완주가 아니다. 기존 DX107 통제55도 실제 커리어 증거로 승격하지 않는다.

초기 테스트는 캠프 확정 전 능력을 바꾼 fixture와 없는 finance 필드, 복귀 첫 휴식일을 경기일로 가정해 실패했다. fixture 준비 순서와 실제 다음 일정 조회를 수정했고 게임 수치/추첨을 바꾸지 않았다. 실패 로그를 보존한다.

## 남은 것과 질문

WBC는 설계상 정규 개막 전인데 calendar-1의 WBC2월8일과 KBO/미국 정규2월1일이 충돌한다. 사용자에게 새 시즌 정규를 WBC 종료 후 배치할지, WBC를1월11~31일로 앞당길지 질문했다. 답변 전 날짜를 바꾸지 않는다. 신규 WBC start는 실제 정규 일정과 충돌하면 NATIONAL_PRESEASON_DATE_CONFLICT로 원본 변경 없이 거부한다. WBC 기용/캠프 재개 전체 E2E 완료 아님.

P12 새 start는 양PS actualWindow를 요구하고 로컬 KBO POSTSEASON 기록 말일·day ledger를 대조한다. 미국 PS 종료 근거/공통 후보 풀은 후속이며 외부 숫자만으로 공통 세계 완료를 주장하지 않는다. P12/WBC 실제 경로·초청 자동 시계·군 복무 공유 달력·부상 교체·미국 공통 풀·99사건·24경로/PF-D는 남았다. M6 수정/PC 종료 금지. V: 문서만 Copy-Item.

99사건 후속 검수: E46은 현재 sealNationalCompetitionResult에서만 큐를 열어 대회 끝까지 지연된다. 실제 첫 FINAL 직후 알림 트리거는 후속이며 기존 결과봉인 테스트의 통과와 구분한다. 포스팅 E62~64는 실제 root/evidence EB 로그/4개 도메인 테스트를 확인했지만 수동 입구이고 자동 오프시즌/UI/실제7시즌 증거는 아니다.
