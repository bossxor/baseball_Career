# 88. 웹·PWA·APK 업데이트와 버전 호환

2026-10-19 / 기술 기본안 D. [29](29-OPERATIONS-RELEASE-RUNBOOK.md)·[74](74-PREVIEW-COMMAND-RECONCILIATION.md)·[76](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md)·[86](86-CROSS-PLATFORM-WEB-APK-IOS-DESKTOP.md)의 갱신/복구 원칙을 UI·API·캐시 계약으로 구체화한다. 실제 서비스워커·APK·릴리스 파이프라인은 미구현이다.

## 버전의 의미와 조회

clientReleaseId는 배포 식별자,clientContractVersion은 단조 증가 정수,apiContractVersion은 응답/명령 계약,saveSchemaVersion은 데이터 구조,rulesVersion/engineVersion은 게임 판정 규칙이다. 이들을 앱 표시 버전 문자열 하나로 비교하지 않는다. UI를 업데이트했다고 진행 중 세이브의 난이도·잠재력·RNG 규칙을 자동 변경하지 않는다.

GET /api/client-policy의 논리 응답: {policyVersion,apiContractVersion,minWriteClientContractVersion,minReadClientContractVersion,reconciliationContractVersion,latestClientReleaseId,maintenance:{readAllowed,writeAllowed,messageKey},webReleaseManifest?,androidReleaseManifest?}. 운영 HTTPS origin에서 조회하며 URL은 서버가 지정한 배포 allowlist 범위만 허용한다. 공개 응답에는 save·계정·DB주소·서명키가 없다. 실제 호스트/API 경로는 구현 시 버전 정책에 맞춰 확정한다.

인증 전 정책 조회는 가능하지만 개인 결과 조회는 항상 인증/owner 검사를 거친다. 세션 복원 뒤·앱 resume·최초 쓰기 전에 정책 상태를 확인하고 서버도 각 요청의 clientContractVersion을 검사한다. 오래된 정책 캐시만으로 쓰기를 허용하지 않는다. 정책 조회 실패는 점검 중 확정이 아니라 연결 확인 상태이며 오프라인 새 명령은 금지한다.

## 상태와 사용자 행동

| 상태 | 화면 | 허용 범위 |
|---|---|---|
| CURRENT | 일반 저장 상태 | 현재 계약의 합법 행동 |
| OPTIONAL_UPDATE | '새 버전이 있어요.' 지금 업데이트/나중에 | 현재 버전이 호환되면 플레이 계속 |
| UPDATE_PREPARING | 다운로드·검증 중 | 기존 화면/초안 보존,혼합 자산 전환 없음 |
| UPDATE_READY | '업데이트를 적용할 수 있어요.' | 안전 지점에서 명시적 적용 |
| REQUIRED_FOR_WRITE | '계속 진행하려면 업데이트가 필요해요.' | 지원되는 조회·receipt/job 확인·업데이트 |
| REQUIRED_FOR_READ | 새 형식 화면 읽기 차단 | 최소 결과 확인 계약과 업데이트 안내,오래된 스키마로 임의 파싱 금지 |
| MAINTENANCE | 점검 안내·다시 확인 | 서버 readAllowed/writeAllowed에 맞춤 |
| UPDATE_FAILED | '업데이트를 준비하지 못했어요.' | 기존 호환 버전 유지·재시도,새 게임 유도 없음 |

사용자가 강화를 확정한 직후 새 버전이 나왔다고 결과를 실패로 바꾸지 않는다. 이미 접수된 요청은 원래 rules/engine/command contract로 끝내고 receipt를 남긴다. 차단은 새 게임 변경 명령에 적용하며 기존 job을 새 작업으로 대체하지 않는다.

## 미확정 요청과 업데이트 경계

1. 입력 중 초안을 owner/entity/schemaVersion 기준으로 로컬 저장.
2. 송신 중 요청은 원래 ID·payloadHash·expectedRevision·원 요청 본문을 안전 저널에 확정. 원본에 인증값을 포함하지 않는다.
3. 가능한 경우 receipt 조회를 마친 뒤 전환. 작업이 길거나 네트워크가 끊겨도 앱을 무기한 가두지 않고 저널 보존을 확인한 후 '업데이트 후 결과 확인' 경로를 제공한다.
4. 새 클라이언트는 먼저 구 저널 버전을 읽는 migration adapter로 결과를 확인한다. 새 필드·새 ID로 미확정 요청을 재작성하지 않는다.
5. 지원되는 원 요청을 재전송해야 한다면 동일 ID/본문을 유지한다. 서버가 오래된 command contract를 더 이상 접수하지 않으면 결과 조회만 수행하고 명시적 호환 오류를 보여준다. 404만으로 미실행을 단정하거나 새 요청으로 자동 실행하지 않는다.

오래된 클라이언트에도 최소 reconciliation contract v1을 유지한다. 인증 후 {id,status:UNKNOWN|PENDING|COMMITTED|REJECTED,saveId?,resultRevision?,jobId?,requiresClientUpdate} 같은 안정된 외피로 처리 여부를 조회할 수 있게 한다. 상세 결과가 현재 앱에서 읽히지 않으면 새 버전으로 이동하며 '성공했음/실패했음'을 추정하지 않는다. UNKNOWN은 서버 미접수 증명이 아니다. 원래 명령/생성/복원 endpoint의 조회를 바탕으로 제공하며 새로운 범용 임의 실행 endpoint를 만들지 않는다.

