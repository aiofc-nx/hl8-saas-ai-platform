'use server';

import { safeFetch } from '@/lib/safeFetch';
import {
  GetAllUsers,
  GetAllUsersSchema,
  GetUserSchema,
  User,
} from '@/types/user.type';

/**
 * @description 获取所有用户列表
 * @returns 返回所有用户数据，如果请求失败则返回空数组
 * @remarks 使用 'no-store' 缓存策略，确保每次请求都获取最新数据
 */
export const getAllUsers = async (): Promise<GetAllUsers> => {
  const [isError, data] = await safeFetch(GetAllUsersSchema, '/users', {
    cache: 'no-store',
  });
  if (isError)
    return {
      data: [],
    };
  return data;
};

/**
 * @description 通过标识符（邮箱或用户名）获取用户信息
 * @param identifier - 用户标识符，可以是邮箱地址或用户名
 * @returns 返回用户对象，如果请求失败或用户不存在则返回 null
 * @remarks
 * - 使用 'no-store' 缓存策略，确保每次请求都获取最新数据
 * - 如果请求失败，会在控制台输出错误信息
 */
export const getUser = async (identifier: string): Promise<User | null> => {
  const [error, data] = await safeFetch(GetUserSchema, `/users/${identifier}`, {
    cache: 'no-store',
  });
  if (error) {
    console.log('Get user error', error);
    return null;
  }
  return data.data;
};
