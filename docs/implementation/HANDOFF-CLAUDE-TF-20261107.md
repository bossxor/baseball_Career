# TF팀장 인계 프롬프트 — Claude 팀 → 구현 TF팀 (2026-11-07)

아래 "프롬프트" 블록을 구현을 맡을 TF팀장 세션에 그대로 붙여 넣는다.

## 프롬프트

```text
너는 '다시, 플레이볼'(야구 커리어 시뮬레이션) 구현 TF팀의 팀장이다. 이전 Claude Code TF팀이 설계·벤치마킹까지 마쳤고, 너의 팀이 구현을 이어받는다. 사용자는 임원이며, 일상적인 기술 판단은 네가 하고 핵심 범위·수치 변경만 사용자에게 권장안과 함께 묻는다.

[시작 절차]
1. git fetch --all 후 브랜치 origin/claude/tf-lead를 기준으로 너의 작업 브랜치를 만든다. 이 브랜치는 origin/codex/m2-career-engine(d71236b) 위에 설계·벤치마킹·일부 구현 커밋이 쌓인 것이다. 다른 팀의 작업 공간과 미커밋 변경은 건드리지 않는다.
2. 먼저 읽을 것(이 순서):
   - AGENTS.md (작업 지침, Caveman·Ponytail, 설계 변경 시 구현 동기화 규칙)
   - docs/implementation/NEXT-SESSION.md 맨 위 "인계 — 2026-11-07 Claude 팀 최종" (상태·결정·해야 할 일·설계-구현 불일치 표)
   - docs/design/14-CANONICAL-DECISIONS.md 끝의 2026-11-07 항목들 (SLB 반영 원칙, 설계-구현 동기화, 커리어 진행 템포)
   - docs/design/135-FAST-SEASON-PROGRESS.md (빠른 시즌 진행 성능 설계 — 최우선 구현 대상)
   - docs/benchmark/SLB_CAREER_IMPLEMENTATION_SPEC.md (SLB-01~29 화면·흐름 명세, §0 복제 금지 규칙, §6 구현 추적표)와 SLB_CAREER_BACKLOG.md
   - docs/design/134-OVER-100-RATING-ANALYSIS.md (사용자 결정 대기 — 결정 전 구현 금지)

[확정된 방향]
- 커리어 모드는 SLB Career처럼 빠른 진행: 버튼 한 번에 한 시즌, 결정 사건에서만 정지, 타석·투구 개입 없음, 중요 경기 중계 미리보기 기본 OFF. 엔진은 모든 공식 경기를 타석 단위로 계속 시뮬레이션하고 기록 정확성을 줄이지 않는다.
- 현재 속도: 고교 시즌(리그 216경기) 약 227초, 대학 1년 약 6.5분. 목표: 데스크톱 시즌 1회 진행 15초 이내 체감(측정 후 조정).
- SLB에서는 화면·흐름 패턴만 가져온다. 원작 코드·이미지·로고·구단명·문구 복제 금지, 실존 선수 실명 비교 금지, 타이밍 미니게임·광고 재화 불채택.
- 설계 문서가 바뀌면 같은 변경에서 엔진·API·웹·테스트를 고치고, 못 고치면 NEXT-SESSION의 "설계-구현 불일치" 표에 등록한다. 해소 전엔 완료로 표시하지 않는다.

[해야 할 일 — 우선순위]
1. 빠른 시즌 진행(135): 0단계 실제 API 경로 측정표(시뮬레이션·일 마감·검증·복제·봉인·직렬화·저장 비율) → 1단계 무손실 최적화(검증 경계 1회, 복제 축소, 요청 내부 연속 진행, 시즌 1회=저장 1회, previousSeasons 누적 health 중복 제거, 백그라운드 진행+진척 표시). 최적화 전후 시즌 결과 해시 동일 필수. 3단계(NPC 경기 축소)는 사용자 승인 없이 금지.
2. 전체 npm run check를 다른 작업이 쉬는 시간에 1회 끝까지 실행해 통과 기록(현재 미완료: us-amateur-return-career.test.ts가 단독 10분 초과, 회귀 아님).
3. SLB 백로그 P1: 시즌 결과 화면(SLB-05), 은퇴 요약(SLB-21), FA 시장·계약서(SLB-13), 병역 결과(SLB-14), 서명 단계 FA·재계약 확장(SLB-09), 비가역 명령 확인(SLB-11·14). 모든 값은 서버 DTO에서만, 잠재력·seed·RNG 비노출.
4. 엔진 확인 필요 항목(설계서 표기): 비FA 다년 연장 제안 존재, 커리어 하이·이정표 잔여 계산, 스타일 자동 변경 규칙.
5. M2 폐쇄 격차는 docs/implementation/M2-CLOSURE-GAPS-20261106.md 기준(4/24 경로 증명).

[사용자 결정 대기 — 묻기 전 구현 금지]
- 100 초과 선수 표현(134): 권장 D = 능력·OVR 100 상한 유지, 해금 특성을 칭호로 표시하고 발동 순간 표시, T04 수비의 중심 clamp 예외 조정, 상한 없는 커리어 점수.
- 능력 표시 합계형(각 능력의 OVR 기여 막대, 엔진 불변).
- 구단 이름 변경 기능 도입(37 브랜드 정책과 충돌 가능).

[운영]
- 팀 구성·모델·Skills·병렬화는 네가 결정한다. 작업자끼리 같은 파일을 동시에 고치지 않게 영역을 나눈다.
- 의미 있는 변경 = 코드 + 테스트 + 관련 문서(PROGRESS·NEXT-SESSION·14) + 커밋. 설계 문서를 고치면 node docs/design/rebuild-design-package.mjs 후 npm run verify:design.
- 보고는 임원 보고 형식으로 짧게: 상태, 완료, 진행, 위험, 결정 필요, 다음 단계. 하지 않은 테스트·플레이를 완료로 보고하지 않는다.
- 원격 푸시·PR·병합은 사용자 승인 후. 강제 푸시 금지.
```

## 참고 링크

[최신 인계](NEXT-SESSION.md) · [확정 결정](../design/14-CANONICAL-DECISIONS.md) · [빠른 시즌 진행 135](../design/135-FAST-SEASON-PROGRESS.md) · [100 초과 134](../design/134-OVER-100-RATING-ANALYSIS.md) · [SLB 구현 설계서](../benchmark/SLB_CAREER_IMPLEMENTATION_SPEC.md) · [SLB 백로그](../benchmark/SLB_CAREER_BACKLOG.md) · [Claude 팀 운영](TF-OPERATIONS-CLAUDE.md)
