import {
  CONTENT_TYPES,
  CRYPTO_COINS,
  DEFAULT_CONTENT,
  WIFI_ENCRYPTIONS,
  type ContentState,
} from '@/core/content';
import { DEFAULT_DESIGN, mergeDeep, parseDesign, type QrDesign } from '@/core/qr';
import { DESIGN_PRESETS, applyPreset } from '@/features/design/presets';
import { findLogoPreset, presetDataUrl } from '@/features/logo/presets';
import { readStorage, writeStorage } from '@/lib/storage';

import { EXPORT_FORMATS, type Action, type AppConfig, type LogoSelection } from './types';

export const STORAGE_KEY = 'cqg:config:v3';
/** Earlier saves, migrated on first load. */
const LEGACY_KEY = 'cqg:config:v2';
/** Quiet zone for new codes: 2 modules reads reliably and keeps the code compact. */
export const DEFAULT_MARGIN = 2;

/** Placement applied whenever a logo is added to a code that had none. */
export const LOGO_PLACEMENT: Pick<QrDesign['logo'], 'size' | 'padding' | 'shape' | 'excavate'> = {
  size: 0.35,
  padding: 0.25,
  shape: 'none',
  excavate: true,
};

const DEFAULT_LOGO_ID = 'icon:link';

function defaultDesign(): QrDesign {
  const violet = DESIGN_PRESETS.find((p) => p.id === 'violet');
  const link = findLogoPreset(DEFAULT_LOGO_ID);
  const styled = violet ? applyPreset(DEFAULT_DESIGN, violet) : DEFAULT_DESIGN;
  return {
    ...styled,
    errorCorrection: 'H',
    margin: DEFAULT_MARGIN,
    background: { ...styled.background, transparent: true },
    logo: { ...styled.logo, ...LOGO_PLACEMENT, src: link ? presetDataUrl(link) : null },
  };
}

/** First-run setup: a link with the Violet style, transparent background and a link icon. */
export const DEFAULT_CONFIG: AppConfig = {
  content: DEFAULT_CONTENT,
  design: defaultDesign(),
  logo: { kind: 'preset', id: DEFAULT_LOGO_ID, color: null, badgeColor: null },
  flatBrands: true,
  autoStyle: true,
  exportSettings: { format: 'png', size: 1024, fileName: 'qr-code' },
};

export function configReducer(state: AppConfig, action: Action): AppConfig {
  switch (action.type) {
    case 'content/type':
      return { ...state, content: { ...state.content, type: action.contentType } };
    case 'content/update': {
      const { contentType, patch } = action;
      return {
        ...state,
        content: {
          ...state.content,
          values: {
            ...state.content.values,
            [contentType]: { ...state.content.values[contentType], ...patch },
          },
        },
      };
    }
    case 'design/update':
      return { ...state, design: action.update(state.design) };
    case 'logo/set': {
      const level = state.design.errorCorrection;
      // Logos hide modules, so nudge low error correction up to H when one is added.
      const errorCorrection = action.src && (level === 'L' || level === 'M') ? 'H' : level;
      const firstLogo = action.src !== null && state.design.logo.src === null;
      return {
        ...state,
        logo: action.selection,
        design: {
          ...state.design,
          errorCorrection,
          logo: { ...state.design.logo, ...(firstLogo ? LOGO_PLACEMENT : {}), src: action.src },
        },
      };
    }
    case 'logo/flatBrands': {
      const { flat, src } = action;
      return {
        ...state,
        flatBrands: flat,
        design:
          src === undefined
            ? state.design
            : { ...state.design, logo: { ...state.design.logo, src } },
      };
    }
    case 'autoStyle/set':
      return { ...state, autoStyle: action.enabled };
    case 'look/replace':
      return { ...state, design: action.design, logo: action.logo };
    case 'export/update':
      return { ...state, exportSettings: { ...state.exportSettings, ...action.patch } };
    case 'reset':
      return DEFAULT_CONFIG;
  }
}

function hydrateContent(input: unknown): ContentState {
  const merged = mergeDeep(structuredClone(DEFAULT_CONTENT), input);
  const values = merged.values;
  // mergeDeep keeps whatever primitive was stored; coerce anything off-type back to defaults.
  for (const type of CONTENT_TYPES) {
    const defaults = DEFAULT_CONTENT.values[type] as Record<string, unknown>;
    const current = values[type] as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      if (typeof current[key] !== typeof defaults[key]) current[key] = defaults[key];
    }
  }
  if (!CONTENT_TYPES.includes(merged.type)) merged.type = DEFAULT_CONTENT.type;
  if (!WIFI_ENCRYPTIONS.includes(values.wifi.encryption)) values.wifi.encryption = 'WPA';
  if (!CRYPTO_COINS.includes(values.crypto.coin)) values.crypto.coin = 'bitcoin';
  return merged;
}

function hydrateLogo(input: unknown, hasSrc: boolean): LogoSelection {
  if (!hasSrc || typeof input !== 'object' || input === null) return { kind: 'none' };
  const v = input as Record<string, unknown>;
  if (v.kind === 'preset' && typeof v.id === 'string') {
    const hex = (x: unknown) => (typeof x === 'string' ? x : null);
    return { kind: 'preset', id: v.id, color: hex(v.color), badgeColor: hex(v.badgeColor) };
  }
  if (v.kind === 'upload') return { kind: 'upload', name: String(v.name ?? 'logo') };
  return { kind: 'none' };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Restores saved settings, falling back to defaults for anything missing or invalid. */
export function loadConfig(): AppConfig {
  const current = readStorage(STORAGE_KEY);
  const raw = current ?? readStorage(LEGACY_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    const saved = JSON.parse(raw) as Partial<Record<keyof AppConfig, unknown>>;
    // v2 used a 4-module quiet zone by default; move untouched codes to the tighter default.
    if (!current && isRecord(saved.design) && saved.design.margin === 4) {
      saved.design = { ...saved.design, margin: DEFAULT_MARGIN };
    }
    const parsed = parseDesign(saved.design);
    const design = parsed.success ? parsed.design : DEFAULT_DESIGN;
    const exportSettings = mergeDeep(DEFAULT_CONFIG.exportSettings, saved.exportSettings);
    if (!EXPORT_FORMATS.includes(exportSettings.format)) exportSettings.format = 'png';
    return {
      content: hydrateContent(saved.content),
      design,
      logo: hydrateLogo(saved.logo, design.logo.src !== null),
      flatBrands: typeof saved.flatBrands === 'boolean' ? saved.flatBrands : true,
      autoStyle: typeof saved.autoStyle === 'boolean' ? saved.autoStyle : true,
      exportSettings,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  if (!writeStorage(STORAGE_KEY, JSON.stringify(config))) {
    // Large uploaded logos can exceed the quota; keep everything else.
    writeStorage(
      STORAGE_KEY,
      JSON.stringify({
        ...config,
        logo: { kind: 'none' },
        design: { ...config.design, logo: { ...config.design.logo, src: null } },
      }),
    );
  }
}
