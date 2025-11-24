import type { PureAbility } from '@casl/ability';
import type { ExecutionContext } from '@hl8/application-base';

/**
 * @public
 * @description 平台应用层使用的权限能力类型定义。
 */
export type ApplicationAbility = PureAbility<
  [string, string],
  Record<string, unknown>
>;

/**
 * @public
 * @description 权限能力服务接口，由基础设施层提供具体实现。
 */
export interface AbilityService {
  /**
   * @description 根据执行上下文加载 CASL 权限能力。
   * @param context - 当前执行上下文。
   * @returns 对应的权限能力实例。
   */
  resolveAbility(context: ExecutionContext): Promise<ApplicationAbility>;

  /**
   * @description 当权限发生变更时刷新缓存。
   * @param context - 当前执行上下文。
   */
  refreshAbility?(context: ExecutionContext): Promise<void>;
}
