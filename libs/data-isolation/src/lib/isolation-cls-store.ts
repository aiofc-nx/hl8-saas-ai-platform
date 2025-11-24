import type { ExecutionContext } from '@hl8/application-base';
import type { ClsStore } from 'nestjs-cls';

/**
 * @description CLS 中用于存储数据隔离上下文的标准结构
 */
export interface IsolationClsStore extends ClsStore {
  /**
   * @description 当前请求的执行上下文，包含租户、组织、部门等隔离信息
   */
  executionContext?: ExecutionContext;
  /**
   * @description 当前请求所属租户标识（向后兼容）
   * @deprecated 请使用 executionContext.tenantId
   */
  tenantId?: string;
  /**
   * @description 当前请求用户标识，便于日志审计（向后兼容）
   * @deprecated 请使用 executionContext.userId
   */
  userId?: string;
  /**
   * @description 可选的隔离快照信息，用于审计或策略判断
   */
  isolationSnapshot?: unknown;
}
