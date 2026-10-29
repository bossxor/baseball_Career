import {assertFocus,roleScore} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {recordTotals} from './records.js';
import type {GameContribution} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {FIELD_POSITIONS,initialPositionFits,recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import type {FieldPosition} from './lineup.js';
import {validateDevelopmentPlayer} from './player.js';
import {canonicalJson} from './game.js';
import {createStreams,nextFloat,nextInteger,validateRng} from './rng.js';
import type {RngState} from './rng.js';
import {createWorldEvent,eventDefinition,validateEvent,resolveEventChoice,completeEventDomain} from './events.js';
import type {EventInstance} from './events.js';
import type {CompetitionGameWorld,HighSchoolGameContext} from './high-school-game.js';
import type {ScheduledGame} from './schedule.js';
import type {GameInput} from './types.js';

type AdviceId='E10'|'E11'|'E12'|'E14'|'E15'|'E16'|'E17'|'E18'|'E19'|'E20'|'E26';
export interface CareerPositionPlan {
 planId:string;version:number;sourceEventKey:string;startReceipt:string;fromPosition:string;targetPosition:string;
 startedSeasonKey:string;startedWorldDay:number;status:'TRAINING'|'READY'|'CONFIRMED'|'CANCELLED';
 games:readonly {gameKey:string;seasonKey:string;worldDay:number}[];completionReceipt:string|null;resolutionReceipt:string|null;
}
export interface CareerRoleReview {receiptKey:string;eventKey:string;seasonKey:string;targetRole:'SP'|'CP';candidateScore:number;comparedPlayerKey:string|null;comparedScore:number|null;outcome:'ROLE_CHANGED'|'OTHER_CANDIDATE';effectiveAfterDay:number}
export interface CareerRestRequest {receiptKey:string;eventKey:string;seasonKey:string;requestedAfterDay:number;status:'PENDING'|'COMPLETED';skippedGameKey:string|null}
export interface CareerUsageReview {receiptKey:string;eventKey:string;seasonKey:string;position:string;candidateScore:number;rank:number;competitors:readonly {playerKey:string;score:number}[];appearanceGuaranteed:false}
export interface CareerPreseasonFitPlan {planId:string;seasonKey:string;fromPosition:string;targetPosition:FieldPosition;sourceRevision:number}
export interface CareerPositionAppearance {gameKey:string;seasonKey:string;worldDay:number;teamKey:string;position:FieldPosition;inputFielders:readonly {simulationKey:string;position:FieldPosition;fit:number}[]}
export interface CareerPositionFitSettlement {receiptKey:string;seasonKey:string;planId:string;targetPosition:FieldPosition;games:number;before:number;after:number;actualGain:number;sourceGameKeys:readonly string[]}
export interface CareerAdviceLedger {
 schemaVersion:1;worldKey:string;playerKey:string;rng:RngState;
 checkpoints:readonly {seasonKey:string;teamGames:number;worldDay:number;candidateIds:readonly AdviceId[];selectedId:AdviceId|null}[];
 notices:readonly EventInstance[];positionPlans:readonly CareerPositionPlan[];positionFits:Record<FieldPosition,number>|null;
 roleReviews:readonly CareerRoleReview[];restRequests:readonly CareerRestRequest[];usageReviews?:readonly CareerUsageReview[];
 preseasonFitPlans?:readonly CareerPreseasonFitPlan[];positionAppearances?:readonly CareerPositionAppearance[];fitSettlements?:readonly CareerPositionFitSettlement[];
}
export type AdviceCareer=(KboCareer|UsCareer)&{advice?:CareerAdviceLedger;adviceMorale?:number};
const isUs=(c:AdviceCareer):c is UsCareer=>'mode'in c&&c.mode==='US_CAREER';
function registration(c:AdviceCareer):{key:string;team:string;league:string;roster:readonly string[];active:boolean;sp:number;cp:number}{
 if(isUs(c)){const org=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!;return {key:c.protagonistKey,team:org.id,league:c.registration.level,roster:org.levels[c.registration.level],active:c.registration.status==='ACTIVE',sp:c.registration.level==='MLB'?5:4,cp:2};}
 const club=c.world.clubs.find(o=>o.id===c.protagonistClubId)!,sports=c.sangmu?.loaned?.includes(c.protagonistKey);
 return {key:c.protagonistKey,team:club.id,league:c.registration.firstTeam?'KBO':'FUTURES',roster:c.registration.firstTeam?club.firstTeam:club.roster.filter(k=>!club.firstTeam.includes(k)&&!kboActiveContractSuspended(c.world.contracts[k]!)),active:!sports&&!kboActiveContractSuspended(c.world.contracts[c.protagonistKey]!),sp:c.registration.firstTeam?5:3,cp:2};
}
function assertRevision(c:AdviceCareer,revision:number){if(isUs(c))assertUsCareerRevision(c,revision);else assertKboCareerRevision(c,revision);}
function empty(c:AdviceCareer):CareerAdviceLedger{return {schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,rng:createStreams(c.world.seed,JSON.stringify(['career-advice-1',c.world.worldKey,c.protagonistKey])).event,checkpoints:[],notices:[],positionPlans:[],positionFits:null,roleReviews:[],restRequests:[]};}
function validate(c:AdviceCareer){
 if(c.adviceMorale!==undefined&&(!Number.isFinite(c.adviceMorale)||c.adviceMorale<0||c.adviceMorale>100))throw new RangeError('INVALID_ADVICE_MORALE');
 const l=c.advice;if(!l)return;validateRng(l.rng);
 if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==c.protagonistKey||!Array.isArray(l.checkpoints)||!Array.isArray(l.notices)||!Array.isArray(l.positionPlans)||!Array.isArray(l.roleReviews)||!Array.isArray(l.restRequests)||new Set(l.checkpoints.map(x=>JSON.stringify([x.seasonKey,x.teamGames]))).size!==l.checkpoints.length||new Set(l.notices.map(e=>e.eventKey)).size!==l.notices.length||new Set(l.positionPlans.map(p=>p.planId)).size!==l.positionPlans.length||l.positionPlans.filter(p=>['TRAINING','READY'].includes(p.status)).length>1)throw new RangeError('INVALID_CAREER_ADVICE');
 for(const e of l.notices){validateEvent(e);if(!['E10','E11','E12','E13','E14','E15','E16','E17','E18','E19','E20','E26'].includes(e.definitionId)||e.worldKey!==l.worldKey||e.resume.sourceRevision>c.revision)throw new RangeError('INVALID_CAREER_ADVICE_EVENT');if(e.definitionId==='E13'?!l.positionPlans.some(p=>p.planId===e.evidence.fields.positionPlanId&&p.completionReceipt===e.evidence.fields.completionReceiptId):e.evidence.fields.playerSimulationKey!==l.playerKey||e.definitionId!=='E10'&&e.evidence.fields.worldSeasonId!==e.seasonKey)throw new RangeError('INVALID_CAREER_ADVICE_EVENT');}
 for(const x of l.checkpoints)if(!x.seasonKey||!Number.isSafeInteger(x.teamGames)||x.teamGames<24||x.teamGames%24!==0||!Number.isSafeInteger(x.worldDay)||x.worldDay<0||!Array.isArray(x.candidateIds)||x.selectedId!==null&&!x.candidateIds.includes(x.selectedId))throw new RangeError('INVALID_ADVICE_CHECKPOINT');
 for(const p of l.positionPlans){if(!p.planId||!p.sourceEventKey||!p.startReceipt||!Number.isSafeInteger(p.version)||p.version<1||!['TRAINING','READY','CONFIRMED','CANCELLED'].includes(p.status)||!Number.isSafeInteger(p.startedWorldDay)||p.startedWorldDay<0||!p.startedSeasonKey||!Array.isArray(p.games)||p.games.length>24||new Set(p.games.map((g:CareerPositionPlan['games'][number])=>g.gameKey)).size!==p.games.length||(['READY','CONFIRMED','CANCELLED'].includes(p.status)&&!p.completionReceipt)||(['CONFIRMED','CANCELLED'].includes(p.status)&&!p.resolutionReceipt)||p.status==='TRAINING'&&p.games.length>=24)throw new RangeError('INVALID_POSITION_PLAN');const player=c.world.players[c.protagonistKey]!;validateDevelopmentPlayer({...player,position:p.targetPosition});if(player.kind!=='HITTER'||p.targetPosition===p.fromPosition)throw new RangeError('INVALID_POSITION_PLAN');}
 if(l.positionFits&&(Object.keys(l.positionFits).length!==8||FIELD_POSITIONS.some(p=>!Number.isFinite(l.positionFits![p])||l.positionFits![p]<0||l.positionFits![p]>100)))throw new RangeError('INVALID_CAREER_POSITION_FITS');
 for(const r of l.roleReviews)if(!r.receiptKey||!r.eventKey||!r.seasonKey||!['SP','CP'].includes(r.targetRole)||!Number.isFinite(r.candidateScore)||r.comparedScore!==null&&!Number.isFinite(r.comparedScore)||(r.comparedPlayerKey===null)!==(r.comparedScore===null)||!['ROLE_CHANGED','OTHER_CANDIDATE'].includes(r.outcome)||!Number.isSafeInteger(r.effectiveAfterDay)||r.effectiveAfterDay<0)throw new RangeError('INVALID_ROLE_REVIEW');
 if(new Set(l.roleReviews.map(r=>r.eventKey)).size!==l.roleReviews.length||new Set(l.restRequests.map(r=>r.eventKey)).size!==l.restRequests.length||l.restRequests.filter(r=>r.status==='PENDING').length>1)throw new RangeError('DUPLICATE_CAREER_ADVICE_RECEIPT');
 for(const r of l.usageReviews??[])if(!r.receiptKey||!r.eventKey||!r.seasonKey||r.appearanceGuaranteed!==false||!Number.isFinite(r.candidateScore)||!Number.isSafeInteger(r.rank)||r.rank<1||r.rank>r.competitors.length||r.competitors.some(x=>!x.playerKey||!Number.isFinite(x.score))||r.competitors[r.rank-1]?.playerKey!==c.protagonistKey)throw new RangeError('INVALID_USAGE_REVIEW');
 for(const r of l.restRequests)if(!r.receiptKey||!r.eventKey||!r.seasonKey||!Number.isSafeInteger(r.requestedAfterDay)||r.requestedAfterDay<0||!['PENDING','COMPLETED'].includes(r.status)||(r.status==='COMPLETED')!==(r.skippedGameKey!==null))throw new RangeError('INVALID_CAREER_REST');
 for(const p of l.preseasonFitPlans??[])if(!p.planId||!p.seasonKey||!FIELD_POSITIONS.includes(p.targetPosition)||p.fromPosition===p.targetPosition||!Number.isSafeInteger(p.sourceRevision)||p.sourceRevision<0||p.sourceRevision>c.revision)throw new RangeError('INVALID_PRESEASON_FIT_PLAN');
 if(new Set((l.preseasonFitPlans??[]).map(p=>p.seasonKey)).size!==(l.preseasonFitPlans??[]).length||new Set((l.positionAppearances??[]).map(p=>p.gameKey)).size!==(l.positionAppearances??[]).length||new Set((l.fitSettlements??[]).map(p=>p.planId)).size!==(l.fitSettlements??[]).length)throw new RangeError('DUPLICATE_POSITION_FIT_EVIDENCE');
 for(const a of l.positionAppearances??[])if(!a.gameKey||!a.seasonKey||!a.teamKey||!Number.isSafeInteger(a.worldDay)||a.worldDay<0||!FIELD_POSITIONS.includes(a.position)||a.inputFielders.length!==8||new Set(a.inputFielders.map(f=>f.position)).size!==8||new Set(a.inputFielders.map(f=>f.simulationKey)).size!==8||a.inputFielders.some(f=>!FIELD_POSITIONS.includes(f.position)||!f.simulationKey||!Number.isFinite(f.fit)||f.fit<0||f.fit>100)||!a.inputFielders.some(f=>f.simulationKey===l.playerKey&&f.position===a.position))throw new RangeError('INVALID_POSITION_APPEARANCE');
 for(const s of l.fitSettlements??[])if(!s.receiptKey||!s.seasonKey||!l.preseasonFitPlans?.some(p=>p.planId===s.planId&&p.seasonKey===s.seasonKey&&p.targetPosition===s.targetPosition)||s.games!==s.sourceGameKeys.length||new Set(s.sourceGameKeys).size!==s.games||s.sourceGameKeys.some(key=>!l.positionAppearances?.some(a=>a.gameKey===key&&a.seasonKey===s.seasonKey&&a.position===s.targetPosition))||!Number.isFinite(s.before)||s.before<0||s.before>100||s.after!==Math.min(100,s.before+(s.games>=30?10:3))||s.actualGain!==s.after-s.before)throw new RangeError('INVALID_POSITION_FIT_SETTLEMENT');
}
function registeredGames(c:AdviceCareer):GameContribution[]{
 const key=c.protagonistKey,entries=c.health.games.filter(h=>h.evidence.seasonKey===c.world.seasonKey&&h.evidence.roster.includes(key));
 return entries.map(h=>c.records.games[h.evidence.gameKey]).filter((g):g is GameContribution=>!!g&&g.scope.phase==='REGULAR'&&['KBO','FUTURES','ROOKIE','A','AA','AAA','MLB'].includes(g.scope.leagueKey)).sort((a,b)=>a.worldDay-b.worldDay||(a.gameKey<b.gameKey?-1:1));
}
function currentGames(c:AdviceCareer):GameContribution[]{const r=registration(c);return registeredGames(c).filter(g=>g.scope.leagueKey===r.league&&Object.hasOwn(g.teams,r.team));}
function totals(c:AdviceCareer,games:readonly GameContribution[]){return recordTotals({...c.records,games:Object.fromEntries(games.map(g=>[g.gameKey,g]))},{leagueKey:registration(c).league,phase:'REGULAR',seasonKey:c.world.seasonKey});}
function performance(c:AdviceCareer,key:string,games:readonly GameContribution[]){const p=c.world.players[key]!,t=totals(c,games);return p.kind==='HITTER'?recentBattingPerformance(t.batting[key]??emptyBatting()):recentPitchingPerformance(t.pitching[key]??emptyPitching());}
function competition(c:AdviceCareer,key:string,position=c.world.players[key]!.position){const p=c.world.players[key]!;return .8*roleScore(p.kind,p.abilities,position)+.2*performance(c,key,currentGames(c).slice(-20));}
function eligibleTargets(c:AdviceCareer){const p=c.world.players[c.protagonistKey]!;return [...FIELD_POSITIONS,'DH'].filter(position=>position!==p.position&&!(p.throws==='L'&&['C','2B','3B','SS'].includes(position)));}
function roleEligible(c:AdviceCareer,role:'SP'|'CP'){
 const r=registration(c),p=c.world.players[r.key]!,healthy=r.roster.filter(k=>!Object.hasOwn(c.health.injuries,k));
 return r.active&&p.kind==='PITCHER'&&p.position==='RP'&&!Object.hasOwn(c.health.injuries,r.key)&&p.abilities[role==='SP'?'STAMINA':'COMPOSURE']!>=600_000&&healthy.filter(k=>c.world.players[k]!.position===role).length<(role==='SP'?r.sp:r.cp);
}
function candidates(c:AdviceCareer):AdviceId[]{
 const r=registration(c),p=c.world.players[r.key]!,games=currentGames(c),recent=games.slice(-20),t=totals(c,games),bat=t.batting[r.key],pitch=t.pitching[r.key],ids:AdviceId[]=[];
 if(!r.active||Object.hasOwn(c.health.injuries,r.key))return ids;
 if(!isUs(c)){
  const first=c.events.find(e=>e.definitionId==='E09'&&e.status==='RESOLVED'&&e.resolution?.command==='ACCEPT_CALLUP');
  if(first&&!c.advice?.notices.some(e=>e.definitionId==='E10'&&e.status!=='OPEN')){const after=c.health.games.filter(h=>h.evidence.roster.includes(r.key)&&(Number(h.evidence.seasonKey)>Number(first.seasonKey)||h.evidence.seasonKey===first.seasonKey&&h.evidence.day>first.occurredWorldDay)).filter(h=>c.records.games[h.evidence.gameKey]?.scope.leagueKey==='KBO');if(after.length>=20)ids.push('E10');}
  const previous=c.proSeasons?.at(-1),season=previous?.seasonKey;
  if(previous&&season&&Number(season)===Number(c.world.seasonKey)-1){const team=Object.values(c.records.games).filter(g=>g.scope.seasonKey===season&&g.scope.phase==='REGULAR'&&g.scope.leagueKey==='FUTURES'&&Object.hasOwn(g.teams,r.team)),registered=new Set(c.health.games.filter(h=>h.evidence.seasonKey===season&&h.evidence.roster.includes(r.key)).map(h=>h.evidence.gameKey));if(team.length>0&&team.every(g=>registered.has(g.gameKey))&&!Object.values(c.records.games).some(g=>registered.has(g.gameKey)&&g.scope.leagueKey==='KBO'))ids.push('E11');}
 }
 if(p.kind==='HITTER'){
  if((isUs(c)?r.league==='MLB':r.league==='KBO')&&recent.length===20&&recent.filter(g=>Object.hasOwn(g.batting,r.key)).length/20<.4&&eligibleTargets(c).length&&!(c.advice?.positionPlans??[]).some(p=>['TRAINING','READY'].includes(p.status)))ids.push('E12');
  // Aggregate official rows can prove a hitless suffix; no invented PA order inside a game.
  let ab=0,h=0;for(const g of [...games].reverse()){ab+=g.batting[r.key]?.AB??0;h+=g.batting[r.key]?.H??0;if(ab>=20)break;}if(ab>=20&&h===0)ids.push('E17');
  if(bat&&bat.AB>=100&&bat.HR<=1)ids.push('E18');
 }else{
  if(roleEligible(c,'SP'))ids.push('E14');if(roleEligible(c,'CP'))ids.push('E15');
  if(pitch&&pitch.outs>=60&&pitch.BB*27/pitch.outs>4.5)ids.push('E16');
  const last=games.filter(g=>(g.pitching[r.key]?.starts??0)>0).slice(-2);if(p.position==='SP'&&last.length===2&&last.reduce((n,g)=>n+g.pitching[r.key]!.ER,0)>=10&&!(c.advice?.restRequests??[]).some(x=>x.status==='PENDING'))ids.push('E19');
 }
 if(recent.length===20&&performance(c,r.key,recent)<=40)ids.push('E20');
 const competitors=r.roster.filter(k=>k!==r.key&&!Object.hasOwn(c.health.injuries,k)&&c.world.players[k]!.kind===p.kind&&c.world.players[k]!.position===p.position).map(k=>competition(c,k));
 if(competitors.length&&Math.abs(Math.max(...competitors)-competition(c,r.key))<=5)ids.push('E26');
 return ids;
}
function queue(c:AdviceCareer,l:CareerAdviceLedger,id:AdviceId|'E13',fields:Record<string,string>,day:number){const r=registration(c),d=eventDefinition(id),evidenceFields=id==='E10'?{playerSimulationKey:r.key,milestoneKey:JSON.stringify(['first-callup-coaching-review',c.events.find(e=>e.definitionId==='E09'&&e.resolution?.command==='ACCEPT_CALLUP')!.eventKey])}:fields,event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:evidenceFields},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:r.league,registrationKey:r.team,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:day});if(!l.notices.some(e=>e.eventKey===event.eventKey))l.notices=[...l.notices,event];}
function observePlans(c:AdviceCareer,l:CareerAdviceLedger,day:number){
 const key=c.protagonistKey,healthy=new Map<string,boolean>();let injured=Object.hasOwn(c.health.injuries,key);
 const health=c.health.games.filter(h=>h.evidence.roster.includes(key)).sort((a,b)=>Number(b.evidence.seasonKey)-Number(a.evidence.seasonKey)||b.evidence.day-a.evidence.day);
 for(const h of health){if(h.result.injured.includes(key))injured=false;if(h.result.recovered.includes(key))injured=true;healthy.set(h.evidence.gameKey,!injured);}
 l.positionPlans=l.positionPlans.map(source=>{
  if(source.status!=='TRAINING')return source;const p=structuredClone(source),seen=new Set(p.games.map(g=>g.gameKey));
  const games=health.map(h=>c.records.games[h.evidence.gameKey]).filter((g):g is GameContribution=>!!g&&g.scope.phase==='REGULAR'&&healthy.get(g.gameKey)===true&&(Number(g.scope.seasonKey)>Number(p.startedSeasonKey)||g.scope.seasonKey===p.startedSeasonKey&&g.worldDay>p.startedWorldDay)).sort((a,b)=>Number(a.scope.seasonKey)-Number(b.scope.seasonKey)||a.worldDay-b.worldDay);
  for(const g of games)if(!seen.has(g.gameKey)&&p.games.length<24){p.games=[...p.games,{gameKey:g.gameKey,seasonKey:g.scope.seasonKey,worldDay:g.worldDay}];seen.add(g.gameKey);}
  if(p.games.length===24){p.status='READY';p.version++;p.completionReceipt=JSON.stringify(['position-plan-ready',p.planId,p.games.map(g=>g.gameKey)]);queue(c,l,'E13',{positionPlanId:p.planId,completionReceiptId:p.completionReceipt},day);}
  return p;
 });
}
/** SERVER ONLY: after health/official records close, before the next lineup; caller owns the revision. */
export function refreshProCareerAdvice<T extends AdviceCareer>(c:T,day:number):T {
 validate(c);if(c.phaseContext.phase!=='SEASON_PROGRESS'||c.phaseContext.pendingGame)return c;
 const r=registration(c);if(!Number.isSafeInteger(day)||day<0||!c.health.games.some(h=>h.evidence.seasonKey===c.world.seasonKey&&h.evidence.day===day))throw new RangeError('ADVICE_DAY_NOT_CLOSED');
 const l=structuredClone(c.advice??empty(c));observePlans(c,l,day);
 const games=registeredGames(c),count=games.length;
 if(r.active&&count>0&&count%24===0&&!l.checkpoints.some(x=>x.seasonKey===c.world.seasonKey&&x.teamGames===count)){
  const recent=l.notices.filter(e=>e.definitionId!=='E13'&&Number(c.world.seasonKey)-Number(e.seasonKey)<=2),used=l.notices.filter(e=>e.definitionId!=='E13'&&e.seasonKey===c.world.seasonKey).length;
  const ids=used>=3?[]:candidates({...c,advice:l}).filter(id=>!recent.some(e=>e.definitionId===id));let selected:AdviceId|null=null;
  if(ids.length){const chance=nextFloat(l.rng);l.rng=chance.state;if(chance.value<.35){const pick=nextInteger(l.rng,ids.length);l.rng=pick.state;selected=ids[pick.value]!;queue(c,l,selected,{playerSimulationKey:r.key,worldSeasonId:c.world.seasonKey,adviceWindowId:JSON.stringify(['career-advice-window',c.world.seasonKey,r.key,count])},day);}}
  l.checkpoints=[...l.checkpoints,{seasonKey:c.world.seasonKey,teamGames:count,worldDay:day,candidateIds:ids,selectedId:selected}];
 }
 if(canonicalJson(l)===canonicalJson(c.advice??empty(c)))return c;return {...c,advice:l};
}
function idle(c:AdviceCareer){if(c.phaseContext.phase!=='SEASON_PROGRESS'||c.phaseContext.pendingGame)throw new RangeError('INVALID_ADVICE_PHASE');}
function nextDay(c:AdviceCareer){const phase=c.phaseContext;if(phase.phase!=='SEASON_PROGRESS'||phase.pendingGame)throw new RangeError('INVALID_ADVICE_PHASE');return phase.nextWorldDay;}
function sourceEvent(c:AdviceCareer,key:string){const event=c.advice?.notices.find(e=>e.eventKey===key);if(!event)throw new RangeError('ADVICE_EVENT_NOT_FOUND');return event;}
function changeFocus<T extends AdviceCareer>(c:T,focus:readonly string[]):T {
 const p=c.world.players[c.protagonistKey]!;assertFocus(p.kind,focus);const next=structuredClone(c);next.world.players[c.protagonistKey]!.focus=[...focus];
 const count=currentGames(c).length;next.planHistory=[...next.planHistory,{completedTeamGames:count,focus:[...focus],archetype:p.archetype}];
 if(isUs(next)&&next.season&&next.phaseContext.phase==='SEASON_PROGRESS')next.season.planChanges=[...(next.season.planChanges??[]),{effectiveDay:next.phaseContext.nextWorldDay,focus:[...focus],archetype:p.archetype}];return next;
}
/** E12 starts training; its start game is never counted. E13 confirms only a READY, latest-version plan. */
export function resolveProCareerAdviceEvent<T extends AdviceCareer>(c:T,revision:number,input:{eventKey:string;eventVersion:number;command:string;targetPosition?:string;planVersion?:number;focus?:readonly string[]}) {
 assertRevision(c,revision);validate(c);idle(c);const event=sourceEvent(c,input.eventKey),r=registration(c),current=event.seasonKey===c.world.seasonKey&&event.resume.competitionKey===r.league&&event.resume.registrationKey===r.team?candidates(c):[],id=event.definitionId;
 const d=eventDefinition(id),commands=d.choices.filter(x=>x.dispatchClass!=='DOMAIN'||id==='E13'||current.includes(id as AdviceId)).map(x=>x.command),context={worldKey:c.world.worldKey,seasonKey:event.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:commands},chosen=resolveEventChoice(event,input.eventVersion,input.command,input,context);
 let next=structuredClone(c),l=next.advice!;
 if(chosen.domain){
  if(input.command==='REQUEST_ROLE_REVIEW'){
   const p=c.world.players[r.key]!,ranked=r.roster.filter(k=>!Object.hasOwn(c.health.injuries,k)&&c.world.players[k]!.kind===p.kind&&c.world.players[k]!.position===p.position).map(playerKey=>({playerKey,score:competition(c,playerKey)})).sort((a,b)=>b.score-a.score||c.world.players[a.playerKey]!.fatigue-c.world.players[b.playerKey]!.fatigue||a.playerKey.localeCompare(b.playerKey));
   const rank=ranked.findIndex(x=>x.playerKey===r.key)+1;if(!rank)throw new RangeError('USAGE_REVIEW_NOT_REGISTERED');l.usageReviews=[...(l.usageReviews??[]),{receiptKey:JSON.stringify(['first-callup-role-review',event.eventKey,revision+1]),eventKey:event.eventKey,seasonKey:c.world.seasonKey,position:p.position,candidateScore:competition(c,r.key),rank,competitors:ranked,appearanceGuaranteed:false}];
  }else if(input.command==='START_POSITION_PLAN'){
   if(!input.targetPosition||!eligibleTargets(c).includes(input.targetPosition)||l.positionPlans.some(p=>['TRAINING','READY'].includes(p.status)))throw new RangeError('POSITION_PLAN_NOT_ELIGIBLE');
   const player=c.world.players[r.key]!,planId=JSON.stringify(['position-plan',event.eventKey]),startReceipt=JSON.stringify(['position-plan-start',planId,revision+1]);
   l.positionFits??=initialPositionFits(player.position);l.positionPlans=[...l.positionPlans,{planId,version:1,sourceEventKey:event.eventKey,startReceipt,fromPosition:player.position,targetPosition:input.targetPosition,startedSeasonKey:c.world.seasonKey,startedWorldDay:Math.max(event.occurredWorldDay,...registeredGames(c).map(g=>g.worldDay)),status:'TRAINING',games:[],completionReceipt:null,resolutionReceipt:null}];
  }else if(input.command==='CONFIRM_POSITION'||input.command==='CANCEL_POSITION_PLAN'){
   const plan=l.positionPlans.find(p=>p.planId===event.evidence.fields.positionPlanId);if(!plan||plan.status!=='READY'||plan.version!==input.planVersion||plan.completionReceipt!==event.evidence.fields.completionReceiptId)throw new RangeError('POSITION_PLAN_VERSION_CHANGED');
   if(input.command==='CONFIRM_POSITION'){
    if(!r.active||!r.roster.includes(r.key)||Object.hasOwn(c.health.injuries,r.key)||c.world.players[r.key]!.position!==plan.fromPosition||!eligibleTargets(c).includes(plan.targetPosition))throw new RangeError('POSITION_PLAN_CONFIRMATION_UNAVAILABLE');
    next.world.players[r.key]!.position=plan.targetPosition;validateDevelopmentPlayer(next.world.players[r.key]!);plan.status='CONFIRMED';
   }else plan.status='CANCELLED';plan.version++;plan.resolutionReceipt=JSON.stringify(['position-plan-resolution',plan.planId,input.command,revision+1]);
  }else if(input.command==='REQUEST_SP_REVIEW'||input.command==='REQUEST_CP_REVIEW'){
   const role=input.command==='REQUEST_SP_REVIEW'?'SP':'CP';if(!roleEligible(c,role))throw new RangeError('ROLE_REVIEW_NOT_ELIGIBLE');
   const compare=r.roster.filter(k=>k!==r.key&&!Object.hasOwn(c.health.injuries,k)&&c.world.players[k]!.kind==='PITCHER'&&c.world.players[k]!.position==='RP'&&c.world.players[k]!.abilities[role==='SP'?'STAMINA':'COMPOSURE']!>=600_000).sort((a,b)=>competition(c,b,role)-competition(c,a,role)||c.world.players[a]!.fatigue-c.world.players[b]!.fatigue||(a<b?-1:1))[0]??null;
   const own=competition(c,r.key,role),other=compare?competition(c,compare,role):null,wins=other===null||own>other||own===other&&(c.world.players[r.key]!.fatigue<c.world.players[compare!]!.fatigue||c.world.players[r.key]!.fatigue===c.world.players[compare!]!.fatigue&&r.key<compare!);
   if(wins)next.world.players[r.key]!.position=role;
   l.roleReviews=[...l.roleReviews,{receiptKey:JSON.stringify(['career-role-review',event.eventKey,revision+1]),eventKey:event.eventKey,seasonKey:c.world.seasonKey,targetRole:role,candidateScore:own,comparedPlayerKey:compare,comparedScore:other,outcome:wins?'ROLE_CHANGED':'OTHER_CANDIDATE',effectiveAfterDay:nextDay(c)-1}];
  }else if(input.command==='CHOOSE_FOCUS'){
   if(!input.focus||id==='E16'&&!input.focus.includes('CONTROL'))throw new RangeError('FOCUS_SELECTION_REQUIRED');next=changeFocus(next,input.focus);l=next.advice!;
  }else if(input.command==='REQUEST_REST'){
   if(l.restRequests.some(x=>x.status==='PENDING'))throw new RangeError('REST_ALREADY_PENDING');l.restRequests=[...l.restRequests,{receiptKey:JSON.stringify(['career-rest',event.eventKey,revision+1]),eventKey:event.eventKey,seasonKey:c.world.seasonKey,requestedAfterDay:nextDay(c)-1,status:'PENDING',skippedGameKey:null}];
  }else throw new RangeError('UNSUPPORTED_ADVICE_COMMAND');
 }else if(input.targetPosition!==undefined||input.planVersion!==undefined||input.focus!==undefined)throw new RangeError('UNEXPECTED_ADVICE_SELECTION');
 const resolved=chosen.domain?completeEventDomain(event,chosen.domain,JSON.stringify(['career-advice-choice',event.eventKey,revision+1]),context):chosen.event;
 l.notices=l.notices.map(e=>e.eventKey===event.eventKey?resolved:e);return {career:{...next,revision:revision+1,advice:l} as T,navigation:chosen.navigation};
}
/** Snapshot owner calls this after its normal rotation selection. A rest never forces another injured starter. */
export function careerAdviceStarter(c:AdviceCareer,selected:string,pool:readonly string[]):string {
 validate(c);const pending=c.advice?.restRequests.some(r=>r.status==='PENDING'&&r.seasonKey===c.world.seasonKey);if(!pending||selected!==c.protagonistKey)return selected;
 const r=registration(c);return pool.filter(k=>k!==c.protagonistKey&&r.roster.includes(k)&&c.world.players[k]?.kind==='PITCHER'&&!Object.hasOwn(c.health.injuries,k)).sort((a,b)=>c.world.players[a]!.fatigue-c.world.players[b]!.fatigue||(a<b?-1:1))[0]??selected;
}
export interface CareerAdviceRestProof {ordinaryStarter:string;actualStarter:string}
/** Apply after the agent's ordinary review, freeze the proof into pendingGame, settle only on FINAL. */
export function prepareCareerAdviceGame(c:AdviceCareer,world:CompetitionGameWorld,scheduled:ScheduledGame,context:HighSchoolGameContext):{context:HighSchoolGameContext;restProof?:CareerAdviceRestProof} {
 validate(c);const r=registration(c),team=world.schools.find(t=>t.id===r.team&&t.roster.includes(c.protagonistKey));
 if(!team||!r.active||scheduled.phase==='POSTSEASON'||scheduled.seasonKey!==c.world.seasonKey||scheduled.leagueKey!==r.league||![scheduled.homeTeamKey,scheduled.awayTeamKey].includes(team.id)||!c.advice?.restRequests.some(x=>x.status==='PENDING'&&x.seasonKey===scheduled.seasonKey&&x.requestedAfterDay<scheduled.worldDay))return {context};
 const ordinaryStarter=context.starters[team.id];if(ordinaryStarter!==c.protagonistKey)return {context};
 const pool=team.roster.filter(k=>world.players[k]?.kind==='PITCHER'&&!context.unavailableKeys.includes(k)),actualStarter=careerAdviceStarter(c,ordinaryStarter,pool);
 if(actualStarter===ordinaryStarter)return {context};
 return {context:{...context,starters:{...context.starters,[team.id]:actualStarter}},restProof:{ordinaryStarter,actualStarter}};
}
/** SERVER ONLY: commit together with the FINAL game whose ordinary starter was replaced by the rest plan. */
export function settleCareerAdviceRest<T extends AdviceCareer>(c:T,gameKey:string,ordinaryStarter:string,actualStarter:string):T {
 validate(c);if(ordinaryStarter!==c.protagonistKey||actualStarter===ordinaryStarter)return c;const row=c.records.games[gameKey];if(!row||row.scope.phase!=='REGULAR'||row.scope.seasonKey!==c.world.seasonKey||row.pitching[c.protagonistKey]||!row.pitching[actualStarter]?.starts)throw new RangeError('REST_GAME_NOT_FINAL');
 const pending=c.advice?.restRequests.find(r=>r.status==='PENDING'&&r.seasonKey===row.scope.seasonKey&&r.requestedAfterDay<row.worldDay);if(!pending)return c;
 return {...c,advice:{...c.advice!,restRequests:c.advice!.restRequests.map(r=>r.receiptKey===pending.receiptKey?{...r,status:'COMPLETED' as const,skippedGameKey:gameKey}:r)}};
}
export function careerPositionFits(c:AdviceCareer):Readonly<Record<string,Readonly<Record<FieldPosition,number>>>> {validate(c);return c.advice?.positionFits?{[c.protagonistKey]:{...c.advice.positionFits}}:{};}
/** Explicit PRE training plan; this does not start E12's midseason24-game registration plan. */
export function beginProPreseasonPositionFitPlan<T extends AdviceCareer>(c:T,revision:number,targetPosition:FieldPosition):T {
 assertRevision(c,revision);validate(c);const p=c.world.players[c.protagonistKey]!;
 if(c.phaseContext.phase!=='PRESEASON_SETUP'||c.preseasonPlan||p.kind!=='HITTER'||!FIELD_POSITIONS.includes(targetPosition)||!eligibleTargets(c).includes(targetPosition)||Object.values(c.records.games).some(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='REGULAR'))throw new RangeError('PRESEASON_POSITION_PLAN_CLOSED');
 const l=structuredClone(c.advice??empty(c));if(l.preseasonFitPlans?.some(p=>p.seasonKey===c.world.seasonKey))throw new RangeError('PRESEASON_POSITION_PLAN_USED');
 l.positionFits??=initialPositionFits(p.position);l.preseasonFitPlans=[...(l.preseasonFitPlans??[]),{planId:JSON.stringify(['preseason-position-fit',c.world.worldKey,c.protagonistKey,c.world.seasonKey,targetPosition]),seasonKey:c.world.seasonKey,fromPosition:p.position,targetPosition,sourceRevision:revision}];return {...c,revision:revision+1,advice:l};
}
/** SERVER ONLY: caller supplies the immutable input of a game already committed FINAL in records. */
export function observeProCareerPositionAppearance<T extends AdviceCareer>(c:T,gameKey:string,input:GameInput):T {
 validate(c);const row=c.records.games[gameKey];if(!row||row.scope.phase!=='REGULAR'||row.scope.seasonKey!==c.world.seasonKey||input.simulationKey!==gameKey||input.competition!=='REGULAR')throw new RangeError('POSITION_GAME_NOT_FINAL');
 const team=input.teams.find(t=>t.fielders.some(f=>f.simulationKey===c.protagonistKey));if(!team)return c;
 if(!Object.hasOwn(row.teams,team.simulationKey)||!row.batting[c.protagonistKey]?.fieldingGames)throw new RangeError('POSITION_GAME_SOURCE_CHANGED');
 // Legacy inputs can lack explicit slots; array order is not accepted as invented positional evidence.
 const fielders=team.fielders as readonly {simulationKey:string;fit:number;position?:FieldPosition}[];if(fielders.some(f=>f.position===undefined))return c;
 const inputFielders=fielders.map(f=>({simulationKey:f.simulationKey,position:f.position!,fit:f.fit})),position=inputFielders.find(f=>f.simulationKey===c.protagonistKey)!.position;
 const l=structuredClone(c.advice??empty(c)),appearance:CareerPositionAppearance={gameKey,seasonKey:row.scope.seasonKey,worldDay:row.worldDay,teamKey:team.simulationKey,position,inputFielders},old=l.positionAppearances?.find(a=>a.gameKey===gameKey);
 if(old){if(canonicalJson(old)!==canonicalJson(appearance))throw new RangeError('POSITION_EVIDENCE_REUSED');return c;}
 l.positionAppearances=[...(l.positionAppearances??[]),appearance];const next={...c,advice:l};validate(next);return next;
}
/** SERVER ONLY: once the season is closed to games, pay only that year's PRE plan from exact slot evidence. */
export function settleProCareerPositionFits<T extends AdviceCareer>(c:T,seasonKey=c.world.seasonKey):T {
 validate(c);if(c.phaseContext.phase!=='SEASON_REVIEW'||seasonKey!==c.world.seasonKey)throw new RangeError('POSITION_FIT_SEASON_NOT_CLOSED');
 const plan=c.advice?.preseasonFitPlans?.find(p=>p.seasonKey===seasonKey);if(!plan||c.advice?.fitSettlements?.some(s=>s.planId===plan.planId))return c;
 const l=structuredClone(c.advice!),sourceGameKeys=(l.positionAppearances??[]).filter(a=>a.seasonKey===seasonKey&&a.position===plan.targetPosition).map(a=>a.gameKey).sort(),before=l.positionFits![plan.targetPosition],after=Math.min(100,before+(sourceGameKeys.length>=30?10:3));
 l.positionFits![plan.targetPosition]=after;l.fitSettlements=[...(l.fitSettlements??[]),{receiptKey:JSON.stringify(['position-fit-year',plan.planId]),seasonKey,planId:plan.planId,targetPosition:plan.targetPosition,games:sourceGameKeys.length,before,after,actualGain:after-before,sourceGameKeys}];return {...c,advice:l};
}
export function proCareerAdviceView(c:AdviceCareer){
 validate(c);const r=registration(c),eligible=candidates(c);
 return {teamGames:registeredGames(c).length,nextCheckpoint:(Math.floor(registeredGames(c).length/24)+1)*24,position:c.world.players[r.key]!.position,positionFits:c.advice?.positionFits?{...c.advice.positionFits}:null,targetPositions:c.world.players[r.key]!.kind==='HITTER'?eligibleTargets(c):[],plans:(c.advice?.positionPlans??[]).map(p=>({planId:p.planId,version:p.version,targetPosition:p.targetPosition,status:p.status,completedGames:p.games.length,requiredGames:24,canConfirm:p.status==='READY'&&r.active&&!Object.hasOwn(c.health.injuries,r.key)&&c.world.players[r.key]!.position===p.fromPosition})),roleReviews:(c.advice?.roleReviews??[]).map(r=>({...r})),usageReviews:structuredClone(c.advice?.usageReviews??[]),restPending:!!c.advice?.restRequests.some(r=>r.status==='PENDING'),notices:(c.advice?.notices??[]).filter(e=>e.status==='OPEN').map(e=>({eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:eventDefinition(e.definitionId).title,body:eventDefinition(e.definitionId).body,commands:eventDefinition(e.definitionId).choices.filter(x=>x.dispatchClass!=='DOMAIN'||e.definitionId==='E13'||e.seasonKey===c.world.seasonKey&&e.resume.competitionKey===r.league&&e.resume.registrationKey===r.team&&eligible.includes(e.definitionId as AdviceId)).map(x=>x.command)}))};
}
