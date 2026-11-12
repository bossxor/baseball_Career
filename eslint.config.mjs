import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: [
    '**/dist/**', '**/node_modules/**',
    'apps/web/android/app/build/**', 'apps/web/android/app/src/main/assets/public/**',
    '.prof-us*/**', 'apps/api/dbg-presses.test.ts', 'apps/api/edit-college.cjs',
    'apps/api/wire-kbo.cjs', 'packages/engine/test/_prof/**',
    'docs/implementation/evidence/**', 'zz-dbg.log',
  ] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files:['apps/web/src/**/*.ts','apps/web/src/**/*.tsx'], rules:{'no-restricted-imports':['error',{patterns:['@playball/engine','@playball/engine/*','@playball/api','@playball/db']}]} },
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  {
    files: ['packages/rules/src/**/*.ts', 'packages/engine/src/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'Date', 'fetch'],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Use an injected deterministic RNG.' }],
      'no-restricted-imports': ['error', { patterns: ['node:*', '@playball/api', '@playball/web'] }]
    }
  }
);
