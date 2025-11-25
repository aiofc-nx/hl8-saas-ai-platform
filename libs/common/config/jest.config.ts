export default {
  displayName: '@hl8/config',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/constants/app$': '<rootDir>/../../../packages/constants/app.ts',
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
  transformIgnorePatterns: [
    'node_modules/(?!(@repo|@hl8|@nestjs|class-transformer|class-validator|reflect-metadata)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  coverageDirectory: '../../../coverage/libs/config',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  passWithNoTests: true,
};
