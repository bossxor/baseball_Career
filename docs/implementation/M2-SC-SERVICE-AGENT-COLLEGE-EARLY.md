# M2-SC 해외 복무·에이전트·대학 조기 드래프트 — 2026-10-28

기준 ef03ff9(origin/codex/m2-career-engine). E:/AI/Game/baseball_career의 미커밋 작업(22:02 마지막 수정)을 사용자 지시로 이어받아 별도 worktree 브랜치 codex/m2-service-closure에 옮겨 마무리했다. 메인 체크아웃의 미커밋 파일은 건드리지 않았다. DD 미추적 장시간 증거는 stage하지 않았다.

## 이어받은 작업과 첫 실패

[첫 집중 로그](evidence/M2-SC-focused-red.log): 47개 중 42통과·5실패.

- PS 숨김 특성 E84·학교 US 연말 관계 재봉인·US 레벨/E61·해외 복무 동결/해지/전역/30게임일 복귀옵션: 통과.
- us-service-world: 복무 연도 실제 NPC 경기일 마감이 원본 루트를 변경. 원인: `cloneUsCareerForGames`가 `military`를 복사하지 않아 `recordUsMilitaryClosedDay`가 공유 `service.cursor`를 직접 변경. 복무 분기에서 `military`를 복사한 뒤 기록하도록 수정.
- career-agent P15: 재계약 요구 확률이 부동소수 합산으로 0.6799…. 정수 bps로 계산 후 나누도록 수정(.60/.68 정확).
- college-route 3건: 기능 소스 없음(RED만 존재) + 통제 fixture의 능력 덮어쓰기가 기존 평가 범위/성장 기준과 충돌. fixture에서 평가와 성장 기준을 덮어쓴 선수로 재생성.
- 첫 전체 검사는 lint 6건으로 중단([로그](evidence/M2-SC-check-lint-red.log)). 미사용 변수/`any`를 정리.

## 새 구현 — 대학 2학년 조기 드래프트(43, E73/E74)

- 2학년 완료 확인 시 E73 차단 사건을 부착한다. 이미 조기 시도한 재학생에게는 다시 부착하지 않는다.
- `enterCollegeEarlyDraft`: E73 ENTER_EARLY_DRAFT. 나이/기록/재학 상태는 그대로, `earlyDraftAttempted:true`, 기존 KBO 드래프트 경로(CAREER_ROUTE)를 연다. 재학당 1회.
- 미지명 결과 또는 지명 후 계약 거절은 E74를 부착한다. `returnUnsignedCollegeCareer`가 E73 재학 유지와 E74 복귀를 모두 ADVANCE_ACADEMIC_YEAR로 닫고, 조기 모집 원장을 `previousKboRecruitments`에 보관한다. 이후 기존 연말/다음 학년 명령으로 3학년에 들어간다.
- 계약 체결은 재학을 `LEFT_FOR_PRO`로 끝내고 기존 KBO 연말/프로 진입 명령을 그대로 사용한다. 체결 후 학교 복귀·학년 진행은 등록 오류로 거절한다. 이 상태 전환은 모집 원장 sourceBasis 변경으로 보지 않는다.
- 졸업 드래프트는 같은 assessmentKey가 없을 때만 새로 연다. 조기 시도 기록이 있어도 졸업 기회는 독립적이다.
- 66 준비 예산 차감은 없다. OPEN_US_IF_VALID 탐색은 기존 화면 탐색이며 새 도메인 실행이 없다.
- 기존 4학년 경로 테스트는 2학년 뒤 E73 재학 유지를 명시하는 `nextCollegeYear` fixture를 사용한다.

## 검증

소스 동결 후 [전체 npm run check](evidence/M2-SC-check-green.log) 종료0: 엔진/API 864개 중 862통과·실패0·Neon환경 미설정2건 건너뜀, 웹22/22. lint·타입·build·엔진골든·이벤트·설계·Android셸·자산 통과. 엔진/API duration_ms 302274.4635. [HTTP smoke](evidence/M2-SC-smoke.log) 통과. 실제 브라우저/Neon/Android 기기·24경로 통과는 아니다.

## 남은 M2

감사 문서 [M2-CLOSURE-AUDIT-20261028](M2-CLOSURE-AUDIT-20261028.md) 기준 우선순위: 독립 준비/재도전(P16), 고교 직행 미국 국내 복귀(P10), 대학 휴학·복무(P12/E76), 도전 A01~12(P14/E90), 포지션 준비·투수 역할 요청(E12~15), 미국 국제대회 owner·국내 세계 atomic handoff, 99사건/24경로/PF-D 실제 증거. 에이전트는 KBO 재계약 경로만 연결됐고 급여 지급 hook(settleAgentFee)의 실제 payroll caller 연결은 후속이다. M2 전체 완료 아님.
