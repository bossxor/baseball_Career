import {recordTotals} from './records.js';
import type {RecordLedger} from './records.js';
import {hiddenTraitCard} from './traits.js';
import type {TraitId,TraitOwnership} from './traits.js';
import type {HighSchoolCareer} from './high-school-career.js';

/** 47 names/effects and 56 exact conditions. Display text only; the engine never reads these strings. */
const GENERAL:Record<string,{name:string;effects:string;kind:'HITTER'|'PITCHER'}>={
 T01:{name:'첫 대면의 강타자',effects:'투수 첫 대면 타석 2B +.02 / HR +.02 / BB -.02',kind:'HITTER'},
 T02:{name:'끈질긴 승부',effects:'BB +.03 / K -.02',kind:'HITTER'},
 T03:{name:'빈틈을 달리는 발',effects:'추가 진루 확률 +.02 (최종 .90 상한)',kind:'HITTER'},
 T04:{name:'수비의 중심',effects:'본인 수비 유효값 +2 (100 상한)',kind:'HITTER'},
 T05:{name:'만루 해결사',effects:'만루 1B +.04 / 2B +.03 / K -.02',kind:'HITTER'},
 T06:{name:'가을의 한 방',effects:'포스트시즌 HR +.04 / BB -.02',kind:'HITTER'},
 T07:{name:'탈삼진 본능',effects:'K +.03 / BB +.01',kind:'PITCHER'},
 T08:{name:'낮게 제압하기',effects:'OUT +.03 / HR -.02',kind:'PITCHER'},
 T09:{name:'흔들림 없는 끝',effects:'8회 이후 점수차 3 이하 K +.02 / BB -.02',kind:'PITCHER'},
 T10:{name:'긴 호흡',effects:'선발 교체 검토 투구수 +3 (105 상한)',kind:'PITCHER'},
 T11:{name:'만루 탈출',effects:'만루 K +.04 / OUT +.03 / HR -.02',kind:'PITCHER'},
 T12:{name:'마지막 문지기',effects:'9회 이후 리드 K +.04 / BB -.03',kind:'PITCHER'},
};
/** 100: confirmed hidden conditions/effects, revealed only after unlock. */
const HIDDEN_DETAIL:Record<'T13'|'T14'|'T15'|'T16',{condition:string;effects:Readonly<Record<string,number>>;kind:'HITTER'|'PITCHER'}>={
 T13:{condition:'커리어 끝내기 안타 3회',effects:{'1B':.05,'2B':.04,K:-.03},kind:'HITTER'},
 T14:{condition:'같은 라이벌 투수 상대 정규 한 시즌 PA 20 이상·OPS .900 이상과 관계 이벤트 승리',effects:{HR:.05,'2B':.03,K:-.03},kind:'HITTER'},
 T15:{condition:'커리어 완봉 3회',effects:{OUT:.05,BB:-.03,HR:-.02},kind:'PITCHER'},
 T16:{condition:'연속 5시즌 선발 규정이닝',effects:{OUT:.04,BB:-.03},kind:'PITCHER'},
};
export interface TraitProgressPart {label:string;current:number;target:number}
export interface GeneralTraitCard {traitId:TraitId;name:string;effects:string;unlocked:boolean;progress:TraitProgressPart[]}

function careerSum(records:RecordLedger,key:string) {
 const out={extraHome:0,fielding:0,loadedHits:0,psHR:0,saves:0,loadedBF:0};
 const scopes=new Set(Object.values(records.games).map(g=>JSON.stringify([g.scope.leagueKey,g.scope.phase])));
 for(const s of scopes){const [leagueKey,phase]=JSON.parse(s) as [string,'REGULAR'|'POSTSEASON'|'INTERNATIONAL'];const t=recordTotals(records,{leagueKey,phase}),b=t.batting[key],p=t.pitching[key];
  if(b){out.extraHome+=b.extraHomeSuccesses;out.fielding+=b.fieldingGames;out.loadedHits+=b.loadedHits;if(phase==='POSTSEASON')out.psHR+=b.HR;}
  if(p){out.saves+=p.SV;out.loadedBF+=p.loadedBF;}}
 return out;
}
const ability=(units:number|undefined)=>Math.floor((units??0)/10_000);

