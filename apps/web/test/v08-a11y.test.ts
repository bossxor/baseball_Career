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
  assert.match(css, /body\s*\{[^}]*font-size:\s*(?:1rem|16px)\s*;/);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px\s+solid/);
  const buttonRule = css.match(/\.btn,\s*\.ghost,\s*\.save-card\s*\{([^}]+)\}/)?.[1];
  assert.ok(buttonRule);
  assert.match(buttonRule, /min-height:\s*48px\s*;/);
  assert.match(buttonRule, /min-width:\s*44px\s*;/);
  const choiceHeight = css.match(/\.choice\s*\{[^}]*min-height:\s*(\d+)px/)?.[1];
  assert.ok(Number(choiceHeight) >= 44);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.screen-title\s*\{[^}]*font-size:\s*clamp\(/);
});

test('V08-M4: Hangul IME composition is gated on S02 name submit', () => {
  assert.match(createSrc, /onCompositionStart/);
  assert.match(createSrc, /onCompositionEnd/);
  assert.match(createSrc, /if \(composing\) return/);
  assert.match(createSrc, /lang="ko"/);
});

test('V08-M4: Korean webfonts declared with font-display swap', () => {
  assert.match(css, /Pretendard/);
  assert.match(css, /font-display:\s*swap\s*;/);
});
