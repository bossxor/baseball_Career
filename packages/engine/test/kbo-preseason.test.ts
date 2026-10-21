import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';
import {kboPreseasonPlanView,setKboPreseasonFocus,setKboPreseasonArchetype,setKboPreseasonPitchWeights,beginKboPreseasonPitchLearning,confirmKboPreseasonPlan,unreadKboFirstCampNotices,resolveKboFirstCampNotice,queueKboFirstCampNotices} from '../src/kbo-preseason.js';

for(const kind of ['HITTER','PITCHER'] as const)test(kind+' actual entry queues one nonblocking E08 and exposes only public preseason choices',()=>{
 const s=enteredKboCareer(kind),before=canonicalJson(s),view=kboPreseasonPlanView(s),notices=unreadKboFirstCampNotices(s);assert.equal(notices.length,1);assert.equal(notices[0]!.definitionId,'E08');assert.deepEqual(notices[0]!.offeredCommands,['CHOOSE_FOCUS','KEEP_FOCUS']);assert.equal(s.phaseContext.phase,'PRESEASON_SETUP');assert.ok(s.events.every(e=>e.status!=='OPEN'));assert.equal(view.status,'DRAFT');assert.equal(view.focus.length,4);
 assert.equal(view.pitcher!==null,kind==='PITCHER');assert.deepEqual(unreadKboFirstCampNotices(JSON.parse(JSON.stringify(s))),notices);assert.doesNotMatch(JSON.stringify({view,notices}),/potential|abilities|sourceBasis|amateurHistory|"seed"|"rng"/i);assert.equal(canonicalJson(s),before);assert.deepEqual(queueKboFirstCampNotices(s),s.campNotices);
});

test('E08 focus choice commits only four-focus plan; KEEP_FOCUS acknowledges without a new saved plan',()=>{
 const s=enteredKboCareer(),n=unreadKboFirstCampNotices(s)[0]!,focus=['POWER','DISCIPLINE','RUNNING','CLUTCH'],before=canonicalJson(s),chosen=resolveKboFirstCampNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:1,command:'CHOOSE_FOCUS',focus});
 assert.deepEqual(chosen.world.players.own!.focus,focus);assert.deepEqual(chosen.planHistory,[{completedTeamGames:0,focus,archetype:s.world.players.own!.archetype}]);assert.equal(chosen.campNotices![0]!.resolution!.kind,'DOMAIN');assert.equal(unreadKboFirstCampNotices(chosen).length,0);assert.equal(chosen.revision,s.revision+1);assert.deepEqual(chosen.world.players.own!.abilities,s.world.players.own!.abilities);assert.equal(canonicalJson(s),before);
 const kept=resolveKboFirstCampNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:1,command:'KEEP_FOCUS'});assert.equal(kept.campNotices![0]!.resolution!.kind,'ACK');assert.equal(canonicalJson(kept.world),canonicalJson(s.world));assert.deepEqual(kept.planHistory,s.planHistory);assert.deepEqual(queueKboFirstCampNotices(kept),kept.campNotices);
});

test('focus validates four distinct own-kind axes and preseason style permits one actual change, no ability/RNG bonus',()=>{
 const s=enteredKboCareer(),before=canonicalJson(s);for(const bad of [['CONTACT','POWER'],['CONTACT','CONTACT','POWER','DEFENSE'],['VELOCITY','STUFF','COMMAND','STAMINA']])assert.throws(()=>setKboPreseasonFocus(s,s.revision,bad));
 const same=setKboPreseasonArchetype(s,s.revision,s.world.players.own!.archetype);assert.deepEqual(same.styleUsedWindows,s.styleUsedWindows);const changed=setKboPreseasonArchetype(same,same.revision,'SLUGGER');assert.equal(kboPreseasonPlanView(changed).styleChangeAvailable,false);assert.equal(changed.styleUsedWindows.length,s.styleUsedWindows.length+1);assert.throws(()=>setKboPreseasonArchetype(changed,changed.revision,'BALANCED'),/STYLE_WINDOW_USED/);assert.doesNotThrow(()=>setKboPreseasonArchetype(changed,changed.revision,'SLUGGER'));assert.throws(()=>setKboPreseasonArchetype(s,s.revision,'VELOCITY'),/ARCHETYPE/);
 const focused=setKboPreseasonFocus(changed,changed.revision,abilityKeys('HITTER').slice(2));assert.equal(focused.planHistory.length,1);for(const key of ['abilities','potential','careerPeaks'] as const)assert.deepEqual(focused.world.players.own![key],s.world.players.own![key]);assert.deepEqual(focused.world.rng,s.world.rng);assert.equal(canonicalJson(s),before);
});

