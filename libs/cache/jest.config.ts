export default {
  displayName: '@hl8/cache',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@hl8/exceptions$': '<rootDir>/tests/__mocks__/exceptions.js',
    '^@hl8/logger$': '<rootDir>/tests/__mocks__/logger.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@anchan828/nest-redlock$': '<rootDir>/src/testing/redlock.mock.ts',
    '^@anchan828/nest-redlock/dist/cjs/redlock.service.js$':
      '<rootDir>/src/testing/redlock.mock.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@repo|@hl8|@anchan828/nest-redlock|redlock|@nestjs|class-transformer|class-validator|reflect-metadata)/)',
  ],
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
    '^.+\\.js$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'NodeNext',
          moduleResolution: 'nodenext',
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  coverageDirectory: '../../coverage/libs/cache',
  testMatch: ['**/*.spec.ts'],
  passWithNoTests: true,
};
