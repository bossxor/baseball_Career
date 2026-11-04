# 시즌 목표·에이전트 저장 배선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Inline; fresh review of final bundle.

**Goal:** 기존 E89/E90 목표·E91/E92/E93 에이전트의 실제 native 선택·수락을 저장 명령과 공개 조회에 연결한다.
**Architecture:** 기존 owner 함수와 DB CAS를 재사용. 새 수치/추첨/자금·기간을 정하지 않는다. native previewId는 내부 건강/로스터/지원금/seed가 들어갈 수 있으므로 SHA256 토큰으로 공개하고 서버가 현재 native preview를 다시 구해 검증/소비한다. 추가 저장 상태 없음.
**Tech Stack:** TypeScript / node:crypto / node:test / existing Hono commands.
**Spec:** docs/design/26-EVENT-CONTENT-CONTRACT.md, native season-goals.ts/career-agent.ts 및 기존 테스트.

## Scope
- 새 career-support-shell.ts, engine-command/career-views route 연결, focused API/HTTP 검사.
- CAREER_GOALS_OPEN/RESOLVE/REPLACE: 실제 학적/프로 owner 및 기존3슬롯/중간 교체 한도, 기념 보상만 유지.
- CAREER_AGENT_OPEN/RESOLVE/CHANGE/PROMISE/OPEN_US_SALARY: native 계약·변경 시점·확률·연봉/기간·요청 횟수 유지. 사용자 funding/futureBudgets/상태 주입 금지.
- 미국 견적의 실제 봉인 funding/futureBudgets만 재사용; 없으면 기존잔액+추가지원0·future authority 없음. 유효하지 않은 미래 예산은 만들어 주지 않는다.
- 모든 확률은 native 공개 quote 값, 보장 결과는 별도100%를 만들어 표시하지 않는다.

## Tasks
- [x] RED: 목표/agent 현재 dispatcher 미지원 확인.
- [x] 저장 경계·공개 allowlist·preview token 검증 묶음 구현.
- [x] 실제 목표 선택/교체 한도, agent 고용·재평가·연봉·metadata 보호/HTTP CAS·stale token focused 검사.
- [x] 타입/lint/build·독립 리뷰·문서/증거·커밋·푸시. 전체 장기 검사는 마지막 큰 묶음에서.

Ruling: 이미 확정된 native 규칙의 배선 작업이다. 임의 금융/능력 값이나 추첨을 바꾸지 않는다. 미국 FA 다른 구단과의 인상 협상처럼 native owner가 지원하지 않는 동작은 추가하지 않는다.

최종 지원7/7, 결합15/15, 정적/빌드 종료0, 독립 리뷰 지적 없음. 기존 전체 결과 미수집은 PASS로 쓰지 않음.
