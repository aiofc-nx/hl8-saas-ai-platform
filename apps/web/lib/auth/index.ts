/**
 * @description NextAuth 触发类型，用于标识 JWT 回调的触发事件
 * @remarks
 * - 'update': 更新会话时触发
 * - 'signIn': 用户登录时触发
 * - 'signUp': 用户注册时触发
 * - undefined: 其他情况
 */
export type triggerType = 'update' | 'signIn' | 'signUp' | undefined;

export * from './is-authorized';
export * from './jwt-callback';
export * from './session-callback';
