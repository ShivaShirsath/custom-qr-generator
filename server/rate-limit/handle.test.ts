import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { config as middlewareConfig } from '../../middleware';
import { BYPASS_COOKIE, sha256Hex } from './bypass';
import { bucketFor, handleRateLimit } from './handle';
import type { RateLimitStore } from './store';
import { TOKEN, testDeps } from './test-helpers';
import { UpstashStore } from './upstash-store';

const PAGE = 'https://qr.example/';
const API = 'https://qr.example/api/qr?data=hi';
const isNext = (res: Response) => res.headers.get('x-middleware-next') === '1';

async function hammer(url: string, times: number, deps: ReturnType<typeof testDeps>) {
  let last: Response | undefined;
  for (let i = 0; i < times; i++) last = await handleRateLimit(new Request(url), deps);
  if (!last) throw new Error('no requests made');
  return last;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:10Z'));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('bucketFor', () => {
  it('splits API and page traffic', () => {
    expect(bucketFor('/api/qr')).toBe('api');
    expect(bucketFor('/api')).toBe('api');
    expect(bucketFor('/')).toBe('page');
    expect(bucketFor('/apiary')).toBe('page');
  });
});

describe('handleRateLimit', () => {
  it('passes allowed requests through with RateLimit headers', async () => {
    const res = await handleRateLimit(new Request(API), testDeps());
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('ratelimit-limit')).toBe('30');
    expect(res.headers.get('ratelimit-remaining')).toBe('29');
    expect(res.headers.get('ratelimit-reset')).toBe('50');
  });

  it('returns a JSON 429 for the API once the bucket is empty', async () => {
    const deps = testDeps({ RATE_LIMIT_API_MAX: '2' });
    const res = await hammer(API, 3, deps);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('50');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('ratelimit-remaining')).toBe('0');
    expect(await res.json()).toEqual({ error: 'rate_limited', retryAfter: 50 });
  });

  it('returns an HTML 429 for pages', async () => {
    const deps = testDeps({ RATE_LIMIT_PAGE_MAX: '1' });
    const res = await hammer(PAGE, 2, deps);
    expect(res.status).toBe(429);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(res.headers.get('cache-control')).toBe('no-store');
    const html = await res.text();
    expect(html).toContain('try again in 50 seconds');
    expect(html).not.toMatch(/<script|src=|href=/i);
  });

  it('keeps API and page buckets separate', async () => {
    const deps = testDeps({ RATE_LIMIT_API_MAX: '1', RATE_LIMIT_PAGE_MAX: '1' });
    expect(isNext(await handleRateLimit(new Request(API), deps))).toBe(true);
    expect(isNext(await handleRateLimit(new Request(PAGE), deps))).toBe(true);
    expect((await handleRateLimit(new Request(API), deps)).status).toBe(429);
  });

  it('recovers after the window has passed', async () => {
    const deps = testDeps({ RATE_LIMIT_API_MAX: '1' });
    expect((await hammer(API, 2, deps)).status).toBe(429);
    vi.advanceTimersByTime(120_000);
    expect(isNext(await handleRateLimit(new Request(API), deps))).toBe(true);
  });

  it('does nothing when disabled', async () => {
    const deps = testDeps({ RATE_LIMIT_ENABLED: 'false', RATE_LIMIT_API_MAX: '1' });
    const res = await hammer(API, 5, deps);
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('ratelimit-limit')).toBeNull();
  });

  it('limits by IP, sharing the bucket across an IPv6 /64', async () => {
    const env = { RATE_LIMIT_API_MAX: '1' };
    const a = testDeps(env, '2001:db8:1:2::1');
    const shared = { ...a, getIp: () => '2001:db8:1:2::ffff' };
    const other = { ...a, getIp: () => '2001:db8:1:3::1' };
    expect(isNext(await handleRateLimit(new Request(API), a))).toBe(true);
    expect((await handleRateLimit(new Request(API), shared)).status).toBe(429);
    expect(isNext(await handleRateLimit(new Request(API), other))).toBe(true);
  });

  it('hands pending Upstash work to waitUntil', async () => {
    const pending = Promise.resolve('synced');
    const store = new UpstashStore(
      {
        limit: async () => ({ success: true, limit: 5, remaining: 4, reset: Date.now(), pending }),
      },
      { max: 5, windowSeconds: 60 },
    );
    const waitUntil = vi.fn();
    const deps = { ...testDeps(), stores: { api: store, page: store }, waitUntil };
    await handleRateLimit(new Request(API), deps);
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });

  it('fails open when Redis errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const store = new UpstashStore(
      {
        limit: () => Promise.reject(new Error('ECONNRESET')),
      },
      { max: 5, windowSeconds: 60 },
    );
    const res = await handleRateLimit(new Request(API), {
      ...testDeps(),
      stores: { api: store, page: store },
    });
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('ratelimit-remaining')).toBe('5');
    expect(warn).toHaveBeenCalled();
  });

  it('fails open when a store throws unexpectedly', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const broken: RateLimitStore = { limit: () => Promise.reject(new Error('boom')) };
    const res = await handleRateLimit(new Request(API), {
      ...testDeps(),
      stores: { api: broken, page: broken },
    });
    expect(isNext(res)).toBe(true);
  });
});

