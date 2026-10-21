import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {validateSeasonGrowthLedger,finalizeSeasonGrowth} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {applySeasonTraining} from './training.js';
import {naturalGrowthBudgetUnits,applyGrowthBudget,applyAging} from './development.js';

export interface KboSeasonClose {receiptKey:string;seasonKey:string;sourceRevision:number;agingLossUnits:number;trainingForfeited:boolean;npcGrowth?:Record<string,{budgetUnits:number;gainedUnits:number;agingLossUnits:number}>}
/** Every pro NPC at year end (college M2-Z pattern): one natural PRO growth period over the whole growth calendar from
 * official regular KBO+FUTURES appearances and club-game rehab days, then full-season aging once. No in-season NPC
 * training exists, so the season-start snapshot is the closing player. */
function closeKboNpcSeasons(source:KboCareer){
 const season=source.world.seasonKey,W=source.world.calendar.growthDays.length,appear=new Map<string,number>(),games=Object.values(source.records.games).filter(g=>g.scope.seasonKey===season && g.scope.phase==='REGULAR' && (g.scope.leagueKey==='KBO' || g.scope.leagueKey==='FUTURES'));
 const clubDays=new Map<string,Set<number>>();
 for(const g of games){
  for(const team of Object.keys(g.teams)){if(!clubDays.has(team))clubDays.set(team,new Set());clubDays.get(team)!.add(g.worldDay);}
  for(const [k,line] of Object.entries(g.batting))if(source.world.players[k]?.kind==='HITTER')appear.set(k,(appear.get(k)??0)+line.PA);
  for(const [k,line] of Object.entries(g.pitching))if(source.world.players[k]?.kind==='PITCHER')appear.set(k,(appear.get(k)??0)+line.outs);
 }
 const players={...source.world.players},results:NonNullable<KboSeasonClose['npcGrowth']>={};
 for(const club of source.world.clubs){const days=clubDays.get(club.id)??new Set<number>();for(const k of club.roster){
  if(k===source.protagonistKey)continue;const player=players[k]!;
  let rehab=Object.hasOwn(source.health.injuries,k) && source.health.injuries[k]!.seasonKey!==season && !source.days!.days.some(d=>d.result.injured.includes(k)),rehabDays=0;
  for(const d of source.days!.days){if(days.has(d.day) && rehab)rehabDays++;if(d.result.injured.includes(k))rehab=true;if(d.result.recovered.includes(k))rehab=false;}
  const budgetUnits=naturalGrowthBudgetUnits(player,W,[{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:appear.get(k)??0,pitcherRole:player.position==='RP'?'RP':player.position==='CP'?'CP':'SP',rehabRatio:days.size?rehabDays/days.size:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:false}}]);
  const grown=applyGrowthBudget(player,budgetUnits),aged=applyAging(grown.player,1),sum=(p:typeof player)=>Object.values(p.abilities).reduce((a,b)=>a+b,0);
  players[k]=aged.player;results[k]={budgetUnits,gainedUnits:grown.gains.reduce((a,b)=>a+b,0),agingLossUnits:sum(grown.player)-sum(aged.player)};
 }}
 return {players,results};
}


/** Explicit pro year-end for one world season (same order as the school closure): the regular-season growth must
 * already be paid, an unused special training must be explicitly forfeited, then aging is applied once over the
 * world growth calendar and the season's health is closed. Age, contracts and the next season open in a later step. */
export function closeKboSeason(source:KboCareer,expectedRevision:number,forfeitUnusedTraining=false):KboCareer {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_REVIEW' || source.seasonClose || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_KBO_SEASON_CLOSE');
 validateSeasonGrowthLedger(source.seasonGrowth);
 const season=source.world.seasonKey,key=source.protagonistKey,W=source.world.calendar.growthDays.length;
 if(!source.seasonGrowth.entries.some(e=>JSON.parse(e.periodKey)[0]==='pro-growth'))throw new RangeError('KBO_SEASON_GROWTH_NOT_SETTLED');
 const career=structuredClone(source);let forfeited=false;
 if(!source.development.trainingUsedSeasons.includes(season)){
  if(forfeitUnusedTraining!==true)throw new RangeError('TRAINING_FORFEIT_REQUIRED');
  // SEASON_REVIEW means every scheduled team game is final, so the forfeit window is open by definition.
  const club=source.competitionSchedule!,league=source.registration.competitionKey??'FUTURES';
  const scheduled=club.leagues[league].filter(g=>g.awayTeamKey===source.protagonistClubId || g.homeTeamKey===source.protagonistClubId).length;
  const ledger=career.development,result=applySeasonTraining(career.world.players[key]!,ledger.trainingUsedSeasons,{type:'SKIP'},{seasonId:season,completedTeamGames:scheduled,scheduledTeamGames:scheduled,injured:false,windowOpen:true,careerCheat:source.difficulty==='SECRET_CHEAT'},ledger.trainingRng);
  career.world.players[key]=result.player;career.development={...ledger,trainingUsedSeasons:result.usedSeasons,trainingRng:result.state};forfeited=true;
 }
 const closed=finalizeSeasonGrowth(career.world.players[key]!,career.seasonGrowth,W);
 career.world.players[key]=closed.player;career.seasonGrowth=closed.ledger;career.health=closeSeasonHealth(career.health,season).ledger;
 const npc=closeKboNpcSeasons(career);career.world.players=npc.players;
 career.revision++;
 career.seasonClose={receiptKey:JSON.stringify(['kbo-season-close',career.world.worldKey,season]),seasonKey:season,sourceRevision:career.revision,agingLossUnits:closed.lossUnits,trainingForfeited:forfeited,npcGrowth:npc.results};
 return career;
}
