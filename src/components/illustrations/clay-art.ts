/**
 * 3D "clay" artwork as standalone SVG strings, so the same art can be shown in the UI and
 * embedded into QR codes as a logo (data URL).
 */
import { parseHex, readableTextColor } from '@/core/qr';

const NAVY = '#2b2966';
const FONT = 'Nunito, Arial Rounded MT Bold, Arial, sans-serif';

/** Two-stop gradients (light top → saturated bottom). */
const GRADIENTS = {
  lav: ['#d3c4ff', '#8a6cf0'],
  mint: ['#c2f7dd', '#42bf8a'],
  coral: ['#ffb7a8', '#e85d4c'],
  butter: ['#fff3ad', '#f0b02a'],
  sky: ['#cfe3ff', '#5a96f2'],
  pink: ['#ffd0e1', '#e56e9d'],
  peach: ['#ffdcc6', '#f08f58'],
  white: ['#ffffff', '#e2dcfa'],
} as const;

const DEFS =
  '<defs>' +
  Object.entries(GRADIENTS)
    .map(
      ([id, [a, b]]) =>
        `<linearGradient id="${id}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`,
    )
    .join('') +
  `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.2" stdDeviation="1.6" flood-color="${NAVY}" flood-opacity=".22"/></filter>` +
  '</defs>';

const coin = (grad: string, glyph: string, ink: string) =>
  `<circle cx="24" cy="24" r="19" fill="url(#${grad})"/>` +
  '<circle cx="24" cy="24" r="14" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2"/>' +
  `<text x="24" y="25" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="900" fill="${ink}" font-family="${FONT}">${glyph}</text>` +
  '<ellipse cx="15" cy="12.5" rx="5" ry="2" transform="rotate(-30 15 12.5)" fill="#fff" opacity=".6"/>';

const handset =
  'M17.5 14.5c1-1 2.6-.9 3.2.4l1.1 2.4c.4.9 0 1.7-.7 2.2l-.8.6c1 2.1 2.6 3.7 4.7 4.7l.6-.8c.5-.7 1.3-1.1 2.2-.7l2.4 1.1c1.3.6 1.4 2.2.4 3.2l-1 1c-1.4 1.4-3.3 1.7-5 1-3.9-1.7-7-4.8-8.7-8.7-.7-1.7-.4-3.6 1-5z';

