/**
 * Vercel Routing Middleware (Edge runtime): IP rate limiting for HTML pages and /api/*.
 * All logic lives in server/rate-limit so it can be unit tested.
 */
import { waitUntil } from '@vercel/functions';

import { handleRateLimit } from './server/rate-limit';

export const config = {
  // Everything except static files: hashed build assets and the files in public/.
  // Page routes and /api/* are matched. Uses the documented Next-style negative lookahead.
  matcher: ['/((?!assets/|favicon\\.svg|manifest\\.webmanifest|robots\\.txt|theme-init\\.js).*)'],
};

/** Rate-limits the request, or passes it through with `RateLimit-*` headers. */
export default function middleware(request: Request): Promise<Response> {
  return handleRateLimit(request, { waitUntil });
}
