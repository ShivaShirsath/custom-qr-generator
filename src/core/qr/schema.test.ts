import { describe, expect, it } from 'vitest';

import { DEFAULT_DESIGN } from './defaults';
import { mergeDeep } from './merge';
import { parseDesign } from './schema';

describe('mergeDeep', () => {
  it('merges nested keys and drops unknown ones', () => {
    const merged = mergeDeep(DEFAULT_DESIGN, { dots: { style: 'dots' }, evil: 1 });
    expect(merged.dots.style).toBe('dots');
    expect(merged.dots.paint).toEqual(DEFAULT_DESIGN.dots.paint);
    expect('evil' in merged).toBe(false);
  });
});

describe('parseDesign', () => {
  it('accepts partial designs', () => {
    const r = parseDesign({ margin: 2, eyeBall: { style: 'diamond' } });
    expect(r.success && r.design.eyeBall.style).toBe('diamond');
  });

  it('rejects invalid enums, colours and logo URLs', () => {
    const r = parseDesign({
      dots: { style: 'triangle', paint: { color: 'red' } },
      logo: { src: 'https://example.com/a.png' },
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues.length).toBeGreaterThanOrEqual(3);
  });
});
