import {
  assertExecutionContext,
  type ExecutionContext as AuthExecutionContext,
} from '@hl8/common';
import { GeneralBadRequestException } from '@hl8/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AbilityDescriptor } from '../casl/ability-descriptor.js';
import { CaslAbilityCoordinator } from '../casl/casl-ability-coordinator.js';
import { CASL_ABILITY_METADATA } from '../casl/require-ability.decorator.js';

/**
 * @public
 * @description 基于 CASL 的通用守卫，校验控制器方法所需的权限。
 */
@Injectable()
export class CaslAbilityGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly abilityCoordinator: CaslAbilityCoordinator,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const descriptor = this.reflectAbilityDescriptor(context);
    if (!descriptor) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      executionContext?: AuthExecutionContext;
      securityContext?: AuthExecutionContext; // 向后兼容
      user?: {
        executionContext?: AuthExecutionContext;
        securityContext?: AuthExecutionContext; // 向后兼容
      };
    }>();
    const executionContext =
      request?.executionContext ??
      request?.securityContext ??
      request?.user?.executionContext ??
      request?.user?.securityContext;
    if (!executionContext) {
      throw new GeneralBadRequestException({
        field: 'executionContext',
        message: '缺少执行上下文，无法执行权限校验',
      });
    }

    await this.abilityCoordinator.ensureAuthorized(
      assertExecutionContext(executionContext),
      descriptor,
    );
    return true;
  }

  private reflectAbilityDescriptor(
    context: ExecutionContext,
  ): AbilityDescriptor | undefined {
    return this.reflector.getAllAndOverride<AbilityDescriptor | undefined>(
      CASL_ABILITY_METADATA,
      [context.getHandler(), context.getClass()],
    );
  }
}
