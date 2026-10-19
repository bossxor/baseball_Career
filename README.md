# 다시, 플레이볼

소수 친구용 야구 선수 커리어·독립 구단 시뮬레이션의 **서면 설계 기준본1.0**입니다. 실제 앱 구현·서비스 배포 전입니다.

- [설계 시작 안내](docs/design/START-HERE.md)
- [현재 현황](docs/design/STATUS.md)
- [사용자 결정과 기본안](docs/design/14-CANONICAL-DECISIONS.md)
- [25분야 현재 적용 문서 지도](docs/design/91-CURRENT-CONTRACT-INDEX.md)
- [종결 점검·구현 인계](docs/design/92-DESIGN-CLOSURE-HANDOFF.md)
- [통합 설계 MD](docs/design/DESIGN-ALL.md)
- [화면 목업](docs/design/design-board.html)

45화면·99이벤트·298서면검수기대값·24통합경로·6플랫폼대상을설계했습니다. Android/iPhone/Windows/macOS 온라인웹과Android APK가기본목표입니다. 정적목업은실제게임/로그인/저장을실행하지않습니다.

정적검사: `node docs/design/verify-design.mjs`. 구조·링크·예시산술검사이며게임/Neon/기기/build검증과구분합니다. [검증기록](docs/design/VALIDATION.md)을확인하세요.

사용자는설계후구현을원합니다.현재구현착수지시전에는앱·DB·배포를자동시작하지않습니다. 실제실행게이트는92의V01~12에남아있습니다.