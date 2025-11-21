/**
 * Vitest 测试环境设置文件
 * @description 统一配置测试环境的 mock 和全局设置
 */
import { vi } from 'vitest';

// Mock next/server 模块（必须在其他导入之前）
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string | URL;
    nextUrl: URL;
    constructor(url: string | URL, init?: RequestInit) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
  },
  NextResponse: class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
      return new NextResponse(JSON.stringify(body), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }
    static redirect(url: string | URL, status = 302) {
      return new NextResponse(null, {
        status,
        headers: {
          Location: String(url),
        },
      });
    }
  },
}));

// Mock next-auth 模块
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(() => Promise.resolve(null)),
    unstable_update: vi.fn(),
  })),
}));
