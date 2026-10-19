# Art lab generated asset register — 2026-10-19

Built-in image_gen only; no CLI fallback/API key. Latest human choice: **빈티지 기록실 / almanac**. Cinematic choice was superseded by the user's correction. PNGs are copied into this project; original generator files remain untouched.

| File | Dimensions | Current use |
|---|---|---|
| hero-cinematic-v1.png |1672×941| Comparison A |
| hero-animation-v1.png |1672×941| Comparison B |
| hero-almanac-v1.png |1672×941| Selected main hero C |
| career-events-atlas-v1.png |1536×1024| Earlier painterly comparison atlas,not active in vintage preview |
| career-events-almanac-v1.png |1536×1024| Selected scenes1~6,3×2 square panels |
| career-events-almanac-extra-v1.png |1536×1024| Selected scenes7~12,3×2 square panels |
| player-almanac-v1.png |1130×1392| Selected fictional adult portrait,alpha cutout |
| player-pitcher-almanac-v1.png |1130×1392| Added fictional adult pitcher,alpha cutout |

Prompts: [GENERATION-PROMPTS.json](GENERATION-PROMPTS.json). Eight calls include the initial atlas plus a targeted cap-letter cleanup and a vintage style-transfer; the discarded uncorrected atlas is not a project deliverable. Reference inputs were previously generated artwork,not real player photos.

All outputs were visually inspected in image tool results. The latest vintage main,12 scene panels,and portrait were accepted as design exploration assets. This is not a full production cast/age/role library. Portrait pixel(0,0) alpha0 was checked with read-only image metadata inspection. PNG dimensions and alpha channel type are also covered by verify-art-direction.mjs.

No output pixel edits or recompression were performed outside image_gen. Atlas crops and portrait presentation use HTML/CSS. Original images remain available; deployment sizing/compression is a later quality/performance task.

Browser rendering was not verified: automated file: navigation was rejected by the browser's URL policy. No server,alternate browser surface,CDP or other workaround was used. Syntax/asset/data validation is recorded separately from browser behavior.
Extension 1.2: ninth built-in call created a distinct fictional adult pitcher using the existing generated portrait as style reference. Output copied without pixel editing; reference and original preserved. Tool output visually inspected. PNG dimensions/alpha metadata verified by static checker. Fine silhouette fringes and small-screen compositing remain production QA; browser rendering remains unverified. Total project PNGs: eight.

## 시각1.8 추가

career-scenes-finish-v1.png —1536×1024/3×2패널6컷,대학/마이너원정/중립라이벌/복귀/은퇴/구장. 새원본생성2026-10-19,빈티지선택유지. FINISH-GENERATION.json에프롬프트/원본경로/사용처. 프로젝트사본과원본을보존하고finish-board.html에서중앙크롭. 총PNG9개이며실제브라우저크롭검수는미실행.

## 시각1.9 사용자확정: 청춘 야구 애니

111을현재기준으로사용. graduation-almanac-wide-v1/player-youth-almanac-v1은비교보존,graduation-animation-day-v1/player-youth-animation-v1은고교활성,career-events-animation-v1/extra-v1은12사건활성,player-pitcher-animation-v1은투수활성. 모두별도PNG로추가했고원본유지. 총일러스트PNG16개. GRADUATION-STYLE-GENERATION/ANIMATION-MAIN-GENERATION에프롬프트/원본파일을기록. 작은문양과실제화면크롭은최종검수전.
