import assert from 'node:assert/strict';
import test from 'node:test';
import { app } from '../src/app.js';

test('liveness exposes no save, secret or database readiness claim', async () => {
  const response = await app.request('/api/health');
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.service, 'playball-api');
  assert.equal(json.rulesVersion, '1.0.0');
  assert.ok(['none', 'dev', 'neon'].includes(json.auth));
});

test('game writes without db stay unavailable', async () => {
  const response = await app.request('/api/saves/x/commands', {
    method: 'POST',
    headers: { Authorization: 'Bearer dev:nobody', 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandId: 'c1', expectedRevision: 0, type: 'ALLOCATE_DEMO', payload: {} }),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'SERVICE_UNAVAILABLE');
});
