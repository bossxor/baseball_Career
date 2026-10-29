import type {UsCareer} from './us-career-entry.js';
import {refreshCareerAchievements} from './career-achievements.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {UsProgress} from './us-season.js';
import {assertUsSeason,settleUsSalaryDay} from './us-season.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {NationalLedger,NationalTournament,NationalCompetitionResult} from './kbo-national.js';
import {assertNationalLedger,nationalAthleteEligible} from './kbo-national.js';
import {returnNationalHost} from './national-host-return.js';
import {nationalUsCandidates} from './national-us-candidates.js';
import type {NationalCareerSources,NationalCandidateProjection} from './national-us-candidates.js';
import {createNationalSelection,assertNationalSelectionSnapshot,nationalLineupBatting,replaceNationalSelectionPlayer} from './national-selection.js';
import type {NationalCandidate,NationalSelectionSnapshot} from './national-selection.js';
import {replaceNationalInjuryWithEmergency} from './national-injury-replacement.js';
import {createNationalBracket,assertNationalBracket,nextNationalMatch,nationalInviteDeadlines,nationalMatchesOnDay,nationalNationPreset,prepareNationalMatch,advanceNationalMatch} from './national-bracket.js';
import type {NationalBracket,NationalTournamentWindow} from './national-bracket.js';
import {koreaNationalTeam,nationalControlTeam} from './national-tournament.js';
import {koreaGameProgress,koreaOutcome} from './national-progress.js';
import {nationalDayEvidence} from './national-day-audit.js';
import {appearanceFatigue} from './lineup.js';
import {settleTeamGameHealth,validateHealthLedger} from './health.js';
import type {HealthLedger,HealthResult} from './health.js';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {Repertoire} from './repertoire.js';
import {validatePitchWeights} from './repertoire.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {validatePitchXpLedger} from './pitch-xp.js';
import type {GamePitchDevelopment,TeamSnapshot,GameState} from './types.js';
import {putGameContribution} from './records.js';
import type {RecordLedger} from './records.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent,resolveEventChoice,validateEvent} from './events.js';
import type {EventInstance} from './events.js';

export type UsNationalResume={phase:'PRESEASON_SETUP'}|UsProgress|{phase:'SEASON_REVIEW'};
export interface UsNationalPhase {phase:'INTERNATIONAL_PROGRESS'|'INTERNATIONAL_REVIEW';competitionId:string;nextWorldDay:number;resume:UsNationalResume}
export interface UsNationalSession {
 competitionId:string;selectionId:string;sources:NationalCandidateProjection['sources'];hostSourceFingerprint:string;sourceRecords:RecordLedger;
 /** The host is pinned until atomic return; it must not run a second domestic/date worker. */
 hostPlayers:Record<string,DevelopmentPlayer>;hostRepertoires:Record<string,Repertoire>;hostHealth:HealthLedger;
 candidates:NationalCandidate[];registeredKeys:string[];
}
export interface UsNationalLedger extends NationalLedger {sessions?:readonly UsNationalSession[]}

const ledger=(c:UsCareer):UsNationalLedger=>c.national??{invitations:[],competitions:[],benefits:[]};
const selectionOf=(c:UsCareer,tournament:NationalTournament)=>ledger(c).selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===tournament);
function replaceSelection(c:UsCareer,s:NationalSelectionSnapshot):void {c.national={...ledger(c),selections:ledger(c).selections!.map(x=>x.selectionId===s.selectionId?s:x)};}
function replaceBracket(c:UsCareer,b:NationalBracket):void {c.national={...ledger(c),brackets:ledger(c).brackets!.map(x=>x.competitionId===b.competitionId?b:x)};}
function sessionOf(c:UsCareer,id:string):UsNationalSession {const s=ledger(c).sessions?.find(s=>s.competitionId===id);if(!s)throw new RangeError('US_NATIONAL_SESSION_REQUIRED');return s;}
function current(c:UsCareer){const p=c.phaseContext;if(p.phase!=='INTERNATIONAL_PROGRESS'&&p.phase!=='INTERNATIONAL_REVIEW')throw new RangeError('US_NATIONAL_NOT_OPEN');const b=ledger(c).brackets?.find(b=>b.competitionId===p.competitionId);if(!b)throw new RangeError('US_NATIONAL_BRACKET_REQUIRED');assertNationalBracket(b);return {phase:p,bracket:b,session:sessionOf(c,b.competitionId)};}
function sourceProjection(c:UsCareer,revision:number,sources:NationalCareerSources){assertUsCareerRevision(c,revision);if(sources.us!==c||sources.usRevision!==revision)throw new RangeError('US_NATIONAL_SOURCE_CHANGED');return nationalUsCandidates(sources);}
function hostFingerprint(c:KboCareer):string {return canonicalJson(c);}
function queueEvent(c:UsCareer,id:string,competitionId:string,stage:string,day:number):void {
 if(id==='E46'&&c.events.some(e=>e.definitionId==='E46'&&e.evidence.fields.playerSimulationKey===c.protagonistKey))return;
 const d=eventDefinition(id),event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,competitionId,selectionOrAppearanceStage:stage}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:null,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:day});
 if(!c.events.some(e=>e.eventKey===event.eventKey))c.events=[...c.events,event];
}
function closeTask(c:UsCareer,e:EventInstance,command:string,receiptKey:string):void {const closed=completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey,command},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[command]});c.events=c.events.map(x=>x.eventKey===e.eventKey?closed:x);}

