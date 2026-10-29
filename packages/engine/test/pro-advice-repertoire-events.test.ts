import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {activeUsCareer} from './us-fixtures.js';
import {refreshProCareerAdvice,resolveProCareerAdviceEvent,proCareerAdviceView,careerAdviceStarter,settleCareerAdviceRest,prepareCareerAdviceGame} from '../src/pro-career-advice.js';
import type {AdviceCareer,CareerAdviceLedger} from '../src/pro-career-advice.js';
import {refreshCareerRepertoireEvents,resolveCareerRepertoireEvent,careerBattingApproaches,setCareerBattingApproach} from '../src/repertoire-events.js';
import {refreshProCareerResultEvents,resolveProCareerResultEvent} from '../src/pro-career-results.js';
import {createWorldEvent,eventDefinition} from '../src/events.js';
import {createStreams,seedPcg32,nextFloat} from '../src/rng.js';
import {canonicalJson} from '../src/game.js';
import type {GameContribution} from '../src/records.js';
import {emptyPitching,emptyBatting} from '../src/stats.js';
import {grantPracticePitchXp} from '../src/repertoire.js';
import type {CompetitionGameWorld,HighSchoolGameContext} from '../src/high-school-game.js';
import type {ScheduledGame} from '../src/schedule.js';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent} from '../src/high-school-career.js';
import {abilityKeys} from '@playball/rules';

