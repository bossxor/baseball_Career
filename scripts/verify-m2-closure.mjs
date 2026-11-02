import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {canonicalJson} from '../packages/engine/src/game.ts';
import {createHighSchoolWorld, assertHighSchoolWorld} from '../packages/engine/src/high-school-world.ts';
import {createHighSchoolCareer, confirmCareerPlayer, resolveCareerFocusEvent, confirmCareerPreseason} from '../packages/engine/src/high-school-career.ts';
import {advanceHighSchoolCareer, resolveCareerWindowEvent} from '../packages/engine/src/high-school-progress.ts';
import {resolveHiddenTraitNotice} from '../packages/engine/src/trait-notices.ts';
import {acknowledgeHighSchoolSeasonReview, openHighSchoolCareerRoute, highSchoolCareerRouteView, enrollHighSchoolCollege} from '../packages/engine/src/high-school-route.ts';
import {closeHighSchoolSeasonForCollege, startAdmittedCollegeSeason} from '../packages/engine/src/college-entry.ts';
import {assertCollegeWorld} from '../packages/engine/src/college-world.ts';
import {enteredKboCareer} from '../packages/engine/test/fixtures.ts';
import {confirmKboPreseasonPlan} from '../packages/engine/src/kbo-preseason.ts';
import {confirmKboOpeningRoster} from '../packages/engine/src/kbo-opening-roster.ts';
import {confirmKboSeasonSchedule} from '../packages/engine/src/kbo-schedule.ts';
import {startKboRegularSeason, advanceKboCareer} from '../packages/engine/src/kbo-progress.ts';
import {setCareerSeasonGoals} from '../packages/engine/src/season-goals.ts';
import {hireCareerAgent, assertCareerAgentLedger} from '../packages/engine/src/career-agent.ts';
import {recordTotals} from '../packages/engine/src/records.ts';
import {controlledSchoolPaths,collegeServicePath,agentPath,pitcherLearningPath,nationalAppearancePath,postingPaths,retryExhaustionPath,injuryTrainingPath} from './m2-path-scenarios.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const hash=value=>createHash('sha256').update(canonicalJson(value)).digest('hex');
const json=value=>JSON.parse(JSON.stringify(value));
let activeTrace;
const completedTraces=[];

