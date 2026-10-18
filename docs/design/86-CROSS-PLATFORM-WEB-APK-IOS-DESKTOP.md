# 86. 안드로이드·아이폰·윈도우·맥 지원 범위

2026-10-19. U: 최초 요청은 웹앱+Android APK였으며 네 환경 모두 가능한지 확인했다. 기존06의 React/Vite 공통 UI·Hono API·Neon 저장 구조를 유지하고 브라우저 지원 대상을 명시한다. 아래는 지원 목표와 검수 계약이며 현재 실행 가능한 앱이 출시됐다는 의미가 아니다.

## 배포 형태와 범위

| 환경 | 기본 제공 목표 | 별도 설치형 |
|---|---|---|
| Android | 모바일 웹,홈 화면 웹앱 | 서명된 APK,기존 필수 범위 |
| iPhone | Safari 모바일 웹,홈 화면에 추가한 웹앱 | iOS 네이티브 패키지는 후속 선택 범위 |
| Windows | PC 브라우저 웹 | 전용 exe 설치형은 후속 선택 범위 |
| macOS | Safari/Chrome 계열 PC 웹 | 전용 dmg/app 설치형은 후속 선택 범위 |

APK는 안드로이드용이며 iPhone·Windows·macOS 설치 파일이 아니다. 네 환경의 브라우저 플레이는 하나의 반응형 웹을 배포해 지원한다. iPhone에서는 Safari의 홈 화면 추가로 앱처럼 실행하는 사용 경로를 제공한다. 이 경로를 App Store에서 설치하는 iOS 앱이라고 표현하지 않는다. 데스크톱 웹앱 설치 제공 여부는 브라우저 기능을 감지하고 설치 버튼이 없는 경우에도 일반 URL 플레이가 가능하게 한다.

D: 첫 배포는 네 환경의 웹+Android APK. iOS 네이티브나 Windows/macOS 전용 설치형은 사용자가 원할 때 추가한다. 지금 질문을 별도3종 네이티브 배포 지시로 확대하지 않는다. 모든 필수 게임 모드는 브라우저와APK에서 같아야 하며 iPhone이라고 대학·병역·구단 운영을 빼지 않는다.

## 공통 코드와 플랫폼 어댑터

공유: 화면·6능력·확률/효과 컴포넌트·폼 검증·API 클라이언트·진행 상태/명령 저널 규약. 엔진·RNG·세계 revision·계약/금액 판정은 서버가 권한을 가진다. 브라우저마다 계산 차이로 공식 기록이 달라지지 않게 한다. Neon DB/스토리지 비밀키는 서버 환경에만 둔다.

플랫폼 어댑터: 로컬 저널/초안,로그인 복귀,파일 다운로드·공유,앱 resume/visibility 이벤트,뒤로가기. 웹은 IndexedDB와 서버 인증 세션,Android는 앱 샌드박스 저널과28의 네이티브 인증 계약. UI가 Capacitor 전용 API를 직접 호출하지 않고 웹 fallback을 제공한다. 브라우저에 없는 공유·다운로드 기능 때문에 경기나 저장이 막히지 않는다.

iPhone Safari와 홈 화면 웹앱은 로그인/로컬 저장을 공유한다고 가정하지 않는다. 각 실행 환경에서 필요하면 로그인하고 같은 계정의 서버 확정 진행을 조회한다. PC↔스마트폰 역시 동일 로그인 계정으로 이어간다. 로그인 세션·미송신 초안이 기기 간 자동 복사된다는 뜻이 아니다. 두 기기에서 동시에 확정하면74의 revision 충돌과 receipt 규칙으로 중복을 막는다.

## PWA와 온라인 경계

manifest는 앱명 '다시, 플레이볼',icons,start_url,scope,standalone 표현을 갖는다. HTTPS 운영에서 홈 화면 경로를 검수한다. 웹 manifest·서비스워커를 갖추는 것은 구현 작업이며 현재 이 설계만으로 설치 기능이 동작하는 것은 아니다.

