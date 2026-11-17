import { readableTextColor, safeColor } from './color';
import { isSafeLogoSrc, isUnderLogo, logoArea, type LogoArea } from './logo';
import { encodeMatrix, isFinderModule } from './matrix';
import { resolvePaint, type Box } from './paint';
import { circle, escapeXml, num, roundedRect } from './path';
import { SCALABLE_DOT_STYLES, dotsPath, eyeBallPath, eyeFramePath, eyePositions } from './shapes';
import type { QrDesign, QrMatrix, RenderOptions, RenderResult } from './types';

const FONT_STACK =
  "'Plus Jakarta Sans Variable','Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const clamp = (v: number, lo: number, hi: number) =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;

interface Layout {
  width: number;
  height: number;
  /** Top-left of the quiet-zone box. */
  qrX: number;
  qrY: number;
  /** Side of the quiet-zone box (code + 2 × margin). */
  qrSide: number;
  frame: string;
}

function textElement(
  text: string,
  cx: number,
  cy: number,
  fontSize: number,
  maxWidth: number,
  color: string,
): string {
  const clean = text.trim().slice(0, 40);
  if (!clean) return '';
  // Rough width estimate for bold sans-serif; squeeze long captions to fit.
  const estimated = clean.length * fontSize * 0.62;
  const fit =
    estimated > maxWidth ? ` textLength="${num(maxWidth)}" lengthAdjust="spacingAndGlyphs"` : '';
  return (
    `<text x="${num(cx)}" y="${num(cy)}" fill="${color}" font-family="${FONT_STACK}" ` +
    `font-size="${num(fontSize)}" font-weight="700" letter-spacing="${num(fontSize * 0.04)}" ` +
    `text-anchor="middle" dominant-baseline="central"${fit}>${escapeXml(clean)}</text>`
  );
}

function computeLayout(qrSide: number, frame: QrDesign['frame']): Layout {
  const color = safeColor(frame.color, '#000000');
  const textColor = safeColor(frame.textColor, readableTextColor(color));

  switch (frame.style) {
    case 'caption': {
      const band = qrSide * 0.16;
      const label = textElement(
        frame.text,
        qrSide / 2,
        qrSide + band * 0.4,
        band * 0.52,
        qrSide * 0.86,
        color,
      );
      return { width: qrSide, height: qrSide + band, qrX: 0, qrY: 0, qrSide, frame: label };
    }
    case 'box-bottom':
    case 'box-top': {
      const t = Math.max(0.8, qrSide * 0.035);
      const band = qrSide * 0.18;
      const width = qrSide + 2 * t;
      const height = qrSide + t + band;
      const outerR = qrSide * 0.07;
      const innerR = outerR * 0.55;
      const top = frame.style === 'box-top';
      const qrY = top ? band : t;
      const ring =
        `<path fill="${color}" fill-rule="evenodd" d="` +
        roundedRect(0, 0, width, height, [outerR, outerR, outerR, outerR]) +
        roundedRect(t, qrY, qrSide, qrSide, [innerR, innerR, innerR, innerR]) +
        `"/>`;
      const labelY = top ? band / 2 : qrY + qrSide + band / 2;
      const label = textElement(
        frame.text,
        width / 2,
        labelY,
        band * 0.46,
        width * 0.84,
        textColor,
      );
      return { width, height, qrX: t, qrY, qrSide, frame: ring + label };
    }
    case 'pill': {
      const gap = qrSide * 0.02;
      const pillH = qrSide * 0.15;
      const pillW = qrSide * 0.78;
      const pillX = (qrSide - pillW) / 2;
      const pillY = qrSide + gap;
      const r = pillH / 2;
      const pill = `<path fill="${color}" d="${roundedRect(pillX, pillY, pillW, pillH, [r, r, r, r])}"/>`;
      const label = textElement(
        frame.text,
        qrSide / 2,
        pillY + pillH / 2,
        pillH * 0.48,
        pillW * 0.82,
        textColor,
      );
      return {
        width: qrSide,
        height: pillY + pillH + qrSide * 0.03,
        qrX: 0,
        qrY: 0,
        qrSide,
        frame: pill + label,
      };
    }
    default:
      return { width: qrSide, height: qrSide, qrX: 0, qrY: 0, qrSide, frame: '' };
  }
}

