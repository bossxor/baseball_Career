import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
