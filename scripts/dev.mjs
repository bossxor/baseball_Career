import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Start with npm run dev');
const build = spawnSync(process.execPath, [npmCli, 'run', 'build', '--workspace', '@playball/rules'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const api = spawn(process.execPath, [fileURLToPath(import.meta.resolve('tsx/cli')), 'watch', 'apps/api/src/server.ts'], { cwd: root, stdio: 'inherit' });
const web = await createServer({ root: fileURLToPath(new URL('../apps/web', import.meta.url)), server: { host: '127.0.0.1' } });
await web.listen();
web.printUrls();
async function shutdown() {
  api.kill();
  await web.close();
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void shutdown(); });
api.once('exit', code => { void web.close(); process.exitCode = code ?? 1; });
api.once('error', error => { console.error(error.message); void shutdown(); process.exitCode = 1; });
