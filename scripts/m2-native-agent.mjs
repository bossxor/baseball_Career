import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {advanceKboCareerRun} from '../packages/engine/src/kbo-progress.ts';
import {startKboPostseason,advanceKboPostseason} from '../packages/engine/src/kbo-postseason-progress.ts';
import {settleKboSeasonGrowth} from '../packages/engine/src/kbo-season-growth.ts';
import {closeKboSeason} from '../packages/engine/src/kbo-year-end.ts';
import {acceptKboRenewal,offerKboRenewal} from '../packages/engine/src/kbo-renewal.ts';
import {assertCareerAgentLedger,careerSalaryCounterPreview,hireCareerAgent,openCareerAgentEvents,requestCareerSalaryCounter,resolveCareerAgentEvent} from '../packages/engine/src/career-agent.ts';
import {canonicalSha256 as hash} from '../packages/engine/src/canonical-seal.ts';
import {nativeSliceVerdict,PITCHER_CREATIONS} from './m2-native-paths.mjs';
import {resolveBlockingEvent} from './m2-native-pitcher.mjs';
import {loadPitcherCheckpoint,savePitcherCheckpoint} from './m2-pitcher-checkpoint.mjs';
import {PATH_REQUIREMENTS} from './m2-path-scenarios.mjs';

const creation='HS_PITCHER_COMPOSURE';
const archive='docs/implementation/evidence/M2-20261126-P02-native.json.gz';

