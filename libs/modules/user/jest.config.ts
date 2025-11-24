export default {
  displayName: '@hl8/user',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/constants/app$': '<rootDir>/../../../packages/constants/app.ts',
    '^@hl8/application-base$':
      '<rootDir>/../../core/application-base/src/index.ts',
    '^@hl8/application-base/(.*)$':
      '<rootDir>/../../core/application-base/src/$1',
    '^@hl8/domain-base$': '<rootDir>/../../core/domain-base/src/index.ts',
    '^@hl8/domain-base/(.*)$': '<rootDir>/../../core/domain-base/src/$1',
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
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../../coverage/libs/user',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  transformIgnorePatterns: [
    'node_modules/(?!(@repo|@hl8|@casl|class-transformer|class-validator|reflect-metadata)/)',
  ],
  passWithNoTests: true,
};
