import type {CareerAchievementLedger} from './career-achievements.js';
import {collegeLeaveElapsedYears} from './college-service.js';
import {assertCareerAgentLedger,careerIncomeView} from './career-agent.js';
import type {CareerAgentLedger} from './career-agent.js';
import {assertUsKboReturnQuote} from './us-kbo-return.js';
import {openingUsMajorYear} from './us-major-history.js';
import type {UsMajorYearArchive} from './us-major-history.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';
import type {CareerGoalLedger} from './season-goals.js';
import {assertUsRetirementState} from './us-retirement.js';
import type {UsCareerRetirement} from './us-retirement.js';
import {openingUsMinorInventory,openingUsMinorState} from './us-minor-history.js';
import type {UsMinorYearArchive} from './us-minor-history.js';
import type {MlbPostseason,MlbLeague} from './us-postseason.js';
import type {UsSeasonState,UsPhase} from './us-season.js';
import type {UsSeasonSchedule} from './us-schedule.js';
import type {UsPreseasonPlan} from './us-preseason.js';
import type {EventInstance} from './events.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertCareerUsSigning} from './career-us.js';
import {assertUsAmateurYearEnd} from './us-entry.js';
import {assertInitialUsRosterWorld,US_LEVEL_MEANS} from './us-world.js';
import type {UsRosterWorld,UsLevel} from './us-world.js';
import type {UsDirectSigning,UsRecruitmentWorld} from './us-direct.js';
import {assertUsRecruitmentWorld} from './us-direct.js';
import {validateDevelopmentPlayer} from './player.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import {createSeasonCalendar,assertSeasonCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {validatePitchWeights} from './repertoire.js';
import {emptyPitchXpLedger,validatePitchXpLedger} from './pitch-xp.js';
import {canonicalJson} from './game.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import type {KboPostingOffer,KboPostingReturnRights} from './kbo-posting.js';
import type {UsContractOrigin} from './us-contract-origin.js';
import type {UsMinorMarket,UsMinorRenewal} from './us-minor-market.js';
import {assertUsMinorMarket} from './us-minor-market.js';
import {usMilitaryHistoricalView} from './us-military-plan.js';

export interface KboUsTransfer {
 source:'POSTING'|'OVERSEAS_FA';postingId?:string;windowId?:string;offer:KboPostingOffer;returnRights:KboPostingReturnRights|null;kboSeasonKey:string;sourceRevision:number;origin?:UsContractOrigin;
}
export interface ActiveUsRosterWorld extends UsRosterWorld {status:'ACTIVE';calendar:SeasonCalendar;reserves?:Record<string,string[]>}
export interface UsCareer {
 achievements?:CareerAchievementLedger;
 agents?:CareerAgentLedger;
 goals?:CareerGoalLedger;domesticReturn?:import('./us-kbo-return.js').UsKboReturnQuote;minorMarket?:UsMinorMarket;minorRenewal?:UsMinorRenewal;
 retirement?:UsCareerRetirement;schemaVersion:1|2|3|4;majorYears?:readonly UsMajorYearArchive[];minorYears?:readonly UsMinorYearArchive[];mode:'US_CAREER';revision:number;difficulty:HighSchoolCareer['difficulty'];world:ActiveUsRosterWorld;protagonistKey:string;protagonistOrganizationId:string;
 phaseContext:UsPhase;postseason?:{bracket:MlbPostseason;conferences:Record<MlbLeague,string[]>;gameEvidence:string[]};season?:UsSeasonState;seasonSchedule?:UsSeasonSchedule;preseasonPlan?:UsPreseasonPlan;campNotices?:readonly EventInstance[];
 activation:{receiptKey:string;sourceYearEndReceiptKey:string;sourceRevision:number;contractKey:string;populationBasis:'INITIAL_INVENTORY'|'LEGACY_BOOTSTRAP'|'KBO_TRANSFER'};
 registration:{playerKey:string;clubId:string;level:UsLevel;seasonKey:string;status:'ACTIVE'|'INJURED'};
 rights:UsDirectSigning['rights'];contract:Omit<UsDirectSigning['contract'],'status'|'type'> & {type:'US_MINOR'|'US_MAJOR';years?:number;remainingGuaranteedUsd?:number;status:'ACTIVE'|'FROZEN'|'TERMINATED';seasonKey:string;nationalReleaseAllowed:boolean;militaryReturnOption:boolean};
 income:readonly (UsDirectSigning['income'] | {entryKey:string;currency:'USD';amount:number;kind:'SALARY';seasonKey:string;day:number})[];inventory:UsRecruitmentWorld;amateurHistory:HighSchoolCareer;
 records:HighSchoolCareer['records'];health:HighSchoolCareer['health'];seasonGrowth:ReturnType<typeof createSeasonGrowthLedger>;development:NonNullable<HighSchoolCareer['development']>;traits?:NonNullable<HighSchoolCareer['traits']>;relationships:NonNullable<HighSchoolCareer['relationships']>;events:HighSchoolCareer['events'];relationNotices:NonNullable<HighSchoolCareer['relationNotices']>;styleUsedWindows:HighSchoolCareer['styleUsedWindows'];planHistory:HighSchoolCareer['planHistory'];
 military:{status:'UNRESOLVED'|'FROZEN_SERVICE'|'TERMINATED_SERVICE'|'COMPLETED'|'NOT_APPLICABLE';deadlineAge:28;planSeasonKey?:string;frozenContractKey?:string;terminatedContractKey?:string;service?:import('./us-military-plan.js').UsMilitaryServiceProgram};kboTransfer?:KboUsTransfer;
}

