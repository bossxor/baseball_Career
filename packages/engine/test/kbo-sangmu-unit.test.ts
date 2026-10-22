import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSangmuCohort} from '../src/kbo-sangmu.js';
import {emptySangmuUnit,enlistSangmuCohort,assertSangmuUnit,returnSangmuPlayers} from '../src/kbo-sangmu-unit.js';
import {completeSangmuBlock,suspendKboContract} from '../src/kbo-military-program.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {enteredKboCareer} from './fixtures.js';

test('Sangmu enlistment moves 20 selected players out of club rosters into the unit and keeps the world valid',()=>{
 const c=enteredKboCareer('HITTER'),sel=selectSangmuCohort({world:c.world,records:c.records,health:c.health,seasonKey:c.world.seasonKey,excluded:new Set([c.protagonistKey])});
 const world=structuredClone(c.world),before=Object.keys(world.players).length,payroll=world.clubs.reduce((n,x)=>n+x.reservedSalaryWon+x.paidSalaryWon,0);
 const unit=enlistSangmuCohort(world,emptySangmuUnit(),sel);
 assert.equal(Object.keys(unit.members).length,20);assert.equal(Object.keys(world.players).length,before-20);assert.equal(Object.keys(world.contracts).length,before-20);
 assert.doesNotThrow(()=>assertKboRecruitmentWorld(world));assert.doesNotThrow(()=>assertSangmuUnit(unit,world));
 for(const club of world.clubs){assert.equal(club.firstTeam.length,28);assert.ok(club.firstTeam.every(k=>club.roster.includes(k)));}
 for(const a of sel.selected){
  const m=unit.members[a.playerKey]!;assert.equal(m.program.originalClubId,a.clubId);assert.equal(m.program.kind,'SPORTS');assert.equal(m.program.startedSeason,String(Number(sel.seasonKey)+1));
  assert.equal(m.program.contract.remainingPaidGameDays%144,0);assert.equal(m.player.simulationKey,a.playerKey);assert.equal(m.repertoire!==null,a.kind==='PITCHER');
 }
 const left=world.clubs.reduce((n,x)=>n+x.reservedSalaryWon+x.paidSalaryWon,0);
 assert.equal(payroll-left,sel.selected.reduce((n,a)=>n+c.world.contracts[a.playerKey]!.annualSalaryWon,0));
 assert.throws(()=>enlistSangmuCohort(world,unit,sel),/SANGMU_COHORT_ALREADY_ENLISTED/);
 const again=structuredClone(c.world);assert.deepEqual(enlistSangmuCohort(again,emptySangmuUnit(),sel),unit);assert.deepEqual(again.clubs,world.clubs);
 const other=sel.selected[0]!,bad={...sel,seasonKey:'2099',selected:[{...other,playerKey:'nobody'}]};
 assert.throws(()=>enlistSangmuCohort(structuredClone(c.world),emptySangmuUnit(),bad),/INVALID_SANGMU_ENLISTMENT/);
});

test('returning Sangmu players resume the contract on the Futures squad; full clubs and expired contracts are reported, not forced',()=>{
 const c=enteredKboCareer('HITTER'),sel=selectSangmuCohort({world:c.world,records:c.records,health:c.health,seasonKey:c.world.seasonKey,excluded:new Set([c.protagonistKey])});
 const world=structuredClone(c.world),unit=enlistSangmuCohort(world,emptySangmuUnit(),sel);
 assert.equal(returnSangmuPlayers(structuredClone(world),unit,'2033').returned.length,0);
 // Finish every program with 1.5 seasons of contract left, except one expired contract.
 const members=Object.fromEntries(Object.entries(unit.members).map(([k,m])=>{const p=completeSangmuBlock(completeSangmuBlock(m.program,m.program.blocks[0]!.seasonKey,400),m.program.blocks[1]!.seasonKey,700);
  return [k,{...m,program:{...p,contract:suspendKboContract({contractKey:'c-'+k,playerKey:k,clubId:p.originalClubId,seasonKey:'2030',years:2,annualSalaryWon:60_000_000,signingBonusWon:0,status:'ACTIVE'},216)}}];}));
 const keys=Object.keys(members).sort(),firstClub=members[keys[0]!]!.program.originalClubId,expiredKey=keys.find(k=>members[k]!.program.originalClubId!==firstClub)!;
 members[expiredKey]!.program={...members[expiredKey]!.program,contract:suspendKboContract({contractKey:'c',playerKey:expiredKey,clubId:members[expiredKey]!.program.originalClubId,seasonKey:'2030',years:1,annualSalaryWon:60_000_000,signingBonusWon:0,status:'ACTIVE'},0)};
 const back=structuredClone(world),full=back.clubs.find(x=>x.id===firstClub)!;full.roster=[...full.roster,...Array.from({length:60-full.roster.length},(_,i)=>'filler-'+i)];
 const out=returnSangmuPlayers(back,{...unit,members},'2033');
 const inFull=keys.filter(k=>members[k]!.program.originalClubId===firstClub);
 assert.deepEqual(out.blockedByRoster,inFull);assert.deepEqual(out.uncontracted,[expiredKey]);
 assert.equal(out.returned.length+out.blockedByRoster.length+out.uncontracted.length,20);
 for(const k of out.returned){
  const club=back.clubs.find(x=>x.roster.includes(k))!;assert.ok(!club.firstTeam.includes(k));assert.equal(club.id,members[k]!.program.originalClubId);
  assert.deepEqual([back.contracts[k]!.seasonKey,back.contracts[k]!.years,back.contracts[k]!.annualSalaryWon],['2033',2,60_000_000]);assert.equal(back.players[k]!.fatigue,0);
 }
 assert.deepEqual(Object.keys(out.unit.members).sort(),[...inFull,expiredKey].sort());
});

