import test from 'node:test';
import assert from 'node:assert/strict';
import {createTestDb,seedAllowedSubject} from '@playball/db';
import {abilityKeys} from '@playball/rules';
import {createApp} from '../../api/src/app.js';
import {json} from '../../api/test/json.js';
import {createHttpApi} from '../src/http.js';

test('native school resumes through the real web HTTP adapter; lost response retries the exact native intent',async()=>{
 const {db,client}=await createTestDb(),originalFetch=globalThis.fetch;try{
  await seedAllowedSubject(db,'web-school');const headers={Authorization:'Bearer dev:web-school','Content-Type':'application/json'},app=createApp({db,auth:{allowDevBearer:true}});
  const {saveId}=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'native-web',mode:'CAREER'})}));
  const created=await app.request('/api/saves/'+saveId+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:'native-create',expectedRevision:0,type:'CAREER_SCHOOL_CREATE',payload:{name:'웹이어가기',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'GROWTH',schoolId:'H02',seasonYear:2029}})});assert.equal(created.status,200,await created.clone().text());
  let lose=false,loseRead=false,commandSucceeded=false;const requests:{commandId:string;expectedRevision:number;type:string;payload:{careerRevision:number;mode?:string}}[]=[];
  globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{const response=await app.request(String(input),init);if(init?.method==='POST'){requests.push(JSON.parse(String(init.body)));commandSucceeded=response.status===200;if(lose){lose=false;assert.equal(response.status,200);throw new TypeError('lost after commit');}}else if(loseRead&&commandSucceeded){loseRead=false;throw new TypeError('lost career refresh after receipt');}return response;}) as typeof fetch;
  const api=createHttpApi({baseUrl:'http://api.local',getToken:()=> 'dev:web-school'});let view=await api.career(saveId);assert.equal(view.protagonist.name,'웹이어가기');assert.equal(view.stage.teamName,'청해솔고');
  for(let step=0;step<3;step++){const action=view.nextActions[0]!;if(action.id==='open:FLOW'){const keep=(await api.flow(saveId))!.commands.find(c=>c.id==='school-keep-focus')!;assert.ok(keep,'E01 focus choice is a served flow command');await api.flowCommand(saveId,'native-step-'+step,keep.type,keep.payload);view=await api.career(saveId);continue;}assert.ok(action.id.startsWith('school:'));view=await api.act(saveId,action.id,'NEXT_MAJOR_EVENT','native-step-'+step);}
  assert.equal(view.stage.phaseLabel,'정규시즌');lose=true;await assert.rejects(api.act(saveId,'school:ADVANCE','ONE_GAME','native-lost'));
  const secondDevice=createHttpApi({baseUrl:'http://api.local',getToken:()=> 'dev:web-school'});const recovered=await secondDevice.career(saveId);assert.equal(recovered.protagonist.name,'웹이어가기');
  const after=await api.act(saveId,'school:ADVANCE','ONE_WEEK','native-lost');assert.equal(after.protagonist.name,'웹이어가기');assert.equal(requests.at(-1)!.type,'CAREER_SCHOOL_ADVANCE');assert.deepEqual(requests.at(-1),requests.at(-2),'retry must retain first native career revision, save revision and progress mode after another device reads');assert.equal(requests.at(-1)!.payload.mode,'ONE_GAME');assert.ok(requests.every(r=>r.type!=='UI_ADVANCE'));
  commandSucceeded=false;loseRead=true;await assert.rejects(api.act(saveId,'school:ADVANCE','ONE_GAME','native-refresh-lost'));
  await api.act(saveId,'school:ADVANCE','ONE_WEEK','native-refresh-lost');assert.deepEqual(requests.at(-1),requests.at(-2),'a failed refresh after an acknowledged command still retries the original receipt');
 }finally{globalThis.fetch=originalFetch;await client.close();}
});
