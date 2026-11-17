import type { QrDesign } from './types';

export interface LogoArea {
  /** Logo image box in module coordinates (relative to the code, excluding the quiet zone). */
  x: number;
  y: number;
  size: number;
  /** Logo box grown by the padding: the area kept clear of modules. */
  outer: { x: number; y: number; size: number };
  circular: boolean;
}

const DATA_URL_RE =
  /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml)(?:;[a-z0-9=.+-]+)*,[^"'<>\s]+$/i;

/** Only inline data URLs are accepted so rendered codes never fetch external resources. */
export function isSafeLogoSrc(src: unknown): src is string {
  return typeof src === 'string' && src.length < 4_000_000 && DATA_URL_RE.test(src);
}

export function logoArea(size: number, logo: QrDesign['logo']): LogoArea | null {
  if (!isSafeLogoSrc(logo.src)) return null;
  const ratio = Math.min(0.35, Math.max(0.08, logo.size));
  const logoSize = size * ratio;
  const padding = Math.min(4, Math.max(0, logo.padding));
  const outerSize = logoSize + padding * 2;
  const c = size / 2;
  return {
    x: c - logoSize / 2,
    y: c - logoSize / 2,
    size: logoSize,
    outer: { x: c - outerSize / 2, y: c - outerSize / 2, size: outerSize },
    circular: logo.shape === 'circle',
  };
}

/** True when the module at (row, col) touches the logo's clear area. */
export function isUnderLogo(row: number, col: number, area: LogoArea): boolean {
  const { x, y, size } = area.outer;
  if (area.circular) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const nearestX = Math.max(col, Math.min(cx, col + 1));
    const nearestY = Math.max(row, Math.min(cy, row + 1));
    return (nearestX - cx) ** 2 + (nearestY - cy) ** 2 < (size / 2) ** 2;
  }
  return col + 1 > x && col < x + size && row + 1 > y && row < y + size;
}
