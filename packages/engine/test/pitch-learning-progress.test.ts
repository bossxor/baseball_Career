import {abilityKeys} from '@playball/rules';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import {beginSchoolPreseasonPitchLearning} from '../src/school-repertoire.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {PITCH_IDS} from '@playball/rules';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRepertoire,beginPitchLearning,pitchMastery} from '../src/repertoire.js';
import {registerPitchLearning,settleRegisteredPitchLearning} from '../src/pitch-learning-progress.js';
import {createHealthLedger} from '../src/health.js';
import {createWorldStream} from '../src/rng.js';
import {emptyRecordLedger} from '../src/records.js';
import {canonicalJson} from '../src/game.js';
function fixture(games=0,injury=false,numerator:5|6|15=5){let book=beginPitchLearning(createRepertoire(PITCH_IDS[1]!,'2030'),PITCH_IDS[2]!,true);book=registerPitchLearning(book,'world','pitcher',48,false);const records=emptyRecordLedger(),health=createHealthLedger(createWorldStream('test','pitch-learning','roster'));for(let i=0;i<games;i++){const gameKey='quarter-'+i;records.games[gameKey]={gameKey,worldDay:i,scope:{seasonKey:'2030',leagueKey:'HS',phase:'REGULAR'},teams:{},batting:{},pitching:{},matchups:{},batterSplits:{},pitcherSplits:{}};health.games=[...health.games,{evidence:{gameKey,teamKey:'school',seasonKey:'2030',day:i,roster:['pitcher'],appearances:[]},result:{injured:injury&&i===5?['pitcher']:[],recovered:injury&&i===9?['pitcher']:[]}}];}return {worldKey:'world',seasonKey:'2030',playerKey:'pitcher',repertoire:book,records,health,scheduledGames:48,numerator};}
test('actual registration receipts open quarter12/24/36/48, release100000 base reservation once and preserve replay',()=>{
 const early=fixture(11),before=canonicalJson(early);assert.equal(settleRegisteredPitchLearning(early).learning!.quarters.length,0);assert.equal(canonicalJson(early),before);const first=settleRegisteredPitchLearning(fixture(12));assert.equal(first.learning!.quarters.length,1);assert.equal(first.ledger.baseReservedUnits,75000);const all=fixture(48),done=settleRegisteredPitchLearning(all);assert.equal(done.learning!.quarters.length,4);assert.equal(done.ledger.baseReservedUnits,0);assert.equal(done.book[PITCH_IDS[2]!],100000);assert.equal(pitchMastery(done.book[PITCH_IDS[2]!]!),1);assert.deepEqual(settleRegisteredPitchLearning({...all,repertoire:done}),done);
});
test('quarter learning pays only healthy registered dates; cheat applies3x and PAs/refresh cannot create a second budget',()=>{
 const injured=settleRegisteredPitchLearning(fixture(12,true));assert.equal(injured.learning!.quarters[0]!.registeredDays,12);assert.equal(injured.learning!.quarters[0]!.healthyDays,8);const cheat=settleRegisteredPitchLearning(fixture(48,false,15));assert.equal(cheat.book[PITCH_IDS[2]!],300000);assert.equal(cheat.ledger.baseSpentUnits,100000);assert.deepEqual(settleRegisteredPitchLearning({...fixture(48,false,15),repertoire:cheat}),cheat);
});
test('learning rejects changed manifest, missing official contribution and double registration; JSON preserves remainder and plan',()=>{
 const x=fixture(12),a=settleRegisteredPitchLearning(x),b=settleRegisteredPitchLearning(JSON.parse(JSON.stringify(x)));assert.deepEqual(a,b);assert.throws(()=>registerPitchLearning(x.repertoire,'world','pitcher',60,false),/REUSED/);assert.throws(()=>settleRegisteredPitchLearning({...x,scheduledGames:60}),/REGISTRATION_CHANGED/);const missing=fixture(12);delete missing.records.games['quarter-0'];assert.throws(()=>settleRegisteredPitchLearning(missing),/MISSING_LEARNING_GAME/);const twice=fixture(12);twice.health.games=[...twice.health.games,structuredClone(twice.health.games[0]!)];assert.throws(()=>settleRegisteredPitchLearning(twice),/DOUBLE_BOOKED/);
});

test('native high-school season closes first learning quarter from12 actual registered games before the first focus event',()=>{
 let c=createHighSchoolCareer(createHighSchoolWorld({worldKey:'learning-native',seasonKey:'2030',seasonYear:2030,seed:'learning-native-30',schoolId:'H01',secondaryPitch:'P03',player:{simulationKey:'own-pitcher',name:'분기 투수',kind:'PITCHER',position:'SP',throws:'R',bats:'R',pitchForm:'OVERHAND',archetype:'BALANCED',focus:abilityKeys('PITCHER').slice(0,4),difficulty:'GROWTH'}}),'GROWTH');c=confirmCareerPlayer(c,0);c=resolveCareerFocusEvent(c,c.revision,{eventKey:c.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});c=beginSchoolPreseasonPitchLearning(c,c.revision,'P04');assert.equal(c.world.repertoires['own-pitcher']!.learning!.registration!.scheduledGames,48);c=confirmCareerPreseason(c,c.revision);for(let i=0;i<500;i++){c=advanceHighSchoolCareer(c,c.revision,'ONE_GAME').career;if(c.world.repertoires['own-pitcher']!.learning!.quarters.length)break;if(c.phaseContext.phase==='EVENT_DECISION')throw Error('Unexpected earlier event '+c.events.find(e=>e.eventKey===(c.phaseContext as {eventKey:string}).eventKey)?.definitionId);}const book=c.world.repertoires['own-pitcher']!;assert.equal(book.learning!.quarters.length,1);assert.equal(book.learning!.quarters[0]!.registeredDays,12);assert.equal(book.ledger.baseReservedUnits,75000);assert.ok(book.book.P04!>0);assert.ok(Object.keys(c.records.games).length>=48);
});