/** Trusted same-world caller supplies both current roots and the authoritative invitation date. */
export function openUsNationalSelection(c:UsCareer,revision:number,sources:NationalCareerSources,tournament:NationalTournament,worldDay:number,window?:NationalTournamentWindow):UsCareer {
 const projection=sourceProjection(c,revision,sources),draw=createNationalBracket({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,tournament,seed:`${c.world.seed}:national:${tournament}:${c.world.seasonKey}`,...(window?{window}:{})}),deadlines=nationalInviteDeadlines(draw.window);
 if(!['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW'].includes(c.phaseContext.phase)||c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame||!Number.isSafeInteger(worldDay)||worldDay<deadlines.inviteDay||worldDay>deadlines.responseDeadlineDay)throw new RangeError('US_NATIONAL_SELECTION_NOT_AVAILABLE');
 const old=selectionOf(c,tournament);if(old){assertNationalSelectionSnapshot(old);return c;}
 if(sources.kbo.national?.selections?.some(s=>s.seasonKey===c.world.seasonKey&&s.tournament===tournament))throw new RangeError('NATIONAL_TOURNAMENT_HAS_OTHER_OWNER');
 const selection=createNationalSelection({...projection,tournament}),n=ledger(c),next:UsCareer={...c,national:{...n,selections:[...(n.selections??[]),selection]}};
 if(selection.roster.slots.some(s=>s.playerKey===c.protagonistKey)){
  const selectionId=JSON.stringify(['national-callup',c.world.worldKey,c.world.seasonKey,tournament,c.protagonistKey]);
  next.national={...next.national!,invitations:[...n.invitations,{selectionId,tournament,seasonKey:c.world.seasonKey,invitationVersion:1,status:'INVITED',militaryEffect:tournament==='AG'||tournament==='OLY',selectionSnapshotId:selection.selectionId,...deadlines}]};queueEvent(next,'E44',selectionId,'INVITATION',worldDay);
 }else queueEvent(next,'E45',selection.selectionId,'NOT_SELECTED',worldDay);
 next.revision++;return next;
}

export function respondUsNationalCallup(c:UsCareer,revision:number,selectionId:string,decision:'ACCEPT'|'DECLINE',worldDay:number):UsCareer {
 assertUsCareerRevision(c,revision);const n=ledger(c),invite=n.invitations.find(i=>i.selectionId===selectionId),selection=invite?selectionOf(c,invite.tournament):undefined;
 if(!['ACCEPT','DECLINE'].includes(decision)||!invite||invite.status!=='INVITED'||invite.seasonKey!==c.world.seasonKey||!selection||!selection.roster.slots.some(s=>s.playerKey===c.protagonistKey)||!Number.isSafeInteger(worldDay)||worldDay<invite.inviteDay!||worldDay>invite.responseDeadlineDay!)throw new RangeError('US_NATIONAL_CALLUP_NOT_OPEN');
 const next:UsCareer={...c,national:{...n,invitations:n.invitations.map(i=>i.selectionId===selectionId?{...i,status:decision==='ACCEPT'?'ACCEPTED':'DECLINED'}:i)}};
 if(decision==='DECLINE')replaceSelection(next,replaceNationalSelectionPlayer(selection,c.protagonistKey,new Set(Object.keys(c.health.injuries)),'DECLINED'));
 const event=next.events.find(e=>e.definitionId==='E44'&&e.status==='OPEN'&&e.evidence.fields.competitionId===selectionId);if(!event)throw new RangeError('US_NATIONAL_INVITATION_EVENT_REQUIRED');closeTask(next,event,decision==='ACCEPT'?'ACCEPT_NATIONAL':'DECLINE_NATIONAL',selectionId);next.revision++;return next;
}

/** Stops at an unanswered deadline. The caller must run this before advancing its authoritative date. */
export function assertUsNationalResponseDeadline(c:UsCareer,nextDay:number):void {
 if(!Number.isSafeInteger(nextDay))throw new RangeError('INVALID_NATIONAL_DAY');
 if(ledger(c).invitations.some(i=>i.seasonKey===c.world.seasonKey&&i.status==='INVITED'&&nextDay>=i.responseDeadlineDay!))throw new RangeError('NATIONAL_INVITE_RESPONSE_REQUIRED');
}

