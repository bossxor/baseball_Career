import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedUsCareer,activeUsCareer} from './us-fixtures.js';
import {enrolledCollegeCareer,completedCollegeRegularSeason,enteredKboCareer} from './fixtures.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {assertKboAmateurYearEnd} from '../src/kbo-entry.js';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {startUsRegularSeason} from '../src/us-season.js';
import {startCollegeCup,advanceCollegeCup} from '../src/college-cup.js';
import {setCareerSeasonGoals,replaceCareerSeasonGoal,refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection,careerSeasonGoalsView,openCareerSeasonGoalSelection,resolveCareerGoalEvent} from '../src/season-goals.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import {recordTotals} from '../src/records.js';
import type {UsCareer} from '../src/us-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {canonicalJson} from '../src/game.js';
const cache=new Map<string,UsCareer>();
function prepared(kind:'HITTER'|'PITCHER'='HITTER'){if(!cache.has(kind))cache.set(kind,preparedUsCareer(kind));return structuredClone(cache.get(kind)!);}
function active(ids:Parameters<typeof setCareerSeasonGoals>[2],kind:'HITTER'|'PITCHER'='HITTER'){const c=prepared(kind),selected=setCareerSeasonGoals(c,c.revision,ids);return startUsRegularSeason(selected,selected.revision);}

test('native preseason entry opens one non-blocking E89 in its committed revision without selecting goals',()=>{
 for(const c of [activeUsCareer('HITTER'),enteredKboCareer(),enrolledCollegeCareer()]){
  const notices=c.goals!.notices.filter(n=>n.definitionId==='E89'&&n.seasonKey===c.world.seasonKey);
  assert.equal(notices.length,1);assert.equal(notices[0]!.resume.sourceRevision,c.revision);assert.equal(c.goals!.seasons[c.world.seasonKey],undefined);
  assert.equal(refreshCareerPreseasonGoalSelection(c),c);assert.ok(!c.events.some(e=>e.definitionId==='E89'));
 }
 const c=prepared();delete c.goals;const raw=canonicalJson(c),opened=refreshCareerPreseasonGoalSelection(c);
 assert.equal(refreshCareerSeasonGoals(c),c);assert.equal(canonicalJson(c),raw);assert.equal(opened.revision,c.revision);assert.equal(opened.goals!.notices[0]!.resume.sourceRevision,c.revision);
 assert.deepEqual(opened.world,c.world);assert.deepEqual(opened.events,c.events);assert.equal(opened.goals!.rewards.length,0);
 const started=startUsRegularSeason(opened,opened.revision);assert.equal(started.phaseContext.phase,'SEASON_PROGRESS');assert.equal(refreshCareerPreseasonGoalSelection(started),started);
 const selected=setCareerSeasonGoals(c,c.revision,[]);assert.equal(refreshCareerPreseasonGoalSelection(selected),selected);
 const late=structuredClone(c);row(late,80);assert.equal(refreshCareerPreseasonGoalSelection(late),late);
 const unavailable=enteredKboCareer();delete unavailable.goals;unavailable.military={status:'SERVING_ACTIVE',applications:[]};assert.equal(refreshCareerPreseasonGoalSelection(unavailable),unavailable);
});

