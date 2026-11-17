type Plain = Record<string, unknown>;

const isPlain = (v: unknown): v is Plain =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/**
 * Overlays `patch` onto `base`, keeping only keys that exist in `base`. Nested objects are
 * merged recursively; everything else is replaced. Unknown keys are dropped.
 */
export function mergeDeep<T>(base: T, patch: unknown): T {
  if (!isPlain(base) || !isPlain(patch)) return (patch === undefined ? base : patch) as T;
  const out: Plain = { ...base };
  for (const key of Object.keys(base)) {
    if (!(key in patch)) continue;
    const next = patch[key];
    if (next === undefined) continue;
    out[key] = isPlain(base[key]) && isPlain(next) ? mergeDeep(base[key], next) : next;
  }
  return out as T;
}
