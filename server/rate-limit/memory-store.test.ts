import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryStore } from './memory-store';

const WINDOW = 60_000;

describe('MemoryStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to max requests per window, then blocks', async () => {
    const store = new MemoryStore({ max: 3, windowMs: WINDOW });
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await store.limit('a'));
    expect(results.map((r) => r.success)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[0]?.limit).toBe(3);
    expect(results[3]?.reset).toBe(Date.now() + WINDOW);
  });

  it('keeps keys independent', async () => {
    const store = new MemoryStore({ max: 1, windowMs: WINDOW });
    expect((await store.limit('a')).success).toBe(true);
    expect((await store.limit('a')).success).toBe(false);
    expect((await store.limit('b')).success).toBe(true);
  });

  it('slides: the previous window still counts until it has rolled off', async () => {
    const store = new MemoryStore({ max: 3, windowMs: WINDOW });
    for (let i = 0; i < 3; i++) await store.limit('a');
    expect((await store.limit('a')).success).toBe(false);

    // Start of the next window: the previous window weighs 100%.
    vi.advanceTimersByTime(WINDOW);
    expect((await store.limit('a')).success).toBe(false);

    // Halfway: previous counts 1.5, so one more fits.
    vi.advanceTimersByTime(WINDOW / 2);
    expect((await store.limit('a')).success).toBe(true);
    expect((await store.limit('a')).success).toBe(false);

    // Two windows later everything has expired.
    vi.advanceTimersByTime(2 * WINDOW);
    const fresh = await store.limit('a');
    expect(fresh.success).toBe(true);
    expect(fresh.remaining).toBe(2);
  });

  it('prunes expired keys', async () => {
    const store = new MemoryStore({ max: 5, windowMs: WINDOW });
    await store.limit('a');
    await store.limit('b');
    expect(store.size).toBe(2);
    vi.advanceTimersByTime(3 * WINDOW);
    await store.limit('c');
    expect(store.size).toBe(1);
  });

  it('bounds memory by evicting the least recently seen keys', async () => {
    const store = new MemoryStore({ max: 1, windowMs: WINDOW, maxKeys: 2 });
    await store.limit('a');
    await store.limit('b');
    await store.limit('c');
    expect(store.size).toBe(2);
    // "a" was evicted, so it starts over.
    expect((await store.limit('a')).success).toBe(true);
    expect((await store.limit('c')).success).toBe(false);
  });
});
