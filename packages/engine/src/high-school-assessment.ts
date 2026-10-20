import {ownAssessmentLevel,reconcileAssessment,observeAssessmentProgress,assessmentView} from './assessment.js';
import type {AssessmentProgress,PotentialRange} from './assessment.js';
import type {HighSchoolWorld} from './high-school-world.js';
import type {HighSchoolCareer} from './high-school-career.js';
export interface OwnCareerAssessment {schemaVersion:1;modelVersion:'potential-1';level:number;progress:AssessmentProgress;ranges:Record<string,PotentialRange>}
export function createOwnCareerAssessment(world:HighSchoolWorld):OwnCareerAssessment {
 const player=world.players[world.protagonistKey]!;
 const modelVersion='potential-1',level=ownAssessmentLevel(0),progress={observed:[],stage:0};
 return {schemaVersion:1,modelVersion,level,progress,ranges:reconcileAssessment({playerKey:JSON.stringify([world.worldKey,player.simulationKey]),modelVersion,kind:player.kind,abilities:player.abilities,potential:player.potential,level,stage:0})};
}
/** Only closed-date, official registered-team regular games. Bench/injured registration still counts. */
export function refreshOwnCareerAssessment(source:HighSchoolCareer):OwnCareerAssessment {
 const report=structuredClone(source.ownAssessment??createOwnCareerAssessment(source.world)),player=source.world.players[source.world.protagonistKey]!;
 if(report.schemaVersion!==1 || report.modelVersion!=='potential-1' || report.level!==ownAssessmentLevel(0))throw new RangeError('INVALID_OWN_ASSESSMENT');
 const closed=new Set(source.days.days.map(d=>d.day));
 const games=Object.values(source.records.games).filter(g=>g.scope.seasonKey===source.world.seasonKey && g.scope.leagueKey==='HS' && g.scope.phase==='REGULAR' && closed.has(g.worldDay) && Object.hasOwn(g.teams,source.world.protagonistSchoolId)).sort((a,b)=>a.worldDay-b.worldDay || (a.gameKey<b.gameKey?-1:1));
 for(const game of games)report.progress=observeAssessmentProgress(report.progress,{gameKey:game.gameKey,worldDay:game.worldDay});
 report.ranges=reconcileAssessment({playerKey:JSON.stringify([source.world.worldKey,player.simulationKey]),modelVersion:report.modelVersion,kind:player.kind,abilities:player.abilities,potential:player.potential,level:report.level,stage:report.progress.stage,previous:report.ranges});
 return report;
}
/** Read-only allowlist projection; a read never increments progress, RNG or save revision. */
export function ownCareerAssessmentView(source:HighSchoolCareer) {
 const report=source.ownAssessment??refreshOwnCareerAssessment(source),player=source.world.players[source.world.protagonistKey]!;
 return assessmentView({kind:player.kind,abilities:player.abilities,ranges:report.ranges,progress:report.progress,fixedCheat:source.difficulty==='SECRET_CHEAT'});
}
