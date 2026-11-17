import { useId } from 'react';

/** Stable, selector-safe id prefix for gradients inside inline SVGs. */
export function useSvgId(prefix: string): (name: string) => string {
  const base = `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (name) => `${base}-${name}`;
}
