최신 확정(2026-10-19): [119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md) 백업·복원과 archive는 던지는 손·타석·투구폼을 선수 정체성 필드로 포함해 보존한다.

# 70. 백업·새 세이브 복원·버전 호환 상세

29의새saveId복원/10자동·10수동백업을유지한다. 백업을복원하며행ID를바꿨다고pending경기의난수·원본참조·중계해시를잃지않게정의한다. 실제migration코드나원격복원은이번설계에서실행하지않는다.

## 식별자 3종

rowId는DB외부참조식별자,simulationKey는세이브내엔진의불변논리ID,originRef는원본출처다. 생성처음에는rowId와다르게고정simulationKey부여. RNG stream/game resultHash/동률게임판정은ownerSubject·물리rowId가아닌simulationKey와고정rulesVersion으로계산한다. 같은Key는같은save내유일,다른복원세이브에서는허용. 원본은퇴archiveId는불변개인보관식별자.

복원시새saveId/rowId발급,simulationKey/논리경력/시계/모든rngState는보존. idMap=(restoreJobId,entityType,oldRowId,newRowId,simulationKey)고유. pendingGame명단/베이스주자/책임투수/계약/학적/resume/sourceclaim등모든가변FK를map한다. immutable중계chunk는원당시snapshot/논리키와hash그대로,restoreAlias를통해현재선수정보링크만해석. 옛고정로그의playerId문자열을바꿔checksum을깨지않음.

예S1/P1/G1→S2/P2/G2,simulationPlayerKey SP1/simulationGameKey SG1유지. 이어지는타석의같은입력·동일선택이면같은논리결과. 두세이브가이후다른선택을하면다른결과가정상,복원후미래가무조건같다고보장하지않는다. 이미확정된경기의originResultHash는재생성하지않음. rowId를엔진동률기준으로쓰던구스키마는engineIdentityVersion변환계약없이는resume불가/읽기복구안내.

## 백업 묶음

manifest={backupId,sourceSaveId,sourceRevision,schemaVersion,rulesVersion,engineVersion,identityVersion,createdGameInstant,contentHash,sections:[{name,count,uncompressedBytes,sha256}],attachmentRefs}. sections는world/players/contracts/rosters/schedules/records/ledgers/pendingGames/assessment/traits/pitches/goals/relations/staff/tasks/rng/retirementRefs. 읽기위치·핀·메모는optionalPreferences분리,인증세션/refresh/호스트secret없음.

sourceRevision고정snapshot을DB읽기일관성트랜잭션으로확보→업로드는세계lock밖→checksum/길이/필수section검사→READY. 동시에게임진행이계속돼도snapshot내용은안바뀜. snapshot freeze실패는백업재시도,현재게임삭제없음. 압축해제총10MiB기본한도초과는ZIP폭탄같은파일을거절하고정상대용량에대해서는서버관리형snapshot확장정책으로분리,제한회피로통계삭제안함.

## 복원 작업 상태와 순서

REQUESTED→VERIFYING→TRANSFORMING→STAGING→VALIDATING→READY→ACTIVATED또는FAILED. ownerSubject검사/backup READY→hash·section·version·크기검사→idMap고정→지원변환vN→vN+1순수단계→새world/staging행작성→71불변조건→sourceRoleClaims새save내재구성→active save노출. 활성세이브10개한도는복원미리보기에서슬롯정리안내,기존원본게임자동삭제없음. job재시도는같은idMap/targetSaveId/seed사용.

모든원장/evidence는백업의진행완료상태를보존,그자료를초기화해강화/목표/재도전기회를다시받지못함. 단API command_receipts는새save에복사하지않고sourceReceiptAlias를명령근거로보존,기존실행명령재전송시‘이백업에서이미반영된행동’인originActionKey를domain원장이차단. 새행동은새commandId,이미완료된source를다시추첨하지않음.

## 원본·파일·실패

복사선수의starting/peak/새P/기록은백업자체보존,sourceArchive가없어도현역운영가능. 소유원본이존재하면originRef연결검증,없거나타인원본이면개인정보연결을제거하고‘출처상세없음’,원래snapshot출처요약만. 이미은퇴완료sourceArchive가같은owner/hash로있으면재사용,있는데hash다르면RESTORE_ARCHIVE_CONFLICT/원본덮어쓰기없음. sourceclaim은rootSource 논리참조를새save에서만생성,옛save claim삭제안함.

중요로그/연대기첨부는immutablecontentHash와owner reference검사,임시PNG재생성가능파일은복원필수아님. 파일없음이면게임불변조건과별개의attachment DEGRADED상태/요약읽기,공식기록을빈값으로만들지않음. 필수pendingGame state/hash누락은복원불가. staging실패는기존save/READY백업무변경,미노출staging만job소유확인후청소.

## API·검수

POST /api/restores/preview={backupId}→{supportedVersions,targetSlotAvailable,estimatedRows,attachmentsStatus,blockingReasons};POST /api/restores={restoreRequestId,backupId,backupHash,displayName,previewId};GET /api/restores/{jobId}→{status,targetSaveId?,warnings,failedStage?}. 같은requestId다른backup409,불가version422 UNSUPPORTED_BACKUP_VERSION,hash503 BACKUP_INTEGRITY_ERROR,상한422 SAVE_SLOT_REQUIRED. 원본overwrite모드는없음.

RESTORE01 새물리ID/논리ID·rng동일/02pending다음타석동일/03강화usage1유지/04재도전used유지/05중계원hash불변/06실패원게임·백업무변경/07sourceArchive없어도복사운영/08타인archive참조제거/09완료원장중복실행0/10활성10개자동삭제없음/11같은job같은map/12원본hash충돌정지. 실제파일/DB FK/개발브랜치복원/E2E는구현후필수증거.