/** Icon artwork on a 48×48 grid. */
const ART = {
  url:
    '<rect x="5" y="17" width="24" height="13" rx="6.5" transform="rotate(-40 17 23.5)" fill="none" stroke="url(#lav)" stroke-width="6"/>' +
    '<rect x="19" y="18" width="24" height="13" rx="6.5" transform="rotate(-40 31 24.5)" fill="none" stroke="url(#sky)" stroke-width="6"/>' +
    '<path d="M9 21.5 15 15.5" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>',
  text:
    '<rect x="10" y="5" width="28" height="38" rx="8" fill="url(#white)"/>' +
    '<rect x="16" y="13" width="16" height="4.5" rx="2.25" fill="url(#lav)"/>' +
    '<rect x="16" y="21.5" width="11" height="4.5" rx="2.25" fill="url(#coral)"/>' +
    '<rect x="16" y="30" width="14" height="4.5" rx="2.25" fill="url(#mint)"/>' +
    '<rect x="13" y="7.5" width="9" height="2.6" rx="1.3" fill="#fff"/>',
  email:
    '<rect x="4" y="10" width="40" height="29" rx="9" fill="url(#sky)"/>' +
    '<path d="M8 16 24 28 40 16" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<ellipse cx="13" cy="13.5" rx="5" ry="1.6" fill="#fff" opacity=".6"/>',
  phone:
    '<rect x="12" y="3" width="24" height="42" rx="8" fill="url(#mint)"/>' +
    '<rect x="15.5" y="8.5" width="17" height="27" rx="4" fill="url(#white)"/>' +
    '<circle cx="24" cy="40" r="2.2" fill="#fff"/>' +
    `<path d="${handset}" transform="translate(4.6 3) scale(.8)" fill="url(#coral)"/>` +
    '<rect x="15" y="5.5" width="6" height="1.8" rx=".9" fill="#fff" opacity=".7"/>',
  sms:
    '<path d="M14 7h20a10 10 0 0 1 10 10v7a10 10 0 0 1-10 10H22l-9 8 1-8a10 10 0 0 1-10-10v-7A10 10 0 0 1 14 7z" fill="url(#lav)"/>' +
    '<circle cx="15" cy="20.5" r="3.2" fill="#fff"/><circle cx="24" cy="20.5" r="3.2" fill="#fff"/><circle cx="33" cy="20.5" r="3.2" fill="#fff"/>' +
    '<ellipse cx="15" cy="10.5" rx="5" ry="1.6" fill="#fff" opacity=".55"/>',
  whatsapp:
    '<path d="M24 5a19 19 0 0 1 0 38c-3.3 0-6.4-.8-9.1-2.3L5 43l2.4-9.5A19 19 0 0 1 24 5z" fill="url(#mint)"/>' +
    `<path d="${handset}" fill="#fff"/>` +
    '<ellipse cx="17" cy="10.5" rx="6" ry="1.8" fill="#fff" opacity=".5"/>',
  wifi:
    '<path d="M6 19a26 26 0 0 1 36 0" fill="none" stroke="url(#lav)" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M12.5 26.5a16 16 0 0 1 23 0" fill="none" stroke="url(#sky)" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M19 33.5a7 7 0 0 1 10 0" fill="none" stroke="url(#mint)" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="24" cy="40.5" r="4" fill="url(#butter)"/>',
  vcard:
    '<rect x="3" y="9" width="42" height="30" rx="8" fill="url(#peach)"/>' +
    '<circle cx="15" cy="21" r="5.5" fill="url(#lav)"/><path d="M7 34a8 8 0 0 1 16 0z" fill="url(#lav)"/>' +
    '<rect x="27" y="17" width="13" height="4" rx="2" fill="#fff"/><rect x="27" y="25" width="9" height="4" rx="2" fill="#fff" opacity=".8"/>' +
    '<ellipse cx="11" cy="12.5" rx="5" ry="1.5" fill="#fff" opacity=".6"/>',
  event:
    '<rect x="5" y="8" width="38" height="35" rx="9" fill="url(#white)"/>' +
    '<path d="M14 8h20a9 9 0 0 1 9 9v2H5v-2a9 9 0 0 1 9-9z" fill="url(#coral)"/>' +
    `<rect x="13" y="4" width="5" height="9" rx="2.5" fill="${NAVY}"/><rect x="30" y="4" width="5" height="9" rx="2.5" fill="${NAVY}"/>` +
    '<circle cx="14" cy="27" r="3" fill="url(#lav)"/><circle cx="24" cy="27" r="3" fill="url(#mint)"/><circle cx="34" cy="27" r="3" fill="url(#sky)"/>' +
    '<circle cx="14" cy="35.5" r="3" fill="url(#butter)"/><circle cx="24" cy="35.5" r="3" fill="url(#pink)"/><circle cx="34" cy="35.5" r="3" fill="url(#peach)"/>',
  location:
    `<ellipse cx="24" cy="43" rx="10" ry="2.8" fill="${NAVY}" opacity=".15"/>` +
    '<path d="M24 3c-8.6 0-15.5 6.7-15.5 15C8.5 29 24 42 24 42s15.5-13 15.5-24C39.5 9.7 32.6 3 24 3z" fill="url(#coral)"/>' +
    '<circle cx="24" cy="18" r="6.5" fill="#fff"/>' +
    '<ellipse cx="16" cy="10" rx="3" ry="4.5" transform="rotate(30 16 10)" fill="#fff" opacity=".45"/>',
  upi: coin('butter', '₹', '#b0760a'),
  crypto: coin('peach', '₿', '#b0521c'),
  heart:
    '<path d="M24 42S5 30.5 5 17.5A10.5 10.5 0 0 1 24 11.4 10.5 10.5 0 0 1 43 17.5C43 30.5 24 42 24 42z" fill="url(#pink)"/>' +
    '<ellipse cx="14" cy="15" rx="4" ry="2.6" transform="rotate(-35 14 15)" fill="#fff" opacity=".7"/>',
  star:
    '<path d="M24 4.5c1.1 0 2 .6 2.5 1.6l4.4 9 9.9 1.4c2.3.3 3.2 3.1 1.5 4.7l-7.2 7 1.7 9.9c.4 2.3-2 4-4 2.9L24 36.4 15.1 41c-2 1.1-4.4-.6-4-2.9l1.7-9.9-7.2-7c-1.7-1.6-.8-4.4 1.5-4.7l9.9-1.4 4.4-9c.5-1 1.5-1.6 2.6-1.6z" fill="url(#butter)"/>' +
    '<ellipse cx="18" cy="17" rx="3.5" ry="2" transform="rotate(-30 18 17)" fill="#fff" opacity=".75"/>',
  cart:
    '<path d="M3 8h5.5l1.4 5H43l-4.2 15.2a5 5 0 0 1-4.8 3.8H17.6a5 5 0 0 1-4.9-3.9L8.5 10" fill="url(#sky)"/>' +
    '<path d="M3 8h5.5l4.2 20.1" fill="none" stroke="url(#lav)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="17" y="17" width="20" height="3.5" rx="1.75" fill="#fff" opacity=".85"/><rect x="18.5" y="23" width="14" height="3.5" rx="1.75" fill="#fff" opacity=".6"/>' +
    '<circle cx="18" cy="40" r="4" fill="url(#coral)"/><circle cx="34" cy="40" r="4" fill="url(#coral)"/>',
  play:
    '<rect x="3" y="8" width="42" height="32" rx="10" fill="url(#coral)"/>' +
    '<path d="M20 16.5v15a1.5 1.5 0 0 0 2.3 1.3l11.6-7.5a1.5 1.5 0 0 0 0-2.6l-11.6-7.5A1.5 1.5 0 0 0 20 16.5z" fill="#fff"/>' +
    '<ellipse cx="11" cy="12" rx="5" ry="1.8" fill="#fff" opacity=".6"/>',
} as const;

