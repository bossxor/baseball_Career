# 웹 인계 메모 — 2026-11-06 (m2-web)

## 지금 되는 것
생성 폼(학교·난이도), 고교 결산→진로→KBO 입단, 재도전 셸(훈련·수락 포함), 대학/미국/KBO 시즌 진행 루프. 모두 서버가 `CAREER_FLOW`로 내려준 명령만 웹이 재전송한다. 기본 CTA는 '이번 시즌 끝까지', 보조는 '다음 달까지'(설계 132). 정지 사유(`stop`: BUDGET/MONTH_END/EVENT/SEASON_END)가 응답에 실린다.
관련 문서: M2-WEB-CREATE-FLOW-RETRY-20261106.md, 설계 132-USER-PACING-YEARLY-FAST-FORWARD.md. 테스트: `apps/web/test/native-*-http.test.ts`(웹 전체 45/45).

대학 E73 계속 재학·조기 KBO 지명과 E74 대학 복귀, E75 졸업→KBO 입단을 추가했다. 기존 서버 명령과 현재 이벤트 버전만 사용하며 미사용 훈련 포기는 확인한다. 경계 fixture 뒤의 실제 HTTP/PGlite 검증과 전체 학년 native 검증은 구분한다.

## 미지원 사건 화면 ('웹 미지원' 안내만 나옴, 저장은 유지)
- 대학: 2학년 종료 후 미국 제안 화면, 대학 스타일 변경/포커스 변경, 대학 대표 선발.
- 미국: 마이너 시장·계약 갱신·메이저 FA, 병역, 스타일 변경, 귀환 재도전 연결.
- KBO: 계약 결정(FA/갱신), 병역, 은퇴 판단, E41 스타일 변경(확인만 제공), 프로 경기 상세 보기.
- 공통: CHALLENGE(도전) 훈련은 확률 표시 문제로 미제공.

## 미검증
- 상한(25초) 정지 UI: 안내문·'이어서 진행' 라벨은 서버 응답과 단위 확인만 했고, 미국 테스트는 상한 정지가 아닌 사건/종료로 끝난 경우 해당 분기를 건너뛴다. 실제 BUDGET 정지 화면은 브라우저로 본 적 없음.
- 실데이터 화면(Flow 확인 카드, 대학/미국/KBO 화면)을 브라우저·실기기에서 확인하지 않음. safe-area/키보드 CSS도 문자열 테스트만.
- 한 번의 요청이 시즌 전체를 처리하는 시간은 엔진 속도에 달림(대학 마지막 구간 204초, 미국 15분 초과). 25초 상한으로 끊고 같은 버튼으로 이어지게 했다. 속도 개선(m2-engine-service)이 끝나면 상한 값(`PLAYBALL_SPAN_BUDGET_MS`)을 재조정.
- 미국/KBO 실제 시즌 전체의 정지 사건 종류, KBO 훈련 창(E43) 실플레이 테스트는 시간 문제로 생략.

## 정리 대상
- untracked 디버그 파일 3개(`apps/api/wire-kbo.cjs`, `edit-college.cjs`, `dbg-presses.test.ts`)는 안전 검사에 막혀 삭제하지 못했다. 사용자가 삭제할 것.

## 2026-11-27 갱신 (m2-web)
- 위 '미지원 사건 화면' 중 대학 2학년 진로(E73)·4학년 졸업(E75)·스타일/포커스·국가대표, 미국 마이너 시장·메이저 재계약/FA는 이미 서버 flow에 연결되어 있다. 이번에 미국 계약 3경로(마이너 시장 서명, 메이저 재계약[예산 부족/충족], FA 시장 서명)를 HTTP 테스트로 증명했다(`native-us-contract-flow-http.test.ts`).
- 미국·KBO 시즌 중반 스타일 변경(E41)을 연결했다(엔진의 기존 창 규칙 드라이런으로 노출, 확인 카드 포함, 시즌당 1회). 미국/KBO 각 HTTP 테스트 1건.
- KBO에서 미지원 단계로 떨어질 때 제목을 '프로 시즌'으로 바꿔 시즌 결산 화면으로 오인하지 않게 했다.
- 아직 미연결: KBO/미국 국가대표 사건(E44~E48 선발·대회 진행 — KBO 진행은 열린 대표 사건에서 NATIONAL_DECISION_REQUIRED로 멈추므로 해당 사건 화면이 필요), KBO 계약 결정·병역·은퇴. 실기기·브라우저 화면 미확인.

