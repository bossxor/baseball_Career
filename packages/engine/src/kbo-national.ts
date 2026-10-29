import type {NationalSelectionSnapshot} from './national-selection.js';
import {replaceNationalSelectionPlayer} from './national-selection.js';
import {createWorldEvent,eventDefinition,resolveEventChoice,completeBlockingEvent,validateEvent,cancelInvalidEvent} from './events.js';
import type {EventInstance} from './events.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {KboMilitaryStatus} from './kbo-military-state.js';
import {nationalCalendarWindow,nationalInviteDeadlines} from './national-bracket.js';
import type {NationalBracket} from './national-bracket.js';
import {auditCareerNationalDays} from './national-day-audit.js';

export type NationalTournament='WBC'|'OLY'|'AG'|'P12';
export type NationalMedal='GOLD'|'SILVER'|'BRONZE'|null;
export interface NationalCompetitionResult {
 competitionId:string;tournament:NationalTournament;seasonKey:string;medal:NationalMedal;finalRank:number;
 officialAppearance:boolean;registered:boolean;resultVersion:1;gameKeys?:readonly string[];
}
export interface NationalBenefitReceipt {
 benefitKey:string;competitionId:string;benefitType:'ATHLETE_ELIGIBLE';appliedRevision:number;resultVersion:1;
}
export interface NationalCallup {
 selectionId:string;tournament:NationalTournament;seasonKey:string;invitationVersion:1;status:'INVITED'|'ACCEPTED'|'DECLINED';
 militaryEffect:boolean;selectionSnapshotId?:string;
 /** Optional sealed schedule from nationalInviteDeadlines; legacy invites omit these. */
 inviteDay?:number;responseDeadlineDay?:number;finalRosterDay?:number;
}
export interface NationalLedger {
 /** A US-owned tournament returns evidence without moving US identities or health RNG into the host. */
 hostReturns?:readonly NationalHostReturn[];
 selections?:readonly NationalSelectionSnapshot[];
 brackets?:readonly NationalBracket[];
 invitations:readonly NationalCallup[];competitions:readonly NationalCompetitionResult[];benefits:readonly NationalBenefitReceipt[];
 athleteDutySeasonsRemaining?:number;
 athleteDutyStartSeasonKey?:string;athleteDutySettledSeasons?:readonly string[];
 returnedCompetitions?:readonly string[];eligibilityReviews?:readonly string[];
}
export interface NationalHostReturn {
 competitionId:string;owner:'US'|'COLLEGE';sourceKboRevision:number;sourceOwnerRevision:number;
 kboPlayerKeys:readonly string[];ownerPlayerKeys:readonly string[];
 ownerHealthGames:import('./health.js').HealthLedger['games'];
 recordGameKeys:readonly string[];fatigueDays:readonly number[];pitchXpKeys:readonly string[];
}

/** AG gold or any OLY medal qualifies only with a real appearance while still unresolved/pending. WBC/P12 never qualify. */
export function nationalAthleteEligible(result:NationalCompetitionResult,status:KboMilitaryStatus):boolean {
 if(!validNationalResult(result))throw new RangeError('INVALID_NATIONAL_RESULT');
 if(!result.registered||!result.officialAppearance)return false;
 if(!['UNRESOLVED','APPLICATION_PENDING'].includes(status))return false;
 if(result.tournament==='AG')return result.medal==='GOLD';
 if(result.tournament==='OLY')return result.medal==='GOLD'||result.medal==='SILVER'||result.medal==='BRONZE';
 return false;
}

function ledger(c:KboCareer):NationalLedger {
 return c.national??{invitations:[],competitions:[],benefits:[]};
}