export type ClayIconName = keyof typeof ART;

function toDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

/** Standalone SVG markup for a clay icon. */
export function clayIconSvg(name: ClayIconName): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 50 51">${DEFS}<g filter="url(#sh)">${ART[name]}</g></svg>`;
}

const iconCache = new Map<ClayIconName, string>();

/** Cached base64 data URL for a clay icon. */
export function clayIconUrl(name: ClayIconName): string {
  let url = iconCache.get(name);
  if (!url) {
    url = toDataUrl(clayIconSvg(name));
    iconCache.set(name, url);
  }
  return url;
}

function mix(hex: string, target: number, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const ch = (v: number) =>
    Math.round(v + (target - v) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

/**
 * A glossy clay badge: the brand mark in white (or black on very light colours) on a
 * rounded square filled with the brand colour.
 */
export function brandBadgeSvg(path: string, color: string): string {
  const top = mix(color, 255, 0.28);
  const bottom = mix(color, 0, 0.12);
  const glyph = readableTextColor(color) === '#000000' ? '#1b1b1b' : '#ffffff';
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<defs>' +
    `<linearGradient id="b" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>` +
    '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>' +
    '</defs>' +
    '<rect x="2" y="2" width="60" height="60" rx="18" fill="url(#b)"/>' +
    '<rect x="2" y="2" width="60" height="60" rx="18" fill="url(#s)"/>' +
    '<rect x="7" y="5" width="50" height="24" rx="12" fill="url(#g)"/>' +
    `<path transform="translate(15 15) scale(1.4167)" fill="${glyph}" d="${path}"/>` +
    '</svg>'
  );
}

export function svgToDataUrl(svg: string): string {
  return toDataUrl(svg);
}
