import {assertFocus,overall} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import {canonicalJson} from './game.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from './high-school-game.js';
import type {CompetitionGameWorld,HighSchoolGameJob} from './high-school-game.js';
import {highSchoolGameContext} from './high-school-progress.js';
import {createSchoolDayLedger,closeSchoolCompetitionDay} from './high-school-day.js';
import type {SchoolDayLedger} from './high-school-day.js';
import {assertSeasonCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {assertSchedule} from './schedule.js';
import type {ScheduledGame} from './schedule.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import {recordTotals,assertContributionSplits} from './records.js';
import {validatePitchWeights} from './repertoire.js';
import {settleRegisteredPitchLearning} from './pitch-learning-progress.js';
import type {RecordLedger} from './records.js';
import {closeSeasonHealth,validateHealthLedger} from './health.js';
import type {HealthLedger} from './health.js';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods,finalizeSeasonGrowth,validateSeasonGrowthLedger} from './growth-ledger.js';
import type {SeasonGrowthLedger,ClosedGrowthPeriod} from './growth-ledger.js';
import {refreshCareerTraits,settleStarterSeasonTraits} from './high-school-traits.js';
import type {CareerTraitLedger} from './high-school-traits.js';
import type {RelationshipLedger} from './relationships.js';
import {applySeasonTraining} from './training.js';
import type {TrainingChoice} from './training.js';
import type {CareerDevelopmentLedger} from './high-school-training.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {draftBaseScore,draftPreview} from './draft.js';
import {assertRetryCareerLedger,assertRetryCareerRevision,beginRetryPreparation,completeRetryPreparation,retryCareerRouteView} from './retry-career.js';
import type {RetryCareerLedger,RetryRouteAuthority} from './retry-career.js';
import {assertUsAmateurReturnLedger} from './us-amateur-return.js';
import type {UsAmateurReturnLedger} from './us-amateur-return.js';

