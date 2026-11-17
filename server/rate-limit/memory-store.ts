import type { LimitResult, RateLimitStore } from './store';

interface Entry {
  /** Start of the current fixed window (ms). */
  windowStart: number;
  current: number;
  previous: number;
}

export interface MemoryStoreOptions {
  max: number;
  windowMs: number;
  /** Upper bound on tracked keys; the oldest are evicted first. Default 10 000. */
  maxKeys?: number;
  /** How often expired entries are swept (ms). Default: one window. */
  pruneIntervalMs?: number;
}

/**
 * In-memory sliding-window-counter limiter (same approximation as Upstash's `slidingWindow`):
 * the previous window's count is weighted by how much of it still overlaps the sliding window.
 *
 * State lives in the current isolate only, so on Vercel each instance/region keeps its own
 * counters and they reset on cold starts. It is a best-effort fallback for when Redis is not
 * configured, not a hard guarantee.
 */
export class MemoryStore implements RateLimitStore {
  private readonly entries = new Map<string, Entry>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;
  private readonly pruneIntervalMs: number;
  private lastPrune = 0;

  constructor(options: MemoryStoreOptions) {
    this.max = options.max;
    this.windowMs = options.windowMs;
    this.maxKeys = options.maxKeys ?? 10_000;
    this.pruneIntervalMs = options.pruneIntervalMs ?? options.windowMs;
  }

  /** Number of keys currently tracked (for tests and diagnostics). */
  get size(): number {
    return this.entries.size;
  }

  /** Counts one request for `key`. Blocked requests are not counted. */
  limit(key: string): Promise<LimitResult> {
    return Promise.resolve(this.hit(key, Date.now()));
  }

  private hit(key: string, now: number): LimitResult {
    this.maybePrune(now);

    const windowStart = now - (now % this.windowMs);
    const entry = this.roll(this.entries.get(key), windowStart);
    const reset = windowStart + this.windowMs;

    const overlap = 1 - (now - windowStart) / this.windowMs;
    const used = entry.previous * overlap + entry.current;
    const success = used + 1 <= this.max;
    if (success) entry.current += 1;

    // Re-insert so Map order tracks recency for eviction.
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.evictOverflow();

    const remaining = Math.max(
      0,
      Math.floor(this.max - (entry.previous * overlap + entry.current)),
    );
    return { success, limit: this.max, remaining, reset };
  }

  private roll(entry: Entry | undefined, windowStart: number): Entry {
    if (!entry) return { windowStart, current: 0, previous: 0 };
    if (entry.windowStart === windowStart) return entry;
    const previous = entry.windowStart === windowStart - this.windowMs ? entry.current : 0;
    return { windowStart, current: 0, previous };
  }

  private maybePrune(now: number): void {
    if (now - this.lastPrune < this.pruneIntervalMs) return;
    this.lastPrune = now;
    // An entry stops mattering once its window is two windows old.
    const cutoff = now - 2 * this.windowMs;
    for (const [key, entry] of this.entries) {
      if (entry.windowStart <= cutoff) this.entries.delete(key);
    }
  }

  private evictOverflow(): void {
    while (this.entries.size > this.maxKeys) {
      const oldest = this.entries.keys().next();
      if (oldest.done) return;
      this.entries.delete(oldest.value);
    }
  }
}
