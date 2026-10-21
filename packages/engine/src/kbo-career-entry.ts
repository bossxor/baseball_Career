import {queueKboFirstCampNotices} from './kbo-preseason.js';
import type {KboPreseasonPlan} from './kbo-preseason.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertCareerKboSigning} from './career-kbo.js';
import {assertKboAmateurYearEnd, type KboAmateurYearEnd} from './kbo-entry.js';
import type {KboRosterWorld} from './kbo-world.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import type {KboRookieSigning} from './kbo-draft.js';
import {createSeasonCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import type {SeasonGrowthLedger} from './growth-ledger.js';
import type {HealthLedger} from './health.js';
import type {RecordLedger} from './records.js';
import type {CareerDevelopmentLedger} from './high-school-training.js';
import type {CareerTraitLedger} from './high-school-traits.js';
import type {RelationshipLedger} from './relationships.js';
import type {EventInstance} from './events.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';

export interface ActiveKboRosterWorld extends Omit<KboRosterWorld,'status'> {status:'ACTIVE';calendar:SeasonCalendar}
/** New pro root: never pass this world to HS/COLLEGE commands. Scheduling and games follow separately. */
export interface KboCareer {
 schemaVersion:1;revision:number;difficulty:HighSchoolCareer['difficulty'];world:ActiveKboRosterWorld;
 protagonistKey:string;protagonistClubId:string;phaseContext:{phase:'PRESEASON_SETUP'};
 activation:{receiptKey:string;sourceYearEndReceiptKey:string;sourceRevision:number;contractKey:string};
 registration:{playerKey:string;clubId:string;seasonKey:string;status:'ACTIVE';firstTeam:false};
 rights:KboRookieSigning['rights'];amateurHistory:HighSchoolCareer;
 records:RecordLedger;health:HealthLedger;seasonGrowth:SeasonGrowthLedger;development:CareerDevelopmentLedger;
 traits?:CareerTraitLedger;relationships:RelationshipLedger;events:readonly EventInstance[];relationNotices:readonly EventInstance[];
 styleUsedWindows:readonly string[];planHistory:HighSchoolCareer['planHistory'];
 campNotices?:readonly EventInstance[];preseasonPlan?:KboPreseasonPlan;
}
function entryKey(ready:KboAmateurYearEnd){return JSON.stringify(['kbo-season-entry',ready.receiptKey]);}
/** One atomic result consumes the frozen reservation once. Replaying the same old source is deterministic;
 * persistence must compare the source revision before replacing the school root with this pro root. */
export function startSignedKboCareer(source:HighSchoolCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);const ready=assertKboAmateurYearEnd(source),recruitment=assertCareerKboSigning(source),signing=recruitment.program.signing!;
 if(source.events.some(e=>e.status==='OPEN') || !source.development)throw new RangeError('KBO_ENTRY_NOT_READY');
 const year=Number(signing.registration.seasonKey),calendar=createSeasonCalendar(year),key=source.world.protagonistKey;
 if(signing.registration.seasonKey!==String(year) || year!==source.world.calendar!.year+1 || signing.registration.playerKey!==key || Object.values(source.records.games).some(g=>g.scope.seasonKey===String(year)))throw new RangeError('KBO_ENTRY_SEASON_CONFLICT');
 const player={...structuredClone(source.world.players[key]!),age:source.world.players[key]!.age+1,fatigue:0};
 const world:ActiveKboRosterWorld={...structuredClone(recruitment.world),status:'ACTIVE',calendar};
 const club=world.clubs.find(c=>c.id===signing.registration.clubId);if(!club || Object.hasOwn(world.players,key) || Object.hasOwn(world.contracts,key) || club.reservedSalaryWon!==signing.reservedSalaryBeforeWon || club.firstTeam.includes(key))throw new RangeError('KBO_RESERVATION_ALREADY_APPLIED');
 world.players[key]=player;world.contracts[key]=structuredClone(signing.contract);club.roster=[...signing.rosterAfter];club.reservedSalaryWon=signing.reservedSalaryAfterWon;
 const oldBook=schoolYearEndRepertoire(source,key);if(oldBook)world.repertoires[key]={...structuredClone(oldBook),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 assertKboRecruitmentWorld(world);
 const registration={...structuredClone(signing.registration),status:'ACTIVE' as const},teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:'KBO',protagonistKey:key,protagonistSchoolId:club.id,schools:world.clubs,players:world.players};
 const day=calendar.growthDays[0]!,relationships=formRegisteredTeamTeammate(source.relationships,teamWorld,signing.receiptKey,day);
 const career:KboCareer={schemaVersion:1,revision:source.revision+1,difficulty:source.difficulty,world,protagonistKey:key,protagonistClubId:club.id,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey:entryKey(ready),sourceYearEndReceiptKey:ready.receiptKey,sourceRevision:source.revision,contractKey:signing.contract.contractKey},registration,rights:structuredClone(signing.rights),amateurHistory:structuredClone(source),records:structuredClone(source.records),health:{...structuredClone(source.health),injuries:Object.hasOwn(source.health.injuries,key)?{[key]:structuredClone(source.health.injuries[key]!)}:{}},seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(source.development),seasonStartPlayer:structuredClone(player)},...(source.traits?{traits:{...structuredClone(source.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey}}:{}),relationships,events:structuredClone(source.events),relationNotices:structuredClone(source.relationNotices??[]),styleUsedWindows:[...source.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}]};
 career.relationNotices=queueRelationFormationNotices({...career,world:teamWorld,previousSeasons:[...(source.previousSeasons??[]),{world:source.world}]},day)??[];
 career.campNotices=queueKboFirstCampNotices(career);return career;
}

/** Public entry receipt, not the raw pro root containing P, RNG and the full sealed amateur history. */
export function kboCareerEntryView(source:KboCareer){
 const key=source.protagonistKey,club=source.world.clubs.find(c=>c.id===source.protagonistClubId),player=source.world.players[key],contract=source.world.contracts[key],r=source.registration;
 if(source.schemaVersion!==1 || source.world.status!=='ACTIVE' || source.phaseContext.phase!=='PRESEASON_SETUP' || r.firstTeam!==false || !player || !contract || !club || !club.roster.includes(key) || club.firstTeam.includes(key) || r.status!=='ACTIVE' || r.playerKey!==key || r.clubId!==club.id || r.seasonKey!==source.world.seasonKey || source.activation.contractKey!==contract.contractKey)throw new RangeError('INVALID_KBO_ENTRY_VIEW');
 return {seasonKey:source.world.seasonKey,player:{name:player.name,age:player.age,kind:player.kind,position:player.position},club:{id:club.id,name:club.name},registration:{status:'ACTIVE' as const,firstTeam:false as const},contract:{years:contract.years,annualSalaryWon:contract.annualSalaryWon,signingBonusWon:contract.signingBonusWon,currency:'KRW' as const},phase:'PRESEASON_SETUP' as const};
}
