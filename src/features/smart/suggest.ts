import { normalizeUrl, type ContentState } from '@/core/content';

export interface LookSuggestion {
  /** Stable identity; a new suggestion is offered only when this changes. */
  key: string;
  /** Human name used in the prompt, e.g. "WhatsApp". */
  label: string;
  /** Logo preset id from features/logo/presets. */
  logoId: string;
  /** Accent colour for the code; brands use their own colour. */
  color?: string;
  /** Brands are named products; icons describe a kind of content. */
  kind: 'brand' | 'icon';
}

const BRAND_HOSTS: ReadonlyArray<[pattern: RegExp, id: string, label: string]> = [
  [/(^|\.)(wa\.me|whatsapp\.com)$/, 'whatsapp', 'WhatsApp'],
  [/(^|\.)(instagram\.com|instagr\.am)$/, 'instagram', 'Instagram'],
  [/(^|\.)(facebook\.com|fb\.me|fb\.com)$/, 'facebook', 'Facebook'],
  [/(^|\.)(x\.com|twitter\.com)$/, 'x', 'X'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube', 'YouTube'],
  [/(^|\.)(t\.me|telegram\.me|telegram\.org)$/, 'telegram', 'Telegram'],
  [/(^|\.)(threads\.net|threads\.com)$/, 'threads', 'Threads'],
  [/(^|\.)tiktok\.com$/, 'tiktok', 'TikTok'],
  [/(^|\.)snapchat\.com$/, 'snapchat', 'Snapchat'],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, 'pinterest', 'Pinterest'],
  [/(^|\.)(reddit\.com|redd\.it)$/, 'reddit', 'Reddit'],
  [/(^|\.)(discord\.gg|discord\.com)$/, 'discord', 'Discord'],
  [/(^|\.)github\.com$/, 'github', 'GitHub'],
  [/(^|\.)linktr\.ee$/, 'linktree', 'Linktree'],
  [/(^|\.)(spotify\.com|spoti\.fi)$/, 'spotify', 'Spotify'],
  [/(^|\.)(mail\.google\.com|gmail\.com)$/, 'gmail', 'Gmail'],
  [/(^|\.)(maps\.google\.[a-z.]+|maps\.app\.goo\.gl)$/, 'googlemaps', 'Google Maps'],
  [/(^|\.)zoom\.us$/, 'zoom', 'Zoom'],
  [/(^|\.)(paypal\.me|paypal\.com)$/, 'paypal', 'PayPal'],
];

const icon = (id: string, label: string, color: string): LookSuggestion => ({
  key: `icon:${id}`,
  label,
  logoId: `icon:${id}`,
  color,
  kind: 'icon',
});

const brand = (id: string, label: string): LookSuggestion => ({
  key: `brand:${id}`,
  label,
  logoId: `brand:${id}`,
  kind: 'brand',
});

function suggestForUrl(raw: string): LookSuggestion | null {
  const value = normalizeUrl(raw);
  if (!value) return null;
  let host: string;
  try {
    host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
  if (host === 'google.com' && /\/maps(\/|$)/.test(new URL(value).pathname)) {
    return brand('googlemaps', 'Google Maps');
  }
  // Unknown sites get no recommendation; only real matches are worth interrupting for.
  const match = BRAND_HOSTS.find(([pattern]) => pattern.test(host));
  return match ? brand(match[1], match[2]) : null;
}

/** UPI handles reveal the app: @ybl → PhonePe, @ok* → Google Pay, @paytm → Paytm. */
function suggestForUpi(vpa: string): LookSuggestion {
  const handle = vpa.split('@')[1]?.toLowerCase() ?? '';
  if (/^(ybl|ibl|axl)$/.test(handle)) return brand('phonepe', 'PhonePe');
  if (/^ok(axis|hdfcbank|icici|sbi)$/.test(handle)) return brand('googlepay', 'Google Pay');
  if (/^(paytm|pt(yes|hdfc|axis|sbi))$/.test(handle)) return brand('paytm', 'Paytm');
  return icon('cart', 'payment', '#2f6fd6');
}

/** Picks a logo and accent colour that suit the current content, if any. */
export function suggestLook(content: ContentState): LookSuggestion | null {
  const v = content.values;
  switch (content.type) {
    case 'url':
      return suggestForUrl(v.url.url);
    case 'email':
      return icon('mail', 'email', '#2f6fd6');
    case 'phone':
      return icon('phone', 'phone', '#16805a');
    case 'sms':
      return icon('chat', 'message', '#6c4fd8');
    case 'whatsapp':
      return brand('whatsapp', 'WhatsApp');
    case 'wifi':
      return icon('wifi', 'Wi-Fi', '#2f6fd6');
    case 'vcard':
      return icon('contact', 'contact', '#c2571c');
    case 'event':
      return icon('calendar', 'event', '#c8402f');
    case 'location':
      return icon('pin', 'location', '#d1432f');
    case 'upi':
      return suggestForUpi(v.upi.vpa);
    case 'crypto':
      if (v.crypto.coin === 'bitcoin') return brand('bitcoin', 'Bitcoin');
      if (v.crypto.coin === 'ethereum') return brand('ethereum', 'Ethereum');
      return null;
    default:
      return null;
  }
}
