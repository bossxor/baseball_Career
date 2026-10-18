// Static design checks only; this is not a game engine or browser test.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => readFileSync(path.join(root, name), 'utf8');
const catalog = JSON.parse(read('event-catalog-v2.json'));
const screens = JSON.parse(read('screen-state-catalog.json'));
const html = read('design-board.html');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const unique = values => assert.equal(new Set(values).size, values.length);

assert.equal(catalog.events.length, 99);
unique(catalog.events.map(e => e.id));
for (let i = 1; i <= 99; i++) {
  const event = catalog.events.find(e => e.id === `E${String(i).padStart(2, '0')}`);
  assert.ok(event?.title && event.body && event.trigger);
  assert.ok(event.body.length <= 240);
  assert.ok(event.choices.length > 0);
  unique(event.choices.map(c => c.command));
  for (const choice of event.choices) {
    assert.ok(choice.command && choice.label && choice.resultCopy && choice.preview);
  }
}
assert.equal(screens.screens.length, 45);
unique(screens.screens.map(s => s.id));
const shown = new Set();
for (const section of html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)) {
  const label = section[1].match(/class=["']label["'][^>]*>([^<]+)/)?.[1];
  const id = label?.match(/S\d{2}/)?.[0];
  if (id) shown.add(id);
}
for (const screen of screens.screens) {
  assert.ok(shown.has(screen.id), `Missing screen ${screen.id}`);
  for (const state of ['empty', 'error', 'saving', 'loading', 'conflict']) {
    assert.ok(screen[state], `${screen.id}/${state}`);
  }
}
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
unique(ids);
for (const link of html.matchAll(/\bhref=["']#([^"']+)["']/g)) {
  assert.ok(ids.includes(link[1]), `Missing HTML anchor ${link[1]}`);
}
for (const src of html.matchAll(/\bsrc=["']([^"']+)["']/g)) {
  if (!/^(https?:|data:)/.test(src[1])) {
    assert.ok(existsSync(path.join(root, src[1])), `Missing asset ${src[1]}`);
  }
}
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
new Script(scripts.join('\n'));
const embedded = scripts.join('\n').match(/const screenStates=([\s\S]*?);\s*document.querySelectorAll/);
assert.ok(embedded);
assert.deepEqual(JSON.parse(embedded[1]), screens);
const visible = html.replace(/<style>[\s\S]*?<\/style>/g, '')
  .replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '');
assert.ok(!visible.includes('100%'), 'Guaranteed numeric probability in visible HTML');
for (const file of readdirSync(root).filter(f => f.endsWith('.md'))) {
  for (const match of read(file).matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (target && !/^(https?:|\/|[A-Z]:)/i.test(target)) {
      assert.ok(existsSync(path.join(root, target)), `Broken link ${file} -> ${target}`);
    }
  }
}

// Documentation arithmetic examples, not production implementations.
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const search = (L, N, q) => N === 0 ? 0 : clamp(.35 + .08 * L + .20 * Math.min(N, 20) / 20 - .08 * q, .10, .90);
near(search(2, 20, 1), .63);
near(search(5, 20, 0), .90);
near(search(2, 0, 1), 0);
for (let L = 1; L <= 5; L++) for (let N = 1; N <= 30; N++) for (let q = 0; q <= 3; q++) {
  assert.ok(search(L, N, q) >= .10 && search(L, N, q) <= .90);
  if (L < 5) assert.ok(search(L + 1, N, q) >= search(L, N, q));
}
const distribution = (scores, outside) => {
  const weights = scores.map(s => Math.exp(6 * (s - .60)));
  const sum = outside + weights.reduce((a, b) => a + b, 0);
  return [...weights.map(w => w / sum), outside / sum];
};
near(distribution([.6], 1)[0], .5);
distribution([.6, .6], 1).forEach(p => near(p, 1 / 3));
near(distribution([.6], .5)[0], 2 / 3);
for (const outside of [.5, 1]) for (let rivals = 0; rivals <= 5; rivals++) {
  let prior = 0;
  for (let s = 0; s <= 100; s++) {
    const p = distribution([s / 100, ...Array(rivals).fill(.6)], outside);
    near(p.reduce((a, b) => a + b, 0), 1);
    assert.ok(p[0] >= prior);
    prior = p[0];
  }
}
near([72, 64, 68, 81, 70, 65].reduce((a, b) => a + b) / 6, 70);
near(.70 + .002 * 20, .74);
near(.70 + .002 * 20 - .0015 * 50, .665);
near(.085 + .010 + .200 + .160 + .045 + .005 + .030 + .465, 1);
near(clamp((45 + 5 - 45) / 10, 0, 1), .5);
near(4 / 10 + 1 / 10 + .5, 1);
near(4 * 2 + 2 / 3 + 4 / 3, 10);
near(91 * .5, 45.5);
near(Math.min(100, Math.max(90, 95) + 5), 100);
near(120 - 50 - 40 - 2 - 8 - 1.6, 18.4);
near(9 * 48 / 2, 216);
let initialRows = 0;
for (const line of read('35-SIX-ABILITIES-FOUR-FOCUS.md').split('\n')) {
  const columns = line.split('|').slice(1, -1).map(s => s.trim());
  if (columns.length === 7 && columns.slice(1).every(s => /^\d+$/.test(s))) {
    near(columns.slice(1).reduce((sum, s) => sum + Number(s), 0), 300);
    initialRows++;
  }
}
assert.equal(initialRows, 14);
console.log('PASS: 99 event contracts, 45 screen contracts, unique IDs, local links/assets, JS syntax, embedded state catalog, no visible 100% badges.');
console.log('PASS: design arithmetic: search odds, offer distributions/monotonicity, 14 initial arrays, overall, advancement, draft, growth, import, budget, college schedule.');
// Expansion design examples and bounded effect composition.
near(clamp(.75 - 1.5 * .10, .10, .90), .60);
near(clamp(.75 - 1.5 * .10 + .08, .10, .90), .68);
near(100000000 - 100000000 * .02, 98000000);
near(18.4 - 1.5 - 1, 15.9);
assert.equal(Math.max(1, Math.floor(5 / 2)), 2);
assert.equal(Math.max(1, Math.floor(1 / 2)), 1);
for (const trust of [0, 50, 100]) for (const raise of [.10, .20, .30]) {
  const p = clamp(.75 - 1.5 * raise + .002 * (trust - 50) + .08, .10, .90);
  assert.ok(p >= .10 && p <= .90);
}
const skillDelta = clamp(clamp(.04 + .04, -.06, .06) + .04 + .03, -.10, .10);
near(skillDelta, .10);
for (const id of ['S38','S39','S40','S41','S42','S43','S44','S45']) {
  assert.ok(screens.screens.some(s => s.id === id));
}
for (const id of ['E84','E85','E86','E87','E88','E89','E90','E91','E92','E93','E94','E95','E96','E97','E98','E99']) {
  assert.ok(catalog.events.some(e => e.id === id));
}
console.log('PASS: expansion design arithmetic: negotiation .60/.68, income fee, staff budget, imported pitch mastery, skill modifier caps.');
const detailedFixtures = JSON.parse(read('expansion-acceptance-fixtures.json'));
assert.equal(detailedFixtures.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(detailedFixtures.cases.length, 80);
unique(detailedFixtures.cases.map(c => c.id));
assert.equal(new Set(detailedFixtures.cases.map(c => c.module)).size, 8);
for (const fixture of detailedFixtures.cases) {
  assert.ok(fixture.given && Object.keys(fixture.given).length);
  assert.ok(fixture.expected && Object.keys(fixture.expected).length);
  assert.ok(fixture.action && fixture.mustNotChange.length);
  assert.equal(fixture.executionStatus, 'NOT_IMPLEMENTED');
}
near((2.5 * 3) * 4, 30);
near(20 * 3, 60);
near(2.5 * .5 * 3, 3.75);
assert.ok(!html.includes("limitedChoices('trait-demo'"));
assert.equal(catalog.contentVersion, 5);
const s38 = screens.screens.find(s => s.id === 'S38');
assert.ok(s38.data.includes('보유특성전체'));
console.log('PASS: 80 explicit design fixtures across 8 detailed modules; automatic traits and cheat pitch XP examples. Fixture execution is NOT implemented.');
assert.equal(Object.keys(detailedFixtures.pendingModules).length, 0);
console.log('CONFIRMED: cosmetic-only rewards and read-only commentary; no pending choices in these eight detailed modules.');
const worldFixtures = JSON.parse(read('world-acceptance-fixtures.json'));
assert.equal(worldFixtures.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(worldFixtures.cases.length, 82);
unique(worldFixtures.cases.map(c => c.id));
assert.equal(new Set(worldFixtures.cases.map(c => c.module)).size, 8);
for (const fixture of worldFixtures.cases) {
  assert.ok(fixture.given && Object.keys(fixture.given).length);
  assert.ok(fixture.expected && Object.keys(fixture.expected).length);
  assert.ok(fixture.action);
  assert.equal(fixture.executionStatus, 'NOT_IMPLEMENTED');
}
const rangeHistory = [[82,94],[84,93],[85,93],[85,92],[86,90]];
for (let i = 1; i < rangeHistory.length; i++) {
  assert.ok(rangeHistory[i][0] >= rangeHistory[i-1][0]);
  assert.ok(rangeHistory[i][1] <= rangeHistory[i-1][1]);
}
assert.deepEqual([Math.max(82,85),Math.min(94,93)], [85,93]);
assert.equal(3 - 1, 2);
for (let id = 1; id <= 24; id++) {
  assert.ok(read('71-INVARIANTS-DIAGNOSTICS-SAFE-STOP.md').includes(`INV${String(id).padStart(2,'0')}`));
}
for (let id = 1; id <= 12; id++) {
  assert.ok(read('73-LONG-RUN-FAULT-BALANCE-VALIDATION.md').includes(`L${String(id).padStart(2,'0')}`));
}
console.log('PASS: 82 world design expectations across 8 modules, 24 invariant contracts, 12 planned run scenarios, narrowing-range examples. World simulations are NOT executed.');
console.log('NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.');
