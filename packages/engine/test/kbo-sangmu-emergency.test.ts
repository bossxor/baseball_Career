import test from 'node:test';
import assert from 'node:assert/strict';
import {overall} from '@playball/rules';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {createSangmuEmergency,reconcileSangmuEmergency,assertSangmuEmergency} from '../src/kbo-sangmu-emergency.js';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import {closeKboCompetitionDay} from '../src/kbo-day.js';
import {planEmergencyRoster} from '../src/emergency-roster.js';
import {canonicalJson} from '../src/game.js';
import {kboRelationshipListView,kboRelationDetailView} from '../src/kbo-relations.js';
import type {PlayerRelationship} from '../src/relationships.js';
import {assertKboCareerRevision} from '../src/kbo-career-version.js';
import {settleTeamGameHealth,createHealthLedger} from '../src/health.js';
import {seedPcg32,nextFloat} from '../src/rng.js';
import {emptySangmuUnit,enlistSangmuCohort,returnSangmuPlayers} from '../src/kbo-sangmu-unit.js';
import {selectSangmuCohort} from '../src/kbo-sangmu.js';
import {kboOpponentReunionNoticeRows} from '../src/kbo-reunion-events.js';
import {enlistInSangmu} from '../src/kbo-military-program.js';

let cached:KboCareer|undefined;
function preseason(){
 if(!cached){const e=enteredKboCareer(),u=startSangmuCohort(e,e.revision),p=confirmKboPreseasonPlan(u,u.revision),o=confirmKboOpeningRoster(p,p.revision);cached=confirmKboSeasonSchedule(o,o.revision);}
 return structuredClone(cached);
}
function started(){const p=preseason();return startKboRegularSeason(p,p.revision);}
function injure(c:KboCareer,keys:string[],remaining=1){
 // Controlled pre-opening diagnosis isolates roster repair; the real health roll is tested separately below.
 const gameKey='controlled-army-diagnosis',seasonKey=c.world.seasonKey;
 c.health.games=[...c.health.games,{evidence:{gameKey,seasonKey,teamKey:'FUTURES:SANGMU',day:0,roster:keys,appearances:keys.map(playerKey=>({playerKey,riskFatigue:81}))},result:{injured:keys,recovered:[]}}];
 for(const key of keys)c.health.injuries[key]={severity:'MILD',remainingTeamGames:remaining,diagnosedGameKey:gameKey,seasonKey};
}
function finishDay(source:KboCareer,roundTrip=false){let c=source;for(let i=0;i<150;i++){const r=advanceKboCareer(roundTrip?JSON.parse(JSON.stringify(c)) as KboCareer:c,c.revision);c=r.career;assert.notEqual(r.stopReason,'ENGINE_LIMIT');if(r.daysClosed)return c;}throw Error('DAY_LIMIT');}
function relation(c:KboCareer,key:string):PlayerRelationship {const normalPairKey=JSON.stringify([c.protagonistKey,key].sort());return {relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,primaryPlayerKey:c.protagonistKey,otherPlayerKey:key,type:'RIVAL',stage:'SEPARATED',milestones:[{stage:'FORMED',evidenceKey:'controlled-prior-relation',worldDay:0},{stage:'SEPARATED',evidenceKey:'controlled-separation',worldDay:0}]};}

test('new military season opts in once; legacy current seasons neither migrate nor consume army health RNG',()=>{
 const p=preseason(),before=canonicalJson(p),fresh=startKboRegularSeason(p,p.revision);
 assert.equal(fresh.schemaVersion,5);assert.ok(fresh.sangmu!.emergency);assert.equal(canonicalJson(p),before);assert.deepEqual(fresh.health,p.health);assert.deepEqual(fresh.world,p.world);
 assert.throws(()=>startKboRegularSeason(fresh,fresh.revision));
 const legacy=structuredClone(fresh);legacy.schemaVersion=3;delete legacy.sangmu!.emergency;
 assert.doesNotThrow(()=>assertKboCareerRevision(legacy,legacy.revision));
 const day=finishDay(legacy),armyGames=Object.values(day.records.games).filter(g=>g.scope.seasonKey===day.world.seasonKey && Object.hasOwn(g.teams,'SANGMU'));
 assert.ok(armyGames.length);assert.equal(day.sangmu!.emergency,undefined);assert.ok(!day.health.games.some(g=>g.evidence.seasonKey===day.world.seasonKey && g.evidence.teamKey==='FUTURES:SANGMU'));
 // Replaying the same completed legacy day does not draw again or opt in.
 const replay=closeKboCompetitionDay(day.world,day.competitionSchedule!.leagues,day.protagonistKey,day.records,day.health,day.days!,day.days!.days.at(-1)!.day,day.sangmu);
 assert.equal(replay.duplicate,true);assert.deepEqual(replay.health,day.health);assert.deepEqual(replay.sangmu,day.sangmu);
 const downgraded=structuredClone(fresh);downgraded.schemaVersion=4;assert.throws(()=>advanceKboCareer(downgraded,downgraded.revision),/CAREER_REVISION_CHANGED/);
});

