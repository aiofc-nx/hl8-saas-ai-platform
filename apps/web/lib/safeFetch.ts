import z, { ZodSchema } from 'zod';
import { env } from './env';

/**
 * Fetch data from API and validate the response using a Zod schema.
 *
 * @template T - Zod schema type
 * @param {T} schema - Zod schema to validate the response data
 * @param {URL | RequestInfo} url - API endpoint (relative to env.API_URL)
 * @param {RequestInit} [init] - Optional fetch init options
 * @returns {Promise<[string | null, z.TypeOf<T> | null]>} - Returns a tuple of [errorMessage, validatedData]
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
    const contentLength = response.headers.get('content-length');

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
