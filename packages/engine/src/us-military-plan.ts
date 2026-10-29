import {usMajorCallupAdditionalUsd} from './us-season.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision,assertActiveUsRosterWorld,usCareerView} from './us-career-entry.js';
import type {UsLevel} from './us-world.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {createSeasonCalendar} from './season-calendar.js';
import {canonicalJson} from './game.js';
import {retireAndSupplyUsNpcs} from './us-supply.js';
import type {UsSupplyReceipt} from './us-supply.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {fundUsMinorYear} from './us-minor-history.js';
import {usContractOrigin} from './us-contract-origin.js';
import {usMajorContractValue,usMlbOfferYears} from './us-contract-value.js';
import {mlbServiceTime} from './us-service-time.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import type {DevelopmentPlayer} from './player.js';
import type {BattingLine,PitchingLine} from './types.js';

export type UsMilitaryStatus='UNRESOLVED'|'FROZEN_SERVICE'|'TERMINATED_SERVICE'|'ATHLETE_ELIGIBLE'|'ATHLETE_SERVICE'|'COMPLETED'|'NOT_APPLICABLE';
export type UsMilitaryPlanChoice='FREEZE'|'TERMINATE';
export type UsMilitaryServiceBlockKind='FULL_DOMESTIC_SEASON'|'FIRST_HALF_SEASON';
export interface UsMilitaryServiceBlock {seasonKey:string;kind:UsMilitaryServiceBlockKind;completedWorldDay:number|null}
export interface UsMilitaryYearArchive {
 seasonKey:string;season:NonNullable<UsCareer['season']>;seasonSchedule:NonNullable<UsCareer['seasonSchedule']>;seasonGrowth:UsCareer['seasonGrowth'];
 preseasonPlan?:UsCareer['preseasonPlan'];campNotices?:UsCareer['campNotices'];postseason?:UsCareer['postseason'];
}
export interface UsMilitaryReturnOffer {
 offerKey:string;issuedWorldDay:number;expiresWorldDay:number;status:'OPEN'|'ACCEPTED'|'DECLINED'|'EXPIRED';contract:UsCareer['contract'];
 valuation?:{player:DevelopmentPlayer;batting:BattingLine;pitching:PitchingLine;freeAgentEligible:boolean};
}
/** Same 18 game-month calendar as domestic service: next full season, then June 30 of the season after (14 U). */
export interface UsMilitaryServiceProgram {
 programId:string;planSeasonKey:string;scheduledBlocks:2;blocks:readonly UsMilitaryServiceBlock[];completedBlocks:number;
 completionDays:readonly {seasonKey:string;worldDay:number}[];
 version?:2;sourceContract?:UsCareer['contract'];sourceSeason?:UsCareer['season'];sourceAge?:number;sourceRegistration?:UsCareer['registration'];
 cursor?:{seasonKey:string;worldDay:number};closedDays?:readonly {seasonKey:string;worldDay:number}[];supply?:readonly UsSupplyReceipt[];
 years?:readonly UsMilitaryYearArchive[];
 sourceInventory?:UsCareer['inventory'];sourceSchemaVersion?:UsCareer['schemaVersion'];sourceMinorYears?:number;sourceMajorYears?:number;sourceMinorRenewal?:UsCareer['minorRenewal'];sourceRights?:UsCareer['rights'];
 returnContract?:UsCareer['contract'];returnInventory?:UsCareer['inventory'];remainingControlSeasons?:number;returnReservationUsd?:number;
 sourceRegisteredPlayerKeys?:readonly string[];serviceRegistries?:readonly {seasonKey:string;registeredPlayerKeys:readonly string[]}[];
 returnOption?:{optionId:string;organizationId:string;level:UsLevel;issuedSeasonKey:string;issuedWorldDay:number;expiresWorldDay:number;status:'OPEN'|'CONFIRMED'|'EXPIRED'|'DECLINED';confirmedWorldDay?:number;effectiveWorldDay?:number};
 returnOffer?:UsMilitaryReturnOffer;
}

const LEVELS:readonly UsLevel[]=['ROOKIE','A','AA','AAA','MLB'];

function assertMilitaryRevision(c:UsCareer,revision:number):void {
 if(!Number.isSafeInteger(revision)||!Number.isSafeInteger(c.revision)||revision!==c.revision||c.revision<1)throw new RangeError('STALE_US_CAREER_REVISION');
}
function gate(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const ready=usYearTransitionReadiness(c);
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.world.players[c.protagonistKey]!.age<19||c.military.status!=='UNRESOLVED')throw new RangeError('US_MILITARY_PLAN_NOT_REQUIRED');
 if(ready.blockers.some(b=>b!=='MILITARY_PLAN_REQUIRED'&&b!=='CONTRACT_DECISION_REQUIRED'))throw new RangeError('US_MILITARY_PLAN_NOT_READY');
 return ready;
}

function legalAfterRemove(next:UsCareer,orgId:string,level:UsLevel,removeKey:string):boolean {
 const org=next.world.organizations.find(o=>o.id===orgId)!,keys=org.levels[level].filter(k=>k!==removeKey);
 if(level==='MLB')return keys.length===26;
 const hitters=keys.filter(k=>next.world.players[k]!.kind==='HITTER').length,pitchers=keys.filter(k=>next.world.players[k]!.kind==='PITCHER').length;
 return hitters>=12&&pitchers>=10;
}

