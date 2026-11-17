import {
  CONTENT_TYPES,
  CRYPTO_COINS,
  DEFAULT_CONTENT,
  WIFI_ENCRYPTIONS,
  type ContentState,
} from '@/core/content';
import { DEFAULT_DESIGN, mergeDeep, parseDesign } from '@/core/qr';
import { readStorage, writeStorage } from '@/lib/storage';

import { EXPORT_FORMATS, type Action, type AppConfig, type LogoSelection } from './types';

export const STORAGE_KEY = 'cqg:config:v1';

export const DEFAULT_CONFIG: AppConfig = {
  content: DEFAULT_CONTENT,
  design: DEFAULT_DESIGN,
  logo: { kind: 'none' },
  exportSettings: { format: 'png', size: 1024, transparent: false, fileName: 'qr-code' },
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
      return {
        ...state,
        logo: action.selection,
        design: {
          ...state.design,
          errorCorrection,
          logo: { ...state.design.logo, src: action.src },
        },
      };
    }
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
    return {
      kind: 'preset',
      id: v.id,
      color: typeof v.color === 'string' ? v.color : null,
      plain: v.plain === true,
    };
  }
  if (v.kind === 'upload') return { kind: 'upload', name: String(v.name ?? 'logo') };
  return { kind: 'none' };
}

/** Restores saved settings, falling back to defaults for anything missing or invalid. */
export function loadConfig(): AppConfig {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    const saved = JSON.parse(raw) as Partial<Record<keyof AppConfig, unknown>>;
    const parsed = parseDesign(saved.design);
    const design = parsed.success ? parsed.design : DEFAULT_DESIGN;
    const exportSettings = mergeDeep(DEFAULT_CONFIG.exportSettings, saved.exportSettings);
    if (!EXPORT_FORMATS.includes(exportSettings.format)) exportSettings.format = 'png';
    return {
      content: hydrateContent(saved.content),
      design,
      logo: hydrateLogo(saved.logo, design.logo.src !== null),
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
