# 16. 계정·배포·운영 설계

## 기본 배치 결정

설계 기본안은 하나의 Node 서비스에서 Hono API와 빌드된 웹 정적 파일을 함께 제공하는 방식이다. 웹/API 동시 배포와 같은 origin 쿠키를 우선해 소수 사용자 운영을 단순하게 한다. 기존06의 웹/API 별도 호스트 제안보다 이 결정이 우선한다. Android APK는 같은 웹 빌드 자산을 포함하고 운영 HTTPS API를 호출한다. 향후 부하가 생기면 정적 호스트를 분리하되 API 계약은 유지한다.

호스팅 기본 후보는 Render Node Web Service. Node 웹 서비스 배포를 공식 문서에서 확인했다. 이 설계는 유료 플랜 가입이나 실제 배포 승인이 아니며 무료·무중단·성능을 보장하지 않는다. 운영자가 계정/지역/비용을 정한 뒤 환경을 생성한다. https://render.com/docs/deploy-node-express-app

DB/비공개 파일은 기존 지정 Neon 프로젝트를 사용한다. 새 프로젝트를 임의로 생성하지 않는다. 지역 또는 기능 제한이 있으면 기존 보호설정을 해제하지 않고 보고한다.

## 인증 기본 결정

기존 로그인 없음이 확인된 상태에서는 Neon Managed Better Auth를 우선 후보로 한다. 공식 neon-auth 스킬의 권고를 따른다. 이는 `auth: true`를 이미 배포했다는 뜻이 아니다. 실제 프로젝트의 AWS/네트워크 제한과 SDK를 확인하고 적용한다. https://neon.com/docs/ai/skills/neon-auth/SKILL.md

v1 로그인 기능: 이메일/비밀번호, 이메일 확인, 비밀번호 재설정, 로그인/로그아웃, 세션 복원. 소셜 로그인은 추가 기능이며 필수가 아니다. 사용자 비밀번호를 게임 DB 테이블에 직접 저장하지 않는다. 소수 친구는 서버의 허용 사용자 목록에 등록된 인증 subject만 게임 API 접근 허용. 게임 API의 allowlist는 인증 제공자의 계정 생성 허용과 구분한다.

웹은 관리형 SDK를 사용해 인증하고 API에서 검증된 세션/JWT의 subject를 확인한다. 발급 토큰은 만료/issuer/audience/서명을 검증한다. JWKS를 캐시하되 key rotation 시 재조회. 이미 발급된 JWT가 로그아웃 즉시 모두 무효화된다고 주장하지 않는다. 앱 API 세션 레코드가 있으면 서버에서 별도 철회 가능하다.

Android는 시스템 브라우저의 같은 웹 로그인으로 시작해 HTTPS App Link로 복귀하는 계약을 우선한다. 네이티브 세션 교환은 로그인 직후 서버가 만든 일회용 code(60초, 단일 사용, client nonce/PKCE challenge 결합)만 전달한다. access/refresh token을 URL에 넣지 않는다. code는 웹 로그인 세션 subject와 바인딩하고 앱은 verifier로 교환한다. 앱 세션은 서버에 hash로 보관한 opaque refresh secret과 15분 access token, 회전·철회 규칙을 가진다. 자체 비밀번호 인증을 만든다는 뜻이 아니라 외부 인증의 앱 세션 연결이다.

위 연결은 구현 시 관리형 인증과 Android에서 반드시 실증할 항목이다. 지원되지 않는 흐름이면 라이브러리 문서를 재검토하고 임의 우회하지 않는다. Android App Links는 도메인과 앱 연결 설정이 필요하다. https://capacitorjs.com/docs/guides/deep-links

## 계정 상태와 UX

회원가입→이메일 확인→허용 여부 확인→게임 홈. 비허용 계정은 '현재 초대한 사용자만 이용할 수 있습니다'와 로그아웃을 제공한다. 인증 실패는 이메일 존재 여부를 드러내지 않는 공통 안내. 비밀번호 변경/재설정은 제공자 지원 흐름을 사용하고 게임 화면에 임의 이메일 발송 API를 만들지 않는다.

로그아웃은 진행 중 명령의 결과 조회 후 로컬 세션과 사용자 캐시 정리, 세이브 자체 삭제 없음. 계정 삭제는 재인증+명시 확인 뒤 게임 데이터 삭제 job, 외부 인증 계정 삭제, 완료 확인까지 별도 작업으로 처리한다. 실패 시 pending 상태를 유지하며 접근은 제한한다. 운영 백업의 삭제 반영 기간은 최대30일 기본 정책으로 도움말에 기재한다.

## 환경과 배포 명세

환경3개: 로컬 / 개발 / 운영. Neon도 개발 브랜치와 production 분리. 개발을 production 데이터로 쓰지 않는다. 런타임 버전은 착수 시 지원 중 Node LTS와 Capacitor/Android 호환표를 확인해 lockfile/도구파일로 고정하며 지금 특정 최신 버전을 추측해 고정하지 않는다.

예정 명령(아직 존재/실행하지 않음): `npm run dev`, `npm run build`, `npm run start`, `npm run test:engine`, `npm run test:integration`, `npm run android:sync`, `npm run android:release`. 실제 구현자가 이 계약에 맞춰 scripts를 작성한다.

운영 순서: CI 정적검사·빌드·단위테스트→개발 migration→개발 통합/전체경로→운영 백업→호환 migration→API/웹 배포→health/version 확인→스모크→서명 APK→업데이트 테스트. 배포 실패 시 기존 앱 유지, DB를 역삭제하는 무작정 down migration 금지.

릴리스마다 API 최소 clientVersion과 save schemaVersion 공지. APK는 같은 서명키·packageId·증가 versionCode. 서명키는 문서 묶음/Git/ZIP에 포함하지 않음. 운영 키 분실 대비 외부 별도 백업. APK 업데이트 때문에 계정 클라우드 데이터가 없어지지 않아야 한다.

## 운영 수치 기본안

명령 timeout30초, 게임 청크 계산 목표1초 미만, 5초 초과 시 청크 축소 검토. DB cold start는 별도 측정. 사용자당 명령 분당60, 생성 분당5, 백업 시간당10, 로그인 제한은 인증 제공자 정책+API 제한. 실제 사용자 실패가 반복되면 이유를 보고 조정한다.

일반 자동백업 시즌당1, 최근10개+수동최근10개 유지. 삭제된 세이브30일 후 정리. 원본 보관 선수는 숨김으로 처리하고 사용자의 최종 삭제 확인 전 지우지 않는다. 객체 청소는 DB 참조와 job 상태 모두 확인한다. 백업이 아닌 일반 진행은 스토리지 장애에도 작동한다.

## 확인해야 할 실제 환경

Neon 지역/권한/기존 서비스, Auth 사용가능 여부, 운영 사용자 허용목록, HTTPS 도메인/App Links 소유권, 호스트 계정·플랜, Android 개발도구·실기기·서명키. 전부 실환경 확인 전에는 '작동 확인'으로 표시하지 않는다. 설계·인수인계 패키지에는 자격증명 대신 필요한 변수명만 포함한다.
