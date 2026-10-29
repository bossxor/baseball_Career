import {UNITS_PER_POINT} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import type {GameState} from './types.js';
import type {RecordLedger,RecordScope} from './records.js';
import {recordTotals} from './records.js';
import {battingRates,pitchingRates} from './stats.js';
import {FIELD_POSITIONS} from './lineup.js';
import {canonicalJson,assertGameInvariants} from './game.js';
import type {ScheduledGame} from './schedule.js';
import {createWorldEvent,eventDefinition,validateEvent,resolveEventChoice} from './events.js';
import type {EventInstance} from './events.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertUsCareerRevision} from './us-career-entry.js';

interface AppearanceProof {teamKey:string;position:string;defenseUnits:number}
interface AwardGame {gameKey:string;scope:RecordScope;worldDay:number;appearances:Record<string,AppearanceProof>}
export type ProAwardType='MVP'|'ROOKIE'|'AVG'|'ERA'|`POSITION_${string}`|'SP'|'RP'|'CP';
export interface ProAward {awardType:ProAwardType;playerKey:string;score:number}
export interface ProAwardReceipt {receiptKey:string;seasonKey:string;leagueKey:string;worldDay:number;awards:readonly ProAward[]}
export interface ProAllStarReceipt {receiptKey:string;seasonKey:string;leagueKey:string;worldDay:number;selected:readonly {playerKey:string;position:string;score:number}[]}
export interface CareerProAwardLedger {schemaVersion:1;worldKey:string;playerKey:string;games:Record<string,AwardGame>;annual:readonly ProAwardReceipt[];allStars:readonly ProAllStarReceipt[];notices:readonly EventInstance[]}
type AwardCareer=(KboCareer|UsCareer)&{proAwards?:CareerProAwardLedger};
const isUs=(c:AwardCareer):c is UsCareer=>'mode'in c&&c.mode==='US_CAREER';
const leagues=['KBO','FUTURES','ROOKIE','A','AA','AAA','MLB'];
const positions=[...FIELD_POSITIONS,'DH','SP','RP','CP'];
const compareId=(a:string,b:string)=>a<b?-1:a>b?1:0;
const receiptKey=(c:AwardCareer,kind:string,season:string,league:string)=>JSON.stringify(['pro-awards',c.world.worldKey,kind,season,league]);
function ledger(c:AwardCareer):CareerProAwardLedger{return c.proAwards??{schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,games:{},annual:[],allStars:[],notices:[]};}
function validate(c:AwardCareer){
 const l=ledger(c);
 if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==c.protagonistKey||!l.games||!Array.isArray(l.annual)||!Array.isArray(l.allStars)||!Array.isArray(l.notices))throw new RangeError('INVALID_PRO_AWARD_LEDGER');
 for(const [key,g]of Object.entries(l.games)){
  const r=c.records.games[key];if(key!==g.gameKey||!r||canonicalJson(r.scope)!==canonicalJson(g.scope)||r.worldDay!==g.worldDay||g.scope.phase!=='REGULAR'||!leagues.includes(g.scope.leagueKey))throw new RangeError('INVALID_PRO_AWARD_GAME');
  for(const [player,p]of Object.entries(g.appearances))if(!positions.includes(p.position)||!Object.hasOwn(r.teams,p.teamKey)||!Number.isSafeInteger(p.defenseUnits)||p.defenseUnits<0||p.defenseUnits>100*UNITS_PER_POINT||(!r.batting[player]&&!r.pitching[player]))throw new RangeError('INVALID_PRO_AWARD_APPEARANCE');
 }
 for(const [kind,rows]of [['annual',l.annual],['allstar',l.allStars]]as const){if(new Set(rows.map(r=>r.receiptKey)).size!==rows.length)throw new RangeError('DUPLICATE_PRO_AWARD_RECEIPT');for(const r of rows)if(r.receiptKey!==receiptKey(c,kind,r.seasonKey,r.leagueKey)||!leagues.includes(r.leagueKey)||!Number.isSafeInteger(r.worldDay)||r.worldDay<0)throw new RangeError('INVALID_PRO_AWARD_RECEIPT');}
 if(new Set(l.notices.map(e=>e.eventKey)).size!==l.notices.length)throw new RangeError('DUPLICATE_PRO_AWARD_EVENT');
 for(const r of l.annual as readonly ProAwardReceipt[]){if(!Array.isArray(r.awards)||new Set(r.awards.map((a:ProAward)=>JSON.stringify([a.awardType,a.playerKey]))).size!==r.awards.length||r.awards.some((a:ProAward)=>!a.playerKey||!Number.isFinite(a.score)||!['MVP','ROOKIE','AVG','ERA','SP','RP','CP',...FIELD_POSITIONS.map(p=>`POSITION_${p}`)].includes(a.awardType)))throw new RangeError('INVALID_PRO_ANNUAL_AWARD');}
 for(const r of l.allStars as readonly ProAllStarReceipt[])if(!Array.isArray(r.selected)||new Set(r.selected.map((a:ProAllStarReceipt['selected'][number])=>a.playerKey)).size!==r.selected.length||r.selected.some((a:ProAllStarReceipt['selected'][number])=>!a.playerKey||!positions.includes(a.position)||!Number.isFinite(a.score)))throw new RangeError('INVALID_PRO_ALLSTAR_AWARD');
 for(const e of l.notices){validateEvent(e);if(!['E25','E29'].includes(e.definitionId)||e.worldKey!==l.worldKey||e.resume.sourceRevision>c.revision)throw new RangeError('INVALID_PRO_AWARD_EVENT');
  const proven=e.definitionId==='E25'?l.allStars.some((r:ProAllStarReceipt)=>r.seasonKey===e.seasonKey&&r.selected.some(a=>a.playerKey===c.protagonistKey)):l.annual.some((r:ProAwardReceipt)=>r.seasonKey===e.seasonKey&&r.awards.some(a=>a.playerKey===c.protagonistKey&&e.evidence.fields.milestoneKey===JSON.stringify(['first-pro-award',a.awardType])));
  if(!proven)throw new RangeError('PRO_AWARD_EVENT_WITHOUT_RECEIPT');
 }
}
/** Pure root guard; does not invoke a career revision guard or publish any result. */
export function assertProCareerAwards(c:AwardCareer):void {validate(c);}
/** SERVER ONLY: copy actual FINAL input assignments, never reconstruct positions from today's player. */
export function observeProCareerAwardGame<T extends AwardCareer>(c:T,game:GameState):T {
 validate(c);assertGameInvariants(game);
 const r=c.records.games[game.input.simulationKey];if(game.status!=='FINAL'||!r)throw new RangeError('PRO_AWARD_GAME_NOT_COMMITTED');
 if(r.scope.phase!=='REGULAR'||!leagues.includes(r.scope.leagueKey))return c;
 if(game.input.competition!==r.scope.phase||canonicalJson(Object.keys(r.teams).sort())!==canonicalJson(game.input.teams.map(t=>t.simulationKey).sort()))throw new RangeError('PRO_AWARD_GAME_SCOPE');
 const appearances:AwardGame['appearances']={};
 for(const team of game.input.teams){
  let complete=true;const usedPositions=new Set<string>();
  for(const f of team.fielders){
   const position=(f as typeof f&{position?:unknown}).position;
   if(position===undefined){complete=false;continue;}
   if(typeof position!=='string'||!FIELD_POSITIONS.includes(position as typeof FIELD_POSITIONS[number])||usedPositions.has(position))throw new RangeError('INVALID_PRO_AWARD_POSITION');
   usedPositions.add(position);
   const hitter=team.lineup.find(p=>p.simulationKey===f.simulationKey),defenseUnits=hitter?.abilities.DEFENSE;
   if(!hitter||!Number.isSafeInteger(defenseUnits)||defenseUnits!<UNITS_PER_POINT||defenseUnits!>100*UNITS_PER_POINT||r.batting[hitter.simulationKey]?.fieldingGames!==1)throw new RangeError('INVALID_PRO_AWARD_DEFENSE');
   appearances[f.simulationKey]={teamKey:team.simulationKey,position,defenseUnits:defenseUnits!};
  }
  // DH is provable only when every defensive slot is known in this immutable lineup.
  if(complete)for(const h of team.lineup)if(!team.fielders.some(f=>f.simulationKey===h.simulationKey))appearances[h.simulationKey]={teamKey:team.simulationKey,position:'DH',defenseUnits:0};
  for(const p of team.pitchers)if(r.pitching[p.simulationKey])appearances[p.simulationKey]={teamKey:team.simulationKey,position:p.role,defenseUnits:0};
 }
 const proof:AwardGame={gameKey:r.gameKey,scope:{...r.scope},worldDay:r.worldDay,appearances},l=ledger(c),old=l.games[r.gameKey];
 if(old){if(canonicalJson(old)!==canonicalJson(proof))throw new RangeError('PRO_AWARD_GAME_EVIDENCE_REUSED');return c;}
 return {...c,proAwards:{...l,games:{...l.games,[r.gameKey]:proof}}};
}

