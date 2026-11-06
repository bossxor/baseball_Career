# Claude Code TF 운영

2026-11-07 KST 착수. 사용자 결정: Codex TF와 별개로 각자 팀을 꾸려 같은 목표를 병행한다. 이 문서는 Claude Code 팀만 다룬다. Codex 팀 기록은 [TF-OPERATIONS.md](TF-OPERATIONS.md).

## 작업 공간 경계

- Claude 팀 브랜치: `claude/tf-lead`(기준 `d71236b` = origin/codex/m2-career-engine 최신). 작업 폴더: `C:/Users/OJT/.codex/worktrees/dd-full-service/baseball_career`.
- Codex 작업 공간(`E:/AI/Game/baseball_career`, `baseball_m2_resume`, `baseball_m2_proof_d71236b`)과 그 미커밋 변경은 건드리지 않는다.
- 이전 Claude 브랜치 `codex/m2-service-closure`(f559d73)는 최신 원격에 다른 구현으로 흡수됐다(복무 경기일 복제 수정, 대학 조기 드래프트, 에이전트 확률). 참고용으로 보존.

## 팀 구성

| 세션 | 모델 | 역할 | 상태 |
| --- | --- | --- | --- |
| 00. TF팀장 | Claude Opus 5.5 (현 세션) | 총괄, SLB 직접 플레이, 통합·검수·Git | 진행 중 |
| 01. 문서관리 | Claude Sonnet 5.5 예정 | 설계·진행·결정·자산·벤치마킹 문서 정합 | 생성 제안 |
| 02. UI·UX | 필요 시 | 결정 카드·서명 의식·상단 헤더(백로그 P1) | 미생성 |
| 03. 엔진 | 필요 시 | P16 독립 준비/재도전 | 미생성 |

모델: 요청서의 GPT-6.1 Sol/Terra는 이 환경에 없다. Claude 세션은 Opus 5.5(판단·검수)와 Sonnet 5.5(일반 작업)로 대체한다. 세션 간 메시지는 Claude 세션끼리만 가능하며 Codex 채팅과는 Git·문서로만 공유한다.

## 2026-11-07 결과

- SLB Career 직접 플레이: 생성~프로 1년차. [기록](../benchmark/SLB_CAREER_PLAYTHROUGH.md).
- 로컬 승인 애니 장면 12종을 앱 장면에 적용. [자산 목록](../assets/ASSET_INVENTORY.md). 웹 테스트 50/50, 웹 빌드·verify:assets·verify:android·verify:design 통과. 375×812와 데스크톱에서 크롭 확인.
- 전체 `npm run check`는 이번 변경(CSS·문서)에서 실행하지 않았다. 엔진 코드는 바꾸지 않았다.

## 다음

1. 백로그 P1: 진로 결정 카드 형식 → P16 경로 화면과 함께.
2. P16 독립 준비/재도전 엔진(사용자 결정: 대학 구조 6팀·48경기·가칭 팀명, 범위 고교·대학 미지명). [인계](M2-P16-PREPARATION-HANDOFF.md)는 이전 브랜치에 있다.
3. 장면 PNG 파생 WebP.
