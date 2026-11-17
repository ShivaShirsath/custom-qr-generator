import { contrastRatio, luminance, parseHex, type QrDesign } from '@/core/qr';
import { findLogoPreset, presetDataUrl } from '@/features/logo/presets';
import { LOGO_PLACEMENT, type LogoSelection } from '@/state';

import type { LookSuggestion } from './suggest';

function mix(hex: string, target: number, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const ch = (v: number) =>
    Math.round(v + (target - v) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

/** Darkens a colour until it reads well on a light background. */
export function scannableColor(hex: string): string {
  if (luminance(hex) > 0.6) return '#1f1f1f';
  let color = hex;
  for (let i = 0; i < 12 && contrastRatio(color, '#ffffff') < 4.2; i++) color = mix(color, 0, 0.15);
  return color;
}

export interface Look {
  design: QrDesign;
  logo: LogoSelection;
  src: string;
}

/** Applies a suggestion: matching logo plus a gradient in the suggested colour. */
export function buildLook(
  design: QrDesign,
  suggestion: LookSuggestion,
  flatBrands: boolean,
): Look | null {
  const preset = findLogoPreset(suggestion.logoId);
  if (!preset) return null;
  const accent = scannableColor(suggestion.color ?? preset.defaultColor);
  const deep = mix(accent, 0, 0.4);
  const src = presetDataUrl(preset, null, preset.group === 'brand' && flatBrands);
  const level = design.errorCorrection;
  const firstLogo = design.logo.src === null;
  return {
    src,
    logo: { kind: 'preset', id: preset.id, color: null },
    design: {
      ...design,
      errorCorrection: level === 'L' || level === 'M' ? 'H' : level,
      dots: {
        ...design.dots,
        paint: { type: 'linear', color: deep, color2: accent, rotation: 45 },
      },
      eyeFrame: { ...design.eyeFrame, inherit: true },
      eyeBall: { ...design.eyeBall, inherit: true },
      logo: { ...design.logo, ...(firstLogo ? LOGO_PLACEMENT : {}), src },
    },
  };
}
