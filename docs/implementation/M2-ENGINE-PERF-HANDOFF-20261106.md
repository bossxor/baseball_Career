# 엔진 성능 인계 — 미국 시즌 진행 (2026-11-06)

## 측정 환경
임시 하네스(미커밋): `preparedUsCareer → startUsRegularSeason → advanceUsCareer/advanceUsCareerRun`, `node --cpu-prof`. 기계는 다른 작업과 공유되어 수치에 잡음이 있다.

## 프로파일 결과 (기준 HEAD)
- 27일 1304초(하루 약 48초), 호출 775회. 후반 둔화 없음(10일 구간 449초 → 471초). 병목은 누적이 아니라 **advance 호출당 고정 검증**(약 1.7초).
- 상위: `assertUsSeason` 41%(달력 8790경기 재계산 + canonicalJson 2회 + `assertUsCareerRevision` 중복), `assertUsCareerRevision` 17%(usCareerView → assertUsAmateurYearEnd), `prepareSchoolCompetitionGame` 19%(라인업 DP, `basisWorld` 직렬화), `structuredClone` 16%. 실제 경기 시뮬은 11%.

## 적용한 최적화 (결과·저장 형식 불변)
1. `assertUsSeason`: `assertUsCareerRevision` 1회만; 재계산 달력의 canonical 문자열 1건 메모(`us-schedule.ts`, 저장된 일정 쪽은 매번 새로 비교).
2. `advanceUsCareerRun(c,revision,dayBudget,deadlineMs)` (`us-season.ts`): API span 루프와 같은 연쇄, 전체 검증은 입구·출구 1회씩. 기존 `advanceUsCareer` 불변.
3. `automaticFieldLineup`: 후보×슬롯 점수 메모(`lineup.ts`).
4. `putGameContribution(…,shareExisting)`/`commitSchoolCompetitionGame(…,shareRecords)` 선택 인자: 미국 경로만 기존 기록 행 깊은 복제를 생략. 기본값은 기존 동작.

## 수치 (미국 3일, 동일 fixture)
기준 100.3초 → 검증/메모 69.8 → 배치 49.5 → 라인업 메모 35.4 → 행 공유 24.0초(-76%, 하루 약 8초). 상태 해시 `5e0d30eb6cd995b5`는 반복 호출 방식과 동일. 시즌(약 180일) 환산 약 24분, 기준은 약 2.4시간.

## 미적용·다음 후보
- 배치 경로를 쓰도록 `apps/api/src/career-us-play-shell.ts:43` `advanceUsSpan`을 `engine.advanceUsCareerRun(c,revision,span==='MONTH'?30:1e9,until)`로 교체(m2-web 담당, 반환형 `UsProgressResult`, `daysClosed`는 누적).
- 남은 하루 약 6초 오버헤드: `automaticFieldLineup` DP 할당(약 3초/3일), `basisWorld` canonicalJson 생성·비교(약 2초/3일), `closeDay`(1.7), `cloneUsCareerForGames`(1.1), 상 기록 관찰(1.0), 경기 시뮬 바닥(약 1.9초/일).
- 저장 형식 변경이 필요한 안(`basisWorld`를 해시로 저장)은 하지 않았다. 호출당 처리량(1000타석/20이닝) 확대는 API 정책 결정.
- KBO/대학은 프로파일하지 않았다. 같은 패턴(입구·출구 1회 검증)을 적용할 후보.

## 미검증
KBO·대학 속도, 시즌 전체(180일) 실측, 병렬 부하에서의 수치. 목표(하루 1~3초)는 미달성.
