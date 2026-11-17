import { MemoryStore } from './memory-store';
import { parseRateLimitConfig, type Env } from './config';
import type { RateLimitDeps } from './handle';

export const TOKEN = 'owner-secret-token-0123456789abcdef';

/** Deps with in-memory stores and a fixed client IP, for handler tests. */
export function testDeps(env: Env = {}, ip = '203.0.113.7'): Partial<RateLimitDeps> {
  const config = parseRateLimitConfig({ RATE_LIMIT_BYPASS_TOKEN: TOKEN, ...env });
  return {
    config,
    stores: {
      api: new MemoryStore({ max: config.api.max, windowMs: config.api.windowSeconds * 1000 }),
      page: new MemoryStore({ max: config.page.max, windowMs: config.page.windowSeconds * 1000 }),
    },
    getIp: () => ip,
  };
}
