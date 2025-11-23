/**
 * 表示有效用户角色的类型。
 *
 * @description 泛型角色类型，支持不同项目定义不同的角色类型。
 * 默认情况下为字符串类型，项目可以扩展为具体的联合类型。
 *
 * @type {string} Role
 * @example
 * ```typescript
 * // 使用默认角色类型
 * type Role = string;
 *
 * // 或定义具体角色类型
 * type Role = 'ADMIN' | 'USER' | 'GUEST';
 * ```
 */
export type Role = string;
