# 로컬 이미지 자산

| 원본 | 관찰·설명 | 실제 적용·상태 |
| --- | --- | --- |
| [네이비 메인](../design/assets/art-lab/hero-animation-navy-v2.png) | 1672×941 PNG. 오른쪽에 네이비 복장 선수, 왼쪽에 맑은 구장과 여백. 직접 열어 확인 | 앱 로그인 배너에 적용. 로컬 브라우저 1280×800·390×844에서 이미지와 폼을 함께 확인 |
| [석양 구장](../design/assets/stadium-dusk-v1.png) | 1672×941 PNG. 오른쪽 타자, 조명과 푸른 저녁 하늘. 직접 열어 확인 | 초기 디자인 비교용 |
| [유격수 초상](../design/assets/player-shortstop-v1.png) | 1145×1374 투명 PNG. 크림색 유니폼과 녹색 모자, 글러브. 직접 열어 확인 | 초기 디자인 비교용. 현 로그인·커리어 선택 초상으로 지정하지 않음 |
| [청춘 야구 사건·고교·복귀 원본](../design/assets/art-lab/ASSET-REGISTER.md) | 생성 원본, 치수, 승인 이력을 기존 레지스터에서 관리 | 승인 컷은 정적 디자인 보드. 앱 전환 전 장면·크롭 검증 필요 |
| [고교 덕아웃](../design/assets/art-lab/graduation-animation-day-navy-v2.png) | 1672×941 PNG. 오른쪽 덕아웃 벤치의 네이비 언더셔츠 선수, 왼쪽 맑은 내야. 2026-11-07 직접 열어 확인 | `art-school` 장면에 적용(생성·고교 화면). 375×812·데스크톱 크롭 확인 |
| [기본 사건 6컷](../design/assets/art-lab/career-events-animation-navy-v2.png) | 1536×1024, 3×2 정사각 패널. 스트레칭·캠퍼스 이동·공항·메달과 유니폼·라커 회상·에이전트 계약. 직접 확인 | 공항→`art-us`, 라커→`art-retire`, 메달→`art-trophy` 적용 |
| [추가 사건 6컷](../design/assets/art-lab/career-events-animation-extra-navy-v2.png) | 1536×1024, 3×2. 교실 대기·배팅 케이지·재활·구장 입장·계약 검토·야간 라이벌. 직접 확인 | `art-draft`·`art-training`·`art-pro`·`art-contract`·`art-game` 적용. 재활 컷은 대응 장면 없음(후보: 부상 화면) |
| [마감 6컷](../design/assets/art-lab/career-scenes-finish-animation-v1.png) | 1536×1024, 3×2. 대학 캠퍼스·원정 버스·낮 라이벌·공항 복귀·라커 소품·빈 구장. 직접 확인 | `art-college`·`art-quiet`(라커 소품)·`art-club`(빈 구장) 적용. 원정 버스·공항 복귀는 미사용 |
| [앱 일러스트](../../apps/web/src/assets/Illustration.tsx) | 코드에서 확인한 인라인 SVG. 경기장, 포지션, 리그, 오류·빈 상태 | 로그인·선수·시즌·구단·공통 상태에서 사용 |
| [팀 표장·폰트 출처](../implementation/asset-provenance.json) | 기존 권리 및 라이선스 기록 | 공식 표장은 권리 확인 전 배포 보류. Pretendard는 앱에서 로컬 사용 |

[생성 원본 설명](../design/assets/GENERATED-ASSETS.md)과 아트랩 레지스터가 개별 이미지의 출처 기준이다. 앱용 파생본은 원본을 보존하고 경로·크기·검증 결과를 기록한다.

장면 적용은 [styles.css](../../apps/web/src/styles.css)의 `::after` 레이어다. 아틀라스 한 칸을 컨테이너 단위(cqw)로 잘라 왜곡 없이 보이며, 원본 픽셀은 수정하지 않았다. 로드 실패 시 기존 SVG가 보인다. `art-service`(병역)·`art-hero`(홈)는 대응 승인 컷이 없어 SVG 유지. 빌드에 PNG 5장(합계 약 11.8MB)이 포함되므로 파생 WebP가 후속 과제다. 기타 승인 SVG(배지·메달·보상·실루엣·카드 테마)는 `docs/design/assets` 하위에 있으며 앱 연결 여부는 다음 조사 대상이다.

로그인은 승인 PNG 원본(2,209,684바이트)을 Vite에서 번들링한다. 이미지 로드 실패 시 기존 SVG가 보인다. 위 브라우저 검수는 화면 배치만 확인했으며 실제 로그인·실기기·저속 연결 성능은 별도다.
