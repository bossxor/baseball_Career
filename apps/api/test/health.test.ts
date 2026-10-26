import assert from 'node:assert/strict';
import test from 'node:test';
import { app } from '../src/app.js';
import { json } from './json.js';

test('liveness exposes no save, secret or database readiness claim', async () => {
  const response = await app.request('/api/health');
  assert.equal(response.status, 200);
  const body = await json<{ status: string; service: string; rulesVersion: string; auth: string }>(response);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'playball-api');
  assert.equal(body.rulesVersion, '1.0.0');
  assert.ok(['none', 'dev', 'neon'].includes(body.auth));
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
