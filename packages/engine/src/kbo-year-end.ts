import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {validateSeasonGrowthLedger,finalizeSeasonGrowth} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {applySeasonTraining} from './training.js';

export interface KboSeasonClose {receiptKey:string;seasonKey:string;sourceRevision:number;agingLossUnits:number;trainingForfeited:boolean}

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
 career.revision++;
 career.seasonClose={receiptKey:JSON.stringify(['kbo-season-close',career.world.worldKey,season]),seasonKey:season,sourceRevision:career.revision,agingLossUnits:closed.lossUnits,trainingForfeited:forfeited};
 return career;
}
