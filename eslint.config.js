import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nx from '@nx/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // 1. Nx’s flat presets
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],

  // 2. Custom ignores
  {
    ignores: [
      '**/dist',
      '**/node_modules/**',
      '**/build/**',
      '**/coverage/**',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },

  // 3. Monorepo module-boundary enforcement
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },

  // 4. All React+TS “goodies”
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['tsconfig.base.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        // 1) typescript paths from tsconfig.base.json
        typescript: {
          project: ['tsconfig.base.json'],
          alwaysTryTypes: true,
        },
        // 2) fall back to the default Node resolution for packages
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
          moduleDirectory: ['node_modules'],
        },
      },
    },
    rules: {
      // — TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-this-alias': 'off',

      // — Imports
      'import/no-unresolved': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