test('optional E89 selects real goals, skips without goals, and rejects stale or duplicate choices',()=>{
 const source=prepared();delete source.goals;const raw=canonicalJson(source),opened=openCareerSeasonGoalSelection(source,source.revision),event=opened.goals!.notices[0]!;
 assert.equal(opened.revision,source.revision+1);assert.equal(event.resume.sourceRevision,opened.revision);
 assert.equal(canonicalJson(source),raw);assert.equal(event.definitionId,'E89');assert.deepEqual(opened.events,source.events);assert.equal(openCareerSeasonGoalSelection(opened,opened.revision),opened);
 const input={eventKey:event.eventKey,eventVersion:event.version,command:'SET_GOALS' as const,goalIds:['G01','G03'] as const};
 const selected=resolveCareerGoalEvent(JSON.parse(JSON.stringify(opened)) as UsCareer,opened.revision,input).career;
 assert.deepEqual(selected.goals!.seasons[selected.world.seasonKey]!.slots.map(g=>g.goalId),['G01','G03']);assert.equal(selected.goals!.notices[0]!.resolution?.kind,'DOMAIN');assert.deepEqual(selected.world,opened.world);
 assert.throws(()=>resolveCareerGoalEvent(opened,opened.revision-1,input),/REVISION/);assert.throws(()=>resolveCareerGoalEvent(selected,selected.revision,input),/ALREADY_RESOLVED|VERSION_CHANGED/);
 const skipped=resolveCareerGoalEvent(opened,opened.revision,{eventKey:event.eventKey,eventVersion:1,command:'ACK_EVENT'}).career;
 assert.equal(skipped.goals!.seasons[skipped.world.seasonKey],undefined);assert.equal(skipped.goals!.notices[0]!.resolution?.kind,'ACK');assert.equal(openCareerSeasonGoalSelection(skipped,skipped.revision),skipped);
 const started=startUsRegularSeason(opened,opened.revision);assert.throws(()=>resolveCareerGoalEvent(started,started.revision,input),/GOALS_LOCKED/);
 assert.throws(()=>resolveCareerGoalEvent(opened,opened.revision,{...input,goalIds:['G05']}),/NOT_ELIGIBLE/);assert.equal(opened.goals!.notices[0]!.status,'OPEN');
});

test('E90 navigation consumes the existing source-bound outbox once without granting another reward',()=>{
 let c=active(['G03']);row(c,80,{HR:20});c=refreshCareerSeasonGoals(c);const event=c.goals!.notices.find(n=>n.definitionId==='E90')!,rewards=canonicalJson(c.goals!.rewards),world=canonicalJson(c.world);
 const input={eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_ACHIEVEMENTS' as const},opened=resolveCareerGoalEvent(JSON.parse(JSON.stringify(c)) as UsCareer,c.revision,input);
 assert.equal(opened.navigation?.targetScreen,'S40');assert.equal(opened.career.goals!.notices.find(n=>n.eventKey===event.eventKey)!.status,'RESOLVED');assert.equal(canonicalJson(opened.career.goals!.rewards),rewards);assert.equal(canonicalJson(opened.career.world),world);assert.equal(refreshCareerSeasonGoals(opened.career),opened.career);
 assert.throws(()=>resolveCareerGoalEvent(opened.career,opened.career.revision,input),/ALREADY_RESOLVED|VERSION_CHANGED/);
 const forged=structuredClone(c);forged.goals!.seasons[c.world.seasonKey]!.slots=[];assert.throws(()=>resolveCareerGoalEvent(forged,forged.revision,input),/GOAL_EVENT_SOURCE/);
});
/** Controlled contribution rows isolate scope predicates; the separate school/cup tests run native games. */
function row(c:UsCareer,day:number,stats:{HR?:number;BB?:number;K?:number;outs?:number;starterOuts?:number;SV?:number}={},league=c.registration.level,phase:GameContribution['scope']['phase']='REGULAR'){
 const key=c.protagonistKey,own=c.protagonistOrganizationId,other=c.world.organizations.find(o=>o.id!==own)!.id,HR=stats.HR??0,BB=stats.BB??0,K=stats.K??0,b={...emptyBatting(),PA:HR+BB+4,AB:HR+4,H:HR,HR,BB,K:4,TB:HR*4,R:HR,RBI:HR,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0},p={...emptyPitching(),BF:Math.max(K,stats.outs??0),K,outs:stats.outs??0,starterOuts:stats.starterOuts??0,starts:Number((stats.starterOuts??0)>0),games:1,loadedBF:0,W:0,L:0,SV:stats.SV??0,HLD:0,BS:0,shutouts:0};
 const split={PA:b.PA,AB:b.AB,H:b.H,BB:b.BB,HBP:0,K:b.K,TB:b.TB,HR,twoB:0,threeB:0,RBI:b.RBI},pitch={BF:p.BF,outs:p.outs,AB:p.BF,H:0,TB:0,HR:0,BB:0,HBP:0,K:p.K},hitter=c.world.players[key]!.kind==='HITTER',gameKey=JSON.stringify(['controlled-goal',league,phase,day]);
 const g:GameContribution={gameKey,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase},teams:{[own]:{games:1,W:Number(HR>0),L:0,T:Number(HR===0),R:HR,RA:0},[other]:{games:1,W:0,L:Number(HR>0),T:Number(HR===0),R:0,RA:HR}},batting:hitter?{[key]:b}:{},pitching:hitter?{}:{[key]:p},batterSplits:hitter?{[key]:{L:{...split,PA:0,AB:0,H:0,BB:0,K:0,TB:0,HR:0,RBI:0},R:split}}:{},pitcherSplits:hitter?{}:{[key]:{L:{...pitch,BF:0,outs:0,AB:0,K:0},R:pitch}},matchups:{}};
 c.records.games[gameKey]=g;c.records.revision++;return g;
}

