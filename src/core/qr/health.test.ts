import { describe, expect, it } from 'vitest';

import { contrastRatio, isHexColor, readableTextColor, safeColor } from './color';
import { DEFAULT_DESIGN, solid } from './defaults';
import { assessScannability } from './health';
import { encodeMatrix } from './matrix';
import type { QrDesign } from './types';

const matrix = encodeMatrix('https://example.com', 'M');
const check = (design: QrDesign, id: string) =>
  assessScannability(matrix, design).checks.find((c) => c.id === id);

describe('color utilities', () => {
  it('validates and sanitises hex colours', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#AABBCCDD')).toBe(true);
    expect(isHexColor('red')).toBe(false);
    expect(safeColor('javascript:alert(1)', '#111111')).toBe('#111111');
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(readableTextColor('#111111')).toBe('#ffffff');
    expect(readableTextColor('#fefefe')).toBe('#000000');
  });
});

describe('assessScannability', () => {
  it('rates the default design as good', () => {
    expect(assessScannability(matrix, DEFAULT_DESIGN).level).toBe('good');
  });

  it('flags low contrast', () => {
    const design = { ...DEFAULT_DESIGN, dots: { ...DEFAULT_DESIGN.dots, paint: solid('#eeeeee') } };
    expect(check(design, 'contrast')?.level).toBe('bad');
  });

  it('flags inverted colours', () => {
    const design: QrDesign = {
      ...DEFAULT_DESIGN,
      dots: { ...DEFAULT_DESIGN.dots, paint: solid('#ffffff') },
      background: { ...DEFAULT_DESIGN.background, paint: solid('#000000') },
    };
    expect(check(design, 'polarity')?.level).toBe('warn');
  });

  it('flags a missing quiet zone', () => {
    expect(check({ ...DEFAULT_DESIGN, margin: 0 }, 'quiet-zone')?.level).toBe('bad');
  });

  it('warns when a large logo exceeds what the error correction can recover', () => {
    const design: QrDesign = {
      ...DEFAULT_DESIGN,
      errorCorrection: 'L',
      logo: { ...DEFAULT_DESIGN.logo, src: 'data:image/png;base64,AAAA', size: 0.35 },
    };
    expect(check(design, 'logo')?.level).toBe('bad');
  });
});
