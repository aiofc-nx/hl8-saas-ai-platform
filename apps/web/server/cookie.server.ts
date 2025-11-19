'use server';

import { cookies } from 'next/headers';

/**
 * @description 在服务器端响应中设置 Cookie
 * @param name - 要设置的 Cookie 名称
 * @param value - Cookie 的值
 * @remarks 如果无法获取 cookies 对象，则静默返回（不抛出错误）
 */
export const setCookie = async ({
  name,
  value,
}: {
  name: string;
  value: string;
}) => {
  const cookie = await cookies();
  if (!cookie) return;
  cookie.set({
    name,
    value,
  });
};
