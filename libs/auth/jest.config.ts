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
        tsconfig: {
          module: 'NodeNext',
          moduleResolution: 'nodenext',
        },
      },
    ],
  },
};
