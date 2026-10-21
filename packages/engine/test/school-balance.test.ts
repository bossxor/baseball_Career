import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolNpcTarget,schoolNpcAbilities} from '../src/school-roster.js';
import {createHighSchoolWorld,assertHighSchoolWorld} from '../src/high-school-world.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {naturalGrowthBudgetUnits} from '../src/development.js';
import {canonicalJson} from '../src/game.js';
import {abilityKeys,HITTER_TYPES,PITCHER_TYPES} from '@playball/rules';
import {completedHighSchoolCareer} from './fixtures.js';
import {settleHighSchoolCareerGrowth} from '../src/high-school-growth.js';
import {createCareerPlayer} from '../src/player.js';
import {seedPcg32} from '../src/rng.js';
import {identityEffects} from '../src/probabilities.js';
const options=()=>({worldKey:'balance-2',seasonKey:'2029',seasonYear:2029,seed:'balance-fixture',schoolId:'H01',player:{simulationKey:'own',name:'육성선수',kind:'HITTER' as const,position:'CF',throws:'R' as const,bats:'R' as const,pitchForm:null,archetype:'SLUGGER',focus:abilityKeys('HITTER').slice(0,4),difficulty:'REALISTIC' as const}});
test('v2:74% near44..52 and about0.5 OVR60+ per224; tail remains possible without school quotas or cap piles',()=>{
 const N=100_000;let center=0,star=0,tail=0;for(let i=0;i<N;i++){const n=schoolNpcTarget((i+.5)/N,'H01',undefined,2);if(n>=44 && n<=52)center++;if(n>=60)star++;if(n===65)tail++;}
 assert.ok(center/N>.735 && center/N<.745);assert.ok(star/N>.0018 && star/N<.0022);assert.ok(star/N*224<.5);assert.ok(tail/N<.00002);assert.equal(schoolNpcTarget(0,'H01',undefined,2),35);assert.equal(schoolNpcTarget(1,'H01',undefined,2),65);assert.throws(()=>schoolNpcTarget(NaN,'H01',undefined,2));
});
test('v2: NPC profiles shrink to60% while exact mean/type ordering survive; protagonist and college profiles stay intact',()=>{
 for(const [kind,types] of [['HITTER',HITTER_TYPES],['PITCHER',PITCHER_TYPES]] as const)for(const archetype of Object.keys(types))for(const target of [35,48,65]){
  const one=schoolNpcAbilities(kind,archetype,target),two=schoolNpcAbilities(kind,archetype,target,undefined,2);assert.equal(Object.values(two).reduce((a,b)=>a+b,0),target*60_000);assert.deepEqual(schoolNpcAbilities(kind,archetype,target,'COLLEGE',2),one);for(const key of abilityKeys(kind))assert.equal(two[key]!-target*10000,.6*(one[key]!-target*10000));
 }
 const current=createHighSchoolWorld(options()),legacy=createHighSchoolWorld({...options(),schoolBalanceVersion:1});assert.equal(current.schoolBalanceVersion,2);assert.equal(legacy.schoolBalanceVersion,undefined);assert.deepEqual(current.players.own,legacy.players.own);assert.deepEqual(current.rng,legacy.rng);assert.equal(current.players.own!.abilities.POWER,700_000);assertHighSchoolWorld(JSON.parse(JSON.stringify(current)));assertHighSchoolWorld(JSON.parse(JSON.stringify(legacy)));
});
test('NPC generation balance does not increase player growth or alter1.5/1/3 difficulty multipliers',()=>{
 const one=createHighSchoolWorld({...options(),schoolBalanceVersion:1}),two=createHighSchoolWorld(options()),c=createSeasonCalendar(2029),D=c.highSchoolDays.length;
 for(const difficulty of ['GROWTH','REALISTIC','SECRET_CHEAT'] as const){const period={startDay:0,endDay:D,levelSeasonDays:D,level:'HIGH_SCHOOL' as const,appearances:1000,pitcherRole:'SP' as const,rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER' as const,difficulty,beneficiary:true}};const a=naturalGrowthBudgetUnits(one.players.own!,c.growthDays.length,[period]),b=naturalGrowthBudgetUnits(two.players.own!,c.growthDays.length,[period]);assert.equal(a,b);assert.equal(b,Math.round(10*D/c.growthDays.length*1.1*(difficulty==='GROWTH'?1.5:difficulty==='SECRET_CHEAT'?3:1)*10000));}
});
test('real HS settlement retains the baseline budget and duplicate payout stays zero',()=>{
 const source=completedHighSchoolCareer(),before=canonicalJson(source),result=settleHighSchoolCareerGrowth(source,source.revision);assert.equal(source.world.schoolBalanceVersion,2);assert.ok(result.career.seasonGrowth!.entries.every(e=>!Object.hasOwn(e.period,'schoolGrowthVersion')));assert.equal(result.budgetUnits,Math.round(10*150/273*.7*1.5*10000));assert.equal(settleHighSchoolCareerGrowth(result.career,result.career.revision).budgetUnits,0);assert.equal(canonicalJson(source),before);
});

test('repeated careers vary potential by seed; handedness changes matchups without guaranteeing superior potential',()=>{
 const input=options().player,profiles=new Set<string>();let lowest=100,highest=0;
 for(let i=0;i<100;i++){
  const rng=seedPcg32(BigInt(i),54n),right=createCareerPlayer(input,rng),left=createCareerPlayer({...input,bats:'L'},rng);
  assert.deepEqual(right.player.potential,left.player.potential);assert.deepEqual(right.state,left.state);assert.deepEqual(right.player.abilities,left.player.abilities);
  assert.deepEqual(right,createCareerPlayer(input,rng));profiles.add(JSON.stringify(right.player.potential));
  const mean=Object.values(right.player.potential).reduce((a,b)=>a+b,0)/60_000;lowest=Math.min(lowest,mean);highest=Math.max(highest,mean);
 }
 assert.equal(profiles.size,100);assert.ok(highest-lowest>10);assert.ok(highest<95);
 assert.notDeepEqual(identityEffects('OVERHAND','P01','R','R').platoon,identityEffects('OVERHAND','P01','R','L').platoon);
 // Creation-time variance is not proof of full-career top/ordinary outcome frequencies.
});
