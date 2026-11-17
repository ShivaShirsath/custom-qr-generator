import { z } from 'zod';

import { isHexColor } from './color';
import { DEFAULT_DESIGN } from './defaults';
import { isSafeLogoSrc } from './logo';
import { mergeDeep } from './merge';
import {
  DOT_STYLES,
  ERROR_CORRECTION_LEVELS,
  EYE_BALL_STYLES,
  EYE_FRAME_STYLES,
  FRAME_STYLES,
  LOGO_SHAPES,
  PAINT_TYPES,
  type QrDesign,
} from './types';

const hex = z.string().refine(isHexColor, 'Expected a hex colour like #1f3d14');

export const paintSchema = z.object({
  type: z.enum(PAINT_TYPES),
  color: hex,
  color2: hex,
  rotation: z.number().min(-360).max(360),
});

export const designSchema = z.object({
  errorCorrection: z.enum(ERROR_CORRECTION_LEVELS),
  margin: z.number().int().min(0).max(16),
  dots: z.object({
    style: z.enum(DOT_STYLES),
    scale: z.number().min(0.5).max(1),
    paint: paintSchema,
  }),
  eyeFrame: z.object({ style: z.enum(EYE_FRAME_STYLES), inherit: z.boolean(), paint: paintSchema }),
  eyeBall: z.object({ style: z.enum(EYE_BALL_STYLES), inherit: z.boolean(), paint: paintSchema }),
  background: z.object({
    transparent: z.boolean(),
    paint: paintSchema,
    radius: z.number().min(0).max(50),
  }),
  logo: z.object({
    src: z.string().refine(isSafeLogoSrc, 'Logo must be an inline data:image URL').nullable(),
    size: z.number().min(0.08).max(0.35),
    padding: z.number().min(0).max(4),
    shape: z.enum(LOGO_SHAPES),
    background: hex,
    excavate: z.boolean(),
  }),
  frame: z.object({
    style: z.enum(FRAME_STYLES),
    text: z.string().max(40),
    color: hex,
    textColor: hex,
  }),
}) satisfies z.ZodType<QrDesign>;

export type DesignParseResult =
  { success: true; design: QrDesign } | { success: false; issues: string[] };

/** Merges a partial design onto the defaults and validates the result. */
export function parseDesign(input: unknown, base: QrDesign = DEFAULT_DESIGN): DesignParseResult {
  const result = designSchema.safeParse(mergeDeep(base, input ?? {}));
  if (result.success) return { success: true, design: result.data };
  return {
    success: false,
    issues: result.error.issues.map((i) => `${i.path.join('.') || 'design'}: ${i.message}`),
  };
}
