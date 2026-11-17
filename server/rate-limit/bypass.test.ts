import { describe, expect, it } from 'vitest';

import {
  BYPASS_COOKIE,
  bypassCookieRedirect,
  clearBypassCookieResponse,
  constantTimeEqual,
  isBypassed,
  readCookie,
  sha256Hex,
} from './bypass';
import { parseRateLimitConfig } from './config';
import { TOKEN } from './test-helpers';

const config = parseRateLimitConfig({
  RATE_LIMIT_BYPASS_TOKEN: TOKEN,
  RATE_LIMIT_BYPASS_IPS: '198.51.100.9, 2001:db8:1:2::5',
});

const req = (headers: Record<string, string> = {}) =>
  new Request('https://qr.example/', { headers });

describe('sha256Hex', () => {
  it('matches a known digest', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('constantTimeEqual', () => {
  it('compares strings', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    expect(constantTimeEqual('', '')).toBe(true);
  });
});

describe('readCookie', () => {
  it('finds a cookie among others', () => {
    expect(readCookie('a=1; cqg_rl_bypass=xyz; b=2', BYPASS_COOKIE)).toBe('xyz');
    expect(readCookie('a=1', BYPASS_COOKIE)).toBeNull();
    expect(readCookie(null, BYPASS_COOKIE)).toBeNull();
  });
});

describe('isBypassed', () => {
  it('accepts the token in the x-ratelimit-bypass header', async () => {
    expect(await isBypassed(req({ 'x-ratelimit-bypass': TOKEN }), '1.2.3.4', config)).toBe(true);
    expect(await isBypassed(req({ 'x-ratelimit-bypass': 'nope' }), '1.2.3.4', config)).toBe(false);
  });

  it('accepts a cookie holding the token digest, not the raw token', async () => {
    const digest = await sha256Hex(TOKEN);
    expect(await isBypassed(req({ cookie: `${BYPASS_COOKIE}=${digest}` }), 'x', config)).toBe(true);
    expect(await isBypassed(req({ cookie: `${BYPASS_COOKIE}=${TOKEN}` }), 'x', config)).toBe(false);
  });

  it('accepts allowlisted IPs (IPv6 by /64)', async () => {
    expect(await isBypassed(req(), '198.51.100.9', config)).toBe(true);
    expect(await isBypassed(req(), '2001:db8:1:2::/64', config)).toBe(true);
    expect(await isBypassed(req(), '198.51.100.10', config)).toBe(false);
  });

  it('never bypasses when no token is configured', async () => {
    const none = parseRateLimitConfig({});
    expect(await isBypassed(req({ 'x-ratelimit-bypass': '' }), 'x', none)).toBe(false);
    expect(await isBypassed(req({ 'x-ratelimit-bypass': 'anything' }), 'x', none)).toBe(false);
  });
});

describe('bypassCookieRedirect', () => {
  it('sets the cookie and strips the token from the URL', async () => {
    const url = new URL(`https://qr.example/some/page?x=1&bypass=${TOKEN}&y=2`);
    const res = await bypassCookieRedirect(url, config);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('https://qr.example/some/page?x=1&y=2');
    const cookie = res?.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${BYPASS_COOKIE}=${await sha256Hex(TOKEN)}`);
    expect(cookie).toContain('Max-Age=31536000');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toContain(TOKEN);
  });

  it('ignores wrong tokens, "off" and missing params', async () => {
    expect(await bypassCookieRedirect(new URL('https://qr.example/?bypass=wrong'), config)).toBe(
      null,
    );
    expect(await bypassCookieRedirect(new URL('https://qr.example/?bypass=off'), config)).toBe(
      null,
    );
    expect(await bypassCookieRedirect(new URL('https://qr.example/'), config)).toBe(null);
  });

  it('builds a cookie-clearing redirect', () => {
    const res = clearBypassCookieResponse(new URL('https://qr.example/?bypass=off'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://qr.example/');
    expect(res.headers.get('set-cookie')).toMatch(/^cqg_rl_bypass=; Max-Age=0;/);
  });
});