/** Move protagonist to reserves and keep every live level size legal. */
function parkForTerminate(next:UsCareer,key:string):void {
 const org=next.world.organizations.find(o=>o.id===next.protagonistOrganizationId)!,level=next.registration.level,kind=next.world.players[key]!.kind;
 next.world.reserves??={};
 if(legalAfterRemove(next,org.id,level,key)){
  org.levels[level]=org.levels[level].filter(k=>k!==key);next.world.reserves[org.id]=[...(next.world.reserves[org.id]??[]).filter(k=>k!==key),key].sort();next.registration={...next.registration,status:'INJURED'};return;
 }
 let fill=(next.world.reserves[org.id]??[]).filter(k=>k!==key&&next.world.players[k]!.kind===kind).sort()[0];
 if(fill)next.world.reserves[org.id]=(next.world.reserves[org.id]??[]).filter(k=>k!==fill);
 else{
  const idx=LEVELS.indexOf(level);
  for(let i=idx-1;i>=0;i--){const donor=LEVELS[i]!;
   const cand=org.levels[donor].filter(k=>k!==key&&next.world.players[k]!.kind===kind&&legalAfterRemove(next,org.id,donor,k)).sort()[0];
   if(!cand)continue;org.levels[donor]=org.levels[donor].filter(k=>k!==cand);fill=cand;break;}
 }
 if(!fill)throw new RangeError('US_MILITARY_TERMINATE_NO_REPLACEMENT');
 org.levels[level]=org.levels[level].map(k=>k===key?fill!:k).sort();
 next.world.reserves[org.id]=[...(next.world.reserves[org.id]??[]).filter(k=>k!==key),key].sort();
 next.registration={...next.registration,status:'INJURED'};
}

export function usMilitaryCompletionDays(planSeasonKey:string):readonly {seasonKey:string;worldDay:number}[] {
 if(!/^\d{4}$/.test(planSeasonKey))throw new RangeError('INVALID_US_MILITARY_CALENDAR');
 const first=String(Number(planSeasonKey)+1),second=String(Number(planSeasonKey)+2),y=Number(second);
 const leap=y%4===0&&(y%100!==0||y%400===0);
 return [{seasonKey:first,worldDay:createSeasonCalendar(Number(first)).growthDays.at(-1)!},{seasonKey:second,worldDay:leap?181:180}];
}

function openProgram(worldKey:string,playerKey:string,planSeasonKey:string):UsMilitaryServiceProgram {
 const completionDays=usMilitaryCompletionDays(planSeasonKey),blocks:UsMilitaryServiceBlock[]=[
  {seasonKey:completionDays[0]!.seasonKey,kind:'FULL_DOMESTIC_SEASON',completedWorldDay:null},
  {seasonKey:completionDays[1]!.seasonKey,kind:'FIRST_HALF_SEASON',completedWorldDay:null},
 ];
 return {programId:JSON.stringify(['us-military-service',worldKey,planSeasonKey,playerKey]),planSeasonKey,scheduledBlocks:2,blocks,completedBlocks:0,completionDays};
}

function completeBlock(program:UsMilitaryServiceProgram,seasonKey:string,worldDay:number):UsMilitaryServiceProgram {
 const index=program.blocks.findIndex(b=>b.seasonKey===seasonKey);
 if(index<0||index!==program.completedBlocks)throw new RangeError('INVALID_US_SERVICE_BLOCK');
 const due=program.completionDays[index]!;if(due.seasonKey!==seasonKey||due.worldDay!==worldDay)throw new RangeError('INVALID_US_SERVICE_CALENDAR');
 const block=program.blocks[index]!;
 if(block.completedWorldDay!==null){if(block.completedWorldDay===worldDay)return structuredClone(program);throw new RangeError('US_SERVICE_BLOCK_EVIDENCE_REUSED');}
 return {...structuredClone(program),blocks:program.blocks.map((b,i)=>i===index?{...b,completedWorldDay:worldDay}:b),completedBlocks:program.completedBlocks+1};
}

/** Read-only. Freeze needs the live contract's militaryReturnOption. */
export function usMilitaryPlanPreview(c:UsCareer){
 const ready=gate(c);return {sourceRevision:c.revision,nextAge:ready.nextAge,deadlineAge:c.military.deadlineAge,militaryReturnOption:c.contract.militaryReturnOption,choices:(c.contract.militaryReturnOption?['FREEZE','TERMINATE']:['TERMINATE']) as readonly UsMilitaryPlanChoice[]};
}

/** Offseason only. Seals the 18-month two-block calendar; does not invent Korean registration or jump to COMPLETED. */
export function chooseUsMilitaryPlan(c:UsCareer,revision:number,choice:UsMilitaryPlanChoice):UsCareer {
 assertUsCareerRevision(c,revision);const preview=usMilitaryPlanPreview(c);if(!preview.choices.includes(choice))throw new RangeError('US_MILITARY_PLAN_REFUSED');
 if(choice==='FREEZE'&&!c.contract.militaryReturnOption)throw new RangeError('US_MILITARY_FREEZE_UNAVAILABLE');
 const next=structuredClone(c);next.revision++;
 const service:UsMilitaryServiceProgram={...openProgram(c.world.worldKey,c.protagonistKey,c.world.seasonKey),version:2,sourceContract:structuredClone(c.contract),sourceInventory:structuredClone(c.inventory),sourceRegisteredPlayerKeys:Object.keys(c.world.players).sort(),serviceRegistries:[],sourceSchemaVersion:c.schemaVersion,sourceMinorYears:c.minorYears?.length??0,sourceMajorYears:c.majorYears?.length??0,...(c.minorRenewal?{sourceMinorRenewal:structuredClone(c.minorRenewal)}:{}),sourceRights:structuredClone(c.rights),...(c.season?{sourceSeason:structuredClone(c.season)}:{}),sourceAge:c.world.players[c.protagonistKey]!.age,sourceRegistration:structuredClone(c.registration),cursor:{seasonKey:c.world.seasonKey,worldDay:daysInYear(Number(c.world.seasonKey))-1},closedDays:[],supply:[]};
 if(choice==='FREEZE')next.military={status:'FROZEN_SERVICE',deadlineAge:c.military.deadlineAge,frozenContractKey:c.contract.contractKey,planSeasonKey:c.world.seasonKey,service};
 else next.military={status:'TERMINATED_SERVICE',deadlineAge:c.military.deadlineAge,planSeasonKey:c.world.seasonKey,terminatedContractKey:c.contract.contractKey,service};
 if(next.registration.status==='ACTIVE')parkForTerminate(next,c.protagonistKey);
 next.contract={...next.contract,status:choice==='FREEZE'?'FROZEN':'TERMINATED'};
 assertUsCareerRevision(next,next.revision);return next;
}

