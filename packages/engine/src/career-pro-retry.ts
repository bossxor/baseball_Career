import type {KboCareer,ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {KboFreeAgentPool} from './kbo-free-agents.js';
import type {KboCareerFaOffer,KboCareerFaWindow} from './kbo-career-fa.js';
import {quoteKboCareerMarket} from './kbo-career-fa.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertKboOffseasonExit} from './kbo-offseason-exit.js';
import {advanceRetryKboWorld} from './retry-kbo-world.js';
import {openRetryCareerEpisode,retryCareerRouteView,assertRetryCareerLedger} from './retry-career.js';
import type {RetryRouteAuthority} from './retry-career.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent} from './events.js';
import type {EventInstance} from './events.js';
import {createSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createRoundRobinSchedule} from './schedule.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {kboRosterSeasonCharge,kboGuaranteedWon,kboFutureCommitmentWon,kboRecruitmentOpen} from './kbo-finance.js';
import {kboAiRoleNeed} from './kbo-ai-offseason.js';
import {recordTotals} from './records.js';
import {assertPreparationSeason,startPreparationSeason,confirmPreparationPreseason,advancePreparationSeason,completePreparationSeason,trainPreparationSeason,preparationSeasonView} from './preparation-season.js';
import type {PreparationSeason,PreparationWorld} from './preparation-season.js';
import type {TrainingChoice} from './training.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';

export interface KboRetryPro {
 version:1;status:'NOTICE'|'REVIEW'|'PREPARING'|'ACCEPTED'|'ARCHIVED';receiptKey:string;eventKey:string;
 /** Exact original root is permanent, including pro0 careers and currency/military history. */
 origin:KboCareer;marketWorld:ActiveKboRosterWorld;pool?:KboFreeAgentPool;
 quote?:{basis:string;window:Pick<KboCareerFaWindow,'worldKey'|'seasonKey'|'playerKey'|'windowId'|'snapshot'>;offers:readonly KboCareerFaOffer[]};
 completed:readonly PreparationSeason[];retirementReceipt?:string;
}
function owned(c:KboCareer):KboRetryPro {
 const r=c.retryPro;if(!r||r.version!==1||!c.retryCareer||r.origin.protagonistKey!==c.protagonistKey||r.origin.world.worldKey!==c.world.worldKey)throw new RangeError('KBO_RETRY_REQUIRED');
 assertRetryCareerLedger(c.retryCareer,{worldKey:c.world.worldKey,playerKey:c.protagonistKey});
 const exit=assertKboOffseasonExit(r.origin);
 if(exit.status!=='OPEN'||exit.offers.length||r.receiptKey!==JSON.stringify(['kbo-uncontracted',exit.requestKey,exit.sourceBasis])||r.marketWorld.worldKey!==c.world.worldKey||Object.hasOwn(r.marketWorld.players,c.protagonistKey))throw new RangeError('KBO_RETRY_SOURCE_CHANGED');
 if(c.preparationSeason){assertPreparationSeason(c.preparationSeason);if(canonicalJson(c.preparationSeason.retry)!==canonicalJson(c.retryCareer)||canonicalJson(c.preparationSeason.records)!==canonicalJson(c.records))throw new RangeError('STALE_KBO_RETRY_PREPARATION');}
 if(r.quote&&(r.quote.basis!==canonicalJson([r.quote.window,r.marketWorld])||canonicalJson(r.quote.offers)!==canonicalJson(quoteKboCareerMarket(r.quote.window).offers)))throw new RangeError('KBO_RETRY_QUOTE_CHANGED');
 return r;
}
function command(c:KboCareer,revision:number){assertKboCareerRevision(c,revision);const r=owned(c);if(['ARCHIVED','ACCEPTED'].includes(r.status))throw new RangeError('KBO_RETRY_CLOSED');return r;}
function event(c:KboCareer,id:'E34'|'E35',receiptKey:string):EventInstance {
 const p=c.preparationSeason,seasonKey=c.retryCareer!.seasonKey;
 return createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey,evidence:{version:1,type:eventDefinition(id).evidenceDomain,fields:id==='E34'?{playerSimulationKey:c.protagonistKey,contractWindowId:receiptKey,sourceReceiptId:c.retryPro!.receiptKey}:{playerSimulationKey:c.protagonistKey,retirementTaskOrReceiptId:receiptKey}},resume:{worldKey:c.world.worldKey,seasonKey,phase:'CAREER_ROUTE',competitionKey:null,registrationKey:null,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:p?.days.days.at(-1)?.day??c.days?.days.at(-1)?.day??0});
}
function close(e:EventInstance,version:number,command:string,receiptKey:string){return completeBlockingEvent(e,version,{sourceEvidenceKey:e.evidenceKey,command,receiptKey},{worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[command]});}
function authority(c:KboCareer):RetryRouteAuthority {
 const retry=c.retryCareer!,r=owned(c),status=c.military?.status??'UNRESOLVED';
 const militaryStatus:RetryRouteAuthority['militaryStatus']=status==='COMPLETED'?'COMPLETED':status==='NOT_APPLICABLE'?'NOT_APPLICABLE':status.startsWith('SERVING')?'SERVING':status==='ATHLETE_SERVICE'?'COMPLETED':'UNRESOLVED';
 return {worldKey:c.world.worldKey,playerKey:c.protagonistKey,seasonKey:retry.seasonKey,age:retry.age,worldDay:0,authorityRevision:c.revision,hasProContractHistory:true,activeContract:false,domesticRightsAvailable:true,domesticDraftEligible:false,mandatoryReturnActive:false,militaryStatus,collegeAdmissionRefs:[],collegeResumeRef:null,domesticOffers:(r.quote?.offers??[]).map(o=>({offerRef:o.offerKey,expiresGameDay:1})),usOffers:[],usScoutScore:0,usRightsEligible:false,retirementAllowed:true};
}
/** Only an owned, genuinely empty expired-contract market triggers E34. Declining an available offer cannot. */
export function openKboUncontractedRetry(source:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(source,revision);if(source.retryPro&&!['ACCEPTED','ARCHIVED'].includes(source.retryPro.status)){owned(source);return structuredClone(source);}
 const o=assertKboOffseasonExit(source);
 if(o.status!=='OPEN'||o.offers.length||source.events.some(e=>e.status==='OPEN'&&e.eventKey!==o.eventKey)||!source.seasonGrowth.finalized)throw new RangeError('GENUINE_UNCONTRACTED_RECEIPT_REQUIRED');
 const c=structuredClone(source),key=c.protagonistKey,receiptKey=JSON.stringify(['kbo-uncontracted',o.requestKey,o.sourceBasis]),world=structuredClone(c.world);
 for(const club of world.clubs){club.roster=club.roster.filter(k=>k!==key);club.firstTeam=club.firstTeam.filter(k=>k!==key);club.reservedSalaryWon-=club.id===c.protagonistClubId?world.contracts[key]!.annualSalaryWon:0;}
 delete world.players[key];delete world.contracts[key];delete world.repertoires[key];
 c.retryCareer=openRetryCareerEpisode(source.retryCareer,source.retryCareer?.revision??0,{worldKey:c.world.worldKey,playerKey:key,receiptKey,reason:'CONTRACT_EXPIRED',seasonKey:c.world.seasonKey,age:c.world.players[key]!.age});
 c.retryCareer.revision=revision+1;c.retryPro={version:1,status:'NOTICE',receiptKey,eventKey:'',origin:structuredClone(source),marketWorld:world,...(source.freeAgents?{pool:structuredClone(source.freeAgents)}:{}),completed:[]};
 const previous=c.events.find(e=>e.eventKey===o.eventKey)!;c.events=c.events.map(e=>e.eventKey===o.eventKey?close(previous,previous.version,'OPEN_UNCONTRACTED_ROUTES',receiptKey):e);
 const notice=event(c,'E34',receiptKey);c.retryPro.eventKey=notice.eventKey;c.events=[...c.events,notice];c.phaseContext={phase:'SEASON_REVIEW'};c.revision++;return c;
}
export function reviewKboUncontractedRoutes(source:KboCareer,revision:number,eventVersion:number):KboCareer {
 const r=command(source,revision),e=source.events.find(e=>e.eventKey===r.eventKey);
 if(r.status!=='NOTICE'||!e||e.definitionId!=='E34')throw new RangeError('KBO_RETRY_NOTICE_REQUIRED');
 const c=structuredClone(source);c.events=c.events.map(e=>e.eventKey===r.eventKey?close(e,eventVersion,'OPEN_UNCONTRACTED_ROUTES',r.receiptKey):e);c.retryPro!.status='REVIEW';c.revision++;return c;
}
export function kboRetryRoutesView(c:KboCareer){const r=owned(c),view=retryCareerRouteView(c.retryCareer!,authority(c));return {...view,offers:(r.quote?.offers??[]).map(o=>({...o})),eventKey:r.eventKey,status:r.status};}
function publish(c:KboCareer,p:PreparationSeason):KboCareer {
 const n=structuredClone(c);n.preparationSeason=p;n.retryCareer=structuredClone(p.retry);n.revision=p.revision;n.records=p.records;n.health=p.health;n.development=p.development;n.styleUsedWindows=p.styleUsedWindows;if(p.traits)n.traits=p.traits;if(p.relationships)n.relationships=p.relationships;
 n.phaseContext={phase:p.phase==='PREPARATION_PRE'?'PRESEASON_SETUP':'SEASON_REVIEW'};return n;
}
function worker(c:KboCareer,revision:number){command(c,revision);const p=structuredClone(c.preparationSeason);if(!p)throw new RangeError('KBO_RETRY_PREPARATION_REQUIRED');p.revision=revision;p.retry.revision=revision;return p;}
export function startKboRetryPreparation(source:KboCareer,revision:number,input:{routePreviewId:string}):KboCareer {
 const r=command(source,revision),view=kboRetryRoutesView(source);if(view.routePreviewId!==input.routePreviewId)throw new RangeError('PREVIEW_STALE');if(r.status!=='REVIEW'||source.events.some(e=>e.status==='OPEN'))throw new RangeError('KBO_RETRY_NOT_READY');
 const a=authority(source),retry=structuredClone(source.retryCareer!);retry.revision=revision;
 const base=source.preparationSeason?.world??source.amateurHistory.world,world=structuredClone(base) as PreparationWorld,target=String(Number(retry.seasonKey)+1),calendar=createSeasonCalendar(Number(target),'calendar-2'),key=source.protagonistKey;
 world.leagueKey='INDEPENDENT';world.seasonKey=target;world.calendar=calendar;
 for(const p of Object.values(world.players)){p.age=Math.min(45,p.age+Number(target)-Number(base.seasonKey));p.fatigue=0;}
 const previous=source.preparationSeason?.world.players[key]??source.world.players[key]!;world.players[key]={...structuredClone(previous),age:retry.age+1,fatigue:0};
 const proBook=source.preparationSeason?.world.repertoires[key]??source.world.repertoires[key];if(proBook)world.repertoires[key]=structuredClone(proBook);
 for(const b of Object.values(world.repertoires)){if(b.learning)throw new RangeError('PITCH_LEARNING_SETTLEMENT_REQUIRED');b.seasonId=target;b.ledger=emptyPitchXpLedger();b.learning=null;}
 world.schedule=scheduleHighSchoolCalendar(createRoundRobinSchedule({teamKeys:world.schools.map(t=>t.id),leagueKey:'INDEPENDENT',seasonKey:target,startDay:calendar.highSchoolDays[0]!},6),calendar);
 const traits=source.traits?{...source.traits,lastSeasonKey:target,lastClosedDay:null}:undefined;
 const p=startPreparationSeason(retry,revision,a,{episodeId:retry.episodes.at(-1)!.episodeId,routePreviewId:retryCareerRouteView(retry,a).routePreviewId,world,difficulty:source.difficulty,records:source.records,health:source.health,development:source.development,styleUsedWindows:source.styleUsedWindows,...(traits?{traits}:{}),relationships:source.relationships});
 const c=publish(source,p);c.retryPro!.status='PREPARING';delete c.retryPro!.quote;return c;
}
export function confirmKboRetryPreseason(c:KboCareer,revision:number){return publish(c,confirmPreparationPreseason(worker(c,revision),revision));}
export function advanceKboRetryPreparation(c:KboCareer,revision:number,mode:'ONE_GAME'|'ONE_MONTH'='ONE_GAME'){const out=advancePreparationSeason(worker(c,revision),revision,mode);return {...out,career:publish(c,out.career)};}
export function trainKboRetryPreparation(c:KboCareer,revision:number,choice:TrainingChoice){return publish(c,trainPreparationSeason(worker(c,revision),revision,choice));}
export function settleKboRetryPreparation(source:KboCareer,revision:number,forfeitUnusedTraining=false):KboCareer {
 let p=worker(source,revision);if(p.phase==='PREPARATION_RESULT')return structuredClone(source);
 if(!p.development.trainingUsedSeasons.includes(p.world.seasonKey)){if(!forfeitUnusedTraining)throw new RangeError('TRAINING_FORFEIT_REQUIRED');p=trainPreparationSeason(p,p.revision,{type:'SKIP'});}
 p=completePreparationSeason(p,p.revision);const c=publish(source,p),r=c.retryPro!;r.status='REVIEW';r.completed=[...r.completed,p];
 // Each elapsed year uses existing NPC renewal/market/supply owners, never a guaranteed protagonist contract.
 while(Number(r.marketWorld.seasonKey)<=Number(p.world.seasonKey)){const n=advanceRetryKboWorld(c,r.marketWorld,r.pool);r.marketWorld=n.world;r.pool=n.pool;}
 const totals=recordTotals(c.records,{seasonKey:p.world.seasonKey,leagueKey:'INDEPENDENT',phase:'REGULAR'}),key=c.protagonistKey,w=r.marketWorld;
 const snapshot:KboCareerFaWindow['snapshot']={seed:w.seed,player:structuredClone(p.world.players[key]!),contract:structuredClone(r.origin.world.contracts[key]!),qualifiedSeasons:0,...(totals.batting[key]?{batting:totals.batting[key]}:{}),...(totals.pitching[key]?{pitching:totals.pitching[key]}:{}),clubs:w.clubs.map(club=>({clubId:club.id,budgetWon:club.budgetWon,recruitmentOpen:kboRecruitmentOpen(w,club.id),guaranteedKeys:[...club.roster],commitments:[club.reservedSalaryWon+kboGuaranteedWon(w,club.id,w.seasonKey),...[1,2,3].map(y=>kboFutureCommitmentWon(w,club.id,y))],need:kboAiRoleNeed(p.world.players[key]!,club.roster.map(k=>w.players[k]!))}))};
 const window={worldKey:w.worldKey,seasonKey:w.seasonKey,playerKey:key,windowId:JSON.stringify(['kbo-retry-market',r.receiptKey,p.result!.receiptKey]),snapshot};r.quote={window,offers:quoteKboCareerMarket(window).offers,basis:canonicalJson([window,w])};return c;
}
export function kboRetryPreparationView(c:KboCareer){owned(c);if(!c.preparationSeason)throw new RangeError('KBO_RETRY_PREPARATION_REQUIRED');return preparationSeasonView(c.preparationSeason,authority(c));}
export function acceptKboRetryOffer(source:KboCareer,revision:number,input:{routePreviewId:string;offerKey:string}):KboCareer {
 const r=command(source,revision),view=kboRetryRoutesView(source);if(view.routePreviewId!==input.routePreviewId)throw new RangeError('PREVIEW_STALE');const offer=r.quote?.offers.find(o=>o.offerKey===input.offerKey),p=source.preparationSeason;
 if(r.status!=='REVIEW'||!offer||!p||p.phase!=='PREPARATION_RESULT'||!view.routes.some(r=>r.routeId==='DOMESTIC_CONTRACT'&&r.offerRefs.includes(offer.offerKey)))throw new RangeError('KBO_RETRY_OFFER_NOT_AVAILABLE');
 const c=structuredClone(source),w=structuredClone(r.marketWorld),key=c.protagonistKey,club=w.clubs.find(t=>t.id===offer.clubId)!;
 w.players[key]={...structuredClone(p.world.players[key]!),age:p.world.players[key]!.age+1,fatigue:0};w.contracts[key]={contractKey:offer.offerKey,playerKey:key,clubId:club.id,seasonKey:w.seasonKey,years:offer.years,annualSalaryWon:offer.annualSalaryWon,signingBonusWon:0,status:'ACTIVE'};
 const book=p.world.repertoires[key];if(book)w.repertoires[key]={...structuredClone(book),seasonId:w.seasonKey,ledger:emptyPitchXpLedger(),usedWindows:[],learning:null};club.roster=[...club.roster,key].sort();club.reservedSalaryWon=kboRosterSeasonCharge(w,club.id);assertKboRecruitmentWorld(w);
 c.world=w;c.protagonistClubId=club.id;c.registration={playerKey:key,clubId:club.id,seasonKey:w.seasonKey,status:'ACTIVE',firstTeam:false,competitionKey:'FUTURES'};c.rights={...c.rights,holderOrgId:club.id,sourceType:'FREE_AGENT'};if(r.pool)c.freeAgents=structuredClone(r.pool);c.seasonGrowth=createSeasonGrowthLedger(w.players[key]!,w.seasonKey,w.calendar.growthDays.length);c.development={...c.development,seasonStartPlayer:structuredClone(w.players[key]!)};c.planHistory=[{completedTeamGames:0,focus:[...w.players[key]!.focus],archetype:w.players[key]!.archetype}];
 c.contractHistory=[...(c.contractHistory??[]),structuredClone(r.origin.world.contracts[key]!)];c.retryPro!.status='ACCEPTED';c.phaseContext={phase:'PRESEASON_SETUP'};c.revision++;
 for(const field of ['seasonClose','days','postseason','openingRoster','competitionSchedule','preseasonPlan','offseasonExit','renewal'] as const)delete c[field];delete c.preparationSeason;return c;
}
export function openKboRetryExhaustion(source:KboCareer,revision:number):KboCareer {
 const r=command(source,revision),view=kboRetryRoutesView(source);
 if(r.status!=='REVIEW'||!r.quote||source.retryCareer!.careerPreparationUsed!==3||view.routes.some(r=>r.routeId!=='RETIRE')||source.events.some(e=>e.status==='OPEN'))throw new RangeError('RETRY_ROUTES_REMAIN');
 const c=structuredClone(source),receipt=JSON.stringify(['retry-exhausted',r.receiptKey,source.preparationSeason!.result!.receiptKey]),e=event(c,'E35',receipt);
 c.events=[...c.events,e];c.retryPro!.eventKey=e.eventKey;c.phaseContext={phase:'RETIRE_CONFIRM',eventKey:e.eventKey};c.revision++;return c;
}
export function confirmKboRetryExhaustion(source:KboCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'}):KboCareer {
 const r=command(source,revision),e=source.events.find(e=>e.eventKey===input.eventKey),view=kboRetryRoutesView(source);
 if(input.command!=='CONFIRM_RETIRE'||source.phaseContext.phase!=='RETIRE_CONFIRM'||source.phaseContext.eventKey!==e?.eventKey||r.eventKey!==e.eventKey||e.definitionId!=='E35'||source.retryCareer!.careerPreparationUsed!==3||view.routes.some(r=>r.routeId!=='RETIRE'))throw new RangeError('RETRY_RETIREMENT_NOT_AVAILABLE');
 const c=structuredClone(source),receipt=JSON.stringify(['retry-retirement',e.evidenceKey]);c.events=c.events.map(x=>x.eventKey===e.eventKey?close(e,input.eventVersion,input.command,receipt):x);c.retryPro!.status='ARCHIVED';c.retryPro!.retirementReceipt=receipt;c.phaseContext={phase:'ARCHIVED'};c.revision++;
 c.retirement={receiptKey:receipt,reason:'VOLUNTARY',seasonKey:source.retryCareer!.seasonKey,age:source.retryCareer!.age,clubId:source.protagonistClubId,remainingContractYears:0,sourceRevision:c.revision};return c;
}

