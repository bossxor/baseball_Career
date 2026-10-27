import {canonicalJson} from './game.js';

export type MlbLeague='AL'|'NL';
export type MlbRound='WILD_CARD'|'DIVISION_SERIES'|'CHAMPIONSHIP_SERIES'|'WORLD_SERIES';
export interface MlbPostseasonGame {seriesId:string;gameNumber:number;homeTeamKey:string;awayTeamKey:string;winner:string}
export interface MlbSeries {id:string;league:MlbLeague|'MLB';round:MlbRound;higherSeed:string;lowerSeed:string;winsNeeded:number;higherWins:number;lowerWins:number;games:MlbPostseasonGame[]}
export interface MlbPostseason {schemaVersion:1;seasonKey:string;seeds:Record<MlbLeague,string[]>;worldSeriesPriority:string[];series:MlbSeries[];results:MlbPostseasonGame[];championKey:string|null}
const leagues:readonly MlbLeague[]=['AL','NL'];
function open(id:string,league:MlbSeries['league'],round:MlbRound,higherSeed:string,lowerSeed:string):MlbSeries {
 return {id,league,round,higherSeed,lowerSeed,winsNeeded:round==='WILD_CARD'?2:round==='DIVISION_SERIES'?3:4,higherWins:0,lowerWins:0,games:[]};
}
function initial(seasonKey:string,seeds:Record<MlbLeague,readonly string[]>,priority:readonly string[]):MlbPostseason {
 const keys=leagues.flatMap(l=>seeds[l]);
 if(!seasonKey||keys.length!==12||leagues.some(l=>seeds[l].length!==6)||keys.some(k=>!k)||new Set(keys).size!==12||priority.length!==12||new Set(priority).size!==12||priority.some(k=>!keys.includes(k)))throw new RangeError('INVALID_MLB_POSTSEASON_SEEDS');
 return {schemaVersion:1,seasonKey,seeds:{AL:[...seeds.AL],NL:[...seeds.NL]},worldSeriesPriority:[...priority],series:leagues.flatMap(l=>[open(l+'-WC36',l,'WILD_CARD',seeds[l][2]!,seeds[l][5]!),open(l+'-WC45',l,'WILD_CARD',seeds[l][3]!,seeds[l][4]!)]),results:[],championKey:null};
}
const won=(s:MlbSeries)=>s.higherWins>=s.winsNeeded?s.higherSeed:s.lowerWins>=s.winsNeeded?s.lowerSeed:null;
function nextGame(state:MlbPostseason):Omit<MlbPostseasonGame,'winner'>|null {
 const s=state.series.find(s=>!won(s));if(!s)return null;
 // Game defaults: all WC games at the higher seed; DS 2-2-1; CS/WS 2-3-2.
 const homes=s.round==='WILD_CARD'?[true,true,true]:s.winsNeeded===3?[true,true,false,false,true]:[true,true,false,false,false,true,true],higherHome=homes[s.games.length];
 if(higherHome===undefined)throw new RangeError('INVALID_MLB_SERIES_LENGTH');
 return {seriesId:s.id,gameNumber:s.games.length+1,homeTeamKey:higherHome?s.higherSeed:s.lowerSeed,awayTeamKey:higherHome?s.lowerSeed:s.higherSeed};
}
function apply(state:MlbPostseason,winner:string):void {
 const game=nextGame(state);if(!game)throw new RangeError('MLB_POSTSEASON_COMPLETE');
 if(winner!==game.homeTeamKey&&winner!==game.awayTeamKey)throw new RangeError('INVALID_MLB_POSTSEASON_WINNER');
 const s=state.series.find(s=>s.id===game.seriesId)!,result={...game,winner};s.games.push(result);state.results.push({...result});if(winner===s.higherSeed)s.higherWins++;else s.lowerWins++;
 if(state.series.some(s=>!won(s)))return;
 const stage=state.series.at(-1)!.round,get=(id:string)=>won(state.series.find(s=>s.id===id)!)!;
 if(stage==='WILD_CARD')state.series.push(...leagues.flatMap(l=>[open(l+'-DS1',l,'DIVISION_SERIES',state.seeds[l][0]!,get(l+'-WC45')),open(l+'-DS2',l,'DIVISION_SERIES',state.seeds[l][1]!,get(l+'-WC36'))]));
 else if(stage==='DIVISION_SERIES')for(const l of leagues){const a=get(l+'-DS1'),b=get(l+'-DS2'),higher=state.seeds[l].indexOf(a)<state.seeds[l].indexOf(b)?a:b;state.series.push(open(l+'-CS',l,'CHAMPIONSHIP_SERIES',higher,higher===a?b:a));}
 else if(stage==='CHAMPIONSHIP_SERIES'){const a=get('AL-CS'),b=get('NL-CS'),higher=state.worldSeriesPriority.indexOf(a)<state.worldSeriesPriority.indexOf(b)?a:b;state.series.push(open('MLB-WS','MLB','WORLD_SERIES',higher,higher===a?b:a));}
 else state.championKey=won(s);
}
/** Every restored bracket is replayed from its seeds and winners; edited wins/participants cannot skip a round. */
export function assertMlbPostseason(state:MlbPostseason):void {
 if(state.schemaVersion!==1||!Array.isArray(state.results)||state.results.length>53)throw new RangeError('INVALID_MLB_POSTSEASON');
 const expected=initial(state.seasonKey,state.seeds,state.worldSeriesPriority);for(const result of state.results)apply(expected,result.winner);
 if(canonicalJson(expected)!==canonicalJson(state))throw new RangeError('CHANGED_MLB_POSTSEASON');
}
export function createMlbPostseason(seasonKey:string,seeds:Record<MlbLeague,readonly string[]>,worldSeriesPriority:readonly string[]):MlbPostseason {return initial(seasonKey,seeds,worldSeriesPriority);}
export function nextMlbPostseasonGame(state:MlbPostseason):Omit<MlbPostseasonGame,'winner'>|null {assertMlbPostseason(state);return nextGame(state);}
export function recordMlbPostseasonGame(state:MlbPostseason,winner:string):MlbPostseason {assertMlbPostseason(state);const next=structuredClone(state);apply(next,winner);return next;}
