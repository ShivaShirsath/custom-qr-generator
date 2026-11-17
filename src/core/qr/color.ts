const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}

/** Returns a safe hex colour, falling back when the input is not a valid hex string. */
export function safeColor(value: unknown, fallback = '#000000'): string {
  return isHexColor(value) ? value.toLowerCase() : fallback;
}

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): Rgba {
  let h = safeColor(hex).slice(1);
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks black or white text for the best legibility on the given background. */
export function readableTextColor(background: string): string {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#ffffff')
    ? '#000000'
    : '#ffffff';
}