function ready(kind:'HITTER'|'PITCHER'='HITTER'){
 const c=enteredKboCareer(kind),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!;
 c.registration.firstTeam=true;if(!club.firstTeam.includes(c.protagonistKey))club.firstTeam=[...club.firstTeam,c.protagonistKey];
 c.records={revision:0,games:{}};c.health.games=[];c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:1,pendingGame:null};return c;
}
function closed<T extends AdviceCareer>(c:T,day:number):T {
 const gameKey='advice-'+day,row:GameContribution={gameKey,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{['protagonistClubId'in c?c.protagonistClubId:c.protagonistOrganizationId]:{games:1,W:1,L:0,T:0,R:1,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 c.records.games[gameKey]=row;c.health.games=[...c.health.games,{evidence:{gameKey,teamKey:'KBO:team',seasonKey:c.world.seasonKey,day,roster:[c.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};return c;
}
function advice(c:AdviceCareer):CareerAdviceLedger{return {schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,rng:createStreams(c.world.seed,'advice-test').event,checkpoints:[],notices:[],positionPlans:[],positionFits:null,roleReviews:[],restRequests:[]};}
function event<T extends AdviceCareer>(c:T,id:string):T&{advice:CareerAdviceLedger}{
 const d=eventDefinition(id),e=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,worldSeasonId:c.world.seasonKey,adviceWindowId:'test-window'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'KBO',registrationKey:'protagonistClubId'in c?c.protagonistClubId:c.protagonistOrganizationId,sourceRevision:c.revision},sourceSequence:1,worldDay:24});return {...c,advice:{...advice(c),notices:[e]}};
}

test('E20 uses20-game performance regardless of optional morale; E26 compares the strongest competitor',()=>{
 const c=ready(),key=c.protagonistKey,club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 c.adviceMorale=100;
 for(let day=1;day<=24;day++){closed(c,day);c.records.games['advice-'+day]!.batting[key]={...emptyBatting(),PA:4,AB:4,K:4,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};}
 const rows=refreshProCareerAdvice(c,24).advice!.checkpoints[0]!.candidateIds;
 assert.ok(rows.includes('E20'));
 for(const row of Object.values(c.records.games))row.batting={};
 const peers=club.firstTeam.filter(k=>k!==key&&c.world.players[k]!.kind==='HITTER');assert.ok(peers.length>=2);
 c.world.players[key]!.abilities=Object.fromEntries(abilityKeys('HITTER').map(axis=>[axis,500_000]));
 for(const peer of peers){c.world.players[peer]!.position=c.world.players[key]!.position;c.world.players[peer]!.abilities={...c.world.players[key]!.abilities};}
 const near=refreshProCareerAdvice(c,24);assert.ok(near.advice!.checkpoints[0]!.candidateIds.includes('E26'));
 c.world.players[peers[0]!]!.abilities=Object.fromEntries(abilityKeys('HITTER').map(axis=>[axis,900_000]));
 assert.ok(!refreshProCareerAdvice(c,24).advice!.checkpoints[0]!.candidateIds.includes('E26'));
});

test('E19 requires two actual starts; relief outings cannot replace the starting sample',()=>{
 const c=ready('PITCHER'),key=c.protagonistKey;c.world.players[key]!.position='SP';
 for(let day=1;day<=24;day++)closed(c,day);
 for(const day of [23,24])c.records.games['advice-'+day]!.pitching[key]={...emptyPitching(),BF:20,outs:15,R:5,ER:5,games:1,starts:0,starterOuts:0,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0};
 assert.ok(!refreshProCareerAdvice(c,24).advice!.checkpoints[0]!.candidateIds.includes('E19'));
 for(const day of [23,24])c.records.games['advice-'+day]!.pitching[key]!.starts=1;
 assert.ok(refreshProCareerAdvice(c,24).advice!.checkpoints[0]!.candidateIds.includes('E19'));
});

test('general advice uses a separate stream, one uniform eligible draw per24 games, JSON replay and checkpoint idempotence',()=>{
 let c:AdviceCareer=ready();for(let day=1;day<=24;day++)closed(c,day);
 const l=advice(c);let seed=0;while(nextFloat(seedPcg32(BigInt(seed),1n)).value>=.35)seed++;l.rng=seedPcg32(BigInt(seed),1n);c={...c,advice:l};
 const before=canonicalJson(c),next=refreshProCareerAdvice(c,24),copy=refreshProCareerAdvice(JSON.parse(before) as AdviceCareer,24);
 assert.equal(canonicalJson(next),canonicalJson(copy));assert.equal(canonicalJson(c),before);assert.equal(next.advice!.checkpoints.length,1);assert.ok(next.advice!.checkpoints[0]!.candidateIds.includes('E12'));assert.equal(next.advice!.notices.length,1);assert.ok(next.advice!.rng.draws-l.rng.draws>=2);assert.deepEqual(next.health.rng,c.health.rng);assert.deepEqual(refreshProCareerAdvice(next,24),next);
});

test('position plan counts24 later healthy registered FINAL games and confirms the latest version without granting100 fit',()=>{
 let c:AdviceCareer=ready();for(let day=1;day<=24;day++)closed(c,day);c=event(c,'E12');
 const e=c.advice!.notices[0]!,target=proCareerAdviceView(c).targetPositions.find(p=>p!==c.world.players[c.protagonistKey]!.position)!;
 c=resolveProCareerAdviceEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'START_POSITION_PLAN',targetPosition:target}).career;
 const original=c.world.players[c.protagonistKey]!.position;assert.equal(c.advice!.positionPlans[0]!.games.length,0);
 for(let day=25;day<=48;day++){closed(c,day);c=refreshProCareerAdvice(c,day);}
 const plan=c.advice!.positionPlans[0]!,done=c.advice!.notices.find(x=>x.definitionId==='E13')!;assert.equal(plan.status,'READY');assert.equal(plan.games.length,24);assert.equal(c.world.players[c.protagonistKey]!.position,original);
 assert.throws(()=>resolveProCareerAdviceEvent(c,c.revision,{eventKey:done.eventKey,eventVersion:done.version,command:'CONFIRM_POSITION',planVersion:plan.version-1}),/VERSION/);
 const confirmed=resolveProCareerAdviceEvent(c,c.revision,{eventKey:done.eventKey,eventVersion:done.version,command:'CONFIRM_POSITION',planVersion:plan.version}).career;
 assert.equal(confirmed.world.players[c.protagonistKey]!.position,target);assert.equal(confirmed.advice!.positionPlans[0]!.status,'CONFIRMED');if(target!=='DH')assert.equal(confirmed.advice!.positionFits![target as keyof NonNullable<CareerAdviceLedger['positionFits']>],0);
 assert.throws(()=>resolveProCareerAdviceEvent(confirmed,confirmed.revision,{eventKey:done.eventKey,eventVersion:done.version,command:'CONFIRM_POSITION',planVersion:plan.version}),/VERSION|RESOLVED/);
});

test('left throwing position targets are legal; morale requires an explicit valid0..100 domain value',()=>{
 const c=ready();c.world.players[c.protagonistKey]!.throws='L';c.world.players[c.protagonistKey]!.position='1B';
 assert.ok(proCareerAdviceView(c).targetPositions.every(p=>!['C','2B','3B','SS'].includes(p)));
 assert.throws(()=>proCareerAdviceView({...c,adviceMorale:101}),/MORALE/);assert.equal(proCareerAdviceView(c).notices.length,0);
});

test('SP and CP requests enforce60 exactly, recheck vacancies and use existing roster competition without advice RNG',()=>{
 for(const [id,command,ability,role]of [['E14','REQUEST_SP_REVIEW','STAMINA','SP'],['E15','REQUEST_CP_REVIEW','COMPOSURE','CP']] as const){
  const base=ready('PITCHER'),key=base.protagonistKey,club=base.world.clubs.find(x=>x.id===base.protagonistClubId)!;base.world.players[key]!.position='RP';
  for(const other of club.firstTeam)if(other!==key&&base.world.players[other]!.kind==='PITCHER'){base.world.players[other]!.position='RP';base.world.players[other]!.abilities=Object.fromEntries(abilityKeys('PITCHER').map(axis=>[axis,100_000]));}
  for(let day=1;day<=24;day++)closed(base,day);base.world.players[key]!.abilities={...base.world.players[key]!.abilities,[ability]:599_999};
  const low=event(base,id),e=low.advice.notices[0]!;assert.throws(()=>resolveProCareerAdviceEvent(low,low.revision,{eventKey:e.eventKey,eventVersion:e.version,command}),/CHOICE/);
  low.world.players[key]!.abilities={...low.world.players[key]!.abilities,[ability]:600_000};const before=canonicalJson(low.advice.rng),next=resolveProCareerAdviceEvent(low,low.revision,{eventKey:e.eventKey,eventVersion:e.version,command}).career;
  assert.equal(next.world.players[key]!.position,role);assert.equal(canonicalJson(next.advice.rng),before);assert.equal(next.advice.roleReviews[0]!.outcome,'ROLE_CHANGED');
 }
});

test('the seasonal cap and two following seasons cooldown filter candidates before consuming the advice stream',()=>{
 const base=ready();for(let day=1;day<=24;day++)closed(base,day);
 const old={...base,world:{...base.world,seasonKey:String(Number(base.world.seasonKey)-1)}},prior=event(old,'E12').advice.notices[0]!,c={...base,advice:{...advice(base),notices:[prior]}};
 const cool=refreshProCareerAdvice(c,24);assert.ok(!cool.advice.checkpoints[0]!.candidateIds.includes('E12'));
 const notices=['E12','E20','E26'].map(id=>event(base,id).advice.notices[0]!),capped={...base,advice:{...advice(base),notices}},next=refreshProCareerAdvice(capped,24);
 assert.deepEqual(next.advice.checkpoints[0]!.candidateIds,[]);assert.deepEqual(next.advice.rng,capped.advice.rng);assert.equal(next.advice.notices.length,3);
});

test('a rest request affects the actual starter and settles only after an official replacement start',()=>{
 let c:AdviceCareer=ready('PITCHER');c.world.players[c.protagonistKey]!.position='SP';for(let day=1;day<=24;day++)closed(c,day);
 for(const day of [23,24])c.records.games['advice-'+day]!.pitching[c.protagonistKey]={...emptyPitching(),games:1,starts:1,starterOuts:15,loadedBF:0,W:0,L:1,SV:0,HLD:0,BS:0,shutouts:0,BF:20,outs:15,ER:5};
 // E19 eligibility reads these pitcher splits through the shared record aggregator.
 for(const day of [23,24])c.records.games['advice-'+day]!.pitcherSplits[c.protagonistKey]={L:{BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0},R:{BF:20,outs:15,AB:20,H:0,TB:0,HR:0,BB:0,HBP:0,K:0}};
 c=event(c,'E19');const e=c.advice!.notices[0]!;c=resolveProCareerAdviceEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'REQUEST_REST'}).career;
 const club='protagonistClubId'in c?c.world.clubs.find(x=>x.id===c.protagonistClubId)!:null,pool=club!.firstTeam.filter(k=>c.world.players[k]!.kind==='PITCHER'),replacement=careerAdviceStarter(c,c.protagonistKey,pool);assert.notEqual(replacement,c.protagonistKey);
 closed(c,25);c.records.games['advice-25']!.pitching[replacement]={...emptyPitching(),games:1,starts:1,starterOuts:3,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0,BF:3,outs:3};
 const done=settleCareerAdviceRest(c,'advice-25',c.protagonistKey,replacement);assert.equal(done.advice!.restRequests[0]!.status,'COMPLETED');assert.deepEqual(settleCareerAdviceRest(done,'advice-25',c.protagonistKey,replacement),done);
});