/** Live rosters may change abilities/age/level; the initial distribution guard is only for seed-world admission. */
export function assertActiveUsRosterWorld(world:ActiveUsRosterWorld):void {
 assertSeasonCalendar(world.calendar);
 if(world.schemaVersion!==1 || world.modelVersion!=='us-roster-1' || world.status!=='ACTIVE' || !world.worldKey || !world.seed || world.seasonKey!==String(world.calendar.year) || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(world.difficulty) || world.organizations.length!==30 || new Set(world.organizations.map(o=>o.id)).size!==30)throw new RangeError('INVALID_ACTIVE_US_WORLD');
 const seen=new Set<string>();let pitchers=0;
 for(const org of world.organizations){let total=0;if(!org.id || !org.name || Object.keys(org.levels).length!==5)throw new RangeError('INVALID_US_ORGANIZATION');
  for(const level of Object.keys(US_LEVEL_MEANS) as UsLevel[]){const keys=org.levels[level];if(!Array.isArray(keys))throw new RangeError('INVALID_US_ROSTER_REGISTRATION');const players=keys.map(key=>{const p=world.players[key];if(seen.has(key) || !Object.hasOwn(world.players,key) || !p || p.simulationKey!==key)throw new RangeError('INVALID_US_ROSTER_REGISTRATION');seen.add(key);validateDevelopmentPlayer(p!);if(p!.kind==='PITCHER'){pitchers++;const r=world.repertoires[key];if(!r || r.seasonId!==world.seasonKey)throw new RangeError('INVALID_US_REPERTOIRE');validatePitchWeights(r.book,r.weights);validatePitchXpLedger(r.ledger);}return p!;});
   if(level==='MLB'?keys.length!==26:players.filter(p=>p.kind==='HITTER').length<12 || players.filter(p=>p.kind==='PITCHER').length<10)throw new RangeError('INVALID_US_LEVEL_SIZE');total+=keys.length;
  }
  for(const key of world.reserves?.[org.id]??[]){const p=world.players[key];if(seen.has(key)||!p||p.simulationKey!==key)throw new RangeError('INVALID_US_RESERVE');seen.add(key);validateDevelopmentPlayer(p);if(p.kind==='PITCHER'){pitchers++;const r=world.repertoires[key];if(!r||r.seasonId!==world.seasonKey)throw new RangeError('INVALID_US_REPERTOIRE');validatePitchWeights(r.book,r.weights);validatePitchXpLedger(r.ledger);}total++;}
  if(total<100 || total>160)throw new RangeError('US_ORGANIZATION_CAPACITY_EXCEEDED');
 }
 if(world.reserves && Object.keys(world.reserves).some(id=>!world.organizations.some(o=>o.id===id)))throw new RangeError('INVALID_US_RESERVE');
 if(seen.size!==Object.keys(world.players).length || Object.keys(world.repertoires).length!==pitchers || Object.keys(world.repertoires).some(k=>world.players[k]?.kind!=='PITCHER'))throw new RangeError('INVALID_US_ROSTER_REGISTRATION');
}

