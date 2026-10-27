import {automaticFieldLineup,initialPositionFits} from './lineup.js';
import {emptyBatting} from './stats.js';
import {assertNationalSelectionSnapshot,nationalLineupBatting} from './national-selection.js';
import type {NationalSelectionSnapshot} from './national-selection.js';
import type {BattingLine} from './types.js';
import {createStreams,nextInteger} from './rng.js';
import {buildGameContribution} from './records.js';
import type {GameContribution} from './records.js';
import {pitchMastery,validatePitchWeights} from './repertoire.js';
import type {PitchId} from '@playball/rules';
import {HITTER_ABILITIES,PITCHER_ABILITIES,RULES_VERSION} from '@playball/rules';
import {createGame,runGameChunk} from './game.js';
import type {GameState,HitterSnapshot,PitcherSnapshot,TeamSnapshot} from './types.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {NationalTournament,NationalMedal} from './kbo-national.js';
import {sealNationalCompetitionResult} from './kbo-national.js';

export type NationStrength=65|55|45;
const AG_NATIONS=[{id:'KOR',strength:65 as NationStrength},{id:'JPN',strength:65},{id:'TWN',strength:55},{id:'CHN',strength:55},{id:'HKG',strength:55},{id:'PHI',strength:45},{id:'THA',strength:45},{id:'PAK',strength:45}] as const;

export function nationalControlTeam(id:string,value:number,protagonist?:{key:string;hitter?:HitterSnapshot;pitcher?:PitcherSnapshot}|null):TeamSnapshot {
 const lineup:HitterSnapshot[]=Array.from({length:9},(_,i)=>({simulationKey:`${id}-h${i}`,abilities:Object.fromEntries(HITTER_ABILITIES.map(a=>[a,value*10_000])),fatigue:0,morale:1,temporary:{},traitLogits:[],available:true,bats:i%3===0?'L':i%3===1?'R':'S',approach:'BALANCED'}));
 if(protagonist?.hitter&&id==='KOR')lineup[0]={...protagonist.hitter,simulationKey:protagonist.key,available:true};
 const pitchers:PitcherSnapshot[]=Array.from({length:4},(_,i)=>({simulationKey:`${id}-p${i}`,abilities:Object.fromEntries(PITCHER_ABILITIES.map(a=>[a,value*10_000])),fatigue:0,morale:1,temporary:{},traitLogits:[],throws:'R',pitchForm:'OVERHAND',role:i===0?'SP':i===3?'CP':'RP',available:true,recentOuts:0,repertoire:[{pitchId:'P01',mastery:2,weight:60},{pitchId:'P03',mastery:1,weight:40}]}));
 if(protagonist?.pitcher&&id==='KOR')pitchers[0]={...protagonist.pitcher,simulationKey:protagonist.key};
 return {simulationKey:id,lineup,fielders:lineup.slice(0,8).map(p=>({simulationKey:p.simulationKey,fit:100})),pitchers};
}

