import { serve } from '@hono/node-server';
import { createDbFromUrl } from '@playball/db';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid PORT');
/** 0.0.0.0 for remote HTTPS reverse-proxy; set HOST=127.0.0.1 for local-only. */
const hostname = process.env.HOST?.trim() || '0.0.0.0';

const databaseUrl = process.env.DATABASE_URL;
const app = databaseUrl ? createApp({ db: createDbFromUrl(databaseUrl).db }) : createApp();

const server = serve({ fetch: app.fetch, hostname, port }, info => {
  console.log(`Playball API listening on http://${hostname}:${info.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close();
  });
}
