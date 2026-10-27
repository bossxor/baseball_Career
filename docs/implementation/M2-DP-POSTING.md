# M2-DP — KBO 포스팅 창

2026-10-27. 설계 13/23. 새 숫자는 없다.

## 한 일

- 자격: 1군 등록 100경기×7시즌, ACTIVE 계약, 병역 COMPLETED/NOT_APPLICABLE, 오프시즌.
- `requestKboPosting` → `resolveKboPostingClub`(recent×0.6+role×0.4, 65 이상 승인) → `openKboPostingOffers`(0~3, OVR 75 MLB / 65~74 MiLB, 고정 추첨) → 거절/만료 또는 `acceptKboPostingOffer`.
- 체결: 원구단 계약 종료, 복귀 보유권 snapshot, 보상금=보장총액 20%×₩1300을 구단 `budgetWon`에만 가산. 선수 수입 원장에 넣지 않음.
- 거절/만료/보류는 원계약을 그대로 둔다.

## 하지 않은 일

- 미국 커리어 루트 생성. 체결 결과는 ARCHIVED KBO + sealed 제안/선수/계약이다.
- 해외 FA 9시즌, 국내 복귀 협상, API/화면.

## 검사

`packages/engine/test/kbo-posting.test.ts` 3/3. 통제 fixture. 전체 `npm run check` 종료 0: 엔진/API 728개 중 726 통과, 실패 0, Neon 2건 건너뜀, 웹 22/22. duration_ms 774374.7154. 골든 SHA256 `113761f605145c79179c912841754bf060e25d42856822f847074317288d5c92`. 증거 `evidence/M2-DP-check.log`. 브라우저/Neon/실기기 아님.
