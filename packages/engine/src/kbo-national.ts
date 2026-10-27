import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {KboMilitaryStatus} from './kbo-military-state.js';

export type NationalTournament='WBC'|'OLY'|'AG'|'P12';
export type NationalMedal='GOLD'|'SILVER'|'BRONZE'|null;
export interface NationalCompetitionResult {
 competitionId:string;tournament:NationalTournament;seasonKey:string;medal:NationalMedal;finalRank:number;
 officialAppearance:boolean;registered:boolean;resultVersion:1;
}
export interface NationalBenefitReceipt {
 benefitKey:string;competitionId:string;benefitType:'ATHLETE_ELIGIBLE';appliedRevision:number;resultVersion:1;
}
export interface NationalCallup {
 selectionId:string;tournament:NationalTournament;seasonKey:string;invitationVersion:1;status:'INVITED'|'ACCEPTED'|'DECLINED';
 militaryEffect:boolean;
}
export interface NationalLedger {
 invitations:readonly NationalCallup[];competitions:readonly NationalCompetitionResult[];benefits:readonly NationalBenefitReceipt[];
 athleteDutySeasonsRemaining?:number;
}

/** AG gold or any OLY medal qualifies only with a real appearance while still unresolved/pending. WBC/P12 never qualify. */
export function nationalAthleteEligible(result:NationalCompetitionResult,status:KboMilitaryStatus):boolean {
 if(!result.registered||!result.officialAppearance)return false;
 if(!['UNRESOLVED','APPLICATION_PENDING'].includes(status))return false;
 if(result.tournament==='AG')return result.medal==='GOLD';
 if(result.tournament==='OLY')return result.medal==='GOLD'||result.medal==='SILVER'||result.medal==='BRONZE';
 return false;
}

function ledger(c:KboCareer):NationalLedger {
 return c.national??{invitations:[],competitions:[],benefits:[]};
}

/** Opens one S24 invitation. WBC/P12 have no military effect flag. */
export function openNationalCallup(c:KboCareer,revision:number,tournament:NationalTournament):KboCareer {
 assertKboCareerRevision(c,revision);
 const selectionId=JSON.stringify(['national-callup',c.world.worldKey,c.world.seasonKey,tournament,c.protagonistKey]);
 const cur=ledger(c);if(cur.invitations.some(i=>i.selectionId===selectionId&&i.status!=='DECLINED'))throw new RangeError('NATIONAL_CALLUP_OPEN');
 if(Object.hasOwn(c.health.injuries,c.protagonistKey)||['SERVING_ACTIVE'].includes(c.military?.status??''))throw new RangeError('NATIONAL_CALLUP_INELIGIBLE');
 const next=structuredClone(c);next.national={...cur,invitations:[...cur.invitations,{selectionId,tournament,seasonKey:c.world.seasonKey,invitationVersion:1,status:'INVITED',militaryEffect:tournament==='AG'||tournament==='OLY'}]};next.revision++;return next;
}

export function respondNationalCallup(c:KboCareer,revision:number,selectionId:string,decision:'ACCEPT'|'DECLINE'):KboCareer {
 assertKboCareerRevision(c,revision);const cur=ledger(c),invite=cur.invitations.find(i=>i.selectionId===selectionId);
 if(!invite||invite.status!=='INVITED')throw new RangeError('NATIONAL_CALLUP_NOT_OPEN');
 const next=structuredClone(c);next.national={...cur,invitations:cur.invitations.map(i=>i.selectionId===selectionId?{...i,status:decision==='ACCEPT'?'ACCEPTED':'DECLINED'}:i)};next.revision++;return next;
}

/** Seals one competition result. ATHLETE_ELIGIBLE at most once per competition; never COMPLETED here. */
export function sealNationalCompetitionResult(c:KboCareer,revision:number,result:NationalCompetitionResult):KboCareer {
 assertKboCareerRevision(c,revision);
 if(result.resultVersion!==1||!result.competitionId||result.seasonKey!==c.world.seasonKey)throw new RangeError('INVALID_NATIONAL_RESULT');
 const cur=ledger(c);if(cur.competitions.some(x=>x.competitionId===result.competitionId))throw new RangeError('NATIONAL_RESULT_ALREADY_SEALED');
 const next=structuredClone(c);const status=(next.military?.status??'UNRESOLVED') as KboMilitaryStatus;
 const benefits=[...cur.benefits];
 if(nationalAthleteEligible(result,status)){
  const benefitKey=JSON.stringify(['national-benefit',result.competitionId,'ATHLETE_ELIGIBLE']);
  if(benefits.some(b=>b.benefitKey===benefitKey))throw new RangeError('NATIONAL_BENEFIT_DUPLICATE');
  benefits.push({benefitKey,competitionId:result.competitionId,benefitType:'ATHLETE_ELIGIBLE',appliedRevision:revision+1,resultVersion:1});
  next.military={...(next.military??{applications:[]}),status:'ATHLETE_ELIGIBLE',applications:next.military?.applications??[]};
 }
 next.national={invitations:cur.invitations,competitions:[...cur.competitions,structuredClone(result)],benefits,...(cur.athleteDutySeasonsRemaining!==undefined?{athleteDutySeasonsRemaining:cur.athleteDutySeasonsRemaining}:{})};
 next.revision++;return next;
}

/** Offseason: enter the 3-season athlete duty block. Domestic play stays allowed. */
export function confirmAthleteService(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);
 if(c.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 if((c.military?.status??'UNRESOLVED')!=='ATHLETE_ELIGIBLE')throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 if((c.national?.benefits??[]).every(b=>b.benefitType!=='ATHLETE_ELIGIBLE'))throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 const next=structuredClone(c);next.military={...next.military!,status:'ATHLETE_SERVICE'};next.national={invitations:next.national?.invitations??[],competitions:next.national?.competitions??[],benefits:next.national?.benefits??[],athleteDutySeasonsRemaining:3};next.revision++;return next;
}

/** Year boundary: one duty season consumed. After 3 → COMPLETED. */
export function advanceAthleteDutySeason(c:KboCareer):void {
 if(c.military?.status!=='ATHLETE_SERVICE'||!c.national||c.national.athleteDutySeasonsRemaining===undefined)return;
 const left=c.national.athleteDutySeasonsRemaining-1;
 if(left<0)throw new RangeError('ATHLETE_DUTY_EXHAUSTED');
 c.national={...c.national,athleteDutySeasonsRemaining:left};
 if(left===0){c.military={...c.military,status:'COMPLETED',completedSeasonKey:c.world.seasonKey};}
}