/** Existing real population, supplied by the world owner. No invented independent NPC skill distribution. */
export interface PreparationWorld extends CompetitionGameWorld {leagueKey:'INDEPENDENT';protagonistSchoolId:string;calendar:SeasonCalendar;schedule:ScheduledGame[]}
export interface PreparationSeason {
 version:1;revision:number;retry:RetryCareerLedger;world:PreparationWorld;difficulty:Difficulty;records:RecordLedger;health:HealthLedger;days:SchoolDayLedger;
 phase:'PREPARATION_PRE'|'PREPARATION_REGULAR'|'PREPARATION_RESULT';nextWorldDay:number;pendingGame:HighSchoolGameJob|null;
 development:CareerDevelopmentLedger;styleUsedWindows:readonly string[];seasonGrowth:SeasonGrowthLedger;traits?:CareerTraitLedger;relationships?:RelationshipLedger;
 openingRehabilitation:boolean;planHistory:readonly {worldDay:number;focus:readonly string[];archetype:string}[];
 result?:{receiptKey:string;baseScore:number;adjustedPerformance:number;completedTeamGames:48};
}
export function assertPreparationWorld(world:PreparationWorld):void {
 assertSeasonCalendar(world.calendar);
 if(!world.worldKey||!world.seed||world.leagueKey!=='INDEPENDENT'||world.seasonKey!==String(world.calendar.year)||!world.schools.some(t=>t.id===world.protagonistSchoolId&&t.roster.includes(world.protagonistKey)))throw new RangeError('INVALID_PREPARATION_WORLD');
 assertSchedule(world.schedule,world.schools.map(t=>t.id),48,24);
 const registered=new Set<string>();
 for(const t of world.schools){if(!t.id||!t.roster.length)throw new RangeError('INVALID_PREPARATION_ROSTER');for(const key of t.roster){if(registered.has(key)||world.players[key]?.simulationKey!==key)throw new RangeError('INVALID_PREPARATION_ROSTER');registered.add(key);validateDevelopmentPlayer(world.players[key]!);if(world.players[key]!.kind==='PITCHER'){const r=world.repertoires[key];if(!r)throw new RangeError('MISSING_PREPARATION_REPERTOIRE');validatePitchWeights(r.book,r.weights);}}}
 if(world.schedule.some(g=>g.leagueKey!=='INDEPENDENT'||g.seasonKey!==world.seasonKey||g.phase!==undefined||!world.calendar.highSchoolDays.includes(g.worldDay)))throw new RangeError('INVALID_PREPARATION_SCHEDULE');
}
export function assertPreparationSeason(source:PreparationSeason):void {
 assertRetryCareerLedger(source.retry,{worldKey:source.world.worldKey,playerKey:source.world.protagonistKey});assertPreparationWorld(source.world);validateHealthLedger(source.health);validateSeasonGrowthLedger(source.seasonGrowth);
 if(source.version!==1||source.revision!==source.retry.revision||source.phase!==source.retry.phase||!['GROWTH','REALISTIC','SECRET_CHEAT'].includes(source.difficulty)||source.retry.seasonKey!==source.world.seasonKey||source.retry.age!==source.world.players[source.world.protagonistKey]!.age||source.seasonGrowth.seasonKey!==source.world.seasonKey||source.seasonGrowth.playerKey!==source.world.protagonistKey||source.seasonGrowth.worldGrowthDays!==source.world.calendar.growthDays.length||source.days.worldKey!==source.world.worldKey||source.days.seasonKey!==source.world.seasonKey||!Number.isSafeInteger(source.nextWorldDay)||source.planHistory.length===0||source.planHistory[0]!.worldDay!==Math.min(...source.world.schedule.map(g=>g.worldDay)))throw new RangeError('INVALID_PREPARATION_SEASON');
 if(!Number.isSafeInteger(source.records.revision)||source.records.revision<0||source.days.schemaVersion!==1||new Set(source.development.trainingUsedSeasons).size!==source.development.trainingUsedSeasons.length||source.development.seasonStartPlayer.simulationKey!==source.world.protagonistKey)throw new RangeError('INVALID_PREPARATION_LEDGERS');
 for(const g of Object.values(source.records.games))assertContributionSplits(g);
 const first=Math.min(...source.world.schedule.map(g=>g.worldDay)),last=Math.max(...source.world.schedule.map(g=>g.worldDay));
 if(source.nextWorldDay<first||source.nextWorldDay>last+1||source.days.days.length!==source.nextWorldDay-first||source.days.days.some((d,i)=>d.day!==first+i)||source.phase==='PREPARATION_PRE'&&(source.days.days.length>0||source.pendingGame!==null)||source.phase==='PREPARATION_RESULT'&&(!source.result||!source.seasonGrowth.finalized||source.nextWorldDay!==last+1)||source.phase!=='PREPARATION_RESULT'&&(source.result!==undefined||source.seasonGrowth.finalized))throw new RangeError('INVALID_PREPARATION_PROGRESS');
 for(const [i,p]of source.planHistory.entries()){assertFocus(source.world.players[source.world.protagonistKey]!.kind,p.focus);archetypeFor(source.world.players[source.world.protagonistKey]!.kind,p.archetype);if(!Number.isSafeInteger(p.worldDay)||p.worldDay<first||p.worldDay>last+1||i>0&&p.worldDay<=source.planHistory[i-1]!.worldDay)throw new RangeError('INVALID_PREPARATION_PLAN');}
 if(source.pendingGame&&(source.phase!=='PREPARATION_REGULAR'||source.pendingGame.worldDay!==source.nextWorldDay||source.pendingGame.worldKey!==source.world.worldKey||source.pendingGame.seasonKey!==source.world.seasonKey))throw new RangeError('INVALID_PREPARATION_GAME');
 const activeGames=Object.values(source.records.games).filter(g=>g.scope.seasonKey===source.world.seasonKey&&g.scope.leagueKey==='INDEPENDENT');
 if(activeGames.some(g=>!source.world.schedule.some(s=>s.simulationKey===g.gameKey&&s.worldDay===g.worldDay&&Object.hasOwn(g.teams,s.homeTeamKey)&&Object.hasOwn(g.teams,s.awayTeamKey))||g.worldDay>source.nextWorldDay))throw new RangeError('INVALID_PREPARATION_RECORDS');
 if(source.phase==='PREPARATION_RESULT'){
  const receipt=JSON.stringify(['preparation-complete',source.world.worldKey,source.world.seasonKey,source.world.protagonistKey,source.records.revision,source.retry.episodes.at(-1)!.episodeId]);
  if(source.result!.receiptKey!==receipt||source.retry.periods.at(-1)?.evidenceReceipt!==receipt||source.result!.completedTeamGames!==48||count(source)!==48||activeGames.length!==source.world.schedule.length||!source.health.closedSeasons.includes(source.world.seasonKey)||source.seasonGrowth.aging?.elapsedDays!==source.world.calendar.growthDays.length||!Number.isFinite(source.result!.baseScore)||!Number.isFinite(source.result!.adjustedPerformance)||source.result!.adjustedPerformance<0||source.result!.adjustedPerformance>100)throw new RangeError('INVALID_PREPARATION_RESULT');
 }
}
function assertRevision(source:PreparationSeason,revision:number):void {assertPreparationSeason(source);assertRetryCareerRevision(source.retry,revision);}
function bump(source:PreparationSeason):PreparationSeason {source.revision++;source.retry.revision=source.revision;return source;}
function count(source:PreparationSeason):number {return Object.values(source.records.games).filter(g=>g.scope.seasonKey===source.world.seasonKey&&g.scope.leagueKey==='INDEPENDENT'&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,source.world.protagonistSchoolId)).length;}
function safeDay(source:PreparationSeason):void {if(source.pendingGame||Object.values(source.records.games).some(g=>g.scope.seasonKey===source.world.seasonKey&&g.scope.leagueKey==='INDEPENDENT'&&g.worldDay>=source.nextWorldDay))throw new RangeError('PREPARATION_DAY_IN_PROGRESS');}
/** The world owner supplies existing identities when injuries leave an illegal lineup. Never generates a new NPC profile. */
export function setPreparationRosters(source:PreparationSeason,revision:number,rosters:Readonly<Record<string,readonly string[]>>):PreparationSeason {
 assertRevision(source,revision);if(source.phase==='PREPARATION_RESULT')throw new RangeError('INVALID_PREPARATION_PHASE');safeDay(source);
 if(Object.keys(rosters).length!==source.world.schools.length||source.world.schools.some(t=>!Object.hasOwn(rosters,t.id)))throw new RangeError('INVALID_PREPARATION_ROSTER');
 const next=structuredClone(source);for(const team of next.world.schools)team.roster=[...rosters[team.id]!];assertPreparationWorld(next.world);return bump(next);
}
export function startPreparationSeason(source:RetryCareerLedger,revision:number,a:RetryRouteAuthority,input:{episodeId:string;routePreviewId:string;world:PreparationWorld;difficulty:Difficulty;records:RecordLedger;health:HealthLedger;development:CareerDevelopmentLedger;styleUsedWindows:readonly string[];seasonGrowth?:SeasonGrowthLedger;traits?:CareerTraitLedger;relationships?:RelationshipLedger;mandatoryReturn?:UsAmateurReturnLedger}):PreparationSeason {
 assertPreparationWorld(input.world);validateHealthLedger(input.health);
 const w=input.world,p=w.players[w.protagonistKey]!,first=Math.min(...w.schedule.map(g=>g.worldDay)),last=Math.max(...w.schedule.map(g=>g.worldDay));
 if(w.worldKey!==source.worldKey||w.protagonistKey!==source.playerKey||p.age!==source.age+1||input.health.closedSeasons.includes(w.seasonKey)||Object.values(input.records.games).some(g=>g.scope.seasonKey===w.seasonKey&&(Object.hasOwn(g.batting,p.simulationKey)||Object.hasOwn(g.pitching,p.simulationKey)||g.scope.leagueKey==='INDEPENDENT')))throw new RangeError('PREPARATION_ENTRY_CONFLICT');
 let retry:RetryCareerLedger;
 if(input.mandatoryReturn){
  const r=input.mandatoryReturn;assertRetryCareerRevision(source,revision);assertUsAmateurReturnLedger(r,{worldKey:w.worldKey,playerKey:w.protagonistKey});const view=retryCareerRouteView(source,a);
  if(view.routePreviewId!==input.routePreviewId)throw new RangeError('PREVIEW_STALE');
  const previous=r.years.at(-1)?.endingPlayer??r.sourcePlayer;
  if(r.status!=='PREPARING'||!['COMPLETED','NOT_APPLICABLE'].includes(r.militaryStatus)||!a.mandatoryReturnActive||a.activeContract||a.militaryStatus==='SERVING'||r.years.length>=2||w.seasonKey!==String(Number(r.sourceSeasonKey)+r.years.length+1)||source.seasonKey!==String(Number(w.seasonKey)-1)||input.episodeId!==source.episodes.at(-1)!.episodeId||source.periods.some(p=>p.worldSeasonId===w.seasonKey)||canonicalJson({...p,age:previous.age,fatigue:previous.fatigue})!==canonicalJson(previous))throw new RangeError('MANDATORY_RETURN_PREPARATION_NOT_READY');
  retry={...structuredClone(source),revision:revision+1,seasonKey:w.seasonKey,age:source.age+1,phase:'PREPARATION_PRE',periods:[...source.periods,{worldSeasonId:w.seasonKey,episodeId:input.episodeId,startDay:first,endDay:last+1,usageCharged:false,evidenceReceipt:null,kind:'MANDATORY_RETURN'}]};assertRetryCareerLedger(retry);
 }else retry=beginRetryPreparation(source,revision,a,{episodeId:input.episodeId,seasonKey:w.seasonKey,routePreviewId:input.routePreviewId,startDay:first,endDay:last+1});
 const growth=input.seasonGrowth??createSeasonGrowthLedger(p,w.seasonKey,w.calendar.growthDays.length);validateSeasonGrowthLedger(growth);
 if(canonicalJson(growth.seasonStart)!==canonicalJson(p)||growth.entries.length||growth.finalized)throw new RangeError('PREPARATION_GROWTH_ALREADY_STARTED');
 const next:PreparationSeason={version:1,revision:retry.revision,retry,world:structuredClone(w),difficulty:input.difficulty,records:structuredClone(input.records),health:structuredClone(input.health),days:createSchoolDayLedger(w),phase:'PREPARATION_PRE',nextWorldDay:first,pendingGame:null,development:{...structuredClone(input.development),seasonStartPlayer:structuredClone(p)},styleUsedWindows:[...input.styleUsedWindows],seasonGrowth:structuredClone(growth),...(input.traits?{traits:structuredClone(input.traits)}:{}),...(input.relationships?{relationships:structuredClone(input.relationships)}:{}),openingRehabilitation:Object.hasOwn(input.health.injuries,p.simulationKey),planHistory:[{worldDay:first,focus:[...p.focus],archetype:p.archetype}]};assertPreparationSeason(next);return next;
}
export function confirmPreparationPreseason(source:PreparationSeason,revision:number):PreparationSeason {
 assertRevision(source,revision);if(source.phase!=='PREPARATION_PRE')throw new RangeError('INVALID_PREPARATION_PHASE');
 const next=structuredClone(source);next.phase='PREPARATION_REGULAR';next.retry.phase=next.phase;return bump(next);
}
function calendarMonth(year:number,day:number):number {const leap=year%4===0&&(year%100!==0||year%400===0),lengths=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];let month=0;while(month<11&&day>=lengths[month]!){day-=lengths[month]!;month++;}return month;}
/** One bounded chunk; pending FINAL publication, health and cursor always travel in the same result. */
export function advancePreparationSeason(source:PreparationSeason,revision:number,mode:'ONE_GAME'|'ONE_MONTH'='ONE_GAME'):{career:PreparationSeason;stopReason:'CHUNK_LIMIT'|'ENGINE_LIMIT'|'ONE_GAME'|'ONE_MONTH'|'SEASON_COMPLETE'} {
 assertRevision(source,revision);if(source.phase!=='PREPARATION_REGULAR'||!['ONE_GAME','ONE_MONTH'].includes(mode))throw new RangeError('INVALID_PREPARATION_PHASE');
 const next=structuredClone(source),last=Math.max(...next.world.schedule.map(g=>g.worldDay)),initial=count(next),year=next.world.calendar.year,startMonth=calendarMonth(year,next.nextWorldDay);let pa=0,innings=0;
 const finish=(stopReason:'CHUNK_LIMIT'|'ENGINE_LIMIT'|'ONE_GAME'|'ONE_MONTH'|'SEASON_COMPLETE')=>({career:bump(next),stopReason});
 while(next.nextWorldDay<=last){
  const day=next.nextWorldDay;
  if(!next.pendingGame){const scheduled=next.world.schedule.filter(g=>g.worldDay===day&&!Object.hasOwn(next.records.games,g.simulationKey)).sort((a,b)=>a.simulationKey<b.simulationKey?-1:1)[0];
   if(scheduled){const context=highSchoolGameContext(next);context.unavailableKeys=context.unavailableKeys.filter(k=>Object.hasOwn(next.world.players,k));next.pendingGame=prepareSchoolCompetitionGame(next.world,next.records,scheduled,context);}}
  if(next.pendingGame){const before=next.pendingGame.game,job=advanceHighSchoolGame(next.pendingGame,1000-pa,20-innings);next.pendingGame=job;pa+=job.game.playCursor-before.playCursor;innings+=job.game.completedInnings-before.completedInnings;
   if(job.stopReason==='ENGINE_LIMIT')return finish('ENGINE_LIMIT');if(job.game.status!=='FINAL')return finish('CHUNK_LIMIT');
   const scheduled=next.world.schedule.find(g=>g.simulationKey===job.game.input.simulationKey)!;const committed=commitSchoolCompetitionGame(next.world,next.records,job,scheduled);next.world=committed.world;next.records=committed.records;next.pendingGame=null;
   if(next.world.schedule.some(g=>g.worldDay===day&&!Object.hasOwn(next.records.games,g.simulationKey))){if(pa>=1000||innings>=20)return finish('CHUNK_LIMIT');continue;}}
  const closed=closeSchoolCompetitionDay(next.world,next.records,next.health,next.days,day,next.world.schedule);next.world=closed.world;next.health=closed.health;next.days=closed.days;next.nextWorldDay=day+1;next.traits=refreshCareerTraits(next,day);
  for(const [key,book]of Object.entries(next.world.repertoires))if(book.learning){const team=next.world.schools.find(t=>t.roster.includes(key));if(team)next.world.repertoires[key]=settleRegisteredPitchLearning({worldKey:next.world.worldKey,seasonKey:next.world.seasonKey,playerKey:key,repertoire:book,records:next.records,health:next.health,schedule:next.world.schedule,scheduledGames:book.learning.registration?.scheduledGames??48,numerator:key===next.world.protagonistKey?(next.difficulty==='SECRET_CHEAT'?15:5):next.difficulty==='REALISTIC'?6:5});}
  if(next.nextWorldDay>last)return finish('SEASON_COMPLETE');
  if(mode==='ONE_GAME'&&count(next)>initial)return finish('ONE_GAME');
  if(mode==='ONE_MONTH'&&calendarMonth(year,next.nextWorldDay)!==startMonth)return finish('ONE_MONTH');
  if(pa>=1000||innings>=20)return finish('CHUNK_LIMIT');
 }
 return finish('SEASON_COMPLETE');
}
export function trainPreparationSeason(source:PreparationSeason,revision:number,choice:TrainingChoice):PreparationSeason {
 assertRevision(source,revision);if(source.phase!=='PREPARATION_REGULAR')throw new RangeError('INVALID_PREPARATION_PHASE');safeDay(source);
 const key=source.world.protagonistKey,p=source.world.players[key]!,d=source.development;
 const trained=applySeasonTraining(p,d.trainingUsedSeasons,choice,{seasonId:source.world.seasonKey,completedTeamGames:count(source),scheduledTeamGames:48,injured:Object.hasOwn(source.health.injuries,key),windowOpen:true,careerCheat:source.difficulty==='SECRET_CHEAT'},d.trainingRng);
 const next=structuredClone(source);next.world.players[key]=trained.player;next.development={...next.development,trainingUsedSeasons:trained.usedSeasons,trainingRng:trained.state,trainingResults:[...d.trainingResults,{seasonKey:source.world.seasonKey,choice:structuredClone(choice),success:trained.success,gainUnits:trained.gainUnits,fatigueBefore:p.fatigue,fatigueAfter:trained.player.fatigue,receiptKey:JSON.stringify(['preparation-training',source.world.worldKey,source.world.seasonKey,revision+1])}]};return bump(next);
}
export function setPreparationPlan(source:PreparationSeason,revision:number,focus:readonly string[],archetype:string):PreparationSeason {
 assertRevision(source,revision);if(source.phase==='PREPARATION_RESULT')throw new RangeError('INVALID_PREPARATION_PHASE');safeDay(source);
 const p=source.world.players[source.world.protagonistKey]!;assertFocus(p.kind,focus);archetypeFor(p.kind,archetype);
 const window=JSON.stringify([source.world.seasonKey,source.phase==='PREPARATION_PRE'?'PRE':'MID']);
 if(p.archetype!==archetype&&(source.phase==='PREPARATION_REGULAR'&&count(source)<24||source.styleUsedWindows.includes(window)||Object.hasOwn(source.health.injuries,p.simulationKey)))throw new RangeError('STYLE_WINDOW_CLOSED');
 const next=structuredClone(source);next.world.players[p.simulationKey]={...next.world.players[p.simulationKey]!,focus:[...focus],archetype};if(p.archetype!==archetype)next.styleUsedWindows=[...source.styleUsedWindows,window];
 next.planHistory=[...source.planHistory.filter(plan=>plan.worldDay!==source.nextWorldDay),{worldDay:source.nextWorldDay,focus:[...focus],archetype}];
 if(source.phase==='PREPARATION_PRE'){next.development.seasonStartPlayer=structuredClone(next.world.players[p.simulationKey]!);next.seasonGrowth.seasonStart=structuredClone(next.world.players[p.simulationKey]!);}return bump(next);
}
export function completePreparationSeason(source:PreparationSeason,revision:number):PreparationSeason {
 assertRevision(source,revision);if(source.phase==='PREPARATION_RESULT')return structuredClone(source);
 const w=source.world,last=Math.max(...w.schedule.map(g=>g.worldDay));
 if(source.phase!=='PREPARATION_REGULAR'||source.pendingGame||source.nextWorldDay!==last+1||count(source)!==48||w.schedule.some(g=>!Object.hasOwn(source.records.games,g.simulationKey)))throw new RangeError('PREPARATION_SEASON_INCOMPLETE');
 for(const d of source.days.days)closeSchoolCompetitionDay(w,source.records,source.health,source.days,d.day,w.schedule);
 const key=w.protagonistKey,start=source.development.seasonStartPlayer,periods:ClosedGrowthPeriod[]=[];
 let rehabilitating=source.openingRehabilitation;
 for(const [index,day]of w.calendar.growthDays.entries()){const closed=source.days.days.find(d=>d.day===day),plan=[...source.planHistory].reverse().find(p=>p.worldDay<=day)??source.planHistory[0]!,game=w.schedule.find(g=>g.worldDay===day&&(g.homeTeamKey===w.protagonistSchoolId||g.awayTeamKey===w.protagonistSchoolId)),c=game?source.records.games[game.simulationKey]:undefined;
  const appearances=start.kind==='HITTER'?c?.batting[key]?.PA??0:c?.pitching[key]?.outs??0;
  periods.push({periodKey:JSON.stringify(['preparation-growth',w.worldKey,w.seasonKey,day]),focus:[...plan.focus],archetype:plan.archetype,period:{startDay:index,endDay:index+1,levelSeasonDays:w.calendar.highSchoolDays.length,level:'COLLEGE',appearances,pitcherRole:start.position==='RP'?'RP':start.position==='CP'?'CP':'SP',rehabRatio:rehabilitating?1:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:true}}});
  if(rehabilitating&&appearances>0)throw new RangeError('INJURED_PREPARATION_APPEARANCE');if(closed?.result.injured.includes(key))rehabilitating=true;if(closed?.result.recovered.includes(key))rehabilitating=false;
 }
 if(rehabilitating!==Object.hasOwn(source.health.injuries,key))throw new RangeError('CHANGED_PREPARATION_HEALTH');
 const grown=settleClosedGrowthPeriods(w.players[key]!,source.seasonGrowth,periods),aged=finalizeSeasonGrowth(grown.player,grown.ledger,w.calendar.growthDays.length),totals=recordTotals(source.records,{seasonKey:w.seasonKey,leagueKey:'INDEPENDENT',phase:'REGULAR'});
 const raw=start.kind==='HITTER'?recentBattingPerformance(totals.batting[key]??emptyBatting()):recentPitchingPerformance(totals.pitching[key]??emptyPitching()),adjustedPerformance=Math.max(0,Math.min(100,raw-20)),score=overall(aged.player.kind,aged.player.abilities),baseScore=draftBaseScore(score.sumUnits/score.denominator,adjustedPerformance);
 const receiptKey=JSON.stringify(['preparation-complete',w.worldKey,w.seasonKey,key,source.records.revision,source.retry.episodes.at(-1)!.episodeId]),retry=completeRetryPreparation(source.retry,revision,{seasonKey:w.seasonKey,episodeId:source.retry.episodes.at(-1)!.episodeId,evidenceReceipt:receiptKey}),next=structuredClone(source);
 next.world.players[key]=aged.player;next.seasonGrowth=aged.ledger;next.health=closeSeasonHealth(next.health,w.seasonKey).ledger;next.retry=retry;next.revision=retry.revision;next.phase='PREPARATION_RESULT';next.result={receiptKey,baseScore,adjustedPerformance,completedTeamGames:48};next.traits=settleStarterSeasonTraits(next,last);assertPreparationSeason(next);return next;
}
export function preparationSeasonView(source:PreparationSeason,a?:RetryRouteAuthority){
 assertPreparationSeason(source);if(a&&source.phase==='PREPARATION_RESULT')retryCareerRouteView(source.retry,a);const p=source.world.players[source.world.protagonistKey]!;
 return {phase:source.phase,seasonKey:source.world.seasonKey,player:{playerKey:p.simulationKey,name:p.name,age:p.age},completedTeamGames:count(source),scheduledTeamGames:48,preparation:{used:source.retry.careerPreparationUsed,remaining:3-source.retry.careerPreparationUsed},nextWorldDay:source.nextWorldDay,trainingUsed:source.development.trainingUsedSeasons.includes(source.world.seasonKey),...(source.result?{evaluation:a&&!a.hasProContractHistory&&a.domesticDraftEligible?{kind:'AMATEUR_DRAFT' as const,...draftPreview({baseScore:source.result.baseScore,hasEligibleClubSlot:a.domesticRightsAvailable})}:{kind:'PRO_MARKET_REVIEW' as const,baseScore:source.result.baseScore}}:{})};
}