## 2026-11-27 후속 (m2-web)
- KBO·미국 국가대표 사건(E44~E48)은 다른 세션이 서버 flow(`career-pro-national-shell.ts`, `career-us-national-shell.ts`)에 이미 연결해 두었고 API 단위 테스트(`m2-*-national-flow.test.ts`)만 있었다. 웹 HTTP 경로 증명을 `apps/web/test/native-national-flow-http.test.ts` 3건으로 추가했다(KBO 선발→응답→대회 시작, KBO 봉인 결과의 메달·병역 표시와 귀환 명령, 미국 WBC 선발→응답→대회 시작). 서버가 내려준 첫 명령을 그대로 재생하며 비공개 값 노출 검사 포함. 위 '아직 미연결' 항목 중 국가대표는 해소.
- 아직 미증명: 대회 진행(ADVANCE)을 끝까지 돌려 귀환까지 가는 경로(엔진 실행이 무거워 제외), KBO/미국 병역·계약·은퇴 결정.
- APK 용량: 애니메이션 PNG 5장(합계 11,798,309B)을 WebP q90 5장(합계 1,482,426B, 약 87% 감소)으로 교체. 원본 PNG는 `docs/design/assets/art-lab/`에 보존, 웹은 `apps/web/src/art/*.webp`를 참조(`styles.css`, `screens/home.css`). 빌드 결과에 PNG·docs 경로 참조 없음 확인. 실제 APK 재빌드와 기기 화면 비교는 하지 않았다.

## 2026-11-27 Android 실기기 점검 4건 (m2-web)
1. '이번 시즌 끝까지' 부재: 기기 경로(`local-game.worker`)는 서버와 같은 `applyEngineCommand`/`careerFlowScreen`을 쓰므로 CTA·정지 사유는 이미 같았다. 원인은 고교 홈(`schoolCareerHome`)이 구형 '진행'(다음 주요 사건/1경기/1주일)을 첫 버튼으로 내고 시즌 CTA는 Flow 안에서 훈련 선택지 뒤에 있던 것. 홈 첫 버튼을 '이번 시즌 끝까지 · 특별 훈련'(Flow 열기)으로, 구형 진행은 '한 단위씩 진행'으로 바꾸고 Flow의 `adv-season`을 맨 앞에 둠. 워커는 `process`가 없어 요청 상한이 1초 고정이다. 증명: `apps/web/test/local-season-cta.test.ts` 2건(process를 가린 상태에서 상한 ≤1초, 같은 저장에서 BUDGET 정지→'이어서 진행'→EVENT/SEASON_END까지 반복, 매 누름마다 revision 증가).
2. 진행 무반응: 눌린 버튼이 처리 중에 '진행 중…'으로 바뀌고(Career·Flow), `run()` 재진입 가드로 중복 탭 차단(Flow는 기존 가드 유지).
3. 하단 겹침: Capacitor 8 SystemBars가 `--safe-area-inset-*`를 주입하지만 CSS는 `env()`만 읽어 0이었다. `--sai-*`(env와 주입 변수 중 큰 값)를 만들고 `.screen`의 상·좌·우·하 패딩에 적용(하단은 inset+16px). 모든 화면이 `.screen`을 쓰므로 한 곳에서 해결. 기기 확인은 Android 세션 몫.
4. APK 18.54MB 유지: 번들엔 PNG가 없다(dist, android assets/public 모두 webp). APK 항목 합계는 압축 8,143,572B인데 파일은 18,541,659B — zip 안 오프셋 7,486,223부터 10,314,928B가 어느 항목에도 속하지 않는 죽은 공간이었다(Gradle이 기존 APK를 제자리 갱신하며 삭제된 옛 PNG가 남은 것). `scripts/build-android.mjs`가 sync 전에 `android/app/src/main/assets/public`과 `build/outputs/apk`를 지우도록 수정. 재빌드 후 기대 크기는 약 8.2MB; 실측은 Android 세션이 기록할 것.
- 검증: 위 테스트 + native-school-*, flow-screens, screens, http, school-season-span, m2-school-flow 39건 통과(`evidence/M2-20261127-web-android-fixes.log`), tsc(web·api)·eslint 오류 없음.
