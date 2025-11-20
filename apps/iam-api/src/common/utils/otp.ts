import { randomInt } from 'crypto';

/**
 * 生成指定长度的数字一次性密码（OTP）。
 *
 * @description 使用 Node.js crypto 模块的 randomInt 方法生成安全的随机数字。
 *
 * @param {number} [length=6] - 要生成的 OTP 长度。
 * @returns {Promise<string>} 解析为生成的 OTP（零填充字符串）的 Promise。
 */
export const generateOTP = async (length = 6): Promise<string> => {
  return randomInt(0, 10 ** length)
    .toString()
    .padStart(length, '0');
};
