import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema, z } from 'zod';

/**
 * 管道，用于使用 Zod 模式验证和转换传入的数据。
 *
 * @description 根据给定的 Zod 模式验证提供的值。
 * 如果验证失败，抛出 BadRequestException，包含字段错误信息。
 *
 * @example
 * ```typescript
 * // 在控制器方法中使用
 * @Post('create')
 * create(@Body(new ZodValidatorPipe(createSchema)) data: CreateDto) {
 *   return this.service.create(data);
 * }
 * ```
 */
export class ZodValidatorPipe implements PipeTransform {
  /**
   * 创建 ZodValidatorPipe 实例。
   *
   * @param {ZodSchema} schema - 用于验证的 Zod 模式。
   */
  constructor(private schema: ZodSchema) {}

  /**
   * 转换并验证传入的值。
   *
   * @description 使用构造时提供的 Zod 模式验证值，如果验证失败则抛出异常。
   *
   * @param {unknown} value - 要验证的值。
   * @returns {z.infer<typeof this.schema>} 验证并解析后的数据。
   * @throws {BadRequestException} 如果验证失败，包含字段错误信息。
   */
  transform(value: unknown): z.infer<typeof this.schema> {
    const validateFields = this.schema.safeParse(value);
    if (!validateFields.success)
      throw new BadRequestException({
        errors: validateFields.error.flatten().fieldErrors,
      });
    return validateFields.data;
  }
}
