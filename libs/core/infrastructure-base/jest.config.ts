import type { Config } from 'jest';

const config: Config = {
  displayName: '@hl8/infrastructure-base',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@hl8/exceptions$': '<rootDir>/../../common/exceptions/src/index.ts',
    '^@hl8/logger$': '<rootDir>/../../common/logger/src/index.ts',
    '^@hl8/config$': '<rootDir>/../../common/config/src/index.ts',
    '^@hl8/cache$': '<rootDir>/../../cache/src/index.ts',
    '^@hl8/bootstrap$': '<rootDir>/../../bootstrap/src/index.ts',
    '^@hl8/mikro-orm-nestjs$': '<rootDir>/../../mikro-orm-nestjs/src/index.ts',
    '^@hl8/async-storage$': '<rootDir>/../../async-storage/src/index.ts',
    '^@hl8/swagger$': '<rootDir>/../../common/swagger/src/index.ts',
    '^@hl8/multi-tenancy$': '<rootDir>/../../multi-tenancy/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.test.json',
        diagnostics: {
          warnOnly: true,
          ignoreCodes: [151002],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: '../../../coverage/libs/infrastructure-base',
  coverageProvider: 'v8',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@repo|class-transformer|class-validator|reflect-metadata)/)',
  ],
  passWithNoTests: true,
};

export default config;