/** Server-only legacy invitation adapter; new selection UI uses openKboNationalSelection. Opens one S24 invitation. WBC/P12 have no military effect flag. */
export function openNationalCallup(c:KboCareer,revision:number,tournament:NationalTournament):KboCareer {
 assertKboCareerRevision(c,revision);
 if(c.phaseContext.phase==='INTERNATIONAL_PROGRESS'||c.phaseContext.phase==='INTERNATIONAL_REVIEW')throw new RangeError('NATIONAL_CALLUP_INELIGIBLE');
 const selectionId=JSON.stringify(['national-callup',c.world.worldKey,c.world.seasonKey,tournament,c.protagonistKey]);
 if(!['WBC','OLY','AG','P12'].includes(tournament))throw new RangeError('INVALID_NATIONAL_TOURNAMENT');
 const cur=ledger(c);if(cur.invitations.some(i=>i.selectionId===selectionId))throw new RangeError('NATIONAL_CALLUP_OPEN');
 if(c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame||Object.hasOwn(c.health.injuries,c.protagonistKey)||['SERVING_ACTIVE'].includes(c.military?.status??'')||['ARCHIVED','RETIRE_CONFIRM'].includes(c.phaseContext.phase))throw new RangeError('NATIONAL_CALLUP_INELIGIBLE');
 const deadlines=nationalInviteDeadlines(nationalCalendarWindow(Number(c.world.seasonKey),tournament));
 const next:KboCareer={...c};next.national={...cur,invitations:[...cur.invitations,{selectionId,tournament,seasonKey:c.world.seasonKey,invitationVersion:1,status:'INVITED',militaryEffect:tournament==='AG'||tournament==='OLY',...deadlines}]};queueNationalEvent(next,'E44',selectionId,'INVITATION');next.revision++;return next;
}

export function respondNationalCallup(c:KboCareer,revision:number,selectionId:string,decision:'ACCEPT'|'DECLINE'):KboCareer {
 assertKboCareerRevision(c,revision);if(!['ACCEPT','DECLINE'].includes(decision))throw new RangeError('INVALID_NATIONAL_DECISION');const cur=ledger(c),invite=cur.invitations.find(i=>i.selectionId===selectionId);
 if(!invite||invite.status!=='INVITED'||invite.seasonKey!==c.world.seasonKey)throw new RangeError('NATIONAL_CALLUP_NOT_OPEN');
 const next:KboCareer={...c};
 if(invite.selectionSnapshotId){const selected=cur.selections?.find(s=>s.selectionId===invite.selectionSnapshotId);if(!selected||!selected.roster.slots.some(s=>s.playerKey===c.protagonistKey))throw new RangeError('NATIONAL_SELECTION_CHANGED');if(decision==='DECLINE')next.national={...cur,selections:cur.selections!.map(s=>s.selectionId===selected.selectionId?replaceNationalSelectionPlayer(s,c.protagonistKey,new Set(Object.keys(c.health.injuries)),'DECLINED'):s)};}
 next.national={...(next.national??cur),invitations:cur.invitations.map(i=>i.selectionId===selectionId?{...i,status:decision==='ACCEPT'?'ACCEPTED':'DECLINED'}:i)};const event=next.events.find(e=>e.definitionId==='E44'&&e.evidence.fields.competitionId===selectionId&&e.status==='OPEN');if(event)closeNationalTask(next,event,decision==='ACCEPT'?'ACCEPT_NATIONAL':'DECLINE_NATIONAL',selectionId);next.revision++;return next;
}

