import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { SeasonReview } from '../src/screens/SeasonReview.js';
import { Flow } from '../src/screens/Flow.js';

test('season review displays only supplied official values', () => {
  const html = renderToStaticMarkup(<SeasonReview review={{
    season: '2030', sections: [{ title: 'KBO 기록', lines: [{ label: '홈런', value: '12' }] }],
  }} />);
  assert.match(html, /2030 시즌 결과/);
  assert.match(html, /홈런/);
  assert.match(html, /12/);
  assert.doesNotMatch(html, /잠재력|타구속도|연봉/);
});

test('review leaves existing Flow confirmation and signing commands intact', () => {
  const html = renderToStaticMarkup(<Flow view={{title:'시즌',lines:[],notice:null,seasonReview:{season:'2030',sections:[]},commands:[
    {id:'a',label:'계약',type:'A',payload:{careerRevision:2},sign:{name:'선수'}},
    {id:'b',label:'마감',type:'B',payload:{careerRevision:2},confirm:'마감할까요?'}
  ]}} />);
  assert.match(html, /2030 시즌 결과/);
  assert.match(html, /계약/);
  assert.match(html, /마감/);
});
