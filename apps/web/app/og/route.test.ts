import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Mock next/og
vi.mock('next/og', () => ({
  ImageResponse: vi.fn(
    () =>
      new Response(null, {
        headers: { 'Content-Type': 'image/png' },
      }),
  ),
}));

// Mock fetch for font loading
global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response),
) as unknown as typeof fetch;

describe('OG Image Route', () => {
  it('Returns a valid ImageResponse', async () => {
    // Mock NextRequest with title and description params
    const url = new URL(
      'http://localhost/api/og?title=Test+Title&description=Test+Desc',
    );
    const req = {
      nextUrl: url,
    } as unknown as NextRequest;

    const res = await GET(req);

    expect(res).toBeInstanceOf(Response);
    expect(res.headers.get('Content-Type')).toBe('image/png');
  }, 10000);
});
