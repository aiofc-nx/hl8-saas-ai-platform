import { Public } from '@/common/decorators';
import { FileService } from '@/features/file/file.service';
import type { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { FileInterceptor, UploadedFile } from '@blazity/nest-file-fastify';
import { Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * 用户控制器，用于管理用户相关的操作。
 *
 * @description 提供以下端点：
 * - 获取所有用户列表
 * - 根据标识符获取单个用户
 * - 测试文件上传功能
 */
@Controller('users')
export class UsersController {
  /**
   * 创建 UsersController 实例。
   *
   * @param {UsersService} usersService - 用户相关操作的服务。
   * @param {FileService} fileService - 文件相关操作的服务。
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly fileService: FileService,
  ) {}

  /**
   * 获取所有用户。
   *
   * @description 获取系统中所有用户的列表，返回的数据不包含密码字段。
   *
   * @returns {Promise<{ message: string; data: any[] }>} 包含消息和用户数据数组的对象（不包含密码）。
   */
  @Public()
  @Get()
  async findAll(): Promise<{ message: string; data: unknown[] }> {
    const users = await this.usersService.findAll();
    const data = users.map(({ password: _password, ...user }) => ({
      ...user,
    }));
    return { message: 'Users fetched successfully', data };
  }

  /**
   * 根据标识符获取单个用户。
   *
   * @description 根据用户名或 ID 查找并返回单个用户信息，返回的数据不包含密码字段。
   *
   * @param {string} identifier - 用户的标识符（例如：ID 或用户名）。
   * @returns {Promise<{ message: string; data: unknown }>} 包含消息和用户数据的对象（不包含密码）。
   * @throws {NotFoundException} 如果用户不存在。
   */
  @Public()
  @Get(':identifier')
  async findOne(
    @Param('identifier') identifier: string,
  ): Promise<{ message: string; data: unknown }> {
    const user = await this.usersService.findOne(identifier);
    const { password: _password, ...data } = user;
    return { message: 'User fetched successfully', data };
  }

  /**
   * 文件上传测试端点。
   *
   * @description 用于测试文件上传功能，接收文件并上传到配置的存储系统（本地或 S3）。
   *
   * @param {MemoryStorageFile} file - 上传的文件。
   * @returns 文件上传结果，包含文件 URL 等信息。
   */
  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async fileTesting(
    @UploadedFile()
    file: MemoryStorageFile,
  ) {
    const upFile = await this.fileService.uploadFile(file);
    return upFile;
  }
}
