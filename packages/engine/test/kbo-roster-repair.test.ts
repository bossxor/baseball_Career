import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {repairKboDualLeagueRosters,selectKboDualLeagueRoster} from '../src/kbo-roster-repair.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {assertKboFinanceLedger,kboGuaranteedWon,kboClubBalance,reserveKboPreseasonGuarantee} from '../src/kbo-finance.js';
import {canonicalJson} from '../src/game.js';
import {FIELD_POSITIONS,automaticFieldLineup,initialPositionFits} from '../src/lineup.js';
import {emptyBatting} from '../src/stats.js';
import {overall} from '@playball/rules';

function keepFirst35(){
 const x=stagedKboOffseason(0),c=x.world.clubs[0]!,keep=new Set(c.firstTeam);for(const k of c.roster)if(keep.size<35)keep.add(k);
 for(const k of c.roster.filter(k=>!keep.has(k))){delete x.world.players[k];delete x.world.contracts[k];delete x.world.repertoires[k];}
 c.roster=c.roster.filter(k=>keep.has(k));c.reservedSalaryWon=c.roster.reduce((n,k)=>n+x.world.contracts[k]!.annualSalaryWon,0);return x;
}
test('35 contracts are not enough: exact required depth is repaired at minimum salary, independently playable and deterministic',()=>{
 const x=keepFirst35(),before=canonicalJson(x),out=repairKboDualLeagueRosters({...x,difficulty:'GROWTH'}),club=out.world.clubs[0]!;
 assert.equal(canonicalJson(x),before);assert.equal(canonicalJson(out),canonicalJson(repairKboDualLeagueRosters({...JSON.parse(before),difficulty:'GROWTH'})));
 assert.equal(club.roster.length,38);assert.equal(out.receipt.signings.length,3);assert.equal(out.receipt.releases.length,0);
 assertKboRecruitmentWorld(out.world);assert.ok(Object.keys(out.pool.players).length>=80);
 for(const s of out.receipt.signings){assert.equal(out.world.contracts[s.playerKey]!.annualSalaryWon,30_000_000);assert.equal(out.world.contracts[s.playerKey]!.years,1);}
 for(const c of out.world.clubs)for(const keys of [c.firstTeam,c.roster.filter(k=>!c.firstTeam.includes(k))]){
  const members=keys.map(k=>out.world.players[k]!);assert.ok(members.some(p=>p.kind==='PITCHER'));automaticFieldLineup(members.filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
 }
 const retry=repairKboDualLeagueRosters({...out,protagonistKey:x.protagonistKey,difficulty:'GROWTH'});assert.equal(retry.receipt.signings.length,0);assert.equal(retry.receipt.releases.length,0);assert.equal(canonicalJson(retry.world),canonicalJson(out.world));
});
test('an absent replacement role generates only the required35..45 independent profile; valuable expired pros are not forced to minimum',()=>{
 const x=keepFirst35();x.pool.players={};const template=x.world.players[x.world.clubs[0]!.roster[0]!]!;
 x.pool.players['former-pro']={player:{...structuredClone(template),simulationKey:'former-pro'},origin:'EXPIRED',enteredSeasonKey:'2031',previousClubId:x.world.clubs[0]!.id,previousContract:{...x.world.contracts[template.simulationKey]!,playerKey:'former-pro'}};
 const out=repairKboDualLeagueRosters({...x,difficulty:'GROWTH'});assert.equal(out.receipt.signings.length,3);assert.ok(out.receipt.signings.every(s=>s.generated));assert.ok(out.pool.players['former-pro']);
 for(const s of out.receipt.signings){const p=out.world.players[s.playerKey]!,o=overall(p.kind,p.abilities);assert.ok(o.sumUnits>=35*o.denominator && o.sumUnits<=45*o.denominator);assert.ok(p.age>=22 && p.age<=30);}
});
test('full roster with injured required roles releases only redundant NPC slots and preserves the whole preseason guarantee and injury',()=>{
 const x=stagedKboOffseason(10),club=x.world.clubs[0]!,catchers=club.roster.filter(k=>x.world.players[k]!.position==='C');
 for(const k of catchers)x.health.injuries[k]={severity:'MEDIUM',remainingTeamGames:8,seasonKey:'2030',diagnosedGameKey:'injury-'+k};
 const before=new Set(club.roster),out=repairKboDualLeagueRosters({...x,difficulty:'GROWTH'});assert.equal(out.world.clubs[0]!.roster.length,60);assert.equal(out.receipt.signings.length,3);assert.equal(out.receipt.releases.length,3);assertKboRecruitmentWorld(out.world);
 assert.ok(out.world.players[x.protagonistKey]);assert.equal(out.world.players[x.protagonistKey]!.age,x.world.players[x.protagonistKey]!.age);
 for(const r of out.receipt.releases){assert.ok(before.has(r.playerKey));assert.notEqual(r.playerKey,x.protagonistKey);const c=x.world.contracts[r.playerKey]!,entry=out.pool.players[r.playerKey]!;assert.equal(entry.origin,'RELEASED');assert.deepEqual(entry.player,x.world.players[r.playerKey]);assert.deepEqual(entry.injury,x.health.injuries[r.playerKey]);assert.equal(out.health.injuries[r.playerKey],undefined);const g=out.world.finance!.guarantees.find(g=>g.sourceContractKey===c.contractKey)!;assert.equal(g.dues.length,c.years);assert.equal(g.dues[0]!.seasonKey,'2031');assert.equal(g.dues.reduce((n,d)=>n+d.amountWon,0),c.annualSalaryWon*c.years);}
 for(const k of out.world.clubs[0]!.firstTeam)assert.equal(out.health.injuries[k],undefined);
});
test('four-year preseason release includes current year; old after-season entries remain distinct and idempotent',()=>{
 const x=stagedKboOffseason(0),c={...x.world.contracts[x.world.clubs[0]!.roster[1]!]!,years:4},w=x.world;reserveKboPreseasonGuarantee(w,c);assert.throws(()=>assertKboFinanceLedger(w),/GUARANTEE/);delete w.contracts[c.playerKey];const club=w.clubs[0]!;club.roster=club.roster.filter(k=>k!==c.playerKey);delete w.players[c.playerKey];delete w.repertoires[c.playerKey];club.reservedSalaryWon-=c.annualSalaryWon;assertKboFinanceLedger(w);
 for(const year of ['2031','2032','2033','2034'])assert.equal(kboGuaranteedWon(w,c.clubId,year),c.annualSalaryWon);const before=canonicalJson(w);reserveKboPreseasonGuarantee(w,c);assert.equal(canonicalJson(w),before);
 assert.equal(kboClubBalance(w,c.clubId).guaranteedWon,c.annualSalaryWon);assert.throws(()=>reserveKboPreseasonGuarantee(w,{...c,years:5}));
});
test('healthy complete clubs require no extra50-player target and invalid/injured depth cannot produce a false legal roster',()=>{
 const x=stagedKboOffseason(0),out=repairKboDualLeagueRosters({...x,difficulty:'GROWTH'});assert.equal(out.receipt.signings.length,0);assert.equal(out.receipt.releases.length,0);
 const players=x.world.clubs[0]!.roster.map(k=>x.world.players[k]!);assert.throws(()=>selectKboDualLeagueRoster(players.filter(p=>p.position!=='C')),/SUPPLY/);assert.equal(selectKboDualLeagueRoster(players).length,28);assert.equal(FIELD_POSITIONS.length,8);
});