/** Engine receipts are not API idempotency receipts. Each row retains the actual command input and output hash. */
function trace(id,initial,prefix){
 let state=initial;
 const initialFixture=json(initial);
 const rows=[];
 const current={id,prefix,initialFixture,get state(){return state;},rows,
  command(command,input,apply){
   const source=state,before=hash(source),commandInput=json(input),inputHash=hash(commandInput),out=apply(source),next=out?.career??out;
   assert.equal(hash(source),before,'command mutated its input');
   assert.equal(hash(input),inputHash,'command mutated its input arguments');
   assert.equal(hash(json(next)),hash(next),'state must survive JSON');
   // Replay from serialized source, with the same exact command input and revision.
   const replaySource=json(source),replay=apply(replaySource);assert.equal(hash(replaySource),before,'replay mutated its input');assert.equal(hash(replay),hash(out),'JSON replay diverged');
   rows.push({command,input:commandInput,inputHash,sourceRevision:source.revision,resultRevision:next.revision,sourceHash:before,resultHash:hash(next),outputHash:hash(out)});
   state=next;return state;
  },
  finish(invariantReport){const result={id,pathIds:[...new Set(id.match(/P\d{2}/g)??[])],prefix,initialFixture,initialFixtureHash:hash(initialFixture),commandReceipts:rows,commandChainHash:hash(rows),finalStateHash:hash(state),invariantReport,status:'M2_SLICE_PROVEN_FULL_PATH_NOT_CLAIMED'};completedTraces.push(result);current.finished=true;return result;}
 };
 activeTrace=current;return current;
}
function resolveSchoolEvent(t){
 const c=t.state,e=c.events.find(e=>e.eventKey===c.phaseContext.eventKey);assert.ok(e);
 const command=['E01','E02','E03'].includes(e.definitionId)?'KEEP_FOCUS':e.definitionId==='E84'?'OPEN_TRAITS':e.definitionId==='E43'?'FORFEIT_TRAINING':'ACK_EVENT';
 const input={eventKey:e.eventKey,eventVersion:e.version,command};
 t.command('resolve:'+e.definitionId,input,s=>['E01','E02','E03'].includes(e.definitionId)?resolveCareerFocusEvent(s,s.revision,input):e.definitionId==='E84'?resolveHiddenTraitNotice(s,s.revision,input):resolveCareerWindowEvent(s,s.revision,input));
}
function nativeSchool(){
 const initial=createHighSchoolCareer(createHighSchoolWorld({worldKey:'m2-closure-native',seasonKey:'2032',seasonYear:2032,seed:'m2-closure-native-v1',schoolId:'H01',player:{simulationKey:'own',name:'경로 검증',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 const t=trace('P03-native-HS-to-college-entry',initial,{kind:'NATIVE_FROM_CREATION',description:'Actual 216-game HS season; college admission/year entry. College48 games and second-year completion remain outside this slice.'});
 t.command('CONFIRM_PLAYER',{},s=>confirmCareerPlayer(s,s.revision));resolveSchoolEvent(t);
 t.command('CONFIRM_PRESEASON',{},s=>confirmCareerPreseason(s,s.revision));
 for(let count=0;t.state.phaseContext.phase!=='SEASON_REVIEW';count++){
  assert.ok(count<1800,'native HS command budget exhausted');
  if(t.state.phaseContext.phase==='EVENT_DECISION')resolveSchoolEvent(t);
  else t.command('ADVANCE_HS',{mode:'NEXT_MAJOR_EVENT'},s=>{const out=advanceHighSchoolCareer(s,s.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');return out;});
 }
 assertHighSchoolWorld(t.state.world);
 const totals=recordTotals(t.state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'});
 assert.equal(Object.keys(t.state.records.games).length,216);assert.ok(Object.values(totals.teams).every(team=>team.games===48));
 t.command('ACKNOWLEDGE_HS_REVIEW',{},s=>acknowledgeHighSchoolSeasonReview(s,s.revision));
 t.command('OPEN_CAREER_ROUTE',{eventVersion:1},s=>openHighSchoolCareerRoute(s,s.revision,1));
 const view=highSchoolCareerRouteView(t.state),offer=view.colleges.find(c=>c.id==='U07');assert.ok(offer?.eligible);
 const enrollment={eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'};
 const before=hash(t.state);assert.throws(()=>enrollHighSchoolCollege(t.state,t.state.revision-1,enrollment),/REVISION/);assert.equal(hash(t.state),before);
 t.command('ENROLL_COLLEGE',enrollment,s=>enrollHighSchoolCollege(s,s.revision,enrollment));
 t.command('CLOSE_HS_FOR_COLLEGE',{forfeitUnusedTraining:true},s=>closeHighSchoolSeasonForCollege(s,s.revision,true));
 t.command('START_ADMITTED_COLLEGE',{},s=>startAdmittedCollegeSeason(s,s.revision));
 assertCollegeWorld(t.state.world);assert.equal(t.state.collegeAdmission.academicYear,1);assert.equal(Object.keys(t.state.records.games).length,216);
 return t.finish({highSchoolLeagueGames:216,gamesPerTeam:48,collegeAcademicYear:1,oldRecordsPreserved:true,staleRevisionRejectedAtomically:true,jsonReplay:'every command',sourceImmutability:'every command'});
}
function controlledKbo(){
 const initial=enteredKboCareer(),t=trace('P01-P15-P23-controlled-KBO-entry-and-game',initial,{kind:'CONTROLLED_PREFIX_NATIVE_SLICE',fixture:'packages/engine/test/fixtures.ts:enteredKboCareer',description:'Controlled no-appearance HS records and abilities80; real draft/signing/year-entry in fixture. Traced commands begin at KBO preseason; P23 covers immutable committed record reads only. No native HS-to-KBO full-path or M7 replay/export claim.'});
 t.command('SET_GOALS',{goalIds:['G01','G03']},s=>setCareerSeasonGoals(s,s.revision,['G01','G03']));
 t.command('HIRE_AGENT',{agentId:'AG01'},s=>hireCareerAgent(s,s.revision,'AG01'));
 t.command('CONFIRM_KBO_PRESEASON',{},s=>confirmKboPreseasonPlan(s,s.revision));
 t.command('CONFIRM_KBO_OPENING',{},s=>confirmKboOpeningRoster(s,s.revision));
 t.command('CONFIRM_KBO_SCHEDULE',{},s=>confirmKboSeasonSchedule(s,s.revision));
 t.command('START_KBO_REGULAR',{},s=>startKboRegularSeason(s,s.revision));
 for(let count=0;Object.keys(t.state.records.games).length===216;count++){
  assert.ok(count<100,'KBO command budget exhausted');
  t.command('ADVANCE_KBO',{maxDays:1},s=>advanceKboCareer(s,s.revision,1));
 }
 assertCareerAgentLedger(t.state);assert.equal(t.state.achievements.unlocks.some(a=>a.achievementId==='A01'),true);
 const committed=hash(t.state.records),world=hash(t.state.world),scope={seasonKey:t.state.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'};
 for(let i=0;i<2;i++)t.command('READ_COMMITTED_RECORD_TOTALS',{scope},s=>({career:s,projection:recordTotals(s.records,scope)}));
 assert.equal(hash(t.state.records),committed);assert.equal(hash(t.state.world),world);
 return t.finish({actualProGames:Object.values(t.state.records.games).filter(g=>g.scope.seasonKey===t.state.world.seasonKey).length,agentLedgerValid:true,firstContractAchievement:true,committedRecordHash:committed,repeatedRecordReadsImmutable:true,jsonReplay:'every command',sourceImmutability:'every command',unproven:['P14 same-game trait/goal/chronicle integration','P23 M7 replay/card/export/backup']});
}
function files(directory){return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(resolve(directory,entry.name)):[resolve(directory,entry.name)]);}
const sourceManifest=()=>[...['packages/engine/src','packages/rules/src','packages/engine/test'].flatMap(dir=>files(resolve(root,dir))).filter(path=>/\.(ts|json)$/.test(path)),...['scripts/verify-m2-closure.mjs','scripts/m2-path-scenarios.mjs','docs/design/event-catalog-v2.json','docs/design/end-to-end-design-paths.json','package.json','package-lock.json'].map(file=>resolve(root,file))].sort().map(path=>({file:relative(root,path).replaceAll('\\','/'),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
const start=sourceManifest();
const output=resolve(root,process.argv.slice(2).find(arg=>!arg.startsWith('--'))??'docs/implementation/evidence/M2-CLOSURE-20261102-runtime.json');
function writeEvidence(path,value){mkdirSync(resolve(path,'..'),{recursive:true});const data=JSON.stringify(value,null,2)+'\n';writeFileSync(path,path.endsWith('.gz')?gzipSync(data):data);}
const slices=[];
try{
console.log('M2 closure: real commands and per-command JSON replay; controlled prefixes remain explicit');
const scenarios={nativeSchool:()=>[nativeSchool()],nativeKbo:()=>[controlledKbo()],school:()=>controlledSchoolPaths(trace),collegeService:()=>[collegeServicePath(trace)],agent:()=>agentPath(trace),pitcher:()=>[pitcherLearningPath(trace)],national:()=>[nationalAppearancePath(trace)],posting:()=>postingPaths(trace),retry:()=>[retryExhaustionPath(trace)],injury:()=>[injuryTrainingPath(trace)]};
const selection=process.argv.find(arg=>arg.startsWith('--scenarios='))?.slice('--scenarios='.length);
const selected=selection===undefined?Object.keys(scenarios).filter(name=>!process.argv.includes('--paths-only')||!name.startsWith('native')):selection.split(',');
assert.ok(selected.length>0&&new Set(selected).size===selected.length&&selected.every(name=>Object.hasOwn(scenarios,name)),'unknown, empty or duplicate closure scenario');
for(const name of selected){slices.push(...scenarios[name]());console.log('M2 closure: '+name+' endpoints verified');}
assert.deepEqual(sourceManifest(),start,'source changed during closure proof; rerun on stable files');
const catalogue=JSON.parse(readFileSync(resolve(root,'docs/design/event-catalog-v2.json'),'utf8')).events;
const events=catalogue.map(e=>{
 const literal=new RegExp(`['"]${e.id}['"]`),sourceReferences=start.filter(r=>r.file.startsWith('packages/engine/src/')&&!r.file.endsWith('/event-catalogue.ts')&&literal.test(readFileSync(resolve(root,r.file),'utf8'))).map(r=>r.file),testReferences=start.filter(r=>r.file.endsWith('.test.ts')&&literal.test(readFileSync(resolve(root,r.file),'utf8'))).map(r=>r.file);
 const owner=['E38','E39','E40','E77','E78','E79','E80','E81','E97'].includes(e.id)?'M6':e.id==='E82'?'M6/M7':e.id==='E98'||e.id==='E99'?'M7_PRODUCER_M2_CATALOGUE_GUARDS':e.id==='E83'?'M2_INPUT_M4_FORM':e.id==='E85'?'M2_UNREAD_SUMMARY':'M2';
 return {id:e.id,title:e.title,owner,sourceReferences,testReferences,status:'SOURCE_TRIAGE_ONLY_NOT_RUNTIME_PASS'};
});
assert.equal(events.length,99);assert.equal(new Set(events.map(e=>e.id)).size,99);
const paths=JSON.parse(readFileSync(resolve(root,'docs/design/end-to-end-design-paths.json'),'utf8')).paths.map(p=>({id:p.id,flow:p.flow,status:'FULL_PATH_NOT_PROVEN',sliceIds:slices.filter(s=>s.pathIds.includes(p.id)).map(s=>s.id)}));
assert.equal(paths.length,24);
const result={schemaVersion:1,status:'PARTIAL_RUNTIME_EVIDENCE_NOT_M2_COMPLETION',rulesVersion:slices[0].initialFixture.world.rulesVersion,sourceManifestHash:hash(start),sourceManifest:start,slices,events,paths,externalDependencies:['M3 persistent CAS/receipt/idempotency/two-device/Neon','M4/M5 actual screens/accessibility/visual silhouette inspection','M6 club paths and unified world workers','M7 chronicle producer/export/backup','M8 actual device execution'],unproven:'Unexecuted path segments, events and PF checks are not inferred from these command hashes. Source/test references are triage only.'};
assert.deepEqual(sourceManifest(),start,'source changed while building closure inventory; rerun on stable files');
writeEvidence(output,result);
console.log(JSON.stringify({status:result.status,sourceManifestHash:result.sourceManifestHash,slices:slices.map(({id,commandChainHash,finalStateHash,commandReceipts})=>({id,commandChainHash,finalStateHash,commands:commandReceipts.length})),output},null,2));
}catch(error){
 const end=sourceManifest(),failure={schemaVersion:1,status:'FAILED_RUNTIME_EVIDENCE_NOT_M2_COMPLETION',sourceManifestHash:hash(start),sourceManifest:start,sourceUnchanged:hash(start)===hash(end),finalSourceManifestHash:hash(end),error:{name:error.name,message:error.message,stack:error.stack},completedSlices:completedTraces,interruptedSlice:activeTrace&&!activeTrace.finished?{id:activeTrace.id,prefix:activeTrace.prefix,initialFixture:activeTrace.initialFixture,initialFixtureHash:hash(activeTrace.initialFixture),commandReceipts:activeTrace.rows,commandChainHash:hash(activeTrace.rows),lastStateHash:hash(activeTrace.state),status:'INTERRUPTED_NOT_PROVEN'}:null};
 const failedOutput=output.replace(/\.json(?:\.gz)?$/,'')+'-failed.json'+(output.endsWith('.gz')?'.gz':'');writeEvidence(failedOutput,failure);console.error(JSON.stringify({status:failure.status,error:failure.error.message,failedOutput}));process.exitCode=1;
}