test('goals are optional, max3, kind-filtered, PRE-only and source-safe without RNG or gameplay rewards',()=>{
 const c=prepared(),raw=canonicalJson(c),view=careerSeasonGoalsView(c);assert.deepEqual(view.recommendedIds,['G01','G04','G02']);assert.equal(view.gameplayRewardDelta,0);assert.equal(refreshCareerSeasonGoals(c),c);
 const selected=setCareerSeasonGoals(c,c.revision,['G01','G03','G04']);assert.equal(canonicalJson(c),raw);assert.deepEqual(selected.world,c.world);assert.equal(selected.goals!.seasons[c.world.seasonKey]!.slots.length,3);
 assert.throws(()=>setCareerSeasonGoals(c,c.revision,['G01','G02','G03','G04']),/CONFLICT/);assert.throws(()=>setCareerSeasonGoals(c,c.revision,['G01','G01']),/CONFLICT/);assert.throws(()=>setCareerSeasonGoals(c,c.revision,['G05']),/NOT_ELIGIBLE/);assert.throws(()=>setCareerSeasonGoals(c,c.revision-1,[]),/REVISION/);
 const started=startUsRegularSeason(selected,selected.revision);assert.throws(()=>setCareerSeasonGoals(started,started.revision,[]),/LOCKED/);assert.deepEqual(setCareerSeasonGoals(c,c.revision,[]).goals!.seasons[c.world.seasonKey]!.slots,[]);
 const serialized=JSON.stringify(careerSeasonGoalsView(selected));assert.ok(!serialized.includes('potential'));assert.ok(!serialized.includes('rng'));assert.equal(view.sourceDifficulty,c.difficulty);
 const dto=careerSeasonGoalsView(selected);dto.slots[0]!.scope.leagueKey='MLB';assert.equal(selected.goals!.seasons[c.world.seasonKey]!.slots[0]!.scope.leagueKey,c.registration.level);
});

test('goal HR scope never adds another league or postseason; completion/news/reward replay and correction are idempotent',()=>{
 let c=active(['G03']);row(c,80,{HR:19});row(c,81,{HR:8},'MLB');row(c,82,{HR:5},c.registration.level,'POSTSEASON');c=refreshCareerSeasonGoals(c);assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[0]!.progress,19);assert.equal(c.goals!.rewards.length,0);
 const final=row(c,83,{HR:1}),world=canonicalJson(c.world),income=canonicalJson(c.income),events=c.events;const complete=refreshCareerSeasonGoals(c);assert.equal(complete.goals!.seasons[c.world.seasonKey]!.slots[0]!.status,'COMPLETED');assert.equal(complete.goals!.rewards.length,1);assert.equal(complete.goals!.notices.filter(n=>n.definitionId==='E90').length,1);assert.equal(complete.events,events);assert.equal(canonicalJson(complete.world),world);assert.equal(canonicalJson(complete.income),income);assert.equal(refreshCareerSeasonGoals(complete),complete);
 assert.deepEqual(refreshCareerSeasonGoals(JSON.parse(JSON.stringify(c))),complete);assert.equal(careerSeasonGoalsView(complete).noticeDelivery,'OUTBOX');assert.equal(careerSeasonGoalsView(complete).notices.filter(n=>n.definitionId==='E90').length,1);const dto=careerSeasonGoalsView(complete);dto.rewards[0]!.sources.push('untrusted');assert.equal(complete.goals!.rewards[0]!.sources.length,1);
 const corrected=structuredClone(complete);delete corrected.records.games[final.gameKey];const result=refreshCareerSeasonGoals(corrected);assert.equal(result.goals!.seasons[c.world.seasonKey]!.slots[0]!.status,'CORRECTED');assert.equal(result.goals!.rewards.length,1);assert.equal(result.goals!.notices.filter(n=>n.definitionId==='E90').length,2);assert.equal(refreshCareerSeasonGoals(result),result);
});

