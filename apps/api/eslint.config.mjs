import { fileURLToPath } from 'node:url';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default [
  {
    ignores: ['dist/**', 'generated/**', 'node_modules/**'],
  },
  ...typescriptEslint.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
