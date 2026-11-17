import { describe, expect, it } from 'vitest';

import { buildContent } from '@/core/content';
import { renderQrSvg } from '@/core/qr';
import { decodeSvg } from '@/core/qr/test-utils';

import { DEFAULT_CONFIG, LOGO_PLACEMENT, configReducer } from './config';

describe('configReducer', () => {
  it('updates content values for one type only', () => {
    const next = configReducer(DEFAULT_CONFIG, {
      type: 'content/update',
      contentType: 'wifi',
      patch: { ssid: 'Home' },
    });
    expect(next.content.values.wifi.ssid).toBe('Home');
    expect(next.content.values.url).toBe(DEFAULT_CONFIG.content.values.url);
  });

  it('raises low error correction when a logo is added', () => {
    const low = configReducer(DEFAULT_CONFIG, {
      type: 'design/update',
      update: (d) => ({ ...d, errorCorrection: 'L' }),
    });
    const withLogo = configReducer(low, {
      type: 'logo/set',
      selection: { kind: 'upload', name: 'a.png' },
      src: 'data:image/png;base64,AAAA',
    });
    expect(withLogo.design.errorCorrection).toBe('H');
    expect(withLogo.design.logo.src).toBe('data:image/png;base64,AAAA');
  });

  it('resets to defaults', () => {
    const changed = configReducer(DEFAULT_CONFIG, { type: 'content/type', contentType: 'text' });
    expect(configReducer(changed, { type: 'reset' })).toBe(DEFAULT_CONFIG);
  });
});

describe('default configuration', () => {
  it('starts with a Violet, transparent link code with a link icon', () => {
    const { design, logo } = DEFAULT_CONFIG;
    expect(DEFAULT_CONFIG.content.type).toBe('url');
    expect(design.dots.paint).toMatchObject({ type: 'linear', rotation: 45 });
    expect(design.background.transparent).toBe(true);
    expect(logo).toEqual({ kind: 'preset', id: 'icon:link', color: null, badgeColor: null });
    expect(design.logo).toMatchObject(LOGO_PLACEMENT);
    expect(DEFAULT_CONFIG.flatBrands).toBe(true);
    expect(design.margin).toBe(2);
  });

  it('scans', async () => {
    const { payload } = buildContent(DEFAULT_CONFIG.content);
    const { svg } = renderQrSvg(payload, DEFAULT_CONFIG.design);
    await expect(decodeSvg(svg)).resolves.toBe(payload);
  });

  it('applies the logo placement defaults only when a first logo is added', () => {
    const noLogo = configReducer(DEFAULT_CONFIG, {
      type: 'logo/set',
      selection: { kind: 'none' },
      src: null,
    });
    const tweaked = configReducer(noLogo, {
      type: 'design/update',
      update: (d) => ({ ...d, logo: { ...d.logo, size: 0.2, padding: 2, shape: 'circle' } }),
    });
    const added = configReducer(tweaked, {
      type: 'logo/set',
      selection: { kind: 'upload', name: 'a.png' },
      src: 'data:image/png;base64,AAAA',
    });
    expect(added.design.logo).toMatchObject(LOGO_PLACEMENT);
    const swapped = configReducer(
      { ...added, design: { ...added.design, logo: { ...added.design.logo, size: 0.2 } } },
      {
        type: 'logo/set',
        selection: { kind: 'upload', name: 'b.png' },
        src: 'data:image/png;base64,BBBB',
      },
    );
    expect(swapped.design.logo.size).toBe(0.2);
  });
});
