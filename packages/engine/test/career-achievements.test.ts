import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedUsCareer} from './us-fixtures.js';
import {enteredKboCareer,completedCollegeAcademicYear,enrolledCollegeCareer} from './fixtures.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {graduateCollegeCareer} from '../src/college-graduation.js';
import {enlistInActiveService,completeKboMilitaryBlock} from '../src/kbo-military-program.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import {canonicalJson} from '../src/game.js';
import {createWorldEvent} from '../src/events.js';
import {refreshCareerAchievements,careerAchievementsView} from '../src/career-achievements.js';
import type {AchievementCareer} from '../src/career-achievements.js';
import type {GameContribution} from '../src/records.js';
const cache=new Map<string,AchievementCareer>();
test('A07 requires earned athlete eligibility and three completed consecutive duty seasons across school/KBO/US roots',()=>{
 // Controlled earned-benefit/duty receipts isolate the achievement predicate; no military program or native medal is fabricated.
 const sources:AchievementCareer[]=[enrolledCollegeCareer(),kbo(),us()];
 for(const original of sources){
  const c=structuredClone(original),year=Number(c.world.seasonKey),start=String(year-2),settled=[start,String(year-1),String(year)],competitionId='controlled-earned-athlete-benefit';delete c.achievements;
  c.national={invitations:[],competitions:[{competitionId,tournament:'AG',seasonKey:String(year-3),medal:'GOLD',finalRank:1,registered:true,officialAppearance:true,resultVersion:1}],benefits:[{competitionId,benefitKey:JSON.stringify(['national-benefit',competitionId,'ATHLETE_ELIGIBLE']),benefitType:'ATHLETE_ELIGIBLE',appliedRevision:1,resultVersion:1}],athleteDutyStartSeasonKey:start,athleteDutySettledSeasons:settled,athleteDutySeasonsRemaining:0};
  if('protagonistKey'in c)c.military={...c.military!,status:'COMPLETED'};else c.national.militaryStatus='COMPLETED';
  const before=canonicalJson(c),done=refreshCareerAchievements(c),unlock=done.achievements!.unlocks.find(u=>u.achievementId==='A07')!;
  assert.ok(unlock);assert.equal(unlock.evidence.seasonKey,String(year));assert.match(unlock.evidence.sourceKey,/athlete-duty-complete/);assert.equal(canonicalJson(c),before);assert.equal(refreshCareerAchievements(done),done);assert.deepEqual(refreshCareerAchievements(JSON.parse(JSON.stringify(done))),done);
  const partial=structuredClone(c);partial.national!.athleteDutySeasonsRemaining=1;partial.national!.athleteDutySettledSeasons=settled.slice(0,2);if('protagonistKey'in partial)partial.military={...partial.military!,status:'ATHLETE_SERVICE'};else partial.national!.militaryStatus='ATHLETE_SERVICE';assert.ok(!ids(refreshCareerAchievements(partial)).includes('A07'));
  const statusOnly=structuredClone(c);delete statusOnly.national;assert.ok(!ids(refreshCareerAchievements(statusOnly)).includes('A07'));
  const gap=structuredClone(c);gap.national!.athleteDutySettledSeasons=[start,String(year),String(year+1)];assert.throws(()=>refreshCareerAchievements(gap),/ATHLETE_DUTY/);
  const missingBenefit=structuredClone(c);missingBenefit.national!.benefits=[];assert.throws(()=>refreshCareerAchievements(missingBenefit),/ATHLETE_DUTY/);
 }
});
function us(){if(!cache.has('us'))cache.set('us',preparedUsCareer());return structuredClone(cache.get('us')!) as ReturnType<typeof preparedUsCareer>&AchievementCareer;}
function kbo(){if(!cache.has('kbo'))cache.set('kbo',enteredKboCareer());return structuredClone(cache.get('kbo')!) as ReturnType<typeof enteredKboCareer>&AchievementCareer;}
function ids(c:AchievementCareer){return careerAchievementsView(c).achievements.filter(a=>a.status==='COMPLETED').map(a=>a.achievementId);}
/** Controlled official contribution rows isolate predicates; they are not native season evidence. */
function row(c:AchievementCareer,league:string,day:number,stats:{H?:number;W?:number;SV?:number;PA?:number;BF?:number}={}){
 const key='protagonistKey'in c?c.protagonistKey:c.world.protagonistKey,b={...emptyBatting(),PA:stats.PA??1,AB:stats.H??0,H:stats.H??0,TB:stats.H??0,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0},p={...emptyPitching(),BF:stats.BF??0,games:1,starts:0,starterOuts:0,loadedBF:0,W:stats.W??0,L:0,SV:stats.SV??0,HLD:0,BS:0,shutouts:0};
 const split={PA:b.PA,AB:b.AB,H:b.H,BB:0,HBP:0,K:0,TB:b.TB,HR:0,twoB:0,threeB:0,RBI:0},ps={BF:p.BF,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0},gameKey=JSON.stringify(['achievement-controlled',league,day]);
 const g:GameContribution={gameKey,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{own:{games:1,W:0,L:0,T:1,R:0,RA:0},other:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{[key]:b},pitching:{[key]:p},batterSplits:{[key]:{L:{...split,PA:0,AB:0,H:0,TB:0},R:split}},pitcherSplits:{[key]:{L:{...ps,BF:0},R:ps}},matchups:{}};c.records.games[gameKey]=g;c.records.revision++;return g;
}
test('actual KBO/MiLB signing gives one immutable A01 receipt, cosmetic and E90, read/replay/JSON mutate nothing',()=>{
 for(const c of [us(),kbo()]){delete c.achievements;const before=canonicalJson(c),done=refreshCareerAchievements(c);assert.ok(ids(done).includes('A01'));assert.equal(canonicalJson(c),before);assert.equal(done.world,c.world);assert.equal(done.records,c.records);assert.equal(done.events,c.events);assert.equal(done.achievements!.unlocks.filter(a=>a.achievementId==='A01').length,1);assert.equal(done.achievements!.rewards.filter(a=>a.rewardId==='R-A01').length,1);assert.equal(done.achievements!.notices.filter(a=>a.evidence.fields.goalId==='A01').length,1);assert.equal(refreshCareerAchievements(done),done);assert.deepEqual(refreshCareerAchievements(JSON.parse(JSON.stringify(done))),done);const view=careerAchievementsView(done);assert.equal(view.gameplayRewardDelta,0);assert.equal(view.achievements.length,12);assert.doesNotMatch(JSON.stringify(view),/potential|rng|seed|sourceBasis|evidenceKey/);view.rewards[0]!.sources.push('untrusted');assert.equal(done.achievements!.rewards[0]!.sources.length,1);}
});
test('first appearances require actual PA/BF; career milestone totals never combine leagues or postseason',()=>{
 let c=us();delete c.achievements;row(c,'KBO',10,{PA:0});row(c,'MLB',11,{PA:0});c=refreshCareerAchievements(c);assert.ok(!ids(c).includes('A02'));assert.ok(!ids(c).includes('A03'));row(c,'KBO',12,{H:600});row(c,'MLB',13,{H:400});c=refreshCareerAchievements(c);assert.ok(ids(c).includes('A02'));assert.ok(ids(c).includes('A03'));assert.ok(!ids(c).includes('A08'));const ps=row(c,'KBO',14,{H:400});ps.scope.phase='POSTSEASON';c=refreshCareerAchievements(c);assert.ok(!ids(c).includes('A08'));row(c,'KBO',15,{H:400});c=refreshCareerAchievements(c);assert.ok(ids(c).includes('A08'));assert.equal(c.achievements!.unlocks.find(a=>a.achievementId==='A08')!.evidence.leagueKey,'KBO');
});
test('career W100 and SV200 use one league across years; correction keeps first evidence and cosmetics',()=>{
 let c=us();delete c.achievements;row(c,'KBO',20,{W:60,SV:100,BF:1});row(c,'MLB',21,{W:40,SV:100,BF:1});c=refreshCareerAchievements(c);assert.ok(!ids(c).includes('A09'));assert.ok(!ids(c).includes('A10'));const final=row(c,'KBO',22,{W:40,SV:100,BF:1});final.scope.seasonKey=String(Number(c.world.seasonKey)-1);c=refreshCareerAchievements(c);assert.ok(ids(c).includes('A09'));assert.ok(ids(c).includes('A10'));const first=canonicalJson(c.achievements!.unlocks.find(a=>a.achievementId==='A09')!.evidence),receipt=c.achievements!.unlocks.find(a=>a.achievementId==='A09')!.receiptKey;delete c.records.games[final.gameKey];const changed=refreshCareerAchievements(c);assert.equal(changed.achievements!.unlocks.find(a=>a.achievementId==='A09')!.status,'CORRECTED');assert.equal(canonicalJson(changed.achievements!.unlocks.find(a=>a.achievementId==='A09')!.evidence),first);assert.equal(changed.achievements!.unlocks.find(a=>a.achievementId==='A09')!.receiptKey,receipt);assert.ok(changed.achievements!.rewards.some(a=>a.rewardId==='R-A09'));assert.equal(refreshCareerAchievements(changed),changed);
});
test('international/posting and archive alone cannot invent milestones; A12 needs both actual leagues plus retirement receipt',()=>{
 let c=us();delete c.achievements;const view=careerAchievementsView(c);for(const id of ['A04','A06']){const a=view.achievements.find(a=>a.achievementId===id)!;assert.equal(a.status,'LOCKED');assert.equal(a.unavailableReason,null);}
 c.phaseContext={phase:'ARCHIVED'};c=refreshCareerAchievements(c);assert.ok(!ids(c).includes('A12'));row(c,'KBO',25);row(c,'MLB',26);c=refreshCareerAchievements(c);assert.ok(!ids(c).includes('A12'));c.retirement={receiptKey:JSON.stringify(['us-retirement',c.world.worldKey,c.world.seasonKey,c.protagonistKey]),seasonKey:c.world.seasonKey,age:c.world.players[c.protagonistKey]!.age,clubId:c.protagonistOrganizationId,endedContractKey:c.contract.contractKey,sourceRevision:c.revision,reason:'VOLUNTARY'};c=refreshCareerAchievements(c);assert.ok(ids(c).includes('A12'));assert.equal(c.achievements!.rewards.find(r=>r.rewardId==='R-A12')!.type,'COVER');
});
test('malformed unlock identity, duplicate reward, forged receipt and unsupported awards are rejected',()=>{
 const c=refreshCareerAchievements(us());for(const mutate of [(s:typeof c)=>{s.achievements!.playerKey='other';},(s:typeof c)=>{s.achievements!.unlocks[0]!.receiptKey='forged';},(s:typeof c)=>{s.achievements!.rewards.push({...s.achievements!.rewards[0]!});},(s:typeof c)=>{s.achievements!.unlocks[0]!.achievementId='A04';}]){const bad=structuredClone(c);mutate(bad);const before=canonicalJson(bad);assert.throws(()=>refreshCareerAchievements(bad),/ACHIEVEMENT/);assert.equal(canonicalJson(bad),before);}
 const bad=us();delete bad.achievements;bad.amateurHistory.usRecruitment!.program.signing!.receiptKey='forged';assert.throws(()=>refreshCareerAchievements(bad));
});
test('college graduation requires resolved E75, not four completed years or an enrollment status toggle',()=>{
 let c=enrolledCollegeCareer();for(let year=1;year<=4;year++){c=completedCollegeAcademicYear(c);if(year<4){const ready=closeCollegeSeasonForNextYear(c,c.revision,true);c=startNextCollegeSeason(ready,ready.revision);}}assert.ok(!ids(refreshCareerAchievements(c)).includes('A05'));const degree=graduateCollegeCareer(c,c.revision,c.events.at(-1)!.version),done=refreshCareerAchievements(degree);assert.ok(ids(done).includes('A05'));assert.equal(refreshCareerAchievements(done),done);const forged=structuredClone(c);forged.collegeAdmission!.status='GRADUATED';assert.ok(!ids(refreshCareerAchievements(forged)).includes('A05'));
});
test('military COMPLETED needs both actual completed service blocks and return receipt, not status alone',()=>{
 let c=kbo();delete c.achievements;c.military={status:'COMPLETED',applications:[]};assert.ok(!ids(refreshCareerAchievements(c)).includes('A07'));let p=enlistInActiveService({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:c.world.seasonKey,contract:c.world.contracts[c.protagonistKey]!,remainingPaidGameDays:144});p=completeKboMilitaryBlock(p,p.blocks[0]!.seasonKey,300);p=completeKboMilitaryBlock(p,p.blocks[1]!.seasonKey,181);c.military={status:'COMPLETED',applications:[],program:p,completedSeasonKey:p.blocks[1]!.seasonKey};c=refreshCareerAchievements(c);assert.ok(ids(c).includes('A07'));assert.equal(refreshCareerAchievements(c),c);
});
test('A11 needs the original high-school rival plus an actual reunion game and evidenced registrations',()=>{
 let c=kbo();delete c.achievements;const other=Object.values(c.amateurHistory.world.players).find(p=>p.simulationKey!==c.protagonistKey&&p.kind==='HITTER')!.simulationKey,pair=JSON.stringify([c.protagonistKey,other].sort()),rival={relationKey:JSON.stringify(['RIVAL',pair]),type:'RIVAL' as const,normalPairKey:pair,primaryPlayerKey:c.protagonistKey,otherPlayerKey:other,stage:'FORMED' as import('../src/relationships.js').RelationStage,milestones:[{stage:'FORMED' as const,evidenceKey:JSON.stringify(['hs-formation',c.world.worldKey,'RIVAL']),worldDay:0}] as import('../src/relationships.js').RelationMilestone[]};c.relationships.relations=[...c.relationships.relations,rival];c.amateurHistory.relationships={schemaVersion:1,relations:[structuredClone(rival)],formation:{rival:'FORMED',teammate:'NO_CANDIDATE'}};const g=row(c,'KBO',40),key=c.protagonistKey;g.batting[rival.otherPlayerKey]={...g.batting[key]!};g.batterSplits[rival.otherPlayerKey]=structuredClone(g.batterSplits[key]!);
 const separated={stage:'SEPARATED' as const,evidenceKey:'separated-controlled',worldDay:30};rival.milestones=[...rival.milestones,separated];rival.stage='SEPARATED';
 const notice=createWorldEvent({definitionId:'E95',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:rival.relationKey,stageEvidenceId:separated.evidenceKey,actualMeetingGameId:g.gameKey}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'KBO',registrationKey:'own',sourceRevision:c.revision},sourceSequence:1,worldDay:g.worldDay});
 c.relationNotices=[notice];rival.stage='REUNITED_OPPONENT';rival.milestones=[...rival.milestones,{stage:'REUNITED_OPPONENT',evidenceKey:notice.evidenceKey,worldDay:g.worldDay}];assert.ok(!ids(refreshCareerAchievements(c)).includes('A11'));
 c.health.games=[...c.health.games,...[key,rival.otherPlayerKey].map((k,i)=>({evidence:{gameKey:g.gameKey,teamKey:'KBO:'+(i===0?'own':'other'),seasonKey:g.scope.seasonKey,day:g.worldDay,roster:[k],appearances:[{playerKey:k,riskFatigue:0}]},result:{injured:[],recovered:[]}}))];
 c=refreshCareerAchievements(c);assert.ok(ids(c).includes('A11'));assert.equal(refreshCareerAchievements(c),c);const forged=structuredClone(c);delete forged.achievements;forged.relationships.relations.find(r=>r.relationKey===rival.relationKey)!.milestones=[];assert.ok(!ids(refreshCareerAchievements(forged)).includes('A11'));
});



