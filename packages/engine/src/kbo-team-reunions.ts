import type {KboCareer} from './kbo-career-entry.js';
import type {PlayerRelationship} from './relationships.js';
import type {GameContribution} from './records.js';
import type {EventInstance} from './events.js';
import {currentKboSeasonTransfers} from './kbo-transfer-registration.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {createWorldEvent,enqueueWorldEvent,eventDefinition,resolveEventChoice} from './events.js';
import {canonicalJson} from './game.js';
import {assertSangmuUnit} from './kbo-sangmu-unit.js';
import {compareKboSeasonDays} from './kbo-military-program.js';

const registrationKey=(transferKey:string,relationKey:string)=>JSON.stringify(['kbo-shared-registration',transferKey,relationKey]);
function assertRelation(c:KboCareer,r:PlayerRelationship){
 if(r.primaryPlayerKey!==c.protagonistKey||r.primaryPlayerKey===r.otherPlayerKey||!['RIVAL','TEAMMATE'].includes(r.type)||r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort())||r.relationKey!==JSON.stringify([r.type,r.normalPairKey])||!r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
}
function sharedRegistration(c:KboCareer,r:PlayerRelationship,g:GameContribution,clubId:string,error:string){
 const rows=c.health.games.filter(h=>h.evidence.gameKey===g.gameKey).map(h=>h.evidence),prefix=g.scope.leagueKey+':';
 if(rows.length<2)return null;
 if(Object.keys(g.teams).length!==2 || rows.length!==2 || new Set(rows.map(h=>h.teamKey)).size!==2 || rows.some(h=>h.seasonKey!==g.scope.seasonKey || h.day!==g.worldDay || !h.teamKey.startsWith(prefix) || !Object.hasOwn(g.teams,h.teamKey.slice(prefix.length)) || g.teams[h.teamKey.slice(prefix.length)]!.games!==1 || new Set(h.roster).size!==h.roster.length))throw new RangeError(error);
 const team=rows.find(h=>h.teamKey===prefix+clubId);
 if(!team || !team.roster.includes(r.primaryPlayerKey) || !team.roster.includes(r.otherPlayerKey))return null;
 if(rows.some(h=>h!==team && (h.roster.includes(r.primaryPlayerKey) || h.roster.includes(r.otherPlayerKey))))throw new RangeError(error);
 return team;
}
/** A real army team-game registration qualifies even for a benched or injured member. No present-day membership inference. */
function armyRegistration(c:KboCareer,r:PlayerRelationship,g:GameContribution){
 if(g.scope.leagueKey!=='FUTURES' || g.scope.phase!=='REGULAR' || !Object.hasOwn(g.teams,'SANGMU'))return null;
 const army=sharedRegistration(c,r,g,'SANGMU','INVALID_KBO_ARMY_REGISTRATION');if(!army)return null;
 // The key seals the registered identities without exposing fatigue, appearances or current private ability.
 return JSON.stringify(['kbo-army-shared-registration',r.relationKey,g.gameKey,[...army.roster].sort()]);
}
/** Return history and the historical game decide eligibility; today's club or contract cannot rewrite an old notice. */
function returnedRegistration(c:KboCareer,r:PlayerRelationship,g:GameContribution){
 if(!['KBO','FUTURES'].includes(g.scope.leagueKey) || g.scope.phase!=='REGULAR')return null;
 const date={seasonKey:g.scope.seasonKey,worldDay:g.worldDay},history=Object.entries(c.sangmu?.npcReturns??{}).filter(([,h])=>h.program.playerKey===r.otherPlayerKey && compareKboSeasonDays(date,h.returned)>0).sort((a,b)=>compareKboSeasonDays(b[1].returned,a[1].returned));
 const match=history[0];if(!match)return null;
 if(history[1] && compareKboSeasonDays(match[1].returned,history[1][1].returned)===0)throw new RangeError('INVALID_KBO_RETURN_REGISTRATION');
 const [programId,h]=match,clubId=h.program.originalClubId;if(!Object.hasOwn(g.teams,clubId))return null;
 const team=sharedRegistration(c,r,g,clubId,'INVALID_KBO_RETURN_REGISTRATION');if(!team)return null;
 return {programId,program:h.program,clubId,key:JSON.stringify(['kbo-return-shared-registration',r.relationKey,programId,h.returned.seasonKey,h.returned.worldDay,g.gameKey,[...team.roster].sort()])};
}
/** Only the accepted identity/club witness is relevant; market scores and probability tables remain outside E96. */
function aiAcquisition(c:KboCareer,playerKey:string,seasonKey:string,contractKey:string){
 const seasons=(c.aiOffseasons??[]).filter(o=>o.seasonKey===seasonKey);if(!seasons.length)return null;
 if(seasons.length!==1)throw new RangeError('INVALID_KBO_AI_REUNION_SOURCE');const offseason=seasons[0]!,renewal=offseason.renewal;
 const renewed=renewal.renewed.filter(r=>r.playerKey===playerKey),accepted=offseason.rounds.flatMap(round=>round.outcomes.filter(o=>o.playerKey===playerKey && o.offerKey!==null).map(outcome=>({round,outcome})));
 if(renewed.length+accepted.length>1)throw new RangeError('INVALID_KBO_AI_REUNION_SOURCE');
 if(renewed.length){
  const row=renewed[0]!,expected=JSON.stringify(['kbo-ai-renewal',c.world.worldKey,seasonKey,playerKey]);
  if(renewal.seasonKey!==seasonKey || renewal.receiptKey!==JSON.stringify(['kbo-ai-renewals',c.world.worldKey,seasonKey]) || renewal.expired.some(r=>r.playerKey===playerKey) || !c.world.clubs.some(t=>t.id===row.clubId))throw new RangeError('INVALID_KBO_AI_REUNION_SOURCE');
  return contractKey===expected?{receiptKey:renewal.receiptKey,clubId:row.clubId,annualSalaryWon:row.annualSalaryWon,years:1}:null;
 }
 const win=accepted[0];if(!win)return null;const {round,outcome}=win,offers=round.offers.filter(o=>o.offerKey===outcome.offerKey),offer=offers[0];
 if(![1,2,3].includes(round.round) || round.receiptKey!==JSON.stringify(['kbo-fa-round',c.world.worldKey,seasonKey,round.round]) || offseason.rounds.filter(r=>r.receiptKey===round.receiptKey).length!==1 || round.outcomes.filter(o=>o.playerKey===playerKey).length!==1 || offers.length!==1 || !offer || offer.playerKey!==playerKey || !c.world.clubs.some(t=>t.id===offer.clubId) || offer.offerKey!==JSON.stringify(['kbo-ai-fa-offer',c.world.worldKey,seasonKey,round.round,offer.clubId,playerKey]) || round.releasedOfferKeys.includes(offer.offerKey))throw new RangeError('INVALID_KBO_AI_REUNION_SOURCE');
 return contractKey===offer.offerKey?{receiptKey:round.receiptKey,clubId:offer.clubId,annualSalaryWon:offer.annualSalaryWon,years:offer.years}:null;
}
function aiRegistration(c:KboCareer,r:PlayerRelationship,g:GameContribution,contractKey:string){
 if(!['KBO','FUTURES'].includes(g.scope.leagueKey) || g.scope.phase!=='REGULAR')return null;
 const proof=aiAcquisition(c,r.otherPlayerKey,g.scope.seasonKey,contractKey);if(!proof || !Object.hasOwn(g.teams,proof.clubId))return null;
 const team=sharedRegistration(c,r,g,proof.clubId,'INVALID_KBO_AI_REUNION_REGISTRATION');if(!team)return null;
 return {...proof,key:JSON.stringify(['kbo-ai-shared-registration',r.relationKey,proof.receiptKey,contractKey,g.gameKey,[...team.roster].sort()])};
}
function parsedRegistration(value:string|number|undefined):unknown {
 try{return typeof value==='string'?JSON.parse(value):null;}catch{return null;}
}
function source(c:KboCareer,event:EventInstance){
 enqueueWorldEvent([],event);const f=event.evidence.fields,relations=c.relationships.relations.filter(r=>r.relationKey===f.relationId),r=relations[0];
 if(event.definitionId!=='E96'||event.worldKey!==c.world.worldKey||relations.length!==1||!r)throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');assertRelation(c,r);
 const receipt=parsedRegistration(f.sharedTeamRegistrationReceiptId);
 if(Array.isArray(receipt) && receipt[0]==='kbo-ai-shared-registration'){
  const g=receipt.length===6 && receipt[1]===r.relationKey && typeof receipt[3]==='string' && typeof receipt[4]==='string'?c.records.games[receipt[4]]:undefined;
  const match=g?aiRegistration(c,r,g,receipt[3]):null,index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM' && m.evidenceKey===event.evidenceKey && m.worldDay===event.occurredWorldDay);
  if(!g || !match || g.scope.seasonKey!==event.seasonKey || g.worldDay!==event.occurredWorldDay || index<0 || !r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED') || r.milestones.filter(m=>m.evidenceKey===event.evidenceKey).length!==1 || c.relationNotices.filter(e=>e.eventKey===event.eventKey).length!==1 || event.resume.phase!=='SEASON_PROGRESS' || event.resume.competitionKey!==g.scope.leagueKey || event.resume.registrationKey!==match.clubId || event.resume.sourceRevision<1 || event.resume.sourceRevision>c.revision+1 || f.sharedTeamRegistrationReceiptId!==match.key || canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:match.key}))throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');return r;
 }

 if(Array.isArray(receipt) && receipt[0]==='kbo-return-shared-registration'){
  if(!c.sangmu?.npcReturns)throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');assertSangmuUnit(c.sangmu,c.world);
  const g=receipt.length===7 && receipt[1]===r.relationKey && typeof receipt[5]==='string'?c.records.games[receipt[5]]:undefined;
  const match=g?returnedRegistration(c,r,g):null,index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM' && m.evidenceKey===event.evidenceKey && m.worldDay===event.occurredWorldDay);
  if(!g || !match || g.scope.seasonKey!==event.seasonKey || g.worldDay!==event.occurredWorldDay || index<0 || !r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED') || r.milestones.filter(m=>m.evidenceKey===event.evidenceKey).length!==1 || c.relationNotices.filter(e=>e.eventKey===event.eventKey).length!==1 || event.resume.phase!=='SEASON_PROGRESS' || event.resume.competitionKey!==g.scope.leagueKey || event.resume.registrationKey!==match.clubId || event.resume.sourceRevision<1 || event.resume.sourceRevision>c.revision+1 || f.sharedTeamRegistrationReceiptId!==match.key || canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:match.key}))throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');return r;
 }

 if(event.resume.registrationKey==='SANGMU' && event.resume.competitionKey==='FUTURES'){
  const id=typeof f.sharedTeamRegistrationReceiptId==='string'?JSON.parse(f.sharedTeamRegistrationReceiptId):null;
  const g=Array.isArray(id) && id.length===4 && id[0]==='kbo-army-shared-registration' && id[1]===r.relationKey && typeof id[2]==='string'?c.records.games[id[2]]:undefined;
  const index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM' && m.evidenceKey===event.evidenceKey && m.worldDay===event.occurredWorldDay);
  if(!g || g.scope.seasonKey!==event.seasonKey || g.worldDay!==event.occurredWorldDay || index<0 || !r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED') || event.resume.phase!=='SEASON_PROGRESS' || f.sharedTeamRegistrationReceiptId!==armyRegistration(c,r,g) || canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:f.sharedTeamRegistrationReceiptId}))throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');return r;
 }
 const transfers=(c.transferHistory??[]).filter(t=>registrationKey(t.receiptKey,r.relationKey)===f.sharedTeamRegistrationReceiptId),t=transfers[0];
 const index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM'&&m.evidenceKey===event.evidenceKey&&m.worldDay===event.occurredWorldDay);
 if(transfers.length!==1||!t||t.playerKey!==r.primaryPlayerKey||t.fromClubId===t.toClubId||t.seasonKey!==event.seasonKey||t.afterWorldDay!==event.occurredWorldDay||!Array.isArray(t.sharedRelationKeys)||new Set(t.sharedRelationKeys).size!==t.sharedRelationKeys.length||!t.sharedRelationKeys.includes(r.relationKey)||index<0||!r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED')||event.resume.registrationKey!==t.toClubId||event.resume.competitionKey!=='KBO'||event.resume.phase!=='SEASON_PROGRESS'||canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:registrationKey(t.receiptKey,r.relationKey)}))throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');return r;
}