test('malformed persisted goal arrays, changed scope and unknown reward are rejected without editing the save',()=>{
 const c=active(['G03']),raw=canonicalJson(c),bad=structuredClone(c);bad.goals!.rewards=null as never;assert.throws(()=>careerSeasonGoalsView(bad),/INVALID_GOAL_LEDGER/);assert.equal(canonicalJson(c),raw);
 const scope=structuredClone(c);scope.goals!.seasons[c.world.seasonKey]!.slots[0]!.scope.phase='POSTSEASON';assert.throws(()=>refreshCareerSeasonGoals(scope),/INVALID_GOAL_LEDGER/);
 const reward=structuredClone(c);reward.goals!.rewards=[{rewardId:'R-FORGED',type:'BACKGROUND',firstReceipt:'forged',sources:['forged']}];assert.throws(()=>careerSeasonGoalsView(reward),/INVALID_GOAL_REWARD/);
});

test('MID replacement uses sealed half-season, carries BB22 progress, rejects BB33 and cannot reset through moving levels',()=>{
 const c=active(['G03']);for(let i=0;i<49;i++)row(c,80+i,i===0?{BB:22}:{});assert.throws(()=>replaceCareerSeasonGoal(c,c.revision,0,'G04'),/WINDOW_NOT_OPEN/);row(c,129);
 const changed=replaceCareerSeasonGoal(c,c.revision,0,'G04');assert.equal(changed.goals!.seasons[c.world.seasonKey]!.slots[0]!.progress,22);assert.equal(changed.goals!.seasons[c.world.seasonKey]!.history[0]!.status,'REPLACED');assert.throws(()=>replaceCareerSeasonGoal(changed,changed.revision,0,'G01'),/USED/);
 const high=structuredClone(c);row(high,130,{BB:11});assert.throws(()=>replaceCareerSeasonGoal(high,high.revision,0,'G04'),/ALREADY_SATISFIED/);row(high,131,{HR:20});const complete=refreshCareerSeasonGoals(high);assert.throws(()=>replaceCareerSeasonGoal(complete,complete.revision,0,'G02'),/NOT_ELIGIBLE/);
 const moved=structuredClone(changed),org=moved.world.organizations.find(o=>o.id===moved.protagonistOrganizationId)!,key=moved.protagonistKey,other=org.levels.AA.find(k=>moved.world.players[k]!.kind===moved.world.players[key]!.kind)!;org.levels.A=org.levels.A.map(k=>k===key?other:k);org.levels.AA=org.levels.AA.map(k=>k===other?key:k);moved.registration.level='AA';assert.equal(careerSeasonGoalsView(moved).replacement.used,true);assert.equal(careerSeasonGoalsView(moved).slots[0]!.previousLeague,true);
});

test('pitcher goals use raw K, saves and starterOuts, never all relief outs',()=>{
 let c=active(['G05','G06','G07'],'PITCHER');for(let i=0;i<20;i++)row(c,80+i,{K:5,outs:15,starterOuts:0,SV:1});c=refreshCareerSeasonGoals(c);assert.deepEqual(c.goals!.seasons[c.world.seasonKey]!.slots.map(g=>g.status),['COMPLETED','ACTIVE','COMPLETED']);for(let i=0;i<11;i++)row(c,110+i,{outs:27,starterOuts:27});row(c,121,{outs:3,starterOuts:3});c=refreshCareerSeasonGoals(c);assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[1]!.status,'COMPLETED');assert.equal(c.goals!.rewards.length,3);assert.equal(careerSeasonGoalsView(c).gameplayRewardDelta,0);
});

test('G01/G02/G04 count exact PA, fixed-lineup starts and walks with three cosmetic grants only',()=>{
 let c=active(['G01','G02','G04']);for(let i=0;i<49;i++)row(c,80+i,i<15?{BB:2}:{});c=refreshCareerSeasonGoals(c);
 assert.deepEqual(c.goals!.seasons[c.world.seasonKey]!.slots.map(g=>g.status),['COMPLETED','ACTIVE','COMPLETED']);assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[1]!.progress,49);
 row(c,129);c=refreshCareerSeasonGoals(c);assert.ok(c.goals!.seasons[c.world.seasonKey]!.slots.every(g=>g.status==='COMPLETED'));assert.equal(c.goals!.rewards.length,3);assert.equal(c.goals!.notices.filter(n=>n.definitionId==='E90').length,3);assert.equal(careerSeasonGoalsView(c).gameplayRewardDelta,0);
});

