# MLB FA 구단 비교·이적 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Inline execution; whole-feature fresh review at the end.

**Goal:** 승인된 원구단 + 조건 충족 타 구단 최대 3곳을 기존 MLB FA 조회·수락 API에서 비교하고 실제 이적한다.
**Architecture:** 기존 결정적 조회와 revision CAS를 재사용한다. 새 확률·일정·대화 이벤트는 추가하지 않는다. 선택 견적을 연도 아카이브에 봉인하고 구단별 원장 재생으로 검증한다.
**Tech Stack:** TypeScript / node:test / existing engine + API.
**Spec:** docs/design/14-CANONICAL-DECISIONS.md, 기존 MLB 연봉·기간·포지션 경쟁·마이너 공급 규칙.

## Constraints / review focus
- 원래 계약·게임·선수·시드 보존. 실제 정규 전체 시즌과 통제 fixture를 구분한다.
- 새 지원금·연봉·기간 산식 없음. 기존 원구단 호출과 저장은 호환한다.
- 다른 구단에 원구단 에이전트 counter를 적용하지 않는다.
- 과거 원구단 지급을 현재 구단에서 재차 차감하지 않는다. 보장계약은 새 구단에서 이어진다.
- 실제 대형 DB·실기기·E66 사건 배선 완료를 주장하지 않는다.

## Tasks
- [x] RED: MLB 로스터 이동/예비명단 회귀. 기존 mover를 모든 레벨로 확장; 하위 승격·Rookie만 보충.
- [x] RED: FA 견적 최대3·수요·예산, 이적/JSON/다음 보장연도·변조·구 API 회귀.
- [x] 기존 FA writer에 선택키 추가. 구단별 연도 이력·소유권·급여 재생 연결.
- [x] 공개 API 선택키·안전한 견적 연결. 클라이언트 금액/구단 조작 거부.
- [x] 묶음 집중 테스트·타입·lint·독립 리뷰. 문서/증거·V: 동기화·커밋·푸시.

Ruling: 별도 OPEN 시장 상태를 만들지 않는다. 현재 FA 조회는 RNG를 사용하지 않고 source revision으로 고정되므로 기존 API 경로가 가장 작다. 선택된 견적만 원장에 봉인한다. E66 서사 연결은 이번 기능 완료 기준에 포함하지 않는다.

집중 묶음12/12, 로스터3/3, 견적1/1, KBO1/1 및 정적 검사 통과. 최종 리뷰의 KBO-origin P1 회귀/재리뷰로 해소. 전체 통합 check는 별도 실행 중이며 종료 후 증거를 갱신한다.
