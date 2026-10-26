/** V12 shell: font OFL next to TTF; no committed secrets in env examples. */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = join(root, 'docs', 'design', 'assets', 'fonts');

const fonts = readdirSync(fontsDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
assert.ok(fonts.length >= 2, 'expected shipped fonts');
for (const file of fonts) {
  const base = file.replace(/\.(ttf|otf|woff2?)$/i, '');
  const oflCandidates = [
    join(fontsDir, `${base}-OFL.txt`),
    join(fontsDir, `${base.split('-')[0]}-OFL.txt`),
    join(fontsDir, 'OFL.txt'),
  ];
  // NotoSansKR-Variable → NotoSansKR-OFL; BlackHanSans-Regular → BlackHanSans-OFL
  const stem = base.replace(/-(Variable|Regular|Bold|Medium)$/i, '');
  oflCandidates.push(join(fontsDir, `${stem}-OFL.txt`));
  assert.ok(
    oflCandidates.some(existsSync),
    `missing OFL for ${file}`,
  );
  const oflPath = oflCandidates.find(existsSync);
  const ofl = readFileSync(oflPath, 'utf8');
  assert.match(ofl, /SIL Open Font License/i, `${oflPath} not OFL`);
}

const envExample = readFileSync(join(root, '.env.example'), 'utf8');
// Placeholder user:pass (PASS, xxx, change-me) OK; reject long random-looking secrets in URLs.
const liveCred = [...envExample.matchAll(/postgres(?:ql)?:\/\/[^:\s]+:([^@\s]+)@/gi)].map(m => m[1]);
for (const pass of liveCred) {
  assert.ok(
    /^(PASS|xxx|change[-_]?me|password|YOUR_.+|<.*>)$/i.test(pass) || pass.length < 8,
    `.env.example looks like a live DB password (${pass.slice(0, 4)}…)`,
  );
}
assert.doesNotMatch(envExample, /sk_live_|AKIA[0-9A-Z]{16}/);

const provenance = join(root, 'docs', 'implementation', 'asset-provenance.json');
assert.ok(existsSync(provenance), 'asset-provenance.json missing');
const list = JSON.parse(readFileSync(provenance, 'utf8'));
assert.ok(Array.isArray(list.fonts) && list.fonts.length >= 2);

console.log(`PASS: release assets — ${fonts.length} fonts with OFL, provenance ok.`);