/**
 * Marks the current world season's service block complete in SEASON_REVIEW (due day already on the sealed calendar).
 * Caller advances into each service season first; this never jumps to COMPLETED alone.
 * Uses revision equality (not full entry view) so year-advanced service seasons remain settleable.
 */
export function settleUsMilitaryServiceBlock(c:UsCareer,revision:number):UsCareer {
 assertMilitaryRevision(c,revision);
 if(c.military.status!=='FROZEN_SERVICE'&&c.military.status!=='TERMINATED_SERVICE')throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');
 const service=c.military.service;if(!service)throw new RangeError('US_MILITARY_SERVICE_PROGRAM_REQUIRED');
 if(service.version!==2||!service.cursor||service.cursor.seasonKey!==c.world.seasonKey||!service.closedDays?.some(d=>d.seasonKey===c.world.seasonKey&&d.worldDay===service.completionDays.find(d=>d.seasonKey===c.world.seasonKey)?.worldDay))throw new RangeError('US_MILITARY_DAY_EVIDENCE_REQUIRED');
 if(canonicalJson(service.completionDays)!==canonicalJson(usMilitaryCompletionDays(service.planSeasonKey)))throw new RangeError('INVALID_US_SERVICE_CALENDAR');
 if(c.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('US_MILITARY_BLOCK_NOT_READY');
 const open=service.blocks.find(b=>b.seasonKey===c.world.seasonKey&&b.completedWorldDay===null);
 if(!open)throw new RangeError('US_MILITARY_BLOCK_NOT_OPEN');
 const due=service.completionDays.find(d=>d.seasonKey===c.world.seasonKey)!;
 const next=structuredClone(c);next.revision++;next.military={...next.military,service:completeBlock(service,open.seasonKey,due.worldDay)};
 return next;
}

/** Completes only after both sealed 18-month blocks. Instant COMPLETED without settlement is rejected. */
export function completeUsMilitaryService(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);if(c.military.status!=='FROZEN_SERVICE'&&c.military.status!=='TERMINATED_SERVICE')throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');
 const service=c.military.service;if(!service||service.completedBlocks!==service.scheduledBlocks||service.blocks.some(b=>b.completedWorldDay===null))throw new RangeError('US_MILITARY_SERVICE_INCOMPLETE');
 const next=structuredClone(c);next.revision++;next.military={status:'COMPLETED',deadlineAge:c.military.deadlineAge,...(c.military.planSeasonKey?{planSeasonKey:c.military.planSeasonKey}:{}),...(c.military.frozenContractKey?{frozenContractKey:c.military.frozenContractKey}:{}),...(c.military.terminatedContractKey?{terminatedContractKey:c.military.terminatedContractKey}:{}),service:structuredClone(service)};
 if(c.military.frozenContractKey&&service.sourceContract?.militaryReturnOption&&service.cursor){const date=service.cursor;next.military.service!.returnOption={optionId:JSON.stringify(['us-military-return',service.programId,c.military.frozenContractKey]),organizationId:c.protagonistOrganizationId,level:service.sourceRegistration!.level,issuedSeasonKey:date.seasonKey,issuedWorldDay:date.worldDay,expiresWorldDay:date.worldDay+30,status:'OPEN'};}
 return next;
}

const daysInYear=(year:number)=>year%4===0&&(year%100!==0||year%400===0)?366:365;
const serving=(c:UsCareer)=>c.military.status==='FROZEN_SERVICE'||c.military.status==='TERMINATED_SERVICE';

/** Ordinary US play cannot use a frozen contract or an unconfirmed/expired option. */
export function assertUsMilitaryPlayable(c:UsCareer):void {
 if(serving(c)||c.contract.status!=='ACTIVE'||c.military.service?.version===2&&c.military.service.returnOption?.status!=='CONFIRMED')throw new RangeError('US_MILITARY_CONTRACT_NOT_PLAYABLE');
}

