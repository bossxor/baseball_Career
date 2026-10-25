import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {PlayerRelationship} from '../src/relationships.js';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {enlistInSangmu} from '../src/kbo-military-program.js';
import {createKboServicePayroll} from '../src/kbo-service-payroll.js';
import {closeKboNpcMilitaryCalendarDay,settleKboNpcMilitaryPayrollDay} from '../src/kbo-npc-military.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {offerKboRenewal,acceptKboRenewal,kboContractDecisionRequired} from '../src/kbo-renewal.js';
import {settleKboReturnedTeamReunions,kboTeamReunionNoticeRows} from '../src/kbo-team-reunions.js';
import {resolveKboRelationNotice,unreadKboRelationNotices} from '../src/kbo-relations.js';
import {signKboRequiredReplacement} from '../src/kbo-roster-repair.js';
import {kboClubBalance} from '../src/kbo-finance.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {KBO_MONEY} from '@playball/rules';
import {canonicalJson} from '../src/game.js';

function ready(c:KboCareer){const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);}
function closeFirst(source:KboCareer){
 let c=ready(source);const all=Object.values(c.competitionSchedule!.leagues).flat(),first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 // Only unplayed regular dates use a controlled clock; postseason, growth, closure and Y02 use their real commands.
 c.days!.days=Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-before-return',result:{injured:[],recovered:[]}}));c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last+1,pendingGame:null};closeKboNpcMilitaryCalendarDay(c,last);c.phaseContext={phase:'SEASON_REVIEW'};
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;c=closeKboSeason(c,c.revision,true);
 if(kboContractDecisionRequired(c)){const offer=offerKboRenewal(c,c.revision);c=acceptKboRenewal(offer,offer.revision,{eventKey:offer.renewal!.eventKey,eventVersion:offer.events.find(e=>e.eventKey===offer.renewal!.eventKey)!.version});}
 return c;
}
function primaryLeague(c:KboCareer,league:'KBO'|'FUTURES'){
 const club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,me=c.world.players[c.protagonistKey]!,isFirst=club.firstTeam.includes(c.protagonistKey);
 if(isFirst!==(league==='KBO')){
  const swap=club.roster.find(k=>k!==c.protagonistKey && club.firstTeam.includes(k)!==isFirst && c.world.players[k]!.position===me.position && !c.health.injuries[k] && !c.world.contracts[k]!.servicePay)!;assert.ok(swap);
  club.firstTeam=isFirst?club.firstTeam.map(k=>k===c.protagonistKey?swap:k):club.firstTeam.map(k=>k===swap?c.protagonistKey:k);
 }
 c.registration={...c.registration,firstTeam:league==='KBO',competitionKey:league};
}
const cache=new Map<boolean,{waiting:KboCareer;r:PlayerRelationship;rival:PlayerRelationship;day:number;programId:string}>();
function beforeReturn(short=false){
 if(!cache.has(short)){
  const entry=enteredKboCareer(),club=entry.world.clubs.find(t=>t.id===entry.protagonistClubId)!,r=entry.relationships.relations.find(r=>r.type==='TEAMMATE' && r.stage==='FORMED' && club.roster.includes(r.otherPlayerKey))!;assert.ok(r);
  // The existing teammate receives controlled intake eligibility; both relation kinds separate through actual intake.
  for(const key of club.roster)if(key!==r.otherPlayerKey && key!==entry.protagonistKey && entry.world.players[key]!.kind==='HITTER')entry.world.players[key]!.age=28;
  const p=entry.world.players[r.otherPlayerKey]!;p.age=19;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};
  const rival:PlayerRelationship={...structuredClone(r),type:'RIVAL',relationKey:JSON.stringify(['RIVAL',r.normalPairKey])};entry.relationships.relations=[...entry.relationships.relations,rival];
  const enlisted=startSangmuCohort(entry,entry.revision),member=enlisted.sangmu!.members[r.otherPlayerKey]!;assert.ok(member);assert.equal(enlisted.relationships.relations.find(v=>v.relationKey===r.relationKey)!.stage,'SEPARATED');
  if(short){const contract=enlisted.world.suspendedContracts![r.otherPlayerKey]!;member.program=enlistInSangmu({worldKey:enlisted.world.worldKey,playerKey:r.otherPlayerKey,clubId:contract.clubId,selectionSeasonKey:String(Number(enlisted.world.seasonKey)-1),contract,remainingPaidGameDays:1});contract.servicePay=createKboServicePayroll(contract,member.program,{...contract.servicePay!.returnDate});}
  const closed=closeFirst(enlisted);assert.equal(closed.sangmu!.members[r.otherPlayerKey]!.program.completedBlocks,1);
  const next=startNextKboSeason(closed,closed.revision),waiting=ready(startSangmuCohort(next,next.revision)),day=waiting.world.suspendedContracts![r.otherPlayerKey]!.servicePay!.returnDate.worldDay;
  primaryLeague(waiting,'FUTURES');const first=Math.min(...Object.values(waiting.competitionSchedule!.leagues).flat().map(g=>g.worldDay));
  waiting.days!.days=Array.from({length:day-first+1},(_,i)=>({day:first+i,evidence:'controlled-return-clock',result:{injured:[],recovered:[]}}));waiting.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
  cache.set(short,{waiting,r:structuredClone(waiting.relationships.relations.find(v=>v.relationKey===r.relationKey)!),rival:structuredClone(waiting.relationships.relations.find(v=>v.relationKey===rival.relationKey)!),day,programId:member.program.programId});
 }
 return structuredClone(cache.get(short)!);
}
function input(short=false,blocked=false){
 const fixture=beforeReturn(short),c=fixture.waiting,club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 if(blocked)while(club.roster.length<60)signKboRequiredReplacement(c.world,c.freeAgents!,club.id,'CF',c.difficulty);
 closeKboNpcMilitaryCalendarDay(c,fixture.day);
 if(blocked){assert.ok(!c.world.players[fixture.r.otherPlayerKey]);assert.equal(c.sangmu!.members[fixture.r.otherPlayerKey]!.program.completedBlocks,2);}
 else {assert.ok(c.world.players[fixture.r.otherPlayerKey]);assert.equal(c.sangmu!.npcReturns![fixture.programId]!.program.completedBlocks,2);}
 const games=c.competitionSchedule!.leagues.FUTURES.filter(g=>g.worldDay>fixture.day && [g.homeTeamKey,g.awayTeamKey].includes(club.id) && ![g.homeTeamKey,g.awayTeamKey].includes('SANGMU')).slice(0,2);assert.equal(games.length,2);
 c.competitionSchedule!.leagues={KBO:[],FUTURES:games};settleKboNpcMilitaryPayrollDay(c,fixture.day);c.days!.days=[];c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:games[0]!.worldDay,pendingGame:null};return {...fixture,c,games};
}
function finishDay(source:KboCareer){let c=source;for(let i=0;i<150;i++){const out=advanceKboCareer(JSON.parse(JSON.stringify(c)),c.revision);c=out.career;assert.notEqual(out.stopReason,'ENGINE_LIMIT');if(out.daysClosed)return c;}throw Error('DAY_LIMIT');}
let playedCache:KboCareer|undefined;
function played(){playedCache??=finishDay(input().c);return structuredClone(playedCache);}
function notice(c:KboCareer,relationKey:string){return kboTeamReunionNoticeRows(c).find(e=>e.relationKey===relationKey)!;}

