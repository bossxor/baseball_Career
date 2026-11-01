import type {RecordLedger} from './records.js';
import {US_LEVEL_MEANS} from './us-world.js';

/** The farewell uses my official US appearances across seasons, including a later return to KBO. */
export function careerRetirementEventId(records:RecordLedger,playerKey:string):'E37'|'E69' {
 return Object.values(records.games).some(g=>Object.hasOwn(US_LEVEL_MEANS,g.scope.leagueKey)
  && (g.scope.phase==='REGULAR'||g.scope.phase==='POSTSEASON')
  && ((g.batting[playerKey]?.PA??0)>0||(g.pitching[playerKey]?.BF??0)>0))?'E69':'E37';
}