/** The selected15/13 and actual player books supply game inputs; registration alone never guarantees an appearance. */
export function koreaNationalTeam(c:KboCareer,selection:NationalSelectionSnapshot,gameNumber:number,recent:ReadonlyMap<string,BattingLine>,worldDay?:number):TeamSnapshot {
 if(worldDay!==undefined&&(!Number.isSafeInteger(worldDay)||worldDay<0))throw new RangeError('INVALID_NATIONAL_GAME_DAY');
 const used=new Map<string,Set<number>>();
 if(worldDay!==undefined)for(const g of Object.values(c.records.games)){
  if(g.scope.seasonKey!==c.world.seasonKey||g.worldDay<worldDay-3||g.worldDay>=worldDay)continue;
  for(const [key,p]of Object.entries(g.pitching))if(p.BF>0){if(!used.has(key))used.set(key,new Set());used.get(key)!.add(g.worldDay);}
 }
 const rested=(key:string,starter:boolean)=>worldDay===undefined|| (starter?!used.has(key):!(used.get(key)?.has(worldDay-1)&&used.get(key)?.has(worldDay-2)));
 const players={...c.world.players,...Object.fromEntries(Object.entries(c.sangmu?.members??{}).map(([k,m])=>[k,m.player]))},chosen=selection.roster.slots.map(s=>{const p=players[s.playerKey];if(!p)throw new RangeError('NATIONAL_ROSTER_CHANGED');return {player:p,role:s.role};}),healthy=(k:string)=>!Object.hasOwn(c.health.injuries,k);
 const hitters=chosen.filter(s=>s.player.kind==='HITTER'),lineup=automaticFieldLineup(hitters.map(s=>({player:s.player,available:healthy(s.player.simulationKey),fits:initialPositionFits(s.player.position),recent:recent.get(s.player.simulationKey)??emptyBatting()})),60);
 const starters=chosen.filter(s=>s.role==='SP'&&healthy(s.player.simulationKey)&&s.player.fatigue<60&&rested(s.player.simulationKey,true)),starter=starters[gameNumber%Math.max(1,starters.length)]??chosen.find(s=>s.player.kind==='PITCHER'&&s.role==='RP'&&healthy(s.player.simulationKey)&&(worldDay===undefined||s.player.fatigue<60)&&rested(s.player.simulationKey,false));if(!starter)throw new RangeError('NATIONAL_STARTER_REQUIRED');
 const snapshot=(key:string)=>{const p=players[key]!;return {simulationKey:key,abilities:{...p.abilities},fatigue:p.fatigue,morale:1,temporary:{},traitLogits:[]};};
 const pitchers=chosen.filter(s=>s.player.kind==='PITCHER').sort((a,b)=>a===starter?-1:b===starter?1:a.player.simulationKey<b.player.simulationKey?-1:1).map(s=>{const p=s.player,r=c.world.repertoires[p.simulationKey]??c.sangmu?.members[p.simulationKey]?.repertoire;if(!r||r.seasonId!==c.world.seasonKey)throw new RangeError('MISSING_NATIONAL_REPERTOIRE');validatePitchWeights(r.book,r.weights);return {...snapshot(p.simulationKey),throws:p.throws,pitchForm:p.pitchForm!,role:s===starter?'SP' as const:s.role==='CP'?'CP' as const:s.role==='SP'?'SP' as const:'RP' as const,available:healthy(p.simulationKey)&&(s.role==='SP'?s===starter:rested(p.simulationKey,false)),recentOuts:0,repertoire:Object.keys(r.weights).sort().map(id=>({pitchId:id as PitchId,weight:r.weights[id as PitchId]!,mastery:pitchMastery(r.book[id as PitchId]!)}))};});
 return {simulationKey:'KOR',fielders:lineup.fielders,lineup:lineup.lineup.map(key=>({...snapshot(key),bats:players[key]!.bats,approach:'BALANCED',available:true})),pitchers};
}

function finish(state:GameState):GameState {
 for(let i=0;i<4000;i++){const r=runGameChunk(state,{plateAppearances:200});state=r.state;if(state.status==='FINAL')return state;}
 throw new RangeError('NATIONAL_GAME_DID_NOT_END');
}

function play(seed:string,away:TeamSnapshot,home:TeamSnapshot,slot:string,seasonKey:string,day:number):{winner:string;appeared:readonly string[];contribution:GameContribution} {
 const state=finish(createGame({simulationKey:slot,seed,rulesVersion:RULES_VERSION,competition:'INTERNATIONAL',teams:[away,home]}));
 const [awayR,homeR]=state.scores;if(awayR===homeR)throw new RangeError('NATIONAL_GAME_TIED');
 return {winner:awayR>homeR?away.simulationKey:home.simulationKey,appeared:[...Object.entries(state.batting).filter(([,b])=>b.PA>0).map(([k])=>k),...Object.entries(state.pitching).filter(([,p])=>p.BF>0).map(([k])=>k)],contribution:buildGameContribution(state,{seasonKey,leagueKey:'AG',phase:'INTERNATIONAL'},day)};
}