저널 스키마 업그레이드는 복사→검증→새 활성 포인터 교체 순서로 수행한다. 실패시 원본 저널을 유지한다. 사용자가 브라우저 데이터 삭제나 앱 재설치를 했다면 로컬 미송신 초안은 복구 불가일 수 있으나 서버 접수 작업은 owner 조회로 확인한다.

## 웹/PWA 자산 전환

릴리스 manifest는 immutable releaseId와 자산 경로/hash/크기를 갖는다. 새 파일 전체 준비·검증 전 기존 캐시를 삭제하지 않는다. 오프라인이면 현재 설치 셸만 제공하며 정책/공식 진행을 최신처럼 표시하지 않는다. HTML·JS·CSS가 서로 다른 release로 섞이지 않게 원자 배포하고 이전 호환 release의 해시 자산을 일정 기간 유지한다. 유지기간은 실제 저장 비용·클라이언트 관측 후 운영값으로 고정한다.

서비스워커가 있다면 waiting worker를 감지해 업데이트를 안내한다. 자동 skipWaiting/clients.claim과 강제 reload를 새 게임 명령 처리 중에 무조건 실행하지 않는다. 사용자가 적용을 선택하면 각 열린 탭에 쓰기 중지·저널 보존을 요청하고 준비 여부를 확인한다. 준비 안 된 탭이 있으면 안내하고 기존 버전을 유지한다. BroadcastChannel 등 통신 지원이 없으면 탭 종료 후 재열기 경로를 사용하며 조용히 모든 탭을 전환하지 않는다.

강제종료 등으로 협의 없이 worker가 바뀌어도 서버의 버전 검사·저널·receipt가 중복 효과를 차단해야 한다. 탭 간 메시지는 보조 UX이며 권한 경계가 아니다. 캐시 정리는 정적 앱 자산 범위에서만 수행하고 IndexedDB 저널·초안·개인 설정을 '캐시 비우기'로 일괄 삭제하지 않는다. 인증/API/서명 URL 응답은 서비스워커 공개 캐시 대상이 아니다.

새 버전 청크 로드 실패는 '화면 파일을 불러오지 못했어요'와 업데이트/재접속 안내,재로드 전 초안/저널 보존을 제공한다. 기존 상태가 없다고 세이브를 생성하거나 DB 구조를 클라이언트에서 수리하지 않는다.

## Android APK 전환

기존 packageId·서명키·단조 증가 versionCode를 유지한다. 업데이트 manifest의 배포 URL·앱 ID·versionCode·sha256을 검증 가능한 배포 메타데이터로 제공하고,실제 설치 호환은 Android 서명/패키지 규칙과 릴리스 검수로 확인한다. 다운로드 파일 hash만으로 앱 서명 확인을 대체하지 않는다.

앱 내부에서 보안 설정을 자동 변경하거나 알 수 없는 출처 설치를 대신 승인하지 않는다. 사용자가 설치 경로를 선택하고 OS 설치 절차를 수행한다. 일반 앱 업데이트는 사용자 데이터/저널 보존을 목표로 하며 '삭제 후 재설치'를 기본 해결책으로 제시하지 않는다. 잘못된 서명/설치 실패면 기존 앱과 서버 진행을 유지한다.

업데이트 후 세션 확인→구 저널 reconciliation→최신 save resume 순서를 따른다. APK에 포함된 웹 자산과 원격 API의 호환을 검사하고 임의 원격 URL을 앱 UI로 실행하지 않는다. 앱 최소 지원OS·WebView·플러그인·업데이트 서명 검수는 실제 도구 버전을 선택한 뒤 수행한다.

## 서버 배포·롤백

호환 DB 확장→이전/새 클라이언트가 읽을 수 있는 API 배포→웹/APK 배포→관측→필요시 최소 버전 상향 순서를 기본으로 한다. 파괴적 구조 변경은 별도 migration/복원 계획을 세운 뒤 실행한다. 운영 쓰기를 끊어야 하면 명시 점검 상태와 진행 중 작업의 안정 종료 지점을 먼저 정한다.

서버 롤백 대상은 현재 save schema와 호환되는 버전만. 새 형식 데이터를 읽지 못하는 옛 바이너리를 강제로 켜거나 기존 세계를 과거 스냅샷으로 자동 덮어쓰지 않는다. 게임 규칙·확률·난이도 변경은 save policyVersion 고정을 존중한다. 장기 작업은 version이 고정된 worker/계획으로 이어가며 재배포로 RNG를 재추첨하지 않는다.

## 수용 조건과 근거

[플랫폼 기대값](platform-experience-fixtures.json)의 update8개: 미확정 요청·강제 업데이트·구 저널·두 탭·다운로드 실패·서명 오류·API 호환·저널 보존. 실제 worker 전환·WebView·서명 업데이트·rollout 시험은 미실행이다.

외부 근거: [Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)은 waiting/activation/skipWaiting과 혼합 버전 위험을 설명한다. 2026-10-19 확인. 위 안전 지점·최소 조회 계약·저널 adapter는 이 앱의 설계 선택이며 브라우저가 자동 보장하는 기능이 아니다.