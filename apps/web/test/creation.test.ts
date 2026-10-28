import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft, validateStep, toggleFocus, setKind, previewOf, toCreationRequest, firstInvalidStep, CREATION_STEPS } from '../src/creation.js';
import type { CreationDraft } from '../src/creation.js';

const hitter = (): CreationDraft => ({ name: '김철수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'L', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] });

test('name: NFC, trimmed, 1..12 graphemes, no control characters', () => {
  assert.deepEqual(validateStep({ ...emptyDraft(), name: '  가나다라마바사아자차카타  ' }, 'NAME'), {});
  assert.ok(validateStep({ ...emptyDraft(), name: '가나다라마바사아자차카타파' }, 'NAME').name);
  assert.ok(validateStep({ ...emptyDraft(), name: '   ' }, 'NAME').name);
  assert.match(validateStep({ ...emptyDraft(), name: 'a\nb' }, 'NAME').name!, /쓸 수 없는 문자/);
  // 12 emoji clusters count as 12, a decomposed Hangul syllable is one grapheme.
  assert.deepEqual(validateStep({ ...emptyDraft(), name: 'ᄀ'.concat('ᅡ') }, 'NAME'), {});
});

test('left-handed throwers cannot take C/2B/3B/SS; pitchers need a pitch form; steps block only their own errors', () => {
  const left = { ...hitter(), position: 'SS', throws: 'L' as const };
  assert.match(validateStep(left, 'HANDS').throws!, /좌투/);
  assert.deepEqual(validateStep({ ...left, position: 'LF' }, 'HANDS'), {});
  const p: CreationDraft = { ...hitter(), kind: 'PITCHER', position: 'SP', archetype: 'VELOCITY', focus: ['VELOCITY', 'STUFF', 'COMMAND', 'STAMINA'] };
  assert.ok(validateStep(p, 'HANDS').pitchForm);
  assert.ok(validateStep({ ...p, pitchForm: 'OVERHAND' }, 'HANDS').secondaryPitch);
  assert.deepEqual(validateStep({ ...p, pitchForm: 'OVERHAND', secondaryPitch: 'P04' }, 'HANDS'), {});
  assert.ok(validateStep({ ...p, pitchForm: 'OVERHAND', secondaryPitch: 'P01' }, 'HANDS').secondaryPitch);
  assert.deepEqual(validateStep(emptyDraft(), 'CONFIRM'), {});
});

test('focus is exactly four distinct abilities of the chosen kind; a fifth pick is refused, kind change resets dependents', () => {
  let d = setKind(emptyDraft(), 'HITTER');
  for (const k of ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING', 'DEFENSE']) d = toggleFocus(d, k);
  assert.deepEqual(d.focus, ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING']);
  assert.deepEqual(validateStep(d, 'FOCUS'), {});
  assert.ok(validateStep({ ...d, focus: ['VELOCITY', 'POWER', 'DISCIPLINE', 'RUNNING'] }, 'FOCUS').focus);
  assert.deepEqual(toggleFocus(d, 'POWER').focus, ['CONTACT', 'DISCIPLINE', 'RUNNING']);
  const reset = setKind({ ...hitter(), pitchForm: 'SIDEARM' }, 'PITCHER');
  assert.deepEqual([reset.position, reset.pitchForm, reset.archetype, reset.focus], [null, null, null, []]);
  assert.equal(setKind(hitter(), 'HITTER').position, 'CF');
});

test('preview exists only with a type and four focus picks and shows the type start values', () => {
  assert.equal(previewOf({ ...hitter(), focus: ['CONTACT'] }), null);
  const view = previewOf(hitter())!;
  assert.equal(view.archetypeLabel, '균형형');
  assert.equal(view.overall, '50.0');
  assert.deepEqual(view.abilities.filter(a => a.focus).map(a => a.key), ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING']);
});

test('request is built only from a complete draft; the same command id travels with it', () => {
  assert.equal(toCreationRequest(emptyDraft(), 'c1'), null);
  assert.equal(firstInvalidStep({ ...hitter(), name: '' }), 'NAME');
  const r = toCreationRequest({ ...hitter(), name: '  김철수 ' }, 'c1')!;
  assert.deepEqual([r.commandId, r.name, r.pitchForm, r.focus.length], ['c1', '김철수', null, 4]);
  assert.equal(CREATION_STEPS.at(-1), 'CONFIRM');
  const pitcher = toCreationRequest({ ...hitter(), kind: 'PITCHER', position: 'SP', pitchForm: 'OVERHAND', secondaryPitch: 'P04', archetype: 'VELOCITY', focus: ['VELOCITY', 'STUFF', 'COMMAND', 'STAMINA'] }, 'pitcher')!;
  assert.equal(pitcher.secondaryPitch, 'P04');
});