test('minimum injury replacements use isolated35..45 identities; recovery releases registration without deleting history',()=>{
 const c=started(),members=Object.values(c.sangmu!.members),hitters=members.filter(m=>m.player.kind==='HITTER').map(m=>m.player.simulationKey),pitchers=members.filter(m=>m.player.kind==='PITCHER').map(m=>m.player.simulationKey);
 const keys=[...hitters,...pitchers];injure(c,keys);const before=canonicalJson(c),day=c.world.calendar.growthDays[0]!;
 const unit=reconcileSangmuEmergency(c.world,c.sangmu!,c.health,day),entries=Object.values(unit.emergency!.entries);
 assert.equal(entries.filter(e=>e.player.kind==='HITTER').length,9);assert.equal(entries.filter(e=>e.player.kind==='PITCHER').length,1);
 for(const e of entries){const o=overall(e.player.kind,e.player.abilities);assert.ok(o.sumUnits>=35*o.denominator && o.sumUnits<=45*o.denominator);assert.ok(!Object.hasOwn(c.world.players,e.player.simulationKey));assert.ok(!Object.hasOwn(c.world.contracts,e.player.simulationKey));assert.ok(!Object.hasOwn(unit.members,e.player.simulationKey));}
 assert.deepEqual(reconcileSangmuEmergency(c.world,JSON.parse(JSON.stringify(unit)),c.health,day),JSON.parse(JSON.stringify(unit)));
 assert.deepEqual(reconcileSangmuEmergency(c.world,c.sangmu!,c.health,day),unit);assert.equal(canonicalJson(c),before);
 const projection=createKboCompetitionGameWorld(c.world,'FUTURES',c.protagonistKey,unit),team=projection.schools.find(s=>s.id==='SANGMU')!,plan=planEmergencyRoster(team.roster.map(k=>({player:projection.players[k]!,available:!c.health.injuries[k],temporary:!!unit.emergency!.entries[k]})));
 assert.equal(plan.requiredHitters+plan.requiredPitchers,0);
 const health=structuredClone(c.health);for(const key of keys)delete health.injuries[key];
 const released=reconcileSangmuEmergency(c.world,unit,health,day+1);assert.equal(Object.keys(released.emergency!.entries).length,10);assert.ok(Object.values(released.emergency!.entries).every(e=>e.released?.worldDay===day+1));
 const after=createKboCompetitionGameWorld(c.world,'FUTURES',c.protagonistKey,released);assert.equal(after.schools.find(s=>s.id==='SANGMU')!.roster.length,20);assert.deepEqual(Object.values(released.emergency!.entries).map(e=>e.player),entries.map(e=>e.player));
});

