import { describe, expect, it } from 'vitest';

import { DEFAULT_DESIGN, isSafeLogoSrc, renderQrSvg } from '@/core/qr';
import { decodeSvg } from '@/core/qr/test-utils';

import { LOGO_PRESETS, presetDataUrl } from './presets';

const PAYLOAD = 'https://example.com/menu';

describe('logo presets', () => {
  it('keeps badge and mark colours independent', () => {
    const wa = LOGO_PRESETS.find((p) => p.id === 'brand:whatsapp')!;
    const svg = wa.toSvg({ color: '#ff0000', badgeColor: '#0000ff', plain: false });
    expect(svg).toContain('fill="#ff0000"');
    // The badge is a gradient derived from its colour: #0000ff darkens to #0000e0 at the bottom.
    expect(svg).toContain('#0000e0');
    const flat = wa.toSvg({ color: '#ff0000', badgeColor: '#0000ff', plain: true });
    expect(flat).toContain('fill="#ff0000"');
    expect(flat).not.toContain('#0000e0');
  });

  it('produce safe, embeddable data URLs', () => {
    for (const preset of LOGO_PRESETS) {
      expect(isSafeLogoSrc(presetDataUrl(preset)), preset.id).toBe(true);
      expect(
        isSafeLogoSrc(presetDataUrl(preset, { color: '#123456', badgeColor: '#abcdef' }, true)),
        preset.id,
      ).toBe(true);
      expect(
        isSafeLogoSrc(presetDataUrl(preset, { color: '#123456', badgeColor: '#abcdef' })),
        preset.id,
      ).toBe(true);
    }
  });

  it.each(['icon:heart', 'brand:whatsapp', 'brand:snapchat'])(
    '%s keeps the code scannable',
    async (id) => {
      const preset = LOGO_PRESETS.find((p) => p.id === id)!;
      const { svg } = renderQrSvg(PAYLOAD, {
        ...DEFAULT_DESIGN,
        errorCorrection: 'H',
        logo: { ...DEFAULT_DESIGN.logo, src: presetDataUrl(preset) },
      });
      await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
    },
  );
});
