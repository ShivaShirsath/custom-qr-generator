import type { LimitResult } from './store';

export type BucketKind = 'api' | 'page';

/** Seconds until `reset` (ms), rounded up, never below 1. */
export function secondsUntil(reset: number, now: number = Date.now()): number {
  return Math.max(1, Math.ceil((reset - now) / 1000));
}

/** Standard `RateLimit-*` headers describing the caller's quota. */
export function rateLimitHeaders(result: LimitResult, now: number = Date.now()): Headers {
  return new Headers({
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(secondsUntil(result.reset, now)),
  });
}

function blockedPage(retryAfter: number): string {
  const unit = retryAfter === 1 ? 'second' : 'seconds';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Too many requests</title>
<style>
:root{color-scheme:light dark}
body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#f4f1ff;color:#1e1b4b}
main{max-width:28rem;padding:2rem;text-align:center}
h1{font-size:1.5rem;margin:0 0 .75rem}
p{margin:0;line-height:1.5;opacity:.8}
@media (prefers-color-scheme:dark){body{background:#0d0b1f;color:#ece9ff}}
</style>
</head>
<body>
<main>
<h1>Slow down a little</h1>
<p>You've made a lot of requests in a short time. Please try again in ${retryAfter} ${unit}.</p>
</main>
</body>
</html>
`;
}

/**
 * Builds the 429 response: JSON for the API, a small self-contained HTML page otherwise.
 * `headers` (usually the `RateLimit-*` set) are merged in.
 */
export function tooManyRequests(
  kind: BucketKind,
  retryAfter: number,
  headers: Headers = new Headers(),
): Response {
  const out = new Headers(headers);
  out.set('Retry-After', String(retryAfter));
  out.set('Cache-Control', 'no-store');

  if (kind === 'api') {
    out.set('Content-Type', 'application/json; charset=utf-8');
    out.set('Access-Control-Allow-Origin', '*');
    return new Response(JSON.stringify({ error: 'rate_limited', retryAfter }), {
      status: 429,
      headers: out,
    });
  }

  out.set('Content-Type', 'text/html; charset=utf-8');
  out.set(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
  );
  return new Response(blockedPage(retryAfter), { status: 429, headers: out });
}
