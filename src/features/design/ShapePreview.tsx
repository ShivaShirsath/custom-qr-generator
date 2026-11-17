import {
  dotsPath,
  eyeBallPath,
  eyeFramePath,
  type DotStyle,
  type EyeBallStyle,
  type EyeFrameStyle,
} from '@/core/qr';

const SAMPLE = [
  [1, 1, 0, 1, 0],
  [1, 0, 1, 1, 1],
  [0, 1, 1, 0, 1],
  [1, 1, 0, 0, 1],
  [0, 1, 1, 1, 1],
];
const sampleOn = (r: number, c: number) => SAMPLE[r]?.[c] === 1;

export function DotPreview({ style }: { style: DotStyle }) {
  return (
    <svg viewBox="-0.4 -0.4 5.8 5.8" width="100%" height="100%">
      <path fill="currentColor" d={dotsPath(5, sampleOn, style, style === 'dots' ? 0.9 : 1)} />
    </svg>
  );
}

export function EyeFramePreview({ style }: { style: EyeFrameStyle }) {
  return (
    <svg viewBox="-0.6 -0.6 8.2 8.2" width="100%" height="100%">
      <path fill="currentColor" fillRule="evenodd" d={eyeFramePath(0, 0, style, 'tl')} />
      <path fill="currentColor" opacity="0.35" d={eyeBallPath(0, 0, 'square', 'tl')} />
    </svg>
  );
}

export function EyeBallPreview({ style }: { style: EyeBallStyle }) {
  return (
    <svg viewBox="-0.6 -0.6 8.2 8.2" width="100%" height="100%">
      <path
        fill="currentColor"
        opacity="0.35"
        fillRule="evenodd"
        d={eyeFramePath(0, 0, 'square', 'tl')}
      />
      <path fill="currentColor" d={eyeBallPath(0, 0, style, 'tl')} />
    </svg>
  );
}
