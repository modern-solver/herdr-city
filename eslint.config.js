/**
 * Purpose: ESLint flat config for src, test and scripts.
 * Owner: builder-grok
 */
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['web/**', 'page/**', 'node_modules/**', 'docs/**', 'fixtures/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'test/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  prettier,
];
