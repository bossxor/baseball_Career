import { applyEngineCommand, type CommandBody, type SaveState } from '../../api/src/engine-command.js';
import { gameCareerView, gameScreenView } from '../../api/src/game-view-projections.js';
import { createEmptyGameState } from '../../api/src/ui-shell.js';
import { encodeStateParts, StateDecoder } from '../../../packages/db/src/state-codec.js';
import { readDeviceSaveCopy } from './device-save-copy.js';

const tables = ['saves', 'states', 'receipts'];
const MAX_ACCOUNT_BACKUP_BYTES = 128 * 1024 * 1024;
type Save = {
  id: string; mode: 'CAREER' | 'CLUB'; revision: string; phase: string; summary: Record<string, unknown>; updatedAt: string; partCount: number;
  accountBackup?: { id: string; revision: string };
};
type Receipt = { intent: string; value: { revision: string; summary: Record<string, unknown>; next?: unknown } };
type Reply = [status: number, data: unknown];
const db = new Promise<IDBDatabase>((resolve, reject) => {
  const open = indexedDB.open('again-playball-device', 1);
  open.onupgradeneeded = () => { for (const table of tables) open.result.createObjectStore(table); };
  open.onsuccess = () => { open.result.onversionchange = () => open.result.close(); resolve(open.result); };
  open.onerror = () => reject(open.error);
  open.onblocked = () => reject(new Error('LOCAL_SAVE_BLOCKED'));
});

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

async function transaction<T>(mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>): Promise<T> {
  const tx = (await db).transaction(tables, mode);
  const committed = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('LOCAL_SAVE_ABORTED'));
  });
  try {
    const result = await work(tx);
    await committed;
    return result;
  } catch (error) {
    try { tx.abort(); } catch { /* Already finished. */ }
    await committed.catch(() => {});
    throw error;
  }
}

const fail = (status: number, code: string): Reply => [status, { code }];

async function writeState(store: IDBObjectStore, id: string, state: SaveState, previousParts: number): Promise<number> {
  let count = 0;
  for (const part of encodeStateParts(state)) await request(store.put(part, [id, count++]));
  for (let index = count; index < previousParts; index++) await request(store.delete([id, index]));
  return count;
}

async function readState(store: IDBObjectStore, save: Save): Promise<SaveState> {
  const decoder = new StateDecoder();
  for (let index = 0; index < save.partCount; index++) {
    const part = await request(store.get([save.id, index]));
    if (typeof part !== 'string') throw new Error('LOCAL_SAVE_MISSING');
    decoder.push(part);
  }
  return decoder.finish() as SaveState;
}

function accountInput(raw: string | undefined) {
  const { baseUrl, token, saveId } = JSON.parse(raw ?? '{}') as Record<string, unknown>;
  if (typeof baseUrl !== 'string' || typeof token !== 'string' || !token || typeof saveId !== 'string') return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), saveId, headers: { Authorization: `Bearer ${token}` } };
}

async function copyAccountSave(raw: string | undefined, backup = false): Promise<Reply> {
  const input = accountInput(raw);
  if (!input?.saveId) return fail(400, 'INVALID_REQUEST');
  const { baseUrl, headers, saveId } = input;
  const path = backup ? `/api/device-backups/${encodeURIComponent(saveId)}/content` : `/api/saves/${encodeURIComponent(saveId)}/device-copy`;
  const response = await fetch(baseUrl + path, { headers, cache: 'no-store', redirect: 'error' });
  if (!response.ok || !response.body) return fail(502, 'DEVICE_COPY_FAILED');
  const { meta, state } = await readDeviceSaveCopy(response.body, saveId);
  const id = `local-${backup ? 'backup' : 'account'}-${meta.id}:${meta.revision}`;
  return transaction('readwrite', async tx => {
    const saves = tx.objectStore('saves');
    if (await request(saves.get(id))) return [200, { saveId: id }];
    const partCount = await writeState(tx.objectStore('states'), id, state, 0);
    const { mode, revision, phase, summary } = meta;
    saves.add({ id, mode, revision, phase, summary, partCount, updatedAt: new Date().toISOString() } satisfies Save, id);
    return [200, { saveId: id }];
  });
}

async function backupDeviceSave(raw: string | undefined): Promise<Reply> {
  const input = accountInput(raw);
  if (!input?.saveId) return fail(400, 'INVALID_REQUEST');
  const { baseUrl, headers, saveId } = input;
  const snapshot = await transaction('readwrite', async tx => {
    const saves = tx.objectStore('saves'), states = tx.objectStore('states');
    const save: Save | undefined = await request(saves.get(saveId));
    if (!save || save.revision === '0') return null;
    const id = save.accountBackup?.revision === save.revision ? save.accountBackup.id : crypto.randomUUID();
    const { mode, revision, phase, summary } = save;
    const frames: Blob[] = [];
    let bytes = 0;
    const addFrame = (frame: readonly unknown[]) => {
      // A bounded Blob also works on WebViews when the API connects over HTTP/1.x.
      const chunk = new Blob([JSON.stringify(frame) + '\n']);
      bytes += chunk.size;
      if (bytes > MAX_ACCOUNT_BACKUP_BYTES) {
        throw Object.assign(new Error('Device backup exceeds limit'), { code: 'DEVICE_BACKUP_TOO_LARGE' });
      }
      frames.push(chunk);
    };
    addFrame(['save', { version: 1, id, mode, revision, phase, summary }]);
    for (let index = 0; index < save.partCount; index++) {
      const part = await request(states.get([saveId, index]));
      if (typeof part !== 'string') throw new Error('LOCAL_SAVE_MISSING');
      addFrame(['part', part]);
    }
    addFrame(['end', save.partCount]);
    const body = new Blob(frames, { type: 'application/x-ndjson' });
    saves.put({ ...save, accountBackup: { id, revision } } satisfies Save, saveId);
    return { id, body };
  });
  if (!snapshot) return fail(404, 'SAVE_NOT_FOUND');
  const response = await fetch(`${baseUrl}/api/device-backups/${snapshot.id}`, {
    method: 'POST', body: snapshot.body, headers, cache: 'no-store', redirect: 'error',
  });
  if (response.status === 413) return fail(413, 'DEVICE_BACKUP_TOO_LARGE');
  if (response.status === 409) return fail(409, 'DEVICE_BACKUP_CONFLICT');
  if (!response.ok) return fail(502, 'DEVICE_BACKUP_FAILED');
  return [200, { id: snapshot.id }];
}

