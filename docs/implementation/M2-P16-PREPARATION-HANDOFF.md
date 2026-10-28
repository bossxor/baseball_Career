# M2 P16 독립 준비/재도전 — 착수 인계 (2026-10-29)

구현 코드 없음. 설계 66과 현재 엔진을 조사하고 사용자 결정 2개를 받은 상태에서 세션을 마감했다. 기준 브랜치 codex/m2-service-closure(deeb61d).

## 사용자 확정 (2026-10-29)

- 독립리그 구성: 대학리그 구조를 재사용한다. 6팀, 팀당 정규 48경기, 대학과 같은 일정/로스터 생성기, NPC는 대학 수준. 팀 이름은 가칭(예: 독립A~F), 로고 없이 텍스트만. 성적 보정 D=-20은 66 그대로.
- 이번 범위: 고교·대학 졸업 미지명만. E06 → 준비 시즌 → 재평가 → E07 계약 / 다음 준비 / 3회 소진 시 E35 은퇴. 프로 방출·계약만료(E34)와 미국 귀국 준비(E68)는 후속.

다시 묻지 않는다. 설계 문서(docs/design) 반영은 manifest 갱신과 함께 한다.

## 조사 결과 — 재사용 지점

- 학교 시즌 기계(advanceSchoolCareer, 훈련, 프리시즌 확정, 일 마감, 경기 기록)는 world.leagueKey로 일반화돼 있다. `leagueKey??'HS'` 사용처는 INDEPENDENT에서도 그대로 동작한다.
- 실제 분기 수정이 필요한 곳(`leagueKey==='COLLEGE'`):
  - high-school-career.ts 97/102/105: 등록 검증. assertIndependentCareerRevision 추가와 assertSchoolCareerRevision 분기.
  - high-school-career.ts 163: 계획 변경 시 성장(대학형)과 동일 처리.
  - high-school-emergency.ts 24/35/47: 임시 선수 키·나이(대학형).
  - high-school-growth.ts 90: 성장 분모(66: 43 대학 분모 공유).
  - high-school-assessment.ts 17: 다년 평가 seasonYear(대학형).
  - high-school-progress.ts 79: E02/E03은 고교만 유지.
  - high-school-traits.ts 59, career-kbo.ts 18/25/49, career-us.ts 23/38/56/60: 진로 평가 점수와 서명 분기.
- high-school-world.ts의 `leagueKey?:'COLLEGE'` 타입에 'INDEPENDENT' 추가 필요.
- 고교 흐름은 E04가 진로 확정까지 열려 있어(routeSource는 열린 사건 1개만 허용) E06 부착 시 E04와의 관계를 먼저 정해야 한다. 대학 졸업은 E75 해결 뒤 CAREER_ROUTE라 E06 부착이 단순하다.
- prepareCareerKboDraft는 assessmentKey(시즌별) 중복만 막으므로 준비 시즌 뒤 재평가는 기존 명령을 재사용할 수 있다.

## 다음 구현 순서 제안

1. createIndependentWorld(대학 생성기 재사용, leagueKey INDEPENDENT, 나이 범위 확장)와 위 분기 정리.
2. careerPreparation 원장(used≤3, episodeId, 시즌별 기간, usageCharged, evidenceReceipt).
3. 미지명 결과에서 E06 부착, 준비 시작 명령(연말 마감+독립 세계 활성화 원자 처리).
4. 준비 시즌 완료 시 사용 1 차감(재시도 중복 0), 재평가 드래프트(성적 D=-20), E07 계약 / 재도전 / 소진 시 E35 은퇴 보관.
5. RETRY01/02/05/06/08/09/10 회귀부터 작성(RED) 후 구현, 전체 check.
