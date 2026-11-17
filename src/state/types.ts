import type { ContentState, ContentType, ContentValues } from '@/core/content';
import type { QrDesign } from '@/core/qr';

export const EXPORT_FORMATS = ['png', 'jpeg', 'webp', 'svg'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface ExportSettings {
  format: ExportFormat;
  /** Output width in pixels for raster formats. */
  size: number;
  transparent: boolean;
  fileName: string;
}

/** Which logo the user picked; the image itself lives in `design.logo.src`. */
export type LogoSelection =
  | { kind: 'none' }
  | { kind: 'preset'; id: string; color: string | null; plain: boolean }
  | { kind: 'upload'; name: string };

export interface AppConfig {
  content: ContentState;
  design: QrDesign;
  logo: LogoSelection;
  exportSettings: ExportSettings;
}

export type Action =
  | { type: 'content/type'; contentType: ContentType }
  | {
      type: 'content/update';
      contentType: ContentType;
      patch: Partial<ContentValues[ContentType]>;
    }
  | { type: 'design/update'; update: (design: QrDesign) => QrDesign }
  | { type: 'logo/set'; selection: LogoSelection; src: string | null }
  | { type: 'export/update'; patch: Partial<ExportSettings> }
  | { type: 'reset' };
