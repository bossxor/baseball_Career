import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { Create } from '../src/screens/Create.js';
import { Flow } from '../src/screens/Flow.js';
import { Career } from '../src/screens/Career.js';
import { emptyDraft, setKind, validateStep } from '../src/creation.js';
import { parseRoute } from '../src/App.js';
import type { FlowView, CareerView } from '../src/model.js';

test('create school step: 9 schools, 2 difficulties (no cheat), pitcher-only second pitch without the fastball, labelled errors', () => {
  const hitter = renderToStaticMarkup(<Create draft={setKind(emptyDraft(), 'HITTER')} step="SCHOOL" errors={validateStep(emptyDraft(), 'SCHOOL')} />);
  assert.equal((hitter.match(/name="school"/g) ?? []).length, 9);
  assert.equal((hitter.match(/name="difficulty"/g) ?? []).length, 2);
  assert.doesNotMatch(hitter, /SECRET|치트|name="secondary-pitch"/);
  assert.match(hitter, /<legend>학교<\/legend>/);
  assert.match(hitter, /id="schoolId-error"[^>]*role="alert">학교를 선택하세요/);
  const pitcher = renderToStaticMarkup(<Create draft={setKind(emptyDraft(), 'PITCHER')} step="SCHOOL" />);
  assert.equal((pitcher.match(/name="secondary-pitch"/g) ?? []).length, 6);
  assert.doesNotMatch(pitcher, /<span>포심<\/span>/, 'fastball is the base pitch, not a second pitch choice');
  assert.match(pitcher, /보조 구종/);
});

const flow: FlowView = {
  title: '졸업 진로 · KBO 지명', notice: null,
  lines: [{ label: '지명', value: '5라운드 두산 베어스' }],
  commands: [
    { id: 'draft-sign', label: '계약하고 입단', type: 'CAREER_KBO_ENTRY_DECIDE', payload: { careerRevision: 3 } },
    { id: 'draft-decline', label: '제안 거절', type: 'CAREER_KBO_ENTRY_DECIDE', payload: { careerRevision: 3 }, confirm: '거절하면 이 지명은 사라집니다. 거절할까요?' },
  ],
};

test('flow screen: only served commands become buttons; busy disables them; a missing view explains itself', () => {
  const html = renderToStaticMarkup(<Flow view={flow} onBack={() => {}} />);
  assert.match(html, /<h1[^>]*>졸업 진로 · KBO 지명<\/h1>/);
  assert.equal((html.match(/<button[^>]*class="btn/g) ?? []).length, 2);
  assert.match(html, /5라운드 두산 베어스/);
  const busy = renderToStaticMarkup(<Flow view={flow} state="saving" />);
  assert.match(busy, /aria-busy="true"/);
  assert.equal((busy.match(/class="btn[^"]*"[^>]*disabled=""/g) ?? []).length, 2);
  assert.match(renderToStaticMarkup(<Flow view={null} onBack={() => {}} />), /진행할 단계를 찾지 못했습니다/);
  assert.match(renderToStaticMarkup(<Flow view={{ ...flow, commands: [] }} />), /선택할 수 있는 행동이 없습니다/);
  assert.match(renderToStaticMarkup(<Flow view={flow} state="conflict" onReload={() => {}} />), /최신 저장 불러오기/);
});

test('flow route parses and career shows the server-provided flow link', () => {
  assert.deepEqual(parseRoute('#/flow/save%201'), { name: 'flow', saveId: 'save 1' });
  const view: CareerView = {
    saveId: 's', protagonist: { name: '가', kindLabel: '타자', positionLabel: '중견수', ageLabel: '18세' },
    stage: { leagueLabel: '고교', teamName: '청해솔고', seasonLabel: '2027 시즌', phaseLabel: '시즌 결산' },
    progress: { mode: 'NEXT_MAJOR_EVENT', alternatives: ['ONE_GAME', 'ONE_WEEK'] }, pendingEventTitle: null, recentRecords: [],
    nextActions: [{ id: 'open:FLOW', label: '다음 단계 진행', kind: 'OPEN_SCREEN', primary: true }],
  };
  assert.match(renderToStaticMarkup(<Career view={view} />), /다음 단계 진행/);
});