test('pitcher weight command reuses one PRE configuration chance, unchanged weights consume none and hitters reject',()=>{
 const s=enteredKboCareer('PITCHER'),original=s.world.repertoires.own!,same=setKboPreseasonPitchWeights(s,s.revision,original.weights);assert.deepEqual(same.world.repertoires.own!.usedWindows,[]);
 const changed=setKboPreseasonPitchWeights(same,same.revision,{P01:50,P03:50});assert.deepEqual(changed.world.repertoires.own!.usedWindows,[JSON.stringify(['2030','PRE'])]);assert.equal(kboPreseasonPlanView(changed).pitcher!.configurationChangeAvailable,false);assert.throws(()=>setKboPreseasonPitchWeights(changed,changed.revision,{P01:40,P03:60}),/WINDOW_CLOSED/);assert.doesNotThrow(()=>setKboPreseasonPitchWeights(changed,changed.revision,{P01:50,P03:50}));assert.throws(()=>setKboPreseasonPitchWeights(s,s.revision,{P01:50,P03:49}));assert.deepEqual(changed.world.repertoires.own!.book,original.book);
 const hitter=enteredKboCareer();assert.throws(()=>setKboPreseasonPitchWeights(hitter,hitter.revision,{P01:60,P03:40}),/PITCHER_REQUIRED/);
});

test('learning reserves10 base XP without instant mastery; free slot keeps configuration chance and second plan rejects',()=>{
 const s=enteredKboCareer('PITCHER'),next=beginKboPreseasonPitchLearning(s,s.revision,'P04');assert.equal(next.world.repertoires.own!.book.P04,0);assert.equal(next.world.repertoires.own!.ledger.baseReservedUnits,100_000);assert.deepEqual(next.world.repertoires.own!.usedWindows,[]);assert.equal(kboPreseasonPlanView(next).pitcher!.learningAvailable,false);assert.equal(kboPreseasonPlanView(next).pitcher!.configurationChangeAvailable,true);assert.throws(()=>beginKboPreseasonPitchLearning(next,next.revision,'P05'),/WINDOW_CLOSED/);assert.throws(()=>beginKboPreseasonPitchLearning(s,s.revision,'P01'),/ALREADY_LEARNED/);assert.equal(s.world.repertoires.own!.learning,null);
});

test('controlled four learned pitches: replacement and learning atomically consume the same PRE chance',()=>{
 const s=enteredKboCareer('PITCHER'),book=s.world.repertoires.own!; // Controlled loadout isolates the already approved replacement rule, not newly earned XP.
 book.book={...book.book,P04:100_000,P05:100_000};book.weights={P01:40,P03:30,P04:20,P05:10};const before=canonicalJson(s);assert.throws(()=>beginKboPreseasonPitchLearning(s,s.revision,'P06'),/SLOT_CONFLICT/);const next=beginKboPreseasonPitchLearning(s,s.revision,'P06','P05'),newBook=next.world.repertoires.own!;
 assert.equal(newBook.weights.P05,undefined);assert.equal(newBook.book.P05,100_000);assert.equal(newBook.book.P06,0);assert.equal(Object.values(newBook.weights).reduce((a,b)=>a+b,0),100);assert.deepEqual(newBook.usedWindows,[JSON.stringify(['2030','PRE'])]);assert.throws(()=>setKboPreseasonPitchWeights(next,next.revision,{P01:50,P03:30,P04:20}),/WINDOW_CLOSED/);assert.equal(canonicalJson(s),before);
 const used=setKboPreseasonPitchWeights(s,s.revision,{P01:30,P03:30,P04:20,P05:20});assert.equal(kboPreseasonPlanView(used).pitcher!.learningAvailable,false);assert.throws(()=>beginKboPreseasonPitchLearning(used,used.revision,'P06','P05'),/INVALID_REPLACEMENT/);
});

