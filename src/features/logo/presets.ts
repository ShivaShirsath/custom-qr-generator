import {
  siBitcoin,
  siDiscord,
  siEthereum,
  siFacebook,
  siGithub,
  siGmail,
  siGooglemaps,
  siGooglepay,
  siInstagram,
  siLinktree,
  siPaypal,
  siPaytm,
  siPhonepe,
  siPinterest,
  siReddit,
  siSnapchat,
  siSpotify,
  siTelegram,
  siThreads,
  siTiktok,
  siWhatsapp,
  siX,
  siYoutube,
  siZoom,
  type SimpleIcon,
} from 'simple-icons';

export interface LogoPreset {
  id: string;
  label: string;
  group: 'icon' | 'brand';
  defaultColor: string;
  toSvg: (color: string) => string;
}

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">';

/** Simple line icons drawn on a 24px grid. */
const ICONS: Record<string, { label: string; body: string }> = {
  link: {
    label: 'Link',
    body: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  },
  wifi: {
    label: 'Wi-Fi',
    body: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.8 12.6a9.3 9.3 0 0 1 12.4 0"/><path d="M9.2 16.1a4.6 4.6 0 0 1 5.6 0"/><circle cx="12" cy="19.6" r="0.6"/>',
  },
  mail: {
    label: 'Email',
    body: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  },
  phone: {
    label: 'Phone',
    body: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  },
  pin: {
    label: 'Location',
    body: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  },
  calendar: {
    label: 'Event',
    body: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  },
  contact: {
    label: 'Contact',
    body: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  },
  chat: {
    label: 'Chat',
    body: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.1A8.5 8.5 0 1 1 21 12z"/>',
  },
  heart: {
    label: 'Heart',
    body: '<path d="M12 20s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.1-8 11-8 11z"/>',
  },
  star: {
    label: 'Star',
    body: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  },
  cart: {
    label: 'Shop',
    body: '<circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  },
  play: {
    label: 'Video',
    body: '<rect x="2.5" y="4.5" width="19" height="15" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  },
};

const iconPreset = (id: string, label: string, body: string): LogoPreset => ({
  id: `icon:${id}`,
  label,
  group: 'icon',
  defaultColor: '#e8890c',
  toSvg: (color) =>
    `${SVG_OPEN}<g fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`,
});

const brandPreset = (icon: SimpleIcon, label = icon.title): LogoPreset => ({
  id: `brand:${icon.slug}`,
  label,
  group: 'brand',
  defaultColor: `#${icon.hex}`,
  toSvg: (color) => `${SVG_OPEN}<path fill="${color}" d="${icon.path}"/></svg>`,
});

export const LOGO_PRESETS: readonly LogoPreset[] = [
  ...Object.entries(ICONS).map(([id, { label, body }]) => iconPreset(id, label, body)),
  brandPreset(siWhatsapp),
  brandPreset(siInstagram),
  brandPreset(siFacebook),
  brandPreset(siX, 'X'),
  brandPreset(siYoutube),
  brandPreset(siTelegram),
  brandPreset(siThreads),
  brandPreset(siTiktok, 'TikTok'),
  brandPreset(siSnapchat),
  brandPreset(siPinterest),
  brandPreset(siReddit),
  brandPreset(siDiscord),
  brandPreset(siGithub, 'GitHub'),
  brandPreset(siLinktree),
  brandPreset(siSpotify),
  brandPreset(siGmail),
  brandPreset(siGooglemaps, 'Maps'),
  brandPreset(siZoom),
  brandPreset(siGooglepay, 'Google Pay'),
  brandPreset(siPhonepe, 'PhonePe'),
  brandPreset(siPaytm),
  brandPreset(siPaypal, 'PayPal'),
  brandPreset(siBitcoin),
  brandPreset(siEthereum),
];

export function findLogoPreset(id: string): LogoPreset | undefined {
  return LOGO_PRESETS.find((p) => p.id === id);
}

/** Base64 data URL for a preset in the given colour (the SVG markup is ASCII-only). */
export function presetDataUrl(preset: LogoPreset, color: string | null): string {
  return `data:image/svg+xml;base64,${btoa(preset.toSvg(color ?? preset.defaultColor))}`;
}