test('US year continuation preserves earned cosmetics and goal outbox without blocking the finalized contract path',()=>{
 const pre=prepared(),selected=setCareerSeasonGoals(pre,pre.revision,['G01','G03']),closed=finishedUsCareerFixture(selected),before=canonicalJson(closed.goals),next=startNextUsMinorSeason(closed,closed.revision,closed.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0})));
 assert.deepEqual(closed.goals!.seasons[closed.world.seasonKey]!.slots.map(g=>g.status),['COMPLETED','EXPIRED']);assert.equal(closed.goals!.rewards.length,1);assert.equal(closed.goals!.notices.filter(n=>n.definitionId==='E90').length,1);assert.equal(canonicalJson(closed.goals),before);assert.deepEqual(next.goals!.seasons,closed.goals!.seasons);assert.deepEqual(next.goals!.rewards,closed.goals!.rewards);assert.deepEqual(next.goals!.notices.slice(0,-1),closed.goals!.notices);assert.equal(next.goals!.notices.at(-1)!.definitionId,'E89');assert.equal(next.goals!.notices.at(-1)!.seasonKey,next.world.seasonKey);assert.equal(next.goals!.notices.at(-1)!.resume.sourceRevision,next.revision);
 const selectedAgain=setCareerSeasonGoals(next,next.revision,['G01']);assert.equal(selectedAgain.goals!.rewards.length,1);assert.equal(selectedAgain.goals!.seasons[next.world.seasonKey]!.slots[0]!.status,'ACTIVE');assert.equal(selectedAgain.goals!.seasons[closed.world.seasonKey]!.slots[0]!.status,'COMPLETED');
});

test('school goal expiry is committed before sealing the year-end receipt and survives the actual KBO entry command',()=>{
 const c=enteredKboCareer('HITTER',s=>{s.goals={schemaVersion:1,worldKey:s.world.worldKey,playerKey:s.world.protagonistKey,notices:[],rewards:[],seasons:{[s.world.seasonKey]:{leagueKey:'HS',teamKey:s.world.protagonistSchoolId,scheduledGames:48,replacementUsed:false,history:[],slots:[{slot:0,goalId:'G03',scope:{seasonKey:s.world.seasonKey,leagueKey:'HS',phase:'REGULAR'},teamKey:s.world.protagonistSchoolId,status:'ACTIVE',progress:0,selectedRevision:1}]}}};});
 assertKboAmateurYearEnd(c.amateurHistory);assert.equal(c.goals!.seasons[c.amateurHistory.world.seasonKey]!.slots[0]!.status,'EXPIRED');assert.deepEqual(c.goals!.seasons,c.amateurHistory.goals!.seasons);assert.deepEqual(c.goals!.notices.slice(0,-1),c.amateurHistory.goals!.notices);assert.equal(c.goals!.notices.at(-1)!.definitionId,'E89');assert.equal(c.goals!.rewards.length,0);
});

test('serving Sports goal registration seals SANGMU/Futures instead of the original club; Active has no playable goal choices',()=>{
 const c=enteredKboCareer();c.military={status:'SERVING_SPORTS',applications:[]};const sports=setCareerSeasonGoals(c,c.revision,['G01']),s=sports.goals!.seasons[c.world.seasonKey]!;
 assert.equal(s.teamKey,'SANGMU');assert.equal(s.leagueKey,'FUTURES');assert.equal(s.slots[0]!.teamKey,'SANGMU');assert.equal(s.slots[0]!.scope.leagueKey,'FUTURES');assert.equal(careerSeasonGoalsView(sports).availabilityReason,null);
 const active=structuredClone(c);active.military={status:'SERVING_ACTIVE',applications:[]};assert.deepEqual(careerSeasonGoalsView(active).definitions,[]);assert.equal(careerSeasonGoalsView(active).availabilityReason,'SERVING_ACTIVE');assert.throws(()=>setCareerSeasonGoals(active,active.revision,['G01']),/NOT_ELIGIBLE/);assert.equal(setCareerSeasonGoals(active,active.revision,[]).goals!.rewards.length,0);
});

