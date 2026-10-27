# M3·M4·M5·M7·M8·M9 오류 검증 보고 — 2026-10-27

대상: `origin/main` 7489497(깨끗한 새 worktree). 기준선: 깨끗한 `origin/main`의 전체 `npm run check`는 통과했다(rules/engine/api 699개 중 통과697·실패0·건너뜀2, 웹 20/20, lint/타입/build/골든/이벤트/설계/Android/자산 검증 통과, 1012초). 아래 결함은 기존 테스트가 잡지 못한 로직 결함이다.

방법: ① 전체 `npm run check` 재실행 ② 코드 정독(apps/api, apps/web, Android, 운영 스크립트) ③ 의심 지점을 실제로 재현하는 테스트 실행(PGlite, 인메모리). 재현 코드는 [evidence/verify-m3-m9/](evidence/verify-m3-m9/)에 있고 저장소 테스트 글롭에 걸리지 않게 `.txt`로 두었다(실행하려면 `apps/api/test/*.test.ts`로 복사).

범위 한계: Neon 실계정 테스트 2건(`m3-neon`)은 이 환경에서 자격 증명이 없어 건너뛰어졌다(전체 결과의 skipped 2). V02/V03의 "EXECUTED"는 이 환경에서 재확인하지 못했고, 아래는 PGlite로 재현한 서버 로직 결함이다. 실기기 설치·DNS·메일은 검증 대상이 아니다.

## 요약 (실행으로 확인한 결함)

| # | 심각도 | 영역 | 결함 | 재현 결과 |
|---|---|---|---|---|
| 1 | **높음** | M8/M9 | API에 **CORS가 전혀 없다**. Android(Capacitor, origin `https://localhost`)와 웹을 별도 오리진에 두는 구성(M9 문서의 "별도 CDN")은 사전 요청(OPTIONS)에서 막힌다. | `OPTIONS /api/saves` → 401, `Access-Control-Allow-Origin` 없음 (V4) |
| 2 | **높음** | M3 | 세이브 id가 소유자와 무관하게 전역(`save_${creationId}`, `save_restore_${restoreRequestId}`). 다른 사용자가 같은 id로 요청하면 **남의 saveId·revision·phase를 200으로 돌려받고**(정보 노출), 실제로는 자기 세이브가 없다. | user-b가 user-a의 creationId 재사용 → 200 + A의 saveId, B 목록 0건 (V1); 복원도 200 `ACTIVATED`인데 B가 읽으면 404 (V10) |
| 3 | 중간 | M3 | 같은 소유자의 **동시 동일 생성 요청이 500**(select 후 insert, 충돌 처리 없음). 이중 클릭·두 기기. | 3동시 요청 → 200,500,500 (V2) |
| 4 | 중간 | M3/M4 | **응답 유실 재시도가 409**: 재시도 해시에 `expectedRevision`이 들어가는데 클라이언트(`create()`)는 재시도마다 현재 revision으로 다시 계산한다. V03의 "응답 유실" 시나리오와 맞지 않음. 또 `act/choose`는 클릭마다 새 commandId라 응답이 유실되면 **같은 진행이 두 번 적용**된다. | 같은 commandId+새 revision → 409 `COMMAND_ID_REUSED`, 원래 revision이면 200 (V5) |
| 5 | 중간 | M4 | 서버 UI 셸이 **규칙을 서버에서 강제하지 않는다**: 이름 500자·야수 SP·없는 유형이 `UI_SEED`로 통과, **다시 UI_SEED하면 진행·강화/유형 변경 기회가 초기화**, `UI_ADVANCE`가 대기 사건 중에도 통과하고 **은퇴 뒤 진행하면 phase가 settle로 되돌아감**, `UI_CHOOSE`가 현재 phase와 무관(시즌 중 드래프트 수락 → 계약), S22 '유지'가 변경 기회를 소모. | V6~V8 로그 |
| 6 | 중간 | M7 | 타입 오류 입력이 **500**(400이어야 함): `requestId:123`, `displayName:123`, `backupId:5`, `restoreRequestId:7`. | 4건 모두 500 (V9) |
| 7 | 중간 | M7 | **구단(CLUB) 백업을 복원하면 CAREER가 된다**(백업 스냅샷에 mode가 없고 복원이 `'CAREER'` 고정). | CLUB 백업 → 복원 save mode=`CAREER` (V10) |
| 8 | 낮음 | M3 | 목록 커서가 **마이크로초를 잃어** 같은 밀리초의 행을 건너뛴다(Postgres 시각은 µs, JS Date는 ms). | 22건 중 `s20`이 1·2쪽 어디에도 없음 (V3) |
| 9 | 낮음 | M8 | Android API 주소 검사가 `https://[::1]`(URL이 `[::1]`로 돌려줘 비교 실패), `0.0.0.0`, `*.localhost`, 사설 IP(10./172.16-31./192.168.)를 통과시킨다. `allowBackup="true"`, release `minifyEnabled false`, `versionCode 1`. | `assert-android-api-base` 3개 모두 OK 출력 |
| 10 | 낮음 | M3 | 세션 만료 처리 없음: 웹은 401을 일반 오류로만 보여주고 토큰을 지우지 않는다(`clearToken` 미사용) → 만료 후 새로고침 전까지 복구 불가. | 코드 정독 (`grep AUTH_REQUIRED` 웹 0건) |
| 11 | 낮음 | M9 | `app.onError`가 오류를 **기록하지 않는다**(운영에서 500 원인 추적 불가), 요청 본문 크기 제한·사용자별 백업/세이브 상한 없음. 복원은 활성 세이브 10개로 막히는데 생성은 상한이 없다(13개 생성됨). | V10, 코드 정독 |
| 12 | 정보 | 상태 보고 | STATUS가 M4를 100%로 센다. 서버 화면 값은 고정 문구(`.312`, `연봉 4,500만`)이고 실제 엔진과 연결되지 않은 UI 셸이다. 문서(M4-COMPLETE)는 이를 밝히지만 STATUS의 "실제 핵심 웹 플레이 화면 100%"는 과장으로 읽힌다. | 문서·코드 대조 |

