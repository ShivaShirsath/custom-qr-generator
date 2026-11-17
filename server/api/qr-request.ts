import { z } from 'zod';

import {
  DOT_STYLES,
  ERROR_CORRECTION_LEVELS,
  EYE_BALL_STYLES,
  EYE_FRAME_STYLES,
  MAX_DATA_LENGTH,
  parseDesign,
  solid,
  type DeepPartial,
  type QrDesign,
} from '../../src/core/qr';

/** Longest `data` accepted in a GET query (keeps URLs within common limits). */
export const MAX_QUERY_DATA_LENGTH = 2048;
export const MIN_SIZE = 64;
export const MAX_SIZE = 2048;
export const DEFAULT_SIZE = 512;
/** POST bodies may carry a logo as a data URL, so allow ~1.5 MB. */
export const MAX_BODY_BYTES = 1_500_000;

/** A validated request, ready to render. */
export interface QrRequest {
  data: string;
  /** Output width in pixels. */
  size: number;
  design: QrDesign;
  /** Serve as an attachment (`qr.svg`) instead of inline. */
  download: boolean;
}

export type QrRequestResult = { ok: true; value: QrRequest } | { ok: false; issues: string[] };

const HEX_BODY_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const intParam = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, 'Expected a whole number')
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

/** Hex colour with or without the leading '#', normalised to '#rrggbb' style. */
const hexParam = z
  .string()
  .trim()
  .regex(HEX_BODY_RE, 'Expected a hex colour like 1e1b4b or #1e1b4b')
  .transform((v) => `#${v.replace(/^#/, '').toLowerCase()}`);

const enumParam = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.enum(values));

const querySchema = z.object({
  data: z.string().min(1, 'Required').max(MAX_QUERY_DATA_LENGTH),
  size: intParam(MIN_SIZE, MAX_SIZE).optional(),
  ecl: z
    .preprocess(
      (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
      z.enum(ERROR_CORRECTION_LEVELS),
    )
    .optional(),
  margin: intParam(0, 16).optional(),
  dot: enumParam(DOT_STYLES).optional(),
  eyeFrame: enumParam(EYE_FRAME_STYLES).optional(),
  eyeBall: enumParam(EYE_BALL_STYLES).optional(),
  fg: hexParam.optional(),
  bg: z.union([z.literal('transparent'), hexParam]).optional(),
  download: z.enum(['1', 'true', '0', 'false']).optional(),
});

const QUERY_KEYS = Object.keys(querySchema.shape) as (keyof typeof querySchema.shape)[];

const bodySchema = z.object({
  data: z.string().min(1, 'Required').max(MAX_DATA_LENGTH),
  size: z.number().int().min(MIN_SIZE).max(MAX_SIZE).optional(),
  design: z.record(z.string(), z.unknown()).optional(),
});

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.map(String).join('.') || 'request'}: ${i.message}`);
}

function finish(
  data: string,
  size: number | undefined,
  partial: unknown,
  download: boolean,
  issuePrefix = '',
): QrRequestResult {
  const parsed = parseDesign(partial);
  if (!parsed.success) {
    return { ok: false, issues: parsed.issues.map((i) => `${issuePrefix}${i}`) };
  }
  return { ok: true, value: { data, size: size ?? DEFAULT_SIZE, design: parsed.design, download } };
}

/**
 * Parses GET query parameters (`data`, `size`, `ecl`, `margin`, `dot`, `eyeFrame`, `eyeBall`,
 * `fg`, `bg`, `download`) into a validated request. Unknown parameters are ignored.
 */
export function parseQrQuery(params: URLSearchParams): QrRequestResult {
  const raw: Record<string, string | undefined> = {};
  for (const key of QUERY_KEYS) raw[key] = params.get(key) ?? undefined;
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, issues: formatIssues(parsed.error) };

  const q = parsed.data;
  const design: DeepPartial<QrDesign> = {};
  if (q.ecl) design.errorCorrection = q.ecl;
  if (q.margin !== undefined) design.margin = q.margin;
  if (q.dot || q.fg) design.dots = { style: q.dot, paint: q.fg ? solid(q.fg) : undefined };
  if (q.eyeFrame || q.fg) {
    design.eyeFrame = { style: q.eyeFrame, paint: q.fg ? solid(q.fg) : undefined };
  }
  if (q.eyeBall || q.fg) {
    design.eyeBall = { style: q.eyeBall, paint: q.fg ? solid(q.fg) : undefined };
  }
  if (q.bg === 'transparent') design.background = { transparent: true };
  else if (q.bg) design.background = { transparent: false, paint: solid(q.bg) };

  const download = q.download === '1' || q.download === 'true';
  return finish(q.data, q.size, design, download);
}

/** Parses a POST JSON body `{ data, size?, design? }`; `design` is merged onto the defaults. */
export function parseQrBody(body: unknown): QrRequestResult {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, issues: formatIssues(parsed.error) };
  const { data, size, design } = parsed.data;
  return finish(data, size, design ?? {}, false, 'design.');
}
