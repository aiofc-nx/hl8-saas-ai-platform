/**
 * Mock @hl8/exceptions 模块，用于测试环境。
 *
 * @description 实际使用时，Jest 会使用对应的 .js 文件来提供运行时导出。
 */
export class GeneralUnauthorizedException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'GeneralUnauthorizedException';
  }
}