describe('owner bypass', () => {
  const blocked = () => testDeps({ RATE_LIMIT_API_MAX: '1', RATE_LIMIT_PAGE_MAX: '1' });

  it('bypasses with the header', async () => {
    const deps = blocked();
    await hammer(API, 2, deps);
    const res = await handleRateLimit(
      new Request(API, { headers: { 'x-ratelimit-bypass': TOKEN } }),
      deps,
    );
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('x-ratelimit-bypass')).toBe('1');
    expect(res.headers.get('ratelimit-limit')).toBeNull();
  });

  it('does not treat a wrong header specially', async () => {
    const deps = blocked();
    await hammer(API, 1, deps);
    const res = await handleRateLimit(
      new Request(API, { headers: { 'x-ratelimit-bypass': 'guess' } }),
      deps,
    );
    expect(res.status).toBe(429);
  });

  it('bypasses with the cookie', async () => {
    const deps = blocked();
    await hammer(PAGE, 2, deps);
    const cookie = `${BYPASS_COOKIE}=${await sha256Hex(TOKEN)}`;
    const res = await handleRateLimit(new Request(PAGE, { headers: { cookie } }), deps);
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('x-ratelimit-bypass')).toBe('1');
  });

  it('bypasses allowlisted IPs', async () => {
    const deps = testDeps({ RATE_LIMIT_API_MAX: '1', RATE_LIMIT_BYPASS_IPS: '203.0.113.7' });
    const res = await hammer(API, 5, deps);
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('x-ratelimit-bypass')).toBe('1');
  });

  it('?bypass=<token> sets the cookie via redirect, even when limited', async () => {
    const deps = blocked();
    await hammer(PAGE, 2, deps);
    const res = await handleRateLimit(new Request(`${PAGE}?bypass=${TOKEN}`), deps);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(PAGE);
    expect(res.headers.get('set-cookie')).toContain(
      `${BYPASS_COOKIE}=${await sha256Hex(TOKEN)}; Max-Age=31536000`,
    );
  });

  it('?bypass=<wrong> is just a normal request', async () => {
    const deps = blocked();
    const res = await handleRateLimit(new Request(`${PAGE}?bypass=wrong`), deps);
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('ratelimit-remaining')).toBe('0');
  });

  it('?bypass=off clears the cookie for the owner', async () => {
    const deps = blocked();
    const cookie = `${BYPASS_COOKIE}=${await sha256Hex(TOKEN)}`;
    const res = await handleRateLimit(
      new Request(`${PAGE}?bypass=off&x=1`, { headers: { cookie } }),
      deps,
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${PAGE}?x=1`);
    expect(res.headers.get('set-cookie')).toMatch(/^cqg_rl_bypass=; Max-Age=0/);
  });

  it('?bypass=off still counts against the limit for everyone else', async () => {
    const deps = blocked();
    expect((await handleRateLimit(new Request(`${PAGE}?bypass=off`), deps)).status).toBe(307);
    expect((await handleRateLimit(new Request(`${PAGE}?bypass=off`), deps)).status).toBe(429);
  });

  it('ignores ?bypass= on the API (use the header there)', async () => {
    const deps = blocked();
    const res = await handleRateLimit(new Request(`${API}&bypass=${TOKEN}`), deps);
    expect(isNext(res)).toBe(true);
    expect(res.headers.get('x-ratelimit-bypass')).toBeNull();
  });
});

describe('middleware matcher', () => {
  const [pattern] = middlewareConfig.matcher;
  // Vercel compiles matchers like path-to-regexp; for this single-group pattern that is
  // equivalent to anchoring the raw regex.
  const re = new RegExp(`^${pattern}$`);

  it('covers pages and the API', () => {
    for (const path of ['/', '/about', '/api/qr', '/api/qr/'])
      expect(re.test(path), path).toBe(true);
  });

  it('skips static files', () => {
    for (const path of [
      '/assets/index-abc123.js',
      '/assets/plus-jakarta.woff2',
      '/favicon.svg',
      '/manifest.webmanifest',
      '/robots.txt',
      '/theme-init.js',
      '/sw.js',
      '/icon-192.png',
      '/icon-maskable-512.png',
      '/apple-touch-icon.png',
    ]) {
      expect(re.test(path), path).toBe(false);
    }
  });
});