test('G08 requires evidenced injury, actual recovery and a later official appearance, not a return button',()=>{
 const base=prepared(),key=base.protagonistKey,old=Object.values(base.records.games)[0]!;base.health.games=[...base.health.games,{evidence:{gameKey:old.gameKey,teamKey:Object.keys(old.teams)[0]!,seasonKey:old.scope.seasonKey,day:old.worldDay,roster:[key],appearances:[]},result:{injured:[key],recovered:[]}}];base.health.injuries[key]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:old.gameKey,seasonKey:old.scope.seasonKey};const selected=setCareerSeasonGoals(base,base.revision,['G08']);let c=startUsRegularSeason(selected,selected.revision);delete c.health.injuries[key];c=refreshCareerSeasonGoals(c);assert.equal(c.goals!.rewards.length,0);
 const recovery=row(c,80);delete recovery.batting[key];delete recovery.batterSplits[key];c.health.games=[...c.health.games,{evidence:{gameKey:recovery.gameKey,teamKey:c.registration.level+':'+c.protagonistOrganizationId,seasonKey:c.world.seasonKey,day:80,roster:[key],appearances:[]},result:{injured:[],recovered:[key]}}];c=refreshCareerSeasonGoals(c);assert.equal(c.goals!.rewards.length,0);row(c,81,{BB:1});c=refreshCareerSeasonGoals(c);assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[0]!.status,'COMPLETED');
});

test('native school game updates selected goals automatically and leaves gameplay identical to no-goal play',()=>{
 let pre=createHighSchoolCareer(createHighSchoolWorld({worldKey:'native-goals',seasonKey:'2032',seed:'progress-fixture',schoolId:'H01',seasonYear:2032,player:{simulationKey:'goal-own',name:'목표선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');pre=confirmCareerPlayer(pre,pre.revision);pre=resolveCareerFocusEvent(pre,pre.revision,{eventKey:pre.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});
 assert.equal(pre.goals!.notices.filter(n=>n.definitionId==='E89').length,1);assert.equal(pre.goals!.notices[0]!.resume.sourceRevision,pre.revision);assert.equal(pre.goals!.seasons[pre.world.seasonKey],undefined);
 const own=pre.world.players[pre.world.protagonistKey]!;own.abilities=Object.fromEntries(Object.keys(own.abilities).map(k=>[k,Math.min(800000,own.potential[k]!)]));own.careerPeaks={...own.abilities};const selected=setCareerSeasonGoals(pre,pre.revision,['G01','G02']);let plain=confirmCareerPreseason(pre,pre.revision),withGoals=confirmCareerPreseason(selected,selected.revision);
 for(let i=0;i<30;i++){const a=advanceHighSchoolCareer(plain,plain.revision,i===0?'ONE_GAME':undefined),b=advanceHighSchoolCareer(withGoals,withGoals.revision,i===0?'ONE_GAME':undefined);plain=a.career;withGoals=b.career;assert.equal(a.stopReason,b.stopReason);if(a.stopReason==='ONE_GAME')break;if(i===29)throw Error('native goal game limit');}
 assert.deepEqual(withGoals.records,plain.records);assert.deepEqual(withGoals.world,plain.world);const actual=recordTotals(withGoals.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).batting[own.simulationKey]!;assert.ok(actual.PA>0);assert.equal(withGoals.goals!.seasons['2032']!.slots[0]!.progress,actual.PA);assert.equal(withGoals.goals!.seasons['2032']!.slots[1]!.progress,1);assert.equal(withGoals.events.filter(e=>e.status==='OPEN').length,0);console.log('Native goal school proof:',JSON.stringify({officialGames:Object.values(withGoals.records.games).filter(g=>g.scope.seasonKey==='2032').length,ownPA:actual.PA,ownStarts:actual.games,recordsEqualWithoutGoals:true,worldEqualWithoutGoals:true}));
});

test('college qualification goal settles at final seeding; native championship appearance counts G10 and never regular G01',()=>{
 const pre=enrolledCollegeCareer(),own=pre.world.players[pre.world.protagonistKey]!;own.abilities=Object.fromEntries(Object.keys(own.abilities).map(k=>[k,Math.min(800000,own.potential[k]!)]));own.careerPeaks={...own.abilities};const selected=setCareerSeasonGoals(pre,pre.revision,['G01','G09','G10']);let c=completedCollegeRegularSeason(selected,true);c=startCollegeCup(c,c.revision);assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[1]!.status,'COMPLETED');
 for(let i=0;i<70&&c.goals!.seasons[c.world.seasonKey]!.slots[2]!.status!=='COMPLETED';i++){if(c.phaseContext.phase!=='POSTSEASON_PROGRESS')break;c=advanceCollegeCup(c,c.revision).career;}
 assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[2]!.status,'COMPLETED');assert.equal(c.goals!.seasons[c.world.seasonKey]!.slots[0]!.progress,0);assert.equal(c.goals!.rewards.length,2);console.log('Native goal college proof:',JSON.stringify({controlledRegularGames:216,nativeCupGames:Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey==='COLLEGE'&&g.scope.phase==='POSTSEASON').length,goals:c.goals!.seasons[c.world.seasonKey]!.slots.map(g=>({id:g.goalId,progress:g.progress,status:g.status})),cosmetics:2}));
});