## 수정 상태 (브랜치 `fix/m3-m9-small`)

| # | 상태 | 수정 |
|---|---|---|
| 1 CORS | 수정 | `hono/cors`를 인증보다 앞에 두고 `https://localhost`·`capacitor://localhost`와 환경 변수 `CORS_ORIGINS`만 허용, 그 밖의 오리진은 헤더 없음 |
| 2 id 충돌 | 수정 | 세이브 id를 `save_<소유자 해시12>_<creationId>`로, 복원은 `save_restore_<해시>_<id>`로 소유자 범위화. 같은 요청 id가 다른 백업을 가리키면 400 `REQUEST_ID_CONFLICT`. 생성 id는 `[A-Za-z0-9._:-]{1,128}` |
| 3 동시 생성 | 수정 | `onConflictDoNothing` 후 재조회(생성·백업·연대기 내보내기·복원) |
| 4 응답 유실 | 수정(클라이언트) | 설계 28이 해시에 expectedRevision을 포함하므로 서버는 그대로 두고, HTTP 클라이언트가 같은 commandId의 재전송에 처음 보낸 revision을 다시 보내며(충돌이면 해제), App은 같은 사용자 의도(진행·선택)의 재시도에 같은 commandId를 쓴다 |
| 5 UI 셸 규칙 | 수정 | 시드는 1회·이름/포지션/좌우/구종 형태/유형/집중 4개 서버 검증, 진행은 시즌 중·대기 사건 없음일 때만, 선택은 현재 phase의 화면·제공된(비활성 아님) 선택지·남은 기회가 있을 때만, S22 '유지'는 기회를 쓰지 않음 |
| 6 타입 오류 500 | 수정 | 모든 요청 id/해시/이름 필드를 문자열·길이·문자 집합 검사, 400으로 응답 |
| 7 구단 백업 | 수정 | 백업 스냅샷에 `mode` 저장, 복원이 보존(이전 백업은 CAREER) |
| 8 커서 | 수정 | 마이크로초 문자열 커서와 `(updated_at,id)` 행 비교 |
| 9 Android | 수정 | 호스트 검사에 IPv6 루프백/ULA/링크로컬/IPv4 매핑, 사설·링크로컬·CGNAT 대역, `0.0.0.0`, `.localhost/.local/.internal/.lan`, 점 없는 호스트 포함. `allowBackup="false"`와 정적 검증 추가. release 서명·`versionCode`는 후속 |
| 10 세션 만료 | 수정 | 401이면 토큰을 지우고 로그인 화면으로 |
| 11 운영 | 일부 수정 | 500을 requestId와 함께 JSON 로그, 응답에 requestId 포함, 생성에도 활성 세이브 상한 10 적용. 본문 크기 제한·사용자별 백업 상한은 후속 |
| 12 STATUS | 미수정 | 진행률 판단은 사용자 결정 |

