# 관계 목록·상세·알림 저장 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Inline; final fresh review.

**Goal:** 이미 존재하는 학교/대학/KBO 관계 목록·실제 기록 상세·E94/E95/E96 알림 처리기를 소유 저장 API에 연결한다.
**Architecture:** 학교는 careerRelationshipListView/careerRelationDetailView/resolveCareerRelationNotice(연말 재봉인), KBO는 전용 kbo-relations owner를 그대로 호출한다. 다른 blocking phase/실제 경기·돈·성장·등록은 바꾸지 않는다.
**Tech Stack:** TypeScript / existing save dispatcher / Hono / node:test/PGlite.
**Spec:** docs/design/60-RELATIONS-DETAILED-CONTRACT.md 및 native relation-notices/kbo-relations/relationship-history.

## Scope / boundaries
- CAREER_RELATIONS_RESOLVE, CAREER_RELATIONS/CAREER_RELATION_DETAIL 읽기. 입력은 사건key/version/command, 상세는 relationKey/leagueKey/phase/선택 seasonKey만.
- 신원/현재와 과거 팀은 기존 native projector만 사용하고 old player를 live world에 넣지 않는다.
- 학교의 확정 연말 receipt는 기존 validating/resealing owner를 사용한다.
- 미국은 native root별 관계 history adapter가 없고 KBO→US 때 옛 프로 신원/재회 근거 일부가 보관되지 않는다. 학교/KBO로 타입을 속여 처리하지 않는다. 이 묶음은 US를 명시 거부하고 별도 실제 저장 소유권 보완 과제로 남긴다.
- 사용자 WIP 보존, V: 문서 Copy-Item만. 새 확률/사건 생성/로스터 보충 없음.

## Tasks
- [x] RED: 기존 실제 E94 등록 알림의 API 처리 미지원 확인.
- [x] owner별 읽기/처리·query validation과 source-safe navigation 배선.
- [x] 목록/정확한 scope·연말 재개·HTTP 소유권/CAS/재실행·DTO 회귀.
- [x] focused/static/build·독립 리뷰 후 문서/증거·커밋·푸시.
