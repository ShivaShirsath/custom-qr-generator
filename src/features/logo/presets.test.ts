import { describe, expect, it } from 'vitest';

import { DEFAULT_DESIGN, isSafeLogoSrc, renderQrSvg } from '@/core/qr';
import { decodeSvg } from '@/core/qr/test-utils';

import { LOGO_PRESETS, presetDataUrl } from './presets';

const PAYLOAD = 'https://example.com/menu';

describe('logo presets', () => {
  it('produce safe, embeddable data URLs', () => {
    for (const preset of LOGO_PRESETS) {
      expect(isSafeLogoSrc(presetDataUrl(preset, null)), preset.id).toBe(true);
      expect(isSafeLogoSrc(presetDataUrl(preset, '#123456', true)), preset.id).toBe(true);
    }
  });

  it.each(['icon:heart', 'brand:whatsapp', 'brand:snapchat'])(
    '%s keeps the code scannable',
    async (id) => {
      const preset = LOGO_PRESETS.find((p) => p.id === id)!;
      const { svg } = renderQrSvg(PAYLOAD, {
        ...DEFAULT_DESIGN,
        errorCorrection: 'H',
        logo: { ...DEFAULT_DESIGN.logo, src: presetDataUrl(preset, null) },
      });
      await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
    },
  );
});
