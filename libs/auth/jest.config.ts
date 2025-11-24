export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock @hl8/exceptions 模块，使用 tests/__mocks__ 目录下的 mock 文件
    '^@hl8/exceptions$': '<rootDir>/tests/__mocks__/exceptions.js',
    // Mock auth-config.interface 模块
    '^(\\.{1,2}/.*)/interfaces/auth-config\\.interface\\.js$':
      '<rootDir>/tests/__mocks__/interfaces/auth-config.interface.js',
    // 映射工作区依赖
    '^@hl8/application-base$':
      '<rootDir>/../../libs/core/application-base/src/index.ts',
    '^@hl8/application-base/(.*)$':
      '<rootDir>/../../libs/core/application-base/src/$1',
    '^@hl8/domain-base$': '<rootDir>/../../core/domain-base/src/index.ts',
    '^@hl8/domain-base/(.*)$': '<rootDir>/../../core/domain-base/src/$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: '../../coverage/libs/auth',
  coverageReporters: ['text', 'lcov', 'html'],
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
    'node_modules/(?!(@repo|@hl8|@nestjs|@casl|class-transformer|class-validator|reflect-metadata)/)',
  ],
  passWithNoTests: true,
};
