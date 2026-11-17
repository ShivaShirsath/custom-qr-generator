import type { RateLimitConfig } from './config';

export const BYPASS_HEADER = 'x-ratelimit-bypass';
export const BYPASS_COOKIE = 'cqg_rl_bypass';
export const BYPASS_QUERY_PARAM = 'bypass';
export const BYPASS_OFF = 'off';

const ONE_YEAR_SECONDS = 31_536_000;
const COOKIE_ATTRIBUTES = 'Path=/; HttpOnly; Secure; SameSite=Lax';

const encoder = new TextEncoder();
const digestCache = new Map<string, Promise<string>>();

/** SHA-256 of `text` as lowercase hex, via Web Crypto (works on Edge and Node ≥ 20). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cached digest of the configured token (the value stored in the bypass cookie). */
function tokenDigest(token: string): Promise<string> {
  let digest = digestCache.get(token);
  if (!digest) {
    digest = sha256Hex(token);
    digestCache.set(token, digest);
  }
  return digest;
}

/** Compares two strings in time independent of where they differ. */
export function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Checks a presented token by comparing digests, so neither length nor content leaks. */
async function tokenMatches(presented: string, token: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Hex(presented), tokenDigest(token)]);
  return constantTimeEqual(a, b);
}

/** Reads a single cookie value from a `Cookie` header. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * True when the request belongs to the site owner: a matching `x-ratelimit-bypass` header, a
 * `cqg_rl_bypass` cookie holding the token's SHA-256, or a client key in the IP allowlist.
 */
export async function isBypassed(
  request: Request,
  clientKey: string,
  config: RateLimitConfig,
): Promise<boolean> {
  if (config.bypassIps.has(clientKey)) return true;

  const token = config.bypassToken;
  if (!token) return false;

  const header = request.headers.get(BYPASS_HEADER);
  if (header && (await tokenMatches(header.trim(), token))) return true;

  const cookie = readCookie(request.headers.get('cookie'), BYPASS_COOKIE);
  if (cookie) return constantTimeEqual(cookie.toLowerCase(), await tokenDigest(token));

  return false;
}

function redirectWithoutParam(url: URL, cookie: string): Response {
  const target = new URL(url);
  target.searchParams.delete(BYPASS_QUERY_PARAM);
  return new Response(null, {
    status: 307,
    headers: {
      Location: target.toString(),
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store',
    },
  });
}

/** True when the URL carries `?bypass=off`. */
export function isBypassOff(url: URL): boolean {
  return url.searchParams.get(BYPASS_QUERY_PARAM) === BYPASS_OFF;
}

/** Redirect that clears the bypass cookie and strips `?bypass=off` from the URL. */
export function clearBypassCookieResponse(url: URL): Response {
  return redirectWithoutParam(url, `${BYPASS_COOKIE}=; Max-Age=0; ${COOKIE_ATTRIBUTES}`);
}

/**
 * Handles `?bypass=<token>`: when the token is valid, returns a 307 redirect to the same URL
 * without the parameter that sets the bypass cookie. Returns null for a missing or wrong token
 * (and for `off`, which the caller handles after normal limiting) so the request is limited as
 * usual.
 */
export async function bypassCookieRedirect(
  url: URL,
  config: RateLimitConfig,
): Promise<Response | null> {
  const presented = url.searchParams.get(BYPASS_QUERY_PARAM);
  const token = config.bypassToken;
  if (!presented || presented === BYPASS_OFF || !token) return null;
  if (!(await tokenMatches(presented, token))) return null;

  const value = await tokenDigest(token);
  return redirectWithoutParam(
    url,
    `${BYPASS_COOKIE}=${value}; Max-Age=${ONE_YEAR_SECONDS}; ${COOKIE_ATTRIBUTES}`,
  );
}
