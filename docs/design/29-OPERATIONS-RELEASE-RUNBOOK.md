# 상세설계 11 — 운영·백업·APK·배포 실행 계획

문서계약과읽기전용환경조회만수행. 실제배포/버킷생성/DB테이블변경/로그인구현/APK빌드는하지않았다.

## 확인 사실

2026-10-16 CLI조회:지정프로젝트 polished-truth-68571504,이름baseball_career,조직org-purple-shadow-03640418,지역aws-ap-southeast-1. 설치된Neon공식스킬의객체저장소지원지역과일치. 기존서비스/보호설정/Auth지원/버킷/DB접속성공을이조회만으로보장하지않음. GitHub계정과push는연속설계커밋에서검증. Node/npm/Java/ADB실행파일존재확인,Android Studio/SDK/Gradle호환/실기기/서명은별도.

## 사전 점검 순서

1. 정상checkout/AGENTS/변경파일/remote확인. 사용자의기존설정/문서덮어쓰기금지.
2. Neon CLI프로필은비밀출력없이확인. 로그인필요시사용자가브라우저인증,대체프로젝트생성금지.
3. .neon/neon.ts/.env*존재와관리변수이름만검사. 이미공급된DATABASE_URL이면보존. dev브랜치생성/연결은실제구축단계에서수행.
4. 요청한postgres/private object-storage선언과live plan비교. Auth추가는선택한인증설계와실제지원/보호설정확인후별도선언. 허용IP/PrivateNetworking을편의상해제하지않음.
5. direct migration→개발테스트→운영backup→호환migration→서비스→APK순서.

## 백업 원자성·보존

소스revision을잠깐확정하고고정snapshot을job에참조,객체업로드는긴DB잠금밖에서실행. pending/uploaded/ready/failed상태,체크섬일치후ready. 동일backupId/key로재시도. 인접게임진행이revision을올려도원backup의state를바꾸지않음. 일반진행저장과파일실패분리.

복원은소유권→크기제한→gzip완료→스키마/버전→SHA256→불변조건→새saveId. 원본/새세이브선수IDnamespace매핑,이전receipt복사없음. 프로필/인증세션은게임백업에포함하지않음. imported원본참조를못열어도복사본자체능력은독립보존.

자동10/수동10보존. 보존정리job은새backup ready후실행,업로드중마지막정상백업을먼저삭제하지않음. 삭제키는DB소유권/참조/보존검사후확정,로그에서명URL/secret없음. 실패시기존ready파일유지. 계정삭제시30일내보존기간정책적용,운영복구시에삭제계정데이터재노출방지목록유지.

## 서버·웹 배포

Node단일호스트가API/정적웹제공(16). health는프로세스/ready는DB기본조회+schema호환,응답에비밀/DB주소없음. 버전endpoint는app/api/schema최소호환버전만. DB장애면새명령일시거부,이미받은명령은receipt확인후재개.

시크릿은호스트환경에만,GitHub Actions로그의env전체출력금지. 공개빌드에는API주소/버전/기능표시만. dev/prodAPI주소와Neon연결혼합금지. 캐시해시는정적자산,저장API는private/no-store. 보관원본다운로드도공개CDN으로캐시하지않음.

실패대응:빌드실패현재서비스유지;호환migration실패쓰기중지/진단;런타임회귀는이전호환서비스복귀;새schema세이브를옛앱이못읽으면읽기거부/업데이트안내. 운영state일괄리셋/DBdrop/강제push를복구절차로사용하지않음.

## Android 릴리스

고정packageId는출시명결정뒤정하고서명키를새빌드마다만들지않음. 키는저장소/ZIP밖에보관,외부별도백업. 버전코드단조증가/표시버전동기화. 로컬웹자산포함,HTTPS운영API사용,cleartext운영허용금지. 시스템브라우저로그인/AppLinks/DigitalAssetLinks인증서fingerprint연결확인.

release APK설치→로그인복귀→보호API→커리어저장→강제종료/재개→웹같은계정조회→기존서명업데이트→보관원본/백업복원. debug성공을release성공으로대체하지않음. APK를다른사람에게보내는배포/스토어등록은이설계의실행이아니다.

## 실증 차단표

| 항목 | 현재 | 완료 증거 |
| --- | --- | --- |
| GitHub문서push | 확인 | local HEAD=origin/main |
| Neon프로젝트지역 | 확인 | 필터링CLI메타데이터 |
| DB마이그레이션/트랜잭션 | 미실시 | 개발브랜치테스트출력 |
| private파일업/다운 | 미실시 | 실파일체크섬/접근거부 |
| 웹/APK로그인 | 미실시 | 가입/복원/로그아웃/권한거부 |
| 반응형렌더링 | 도구오류 | 각대표화면시각기록 |
| release APK/업데이트 | 미실시 | 실기기버전/서명/진행복원 |
| 호스트가격/도메인 | 미결정 | 소유계정/플랜선택,임의결제없음 |

## 릴리스 승인 자료

npm run build실제출력,엔진/DB/API테스트요약,private스토리지E2E,보안권한음성케이스,웹/APK재로그인/버전호환,미해결결함과사용자영향,롤백대상커밋/마이그레이션버전. 문서에명령을적은것은실행결과가아니다.

## 추가 읽기 전용 조회 결과

production 브랜치 br-nameless-dust-a10jtrs6:ready/primary/default 확인. 데이터베이스SQL이나파일서비스실행검증이아닌브랜치메타데이터다.
로컬실행버전:Node v24.19.0,npm11.17.0,OpenJDK21.0.12.1,ADB1.0.41/37.0.1. Capacitor/Gradle호환이나APK빌드통과를뜻하지않는다.
