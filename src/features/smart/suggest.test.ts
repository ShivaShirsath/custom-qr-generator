import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT, DEFAULT_VALUES, type ContentState } from '@/core/content';
import { contrastRatio } from '@/core/qr';

import { scannableColor } from './look';
import { suggestLook } from './suggest';

const url = (u: string): ContentState => ({
  type: 'url',
  values: { ...DEFAULT_VALUES, url: { url: u } },
});

describe('suggestLook', () => {
  it.each([
    ['https://wa.me/919876543210', 'brand:whatsapp'],
    ['instagram.com/someone', 'brand:instagram'],
    ['https://www.youtube.com/watch?v=x', 'brand:youtube'],
    ['youtu.be/abc', 'brand:youtube'],
    ['https://twitter.com/x', 'brand:x'],
    ['https://maps.app.goo.gl/abc', 'brand:googlemaps'],
    ['https://www.google.com/maps/place/x', 'brand:googlemaps'],
    ['https://example.com', undefined],
  ])('%s → %s', (u, key) => {
    expect(suggestLook(url(u))?.key).toBe(key);
  });

  it('maps content types and UPI handles', () => {
    expect(suggestLook({ ...DEFAULT_CONTENT, type: 'wifi' })?.logoId).toBe('icon:wifi');
    expect(
      suggestLook({
        type: 'upi',
        values: { ...DEFAULT_VALUES, upi: { ...DEFAULT_VALUES.upi, vpa: 'me@ybl' } },
      })?.logoId,
    ).toBe('brand:phonepe');
    expect(suggestLook({ ...DEFAULT_CONTENT, type: 'text' })).toBeNull();
  });
});

describe('scannableColor', () => {
  it('keeps colours readable on white', () => {
    for (const c of ['#25d366', '#fffc00', '#1ed760', '#e4405f', '#000000']) {
      expect(contrastRatio(scannableColor(c), '#ffffff'), c).toBeGreaterThanOrEqual(4.2);
    }
  });
});
