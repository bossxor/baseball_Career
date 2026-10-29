import type {KboCareer,KboNationalResume} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {NationalBracket} from './national-bracket.js';
import type {NationalSelectionSnapshot} from './national-selection.js';
import type {NationalHostReturn} from './kbo-national.js';
import {sealNationalCompetitionResult} from './kbo-national.js';
import {koreaOutcome} from './national-progress.js';
import {nationalDayEvidence} from './national-day-audit.js';
import {settleKboServicePayrollDay} from './kbo-service-payroll.js';
import {settleKboPersonalPayrollDay} from './career-payroll.js';
import {settleKboNpcMilitaryPayrollDay} from './kbo-npc-military.js';
import {putGameContribution} from './records.js';
import type {RecordLedger} from './records.js';
import type {DevelopmentPlayer} from './player.js';
import type {Repertoire} from './repertoire.js';
import type {HealthLedger} from './health.js';
import {canonicalJson} from './game.js';

export interface NationalHostSnapshot {hostSourceFingerprint:string;hostPlayers:Record<string,DevelopmentPlayer>;hostRepertoires:Record<string,Repertoire>;hostHealth:HealthLedger}
export function captureNationalHost(host:KboCareer):NationalHostSnapshot {
 const members={...host.sangmu?.emergency?.entries,...host.sangmu?.members};
 return {hostSourceFingerprint:canonicalJson(host),hostPlayers:structuredClone({...host.world.players,...Object.fromEntries(Object.entries(members).map(([k,m])=>[k,m.player]))}),hostRepertoires:structuredClone({...host.world.repertoires,...Object.fromEntries(Object.entries(members).filter(([,m])=>m.repertoire).map(([k,m])=>[k,m.repertoire!]))}),hostHealth:structuredClone(host.health)};
}
/** Actual KBO host patch shared by independent US/college tournament owners; caller commits both roots with CAS. */
export function returnNationalHost(input:{host:KboCareer;expectedRevision:number;snapshot:NationalHostSnapshot;bracket:NationalBracket;selection:NationalSelectionSnapshot;registeredKeys:readonly string[];records:RecordLedger;owner:NationalHostReturn['owner'];ownerRevision:number;ownerPlayerKeys:readonly string[];ownerHealth:HealthLedger}):{host:KboCareer;ownership:NationalHostReturn} {
 const {host,expectedRevision,snapshot:s,bracket:b}=input;assertKboCareerRevision(host,expectedRevision);
 if(canonicalJson(host)!==s.hostSourceFingerprint||host.world.worldKey!==b.worldKey||host.world.seasonKey!==b.seasonKey||!['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW'].includes(host.phaseContext.phase)||host.phaseContext.phase==='SEASON_PROGRESS'&&(host.phaseContext.pendingGame||host.phaseContext.nextWorldDay!==b.window.startDay)||b.pendingGame||b.dayReceipts?.length!==b.window.endDay-b.window.startDay)throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
 let next:KboCareer={...structuredClone(host),health:structuredClone(s.hostHealth)};
 for(const [key,player]of Object.entries(s.hostPlayers)){
  if(next.sangmu?.members[key])next.sangmu={...next.sangmu,members:{...next.sangmu.members,[key]:{...next.sangmu.members[key]!,player:structuredClone(player)}}};
  else if(next.sangmu?.emergency?.entries[key])next.sangmu.emergency.entries[key]={...next.sangmu.emergency.entries[key]!,player:structuredClone(player)};
  else if(Object.hasOwn(host.world.players,key))next.world.players[key]=structuredClone(player);else throw new RangeError('NATIONAL_ROSTER_CHANGED');
 }
 for(const [key,repertoire]of Object.entries(s.hostRepertoires)){
  if(next.sangmu?.members[key])next.sangmu={...next.sangmu,members:{...next.sangmu.members,[key]:{...next.sangmu.members[key]!,repertoire:structuredClone(repertoire)}}};
  else if(next.sangmu?.emergency?.entries[key])next.sangmu.emergency.entries[key]={...next.sangmu.emergency.entries[key]!,repertoire:structuredClone(repertoire)};
  else if(Object.hasOwn(host.world.repertoires,key))next.world.repertoires[key]=structuredClone(repertoire);else throw new RangeError('NATIONAL_ROSTER_CHANGED');
 }
 for(const r of b.results)next.records=putGameContribution(next.records,input.records.games[r.gameKey]!).ledger;
 const gameKeys=b.results.map(r=>r.gameKey),ownership:NationalHostReturn={competitionId:b.competitionId,owner:input.owner,sourceKboRevision:expectedRevision,sourceOwnerRevision:input.ownerRevision,kboPlayerKeys:Object.keys(s.hostPlayers).sort(),ownerPlayerKeys:[...input.ownerPlayerKeys].sort(),ownerHealthGames:structuredClone(input.ownerHealth.games.filter(h=>gameKeys.includes(h.evidence.gameKey))),recordGameKeys:gameKeys,fatigueDays:b.dayReceipts!.map(d=>d.day),pitchXpKeys:Object.keys(s.hostRepertoires).filter(k=>canonicalJson(s.hostRepertoires[k])!==canonicalJson(host.sangmu?.members[k]?.repertoire??host.sangmu?.emergency?.entries[k]?.repertoire??host.world.repertoires[k])).sort()},n=host.national??{invitations:[],competitions:[],benefits:[]};
 next.national={...n,selections:[...(n.selections??[]),structuredClone(input.selection)],brackets:[...(n.brackets??[]),structuredClone(b)],hostReturns:[...(n.hostReturns??[]),ownership]};
 if(host.phaseContext.phase==='SEASON_PROGRESS')for(const d of b.dayReceipts!){
  if(next.days?.days.at(-1)?.day!==d.day-1)throw new RangeError('NATIONAL_HOST_CLOCK_MISMATCH');
  next.days={...next.days,days:[...next.days.days,{day:d.day,evidence:nationalDayEvidence(b,d.day,d.gameKeys,d.rosterKeys),result:structuredClone(d.result)}]};settleKboServicePayrollDay(next,d.day);next=settleKboPersonalPayrollDay(next,d.day);settleKboNpcMilitaryPayrollDay(next,d.day);
 }
 const key=host.protagonistKey,registered=input.registeredKeys.includes(key),officialAppearance=registered&&gameKeys.some(k=>(input.records.games[k]!.batting[key]?.PA??0)+(input.records.games[k]!.pitching[key]?.BF??0)>0);
 next.phaseContext={phase:'INTERNATIONAL_REVIEW',competitionId:b.competitionId,nextWorldDay:b.window.endDay,resume:structuredClone(host.phaseContext as KboNationalResume)};
 return {host:sealNationalCompetitionResult(next,expectedRevision,{competitionId:b.competitionId,tournament:b.tournament,seasonKey:b.seasonKey,...koreaOutcome(b),registered,officialAppearance,resultVersion:1,gameKeys}),ownership};
}
