import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * 应用程序环境配置类。
 *
 * @description 使用 class-validator 定义应用程序所需的所有环境变量及其验证规则，包括：
 * - 服务器配置（HOST、PORT、NODE_ENV）
 * - CORS 配置（ALLOW_CORS_URL）
 * - JWT 配置（访问令牌和刷新令牌的密钥和过期时间）
 * - 数据库配置（PostgreSQL 连接信息）
 * - 邮件服务配置（SMTP 服务器、端口、安全连接等）
 * - 文件存储配置（本地或 S3）
 * - AWS S3 配置（如果使用 S3 存储）
 *
 * @example
 * ```typescript
 * // 在 TypedConfigModule 中使用
 * TypedConfigModule.forRoot({
 *   schema: EnvConfig,
 *   load: dotenvLoader()
 * })
 * ```
 */
export class EnvConfig {
  /**
   * 索引签名，用于满足 ConfigRecord 类型要求。
   * @internal
   */
  [key: string]: unknown;
  /**
   * 服务器主机地址。
   */
  @Expose()
  @IsString()
  public readonly HOST!: string;

  /**
   * 运行环境。
   */
  @Expose()
  @IsEnum(['development', 'production', 'test', 'provision'])
  @IsOptional()
  public readonly NODE_ENV:
    | 'development'
    | 'production'
    | 'test'
    | 'provision' = 'development';

  @Expose()
  @Type(() => Number)
  @IsNumber()
  public readonly PORT!: number;

  @Expose()
  @IsUrl({ require_tld: false })
  public readonly ALLOW_CORS_URL!: string;

  @Expose()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  public readonly ACCESS_TOKEN_SECRET!: string;

  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  public readonly ACCESS_TOKEN_EXPIRATION!: string;

  @Expose()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  public readonly REFRESH_TOKEN_SECRET!: string;

  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(365)
  public readonly REFRESH_TOKEN_EXPIRATION!: string;

  @Expose()
  @IsString()
  public readonly DB_HOST!: string;

  @Expose()
  @IsString()
  public readonly DB_PORT!: string;

  @Expose()
  @IsString()
  public readonly DB_USERNAME!: string;

  @Expose()
  @IsString()
  public readonly DB_PASSWORD!: string;

  @Expose()
  @IsString()
  public readonly DB_NAME!: string;

  @Expose()
  @Transform(({ value, obj }) => {
    // 处理字符串 'true'/'false' 和布尔值
    // 注意：由于 enableImplicitConversion，需要从原始对象获取字符串值
    const rawValue = obj?.DB_SSL ?? value;
    if (typeof rawValue === 'string') {
      return rawValue.toLowerCase() === 'true';
    }
    if (typeof rawValue === 'boolean') {
      return rawValue;
    }
    // 默认返回 false
    return false;
  })
  @IsBoolean()
  public readonly DB_SSL!: boolean;

  @Expose()
  @IsString()
  public readonly MAIL_HOST!: string;

  @Expose()
  @IsString()
  public readonly MAIL_USERNAME!: string;

  @Expose()
  @IsString()
  public readonly MAIL_PASSWORD!: string;

  @Expose()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  public readonly MAIL_PORT: number = 587;

  @Expose()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  public readonly MAIL_SECURE: boolean = false;

  @Expose()
  @IsEnum(['s3', 'public'])
  public readonly FILE_SYSTEM!: 's3' | 'public';

  @Expose()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  public readonly FILE_MAX_SIZE: number = 20971520;

  @Expose()
  @IsString()
  @IsOptional()
  public readonly AWS_REGION: string = '';

  @Expose()
  @IsString()
  @IsOptional()
  public readonly AWS_ACCESS_KEY_ID: string = '';

  @Expose()
  @IsString()
  @IsOptional()
  public readonly AWS_SECRET_ACCESS_KEY: string = '';

  @Expose()
  @IsString()
  @IsOptional()
  public readonly AWS_S3_BUCKET_NAME: string = '';

  @Expose()
  @IsString()
  @IsOptional()
  public readonly AWS_S3_ENDPOINT: string = '';

  @Expose()
  @IsString()
  @IsOptional()
  public readonly WECHAT_APP_ID: string = '';

  @Expose()
  @IsString()
  @IsOptional()
  public readonly WECHAT_APP_SECRET: string = '';

  @Expose()
  @ValidateIf(
    (o) => o.WECHAT_REDIRECT_URI && o.WECHAT_REDIRECT_URI.trim() !== '',
  )
  @IsUrl({ require_tld: false })
  @IsOptional()
  public readonly WECHAT_REDIRECT_URI: string = '';

  @Expose()
  @ValidateIf((o) => o.FRONTEND_URL && o.FRONTEND_URL.trim() !== '')
  @IsUrl({ require_tld: false })
  @IsOptional()
  public readonly FRONTEND_URL: string = 'http://localhost:3000';
}

/**
 * 表示已验证的环境变量的类型。
 */
export type Env = EnvConfig;
