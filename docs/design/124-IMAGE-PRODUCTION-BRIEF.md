# 124. 이미지 제작 명세 — 다른 곳에서 바로 만들 수 있는 목록

2026-10-19. 이 문서와 [image-production-register.json](image-production-register.json)은 앱에 필요한 **모든 이미지**를 한 곳에 모은 제작 인계표다. 시안은 저장소 밖 임시 폴더에서 제작하고, 사용자가 선택한 승인본만 이 저장소에 반영한다(2026-10-20 후속 결정). 제작한 파일을 넣고 레지스터의 status를 바꾸는 절차는 아래 ‘제작 후 반영’을 따른다. 실제 렌더·접근성 검수와 사용자 승인은 제작 후 별도다.

## 한눈에 보기

- 레지스터 항목 92개: 제작 필요(TODO) 41개, 이미 있음 39개, 코드로 만들면 되는 것(이미지 불필요) 11개, 보존 1개.
- 우선순위: P0 미제작 0개, 승인 반영 17개(실루엣 14 + 로고 마크 1 + 아이콘 2묶음), P1 미제작 37개, P2 4개. P0는 앱을 처음 띄울 때 필요한 것이고 P1은 해당 기능 화면, P2는 선택이다.
- 코드로 만드는 것(CODE_ONLY: 마이너·고교·국가 배지, 특성·구종·성향·폼·투타·목표 아이콘, 수비 다이어그램, 칭호)은 이미지 생성이 필요 없다.

## 공통 제작 규칙

1. **그림체**: 일러스트(PNG)는 [111](111-ANIMATION-MAIN-ART-DIRECTION.md)의 청춘 야구 애니. 기존 활성 파일(hero-animation-v1, career-events-animation-v1/extra-v1, graduation-animation-day-v1)과 같은 선·색감으로 맞춘다. 프롬프트·원본 경로 기록은 assets/art-lab의 *-GENERATION.json 형식을 따라 새 JSON으로 남긴다.
2. **시간대**: 훈련은 맑은 아침, 학교·이동은 낮, 협상·운영·재활·은퇴는 중성 창빛, 라이벌 야간 경기는 푸른 하늘+흰 조명. 자동 석양·전체 오렌지 광은 쓰지 않는다.
3. **글자·로고 금지**: 이미지 안에 글자, 숫자, 실제 구단·대회·국가 로고를 그리지 않는다(모자 문양 포함). 모든 텍스트는 코드가 렌더한다. 실제 선수 얼굴·사진 금지.
4. **선수 표현**: 선수 카드의 사람 표현은 사람 외형이 아니라 실루엣+이름 카드([119](119-PLAYER-DISPLAY-PITCH-FORM-SILHOUETTE.md)). 사건 장면 속 인물은 선수 본인의 외형 확정이 아니다.
5. **결과 누설 금지**: 이미지로 계약·메달·선발 결과를 미리 알리지 않는다. 메달·승리 그림은 확정 근거가 있을 때만 표시되며 평소엔 중립 그림을 쓴다([95](95-CHARACTER-EVENT-ART-PRODUCTION.md)).
6. **실루엣**: 좌우 단순 반전 금지(글러브·배트·공 위치가 틀어진다). 색은 CSS 변수로만 받는다.
7. **형식**: 일러스트 PNG는 원본을 보존하고 -v1, -v2 식으로 새 파일로 추가한다. 아이콘·배지·실루엣은 SVG(script·foreignObject·image·text 금지, title 포함). 1536×1024 아틀라스는 정사각 패널 3×2, 세로형 카드는 1080×1350.
8. **접근성**: 모든 이미지는 장식이거나 대체 텍스트를 가진다. 이미지만으로 정보를 전달하지 않는다.
9. **저작권·출처**: 만든 방법·도구·프롬프트·생성일을 기록하고, 외부 소재는 쓰지 않는다. 공개 배포 권리 확인은 [92](92-DESIGN-CLOSURE-HANDOFF.md)의 V12.

## 폴더 계획

assets/silhouettes/(SVG 14), assets/badges/(대학 9·군 체육팀 1), assets/rewards/(프레임 3·배경 3·스탬프 13·표지 1), assets/medals/(메달 3·대회 엠블럼 4), assets/cards/(카드 테마 3), assets/brand/(로고·앱 아이콘), assets/art-lab/(청춘 애니 일러스트 PNG).

## 이미지 목록