/** Pins actual source owners. No US identity is inserted into the KBO world. */
export function startUsNationalTournament(c:UsCareer,revision:number,sources:NationalCareerSources,tournament:NationalTournament,window?:NationalTournamentWindow):UsCareer {
 const projection=sourceProjection(c,revision,sources),selection=selectionOf(c,tournament);if(!selection)throw new RangeError('NATIONAL_SELECTION_REQUIRED');assertNationalSelectionSnapshot(selection);
 if(!['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW'].includes(c.phaseContext.phase)||c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame||c.events.some(e=>e.status==='OPEN'))throw new RangeError('US_NATIONAL_TOURNAMENT_NOT_AVAILABLE');
 const bracket=createNationalBracket({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,tournament,seed:`${c.world.seed}:national:${tournament}:${c.world.seasonKey}`,...(window?{window}:{})});
 if(ledger(c).brackets?.some(b=>b.competitionId===bracket.competitionId)||sources.kbo.national?.brackets?.some(b=>b.competitionId===bracket.competitionId)||c.health.closedSeasons.includes(c.world.seasonKey)||sources.kbo.health.closedSeasons.includes(c.world.seasonKey))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_STARTED');
 const invitation=ledger(c).invitations.find(i=>i.selectionSnapshotId===selection.selectionId);
 if(selection.roster.slots.some(s=>s.playerKey===c.protagonistKey)&&invitation?.status!=='ACCEPTED'||invitation?.status==='INVITED')throw new RangeError('NATIONAL_CALLUP_REQUIRED');
 const host=sources.kbo,phase=c.phaseContext;
 if(phase.phase==='PRESEASON_SETUP'&&(tournament!=='WBC'||c.preseasonPlan||c.season)||phase.phase==='SEASON_PROGRESS'&&(phase.nextWorldDay!==bracket.window.startDay||c.season?.days.at(-1)?.day!==bracket.window.startDay-1)||phase.phase==='SEASON_REVIEW'&&(tournament!=='P12'||!c.postseason?.bracket.championKey))throw new RangeError('NATIONAL_CALENDAR_NOT_READY');
 if(tournament==='P12'){
  const last=(root:UsCareer|KboCareer,league:string)=>Math.max(-1,...Object.values(root.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey===league&&g.scope.phase==='POSTSEASON').map(g=>g.worldDay));
  const evidence=bracket.window.evidence?JSON.parse(bracket.window.evidence) as unknown[]:[];
  if(bracket.window.basis!=='P12_POSTSEASON'||!host.postseason?.championKey||evidence[2]!==last(host,'KBO')||evidence[3]!==last(c,'MLB')||last(host,'KBO')<0||last(c,'MLB')<0)throw new RangeError('NATIONAL_PS_END_CHANGED');
 }
 const hostPhase=host.phaseContext;
 if(phase.phase==='SEASON_PROGRESS'&&(hostPhase.phase!=='SEASON_PROGRESS'||hostPhase.pendingGame||hostPhase.nextWorldDay!==bracket.window.startDay||host.days?.days.at(-1)?.day!==bracket.window.startDay-1)||phase.phase==='PRESEASON_SETUP'&&hostPhase.phase!=='PRESEASON_SETUP'||phase.phase==='SEASON_REVIEW'&&hostPhase.phase!=='SEASON_REVIEW')throw new RangeError('US_NATIONAL_HOST_CLOCK_MISMATCH');
 const scheduled=[...Object.values(c.seasonSchedule?.leagues??{}).flat(),...Object.values(host.competitionSchedule?.leagues??{}).flat()];
 if(scheduled.some(g=>g.worldDay>=bracket.window.startDay&&g.worldDay<bracket.window.endDay))throw new RangeError('NATIONAL_DOMESTIC_COLLISION');
 if([c.health,host.health].some(h=>h.games.some(g=>g.evidence.seasonKey===c.world.seasonKey&&g.evidence.day>=bracket.window.startDay)))throw new RangeError('NATIONAL_HEALTH_CLOCK_AHEAD');
 const members={...host.sangmu?.emergency?.entries,...host.sangmu?.members},hostPlayers={...host.world.players,...Object.fromEntries(Object.entries(members).map(([k,m])=>[k,m.player]))},hostRepertoires={...host.world.repertoires,...Object.fromEntries(Object.entries(members).filter(([,m])=>m.repertoire).map(([k,m])=>[k,m.repertoire!]))};
 if(Object.keys(hostPlayers).some(k=>Object.hasOwn(c.world.players,k)))throw new RangeError('NATIONAL_PLAYER_SOURCE_CONFLICT');
 const session:UsNationalSession={competitionId:bracket.competitionId,selectionId:selection.selectionId,sources:projection.sources,hostSourceFingerprint:hostFingerprint(host),sourceRecords:projection.records,hostPlayers:structuredClone(hostPlayers),hostRepertoires:structuredClone(hostRepertoires),hostHealth:structuredClone(host.health),candidates:projection.candidates,registeredKeys:[]};
 const unavailable=new Set([...Object.keys(c.health.injuries),...Object.keys(host.health.injuries)]);let repaired=selection;
 for(const slot of selection.roster.slots)if(unavailable.has(slot.playerKey))repaired=replaceNationalInjuryWithEmergency({...projection,selection:repaired},slot.playerKey,unavailable);
 session.registeredKeys=repaired.roster.slots.map(s=>s.playerKey);
 bracket.dayCloseVersion=1;bracket.dayReceipts=[];bracket.fatigueSettledDays=[];
 const next:UsCareer={...c,national:{...ledger(c),brackets:[...(ledger(c).brackets??[]),bracket],sessions:[...(ledger(c).sessions??[]),session]},phaseContext:{phase:'INTERNATIONAL_PROGRESS',competitionId:bracket.competitionId,nextWorldDay:bracket.window.startDay,resume:structuredClone(phase as UsNationalResume)}};
 replaceSelection(next,repaired);next.revision++;return next;
}

function teamContext(c:UsCareer,s:UsNationalSession){return {world:{seasonKey:c.world.seasonKey,players:{...s.hostPlayers,...c.world.players},repertoires:{...s.hostRepertoires,...c.world.repertoires}},health:{...c.health,injuries:{...s.hostHealth.injuries,...c.health.injuries}},records:{revision:Math.max(c.records.revision,s.sourceRecords.revision),games:{...s.sourceRecords.games,...c.records.games}}};}
function pitchDevelopment(c:UsCareer,s:UsNationalSession,teams:readonly [TeamSnapshot,TeamSnapshot]):GamePitchDevelopment {
 const players:GamePitchDevelopment['players']=Object.create(null),mastery=[0,100000,300000,600000,1000000,1500000],books={...s.hostRepertoires,...c.world.repertoires};
 for(const p of teams.flatMap(t=>t.pitchers)){const real=books[p.simulationKey];players[p.simulationKey]={repertoire:real?structuredClone(real):{book:Object.fromEntries(p.repertoire.map(e=>[e.pitchId,mastery[e.mastery]!])),weights:Object.fromEntries(p.repertoire.map(e=>[e.pitchId,e.weight])),ledger:emptyPitchXpLedger(),seasonId:c.world.seasonKey,usedWindows:[],learning:null},numerator:p.simulationKey===c.protagonistKey?(c.difficulty==='SECRET_CHEAT'?15:5):c.difficulty==='REALISTIC'?6:5};}
 return {seasonKey:c.world.seasonKey,players};
}

