import Page from '@/app/(home)/page'; // Path to your Page component
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Mock next/server and next-auth are handled in vitest.setup.ts

// Mock @/auth module
vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock the imported components
vi.mock('@/components/logo-icon', () => ({
  default: ({ width, height }: { width: number; height: number }) => (
    <div data-testid="logo-icon" style={{ width, height }} />
  ),
}));

vi.mock('@/components/session', () => ({
  default: () => <div data-testid="session" />,
}));

vi.mock('@repo/shadcn/mode-switcher', () => ({
  ModeSwitcher: () => <div>ModeSwitcher</div>,
}));

vi.mock('@repo/shadcn/button', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => {
    if (asChild) {
      return <>{children}</>;
    }
    return <button {...props}>{children}</button>;
  },
}));

vi.mock('@repo/shadcn/tiptap/rich-text-editor', () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

vi.mock('@repo/shadcn/video/player', () => ({
  VideoPlayer: ({
    poster,
    src,
    className,
  }: {
    poster: string;
    src: string;
    className: string;
  }) => (
    <div data-testid="video-player" className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="poster" />
      <video src={src} />
    </div>
  ),
}));

/**
 * 异步 Server Component 测试辅助函数
 * @description 将异步 Server Component 包装为同步组件进行测试
 */
async function renderAsyncComponent(
  Component: () => Promise<React.JSX.Element>,
) {
  let result: React.JSX.Element | null = null;
  await act(async () => {
    result = await Component();
  });
  return result;
}

describe('Page Component', () => {
  it('renders ModeSwitcher and RichTextEditor components', async () => {
    const pageElement = await renderAsyncComponent(Page);
    if (pageElement) {
      render(pageElement);
    }

    // Check if ModeSwitcher is rendered
    expect(screen.getByText('ModeSwitcher')).toBeDefined();
    // Check if RichTextEditor is rendered (instead of VideoPlayer which is commented out)
    expect(screen.getByTestId('rich-text-editor')).toBeDefined();
  });
});
