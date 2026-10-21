import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {formHighSchoolRelations} from '../src/relationships.js';
import {queueRelationFormationNotices} from '../src/relation-notices.js';
import {kboRelationshipListView,kboRelationDetailView,unreadKboRelationNotices,resolveKboRelationNotice} from '../src/kbo-relations.js';
import {confirmKboPreseasonPlan,kboPreseasonPlanView,unreadKboFirstCampNotices} from '../src/kbo-preseason.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';
import {assertKboAmateurYearEnd} from '../src/kbo-entry.js';
function fixture(kind:'HITTER'|'PITCHER'='HITTER'){
 return enteredKboCareer(kind,s=>{s.relationships=formHighSchoolRelations(s.world,31);s.relationNotices=queueRelationFormationNotices(s,180)!;});
}
for(const kind of ['HITTER','PITCHER'] as const)test(kind+' pro list retains historical school and active club teammate identities without invented transfers/stages',()=>{
 const s=fixture(kind),before=canonicalJson(s),list=kboRelationshipListView(s);assert.equal(list.length,s.relationships.relations.length);assert.equal(list.filter(r=>r.otherAvailability==='HISTORICAL_ONLY').length,1);assert.equal(list.filter(r=>r.otherAvailability==='CURRENT_WORLD').length,1);
 const old=list.find(r=>r.otherAvailability==='HISTORICAL_ONLY')!,now=list.find(r=>r.otherAvailability==='CURRENT_WORLD')!;assert.equal(old.lastKnownRegistration!.leagueKey,'HS');assert.equal(old.lastKnownRegistration!.seasonKey,'2029');assert.equal(now.lastKnownRegistration!.leagueKey,'KBO');assert.equal(now.lastKnownRegistration!.teamId,s.protagonistClubId);for(const row of list){assert.equal(row.stage,'FORMED');assert.ok(row.other!.teamName);assert.ok(row.other!.name);assert.equal(row.other!.kind,kind);assert.equal(Object.hasOwn(row.other!,'schoolName'),false);}
 assert.deepEqual(kboRelationshipListView(JSON.parse(JSON.stringify(s))),list);assert.doesNotMatch(JSON.stringify(list),/abilities|potential|sourceBasis|amateurHistory|"seed"|"rng"/i);assert.equal(canonicalJson(s),before);assert.equal(Object.keys(s.world.players).length,501);assertKboAmateurYearEnd(s.amateurHistory);
});

test('historical relation details reuse existing official scoped records; never fabricate pro games or new player registration',()=>{
 const s=fixture(),r=s.relationships.relations.find(r=>!Object.hasOwn(s.world.players,r.otherPlayerKey))!,old=s.amateurHistory.world,team=old.schools.find(t=>t.roster.includes(r.otherPlayerKey))!;
 const game=Object.values(s.records.games).find(g=>g.scope.leagueKey==='HS' && Object.hasOwn(g.teams,team.id))!;
 // Controlled official contributions isolate read arithmetic; this is not another played pro game.
 const totals={...emptyBatting(),twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};game.batting.own={...totals,PA:4,AB:4,H:2,TB:4,twoB:2};game.batting[r.otherPlayerKey]={...totals,PA:3,AB:2,H:1,TB:2,BB:1,twoB:1};
 const before=canonicalJson(s),view=kboRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2029'});assert.equal(view.mode,'COMPARISON');if(view.mode!=='COMPARISON')return;assert.equal(view.sharedGames,1);assert.equal(view.mine.PA,4);assert.equal((view.mine as {AVG:string}).AVG,'.500');assert.equal((view.theirs as {OBP:string}).OBP,'.667');assert.equal(view.otherAvailability,'HISTORICAL_ONLY');assert.ok(view.other!.teamName);assert.equal(kboRelationDetailView(s,r.relationKey,{leagueKey:'KBO',phase:'REGULAR',seasonKey:'2030'}).mode,'EMPTY');assert.equal(kboRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'POSTSEASON'}).mode,'EMPTY');assert.equal(canonicalJson(s),before);assert.equal(Object.hasOwn(s.world.players,r.otherPlayerKey),false);
});

