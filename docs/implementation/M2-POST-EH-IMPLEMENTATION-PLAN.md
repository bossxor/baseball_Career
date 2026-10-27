# EH 이후 연결 계획 — 미구현 항목, 완료 증거 아님

2026-10-27. EH full gate 중 읽은 호출자/원장 경계와 새 사용자 결정을 다음 작업자에게 넘긴다. 이 문서 자체는 기능 구현이나 PASS가 아니다.

## 미국 계약 원점

사용자 확정: KBO 포스팅/해외FA MiLB는 서명 기간 종료 후 미국 재계약/FA/국내 복귀 비교. 고교 직행6시즌 보유를 추가로 적용하지 않는다.14/23이 기준.

우선 kbo-us-activation.ts의 새 계약 controlSeasons6과 UsCareer.contract의 UsDirectSigning literal6 상속을 분리해 검토한다. 고교 직행의6은 그대로 둔다. signed offer.years·원금·예산 예약·과거 급여/등록일/국내 복귀권을 임의 재산정하지 않는다. 기존 KBO root를 단순 조회해서 수정하지 말고 앞으로의 만료 판정을 서명 기간과 일치시키며 읽기/쓰기 호환 검사를 남긴다.

usYearTransitionReadiness는 EG에서 KBO 미국 시작 시즌을 읽도록 고쳤으나 전체 연도 이행은 아니다. usCareerView의 KBO_TRANSFER early return은 여전히 초기 offer의 annualSalaryUsd/years/activation.contractKey와 비교해서 콜업/연간 재계약이 막힐 수 있다. us-major-history.ts의 openingUsMajorYear, us-minor-history.ts의 openingUsMinorInventory, us-season.ts의 usSalaryEntitlement는 고교 usRecruitment/signing에 의존한다. 이 세 원점을 공통으로 연결하고 그 재생에 필요한 불변 초기 계약/예산/시즌/나이 근거를 보존해야 한다. 현재 시즌 live 값에서 과거 지급액/초기 예산을 역추정하지 않는다. 새 저장 필드가 필요하면 기존 root는 연간 활성화 전까지 호환되도록 처리하고 읽기만으로 유령 원장/seed/급여를 만들지 않는다.

계약 비교·국내 복귀에는 kbo-return.ts/23의 출처별 권리와 유효 미국 계약 정리가 필요하다. 원래 KBO snapshot의 낡은 선수를 그대로 귀국시켜 미국 경력 성적/나이/부상을 잃지 않도록 실제 US root를 연결한다. 연봉/제안 수/확률의 미정 값이 나오면 물어본다. 근거 없는 새 수치를 이 계획에서 정하지 않는다.

## 대표팀 투수 휴식

사용자 확정: RP/CP 실제 이틀 연속 등판 뒤 다음 날 휴식. BF0·벤치 등록·휴식일을 등판으로 만들지 않는다. SP의 기존 최소3세계일 휴식은 유지.20/14가 기준이다.

koreaNationalTeam(national-tournament.ts)은 현재 건강/선발 피로60·회전만 보며 recentOuts0을 넣는다. 실제 대표 경기 날짜에 최근 등판 기록을 읽도록 national-progress.ts의 teamFor→koreaNationalTeam 호출을 연결한다. 같은 세계의 직전 국내 공식 등판도 확인할 것. 세계일과 팀 경기 수를 혼동하지 않는다. 미래/다른 시즌 기록을 휴식 근거에 섞지 않는다. 이미 준비된 pendingGame의 선수/구종/seed를 수정하지 않는다. dayCloseVersion 없는 구 수동 helper/통제 fixture를 새 worker 증거로 승격하지 않는다.

기존 레코드 조회/정렬 helper가 있으면 재사용하고, 필요하면 최근3일 내 기록을 한 번만 스캔해 선수별 사용일 집합으로 투영한다. 과거 전체 원장을 선수마다 재집계하는 새 캐시/영수증은 만들지 않는다. 선발 불가 때 RP 오프너의 실제 경기 role과 세계의 영구 position을 구분한다. 불펜 피로 제한에 새 숫자가 필요하면 기존 규칙을 먼저 확인하고 미정일 때만 질문한다.

## 부상 교체의 남은 긴급 합류

EH는 봉인된 scores 안의 역할별 후보로 교체한다. 최초 선발에서 자격 필터에 빠진 하위리그의 건강한 긴급 선수 합류는 아직 없다. 기존 선발 점수/lotRank를 전체 재추첨하지 않는다. 최초 명단과 중간 admissions/replacements를 시간순으로 재생할 근거 없이 scores를 덧붙이면 과거 선발/교체 결과가 바뀔 수 있으므로 주의한다. 가짜 한국 스타 생성 금지. 후보가 정말 부족하면 원본 유지 오류로 멈추며 신규 합류 전부터 과거 출장/피로/XP를 부여하지 않는다. 미국 후보의 국적 부재를 전부KOR로 추정하지 않는다.

## 사건·실행 증거

E61: us-levels-windows.test.ts에는 승격/콜업과 Rookie 최하위 보류는 있지만 성공 CONFIRM_DEMOTION 호출은 찾지 못했다. 실제48경기/2저조 검토의 통제 출처와 명단 교환·salary/옵션·JSON 재개·stale quote를 집중 검증한다. OPEN_RIGHTS는 resolveEventChoice에서 navigation인데 resolveUsLevelEvent의 !choice.domain이 US_RIGHTS_VIEW_ONLY를 던진다. 기존 UsCareer 반환 호출자를 확인한 뒤 navigation 계약을 연결하며 호출자 타입을 무작정 union으로 넓혀 주변을 깨뜨리지 않는다.

E49~54, E08/E58/E59/E60은 사건 감사의 부분 엔진 증거다. 원문 정의/ACK/참조 문자열만으로 나머지99 완료를 선언하지 않는다.24경로의 end-to-end-design-paths.json은 실제 경로 해시와 불변조건 보고가 있어야 바꾼다. PF-D는D01~15이며 구단P17~21(M6), 실기기P22, 혼합P24는 별도 범위다.

## 이어서 작업할 때

HANDOFF-TO-GPT/NEXT-SESSION 최신 핀→이 계획→원문14/20/23→관련 코드/테스트 순으로 읽는다. exact checkout/own branch 유지. 묶음 집중 검사 후 끝에 full check1회, 실행 중 source 동결, docs/evidence 갱신·V: Copy-Item·커밋/푸시. 원본/저장/seed/실제 원장 보존, PC 종료/M6 병합/강제푸시/훅스킵 금지. M2 전체 완료 아님.
