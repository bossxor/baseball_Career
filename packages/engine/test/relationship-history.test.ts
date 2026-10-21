import test from 'node:test';
import assert from 'node:assert/strict';
import {enrolledCollegeCareer} from './fixtures.js';
import {formHighSchoolRelations,relationshipListView,relationDetailView} from '../src/relationships.js';
import {careerRelationshipListView,careerRelationDetailView} from '../src/relationship-history.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';
import {queueRelationFormationNotices,unreadRelationNotices} from '../src/relation-notices.js';

function fixture(){
 const s=enrolledCollegeCareer(),archive=s.previousSeasons![0]!,old=archive.world;
 // Restore known HS formation receipts into a real college-entry fixture; no new college relation is fabricated.
 s.relationships=formHighSchoolRelations(old,Math.min(...old.schedule.map(g=>g.worldDay)));return s;
}
test('college S42 keeps archived HS rival/teammate identity and last known registration without inferring a new stage',()=>{
 const s=fixture(),before=canonicalJson(s),list=careerRelationshipListView(s);assert.equal(relationshipListView(s.relationships,s.world).length,0);assert.equal(list.length,2);
 for(const row of list){assert.equal(row.stage,'FORMED');assert.equal(row.otherAvailability,'HISTORICAL_ONLY');assert.ok(row.other?.name);assert.equal(row.lastKnownRegistration!.leagueKey,'HS');assert.equal(row.lastKnownRegistration!.seasonKey,'2029');assert.equal(Object.hasOwn(s.world.players,row.otherPlayerKey),false);}
 assert.doesNotMatch(JSON.stringify(list),/abilities|potential|careerPeak|"seed"|"rng"|sourceBasis/i);assert.deepEqual(careerRelationshipListView(JSON.parse(JSON.stringify(s))),list);assert.equal(canonicalJson(s),before);
});
test('archived same-kind identity reuses real scoped contributions, not invented meetings; zero scopes remain empty',()=>{
 const s=fixture(),r=s.relationships!.relations.find(r=>r.type==='TEAMMATE')!,old=s.previousSeasons![0]!.world,school=old.schools.find(t=>t.roster.includes(r.otherPlayerKey))!;
 const game=Object.values(s.records.games).find(g=>g.scope.leagueKey==='HS' && Object.hasOwn(g.teams,school.id))!;
 // Controlled record contribution isolates read-model arithmetic; it is not another simulated game.
 const totals={...emptyBatting(),twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};game.batting[r.primaryPlayerKey]={...totals,PA:4,AB:4,H:2,TB:4,K:1,twoB:2};game.batting[r.otherPlayerKey]={...totals,PA:3,AB:2,H:1,TB:2,BB:1,twoB:1};
 const before=canonicalJson(s),view=careerRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2029'});assert.equal(view.mode,'COMPARISON');if(view.mode!=='COMPARISON')return;assert.equal(view.sharedGames,1);assert.equal(view.otherAvailability,'HISTORICAL_ONLY');assert.equal(view.mine.PA,4);assert.equal((view.mine as {AVG:string}).AVG,'.500');assert.equal((view.theirs as {OBP:string}).OBP,'.667');
 assert.equal(relationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'REGULAR'}).mode,'UNAVAILABLE');assert.equal(careerRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'POSTSEASON'}).mode,'EMPTY');assert.equal(careerRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'REGULAR',seasonKey:'1900'}).mode,'EMPTY');assert.equal(canonicalJson(s),before);
});
test('unknown history stays as an unresolved reference, not retirement or an invented player',()=>{
 const s=fixture(),r=s.relationships!.relations[0]!,beforeCount=Object.keys(s.world.players).length;for(const a of s.previousSeasons!)delete a.world.players[r.otherPlayerKey];
 const row=careerRelationshipListView(s).find(x=>x.relationKey===r.relationKey)!;assert.equal(row.otherAvailability,'UNKNOWN_REFERENCE');assert.equal(row.other,null);assert.equal(row.lastKnownRegistration,null);assert.equal(row.stage,'FORMED');assert.equal(careerRelationDetailView(s,r.relationKey,{leagueKey:'HS',phase:'REGULAR'}).mode,'UNAVAILABLE');assert.equal(Object.keys(s.world.players).length,beforeCount);
});
test('current identity takes priority and the latest archived snapshot is chosen for historical identity',()=>{
 const s=fixture(),old=s.previousSeasons![0]!,r=s.relationships!.relations[0]!,newer=structuredClone(old);newer.world.seasonKey='2030';newer.world.players[r.otherPlayerKey]!.name='최근이름';s.previousSeasons=[old,newer];
 let row=careerRelationshipListView(s).find(x=>x.relationKey===r.relationKey)!;assert.equal(row.other!.name,'최근이름');assert.equal(row.lastKnownRegistration!.seasonKey,'2030');
 s.world.players[r.otherPlayerKey]={...structuredClone(newer.world.players[r.otherPlayerKey]!),name:'현재이름'};row=careerRelationshipListView(s).find(x=>x.relationKey===r.relationKey)!;assert.equal(row.otherAvailability,'CURRENT_WORLD');assert.equal(row.other!.name,'현재이름');assert.equal(row.lastKnownRegistration,null);
});
test('foreign history and malformed relationship ownership reject instead of leaking another world',()=>{
 const s=fixture(),r=s.relationships!.relations[0]!,bad=structuredClone(s);bad.previousSeasons![0]!.world.seed='foreign-seed';assert.throws(()=>careerRelationshipListView(bad),/WORLD_MISMATCH/);
 const owner=structuredClone(s);owner.relationships!.relations[0]!.primaryPlayerKey='foreign-player';assert.throws(()=>careerRelationDetailView(owner,r.relationKey,{leagueKey:'HS',phase:'REGULAR'}),/INVALID_CAREER_RELATION/);
 const duplicate=structuredClone(s);duplicate.relationships!.relations=[...duplicate.relationships!.relations,duplicate.relationships!.relations[0]!];assert.throws(()=>careerRelationshipListView(duplicate),/DUPLICATE/);assert.throws(()=>careerRelationDetailView(s,'missing',{leagueKey:'HS',phase:'REGULAR'}),/UNKNOWN/);
});
test('persisted E94 notices keep the archived name after college entry without recreating the formation event',()=>{
 const s=fixture(),old=s.previousSeasons![0]!,hs={...s,world:old.world};s.relationNotices=queueRelationFormationNotices(hs,old.days.days.at(-1)!.day)!;
 const before=canonicalJson(s),notices=unreadRelationNotices(s);assert.equal(notices.length,2);assert.ok(notices.every(n=>n.otherName!==null && n.otherInCurrentWorld===false));assert.equal(canonicalJson(s),before);
});
