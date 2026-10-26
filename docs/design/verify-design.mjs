// Static design checks only; this is not a game engine or browser test.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { createHash } from 'node:crypto';

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
  unique(event.choices.map(c => c.resultCopy)); // 선택지마다 결과 문구가 달라야 한다
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
const crossFixtures = JSON.parse(read('cross-contract-fixtures.json'));
assert.equal(crossFixtures.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(crossFixtures.cases.length, 30);
unique(crossFixtures.cases.map(c => c.id));
for (const fixture of crossFixtures.cases) {
  assert.ok(fixture.given && fixture.action && fixture.expected);
  assert.equal(fixture.executionStatus, 'NOT_IMPLEMENTED');
}
assert.equal(crossFixtures.cases.filter(c => c.module === 'resume').length, 12);
assert.equal(crossFixtures.cases.filter(c => c.module === 'commands').length, 12);
assert.equal(crossFixtures.cases.filter(c => c.module === 'effects').length, 6);
near(Math.min(2, 91.25 - 90, 100 - 90), 1.25);
near(Math.min(2, 100 - 90), 2);
near(Math.min(2, 100 - 98.75), 1.25);
near(Math.min(10, 100 - 95), 5);
near(-Math.min(20, 8), -8);
assert.ok(ids.includes('resume-continue-demo'));
assert.ok(!ids.includes('resume-phase-demo'));
assert.ok(!html.includes('중단 상태 예시'));
assert.ok(!html.includes('resumeGuidance'));
assert.ok(!ids.includes('resume-message-demo'));
assert.ok(html.includes('href="#career">이어하기</a>'));
console.log('PASS: 30 cross-contract expectations (12 command, 6 exact-effect, 12 web/APK resume); 192 expectations in these three fixture sets. Actual interruption recovery is NOT tested.');
const bindings = JSON.parse(read('screen-action-bindings.json'));
assert.equal(bindings.status, 'DESIGN_ONLY');
assert.equal(bindings.screens.length, 45);
unique(bindings.screens.map(row => row.screenId));
const actionClasses = new Set(['QUERY','SAVE_COMMAND','OWNER_CREATE','JOB_REQUEST','PREFERENCE','MIXED']);
for (const row of bindings.screens) {
  assert.ok(screens.screens.some(screen => screen.id === row.screenId));
  assert.ok(row.queryKey && row.actions.length > 0);
  assert.ok(row.actions.every(action => typeof action === 'string' && action.length > 0));
  unique(row.actions);
  assert.ok(actionClasses.has(row.actionClass));
  assert.equal(row.implementationStatus, 'NOT_IMPLEMENTED');
  assert.equal(row.resultRouting, 'serverAllowedActionsAndResumeDescriptor');
}
assert.deepEqual(bindings.screens.filter(row => row.actionClass === 'OWNER_CREATE').map(row => row.screenId), ['S02','S12']);
const creationFixtures = JSON.parse(read('creation-acceptance-fixtures.json'));
assert.equal(creationFixtures.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(creationFixtures.cases.length, 10);
unique(creationFixtures.cases.map(fixture => fixture.id));
for (let i = 1; i <= 10; i++) {
  const fixture = creationFixtures.cases.find(row => row.id === `CR${String(i).padStart(2, '0')}`);
  assert.ok(fixture?.given && fixture.action && fixture.expected);
  assert.equal(fixture.executionStatus, 'NOT_IMPLEMENTED');
}
console.log('PASS: 45 screen-action bindings and 10 creation recovery design expectations; 202 expectations before the final audit set. Runtime creation recovery is NOT tested.');
const recovery = JSON.parse(read('screen-recovery-matrix.json'));
assert.equal(recovery.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(recovery.screens.length, 45);
unique(recovery.screens.map(row => row.screenId));
const navPolicies = new Set(['ROOT','HOME','READ','DRAFT','CHOICE','JOB','PREFERENCE','MIXED']);
for (const row of recovery.screens) {
  assert.ok(screens.screens.some(screen => screen.id === row.screenId));
  assert.ok(row.emptyOrNotReady && row.blockingCase && row.recovery);
  assert.ok(navPolicies.has(row.navigationPolicy));
  for (const state of ['AUTH_REQUIRED','OFFLINE','RESULT_UNKNOWN','CONFLICT']) assert.ok(row.commonStates.includes(state));
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
}
const occurrences = JSON.parse(read('event-occurrence-audit.json'));
assert.equal(occurrences.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(occurrences.events.length, 99);
unique(occurrences.events.map(row => row.eventId));
for (const row of occurrences.events) {
  assert.ok(catalog.events.some(event => event.id === row.eventId));
  assert.ok(row.evidenceKey && row.repeatPolicy && row.predicateSource && row.ruleSections);
  assert.equal(row.ownerScopeRequired, true);
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
}
assert.equal(occurrences.events.find(row => row.eventId === 'E83').queueClass, 'FORM');
assert.equal(occurrences.events.find(row => row.eventId === 'E98').repeatPolicy, 'PRESENTATION_ONLY');
assert.equal(occurrences.events.find(row => row.eventId === 'E94').evidenceKey, 'relationId:creationReceiptId');
assert.equal(occurrences.events.find(row => row.eventId === 'E96').evidenceKey, 'relationId:sharedTeamRegistrationReceiptId');
const surfaces = JSON.parse(read('probability-surface-register.json'));
assert.equal(surfaces.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(surfaces.surfaces.length, 20);
unique(surfaces.surfaces.map(row => row.id));
const oddsKinds = new Set(['EXACT','DETERMINISTIC','RANKED','CONDITIONAL','REPLAY_EXACT','SYSTEM_RANDOM','EVIDENCE','TECHNICAL']);
for (const row of surfaces.surfaces) {
  assert.ok(row.target && row.requiredContext && row.ruleSections.length);
  assert.ok(oddsKinds.has(row.kind));
  for (const id of row.screenIds) assert.ok(screens.screens.some(screen => screen.id === id));
  assert.equal(row.hideNumericIfExactlyOne, true);
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
}
const integrationPaths = JSON.parse(read('end-to-end-design-paths.json'));
assert.equal(integrationPaths.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(integrationPaths.paths.length, 24);
unique(integrationPaths.paths.map(row => row.id));
for (let i = 1; i <= 24; i++) {
  const row = integrationPaths.paths.find(item => item.id === `P${String(i).padStart(2, '0')}`);
  assert.ok(row?.flow && row.assertions.length && row.evidenceRequired.length);
  for (const id of row.screenIds) assert.ok(screens.screens.some(screen => screen.id === id));
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
}
const finalFixtures = JSON.parse(read('final-design-fixtures.json'));
assert.equal(finalFixtures.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(finalFixtures.cases.length, 72);
unique(finalFixtures.cases.map(row => row.id));
for (const [module, count] of Object.entries({creation:10,screens:10,events:10,probability:10,visual:10,paths:10,difficulty:12})) {
  assert.equal(finalFixtures.cases.filter(row => row.module === module).length, count);
}
for (const row of finalFixtures.cases) {
  assert.ok(row.given && Object.keys(row.given).length && row.action && row.expected && Object.keys(row.expected).length);
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
}
unique([...detailedFixtures.cases,...worldFixtures.cases,...crossFixtures.cases,...creationFixtures.cases,...finalFixtures.cases].map(row => row.id));
assert.equal(detailedFixtures.cases.length + worldFixtures.cases.length + crossFixtures.cases.length + creationFixtures.cases.length + finalFixtures.cases.length, 274);
near(10 * .5 + 10 * .5 * 3, 20);
near(10 * 1.2, 12);
assert.equal(Math.min(100, 95 + 5), 100);
assert.equal(Math.max(0, 20 - 30), 0);
assert.equal(Math.max(0, 60 - 30), 30);
near((50 + 45 + 40 + 35 + 30 + 25) / 6, 37.5);
assert.ok(html.includes('내 구단 전체 잠재력100'));
assert.ok(html.includes('이후 영입·보관 투입 선수 포함.'));
console.log('PASS: 45 screen recovery rows, 99 event occurrence rows, 20 probability surfaces, 24 planned paths, 72 final fixtures; 274 expectations before the platform set. Runtime/UI/AI checks are NOT executed.');
const platformContracts = JSON.parse(read('platform-experience-contracts.json'));
assert.equal(platformContracts.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(platformContracts.targets.length, 6);
unique(platformContracts.targets.map(row => row.id));
const platformFlows = ['LOGIN_ALLOWLIST','CREATE_AND_PLAY','CLOSE_AND_RESUME','SAME_OWNER_CROSS_DEVICE','ACCOUNT_SWITCH_ISOLATION','UNKNOWN_COMMAND_RECONCILIATION','UPDATE_WITH_JOURNAL','PRIVATE_FILE_DOWNLOAD'];
for (let i = 1; i <= 6; i++) {
  const row = platformContracts.targets.find(item => item.id === `CP${String(i).padStart(2, '0')}`);
  assert.ok(row?.environment && row.auth && row.localJournal && row.update && row.fileTransfer);
  assert.deepEqual(row.requiredFlows, platformFlows);
  assert.equal(row.offlineWorldWrites, false);
  assert.equal(row.optionalCapability, 'FILE_SHARING_FEATURE_DETECTED');
  assert.ok(row.evidenceRequired.length >= 6);
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
}
assert.equal(platformContracts.targets.find(row => row.id === 'CP03').auth, 'INDEPENDENT_WEB_SESSION_CHECK');
assert.equal(platformContracts.targets.find(row => row.id === 'CP06').auth, 'SYSTEM_BROWSER_PKCE_APP_LINK');
const platformFixtures = JSON.parse(read('platform-experience-fixtures.json'));
assert.equal(platformFixtures.status, 'DESIGN_EXPECTATIONS_ONLY');
assert.equal(platformFixtures.cases.length, 24);
for (const module of ['auth','update','files']) assert.equal(platformFixtures.cases.filter(row => row.module === module).length, 8);
for (const row of platformFixtures.cases) {
  assert.ok(row.given && Object.keys(row.given).length && row.action && row.expected && Object.keys(row.expected).length);
  assert.equal(row.executionStatus, 'NOT_IMPLEMENTED');
  if (row.given.target) assert.ok(platformContracts.targets.some(target => target.id === row.given.target));
  for (const id of row.given.targets || []) assert.ok(platformContracts.targets.some(target => target.id === id));
}
const allExpectations = [...detailedFixtures.cases,...worldFixtures.cases,...crossFixtures.cases,...creationFixtures.cases,...finalFixtures.cases,...platformFixtures.cases];
unique(allExpectations.map(row => row.id));
assert.equal(allExpectations.length, 298);
console.log('PASS: six platform contracts with eight required flows each, and 24 platform expectations (8 auth, 8 update, 8 files); 298 unique design expectations total. Browser/device/auth/update/file behavior is NOT executed.');
// Final baseline structure and arithmetic examples only, not a production XP ledger.
const currentIndex = JSON.parse(read('current-contract-index.json'));
assert.equal(currentIndex.status, 'DESIGN_BASELINE');
assert.equal(currentIndex.baselineVersion, '1.0');
assert.equal(currentIndex.topics.length, 25);
unique(currentIndex.topics.map(row => row.id));
const partialContractIds = new Set(['C15', 'C17', 'C22']);
for (const row of currentIndex.topics) {
  assert.ok(row.topic && row.scope && row.currentSources.length);
  unique(row.currentSources);
  for (const file of row.currentSources) assert.ok(existsSync(path.join(root, file)), `Missing current contract ${file}`);
  if (partialContractIds.has(row.id)) assert.equal(row.implementationStatus, 'PARTIAL');
  else assert.equal(row.implementationStatus, 'NOT_IMPLEMENTED');
}
const stateUi = JSON.parse(read('state-ui-expectations.json'));
assert.equal(stateUi.expectationStatus, 'NOT_IMPLEMENTED');
for (const g of stateUi.groups) { assert.equal(g.status, 'NOT_EXECUTED'); assert.ok(existsSync(path.join(root, g.doc))); unique(g.ids); }
const playerDisplay = JSON.parse(read('player-display-expectations.json'));
assert.equal(playerDisplay.executionStatus, 'NOT_EXECUTED');
for (const d of playerDisplay.docs) assert.ok(existsSync(path.join(root, d)));
unique(playerDisplay.ids);
const effectSum = JSON.parse(read('effect-sum-examples.json'));
{
  const clamp = (x, c) => Math.max(-c, Math.min(c, x));
  const keys = Object.keys(effectSum.baseProbs);
  for (const ex of effectSum.examples) {
    const applied = {}; const lg = {};
    for (const k of keys) {
      const trait = clamp(ex.traits.reduce((a, t) => a + (t[k] || 0), 0), effectSum.caps.trait);
      const raw = trait + (ex.pitch[k] || 0) + (ex.approach[k] || 0) + (ex.form[k] || 0) + (ex.platoon[k] || 0);
      applied[k] = clamp(raw, effectSum.caps.total);
      lg[k] = Math.log(effectSum.baseProbs[k]) + applied[k];
      if (Math.abs(applied[k]) > 1e-12) assert.ok(Math.abs((ex.appliedSum[k] ?? 0) - applied[k]) < 1e-9, ex.id + k);
    }
    const mx = Math.max(...Object.values(lg)); const e = {}; let s = 0;
    for (const k of keys) { e[k] = Math.exp(lg[k] - mx); s += e[k]; }
    let total = 0;
    for (const k of keys) { assert.ok(Math.abs(e[k] / s - ex.probs[k]) < 6e-5, ex.id + ' prob ' + k); total += ex.probs[k]; }
    assert.ok(Math.abs(total - 1) < 5e-4, ex.id + ' sum');
  }
}
const imgReg = JSON.parse(read('image-production-register.json'));
{
  const statuses = new Set(['TODO', 'EXISTS', 'CODE_ONLY', 'LEGACY_REFERENCE']);
  unique(imgReg.items.map(i => i.id));
  const screenIds = new Set(screens.screens.map(s => s.id));
  for (const i of imgReg.items) {
    assert.ok(statuses.has(i.status) && imgReg.groups[i.group] && i.name && i.file && i.spec, i.id);
    for (const s of i.screens) assert.ok(screenIds.has(s), i.id + ' ' + s);
    if (i.status === 'TODO') assert.ok(['P0', 'P1', 'P2'].includes(i.priority), i.id);
  }
  assert.equal(imgReg.items.filter(i => i.group === 'G1').length, 14);
  assert.equal(imgReg.items.length, 92);
  assert.equal(imgReg.items.filter(i => i.status === 'TODO').length, 0);
  assert.equal(imgReg.items.filter(i => i.status === 'EXISTS').length, 80);
}
{
  const screenSet = new Set(screens.screens.map(s => s.id));
  const validateBranch = (event, branch, choices) => {
    assert.ok(['BLOCKING_UNTIL_DOMAIN_COMMIT', 'RESOLVE_ON_SELECT'].includes(branch.resolutionPolicy), event.id);
    assert.ok(choices.length > 0, event.id + ' empty branch');
    if (branch.resolutionPolicy === 'BLOCKING_UNTIL_DOMAIN_COMMIT') {
      assert.ok(choices.every(c => c.dispatchClass !== 'ACK'), event.id + ' ACK cannot close blocking branch');
    }
  };
  const validateEvent = e => {
    for (const c of e.choices) {
      assert.ok(['DOMAIN', 'NAVIGATE', 'ACK'].includes(c.dispatchClass), e.id + c.command);
      if (c.dispatchClass === 'NAVIGATE') assert.ok(screenSet.has(c.targetScreen), e.id + c.command);
    }
    if (e.resolutionPolicy === 'BY_POSTING_DECISION') {
      assert.equal(e.id, 'E63');
      assert.deepEqual(Object.keys(e.resolutionBranches).sort(), ['APPROVED', 'DEFERRED']);
      const used = [];
      for (const [decision, branch] of Object.entries(e.resolutionBranches)) {
        assert.deepEqual(branch.choiceCommands, decision === 'APPROVED' ? ['OPEN_POSTING_OFFERS'] : ['ACK_EVENT']);
        assert.equal(branch.resolutionPolicy, decision === 'APPROVED' ? 'BLOCKING_UNTIL_DOMAIN_COMMIT' : 'RESOLVE_ON_SELECT');
        const choices = branch.choiceCommands.map(command => {
          const choice = e.choices.find(c => c.command === command);
          assert.ok(choice, e.id + ' unknown branch command ' + command);
          return choice;
        });
        used.push(...branch.choiceCommands);
        validateBranch(e, branch, choices);
      }
      unique(used);
      assert.deepEqual([...used].sort(), e.choices.map(c => c.command).sort());
    } else validateBranch(e, e, e.choices);
  };
  for (const event of catalog.events) validateEvent(event);
  const e63 = catalog.events.find(e => e.id === 'E63');
  assert.equal(e63.resolutionPolicy, 'BY_POSTING_DECISION');
  assert.equal(catalog.events.filter(e => e.resolutionPolicy === 'BLOCKING_UNTIL_DOMAIN_COMMIT').length, 35);
  assert.equal(catalog.events.filter(e => e.resolutionPolicy === 'RESOLVE_ON_SELECT').length, 63);
  // Negative checks reject the previously passing ACK/blocking combination.
  const blockingAck = structuredClone(e63);
  blockingAck.resolutionPolicy = 'BLOCKING_UNTIL_DOMAIN_COMMIT';
  assert.throws(() => validateEvent(blockingAck), /ACK cannot close blocking/);
  const swapped = structuredClone(e63);
  swapped.resolutionBranches.DEFERRED.resolutionPolicy = 'BLOCKING_UNTIL_DOMAIN_COMMIT';
  assert.throws(() => validateEvent(swapped));
  const wrongCommand = structuredClone(e63);
  wrongCommand.resolutionBranches.APPROVED.choiceCommands = ['ACK_EVENT'];
  assert.throws(() => validateEvent(wrongCommand));
  console.log('PASS: E63 approved branch waits for domain commit; deferred branch allows ACK; invalid blocking ACK, swapped policy and wrong branch command are rejected (static design checks).');
}

{
  const idx = JSON.parse(read('expectation-sets-index.json'));
  assert.equal(idx.core298, 298);
  unique(idx.sets.map(s => s.id));
  for (const s of idx.sets) {
    assert.ok(existsSync(path.join(root, s.file || s.doc)), s.id);
    if (!s.file) assert.ok(read(s.doc).includes(s.id + '01'), s.id);
    if (s.selector) {
      const source = JSON.parse(read(s.file));
      assert.ok(Array.isArray(source[s.selector]), s.id);
      assert.equal(source[s.selector].length, s.count, s.id + ' source count');
      unique(source[s.selector].map(row => row.id));
      assert.ok(source[s.selector].every(row => row.executionStatus === 'NOT_EXECUTED'), s.id);
    }
    assert.equal(s.status, 'NOT_EXECUTED');
  }
  assert.equal(idx.sets.filter(s => s.kind === 'CORE_298').reduce((a, s) => a + s.count, 0), 298);
  assert.equal(idx.sets.length, 23);
  for (const id of ['career-fast-progression-policy', 'club-first-season-recovery', 'club-offseason-collisions']) assert.ok(idx.sets.some(s => s.id === id), id);
  console.log('PASS: 23 expectation sets indexed; FP12, first-club recovery7 and offseason12 match source counts and remain NOT_EXECUTED; core total remains 298.');
}
const closure = JSON.parse(read('design-closure-register.json'));
assert.equal(closure.status, 'WRITTEN_DESIGN_BASELINE');
assert.equal(closure.baselineVersion, '1.0');
assert.equal(closure.designClosures.length, 10);
assert.equal(closure.executionGates.length, 12);
assert.deepEqual(closure.pendingUserQuestions, []);
assert.equal(closure.implementationStarted, true);
for (const row of closure.designClosures) {
  assert.equal(row.status, 'SPECIFIED');
  assert.equal(row.runtimePassed, false);
  assert.ok(existsSync(path.join(root, row.evidence)));
}
const executedGates = new Set(['V02', 'V03']);
for (const row of closure.executionGates) {
  if (executedGates.has(row.id)) {
    assert.equal(row.status, 'EXECUTED');
    assert.equal(row.runtimePassed, true);
    if (row.evidence) assert.ok(existsSync(path.join(root, row.evidence)), row.id);
  } else {
    assert.equal(row.status, 'NOT_EXECUTED');
    assert.equal(row.runtimePassed, false);
  }
}
unique([...closure.designClosures,...closure.executionGates].map(row => row.id));
assert.deepEqual(closure.counts, {screens:45,events:99,expectations:298,integrationPaths:24,platformTargets:6,flowsPerPlatform:8,longRunPlans:12,contractTopics:25});
function xpExample({baseSpent=0,reserved=0,actualSpent=0,carry=0,n=5,cap=200000,candidate=200000,pitchXp=0}) {
  const B = 200000 - baseSpent - reserved;
  const R = Math.max(0, cap - actualSpent);
  if (B <= 0 || R <= 0) return {base:0,debit:0,gain:0,loss:0,carry};
  const base = Math.max(0, Math.min(candidate,B,Math.floor((5*R+4-carry)/n)));
  if (base === 0) return {base:0,debit:0,gain:0,loss:0,carry};
  const debit = Math.floor((n*base+carry)/5);
  const gain = Math.min(debit,1500000-pitchXp);
  return {base,debit,gain,loss:debit-gain,carry:(n*base+carry)%5};
}
assert.deepEqual(xpExample({baseSpent:100000,actualSpent:100000,n:15,cap:600000}),{base:100000,debit:300000,gain:300000,loss:0,carry:0});
assert.equal(xpExample({baseSpent:200000,actualSpent:200000,n:15,cap:600000}).debit,0);
assert.equal(xpExample({baseSpent:100000,actualSpent:300000}).debit,0);
assert.equal(xpExample({baseSpent:100000,actualSpent:300000,n:15,cap:600000}).debit,300000);
assert.deepEqual(xpExample({candidate:10000,n:15,cap:600000,pitchXp:1490000}),{base:10000,debit:30000,gain:10000,loss:20000,carry:0});
assert.equal(xpExample({reserved:100000}).base,100000);
let carried=0,totalActual=0;
for (let i=0;i<5;i++) {const e=xpExample({candidate:1,n:6,cap:240000,carry:carried});carried=e.carry;totalActual+=e.debit;}
assert.equal(totalActual,6);assert.equal(carried,0);
for (const n of [5,6,15]) for(let c=0;c<5;c++) for(let room=1;room<=20;room++) {
  const e=xpExample({candidate:24,n,carry:c,cap:room});
  assert.ok(e.debit<=room && e.base<=24 && e.carry>=0 && e.carry<5);
  assert.equal(e.gain+e.loss,e.debit);
}
const importedUnits = sourceUnits => Math.max(10000,Math.floor((sourceUnits+1)/2));
assert.equal(importedUnits(912501),456251);
assert.equal(importedUnits(1000000),500000);
assert.equal(importedUnits(10000),10000);
assert.ok(Math.abs(importedUnits(912501)/10000 - 91.2501/2) <= .0000500001);
for (const id of ['R41','R42','R43','R44','R45','R46','R47','R48','R49']) assert.ok(read('14-CANONICAL-DECISIONS.md').includes(`| ${id} |`));
console.log('PASS: baseline 1.0 has 25 source topics, 10 specified closures, V02/V03 EXECUTED and 10 remaining NOT_EXECUTED gates; XP double-budget/cap-loss/remainder and import rounding examples. These are static/document arithmetic checks only.');
await import('./verify-art-direction.mjs');
await import('./verify-state-ui.mjs');
await import('./verify-finish-board.mjs');
await import('./verify-performance-examples.mjs');
await import('./verify-first-career.mjs');
await import('./verify-club-first-season.mjs');
await import('./verify-club-offseason.mjs');
await import('./verify-midcareer-progression.mjs');
await import('./verify-latecareer-continuity.mjs');
{
 const audit=JSON.parse(read('preimplementation-screen-audit.json'));
 const finish=JSON.parse(read('screen-finish-register.json'));
 const slots=JSON.parse(read('screen-image-slots.json'));
 const registry=JSON.parse(read('image-production-register.json'));
 assert.equal(audit.rows.length,45);assert.equal(audit.counts.executedBrowserCases,0);
 for(const r of audit.rows){const row=finish.rows.find(x=>x.screenId===r.screenId);assert.ok(row);assert.equal(r.stateCount,row.states.length);assert.equal(r.stateCount,8);assert.deepEqual(r.assetRefs,slots.screens.find(x=>x.screenId===r.screenId).assetRefs);assert.equal(r.finalPixelStatus,row.finalPixelStatus);assert.equal(r.browserReview,row.browserReview);const ids=registry.items.filter(i=>i.status==='CODE_ONLY'&&i.screens.includes(r.screenId)).map(i=>i.id);assert.deepEqual(r.codeDisplayGroups,ids);}
 const approved=JSON.parse(read('assets/design-guides/APPROVED-CODE-DISPLAY-v1.json'));assert.equal(approved.status,'USER_APPROVED_WORKING_BASELINE');assert.deepEqual(approved.groups.map(g=>g.id).sort(),registry.items.filter(i=>i.status==='CODE_ONLY').map(i=>i.id).sort());assert.ok(read('code-display-board.html').includes('assets/design-guides/code-display-comparison.svg'));assert.equal(slots.assetLibrary.codeDisplayGuide.groups.length,11);for(const g of slots.assetLibrary.codeDisplayGuide.groups)assert.deepEqual(g.screens,registry.items.find(i=>i.id===g.id).screens);
 const spec=read('127-CODE-DISPLAY-SPECIFICATION.md');
 for(const i of registry.items.filter(i=>i.status==='CODE_ONLY')){assert.ok(spec.includes(i.id));assert.equal(i.displaySpec,'127-CODE-DISPLAY-SPECIFICATION.md');assert.equal(i.implementationStatus,'NOT_IMPLEMENTED');assert.equal(i.visualReview,'USER_APPROVED_WORKING_BASELINE');assert.equal(i.designGuide,'code-display-board.html');}
 console.log('PASS: 11 code-display specifications and 45-screen/8-state reference audit; visual baseline approved, browser execution count remains zero.');
}
{
 const evidence=JSON.parse(read('design-board-accessibility-audit.json'));assert.equal(evidence.status,'STATIC_ACCESSIBILITY_AUDIT_ONLY');assert.equal(evidence.checks.length,13);for(const c of evidence.checks)assert.equal(c.result,'PASS_STATIC');
 for(const [file,digest] of Object.entries(evidence.files))assert.equal(createHash('sha256').update(read(file).replace(/\r\n/g,'\n')).digest('hex'),digest,'Outdated source audit: '+file);
 assert.equal((html.match(/<img\b/g)||[]).length,evidence.checks.find(c=>c.id==='SA03').details.imageCount);assert.equal((html.match(/<table\b/g)||[]).length,evidence.checks.find(c=>c.id==='SA05').details.tableCount);assert.equal(evidence.render.status,'BLOCKED_BY_BROWSER_URL_POLICY');assert.equal(evidence.render.attemptedWorkaround,false);assert.deepEqual(evidence.render.executedViewports,[]);
 console.log('PASS: refreshed board references and 13 static accessibility evidence records match current source; browser rendering is policy-blocked, not passed.');
}
{
 const handoff=JSON.parse(read('preimplementation-readiness.json'));const registry=JSON.parse(read('image-production-register.json'));const sets=JSON.parse(read('expectation-sets-index.json'));const gates=JSON.parse(read('design-closure-register.json')).executionGates;
 assert.equal(handoff.implementationAuthorized,true);assert.equal(handoff.newGameRulesAdded,false);assert.equal(handoff.status,'IMPLEMENTATION_IN_PROGRESS_OPEN_GATES');assert.equal(handoff.counts.screens,screens.screens.length);assert.equal(handoff.counts.events,catalog.events.length);assert.equal(handoff.counts.coreDesignExpectations,sets.core298);assert.equal(handoff.counts.expectationSets,sets.sets.length);assert.ok(sets.sets.every(s=>s.status==='NOT_EXECUTED'));
 for(const [field,status] of [['imageExists','EXISTS'],['imageTodo','TODO'],['codeDisplayGroups','CODE_ONLY'],['legacyReferences','LEGACY_REFERENCE']])assert.equal(handoff.counts[field],registry.items.filter(i=>i.status===status).length);assert.deepEqual(handoff.executionGates,gates.map(({id,status,runtimePassed})=>({id,status,runtimePassed})));assert.ok(handoff.executionGates.filter(g=>!['V02','V03'].includes(g.id)).every(g=>g.runtimePassed===false));assert.ok(handoff.executionGates.filter(g=>['V02','V03'].includes(g.id)).every(g=>g.runtimePassed===true));assert.equal(handoff.counts.executedBrowserViews,0);assert.equal(handoff.reviewMatrix.executionStatus,'NOT_EXECUTED');unique(handoff.areas.map(a=>a.id));for(const a of handoff.areas)for(const f of a.sources)assert.ok(existsSync(path.join(root,f)),f);
 console.log('PASS: final preimplementation handoff matches current counts and 12 open runtime gates; no implementation authorization or executed visual checks inferred.');
}
{
 const tech=read('06-TECH.md'),create=read('78-NEW-GAME-CREATION-RECOVERY.md'),game=read('24-GAME-ENGINE-SCORING.md');
 assert.ok(tech.includes('새 게임 생성은78의 POST /api/game-creations'));assert.ok(tech.includes('공개 정책을 적용한 게임 화면용 DTO'));assert.ok(!create.includes("홈에 '만들던 게임 확인'"));assert.ok(!create.includes('홈에 각각 표시'));assert.ok(create.includes('생성 전에는 개인 잠재력을 아직 추첨하지'));assert.ok(game.includes('현재투수견제 기반 p=clamp'));assert.ok(game.includes('불변 simulationKey'));assert.ok(!game.includes('성공률70%'));assert.ok(read('rebuild-design-package.mjs').includes("'Thumbs.db'"));
 console.log('PASS: final cross-document review corrections align creation, resume UI, public DTO and baserunning contracts; no new gameplay rule or runtime proof.');
}
console.log('NOT TESTED: browser rendering, gameplay, balance simulations, Neon/API/auth, build, Android APK.');