function verifiedPrefix(path,sources,reportPath){
 const proof=JSON.parse(gunzipSync(readFileSync(reportPath)));
 const p=proof.paths.find(p=>p.id==='P02');
 const slice=proof.slices.find(s=>s.id===p.proof.sliceId);
 assert.equal(p.status,'ENGINE_NATIVE_PATH_PROVEN');
 assert.equal(proof.sourceDrift,null);
 assert.ok(nativeSliceVerdict(slice,PATH_REQUIREMENTS.P02,hash).ok);
 const prefixSources=new Map(proof.sourceManifest.map(({file,sha256})=>[file,sha256]));
 for(const {file,sha256} of sources){
  if(/^packages\/(engine|rules)\/src\//.test(file))assert.equal(sha256,prefixSources.get(file),file);
 }
 const initial=PITCHER_CREATIONS[creation]();
 const prefix=loadPitcherCheckpoint({path,sourceHash:proof.sourceManifestHash},creation,initial);
 assert.ok(prefix,'P15 needs the original P02 checkpoint');
 assert.deepEqual(prefix.rows,slice.commandReceipts.slice(0,prefix.rows.length));
 assert.equal(prefix.state.phaseContext.phase,'SEASON_PROGRESS');
 return {initial,prefix,manifestHash:proof.sourceManifestHash};
}

function loadResume(checkpoint,sources,initial,resumeManifest){
 if(!resumeManifest)return loadPitcherCheckpoint(checkpoint,creation,initial);
 const previous=JSON.parse(readFileSync(resumeManifest,'utf8'));
 const driverFiles=new Set(['scripts/m2-native-agent.mjs','scripts/verify-m2-closure.mjs']);
 const runtime=rows=>rows.filter(row=>!driverFiles.has(row.file));
 assert.deepEqual(runtime(previous),runtime(sources),'Cannot continue a P15 checkpoint after a runtime source change');
 const sourceHash=hash(previous);
 const resumed=loadPitcherCheckpoint({...checkpoint,sourceHash},creation,initial);
 assert.ok(resumed,'The earlier P15 checkpoint is missing');
 return {...resumed,cursor:{...resumed.cursor,continuedFrom:{sourceHash,step:resumed.cursor.step,receiptCount:resumed.rows.length}}};
}

export function nativeAgentPath(trace,{prefixPath,prefixReport=archive,resumeManifest,checkpoint,sources}){
 assert.ok(prefixPath,'Supply --p15-prefix=<P02 checkpoint>');
 const {initial,prefix,manifestHash}=verifiedPrefix(prefixPath,sources,prefixReport);
 const resumed=loadResume(checkpoint,sources,initial,resumeManifest);
 if(resumed)assert.deepEqual(resumed.rows.slice(0,prefix.rows.length),prefix.rows);
 const continuedFrom=resumed?.cursor.continuedFrom??null;
 const t=trace('P15-native-season-renewal-and-counter',initial,{
  kind:'NATIVE_FROM_CREATION',creation,sourceReport:prefixReport,prefixSourceManifestHash:manifestHash,continuedFrom,
 },{...(resumed??prefix),initialFixture:initial});
 let step=resumed?.cursor.step??0;
 function report(phase,details={}){
  console.log(JSON.stringify({path:'P15',phase,step,receipts:t.rows.length,...details}));
 }
 function record(command,input,apply){
  t.command(command,input,apply);
  step++;
  if(step%3===0){
   savePitcherCheckpoint(checkpoint,creation,t,{step,continuedFrom});
   report(t.state.phaseContext.phase,{worldDay:t.state.days?.days.at(-1)?.day??null});
  }
 }
 report(resumed?'resumed':'verified-p02-prefix',{worldDay:t.state.days.days.at(-1).day});
 if(!t.state.agents?.contracts.length)record('HIRE_AGENT',{agentId:'AG01'},s=>hireCareerAgent(s,s.revision,'AG01'));
 while(t.state.phaseContext.phase!=='SEASON_REVIEW'||!t.state.postseason){
  assert.ok(step<400,'P15 season command budget exhausted');
  const phase=t.state.phaseContext.phase;
  if(phase==='EVENT_DECISION'){
   resolveBlockingEvent({state:t.state,command:record});
  }else if(phase==='SEASON_PROGRESS'){
   record('ADVANCE_KBO_TO_REVIEW',{dayBudget:7},s=>{
    const out=advanceKboCareerRun(s,s.revision,7,()=>true,()=>undefined);
    assert.ok(!['ENGINE_LIMIT','CONTRACT_DECISION_REQUIRED'].includes(out.stopReason),out.stopReason);
    return out;
   });
  }else if(phase==='SEASON_REVIEW'){
   record('START_KBO_POSTSEASON',{},s=>startKboPostseason(s,s.revision));
  }else{
   assert.equal(phase,'POSTSEASON_PROGRESS');
   record('ADVANCE_KBO_POSTSEASON',{},s=>{
    const out=advanceKboPostseason(s,s.revision);
    assert.notEqual(out.stopReason,'ENGINE_LIMIT');
    return out;
   });
  }
 }
 const c=t.state;
 assert.ok(c.postseason.championKey,'KBO postseason has no champion');
 const season=c.world.seasonKey;
 const regularGames=Object.values(c.records.games).filter(g=>g.scope.seasonKey===season&&g.scope.leagueKey==='KBO'&&g.scope.phase==='REGULAR').length;
 assert.equal(regularGames,720);
 const agentKey=c.agents.contracts[0].contractKey;
 const payroll=c.agents.income.filter(row=>row.agentContractKey===agentKey&&row.seasonKey===season&&row.kind==='SALARY');
 const gross=payroll.reduce((sum,r)=>sum+r.gross,0),fee=payroll.reduce((sum,r)=>sum+r.fee,0),net=payroll.reduce((sum,r)=>sum+r.net,0);
 assert.ok(gross>0&&fee>0);
 assert.equal(fee,Math.floor(gross/50));
 assert.equal(net,gross-fee);
 assertCareerAgentLedger(c);
 if(!t.state.seasonGrowth.entries.length)record('SETTLE_KBO_SEASON_GROWTH',{},s=>settleKboSeasonGrowth(s,s.revision));
 if(!t.state.seasonClose)record('CLOSE_KBO_SEASON',{forfeitUnusedTraining:true},s=>closeKboSeason(s,s.revision,true));
 if(!t.state.renewal)record('OFFER_KBO_RENEWAL',{},s=>offerKboRenewal(s,s.revision));
 const first=t.state.renewal;
 assert.ok(first,'P15 expected an original-club renewal');
 const originalEvent=t.state.events.find(e=>e.eventKey===first.eventKey);
 if(!t.state.agents.salaryRequests.length){
  if(!t.state.agents.notices.some(e=>e.definitionId==='E92'))record('OPEN_CAREER_AGENT_EVENTS',{},s=>openCareerAgentEvents(s,s.revision));
  const offer=careerSalaryCounterPreview(t.state);
  assert.equal(offer.deadlineWorldDay,originalEvent.deadlineWorldDay);
  const notice=t.state.agents.notices.find(e=>e.definitionId==='E92'&&e.status==='OPEN');
  assert.ok(notice,'P15 expected a current salary counter notice');
  const option=offer.options.findLast(o=>o.eligible);
  assert.ok(option,'P15 expected a budget-eligible salary counter');
  const input={eventKey:notice.eventKey,eventVersion:notice.version,command:'REQUEST_SALARY_COUNTER',previewId:offer.previewId,raiseBps:option.raiseBps};
  record('REQUEST_SALARY_COUNTER',input,s=>resolveCareerAgentEvent(s,s.revision,input));
 }
 const request=t.state.agents.salaryRequests.at(-1);
 const rejected=request.outcome==='REJECTED';
 if(t.state.renewal.status==='OFFERED'){
  const preview=careerSalaryCounterPreview(t.state);
  assert.equal(preview.requestUsed,true);
  assert.equal(preview.baseOfferState,rejected?'ACTIVE':'SUPERSEDED');
  if(rejected)assert.equal(t.state.renewal.annualSalaryWon,request.baseSalary);
  assert.throws(()=>requestCareerSalaryCounter(t.state,t.state.revision,{previewId:preview.previewId,raiseBps:request.raiseBps}),/AGENT_REQUEST_USED/);
  const accept={eventKey:first.eventKey,eventVersion:originalEvent.version,offerKey:request.counterOfferKey??request.baseOfferKey};
  record('ACCEPT_KBO_RENEWAL',accept,s=>acceptKboRenewal(s,s.revision,accept));
 }
 assert.equal(t.state.renewal.status,'ACCEPTED');
 assert.equal(t.state.renewal.annualSalaryWon,request.annualSalary);
 assert.equal(t.state.events.find(e=>e.eventKey===first.eventKey).status,'RESOLVED');
 assert.throws(()=>careerSalaryCounterPreview(t.state),/AGENT_SALARY_OFFER_NOT_AVAILABLE/);
 return t.finish({variantOf:'P15',regularGames,champion:c.postseason.championKey,gross,fee,net,payrollReceipts:payroll.length,
  counterOutcome:request.outcome,rejectedOriginalPreserved:rejected?true:null,
  deadlineWorldDay:originalEvent.deadlineWorldDay,closedOfferRejected:true,
  unproven:['A real finite deadline exhausted before an otherwise eligible counter',...(!rejected?['Native rejected counter preserving original offer']:[])]});
}