/** Successful player transfer only. The receipt seals which existing relationships actually shared registration. */
export function settleKboTransferTeamReunions(previous:KboCareer,c:KboCareer):void {
 const t=currentKboSeasonTransfers(c)?.at(-1),from=previous.world.clubs.find(x=>x.id===previous.protagonistClubId),to=c.world.clubs.find(x=>x.id===c.protagonistClubId);
 if(c.phaseContext.phase!=='SEASON_PROGRESS'||!t||!from||!to||previous.world.worldKey!==c.world.worldKey||previous.world.seasonKey!==c.world.seasonKey||previous.protagonistKey!==c.protagonistKey||t.playerKey!==c.protagonistKey||t.fromClubId!==from.id||t.toClubId!==to.id||!from.roster.includes(c.protagonistKey)||!to.roster.includes(c.protagonistKey)||(previous.transferHistory??[]).some(x=>x.receiptKey===t.receiptKey))throw new RangeError('INVALID_KBO_TEAM_REUNION_TRANSFER');
 if(t.sharedRelationKeys!==undefined){for(const e of c.relationNotices.filter(e=>e.definitionId==='E96'))source(c,e);return;}
 const keys:string[]=[],seen=new Set<string>();let notices=structuredClone([...c.relationNotices]);
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(!['SEPARATED','REUNITED_OPPONENT'].includes(r.stage)||!to.roster.includes(r.otherPlayerKey)||from.roster.includes(r.otherPlayerKey)||c.sangmu?.loaned?.includes(r.otherPlayerKey)||kboActiveContractSuspended(c.world.contracts[r.otherPlayerKey]!))return r;
  if(!r.milestones.some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_KBO_TEAM_REUNION_SEPARATION');
  const event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:t.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:registrationKey(t.receiptKey,r.relationKey)}},resume:{worldKey:c.world.worldKey,seasonKey:t.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'KBO',registrationKey:to.id,sourceRevision:c.revision},sourceSequence:c.events.length+notices.length+1,worldDay:t.afterWorldDay});
  keys.push(r.relationKey);notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:t.afterWorldDay}]};
 });
 c.transferHistory=c.transferHistory!.map(row=>row.receiptKey===t.receiptKey?{...row,sharedRelationKeys:keys}:row);c.relationships={...c.relationships,relations};c.relationNotices=notices;
}
/** Internal finalized-day hook. Old saves are not rewritten by a read; caller owns the cloned transaction. */
export function settleKboArmyTeamReunions(c:KboCareer,day:number):void {
 if(c.days?.days.at(-1)?.day!==day)throw new RangeError('KBO_ARMY_REUNION_DAY_NOT_FINAL');
 for(const e of c.relationNotices.filter(e=>e.definitionId==='E96' && e.resume.registrationKey==='SANGMU'))source(c,e);
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey && g.worldDay===day && g.scope.leagueKey==='FUTURES' && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,'SANGMU'));
 let notices=structuredClone([...c.relationNotices]);const seen=new Set<string>();
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(!['SEPARATED','REUNITED_OPPONENT'].includes(r.stage))return r;
  const matches=games.map(g=>({g,key:armyRegistration(c,r,g)})).filter(x=>x.key!==null);
  if(matches.length>1)throw new RangeError('INVALID_KBO_ARMY_REGISTRATION');if(!matches.length)return r;
  if(!r.milestones.some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_KBO_TEAM_REUNION_SEPARATION');
  const {g,key}=matches[0]!;
  const event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:key!}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'FUTURES',registrationKey:'SANGMU',sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
  if(r.milestones.some(m=>m.evidenceKey===event.evidenceKey))throw new RangeError('KBO_ARMY_REUNION_STAGE_CHANGED');
  notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:day}]};
 });
 c.relationships={...c.relationships,relations};c.relationNotices=notices;
}
/** Actual first shared civilian registration after an authentic return; no historical scan or generic FA reunion. */
export function settleKboReturnedTeamReunions(c:KboCareer,day:number):void {
 if(c.days?.seasonKey!==c.world.seasonKey || c.days.days.at(-1)?.day!==day)throw new RangeError('KBO_RETURN_REUNION_DAY_NOT_FINAL');
 if(!c.sangmu?.npcReturns || !Object.keys(c.sangmu.npcReturns).length)return;
 assertSangmuUnit(c.sangmu,c.world);
 for(const e of c.relationNotices.filter(e=>e.definitionId==='E96'))source(c,e);
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey && g.worldDay===day && ['KBO','FUTURES'].includes(g.scope.leagueKey) && g.scope.phase==='REGULAR');
 let notices=structuredClone([...c.relationNotices]);const seen=new Set<string>();
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(!['SEPARATED','REUNITED_OPPONENT'].includes(r.stage))return r;
  const matches=games.flatMap(g=>{const match=returnedRegistration(c,r,g);return match?[{g,...match}]:[];});
  if(matches.length>1)throw new RangeError('INVALID_KBO_RETURN_REGISTRATION');const match=matches[0];if(!match)return r;
  const {g,key,programId,program,clubId}=match,contract=c.world.contracts[r.otherPlayerKey],ledger=contract?.servicePay?.ledger??contract?.remainderPay?.previous.servicePay.ledger;
  if(!ledger || ledger.programId!==programId || canonicalJson(ledger.contract)!==canonicalJson(program.contract))return r;
  if(!r.milestones.some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_KBO_TEAM_REUNION_SEPARATION');
  const event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:key}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:'SEASON_PROGRESS',competitionKey:g.scope.leagueKey,registrationKey:clubId,sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
  // A paid last game can reunite the pair before same-day contract expiry separates them again.
  if(r.milestones.some(m=>m.evidenceKey===event.evidenceKey))return r;
  notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:day}]};
 });
 c.relationships={...c.relationships,relations};c.relationNotices=notices;
}
/** A real AI signing/renewal reunites an existing pair only on their first actual shared registration. */
export function settleKboAiTeamReunions(c:KboCareer,day:number):void {
 if(c.days?.seasonKey!==c.world.seasonKey || c.days.days.at(-1)?.day!==day)throw new RangeError('KBO_AI_REUNION_DAY_NOT_FINAL');
 for(const e of c.relationNotices.filter(e=>{const id=parsedRegistration(e.evidence.fields.sharedTeamRegistrationReceiptId);return e.definitionId==='E96' && Array.isArray(id) && id[0]==='kbo-ai-shared-registration';}))source(c,e);
 if(!c.aiOffseasons?.some(o=>o.seasonKey===c.world.seasonKey))return;
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey && g.worldDay===day && ['KBO','FUTURES'].includes(g.scope.leagueKey) && g.scope.phase==='REGULAR');
 let notices=structuredClone([...c.relationNotices]);const seen=new Set<string>();
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(!['SEPARATED','REUNITED_OPPONENT'].includes(r.stage))return r;
  const contract=c.world.contracts[r.otherPlayerKey];if(!contract || contract.playerKey!==r.otherPlayerKey || contract.seasonKey!==c.world.seasonKey)return r;
  const matches=games.flatMap(g=>{const match=aiRegistration(c,r,g,contract.contractKey);return match?[{g,...match}]:[];});
  if(matches.length>1)throw new RangeError('INVALID_KBO_AI_REUNION_REGISTRATION');const match=matches[0];if(!match)return r;
  if(contract.clubId!==match.clubId || contract.annualSalaryWon!==match.annualSalaryWon || contract.years!==match.years)throw new RangeError('INVALID_KBO_AI_REUNION_SOURCE');
  if(!r.milestones.some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_KBO_TEAM_REUNION_SEPARATION');
  const event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:match.g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:match.key}},resume:{worldKey:c.world.worldKey,seasonKey:match.g.scope.seasonKey,phase:'SEASON_PROGRESS',competitionKey:match.g.scope.leagueKey,registrationKey:match.clubId,sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
  if(r.milestones.some(m=>m.evidenceKey===event.evidenceKey)){if(!notices.some(e=>e.eventKey===event.eventKey))throw new RangeError('KBO_AI_REUNION_STAGE_CHANGED');return r;}
  notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:day}]};
 });
 c.relationships={...c.relationships,relations};c.relationNotices=notices;
}
export function kboTeamReunionNoticeRows(c:KboCareer){
 return c.relationNotices.filter(e=>e.definitionId==='E96').flatMap(e=>{const r=source(c,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E96');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E96' as const,title:d.title,body:d.body,relationKey:r.relationKey,type:r.type,otherPlayerKey:r.otherPlayerKey,seasonKey:e.seasonKey,occurredWorldDay:e.occurredWorldDay,targetScreen:'S42' as const}];});
}
export function prepareKboTeamReunionRead(c:KboCareer,input:{eventKey:string;eventVersion:number;command:string}){
 const found=c.relationNotices.filter(e=>e.eventKey===input.eventKey);if(found.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const e=found[0]!,r=source(c,e),read=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_RELATIONS']});return {event:read.event,navigation:{...read.navigation!,relationKey:r.relationKey}};
}