test('actual original-club registration after two service blocks reunites both kinds once with JSON replay and no source mutation',()=>{
 const {c,r,rival,programId,games}=input(),before=canonicalJson(c),a=finishDay(c),b=finishDay(JSON.parse(before));assert.deepEqual(a,b);assert.equal(canonicalJson(c),before);
 for(const prior of [r,rival]){const actual=a.relationships.relations.find(v=>v.relationKey===prior.relationKey)!;assert.equal(actual.stage,'REUNITED_TEAM');assert.equal(actual.type,prior.type);assert.deepEqual(actual.milestones.slice(0,-1),prior.milestones);assert.ok(notice(a,prior.relationKey));}
 const event=a.relationNotices.find(e=>e.eventKey===notice(a,r.relationKey).eventKey)!,id=JSON.parse(event.evidence.fields.sharedTeamRegistrationReceiptId as string),health=a.health.games.find(h=>h.evidence.gameKey===games[0]!.simulationKey && h.evidence.teamKey==='FUTURES:'+c.protagonistClubId)!;
 const returned=c.sangmu!.npcReturns![programId]!.returned;assert.deepEqual(id,['kbo-return-shared-registration',r.relationKey,programId,returned.seasonKey,returned.worldDay,games[0]!.simulationKey,[...health.evidence.roster].sort()]);assert.ok(health.evidence.roster.includes(r.primaryPlayerKey));assert.ok(health.evidence.roster.includes(r.otherPlayerKey));
 const snapshot=canonicalJson(a);settleKboReturnedTeamReunions(a,games[0]!.worldDay);assert.equal(canonicalJson(a),snapshot);
 const control=structuredClone(c);control.relationships.relations=[];const without=finishDay(control);for(const field of ['world','sangmu','records','health','days','development','seasonGrowth','traits'] as const)assert.deepEqual(a[field],without[field]);
});

