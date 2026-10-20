# 다시, 플레이볼

야구 선수 커리어·독립 구단 운영 시뮬레이션. 고교216경기·성장/진로·대학 입학/연도 등록에 이어 대학 정규216경기·선수권·성장/학년 완료를 구현했습니다. 전체241/241·check·HTTP smoke를 통과했습니다. 대학 연말 마감/진급·NPC 지속성장과 KBO 모집, 플레이 UI·계정·DB 저장은 남아 있습니다.



## 개발 시작

Node.js 24 LTS와 npm을 사용합니다. 로컬 디스크에 Git checkout을 만들고 저장소 루트에서 실행하세요.

```sh
npm ci
npm run check
npm run smoke
npm run dev
```

웹 주소는 개발 서버 출력에 표시됩니다. API 기본 주소는 http://127.0.0.1:3001 입니다. 현재 게임 진행·계정·DB 저장은 아직 연결되지 않았습니다. `npm run start`는 빌드된 API만 실행하며 웹 정적 배포는 별도입니다.

## 이어서 작업하기

- [구현 진행·다음 작업](docs/implementation/PROGRESS.md)
- [개발 환경과 검증](docs/implementation/DEVELOPMENT.md)
- [설계 시작점](docs/design/START-HERE.md)
- [구현 순서 M0~M9](docs/design/120-IMPLEMENTATION-ROADMAP.md)

`docs/design`의 정적 설계 검증과 실제 앱 실행 검증은 별개입니다. 세이브·인증·DB·Android 검증은 해당 기능을 구현한 뒤 기록합니다. 비밀값은 `.env` 등에만 두고 Git에 올리지 않습니다.
