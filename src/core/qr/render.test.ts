import { describe, expect, it } from 'vitest';

import { DEFAULT_DESIGN, solid } from './defaults';
import { QrEncodeError, encodeMatrix } from './matrix';
import { renderQrSvg } from './render';
import { decodeSvg } from './test-utils';
import {
  DOT_STYLES,
  EYE_BALL_STYLES,
  EYE_FRAME_STYLES,
  FRAME_STYLES,
  type QrDesign,
} from './types';

const PAYLOAD = 'https://example.com/hello?from=qr';

const LOGO =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#e11d48"/></svg>',
  ).toString('base64');

function design(patch: Partial<QrDesign>): QrDesign {
  return { ...DEFAULT_DESIGN, ...patch };
}

describe('encodeMatrix', () => {
  it('encodes UTF-8 text and reports version/size', () => {
    const m = encodeMatrix('héllo 👋 नमस्ते', 'M');
    expect(m.size).toBe(m.version * 4 + 17);
    expect(m.modules).toHaveLength(m.size);
  });

  it('rejects empty and oversized input', () => {
    expect(() => encodeMatrix('', 'M')).toThrow(QrEncodeError);
    expect(() => encodeMatrix('x'.repeat(4000), 'H')).toThrow(QrEncodeError);
  });

  it('uses compact modes for numeric data', () => {
    expect(encodeMatrix('1'.repeat(40), 'L').version).toBe(1);
  });
});

describe('renderQrSvg scannability', () => {
  it.each(DOT_STYLES)('dot style "%s" decodes', async (style) => {
    const { svg } = renderQrSvg(
      PAYLOAD,
      design({ dots: { ...DEFAULT_DESIGN.dots, style }, errorCorrection: 'Q' }),
    );
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });

  it.each(EYE_FRAME_STYLES)('eye frame "%s" decodes', async (style) => {
    const { svg } = renderQrSvg(
      PAYLOAD,
      design({ eyeFrame: { ...DEFAULT_DESIGN.eyeFrame, style } }),
    );
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });

  it.each(EYE_BALL_STYLES)('eye ball "%s" decodes', async (style) => {
    const { svg } = renderQrSvg(PAYLOAD, design({ eyeBall: { ...DEFAULT_DESIGN.eyeBall, style } }));
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });

  it.each(FRAME_STYLES)('frame "%s" decodes', async (style) => {
    const { svg } = renderQrSvg(PAYLOAD, design({ frame: { ...DEFAULT_DESIGN.frame, style } }));
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });

  it('decodes with gradients and a separately coloured eye', async () => {
    const { svg } = renderQrSvg(
      PAYLOAD,
      design({
        dots: {
          style: 'dots',
          scale: 0.9,
          paint: { type: 'linear', color: '#4c1d95', color2: '#be185d', rotation: 45 },
        },
        eyeFrame: { style: 'leaf', inherit: false, paint: solid('#0f766e') },
        eyeBall: {
          style: 'circle',
          inherit: false,
          paint: { type: 'radial', color: '#111827', color2: '#1d4ed8', rotation: 0 },
        },
      }),
    );
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });

  it('decodes with an excavated logo at level H', async () => {
    const { svg } = renderQrSvg(
      PAYLOAD,
      design({ errorCorrection: 'H', logo: { ...DEFAULT_DESIGN.logo, src: LOGO, size: 0.25 } }),
    );
    expect(svg).toContain('<image');
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });

  it('decodes a transparent code placed on white', async () => {
    const { svg } = renderQrSvg(PAYLOAD, DEFAULT_DESIGN, { transparent: true });
    expect(svg).not.toContain('<rect width');
    await expect(decodeSvg(svg)).resolves.toBe(PAYLOAD);
  });
});

describe('renderQrSvg safety', () => {
  it('escapes frame text', () => {
    const { svg } = renderQrSvg(
      PAYLOAD,
      design({
        frame: { ...DEFAULT_DESIGN.frame, style: 'caption', text: '<script>"x"</script>' },
      }),
    );
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('ignores non-data logo URLs and invalid colours', () => {
    const { svg } = renderQrSvg(
      PAYLOAD,
      design({
        logo: { ...DEFAULT_DESIGN.logo, src: 'https://tracker.example/pixel.png' },
        dots: { ...DEFAULT_DESIGN.dots, paint: solid('red" onload="alert(1)') },
      }),
    );
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('onload');
  });

  it('honours the requested width and frame aspect ratio', () => {
    const plain = renderQrSvg(PAYLOAD, DEFAULT_DESIGN, { width: 512 });
    expect(plain.width).toBe(512);
    expect(plain.height).toBe(512);
    const framed = renderQrSvg(
      PAYLOAD,
      design({ frame: { ...DEFAULT_DESIGN.frame, style: 'box-bottom' } }),
      { width: 512 },
    );
    expect(framed.height).toBeGreaterThan(512);
  });
});
