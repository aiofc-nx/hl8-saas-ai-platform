import {
  AuthTokensInterface,
  LoginUserInterface,
  RefreshTokenInterface,
  RegisterUserInterface,
} from '@/common/interfaces';
import {
  extractName,
  generateOTP,
  generateRefreshTime,
  hashString,
  validateString,
} from '@/common/utils';
import { EnvConfig } from '@/common/utils/validateEnv';
import { TransactionService } from '@/database';
import {
  ChangePasswordDto,
  ConfirmEmailDto,
  CreateUserDto,
  DeleteUserDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignInUserDto,
  SignOutAllDeviceUserDto,
  SignOutUserDto,
  ValidateUserDto,
} from '@/features/auth/dto';
import { Otp, TokenTypes } from '@/features/auth/entities/otp.entity';
import { Session } from '@/features/auth/entities/session.entity';
import { Gender, Profile } from '@/features/users/entities/profile.entity';
import { User } from '@/features/users/entities/user.entity';
import {
  GeneralBadRequestException,
  GeneralNotFoundException,
  GeneralUnauthorizedException,
} from '@hl8/exceptions';
import { Logger } from '@hl8/logger';
import {
  ChangePasswordSuccessMail,
  ConfirmEmailSuccessMail,
  MailService,
  RegisterSuccessMail,
  ResetPasswordMail,
  SignInSuccessMail,
} from '@hl8/mail';
import { InjectRepository } from '@hl8/mikro-orm-nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * 认证服务，用于处理认证、注册、会话和用户安全逻辑。
 *
 * @description 提供以下功能：
 * - 用户注册和验证
 * - 用户登录和登出
 * - JWT 令牌生成和管理
 * - 会话管理
 * - 密码重置和修改
 * - 邮箱确认
 * - OTP 验证码管理
 * - 用户账户删除
 */
