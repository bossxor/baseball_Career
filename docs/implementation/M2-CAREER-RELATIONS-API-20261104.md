# 학교·대학·KBO 관계 저장 API — 2026-11-04

## 변경
- CAREER_RELATIONS_RESOLVE가 기존 학교/대학 재봉인 owner와 KBO E94~E96 owner에 위임한다.
- CAREER_RELATIONS 및 CAREER_RELATION_DETAIL은 기존 공개 신원/기록 projector를 사용한다. league/phase/season 범위와 query를 엄격 검증한다.
- 미국은 실제 관계 history adapter와 일부 과거 프로 신원/재회 근거 보존이 없어 US_RELATION_HISTORY_REQUIRED로 거부한다. 학교/KBO로 가장하지 않는다.
- 기존 저장 CAS·소유권·명령 재실행 경계를 재사용한다. 새 게임 규칙/확률/등록/성장/지급 변경 없음.

## 검증
- 새 API4건 + 기존 KBO 관계/재회21건 = 25/25, 실패0·skip0, 29926.9046ms.
- 전체 테스트 타입 검사·변경 파일 lint·API build 종료0. 독립 읽기 전용 리뷰 지적 없음.
- HTTP는 실제 PGlite 저장 E94 소유권/CAS/재실행/조회·DTO를 검증했다. E95/E96은 기존 native 회귀와 owner 배선 검증이며 직접 HTTP 시나리오는 아니다.
- 대학 완료 학년은 통제 접두와 native 연말 봉인으로 구성했다. 알림 열람 후 실제 다음 학년 진입 성공. 실제 전체 학년 진행 증거는 아니다.
- 초기 green 로그의 실패는 null-prototype map과 structuredClone의 객체 prototype 차이 비교다. 저장 JSON 동등성으로 검사를 수정했다. 제품 버그로 주장하지 않는다.

## 증거
- evidence/M2-20261104-relations-final.log / .exitcode.txt
- evidence/M2-20261104-relations-types.log, -lint.log, -build.log, -static.exitcode.txt
- red/green 로그도 진단 이력으로 보존.

## 다음
프로 은퇴/보관 저장 연결, 미국 관계 adapter와 Major E66/귀국 owner, 99/24/PF·실제 웹 연결 잔여. 이전 전체 검사90394는 결과 미수집/PASS 아님. 사용자 WIP 보존. M2 전체 완료 추정65% 유지.
