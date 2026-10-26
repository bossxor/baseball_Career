import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
const createSrc = readFileSync(join(root, 'src/screens/Create.tsx'), 'utf8');

/** M4 slice of V08: automated static checks. Pixel/IME browser manual remains noted in M4-COMPLETE. */
test('V08-M4: touch targets ≥44px, focus ring, 16px body, reduced-motion', () => {
  assert.match(css, /font-size:16px/);
  assert.match(css, /:focus-visible\{outline:3px solid/);
  assert.match(css, /min-height:48px/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /min-width:44px/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /clamp\(1\.75rem/);
});

test('V08-M4: Hangul IME composition is gated on S02 name submit', () => {
  assert.match(createSrc, /onCompositionStart/);
  assert.match(createSrc, /onCompositionEnd/);
  assert.match(createSrc, /if \(composing\) return/);
  assert.match(createSrc, /lang="ko"/);
});

test('V08-M4: Korean webfonts declared with font-display swap', () => {
  assert.match(css, /NotoSansKR/);
  assert.match(css, /BlackHanSans/);
  assert.match(css, /font-display:swap/);
});