/** Server-only adapter for trusted competition reducers, never accept a client-provided medal. Seals one competition result. ATHLETE_ELIGIBLE at most once per competition; never COMPLETED here. */
export function sealNationalCompetitionResult(c:KboCareer,revision:number,result:NationalCompetitionResult):KboCareer {
 assertKboCareerRevision(c,revision);
 const live=c.national?.brackets?.find(b=>b.competitionId===result.competitionId&&b.dayCloseVersion===1);
 if(live){
  if(c.phaseContext.phase!=='INTERNATIONAL_REVIEW'||c.phaseContext.competitionId!==live.competitionId||live.dayReceipts?.length!==live.window.endDay-live.window.startDay)throw new RangeError('NATIONAL_RESULT_NOT_READY');
  auditCareerNationalDays(c);
 }
 if(!validNationalResult(result)||result.seasonKey!==c.world.seasonKey)throw new RangeError('INVALID_NATIONAL_RESULT');
 if(result.gameKeys!==undefined){if(result.competitionId!==JSON.stringify(['national-'+result.tournament.toLowerCase(),c.world.worldKey,c.world.seasonKey])||!Array.isArray(result.gameKeys)||!result.gameKeys.length||new Set(result.gameKeys).size!==result.gameKeys.length||result.gameKeys.some(k=>!c.records.games[k]||c.records.games[k]!.scope.phase!=='INTERNATIONAL'||c.records.games[k]!.scope.leagueKey!==result.tournament||c.records.games[k]!.scope.seasonKey!==result.seasonKey)||result.officialAppearance!==result.gameKeys.some(k=>(c.records.games[k]!.batting[c.protagonistKey]?.PA??0)+(c.records.games[k]!.pitching[c.protagonistKey]?.BF??0)>0))throw new RangeError('INVALID_NATIONAL_GAME_EVIDENCE');}
 const cur=ledger(c);if(cur.competitions.some(x=>x.competitionId===result.competitionId))throw new RangeError('NATIONAL_RESULT_ALREADY_SEALED');
 const next:KboCareer={...c};const status=(next.military?.status??'UNRESOLVED') as KboMilitaryStatus;
 const benefits=[...cur.benefits];
 if(nationalAthleteEligible(result,status)){
  const benefitKey=JSON.stringify(['national-benefit',result.competitionId,'ATHLETE_ELIGIBLE']);
  if(benefits.some(b=>b.benefitKey===benefitKey))throw new RangeError('NATIONAL_BENEFIT_DUPLICATE');
  benefits.push({benefitKey,competitionId:result.competitionId,benefitType:'ATHLETE_ELIGIBLE',appliedRevision:revision+1,resultVersion:1});
  next.military={...(next.military??{applications:[]}),status:'ATHLETE_ELIGIBLE',applications:next.military?.applications??[]};
 }
 next.national={...cur,invitations:cur.invitations,competitions:[...cur.competitions,structuredClone(result)],benefits,...(cur.athleteDutySeasonsRemaining!==undefined?{athleteDutySeasonsRemaining:cur.athleteDutySeasonsRemaining}:{})};
 if(!live&&result.officialAppearance&&!cur.competitions.some(x=>x.officialAppearance))queueNationalEvent(next,'E46',result.competitionId,'FIRST_APPEARANCE');
 if(benefits.length>cur.benefits.length)queueNationalEvent(next,'E47',result.competitionId,'BENEFIT');
 queueNationalEvent(next,'E48',result.competitionId,'RETURN');next.revision++;return next;
}

/** Offseason: enter the 3-season athlete duty block. Domestic play stays allowed. */
export function confirmAthleteService(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);
 if(c.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 if((c.military?.status??'UNRESOLVED')!=='ATHLETE_ELIGIBLE')throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 if((c.national?.benefits??[]).every(b=>b.benefitType!=='ATHLETE_ELIGIBLE'))throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 if(c.events.some(e=>e.definitionId==='E47'&&e.status==='OPEN'))throw new RangeError('NATIONAL_ELIGIBILITY_REVIEW_REQUIRED');
 if(c.events.some(e=>e.definitionId==='E48'&&e.status==='OPEN'))throw new RangeError('NATIONAL_RETURN_REQUIRED');
 const next:KboCareer={...c};next.military={...next.military!,status:'ATHLETE_SERVICE',applications:next.military!.applications.map(a=>a.decision==='PENDING'?{...a,decision:'DECLINED'}:a)};
 const superseded=new Set(next.military.applications.filter(a=>a.decision==='DECLINED').map(a=>a.eventKey));next.events=next.events.map(e=>e.status==='OPEN'&&(superseded.has(e.eventKey)||['E49','E54'].includes(e.definitionId)&&e.evidence.fields.playerSimulationKey===c.protagonistKey)?cancelInvalidEvent(e,e.version,'ATHLETE_SERVICE_CONFIRMED',{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[]}):e);
next.national={...next.national!,athleteDutySeasonsRemaining:3,athleteDutyStartSeasonKey:String(Number(c.world.seasonKey)+1),athleteDutySettledSeasons:[]};queueDutyNotice(next);next.revision++;return next;
}

