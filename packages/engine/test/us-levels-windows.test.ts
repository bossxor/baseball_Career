import {usLevelFixture as fixture} from './us-level-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {HITTER_TYPES} from '@playball/rules';
import {usSalaryEntitlement} from '../src/us-season.js';
import type {UsProgress} from '../src/us-season.js';
import {reviewUsLevel,resolveUsLevelEvent,resolveUsLevelEventResult,recordUsMinorOptionChoice,settleUsMinorOptions} from '../src/us-levels.js';
import {raiseUsWindowEvent,resolveUsWindowEvent,trainUsCareer,previewUsTraining,changeUsMidseasonArchetype} from '../src/us-windows.js';
import {assertActiveUsRosterWorld,usCareerView} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {prepareUsRosters} from '../src/us-roster-repair.js';
import type {UsCareer} from '../src/us-career-entry.js';

const phase=(c:UsCareer)=>c.phaseContext as UsProgress;
const day=(c:UsCareer)=>phase(c).nextWorldDay-1;
function offered(c:UsCareer){const r=reviewUsLevel(c,day(c),phase(c));assert.ok(r);assert.equal(r.season!.levelReviews!.at(-1)!.outcome,'OFFERED');return r;}
function decide(c:UsCareer,command:string){const e=c.events.at(-1)!;return resolveUsLevelEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command});}