### G1 선수 실루엣(SVG)

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-SIL-H-RR|타자 우투우타 실루엣|assets/silhouettes/hitter-RR.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수(--sil-uniform/--sil-accent/--sil-skin)|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|우투 선수의 우타석. 배트는 정면 기준 왼쪽 어깨 위, 글러브는 정면 기준 오른쪽 허리|
|IMG-SIL-H-RL|타자 우투좌타 실루엣|assets/silhouettes/hitter-RL.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수(--sil-uniform/--sil-accent/--sil-skin)|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|좌타석. 배트는 정면 기준 오른쪽 어깨 위, 글러브는 정면 기준 오른쪽 허리|
|IMG-SIL-H-RS|타자 우투양타 실루엣|assets/silhouettes/hitter-RS.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수(--sil-uniform/--sil-accent/--sil-skin)|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|양타. 두 배트 포즈를 겹쳐 한쪽은 옅게, 글러브는 정면 기준 오른쪽 허리|
|IMG-SIL-H-LR|타자 좌투우타 실루엣|assets/silhouettes/hitter-LR.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수(--sil-uniform/--sil-accent/--sil-skin)|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|우타석, 글러브는 정면 기준 왼쪽 허리|
|IMG-SIL-H-LL|타자 좌투좌타 실루엣|assets/silhouettes/hitter-LL.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수(--sil-uniform/--sil-accent/--sil-skin)|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|좌타석, 글러브는 정면 기준 왼쪽 허리|
|IMG-SIL-H-LS|타자 좌투양타 실루엣|assets/silhouettes/hitter-LS.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수(--sil-uniform/--sil-accent/--sil-skin)|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S40, S42, S43|양타, 글러브는 정면 기준 왼쪽 허리|
|IMG-SIL-P-R-OVERHAND|투수 우투 오버핸드 실루엣|assets/silhouettes/pitcher-R-overhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔이 머리 위로 수직. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-R-THREEQUARTER|투수 우투 쓰리쿼터 실루엣|assets/silhouettes/pitcher-R-threequarter.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 45도 위. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-R-SIDEARM|투수 우투 사이드암 실루엣|assets/silhouettes/pitcher-R-sidearm.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 수평. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-R-UNDERHAND|투수 우투 언더핸드 실루엣|assets/silhouettes/pitcher-R-underhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 낮게 아래로. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-OVERHAND|투수 좌투 오버핸드 실루엣|assets/silhouettes/pitcher-L-overhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔이 머리 위로 수직. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-THREEQUARTER|투수 좌투 쓰리쿼터 실루엣|assets/silhouettes/pitcher-L-threequarter.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 45도 위. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-SIDEARM|투수 좌투 사이드암 실루엣|assets/silhouettes/pitcher-L-sidearm.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 수평. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|
|IMG-SIL-P-L-UNDERHAND|투수 좌투 언더핸드 실루엣|assets/silhouettes/pitcher-L-underhand.svg|viewBox 0 0 120 160, 얼굴·글자·로고 없음, 색은 CSS 변수|승인 반영|S02, S03, S10, S11, S14, S16, S17, S22, S42, S43|던지는 팔 낮게 아래로. 글러브는 던지는 팔 반대쪽. 좌우 단순 반전 금지(글러브·공 위치 검수)|

