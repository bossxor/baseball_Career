import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { SCREEN_STATES } from '../src/screen-states.js';
import type { ScreenId } from '../src/screen-states.js';
import { Home } from '../src/screens/Home.js';
import { Create } from '../src/screens/Create.js';
import { Career } from '../src/screens/Career.js';
import { emptyDraft, validateStep } from '../src/creation.js';
import { createFixtureApi } from '../src/fixtures.js';
import { parseRoute } from '../src/App.js';
import type { CareerView, HomeData } from '../src/model.js';

const catalog = JSON.parse(readFileSync(new URL('../../../docs/design/screen-state-catalog.json', import.meta.url), 'utf8')) as { screens: Record<string, string>[] };

test('state texts equal the design catalog (no drift)', () => {
  for (const [id, texts] of Object.entries(SCREEN_STATES)) {
    const entry = catalog.screens.find(s => s.id === id)!;
    for (const [state, text] of Object.entries(texts)) assert.equal(entry[state], text, `${id}.${state}`);
  }
  assert.equal(Object.keys(SCREEN_STATES).length, 12);
  assert.ok((Object.keys(SCREEN_STATES) as ScreenId[]).every(id => catalog.screens.some(s => s.id === id)));
});

const saves: HomeData = { saves: [{ saveId: 'a', mode: 'CAREER', title: '김철수', seasonLabel: '고교 3학년', phaseLabel: '3주차', savedAtLabel: '방금', revision: 2 }, { saveId: 'b', mode: 'CAREER', title: '이영희', seasonLabel: 'KBO', phaseLabel: '개막', savedAtLabel: '어제', revision: 9 }], archiveCount: 2, resume: { saveId: 'a', label: '3주차' } };

test('S01: empty start, resume label kept while loading, internal states never shown, errors announced', () => {
  const empty = renderToStaticMarkup(<Home data={{ saves: [], archiveCount: 0, resume: null }} onNew={() => undefined} />);
  assert.match(empty, /최근 세이브가 없습니다/);
  assert.match(empty, /새 커리어/);
  assert.doesNotMatch(empty, /이어하기/);
  const loading = renderToStaticMarkup(<Home data={saves} state="loading" />);
  assert.match(loading, /aria-busy="true"[^>]*data-screen="S01"/);
  assert.match(loading, /<button[^>]*disabled=""[^>]*>이어하기<\/button>/);
  assert.doesNotMatch(loading, /내부 결과 확인|aria-busy만 적용/);
  const failed = renderToStaticMarkup(<Home data={saves} state="error" />);
  assert.match(failed, /role="alert"[^>]*>진행을 확인하지 못했습니다/);
  assert.doesNotMatch(renderToStaticMarkup(<Home data={saves} />), /다른 게임 선택<\/button><ul/);
  assert.match(renderToStaticMarkup(<Home data={saves} showSaves />), /저장된 게임/);
  assert.doesNotMatch(renderToStaticMarkup(<Home data={saves} />), /새 구단|설정/);
});

test('S02: one step at a time with its error next to the input, stepper marks the current step, preview empty text', () => {
  const draft = { ...emptyDraft(), name: '' };
  const html = renderToStaticMarkup(<Create draft={draft} step="NAME" errors={validateStep(draft, 'NAME')} />);
  assert.match(html, /<ol class="stepper" aria-label="생성 단계"><li aria-current="step" class="now">이름<\/li>/);
  assert.match(html, /<input id="player-name"[^>]*aria-invalid="true"[^>]*aria-describedby="name-help name-error"/);
  assert.match(html, /<p id="name-error" class="field-error" role="alert">이름은 공백을 뺀 1~12글자로 입력하세요\./);
  assert.match(html, /유형과 육성4개를 선택하면 생성 미리보기를 볼 수 있습니다/);
  assert.doesNotMatch(html, /type="radio"/);
  const hands = renderToStaticMarkup(<Create draft={{ ...emptyDraft(), kind: 'PITCHER', position: 'SP' }} step="HANDS" />);
  assert.match(hands, /투구폼/);
  const busy = renderToStaticMarkup(<Create draft={emptyDraft()} step="NAME" state="saving" />);
  assert.match(busy, /같은 선택을 다시 실행하지 않고 결과를 확인합니다/);
  assert.match(busy, /<button[^>]*type="submit"[^>]*disabled=""/);
});

