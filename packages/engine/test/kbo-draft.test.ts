import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createKboRosterWorld} from '../src/kbo-world.js';
import {prepareKboDraft,resolveKboDraft,decideKboDraft,kboDraftView,assertKboDraft} from '../src/kbo-draft.js';
import {createCareerPlayer} from '../src/player.js';
import {createWorldStream} from '../src/rng.js';
import {canonicalJson} from '../src/game.js';
const world=()=>createKboRosterWorld({worldKey:'draft-world',seasonKey:'2030',seed:'career-draft-test',difficulty:'GROWTH'});
const player=()=>createCareerPlayer({simulationKey:'own',name:'신인',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'GROWTH'},createWorldStream('test','draft','protagonist')).player;
const input=(baseScore=80)=>({assessmentKey:'draft-2030-own',player:player(),baseScore,preferredClubId:null});
test('34: actual-roster preview is read-only, excludes hidden state and matches one persisted draw after JSON resume',()=>{
 const w=world(),p=prepareKboDraft(w,input(45)),before=canonicalJson({w,p}),view=kboDraftView(w,p);
 assert.equal(view.preview.selectionProbability,.5);assert.equal(view.preview.roundProbabilities[9]!.probability,.4);assert.equal(view.offer,null);
 for(const hidden of ['potential','seed','rng','sourceBasis','player'])assert.equal(Object.hasOwn(view,hidden),false);
 assert.equal(canonicalJson({w,p}),before);const r=resolveKboDraft(w,p,1),restored=resolveKboDraft(JSON.parse(JSON.stringify(w)),JSON.parse(JSON.stringify(p)),1);
 assert.deepEqual(r,restored);assert.equal(r.rng.draws,p.rngStart.draws+1);assert.deepEqual(resolveKboDraft(w,r,2),r);assert.throws(()=>resolveKboDraft(w,r,1),/VERSION/);
});
test('08/U: position demand beats preferred club, preference resolves equal need/strength only',()=>{
 const w=world();const set=(id:string,value:number)=>{for(const k of w.clubs.find(c=>c.id===id)!.roster){const p=w.players[k]!;if(p.position==='CF'){p.abilities=Object.fromEntries(abilityKeys(p.kind).map(a=>[a,value*10_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};}}};
 for(const c of w.clubs)set(c.id,70);set('LG',60);
 const p=prepareKboDraft(w,{...input(),preferredClubId:'HH'});assert.equal(resolveKboDraft(w,p,1).result!.clubId,'LG');
 for(const c of w.clubs)set(c.id,60);const tie=prepareKboDraft(w,{...input(),preferredClubId:'HH'});assert.equal(resolveKboDraft(w,tie,1).result!.clubId,'HH');
});
test('34/44: full60-player rosters produce0%/no draw/no offer; exhausted clubs never chosen',()=>{
 const w=world();for(const c of w.clubs){const template=w.players[c.roster[0]!]!;for(let i=0;i<10;i++){const key=JSON.stringify(['extra',c.id,i]);w.players[key]={...structuredClone(template),simulationKey:key};w.contracts[key]={contractKey:key,playerKey:key,clubId:c.id,seasonKey:w.seasonKey,years:1,annualSalaryWon:30_000_000,signingBonusWon:0,status:'ACTIVE'};c.roster.push(key);c.reservedSalaryWon+=30_000_000;}}
 const p=prepareKboDraft(w,input()),v=kboDraftView(w,p),r=resolveKboDraft(w,p,1);assert.equal(v.preview.selectionProbability,0);assert.equal(v.eligible,false);assert.equal(v.reasonCode,'NO_ELIGIBLE_CLUB_SLOT');assert.deepEqual(r.rng,p.rngStart);assert.equal(r.result!.clubId,null);assert.equal(kboDraftView(w,r).offer,null);assert.throws(()=>decideKboDraft(w,r,2,'SIGN'),/DECISION/);
});
test('signed rookie commits one1-year KRW minimum contract/right/roster and salary reservation, never a first-team promise',()=>{
 const w=world(),p=resolveKboDraft(w,prepareKboDraft(w,input()),1),before=canonicalJson({w,p}),signed=decideKboDraft(w,p,2,'SIGN'),s=signed.signing!;
 assert.equal(s.contract.years,1);assert.equal(s.contract.annualSalaryWon,30_000_000);assert.equal(s.contract.signingBonusWon,0);assert.equal(s.contract.currency,'KRW');assert.equal(s.rosterAfter.length,51);assert.equal(s.rosterAfter.filter(k=>k==='own').length,1);assert.equal(s.reservedSalaryAfterWon-s.reservedSalaryBeforeWon,30_000_000);assert.equal(s.registration.firstTeam,false);assert.equal(s.registration.status,'PENDING_SEASON_ACTIVATION');assert.equal(s.rights.holderOrgId,p.result!.clubId);assert.equal(canonicalJson({w,p}),before);assertKboDraft(JSON.parse(JSON.stringify(w)),JSON.parse(JSON.stringify(signed)));assert.throws(()=>decideKboDraft(w,signed,3,'SIGN'),/DECISION/);
 const rejected=decideKboDraft(w,p,2,'DECLINE');assert.equal(rejected.signing,null);assert.equal(kboDraftView(w,rejected).offer,null);assert.throws(()=>decideKboDraft(w,rejected,3,'SIGN'),/DECISION/);
});
test('stale roster/payroll/assessment/RNG/result/signing reject without partial reservation or reroll',()=>{
 const w=world(),p=resolveKboDraft(w,prepareKboDraft(w,input()),1),before=canonicalJson({w,p});
 for(const alter of [(q:typeof p)=>{q.input.baseScore--;},(q:typeof p)=>{q.result!.round=10;},(q:typeof p)=>{q.rng.draws++;},(q:typeof p)=>{q.rngStart.increment='0';}]){const q=structuredClone(p);alter(q);assert.throws(()=>decideKboDraft(w,q,2,'SIGN'));}
 const changed=structuredClone(w);changed.clubs[0]!.roster.pop();assert.throws(()=>decideKboDraft(changed,p,2,'SIGN'));
 const badMoney=structuredClone(w);badMoney.clubs[0]!.reservedSalaryWon--;assert.throws(()=>kboDraftView(badMoney,p));
 const signed=decideKboDraft(w,p,2,'SIGN');signed.signing!.reservedSalaryAfterWon--;assert.throws(()=>assertKboDraft(w,signed));assert.equal(canonicalJson({w,p}),before);
});

test('44: next-season90% guarantee cap blocks a rookie before preview and produces no fake offer',()=>{
 const w=world();for(const c of w.clubs){for(const key of c.roster){w.contracts[key]!.years=1;w.contracts[key]!.annualSalaryWon=216_000_000;}c.reservedSalaryWon=10_800_000_000;}
 const p=prepareKboDraft(w,input()),v=kboDraftView(w,p);assert.equal(v.eligible,false);assert.equal(v.reasonCode,'NO_ELIGIBLE_CLUB_SLOT');const r=resolveKboDraft(w,p,1);assert.deepEqual(r.rng,p.rngStart);assert.equal(r.result!.clubId,null);
});
