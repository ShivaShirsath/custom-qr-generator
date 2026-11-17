/** Outcome of counting one request against a bucket. */
export interface LimitResult {
  /** Whether the request may proceed. */
  success: boolean;
  /** Requests allowed per window. */
  limit: number;
  /** Requests left in the current window (never negative). */
  remaining: number;
  /** Unix time in milliseconds when the current window ends. */
  reset: number;
  /** Background work (e.g. Upstash sync) to hand to `waitUntil`. */
  pending?: Promise<unknown>;
}

/** A rate-limit backend: counts a hit for `key` and reports whether it is allowed. */
export interface RateLimitStore {
  limit(key: string): Promise<LimitResult>;
}