export function prepareUsNationalMatch(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);auditUsNationalDays(c);const {phase,bracket,session}=current(c),m=nextNationalMatch(bracket);
 if(phase.phase!=='INTERNATIONAL_PROGRESS'||!m||m.day!==phase.nextWorldDay||bracket.pendingGame)throw new RangeError('NATIONAL_DAY_CLOSE_REQUIRED');
 const next:UsCareer={...c},progress=koreaGameProgress(bracket);let selection=selectionOf(c,bracket.tournament)!;
 if((m.away==='KOR'||m.home==='KOR')&&(progress.count===0||progress.lastStage!==m.stage)){
  const context=teamContext(c,session),unavailable=new Set(Object.keys(context.health.injuries));
  const candidates=session.candidates.map(candidate=>({...candidate,player:context.world.players[candidate.player.simulationKey]!,injured:unavailable.has(candidate.player.simulationKey)}));
  for(const slot of selection.roster.slots)if(unavailable.has(slot.playerKey))selection=replaceNationalInjuryWithEmergency({selection,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,records:context.records,candidates},slot.playerKey,unavailable);
  replaceSelection(next,selection);
  next.national={...next.national!,sessions:next.national!.sessions!.map(s=>s.competitionId===session.competitionId?{...s,registeredKeys:[...new Set([...(progress.count===0?[]:s.registeredKeys),...selection.roster.slots.map(slot=>slot.playerKey)])]}:s)};
 }
 const context=teamContext(c,session),team=(id:string)=>id==='KOR'?koreaNationalTeam(context,selection,progress.count,nationalLineupBatting(context.records,selection),m.day):nationalControlTeam(id,nationalNationPreset(bracket.tournament).find(n=>n.id===id)!.strength);
 const teams:[TeamSnapshot,TeamSnapshot]=[team(m.away),team(m.home)];replaceBracket(next,prepareNationalMatch(bracket,teams,pitchDevelopment(c,session,teams)));next.revision++;return next;
}

function commitPitchXp(c:UsCareer,s:UsNationalSession,game:GameState):void {
 if(!game.pitchDevelopment)return;c.world={...c.world,repertoires:{...c.world.repertoires}};
 const hostRepertoires={...s.hostRepertoires};
 for(const [key,entry]of Object.entries(game.pitchDevelopment.players)){if(Object.hasOwn(c.world.repertoires,key))c.world.repertoires[key]=structuredClone(entry.repertoire);else if(Object.hasOwn(hostRepertoires,key))hostRepertoires[key]=structuredClone(entry.repertoire);}
 c.national={...ledger(c),sessions:ledger(c).sessions!.map(x=>x.competitionId===s.competitionId?{...s,hostRepertoires}:x)};
}
export function advanceUsNationalMatch(c:UsCareer,revision:number,maxPlateAppearances=1000):{career:UsCareer;stopReason:'CHUNK_LIMIT'|'ENGINE_LIMIT'|'GAME_FINAL'} {
 assertUsCareerRevision(c,revision);auditUsNationalDays(c);const {phase,bracket,session}=current(c);
 if(phase.phase!=='INTERNATIONAL_PROGRESS'||!bracket.pendingGame||nextNationalMatch(bracket)?.day!==phase.nextWorldDay)throw new RangeError('NATIONAL_GAME_NOT_PENDING');
 const out=advanceNationalMatch(bracket,maxPlateAppearances),next:UsCareer={...c};replaceBracket(next,out.bracket);
 if(!out.contribution||!out.finalGame){next.revision++;return {career:next,stopReason:out.stopReason==='ENGINE_LIMIT'?'ENGINE_LIMIT':'CHUNK_LIMIT'};}
 if(Object.hasOwn(c.records.games,out.contribution.gameKey))throw new RangeError('NATIONAL_GAME_ALREADY_RECORDED');next.records=putGameContribution(c.records,out.contribution).ledger;commitPitchXp(next,session,out.finalGame);
 const row=out.contribution,key=c.protagonistKey;
 if((row.batting[key]?.PA??0)+(row.pitching[key]?.BF??0)>0&&!Object.values(c.records.games).some(g=>g.scope.phase==='INTERNATIONAL'&&(g.batting[key]?.PA??0)+(g.pitching[key]?.BF??0)>0))queueEvent(next,'E46',bracket.competitionId,'FIRST_APPEARANCE',row.worldDay);
 if((row.batting[key]?.PA??0)+(row.pitching[key]?.BF??0)>0)Object.assign(next,refreshCareerAchievements(next));
 next.revision++;return {career:next,stopReason:'GAME_FINAL'};
}

