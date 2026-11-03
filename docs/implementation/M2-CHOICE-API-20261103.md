# M2 — 2026-11-03 저장 API 연결

기준9be891b. 남은29% 사용량 중 마감 여유를 남기며 기존 승인 엔진 명령의 실제 저장 API 연결을 구현한다. Caveman/Ponytail, 기존 M3 command receipt·save CAS·소유자 검사와 엔진 writer를 재사용한다. 게임 규칙·확률·DB 스키마·의존성을 추가하지 않는다.

Ruling: 큰 귀국 재도전 root를 부분 구현하기보다, 직전 인계의 E71/E73/E85 호출 누락부터 닫는다 — 저장 경계가 명확하고 제한 내 검증 가능하며, 귀국 경로는 여전히 다음 전체 묶음이다.

1. HTTP RED: 실제 저장 소유자·CAS·command-id 재실행, E71 집중/영수증, E73 비교의 무변경·S29 이동, KBO/US 일반 요약·ACK·비공개 정보 제외를 검증한다. 고교/대학/프로 접두는 제어 fixture라고 표시한다.
2. 기존 engine-command 및 getScreen에 작은 별도 adapter를 연결한다. 입력은 owned revision/선택키/선택값만 받고 world·seed·authority 등 외부 권한 필드는 거절한다. 기존 UI 셸/구단/M6은 바꾸지 않는다.
3. 집중 API 및 기존 command/은퇴 회귀, lint/type/build와 웹 검사를 모아 실행한다. 9be891b의 전체1025 실행을 새 source의 전체 통과로 재사용하지 않는다. 장시간 전체 재실행 여부와 미검증 범위를 실제 결과로 기록한다.
4. 최종 한 번 읽기 검토, STATUS/PROGRESS/NEXT/HANDOFF·증거·V 문서 최신화, 사용량 한도 전 커밋·푸시 및 원격 일치 확인. PC 종료 없음.

웹 버튼의 실제 실행은 별도이며 새 화면 UI 완료로 세지 않는다.

## 실행 중 기록

- 읽기3종: CAREER_ROUTE_NOTICES, COLLEGE_US_COMPARISON, PRO_TRAIT_SUMMARY. root careerRevision을 공개해 실제 CAS에 사용한다.
- 저장 명령5종: COLLEGE_FOCUS, COLLEGE_OPEN_US, COLLEGE_SIGN_US, PRO_ACK_TRAITS, ACK_ROUTE_NOTICE(모두 CAREER_CHOICE_ 접두). focus/열람/서명/ACK는 각각 기존 writer만 호출하며 ACK를 실제 선택 적용으로 세지 않는다.
- 첫 HTTP RED는 미연결 화면400을 재현했다. 첫 구현3/3을 통과했고, 실제 미국 서명 추가도 RED 후3/3 통과했다. route notice ACK도 미구현400 RED를 확인했다.
- 첫 타입 검사에서 navigation 미초기화를 발견해 명시 undefined 초기화로 수정했다. 외국 소유자 HTTP 테스트는 미허용 계정401에서 막혔으므로 별도 허용 계정을 fixture에 등록해 실제404 소유자 경계까지 검사했다. 이는 인증 정책 변경이 아니다.
- 실제 서명은 E73이 열린 대학 비교에서만 이 endpoint를 사용한다. 인벤토리 생성/연봉/예산은 HTTP 입력을 받지 않는다. 미국 선수단 활성화/첫 경기는 기존 engine 후속 작업이며 이 API 테스트에서 실행 완료를 주장하지 않는다.

## 소유권·저장/재개

POST saves/:id/commands의 소유자 검사·DB saveRevision·command receipt를 그대로 통과한 뒤 CAREER_CHOICE_만 새 adapter로 보낸다. careerRevision은 저장된 root의 별도 CAS다. GET screens는 소유자 검사 후 engine allowlist reader만 호출한다. 원본 career 전체를 기존 state.career에 저장하며 새 병렬 저장소를 만들지 않는다.

