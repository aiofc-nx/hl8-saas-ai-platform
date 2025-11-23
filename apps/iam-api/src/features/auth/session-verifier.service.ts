import { Session } from '@/features/auth/entities/session.entity';
import { SESSION_VERIFIER, SessionVerifier } from '@hl8/auth';
import { InjectRepository } from '@hl8/mikro-orm-nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

/**
 * 会话验证器服务，实现 SessionVerifier 接口。
 *
 * @description 用于验证刷新令牌对应的会话是否存在。
 * 通过查询数据库中的 Session 表来验证会话的有效性。
 */
@Injectable()
export class SessionVerifierService implements SessionVerifier {
  /**
   * 创建 SessionVerifierService 实例。
   *
   * @param sessionRepository - MikroORM 会话实体仓库，用于查询会话记录。
   */
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
  ) {}

  /**
   * 验证会话是否存在。
   *
   * @description 检查给定的刷新令牌和用户 ID 是否对应有效的会话记录。
   *
   * @param {string} token - 刷新令牌
   * @param {string} userId - 用户 ID
   * @returns {Promise<boolean>} 如果会话存在返回 true，否则返回 false
   */
  async verifySession(token: string, userId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      refresh_token: token,
      user: userId,
    });
    return !!session;
  }
}

/**
 * 会话验证器提供者。
 *
 * @description 用于在 NestJS 依赖注入容器中注册会话验证器服务。
 */
export const SessionVerifierProvider = {
  provide: SESSION_VERIFIER,
  useClass: SessionVerifierService,
};
