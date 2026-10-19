표시·상태 최신 계약: [103](103-AGENTS-RELATIONS-STAFF-STATE-UI.md)와 [106 연결](106-EXPANSION-UI-CLOSURE.md)을 따른다. 기존 수식·권리·기념보상·읽기전용 계약은 유지하며,상태 UI/로컬 시안/실행 미검증을 구분한다.

# 61. 은퇴 지도자 상세 계약 — 역할 claim·급여·효과

52와65확정:같은구단세계같은소유원본은현역복사또는지도자하나. 보관원본불변/가상직원제공. 가격·등급은기존D,연봉코치KRW150000000/스카우트100000000.

## 역할 원장과 전이

source_role_claims PK(saveId,sourceArchiveId),role=PLAYER|COACH|SCOUT,instanceId,active=true. 이claim은별도활성표이므로동시고유행1개,이력은claim_history append-only. 구단생성import도같은표를획득한다. 서버잠금순서는save→정렬sourceArchiveId→예산계정→슬롯,모든명령공유해교착을피한다.

소유검사→은퇴snapshot버전→역할claim→직무공석→예산/미래보장검사→급여예약→staffInstance/contract/효과기간→claim/receipt커밋. 중간실패전부rollback. 동일원본다른역할활성이면422 SLOT_CONFLICT,원본숨김은새선택목록만숨기고기존claim삭제아님. 다른세계는별도claim허용. 가상직원은sourceArchiveId=null로claim없으나동일genericCandidateId중복활성불가.

고용ACTIVE→해임DISMISSED/기한EXPIRED. 해임은효과기간종료/활성슬롯·claim해제,미지급보장급여는남김. 현역복사선수은퇴시PLAYERclaim해제,원본을다음허용직원선택창에지도자로쓸수있음. 원본source와구단복사본의새archive는서로다른고유ID,출처를타고동일선수를무한동시고용하는회피는rootSourceArchiveId기준claim으로막는다.

## 급여·담당·효과

계약시작은다음세계운영일,종료는해당세계시즌재정종료일exclusive. W=저장된seasonFinanceDays,남은D일비례보장총액=floor(annualSalary×D/W). 예W200/D100코치75000000원. 지급일별cumulativeTarget=floor(guaranteedTotal×elapsedContractDays/contractDays),이번paid=target-기지급. 지급만큼reservedOperations감소/paidOperations증가,가용액변화0. 해임시남은reserved를guaranteedStaffOperations로분류만변경,추가이중차감없음. 만료뒤보장잔액정산누락은운영오류.

staffPaid/reserved/guaranteed는운영비의하위항목,선수salary원장과구분. 무제한예산도유한급여원장,실제청구없음. 계약중교체는후임보장액도검사,기존빚삭제없음. 직원1코치/1스카우트는선수정원에포함안함.

코치는assignment=BATTERS|PITCHERS,고용확정때선택,당일변경최대1회/다음세계일부터효력. pendingGame있으면명령확정불가. effectiveTraining=clamp(baseTraining+eventTrainingBonus+coachBonus,0,1.2);코치등급1/2/3의+.02/.04/.05. 기존재활base.8~1.0를먼저계산하고합산. 각선수기간별담당일수에비례,같은날두담당집단에중복적용안함. 개인치트3배는그훈련계수적용한기준자연성장에한번.

스카우트effectiveLevel=min(5,facilityLevel+I(grade≥2)),확률/전망범위미리보기에같이반영. 월탐색횟수2는증가안함,급여지급일을바꿔확률재추첨불가. 등급은소스snapshot의완료프로등록시즌0~2/3~7/8이상→1/2/3,실제등판수·나이와혼동안함. 고용뒤원본고유특성/잠재력연결보너스없음.

## AI와 엔티티

AI는오프시즌로스터·미래급여예약후가용≥해당직원보장액+10억원일때만빈슬롯고용,코치우선→스카우트,등급3가상후보선택. 유지비부족시새계약갱신하지않고기존보장금유지. 플레이어원본보유에의존안함. 현재구단상태로검증하되같은날사용자행동을보고AI후보재추첨없음.

staff_instances(id,saveId,rootSourceArchiveId?,sourceSnapshotHash,role,grade,assignment,status,rowRevision),staff_contracts(id,annualMinor,guaranteedMinor,currency,startDay,endDay,paidMinor),staff_pay_entries(contractId,dayIndex UNIQUE,targetPaidMinor,deltaMinor),staff_effect_periods(staffId,assignment,startDay,endDay). source_role_claims에는actor ownership을복사하지않고save/archive소유관계검사.

## API·S43·검수

GET expansion/staff?clubId →{slots,candidates,costProjection,activeSourceClaims,allowedActions}. HIRE_RETIRED_STAFF={clubId,sourceArchiveId,snapshotVersion,role,assignment?};HIRE_GENERIC_STAFF={clubId,candidateId,role,assignment?};ASSIGN_STAFF={staffId,assignment};DISMISS_STAFF={staffId}. preview필수,보장총액/현재효과/효력일/해임후빚명시. result={outcome,staffId,contractId,claimRole?,effectsStartDay,budgetRevision}. 실행재시도는동일receipt/직원중복0.

S43공석→후보필터(원본/가상)→역할claim상태→등급근거→급여/효과preview→확정→운영홈. 사용불가원본은현재역할과다른후보링크,자동방출/해임안함. STAFF-D01 현역claim때고용거절/02동시import와고용중1개/03원본hash불변/04반년75000000/05해임보장잔액/06코치훈련1.18+.05→1.2/07스카우트L5유지/08급여재처리중복0/09다른세계재사용/10후임예산검사.