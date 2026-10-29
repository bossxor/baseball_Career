import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import {kboNationalCandidates} from './kbo-national-selection.js';
import {nationalCandidateEligible} from './national-selection.js';
import type {NationalCandidate} from './national-selection.js';
import type {RecordLedger} from './records.js';
import {canonicalJson} from './game.js';
import {HIGH_SCHOOLS} from './high-school-world.js';

export interface NationalCareerSources {
 worldKey:string;seasonKey:string;
 kbo:KboCareer;kboRevision:number;us:UsCareer;usRevision:number;
 /** Caller-owned revision of this read projection, never either career's persisted ledger revision. */
 recordProjectionRevision:number;
}
export interface NationalCandidateProjection {
 worldKey:string;seasonKey:string;seed:string;candidates:NationalCandidate[];records:RecordLedger;
 sources:{kboRevision:number;usRevision:number;kboRecordRevision:number;usRecordRevision:number};
}

/** Read-only adapter: the persistence caller supplies both current roots under its revision check. */
export function nationalUsCandidates(input:NationalCareerSources):NationalCandidateProjection {
 const {kbo,us,worldKey,seasonKey}=input;
 if(!worldKey||!/^\d{4}$/.test(seasonKey)||[kbo.world,us.world].some(w=>w.worldKey!==worldKey||w.seasonKey!==seasonKey)||kbo.world.seed!==us.world.seed)throw new RangeError('NATIONAL_SOURCE_WORLD_MISMATCH');
 if(!Number.isSafeInteger(input.kboRevision)||input.kboRevision<1||input.kboRevision!==kbo.revision||!Number.isSafeInteger(input.usRevision)||input.usRevision<1||input.usRevision!==us.revision)throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
 if(!Number.isSafeInteger(input.recordProjectionRevision)||input.recordProjectionRevision<0||[kbo.records,us.records].some(r=>!Number.isSafeInteger(r.revision)||r.revision<0||r.revision>input.recordProjectionRevision))throw new RangeError('INVALID_NATIONAL_RECORD_PROJECTION');
 const candidates=kboNationalCandidates(kbo),keys=new Set(candidates.map(c=>c.player.simulationKey));
 if(keys.size!==candidates.length)throw new RangeError('NATIONAL_PLAYER_SOURCE_CONFLICT');
 const key=us.protagonistKey,history=us.amateurHistory,player=us.world.players[key];
 if(!player||player.simulationKey!==key||history.world.worldKey!==worldKey||history.world.seed!==us.world.seed||history.world.protagonistKey!==key||!history.world.players[key])throw new RangeError('NATIONAL_US_ORIGIN_MISMATCH');
 const schoolWorlds=[history.world,...(history.previousSeasons??[]).map(s=>s.world)];
 const koreanSchool=schoolWorlds.some(w=>w.leagueKey===undefined&&w.worldKey===worldKey&&w.seed===us.world.seed&&w.protagonistKey===key&&w.players[key]?.simulationKey===key&&HIGH_SCHOOLS.some(s=>s.id===w.protagonistSchoolId)&&w.schools.some(s=>s.id===w.protagonistSchoolId&&s.roster.includes(key)));
 // shortcut: only the verified Korean-school protagonist has US nationality evidence; add NPCs after nationality generation exists.
 if(koreanSchool){
  const r=us.registration,org=us.world.organizations.find(o=>o.id===us.protagonistOrganizationId);
  if(us.mode!=='US_CAREER'||r.playerKey!==key||r.seasonKey!==seasonKey||r.clubId!==org?.id||!['MLB','AAA','AA','A','ROOKIE'].includes(r.level)||!['ACTIVE','INJURED'].includes(r.status)||!(r.status==='ACTIVE'?org?.levels[r.level]?.includes(key):us.world.reserves?.[r.clubId]?.includes(key))||us.contract.status!=='ACTIVE'||us.contract.seasonKey!==seasonKey||typeof us.contract.nationalReleaseAllowed!=='boolean'||!['UNRESOLVED','FROZEN_SERVICE','TERMINATED_SERVICE','ATHLETE_ELIGIBLE','ATHLETE_SERVICE','COMPLETED','NOT_APPLICABLE'].includes(us.military.status))throw new RangeError('INVALID_NATIONAL_US_SOURCE');
  if(keys.has(key))throw new RangeError('NATIONAL_PLAYER_SOURCE_CONFLICT');
  const candidate:NationalCandidate={player,nationalTeamId:'nationalTeamId' in player?String(player.nationalTeamId):'KOR',league:r.level,injured:r.status==='INJURED'||Object.hasOwn(us.health.injuries,key),retired:us.phaseContext.phase==='ARCHIVED',nationalReleaseAllowed:us.contract.nationalReleaseAllowed,service:['FROZEN_SERVICE','TERMINATED_SERVICE'].includes(us.military.status)?'ACTIVE':'NONE',militaryUnresolved:us.military.status==='UNRESOLVED',recentTopLeagueRecord:false};
  nationalCandidateEligible(candidate,'AG');candidates.push(candidate);
 }
 const games:RecordLedger['games']=Object.create(null) as RecordLedger['games'];
 for(const ledger of [kbo.records,us.records])for(const [gameKey,game]of Object.entries(ledger.games)){
  if(game.gameKey!==gameKey)throw new RangeError('INVALID_NATIONAL_RECORD_SOURCE');
  if(Object.hasOwn(games,gameKey)&&canonicalJson(games[gameKey])!==canonicalJson(game))throw new RangeError('NATIONAL_RECORD_SOURCE_CONFLICT');
  if(!Object.hasOwn(games,gameKey))games[gameKey]=structuredClone(game);
 }
 return {worldKey,seasonKey,seed:kbo.world.seed,candidates:structuredClone(candidates),records:{revision:input.recordProjectionRevision,games},sources:{kboRevision:kbo.revision,usRevision:us.revision,kboRecordRevision:kbo.records.revision,usRecordRevision:us.records.revision}};
}
