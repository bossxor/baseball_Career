/** 01 postseason (game rule, not real KBO regulation): 4th vs 5th wild card to 2 wins with the 4th seed starting 1-0,
 * winner vs 3rd best of 3, winner vs 2nd best of 5, winner vs 1st best of 7. The higher seed hosts first.
 * Home pattern 2-2-1 (best of 5) and 2-2-3 (best of 7) from 01; best of 3 uses 2-1 and the wild card is all at the
 * higher seed (design default D, recorded in M2-BD). Pure bracket state; games are played by the career worker. */
export type KboRound='WILD_CARD'|'SEMI_PLAYOFF'|'PLAYOFF'|'KOREAN_SERIES';
export interface KboSeries {round:KboRound;higherSeed:string;lowerSeed:string;winsNeeded:number;higherWins:number;lowerWins:number;games:readonly {gameNumber:number;homeTeamKey:string;awayTeamKey:string;winner:string|null}[]}
export interface KboPostseason {schemaVersion:1;seasonKey:string;seeds:readonly string[];series:readonly KboSeries[];championKey:string|null}
const PLAN:readonly {round:KboRound;opponentSeed:number;winsNeeded:number;higherStart:number;home:readonly ('H'|'L')[]}[]=[
 {round:'WILD_CARD',opponentSeed:4,winsNeeded:2,higherStart:1,home:['H','H']},
 {round:'SEMI_PLAYOFF',opponentSeed:3,winsNeeded:2,higherStart:0,home:['H','H','L']},
 {round:'PLAYOFF',opponentSeed:2,winsNeeded:3,higherStart:0,home:['H','H','L','L','H']},
 {round:'KOREAN_SERIES',opponentSeed:1,winsNeeded:4,higherStart:0,home:['H','H','L','L','L','H','H']},
];
/** Seeds are the final regular-season ranks 1..5 (from leagueStandings). */
export function createKboPostseason(seasonKey:string,seeds:readonly string[]):KboPostseason {
 if(!seasonKey || seeds.length!==5 || new Set(seeds).size!==5 || seeds.some(s=>!s))throw new RangeError('INVALID_POSTSEASON_SEEDS');
 return {schemaVersion:1,seasonKey,seeds:[...seeds],series:[open(0,seeds[3]!,seeds[4]!)],championKey:null};
}
function open(index:number,higherSeed:string,lowerSeed:string):KboSeries {
 const p=PLAN[index]!;return {round:p.round,higherSeed,lowerSeed,winsNeeded:p.winsNeeded,higherWins:p.higherStart,lowerWins:0,games:[]};
}
/** The next game to play, or null when the postseason is complete. */
export function nextKboPostseasonGame(state:KboPostseason):{round:KboRound;gameNumber:number;homeTeamKey:string;awayTeamKey:string}|null {
 if(state.championKey)return null;
 const s=state.series.at(-1)!,p=PLAN[state.series.length-1]!,n=s.games.length;
 const home=p.home[n]==='L'?s.lowerSeed:s.higherSeed;
 return {round:s.round,gameNumber:n+1,homeTeamKey:home,awayTeamKey:home===s.higherSeed?s.lowerSeed:s.higherSeed};
}
/** Record one final result (no ties in postseason: the engine's tiebreak plays to a winner). */
export function recordKboPostseasonGame(source:KboPostseason,winner:string):KboPostseason {
 const next=nextKboPostseasonGame(source);if(!next)throw new RangeError('POSTSEASON_COMPLETE');
 if(winner!==next.homeTeamKey && winner!==next.awayTeamKey)throw new RangeError('INVALID_POSTSEASON_WINNER');
 const state=structuredClone(source) as {-readonly [K in keyof KboPostseason]:KboPostseason[K]};const series=[...state.series];
 const s={...series.at(-1)!,games:[...series.at(-1)!.games,{gameNumber:next.gameNumber,homeTeamKey:next.homeTeamKey,awayTeamKey:next.awayTeamKey,winner}]};
 if(winner===s.higherSeed)s.higherWins++;else s.lowerWins++;
 series[series.length-1]=s;
 const done=s.higherWins>=s.winsNeeded?s.higherSeed:s.lowerWins>=s.winsNeeded?s.lowerSeed:null;
 if(done){
  const index=series.length;
  if(index>=PLAN.length)state.championKey=done;
  else series.push(open(index,state.seeds[PLAN[index]!.opponentSeed-1]!,done));
 }
 state.series=series;return state;
}
