import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettier_plugin from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const default_ignores_pool = [
  '**/.git/**/*',
  '**/dist/**/*',
  '**/node_modules/**/*',
  '**/storage/**/*',
];

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nestJsConfig = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error', // 生产代码禁止 any
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // 参数以下划线开头时忽略
          varsIgnorePattern: '^_', // 变量以下划线开头时忽略
          caughtErrorsIgnorePattern: '^_', // 捕获的错误以下划线开头时忽略
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // 测试文件允许使用 any 等更宽松的规则
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prefer-const': 'off',
      'no-console': 'off',
    },
  },
  {
    ...prettier_plugin,
    name: 'prettier/recommended',
    ignores: [...default_ignores_pool],
  },
];
