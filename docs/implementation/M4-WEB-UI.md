# M4 — 웹 UI 핵심 화면 (진행 기록)

2026-10-26. `apps/web`만. 웹 번들은 engine/api/db를 직접 가져오지 않는다. DTO는 `model.ts`, 규칙은 `@playball/rules`만.

## 핵심 12개 화면

S01 홈 · S02 생성 · S03 커리어 · S04 고교결산 · S05 드래프트 · S06 사건 · S07 결산 · S08 계약 · S09 은퇴 · S22 스타일 · S23 강화 · S28 졸업진로. 상태 문구는 `screen-state-catalog.json`과 테스트로 고정.

## 구현됨

- **뼈대**: `ScreenFrame` / `Button` / 해시 라우터 (`#/`, `#/create`, `#/career/:id`, `#/play/:id/Sxx`) · `PlayballApi` + fixture(멱등 `commandId`).
- **S01–S03**: 이전 단위(홈·7단계 생성·커리어 `nextActions`).
- **S04–S09·S22·S23·S28**: 공통 `Decision` (요약+선택+확정). 커리어 `open:Sxx` → play 라우트. fixture가 고교 시즌→결산→진로→드래프트→계약/은퇴·사건·유형·강화 체인을 흉내냄. `decision`/`choose` API.
- **디자인**: 기존 남색/녹색, 16px/1.55, 터치 44–48, focus 3px, reduced-motion, 1열→768 2열.

## 검증

`npm run test:web` 13개(카탈로그·S01–S03·Decision·라우트·fixture 멱등/체인). 웹 typecheck·vite build 통과.

## 미완료 (다음)

실제 M3 HTTP `PlayballApi` 교체, 한글 IME 실기, 키보드 순서·200% 확대·서체 실패, 오프라인/충돌 UI, 구단/설정(M5).
