import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import { applyEngineCommand, type SaveState } from '../../api/src/engine-command.js';
import { careerFlowScreen } from '../../api/src/career-flow-screen.js';
import { schoolCareerHome } from '../../api/src/career-school-shell.js';
import { spanDeadline } from '../../api/src/span-budget.js';

function opening(): engine.HighSchoolCareer {
  const initial = engine.createHighSchoolCareer(engine.createHighSchoolWorld({
    worldKey: 'local-cta', seasonKey: '2032', seed: 'local-cta', schoolId: 'H01', startDay: 31,
    player: { simulationKey: 'own', name: '기기선수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'DEFENSE'], difficulty: 'GROWTH' },
  }), 'GROWTH');
  let c = engine.confirmCareerPlayer(initial, initial.revision);
  c = engine.resolveCareerFocusEvent(c, c.revision, { eventKey: c.events[0]!.eventKey, eventVersion: 1, command: 'KEEP_FOCUS' });
  return engine.confirmCareerPreseason(c, c.revision);
}

// The Android app runs the same server modules inside a worker where `process` does not exist.
function withoutProcess<T>(work: () => T): T {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'process')!;
  Object.defineProperty(globalThis, 'process', { value: undefined, configurable: true, writable: true });
  try { return work(); } finally { Object.defineProperty(globalThis, 'process', saved); }
}

test('device path: the home leads with the season CTA and the worker budget is a short fixed cap', () => {
  const state = { schemaVersion: 1, career: opening() } as SaveState;
  const home = schoolCareerHome('local-x', state);
  assert.equal(home.nextActions[0]!.id, 'open:FLOW');
  assert.match(home.nextActions[0]!.label, /이번 시즌 끝까지/);
  assert.equal(careerFlowScreen(state).commands[0]!.id, 'adv-season');
  const ms = withoutProcess(() => spanDeadline() - Date.now());
  assert.ok(ms > 0 && ms <= 1_000, `worker cap ${ms}ms`);
});

test('device path: a budget stop is reported and the same save continues to a real stop reason', () => {
  let state = { schemaVersion: 1, career: opening() } as SaveState;
  const stops: string[] = [];
  withoutProcess(() => {
    for (let i = 0; i < 400; i++) {
      const flow = careerFlowScreen(state), cta = flow.commands.find(x => x.id === 'adv-season');
      if (!cta) break;
      const before = (state.career as engine.HighSchoolCareer).revision;
      state = applyEngineCommand(state, { commandId: 'local-' + i, expectedRevision: i, type: cta.type, payload: cta.payload }).nextState;
      const after = careerFlowScreen(state);
      assert.ok((state.career as engine.HighSchoolCareer).revision > before, 'each press makes progress');
      stops.push(after.stop ?? '');
      if (after.stop === 'BUDGET') assert.match(after.commands.find(x => x.id === 'adv-season')!.label, /이어서/);
      else break;
    }
  });
  assert.ok(stops.includes('BUDGET'), 'the short cap stopped at least once: ' + stops.join(','));
  assert.ok(['EVENT', 'SEASON_END'].includes(stops.at(-1)!), stops.join(','));
});
