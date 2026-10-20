import {assertAbilities} from '@playball/rules';
import type {LogitVector,PlayerKind,AbilityUnits} from '@playball/rules';
export const TRAIT_IDS=['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12','T13','T14','T15','T16'] as const;
export type TraitId=(typeof TRAIT_IDS)[number];
export interface TraitOwnership {unlocked:readonly TraitId[];qualifiedRivalPitcherKeys:readonly string[]}
const hitterTraits=new Set<TraitId>(['T01','T02','T03','T04','T05','T06','T13','T14']);
export function validateTraits(kind:PlayerKind,ownership:TraitOwnership):void {
  if(new Set(ownership.unlocked).size!==ownership.unlocked.length || ownership.unlocked.some(id=>!TRAIT_IDS.includes(id) || hitterTraits.has(id)!==(kind==='HITTER')) || new Set(ownership.qualifiedRivalPitcherKeys).size!==ownership.qualifiedRivalPitcherKeys.length || ownership.qualifiedRivalPitcherKeys.some(key=>!key) || ownership.qualifiedRivalPitcherKeys.length>0 && !ownership.unlocked.includes('T14')) throw new RangeError('INVALID_TRAIT_OWNERSHIP');
}
export interface TraitContext {
  inning:number;half:'TOP'|'BOTTOM';ownerLead:number;loaded:boolean;firstMeeting:boolean;
  postseason:boolean;pitcherKey:string;starter:boolean;pitcherRuns:number;
}
/** Server-only conditions at the PA boundary; no random draws and no equip limit. */
export function traitLogitEffects(kind:PlayerKind,ownership:TraitOwnership|undefined,context:TraitContext):LogitVector[] {
  if(!ownership) return [];validateTraits(kind,ownership);
  if(!Number.isSafeInteger(context.inning) || context.inning<1 || !Number.isSafeInteger(context.ownerLead) || !Number.isSafeInteger(context.pitcherRuns) || context.pitcherRuns<0) throw new RangeError('INVALID_TRAIT_CONTEXT');
  const effects:LogitVector[]=[];
  for(const id of ownership.unlocked) switch(id) {
    case 'T01':if(context.firstMeeting) effects.push({'2B':.02,HR:.02,BB:-.02});break;
    case 'T02':effects.push({BB:.03,K:-.02});break;
    case 'T05':if(context.loaded) effects.push({'1B':.04,'2B':.03,K:-.02});break;
    case 'T06':if(context.postseason) effects.push({HR:.04,BB:-.02});break;
    case 'T07':effects.push({K:.03,BB:.01});break;
    case 'T08':effects.push({OUT:.03,HR:-.02});break;
    case 'T09':if(context.inning>=8 && Math.abs(context.ownerLead)<=3) effects.push({K:.02,BB:-.02});break;
    case 'T11':if(context.loaded) effects.push({K:.04,OUT:.03,HR:-.02});break;
    case 'T12':if(context.inning>=9 && context.ownerLead>0) effects.push({K:.04,BB:-.03});break;
    case 'T13':if(context.inning>=9 && context.half==='BOTTOM' && (context.ownerLead===0 || context.ownerLead===-1)) effects.push({'1B':.05,'2B':.04,K:-.03});break;
    case 'T14':if(ownership.qualifiedRivalPitcherKeys.includes(context.pitcherKey)) effects.push({HR:.05,'2B':.03,K:-.03});break;
    case 'T15':if(context.starter && context.inning>=7 && context.pitcherRuns===0) effects.push({OUT:.05,BB:-.03,HR:-.02});break;
    case 'T16':if(context.starter) effects.push({OUT:.04,BB:-.03});break;
  }
  return effects;
}
export const traitDefenseBonus=(ownership?:TraitOwnership):number=>ownership?.unlocked.includes('T04')?2:0;
export const traitRunningBonus=(ownership?:TraitOwnership):number=>ownership?.unlocked.includes('T03') ? .02 : 0;
export function traitPitchThreshold(base:number,starter:boolean,ownership?:TraitOwnership):number {return starter && ownership?.unlocked.includes('T10')?Math.min(105,base+3):base;}

