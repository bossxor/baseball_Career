# GPT 검증 인계 — M2 (진행 중, 완료 아님)

작업 트리: `C:\Users\N-052\.codex\visualizations\2026\10\16\01a142f8-66ea-7782-ba3e-b52df94ae1be\baseball-career-m2`
브랜치: `codex/m2-career-engine`
이 문서 작성 직전 팁은 푸시된 DR 커밋이다. `git rev-parse HEAD`로 확인.

## 1. 브랜치·커밋

- DN: `c95f251` MLB 1년 재계약
- main 병합: `25c7905` ← `f087e00` / `6cf02c3`
- DO: `26f3557` 원소속 FA·옵션
- DP: `f25baf2` KBO 포스팅
- DQ: `443481a` 해외 FA·귀국
- DR: 이 세션의 미국 루트 활성화 (푸시 후 해시 확인)
- 강제 푸시 없음. `V:\.git` 없음.

## 2. 병합

- 충돌 없음. DN 보존.

## 3. 구현 / 미구현

구현:
- MLB FA 전 1년 재계약, 원소속 FA, 보장 연차 동결, 옵션 STAY/FA
- KBO 포스팅(7시즌)·승인/보류·제안·체결·구단 보상금·복귀권
- 해외 FA(9시즌)·보상금 없음·국내권 RELEASED
- 포스팅 귀국 협상
- `activateKboUsCareer` (KBO_TRANSFER)

미구현:
- 해외 병역 기한·미국 계약 동결/복귀
- 국가대표 대회 경기(자격/명단은 M6 일부)
- 남은 99사건 도메인, 관계/특성 경기 효과
- 24경로 해시, PF-D
- API/화면 연결, Neon/브라우저/APK
- M2 완료 아님. 영역 약 50% 유지.

## 4–12. 상세

기능 파일은 `M2-DO`~`M2-DR` 문서와 `packages/engine/src/us-major-renewal.ts`, `kbo-posting.ts`, `kbo-overseas-fa.ts`, `kbo-return.ts`, `kbo-us-activation.ts`.
엔진→API→화면 연결은 대부분 없음.
저장: schemaVersion 4(US), KBO posting/overseasFa/returnHome 옵션 필드, US `populationBasis:'KBO_TRANSFER'`.
검사: 각 `docs/implementation/evidence/M2-D*-check.log`. Neon 2건 건너뜀 유지.
fixture와 실제 시즌을 구분할 것.

## GPT 검증 요청

HANDOFF와 최신 M2-D* 문서를 먼저 읽고 독립 검증하라.
완료 주장만 신뢰하지 말고 재현 후 수정하라.
연결·무결성·성능·계약금/급여/서비스타임 중복·원자성·seed 결정론을 점검하라.
수정 후 전체 검사·문서·증거·커밋·푸시. 강제 푸시 금지. 비밀키 금지.
