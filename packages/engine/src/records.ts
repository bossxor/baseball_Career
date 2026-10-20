import type {GameState,PlayLog,BattingLine,PitchingLine} from './types.js';
import type {Hand,BatSide,PitchForm} from './probabilities.js';
import {assertGameInvariants,canonicalJson} from './game.js';
import {emptyBatting,emptyPitching} from './stats.js';
export interface RecordScope {seasonKey:string;leagueKey:string;phase:'REGULAR'|'POSTSEASON'|'INTERNATIONAL'}
export interface MatchupLine {PA:number;AB:number;H:number;BB:number;HBP:number;K:number;TB:number;HR:number;twoB:number;threeB:number;RBI:number}
export interface PitchSplit {BF:number;outs:number;AB:number;H:number;TB:number;HR:number;BB:number;HBP:number;K:number}
export interface BattingTotals extends BattingLine {twoB:number;threeB:number;games:number;fieldingGames:number;loadedHits:number;walkoffHits:number;extraHomeSuccesses:number}
export interface PitchingTotals extends PitchingLine {games:number;starts:number;starterOuts:number;loadedBF:number;W:number;L:number;SV:number;HLD:number;BS:number;shutouts:number}
export interface GameContribution {
  gameKey:string;worldDay:number;scope:RecordScope;
  teams:Record<string,{games:number;W:number;L:number;T:number;R:number;RA:number}>;
  batting:Record<string,BattingTotals>;pitching:Record<string,PitchingTotals>;
  batterSplits:Record<string,Record<Hand,MatchupLine>>;pitcherSplits:Record<string,Record<Hand,PitchSplit>>;
  matchups:Record<string,{batterKey:string;pitcherKey:string;stats:MatchupLine}>;
}
export interface RecordLedger {revision:number;games:Record<string,GameContribution>}
const dictionary=<T>():Record<string,T>=>Object.create(null) as Record<string,T>;
export const emptyRecordLedger=():RecordLedger=>({revision:0,games:dictionary<GameContribution>()});
const matchup=():MatchupLine=>({PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0});
const pitchSplit=():PitchSplit=>({BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0});
export interface IdentityPlayRecord extends PlayLog {logSchemaVersion:2;batterBatsAtTime:BatSide;effectiveBatSide:Hand;pitcherThrowsAtTime:Hand;pitcherFormAtTime:PitchForm}
/** 122 v2 persistence projection: identity comes from this game's immutable input, never live player rows. */
export function identityPlayRecords(game:GameState):IdentityPlayRecord[] {
  return game.plays.map(play=>{
    const batter=game.input.teams.flatMap(t=>t.lineup).find(p=>p.simulationKey===play.batterKey),pitcher=game.input.teams.flatMap(t=>t.pitchers).find(p=>p.simulationKey===play.pitcherKey);
    if(!batter || !pitcher) throw new RangeError('MISSING_GAME_IDENTITY');
    const side=batter.bats==='S'?(pitcher.throws==='R'?'L':'R'):batter.bats;
    if(side!==play.batterSide || pitcher.throws!==play.pitcherThrows) throw new RangeError('INCONSISTENT_IDENTITY_SNAPSHOT');
    return {...structuredClone(play),logSchemaVersion:2,batterBatsAtTime:batter.bats,effectiveBatSide:play.batterSide,pitcherThrowsAtTime:play.pitcherThrows,pitcherFormAtTime:pitcher.pitchForm};
  });
}
function addMatchup(line:MatchupLine,play:PlayLog):void {
  line.PA++;if(play.outcome==='BB')line.BB++;else if(play.outcome==='HBP')line.HBP++;else {
    line.AB++;if(play.outcome==='K')line.K++;
    if(['1B','2B','3B','HR'].includes(play.outcome)){line.H++;line.TB+=play.outcome==='HR'?4:Number(play.outcome[0]);if(play.outcome==='2B')line.twoB++;if(play.outcome==='3B')line.threeB++;if(play.outcome==='HR')line.HR++;}
  }
  line.RBI+=play.scored.length;
}
function validateScope(scope:RecordScope):void {if(!scope.seasonKey || !scope.leagueKey || !['REGULAR','POSTSEASON','INTERNATIONAL'].includes(scope.phase)) throw new RangeError('INVALID_RECORD_SCOPE');}
export function buildGameContribution(game:GameState,scope:RecordScope,worldDay:number):GameContribution {
  validateScope(scope);assertGameInvariants(game);
  if(game.status!=='FINAL' || !game.decisions) throw new RangeError('GAME_NOT_FINAL');
  if(scope.phase!==game.input.competition || !Number.isSafeInteger(worldDay) || worldDay<0) throw new RangeError('INVALID_GAME_CONTRIBUTION');
  const batting:GameContribution['batting']=dictionary(),pitching:GameContribution['pitching']=dictionary(),teams:GameContribution['teams']=dictionary();
  const batterSplits:GameContribution['batterSplits']=dictionary(),pitcherSplits:GameContribution['pitcherSplits']=dictionary(),matchups:GameContribution['matchups']=dictionary();
  for(const [teamIndex,team] of game.input.teams.entries()) {
    const own=game.scores[teamIndex]!,other=game.scores[teamIndex===0?1:0];
    teams[team.simulationKey]={games:1,W:own>other?1:0,L:own<other?1:0,T:own===other?1:0,R:own,RA:other};
    for(const hitter of team.lineup) {const key=hitter.simulationKey;batting[key]={...game.batting[key]!,twoB:0,threeB:0,games:1,fieldingGames:team.fielders.some(f=>f.simulationKey===key)?1:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};batterSplits[key]={L:matchup(),R:matchup()};}
    for(const pitcher of team.pitchers) {
      const key=pitcher.simulationKey,appearance=game.appearances.find(a=>a.pitcherKey===key),line=game.pitching[key]!;
      if(!appearance || line.BF===0)continue;
      const sole=game.appearances.filter(a=>a.team===teamIndex && game.pitching[a.pitcherKey]!.BF>0).length===1;
      pitching[key]={...line,games:1,starts:appearance.starter?1:0,starterOuts:appearance.starter?line.outs:0,loadedBF:0,W:game.decisions.W===key?1:0,L:game.decisions.L===key?1:0,SV:game.decisions.SV===key?1:0,HLD:game.decisions.HLD.includes(key)?1:0,BS:game.decisions.BS.includes(key)?1:0,shutouts:appearance.starter && sole && own>other && other===0 && line.outs>=27?1:0};
      pitcherSplits[key]={L:pitchSplit(),R:pitchSplit()};
    }
  }
  const records=identityPlayRecords(game);
  for(const play of records) {
    const b=batting[play.batterKey]!,p=pitching[play.pitcherKey]!,bs=batterSplits[play.batterKey]![play.pitcherThrowsAtTime],ps=pitcherSplits[play.pitcherKey]![play.effectiveBatSide];
    const pairKey=JSON.stringify([play.batterKey,play.pitcherKey]);
    const pair=matchups[pairKey]??{batterKey:play.batterKey,pitcherKey:play.pitcherKey,stats:matchup()};addMatchup(pair.stats,play);matchups[pairKey]=pair;
    addMatchup(bs,play);ps.BF++;ps.outs+=play.outsAdded;
    const delta=matchup();addMatchup(delta,play);for(const key of ['AB','H','TB','HR','BB','HBP','K'] as const)ps[key]+=delta[key];
    if(play.outcome==='2B')b.twoB++;if(play.outcome==='3B')b.threeB++;
    if(play.basesBefore.every(Boolean)){p.loadedBF++;if(['1B','2B','3B','HR'].includes(play.outcome))b.loadedHits++;}
    for(const attempt of play.attempts)if(attempt.kind==='EXTRA_HOME' && attempt.success)batting[attempt.runnerKey]!.extraHomeSuccesses++;
  }
  const last=records[records.length-1];
  if(last && last.half==='BOTTOM' && last.scored.length>0 && game.scores[1]>game.scores[0] && ['1B','2B','3B','HR'].includes(last.outcome))batting[last.batterKey]!.walkoffHits=1;
  const result={gameKey:game.input.simulationKey,worldDay,scope:{...scope},teams,batting,pitching,batterSplits,pitcherSplits,matchups};assertContributionSplits(result);return result;
}
export function assertContributionSplits(c:GameContribution):void {
  if(!c.gameKey || !Number.isSafeInteger(c.worldDay) || c.worldDay<0)throw new RangeError('INVALID_GAME_CONTRIBUTION');
  for(const rows of [c.teams,c.batting,c.pitching])for(const row of Object.values(rows))for(const value of Object.values(row))if(typeof value!=='number' || !Number.isSafeInteger(value) || value<0)throw new RangeError('INVALID_CONTRIBUTION_COUNT');
  const pairSums:Record<string,MatchupLine>=dictionary(),pitchPairSums:Record<string,MatchupLine>=dictionary();
  for(const [key,pair] of Object.entries(c.matchups)) {
    if(key!==JSON.stringify([pair.batterKey,pair.pitcherKey]) || !c.batting[pair.batterKey] || !c.pitching[pair.pitcherKey])throw new RangeError('INVALID_MATCHUP_KEY');
    pairSums[pair.batterKey]??=matchup();sum(pairSums[pair.batterKey]!,pair.stats);pitchPairSums[pair.pitcherKey]??=matchup();sum(pitchPairSums[pair.pitcherKey]!,pair.stats);
  }
  for(const [id,line] of Object.entries(c.batting)) {
    const split=c.batterSplits[id];if(!split)throw new RangeError('MISSING_SPLITS');
    for(const key of ['PA','AB','H','BB','HBP','K','TB','HR','twoB','threeB','RBI'] as const)if(split.L[key]+split.R[key]!==line[key] || (pairSums[id]?.[key]??0)!==line[key])throw new RangeError('BATTING_SPLIT_MISMATCH');
  }
  for(const [id,line] of Object.entries(c.pitching)) {
    const split=c.pitcherSplits[id];if(!split)throw new RangeError('MISSING_SPLITS');
    for(const key of ['BF','outs','H','HR','BB','HBP','K'] as const)if(split.L[key]+split.R[key]!==line[key])throw new RangeError('PITCHING_SPLIT_MISMATCH');
    const pairs=pitchPairSums[id];if(!pairs || pairs.PA!==line.BF)throw new RangeError('PITCHING_MATCHUP_MISMATCH');
    for(const key of ['AB','H','TB','HR','BB','HBP','K'] as const)if(split.L[key]+split.R[key]!==pairs[key])throw new RangeError('PITCHING_MATCHUP_MISMATCH');
  }
}
/** Pure atomic replacement; caller must authorize official corrections and persist the returned revision with its receipt. */
export function putGameContribution(source:RecordLedger,contribution:GameContribution,officialCorrection=false):{ledger:RecordLedger;duplicate:boolean;corrected:boolean} {
  validateScope(contribution.scope);assertContributionSplits(contribution);
  const old=Object.hasOwn(source.games,contribution.gameKey)?source.games[contribution.gameKey]:undefined;
  if(!old) {
    const actual=new Set([...Object.keys(contribution.batting),...Object.keys(contribution.pitching)]);
    for(const other of Object.values(source.games))if(other.scope.seasonKey===contribution.scope.seasonKey && other.worldDay===contribution.worldDay && [...Object.keys(other.batting),...Object.keys(other.pitching)].some(id=>actual.has(id)))throw new RangeError('DOUBLE_BOOKED_PLAYER');
  }
  if(old && canonicalJson(old)===canonicalJson(contribution))return {ledger:structuredClone(source),duplicate:true,corrected:false};
  if(old && !officialCorrection)throw new RangeError('GAME_EVIDENCE_REUSED');
  if(old && (canonicalJson(old.scope)!==canonicalJson(contribution.scope) || old.worldDay!==contribution.worldDay || canonicalJson(old.teams)!==canonicalJson(contribution.teams)))throw new RangeError('CORRECTION_SCOPE_CHANGED');
  return {ledger:{revision:source.revision+1,games:{...structuredClone(source.games),[contribution.gameKey]:structuredClone(contribution)}},duplicate:false,corrected:!!old};
}
function sum<T extends object>(target:T,delta:T):void {for(const key of Object.keys(delta) as (keyof T)[]){const next=Number(target[key])+Number(delta[key]);if(!Number.isSafeInteger(next) || next<0)throw new RangeError('INVALID_RECORD_SUM');target[key]=next as T[keyof T];}}
export function recordTotals(source:RecordLedger,filter:{leagueKey:string;phase:RecordScope['phase'];seasonKey?:string}) {
  if(!filter.leagueKey || !['REGULAR','POSTSEASON','INTERNATIONAL'].includes(filter.phase))throw new RangeError('INVALID_RECORD_FILTER');
  const batting:GameContribution['batting']=dictionary(),pitching:GameContribution['pitching']=dictionary(),matchups:GameContribution['matchups']=dictionary(),batterSplits:GameContribution['batterSplits']=dictionary(),pitcherSplits:GameContribution['pitcherSplits']=dictionary();
  const teams:GameContribution['teams']=dictionary();
  for(const c of Object.values(source.games).filter(c=>c.scope.leagueKey===filter.leagueKey && c.scope.phase===filter.phase && (filter.seasonKey===undefined || c.scope.seasonKey===filter.seasonKey))) {
    for(const [id,line] of Object.entries(c.teams)){teams[id]??={games:0,W:0,L:0,T:0,R:0,RA:0};sum(teams[id]!,line);}
    for(const [id,line] of Object.entries(c.batting)){batting[id]??={...emptyBatting(),twoB:0,threeB:0,games:0,fieldingGames:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};sum(batting[id]!,line);batterSplits[id]??={L:matchup(),R:matchup()};sum(batterSplits[id]!.L,c.batterSplits[id]!.L);sum(batterSplits[id]!.R,c.batterSplits[id]!.R);}
    for(const [id,line] of Object.entries(c.pitching)){pitching[id]??={...emptyPitching(),games:0,starts:0,starterOuts:0,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0};sum(pitching[id]!,line);pitcherSplits[id]??={L:pitchSplit(),R:pitchSplit()};sum(pitcherSplits[id]!.L,c.pitcherSplits[id]!.L);sum(pitcherSplits[id]!.R,c.pitcherSplits[id]!.R);}
    for(const [key,pair] of Object.entries(c.matchups)){matchups[key]??={batterKey:pair.batterKey,pitcherKey:pair.pitcherKey,stats:matchup()};sum(matchups[key]!.stats,pair.stats);}
  }
  return {revision:source.revision,teams,batting,pitching,matchups,batterSplits,pitcherSplits};
}
export function splitPitchingRates(line:PitchSplit) {
  const avg=line.AB?line.H/line.AB:null,obp=line.BF?(line.H+line.BB+line.HBP)/line.BF:null,slg=line.AB?line.TB/line.AB:null;
  return {AVG:avg,OPS:obp===null || slg===null?null:obp+slg};
}
export function directDuelOutcome(stats:Pick<MatchupLine,'PA'|'H'|'TB'>):'WIN'|'LOSS'|'NO_DECISION' {
  if(stats.PA<3)return 'NO_DECISION';if(stats.H>=1 && stats.TB>=2)return 'WIN';return stats.H===0?'LOSS':'NO_DECISION';
}
