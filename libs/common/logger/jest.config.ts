export default {
  displayName: '@hl8/logger',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
        },
        diagnostics: {
          warnOnly: true,
          ignoreCodes: [151002],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/logger',
  testMatch: ['**/*.spec.ts'],
  passWithNoTests: true,
};
