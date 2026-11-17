import type {
  DotStyle,
  ErrorCorrectionLevel,
  EyeBallStyle,
  EyeFrameStyle,
  FrameStyle,
  LogoShape,
} from '@/core/qr';

export const DOT_LABELS: Record<DotStyle, string> = {
  square: 'Square',
  rounded: 'Rounded',
  fluid: 'Fluid',
  dots: 'Dots',
  classy: 'Classy',
  leaf: 'Leaf',
  diamond: 'Diamond',
  star: 'Star',
  vertical: 'Vertical',
  horizontal: 'Horizontal',
};

export const EYE_FRAME_LABELS: Record<EyeFrameStyle, string> = {
  square: 'Square',
  rounded: 'Rounded',
  'extra-rounded': 'Soft',
  circle: 'Circle',
  leaf: 'Leaf',
  octagon: 'Octagon',
};

export const EYE_BALL_LABELS: Record<EyeBallStyle, string> = {
  square: 'Square',
  rounded: 'Rounded',
  circle: 'Circle',
  diamond: 'Diamond',
  leaf: 'Leaf',
  octagon: 'Octagon',
};

export const ECL_LABELS: Record<ErrorCorrectionLevel, { label: string; detail: string }> = {
  L: { label: 'Low', detail: '7% recovery · smallest code' },
  M: { label: 'Medium', detail: '15% recovery · good default' },
  Q: { label: 'Quartile', detail: '25% recovery · printed codes' },
  H: { label: 'High', detail: '30% recovery · best with logos' },
};

export const FRAME_LABELS: Record<FrameStyle, string> = {
  none: 'None',
  caption: 'Caption',
  'box-bottom': 'Box',
  'box-top': 'Box top',
  pill: 'Badge',
};

export const LOGO_SHAPE_LABELS: Record<LogoShape, string> = {
  none: 'None',
  square: 'Square',
  rounded: 'Rounded',
  circle: 'Circle',
};
