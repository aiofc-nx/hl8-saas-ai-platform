import { nestJsConfig } from '@repo/eslint-config/nest-js';
import globals from 'globals';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nestJsConfig,
  {
    ignores: ['dist/**', '**/*.js'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
