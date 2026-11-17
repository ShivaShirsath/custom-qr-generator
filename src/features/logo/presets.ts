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

import {
  brandBadgeSvg,
  clayIconSvg,
  svgToDataUrl,
  type ClayIconName,
} from '@/components/illustrations';

/** Colour overrides; null keeps the preset's own colours. */
export interface PresetColors {
  /** The mark itself (flat logo, or the glyph on a badge). */
  color?: string | null;
  /** The badge background (brands only). */
  badgeColor?: string | null;
}

export interface LogoPreset {
  id: string;
  label: string;
  group: 'icon' | 'brand';
  /** Brand colour; icons are multicolour and ignore it. */
  defaultColor: string;
  /** SVG markup for the given colours; `plain` returns the bare brand mark instead of a badge. */
  toSvg: (options: Required<PresetColors> & { plain: boolean }) => string;
}

const ICONS: ReadonlyArray<[id: string, label: string, art: ClayIconName]> = [
  ['link', 'Link', 'url'],
  ['wifi', 'Wi-Fi', 'wifi'],
  ['mail', 'Email', 'email'],
  ['phone', 'Phone', 'phone'],
  ['pin', 'Location', 'location'],
  ['calendar', 'Event', 'event'],
  ['contact', 'Contact', 'vcard'],
  ['chat', 'Chat', 'sms'],
  ['heart', 'Heart', 'heart'],
  ['star', 'Star', 'star'],
  ['cart', 'Shop', 'cart'],
  ['play', 'Video', 'play'],
];

const iconPreset = ([id, label, art]: (typeof ICONS)[number]): LogoPreset => ({
  id: `icon:${id}`,
  label,
  group: 'icon',
  defaultColor: '#8b6cf0',
  toSvg: () => clayIconSvg(art),
});

const brandPreset = (icon: SimpleIcon, label = icon.title): LogoPreset => ({
  id: `brand:${icon.slug}`,
  label,
  group: 'brand',
  defaultColor: `#${icon.hex}`,
  toSvg: ({ color, badgeColor, plain }) =>
    plain
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color ?? `#${icon.hex}`}" d="${icon.path}"/></svg>`
      : brandBadgeSvg(icon.path, badgeColor ?? `#${icon.hex}`, color ?? undefined),
});

export const LOGO_PRESETS: readonly LogoPreset[] = [
  ...ICONS.map(iconPreset),
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

/** Data URL for a preset, optionally recoloured and, for brands, without the badge. */
export function presetDataUrl(
  preset: LogoPreset,
  { color = null, badgeColor = null }: PresetColors = {},
  plain = false,
): string {
  return svgToDataUrl(preset.toSvg({ color, badgeColor, plain }));
}
