import {cancelUsKboReturnQuote} from './us-kbo-return.js';
import type {UsCareer,ActiveUsRosterWorld} from './us-career-entry.js';
import {assertUsCareerRevision,assertActiveUsRosterWorld} from './us-career-entry.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {auditUsClosedDays} from './us-growth.js';
import {auditUsCompletedPostseason} from './us-postseason-progress.js';
import {assertUsSeason} from './us-season.js';
import {fundUsMinorYear} from './us-minor-history.js';
import type {UsAnnualFunding,UsMinorYearArchive} from './us-minor-history.js';
import type {UsLevel} from './us-world.js';
import {recordTotals} from './records.js';
import {usCompetitionScore} from './us-levels.js';
import {createWorldEvent,resolveEventChoice,completeBlockingEvent,validateEvent} from './events.js';
import {canonicalJson} from './game.js';
import {retireAndSupplyUsNpcs} from './us-supply.js';
import {closeSeasonHealth} from './health.js';
import {createSeasonCalendar} from './season-calendar.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import {HITTER_TYPES,PITCHER_TYPES,PITCH_IDS,abilityKeys} from '@playball/rules';
import {archetypeFor,truncatedNormal,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {initialProfileAbilities} from './initial-abilities.js';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import {nextInteger} from './rng.js';
import {createRepertoire} from './repertoire.js';

export interface UsMinorOffer {
 offerKey:string;organizationId:string;organizationName:string;initialLevel:Exclude<UsLevel,'MLB'>;years:1;annualSalaryUsd:number;signingBonusUsd:0;currency:'USD';nationalReleaseAllowed:boolean;militaryReturnOption:boolean;competitorKey:string|null;competitorScore:number|null;
}
export interface UsMinorMarket {
 marketId:string;worldKey:string;seasonKey:string;targetSeasonKey:string;playerKey:string;sourceContractKey:string;sourceOrganizationId:string;sourceRevision:number;recordRevision:number;initialLevel:Exclude<UsLevel,'MLB'>;status:'OPEN';playerScore:number;funding:UsAnnualFunding[];offers:UsMinorOffer[];eventKey:string;
}
/** Sealed after accept; original usContractOrigin stays untouched. */
export interface UsMinorRenewal {
 marketId:string;offerKey:string;organizationId:string;signedFromSeasonKey:string;sourceRevision:number;contract:UsCareer['contract'];funding:UsAnnualFunding[];displacedCompetitorKey:string|null;
}
const marketId=(c:UsCareer)=>JSON.stringify(['us-minor-market',c.activation.receiptKey,c.world.seasonKey,c.contract.contractKey]);
const sortedFunding=(funding:readonly UsAnnualFunding[])=>funding.map(f=>({...f})).sort((a,b)=>a.organizationId<b.organizationId?-1:a.organizationId>b.organizationId?1:0);

/** Saved quotes are validated, never rerated from later corrected statistics. */
export function assertUsMinorMarket(c:UsCareer):void {
 const m=c.minorMarket;
 if(!m||typeof m!=='object'||!c.kboTransfer?.origin||m.marketId!==marketId(c)||m.status!=='OPEN'||m.worldKey!==c.world.worldKey||m.seasonKey!==c.world.seasonKey||m.targetSeasonKey!==String(Number(c.world.seasonKey)+1)||m.playerKey!==c.protagonistKey||m.sourceContractKey!==c.contract.contractKey||m.sourceOrganizationId!==c.protagonistOrganizationId||m.initialLevel!==c.registration.level||!['ROOKIE','A','AA','AAA'].includes(m.initialLevel)||c.contract.type!=='US_MINOR'||c.phaseContext.phase!=='SEASON_REVIEW'||!Number.isSafeInteger(m.sourceRevision)||m.sourceRevision<c.activation.sourceRevision||m.sourceRevision>=c.revision||!Number.isSafeInteger(m.recordRevision)||m.recordRevision<0||m.recordRevision>c.records.revision||!Number.isFinite(m.playerScore)||m.playerScore<0||m.playerScore>100||!Array.isArray(m.funding)||m.funding.some(f=>!f||typeof f!=='object')||!Array.isArray(m.offers)||m.offers.some(o=>!o||typeof o!=='object')||m.offers.length>4||new Set(m.offers.map(o=>o?.organizationId)).size!==m.offers.length||m.offers.filter(o=>o.organizationId!==m.sourceOrganizationId).length>3)throw new RangeError('INVALID_US_MINOR_MARKET');
 const funded=fundUsMinorYear(c.inventory,m.targetSeasonKey,c.inventory.registeredPlayerKeys,m.funding,m.sourceOrganizationId,0);
 for(const o of m.offers){const player=o.competitorKey===null?null:c.world.players[o.competitorKey],owner=c.world.organizations.find(org=>org.id===o.organizationId);if(o.organizationId!==m.sourceOrganizationId&&o.competitorKey===null||o.competitorKey!==null&&(!player||!owner?.levels[m.initialLevel].includes(o.competitorKey)||player.kind!==c.world.players[c.protagonistKey]!.kind||player.position!==c.world.players[c.protagonistKey]!.position))throw new RangeError('INVALID_US_MINOR_MARKET');const club=funded.clubs.find(x=>x.id===o.organizationId),org=c.world.organizations.find(x=>x.id===o.organizationId);if(!club||!org||o.offerKey!==JSON.stringify(['us-minor-offer',m.marketId,o.organizationId])||o.organizationName!==org.name||o.initialLevel!==m.initialLevel||o.years!==1||o.currency!=='USD'||o.annualSalaryUsd!==30000||o.signingBonusUsd!==0||o.nationalReleaseAllowed!==club.nationalReleaseAllowed||o.militaryReturnOption!==club.militaryReturnOption||club.availableBudgetUsd<30000||o.competitorKey!==null&&(typeof o.competitorKey!=='string'||!o.competitorKey)||(o.competitorKey===null)!==(o.competitorScore===null)||o.competitorScore!==null&&(!Number.isFinite(o.competitorScore)||o.competitorScore<0||o.competitorScore>100||o.organizationId!==m.sourceOrganizationId&&m.playerScore<=o.competitorScore))throw new RangeError('INVALID_US_MINOR_MARKET');}
 const e=c.events.find(e=>e.eventKey===m.eventKey);if(!e||e.definitionId!=='E66'||e.status!=='OPEN'||e.worldKey!==m.worldKey||e.seasonKey!==m.seasonKey||e.evidence.fields.playerSimulationKey!==m.playerKey||e.evidence.fields.contractWindowIdOrReturnProgramId!==m.marketId||e.evidence.fields.stage!=='MINOR_EXPIRED'||e.resume.phase!=='SEASON_REVIEW'||e.resume.competitionKey!==m.initialLevel||e.resume.registrationKey!==m.sourceOrganizationId||e.resume.sourceRevision!==m.sourceRevision+1)throw new RangeError('INVALID_US_MINOR_MARKET');validateEvent(e);
}

/** Trusted funding only; this freezes comparison data, not a salary reservation or a new contract. */
export function openUsMinorMarket(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 assertUsCareerRevision(c,revision);const fixed=sortedFunding(funding);
 if(c.minorMarket){if(canonicalJson(fixed)!==canonicalJson(c.minorMarket.funding))throw new RangeError('US_MINOR_MARKET_FUNDING_CHANGED');return c;}
 const ready=usYearTransitionReadiness(c);if(!c.kboTransfer?.origin||c.contract.type!=='US_MINOR'||c.registration.level==='MLB'||ready.remainingMinorControlSeasons!==0||ready.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED'))throw new RangeError('US_MINOR_MARKET_NOT_AVAILABLE');
 auditUsClosedDays(c);auditUsCompletedPostseason(c);
 const id=marketId(c),level=c.registration.level,p=c.world.players[c.protagonistKey]!,totals=recordTotals(c.records,{leagueKey:level,phase:'REGULAR',seasonKey:c.world.seasonKey}),score=usCompetitionScore(c,c.protagonistKey,level,totals),future=fundUsMinorYear(c.inventory,ready.targetSeasonKey,c.inventory.registeredPlayerKeys,fixed,c.protagonistOrganizationId,0);
 const candidate=(org:UsCareer['world']['organizations'][number]):UsMinorOffer|null=>{
  const club=future.clubs.find(x=>x.id===org.id)!;if(club.availableBudgetUsd<30000||org.id!==c.protagonistOrganizationId&&Object.values(org.levels).flat().length+(c.world.reserves?.[org.id]?.length??0)>=160)return null;
  const keys=org.levels[level].filter(k=>k!==c.protagonistKey&&c.world.players[k]!.kind===p.kind&&c.world.players[k]!.position===p.position&&!c.health.injuries[k]&&c.season?.emergency?.entries[k]?.releasedDay!==null),ranked=keys.map(key=>({key,score:usCompetitionScore(c,key,level,totals)})).sort((a,b)=>a.score-b.score||(a.key<b.key?-1:1)),weakest=ranked[0];
  if(org.id!==c.protagonistOrganizationId&&(!weakest||score<=weakest.score))return null;
  return {offerKey:JSON.stringify(['us-minor-offer',id,org.id]),organizationId:org.id,organizationName:org.name,initialLevel:level,years:1,annualSalaryUsd:30000,signingBonusUsd:0,currency:'USD',nationalReleaseAllowed:club.nationalReleaseAllowed,militaryReturnOption:club.militaryReturnOption,competitorKey:weakest?.key??null,competitorScore:weakest?.score??null};
 };
 const original=candidate(c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!),others=c.world.organizations.filter(o=>o.id!==c.protagonistOrganizationId).map(candidate).filter((o):o is UsMinorOffer=>o!==null).sort((a,b)=>Number(a.competitorScore!==null)-Number(b.competitorScore!==null)||(a.competitorScore??0)-(b.competitorScore??0)||(a.organizationId<b.organizationId?-1:1)).slice(0,3),day=Object.values(c.records.games).reduce((n,g)=>g.scope.seasonKey===c.world.seasonKey?Math.max(n,g.worldDay):n,0)+1;
 const event=createWorldEvent({definitionId:'E66',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:'US_RETURN',fields:{playerSimulationKey:c.protagonistKey,contractWindowIdOrReturnProgramId:id,stage:'MINOR_EXPIRED'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:level,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.reduce((n,e)=>Math.max(n,e.sourceSequence),0)+1,worldDay:day});
 const next:UsCareer={...c,revision:c.revision+1,events:[...c.events,event],minorMarket:{marketId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,targetSeasonKey:ready.targetSeasonKey,playerKey:c.protagonistKey,sourceContractKey:c.contract.contractKey,sourceOrganizationId:c.protagonistOrganizationId,sourceRevision:c.revision,recordRevision:c.records.revision,initialLevel:level,status:'OPEN',playerScore:score,funding:fixed,offers:[...(original?[original]:[]),...others],eventKey:event.eventKey}};assertUsCareerRevision(next,next.revision);return next;
}

export function usMinorMarketView(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const m=c.minorMarket;if(!m)throw new RangeError('US_MINOR_MARKET_NOT_OPEN');
 return {marketId:m.marketId,playerScore:m.playerScore,currentLevel:m.initialLevel,offers:structuredClone(m.offers),returnHome:{available:true,route:c.kboTransfer!.returnRights?'ORIGINAL_CLUB_PRIORITY' as const:'DOMESTIC_FA' as const,holderClubId:c.kboTransfer!.returnRights?.holderClubId??null}};
}
export function resolveUsMinorMarketEvent(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string}){
 assertUsCareerRevision(c,revision);const m=c.minorMarket,e=c.events.find(e=>e.eventKey===input.eventKey);if(!m||m.eventKey!==input.eventKey||!e)throw new RangeError('INVALID_US_MINOR_MARKET_EVENT');
 const picked=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS','OPEN_RETURN']});if(!picked.navigation||picked.domain||picked.event.status!=='OPEN')throw new RangeError('INVALID_US_MINOR_MARKET_NAVIGATION');return {career:c,navigation:picked.navigation};
}

function restoreEmergencyRegistrations(c:UsCareer,world:ActiveUsRosterWorld):void {
 for(const[key,e]of Object.entries(c.season!.emergency?.entries??{}))if(e.releasedDay===null){const org=world.organizations.find(o=>o.id===e.clubId)!,reserve=world.reserves?.[org.id];if(!org.levels[e.level].includes(key)||!reserve?.includes(e.replacedKey))throw new RangeError('INVALID_US_EMERGENCY_REGISTRATION');org.levels[e.level]=org.levels[e.level].map(k=>k===key?e.replacedKey:k);world.reserves![org.id]=reserve.filter(k=>k!==e.replacedKey);world.reserves![org.id]!.push(key);}
}

const minorLevels:readonly Exclude<UsLevel,'MLB'>[]=['ROOKIE','A','AA','AAA'];
/** Same org promote/reserve first; Rookie bottom adds one real us-rookie. No invented upper-level free agent. */
function fillSourceVacancy(world:ActiveUsRosterWorld,fromId:string,level:Exclude<UsLevel,'MLB'>,kind:DevelopmentPlayer['kind'],exclude:string,targetSeasonKey:string,serial:{n:number}):void {
 const from=world.organizations.find(o=>o.id===fromId)!;world.reserves=world.reserves??{};
 const reserve=(world.reserves[from.id]??[]).filter(k=>k!==exclude&&world.players[k]?.kind===kind).sort()[0];
 if(reserve){from.levels[level]=[...from.levels[level],reserve].sort();world.reserves[from.id]=(world.reserves[from.id]??[]).filter(k=>k!==reserve);return;}
 const index=minorLevels.indexOf(level);for(let donor=index-1;donor>=0;donor--){const lower=minorLevels[donor]!,promo=from.levels[lower].filter(k=>k!==exclude&&world.players[k]!.kind===kind).sort()[0];if(!promo)continue;from.levels[lower]=from.levels[lower].filter(k=>k!==promo);from.levels[level]=[...from.levels[level],promo].sort();fillSourceVacancy(world,fromId,lower,kind,exclude,targetSeasonKey,serial);return;}
 if(level!=='ROOKIE')throw new RangeError('US_MINOR_MARKET_SOURCE_RESERVE_REQUIRED');
 const position=kind==='PITCHER'?'SP':'CF',key=JSON.stringify(['us-rookie',world.worldKey,targetSeasonKey,from.id,kind,position,serial.n++]);if(Object.hasOwn(world.players,key))throw new RangeError('US_ROOKIE_KEY_COLLISION');
 const identity=generateNpcIdentities([{simulationKey:key,kind,position}],world.rng.handedness);world.rng.handedness=identity.state;
 const types=Object.keys(kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),draw=nextInteger(world.rng.roster,types.length);world.rng.roster=draw.state;const archetype=types[draw.value]!,profile=archetypeFor(kind,archetype),keys=abilityKeys(kind),z=truncatedNormal(world.rng.roster);world.rng.roster=z.state;
 const abilities=initialProfileAbilities(kind,archetype,Math.round(35+4*z.value)),potential=generateNpcPotential(kind,abilities,{mode:'CAREER',difficulty:world.difficulty,owned:false},world.rng.potential);world.rng.potential=potential.state;
 const age=nextInteger(world.rng.roster,5);world.rng.roster=age.state;
 const player:DevelopmentPlayer={...identity.players[0]!,name:'미국신인'+serial.n,age:18+age.value,archetype,focus:[...keys].sort((a,b)=>profile.weights[keys.indexOf(b)]!-profile.weights[keys.indexOf(a)]!||keys.indexOf(a)-keys.indexOf(b)).slice(0,4),abilities,potential:potential.potential,careerPeaks:{...abilities},fatigue:0};validateDevelopmentPlayer(player);world.players[key]=player;
 if(kind==='PITCHER'){const pitch=nextInteger(world.rng.roster,6);world.rng.roster=pitch.state;world.repertoires[key]=createRepertoire(PITCH_IDS[pitch.value+1]!,targetSeasonKey);}
 from.levels.ROOKIE=[...from.levels.ROOKIE,key].sort();
}
function moveToOffer(world:ActiveUsRosterWorld,key:string,level:Exclude<UsLevel,'MLB'>,fromId:string,offer:UsMinorOffer,targetSeasonKey:string):string|null {
 const from=world.organizations.find(o=>o.id===fromId)!,to=world.organizations.find(o=>o.id===offer.organizationId)!;
 if(!from.levels[level].includes(key))throw new RangeError('US_MINOR_MARKET_ROSTER_CHANGED');
 from.levels[level]=from.levels[level].filter(k=>k!==key);
 if(offer.organizationId===fromId){from.levels[level]=[...from.levels[level],key].sort();return null;}
 if(!offer.competitorKey||!to.levels[level].includes(offer.competitorKey))throw new RangeError('US_MINOR_MARKET_COMPETITOR_CHANGED');
 to.levels[level]=to.levels[level].map(k=>k===offer.competitorKey?key:k);world.reserves=world.reserves??{};
 fillSourceVacancy(world,fromId,level,world.players[key]!.kind,key,targetSeasonKey,{n:0});
 world.reserves[to.id]=[...(world.reserves[to.id]??[]),offer.competitorKey].sort();
 return offer.competitorKey;
}

/** Accept one sealed minor offer, archive the expired control year, and open the next season on the new 1-year contract. */
export function acceptUsMinorMarketOffer(c:UsCareer,revision:number,offerKey:string):UsCareer {
 assertUsCareerRevision(c,revision);c=cancelUsKboReturnQuote(c);assertUsMinorMarket(c);const m=c.minorMarket!,offer=m.offers.find(o=>o.offerKey===offerKey);if(!offer)throw new RangeError('US_MINOR_OFFER_NOT_FOUND');
 const sealed=canonicalJson(offer),ready=usYearTransitionReadiness(c);if(ready.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED'&&b!=='OPEN_EVENT')||!ready.blockers.includes('CONTRACT_DECISION_REQUIRED'))throw new RangeError('US_MINOR_MARKET_NOT_AVAILABLE');
 assertUsSeason(c,revision);auditUsClosedDays(c);auditUsCompletedPostseason(c);
 if(Object.values(c.records.games).some(g=>g.scope.seasonKey===ready.targetSeasonKey))throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
 const event=c.events.find(e=>e.eventKey===m.eventKey)!;if(event.status!=='OPEN')throw new RangeError('INVALID_US_MINOR_MARKET');
 const world=structuredClone(c.world);restoreEmergencyRegistrations(c,world);
 const displaced=moveToOffer(world,c.protagonistKey,m.initialLevel,c.protagonistOrganizationId,offer,ready.targetSeasonKey);
 const retiring=Object.keys(world.players).filter(key=>key!==c.protagonistKey&&world.players[key]!.age===45),supply=retireAndSupplyUsNpcs(world,retiring,ready.targetSeasonKey,c.protagonistKey);
 for(const[key,p]of Object.entries(world.players)){if(!Object.hasOwn(c.world.players,key))continue;world.players[key]={...p,age:p.age+1,fatigue:0};const book=schoolYearEndRepertoire({world:c.world},key);if(book)world.repertoires[key]={...structuredClone(book),seasonId:ready.targetSeasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};}
 const ended=closeSeasonHealth(c.health,c.world.seasonKey).ledger,health={...ended,rng:{...ended.rng},injuries:structuredClone(ended.injuries)};for(const r of supply.retired)delete health.injuries[r.playerKey];
 world.seasonKey=ready.targetSeasonKey;world.calendar=createSeasonCalendar(Number(ready.targetSeasonKey),'calendar-2');assertActiveUsRosterWorld(world);
 const registered=Object.keys(world.players).sort(),funding=sortedFunding(m.funding),contract:UsCareer['contract']={contractKey:JSON.stringify(['us-minor-renewal',m.marketId,offer.offerKey]),type:'US_MINOR',currency:'USD',years:1,annualSalaryUsd:30000,signingBonusUsd:0,controlSeasons:6,status:'ACTIVE',seasonKey:ready.targetSeasonKey,nationalReleaseAllowed:offer.nationalReleaseAllowed,militaryReturnOption:offer.militaryReturnOption};
 if(canonicalJson(m.offers.find(o=>o.offerKey===offerKey))!==sealed)throw new RangeError('US_MINOR_OFFER_CHANGED');
 const inventory=fundUsMinorYear(c.inventory,ready.targetSeasonKey,registered,funding,offer.organizationId,30000),player=world.players[c.protagonistKey]!;
 const archive:UsMinorYearArchive={receiptKey:JSON.stringify(['us-minor-year-close',c.activation.receiptKey,c.world.seasonKey]),seasonKey:c.world.seasonKey,sourceRevision:c.revision,recordRevision:c.records.revision,endingPlayer:structuredClone(c.world.players[c.protagonistKey]!),contract:structuredClone(c.contract),inventory:c.inventory,season:c.season!,seasonSchedule:c.seasonSchedule!,preseasonPlan:c.preseasonPlan!,campNotices:c.campNotices??[],postseason:c.postseason!,seasonGrowth:c.seasonGrowth,funding,nextRegisteredPlayerKeys:registered,supply};
 const ctx={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:event.offeredChoices};
 const closed=completeBlockingEvent(event,event.version,{sourceEvidenceKey:event.evidenceKey,receiptKey:archive.receiptKey,command:'ACCEPT_CAREER_OFFER'},ctx);
 const renewal:UsMinorRenewal={marketId:m.marketId,offerKey:offer.offerKey,organizationId:offer.organizationId,signedFromSeasonKey:c.world.seasonKey,sourceRevision:c.revision,contract:{...contract},funding,displacedCompetitorKey:displaced};
 archive.minorRenewal=structuredClone(renewal);
 const history=(c.minorYears??[]).map(y=>!y.minorRenewal&&c.minorRenewal?.signedFromSeasonKey===y.seasonKey?{...y,minorRenewal:structuredClone(c.minorRenewal)}:y);
 const day=world.calendar.growthDays[0]!,teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:m.initialLevel,protagonistKey:c.protagonistKey,protagonistSchoolId:offer.organizationId,schools:world.organizations.map(o=>({id:o.id,name:o.name,roster:o.levels[m.initialLevel]})),players:world.players};
 const next:UsCareer={...c,schemaVersion:3,revision:c.revision+1,world,health,minorYears:[...history,archive],inventory,contract,protagonistOrganizationId:offer.organizationId,rights:{...c.rights,holderOrgId:offer.organizationId},registration:{playerKey:c.protagonistKey,clubId:offer.organizationId,level:m.initialLevel,seasonKey:ready.targetSeasonKey,status:'ACTIVE'},phaseContext:{phase:'PRESEASON_SETUP'},seasonGrowth:createSeasonGrowthLedger(player,ready.targetSeasonKey,world.calendar.growthDays.length),development:{...c.development,seasonStartPlayer:structuredClone(player)},planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],events:c.events.map(e=>e.eventKey===event.eventKey?closed:e),minorRenewal:renewal};
 delete next.minorMarket;delete next.season;delete next.seasonSchedule;delete next.preseasonPlan;delete next.campNotices;delete next.postseason;
 if(c.traits)next.traits={...c.traits,lastClosedDay:null,lastSeasonKey:ready.targetSeasonKey};
 if(offer.organizationId!==c.protagonistOrganizationId){
  const ledger=c.relationships&&Array.isArray(c.relationships.relations)?c.relationships:undefined;
  next.relationships=formRegisteredTeamTeammate(ledger,teamWorld,archive.receiptKey,day);
  const notices=queueRelationFormationNotices({...next,world:teamWorld},day);if(notices)next.relationNotices=notices;
 }
 assertUsCareerRevision(next,next.revision);return refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(next));
}