export interface NationalGroupResult {a:string;b:string;winner:string;contribution:Pick<GameContribution,'teams'>}
/** 20: tied subsets restart head-to-head criteria; each partition shrinks or advances a criterion. */
export function rankNationalGroup(ids:readonly string[],results:readonly NationalGroupResult[],seed:string):string[] {
 if(new Set(ids).size!==ids.length||ids.length<2||results.length!==ids.length*(ids.length-1)/2)throw new RangeError('INVALID_NATIONAL_GROUP');
 const pairs=new Set<string>();for(const g of results){const pair=[g.a,g.b].sort().join('|');if(g.a===g.b||!ids.includes(g.a)||!ids.includes(g.b)||![g.a,g.b].includes(g.winner)||pairs.has(pair)||!g.contribution.teams[g.a]||!g.contribution.teams[g.b])throw new RangeError('INVALID_NATIONAL_GROUP');const a=g.contribution.teams[g.a]!,b=g.contribution.teams[g.b]!;if(![a.R,a.RA,b.R,b.RA].every(n=>Number.isSafeInteger(n)&&n>=0)||a.R!==b.RA||b.R!==a.RA||a.R===b.R||g.winner!==(a.R>b.R?g.a:g.b))throw new RangeError('INVALID_NATIONAL_GROUP');pairs.add(pair);}
 const lots=[...ids].sort();let rng=createStreams(seed,JSON.stringify(['national-group-lots',lots])).worldCreation;
 for(let i=lots.length-1;i>0;i--){const draw=nextInteger(rng,i+1);rng=draw.state;[lots[i],lots[draw.value]]=[lots[draw.value]!,lots[i]!];}
 const wins=(key:string,rows:readonly NationalGroupResult[])=>rows.filter(g=>g.winner===key).length;
 const runs=(key:string,rows:readonly NationalGroupResult[],against=false)=>rows.reduce((n,g)=>n+(g.contribution.teams[key]?.[against?'RA':'R']??0),0);
 const breakTie=(keys:string[],criterion=0):string[]=>{
  if(keys.length<2)return keys;
  const head=results.filter(g=>keys.includes(g.a)&&keys.includes(g.b));
  const score=(k:string)=>criterion===0?wins(k,head):criterion===1?runs(k,head)-runs(k,head,true):criterion===2?runs(k,results)-runs(k,results,true):criterion===3?-runs(k,results,true):-lots.indexOf(k);
  const ordered=[...keys].sort((x,y)=>score(y)-score(x)),groups:string[][]=[];for(const k of ordered){const last=groups.at(-1);if(last&&score(last[0]!)===score(k))last.push(k);else groups.push([k]);}
  if(groups.length===1)return criterion<4?breakTie(keys,criterion+1):ordered;
  return groups.flatMap(g=>g.length===1?g:breakTie(g));
 };
 const groups=new Map<number,string[]>();for(const id of ids){const w=wins(id,results);groups.set(w,[...(groups.get(w)??[]),id]);}
 return [...groups].sort(([a],[b])=>b-a).flatMap(([,keys])=>breakTie(keys));
}

