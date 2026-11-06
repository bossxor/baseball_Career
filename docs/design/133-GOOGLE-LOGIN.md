# 133. 구글 로그인 설계 (보류 — 2026-11-06 사용자 결정: M2 범위 밖, 구현하지 않음)

상태: **설계 제안**. 코드·설정·비밀값 변경 없음. 외부 서비스(구글/Neon) 동작은 이 문서 작성 시 직접 실증하지 않았다. 구현 착수 때 공식 문서·플러그인 호환을 다시 확인한다. 기존 [16](16-AUTH-OPERATIONS.md)·[87](87-PLATFORM-LOGIN-ACCOUNT-HANDOFF.md)의 "소셜 로그인은 추가 기능"을 구체화한다.

## 1. 현재 인증 구조와 붙는 지점

- API `apps/api/src/auth.ts` `resolveSubject(authorization, options)`: `Authorization: Bearer <t>` 하나에서 **subject 문자열**만 뽑는다. 두 경로:
  1. `allowDevBearer`(AUTH_MODE=dev)일 때 `dev:<subject>`
  2. `neonAuthBaseUrl`이 있으면 Neon Managed Auth JWT를 JWKS(`/.well-known/jwks.json`, EdDSA, issuer=origin)로 검증, `payload.sub`
- 그 뒤 `requireAuth`가 `auth_allowed_subjects`(subject, status=ACTIVE)로 초대 허용을 확인하고 `c.set('subject')`. 이후 모든 보호 라우트(`app.ts` `protectedRoutes`)는 subject만 쓴다. `profiles.id`/`game_saves.owner_id`도 subject 텍스트(`game-creations.ts:79`, `restores.ts:133`가 `onConflictDoNothing`으로 프로필 생성).
- 웹 `apps/web/src/main.tsx`: `VITE_API_BASE`가 있고 토큰이 없으면 `Login` 화면. 이메일/비밀번호 → `auth-session.ts signInForJwt`(Neon `/sign-in/email` → `/token`) → `sessionStorage['playball.jwt']`. 401이면 `onUnauthorized`가 토큰을 지우고 로그인 화면으로 복귀. `http.ts`가 매 요청 Bearer를 붙인다.
- Android는 같은 웹 빌드를 Capacitor(`kr.againplayball.app`, androidScheme https)로 감싼다. 현재 네이티브 인증 코드는 없다.

**붙는 지점은 한 곳**: `resolveSubject`에 세 번째 분기(구글 ID 토큰 → `google:<sub>`)를 추가한다. 허용 목록·소유자 분리·세이브·CORS는 그대로. 웹은 `Login` 화면에 버튼 하나와 토큰 저장 호출 하나만 추가한다.

## 2. 클라이언트 흐름

공통 규칙: 클라이언트는 **구글 ID 토큰(JWT)** 을 받아 기존과 같이 `Authorization: Bearer`로 보낸다. 구글 access token·refresh token은 앱이 보관하지 않는다. 서버에 새 세션/쿠키를 만들지 않는다(§3 대안 참고).

### 웹
Google Identity Services(`https://accounts.google.com/gsi/client`)의 "Sign in with Google" 버튼(`google.accounts.id.initialize({client_id, callback})`). 콜백의 `credential`이 ID 토큰이다. `writeToken(credential)`로 기존 저장소에 넣고 `setToken`. 이메일 폼·dev 버튼은 유지(공존).
- 스크립트는 로그인 화면에서만 로드(CSP/오프라인 영향 최소화).
- ID 토큰 수명은 약 1시간. 만료 시 API가 401 → 기존 `onUnauthorized`가 로그인 화면으로 돌린다. `auto_select`/원탭으로 재로그인 마찰을 줄인다. 무음 갱신 서버 세션은 만들지 않는다(§5 결정 D2).