E73 열람은 saveRevision만 진행하고 careerRevision/학적/기록/프로그램을 보존한다. S29 이동은 기존 next 응답에도 제공한다. 실제 서명은 기존 decideCareerUsDirect의 원장 예약·E73 해결·학적 종료가 한 번에 커밋된다. 동일 command-id 재전송은 M3의 기존 결과 영수증을 돌려준다. 새 요청 id에 낡은 saveRevision이면409, root/event/program이 낡으면 engine/입력 오류로400이다.

공개 읽기는 engine DTO와 careerRevision만 반환한다. 잠재력·seed/RNG·비공개 특성·NPC·원본 원장을 내보내지 않는다. PRO ACK는 일반 요약 cursor만 갱신하고 새 특성/성장/계약/급여를 만들지 않는다. ROUTE ACK는 notice 메타데이터만 바꾸고 집중 선택 효과나 세계 사건 완료로 세지 않는다.

독립 읽기 검토에서 Critical/Important 없음. 비차단 지적: 마지막 route ACK HTTP 케이스에는 별도 command-id replay/stale 불변 단언이 없다. 같은 M3 경계는 E71 HTTP에서, ACK writer는 기존 engine 회귀에서 검증한다. 중복 테스트를 늘리지 않고 이 범위를 기록한다.

후속 E74: 실제 예산0으로 오퍼 없는 비교→조기진로→E74를 만든 접두에서 복학을 HTTP로 연결한다. COLLEGE_UNSIGNED_RETURN 읽기와 CAREER_CHOICE_COLLEGE_RETURN만 추가하고 실제 returnUnsignedCollegeCareer를 호출한다. 연도 진행·성장·재추첨은 수행하지 않는다. 미연결 화면400 RED를 확인했다. 최종 범위는 읽기4종·명령6종이다.

## 최종 결과

최종 동결4파일 변경0,9be891b 대비 engine/rules 변경0. E74까지 포함한 API 전체31중29통과·환경2제외·실패0(92290ms), 웹24/24, 전체 lint/typecheck/build, engine/event/design10종/Android shell/assets 정적 검증 및 HTTP smoke 모두 종료0이다. 증거는 evidence/M2-20261103-choice-api-final-batch.log/.exitcode.txt와 choice-api-result.json이다. 최종 E74를 포함한 읽기 검토에서도 Critical/Important 없음.

70분이 소요된 전체 engine/rules 런타임 집합은 재실행하지 않았다. 이번에는 미변경 엔진을 호출하는 API/저장 연결을 검증했으며, 앞선1025개 실행이나 초기3/3·API30개 기록을 새 전체 check 통과로 합산하지 않는다. Neon 환경2건, 웹 버튼/브라우저 렌더, 실제 기기와 미국 선수단 활성화·첫 경기까지의 UI 경로는 이 증거에 포함되지 않는다.

## 다음 인계

귀국 미지명 선택 준비 root의 실제 KBO/US/은퇴 세 출구, 이번 새 화면/명령의 실제 웹 버튼 연결,99사건/24경로/PF 실행 증거가 남는다. M2 전체 완료가 아니다. 작업/Git/build는 지정된 baseball-career-m2 체크아웃, V:에는 문서·증거만 Copy-Item한다. 기존 큰 runtime JSON2개와 zz-dbg.log는 미포함·보존한다. 최종 커밋/푸시는 git log -1과 origin/codex/m2-career-engine 해시로 확인한다.

## 최종 검토 보강
기능 팁 afa1aa1은 원격과 일치한다. 비차단 route ACK 지적도 보강했다: 잘못된 event/root version의400과 저장 불변, 같은 command-id의 동일 receipt 재전송을 HTTP에서 확인했다. focused1/1·lint 종료0(6569ms), 제품 코드 변경0. 최종 API31 실행 이후 테스트만1파일 보강했으므로 전체 batch를 다시 통과했다고 해석하지 않는다. 초기 source freeze는 당시 실행본으로 보존한다. evidence/M2-20261103-choice-ack-review-check.log 참조.

추가 E73: 공개 사건키/버전 누락을 RED로 확인하고 응답 메타데이터와 EARLY_DRAFT/CONTINUE 명령을 추가했다. engine 변경0, lint/타입/API build 통과·API batch 진행 중. 계속 재학에서 남은 훈련 포기를 HTTP가 임의 확정하지 않고 명시 boolean을 받는다. 검사 로그/종료 코드는 choice-route-batch를 따른다.