/** Service roots retain the original active contract as history, separately from its live disposition. */
export function usMilitaryHistoricalView(c:UsCareer):ReturnType<typeof usCareerView> {
 const s=c.military.service,source=s?.sourceContract,cursor=s?.cursor;
 if(!s||s.version!==2||!source||source.status!=='ACTIVE'||!s.sourceRegistration||!Number.isSafeInteger(s.sourceAge)||!cursor||s.planSeasonKey!==c.military.planSeasonKey||s.programId!==JSON.stringify(['us-military-service',c.world.worldKey,s.planSeasonKey,c.protagonistKey])||canonicalJson(s.completionDays)!==canonicalJson(usMilitaryCompletionDays(s.planSeasonKey))||s.scheduledBlocks!==2||s.blocks.length!==2||!Number.isSafeInteger(s.completedBlocks)||s.completedBlocks<0||s.completedBlocks>2||!Array.isArray(s.closedDays)||!Array.isArray(s.supply))throw new RangeError('INVALID_US_MILITARY_STATE');
 if(cursor.seasonKey!==c.world.seasonKey||!Number.isSafeInteger(cursor.worldDay)||cursor.worldDay<0||cursor.worldDay>=daysInYear(Number(cursor.seasonKey))||c.world.players[c.protagonistKey]!.age!==s.sourceAge!+Number(c.world.seasonKey)-Number(s.planSeasonKey))throw new RangeError('INVALID_US_SERVICE_CALENDAR');
 const expectedStatus=c.military.frozenContractKey?'FROZEN':'TERMINATED',option=s.returnOption,confirmed=option?.status==='CONFIRMED';
 const major=c.season?.majorActivation;let expectedContract=s.returnContract,expectedInventory=s.returnInventory;
 if(major&&s.returnContract){
  const base=s.returnContract,projected={...c,contract:base},key=JSON.stringify(['us-major-entry',base.contractKey,c.world.seasonKey]);
  if(base.type!=='US_MINOR'||major.contractKey!==key||major.fromContractKey!==base.contractKey||major.annualSalaryUsd!==800000||!Number.isSafeInteger(major.effectiveDay)||major.effectiveDay<=c.season!.firstDay||major.effectiveDay>c.season!.lastDay||major.reservedAdditionalUsd!==usMajorCallupAdditionalUsd(projected,major.effectiveDay))throw new RangeError('INVALID_US_MAJOR_ACTIVATION');
  expectedContract={...base,type:'US_MAJOR',contractKey:key,annualSalaryUsd:800000,...(c.kboTransfer?.origin?{years:1}:{})};
  expectedInventory=structuredClone(s.returnInventory!);expectedInventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd-=major.reservedAdditionalUsd;
 }

 if(!['FROZEN_SERVICE','TERMINATED_SERVICE','COMPLETED'].includes(c.military.status)||c.military.frozenContractKey&&c.military.terminatedContractKey||c.military.frozenContractKey&&!source.militaryReturnOption||c.military.frozenContractKey!==undefined&&c.military.frozenContractKey!==source.contractKey||c.military.terminatedContractKey!==undefined&&c.military.terminatedContractKey!==source.contractKey||canonicalJson(c.contract)!==canonicalJson(confirmed&&expectedContract?expectedContract:{...source,seasonKey:c.world.seasonKey,status:confirmed?'TERMINATED':option?.status==='EXPIRED'||option?.status==='DECLINED'?'TERMINATED':expectedStatus}))throw new RangeError('INVALID_US_MILITARY_CONTRACT');
 if(!s.returnContract&&(c.registration.status!=='INJURED'||!c.world.reserves?.[c.protagonistOrganizationId]?.includes(c.protagonistKey)))throw new RangeError('INVALID_US_SERVICE_REGISTRATION');
 let completed=0;
 for(const [i,b]of s.blocks.entries()){
  const due=s.completionDays[i]!;
  if(b.seasonKey!==due.seasonKey||b.kind!==(i===0?'FULL_DOMESTIC_SEASON':'FIRST_HALF_SEASON')||b.completedWorldDay!==null&&(b.completedWorldDay!==due.worldDay||i!==completed++||!s.closedDays.some(d=>d.seasonKey===due.seasonKey&&d.worldDay===due.worldDay)))throw new RangeError('INVALID_US_SERVICE_BLOCK');
 }
 if(completed!==s.completedBlocks||c.military.status==='COMPLETED'&&completed!==2)throw new RangeError('INVALID_US_SERVICE_BLOCK');
 const years=s.years??[],elapsed=Number(c.world.seasonKey)-Number(s.planSeasonKey),closed:{seasonKey:string;worldDay:number}[]=[];
 if(years.length!==elapsed||s.supply.length!==elapsed||years.some((y,i)=>y.seasonKey!==String(Number(s.planSeasonKey)+i)||y.seasonSchedule.seasonKey!==y.seasonKey||y.season.receiptKey!==JSON.stringify(['us-regular-season',y.seasonSchedule.receiptKey]))||s.supply.some((r,i)=>r.targetSeasonKey!==String(Number(s.planSeasonKey)+i+1)))throw new RangeError('INVALID_US_SERVICE_ARCHIVE');
 for(const y of years.filter(y=>y.seasonKey!==s.planSeasonKey)){
  const calendar=createSeasonCalendar(Number(y.seasonKey),'calendar-2');
  if(y.season.militaryService?.programId!==s.programId||y.season.firstDay!==calendar.growthDays[0]||y.season.lastDay!==calendar.growthDays.at(-1)||y.season.days.length!==y.season.lastDay-y.season.firstDay+1||y.season.days.some((d,i)=>d.day!==y.season.firstDay+i||d.appearances!==0)||y.season.paidUsd!==0)throw new RangeError('INVALID_US_SERVICE_ARCHIVE');
  closed.push(...y.season.days.map(d=>({seasonKey:y.seasonKey,worldDay:d.day})));
 }
 if(elapsed&&c.season){if(c.season.militaryService?.programId!==s.programId||c.season.days.some((d,i)=>d.day!==c.season!.firstDay+i))throw new RangeError('INVALID_US_SERVICE_CALENDAR');closed.push(...c.season.days.filter(d=>d.day<=cursor.worldDay).map(d=>({seasonKey:c.world.seasonKey,worldDay:d.day})));}
 if(canonicalJson(s.closedDays)!==canonicalJson(closed)||elapsed&&(closed.at(-1)?.seasonKey===c.world.seasonKey?closed.at(-1)!.worldDay!==cursor.worldDay:cursor.worldDay!==c.world.calendar.growthDays[0]!-1))throw new RangeError('INVALID_US_SERVICE_DAY_EVIDENCE');
 if(option){const due=s.completionDays[1]!;if(c.military.status!=='COMPLETED'||!c.military.frozenContractKey||!source.militaryReturnOption||option.optionId!==JSON.stringify(['us-military-return',s.programId,source.contractKey])||option.organizationId!==s.sourceRegistration.clubId||option.level!==s.sourceRegistration.level||option.issuedSeasonKey!==due.seasonKey||option.issuedWorldDay!==due.worldDay||option.expiresWorldDay!==due.worldDay+30||!['OPEN','CONFIRMED','EXPIRED','DECLINED'].includes(option.status)||option.status==='OPEN'&&cursor.worldDay>=option.expiresWorldDay||confirmed&&(!Number.isSafeInteger(option.confirmedWorldDay)||option.confirmedWorldDay!<option.issuedWorldDay||option.confirmedWorldDay!>=option.expiresWorldDay||s.returnContract&&(!Number.isSafeInteger(option.effectiveWorldDay)||option.effectiveWorldDay!<=option.confirmedWorldDay!)))throw new RangeError('INVALID_US_MILITARY_RETURN_OPTION');}
 const projected=usMilitarySourceCareer(c);
 if(s.returnOffer)assertUsMilitaryReturnOffer(c);
 if(canonicalJson(c.inventory)!==canonicalJson(confirmed&&expectedInventory?expectedInventory:usMilitaryInactiveInventory(c)))throw new RangeError('INVALID_US_MILITARY_INVENTORY');
 if(s.sourceSeason)projected.season=s.sourceSeason;else delete projected.season;
 const view=usCareerView(projected);
 return {...view,seasonKey:c.world.seasonKey,player:{...view.player,age:c.world.players[c.protagonistKey]!.age},registration:{status:c.registration.status,level:c.registration.level},phase:c.phaseContext.phase,contract:{type:c.contract.type,currency:c.contract.currency,annualSalaryUsd:c.contract.annualSalaryUsd,signingBonusUsd:c.contract.signingBonusUsd,controlSeasons:c.contract.controlSeasons,nationalReleaseAllowed:c.contract.nationalReleaseAllowed,militaryReturnOption:c.contract.militaryReturnOption,...(c.contract.years===undefined?{}:{years:c.contract.years}),status:c.contract.status}};
}

