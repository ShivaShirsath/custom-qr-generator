import { describe, expect, it } from 'vitest';

import { DEFAULT_DESIGN, MAX_DATA_LENGTH } from '../../src/core/qr';
import { DEFAULT_SIZE, MAX_QUERY_DATA_LENGTH, parseQrBody, parseQrQuery } from './qr-request';

const query = (q: Record<string, string>) => parseQrQuery(new URLSearchParams(q));

function ok<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r)}`);
  return r as Extract<T, { ok: true }>;
}

function issues(r: ReturnType<typeof parseQrQuery>): string[] {
  if (r.ok) throw new Error('expected failure');
  return r.issues;
}

describe('parseQrQuery', () => {
  it('applies defaults with only data', () => {
    const { value } = ok(query({ data: 'hello' }));
    expect(value).toEqual({
      data: 'hello',
      size: DEFAULT_SIZE,
      design: DEFAULT_DESIGN,
      download: false,
    });
  });

  it('maps every parameter onto the design', () => {
    const { value } = ok(
      query({
        data: 'https://example.com',
        size: '1024',
        ecl: 'h',
        margin: '2',
        dot: 'dots',
        eyeFrame: 'circle',
        eyeBall: 'diamond',
        fg: 'FF0000',
        bg: '#00ff00',
        download: '1',
      }),
    );
    expect(value.size).toBe(1024);
    expect(value.download).toBe(true);
    const d = value.design;
    expect(d.errorCorrection).toBe('H');
    expect(d.margin).toBe(2);
    expect(d.dots.style).toBe('dots');
    expect(d.dots.paint).toMatchObject({ type: 'solid', color: '#ff0000' });
    expect(d.eyeFrame.style).toBe('circle');
    expect(d.eyeFrame.paint.color).toBe('#ff0000');
    expect(d.eyeBall.style).toBe('diamond');
    expect(d.background).toMatchObject({ transparent: false, paint: { color: '#00ff00' } });
  });

  it('supports a transparent background', () => {
    expect(ok(query({ data: 'x', bg: 'transparent' })).value.design.background.transparent).toBe(
      true,
    );
  });

  it('requires data and caps its length', () => {
    expect(issues(query({}))[0]).toMatch(/^data:/);
    expect(issues(query({ data: '' }))[0]).toMatch(/^data:/);
    expect(query({ data: 'a'.repeat(MAX_QUERY_DATA_LENGTH) }).ok).toBe(true);
    expect(issues(query({ data: 'a'.repeat(MAX_QUERY_DATA_LENGTH + 1) }))[0]).toMatch(/^data:/);
  });

  it('validates size and margin ranges', () => {
    expect(issues(query({ data: 'x', size: '63' }))[0]).toMatch(/^size:/);
    expect(issues(query({ data: 'x', size: '2049' }))[0]).toMatch(/^size:/);
    expect(issues(query({ data: 'x', size: '12.5' }))[0]).toMatch(/^size:/);
    expect(issues(query({ data: 'x', size: '' }))[0]).toMatch(/^size:/);
    expect(ok(query({ data: 'x', size: '64' })).value.size).toBe(64);
    expect(issues(query({ data: 'x', margin: '17' }))[0]).toMatch(/^margin:/);
    expect(ok(query({ data: 'x', margin: '0' })).value.design.margin).toBe(0);
  });

  it('rejects unknown styles and bad colours with parameter names', () => {
    const r = issues(
      query({
        data: 'x',
        ecl: 'Z',
        dot: 'blob',
        eyeFrame: 'x',
        eyeBall: 'y',
        fg: 'red',
        bg: '#12',
      }),
    );
    const params = r.map((i) => i.split(':')[0]);
    expect(params).toEqual(
      expect.arrayContaining(['ecl', 'dot', 'eyeFrame', 'eyeBall', 'fg', 'bg']),
    );
  });

  it('ignores unknown parameters', () => {
    expect(query({ data: 'x', utm_source: 'y' }).ok).toBe(true);
  });
});

describe('parseQrBody', () => {
  it('merges a partial design onto the defaults', () => {
    const { value } = ok(
      parseQrBody({ data: 'hi', size: 256, design: { dots: { style: 'star' }, margin: 1 } }),
    );
    expect(value.size).toBe(256);
    expect(value.design.dots.style).toBe('star');
    expect(value.design.dots.paint).toEqual(DEFAULT_DESIGN.dots.paint);
    expect(value.design.margin).toBe(1);
  });

  it('accepts a data-URL logo', () => {
    const src = 'data:image/png;base64,iVBORw0KGgo=';
    expect(ok(parseQrBody({ data: 'hi', design: { logo: { src } } })).value.design.logo.src).toBe(
      src,
    );
  });

  it('rejects invalid bodies', () => {
    for (const body of [null, 'hi', [], {}, { data: 1 }, { data: 'x', size: 10 }]) {
      expect(parseQrBody(body).ok, JSON.stringify(body)).toBe(false);
    }
    expect(parseQrBody({ data: 'a'.repeat(MAX_DATA_LENGTH + 1) }).ok).toBe(false);
    expect(parseQrBody({ data: 'x', design: 'nope' }).ok).toBe(false);
  });

  it('reports design issues under design.*', () => {
    const r = parseQrBody({
      data: 'x',
      design: { dots: { style: 'blob' }, logo: { src: 'https://evil.example/x.png' } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.some((i) => i.startsWith('design.dots.style'))).toBe(true);
      expect(r.issues.some((i) => i.startsWith('design.logo.src'))).toBe(true);
    }
  });
});
