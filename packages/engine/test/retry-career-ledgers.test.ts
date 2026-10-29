import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer} from '../src/high-school-career.js';
import {canonicalJson} from '../src/game.js';
import {openRetryCareerEpisode,retryCareerRouteView,beginRetryPreparation,completeRetryPreparation,assertRetryCareerLedger} from '../src/retry-career.js';
import type {RetryRouteAuthority} from '../src/retry-career.js';
import {startPreparationSeason,confirmPreparationPreseason,advancePreparationSeason,completePreparationSeason,assertPreparationSeason,trainPreparationSeason,setPreparationPlan} from '../src/preparation-season.js';
import type {PreparationWorld} from '../src/preparation-season.js';
import {assertUsAmateurReturnLedger,settleUsAmateurServiceYear,cancelUsAmateurReturnForUsOffer} from '../src/us-amateur-return.js';
import type {UsAmateurReturnLedger} from '../src/us-amateur-return.js';
import {usMilitaryCompletionDays} from '../src/us-military-plan.js';
import type {UsMilitaryServiceProgram} from '../src/us-military-plan.js';

function episode(age=18,seasonKey='2029') {return openRetryCareerEpisode(undefined,0,{worldKey:'retry-world',playerKey:'own',receiptKey:'undrafted',reason:'HIGH_SCHOOL_UNDRAFTED',seasonKey,age});}
function authority(age=18,seasonKey='2029'):RetryRouteAuthority{return {worldKey:'retry-world',playerKey:'own',seasonKey,age,worldDay:300,authorityRevision:1,hasProContractHistory:false,activeContract:false,domesticRightsAvailable:true,domesticDraftEligible:true,mandatoryReturnActive:false,militaryStatus:'NOT_APPLICABLE',collegeAdmissionRefs:[],collegeResumeRef:null,domesticOffers:[],usOffers:[],usScoutScore:80,usRightsEligible:true,retirementAllowed:true};}
function fixture(){
 const world=createHighSchoolWorld({worldKey:'retry-world',seasonKey:'2030',seasonYear:2030,seed:'retry-actual-48',schoolId:'H01',player:{simulationKey:'own',name:'재도전',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'GROWTH'}});
 world.players.own={...world.players.own!,age:19};
 const root=createHighSchoolCareer(world,'GROWTH'),retry=episode(),a=authority();
 const independent:PreparationWorld={...world,leagueKey:'INDEPENDENT',calendar:world.calendar!,schedule:world.schedule.map(g=>({...g,leagueKey:'INDEPENDENT'}))};
 return startPreparationSeason(retry,retry.revision,a,{episodeId:retry.episodes[0]!.episodeId,routePreviewId:retryCareerRouteView(retry,a).routePreviewId,world:independent,difficulty:'GROWTH',records:root.records,health:root.health,development:root.development!,styleUsedWindows:[]});
}
test('RETRY lifetime budget CAS, exact receipt replay, current-age college entry and actual offer expiry',()=>{
 let s=episode(20);const a=authority(20);a.collegeAdmissionRefs=['actual-admission'];
 assert.equal(retryCareerRouteView(s,a).routes.find(r=>r.routeId==='COLLEGE_ENTRY')!.ageAtCompletion,23);
 assert.ok(!retryCareerRouteView(s,{...a,hasProContractHistory:true}).routes.some(r=>r.routeId==='COLLEGE_ENTRY'));
 assert.ok(!retryCareerRouteView(s,{...a,usOffers:[{offerRef:'expired',expiresGameDay:300}]}).routes.some(r=>r.routeId==='US_CONTRACT'));
 for(let i=0;i<3;i++){
  const current={...a,age:s.age,seasonKey:s.seasonKey};const view=retryCareerRouteView(s,current),before=canonicalJson(s);
  assert.throws(()=>beginRetryPreparation(s,s.revision,{...current,authorityRevision:2},{episodeId:s.episodes[0]!.episodeId,seasonKey:String(Number(s.seasonKey)+1),routePreviewId:view.routePreviewId,startDay:31,endDay:181}),/PREVIEW_STALE/);
  assert.equal(canonicalJson(s),before);
  s=beginRetryPreparation(s,s.revision,current,{episodeId:s.episodes[0]!.episodeId,seasonKey:String(Number(s.seasonKey)+1),routePreviewId:view.routePreviewId,startDay:31,endDay:181});
  s={...s,phase:'PREPARATION_REGULAR'};s=completeRetryPreparation(s,s.revision,{seasonKey:s.seasonKey,episodeId:s.episodes[0]!.episodeId,evidenceReceipt:`actual-${i}`});
  assert.deepEqual(completeRetryPreparation(JSON.parse(JSON.stringify(s)),s.revision,{seasonKey:s.seasonKey,episodeId:s.episodes[0]!.episodeId,evidenceReceipt:`actual-${i}`}),s);
  assert.equal(s.careerPreparationUsed,i+1);assertRetryCareerLedger(s);
 }
 const view=retryCareerRouteView(s,{...a,age:s.age,seasonKey:s.seasonKey,collegeAdmissionRefs:[]});assert.equal(view.preparation.remaining,0);assert.ok(!view.routes.some(r=>r.routeId==='PREPARATION'));
 assert.throws(()=>completeRetryPreparation(s,s.revision-1,{seasonKey:s.seasonKey,episodeId:s.episodes[0]!.episodeId,evidenceReceipt:'actual-2'}),/REVISION_CHANGED/);
 const reopened=openRetryCareerEpisode(s,s.revision,{worldKey:s.worldKey,playerKey:s.playerKey,receiptKey:'second-undrafted',reason:'AMATEUR_RETURN_UNDRAFTED',seasonKey:s.seasonKey,age:s.age});assert.equal(reopened.careerPreparationUsed,3);
});
test('RETRY mandatory return completed periods never consume the optional lifetime budget',()=>{
 const s=episode(),mandatory={...s,seasonKey:'2030',age:19,phase:'PREPARATION_REGULAR' as const,periods:[{worldSeasonId:'2030',episodeId:s.episodes[0]!.episodeId,startDay:31,endDay:181,usageCharged:false,evidenceReceipt:null,kind:'MANDATORY_RETURN' as const}]};
 const done=completeRetryPreparation(mandatory,mandatory.revision,{seasonKey:'2030',episodeId:s.episodes[0]!.episodeId,evidenceReceipt:'return-actual-48'});assert.equal(done.careerPreparationUsed,0);assert.equal(done.periods[0]!.usageCharged,false);
 assert.throws(()=>assertRetryCareerLedger({...done,careerPreparationUsed:1}),/BUDGET_MISMATCH/);
});
test('PREPARATION real 48 games, bounded JSON resume, official records, full annual growth and one charge',()=>{
 const start=fixture(),saved=canonicalJson(start);let s=confirmPreparationPreseason(start,start.revision);
 assert.throws(()=>completePreparationSeason(s,s.revision),/INCOMPLETE/);
 assert.throws(()=>trainPreparationSeason(s,s.revision,{type:'SKIP'}),/WINDOW_CLOSED/);
 for(let i=0;i<1800&&s.nextWorldDay<=Math.max(...s.world.schedule.map(g=>g.worldDay));i++){
  const before=canonicalJson(s),out=advancePreparationSeason(s,s.revision,'ONE_MONTH');
  assert.equal(canonicalJson(s),before);assert.notEqual(out.stopReason,'ENGINE_LIMIT');
  if(i===0)assert.equal(canonicalJson(advancePreparationSeason(JSON.parse(JSON.stringify(s)),s.revision,'ONE_MONTH')),canonicalJson(out));
  s=out.career;
 }
 const done=completePreparationSeason(s,s.revision);assertPreparationSeason(JSON.parse(JSON.stringify(done)));
 assert.equal(done.retry.careerPreparationUsed,1);assert.equal(done.result!.completedTeamGames,48);
 assert.equal(done.seasonGrowth.entries.length,done.world.calendar.growthDays.length);assert.equal(done.health.closedSeasons.includes('2030'),true);
 assert.equal(Object.values(done.records.games).filter(g=>Object.hasOwn(g.teams,done.world.protagonistSchoolId)).length,48);
 assert.equal(canonicalJson(completePreparationSeason(done,done.revision)),canonicalJson(done));assert.equal(canonicalJson(start),saved);
 assert.throws(()=>setPreparationPlan(done,done.revision,done.world.players.own!.focus,'BALANCED'),/PHASE/);
});
test('RETURN18 months shares exactly two seasons, ACTIVE growth zero, actual US offer only and draft age35',()=>{
 const player=fixture().world.players.own!;player.age=33;
 let s:UsAmateurReturnLedger={version:1,revision:1,returnId:JSON.stringify(['us-amateur-return','retry-world','own','2030','minor-expired']),worldKey:'retry-world',playerKey:'own',sourceSeasonKey:'2030',sourceRevision:4,sourceContractKey:'minor-expired',sourceAge:33,sourcePlayer:player,origin:'HIGH_SCHOOL_DIRECT',status:'PREPARING',militaryStatus:'UNRESOLVED',years:[],draftReservationKey:null};
 assertUsAmateurReturnLedger(s);assert.throws(()=>assertUsAmateurReturnLedger({...s,sourceAge:34}),/INVALID/);
 const completionDays=usMilitaryCompletionDays('2030');const service:UsMilitaryServiceProgram={programId:JSON.stringify(['us-military-service','retry-world','2030','own']),planSeasonKey:'2030',scheduledBlocks:2,completionDays,completedBlocks:2,blocks:completionDays.map((d,i)=>({seasonKey:d.seasonKey,kind:i===0?'FULL_DOMESTIC_SEASON':'FIRST_HALF_SEASON',completedWorldDay:d.worldDay}))};
 let p={...player,age:34};const one=settleUsAmateurServiceYear(s,s.revision,{player:p,seasonKey:'2031',service,records:{revision:0,games:{}}});
 assert.equal(one.seasonGrowth.totalBudgetUnits,0);assert.equal(one.return.years.length,1);s=one.return;p={...one.player,age:35};
 const two=settleUsAmateurServiceYear(s,s.revision,{player:p,seasonKey:'2032',service,records:{revision:0,games:{}}});s=two.return;
 assert.equal(s.status,'DRAFT_READY');assert.equal(s.years.length,2);assert.equal(s.militaryStatus,'COMPLETED');assert.ok(s.draftReservationKey);assert.equal(two.seasonGrowth.entries.length,2);
 assert.deepEqual(settleUsAmateurServiceYear(JSON.parse(JSON.stringify(s)),s.revision,{player:two.player,seasonKey:'2032',service,records:{revision:0,games:{}},seasonGrowth:two.seasonGrowth}).return,s);
 const a=authority(35,'2032');assert.throws(()=>cancelUsAmateurReturnForUsOffer(s,s.revision,a,{offerRef:'fake',authorityRevision:1}),/OPTION_EXPIRED/);
 a.usOffers=[{offerRef:'actual',expiresGameDay:301}];const cancelled=cancelUsAmateurReturnForUsOffer(s,s.revision,a,{offerRef:'actual',authorityRevision:1});assert.equal(cancelled.status,'CANCELLED_US');assert.equal(cancelled.draftReservationKey,null);assert.deepEqual(cancelled.years,s.years);
});
