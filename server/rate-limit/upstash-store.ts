import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import type { BucketConfig, RedisConfig } from './config';
import type { LimitResult, RateLimitStore } from './store';

/** The subset of `Ratelimit` this store relies on (lets tests inject a stub). */
export interface Limiter {
  limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    pending: Promise<unknown>;
  }>;
}

/** Redis calls slower than this are treated as allowed by the Upstash client. */
const UPSTASH_TIMEOUT_MS = 1_000;

/**
 * Wraps an Upstash limiter so Redis failures fail open: the request is allowed and a warning
 * logged, rather than taking the whole site down with the cache.
 */
export class UpstashStore implements RateLimitStore {
  private readonly limiter: Limiter;
  private readonly bucket: BucketConfig;

  constructor(limiter: Limiter, bucket: BucketConfig) {
    this.limiter = limiter;
    this.bucket = bucket;
  }

  async limit(key: string): Promise<LimitResult> {
    try {
      const r = await this.limiter.limit(key);
      return {
        success: r.success,
        limit: r.limit,
        remaining: Math.max(0, r.remaining),
        reset: r.reset,
        pending: r.pending,
      };
    } catch (error) {
      console.warn('[rate-limit] Upstash error, allowing request:', error);
      return {
        success: true,
        limit: this.bucket.max,
        remaining: this.bucket.max,
        reset: Date.now() + this.bucket.windowSeconds * 1000,
      };
    }
  }
}

/** Creates an Upstash sliding-window store for one bucket. */
export function createUpstashStore(
  redis: RedisConfig,
  bucket: BucketConfig,
  prefix: string,
): UpstashStore {
  const limiter = new Ratelimit({
    redis: new Redis({ url: redis.url, token: redis.token }),
    limiter: Ratelimit.slidingWindow(bucket.max, `${bucket.windowSeconds} s`),
    prefix,
    timeout: UPSTASH_TIMEOUT_MS,
    analytics: false,
    enableTelemetry: false,
  });
  return new UpstashStore(limiter, bucket);
}