export interface TraitUnlockEvidence {
  regular:{PA:number;extraBaseHits:number;BB:number;K:number;outs:number;starts:number};
  career:{extraHomeSuccesses:number;fieldingGames:number;loadedHits:number;postseasonHR:number;saves:number;loadedBF:number;walkoffHits:number;shutouts:number;consecutiveQualifiedSeasons:number};
  qualifiedRivalPitcherKeys:readonly string[];
}
/** Counts must come from finalized, correctly scoped contributions; never accept them from a client command. */
export function evaluateTraitUnlocks(kind:PlayerKind,abilities:AbilityUnits,owned:TraitOwnership,evidence:TraitUnlockEvidence):TraitOwnership {
  validateTraits(kind,owned);assertAbilities(kind,abilities);
  for(const value of [...Object.values(evidence.regular),...Object.values(evidence.career)]) if(!Number.isSafeInteger(value) || value<0) throw new RangeError('INVALID_TRAIT_EVIDENCE');
  const r=evidence.regular,c=evidence.career;
  const conditions:Record<TraitId,boolean>={
    T01:r.PA>=150 && r.extraBaseHits>=20,T02:r.BB>=30,T03:c.extraHomeSuccesses>=20,T04:c.fieldingGames>=100 && abilities.DEFENSE!>=700_000,
    T05:c.loadedHits>=10 && abilities.CLUTCH!>=700_000,T06:c.postseasonHR>=5,T07:r.K>=100,T08:r.outs>=300 && abilities.COMMAND!>=650_000,
    T09:c.saves>=20 && abilities.COMPOSURE!>=650_000,T10:r.starts>=20 && abilities.STAMINA!>=700_000,T11:c.loadedBF>=30 && abilities.COMPOSURE!>=700_000,T12:c.saves>=100,
    T13:c.walkoffHits>=3,T14:evidence.qualifiedRivalPitcherKeys.length>0,T15:c.shutouts>=3,T16:c.consecutiveQualifiedSeasons>=5,
  };
  const unlocked=TRAIT_IDS.filter(id=>hitterTraits.has(id)===(kind==='HITTER') && (owned.unlocked.includes(id) || conditions[id]));
  const qualifiedRivalPitcherKeys=[...new Set([...owned.qualifiedRivalPitcherKeys,...(kind==='HITTER'?evidence.qualifiedRivalPitcherKeys:[])])].sort();
  const result={unlocked,qualifiedRivalPitcherKeys};validateTraits(kind,result);return result;
}
/** 107 uses exact fraction comparison, not rounded displayed OPS. */
export function qualifiesRivalSeason(input:{PA:number;AB:number;H:number;BB:number;HBP:number;TB:number;confirmedRelationshipWin:boolean}):boolean {
  for(const value of [input.PA,input.AB,input.H,input.BB,input.HBP,input.TB]) if(!Number.isSafeInteger(value) || value<0) throw new RangeError('INVALID_RIVAL_STATS');
  if(input.PA!==input.AB+input.BB+input.HBP || input.H>input.AB || input.TB<input.H || input.TB>4*input.H) throw new RangeError('INVALID_RIVAL_STATS');
  if(input.PA<20 || input.AB===0 || !input.confirmedRelationshipWin) return false;
  const pa=BigInt(input.PA),ab=BigInt(input.AB),on=BigInt(input.H+input.BB+input.HBP),tb=BigInt(input.TB);
  return 10n*(on*ab+tb*pa)>=9n*pa*ab;
}

/** Apply T04 after the temporary-stat clamp and before fatigue/morale/position fit. */
export function defenseTraitTemporary(baseUnits:number,temporary:Readonly<Record<string,number>>,owned?:TraitOwnership):Readonly<Record<string,number>> {
  if(!traitDefenseBonus(owned)) return temporary;
  const raw=baseUnits/10_000+(temporary.DEFENSE??0);
  if(!Number.isFinite(raw)) throw new RangeError('INVALID_DEFENSE');
  return {...temporary,DEFENSE:Math.min(100,Math.max(1,Math.min(100,raw))+2)-baseUnits/10_000};
}
const HIDDEN_META={
  T13:{name:'끝내기 본능',hint:'마지막 순간에 배트가 먼저 안다.'},
  T14:{name:'숙적 킬러',hint:'누군가에게만은 지고 싶지 않다.'},
  T15:{name:'완봉의 맛',hint:'마지막 아웃까지 마운드를 내주지 않는다.'},
  T16:{name:'꾸준한 에이스',hint:'해마다 같은 자리에 서 있다.'},
} as const;
export function hiddenTraitCard(id:keyof typeof HIDDEN_META,owned:TraitOwnership,detail?:{condition:string;effects:Readonly<LogitVector>;evidenceRefs:readonly string[]}) {
  const meta=HIDDEN_META[id];
  if(!owned.unlocked.includes(id)) return {traitId:id,hidden:true,name:meta.name,hint:meta.hint};
  if(!detail) throw new RangeError('TRAIT_EVIDENCE_REQUIRED');
  return {traitId:id,hidden:true,name:meta.name,hint:meta.hint,unlocked:true,condition:detail.condition,effects:{...detail.effects},evidenceRefs:[...detail.evidenceRefs]};
}
