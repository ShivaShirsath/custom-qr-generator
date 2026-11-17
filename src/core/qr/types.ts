export const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const;
export type ErrorCorrectionLevel = (typeof ERROR_CORRECTION_LEVELS)[number];

export const DOT_STYLES = [
  'square',
  'rounded',
  'fluid',
  'dots',
  'classy',
  'leaf',
  'diamond',
  'star',
  'vertical',
  'horizontal',
] as const;
export type DotStyle = (typeof DOT_STYLES)[number];

export const EYE_FRAME_STYLES = [
  'square',
  'rounded',
  'extra-rounded',
  'circle',
  'leaf',
  'octagon',
] as const;
export type EyeFrameStyle = (typeof EYE_FRAME_STYLES)[number];

export const EYE_BALL_STYLES = [
  'square',
  'rounded',
  'circle',
  'diamond',
  'leaf',
  'octagon',
] as const;
export type EyeBallStyle = (typeof EYE_BALL_STYLES)[number];

export const PAINT_TYPES = ['solid', 'linear', 'radial'] as const;
export type PaintType = (typeof PAINT_TYPES)[number];

/** A fill: a solid colour or a two-stop gradient. `color2`/`rotation` are ignored for solid. */
export interface Paint {
  type: PaintType;
  color: string;
  color2: string;
  /** Linear gradient angle in degrees (0 = left → right). */
  rotation: number;
}

export const LOGO_SHAPES = ['none', 'square', 'rounded', 'circle'] as const;
export type LogoShape = (typeof LOGO_SHAPES)[number];

export const FRAME_STYLES = ['none', 'caption', 'box-bottom', 'box-top', 'pill'] as const;
export type FrameStyle = (typeof FRAME_STYLES)[number];

export interface QrDesign {
  errorCorrection: ErrorCorrectionLevel;
  /** Quiet zone around the code, in modules. */
  margin: number;
  dots: {
    style: DotStyle;
    /** Relative module size, 0.5–1. Ignored by connected styles. */
    scale: number;
    paint: Paint;
  };
  eyeFrame: {
    style: EyeFrameStyle;
    inherit: boolean;
    paint: Paint;
  };
  eyeBall: {
    style: EyeBallStyle;
    inherit: boolean;
    paint: Paint;
  };
  background: {
    transparent: boolean;
    paint: Paint;
    /** Corner radius as a percentage (0–50) of the shorter side. */
    radius: number;
  };
  logo: {
    /** Data URL of the logo image, or null for no logo. */
    src: string | null;
    /** Logo width relative to the code width (0.1–0.35). */
    size: number;
    /** Space between logo and surrounding modules, in modules. */
    padding: number;
    shape: LogoShape;
    background: string;
    /** Remove modules behind the logo instead of drawing over them. */
    excavate: boolean;
  };
  frame: {
    style: FrameStyle;
    text: string;
    color: string;
    textColor: string;
  };
}

export interface QrMatrix {
  size: number;
  version: number;
  modules: boolean[][];
}

export interface RenderOptions {
  /** Output width in pixels; height follows the aspect ratio. */
  width?: number;
  /** Overrides `design.background.transparent`. */
  transparent?: boolean;
}

export interface RenderResult {
  svg: string;
  width: number;
  height: number;
  matrix: QrMatrix;
}