function logoMarkup(area: LogoArea, logo: QrDesign['logo']): string {
  const bg = safeColor(logo.background, '#ffffff');
  const { x, y, size } = area.outer;
  let backdrop = '';
  if (logo.shape === 'square')
    backdrop = `<rect x="${num(x)}" y="${num(y)}" width="${num(size)}" height="${num(size)}" fill="${bg}"/>`;
  if (logo.shape === 'rounded') {
    const r = size * 0.22;
    backdrop = `<path fill="${bg}" d="${roundedRect(x, y, size, size, [r, r, r, r])}"/>`;
  }
  if (logo.shape === 'circle')
    backdrop = `<path fill="${bg}" d="${circle(x + size / 2, y + size / 2, size / 2)}"/>`;

  // Circles need a slightly smaller image so square artwork stays inside the disc.
  const inset = logo.shape === 'circle' ? area.size * 0.12 : 0;
  const href = escapeXml(logo.src ?? '');
  const image =
    `<image href="${href}" x="${num(area.x + inset)}" y="${num(area.y + inset)}" ` +
    `width="${num(area.size - inset * 2)}" height="${num(area.size - inset * 2)}" preserveAspectRatio="xMidYMid meet"/>`;
  return backdrop + image;
}

/** Renders a styled QR code as a standalone SVG string from an already-encoded matrix. */
export function renderMatrixSvg(
  matrix: QrMatrix,
  design: QrDesign,
  options: RenderOptions = {},
): RenderResult {
  const n = matrix.size;
  const margin = clamp(Math.round(design.margin), 0, 16);
  const qrSide = n + margin * 2;
  const layout = computeLayout(qrSide, design.frame);
  const transparent = options.transparent ?? design.background.transparent;

  const area = logoArea(n, design.logo);
  const excavate = area !== null && design.logo.excavate;
  const isOn = (row: number, col: number) =>
    row >= 0 &&
    col >= 0 &&
    row < n &&
    col < n &&
    matrix.modules[row]![col]! &&
    !isFinderModule(row, col, n) &&
    !(excavate && isUnderLogo(row, col, area));

  // Gradients for the code are laid out in code-local coordinates (inside the translated group).
  const codeBox: Box = { x: 0, y: 0, w: n, h: n };
  const dotsPaint = resolvePaint('qr-dots', design.dots.paint, codeBox);
  const framePaint = design.eyeFrame.inherit
    ? dotsPaint
    : resolvePaint('qr-eye-frame', design.eyeFrame.paint, codeBox);
  const ballPaint = design.eyeBall.inherit
    ? dotsPaint
    : resolvePaint('qr-eye-ball', design.eyeBall.paint, codeBox);
  const bgPaint = resolvePaint('qr-bg', design.background.paint, {
    x: 0,
    y: 0,
    w: layout.width,
    h: layout.height,
  });

  const defs = [dotsPaint.def, framePaint.def, ballPaint.def, transparent ? '' : bgPaint.def]
    .filter((def, i, all) => def && all.indexOf(def) === i)
    .join('');

  let background = '';
  if (!transparent) {
    const r =
      (clamp(design.background.radius, 0, 50) / 100) * Math.min(layout.width, layout.height);
    background =
      r > 0
        ? `<path fill="${bgPaint.fill}" d="${roundedRect(0, 0, layout.width, layout.height, [r, r, r, r])}"/>`
        : `<rect width="${num(layout.width)}" height="${num(layout.height)}" fill="${bgPaint.fill}"/>`;
  }

  const scale = SCALABLE_DOT_STYLES.has(design.dots.style) ? design.dots.scale : 1;
  const dots = dotsPath(n, isOn, design.dots.style, scale);

  let frames = '';
  let balls = '';
  for (const eye of eyePositions(n)) {
    frames += eyeFramePath(eye.x, eye.y, design.eyeFrame.style, eye.corner);
    balls += eyeBallPath(eye.x, eye.y, design.eyeBall.style, eye.corner);
  }

  const ox = layout.qrX + margin;
  const oy = layout.qrY + margin;
  const code =
    `<g transform="translate(${num(ox)} ${num(oy)})">` +
    (dots ? `<path fill="${dotsPaint.fill}" d="${dots}"/>` : '') +
    `<path fill="${framePaint.fill}" fill-rule="evenodd" d="${frames}"/>` +
    `<path fill="${ballPaint.fill}" d="${balls}"/>` +
    (area && isSafeLogoSrc(design.logo.src) ? logoMarkup(area, design.logo) : '') +
    `</g>`;

  const width = Math.round(clamp(options.width ?? 1024, 16, 8192));
  const height = Math.round((width * layout.height) / layout.width);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${num(layout.width)} ${num(layout.height)}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    background +
    layout.frame +
    code +
    `</svg>`;

  return { svg, width, height, matrix };
}

/** Encodes `data` and renders it as a styled SVG. Throws `QrEncodeError` for invalid input. */
export function renderQrSvg(
  data: string,
  design: QrDesign,
  options: RenderOptions = {},
): RenderResult {
  return renderMatrixSvg(encodeMatrix(data, design.errorCorrection), design, options);
}