test('normal advance fields injured army replacements, commits their XP/health/fatigue once and resumes from JSON',()=>{
 const c=started(),keys=Object.keys(c.sangmu!.members);injure(c,keys);const before=canonicalJson(c),a=finishDay(c),b=finishDay(JSON.parse(JSON.stringify(c)),true);
 assert.deepEqual(a,b);assert.equal(canonicalJson(c),before);
 const army=Object.values(a.records.games).find(g=>g.scope.seasonKey===a.world.seasonKey && Object.hasOwn(g.teams,'SANGMU'))!;assert.ok(army);
 const row=a.health.games.find(h=>h.evidence.gameKey===army.gameKey && h.evidence.teamKey==='FUTURES:SANGMU')!;assert.ok(row);assert.ok(keys.every(k=>row.evidence.roster.includes(k)));assert.ok(keys.every(k=>!row.evidence.appearances.some(p=>p.playerKey===k)));
 const entries=a.sangmu!.emergency!.entries,played=Object.keys(army.batting).concat(Object.keys(army.pitching)).filter(k=>!!entries[k]);assert.ok(played.length>=10);
 assert.ok(played.every(k=>entries[k]!.player.fatigue>0));assert.ok(Object.keys(army.pitching).some(k=>entries[k]?.repertoire && Object.values(entries[k]!.repertoire!.book).some(xp=>xp!>0)));
 const all=[...createKboCompetitionGameWorld(a.world,'KBO',a.protagonistKey,a.sangmu).schools,...createKboCompetitionGameWorld(a.world,'FUTURES',a.protagonistKey,a.sangmu).schools].flatMap(s=>s.roster);assert.equal(new Set(all).size,all.length);
 const replay=closeKboCompetitionDay(a.world,a.competitionSchedule!.leagues,a.protagonistKey,a.records,a.health,a.days!,army.worldDay,a.sangmu);assert.equal(replay.duplicate,true);assert.deepEqual(replay.sangmu,a.sangmu);assert.deepEqual(replay.health,a.health);
 assert.ok(keys.every(k=>!Object.hasOwn(a.health.injuries,k)));
 const cleaned=reconcileSangmuEmergency(a.world,a.sangmu!,a.health,army.worldDay+1);assert.ok(Object.values(cleaned.emergency!.entries).every(e=>e.released!==null));assert.deepEqual(a.records,b.records);
});

test('new army health records a real diagnosis, heals by registered army games, never by a rest date',()=>{
 const c=started(),key=Object.keys(c.sangmu!.members)[0]!;let rng=seedPcg32(42n,54n);
 for(let i=0;i<100_000;i++){const risk=nextFloat(rng),severity=nextFloat(risk.state);if(risk.value<.0015 && severity.value<.8)break;rng=risk.state;}
 const game={gameKey:'army-health-1',teamKey:'FUTURES:SANGMU',seasonKey:c.world.seasonKey,day:1,roster:[key],appearances:[{playerKey:key,riskFatigue:0}]},first=settleTeamGameHealth(createHealthLedger(rng),game);assert.deepEqual(first.result.injured,[key]);
 const duration=first.ledger.injuries[key]!.remainingTeamGames!;let ledger=first.ledger;
 for(let i=1;i<=duration;i++)ledger=settleTeamGameHealth(ledger,{...game,gameKey:'army-health-'+(i+1),day:1+i*2,appearances:[]}).ledger;
 assert.ok(!ledger.injuries[key]);assert.deepEqual(settleTeamGameHealth(ledger,{...game,gameKey:'army-health-'+(duration+1),day:1+duration*2,appearances:[]}).ledger,ledger);
});

test('military-only identities remain visible in relationships while serving and after temporary release',()=>{
 const c=started(),key=Object.keys(c.sangmu!.members)[0]!,r=relation(c,key);c.relationships.relations=[r];const before=canonicalJson(c),row=kboRelationshipListView(c)[0]!;
 assert.equal(row.other?.name,c.sangmu!.members[key]!.player.name);assert.equal(row.other?.teamName,'상무');assert.equal(row.otherAvailability,'CURRENT_WORLD');assert.equal(row.lastKnownRegistration?.leagueKey,'FUTURES');assert.equal(canonicalJson(c),before);
 injure(c,Object.keys(c.sangmu!.members));const played=finishDay(c),entry=Object.entries(played.sangmu!.emergency!.entries)[0]!,tr=relation(played,entry[0]);played.relationships.relations=[tr];
 played.sangmu=reconcileSangmuEmergency(played.world,played.sangmu!,played.health,played.days!.days.at(-1)!.day+1);
 const archive=kboRelationshipListView(played)[0]!;assert.equal(archive.other?.name,entry[1].player.name);assert.equal(archive.otherAvailability,'HISTORICAL_ONLY');assert.equal(archive.lastKnownRegistration?.teamId,'SANGMU');assert.equal(archive.lastKnownRegistration?.leagueKey,'FUTURES');
 const detail=kboRelationDetailView(played,tr.relationKey,{leagueKey:'FUTURES',phase:'REGULAR'});assert.notEqual(detail.mode,'UNAVAILABLE');
});