### Android (Capacitor)
**권장안: Credential Manager 기반 Capacitor 플러그인 1개(`@capgo/capacitor-social-login`의 Google provider)**. 근거:
1. 구글이 Android 구형 `GoogleSignInClient`를 대체한 공식 경로가 Credential Manager(+Sign in with Google)이며 플러그인이 이를 감싼다. 반환값이 웹과 같은 **ID 토큰** → 서버 검증 코드가 웹/앱 하나로 공통.
2. WebView 안에서 GIS 팝업/리다이렉트를 쓰면 `https://localhost` origin(Capacitor)이 구글 승인 origin이 될 수 없어 불안정하다. 네이티브 시트가 정석이다.
3. 시스템 브라우저+App Link 방식([16]의 일회용 code 교환)은 도메인 소유 인증·서버 code 교환 엔드포인트까지 새로 만들어야 해 가장 크다.
- 플러그인에 **웹 클라이언트 ID**를 `serverClientId`(webClientId)로 넘기면 발급 ID 토큰의 `aud`가 웹 클라이언트 ID가 된다. 서버는 aud 하나만 검증하면 된다.
- 미실증/주의: 플러그인의 Capacitor 8 호환 버전, Android `minSdk`, Credential Manager 의존성 충돌은 **착수 시 확인**한다. 맞는 플러그인이 없으면 대안은 프로젝트 내 소형 네이티브 플러그인(Kotlin, `androidx.credentials` + `googleid`)이며 JS 인터페이스(`signIn(): {idToken}`)는 동일하게 유지한다.
- 앱 판별은 `Capacitor.isNativePlatform()`: 네이티브면 플러그인, 아니면 GIS 버튼.

## 3. 서버

### 검증 (`jose`는 이미 의존성)
`createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))` + `jwtVerify(token, jwks, {issuer: ['https://accounts.google.com','accounts.google.com'], audience: GOOGLE_WEB_CLIENT_ID, algorithms:['RS256']})`.
- 서명(JWKS 자동 캐시·회전), `iss`, `aud`, `exp`/`nbf` 검증. `sub` 필수, `email_verified`는 보지 않는다(이메일을 쓰지 않으므로).
- `azp`는 aud 단일 검증으로 충분. aud에 안드로이드 클라이언트 ID는 허용하지 않는다(serverClientId 사용 전제).
- 환경변수: `GOOGLE_WEB_CLIENT_ID`(공개값, 비밀 아님). 없으면 구글 분기 비활성 — `health.auth`에 `'google'` 표기 추가 여부는 구현 시 판단.
- 분기 순서: dev → (토큰 `iss`를 검증 전에 읽어 `accounts.google.com`이면 구글, 아니면 Neon). `iss` 읽기는 분기 선택에만 쓰고 신뢰하지 않으며 선택된 쪽의 전체 검증이 필수.

### 계정 키 매핑
- subject = `google:<sub>`. 접두사로 Neon sub·`dev:`와 충돌 불가, 이후 다른 제공자(`apple:` 등)도 같은 규칙.
- 구글 `sub`는 계정 불변 식별자. **이메일은 키로 쓰지 않는다**(변경·재사용 가능).
- 같은 사람이 이메일 로그인과 구글 로그인을 둘 다 쓰면 **서로 다른 계정**(세이브 분리). 자동 병합 없음(이메일 일치만으로 병합하면 계정 탈취 경로). 연결 기능은 이번 범위 밖.

### 허용 목록과 기존 방식 공존
- 기존 `auth_allowed_subjects`를 그대로 사용(스키마 변경 없음): 행 `google:<sub>`, ACTIVE.
- 신규 로그인 사용자는 목록에 없어 `auth.forbidden` 401. 클라이언트는 이 때 **내 계정 코드**(`google:<sub>` — 비밀 아님)를 보여 주고 복사 버튼을 제공, 운영자가 SQL/관리 절차로 추가한다(결정 D1).
- `dev:` 토큰은 `AUTH_MODE=dev`일 때만, Neon 이메일은 `NEON_AUTH_BASE_URL` 설정 때만 계속 동작. 운영에서 dev를 끄는 현행 원칙 유지.
- `profiles.displayName`은 현재 subject를 그대로 쓴다. 구글 이름을 저장하지 않고 이 값을 유지하거나 고정 문구로 바꿀지는 구현 때 판단(결정 D4).

