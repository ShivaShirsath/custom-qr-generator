import qrcode from 'qrcode-generator';

import type { ErrorCorrectionLevel, QrMatrix } from './types';

// The library defaults to Latin-1; encode as UTF-8 so emoji and non-Latin scripts survive.
const utf8 = new TextEncoder();
qrcode.stringToBytes = (s: string) => Array.from(utf8.encode(s));

const NUMERIC_RE = /^\d+$/;
const ALPHANUMERIC_RE = /^[0-9A-Z $%*+\-./:]+$/;

/** Hard cap: version 40 at level L holds 2953 bytes. */
export const MAX_DATA_LENGTH = 2953;

export class QrEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QrEncodeError';
  }
}

type Mode = 'Numeric' | 'Alphanumeric' | 'Byte';

function pickMode(data: string): Mode {
  if (NUMERIC_RE.test(data)) return 'Numeric';
  if (ALPHANUMERIC_RE.test(data)) return 'Alphanumeric';
  return 'Byte';
}

/** Encodes `data` into a QR module matrix, picking the most compact mode and smallest version. */
export function encodeMatrix(data: string, level: ErrorCorrectionLevel): QrMatrix {
  if (data.length === 0) throw new QrEncodeError('Nothing to encode yet.');

  const qr = qrcode(0, level);
  qr.addData(data, pickMode(data));
  try {
    qr.make();
  } catch {
    throw new QrEncodeError(
      `Too much data for a QR code at error correction ${level}. Shorten the content or lower the error correction.`,
    );
  }

  const size = qr.getModuleCount();
  const modules: boolean[][] = [];
  for (let row = 0; row < size; row++) {
    const line: boolean[] = [];
    for (let col = 0; col < size; col++) line.push(qr.isDark(row, col));
    modules.push(line);
  }
  return { size, version: (size - 17) / 4, modules };
}

/** True when (row, col) is part of one of the three 7×7 finder patterns. */
export function isFinderModule(row: number, col: number, size: number): boolean {
  const inTop = row < 7;
  const inLeft = col < 7;
  const inRight = col >= size - 7;
  const inBottom = row >= size - 7;
  return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
}
