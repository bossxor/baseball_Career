// HTTP measurement with PGlite or isolated local PostgreSQL. Fixtures precede the measured season; no game is skipped within it.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Session} from 'node:inspector';
import {channel} from 'node:diagnostics_channel';
import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import {createTestDb,createDbFromUrl,M3_CORE_SQL,seedAllowedSubject,seedSave,gameSaves} from '@playball/db';
import {setEngineTimingObserver} from '@playball/engine';
import {readOwnedSave} from '../apps/api/src/save-state.ts';
import {canonicalSha256} from '../packages/engine/src/canonical-seal.ts';
import {createApp} from '../apps/api/src/app.ts';
import {createNativeHs} from './m2-native-paths.mjs';
import {enrolledCollegeCareer,enteredKboCareer} from '../packages/engine/test/fixtures.ts';
import {preparedUsOptionCareer} from '../packages/engine/test/us-option-fixture.ts';
import {profileStateSize} from './profile-state-size.mjs';

const memoryMode=process.argv.includes('--memory'),timingMode=process.argv.includes('--timing'),cpuEnabled=!process.argv.includes('--no-cpu');
let activeCommand=null;
let timing=null;
const engineCategories=()=>({simulation:0,dayClose:0,validation:0,clone:0,seal:0,gameContext:0});
const memory=(stage,extra={})=>console.error(JSON.stringify({diagnostic:'memory',stage,command:activeCommand,...process.memoryUsage(),...extra}));
if(memoryMode||timingMode){
 channel('playball.command.memory').subscribe(({stage})=>{
  if(memoryMode)memory(stage);
  if(!timing)return;
  timing.stages.set(stage,performance.now());
  if(stage==='engine-start'){
   const totals=timing.engine;
   setEngineTimingObserver({now:()=>performance.now(),record:(category,elapsedMs)=>{totals[category]+=elapsedMs;}});
  }
  if(stage==='engine-return'||stage==='engine-error')setEngineTimingObserver();
 });
 if(timingMode)channel('playball.save-state.write-timing').subscribe(data=>{if(timing)timing.codec=data;});
 const original=gameSaves.state.mapToDriverValue;
 gameSaves.state.mapToDriverValue=function(value){
  if(memoryMode&&activeCommand)memory('serialize-start');
  const start=timing?performance.now():0;
  let result;
  try{result=original.call(this,value);}
  catch(error){if(memoryMode&&activeCommand)memory('serialize-error',{errorName:error?.name});throw error;}
  finally{if(timing)timing.rowJsonMs+=performance.now()-start;}
  if(memoryMode&&activeCommand){
   memory('serialize-return',{bytes:Buffer.byteLength(result)});
   if(process.argv.includes('--size')&&result.length>=100_000_000)memory('state-sizes',{rows:profileStateSize(result)});
  }
  return result;
 };
}
function saveTiming(timing){
 const {codec,rowJsonMs,stages}=timing;
 if(!codec||!stages.has('receipt-return'))return undefined;
 const duration=(first,last)=>stages.get(last)-stages.get(first);
 const rowSqlMs=Math.max(0,duration('row-update-start','update-return')-rowJsonMs);
 return {
  stateFormat:codec.stateFormat,
  codecMs:codec.codecMs,rowJsonMs,serializationMs:codec.codecMs+rowJsonMs,
  hashingMs:codec.hashingMs,
  sqlWriteMs:codec.partsSqlMs+rowSqlMs+duration('receipt-start','receipt-return'),
 };
}
function engineTiming(timing){
 const {engine:{gameContext,...categories},stages}=timing;
 if(!stages.has('engine-return'))return undefined;
 const elapsedMs=stages.get('engine-return')-stages.get('engine-start');
 // Keep the original residual comparable with existing reports.
 return {elapsedMs,...categories,gameContext,residualMs:elapsedMs-Object.values(categories).reduce((sum,ms)=>sum+ms,0)};
}
function totalTimings(commands, field, totals){
 let measuredCommands=0;
 for(const command of commands){
  if(!command[field])continue;
  measuredCommands++;
  for(const key of Object.keys(totals))totals[key]+=command[field][key];
 }
 return {measuredCommands,...totals};
}
if(process.argv.includes('--self-check')){
 assert.ok(memoryMode);activeCommand='self-check';const original={schemaVersion:1,career:{name:'test'}};
 assert.deepEqual(JSON.parse(gameSaves.state.mapToDriverValue(original)),original);channel('playball.command.memory').publish({stage:'self-check'});
 const samples=[{saveTiming:{codecMs:2}},{engineTiming:{elapsedMs:8}},{saveTiming:{codecMs:5}}];
 assert.deepEqual(totalTimings(samples,'saveTiming',{codecMs:0}),{measuredCommands:2,codecMs:7});
 console.log('memory self-check passed');process.exit(0);
}
const league=process.argv[2], output=process.argv[3];
assert.ok(['school','college','kbo','us'].includes(league)&&output,'usage: node --import tsx scripts/profile-career-api.mjs school|college|kbo|us output.json');
const source=({school:createNativeHs,college:enrolledCollegeCareer,kbo:enteredKboCareer,us:preparedUsOptionCareer})[league]();
const initialHash=canonicalSha256(source),subject='profile-'+league,saveId='profile-'+league;
const backend=process.argv.includes('--postgres')?'postgres':'pglite';
let db,client,databaseVersion;
if(backend==='postgres'){
 let url;
 try{url=new URL(process.env.PLAYBALL_PROFILE_DATABASE_URL);}catch{throw new Error('Invalid profile database URL');}
 assert.ok(['postgres:','postgresql:'].includes(url.protocol)&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&/^\/playball_profile_[^/]+$/.test(url.pathname)&&!url.search,'Profile database must be local and named playball_profile_*');
 const connection=createDbFromUrl(url.toString());db=connection.db;client={close:()=>connection.pool.end()};
 try{await connection.pool.query(M3_CORE_SQL);databaseVersion=(await connection.pool.query('SHOW server_version')).rows[0].server_version;}
 catch{await client.close();throw new Error('Profile database initialization failed');}
}else{
 ({db,client}=await createTestDb());
 try{databaseVersion=(await client.query('SHOW server_version')).rows[0].server_version;}
 catch(error){await client.close();throw error;}
}
try{
 await seedAllowedSubject(db,subject);
 await seedSave(db,{id:saveId,ownerId:subject,state:{schemaVersion:1,career:source}});
}catch{await client.close();throw new Error('Profile database seeding failed');}
const app=createApp({db,auth:{allowDevBearer:true}}),headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};
const request=(path,options={})=>app.request(path,{...options,headers});
const state=()=>readOwnedSave(db,subject,saveId);
const session=cpuEnabled?new Session():null;session?.connect();
const inspector=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(err,result)=>err?reject(err):resolve(result)));
let result={backend,databaseVersion,league,fixture:'controlled pre-season fixture',initialHash,status:'running',commands:[],node:process.version,platform:process.platform,arch:process.arch,method:cpuEnabled?'V8 CPU samples collected during HTTP commands and intervening reads; percentages are CPU sample shares, not wall time':'CPU profiling disabled',memoryMode};
result.spanBudgetMs=Number(process.env.PLAYBALL_SPAN_BUDGET_MS??25_000);
if(timingMode)result.saveTimingMethod='Per committed command: state codec traversal plus row-state JSON mapper, part hashes, and awaited write statements with row-state JSON time removed. SQL timing includes driver/ORM overhead; excludes reads, locking and transaction commit.';
if(timingMode)result.engineTimingMethod='Exclusive synchronous wall milliseconds inside applyEngineCommand: PA loop, instrumented day settlements, selected validators and state copies, canonical SHA seals. Remaining engine work is residual; HTTP views are outside this boundary.';
let current=source,currentHost,revision=0,profile;
const start=performance.now();
try{
 if(cpuEnabled){await inspector('Profiler.enable');await inspector('Profiler.setSamplingInterval',{interval:1000});await inspector('Profiler.start');}
 for(let n=0;n<3000;n++){
  const phase=current.phaseContext.phase;
  if(phase==='SEASON_REVIEW'){result.status='season_review';break;}
  let command;
  if(league==='school'&&!['EVENT_DECISION','SEASON_PROGRESS'].includes(phase)){
   const response=await request('/api/saves/'+saveId+'/career');assert.equal(response.status,200);const view=await response.json();
   command=view.nextActions.find(x=>x.command)?.command;
  }
  if(!command){
   const response=await request('/api/saves/'+saveId+'/screens/CAREER_FLOW');assert.equal(response.status,200,await response.clone().text());const view=await response.json();
   command=view.commands.find(x=>x.id==='adv-season'||x.id==='school-progress')??view.commands.find(x=>x.id==='continue'||x.id==='school-keep-focus')??view.commands.find(x=>x.id==='forfeit_training')??view.commands.find(x=>x.id==='defer_training'||x.payload.command==='DEFER_TRAINING')??view.commands.find(x=>x.id==='ack_event'||x.payload.command==='ACK_EVENT')??view.commands[0];
  }
  if(!command){result.status='unsupported_event';result.blockedPhase=phase;result.event=current.events?.find(e=>e.eventKey===current.phaseContext.eventKey)?.definitionId;break;}
  const body={commandId:'profile-'+n,expectedRevision:revision,type:command.type,payload:command.payload};
  const requestBody=JSON.stringify(body);
  const commandHash=createHash('sha256').update(requestBody).digest('hex');
  const begin=performance.now();
  activeCommand=body.type;if(memoryMode)memory('request-start');
  if(timingMode)timing={stages:new Map(),rowJsonMs:0,engine:engineCategories()};
  const response=await request('/api/saves/'+saveId+'/commands',{method:'POST',body:requestBody}),elapsedMs=performance.now()-begin;
  if(memoryMode)memory('request-return',{status:response.status});activeCommand=null;
  const save=timing&&response.ok?saveTiming(timing):undefined;
  const engine=timing&&response.ok?engineTiming(timing):undefined;
  timing=null;
  const data=await response.json();result.commands.push({type:body.type,commandHash,phase,elapsedMs,status:response.status,stop:data.summary?.spanStop??data.summary?.stopReason,...(save?{saveTiming:save}:{}),...(engine?{engineTiming:engine}:{})});
  if(!response.ok){result.status='http_error';result.error=data;break;}
  const row=await state();current=row.state.career;currentHost=row.state.collegeNationalHost;revision=Number(row.revision);
  const host=currentHost?.game;
  const hostProgress=host?{season:host.world.seasonKey,phase:host.phase,nextWorldDay:host.progress?.nextWorldDay??null,recordRevision:host.records.revision}:undefined;
  console.log(JSON.stringify({league,command:n,type:body.type,stop:data.summary?.spanStop??data.summary?.stopReason??null,phase:current.phaseContext.phase,nextWorldDay:current.phaseContext.nextWorldDay??null,games:Object.keys(current.records.games).length,hostProgress,elapsedSeconds:Math.round((performance.now()-start)/1000)}));
 }
}catch(error){result.status='error';result.error=backend==='postgres'?'Profile operation failed':String(error.stack??error);}
finally{
 if(timingMode)setEngineTimingObserver();
 try{
 if(timingMode){
  result.engineTimingTotals=totalTimings(result.commands,'engineTiming',{elapsedMs:0,...engineCategories(),residualMs:0});
  result.saveTimingTotals=totalTimings(result.commands,'saveTiming',{codecMs:0,rowJsonMs:0,serializationMs:0,hashingMs:0,sqlWriteMs:0});
 }
 if(cpuEnabled){try{profile=(await inspector('Profiler.stop')).profile;}catch(error){result.profileError=String(error);}session.disconnect();}
 result.wallMs=performance.now()-start;result.finalHash=canonicalSha256(current);result.initialHashUnchanged=canonicalSha256(source)===initialHash;
 result.finalHostHash=currentHost?canonicalSha256(currentHost):null;
 result.commandSequenceHash=canonicalSha256(result.commands.map(({commandHash})=>commandHash));
 result.finalPhase=current.phaseContext.phase;result.finalGames=Object.values(current.records.games).filter(g=>g.scope.seasonKey===current.world.seasonKey&&g.scope.phase==='REGULAR').length;
 if(profile){const nodes=new Map(profile.nodes.map(n=>[n.id,n])),totals=new Map();for(let i=0;i<profile.samples.length;i++){const frame=nodes.get(profile.samples[i])?.callFrame;if(!frame)continue;const key=(frame.functionName||'(anonymous)')+' '+frame.url;totals.set(key,(totals.get(key)??0)+(profile.timeDeltas[i]??0));}result.cpuSamples=profile.samples.length;result.topSelfCpu=Array.from(totals,([frame,microseconds])=>({frame,microseconds})).sort((a,b)=>b.microseconds-a.microseconds).slice(0,40);result.cpuProfile=profile;}
 writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({league,status:result.status,wallMs:result.wallMs,finalGames:result.finalGames,commands:result.commands.length,output}));
 }finally{await client.close();}
}
if(result.status!=='season_review'||!result.initialHashUnchanged)process.exitCode=1;
