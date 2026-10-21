import {KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {kboPreseasonPlanView} from './kbo-preseason.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {canonicalJson} from './game.js';
import {automaticFieldLineup,initialPositionFits} from './lineup.js';
import {emptyBatting} from './stats.js';

export interface KboOpeningRoster {
 receiptKey:string;seasonKey:string;playerKey:string;clubId:string;sourceRevision:number;confirmedRevision:number;
 firstTeam:readonly string[];futures:readonly string[];sourceBasis:string;
}
const key=(s:KboCareer)=>JSON.stringify(['kbo-opening-roster',s.preseasonPlan!.receiptKey]);
function club(s:KboCareer){const c=s.world.clubs.find(c=>c.id===s.protagonistClubId);if(!c)throw new RangeError('MISSING_KBO_CLUB');return c;}
function basis(s:KboCareer){const c=club(s);return canonicalJson({seasonKey:s.world.seasonKey,planReceiptKey:s.preseasonPlan!.receiptKey,club:{id:c.id,roster:c.roster,firstTeam:c.firstTeam},players:c.roster.map(k=>s.world.players[k]),unavailable:c.roster.filter(k=>Object.hasOwn(s.health.injuries,k)).sort()});}
function assertFirstTeam(s:KboCareer,first:readonly string[]){
 const c=club(s);if(first.length!==KBO_ROSTER_LIMITS.firstTeam || new Set(first).size!==first.length || first.some(k=>!c.roster.includes(k) || !Object.hasOwn(s.world.players,k) || Object.hasOwn(s.health.injuries,k)))throw new RangeError('INVALID_KBO_OPENING_ROSTER');
 const members=first.map(k=>s.world.players[k]!);if(members.filter(p=>p.kind==='PITCHER').length!==13 || members.filter(p=>p.kind==='HITTER').length!==15 || members.filter(p=>p.position==='C').length<2)throw new RangeError('INVALID_KBO_OPENING_ROSTER');
 for(const [position,count] of [['SP',5],['RP',6],['CP',2]] as const)if(members.filter(p=>p.position===position).length!==count)throw new RangeError('INVALID_KBO_OPENING_PITCHERS');
 automaticFieldLineup(members.filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
}
export function assertKboOpeningRoster(s:KboCareer):KboOpeningRoster {
 kboPreseasonPlanView(s);const r=s.openingRoster,c=club(s),first=c.firstTeam,futures=c.roster.filter(k=>!first.includes(k)).sort();
 if(!s.preseasonPlan || !r || r.receiptKey!==key(s) || r.seasonKey!==s.world.seasonKey || r.playerKey!==s.protagonistKey || r.clubId!==c.id || !Number.isSafeInteger(r.sourceRevision) || !Number.isSafeInteger(r.confirmedRevision) || r.sourceRevision<0 || r.confirmedRevision!==r.sourceRevision+1 || r.confirmedRevision>s.revision || r.sourceBasis!==basis(s) || canonicalJson(r.firstTeam)!==canonicalJson(first) || canonicalJson(r.futures)!==canonicalJson(futures) || s.registration.competitionKey!==(first.includes(s.protagonistKey)?'KBO':'FUTURES'))throw new RangeError('STALE_KBO_OPENING_ROSTER');
 assertFirstTeam(s,first);return r;
}
/** Confirmed PRE plan and the existing41/44 initial selector decide the roster. No odds, redraw or promotion bonus. */
export function confirmKboOpeningRoster(s:KboCareer,revision:number):KboCareer {
 assertCareerRevision(s,revision);kboPreseasonPlanView(s);if(!s.preseasonPlan)throw new RangeError('KBO_PRESEASON_PLAN_REQUIRED');
 if(s.openingRoster){assertKboOpeningRoster(s);return structuredClone(s);}if(s.registration.competitionKey!==undefined)throw new RangeError('KBO_OPENING_ROSTER_ALREADY_APPLIED');
 assertKboRecruitmentWorld(s.world);const c=club(s),available=c.roster.filter(k=>!Object.hasOwn(s.health.injuries,k)).map(k=>s.world.players[k]!);const selected=selectKboFirstTeamRoster(available);assertFirstTeam(s,selected);
 const next=structuredClone(s),target=club(next);target.firstTeam=[...selected];next.registration={...next.registration,firstTeam:selected.includes(s.protagonistKey),competitionKey:selected.includes(s.protagonistKey)?'KBO':'FUTURES'};next.revision++;
 next.openingRoster={receiptKey:key(next),seasonKey:next.world.seasonKey,playerKey:next.protagonistKey,clubId:target.id,sourceRevision:s.revision,confirmedRevision:next.revision,firstTeam:[...selected],futures:target.roster.filter(k=>!selected.includes(k)).sort(),sourceBasis:basis(next)};assertKboOpeningRoster(next);return next;
}
/** First-team registration is separate from lineup/appearance. Injury/position competition are reasons, not odds. */
export function kboOpeningRosterView(s:KboCareer){
 assertCareerRevision(s,s.revision);kboPreseasonPlanView(s);if(!s.openingRoster){if(s.registration.competitionKey!==undefined)throw new RangeError('KBO_OPENING_ROSTER_RECEIPT_REQUIRED');return {status:'PENDING' as const,competitionKey:null,firstTeam:[],futures:[],reason:null};}
 const r=assertKboOpeningRoster(s),player=(k:string)=>{const p=s.world.players[k]!;return {playerKey:k,name:p.name,kind:p.kind,position:p.position};};
 return {status:'CONFIRMED' as const,competitionKey:s.registration.competitionKey!,firstTeam:r.firstTeam.map(player),futures:r.futures.map(player),reason:Object.hasOwn(s.health.injuries,s.protagonistKey)?'INJURED' as const:s.registration.firstTeam?'SELECTED' as const:'POSITION_COMPETITION' as const};
}
