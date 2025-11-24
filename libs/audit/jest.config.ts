export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock @hl8/exceptions 模块，使用 tests/__mocks__ 目录下的 mock 文件
    '^@hl8/exceptions$': '<rootDir>/tests/__mocks__/exceptions.js',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
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
  transformIgnorePatterns: [
    'node_modules/(?!(@repo|@hl8|@nestjs|class-transformer|class-validator|reflect-metadata)/)',
  ],
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../../coverage/libs/audit',
  passWithNoTests: true,
};
