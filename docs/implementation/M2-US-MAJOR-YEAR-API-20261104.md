# 메이저 연말 재계약·원구단 FA 저장 API — 2026-11-04

## 구현과 원장 소유권

기준5d3b6bc 이후 기존 CAREER_US_PLAY에 NEXT_MAJOR_YEAR / ACCEPT_MAJOR_FA2명령을 연결했다. 입력은 careerRevision과 선택적인 소유 counterOfferKey만 받는다. 연봉/기간/예산/지원금/선수 snapshot 주입은 거절한다. 연봉·나이별 기간·FA 자격·잔여 보장은 기존 startNextUsMajorSeason/acceptUsMajorFreeAgency가 소유하며 새 산식을 만들지 않았다.

현재 시즌의 실제 US agent offer가 봉인한 funding이 있으면 그 값을 재사용하고, 없으면 기존 잔액을 추가0으로 이월한다. API가 임의 연간 지원금을 만들지 않는다. 계약 성립은 기존 writer의1회 연봉 예약·실제 다음 해 편성으로 이어지고, 과거 수입/계약금/기록/서비스/옵션/병역은 유지한다. 지급은 다음 시즌의 기존 일일 원장이 소유한다.

US_CAREER 조회의 majorContract는 실제 결산 blocker가 해결됐을 때만 원래 재계약 또는 원구단 FA preview를 낸다. 기본 재계약 예산 부족은 funded:false로 표시하며 실제 명령도 원본을 바꾸지 않고 거절한다. 기존 native FA는 원구단1개만 지원하므로 ORIGINAL_CLUB_FA로 명시했다. 타 구단 FA시장 구현 완료로 표시하지 않는다.

## 연결에서 찾은 가격 표시 불일치

추가 RED는 확정 agent 인상안6248000달러인데 표시가 기본5680000달러에 머무는 오류를 잡았다. native 서명은 이미 승인 counter를 사용했다. 조회도 careerAgentUsSalary의 동일 소유 제안 검증/가격을 사용하고, 실제 승인 counterOfferKey만 공개하도록 수정했다. 보장계약은 기존 계약 금액을 유지한다. 내부 요청 원문/협상 draw/P/RNG를 DTO에 넣지 않는다. 테스트의 수락 draw는 기존 agent 테스트와 같은 통제 fixture이며 게임 world/game RNG를 수정하지 않았다.

## 검증 경계

- 최초 native major+API 묶음9/9, 실패0. 이 단계의 가격 표시 누락은 뒤의 추가 테스트에서 발견했다.
- counter 가격 RED5680000≠6248000 후 수정 범위1/1 통과.
- 최종 새 API5/5·실패0·제외0,135477ms: 외부 금액 거절, 부족 예산 원본 불변, 실제 봉인 funding 재사용, 승인 인상안 표시/서명 일치, 현재 잔액1회 예약/JSON, 통제6등록시즌 뒤 원구단 FA·잔여 보장 승계.
- API build·전체 테스트 타입·변경2파일 lint 종료0. 독립 최종 읽기 리뷰 조치할 Critical/Important/Minor 없음.

6시즌 정규/PS 기여는 기존 controlled fixture다. 이전에 부여된 통제 재정/계약은 실제 native writer로 기록한 접두이고 API가 새 돈을 받은 것은 아니다. native6년 전체 또는 실제 PostgreSQL 장기 저장 증거가 아니다. 같은 명령/fixture를 여러 단계에서 검사했으므로 검사 수를 합산하지 않는다.

증거: M2-20261104-us-major-batch.log, us-major-counter-red/green.log, us-major-api-complete.log 및 us-major-final-static.log/.exitcode.txt. 이번 새 source 전체 check/실기기/대용량 DB는 실행하지 않았다. 기본 실제 화면·M2 전체99/24/PF도 남았다. 원구단 외 MLB FA 비교는 현재 엔진 한계로 별도 결정/구현이 필요하다. 기존 사용자 WIP 테스트21줄과 큰 runtime JSON/zz-dbg.log는 수정하거나 커밋하지 않는다.
