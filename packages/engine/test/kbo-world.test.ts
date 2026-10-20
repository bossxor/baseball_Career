import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys,HITTER_TYPES,PITCHER_TYPES,overall,KBO_CLUBS,KBO_MONEY} from '@playball/rules';
import {createKboRosterWorld,assertInitialKboWorld,kboInitialAbilities,initialKboSalaries} from '../src/kbo-world.js';
import {canonicalJson} from '../src/game.js';
const input=()=>({worldKey:'professional-world',seasonKey:'2033',seed:'kbo-fixture',difficulty:'GROWTH' as const});
test('44: ten actual club identities,500 fictional players/500 active contracts,26H/24P and legal first28',()=>{
 const options=input(),before=canonicalJson(options),world=createKboRosterWorld(options);assertInitialKboWorld(world);assert.equal(canonicalJson(options),before);
 assert.equal(Object.keys(world.players).length,500);assert.equal(Object.keys(world.repertoires).length,240);assert.deepEqual(world.clubs.map(c=>c.id).sort(),KBO_CLUBS.map(c=>c.id).sort());
 const all=new Set<string>();for(const club of world.clubs){assert.equal(club.roster.length,50);assert.equal(club.firstTeam.length,28);assert.equal(club.reservedSalaryWon,9_000_000_000);assert.equal(club.budgetWon-club.reservedSalaryWon,3_000_000_000);assert.equal(club.paidSalaryWon,0);
  const members=club.roster.map(k=>world.players[k]!);for(const p of members){assert.equal(all.has(p.simulationKey),false);all.add(p.simulationKey);assert.equal(p.fatigue,0);assert.equal(Object.keys(p.abilities).length,6);assert.equal(p.focus.length,4);}
  assert.deepEqual([[19,22],[23,27],[28,32],[33,38]].map(([lo,hi])=>members.filter(p=>p.age>=lo! && p.age<=hi!).length),[10,18,15,7]);
 }
 assert.equal(all.size,500);
});
test('deterministic generation and JSON restore, distinct seeds change roster; identity/contract keys stay logical',()=>{
 const one=createKboRosterWorld(input()),two=createKboRosterWorld(input());assert.equal(canonicalJson(one),canonicalJson(two));assertInitialKboWorld(JSON.parse(JSON.stringify(one)));
 const other=createKboRosterWorld({...input(),seed:'different-kbo'});assert.notEqual(canonicalJson(other.players),canonicalJson(one.players));assert.deepEqual(Object.keys(other.players).sort(),Object.keys(one.players).sort());
});
test('six-stat mean35..85 exact, profile ceilings100 do not inflate overall or erase profile shape',()=>{
 for(const [kind,types] of [['HITTER',HITTER_TYPES],['PITCHER',PITCHER_TYPES]] as const)for(const archetype of Object.keys(types))for(const target of [35,55,85]){
  const a=kboInitialAbilities(kind,archetype,target),o=overall(kind,a);assert.equal(o.sumUnits,target*o.denominator);assert.ok(Object.values(a).every(n=>Number.isSafeInteger(n) && n>=10_000 && n<=1_000_000));assert.deepEqual(Object.keys(a),abilityKeys(kind));
 }
 const slugger=kboInitialAbilities('HITTER','SLUGGER',85);assert.ok(slugger.POWER!>slugger.CONTACT!);assert.equal(slugger.POWER,1_000_000);assert.throws(()=>kboInitialAbilities('HITTER','BALANCED',86));
});
test('initial payroll common-scale floors/caps, integer won, future commitments<=90% budget and no signing bonus',()=>{
 const world=createKboRosterWorld(input());for(const club of world.clubs){const members=club.roster.map(k=>world.players[k]!);assert.deepEqual(initialKboSalaries(members),initialKboSalaries([...members].reverse()));
  for(let year=0;year<4;year++){const guaranteed=members.map(p=>world.contracts[p.simulationKey]!).filter(c=>c.years>year).reduce((sum,c)=>sum+c.annualSalaryWon,0);assert.ok(guaranteed<=KBO_MONEY.annualBudgetWon*.9);}
  for(const p of members){const c=world.contracts[p.simulationKey]!;assert.equal(c.signingBonusWon,0);assert.ok(c.years>=1 && c.years<=4);assert.ok(c.annualSalaryWon>=30_000_000 && c.annualSalaryWon<=3_000_000_000);assert.equal(c.annualSalaryWon%10_000,0);}
 }
});
test('career hard changes NPC potential only; career cheat does not make all KBO NPC potential100',()=>{
 const normal=createKboRosterWorld(input()),hard=createKboRosterWorld({...input(),difficulty:'REALISTIC'}),cheat=createKboRosterWorld({...input(),difficulty:'SECRET_CHEAT'});
 for(const key of Object.keys(normal.players)){const p=normal.players[key]!;assert.deepEqual(hard.players[key]!.abilities,p.abilities);assert.deepEqual(cheat.players[key]!.abilities,p.abilities);assert.deepEqual(cheat.players[key]!.potential,p.potential);for(const ability of abilityKeys(p.kind))assert.equal(hard.players[key]!.potential[ability],Math.min(1_000_000,p.potential[ability]!+50_000));}
});
test('restored corrupt roster, contract, payroll, first team or age rejected without silent regeneration',()=>{
 const source=createKboRosterWorld(input()),before=canonicalJson(source);
 for(const corrupt of [(w:typeof source)=>{w.rng.roster.increment="0";},(w:typeof source)=>{w.clubs[0]!.roster[1]=w.clubs[0]!.roster[0]!;},(w:typeof source)=>{w.clubs[0]!.reservedSalaryWon--;},(w:typeof source)=>{w.contracts[w.clubs[0]!.roster[0]!]!.clubId='OTHER';},(w:typeof source)=>{w.clubs[0]!.firstTeam[0]=w.clubs[0]!.firstTeam[1]!;},(w:typeof source)=>{w.players[w.clubs[0]!.roster[0]!]!.age=18;}]){const changed=structuredClone(source);corrupt(changed);assert.throws(()=>assertInitialKboWorld(changed));}
 assert.equal(canonicalJson(source),before);
});
