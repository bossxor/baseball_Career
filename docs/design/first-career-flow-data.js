globalThis.PBFirstCareerData = {
  "schemaVersion": 1,
  "status": "DESIGN_PREVIEW_ONLY",
  "source": "113-FIRST-CAREER-SEASON-EXPERIENCE.md",
  "implementationStatus": "NOT_IMPLEMENTED",
  "common": [
    {
      "id": "C01",
      "screenId": "S02",
      "title": "내 선수의 첫 페이지",
      "body": "18세, 고교 마지막 시즌입니다. 선수 종류와 유형을 고르고 여섯 능력 중 네 가지를 집중 육성합니다. 종합은 50.0에서 시작합니다.",
      "action": "이 선수로 시작",
      "guard": "생성 전 입력 검증. 이름·집중4·종류·난이도·초상을 확인합니다.",
      "image": {
        "asset": "assets/art-lab/graduation-animation-day-v1.png"
      },
      "eventIds": [],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    },
    {
      "id": "C02",
      "screenId": "S03",
      "title": "이번 시즌의 네 가지",
      "body": "방금 고른 계획이 이어집니다. 바꾸지 않고 현재 계획을 유지해도 됩니다. 잠재력은 성장 상한이며 현재 능력과 다릅니다.",
      "action": "육성 계획 확인",
      "guard": "E01 안내 재열람은 성장·훈련 기회를 지급하지 않습니다.",
      "image": {
        "asset": "assets/art-lab/career-events-animation-v1.png",
        "x": 0,
        "y": 0
      },
      "eventIds": [
        "E01"
      ],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    },
    {
      "id": "C03",
      "screenId": "S03",
      "title": "기록이 없는 첫날",
      "body": "아직 출장하지 않았다면 타율은 0이 아니라 ‘-’입니다. 일정과 팀의 기용에 따라 첫 경기와 출장이 정해집니다.",
      "action": "현재 구간 진행",
      "guard": "첫 안타나 승리를 안내 보상으로 만들지 않습니다.",
      "image": {
        "asset": "assets/art-lab/career-events-animation-v1.png",
        "x": 0,
        "y": 0
      },
      "eventIds": [],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    },
    {
      "id": "C04",
      "screenId": "S23",
      "title": "한 시즌에 한 번의 선택",
      "body": "고교 12경기 계획 검토와 16경기 강화 해금은 다른 시점입니다. 현재 자격과 실제 효과를 보고 확정 성장·도전·컨디셔닝·건너뛰기를 비교합니다.",
      "action": "선택지 효과 확인",
      "guard": "시즌1회 공유. 안내 열람만으로 기회를 소비하지 않습니다.",
      "image": {
        "asset": "assets/art-lab/career-events-animation-extra-v1.png",
        "x": 50,
        "y": 0
      },
      "eventIds": [
        "E02",
        "E03"
      ],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    },
    {
      "id": "C05",
      "screenId": "S22",
      "title": "어떤 선수가 되고 싶을까",
      "body": "24경기의 유형 변경 창에서는 현재 스타일을 유지할 수도 있습니다. 거포형과 거포수비형 등 내 선수의 방향을 살펴봅니다.",
      "action": "스타일 비교",
      "guard": "타자/투수 유형과 실제 남은 변경 기회를 사용합니다.",
      "image": {
        "asset": "assets/art-lab/career-events-animation-v1.png",
        "x": 0,
        "y": 0
      },
      "eventIds": [],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    },
    {
      "id": "C06",
      "screenId": "S04",
      "title": "고교의 마지막 기록",
      "body": "출장과 성적, 확정된 성장 기록을 돌아봅니다. 결산 그림은 지명이나 계약 성공을 미리 뜻하지 않습니다.",
      "action": "졸업 진로 보기",
      "guard": "확정 성장과 예상 성장을 섞지 않습니다.",
      "image": {
        "asset": "assets/art-lab/graduation-animation-day-v1.png"
      },
      "eventIds": [
        "E04"
      ],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    },
    {
      "id": "C07",
      "screenId": "S28",
      "title": "다음 무대를 고르는 날",
      "body": "국내 드래프트와 대학을 비교합니다. 미국 진출은 능력·권리와 실제 유효 오퍼가 모두 충족된 경우에만 보입니다.",
      "action": "가능한 진로 비교",
      "guard": "제안을 읽는 것만으로 다른 진로가 닫히지 않습니다.",
      "image": {
        "asset": "assets/art-lab/career-events-animation-v1.png",
        "x": 50,
        "y": 0
      },
      "eventIds": [],
      "age": 18,
      "executionStatus": "NOT_EXECUTED"
    }
  ],
  "routes": {
    "KBO": [
      {
        "id": "K01",
        "screenId": "S05",
        "title": "발표 전의 전망",
        "body": "예시 평가 B45에서는 지명 확률 50%, 지명된다면 10라운드 유력입니다. 실제 선수의 최신 평가와 전망은 별도로 계산합니다.",
        "action": "전망 상세 보기",
        "guard": "전망은 확정 라운드가 아닙니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-extra-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "K02",
        "screenId": "S05",
        "title": "이름이 불린 사례",
        "body": "이번 시안은 실제 지명 결과가 있는 사례입니다. 계약 조건을 읽고 수락 여부를 결정합니다.",
        "action": "계약 조건 확인",
        "guard": "이 보드에서 결과를 새로 추첨하지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-extra-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [
          "E05"
        ],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "K03",
        "screenId": "S08",
        "title": "첫 프로 계약",
        "body": "구단·기간·금액·역할을 확인한 뒤 수락합니다. 수락 커밋 전에는 프로 소속으로 바뀌지 않습니다.",
        "action": "계약 상세 확인",
        "guard": "조건이 생략된 요약에 수락 확정 버튼을 두지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-extra-v1.png",
          "x": 50,
          "y": 100
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "K04",
        "screenId": "S03",
        "title": "프로의 첫 캠프",
        "body": "새 팀에서도 네 가지 육성 계획을 확인합니다. 퓨처스 등록에서 시작할 수 있고 1군 자리는 경쟁으로 결정됩니다.",
        "action": "현재 계획 확인",
        "guard": "1군 콜업과 실제 첫 출장은 별도입니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [
          "E08"
        ],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "K05",
        "screenId": "S03",
        "title": "명단에 있는 것과 뛰는 것",
        "body": "등록됐어도 벤치에서 기회를 기다릴 수 있습니다. 실제 출장 기록이 생긴 뒤에만 데뷔로 남깁니다.",
        "action": "다음 일정 보기",
        "guard": "미출장을 가짜 타석·안타로 채우지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "K06",
        "screenId": "S07",
        "title": "첫 정규시즌의 끝",
        "body": "정규 기록을 돌아봅니다. 남은 포스트시즌·국제 창이 있다면 끝난 뒤 오프시즌 정산으로 이어갑니다.",
        "action": "시즌 기록 보기",
        "guard": "등록0/출장0/낮은 성적도 원기록대로 보존합니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      }
    ],
    "COLLEGE": [
      {
        "id": "U01",
        "screenId": "S34",
        "title": "학교보다 내 자리를",
        "body": "종합54 사례에서는 한빛대55는 미달, 백림대52와 해오름대1은 충족입니다. 입학 조건과 주전 경쟁은 서로 다릅니다.",
        "action": "학교 상세 비교",
        "guard": "단순 입학 조건에 확률 배지를 만들지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 50,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "U02",
        "screenId": "S34",
        "title": "입학을 결정하는 순간",
        "body": "최종 입학 수락 전까지 학교 비교와 다른 진로 열람이 가능합니다. 수락 뒤에는 같은 시점의 다른 진로가 정리됩니다.",
        "action": "입학 조건 확인",
        "guard": "열람과 실제 수락을 구별합니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 50,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "U03",
        "screenId": "S35",
        "title": "19세, 대학 1학년",
        "body": "정규48경기를 따라 팀의 경쟁과 내 성적을 확인합니다. 입학했다고 주전이나 성장을 보장하지 않습니다.",
        "action": "현재 학사 구간 보기",
        "guard": "학년과 나이는 별도입니다. 준비시즌 예산은 소모하지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "U04",
        "screenId": "S35",
        "title": "선수권은 다른 기록",
        "body": "선수권에 나갔다면 실제 대회 기록을 따로 남깁니다. 자격이 없는 팀에게 참가나 우승 장면을 만들지 않습니다.",
        "action": "대회 자격 보기",
        "guard": "선수권 경기를 정규48경기로 합치지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "U05",
        "screenId": "S35",
        "title": "첫 학년을 마치며",
        "body": "기록과 학적을 확인하고 다음 학년으로 준비합니다. 1학년에게 2학년 조기지명을 실행 가능한 선택으로 제공하지 않습니다.",
        "action": "학년 기록 보기",
        "guard": "학년 마감과 성장 정산은 기존 원장을 따릅니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 50,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      }
    ],
    "US": [
      {
        "id": "A01",
        "screenId": "S29",
        "title": "실제로 도착한 제안",
        "body": "능력 기준·현재 권리가 유효하고 미국 오퍼가 있는 사례입니다. 마이너 시작 레벨과 계약 종류를 먼저 확인합니다.",
        "action": "제안 상세 비교",
        "guard": "오퍼0이면 이 경로 카드를 표시하지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 100,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "A02",
        "screenId": "S29",
        "title": "계약의 이름을 정확히",
        "body": "미국팀과의 계약은 MLB 즉시 출장 계약과 다릅니다. 금액·기간·보너스·레벨·권리·마감을 확인합니다.",
        "action": "계약 조건 확인",
        "guard": "조회만으로 국내·대학 진로를 닫지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-extra-v1.png",
          "x": 50,
          "y": 100
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "A03",
        "screenId": "S30",
        "title": "조직의 첫 명단",
        "body": "실제 수락한 오퍼의 시작 레벨로 등록합니다. Rookie부터일 수도 있으며 안내를 봤다고 MLB로 자동 승격되지 않습니다.",
        "action": "현재 레벨 보기",
        "guard": "등록·콜업·실제 출장의 근거를 나눕니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 100,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "A04",
        "screenId": "S30",
        "title": "마이너의 긴 하루",
        "body": "현재 레벨 일정과 실제 기용을 따라갑니다. 승격 조건을 충족해도 자리가 없어 보류될 수 있습니다.",
        "action": "현재 구간 보기",
        "guard": "레벨 이동으로 시즌 성장·강화 기회를 초기화하지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "A05",
        "screenId": "S07",
        "title": "처음 건넌 바다의 기록",
        "body": "MLB에 뛰지 못했어도 미국 계약과 실제 마이너 기록은 경력입니다. 실제 소속 리그별로 첫 시즌을 보관합니다.",
        "action": "시즌 기록 보기",
        "guard": "MLB0출장을 실패한 세이브로 취급하지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 100,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      }
    ],
    "UNDRAFTED": [
      {
        "id": "R01",
        "screenId": "S05",
        "title": "이름이 불리지 않은 사례",
        "body": "이번 시안은 미지명 결과가 확정된 다른 사례입니다. 선수의 기록과 이후 가능한 길은 남아 있습니다.",
        "action": "가능한 진로 확인",
        "guard": "KBO 성공 사례를 되돌려 재추첨한 것이 아닙니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-extra-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [
          "E06"
        ],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "R02",
        "screenId": "S28",
        "title": "다시 고르는 길",
        "body": "학적·권리·나이·남은 준비 예산을 검사해 대학·유효 미국 오퍼·독립준비·은퇴 중 가능한 경로를 보여줍니다.",
        "action": "현재 경로 비교",
        "guard": "준비 예산은 최대3시즌 기본안이며 입대·대학 재학으로 소모하지 않습니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 50,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      },
      {
        "id": "R03",
        "screenId": "S03",
        "title": "다음 준비의 첫날",
        "body": "선택한 합법 경로를 따라갑니다. 이전 기록을 지우거나 지명을 약속하지 않고, 자격 있는 재도전과 복학을 이어줍니다.",
        "action": "현재 계획 확인",
        "guard": "모든 합법 경로가 없을 때만 은퇴 정리로 갑니다.",
        "image": {
          "asset": "assets/art-lab/career-events-animation-v1.png",
          "x": 0,
          "y": 0
        },
        "eventIds": [],
        "age": 19,
        "executionStatus": "NOT_EXECUTED"
      }
    ]
  },
  "usExamples": {
    "ELIGIBLE": {
      "overall": 55,
      "amateurEvaluation": 50,
      "validOffers": 1,
      "rightsOpen": true
    },
    "LOW_ABILITY": {
      "overall": 54,
      "amateurEvaluation": 50,
      "validOffers": 1,
      "rightsOpen": true
    },
    "NO_OFFER": {
      "overall": 55,
      "amateurEvaluation": 50,
      "validOffers": 0,
      "rightsOpen": true
    }
  },
  "routeTitles": {
    "KBO": "KBO · 지명된 사례",
    "COLLEGE": "대학 진학",
    "US": "유효 미국 제안",
    "UNDRAFTED": "KBO · 미지명 사례"
  },
  "eventIdsMeaning": "RELATED_SOURCE_EVENTS_NOT_SIMULTANEOUS_TRIGGERS"
};
