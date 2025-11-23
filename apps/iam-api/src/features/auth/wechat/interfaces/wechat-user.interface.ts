/**
 * 微信用户信息接口。
 *
 * @description 从微信开放平台获取的用户信息。
 * 这些信息通常在用户扫码授权后通过微信 API 获取。
 */
export interface WechatUserInfo {
  /**
   * 用户唯一标识。
   */
  openid: string;

  /**
   * 用户昵称。
   */
  nickname?: string;

  /**
   * 用户头像 URL。
   */
  headimgurl?: string;

  /**
   * 用户性别（1=男，2=女，0=未知）。
   */
  sex?: number;

  /**
   * 用户所在省份。
   */
  province?: string;

  /**
   * 用户所在城市。
   */
  city?: string;

  /**
   * 用户所在国家。
   */
  country?: string;

  /**
   * 用户特权信息。
   */
  privilege?: string[];

  /**
   * 允许包含其他属性。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
