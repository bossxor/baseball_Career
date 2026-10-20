# 129. 설계 보드 최신화·접근성 점검

2026-10-20 / STATIC_SOURCE_CHECKED_RENDER_BLOCKED. 사용자가 메인 설계 보드 최신화와 화면 렌더·접근성 검수를 요청했다. 게임 기능 구현은 하지 않는다.

## 반영 결과

- [메인 설계 보드](design-board.html)에 최신 승인 모음을 추가: 대학/군 체육팀 컬러 배지10개, 연대기 카드3종, 코드 표시11묶음 보드와 승인 이미지 전체 링크.
- 승인 브랜드 아이콘·청춘 애니 메인 장면·얼굴 없는 실루엣을 사용. 네이비/블루 기준에 맞춰 본문·선택·링크·헤더를 정리하고 기존 글꼴을 유지했다.
- 대학 선택 시연과 대학 홈·군 체육팀에 승인 배지를 연결했다. 그림 때문에 선발·획득 결과를 암시하지 않도록 승인 자산 참고 영역과 실제 게임 예시를 구분했다.
- 보관 복사 예시를6능력으로 보강: 최고92/88/86/94/80/76 → 시작46/44/43/47/40/38, 종합43.0. 19세·최고치50%·원본 불변 규칙을 그대로 설명한다.
- 본문 건너뛰기·포커스 외곽선·내비게이션 이름·화면 제목 연결, 표 캡션2개와 열머리 scope, 표 내부 스크롤 영역, 줄바꿈/좁은 화면 스타일과 reduced-motion을 보완했다.
- 버튼처럼 그려져 있었지만 동작이 없던61개는 네이티브 disabled 버튼으로 표시했다. 기존 난이도·학교·확률·상태·중계 감상 입력 시연은 유지하며 실제 게임 명령을 새로 만들지 않았다.

## 실행한 파일 기반 접근성 점검

[기계 판독 결과](design-board-accessibility-audit.json). HTML 파일을 로컬 파서로 읽고 명시한 색상 토큰만 계산했다. 브라우저 DOM/axe 실행이나 실제 스크린리더 점검이 아니다.

| 검사 | 결과 |
|---|---|
|SA01 · unique source IDs|PASS_STATIC|
|SA02 · language and landmark markup|PASS_STATIC|
|SA03 · image alternative attribute|PASS_STATIC|
|SA04 · static input names|PASS_STATIC|
|SA05 · table captions and column scope|PASS_STATIC|
|SA06 · in-page anchor references|PASS_STATIC|
|SA07 · nonfunctional example button semantics|PASS_STATIC|
|SA08 · declared keyboard and motion styles|PASS_STATIC|
|SA09 · declared narrow layout and table overflow styles|PASS_STATIC|
|SA10 · static file references|PASS_STATIC|
|SA11 · approved catalog visibility in source|PASS_STATIC|
|SA12 · six-ability archive example|PASS_STATIC|
|SA13 · selected opaque token contrast|PASS_STATIC|

총13개 정적 검사 통과. 소스 이미지60개 alt 속성, 정적 입력37개 이름 연결, 표6개 캡션/열머리, ID/앵커/파일 참조를 확인했다. 런타임 생성 라디오·상태 선택·포커스·키보드 처리는 미실행이다.

선택한 단색 토큰6쌍의 대비는6.09~12.79:1이다. 배경 일러스트 위 텍스트·모든 상속색·실제 계산된 CSS 대비나 전체 WCAG 준수를 증명하지 않는다.

## 렌더 검수 시도와 차단

현재 사용자가 열어둔 file: 설계 보드를 cua.getTab으로 관찰하려고 했으나 브라우저 URL 보안 정책이 거절했다. 허용 프로토콜이http/https이며 file:은 허용되지 않는다는 응답이었다. 현재 URL을 임시 서버·다른 브라우저·CDP로 바꾸는 우회는 시도하지 않았다.

- 실제 뷰포트 캡처:0
- 360/390/768/1280px 렌더:BLOCKED_BY_BROWSER_URL_POLICY
-200% 확대·키보드 포커스·터치·스크린리더:NOT_EXECUTED
- 화면45개 finalPixelStatus=NOT_FINALIZED / browserReview=NOT_EXECUTED 유지
- WCAG 준수 결론:NOT_ESTABLISHED

따라서 이 작업의 완료 범위는 보드 최신화·정적 접근성 보완·파일 기반 검증이다. 실제 화면 잘림·오버레이 대비·키보드 시연은 허용된 검수 환경이나 사용자 직접 확인의 별도 증거가 있어야 마감한다. 별도 사용자 요청 없이 웹 게시·앱 서버/DB 구축을 진행하지 않는다.

## 저장·인계

원본은 V:/docs/design 이다. 기존 열람용 복사 폴더의 보드와 연결 파일도 같은 승인본으로 갱신한다. 원본 MD·상태·검증·통합 설계서·무결성 목록을 갱신하고 기존 정상 Git 체크아웃으로 커밋·푸시한다. V:의 .git는 수정하지 않는다.
