import assert from 'node:assert/strict';
import test from 'node:test';
import { app } from '../src/app.js';

test('liveness exposes no save, secret or database readiness claim', async () => {
  const response = await app.request('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'playball-api', rulesVersion: '1.0.0' });
});

test('game writes are unavailable until their authenticated pipeline exists', async () => {
  const response = await app.request('/api/game-creations', { method: 'POST' });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { code: 'NOT_FOUND' });
});