/** Annual world aging/supply only. The shared US worker publishes and plays the real service-season schedule. */
export function startUsMilitaryServiceSeason(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);const s=c.military.service;
 if(!serving(c)||s?.version!==2||!s.cursor||c.phaseContext.phase!=='SEASON_REVIEW'||c.world.seasonKey!==s.planSeasonKey&&s.blocks.find(b=>b.seasonKey===c.world.seasonKey)?.completedWorldDay===null||Number(c.world.seasonKey)>=Number(s.planSeasonKey)+2)throw new RangeError('US_MILITARY_YEAR_NOT_READY');
 const next=structuredClone(c),world=next.world,target=String(Number(world.seasonKey)+1),oldPlayers=new Set(Object.keys(world.players)),retiring=Object.keys(world.players).filter(k=>k!==c.protagonistKey&&world.players[k]!.age===45),supply=retireAndSupplyUsNpcs(world,retiring,target,c.protagonistKey);
 if(c.season&&c.seasonSchedule)next.military.service!.years=[...(s.years??[]),{seasonKey:c.world.seasonKey,season:structuredClone(c.season),seasonSchedule:structuredClone(c.seasonSchedule),seasonGrowth:structuredClone(c.seasonGrowth),...(c.preseasonPlan?{preseasonPlan:structuredClone(c.preseasonPlan)}:{}),...(c.campNotices?{campNotices:structuredClone(c.campNotices)}:{}),...(c.postseason?{postseason:structuredClone(c.postseason)}:{})}];
 for(const [key,p]of Object.entries(world.players)){if(oldPlayers.has(key))world.players[key]={...p,age:p.age+1,fatigue:0};const book=world.repertoires[key];if(book)world.repertoires[key]={...book,seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};}
 for(const r of supply.retired)delete next.health.injuries[r.playerKey];
 world.seasonKey=target;world.calendar=createSeasonCalendar(Number(target),'calendar-2');next.registration={...next.registration,seasonKey:target};next.contract={...next.contract,seasonKey:target};
 next.inventory=fundUsMinorYear(c.inventory,target,Object.keys(world.players),c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:0})),c.protagonistOrganizationId,0);
 next.military.service!.serviceRegistries=[...(s.serviceRegistries??[]),{seasonKey:target,registeredPlayerKeys:Object.keys(world.players).sort()}];
 next.military.service!.cursor={seasonKey:target,worldDay:world.calendar.growthDays[0]!-1};next.military.service!.supply=[...s.supply!,supply];
 next.seasonGrowth=createSeasonGrowthLedger(world.players[c.protagonistKey]!,target,world.calendar.growthDays.length);next.development={...next.development,seasonStartPlayer:structuredClone(world.players[c.protagonistKey]!)};
 next.phaseContext={phase:'PRESEASON_SETUP'};next.revision++;delete next.season;delete next.seasonSchedule;delete next.preseasonPlan;delete next.campNotices;delete next.postseason;
 assertActiveUsRosterWorld(world);assertUsCareerRevision(next,next.revision);return next;
}

/** Internal shared-day hook: only a real closed native US date advances service; no separate salary/XP writer. */
export function recordUsMilitaryClosedDay(c:UsCareer,day:number):void {
 const s=c.military.service;if(s?.version!==2||!s.cursor||!s.closedDays||(!serving(c)&&c.military.status!=='COMPLETED')||s.returnOption?.status==='CONFIRMED'&&s.returnOffer?.status!=='OPEN')throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');
 if(!Number.isSafeInteger(day)||s.cursor.seasonKey!==c.world.seasonKey||day!==s.cursor.worldDay+1||c.season?.days.at(-1)?.day!==day||!c.seasonSchedule)throw new RangeError('US_MILITARY_DAY_EVIDENCE_REQUIRED');
 const scheduled=Object.values(c.seasonSchedule.leagues).flat().filter(g=>g.worldDay===day),key=c.protagonistKey;
 if(scheduled.some(g=>{const row=c.records.games[g.simulationKey];return !row||row.worldDay!==day||row.scope.seasonKey!==c.world.seasonKey||row.scope.leagueKey!==g.leagueKey||Object.hasOwn(row.batting,key)||Object.hasOwn(row.pitching,key);})||c.income.some(e=>e.kind==='SALARY'&&e.seasonKey===c.world.seasonKey&&e.day===day&&e.amount!==0)||c.season.days.at(-1)!.appearances!==0||c.health.games.some(g=>g.evidence.seasonKey===c.world.seasonKey&&g.evidence.day===day&&g.evidence.roster.includes(key)))throw new RangeError('US_MILITARY_NATIVE_DAY_NOT_SETTLED');
 s.cursor={seasonKey:c.world.seasonKey,worldDay:day};s.closedDays=[...s.closedDays,{...s.cursor}];
 if(serving(c)){const due=s.completionDays[s.completedBlocks];if(due?.seasonKey===c.world.seasonKey&&due.worldDay===day)c.military.service=completeBlock(s,c.world.seasonKey,day);}
 const option=c.military.service!.returnOption;if(option?.status==='OPEN'&&day>=option.expiresWorldDay){option.status='EXPIRED';c.contract={...c.contract,status:'TERMINATED'};}
 const offer=c.military.service!.returnOffer;if(offer?.status==='OPEN'&&day>=offer.expiresWorldDay)offer.status='EXPIRED';
}

