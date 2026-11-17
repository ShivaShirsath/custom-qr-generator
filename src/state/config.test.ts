import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG, configReducer } from './config';

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
