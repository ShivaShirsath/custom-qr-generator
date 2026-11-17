import type { Paint, QrDesign } from './types';

export const solid = (color: string): Paint => ({
  type: 'solid',
  color,
  color2: color,
  rotation: 0,
});

export const DEFAULT_DESIGN: QrDesign = {
  errorCorrection: 'M',
  margin: 4,
  dots: { style: 'rounded', scale: 1, paint: solid('#1e1b4b') },
  eyeFrame: { style: 'extra-rounded', inherit: true, paint: solid('#1e1b4b') },
  eyeBall: { style: 'rounded', inherit: true, paint: solid('#1e1b4b') },
  background: { transparent: false, paint: solid('#ffffff'), radius: 0 },
  logo: {
    src: null,
    size: 0.22,
    padding: 1,
    shape: 'rounded',
    background: '#ffffff',
    excavate: true,
  },
  frame: { style: 'none', text: 'SCAN ME', color: '#1e1b4b', textColor: '#ffffff' },
};
