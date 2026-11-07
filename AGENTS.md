# 야구커리어 작업 지침

- Caveman을 기본으로 쓴다. 짧고 정확하게 보고하고 코드와 검증은 필요한 만큼 작성한다.
- Ponytail을 기본으로 적용한다. 변경이 필요한지 먼저 확인하고 기존 코드와 표준 기능을 우선 사용한다. 검증, 오류 처리, 접근성, 보안은 유지한다. 설치된 훅의 모드를 존중한다.
- 작업에 도움이 되는 Skills와 Superpowers를 사용한다. 읽기, 검증, 문서 갱신을 중복하지 않는다.
- SLB Career는 직접 관찰한 공통 사용성 패턴만 참고한다. 코드, 이미지, 로고, 문구, 고유 화면은 복제하지 않는다. 프로젝트 로컬 에셋을 먼저 확인해 적합한 화면에 적용한다.
- 타 채팅의 작업과 미커밋 변경을 보존한다. 담당 파일, 검증, 완료 범위를 명확히 하고, 사실은 코드·Git·실행 결과로 확인한다.
- 의미 있는 변경은 코드·검증·관련 문서·Git 기록을 함께 남긴다. [진행](docs/implementation/PROGRESS.md), [최신 인계](docs/implementation/NEXT-SESSION.md), [설계 결정](docs/design/14-CANONICAL-DECISIONS.md)을 갱신한다.
- Claude 팀은 `claude/*` 브랜치에서만 작업하고 Codex 작업 공간(`E:/AI/Game/baseball_*`)과 그 미커밋 변경은 건드리지 않는다. [Claude 팀 운영](docs/implementation/TF-OPERATIONS-CLAUDE.md)
- 설계 문서가 바뀌면 같은 변경에서 영향받는 엔진·API·웹·테스트를 고친다. 못 고치면 [최신 인계](docs/implementation/NEXT-SESSION.md)의 "설계-구현 불일치" 표에 등록하고 해소 전엔 완료로 표시하지 않는다. 벤치마킹 항목 구현 위치는 [SLB 구현 설계서 §6](docs/benchmark/SLB_CAREER_IMPLEMENTATION_SPEC.md).
