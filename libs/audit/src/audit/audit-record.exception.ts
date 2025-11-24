import { GeneralInternalServerException } from '@hl8/exceptions';

/**
 * @public
 * @description 审计记录异常，当审计写入失败时抛出。
 */
export class AuditRecordException extends GeneralInternalServerException {
  public constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}