test('injured returnee on the actual civilian bench qualifies without an appearance',()=>{
 const {c,r,games}=input();c.health.games=[...c.health.games,{evidence:{gameKey:'controlled-return-injury',teamKey:'FUTURES:'+c.protagonistClubId,seasonKey:c.world.seasonKey,day:0,roster:[r.otherPlayerKey],appearances:[{playerKey:r.otherPlayerKey,riskFatigue:81}]},result:{injured:[r.otherPlayerKey],recovered:[]}}];c.health.injuries[r.otherPlayerKey]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'controlled-return-injury',seasonKey:c.world.seasonKey};
 const out=finishDay(c);assert.ok(!out.records.games[games[0]!.simulationKey]!.batting[r.otherPlayerKey]);assert.ok(notice(out,r.relationKey));
});

test('different competition, a full sixty-player return wait, and absent actual registration never fabricate reunion',()=>{
 const different=input();primaryLeague(different.c,'KBO');assert.ok(!notice(finishDay(different.c),different.r.relationKey));
 const blocked=input(false,true),out=finishDay(blocked.c);assert.ok(!notice(out,blocked.r.relationKey));assert.equal(out.relationships.relations.find(r=>r.relationKey===blocked.r.relationKey)!.stage,'SEPARATED');
 const legacy=played(),r=input().r;legacy.relationships.relations=structuredClone(input().c.relationships.relations);legacy.relationNotices=legacy.relationNotices.filter(e=>e.definitionId!=='E96');legacy.health.games=legacy.health.games.filter(h=>h.evidence.seasonKey!==legacy.world.seasonKey);settleKboReturnedTeamReunions(legacy,legacy.days!.days.at(-1)!.day);assert.ok(!notice(legacy,r.relationKey));
});

test('missing, duplicate and forged historical health seals or return proof reject without mutating the save',()=>{
 const a=played(),{r,games,programId}=input(),row=a.health.games.find(h=>h.evidence.gameKey===games[0]!.simulationKey && h.evidence.teamKey==='FUTURES:'+a.protagonistClubId)!;
 for(const mutate of [(c:KboCareer)=>{c.health.games=c.health.games.filter(h=>!(h.evidence.gameKey===row.evidence.gameKey && h.evidence.teamKey===row.evidence.teamKey));},(c:KboCareer)=>{c.health.games=[...c.health.games,structuredClone(row)];},(c:KboCareer)=>{c.health.games.find(h=>h.evidence.gameKey===row.evidence.gameKey && h.evidence.teamKey===row.evidence.teamKey)!.evidence.roster=[...row.evidence.roster,'forged-member'];},(c:KboCareer)=>{c.sangmu!.npcReturns![programId]!.returned.worldDay=games[0]!.worldDay;},(c:KboCareer)=>{c.relationNotices.find(e=>e.eventKey===notice(a,r.relationKey).eventKey)!.resume.registrationKey='foreign';}]){
  const corrupt=structuredClone(a);mutate(corrupt);const before=canonicalJson(corrupt);assert.throws(()=>kboTeamReunionNoticeRows(corrupt));assert.equal(canonicalJson(corrupt),before);
 }
 const premature=input().c,before=canonicalJson(premature);assert.throws(()=>settleKboReturnedTeamReunions(premature,games[0]!.worldDay));assert.equal(canonicalJson(premature),before);
});

