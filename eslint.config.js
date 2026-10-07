import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,

  // ── Project-wide rule overrides ──────────────────────────────────────────
  {
    rules: {
      // Empty catch blocks are intentional throughout this codebase (silent error handling).
      'no-empty': ['error', { allowEmptyCatch: true }],
      // A template name with no matching import or prop crashes only at
      // render time (962cae9: formatDate in NewBookingPanel). Lint is the only
      // check CI runs, so catch it here.
      'vue/no-undef-properties': 'error',
    },
  },
])
