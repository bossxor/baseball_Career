import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { Flow } from '../src/screens/Flow.js';

test('retirement summary displays zero-game career and preserves the farewell action', () => {
 const html = renderToStaticMarkup(<Flow view={{
  title:'은퇴', lines:[], notice:null,
  retirementSummary:{name:'선수',details:[{label:'은퇴',value:'2030 시즌 · 30세'}],sections:[
   {title:'KBO 정규시즌',lines:[{label:'경기',value:'0'}]},
  ]},
  commands:[{id:'farewell',label:'기록 보관 확인',type:'CAREER_PRO_RETIRE_OPEN_ARCHIVE',payload:{careerRevision:3,eventKey:'event',eventVersion:1}}],
 }} />);
 assert.match(html,/선수의 은퇴 기록/);
 assert.match(html,/KBO 정규시즌/);
 assert.match(html,/>0</);
 assert.match(html,/기록 보관 확인/);
 assert.doesNotMatch(html,/잠재력|커리어 점수/);
});
