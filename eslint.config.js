import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui primitives co-export their `cva` variants, and router.tsx
    // co-exports the route tree alongside local fallback components. These are
    // intentional non-component exports; disabling the fast-refresh-only rule
    // here avoids churning every import site.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/router.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
