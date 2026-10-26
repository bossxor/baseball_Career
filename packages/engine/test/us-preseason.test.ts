import test from 'node:test';
import {publishUsSeasonSchedule,assertUsSeasonSchedule,usSeasonScheduleView} from '../src/us-schedule.js';
import {setUsPreseasonFocus,setUsPreseasonArchetype,confirmUsPreseasonPlan,usPreseasonPlanView,unreadUsFirstCampNotices,resolveUsFirstCampNotice,beginUsPreseasonPitchLearning,setUsPreseasonPitchWeights} from '../src/us-preseason.js';
import {PITCH_IDS} from '@playball/rules';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../src/career-us.js';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {closeSchoolSeasonForUs} from '../src/us-entry.js';
import {startSignedUsCareer} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {startUsRegularSeason} from '../src/us-season.js';

const cache=new Map<string,ReturnType<typeof fixture>>();
function fixture(kind:'HITTER'|'PITCHER'){
 const hs=completedHighSchoolCareer(800_000,kind),review=acknowledgeHighSchoolSeasonReview(hs,hs.revision),open=openHighSchoolCareerRoute(review,review.revision,1).career,world=createUsRosterWorld({worldKey:open.world.worldKey,seasonKey:String(open.world.calendar!.year+1),seed:open.world.seed,difficulty:open.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'가상미국조직'+(i+1)}))}),inventory=initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:3_000_000,nationalReleaseAllowed:true,militaryReturnOption:false}))),prepared=prepareCareerUsDirect(open,open.revision,inventory),offers=careerUsDirectView(prepared);assert.ok(offers.visible);assert.ok(offers.offers.length);
 const signed=decideCareerUsDirect(prepared,prepared.revision,{programVersion:1,decision:{type:'SIGN',offerKey:offers.offers[0]!.offerKey},eventVersion:1});return {signed,world};
}
function ready(kind:'HITTER'|'PITCHER'){if(!cache.has(kind))cache.set(kind,fixture(kind));return structuredClone(cache.get(kind)!);}


function active(kind:'HITTER'|'PITCHER'){const {signed,world}=ready(kind),closed=closeSchoolSeasonForUs(signed,signed.revision,true);return startSignedUsCareer(closed,closed.revision,world);}
test('US first camp updates four focus and seals plan once without games, money, population or growth',()=>{
 const c=active('HITTER'),raw=canonicalJson(c),keys=Object.keys(c.world.players.own!.abilities),n=setUsPreseasonFocus(c,c.revision,keys.slice(0,4));assert.equal(canonicalJson(c),raw);assert.equal(n.revision,c.revision+1);const notice=unreadUsFirstCampNotices(n)[0]!;assert.equal(notice.definitionId,'E58');const ack=resolveUsFirstCampNotice(n,n.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'ACK_EVENT'}),done=confirmUsPreseasonPlan(ack,ack.revision);assert.equal(usPreseasonPlanView(done).status,'CONFIRMED');assert.deepEqual(done.records,c.records);assert.deepEqual(done.income,c.income);assert.deepEqual(done.inventory,c.inventory);assert.equal(done.seasonGrowth.entries.length,0);assert.deepEqual(done.world.rng,c.world.rng);assert.deepEqual(confirmUsPreseasonPlan(done,done.revision),done);assert.throws(()=>setUsPreseasonFocus(done,done.revision,keys.slice(0,4)));assert.deepEqual(usPreseasonPlanView(JSON.parse(JSON.stringify(done))),usPreseasonPlanView(done));
});
test('US first camp focus event dispatch is atomic, stale/invalid/fake-origin changes fail',()=>{
 let c=active('HITTER');c=setUsPreseasonArchetype(c,c.revision,c.world.players.own!.archetype);const e=unreadUsFirstCampNotices(c)[0]!,focus=Object.keys(c.world.players.own!.abilities).slice(-4),raw=canonicalJson(c);assert.throws(()=>setUsPreseasonFocus(c,c.revision-1,focus),/REVISION/);assert.throws(()=>setUsPreseasonFocus(c,c.revision,focus.slice(1)));const chosen=resolveUsFirstCampNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'CHOOSE_FOCUS',focus});assert.deepEqual(chosen.world.players.own!.focus,focus);assert.equal(unreadUsFirstCampNotices(chosen).length,0);assert.equal(canonicalJson(c),raw);assert.throws(()=>resolveUsFirstCampNotice(chosen,chosen.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'CHOOSE_FOCUS',focus}));const fake=structuredClone(c);fake.campNotices![0]!.resume.registrationKey='forged';assert.throws(()=>unreadUsFirstCampNotices(fake));
});
test('US pitcher reuses repertoire allocation and learning reservation without inflating abilities or salary',()=>{
 const c=active('PITCHER'),book=c.world.repertoires.own!,pitch=PITCH_IDS.find(id=>!Object.hasOwn(book.book,id))!,raw=canonicalJson(c),n=beginUsPreseasonPitchLearning(c,c.revision,pitch);assert.equal(canonicalJson(c),raw);assert.equal(n.world.repertoires.own!.learning!.pitchId,pitch);assert.deepEqual(n.world.players.own!.abilities,c.world.players.own!.abilities);assert.deepEqual(n.income,c.income);assert.throws(()=>beginUsPreseasonPitchLearning(n,n.revision,pitch));const weighted=setUsPreseasonPitchWeights(c,c.revision,book.weights);assert.deepEqual(weighted.world.repertoires.own!.weights,book.weights);assert.throws(()=>setUsPreseasonPitchWeights(c,c.revision,{}));assert.throws(()=>beginUsPreseasonPitchLearning(active('HITTER'),c.revision,pitch));
});

