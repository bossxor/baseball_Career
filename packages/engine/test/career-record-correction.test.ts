import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enteredKboCareer} from './fixtures.js';
import {activeUsCareer} from './us-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import type {GameContribution} from '../src/records.js';
import {assertContributionSplits} from '../src/records.js';
import {settleRelationshipDirectDuels,directDuelMatchesRecords} from '../src/relationships.js';
import {refreshCareerTraits,settleStarterSeasonTraits} from '../src/high-school-traits.js';
import {correctCareerGameContribution,auditCareerRecordCorrections} from '../src/career-record-correction.js';
import type {CareerRecordCorrectionCommand,RecordCorrectionCareer} from '../src/career-record-correction.js';

function fixture(hits=0,walks=0){
 // Controlled official scoring/day/health receipts isolate correction. This is not a native played game.
 const c=completedHighSchoolCareer(),day=Math.min(...c.world.schedule.filter(g=>g.awayTeamKey===c.world.protagonistSchoolId||g.homeTeamKey===c.world.protagonistSchoolId).map(g=>g.worldDay));
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};c.days.days=c.days.days.filter(d=>d.day<=day);
 c.records.games=Object.fromEntries(Object.entries(c.records.games).filter(([,g])=>g.worldDay<=day));c.health.games=c.health.games.filter(g=>g.evidence.day<=day);
 const g=Object.values(c.records.games).find(g=>Object.hasOwn(g.teams,c.world.protagonistSchoolId))!,other=Object.keys(g.teams).find(k=>k!==c.world.protagonistSchoolId)!,pitcher=c.world.schools.find(s=>s.id===other)!.roster.find(k=>c.world.players[k]!.kind==='PITCHER')!;
 const line=(h:number,bb:number):GameContribution=>{
  const stats={PA:50,AB:50-bb,H:h,BB:bb,HBP:0,K:11,TB:2*h,HR:0,twoB:h,threeB:0,RBI:0},zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0},pitchZero={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
  const row:GameContribution={...structuredClone(g),batting:{own:{...emptyBatting(),...stats,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{[pitcher]:{...emptyPitching(),BF:50,H:h,BB:bb,K:11,outs:11,games:1,starts:1,starterOuts:11,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},batterSplits:{own:{L:{...zero},R:{...stats}}},pitcherSplits:{[pitcher]:{L:{...pitchZero},R:{...pitchZero,BF:50,AB:50-bb,H:h,BB:bb,TB:2*h,K:11,outs:11}}},matchups:{[JSON.stringify(['own',pitcher])]:{batterKey:'own',pitcherKey:pitcher,stats}}};assertContributionSplits(row);return row;
 };
 c.records.games[g.gameKey]=line(hits,walks);
 for(const receipt of c.health.games)if(receipt.evidence.gameKey===g.gameKey)receipt.evidence.appearances=receipt.evidence.roster.filter(k=>k==='own'||k===pitcher).map(playerKey=>({playerKey,riskFatigue:0}));
 const rows=Object.values(c.records.games).filter(g=>g.worldDay===day).sort((a,b)=>a.gameKey<b.gameKey?-1:1);c.days.days.at(-1)!.evidence=canonicalJson({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,day,contributions:rows});
 const pair=JSON.stringify(['own',pitcher].sort());c.relationships={schemaVersion:1,formation:{rival:'FORMED',teammate:'NO_CANDIDATE'},relations:[{relationKey:JSON.stringify(['RIVAL',pair]),normalPairKey:pair,type:'RIVAL',primaryPlayerKey:'own',otherPlayerKey:pitcher,stage:'FORMED',milestones:[{stage:'FORMED',kind:'FORMATION',evidenceKey:'controlled-before-game-formation',worldDay:0}]}]};
 c.relationships=settleRelationshipDirectDuels(c,g.gameKey)!;c.traits=refreshCareerTraits(c,day);
 const command=(contribution:GameContribution,id='official-score-1'):CareerRecordCorrectionCommand=>({correctionId:id,expectedRevision:c.revision,expectedRecordRevision:c.records.revision,beforeEvidence:canonicalJson(c.records.games[g.gameKey]),contribution});
 return {c,line,command,key:g.gameKey,pitcher};
}

test('official correction atomically reevaluates same-game duel before new T14 unlock and keeps world/health immutable',()=>{
 const f=fixture(),before=canonicalJson(f.c),world=canonicalJson(f.c.world),health=canonicalJson(f.c.health),out=correctCareerGameContribution(f.c,f.command(f.line(25,0)));
 assert.equal(out.duplicate,false);assert.equal(out.career.revision,f.c.revision+1);assert.equal(out.career.records.revision,f.c.records.revision+1);
 assert.equal(out.receipt.status,'CORRECTED');assert.equal(out.receipt.beforeDuels[0]!.outcome,'LOSS');assert.equal(out.receipt.afterDuels[0]!.outcome,'WIN');
 assert.ok(directDuelMatchesRecords(out.career,out.career.relationships!.directDuels![0]!));assert.ok(out.career.traits!.owned.own!.unlocked.includes('T14'));assert.deepEqual(out.career.traits!.owned.own!.qualifiedRivalPitcherKeys,[f.pitcher]);
 assert.equal(canonicalJson(out.career.world),world);assert.equal(canonicalJson(out.career.health),health);assert.equal(canonicalJson(f.c),before);assert.deepEqual(out.career.records.games[f.key]!.teams,f.c.records.games[f.key]!.teams);
 assert.notEqual(out.career.days.days.at(-1)!.evidence,f.c.days.days.at(-1)!.evidence);auditCareerRecordCorrections(out.career);
});

test('declining corrected evidence stays below unlock; owned traits/T14 targets survive with before/after receipt evidence',()=>{
 const locked=fixture(1),low=correctCareerGameContribution(locked.c,locked.command(locked.line(0,0)));assert.equal(low.career.traits!.owned.own?.unlocked.includes('T14')??false,false);assert.equal(low.career.relationships!.directDuels![0]!.outcome,'LOSS');
 const unlocked=fixture(25),before=structuredClone(unlocked.c.traits!.owned.own),out=correctCareerGameContribution(unlocked.c,unlocked.command(unlocked.line(0,0)));
 assert.deepEqual(out.career.traits!.owned.own,before);assert.deepEqual(out.receipt.beforeTraits!.owned.own,before);assert.deepEqual(out.receipt.afterTraits!.owned.own,before);
});

test('JSON replay is deterministic; exact receipt replay changes nothing and reused/stale/tampered evidence fails atomically',()=>{
 const f=fixture(),cmd=f.command(f.line(25,0)),first=correctCareerGameContribution(f.c,cmd),copy=JSON.parse(JSON.stringify(f.c)) as typeof f.c;
 assert.equal(canonicalJson(correctCareerGameContribution(copy,JSON.parse(JSON.stringify(cmd)))),canonicalJson(first));
 const retried=correctCareerGameContribution(JSON.parse(JSON.stringify(first.career)),cmd);assert.equal(retried.duplicate,true);assert.equal(canonicalJson(retried.career),canonicalJson(first.career));
 assert.throws(()=>correctCareerGameContribution(first.career,{...cmd,beforeEvidence:'changed'}),/RECEIPT_REUSED/);
 for(const mutate of [(x:CareerRecordCorrectionCommand)=>{x.expectedRevision++;},(x:CareerRecordCorrectionCommand)=>{x.expectedRecordRevision++;},(x:CareerRecordCorrectionCommand)=>{x.beforeEvidence='changed';},(x:CareerRecordCorrectionCommand)=>{x.contribution.worldDay++;},(x:CareerRecordCorrectionCommand)=>{x.contribution.batting.own!.PA++;}]){
  const bad=structuredClone(cmd);mutate(bad);const before=canonicalJson(f.c);assert.throws(()=>correctCareerGameContribution(f.c,bad));assert.equal(canonicalJson(f.c),before);
 }
 for(const mutate of [(c:typeof first.career)=>{c.recordCorrections!.receipts[0]!.after.batting.own!.walkoffHits++;},(c:typeof first.career)=>{c.records.games[f.key]!.batting.own!.walkoffHits++;},(c:typeof first.career)=>{c.relationships!.directDuels![0]!.recordRevision++;},(c:typeof first.career)=>{c.traits!.owned.own!.qualifiedRivalPitcherKeys=[];},(c:typeof first.career)=>{c.days.days.at(-1)!.evidence='changed';}]){const bad=structuredClone(first.career);mutate(bad);assert.throws(()=>auditCareerRecordCorrections(bad),/CORRECTION/);}
});

test('correction marks existing goal CORRECTED and retains its earned reward and already owned trait',()=>{
 const f=fixture(0,30);f.c.revision=1;
 const completion='controlled-earlier-goal-completion';f.c.goals={schemaVersion:1,worldKey:f.c.world.worldKey,playerKey:'own',seasons:{[f.c.world.seasonKey]:{leagueKey:'HS',teamKey:f.c.world.protagonistSchoolId,scheduledGames:48,replacementUsed:false,slots:[{slot:0,goalId:'G04',scope:{seasonKey:f.c.world.seasonKey,leagueKey:'HS',phase:'REGULAR'},teamKey:f.c.world.protagonistSchoolId,status:'COMPLETED',progress:30,selectedRevision:1,completionReceipt:completion}],history:[]}},notices:[],rewards:[{rewardId:'R-G04',type:'STAMP',firstReceipt:completion,sources:[completion]}]};
 const out=correctCareerGameContribution(f.c,f.command(f.line(0,29))),goal=out.career.goals!.seasons[f.c.world.seasonKey]!.slots[0]!;
 assert.equal(goal.status,'CORRECTED');assert.equal(goal.progress,29);assert.deepEqual(out.career.goals!.rewards,f.c.goals.rewards);assert.ok(out.career.traits!.owned.own!.unlocked.includes('T02'));assert.equal(out.career.goals!.notices.at(-1)!.evidence.fields.stage,'CORRECTED');
});

test('historical, pending and finalized roots reject instead of silently rewriting immutable boundaries',()=>{
 const f=fixture(),cmd=f.command(f.line(25,0));
 const archived=structuredClone(f.c);archived.phaseContext={phase:'CAREER_ROUTE'};assert.throws(()=>correctCareerGameContribution(archived,cmd),/SEALED_OR_PENDING/);
 const sealed=structuredClone(f.c);sealed.health.closedSeasons=[sealed.world.seasonKey];assert.throws(()=>correctCareerGameContribution(sealed,cmd),/SEALED_OR_PENDING/);
 const pending=structuredClone(f.c);pending.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:32,pendingGame:{} as never};assert.throws(()=>correctCareerGameContribution(pending,cmd),/SEALED_OR_PENDING/);
 const history=structuredClone(f.c);history.world.seasonKey=String(Number(history.world.seasonKey)+1);assert.throws(()=>correctCareerGameContribution(history,cmd),/SEALED_OR_PENDING/);
 // Real pro admission roots have no current closed date; no fabricated date is accepted for correction.
 for(const root of [enteredKboCareer(),activeUsCareer('HITTER')] as RecordCorrectionCareer[]){const row=Object.values(root.records.games)[0]!;assert.throws(()=>correctCareerGameContribution(root,{correctionId:'pro-closed-boundary',expectedRevision:root.revision,expectedRecordRevision:root.records.revision,beforeEvidence:canonicalJson(row),contribution:{...structuredClone(row),worldDay:row.worldDay+1}}),/SEALED_OR_PENDING/);}
});

test('starter receipt replay orders completed years and retains owned T16 when corrected evidence resets its counter',()=>{
 // Controlled starter receipts isolate chronological recomputation before the root is sealed.
 const f=fixture(),year=Number(f.c.world.seasonKey),years=Array.from({length:5},(_,i)=>String(year-4+i));
 for(const seasonKey of years.slice(0,-1)){const row=structuredClone(f.c.records.games[f.key]!);row.gameKey='controlled-starter-'+seasonKey;row.scope.seasonKey=seasonKey;f.c.records.games[row.gameKey]=row;}
 for(const seasonKey of years)f.c.traits=settleStarterSeasonTraits({...f.c,world:{...f.c.world,seasonKey}},31);
 assert.ok(f.c.traits!.owned[f.pitcher]!.unlocked.includes('T16'));
 const changed=f.line(0,0);changed.pitching[f.pitcher]!.starterOuts=0;
 const out=correctCareerGameContribution(f.c,f.command(changed));assert.equal(out.career.traits!.starterStreaks![f.pitcher]!.streak,0);assert.deepEqual(out.career.traits!.settledStarterSeasons,years);assert.ok(out.career.traits!.owned[f.pitcher]!.unlocked.includes('T16'));
});

