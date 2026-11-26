import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { eq } from 'drizzle-orm';
import { canonicalSha256 } from '../packages/engine/src/canonical-seal.ts';
import { commandReceipts, createTestDb, gameSaves, seedAllowedSubject } from '@playball/db';
import { advanceHighSchoolCareer } from '../packages/engine/src/high-school-progress.ts';
import { createApp } from '../apps/api/src/app.ts';
import { storedSave } from '../apps/api/test/stored-save.ts';

const owner = 'desktop-recovery-owner';
const other = 'desktop-recovery-other';
const browserPath = process.env.PLAYBALL_CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const waitFor = async (read, label) => {
 let lastError;
 for (let attempt = 0; attempt < 100; attempt++) {
  try { const result = await read(); if (result) return result; } catch (error) { lastError = error; }
  await delay(100);
 }
 throw Error('Timed out waiting for ' + label, { cause: lastError });
};

async function browserSession(url, run) {
 const root = resolve(tmpdir());
 const profile = await mkdtemp(join(root, 'playball-p22-'));
 const process = spawn(browserPath, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--disable-background-networking', '--disable-component-update', '--no-first-run', url,
 ], { windowsHide: true, stdio: 'ignore' });
 const exited = new Promise(resolveExit => {
  process.once('error', resolveExit);
  process.once('exit', resolveExit);
 });
 let ws;
 try {
  const port = await waitFor(async () => Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]), 'Chrome port');
  const page = await waitFor(async () => {
   const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
   return tabs.find(tab => tab.type === 'page' && tab.url === url);
  }, 'loopback browser tab');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await once(ws, 'open');
  let id = 0;
  const evaluate = (expression) => {
   const callId = ++id;
   return new Promise((res, rej) => {
    const timer = setTimeout(() => {
     ws.removeEventListener('message', receive);
     rej(Error('Browser API request timed out'));
    }, 30_000);
    function receive({ data }) {
     const response = JSON.parse(data);
     if (response.id !== callId) return;
     clearTimeout(timer);
     ws.removeEventListener('message', receive);
     if (response.error || response.result.exceptionDetails) rej(Error('Browser execution did not complete'));
     else res(response.result.result.value);
    }
    ws.addEventListener('message', receive);
    ws.send(JSON.stringify({ id: callId, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
   });
  };
  await waitFor(() => evaluate('location.href === ' + JSON.stringify(url) + ' && document.readyState === "complete"'), 'browser document');
  const request = async (path, subject = owner, body, lose = false) => {
   const command = {
    path, body, headers: {
     Authorization: 'Bearer dev:' + subject,
     'Content-Type': 'application/json',
     ...(lose ? { 'x-test-lose-response': '1' } : {}),
    },
   };
   const expression = `(async()=>{const {path,body,headers}=${JSON.stringify(command)};
    try{
     const response=await fetch(path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});
     const raw=await response.text();
     try{return {status:response.status,body:JSON.parse(raw)};}catch{return {status:response.status,raw};}
    }catch(error){return {networkError:error.name,message:error.message,href:location.href};}
   })()`;
   return evaluate(expression);
  };
  return await run(request);
 } finally {
  ws?.close();
  if (process.pid && process.exitCode === null && process.signalCode === null) process.kill();
  await exited;
  assert.equal(resolve(profile, '..'), root);
  await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
 }
}

const { db, client } = await createTestDb();
await seedAllowedSubject(db, owner);
await seedAllowedSubject(db, other);
const app = createApp({ db, auth: { allowDevBearer: true } });
const lost = new Map();
const server = createServer(async (req, res) => {
 try {
  if (req.url === '/') {
   res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
   res.end('<!doctype html><title>Playball desktop recovery verification</title>');
   return;
  }
  const chunks = [];
  for await (const bytes of req) chunks.push(bytes);
  const response = await app.request(req.url, {
   method: req.method, headers: req.headers,
   ...(chunks.length ? { body: Buffer.concat(chunks).toString('utf8') } : {}),
  });
  const body = await response.text();
  if (req.headers['x-test-lose-response'] === '1') {
   assert.equal(response.status, 200, body);
   const receipt = JSON.parse(body);
   if (lost.has(req.url)) assert.deepEqual(receipt, lost.get(req.url));
   else lost.set(req.url, receipt);
   res.destroy();
   return;
  }
  res.writeHead(response.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
 } catch (error) {
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: error.message }));
 }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = 'http://127.0.0.1:' + server.address().port + '/';

const creation = { creationId: 'p22-desktop-creation', mode: 'CAREER' };
const seed = {
 name: '복구 검증 선수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null,
 archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'DEFENSE'],
 difficulty: 'GROWTH', schoolId: 'H01', seasonYear: 2029,
};
let path, saveId, advance, before, after, rulesVersion;
async function getStored() {
 const [row] = await storedSave(db, saveId);
 assert.ok(row);
 rulesVersion = row.state.career.world.rulesVersion;
 return { revision: Number(row.revision), hash: canonicalSha256(row.state), recordCount: Object.keys(row.state.career.records.games).length };
}
try {
 await browserSession(url, async (request) => {
  const dropped=await request('/api/game-creations', owner, creation, true);
  assert.equal(dropped.networkError,'TypeError',JSON.stringify(dropped));
  assert.equal(lost.size, 1);
 });
 await browserSession(url, async (request) => {
  const created = await request('/api/game-creations', owner, creation);
  assert.equal(created.status, 200, JSON.stringify(created));
  assert.deepEqual(created.body, lost.get('/api/game-creations'));
  saveId = created.body.saveId;
  path = '/api/saves/' + saveId;
  let revision = 0;
  let careerRevision = 0;
  async function send(id, name, payload = {}) {
   const result = await request(path + '/commands', owner, {
    commandId: id, expectedRevision: revision, type: 'CAREER_SCHOOL_' + name,
    payload: name === 'CREATE' ? payload : { careerRevision, ...payload },
   });
   assert.equal(result.status, 200, JSON.stringify(result.body));
   revision = Number(result.body.revision);
   careerRevision = result.body.summary.careerRevision;
  }
  await send('player', 'CREATE', seed);
  await send('confirm', 'CONFIRM_PLAYER');
  const event = (await request(path + '/screens/SCHOOL_CAREER')).body.event;
  assert.ok(event);
  await send('focus', 'RESOLVE_FOCUS', { eventKey: event.eventKey, eventVersion: event.eventVersion, command: 'KEEP_FOCUS' });
  await send('plan', 'CONFIRM_PRESEASON');
  // Earlier date chunks may commit only other schools. Drop the response that finalizes my first game.
  for (let step = 0; step < 16; step++) {
   const [row] = await storedSave(db, saveId);
   const current = row.state.career;
   const preview = advanceHighSchoolCareer(current, current.revision, 'ONE_GAME');
   assert.notEqual(preview.stopReason, 'ENGINE_LIMIT');
   const school = current.world.protagonistSchoolId;
   const addsOwnGame = Object.values(preview.career.records.games)
    .some(game => !current.records.games[game.gameKey] && Object.hasOwn(game.teams, school));
   if (addsOwnGame) {
    before = await getStored();
    advance = { commandId: 'one-official-game', expectedRevision: revision,
     type: 'CAREER_SCHOOL_ADVANCE', payload: { careerRevision, mode: 'ONE_GAME' } };
    break;
   }
   await send('setup-chunk-'+step, 'ADVANCE', { mode: 'ONE_GAME' });
  }
  assert.ok(advance, 'No first official team game in the planned commands');
  assert.equal((await request(path + '/commands', owner, advance, true)).networkError, 'TypeError');
  assert.equal(lost.size, 2);
  after = await getStored();
  assert.equal(after.revision, before.revision + 1);
  assert.ok(after.recordCount > before.recordCount);
 });
 await browserSession(url, async (request) => {
  const saved = await request(path + '/screens/SCHOOL_CAREER');
  assert.equal(saved.status, 200);
  assert.equal(saved.body.player.name, seed.name);
  assert.equal(saved.body.teamGames, 1);
  const replay = await request(path + '/commands', owner, advance);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, lost.get(path + '/commands'));
  assert.equal((await request(path + '/commands', owner, { ...advance, commandId: 'stale-write' })).status, 409);
  assert.equal((await request(path + '/commands', other, advance)).status, 404);
  assert.equal((await request(path + '/screens/SCHOOL_CAREER', other)).status, 404);
  assert.deepEqual(await getStored(), after);
 });
 const saves = await db.select({ id: gameSaves.id }).from(gameSaves).where(eq(gameSaves.ownerId, owner));
 const receipts = await db.select().from(commandReceipts).where(eq(commandReceipts.saveId, saveId));
 assert.deepEqual(saves, [{ id: saveId }]);
 const [receipt] = receipts.filter(row => row.commandId === advance.commandId);
 assert.equal(receipts.filter(row => row.commandId === advance.commandId).length, 1);
 assert.equal(Number(receipt.resultingRevision), after.revision);
 console.log(JSON.stringify({
  pathId: 'P22', scope: 'ISOLATED_CHROMIUM_PROFILES_LOCAL_HTTP', distinctProfiles: 3,
  database: 'PGlite', rulesVersion, nodeVersion: process.versions.node,
  responseLoss: [...lost.keys()].map(route => route.endsWith('/commands') ? 'AFTER_COMMAND_COMMIT' : 'AFTER_CREATION_COMMIT'),
  creationId: creation.creationId, commandId: advance.commandId, ownedSaves: saves.length,
  matchingReceipts: 1, requestHash: receipt.requestHash, before, after,
  visibleTeamGames: 1, staleStatus: 409, foreignReadStatus: 404, foreignWriteStatus: 404,
 }, null, 2));
} finally {
 await new Promise(resolveServer => server.close(resolveServer));
 await client.close();
}
