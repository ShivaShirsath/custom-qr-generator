import { describe, expect, it } from 'vitest';

import { DEFAULT_DESIGN, renderQrSvg } from '@/core/qr';
import { decodeSvg } from '@/core/qr/test-utils';

import { surpriseDesign } from './surprise';

/** Small deterministic PRNG (mulberry32) so failures are reproducible. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('surpriseDesign', () => {
  it.each([1, 2, 3, 4, 5, 6])(
    'seed %i produces a scannable code',
    async (seed) => {
      const design = surpriseDesign({ ...DEFAULT_DESIGN, errorCorrection: 'Q' }, seeded(seed));
      const { svg } = renderQrSvg('https://example.com/surprise', design);
      await expect(decodeSvg(svg)).resolves.toBe('https://example.com/surprise');
    },
    30_000,
  );

  it('keeps logo and frame untouched', () => {
    const current = {
      ...DEFAULT_DESIGN,
      frame: { ...DEFAULT_DESIGN.frame, style: 'pill' as const },
    };
    const next = surpriseDesign(current, seeded(9));
    expect(next.frame).toBe(current.frame);
    expect(next.logo).toBe(current.logo);
  });
});
