import { createContext, useContext } from 'react';

import type { HealthReport, QrMatrix } from '@/core/qr';

export type PreviewResult =
  | {
      ok: true;
      matrix: QrMatrix;
      src: string;
      report: HealthReport;
      bytes: number;
      payload: string;
    }
  | { ok: false; error: string };

export interface PreviewValue {
  result: PreviewResult;
  /** True while a newer edit is still rendering. */
  stale: boolean;
}

export const PreviewContext = createContext<PreviewValue | null>(null);

/** The rendered preview, computed once and shared by every consumer. */
export function usePreview(): PreviewValue {
  const value = useContext(PreviewContext);
  if (!value) throw new Error('usePreview must be used inside <PreviewProvider>');
  return value;
}
