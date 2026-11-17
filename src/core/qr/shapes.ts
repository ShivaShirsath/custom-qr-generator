import { circle, diamond, octagon, rect, roundedRect, star, type Radii } from './path';
import type { DotStyle, EyeBallStyle, EyeFrameStyle } from './types';

/** Small overlap into neighbouring modules so anti-aliasing never leaves hairline seams. */
const SEAM = 0.05;

export type ModuleTest = (row: number, col: number) => boolean;

/** Styles whose shapes are independent per module and therefore honour `scale`. */
export const SCALABLE_DOT_STYLES: ReadonlySet<DotStyle> = new Set([
  'square',
  'rounded',
  'dots',
  'leaf',
  'diamond',
  'star',
  'vertical',
  'horizontal',
]);

function runsPath(
  size: number,
  isOn: ModuleTest,
  scale: number,
  orientation: 'vertical' | 'horizontal',
): string {
  const w = Math.max(0.3, scale * 0.86);
  const inset = (1 - w) / 2;
  let d = '';
  for (let line = 0; line < size; line++) {
    let start = -1;
    for (let i = 0; i <= size; i++) {
      const on = i < size && (orientation === 'vertical' ? isOn(i, line) : isOn(line, i));
      if (on && start < 0) start = i;
      if (!on && start >= 0) {
        const len = i - start - 2 * inset;
        const r = w / 2;
        d +=
          orientation === 'vertical'
            ? roundedRect(line + inset, start + inset, w, len, [r, r, r, r])
            : roundedRect(start + inset, line + inset, len, w, [r, r, r, r]);
        start = -1;
      }
    }
  }
  return d;
}

/** Builds one SVG path for every data module in the matrix (finders excluded via `isOn`). */
export function dotsPath(
  size: number,
  isOn: ModuleTest,
  style: DotStyle,
  rawScale: number,
): string {
  const scale = Math.min(1, Math.max(0.5, rawScale));
  if (style === 'vertical' || style === 'horizontal') return runsPath(size, isOn, scale, style);

  const inset = (1 - scale) / 2;
  let d = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isOn(row, col)) continue;
      const cx = col + 0.5;
      const cy = row + 0.5;

      switch (style) {
        case 'square': {
          if (scale < 0.999) {
            d += rect(col + inset, row + inset, scale, scale);
            break;
          }
          d += seamless(row, col, isOn, [0, 0, 0, 0]);
          break;
        }
        case 'rounded':
          d += roundedRect(col + inset, row + inset, scale, scale, uniform(scale * 0.3));
          break;
        case 'fluid': {
          const n = neighbours(row, col, isOn);
          const r = 0.5;
          d += seamless(row, col, isOn, [
            !n.top && !n.left ? r : 0,
            !n.top && !n.right ? r : 0,
            !n.bottom && !n.right ? r : 0,
            !n.bottom && !n.left ? r : 0,
          ]);
          break;
        }
        case 'classy': {
          const n = neighbours(row, col, isOn);
          d += seamless(row, col, isOn, [
            !n.top && !n.left ? 0.5 : 0,
            0,
            !n.bottom && !n.right ? 0.5 : 0,
            0,
          ]);
          break;
        }
        case 'dots':
          d += circle(cx, cy, scale / 2);
          break;
        case 'leaf':
          d += roundedRect(col + inset, row + inset, scale, scale, [scale / 2, 0, scale / 2, 0]);
          break;
        case 'diamond':
          d += diamond(cx, cy, scale * 0.6);
          break;
        case 'star':
          d += star(cx, cy, scale * 0.64, scale * 0.32);
          break;
      }
    }
  }
  return d;
}

function uniform(r: number): Radii {
  return [r, r, r, r];
}

function neighbours(row: number, col: number, isOn: ModuleTest) {
  return {
    top: isOn(row - 1, col),
    right: isOn(row, col + 1),
    bottom: isOn(row + 1, col),
    left: isOn(row, col - 1),
  };
}

/** A full-size module that slightly overlaps any dark neighbour to hide seams. */
function seamless(row: number, col: number, isOn: ModuleTest, radii: Radii): string {
  const n = neighbours(row, col, isOn);
  const x0 = col - (n.left ? SEAM : 0);
  const y0 = row - (n.top ? SEAM : 0);
  const x1 = col + 1 + (n.right ? SEAM : 0);
  const y1 = row + 1 + (n.bottom ? SEAM : 0);
  return roundedRect(x0, y0, x1 - x0, y1 - y0, radii);
}

export type EyeCorner = 'tl' | 'tr' | 'bl';

/** Leaf corners: sharp along the diagonal that points to the centre of the code. */
function leafRadii(corner: EyeCorner, r: number): Radii {
  return corner === 'tl' ? [0, r, 0, r] : [r, 0, r, 0];
}

/** Outer 7×7 ring of a finder pattern; render with fill-rule="evenodd". */
export function eyeFramePath(
  x: number,
  y: number,
  style: EyeFrameStyle,
  corner: EyeCorner,
): string {
  const o = { x, y, s: 7 };
  const i = { x: x + 1, y: y + 1, s: 5 };
  switch (style) {
    case 'square':
      return rect(o.x, o.y, o.s, o.s) + rect(i.x, i.y, i.s, i.s);
    case 'rounded':
      return (
        roundedRect(o.x, o.y, o.s, o.s, uniform(1.8)) + roundedRect(i.x, i.y, i.s, i.s, uniform(1))
      );
    case 'extra-rounded':
      return (
        roundedRect(o.x, o.y, o.s, o.s, uniform(2.8)) +
        roundedRect(i.x, i.y, i.s, i.s, uniform(1.9))
      );
    case 'circle':
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
    case 'leaf':
      return (
        roundedRect(o.x, o.y, o.s, o.s, leafRadii(corner, 2.5)) +
        roundedRect(i.x, i.y, i.s, i.s, leafRadii(corner, 1.5))
      );
    case 'octagon':
      return octagon(o.x, o.y, o.s) + octagon(i.x, i.y, i.s);
  }
}

/** Inner 3×3 ball of a finder pattern. */
export function eyeBallPath(x: number, y: number, style: EyeBallStyle, corner: EyeCorner): string {
  const bx = x + 2;
  const by = y + 2;
  switch (style) {
    case 'square':
      return rect(bx, by, 3, 3);
    case 'rounded':
      return roundedRect(bx, by, 3, 3, uniform(0.9));
    case 'circle':
      return circle(bx + 1.5, by + 1.5, 1.5);
    case 'diamond':
      return diamond(bx + 1.5, by + 1.5, 1.75);
    case 'leaf':
      return roundedRect(bx, by, 3, 3, leafRadii(corner, 1.2));
    case 'octagon':
      return octagon(bx, by, 3);
  }
}

export function eyePositions(size: number): Array<{ x: number; y: number; corner: EyeCorner }> {
  return [
    { x: 0, y: 0, corner: 'tl' },
    { x: size - 7, y: 0, corner: 'tr' },
    { x: 0, y: size - 7, corner: 'bl' },
  ];
}
