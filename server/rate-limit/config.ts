import { normalizeIp } from './ip';

/** Environment variables as read from `process.env` (all optional strings). */
export type Env = Readonly<Record<string, string | undefined>>;

export interface BucketConfig {
  /** Requests allowed per window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RedisConfig {
  url: string;
  token: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  api: BucketConfig;
  page: BucketConfig;
  /** Owner bypass secret, or null when unset or too short to be safe. */
  bypassToken: string | null;
  /** Normalised client keys (IPv4, or IPv6 /64 prefixes) that are never limited. */
  bypassIps: ReadonlySet<string>;
  /** Upstash credentials; null means the per-instance in-memory store is used. */
  redis: RedisConfig | null;
}

export const DEFAULT_API_BUCKET: BucketConfig = { max: 30, windowSeconds: 60 };
export const DEFAULT_PAGE_BUCKET: BucketConfig = { max: 120, windowSeconds: 60 };

/** Bypass tokens shorter than this are ignored so a weak secret can't be brute-forced. */
export const MIN_BYPASS_TOKEN_LENGTH = 16;

const MAX_REQUESTS = 1_000_000;
const MAX_WINDOW_SECONDS = 86_400;

const FALSE_VALUES = new Set(['0', 'false', 'no', 'off', 'disabled']);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);

/** Parses a boolean-ish env value; anything unrecognised yields `fallback`. */
export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  const v = value?.trim().toLowerCase();
  if (!v) return fallback;
  if (FALSE_VALUES.has(v)) return false;
  if (TRUE_VALUES.has(v)) return true;
  return fallback;
}

/** Parses a positive integer within `[1, max]`; anything else yields `fallback`. */
export function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const v = value?.trim();
  if (!v || !/^\d+$/.test(v)) return fallback;
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 1 && n <= max ? n : fallback;
}

function parseBucket(env: Env, prefix: string, defaults: BucketConfig): BucketConfig {
  return {
    max: parsePositiveInt(env[`${prefix}_MAX`], defaults.max, MAX_REQUESTS),
    windowSeconds: parsePositiveInt(
      env[`${prefix}_WINDOW_SECONDS`],
      defaults.windowSeconds,
      MAX_WINDOW_SECONDS,
    ),
  };
}

function parseBypassIps(value: string | undefined): Set<string> {
  const out = new Set<string>();
  for (const part of value?.split(',') ?? []) {
    const ip = normalizeIp(part);
    if (ip) out.add(ip);
  }
  return out;
}

function parseRedis(env: Env): RedisConfig | null {
  const url = (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL)?.trim();
  const token = (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN)?.trim();
  return url && token ? { url, token } : null;
}

/**
 * Builds the rate-limit configuration from environment variables. Every value is optional and
 * invalid values silently fall back to safe defaults, so a typo never disables protection.
 */
export function parseRateLimitConfig(env: Env): RateLimitConfig {
  const token = env.RATE_LIMIT_BYPASS_TOKEN?.trim() ?? '';
  return {
    enabled: parseBoolean(env.RATE_LIMIT_ENABLED, true),
    api: parseBucket(env, 'RATE_LIMIT_API', DEFAULT_API_BUCKET),
    page: parseBucket(env, 'RATE_LIMIT_PAGE', DEFAULT_PAGE_BUCKET),
    bypassToken: token.length >= MIN_BYPASS_TOKEN_LENGTH ? token : null,
    bypassIps: parseBypassIps(env.RATE_LIMIT_BYPASS_IPS),
    redis: parseRedis(env),
  };
}
