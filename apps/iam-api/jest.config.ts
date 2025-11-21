export default {
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../../../coverage/apps/iam-api',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
        },
        // 允许导入 .js 扩展名（NodeNext 模块系统要求）
        allowJs: true,
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@repo/constants/app$': '<rootDir>/../../../packages/constants/app.ts',
    // 映射 @hl8 包到源代码，避免使用编译后的 ESM 代码
    '^@hl8/exceptions$':
      '<rootDir>/../../../libs/common/exceptions/src/index.ts',
    '^@hl8/logger$': '<rootDir>/../../../libs/common/logger/src/index.ts',
    '^@hl8/config$': '<rootDir>/../../../libs/common/config/src/index.ts',
    '^@hl8/mikro-orm-nestjs$':
      '<rootDir>/../../../libs/mikro-orm-nestjs/src/index.ts',
    // 处理 @hl8 包内部的 .js 扩展名导入（NodeNext 模块系统要求）
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // 处理 @hl8 包中的相对路径 .js 导入
    '^@hl8/exceptions/(.*)\\.js$':
      '<rootDir>/../../../libs/common/exceptions/src/$1',
    '^@hl8/logger/(.*)\\.js$': '<rootDir>/../../../libs/common/logger/src/$1',
    '^@hl8/config/(.*)\\.js$': '<rootDir>/../../../libs/common/config/src/$1',
    '^@hl8/mikro-orm-nestjs/(.*)\\.js$':
      '<rootDir>/../../../libs/mikro-orm-nestjs/src/$1',
  },
  transformIgnorePatterns: [
    // 排除 node_modules，但包含 @repo 和 @hl8 包进行转换
    'node_modules/(?!(@repo|@hl8)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