/** Close a played full season once. Offseason admission starts with the next full season (21). */
export function advanceAthleteDutySeason(c:KboCareer,playedSeasonKey=c.world.seasonKey):void {
 if(c.military?.status!=='ATHLETE_SERVICE'||!c.national||c.national.athleteDutySeasonsRemaining===undefined)return;
 assertNationalLedger(c.national,c.world.worldKey);
 const n=c.national,left=n.athleteDutySeasonsRemaining!,benefitSeasons=n.benefits.map(b=>n.competitions.find(r=>r.competitionId===b.competitionId)!.seasonKey);
 const start=n.athleteDutyStartSeasonKey??String(Math.min(...benefitSeasons.map(Number))+1),settled=n.athleteDutySettledSeasons??Array.from({length:3-left},(_,i)=>String(Number(start)+i));
 if(!/^\d{4}$/.test(playedSeasonKey))throw new RangeError('INVALID_ATHLETE_DUTY_SEASON');
 if(Number(playedSeasonKey)<Number(start)||settled.includes(playedSeasonKey))return;
 if(c.seasonClose?.seasonKey!==playedSeasonKey||![Number(playedSeasonKey),Number(playedSeasonKey)+1].includes(Number(c.world.seasonKey)))throw new RangeError('ATHLETE_DUTY_SEASON_NOT_CLOSED');
 if(left<1||Number(playedSeasonKey)!==Number(start)+settled.length)throw new RangeError('ATHLETE_DUTY_SEASON_GAP');
 c.national={...n,athleteDutySeasonsRemaining:left-1,athleteDutyStartSeasonKey:start,athleteDutySettledSeasons:[...settled,playedSeasonKey]};
 if(left===1)c.military={...c.military,status:'COMPLETED',completedSeasonKey:playedSeasonKey};
 else queueDutyNotice(c);
}

