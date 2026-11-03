# 미국 다음 해·마이너 계약 API — 2026-11-03

작업 E:/AI/Game/baseball_career, codex/m2-career-engine. 시작3e21710, fetch 후 원격0/0. 사용자 M2 끝까지 계속 요청으로 이전 잔여5% 자율 중단 지침을 해제했다. 사용량 초기화·PC 종료는 하지 않는다.

## 구현 묶음

career-us-play-shell.ts에 CAREER_US_PLAY_NEXT_MINOR_YEAR, OPEN_MINOR_MARKET, RESOLVE_MINOR_MARKET, ACCEPT_MINOR_OFFER 4명령을 추가했다. 클라이언트는 careerRevision·선택 식별자·사건 버전만 전송한다. 연간 조직/잔액은 실제 owner에서 가져오며, 이미 열린 quote의 봉인된 funding은 그대로 재사용한다. 새 annual grant는 추정하지 않고 추가0으로 현재 잔액을 이월한다. 서버의 별도 연간 지원 정책/등록은 여전히 필요하다면 후속 명시 구현 대상이다.

US_CAREER는 실제 SEASON_REVIEW에서만 읽기 yearTransition(기존 blocker/목표 연도)을 반환한다. minorMarket는 기존 공개 제안 view와 실제 소유 사건 key/version을 반환한다. 잔여 계약이면 다음 해, 실제 만료라면 비교·탐색·명시 수락으로 이어진다. 자동 보장/강제 제안/가짜 돈/수입 재생성은 없다. 엔진/rules 제품 코드는 변경하지 않았다.

## 묶음 검증·리뷰

기존 일반 US/창 처리와 새 연말 진입4/4, 실패0. lint·전체 테스트 타입·API build 종료0. 이어 추가한 만료 계약 실제 견적·탐색·서명 회귀1/1 및 테스트 lint/타입 종료0. 전자는 제어 완료 시즌의 실제 다음 해 writer·나이 증가·기록/수입 보존·JSON 재개·caller funding 거부를 확인했다. 후자는 기존6개 제어 US 시즌을 거친 owner에서 현재 예산으로 실제 견적, 소유 사건 탐색, 위조 계약 거부, 실제1년/30000달러 계약 수락·원본 보존을 확인했다. native6년 또는 대형 HTTP DB 저장 증거는 아니다.

읽기 리뷰에서 조치할 데이터/권한/호환 문제 없음. 증거: evidence/M2-20261103-us-year-api-check.log/.json, us-market-api-check.log/.json. 전체 장기 검사를 반복하지 않았다. 모든 검사 세션 종료. 최종 커밋은 git log -1, 원격은 ls-remote로 확인한다.

## 다음 필수 구현

1. PS 개시 서버 소유 AL/NL 고정 registry와 실제 PS 진행 API. 설계13의168행은 서버가 각15개 고정 소속을 제공하도록 한다. 현재 세계 조직에는 이 소속이 없으며 기존 테스트는 제어 배열을 전달한다. 조직 배열을 임의15개씩 나누어 정식 membership으로 삼지 않는다. 실제 소속을 저장·봉인하는 생성 경로부터 연결해야 한다.
2. 메이저 계약 연말/FA·후속 연도 입구, 실제 웹 화면의 엔진 명령 연결.
3. 대용량 저장 방식/실제 PostgreSQL 검증, 99사건·24경로·PF 잔여. 기존174MB PGlite UPDATE 메모리 부족은 미해결이다.

M2 전체 완료 아님. 이전 상세는 M2-US-MILITARY-API-20261103.md와 M2-RESUME-ENVELOPES-20261103.md. 기존 DD 미추적 자료/.superpowers 보존. PC 종료 금지.
