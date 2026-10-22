import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboRosterWorld} from '../src/kbo-world.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {assertKboFinanceLedger,kboClubBalance,kboFutureCommitmentWon,kboGuaranteedWon,reserveKboOffseasonGuarantee,protectKboEmergencyBudget} from '../src/kbo-finance.js';
import {retireKboOverAgeNpcs} from '../src/kbo-retirement.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {canonicalJson} from '../src/game.js';
const world=()=>({...createKboRosterWorld({worldKey:'finance-test',seasonKey:'2030',seed:'finance-test-seed',difficulty:'GROWTH'}),status:'ACTIVE' as const,calendar:createSeasonCalendar(2030)});

test('05/44: offseason retirement retains all three guaranteed future years; retry cannot charge twice',()=>{
 const w=world(),club=w.clubs[0]!,key=club.roster.find(k=>!club.firstTeam.includes(k))!,c={...w.contracts[key]!,years:4};w.contracts[key]=c;w.players[key]!.age=45;const before=canonicalJson(w),retired=retireKboOverAgeNpcs(w,[key],'2030');assert.equal(retired.length,1);assert.equal(w.finance!.guarantees.length,1);for(const season of ['2031','2032','2033'])assert.equal(kboGuaranteedWon(w,club.id,season),c.annualSalaryWon);assert.equal(kboGuaranteedWon(w,club.id,'2030'),0);assert.equal(kboGuaranteedWon(w,club.id,'2034'),0);assert.notEqual(canonicalJson(w),before);const fixed=canonicalJson(w);reserveKboOffseasonGuarantee(w,c,'2030','RETIREMENT');assert.equal(canonicalJson(w),fixed);assertKboFinanceLedger(w);
 // Closed-season charge already belongs to that year; next season carries only its remaining obligations.
 for(const contract of Object.values(w.contracts)){contract.seasonKey='2031';contract.years=Math.max(1,contract.years-1);}w.seasonKey='2031';w.calendar=createSeasonCalendar(2031);for(const t of w.clubs)t.reservedSalaryWon=t.roster.reduce((n,k)=>n+w.contracts[k]!.annualSalaryWon,0);assertKboRecruitmentWorld(w);assert.equal(kboClubBalance(w,club.id).guaranteedWon,c.annualSalaryWon);
});

test('financial validator counts guarantees in both current available and future90% commitments; duplicate/active debts reject',()=>{
 const w=world(),club=w.clubs[0]!,c={...w.contracts[club.roster[0]!]!,contractKey:'released-source',playerKey:'past-player',annualSalaryWon:3_000_000_000,years:4};reserveKboOffseasonGuarantee(w,c,'2030','RELEASE');assertKboFinanceLedger(w);assert.equal(kboFutureCommitmentWon(w,club.id,1),3_000_000_000+club.roster.reduce((n,k)=>n+(w.contracts[k]!.years>1?w.contracts[k]!.annualSalaryWon:0),0));
 const bad=structuredClone(w);bad.finance!.guarantees=[...bad.finance!.guarantees,{...bad.finance!.guarantees[0]!,obligationKey:'other'}];assert.throws(()=>assertKboFinanceLedger(bad),/GUARANTEE/);
 const overlap=world(),active=overlap.contracts[overlap.clubs[0]!.roster[0]!]!;reserveKboOffseasonGuarantee(overlap,{...active,years:4},'2030','RETIREMENT');assert.throws(()=>assertKboFinanceLedger(overlap),/GUARANTEE/);
 // This valid historical debt makes a current 90억 roster insolvent without erasing the guarantee.
 const current=world();reserveKboOffseasonGuarantee(current,{...c,contractKey:'old-one',years:4,seasonKey:'2029'},'2029','RELEASE');reserveKboOffseasonGuarantee(current,{...c,contractKey:'old-two',playerKey:'past-two',years:4,seasonKey:'2029'},'2029','RELEASE');assert.throws(()=>assertKboRecruitmentWorld(current),/PAYROLL/);assert.equal(current.finance!.guarantees.length,2);
});

test('44 protection is minimum35 only; one-year support is exact deficit and is not future income',()=>{
 const w=world(),club=w.clubs[0]!,removed=club.roster.splice(34);for(const k of removed){delete w.players[k];delete w.contracts[k];delete w.repertoires[k];}club.firstTeam=club.firstTeam.filter(k=>club.roster.includes(k));club.reservedSalaryWon=club.roster.reduce((n,k)=>n+w.contracts[k]!.annualSalaryWon,0);
 assert.equal(kboClubBalance(w,club.id).protectedWon,30_000_000);
 // Controlled imminent guarantees exceed the unchanged basic budget; this helper only funds one required minimum slot.
 const amount=3_000_000_000;for(let i=0;i<3;i++)reserveKboOffseasonGuarantee(w,{contractKey:'debt'+i,playerKey:'old'+i,clubId:club.id,seasonKey:'2029',years:4,annualSalaryWon:amount,signingBonusWon:0,status:'ACTIVE'},'2029','RELEASE');const before=kboClubBalance(w,club.id),expected=Math.max(0,-before.availableWon),grant=protectKboEmergencyBudget(w,club.id,'2030',1);assert.equal(grant,expected);assert.ok(grant>0);assert.equal(kboClubBalance(w,club.id).availableWon,0);assert.equal(protectKboEmergencyBudget(w,club.id,'2030',1),0);assert.equal(club.budgetWon,12_000_000_000);assert.equal(kboClubBalance(w,club.id,'2031').supportWon,0);assert.equal(w.finance!.guarantees.length,3);assertKboFinanceLedger(w);
});

test('old world without finance keeps initial budget exactly; bad years/amounts cannot create obligations',()=>{
 const w=world(),before=canonicalJson(w),club=w.clubs[0]!;assert.equal(w.finance,undefined);assertKboRecruitmentWorld(w);assertKboFinanceLedger(w);assert.equal(kboClubBalance(w,club.id).availableWon,3_000_000_000);assert.equal(canonicalJson(w),before);const c=w.contracts[club.roster[0]!]!;assert.throws(()=>reserveKboOffseasonGuarantee(w,{...c,annualSalaryWon:NaN},'2030','RELEASE'));assert.throws(()=>protectKboEmergencyBudget(w,club.id,'2030',0));assert.equal(canonicalJson(w),before);
});
