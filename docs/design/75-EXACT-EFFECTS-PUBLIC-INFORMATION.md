# 75. 정확한 강화 미리보기와 공개 정보 계약

2026-10-19 사용자확정U:잠재력범위공개보다행동의정확한증가량·비용표시를우선. 67의스카우트범위는유지하지만실행효과로상한을추론하는것은허용. 원본rawP를클라이언트에별도그대로보내는정책으로확대하지않음.

## 강화 preview 필드

preview.effects={abilityKey,beforeExact,onSuccess:{gainExact,afterExact,fatigueDelta},onFailure:{gainExact,afterExact,fatigueDelta},capApplied,limitingFactors:[POTENTIAL_CAP|ABILITY_CAP],eligible,reasonCodes};costs={worldSeasonTrainingUses:1,moneyMinor:"0",currency:KRW};odds=[{target:ENHANCEMENT_SUCCESS,probability,kind:EXACT}]. 확정성장과컨디셔닝은확률없는확정행동,도전은실제p,치트도서버p=1이나UI100%숫자숨김.

도전nominalGain2,eligible는P-A≥1,성공gain=min(2,P-A,100-A). 확정nominal1동일경계. 컨디셔닝은gain0/fatigueDelta=-min(20,currentFatigue). 성공·실패피로는현재피로상한100을적용한실제차이,예피로95도전+10은실제+5. 불가대상은actual effects지급0/비용0/기회미소모,상한여유부족이유와다른대상/컨디셔닝선택을제공.

예A90/P91.25/피로95:도전60%,성공+1.25→91.25/실패0→90,양쪽피로+5→100,기회1. 같은대상치트는도전성공보장. 1e-4미만반올림을위해행동효과를거짓+2로표시하지않음. 선택후실행은동일snapshot/규칙이며변경시409재preview,성공연출과원장수치일치.

## 스카우팅·근거·프라이버시

현재평가범위의이전공개정보는유지,강화실행·정확효과열람으로알게된확정성장한계는별도publicKnowledgeEvidence에기록가능. Pcap에의한절삭으로P가정확하게드러난경우,도움말에는‘강화 상한으로 확인한 정보’라고출처를구분한다. 이를관측20경기stage가올랐다고처리하지않음. 원본보관은그원본evidence유지,새복사본의새P를자동증명하는자료로복사하지않음.

개인플레이게임에서읽기preview를돈/확률재추첨으로제한하지않음. API에rawP/seed/다른친구자료를추가노출하지않고도정확한본인행동효과만반환한다. scout AI는67의공개전망만사용하며강화preview를무한자동질의해비공개P를역산하는AI최적화루틴은없음.

## S23와 검수

대상→현재능력/세계시즌잔여→선택별정확성공·실패효과/실제피로/기회비용→상한절삭상세→확정. 선택·비용·확률변경시다시확인. 검수fixture EF01+1.25절삭/EF02피로95→100실제+5/EF03불가대상기회0/EF04컨디셔닝피로8→0실제-8/EF05치트p1숫자숨김/EF06preview재열람상태·난수0. 구현전서면계약이며현재보드예시는게임과연동되지않는다.