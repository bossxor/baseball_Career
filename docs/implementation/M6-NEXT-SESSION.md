# M6 이어가기 안내 (구단 모드) — 2026-10-27

기능 마감은 [M6-CLOSE](M6-CLOSE.md)다. 브랜치 `m6/club-mode`는 main에 병합되지 않았다. 구단 90%를 유지한다. 다음 구현은 국제 대회 경기이거나 L04 실주행이다.

## 먼저 할 일

1. `git fetch` 후 `m6/club-mode`를 받아 그 위에서 작업한다(`git switch m6/club-mode`, 또는 `git worktree add ../baseball-m6 m6/club-mode`). 다른 환경의 미커밋 파일이 같은 폴더에 있으면 별도 worktree를 쓰고, 커밋은 `git add -A` 대신 **경로를 지정해서** 한다.
2. `npm ci` → `npm run build --workspace @playball/rules` → 엔진 테스트는 `packages/engine`에서 `npx tsx --test test/<파일>.test.ts`로 돌린다(프로젝트 루트의 `npm run check`는 25~30분).
3. 읽을 순서: 이 문서 → [M6-D](M6-D-CLUB-YEAR.md) → [M6-C](M6-C-CLUB-LINEUP.md) → [M6-B](M6-B-CLUB-IMPORT.md) → [M6-A](M6-A-CLUB-GAME.md). 설계 원문은 `docs/design/05-CLUB.md`(구단 규칙), `25`, `36`(치트), `44`, `08-FORMULAS.md`(계약/재정 구제), `115`(오프시즌 순서), `118`.

## 코드 위치 (packages/engine/src)

kbo-club-game.ts(뿌리·읽기·라인업 검사/적용) · kbo-club-import.ts(보관 투입) · kbo-club-progress.ts(시즌 진행·승강 정지/뉴스) · kbo-club-postseason.ts · kbo-club-year.ts(연말 마감/다음 시즌·재정 재건·로스터 계획 적용) · kbo-club-manage.ts(1군 편성·FA 제안·재계약/방출/트레이드·불펜) · kbo-club-command.ts(저장 명령·S13–S19 읽기) · kbo-club-long-run.ts(L04 체크포인트) · kbo-club-labels.ts(전략·상무 관찰·국제 창) · kbo-club-national.ts(국가대표 28명). API `apps/api/src/club-shell.ts`. 웹 `PlayballApi`의 `createClub`/`club`/`clubCommand`. 테스트: test/kbo-club-*.test.ts, apps/api/test/m6-club-shell.test.ts. 공유 코드를 건드린 곳은 추가만: `high-school-game.ts`(`lineupOverrides`), `kbo-game-world.ts`(빈 주인공 키), `kbo-year-end.ts`(`closeKboNpcSeasons` export), `kbo-roster-repair.ts`, `kbo-fa-market.ts`(`userClub`).

## 남은 M6 작업 (권장 순서, 가까운 것끼리 묶어서 구현한 뒤 한 번에 검증)

1~4는 [M6-E](M6-E-CLUB-OPS.md)에서 끝냈다(재정 재건 보조금, 재계약/방출/트레이드, 불펜 슬롯, 콜업 추천·뉴스).

5. **구단 모드 저장/API/화면**: [M6-F](M6-F-CLUB-SHELL.md)가 생성·시작·라인업·1군·1일 진행과 S13–S19 읽기를, [M6-G](M6-G-CLUB-DECISIONS.md)가 제안·재계약/방출·불펜·다음 시즌 명령을 세이브에 연결했다. 픽셀 배치는 M5와 만난다. 트레이드 상대 고르기 버튼은 없다(D).
6. **12개 장기 시뮬레이션**: [M6-H](M6-H-CLUB-LONG-RUN.md)가 L01~L12 목록과 L04 체크포인트 재개를 만든다. 50시즌 실주행과 균형 판정은 아직이다. 경기 0을 통과로 적지 않는다.
7. **전략·상무·국제**: [M6-I](M6-I-CLUB-LABELS.md)부터 [M6-L](M6-L-CLUB-NATIONAL.md)까지 넣었다. 국제 창의 실제 경기만 남았다. 마감 문서는 [M6-CLOSE](M6-CLOSE.md).

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
