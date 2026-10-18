/**
 * Purpose: ESLint flat config for src, test, scripts and console UI.
 * Owner: builder-grok, builder-gemini
 */
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['web/**', 'page/build.js', 'page/src/0[1-6]*.js', 'node_modules/**', 'docs/**', 'fixtures/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'test/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['page/src/console-router.js', 'page/src/07-console.js', 'page/src/sessions-view.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        DEFAULT_TAB: 'readonly',
        VALID_MODES: 'readonly',
        parseHash: 'readonly',
        renderTabPanel: 'readonly',
        createPollingManager: 'readonly',
        updateConsoleTimestamp: 'readonly',
        POLL_INTERVAL_ACTIVE_MS: 'readonly',
        POLL_INTERVAL_HIDDEN_MS: 'readonly',
        setViewVisibility: 'readonly',
        closeCityConsolePanel: 'readonly',
        fetchSessions: 'readonly',
        renderSessionsView: 'readonly',
      },
    },
  },
  prettier,
];