회귀 테스트: `apps/api/test/m3-m9-fixes.test.ts`(8개), `apps/web/test/http.test.ts`(2개 추가), `scripts/assert-android-api-base.test.mjs`(1개 추가). 기존 M4/M5 셸 테스트는 서버가 phase를 강제하게 되어 정상 흐름(진행 3주→settle→선택)으로 고쳤다.

## 권장 수정 (작은 것부터)

1. CORS: 허용 오리진 목록(환경 변수)과 `Authorization, Content-Type, Request-ID`를 허용하는 미들웨어를 인증보다 앞에 둔다(OPTIONS는 인증 없이 204). Android 오리진 `https://localhost`를 포함.
2. id 전역 충돌: 세이브 id를 `save_${ownerHash}_${creationId}`처럼 소유자 범위로 만들고(복원도 동일), 기존 행 조회에 소유자 조건을 넣는다. 삽입은 `onConflictDoNothing` 후 재조회로 동시 요청을 같은 결과로 만든다.
3. 클라이언트가 재시도 시 처음 보낸 expectedRevision을 다시 보내게 한다(설계 28이 해시에 포함하므로 서버 해시는 유지, 영수증 조회가 이미 revision 검사보다 앞에 있다). `act/choose`의 commandId는 사용자 의도 단위로 유지한다.
4. UI 셸: 서버에서 `UI_SEED`는 BOOT 단계에서만, 이름 1~12글자소·포지션/유형 검증, `UI_ADVANCE`/`UI_CHOOSE`는 현재 phase·대기 사건·선택지 목록과 일치할 때만.
5. M7 입력: 모든 본문 필드를 `typeof === 'string'`·길이로 검증하고 400. 백업 스냅샷에 `mode`를 넣어 복원이 보존. 복원·생성에 같은 활성 세이브 상한 적용.
6. 커서: 마이크로초 문자열(`to_char`)을 쓰거나 정렬 키를 `(date_trunc('milliseconds'), id)`로 통일.
7. Android: 호스트 검사를 `[::1]`·사설 대역·`.localhost`·`0.0.0.0`까지 확장하고 `allowBackup=false`(또는 백업 규칙).
8. 웹: 401이면 토큰을 지우고 로그인 화면으로 돌린다. API: `onError`에서 requestId와 함께 로그.

## 재현 방법

`docs/implementation/evidence/verify-m3-m9/*.txt`를 `apps/api/test/`의 `*.test.ts`로 복사하고(타입체크가 걸리면 미사용 import를 정리) `cd apps/api && npx tsx --test test/zz-verify.test.ts test/zz-verify2.test.ts`. 출력의 `V1`~`V10` 줄이 위 표의 근거다.

## 수정 후 검증

전체 `npm run check` 단일 실행: rules/engine/api 707개 중 통과705·실패0·건너뜀2(Neon 실계정 테스트, 기준선과 같음)·취소0(1487.8초) + 웹 22/22, lint/타입/build/골든/이벤트/설계/Android/자산 검증 통과. [전체 검사](evidence/verify-m3-m9/fix-check.log). 첫 실행은 신규 테스트 파일의 타입 오류 하나로 타입체크 단계에서 멈췄고 수정 후 처음부터 다시 실행했다.