test('corrupt archives or insufficient permanent intake reject without mutation; enlist/return keep archive',()=>{
 const c=started(),day=c.world.calendar.growthDays[0]!;injure(c,Object.keys(c.sangmu!.members));const u=reconcileSangmuEmergency(c.world,c.sangmu!,c.health,day),before=canonicalJson(u),key=Object.keys(u.emergency!.entries)[0]!;
 for(const mutate of [(x:typeof u)=>{x.emergency!.worldKey='foreign';},(x:typeof u)=>{x.emergency!.nextSerial=1;},(x:typeof u)=>{x.emergency!.entries[key]!.player.simulationKey='foreign';},(x:typeof u)=>{x.emergency!.entries[key]!.released={seasonKey:c.world.seasonKey,worldDay:-1};}]){const bad=structuredClone(u);mutate(bad);assert.throws(()=>assertSangmuEmergency(bad,c.world));}
 const empty={...u,members:{}};assert.throws(()=>reconcileSangmuEmergency(c.world,empty,c.health,day),/SANGMU_PERMANENT_ROSTER_INSUFFICIENT/);assert.equal(canonicalJson(u),before);
 const ret=returnSangmuPlayers(structuredClone(c.world),u,c.world.seasonKey);assert.deepEqual(ret.unit.emergency,u.emergency);
 const initial=enteredKboCareer(),world=structuredClone(initial.world),selection=selectSangmuCohort({world,records:initial.records,health:initial.health,seasonKey:String(Number(world.seasonKey)-1),excluded:new Set([initial.protagonistKey])}),enlisted=enlistSangmuCohort(world,{...emptySangmuUnit(),emergency:structuredClone(u.emergency!)},selection,initial.protagonistClubId);assert.deepEqual(enlisted.emergency,u.emergency);
 const legacy=structuredClone(c.sangmu!);delete legacy.emergency;assert.equal(reconcileSangmuEmergency(c.world,legacy,c.health,day),legacy);
 assert.deepEqual(createSangmuEmergency(c.world),{schemaVersion:1,worldKey:c.world.worldKey,nextSerial:1,entries:{}});
});

test('a real army opponent game supplies E95 side evidence and the current military identity',()=>{
 const c=started(),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!,me=c.world.players[c.protagonistKey]!,reserve=club.roster.find(k=>!club.firstTeam.includes(k) && c.world.players[k]!.position===me.position)!;assert.ok(reserve);
 // Controlled first-team demotion and one-game calendar isolate the real opponent game, not invented appearance receipts.
 club.firstTeam=club.firstTeam.map(k=>k===me.simulationKey?reserve:k);c.registration={...c.registration,firstTeam:false,competitionKey:'FUTURES'};
 const game=c.competitionSchedule!.leagues.FUTURES.find(g=>[g.homeTeamKey,g.awayTeamKey].includes('SANGMU') && [g.homeTeamKey,g.awayTeamKey].includes(club.id))!;assert.ok(game);
 c.competitionSchedule!.leagues={KBO:[],FUTURES:[game]};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:game.worldDay,pendingGame:null};
 const dry=finishDay(c),played=dry.records.games[game.simulationKey]!;assert.ok(played.batting[me.simulationKey]);const other=Object.keys(played.batting).find(k=>!!c.sangmu!.members[k])!;assert.ok(other);
 c.relationships.relations=[relation(c,other)];const actual=finishDay(c,true),notice=kboOpponentReunionNoticeRows(actual)[0]!;
 assert.equal(notice.definitionId,'E95');assert.deepEqual(actual.records,dry.records);assert.deepEqual(actual.health,dry.health);assert.equal(kboRelationshipListView(actual)[0]!.other?.teamName,'상무');assert.equal(actual.relationships.relations[0]!.stage,'REUNITED_OPPONENT');
});

test('confirmed next-year sports enlistment keeps current civilian identity readable without weakening active military registration',()=>{
 const c=started(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;assert.ok(club.firstTeam.includes(c.protagonistKey));
 // Controlled confirmed-program shape, matching ENLIST before next year's roster activation.
 const program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:club.id,selectionSeasonKey:c.world.seasonKey,contract:c.world.contracts[c.protagonistKey]!,remainingPaidGameDays:144});
 c.phaseContext={phase:'SEASON_REVIEW'};c.military={status:'SERVING_SPORTS',applications:[],program};c.sangmu!.loaned=[c.protagonistKey];const before=canonicalJson(c);
 assert.doesNotThrow(()=>kboRelationshipListView(c));assert.equal(canonicalJson(c),before);
 const active=structuredClone(c);active.military!.program!.startedSeason=c.world.seasonKey;assert.throws(()=>kboRelationshipListView(active),/INVALID_SANGMU_UNIT/);
 const foreign=structuredClone(c);foreign.military!.program!.playerKey='foreign';assert.throws(()=>kboRelationshipListView(foreign),/INVALID_SANGMU_UNIT/);
});
