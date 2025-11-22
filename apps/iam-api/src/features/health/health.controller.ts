import { User } from '@/features/users/entities/user.entity';
import { Public } from '@hl8/auth/decorators';
import { InjectRepository } from '@hl8/mikro-orm-nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

/**
 * 健康检查控制器，用于检查各种系统组件的健康状态。
 *
 * @description 提供以下健康检查端点：
 * - 外部 HTTP 服务健康检查
 * - 数据库连接健康检查
 * - 磁盘存储健康检查
 * - 内存使用健康检查
 */
@Controller('health')
export class HealthController {
  /**
   * 创建 HealthController 实例。
   *
   * @param health - 执行健康检查的服务。
   * @param http - HTTP 健康指示器，用于外部服务检查。
   * @param disk - 磁盘存储健康指示器。
   * @param memory - 内存使用健康指示器。
   * @param userRepository - 用户仓库，用于获取 EntityManager。
   */
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  /**
   * 检查外部 HTTP 服务的健康状态。
   *
   * @description 通过 ping 外部 HTTP 服务检查其是否可访问。
   *
   * @returns HTTP ping 健康检查的结果。
   */
  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.http.pingCheck('aung pyae phyo', 'https://www.aungpyaephyo.com'),
    ]);
  }

  /**
   * 检查磁盘存储的健康状态。
   *
   * @description 检查磁盘存储空间使用情况，当使用率超过阈值（50%）时报告不健康。
   *
   * @returns 磁盘存储健康检查的结果。
   */
  @Public()
  @Get('disk')
  @HealthCheck()
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }

  /**
   * 检查堆内存使用情况。
   *
   * @description 检查堆内存使用量，当超过阈值（150MB）时报告不健康。
   *
   * @returns 内存堆健康检查的结果。
   */
  @Public()
  @Get('memory')
  @HealthCheck()
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  /**
   * 检查数据库连接的健康状态。
   *
   * @description 通过执行简单的 SQL 查询（SELECT 1）来检查数据库连接是否正常。
   *
   * @returns 数据库健康检查的结果。
   */
  @Public()
  @Get('database')
  @HealthCheck()
  async checkDatabase() {
    return this.health.check([
      async () => {
        try {
          const em = this.userRepository.getEntityManager();
          await em.getConnection().execute('SELECT 1');
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
    ]);
  }
}