export function closeUsNationalDay(c:UsCareer,revision:number,day:number):UsCareer {
 assertUsCareerRevision(c,revision);auditUsNationalDays(c);const {phase,bracket,session}=current(c);
 if(phase.phase!=='INTERNATIONAL_PROGRESS'||!Number.isSafeInteger(day)||day!==phase.nextWorldDay||day>=bracket.window.endDay)throw new RangeError('NATIONAL_DAY_OUT_OF_ORDER');
 const {completed,blocked}=nationalMatchesOnDay(bracket,day);if(blocked)throw new RangeError('NATIONAL_DAY_GAMES_PENDING');
 const selection=selectionOf(c,bracket.tournament)!;assertNationalSelectionSnapshot(selection);const roster=selection.roster.slots.map(s=>s.playerKey).sort(),korea=completed.filter(m=>m.away==='KOR'||m.home==='KOR');
 const next:UsCareer={...c,world:{...c.world,players:{...c.world.players}}},hostPlayers={...session.hostPlayers},result:HealthResult={injured:[],recovered:[]};let hostHealth=session.hostHealth;
 const refresh=(key:string,p:DevelopmentPlayer)=>{let appearance:'NONE'|'HITTER'|'STARTER'|'RELIEF'='NONE';for(const m of roster.includes(key)?korea:[]){const row=c.records.games[m.gameKey]!;if((row.batting[key]?.PA??0)>0)appearance='HITTER';if((row.pitching[key]?.BF??0)>0)appearance=row.pitching[key]!.starts?'STARTER':'RELIEF';}return appearanceFatigue(p,appearance);};
 for(const [key,p]of Object.entries(next.world.players))next.world.players[key]=refresh(key,p);for(const [key,p]of Object.entries(hostPlayers))hostPlayers[key]=refresh(key,p);
 for(const m of korea){const row=c.records.games[m.gameKey]!;
  for(const owner of ['US','KBO'] as const){const players=owner==='US'?next.world.players:hostPlayers,keys=roster.filter(k=>Object.hasOwn(players,k));if(!keys.length)continue;
   const out=settleTeamGameHealth(owner==='US'?next.health:hostHealth,{gameKey:m.gameKey,teamKey:bracket.tournament+':KOR',seasonKey:c.world.seasonKey,day,roster:keys,appearances:keys.filter(k=>(row.batting[k]?.PA??0)+(row.pitching[k]?.BF??0)>0).map(playerKey=>({playerKey,riskFatigue:players[playerKey]!.fatigue}))});
   if(owner==='US')next.health=out.ledger;else hostHealth=out.ledger;result.injured.push(...out.result.injured);result.recovered.push(...out.result.recovered);
  }
 }
 result.injured.sort();result.recovered.sort();const gameKeys=completed.map(m=>m.gameKey),receipt={day,gameKeys,rosterKeys:roster,result};
 replaceBracket(next,{...bracket,dayReceipts:[...bracket.dayReceipts!,receipt],fatigueSettledDays:[...bracket.fatigueSettledDays!,day]});next.national={...next.national!,sessions:next.national!.sessions!.map(s=>s.competitionId===session.competitionId?{...s,hostPlayers,hostHealth}:s)};
 next.phaseContext={...phase,nextWorldDay:day+1};
 if(phase.resume.phase==='SEASON_PROGRESS'){
  assertUsSeason(c,revision);const s=c.season!;if(s.days.at(-1)?.day!==day-1||day<s.firstDay||day>s.lastDay)throw new RangeError('INVALID_US_PROGRESS');
  const key=c.protagonistKey,appearances=korea.reduce((n,m)=>{const row=c.records.games[m.gameKey]!;return n+(c.world.players[key]!.kind==='HITTER'?(row.batting[key]?.PA??0):(row.pitching[key]?.outs??0));},0);
  next.season={...s,days:[...s.days,{day,evidence:nationalDayEvidence(bracket,day,gameKeys,roster),level:c.registration.level,appearances,rehabilitating:Object.hasOwn(c.health.injuries,key),injured:[...result.injured],recovered:[...result.recovered]}]};settleUsSalaryDay(next,day);
 }
 if(day+1===bracket.window.endDay){if(nextNationalMatch(bracket)||bracket.pendingGame)throw new RangeError('NATIONAL_DAY_GAMES_PENDING');next.phaseContext={...phase,phase:'INTERNATIONAL_REVIEW',nextWorldDay:day+1};sealResult(next,bracket,session);}
 next.revision++;auditUsNationalDays(next);return next;
}

function sealResult(c:UsCareer,b:NationalBracket,s:UsNationalSession):void {
 const n=ledger(c),gameKeys=b.results.map(r=>r.gameKey),key=c.protagonistKey,registered=s.registeredKeys.includes(key),officialAppearance=registered&&gameKeys.some(k=>(c.records.games[k]!.batting[key]?.PA??0)+(c.records.games[k]!.pitching[key]?.BF??0)>0);
 if(n.competitions.some(r=>r.competitionId===b.competitionId))throw new RangeError('NATIONAL_RESULT_ALREADY_SEALED');
 const result:NationalCompetitionResult={competitionId:b.competitionId,tournament:b.tournament,seasonKey:b.seasonKey,...koreaOutcome(b),officialAppearance,registered,resultVersion:1,gameKeys},benefits=[...n.benefits];
 if(nationalAthleteEligible(result,c.military.status==='UNRESOLVED'?'UNRESOLVED':'COMPLETED')){const benefitKey=JSON.stringify(['national-benefit',b.competitionId,'ATHLETE_ELIGIBLE']);benefits.push({benefitKey,competitionId:b.competitionId,benefitType:'ATHLETE_ELIGIBLE',appliedRevision:c.revision+1,resultVersion:1});c.military={...c.military,status:'ATHLETE_ELIGIBLE'};queueEvent(c,'E47',b.competitionId,'BENEFIT',b.window.endDay-1);}
 c.national={...ledger(c),competitions:[...n.competitions,result],benefits};queueEvent(c,'E48',b.competitionId,'RETURN',b.window.endDay-1);
}

