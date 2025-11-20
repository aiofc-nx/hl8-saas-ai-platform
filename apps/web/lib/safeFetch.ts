import z, { ZodSchema } from 'zod';
import { env } from './env';

/**
 * @description 从 API 获取数据并使用 Zod 模式验证响应
 * @template T - Zod 模式类型
 * @param schema - 用于验证响应数据的 Zod 模式
 * @param url - API 端点（相对于 env.API_URL）
 * @param init - 可选的 fetch 初始化选项
 * @returns 返回元组 [errorMessage, validatedData]，第一个元素为错误信息（成功时为 null），第二个元素为验证后的数据（失败时为 null）
 * @throws 当网络请求失败时会返回包含错误信息的元组
 * @remarks
 * - 自动处理空响应、HTML 响应和 JSON 解析错误
 * - 支持 NestJS ValidationPipe 返回的错误格式
 * - 验证失败时会在控制台输出详细的验证错误信息
 */
export const safeFetch = async <T extends ZodSchema<unknown>>(
  schema: T,
  url: URL | RequestInfo,
  init?: RequestInit,
): Promise<[string | null, z.TypeOf<T>]> => {
  try {
    const response: Response = await fetch(`${env.API_URL}${url}`, init);

    // 检查响应体是否为空
    const contentType = response.headers.get('content-type');

    // 尝试获取响应文本（用于调试）
    const responseText = await response.text();

    // 如果响应体为空，检查是否是预期的空响应
    if (!responseText || responseText.trim() === '') {
      // 对于 204 No Content，这是正常的空响应
      if (response.status === 204 && response.ok) {
        // 尝试使用 schema 的默认值或空对象
        const emptyResult = schema.safeParse({});
        if (emptyResult.success) {
          return [null, emptyResult.data];
        }
      }
      // 对于其他空响应，返回错误
      return [
        `Empty response received: ${response.status} ${response.statusText}. Expected JSON response but got empty body.`,
        null,
      ];
    }

    // 检查是否是 HTML 响应（通常意味着请求被发送到了前端应用而不是后端 API）
    if (
      responseText.trim().startsWith('<!DOCTYPE') ||
      responseText.trim().startsWith('<html') ||
      (contentType && !contentType.includes('application/json'))
    ) {
      return [
        `Received HTML response instead of JSON. This usually means the API URL is incorrect or the backend is not running. Check your API_URL configuration (currently: ${env.API_URL}). Response preview: ${responseText.substring(0, 200)}`,
        null,
      ];
    }

    // 尝试解析 JSON
    let res: unknown;
    try {
      res = JSON.parse(responseText);
    } catch (jsonError) {
      // 提供更详细的错误信息
      const errorDetail =
        jsonError instanceof Error ? jsonError.message : 'Unknown error';
      return [
        `Failed to parse JSON response (${response.status} ${response.statusText}): ${errorDetail}. Response body: ${responseText.substring(0, 200)}`,
        null,
      ];
    }

    if (!response.ok) {
      // 尝试提取详细的错误信息
      let errorMessage: string;

      if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, unknown>;

        // NestJS ValidationPipe 返回的错误格式
        if (errorObj.message) {
          if (Array.isArray(errorObj.message)) {
            errorMessage = errorObj.message.join(', ');
          } else if (typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          } else {
            errorMessage = String(errorObj.message);
          }
        } else if (errorObj.errors) {
          // 处理字段验证错误
          const errors = errorObj.errors as Record<string, string[]>;
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          errorMessage =
            errorMessages || `HTTP error! Status: ${response.status}`;
        } else {
          errorMessage = `HTTP error! Status: ${response.status}`;
        }
      } else {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }

      return [errorMessage, null];
    }

    const validateFields = schema.safeParse(res);

    if (!validateFields.success) {
      console.error('API Response validation failed:', {
        url: `${env.API_URL}${url}`,
        status: response.status,
        responseData: res,
        validationErrors: validateFields.error.errors,
        formattedErrors: validateFields.error.format(),
      });
      return [`Validation error: ${validateFields.error.message}`, null];
    }

    return [null, validateFields.data];
  } catch (error) {
    // 捕获网络错误或其他异常
    const errorMessage =
      error instanceof Error
        ? `Network error: ${error.message}`
        : 'An unknown error occurred';
    return [errorMessage, null];
  }
};