interface Candidate {playerKey:string;position:string|null;positionGames:number;denominator:number;score:number;teamGames:number;starts:number;relief:number;saves:number;ERA:number;AVG:number|null;z:number;kind:'HITTER'|'PITCHER'}
function candidates(records:RecordLedger,l:CareerProAwardLedger,seasonKey:string,leagueKey:string):Candidate[]{
 const totals=recordTotals(records,{seasonKey,leagueKey,phase:'REGULAR'}),proofs=Object.values(l.games).filter(g=>g.scope.seasonKey===seasonKey&&g.scope.leagueKey===leagueKey&&Object.hasOwn(records.games,g.gameKey));
 const result:Candidate[]=[];
 const assignment=(key:string)=>{
  const counts=new Map<string,number>();let defense=0,known=0,teamGames=0;
  for(const g of proofs){const p=g.appearances[key];if(!p)continue;counts.set(p.position,(counts.get(p.position)??0)+1);known++;if(p.position!=='DH')defense+=p.defenseUnits/UNITS_PER_POINT/100*.1;teamGames=Math.max(teamGames,totals.teams[p.teamKey]?.games??0);}
  const best=[...counts].sort((a,b)=>b[1]-a[1]||compareId(a[0],b[0]))[0];return {position:best?.[0]??null,positionGames:best?.[1]??0,defense,known,teamGames};
 };
 for(const [playerKey,b]of Object.entries(totals.batting)){
  const a=assignment(playerKey),OPS=battingRates(b).OPS??0;
  // Missing historical defense cannot be silently replaced with current position/ability.
  if(a.known!==b.games)continue;
  result.push({playerKey,position:a.position,positionGames:a.positionGames,denominator:b.PA,score:b.PA*Math.max(0,OPS-.5)+a.defense,teamGames:a.teamGames,starts:0,relief:0,saves:0,ERA:Infinity,AVG:battingRates(b).AVG,z:0,kind:'HITTER'});
 }
 for(const [playerKey,p]of Object.entries(totals.pitching)){
  const a=assignment(playerKey),ERA=pitchingRates(p).ERA??Infinity;
  result.push({playerKey,position:a.position,positionGames:a.positionGames,denominator:p.outs,score:p.outs*Math.max(0,6-ERA)/3+p.K*.05,teamGames:a.teamGames,starts:p.starts,relief:p.games-p.starts,saves:p.SV,ERA,AVG:null,z:0,kind:'PITCHER'});
 }
 return result;
}
const ranked=(a:Candidate,b:Candidate)=>b.score-a.score||b.denominator-a.denominator||compareId(a.playerKey,b.playerKey);
function zScores(rows:Candidate[]):Candidate[]{
 return rows.map(r=>{const group=rows.filter(x=>x.kind===r.kind),mean=group.reduce((n,x)=>n+x.score,0)/group.length,sd=Math.sqrt(group.reduce((n,x)=>n+(x.score-mean)**2,0)/group.length);return {...r,z:sd===0?0:(r.score-mean)/sd};});
}
/** Formula 08. Rate titles retain every exact tie; deterministic single-award ties use exposure then immutable ID. */
export function calculateProSeasonAwards(records:RecordLedger,l:CareerProAwardLedger,seasonKey:string,leagueKey:string,firstProSeasonByPlayer:Readonly<Record<string,string>>={}):ProAward[]{
 const rows=candidates(records,l,seasonKey,leagueKey),awards:ProAward[]=[];
 const choose=(awardType:ProAwardType,eligible:Candidate[],compare=ranked)=>{const r=[...eligible].sort(compare)[0];if(r)awards.push({awardType,playerKey:r.playerKey,score:r.score});};
 const qualified=rows.filter(r=>r.denominator>=(r.kind==='HITTER'?200:150));
 const zRank=(a:Candidate,b:Candidate)=>b.z-a.z||b.denominator-a.denominator||compareId(a.playerKey,b.playerKey);
 choose('MVP',zScores(qualified),zRank);
 choose('ROOKIE',zScores(qualified.filter(r=>firstProSeasonByPlayer[r.playerKey]===seasonKey)),zRank);
 for(const position of FIELD_POSITIONS)choose(`POSITION_${position}`,rows.filter(r=>r.kind==='HITTER'&&r.position===position&&r.positionGames>=50));
 choose('SP',rows.filter(r=>r.kind==='PITCHER'&&r.starts>=15));
 choose('RP',rows.filter(r=>r.kind==='PITCHER'&&r.relief>=30));
 choose('CP',rows.filter(r=>r.kind==='PITCHER'&&r.saves>0),(a,b)=>b.saves-a.saves||a.ERA-b.ERA||b.denominator-a.denominator||compareId(a.playerKey,b.playerKey));
 for(const type of ['AVG','ERA']as const){const eligible=rows.filter(r=>r.teamGames>0&&(type==='AVG'?r.kind==='HITTER'&&r.denominator>=Math.ceil(r.teamGames*3.1)&&r.AVG!==null:r.kind==='PITCHER'&&r.denominator>=r.teamGames*3&&Number.isFinite(r.ERA)));const value=(r:Candidate)=>type==='AVG'?r.AVG!:r.ERA;if(eligible.length){const best=(type==='AVG'?Math.max:Math.min)(...eligible.map(value));for(const r of eligible.filter(r=>value(r)===best).sort((a,b)=>compareId(a.playerKey,b.playerKey)))awards.push({awardType:type,playerKey:r.playerKey,score:best});}}
 return awards;
}
/** Canonical 08 cumulative rule. Call only for a title whose metric is explicitly defined by the product. */
export function positiveCumulativeAwardLeaders(values:Readonly<Record<string,number>>):string[]{
 if(Object.values(values).some(v=>!Number.isSafeInteger(v)||v<0))throw new RangeError('INVALID_CUMULATIVE_AWARD_VALUE');const best=Math.max(0,...Object.values(values));return best===0?[]:Object.keys(values).filter(k=>values[k]===best).sort(compareId);
}
function schedules(c:AwardCareer):readonly ScheduledGame[]{return isUs(c)?Object.values(c.seasonSchedule?.leagues??{}).flat():Object.values(c.competitionSchedule?.leagues??{}).flat();}
function notice(c:AwardCareer,l:CareerProAwardLedger,id:'E25'|'E29',season:string,day:number,league:string,fields:Record<string,string>){
 const d=eventDefinition(id),event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:season,evidence:{version:1,type:d.evidenceDomain,fields},resume:{worldKey:c.world.worldKey,seasonKey:season,phase:c.phaseContext.phase,competitionKey:league,registrationKey:isUs(c)?c.protagonistOrganizationId:c.protagonistClubId,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:day});
 if(!l.notices.some(e=>e.eventKey===event.eventKey))l.notices=[...l.notices,event];
}
/** Observe a fully closed day; publication waits for every fixture through the exact league midpoint. */
export function refreshProCareerAwards<T extends AwardCareer>(c:T,closedDay?:number,firstProSeasonByPlayer:Readonly<Record<string,string>>={}):T {
 validate(c);if(c.phaseContext.phase==='ARCHIVED'||c.phaseContext.phase==='EVENT_DECISION'||('pendingGame'in c.phaseContext&&c.phaseContext.pendingGame))return c;
 if(closedDay!==undefined&&(!Number.isSafeInteger(closedDay)||closedDay<0))throw new RangeError('INVALID_PRO_AWARD_DAY');
 const l=structuredClone(ledger(c)),season=c.world.seasonKey,all=schedules(c).filter(g=>g.seasonKey===season&&!g.phase&&leagues.includes(g.leagueKey));
 for(const league of [...new Set(all.map(g=>g.leagueKey))].sort(compareId)){
  const fixtures=all.filter(g=>g.leagueKey===league).sort((a,b)=>a.worldDay-b.worldDay||compareId(a.simulationKey,b.simulationKey));
  if(new Set(fixtures.map(g=>g.simulationKey)).size!==fixtures.length)throw new RangeError('DUPLICATE_PRO_AWARD_FIXTURE');
  const midpoint=fixtures[Math.ceil(fixtures.length/2)-1]!.worldDay,last=fixtures.at(-1)!.worldDay;
  const committed=(g:ScheduledGame)=>{const r=c.records.games[g.simulationKey];return !!r&&r.scope.phase==='REGULAR'&&r.scope.leagueKey===league&&r.scope.seasonKey===season&&r.worldDay===g.worldDay&&Object.hasOwn(r.teams,g.awayTeamKey)&&Object.hasOwn(r.teams,g.homeTeamKey);};
  if(closedDay!==undefined&&closedDay>=midpoint&&!l.allStars.some(r=>r.seasonKey===season&&r.leagueKey===league)&&fixtures.filter(g=>g.worldDay<=midpoint).every(committed)){
   const records={revision:c.records.revision,games:Object.fromEntries(Object.entries(c.records.games).filter(([,r])=>r.worldDay<=midpoint))},rows=candidates(records,l,season,league),selected:ProAllStarReceipt['selected'][number][]=[];
   const teamSeasonGames=new Map<string,number>();for(const g of fixtures)for(const team of [g.awayTeamKey,g.homeTeamKey])teamSeasonGames.set(team,(teamSeasonGames.get(team)??0)+1);
   for(const position of positions){const eligible=rows.filter(r=>r.position===position&&r.teamGames>0&&r.denominator>=Math.ceil((r.kind==='HITTER'?3.1:3)*Math.max(...Object.values(l.games).filter(g=>g.scope.seasonKey===season&&g.scope.leagueKey===league&&g.worldDay<=midpoint&&g.appearances[r.playerKey]).map(g=>teamSeasonGames.get(g.appearances[r.playerKey]!.teamKey)??0),0)/2)).sort(ranked);selected.push(...eligible.slice(0,Math.ceil(eligible.length*.25)).map(r=>({playerKey:r.playerKey,position,score:r.score})));}
   const receipt:ProAllStarReceipt={receiptKey:receiptKey(c,'allstar',season,league),seasonKey:season,leagueKey:league,worldDay:midpoint,selected};l.allStars=[...l.allStars,receipt];
   if(selected.some(r=>r.playerKey===c.protagonistKey)&&!l.notices.some(e=>e.definitionId==='E25'&&e.seasonKey===season))notice(c,l,'E25',season,midpoint,league,{playerOrTeamSimulationKey:c.protagonistKey,worldSeasonId:season,windowType:'ALL_STAR'});
  }
  if((c.phaseContext.phase==='SEASON_REVIEW'||closedDay!==undefined&&closedDay>=last)&&fixtures.every(committed)&&!l.annual.some(r=>r.seasonKey===season&&r.leagueKey===league)){
   const awards=calculateProSeasonAwards(c.records,l,season,league,firstProSeasonByPlayer),receipt:ProAwardReceipt={receiptKey:receiptKey(c,'annual',season,league),seasonKey:season,leagueKey:league,worldDay:last,awards};
   l.annual=[...l.annual,receipt];for(const a of awards.filter(a=>a.playerKey===c.protagonistKey)){const milestoneKey=JSON.stringify(['first-pro-award',a.awardType]);if(!l.notices.some(e=>e.definitionId==='E29'&&e.evidence.fields.milestoneKey===milestoneKey))notice(c,l,'E29',season,last,league,{playerSimulationKey:c.protagonistKey,milestoneKey});}
  }
 }
 return canonicalJson(l)===canonicalJson(ledger(c))?c:{...c,proAwards:l};
}
export function resolveProCareerAwardEvent<T extends AwardCareer>(c:T,revision:number,input:{eventKey:string;eventVersion:number;command:'ACK_EVENT'}){
 if(isUs(c))assertUsCareerRevision(c,revision);else assertKboCareerRevision(c,revision);validate(c);
 if(c.phaseContext.phase==='ARCHIVED'||c.phaseContext.phase==='EVENT_DECISION'||('pendingGame'in c.phaseContext&&c.phaseContext.pendingGame))throw new RangeError('INVALID_PRO_AWARD_PHASE');
 const l=ledger(c),event=l.notices.find(e=>e.eventKey===input.eventKey);if(!event)throw new RangeError('PRO_AWARD_EVENT_NOT_FOUND');
 const result=resolveEventChoice(event,input.eventVersion,input.command,input,{worldKey:c.world.worldKey,seasonKey:event.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['ACK_EVENT']});
 return {career:{...c,revision:revision+1,proAwards:{...l,notices:l.notices.map(e=>e.eventKey===event.eventKey?result.event:e)}}as T,navigation:result.navigation};
}
export function proCareerAwardsView(c:AwardCareer){validate(c);const l=ledger(c);return {annual:structuredClone(l.annual),allStars:structuredClone(l.allStars),notices:l.notices.filter(e=>e.status==='OPEN').map(e=>({eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:eventDefinition(e.definitionId).title,body:eventDefinition(e.definitionId).body,commands:['ACK_EVENT']as const}))};}
