import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid PORT');

const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port }, info => {
  console.log(`Playball API listening on http://127.0.0.1:${info.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { server.close(); });
}
