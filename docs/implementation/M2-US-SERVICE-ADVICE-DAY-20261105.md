# 미국 복무 휴식일 조언 판정 보완 — 2026-11-05

## 원인·변경
실제 US worker는 경기 없는 복무일에도 season.days를 닫지만 health.games는 실제 경기의 건강 정산만 기록한다. 예전 guard는 health만 검사해 ADVICE_DAY_NOT_CLOSED로 멈췄다. 기존2fb681e는 같은 day만 있으면 허용했다. 새 negative 검사에서 변조된 evidence/다른 season과 예정 경기 날의 가짜 빈 receipt까지 수용함을 RED로 확인했다.

공통 adviceDayClosed의 no-health US fallback만 좁혔다: 현재 시즌 schedule/regular receipt 연결, 시즌 날짜 범위, 유일한 해당 날짜 receipt, evidence가 canonical 빈 배열, 실제 해당일 예정 경기0을 모두 확인한다. 기존 health 근거 경로/KBO 판정은 유지한다. 게임 규칙·급여·확률·seed 변경 없음.

## 검증
- 새4건 + 기존 조언/구종·미국 복무 =29/29, fail0·skip0,175839.011ms.
- engine build/전체 테스트 타입/변경 lint 종료0. 독립 읽기 전용 리뷰 지적 없음.
- 새 양성 경로는 실제 military worker의 휴식일 마감과 JSON 재개/원본 불변을 실행한다. 이전 scheduled dates는 기존 controlled service helper다. native 전체2년 증거로 주장하지 않는다.
- 실제2년 복무/미국 재서명 테스트는 별도1건 진행 중. evidence/M2-20261105-native-service-run.json/.log/.exitcode.txt, -source.json/-freeze.json을 확인한다. engine/rules 소스를 동결했으며 API 별도 변경은 이 native 실행 범위 밖이다.
- 사용자 WIP15줄/큰 runtime JSON/zz 원본 보존. 이번 커밋에 해당 테스트 원본은 포함하지 않는다.

## 증거
evidence/M2-20261105-us-advice-day-red.log, -day-focused.log/.exitcode.txt, -engine-build.log/-types.log/-lint.log/-static.exitcode.txt. 원래 전체1120건 중1113통과/2실패/5제외의 종료1은 이전 source 결과로 그대로 유지한다. 전체 PASS/M2 완료 아님.

## 계속 구현
API의 E37/E69 보관 이동을 진행하며 실제2년 회귀 결과도 확인한다. 이후 기존 M2 주요 잔여(미국 Major E66·귀국 authority/US 재회·24/PF·실제 웹)로 이어간다. PC 종료 금지.
