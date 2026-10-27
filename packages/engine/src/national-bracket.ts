import {RULES_VERSION} from '@playball/rules';
import {canonicalJson,createGame,runGameChunk} from './game.js';
import type {GameState,TeamSnapshot} from './types.js';
import {buildGameContribution} from './records.js';
import type {GameContribution} from './records.js';
import {createStreams,nextInteger} from './rng.js';
import {createSingleRoundRobinSchedule} from './schedule.js';
import {createSeasonCalendar} from './season-calendar.js';
import {rankNationalGroup} from './national-tournament.js';
import type {NationalTournament} from './kbo-national.js';

const STRENGTHS={KOR:65,USA:65,JPN:65,DOM:65,VEN:65,PUR:65,MEX:65,CUB:55,TWN:55,NED:55,CAN:55,AUS:55,PAN:55,COL:55,ITA:45,GBR:45,CZE:45,ISR:45,CHN:45,BRA:45,HKG:55,PHI:45,THA:45,PAK:45} as const;
const NATIONS={WBC:['KOR','USA','JPN','DOM','VEN','PUR','MEX','CUB','TWN','NED','CAN','AUS','PAN','COL','ITA','GBR','CZE','ISR','CHN','BRA'],OLY:['KOR','JPN','USA','TWN','DOM','CUB'],AG:['KOR','JPN','TWN','CHN','HKG','PHI','THA','PAK'],P12:['KOR','JPN','USA','DOM','VEN','PUR','MEX','CUB','TWN','NED','CAN','AUS']} as const;
export function nationalNationPreset(type:NationalTournament):readonly {id:string;strength:65|55|45}[] {
 if(!Object.hasOwn(NATIONS,type))throw new RangeError('INVALID_NATIONAL_TOURNAMENT');
 return NATIONS[type].map(id=>({id,strength:STRENGTHS[id]}));
}
export interface NationalMatch {gameKey:string;stage:'GROUP'|'QF'|'SF'|'BRONZE'|'FINAL';day:number;away:string;home:string}
export interface NationalMatchResult {gameKey:string;winner:string;awayRuns:number;homeRuns:number}
export interface NationalBracket {
 schemaVersion:1;modelVersion:'national-bracket-1';competitionId:string;worldKey:string;seasonKey:string;tournament:NationalTournament;seed:string;
 groups:readonly (readonly string[])[];groupMatches:readonly NationalMatch[];results:readonly NationalMatchResult[];pendingGame:GameState|null;
}
const competitionId=(world:string,year:string,type:NationalTournament)=>JSON.stringify(['national-'+type.toLowerCase(),world,year]);
export function createNationalBracket(input:{worldKey:string;seasonKey:string;tournament:NationalTournament;seed:string}):NationalBracket {
 const {worldKey,seasonKey,tournament,seed}=input;
 if(typeof worldKey!=='string'||!worldKey||typeof seed!=='string'||!seed||typeof seasonKey!=='string'||!/^\d{4}$/.test(seasonKey))throw new RangeError('INVALID_NATIONAL_BRACKET');
 const preset=nationalNationPreset(tournament),slot=createSeasonCalendar(Number(seasonKey)).international.find(s=>s.type===tournament);if(!slot)throw new RangeError('NATIONAL_NOT_SCHEDULED');
 let rng=createStreams(seed,JSON.stringify(['national-bracket-1',worldKey,seasonKey,tournament])).worldCreation;
 const lots=preset.map(p=>p.id).sort();for(let i=lots.length-1;i>0;i--){const d=nextInteger(rng,i+1);rng=d.state;[lots[i],lots[d.value]]=[lots[d.value]!,lots[i]!];}
 const ranked=[...preset].sort((a,b)=>b.strength-a.strength||lots.indexOf(a.id)-lots.indexOf(b.id)),groups:string[][]=Array.from({length:tournament==='WBC'?4:2},()=>[]);
 ranked.forEach((n,i)=>{const block=Math.floor(i/groups.length),column=i%groups.length;groups[block%2?groups.length-1-column:column]!.push(n.id);});
 const id=competitionId(worldKey,seasonKey,tournament),flip=nextInteger(rng,2).value===1,gap=tournament==='P12'?2:3;
 const matches=groups.flatMap((ids,group)=>createSingleRoundRobinSchedule({teamKeys:ids,leagueKey:tournament,seasonKey,startDay:0}).map(g=>({gameKey:JSON.stringify([id,'GROUP',group,g.round,g.awayTeamKey,g.homeTeamKey]),stage:'GROUP' as const,day:slot.startDay+g.round*gap,away:flip?g.homeTeamKey:g.awayTeamKey,home:flip?g.awayTeamKey:g.homeTeamKey}))).sort((a,b)=>a.day-b.day||(a.gameKey<b.gameKey?-1:1));
 return {schemaVersion:1,modelVersion:'national-bracket-1',competitionId:id,worldKey,seasonKey,tournament,seed,groups,groupMatches:matches,results:[],pendingGame:null};
}
function groupRanks(s:NationalBracket):string[][] {
 return s.groups.map(group=>rankNationalGroup(group,s.groupMatches.filter(m=>group.includes(m.away)).map(m=>{
  const r=s.results.find(r=>r.gameKey===m.gameKey);if(!r)throw new RangeError('NATIONAL_GROUP_NOT_FINAL');
  const total=(id:string)=>{const runs=id===m.away?r.awayRuns:r.homeRuns,against=id===m.away?r.homeRuns:r.awayRuns;return {games:1,W:r.winner===id?1:0,L:r.winner===id?0:1,T:0,R:runs,RA:against};};
  return {a:m.away,b:m.home,winner:r.winner,contribution:{teams:{[m.away]:total(m.away),[m.home]:total(m.home)}}};
 }),s.seed+':'+s.competitionId));
}
/** Derive the next round only from FINAL results; a pending game never advances the bracket. */
export function nextNationalMatch(s:NationalBracket):NationalMatch|null {
 const missing=s.groupMatches.find(m=>!s.results.some(r=>r.gameKey===m.gameKey));if(missing)return missing;
 const ranks=groupRanks(s),slot=createSeasonCalendar(Number(s.seasonKey)).international.find(w=>w.type===s.tournament)!;
 const match=(stage:NationalMatch['stage'],n:number,a:string,b:string,offset:number):NationalMatch=>({gameKey:JSON.stringify([s.competitionId,stage,n]),stage,day:slot.startDay+offset,away:a,home:b});
 const result=(m:NationalMatch)=>s.results.find(r=>r.gameKey===m.gameKey),winner=(m:NationalMatch)=>result(m)!.winner;
 let semis:NationalMatch[];
 if(s.tournament==='WBC'){
  const q=[match('QF',0,ranks[0]![0]!,ranks[1]![1]!,15),match('QF',1,ranks[1]![0]!,ranks[0]![1]!,15),match('QF',2,ranks[2]![0]!,ranks[3]![1]!,15),match('QF',3,ranks[3]![0]!,ranks[2]![1]!,15)],unplayed=q.find(m=>!result(m));if(unplayed)return unplayed;
  semis=[match('SF',0,winner(q[0]!),winner(q[1]!),17),match('SF',1,winner(q[2]!),winner(q[3]!),17)];
 }else semis=[match('SF',0,ranks[0]![0]!,ranks[1]![1]!,s.tournament==='P12'?10:9),match('SF',1,ranks[1]![0]!,ranks[0]![1]!,s.tournament==='P12'?10:9)];
 const unplayed=semis.find(m=>!result(m));if(unplayed)return unplayed;
 if(s.tournament!=='WBC'){
  const loser=(m:NationalMatch)=>winner(m)===m.away?m.home:m.away,bronze=match('BRONZE',0,loser(semis[0]!),loser(semis[1]!),12);if(!result(bronze))return bronze;
 }
 const final=match('FINAL',0,winner(semis[0]!),winner(semis[1]!),s.tournament==='WBC'?19:12);return result(final)?null:final;
}
/** Validate stored ordering and seeded draw without replaying any plate appearances or touching world RNG. */
export function assertNationalBracket(s:NationalBracket):void {
 if(!s||s.schemaVersion!==1||s.modelVersion!=='national-bracket-1'||!Array.isArray(s.results))throw new RangeError('INVALID_NATIONAL_BRACKET');
 const base=createNationalBracket(s);if(s.competitionId!==base.competitionId||canonicalJson(s.groups)!==canonicalJson(base.groups)||canonicalJson(s.groupMatches)!==canonicalJson(base.groupMatches))throw new RangeError('CHANGED_NATIONAL_DRAW');
 let replay=base;
 for(const r of s.results){const m=nextNationalMatch(replay);if(!m||!r||r.gameKey!==m.gameKey||![r.awayRuns,r.homeRuns].every(n=>Number.isSafeInteger(n)&&n>=0)||r.awayRuns===r.homeRuns||r.winner!==(r.awayRuns>r.homeRuns?m.away:m.home))throw new RangeError('INVALID_NATIONAL_MATCH_RESULT');replay={...replay,results:[...replay.results,r]};}
 if(s.pendingGame){const m=nextNationalMatch(replay),g=s.pendingGame;if(!m||g.input.simulationKey!==m.gameKey||g.input.competition!=='INTERNATIONAL'||g.input.rulesVersion!==RULES_VERSION||g.input.seed!==s.seed+':'+m.gameKey||g.input.teams[0].simulationKey!==m.away||g.input.teams[1].simulationKey!==m.home||g.status!=='LIVE')throw new RangeError('CHANGED_NATIONAL_PENDING_GAME');}
}
export function prepareNationalMatch(source:NationalBracket,teams:readonly [TeamSnapshot,TeamSnapshot]):NationalBracket {
 assertNationalBracket(source);if(source.pendingGame)throw new RangeError('NATIONAL_GAME_ALREADY_PENDING');const m=nextNationalMatch(source);if(!m)throw new RangeError('NATIONAL_TOURNAMENT_COMPLETE');
 if(teams[0].simulationKey!==m.away||teams[1].simulationKey!==m.home)throw new RangeError('NATIONAL_TEAMS_CHANGED');
 return {...source,pendingGame:createGame({simulationKey:m.gameKey,seed:source.seed+':'+m.gameKey,rulesVersion:RULES_VERSION,competition:'INTERNATIONAL',teams})};
}
/** FINAL publishes a contribution once; limits preserve the full GameState, including20-inning ties. */
export function advanceNationalMatch(source:NationalBracket,maxPlateAppearances=1000):{bracket:NationalBracket;contribution:GameContribution|null;stopReason:'CHUNK_LIMIT'|'ENGINE_LIMIT'|'GAME_FINAL'|'TOURNAMENT_COMPLETE'} {
 assertNationalBracket(source);if(!source.pendingGame)throw new RangeError('NATIONAL_GAME_NOT_PENDING');if(!Number.isSafeInteger(maxPlateAppearances)||maxPlateAppearances<1||maxPlateAppearances>1000)throw new RangeError('INVALID_NATIONAL_CHUNK');
 const out=runGameChunk(source.pendingGame,{plateAppearances:maxPlateAppearances,completedInnings:20}),game=out.state;
 if(game.status!=='FINAL')return {bracket:{...source,pendingGame:game},contribution:null,stopReason:out.stopReason==='ENGINE_LIMIT'?'ENGINE_LIMIT':'CHUNK_LIMIT'};
 const m=nextNationalMatch(source)!,[awayRuns,homeRuns]=game.scores;if(awayRuns===homeRuns)throw new RangeError('NATIONAL_GAME_TIED');
 const bracket:NationalBracket={...source,pendingGame:null,results:[...source.results,{gameKey:m.gameKey,winner:awayRuns>homeRuns?m.away:m.home,awayRuns,homeRuns}]};
 return {bracket,contribution:buildGameContribution(game,{seasonKey:source.seasonKey,leagueKey:source.tournament,phase:'INTERNATIONAL'},m.day),stopReason:nextNationalMatch(bracket)?'GAME_FINAL':'TOURNAMENT_COMPLETE'};
}