test('career aggregation ignores NPC-only rows and reads no NPC statistics while preserving milestone results',()=>{
 const c=us();delete c.achievements;row(c,'KBO',52,{H:1000,W:100,SV:200,BF:1});const expected=careerAchievementsView(refreshCareerAchievements(c));let npcReads=0;const template=Object.values(c.records.games).at(-1)!,line={...template.batting[c.protagonistKey]!},split=structuredClone(template.batterSplits[c.protagonistKey]!);
 for(let i=0;i<3857;i++){const game=structuredClone(template);game.gameKey='npc-only-'+i;game.scope={seasonKey:c.world.seasonKey,leagueKey:'MLB',phase:'REGULAR'};game.batting={};game.pitching={};game.batterSplits={};game.pitcherSplits={};game.matchups={};game.teams={};Object.defineProperty(game.batting,'npc-noise',{enumerable:true,get(){npcReads++;return line;}});game.batterSplits['npc-noise']=structuredClone(split);c.records.games[game.gameKey]=game;}
 const actual=careerAchievementsView(refreshCareerAchievements(c));assert.deepEqual(actual,expected);assert.equal(npcReads,0,'achievement totals must not aggregate unrelated players');
});
test('unchanged refresh validates its sources without cloning an already earned achievement ledger',t=>{
 const c=refreshCareerAchievements(us()),clone=globalThis.structuredClone;let copies=0;t.mock.method(globalThis,'structuredClone',<T>(value:T)=>{copies++;return clone(value);});assert.equal(refreshCareerAchievements(c),c);assert.equal(copies,0,'a no-op must not deep-copy immutable receipts/outbox');
});
