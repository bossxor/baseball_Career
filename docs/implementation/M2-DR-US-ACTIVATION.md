# M2-DR — 포스팅/해외FA → 미국 루트

2026-10-27.

## 한 일

- `activateKboUsCareer`: SIGNED 포스팅/해외FA 봉인 제안으로 US 루트 생성.
- `populationBasis:'KBO_TRANSFER'`. 계약금 수입 없음. 복귀권은 `kboTransfer.returnRights`에 유지(해외FA는 null).
- MLB 제안은 같은 포지션 MLB 선수와 교체해 26명을 지킨다.
- `usCareerView`는 KBO_TRANSFER 분기로 usRecruitment 검사를 건너뛴다.

## 하지 않은 일

- 해외 병역 기한, 국가대표 차출, 99사건, 24경로, API/화면.

## 검사

`packages/engine/test/kbo-us-activation.test.ts` 1/1. 전체 `npm run check` 종료 0: 엔진/API 731개 중 729 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 694977.322. 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. 증거 `evidence/M2-DR-check.log`.
