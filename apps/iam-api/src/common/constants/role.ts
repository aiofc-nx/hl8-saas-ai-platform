import { z } from 'zod';

/**
 * Zod 模式，用于验证用户角色。
 *
 * @description 仅接受 'ADMIN' 或 'USER' 作为有效的角色值。
 */
export const roleSchema = z.enum(['ADMIN', 'USER']);

/**
 * 表示有效用户角色的类型。
 *
 * @type {'ADMIN' | 'USER'} Role
 */
export type Role = z.infer<typeof roleSchema>;