/** Audits records and both health owners, including JSON-restored pending/daily state. */
export function auditUsNationalDays(c:UsCareer):void {
 assertNationalLedger(c.national,c.world.worldKey);
 for(const b of ledger(c).brackets??[]){const s=sessionOf(c,b.competitionId);assertNationalBracket(b);
  if(b.dayCloseVersion!==1||!Array.isArray(b.dayReceipts)||canonicalJson(b.fatigueSettledDays)!==canonicalJson(b.dayReceipts.map(d=>d.day)))throw new RangeError('INVALID_US_NATIONAL_DAYS');
  for(const [i,d]of b.dayReceipts.entries()){
   if(d.day!==b.window.startDay+i||d.day>=b.window.endDay||d.rosterKeys.length!==28||new Set(d.rosterKeys).size!==28)throw new RangeError('INVALID_US_NATIONAL_DAYS');
   const {completed,blocked}=nationalMatchesOnDay(b,d.day);if(blocked||canonicalJson(d.gameKeys)!==canonicalJson(completed.map(m=>m.gameKey)))throw new RangeError('NATIONAL_DAY_GAMES_PENDING');
   const result:HealthResult={injured:[],recovered:[]};
   for(const m of completed){const row=c.records.games[m.gameKey],r=b.results.find(r=>r.gameKey===m.gameKey)!;
    if(!row||row.gameKey!==m.gameKey||row.worldDay!==d.day||row.scope.seasonKey!==b.seasonKey||row.scope.leagueKey!==b.tournament||row.scope.phase!=='INTERNATIONAL'||Object.keys(row.teams).length!==2||row.teams[m.away]?.R!==r.awayRuns||row.teams[m.home]?.R!==r.homeRuns||row.teams[m.away]?.RA!==r.homeRuns||row.teams[m.home]?.RA!==r.awayRuns||row.teams[r.winner]?.W!==1)throw new RangeError('CHANGED_NATIONAL_GAME_EVIDENCE');
    if(m.away!=='KOR'&&m.home!=='KOR')continue;
    const health=[...c.health.games,...s.hostHealth.games].filter(h=>h.evidence.gameKey===m.gameKey&&h.evidence.teamKey===b.tournament+':KOR'),keys=health.flatMap(h=>h.evidence.roster).sort(),appeared=health.flatMap(h=>h.evidence.appearances.map(p=>p.playerKey)).sort();
    if(health.some(h=>h.evidence.day!==d.day||h.evidence.seasonKey!==b.seasonKey)||canonicalJson(keys)!==canonicalJson(d.rosterKeys)||canonicalJson(appeared)!==canonicalJson(d.rosterKeys.filter((k:string)=>(row.batting[k]?.PA??0)+(row.pitching[k]?.BF??0)>0)))throw new RangeError('CHANGED_NATIONAL_HEALTH_EVIDENCE');
    for(const h of health){result.injured.push(...h.result.injured);result.recovered.push(...h.result.recovered);}
   }
   result.injured.sort();result.recovered.sort();if(canonicalJson(result)!==canonicalJson(d.result))throw new RangeError('CHANGED_NATIONAL_HEALTH_EVIDENCE');
   if(b.seasonKey===c.world.seasonKey){const closed=c.season?.days.find(row=>row.day===d.day);if(closed&&(closed.evidence!==nationalDayEvidence(b,d.day,d.gameKeys,d.rosterKeys)||canonicalJson(closed.injured)!==canonicalJson(d.result.injured)||canonicalJson(closed.recovered)!==canonicalJson(d.result.recovered)))throw new RangeError('CHANGED_NATIONAL_PRO_DAY_EVIDENCE');}
  }
 }
}

