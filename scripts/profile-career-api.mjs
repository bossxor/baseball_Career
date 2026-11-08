// HTTP/PGlite measurement only. Fixtures precede the measured season; no game is skipped within it.
import assert from 'node:assert/strict';
import {Session} from 'node:inspector';
import {channel} from 'node:diagnostics_channel';
import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import {createTestDb,seedAllowedSubject,seedSave,gameSaves} from '@playball/db';
import {eq} from 'drizzle-orm';
import {canonicalSha256} from '../packages/engine/src/canonical-seal.ts';
import {createApp} from '../apps/api/src/app.ts';
import {createNativeHs} from './m2-native-paths.mjs';
import {enrolledCollegeCareer,enteredKboCareer} from '../packages/engine/test/fixtures.ts';
import {preparedUsOptionCareer} from '../packages/engine/test/us-option-fixture.ts';
import {profileStateSize} from './profile-state-size.mjs';

const memoryMode=process.argv.includes('--memory'),cpuEnabled=!process.argv.includes('--no-cpu');
let activeCommand=null;
const memory=(stage,extra={})=>console.error(JSON.stringify({diagnostic:'memory',stage,command:activeCommand,...process.memoryUsage(),...extra}));
if(memoryMode){
 channel('playball.command.memory').subscribe(({stage})=>memory(stage));
 const original=gameSaves.state.mapToDriverValue;
 gameSaves.state.mapToDriverValue=function(value){
  if(activeCommand)memory('serialize-start');
  try{const result=original.call(this,value);if(activeCommand){memory('serialize-return',{bytes:Buffer.byteLength(result)});if(process.argv.includes('--size')&&result.length>=100_000_000)memory('state-sizes',{rows:profileStateSize(result)});}return result;}
  catch(error){if(activeCommand)memory('serialize-error',{errorName:error?.name});throw error;}
 };
}
if(process.argv.includes('--self-check')){
 assert.ok(memoryMode);activeCommand='self-check';const original={schemaVersion:1,career:{name:'test'}};
 assert.deepEqual(JSON.parse(gameSaves.state.mapToDriverValue(original)),original);channel('playball.command.memory').publish({stage:'self-check'});
 console.log('memory self-check passed');process.exit(0);
}
const league=process.argv[2], output=process.argv[3];
assert.ok(['school','college','kbo','us'].includes(league)&&output,'usage: node --import tsx scripts/profile-career-api.mjs school|college|kbo|us output.json');
const source=({school:createNativeHs,college:enrolledCollegeCareer,kbo:enteredKboCareer,us:preparedUsOptionCareer})[league]();
const initialHash=canonicalSha256(source),subject='profile-'+league,saveId='profile-'+league;
const {db,client}=await createTestDb();
await seedAllowedSubject(db,subject);
await seedSave(db,{id:saveId,ownerId:subject,state:{schemaVersion:1,career:source}});
const app=createApp({db,auth:{allowDevBearer:true}}),headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};
const request=(path,options={})=>app.request(path,{...options,headers});
const state=async()=>((await db.select({state:gameSaves.state,revision:gameSaves.revision}).from(gameSaves).where(eq(gameSaves.id,saveId)))[0]);
const session=cpuEnabled?new Session():null;session?.connect();
const inspector=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(err,result)=>err?reject(err):resolve(result)));
let result={league,fixture:'controlled pre-season fixture',initialHash,status:'running',commands:[],node:process.version,platform:process.platform,arch:process.arch,method:cpuEnabled?'V8 CPU samples collected during HTTP commands and intervening reads; percentages are CPU sample shares, not wall time':'CPU profiling disabled',memoryMode};
let current=source,revision=0,profile;
const start=performance.now();
try{
 if(cpuEnabled){await inspector('Profiler.enable');await inspector('Profiler.setSamplingInterval',{interval:1000});await inspector('Profiler.start');}
 for(let n=0;n<3000;n++){
  const phase=current.phaseContext.phase;
  if(phase==='SEASON_REVIEW'){result.status='season_review';break;}
  let command;
  if(league==='school'){
   const response=await request('/api/saves/'+saveId+'/career');assert.equal(response.status,200);const view=await response.json();
   command=view.nextActions.find(x=>x.command)?.command;
   if(command?.type==='CAREER_SCHOOL_ADVANCE')command.payload.mode='NEXT_MAJOR_EVENT';
  }else{
   const response=await request('/api/saves/'+saveId+'/screens/CAREER_FLOW');assert.equal(response.status,200,await response.clone().text());const view=await response.json();
   command=view.commands.find(x=>x.id==='adv-season')??view.commands.find(x=>x.id==='continue')??view.commands.find(x=>x.id==='forfeit_training')??view.commands.find(x=>x.id==='defer_training')??view.commands.find(x=>x.id==='ack_event')??view.commands[0];
  }
  if(!command){result.status='unsupported_event';result.blockedPhase=phase;result.event=current.events?.find(e=>e.eventKey===current.phaseContext.eventKey)?.definitionId;break;}
  const body={commandId:'profile-'+n,expectedRevision:revision,type:command.type,payload:command.payload},begin=performance.now();
  activeCommand=body.type;if(memoryMode)memory('request-start');
  const response=await request('/api/saves/'+saveId+'/commands',{method:'POST',body:JSON.stringify(body)}),elapsedMs=performance.now()-begin;
  if(memoryMode)memory('request-return',{status:response.status});activeCommand=null;
  const data=await response.json();result.commands.push({type:body.type,phase,elapsedMs,status:response.status,stop:data.summary?.spanStop??data.summary?.stopReason});
  if(!response.ok){result.status='http_error';result.error=data;break;}
  const row=await state();current=row.state.career;revision=Number(row.revision);
  console.log(JSON.stringify({league,command:n,type:body.type,stop:data.summary?.spanStop??data.summary?.stopReason??null,phase:current.phaseContext.phase,nextWorldDay:current.phaseContext.nextWorldDay??null,games:Object.keys(current.records.games).length,elapsedSeconds:Math.round((performance.now()-start)/1000)}));
 }
}catch(error){result.status='error';result.error=String(error.stack??error);}
finally{
 if(cpuEnabled){try{profile=(await inspector('Profiler.stop')).profile;}catch(error){result.profileError=String(error);}session.disconnect();}
 result.wallMs=performance.now()-start;result.finalHash=canonicalSha256(current);result.initialHashUnchanged=canonicalSha256(source)===initialHash;
 result.finalPhase=current.phaseContext.phase;result.finalGames=Object.values(current.records.games).filter(g=>g.scope.seasonKey===current.world.seasonKey&&g.scope.phase==='REGULAR').length;
 if(profile){const nodes=new Map(profile.nodes.map(n=>[n.id,n])),totals=new Map();for(let i=0;i<profile.samples.length;i++){const frame=nodes.get(profile.samples[i])?.callFrame;if(!frame)continue;const key=(frame.functionName||'(anonymous)')+' '+frame.url;totals.set(key,(totals.get(key)??0)+(profile.timeDeltas[i]??0));}result.cpuSamples=profile.samples.length;result.topSelfCpu=Array.from(totals,([frame,microseconds])=>({frame,microseconds})).sort((a,b)=>b.microseconds-a.microseconds).slice(0,40);result.cpuProfile=profile;}
 writeFileSync(output,JSON.stringify(result,null,2));await client.close();console.log(JSON.stringify({league,status:result.status,wallMs:result.wallMs,finalGames:result.finalGames,commands:result.commands.length,output}));
}
if(result.status!=='season_review'||!result.initialHashUnchanged)process.exitCode=1;