/** Trusted pre-generated population is admitted once; signing reservations are not debited or rerolled again. */
export function startSignedUsCareer(source:HighSchoolCareer,expectedRevision:number,roster:UsRosterWorld):UsCareer {
 assertCareerRevision(source,expectedRevision);const ready=assertUsAmateurYearEnd(source),r=assertCareerUsSigning(source),s=r.program.signing!,key=source.world.protagonistKey;
 if(source.events.some(e=>e.status==='OPEN') || !source.development || source.world.players[key]!.age>=45 || Object.hasOwn(roster.players,key))throw new RangeError('US_ENTRY_NOT_READY');assertInitialUsRosterWorld(roster);
 const registry=roster.organizations.map(o=>({id:o.id,name:o.name})).sort((a,b)=>a.id<b.id?-1:1),financial=r.world.clubs.map(c=>({id:c.id,name:c.name})).sort((a,b)=>a.id<b.id?-1:1),year=Number(roster.seasonKey);
 if(roster.worldKey!==source.world.worldKey || roster.seed!==source.world.seed || roster.difficulty!==source.difficulty || roster.seasonKey!==r.world.seasonKey || roster.seasonKey!==String(year) || year!==source.world.calendar!.year+1 || financial.some(c=>!registry.some(o=>o.id===c.id && o.name===c.name)) || r.world.registeredPlayerKeys.length>0 && canonicalJson(Object.keys(roster.players).sort())!==canonicalJson(r.world.registeredPlayerKeys) || Object.values(source.records.games).some(g=>g.scope.seasonKey===roster.seasonKey))throw new RangeError('US_ENTRY_POPULATION_CHANGED');
 const calendar=createSeasonCalendar(year,'calendar-2'),world:ActiveUsRosterWorld={...structuredClone(roster),status:'ACTIVE',calendar},player={...structuredClone(source.world.players[key]!),age:source.world.players[key]!.age+1,fatigue:0},org=world.organizations.find(o=>o.id===s.registration.clubId)!;
 if(!org || !['ROOKIE','A'].includes(s.registration.level))throw new RangeError('INVALID_US_ENTRY_REGISTRATION');world.players[key]=player;org.levels[s.registration.level]=[...org.levels[s.registration.level],key].sort();
 const book=schoolYearEndRepertoire(source,key);if(book)world.repertoires[key]={...structuredClone(book),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};assertActiveUsRosterWorld(world);
 const day=calendar.growthDays[0]!,teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:s.registration.level,protagonistKey:key,protagonistSchoolId:org.id,schools:world.organizations.map(o=>({id:o.id,name:o.name,roster:o.levels[s.registration.level]})),players:world.players};
 const relationships=formRegisteredTeamTeammate(source.relationships,teamWorld,s.receiptKey,day),c:UsCareer={schemaVersion:1,mode:'US_CAREER',revision:source.revision+1,difficulty:source.difficulty,world,protagonistKey:key,protagonistOrganizationId:org.id,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey:JSON.stringify(['us-career-entry',ready.receiptKey]),sourceYearEndReceiptKey:ready.receiptKey,sourceRevision:source.revision,contractKey:s.contract.contractKey,populationBasis:r.world.registeredPlayerKeys.length?'INITIAL_INVENTORY':'LEGACY_BOOTSTRAP'},registration:{playerKey:key,clubId:org.id,level:s.registration.level,seasonKey:world.seasonKey,status:'ACTIVE'},rights:structuredClone(s.rights),contract:{...structuredClone(s.contract),seasonKey:world.seasonKey,status:'ACTIVE',nationalReleaseAllowed:s.offer.nationalReleaseAllowed,militaryReturnOption:s.offer.militaryReturnOption},income:[structuredClone(s.income)],inventory:structuredClone(r.reservations.currentWorld),amateurHistory:structuredClone(source),records:structuredClone(source.records),health:{...structuredClone(source.health),injuries:Object.hasOwn(source.health.injuries,key)?{[key]:structuredClone(source.health.injuries[key]!)}:{}},seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(source.development),seasonStartPlayer:structuredClone(player)},...(source.traits?{traits:{...structuredClone(source.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey}}:{}),relationships,events:structuredClone(source.events),...(source.goals?{goals:source.goals}:{}),relationNotices:structuredClone(source.relationNotices??[]),styleUsedWindows:[...source.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],military:{status:'UNRESOLVED',deadlineAge:28}};
 c.relationNotices=queueRelationFormationNotices({...c,world:teamWorld,previousSeasons:[...(source.previousSeasons??[]),{world:source.world}]},day)??[];if(source.achievements)c.achievements=structuredClone(source.achievements);if(source.collegeService?.status==='RESUMED'&&collegeLeaveElapsedYears(source)>0)c.military={status:'COMPLETED',deadlineAge:28};return refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(c));
}

