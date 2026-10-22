import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSangmuCohort,KBO_SANGMU_INTAKE} from '../src/kbo-sangmu.js';
import {enteredKboCareer} from './fixtures.js';

test('Sangmu yearly selection: 10 hitters and 10 pitchers, healthy 19..27, deterministic, no invented players',()=>{
 const c=enteredKboCareer('HITTER'),input={world:c.world,records:c.records,health:c.health,seasonKey:c.world.seasonKey,excluded:new Set([c.protagonistKey])};
 const s=selectSangmuCohort(input);
 assert.equal(s.selected.filter(a=>a.kind==='HITTER').length,10);assert.equal(s.selected.filter(a=>a.kind==='PITCHER').length,10);
 assert.deepEqual(s.vacancies,{hitters:0,pitchers:0});assert.equal(new Set(s.selected.map(a=>a.playerKey)).size,20);
 assert.ok(s.selected.every(a=>a.age>=19 && a.age<=27 && a.playerKey!==c.protagonistKey));
 for(const p of ['C','1B','2B','3B','SS','LF','CF','RF'])assert.ok(s.selected.some(a=>a.position===p),p);assert.ok(s.selected.filter(a=>a.position==='SP').length>=3);
 assert.deepEqual(selectSangmuCohort(input),s);
 // Injured and already-serving players are skipped; a tiny pool leaves vacancies rather than inventing players.
 const first=s.selected[0]!.playerKey,second=s.selected[1]!.playerKey;
 const health={...c.health,injuries:{...c.health.injuries,[first]:{seasonKey:c.world.seasonKey} as never}};
 const t=selectSangmuCohort({...input,health,serving:new Set([second])});
 assert.ok(!t.selected.some(a=>a.playerKey===first || a.playerKey===second));
 const old=structuredClone(c.world);for(const key of Object.keys(old.players))if(key!==c.protagonistKey)old.players[key]={...old.players[key]!,age:30};
 const keep=Object.keys(old.players).slice(0,6);for(const k of keep)old.players[k]={...old.players[k]!,age:22};
 const tiny=selectSangmuCohort({...input,world:old});
 assert.ok(tiny.selected.length<=tiny.applicants && tiny.selected.length<=keep.length);
 assert.equal(tiny.vacancies.hitters+tiny.vacancies.pitchers,KBO_SANGMU_INTAKE.hitters+KBO_SANGMU_INTAKE.pitchers-tiny.selected.length);
});

test('no club loses more than the per-club cap in one intake',()=>{
 const c=enteredKboCareer('HITTER'),s=selectSangmuCohort({world:c.world,records:c.records,health:c.health,seasonKey:c.world.seasonKey});
 const by=(kind:string,club:string)=>s.selected.filter(a=>a.kind===kind&&a.clubId===club).length;
 for(const club of c.world.clubs){assert.ok(by('HITTER',club.id)<=1);assert.ok(by('PITCHER',club.id)<=2);}
});
