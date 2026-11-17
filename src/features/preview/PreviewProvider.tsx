import { useDeferredValue, useMemo, type ReactNode } from 'react';

import { buildContent } from '@/core/content';
import { assessScannability, encodeMatrix, QrEncodeError, renderMatrixSvg } from '@/core/qr';
import { svgDataUrl } from '@/lib/svg';
import { useConfig } from '@/state';

import { PreviewContext, type PreviewResult } from './preview-context';

/** Renders the live preview off the urgent path (deferred) so typing stays responsive. */
export function PreviewProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig();
  const content = useDeferredValue(config.content);
  const design = useDeferredValue(config.design);
  const stale = content !== config.content || design !== config.design;

  const result = useMemo<PreviewResult>(() => {
    const built = buildContent(content);
    if (built.error) return { ok: false, error: built.error };
    try {
      const matrix = encodeMatrix(built.payload, design.errorCorrection);
      const { svg } = renderMatrixSvg(matrix, design, { width: 680 });
      return {
        ok: true,
        matrix,
        src: svgDataUrl(svg),
        report: assessScannability(matrix, design),
        bytes: new TextEncoder().encode(built.payload).length,
        payload: built.payload,
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof QrEncodeError ? e.message : 'Could not generate the code.',
      };
    }
  }, [content, design]);

  const value = useMemo(() => ({ result, stale }), [result, stale]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}