test('call-up never moves an active injury replacement out of its restoration slot',()=>{
 const c=fixture('AAA'),org=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!,own=c.world.players[c.protagonistKey]!,replacement=org.levels.MLB.find(k=>c.world.players[k]!.kind===own.kind&&c.world.players[k]!.position===own.position)!,original='controlled-injured-original';
 const alternate=org.levels.MLB.find(k=>k!==replacement&&c.world.players[k]!.kind===own.kind&&(own.position!=='C'||c.world.players[k]!.throws==='R'))!;c.world.players[alternate]!.position=own.position;
 c.world.players[original]={...structuredClone(c.world.players[replacement]!),simulationKey:original};c.world.players[replacement]!.abilities=Object.fromEntries(Object.keys(own.abilities).map(k=>[k,100000]));
 c.world.reserves={[org.id]:[original]};c.health.injuries[original]={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:'controlled-unavailable',seasonKey:c.world.seasonKey};
 c.season!.emergency={nextSerial:1,entries:{[replacement]:{clubId:org.id,level:'MLB',replacedKey:original,createdDay:c.season!.firstDay,releasedDay:null}},loans:[]};
 const r=offered(c);assert.notEqual(r.season!.levelReviews!.at(-1)!.otherKey,replacement);const moved=decide(r,'CONFIRM_CALLUP');delete moved.health.injuries[original];prepareUsRosters(moved,day(c)+1);
 const registered=moved.world.organizations.find(o=>o.id===org.id)!.levels.MLB;assert.equal(registered.length,26);assert.ok(registered.includes(original));assert.ok(moved.world.reserves![org.id]!.includes(replacement));assertActiveUsRosterWorld(moved.world);
});
test('US level review waits24 actual level games and minimum samples; defer consumes review without registration or salary changes',()=>{
 const short=fixture('A',23);assert.equal(reviewUsLevel(short,day(short),phase(short)),null);const c=fixture(),raw=canonicalJson(c),r=offered(c);assert.equal(canonicalJson(c),raw);assert.equal(r.events.at(-1)!.definitionId,'E59');const deferred=decide(r,'DEFER_PROMOTION');assert.equal(deferred.registration.level,'A');assert.deepEqual(deferred.contract,c.contract);assert.equal(reviewUsLevel(deferred,day(c),phase(c)),null);const sample=fixture();for(const g of Object.values(sample.records.games))if(g.scope.seasonKey===sample.world.seasonKey)g.batting={};assert.equal(reviewUsLevel(sample,day(sample),phase(sample))!.season!.levelReviews!.at(-1)!.outcome,'NO_SAMPLE');
});
test('US promotion swaps two existing registrations atomically, keeps records, shared identity and no immediate major appearance',()=>{
 const c=fixture(),r=offered(c),next=decide(r,'CONFIRM_PROMOTION');assert.equal(next.registration.level,'AA');assert.deepEqual(next.records,c.records);assert.equal(Object.keys(next.world.players).length,3421);assertActiveUsRosterWorld(next.world);assert.deepEqual(next.income,c.income);assert.equal(next.season!.firstAppearance.MLB,undefined);assert.throws(()=>decide(next,'CONFIRM_PROMOTION'));assert.deepEqual(decide(JSON.parse(JSON.stringify(r)),'CONFIRM_PROMOTION'),next);
});
test('first MLB call-up preserves old minor salary basis and bonus; new800000 rate starts next day and budget is reserved once',()=>{
 const c=fixture('AAA'),r=offered(c),next=decide(r,'CONFIRM_CALLUP'),m=next.season!.majorActivation!;assert.equal(next.registration.level,'MLB');assert.equal(next.contract.type,'US_MAJOR');assert.equal(m.effectiveDay,day(c)+1);assert.equal(next.season!.protectedRoster![c.protagonistOrganizationId]!.length,27);assert.equal(next.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!.levels.MLB.length,26);assert.equal(usSalaryEntitlement(next,m.effectiveDay-next.season!.firstDay),usSalaryEntitlement(c,m.effectiveDay-c.season!.firstDay));const span=next.season!.lastDay-next.season!.firstDay+1,expected=Math.floor((30000*(m.effectiveDay-next.season!.firstDay)+800000*(next.season!.lastDay-m.effectiveDay+1))/span);assert.equal(usSalaryEntitlement(next,span),expected);assert.equal(next.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);assert.equal(usCareerView(next).contract.annualSalaryUsd,800000);assert.equal(next.season!.firstAppearance.MLB,undefined);assert.throws(()=>decide(next,'CONFIRM_CALLUP'));
});
test('US protected40 and incompatible seats produce explicit NO_SLOT instead of silently registering27 MLB players',()=>{
 const c=fixture('AAA'),org=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!,protectedKeys=[...org.levels.MLB,...org.levels.A.filter(k=>k!==c.protagonistKey).slice(0,14)];c.season!.protectedRoster={[org.id]:protectedKeys};const r=reviewUsLevel(c,day(c),phase(c))!;assert.equal(r.season!.levelReviews!.at(-1)!.reason,'PROTECTED_40_FULL');assert.equal(r.phaseContext.phase,'SEASON_PROGRESS');assert.equal(org.levels.MLB.length,26);
});
test('US training and style windows use level thirds/halves and cannot reset season uses by moving levels',()=>{
 const below=fixture('ROOKIE',19);assert.equal(raiseUsWindowEvent(below,day(below),phase(below)),null);const at=fixture('ROOKIE',20),e=raiseUsWindowEvent(at,day(at),phase(at))!,event=e.events.at(-1)!,resume=resolveUsWindowEvent(e,e.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAINING'}).career,key=resume.protagonistKey,ability=resume.world.players[key]!.focus[0]!;resume.world.players[key]!.potential={...resume.world.players[key]!.potential,[ability]:1000000};const preview=previewUsTraining(resume,{type:'GUARANTEED',ability});assert.ok(preview.eligible);const trained=trainUsCareer(resume,resume.revision,{type:'GUARANTEED',ability});assert.equal(trained.world.players[key]!.abilities[ability],resume.world.players[key]!.abilities[ability]!+10000);assert.equal(previewUsTraining(trained,{type:'GUARANTEED',ability}).reason,'LIMIT_REACHED');const moved=structuredClone(trained);moved.registration.level='A';assert.equal(previewUsTraining(moved,{type:'GUARANTEED',ability}).reason,'LIMIT_REACHED');const mid=fixture('ROOKIE',30),type=Object.keys(HITTER_TYPES).find(t=>t!==mid.world.players[mid.protagonistKey]!.archetype)!,changed=changeUsMidseasonArchetype(mid,mid.revision,type);assert.deepEqual(changed.world.players[mid.protagonistKey]!.abilities,mid.world.players[mid.protagonistKey]!.abilities);assert.equal(changed.season!.planChanges![0]!.effectiveDay,phase(mid).nextWorldDay);assert.throws(()=>changeUsMidseasonArchetype(changed,changed.revision,mid.world.players[mid.protagonistKey]!.archetype),/USED/);
});
test('US option year consumes once only after20 minor registered games, with replayed dates ignored',()=>{
 const c=fixture('AAA',0),org=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!,key=c.protagonistKey;c.season!.protectedRoster={[org.id]:[...org.levels.MLB,key]};const days=c.seasonSchedule!.leagues.AAA.filter(g=>g.homeTeamKey===org.id||g.awayTeamKey===org.id).map(g=>g.worldDay);for(const d of days.slice(0,19))settleUsMinorOptions(c,d);assert.equal(c.season!.options![key]!.used,0);settleUsMinorOptions(c,days[19]!);settleUsMinorOptions(c,days[19]!);assert.equal(c.season!.options![key]!.used,1);assert.equal(c.season!.options![key]!.minorGames,20);for(const d of days.slice(20,24))settleUsMinorOptions(c,d);assert.equal(c.season!.options![key]!.used,1);
});

test('a second low Rookie review cannot accidentally promote, and changed offered evidence cannot move a player',()=>{
 const c=fixture('ROOKIE',48,10000);c.season!.levelReviews=[{receiptKey:'prior-low',registrationKey:c.season!.receiptKey,level:'ROOKIE',teamGames:24,day:day(c)-28,score:20,sample:96,to:null,otherKey:null,outcome:'BELOW'}];const low=reviewUsLevel(c,day(c),phase(c))!;assert.equal(low.season!.levelReviews!.at(-1)!.outcome,'BELOW');assert.equal(low.phaseContext.phase,'SEASON_PROGRESS');const r=offered(fixture()),bad=structuredClone(r);bad.season!.levelReviews!.at(-1)!.score++;assert.throws(()=>decide(bad,'CONFIRM_PROMOTION'),/REVIEW_CHANGED/);
});

function demotionReview(){
 const c=fixture('AAA',48,10000),firstDay=c.seasonSchedule!.leagues.AAA.filter(g=>g.homeTeamKey===c.protagonistOrganizationId||g.awayTeamKey===c.protagonistOrganizationId)[23]!.worldDay;
 const first=reviewUsLevel(c,firstDay,{...phase(c),nextWorldDay:firstDay+1})!;assert.equal(first.season!.levelReviews!.at(-1)!.outcome,'BELOW');return offered(first);
}
test('two actual low review calls offer E61 and its domain command swaps AAA/AA without changing pay or identity',()=>{
 const c=demotionReview(),e=c.events.at(-1)!,review=c.season!.levelReviews!.at(-1)!,raw=canonicalJson(c),next=decide(c,'CONFIRM_DEMOTION'),org=next.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!;
 assert.equal(e.definitionId,'E61');assert.equal(review.teamGames,48);assert.equal(next.registration.level,'AA');assert.ok(org.levels.AA.includes(c.protagonistKey));assert.ok(org.levels.AAA.includes(review.otherKey!));assertActiveUsRosterWorld(next.world);
 assert.deepEqual(next.contract,c.contract);assert.deepEqual(next.inventory,c.inventory);assert.deepEqual(next.income,c.income);assert.deepEqual(next.records,c.records);assert.deepEqual(next.seasonGrowth,c.seasonGrowth);assert.deepEqual(next.world.players,c.world.players);assert.equal(next.season!.levelMoves!.at(-1)!.from,'AAA');assert.equal(next.events.at(-1)!.status,'RESOLVED');assert.equal(next.phaseContext.phase,'SEASON_PROGRESS');assert.equal(next.revision,c.revision+1);assert.equal(canonicalJson(c),raw);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));assert.throws(()=>decide(next,'CONFIRM_DEMOTION'),/INVALID_US_LEVEL_EVENT/);
});
test('E61 OPEN_RIGHTS navigates to S08 with the event, registration and money unchanged',()=>{
 const c=demotionReview(),e=c.events.at(-1)!,raw=canonicalJson(c),out=resolveUsLevelEventResult(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_RIGHTS'});
 assert.equal(out.career,c);assert.equal(out.navigation!.targetScreen,'S08');assert.equal(out.navigation!.sourceEventKey,e.eventKey);assert.equal(c.events.at(-1)!.status,'OPEN');assert.equal(canonicalJson(c),raw);assert.throws(()=>decide(c,'OPEN_RIGHTS'),/US_RIGHTS_VIEW_ONLY/);assert.equal(canonicalJson(c),raw);
 const published=structuredClone(c);published.revision++;assert.equal(resolveUsLevelEventResult(published,published.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_RIGHTS'}).career,published);assert.equal(decide(published,'CONFIRM_DEMOTION').registration.level,'AA');
});
test('E61 navigation and demotion reject stale or changed review, event and resume input without writes',()=>{
 const c=demotionReview(),e=c.events.at(-1)!,input={eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_RIGHTS'},raw=canonicalJson(c);
 assert.throws(()=>resolveUsLevelEventResult(c,c.revision-1,input),/REVISION/);assert.throws(()=>resolveUsLevelEventResult(c,c.revision,{...input,eventVersion:e.version+1}),/EVENT_VERSION_CHANGED/);assert.throws(()=>resolveUsLevelEventResult(c,c.revision,{...input,command:'CONFIRM_PROMOTION'}),/INVALID_CHOICE/);
 for(const change of [(x:UsCareer)=>{x.season!.levelReviews!.at(-1)!.score++;},(x:UsCareer)=>{x.events.at(-1)!.resume.registrationKey='foreign-club';},(x:UsCareer)=>{if(x.phaseContext.phase==='EVENT_DECISION')x.phaseContext.resume.nextWorldDay++;}]){const bad=structuredClone(c);change(bad);const before=canonicalJson(bad);assert.throws(()=>resolveUsLevelEventResult(bad,bad.revision,input),/REVIEW_CHANGED/);assert.equal(canonicalJson(bad),before);}
 assert.equal(canonicalJson(c),raw);
});
test('MLB E61 still requires exhausted-option consent and preserves the MLB contract on successful demotion',()=>{
 const c=decide(offered(fixture('AAA')),'CONFIRM_CALLUP'),s=c.season!,key=c.protagonistKey,club=c.protagonistOrganizationId,last=s.levelMoves!.at(-1)!.day,games=c.seasonSchedule!.leagues.MLB.filter(g=>g.worldDay>last&&(g.homeTeamKey===club||g.awayTeamKey===club)).slice(0,48);
 // Controlled team-game rows exercise review/option rules; these are not48 simulated MLB games.
 c.world.players[key]!.abilities=Object.fromEntries(Object.keys(c.world.players[key]!.abilities).map(k=>[k,10000]));
 for(const g of games)c.records.games[g.simulationKey]={gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:'MLB',phase:'REGULAR'},teams:{[g.homeTeamKey]:{games:1,W:1,L:0,T:0,R:1,RA:0},[g.awayTeamKey]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:games.at(-1)!.worldDay+1,pendingGame:null};s.options={[key]:{used:3,seasons:[],minorGames:0}};
 const first=reviewUsLevel(c,games[23]!.worldDay,{...phase(c),nextWorldDay:games[23]!.worldDay+1})!,blocked=reviewUsLevel(first,day(first),phase(first))!;assert.equal(blocked.season!.levelReviews!.at(-1)!.reason,'MINOR_CONSENT_REQUIRED');assert.equal(blocked.phaseContext.phase,'SEASON_PROGRESS');
 const fa=recordUsMinorOptionChoice(first,first.revision,'FA'),refused=reviewUsLevel(fa,day(fa),phase(fa))!;assert.equal(refused.season!.levelReviews!.at(-1)!.reason,'OPTION_FA_ELECTED');
 const stayed=recordUsMinorOptionChoice(first,first.revision,'STAY'),r=offered(stayed),moved=decide(r,'CONFIRM_DEMOTION');assert.equal(r.events.at(-1)!.definitionId,'E61');assert.equal(moved.registration.level,'AAA');assert.equal(moved.contract.type,'US_MAJOR');assert.deepEqual(moved.contract,r.contract);assert.deepEqual(moved.inventory,r.inventory);assert.deepEqual(moved.income,r.income);assert.equal(moved.season!.options![key]!.used,3);assert.ok(moved.season!.protectedRoster![club]!.includes(key));assertActiveUsRosterWorld(moved.world);
});
