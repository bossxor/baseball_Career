import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { preview } from 'vite';
import { app } from '../apps/api/dist/app.js';

let web;
const api = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0 });
try {
  if (!api.listening) await new Promise(resolve => api.once('listening', resolve));
  const address = api.address();
  assert.ok(address && typeof address === 'object');
  const apiUrl = `http://127.0.0.1:${address.port}`;
  web = await preview({
    root: fileURLToPath(new URL('../apps/web', import.meta.url)),
    preview: { host: '127.0.0.1', port: 0, proxy: { '/api': { target: apiUrl } } },
  });
  const webUrl = web.resolvedUrls.local[0];
  assert.ok(webUrl);
  const response = await fetch(webUrl);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<title>다시, 플레이볼</title>'));
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  assert.ok(assets.some(asset => asset.endsWith('.js')));
  assert.ok(assets.some(asset => asset.endsWith('.css')));
  for (const asset of assets) assert.equal((await fetch(new URL(asset, webUrl))).status, 200);
  const health = await fetch(new URL('/api/health', webUrl));
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', service: 'playball-api', rulesVersion: '1.0.0' });
  console.log(`PASS: built web HTML + ${assets.length} JS/CSS entry assets served over HTTP; web proxy → running API → rulesVersion 1.0.0.`);
  console.log('NOT TESTED: browser rendering, game simulation, authentication, database, storage or APK.');
} finally {
  if (web) await new Promise((resolve, reject) => web.httpServer.close(error => error ? reject(error) : resolve()));
  await new Promise((resolve, reject) => api.close(error => error ? reject(error) : resolve()));
}
