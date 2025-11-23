/**
 * Mock AuthConfig 接口，用于测试环境。
 *
 * @description 由于接口在运行时不存在，我们导出一个类型定义。
 * 实际使用时，Jest 会使用对应的 .js 文件来提供运行时导出。
 */
export type AuthConfig = {
  accessTokenSecret: string;
  accessTokenExpiration: string | number;
  refreshTokenSecret: string;
  refreshTokenExpiration: string | number;
  extractUserFromPayload?: (payload: unknown) => unknown;
};