### G2 사건 장면 12(청춘 애니)

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-SCN-TRAINING|사건 장면 새로운 시즌|assets/art-lab/career-events-animation-v1.png|정사각 패널, 열0/행0, 3×2 아틀라스 1536×1024|있음|S04, S07, S24, S25, S27, S28|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E01/E08/E41|
|IMG-SCN-COLLEGE|사건 장면 대학 진학|assets/art-lab/career-events-animation-v1.png|정사각 패널, 열1/행0, 3×2 아틀라스 1536×1024|있음|S28, S34, S35|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E70/E71/E73/E75|
|IMG-SCN-OVERSEAS|사건 장면 미국으로|assets/art-lab/career-events-animation-v1.png|정사각 패널, 열2/행0, 3×2 아틀라스 1536×1024|있음|S28, S29, S30, S33|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E57/E58|
|IMG-SCN-INTERNATIONAL|사건 장면 국제무대|assets/art-lab/career-events-animation-v1.png|정사각 패널, 열0/행1, 3×2 아틀라스 1536×1024|있음|S07, S25, S45|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E47/E48|
|IMG-SCN-RETIREMENT|사건 장면 마지막 유니폼|assets/art-lab/career-events-animation-v1.png|정사각 패널, 열1/행1, 3×2 아틀라스 1536×1024|있음|S09, S11, S12, S45|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E37/E69/E99|
|IMG-SCN-FRONTOFFICE|사건 장면 구단의 내일|assets/art-lab/career-events-animation-v1.png|정사각 패널, 열2/행1, 3×2 아틀라스 1536×1024|있음|S12, S13, S17, S36|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E38/E39/E40/E77/E79/E81|
|IMG-SCN-DRAFT|사건 장면 지명을 기다리며|assets/art-lab/career-events-animation-extra-v1.png|정사각 패널, 열0/행0, 3×2 아틀라스 1536×1024|있음|S05, S28|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E04/E05/E06|
|IMG-SCN-ENHANCEMENT|사건 장면 한 번의 특별훈련|assets/art-lab/career-events-animation-extra-v1.png|정사각 패널, 열1/행0, 3×2 아틀라스 1536×1024|있음|S23|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E43|
|IMG-SCN-REHAB|사건 장면 다시 뛰는 준비|assets/art-lab/career-events-animation-extra-v1.png|정사각 패널, 열2/행0, 3×2 아틀라스 1536×1024|있음|-|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E21/E22/E23|
|IMG-SCN-SERVICE|사건 장면 돌아오는 길|assets/art-lab/career-events-animation-extra-v1.png|정사각 패널, 열0/행1, 3×2 아틀라스 1536×1024|있음|S27, S33|청춘 애니, 시간대 MORNING_OR_DAY, 이벤트 E53/E76|
|IMG-SCN-POSTING|사건 장면 다음 리그의 제안|assets/art-lab/career-events-animation-extra-v1.png|정사각 패널, 열1/행1, 3×2 아틀라스 1536×1024|있음|S08, S31, S32, S41|청춘 애니, 시간대 NEUTRAL_INTERIOR_DAY, 이벤트 E62/E63/E64|
|IMG-SCN-RIVAL|사건 장면 같은 출발선|assets/art-lab/career-events-animation-extra-v1.png|정사각 패널, 열2/행1, 3×2 아틀라스 1536×1024|있음|S42, S45|청춘 애니, 시간대 NIGHT_WHITE_FLOODLIGHTS, 이벤트 E26/E94/E95/E96|

