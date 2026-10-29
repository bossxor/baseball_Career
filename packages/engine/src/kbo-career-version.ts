import {assertKboCareerFaLedger} from './kbo-career-fa.js';
import {assertCareerAgentLedger} from './career-agent.js';
import {assertNationalLedger} from './kbo-national.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';

/** KBO v2 introduced ACTIVE. v3 adds mandatory plans and return conditioning. v4 adds midseason transfers. v5 enables military health/temporary identities. v6 preserves NPC suspension/return obligations. v7 adds deferred offseason release/signing. School/v1 guards remain unchanged. */
export function assertKboCareerRevision(source:Pick<KboCareer,'schemaVersion'|'revision'> & Partial<Pick<KboCareer,'freeAgency'|'transferHistory'|'world'|'sangmu'|'offseasonExit'|'national'|'phaseContext'|'agents'|'protagonistKey'>>,expectedRevision:number):void {
 if(source.agents){if(!source.world||!source.protagonistKey)throw new RangeError('INVALID_AGENT_LEDGER');assertCareerAgentLedger(source as KboCareer);}
 assertKboCareerFaLedger(source.freeAgency);
 if(![1,2,3,4,5,6,7].includes(source.schemaVersion))throw new RangeError('CAREER_REVISION_CHANGED');
 if(source.schemaVersion<7 && source.offseasonExit!==undefined)throw new RangeError('CAREER_REVISION_CHANGED');
 if(source.schemaVersion<4 && ((source.transferHistory?.length??0)>0 || Object.values(source.world?.contracts??{}).some(c=>c.remainderPay?.schemaVersion===2)))throw new RangeError('CAREER_REVISION_CHANGED');
 if(source.schemaVersion<6 && (source.world?.suspendedContracts!==undefined || source.sangmu?.npcReturns!==undefined || source.world?.finance?.closedContracts!==undefined))throw new RangeError('CAREER_REVISION_CHANGED');
 if(source.sangmu?.emergency && source.schemaVersion<5)throw new RangeError('CAREER_REVISION_CHANGED');
 assertNationalLedger(source.national,source.world?.worldKey);
 const phase=source.phaseContext;
 const active=source.national?.brackets?.filter(b=>b.dayCloseVersion===1&&b.seasonKey===source.world?.seasonKey&&!source.national?.returnedCompetitions?.includes(b.competitionId))??[];
 if(active.length>1||active.length===1&&(!phase||!['INTERNATIONAL_PROGRESS','INTERNATIONAL_REVIEW'].includes(phase.phase)||!('competitionId' in phase)||phase.competitionId!==active[0]!.competitionId))throw new RangeError('INVALID_NATIONAL_PHASE');
 if(phase?.phase==='INTERNATIONAL_PROGRESS'||phase?.phase==='INTERNATIONAL_REVIEW'){
  const b=source.national?.brackets?.find(b=>b.competitionId===phase.competitionId);
  if(!b||b.dayCloseVersion!==1||b.seasonKey!==source.world?.seasonKey||!Number.isSafeInteger(phase.nextWorldDay)||phase.nextWorldDay!==b.window.startDay+(b.dayReceipts?.length??0)||phase.nextWorldDay>b.window.endDay||!phase.resume||!['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW'].includes(phase.resume.phase)||phase.resume.phase==='SEASON_PROGRESS'&&(phase.resume.pendingGame!==null||phase.resume.nextWorldDay!==b.window.startDay)||phase.phase==='INTERNATIONAL_REVIEW'&&phase.nextWorldDay!==b.window.endDay)throw new RangeError('INVALID_NATIONAL_PHASE');
 }
 assertCareerRevision({schemaVersion:1,revision:source.revision},expectedRevision);
}
