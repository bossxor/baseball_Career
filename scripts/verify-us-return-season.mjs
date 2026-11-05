import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {canonicalJson} from '../packages/engine/src/game.ts';
import {nativeReturnSource,assertNativeSourceUnchanged,readNativeReturnCache,writeNativeReturnCache,withNativeReturnWriter,pinNativeRecordPrefix} from '../packages/engine/test/native-return-cache.ts';
import {assertNativeServicePrefix} from '../packages/engine/test/us-native-service-fixture.ts';
import {resignUsAfterAmateurReturn} from '../packages/engine/src/us-amateur-return-career.ts';
import {assertUsCareerRevision} from '../packages/engine/src/us-career-entry.ts';
import {confirmUsPreseasonPlan,unreadUsFirstCampNotices,resolveUsFirstCampNotice} from '../packages/engine/src/us-preseason.ts';
import {publishUsSeasonSchedule} from '../packages/engine/src/us-schedule.ts';
import {startUsRegularSeason,advanceUsCareer} from '../packages/engine/src/us-season.ts';
import {resolveUsWindowEvent} from '../packages/engine/src/us-windows.ts';
import {resolveUsLevelEventResult} from '../packages/engine/src/us-levels.ts';
import {resolveProHiddenTraitNotice} from '../packages/engine/src/pro-trait-notices.ts';
import {auditUsClosedDays,settleUsSeasonGrowth} from '../packages/engine/src/us-growth.ts';

const hash=value=>createHash('sha256').update(canonicalJson(value)).digest('hex');
/** Explicit test choices only; unknown owners stop instead of a generic ACK. */
export function continuationChoice(id){
 const choices={E41:['WINDOW','ACK_EVENT'],E43:['WINDOW','FORFEIT_TRAINING'],E59:['LEVEL','DEFER_PROMOTION'],E60:['LEVEL','CONFIRM_CALLUP'],E61:['LEVEL','CONFIRM_DEMOTION'],E84:['HIDDEN','OPEN_TRAITS']};
 if(!Object.hasOwn(choices,id))throw Error('UNHANDLED_US_CONTINUATION_EVENT:'+id);
 return choices[id];
}

