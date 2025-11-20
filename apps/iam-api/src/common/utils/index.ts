export const isEmptyObj = (obj: object) =>
  Object.keys(obj).length === 0 && obj.constructor === Object;

export const concatStr = (
  strings: (number | string)[],
  divider?: string,
): string => strings.join(divider ?? ' ');

export const getRandomInt = (min: number, max: number) => {
  const minCelled = Math.ceil(min),
    maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCelled) + minCelled); // The maximum is exclusive and the minimum is inclusive
};

/**
 * 从邮箱地址提取用户名。
 *
 * @description 从邮箱地址中提取用户名部分，并移除末尾的数字。
 * 如果移除数字后为空字符串，则返回原始用户名。
 *
 * @param {string} email - 邮箱地址。
 * @returns {string} 提取的用户名。
 *
 * @example
 * ```typescript
 * extractName('john.doe@example.com'); // 'john.doe'
 * extractName('user123@example.com'); // 'user'
 * extractName('123456@example.com'); // '123456' (如果全是数字，返回原值)
 * ```
 */
export function extractName(email: string): string {
  const username = email.split('@')[0];
  const nameWithoutNumbers = username.replace(/\d+$/, '');
  // 如果移除数字后为空，返回原始用户名
  return nameWithoutNumbers || username;
}

export const generateRefreshTime = async (day = 3): Promise<string> => {
  const threeDays = day * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  const refreshTime = new Date(Date.now() + threeDays);
  return refreshTime.toISOString();
};

export * from './amazon-s3';
export * from './file';
export * from './file-s3';
export * from './hashString';
export * from './otp';
export * from './validateEnv';
