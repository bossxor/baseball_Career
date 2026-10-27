import {usLevelFixture} from './us-level-fixture.js';
import {reviewUsLevel,resolveUsLevelEvent} from '../src/us-levels.js';
import {reviewedUsCareerFixture} from './us-reviewed-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import type {UsCareer} from '../src/us-career-entry.js';

/** Controlled regular/PS rows and registration receipts, not a native complete MLB season. */
export function finishControlledMajorSeason(c:UsCareer):UsCareer {
 const regular=reviewedUsCareerFixture(c),s=regular.season!,key=regular.protagonistKey,club=regular.protagonistOrganizationId,first=s.levelMoves?.[0]?.from??regular.registration.level;
 const levelOn=(day:number)=>{let level=first;for(const m of s.levelMoves??[])if(day>m.day)level=m.to;return level;};
 const seen=new Set(regular.health.games.map(h=>h.evidence.gameKey+'|'+h.evidence.teamKey));
 for(const g of Object.values(regular.records.games).filter(g=>g.scope.seasonKey===regular.world.seasonKey&&g.scope.phase==='REGULAR'&&g.scope.leagueKey===levelOn(g.worldDay)&&Object.hasOwn(g.teams,club)).sort((a,b)=>a.worldDay-b.worldDay)){
  const level=levelOn(g.worldDay),teamKey=level+':'+club;
  if(!seen.has(g.gameKey+'|'+teamKey))regular.health.games=[...regular.health.games,{evidence:{gameKey:g.gameKey,teamKey,seasonKey:g.scope.seasonKey,day:g.worldDay,roster:[key],appearances:(g.batting[key]?.PA??0)+(g.pitching[key]?.BF??0)>0?[{playerKey:key,riskFatigue:0}]:[]},result:{injured:[],recovered:[]}}];
  if(!s.firstAppearance[level]&&((g.batting[key]?.PA??0)>0||(g.pitching[key]?.BF??0)>0))s.firstAppearance[level]={gameKey:g.gameKey,day:g.worldDay};
 }
 return finishedUsCareerFixture(regular);
}
let cached:UsCareer|undefined;
export function closedUsMajorFixture():UsCareer {
 if(cached)return structuredClone(cached);const c=usLevelFixture('AAA',144);c.records.revision=Object.keys(c.records.games).length;
 if(c.phaseContext.phase!=='SEASON_PROGRESS')throw Error('fixture phase');const offered=reviewUsLevel(c,c.phaseContext.nextWorldDay-1,c.phaseContext);if(offered?.phaseContext.phase!=='EVENT_DECISION')throw Error('fixture callup');const e=offered.events.at(-1)!,major=resolveUsLevelEvent(offered,offered.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_CALLUP'});
 cached=finishControlledMajorSeason(major);return structuredClone(cached);
}
