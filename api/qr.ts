/**
 * Public QR code API (Vercel Edge Function). See server/api for parsing and rendering.
 *
 *   GET  /api/qr?data=hello&size=512&dot=rounded&fg=1e1b4b&bg=transparent
 *   POST /api/qr  { "data": "hello", "size": 512, "design": { ... } }
 */
import { handleQrRequest } from '../server/api/qr-handler';

export const config = { runtime: 'edge' };

/** Edge handler: delegates to {@link handleQrRequest}. */
export default async function handler(request: Request): Promise<Response> {
  return handleQrRequest(request);
}
