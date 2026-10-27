import {HITTER_ABILITIES,PITCHER_ABILITIES,RULES_VERSION} from '@playball/rules';
import {createGame,runGameChunk} from './game.js';
import type {GameState,HitterSnapshot,PitcherSnapshot,TeamSnapshot} from './types.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {NationalTournament,NationalMedal} from './kbo-national.js';
import {sealNationalCompetitionResult} from './kbo-national.js';

export type NationStrength=65|55|45;
const AG_NATIONS=[{id:'KOR',strength:65 as NationStrength},{id:'JPN',strength:65},{id:'TWN',strength:55},{id:'CHN',strength:55},{id:'AUS',strength:55},{id:'PHI',strength:45},{id:'THA',strength:45},{id:'PAK',strength:45}] as const;

function nationTeam(id:string,value:number,protagonist?:{key:string;hitter:HitterSnapshot}|null):TeamSnapshot {
 const lineup:HitterSnapshot[]=Array.from({length:9},(_,i)=>({simulationKey:`${id}-h${i}`,abilities:Object.fromEntries(HITTER_ABILITIES.map(a=>[a,value*10_000])),fatigue:0,morale:1,temporary:{},traitLogits:[],available:true,bats:i%3===0?'L':i%3===1?'R':'S',approach:'BALANCED'}));
 if(protagonist&&id==='KOR')lineup[0]={...protagonist.hitter,simulationKey:protagonist.key,available:true};
 const pitchers:PitcherSnapshot[]=Array.from({length:4},(_,i)=>({simulationKey:`${id}-p${i}`,abilities:Object.fromEntries(PITCHER_ABILITIES.map(a=>[a,value*10_000])),fatigue:0,morale:1,temporary:{},traitLogits:[],throws:'R',pitchForm:'OVERHAND',role:i===0?'SP':i===3?'CP':'RP',available:true,recentOuts:0,repertoire:[{pitchId:'P01',mastery:2,weight:60},{pitchId:'P03',mastery:1,weight:40}]}));
 return {simulationKey:id,lineup,fielders:lineup.slice(0,8).map(p=>({simulationKey:p.simulationKey,fit:100})),pitchers};
}

function finish(state:GameState):GameState {
 for(let i=0;i<4000;i++){const r=runGameChunk(state,{plateAppearances:200});state=r.state;if(state.status==='FINAL')return state;}
 throw new RangeError('NATIONAL_GAME_DID_NOT_END');
}

function play(seed:string,away:TeamSnapshot,home:TeamSnapshot,slot:string):{winner:string;appeared:readonly string[]} {
 const state=finish(createGame({simulationKey:slot,seed,rulesVersion:RULES_VERSION,competition:'INTERNATIONAL',teams:[away,home]}));
 const [awayR,homeR]=state.scores;if(awayR===homeR)throw new RangeError('NATIONAL_GAME_TIED');
 return {winner:awayR>homeR?away.simulationKey:home.simulationKey,appeared:[...Object.keys(state.batting),...Object.keys(state.pitching)]};
}

function groupRank(ids:readonly string[],results:readonly {winner:string;a:string;b:string}[]):string[] {
 const table=new Map(ids.map(id=>[id,{w:0,l:0}]));
 for(const g of results){table.get(g.winner)!.w++;table.get(g.winner===g.a?g.b:g.a)!.l++;}
 return [...ids].sort((x,y)=>{const A=table.get(x)!,B=table.get(y)!;return B.w-A.w||A.l-B.l||(x<y?-1:1);});
}

/** Plays a sealed AG (8 nations). Requires an ACCEPTED AG callup. Seals the career result afterward. */
export function playAsianGamesTournament(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);
 const invite=(c.national?.invitations??[]).find(i=>i.tournament==='AG'&&i.seasonKey===c.world.seasonKey&&i.status==='ACCEPTED');
 if(!invite)throw new RangeError('NATIONAL_CALLUP_REQUIRED');
 const competitionId=JSON.stringify(['national-ag',c.world.worldKey,c.world.seasonKey]);
 if((c.national?.competitions??[]).some(x=>x.competitionId===competitionId))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_PLAYED');
 const player=c.world.players[c.protagonistKey]!;
 const protagonist=player.kind==='HITTER'?{key:c.protagonistKey,hitter:{simulationKey:c.protagonistKey,abilities:{...player.abilities},fatigue:0,morale:1,temporary:{},traitLogits:[],available:true,bats:player.bats??'R',approach:'BALANCED' as const}}:null;
 const teams=Object.fromEntries(AG_NATIONS.map(n=>[n.id,nationTeam(n.id,n.strength,protagonist)]));
 const seed=`${c.world.seed}:ag:${c.world.seasonKey}`,groupA=['KOR','TWN','AUS','THA'] as const,groupB=['JPN','CHN','PHI','PAK'] as const;
 const groupGames=(ids:readonly string[])=>{const out:{a:string;b:string;winner:string;appeared:readonly string[]}[]=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=ids[i]!,b=ids[j]!,r=play(`${seed}:${a}:${b}`,teams[a]!,teams[b]!,JSON.stringify([competitionId,'GROUP',a,b]));out.push({a,b,...r});}return out;};
 const aGames=groupGames(groupA),bGames=groupGames(groupB),aRank=groupRank(groupA,aGames),bRank=groupRank(groupB,bGames);
 const sf1=play(`${seed}:SF1`,teams[aRank[0]!]!,teams[bRank[1]!]!,JSON.stringify([competitionId,'SF',1]));
 const sf2=play(`${seed}:SF2`,teams[bRank[0]!]!,teams[aRank[1]!]!,JSON.stringify([competitionId,'SF',2]));
 const sf1Loser=sf1.winner===aRank[0]!?bRank[1]!:aRank[0]!,sf2Loser=sf2.winner===bRank[0]!?aRank[1]!:bRank[0]!;
 const bronze=play(`${seed}:B`,teams[sf1Loser]!,teams[sf2Loser]!,JSON.stringify([competitionId,'BRONZE']));
 const gold=play(`${seed}:G`,teams[sf1.winner]!,teams[sf2.winner]!,JSON.stringify([competitionId,'GOLD']));
 const appeared=[...aGames,...bGames,sf1,sf2,bronze,gold].some(g=>g.appeared.includes(c.protagonistKey));
 const medal:NationalMedal=gold.winner==='KOR'?'GOLD':bronze.winner==='KOR'?'BRONZE':sf1.winner==='KOR'||sf2.winner==='KOR'?'SILVER':null;
 const finalRank=gold.winner==='KOR'?1:bronze.winner==='KOR'?3:medal==='SILVER'?2:5;
 return sealNationalCompetitionResult(c,revision,{competitionId,tournament:'AG',seasonKey:c.world.seasonKey,medal,finalRank,officialAppearance:appeared&&!!protagonist,registered:true,resultVersion:1});
}

export function asianGamesNationPreset():readonly {id:string;strength:NationStrength}[] {return AG_NATIONS.map(n=>({id:n.id,strength:n.strength}));}
export type {NationalTournament};
