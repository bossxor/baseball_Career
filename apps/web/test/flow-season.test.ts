import test from 'node:test';
import assert from 'node:assert/strict';
import { runFlowCommands } from '../src/flow-season.js';
import type { FlowCommand, FlowView } from '../src/model.js';

function seasonCommand(careerRevision: number, type = 'CAREER_KBO_PLAY_ADVANCE_SPAN'): FlowCommand {
  return { id: 'adv-season', label: '이번 시즌 끝까지', type,
    payload: { careerRevision, ...(type === 'CAREER_COLLEGE_ADVANCE' ? { mode: 'SEASON' } : { span: 'SEASON' }) } };
}

function budget(next: FlowCommand, canContinueSeason = true): FlowView {
  return { title: '정규시즌', lines: [], notice: null, stop: 'BUDGET', commands: [next], canContinueSeason };
}

test('one season click sends fresh server commands while BUDGET and stops at a decision or season end', async () => {
  for (const type of ['CAREER_SCHOOL_ADVANCE_SPAN', 'CAREER_KBO_PLAY_ADVANCE_SPAN', 'CAREER_US_PLAY_ADVANCE_SPAN', 'CAREER_COLLEGE_ADVANCE']) {
    const [start, second, third] = [seasonCommand(1, type), seasonCommand(3, type), seasonCommand(8, type)];
    const stop = type === 'CAREER_US_PLAY_ADVANCE_SPAN' ? 'SEASON_END' : 'EVENT';
    const views = [budget(second), budget(third), { ...budget(seasonCommand(9, type)), stop }];
    const sent: FlowCommand[] = [], published: (FlowView | null)[] = [];
    await runFlowCommands(start, async command => {
      sent.push(command);
      const view = views[sent.length - 1];
      assert.ok(view, 'no commands after the terminal screen');
      return view;
    }, view => published.push(view), () => true);
    assert.deepEqual(sent, [start, second, third]);
    assert.deepEqual(published, views);
  }
});

test('flow never auto-sends an unverified, stale, different, confirmation or month command', async () => {
  const first = seasonCommand(1);
  const next = seasonCommand(2);
  const cases: [FlowCommand, FlowView][] = [
    [first, budget(next, false)],
    [first, budget(first)],
    [first, budget(seasonCommand(2, 'CAREER_US_PLAY_ADVANCE_SPAN'))],
    [first, budget({ ...next, confirm: '확인' })],
    [first, budget({ ...next, sign: { name: '선수' } })],
    [first, { ...budget(next), commands: [] }],
    [{ ...first, id: 'adv-month', payload: { careerRevision: 1, span: 'MONTH' } }, budget(next)],
    [{ ...first, id: 'training' }, budget(next)],
  ];
  for (const [start, response] of cases) {
    let sends = 0;
    await runFlowCommands(start, async () => {
      assert.equal(++sends, 1);
      return response;
    }, () => {}, () => true);
    assert.equal(sends, 1);
  }
});

test('leaving the flow in flight drops the old screen response and stops the continuation', async () => {
  let active = true, sends = 0, publications = 0;
  await runFlowCommands(seasonCommand(1), async () => {
    sends++;
    active = false;
    return budget(seasonCommand(2));
  }, () => { publications++; }, () => active);
  assert.equal(sends, 1);
  assert.equal(publications, 0);
});