const TOURNAMENTS=['WBC','OLY','AG','P12'];
function validNationalResult(r:NationalCompetitionResult):boolean {
 return !!r&&r.resultVersion===1&&typeof r.competitionId==='string'&&r.competitionId.length>0&&/^\d{4}$/.test(r.seasonKey)&&TOURNAMENTS.includes(r.tournament)&&typeof r.registered==='boolean'&&typeof r.officialAppearance==='boolean'&&(!r.officialAppearance||r.registered)&&Number.isSafeInteger(r.finalRank)&&r.finalRank>=1&&r.finalRank<=({WBC:20,OLY:6,AG:8,P12:12}[r.tournament])&&(r.medal===null||r.medal==='GOLD'&&r.finalRank===1||r.medal==='SILVER'&&r.finalRank===2||r.medal==='BRONZE'&&r.finalRank===3);
}
export function assertNationalLedger(n:NationalLedger|undefined,worldKey?:string):void {
 if(n===undefined)return;
 if(!n||!Array.isArray(n.invitations)||!Array.isArray(n.competitions)||!Array.isArray(n.benefits)||n.competitions.some(r=>!validNationalResult(r))||new Set(n.competitions.map(r=>r.competitionId)).size!==n.competitions.length)throw new RangeError('INVALID_NATIONAL_LEDGER');
 if(n.invitations.some(i=>!i||!i.selectionId||!TOURNAMENTS.includes(i.tournament)||!/^\d{4}$/.test(i.seasonKey)||i.invitationVersion!==1||!['INVITED','ACCEPTED','DECLINED'].includes(i.status)||i.militaryEffect!==(i.tournament==='AG'||i.tournament==='OLY')||[i.inviteDay,i.responseDeadlineDay,i.finalRosterDay].some(v=>v!==undefined&&!Number.isSafeInteger(v)))||new Set(n.invitations.map(i=>i.selectionId)).size!==n.invitations.length)throw new RangeError('INVALID_NATIONAL_INVITATION');
 if(n.benefits.some(b=>!b||b.benefitType!=='ATHLETE_ELIGIBLE'||b.resultVersion!==1||!Number.isSafeInteger(b.appliedRevision)||b.appliedRevision<1||b.benefitKey!==JSON.stringify(['national-benefit',b.competitionId,'ATHLETE_ELIGIBLE'])||!n.competitions.some(r=>r.competitionId===b.competitionId&&nationalAthleteEligible(r,'UNRESOLVED')))||new Set(n.benefits.map(b=>b.benefitKey)).size!==n.benefits.length)throw new RangeError('INVALID_NATIONAL_BENEFIT');
 if(n.selections!==undefined&&(!Array.isArray(n.selections)||n.selections.some(s=>!s||s.schemaVersion!==1||s.modelVersion!=='national-selection-1'||!s.worldKey||worldKey!==undefined&&s.worldKey!==worldKey||!s.seasonKey||!Array.isArray(s.scores)||!s.roster||!Array.isArray(s.roster.slots)||s.roster.slots.length!==28)||new Set(n.selections.map(s=>s.selectionId)).size!==n.selections.length))throw new RangeError('INVALID_NATIONAL_SELECTION');
 if(n.brackets!==undefined&&(!Array.isArray(n.brackets)||new Set(n.brackets.map(b=>b.competitionId)).size!==n.brackets.length||n.brackets.some(b=>!b||b.schemaVersion!==1||b.modelVersion!=='national-bracket-1'||!b.competitionId||!b.window||worldKey!==undefined&&b.worldKey!==worldKey||!TOURNAMENTS.includes(b.tournament))))throw new RangeError('INVALID_NATIONAL_BRACKET');
 if(n.hostReturns!==undefined){
  if(!Array.isArray(n.hostReturns)||new Set(n.hostReturns.map(r=>r.competitionId)).size!==n.hostReturns.length)throw new RangeError('INVALID_NATIONAL_HOST_RETURN');
  for(const raw of n.hostReturns){const r:NationalHostReturn=raw,b=n.brackets?.find(b=>b.competitionId===r.competitionId),unique=(keys:readonly string[])=>Array.isArray(keys)&&keys.every(k=>typeof k==='string'&&!!k)&&new Set(keys).size===keys.length;
   if(!b||!['US','COLLEGE'].includes(r.owner)||![r.sourceKboRevision,r.sourceOwnerRevision].every(v=>Number.isSafeInteger(v)&&v>0)||![r.kboPlayerKeys,r.ownerPlayerKeys,r.recordGameKeys,r.pitchXpKeys].every(unique)||r.ownerPlayerKeys.some(k=>r.kboPlayerKeys.includes(k))||r.pitchXpKeys.some(k=>!r.kboPlayerKeys.includes(k))||!Array.isArray(r.ownerHealthGames)||r.ownerHealthGames.some(h=>h.evidence.seasonKey!==b.seasonKey||h.evidence.teamKey!==b.tournament+':KOR'||!r.recordGameKeys.includes(h.evidence.gameKey)||h.evidence.roster.some((k:string)=>!r.ownerPlayerKeys.includes(k)))||!Array.isArray(r.fatigueDays)||r.fatigueDays.length!==b.window.endDay-b.window.startDay||r.fatigueDays.some((d,i)=>d!==b.window.startDay+i)||r.recordGameKeys.length!==b.results.length||r.recordGameKeys.some((k,i)=>k!==b.results[i]!.gameKey))throw new RangeError('INVALID_NATIONAL_HOST_RETURN');
  }
 }
 const left=n.athleteDutySeasonsRemaining;
 if(left!==undefined&&(!Number.isSafeInteger(left)||left<0||left>3||n.benefits.length===0))throw new RangeError('INVALID_ATHLETE_DUTY');
 if(n.athleteDutyStartSeasonKey!==undefined&&(!/^\d{4}$/.test(n.athleteDutyStartSeasonKey)||!Array.isArray(n.athleteDutySettledSeasons)||left===undefined||n.athleteDutySettledSeasons.length!==3-left||n.athleteDutySettledSeasons.some((y,i)=>y!==String(Number(n.athleteDutyStartSeasonKey)+i))))throw new RangeError('INVALID_ATHLETE_DUTY');
 for(const ids of [n.returnedCompetitions,n.eligibilityReviews])if(ids!==undefined&&(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!n.competitions.some(r=>r.competitionId===id))))throw new RangeError('INVALID_NATIONAL_RECEIPTS');
}
/** Internal FINAL hook; caller owns the new root. No retroactive debut for legacy earlier appearances. */
export function queueNationalFirstAppearance(c:KboCareer,competitionId:string,gameKey:string):void {
 const key=c.protagonistKey,row=c.records.games[gameKey];
 if(!row||row.scope.phase!=='INTERNATIONAL'||!Object.hasOwn(row.teams,'KOR')||(row.batting[key]?.PA??0)+(row.pitching[key]?.BF??0)===0||c.events.some(e=>e.definitionId==='E46'&&e.evidence.fields.playerSimulationKey===key)||c.national?.competitions.some(r=>r.officialAppearance))return;
 const b=c.national?.brackets?.find(b=>b.competitionId===competitionId&&b.worldKey===c.world.worldKey&&b.seasonKey===row.scope.seasonKey&&b.tournament===row.scope.leagueKey&&b.results.some(r=>r.gameKey===gameKey));
 if(!b)throw new RangeError('INVALID_NATIONAL_APPEARANCE');
 if(Object.values(c.records.games).some(g=>g.gameKey!==gameKey&&g.scope.phase==='INTERNATIONAL'&&(g.batting[key]?.PA??0)+(g.pitching[key]?.BF??0)>0&&(Number(g.scope.seasonKey)<Number(row.scope.seasonKey)||g.scope.seasonKey===row.scope.seasonKey&&g.worldDay<row.worldDay)))return;
 queueNationalEvent(c,'E46',competitionId,'FIRST_APPEARANCE',row.worldDay);
}
function queueNationalEvent(c:KboCareer,id:string,competitionId:string,stage:string,worldDay?:number):void {
 if(id==='E46'&&c.events.some(e=>e.definitionId==='E46'&&e.evidence.fields.playerSimulationKey===c.protagonistKey))return;
 const d=eventDefinition(id),day=worldDay??(c.phaseContext.phase==='INTERNATIONAL_REVIEW'?c.phaseContext.nextWorldDay-1:c.days?.seasonKey===c.world.seasonKey?c.days.days.at(-1)?.day??0:0);
 const event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,competitionId,selectionOrAppearanceStage:stage}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:null,registrationKey:c.protagonistClubId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:day});
 if(!c.events.some(e=>e.eventKey===event.eventKey))c.events=[...c.events,event];
}
function queueDutyNotice(c:KboCareer):void {
 const n=c.national!,d=eventDefinition('E55'),task=JSON.stringify(['athlete-duty',c.protagonistKey,n.athleteDutyStartSeasonKey,n.athleteDutySeasonsRemaining]);
 const event=createWorldEvent({definitionId:'E55',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,serviceTaskIdOrServicePeriodId:task,stage:'DUTY'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:null,registrationKey:c.protagonistClubId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:c.days?.seasonKey===c.world.seasonKey?c.days.days.at(-1)?.day??0:0});
 if(!c.events.some(e=>e.eventKey===event.eventKey))c.events=[...c.events,event];
}
function closeNationalTask(c:KboCareer,e:EventInstance,command:string,receiptKey:string):void {
 const closed=completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey,command},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[command]});c.events=c.events.map(x=>x.eventKey===e.eventKey?closed:x);
}
/** Navigation does not confirm athlete service or consume a season. */
export function resolveKboNationalEvent(c:KboCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 assertKboCareerRevision(c,revision);const e=c.events.find(e=>e.eventKey===input.eventKey);
 if(!e||!['E44','E45','E46','E47','E48','E55'].includes(e.definitionId)||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.seasonKey!==c.world.seasonKey)throw new RangeError('INVALID_NATIONAL_EVENT');
 if(e.definitionId==='E45'&&!c.national?.selections?.some(s=>s.selectionId===e.evidence.fields.competitionId&&!s.roster.slots.some(x=>x.playerKey===c.protagonistKey)))throw new RangeError('NATIONAL_SELECTION_CHANGED');
 validateEvent(e);const picked=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices});
 if(e.definitionId==='E44')return {career:respondNationalCallup(c,revision,String(e.evidence.fields.competitionId),input.command==='ACCEPT_NATIONAL'?'ACCEPT':'DECLINE'),navigation:null};
 if(picked.navigation)return {career:c,navigation:picked.navigation};
 const next={...c,events:c.events.map(x=>x.eventKey===e.eventKey?picked.event:x)};
 if(e.definitionId==='E48'){
  const id=String(e.evidence.fields.competitionId);if(!c.national?.competitions.some(r=>r.competitionId===id)||c.events.some(x=>x.definitionId==='E47'&&x.status==='OPEN'&&x.evidence.fields.competitionId===id))throw new RangeError('NATIONAL_RETURN_NOT_READY');
  if(c.phaseContext.phase==='INTERNATIONAL_REVIEW'){
   const phase=c.phaseContext,b=c.national.brackets?.find(b=>b.competitionId===id);
   auditCareerNationalDays(c);
   if(phase.competitionId!==id||!b||b.dayReceipts?.length!==b.window.endDay-b.window.startDay||phase.nextWorldDay!==b.window.endDay)throw new RangeError('NATIONAL_RETURN_NOT_READY');
   next.phaseContext=phase.resume.phase==='SEASON_PROGRESS'?{...phase.resume,nextWorldDay:b.window.endDay}:structuredClone(phase.resume);
   if(phase.resume.phase==='PRESEASON_SETUP'){
    const fatigue=c.world.players[c.protagonistKey]!.fatigue;
    next.seasonGrowth={...c.seasonGrowth,seasonStart:{...c.seasonGrowth.seasonStart,fatigue}};
    next.development={...c.development,seasonStartPlayer:{...c.development.seasonStartPlayer,fatigue}};
   }
  }
  next.national={...c.national,returnedCompetitions:[...(c.national.returnedCompetitions??[]),id]};closeNationalTask(next,e,input.command,JSON.stringify(['national-return',id]));
 }
 next.revision++;return {career:next,navigation:null};
}
/** S26 eligibility review commits the already-evidenced benefit, independently of offseason duty admission. */
export function confirmNationalEligibility(c:KboCareer,revision:number,competitionId:string):KboCareer {
 assertKboCareerRevision(c,revision);const benefit=c.national?.benefits.find(b=>b.competitionId===competitionId),e=c.events.find(e=>e.definitionId==='E47'&&e.evidence.fields.competitionId===competitionId&&e.status==='OPEN');
 if(!benefit||!e||(c.national?.eligibilityReviews??[]).includes(competitionId))throw new RangeError('NATIONAL_ELIGIBILITY_NOT_OPEN');
 const next={...c,national:{...c.national!,eligibilityReviews:[...(c.national?.eligibilityReviews??[]),competitionId]}};closeNationalTask(next,e,'CONFIRM_SERVICE_ELIGIBILITY',benefit.benefitKey);next.revision++;return next;
}
