import {settleCareerSeasonAlias} from './career-alias.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {highSchoolCareerRouteView} from './high-school-route.js';
import {collegeGraduationRouteView} from './college-graduation.js';
import {canonicalJson} from './game.js';
import {completeBlockingEvent} from './events.js';
import {assertKboDraft} from './kbo-draft.js';
import {careerKboDraftView} from './career-kbo.js';
import {createSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createRoundRobinSchedule} from './schedule.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {createSeasonGrowthLedger,finalizeSeasonGrowth} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {archiveSchoolSeason} from './college-entry.js';
import {createSchoolEmergencyRegistry} from './high-school-emergency.js';
import {openRetryCareerEpisode,retryCareerRouteView} from './retry-career.js';
import type {RetryRouteAuthority} from './retry-career.js';
import {assertPreparationSeason,startPreparationSeason,confirmPreparationPreseason as confirmPreseason,advancePreparationSeason,completePreparationSeason,preparationSeasonView,trainPreparationSeason,setPreparationPlan,setPreparationRosters} from './preparation-season.js';
import type {PreparationSeason,PreparationWorld} from './preparation-season.js';
import type {TrainingChoice} from './training.js';
import {refreshCareerRouteNotices} from './career-route-notices.js';

export interface CareerPreparationLedger {version:1;used:number;seasons:readonly {seasonKey:string;receiptKey:string;baseScore:number}[]}
function active(source:HighSchoolCareer):PreparationSeason {
 const p=source.preparationSeason;
 if(!p||source.world.leagueKey!=='INDEPENDENT'||!source.preparation||!source.retryCareer)throw new RangeError('PREPARATION_REQUIRED');
 assertPreparationSeason(p);
 if(source.preparation.version!==1||source.preparation.seasons.some(s=>!p.retry.periods.some(period=>period.worldSeasonId===s.seasonKey&&period.evidenceReceipt===s.receiptKey&&period.usageCharged)||!Number.isFinite(s.baseScore))||new Set(source.preparation.seasons.map(s=>s.seasonKey)).size!==source.preparation.seasons.length)throw new RangeError('INVALID_CAREER_PREPARATION_LEDGER');
 if(p.revision>source.revision||canonicalJson(p.retry)!==canonicalJson(source.retryCareer)||source.preparation.used!==p.retry.careerPreparationUsed||source.preparation.seasons.length!==source.preparation.used||canonicalJson([p.world,p.records,p.health,p.days,p.development,p.seasonGrowth,p.traits??null,p.relationships??null,p.styleUsedWindows])!==canonicalJson([source.world,source.records,source.health,source.days,source.development,source.seasonGrowth,source.traits??null,source.relationships??null,source.styleUsedWindows]))throw new RangeError('STALE_CAREER_PREPARATION');
 const phase=source.phaseContext,last=Math.max(...p.world.schedule.map(g=>g.worldDay));
 if(p.phase==='PREPARATION_PRE'&&phase.phase!=='PRESEASON_SETUP'||p.phase==='PREPARATION_RESULT'&&!['CAREER_ROUTE','NEXT_SEASON_READY'].includes(phase.phase)||p.phase==='PREPARATION_REGULAR'&&(p.nextWorldDay>last?phase.phase!=='SEASON_REVIEW':phase.phase!=='SEASON_PROGRESS'||phase.nextWorldDay!==p.nextWorldDay||canonicalJson(phase.pendingGame)!==canonicalJson(p.pendingGame)))throw new RangeError('STALE_CAREER_PREPARATION_PHASE');
 return p;
}
/** Root readers validate both the domain ledger and its materialized root fields. */
export function assertCareerPreparation(source:HighSchoolCareer):void {assertCareerRevision(source,source.revision);active(source);}
function commandPreparation(source:HighSchoolCareer,revision:number):PreparationSeason {
 assertCareerRevision(source,revision);const p=structuredClone(active(source));
 // Other root domains may advance the shared revision without changing preparation evidence.
 p.revision=revision;p.retry.revision=revision;return p;
}
function publish(source:HighSchoolCareer,p:PreparationSeason):HighSchoolCareer {
 const next=structuredClone(source);
 next.preparationSeason=p;next.retryCareer=structuredClone(p.retry);next.revision=p.revision;
 next.world=p.world as HighSchoolCareer['world'];next.records=p.records;next.health=p.health;next.days=p.days;next.development=p.development;next.seasonGrowth=p.seasonGrowth;next.styleUsedWindows=p.styleUsedWindows;
 if(p.traits)next.traits=p.traits;if(p.relationships)next.relationships=p.relationships;
 next.phaseContext=p.phase==='PREPARATION_PRE'?{phase:'PRESEASON_SETUP'}:p.phase==='PREPARATION_RESULT'?{phase:'CAREER_ROUTE'}:p.nextWorldDay>Math.max(...p.world.schedule.map(g=>g.worldDay))?{phase:'SEASON_REVIEW'}:{phase:'SEASON_PROGRESS',nextWorldDay:p.nextWorldDay,pendingGame:p.pendingGame};
 return next;
}
function authority(source:HighSchoolCareer):RetryRouteAuthority {
 const p=source.world.players[source.world.protagonistKey]!;
 return {worldKey:source.world.worldKey,playerKey:p.simulationKey,seasonKey:source.world.seasonKey,age:p.age,worldDay:source.days.days.at(-1)?.day??0,authorityRevision:source.revision,hasProContractHistory:false,activeContract:false,domesticRightsAvailable:true,domesticDraftEligible:true,mandatoryReturnActive:false,militaryStatus:'UNRESOLVED',collegeAdmissionRefs:[],collegeResumeRef:null,domesticOffers:[],usOffers:[],usScoutScore:0,usRightsEligible:false,retirementAllowed:true};
}
/** Completed independent evidence is the only source for another domestic amateur assessment. */
export function careerPreparationDraftScore(source:HighSchoolCareer):number {
 const p=active(source);
 if(!['CAREER_ROUTE','NEXT_SEASON_READY'].includes(source.phaseContext.phase)||p.phase!=='PREPARATION_RESULT'||!p.result||source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_PREPARATION_PHASE');
 return p.result.baseScore;
}
/** Reuse existing world identities/abilities. A separate independent population policy is not specified. */
export function startCareerPreparation(source:HighSchoolCareer,revision:number,eventVersion?:number):HighSchoolCareer {
 assertCareerRevision(source,revision);
 if(source.phaseContext.phase!=='CAREER_ROUTE'||source.kboYearEnd||source.usYearEnd||source.collegeService||source.usRecruitment||source.collegeAdmission&&source.collegeAdmission.status!=='GRADUATED')throw new RangeError('PREPARATION_NOT_ELIGIBLE');
 if(source.world.leagueKey==='INDEPENDENT')careerPreparationDraftScore(source);else if(source.world.leagueKey==='COLLEGE')collegeGraduationRouteView(source);else highSchoolCareerRouteView(source);
 const recruitment=source.kboRecruitment;
 if(!recruitment)throw new RangeError('DOMESTIC_ASSESSMENT_REQUIRED');
 assertKboDraft(recruitment.world,recruitment.program);careerKboDraftView(source);
 if(!recruitment.program.result||recruitment.program.decision==='SIGNED'||recruitment.program.result.round&&recruitment.program.decision!=='DECLINED')throw new RangeError('UNCONTRACTED_RESULT_REQUIRED');
 if(!source.world.calendar||!source.development||!source.seasonGrowth)throw new RangeError('PREPARATION_SOURCE_INCOMPLETE');
 const key=source.world.protagonistKey,seasonKey=String(Number(source.world.seasonKey)+1),calendar=createSeasonCalendar(Number(seasonKey),source.world.calendar.version);
 let next=structuredClone(source);
 if(!next.seasonGrowth!.finalized){const aged=finalizeSeasonGrowth(next.world.players[key]!,next.seasonGrowth!,next.world.calendar!.growthDays.length);next.world.players[key]=aged.player;next.seasonGrowth=aged.ledger;next.health=closeSeasonHealth(next.health,next.world.seasonKey).ledger;}
 const receipt=JSON.stringify(['preparation-entry',source.world.worldKey,source.world.seasonKey,key,recruitment.program.result.receiptKey]);
 const open=next.events.filter(e=>e.status==='OPEN');
 if(open.length){if(open.length!==1||open[0]!.definitionId!=='E04'||eventVersion===undefined)throw new RangeError('EVENT_VERSION_REQUIRED');const event=open[0]!;next.events=next.events.map(e=>e.eventKey===event.eventKey?completeBlockingEvent(event,eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:receipt,command:'START_PREPARATION'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['START_PREPARATION']}):e);}
 next.previousSeasons=[...(next.previousSeasons??[]),archiveSchoolSeason(next,receipt)];
 const retry=openRetryCareerEpisode(source.retryCareer,source.retryCareer?.revision??0,{worldKey:source.world.worldKey,playerKey:key,receiptKey:recruitment.program.result.receiptKey,reason:source.world.leagueKey==='COLLEGE'?'COLLEGE_UNDRAFTED':'HIGH_SCHOOL_UNDRAFTED',seasonKey:source.world.seasonKey,age:source.world.players[key]!.age});
 // One root revision owns both domain ledgers, including after unrelated route commands.
 retry.revision=revision;
 const a=authority(source),view=retryCareerRouteView(retry,a),world=structuredClone(next.world) as PreparationWorld & HighSchoolCareer['world'];
 world.leagueKey='INDEPENDENT';world.seasonKey=seasonKey;world.calendar=calendar;
 for(const p of Object.values(world.players)){p.age++;p.fatigue=0;}
 for(const book of Object.values(world.repertoires)){if(book.learning)throw new RangeError('PITCH_LEARNING_SETTLEMENT_REQUIRED');book.seasonId=seasonKey;book.ledger=emptyPitchXpLedger();book.learning=null;}
 world.schedule=scheduleHighSchoolCalendar(createRoundRobinSchedule({teamKeys:world.schools.map(t=>t.id),leagueKey:'INDEPENDENT',seasonKey,startDay:calendar.highSchoolDays[0]!},6),calendar);
 const traits=next.traits?{...next.traits,lastSeasonKey:seasonKey,lastClosedDay:null}:undefined;
 const p=startPreparationSeason(retry,revision,a,{episodeId:retry.episodes.at(-1)!.episodeId,routePreviewId:view.routePreviewId,world,difficulty:source.difficulty,records:next.records,health:next.health,development:next.development!,styleUsedWindows:next.styleUsedWindows,seasonGrowth:createSeasonGrowthLedger(world.players[key]!,seasonKey,calendar.growthDays.length),...(traits?{traits}:{}),...(next.relationships?{relationships:next.relationships}:{})});
 next.previousKboRecruitments=[...(next.previousKboRecruitments??[]),recruitment];delete next.kboRecruitment;delete next.graduation;delete next.collegeGraduation;delete next.collegeResult;delete next.collegeCup;delete next.collegeEarlyRoute;
 next.emergency=createSchoolEmergencyRegistry(world);next.preparation=next.preparation??{version:1,used:retry.careerPreparationUsed,seasons:[]};
 next=publish(next,p);return refreshCareerRouteNotices(next);
}
export function confirmPreparationPreseason(source:HighSchoolCareer,revision:number):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.phaseContext.phase!=='PRESEASON_SETUP')throw new RangeError('INVALID_PREPARATION_PHASE');return publish(source,confirmPreseason(commandPreparation(source,revision),revision));
}
export function advanceCareerPreparation(source:HighSchoolCareer,revision:number,mode:'ONE_GAME'|'ONE_MONTH'='ONE_GAME') {
 assertCareerRevision(source,revision);if(source.phaseContext.phase!=='SEASON_PROGRESS')throw new RangeError('INVALID_PREPARATION_PHASE');const result=advancePreparationSeason(commandPreparation(source,revision),revision,mode);return {...result,career:publish(source,result.career)};
}
export function trainCareerPreparation(source:HighSchoolCareer,revision:number,choice:TrainingChoice):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.phaseContext.phase!=='SEASON_PROGRESS')throw new RangeError('INVALID_PREPARATION_PHASE');return publish(source,trainPreparationSeason(commandPreparation(source,revision),revision,choice));
}
export function setCareerPreparationPlan(source:HighSchoolCareer,revision:number,focus:readonly string[],archetype:string):HighSchoolCareer {
 assertCareerRevision(source,revision);if(!['PRESEASON_SETUP','SEASON_PROGRESS'].includes(source.phaseContext.phase))throw new RangeError('INVALID_PREPARATION_PHASE');return publish(source,setPreparationPlan(commandPreparation(source,revision),revision,focus,archetype));
}
export function setCareerPreparationRosters(source:HighSchoolCareer,revision:number,rosters:Readonly<Record<string,readonly string[]>>):HighSchoolCareer {
 assertCareerRevision(source,revision);if(!['PRESEASON_SETUP','SEASON_PROGRESS'].includes(source.phaseContext.phase))throw new RangeError('INVALID_PREPARATION_PHASE');return publish(source,setPreparationRosters(commandPreparation(source,revision),revision,rosters));
}
export function settleCareerPreparation(source:HighSchoolCareer,revision:number,forfeitUnusedTraining=false):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_PREPARATION_PHASE');const p=commandPreparation(source,revision);
 if(!p.development.trainingUsedSeasons.includes(p.world.seasonKey)&&!forfeitUnusedTraining)throw new RangeError('TRAINING_FORFEIT_REQUIRED');
 const trained=p.development.trainingUsedSeasons.includes(p.world.seasonKey)?p:trainPreparationSeason(p,revision,{type:'SKIP'});
 const result=completePreparationSeason(trained,trained.revision),next=publish(source,result);
 next.preparation={version:1,used:result.retry.careerPreparationUsed,seasons:[...source.preparation!.seasons,{seasonKey:result.world.seasonKey,receiptKey:result.result!.receiptKey,baseScore:result.result!.baseScore}]};return settleCareerSeasonAlias(next,source);
}
export function careerPreparationView(source:HighSchoolCareer) {
 const p=active(source),view=preparationSeasonView(p);
 return {...view,used:source.preparation!.used,remaining:3-source.preparation!.used,seasons:source.preparation!.seasons.map(s=>({seasonKey:s.seasonKey,baseScore:s.baseScore}))};
}
