import { Session } from '@/features/auth/entities/session.entity';
import { User } from '@/features/users/entities/user.entity';

/**
 * 通用消息响应接口。
 *
 * @property {string} message - 响应消息。
 */
export interface MessageResponse {
  message: string;
}

/**
 * 登录响应接口，包含用户数据和认证令牌。
 *
 * @property {string} message - 响应消息。
 * @property {Omit<User, 'password' | 'sessions'>} data - 用户数据（排除敏感字段）。
 * @property {{ access_token: string; refresh_token: string }} tokens - 认证令牌。
 */
export interface SignInResponse {
  message: string;
  data: Omit<User, 'password' | 'sessions'>;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * 会话列表响应接口。
 *
 * @property {Session[]} data - 会话实体列表。
 */
export interface SessionsResponse {
  data: Session[];
}

/**
 * 单个会话响应接口。
 *
 * @property {Session} data - 会话实体。
 */
export interface SessionResponse {
  data: Session;
}

/**
 * 刷新令牌响应接口。
 *
 * @property {string} message - 响应消息。
 * @property {string} access_token - 新的访问令牌。
 * @property {string} refresh_token - 新的刷新令牌。
 * @property {string} access_token_refresh_time - 访问令牌过期或刷新时间。
 * @property {string} session_token - 会话令牌。
 */
export interface RefreshTokenResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  access_token_refresh_time: string;
  session_token: string;
}

/**
 * 认证令牌接口。
 *
 * @property {string} access_token - 访问令牌。
 * @property {string} refresh_token - 刷新令牌。
 */
export interface AuthTokensInterface {
  access_token: string;
  refresh_token: string;
}

/**
 * 登录用户响应接口。
 *
 * @property {User} data - 用户实体。
 * @property {{
 *   session_token: string;
 *   access_token: string;
 *   refresh_token: string;
 *   session_refresh_time: string;
 * }} tokens - 认证和会话令牌。
 */
export interface LoginUserInterface {
  data: User;
  tokens: {
    session_token: string;
    access_token: string;
    refresh_token: string;
    session_refresh_time: string;
  };
}

/**
 * 刷新令牌详情接口。
 *
 * @property {string} access_token - 访问令牌。
 * @property {string} refresh_token - 刷新令牌。
 * @property {string} access_token_refresh_time - 访问令牌刷新时间。
 * @property {string} session_token - 会话令牌。
 */
export interface RefreshTokenInterface {
  access_token: string;
  refresh_token: string;
  access_token_refresh_time: string;
  session_token: string;
}

/**
 * 注册用户响应接口。
 *
 * @property {User} data - 注册的用户实体。
 */
export interface RegisterUserInterface {
  data: User;
}
