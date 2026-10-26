/** Static M8 shell checks — no Gradle. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, 'apps', 'web');
const cap = readFileSync(join(web, 'capacitor.config.ts'), 'utf8');
assert.match(cap, /APP_ID\s*=\s*'kr\.againplayball\.app'/);
assert.match(cap, /appId:\s*APP_ID/);
assert.match(cap, /appName:\s*'다시플레이볼'/);

const gradle = join(web, 'android', 'app', 'build.gradle');
assert.ok(existsSync(gradle), 'android project missing — run cap add android');
const g = readFileSync(gradle, 'utf8');
assert.match(g, /applicationId\s+"kr\.againplayball\.app"/);

const activity = join(web, 'android', 'app', 'src', 'main', 'java', 'kr', 'againplayball', 'app', 'MainActivity.java');
assert.ok(existsSync(activity), 'MainActivity missing');

console.log('PASS: M8 Android shell — appId kr.againplayball.app, Cap project present.');
