export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock @hl8/exceptions 模块，使用 tests/__mocks__ 目录下的 mock 文件
    '^@hl8/exceptions$': '<rootDir>/tests/__mocks__/exceptions.js',
    // Mock @hl8/logger 模块
    '^@hl8/logger$': '<rootDir>/tests/__mocks__/logger.js',
    // 映射工作区依赖到源文件（允许 Jest 转换它们）
    '^@hl8/config$': '<rootDir>/../../libs/common/config/src/index.ts',
    '^@hl8/application-base$':
      '<rootDir>/../../libs/core/application-base/src/index.ts',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: '../../coverage/libs/data-isolation',
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
    'node_modules/(?!(@repo|@hl8|@nestjs|class-transformer|class-validator|reflect-metadata)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  // 显式指定 mock 目录
  roots: ['<rootDir>/src', '<rootDir>/tests'],
};
