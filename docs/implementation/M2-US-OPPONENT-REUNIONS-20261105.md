# M2 미국 이적 관계 분리·상대 재회 E95 — 2026-11-05

## 구현
- 확정 minor/Major 타 구단 서명 안에서 기존 같은 레벨의 실제 동료를 SEPARATED로 남긴다. 원구단 계약/견적 조회는 불변이며 과거 milestone·신원·돈·RNG를 보존한다.
- 기존 restoreUsEmergencyRegistrations로 원본의 부상 대체 등록을 복원한 복사본에서 판정한다. 부상 중 예비 명단의 주인공도 계약 가능하다. 기존 legacy 관계 ledger 없음 fallback을 유지한다.
- 미국 정규 일마감과 MLB PS FINAL에 E95를 연결했다. 같은 경기 양쪽 실제 출장·해당 경기 당시 health 등록·이전 분리 이정표를 확인한다. 벤치·같은 팀·국제전·단순 조회에서는 만들지 않는다.
- US 관계 목록/OPEN_RELATIONS 저장 명령이 E94와 E95를 처리한다. 기존 KBO 경기 근거의 공지는 보존하며 US 공지로 해석하지 않는다. 읽음은 notice/revision만 변경한다. 중복/CAS/소유권·비공개 자료 보호 유지.
- 조회의 같은 source 생성/검증을 한 번으로 줄였다. 새 의존성·게임 수치·계약 산식 변경 없음.

## 실행 증거
- 최종 green:12/12,fail0·skip0,172255.8427ms. API7 + native/단위5. 실제 미국 첫 정규일 자동 재회·JSON 재실행·결과/돈/RNG 불변, 실제 PGlite HTTP 읽음/재전송/소유권, foreign Major 서명과 INJURED source 검증.
- reviewed-static: lint=0 types=0 build=0. 최종 테스트 파일 보완 뒤 green-test-types/green-lint와 green-gates 종료 파일도 확인한다.
- 기존 minor/Major 이적 회귀는 이전 final 로그에서 각각 통과했지만 그 실행 전체는 테스트 준비 문제2건으로 종료1이었다. 그 로그를 전체 PASS로 세지 않는다.
- 최초 native RED는 hook 미연결로 SEPARATED가 유지됨을 재현했다. injury-red* 일부는 등록·진단 준비 자체가 실패한 이력이다. PS 준비에서 기존 수상 봉인 검사가 정상적으로 거절한 뒤, 해당 검사를 PS domain 단위로 분리했다. 보호 로직을 완화하지 않았다.
- 독립 읽기 전용 리뷰가 발견한 부상 등록 차단을 수정했고 재리뷰 추가 지적 없음.

## 증거의 한계
첫 정규 경기는 native다. 이전 관계 분리는 controlled fixture이며, 계약 검사의 앞6시즌·부상 등록/진단·PS envelope도 controlled다. 실제6시즌·전체2년 복무·native playoff 재회 경로라고 주장하지 않는다. PS hook은 배선했고 envelope 근거 단위를 확인했다.

E96 미국 같은 팀 재회, Major 국내 복귀 최신 KBO authority,99사건/24경로/PF·실제 웹·대형DB와 전체 runtime 재검증이 남아 있다. 이전 전체 check1120건의 종료1은 유지한다. M2 관리 추정65%·전체87.5%는 테스트 통과율이 아니다.

## 계속 작업
NEXT-SESSION/HANDOFF 맨 위부터 읽는다. 원본 사용자 WIP18줄은 source에 보존하고 기존15줄/개선18줄 patch도 보관했다. 대형 runtime JSON/zz-dbg는 기존 미커밋이다. 작업/Git/build는 기존 m2 체크아웃, V는 docs 복사만. PC 종료 금지.
