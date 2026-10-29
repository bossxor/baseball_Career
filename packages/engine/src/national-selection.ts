import {canonicalJson} from './game.js';
import {roleScore} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {NationalTournament} from './kbo-national.js';
import type {RecordLedger} from './records.js';
import {emptyBatting,emptyPitching,battingRates,pitchingRates} from './stats.js';
import type {BattingLine,PitchingLine} from './types.js';
import {createStreams,nextInteger} from './rng.js';

export const NATIONAL_LEAGUE_ADJUSTMENTS=Object.freeze({MLB:8,KBO:0,AAA:-8,FUTURES:-12,AA:-15,A:-20,COLLEGE:-22,ROOKIE:-25} as const);
export type NationalLeague=keyof typeof NATIONAL_LEAGUE_ADJUSTMENTS;
export type NationalRole='C'|'1B'|'2B'|'3B'|'SS'|'LF'|'CF'|'RF'|'DH'|'UTIL'|'SP'|'RP'|'CP';
export interface NationalCandidate {
 player:DevelopmentPlayer;nationalTeamId:string;league:NationalLeague;injured:boolean;retired:boolean;
 nationalReleaseAllowed:boolean;service:'NONE'|'ACTIVE'|'SPORTS';militaryUnresolved:boolean;recentTopLeagueRecord:boolean;
}
/** Frozen allocation facts; no hidden potential, RNG state or complete player copy. */
export interface NationalCandidateScore {
 playerKey:string;name:string;kind:'HITTER'|'PITCHER';position:string;throws:'L'|'R';stamina:number;composure:number;
 score:number;sample:number;lotRank:number;
}
export interface NationalEvaluation extends NationalCandidateScore {
 roleOVR:number;performanceIndex:number;performanceLeague:NationalLeague|null;performanceSeason:string|null;militaryBonus:0|3;
}
export interface NationalRosterSlot {playerKey:string;role:NationalRole}
export interface NationalRoster {slots:NationalRosterSlot[];reserves:Partial<Record<NationalRole,string[]>>}
export interface NationalEmergencyAdmission {
 beforeReplacement:number;sourceRecordRevision:number;playerKeys:string[];
}
export interface NationalSelectionSnapshot {
 schemaVersion:1;modelVersion:'national-selection-1';selectionId:string;worldKey:string;seasonKey:string;tournament:NationalTournament;
 sourceRecordRevision:number;scores:NationalEvaluation[];roster:NationalRoster;withdrawnKeys:string[];
 replacements:{from:string;to:string;role:NationalRole;reason:'DECLINED'|'INJURED';unavailableKeys:string[]}[];
 emergencyAdmissions?:NationalEmergencyAdmission[];
}
const TOURNAMENTS=['AG','OLY','WBC','P12'];
export function nationalCandidateEligible(c:NationalCandidate,tournament:NationalTournament):boolean {
 validateDevelopmentPlayer(c.player);
 if(!TOURNAMENTS.includes(tournament)||!Object.hasOwn(NATIONAL_LEAGUE_ADJUSTMENTS,c.league)||!['NONE','ACTIVE','SPORTS'].includes(c.service)||typeof c.nationalTeamId!=='string'||![c.injured,c.retired,c.nationalReleaseAllowed,c.militaryUnresolved,c.recentTopLeagueRecord].every(x=>typeof x==='boolean'))throw new RangeError('INVALID_NATIONAL_CANDIDATE');
 if(c.nationalTeamId!=='KOR'||c.injured||c.retired||!c.nationalReleaseAllowed||c.service==='ACTIVE')return false;
 if(tournament==='AG')return true;
 return c.service!=='SPORTS'&&(['KBO','MLB'].includes(c.league)||c.recentTopLeagueRecord);
}
const compare=(a:NationalCandidateScore,b:NationalCandidateScore)=>b.score-a.score||b.sample-a.sample||a.lotRank-b.lotRank||(a.playerKey<b.playerKey?-1:a.playerKey>b.playerKey?1:0);
function roleCandidates(rows:readonly NationalCandidateScore[],role:NationalRole):NationalCandidateScore[] {
 const ranked=[...rows].sort(compare);
 if(role==='UTIL')return ranked.filter(s=>s.kind==='HITTER');
 const primary=ranked.filter(s=>s.position===role);
 if(primary.length)return primary;
 if(role==='SP')return ranked.filter(s=>s.position==='RP'&&s.stamina>=50).sort((a,b)=>b.stamina-a.stamina||compare(a,b));
 if(role==='CP')return ranked.filter(s=>s.position==='RP').sort((a,b)=>b.composure-a.composure||compare(a,b));
 return [];
}
function validateScores(rows:readonly NationalCandidateScore[]):void {
 if(!Array.isArray(rows)||rows.some(s=>!s||typeof s.playerKey!=='string')||new Set(rows.map(s=>s.playerKey)).size!==rows.length||rows.some(s=>!s.playerKey||typeof s.name!=='string'||!s.name||!['HITTER','PITCHER'].includes(s.kind)||!(s.kind==='HITTER'?['C','1B','2B','3B','SS','LF','CF','RF','DH']:['SP','RP','CP']).includes(s.position)||!['L','R'].includes(s.throws)||s.throws==='L'&&['C','2B','3B','SS'].includes(s.position)||![s.score,s.stamina,s.composure].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||!Number.isSafeInteger(s.sample)||s.sample<0||!Number.isSafeInteger(s.lotRank)||s.lotRank<0))throw new RangeError('INVALID_NATIONAL_SCORES');
}
function reserves(rows:readonly NationalCandidateScore[],slots:readonly NationalRosterSlot[]):NationalRoster['reserves'] {
 const used=new Set(slots.map(s=>s.playerKey)),remaining=rows.filter(s=>!used.has(s.playerKey));
 return Object.fromEntries((['C','1B','2B','3B','SS','LF','CF','RF','DH','UTIL','SP','RP','CP'] as const).map(role=>[role,roleCandidates(remaining,role).slice(0,3).map(s=>s.playerKey)]));
}
/** Declared28 roles, no reroll, invented players or permanent role changes. */
export function chooseNationalRoster(evaluated:readonly NationalCandidateScore[]):NationalRoster {
 validateScores(evaluated);const slots:NationalRosterSlot[]=[],used=new Set<string>();
 for(const role of ['C','C','1B','2B','3B','SS','LF','CF','RF','DH',...Array<NationalRole>(5).fill('UTIL'),...Array<NationalRole>(5).fill('SP'),'CP',...Array<NationalRole>(7).fill('RP')] as NationalRole[]){
  const s=roleCandidates(evaluated.filter(s=>!used.has(s.playerKey)),role)[0];if(!s)throw new RangeError('NATIONAL_ROSTER_IMPOSSIBLE');slots.push({playerKey:s.playerKey,role});used.add(s.playerKey);
 }
 return {slots,reserves:reserves(evaluated,slots)};
}
interface NationalSample {batting:BattingLine;pitching:PitchingLine;games:number}
/** One scan, core counters only: selection never needs team, split or matchup aggregates. */
function nationalSamples(records:RecordLedger,years:readonly string[]) {
 const cache=new Map<string,Map<string,NationalSample>>();if(years.length===0)return cache;
 const add=(target:object,line:object)=>{const a=target as Record<string,number>,b=line as Record<string,number>;for(const k of Object.keys(a)){const v=b[k];if(!Number.isSafeInteger(v)||v!<0||!Number.isSafeInteger(a[k]!+v!))throw new RangeError('INVALID_NATIONAL_SAMPLE');a[k]=a[k]!+v!;}};
 for(const g of Object.values(records.games)){
  if(g.scope.phase!=='REGULAR'||!years.includes(g.scope.seasonKey)||!Object.hasOwn(NATIONAL_LEAGUE_ADJUSTMENTS,g.scope.leagueKey))continue;
  const id=g.scope.seasonKey+':'+g.scope.leagueKey;if(!cache.has(id))cache.set(id,new Map());const rows=cache.get(id)!;
  const sample=(key:string)=>{if(!rows.has(key))rows.set(key,{batting:emptyBatting(),pitching:emptyPitching(),games:0});return rows.get(key)!;};
  for(const [key,b]of Object.entries(g.batting)){const row=sample(key);add(row.batting,b);if(!Number.isSafeInteger(b.games)||b.games<0||!Number.isSafeInteger(row.games+b.games))throw new RangeError('INVALID_NATIONAL_SAMPLE');row.games+=b.games;}
  for(const [key,q]of Object.entries(g.pitching)){const row=sample(key);add(row.pitching,q);if(!Number.isSafeInteger(q.games)||q.games<0||!Number.isSafeInteger(row.games+q.games))throw new RangeError('INVALID_NATIONAL_SAMPLE');row.games+=q.games;}
 }
 return cache;
}
/** Adapter-only actual regular batting lines for automatic lineup; no synthetic OPS or persistent record cache. */
export function nationalLineupBatting(records:RecordLedger,selection:NationalSelectionSnapshot):ReadonlyMap<string,BattingLine> {
 const years=[...new Set(selection.scores.flatMap(s=>s.performanceSeason?[s.performanceSeason]:[]))],samples=nationalSamples(records,years),out=new Map<string,BattingLine>();
 for(const slot of selection.roster.slots){const row=selection.scores.find(s=>s.playerKey===slot.playerKey);if(!row)throw new RangeError('NATIONAL_ROSTER_CHANGED');if(row.kind!=='HITTER')continue;const line=row.performanceSeason&&row.performanceLeague?samples.get(row.performanceSeason+':'+row.performanceLeague)?.get(row.playerKey)?.batting:undefined;out.set(row.playerKey,line?{...line}:emptyBatting());}
 return out;
}
/** Source-choice U2026-10-27: adequate current highest league, otherwise prior highest; WBC uses prior only. */
interface NationalEvaluationInput {worldKey:string;seasonKey:string;seed:string;tournament:NationalTournament;candidates:readonly NationalCandidate[];records:RecordLedger}
/** Emergency batches use the existing evaluation and shuffle, in a separate stream after the sealed ranks. */
export function evaluateNationalCandidates(input:NationalEvaluationInput,emergency?:{selectionId:string;batch:number;lotRankOffset:number}):NationalEvaluation[] {
 const {worldKey,seasonKey,seed,tournament,records}=input;
 if(!worldKey||!seed||!/^\d{4}$/.test(seasonKey)||!TOURNAMENTS.includes(tournament)||!Number.isSafeInteger(records.revision)||records.revision<0||!Array.isArray(input.candidates)||input.candidates.some(c=>!c||!c.player)||new Set(input.candidates.map(c=>c.player.simulationKey)).size!==input.candidates.length)throw new RangeError('INVALID_NATIONAL_SELECTION');
 if(emergency&&(!emergency.selectionId||!Number.isSafeInteger(emergency.batch)||emergency.batch<0||!Number.isSafeInteger(emergency.lotRankOffset)||emergency.lotRankOffset<0))throw new RangeError('INVALID_NATIONAL_EMERGENCY');
 const leagues=(Object.keys(NATIONAL_LEAGUE_ADJUSTMENTS) as NationalLeague[]).sort((a,b)=>NATIONAL_LEAGUE_ADJUSTMENTS[b]-NATIONAL_LEAGUE_ADJUSTMENTS[a]),years=tournament==='WBC'?[String(Number(seasonKey)-1)]:[seasonKey,String(Number(seasonKey)-1)],samples=nationalSamples(records,years);
 const line=(year:string,league:NationalLeague,key:string)=>samples.get(year+':'+league)?.get(key);
 // Eligibility reads the same authoritative record snapshot, never a stale caller's top-league flag.
 const eligible=input.candidates.filter(c=>nationalCandidateEligible({...c,recentTopLeagueRecord:!!emergency||years.some(year=>(['KBO','MLB'] as const).some(league=>{return (line(year,league,c.player.simulationKey)?.games??0)>0;}))},tournament)&&(!emergency||!['KBO','MLB'].includes(c.league))),lots=eligible.map(c=>c.player.simulationKey).sort();
 let rng=createStreams(seed,JSON.stringify(emergency?['national-emergency-lots',worldKey,seasonKey,tournament,emergency.selectionId,emergency.batch]:['national-selection-lots',worldKey,seasonKey,tournament])).worldCreation;
 for(let i=lots.length-1;i>0;i--){const draw=nextInteger(rng,i+1);rng=draw.state;[lots[i],lots[draw.value]]=[lots[draw.value]!,lots[i]!];}
 const lotRank=new Map(lots.map((k,i)=>[k,i+(emergency?.lotRankOffset??0)]));
 const scores:NationalEvaluation[]=eligible.map(c=>{
  const p=c.player;let sample=0,performanceIndex=50,performanceLeague:NationalLeague|null=null,performanceSeason:string|null=null;
  outer:for(const year of years)for(const league of leagues){const t=line(year,league,p.simulationKey),b=t?.batting,q=t?.pitching,denominator=p.kind==='HITTER'?(b?.PA??0):(q?.outs??0);if(denominator<(p.kind==='HITTER'?50:30))continue;
   const raw=p.kind==='HITTER'?50+100*((battingRates(b!).OPS??.7)-.7):50+10*(4-(pitchingRates(q!).ERA??4));
   performanceIndex=Math.max(0,Math.min(100,Math.max(0,Math.min(100,raw))+NATIONAL_LEAGUE_ADJUSTMENTS[league]));sample=denominator;performanceLeague=league;performanceSeason=year;break outer;
  }
  const ovr=roleScore(p.kind,p.abilities,p.position);const bonus:0|3=tournament==='AG'&&c.militaryUnresolved?3:0;
  return {playerKey:p.simulationKey,name:p.name,kind:p.kind,position:p.position,throws:p.throws,stamina:(p.abilities.STAMINA??0)/10000,composure:(p.abilities.COMPOSURE??0)/10000,score:Math.min(100,.6*ovr+.4*performanceIndex+bonus),sample,lotRank:lotRank.get(p.simulationKey)!,roleOVR:ovr,performanceIndex,performanceLeague,performanceSeason,militaryBonus:bonus};
 }).sort(compare);
 return scores;
}
export function createNationalSelection(input:NationalEvaluationInput):NationalSelectionSnapshot {
 const scores=evaluateNationalCandidates(input),{worldKey,seasonKey,tournament,records}=input;
 return {schemaVersion:1,modelVersion:'national-selection-1',selectionId:JSON.stringify(['national-selection',worldKey,seasonKey,tournament]),worldKey,seasonKey,tournament,sourceRecordRevision:records.revision,scores,roster:chooseNationalRoster(scores),withdrawnKeys:[],replacements:[]};
}
/** Replaces only the vacated slot using sealed scores; no rescore or whole-roster reshuffle. */
export function replaceNationalSelectionPlayer(source:NationalSelectionSnapshot,playerKey:string,unavailableKeys:ReadonlySet<string>,reason:'DECLINED'|'INJURED',emergency?:{scores:NationalEvaluation[];sourceRecordRevision:number}):NationalSelectionSnapshot {
 const index=source.roster.slots.findIndex(s=>s.playerKey===playerKey);if(index<0)throw new RangeError('NATIONAL_PLAYER_NOT_SELECTED');
 const role=source.roster.slots[index]!.role,used=new Set(source.roster.slots.map(s=>s.playerKey)),banned=new Set([...source.withdrawnKeys,...unavailableKeys,playerKey]),replacement=roleCandidates(source.scores.filter(s=>!used.has(s.playerKey)&&!banned.has(s.playerKey)),role)[0];
 if(emergency){
  if(replacement||reason!=='INJURED'||!unavailableKeys.has(playerKey)||!Number.isSafeInteger(emergency.sourceRecordRevision)||emergency.sourceRecordRevision<(source.emergencyAdmissions?.at(-1)?.sourceRecordRevision??source.sourceRecordRevision)||!emergency.scores.length)throw new RangeError('INVALID_NATIONAL_EMERGENCY');
  validateScores([...source.scores,...emergency.scores]);
  const lastRank=Math.max(-1,...source.scores.map(s=>s.lotRank));
  if(emergency.scores.some(s=>s.lotRank<=lastRank||banned.has(s.playerKey))||new Set(emergency.scores.map(s=>s.lotRank)).size!==emergency.scores.length)throw new RangeError('INVALID_NATIONAL_EMERGENCY');
  const admitted:NationalSelectionSnapshot={...source,scores:[...source.scores,...emergency.scores],emergencyAdmissions:[...(source.emergencyAdmissions??[]),{beforeReplacement:source.replacements.length,sourceRecordRevision:emergency.sourceRecordRevision,playerKeys:emergency.scores.map(s=>s.playerKey)}]};
  return replaceNationalSelectionPlayer(admitted,playerKey,unavailableKeys,reason);
 }
 if(!replacement)throw new RangeError('NATIONAL_ROSTER_IMPOSSIBLE');const slots=source.roster.slots.map((s,i)=>i===index?{playerKey:replacement.playerKey,role}:s);
 return {...source,withdrawnKeys:[...source.withdrawnKeys,playerKey],replacements:[...source.replacements,{from:playerKey,to:replacement.playerKey,role,reason,unavailableKeys:[...unavailableKeys].sort()}],roster:{slots,reserves:reserves(source.scores.filter(s=>!banned.has(s.playerKey)),slots)}};
}
export function assertNationalSelectionSnapshot(s:NationalSelectionSnapshot):void {
 if(!s||s.schemaVersion!==1||s.modelVersion!=='national-selection-1'||!s.worldKey||!/^\d{4}$/.test(s.seasonKey)||!TOURNAMENTS.includes(s.tournament)||s.selectionId!==JSON.stringify(['national-selection',s.worldKey,s.seasonKey,s.tournament])||!Number.isSafeInteger(s.sourceRecordRevision)||s.sourceRecordRevision<0||!Array.isArray(s.scores)||!s.roster||!Array.isArray(s.roster.slots)||!Array.isArray(s.withdrawnKeys)||!Array.isArray(s.replacements))throw new RangeError('INVALID_NATIONAL_SELECTION');
 validateScores(s.scores);
 const admissions=s.emergencyAdmissions===undefined?[]:s.emergencyAdmissions;
 if(!Array.isArray(admissions)||admissions.some((a,i)=>!a||!Number.isSafeInteger(a.beforeReplacement)||a.beforeReplacement<0||a.beforeReplacement>=s.replacements.length||i>0&&a.beforeReplacement<=admissions[i-1]!.beforeReplacement||!Array.isArray(a.playerKeys)||!a.playerKeys.length||a.playerKeys.some(k=>typeof k!=='string'))||new Set(admissions.flatMap(a=>a.playerKeys)).size!==admissions.flatMap(a=>a.playerKeys).length)throw new RangeError('INVALID_NATIONAL_EMERGENCY');
 const admittedKeys=new Set(admissions.flatMap(a=>a.playerKeys)),initial=s.scores.filter(row=>!admittedKeys.has(row.playerKey));
 if([...admittedKeys].some(k=>!s.scores.some(row=>row.playerKey===k)))throw new RangeError('INVALID_NATIONAL_EMERGENCY');
 const replay=chooseNationalRoster(initial);let current:NationalSelectionSnapshot={...s,scores:initial,roster:replay,withdrawnKeys:[],replacements:[]};delete current.emergencyAdmissions;
 for(const [index,r] of s.replacements.entries()){
  if(!r||!['DECLINED','INJURED'].includes(r.reason)||!Array.isArray(r.unavailableKeys)||r.unavailableKeys.some(k=>typeof k!=='string')||new Set(r.unavailableKeys).size!==r.unavailableKeys.length)throw new RangeError('INVALID_NATIONAL_REPLACEMENT');
  const admission=admissions.find(a=>a.beforeReplacement===index),emergency=admission?{sourceRecordRevision:admission.sourceRecordRevision,scores:admission.playerKeys.map(k=>s.scores.find(row=>row.playerKey===k)!)}:undefined;
  current=replaceNationalSelectionPlayer(current,r.from,new Set(r.unavailableKeys),r.reason,emergency);const expected=current.replacements.at(-1)!;if(canonicalJson(expected)!==canonicalJson(r))throw new RangeError('INVALID_NATIONAL_REPLACEMENT');
 }
 if(canonicalJson(current.scores)!==canonicalJson(s.scores)||canonicalJson(current.roster)!==canonicalJson(s.roster)||canonicalJson(current.withdrawnKeys)!==canonicalJson(s.withdrawnKeys)||s.scores.some(r=>r.performanceLeague!==null&&!Object.hasOwn(NATIONAL_LEAGUE_ADJUSTMENTS,r.performanceLeague)||r.performanceSeason!==null&&!/^\d{4}$/.test(r.performanceSeason)||![r.roleOVR,r.performanceIndex].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||![0,3].includes(r.militaryBonus)||r.militaryBonus===3&&s.tournament!=='AG'||r.score!==Math.min(100,.6*r.roleOVR+.4*r.performanceIndex+r.militaryBonus)))throw new RangeError('INVALID_NATIONAL_SELECTION');
}