test('E86 invokes the real KBO and US learning writer; E88 persists the game approach and consumes its window',()=>{
 for(const source of [enteredKboCareer('PITCHER'),activeUsCareer('PITCHER')]){
  const c=refreshCareerRepertoireEvents(source),notice=c.repertoireEvents!.notices.find(e=>e.definitionId==='E86')!;assert.ok(notice);
  const next=resolveCareerRepertoireEvent(c,c.revision,{eventKey:notice.eventKey,eventVersion:notice.version,command:'SET_PITCH_TRAINING',pitchId:'P07'}).career;
  assert.equal(next.world.repertoires[next.protagonistKey]!.learning!.pitchId,'P07');assert.equal(next.world.repertoires[next.protagonistKey]!.ledger.baseReservedUnits,100_000);assert.equal(next.repertoireEvents!.notices.find(e=>e.eventKey===notice.eventKey)!.status,'RESOLVED');
 }
 const c=refreshCareerRepertoireEvents(enteredKboCareer('HITTER')),e=c.repertoireEvents!.notices.find(x=>x.definitionId==='E88')!,next=resolveCareerRepertoireEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'SET_BATTING_APPROACH',approach:'PULL'}).career;
 assert.equal(careerBattingApproaches(next)[next.protagonistKey],'PULL');assert.throws(()=>setCareerBattingApproach(next,next.revision,'BALANCED'),/WINDOW/);
});

