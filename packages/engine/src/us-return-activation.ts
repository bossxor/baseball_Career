import type {UsAmateurReturnCareer} from './us-amateur-return-career.js';
import type {UsAmateurReturnRetryArchive} from './us-return-retry.js';
import type {PreparationSeason} from './preparation-season.js';
import type {UsCareer} from './us-career-entry.js';
import type {RetryCareerLedger} from './retry-career.js';
import type {RecordLedger} from './records.js';
import type {KboCareer,ActiveKboRosterWorld} from './kbo-career-entry.js';
import {kboCareerEntryView} from './kbo-career-entry.js';
import {canonicalJson} from './game.js';
import {assertKboDraft,assertKboRecruitmentWorld} from './kbo-draft.js';
import {createSeasonCalendar} from './season-calendar.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {queueKboFirstCampNotices} from './kbo-preseason.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';

/** Merge complete immutable US/service history with the latest independent owner, never overwrite a conflicting row. */
export function mergeUsReturnRecords(origin:UsAmateurReturnCareer,owner:PreparationSeason|UsCareer):RecordLedger {
 const games:RecordLedger['games']={};
 for(const ledger of [origin.source.records,origin.service?.records,origin.preparation?.records,owner.records]){
  if(!ledger)continue;if(ledger.revision>owner.records.revision)throw new RangeError('US_RETURN_RECORD_REVISION_CHANGED');
  for(const [key,row]of Object.entries(ledger.games)){if(games[key]&&canonicalJson(games[key])!==canonicalJson(row))throw new RangeError('US_RETURN_RECORD_COLLISION');games[key]=row;}
 }
 return {revision:owner.records.revision,games:structuredClone(games)};
}
/** Both validated return owners use this actual roster/contract/rights writer. Not a public world-input API. */
export function activateReturnedUsKbo(input:{origin:UsAmateurReturnCareer;owner:PreparationSeason|UsCareer;draft:NonNullable<UsAmateurReturnCareer['draft']>;retry:RetryCareerLedger;revision:number;retryArchive?:UsAmateurReturnRetryArchive}):KboCareer {
 const {origin:s,owner,draft,retry,revision:n}=input;assertKboDraft(draft.world,draft.program);const signing=draft.program.signing,key=s.return.playerKey,last=owner.world.players[key];
 if(draft.program.decision!=='SIGNED'||!signing||!last||!owner.seasonGrowth.finalized||canonicalJson(draft.program.input.player)!==canonicalJson(last))throw new RangeError('US_RETURN_SIGNED_DRAFT_REQUIRED');
 const year=Number(signing.registration.seasonKey),calendar=createSeasonCalendar(year,'calendar-2'),player={...structuredClone(last),age:last.age+1,fatigue:0},world:ActiveKboRosterWorld={...structuredClone(draft.world),status:'ACTIVE',calendar},club=world.clubs.find(c=>c.id===signing.registration.clubId)!;
 if(year!==Number(owner.world.seasonKey)+1||Object.hasOwn(world.players,key)||!club||club.reservedSalaryWon!==signing.reservedSalaryBeforeWon)throw new RangeError('US_RETURN_DRAFT_RESERVATION_CHANGED');
 world.players[key]=player;world.contracts[key]=structuredClone(signing.contract);club.roster=[...signing.rosterAfter];club.reservedSalaryWon=signing.reservedSalaryAfterWon;
 const book=owner.world.repertoires[key]??s.source.world.repertoires[key];if(book)world.repertoires[key]={...structuredClone(book),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};assertKboRecruitmentWorld(world);
 const records=mergeUsReturnRecords(s,owner),health={...structuredClone(owner.health),injuries:Object.hasOwn(owner.health.injuries,key)?{[key]:structuredClone(owner.health.injuries[key]!)}:{}},receiptKey=input.retryArchive?JSON.stringify(['us-return-retry-kbo',input.retryArchive.entryReceipt,signing.receiptKey]):JSON.stringify(['us-amateur-return-kbo',s.return.returnId,signing.receiptKey]);
 if(Object.values(records.games).some(g=>g.scope.seasonKey===world.seasonKey))throw new RangeError('US_RETURN_KBO_SEASON_CONFLICT');
 const teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:'KBO',protagonistKey:key,protagonistSchoolId:club.id,schools:world.clubs,players:world.players},relationships=formRegisteredTeamTeammate(owner.relationships??s.source.relationships,teamWorld,receiptKey,calendar.growthDays[0]!);
 const c:KboCareer={schemaVersion:1,revision:n+1,difficulty:s.source.difficulty,world,protagonistKey:key,protagonistClubId:club.id,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey,sourceYearEndReceiptKey:signing.receiptKey,sourceRevision:n,contractKey:signing.contract.contractKey},registration:{...signing.registration,status:'ACTIVE'},rights:structuredClone(signing.rights),amateurHistory:structuredClone(s.source.amateurHistory),usAmateurReturnHistory:structuredClone(s),records,health,seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(owner.development),seasonStartPlayer:structuredClone(player)},relationships,events:[...s.source.events.filter(e=>!s.events.some(current=>current.eventKey===e.eventKey)),...s.events],relationNotices:structuredClone(s.source.relationNotices),styleUsedWindows:[...owner.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],retryCareer:structuredClone(retry),military:{status:s.return.militaryStatus==='COMPLETED'?'COMPLETED':'NOT_APPLICABLE',applications:[]}};
 if(input.retryArchive)c.usAmateurReturnRetryHistory=structuredClone(input.retryArchive);
 if(owner.traits)c.traits={...structuredClone(owner.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};if(s.source.achievements)c.achievements=structuredClone(s.source.achievements);if(s.source.aliases)c.aliases=structuredClone(s.source.aliases);if(s.source.recordCorrections)c.recordCorrections=structuredClone(s.source.recordCorrections);
 c.campNotices=queueKboFirstCampNotices(c);kboCareerEntryView(c);return c;
}
