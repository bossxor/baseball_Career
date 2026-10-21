import {roleScore} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboSeasonProgress} from './kbo-progress.js';
import {assertCareerRevision} from './high-school-career.js';
import {recordTotals} from './records.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain,eventDefinition} from './events.js';
import type {KboLeagueKey} from './kbo-day.js';
import {protagonistLeague} from './kbo-windows.js';

export interface KboCallupReview {seasonKey:string;teamGames:number;outcome:'NO_SLOT'|'BELOW'|'INJURED'|'OFFERED';comparedKey:string|null;candidateScore:number;comparedScore:number|null}

/** 01/08: competition = roleScore×.8 + performance index×.2 (index 50 below 50 PA / 30 outs). */
export function kboCompetitionScore(career:KboCareer,key:string,league:KboLeagueKey):number {
 const p=career.world.players[key]!,t=recordTotals(career.records,{leagueKey:league,phase:'REGULAR',seasonKey:career.world.seasonKey});
 const perf=p.kind==='HITTER'?recentBattingPerformance(t.batting[key]?{...emptyBatting(),...pick(t.batting[key]!,Object.keys(emptyBatting()))}:emptyBatting()):recentPitchingPerformance(t.pitching[key]?{...emptyPitching(),...pick(t.pitching[key]!,Object.keys(emptyPitching()))}:emptyPitching());
 return .8*roleScore(p.kind,p.abilities,p.position)+.2*perf;
}
function pick<T extends object>(source:T,keys:readonly string[]):Partial<T>{return Object.fromEntries(Object.entries(source).filter(([k])=>keys.includes(k))) as Partial<T>;}
function futuresTeamGames(career:KboCareer):number {
 return Object.values(career.records.games).filter(g=>g.scope.leagueKey==='FUTURES' && g.scope.seasonKey===career.world.seasonKey && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,career.protagonistClubId)).length;
}

/** 01: a futures player is reviewed every 20 team games. The slot is the weakest healthy first-team player at the same
 * position (hitter) or role (pitcher); the candidate must score higher (ties: lower fatigue, then smaller ID).
 * Only the first ever call-up is an E09 event; later moves are outside this step. Returns null when nothing is due. */
export function reviewKboCallup(source:KboCareer,day:number,progress:KboSeasonProgress):KboCareer|null {
 if(protagonistLeague(source)!=='FUTURES')return null;
 const games=futuresTeamGames(source),season=source.world.seasonKey;
 if(games===0 || games%20!==0 || (source.callupReviews??[]).some(r=>r.seasonKey===season && r.teamGames===games))return null;
 if(source.events.some(e=>e.definitionId==='E09'))return null;
 const key=source.protagonistKey,me=source.world.players[key]!,club=source.world.clubs.find(c=>c.id===source.protagonistClubId)!;
 const candidateScore=kboCompetitionScore(source,key,'FUTURES');
 const record=(outcome:KboCallupReview['outcome'],comparedKey:string|null,comparedScore:number|null)=>({seasonKey:season,teamGames:games,outcome,comparedKey,candidateScore,comparedScore});
 const career=structuredClone(source);
 if(Object.hasOwn(source.health.injuries,key)){career.callupReviews=[...(source.callupReviews??[]),record('INJURED',null,null)];return career;}
 const slots=club.firstTeam.filter(k=>!Object.hasOwn(source.health.injuries,k) && source.world.players[k]!.kind===me.kind && source.world.players[k]!.position===me.position)
  .map(k=>({key:k,score:kboCompetitionScore(source,k,'KBO'),fatigue:source.world.players[k]!.fatigue}))
  .sort((a,b)=>a.score-b.score || b.fatigue-a.fatigue || (a.key<b.key?1:-1));
 const weakest=slots[0];
 if(!weakest){career.callupReviews=[...(source.callupReviews??[]),record('NO_SLOT',null,null)];return career;}
 const wins=candidateScore>weakest.score || candidateScore===weakest.score && (me.fatigue<weakest.fatigue || me.fatigue===weakest.fatigue && key<weakest.key);
 career.callupReviews=[...(source.callupReviews??[]),record(wins?'OFFERED':'BELOW',weakest.key,weakest.score)];
 if(!wins)return career;
 const definition=eventDefinition('E09');
 const event=createWorldEvent({definitionId:'E09',worldKey:career.world.worldKey,seasonKey:season,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:key,milestoneKey:JSON.stringify(['kbo-callup',season,games])}},
  resume:{worldKey:career.world.worldKey,seasonKey:season,phase:'SEASON_PROGRESS',competitionKey:'FUTURES',registrationKey:club.id,sourceRevision:career.revision+1},sourceSequence:career.events.length+1,worldDay:day});
 career.events=[...career.events,event];
 career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{...structuredClone(progress),pendingGame:null}};
 return career;
}

/** ACCEPT_CALLUP swaps me into the first team with the reviewed player moving to futures; DEFER_CALLUP keeps both. */
export function resolveKboCallup(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:'ACCEPT_CALLUP'|'DEFER_CALLUP'}):KboCareer {
 assertCareerRevision(source,expectedRevision);const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==input.eventKey)throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey);if(!event || event.definitionId!=='E09')throw new RangeError('INVALID_CALLUP_EVENT');
 const review=(source.callupReviews??[]).at(-1);if(!review || review.outcome!=='OFFERED' || !review.comparedKey)throw new RangeError('INVALID_CALLUP_EVENT');
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['ACCEPT_CALLUP','DEFER_CALLUP']};
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,context);if(!selected.domain)throw new RangeError('INVALID_CALLUP_EVENT');
 const career=structuredClone(source);
 if(input.command==='ACCEPT_CALLUP'){
  const club=career.world.clubs.find(c=>c.id===career.protagonistClubId)!;
  if(!club.firstTeam.includes(review.comparedKey) || club.firstTeam.includes(career.protagonistKey))throw new RangeError('CALLUP_SLOT_CHANGED');
  club.firstTeam=club.firstTeam.map(k=>k===review.comparedKey?career.protagonistKey:k);
  career.registration={...career.registration,firstTeam:true,competitionKey:'KBO'};
 }
 const resolved=completeEventDomain(event,selected.domain,JSON.stringify(['kbo-callup',source.world.worldKey,input.command,source.revision+1]),context);
 career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.phaseContext=structuredClone(phase.resume);career.revision++;
 return career;
}