### G3 마감 장면 6컷

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-FIN-COLLEGE|마감 장면 대학(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|승인 반영|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 대학 캠퍼스 그라운드. 시간대 규칙 준수|
|IMG-FIN-MINOR-AWAY|마감 장면 마이너 원정(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|승인 반영|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 마이너 원정 이동/구장. 시간대 규칙 준수|
|IMG-FIN-RIVAL-NEUTRAL|마감 장면 중립 라이벌(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|승인 반영|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 중립 구장에서 마주 선 두 선수. 시간대 규칙 준수|
|IMG-FIN-RETURN|마감 장면 복귀(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|승인 반영|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 귀국/복귀 장면. 시간대 규칙 준수|
|IMG-FIN-RETIRE|마감 장면 은퇴(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|승인 반영|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 은퇴 기념 장면. 시간대 규칙 준수|
|IMG-FIN-STADIUM|마감 장면 구장(청춘 애니)|assets/art-lab/career-scenes-finish-animation-v1.png|3×2 정사각 패널 아틀라스 1536×1024 중 한 컷|승인 반영|S04, S09, S27, S28, S33, S34, S35|청춘 애니 승인본 연결. 구장 전경. 시간대 규칙 준수|

### G4 Hero·졸업 장면

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-HERO-MAIN|메인 hero 배경|assets/art-lab/hero-animation-v1.png|1672×941|있음|S01, S03, S19, S30|청춘 애니 활성. 시간대 변형은 선택(P2)|
|IMG-HERO-GRAD|고교 졸업 가로 장면|assets/art-lab/graduation-animation-day-v1.png|가로 hero|있음|S04|S04 전용|

### G5 실제 구단 로고

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-LOGO-KBO|KBO 구단 로고|assets/team-logos/kbo/*.png|공식 출처, 10개|있음|S14, S18|사용 허가는 92의 V12에서 확인. 수정·재색칠 금지|
|IMG-LOGO-MLB|MLB 구단 로고|assets/team-logos/mlb/*.svg|공식 team-cap-on-light 엠블럼, 30개|있음|S18, S29, S30|사용 허가는 V12. 마이너 하위팀에 혼용 금지|

### G6 가상 팀 배지

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-BADGE-U01|가상 대학 배지 한빛대|assets/badges/college-u01.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U02|가상 대학 배지 청해대|assets/badges/college-u02.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U03|가상 대학 배지 백림대|assets/badges/college-u03.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U04|가상 대학 배지 동운대|assets/badges/college-u04.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U05|가상 대학 배지 서강산대|assets/badges/college-u05.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U06|가상 대학 배지 남해솔대|assets/badges/college-u06.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U07|가상 대학 배지 해오름대|assets/badges/college-u07.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U08|가상 대학 배지 온누리대|assets/badges/college-u08.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-U09|가상 대학 배지 새길대|assets/badges/college-u09.svg|64×64 viewBox, 단순 문양, 문자 없음 또는 한글 1자|제작 필요 P1|S28, S34, S35|실제 대학·구단 마크와 무관한 독자 디자인(37). 대학 성향은 43 참조|
|IMG-BADGE-ARMY|군 체육팀(상무) 배지|assets/badges/military-team.svg|64×64 viewBox|제작 필요 P1|S26, S27|독자 디자인. 실제 부대 마크 사용 금지|
|IMG-BADGE-MINOR|가상 마이너(Rookie/A/AA/AAA) 팀 배지|(코드 생성)|MLB 30구단×4 = 120팀. 약칭 2~3글자+팔레트로 코드 생성|코드 제작|S18, S29|이미지 제작 불필요. 모회사 로고와 혼용 금지(37)|
|IMG-BADGE-HS|가상 고교 배지|(코드 생성)|가상 학교 목록(schoolId)별 약칭+팔레트|코드 제작|S02, S04|수는 고교 목록 크기. 이미지 제작 불필요|
|IMG-BADGE-NAT|국가대표 참가국 배지|(코드 생성)|국가 코드 약칭+팔레트|코드 제작|S24, S25|실제 국기·협회 엠블럼 사용은 V12 권리 확인 전 금지|

### G7 기념 보상 외형

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-RWD-R-G01|기념 프레임 R-G01|assets/rewards/r-g01.svg|선수 카드 테두리, 9-slice 가능, 가운데 투명|제작 필요 P1|S40, S45|목표 G01 달성 기념. 능력 효과 없음(58)|
|IMG-RWD-R-G06|기념 프레임 R-G06|assets/rewards/r-g06.svg|선수 카드 테두리, 9-slice 가능, 가운데 투명|제작 필요 P1|S40, S45|목표 G06 달성 기념. 능력 효과 없음(58)|
|IMG-RWD-R-G10|기념 프레임 R-G10|assets/rewards/r-g10.svg|선수 카드 테두리, 9-slice 가능, 가운데 투명|제작 필요 P1|S40, S45|목표 G10 달성 기념. 능력 효과 없음(58)|
|IMG-RWD-R-G03|기념 배경 R-G03|assets/rewards/r-g03.png|카드 배경 1080×1350, 글자 없음, 중앙 여백|제작 필요 P1|S40, S45|카드 텍스트 가독성 우선|
|IMG-RWD-R-G05|기념 배경 R-G05|assets/rewards/r-g05.png|카드 배경 1080×1350, 글자 없음, 중앙 여백|제작 필요 P1|S40, S45|카드 텍스트 가독성 우선|
|IMG-RWD-R-G08|기념 배경 R-G08|assets/rewards/r-g08.png|카드 배경 1080×1350, 글자 없음, 중앙 여백|제작 필요 P1|S40, S45|카드 텍스트 가독성 우선|
|IMG-RWD-R-G04|도감 스탬프 R-G04|assets/rewards/r-g04.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-G09|도감 스탬프 R-G09|assets/rewards/r-g09.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A01|도감 스탬프 R-A01|assets/rewards/r-a01.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A02|도감 스탬프 R-A02|assets/rewards/r-a02.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A03|도감 스탬프 R-A03|assets/rewards/r-a03.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A04|도감 스탬프 R-A04|assets/rewards/r-a04.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A05|도감 스탬프 R-A05|assets/rewards/r-a05.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A06|도감 스탬프 R-A06|assets/rewards/r-a06.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A07|도감 스탬프 R-A07|assets/rewards/r-a07.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A08|도감 스탬프 R-A08|assets/rewards/r-a08.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A09|도감 스탬프 R-A09|assets/rewards/r-a09.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A10|도감 스탬프 R-A10|assets/rewards/r-a10.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A11|도감 스탬프 R-A11|assets/rewards/r-a11.svg|256×256 viewBox, 단색 도장 스타일, 글자 없음(제목은 텍스트)|제작 필요 P1|S40, S45|도전과제·목표 근거는 58. 해당 성과가 있을 때만 해금 표시|
|IMG-RWD-R-A12|책장 표지 R-A12|assets/rewards/r-a12.png|표지 이미지 1080×1350|제작 필요 P1|S45|KBO·MLB 실제 출장 후 은퇴 기념|
|IMG-RWD-TITLES|칭호 R-G02/R-G07|(텍스트)|이미지 없음|코드 제작|S40|텍스트 칭호|

### G8 메달·대회 엠블럼

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-MEDAL-GOLD|메달 금|assets/medals/gold.svg|128×128 viewBox, 글자 없음|제작 필요 P1|S25, S45|메달 근거가 있을 때만 사용(111). 실제 대회 공식 메달 디자인 사용 금지|
|IMG-MEDAL-SILVER|메달 은|assets/medals/silver.svg|128×128 viewBox, 글자 없음|제작 필요 P1|S25, S45|메달 근거가 있을 때만 사용(111). 실제 대회 공식 메달 디자인 사용 금지|
|IMG-MEDAL-BRONZE|메달 동|assets/medals/bronze.svg|128×128 viewBox, 글자 없음|제작 필요 P1|S25, S45|메달 근거가 있을 때만 사용(111). 실제 대회 공식 메달 디자인 사용 금지|
|IMG-COMP-WBC|대회 엠블럼 WBC|assets/medals/comp-wbc.svg|96×96 viewBox, 독자 디자인|제작 필요 P2|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|
|IMG-COMP-OLY|대회 엠블럼 OLY|assets/medals/comp-oly.svg|96×96 viewBox, 독자 디자인|제작 필요 P2|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|
|IMG-COMP-AG|대회 엠블럼 AG|assets/medals/comp-ag.svg|96×96 viewBox, 독자 디자인|제작 필요 P2|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|
|IMG-COMP-P12|대회 엠블럼 P12|assets/medals/comp-p12.svg|96×96 viewBox, 독자 디자인|제작 필요 P2|S24, S25, S45|실제 대회 로고 사용 금지. 대회 명칭은 텍스트|

### G9 연대기 카드 테마

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-CARD-DEFAULT|연대기 카드 테마 DEFAULT|assets/cards/theme-default.png|1080×1350 배경, 글자·로고 없음, 사용자 메모 6줄 여백|제작 필요 P1|S45|테마 개수는 D 3종(63의 coverTheme). 한글 텍스트는 코드가 렌더|
|IMG-CARD-OFFSEASON|연대기 카드 테마 OFFSEASON|assets/cards/theme-offseason.png|1080×1350 배경, 글자·로고 없음, 사용자 메모 6줄 여백|제작 필요 P1|S45|테마 개수는 D 3종(63의 coverTheme). 한글 텍스트는 코드가 렌더|
|IMG-CARD-RETIRE|연대기 카드 테마 RETIRE|assets/cards/theme-retire.png|1080×1350 배경, 글자·로고 없음, 사용자 메모 6줄 여백|제작 필요 P1|S45|테마 개수는 D 3종(63의 coverTheme). 한글 텍스트는 코드가 렌더|

### G10 브랜드·앱 아이콘

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-BRAND-MARK|로고 마크 ‘다시, 플레이볼’|assets/brand/logo-mark.svg|정사각 viewBox, 글자 최소(마크 중심)|승인 반영|S01, S21|타이틀 로고타입은 현재 검은고딕 텍스트(37). 실제 구단 로고와 무관|
|IMG-BRAND-ANDROID|Android 적응형 아이콘|assets/brand/android-adaptive-{fg,bg,mono}.svg|foreground/background/monochrome 각 432×432 안전영역 288|승인 반영|-|APK 런처 아이콘(86/29). 배경은 단색 가능|
|IMG-BRAND-PWA|PWA/웹 아이콘|assets/brand/icon-{192,512,maskable-512}.png, favicon.svg, apple-touch-180.png|192/512/maskable512, favicon(SVG), 180|승인 반영|-|manifest(86). 홈 화면 추가 경로 검수|
|IMG-BRAND-SPLASH|스플래시 아이콘|assets/brand/splash-icon.svg|Android 12 스플래시 아이콘 288, 단색 배경|제작 필요 P1|-|큰 일러스트 불필요|

### G11 코드로 만드는 아이콘·다이어그램

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-ICON-TRAIT|특성 배지 T01~T16|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S38|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-PITCH|구종 아이콘 P01~P07|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S39|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-APPROACH|타격 성향 카드 아이콘 4종|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S39|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-FORM|투구폼 아이콘 4종|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S02, S39|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-HAND|투타 아이콘(우/좌/양)|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S02, S16|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-ICON-GOAL|목표 G01~G10·도전 A01~A12 아이콘|(CSS/SVG 코드)|단색 벡터, 24/32px, currentColor|코드 제작|S40|screen-image-slots의 CODE_BADGES/CODE_DIAGRAM. 이미지 생성 불필요|
|IMG-FIELD|수비 배치 다이어그램|(SVG 코드)|야구장 벡터|코드 제작|S15|FIELD_DIAGRAM. 이미지 생성 불필요|

### G12 레거시

|ID|이름|파일(예정 경로)|규격|상태|쓰이는 화면|메모|
|---|---|---|---|---|---|---|
|IMG-LEGACY|비교용 빈티지/시네마틱/선수 초상 PNG|assets/art-lab/*(almanac|cinematic|player-*).png|기존 PNG|보존|-|삭제하지 않음. 선수 초상 PNG는 시안 예시일 뿐 선수 외형 확정이 아님(119)|

## 화면별 필요(제작 필요 항목만)

|화면|수|항목 ID|
|---|---|---|
|S01|1|IMG-BRAND-MARK|
|S02|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S03|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S04|6|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM|
|S09|6|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM|
|S10|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S11|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S14|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S16|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S17|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S21|1|IMG-BRAND-MARK|
|S22|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S24|4|IMG-COMP-WBC, IMG-COMP-OLY, IMG-COMP-AG, IMG-COMP-P12|
|S25|7|IMG-MEDAL-GOLD, IMG-MEDAL-SILVER, IMG-MEDAL-BRONZE, IMG-COMP-WBC, IMG-COMP-OLY, IMG-COMP-AG, IMG-COMP-P12|
|S26|1|IMG-BADGE-ARMY|
|S27|7|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-ARMY|
|S28|15|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-U01, IMG-BADGE-U02, IMG-BADGE-U03, IMG-BADGE-U04, IMG-BADGE-U05, IMG-BADGE-U06, IMG-BADGE-U07, IMG-BADGE-U08, IMG-BADGE-U09|
|S33|6|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM|
|S34|15|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-U01, IMG-BADGE-U02, IMG-BADGE-U03, IMG-BADGE-U04, IMG-BADGE-U05, IMG-BADGE-U06, IMG-BADGE-U07, IMG-BADGE-U08, IMG-BADGE-U09|
|S35|15|IMG-FIN-COLLEGE, IMG-FIN-MINOR-AWAY, IMG-FIN-RIVAL-NEUTRAL, IMG-FIN-RETURN, IMG-FIN-RETIRE, IMG-FIN-STADIUM, IMG-BADGE-U01, IMG-BADGE-U02, IMG-BADGE-U03, IMG-BADGE-U04, IMG-BADGE-U05, IMG-BADGE-U06, IMG-BADGE-U07, IMG-BADGE-U08, IMG-BADGE-U09|
|S40|25|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-RWD-R-G01, IMG-RWD-R-G06, IMG-RWD-R-G10, IMG-RWD-R-G03, IMG-RWD-R-G05, IMG-RWD-R-G08, IMG-RWD-R-G04, IMG-RWD-R-G09, IMG-RWD-R-A01, IMG-RWD-R-A02, IMG-RWD-R-A03, IMG-RWD-R-A04, IMG-RWD-R-A05, IMG-RWD-R-A06, IMG-RWD-R-A07, IMG-RWD-R-A08, IMG-RWD-R-A09, IMG-RWD-R-A10, IMG-RWD-R-A11|
|S42|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S43|14|IMG-SIL-H-RR, IMG-SIL-H-RL, IMG-SIL-H-RS, IMG-SIL-H-LR, IMG-SIL-H-LL, IMG-SIL-H-LS, IMG-SIL-P-R-OVERHAND, IMG-SIL-P-R-THREEQUARTER, IMG-SIL-P-R-SIDEARM, IMG-SIL-P-R-UNDERHAND, IMG-SIL-P-L-OVERHAND, IMG-SIL-P-L-THREEQUARTER, IMG-SIL-P-L-SIDEARM, IMG-SIL-P-L-UNDERHAND|
|S45|30|IMG-RWD-R-G01, IMG-RWD-R-G06, IMG-RWD-R-G10, IMG-RWD-R-G03, IMG-RWD-R-G05, IMG-RWD-R-G08, IMG-RWD-R-G04, IMG-RWD-R-G09, IMG-RWD-R-A01, IMG-RWD-R-A02, IMG-RWD-R-A03, IMG-RWD-R-A04, IMG-RWD-R-A05, IMG-RWD-R-A06, IMG-RWD-R-A07, IMG-RWD-R-A08, IMG-RWD-R-A09, IMG-RWD-R-A10, IMG-RWD-R-A11, IMG-RWD-R-A12, IMG-MEDAL-GOLD, IMG-MEDAL-SILVER, IMG-MEDAL-BRONZE, IMG-COMP-WBC, IMG-COMP-OLY, IMG-COMP-AG, IMG-COMP-P12, IMG-CARD-DEFAULT, IMG-CARD-OFFSEASON, IMG-CARD-RETIRE|

앱 아이콘·로고 마크는 화면이 아닌 앱 패키지용이며 위 표에 화면 없이 별도 P0로 둔다.

## 제작 브리프 요약

- **실루엣(P0)**: 얼굴 없는 유니폼 인물 실루엣. 투수 8(우·좌×오버핸드/쓰리쿼터/사이드암/언더핸드), 타자 6(투타 6조합). 화면 정면 기준으로 던지는 팔·배트·글러브 위치를 목록 메모대로 맞춘다. 양타는 두 배트 포즈를 겹쳐 한쪽을 옅게. 팔레트는 CSS 변수.
- **마감 장면(P1)**: 111의 활성 일러스트와 같은 그림체로 3×2 아틀라스 1장(대학·마이너 원정·중립 라이벌·복귀·은퇴·구장). 현재는 빈티지 1장뿐이라 청춘 애니 버전이 없다.
- **기념 보상(P1)**: 프레임 3, 배경 3, 스탬프 13, 표지 1. 스탬프는 단색 도장, 글자 없음. 카드 위 텍스트 가독성을 우선하고 중앙 여백을 남긴다.
- **가상 대학·상무 배지(P1)**: 실제 마크와 무관한 단순 문양. 대학 이름은 43의 U01~U09.
- **메달·대회 엠블럼**: 메달 3(P1), 엠블럼 4(P2). 실제 대회 로고 금지.
- **카드 테마(P1)**: 연대기 카드 1080×1350 배경 3종(기본·오프시즌·은퇴).
- **브랜드·앱 아이콘(P0/P1)**: 로고 마크, Android 적응형 아이콘, PWA·favicon, 스플래시. 구단 로고와 무관.

## 제작 후 반영 절차

1. 파일을 폴더 계획대로 넣고 규칙을 지켰는지 확인한다(SVG는 script·foreignObject·image·text 없음).
2. image-production-register.json에서 해당 항목 status를 EXISTS로 바꾸고 file/크기를 실제 값으로 갱신한다.
3. screen-image-slots.json의 silhouetteCard 등 슬롯 참조와 시안 보드가 새 파일을 가리키게 하고, assets/art-lab 일러스트는 생성 기록 JSON을 추가한다.
4. verify-design.mjs와 verify-art-direction.mjs를 실행하고 STATUS·119·이 문서를 갱신한다.
5. 브라우저 렌더·접근성·모바일 확인은 별도로 수행하고 결과를 구분해 기록한다.

## 검수 항목 (초안, NOT_EXECUTED)

IM-D01 TODO 항목마다 파일 경로·규격·화면이 있음/02 실루엣 14종 파일명 일치/03 SVG에 script·image·text 없음/04 일러스트에 글자·로고 없음/05 메달 근거 없는 화면에 메달 이미지 없음/06 실제 구단 로고 파일 수정 없음/07 레지스터 상태와 파일 존재 일치/08 화면별 필요 수와 슬롯 JSON 일치.

## 남은 확인

첫 승인본 3항목은 반영했다. 미선택 시안은 저장소에 넣지 않았다. 고교 학교 수·국가 참가국 수·카드 테마 개수(D 3종)는 확정 전이다. 사용 권리 확인(V12)과 실제 렌더 검수는 제작 후 진행한다.

## 2026-10-20 단계별 제작·승인 절차 (현재 기준 U)

2026-10-20 사용자 확정: 1단계 설계 점검·선택 수정·검증·커밋·푸시 결과를 제시하고 승인받은 뒤 2단계를 시작한다. 이미지 시안은 저장소 밖 임시 폴더에만 두고, 우투 오버핸드 투수·우투우타 타자·로고 마크를 각 2~3안 제시한다. 사용자가 고른 안만 저장소에 반영한다. 미선택·거절 시 반영하지 않으며, 후속 제작도 묶음마다 승인받는다. 승인본 반영 후 레지스터 status·화면 슬롯 참조·STATUS를 갱신하고 세 검증 스크립트를 재실행한다. 승인한 변경만 기존 정상 Git 체크아웃으로 커밋·푸시하며 V:의 .git는 변경하지 않는다.

1. 1단계의 선택 수정·검증·커밋·푸시 결과를 제시하고 사용자의 1단계 결과 승인을 기다린다.
2. 승인 후에만 P0부터 시작한다. 첫 묶음은 우투 오버핸드 투수·우투우타 타자·로고 마크 각각 스타일이 다른 2~3안이다. 공통 제작 규칙과 119를 모두 지키고 실제 UI에 쓸 수 있는 완성도로 제작한다.
3. 시안·비교 보드는 저장소 밖 임시 폴더에 둔다. 미선택·거절한 시안과 제작 중 파일은 저장소에 넣지 않는다.
4. 선택한 스타일로 나머지를 만들 때도 매 묶음마다 다시 보여주고 승인받는다. 승인 없이 다음 묶음 제작·반영을 진행하지 않는다.
5. 승인본만 추가하고 레지스터 status·screen-image-slots.json 참조·STATUS 및 제작 출처를 갱신한다. 검증 3개와 통합MD·무결성 목록을 갱신하고 승인한 변경만 기존 체크아웃으로 커밋·푸시한다.

이번 1단계에서는 이미지 status와 화면 슬롯 참조를 변경하지 않는다.

## 첫 묶음 반영 — 2026-10-20

2026-10-20 사용자 확정: 투수 A·타자 A·로고 2, 배색은 1번 네이비·블루. 승인 SVG 3개와 팔레트 CSS·출처 기록만 반영했다. 실루엣 2/14 완료, 나머지 12개와 앱 아이콘은 별도 묶음 승인 대기. 이미지 레지스터는 92항목 중 TODO61/EXISTS19/CODE_ONLY11/LEGACY_REFERENCE1이다. 게임 규칙·45화면·99이벤트·핵심298 기대값은 불변.

[승인본 보드](approved-art-board.html). SVG의 색은 CSS 변수이며 외부 img에서도 승인 배색이 보이도록 동일한 네이비·블루 기본값을 둔다. 팀 팔레트 변경은 신뢰된 inline SVG의 CSS 변수로 적용한다. 시안 비교안·거절안은 반영하지 않았다. Android/PWA 아이콘은 로고 선택만으로 완성 처리하지 않는다.

## 두 번째 묶음 반영 — 2026-10-20

사용자가 2차 시안 1~4번(우투좌타·좌투좌타 타자, 좌투 오버핸드·우투 쓰리쿼터 투수)을 모두 승인했다. A 스타일·네이비/블루 배색으로 SVG 4종을 추가했다. 실루엣 6/14 완료, 남은 실루엣 8종은 별도 승인 대기다. 전체 이미지 레지스터 92항목은 TODO57/EXISTS23/CODE_ONLY11/LEGACY_REFERENCE1이다.

두 번째 승인 SVG만 반영하고 비교 PNG·제작 스크립트는 저장소 밖에 유지했다. [누적 출처 기록](assets/brand/APPROVED-ART-v2.json).

## 실루엣 전체 승인 반영 — 2026-10-20

사용자가 남은8종 전체를 승인해 A 스타일·네이비/블루 SVG로 반영했다. 타자6투타조합·투수4폼×2손, 실루엣14/14와 로고2가 모두 승인됐다. 전체 이미지92항목 중 TODO49/EXISTS31/CODE_ONLY11/LEGACY_REFERENCE1. Android/PWA 아이콘2묶음과 P1/P2 이미지는 별도 미완료다.

[전체14종 보드](approved-art-board.html), [출처·승인 기록 v3](assets/brand/APPROVED-ART-v3.json). 비교 시안·미승인 다른 자산은 반영하지 않았다. 이전 묶음별 남은 개수는 당시 이력이다.

## 아이콘1 승인 반영 — 2026-10-20

사용자가 앱 아이콘1(네이비 배경)을 승인했다. Android 전경/배경/단색 SVG3개와 PWA192/512/maskable512·apple180 PNG4개·favicon SVG를 반영했다. P0의17항목(실루엣14·브랜드3묶음) 파일 제작은 모두 완료다. 전체92항목은 TODO47/EXISTS33/CODE_ONLY11/LEGACY_REFERENCE1이며 앱 연결·OS 설치 검수는 미실행이다.

네 PNG는 완전 불투명이고 각 규격을 확인했다. Android 전경의 실제 alpha 픽셀 전체가 432캔버스 중앙 반경144 안전영역에 든다. 동일 전경은 maskable 중앙 반경40% 안에 든다. 앱 manifest·Android 리소스 연결과 실제 설치·테마 검수는 별도다.

## 청춘 사건6컷 승인 — 2026-10-20

P1 청춘 애니6컷을 사용자 승인 후 반영했다. 라이벌은 흰색/네이비 팀과 버건디 팀으로 구분한다. finish 보드의 대학·마이너·기록·계약 화면은 의미에 맞는 패널로 연결했다. 전체92항목 중 TODO41/EXISTS39/CODE_ONLY11/LEGACY_REFERENCE1이다.

우리팀 복장은 네이비로 통일한다. 기존 활성 hero/사건2장/고교 hero의 초록 팀 복장 정정은 시안 승인 후 새 버전으로 연결한다. 미승인 수정본과 원본을 덮어쓰지 않는다.