test('US opening seals the original level calendar before the first game without spending learning XP',()=>{
 let c=active('PITCHER');const book=c.world.repertoires.own!,pitch=PITCH_IDS.find(id=>!Object.hasOwn(book.book,id))!;c=beginUsPreseasonPitchLearning(c,c.revision,pitch);const event=unreadUsFirstCampNotices(c)[0]!;c=resolveUsFirstCampNotice(c,c.revision,{eventKey:event.eventKey,eventVersion:event.eventVersion,command:'ACK_EVENT'});c=confirmUsPreseasonPlan(c,c.revision);c=publishUsSeasonSchedule(c,c.revision);const before=canonicalJson(c),started=startUsRegularSeason(c,c.revision),plan=started.world.repertoires.own!.learning!;
 assert.equal(canonicalJson(c),before);assert.equal(plan.registration!.calendar!.length,c.registration.level==='ROOKIE'?60:100);assert.equal(started.world.repertoires.own!.ledger.baseReservedUnits,100000);assert.equal(started.world.repertoires.own!.book[pitch],0);assert.equal(Object.values(started.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey).length,0);
});

test('all five US schedules publish atomically, use shared international rest and preserve JSON identities',()=>{
 let c=active('HITTER');assert.throws(()=>publishUsSeasonSchedule(c,c.revision),/UNCONFIRMED/);c=setUsPreseasonArchetype(c,c.revision,c.world.players.own!.archetype);const e=unreadUsFirstCampNotices(c)[0]!;c=resolveUsFirstCampNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACK_EVENT'});c=confirmUsPreseasonPlan(c,c.revision);const raw=canonicalJson(c),n=publishUsSeasonSchedule(c,c.revision);assert.equal(canonicalJson(c),raw);assert.deepEqual(n.records,c.records);assert.deepEqual(n.income,c.income);assert.deepEqual(n.world,c.world);assert.equal(n.revision,c.revision+1);assert.deepEqual(usSeasonScheduleView(n).leagues.map(l=>l.totalGames),[900,1500,1800,2160,2430]);for(const schedule of Object.values(n.seasonSchedule!.leagues))for(const g of schedule)assert.ok(!c.world.calendar.international.some(w=>g.worldDay>=w.startDay && g.worldDay<w.endDay));assertUsSeasonSchedule(JSON.parse(JSON.stringify(n)));assert.deepEqual(publishUsSeasonSchedule(n,n.revision),n);const fake=structuredClone(n);fake.seasonSchedule!.leagues.MLB=[...fake.seasonSchedule!.leagues.MLB.slice(1)];assert.throws(()=>assertUsSeasonSchedule(fake),/STALE_US_SEASON_SCHEDULE/);
});
