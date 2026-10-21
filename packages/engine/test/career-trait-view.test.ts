import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {careerTraitView} from '../src/career-trait-view.js';
import {createCareerTraitLedger} from '../src/high-school-traits.js';
import {canonicalJson} from '../src/game.js';

const career=(kind:'HITTER'|'PITCHER')=>createHighSchoolCareer(createHighSchoolWorld({worldKey:'view-world',seasonKey:'2032',seed:'view-fixture',schoolId:'H01',startDay:31,...(kind==='PITCHER'?{secondaryPitch:'P03' as const}:{}),
 player:kind==='HITTER'
  ?{simulationKey:'me',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}
  :{simulationKey:'me',name:'내투수',kind:'PITCHER',position:'SP',throws:'R',bats:'R',pitchForm:'OVERHAND',archetype:'BALANCED',focus:['VELOCITY','STUFF','COMMAND','STAMINA'],difficulty:'GROWTH'}}),'GROWTH');

test('fresh hitter sees six exact-progress general traits and two name/hint-only hidden cards',()=>{
 const state=career('HITTER'),before=canonicalJson(state),view=careerTraitView(state);
 assert.deepEqual(view.general.map(g=>g.traitId),['T01','T02','T03','T04','T05','T06']);
 assert.ok(view.general.every(g=>!g.unlocked && g.progress.length>0 && g.progress.every(p=>p.current<=p.target)));
 assert.deepEqual(view.general.find(g=>g.traitId==='T02')!.progress,[{label:'이번 시즌 정규 볼넷',current:0,target:30}]);
 assert.deepEqual(view.hidden,[{traitId:'T13',hidden:true,name:'끝내기 본능',hint:'마지막 순간에 배트가 먼저 안다.'},{traitId:'T14',hidden:true,name:'숙적 킬러',hint:'누군가에게만은 지고 싶지 않다.'}]);
 assert.equal(view.hiddenCount,2);
 assert.equal(canonicalJson(state),before);
 assert.doesNotMatch(JSON.stringify(view),/potential|seed|rng/i);
});

test('pitcher sees pitcher traits only; unlocked hidden trait reveals condition, effects and evidence',()=>{
 const base=career('PITCHER'),traits=createCareerTraitLedger();
 traits.owned['me']={unlocked:['T07','T16'],qualifiedRivalPitcherKeys:[]};
 traits.unlocks=[{playerKey:'me',traitId:'T07',worldDay:80,recordRevision:9,seasonKey:'2032',leagueKey:'HS'},{playerKey:'me',traitId:'T16',worldDay:90,recordRevision:10,seasonKey:'2036',leagueKey:'COLLEGE'}];
 const view=careerTraitView({...base,traits} as HighSchoolCareer);
 assert.deepEqual(view.general.map(g=>g.traitId),['T07','T08','T09','T10','T11','T12']);
 assert.deepEqual(view.general.find(g=>g.traitId==='T07'),{traitId:'T07',name:'탈삼진 본능',effects:'K +.03 / BB +.01',unlocked:true,progress:[]});
 const t16=view.hidden.find(h=>h.traitId==='T16')!;
 assert.deepEqual(t16,{traitId:'T16',hidden:true,name:'꾸준한 에이스',hint:'해마다 같은 자리에 서 있다.',unlocked:true,condition:'연속 5시즌 선발 규정이닝',effects:{OUT:.04,BB:-.03},evidenceRefs:['2036:90']});
 assert.deepEqual(view.hidden.find(h=>h.traitId==='T15'),{traitId:'T15',hidden:true,name:'완봉의 맛',hint:'마지막 아웃까지 마운드를 내주지 않는다.'});
});
