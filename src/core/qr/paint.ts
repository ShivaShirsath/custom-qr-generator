import { safeColor } from './color';
import { num } from './path';
import type { Paint } from './types';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PaintRef {
  /** Value for a `fill` attribute. */
  fill: string;
  /** Gradient definition for `<defs>`, empty for solid paints. */
  def: string;
}

/** Resolves a paint to a fill attribute plus an optional gradient definition spanning `box`. */
export function resolvePaint(id: string, paint: Paint, box: Box): PaintRef {
  const c1 = safeColor(paint.color);
  if (paint.type === 'solid') return { fill: c1, def: '' };

  const c2 = safeColor(paint.color2, c1);
  const stops = `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>`;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  if (paint.type === 'radial') {
    const r = Math.max(box.w, box.h) / Math.SQRT2;
    return {
      fill: `url(#${id})`,
      def: `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}">${stops}</radialGradient>`,
    };
  }

  const angle = ((Number.isFinite(paint.rotation) ? paint.rotation : 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const half = (Math.abs(box.w * cos) + Math.abs(box.h * sin)) / 2;
  return {
    fill: `url(#${id})`,
    def:
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ` +
      `x1="${num(cx - cos * half)}" y1="${num(cy - sin * half)}" ` +
      `x2="${num(cx + cos * half)}" y2="${num(cy + sin * half)}">${stops}</linearGradient>`,
  };
}

/** All colours a paint can show, used for contrast checks. */
export function paintColors(paint: Paint): string[] {
  return paint.type === 'solid'
    ? [safeColor(paint.color)]
    : [safeColor(paint.color), safeColor(paint.color2)];
}