export function verifyUsReturnSeason(base,evidence){
 if(!base||!evidence)throw Error('US_RETURN_SEASON_PATHS_REQUIRED');
 const manifest=nativeReturnSource(),runnerSha256=createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),checkpoint=base+'.resigned-season.checkpoint',kind='SERVICE_RESIGNED_FIRST_REGULAR_SEASON';
 const validate=s=>{assert.equal(s.runnerSha256,runnerSha256);assertUsCareerRevision(s.career,s.career.revision);const history=s.career.usAmateurReturnHistory;assert.ok(history);assertNativeServicePrefix(history);assert.equal(hash(history),s.originSha256);assert.equal(s.career.protagonistKey,history.return.playerKey);assert.equal(s.career.world.seasonKey,String(Number(history.service.world.seasonKey)+1));assert.equal(s.career.usAmateurReturn?.status,'CANCELLED_US');assert.ok(Number.isSafeInteger(s.commands)&&s.commands>=1);};
 return withNativeReturnWriter(checkpoint,()=>{
  let state=readNativeReturnCache(checkpoint,kind,manifest,validate);
  if(!state){
   const origin=readNativeReturnCache(base+'.service.json','SERVICE_COMPLETE',manifest,assertNativeServicePrefix);
   if(!origin)throw Error('COMPLETED_NATIVE_SERVICE_PREFIX_REQUIRED');
   const offer=origin.source.minorMarket.offers.find(o=>o.militaryReturnOption);assert.ok(offer);
   state={runnerSha256,career:resignUsAfterAmateurReturn(origin,origin.revision,offer.offerKey),commands:1,checkpoints:[],originSha256:hash(origin),decisions:[]};
  }
  const inherited=state.career.usAmateurReturnHistory.service.records;
  const save=()=>{assertNativeSourceUnchanged(manifest);validate(state);const proof={commands:state.commands,phase:state.career.phaseContext.phase,revision:state.career.revision,sha256:hash(state.career)};state.checkpoints.push(proof);writeNativeReturnCache(checkpoint,kind,manifest,state);process.stdout.write(JSON.stringify(proof)+'\n');};
  const apply=(name,fn)=>{const before=state.career;let next=fn(before);assert.ok(next.revision>before.revision,name+' must advance revision');if(next.records.games[Object.keys(inherited.games)[0]]!==inherited.games[Object.keys(inherited.games)[0]])next={...next,records:pinNativeRecordPrefix(inherited,next.records)};state.career=next;state.commands++;if(state.commands%100===0)save();};
  state.career={...state.career,records:pinNativeRecordPrefix(inherited,state.career.records)};
  if(state.career.phaseContext.phase==='PRESEASON_SETUP'){
   for(const event of unreadUsFirstCampNotices(state.career))apply('CAMP_ACK',c=>resolveUsFirstCampNotice(c,c.revision,{...event,command:'ACK_EVENT'}));
   if(!state.career.preseasonPlan)apply('CONFIRM_PLAN',c=>confirmUsPreseasonPlan(c,c.revision));
   if(!state.career.seasonSchedule)apply('PUBLISH_SCHEDULE',c=>publishUsSeasonSchedule(c,c.revision));
   apply('START_REGULAR',c=>startUsRegularSeason(c,c.revision));save();
  }
  const scheduled=Object.values(state.career.seasonSchedule.leagues).flat(),limit=state.commands+scheduled.length*50+10000;
  while(state.career.phaseContext.phase!=='SEASON_REVIEW'){
   assert.ok(state.commands<limit,'US_CONTINUATION_COMMAND_LIMIT');
   const c=state.career,phase=c.phaseContext;
   if(phase.phase==='SEASON_PROGRESS')apply('ADVANCE',source=>{const out=advanceUsCareer(source,source.revision,7);assert.ok(!['ENGINE_LIMIT','ROSTER_DECISION_REQUIRED'].includes(out.stopReason),out.stopReason);return out.career;});
   else if(phase.phase==='EVENT_DECISION'){
    const event=c.events.find(e=>e.eventKey===phase.eventKey&&e.status==='OPEN');assert.ok(event);
    const [owner,command]=continuationChoice(event.definitionId),input={eventKey:event.eventKey,eventVersion:event.version,command};
    state.decisions.push({definitionId:event.definitionId,...input});
    apply(owner,source=>(owner==='WINDOW'?resolveUsWindowEvent(source,source.revision,input):owner==='LEVEL'?resolveUsLevelEventResult(source,source.revision,input):resolveProHiddenTraitNotice(source,source.revision,input)).career);
   }else throw Error('UNHANDLED_US_CONTINUATION_PHASE:'+phase.phase);
  }
  auditUsClosedDays(state.career);assert.equal(state.career.season.days.length,state.career.season.lastDay-state.career.season.firstDay+1);
  for(const game of scheduled)assert.ok(state.career.records.games[game.simulationKey],game.simulationKey);
  if(!state.career.season.growthFinalized)apply('SETTLE_GROWTH',c=>settleUsSeasonGrowth(c,c.revision,true));
  assert.ok(state.career.seasonGrowth.finalized);auditUsClosedDays(state.career);save();
  const final=state.career,report={schemaVersion:1,status:'PASS',scope:'NATIVE_SERVICE_TWO_YEARS_AND_RESIGNED_FIRST_REGULAR_SEASON',source:manifest,runnerSha256,originSha256:state.originSha256,commands:state.commands,checkpoints:state.checkpoints,decisions:state.decisions,regularGames:scheduled.length,closedDays:final.season.days.length,paidUsd:final.season.paidUsd,growthReceipt:final.season.growthFinalized.receiptKey,finalSha256:hash(final),fullDesignPathProven:false,postseasonProven:false,openEvents:final.events.filter(e=>e.status==='OPEN').map(e=>({definitionId:e.definitionId,eventKey:e.eventKey}))};
  fs.writeFileSync(evidence,JSON.stringify(report,null,2)+'\n');return report;
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1])){
 try{verifyUsReturnSeason(process.env.PLAYBALL_NATIVE_RETURN_PREFIX,process.argv[2]);}catch(error){console.error(error);process.exitCode=1;}
}
