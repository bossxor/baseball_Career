# 다시, 플레이볼

야구 선수 커리어와 독립 구단 운영 시뮬레이션입니다. 고교·대학 진로, KBO와 가상 미국 리그의 시즌·계약·복귀 등을 구현 중입니다. 저장 API와 웹의 고교 생성·진로·재도전, 대학/미국/KBO 시즌 진행 루프가 연결되어 있습니다. 일부 사건은 웹에서 지원하지 않으며, 저장은 유지됩니다. 상세 범위는 [웹 인계](docs/implementation/M2-WEB-HANDOVER-20261106.md)를 따릅니다.

**M2 전체 완료가 아닙니다.** [최신 인계](docs/implementation/NEXT-SESSION.md)에 기록된 native 경로 증명은 24개 중 4개이며, KBO 시즌 오류와 대용량 상태 직렬화 문제가 남아 있습니다. 미국 복무 2년 native 완주와 재계약 후 첫 시즌 정산 완주, 실데이터 화면의 브라우저·기기 확인 및 최신 소스의 전체 검사는 미검증입니다. 개별 테스트 결과와 controlled 경로를 전체 경로 통과로 해석하지 않습니다.

## 개발 시작

Node.js 24와 npm을 사용합니다. 저장소 루트에서:

```sh
npm ci
npm run dev
```

웹 주소는 Vite 출력에 표시됩니다. API는 기본적으로 포트 3001과 `0.0.0.0`에 바인딩합니다. 로컬 전용이면 `HOST=127.0.0.1`을 설정하세요. 개발 프록시는 기본적으로 `http://127.0.0.1:3001`을 사용하며, API 포트를 바꾸면 `PORT`와 `API_PROXY_TARGET`을 함께 설정합니다.

환경 변수 예시는 [.env.example](.env.example)을 참고하세요. API의 실제 저장 기능에는 스키마가 적용된 PostgreSQL `DATABASE_URL`과 인증 설정이 필요합니다. Neon 인증은 `NEON_AUTH_BASE_URL`을 사용하고, 로컬 테스트 전용 개발 인증은 `AUTH_MODE=dev`로 켭니다. 개발 인증을 운영 환경에서 사용하지 마세요. 웹에서 실제 API를 사용하려면 `VITE_API_BASE`를 설정합니다. 미설정 시 웹은 fixture 모드입니다. Vite 변수는 빌드 시 반영됩니다. 서버는 `.env`를 자동으로 읽지 않으므로 실행 환경에 변수를 설정하세요. 스키마 적용과 인증 상세는 [M3 저장·명령 파이프라인](docs/implementation/M3-A-SAVE-COMMAND-PIPELINE.md)과 [M3 기록](docs/implementation/M3-COMPLETE.md)을 참고하세요. 비밀값은 Git에 올리지 마세요.

```sh
npm run check   # 전체 정적 검사·테스트·빌드·검증
npm run smoke   # 빌드된 웹/API HTTP smoke
npm start       # 빌드된 API만 실행
```

## 기준 문서

- [최신 인계와 검증 범위](docs/implementation/NEXT-SESSION.md)
- [구현 진행 기록](docs/implementation/PROGRESS.md) · [구현 로드맵](docs/design/120-IMPLEMENTATION-ROADMAP.md)
- [설계 시작점](docs/design/START-HERE.md) · [확정 결정](docs/design/14-CANONICAL-DECISIONS.md) · [설계 상태](docs/design/STATUS.md)
- [테스트 계획](docs/implementation/M2-BULK-IMPLEMENTATION-AND-TEST-PLAN.md) · [개발 환경](docs/implementation/DEVELOPMENT.md) (오래된 상태 설명은 최신 인계와 코드 우선)
- [TF 운영](docs/implementation/TF-OPERATIONS.md) · [벤치마킹](docs/benchmark/SLB_CAREER_PLAYTHROUGH.md) · [로컬 에셋](docs/assets/ASSET_INVENTORY.md)

설계 정적 검증과 실제 앱·DB·기기 검증은 별개입니다.
