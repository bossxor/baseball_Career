import assert from 'node:assert/strict';
import type {UsCareer} from '../src/us-career-entry.js';
import {usCareerView} from '../src/us-career-entry.js';
import {preparedUsOptionCareer} from './us-option-fixture.js';
import {startUsRegularSeason} from '../src/us-season.js';
import {reviewUsLevel,resolveUsLevelEvent} from '../src/us-levels.js';
import {usLevelFixture} from './us-level-fixture.js';
import {finishControlledMajorSeason} from './us-major-fixture.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startNextUsMajorSeason,acceptUsMajorFreeAgency,usMajorFreeAgencyPreview} from '../src/us-major-renewal.js';
import {mlbServiceTime} from '../src/us-service-time.js';
const funding=(c:UsCareer)=>c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:20_000_000}));
function opening(c:UsCareer){const planned=confirmUsPreseasonPlan(c,c.revision);return publishUsSeasonSchedule(planned,planned.revision);}
let cached:UsCareer|undefined;
/** Authentic negotiated option and all promotion/annual/FA writers; regular/PS contribution dates are CONTROLLED, not native seasons. */
export function closedUsGuaranteedOptionCareer():UsCareer {
 if(cached)return structuredClone(cached);
 let c=startUsRegularSeason(preparedUsOptionCareer('HITTER'),preparedUsOptionCareer('HITTER').revision);
 const template=Object.values(usLevelFixture().records.games).find(g=>g.batting.own)!;
 while(c.registration.level!=='MLB'){
  const level=c.registration.level,after=c.season!.levelMoves?.at(-1)?.day??-1,games=c.seasonSchedule!.leagues[level].filter(g=>g.worldDay>after&&(g.homeTeamKey===c.protagonistOrganizationId||g.awayTeamKey===c.protagonistOrganizationId)).slice(0,24);assert.equal(games.length,24);
  for(const g of games)c.records.games[g.simulationKey]={...structuredClone(template),gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:level,phase:'REGULAR'},teams:{[g.homeTeamKey]:{games:1,W:1,L:0,T:0,R:1,RA:0},[g.awayTeamKey]:{games:1,W:0,L:1,T:0,R:0,RA:1}}};
  c.records.revision+=games.length;const day=games.at(-1)!.worldDay,progress={phase:'SEASON_PROGRESS' as const,nextWorldDay:day+1,pendingGame:null};c.phaseContext=progress;
  const offered=reviewUsLevel(c,day,progress);assert.ok(offered?.phaseContext.phase==='EVENT_DECISION');const event=offered.events.at(-1)!;c=resolveUsLevelEvent(offered,offered.revision,{eventKey:event.eventKey,eventVersion:event.version,command:event.definitionId==='E60'?'CONFIRM_CALLUP':'CONFIRM_PROMOTION'});
 }
 c=finishControlledMajorSeason(c);
 while(mlbServiceTime(c.records,c.health,c.protagonistKey).creditedSeasons<6)c=finishControlledMajorSeason(opening(startNextUsMajorSeason(c,c.revision,funding(c))));
 const quote=usMajorFreeAgencyPreview(c,funding(c));assert.equal(quote.offers[0]!.years,5);c=acceptUsMajorFreeAgency(c,c.revision,funding(c));assert.equal(c.contract.militaryReturnOption,true);assert.equal(c.contract.years,5);
 cached=finishControlledMajorSeason(opening(c));usCareerView(cached);return structuredClone(cached);
}