서비스워커를 사용할 경우 버전이 붙은 정적 UI 자산만 캐시한다. 인증·저장·개인 기록 API·짧은 서명 URL을 public cache에 넣지 않는다. 오프라인은 설치 셸·기기 설정·이전에 확인한 캐시 읽기까지,새 경기·계약·강화 등 세계 진행은 불가다. PWA 설치와 오프라인 게임 가능을 혼동하지 않는다.

새 자산 다운로드 후 업데이트 안내를 제공하고 미확정 명령/저널을 유실시키는 강제 reload를 하지 않는다. API 최소 호환 버전보다 오래된 웹/APK는 갱신 안내 후 새 명령을 차단하며 오래된 코드로 새 schema를 쓰지 않는다. iOS 배경 전환 때 작업자가 계속 실행된다고 가정하지 않고76의 서버 상태 조회로 복귀한다.

## iOS 네이티브를 추가한다면

기존 웹 UI를 Capacitor iOS로 재사용할 수 있지만 iOS 프로젝트·플러그인·인증 복귀·보안 저장·서명·배포·실기기 검수가 추가된다. APK를 변환하거나 확장자만 바꾸는 작업이 아니다. Capacitor 공식 문서상 iOS 빌드에는 macOS와Xcode 환경이 필요하다. 로컬 Mac 또는 macOS 빌드 환경 확보를 실제 착수 때 확인하며 현재 접근 가능하다고 주장하지 않는다.

배포 방식·Apple 계정·서명·테스트 배포/스토어 제공은 그 단계에서 별도로 정한다. 비용 결제·계정 등록·App Store 공개를 이번 설계 작업으로 실행하지 않는다. PC 전용 설치형도 동일하게 별도 래퍼·서명·업데이트 계약과 검수가 필요하다.

## 검수 대상

출시 시 안정 버전 및 직전 주요 버전을 D 브라우저 검수 정책으로 삼고 실제 OS/브라우저/기기 버전을 결과에 기록한다. Android APK 최소 OS는 채택할 Capacitor·플러그인 버전과 실기기 검수로 확정하며 임의 버전 숫자를 호환 보장처럼 적지 않는다.

CP01 Android Chrome 웹,CP02 iPhone Safari 웹,CP03 iPhone 홈 화면 웹앱,CP04 Windows Chrome/Edge 웹,CP05 macOS Safari/Chrome 웹,CP06 Android release APK. 각 대상에서 생성→1경기→저장→종료→같은 환경 복귀→다른 환경 동일 계정 이어하기,로그아웃·계정 격리,긴 이름·6능력·종합·확률·파일 다운로드를 시험한다. CP01~06은 검수 계획이며 실제 통과 결과가 아니다.

## 근거와 인계

2026-10-19 공식 문서 확인: [Capacitor 환경 설정](https://capacitorjs.com/docs/getting-started/environment-setup)은 Web/Android/iOS 대상과 iOS의 macOS/Xcode 빌드 환경을 안내한다. [Apple iPhone 사용 설명서](https://support.apple.com/en-mide/guide/iphone/iphea86e5236/27/ios/27)는 Safari에서 홈 화면 웹앱으로 추가하는 방법을 안내한다. 배포 시 문서를 다시 확인한다.

기존 웹/APK 표현은 이 문서의 네 환경 웹 지원을 포함하도록 읽는다. [76 이어하기](76-CROSS-PLATFORM-INTERRUPTION-RESUME.md), [80 화면 복귀](80-SCREEN-STATES-NAVIGATION-RECOVERY.md), [83 시각 기준](83-VISUAL-ASSETS-ACCESSIBILITY-HANDOFF.md), [84 게이트](84-DESIGN-GATES-END-TO-END-PATHS.md)를 CP01~06에 적용한다. 서면 기대값274개 집계는 유지하며 플랫폼 검수6대상은 별도 계획으로 센다.