### 저장 데이터·개인정보 최소화
- 서버에 저장: `google:<sub>`(allowlist, profiles, owner_id)만. **이메일·이름·사진·ID 토큰 저장 금지**, 로그에도 토큰·이메일 기록 금지(현행 `requestId`만 기록).
- 요청 스코프는 `openid`만(기본 ID 토큰 `sub`). 이메일·프로필 스코프를 추가 요청하지 않는다.
- 토큰은 웹 `sessionStorage`(현행)에만. 네이티브도 앱 메모리/sessionStorage 수준. refresh 개념 없음.

## 4. 사용자가 직접 해야 할 것 (체크리스트)

비밀값은 문서·커밋·채팅에 넣지 않는다. 아래 중 **클라이언트 ID는 공개 식별자**이지만 클라이언트 시크릿은 이 설계에서 **생성·사용하지 않는다**(웹 ID 토큰 흐름은 시크릿 불필요).

- [ ] Google Cloud 프로젝트 선택/생성
- [ ] **OAuth 동의 화면**: 앱 이름 "다시플레이볼", 지원 이메일, 사용자 유형(외부), 스코프는 기본(`openid`)만. 게시 상태: 테스트 중이면 테스트 사용자 최대 100명 등록 필요, 소수 지인용이면 "테스트" 유지도 가능(토큰 수명 제약 없음은 ID 토큰 방식에서 영향 적음 — 게시 전 정책 재확인)
- [ ] 개인정보처리방침/약관 URL(게시 시 필요 — 수집 항목: 구글 계정 고유 ID뿐)
- [ ] **OAuth 클라이언트 ID(웹 애플리케이션)** 생성: 승인된 JavaScript 원본에 운영 웹 origin, 로컬 개발 `http://localhost:<포트>` 추가 → `GOOGLE_WEB_CLIENT_ID`, 웹 빌드 변수 `VITE_GOOGLE_CLIENT_ID`(둘 다 같은 웹 ID)
- [ ] **OAuth 클라이언트 ID(Android)** 생성: 패키지명 `kr.againplayball.app` + **SHA-1** 지문
  - 디버그 빌드용 SHA-1(`keytool -list -v -keystore <debug.keystore>`), 릴리스 서명키 SHA-1, Play App Signing을 쓰면 Play 콘솔의 앱 서명 SHA-1도 각각 등록(여러 개 가능, 클라이언트 ID를 지문마다 만들 수도 있음)
  - Android 클라이언트 ID는 앱 코드에 직접 넣지 않아도 되지만(웹 ID를 serverClientId로 사용) **등록 자체는 필수**
- [ ] 서버 환경변수 `GOOGLE_WEB_CLIENT_ID` 설정(호스트 비밀 저장소, Git 금지)
- [ ] 첫 로그인 후 표시되는 계정 코드를 받아 허용 목록에 추가(또는 D1 결정에 따른 절차)
- [ ] 실기기 1대 이상에 구글 계정 로그인된 Play 서비스 환경 확인(에뮬레이터는 Google APIs 이미지)

## 5. 구현 단계와 테스트 계획

단계 (각 단계 독립 커밋, 기존 테스트 유지):
1. **서버**: `auth.ts`에 `verifyGoogleIdToken`/구글 분기 + 옵션 `googleClientId`(+ 테스트 주입용 `googleJwks`·`googleIssuers`) 추가. 구글 옵션 없으면 동작 불변.
2. **웹**: `Login`에 구글 버튼, `auth-session.ts`에 GIS 로더/토큰 콜백. 계정 코드 안내 표시(403 시).
3. **Android**: 플러그인 추가, `cap sync`, 서명 지문 등록 후 디버그 APK 설치·로그인 실기기 확인.
4. 문서: 운영 환경변수/체크리스트를 README·HANDOFF에 반영.

