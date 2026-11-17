const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const HEXTET_RE = /^[0-9a-f]{1,4}$/i;

/** Key used when the client IP is missing or unparsable. */
export const UNKNOWN_CLIENT = 'unknown';

function parseIpv4(value: string): number[] | null {
  const m = IPV4_RE.exec(value);
  if (!m) return null;
  const octets = m.slice(1).map(Number);
  return octets.every((o) => o <= 255) ? octets : null;
}

/** Expands an IPv6 address (with optional `::` and trailing dotted IPv4) into 8 numbers. */
function parseIpv6(value: string): number[] | null {
  const halves = value.split('::');
  if (halves.length > 2) return null;

  const toGroups = (part: string | undefined): number[] | null => {
    if (!part) return [];
    const groups: number[] = [];
    const pieces = part.split(':');
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i] ?? '';
      if (i === pieces.length - 1 && piece.includes('.')) {
        const v4 = parseIpv4(piece);
        if (!v4) return null;
        groups.push(((v4[0] ?? 0) << 8) | (v4[1] ?? 0), ((v4[2] ?? 0) << 8) | (v4[3] ?? 0));
      } else if (HEXTET_RE.test(piece)) {
        groups.push(parseInt(piece, 16));
      } else {
        return null;
      }
    }
    return groups;
  };

  const head = toGroups(halves[0]);
  const tail = toGroups(halves[1]);
  if (!head || !tail) return null;

  if (halves.length === 1) return head.length === 8 ? head : null;
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...new Array<number>(missing).fill(0), ...tail];
}

/**
 * Normalises an IP address into a rate-limit key. IPv4 is returned in canonical dotted form,
 * IPv4-mapped IPv6 collapses to its IPv4 address, and other IPv6 addresses are reduced to their
 * /64 prefix (e.g. `2001:db8:0:1::/64`) because a single client usually controls a whole /64.
 * Returns null when the input is not a valid IP.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  let value = raw?.trim() ?? '';
  if (!value) return null;

  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end < 0) return null;
    value = value.slice(1, end);
  }

  const v4 = parseIpv4(value);
  if (v4) return v4.join('.');
  if (!value.includes(':')) return null;

  const zone = value.indexOf('%');
  if (zone >= 0) value = value.slice(0, zone);

  const groups = parseIpv6(value);
  if (!groups) return null;

  const isMapped = groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff;
  if (isMapped) {
    const hi = groups[6] ?? 0;
    const lo = groups[7] ?? 0;
    return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff].join('.');
  }

  return `${groups
    .slice(0, 4)
    .map((g) => g.toString(16))
    .join(':')}::/64`;
}

/** Returns the rate-limit key for a raw client IP, falling back to {@link UNKNOWN_CLIENT}. */
export function clientKey(raw: string | null | undefined): string {
  return normalizeIp(raw) ?? UNKNOWN_CLIENT;
}
