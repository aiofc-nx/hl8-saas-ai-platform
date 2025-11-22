/**
 * 会话验证器接口，用于验证刷新令牌对应的会话是否存在。
 *
 * @description 可选的会话验证功能，允许应用层实现自定义的会话验证逻辑。
 * 如果应用不需要会话验证（仅验证 JWT 令牌），可以不提供此实现。
 *
 * @example
 * ```typescript
 * // 实现会话验证器
 * @Injectable()
 * export class SessionVerifierService implements SessionVerifier {
 *   constructor(
 *     @InjectRepository(Session)
 *     private sessionRepository: EntityRepository<Session>,
 *   ) {}
 *
 *   async verifySession(token: string, userId: string): Promise<boolean> {
 *     const session = await this.sessionRepository.findOne({
 *       refresh_token: token,
 *       user: userId,
 *     });
 *     return !!session;
 *   }
 * }
 * ```
 */
export interface SessionVerifier {
  /**
   * 验证会话是否存在。
   *
   * @description 检查给定的刷新令牌和用户 ID 是否对应有效的会话记录。
   *
   * @param {string} token - 刷新令牌
   * @param {string} userId - 用户 ID
   * @returns {Promise<boolean>} 如果会话存在返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const isValid = await sessionVerifier.verifySession(
   *   'refresh-token-here',
   *   'user-id-here'
   * );
   * ```
   */
  verifySession(token: string, userId: string): Promise<boolean>;
}
