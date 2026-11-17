import {
  DOT_STYLES,
  EYE_BALL_STYLES,
  EYE_FRAME_STYLES,
  type Paint,
  type QrDesign,
} from '@/core/qr';

/** Dark, scannable colour pairs for gradients. */
const GRADIENTS: ReadonlyArray<[string, string]> = [
  ['#3b0764', '#7c3aed'],
  ['#0c4a6e', '#0891b2'],
  ['#9f1239', '#c2410c'],
  ['#14532d', '#15803d'],
  ['#831843', '#6d28d9'],
  ['#1e3a8a', '#7e22ce'],
  ['#7c2d12', '#b45309'],
  ['#134e4a', '#1d4ed8'],
  ['#2b2966', '#be185d'],
];

/** A random but scannable look; keeps content, logo, frame and background choices. */
export function surpriseDesign(current: QrDesign, random: () => number = Math.random): QrDesign {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
  // Stars are fun but the least robust shape, so they are left out of the shuffle.
  const style = pick(DOT_STYLES.filter((s) => s !== 'star'));
  const [color, color2] = pick(GRADIENTS);
  const paint: Paint = {
    type: random() < 0.75 ? 'linear' : 'radial',
    color,
    color2,
    rotation: pick([0, 45, 90, 135]),
  };
  return {
    ...current,
    errorCorrection: current.logo.src ? 'H' : current.errorCorrection,
    dots: { style, scale: style === 'dots' || style === 'diamond' ? 0.9 : 1, paint },
    eyeFrame: { ...current.eyeFrame, style: pick(EYE_FRAME_STYLES), inherit: true },
    eyeBall: { ...current.eyeBall, style: pick(EYE_BALL_STYLES), inherit: true },
  };
}