@Injectable()
export class AuthService {
  /**
   * 创建 AuthService 实例。
   *
   * @param {JwtService} jwtService - JWT 服务，用于令牌操作。
   * @param {EnvConfig} config - 环境配置，用于访问环境变量。
   * @param {EntityRepository<User>} userRepository - 用户实体的仓库。
   * @param {EntityRepository<Profile>} profileRepository - 个人资料实体的仓库。
   * @param {EntityRepository<Session>} sessionRepository - 会话实体的仓库。
   * @param {EntityRepository<Otp>} otpRepository - OTP 实体的仓库。
   * @param {TransactionService} transactionService - 事务服务，用于执行数据库事务。
   * @param {MailService} mailService - 邮件服务，用于发送邮件。
   * @param {Logger} logger - 日志记录器实例。
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: EnvConfig,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: EntityRepository<Profile>,
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @InjectRepository(Otp)
    private readonly otpRepository: EntityRepository<Otp>,
    private readonly transactionService: TransactionService,
    private readonly mailService: MailService,
    private readonly logger: Logger,
  ) {}

  /**
   * 为用户生成访问令牌和刷新令牌。
   *
   * @description 使用 JWT 服务生成一对令牌，包含用户的基本信息（用户名、邮箱、ID）。
   * 访问令牌和刷新令牌使用不同的密钥和过期时间。
   *
   * @param {User} user - 用户实体。
   * @returns {Promise<AuthTokensInterface>} 包含访问令牌和刷新令牌的对象。
   */
  async generateTokens(user: User): Promise<AuthTokensInterface> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        {
          secret: this.config.ACCESS_TOKEN_SECRET,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: this.config.ACCESS_TOKEN_EXPIRATION as any,
        },
      ),
      this.jwtService.signAsync(
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        {
          secret: this.config.REFRESH_TOKEN_SECRET,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: this.config.REFRESH_TOKEN_EXPIRATION as any,
        },
      ),
    ]);
    return {
      access_token,
      refresh_token,
    };
  }

  /**
   * 使用标识符和密码验证用户。
   *
   * @description 根据邮箱或用户名查找用户，并验证密码是否正确。
   *
   * @param {ValidateUserDto} dto - 包含标识符和密码的验证 DTO。
   * @returns {Promise<User>} 验证通过的用户实体（包含个人资料）。
   * @throws {NotFoundException} 如果用户不存在。
   * @throws {UnauthorizedException} 如果凭据无效。
   */
  async validateUser(dto: ValidateUserDto): Promise<User> {
    // 使用 EntityManager 直接查询，确保 password 字段被加载
    // hidden: true 主要用于序列化，不应该影响查询时的字段加载
    const em = this.userRepository.getEntityManager();
    const user = await em.findOne(
      User,
      {
        $or: [{ email: dto.identifier }, { username: dto.identifier }],
      },
      {
        populate: ['profile'],
        // 不指定 fields，让 MikroORM 加载所有字段（包括 hidden 字段）
      },
    );

    if (!user) {
      this.logger.warn('User not found for login attempt', {
        identifier: dto.identifier,
      });
      throw new GeneralUnauthorizedException(
        '用户名或密码错误',
        'INVALID_CREDENTIALS',
      );
    }

    // 检查密码字段是否被加载
    if (!user.password) {
      this.logger.error('User password field is null or undefined', {
        userId: user.id,
        email: user.email,
        hasPasswordProperty: 'password' in user,
        userKeys: Object.keys(user),
      });
      throw new GeneralUnauthorizedException(
        '用户名或密码错误',
        'INVALID_CREDENTIALS',
      );
    }

    // 添加详细的日志（使用 log 级别确保输出）
    this.logger.log('Validating password', {
      userId: user.id,
      email: user.email,
      passwordHashPrefix: user.password
        ? user.password.substring(0, 20)
        : 'null',
      passwordHashLength: user.password ? user.password.length : 0,
      inputPasswordLength: dto.password.length,
    });

    const isValid = await validateString(dto.password, user.password);
    if (!isValid) {
      this.logger.warn('Password validation failed', {
        userId: user.id,
        email: user.email,
        passwordHashPrefix: user.password.substring(0, 20),
        passwordHashLength: user.password.length,
        inputPasswordLength: dto.password.length,
      });
      throw new GeneralUnauthorizedException(
        '用户名或密码错误',
        'INVALID_CREDENTIALS',
      );
    }

    this.logger.log('Password validation succeeded', {
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  /**
   * 使用邮箱和密码注册新用户账户。
   *
   * @description 创建新用户账户，包括：
   * - 验证用户名和邮箱的唯一性
   * - 加密密码
   * - 创建用户和个人资料记录
   * - 生成邮箱确认 OTP
   * - 发送注册成功和邮箱确认邮件
   *
   * @param {CreateUserDto} createUserDto - 创建新用户的数据。
   * @returns {Promise<RegisterUserInterface>} 注册的用户数据。
   * @throws {BadRequestException} 如果用户名或邮箱已存在，或注册失败。
   */
  async register(createUserDto: CreateUserDto): Promise<RegisterUserInterface> {
    const email_confirmation_otp = await generateOTP();
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await this.userRepository.findOne({
        $or: [
          { email: createUserDto.email },
          { username: createUserDto.email.split('@')[0] },
        ],
      });
      if (existingUser) {
        throw new GeneralBadRequestException(
          [{ field: 'email', message: '用户名或邮箱已存在' }],
          '注册失败，用户名或邮箱已被使用',
          'USER_ALREADY_EXISTS',
        );
      }

      const result = await this.transactionService.runInTransaction(
        async (em: EntityManager) => {
          // 加密密码
          const hashedPassword = await hashString(createUserDto.password);
          const username = createUserDto.email.split('@')[0];

          // 创建用户
          const user = new User();
          user.email = createUserDto.email;
          user.username = username;
          user.password = hashedPassword;
          em.persist(user);

          // 创建个人资料
          const profile = new Profile();
          profile.name = extractName(createUserDto.email);
          profile.user = user;
          em.persist(profile);

          // 创建 OTP
          const otp = new Otp();
          otp.otp = email_confirmation_otp;
          otp.type = TokenTypes.EMAIL_CONFIRMATION;
          otp.expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
          em.persist(otp);

          await em.flush();

          // 返回用户 ID，而不是实体对象，避免 EntityManager 引用问题
          return { userId: user.id, profile, otp };
        },
      );

      // 事务结束后，从主 EntityManager 重新加载用户实体
      // 使用 refresh 确保获取最新的实体状态
      const user = await this.userRepository.findOne(
        { id: result.userId },
        { populate: ['profile'] },
      );

      if (!user) {
        throw new GeneralBadRequestException(
          [{ field: 'system', message: '用户创建失败' }],
          '注册失败，请稍后重试',
          'USER_CREATION_FAILED',
        );
      }

      // 确保用户实体完全加载并刷新
      await this.userRepository.getEntityManager().refresh(user);

      // 检查 MailService 是否可用
      if (!this.mailService) {
        this.logger.error('MailService is not available', {
          email: user.email,
          userId: user.id,
        });
        // 即使邮件服务不可用，也继续完成注册
        return { data: user };
      }

      // 在开发环境中，将验证码打印到控制台，方便调试
      if (this.config.NODE_ENV !== 'production') {
        console.log('');
        console.log(
          '═══════════════════════════════════════════════════════════',
        );
        console.log('📧 邮箱验证码（仅开发环境显示）');
        console.log(
          '═══════════════════════════════════════════════════════════',
        );
        console.log(`📬 收件人: ${user.email}`);
        console.log(`🔑 验证码: ${email_confirmation_otp}`);
        console.log(
          `⏰ 过期时间: ${new Date(Date.now() + 1000 * 60 * 60 * 24).toLocaleString('zh-CN')}`,
        );
        console.log(
          '═══════════════════════════════════════════════════════════',
        );
        console.log('');
      }

      // 尝试发送邮件，如果失败不影响用户注册，但记录详细错误
      let emailSent = false;
      let emailError: string | undefined;
      try {
        // 记录邮件发送前的信息
        this.logger.log('Attempting to send registration email', {
          email: user.email,
          userId: user.id,
          profileName: user.profile?.name,
          otpLength: email_confirmation_otp.length,
          mailServiceAvailable: !!this.mailService,
        });

        await this.mailService.sendEmail({
          to: [user.email],
          subject: 'Confirm your email',
          html: RegisterSuccessMail({
            name: user.profile?.name || extractName(user.email),
            otp: email_confirmation_otp,
          }),
        });
        emailSent = true;
        this.logger.log('Registration email sent successfully', {
          email: user.email,
          userId: user.id,
          timestamp: new Date().toISOString(),
        });
      } catch (mailError) {
        // 记录邮件发送错误，但不阻止用户注册
        const errorMessage =
          mailError instanceof Error ? mailError.message : String(mailError);
        emailError = errorMessage;

        this.logger.error('Failed to send registration email', {
          error: errorMessage,
          email: user.email,
          userId: user.id,
          stack: mailError instanceof Error ? mailError.stack : undefined,
        });

        // 如果邮件配置缺失，提供更明确的错误信息
        if (
          mailError instanceof Error &&
          (mailError.message.includes('auth') ||
            mailError.message.includes('credentials') ||
            mailError.message.includes('Authentication failed') ||
            mailError.message.includes('MAIL'))
        ) {
          this.logger.error('邮件服务配置错误。请检查以下环境变量：', {
            MAIL_HOST: this.config.MAIL_HOST,
            MAIL_USERNAME: this.config.MAIL_USERNAME,
            MAIL_PORT: this.config.MAIL_PORT,
            MAIL_SECURE: this.config.MAIL_SECURE,
            error: errorMessage,
          });
          this.logger.error(
            '提示：QQ邮箱需要使用授权码（不是QQ密码），请检查 MAIL_PASSWORD 是否正确。',
          );
        } else if (
          mailError instanceof Error &&
          (mailError.message.includes('connection') ||
            mailError.message.includes('timeout') ||
            mailError.message.includes('ENOTFOUND'))
        ) {
          this.logger.error('邮件服务器连接失败。请检查：', {
            MAIL_HOST: this.config.MAIL_HOST,
            MAIL_PORT: this.config.MAIL_PORT,
            error: errorMessage,
          });
        }
      }
      return { data: user };
    } catch (e) {
      this.logger.error('Registration failed', {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      if (e instanceof GeneralBadRequestException) {
        throw e;
      }
      // 提供更详细的错误信息
      const errorMessage =
        e instanceof Error
          ? e.message || '注册过程中发生错误'
          : '注册过程中发生错误';
      throw new GeneralBadRequestException(
        [{ field: 'system', message: errorMessage }],
        errorMessage,
        'REGISTRATION_FAILED',
      );
    }
  }

  /**
   * 创建微信登录用户。
   *
   * @description 为微信扫码登录创建新用户账户，包括：
   * - 验证用户名和邮箱的唯一性
   * - 创建用户和个人资料记录
   * - 使用微信用户信息填充个人资料
   * - 跳过邮箱验证（微信已认证）
   *
   * @param {string} openid - 微信 openid
   * @param {any} userInfo - 微信用户信息
   * @returns {Promise<User>} 创建的用户实体
   * @throws {BadRequestException} 如果用户名或邮箱已存在
   */
  async createWechatUser(
    openid: string,
    userInfo: {
      nickname?: string;
      headimgurl?: string;
      sex?: number;
      province?: string;
      city?: string;
      country?: string;
    },
  ): Promise<User> {
    const username = `wechat_${openid.slice(0, 12)}`;
    const email = `${openid}@wechat.local`;

    // 检查是否已存在
    const existingUser = await this.userRepository.findOne({
      $or: [{ email }, { username }, { wechatOpenid: openid }],
    });

    if (existingUser) {
      // 如果已存在但未绑定微信，绑定微信
      if (!existingUser.wechatOpenid) {
        existingUser.wechatOpenid = openid;
        const em = this.userRepository.getEntityManager();
        await em.flush();
      }
      return existingUser;
    }

    const result = await this.transactionService.runInTransaction(
      async (em: EntityManager) => {
        // 创建用户
        const user = new User();
        user.email = email;
        user.username = username;
        user.password = undefined; // 微信登录用户不需要密码
        user.wechatOpenid = openid;
        user.isEmailVerified = true; // 微信已认证，跳过邮箱验证
        user.emailVerifiedAt = new Date();
        em.persist(user);

        // 创建个人资料
        const profile = new Profile();
        profile.name = userInfo.nickname || username;
        profile.user = user;
        if (userInfo.headimgurl) {
          profile.profilePicture = userInfo.headimgurl;
        }
        // 性别映射：1=男，2=女，0=未知
        if (userInfo.sex === 1) {
          profile.gender = Gender.MALE;
        } else if (userInfo.sex === 2) {
          profile.gender = Gender.FEMALE;
        }
        if (userInfo.province && userInfo.city) {
          profile.address =
            `${userInfo.country || ''} ${userInfo.province} ${userInfo.city}`.trim();
        }
        em.persist(profile);

        await em.flush();

        return { userId: user.id };
      },
    );

    // 重新加载用户
    const user = await this.userRepository.findOne(
      { id: result.userId },
      { populate: ['profile'] },
    );

    if (!user) {
      throw new GeneralBadRequestException(
        [{ field: 'system', message: '用户创建失败' }],
        '微信登录失败，请稍后重试',
        'WECHAT_USER_CREATION_FAILED',
      );
    }

    return user;
  }

  /**
   * 用户登录。
   *
   * @description 验证用户凭据，生成访问令牌和刷新令牌，创建会话记录，并发送登录成功邮件。
   *
   * @param {SignInUserDto} dto - 登录 DTO。
   * @returns {Promise<LoginUserInterface>} 包含用户数据和令牌的登录响应。
   * @throws {UnauthorizedException} 如果凭据无效或用户未确认邮箱。
   */
  async signIn(dto: SignInUserDto): Promise<LoginUserInterface> {
    const user = await this.validateUser(dto);
    // 允许未验证邮箱的用户登录，但会重定向到邮箱确认页面
    // if (!user.isEmailVerified) {
    //   throw new UnauthorizedException('Please confirm your email first');
    // }
    const tokens = await this.generateTokens(user);
    const session = new Session();
    session.user = user;
    session.refresh_token = tokens.refresh_token;
    session.ip = dto.ip || 'unknown';
    session.device_name = dto.device_name || 'unknown';
    session.device_os = dto.device_os || 'unknown';
    session.browser = dto.browser || 'unknown';
    session.location = dto.location || 'unknown';
    session.userAgent = dto.userAgent || 'unknown';
    const em = this.userRepository.getEntityManager();
    em.persist(session);
    await em.flush();

    // 尝试发送邮件，如果失败不影响用户登录
    try {
      await this.mailService.sendEmail({
        to: [user.email],
        subject: 'SignIn with your email',
        html: SignInSuccessMail({
          username: user.profile.name,
          loginTime: session.createdAt,
          ipAddress: session.ip,
          location: session.location,
          device: session.device_name,
        }),
      });
    } catch (mailError) {
      // 记录邮件发送错误，但不阻止用户登录
      this.logger.warn('Failed to send sign-in success email', {
        error:
          mailError instanceof Error ? mailError.message : String(mailError),
        email: user.email,
        userId: user.id,
      });
      // 如果邮件配置缺失，提供更明确的错误信息
      if (
        mailError instanceof Error &&
        (mailError.message.includes('SSL') ||
          mailError.message.includes('wrong version number') ||
          mailError.message.includes('auth') ||
          mailError.message.includes('credentials') ||
          mailError.message.includes('MAIL'))
      ) {
        this.logger.error(
          'Mail service configuration error. Please check MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USERNAME and MAIL_PASSWORD environment variables.',
        );
      }
    }
    const session_refresh_time = await generateRefreshTime();
    return {
      data: user,
      tokens: { ...tokens, session_token: session.id, session_refresh_time },
    };
  }

  /**
   * 确认用户邮箱。
   *
   * @description 使用 OTP 验证码确认用户邮箱地址，激活用户账户。
   * 验证成功后自动生成 JWT 令牌，用户可直接登录。
   *
   * @param {ConfirmEmailDto} dto - 邮箱确认 DTO。
   * @returns {Promise<LoginUserInterface>} 包含用户数据和令牌的登录响应。
   * @throws {NotFoundException} 如果用户或 OTP 不存在。
   * @throws {BadRequestException} 如果 OTP 验证码无效或已过期。
   */
  async confirmEmail(dto: ConfirmEmailDto): Promise<LoginUserInterface> {
    const user = await this.userRepository.findOne(
      { email: dto.email },
      { populate: ['profile'] },
    );
    if (!user)
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    const otp = await this.otpRepository.findOne({
      otp: dto.token,
      type: TokenTypes.EMAIL_CONFIRMATION,
    });
    if (!otp)
      throw new GeneralNotFoundException(
        '验证码不存在或已失效',
        'INVALID_CONFIRMATION_CODE',
      );
    if (otp.otp !== dto.token)
      throw new GeneralBadRequestException(
        [{ field: 'token', message: '验证码不正确' }],
        '验证码不正确，请检查后重试',
        'INVALID_CONFIRMATION_CODE',
      );
    if (otp.expires && new Date(otp.expires) < new Date())
      throw new GeneralBadRequestException(
        [{ field: 'token', message: '验证码已过期' }],
        '验证码已过期，请重新获取',
        'CONFIRMATION_CODE_EXPIRED',
      );
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    const em = this.userRepository.getEntityManager();
    await em.flush();
    em.remove(otp);
    await em.flush();

    // 验证成功后自动生成 JWT 令牌，用户可直接登录
    const tokens = await this.generateTokens(user);

    // 创建会话
    const session = new Session();
    session.user = user;
    session.refresh_token = tokens.refresh_token;
    session.ip = 'unknown';
    session.device_name = 'Email Verification';
    session.device_os = 'unknown';
    session.browser = 'unknown';
    session.location = 'unknown';
    session.userAgent = 'Email Verification';
    em.persist(session);
    await em.flush();

    // 发送确认成功邮件
    try {
      await this.mailService.sendEmail({
        to: [user.email],
        subject: 'Confirmation Successful',
        html: ConfirmEmailSuccessMail({
          name: user.profile.name,
        }),
      });
    } catch (mailError) {
      // 记录邮件发送错误，但不阻止验证成功
      this.logger.warn('Failed to send confirmation success email', {
        error:
          mailError instanceof Error ? mailError.message : String(mailError),
        email: user.email,
        userId: user.id,
      });
    }

    // 返回用户信息和令牌
    const session_refresh_time = await generateRefreshTime();
    return {
      data: user,
      tokens: {
        ...tokens,
        session_token: session.id,
        session_refresh_time,
      },
    };
  }

  /**
   * 重新发送邮箱确认邮件。
   *
   * @description 为未验证邮箱的用户重新生成并发送邮箱确认 OTP。
   *
   * @param {string} email - 用户邮箱地址。
   * @returns {Promise<void>}
   * @throws {NotFoundException} 如果用户不存在。
   * @throws {BadRequestException} 如果用户邮箱已验证。
   */
  async resendConfirmationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne(
      { email },
      { populate: ['profile'] },
    );
    if (!user)
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    if (user.isEmailVerified) {
      throw new GeneralBadRequestException(
        [{ field: 'email', message: '邮箱已验证' }],
        '邮箱已验证，无需重复验证',
        'EMAIL_ALREADY_VERIFIED',
      );
    }

    // 生成新的 OTP
    const email_confirmation_otp = await generateOTP();

    // 在开发环境中，将验证码打印到控制台，方便调试
    if (this.config.NODE_ENV !== 'production') {
      console.log('');
      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      console.log('📧 重新发送邮箱验证码（仅开发环境显示）');
      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      console.log(`📬 收件人: ${user.email}`);
      console.log(`🔑 验证码: ${email_confirmation_otp}`);
      console.log(
        `⏰ 过期时间: ${new Date(Date.now() + 1000 * 60 * 60 * 24).toLocaleString('zh-CN')}`,
      );
      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      console.log('');
    }

    // 删除该用户旧的 EMAIL_CONFIRMATION 类型的 OTP
    // 注意：OTP 实体没有直接关联用户，需要通过其他方式识别
    // 这里我们删除所有 EMAIL_CONFIRMATION 类型的 OTP，因为每个用户注册时都会创建新的
    const em = this.userRepository.getEntityManager();
    const oldOtps = await this.otpRepository.find({
      type: TokenTypes.EMAIL_CONFIRMATION,
    });
    oldOtps.forEach((otp) => em.remove(otp));

    // 创建新的 OTP
    const otp = new Otp();
    otp.otp = email_confirmation_otp;
    otp.type = TokenTypes.EMAIL_CONFIRMATION;
    otp.expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 小时过期
    em.persist(otp);
    await em.flush();

    // 发送确认邮件
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Confirm your email',
      html: RegisterSuccessMail({
        name: user.profile?.name || extractName(user.email),
        otp: email_confirmation_otp,
      }),
    });
  }

  /**
   * 发送密码重置邮件。
   *
   * @description 为忘记密码的用户发送包含 OTP 验证码的重置密码邮件。
   *
   * @param {ForgotPasswordDto} dto - 忘记密码 DTO。
   * @returns {Promise<void>}
   * @throws {NotFoundException} 如果用户不存在。
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne(
      {
        $or: [{ email: dto.identifier }, { username: dto.identifier }],
      },
      { populate: ['profile'] },
    );
    if (!user)
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    const passwordResetToken = await generateOTP();
    const otp = new Otp();
    otp.otp = passwordResetToken;
    otp.type = TokenTypes.PASSWORD_RESET;
    otp.expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const em = this.userRepository.getEntityManager();
    em.persist(otp);
    await em.flush();
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Reset your password',
      html: ResetPasswordMail({
        name: user.profile.name,
        code: passwordResetToken,
      }),
    });
  }

  /**
   * 使用重置令牌重置用户密码。
   *
   * @description 使用 OTP 验证码重置忘记密码的用户的密码。
   *
   * @param {ResetPasswordDto} dto - 重置密码 DTO。
   * @returns {Promise<void>}
   * @throws {NotFoundException} 如果用户或 OTP 不存在。
   * @throws {BadRequestException} 如果重置令牌无效或已过期。
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne(
      {
        $or: [{ email: dto.identifier }, { username: dto.identifier }],
      },
      { populate: ['profile'] },
    );
    if (!user)
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    const otp = await this.otpRepository.findOne({
      otp: dto.resetToken,
      type: TokenTypes.PASSWORD_RESET,
    });
    if (!otp)
      throw new GeneralNotFoundException(
        '重置令牌不存在或已失效',
        'INVALID_RESET_TOKEN',
      );
    if (otp.otp !== dto.resetToken)
      throw new GeneralBadRequestException(
        [{ field: 'resetToken', message: '重置令牌不正确' }],
        '重置令牌不正确，请检查后重试',
        'INVALID_RESET_TOKEN',
      );
    if (otp.expires && new Date() > otp.expires)
      throw new GeneralBadRequestException(
        [{ field: 'resetToken', message: '重置令牌已过期' }],
        '重置令牌已过期，请重新获取',
        'RESET_TOKEN_EXPIRED',
      );
    user.password = await hashString(dto.newPassword);
    const em = this.userRepository.getEntityManager();
    await em.flush();
    em.remove(otp);
    await em.flush();
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Password Reset Successful',
      html: ChangePasswordSuccessMail({
        name: user.profile.name,
      }),
    });
  }

  /**
   * 修改用户密码。
   *
   * @description 已登录用户修改自己的密码，需要提供当前密码和新密码。
   *
   * @param {ChangePasswordDto} dto - 修改密码 DTO。
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} 如果当前密码不正确。
   */
  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const user = await this.validateUser(dto);
    user.password = await hashString(dto.newPassword);
    const em = this.userRepository.getEntityManager();
    await em.flush();
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Password Change Successful',
      html: ChangePasswordSuccessMail({
        name: user.profile.name,
      }),
    });
  }

  /**
   * 用户从当前会话登出。
   *
   * @description 删除当前设备的会话记录，使该设备的刷新令牌失效。
   *
   * @param {SignOutUserDto} dto - 登出 DTO。
   * @returns {Promise<void>}
   * @throws {NotFoundException} 如果会话不存在。
   */
  async signOut(dto: SignOutUserDto): Promise<void> {
    const session = await this.sessionRepository.findOne({
      id: dto.session_token,
    });
    if (!session)
      throw new GeneralNotFoundException('会话不存在', 'SESSION_NOT_FOUND');
    const em = this.sessionRepository.getEntityManager();
    em.remove(session);
    await em.flush();
  }

  /**
   * 用户从所有设备登出。
   *
   * @description 删除用户在所有设备上的所有会话记录，使所有刷新令牌失效。
   *
   * @param {SignOutAllDeviceUserDto} dto - 从所有设备登出 DTO。
   * @returns {Promise<void>}
   */
  async signOutAllDevices(dto: SignOutAllDeviceUserDto): Promise<void> {
    const em = this.sessionRepository.getEntityManager();
    await em.nativeDelete(Session, { user: dto.userId });
  }

  /**
   * 刷新用户的访问令牌。
   *
   * @description 使用有效的刷新令牌生成新的访问令牌和刷新令牌对。
   *
   * @param {RefreshTokenDto} dto - 刷新令牌 DTO。
   * @returns {Promise<RefreshTokenInterface>} 包含新令牌的刷新令牌响应。
   * @throws {NotFoundException} 如果用户或会话不存在。
   */
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenInterface> {
    const user = await this.userRepository.findOne({ id: dto.user_id });
    if (!user)
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    const { access_token, refresh_token } = await this.generateTokens(user);
    const session = await this.sessionRepository.findOne({
      id: dto.session_token,
      user: dto.user_id,
    });
    if (!session)
      throw new GeneralNotFoundException('会话不存在', 'SESSION_NOT_FOUND');
    session.refresh_token = refresh_token;
    const access_token_refresh_time = await generateRefreshTime();
    const em = this.sessionRepository.getEntityManager();
    await em.flush();
    return {
      access_token,
      refresh_token,
      session_token: dto.session_token,
      access_token_refresh_time,
    };
  }

  /**
   * 检索用户的所有会话。
   *
   * @description 获取指定用户在所有设备上的所有活动会话信息。
   *
   * @param {string} userId - 用户 ID。
   * @returns {Promise<Session[]>} 用户会话列表。
   */
  async getSessions(userId: string): Promise<Session[]> {
    return await this.sessionRepository.find({
      user: userId,
    });
  }

  /**
   * 根据会话 ID 检索会话。
   *
   * @description 根据会话 ID 获取单个会话的详细信息。
   *
   * @param {string} id - 会话 ID。
   * @returns {Promise<Session>} 会话实体。
   * @throws {NotFoundException} 如果会话不存在。
   */
  async getSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ id });
    if (!session)
      throw new GeneralNotFoundException('会话不存在', 'SESSION_NOT_FOUND');
    return session;
  }

  /**
   * 删除用户账户。
   *
   * @description 永久删除用户账户及其所有相关数据（包括会话、OTP 等）。
   *
   * @param {DeleteUserDto} dto - 删除用户 DTO。
   * @returns {Promise<void>}
   * @throws {NotFoundException} 如果用户不存在。
   * @throws {BadRequestException} 如果密码验证失败或删除失败。
   */
  async deleteAccount(dto: DeleteUserDto): Promise<void> {
    const user = await this.userRepository.findOne({ id: dto.user_id });
    if (!user)
      throw new GeneralNotFoundException('用户不存在', 'USER_NOT_FOUND');
    if (!user.password)
      throw new GeneralUnauthorizedException(
        '密码验证失败',
        'INVALID_CREDENTIALS',
      );
    const isValidPassword = await validateString(dto.password, user.password);
    if (!isValidPassword)
      throw new GeneralUnauthorizedException(
        '密码验证失败',
        'INVALID_CREDENTIALS',
      );
    try {
      const em = this.userRepository.getEntityManager();
      em.remove(user);
      await em.flush();
    } catch (_e) {
      throw new GeneralBadRequestException(
        [{ field: 'system', message: '删除用户账户失败' }],
        '删除用户账户失败，请稍后重试',
        'ACCOUNT_DELETION_FAILED',
      );
    }
  }
}
