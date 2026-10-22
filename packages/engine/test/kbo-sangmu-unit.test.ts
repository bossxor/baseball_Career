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