export function usMilitaryServiceView(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const s=c.military.service;if(s?.version!==2)throw new RangeError('US_MILITARY_SERVICE_PROGRAM_REQUIRED');
 for(const year of s.years??[]){
  const games=new Map<number,string[]>();for(const level of LEVELS)for(const g of year.seasonSchedule.leagues[level]){const rows=games.get(g.worldDay)??[];rows.push(g.simulationKey);games.set(g.worldDay,rows);}
  for(const d of year.season.days){const rows=(games.get(d.day)??[]).map(key=>c.records.games[key]);if(rows.some(r=>!r||r.worldDay!==d.day||r.scope.seasonKey!==year.seasonKey||r.scope.phase!=='REGULAR')||canonicalJson(rows)!==d.evidence)throw new RangeError('INVALID_US_SERVICE_ARCHIVE_EVIDENCE');}
 }
 return {status:c.military.status,contractStatus:c.contract.status,completedBlocks:s.completedBlocks,scheduledBlocks:s.scheduledBlocks,cursor:structuredClone(s.cursor),returnOption:s.returnOption?structuredClone(s.returnOption):null,returnOffer:s.returnOffer?{offerKey:s.returnOffer.offerKey,status:s.returnOffer.status,organizationId:s.sourceRegistration!.clubId,level:s.sourceRegistration!.level,currency:'USD' as const,annualSalaryUsd:s.returnOffer.contract.annualSalaryUsd,years:s.returnOffer.contract.years,expiresWorldDay:s.returnOffer.expiresWorldDay}:null};
}

/** Confirmation reuses the existing option and resumes on the next real date; no new contract or payment. */
export function confirmUsMilitaryReturn(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);const s=c.military.service,option=s?.returnOption;
 if(c.military.status!=='COMPLETED'||!s?.cursor||option?.status!=='OPEN'||s.cursor.seasonKey!==option.issuedSeasonKey||s.cursor.worldDay<option.issuedWorldDay||s.cursor.worldDay>=option.expiresWorldDay||!s.sourceContract?.militaryReturnOption)throw new RangeError('US_MILITARY_RETURN_NOT_AVAILABLE');
 const source=usMilitarySourceCareer(c),origin=usContractOrigin(source),epoch=source.minorRenewal?Number(source.minorRenewal.signedFromSeasonKey)+1:Number(origin.contract.seasonKey),remaining=(source.kboTransfer?source.contract.years!:source.contract.controlSeasons)-(Number(source.world.seasonKey)-epoch+1);
 if(source.contract.type==='US_MINOR'&&remaining<1||source.contract.type==='US_MAJOR'&&(source.contract.years??1)<2)return openUsMilitaryExpiredReturnOffer(c);
 const contract:UsCareer['contract']={...c.contract,status:'ACTIVE',...(source.contract.type==='US_MAJOR'?{years:source.contract.years!-1,remainingGuaranteedUsd:(source.contract.years!-1)*source.contract.annualSalaryUsd}:{...(source.contract.years===undefined?{}:{years:remaining})})};
 return activateUsMilitaryReturn(c,contract,remaining);
}

function activateUsMilitaryReturn(c:UsCareer,contract:UsCareer['contract'],remaining:number):UsCareer {
 const s=c.military.service!,option=s.returnOption!,next=structuredClone(c),key=c.protagonistKey,org=next.world.organizations.find(o=>o.id===option.organizationId)!;
 if(!Object.hasOwn(next.health.injuries,key)){
  const player=next.world.players[key]!,roster=org.levels[option.level],right=roster.filter(k=>next.world.players[k]!.kind==='HITTER'&&next.world.players[k]!.throws==='R').length;
  const displaced=roster.filter(k=>next.world.players[k]!.kind===player.kind).sort((a,b)=>Number(next.world.players[b]!.position===player.position)-Number(next.world.players[a]!.position===player.position)||(a<b?-1:1)).find(k=>{const p=next.world.players[k]!;return (p.position===player.position||roster.some(other=>other!==k&&next.world.players[other]!.position===p.position))&&(player.kind!=='HITTER'||player.throws==='R'||p.throws==='L'||right>4);});
  if(!displaced)throw new RangeError('US_MILITARY_RETURN_NO_LEGAL_SLOT');org.levels[option.level]=roster.map(k=>k===displaced?key:k).sort();next.world.reserves![org.id]=[...next.world.reserves![org.id]!.filter(k=>k!==key),displaced].sort();next.registration={...next.registration,level:option.level,status:'ACTIVE'};
 }
 const effective=s.cursor!.worldDay+1,games=Object.values(c.seasonSchedule!.leagues).flat(),first=Math.min(...games.map(g=>g.worldDay)),last=Math.max(...games.map(g=>g.worldDay)),reservation=Math.min(contract.remainingGuaranteedUsd??Infinity,Math.floor(contract.annualSalaryUsd*Math.max(0,last-Math.max(first,effective)+1)/(last-first+1)));
 const club=next.inventory.clubs.find(o=>o.id===option.organizationId)!;if(club.availableBudgetUsd<reservation)throw new RangeError('US_MILITARY_RETURN_BUDGET_REQUIRED');club.availableBudgetUsd-=reservation;
 next.contract=structuredClone(contract);next.military.service!.returnContract=structuredClone(next.contract);next.military.service!.returnInventory=structuredClone(next.inventory);next.military.service!.remainingControlSeasons=remaining;next.military.service!.returnReservationUsd=reservation;
 next.military.service!.returnOption={...option,status:'CONFIRMED',confirmedWorldDay:option.confirmedWorldDay??s.cursor!.worldDay,effectiveWorldDay:effective};next.revision++;assertUsCareerRevision(next,next.revision);return next;
}

