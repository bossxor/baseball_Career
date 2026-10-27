import { nextFloat, nextInteger } from './rng.js';
import type { RngState } from './rng.js';

export interface Injury { severity:'MILD'|'MEDIUM'|'MAJOR'; remainingTeamGames:number|null; diagnosedGameKey:string; seasonKey:string }
export interface HealthGame {
  gameKey:string; teamKey:string; seasonKey:string; day:number;
  roster:readonly string[]; appearances:readonly {playerKey:string;riskFatigue:number}[];
}
export interface HealthResult { injured:string[]; recovered:string[] }
export interface HealthLedger {
  schemaVersion:1; rng:RngState;
  injuries:Record<string,Injury>;
  games:readonly {evidence:HealthGame;result:HealthResult}[];
  closedSeasons:readonly string[];
}
const key=(s:string)=>typeof s==='string' && s.length>0 && s.length<=128;
export function injuryProbability(fatigue:number):number {
  if(!Number.isFinite(fatigue) || fatigue<0 || fatigue>100)throw new RangeError('INVALID_RISK_FATIGUE');
  return fatigue>80?.003:.0015;
}
export function createHealthLedger(rng:RngState):HealthLedger {
  return {schemaVersion:1,rng:{...rng},injuries:Object.create(null) as Record<string,Injury>,games:[],closedSeasons:[]};
}
function validateHealthLedger(source:HealthLedger):void {
  if(source.schemaVersion!==1 || new Set(source.closedSeasons).size!==source.closedSeasons.length || source.closedSeasons.some(s=>!key(s)))throw new RangeError('INVALID_HEALTH_LEDGER');
  for(const [player,injury] of Object.entries(source.injuries)){
    if(!key(player) || !key(injury.diagnosedGameKey) || !key(injury.seasonKey) || !['MILD','MEDIUM','MAJOR'].includes(injury.severity))throw new RangeError('INVALID_INJURY');
    if(injury.severity==='MAJOR'?injury.remainingTeamGames!==null:!Number.isSafeInteger(injury.remainingTeamGames) || injury.remainingTeamGames!<1 || injury.remainingTeamGames!>(injury.severity==='MILD'?7:30))throw new RangeError('INVALID_INJURY_DURATION');
    if(!source.games.some(g=>g.evidence.gameKey===injury.diagnosedGameKey && g.evidence.seasonKey===injury.seasonKey && g.result.injured.includes(player)))throw new RangeError('MISSING_INJURY_EVIDENCE');
    if(injury.severity==='MAJOR' && source.closedSeasons.includes(injury.seasonKey))throw new RangeError('CLOSED_SEASON_INJURY');
  }
}
function canonicalGame(input:HealthGame):HealthGame {
  if(!key(input.gameKey) || !key(input.teamKey) || !key(input.seasonKey) || !Number.isSafeInteger(input.day) || input.day<0 || input.roster.length===0 || new Set(input.roster).size!==input.roster.length || input.roster.some(p=>!key(p)) || new Set(input.appearances.map(p=>p.playerKey)).size!==input.appearances.length)throw new RangeError('INVALID_HEALTH_GAME');
  for(const p of input.appearances){if(!input.roster.includes(p.playerKey))throw new RangeError('UNREGISTERED_APPEARANCE');injuryProbability(p.riskFatigue);}
  return {...input,roster:[...input.roster].sort(),appearances:input.appearances.map(p=>({...p})).sort((a,b)=>a.playerKey<b.playerKey?-1:a.playerKey>b.playerKey?1:0)};
}
/** Caller supplies FINAL game evidence and the once-per-day post-appearance fatigue snapshot. */
export function settleTeamGameHealth(source:HealthLedger,input:HealthGame):{ledger:HealthLedger;result:HealthResult;duplicate:boolean} {
  const evidence=canonicalGame(input);
  validateHealthLedger(source);
  const old=source.games.find(g=>g.evidence.gameKey===input.gameKey && g.evidence.teamKey===input.teamKey);
  if(old){if(JSON.stringify(old.evidence)!==JSON.stringify(evidence))throw new RangeError('CHANGED_HEALTH_EVIDENCE');return {ledger:source,result:structuredClone(old.result),duplicate:true};}
  if(source.closedSeasons.includes(input.seasonKey))throw new RangeError('SEASON_HEALTH_CLOSED');
  for(const previous of source.games)if(previous.evidence.seasonKey===input.seasonKey){
    if(previous.evidence.teamKey===input.teamKey && previous.evidence.day>=input.day)throw new RangeError('NON_CHRONOLOGICAL_TEAM_GAME');
    if(previous.evidence.day>=input.day && previous.evidence.roster.some(p=>input.roster.includes(p)))throw new RangeError('NON_CHRONOLOGICAL_PLAYER_TEAM_GAME');
  }
  for(const p of evidence.appearances)if(Object.hasOwn(source.injuries,p.playerKey))throw new RangeError('INJURED_APPEARANCE');
  const ledger:HealthLedger={...source,rng:{...source.rng},injuries:structuredClone(source.injuries)},injuries=Object.assign(Object.create(null) as Record<string,Injury>,ledger.injuries);ledger.injuries=injuries;
  const result:HealthResult={injured:[],recovered:[]};
  // Existing injuries tick first. The diagnosis game never consumes its own recovery period.
  for(const player of evidence.roster){const injury=Object.hasOwn(injuries,player)?injuries[player]:undefined;if(!injury || injury.remainingTeamGames===null)continue;
    injury.remainingTeamGames--;if(injury.remainingTeamGames===0){delete injuries[player];result.recovered.push(player);}}
  for(const appearance of evidence.appearances){const risk=nextFloat(ledger.rng);ledger.rng=risk.state;if(risk.value>=injuryProbability(appearance.riskFatigue))continue;
    const severity=nextFloat(ledger.rng);ledger.rng=severity.state;
    let injury:Injury;
    if(severity.value<.8){const length=nextInteger(ledger.rng,5);ledger.rng=length.state;injury={severity:'MILD',remainingTeamGames:3+length.value,diagnosedGameKey:input.gameKey,seasonKey:input.seasonKey};}
    else if(severity.value<.98){const length=nextInteger(ledger.rng,23);ledger.rng=length.state;injury={severity:'MEDIUM',remainingTeamGames:8+length.value,diagnosedGameKey:input.gameKey,seasonKey:input.seasonKey};}
    else injury={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:input.gameKey,seasonKey:input.seasonKey};
    injuries[appearance.playerKey]=injury;result.injured.push(appearance.playerKey);
  }
  ledger.games=[...ledger.games,{evidence,result:structuredClone(result)}];return {ledger,result,duplicate:false};
}
/** Season closure is a domain operation; calendar rest days never call this or the game reducer. */
export function closeSeasonHealth(source:HealthLedger,seasonKey:string):{ledger:HealthLedger;recovered:string[]} {
  validateHealthLedger(source);
  if(!key(seasonKey))throw new RangeError('INVALID_SEASON_KEY');
  if(source.closedSeasons.includes(seasonKey))return {ledger:source,recovered:[]};
  const ledger:HealthLedger={...source,rng:{...source.rng},injuries:structuredClone(source.injuries)},recovered:string[]=[];
  for(const player of Object.keys(ledger.injuries).sort()){const injury=ledger.injuries[player]!;if(injury.severity==='MAJOR' && injury.seasonKey===seasonKey){delete ledger.injuries[player];recovered.push(player);}}
  ledger.closedSeasons=[...ledger.closedSeasons,seasonKey];return {ledger,recovered};
}
