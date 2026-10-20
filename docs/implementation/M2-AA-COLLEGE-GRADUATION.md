# M2-AA — 대학 졸업 E75·진로 조회

2026-10-21.4학년 학년 결과에서 필수 E75를 만들고, 검증된 졸업 확정과 GRADUATED/CAREER_ROUTE를 연결한다. 실제 KBO 모집·조기/졸업 지명·계약·미국 오퍼는 다음 단계다.

## 구현

- `acknowledgeCollegeSeasonReview`는4학년 완료 때 E75를 자동으로 생성하고 EVENT_DECISION에서 멈춘다. sourceTaskId는 해당 학년 결과 영수증이며 선수/학적/학년/세계시즌을 고정한다. 결과와 사건은 같은 결과/revision으로 게시한다.
- `prepareCollegeGraduation`은 기존 M2-Y/Z의4학년 완료/OFFSEASON_REVIEW 세이브를 위한 호환 진입점이다. 현재 유효한 결과/선수권·일마감·성장 원장과 중복 사건을 검사한다.1~3학년이나 이미 준비된 상태는 거절한다.
- `graduateCollegeCareer(career,revision,eventVersion)`은 E75의 근거/버전·원본 평가와 학적·필수 사건을 검증한 뒤, 실제 졸업 영수증으로만 사건을 완료한다. 학적은 GRADUATED, phase는 CAREER_ROUTE가 된다. 졸업 후 기존 대학 진행/다음 학년 명령은 등록 오류로 차단한다.
- 졸업은 나이/세계 연도를 늘리거나 강화/구종/건강/기록을 소진하지 않는다. M2-Y의 부분 성장 원장은 열린 채 유지해 같은 세계시즌 후속 등록기간과 예산을 공유한다. 미사용 강화·잔여 부상을 졸업 확인으로 자동 포기/회복시키지 않는다. NPC의4학년 연말 정산도 실제 다음 세계 연말 작업자에 연결할 범위로 남긴다.
- `collegeGraduationRouteView`는 공개 allowlist다. 졸업 학적/학교/현재 종합과43의 대학 보정 성적/평가 B를 제공한다. 정규 기록만 사용하고 기존 원시 성적 helper의 최소 표본(타자PA50/투수outs30) 미달은raw50, 대학 보정은 clamp(raw-18,0,100), B=.7overall+.3performanceCollege다.
- KBO는 실제 구단 모집/슬롯이 없어 AWAITING_RECRUITMENT만 반환한다. 지명 확률·가짜 계약·미국 오퍼0 카드·대학 재입학 카드를 만들지 않는다. 숨김 P/seed/RNG/내부 sourceBasis는 반환하지 않는다.
- E75를 같은 학적에서 한 번만 생성하고 읽기/JSON 재개는 상태를 바꾸지 않는다. 낡은 revision/사건 버전·변조된 근거/선수/등록/영수증을 부분 졸업 없이 거절한다.

## 검증

집중10/10 통과.4년 재학(정규 점수/등록 fixture·실제 선수권) 후 E75 필수 정지, 졸업 확정1회·기록/나이/경제/건강 원장 보존, 공개 allowlist/보정 성적·가짜 오퍼0, 이전4학년 세이브 호환·stale 거절과 기존 학년 전환을 확인했다. 최종 전체252/252(232.3초)·check 종료코드0, lint·소스/테스트 타입·전체 빌드·compiled M1 골든·고교 세계 해시6개·이벤트 동기화·설계 정적10종을 통과했다. HTTP smoke 종료코드0, 설계 manifest359/359의 바이트 수·SHA256 일치를 확인했다. 브라우저 렌더/계정/DB/APK는 실행하지 않았다. [집중 검사](evidence/M2-AA-focused.log) · [전체 검사](evidence/M2-AA-check.log) · [HTTP smoke](evidence/M2-AA-smoke.log) · [최종 설계 검사](evidence/M2-AA-design.log).

## 남은 범위

E71 첫 대학 안내·E72 선수권 안내·E73 실제 조기 지명 선택은 아직 연결하지 않았다.2학년 재학 유지와4학년 졸업 경로는 구현했으나 실제 모집/계약/미국 유효 오퍼·졸업 후 재도전/은퇴·병역/국제·세계 전체 NPC 진로·DB/API/UI는 남아 있다. 미국 첫 고교 졸업52 도달성 충돌은 수치를 임의 변경하지 않았다.

사용자의 즉시 중단 지시로 신규 기능은 여기서 멈췄다. 코드·진행 MD·증거를 함께 커밋·푸시하고 [최종 인계](NEXT-SESSION.md)를 저장한다. 로컬 작업 트리와 실제 원격 main HEAD 일치를 확인한 뒤 승인된 PC 종료 명령을 실행한다. 리셋 크레딧은 사용하지 않았다.
