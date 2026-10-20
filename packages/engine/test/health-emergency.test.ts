import test from 'node:test';
import assert from 'node:assert/strict';
import {createHealthLedger,injuryProbability,settleTeamGameHealth,closeSeasonHealth} from '../src/health.js';
import type {HealthGame} from '../src/health.js';
import {seedPcg32,nextFloat} from '../src/rng.js';
import {planEmergencyRoster} from '../src/emergency-roster.js';
import type {EmergencyCandidate} from '../src/emergency-roster.js';
import {createCareerPlayer} from '../src/player.js';
import {abilityKeys} from '@playball/rules';
import {automaticFieldLineup,initialPositionFits} from '../src/lineup.js';
import {emptyBatting} from '../src/stats.js';
const game=(day=1):HealthGame=>({gameKey:'g'+day,teamKey:'H01',seasonKey:'2032',day,roster:['a','b'],appearances:[{playerKey:'a',riskFatigue:81}]});
function injurySeed(min:number,max:number){let rng=seedPcg32(42n,54n);for(let i=0;i<2_000_000;i++){const risk=nextFloat(rng),severity=nextFloat(risk.state);if(risk.value<.003 && severity.value>=min && severity.value<max)return rng;rng=risk.state;}throw new Error('NO_FIXTURE_SEED');}
test('41: appearance injury probability .15%, fatigue strictly above80 doubles; no appearance no RNG',()=>{
 assert.equal(injuryProbability(80),.0015);assert.equal(injuryProbability(80.001),.003);assert.throws(()=>injuryProbability(NaN));
 const source=createHealthLedger(seedPcg32(42n,54n)),before=JSON.stringify(source),result=settleTeamGameHealth(source,{...game(),appearances:[]});
 assert.deepEqual(result.ledger.rng,source.rng);assert.deepEqual(result.result,{injured:[],recovered:[]});assert.equal(JSON.stringify(source),before);
});
test('41: severity80/18/2 branches, durations3..7/8..30/season and unchanged source',()=>{
 for(const [min,max,severity,lo,hi] of [[0,.8,'MILD',3,7],[.8,.98,'MEDIUM',8,30],[.98,1,'MAJOR',0,0]] as const){
  const source=createHealthLedger(injurySeed(min,max)),before=JSON.stringify(source),settled=settleTeamGameHealth(source,game());const injury=settled.ledger.injuries.a!;
  assert.equal(injury.severity,severity);assert.equal(injury.diagnosedGameKey,'g1');assert.deepEqual(settled.result.injured,['a']);
  if(severity==='MAJOR')assert.equal(injury.remainingTeamGames,null);else assert.ok(injury.remainingTeamGames!>=lo && injury.remainingTeamGames!<=hi);
  assert.equal(JSON.stringify(source),before);
 }
});
test('registered team games heal once, diagnosis game excluded; JSON retry exact, no injured appearance',()=>{
 let ledger=settleTeamGameHealth(createHealthLedger(injurySeed(0,.8)),game()).ledger;const duration=ledger.injuries.a!.remainingTeamGames!;
 const retry=settleTeamGameHealth(JSON.parse(JSON.stringify(ledger)),game());assert.equal(retry.duplicate,true);assert.deepEqual(retry.ledger,JSON.parse(JSON.stringify(ledger)));
 assert.throws(()=>settleTeamGameHealth(ledger,{...game(),appearances:[]}));assert.throws(()=>settleTeamGameHealth(ledger,game(2)));
 for(let day=2;day<=duration+1;day++){const settled=settleTeamGameHealth(ledger,{...game(day),appearances:[]});ledger=settled.ledger;assert.deepEqual(settled.result.recovered,day===duration+1?['a']:[]);}
 assert.equal(Object.hasOwn(ledger.injuries,'a'),false);
 const last=game(duration+1);assert.throws(()=>settleTeamGameHealth(ledger,{...last,gameKey:'other',teamKey:'H02',appearances:[]}));
});
test('major persists through team games, closes only at season end; repeated closure no return event',()=>{
 let ledger=settleTeamGameHealth(createHealthLedger(injurySeed(.98,1)),game()).ledger;
 ledger=settleTeamGameHealth(ledger,{...game(2),appearances:[]}).ledger;assert.equal(ledger.injuries.a!.severity,'MAJOR');
 const closed=closeSeasonHealth(ledger,'2032');assert.deepEqual(closed.recovered,['a']);assert.deepEqual(closeSeasonHealth(closed.ledger,'2032').recovered,[]);
 assert.throws(()=>settleTeamGameHealth(closed.ledger,{...game(3),appearances:[]}));
});
test('unregistered injury does not heal, damaged duration rejected; future team evidence cannot heal twice',()=>{
 const source=settleTeamGameHealth(createHealthLedger(injurySeed(0,.8)),game()).ledger;
 const skipped=settleTeamGameHealth(source,{...game(7),teamKey:'H02',roster:['b'],appearances:[]});assert.deepEqual(skipped.ledger.injuries,source.injuries);
 assert.throws(()=>settleTeamGameHealth(skipped.ledger,{...game(6),teamKey:'H03',appearances:[]}));
 const damaged=structuredClone(source);damaged.injuries.a!.remainingTeamGames=0;assert.throws(()=>settleTeamGameHealth(damaged,{...game(2),appearances:[]}));
 const healed=closeSeasonHealth(source,'2032');assert.ok(healed.ledger.injuries.a); // Ordinary remaining games survive season closure.
});
function candidate(id:string,kind:'HITTER'|'PITCHER'='HITTER',throws:'R'|'L'='R',temporary=false):EmergencyCandidate{
 return {player:createCareerPlayer({simulationKey:id,name:'가상선수',kind,position:kind==='HITTER'?'CF':'SP',throws,bats:'R',pitchForm:kind==='HITTER'?null:'OVERHAND',archetype:'BALANCED',focus:abilityKeys(kind).slice(0,4),difficulty:'GROWTH'},seedPcg32(42n,54n)).player,available:true,temporary};
}
test('approved minimum emergency plan: no permanent gaps no temporary, zero healthy team9H+1P',()=>{
 const healthy=[...Array.from({length:15},(_,i)=>candidate('h'+i)),candidate('p','PITCHER')];const extra=candidate('temp','HITTER','R',true);
 assert.deepEqual(planEmergencyRoster([...healthy,extra]),{retainTemporaryKeys:[],releaseTemporaryKeys:['temp'],requiredHitters:0,requiredPitchers:0,requiredRightThrowingHitters:0});
 const allInjured=healthy.map(p=>({...p,available:false}));const plan=planEmergencyRoster(allInjured);assert.equal(plan.requiredHitters,9);assert.equal(plan.requiredPitchers,1);assert.equal(plan.requiredRightThrowingHitters,4);
});
test('temporary rights before lefts prevent excessive replacement; returned originals release temps',()=>{
 const originals=Array.from({length:7},(_,i)=>candidate('h'+i,'HITTER','L'));
 const temporary=[candidate('left0','HITTER','L',true),candidate('left1','HITTER','L',true)];
 const plan=planEmergencyRoster([...originals,...temporary]);assert.equal(plan.requiredHitters,4);assert.equal(plan.requiredRightThrowingHitters,4);assert.deepEqual(plan.retainTemporaryKeys,[]);
 const added=Array.from({length:4},(_,i)=>candidate('r'+i,'HITTER','R',true));const roster=[...originals,...temporary,...added,candidate('p','PITCHER')];
 const filled=planEmergencyRoster(roster);assert.equal(filled.requiredHitters,0);assert.deepEqual(filled.retainTemporaryKeys,['r0','r1','r2','r3']);assert.deepEqual(planEmergencyRoster([...roster].reverse()),filled);
 const active=roster.filter(p=>!p.temporary || filled.retainTemporaryKeys.includes(p.player.simulationKey)).filter(p=>p.player.kind==='HITTER');
 assert.equal(automaticFieldLineup(active.map(p=>({player:p.player,available:true,fits:initialPositionFits(p.player.position),recent:emptyBatting()}))).lineup.length,9);
 const recovered=[...roster,...Array.from({length:4},(_,i)=>candidate('return'+i))];assert.deepEqual(planEmergencyRoster(recovered).retainTemporaryKeys,[]);
});
test('injured temporary not retained; shortage minimal, source and logged player identities retained',()=>{
 const roster=[...Array.from({length:8},(_,i)=>candidate('h'+i)),candidate('temporary','HITTER','R',true)];const before=JSON.stringify(roster);
 assert.deepEqual(planEmergencyRoster(roster).retainTemporaryKeys,['temporary']);assert.equal(planEmergencyRoster(roster.map(p=>p.temporary?{...p,available:false}:p)).requiredHitters,1);
 assert.equal(JSON.stringify(roster),before);assert.throws(()=>planEmergencyRoster([...roster,roster[0]!]));
});
