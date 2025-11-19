import * as argon2 from 'argon2';

/**
 * 使用 Argon2id 算法对纯文本密码进行哈希。
 *
 * @description 使用 Argon2id 变体进行密码哈希，提供内存成本、时间成本和并行度配置。
 *
 * @param {string} password - 要哈希的纯文本密码。
 * @returns {Promise<string>} 哈希后的密码字符串。
 */
const hashString = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 8,
    timeCost: 5,
    parallelism: 1,
  });
};

/**
 * 比较纯文本密码与哈希密码。
 *
 * @description 使用 Argon2 验证纯文本密码是否与哈希密码匹配。
 *
 * @param {string} plainPassword - 要验证的纯文本密码。
 * @param {string} hashedPassword - 要比较的哈希密码。
 * @returns {Promise<boolean>} 如果密码匹配则返回 true，否则返回 false。
 */
const validateString = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
};

export { hashString, validateString };