/** S38 read projection for the owner's player. Pure: no RNG, revision or ledger change. Hidden traits expose name/hint only until unlocked. */
export function careerTraitView(source:HighSchoolCareer) {
 const key=source.world.protagonistKey,player=source.world.players[key]!,kind=player.kind as 'HITTER'|'PITCHER';
 const owned:TraitOwnership=source.traits?.owned[key]??{unlocked:[],qualifiedRivalPitcherKeys:[]};
 const leagueKey=source.world.leagueKey??'HS',season=recordTotals(source.records,{leagueKey,phase:'REGULAR',seasonKey:source.world.seasonKey});
 const b=season.batting[key],p=season.pitching[key],c=careerSum(source.records,key),a=player.abilities;
 const parts:Record<string,TraitProgressPart[]>={
  T01:[{label:'이번 시즌 정규 타석',current:b?.PA??0,target:150},{label:'이번 시즌 장타',current:b?b.twoB+b.threeB+b.HR:0,target:20}],
  T02:[{label:'이번 시즌 정규 볼넷',current:b?.BB??0,target:30}],
  T03:[{label:'커리어 추가 홈 진루',current:c.extraHome,target:20}],
  T04:[{label:'커리어 수비 출장',current:c.fielding,target:100},{label:'수비',current:ability(a.DEFENSE),target:70}],
  T05:[{label:'커리어 만루 안타',current:c.loadedHits,target:10},{label:'클러치',current:ability(a.CLUTCH),target:70}],
  T06:[{label:'커리어 포스트시즌 홈런',current:c.psHR,target:5}],
  T07:[{label:'이번 시즌 정규 탈삼진',current:p?.K??0,target:100}],
  T08:[{label:'이번 시즌 정규 아웃',current:p?.outs??0,target:300},{label:'제구',current:ability(a.COMMAND),target:65}],
  T09:[{label:'커리어 세이브',current:c.saves,target:20},{label:'위기관리',current:ability(a.COMPOSURE),target:65}],
  T10:[{label:'이번 시즌 정규 선발',current:p?.starts??0,target:20},{label:'체력',current:ability(a.STAMINA),target:70}],
  T11:[{label:'커리어 만루 상대 타자',current:c.loadedBF,target:30},{label:'위기관리',current:ability(a.COMPOSURE),target:70}],
  T12:[{label:'커리어 세이브',current:c.saves,target:100}],
 };
 const general:GeneralTraitCard[]=Object.entries(GENERAL).filter(([,g])=>g.kind===kind).map(([id,g])=>{const unlocked=owned.unlocked.includes(id as TraitId);
  return {traitId:id as TraitId,name:g.name,effects:g.effects,unlocked,progress:unlocked?[]:parts[id]!.map(x=>({...x,current:Math.min(x.current,x.target)}))};});
 const receipts=source.traits?.unlocks.filter(u=>u.playerKey===key)??[];
 const hidden=(Object.keys(HIDDEN_DETAIL) as ('T13'|'T14'|'T15'|'T16')[]).filter(id=>HIDDEN_DETAIL[id].kind===kind).map(id=>{
  const r=receipts.find(x=>x.traitId===id);
  return hiddenTraitCard(id,owned,r?{condition:HIDDEN_DETAIL[id].condition,effects:HIDDEN_DETAIL[id].effects,evidenceRefs:[`${r.seasonKey??''}:${r.worldDay}`]}:undefined);
 });
 return {kind,autoApply:true as const,general,hidden,hiddenCount:hidden.length};
}