// shortcut: batch games have no persisted inning checkpoint or full 28-player selection; replace with the international calendar worker before claiming INT02/05/12.
/** Plays a sealed AG (8 nations). Requires an ACCEPTED AG callup. Seals the career result afterward. */
export function playAsianGamesTournament(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);
 const invite=(c.national?.invitations??[]).find(i=>i.tournament==='AG'&&i.seasonKey===c.world.seasonKey&&i.status==='ACCEPTED');
 if(!invite)throw new RangeError('NATIONAL_CALLUP_REQUIRED');
 const competitionId=JSON.stringify(['national-ag',c.world.worldKey,c.world.seasonKey]);
 if((c.national?.competitions??[]).some(x=>x.competitionId===competitionId))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_PLAYED');
 const slot=c.world.calendar.international.find(w=>w.type==='AG');if(!slot)throw new RangeError('NATIONAL_NOT_SCHEDULED');
 if(Object.hasOwn(c.health.injuries,c.protagonistKey)||c.military?.status==='SERVING_ACTIVE')throw new RangeError('NATIONAL_PLAYER_UNAVAILABLE');
 const selection=invite.selectionSnapshotId?c.national?.selections?.find(s=>s.selectionId===invite.selectionSnapshotId):undefined;if(invite.selectionSnapshotId&&!selection)throw new RangeError('NATIONAL_SELECTION_CHANGED');if(selection){assertNationalSelectionSnapshot(selection);if(!selection.roster.slots.some(s=>s.playerKey===c.protagonistKey))throw new RangeError('NATIONAL_PLAYER_NOT_REGISTERED');}
 const recent=selection?nationalLineupBatting(c.records,selection):new Map<string,BattingLine>();let koreaGames=0;
 const player=c.world.players[c.protagonistKey]!;
 const protagonist=player.kind==='HITTER'?{key:c.protagonistKey,hitter:{simulationKey:c.protagonistKey,abilities:{...player.abilities},fatigue:player.fatigue,morale:1,temporary:{},traitLogits:[],available:true,bats:player.bats??'R',approach:'BALANCED' as const}}:{key:c.protagonistKey,pitcher:(()=>{const r=c.world.repertoires[c.protagonistKey];if(!r)throw new RangeError('MISSING_NATIONAL_REPERTOIRE');validatePitchWeights(r.book,r.weights);return {simulationKey:c.protagonistKey,abilities:{...player.abilities},fatigue:player.fatigue,morale:1,temporary:{},traitLogits:[],throws:player.throws,pitchForm:player.pitchForm!,role:'SP' as const,available:true,recentOuts:0,repertoire:Object.keys(r.weights).sort().map(id=>({pitchId:id as PitchId,weight:r.weights[id as PitchId]!,mastery:pitchMastery(r.book[id as PitchId]!)}))};})()};
 const teams=Object.fromEntries(AG_NATIONS.map(n=>[n.id,nationalControlTeam(n.id,n.strength,protagonist)]));
 const contributions:GameContribution[]=[];
 const match=(seed:string,a:TeamSnapshot,b:TeamSnapshot,key:string,offset:number)=>{const away=a.simulationKey==='KOR'&&selection?koreaNationalTeam(c,selection,koreaGames++,recent):a,home=b.simulationKey==='KOR'&&selection?koreaNationalTeam(c,selection,koreaGames++,recent):b,r=play(seed,away,home,key,c.world.seasonKey,slot.startDay+offset);contributions.push(r.contribution);return r;};
 const seed=`${c.world.seed}:ag:${c.world.seasonKey}`,groupA=['KOR','TWN','HKG','THA'] as const,groupB=['JPN','CHN','PHI','PAK'] as const;
 const groupGames=(ids:readonly string[])=>{
  const out:{a:string;b:string;winner:string;appeared:readonly string[];contribution:GameContribution}[]=[];
  const rounds=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]] as const;
  for(const [round,pairs]of rounds.entries())for(const [i,j]of pairs){const a=ids[i]!,b=ids[j]!,r=match(`${seed}:${a}:${b}`,teams[a]!,teams[b]!,JSON.stringify([competitionId,'GROUP',a,b]),round*3);out.push({a,b,...r});}
  return out;
 };
 const aGames=groupGames(groupA),bGames=groupGames(groupB),aRank=rankNationalGroup(groupA,aGames,seed),bRank=rankNationalGroup(groupB,bGames,seed);
 const sf1=match(`${seed}:SF1`,teams[aRank[0]!]!,teams[bRank[1]!]!,JSON.stringify([competitionId,'SF',1]),9);
 const sf2=match(`${seed}:SF2`,teams[bRank[0]!]!,teams[aRank[1]!]!,JSON.stringify([competitionId,'SF',2]),9);
 const sf1Loser=sf1.winner===aRank[0]!?bRank[1]!:aRank[0]!,sf2Loser=sf2.winner===bRank[0]!?aRank[1]!:bRank[0]!;
 const bronze=match(`${seed}:B`,teams[sf1Loser]!,teams[sf2Loser]!,JSON.stringify([competitionId,'BRONZE']),12);
 const gold=match(`${seed}:G`,teams[sf1.winner]!,teams[sf2.winner]!,JSON.stringify([competitionId,'GOLD']),12);
 const appeared=[...aGames,...bGames,sf1,sf2,bronze,gold].some(g=>g.appeared.includes(c.protagonistKey));
 const medal:NationalMedal=gold.winner==='KOR'?'GOLD':bronze.winner==='KOR'?'BRONZE':sf1.winner==='KOR'||sf2.winner==='KOR'?'SILVER':null;
 const finalRank=gold.winner==='KOR'?1:bronze.winner==='KOR'?3:medal==='SILVER'?2:[sf1Loser,sf2Loser].includes('KOR')?4:5;
 const games={...c.records.games};for(const row of contributions){if(Object.hasOwn(games,row.gameKey))throw new RangeError('NATIONAL_GAME_ALREADY_RECORDED');games[row.gameKey]=row;}
 const staged={...c,records:{revision:c.records.revision+contributions.length,games}};
 return sealNationalCompetitionResult(staged,revision,{competitionId,tournament:'AG',seasonKey:c.world.seasonKey,medal,finalRank,officialAppearance:appeared,registered:true,resultVersion:1,gameKeys:contributions.map(g=>g.gameKey)});
}

export function asianGamesNationPreset():readonly {id:string;strength:NationStrength}[] {return AG_NATIONS.map(n=>({id:n.id,strength:n.strength}));}
export type {NationalTournament};
