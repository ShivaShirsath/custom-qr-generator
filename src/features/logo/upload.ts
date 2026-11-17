export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_RASTER_SIDE = 512;
const ACCEPTED = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

export const ACCEPT_ATTR = ACCEPTED.join(',');

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Turns an uploaded file into a data URL suitable for embedding. Raster images are
 * downscaled to 512px and re-encoded as PNG (which also strips metadata); SVGs are kept
 * as vectors.
 */
export async function prepareLogo(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type))
    throw new Error('Use a PNG, JPEG, WebP, GIF, AVIF or SVG image.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Images must be 5 MB or smaller.');
  if (file.type === 'image/svg+xml') return readAsDataUrl(file);

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('This image could not be decoded.');
  });
  const scale = Math.min(1, MAX_RASTER_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/png');
}
