import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { FileService } from './file.service';

// Mock 工具函数模块
jest.mock('@/common/utils/file', () => ({
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  deleteFiles: jest.fn(),
}));

jest.mock('@/common/utils/file-s3', () => ({
  saveFileToS3: jest.fn(),
}));

import * as fileUtils from '@/common/utils/file';
import * as s3Utils from '@/common/utils/file-s3';

/**
 * FileService 的单元测试套件。
 *
 * @description 测试文件服务的核心功能，包括：
 * - 文件上传（本地和 S3）
 * - 文件删除（本地和 S3）
 * - 批量文件操作
 */
describe('FileService', () => {
  let service: FileService;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // 创建模拟的 ConfigService
    configService = {
      get: jest.fn().mockReturnValue('public'), // 默认使用 public
    } as unknown as jest.Mocked<ConfigService>;

    // 创建模拟的 Logger
    logger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('应该在公共文件系统模式下使用本地存储', async () => {
      // 准备测试数据
      const storageFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
      } as any;
      const options = { fileName: 'test' };
      const expectedResult = {
        filename: 'test.png',
        filepath: 'test.png',
      };

      configService.get.mockReturnValue('public');
      // 重新创建服务实例以应用新的配置
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          { provide: ConfigService, useValue: configService },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get<FileService>(FileService);
      
      jest.spyOn(fileUtils, 'saveFile').mockResolvedValue(expectedResult);

      // 执行测试
      const result = await service.uploadFile(storageFile, options);

      // 验证结果
      expect(result).toEqual(expectedResult);
      expect(fileUtils.saveFile).toHaveBeenCalledWith(storageFile, options);
      expect(s3Utils.saveFileToS3).not.toHaveBeenCalled();
    });

    it('应该在 S3 文件系统模式下使用 S3 存储', async () => {
      // 准备测试数据
      const storageFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
      } as any;
      const options = { fileName: 'test' };
      const expectedResult = {
        filename: 'test.png',
        filepath: 'test.png',
      };

      configService.get.mockReturnValue('s3');
      // 重新创建服务实例以应用新的配置
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          { provide: ConfigService, useValue: configService },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get<FileService>(FileService);
      
      jest.spyOn(s3Utils, 'saveFileToS3').mockResolvedValue(expectedResult);

      // 执行测试
      const result = await service.uploadFile(storageFile, options);

      // 验证结果
      expect(result).toEqual(expectedResult);
      expect(s3Utils.saveFileToS3).toHaveBeenCalledWith(storageFile, options);
      expect(fileUtils.saveFile).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('应该在公共文件系统模式下删除本地文件', async () => {
      // 准备测试数据
      const filePath = 'test.png';

      configService.get.mockReturnValue('public');
      // 重新创建服务实例以应用新的配置
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          { provide: ConfigService, useValue: configService },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get<FileService>(FileService);
      
      jest.spyOn(fileUtils, 'deleteFile').mockResolvedValue(undefined);

      // 执行测试
      await service.deleteFile(filePath);

      // 验证结果
      expect(fileUtils.deleteFile).toHaveBeenCalledWith(filePath);
    });

    it('应该在删除失败时抛出 BadRequestException', async () => {
      // 准备测试数据
      const filePath = 'test.png';
      const error = new Error('删除失败');

      configService.get.mockReturnValue('public');
      // 重新创建服务实例以应用新的配置
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          { provide: ConfigService, useValue: configService },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get<FileService>(FileService);
      
      jest.spyOn(fileUtils, 'deleteFile').mockRejectedValue(error);

      // 执行测试并验证异常
      await expect(service.deleteFile(filePath)).rejects.toThrow(
        '删除失败',
      );
      expect(logger.error).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteFiles', () => {
    it('应该在公共文件系统模式下批量删除本地文件', async () => {
      // 准备测试数据
      const filePaths = ['test1.png', 'test2.png'];
      const settledResults = [
        { status: 'fulfilled' as const, value: undefined },
        { status: 'fulfilled' as const, value: undefined },
      ];

      configService.get.mockReturnValue('public');
      // 重新创建服务实例以应用新的配置
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          { provide: ConfigService, useValue: configService },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get<FileService>(FileService);
      
      jest.spyOn(fileUtils, 'deleteFiles').mockResolvedValue(settledResults);

      // 执行测试
      await service.deleteFiles(filePaths);

      // 验证结果
      expect(fileUtils.deleteFiles).toHaveBeenCalledWith(filePaths);
    });

    it('应该在批量删除失败时抛出 BadRequestException', async () => {
      // 准备测试数据
      const filePaths = ['test1.png', 'test2.png'];
      const error = new Error('批量删除失败');

      configService.get.mockReturnValue('public');
      // 重新创建服务实例以应用新的配置
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          { provide: ConfigService, useValue: configService },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get<FileService>(FileService);
      
      // deleteFiles 使用 Promise.allSettled，不会抛出异常，但我们可以模拟其他错误场景
      jest.spyOn(fileUtils, 'deleteFiles').mockImplementation(() => {
        throw error;
      });

      // 执行测试并验证异常
      await expect(service.deleteFiles(filePaths)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(error);
    });
  });
});
