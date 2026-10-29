# 재도전·독립 준비·미국 아마추어 귀국 엔진

설계 출처: 66(평생3회, 현재 나이 대학입학, 독립48경기, 성적보정-20), 43(대학 성장 분모 PA100/outs90), 13 §8·21(귀국2세계시즌·현역18개월 포함·잔여반년 훈련), 23(실제 유효 미국 제안·동시 계약 차단), 14(기존 확정 값 보존). 새로운 독립 NPC 분포나 계약 성공 보장은 만들지 않았다.

## 엔진 범위

- `retry-career.ts`: 미계약 receipt별 episode, 평생 준비3회, 단계/시즌/연령/권리/실제 제안과 만료 경계를 포함한 preview, revision CAS, 완료 영수증 동일 재시도 무소모. 새 episode가 평생 사용량을 초기화하지 않는다. 대학 entryAge는 currentAge이며19~22세·프로계약 이력 없음·실재 admission ref를 요구한다.
- `preparation-season.ts`: caller가 소유한 실제 팀/명단/구종·48경기/홈24경기 일정만 받는다. 기존 경기 엔진의 seed와 pending game/RNG/cursor를 JSON 저장에 보존하고1000PA/20이닝 단위로 재개한다. 공식 경기→날짜/피로/부상→구종학습/특성→전체 세계 성장일 정산/노쇠/건강 마감→평생 사용1회를 하나의 순수 결과로 돌려준다. 기존 trainingUsedSeasons/styleUsedWindows를 승계하며 강화16경기·유형24경기 조건을 사용한다. 부상으로 편성이 불가하면 세계 소유자가 `setPreparationRosters`로 이미 존재하는 신원만 공급할 수 있다.
- `us-amateur-return.ts`: 실제 만료한 아마추어 마이너 계약에서만 열고 KBO 출신을 제외한다. 원선수 snapshot과2개 연속 세계시즌을 보존하고35세 이내에만 DRAFT_READY가 된다. 복무1년은 공식 출장0/성장0, 두번째 해는6월30일까지 성장0+잔여 훈련이며 매년 노쇠1회다. 귀국 필수 독립48경기는 선택 준비 사용량0이며 같은 세계시즌에 중복 등록되지 않는다. 미국 복귀 취소는 신원·시즌·authority revision·군상태·국내 활성계약 없음·현재 실재 US offer/만료를 검사하고 국내 draft reservation만 취소한다.

## 저장·caller 계약

`RetryCareerLedger`, `PreparationSeason`, `UsAmateurReturnLedger`는 root optional 필드로 직렬화한다. 순수 명령의 반환값 안에 world/records/health/growth/retry/return을 함께 저장해야 하며 HTTP에서 authority boolean·실제 제안 목록·선수 snapshot을 직접 받지 않는다. authority는 저장된 계약/권리/모집 원장에서 서버가 만든다. DB 원자 저장과 UI 이벤트, 실제 국내 draft/구단시장 계약 수락, 미국 계약 서명과 귀국 취소의 동일 transaction은 외부 caller 연결 작업이다. 함수의 진로 preview와 취소만으로 새 계약/등록/돈을 생성하지 않는다.

기존 저장 기록·능력·잠재력·금액·RNG를 소급 재계산하지 않는다. `UsAmateurReturnLedger.sourcePlayer`는 새 원장 개시 시 원실물 snapshot이며 누락된 옛 가상 귀국 원장을 추정 보충하지 않는다. 성장/건강/완료 receipts를 바꾸어 재전송하면 거절한다. 조회는 seed/RNG/잠재력/내부 snapshot을 반환하지 않는다.

## 작성된 검증 (실행 안 함)

`packages/engine/test/retry-career-ledgers.test.ts`:

1. RETRY01/02/04/05/06/07/09:3회 누적·동일 완료 재전송·새 episode 사용량 보존·current-age 대학·프로이력 차단·실재 오퍼와 날짜 경계·stale preview/CAS.
2. RETRY03 및13 T47:필수 귀국 period 예산0, 실제 현역 두블록과2세계시즌/35세 draft reservation, 첫해 성장0·두번째 반년 훈련·노쇠1회·JSON 재정산 동일.
3. 실제 독립 경기216개(9팀×48/2), 내팀48경기, pending chunk JSON 재개 동일 결과, 원본 불변, 완주 전 정산 거절, 전체 growthDays 원장, 완료1회 사용·같은 완료 재전송 불변.
4. 실제 US offer 없음 거절·유효 제안으로 국내 예약 취소·이미 완료한2시즌과 원기록 보존.

사용자 지시에 따라 런타임 테스트와 개별 typecheck를 실행하지 않았다. 최종 전체 check1회는 부모 작업에서 수행한다. 이 문서는 실행 통과나 DB/UI 연결 완료 주장이 아니다.