/** Root reader guard; deliberately does not call assertUsCareerRevision/usCareerView. */
export function assertUsNationalState(c:UsCareer):void {
 const n=ledger(c),sessions=n.sessions??[];
 if(!Array.isArray(sessions)||new Set(sessions.map(s=>s.competitionId)).size!==sessions.length||sessions.length!==(n.brackets??[]).length)throw new RangeError('INVALID_US_NATIONAL_SESSION');
 for(const raw of sessions){const s:UsNationalSession=raw,b=n.brackets?.find(b=>b.competitionId===s.competitionId),selection=n.selections?.find(x=>x.selectionId===s.selectionId);
  if(!b||!selection||b.tournament!==selection.tournament||b.seasonKey!==selection.seasonKey||typeof s.hostSourceFingerprint!=='string'||!s.hostSourceFingerprint||!Array.isArray(s.candidates)||new Set(s.candidates.map(x=>x.player.simulationKey)).size!==s.candidates.length||!Array.isArray(s.registeredKeys)||new Set(s.registeredKeys).size!==s.registeredKeys.length||s.registeredKeys.some(k=>!selection.scores.some(score=>score.playerKey===k))||Object.values(s.sources).some(v=>!Number.isSafeInteger(v)||v<0)||s.sources.kboRevision<1||s.sources.usRevision<1||!Number.isSafeInteger(s.sourceRecords.revision)||s.sourceRecords.revision<Math.max(s.sources.usRecordRevision,s.sources.kboRecordRevision))throw new RangeError('INVALID_US_NATIONAL_SESSION');
  assertNationalSelectionSnapshot(selection);
  validateHealthLedger(s.hostHealth);
  for(const [key,p]of Object.entries(s.hostPlayers)){if(p.simulationKey!==key||Object.hasOwn(c.world.players,key))throw new RangeError('NATIONAL_PLAYER_SOURCE_CONFLICT');validateDevelopmentPlayer(p);}
  for(const [key,r]of Object.entries(s.hostRepertoires)){if(s.hostPlayers[key]?.kind!=='PITCHER'||r.seasonId!==b.seasonKey)throw new RangeError('MISSING_NATIONAL_REPERTOIRE');validatePitchWeights(r.book,r.weights);validatePitchXpLedger(r.ledger);}
  for(const [key,row]of Object.entries(s.sourceRecords.games))if(key!==row.gameKey||c.records.games[key]&&canonicalJson(c.records.games[key])!==canonicalJson(row))throw new RangeError('NATIONAL_RECORD_SOURCE_CONFLICT');
  const result=n.competitions.find(r=>r.competitionId===b.competitionId);
  if(result){const gameKeys=b.results.map(r=>r.gameKey),registered=s.registeredKeys.includes(c.protagonistKey),officialAppearance=registered&&gameKeys.some(k=>(c.records.games[k]?.batting[c.protagonistKey]?.PA??0)+(c.records.games[k]?.pitching[c.protagonistKey]?.BF??0)>0),outcome=koreaOutcome(b);
   if(b.dayReceipts?.length!==b.window.endDay-b.window.startDay||canonicalJson(result.gameKeys)!==canonicalJson(gameKeys)||result.registered!==registered||result.officialAppearance!==officialAppearance||result.medal!==outcome.medal||result.finalRank!==outcome.finalRank)throw new RangeError('CHANGED_US_NATIONAL_RESULT');
  }
 }
 auditUsNationalDays(c);const p=c.phaseContext;
 const active=(n.brackets??[]).filter(b=>b.seasonKey===c.world.seasonKey&&!n.returnedCompetitions?.includes(b.competitionId));
 if(active.length>1||active.length===1&&(!(p.phase==='INTERNATIONAL_PROGRESS'||p.phase==='INTERNATIONAL_REVIEW')||p.competitionId!==active[0]!.competitionId))throw new RangeError('INVALID_US_NATIONAL_PHASE');
 if(p.phase==='INTERNATIONAL_PROGRESS'||p.phase==='INTERNATIONAL_REVIEW'){
  const b=n.brackets?.find(b=>b.competitionId===p.competitionId);if(!b||b.seasonKey!==c.world.seasonKey||!Number.isSafeInteger(p.nextWorldDay)||p.nextWorldDay!==b.window.startDay+(b.dayReceipts?.length??0)||!['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW'].includes(p.resume.phase)||p.resume.phase==='SEASON_PROGRESS'&&p.resume.pendingGame||p.phase==='INTERNATIONAL_REVIEW'&&(p.nextWorldDay!==b.window.endDay||!n.competitions.some(r=>r.competitionId===b.competitionId))||p.phase==='INTERNATIONAL_PROGRESS'&&p.nextWorldDay>=b.window.endDay)throw new RangeError('INVALID_US_NATIONAL_PHASE');
 }
}

export function confirmUsNationalEligibility(c:UsCareer,revision:number,competitionId:string):UsCareer {
 assertUsCareerRevision(c,revision);auditUsNationalDays(c);const n=ledger(c),benefit=n.benefits.find(b=>b.competitionId===competitionId),e=c.events.find(e=>e.definitionId==='E47'&&e.status==='OPEN'&&e.evidence.fields.competitionId===competitionId);
 if(!benefit||!e||n.eligibilityReviews?.includes(competitionId))throw new RangeError('NATIONAL_ELIGIBILITY_NOT_OPEN');
 const next:UsCareer={...c,national:{...n,eligibilityReviews:[...(n.eligibilityReviews??[]),competitionId]}};closeTask(next,e,'CONFIRM_SERVICE_ELIGIBILITY',benefit.benefitKey);next.revision++;return next;
}

/** Offseason admission starts with the next full season, using the existing three-season duty rule. */
export function confirmUsAthleteService(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.military.status!=='ATHLETE_ELIGIBLE'||!ledger(c).benefits.length||c.events.some(e=>e.status==='OPEN'&&['E47','E48'].includes(e.definitionId)))throw new RangeError('ATHLETE_SERVICE_NOT_AVAILABLE');
 const next:UsCareer={...c,military:{...c.military,status:'ATHLETE_SERVICE'},national:{...ledger(c),athleteDutySeasonsRemaining:3,athleteDutyStartSeasonKey:String(Number(c.world.seasonKey)+1),athleteDutySettledSeasons:[]}};
 queueUsDutyNotice(next);next.revision++;return next;
}
function queueUsDutyNotice(c:UsCareer):void {
 const n=ledger(c),d=eventDefinition('E55'),task=JSON.stringify(['athlete-duty',c.protagonistKey,n.athleteDutyStartSeasonKey,n.athleteDutySeasonsRemaining]);
 const e=createWorldEvent({definitionId:'E55',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,serviceTaskIdOrServicePeriodId:task,stage:'DUTY'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:null,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:c.season?.days.at(-1)?.day??0});
 if(!c.events.some(x=>x.eventKey===e.eventKey))c.events=[...c.events,e];
}
/** Annual owner calls after its final growth receipt; retries cannot consume the duty twice. */
export function advanceUsAthleteDutySeason(c:UsCareer,playedSeasonKey=c.world.seasonKey):void {
 if(c.military.status!=='ATHLETE_SERVICE')return;
 const n=ledger(c);assertNationalLedger(n,c.world.worldKey);const left=n.athleteDutySeasonsRemaining,start=n.athleteDutyStartSeasonKey,settled=n.athleteDutySettledSeasons??[];
 if(left===undefined||!start||!/^\d{4}$/.test(playedSeasonKey))throw new RangeError('INVALID_ATHLETE_DUTY_SEASON');
 if(Number(playedSeasonKey)<Number(start)||settled.includes(playedSeasonKey))return;
 if(c.world.seasonKey!==playedSeasonKey||!c.season?.growthFinalized||!c.seasonGrowth.finalized)throw new RangeError('ATHLETE_DUTY_SEASON_NOT_CLOSED');
 if(left<1||Number(playedSeasonKey)!==Number(start)+settled.length)throw new RangeError('ATHLETE_DUTY_SEASON_GAP');
 c.national={...n,athleteDutySeasonsRemaining:left-1,athleteDutySettledSeasons:[...settled,playedSeasonKey]};
 if(left===1)c.military={...c.military,status:'COMPLETED'};else queueUsDutyNotice(c);
}

