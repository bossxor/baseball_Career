import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'docs/design');
const files = readdirSync(directory).filter(name => /^verify-.*\.mjs$/.test(name)).sort();
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(directory, file)], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`PASS: ${files.length} static design validators. These are not runtime game tests.`);
