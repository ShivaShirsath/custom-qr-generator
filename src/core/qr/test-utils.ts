import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { Resvg } from '@resvg/resvg-js';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

// Load the decoder from node_modules instead of the default CDN.
const require = createRequire(import.meta.url);
const wasmPath = require.resolve('zxing-wasm/reader/zxing_reader.wasm');
prepareZXingModule({
  overrides: { wasmBinary: readFileSync(wasmPath).buffer as ArrayBuffer },
});

async function decodeAt(svg: string, width: number): Promise<string | null> {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: '#ffffff',
  })
    .render()
    .asPng();
  const results = await readBarcodes(new Uint8Array(png), {
    formats: ['QRCode'],
    tryHarder: false,
    tryInvert: true,
  });
  return results.find((r) => r.isValid)?.text ?? null;
}

/**
 * Rasterises an SVG on white at several sizes and returns the decoded payload only when
 * every size reads the same value, otherwise null.
 */
export async function decodeSvg(svg: string, widths = [320, 480, 720]): Promise<string | null> {
  const decoded = await Promise.all(widths.map((w) => decodeAt(svg, w)));
  const first = decoded[0] ?? null;
  return decoded.every((d) => d === first) ? first : null;
}
