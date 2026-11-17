import {
  DEFAULT_DESIGN,
  mergeDeep,
  solid,
  type DeepPartial,
  type Paint,
  type QrDesign,
} from '@/core/qr';

export interface DesignPreset {
  id: string;
  name: string;
  design: DeepPartial<QrDesign>;
}

const linear = (color: string, color2: string, rotation = 45): Paint => ({
  type: 'linear',
  color,
  color2,
  rotation,
});

const radial = (color: string, color2: string): Paint => ({
  type: 'radial',
  color,
  color2,
  rotation: 0,
});

export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    design: {
      dots: { style: 'square', scale: 1, paint: solid('#000000') },
      eyeFrame: { style: 'square', inherit: true },
      eyeBall: { style: 'square', inherit: true },
      background: { transparent: false, paint: solid('#ffffff'), radius: 0 },
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    design: {
      dots: { style: 'rounded', scale: 1, paint: linear('#3b0764', '#7c3aed') },
      eyeFrame: { style: 'extra-rounded', inherit: true },
      eyeBall: { style: 'rounded', inherit: true },
      background: { transparent: false, paint: solid('#ffffff'), radius: 6 },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    design: {
      dots: { style: 'dots', scale: 0.9, paint: linear('#0e7490', '#1d4ed8', 90) },
      eyeFrame: { style: 'circle', inherit: false, paint: solid('#0c4a6e') },
      eyeBall: { style: 'circle', inherit: false, paint: solid('#0891b2') },
      background: { transparent: false, paint: solid('#f0fdff'), radius: 8 },
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    design: {
      dots: { style: 'fluid', scale: 1, paint: linear('#9f1239', '#c2410c', 135) },
      eyeFrame: { style: 'leaf', inherit: true },
      eyeBall: { style: 'leaf', inherit: false, paint: solid('#9f1239') },
      background: { transparent: false, paint: solid('#fff7ed'), radius: 8 },
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    design: {
      dots: { style: 'classy', scale: 1, paint: radial('#166534', '#052e16') },
      eyeFrame: { style: 'rounded', inherit: false, paint: solid('#14532d') },
      eyeBall: { style: 'octagon', inherit: false, paint: solid('#16a34a') },
      background: { transparent: false, paint: solid('#f0fdf4'), radius: 4 },
    },
  },
  {
    id: 'candy',
    name: 'Candy',
    design: {
      dots: { style: 'diamond', scale: 0.95, paint: linear('#be185d', '#6d28d9', 60) },
      eyeFrame: { style: 'octagon', inherit: true },
      eyeBall: { style: 'diamond', inherit: true },
      background: { transparent: false, paint: solid('#fff1f7'), radius: 10 },
    },
  },
  {
    id: 'lines',
    name: 'Lines',
    design: {
      dots: { style: 'vertical', scale: 1, paint: solid('#111827') },
      eyeFrame: { style: 'rounded', inherit: true },
      eyeBall: { style: 'square', inherit: true },
      background: { transparent: false, paint: solid('#ffffff'), radius: 0 },
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    design: {
      dots: { style: 'leaf', scale: 1, paint: linear('#78350f', '#b45309', 30) },
      eyeFrame: { style: 'leaf', inherit: true },
      eyeBall: { style: 'leaf', inherit: true },
      background: { transparent: false, paint: solid('#fffbeb'), radius: 6 },
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    design: {
      dots: { style: 'fluid', scale: 1, paint: linear('#c4b5fd', '#f9a8d4', 45) },
      eyeFrame: { style: 'extra-rounded', inherit: true },
      eyeBall: { style: 'circle', inherit: true },
      background: { transparent: false, paint: radial('#1e1b4b', '#0b0a1f'), radius: 8 },
    },
  },
];

/** Applies a preset's look while keeping the user's logo, frame, margin and error correction. */
export function applyPreset(current: QrDesign, preset: DesignPreset): QrDesign {
  const styled = mergeDeep(DEFAULT_DESIGN, preset.design);
  return {
    ...current,
    dots: styled.dots,
    eyeFrame: styled.eyeFrame,
    eyeBall: styled.eyeBall,
    background: styled.background,
  };
}
