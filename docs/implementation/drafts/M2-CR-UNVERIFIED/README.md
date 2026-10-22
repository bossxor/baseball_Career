# 원본 초안 보관 — M2-CR은 활성 코드에서 검증 완료

2026-10-23 이 환경에서 원본을 대조해 활성 소스에 연결하고 관계 회귀13/13·전체539/539를 통과했다. [현재 구현 기록](../../M2-CR-KBO-TRANSFER-RELATIONS.md). 아래는 이전 환경 미검증 초안의 보존 기록이다. 이 환경에서 wiring.patch는 corrupt patch:10으로 거절됐으므로 재적용하지 않는다. 원문은 이력으로 남기며 현재 구현을 txt로 덮어쓰지 않는다.

# M2-CR 미검증 초안 — 활성 코드 아님

2026-10-23 사용량 잔여29%를 관측해 신규 구현을 동결했다. 작업 중 생성된 helper/테스트와 연결 diff를 보존했고 활성 엔진/테스트는 검증된 M2-CQ `fb96d5c`로 복원했다. 이 폴더를 구현 완료·테스트 통과로 세지 않는다. 전체535/535는 CQ의 증거다.

- `kbo-relation-transfer.ts.txt`: 미검증 helper 원본.
- `kbo-relation-transfer.test.ts.txt`: 미검증 집중 테스트 원본.
- `wiring.patch`: 기존 이적 명령 연결과 CQ 테스트의 관계 이력 보존 assertion 변경.

원본 바이트와 복사본 SHA256 일치를 확인한 뒤 활성 초안을 제거했다. CQ 상태에서 `git apply --check`만 통과했다. 초안의 타입/lint/실행은 아직 확인하지 않았다.

재개 시 최신 main을 받고 원문60의 관계 전이를 대조한다. 두 txt를 각각 packages/engine/src와 packages/engine/test의 원래 .ts 이름으로 복사하고 wiring.patch를 적용한다. 기존 CQ가 이후 달라졌다면 자동 덮어쓰지 말고 diff를 대조한다. 집중 관계/이적·원구단 수락·실패 롤백 검사와 npm run check/smoke를 통과한 뒤 STATUS/MD와 함께 커밋·push한다. E95/E96은 이 초안에 포함하지 않는다.
