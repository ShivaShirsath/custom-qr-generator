import { describe, expect, it } from 'vitest';

import {
  DEFAULT_API_BUCKET,
  DEFAULT_PAGE_BUCKET,
  parseBoolean,
  parsePositiveInt,
  parseRateLimitConfig,
} from './config';

describe('parseRateLimitConfig', () => {
  it('uses safe defaults for an empty environment', () => {
    const config = parseRateLimitConfig({});
    expect(config.enabled).toBe(true);
    expect(config.api).toEqual(DEFAULT_API_BUCKET);
    expect(config.page).toEqual(DEFAULT_PAGE_BUCKET);
    expect(config.api).toEqual({ max: 30, windowSeconds: 60 });
    expect(config.page).toEqual({ max: 120, windowSeconds: 60 });
    expect(config.bypassToken).toBeNull();
    expect(config.bypassIps.size).toBe(0);
    expect(config.redis).toBeNull();
  });

  it('reads bucket overrides', () => {
    const config = parseRateLimitConfig({
      RATE_LIMIT_API_MAX: '10',
      RATE_LIMIT_API_WINDOW_SECONDS: ' 30 ',
      RATE_LIMIT_PAGE_MAX: '500',
      RATE_LIMIT_PAGE_WINDOW_SECONDS: '3600',
    });
    expect(config.api).toEqual({ max: 10, windowSeconds: 30 });
    expect(config.page).toEqual({ max: 500, windowSeconds: 3600 });
  });

  it('ignores invalid numbers', () => {
    const config = parseRateLimitConfig({
      RATE_LIMIT_API_MAX: '0',
      RATE_LIMIT_API_WINDOW_SECONDS: '-5',
      RATE_LIMIT_PAGE_MAX: '12abc',
      RATE_LIMIT_PAGE_WINDOW_SECONDS: '999999999',
    });
    expect(config.api).toEqual(DEFAULT_API_BUCKET);
    expect(config.page).toEqual(DEFAULT_PAGE_BUCKET);
  });

  it('can be disabled', () => {
    expect(parseRateLimitConfig({ RATE_LIMIT_ENABLED: 'false' }).enabled).toBe(false);
    expect(parseRateLimitConfig({ RATE_LIMIT_ENABLED: '0' }).enabled).toBe(false);
    expect(parseRateLimitConfig({ RATE_LIMIT_ENABLED: 'garbage' }).enabled).toBe(true);
  });

  it('ignores bypass tokens shorter than 16 characters', () => {
    expect(parseRateLimitConfig({ RATE_LIMIT_BYPASS_TOKEN: 'short' }).bypassToken).toBeNull();
    const token = 'a'.repeat(16);
    expect(parseRateLimitConfig({ RATE_LIMIT_BYPASS_TOKEN: ` ${token} ` }).bypassToken).toBe(token);
  });

  it('normalises the bypass IP allowlist and drops invalid entries', () => {
    const config = parseRateLimitConfig({
      RATE_LIMIT_BYPASS_IPS: '203.0.113.7, 2001:db8:abcd:12::1 ,nonsense,,',
    });
    expect([...config.bypassIps]).toEqual(['203.0.113.7', '2001:db8:abcd:12::/64']);
  });

  it('detects Upstash and Vercel KV credentials', () => {
    expect(
      parseRateLimitConfig({ UPSTASH_REDIS_REST_URL: 'https://u', UPSTASH_REDIS_REST_TOKEN: 't' })
        .redis,
    ).toEqual({ url: 'https://u', token: 't' });
    expect(
      parseRateLimitConfig({ KV_REST_API_URL: 'https://kv', KV_REST_API_TOKEN: 'k' }).redis,
    ).toEqual({ url: 'https://kv', token: 'k' });
    expect(parseRateLimitConfig({ UPSTASH_REDIS_REST_URL: 'https://u' }).redis).toBeNull();
  });
});

describe('parsers', () => {
  it('parseBoolean', () => {
    expect(parseBoolean(undefined, true)).toBe(true);
    expect(parseBoolean('OFF', true)).toBe(false);
    expect(parseBoolean('yes', false)).toBe(true);
  });

  it('parsePositiveInt', () => {
    expect(parsePositiveInt('42', 1, 100)).toBe(42);
    expect(parsePositiveInt('101', 1, 100)).toBe(1);
    expect(parsePositiveInt('1.5', 7, 100)).toBe(7);
    expect(parsePositiveInt('', 7, 100)).toBe(7);
  });
});
