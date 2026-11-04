# MLB FA 구단 비교·이적 — 2026-11-04

## 구현

기준 ce9f010. 기존 usMajorFreeAgencyPreview가 원구단 + 포지션 경쟁·예산·등록 조건을 충족한 타 구단 최대3곳을 결정적으로 비교한다. 기존 가치/연령별 기간/현재 레벨을 유지하고 자동 승격·임의 지원금·새 확률을 추가하지 않는다. 공개 ACCEPT_MAJOR_FA에 선택 offerKey만 추가했고 생략하면 기존 원구단 수락을 유지한다. 공개 DTO에 경쟁선수/경쟁점수/잠재력/RNG를 내보내지 않는다. 원구단 에이전트 counter는 원구단에만 적용한다.

기존 순수 조회+revision CAS를 재사용해 별도 OPEN 시장 상태를 추가하지 않았다. 견적은 난수를 소비하지 않는다. 수락 시 선택 견적·계약·closing/next 구단을 연도 아카이브에 보관한다. 과거 부킹은 당시 구단에서 재생하고 새 연봉 예약·잔여 보장은 새 구단이 소유한다. legacy 이력의 누락 구단 태그는 검증된 기존 holder로만 채우며 원본 객체/기록/수입/계약금/서비스는 보존한다. KBO_TRANSFER와 직행 출신 모두 현재 holder 검증을 재생 결과와 맞췄다.

기존 마이너 mover를 MLB·예비명단 교체에도 사용한다. 조직 내부 승격을 우선하고 Rookie에만 신인을 보충한다. 기존 선수의 능력/신원/기록은 덮어쓰지 않는다. 새 구단 동료 형성·기존 관계 보존, 보호명단/옵션 이월도 기존 경로를 따른다. 부상 원장은 지우지 않는다.

## 발견·수정

1. MLB 미지원 mover가 SOURCE_RESERVE_REQUIRED로 실패: MLB 내부 승격 경로 확장.
2. 투수 신인의 구종 연도가 stage 중 다음 해로 먼저 바뀌어 INVALID_US_REPERTOIRE 발생: 임시 stage는 현재 연도, 연도 확정 시 새 구종도 다음 연도로 이월.
3. 이적 보충과 같은 해 은퇴 보충이 동일 Rookie ID를 배정: 기존 키를 건너뛰며 기존 난수 순서를 유지.
4. 독립 리뷰 P1: KBO-origin 원래 holder를 이적 후 현재 구단과 비교해 정상 이적 거절: 최초 메이저 holder와 원래 holder를 대조하고 현재 holder는 연도별 재생으로 검증. KBO 회귀1/1 및 재리뷰로 해소.

## 검증

- RED: FA 제안1개≠4개, MLB mover 오류, 투수 구종 연도 오류, Rookie 키 충돌을 실제 실행으로 확인.
- 최종 집중 native major+API+이적 묶음12/12·실패0·제외0, 300784.6381ms.
- 로스터/예비 교체·투수·동시 보충3/3, 견적 수요/40인/예산/무난수1/1, KBO-origin 실제 계약/이적/보장/JSON1/1.
- 엔진 build·전체 테스트 타입·변경 TS lint 종료0. 새 KBO 테스트 이후 전체 check의 타입 검증도 포함해 최종 gate를 기다린다.
- 전체 npm run check 실행 중. 세션90394, evidence/M2-20261104-major-fa-check.log/.exitcode.txt. 실제 종료 코드를 확인하기 전 전체 통과로 쓰지 않는다.
- 초기 freeze 작성에서 존재하지 않는 tsconfig.json을 참조해 실패했다. 실제 config 목록으로 static 단계 중 manifest를 생성했으며 source 변경은 없었다. 최종 source536파일 대조는 종료 시 확인한다.

## 증거 경계와 다음

6시즌 FA 자격/정규·PS 접두는 controlled fixture다. 실제 native writer로 계약·구단 이동·금전 예약·JSON·다음 보장연도를 검증했다. native6년 전체, E66 서사 배선, 24경로/PF 전체, 대용량 실제 PostgreSQL 또는 실기기 완료 증거가 아니다. 별도 초기 연말 회귀의 native75경기/첫 일마감도 동일 구분을 유지한다.

다음은 전체 check 결과 처리·기본 플레이 화면의 미국 연말 선택 연결·미연결99사건/24경로/PF 감사다. M2 전체 완료 아님. 전체 관리용 추정65%는 유지한다. 임의의 세부 기능 개수로 퍼센트를 올리지 않는다.

기존 사용자 us-amateur-return-career.test.ts21줄 WIP, 큰 runtime JSON2개·zz-dbg.log는 수정/스테이징하지 않았다. 전체 check에는 현재 사용자 WIP도 포함되므로 freeze에 명시했다. V:는 문서/증거 Copy-Item만, .git 생성/PC 종료 금지.