test('confirm freezes the selected plan/snapshots once, pays no growth and does not require reading E08',()=>{
 const s=enteredKboCareer(),focus=['POWER','DISCIPLINE','RUNNING','CLUTCH'],edited=setKboPreseasonFocus(s,s.revision,focus),styled=setKboPreseasonArchetype(edited,edited.revision,'SLUGGER'),closed=confirmKboPreseasonPlan(styled,styled.revision);
 assert.equal(closed.preseasonPlan!.confirmedRevision,closed.revision);assert.equal(kboPreseasonPlanView(closed).status,'CONFIRMED');assert.equal(closed.phaseContext.phase,'PRESEASON_SETUP');assert.equal(closed.registration.firstTeam,false);assert.equal(closed.seasonGrowth.totalBudgetUnits,0);assert.deepEqual(closed.seasonGrowth.seasonStart,closed.world.players.own);assert.deepEqual(closed.development.seasonStartPlayer,closed.world.players.own);assert.equal(canonicalJson(closed.records),canonicalJson(s.records));assert.equal(canonicalJson(closed.amateurHistory),canonicalJson(s.amateurHistory));assert.deepEqual(confirmKboPreseasonPlan(closed,closed.revision),closed);assert.throws(()=>setKboPreseasonFocus(closed,closed.revision,focus),/ALREADY_CONFIRMED/);
 const n=unreadKboFirstCampNotices(closed)[0]!;assert.deepEqual(n.offeredCommands,['KEEP_FOCUS']);assert.throws(()=>resolveKboFirstCampNotice(closed,closed.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'CHOOSE_FOCUS',focus}),/INVALID_CHOICE/);const read=resolveKboFirstCampNotice(closed,closed.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'KEEP_FOCUS'});assert.equal(kboPreseasonPlanView(read).status,'CONFIRMED');assert.deepEqual(read.preseasonPlan,closed.preseasonPlan);
});

test('confirmed pitcher learning/configuration snapshot remains valid but further edits cannot reopen PRE',()=>{
 const s=enteredKboCareer('PITCHER'),learned=beginKboPreseasonPitchLearning(s,s.revision,'P04'),closed=confirmKboPreseasonPlan(learned,learned.revision);assert.equal(kboPreseasonPlanView(closed).pitcher!.learningPitchId,'P04');assert.equal(kboPreseasonPlanView(closed).pitcher!.configurationChangeAvailable,false);assert.equal(kboPreseasonPlanView(closed).pitcher!.learningAvailable,false);assert.throws(()=>setKboPreseasonPitchWeights(closed,closed.revision,{P01:50,P03:50}),/ALREADY_CONFIRMED/);assert.throws(()=>beginKboPreseasonPitchLearning(closed,closed.revision,'P05'),/ALREADY_CONFIRMED/);
 const bad=structuredClone(closed);bad.world.repertoires.own!.weights={P01:50,P03:50};assert.throws(()=>kboPreseasonPlanView(bad),/STALE_KBO_PRESEASON_PLAN/);
});

test('stale revision/event version, foreign camp evidence and invalid focus reject without state/RNG changes',()=>{
 const s=enteredKboCareer(),n=unreadKboFirstCampNotices(s)[0]!,before=canonicalJson(s);assert.throws(()=>setKboPreseasonFocus(s,s.revision-1,abilityKeys('HITTER').slice(0,4)),/REVISION/);assert.throws(()=>resolveKboFirstCampNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:0,command:'KEEP_FOCUS'}),/VERSION/);assert.throws(()=>resolveKboFirstCampNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:1,command:'CHOOSE_FOCUS',focus:['POWER']}));assert.throws(()=>resolveKboFirstCampNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:1,command:'KEEP_FOCUS',focus:['POWER']}),/UNEXPECTED_FOCUS/);
 const bad=structuredClone(s);bad.campNotices![0]!.resume.registrationKey='foreign-team';assert.throws(()=>unreadKboFirstCampNotices(bad),/FIRST_CAMP_SOURCE/);assert.equal(canonicalJson(s),before);
});

test('legacy AP state is read-only until a write catches up one camp notice; duplicate and changed source reject',()=>{
 const s=enteredKboCareer();delete s.campNotices;const before=canonicalJson(s);assert.deepEqual(unreadKboFirstCampNotices(s),[]);kboPreseasonPlanView(s);assert.equal(canonicalJson(s),before);const changed=setKboPreseasonFocus(s,s.revision,s.world.players.own!.focus);assert.equal(unreadKboFirstCampNotices(changed).length,1);assert.equal(queueKboFirstCampNotices(changed).length,1);
 const duplicate=structuredClone(changed);duplicate.campNotices=[...duplicate.campNotices!,duplicate.campNotices![0]!];assert.throws(()=>unreadKboFirstCampNotices(duplicate),/DUPLICATE/);
 for(const mutate of [(x:typeof s)=>{x.world.seed='foreign';},(x:typeof s)=>{x.seasonGrowth.entries=[{} as never];},(x:typeof s)=>{x.world.players.own!.abilities={...x.world.players.own!.abilities,POWER:x.world.players.own!.abilities.POWER!+1};},(x:typeof s)=>{x.registration.firstTeam=true as false;}]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>confirmKboPreseasonPlan(bad,bad.revision));}
});
