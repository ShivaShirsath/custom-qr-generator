/**
 * Minimal SVG path builders. Every closed shape is drawn clockwise (screen coordinates)
 * so overlapping shapes in one path merge under the nonzero fill rule.
 */

/** Formats a number with at most 3 decimals and no trailing zeros. */
export function num(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export type Radii = readonly [tl: number, tr: number, br: number, bl: number];

export function rect(x: number, y: number, w: number, h: number): string {
  return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z`;
}

export function roundedRect(x: number, y: number, w: number, h: number, radii: Radii): string {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, max))) as unknown as Radii;
  if (tl === 0 && tr === 0 && br === 0 && bl === 0) return rect(x, y, w, h);
  const arc = (r: number, dx: number, dy: number) =>
    r > 0 ? `a${num(r)} ${num(r)} 0 0 1 ${num(dx)} ${num(dy)}` : '';
  return (
    `M${num(x + tl)} ${num(y)}` +
    `h${num(w - tl - tr)}${arc(tr, tr, tr)}` +
    `v${num(h - tr - br)}${arc(br, -br, br)}` +
    `h${num(-(w - br - bl))}${arc(bl, -bl, -bl)}` +
    `v${num(-(h - bl - tl))}${arc(tl, tl, -tl)}z`
  );
}

export function circle(cx: number, cy: number, r: number): string {
  return (
    `M${num(cx - r)} ${num(cy)}` +
    `a${num(r)} ${num(r)} 0 1 1 ${num(2 * r)} 0` +
    `a${num(r)} ${num(r)} 0 1 1 ${num(-2 * r)} 0z`
  );
}

export function polygon(points: ReadonlyArray<readonly [number, number]>): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`).join('') + 'z';
}

export function diamond(cx: number, cy: number, r: number): string {
  return polygon([
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ]);
}

/** Regular-ish octagon inscribed in the square (x, y, s). */
export function octagon(x: number, y: number, s: number): string {
  const c = s * 0.2929; // s * (1 - 1/√2)
  return polygon([
    [x + c, y],
    [x + s - c, y],
    [x + s, y + c],
    [x + s, y + s - c],
    [x + s - c, y + s],
    [x + c, y + s],
    [x, y + s - c],
    [x, y + c],
  ]);
}

export function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const coords: Array<[number, number]> = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    coords.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return polygon(coords);
}

/** Escapes text for use in XML text nodes and attribute values. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