test('rest preparation runs after ordinary coaching, freezes a JSON safe proof and leaves unrelated context unchanged',()=>{
 const c=ready('PITCHER'),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!,key=c.protagonistKey;
 const world:CompetitionGameWorld={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,protagonistKey:key,leagueKey:'KBO',schools:[{id:club.id,name:club.name,roster:club.firstTeam}],players:c.world.players,repertoires:c.world.repertoires};
 const context:HighSchoolGameContext={difficulty:c.difficulty,unavailableKeys:[],starters:{[club.id]:key},recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}};
 const scheduled:ScheduledGame={simulationKey:'rest-game',leagueKey:'KBO',seasonKey:c.world.seasonKey,round:1,worldDay:25,homeTeamKey:club.id,awayTeamKey:'opponent'};
 assert.equal(prepareCareerAdviceGame(c,world,scheduled,context).context,context);
 const requested={...c,advice:{...advice(c),restRequests:[{receiptKey:'rest-receipt',eventKey:'rest-event',seasonKey:c.world.seasonKey,requestedAfterDay:24,status:'PENDING' as const,skippedGameKey:null}]}},before=canonicalJson(context),next=prepareCareerAdviceGame(requested,world,scheduled,context);
 assert.ok(next.restProof);assert.equal(next.restProof.ordinaryStarter,key);assert.notEqual(next.restProof.actualStarter,key);assert.equal(next.context.starters[club.id],next.restProof.actualStarter);assert.equal(canonicalJson(context),before);assert.deepEqual(JSON.parse(JSON.stringify(next.restProof)),next.restProof);
 const unavailable={...context,unavailableKeys:club.firstTeam.filter(k=>k!==key)};assert.equal(prepareCareerAdviceGame(requested,world,scheduled,unavailable).context,unavailable);
 const noProtagonist={...context,starters:{[club.id]:next.restProof.actualStarter}};assert.equal(prepareCareerAdviceGame(requested,world,scheduled,noProtagonist).context,noProtagonist);
});