const view = (patch: Partial<CareerView> = {}): CareerView => ({
  saveId: 'a', protagonist: { name: '김철수', kindLabel: '타자', positionLabel: '중견수', ageLabel: '18세' }, stage: { leagueLabel: '고교', teamName: '가상고', seasonLabel: '3학년', phaseLabel: '1주차' },
  progress: { mode: 'NEXT_MAJOR_EVENT', alternatives: ['ONE_GAME', 'ONE_WEEK'] }, pendingEventTitle: null, recentRecords: [],
  nextActions: [{ id: 'advance', label: '진행', kind: 'ADVANCE', primary: true }, { id: 'plan', label: '현재 계획', kind: 'PLAN', disabledReason: '부상 중에는 바꿀 수 없습니다.' }], ...patch,
});

test('S03: buttons come only from nextActions, default progress mode, disabled reason is linked, pending event locks progress', () => {
  const html = renderToStaticMarkup(<Career view={view()} />);
  assert.match(html, />다음 주요 사건까지<\/span>/);
  assert.match(html, /checked=""[^>]*\/><span>다음 주요 사건까지/);
  assert.equal((html.match(/<button/g) ?? []).length, 2);
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-describedby="why-plan"[^>]*>현재 계획<\/button>/);
  assert.match(html, /<p id="why-plan" class="muted">부상 중에는 바꿀 수 없습니다\./);
  assert.match(html, /아직 출장 기록이 없습니다/);
  const pending = renderToStaticMarkup(<Career view={view({ pendingEventTitle: '선택이 필요한 사건', nextActions: [{ id: 'resolve-event', label: '사건 확인', kind: 'EVENT', primary: true }] })} />);
  assert.match(pending, /처리할 사건이 있습니다: 선택이 필요한 사건/);
  assert.equal((pending.match(/<input[^>]*disabled=""[^>]*name="progress-mode"/g) ?? []).length, 3);
  assert.doesNotMatch(pending, />진행<\/button>/);
  assert.match(renderToStaticMarkup(<Career view={null} />), /아직 출장 기록이 없습니다/);
});

test('fixture api: a retried creation or action with the same command id changes nothing twice', async () => {
  const api = createFixtureApi();
  const request = { commandId: 'create-1', name: '김철수', kind: 'HITTER' as const, position: 'CF', throws: 'R' as const, bats: 'L' as const, pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] };
  const a = await api.create(request), b = await api.create(request);
  assert.equal(a.saveId, b.saveId);
  assert.equal((await api.home()).saves.length, 1);
  const first = await api.act(a.saveId, 'advance', 'ONE_WEEK', 'act-1'), again = await api.act(a.saveId, 'advance', 'ONE_WEEK', 'act-1');
  assert.deepEqual(again, first);
  const next = await api.act(a.saveId, 'advance', 'ONE_GAME', 'act-2');
  assert.notDeepEqual(next.recentRecords, first.recentRecords);
  await assert.rejects(api.career('missing'), /NOT_FOUND/);
});

test('routes: unknown or incomplete addresses fall back to home', () => {
  assert.deepEqual(parseRoute(''), { name: 'home' });
  assert.deepEqual(parseRoute('#/create'), { name: 'create' });
  assert.deepEqual(parseRoute('#/career/fixture-1'), { name: 'career', saveId: 'fixture-1' });
  assert.deepEqual(parseRoute('#/career'), { name: 'home' });
  assert.deepEqual(parseRoute('#/nope/x'), { name: 'home' });
});
