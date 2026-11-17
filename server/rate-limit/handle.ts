import { ipAddress } from '@vercel/functions/headers';
import { next } from '@vercel/functions/middleware';

import {
  BYPASS_HEADER,
  bypassCookieRedirect,
  clearBypassCookieResponse,
  isBypassOff,
  isBypassed,
} from './bypass';
import { parseRateLimitConfig, type Env, type RateLimitConfig } from './config';
import { clientKey } from './ip';
import { MemoryStore } from './memory-store';
import { rateLimitHeaders, secondsUntil, tooManyRequests, type BucketKind } from './responses';
import type { RateLimitStore } from './store';
import { createUpstashStore } from './upstash-store';

export interface RateLimitDeps {
  config: RateLimitConfig;
  stores: Record<BucketKind, RateLimitStore>;
  /** Keeps background work alive after the response (Vercel's `waitUntil`). */
  waitUntil: (promise: Promise<unknown>) => void;
  /** Extracts the raw client IP from the request. */
  getIp: (request: Request) => string | undefined;
}

/** `/api` and `/api/*` use the API bucket; everything else counts as a page view. */
export function bucketFor(pathname: string): BucketKind {
  return pathname === '/api' || pathname.startsWith('/api/') ? 'api' : 'page';
}

/** Creates one store per bucket: Upstash when configured, otherwise in-memory. */
export function createStores(config: RateLimitConfig): Record<BucketKind, RateLimitStore> {
  const make = (kind: BucketKind): RateLimitStore => {
    const bucket = config[kind];
    return config.redis
      ? createUpstashStore(config.redis, bucket, `cqg:rl:${kind}`)
      : new MemoryStore({ max: bucket.max, windowMs: bucket.windowSeconds * 1000 });
  };
  return { api: make('api'), page: make('page') };
}

function readEnv(): Env {
  // Read through globalThis so this compiles without Node typings; Edge exposes process.env.
  return (globalThis as { process?: { env?: Env } }).process?.env ?? {};
}

let defaults: Pick<RateLimitDeps, 'config' | 'stores'> | undefined;

/** Config and stores built once per isolate from `process.env`. */
function defaultDeps(): Pick<RateLimitDeps, 'config' | 'stores'> {
  if (!defaults) {
    const config = parseRateLimitConfig(readEnv());
    defaults = { config, stores: createStores(config) };
  }
  return defaults;
}

const isRead = (method: string) => method === 'GET' || method === 'HEAD';

async function countHit(store: RateLimitStore, key: string, deps: RateLimitDeps) {
  try {
    const result = await store.limit(key);
    if (result.pending) deps.waitUntil(result.pending.catch(() => undefined));
    return result;
  } catch (error) {
    console.warn('[rate-limit] store error, allowing request:', error);
    return null;
  }
}

/**
 * Applies IP rate limiting to a request in Vercel Routing Middleware. Returns either a
 * pass-through `next()` response (carrying `RateLimit-*` headers), a 429, or a 307 that sets or
 * clears the owner bypass cookie.
 */
export async function handleRateLimit(
  request: Request,
  overrides: Partial<RateLimitDeps> = {},
): Promise<Response> {
  const deps: RateLimitDeps = {
    ...(overrides.config && overrides.stores
      ? { config: overrides.config, stores: overrides.stores }
      : defaultDeps()),
    waitUntil: overrides.waitUntil ?? (() => undefined),
    getIp: overrides.getIp ?? ((r) => ipAddress(r)),
  };
  const { config } = deps;
  if (!config.enabled) return next();

  const url = new URL(request.url);
  const kind = bucketFor(url.pathname);
  const handlesBypassParam = kind === 'page' && isRead(request.method);
  const key = clientKey(deps.getIp(request));

  if (handlesBypassParam) {
    const redirect = await bypassCookieRedirect(url, config);
    if (redirect) return redirect;
  }

  if (await isBypassed(request, key, config)) {
    if (handlesBypassParam && isBypassOff(url)) return clearBypassCookieResponse(url);
    return next({ headers: { [BYPASS_HEADER]: '1' } });
  }

  const result = await countHit(deps.stores[kind], key, deps);
  if (!result) return next();

  const now = Date.now();
  const headers = rateLimitHeaders(result, now);
  if (!result.success) return tooManyRequests(kind, secondsUntil(result.reset, now), headers);

  if (handlesBypassParam && isBypassOff(url)) return clearBypassCookieResponse(url);
  return next({ headers });
}
