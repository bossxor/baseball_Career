import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {PlayerRelationship} from '../src/relationships.js';
import {enteredKboCareer} from './fixtures.js';
import {enlistInSangmu} from '../src/kbo-military-program.js';
import {createKboServicePayroll,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {emptySangmuUnit} from '../src/kbo-sangmu-unit.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {settleKboArmyTeamReunions,kboTeamReunionNoticeRows} from '../src/kbo-team-reunions.js';
import {unreadKboRelationNotices,resolveKboRelationNotice} from '../src/kbo-relations.js';
import {canonicalJson} from '../src/game.js';

let cached:{c:KboCareer;r:PlayerRelationship}|undefined;
function input(){
 if(!cached){
  const c=enteredKboCareer(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,otherClub=c.world.clubs.find(t=>t.id!==club.id)!,other=otherClub.roster.find(k=>c.world.players[k]!.kind==='HITTER')!,p=c.world.players[other]!;
  // Controlled authentic first-block program/eligibility isolate one real army registration, not eighteen months of service.
  for(const key of otherClub.roster)if(key!==other && c.world.players[key]!.kind==='HITTER')c.world.players[key]!.age=28;
  p.age=19;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};
  const contract=c.world.contracts[c.protagonistKey]!,program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:club.id,selectionSeasonKey:String(Number(c.world.seasonKey)-1),contract,remainingPaidGameDays:144}),second=program.blocks[1]!.seasonKey,y=Number(second);
  contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:second,worldDay:y%4===0&&(y%100!==0||y%400===0)?181:180});club.reservedSalaryWon-=contract.annualSalaryWon-kboContractSeasonCharge(contract);
  c.military={status:'SERVING_SPORTS',applications:[],program};c.sangmu={...emptySangmuUnit(),loaned:[c.protagonistKey]};
  const normalPairKey=JSON.stringify([c.protagonistKey,other].sort()),r:PlayerRelationship={relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,primaryPlayerKey:c.protagonistKey,otherPlayerKey:other,type:'RIVAL',stage:'SEPARATED',milestones:[{stage:'FORMED',worldDay:0,evidenceKey:'controlled-prior-formation'},{stage:'SEPARATED',worldDay:1,evidenceKey:'controlled-prior-separation'}]};c.relationships.relations=[r];c.relationNotices=[];
  const u=startSangmuCohort(c,c.revision);assert.ok(u.sangmu!.members[other]);const pre=confirmKboPreseasonPlan(u,u.revision),opening=confirmKboOpeningRoster(pre,pre.revision),s=confirmKboSeasonSchedule(opening,opening.revision),ready=startKboRegularSeason(s,s.revision),game=ready.competitionSchedule!.leagues.FUTURES.find(g=>[g.homeTeamKey,g.awayTeamKey].includes('SANGMU'))!;
  ready.competitionSchedule!.leagues={KBO:[],FUTURES:[game]};ready.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:game.worldDay,pendingGame:null};cached={c:ready,r};
 }
 return structuredClone(cached);
}
function finishDay(source:KboCareer){let c=source;for(let i=0;i<150;i++){const r=advanceKboCareer(JSON.parse(JSON.stringify(c)),c.revision);c=r.career;assert.notEqual(r.stopReason,'ENGINE_LIMIT');if(r.daysClosed)return c;}throw Error('DAY_LIMIT');}

test('actual shared army registration reunites a rival once with immutable registration proof and JSON replay',()=>{
 const {c,r}=input(),before=canonicalJson(c),a=finishDay(c),b=finishDay(JSON.parse(before));assert.deepEqual(a,b);assert.equal(canonicalJson(c),before);
 const actual=a.relationships.relations[0]!;assert.equal(actual.type,'RIVAL');assert.equal(actual.stage,'REUNITED_TEAM');assert.deepEqual(actual.milestones.slice(0,-1),r.milestones);
 const notice=kboTeamReunionNoticeRows(a)[0]!;assert.ok(notice);assert.equal(notice.definitionId,'E96');
 const snapshot=canonicalJson(a);settleKboArmyTeamReunions(a,a.days!.days.at(-1)!.day);assert.equal(canonicalJson(a),snapshot);
 const event=a.relationNotices.find(e=>e.eventKey===notice.eventKey)!,id=JSON.parse(event.evidence.fields.sharedTeamRegistrationReceiptId as string);assert.equal(id[0],'kbo-army-shared-registration');assert.equal(id[1],r.relationKey);
 assert.ok(a.health.games.some(h=>h.evidence.gameKey===id[2] && h.evidence.teamKey==='FUTURES:SANGMU' && h.evidence.roster.includes(r.primaryPlayerKey) && h.evidence.roster.includes(r.otherPlayerKey)));
});

