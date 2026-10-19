# 122. 투구폼·좌우 분리 기록의 API·스키마·로그 정합

사용자확정U(2026-10-19): 구버전 클라이언트가 투구폼 없이 투수를 생성하면 **거절하고 업데이트를 안내**한다(추천안). 이 문서는 [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)·[121](121-HANDEDNESS-DISTRIBUTION-SPLIT-RECORDS.md)이 만든 새 필드·조회가 기존 API·로그·DB·화면 바인딩과 어긋나지 않게 맞춘다. 구현·실행은 하지 않았다.

## 1. 생성 요청 (78/79/88)

- 생성 payload에 `pitchForm`(OVERHAND|THREE_QUARTER|SIDEARM|UNDERHAND)을 추가하고 `creationSchemaVersion`을 한 단계 올린다. 타자 payload에는 `pitchForm`을 보내지 않으며 보내면 422 INVALID_FIELD.
- 투수 payload에 `pitchForm`이 없으면 서버는 임의 값을 채우지 않고 422 `CLIENT_UPDATE_REQUIRED`(요청의 clientContractVersion이 새 필수 버전 미만일 때) 또는 422 `INVALID_PITCH_FORM`(버전은 맞지만 값이 없거나 잘못됨)으로 거절한다. 거절은 생성 job·saveId 예약·난수를 소비하지 않는다.
- 클라이언트 정책(88): 이 변경과 함께 `minWriteClientContractVersion`을 올려 구버전은 쓰기 전에 REQUIRED_FOR_WRITE로 안내된다. 조회·receipt/job 확인은 허용한다. 이미 접수된 같은 creationId 재전송은 접수 당시 payload 해시로 처리하며(78) 새 필드 때문에 기존 job을 무효화하지 않는다.
- 입력 초안: 로컬 초안은 schemaVersion을 포함하며(88) 구버전 초안에 pitchForm이 없으면 투수 유형 선택 후 ‘투구 폼을 선택해 주세요’ 오류로 입력을 보존한다.

## 2. 경기 로그 (62)

playRecord의 logSchemaVersion을 1→2로 올리고 PA 판정에 필요한 손 snapshot을 추가한다.

| 필드 | 의미 |
|---|---|
|batterBatsAtTime|경기 시점 타자 타석 R/L/S|
|effectiveBatSide|투수 손 기준 실제 판정 타석 R/L(양타는 반대)|
|pitcherThrowsAtTime|경기 시점 투수 던지는 손 R/L|
|pitcherFormAtTime|경기 시점 투구폼|

- 손·타석·폼은 생성 후 변하지 않지만(119) 정정·복사·원본 보관과 무관하게 로그가 자기완결되도록 snapshot으로 저장한다. v1 로그는 읽기 호환만 유지하며 split 집계에는 선수 행의 손 정보로 보강하지 않는다(해당 PA는 ‘분류 불가’로 집계 제외, 총합 불일치 경고).
- resultHash 입력(62)에는 위 필드가 포함되므로 logSchemaVersion 2 이후 경기는 해시 규칙이 달라진다. 이전 경기 hash는 불변이다.

## 3. DB (06)

| 변경 | 내용 |
|---|---|
|players|`pitch_form` enum NULL 허용(투수 NOT NULL 제약은 kind=PITCHER CHECK), `throws`·`bats`는 기존|
|split_stat_summaries|playerId, scopeKey, vsHand(L/R), stats JSONB, aggregateVersion. UNIQUE(playerId,scopeKey,vsHand)|
|archive 요소|throws/bats/pitch_form과 최종 split 요약 보존(70)|

## 4. 화면·바인딩 (77/17/screen-state-catalog)

- S16 선수상세의 쿼리 바인딩에 `READ_PLAYER_SPLIT_RECORDS`를 추가했다(screen-action-bindings.json, 화면 45행 유지). 조회 API는 121의 GET split-records.
- S02 생성 행(17/catalog)의 입력에 ‘투구폼(투수)’ 필드를 반영했다.
- 읽기 전용 조회이며 난수·save revision을 바꾸지 않는다.

## 검수 항목 (초안, NOT_EXECUTED)

API-D01 투수 payload에 pitchForm 없음 → 422, job·saveId 0/02 타자 payload에 pitchForm → 422/03 구버전 클라이언트 쓰기 전 업데이트 안내/04 같은 creationId 재전송은 접수 payload 해시로 처리/05 logSchemaVersion 2 playRecord에 손·폼 snapshot/06 v1 로그 PA는 split 분류 불가로 제외/07 resultHash는 새 필드 포함/08 players CHECK(투수 pitch_form NOT NULL)/09 archive가 손·폼 보존/10 split-records 조회 난수 0.