function openUsMilitaryExpiredReturnOffer(c:UsCareer):UsCareer {
 const next=structuredClone(c),s=next.military.service!,source=s.sourceContract!,day=s.cursor!.worldDay,key=JSON.stringify(['us-military-new-return-offer',s.programId,day]),contract:UsCareer['contract']={...source,contractKey:key,seasonKey:c.world.seasonKey,status:'ACTIVE',signingBonusUsd:0,years:1,annualSalaryUsd:30000};delete contract.remainingGuaranteedUsd;
 const offer:UsMilitaryReturnOffer={offerKey:key,issuedWorldDay:day,expiresWorldDay:day+30,status:'OPEN',contract};
 if(source.type==='US_MAJOR'){const totals=recordTotals(c.records,{seasonKey:s.planSeasonKey,leagueKey:'MLB',phase:'REGULAR'}),player=structuredClone(c.world.players[c.protagonistKey]!),batting=structuredClone(totals.batting[c.protagonistKey]??emptyBatting()),pitching=structuredClone(totals.pitching[c.protagonistKey]??emptyPitching()),freeAgentEligible=mlbServiceTime(c.records,c.health,c.protagonistKey).freeAgentEligible;offer.valuation={player,batting,pitching,freeAgentEligible};contract.annualSalaryUsd=usMajorContractValue(player,batting,pitching).annualSalaryUsd;contract.years=freeAgentEligible?usMlbOfferYears(player.age):1;if(contract.years>1)contract.remainingGuaranteedUsd=contract.annualSalaryUsd*contract.years;}
 s.returnOffer=offer;s.returnOption={...s.returnOption!,status:'CONFIRMED',confirmedWorldDay:day};next.contract={...next.contract,status:'TERMINATED'};next.revision++;assertUsCareerRevision(next,next.revision);return next;
}

function assertUsMilitaryReturnOffer(c:UsCareer):void {
 const s=c.military.service!,o=s.returnOffer!,source=s.sourceContract!,expected:UsCareer['contract']={...source,contractKey:JSON.stringify(['us-military-new-return-offer',s.programId,o.issuedWorldDay]),seasonKey:s.returnOption!.issuedSeasonKey,status:'ACTIVE',signingBonusUsd:0,years:1,annualSalaryUsd:30000};delete expected.remainingGuaranteedUsd;
 if(source.type==='US_MAJOR'){const v=o.valuation;if(!v||v.player.simulationKey!==c.protagonistKey)throw new RangeError('INVALID_US_MILITARY_RETURN_OFFER');expected.annualSalaryUsd=usMajorContractValue(v.player,v.batting,v.pitching).annualSalaryUsd;expected.years=v.freeAgentEligible?usMlbOfferYears(v.player.age):1;if(expected.years>1)expected.remainingGuaranteedUsd=expected.annualSalaryUsd*expected.years;}
 if(o.offerKey!==expected.contractKey||!Number.isSafeInteger(o.issuedWorldDay)||o.issuedWorldDay!==s.returnOption!.confirmedWorldDay||o.expiresWorldDay!==o.issuedWorldDay+30||!['OPEN','ACCEPTED','DECLINED','EXPIRED'].includes(o.status)||o.status==='OPEN'&&s.cursor!.worldDay>=o.expiresWorldDay||canonicalJson(o.contract)!==canonicalJson(expected))throw new RangeError('INVALID_US_MILITARY_RETURN_OFFER');
}

/** The expired source contract is historical; camp confirmation never accepts this new offer implicitly. */
export function acceptUsMilitaryReturnOffer(c:UsCareer,revision:number,offerKey:string):UsCareer {
 assertUsCareerRevision(c,revision);const s=c.military.service,o=s?.returnOffer;if(!s?.cursor||s.returnOption?.status!=='CONFIRMED'||o?.status!=='OPEN'||o.offerKey!==offerKey||s.cursor.worldDay>=o.expiresWorldDay)throw new RangeError('US_MILITARY_RETURN_OFFER_NOT_AVAILABLE');
 const next=activateUsMilitaryReturn(c,o.contract,o.contract.type==='US_MINOR'?1:0);next.military.service!.returnOffer={...structuredClone(o),status:'ACCEPTED'};assertUsCareerRevision(next,next.revision);return next;
}

export function declineUsMilitaryReturnOffer(c:UsCareer,revision:number,offerKey:string):UsCareer {
 assertUsCareerRevision(c,revision);const o=c.military.service?.returnOffer;if(o?.status!=='OPEN'||o.offerKey!==offerKey)throw new RangeError('US_MILITARY_RETURN_OFFER_NOT_AVAILABLE');const next=structuredClone(c);next.military.service!.returnOffer={...structuredClone(o),status:'DECLINED'};next.revision++;return next;
}