test('historical return notice reads and acknowledges after current competition changes; acknowledgement changes only metadata',()=>{
 const a=played(),{r}=input();primaryLeague(a,'KBO');const before=canonicalJson(a),n=unreadKboRelationNotices(a).find(e=>e.eventKey===notice(a,r.relationKey).eventKey)!;assert.ok(n);
 const read=resolveKboRelationNotice(a,a.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}).career;
 for(const field of ['world','sangmu','records','health','days','phaseContext','relationships','seasonGrowth','development'] as const)assert.equal(canonicalJson(read[field]),canonicalJson(a[field]));assert.equal(read.revision,a.revision+1);assert.ok(!unreadKboRelationNotices(read).some(e=>e.eventKey===n.eventKey));assert.equal(canonicalJson(a),before);
 assert.throws(()=>resolveKboRelationNotice(a,a.revision-1,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}));assert.throws(()=>resolveKboRelationNotice(a,a.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion+1,command:'OPEN_RELATIONS'}));
});

test('a last paid shared game emits historical reunion before an unfunded NPC expiry separates the pair again',()=>{
 const {c,r,games,day}=input(true),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 // Keep the real remaining season, so a one-day cheap renewal cannot fit released waiting-player reservations.
 c.competitionSchedule!.leagues.FUTURES=beforeReturn(true).waiting.competitionSchedule!.leagues.FUTURES.filter(g=>g.worldDay>=games[0]!.worldDay && [g.homeTeamKey,g.awayTeamKey].includes(club.id));
 c.days!.days=[{day,evidence:'controlled-payroll-forecast',result:{injured:[],recovered:[]}}];settleKboNpcMilitaryPayrollDay(c,day);c.days!.days=[];
 let available=kboClubBalance(c.world,club.id).availableWon;
 for(const key of club.roster){const contract=c.world.contracts[key]!;if(key===c.protagonistKey || contract.years!==1 || contract.servicePay || contract.remainderPay)continue;const amount=Math.min(KBO_MONEY.maximumSalaryWon-contract.annualSalaryWon,Math.floor(available/10_000)*10_000);contract.annualSalaryWon+=amount;club.reservedSalaryWon+=amount;available-=amount;}
 assert.ok(available<10_000);assert.doesNotThrow(()=>assertKboRecruitmentWorld(c.world));const before=canonicalJson(c),out=finishDay(c);assert.equal(canonicalJson(c),before);
 assert.ok(!out.world.players[r.otherPlayerKey]);assert.ok(out.freeAgents!.players[r.otherPlayerKey]);const actual=out.relationships.relations.find(v=>v.relationKey===r.relationKey)!;
 assert.equal(actual.stage,'SEPARATED');assert.deepEqual(actual.milestones.slice(-2).map(m=>m.stage),['REUNITED_TEAM','SEPARATED']);assert.equal(notice(out,r.relationKey).occurredWorldDay,games[0]!.worldDay);assert.ok(unreadKboRelationNotices(out).some(n=>n.eventKey===notice(out,r.relationKey).eventKey));
 const snapshot=canonicalJson(out);settleKboReturnedTeamReunions(out,games[0]!.worldDay);assert.equal(canonicalJson(out),snapshot);
});
