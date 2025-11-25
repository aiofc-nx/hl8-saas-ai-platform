export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@hl8/config$': '<rootDir>/../../libs/common/config/src/index.ts',
    '^@repo/constants/app$': '<rootDir>/tests/__mocks__/repo-constants-app.js',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: '../../coverage/libs/mail',
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
    'node_modules/(?!(@repo|@hl8|@nestjs|@nestjs-modules|class-transformer|class-validator|reflect-metadata|nodemailer)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs'],
};
