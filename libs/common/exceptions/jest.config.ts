export default {
  displayName: '@hl8/exceptions',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // 映射工作区依赖到源代码
    '^@hl8/logger$': '<rootDir>/../../common/logger/src/index.ts',
    '^@hl8/logger/(.*)$': '<rootDir>/../../common/logger/src/$1',
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
  coverageDirectory: '../../../coverage/libs/exceptions',
  testMatch: ['**/*.spec.ts'],
  passWithNoTests: true,
};