/** E44 needs authoritative date; E48 requires the atomic host handoff API below. */
export function resolveUsNationalEvent(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string;worldDay:number}) {
 assertUsCareerRevision(c,revision);const e=c.events.find(e=>e.eventKey===input.eventKey);
 if(!e||!['E44','E45','E46','E47','E48','E55'].includes(e.definitionId)||e.seasonKey!==c.world.seasonKey||e.evidence.fields.playerSimulationKey!==c.protagonistKey)throw new RangeError('INVALID_NATIONAL_EVENT');
 validateEvent(e);const picked=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:input.worldDay,eligibleCommands:e.offeredChoices});
 if(e.definitionId==='E44')return {career:respondUsNationalCallup(c,revision,String(e.evidence.fields.competitionId),input.command==='ACCEPT_NATIONAL'?'ACCEPT':'DECLINE',input.worldDay),navigation:null};
 if(picked.navigation)return {career:c,navigation:picked.navigation};
 if(e.definitionId==='E48')throw new RangeError('US_NATIONAL_ATOMIC_RETURN_REQUIRED');
 if(e.definitionId==='E47')return {career:confirmUsNationalEligibility(c,revision,String(e.evidence.fields.competitionId)),navigation:null};
 const next={...c,events:c.events.map(x=>x.eventKey===e.eventKey?picked.event:x),revision:c.revision+1};return {career:next,navigation:null};
}

export interface UsNationalHostHandoff {expectedKboRevision:number;expectedUsRevision:number;competitionId:string;host:KboCareer;career:UsCareer;dates:NonNullable<NationalBracket['dayReceipts']>;ownership:import('./kbo-national.js').NationalHostReturn}
/** Both roots and their date/payroll writer must commit under one transaction; this is a domain result, not a receipt-only ACK. */
export function returnUsNationalTournament(c:UsCareer,revision:number,host:KboCareer,kboRevision:number):UsNationalHostHandoff {
 assertUsCareerRevision(c,revision);auditUsNationalDays(c);const {phase,bracket:b,session:s}=current(c),n=ledger(c),e=c.events.find(e=>e.definitionId==='E48'&&e.status==='OPEN'&&e.evidence.fields.competitionId===b.competitionId);
 if(phase.phase!=='INTERNATIONAL_REVIEW'||phase.nextWorldDay!==b.window.endDay||b.dayReceipts?.length!==b.window.endDay-b.window.startDay||!n.competitions.some(r=>r.competitionId===b.competitionId)||!e||c.events.some(e=>e.definitionId==='E47'&&e.status==='OPEN'&&e.evidence.fields.competitionId===b.competitionId)||n.returnedCompetitions?.includes(b.competitionId))throw new RangeError('NATIONAL_RETURN_NOT_READY');
 if(kboRevision!==s.sources.kboRevision||host.revision!==kboRevision||host.world.worldKey!==c.world.worldKey||host.world.seasonKey!==c.world.seasonKey||host.world.seed!==c.world.seed||hostFingerprint(host)!==s.hostSourceFingerprint)throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
 const {host:nextHost,ownership}=returnNationalHost({host,expectedRevision:kboRevision,snapshot:s,bracket:b,selection:selectionOf(c,b.tournament)!,registeredKeys:s.registeredKeys,records:c.records,owner:'US',ownerRevision:revision,ownerPlayerKeys:Object.keys(c.world.players),ownerHealth:c.health});
 const next:UsCareer={...c,national:{...n,returnedCompetitions:[...(n.returnedCompetitions??[]),b.competitionId]},phaseContext:phase.resume.phase==='SEASON_PROGRESS'?{...phase.resume,nextWorldDay:b.window.endDay}:structuredClone(phase.resume)};
 if(phase.resume.phase==='PRESEASON_SETUP'){const fatigue=c.world.players[c.protagonistKey]!.fatigue;next.seasonGrowth={...c.seasonGrowth,seasonStart:{...c.seasonGrowth.seasonStart,fatigue}};next.development={...c.development,seasonStartPlayer:{...c.development.seasonStartPlayer,fatigue}};}
 closeTask(next,e,'CONFIRM_NATIONAL_RETURN',JSON.stringify(['national-return',b.competitionId]));next.revision++;
 return {expectedKboRevision:kboRevision,expectedUsRevision:revision,competitionId:b.competitionId,host:nextHost,career:next,dates:structuredClone(b.dayReceipts),ownership:structuredClone(ownership)};
}
