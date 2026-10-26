# M6 이어가기 안내 (구단 모드) — 2026-10-26

다른 환경에서 M6를 이어갈 때 이 문서부터 읽는다. M6-A~D는 브랜치 `m6/club-mode`에 있고 main에는 아직 병합되지 않았다(병합 여부는 사용자 결정).

## 먼저 할 일

1. `git fetch` 후 `m6/club-mode`를 받아 그 위에서 작업한다(`git switch m6/club-mode`, 또는 `git worktree add ../baseball-m6 m6/club-mode`). 다른 환경의 미커밋 파일이 같은 폴더에 있으면 별도 worktree를 쓰고, 커밋은 `git add -A` 대신 **경로를 지정해서** 한다.
2. `npm ci` → `npm run build --workspace @playball/rules` → 엔진 테스트는 `packages/engine`에서 `npx tsx --test test/<파일>.test.ts`로 돌린다(프로젝트 루트의 `npm run check`는 25~30분).
3. 읽을 순서: 이 문서 → [M6-D](M6-D-CLUB-YEAR.md) → [M6-C](M6-C-CLUB-LINEUP.md) → [M6-B](M6-B-CLUB-IMPORT.md) → [M6-A](M6-A-CLUB-GAME.md). 설계 원문은 `docs/design/05-CLUB.md`(구단 규칙), `25`, `36`(치트), `44`, `08-FORMULAS.md`(계약/재정 구제), `115`(오프시즌 순서), `118`.

## 코드 위치 (packages/engine/src)

kbo-club-game.ts(뿌리·읽기·라인업 검사/적용) · kbo-club-import.ts(보관 투입) · kbo-club-progress.ts(시즌 진행) · kbo-club-postseason.ts · kbo-club-year.ts(연말 마감/다음 시즌) · kbo-club-manage.ts(1군 편성·FA 제안). 테스트: test/kbo-club-*.test.ts. 공유 코드를 건드린 곳은 추가만: `high-school-game.ts`(`lineupOverrides`), `kbo-game-world.ts`(빈 주인공 키), `kbo-year-end.ts`(`closeKboNpcSeasons` export), `kbo-roster-repair.ts`, `kbo-fa-market.ts`(`userClub`).

## 남은 M6 작업 (권장 순서, 가까운 것끼리 묶어서 구현한 뒤 한 번에 검증)

1. **재정 재건 구제(08)와 급여 상승 점검**: 통제 5회 오프시즌에서 급여가 예산 상한 근처까지 오른다(M6-D 관찰). 08의 '재정 재건' 선택(보장액 유지, 해당 다음 연도 예산만 필요한 최소액까지 확대+지원 기록)을 `world.finance.grants`로 구현하고 AI/사용자에게 같은 규칙으로 적용한다.
2. **내 구단의 재계약·방출·트레이드 선택(S14/S17)**: 지금은 내 구단의 만료 계약도 AI 재계약을 따른다. 사용자가 선수별로 재계약/FA 방출을 정하게 한다(보장액은 05/08대로, 방출해도 당해 연봉 100%).
3. **불펜 역할 배정(CP1/SU2/MR4/LR1)**: 엔진은 현재 SP/RP/CP만 안다. 역할 필드와 경기 적용을 추가한다(공유 경기 엔진 변경이므로 M1 골든 해시를 깨지 않게 옵션 필드로).
4. **구단 모드 승강 사건·뉴스**: 부상 대체 콜업 추천, 로스터 부족/계약 만료 자동 중지, 무관한 타팀 사건은 뉴스로만.
5. **구단 모드 저장/API/화면 연결(S12~S19)**: M3(저장 명령 파이프라인)·M4/M5(화면)와 만나는 지점. `apps/web`는 `PlayballApi` 경계만 보고, 새 명령은 `commandId` 멱등을 지켜야 한다. 서버 쪽은 M3 문서(`M3-COMPLETE.md`)를 따른다.
6. **12개 장기 시뮬레이션 계획과 균형 판정(M6 게이트)**: 실제 경기를 치르는 장기 실행은 시즌당 약 10분이므로 백그라운드 실행기와 중간 저장/재개(예: M2 DD 실행기 패턴)를 먼저 만든다. 통제 상태(경기 없음) 결과를 균형 근거로 쓰지 않는다.
7. 그 외: 구단 모드 병역(상무/현역) 연결, 구단 모드 국제대회, 구단 AI 전략 라벨(68).

## 작업 규칙(이번 세션에서 확인된 방식)

- 구현을 3~5개 묶어 만든 뒤 **집중 테스트 한 번**, 전체 `npm run check`는 묶음당 **한 번**만 돌린다(구현마다 돌리면 대기시간이 지배한다).
- 전체 검사 중에는 소스·테스트 파일을 저장소에 만들거나 고치지 않는다(빌드/타입체크가 같이 읽는다). 임시 스크립트는 저장소 밖(스크래치)에 둔다(`.cjs`가 린트에 걸린다).
- 증거 로그는 경로를 `<repo>`로 정규화해 `docs/implementation/evidence/`에 저장하고 문서에 통과 수/시간을 적는다. STATUS.md를 고치면 `node docs/design/rebuild-design-package.mjs`로 DESIGN-ALL·MANIFEST를 다시 만든다.
- 새 게임 수치/확률을 임의로 만들지 않는다. 설계에 없으면 구현 기본값(D)으로 문서에 표시한다.
- main에 직접 푸시하지 않고 브랜치로 푸시한 뒤 병합은 사용자에게 묻는다(다른 환경들이 PR로 병합 중이다).

## 다른 환경에 줄 요청문 (그대로 붙여 넣기)

```text
M6(구단 모드)를 이어서 구현해줘. 브랜치는 m6/club-mode(main에 아직 병합 안 됨)야.
먼저 docs/implementation/M6-NEXT-SESSION.md를 읽고, 거기 적힌 순서와 작업 규칙을 따라줘.
git은 최신화하고 별도 worktree에서 작업해. 커밋할 때는 git add -A 말고 파일 경로를 지정해.
구현은 3~5개 묶어서 한 번에 만들고 집중 테스트 한 번, 전체 npm run check는 묶음마다 한 번만 돌려줘.
끝나면 M6-*.md, PROGRESS.md, STATUS.md를 갱신하고 m6/club-mode 브랜치에 커밋·푸시해줘. main에 직접 푸시하지는 마.
```