test('injured bench registration qualifies without pretending there was an opposing appearance',()=>{
 const {c,r}=input();c.health.games=[...c.health.games,{evidence:{gameKey:'controlled-pre-game-injury',teamKey:'FUTURES:SANGMU',seasonKey:c.world.seasonKey,day:0,roster:[r.otherPlayerKey],appearances:[{playerKey:r.otherPlayerKey,riskFatigue:81}]},result:{injured:[r.otherPlayerKey],recovered:[]}}];c.health.injuries[r.otherPlayerKey]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'controlled-pre-game-injury',seasonKey:c.world.seasonKey};
 const a=finishDay(c),game=Object.values(a.records.games).find(g=>g.scope.seasonKey===a.world.seasonKey && Object.hasOwn(g.teams,'SANGMU'))!;
 assert.ok(!game.batting[r.otherPlayerKey]);assert.equal(kboTeamReunionNoticeRows(a).length,1);assert.ok(!a.relationNotices.some(e=>e.definitionId==='E95'));
});

test('army reunion acknowledgement changes only metadata and preserves the current phase, money, growth and records',()=>{
 const a=finishDay(input().c),before=canonicalJson(a),n=unreadKboRelationNotices(a).find(e=>e.definitionId==='E96')!;assert.ok(n);
 const read=resolveKboRelationNotice(a,a.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}).career;
 for(const key of ['world','sangmu','records','health','days','phaseContext','relationships','seasonGrowth','development'] as const)assert.equal(canonicalJson(read[key]),canonicalJson(a[key]));
 assert.ok(!unreadKboRelationNotices(read).some(e=>e.eventKey===n.eventKey));assert.equal(canonicalJson(a),before);
 assert.throws(()=>resolveKboRelationNotice(a,a.revision-1,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}));
});

test('historical army registration remains readable after current membership changes; damaged proof rejects without mutation',()=>{
 const a=finishDay(input().c),later=structuredClone(a);delete later.sangmu;assert.equal(kboTeamReunionNoticeRows(later).length,1);
 const army=a.health.games.find(h=>h.evidence.teamKey==='FUTURES:SANGMU')!;
 for(const mutate of [(x:KboCareer)=>{x.health.games=x.health.games.filter(h=>h.evidence.teamKey!=='FUTURES:SANGMU');},(x:KboCareer)=>{x.health.games=[...x.health.games,structuredClone(army)];},(x:KboCareer)=>{x.health.games.find(h=>h.evidence.teamKey==='FUTURES:SANGMU')!.evidence.roster=[...army.evidence.roster,'forged-roster-member'];},(x:KboCareer)=>{x.relationNotices=x.relationNotices.map(e=>e.definitionId==='E96'?{...e,resume:{...e.resume,phase:'PRESEASON_SETUP'}}:e);}]){
  const changed=structuredClone(a);mutate(changed);const before=canonicalJson(changed);assert.throws(()=>kboTeamReunionNoticeRows(changed));assert.equal(canonicalJson(changed),before);
 }
});

test('formed relations and army games without legacy health registration do not manufacture a reunion',()=>{
 const formed=input();formed.c.relationships.relations[0]!.stage='FORMED';const a=finishDay(formed.c);assert.equal(kboTeamReunionNoticeRows(a).length,0);
 const legacy=input();delete legacy.c.sangmu!.emergency;const old=finishDay(legacy.c);assert.ok(!old.health.games.some(h=>h.evidence.teamKey==='FUTURES:SANGMU'));assert.equal(kboTeamReunionNoticeRows(old).length,0);
 const absent=input();absent.c.relationships.relations[0]!.otherPlayerKey='not-registered';const r=absent.c.relationships.relations[0]!;r.normalPairKey=JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort());r.relationKey=JSON.stringify([r.type,r.normalPairKey]);assert.equal(kboTeamReunionNoticeRows(finishDay(absent.c)).length,0);
});

test('reunion processing requires a closed date and leaves non-relation game results unchanged',()=>{
 const {c}=input(),before=canonicalJson(c);assert.throws(()=>settleKboArmyTeamReunions(c,c.phaseContext.phase==='SEASON_PROGRESS'?c.phaseContext.nextWorldDay:0),/KBO_ARMY_REUNION_DAY_NOT_FINAL/);assert.equal(canonicalJson(c),before);
 const noRelation=structuredClone(c);noRelation.relationships.relations=[];const control=finishDay(noRelation),actual=finishDay(c);
 for(const field of ['world','sangmu','records','health','days','development','seasonGrowth','traits'] as const)assert.deepEqual(actual[field],control[field]);
 const duplicate=structuredClone(c);duplicate.relationships.relations=[...duplicate.relationships.relations,structuredClone(duplicate.relationships.relations[0]!)];const bad=canonicalJson(duplicate);assert.throws(()=>finishDay(duplicate),/DUPLICATE_CAREER_RELATION/);assert.equal(canonicalJson(duplicate),bad);
});
