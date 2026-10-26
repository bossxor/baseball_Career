/**
 * Build web → Capacitor sync → assembleDebug.
 * Requires VITE_API_BASE=https://… (non-local). Debug keystore is Gradle default.
 * Capacitor 8 needs JDK 21+ (JAVA_HOME).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, 'apps', 'web');
const android = join(web, 'android');

function preferJdk21(env) {
  const next = { ...env };
  const candidates = [
    env.JAVA_HOME_21,
    'C:\\Program Files\\Microsoft\\jdk-21.0.12.101-hotspot',
    'C:\\Program Files\\Microsoft\\jdk-21',
  ].filter(Boolean);
  try {
    const ms = 'C:\\Program Files\\Microsoft';
    if (existsSync(ms)) {
      for (const name of readdirSync(ms)) {
        if (name.startsWith('jdk-21')) candidates.push(join(ms, name));
      }
    }
  } catch { /* ignore */ }
  for (const home of candidates) {
    if (home && existsSync(join(home, 'bin', process.platform === 'win32' ? 'javac.exe' : 'javac'))) {
      next.JAVA_HOME = home;
      next.PATH = `${join(home, 'bin')}${process.platform === 'win32' ? ';' : ':'}${env.PATH ?? ''}`;
      console.log(`Using JAVA_HOME=${home}`);
      return next;
    }
  }
  return next;
}

function run(cmd, args, cwd, env = process.env) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true, env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const env = preferJdk21(process.env);
run(process.execPath, [join(root, 'scripts', 'assert-android-api-base.mjs')], root, env);
run('npm', ['run', 'build', '--workspace', '@playball/web'], root, env);

if (!existsSync(join(android, 'app'))) {
  run('npx', ['cap', 'add', 'android'], web, env);
}
run('npx', ['cap', 'sync', 'android'], web, env);

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradlew, ['assembleDebug'], android, env);

const apk = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
console.log(existsSync(apk) ? `APK: ${apk}` : 'assembleDebug finished (check Gradle outputs)');