테스트 (외부 접속 없음):
- `jose`로 **테스트 전용 키쌍** 생성(`generateKeyPair('RS256')`), 로컬 JWKS(`createLocalJWKSet`)를 옵션으로 주입. 이 키는 테스트 메모리에만 존재하며 저장소에 키 파일을 두지 않는다.
- 케이스: 정상 → subject `google:<sub>`·허용 목록 일치 시 200; 서명 키 불일치; `aud` 불일치; `iss` 불일치; 만료; `sub` 없음; `alg=none`/HS256 거부; 허용 목록에 없으면 `auth.forbidden`; 같은 sub가 두 번 요청해도 같은 owner; `dev:`·Neon 분기가 기존 테스트대로 유지; 구글 옵션 미설정 시 구글 토큰 거절.
- 웹: 버튼이 토큰을 저장/401에서 되돌아오는 단위 테스트(GIS는 stub).
- 실제 구글과의 통합(JWKS 실조회, 실기기 시트)은 **자동 테스트 대상 아님** — 수동 체크 항목으로 남기고 미검증으로 보고한다.

## 6. 위험과 대응

- **오프라인/구글 서비스 장애**: JWKS는 서버가 캐시하며(`jose` 기본 쿨다운), 캐시가 있으면 구글 접속 없이 검증 가능. 최초 기동 직후 구글 장애면 구글 로그인만 실패, 이메일·dev 경로는 영향 없음. 클라이언트는 로컬 세이브가 없는 클라우드 구조라 오프라인 플레이는 이 기능 범위 밖.
- **ID 토큰 1시간 수명**: 장시간 플레이 중 401. 현행 401 처리(로그인 화면 복귀) 시 진행 중 명령은 기존 receipt 재조회 규칙([87])을 따른다. 불편이 크면 서버 세션 도입(D2).
- **토큰 탈취/재사용**: 1시간 Bearer. HTTPS 전제, 로그 금지. 웹은 sessionStorage(XSS 위험 현행과 동일).
- **계정 삭제**: [16] 규칙대로 별도 재인증+삭제 job. 구글 쪽은 우리 서버가 구글 계정을 삭제할 수 없으므로 "게임 데이터 + allowlist/profile 삭제 + 구글 연결 해제 안내(구글 계정 설정의 서드파티 액세스)". 같은 `sub`로 재로그인하면 새 계정처럼 허용 목록에서 막힘(삭제 상태 유지 시) — 삭제 후 재가입 정책은 D3.
- **구글 약관·정책**: 동의 화면 검수/게시 상태, 브랜드 가이드(버튼 모양)와 개인정보 URL 필요. Play 스토어 배포 시 데이터 안전 항목에 "계정 식별자 수집" 기재.
- **SHA-1 불일치**: 디버그/릴리스/Play 서명별로 지문이 달라 "개발자 오류(10)"가 가장 흔한 실패. 체크리스트의 지문 전부 등록.
- **WebView/origin**: 앱에서 GIS 웹 버튼을 쓰지 않는다(§2).
- **allowlist 부트스트랩**: 계정 코드 방식이 번거로움(D1).

## 7. 미결정 (제안안 → 사용자 확정 필요)

| ID | 질문 | 권장 |
|---|---|---|
| D1 | 허용 목록 등록 방식: 구글 `sub` 코드 수동 등록 vs 이메일 사전 등록(이메일 스코프·저장 필요) | sub 코드 수동 등록(저장 최소) |
| D2 | 1시간 후 재로그인으로 충분한가, 서버 세션(자체 refresh)을 둘 것인가 | 재로그인(원탭). 불편 확인 후 도입 |
| D3 | 삭제 후 같은 구글 계정 재가입 허용/차단 | 허용 목록에서 제거 → 초대 재요청 |
| D4 | `profiles.displayName`: subject 유지 vs 고정 문구 | 고정 문구 "플레이어"(구글 이름 저장 안 함) |
| D5 | 대안: Neon Managed Auth의 구글 소셜 로그인 사용(서버 코드 변경 없이 JWT 유지). 프로젝트 지원 여부 미실증 | 직접 ID 토큰 검증 채택(이 문서). Neon 지원이 실증되면 재검토 |
| D6 | 이메일 계정과 구글 계정 연결 | 이번 범위 제외 |

## 8. 이번 범위 밖
계정 연결/병합, 애플 로그인, 서버 자체 세션·refresh, 구글 API 호출(캘린더 등), 이메일 수집.
