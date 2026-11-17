import { describe, expect, it } from 'vitest';

import handler, { config } from '../../api/qr';
import { MAX_BODY_BYTES } from './qr-request';
import { readBodyLimited } from './qr-handler';

const BASE = 'https://qr.example/api/qr';

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request(BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });

describe('api/qr', () => {
  it('runs on the edge runtime', () => {
    expect(config.runtime).toBe('edge');
  });

  it('GET returns a locked-down, cacheable SVG', async () => {
    const res = await handler(new Request(`${BASE}?data=hello&size=256&fg=ff0000`));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400, immutable');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
    );
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('content-disposition')).toBeNull();
    const svg = await res.text();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="256"');
    expect(svg).toContain('#ff0000');
  });

  it('GET download=1 serves an attachment', async () => {
    const res = await handler(new Request(`${BASE}?data=hello&download=1`));
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="qr.svg"');
  });

  it('GET with invalid params returns 400 with issues', async () => {
    const res = await handler(new Request(`${BASE}?size=5`));
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = (await res.json()) as { error: string; issues: string[] };
    expect(body.error).toBe('invalid_request');
    expect(body.issues.length).toBeGreaterThanOrEqual(2);
  });

  it('POST renders a design from JSON', async () => {
    const res = await handler(
      post(
        JSON.stringify({ data: 'hi', size: 128, design: { background: { transparent: true } } }),
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(await res.text()).toContain('width="128"');
  });

  it('POST rejects malformed JSON and invalid designs', async () => {
    const bad = await handler(post('{nope'));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'invalid_json' });

    const invalid = await handler(post(JSON.stringify({ data: 'x', design: { margin: 99 } })));
    expect(invalid.status).toBe(400);
    expect(((await invalid.json()) as { issues: string[] }).issues[0]).toMatch(/^design\.margin/);
  });

  it('POST rejects oversized bodies by Content-Length and by actual size', async () => {
    const declared = await handler(post('{}', { 'content-length': String(MAX_BODY_BYTES + 1) }));
    expect(declared.status).toBe(413);

    const huge = JSON.stringify({ data: 'x', pad: 'a'.repeat(MAX_BODY_BYTES) });
    const actual = await handler(post(huge));
    expect(actual.status).toBe(413);
    expect(await actual.json()).toEqual({ error: 'payload_too_large', maxBytes: MAX_BODY_BYTES });
  });

  it('returns 422 when the data does not fit in a QR code', async () => {
    const data = 'é'.repeat(2000); // 4000 UTF-8 bytes > version 40 capacity
    const res = await handler(post(JSON.stringify({ data, design: { errorCorrection: 'H' } })));
    expect(res.status).toBe(422);
    expect(((await res.json()) as { error: string }).error).toBe('encode_failed');
  });

  it('answers CORS preflight', async () => {
    const res = await handler(new Request(BASE, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, POST, OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toContain('Content-Type');
  });

  it('rejects other methods with 405 and Allow', async () => {
    const res = await handler(new Request(BASE, { method: 'DELETE' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, POST, OPTIONS');
  });
});

describe('readBodyLimited', () => {
  it('reads bodies within the limit', async () => {
    expect(await readBodyLimited(post('hello'), 10)).toBe('hello');
    expect(await readBodyLimited(new Request(BASE), 10)).toBe('');
  });

  it('stops at the limit', async () => {
    expect(await readBodyLimited(post('x'.repeat(11)), 10)).toBeNull();
  });
});
