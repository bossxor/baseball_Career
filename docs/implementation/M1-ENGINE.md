# M1 경기 엔진 인계

2026-10-20 / engine1.0.0 / rules1.0.0 / Node24.

## 진입점

`createGame(GameInput)` → `runGameChunk(GameState, limits)` → LIVE/FINAL 및 stopReason. 외부 코드가 입력을 확정하고, 상태를 DB에 저장하는 것은 M2/M3입니다. game/key와 모든 선수/team key는 **simulationKey**이며 물리 DB ID를 받지 않습니다. 순수 함수는 원본을 복제하고 입력·이전 경기 상태를 수정하지 않습니다.

- `src/rng.ts`: PCG32·스트림 분리·스냅샷.
- `src/probabilities.ts`: 유효 능력·logit·softmax·효과 상한·대표구종 친화.
- `src/bases.ts`: 결과별 주자 이동·병살·추가 진루·끝내기 최소득점.
- `src/game.ts`: 라인업/가용성 검사·교체·경기 진행·청크·판정·불변조건.
- `src/stats.ts`: 분모·비율·이닝 표시.

타자9/수비8(DH 제외)/가용 투수1 이상 필요. active repertoire는2~4종, 각정수10~90/합100, 학습중 등급0은 활성 불가. 동률은 simulationKey의 코드 단위 비교이며 localeCompare를 사용하지 않습니다. 대표 구종은 pitchId 순 누적 선택이고60% 경계는 다음 구종입니다.

## 난수·버전

참고 원전: [PCG 공식 벡터](https://www.pcg-random.org/using-pcg-c-basic.html). 초기화 seed42/sequence54의6출력 일치로 구현을 고정했습니다. uint64 상태는 BigInt, JSON에는10진 문자열. float=uint32/2^32, 균등 정수는 rejection sampling을 씁니다.

engine1 스트림 seed namespace는 `JSON.stringify(['engine-1',seed,simulationGameKey])`의 UTF-8 FNV-1a64이며 stream별 sequence를 독립 생성합니다. 호출 순서: 유효성/교체→pitchPlan1회→game1회→pitchCount1회(거절 샘플 포함)→필요한 추가 진루/병살 baserunning. 부상·성장·이벤트 스트림은 M1 경기에서 소비하지 않습니다. stream/key/순서를 바꿀 때 버전과 골든 회귀를 검토합니다. FNV는 보안용 해시가 아닙니다.

1청크 최대1000PA/완료이닝20, PS/국제는20완료이닝 경계마다 저장 반환. 한 공수300PA 한도는 다음 추첨 전 ENGINE_LIMIT와 마지막 완료 상태를 반환합니다. API는 오류라고 새 seed로 재추첨하지 않아야 합니다. 이 함수의 JSON 재개 증거는 실제 앱/OS 강제종료/서버 트랜잭션 증거를 대신하지 않습니다.

## 검증 범위

67개 테스트에는192개(8결과×8주자배치×3아웃) 진루 조합,14유형×100시드,기본100경기,4조건×10만PA가 들어 있습니다. 정상경기 표본과 지정된 전타석 삼진 PS20회 경계 fixture를 구분합니다. 후자는 희귀한 자연 표본을 얻었다는 의미가 아닙니다.

REC01~10/12~15의 경기 코어 경계와 REC11의 FINAL 재실행 무변경을 검사했습니다. 다만 REC11의 **DB 누적기록 정확히1회**, REC14의 **실제 브라우저/Android/다른 OS 교차 실행**, 실제 시즌·장기 리그 검증은 아직 없습니다. 119의 모든 PF-D(생성/이미지/UI/복사 포함)를 전부 통과했다고 기록하지 않습니다.

## 다음 연결 시 주의

M2에서 소유 특성의 조건·기한·해금과 비logit T03/T04/T10을 실제 타석 snapshot에 연결해야 합니다. 현재 `traitLogits`는 조건 판정이 끝난 입력으로 **확률 합산만** 검사합니다. 경기 후 부상·피로·성장/구종 XP·특성 해금은 한 번의 확정 원장에서 반영하고 마지막 PA를 다시 재생하지 않습니다. `pitcherAppearanceFatigue`는 등판 후 delta이며 매타석 적용하지 않습니다.

대타/수비 교체 명령 및 중간 선수 snapshot 변경은 현재 외부 공개 명령으로 제공하지 않았습니다. 부상자는 시작 명단에서 거절합니다. M2/M6에서 실제 기용 정책을 연결할 때 재출장/타순 중복 금지와 다음 PA 적용 경계를 유지합니다. 게임 UI·인증·저장 API는 아직 없으며 현재 웹에는 개발 안내 화면만 나옵니다.