/** Original snapshots remain authoritative even after actual calendar years/financial registries advance. */
function usMilitarySourceCareer(c:UsCareer):UsCareer {
 const s=c.military.service!;if(!s.sourceContract||!s.sourceInventory||s.sourceSchemaVersion===undefined||s.sourceMinorYears===undefined||s.sourceMajorYears===undefined||!s.sourceRegistration||!s.sourceRights)throw new RangeError('INVALID_US_MILITARY_SOURCE');
 const source:UsCareer={...c,schemaVersion:s.sourceSchemaVersion,military:{status:'UNRESOLVED',deadlineAge:28},world:{...c.world,seasonKey:s.planSeasonKey,calendar:createSeasonCalendar(Number(s.planSeasonKey),'calendar-2'),players:{...c.world.players,[c.protagonistKey]:{...c.world.players[c.protagonistKey]!,age:s.sourceAge!}},reserves:{...c.world.reserves,[s.sourceRegistration.clubId]:[c.protagonistKey]}},protagonistOrganizationId:s.sourceRegistration.clubId,registration:{...s.sourceRegistration,status:'INJURED',seasonKey:s.planSeasonKey},rights:s.sourceRights,contract:s.sourceContract,inventory:s.sourceInventory,minorYears:(c.minorYears??[]).slice(0,s.sourceMinorYears),majorYears:(c.majorYears??[]).slice(0,s.sourceMajorYears)};
 // The historical contract replay owns only aliases earned by its source season.
 if(c.aliases)source.aliases={...c.aliases,history:c.aliases.history.filter(r=>Number(r.seasonKey)<=Number(s.planSeasonKey)),notices:c.aliases.notices.filter(e=>Number(e.seasonKey)<=Number(s.planSeasonKey))};
 if(s.sourceSeason)source.season=s.sourceSeason;else delete source.season;
 if(s.sourceMinorRenewal)source.minorRenewal=s.sourceMinorRenewal;else delete source.minorRenewal;
 return source;
}

/** Existing history readers replay the original prefix, then this explicit post-service contract epoch. */
export function usMilitaryContinuationOrigin(c:UsCareer){
 const s=c.military.service;if(s?.version!==2||s.returnOption?.status!=='CONFIRMED'||!s.returnContract||!s.returnInventory)return null;
 usCareerView(usMilitarySourceCareer(c));
 const inventory=usMilitaryInactiveInventory(c),club=inventory.clubs.find(o=>o.id===s.returnOption!.organizationId)!;club.availableBudgetUsd-=s.returnReservationUsd!;
 if(!Number.isSafeInteger(s.returnReservationUsd)||s.returnReservationUsd!<0||club.availableBudgetUsd<0||canonicalJson(s.returnInventory)!==canonicalJson(inventory))throw new RangeError('INVALID_US_MILITARY_INVENTORY');
 return {origin:{playerAge:s.sourceAge!+Number(s.returnContract.seasonKey)-Number(s.planSeasonKey),contract:s.returnContract,inventory:s.returnInventory},minorYears:(c.minorYears??[]).slice(s.sourceMinorYears),majorYears:(c.majorYears??[]).slice(s.sourceMajorYears),remainingControlSeasons:s.remainingControlSeasons!,returnPaidUsd:s.returnReservationUsd!};
}

function usMilitaryInactiveInventory(c:UsCareer):UsCareer['inventory'] {
 const s=c.military.service!;if(!s.sourceInventory||!s.sourceRegisteredPlayerKeys||!s.serviceRegistries||s.serviceRegistries.length!==s.supply?.length)throw new RangeError('INVALID_US_MILITARY_INVENTORY');
 let inventory=structuredClone(s.sourceInventory),registered=[...s.sourceRegisteredPlayerKeys];
 for(const [i,r]of s.serviceRegistries.entries()){
  const supply=s.supply[i]!;registered=[...registered.filter(k=>!supply.retired.some(p=>p.playerKey===k)),...supply.arrivals.map(p=>p.playerKey)].sort();
  if(r.seasonKey!==supply.targetSeasonKey||canonicalJson(registered)!==canonicalJson(r.registeredPlayerKeys))throw new RangeError('INVALID_US_MILITARY_INVENTORY');
  inventory=fundUsMinorYear(inventory,r.seasonKey,registered,inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:0})),s.sourceRegistration!.clubId,0);
 }
 return inventory;
}

export function declineUsMilitaryReturn(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);const option=c.military.service?.returnOption;if(c.military.status!=='COMPLETED'||option?.status!=='OPEN')throw new RangeError('US_MILITARY_RETURN_NOT_AVAILABLE');
 const next=structuredClone(c);next.military.service!.returnOption={...option,status:'DECLINED'};next.contract={...next.contract,status:'TERMINATED'};next.revision++;return next;
}

/** Official registration receipts include bench/injured games; no INT date or permanent ability write. */
export function usMilitaryReturnConditionMultiplier(c:UsCareer):number {
 const s=c.military.service,option=s?.returnOption;if(s?.version!==2||option?.status!=='CONFIRMED'||option.effectiveWorldDay===undefined)return 1;
 const dates=new Set<string>();
 for(const h of c.health.games){const r=h.evidence,split=r.teamKey.indexOf(':'),level=r.teamKey.slice(0,split),club=r.teamKey.slice(split+1);
  if(!LEVELS.includes(level as UsLevel)||club!==option.organizationId||!r.roster.includes(c.protagonistKey)||Number(r.seasonKey)<Number(option.issuedSeasonKey)||r.seasonKey===option.issuedSeasonKey&&r.day<option.effectiveWorldDay)continue;
  const row=c.records.games[r.gameKey];if(!row||row.scope.seasonKey!==r.seasonKey||row.worldDay!==r.day||row.scope.leagueKey!==level||!['REGULAR','POSTSEASON'].includes(row.scope.phase)||row.teams[club]?.games!==1||Object.keys(row.teams).length!==2||new Set(r.roster).size!==r.roster.length)throw new RangeError('INVALID_US_RETURN_CONDITION_REGISTRATION');
  const date=JSON.stringify([r.seasonKey,r.day]);if(dates.has(date))throw new RangeError('DOUBLE_BOOKED_US_RETURN_CONDITION_DAY');dates.add(date);
 }
 return dates.size<6?.95:1;
}
