# 개발 환경·검증

## 패키지 경계

- `packages/rules`: 순수 규칙/정수 정밀도. 시간·네트워크·Math.random 의존 금지.
- `apps/api`: Hono Node API. 현재 liveness만 구현. 게임 쓰기 엔드포인트는 미노출.
- `apps/web`: React/Vite. 승인 로고·폰트만 직접 참조하며 설계 보드를 앱으로 실행하지 않음.
- engine/db/android는 해당 마일스톤에서 생성하며 빈 패키지를 미리 추가하지 않음.

## 명령

| 명령 | 목적 |
|---|---|
| npm ci | lockfile대로 설치 |
| npm run check | 린트→타입→단위 테스트→프로덕션 빌드→설계 정적 검증10종 |
| npm run smoke | 빌드된 웹·API를 임시 HTTP 포트에서 실제 시작해 응답·프록시 확인 후 종료 |
| npm run dev | rules 빌드 후 API watch·Vite 함께 실행 |
| npm start | 빌드된 API만 실행 |

개발 프록시는 `/api`를 `127.0.0.1:3001`로 전달합니다. API 포트를 변경하면 `PORT`와 웹의 `API_PROXY_TARGET`을 함께 설정합니다. `.env.example`은 변수 이름 설명이며 실제 연결값이 아닙니다. 현재 코드가 dotenv 자동 로딩이나 DB 연결을 수행한다고 해석하지 않습니다.

## 재현성과 보안

Node 24/npm11 기준을 lockfile과 함께 기록합니다. TypeScript는 ESLint 파서가 지원하는 6.0 계열을 사용합니다. 설치 실패를 `--force`/`--legacy-peer-deps`로 우회하지 않습니다. 모든 의존성은 lockfile로 재현합니다. 서버 포트는 로컬 루프백에만 바인딩하며 실제 외부 호스팅은 M9에서 결정합니다.

검증 증거와 실패 내역은 [PROGRESS](PROGRESS.md)에 기록합니다. HTTP smoke는 브라우저 렌더·접근성·Neon·계정 간 격리·기기 이어하기 검증을 대체하지 않습니다.

구성 확인에 사용한 공식 자료: [Vite 시작 안내](https://vite.dev/guide/), [Hono 시작 안내](https://hono.dev/docs/getting-started/basic), [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html). 실제 설치 버전은 package-lock.json을 기준으로 합니다.