export interface UsCareerPublicView {
 income?:ReturnType<typeof careerIncomeView>;
 seasonKey:string;player:{name:string;age:number;kind:'HITTER'|'PITCHER';position:string};club:{id:string;name:string};registration:{status:UsCareer['registration']['status'];level:UsLevel};
 contract:Pick<UsCareer['contract'],'type'|'currency'|'annualSalaryUsd'|'signingBonusUsd'|'controlSeasons'|'nationalReleaseAllowed'|'militaryReturnOption'> & {years?:number;status?:UsCareer['contract']['status']};phase:UsPhase['phase'];
}
export function usCareerView(c:UsCareer):UsCareerPublicView {
 if(c?.agents)assertCareerAgentLedger(c);
 if(c.military.service?.version===2&&(!c.military.service.returnContract||Number(c.world.seasonKey)<=Number(c.military.service.returnContract.seasonKey)))return usMilitaryHistoricalView(c);
 if(c.domesticReturn!==undefined)assertUsKboReturnQuote(c);
 if(c.domesticReturn?.status!=='ACCEPTED')assertUsRetirementState(c);
 const p=c.world.players[c.protagonistKey],org=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId),r=c.registration;
 const liveContractKey=c.schemaVersion===4?(Array.isArray(c.majorYears)?c.majorYears.at(-1)?.nextContract?.contractKey:undefined):(c.season?.majorActivation?.contractKey??c.minorRenewal?.contract.contractKey??c.activation.contractKey);
 if(![1,2,3,4].includes(c.schemaVersion) || c.mode!=='US_CAREER' || !['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW','EVENT_DECISION','POSTSEASON_PROGRESS','RETIRE_CONFIRM','ARCHIVED'].includes(c.phaseContext.phase) || !p || !org || r.playerKey!==p.simulationKey || r.clubId!==org.id || r.seasonKey!==c.world.seasonKey || !['ACTIVE','INJURED'].includes(r.status) || (r.status==='ACTIVE'?!org.levels[r.level]?.includes(p.simulationKey):!c.world.reserves?.[org.id]?.includes(p.simulationKey)) || c.rights.holderOrgId!==org.id || c.contract.status!=='ACTIVE' || c.contract.contractKey!==liveContractKey)throw new RangeError('INVALID_US_ENTRY_VIEW');assertUsRecruitmentWorld(c.inventory);
 if(c.minorMarket!==undefined)assertUsMinorMarket(c);
 if(c.activation.populationBasis==='KBO_TRANSFER'){
  const t=c.kboTransfer;if(!t||c.income.some(e=>e.kind==='SIGNING_BONUS')||c.activation.receiptKey!==JSON.stringify(['kbo-us-activation',t.postingId??t.windowId])||(c.minorRenewal?c.minorRenewal.organizationId!==c.protagonistOrganizationId:t.offer.organizationId!==c.protagonistOrganizationId))throw new RangeError('INVALID_US_ENTRY_VIEW');
  if(t.origin===undefined){if(c.contract.annualSalaryUsd!==t.offer.annualSalaryUsd||c.contract.years!==t.offer.years||c.activation.contractKey!==c.contract.contractKey)throw new RangeError('INVALID_US_ENTRY_VIEW');}
  else{
   const professional=c.schemaVersion===4?openingUsMajorYear(c):null,minorState=professional?null:openingUsMinorState(c),major=c.season?.majorActivation,expectedInventory=professional?.inventory??minorState!.inventory;let expectedContract=professional?.contract??minorState!.contract;
   if(professional&&major)throw new RangeError('UNEXPECTED_US_MAJOR_REACTIVATION');
   if(major){const span=c.season!.lastDay-c.season!.firstDay+1,minor=expectedContract.annualSalaryUsd;if(expectedContract.type!=='US_MINOR'||major.contractKey!==JSON.stringify(['us-major-entry',expectedContract.contractKey,c.world.seasonKey])||major.fromContractKey!==expectedContract.contractKey||major.annualSalaryUsd!==800000||!Number.isSafeInteger(major.effectiveDay)||major.effectiveDay<=c.season!.firstDay||major.effectiveDay>c.season!.lastDay||major.reservedAdditionalUsd!==Math.floor((minor*(major.effectiveDay-c.season!.firstDay)+800000*(c.season!.lastDay-major.effectiveDay+1))/span)-minor)throw new RangeError('INVALID_US_MAJOR_ACTIVATION');expectedInventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd-=major.reservedAdditionalUsd;expectedContract={...expectedContract,type:'US_MAJOR',years:1,contractKey:major.contractKey,annualSalaryUsd:800000};}
   if(canonicalJson(c.contract)!==canonicalJson(expectedContract)||canonicalJson(c.inventory)!==canonicalJson(expectedInventory))throw new RangeError('INVALID_US_ENTRY_VIEW');
  }
  return {...(c.agents?{income:careerIncomeView(c)}:{}),seasonKey:c.world.seasonKey,player:{name:p.name,age:p.age,kind:p.kind,position:p.position},club:{id:org.id,name:org.name},registration:{status:r.status,level:r.level},contract:{type:c.contract.type,currency:c.contract.currency,annualSalaryUsd:c.contract.annualSalaryUsd,signingBonusUsd:c.contract.signingBonusUsd,controlSeasons:c.contract.controlSeasons,...(c.contract.years===undefined?{}:{years:c.contract.years}),nationalReleaseAllowed:c.contract.nationalReleaseAllowed,militaryReturnOption:c.contract.militaryReturnOption},phase:c.phaseContext.phase};
 }
 const ready=assertUsAmateurYearEnd(c.amateurHistory),signing=c.amateurHistory.usRecruitment!.program.signing!;
 const professional=c.schemaVersion===4?openingUsMajorYear(c):null,major=c.season?.majorActivation,expectedInventory=professional?.inventory??openingUsMinorInventory(c);if(professional&&major)throw new RangeError('UNEXPECTED_US_MAJOR_REACTIVATION');if(major){const expectedKey=JSON.stringify(['us-major-entry',signing.contract.contractKey,c.world.seasonKey]);if(major.contractKey!==expectedKey||major.fromContractKey!==signing.contract.contractKey||major.annualSalaryUsd!==800000||!Number.isSafeInteger(major.effectiveDay)||major.effectiveDay<=c.season!.firstDay||major.effectiveDay>c.season!.lastDay||major.reservedAdditionalUsd!==Math.floor((30000*(major.effectiveDay-c.season!.firstDay)+800000*(c.season!.lastDay-major.effectiveDay+1))/(c.season!.lastDay-c.season!.firstDay+1))-30000)throw new RangeError('INVALID_US_MAJOR_ACTIVATION');expectedInventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd-=major.reservedAdditionalUsd;}

 if(c.protagonistKey!==signing.playerKey || c.world.worldKey!==c.amateurHistory.world.worldKey || c.world.seed!==c.amateurHistory.world.seed || c.difficulty!==c.amateurHistory.difficulty || c.world.difficulty!==c.difficulty || (c.schemaVersion===1 && r.level!==signing.registration.level) || c.activation.receiptKey!==JSON.stringify(['us-career-entry',ready.receiptKey]) || c.activation.populationBasis!==(c.amateurHistory.usRecruitment!.world.registeredPlayerKeys.length?'INITIAL_INVENTORY':'LEGACY_BOOTSTRAP') || c.activation.sourceRevision!==c.amateurHistory.revision || c.activation.sourceYearEndReceiptKey!==ready.receiptKey || canonicalJson(c.rights)!==canonicalJson(signing.rights) || canonicalJson(c.contract)!==canonicalJson(professional?.contract??{...signing.contract,...(major?{type:'US_MAJOR',contractKey:major.contractKey,annualSalaryUsd:major.annualSalaryUsd}:{}),seasonKey:c.world.seasonKey,status:'ACTIVE',nationalReleaseAllowed:signing.offer.nationalReleaseAllowed,militaryReturnOption:signing.offer.militaryReturnOption}) || canonicalJson(c.income.filter(e=>e.kind==='SIGNING_BONUS'))!==canonicalJson([signing.income]) || (c.schemaVersion===1 && c.income.length!==1) || canonicalJson(c.inventory)!==canonicalJson(expectedInventory))throw new RangeError('INVALID_US_ENTRY_VIEW');
 return {...(c.agents?{income:careerIncomeView(c)}:{}),seasonKey:c.world.seasonKey,player:{name:p.name,age:p.age,kind:p.kind,position:p.position},club:{id:org.id,name:org.name},registration:{status:r.status,level:r.level},contract:{type:c.contract.type,currency:c.contract.currency,annualSalaryUsd:c.contract.annualSalaryUsd,signingBonusUsd:c.contract.signingBonusUsd,controlSeasons:c.contract.controlSeasons,...(c.contract.years===undefined?{}:{years:c.contract.years}),nationalReleaseAllowed:c.contract.nationalReleaseAllowed,militaryReturnOption:c.contract.militaryReturnOption},phase:c.phaseContext.phase};
}

export function assertUsCareerRevision(c:UsCareer,revision:number):void {if(!Number.isSafeInteger(revision) || !Number.isSafeInteger(c.revision) || revision!==c.revision || c.revision<1)throw new RangeError('STALE_US_CAREER_REVISION');usCareerView(c);assertActiveUsRosterWorld(c.world);}

export function usCareerEntryView(c:UsCareer){if(c.phaseContext.phase!=='PRESEASON_SETUP')throw new RangeError('INVALID_US_ENTRY_VIEW');return usCareerView(c);}
