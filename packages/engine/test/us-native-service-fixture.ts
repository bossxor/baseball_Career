import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {expiredRetryUsCareer} from './us-return-retry-fixture.js';
import {nativeReturnSource,pinNativeRecordPrefix,assertNativeSourceUnchanged,readNativeReturnCache,writeNativeReturnCache,withNativeReturnWriter} from './native-return-cache.js';
import {usServiceTestStepLimit,usServiceTestProgress} from './us-service-fixture.js';
import {openUsMinorMarket} from '../src/us-minor-market.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,advanceUsAmateurReturn,settleUsAmateurReturnYear,assertUsAmateurReturnCareer,resignUsAfterAmateurReturn} from '../src/us-amateur-return-career.js';
import type {UsAmateurReturnCareer} from '../src/us-amateur-return-career.js';
import {canonicalJson} from '../src/game.js';

interface Checkpoint {career:UsAmateurReturnCareer;commands:number;step:number}
function checkpointOwner(c:Checkpoint):void {assertUsAmateurReturnCareer(c.career);if(!Number.isSafeInteger(c.commands)||c.commands<1||!Number.isSafeInteger(c.step)||c.step<0||c.career.source.military.status!=='UNRESOLVED'||c.career.completedPreparation.length||c.career.return.years.some(y=>!['ACTIVE_SERVICE','ACTIVE_AND_TRAINING'].includes(y.kind)))throw Error('NATIVE_SERVICE_CHECKPOINT_INVALID');}
export function assertNativeServicePrefix(c:UsAmateurReturnCareer):void {assertUsAmateurReturnCareer(c);if(c.return.years.length!==2||c.return.status!=='DRAFT_READY'||c.return.militaryStatus!=='COMPLETED'||!c.service||c.service.phaseContext.phase!=='SEASON_REVIEW'||c.completedPreparation.length||c.return.years[0]!.kind!=='ACTIVE_SERVICE'||c.return.years[1]!.kind!=='ACTIVE_AND_TRAINING')throw Error('NATIVE_SERVICE_PREFIX_NOT_COMPLETE');}
let cache:UsAmateurReturnCareer|undefined,cacheSource:string|undefined;
/** Existing native workers only. Checkpoints preserve unfinished work, never completed-prefix evidence. */
export function nativeServiceUsReturn():UsAmateurReturnCareer {
 const base=process.env.PLAYBALL_NATIVE_RETURN_PREFIX,file=base?base+'.service.json':undefined,manifest=nativeReturnSource();
 if(cache){if(cacheSource!==manifest.sha256)throw Error('NATIVE_RETURN_CACHE_SOURCE_CHANGED');return structuredClone(cache);}
 const load=()=>file?readNativeReturnCache(file,'SERVICE_COMPLETE',manifest,assertNativeServicePrefix):undefined,saved=load();if(saved){cache=saved;cacheSource=manifest.sha256;return structuredClone(cache);}
 const generate=()=>{
  const saved=load();if(saved){cache=saved;cacheSource=manifest.sha256;return structuredClone(cache);}
  let state=file?readNativeReturnCache(file+'.checkpoint','SERVICE_CHECKPOINT',manifest,checkpointOwner):undefined;
  if(!state){const closed=expiredRetryUsCareer();closed.military.status='UNRESOLVED';const source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));state={career:requestUsAmateurReturn(source,source.revision),commands:1,step:0};}
  const pin=(c:UsAmateurReturnCareer):UsAmateurReturnCareer=>({...c,service:{...c.service!,records:pinNativeRecordPrefix(c.source.records,c.service!.records)}});
  if(state.career.service)state={...state,career:pin(state.career)};
  const save=()=>{if(file)assertNativeSourceUnchanged(manifest);checkpointOwner(state!);if(file)writeNativeReturnCache(file+'.checkpoint','SERVICE_CHECKPOINT',manifest,state);};
  while(state.career.return.years.length<2){
   let c:UsAmateurReturnCareer=state.career;const year=c.return.years.length;
   if(!c.service||c.service.world.seasonKey===String(Number(c.return.sourceSeasonKey)+year)){c=startUsAmateurReturnYear(c,c.revision,c.events.at(-1)!.version);state={career:c,commands:state.commands+1,step:0};
    if(year===0){const start=performance.now(),raw=advanceUsAmateurReturn(c,c.revision),expected=createHash('sha256').update(canonicalJson(raw)).digest('hex'),baselineMs=performance.now()-start;c=pin(c);const fastStart=performance.now(),fast=advanceUsAmateurReturn(c,c.revision),actual=createHash('sha256').update(canonicalJson(fast)).digest('hex');assert.equal(actual,expected);assert.notEqual(fast.stopReason,'ENGINE_LIMIT');assert.notEqual(usServiceTestProgress(fast.career.service!),usServiceTestProgress(c.service!));state={career:fast.career,commands:state.commands+1,step:1};c=fast.career;process.stdout.write(JSON.stringify({nativeArchivePinReplay:true,sha256:actual,baselineMs,pinnedMs:performance.now()-fastStart,discardedReplayCommands:1})+'\n');}
    else {c=pin(c);state={...state,career:c};}save();}
   const limit=usServiceTestStepLimit(c.service!);let complete=c.service!.phaseContext.phase==='SEASON_REVIEW';
   while(!complete&&state.step<limit){const stamp=usServiceTestProgress(c.service!),next=advanceUsAmateurReturn(c,c.revision);c=next.career;assert.notEqual(next.stopReason,'ENGINE_LIMIT');assert.notEqual(usServiceTestProgress(c.service!),stamp,'native service command must advance a game or date');state={career:c,commands:state.commands+1,step:state.step+1};complete=next.stopReason==='SEASON_COMPLETE';if(state.step%100===0){save();process.stdout.write(JSON.stringify({nativeServiceProgress:true,year:year+1,step:state.step,day:c.service!.phaseContext.phase==='SEASON_PROGRESS'?c.service!.phaseContext.nextWorldDay:null,recordRevision:c.service!.records.revision,sourceSha256:manifest.sha256})+'\n');}}
   assert.ok(complete,'native service must finish its complete schedule');c=settleUsAmateurReturnYear(c,c.revision);state={career:c,commands:state.commands+1,step:0};save();if(year===0){const offer=c.source.minorMarket!.offers.find(o=>o.militaryReturnOption)!;assert.ok(offer);assert.throws(()=>resignUsAfterAmateurReturn(c,c.revision,offer.offerKey),/OPTION_NOT_AVAILABLE/);}process.stdout.write(JSON.stringify({nativeServiceYearComplete:year+1,games:Object.values(c.service!.records.games).filter(g=>g.scope.seasonKey===c.service!.world.seasonKey).length})+'\n');
  }
  const c=state.career;assertNativeServicePrefix(c);/* ponytail: source guard only protects a cache file; memory-only runs share a repo with concurrent editors. */if(file)assertNativeSourceUnchanged(manifest);if(file)writeNativeReturnCache(file,'SERVICE_COMPLETE',manifest,c);cache=c;cacheSource=manifest.sha256;process.stdout.write(JSON.stringify({nativeServicePrefixComplete:true,commands:state.commands,sourceSha256:manifest.sha256,sha256:createHash('sha256').update(canonicalJson(c)).digest('hex')})+'\n');return structuredClone(c);
 };return file?withNativeReturnWriter(file,generate):generate();
}
