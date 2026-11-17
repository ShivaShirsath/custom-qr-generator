import { QrEncodeError, renderQrSvg } from '../../src/core/qr';
import { MAX_BODY_BYTES, parseQrBody, parseQrQuery, type QrRequestResult } from './qr-request';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers':
    'Content-Disposition, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After',
};

/** Locks the SVG down so it can't run script or load anything if opened directly. */
const SVG_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:";

function json(status: number, body: unknown, extra: HeadersInit = {}): Response {
  const headers = new Headers(extra);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(JSON.stringify(body), { status, headers });
}

function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
      'Access-Control-Allow-Headers': 'Content-Type, X-RateLimit-Bypass',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

/**
 * Reads the body as text, refusing more than `maxBytes` (checked against Content-Length up front
 * and against the bytes actually received). Returns null when the limit is exceeded.
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function parsePost(request: Request): Promise<QrRequestResult | Response> {
  const text = await readBodyLimited(request, MAX_BODY_BYTES);
  if (text === null) return json(413, { error: 'payload_too_large', maxBytes: MAX_BODY_BYTES });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  return parseQrBody(body);
}

function render(parsed: QrRequestResult, method: 'GET' | 'POST'): Response {
  if (!parsed.ok) return json(400, { error: 'invalid_request', issues: parsed.issues });
  const { data, size, design, download } = parsed.value;

  let svg: string;
  try {
    svg = renderQrSvg(data, design, { width: size }).svg;
  } catch (error) {
    if (error instanceof QrEncodeError) {
      return json(422, { error: 'encode_failed', message: error.message });
    }
    console.error('[api/qr] render failed:', error);
    return json(500, { error: 'internal_error' });
  }

  const headers = new Headers(CORS_HEADERS);
  headers.set('Content-Type', 'image/svg+xml; charset=utf-8');
  headers.set(
    'Cache-Control',
    method === 'GET' ? 'public, max-age=86400, immutable' : 'private, no-store',
  );
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Security-Policy', SVG_CSP);
  if (download) headers.set('Content-Disposition', 'attachment; filename="qr.svg"');
  return new Response(svg, { status: 200, headers });
}

/**
 * Public QR endpoint. `GET /api/qr?data=...` or `POST /api/qr` with a JSON body; responds with an
 * SVG, or a JSON error (400 invalid input, 413 body too large, 422 data won't fit, 405 method).
 * Rate limiting is applied upstream by the routing middleware.
 */
export async function handleQrRequest(request: Request): Promise<Response> {
  switch (request.method) {
    case 'OPTIONS':
      return preflight();
    case 'GET':
      return render(parseQrQuery(new URL(request.url).searchParams), 'GET');
    case 'POST': {
      const parsed = await parsePost(request);
      return parsed instanceof Response ? parsed : render(parsed, 'POST');
    }
    default:
      return json(405, { error: 'method_not_allowed' }, { Allow: ALLOWED_METHODS });
  }
}
