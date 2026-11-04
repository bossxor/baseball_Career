# 프로 사건 저장 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Inline; final fresh review only.

**Goal:** 기존 코치 조언·의료/기록·수상·구종 처리기를 KBO/US 저장 명령과 공개 읽기 화면에 연결한다.
**Architecture:** 새 CAREER_PRO_EVENT_ prefix와 PRO_EVENTS 화면은 기존 native reducers/eligibility/version 검증을 그대로 호출한다. UI/게임 규칙/자동 사건 생성·추첨은 변경하지 않는다. native view 중 공개 선택/알림만 투영하고 receipt·비교선수 내부 점수/잠재력/시드는 제외한다.
**Tech Stack:** TypeScript, Hono save dispatcher, node:test/PGlite.
**Spec:** docs/design/26-EVENT-CONTENT-CONTRACT.md 및 기존 pro-career-advice/results/awards, repertoire-events 구현/테스트. 새 미정 수치 없음.

## Scope / risk
- apps/api/src/career-pro-events-shell.ts 추가; engine-command/career-views 기존 경계 연결.
- index.ts에서 이미 있는 결과 notice view export 추가. 엔진 게임 처리 변경 없음.
- 입력 revision/eventKey/version/선택만. 도메인별 추가 필드 allowlist, caller ledger/snapshot 거부.
- 의료 확인은 실제 회복 근거가 필요하고 ACK가 부상을 치료하지 않는다.
- 수상 ACK는 새 보상·기록을 만들지 않는다. 구종/접근 선택은 실제 기존 사용 창/XP 예약만 사용한다.
- 이전 전체 검사 결과 미수집을 PASS로 쓰지 않는다. 사용자 WIP 보존, 문서만 V: 복사.

## Tasks
- [x] RED: 실제 KBO/US E86/E88 선택이 현재 dispatcher에서 거절됨을 확인.
- [x] 네 도메인 처리기·공개 allowlist 읽기와 route를 한 묶음 구현.
- [x] 코치 도메인·의료 실제 회복·수상 실제 수신·repertoire의 focused tests + HTTP 소유권/CAS/재실행/원본 불변 검사.
- [x] 집중 묶음/타입/lint/build·독립 리뷰 후 문서·증거·커밋·푸시. 장기 전체 검사는 큰 묶음 끝에만.

Ruling: 상세설계와 native 동작이 확정된 배선 작업이므로 추가 설계 승인/새 정책을 만들지 않는다. 일반 웹 화면 통합과99/24/PF 전체 완료는 별도다.

최종27/27·정적/빌드 종료0·독립 리뷰 P2 재현/해소. 전체 check는 이전 결과 미수집이며 새 PASS 아님.