async function listAccountBackups(raw: string | undefined): Promise<Reply> {
  const input = accountInput(raw);
  if (!input) return fail(400, 'INVALID_REQUEST');
  const response = await fetch(`${input.baseUrl}/api/device-backups`, { headers: input.headers, cache: 'no-store', redirect: 'error' });
  if (!response.ok) return fail(502, 'DEVICE_BACKUP_FAILED');
  return [200, await response.json()];
}

async function handle(path: string, method: string, raw: string | undefined): Promise<Reply> {
  if (path === '/device-copy' && method === 'POST') return copyAccountSave(raw);
  if (path === '/device-backups/restore' && method === 'POST') return copyAccountSave(raw, true);
  if (path === '/device-backups/upload' && method === 'POST') return backupDeviceSave(raw);
  if (path === '/device-backups/list' && method === 'POST') return listAccountBackups(raw);
  const url = new URL(path, 'https://local.invalid');
  if (url.pathname === '/api/saves' && method === 'GET') {
    return transaction('readonly', async tx => {
      const saves = await request<Save[]>(tx.objectStore('saves').getAll());
      return [200, { items: saves.filter(s => s.revision !== '0').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }];
    });
  }
  if (url.pathname === '/api/game-creations' && method === 'POST') {
    const { creationId, mode } = JSON.parse(raw ?? '{}');
    if (typeof creationId !== 'string' || !/^[\w-]{1,128}$/.test(creationId) || (mode !== 'CAREER' && mode !== 'CLUB')) return fail(400, 'INVALID_REQUEST');
    const id = `local-${creationId}`;
    return transaction('readwrite', async tx => {
      const saves = tx.objectStore('saves');
      const current: Save | undefined = await request(saves.get(id));
      if (current && current.mode !== mode) return fail(409, 'COMMAND_ID_REUSED');
      if (!current) {
        const partCount = await writeState(tx.objectStore('states'), id, createEmptyGameState(creationId), 0);
        saves.add({ id, mode, revision: '0', phase: 'BOOT', summary: { creationId }, updatedAt: new Date().toISOString(), partCount } satisfies Save, id);
      }
      return [200, { saveId: id, revision: current?.revision ?? '0' }];
    });
  }
  const match = /^\/api\/saves\/([^/]+)\/(career|screens\/[^/]+|commands)$/.exec(url.pathname);
  if (!match) return fail(404, 'NOT_FOUND');
  const id = decodeURIComponent(match[1]!);
  const endpoint = match[2]!;
  if (endpoint === 'commands' && method !== 'POST' || endpoint !== 'commands' && method !== 'GET') return fail(404, 'NOT_FOUND');
  return transaction(endpoint === 'commands' ? 'readwrite' : 'readonly', async tx => {
    const saves = tx.objectStore('saves'), states = tx.objectStore('states');
    const save: Save | undefined = await request(saves.get(id));
    if (!save) return fail(404, 'SAVE_NOT_FOUND');
    if (endpoint === 'career') return [200, gameCareerView(id, await readState(states, save), save.revision)];
    if (endpoint.startsWith('screens/')) {
      return [200, gameScreenView(id, await readState(states, save), save.revision, endpoint.slice(8), Object.fromEntries(url.searchParams))];
    }
    const command: CommandBody = JSON.parse(raw ?? '{}');
    if (typeof command.commandId !== 'string' || !command.commandId || typeof command.type !== 'string') return fail(400, 'INVALID_REQUEST');
    const receipts = tx.objectStore('receipts'), key = [id, command.commandId];
    const prior: Receipt | undefined = await request(receipts.get(key));
    const intent = JSON.stringify([String(command.expectedRevision), command.type, command.payload]);
    if (prior) return prior.intent === intent ? [200, prior.value] : fail(409, 'COMMAND_ID_REUSED');
    if (String(command.expectedRevision) !== save.revision) return [409, { code: 'REVISION_CONFLICT', currentRevision: save.revision }];
    const applied = applyEngineCommand(await readState(states, save), command);
    const revision = (BigInt(save.revision) + 1n).toString();
    const value = { revision, summary: applied.summary, ...(applied.next ? { next: applied.next } : {}) };
    const partCount = await writeState(states, id, applied.nextState, save.partCount);
    saves.put({ ...save, partCount, phase: applied.phase, revision, summary: { ...save.summary, ...applied.summary }, updatedAt: new Date().toISOString() }, id);
    receipts.add({ intent, value } satisfies Receipt, key);
    return [200, value];
  });
}

self.addEventListener('message', async ({ data }: MessageEvent<{ id: number; path: string; method: string; body?: string }>) => {
  let reply: Reply;
  try { reply = await handle(data.path, data.method, data.body); }
  catch (error) {
    const code = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'LOCAL_GAME_ERROR';
    reply = fail(400, code);
  }
  self.postMessage({ id: data.id, reply });
});
