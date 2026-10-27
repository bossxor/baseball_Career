# DI 미국 실제 경기 검증 재개

최신 상태는 V:/.local-verification/M2-DI-US-native/latest.json. 현재 PARTIAL_SAFE_STOP, 마감80일, 실제 3857경기, 호출1757. 날짜 중간 FINAL 경기가 포함될 수 있으며 날짜·성장 완료를 조작하지 않았다. 전체8790경기 완료 아님.

실행 코드는 M2-DI-source-freeze.json의395개 파일과 Node v24.19.0, native-runner.mjs.txt의 SHA256을 모두 확인한다. 전체 check와의 자원 경쟁을 피하기 위해 STOP 파일이 있다. 재개 전 전체 검사 완료와 실행 원본 일치를 확인하고 STOP만 제거한다. 실행기를 .mjs 파일로 복사한 뒤 체크아웃에서 node --import tsx <runner.mjs 절대경로> V:/.local-verification/M2-DI-US-native 로 실행한다. 소스가 변경되었다면 지문 검사를 우회하지 말고 검증된 고정 코드에서 재개한다.

원래 DH의3600경기 저장점/332파일 ZIP은 그대로 보존했다. DI는 구/신 실제 다음 게임 날짜35청크 대조 결과3675경기 상태를 native-migration.json의 지문으로 받아 시작했다. 대조는 타자·미진행 학습0건 시나리오다. native8790 경기가 끝나면 연간 성장/급여/계약금1회까지 확인하고 US_REGULAR_COMPLETE를 기록한다. 미국 전체 커리어 또는 M2 전체 완료와 구분한다.
