import { Role } from '../types/role.type.js';

/**
 * 用户接口，用于表示已认证的用户信息。
 *
 * @description 泛型用户接口，支持不同项目定义不同的用户类型和角色类型。
 * 所有认证守卫会将用户信息附加到请求对象，类型为 IUser。
 *
 * @template R 角色类型，默认为 Role
 * @property {string} id - 用户唯一标识符
 * @property {R} [role] - 用户角色（可选）
 * @property {[key: string]: any} - 其他用户属性
 *
 * @example
 * ```typescript
 * // 使用默认类型
 * interface User extends IUser {}
 *
 * // 使用具体角色类型
 * type MyRole = 'ADMIN' | 'USER';
 * interface User extends IUser<MyRole> {
 *   username: string;
 *   email: string;
 * }
 * ```
 */
export interface IUser<R extends Role = Role> {
  /**
   * 用户唯一标识符。
   *
   * @type {string}
   */
  id: string;

  /**
   * 用户角色（可选）。
   *
   * @type {R}
   */
  role?: R;

  /**
   * 其他用户属性。
   *
   * @type {unknown}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
