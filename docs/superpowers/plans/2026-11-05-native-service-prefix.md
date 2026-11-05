# 서비스2년 접두 저장·재사용 구현 계획

> For agentic workers: superpowers:executing-plans 사용. 기존 승인 M2 범위이며 게임 규칙 변경 없음.

Goal: PLAYBALL_NATIVE_RETURN_PREFIX 방식으로 실제 서비스2년 접두를 한 번 생성하고 소스·canonical SHA256·owner를 확인해 재사용한다.
Architecture: 기존 독립2년 캐시를 공통 파일 검증 helper로 보강한다. service는 별도 kind/path·중간 체크포인트를 쓰며 완료 전 native PASS로 세지 않는다. worker는 기존 native 명령만 호출한다.
Tech Stack: 기존 TypeScript/Node fs·crypto·child_process. 새 의존성 없음.
Spec: 사용자 2026-11-05 우선 인계, M2-HANDOFF-20261105, 기존 us-return-retry-fixture 방식.

Constraints: WIP/큰파일 보존, 게임/seed/예산 변경 금지. 생성 source가 변하면 캐시 거절. 빈 캐시 경로는 단일 writer만 생성한다. 외부 임시 폴더 사용. 긴 실행은 hidden background, 반복 폴링 없음. 실제2년 통과 전 기존 WIP 원본 커밋 금지.

- [x] 캐시 무결성/소스 변동/다른 kind/불완전 owner/중복 writer 경계 RED.
- [x] source manifest·원자적 파일 쓰기·잠금·SHA256/owner 검증 helper와 service 체크포인트 생성기.
- [x] 기존 independent cache 보강 및 service WIP 테스트의 캐시 재사용 연결.
- [x] 짧은 helper 검사·타입/린트 후 source freeze. 별도 native background 단일 생성 시작.
- [ ] 실행 동안 엔진 소스 동결, API/test/docs 독립 후속 작업. 결과·source·종료 코드를 구분해 기록.
- [ ] 완료 근거가 있을 때만 WIP/service 관련 커밋. 인계/STATUS 갱신·Co-Authored-By trailer·푸시.

Review focus: 변경 소스의 구 cache 거절, 중간 파일 완료 오인 방지, 동시 생성/중단 후 복구, 원본 seed·기록 보존, 검사 fixture와 native 명령 실행 범위 구분.
