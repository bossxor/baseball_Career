import { HITTER_ABILITIES, PITCHER_ABILITIES, RULES_VERSION } from '@playball/rules';
import type { GameInput, HitterSnapshot, PitcherSnapshot, TeamSnapshot } from '../src/types.js';

export function team(key: string, value = 50, bullpen = 3): TeamSnapshot {
  const lineup: HitterSnapshot[] = Array.from({ length: 9 }, (_, i) => ({
    simulationKey: `${key}-h${i}`, abilities: Object.fromEntries(HITTER_ABILITIES.map(axis => [axis, value * 10_000])),
    fatigue: 0, morale: 1, temporary: {}, traitLogits: [], available: true, bats: i % 3 === 0 ? 'L' : i % 3 === 1 ? 'R' : 'S', approach: 'BALANCED',
  }));
  const pitchers: PitcherSnapshot[] = Array.from({ length: bullpen + 1 }, (_, i) => ({
    simulationKey: `${key}-p${i}`, abilities: Object.fromEntries(PITCHER_ABILITIES.map(axis => [axis, value * 10_000])),
    fatigue: 0, morale: 1, temporary: {}, traitLogits: [], throws: 'R', pitchForm: 'OVERHAND', role: i === 0 ? 'SP' : i === bullpen ? 'CP' : 'RP', available: true, recentOuts: 0,
    repertoire: [{ pitchId: 'P01', mastery: 2, weight: 60 }, { pitchId: 'P03', mastery: 1, weight: 40 }],
  }));
  return { simulationKey: key, lineup, fielders: lineup.slice(0, 8).map(p => ({ simulationKey: p.simulationKey, fit: 100 })), pitchers };
}
export function game(seed = 'test-42', competition: GameInput['competition'] = 'REGULAR'): GameInput {
  return { simulationKey: 'fixture-game', seed, rulesVersion: RULES_VERSION, competition, teams: [team('away'), team('home')] };
}

import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer} from '../src/high-school-career.js';
import {canonicalJson} from '../src/game.js';
import type {GameContribution} from '../src/records.js';
import {abilityKeys} from '@playball/rules';
import {createOwnCareerAssessment} from '../src/high-school-assessment.js';
import {refreshOwnCareerAssessment} from '../src/high-school-assessment.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../src/college-entry.js';
import {closeHighSchoolDay} from '../src/high-school-day.js';

// Controlled no-appearance receipts isolate transitions. The progress test covers real216-game play.
export function completedHighSchoolCareer(capAt?:number,kind:'HITTER'|'PITCHER'='HITTER'){
 const state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'route-world',seasonKey:'2029',seasonYear:2029,seed:'route-fixture',schoolId:'H01',...(kind==='PITCHER'?{secondaryPitch:'P03' as const}:{}),player:{simulationKey:'own',name:'진로선수',kind,position:kind==='HITTER'?'CF':'SP',throws:'R',bats:'R',pitchForm:kind==='HITTER'?null:'OVERHAND',archetype:'BALANCED',focus:abilityKeys(kind).slice(0,4),difficulty:'GROWTH'}}),'GROWTH');
 if(capAt!==undefined){
  const values=Object.fromEntries(abilityKeys(kind).map(k=>[k,capAt]));
  state.world.players.own={...state.world.players.own!,abilities:values,potential:{...values},careerPeaks:{...values}};
  state.development!.seasonStartPlayer=structuredClone(state.world.players.own);
  state.ownAssessment=createOwnCareerAssessment(state.world);
 }
 state.phaseContext={phase:'SEASON_REVIEW'};
 for(const game of state.world.schedule){
  const line={games:1,W:0,L:0,T:1,R:0,RA:0};
  const contribution:GameContribution={gameKey:game.simulationKey,worldDay:game.worldDay,scope:{seasonKey:state.world.seasonKey,leagueKey:'HS',phase:'REGULAR'},teams:{[game.awayTeamKey]:line,[game.homeTeamKey]:line},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  state.records.games[game.simulationKey]=contribution;
  for(const teamKey of [game.awayTeamKey,game.homeTeamKey])state.health.games=[...state.health.games,{evidence:{gameKey:game.simulationKey,teamKey,seasonKey:state.world.seasonKey,day:game.worldDay,roster:state.world.schools.find(s=>s.id===teamKey)!.roster,appearances:[]},result:{injured:[],recovered:[]}}];
 }
 state.records.revision=216;
 state.days.days=Array.from({length:150},(_,i)=>{
  const day=31+i,contributions=Object.values(state.records.games).filter(g=>g.worldDay===day).sort((a,b)=>a.gameKey<b.gameKey?-1:1);
  return {day,evidence:canonicalJson({worldKey:state.world.worldKey,seasonKey:state.world.seasonKey,day,contributions}),result:{injured:[],recovered:[]}};
 });
 return state;
}

export function enrolledCollegeCareer(kind:'HITTER'|'PITCHER'='HITTER'){
 const source=completedHighSchoolCareer(undefined,kind);source.ownAssessment=refreshOwnCareerAssessment(source);
 const reviewed=acknowledgeHighSchoolSeasonReview(source,source.revision),opened=openHighSchoolCareerRoute(reviewed,reviewed.revision,1).career,view=highSchoolCareerRouteView(opened);
 const admitted=enrollHighSchoolCollege(opened,opened.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'}),closed=closeHighSchoolSeasonForCollege(admitted,admitted.revision,true);
 return startAdmittedCollegeSeason(closed,closed.revision);
}

// Team-only controlled scores isolate cup seeding; real college216-game play is tested separately.
export function completedCollegeRegularSeason(){
 const state=enrolledCollegeCareer();state.phaseContext={phase:'SEASON_REVIEW'};
 for(const game of state.world.schedule){
  const away=game.awayTeamKey<game.homeTeamKey;
  state.records.games[game.simulationKey]={gameKey:game.simulationKey,worldDay:game.worldDay,scope:{seasonKey:state.world.seasonKey,leagueKey:'COLLEGE',phase:'REGULAR'},teams:{[game.awayTeamKey]:{games:1,W:Number(away),L:Number(!away),T:0,R:Number(away),RA:Number(!away)},[game.homeTeamKey]:{games:1,W:Number(!away),L:Number(away),T:0,R:Number(!away),RA:Number(away)}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  state.records.revision++;
 }
 const first=Math.min(...state.world.schedule.map(g=>g.worldDay)),last=Math.max(...state.world.schedule.map(g=>g.worldDay));
 for(let day=first;day<=last;day++){
  // Receipts are real reducer results, with only future games hidden until their date is closed.
  const records={...state.records,games:Object.fromEntries(Object.entries(state.records.games).filter(([,g])=>g.scope.seasonKey!==state.world.seasonKey || g.worldDay<=day))};
  const closed=closeHighSchoolDay(state.world,records,state.health,state.days,day);state.world=closed.world;state.health=closed.health;state.days=closed.days;
 }
 state.ownAssessment=refreshOwnCareerAssessment(state);return state;
}
