/**
 * @packageDocumentation
 * @description NestJS 认证与权限管理模块统一入口，导出认证模块、守卫、装饰器和应用层集成模块。
 */

export * from './auth-application.module.js';
export * from './auth.module.js';
export * from './casl/ability-descriptor.js';
export * from './casl/casl-ability-coordinator.js';
export * from './casl/require-ability.decorator.js';
export * from './constants/index.js';
export * from './decorators/index.js';
export * from './guards/index.js';
export * from './interfaces/index.js';
export * from './types/index.js';