test('both historical and new pro E94 preserve names and ACK only their notice while the confirmed plan remains sealed',()=>{
 const entered=fixture(),s=confirmKboPreseasonPlan(entered,entered.revision),notices=unreadKboRelationNotices(s),before=canonicalJson(s);assert.equal(notices.length,2);assert.ok(notices.some(n=>!n.otherInCurrentWorld && n.otherName!==null));assert.ok(notices.some(n=>n.otherInCurrentWorld && n.otherName!==null));const n=notices[0]!,result=resolveKboRelationNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}),read=result.career;
 assert.deepEqual(result.navigation,{targetScreen:'S42',sourceEventKey:n.eventKey,relationKey:n.relationKey});assert.notStrictEqual(read.relationNotices[1],s.relationNotices[1]);assert.equal(read.revision,s.revision+1);assert.equal(unreadKboRelationNotices(read).length,1);assert.equal(kboPreseasonPlanView(read).status,'CONFIRMED');assert.deepEqual(read.preseasonPlan,s.preseasonPlan);for(const key of ['world','records','health','development','seasonGrowth','relationships','campNotices','phaseContext','amateurHistory'] as const)assert.equal(canonicalJson(read[key]),canonicalJson(s[key]));assertKboAmateurYearEnd(read.amateurHistory);assert.equal(unreadKboFirstCampNotices(read).length,1);assert.equal(canonicalJson(s),before);
});

test('stale revision/version, wrong command or foreign/duplicate relation evidence reject without changes',()=>{
 const s=fixture(),n=unreadKboRelationNotices(s)[0]!,before=canonicalJson(s),input={eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'};assert.throws(()=>resolveKboRelationNotice(s,s.revision-1,input),/REVISION/);assert.throws(()=>resolveKboRelationNotice(s,s.revision,{...input,eventVersion:0}),/VERSION/);assert.throws(()=>resolveKboRelationNotice(s,s.revision,{...input,command:'ACK_EVENT'}),/INVALID_CHOICE/);
 const bad=structuredClone(s);bad.relationNotices[0]!.resume.registrationKey='foreign';assert.throws(()=>unreadKboRelationNotices(bad),/NOTICE_SOURCE/);const duplicate=structuredClone(s);duplicate.relationNotices=[...duplicate.relationNotices,duplicate.relationNotices[0]!];assert.throws(()=>unreadKboRelationNotices(duplicate),/DUPLICATE/);assert.throws(()=>resolveKboRelationNotice(duplicate,duplicate.revision,input),/UNKNOWN_RELATION_NOTICE/);assert.equal(canonicalJson(s),before);
});

test('unknown historical player remains unresolved; malformed ownership, foreign history and changed confirmed plan reject',()=>{
 const s=fixture(),r=s.relationships.relations.find(r=>!Object.hasOwn(s.world.players,r.otherPlayerKey))!;delete s.amateurHistory.world.players[r.otherPlayerKey];const row=kboRelationshipListView(s).find(x=>x.relationKey===r.relationKey)!;assert.equal(row.otherAvailability,'UNKNOWN_REFERENCE');assert.equal(row.other,null);assert.equal(row.stage,'FORMED');assert.equal(kboRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'REGULAR'}).mode,'UNAVAILABLE');
 const foreign=fixture();foreign.amateurHistory.world.seed='foreign-world';assert.throws(()=>kboRelationshipListView(foreign));const owner=fixture();owner.relationships.relations[0]!.primaryPlayerKey='foreign';assert.throws(()=>kboRelationshipListView(owner),/INVALID_CAREER_RELATION/);
 const entered=fixture(),closed=confirmKboPreseasonPlan(entered,entered.revision),notice=unreadKboRelationNotices(closed)[0]!;closed.preseasonPlan!.sourceBasis='changed';assert.throws(()=>resolveKboRelationNotice(closed,closed.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'OPEN_RELATIONS'}),/STALE_KBO_PRESEASON_PLAN/);
});

test('absence of relations/notices on restored old pro state is empty and querying never creates a new relation',()=>{
 const s=enteredKboCareer();s.relationships={schemaVersion:1,relations:[],formation:{rival:'NO_CANDIDATE',teammate:'NO_CANDIDATE'}};s.relationNotices=[];const before=canonicalJson(s);assert.deepEqual(kboRelationshipListView(s),[]);assert.deepEqual(unreadKboRelationNotices(s),[]);assert.throws(()=>kboRelationDetailView(s,'missing',{leagueKey:'KBO',phase:'REGULAR'}),/UNKNOWN_RELATION/);assert.equal(canonicalJson(s),before);
});