test('E87 follows only committed XP threshold evidence and replay does not duplicate the level receipt',()=>{
 const c=enteredKboCareer('PITCHER'),key=c.protagonistKey,book=c.world.repertoires[key]!;book.book.P01=599_900;c.world.repertoires[key]=grantPracticePitchXp(book,'official-threshold','P01',1,5);
 const next=refreshCareerRepertoireEvents(c);assert.ok(next.repertoireEvents!.levels.some(r=>r.pitchId==='P01'&&r.grade===3&&r.xpEvidenceKey==='official-threshold'));assert.deepEqual(refreshCareerRepertoireEvents(next),next);
});

test('E86 school choice reaches the existing learning and calendar registration writer',()=>{
 const world=createHighSchoolWorld({worldKey:'school-learning-events',seasonKey:'2029',seasonYear:2029,seed:'school-learning',schoolId:'H01',secondaryPitch:'P03',player:{simulationKey:'own',name:'구종선수',kind:'PITCHER',position:'SP',throws:'R',bats:'R',pitchForm:'OVERHAND',archetype:'BALANCED',focus:abilityKeys('PITCHER').slice(0,4),difficulty:'GROWTH'}}),created=createHighSchoolCareer(world,'GROWTH'),confirmed=confirmCareerPlayer(created,created.revision),start=confirmed.events[0]!,pre=resolveCareerFocusEvent(confirmed,confirmed.revision,{eventKey:start.eventKey,eventVersion:start.version,command:'KEEP_FOCUS'}),c=refreshCareerRepertoireEvents(pre),notice=c.repertoireEvents!.notices.find(e=>e.definitionId==='E86')!;
 const next=resolveCareerRepertoireEvent(c,c.revision,{eventKey:notice.eventKey,eventVersion:notice.version,command:'SET_PITCH_TRAINING',pitchId:'P07'}).career,book=next.world.repertoires[next.world.protagonistKey]!;
 assert.equal(book.learning!.pitchId,'P07');assert.ok(book.learning!.registration!.calendar!.length>0);assert.equal(book.ledger.baseReservedUnits,100_000);
});

test('medical notices use the real injury and recovery, and CONFIRM_RETURN grants no health or ability effect',()=>{
 let c=closed(ready(),1);const key=c.protagonistKey;c.health.games[0]!.result.injured.push(key);c.health.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'advice-1',seasonKey:c.world.seasonKey};
 const diagnosed=refreshProCareerResultEvents(c);assert.equal(diagnosed.proResults!.notices[0]!.definitionId,'E21');c=closed(diagnosed,2);delete c.health.injuries[key];c.health.games[1]!.result.recovered.push(key);
 const recovered=refreshProCareerResultEvents(c),e=recovered.proResults!.notices.find(x=>x.definitionId==='E23')!,raw=canonicalJson(recovered.world.players[key]),next=resolveProCareerResultEvent(recovered,recovered.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETURN'}).career;
 assert.equal(next.proResults!.returns.length,1);assert.deepEqual(next.health,recovered.health);assert.equal(canonicalJson(next.world.players[key]),raw);assert.deepEqual(refreshProCareerResultEvents(next),next);
});