test('ignored E89 can be acknowledged after starting without selecting goals or restoring the preseason phase',()=>{
 const c=prepared(),event=c.goals!.notices.find(n=>n.definitionId==='E89')!,started=startUsRegularSeason(c,c.revision),raw=canonicalJson(started),input={eventKey:event.eventKey,eventVersion:event.version,command:'ACK_EVENT' as const};
 const read=resolveCareerGoalEvent(JSON.parse(JSON.stringify(started)) as UsCareer,started.revision,input).career;
 assert.equal(canonicalJson(started),raw);assert.deepEqual(read.phaseContext,started.phaseContext);assert.deepEqual(read.world,started.world);assert.deepEqual(read.records,started.records);assert.deepEqual(read.goals!.seasons,started.goals!.seasons);assert.equal(read.goals!.notices.find(n=>n.eventKey===event.eventKey)!.status,'RESOLVED');assert.throws(()=>resolveCareerGoalEvent(read,read.revision,input),/ALREADY_RESOLVED|VERSION_CHANGED/);
 const selected=setCareerSeasonGoals(c,c.revision,['G01']),playing=startUsRegularSeason(selected,selected.revision),ack=resolveCareerGoalEvent(playing,playing.revision,input).career;assert.deepEqual(ack.goals!.seasons,playing.goals!.seasons);assert.deepEqual(ack.phaseContext,playing.phaseContext);
 const closed=finishedUsCareerFixture(),historical=startNextUsMinorSeason(closed,closed.revision,closed.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),prior=historical.goals!.notices.find(n=>n.definitionId==='E89'&&n.seasonKey===closed.world.seasonKey)!;
 assert.doesNotThrow(()=>resolveCareerGoalEvent(historical,historical.revision,{eventKey:prior.eventKey,eventVersion:prior.version,command:'ACK_EVENT'}));assert.throws(()=>resolveCareerGoalEvent(playing,playing.revision,{...input,command:'SET_GOALS',goalIds:['G03']}),/GOALS_LOCKED/);
});


test('historical goal acknowledgement validates and preserves a sealed school year end',()=>{
 const school=enteredKboCareer('HITTER',s=>{
  // Controlled past notice: the actual writer creates it before the signing/year-end commands seal the root.
  const opened=openCareerSeasonGoalSelection({...s,phaseContext:{phase:'PRESEASON_SETUP'},records:{revision:0,games:{}}},s.revision);s.revision=opened.revision;s.goals=opened.goals!;
 }).amateurHistory;
 assertKboAmateurYearEnd(school);const event=school.goals!.notices.find(n=>n.definitionId==='E89')!,raw=canonicalJson(school),read=resolveCareerGoalEvent(school,school.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACK_EVENT'}).career;
 assert.equal(canonicalJson(school),raw);assert.deepEqual(read.records,school.records);assert.deepEqual(read.phaseContext,school.phaseContext);assertKboAmateurYearEnd(read);
 const forged=structuredClone(school);forged.kboYearEnd!.sourceBasis='forged';assert.throws(()=>resolveCareerGoalEvent(forged,forged.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACK_EVENT'}),/STALE_KBO_AMATEUR_YEAR_END/);
});
