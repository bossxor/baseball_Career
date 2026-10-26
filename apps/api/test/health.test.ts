import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDb } from '@playball/db';
import { APP_VERSION, SCHEMA_VERSION, app, createApp } from '../src/app.js';
import { json } from './json.js';

test('liveness exposes no save, secret or database readiness claim', async () => {
  const response = await app.request('/api/health');
  assert.equal(response.status, 200);
  const body = await json<{ status: string; service: string; rulesVersion: string; auth: string }>(response);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'playball-api');
  assert.equal(body.rulesVersion, '1.0.0');
  assert.ok(['none', 'dev', 'neon'].includes(body.auth));
  assert.equal(JSON.stringify(body).includes('postgres'), false);
});

test('version is public and secret-free', async () => {
  const response = await app.request('/api/version');
  assert.equal(response.status, 200);
  const body = await json<{
    app: string;
    api: string;
    rulesVersion: string;
    schemaVersion: number;
    minClientVersion: string;
  }>(response);
  assert.equal(body.app, APP_VERSION);
  assert.equal(body.schemaVersion, SCHEMA_VERSION);
  assert.equal(body.rulesVersion, '1.0.0');
});

test('ready without db is 503', async () => {
  const response = await app.request('/api/ready');
  assert.equal(response.status, 503);
  assert.equal((await json<{ status: string; reason: string }>(response)).reason, 'db.unavailable');
});

test('ready with db reports schemaCompatible', async () => {
  const { db, client } = await createTestDb();
  try {
    const response = await createApp({ db, auth: { allowDevBearer: true } }).request('/api/ready');
    assert.equal(response.status, 200);
    const body = await json<{ status: string; schemaCompatible: boolean }>(response);
    assert.equal(body.status, 'ready');
    assert.equal(body.schemaCompatible, true);
  } finally {
    await client.close();
  }
});

test('game writes without db stay unavailable', async () => {
  const response = await app.request('/api/saves/x/commands', {
    method: 'POST',
    headers: { Authorization: 'Bearer dev:nobody', 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandId: 'c1', expectedRevision: 0, type: 'ALLOCATE_DEMO', payload: {} }),
  });
  assert.equal(response.status, 503);
  assert.equal((await json<{ code: string }>(response)).code, 'SERVICE_UNAVAILABLE');
});
