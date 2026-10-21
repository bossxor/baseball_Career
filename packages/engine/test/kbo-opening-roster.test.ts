import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import {confirmKboPreseasonPlan,kboPreseasonPlanView,unreadKboFirstCampNotices,resolveKboFirstCampNotice} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster,assertKboOpeningRoster,kboOpeningRosterView} from '../src/kbo-opening-roster.js';
import {unreadKboRelationNotices,resolveKboRelationNotice} from '../src/kbo-relations.js';
import {createOwnCareerAssessment} from '../src/high-school-assessment.js';
import {kboCareerEntryView} from '../src/kbo-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {automaticFieldLineup,initialPositionFits} from '../src/lineup.js';
import {emptyBatting} from '../src/stats.js';
function ready(kind:'HITTER'|'PITCHER'='HITTER',weak=false,injured=false){
 const s=enteredKboCareer(kind,source=>{
  if(weak){const p=source.world.players.own!,values=Object.fromEntries(abilityKeys(kind).map(k=>[k,500_000]));source.world.players.own={...p,abilities:values,careerPeaks:{...values}};source.development!.seasonStartPlayer=structuredClone(source.world.players.own);source.ownAssessment=createOwnCareerAssessment(source.world);}
  if(injured){const g=source.health.games.filter(g=>g.evidence.roster.includes('own')).at(-1)!;g.result.injured.push('own');source.days.days.find(d=>d.day===g.evidence.day)!.result.injured.push('own');source.health.injuries.own={severity:'MEDIUM',remainingTeamGames:8,diagnosedGameKey:g.evidence.gameKey,seasonKey:'2029'};}
 });return confirmKboPreseasonPlan(s,s.revision);
}
for(const kind of ['HITTER','PITCHER'] as const)test(kind+' healthy strong rookie competes into28; first-team registration is separate from games/salary/growth',()=>{
 const s=ready(kind),before=canonicalJson(s),selected=confirmKboOpeningRoster(s,s.revision),r=assertKboOpeningRoster(selected),view=kboOpeningRosterView(selected),c=selected.world.clubs.find(c=>c.id===selected.protagonistClubId)!;
 assert.equal(selected.registration.firstTeam,true);assert.equal(selected.registration.competitionKey,'KBO');assert.equal(kboCareerEntryView(selected).registration.firstTeam,true);assert.equal(view.status,'CONFIRMED');assert.equal(view.reason,'SELECTED');assert.equal(r.firstTeam.length,28);assert.equal(r.futures.length,23);assert.equal(new Set([...r.firstTeam,...r.futures]).size,51);assert.equal(r.firstTeam.some(k=>r.futures.includes(k)),false);assert.deepEqual([...r.firstTeam,...r.futures].sort(),[...c.roster].sort());
 const members=r.firstTeam.map(k=>selected.world.players[k]!);assert.equal(members.filter(p=>p.kind==='PITCHER').length,13);assert.equal(members.filter(p=>p.kind==='HITTER').length,15);assert.ok(members.filter(p=>p.position==='C').length>=2);for(const [position,count] of [['SP',5],['RP',6],['CP',2]] as const)assert.equal(members.filter(p=>p.position===position).length,count);automaticFieldLineup(members.filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
 for(const club of selected.world.clubs){const old=s.world.clubs.find(c=>c.id===club.id)!;assert.deepEqual(club.roster,old.roster);assert.equal(club.reservedSalaryWon,old.reservedSalaryWon);assert.equal(club.paidSalaryWon,old.paidSalaryWon);if(club.id!==c.id)assert.deepEqual(club,old);}
 for(const key of ['players','contracts','rng','repertoires'] as const)assert.equal(canonicalJson(selected.world[key]),canonicalJson(s.world[key]));for(const key of ['records','health','seasonGrowth','development','amateurHistory','relationships','preseasonPlan'] as const)assert.equal(canonicalJson(selected[key]),canonicalJson(s[key]));assert.equal(selected.phaseContext.phase,'PRESEASON_SETUP');assert.equal(selected.seasonGrowth.totalBudgetUnits,0);assert.equal(selected.revision,s.revision+1);assert.equal(canonicalJson(s),before);
 assert.deepEqual(confirmKboOpeningRoster(selected,selected.revision),selected);assert.equal(canonicalJson(confirmKboOpeningRoster(JSON.parse(JSON.stringify(s)),s.revision)),canonicalJson(selected));
});

test('ordinary50-start school career can earn a spot in its actual destination club on position merit',()=>{
 const s=ready('HITTER',true),selected=confirmKboOpeningRoster(s,s.revision),view=kboOpeningRosterView(selected);assert.ok(Object.values(s.world.players.own!.abilities).reduce((a,b)=>a+b,0)/60_000<55);assert.equal(selected.registration.firstTeam,true);assert.equal(selected.registration.competitionKey,'KBO');assert.equal(view.reason,'SELECTED');assert.ok(selected.openingRoster!.firstTeam.includes('own'));assert.deepEqual(selected.world.players.own!.abilities,s.world.players.own!.abilities);assert.equal(selected.world.players.own!.age,19);
});

test('injured star starts in futures roster, keeps remaining team-game recovery, never occupies an opening1st-team slot',()=>{
 const s=ready('HITTER',false,true),next=confirmKboOpeningRoster(s,s.revision);assert.equal(next.registration.competitionKey,'FUTURES');assert.equal(kboOpeningRosterView(next).reason,'INJURED');assert.equal(next.health.injuries.own!.remainingTeamGames,8);assert.equal(next.openingRoster!.firstTeam.includes('own'),false);assert.equal(next.openingRoster!.firstTeam.length,28);assert.deepEqual(next.health,s.health);
});

test('view is pending before confirmation, does not select automatically and exposes no hidden potential/RNG or fake odds',()=>{
 const s=ready(),before=canonicalJson(s),pending=kboOpeningRosterView(s);assert.equal(pending.status,'PENDING');assert.equal(pending.competitionKey,null);assert.equal(s.registration.competitionKey,undefined);assert.equal(canonicalJson(s),before);const next=confirmKboOpeningRoster(s,s.revision),view=kboOpeningRosterView(next);assert.deepEqual(kboOpeningRosterView(JSON.parse(JSON.stringify(next))),view);assert.doesNotMatch(JSON.stringify(view),/potential|abilities|sourceBasis|amateurHistory|"seed"|"rng"|probability/i);
 const draft=enteredKboCareer();assert.throws(()=>confirmKboOpeningRoster(draft,draft.revision),/PRESEASON_PLAN_REQUIRED/);assert.equal(kboOpeningRosterView(draft).status,'PENDING');
});

test('late camp/relation reading preserves opening roster and confirmed growth plan;1st-team registration does not fabricate callup event',()=>{
 const s=ready(),next=confirmKboOpeningRoster(s,s.revision),camp=unreadKboFirstCampNotices(next)[0]!,readCamp=resolveKboFirstCampNotice(next,next.revision,{eventKey:camp.eventKey,eventVersion:camp.eventVersion,command:'KEEP_FOCUS'}),relation=unreadKboRelationNotices(readCamp)[0]!,read=resolveKboRelationNotice(readCamp,readCamp.revision,{eventKey:relation.eventKey,eventVersion:relation.eventVersion,command:'OPEN_RELATIONS'}).career;
 assertKboOpeningRoster(read);assert.equal(kboPreseasonPlanView(read).status,'CONFIRMED');assert.deepEqual(read.openingRoster,next.openingRoster);assert.deepEqual(read.preseasonPlan,next.preseasonPlan);assert.deepEqual(read.registration,next.registration);assert.equal(canonicalJson(read.world),canonicalJson(next.world));assert.equal(read.events.some(e=>e.definitionId==='E09'),false);
});

test('stale revision/tampered receipt/roster/competition reject without salary or registration repair',()=>{
 const s=ready(),before=canonicalJson(s);assert.throws(()=>confirmKboOpeningRoster(s,s.revision-1),/REVISION/);assert.equal(canonicalJson(s),before);const selected=confirmKboOpeningRoster(s,s.revision);
 for(const mutate of [(x:typeof selected)=>{x.openingRoster!.confirmedRevision++;},(x:typeof selected)=>{x.openingRoster!.sourceBasis='wrong';},(x:typeof selected)=>{x.registration.competitionKey='FUTURES';},(x:typeof selected)=>{x.world.clubs.find(c=>c.id===x.protagonistClubId)!.firstTeam[0]='missing';}]){const bad=structuredClone(selected);mutate(bad);assert.throws(()=>kboOpeningRosterView(bad));assert.throws(()=>confirmKboOpeningRoster(bad,bad.revision));}
 const missing=structuredClone(selected);delete missing.openingRoster;assert.throws(()=>kboOpeningRosterView(missing),/RECEIPT_REQUIRED/);assert.throws(()=>confirmKboOpeningRoster(missing,missing.revision),/ALREADY_APPLIED/);
});

test('controlled absence of all catchers fails safely: no emergency players, silent healing or partially published roster',()=>{
 const s=ready(),club=s.world.clubs.find(c=>c.id===s.protagonistClubId)!;for(const key of club.roster.filter(k=>s.world.players[k]!.position==='C'))s.health.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-camp-unavailability',seasonKey:'2030'};
 const before=canonicalJson(s);assert.throws(()=>confirmKboOpeningRoster(s,s.revision));assert.equal(canonicalJson(s),before);assert.equal(Object.keys(s.world.players).length,501);assert.equal(s.openingRoster,undefined);
});

test('controlled stronger club leaves the ordinary rookie in futures without changing ability or granting a free slot',()=>{
 const s=ready('HITTER',true),c=s.world.clubs.find(c=>c.id===s.protagonistClubId)!;
 // Controlled stronger cohort isolates competition; the production NPC generator/distribution is unchanged.
 for(const k of c.roster.filter(k=>k!=='own')){const p=s.world.players[k]!,values=Object.fromEntries(abilityKeys(p.kind).map(axis=>[axis,700_000]));s.world.players[k]={...p,abilities:values,potential:Object.fromEntries(abilityKeys(p.kind).map(axis=>[axis,Math.max(p.potential[axis]!,700_000)])),careerPeaks:Object.fromEntries(abilityKeys(p.kind).map(axis=>[axis,Math.max(p.careerPeaks[axis]!,700_000)]))};}
 const abilities=s.world.players.own!.abilities,selected=confirmKboOpeningRoster(s,s.revision),view=kboOpeningRosterView(selected);assert.equal(selected.registration.firstTeam,false);assert.equal(selected.registration.competitionKey,'FUTURES');assert.equal(view.reason,'POSITION_COMPETITION');assert.ok(selected.openingRoster!.futures.includes('own'));assert.deepEqual(selected.world.players.own!.abilities,abilities);assert.equal(selected.openingRoster!.firstTeam.length,28);
});
