import { useCallback, useState } from 'react';

import { useToast } from '@/components/feedback';
import { usePreview } from '@/features/preview/preview-context';
import { useConfig, type ExportFormat } from '@/state';

import {
  EXTENSION,
  canCopyImage,
  copyPng,
  downloadBlob,
  exportQr,
  sanitizeFileName,
} from './export';

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: 'PNG',
  jpeg: 'JPG',
  webp: 'WebP',
  svg: 'SVG',
};

/** Download and copy actions with toasts, shared by buttons and keyboard shortcuts. */
export function useExportActions() {
  const { config } = useConfig();
  const { result } = usePreview();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { design, exportSettings: settings } = config;
  const ready = result.ok;

  const download = useCallback(async () => {
    if (!result.ok) {
      toast.show({ tone: 'warning', title: 'Nothing to download yet', description: result.error });
      return;
    }
    setBusy(true);
    try {
      const blob = await exportQr(result.matrix, design, settings);
      const name = `${sanitizeFileName(settings.fileName)}.${EXTENSION[settings.format]}`;
      downloadBlob(blob, name);
      toast.show({
        tone: 'success',
        title: `${FORMAT_LABELS[settings.format]} downloaded`,
        description: `${name} · ${Math.max(1, Math.round(blob.size / 1024))} KB`,
      });
    } catch (e) {
      toast.show({
        tone: 'error',
        title: 'Download failed',
        description: e instanceof Error ? e.message : 'Something went wrong while exporting.',
      });
    } finally {
      setBusy(false);
    }
  }, [result, design, settings, toast]);

  const copy = useCallback(async () => {
    if (!result.ok || !canCopyImage()) return;
    try {
      await copyPng(
        exportQr(result.matrix, design, { format: 'png', size: Math.min(settings.size, 2048) }),
      );
      toast.show({ tone: 'success', title: 'Copied!', description: 'Paste the PNG anywhere.' });
    } catch {
      toast.show({
        tone: 'error',
        title: "Couldn't copy",
        description: 'Your browser blocked clipboard access. Try downloading instead.',
      });
    }
  }, [result, design, settings.size, toast]);

  return {
    download,
    copy,
    busy,
    ready,
    canCopy: canCopyImage(),
    formatLabel: FORMAT_LABELS[settings.format],
  };
}
