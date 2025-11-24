/**
 * Mock @hl8/exceptions 模块，用于测试环境。
 *
 * @description 实际使用时，Jest 会使用对应的 .js 文件来提供运行时导出。
 */
export class GeneralBadRequestException extends Error {
  constructor(
    message: string | { field?: string; message: string },
    public readonly code?: string,
  ) {
    super(typeof message === 'string' ? message : message.message);
    this.name = 'GeneralBadRequestException';
  }
}

export class GeneralForbiddenException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'GeneralForbiddenException';
  }
}

export class GeneralInternalServerException extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GeneralInternalServerException';
  }
}

export class GeneralUnauthorizedException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'GeneralUnauthorizedException';
  }
}

export class MissingConfigurationForFeatureException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'MissingConfigurationForFeatureException';
  }
}