test('Sangmu plays Futures as the 11th team in the competition projection and a real game completes',async()=>{
 const {createKboCompetitionGameWorld,SANGMU_TEAM_KEY}=await import('../src/kbo-game-world.js');
 const {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame}=await import('../src/high-school-game.js');
 const c=enteredKboCareer('HITTER'),sel=selectSangmuCohort({world:c.world,records:c.records,health:c.health,seasonKey:c.world.seasonKey,excluded:new Set([c.protagonistKey])});
 const world=structuredClone(c.world),unit=enlistSangmuCohort(world,emptySangmuUnit(),sel);
 const base=structuredClone(c);base.world=world;
 const futures=createKboCompetitionGameWorld(world,'FUTURES',c.protagonistKey,unit),kbo=createKboCompetitionGameWorld(world,'KBO',c.protagonistKey,unit);
 assert.equal(futures.schools.length,11);assert.equal(kbo.schools.length,10);assert.ok(!kbo.schools.some(s=>s.id===SANGMU_TEAM_KEY));
 const team=futures.schools.find(s=>s.id===SANGMU_TEAM_KEY)!;assert.equal(team.roster.length,20);
 const all=futures.schools.flatMap(s=>s.roster);assert.equal(new Set(all).size,all.length);assert.ok(team.roster.every(k=>Object.hasOwn(futures.players,k)));
 assert.ok(!Object.hasOwn(world.players,team.roster[0]!));
 const opponent=futures.schools.find(s=>s.id!==SANGMU_TEAM_KEY)!;
 const starters:Record<string,string>={};for(const s of futures.schools)starters[s.id]=s.roster.filter(k=>futures.players[k]!.kind==='PITCHER' && futures.players[k]!.position==='SP').sort()[0]!;
 const scheduled={simulationKey:'sangmu-test',leagueKey:'FUTURES',seasonKey:world.seasonKey,round:0,worldDay:c.world.calendar.growthDays[5]!,awayTeamKey:opponent.id,homeTeamKey:SANGMU_TEAM_KEY};
 let job=prepareSchoolCompetitionGame(futures,c.records,scheduled,{difficulty:c.difficulty,unavailableKeys:[],starters,recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}});
 for(let i=0;i<200 && job.game.status!=='FINAL';i++)job=advanceHighSchoolGame(job,1000,20);
 assert.equal(job.game.status,'FINAL');
 const committed=commitSchoolCompetitionGame(futures,c.records,job,scheduled);
 assert.ok(Object.hasOwn(committed.records.games['sangmu-test']!.teams,SANGMU_TEAM_KEY));assert.ok(base);
});

test('a career with a Sangmu cohort plays the 11-team Futures calendar through the normal commands',async()=>{
 const {startSangmuCohort,kboSangmuServing}=await import('../src/kbo-sangmu-start.js');
 const {confirmKboPreseasonPlan}=await import('../src/kbo-preseason.js');
 const {confirmKboOpeningRoster}=await import('../src/kbo-opening-roster.js');
 const {confirmKboSeasonSchedule,kboSeasonScheduleView}=await import('../src/kbo-schedule.js');
 const {startKboRegularSeason,advanceKboCareer}=await import('../src/kbo-progress.js');
 const e=enteredKboCareer('HITTER'),s0=startSangmuCohort(e,e.revision);
 assert.equal(kboSangmuServing(s0).length,20);assert.throws(()=>startSangmuCohort(s0,s0.revision),/SANGMU_COHORT_NOT_AVAILABLE/);
 assert.ok(!kboSangmuServing(s0).includes(e.protagonistKey));
 const p=confirmKboPreseasonPlan(s0,s0.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);
 const futures=s.competitionSchedule!.leagues.FUTURES;assert.equal(new Set(futures.flatMap(g=>[g.homeTeamKey,g.awayTeamKey])).size,11);
 assert.equal(s.competitionSchedule!.leagues.KBO.length,720);assert.equal(futures.length,792);
 if(s.registration.competitionKey==='FUTURES')assert.ok(kboSeasonScheduleView(s).fixtures.length===144);
 let g=startKboRegularSeason(s,s.revision);
 for(let i=0;i<14;i++){const out=advanceKboCareer(JSON.parse(JSON.stringify(g)) as typeof g,g.revision,1);g=out.career;}
 const games=Object.values(g.records.games).filter(x=>x.scope.leagueKey==='FUTURES');
 assert.ok(games.length>0);
 const sangmuGames=games.filter(x=>Object.hasOwn(x.teams,'SANGMU'));
 assert.ok(sangmuGames.length>0,'the military team has played');
 assert.ok(sangmuGames.every(x=>Object.keys(x.batting).concat(Object.keys(x.pitching)).filter(k=>Object.hasOwn(g.sangmu!.members,k)).length>0),'military players appear in their games');
 // Members rest/tire in the unit, not in world.players; the rest of the world stays valid.
 assert.ok(Object.values(g.sangmu!.members).some(m=>m.player.fatigue>0));assert.equal(g.health.games.filter(x=>x.evidence.teamKey==='FUTURES:SANGMU').length,0);
 assert.ok(Object.keys(g.sangmu!.members).every(k=>!Object.hasOwn(g.world.players,k)));
});
