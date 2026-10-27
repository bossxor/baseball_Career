import type {UsCareer} from '../src/us-career-entry.js';
import {reviewedUsCareerFixture} from './us-reviewed-fixture.js';
import {startUsPostseason} from '../src/us-postseason-progress.js';
import {nextMlbPostseasonGame,recordMlbPostseasonGame} from '../src/us-postseason.js';
import {canonicalJson} from '../src/game.js';
import {settleUsSeasonGrowth} from '../src/us-growth.js';
let cached:UsCareer|undefined;
/** Controlled official regular/PS contribution fixture, not a native full-career simulation. */
export function finishedUsCareerFixture(prepared?:UsCareer){
 if(!prepared&&cached)return structuredClone(cached);const regular=prepared?.phaseContext.phase==='SEASON_REVIEW'?structuredClone(prepared):reviewedUsCareerFixture(prepared),ids=regular.world.organizations.map(o=>o.id),c=startUsPostseason(regular,regular.revision,{AL:ids.slice(0,15),NL:ids.slice(15)});if(c.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');const p=c.phaseContext;
 for(let g=nextMlbPostseasonGame(p.bracket);g;g=nextMlbPostseasonGame(p.bracket)){
  const s=p.bracket.series.find(s=>s.id===g!.seriesId)!,winner=s.higherSeed,key=JSON.stringify([c.world.seasonKey,'MLB','POSTSEASON',g.seriesId,g.gameNumber]),other=winner===g.homeTeamKey?g.awayTeamKey:g.homeTeamKey;
  c.records.games[key]={gameKey:key,worldDay:p.nextWorldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:'MLB',phase:'POSTSEASON'},teams:{[winner]:{games:1,W:1,L:0,T:0,R:1,RA:0},[other]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};c.records.revision++;p.gameEvidence.push(canonicalJson(c.records.games[key]));p.bracket=recordMlbPostseasonGame(p.bracket,winner);p.nextWorldDay++;
 }
 c.postseason={bracket:p.bracket,conferences:p.conferences,gameEvidence:p.gameEvidence};c.phaseContext={phase:'SEASON_REVIEW'};const closed=settleUsSeasonGrowth(c,c.revision,true);if(!prepared)cached=closed;return prepared?closed:structuredClone(closed);
}
