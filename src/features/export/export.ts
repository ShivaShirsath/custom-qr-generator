import { renderMatrixSvg, type QrDesign, type QrMatrix } from '@/core/qr';
import type { ExportFormat, ExportSettings } from '@/state';

const MIME: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

export const EXTENSION: Record<ExportFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  svg: 'svg',
};

/** JPEG cannot store transparency. */
export const supportsTransparency = (format: ExportFormat) => format !== 'jpeg';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not render the QR code image.'));
    img.src = url;
  });
}

/** Draws an SVG onto a canvas and encodes it as PNG, JPEG or WebP. */
export async function rasterize(
  svg: string,
  width: number,
  height: number,
  format: Exclude<ExportFormat, 'svg'>,
  fill?: string,
): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: MIME.svg }));
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Export failed.'))),
        MIME[format],
        format === 'png' ? undefined : 0.95,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function sanitizeFileName(name: string): string {
  const clean = Array.from(name.trim())
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return clean || 'qr-code';
}

/** Renders the code in the requested format and size. */
export async function exportQr(
  matrix: QrMatrix,
  design: QrDesign,
  settings: Pick<ExportSettings, 'format' | 'size' | 'transparent'>,
): Promise<Blob> {
  const transparent = settings.transparent && supportsTransparency(settings.format);
  const { svg, width, height } = renderMatrixSvg(matrix, design, {
    width: settings.size,
    transparent,
  });
  if (settings.format === 'svg') return new Blob([svg], { type: MIME.svg });
  // JPEG with a transparent design still needs an opaque canvas.
  const fill = settings.format === 'jpeg' && design.background.transparent ? '#ffffff' : undefined;
  return rasterize(svg, width, height, settings.format, fill);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canCopyImage = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.clipboard &&
  typeof window.ClipboardItem !== 'undefined';

/** Copies a PNG to the clipboard. The blob promise keeps Safari's user-gesture requirement happy. */
export async function copyPng(blob: Promise<Blob>): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
