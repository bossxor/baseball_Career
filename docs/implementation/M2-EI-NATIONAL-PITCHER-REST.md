# M2-EI — 실제 세계일에 따른 대표 투수 휴식

2026-10-28. fetch 후 HEAD=origin/codex/m2-career-engine=c5d070e, 시작 WIP 없음. origin/main4885afc의 M6/별도 병역목표 변경은 확인만 했고 기존 지침에 따라 병합하지 않았다. 수정 대상 V 문서는 HEAD와 일치함을 확인했다. Ponytail/YAGNI, PC 종료/M6 수정 없음.

## 적용

국제 dayCloseVersion1의 teamFor가 검증된 INTERNATIONAL_PROGRESS.nextWorldDay를 koreaNationalTeam에 전달한다. 명단 투영에서 현재 시즌의 과거3세계일 기록을 한 번만 훑어 양수 BF의 선수별 등판일 집합을 만든다. 국내 정규/PS와 국제 등판을 포함하며 미래/당일/전년/BF0 등록은 제외한다. SP는 등판 뒤3개 세계일을 온전히 쉬어야 한다(예:96일 등판 뒤97~99일 휴식,100일 가능). 선발 피로60이상 제외는 유지한다. RP/CP는 전날과 전전날 모두 실제 BF가 있으면 휴식한다. 단순 최근2일 중1회 등판만으로 제외하지 않는다.

쉬는 SP가 부족하면 건강/휴식/선발 피로 기준을 충족한 기존 RP 오프너를 사용한다. 경기 snapshot의 SP 역할만 바뀌고 세계 선수의 영구 position은 유지한다. 충분한 선발/오프너가 없으면 NATIONAL_STARTER_REQUIRED로 원본 변경 없이 거부한다. 연봉/자연성장/구종XP 예산/대표 자격 수치는 변경하지 않았다. 최근 사용일 map은 호출 지역값이며 새 장기 캐시/복제 원장을 저장하지 않는다.

## 호환과 검증

날짜를 받지 않는 기존 수동 koreaNationalTeam/playCareerAsianGames 경로는 종전 회전/가용성 동작을 유지한다. 기존 pendingGame은 준비 API의 기존 거부로 재구성하지 않으며 chunk 재개는 저장된 팀/구종/seed를 계속 쓴다. 미래의 새 dayCloseVersion1 경기 준비만 실제 날짜를 사용한다. 저장 스키마/모델 버전/환경/의존성/내보내기 계약 변경 없음(선택적5번째 helper 인자만 추가).

새 회귀3개는 수정 전 SP 휴식·RP/CP 연투·오프너에서 모두 실패했다. 경계96/97~99/100, BF1·0아웃, 전년/미래/당일/벤치0BF, 하루 간격, 같은 source 불변, legacy 기본값/고피로 fallback, 후보 고갈을 검증한다. 투수 사용 이력은 통제 usage row이며 실제 여러 시즌 증거가 아니다. 기존 실제 AG16경기/14일→국내10경기와 WBC47경기/21일→캠프→개막도 집중 검사에 포함했다. 그 경로의 이전 국내 구간/진입은 각 기존 fixture 제한을 유지한다.

집중17/17 및 마지막 legacy 포함 새3/3·타입/lint 통과. 전체 npm run check 종료0: 엔진/API 781개 중779통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint/타입/build/엔진골든/이벤트/설계10종/Android셸/자산·HTTP 스모크 통과. duration_ms 1179771.366, 동결 대상456파일 재개 기준점 이후 변경0(이전 중단 기준과4파일 바이트 차이는 freeze.resumed 기록). 실제 Neon/브라우저/APK 검증은 아니다. 새 usage fixture에 PitchingTotals 필드가 빠진 타입 오류는 fixture를 완전한 타입으로 고쳤다. 실행 source를 동결하고 증거 M2-EI-*에 결과를 남긴다.

## 다음

KBO 출신 MiLB 계약 기간/미국 원점 history/callup/귀국 연결, 긴급 하위리그 대표 합류/미국 공통 후보, E61 성공 강등/navigation,99/24/PF-D는 남았다. MiLB 서명기간 종료 비교 결정은 이미 승인돼 다시 묻지 않는다. 이번 변경이 전체 M2나 24경로의 완료 증거는 아니다.

## 재개와 독립 검토 (2026-10-28)

사용자가 Caveman·Ponytail·Using Superpowers 적용과 재개를 지시했다. 이전 중단 실행은 완료 증거에서 제외하고 전체 검사를 새로 실행했다. 별도 읽기 전용 검토자는 날짜 검증, 실제 기록 키, 휴식 경계, 오프너, legacy 및 pendingGame 보존을 검토했고 지적 사항이 없었다. 검토자는 테스트를 실행하지 않았으며 실행 검증은 본 작업의 전체 로그가 기준이다.

중단 전 동결 해시와 재개 시 파일4개의 바이트가 달랐다. Git 의미상 변경은 예정된 national-progress 호출 한 줄뿐이며 index.ts/us-career-entry.ts/national-progress.test.ts는 Git diff가 없다. 새 검사 typecheck 단계에서 재개 기준 해시를 기록했다. 이전 중단 기준부터 바이트 변경0이라고 주장하지 않는다. 상세 해시는 evidence/M2-EI-source-freeze.json의 resumed에 남겼다.
